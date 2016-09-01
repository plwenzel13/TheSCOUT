cordova.define("maf-cordova-plugin-modern-webview.maf-modern-webview", function(require, exports, module) { /* Copyright (c) 2015, 2016 Oracle and/or its affiliates. All rights reserved. */

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
 
var cordova = require('cordova'),
  channel = require('cordova/channel'),
  utils = require('cordova/utils'),
  base64 = require('cordova/base64'),
  execIframe,
  commandQueue = [], // Contains pending JS->Native messages.
  isInContextOfEvalJs = 0,
  failSafeTimerId = 0;

function massageArgsJsToNative(args) 
{
  if (!args || utils.typeName(args) != 'Array') 
  {
    return args;
  }
  
  var ret = [];
  args.forEach(function(arg, i) 
  {
    if (utils.typeName(arg) == 'ArrayBuffer') 
    {
      ret.push( {'CDVType': 'ArrayBuffer', 'data': base64.fromArrayBuffer(arg)} );
    } 
    else 
    {
      ret.push(arg);
    }
  });
  return ret;
}

function massageMessageNativeToJs(message) 
{
  if (message.CDVType == 'ArrayBuffer') 
  {
    var stringToArrayBuffer = function(str) 
    {            
      var ret = new Uint8Array(str.length);
      for (var i = 0; i < str.length; i++) 
      {
        ret[i] = str.charCodeAt(i);
      }
      return ret.buffer;
    };

    var base64ToArrayBuffer = function(b64) {
      return stringToArrayBuffer(atob(b64));
    };
    message = base64ToArrayBuffer(message.data);
  }
  return message;
}

function convertMessageToArgsNativeToJs(message) 
{
  var args = [];
  if (!message || !message.hasOwnProperty('CDVType')) 
  {
     args.push(message);
  } 
  else if (message.CDVType == 'MultiPart') 
  {
    message.messages.forEach(function(e) 
    {
      args.push(massageMessageNativeToJs(e));
    });
  } 
  else 
  {
    args.push(massageMessageNativeToJs(message));
  }
  return args;
}

var iOSExec = function() {
    
    var successCallback, failCallback, service, action, actionArgs, splitCommand;
    var callbackId = null;
    if (typeof arguments[0] !== "string") {
        // FORMAT ONE
        successCallback = arguments[0];
        failCallback = arguments[1];
        service = arguments[2];
        action = arguments[3];
        actionArgs = arguments[4];
        
        // Since we need to maintain backwards compatibility, we have to pass
        // an invalid callbackId even if no callback was provided since plugins
        // will be expecting it. The Cordova.exec() implementation allocates
        // an invalid callbackId and passes it even if no callbacks were given.
        callbackId = 'INVALID';
    } else {
        throw new Error('The old format of this exec call has been removed (deprecated since 2.1). Change to: ' +
                        'cordova.exec(null, null, \'Service\', \'action\', [ arg1, arg2 ]);');
    }
    
    // If actionArgs is not provided, default to an empty array
    actionArgs = actionArgs || [];
    
    // Register the callbacks and add the callbackId to the positional
    // arguments if given.
    if (successCallback || failCallback) {
        callbackId = service + cordova.callbackId++;
        cordova.callbacks[callbackId] =
        {success:successCallback, fail:failCallback};
    }
    
    actionArgs = massageArgsJsToNative(actionArgs);
    
    // CB-10133 DataClone DOM Exception 25 guard (fast function remover)
    var command = [callbackId, service, action, JSON.parse(JSON.stringify(actionArgs))];
    
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.mafCordova)
    {
        // WKWebView -- use preferred mechanism
        window.webkit.messageHandlers.mafCordova.postMessage(command);
    }
    else
    {
        // UIWebView -- use the gap:// url scheme
        // Stringify and queue the command. We stringify to command now to
        // effectively clone the command arguments in case they are mutated before
        // the command is executed.
        commandQueue.push(JSON.stringify(command));
        
        // If we're in the context of a stringByEvaluatingJavaScriptFromString call,
        // then the queue will be flushed when it returns; no need for a poke.
        // Also, if there is already a command in the queue, then we've already
        // poked the native side, so there is no reason to do so again.
        if (!isInContextOfEvalJs && commandQueue.length == 1) 
        {
          pokeNative();
        }
    }
};

// UIWebView only
function pokeNative() 
{
  // CB-5488 - Don't attempt to create iframe before document.body is available.
  if (!document.body) 
  {
    setTimeout(pokeNative);
    return;
  }
  
  // Check if they've removed it from the DOM, and put it back if so.
  if (execIframe && execIframe.contentWindow) 
  {
    execIframe.contentWindow.location = 'gap://ready';
  } 
  else 
  {
    execIframe = document.createElement('iframe');
    execIframe.style.display = 'none';
    execIframe.src = 'gap://ready';
    document.body.appendChild(execIframe);
  }
  // Use a timer to protect against iframe being unloaded during the poke (CB-7735).
  // This makes the bridge ~ 7% slower, but works around the poke getting lost
  // when the iframe is removed from the DOM.
  // An onunload listener could be used in the case where the iframe has just been
  // created, but since unload events fire only once, it doesn't work in the normal
  // case of iframe reuse (where unload will have already fired due to the attempted
  // navigation of the page).
  failSafeTimerId = setTimeout(function() 
  {
    if (commandQueue.length) 
    {
      pokeNative();
    }
  }, 50); // Making this > 0 improves performance (marginally) in the normal case (where it doesn't fire).
};

iOSExec.nativeCallback = function(callbackId, status, message, keepCallback, debug) 
{
    
  var success = status === 0 || status === 1;
  var args = convertMessageToArgsNativeToJs(message);
  
  if (window.webkit)
  {
      setTimeout(function() 
      { 
        cordova.callbackFromNative(callbackId, success, status, args, keepCallback);
      }, 0);
  }
  else
  {
    return iOSExec.nativeEvalAndFetch(function() 
    {
      function nc2() 
      {
        cordova.callbackFromNative(callbackId, success, status, args, keepCallback);
      }
      setTimeout(nc2, 0);
    });
  }
};

// UIWebView only
iOSExec.nativeFetchMessages = function() 
{
  // Stop listing for window detatch once native side confirms poke.
  if (failSafeTimerId) 
  {
      clearTimeout(failSafeTimerId);
      failSafeTimerId = 0;
  }
  // Each entry in commandQueue is a JSON string already.
  if (!commandQueue.length) 
  {
      return '';
  }
  var json = '[' + commandQueue.join(',') + ']';
  commandQueue.length = 0;
  return json;
};

// UIWebView only
iOSExec.nativeEvalAndFetch = function(func) 
{
  // This shouldn't be nested, but better to be safe.
  isInContextOfEvalJs++;
  try 
  {
    func();
    return iOSExec.nativeFetchMessages();
  } 
  finally 
  {
      isInContextOfEvalJs--;
  }
};

// Proxy the exec for bridge changes. See CB-10106
function cordovaExec() 
{
    var cexec = require('cordova/exec');
    var cexec_valid = (typeof cexec.nativeFetchMessages === 'function') && 
      (typeof cexec.nativeEvalAndFetch === 'function') && 
      (typeof cexec.nativeCallback === 'function');
      
    return (cexec_valid && execProxy !== cexec)? cexec : iOSExec;
}

function execProxy() 
{
    cordovaExec().apply(null, arguments);
}

execProxy.nativeFetchMessages = function() 
{
    return cordovaExec().nativeFetchMessages.apply(null, arguments);
};

execProxy.nativeEvalAndFetch = function() 
{
    return cordovaExec().nativeEvalAndFetch.apply(null, arguments);
};

execProxy.nativeCallback = function() 
{
    return cordovaExec().nativeCallback.apply(null, arguments);
};

// rewrite console.log on UIWebView.  Handled automatically by user script on WKWebView
if (!window.webkit)
{
  var orig = window.console.log;
  console.log = function()
  {
    var args = [].slice.call(arguments);
    try
    {
     orig.apply(window.console, args);
    }
    catch (e) 
    {      
    }
    
    try
    {
     cordova.exec(null, null, "MafLoggerPlugin", "consoleLog", args);
    }
    catch (e) 
    {      
    }
  }
}

module.exports = execProxy;
// unregister the old bridge
cordova.define.remove('cordova/exec');
// redefine bridge to our new bridge
cordova.define("cordova/exec", function(require, exports, module) {
  module.exports = execProxy;
});

});
