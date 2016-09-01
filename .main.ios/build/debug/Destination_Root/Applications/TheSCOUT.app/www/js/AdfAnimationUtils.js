/*
** Copyright (c) 2013, 2015, Oracle and/or its affiliates. All rights reserved.
** Important:
** - This file is designed to be shared verbatim among the ADFui products.
** - Do not add framework-specific dependencies in this file (it must be self-contained).
** - Do not change this file without testing it in other ADFui products (ADF Faces, ADF Mobile, etc.).
*/
if (!window.adf) {
  /**
   * @expose
   * @namespace adf
   */
  window.adf = {}
};

/** @namespace */
adf.shared = adf.shared || {};

/** @namespace */
adf.shared.impl = adf.shared.impl || {}; // ONLY IMPL FOR NOW, CONSIDER PROMOTING TO API IN FUTURE

/** @namespace */
adf.shared.impl.animationUtils = new Object(); // must be explicitly assigned to the window.adf.shared.impl object for cross-framework sharing

/** @private */
adf.shared.impl.animationUtils._browserSpecificNames = {};

// ======================= AnimationUtils Internal APIs =======================

/**
 * Perform a transition animation between 2 elements.
 * - Requirements and prerequisites for calling this function:
 * <ul>
 * <li>The 2 elements must be siblings,
 * <li>Your finishedFunction is responsible for firing trigger resize notifications if applicable,
 * <li>Your finishedFunction is responsible for cleaning up objects associated with and removing the old currentElement,
 * <li>The provided elements must not be using display:none.
 * </ul>
 * When this animation is complete, the currentElement will get display:none and there may be other styles added.
 * If desirable, you may want to save off the styles for restoration if you are not discarding the element in your
 * finished function.
 * @param {string} transitionType the type of transition desired (fade, flipUp, flipDown, flipStart, flipEnd,
 *                                slideUp, slideDown, slideStart, slideEnd, or none)
 * @param {HTMLElement} currentElement the DOM element to be replaced or null if not applicable
 * @param {HTMLElement} newElement the DOM element that will remain or null if not applicable
 * @param {Object} properties a map of properties for the animation:
 * <ul>
 * <li>"dimensionsFromParent" boolean whether dimensions are from the parent (stretching layout structure)
 * <li>"finishedFunction" an optional function to invoke once the animation is completed
 * <li>"callbackParams" an object that will be passed into the finishedFunction or returned from the cancel function
 * <li>"animationEnabled" boolean whether animation should be disabled
 * <li>"isRtl" boolean whether the reading direction is right-to-left
 * <li>"fineLogger" a logger function that will be used for fine-level messages
 * <li>"parentFlipAllowed" boolean whether the parent of the new/current elements can be flipped for an inset effect (gives a flip effect without worry about truncation); In order to do the inset flip, we have to be able to flip the parent element. We need special permission for that because:
 *   <ul>
 *   <li>There might be other elements inside of that parent that (if visible to the user)
 *       would be flipped which may not be desirable.
 *   <li>We cannot create a new temporary parent element on the fly either because we would
 *       then lose scroll positions on all scrollable containers within the subtrees of those
 *       flipped elements.
 *   <li>The parent and grandparent elements must have the same dimensions;
 *       if we applied the perspective to the grandparent (parent of the common ancestor),
 *       then the dimensions of the parent element would not be respected when the rotations
 *       are applied; you'd see the elements flip outside of the dimensions of the parent element.
 *   </ul>
 * </ul>
 * @return {function} function to invoke if you want to cancel an animation that is currently in progress
 */
adf.shared.impl.animationUtils.transition = function(
  transitionType,
  currentElement,
  newElement,
  properties)
{
  var dimensionsFromParent = properties["dimensionsFromParent"];
  var finishedFunction = properties["finishedFunction"];
  var callbackParams = properties["callbackParams"];
  var animationEnabled = properties["animationEnabled"];
  var isRtl = properties["isRtl"];
  var fineLogger = properties["fineLogger"];
  var hasCurrent = currentElement != null;
  var hasNew = newElement != null;
  var animationUtils    = adf.shared.impl.animationUtils;
  var animationContext  = new animationUtils.AnimationContext(finishedFunction, callbackParams);
  var cancelFunction    = function() {};
  animationUtils._isRtl = isRtl;
  animationUtils._fineLogger = fineLogger;

  if (animationUtils._agentTypeAndVersion == null)
  {
    // Do a 1-time agent initialization
    animationUtils._agentTypeAndVersion = animationUtils._getAgentTypeAndVersion(navigator.userAgent);
  }

  try
  {
    // If any of the prerequisities are violated, do not attempt a transition:
    var nothingToAnimate = false;
    if (!hasCurrent && !hasNew)
      nothingToAnimate = true; // no elements to animate
    else if (hasCurrent && hasNew && currentElement.parentNode != newElement.parentNode)
    {
      nothingToAnimate = true; // common parent prerequisite was violated
      animationUtils._fineLogger("AdfAnimationUtils: transition common parent prerequisite was violated");
    }
    if (hasCurrent && currentElement.style.display == "none")
    {
      nothingToAnimate = true; // display != none was violated
      animationUtils._fineLogger("AdfAnimationUtils: transition currentElement display != none prerequisite was violated");
    }
    if (hasNew && newElement.style.display == "none")
    {
      nothingToAnimate = true; // display != none was violated
      animationUtils._fineLogger("AdfAnimationUtils: transition newElement display != none prerequisite was violated");
    }
    if (nothingToAnimate)
    {
      if (finishedFunction != null)
        adf.shared.impl.animationUtils._requestAnimationFrame(
          animationUtils.getProxyFunction(animationContext, animationContext._performFinish));

      return cancelFunction; // do not attempt a transition
    }

    if (!animationEnabled)
    {
      transitionType = "none";
    }

    var transitionFunction = null;
    var direction = null;
    var sendCurrent = true;
    var sendNew = true;

    if (transitionType != null) // default to "none"
    {
      var agentType = animationUtils._agentTypeAndVersion[0];
      var agentVersion = animationUtils._agentTypeAndVersion[1];

      if (transitionType.indexOf("slide") == 0 &&
        animationUtils._isMinimumAgentMet(agentType, agentVersion, "gecko", 16, "trident", 6, "webkit", 533.1))
      {
        // Requires: Firefox 16, IE 10, Safari 5/Chrome 5/Android 2.3
        direction = transitionType.substring(5).toLowerCase();
        transitionFunction = animationUtils._slide;
      }
      else if (transitionType.indexOf("flip") == 0 &&
        animationUtils._isMinimumAgentMet(agentType, agentVersion, "gecko", 19, "trident", 6, "webkit", 533.1))
      {
        // Requires: Firefox 19, IE 10, Safari 5/Chrome 5/Android 2.3
        direction = transitionType.substring(4).toLowerCase();
        transitionFunction = animationUtils._flip;
      }
      else if (transitionType == "fade" &&
        animationUtils._isMinimumAgentMet(agentType, agentVersion, "gecko", 16, "trident", 6, "webkit", 533.1))
      {
        // Requires: Firefox 16, IE 10, Safari 5/Chrome 5/Android 2.3
        transitionFunction = animationUtils._fade;
      }
      else if (transitionType.indexOf("cover") == 0 &&
        animationUtils._isMinimumAgentMet(agentType, agentVersion, "gecko", 16, "trident", 6, "webkit", 533.1))
      {
        // Requires: Firefox 16, IE 10, Safari 5/Chrome 5/Android 2.3
        direction = transitionType.substring(5).toLowerCase();
        // reuse slide animation to animate cover eff
        transitionFunction = animationUtils._slide;
        if (hasNew)
        {
          // only slide new incomming div
          sendCurrent = false;
        }
      }
      else if (transitionType.indexOf("reveal") == 0 &&
        animationUtils._isMinimumAgentMet(agentType, agentVersion, "gecko", 16, "trident", 6, "webkit", 533.1))
      {
        // Requires: Firefox 16, IE 10, Safari 5/Chrome 5/Android 2.3
        direction = transitionType.substring(6).toLowerCase();
        transitionFunction = animationUtils._slide;
        if (hasCurrent)
        {
          // only slide old div out
          sendNew = false;
          // keep current element always on top
          properties["currentOnTop"] = true;
        }
      }
    }

    if (direction == "")
      direction = "start";

    if (transitionFunction == null ||
      ((hasCurrent && !currentElement.addEventListener) || (hasNew && !newElement.addEventListener)))
    {
      // There was no transition specified or this browser doesn't support it, just hide the currentElement:
      animationUtils._restoreStyles(currentElement);
      animationUtils._restoreStyles(newElement);
      if (hasCurrent)
        currentElement.style.display = "none";

      // let the control proceed and immediately after invoke finish since there was nothing to animate
      adf.shared.impl.animationUtils._requestAnimationFrame(
        animationUtils.getProxyFunction(animationContext, animationContext._performFinish));
    }
    else // we can do an animation
    {
      if (hasCurrent && hasNew && !dimensionsFromParent)
      {
        // Add some styles to compensate for it so currentElement won't be pushed down by the newElement when dimensionsFrom == "children":
        var currentElementStyle = currentElement.style;
        var currentWidth = currentElement.offsetWidth;
        var currentHeight = currentElement.offsetHeight;
        currentElementStyle.position = "absolute";
        currentElementStyle.top = "0px";
        currentElementStyle.width = currentWidth + "px";
        currentElementStyle.height = currentHeight + "px";
      }

      if (sendCurrent === false)
      {
        currentElement = null;
      }

      if (sendNew === false)
      {
        newElement = null;
      }

      cancelFunction = transitionFunction(animationContext, currentElement, newElement, properties, dimensionsFromParent, direction);
    }
  }
  catch (problem)
  {
    // Should not get here but in case we do, log the problem:
    animationUtils._fineLogger("AdfAnimationUtils: unable to perform transition due to problem:");
    animationUtils._fineLogger(problem);
  }

  return cancelFunction;
};

/**
 * Creates a function instance that will call back the passed in function with the specified owner as the "this" variable.
 * @param {Object} owner the proxy owner of the proxied function (exposed via the "this" variable inside the function)
 * @param {function} func the function to proxy
 * @return {function} the proxied function
 */
adf.shared.impl.animationUtils.getProxyFunction = function(owner, func)
{
  // create a function that sets up "this" and delegates all of the parameters
  // to the passed in function
  var proxyFunction = new Function(
    "var f=arguments.callee; return f._func.apply(f._owner, arguments);");

  // attach ourselves as "this" to the created function
  proxyFunction["_owner"] = owner;

  // attach function to delegate to
  proxyFunction["_func"] = func;

  return proxyFunction;
};

/**
 * Since a transition end event will not be triggered when an element is
 * hidden, use this API to add the one-time listener with a fallback
 * invocation if the event doesn't happen within a set time.
 * @param {HTMLElement} transitioningElement the DOM element that is transitioning
 * @param {function} callback the function (zero parameters) to invoke
 */
adf.shared.impl.animationUtils.addOneTimeTransitionEndWithFailsafe = function(
  transitioningElement,
  callback)
{
  if (transitioningElement != null && callback != null)
  {
    var transitionEndEventName =
      adf.shared.impl.animationUtils._getTransitionEndEventName();
    var context = {
      "timerId": null,
      "handler": null,
      "handled": false
    };

    // Define the handler for either the transitionend or failsafe:
    context["handler"] =
      function()
      {
        try
        {
          if (!context["handled"])
          {
            // This was the first time the handler was invoked so mark it as
            // handled and then invoke the callback:
            context["handled"] = true;
            callback();
          }
        }
        finally
        {
          // Unregister the listener and clear the timeout:
          transitioningElement.removeEventListener(
            transitionEndEventName,
            context["handler"],
            true);
          window.clearTimeout(context["handler"]);
        }
      };

    // Register the listener and add the timeout:
    transitioningElement.addEventListener(
      transitionEndEventName,
      context["handler"],
      true);
    context["timerId"] = window.setTimeout(context["handler"], 1000);
  }
};

// ======================= priavte transition functions =======================

/**
 * Perform a fade animation between 2 sibling elements.
 * @param {Object} animationContext the animation context
 * @param {HTMLElement} currentElement the DOM element to be replaced
 * @param {HTMLElement} newElement the DOM element that will remain
 * @param {Object} properties a map of properties for the animation
 * @param {boolean} dimensionsFromParent whether dimensions are from the parent (stretching layout structure)
 * @param {string} direction the direction of the animation
 * @private
 */
adf.shared.impl.animationUtils._fade = function(animationContext, currentElement, newElement, properties, dimensionsFromParent, direction)
{
  var animationUtils = adf.shared.impl.animationUtils;
  var hasCurrent = currentElement != null;
  var hasNew = newElement != null;
  if (hasCurrent)
  {
    animationUtils._setOpacity(currentElement, "1");
  }
  if (hasNew)
  {
    animationUtils._saveStyles(newElement);
    animationUtils._setOpacity(newElement, "0");
    newElement.style.zIndex = "1";
    adf.shared.impl.animationUtils._ensureAppliedStyle(newElement, "opacity", 1);
  }

  // let the screen paint the initial state, then animate to the new state
  adf.shared.impl.animationUtils._requestAnimationFrame(function()
  {
    if (hasCurrent)
      animationUtils._setTransition(currentElement, "all .2s ease-in-out");
    if (hasNew)
      animationUtils._setTransition(newElement, "all .2s ease-in-out");

    if (hasCurrent)
    {
      animationContext.addTransitionEndA(currentElement, function()
      {
        currentElement.style.display = "none";
      });
    }

    if (hasNew)
    {
      animationContext.addTransitionEndB(newElement, function()
      {
        animationUtils._restoreStyles(newElement);
      });
    }

    if (hasCurrent)
      animationUtils._setOpacity(currentElement, "0");
    if (hasNew)
      animationUtils._setOpacity(newElement, "1");
  });

  return animationUtils.getProxyFunction(animationContext, animationContext.cancelFunction);
};

/**
 * Perform a slide animation between 2 sibling elements.
 * @param {Object} animationContext the animation context
 * @param {HTMLElement} currentElement the DOM element to be replaced
 * @param {HTMLElement} newElement the DOM element that will remain
 * @param {Object} properties a map of properties for the animation
 * @param {boolean} dimensionsFromParent whether dimensions are from the parent (stretching layout structure)
 * @param {string} direction the direction of the animation
 * @private
 */
adf.shared.impl.animationUtils._slide = function(animationContext, currentElement, newElement, properties, dimensionsFromParent, direction)
{
  var animationUtils = adf.shared.impl.animationUtils;
  var hasCurrent = currentElement != null;
  var hasNew = newElement != null;
  var parentElement = null;
  if (hasCurrent)
  {
    parentElement = currentElement.parentNode;
  }
  else if (hasNew)
  {
    parentElement = newElement.parentNode;
  }
  if (hasNew)
  {
    animationUtils._saveStyles(newElement);
  }
  if (hasCurrent)
  {
    animationUtils._saveStyles(currentElement);
  }

  var vertical = false; // whether we move along the y-axis (true) or x-axis (false)
  var back = false; // the code below is written in one direction, this toggles whether we reverse the direction

  if (direction == "up" || direction == "down")
  {
    vertical = true;
  }

  if (direction == "right" || direction == "down")
  {
    back = true;
  }

  if (animationUtils._isRtl)
  {
    if (direction == "start")
    {
      back = true;
    }
  }
  else // ltr
  {
    if (direction == "end")
    {
      back = true;
    }
  }

  // Use fading of the current element if in flowing mode for a better effect.
  // When stretching, this fading effect is not as desirable so don't use it in that case.
  var fadeCurrent = !dimensionsFromParent;

  // We have to also apply opacity in case the viewport does not truncate:
  if (hasCurrent && fadeCurrent)
  {
    animationUtils._setOpacity(currentElement, "1");
  }
  // set z-index to the currentElement to keep it always on above the new element
  // this properties will be erased on the animation end
  if (hasCurrent && properties["currentOnTop"])
  {
    currentElement.style.zIndex = 10;
  }
  var translateDistance, size, offsetShift;
  var offsetProperty = vertical ? "offsetHeight" : "offsetWidth";
  if (back) // down or right
  {
    // We want to move down the distance of the new element if present
    if (hasNew)
      size = newElement[offsetProperty];
    else // must hasCurrent
      size = currentElement[offsetProperty];
  }
  else // up or left
  {
    // We want to move up the distance of the old element if present
    if (hasCurrent)
      size = currentElement[offsetProperty];
    else // must hasNew
      size = newElement[offsetProperty];
  }
  offsetShift = back ? (-1) * size : size;
  translateDistance = offsetShift * -1;
  if (hasNew)
  {
    if (vertical)
      animationUtils._setTransformTranslate(newElement, "0," + offsetShift + "px");
    else
      animationUtils._setTransformTranslate(newElement, offsetShift + "px,0");
    var transformProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("transform");
    adf.shared.impl.animationUtils._ensureAppliedStyle(newElement, transformProperty, "none");
  }

  // let the screen paint the initial state, then animate to the new state
  adf.shared.impl.animationUtils._requestAnimationFrame(function()
  {
    if (hasCurrent)
      animationUtils._setTransition(currentElement, "all 125ms ease-in-out");
    if (hasNew)
      animationUtils._setTransition(newElement, "all 125ms ease-in-out");

    if (hasCurrent)
    {
      animationContext.addTransitionEndA(currentElement, function()
      {
        animationUtils._restoreStyles(currentElement);
        currentElement.style.display = "none";
      });
    }

    if (hasNew)
    {
      animationContext.addTransitionEndB(newElement, function()
      {
        animationUtils._restoreStyles(newElement);
      });
    }

    // Animate the translated distance:
    if (vertical)
    {
      if (hasCurrent)
        animationUtils._setTransformTranslate(currentElement, "0," + translateDistance + "px");
      if (hasNew)
        animationUtils._setTransformTranslate(newElement, "0,0");
    }
    else
    {
      if (hasCurrent)
        animationUtils._setTransformTranslate(currentElement, translateDistance + "px,0");
      if (hasNew)
        animationUtils._setTransformTranslate(newElement, "0,0");
    }

    // Animate the opacity:
    if (hasCurrent && fadeCurrent)
      animationUtils._setOpacity(currentElement, "0");
  });

  return animationUtils.getProxyFunction(animationContext, animationContext.cancelFunction);
};

/**
 * Perform a flip animation between 2 sibling elements.
 * @param {Object} animationContext the animation context
 * @param {HTMLElement} currentElement the DOM element to be replaced
 * @param {HTMLElement} newElement the DOM element that will remain
 * @param {Object} properties a map of properties for the animation
 * @param {boolean} dimensionsFromParent whether dimensions are from the parent (stretching layout structure)
 * @param {string} direction the direction of the animation
 * @private
 */
adf.shared.impl.animationUtils._flip = function(animationContext, currentElement, newElement, properties, dimensionsFromParent, direction)
{
  var animationUtils = adf.shared.impl.animationUtils;
  var hasCurrent = currentElement != null;
  var hasNew = newElement != null;
  var parentElement = null;
  if (hasCurrent)
    parentElement = currentElement.parentNode;
  else if (hasNew)
    parentElement = newElement.parentNode;
  if (hasCurrent)
    animationUtils._saveStyles(currentElement);
  if (hasNew)
    animationUtils._saveStyles(newElement);
  animationUtils._saveStyles(parentElement);
  var vertical = false; // whether we flip up/down about the x-axis (true) or left/right about the y-axis (false)
  var back = false; // the code below is written in one direction, this toggles whether we reverse the direction

  if (direction == "up" || direction == "down")
    vertical = true;

  if (direction == "right" || direction == "up")
    back = true;

  if (animationUtils._isRtl)
  {
    if (direction == "start")
      back = true;
  }
  else // ltr
  {
    if (direction == "end")
      back = true;
  }

  // Ideally we want to perform an inset flip rather than a flip on the plane of the page so that
  // there wouldn't be any potential for undesirable truncation when the content flips toward the
  // user
  // There are several considerations that may prevent an inset flip from being used:
  // 1.) Internet Explorer 10 doesn't support nested 3D transforms so it will have to use the
  //     less-than ideal flipping on the plane of the page implementation.
  // 2.) In order to do the inset flip, we have to be able to flip the parent element. We need
  //     special permission for that because:
  //     a.) There might be other elements inside of that parent that (if visible to the user)
  //         would be flipped which may not be desirable.
  //     b.) We cannot create a new temporary parent element on the fly either because we would
  //         then lose scroll positions on all scrollable containers within the subtrees of those
  //         flipped elements.
  //     c.) The parent and grandparent elements must have the same dimensions:
  //         If we applied the perspective to the grandparent (parent of the common ancestor),
  //         then the dimensions of the parent element would not be respected when the rotations
  //         are applied; you'd see the elements flip outside of the dimensions of the parent element.
  var agentType = animationUtils._agentTypeAndVersion[0];
  var doInsetFlip = (true == properties["parentFlipAllowed"] && "trident" != agentType);
  if ("webkit" == agentType && 534.3 > animationUtils._agentTypeAndVersion[1]) // Android 4.1.1 == 534.3
    doInsetFlip = false; // old versions of WebKit cannot handle it

  if (doInsetFlip)
    animationUtils._flipInset(
      animationContext, animationUtils, currentElement, hasCurrent, newElement, hasNew, parentElement, vertical, back, dimensionsFromParent);
  else // fallback to safest flip
    animationUtils._flipOnPageLayer(
      animationContext, animationUtils, currentElement, hasCurrent, newElement, hasNew, parentElement, vertical, back);

  return animationUtils.getProxyFunction(animationContext, animationContext.cancelFunction);
};

/**
 * Helper for the _flip transition that performs the less-than ideal (but simpler) flip transition.
 * @private
 */
adf.shared.impl.animationUtils._flipOnPageLayer = function(
  animationContext, animationUtils, currentElement, hasCurrent, newElement, hasNew, parentElement, vertical, back)
{
  // We want matching dimensions for a smooth flip:
  var offsetWidth = 0;
  var offsetHeight = 0;
  if (hasNew)
  {
    offsetWidth = newElement.offsetWidth;
    offsetHeight = newElement.offsetHeight;
  }
  if (hasCurrent)
  {
    offsetWidth = Math.max(offsetWidth, currentElement.offsetWidth);
    offsetHeight = Math.max(offsetHeight, currentElement.offsetHeight);
  }
  if (hasNew)
  {
    animationUtils._setBackfaceVisibility(newElement, "hidden");
    animationUtils._setTransformStyle(newElement, "preserve-3d");
    newElement.style.width = offsetWidth + "px";
    newElement.style.height = offsetHeight + "px";
    if (vertical)
      animationUtils._setTransformRotateX(newElement, (back?"-180deg":"180deg"));
    else
      animationUtils._setTransformRotateY(newElement, (back?"-180deg":"180deg"));
    var transformProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("transform");
    adf.shared.impl.animationUtils._ensureAppliedStyle(newElement, transformProperty, "none");
  }
  if (hasCurrent)
  {
    animationUtils._setBackfaceVisibility(currentElement, "hidden");
    animationUtils._setTransformStyle(currentElement, "preserve-3d");
    currentElement.style.width = offsetWidth + "px";
    currentElement.style.height = offsetHeight + "px";
    if (vertical)
      animationUtils._setTransformRotateX(currentElement, "0deg");
    else
      animationUtils._setTransformRotateY(currentElement, "0deg");
  }

  var agentType = adf.shared.impl.animationUtils._agentTypeAndVersion[0];
  var agentVersion = adf.shared.impl.animationUtils._agentTypeAndVersion[1];
  if ("webkit" == agentType)
  {
    // Older versions of the Android browser cannot handle perspective flipping
    if ("webkit" == agentType && 534.3 <= agentVersion) // Android 4.1.1 == 534.3
    {
      var perspectiveProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("perspective");
      parentElement.style[perspectiveProperty] = "2000px";
    }
  }
  else if ("trident" != agentType) // inhibit for IE since IE10 doesn't support it properly
    parentElement.style.perspective = "2000px";

  // let the screen paint the initial state, then animate to the new state
  adf.shared.impl.animationUtils._requestAnimationFrame(function()
  {
    if (hasCurrent)
      animationUtils._setTransition(currentElement, "all .2s ease-in-out");
    if (hasNew)
      animationUtils._setTransition(newElement, "all .2s ease-in-out");

    if (hasCurrent)
    {
      animationContext.addTransitionEndA(currentElement, function()
      {
        currentElement.style.display = "none";
        animationUtils._restoreStyles(currentElement);
        animationUtils._restoreStyles(parentElement);
      });
    }

    if (hasNew)
    {
      animationContext.addTransitionEndB(newElement, function()
      {
        animationUtils._restoreStyles(newElement);
        animationUtils._restoreStyles(parentElement);
      });
    }

    if (vertical)
    {
      if (hasCurrent)
        animationUtils._setTransformRotateX(currentElement, (back?"180deg":"-180deg"));
      if (hasNew)
        animationUtils._setTransformRotateX(newElement, "0deg");
    }
    else
    {
      if (hasCurrent)
        animationUtils._setTransformRotateY(currentElement, (back?"180deg":"-180deg"));
      if (hasNew)
        animationUtils._setTransformRotateY(newElement, "0deg");
    }
  });
};

/**
 * Helper for the _flip transition that performs the more desirable (but more complicated) flip transition.
 * @private
 */
adf.shared.impl.animationUtils._flipInset = function(
  animationContext, animationUtils, currentElement, hasCurrent, newElement, hasNew, parentElement, vertical, back, dimensionsFromParent)
{
  // This kind of flip requires an extra layer of DOM elements:
  // - the parent will be flipping so no other siblings should be present
  // - the parent flips within perspective of the grandparent so parent and grandparent should share equal dimensions
  var grandparentElement = parentElement.parentNode;
  animationContext.addExtraCancelFunction(function()
  {
    // Restore the 2 children back into the "grandparent" and purge the "parent"
    animationUtils._flipInsetExtraCancel(currentElement, hasCurrent, newElement, hasNew, parentElement, grandparentElement);
  });

  animationUtils._saveStyles(grandparentElement);
  var perspectiveProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("perspective");
  grandparentElement.style[perspectiveProperty] = "2000px";

  // The parent needs preserve-3d because we are nesting rotations:
  animationUtils._setTransformStyle(parentElement, "preserve-3d");

  // We want matching dimensions among the children for a smooth flip.
  // The new element starts on the reverse side so we need to rotate it.
  var offsetWidth = 0;
  var offsetHeight = 0;
  if (hasNew)
  {
    offsetWidth = newElement.offsetWidth;
    offsetHeight = newElement.offsetHeight;
  }
  if (hasCurrent)
  {
    offsetWidth = Math.max(offsetWidth, currentElement.offsetWidth);
    offsetHeight = Math.max(offsetHeight, currentElement.offsetHeight);
  }
  if (hasNew)
  {
    animationUtils._setBackfaceVisibility(newElement, "hidden");
    newElement.style.width = offsetWidth + "px";
    newElement.style.height = offsetHeight + "px";
    if (vertical)
      animationUtils._setTransformValue(newElement, "perspective(2000px) rotateX(" + (back?"180deg":"-180deg") + ")");
    else
      animationUtils._setTransformValue(newElement, "perspective(2000px) rotateY(" + (back?"-180deg":"180deg") + ")");
    var transformProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("transform");
    adf.shared.impl.animationUtils._ensureAppliedStyle(newElement, transformProperty, "none");
  }
  if (hasCurrent)
  {
    animationUtils._setBackfaceVisibility(currentElement, "hidden");
    currentElement.style.width = offsetWidth + "px";
    currentElement.style.height = offsetHeight + "px";
    if (vertical)
      animationUtils._setTransformValue(currentElement, "perspective(2000px) rotateX(0deg)");
    else
      animationUtils._setTransformValue(currentElement, "perspective(2000px) rotateY(0deg)");
  }

  // In order to produce an inset flip, we need to change the transform origin, later we will also translate
  if (vertical)
    animationUtils._setTransformOrigin(parentElement, (back?"center bottom":"center top"));
  else
    animationUtils._setTransformOrigin(parentElement, (back?"left center":"right center"));

  // let the screen paint the initial state, then animate to the new state
  adf.shared.impl.animationUtils._requestAnimationFrame(function()
  {
    animationUtils._setTransition(parentElement, "all .2s ease-in-out");

    animationContext.addTransitionEndA(parentElement, function()
    {
      if (hasCurrent)
      {
        animationUtils._restoreStyles(currentElement);
        currentElement.style.display = "none";
      }
      if (hasNew)
        animationUtils._restoreStyles(newElement);

      // Restore the 2 children back into the "grandparent" and purge the "parent"
      animationUtils._flipInsetExtraCancel(currentElement, hasCurrent, newElement, hasNew, parentElement, grandparentElement);
    });

    if (vertical)
      animationUtils._setTransformValue(
        parentElement,
        "perspective(2000px) " + (back?"translateY(-100%) rotateX(180deg)":"translateY(100%) rotateX(-180deg)"));
    else
      animationUtils._setTransformValue(
        parentElement,
        "perspective(2000px) " + (back?"translateX(100%) rotateY(180deg)":"translateX(-100%) rotateY(-180deg)"));
  });
};

/**
 * Restore the styles of the "grandparent" and "parent" elements.
 * @private
 */
adf.shared.impl.animationUtils._flipInsetExtraCancel = function(
  currentElement, hasCurrent, newElement, hasNew, parentElement, grandparentElement)
{
  var animationUtils = adf.shared.impl.animationUtils;
  animationUtils._restoreStyles(parentElement);
  animationUtils._restoreStyles(grandparentElement);
};

// ======================= private agent helpers =======================

/**
 * Ensures that the specified style has a computed style that is different
 * than the one passed in.
 * @param {HTMLElement} element the DOM element whose style we are computing
 * @param {string} propertyName the browser-specific style property name
 * @param {string} valueItShouldNotBe the value the property should not be
 * @private
 */
adf.shared.impl.animationUtils._ensureAppliedStyle = function(
  element,
  propertyName,
  valueItShouldNotBe)
{
  if (element.ownerDocument.defaultView.getComputedStyle != null) // not IE8
  {
    // Chrome 37, 40 and Safari 8 have a bug where intermittently a style
    // property assignment does not always get applied which means it is not
    // possible for a CSS transition animation to occur.
    // By asking for a computed style, we are able to work around this issue and
    // force the browser to recognize the need for a transition.
    var actualValue =
      element.ownerDocument.defaultView.getComputedStyle(element)[propertyName];
    if (actualValue == valueItShouldNotBe)
      adf.shared.impl.animationUtils._fineLogger(
        "AdfAnimationUtils: computed style had unexpected value: " +
        actualValue);
  }
};

/**
 * Gets the name of the event used by this browser when a CSS transition ends.
 * @return {string} the transition-end event name
 * @private
 */
adf.shared.impl.animationUtils._getTransitionEndEventName = function()
{
  if (adf.shared.impl.animationUtils._transitionEndEventName == null)
  {
    var eventName = "transitionend";
    var element = document.createElement("div");
    var possibleEventNames = {
      "WebkitTransition": "webkitTransitionEnd",
      "transition":       "transitionend",
      "OTransition":      "oTransitionEnd",
      "MozTransition":    "transitionend"
    };

    for (var stylePropertyName in possibleEventNames)
    {
      if (element.style[stylePropertyName] !== undefined)
      {
        eventName = possibleEventNames[stylePropertyName];
        break;
      }
    }
    adf.shared.impl.animationUtils._transitionEndEventName = eventName;
  }
  return adf.shared.impl.animationUtils._transitionEndEventName;
};

/**
 * Gets the name of the style property used by this browser for a CSS transform.
 * @param {string} baseName the non-browser-specific style property name
 * @return {string} the transform style property name
 * @private
 */
adf.shared.impl.animationUtils._getBrowserSpecificName = function(baseName)
{
  if (adf.shared.impl.animationUtils._browserSpecificNames[baseName] == null)
  {
    var name = baseName;
    var capitalizedName = baseName.charAt(0).toUpperCase() + baseName.substring(1);
    var element = document.createElement("div");
    var possibleNames = {};
    possibleNames["Webkit" + capitalizedName] = "webkit" + capitalizedName;
    possibleNames[name] = name;
    possibleNames["O" + capitalizedName] = "o" + capitalizedName;
    possibleNames["Moz" + capitalizedName] = "moz" + capitalizedName;

    for (var stylePropertyName in possibleNames)
    {
      if (element.style[stylePropertyName] !== undefined)
      {
        //name = possibleNames[stylePropertyName];
        name = stylePropertyName;
        break;
      }
    }
    adf.shared.impl.animationUtils._browserSpecificNames[baseName] = name;
  }
  return adf.shared.impl.animationUtils._browserSpecificNames[baseName];
};

/**
 * Allow the browser to paint before invoking the given callback.
 * @param {function} callback the function to invoke after painting
 * @private
 */
adf.shared.impl.animationUtils._requestAnimationFrame = function(callback)
{
  var lastTime = 0;
  var vendors = ['webkit', 'ms', 'moz', 'o'];
  for (var x=0; x<vendors.length && !window.requestAnimationFrame; ++x)
  {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
  {
    window.requestAnimationFrame =
      function(callback)
      {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16-(currTime-lastTime));
        var id = window.setTimeout(
          function()
          {
            callback(currTime+timeToCall);
          },
          timeToCall);
        lastTime = currTime+timeToCall;
        return id;
      };
  }

  if (!window.cancelAnimationFrame)
  {
    window.cancelAnimationFrame =
      function(id)
      {
        clearTimeout(id);
      };
  }

  window.requestAnimationFrame(callback);
};

/**
 * Gets whether the specified agent minimum requirements are met or exceeded.
 * Every 2 arguments past actualAgentType and actualAgentVersion must correspond
 * to a minimum required agent type and floating point version number.
 * @param {string} actualAgentType the actual agent type ("trident", "webkit", "gecko")
 * @param {number} actualAgentVersion the actual agent version number as a floating point number
 * @return {boolean} whether the specified agent minimums are met
 * @private
 */
adf.shared.impl.animationUtils._isMinimumAgentMet = function(actualAgentType, actualAgentVersion)
{
  var argCount = arguments.length;
  if (argCount % 2 == 1) // odd number
  {
    adf.shared.impl.animationUtils._fineLogger("AdfAnimationUtils: invalid number of minimum agent requirement arguments: " + argCount);
    return false;
  }

  // Loop through each requirement pair to see if we match one
  for (var i=2; i<=argCount-2; i+=2)
  {
    var requriementType = arguments[i];
    if (actualAgentType == requriementType)
    {
      // We found an agent type match so now see if the actual version is greater than or equal
      // to the requirement version number:
      var requirementVersion = arguments[1+i];
      if (actualAgentVersion >= requirementVersion)
        return true; // met requirement
      else
        return false; // failed requirement
    }
  }
  return false; // no agent type match found; failed requirement
};

/**
 * Gets the agent type and version.
 * @param {string} givenUserAgentString the navigator's userAgent property
 * @return {Array.<Object>} with 2 members, a String for the agent type ("trident", "webkit", "gecko") and a Float for the agent version
 * @private
 */
adf.shared.impl.animationUtils._getAgentTypeAndVersion = function(givenUserAgentString)
{
  var versionParser = adf.shared.impl.animationUtils._parseFloatVersion;
  var agentType = null;
  var agentVersion = -1;
  var userAgent = givenUserAgentString.toLowerCase();
  if (userAgent.indexOf("msie") != -1 || userAgent.indexOf("trident") != -1)
  {
    agentType = "trident";
    var possibleVersion = versionParser(userAgent, /trident\/(\d+[.]\d+)/);
    if (possibleVersion != -1)
    {
      // 6.0 = IE10
      // 5.0 = IE9
      // 4.0 = IE8
      agentVersion = possibleVersion;
    }
    else
    {
      possibleVersion = versionParser(userAgent, /msie (\d+\.\d+);/);
      if (possibleVersion == -1)
        possibleVersion = versionParser(userAgent, /msie (\d+\.\d+)b;/); // expression for betas
      agentVersion = possibleVersion - 4; // Trident versions are 4 behind IE numbers
    }
    if (document.documentMode != null)
    {
      // If a documentMode is provided, it would be an IE number and Trident versions are 4 behind IE numbers.
      // The actual Trident version in use would be the smaller of the 2 numbers:
      agentVersion = Math.min(agentVersion, document.documentMode - 4);
    }
  }
  else if (userAgent.indexOf("applewebkit") != -1)
  {
    agentType = "webkit";
    // 536.26.17 = Mac Desktop Safari 6.0.2
    // 535.1 = Chrome 13.0.782.1
    // 534.46 = Safari 5.1 or iOS 5
    // 525.18 = Mac/Windows Desktop Safari 3.1.1
    // 420.1 = iOS 3
    agentVersion = versionParser(userAgent, /applewebkit\/(\d+([.]\d+)*)/);
  }
  else if (userAgent.indexOf("gecko/")!=-1)
  {
    agentType = "gecko";
    // rv:5 = Firefox 5
    // rv:2 = Firefox 4
    // rv:1.9 = Firefox 3
    // rv:1.8.1 = Firefox 2
    // rv:1.8 = Firefox 1.5
    agentVersion = versionParser(userAgent, /rv:(\d+[.]\d+)/);
  }
  return [ agentType, agentVersion ];
};

/**
 * Parses the float version out of of the specified agent string using
 * a regular expression to identify the version portion of the string.
 * @param {string} userAgent the lowercase navigator user agent string
 * @param {RegExp} versionNumberPattern the regular expression pattern used to extract a number that will be parsed into a float
 * @private
 */
adf.shared.impl.animationUtils._parseFloatVersion = function(userAgent, versionNumberPattern)
{
  var matches = userAgent.match(versionNumberPattern);
  if (matches)
  {
    var versionString = matches[1];
    if (versionString)
      return parseFloat(versionString);
  }
  return -1;
};

/**
 * Save the current styles to be later restored via _restoreStyles.
 * @param {HTMLElement} element the DOM element whose style attribute is to be cached in a data attribute
 * @private
 */
adf.shared.impl.animationUtils._saveStyles = function(element)
{
  if (element != null && element.getAttribute && element.setAttribute)
  {
    // It is invalid to save styles if there was a pending restoreStyle call
    var styles = element.getAttribute("data-adf-original-style");
    if (styles != null)
    {
      adf.shared.impl.animationUtils._fineLogger("AdfAnimationUtils: save while pending restore");
      adf.shared.impl.animationUtils._restoreStyles(element); // restore just in case as a last resort
    }

    styles = element.getAttribute("style");
    if (styles == null)
      styles = "";
    element.setAttribute("data-adf-original-style", styles);
  }
};

/**
 * Restore the original styles that were saved via _saveStyles.
 * @param {HTMLElement} element the DOM element whose style attribute is to be restored from a data attribute
 * @private
 */
adf.shared.impl.animationUtils._restoreStyles = function(element)
{
  if (element != null && element.getAttribute && element.setAttribute)
  {
    var styles = element.getAttribute("data-adf-original-style");
    if (styles != null)
    {
      element.setAttribute("style", styles);
      if (element.removeAttribute)
        element.removeAttribute("data-adf-original-style");
    }
  }
};

/**
 * Opacity was not supported in old browsers.
 * @param {HTMLElement} element the opacity will be applied to
 * @param {string} opacityValue the opacity value
 * @private
 */
adf.shared.impl.animationUtils._setOpacity = function(element, opacityValue)
{
  element.style.opacity = opacityValue;
};

/**
 * Only works in a subset of browsers.
 * @param {HTMLElement} element the transition will be applied to
 * @param {string} transitionValue the transition value
 * @private
 */
adf.shared.impl.animationUtils._setTransition = function(element, transitionValue)
{
  var transitionProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("transition");
  element.style[transitionProperty] = transitionValue;
};

/**
 * Only works in a subset of browsers.
 * @param {HTMLElement} element the transform will be applied to
 * @param {string} transformValue the transform value
 * @private
 */
adf.shared.impl.animationUtils._setTransformValue = function(element, transformValue)
{
  var transformProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("transform");
  element.style[transformProperty] = transformValue;
};

/**
 * Only works in a subset of browsers.
 * @param {HTMLElement} element the translate will be applied to
 * @param {string} translateValues the translate value
 * @private
 */
adf.shared.impl.animationUtils._setTransformTranslate = function(element, translateValues)
{
  var transformProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("transform");
  element.style[transformProperty] = "translate(" + translateValues + ")";
};

/**
 * Only works in a subset of browsers.
 * @param {HTMLElement} element the rotateX will be applied to
 * @param {string} rotateXValues the rotateX value
 * @private
 */
adf.shared.impl.animationUtils._setTransformRotateX = function(element, rotateXValues)
{
  var agentType = adf.shared.impl.animationUtils._agentTypeAndVersion[0];
  if ("trident" == agentType)
  {
    // At least IE10 requires this hack plus removal of the ancestor perspective
    // to support hidden backface-visibility:
    element.style.transform = "perspective(2000px) rotateX(" + rotateXValues + ")";
  }
  else
  {
    var transformProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("transform");
    element.style[transformProperty] = "rotateX(" + rotateXValues + ")";
  }
};

/**
 * Only works in a subset of browsers.
 * @param {HTMLElement} element the rotateY will be applied to
 * @param {string} rotateYValues the rotateY value
 * @private
 */
adf.shared.impl.animationUtils._setTransformRotateY = function(element, rotateYValues)
{
  var agentType = adf.shared.impl.animationUtils._agentTypeAndVersion[0];
  if ("trident" == agentType)
  {
    // At least IE10 requires this hack plus removal of the ancestor perspective
    // to support hidden backface-visibility:
    element.style.transform = "perspective(2000px) rotateY(" + rotateYValues + ")";
  }
  else
  {
    var transformProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("transform");
    element.style[transformProperty] = "rotateY(" + rotateYValues + ")";
  }
};

/**
 * Only works in a subset of browsers.
 * @param {HTMLElement} element the backface visibility will be applied to
 * @param {string} backfaceVisibility the backface visibility value
 * @private
 */
adf.shared.impl.animationUtils._setBackfaceVisibility = function(element, backfaceVisibility)
{
  var backfaceVisibilityProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("backfaceVisibility");
  element.style[backfaceVisibilityProperty] = backfaceVisibility;
};

/**
 * Only works in a subset of browsers.
 * @param {HTMLElement} element the transform-style will be applied to
 * @param {string} transformStyle the transform-style value
 * @private
 */
adf.shared.impl.animationUtils._setTransformStyle = function(element, transformStyle)
{
  var transformStyleProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("transformStyle");
  element.style[transformStyleProperty] = transformStyle;
};

/**
 * Only works in a subset of browsers.
 * @param {HTMLElement} element the transform-origin will be applied to
 * @param {string} transformOrigin the transform-origin value
 * @private
 */
adf.shared.impl.animationUtils._setTransformOrigin = function(element, transformOrigin)
{
  var transformOriginProperty = adf.shared.impl.animationUtils._getBrowserSpecificName("transformOrigin");
  element.style[transformOriginProperty] = transformOrigin;
};

// ======================= private context object =======================

/**
 * This context object allows us to:<ul>
 * <li> maintain flags for whether each animation has finished
 * <li> when both listeners have finished, invoke the finishedFunction (if non-null)
 * <li> when each listener is called, unregister it to prevent re-invocation
 * <li> provide a cancel function that will prevent the finishedFunction from being called</ul>
 * @param {function} finishedFunction the function to invoke if the registered transition end events are invoked (and not cancelled)
 * @param {Object} callbackParams an object that will be passed to the finishedFunction when invoked
 * @constructor
 */
adf.shared.impl.animationUtils.AnimationContext = function(finishedFunction, callbackParams)
{
  this.Init(finishedFunction, callbackParams);
};

adf.shared.impl.animationUtils.AnimationContext.prototype = new Object();
if (window.AdfObject != null)
  adf.shared.impl.animationUtils.AnimationContext.prototype.constructor = window.AdfObject; // this will not work in ADF Mobile (no AdfObject exists)

/**
 * Object instance initializer.
 * @param {function} finishedFunction the function to invoke if the registered transition end events are invoked (and not cancelled)
 * @param {Object} callbackParams an object that will be passed to the finishedFunction when invoked
 * @protected
 */
adf.shared.impl.animationUtils.AnimationContext.prototype.Init = function(finishedFunction, callbackParams)
{
  this._finishedFunction = finishedFunction;
  this._callbackParams = callbackParams;
  this._handledA = true; // initialize to true in case no "A" element is involved
  this._handledB = true; // initialize to true in case no "B" element is involved
};

/**
 * When implementing a custom transition, you are given an animationContext object.
 * Your transition function must return a proxied version of this function in the scope of the animationContext object.
 * This method will unregister the transition end handlers and restore the styles of the elements involved in the transition.
 * The ADF Faces deck component will invoke this method if a new transition comes in while another is processing.
 * @export
 */
adf.shared.impl.animationUtils.AnimationContext.prototype.cancelFunction = function()
{
  // Remove the finishedFunction so it won't be called and remove the listeners:
  this._finishedFunction = null;
  var callbackParams = this._callbackParams;
  this._callbackParams = null;
  var animationUtils = adf.shared.impl.animationUtils;
  animationUtils._restoreStyles(this._elementA);
  animationUtils._restoreStyles(this._elementB);
  var parentElement;
  if (this._elementA != null)
  {
    parentElement = this._elementA.parentNode;
    animationUtils._restoreStyles(parentElement);
    if (parentElement != null)
      animationUtils._restoreStyles(parentElement.parentNode);
    
  }
  else if (this._elementB != null)
  {
    parentElement = this._elementB.parentNode;
    animationUtils._restoreStyles(parentElement);
    if (parentElement != null)
      animationUtils._restoreStyles(parentElement.parentNode);
  }
  this._removeTransitionEndA();
  this._removeTransitionEndB();
  if (this._extraCancelFunction)
  {
    try
    {
      this._extraCancelFunction();
    }
    catch (problem)
    {
      // Should only get here if there is a problem in the transition implementation:
      animationUtils._fineLogger("AdfAnimationUtils: unable to complete extra cancel function due to problem:");
      animationUtils._fineLogger(problem);
    }
    this._extraCancelFunction = null;
  }
  return callbackParams;
};

/**
 * This method cleans up the context and performs the finished function given at context creation time.
 * @private
 */
adf.shared.impl.animationUtils.AnimationContext.prototype._performFinish = function()
{
  // invode the finish function and perform cleanup
  var finishedFunction      = this._finishedFunction;
  var callbackParams        = this._callbackParams;
  this._finishedFunction    = null;
  this._extraCancelFunction = null;
  this._callbackParams      = null;
  if (finishedFunction != null)
    finishedFunction(callbackParams);
};

/**
 * Adds a function that will be called if this animation gets cancelled.
 * This allows extra cleanup to be performed if necessary.
 * @param {function} extraHandler an optional extra function that will be invoked when this element gets a transition end event
 * @export
 */
adf.shared.impl.animationUtils.AnimationContext.prototype.addExtraCancelFunction = function(extraCancelFunction)
{
  this._extraCancelFunction = extraCancelFunction;
};

/**
 * When implementing a custom transition, you need to register transition end events for any element
 * transitioning so that the finished function is properly invoked after the transition ends.
 * See also the addTransitionEndB function if you have a second element involved.
 * @param {HTMLElement} element the element whose transition end event you want to listen for
 * @param {function} extraHandler an optional extra function that will be invoked when this element gets a transition end event
 * @export
 */
adf.shared.impl.animationUtils.AnimationContext.prototype.addTransitionEndA = function(element, extraHandler)
{
  // Add the event listeners and save a reference to the element:
  this._elementA = element;
  this._handleProxyA = adf.shared.impl.animationUtils.getProxyFunction(this, this._handleTransitionEndA);
  this._handledA = false; // an "A" element is involved so re-initialize this to false
  var transitionEndEventName = adf.shared.impl.animationUtils._getTransitionEndEventName();
  if (extraHandler != null)
  {
    this._extraHandlerA = extraHandler;
    element.addEventListener(transitionEndEventName, extraHandler, true);
  }
  element.addEventListener(transitionEndEventName, this._handleProxyA, true);
};
adf.shared.impl.animationUtils.AnimationContext.prototype._removeTransitionEndA = function()
{
  // Remove the event listeners and remove the reference to the element:
  var element = this._elementA;
  if (element != null)
  {
    var transitionEndEventName = adf.shared.impl.animationUtils._getTransitionEndEventName();
    if (this._extraHandlerA != null)
    {
      element.removeEventListener(transitionEndEventName, this._extraHandlerA, true);
      this._extraHandlerA = null;
    }
    element.removeEventListener(transitionEndEventName, this._handleProxyA, true);
    this._elementA = null;
  }
  this._handleProxyA = null;
};
adf.shared.impl.animationUtils.AnimationContext.prototype._handleTransitionEndA = function()
{
  if (!this._handledA)
  {
    // Mark this element's event as being handled, remove the listeners:
    this._handledA = true;
    this._removeTransitionEndA();

    // If both elements' events were handled, invoke the finishFunction:
    if (this._handledB)
      this._performFinish(); // both events were handled
  }
};

/**
 * When implementing a custom transition, you need to register transition end events for any element
 * transitioning so that the finished function is properly invoked after the transition ends.
 * See also the addTransitionEndA function if you have a second element involved.
 * @param {HTMLElement} element the element whose transition end event you want to listen for
 * @param {function} extraHandler an optional extra function that will be invoked when this element gets a transition end event
 * @export
 */
adf.shared.impl.animationUtils.AnimationContext.prototype.addTransitionEndB = function(element, extraHandler)
{
  // Add the event listeners and save a reference to the element:
  this._elementB = element;
  this._handleProxyB = adf.shared.impl.animationUtils.getProxyFunction(this, this._handleTransitionEndB);
  this._handledB = false; // a "B" element is involved so re-initialize this to false
  var transitionEndEventName = adf.shared.impl.animationUtils._getTransitionEndEventName();
  if (extraHandler != null)
  {
    this._extraHandlerB = extraHandler;
    element.addEventListener(transitionEndEventName, extraHandler, true);
  }
  element.addEventListener(transitionEndEventName, this._handleProxyB, true);
};
/** @private */
adf.shared.impl.animationUtils.AnimationContext.prototype._removeTransitionEndB = function()
{
  // Remove the event listeners and remove the reference to the element:
  var element = this._elementB;
  if (element != null)
  {
    var transitionEndEventName = adf.shared.impl.animationUtils._getTransitionEndEventName();
    if (this._extraHandlerB != null)
    {
      element.removeEventListener(transitionEndEventName, this._extraHandlerB, true);
      this._extraHandlerB = null;
    }
    element.removeEventListener(transitionEndEventName, this._handleProxyB, true);
    this._elementB = null;
  }
  this._handleProxyB = null;
};
/** @private */
adf.shared.impl.animationUtils.AnimationContext.prototype._handleTransitionEndB = function()
{
  if (!this._handledB)
  {
    // Mark this element's event as being handled, remove the listeners:
    this._handledB = true;
    this._removeTransitionEndB();

    // If both elements' events were handled, invoke the finishFunction:
    if (this._handledA)
      this._performFinish(); // both events were handled
  }
};