// @compiled on Tue Apr 26 16:04:55 MDT 2016
// Note: this is a generated file all changes will be lost. 


/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/AdfResource.js///////////////////////////////////////

/* Copyright (c) 2011, 2014, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- AdfResource.js ---------------------- */
// moved to base.js
// TODO need to:
// - look for the @-requires messages in all of Bruces code to remove references to "AdfResource"
// - purge this file altogether but be careful to check that Ant doesn't try to reference it

/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/AdfResource.js///////////////////////////////////////



/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/ManagedBeans.js///////////////////////////////////////

/* Copyright (c) 2011, 2014, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- ManagedBeans.js ---------------------- */

var adf                    = window.adf                 || {};
adf.mf                     = adf.mf                     || {};
adf.mf.api                 = adf.mf.api                 || {};
adf.mf.api.bean            = adf.mf.api.bean            || {};
adf.mf.el                  = adf.mf.el                  || {};
adf.mf.locale              = adf.mf.locale              || {};
adf.mf.log                 = adf.mf.log                 || {};
adf.mf.resource            = adf.mf.resource            || {};
adf.mf.util                = adf.mf.util                || {};

adf.mf.internal            = adf.mf.internal            || {};
adf.mf.internal.api        = adf.mf.internal.api        || {};
adf.mf.internal.el         = adf.mf.internal.el         || {};
adf.mf.internal.el.parser  = adf.mf.internal.el.parser  || {};
adf.mf.internal.locale     = adf.mf.internal.locale     || {};
adf.mf.internal.log        = adf.mf.internal.log        || {};
adf.mf.internal.mb         = adf.mf.internal.mb         || {};
adf.mf.internal.perf       = adf.mf.internal.perf       || {};
adf.mf.internal.perf.story = adf.mf.internal.perf.story || {};
adf.mf.internal.resource   = adf.mf.internal.resource   || {};
adf.mf.internal.util       = adf.mf.internal.util       || {};

adf.mf.internal.mb.ManagedBeanDefinition = adf.mf.internal.mb.ManagedBeanDefinition || {
  "APPLICATION": "applicationScope",
  "PAGE_FLOW":   "pageFlowScope",
  "VIEW":        "viewScope"
};

/**
 * Set a collection of managed bean definitions.  The collection of bean
 * definitions supplied here _REPLACES_ any existing definitions, it does
 * not add to the existing set.
 *
 * @param {Array.<adf.mf.internal.mb.ManagedBeanDefinition>} beanDefs an array of
 *        ManagedBeanDefinition objects.
 * @param {Array.<function(Object,Object):void>|function(Object,Object)} success invoked when
 *        the method is successful invoked. Functions accept a request and response object as
 *        arguments.
 * @param {Array.<function(Object,Object):void>|function(Object,Object)} failed invoked when
 *        an error is encountered. Functions accept a request and response object as arguments.
 */
adf.mf.internal.mb.setBeanDefinitions = function(beanDefs, success, failed)
{
  // ensure defs is an array
  var defs = (adf.mf.internal.util.is_array(beanDefs))? beanDefs : [beanDefs];
  var scb  = (adf.mf.internal.util.is_array(success))?  success  : [success];

  if (!adf.mf.internal.isJavaAvailable())
  {
    if(defs.length == 0)
    {
      /* if there are no beans being defined, this command is a NOOP */
      for(var i = 0; i < scb.length; ++i)
      {
        try
        {
          scb[i](null, null);
        }
        catch(e) { /* ignore */ }
      }
      return;  /* do not actually make the java call since it will error out */
    }
    else
    {
      /* since there were beans defined, log a message and then let it error out in the invoke */
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
        "adf.mf.internal.mb.setBeanDefinitions", "ERROR_MNGD_BEANS_NOT_SUPPORTED");
    }
  }

  adf.mf.api.invokeMethod("oracle.adfmf.framework.api.Model", "setBeanDefinitions",
    defs, success, failed);
};

/**
 * Add a managed bean definition
 *
 * @param {adf.mf.api.bean.ManagedBeanDefinition} beanDefinition the managed bean definition to add
 * @param {Array.<function(Object,Object):void>|function(Object,Object)} success invoked when
 *        the method is successful invoked. Functions accept a request and response object as
 *        arguments.
 * @param {Array.<function(Object,Object):void>|function(Object,Object)} failed invoked when
 *        an error is encountered. Functions accept a request and response object as arguments.
 */
adf.mf.api.bean.addBeanDefinition = function(beanDefinition, success, failed)
{
  if (!adf.mf.internal.isJavaAvailable())
  {
   var scb = (adf.mf.internal.util.is_array(success)) ? success : [success];
   for (var i = 0, size = scb.length; i < size; ++i)
   {
      try
      {
        scb[i](null, null);
      }
      catch(e) { /* ignore */ }
    }
    return;
  }

  adf.mf.api.invokeMethod("oracle.adfmf.framework.api.Model", "addBeanDefinition",
    beanDefinition, success, failed);
};

/**
 * Remove a bean definition from the current context
 *
 * @param {adf.mf.api.bean.ManagedBeanDefinition} beanDefinition the definition of the bean to remove.
 *        The managed properties array does not need to be populated, all other properties are required.
 * @param {Array.<function(Object,Object):void>|function(Object,Object)} success invoked when
 *        the method is successful invoked. Functions accept a request and response object as
 *        arguments.
 * @param {Array.<function(Object,Object):void>|function(Object,Object)} failed invoked when
 *        an error is encountered. Functions accept a request and response object as arguments.
 */
adf.mf.api.bean.removeBeanDefinition = function(beanDefinition, success, failed)
{
  if (!adf.mf.internal.isJavaAvailable())
  {
    var scb = (adf.mf.internal.util.is_array(success)) ? success : [success];
    for (var i = 0, size = scb.length; i < size; ++i)
    {
      try
      {
        scb[i](null, null);
      }
      catch(e) { /* ignore */ }
    }
    return;
  }

  adf.mf.api.invokeMethod("oracle.adfmf.framework.api.Model", "removeBeanDefinition",
    beanDefinition, success, failed);
};

/**
 * Managed Bean definition
 *
 * @param {string} name managed bean's name
 * @param {string} type managed bean's type
 * @param {string} scope managed bean's scope
 * @param {Array.<adf.mf.internal.mb.ManagedPropertyDefinition>} props managed bean's managed
 *        properties
 */
adf.mf.api.bean.ManagedBeanDefinition = function(name, type, scope, props)
{
  this.beanName     = name;  /* managed bean's name  */
  this.fqnClassname = type;  /* managed bean's type  */
  this.scope        = scope; /* managed bean's scope */
  this.props        = props; /* managed bean's props */
};

/**
 * @deprecated Use adf.mf.api.bean.ManagedBeanDefinition instead
 */
adf.mf.internal.mb.ManagedBeanDefinition = adf.mf.api.bean.ManagedBeanDefinition;

/**
 * @return {string} the managed bean's name
 */
adf.mf.api.bean.ManagedBeanDefinition.prototype.getBeanName = function()
{
  return this.beanName;
};

/**
 * @return {string} the managed bean's fully qualified Java class name
 */
adf.mf.api.bean.ManagedBeanDefinition.prototype.getBeanClass = function()
{
  return this.fqnClassname;
};

/**
 * @return {string} the managed bean's associated scope
 */
adf.mf.api.bean.ManagedBeanDefinition.prototype.getScope = function()
{
  return this.scope;
};

/**
 * @return {Array.<adf.mf.internal.mb.ManagedPropertyDefinition>} the associated managed bean's
 *         properties
 */
adf.mf.api.bean.ManagedBeanDefinition.prototype.getManagedProperties = function()
{
  return this.props;
};

/**
 * Managed property definition used in the managed bean definition
 * that should be set by the controller layer on creation
 *
 * @param {string} name managed bean property
 * @param {string} type managed bean property's fully qualified Java classname
 * @param {Object} value managed bean property's value
 */
adf.mf.api.bean.ManagedPropertyDefinition = function(name, type, value)
{
  this.name  = name;  /* managed property's name  */
  this.type  = type;  /* managed property's type  */
  this.value = value; /* managed property's value */
};

/**
 * @deprecated Use adf.mf.api.bean.ManagedPropertyDefinition instead
 */
adf.mf.internal.mb.ManagedPropertyDefinition = adf.mf.api.bean.ManagedPropertyDefinition;

/**
 * @return {string} the managed property's name
 */
adf.mf.api.bean.ManagedPropertyDefinition.prototype.getName = function()
{
  return this.name;
};

/**
 * @return {string} the managed property's fully qualified class name
 */
adf.mf.api.bean.ManagedPropertyDefinition.prototype.getType = function()
{
  return this.type;
};

/**
 * @return {Object} the managed property's value
 */
adf.mf.api.bean.ManagedPropertyDefinition.prototype.getValue = function()
{
  return this.value;
};


/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/ManagedBeans.js///////////////////////////////////////



/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/AdfLocale.js///////////////////////////////////////

/* Copyright (c) 2011, 2014, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- AdfLocale.js ---------------------- */
// moved to base.js
// TODO need to:
// - look for the @-requires messages in all of Bruces code to remove references to "AdfLocale"
// - purge this file altogether but be careful to check that Ant doesn't try to reference it

/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/AdfLocale.js///////////////////////////////////////



/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/ContainerIntegration.js///////////////////////////////////////

/* Copyright (c) 2011, 2016, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- ContainerIntegration.js ---------------------- */

var adf                    = window.adf                 || {};
adf.mf                     = adf.mf                     || {};
adf.mf.api                 = adf.mf.api                 || {};
adf.mf.el                  = adf.mf.el                  || {};
adf.mf.locale              = adf.mf.locale              || {};
adf.mf.log                 = adf.mf.log                 || {};
adf.mf.resource            = adf.mf.resource            || {};
adf.mf.util                = adf.mf.util                || {};

adf.mf.internal            = adf.mf.internal            || {};
adf.mf.internal.api        = adf.mf.internal.api        || {};
adf.mf.internal.el         = adf.mf.internal.el         || {};
adf.mf.internal.el.parser  = adf.mf.internal.el.parser  || {};
adf.mf.internal.locale     = adf.mf.internal.locale     || {};
adf.mf.internal.log        = adf.mf.internal.log        || {};
adf.mf.internal.mb         = adf.mf.internal.mb         || {};
adf.mf.internal.perf       = adf.mf.internal.perf       || {};
adf.mf.internal.perf.story = adf.mf.internal.perf.story || {};
adf.mf.internal.resource   = adf.mf.internal.resource   || {};
adf.mf.internal.util       = adf.mf.internal.util       || {};



(function() {
  var ADFMF_CONTAINER_UTILITIES          = "oracle.adfmf.framework.api.AdfmfContainerUtilities"
  var ADFMF_CONTAINER_UTILITIES_INTERNAL = "oracle.adfmf.framework.internal.AdfmfContainerUtilitiesInternal";
  var ASYNC_SUCCESS_CALLBACK             = "asyncContainerJavaScriptFunctionResponseSuccess";
  var ASYNC_FAILED_CALLBACK              = "asyncContainerJavaScriptFunctionResponseFailed";
  
   /**
    * Checks and obtains new configuration if available.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is checkForNewConfiguration, which is defined
    * as:
    * public static void checkForNewConfiguration() throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.checkForNewConfiguration = function(success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error (AdfException).
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.checkForNewConfiguration(
          function(req, res) &#123; alert("checkForNewConfiguration complete"); },
          function(req, res) &#123; alert("checkForNewConfiguration failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.checkForNewConfiguration = function(success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "checkForNewConfiguration", success, failed);
   };

   /**
    * Gets an array of <code>FeatureInformation</code> objects that provide
    * information about the features that are available in this session of the
    * ADF Mobile application and should be displayed on a custom springboard.
    * These features have already been filtered by the evaluation of constraints.
    * These are the features that would normally be displayed on the default
    * springboard.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is getFeatures, which is defined
    * as:
    * public static FeatureInformation[] getFeatures() throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.getFeatures = function(success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>
    * 
    *         An array of <code>FeatureInformation</code> objects each
    *         representing a feature that is available. This will include the
    *         feature id, the feature name, a path to the feature icon and a path
    *         to the feature image. Normally a springboard will display the name
    *         of the feature and the image for that feature.
    *         
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error (AdfException).
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.getFeatures(
          function(req, res) &#123; alert("getFeatures complete"); },
          function(req, res) &#123; alert("getFeatures failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.getFeatures = function(success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "getFeatures", success, failed);
   };

   /**
    * Gets <code>ApplicatiaonInformation</code> object containing the information
    * about the application. This can be used to get the application name for a
    * custom springboard. Additional information such as vendor, version and
    * application id are provided as well.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is getApplicationInformation, which is defined
    * as:
    * public static ApplicatiaonInformation getApplicationInformation() throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.getApplicationInformation = function(success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>
    * 
    *         A <code>ApplicatiaonInformation</code> object containing
    *         application level metadata. This includes application name, vendor,
    *         version and application id.
    * 
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error (AdfException).
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.getApplicationInformation(
          function(req, res) &#123; alert("getApplicationInformation complete"); },
          function(req, res) &#123; alert("getApplicationInformation failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.getApplicationInformation = function(success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "getApplicationInformation", success, failed);
   };

   /**
    * Activates the feature with the given ID.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is gotoFeature, which is defined
    * as:
    * public static void gotoFeature(String featureId) throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.gotoFeature = function(featureId, success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * @param featureId
    *          ID of feature to activate
    *          
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error (AdfException).
    * <br/>
    * <b>Example</b>
    * <pre>
    * adf.mf.api.gotoFeature("feature0",
    *   function(req, res) &#123; alert("gotoFeature complete"); },
    *   function(req, res) &#123; alert("gotoFeature failed with " + adf.mf.util.stringify(res); }
    * );
    * </pre>
    */
   adf.mf.api.gotoFeature = function(/* String */ featureId, success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "gotoFeature", featureId, success, failed);
   };


   /**
    * Activates the springboard.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is gotoSpringboard, which is defined
    * as:
    * public static void gotoSpringboard() throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.gotoSpringboard = function(success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error (AdfException).
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.gotoSpringboard(
          function(req, res) &#123; alert("gotoSpringboard complete"); },
          function(req, res) &#123; alert("gotoSpringboard failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.gotoSpringboard = function(success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "gotoSpringboard", success, failed);
   };

   /**
    * Hides the springboard.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is hideSpringboard, which is defined
    * as:
    * public static void hideSpringboard() throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.hideSpringboard = function(success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error (AdfException).
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.hideSpringboard(
          function(req, res) &#123; alert("hideSpringboard complete"); },
          function(req, res) &#123; alert("hideSpringboard failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.hideSpringboard = function(success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "hideSpringboard", success, failed);
   };

   /**
    * Shows the springboard.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is showSpringboard, which is defined
    * as:
    * public static void showSpringboard() throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.showSpringboard = function(success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error (AdfException).
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.showSpringboard(
          function(req, res) &#123; alert("showSpringboard complete"); },
          function(req, res) &#123; alert("showSpringboard failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.showSpringboard = function(success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "showSpringboard", success, failed);
   };

   /**
    * Activates the default feature.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is gotoDefaultFeature, which is defined
    * as:
    * public static void gotoDefaultFeature() throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.gotoDefaultFeature = function(success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error (AdfException).
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.gotoDefaultFeature(
          function(req, res) &#123; alert("gotoDefaultFeature complete"); },
          function(req, res) &#123; alert("gotoDefaultFeature failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.gotoDefaultFeature = function(success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "gotoDefaultFeature", success, failed);
   };


   /**
    * Resets the feature with the given ID.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is resetFeature, which is defined
    * as:
    * public static void resetFeature(String featureId) throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.resetFeature = function(featureId, success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * @param featureId
    *          ID of feature to reset
    *          
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error.
    *         
    * @throws AdfException
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.resetFeature("feature0",
          function(req, res) &#123; alert("resetFeature complete"); },
          function(req, res) &#123; alert("resetFeature failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.resetFeature = function(/* String */ featureId, success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "resetFeature", featureId, success, failed);
   };


   /**
    * Hides navigation bar.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is hideNavigationBar, which is defined
    * as:
    * public static void hideNavigationBar() throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.hideNavigationBar = function(success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error.
    *         
    * @throws AdfException
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.hideNavigationBar(
          function(req, res) &#123; alert("hideNavigationBar complete"); },
          function(req, res) &#123; alert("hideNavigationBar failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.hideNavigationBar = function(success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "hideNavigationBar", success, failed);
   };

   /**
    * Shows navigation bar.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is showNavigationBar, which is defined
    * as:
    * public static void showNavigationBar() throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.showNavigationBar = function(success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error.
    *         
    * @throws AdfException
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.showNavigationBar(
          function(req, res) &#123; alert("showNavigationBar complete"); },
          function(req, res) &#123; alert("showNavigationBar failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.showNavigationBar = function(success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "showNavigationBar", success, failed);
   };
   
   /**
    * Shows the preferences screen.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is showPreferences, which is defined
    * as:
    * public static void showPreferences() throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.showPreferences = function(success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error.
    *         
    * @throws AdfException
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.showPreferences(
          function(req, res) &#123; alert("showPreferences complete"); },
          function(req, res) &#123; alert("showPreferences failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.showPreferences = function(success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "showPreferences", success, failed);
   };


   /**
    * Invokes a Javascript method with the given arguments on the specified
    * feature. Returns the result of the method execution.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is invokeContainerJavaScriptFunction, which is defined
    * as:
    * public static Object invokeContainerJavaScriptFunction(String featureId, String methodName, Object[] args) throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.showNavigationBar = function(success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * @param featureId
    *          ID of feature on which to invoke the method
    * @param methodName
    *          method name
    * @param args
    *          array of arguments to be passed to method
    *          
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>Object
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error.
    *         
    * @throws AdfException
    * <br/>
    * <b>Example</b>
    *  <ul>
    *  <li>included a simple appFunction.js file to feature1 (by adding it to feature1 content's include in JDeveloper).</li>
    *  <li>added calls to adf.mf.api.invokeContainerJavaScriptFunction to your code</li>
    *  </ul>
    * <br/>
    * <b>appFunctions.js</b>
    * <pre>
    (function() 
    &#123;
       if (!window.application) window.application = &#123;};

       application.testFunction = function()
       &#123;
          var args = arguments;

          alert("APP ALERT " + args.length + " ");
          return "application.testFunction - passed";
       };
    })();
    * </pre>
    * <br/>
    * <pre>
   adf.mf.api.invokeContainerJavaScriptFunction("feature1",
          function(req, res) &#123; alert("invokeContainerJavaScriptFunction complete"); },
          function(req, res) &#123; alert("invokeContainerJavaScriptFunction failed with " + adf.mf.util.stringify(res); }
   or
   adf.mf.api.invokeContainerJavaScriptFunction("feature1", [ "P1" ], 
          function(req, res) &#123; alert("invokeContainerJavaScriptFunction complete"); },
          function(req, res) &#123; alert("invokeContainerJavaScriptFunction failed with " + adf.mf.util.stringify(res); }
   );
   or
   adf.mf.api.invokeContainerJavaScriptFunction("feature1", [ "P1", "P2" ], 
          function(req, res) &#123; alert("invokeContainerJavaScriptFunction complete"); },
          function(req, res) &#123; alert("invokeContainerJavaScriptFunction failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    * <br/>
    * Now when the user presses the button they will see three alerts (from the appFunctions.js):
    * <pre>
        APP ALERT 0
        APP ALERT 1
        APP ALERT 2
    * </pre>
    */
   adf.mf.api.invokeContainerJavaScriptFunction = function(/* String */ featureId, /* String */ methodName, /* Object[] */ args, success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "invokeContainerJavaScriptFunction", featureId, methodName, args, success, failed);
   };


   /**
    * Invokes a native method on the specified class with the given arguments.
    * Returns the result of method execution.
    * 
    * @param className
    *          class name
    * @param methodName
    *          method name
    * @param args
    *          array of arguments to be passed to method
    * 
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>Object
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error.
    *         
    * @throws AdfException
    */
   adf.mf.api.invokeContainerMethod = function(/* String */ classname, /* String */ methodName, /* Object[] */ args, success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "invokeContainerMethod", classname, methodName, args, success, failed);
   };

   /**
    * Returns the feature information for the passed in feature id.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is getFeatureById, which is defined
    * as:
    * public static FeatureInformation getFeatureById(String featureId) throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.getFeatureById = function(featureId, success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * @param featureId
    *          ID of the feature to retrieve
    * 
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>Feature
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error.
    *         
    * @throws AdfException
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.getFeatureById("feature.id",
          function(req, res) &#123; alert("getFeatureById complete"); },
          function(req, res) &#123; alert("getFeatureById failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.getFeatureById = function(/* String */ featureId, success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "getFeatureById", featureId, success, failed);
   };

   /**
    * Returns the feature information for the passed in feature name.
    * <br/>
    * The associated AdfmfContainerUtilites method that is invoked
    * is getFeatureByName, which is defined
    * as:
    * public static FeatureInformation getFeatureByName(String featureName) throws AdfException
    * <br/>
    * so the associated JavaScript  function will be defined as
    * <br/>
    * adf.mf.api.getFeatureByName = function(featureName, success, failed)
    * <br/>
    * The success and failed callbacks were added so the return value
    * and exception could be passed back to the JavaScript  calling code.
    * <br/>
    * @param featureName
    *          Name of the feature to retrieve
    * 
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error.
    *         
    * @throws AdfException
    * <br/>
    * <b>Example</b>
    * <pre>
   adf.mf.api.getFeatureByName("feature.name",
          function(req, res) &#123; alert("getFeatureByName complete"); },
          function(req, res) &#123; alert("getFeatureByName failed with " + adf.mf.util.stringify(res); }
   );
    * </pre>
    */
   adf.mf.api.getFeatureByName = function(/* String */ featureName, success, failed) 
   {
      adf.mf.api.invokeMethod(ADFMF_CONTAINER_UTILITIES, "getFeatureByName", featureName, success, failed);
   };

   /**
    * internal api for invoke Java 
    * e.g. adf.mf.internal.api.invokeMethod(commId, classname, methodname, param1, param2, ... , paramN ,successCallback, failedCallback);
    */

   adf.mf.internal.api.invokeMethod = function()
   {
      argc   = arguments.length;
      params = new Array();

      for (var i=3; i < argc-2; i++) 
      {
         params[i-3] = arguments[i];
      }

      var request = { "classname"  : arguments[1], /* clazz  */
            "method"     : arguments[2], /* method */
            "params"     : params };

      adf.mf.internal.context.invokeJavaMethod(/* CommId */ arguments[0], request, arguments[argc-2], arguments[argc-1]);
   };

   /**
    * The framework enables you to display the device's e-mail interface, and optionally pre-populate certain fields:
    * 
    *  @param options
    *     is a JSON object with the following optional properties:
    *     <ul>
    *     <li>to: recipients (comma-separated)</li>
    *     <li>cc: CC recipients (comma-separated)</li>
    *     <li>subject: message subject</li>
    *     <li>body: message body</li>
    *     <li>bcc: BCC recipients (comma-separated)</li>
    *     <li>attachments: list of filenames to attach to the e-mail (comma-separated)</li>
    *     <li>mimeTypes:
    *     <ul><li><b>iOS</b>: List of MIME types to use for the attachments (comma-separated). 
    *     Specify null to let the framework automatically determine the MIME types. 
    *     It is also possible to only specify the MIME types for selected attachments; see examples below.</li>
    *     <li><b>Android</b>: MIME type in Android isn't true MIME type but just a way for Android to filter 
    *     applications to be shown in the application chooser dialog. But empty MIME type doesn't work 
    *     and throws exception. So if no MIME type is passed in, we use "plain/text" by default. Also, if 
    *     there are multiple attachment types, user doesn't need to provide multiple MIME types, but can 
    *     provide just most suitable MIME type (as per Android documentation). That being said, if the user 
    *     has an application which is being deployed to both iOS and Android, they can pass in the comma-separated 
    *     list of mime types and Android will still work fine.</li></ul>
    *     </li>
    *     </ul>
    *  <br/>
    *  After this interface is displayed, the user can choose to either send the e-mail or discard it. Note that it 
    *  is not possible to automatically send the e-mail due to device/carrier restrictions; only the end user can actually 
    *  send the e-mail. The device must also have at least one e-mail account configured to send e-mail; otherwise, an 
    *  error will be displayed indicating that no e-mail accounts could be found.
    *  <br/>
    *  Examples:
    *
    * Populate an e-mail to 'john.doe@foo.com', copy 'jane.doe@bar.com', with the subject 'Test message', 
    * and the body 'This is a test message'
    * <br/>
    * <pre>
   adf.mf.api.sendEmail(&#123;to: "john.doe@foo.com",
                         cc: "jane.doe@bar.com",
                         subject: "Test message",
                         body: "This is a test message"},
                        success, failed);
    * </pre>
    * <br/>
    * Taking the same example, but now adding a BCC to 'mary.may@another.com' and 'lary.day@another.com'
    * and attaching two files.<br/>
    * <b>NOTE:</b> By not specifying a value for the mimeTypes parameter, you are telling the framework to automatically 
    * determine the MIME type for each of the attachments
    * <br/>
    * <pre>
   adf.mf.api.sendEmail(&#123;to: "john.doe@foo.com",
                         cc: "jane.doe@bar.com",
                         bcc: "mary.may@another.com,lary.day@another.com"
                         subject: "Test message",
                         attachments: "path/to/file1.txt,path/to/file2.png"},
                        success, failed);
    * </pre>
    * 
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error.
    *         
    * @throws AdfException
    */
   adf.mf.api.sendEmail = function(/* JSON */ options, success, failed)
   {
      if (options)
      {
         var attachments = options["attachments"];
         var mimeTypes = options["mimeTypes"];
         if (attachments || mimeTypes)
         {
            var attachmentsArray = attachments ? attachments.split(",") : [];
            var mimeTypesArray = mimeTypes ? mimeTypes.split(",") : [];
            var numMimeTypes = mimeTypesArray.length;
            var numAttachments = attachmentsArray.length;
            if (numMimeTypes > 0 && numAttachments != numMimeTypes)
            {
               // When attachments and MIME types are both specified, the number of each
               // must match.
               if (failed != null)
               {
                  var rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_MIMETYPES_NOTEQUAL_ATTACHMENTS", [numMimeTypes, numAttachments]);
                  failed(rmsg);
                  return;
               }
            }
         }
      }
      cordova.exec( success, failed, "AdfmfEmail", "sendEmail", [options]);
   };

   // This variant of the sendEmail API is ONLY used when invoking sendEmail from Embedded Java code
  adf.mf.internal.api.sendEmail = function (commId, requestId, emailOptions) {  
    try {
      adf.mf.api.sendEmail(emailOptions, /* Options to pre-populate e-mail dialog */

        function(result) /* Success callback */
        {
          var responseData = result || {};
          try 
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, responseData, function() {}, function() {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.sendEmail", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
          }
        },

        function(result) /* Error callback */
        {
          var responseData = result || {};
          try 
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, responseData, function() {}, function() {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.sendEmail", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
          }
        });
     }
     catch(se)
     {
        adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
          "adf.mf.api.sendEmail", "ERROR_EXCEPTION", se);;
        adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, msg, function() {}, function() {});
    }
  };



   /**
    * The framework enables you to display the device's text messaging (SMS) interface, and optionally pre-populate certain fields:
    * 
    *  @param options
    *     is a JSON object with the following optional properties:
    *     <ul>
    *     <li>to: recipients (comma-separated)</li>
    *     <li>body: message body</li>
    *     </ul>
    *  <br/>
    *  After this interface is displayed, the user can choose to either send the 
    *  SMS or discard it. Note that it is not possible to automatically send the 
    *  SMS due to device/carrier restrictions; only the end user can actually send the SMS.
    *  <br/>
    *  Examples:
    *
    * Populate an SMS message to '1234567890' with the body 'This is a test message'
    * <br/>
    * <pre>
    adf.mf.api.sendSMS(&#123;to: "1234567890",
                        body: "This is a test message"},
                       success, failed);
    * </pre>
    * 
    * <b>success callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the associated AdfmfContainerUtilities
    *    method's return value.
    *  <br/>i.e.<br/>void
    *  <br/>
    *  <b>failed callback</b> must be in the form of 
    *    function(request, response) where the request 
    *    contains the original request and the response
    *    contains the error.
    *         
    * @throws AdfException
    */
   adf.mf.api.sendSMS = function(/* JSON */ options, success, failed)
   {
     if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api.sendSMS",
              "CORDOVA_DEBUG", "Inside the ContainterIntegration.js invoking AdfmfSMS.sendSMS Cordova plugin");
      }
      cordova.exec( success, failed, "AdfmfSMS", "sendSMS", [options]);
   };	

   // This variant of the sendSMS API is ONLY used when invoking sendSMS from Embedded Java code
   adf.mf.internal.api.sendSMS = function (commId, requestId, smsOptions) {
     try {
      adf.mf.api.sendSMS(smsOptions, /* Options to pre-populate SMS dialog */

        function(result) /* Success callback */
        {
          var responseData = result || {};
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, responseData, function() {}, function() {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.sendSMS", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
          }
        },

        function(result) /* Error callback */
        {
          var responseData = result || {};
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, responseData, function() {}, function() {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.sendSMS", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
          }
        });
    }
    catch(se)
    {
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
        "adf.mf.api.sendSMS", "ERROR_EXCEPTION", se);
      adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, msg, function() {}, function() {});
    }
  };

  adf.mf.api.getDeviceProperties = function(success, failed)
  {
    if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api.getDeviceProperties",
            "CORDOVA_DEBUG", "Inside the ContainterIntegration.js invoking ADFMobileDeviceProperties.getDeviceProperties Cordova plugin");
    }
    cordova.exec( success, failed, "ADFMobileDeviceProperties", "getDeviceProperties", []);
  };

  adf.mf.internal.api.getCurrentPosition = function (commId, requestId) {
    try {
      navigator.geolocation.getCurrentPosition(
      
        function (data) {
          // 'data' is a complex object with prototypical inheritance and is not guaranteed 
          // to return expected results when serialized using JSON.stringify.  
          // Therefore, convert it into a POJO - 'position'- and pass-on 'position' instead.
          var position = 
          {
            timestamp: null,
            coords: 
            {
              speed: null,
              longitude: null,
              latitude: null,
              heading: null,
              altitudeAccuracy: null,
              altitude: null,
              accuracy: null
            }
          };
          if (data != null)
          {
            // This pattern is used so that if the value that is being assigned is undefined, 
            // the default value of the LHS variable is preserved. 
            position.timestamp = (data.timestamp === undefined ? position.timestamp : data.timestamp);
            if (data.coords != null)
            {
              position.coords.accuracy = (data.coords.accuracy === undefined ? position.coords.accuracy : data.coords.accuracy);
              position.coords.altitude = (data.coords.altitude === undefined ? position.coords.altitude : data.coords.altitude);
              position.coords.altitudeAccuracy = (data.coords.altitudeAccuracy === undefined ? position.coords.altitudeAccuracy : data.coords.altitudeAccuracy);
              position.coords.heading = (data.coords.heading === undefined ? position.coords.heading : data.coords.heading);
              position.coords.latitude = (data.coords.latitude === undefined ? position.coords.latitude : data.coords.latitude);
              position.coords.longitude = (data.coords.longitude === undefined ? position.coords.longitude : data.coords.longitude);
              position.coords.speed = (data.coords.speed === undefined ? position.coords.speed : data.coords.speed);
            }
            else
            {
              position.coords = data.coords;
            }
          }
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK,
               requestId, position, function () {}, function () {});
          }
          catch (se)
          {
             adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.getCurrentPosition", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
          }
        },

        function (data) {
          var message = ((data != null) && (data.message != null)) ? data.message : "unknown error";
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK,
               requestId, message, function () {}, function () {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.getCurrentPosition", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
          }
      });
    }
    catch(se)
    {
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
        "navigator.geolocation.getCurrentPosition", "ERROR_EXCEPTION", se);
      adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, msg, function() {}, function() {});
    }
  };

  adf.mf.internal.api.watchPosition = function (commId, requestId, userWatchId, geolocationOptions) { // success callback
    var firstTime = true;
    try
    {
      var watchId = navigator.geolocation.watchPosition(
      
        function (data) {
          // 'data' is a complex object with prototypical inheritance and is not guaranteed to return expected results when serialized using JSON.stringify.  
          // Therefore, convert it into a POJO - 'position'- and pass-on 'position' instead.
          var position = {
            timestamp: null,
          	coords: {
          	  speed: null,
          	  longitude: null,
          	  latitude: null,
          	  heading: null,
          	  altitudeAccuracy: null,
          	  altitude: null,
          	  accuracy: null
          	}
          };
    	  if (data != null)
    	  {
    		// This pattern is used so that if the value that is being assigned is undefined, the default value of the LHS variable is preserved.
			position.timestamp = data.timestamp || position.timestamp;
			if (data.coords != null)
			{
			  position.coords.accuracy = data.coords.accuracy || position.coords.accuracy;
			  position.coords.altitude = data.coords.altitude || position.coords.altitude;
			  position.coords.altitudeAccuracy = data.coords.altitudeAccuracy || position.coords.altitudeAccuracy;
			  position.coords.heading = data.coords.heading || position.coords.heading;
			  position.coords.latitude = data.coords.latitude || position.coords.latitude;
			  position.coords.longitude = data.coords.longitude || position.coords.longitude;
			  position.coords.speed = data.coords.speed || position.coords.speed;
			}
    	  }
          if (firstTime) 
          {  // unblock the calling thread only on the first callback.
            try
            {
              adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK,
                    requestId, String(watchId), function () {}, function () {});
            }
            catch (se)
            {
              adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.watchPosition", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
            }
            firstTime = false;
          }
          try
          {
            adf.mf.api.invokeMethod("oracle.adf.model.datacontrols.device.GeolocationProxy",
               "invokeEmbeddedCallback", userWatchId, position, function () {}, function () {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.watchPosition", "ERROR_IN_REQUEST", "invokeEmbeddedCallback", se);
          }
        },
        
        function (data) {
          navigator.geolocation.clearWatch(String(watchId));  // if error, need to clear watchId so there is no dangling callbacks
          var message = ((data != null) && (data.message != null)) ? data.message : "unknown error";
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK,
               requestId, message, function () {}, function () {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.watchPosition", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
          }
        }, 
        geolocationOptions);
    }
    catch(se)
    {
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
        "navigator.geolocation.watchPosition", "ERROR_EXCEPTION", se);
      adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, msg, function() {}, function() {});
    }        
  };


  adf.mf.internal.api.clearWatch = function (watchID) {
    if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.clearWatch",
            "CORDOVA_DEBUG", watchID);
    }
    navigator.geolocation.clearWatch(watchID); // no callbacks
  };

  adf.mf.internal.api.createContact = function (commId, requestId, properties)
  {
    if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.createContact",
            "CORDOVA_DEBUG", adf.mf.util.stringify(properties));
    }

    try
    {
      // Fix for Bug 16433413: If displayName is passed as null, then Cordova returns "null" for displayName.
      // If empty string is passed in, either valid displayName is returned or null is returned when there is
      // no displayName.
      if (properties !== undefined && properties !== null)
      {
        // Remove all dot properties from javascript object (JSON) to be sent to Cordova layer
        adf.mf.internal.removeDotProperties(properties);

        if (properties.displayName == null)
        {
          properties.displayName = "";
        }
      }

      if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.createContact",
          "CORDOVA_DEBUG_JUST_BEFORE_CREATE_CONTACT_CALL_TO_CORDOVA", adf.mf.util.stringify(properties));
      }

      var contact = navigator.contacts.create(properties);
      if (contact.note == null)
      {
        contact.note = '';
      }
      if (contact.nickname == null)
      {
        contact.nickname = '';
      }

      contact.save(
      
        function (data) {
          var contact = data || {};
  
          // In cordova-2.2.0.js, createIn method adds "Invalid Object" value for null Birthday
          // so we need to put back null there to serialize in to Java layer properly.
          var bDay = contact.birthday;
          if (isNaN(bDay) || ("undefined" == typeof bDay.getDate))
          {
            contact.birthday = null;
          }
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK,
                 requestId, contact, function () {}, function () {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.createContact", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
          }
        },
  
        function (data) {
          var errorCode = ((data != null) && (data.code != null)) ? data.code : ContactError.UNKNOWN_ERROR;
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK,
                 requestId, errorCode, function () {}, function () {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.createContact", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
          }
        });
    }
    catch(se)
    {
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
        "navigator.contacts.save", "ERROR_EXCEPTION", se);
      adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, msg, function() {}, function() {});
    }   
  };

  adf.mf.internal.api.findContacts = function (commId, requestId, fields, options) {
    if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.findContacts", "CORDOVA_DEBUG - fields",
            fields);
      adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.findContacts", "CORDOVA_DEBUG - options",
            adf.mf.util.stringify(options));
    }

	try
	{
		navigator.contacts.find(fields, 
			function (data)
			{
				var contacts = data || {};
				if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
				{
					adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.find success",
						"CORDOVA_FIND_CONTACTS_BEFORE_CONVERTING", adf.mf.util.stringify(contacts));
				}

				try
				{
					// cordova-2.2.0.js doesn't invoke createIn() method and thus does not convert birthday from
					// long to String for findContact call and thus the contact(s) returned have birthday as
					// long in stringified way. eg. "505003627119". Whereas saveContact call correctly invokes
					// createIn() method and thus returns valid string. eg. "1986-01-01T22:47:07.119Z".
					// As ADFMF supports this string type or just the long (without stringified long) we need to
					// invoke createIn() method for each contact to convert date to supported format before
					// invoking the success callback method.
					for (var i = 0; i < contacts.length; i++)
					{
						var contact = contacts[i];
						
						// Copied this method body from cordova-2.2.0.js and:
						// 1) Added if condition to safeguard it
						// 2) Removed console.log and added our framework logging.
						var bDay = contact.birthday;
						try
						{
							if (null != bDay && !isNaN(bDay))
							{
								contact.birthday = new Date(parseFloat(bDay));
							}
						}
						catch (exception)
						{
							if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
							{
								adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.find success",
									"CORDOVA_FIND_CONTACTS_DURING_CONVERT_BDAY", "Exception converting date from long to String");
							}

							adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
								"adf.mf.internal.util.convertContact", "ERROR_EXCEPTION", exception);
						}
					}

					if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
					{
						adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.find success",
							"CORDOVA_FIND_CONTACTS_AFTER_CONVERTING", adf.mf.util.stringify(contacts));
					}

					adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK,
						requestId, contacts, function () {}, function () {});
				}
				catch (se)
				{
					adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
						"adf.mf.internal.api.findContacts", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
				}
			},

        function (data) {
          var errorCode = ((data != null) && (data.code != null)) ? data.code : ContactError.UNKNOWN_ERROR;
          
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK,
               requestId, errorCode, function () {}, function () {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.findContacts", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
          }
        }, options);
    }
    catch(se)
    {
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
        "navigator.contacts.find", "ERROR_EXCEPTION", se);
      adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, msg, function() {}, function() {});
    } 
  };

  adf.mf.internal.api.removeContact = function (commId, requestId, properties) {
    if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.removeContact",
            "CORDOVA_DEBUG",
            adf.mf.util.stringify(properties));
    }

    try
    {
      var contact = navigator.contacts.create(properties);

      contact.remove(
      
        function (data) {
          var contact = data || {};
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK,
                 requestId, contact, function () {}, function () {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.removeContact", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
          }
        },

        function (data) {
          var errorCode = ((data != null) && (data.code != null)) ? data.code : ContactError.UNKNOWN_ERROR;
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK,
               requestId, errorCode, function () {}, function () {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.removeContact", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
          }          
        });
    }
    catch(se)
    {
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
        "navigator.contacts.remove", "ERROR_EXCEPTION", se);
      adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, msg, function() {}, function() {});
    } 
  };

  adf.mf.internal.api.getPicture = function (commId, requestId, cameraOptions) {
    if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.getPicture",
            "CORDOVA_DEBUG", adf.mf.util.stringify(cameraOptions));
    }
    
    try
    {
      navigator.camera.getPicture(
        
        function (data) {
          var imageData = data || {};
          if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.getPicture success",
               "CORDOVA_DEBUG", "");
          }
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK,
               requestId, imageData, function () {}, function () {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.getPicture", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
          }
        },

        function (data) {
          var message = data || {};
          if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.getPicture", "CORDOVA_DEBUG", message);
          }
    
         // Return empty string as image data and call success callback instead of calling failure callback
          var imageData = "";
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK,
               requestId, imageData, function () {}, function () {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.getPicture", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
          }
        }, cameraOptions);
    }
    catch(se)
    {
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
        "navigator.camera.getPicture", "ERROR_EXCEPTION", se);
      adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, msg, function() {}, function() {});
    } 
  };


  adf.mf.internal.api.getDeviceProperties = function(commId, requestId) {
    if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.internal.api.getDeviceProperties", "CORDOVA_DEBUG", "");
    }
    
    try
    {
      adf.mf.api.getDeviceProperties(
      
        function (data) {
          var deviceProperties = data || {};
          if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.getDeviceProperties success",
                "CORDOVA_DEBUG", adf.mf.util.stringify(deviceProperties));
          }
          
          // Replace the phonegap version with the value from device.cordova
          // deviceProperties.device.phonegap = window.device.cordova;
          
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK,
                                             requestId, deviceProperties, function () {}, function () {});
          }
          catch (se)
          {;
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.getDeviceProperties", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
          }                              
        },
        
        function (data) {
          var message = data || {};
          if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.getDeviceProperties failed",
                "CORDOVA_DEBUG", "");
          }
          try
          {
            adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK,
                                             requestId, message, function () {}, function () {});
          }
          catch (se)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.getDeviceProperties", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
          }
        });
    }
    catch(se)
    {
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
        "adf.mf.api.getDeviceProperties", "ERROR_EXCEPTION", se);
      adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, msg, function() {}, function() {});
    }  
  };

  /**
   * INTERNAL FUNCTION used to to remove dot properties from JSON
   */
  adf.mf.internal.removeDotProperties = function(dat)
  {
	  if (dat !== undefined && dat !== null)
	  {
		  if(Array.isArray(dat))
		  {
			  for(var i = 0; i < dat.length; i++)
			  {
				  var retValue = this.removeDotProperties(dat[i]);
				  if (retValue === null)
				  {
					  dat.splice (i, 1);
					  i--;
				  }
			  }
		  }
		  else if(typeof dat === 'object')
		  {
			  for(var property in dat)
			  {
				  if(property !== undefined && property !== null)
				  {
					  if (property == '.null')
					  {
						  if (dat[property] == true)
						  {
							  return null;
						  }
					  }
					  else if (property.indexOf (".") == 0)
					  {
						  // If the property is a dot property, delete it, as those shouldn't be sent to Cordova layer.
						  delete dat[property];
					  }
					  else if((typeof dat[property]) != 'function')
					  {
						  var retValue = this.removeDotProperties(dat[property]);
						  if (retValue === null)
						  {
							  delete dat[property];
						  }
					  }
				  }
			  }
		  }
	  }

	  return dat;
  };

  /**
   * INTERNAL API used for Push Notification 
   * 
   * namespace : adf.mf.internal.api.pushnotifications
   * 
   * methods :
   * 	public :
   * 		register(params)
   * 			Register with APNs/GCM. Calls container.internal.device.integration.PushNotifications(params, tokenHandler, errorHandler)
   * 			@params : JSON formatted registration parameters. Ex : {"badge":"true", "sound":"true"}
   * 	private :
   * 		tokenHandler(request, token)
   * 			Success callback for registration on iOS. Here we use adf.mf.api.invokeMethod to pass on the token to embedded's eventing mechanism.
   * 			@token : Device token received from APNs
   * 		successHandler(request, response)
   * 			Success callback for registration on Android. 
   *            This is merely a success callback for a successful attempt to register - no token is received from GCM at this point.
   * 		errorHandler(request, error)
   * 			Failure callback for registration. Right now not utilized but will be hooked to error handling callbacks in Embedded when they are available.
   * 			@error Error
   * 		onNotificationAPN(notification)
   * 			Called by PushPlugin upon a notification from APNs. Here we use adf.mf.api.invokeMethod to pass on the notification to Embedded's eventing mechanism 
   * 			@notification  JSON object representing notification payload
   * 		onNotificationGCM(notification)
   * 			General event callback used by PushPlugin on Android to report :
   * 				- token upon successful registration with GCM
   * 				- incoming notification event from GCM
   * 				- errors if any
   * 			Calls into tokenHandler/onNotificationAPN in order to pass on data to embedded's eventing mechanism depending on the event type.
   * 			@notification JSON notification event with following keys
   * 				event   : If "registered", its a successful registration callback, if "message" its a notification event
   * 				payload : Value is JSON of notification payload if event is "message"
   * 				regid   : Value is a string representing registration ID issued by GCM in response to a registration request 
   */
  window.PushNotifications = function()
  {
    /* PUBLIC - Register for Push Notifications */
    this.register = function(params)
	{
	  if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
	  {
		adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "PushNotifications", "register", "invoking push notification command.");				
	  }
	  try
	  {
		var isAndroid = (navigator.userAgent.toLowerCase().indexOf("android") != -1);
		if (isAndroid)
		{
		  params['ecb'] = "adf.mf.internal.api.pushnotifications.onNotificationGCM";
		  container.internal.device.integration.PushNotifications.register(params, successHandler, errorHandler);
		} 
		else
		{
		  params['ecb'] = "adf.mf.internal.api.pushnotifications.onNotificationAPN";
		  container.internal.device.integration.PushNotifications.register(params, tokenHandler, errorHandler);
		}
	  }
	  catch(e)
	  {
		adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.internal.api.pushnotifications", "register","PushNotifications.register was not invoked (error="+adf.mf.util.stringify(e)+")");
	  }
	};

	/* PRIVATE - Gets called by PushPlugin on iOS after successful registration */
	var tokenHandler = function(request, token)
	{
	  adf.mf.api.invokeMethod("oracle.adfmf.framework.event.pushnotification.NativePushNotificationEventInterceptor", "receivedToken", token,
		function(req,res)
		{
		  //success
		  if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
          {
             adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.pushnotifications", "tokenHandler",
            		 "Inside the success callback for request " + adf.mf.util.stringify(req) + " with response "+adf.mf.util.stringify(res));
          }
		},
		function(req,res)
		{
		  //failure
		  adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.internal.api.pushnotifications", "tokenHandler",
				  "Inside the failure callback for request " + adf.mf.util.stringify(req) + " with response "+adf.mf.util.stringify(res));
		}
	  );
	};

	/* PRIVATE - Gets called by PushPlugin if there was an error trying to register*/
	var errorHandler = function(request,error)
	{
	  adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.internal.api.pushnotifications", "errorHandler",
			  "There was an error in processing this request : " + adf.mf.util.stringify(request) + ". Error : "+adf.mf.util.stringify(error));
	  adf.mf.api.invokeMethod("oracle.adfmf.framework.event.pushnotification.NativePushNotificationEventInterceptor", "receivedError", adf.mf.util.stringify(error),
		  		function(req,res)
		  		{
		  		  //success
		  		  if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
		  		  {
		  		    adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.pushnotifications", "errorHandler", 
		  		    		"Inside the success callback for request " + adf.mf.util.stringify(req) + " with response "+adf.mf.util.stringify(res));
		  		  }
		  		},
		  		function(req,res)
		  		{
		  		  //failure
		  		  adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.internal.api.pushnotifications", "errorHandler", 
		  				  "Inside the failure callback for request " + adf.mf.util.stringify(req) + " with response "+adf.mf.util.stringify(res));
		  		}
	  );
	};

	/* PRIVATE - Gets called by PushPlugin if the call to register on Android succeeded */
	var successHandler = function(request,response)
	{
	  if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.pushnotifications", "successHandler",
        		"Request: " + adf.mf.util.stringify(request) + " Response: "+adf.mf.util.stringify(response));
      }
	};

	/* PRIVATE Gets called by PushPlugin on iOS when notification arrives */
	this.onNotificationAPN = function(notification)
	{
	  //appState
      var appState = 0;
      if(notification.triggersStartup === "true")
      {
    	appState = 1;  
      }
      else if(notification.foreground === "0")
	  {
	    appState = 2;
      }
      else if(notification.foreground === "1")
	  {
		appState = 3;
	  } 
      
      //token
      var token = "";
      if(notification.hasOwnProperty('deviceToken'))
      {
        token = notification.deviceToken;
      }
      
	  adf.mf.api.invokeMethod("oracle.adfmf.framework.event.pushnotification.NativePushNotificationEventInterceptor", "receivedRemoteNotification", JSON.stringify(notification), appState, token,
		function(req,res)
		{
		  //success
		  if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
          {
             adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.pushnotifications", "onNotificationAPN",
            		 "Inside the success callback for request " + adf.mf.util.stringify(req) + " with response "+adf.mf.util.stringify(res));
          }
		},
		function(req,res)
		{
	      //failure
		  adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.internal.api.pushnotifications", "onNotificationAPN", 
				  "Inside the failure callback for request " + adf.mf.util.stringify(req) + " with response "+adf.mf.util.stringify(res));
		}
	  );
	};

	/* PRIVATE Gets called by PushPlugin on Android when a notification event (registration success, registration failure, incoming notification) occurs */
	this.onNotificationGCM = function(notification)
	{
	  switch( notification.event )
	  {
	    case 'registered':
	      if (notification.regid.length > 0)
		  {
		    tokenHandler(null,notification.regid);
		  }
		  break;
		  
        case 'message':
          //appState
          var appState = 0;
		  if(notification.coldstart)
		  {
		    appState = 1;    
		  }
		  else if(notification.foreground)
		  {
		    appState = 3;
		  } 
		  else
		  {
		    appState = 2;  
		  }
		  
	      //token
	      var token = "";
	      if(notification.payload.hasOwnProperty('deviceToken'))
	      {
            token = notification.payload.deviceToken;
          }
	      
		  adf.mf.api.invokeMethod("oracle.adfmf.framework.event.pushnotification.NativePushNotificationEventInterceptor", "receivedRemoteNotification", JSON.stringify(notification.payload), appState, token,
		    function(req,res)
		    {
			   //success
			   if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
			   {
			      adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api.pushnotifications", "onNotificationGCM",
			    		  "Inside the success callback for request " + adf.mf.util.stringify(req) + " with response "+adf.mf.util.stringify(res));
			    }
		    },
			function(req,res)
			{
			  //failure
			  adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.internal.api.pushnotifications", "onNotificationGCM",
					  "Inside the failure callback for request " + adf.mf.util.stringify(req) + " with response "+adf.mf.util.stringify(res));
			}
		  );
		  break;

        case 'error':
          adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.internal.api.pushnotifications", "onNotificationGCM", 
  				  "Error Received : "+JSON.stringify(notification));
          errorHandler(null, notification.error);
		  break;

		default:
		  // Unknown, an event was received and we do not know what it is
		  break;
	  }
    };
  };
  adf.mf.internal.api.pushnotifications = new PushNotifications();
  
  /**
   * Local Notifications
   * 
   * @namespace
   */
  adf.mf.api.localnotification = 
  {
    /**
     * Schedule a local notification
     *
     * @param {Object} options - notification options
     * @param {string} options.title - notification title
     * @param {string} options.alert - notification alert
     * @param {Date} options.date - date at which notification needs to be triggered
     * @param {Number} options.badge - application icon will be badged by this number when notification is triggered
     * @param {string} options.sound - set it to 'SYSTEM_DEFAULT' to play the default system sound upon a notification
     * @param {string} options.vibration - set it to 'SYSTEM_DEFAULT' for default system vibration upon a notification
     * @param {Object} options.payload - custom payload to be sent via notification
     * @param {successCallback} scb - success callback
     * @param {errorCallback} ecb  - error callback 
     */
    add: function(options, scb, ecb)
    {
  	  var successHandler = function(request, response) 
  	  {
  	    if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
  		{
  		  adf.mf.log.Framework.logp(adf.mf.log.level.FINE,
  				  "adf.mf.api.localnotification.add",
  				  "successHandler", "Request: "
  				  + adf.mf.util.stringify(request)
  				  + " Response: "
  				  + adf.mf.util.stringify(response));
  	    }
  	    if (typeof(scb) == typeof(Function))
  	      scb(request,response);
  	  };

      var errorHandler = function(request,error)
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.api.localnotification.add", "errorHandler",
        		"There was an error in processing this request : " + adf.mf.util.stringify(request) + ". Error : "+adf.mf.util.stringify(error));
        if (typeof(ecb) == typeof(Function))
          ecb(request, error);
      };
          
  	  if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
  	  {
  		adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "LocalNotification", "add", "invoking local notification command.");
  	  }
  	  
  	  try
  	  {
          container.internal.device.integration.LocalNotification.add(options, successHandler, errorHandler);
  	  }
  	  catch(e)
  	  {
  		adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.api.localnotification", "add","LocalNotification.add was not invoked (error="+adf.mf.util.stringify(e)+")");
  	  }
  	},
  	
    /**
     * Cancel a scheduled local notification
     *
     * @param {string} notificationId - id of the scheduled notification that needs to be cancelled
     * @param {successCallback} scb - success callback
     * @param {errorCallback} ecb - error callback 
     */
    cancel: function(notificationId, scb, ecb)
    {
      var successHandler = function(request, response) 
  	  {
  	    if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE)) 
  		{
  		  adf.mf.log.Framework.logp(adf.mf.log.level.FINE,
  				  "adf.mf.api.localnotification.cancel",
  				  "successHandler", "Request: "
  				  + adf.mf.util.stringify(request)
  				  + " Response: "
  				  + adf.mf.util.stringify(response));
  	    }
  	    if (typeof(scb) == typeof(Function))
  	      scb(request,response);
  	  };

      var errorHandler = function(request,error)
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.api.localnotification.cancel", "errorHandler",
        		"There was an error in processing this request : " + adf.mf.util.stringify(request) + ". Error : "+adf.mf.util.stringify(error));
        if (typeof(ecb) == typeof(Function))        
          ecb(request, error);
      };
          
  	  if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
  	  {
  		adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "LocalNotification", "cancel", "invoking local notification command.");
  	  }
  	  try
  	  {
        container.internal.device.integration.LocalNotification.cancel(notificationId, successHandler, errorHandler);
  	  }
  	  catch(e)
  	  {
  		adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.api.localnotification", "cancel","LocalNotification.cancel was not invoked (error="+adf.mf.util.stringify(e)+")");
  	  }
    }
    
    /**
     * Success Callback
     *
     * @callback successCallback
     * @param {Object} request - request
     * @param {Object} response - response
     * @param {string} response.id - id of the notification
     */
    
    /**
     * Error Callback
     *
     * @callback errorCallback
     * @param {Object} request - request
     * @param {Object} response - response
     */    
  };
  
  /**
   * Internal API used for local notifications
   *
   * These methods are to be used only by the embedded java code
   */
  adf.mf.internal.api.localnotification = adf.mf.internal.api.localnotification || function()
  {
  };

  adf.mf.internal.api.localnotification.add = adf.mf.internal.api.localnotification.add || function(commId, requestId, params)
  { 
	  container.internal.device.integration.LocalNotification.add(params,
			  function(request,result) /* Success callback */
			  {
		  		var responseData = result.id || {};
		  		try
		  		{
		  			adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, responseData, function() {}, function() {});
		  		}
		  		catch (se)
		  		{
		  			adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
		  					"adf.mf.internal.api.localnotification.add", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
		  		}
			  },
			  function(request,result) /* Error callback */
			  {
				  var responseData = result || {};
				  try 
				  {
					  adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, responseData, function() {}, function() {});
				  }
				  catch (se)
				  {
					  adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
							  "adf.mf.internal.api.localnotification.add", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
				  }
			  });
  };
  
  adf.mf.internal.api.localnotification.cancel = adf.mf.internal.api.localnotification.cancel || function(commId, requestId, params)
  { 
	  container.internal.device.integration.LocalNotification.cancel(params,
			  function(request,result) /* Success callback */
			  {
		  		var responseData = result.id || {};
		  		try
		  		{
		  			adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, responseData, function() {}, function() {});
		  		}
		  		catch (se)
		  		{
		  			adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
		  					"adf.mf.internal.api.localnotification.cancel", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
		  		}
			  },
			  function(request,result) /* Error callback */
			  {
				  var responseData = result || {};
				  try 
				  {
					  adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, responseData, function() {}, function() {});
				  }
				  catch (se)
				  {
					  adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
							  "adf.mf.internal.api.localnotification.cancel", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
				  }
			  });
  };
  
  /**
   * Internal API used for sliding window plugins
   *
   * These methods are to be used only by the embedded java code
   */
 adf.mf.internal.api.slidingwindow = adf.mf.internal.api.slidingwindow || function()
 {
 };
 
 adf.mf.internal.api.slidingwindow.create =  adf.mf.internal.api.slidingwindow.create || function(commId, requestId, featureId)
 {
    container.internal.device.integration.SlidingWindow.create(featureId,
        function(request,result) /* Success callback */
        {
            var responseData = result || {};
             try
               {
                   adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, responseData, function() {}, function() {});
               }
               catch (se)
               {
                   adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                          "adf.mf.internal.api.slidingwindow.create", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
               }
        },
       function(request,result) /* Error callback */
       {
           var responseData = result || {};
       try 
       {
           adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, responseData, function() {}, function() {});
       }
       catch (se)
       {
           adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                  "adf.mf.internal.api.slidingwindow.create", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
        }
    });
 };

 adf.mf.internal.api.slidingwindow.show =  adf.mf.internal.api.slidingwindow.show || function(commId, requestId, windowId, options)
 {
    container.internal.device.integration.SlidingWindow.show(windowId, options,
        function(request,result) /* Success callback */
        {
            var responseData = result || {};
             try
               {
                   adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, "true", function() {}, function() {});
               }
               catch (se)
               {
                   adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                          " adf.mf.internal.api.slidingwindow.show", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
               }
        },
       function(request,result) /* Error callback */
       {
           var responseData = result || {};
       try 
       {
           adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, "false", function() {}, function() {});
       }
       catch (se)
       {
           adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                  " adf.mf.internal.api.slidingwindow.show", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
        }
    });
 };
 
  adf.mf.internal.api.slidingwindow.hide =  adf.mf.internal.api.slidingwindow.hide || function(commId, requestId, windowId)
 {
    container.internal.device.integration.SlidingWindow.hide(windowId, 
        function(request,result) /* Success callback */
        {
            var responseData = result || {};
             try
               {
                   adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, "true", function() {}, function() {});
               }
               catch (se)
               {
                   adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                          " adf.mf.internal.api.slidingwindow.hide", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
               }
        },
       function(request,result) /* Error callback */
       {
           var responseData = result || {};
       try 
       {
           adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, "false", function() {}, function() {});
       }
       catch (se)
       {
           adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                  " adf.mf.internal.api.slidingwindow.hide", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
        }
    });
 };
 
  adf.mf.internal.api.slidingwindow.destroy =  adf.mf.internal.api.slidingwindow.destroy || function(commId, requestId, windowId)
 {
    container.internal.device.integration.SlidingWindow.destroy(windowId, 
        function(request,result) /* Success callback */
        {
            var responseData = result || {};
             try
               {
                   adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, "true", function() {}, function() {});
               }
               catch (se)
               {
                   adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                          " adf.mf.internal.api.slidingwindow.destroy", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
               }
        },
       function(request,result) /* Error callback */
       {
           var responseData = result || {};
       try 
       {
           adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, "false", function() {}, function() {});
       }
       catch (se)
       {
           adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                  " adf.mf.internal.api.slidingwindow.destroy", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
        }
    });
 };
 
 adf.mf.internal.api.slidingwindow.getWindowInfo =  adf.mf.internal.api.slidingwindow.getWindowInfo || function(commId, requestId, windowId)
 {
    container.internal.device.integration.SlidingWindow.getWindowInfo(windowId, 
        function(request,result) /* Success callback */
        {
            var responseData = result || {};
             try
               {
                   adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, responseData, function() {}, function() {});
               }
               catch (se)
               {
                   adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                          " adf.mf.internal.api.slidingwindow.destroy", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
               }
        },
       function(request,result) /* Error callback */
       {
           var responseData = result || {};
       try 
       {
           adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, responseData, function() {}, function() {});
       }
       catch (se)
       {
           adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                  " adf.mf.internal.api.slidingwindow.destroy", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
        }
    });
 };
 
 adf.mf.internal.api.slidingwindow.getWindowInfo =  adf.mf.internal.api.slidingwindow.getWindowInfo || function(commId, requestId, windowId)
 {
    container.internal.device.integration.SlidingWindow.getWindowInfo(windowId, 
        function(request,result) /* Success callback */
        {
            var responseData = result || {};
             try
               {
                   adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, responseData, function() {}, function() {});
               }
               catch (se)
               {
                   adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                          " adf.mf.internal.api.slidingwindow.destroy", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
               }
        },
       function(request,result) /* Error callback */
       {
           var responseData = result || {};
       try 
       {
           adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, responseData, function() {}, function() {});
       }
       catch (se)
       {
           adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                  " adf.mf.internal.api.slidingwindow.destroy", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
        }
    });
 };
 
 adf.mf.internal.api.slidingwindow.getTopWindowId =  adf.mf.internal.api.slidingwindow.getTopWindowId || function(commId, requestId)
 {
    container.internal.device.integration.SlidingWindow.getTopWindowId( 
        function(request,result) /* Success callback */
        {
            var responseData = result || {};
             try
               {
                   adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, responseData, function() {}, function() {});
               }
               catch (se)
               {
                   adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                          " adf.mf.internal.api.slidingwindow.getTopWindowId", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
               }
        },
       function(request,result) /* Error callback */
       {
           var responseData = result || {};
       try 
       {
           adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, responseData, function() {}, function() {});
       }
       catch (se)
       {
           adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                  " adf.mf.internal.api.slidingwindow.getTopWindowId", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
        }
    });
 };
 
 adf.mf.internal.api.slidingwindow.getWindowIds =  adf.mf.internal.api.slidingwindow.getWindowIds || function(commId, requestId)
 {
    container.internal.device.integration.SlidingWindow.getWindowIds( 
        function(request,result) /* Success callback */
        {
            var responseData = result || {};
             try
               {
                   adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, responseData, function() {}, function() {});
               }
               catch (se)
               {
                   adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                          " adf.mf.internal.api.slidingwindow.getWindowIds", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
               }
        },
       function(request,result) /* Error callback */
       {
           var responseData = result || {};
       try 
       {
           adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, responseData, function() {}, function() {});
       }
       catch (se)
       {
           adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                  " adf.mf.internal.api.slidingwindow.getWindowIds", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
        }
    });
 };   
 
 adf.mf.internal.api.slidingwindow.getCurrentWindowId =  adf.mf.internal.api.slidingwindow.getCurrentWindowId || function(commId, requestId)
 {
    container.internal.device.integration.SlidingWindow.getCurrentWindowId( 
        function(request,result) /* Success callback */
        {
            var responseData = result || {};
             try
               {
                   adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_SUCCESS_CALLBACK, requestId, responseData, function() {}, function() {});
               }
               catch (se)
               {
                   adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                          " adf.mf.internal.api.slidingwindow.getCurrentWindowId", "ERROR_IN_REQUEST", ASYNC_SUCCESS_CALLBACK, se);
               }
        },
       function(request,result) /* Error callback */
       {
           var responseData = result || {};
       try 
       {
           adf.mf.internal.api.invokeMethod(commId, ADFMF_CONTAINER_UTILITIES_INTERNAL, ASYNC_FAILED_CALLBACK, requestId, responseData, function() {}, function() {});
       }
       catch (se)
       {
           adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                                  " adf.mf.internal.api.slidingwindow.getCurrentWindowId", "ERROR_IN_REQUEST", ASYNC_FAILED_CALLBACK, se);
        }
    });
 };   
 
  /**
  * PUBLIC FUNCTION used to set the status bar style on iOS
  *
  * e.g. adf.mf.api.setStatusBarStyle(style, callback)
  *
  * The style may be one of the following values
  *    "dark"   : A dark status bar, intended for use on light backgrounds.
  *    "light"  : A light status bar, intended for use on dark backgrounds.
  *
  * @param {string} style     the style to set.  either "dark" or "light"
  * @param {function(string)} callback - function is called back with the current style as the argument
  *                                      can be null
  *
  * Example:
  *      adf.mf.api.setStatusBarStyle("dark", function(style) { console.log("new style: " + style); });
  */
  adf.mf.api.setStatusBarStyle = function(style, callback)
  {
   cordova.exec( function(result) { if (callback) { callback(result);} } , function() { }, "ADFMobileShell", "setStatusBarStyle", [style]);
  }

  /**
  * PUBLIC FUNCTION used to get the status bar style on iOS
  *
  * e.g. adf.mf.api.getStatusBarStyle(callback)
  *
  * The callback function will be invoked with a single string argument which will be one of
  *    "dark"   : A dark status bar, intended for use on light backgrounds.
  *    "light"  : A light status bar, intended for use on dark backgrounds.
  *
  * @param {function(string)} callback - function is called back with the current style as the argument
  *                                      can be null
  *
  * Example:
  *      adf.mf.api.getStatusBarStyle(function(style) { console.log("current style: " + style); });
  */
  adf.mf.api.getStatusBarStyle = function(callback)
  {
   cordova.exec( function(result) { if (callback) { callback(result); } } , function() { }, "ADFMobileShell", "getStatusBarStyle", []);
  }
 
})();


/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/ContainerIntegration.js///////////////////////////////////////



/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/ELErrors.js///////////////////////////////////////

/* Copyright (c) 2011, 2014, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- ELErrors.js ---------------------- */

var adf                    = window.adf                 || {};
adf.mf                     = adf.mf                     || {};
adf.mf.api                 = adf.mf.api                 || {};
adf.mf.el                  = adf.mf.el                  || {};
adf.mf.locale              = adf.mf.locale              || {};
adf.mf.log                 = adf.mf.log                 || {};
adf.mf.resource            = adf.mf.resource            || {};
adf.mf.util                = adf.mf.util                || {};

adf.mf.internal            = adf.mf.internal            || {};
adf.mf.internal.api        = adf.mf.internal.api        || {};
adf.mf.internal.el         = adf.mf.internal.el         || {};
adf.mf.internal.el.parser  = adf.mf.internal.el.parser  || {};
adf.mf.internal.locale     = adf.mf.internal.locale     || {};
adf.mf.internal.log        = adf.mf.internal.log        || {};
adf.mf.internal.mb         = adf.mf.internal.mb         || {};
adf.mf.internal.perf       = adf.mf.internal.perf       || {};
adf.mf.internal.perf.story = adf.mf.internal.perf.story || {};
adf.mf.internal.resource   = adf.mf.internal.resource   || {};
adf.mf.internal.util       = adf.mf.internal.util       || {};


/*
 * Represents any of the ADF flavored exceptions
 */
adf.mf.AdfException = function(message) { 
	/* since this is the only exception that is know and sent to both sides of the channel it needs to match the Java type */ 
	this[adf.mf.internal.api.constants.TYPE_PROPERTY]           = "oracle.adfmf.framework.exception.AdfException";
	this[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] = true;
	this.name                                                   = 'AdfException';
	this.message                                                = (message || "");
	this.stack													= (new Error()).stack;
};
adf.mf.AdfException.prototype = new Error();


/*
 * Represents any of the exception conditions that can arise during expression evaluation.
 */
adf.mf.ELException = function(message) { 
	this[adf.mf.internal.api.constants.TYPE_PROPERTY]           = "oracle.adfmf.framework.exception.ELException";
	this[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] = true;
	this.name                                                   = 'ELException';
	this.message                                                = (message || "");
	this.stack													= (new Error()).stack;
};
adf.mf.ELException.prototype = new Error();


/**
 * Thrown to indicate that a method has been passed an illegal or 
 * inappropriate argument.
 */
adf.mf.IllegalArgumentException = function(message) { 
	this[adf.mf.internal.api.constants.TYPE_PROPERTY]           = "oracle.adfmf.framework.exception.IllegalArgumentException";
	this[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] = true;
	this.name                                                   = 'IllegalArgumentException';
	this.message                                                = (message || "");
	this.stack													= (new Error()).stack;
};
adf.mf.IllegalArgumentException.prototype = new Error();

/**
 * Thrown to indicate that an array is being accessed beyond
 * it array boundaries.
 */
adf.mf.IndexOutOfBoundsException = function(message) { 
	this[adf.mf.internal.api.constants.TYPE_PROPERTY]           = "oracle.adfmf.framework.exception.IndexOutOfBoundsException";
	this[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] = true;
	this.name                                                   = 'IndexOutOfBoundsException';
	this.message                                                = (message || "");
	this.stack													= (new Error()).stack;
};
adf.mf.IndexOutOfBoundsException.prototype = new Error();

/**
 * Thrown to indicate that the channel is not available.
 */
adf.mf.NoChannelAvailableException = function(message) { 
	this[adf.mf.internal.api.constants.TYPE_PROPERTY]           = "oracle.adfmf.framework.exception.NoChannelAvailableException";
	this[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] = true;
	this.name                                                   = 'NoChannelAvailableException';
	this.message                                                = (message || "Operation not supported in the current environment");
	this.stack													= (new Error()).stack;
};     
adf.mf.NoChannelAvailableException.prototype = new Error();


/**
 * Thrown to indicate that a null pointer has been encountered.
 */
adf.mf.NullPointerException = function(message) { 
	this[adf.mf.internal.api.constants.TYPE_PROPERTY]           = "oracle.adfmf.framework.exception.NullPointerException";
	this[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] = true;
	this.name                                                   = 'NullPointerException';
	this.message                                                = (message || "");
	this.stack													= (new Error()).stack;
};
adf.mf.NullPointerException.prototype = new Error();


/**
 * Thrown to indicate that a illegal state has been encountered.
 */
adf.mf.IllegalStateException = function(message) { 
	this[adf.mf.internal.api.constants.TYPE_PROPERTY]           = "oracle.adfmf.framework.exception.IllegalStateException";
	this[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] = true;
	this.name                                                   = 'IllegalStateException';
	this.message                                                = (message || "");
	this.stack													= (new Error()).stack;
};
adf.mf.IllegalStateException.prototype = new Error();


/**
 * Thrown when a property could not be found while evaluating a {@link adf.mf.el.ValueExpression} or
 * {@link MethodExpression}. For example, this could be triggered by an index out of bounds while
 * setting an array value, or by an unreadable property while getting the value of a JavaBeans
 * property.
 */
adf.mf.PropertyNotFoundException = function(message) { 
	this[adf.mf.internal.api.constants.TYPE_PROPERTY]           = "oracle.adfmf.framework.exception.PropertyNotFoundException";
	this[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] = true;
	this.name                                                   = 'PropertyNotFoundException';
	this.message                                                = (message || "");
	// Uncomment this if you want to track where the exception is coming from:
	//this.stack													= (new Error()).stack;
};
adf.mf.PropertyNotFoundException.prototype = new Error();


/**
 * Thrown when a property could not be written to while setting the value on a
 * {@link adf.mf.el.ValueExpression}. For example, this could be triggered by trying to set a map value on an
 * unmodifiable map.
 */
adf.mf.PropertyNotWritableException = function(message) { 
	this[adf.mf.internal.api.constants.TYPE_PROPERTY]           = "oracle.adfmf.framework.exception.PropertyNotWritableException";
	this[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] = true;
	this.name                                                   = 'PropertyNotWritableException';
	this.message                                                = (message || "");
	this.stack													= (new Error()).stack;
};
adf.mf.PropertyNotWritableException.prototype = new Error();


/**
 * Thrown to indicate that the requested operation is not supported.
 */
adf.mf.UnsupportedOperationException = function(message) { 
	this[adf.mf.internal.api.constants.TYPE_PROPERTY]           = "oracle.adfmf.framework.exception.UnsupportedOperationException";
	this[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] = true;
	this.name                                                   = 'UnsupportedOperationException';
	this.message                                                = (message || "");
	this.stack													= (new Error()).stack;
};
adf.mf.UnsupportedOperationException.prototype = new Error();


adf.mf.DataRangeNotPresentException = function(message) {
	this[adf.mf.internal.api.constants.TYPE_PROPERTY]           = "oracle.adfmf.framework.exception.DataRangeNotPresentException";
	this[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] = true;
	this.name                                                   = 'DataRangeNotPresentException';
	this.message                                                = (message || "");
	this.stack													= (new Error()).stack;
};
adf.mf.DataRangeNotPresentException.prototype = new Error();



/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/ELErrors.js///////////////////////////////////////



/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/JavaScriptContext.js///////////////////////////////////////

/* Copyright (c) 2011, 2014, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- JavaScriptContext.js ---------------------- */
//@requires ELErrors
//@requires AdfPerfTiming


var adf                   = window.adf || {};
adf.mf                    = adf.mf || {};
adf.mf.api                = adf.mf.api || {};
adf.mf.el                 = adf.mf.el || {};
adf.mf.locale             = adf.mf.locale || {};
adf.mf.log                = adf.mf.log || {};
adf.mf.resource           = adf.mf.resource || {};
adf.mf.util               = adf.mf.util || {};

adf.mf.internal           = adf.mf.internal || {};
adf.mf.internal.api       = adf.mf.internal.api || {};
adf.mf.internal.el        = adf.mf.internal.el || {};
adf.mf.internal.el.parser = adf.mf.internal.el.parser || {};
adf.mf.internal.locale    = adf.mf.internal.locale || {};
adf.mf.internal.log       = adf.mf.internal.log || {};
adf.mf.internal.mb        = adf.mf.internal.mb || {};
adf.mf.internal.perf      = adf.mf.internal.perf || {};
adf.mf.internal.resource  = adf.mf.internal.resource || {};
adf.mf.internal.util      = adf.mf.internal.util || {};

/**
 * JavaScriptContext is defined here.  It is an internal object but depends on
 * a couple helper objects (JavaScriptFunctions and JavaScriptVariables) that
 * are defined here as well.  Since only the JavaScriptContext must be exposed
 * to other internal objects, it will have an adf.mf.internal.el namespace.  The
 * others are never exposed and are only local to this initialization function.
 */
(function() {
  /* private to the JavaScriptContext object */
  function JavaScriptFunctions() { /* implements FunctionMapper */
    /* map from function name to function implementation */
    this.map   = null;

    /* function */
    this.resolveFunction = function(/* String */ prefix, /* String */ localName) {
      if (this.map === null) {
        this.map = {};
      }
      return this.map[prefix + ":" + localName];
    };

    /* void */
    this.setFunction = function(/* String */ prefix, /* String */ localName, /* Function */ func) {
      if (this.map === null) {
        this.map = {};
      }
      this.map[prefix + ":" + localName] = func;
    };
  };

  /* private to the JavaScriptContext object */
  function JavaScriptVariables()  { /* implements VariableMapper */
    /* map from variable name to variable's value */
    this.map         = null;
    this.nextModLZWCode  = 0;

    /* adf.mf.el.ValueExpression */
    this.resolveVariable = function(/* String */ variable) {
      if (this.map === null) {
        this.map = {};
      }
      return this.map[variable];
    };

    /* adf.mf.el.ValueExpression */
    this.setVariable = function(/* String */ variable, /* value */ value) {
      if (this.map === null) {
        this.map = {};
      }

      this.map[variable] = value;

      return this.map[variable];
    };

    /* void */
    this.removeVariable = function(/* String */ variable) {
      if(this.map !== null) {
        if(this.map[variable] !== undefined) {
          delete this.map[variable];
        }
      }
    };

    /* void */
    this.clearWeakReferences = function() {
      if(this.map !== null) {
        for(var v in this.map) {
          if(this.map[v][adf.mf.internal.api.constants.WEAK_REFERENCE_PROPERTY] !== undefined) {
            if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
            {
             adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
              "JavaScriptVariables","clearWeakReferences",
              "removing weak ref - " + v);
            }
            delete this.map[v];
          }
        }
        this.nextModLZWCode = 0;
      }
    };

    /* String */
    this.resolveWeakReference = function(/* String */ variable) {
      var v = this.resolveVariable(variable);

      if(v != undefined) {
        return v[adf.mf.internal.api.constants.WEAK_REFERENCE_PROPERTY];
      }
      return undefined;
    };

    /* String */
    this.getWeakReference = function(/* string */ name) {
      if(this.map !== null) {
        for(var v in this.map) {
          var fqn = this.map[v][adf.mf.internal.api.constants.WEAK_REFERENCE_PROPERTY];

          if((fqn !== undefined) && (name.indexOf(fqn) == 0))
          {
            var wrn = v + name.substring(fqn.length);

            if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
            {
              adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
               "JavaScriptVariables", "getWeakReference",
               "just found weak ref - " + wrn);
            }

            return wrn;
          }
        }
      }
      return undefined;
    };

    /* String */
    this.findMatchingWeakReference = function(/* string */ name) {
      if(this.map !== null) {
        for(var v in this.map) {
          var fqn = this.map[v][adf.mf.internal.api.constants.WEAK_REFERENCE_PROPERTY];

          if((fqn !== undefined) && (name == fqn))
          {
            return v;
          }
        }
      }
      return undefined;
    };

    /* String */
    this.addCompressedReference = function(/* string */ reference)
    {
      var lzwk = this.findMatchingWeakReference(reference);

      if(lzwk == undefined) {
        var key  = adf.mf.internal.api.constants.WEAK_REFERENCE_PROPERTY;
        var wr  = {};

        wr[key] = reference;
        lzwk   = "_" + (this.nextModLZWCode++);

        if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
           "JavaScriptVariables", "addCompressedReference",
           "just added a weak ref - " + wr);
        }
        this.setVariable(lzwk, wr);
      }

      return lzwk;
    };
  };

  /* Still internal but exposed to the other internal objects */
  adf.mf.internal.el.JavaScriptContext = function(/* ELResolver */ elResolver) { /* implements ELContext */
    this.context        = this;
    this.functions      = null;
    this.resolver       = (elResolver || null);
    this.variables      = null;
    this.queue         = null;
    this.vmchannel      = null;
    this.security       = null;
    this.modid         = (new Date()).getTime();

    /**
     * Get the modification id for the context.
     */
    /* int */
    this.getModId = function() {
      return this.modid;
    };

    /**
     * Update the modification id for the context.
     */
    /* void */
    this.updateModId = function() {
      this.modid = (new Date()).getTime();
    };

    /**
     * Returns the context object associated with the given key. The ELContext maintains a
     * collection of context objects relevant to the evaluation of an expression. These context
     * objects are used by ELResolvers. This method is used to retrieve the context with the given
     * key from the collection. By convention, the object returned will be of the type specified by
     * the key. However, this is not required and the key is used strictly as a unique identifier.
     *
     * @param key
     *        The unique identifier that was used to associate the context object with this
     *        ELContext.
     * @return The context object associated with the given key, or null if no such context was
     *      found.
     * @throws NullPointerException
     *         if key is null.
     */
    /* ELContext */
    this.getContext = function(/* Class */ key) {
      /* first check to make sure we have a context to give back */
      if((this.context === undefined) || (this.context === null)) {
        return null;
      }

      /* next check that they passed a key and if not return the root context */
      if(key === undefined)  {
        return this.context;
      }

      /* looks like we have everything so return the key'ed context */
      return this.context[key];
    };


    /**
     * Retrieves the ELResolver associated with this context. The ELContext maintains a reference to
     * the ELResolver that will be consulted to resolve variables and properties during an
     * expression evaluation. This method retrieves the reference to the resolver. Once an ELContext
     * is constructed, the reference to the ELResolver associated with the context cannot be
     * changed.
     *
     * @return The resolver to be consulted for variable and property resolution during expression
     *      evaluation.
     */
    /* ELResolver */
    this.getELResolver = function() {
      if (this.resolver === null) {
    this.resolver = new VariableResolver();

        /* add some scopes to the context */
        this.getVariableMapper().setVariable("viewScope",      {});
        this.getVariableMapper().setVariable("pageFlowScope",   {});
        this.getVariableMapper().setVariable("applicationScope", {});
        /*
        * Represents #{feature} implicit object that allows developers to access runtime state of the feature.
        * The name intentionally does not end with "Scope" as it is more of a context.
        * This constant is defined in Java in oracle.adfmf.Constants, and both names need to be kept in sync.
        */
        this.getVariableMapper().setVariable("feature",       {});
        this.getVariableMapper().setVariable("preferenceScope",  {});
        this.getVariableMapper().setVariable("validationScope",  {});
        this.getVariableMapper().setVariable("deviceScope", {"device": {}, "hardware": {"screen": {}}});
      }
      return this.resolver;
    };


    /**
     * Retrieves the FunctionMapper associated with this ELContext.
     *
     * @return The function mapper to be consulted for the resolution of EL functions.
     */
    /* FunctionMapper */
    this.getFunctionMapper = function() {
      if (this.functions === null) {
        this.functions = new JavaScriptFunctions();
      }
      return this.functions;
    };


    /**
     * Retrieves the VariableMapper associated with this ELContext.
     *
     * @return The variable mapper to be consulted for the resolution of EL variables.
     */
    /* VariableMapper */
    this.getVariableMapper = function() {
      if (this.variables === null) {
        this.variables = new JavaScriptVariables();
      }
      return this.variables;
    };


    /**
     * Returns whether an {@link ELResolver} has successfully resolved a given (base, property)
     * pair. The {@link CompositeELResolver} checks this property to determine whether it should
     * consider or skip other component resolvers.
     *
     * @return The variable mapper to be consulted for the resolution of EL variables.
     * @see CompositeELResolver
     */
    /* boolean */
    this.isPropertyResolved = function() {
      return this.resolved;
    };


    /**
     * Associates a context object with this ELContext. The ELContext maintains a collection of
     * context objects relevant to the evaluation of an expression. These context objects are used
     * by ELResolvers. This method is used to add a context object to that collection. By
     * convention, the contextObject will be of the type specified by the key. However, this is not
     * required and the key is used strictly as a unique identifier.
     *
     * @param key
     *        The key used by an {@link ELResolver} to identify this context object.
     * @param contextObject
     *        The context object to add to the collection.
     * @throws NullPointerException
     *         if key is null or contextObject is null.
     */
    /* void */
    this.putContext = function(/* Class */ key, /* object */ contextObject) {
      if((this.context === undefined) || (this.context === null)){
        this.context = {};
      }
      if((key === undefined) || (key === null)) {
        throw Error("invalid key");
      }

      if((contextObject === undefined) || (contextObject === null)) {
        throw Error("invalid context object");
      }

      this.context[key] = contextObject;
    };


    /* void */
    this.setELResolver = function(/* ELResolver */ resolver) {
      this.resolver = resolver;
    };


    /* void */
    this.setFunction = function(/* String */ prefix, /* String */ localName, /* Function */ func) {
      if (this.functions === null) {
        this.functions = new JavaScriptFunctions();
      }
      this.functions.setFunction(prefix, localName, func);
    };


    /**
     * Called to indicate that a ELResolver has successfully resolved a given (base, property) pair.
     * The {@link CompositeELResolver} checks this property to determine whether it should consider
     * or skip other component resolvers.
     *
     * @param resolved
     *        true if the property has been resolved, or false if not.
     * @see CompositeELResolver
     */
    /* void */
    this.setPropertyResolved = function(/* boolean */ resolved) {
      this.resolved = resolved;
    };



    /* void */
    this.clearWeakReferences = function() {
      if (this.variables === null) {
        this.variables = new JavaScriptVariables();
      }
      return this.variables.clearWeakReferences();
    };

    /* String */
    this.getWeakReference = function(/* String */ name) {
      if (this.variables === null) {
        this.variables = new JavaScriptVariables();
      }

      return this.variables.getWeakReference(name);
    };


    /* String */
    this.addCompressedReference = function(/* String */ name) {
      if (this.variables === null) {
        this.variables = new JavaScriptVariables();
      }

      return this.variables.addCompressedReference(name);
    };

    this.uncompressReference = function(/* ELExpression */ elExpression)
    {
      try
      {
        if (this.variables == null)
        {
          return elExpression;
        }

        var token = elExpression.tokens [0];
        var result = this.variables.resolveWeakReference(token.index);

        if (!result)
        {
          return elExpression;
        }

        if (result == token.index)
        {
          return elExpression;
        }

        var replacement = {};
        replacement[token.index] = result;

        return elExpression.stripLocalValues(false, replacement, false);
      }
      catch(err)
      {
        return elExpression;
      }
    };

    /* object */
    this.getVariable = function(/* String */ name) {
      if (this.variables === null) {
        this.variables = new JavaScriptVariables();
      }

      return this.variables.resolveVariable(name);
    };


    /* void */
    this.setVariable = function(/* String */ name, /* adf.mf.el.ValueExpression */ expression) {
      if (this.variables === null) {
        this.variables = new JavaScriptVariables();
      }
      // adf.mf.internal.perf.trace("JavaScriptContext.setVariable", name);
      return this.variables.setVariable(name, expression);
    };


    /* void */
    this.removeVariable = function(/* String */ name) {
      if (this.variables === null) {
        this.variables = new JavaScriptVariables();
      }
      // adf.mf.internal.perf.trace("JavaScriptContext.removeVariable", name);
      return this.variables.removeVariable(name);
    };


       /* void */
   this.pushVariable = function(/* String */name, /* adf.mf.el.ValueExpression */expression) {
    var prevValue = undefined;

    if (this.variables === null) {
      this.variables = new JavaScriptVariables();
    }

    prevValue = this.variables.resolveVariable(name);

    if (this.queue === null) {
      this.queue = [];
    }

    if (prevValue != null) {
      this.queue[name] = this.queue[name] || [];

      this.queue[name].push(prevValue);
    }

    return this.variables.setVariable(name, expression);
   };

   /* void */
   this.popVariable = function(/* String */name) {
    if (this.variables === null) {
      this.variables = new JavaScriptVariables();
    }

    if (this.queue === null) {
      this.queue = [];
    }

    if ((q = this.queue[name]) != null) {
      var v;

      if((v = q.pop()) != null)
      {
       this.setVariable(name, v);
      }
      else
      {
       if (q.length == 0) {
        delete this.queue[name];
        this.variables.removeVariable(name);
       }
      }
    }
   };



    /* void */
    this.invokeJavaMethod = function(/* Communication channel Id */ commId, request, success, failed) {
      if(this.vmchannel === null) {
        this.vmchannel  = new adf.mf.internal.VMChannel(this);
      }

      if (commId != undefined)
      {
        request.featureId = commId;
      }
      this.vmchannel.nonBlockingCall(request, success, failed);
    };

    /* void */
    this.invokeSecurityMethod = function(command, username, password, tenantname, success, failed) {
      if(this.security === null) {
        //this.security  = new Security(this);
        this.security  = new adf.mf.security(this);
      }
      var fm = this.getFunctionMapper();
      var f  = fm.resolveFunction("Security", command);
      return f.call(undefined, username, password, tenantname, success, failed);
    };

    /* String */
    this.toString = function() {
      return "[ ELContext: " + this.context + " ]";
    };
  };


  function VariableResolver() {
  }

  adf.mf.internal.el.VariableResolver = VariableResolver;

  /**
  * Attempts to resolve the given property object on the given base object.
  *
  * If the base object is null or undefined, delegates to
  * context.getVariableMapper().resolveVariable(property).
  *
  * If the base object is a Java language array, returns the value at the given index. The index
  * is specified by the property argument, and coerced into an integer. If the coercion could not
  * be performed, an IllegalArgumentException is thrown. If the index is out of bounds, null is
  * returned.
  *
  * If the base object is a map, returns the value associated with the given key, as specified by
  * the property argument. If the key was not found, null is returned. Just as in
  * java.util.Map.get(Object), just because null is returned doesn't mean there
  * is no mapping for the key; it's also possible that the Map explicitly maps
  * the key to null.
  *
  *
  * @param context
  *        The context of this evaluation.
  * @param base
  *        The base object to return the most general property type for, or null to enumerate
  *        the set of top-level variables that this resolver can evaluate.
  * @param property
  *        The property or variable to return the acceptable type for.
  * @return If the propertyResolved property of ELContext was set to true, then the result of the
  *      variable or property resolution; otherwise undefined.
  * @throws NullPointerException
  *         if context is null
  * @throws PropertyNotFoundException
  *         if base is not null and the specified property does not exist or is not readable.
  * @throws ELException
  *         if an exception was thrown while performing the property or variable resolution.
  *         The thrown exception must be included as the cause property of this exception, if
  *         available.
  */
  /* object */
  VariableResolver.prototype.getValue = function(/* ELContext */ context, /* object */ base, /* object */ property) {
   var result = undefined;
   if ((base === undefined) || (base === null)) {
    // Root Property EL Resolver
    var variables = context.getVariableMapper();

    try {
      result = variables.resolveVariable(property);

      if ((result instanceof Object) &&
       (result[adf.mf.internal.api.constants.WEAK_REFERENCE_PROPERTY] !== undefined))
      {
       var ref = result[adf.mf.internal.api.constants.WEAK_REFERENCE_PROPERTY];
       var p = adf.mf.internal.el.parser.parse("#{" + ref + "}");
       try {
        result = p.evaluate(context);
       } catch (e) {
        result = {};
        p.setValue(context, result);
       }
      }
    } catch (e) {
    }
   } else
   if (Array.isArray(base)) {
    // Array EL Resolver
    result = base[property];
   } else
   if ((typeof base) === 'object') {
    var baseType = base['.type'];
    if (baseType === 'Attribute') {
      // Attribute EL Resolver
      if (property == "bindings")
      {
       result = new adf.mf.internal.el.AttributeBinding(base);
      }
      else if (property == 'inputValue')
      {
       /* getInputValue */
       result = base.getPropertyInputValue(property);
      }
      else
      {
       result = base.getProperty(property);
      }
    } else
    if (baseType === 'AttributeBinding') {
      // Attribute Binding EL Resolver
      result = new adf.mf.internal.el.Attribute(base, property);
    } else
    if (baseType === 'TreeBindings') {
      // Tree Binding EL Resolver
      /* special cases:
      *   inputValue: need to read to the provider's object and not here
      */
      if (property == 'iterator')
      {
       try
       {
        result = new adf.mf.el.TreeNodeIterator(base, 0);

        if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
           "adf.mf.internal.el", "TreeBindingsELResolver",
           "resolved iterator with " + result.getCachedRowCount(0) + " rows cached.");
        }
       }
       catch (ie)
       {
        if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
           "adf.mf.internal.el", "TreeBindingsELResolver",
           "resolving the iterator resulted in an exception: " + ie);
        }
       }
      }
      else if (base[property] !== undefined)
      {
       result = base[property];
      }
      else
      {
       var ab = base.columnAttributes() || {};
       result = ab[property];
      }
    } else
    if (baseType === 'oracle.adfmf.bindings.dbf.TreeNode') {
      // TreeNode EL Resolver
      if (property == "bindings")
      {
       result = new adf.mf.internal.el.AttributeBinding(base);
      }
      else if (property.toLowerCase() == "rowkey")
      {
       result = base.rowKey();
      }
      else if (property == "dataProvider")
      {
       result = base.getProvider();
      }
      else
      {
       var dp = base.getProvider() || {};
       result = dp[property];
                           // if it is a row, attempt to resolve row.bindings.property.inputValue
                          if (result == undefined && dp[".type"] === 'row')
                          {
                           result = VariableResolver.getValueFromRow(dp, property);
                          }
      }
    } else
    if (baseType === 'OptionalFragmentArgument') {
      // Optional Fragment Argument EL Resolver
      result = base;
    } else {
      // Map EL Resolver
      /* first attempt to get the property */
      result = base[property];

                      // if it is a row, attempt to resolve row.bindings.property.inputValue
                      if (result == undefined && baseType === 'row')
                      {
                       result = VariableResolver.getValueFromRow(base,property);
                      }
    }
   } // (typeof base) == 'object'
   if (result === undefined) {
    throw new adf.mf.PropertyNotFoundException();
   }
   return result;
  };

      /**
      * Resolves the EL #{row.property} to #{row.bindings.property.inputValue}
      */
      VariableResolver.getValueFromRow = function(row, property)
      {
       var bindings = row["bindings"];
       if (bindings && typeof bindings == 'object')
       {
        var attr = bindings[property];
        if (attr && typeof attr == 'object')
        {
          return attr["inputValue"];
        }
       }
       return undefined;
      }

      /**
      * Set on the EL #{row.property} will be set to #{row.bindings.property.inputValue}
      */
      VariableResolver.setValueInRow = function(row, property, value)
      {
       var bindings = row["bindings"];
       if (bindings && typeof bindings == 'object')
       {
        var attr = bindings[property];
        if (attr && typeof attr == 'object')
        {
          attr["inputValue"] = value;
        }
       }
      }

  /**
  * Attempts to set the value of the given property object on the given base object.
  *
  * If the base object is null or undefined, delegates to
  * context.getVariableMapper().setVariable(property, value).
  *
  * If the base object is a Java language array, attempts to set the value at the given index
  * with the given value. The index is specified by the property argument, and coerced into an
  * integer. If the coercion could not be performed, an IllegalArgumentException is thrown. If
  * the index is out of bounds, a PropertyNotFoundException is thrown.
  *
  * If the base object is a map, attempts to set the value associated with the given key, as
  * specified by the property argument.
  *
  * @param context
  *        The context of this evaluation.
  * @param base
  *        The base object to return the most general property type for, or null to enumerate
  *        the set of top-level variables that this resolver can evaluate.
  * @param property
  *        The property or variable to return the acceptable type for.
  * @param value
  *        The value to set the property or variable to.
  * @throws NullPointerException
  *         if context is null
  * @throws PropertyNotFoundException
  *         if base is not null and the specified property does not exist or is not readable.
  * @throws PropertyNotWritableException
  *         if the given (base, property) pair is handled by this ELResolver but the
  *         specified variable or property is not writable.
  * @throws ELException
  *         if an exception was thrown while attempting to set the property or variable. The
  *         thrown exception must be included as the cause property of this exception, if
  *         available.
  */
  /* void */
  VariableResolver.prototype.setValue = function(/* ELContext */ context, /* object */ base, /* object */ property, /* object */ value) {
   if ((base === undefined) || (base === null)) {
    // Root Property EL Resolver
    context.getVariableMapper().setVariable(property, value);
   } else
   if (Array.isArray(base)) {
    // Array EL Resolver
    base[property] = value;
   } else
   if ((typeof base) == 'object') {
    var baseType = base['.type'];
    if (baseType == 'Attribute') {
      // Attribute EL Resolver
      if (property == 'inputValue')
      {
       base.setPropertyInputValue(value);
      }
      else
      {
       base.setProperty(property, value);
      }
    } else
    if (baseType == 'AttributeBinding') {
      // Attribute Binding EL Resolver
      base[property] = value;
    } else
    if (baseType == 'TreeBindings') {
      // Tree Binding EL Resolver
      /* special cases:
      *   inputValue: need to written to the provider's object and not here
      */
      if (property == 'iterator')
      {
       throw new adf.mf.PropertyNotWritableException("resolver is read-only");
      }
      else if (base[property] !== undefined)
      {
       base[property] = value;
      }
      else
      {
       if ((typeof value) !== 'AttributeBindings')
       {
        throw new adf.mf.IllegalArgumentException("value is not a AttributeBindings object");
       }

       var ab = base.columnAttributes() || {};
       ab[property] = value;
      }
    } else
    if (baseType == 'oracle.adfmf.bindings.dbf.TreeNode') {
      // TreeNode EL Resolver
      if (property == "bindings")
      {
       base.bindings = value;
      }
      else if (property == "dataProvider")
      {
       base.dataProvider = value;
      }
      else if(property == "rowKey")
      {
       throw new adf.mf.PropertyNotWritableException("rowKey is read-only");
      }
      else
      {
       var dp = base.getProvider() || {};
                           if (dp[".type"] == "row")
                           {
                            VariableResolver.setValueInRow(dp, property, value);
                           }
                           else
                           {
                            dp[property] = value;
                           }
      }
    } else
    if (baseType == 'OptionalFragmentArgument') {
      // Optional Fragment Argument EL Resolver
    } else
                if (baseType == "row")
                {
                  VariableResolver.setValueInRow(base, property, value);
                }else {
      // Map EL Resolver
      base[property] = value;
    }
   }
  };


  adf.mf.internal.el.Attribute = function(/* AttributeBinding */ ab, /* string */ name)
  {
   this['ab'] = ab;
   this['.type'] = 'Attribute';
   this['.name'] = name;

   this.toString = function()
   {
    return "Attribute[" + adf.mf.util.stringify(this.getPropertyInputValue()) + "]";
   };

   this.getProperty = function(/* string */ name)
   {
    var bindings = undefined;
    var property = undefined;

    try
    {
      bindings = this.ab.getBindings();
      property = bindings[this['.name']];
    }
    catch (e)
    {
      throw new adf.mf.PropertyNotFoundException('unknown property ' + this['.name']);
    }

    return property[name];
   };

   this.getPropertyInputValue = function()
   {
    if ((ab !== undefined) && (ab.tn !== undefined))
    {
      return '' + adf.mf.util.stringify(this.ab.tn.getProvider()[this['.name']]);
    }
    else
    {
      throw new adf.mf.PropertyNotFoundException('unknown property ' + this['.name']);
    }
   };

   this.setProperty = function(/* string */ name, /* object */ value)
   {
    var bindings = this.ab.getBindings();
    var property = bindings[this['.name']];

    property[name] = value;
   };

   this.setPropertyInputValue = function(/* object */ value)
   {
    if ((ab !== undefined) && (ab.tn !== undefined))
    {
      var p = this.ab.tn.getProvider();

      p[this['.name']] = value;
    }
    else
    {
      throw new adf.mf.PropertyNotFoundException('unknown property ' + this['_name']);
    }
   };
  };

  adf.mf.internal.el.AttributeBinding = function(/* TreeNode */ tn)
  {
   this['.type'] = 'AttributeBinding';
   this.tn = tn;

   this.getBindings = function()
   {
    return tn.getBindings();
   };

   this.getProvider = function()
   {
    return tn.getProvider();
   };

   this.toString = function()
   {
    return "Attribute Bindings";
   };
  };

  adf.mf.internal.el.OptionalFragmentArgument = function()
  {
   this['.type']  = 'OptionalFragmentArgument';

    this.toString   = function()
    {
      return "OptionalFragmentArgument";
    };

    this.getProperty = function(/* string */ name)
   {
      return this;
   };

    this.setProperty = function(/* string */ name, /* object */ value)
   {
      /* ignore */
   };
  };
  adf.mf.api.OptionalFragmentArgument = adf.mf.api.OptionalFragmentArgument || new adf.mf.internal.el.OptionalFragmentArgument;

  adf.mf.internal.VMChannel = function(/* Context */ context) {
    /**
     * blockingCall(java-class-name, java-class-method-name, success-callback, failed-callback, arguments);
     */
    this.blockingCall = function(request, success, failed) {
      throw adf.mf.UnsupportedOperationException("blocking calls are not supported in this version");
    };


    this.nonBlockingCall= function(request, success, failed) {
      var scb  = [];
      var fcb  = [];
      var op   = request.classname + ":" + request.method;

      if(adf.mf.internal.batchRequest !== undefined)
      {
        var deferedObject = {};

        /* configure up the success and failed callback vectors */
        scb = scb.concat(adf.mf.internal.util.is_array(success)? success : [success]);
        fcb = fcb.concat(adf.mf.internal.util.is_array(failed)?  failed  : [failed ]);

        adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.internal.VMChannel", "nonBlockingCall",
        "appending request on the batch request - actual request is being defered.");
        adf.mf.internal.batchRequest.push(request);

        deferedObject[adf.mf.internal.api.constants.DEFERRED_PROPERTY];

        for(var i = 0; i < scb.length; ++i)
        {
          try
          {
            var callback = scb[i];
            if (callback)
              callback(request, deferedObject);
          }
          catch(se)
          {
            /* nothing we can do */
          }
        }
      }
      else
      {
        var perf = adf.mf.internal.perf.startMonitorCall("Non blocking call", adf.mf.log.level.FINER,
          "adf.mf.internal.VMChannel.nonBlockingCall", op);


        /* configure up the success and failed callback vectors */
        scb = scb.concat([function() { perf.stop(); }]);
        scb = scb.concat(adf.mf.internal.util.is_array(success)? success : [success]);

        fcb = fcb.concat([function() { perf.stop(); }]);
        fcb = fcb.concat(adf.mf.internal.errorHandlers);
        fcb = fcb.concat(adf.mf.internal.util.is_array(failed)?  failed  : [failed ]);

        try
        {

          container.internal.device.integration.vmchannel.invoke(10000, request, scb, fcb);
        }
        catch(e)
        {
          if((! adf.mf.internal.isJavaAvailable()) || (e.name == "TypeError") || (e.name == "ReferenceError"))
          {  // this is when navigator, container.internal.device.integration, or container.internal.device.integration.vmchannel is missing.
            e = new adf.mf.NoChannelAvailableException();
          }

          for(var i = 0; i < fcb.length; ++i)
          {
            try
            {
              var callback = fcb[i];
              if (callback)
                callback(request, e);
            }
            catch(fe)
            {
              /* nothing we can do */
            }
          }
        }
      }
    };

    context.setFunction("VMChannel", "blockingCall",   this.blockingCall);
    context.setFunction("VMChannel", "nonBlockingCall", this.nonBlockingCall);
  };

  adf.mf.security = function(/* Context */ context) {
    this.login = function(username, password, tenantname) {
      if((container.internal.device.integration !== undefined) && (container.internal.device.integration.Security !== undefined))
      {
        container.internal.device.integration.Security.featureLogin(username, password, tenantname);
      }
      else
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "Security", "login",
              ("adfmf - invoking the Security command "));
        }
      }
    };

    this.logout= function() {
      if((container.internal.device.integration !== undefined) && (container.internal.device.integration.Security !== undefined))
      {
        container.internal.device.integration.Security.featureLogout();
      }
      else
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "Security", "logout",
              ("adfmf - invoking the Security command "));
        }
      }
    };

    this.isAuthenticated = function() {
      if((container.internal.device.integration !== undefined) && (container.internal.device.integration.Security !== undefined))
      {
        container.internal.device.integration.Security.featureIsAuthenticated();
      }
      else
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "Security", "isAuthenticated",
              ("adfmf - invoking the Security command "));
        }
      }
    };

    this.cancelLogin = function() {
      if((container.internal.device.integration !== undefined) && (container.internal.device.integration.Security !== undefined))
      {
        container.internal.device.integration.Security.cancelLogin();
      }
      else
      {
        console.log("adfmf - invoking the Security command ");
      }
    };

    this.isConnectionMultiTenantAware = function(username, password, tenantname, callback) {
      if((container.internal.device.integration !== undefined) && (container.internal.device.integration.Security !== undefined))
      {
        container.internal.device.integration.Security.featureIsConnectionMultiTenantAware(callback);
      }
      else
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "Security", "isConnectionMultiTenantAware",
              ("adfmf - invoking the Security command "));
        }
      }
    };

    this.getMultiTenantUsername = function(username, password, tenantname, callback) {
      if((container.internal.device.integration !== undefined) && (container.internal.device.integration.Security !== undefined))
      {
        container.internal.device.integration.Security.featureGetMultiTenantUsername(callback);
      }
      else
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "Security", "getMultiTenantUsername",
              ("adfmf - invoking the Security command "));
        }
      }
    };

    this.getLoginViewInitData = function(username, password, tenantname, success, failed) {
      try
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "Security", "getLoginViewInitData", "invoking security command.");
        }

        container.internal.device.integration.Security.getLoginViewInitData(success, failed);
      }
      catch(e)
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.WARNING))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, "Security", "getLoginViewInitData",
                            ("Security.getLoginViewInitData was not invoked (error="+e+")"));
        }
      }
    };

    context.setFunction("Security", "cancelLogin",            this.cancelLogin);
    context.setFunction("Security", "login",                this.login);
    context.setFunction("Security", "logout",                this.logout);
    context.setFunction("Security", "isAuthenticated",          this.isAuthenticated);
    context.setFunction("Security", "isConnectionMultiTenantAware", this.isConnectionMultiTenantAware);
    context.setFunction("Security", "getMultiTenantUsername",     this.getMultiTenantUsername);
    context.setFunction("Security", "getLoginViewInitData",      this.getLoginViewInitData);
  };
})();


/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/JavaScriptContext.js///////////////////////////////////////



/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/Adflog.js///////////////////////////////////////

/* Copyright (c) 2011, 2014, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- Adflog.js ---------------------- */
// moved to base.js
// TODO need to:
// - look for the @-requires messages in all of Bruces code to remove references to "Adflog" (don't think this particular one is required anywhere... maybe just bootstrap)
// - purge this file altogether but be careful to check that Ant doesn't try to reference it

/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/Adflog.js///////////////////////////////////////



/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/ELParser.js///////////////////////////////////////

/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- ELParser.js ---------------------- */
// @requires ELErrors
// @requires JavaScriptContext


var adf                    = window.adf                 || {};
adf.mf                     = adf.mf                     || {};
adf.mf.api                 = adf.mf.api                 || {};
adf.mf.el                  = adf.mf.el                  || {};
adf.mf.locale              = adf.mf.locale              || {};
adf.mf.log                 = adf.mf.log                 || {};
adf.mf.resource            = adf.mf.resource            || {};
adf.mf.util                = adf.mf.util                || {};

adf.mf.internal            = adf.mf.internal            || {};
adf.mf.internal.api        = adf.mf.internal.api        || {};
adf.mf.internal.el         = adf.mf.internal.el         || {};
adf.mf.internal.el.parser  = adf.mf.internal.el.parser  || {};
adf.mf.internal.el.parser.cache  = adf.mf.internal.el.parser.cache  || {};
adf.mf.internal.el.parser.ops    = adf.mf.internal.el.parser.ops    || {};
adf.mf.internal.locale     = adf.mf.internal.locale     || {};
adf.mf.internal.log        = adf.mf.internal.log        || {};
adf.mf.internal.mb         = adf.mf.internal.mb         || {};
adf.mf.internal.perf       = adf.mf.internal.perf       || {};
adf.mf.internal.perf.story = adf.mf.internal.perf.story || {};
adf.mf.internal.resource   = adf.mf.internal.resource   || {};
adf.mf.internal.util       = adf.mf.internal.util       || {};

/**
 * Literals:
 *    Boolean: true and false
 *    Integer: as in Java
 *    Floating point: as in Java
 *    String: with single and double quotes; " is escaped as \", ' is escaped as \', and \ is escaped as \\.
 *    Null: null
 *
 * Operators:
 *    In addition to the . and [] operators discussed in Variables, there is the additional operators:
 *       Arithmetic: +, - (binary), *, / and div, % and mod, - (unary)
 *       Logical: and, &&, or, ||, not, !
 *       Relational: ==, eq, !=, ne, <, lt, >, gt, <=, ge, >=, le.
 *                  Comparisons can be made against other values, or against boolean,
 *                  string, integer, or floating point literals.
 *       Empty: The empty operator is a prefix operation that can be used to determine whether a value is null or empty.
 *       Conditional: A ? B : C. Evaluate B or C, depending on the result of the evaluation of A.
 *
 *   The precedence of operators highest to lowest, left to right is as follows:
 *      1. [] .
 *      2. () - Used to change the precedence of operators.
 *      3. - (unary) not ! empty
 *      4. * / div % mod
 *      5. + - (binary)
 *      6. < > <= >= lt gt le ge
 *      7. == != eq ne
 *      8. && and
 *      9. || or
 *     10. ? :
 *
 *  Reserved Words:
 *  The following words are reserved for the JSP expression language and should not be used as identifiers.
 *      and   eq   gt   true   instanceof
 *      or    ne   le   false  empty
 *      not   lt   ge   null   div   mod
 *  Note that many of these words are not in the language now, but they may be in the future,
 *  so you should avoid using them.
 *
 *  Examples:
 *  Here are some example EL expressions and the result of evaluating them.
 *
 *  EL Expression            Result
 *  ----------------------------------  --------------------------------------------------------------------
 *  ${1 > (4/2)}            false
 *  ${4.0 >= 3}              true
 *  ${100.0 == 100}            true
 *  ${(10*10) ne 100}          false
 *  ${'a' < 'b'}            true
 *  ${'hip' gt 'hit'}          false
 *  ${4 > 3}              true
 *  ${1.2E4 + 1.4}            12001.4
 *  ${3 div 4}              0.75
 *  ${10 mod 4}              2
 *  ${empty param.Add}          True if the request parameter named Add is null or an empty string
 *  ${pageContext.request.contextPath}  The context path
 *  ${sessionScope.cart.numberOfItems}  The value of the numberOfItems property of the session-scoped attribute
 *                    named cart
 *  ${param['mycom.productId']}      The value of the request parameter named mycom.productId
 *  ${header["host"]}          The host
 *  ${departments[deptName]}      The value of the entry named deptName in the departments map
 *
 *
 *  How to use the ELParser and ELExpression objects:
 *  - If you want to parse and evaluate an expression for a one time evaluation (i.e. will not be cached)
 *    do the following:
 *      adf.mf.internal.el.parser.evaluate(expression, context);
 *    i.e.
 *      adf.mf.internal.el.parser.evaluate("Hello", context);
 *      adf.mf.internal.el.parser.evaluate("${1.23E3}", context);
 *      adf.mf.internal.el.parser.evaluate("${applicationScope.loginRequired}", context);
 *      adf.mf.internal.el.parser.evaluate("${applicationScope.variableA < applicationScope.variableB}", context);
 *
 *  - If you want to parse an expression and use it over and over or simply let the "system" cached the expression
 *    for you, do the following:
 *      var expr      = adf.mf.internal.el.parser.parse(expression);
 *      ...
 *      var value     = expr.evaluate(context);  // can be called multiple times
 *
 *    i.e.
 *      var expr = adf.mf.internal.el.parser.evaluate("Hello");
 *      expr.evaluate(context);  // can be called multiple times
 *
 *      var expr = adf.mf.internal.el.parser.evaluate("${1.23E3}");
 *      expr.evaluate(context);  // can be called multiple times
 *
 *      var expr = adf.mf.internal.el.parser.evaluate(context, "${applicationScope.loginRequired}");
 *      expr.evaluate(context);  // can be called multiple times
 *
 *      var expr = adf.mf.internal.el.parser.evaluate(context, "${applicationScope.variableA < applicationScope.variableB}");
 *      expr.evaluate(context);  // can be called multiple times
 */
(function() {
  adf.mf.internal.el.parser.ops =  {};

  var isStr = function(s) { return typeof(s) === 'string' || s instanceof String; };
  adf.mf.internal.el.parser.ops.isStr = isStr;

  adf.mf.internal.el.parser.ops.concat = function(a, b)             { return "" + a + b;                   };

  // standard EL binary operations implementations
  //function add(a, b)                { return (isStr(a) || isStr(b))? ("" + a + b) : (a + b); }
  adf.mf.internal.el.parser.ops.add = function(a, b)
  {
    // EL should not allow adding strings together, but this code re-writes EL like "#{null}#{null}"
    // to #{null + null}. In order to prevent a radical change at this point, support string
    // concatination despite being against the EL specification.
    if (a === null && b === null)
    {
      // JavaEL will use a blank string for nulls being concatinated
      return "";
    }
    else if (a === null && isStr(b))
    {
      return b;
    }
    else if (isStr(a) && b === null)
    {
      return a;
    }

    return a + b;
  };

  adf.mf.internal.el.parser.ops.subtract = function(a, b)           { return a - b;                        };
  adf.mf.internal.el.parser.ops.multiply = function(a, b)           { return a * b;                        };
  adf.mf.internal.el.parser.ops.divide = function(a, b)             { return a / b;                        };
  adf.mf.internal.el.parser.ops.modulo = function(a, b)             { return a % b;                        };
  adf.mf.internal.el.parser.ops.index = function(a, b)              { return a[b];                         };

  // standard EL unary operation implementations
  adf.mf.internal.el.parser.ops.negate = function(a)                { return -a;                           };
  adf.mf.internal.el.parser.ops.empty = function(a)
  {
    return ((a === null) || (a === '') || (a == []) ||
      (a === adf.mf.api.OptionalFragmentArgument));
  };

  adf.mf.internal.el.parser.ops.not = function(a)                   { return !adf.mf.internal.el.parser.ops.coerce(a);                   };

  // standard EL logical operations implementations
  adf.mf.internal.el.parser.ops.greaterThanOrEqual = function(a, b) { return a >= b;                       };
  adf.mf.internal.el.parser.ops.greaterThan = function(a, b)        { return a > b;                        };
  adf.mf.internal.el.parser.ops.lessThanOrEqual = function(a, b)    { return a <= b;                       };
  adf.mf.internal.el.parser.ops.lessThan = function(a, b)           { return a < b;                        };
  adf.mf.internal.el.parser.ops.equals = function(a, b)             { return adf.mf.internal.el.parser.ops.coerce(a) == adf.mf.internal.el.parser.ops.coerce(b);       };
  adf.mf.internal.el.parser.ops.notEqual = function(a, b)           { return adf.mf.internal.el.parser.ops.coerce(a) != adf.mf.internal.el.parser.ops.coerce(b);       };
  adf.mf.internal.el.parser.ops.or = function(a, b)                 { return adf.mf.internal.el.parser.ops.coerce(a) || adf.mf.internal.el.parser.ops.coerce(b);       };
  adf.mf.internal.el.parser.ops.and = function(a, b)                { return adf.mf.internal.el.parser.ops.coerce(a) && adf.mf.internal.el.parser.ops.coerce(b);       };
  adf.mf.internal.el.parser.ops.ternary = function(a,b,c)           { return (adf.mf.internal.el.parser.ops.coerce(a))? b : c;           };

  // coerce the value to a boolean if so be it
  adf.mf.internal.el.parser.ops.coerce = function(a)                { return (a == "true") ? true : (a == "false") ? false : a; };

  // standard EL function implementations
  adf.mf.internal.el.parser.ops.unknown = function()                {                                      };
  adf.mf.internal.el.parser.ops.block = function()     {};

  adf.mf.internal.el.parser.ops.append = function(a, b) {
        if (Object.prototype.toString.call(a) != "[object Array]") {
          return [a, b];
        }
        a = a.slice();
        a.push(b);
        return a;
      };

      /*
       *  The precedence of operators highest to lowest, left to right is as follows:
       *      1. [] .
       *      2. () - Used to change the precedence of operators.
       *      3. - (unary) not ! empty
       *      4. * / div % mod
       *      5. + - (binary)
       *      6. < > <= >= lt gt le ge
       *      7. == != eq ne
       *      8. && and
       *      9. || or
       *     10. ? :
       */
  adf.mf.internal.el.parser.ops.unaryOperations = {
        /* token : [ token, function_to_perform, increment_position_by, prior_token, precedence, requires_word_boundary ]*/
        "-"     : ["-",     adf.mf.internal.el.parser.ops.negate,          +1, +2, 3, false],
        "!"     : ["!",     adf.mf.internal.el.parser.ops.not,             +1, +2, 3, false],
        "not"   : ["not",   adf.mf.internal.el.parser.ops.not,             +3, +2, 3, true ],
        "empty" : ["empty", adf.mf.internal.el.parser.ops.empty,           +5, +2, 3, true ]
      };

  adf.mf.internal.el.parser.ops.binaryOperations = {
        /* token : [ token, function_to_perform, increment_position_by, prior_token, precedence, requires_word_boundary ]*/
        // ",": [",",   adf.mf.internal.el.parser.ops.append,              +1, -1, -1, false], ---> not really a binary operator
        "#"   : ["#",   adf.mf.internal.el.parser.ops.concat,              +1, +2,  5, false],
        "+"   : ["+",   adf.mf.internal.el.parser.ops.add,                 +1, +2,  5, false],
        "-"   : ["-",   adf.mf.internal.el.parser.ops.subtract,            +1, +2,  5, false],
        "*"   : ["*",   adf.mf.internal.el.parser.ops.multiply,            +1, +1,  4, false],
        "/"   : ["/",   adf.mf.internal.el.parser.ops.divide,              +1, +1,  4, false],
        "div" : ["div", adf.mf.internal.el.parser.ops.divide,              +3, +2,  4, true ],
        "%"   : ["%",   adf.mf.internal.el.parser.ops.modulo,              +1, +2,  4, false],
        "mod" : ["mod", adf.mf.internal.el.parser.ops.modulo,              +3, +2,  4, true ],
        "and" : ["and", adf.mf.internal.el.parser.ops.and,                 +3, +2,  8, true ],
        "&&"  : ["&&",  adf.mf.internal.el.parser.ops.and,                 +2, +2,  8, false],
        "or"  : ["or",  adf.mf.internal.el.parser.ops.or,                  +2, +2,  9, true ],
        "||"  : ["||",  adf.mf.internal.el.parser.ops.or,                  +2, +2,  9, false],
        "<="  : ["<=",  adf.mf.internal.el.parser.ops.lessThanOrEqual,     +2, +2,  6, false],
        "le"  : ["le",  adf.mf.internal.el.parser.ops.lessThanOrEqual,     +2, +2,  6, true ],
        "<"   : ["<",   adf.mf.internal.el.parser.ops.lessThan,            +1, +1,  6, false],
        "lt"  : ["lt",  adf.mf.internal.el.parser.ops.lessThan,            +2, +1,  6, true ],
        ">="  : [">=",  adf.mf.internal.el.parser.ops.greaterThanOrEqual,  +2, +2,  6, false],
        "ge"  : ["ge",  adf.mf.internal.el.parser.ops.greaterThanOrEqual,  +2, +2,  6, true ],
        ">"   : [">",   adf.mf.internal.el.parser.ops.greaterThan,         +1, +2,  6, false],
        "gt"  : ["gt",  adf.mf.internal.el.parser.ops.greaterThan,         +2, +2,  6, true ],
        "=="  : ["==",  adf.mf.internal.el.parser.ops.equals,              +2, +2,  7, false],
        "eq"  : ["eq",  adf.mf.internal.el.parser.ops.equals,              +2, +2,  7, true ],
        "!="  : ["!=",  adf.mf.internal.el.parser.ops.notEqual,            +2, +2,  7, false],
        "ne"  : ["ne",  adf.mf.internal.el.parser.ops.notEqual,            +2, +2,  7, true ]
      };

  adf.mf.internal.el.parser.ops.ternaryOperations = {
        /* token : [ token, function_to_perform, increment_position_by, prior_token, precedence, requires_word_boundary ]*/
        "?"   : ["?",   adf.mf.internal.el.parser.ops.ternary,             +1, +2,  11, false]
      };

  adf.mf.internal.el.parser.ops.constants = {
        "true"  : true,
        "false" : false,
        "null"  : null
      };

  adf.mf.internal.el.parser.ops.functions = {
        "abs"             : Math.abs,
        "sign"            : adf.mf.internal.el.parser.ops.unknown,
        "pow"             : Math.pow,
        "exp"             : Math.exp,
        "ln"              : adf.mf.internal.el.parser.ops.unknown,
        "round"           : Math.round,
        "truncate"        : Math.floor,
        "len"             : adf.mf.internal.el.parser.ops.unknown,
        "strstr"          : adf.mf.internal.el.parser.ops.unknown,
        "leftstr"         : adf.mf.internal.el.parser.ops.unknown,
        "rightstr"        : adf.mf.internal.el.parser.ops.unknown,
        "substr"          : String.substr,
        "lower"           : String.toLowerCase,
        "upper"           : String.toUpperCase,
        "date"            : adf.mf.internal.el.parser.ops.unknown,
        "now"             : adf.mf.internal.el.parser.ops.unknown,
        "lookup"          : adf.mf.internal.el.parser.ops.unknown
      };

  var PRIMARY  = 1 <<  0;
  var OPERATOR = 1 <<  1;
  var FUNCTION = 1 <<  2;
  var LPAREN   = 1 <<  3;
  var RPAREN   = 1 <<  4;
  var COMMA    = 1 <<  5;
  var SIGN     = 1 <<  6;
  var CALL     = 1 <<  7;
  var OPENEXP  = 1 <<  8;
  var CLOSEEXP = 1 <<  9;
  var UNIOP    = 1 << 10;
  var HOOK     = 1 << 11;
  var COLON    = 1 << 12;
  var LBRACE   = 1 << 13;
  var NO_ARGS  = 1 << 14;

  /* types of tokens that will be encountered */
  var TOKEN_CONSTANT         =  0;
  var TOKEN_UNARY_OPERATOR   =  1;
  var TOKEN_BINARY_OPERATOR  =  2;
  var TOKEN_TERNARY_OPERATOR =  3;
  var TOKEN_VARIABLE         =  4;
  var TOKEN_FUNCTION         =  5;
  var TOKEN_INDEX            =  6;
  var TOKEN_DOT_OFFSET       =  7;
  var TOKEN_PROPERTY         =  8;
  var TOKEN_COLON            =  9;
  var TOKEN_COMMA            = 10;
  var TOKEN_NO_ARGS          = 11;


  function Token(type, index, prior, value) {
    this.type  = type;
    this.index = index || 0;
    this.prior = prior || 3;
    this.value = (value !== undefined) ? value : null;

    this.toString = function () {
      switch (this.type) {
        case TOKEN_CONSTANT:         return escape(this.value);
        case TOKEN_UNARY_OPERATOR:   /* or */
        case TOKEN_BINARY_OPERATOR:  /* or */
        case TOKEN_TERNARY_OPERATOR: /* or */
        case TOKEN_NO_ARGS:          /* or */
        case TOKEN_INDEX:            /* or */
        case TOKEN_COLON:            /* or */
        case TOKEN_COMMA:            /* or */
        case TOKEN_DOT_OFFSET:       /* or */
        case TOKEN_VARIABLE:         return this.index;
        case TOKEN_FUNCTION:         return "INVOKE";
        default:                     return "Invalid Token";
      }
    };
  }

  // table used by table driven parser
  var parserRules = {};
  // default rule (function)
  var otherRule;

  /**
   * Adds several new rules to 'parserRules' table.
   *
   * @param {Object.<string, Object>} rules This is table of new rules like {"+": [...], "true": true}.
   *   This format is compatible with "adf.mf.internal.el.parser.ops.xxx" definition
   *   tables.
   * @param {function} f Function that will be called when some of registerred rules
   *   is recognized. This function will be called with two parameters. 'index'
   *   which is index to the ELParser.expression. Second parameter 'param' is 'value'
   *   object from rules map.
   * @param {boolean} caseInsensitive Used for case insensitive tokens, like 'true'
   *   in EL Expression language.
   */
  function addParserRules(rules, f, caseInsensitive) {
    for (var k in rules) {
      addParserRule(k, f, rules [k], caseInsensitive);
    }
  }

  /**
   * Adds one rule to 'parserRules' table.
   *
   * @param {string} text Text specifies content of recognized token, like '==',
   *   'true' or '+'.
   * @param {function} f Function that will be called when registerred rule
   *   is recognized. This function will be called with two parameters. 'index'
   *   which is index to the ELParser.expression. Second parameter 'param' contains
   *   value of 'param'.
   * @param {Object} param Value that will be send to function 'f'.
   * @param {boolean} caseInsensitive Used for case insensitive tokens, like 'true'
   *   in EL Expression language.
   */
  function addParserRule(text, f, param, caseInsensitive) {
    _addParserRulesForCharacter(0, text, parserRules, f, param, caseInsensitive);
  }

  /**
   * This method adds rules for one character from the given text. This method
   * is private.
   *
   * @private
   * @param {number} index Index to the text string. It points to the
   *   current character.
   * @param {string} text Text specifies content of recognized token, like '==',
   *   'true' or '+'.
   * @param {Object.<string, Object>} m Points to the current node in
   *   parserRules table.
   * @param {function} f Function that will be called when registerred rule
   *   is recognized. This function will be called with two parameters. 'index'
   *   which is index to the ELParser.expression. Second parameter 'param' contains
   *   value of 'param'.
   * @param {Object} param Value that will be send to function 'f'.
   * @param {boolean} caseInsensitive Used for case insensitive tokens, like 'true'
   *   in EL Expression language.
   */
  function _addParserRulesForCharacter(index, text, m, f, param, caseInsensitive) {
    var ch = text.charAt(index);
    var last = index + 1 == text.length;
    if(caseInsensitive) {
      ch = ch.toLowerCase();
      _addParserRuleForCharacter(index, text, m, f, param, caseInsensitive, ch, last);
      var ch2 = ch.toUpperCase();
      if (ch !== ch2)
        _addParserRuleForCharacter(index, text, m, f, param, caseInsensitive, ch2, last);
    } else
      _addParserRuleForCharacter(index, text, m, f, param, caseInsensitive, ch, last);
  }

  /**
   * This method adds one rule for one character from the given text. This method
   * is private.
   *
   * @private
   * @param {number} index Index to the text string. It points to the
   *   current character.
   * @param {string} text Text specifies content of recognized token, like '==',
   *   'true' or '+'.
   * @param {Object.<string, Object>} m Points to the current node in
   *   parserRules table.
   * @param {function} f Function that will be called when registerred rule
   *   is recognized. This function will be called with two parameters. 'index'
   *   which is index to the ELParser.expression. Second parameter 'param' contains
   *   value of 'param'.
   * @param {Object} param Value that will be send to function 'f'.
   * @param {boolean} caseInsensitive Used for case insensitive tokens, like 'true'
   *   in EL Expression language.
   * @param {string} ch Character that should be added.
   * @param {boolean} last This parameter should be true for last character from
   *   text string.
   */
  function _addParserRuleForCharacter(index, text, m, f, param, caseInsensitive, ch, last) {
    var nm = m [ch];
    if (!nm) {
      nm = [{}];
      m [ch] = nm;
    }
    if (last) {
      nm [nm.length] = f;
      nm [nm.length] = param;
    } else
      _addParserRulesForCharacter(index + 1, text, nm [0], f, param, caseInsensitive);
  }

  /**
   * This function parses one token from ELParser.expression according to rules
   * stored in 'parserRules', and calls one of registerred callback method.
   *
   * @param {Object} elParser Instance of ELParser.
   * @returns {boolean} True, if some token was recognized.
   */
  function parseToken(elParser) {
    if (_parseTokenCharacter(elParser, elParser.pos, parserRules)) return true;
    if (otherRule) return otherRule.call(elParser, elParser.pos);
    return false;
  }

  /**
   * This function parses one character from the current token according to rules
   * stored in 'parserRules', and calls one of registerred callback method.
   *
   * @param {Object} elParser Instance of ELParser.
   * @param {number} index Index to elParser.expression.
   * @param {Object.<string, Object>} map Points to the current node in
   *   parserRules table.
   * @returns {boolean} True, if some token was recognized.
   */
  function _parseTokenCharacter(elParser, index, map) {
    var ch = elParser.expression.charAt(index);
    var r = map [ch];
    if (r) {
      if (_parseTokenCharacter(elParser, index + 1, r [0])) return true;
      for (var j = 1; j < r.length; j+=2) {
        if (r [j + 1] === 0 ? r [j].call(elParser, index + 1) : r [j].call(elParser, index + 1, r [j + 1]))
          return true;
      }
    }
    return false;
  }

  /*
   * Adds rule for parsing binary operators.
   */
  addParserRules(adf.mf.internal.el.parser.ops.binaryOperations, function(index, param) {
    if (param[5] && !this.isOperatorBoundary(index))
      return false;

    this.finishTerm (this.pos);
    this.token = param[0];
    this.prior = param[4];
    this.pos   += param[2];
    if (this.isSign() && (this.expected & SIGN)) {
      if (this.isNegativeSign()) {
        this.token = adf.mf.internal.el.parser.ops.unaryOperations["-"][0];
        this.prior = adf.mf.internal.el.parser.ops.unaryOperations["-"][4];
        this.nooperands++;
        this.addfunc(TOKEN_UNARY_OPERATOR);
      }
      this.expected = (PRIMARY | LPAREN | FUNCTION | SIGN | CLOSEEXP);
    }
    else if (this.isComment()) {
      /* do nothing */
    }
    else {
      if ((this.expected & OPERATOR) === 0) {
        var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNEXPECTED_OPERATOR_FOUND");

        this.parsingError(this.pos, rmsg);
      }
      this.nooperands += 2;
      this.addfunc(TOKEN_BINARY_OPERATOR);
      this.expected = (PRIMARY | LPAREN | FUNCTION | SIGN | UNIOP | CLOSEEXP);
    }
    return true;
  });

  /*
   * Adds rule for parsing unary operators.
   */
  addParserRules(adf.mf.internal.el.parser.ops.unaryOperations, function(index, param) {
    if (param[5] && !this.isOperatorBoundary(index))
      return false;
    this.token = param[0];
    this.prior = param[4];  /* adding precedence support */
    if ((this.expected & UNIOP) === 0) {
      var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNEXPECTED_UNIARY_OP_FOUND");

      this.parsingError(this.pos, rmsg);
    }
    this.addfunc(TOKEN_UNARY_OPERATOR);
    this.nooperands++;
    this.expected = (PRIMARY | LPAREN | FUNCTION | SIGN | CLOSEEXP);
    this.finishTerm (this.pos);
    this.pos  += param[0].length;
    return true;
  });

  /*
   * Adds rule for parsing '}'.
   */
  addParserRule("}", function() {
    while (this.operatorStack.length > 0) {
      this.tokenStack.push(this.operatorStack.pop());
    }
    this.finishTerm (this.pos);
    this.pos++;
    if ((this.expected & CLOSEEXP) === 0) {
      var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNKNOWN_CHAR_FOUND", ["}"]);

      this.parsingError(this.pos, rmsg);
    }
    if(this.expCount > 1) {
      this.token   = "+";   // should go to # if we should concat
      this.prior   = 30;    // 30 = 3 (for add) * 10 (to ensure it is always the last precedence)
      this.nooperands  += 2;
      this.addfunc(TOKEN_BINARY_OPERATOR);
    }
    this.text        = this.pos;
    this.expected    = (OPENEXP);
    return true;
  });

  /*
   * Adds rule for parsing ','.
   */
  addParserRule(",", function(index) {
    this.pos++;
    this.prior = -1;
    this.token = ",";
    if ((this.expected & COMMA) === 0) {
      var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNKNOWN_CHAR_FOUND", [","]);

      this.parsingError(this.pos, rmsg);
    }
    this.addfunc(TOKEN_COMMA);
    this.nooperands    += 2;
    this.expected = (PRIMARY | LPAREN | FUNCTION | SIGN | UNIOP | CLOSEEXP);
    this.finishTerm (this.pos - 1);
    return true;
  });

  /*
   * Adds rule for parsing constant literals.
   */
  addParserRules(adf.mf.internal.el.parser.ops.constants, function(index, param) {
    // Verify that this is not part of a longer varible name that
    // just starts with a constant
    if (index < this.expression.length) {
      var nextChar = this.expression.charCodeAt(index);
      // Match a word character, [0-9A-Za-z_]
      if ((nextChar >= 48 /* 0 */ && nextChar <= 57 /* 9 */) ||
        (nextChar >= 65 /* A */ && nextChar <= 90 /* Z */) ||
        (nextChar >= 97 /* a */ && nextChar <= 122 /* z */) ||
        nextChar == 95 /* _ */) {
        // The string only begins with a constant, it is not a constant
        return false;
      }
    }
    this.value = param;
    this.pos  = index;

    if ((this.expected & PRIMARY) === 0) {
      var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNEXPECTED_CONSTANT_FOUND");

      this.parsingError(this.pos, rmsg);
    }
    var constant = new Token(TOKEN_CONSTANT, 0, 0, this.value);
    this.tokenStack.push(constant);
    this.expected = (OPERATOR | HOOK | LPAREN | RPAREN | COLON | COMMA | CLOSEEXP);
    return true;
  }, true);

  /*
   * Adds rule for parsing '#'.
   */
  addParserRule("#", function(index) {
    this.directive = this.pos;
    this.pos = index;
    return true;
  });

  /*
   * Adds rule for parsing '$'.
   */
  addParserRule("$", function(index) {
    this.directive = this.pos;
    this.finishTerm (this.pos);
    this.pos = index;
    return true;
  });

  /*
   * Adds rule for parsing '['.
   */
  addParserRule("[", function(index) {
    this.pos++;

    if ((this.expected & LBRACE) === 0) {
      var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNKNOWN_CHAR_FOUND", ["["]);

      this.parsingError(this.pos, rmsg);
    }
    else {
      this.nooperands  +=  2;
      this.prior   =  1;
      this.token   = '[';

      this.addfunc(TOKEN_INDEX);
      this.pmatch += 100;
    }

    this.expected = (PRIMARY | LPAREN | FUNCTION | UNIOP | SIGN);
    return true;
  });

  /*
   * Adds rule for parsing '('.
   */
  addParserRule("(", function(index) {
    this.pos++;
    this.pmatch += 100;

    if ((this.expected & LPAREN) === 0) {
      var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNKNOWN_CHAR_FOUND", ["("]);

      this.parsingError(this.pos, rmsg);
    }

    if (this.expected & CALL) {
      this.nooperands +=  2;
      this.prior  =  11;
      this.token  = '(';
      this.addfunc(TOKEN_FUNCTION);
      this.expected = (PRIMARY | LPAREN | RPAREN | FUNCTION | UNIOP | NO_ARGS | SIGN);
    }
    else
    {
      this.expected = (PRIMARY | LPAREN | RPAREN | UNIOP | SIGN);
    }
    return true;
  });

  /*
   * Adds rule for parsing numeric literals.
   */
  addParserRules({"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"+":0,"-":0,".":0},
  function(index)
  {
    var result   = false;
    var i        = this.pos;

    var exponent = false;
    var dot = false;
    var digit = false;

    while (i < this.expression.length)
    {
      var c = this.expression.charAt(i);
      if (c == '.')
      {
        if (dot || exponent)
        {
          result = false;
          break;
        }

        dot = true;
      }
      else if (c == '+' || c == '-')
      {
        if (i == this.pos) break;
        var previousChar = this.expression.charAt (i - 1);
        if (previousChar != 'e' && previousChar != 'E') break;
      }
      else if (c == 'e' || c == 'E')
      {
        if (!digit)
        {
          // A number must have a digit before the e or E (.e1 is not valid)
          result = false;
          break;
        }
        exponent = true;
      }
      else if (c >= '0' && c <= '9')
      {
        digit = true;
        result = true;
      }
      else
      {
        if ((c.toLowerCase() !== c.toUpperCase()) || (c === '_'))
          result = false;
        break;
      }
      i++;
    }

    if (result)
    {
      var str = this.expression.substr(this.pos, i - this.pos);
      this.value = parseFloat(str);
      if ((this.expected & PRIMARY) === 0)
      {
        var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNEXPECTED_NUMBER_CONSTANT_FOUND");

        this.parsingError(this.pos, rmsg);
      }
      token = new Token(TOKEN_CONSTANT, 0, 0, this.value);
      this.tokenStack.push(token);

      this.expected = (OPERATOR | HOOK | RPAREN | COLON | COMMA | CLOSEEXP);
      this.pos = i;
    }

    return result;
  });

  /*
   * Adds rule for parsing binary operators.
   */
  addParserRules(adf.mf.internal.el.parser.ops.binaryOperations, function(index, param) {
    // This code doesn't seem to be used, instead the block at line 450 is used.
    // Can this be removed?
    if (param[5] && !this.isOperatorBoundary(index))
      return false;
    this.token = this.expression.substr(this.pos, index - this.pos);
    this.prior = param[4];  /* adding precedence support */
    if ((this.expected & FUNCTION) === 0) {
      var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNEXPECTED_BINARY_OP_FOUND");

      this.parsingError(this.pos, rmsg);
    }
    this.addfunc(TOKEN_BINARY_OPERATOR);
    this.nooperands += 2;
    this.expected    = (PRIMARY | LPAREN | UNIOP | SIGN);
    this.finishTerm (this.pos);
    this.pos   = index;
    return true;
  });

  /*
   * Adds rule for parsing ternary operators.
   */
  addParserRules(adf.mf.internal.el.parser.ops.ternaryOperations, function(index, param) {
    this.token = this.expression.substr(this.pos, index - this.pos);
    this.prior = param[4];  /* adding precedence support */
    if ((this.expected & HOOK) === 0) {
      var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNEXPECTED_TERNARY_OP_FOUND");

      this.parsingError(this.pos, rmsg);
    }
    this.addfunc(TOKEN_TERNARY_OPERATOR);
    this.nooperands  += 2;
    this.expected     = (PRIMARY | LPAREN | UNIOP | SIGN);
    this.finishTerm (this.pos);
    this.pos   = index;
    return true;
  });

  /*
   * Adds rule for parsing ')'.
   */
  addParserRule(")", function() {
    this.finishTerm (this.pos);
    this.pos++;
    this.pmatch -= 100;
    if ((this.expected & RPAREN) === 0) {
      var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNKNOWN_CHAR_FOUND", [")"]);

      this.parsingError(this.pos, rmsg);
    }

    if((this.expected & NO_ARGS) === NO_ARGS) {
      var vartoken = new Token(TOKEN_NO_ARGS, this.token, 0, 0);
      this.tokenStack.push(vartoken);
    }

    this.expected = (OPERATOR | HOOK | RPAREN | COMMA | LBRACE | LPAREN | COLON | CALL | CLOSEEXP);
    return true;
  });

  /*
   * Adds rule for parsing ']'.
   */
  addParserRule("]", function() {
    this.finishTerm (this.pos);
    this.pos++;
    this.pmatch -= 100;
    if ((this.expected & RPAREN) === 0) {
      var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNKNOWN_CHAR_FOUND", ["]"]);

      this.parsingError(this.pos, rmsg);
    }

    // Move the operation from the operation stack to the token stack
    if (this.operatorStack.length > 0 &&
      this.operatorStack[this.operatorStack.length - 1].type == TOKEN_INDEX)
    {
      this.tokenStack.push(this.operatorStack.pop());
    }

    this.expected = (OPERATOR | HOOK | LBRACE | RPAREN | CLOSEEXP | COLON);
    return true;
  });

  /*
   * Adds rule for parsing ':'.
   */
  addParserRule(":", function() {
    this.pos++;
    this.prior = 10;
    this.token = ":";
    if ((this.expected & COLON) === 0) {
      var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNKNOWN_CHAR_FOUND", [":"]);

      this.parsingError(this.pos, rmsg);
    }

    this.addfunc(TOKEN_COLON);
    this.nooperands  += 2;
    this.expected     = (PRIMARY | LPAREN | UNIOP | SIGN);
    this.finishTerm (this.pos - 1);
    return true;
  });

  /*
   * Adds rule for parsing '.'.
   */
  addParserRule(".", function() {
    this.nooperands  +=  2;
    this.prior   = 1;
    this.token = '.';
    this.addfunc(TOKEN_DOT_OFFSET);
    this.pos++;
    this.expected = (PRIMARY);
    return true;
  });

  /**
   * This call adds rules for parsing identifiers to parserRules, and
   * registers callback function that is able to parse identifiers.
   *
   * @param {type} f Function that implements parsing identifiers.
   */
  function addIdentifierParserRule(f) {
    for (var ch in parserRules) {
      if ((ch.toLowerCase() !== ch.toUpperCase()) || (ch === '_')) {
        var nm = parserRules [ch];
        nm [nm.length] = f;
        nm [nm.length] = null;
        addIdentifierParserRuleForNode(nm [0], f);
      }
    }
    otherRule = f;
  }

  /**
   * This call adds rules for parsing identifiers to the concrete node of
   * parserRules table, and registers callback function that is able
   * to parse identifiers.
   *
   * @param {type} f Function that implements parsing identifiers.
   */
  function addIdentifierParserRuleForNode(m, f) {
    for (var ch in m) {
      if ((ch.toLowerCase() !== ch.toUpperCase()) || (ch === '_') ||
          ((ch >= '0') && (ch <= '9'))
      ) {
        var nm = m [ch];
        nm [nm.length] = f;
        nm [nm.length] = null;
        addIdentifierParserRuleForNode(nm [0], f);
      }
    }
  }

  /*
   * Adds rule for parsing indentifiers.
   */
  addIdentifierParserRule(function(index) {
    var st = null;
    for (var i = index; i < this.expression.length; i++) {
      var ch = this.expression.charAt(i);
      if ((ch.toLowerCase() != ch.toUpperCase()) || (ch === '_'))
        continue;
      if ((this.pos < i) &&
          ((ch >= '0') && (ch <= '9'))
      )
        continue;
      break;
    } // for i
    if (this.pos === i) return false;
    if ((this.expected & PRIMARY) === 0) {
      var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNEXPECTED_VARIABLE_FOUND");
      this.parsingError(this.pos, rmsg);
    }

    this.token = this.expression.substr(this.pos, i - this.pos);
    var vartoken = null;
    if (!this.currentTermStart [this.pmatch])
    {
      vartoken = new Token(TOKEN_VARIABLE, this.token, 0, 0);
      this.currentTermStart [this.pmatch] = this.pos;
      this.currentELTermStart [this.pmatch] = this.tokenStack.length;
    } else
      vartoken = new Token(TOKEN_PROPERTY, this.token, 0, 0);

    this.prior = 3;
    this.pos = i;
    this.tokenStack.push(vartoken);
    this.expected = (OPERATOR | HOOK | COLON | RPAREN | COMMA | LPAREN | LBRACE | CALL | CLOSEEXP);
    return true;
  });

  /*
   * Adds rule for parsing string literals.
   */
  addParserRules({"'":0,'"':0}, function(index) {
    var delim = this.expression.charAt(this.pos);
    var esc = false;
    for (var i = index; i < this.expression.length; i++) {
      var ch = this.expression.charAt(i);
      if (ch === '\\')
        esc = true;
      else {
        esc = false;
        if ((!esc) && ch === delim) {
          var str = this.expression.substr(this.pos + 1, i - this.pos - 1);
          this.value = this.unescape(str, this.pos);
          this.pos = i + 1;
          if ((this.expected & PRIMARY) === 0) {
            var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNEXPECTED_STRING_FOUND");

            this.parsingError(this.pos, rmsg);
          }
          var token = new Token(TOKEN_CONSTANT, 0, 0, this.value);
          this.tokenStack.push(token);

          this.expected = (OPERATOR | HOOK | COLON | RPAREN | COMMA | CLOSEEXP);
          return true;
        }
      }
    } // for i
    this.pos = i;
    return false;
  });

  /*
   * Adds rule for parsing whitespaces.
   */
  addParserRules({" ":0,'\n':0,'\r':0,'\t':0}, function(index) {
    this.pos++;
    return true;
  });

  adf.mf.internal.el.parser.cache.clear = function() {
    adf.mf.internal.el.parser.cache.map  = {};
    adf.mf.internal.el.parser.cache.hit  = 0;
    adf.mf.internal.el.parser.cache.miss = 0;
  };

  adf.mf.internal.el.parser.cache.count = function() {
    var count = 0;

    if(adf.mf.internal.el.parser.cache.map != null) {
      for(var key in adf.mf.internal.el.parser.cache.map) {
        ++count;
      }
    }
    return count;
  };

  adf.mf.internal.el.parser.cache.purge = function(expr) {
    if(adf.mf.internal.el.parser.cache.map == null)
    {
      return;
    }
    delete adf.mf.internal.el.parser.cache.map[expr];
  };

  adf.mf.internal.el.parser.cache.lookup = function(expr) {
    var pexp  = null;

    if(adf.mf.internal.el.parser.cache.map == null)
    {
      adf.mf.internal.el.parser.cache.map  = {};
      adf.mf.internal.el.parser.cache.hit  = 0;
      adf.mf.internal.el.parser.cache.miss = 0;
    }

    pexp = adf.mf.internal.el.parser.cache.map[expr];

    if((pexp == undefined) || (pexp == null))
    {
      pexp = new ELParser().parse(expr);
      adf.mf.internal.el.parser.cache.map[expr] = pexp;
      ++adf.mf.internal.el.parser.cache.miss;
    }
    else
    {
      pexp.unflatten();
      ++adf.mf.internal.el.parser.cache.hit;
    }

    return pexp;
  };

  var ELParser = function () {

    /**
     * This method calls parser given expression, and returns ELExpression.
     *
     * @param {string} expr
     * @returns {ELExpression}
     */
    adf.mf.internal.el.parser.parse = function (expr) {
      return adf.mf.internal.el.parser.cache.lookup(expr);
    };

    adf.mf.internal.el.parser.evaluate = function (context, expr) {
      var pexp  = adf.mf.internal.el.parser.cache.lookup(expr);
      return pexp.evaluate(context);
    };

    function ELExpression(tokens, expr, terms, elTerms) {
      this.tokens             = tokens;
      this.stringVersion      = null;
      this.readonly           = null;
      this._expr              = expr;
      this.elTerms            = elTerms;
    }

    adf.mf.internal.el.parser.ELParser = ELParser;
    adf.mf.internal.el.parser.ELExpression = ELExpression;

    /**
     * Expressions are also designed to be immutable so that only one instance needs to be created for
     * any given expression String / {@link FunctionMapper}. This allows a container to pre-create
     * expressions and not have to reparse them each time they are evaluated.
     */
    ELExpression.prototype =
    {
      ensureItIsNotTheNullObject: function(t)
      {
        return (t == null || t[".null"] === true) ? null : t;
      },

      evaluate: function (context)
      {
        var n1, n2, n3, fn, item;
        var nstack       = [];
        var tokenLength  = this.tokens.length;
        var val          = null;
        var ind          = null;
        var ignoreNull   = false;

        for (var i = 0; i < tokenLength; i++)
        {
          item = this.tokens[i];

          var type = item.type;
          switch (type)
          {
            case TOKEN_CONSTANT:
              nstack.push(item.value);
              break;

            case TOKEN_TERNARY_OPERATOR:
              n3 = this.ensureItIsNotTheNullObject(nstack.pop());
              n2 = this.ensureItIsNotTheNullObject(nstack.pop());
              n1 = this.ensureItIsNotTheNullObject(nstack.pop());
              fn = (adf.mf.internal.el.parser.ops.ternaryOperations[item.index])[1]; /* function to execute the operation */
              nstack.push(fn(n1, n2, n3));
              break;

            case TOKEN_BINARY_OPERATOR:
              n2 = this.ensureItIsNotTheNullObject(nstack.pop());
              n1 = this.ensureItIsNotTheNullObject(nstack.pop());
              fn = (adf.mf.internal.el.parser.ops.binaryOperations[item.index])[1]; /* function to execute the operation */
              nstack.push(fn(n1, n2));
              break;

            case TOKEN_DOT_OFFSET:
            case TOKEN_INDEX:
              n2 = nstack.pop();
              n1 = nstack.pop();
              var elResolver = context.getELResolver();

              try
              {
                var val = elResolver.getValue(context, n1, n2);
                nstack.push(val);

                if (type == TOKEN_INDEX)
                {
                  // Not sure why this is needed, but without this functionality,
                  // the control tests will hang on Android, going into an apparent
                  // infinite loop.
                  ignoreNull = true;
                }
              }
              catch (ex)
              {
                if (((typeof n1) !== 'object') && (n2 === "inputValue"))
                {
                  nstack.push(n1);
                }
                else
                {
                  if (type == TOKEN_INDEX || (ignoreNull && type == TOKEN_DOT_OFFSET))
                  {
                    // This is the old approach and preserving backwards compatibility. In Java,
                    // only a MapElResolver will not throw property not found exceptions. The issue
                    // is that in JavaScript, there is no knowledge of a java.util.Map. So, for now
                    // the indexed expression will work like a map evaluation, and the dot notation
                    // as a property lookup.
                    val = n1[n2];
                    nstack.push(val);

                    // Flag this expression as not having been resolved so that it can be added
                    // to the batch at the end (used by adf.mf.el.getLocalValue)
                    adf.mf.internal.el.indexedExpressionUnresolved = true;
                  }
                  else
                  {
                    throw new adf.mf.PropertyNotFoundException(this.getExpression());
                  }
                }
              }
              break;

            case TOKEN_COMMA:
            case TOKEN_COLON:
            case TOKEN_NO_ARGS:
              /* ignore */
              break;

            case TOKEN_PROPERTY:
              nstack.push(item.index);
              break;

            case TOKEN_VARIABLE:
              var elResolver = context.getELResolver();
              try
              {
                var value = elResolver.getValue(context, null, item.index);
                nstack.push(value);
                ignoreNull = false;
              }
              catch (ex)
              {
                throw new adf.mf.PropertyNotFoundException(this.getExpression());
              }
              break;

            case TOKEN_UNARY_OPERATOR:
              n1 = this.ensureItIsNotTheNullObject(nstack.pop());
              fn = (adf.mf.internal.el.parser.ops.unaryOperations[item.index])[1];
              nstack.push(fn(n1));
              break;

            case TOKEN_FUNCTION:
              n1 = nstack.pop();
              fn = nstack.pop();
              if (fn.apply && fn.call)
              {
                if (Object.prototype.toString.call(n1) == "[object Array]") {
                    n1.push(context);
                }
                else {
                  var x = this.ensureItIsNotTheNullObject(n1);

                  n1 = [x];
                  n1.push(context);
                }
                nstack.push(fn.apply(undefined, n1));
              }
              else
              {
                throw new adf.mf.ELException(fn + " is not a function");
              }
              break;
            default:
              throw new adf.mf.ELException("invalid ELExpression - " + type);
          }
        }
        if (nstack.length > 1) {
          throw new adf.mf.ELException("invalid ELExpression (mis-match tokens and operations)");
        }

        return nstack[0];
      },

      setValue: function (context, value)
      {
        if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINEST, "ValueExpression", "setValue",
            ("adfmf- setValue " + this.toString() + " = " + adf.mf.util.stringify(value)));
        }

        var tokens = this.tokens;
        var stack = [];
        var d = tokens.length;
        for (var i = 0; i < d; i++)
        {
          var token = tokens [i];
          switch (token.type)
          {
            case TOKEN_VARIABLE:
              // If the variable is the only token, use the EL resolver to set the value
              if (i == d - 1)
              {
                context.getELResolver().setValue(context, null, token.index, value);
                return;
              }
              var v = null;
              try {
                v = context.getELResolver().getValue(context, null, token.index);
              } catch (e) {
                adf.mf.el.addVariable(token.index, v = {});
              }
              stack.push(v);
              break;

            case TOKEN_PROPERTY:
              stack.push(token.index);
              break;

            case TOKEN_DOT_OFFSET:
            case TOKEN_INDEX:
              var n = stack.pop();
              var baseObject = stack.pop();
              var v = null;

              // If this is the last property of the object, us the EL resolver to
              // set the value
              if (i == d - 1)
              {
                context.getELResolver().setValue(context, baseObject, n, value);

                // Remove the .null if set
                if (baseObject != null)
                {
                  delete baseObject[".null"];
                }

                return;
              }

              try
              {
                v = context.getELResolver().getValue(context, baseObject, n);
              }
              catch (e)
              {
                v = baseObject[n] = {};

                // Remove the .null if set
                delete baseObject[".null"];
              }

              stack.push(v);
              break;

            case TOKEN_CONSTANT:
              stack.push(token.value);
              break;

            case TOKEN_TERNARY_OPERATOR:
              var n3 = this.ensureItIsNotTheNullObject(stack.pop());
              var n2 = this.ensureItIsNotTheNullObject(stack.pop());
              var n1 = this.ensureItIsNotTheNullObject(stack.pop());
              // function to execute the operation
              var fn = (adf.mf.internal.el.parser.ops.ternaryOperations[token.index])[1];

              stack.push(fn(n1, n2, n3));
              break;

            case TOKEN_BINARY_OPERATOR:
              var n2 = this.ensureItIsNotTheNullObject(stack.pop());
              var n1 = this.ensureItIsNotTheNullObject(stack.pop());
              // function to execute the operation
              var fn = (adf.mf.internal.el.parser.ops.binaryOperations[token.index])[1];
              stack.push(fn(n1, n2));
              break;

            default:
              break;
          } // switch
        } // for

        throw new adf.mf.PropertyNotWritableException(this.toString());
      },

      /**
       * Returns the original String used to create this ELExpression, unmodified. This is used for
       * debugging purposes but also for the purposes of comparison (e.g. to ensure the expression in
       * a configuration file has not changed). This method does not provide sufficient information to
       * re-create an expression. Two different expressions can have exactly the same expression
       * string but different function mappings. Serialization should be used to save and restore the
       * state of an ELExpression.
       *
       * @return The original expression String.
       */
      /* String */
      getExpressionString: function() {
        if (!this._expr)
          this.refresh();
        return this._expr;
      },

      /**
       * Get the expression using the EL indexed expression notation. This may be used to create
       * a common syntax to be able to compare two different EL expressions to see if they reference
       * the same object and property.
       * @return {string} the indexed representation as a string
       */
      getIndexedRepresentation: function()
      {
        if (this._indexedExpr == null)
        {
          var stack = [];

          for (var i = 0; i < this.tokens.length; i++)
          {
            var token = this.tokens[i];

            switch (token.type)
            {
              case TOKEN_CONSTANT:
                stack.push(escape(token.value));
                break;
              case TOKEN_TERNARY_OPERATOR:
                var n3 = stack.pop();
                // There may only be one here. This will occur during a dependencies call
                // for example where the EL expression is split into tokens.
                if (stack.length == 0)
                {
                  stack.push(n3);
                }
                else
                {
                  var n2 = stack.pop();
                  var n1 = stack.pop();
                  stack.push("((" + n1 + ")? " + n2 + " : " + n3 + ")");
                }
                break;
              case TOKEN_COMMA:
                var n2 = stack.pop();
                var n1 = stack.pop();
                stack.push("" + n1 + ", " + n2 + "");
                break;
              case TOKEN_COLON:
                break; // ignore
              case TOKEN_NO_ARGS:
                stack.push("");
                break;
              case TOKEN_BINARY_OPERATOR:
                var n2 = stack.pop();
                // There may only be one here. This will occur during a dependencies call
                // for example where the EL expression is split into tokens.
                if (stack.length == 0)
                {
                  stack.push(n2);
                }
                else
                {
                  var n1 = stack.pop();
                  stack.push("(" + n1 + " " + token.index + " " + n2 + ")");
                }

                break;
              case TOKEN_INDEX:
                var n2 = stack.pop();
                var n1 = stack.pop();
                stack.push(n1 + "[" + n2 + "]");
                break;
              case TOKEN_DOT_OFFSET:
                var n2 = stack.pop();
                var n1 = stack.pop();
                stack.push(n1 + '["' + n2 + '"]');
                break;
              case TOKEN_PROPERTY:
                stack.push(token.index);
                break;
              case TOKEN_VARIABLE:
                stack.push(token.index);
                break;
              case TOKEN_UNARY_OPERATOR:
                var n1 = stack.pop();
                switch (token.index)
                {
                  case "!":
                    stack.push("(!" + n1 + ")");
                    break;
                  case "-":
                    stack.push("(-" + n1 + ")");
                    break;
                  default:
                    stack.push(f + "(" + n1 + ")");
                    break;
                }
                break;
              case TOKEN_FUNCTION:
                var n1 = stack.pop();
                var fn = stack.pop();
                stack.push(fn + "(" + n1 + ")");
                break;
              default:
                throw new adf.mf.ELException("Invalid ELExpression");
            }
          }
          if (stack.length > 1)
          {
            console.log(stack);
            throw new adf.mf.ELException("Invalid ELExpression (incorrect number of operands)");
          }

          this._indexedExpr = stack[0];
        }

        return this._indexedExpr;
      },

      getExpression: function() {
        return "#{" + this.getExpressionString() + "}";
      },

      /**
       * Evaluates the expression as an lvalue and determines if {@link #setValue(ELContext, Object)}
       * will always fail.
       *
       * @param context used to resolve properties (<code>base.property</code> and <code>base[property]</code>)
       * and to determine the result from the last base/property pair
       * @return <code>true</code> if {@link #setValue(ELContext, Object)} always fails.
       * @throws ELException if evaluation fails (e.g. property not found, type conversion failed, ...)
       */
      /* boolean */
      isReadOnly: function() {
        if(this.readonly === null) {
          this.readonly = !((this.tokens.length > 0) && (this.tokens[0].type == TOKEN_VARIABLE));
        }
        return this.readonly;
      },

      /**
       * obtain all the variables this expression is dependent on.
       *
       * @returns {Array}
       */
      dependentObjects: function () {
        var tokenLength = this.tokens.length;
        var vars        = [];
        for (var i = 0; i < tokenLength; i++) {
          var item = this.tokens[i];
          if((item.type === TOKEN_VARIABLE) && (vars.indexOf(item.index) == -1)) {
            vars.push(item.index);
          }
        }
        return vars;
      },

      /**
       * convert the ELExpression to a context free expression.
       */
      dependencies: function () {
        if (!this.terms) {
          this.terms = [];
          var elTerms = this.toContextFreeExpression ().getELTerms();
          for (var i = 0; i < elTerms.length; i++) {
            var t = elTerms [i].getExpressionString ();
            this.terms.push (t);
          }
        }
        return this.terms;
      },

      /**
       * Get an array of context free expressions for each dependency in
       * the indexed EL syntax
       * @returns {Array.<string>} array of dependencies in indexed syntax
       */
      getIndexedDependencies: function()
      {
        if (this._indexedDependencies == null)
        {
          // Get all the dependencies in context free form
          var elTerms = this.toContextFreeExpression().getELTerms();
          var deps = [];

          // Cache the value so it only has to be computed once
          this._indexedDependencies = deps;

          for (var i = 0; i < elTerms.length; ++i)
          {
            deps.push(elTerms[i].getIndexedRepresentation());
          }
        }

        return this._indexedDependencies;
      },

      /**
       * Obtain all the terms this expression is dependent on.
       *
       * @returns {Array} This method returns array of ELExpressions.
       */
      getELTerms: function () {
        if (!this.elTerms)
          this.refresh ();
        return this.elTerms;
      },

      /**
       * Concatenates two ELExpressions.
       *
       * @param {Object} ELExpression to be concatenated to this ELExpression.
       */
      concat: function (elExpression) {
        var tokens = this.tokens.slice();
        var firstToken = elExpression.tokens [0];
        var newToken = new Token (TOKEN_PROPERTY, firstToken.index, firstToken.prior, firstToken.value);
        tokens.push(newToken);
        tokens.push(new Token (TOKEN_DOT_OFFSET, ".", -2, 0));
        adf.mf.internal.util.appendAll(tokens, elExpression.tokens, 1);
        var expression = this.getExpressionString() + '.' + elExpression.getExpressionString();
        return new ELExpression (tokens, expression, [expression], null);
      },

      /**
       * Appends array index access this ELExpression.
       *
       * @param {number} array index
       * @returns {Object} ELExpression.
       */
      appendIndex: function (index) {
        var tokens = this.tokens.slice();
        tokens.push (new Token (TOKEN_CONSTANT, 0, 3, index));
        tokens.push (new Token (TOKEN_INDEX, "[", -99, 0));
        var expression = this.getExpressionString() + (typeof index === "string" ? "['" + index + "']" : "[" + index + "]");
        return new ELExpression (tokens, expression, [expression], null);
      },

      cleanup: function(/* Array */ arr, /* Array */ exclude)
      {
        var dfarr  = adf.mf.util.removeDuplicates(arr);
        var elen   = exclude.length;
        var dlen   = dfarr.length;

        for(var e = 0; e < elen; ++e)
        {
          for(var d = 0; d < dlen; ++d)
          {
           if(dfarr[d] == exclude[e]) {
             dfarr.splice(d, 1);
           }
          }
        }

        // alert("cleanup("+arr.join(",")+" and " + exclude.join(",") + ")  ==> " + dfarr);
        return dfarr;
      },

      /**
       * This method computes this._expr, this.terms and this.elTerms variables
       * based on this.tokens value.
       */
      refresh: function () {
        var stack = [];
        var termStart = [];
        var termsMap = {};
        var terms = [];
        var elTerms = [];

        function finishTerm (el, from, to, term) {
          if (!termsMap[term]) {
            termsMap[term] = true;
            terms.push(term);
            var tokens = el.tokens.slice(from, to);
            elTerms.push(new ELExpression(tokens));
          }
        }

        function finishTerms (el, to) {
          for (var i = 2; i < arguments.length; i++) {
            var from = termStart.pop();
            if (from >= 0)
              finishTerm (el, from - 1, to - 1, arguments [i]);
            else
              from = -from;
            to = from;
          }
          termStart.push(-to);
        }

        for (var i = 0; i < this.tokens.length; i++) {
          var token = this.tokens[i];
          var type = token.type;

          if (type === TOKEN_CONSTANT) {
            stack.push(escape(token.value));
            termStart.push(-i-1);
          }
          else if (type === TOKEN_TERNARY_OPERATOR) {
            var n3 = stack.pop();
            var n2 = stack.pop();
            var n1 = stack.pop();
            stack.push("((" + n1 + ")? " + n2 + " : " + n3 + ")");
            finishTerms(this, i + 1, n3, n2, n1);
          }
          else if (type === TOKEN_COMMA) {
            var n2 = stack.pop();
            var n1 = stack.pop();
            stack.push("" + n1 + ", " + n2 + "");
            finishTerms(this, i + 1, n2, n1);
          }
          else if (type === TOKEN_COLON) {
            /* ignore */
          }
          else if (type === TOKEN_NO_ARGS) {
            stack.push("");
            termStart.push(-i-1);
          }
          else if (type === TOKEN_BINARY_OPERATOR) {
            var n2 = stack.pop();
            var n1 = stack.pop();
            stack.push("(" + n1 + " " + token.index + " " + n2 + ")");
            finishTerms(this, i + 1, n2, n1);
          }
          else if (type === TOKEN_INDEX) {
            var n2 = stack.pop();
            var n1 = stack.pop();
            var term = n1 + "[" + n2 + "]";
            stack.push(term);
            var from1 = termStart.pop();
            if (from1 >= 0)
              finishTerm(this, from1 - 1, i, n2);
          }
          else if (type === TOKEN_DOT_OFFSET) {
            var n2 = stack.pop();
            var n1 = stack.pop();
            var n3 = n1 + "." + n2;
            stack.push(n3);
          }
          else if (type === TOKEN_PROPERTY) {
            stack.push(token.index);
          }
          else if (type === TOKEN_VARIABLE) {
            stack.push(token.index);
            termStart.push(i + 1);
          }
          else if (type === TOKEN_UNARY_OPERATOR) {
            var n1 = stack.pop();
            var f = token.index;
            if (f === "!") {
              stack.push("(!" + n1 + ")");
            }
            else if (f === "-") {
              stack.push("(-" + n1 + ")");
            }
            else {
              stack.push(f + "(" + n1 + ")");
            }
            finishTerms(this, i + 1, n1);
          }
          else if (type === TOKEN_FUNCTION) {
            var n1 = stack.pop();
            var fn = stack.pop();
            var n2 = fn + "(" + n1 + ")";
            stack.push(n2);
            var from1 = termStart.pop();
            if (from1 >= 0)
              finishTerm (this, from1 - 1, i, n1);
          }
          else {
            throw new adf.mf.ELException("Invalid ELExpression");
          }
        }
        if (stack.length > 1) {
          throw new adf.mf.ELException("Invalid ELExpression (incorrect number of operands)");
        }
        if (termStart.length > 0) {
          var from = termStart.pop();
          if(from >= 0)
            finishTerm (this, from - 1, i, stack[0]);
        }
        this._expr = stack[0];
        this.elTerms = elTerms;
      },

      /**
       * This method clears cached values of local variables.
       */
      unflatten: function() {
        for (var i = 0; i < this.tokens.length; i++) {
          var token = this.tokens [i];
          if (token.flattened) {
            token.type = TOKEN_VARIABLE;
            token.value = 0;
            token.flattened = false;
          }
        }
      },

      // returns ELExpression
      toContextFreeExpression: function() {
        // for a context free version but not swapping out local variables.
        return this.stripLocalValues (true, undefined, false);
      },

      /**
       * Strips local values.
       *
       * @param {boolean} contextFree
       * @param {array} tokenReplacement
       * @param {boolean} replaceLocalVariables
       * @returns {ELExpression}
       */
      stripLocalValues: function(contextFree, tokenReplacement, replaceLocalVariables) {
        var result = null;
        for (var i = 0; i < this.tokens.length; i++)
        {
          var item = this.tokens[i];
          if (item.type === TOKEN_VARIABLE)
          {
            if(tokenReplacement != null)
            {
              var replacement = tokenReplacement[item.index];
              if (replacement) {
                if (!replacement.tokens) {
                  if(replacement.match(/[#$][{]/g) != null)
                  {
                    replacement = adf.mf.internal.el.parser.parse(replacement);
                  } else {
                    replacement = adf.mf.internal.el.parser.parse("#{" + replacement + "}");
                  }
                }
                result = replaceEL (result, this, i, replacement);
                continue;
              }
            }
            if(contextFree)
            {
              var elResolver = adf.mf.internal.context.getELResolver();
              try {
                var value = elResolver.getValue(adf.mf.internal.context, null, item.index);
                if((value != null) && (value.getAlias !== undefined))
                {
                  // change the variable to be it's context free (alias) form
                  var expandedEL = value.getAlias();
                  result = replaceEL (result, this, i, expandedEL);
                  continue;
                } else
                if(replaceLocalVariables && (value != undefined) && ((typeof value) !== 'object')) {
                  result = replaceValue (result, this, i, value);
                  continue;
                }
              } catch (ex) {
              }
            }
          }
          if (result)
            result.tokens.push (item);
        } // for i

        if (result)
          return result.getEL ();
        this._expr = null;
        return this;
      },

      toString: function() {
          // for a non-context free version and not swapping out local variables.
          return this.getExpressionString();
      }
    };

    function replaceValue (result, el, index, value) {
      if (!result)
        result = new Result (el, index);
      result.tokens.push (new Token(TOKEN_CONSTANT, 0, 0, value));
      return result;
    }

    function replaceEL (result, el, index, insertedEL) {
      if (!result)
        result = new Result (el, index);
      adf.mf.internal.util.appendAll(result.tokens, insertedEL.tokens);
      return result;
    }

    function Result (el, index) {
      this.tokens = el.tokens.slice (0, index);
    }

    Result.prototype.getEL = function () {
      return new ELExpression (this.tokens, null, null, null);
    };


    function ELParser() {
      this.success     = false;
      this.errormsg    = "";
      this.expression  = "";

      this.pos         = 0;

      this.value       = 0;
      this.prior       = 3;
      this.token       = 0;
      this.pmatch      = 0;

    }

    /*
     * Expression Language BNF - taken from the JavaServer Pages 2.0 Specification (Section JSP.2.9 Collected Syntax)
     *
     * Expression           ::= Expression1 ExpressionRest?
     * ExpressionRest       ::= '?' Expression ':' Expression
     * Expression1          ::= Expression BinaryOp Expression | UnaryExpression
     * BinaryOp             ::= 'and' | '&&' | 'or' | '||' | '+' | '-' | '*' | '/' | 'div' | '%' | 'mod' |
     *                          '<' | 'gt' |'>' | 'lt' | '<=' | 'ge' |'>=' | 'le' | '==' | 'eq' | '=!' | 'ne'
     * UnaryExpression      ::= UnaryOp UnaryExpression |   Value
     * UnaryOp              ::= '-' | '!' | 'not' | 'empty'
     * Value                ::= ValuePrefix | Value ValueSuffix
     * ValuePrefix          ::= Literal | '(' Expression ')' | Identifier except for ImplicitObject |
     *                          ImplicitObject | FunctionInvocation
     * ValueSuffix          ::= '.' Identifier | '[' Expression ']'
     * Identifier           ::= Java language identifierCollected Syntax 1-83
     * ImplicitObject       ::= 'pageContext' | 'pageScope' | 'requestScope' | 'sessionScope' | 'applicationScope' |
     *                          'param' | 'paramValues' | 'header' | 'headerValues' | 'initParam' | 'cookie'
     * FunctionInvocation   ::= (Identifier ':')? Identifier '(' ( Expression ( ',' Expression )* )? ')'
     * Literal              ::= BooleanLiteral | IntegerLiteral | FloatingPointLiteral | StringLiteral | NullLiteral
     * BooleanLiteral       ::= 'true' | 'false'
     * StringLiteral        ::= '([^'\]|\'|\\)*' | "*(\\|"\|[\"^])"
     *                          i.e., a string of any characters enclosed by single or double quotes,
     *                                where \ is used to escape ', ", and \. It is possible to use single
     *                                quotes within double quotes, and vice versa, without escaping.
     * IntegerLiteral       ::= ['0'-'9']+
     * FloatingPointLiteral ::= (['0'-'9'])+ '.' (['0'-'9'])* Exponent? | '.' (['0'-'9'])+ Exponent? | (['0'-'9'])+ Exponent?
     * Exponent             ::= ['e','E'] (['+','-'])? (['0'-'9'])+
     * NullLiteral          ::= 'null'
     *
     * Notes
     * - An identifier is constrained to be a Java identifier - e.g., no -, no /, etc.
     * - A String only recognizes a limited set of escape sequences, and \ may not appear unescaped.
     * - The relational operator for equality is == (double equals).
     * - The value of an IntegerLiteral ranges from Long.MIN_VALUE to Long.MAX_VALUE
     * - The value of a FloatingPointLiteral ranges from Double.MIN_VALUE to Double.MAX_VALUE
     */
    ELParser.prototype = {
      parse: function (expr) {
        var insideExpression    = false;
        this.operatorStack      = [];
        this.tokenStack         = [];
        this.expected           = (OPENEXP);
        this.nooperands         = 0;
        var token               = null;
        this.pmatch             = 0;
        this.errormsg           = "";
        this.success            = true;
        this.expression         = expr;
        this.pos                = 0;
        this.text               = 0;
        this.expCount           = 0;
        this.currentELTermStart = {};
        this.currentTermStart   = {};
        this.elTerms            = [];
        this.terms              = [];
        this.termsMap           = {};

        /* look for nested EL expressions */
        if(expr.match(new RegExp(".*[$#]{[^}]*[$#]{")))  {
          this.parsingError(this.pos, "ERROR_EL_PARSER_NESTED_EL_NOT_SUPPORTED");
        }

        while (this.pos < this.expression.length) {
          if((this.expected & OPENEXP) == OPENEXP) {
            if (this.isExpressionDirective()) {
              /* we have a potential expression */
            }
            else {
              var txt = null;

              if (this.pos + 1 == this.expression.length) {
                txt = this.expression.substring(this.text, this.expression.length);
                if(this.text !== 0){
                  this.expCount++;
                }
              }
              else if (this.isOpenExpression()) {
                this.expCount++;
                txt           = this.expression.substring(this.text, this.pos - 1);
                this.expected = (PRIMARY | LPAREN | RPAREN | FUNCTION | SIGN | UNIOP | CLOSEEXP);
              }

              // in this case have something like: xxx#{...}
              // we want the xxx to be concatenated on the result of #{...}
              if((txt !== null) && (txt.length > 0)) {
                var t   = new Token(TOKEN_CONSTANT, 0, 0, txt);

                if(this.expCount++ > 1) {
                  this.token   = "+";   // should go to # if we should concat
                  this.prior   = 30;    // 30 = 3 (for add) * 10 (to ensure it is always the last precedence)
                  this.nooperands  += 2;
                  this.addfunc(TOKEN_BINARY_OPERATOR);
                  this.text    = this.pos;
                }

                this.tokenStack.push(t);
              }
            }
            this.pos++;
          }
          else
            if (parseToken(this)) {
            }
          else {
            if (this.errormsg === "") {
              var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNKNOWN_CHAR_FOUND", [this.expression.charAt(this.pos)]);

              this.parsingError(this.pos, rmsg);
            }
            else {
              this.parsingError(this.pos, this.errormsg);
            }
          }
        }
        if (insideExpression) {
          var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_MISSING_ENDING");

          this.parsingError(this.pos, rmsg);
        }
        if (this.pmatch != 0) {
          var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_MISMATCH");

          this.parsingError(this.pos, rmsg);
        }
        while (this.operatorStack.length > 0) {
          var tmp = this.operatorStack.pop();
          this.tokenStack.push(tmp);
        }
        if(this.tokenStack.length == 0) {
          token = new Token(TOKEN_CONSTANT, 0, 0, "");
          this.tokenStack.push(token);
        }
        if (this.nooperands + 1 !== this.tokenStack.length) {
          var  msg = "{";
          for(var i=0; i < this.tokenStack.length; ++i) {
            msg += " token["+i+"] = '" + this.tokenStack[i].toString() + "' ";
          }
          msg += "}";

          var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_INCORRECT_OPERANDS",
                                                                    [("[" + (this.nooperands + 1) + ", " + this.tokenStack.length + "]"), msg]);

          this.parsingError(this.pos, rmsg);
        }
        return new ELExpression(this.tokenStack, null, null, this.elTerms);
      },

      finishTerm: function (endPosition)
      {
        this.finishTermTokens();

        var termStart = this.currentTermStart[this.pmatch];
        if (!termStart)
        {
          return;
        }

        var term = this.expression.substr(termStart, endPosition - termStart).trim();
        var elTermStart = this.currentELTermStart[this.pmatch];
        var newELTerm = null;

        if (!this.termsMap[term])
        {
          if (elTermStart === 0 &&
              endPosition === this.expression.length)
          {
            newELTerm = this;
          }
          else
          {
            var termExpression = this.tokenStack.slice(elTermStart);
            newELTerm = new ELExpression(termExpression, term, [term], null);
          }

          this.elTerms.push(newELTerm);
          this.termsMap[term] = true;
        }

        this.currentTermStart[this.pmatch]   = null;
        this.currentELTermStart[this.pmatch] = null;
      },

      evaluate: function (expr, variables) {
        var /* ELExpression */ elExpr = this.parse(expr);
        var /* var array    */ vars   = [];
        var /* return value */ v;

        try
        {
          v = elExpr.evaluate(variables);
        }
        catch(e)
        {
          try
          {
            vars = elExpr.dependencies();
          }
          catch(e2)
          {
            vars = [];
          }
          vars.push(expr);

          var  rmsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_EL_PARSER_UNABLE_TO_RESOLVE", [expr]);

          teval = {"msg": rmsg, "variables": vars};
          throw e;
        }
        return v;
      },

      parsingError: function (column, msg) {
        this.success = false;
        this.errormsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_IN_EL_PARSING", [msg, column, this.expression]);

        /* this is a huge issue, log a message in case the caller is not catching exceptions */
              adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.internal.el.parser", "EL Parser", this.errormsg);

        throw new adf.mf.ELException(this.errormsg);
      },

      finishTermTokens: function ()
      {
        while (this.operatorStack.length > 0)
        {
          if (this.operatorStack[this.operatorStack.length - 1].type == TOKEN_DOT_OFFSET)
          {
            this.tokenStack.push(this.operatorStack.pop());
          }
          else
          {
            break;
          }
        }
      },

      addfunc: function (type) {
        var operator = new Token(type, this.token, this.prior - this.pmatch, 0);
        while (this.operatorStack.length > 0) {
          if (operator.prior >= this.operatorStack[this.operatorStack.length - 1].prior) {
            this.tokenStack.push(this.operatorStack.pop());
          }
          else {
            break;
          }
        }
        this.operatorStack.push(operator);
      },

      /**
       * unescape an input string into a normal string
       *
       * @param input string to unescape
       * @param pos   in the overall expression we are unescaping
       *
       * @returns the unescaped string
       */
      unescape: function(input, pos) {
        var buf    = [];
        var escape = false;

        for (var i = 0; i < input.length; i++) {
          var c = input.charAt(i);

          if (! escape) {
            if (c == '\\') { /* turn on escaping */
              escape = true;
            } else {  /* non-escaped character, just add it to the buffer */
              buf.push(c);
            }
          } else { /* character following the escape character \\ */
            switch (c) {
            case '\\': buf.push('\\'); break;
            case '/':  buf.push('/');  break;
            case 'b':  buf.push('\b'); break;
            case 'f':  buf.push('\f'); break;
            case 'n':  buf.push('\n'); break;
            case 'r':  buf.push('\r'); break;
            case 't':  buf.push('\t'); break;
            case 'u':  /* following 4 chars make up the hex code for the character */
              var unicodeCode = parseInt(input.substring(i+1, i+5), 16);
              buf.push(String.fromCharCode(unicodeCode)); // add the string representation of the unicode char
              i += 4;
              break;
            default:
              throw this.parsingError(pos + i, "Illegal escape sequence: '\\" + c + "'");
            }
            escape = false;
          }
        }

        return buf.join('');  /* convert the array to a single string */
      },

      /**
       * Determine if the next token is a sign token (- or +)
       *
       * @returns {Boolean}
       */
      isSign: function () {
        var code = this.expression.charCodeAt(this.pos - 1);
        return (code === 45 || code === 43); // - or +
      },

      /**
       * Determine if the next token is a negative sign token
       *
       * @returns {Boolean}
       */
      isNegativeSign: function () {
        return (this.expression.charCodeAt(this.pos - 1) === 45); // -
      },

      /**
       * Determine if the next token is a dot token
       *
       * @returns {Boolean}
       */
      isDot: function () {
        var code = this.expression.charCodeAt(this.pos);
        if (code === 46) { // .
          this.pos++;
          this.prior = 0;
          return true;
        }
        return false;
      },

      /**
       * Determine if the next token is the open expression token
       *
       * @returns {Boolean}
       */
      isOpenExpression: function () {
        var code = this.expression.charCodeAt(this.pos);
        if ((code === 123) && (this.directive+1 == this.pos)){ // {
          // this.pos++;
          return true;
        }
        return false;
      },

      /**
       * Determine if this is a expression directive.
       *
       * @returns {Boolean}
       */
      isExpressionDirective: function () {
        var status = false;
        var code   = this.expression.charCodeAt(this.pos);

        if ((code === 35 /* # */) || (code === 36 /* $ */)) {
          this.directive = this.pos;
          status         = true;
        }
        return status;
      },

      /**
       * Determine if the next token is ends the operator
       *
       * @returns {Boolean}
       */
      isOperatorBoundary: function (pos) {
        var code = this.expression.charCodeAt(pos);

        if (code === 40 /* (     */ ||
          code === 32 /* space */ ||
          code ===  9 /* tab   */ ||
          code === 10 /* LF    */ ||
          code === 13 /* CR    */) {
          return true;
        }
        return false;
      },

      /**
       * Determine if the next token is a variable token
       *
       * @returns {Boolean}
       */
      isVariable: function () {
        var str       = "";
        var length    = 0;

        for (var i = this.pos; i < this.expression.length; i++) {
          var c           = this.expression.charAt(i);
          var includeChar = true;

          /* see if this character is not a valid character for a name */
          if(str === "") {
            /* first character must be alpha except for compressed keys
             * which will start with _ (and be in the form of _999)
             */
            if((c.toLowerCase() == c.toUpperCase()) && (c !== '_')) {
              break;
            }
          }

          if(c.toLowerCase() == c.toUpperCase()) {
            if(((c >= '0') && (c <= '9')) ||    /* numbers are validate             */
               ((c == '.') || (c == '_'))) {    /* dot and underscore are also okay */
              }else break;
          }

          length++;
          if(includeChar) {
            str += c;
          }
        }
        if (str.length > 0) {
          this.token  = str;
          this.prior  = 3;
          this.pos   += length; // str.length;
          return true;
        }
        return false;
      },

      /**
       * Determine if the next token is a comment token.
       *
       * @returns {Boolean}
       */
      isComment: function () {
        /*
         * remember we need to look back one character for the slash since it might
         * have been picked up as a unary or binary operation token.
         */
        var code = this.expression.charCodeAt(this.pos - 1);

        if ((code === 47 /* slash */) && (this.expression.charCodeAt(this.pos) === 42 /* start */)) {
          this.pos = this.expression.indexOf("*/", this.pos) + 2; /* eat all those characters */

          if (this.pos === 1) {
            this.pos = this.expression.length;
          }
          return true;
        }
        return false;
      }
    };

    function escape(v) {
      var quote     = "\""; // "'";
      var escapable = /[\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
      var meta      = { '\b': '\\b','\t': '\\t','\n': '\\n','\f': '\\f','\r': '\\r','\\': '\\\\' };
      if ((typeof v) === "string") {
        escapable.lastIndex = 0;
            return escapable.test(v) ?
                quote + v.replace(escapable, function (a) {
                      var c = meta[a];
                      return ((typeof c === 'string')? c :
                          '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4));
                  }) + quote :
                  quote + v + quote;
      }
      return v;
    }

    return ELParser;
  }();
})();


/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/ELParser.js///////////////////////////////////////



/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/AdfPerfTiming.js///////////////////////////////////////

/* Copyright (c) 2011, 2014, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- AdfPerfTiming.js ---------------------- */
// @requires Adflog
// @requires ELErrors

var adf                    = window.adf                 || {};
adf.mf                     = adf.mf                     || {};
adf.mf.api                 = adf.mf.api                 || {};
adf.mf.el                  = adf.mf.el                  || {};
adf.mf.locale              = adf.mf.locale              || {};
adf.mf.log                 = adf.mf.log                 || {};
adf.mf.resource            = adf.mf.resource            || {};
adf.mf.util                = adf.mf.util                || {};

adf.mf.internal            = adf.mf.internal            || {};
adf.mf.internal.api        = adf.mf.internal.api        || {};
adf.mf.internal.el         = adf.mf.internal.el         || {};
adf.mf.internal.el.parser  = adf.mf.internal.el.parser  || {};
adf.mf.internal.locale     = adf.mf.internal.locale     || {};
adf.mf.internal.log        = adf.mf.internal.log        || {};
adf.mf.internal.mb         = adf.mf.internal.mb         || {};
adf.mf.internal.perf       = adf.mf.internal.perf       || {};
adf.mf.internal.resource   = adf.mf.internal.resource   || {};
adf.mf.internal.util       = adf.mf.internal.util       || {};

/**
 * adf.mf.internal.perf consists of a set of javascript functions
 * to instrument the adf.mf javascript sub-systems
 *
 * HOW-TO USE THIS:
 * Declare the performance loggers
 *
 *    # used to control what monitors are captured in the list of monitors
 *    oracle.maf.performance.monitor.captured.useParentHandlers=false
 *    oracle.maf.performance.monitor.captured.handlers=oracle.adfmf.util.logging.ConsoleHandler
 *    oracle.maf.performance.monitor.captured.level = FINEST
 *    
 *    # used to control what monitor observations (start/stop times) are logged.
 *    oracle.maf.performance.monitor.observations.reported=false
 *    oracle.maf.performance.monitor.observations.reported.handlers=oracle.adfmf.util.logging.ConsoleHandler
 *    oracle.maf.performance.monitor.observations.reported.level = FINEST
 */
 
(function()
{
  //
  // JS representation of "oracle.maf.performance.monitor.observations.reported" logger
  //
  var perfMonReportedLogger = adf.mf.log.PerfMonReported = adf.mf.log.PerfMonReported ||
    new adf.mf.log.logger("oracle.maf.performance.monitor.observations.reported");
  //
  // JS representation of "oracle.maf.performance.monitor.captured" logger
  //
  var perfMonCapturedLogger = adf.mf.log.PerfMonCaptured = adf.mf.log.PerfMonCaptured ||
    new adf.mf.log.logger("oracle.maf.performance.monitor.captured");

  // ============================================================================================
  // Private methods and variables
  // Uncomment the following lines, in order to obtain performance numbers for start up.
  //perfMonReportedLogger.init(adf.mf.log.level.FINE,
  //  "[%LEVEL% - %LOGGER% - %CLASS% - %METHOD%] %MESSAGE%");
  //perfMonCapturedLogger.init(adf.mf.log.level.FINE,
  //  "[%LEVEL% - %LOGGER% - %CLASS% - %METHOD%] %MESSAGE%");
  //

  var FINEST = adf.mf.log.level.FINEST;
  var FINER = adf.mf.log.level.FINER;
  var FINE = adf.mf.log.level.FINE;
  var INFO = adf.mf.log.level.INFO;

  var noop = function() {};
  var noopTask = { "stop" : noop, "setInstanceName" : noop}; 
  var Assert = adf.mf.api.AdfAssert;

  /////////////////////////////////////////////////////////////////////////////////////////////////
  // Task object (base class)
  function Task(name)
  {
    this.Init(name);
  }

  adf.mf.api.AdfObject.createSubclass(Task, adf.mf.api.AdfObject, "Task");

  Task.InitClass = function()
  {
    // Used to keep a unique ID per task to identify it
    this._nextId = 1;
    // Tasks that are currently running
    this._activeTasks = [];
    this.VisitResult = { "ACCEPT": 0, "REJECT": 1, "COMPLETE": 2 };
  };

  /**
   * Get the most recent task that was started
   */
  Task.getActiveTask = function()
  {
    return (Task._activeTasks.length == 0) ?
      null : Task._activeTasks[Task._activeTasks.length - 1];
  };

  Task.prototype.Init = function(name)
  {
    this._id = Task._nextId++;
    this._name = name;
    this._parent = null;
    this._tasks = [];
    this._start = null;
    this._stop = null;
    this._tasksCompletedAt = null;
    this._activeTaskCount = 0;
    this._level = FINEST;
    this._description = null;
    this._instanceName = null;
  };

  Task.prototype.getIdentifier = function()
  {
    // Lazily create it for performance as we won't always need it
    if (this._identifier == null)
    {
      this._identifier = this.constructor.name + "[" + this._id + "/" + this._name + "]";
    }

    return this._identifier;
  };

  /**
   * Get the count of the tasks that are still running
   * @return {Number} the active count
   */
  Task.prototype.getActiveTaskCount = function()
  {
    return this._activeTaskCount;
  };

  /**
   * @return {Number} the unique ID of the task
   */
  Task.prototype.getId = function()
  {
    return this._id;
  };

  /**
   * @return {string} the friendly name of the task
   */
  Task.prototype.getName = function()
  {
    return this._name;
  };

  /**
   * @return {Task} the parent or null if a top level task
   */
  Task.prototype.getParent = function()
  {
    return this._parent;
  };
  
  Task.prototype.getLevel = function()
  {
    return this._level;
  };
  
  Task.prototype.setLevel = function(level)
  {
    this._level = level;
  };
  
  Task.prototype.getDescription = function()
  {
    return this._description;
  };
  
  Task.prototype.setDescription = function(description)
  {
    this._description = description;
  };
  
  Task.prototype.getInstanceName = function()
  {
    return this._instanceName;
  };
  
  Task.prototype.setInstanceName = function(instanceName)
  {
    this._instanceName = instanceName;
  };

  /**
   * @return {Operation} the closest parent operation or null if none
   */
  Task.prototype.getParentOperation = function()
  {
    for (var p = this._parent; p != null; p = p.getParent())
    {
      if (p instanceof Operation)
      {
        return p;
      }
    }

    return null;
  };

  /**
   * Add a child
   * @param {Task} task the child
   */
  Task.prototype.addChildTask = function(task)
  {
    if (this._stop != null)
    {
      Assert.assert(false,
        "addChildTask called on a stopped task: " + this.getIdentifier() +
        ", attempting to add " + task.getIdentifier());
    }
    this._tasks.push(task);
    ++this._activeTaskCount;
  };

  /**
   * Start the task running
   */
  Task.prototype.start = function()
  {
    if (this._start != null)
    {
      Assert.assert(
        false,
        "start called on a task that was already started: " + this.getIdentifier());
    }

    this._start = (new Date()).getTime();
    this._parent = Task.getActiveTask();

    if (this._parent != null)
    {
      this._parent.addChildTask(this);
    }

    Task._activeTasks.push(this);

    return this;
  };

  /**
   * Stop the task (may not be yet completed if there are children tasks still running)
   * @param {boolean} check if the task was already stopped, and if so, don't stop it again
   */
  Task.prototype.stop = function(checkStopped)
  {
    try
    {
      if (this._stop != null)
      {
        if (checkStopped)
        {
          return;
        }
        Assert.assert(
          false,
          "stop called on a task that was already stopped: " + this.getIdentifier());
      }
      
      
      this._stop = (new Date()).getTime();

      // Notify the sub-class
      this.Stopped();

      // See if this task is now complete
      this._checkComplete();
    }
    catch (e)
    {
      // Eat any exceptions in the performance code to prevent issues loading the page
      if (perfMonReportedLogger.isLoggable(FINEST))
      {
        perfMonReportedLogger.logp(FINEST,
          "adf.mf.internal.perf.Task", "stop",
          "Exception thrown " + e.message);
      }
      return { "stop": noop };
    }
  };
  

  /**
   * @return {Number} the start time (ms) of the task or null if not started
   */
  Task.prototype.getStart = function()
  {
    return this._start;
  };

  /**
   * @return {Number} the stop time (ms) of the task or null if not yet stopped.
   */
  Task.prototype.getStop = function()
  {
    return this._stop;
  };

  /**
   * @return {Number} the time (ms) between the start and stop times (may be null if not yet stopped)
   */
  Task.prototype.getElapsed = function()
  {
    return (this._start == null || this._stop == null) ?
      null : (this._stop - this._start);
  };

  /**
   * @return {Number} the time (ms) between the start and when the task was completed (all children
   * completed)
   */
  Task.prototype.getTotalElapsed = function()
  {
    return (this._start == null || this._tasksCompletedAt == null) ?
      null : (this._tasksCompletedAt - this._start);
  };

  /**
   * @return {Number} the time (ms) of the task completion or null if not yet stopped or children
   * tasks are still running
   */
  Task.prototype.getTasksCompletedAt = function()
  {
    return this._tasksCompletedAt;
  };

  /**
   * Visit interface. The callback accepts the task and returns a Task.VisitResult object.
   * @return {bool} true if visiting should continue
   */
  Task.prototype.visit = function(callback)
  {
    var result = callback(this);
    switch (result)
    {
      case Task.VisitResult["ACCEPT"]:
        for (var t = 0, numTasks = this._tasks.length; t < numTasks; ++t)
        {
          var task = this._tasks[t];
          if (!task.visit(callback))
          {
            return false;
          }
        }
        return true;
      case Task.VisitResult["REJECT"]:
        return true;
      case Task.VisitResult["COMPLETE"]:
      default:
        return false;
    }
  };

  /**
   * Check if the task was forced to complete (took too long)
   */
  Task.prototype.wasForcedToComplete = function()
  {
    return this._forceCompleted === true;
  };

  /**
   * Force a long running task to complete
   */
  Task.prototype.forceComplete = function()
  {
    if (this._tasksCompletedAt == null)
    {
      this._forceCompleted = true;
      for (var t = 0, numTasks = this._tasks.length; t < numTasks; ++t)
      {
        var task = this._tasks[t];

        if (task._tasksCompletedAt == null)
        {
          // Forcing the child to complete should result in the _childTaskComplete call
          // from the child and therefore the _activeTaskCount should be decremented
          // by the end of this function and the _checkComplete will run
          task.forceComplete();
        }

        if (this._tasksCompletedAt != null)
        {
          break;
        }
      }

      if (this._stop == null)
      {
        this.stop();
      }
    }

    Assert.assert(this._tasksCompletedAt != null,
      "Task was forced to complete, but is still active");
  };

  /**
   * Gets the monitor ID. This ID includes the path to indicate the correct nesting level.
   *
   * @return {string} the monitor ID of this task
   */
  Task.prototype.getMonitorId = function()
  {
    var monitorId = this.getName();
    return monitorId;
  };

  /**
   * Function for sub-classes
   */
  Task.prototype.Completed = function() {}

  /**
   * Function for sub-classes
   */
  Task.prototype.Stopped = function() {}

  Task.prototype._checkComplete = function()
  {
    if (this._stop != null && this._tasksCompletedAt == null)
    {
      if (this._activeTaskCount == 0)
      {
        this._tasksCompletedAt = (new Date()).getTime();

        var activeTask = Task.getActiveTask();
        if (activeTask != this)
        {
          Assert.assert(false,
            "Task that was not the active one was completed. Completed task: " +
            this.getIdentifier() + ". Active task: " + activeTask.getIdentifier());
        }

        Task._activeTasks.pop();

        // Notify the sub-class
        this.Completed();

        if (this._parent != null)
        {
          // Notify the parent
          this._parent._childTaskComplete(this);
        }
      }
    }
  };

  Task.prototype._childTaskComplete = function(task)
  {
    --this._activeTaskCount;
    this._checkComplete();
  };

  // Since Task has static methods, ensure that it is initialized before the first instance has
  // been created
  adf.mf.api.AdfObject.ensureClassInitialization(Task);

  /////////////////////////////////////////////////////////////////////////////////////////////////
  // Operation object

  /**
   * Function representing an operation to track performance. All method calls during the operation
   * are tracked as part of the operation.
   */
  function Operation(name, description, level)
  {
    this.Init(name, description, level);
  }

  adf.mf.api.AdfObject.createSubclass(Operation, Task, "Operation");

  Operation.InitClass = function()
  {
    this._activeOperation = null;
    this._completedOperations = [];
  };

  Operation.prototype.Init = function(name, description, level)
  {
    Operation.superclass.Init.call(this, name);
    this.setDescription(description);
    this.setLevel(level);
  };

  // Static members

  /**
   * Checks if there is a top level operation currently running
   * @return {boolean} true if there is an active operation
   */
  Operation.isOperationActive = function()
  {
    return Operation._activeOperation != null;
  };

  /**
   * Start the operation. Tracks the start time and either sets the operation as the top active
   * operation or adds it as a child to the last operation started.
   */
  Operation.prototype.start = function()
  {
    Operation.superclass.start.call(this);

    if (this.getParent() == null)
    {
      Operation._activeOperation = this;
    }
  };

  /**
   * Called when an operation is done. For the top level operation this will start the process
   * of sending the data to the embedded side for logging as a monitor observation.
   */
  Operation.prototype.Stopped = function()
  {
    if (Operation._activeOperation == this && this.getActiveTaskCount() > 0)
    {
      // This is the top level operation, but tasks are still active.
      // Wait up to 10 seconds for any active calls to complete
      if (this._waitingOnCompletionTimeout == null)
      {
        this._waitingOnTaskCompletion = window.setTimeout(
          this._activeTaskTimeout.bind(this), 10000);
      }
    }
  };

  Operation.prototype.Completed = function()
  {
    if (Operation._activeOperation == this)
    {
      Operation._activeOperation = null;
    }

    if (this.getParent() == null)
    {
      this._sendToEmbedded();
    }
  };

  /**
   * Called from the timeout set in the stop method if not all the children calls and operations
   * were complete at the time. If this method is called, the code will stop waiting for those to
   * complete, assuming them to be broken in some way.
   */
  Operation.prototype._activeTaskTimeout = function()
  {
    delete this._waitingOnTaskCompletion;

    if (this.getTasksCompletedAt() == null)
    {
      this.forceComplete();
    }
  };

  /**
   * Appends the monitor observations for this operation to the passed in array.
   * @param {Array.<Object>} monitorObservations the array to append to
   */
  Operation.prototype._appendMonitorObservations = function(monitorObservations)
  {
    this.visit(
      function (task)
      {
        var id = task.getMonitorId();
        var taskData =
        {
          "id": id,
          //
          // Stop time does not need to be sent, it can be calculated based on duration
          //
          "duration": task.getTotalElapsed(),
          "start": task.getStart(),
          "level" : task.getLevel().toString()
        };
        
        //
        // Description is optional. For common tasks, it is defined in MonitorFactory on the Embedded side
        //
        var description = task.getDescription();
        if (description)
        {
          taskData["description"] = description;
        }
        var instanceName = task.getInstanceName();
        if (instanceName)
        {
          taskData["instanceName"] = instanceName;
        }

        monitorObservations.push(taskData);
        return Task.VisitResult["ACCEPT"];
      });
  };

  /**
   * Sends the information to the embedded side to be logged as a monitor observation
   */
  Operation.prototype._sendToEmbedded = function()
  {
    this._active = null;

    // See if there is an active operation. If so, delay the sending of the data until no
    // operations are currently running. This allows the code to try to find a time that the UI is
    // not busy to send the data, reducing the hit on performance
    if (Operation._activeOperation != null)
    {
      Operation._completedOperations.push(this);

      if (perfMonReportedLogger.isLoggable(FINEST))
      {
        perfMonReportedLogger.logp(FINEST, "adf.mf.internal.perf.Operation", "_sendToEmbedded",
          "Another operation is currently running, waiting to send the data to the embedded side " +
          "until that operation completes");
      }

      return;
    }

    var numCompletedOperations = Operation._completedOperations.length;
    var monitorObservations = [];

    // If there are any operations that were delayed send their observations as well
    if (numCompletedOperations > 0)
    {
      for (var i = 0; i < numCompletedOperations; ++i)
      {
        var op = Operation._completedOperations[i];
        op._appendMonitorObservations(monitorObservations);
      }
      Operation._completedOperations = [];
    }

    this._appendMonitorObservations(monitorObservations);
    
    // If this send is a result of story ending, let Embedded side know
    if (this._storyEnding != null)
    {
      monitorObservations.push({"story" : this._storyEnding});
    }
    adf.mf.api.invokeMethod(
      "oracle.adfmf.framework.api.Model",
      "addMonitorObservations",
      monitorObservations, noop, noop);
  };

  // Since Operation has static methods, ensure that it is initialized before the first instance has
  // been created
  adf.mf.api.AdfObject.ensureClassInitialization(Operation);

  /////////////////////////////////////////////////////////////////////////////////////////////////
  // Call object

  /**
   * Call object. Used for tracking start and stop calls on code functions.
   * @param {String} name the name of the call being made. Typically the fully qualified path
   *        to the function being executed
   */
  function Call(name, description, level)
  {
    this.Init(name);
    this.setDescription(description);
    this.setLevel(level);
  }

  adf.mf.api.AdfObject.createSubclass(Call, Task, "Call");

  Call.prototype.toString = function()
  {
    return this.getIdentifier();
  };

  // ============================================================================================
  // API methods

  /**
   * Notifies the framework of the start of an operation. An operation is a long running process to
   * be tracked for performance. Calls during the operation may be tracked to determine the
   * breakdown of the time spent in an operation. Operations may be nested but should only be used
   * to track major events (load page, navigation, handle data change event, etc.).
   *
   * @param {string} name the name of the operation
   * @param {Object} logging level for this operation
   * @param {string} description a description of the operation
   * @param {string} an optional instance name for this operation. For example, page name.
   * @return {{stop: function()}} an object with a stop function that must be called when the
   *         operation has completed
   */
  adf.mf.internal.perf.startMonitorOperation = function(name, level, description, instanceName)
  {
    //
    // Only start Operation if the captured logging level allows it
    //
    if (perfMonCapturedLogger.isLoggable(level))
    {
      try
      {
        var op = new Operation(name, description, level);
        if (instanceName != undefined)
        {
          op.setInstanceName(instanceName);
        }
        op.start();
        return op;
      }
      catch (e)
      {
        // Eat any exceptions in the performance code to prevent issues loading the page
        if (perfMonReportedLogger.isLoggable(FINEST))
        {
          perfMonReportedLogger.logp(FINEST, "adf.mf.internal.perf", "startMonitorOperation", "Exception thrown " +
            e.message);
        }
      }
    }
    return noopTask;
  }

  /**
   * Notifies the framework of a method call to be tracked as part of the time breakdown of an
   * operation. This should be used for methods that contribute to the overhead of an operation
   * and should therefore be tracked to determine performance changes.
   *
   * @param {string} name the name of the method
   * @param {Object} an optional logging level for this operation
   * @param {string} an optional description a description of the call
   * @param {string} an optional instance name forf this call. For example, component id.
   * @return {{stop: function()}} an object with a stop function that must be called when the
   *         call has completed. The stop function may be called asynchronously.
   */
  adf.mf.internal.perf.startMonitorCall = function(name, level, description, instanceName)
  {
    //
    // Only start Calls if the captured logging level allows it and Operation is active
    //
    if (Operation.isOperationActive() && perfMonCapturedLogger.isLoggable(level))
    {
      try
      {
        var call = new Call(name, description, level);
        if (instanceName != undefined)
        {
          call.setInstanceName(instanceName);
        }
        call.start();
        return call;
      }
      catch (e)
      {
        // Eat any exceptions in the performance code to prevent issues loading the page
        if (perfMonReportedLogger.isLoggable(FINEST))
        {
          perfMonReportedLogger.logp(FINEST, "adf.mf.internal.perf", "startMonitorCall", "Exception thrown " + e.message);
        }
        return noopTask;
      }
    }
    else
    {
      return noopTask;
    }
    return noopTask;
  };
  
  adf.mf.internal.perf.startOperation = function(name, description)
  {
    if (perfMonReportedLogger.isLoggable(FINE))
    {
      perfMonReportedLogger.logp(FINE, "adf.mf.internal.perf", "startOperation",
        "Use adf.mf.internal.perf.startMonitorOperation instead.");
    }
    return noopTask;
  }
  
  adf.mf.internal.perf.start = function(name)
  {
    if (perfMonReportedLogger.isLoggable(FINE))
    {
      perfMonReportedLogger.logp(FINE, "adf.mf.internal.perf", "start",
        "Use adf.mf.internal.perf.startMonitorCall instead.");
    }
    return noopTask;
  };
  
  
  /**
   * Forces all active Operations to stop.
   * @param {string} name the story that is ending
   * @return {bool} true if Operations were forced to stop
   */
  adf.mf.internal.perf.forceComplete = function(story)
  {
    if (Operation.isOperationActive())
    {
      try
      {
        Operation._activeOperation._storyEnding = story;
        Operation._activeOperation.forceComplete();
        return true;
      }
      catch (e)
      {
        // Eat any exceptions in the performance code
        if (perfMonReportedLogger.isLoggable(FINEST))
        {
          perfMonReportedLogger.logp(FINEST, "adf.mf.internal.perf", "forceComplete", "Exception thrown " + e.message);
        }
      }
    }
    return false;
  }

  /**
   * ADFc is still using this function, disable it instead of removing it so that the calling code
   * will not fail.
   * @deprecated Use adf.mf.internal.perf.start for method calls and
   *             adf.mf.internal.perf.startOperation for major operations (page loading, page
   *             navigation, etc.)
   */
  adf.mf.internal.perf.perfTimings = noop;
})();


/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/AdfPerfTiming.js///////////////////////////////////////



/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/Utilities.js///////////////////////////////////////

/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- Utilities.js ---------------------- */
// @requires AdfPerfTiming


var adf                                       = window.adf                                    || {};
adf.mf                                        = adf.mf                                        || {};
adf.mf.api                                    = adf.mf.api                                    || {};
adf.mf.el                                     = adf.mf.el                                     || {};
adf.mf.locale                                 = adf.mf.locale                                 || {};
adf.mf.log                                    = adf.mf.log                                    || {};
adf.mf.resource                               = adf.mf.resource                               || {};
adf.mf.util                                   = adf.mf.util                                   || {};

adf.mf.internal                               = adf.mf.internal                               || {};
adf.mf.internal.api                           = adf.mf.internal.api                           || {};
adf.mf.internal.converters                    = adf.mf.internal.converters                    || {};
adf.mf.internal.converters.dateParser         = adf.mf.internal.converters.dateParser         || {};
adf.mf.internal.converters.dateParser.iso8601 = adf.mf.internal.converters.dateParser.iso8601 || {};
adf.mf.internal.el                            = adf.mf.internal.el                            || {};
adf.mf.internal.el.parser                     = adf.mf.internal.el.parser                     || {};
adf.mf.internal.locale                        = adf.mf.internal.locale                        || {};
adf.mf.internal.log                           = adf.mf.internal.log                           || {};
adf.mf.internal.mb                            = adf.mf.internal.mb                            || {};
adf.mf.internal.perf                          = adf.mf.internal.perf                          || {};
adf.mf.internal.resource                      = adf.mf.internal.resource                      || {};
adf.mf.internal.util                          = adf.mf.internal.util                          || {};


/**
 * startBatchRequest marks the start of the batch request.  Once this function is called
 * all subsequent requests to the java layer will be deferred until the flushBatchRequest.
 * Between the start and flush batch request markers, all requests success callbacks will
 * be called with deferred object ({.deferred:true}) response object.
 *
 * @see adf.mf.util.flushBatchRequest
 */
/* void */
adf.mf.util.startBatchRequest = function()
{
  if(adf.mf.internal.batchRequest != undefined)
  {
    throw new adf.mf.ELException("Batch Request already started.");
  }
  adf.mf.internal.batchRequest = [];
};


/* boolean */
adf.mf.util.isException = function(/* exception object */ obj)
{
  var o       = ((obj != undefined) && ('object' == typeof obj))? obj : {};
  var e       = (o[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] === true);

  if(e)  return e;
  else { /* lets see if it ends with Exception */
    return adf.mf.util.isType(o, "Exception");
  }
};


/* boolean */
adf.mf.util.isType = function(/* object */ obj, /* type name */ tname)
{
  var o       = ((obj != undefined) && ('object' == typeof obj))? obj : {};
  var type    = o[adf.mf.internal.api.constants.TYPE_PROPERTY] || "unknown";

  return (type.length == tname.length)?
    (type == tname) :
    (type.indexOf(tname, type.length - tname.length) != -1);
};


/**
 * Where startBatchRequest marks the start of the batch request, flushBatchRequest marks
 * the end of the batch and flushes (processes) the requests.  The caller can determine
 * if the flush should abort of the first error or continue to completion by passing either
 * true or false in the abortOnError parameter.  Regardless, the success callbacks will
 * be called in order if the batch is deemed successful otherwise the failed callbacks
 * will be invoked.  The callbacks parameters will be a vector of requests/responses one
 * for each request that was batched.
 *
 * @see adf.mf.util.startBatchRequest
 */
/* void */
adf.mf.util.flushBatchRequest = function(/* boolean abortOnError, callback success, callback failed, [boolean ignoreErrorMessages]*/)
{
  var argv  = arguments;
  var argc  = arguments.length;
  var scb   = [];
  var fcb   = [];

  if (argc!=4 && argc!=3 && argc!=2)
  {
    throw new adf.mf.ELException("Wrong number of arguments");
  }

  var abortOnError   = argv[0] || false;
  var errorHandler   = ((argc == 4) && (argv[3] == true))?
    adf.mf.internal.api.nvpEatErrors :
    adf.mf.internal.api.arraySimulatedErrors;
  var perf = adf.mf.internal.perf.startMonitorCall("Sending batch request to embedded", adf.mf.log.level.FINEST, "adf.mf.util.flushBatchRequest");
  scb = scb.concat([errorHandler]);
  scb = scb.concat((adf.mf.internal.util.is_array(argv[1]))? argv[1] : [argv[1]]);
  scb = scb.concat([function() { perf.stop(true); }]);

  fcb = fcb.concat((adf.mf.internal.util.is_array(argv[2]))? argv[2] : [argv[2]]);
  fcb = fcb.concat([function() { perf.stop(true); }]);

  try
  {
    if((adf.mf.internal.batchRequest === undefined) || (adf.mf.internal.batchRequest === null))
    {  /* so we do not have a defined batch request */
      throw new adf.mf.IllegalStateException("batch request is not defined");
    }

    if(adf.mf.internal.batchRequest.length > 0)
    {  /* so we have pending requests */
      if(adf.mf.internal.isJavaAvailable())
      {
        var   requests = adf.mf.internal.batchRequest.slice(0);

        if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
            "adf.mf.util", "flushBatchRequest",
            ("batch request contains " + requests.length + " requests."));
        }

        adf.mf.internal.batchRequest = undefined;
        adf.mf.api.invokeMethod("oracle.adfmf.framework.api.Model",
            "processBatchRequests", abortOnError, requests, scb, fcb);
      }
      else
      {
        throw new adf.mf.IllegalStateException("invalid environment defined for batch request");
      }
    }
    else
    {  /* this is okay, let the called know we are done */
      adf.mf.internal.batchRequest = undefined;
      for(var i = 0; i < scb.length; ++i) { try { scb[i](); }catch(e){}; }
    }
  }
  catch(e)
  {  /* this is not good, let the caller know */
    for(var i = 0; i < fcb.length; ++i) { try { fcb[i](); }catch(e){}; }
  }
  finally
  {
    perf.stop(true);
  }
};


/**
 * Get the context free version of the passed in EL expression.
 **/
/* String */
adf.mf.util.getContextFreeExpression = function(/* EL Expression */ el)
{
  return adf.mf.internal.el.parser.parse(el).toContextFreeExpression().getExpression();
};


/**
 * remove array entry
 */
/* array */
adf.mf.util.removeArrayEntry = function(/* Array */ arr, /* Object */ obj)
{
	var temp = [];

	if(adf.mf.internal.util.is_array(arr))
	{
		for(var i = 1; i < arr.length; ++i)
		{
			if(arr[i] !== obj)
			{
				temp.push(arr[i]);
			}
		}
	}
	else
	{
		throw new adf.mf.IllegalStateException("array was not passed");
	}
	return temp;
};

/**
 * remove duplicate entries from the array 'arr'.  If 'arr' is
 * not an array the 'arr' object is simply returned.
 */
/* array */
adf.mf.util.removeDuplicates = function(/* Array */ arr)
{
  if(adf.mf.internal.util.is_array(arr))
  {
    arr.sort();
    for(var i = 1; i < arr.length; )
    {
      if(arr[i-1] == arr[i])
      {
        arr.splice(i, 1);
      }
      else
      {
        i++;
      }
    }
  }
  return arr;
};

function elExpressionReplacer (key, value) {
	if (value && value._expr && value.tokens)
		return value._expr;
	return value;
}

/**
 * Convert the passed in object into a string representation for printing.
 *
 * @param   dat - data object to be converted
 * @returns string representation of the dat object
 */
/* String */
adf.mf.util.stringify = function(/* object */ dat)
{
  // Stringify is potentially costly, so profile it. The function call forwarding is made so
  // recursion does not spit out bunch of log timestamps
  var perf = adf.mf.internal.perf.startMonitorCall("Converting object to a string", adf.mf.log.level.FINEST, "adf.mf.util.stringify");
  try
  {
    // Forward the call so calee can recurse
    return JSON.stringify(dat, elExpressionReplacer);
  }
  finally
  {
    perf.stop();
  }

  return return_value;
};


/**
 * Return the number of milliseconds since 01 January, 1970 UTC that the provided
 * date string represents. Attempt to use the native Date.parse, and fall back to
 * adf.mf.internal.converters.dateParser.iso8601.parse if the native one returns
 * NaN. Returns NaN if a valid date cannot be parsed.
 *
 * @param   dateString - string containing a date in a format supported natively,
              or ISO-8601
 * @returns the number of ms since 01 January, 1970 UTC, or NaN if not parsable
 */
/* Number */
adf.mf.internal.converters.dateParser.parse = function(dateStr)
{
  var dateParse = Date.parse(dateStr);

  if (isNaN(dateParse))
  {
    dateParse = adf.mf.internal.converters.dateParser.iso8601.parse(dateStr);
  }

  return dateParse;
};


/**
 * Return the number of milliseconds since 01 January, 1970 UTC that the provided
 * ISO 8601 date string represents.
 *
 * @param   iso8601String - ISO 8601 formatted date string
 * @returns the number of ms since 01 January, 1970 UTC, or NaN if not parsable
 *
 * Most of the information for this standard to support was taken from:
 * http://en.wikipedia.org/wiki/ISO_8601
 *
 * The following ISO 8601 formats are supported by this parser. For now, the date string
 * must be of the format <date> or <date>T<time>, not just a <time>.
 *
 * Dates:
 * YYYY
 * YYYY-MM-DD
 * YYYY-MM
 * YYYYMMDD
 *
 * Times:
 * hh:mm:ss
 * hh:mm
 * hhmmss
 * hhmm
 * hh
 *
 * Decimal fractions may also be added to any of the three time elements. A decimal mark,
 * either a comma or a dot (without any preference as stated in resolution 10 of the 22nd
 * General Conference CGPM in 2003, but with a preference for a comma according to ISO
 * 8601:2004) is used as a separator between the time element and its fraction. A fraction
 * may only be added to the lowest order time element in the representation. To denote "14
 * hours, 30 and one half minutes", do not include a seconds figure. Represent it as
 * "14:30,5", "1430,5", "14:30.5", or "1430.5". There is no limit on the number of decimal
 * places for the decimal fraction.
 *
 * Time zone designators:
 * <time>Z
 * <time>��hh:mm
 * <time>��hhmm
 * <time>��hh
 *
 * When the ISO 8601 string is applied against the regular expression, matches[] should contain
 * the following values. For MM/DD/mm/ss, only one of the corresponding array indicies for each
 * will contain data, the other remaining undefined. Which ones are populated depend on the use
 * of separator characters ('-', ':') in the ISO 8601 string.
 *
 * matches[1]   YYYY <- YYYY-MM-DDThh:mm:ss.fffZ        (the year)
 * matches[2]   MM   <- YYYYMMDDThh:mm:ss.fffZ          (the month when no hyphen separates year & month)
 * matches[3]   DD   <- YYYYMMDDThh:mm:ss.fffZ          (the day when no hyphen separates month & day)
 * matches[4]   MM   <- YYYY-MM-DDThh:mm:ss.fffZ        (the month when a hyphen separates year & month)
 * matches[5]   DD   <- YYYY-MM-DDThh:mm:ss.fffZ        (the day when a hyphen separates month & day)
 * matches[6]   hh   <- YYYY-MM-DDThh:mm:ss.fffZ        (the hours)
 * matches[7]   mm   <- YYYY-MM-DDThh:mm:ss.fffZ        (the minutes when no colon separates hours & minutes)
 * matches[8]   ss   <- YYYY-MM-DDThh:mm:ss.fffZ        (the seconds when no colon separates minutes & seconds)
 * matches[9]   mm   <- YYYY-MM-DDThhmmss.fffZ          (the minutes when a colon separates hours & minutes)
 * matches[10]  ss   <- YYYY-MM-DDThhmmss.fffZ          (the seconds when a colon separates minutes & seconds)
 * matches[11]  fff  <- YYYY-MM-DDThh.fffZ              (the fractional hours)
 *          or  fff  <- YYYY-MM-DDThhmm.fffZ            (the fractional minutes, with or without colon separator)
 *          or  fff  <- YYYY-MM-DDThhmmss.fffZ          (the fractional seconds, with or without colon separator)
 * matches[12]  Z    <- YYYY-MM-DDThh:mm:ss.fffZ        (Zulu time, aka +00:00)
 * matches[13]  ��    <- YYYY-MM-DDThh:mm:ss.fff��zh:zm   ('+' or '-'; the direction of the timezone offset)
 * matches[14]  zh   <- YYYY-MM-DDThh:mm:ss.fff-zh:zm   (the hours of the time zone offset)
 * matches[15]  zm   <- YYYY-MM-DDThh:mm:ss.fff-zh:zm   (the minutes of the time zone offset)
 */
/* Number */
adf.mf.internal.converters.dateParser.iso8601.parse = function(iso8601Str)
{
  var re = /^(\d{4})(?:(\d{2})(\d{2})|-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2})(?::(\d{2})(?::(\d{2}))?|(\d{2})(?:(\d{2}))?)?(?:[,\.](\d+))?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/;
  var matches = re.exec(iso8601Str);

  if (!matches)
  {
    return NaN;
  }

  var pc = this.constants;

  // assign parsed values to correct units, initializing with default if unspecified
  var year     = matches[pc.YEAR];
  var month    = matches[pc.MONTH]    || matches[pc.MONTH_HYPHEN]  || "1";
  var day      = matches[pc.DAY]      || matches[pc.DAY_HYPHEN]    || "1";
  var hours    = matches[pc.HOURS]    || "0";
  var minutes  = matches[pc.MINUTES]  || matches[pc.MINUTES_COLON] || "0";
  var seconds  = matches[pc.SECONDS]  || matches[pc.SECONDS_COLON] || "0";
  var fraction = matches[pc.FRACTION] || "0";
  var zulu     = matches[pc.ZULU];

  year = parseInt(year, 10);
  month = parseInt(month, 10);
  day = parseInt(day, 10);

  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  seconds = parseInt(seconds, 10);

  var fractionMillis = 0;

  // if fraction specified, determine which time part it belongs to and compute additional ms
  if (matches[pc.FRACTION])
  {
    fraction = parseFloat("." + fraction);

    if (matches[pc.SECONDS] || matches[pc.SECONDS_COLON])
    {
      fractionMillis = Math.round(fraction * 1000);       // 1000 = ms / second
    }
    else if (matches[pc.MINUTES] || matches[pc.MINUTES_COLON])
    {
      fractionMillis = Math.round(fraction * 60000);      // 60 * 1000 = ms / minute
    }
    else
    {
      fractionMillis = Math.round(fraction * 3600000);    // 60 * 60 * 1000 = ms / hour
    }
  }

  // create date from time parts (month is zero-based)
  var dateMillis = Date.UTC(year, month - 1, day, hours, minutes, seconds);

  dateMillis += fractionMillis;

  // adjust for timezone
  if (!zulu)
  {
    var tzPlus    = matches[pc.TZ_PLUS];
    var tzHours   = matches[pc.TZ_HOURS]   || "0";
    var tzMinutes = matches[pc.TZ_MINUTES] || "0";

    var offsetMillis = parseInt(tzHours, 10) * 3600000;   // 60 * 60 * 1000
    offsetMillis += parseInt(tzMinutes, 10) * 60000;      // 60 * 1000;

    if (tzPlus == "+")
    {
      dateMillis += offsetMillis;
    }
    else
    {
      dateMillis -= offsetMillis;
    }
  }

  return dateMillis;
};


adf.mf.internal.converters.dateParser.iso8601.constants =
{
  YEAR:          1,
  MONTH:         2,
  DAY:           3,
  MONTH_HYPHEN:  4,
  DAY_HYPHEN:    5,
  HOURS:         6,
  MINUTES:       7,
  SECONDS:       8,
  MINUTES_COLON: 9,
  SECONDS_COLON: 10,
  FRACTION:      11,
  ZULU:          12,
  TZ_PLUS:       13,
  TZ_HOURS:      14,
  TZ_MINUTES:    15
};

/**
 * INTERNAL FUNCTION used to do token subsitution on the passed in expression
 * with the replacementStack of name/value objects.
 */
adf.mf.internal.util.tokenSubsitution = function(/* string */ expression, /* array */ replacementStack)
{
	var result = expression;

	for(var i = 0; i < replacementStack.length; ++i)
	{
		var  replaceMap = replacementStack[i];
		var  ele        = adf.mf.internal.el.parser.parse(result);

		result = ele.stripLocalValues(true, replaceMap, false).getExpression();
	}
	return result;
};

/**
 * INTERNAL FUNCTION used to do strip the local values and token subsitution in one step.
 */
adf.mf.internal.util.stripLocalValues = function(/* string */ expression, /* context free */ bContextFree, /* array */ replacementStack)
{
		if (!expression.tokens)
			expression = adf.mf.internal.el.parser.parse(expression);

	if(replacementStack != null)
	{
		for(var i = 0; i < replacementStack.length; ++i)
		{
			var replaceMap = replacementStack[i];
			expression = expression.stripLocalValues(bContextFree, replaceMap, true);
		}
	}
	else
	{
		expression  = expression.stripLocalValues(bContextFree, null, true);
	}
	return expression;
};


/**
 * Internal method to determine if the expression is valid as a
 * left hand expression for assignments.
 */
adf.mf.internal.util.isAssignable = function(/* string */ expression)
{
	var c1  = false;
	var c2  = false;
	var exp = expression;

	// since the term is allowed to have wrapping parenthesis we need to remove them if they exist
	exp = exp.replace(/^\(/g, " ").replace(/\)$/g, " ").trim();

	// since an array element is a valid LHS token, remove all characters in and including the brackets [.*]
	exp = exp.replace(/\[[^\]]*\]/g, "replace");

	// remove all the numbers from the expression to remove numeric constants
	exp = exp.replace(/[0-9]/g, "");

	// now look for any operators or parenthesis, denoting more than a single token remains
	c1  = (exp.search(/[!%&|\+\-\*\/\(]/i) == -1);

	// make sure we still have characters, i.e. letters for the variable
	c2  = (exp.length > 0);

	return (c1 && c2);
};


/**
 * INTERNAL FUNCTION used to determine if the input is an array or not
 */
adf.mf.internal.util.is_array = Array.isArray;

/**
 * INTERNAL FUNCTION appends array2, to array2. It does not create new array.
 */
adf.mf.internal.util.appendAll = function(array1, array2, array2From)
{
	if (!array2From) array2From = 0;
	for (var i = array2From; i < array2.length; i++)
		array1.push(array2[i]);
};

adf.mf.util.obfuscate = function(s) {
	return s.replace(/[a-zA-Z]/g, function(c) {
		return String.fromCharCode((c <= "Z"? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
	});
};

/**
 * Check if a string starts with another string
 *
 * @param {?string} findIn the string to check against
 * @param {?string} strToFind the string to look for
 * @return {boolean} true if findIn is a string and strToFind is a string and findIn starts with
 *         strToFind
 */
adf.mf.util.stringStartsWith = function(
	findIn,
	strToFind)
{
	return findIn != null &&
		strToFind != null &&
		strToFind.length > 0 &&
		findIn.length >= strToFind.length &&
		findIn.substring(0, strToFind.length) == strToFind;
};

/**
 * Check if a string ends with another string
 *
 * @param {?string} findIn the string to check against
 * @param {?string} strToFind the string to look for
 * @return {boolean} true if findIn is a string and strToFind is a string and findIn ends with
 *         strToFind
 */
adf.mf.util.stringEndsWith = function(
	findIn,
	strToFind)
{
	return findIn != null &&
		strToFind != null &&
		strToFind.length > 0 &&
		findIn.length >= strToFind.length &&
		findIn.substring(findIn.length - strToFind.length) == strToFind;
};


/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/Utilities.js///////////////////////////////////////



/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/TreeNode.js///////////////////////////////////////

/* Copyright (c) 2011, 2016, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- TreeNode.js ---------------------- */
// @requires ELErrors
// @requires AdfPerfTiming

// @requires JavaScriptContext


var adf                    = window.adf                 || {};
adf.mf                     = adf.mf                     || {};
adf.mf.api                 = adf.mf.api                 || {};
adf.mf.el                  = adf.mf.el                  || {};
adf.mf.locale              = adf.mf.locale              || {};
adf.mf.log                 = adf.mf.log                 || {};
adf.mf.resource            = adf.mf.resource            || {};
adf.mf.util                = adf.mf.util                || {};

adf.mf.internal            = adf.mf.internal            || {};
adf.mf.internal.api        = adf.mf.internal.api        || {};
adf.mf.internal.el         = adf.mf.internal.el         || {};
adf.mf.internal.el.parser  = adf.mf.internal.el.parser  || {};
adf.mf.internal.locale     = adf.mf.internal.locale     || {};
adf.mf.internal.log        = adf.mf.internal.log        || {};
adf.mf.internal.mb         = adf.mf.internal.mb         || {};
adf.mf.internal.perf       = adf.mf.internal.perf       || {};
adf.mf.internal.resource   = adf.mf.internal.resource   || {};
adf.mf.internal.util       = adf.mf.internal.util       || {};

(function() {

  var collectionModelExtensionELExpression = adf.mf.internal.el.parser.parse(
    "#{collectionModel.treeNodeBindings.providers}");

  function TreeNode(/* TreeBinding */ tb, /* index */ index, /* ELExpression */ treeBindingEL)
  {
    this.id       = tb.id;
    this.index    = index;
    this.modid    = adf.mf.internal.context.getModId();
    this.treeBindingEL = treeBindingEL;
    this.alias    = null;

    this.getAlias = function (/* boolean */ compressed)
    {
      if (compressed) {
        var ref     = this.id + ".collectionModel.treeNodeBindings.providers['" + this.getKey() + "']";
        var alias   = adf.mf.internal.api.addCompressedReference(ref);
        adf.mf.log.Framework.logp(adf.mf.log.level       .FINE, "TreeNode", "getAlias",
                              "alias="+alias+" expanded="+ref);
        return alias;
      }
      if (!this.alias) {
        this.alias = this.treeBindingEL.concat (collectionModelExtensionELExpression).appendIndex(this.getKey());
      }
      return this.alias;
    };

    /**
     * INTERNAL function to get the current collection
     * model stored for the given tree binding's id.
     */
    this.getTreeNodeBindings = function()
    {
      /* check to see if we already have the latest tree node bindings */
      if (this.modid == adf.mf.internal.context.getModId())
      {
        return tb.treeNodeBindings;
      }
      else
      { /* looks like the cache has been updated, be safe re-fetch */
        var cm = adf.mf.api.getLocalValue("#{" + this.id + ".collectionModel}");
        if (cm != null && cm.treeNodeBindings != null)
        {
          return cm.treeNodeBindings;
        }
        if ( adf.mf.log.Framework.isLoggable(adf.mf.log.level.WARNING))
        {
           adf.mf.log.logInfoResource("ADFInfoBundle", adf.mf.log.level.WARNING, "TreeNode.getTreeNodeBindings",
                                      "WARN_COLLECTION_MODEL_NOT_FOUND", this.id);
        }
        return {};
      }
    };
    this.tnb = this.getTreeNodeBindings();

    /**
     * getProvider will update the current provider
     * reference and return it's value to the caller.
     */
    this.getProvider = function()
    {
      var key = this.getKey();

      this.provider = (key != undefined)? this.tnb.providers[key] : undefined;

      return this.provider;
    };

    /**
     * getBindings will return the associated
     * column bindings to the caller.
     */
    this.getBindings = function()
    {
      return this.tnb.columnBindings;
    };

    /*
     * get the current key value
     */
    this.getKey = function()
    {
      this.key = ((index < 0) || (index >= this.tnb.keys.length)) ?
        undefined : this.tnb.keys[index];

      return this.key;
    };

    this.rowKey = function()
    {
      return this.getKey();
    };

    this.provider = this.getProvider();
    this.key      = this.getKey();
    this.note     = '' + (typeof this) + ' with EL variable id: ' + this.id + ' on index ' +
      this.index;
    this['.type'] = 'oracle.adfmf.bindings.dbf.TreeNode';

    // If an attribute is null or an empty array, the value is not being sent by the embedded side.
    // As a result, a request for that attribute will result in a cache miss (undefined value) and
    // cause a round trip to the embedded side. By checking the column attributes during
    // the creation of this object, we can avoid the undefined values by setting the properties to
    // null when not present
    if (this.provider != null)
    {
      for (var attributeName in tb.columnAttributes)
      {
        if (this.provider[attributeName] === undefined &&
          (this.provider.bindings == null || this.provider.bindings[attributeName] === undefined))
        {
          // We are not given the meta-data if this attribute is a true attribute or an accessor.
          // The accessors are stored directly on the provider, but the attributes are stored on
          // the bindings object of the provider. Since we do not know, store the value on the
          // provider directly.
          this.provider[attributeName] = null;
        }
      }
    }
  };

  /**
   *
   * Here are some things to note about using the iterator.
   *
   * Step  1. Resolve #{bindings.products.collectionModel}
   *          adf.mf.api.getValue("#{bindings.products.collectionModel}",
   *                          function(a,b) {value = b[0].value; success();}, failed);
   *
   * Step  2. Resolve #{bindings.products.collectionModel.iterator}
   *          adf.mf.api.getValue("#{bindings.products.collectionModel.iterator}",
   *                          function(a,b) {bpci = b[0].value; success();}, failed);
   *
   * Step 3.  Jumping around the rows with the iterator
   *          Resolve iterator.first():
   *          bpci.first(function(a, b){ adf.mf.api.addVariable('row', b[0].value); success(); }, failed);
   *
   *          Resolve iterator.last():
   *          bpci.first(function(a, b){ adf.mf.api.addVariable('row', b[0].value); success(); }
   *                                function(a, b){ failed();});
   *
   *          Resolve iterator.previous():
   *          bpci.previous(function(a, b){ adf.mf.api.addVariable('row', b[0].value); success(); }, failed);
   *
   *          Resolve iterator.next():
   *          bpci.next(function(a, b){ adf.mf.api.addVariable('row', b[0].value); success(); }, failed);
   *
   * Step  4. Accessing iterator bindings:
   *          Resolve #{row.bindings}:
   *          adf.mf.api.getValue("#{row.bindings}",
   *                          function(a,b) {value = b[0].value; success();},
   *                          function(a,b) {showFailure("unable to resolve"); failure();});
   *
   *          Resolve #{row.bindings.name}:
   *          adf.mf.api.getValue("#{row.bindings.name}",
   *                          function(a,b) {value = b[0].value; success();},
   *                          function(a,b) {showFailure("unable to resolve");});
   *
   *          Resolve #{row.bindings.name.inputValue}:"
   *                     adf.mf.api.getValue("#{row.bindings.name.inputValue}",
   *                                     function(a,b) {value = b[0].value; success();},
   *                                     function(a,b) {showFailure("unable to resolve"); failure();});
   *
   *          Update #{row.bindings.name.inputValue}:"+ stringify(value) + "");
   *                     adf.mf.api.setValue({'name':"#{row.bindings.name.inputValue}", 'value':value},
   *                                      function() {showSuccess("Updated"); success();},
   *                                      function() {showFailure("Unable to updated");});
   *
   *          Resolve #{row.dataProvider}:
   *          adf.mf.api.getValue("#{row.dataProvider}",
   *                          function(a,b) {value = b[0].value; success();},
   *                          function(a,b) {showFailure("unable to resolve"); failure();});
   *
   *          Resolve #{row.dataProvider}:
   *          adf.mf.api.getValue("#{row.dataProvider.name}",
   *                          function(a,b) {value = b[0].value; success();},
   *                          function(a,b) {showFailure("unable to resolve"); failure();});
   *
   *          Update #{row.dataProvider.name}:
   *          adf.mf.api.setLocalValue({'name':"#{row.dataProvider.name}", 'value':value},
   *                               function() {showSuccess("Updated"); success();},
   *                               function() {showFailure("Unable to updated"); failure();});
   *
   * Step 5: Register some data change listeners on #{bindings.products.collectionModel}:
   *         adf.mf.api.addDataChangeListeners("#{bindings.products.collectionModel}",
   *                                            function(v) {showChangeEvent("DCN 1 of " + stringify(v));});
   *         adf.mf.api.addDataChangeListeners("#{bindings.products.collectionModel}",
   *                                            function(v) {showChangeEvent("DCN 2 of " + stringify(v));});
   *         adf.mf.api.addDataChangeListeners("#{bindings.products.collectionModel}",
   *                                            function(v) {showChangeEvent("DCN 3 of " + stringify(v));});
   *
   * Step 6. Access the number of cached rows:
   *         var cr = bpci.getCachedRowCount(0);
   *
   * Step 7. Access the number of rows in a Range Size:
   *         var rs = bpci.getRangeSize();
   *
   * Step 8. Validating the data change event was processed correctly: ");
   *         {
   *            bpci.first(loopBody, function(e){ console.log("Error: first failed: " + stringify(e));});
   *            ...
   *         }
   *         ...
   *
   *         // Easy way to loop thru the number of rows we have cached starting at 0
   *         function loopBody()
   *         {
   *            if(++count < bpci.getCachedRowCount(0))
   *            {
   *               var v1 = adf.mf.api.getLocalValue("id:#{row.bindings.id.inputValue}");
   *               var v2 = adf.mf.api.getLocalValue("name:#{row.bindings.name.inputValue}");
   *
   *               content += "checking provider[" + bpci.index + "] = [" + v1 + "]:" + v2 + "<br>";
   *
   *               bpci.next(function(a, b){ adf.mf.api.addVariable('row', b[0].value); loopBody(); },
   *                         function(a, b){ showSuccess("no more records to check"); showContent();});
   *             }
   *         }
   **/
  function TreeNodeIterator(/* TreeBinding */ tb, /* index */ idx)
  {
    this.id                         = tb.id;
    this.treeNodeBindings           = tb.treeNodeBindings  || {providers:{}, keys:[]};
    this.index                      = idx;
    this.currentKey                 = null;
    this[".type"]                   = "TreeNodeIterator";  /* needed for minimized version to obtain the type */
    this.modid                      = adf.mf.internal.context.getModId();
    this.treeBindingEL              = adf.mf.internal.el.parser.parse("#{" + tb.id + "}");


    /**
     * INTERNAL function to get the current collection
     * model stored for the given tree binding's id.
     */
    this.getTreeNodeBindings = function()
    {
      /* check to see if we already have the latest tree node bindings */
      if(this.modid == adf.mf.internal.context.getModId()) {
        return tb.treeNodeBindings;
      }
      else { /* looks like the cache has been updated, be safe re-fetch */
        var cm = adf.mf.api.getLocalValue("#{" + this.id + ".collectionModel}");
        if (cm != null && cm.treeNodeBindings != null)
        {
          return cm.treeNodeBindings;
        }
        if ( adf.mf.log.Framework.isLoggable(adf.mf.log.level.WARNING))
        {
           adf.mf.log.logInfoResource("ADFInfoBundle", adf.mf.log.level.WARNING, "TreeNodeIterator.getTreeNodeBindings",
                                      "WARN_COLLECTION_MODEL_NOT_FOUND", this.id);
        }
        return { providers:{}, keys:[]};
      }
    };


    /**
     * create a new provider
     */
    this.createRow = function(provider, /* boolean */ insertFlag, success, failed)
    {
      return adf.mf.api.invokeMethod("oracle.adfmf.bindings.iterator.IteratorHandler", "create",
                                 this.id, this.currentKey, provider, insertFlag,
                                 success, failed);
    };

    /**
     * fetch the first row in the collection
     */
    this.first = function(success, failed)
    {
      this.fetch(0, success, failed);
    };

    /**
     * @returns the current row index
     */
    this.getCurrentIndex = function()
    {
      return this.index;
    };

    /**
     * @returns the current row key
     */
    this.getCurrentKey = function()
    {
      return this.currentKey;
    };

    /**
     * @returns the current provider (row)
     */
    this.getCurrentRow = function()
    {
      var tnb = this.getTreeNodeBindings();

      return (this.currentKey !== undefined)?
          tnb.providers[this.currentKey]: undefined;
    };

    /**
     * @returns true if their are more records buffered that can be read
     */
    this.hasNext = function()
    {
      var tnb = this.getTreeNodeBindings();

      return (this.index < (tnb.keys.length - 1));
    };

    /**
     * @returns true if their are more records buffered that can be read
     */
    this.hasPrevious = function()
    {
      return (this.index > 0);
    };

    /**
     * fetch the last row in the collection
     */
    this.last = function(success, failed)
    {
      var tnb = this.getTreeNodeBindings();

      this.fetch((tnb.keys.length - 1), success, failed);
    };

    /**
     * obtain the next record in the collection
     */
    this.next = function(success, failed)
    {
      // adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "TreeNodeIterator", "next",
          //           "Range Size: " + this.getRangeSize() + " where we have loaded " + this.getCachedRowCount(this.index) + " rows.");
      this.fetch((this.index + 1), success, failed);
    };

    /**
     * fetch the first row in the collection
     */
    /* provider */
    this.localFirst = function()
    {
      return this.localFetch(0);
    };

    /**
     * fetch the last row in the collection
     */
    /* provider */
    this.localLast = function()
    {
      var tnb = this.getTreeNodeBindings();

      return this.localFetch((tnb.keys.length - 1));
    };

    /**
     * get the next provider if you have it already cached, if not will return undefined
     */
    /* provider */
    this.localNext = function()
    {
      return this.localFetch((this.index + 1));
    };

    /**
     * get the previous provider if you have it already cached, if not will return undefined
     */
    /* provider */
    this.localPrevious = function()
    {
      return this.localFetch((this.index - 1));
    };

    /**
     * request the next set of records to be fetched
     */
    this.nextSet = function(success, failed)
    {
      this.fetchSet('next', this.index, success, failed);
    };

    /**
     * obtain the next record in the collection
     */
    this.previous = function(success, failed)
    {
      this.fetch((this.index - 1), success, failed);
    };

    /**
     * request the previous set of records to be fetched
     */
    this.previousSet = function(success, failed)
    {
      this.fetchSet('previous', this.index, success, failed);
    };

    /**
     * request the current record set to be re-fetched
     */
    this.refresh = function(success, failed)
    {
      this.fetchSet('next', this.index, success, failed);
    };

    /**
     * set the current index for the iterator
     *
     * @throws IllegalArgumentException if the index is out of range
     */
    this.setCurrentIndex = function(/* int */ index)
    {
      var tnb = this.getTreeNodeBindings();

      if((index < 0) || (index > (tnb.keys.length - 1)))
      {
        this.index      = -1;
        this.currentKey = undefined;
      }

      this.index      = index;
      this.currentKey = tnb.keys[index];
    };


    /**
     * @return the number of contiguously loaded row starting at a given point.
     *
     * @param startingAtIndex
     */
    /* int */
    this.getCachedRowCount = function(/* int */ startingAtIndex)
    {
      var count = 0;
      var tnb   = this.getTreeNodeBindings();

      if((startingAtIndex < 0) ||
         (startingAtIndex > (tnb.keys.length - 1)))
      {
        return 0;
      }

      // adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "TreeNodeIterator", "getCachedRowCount", "Passed the first test.");
      for(var i = startingAtIndex; i < tnb.keys.length; ++i)
      {
        var k = tnb.keys[i];

        // adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "TreeNodeIterator", "getCachedRowCount", "index: " + i + "  key: " + k);

        if(tnb.providers[k] != undefined) ++count;
                else break;
      }

      return count;
    };


    /**
     * @return the number of rows in a given range
     */
    /* int */
    this.getRangeSize = function()
    {
      var sz = adf.mf.api.getLocalValue("#{" + this.id + ".IterBinding.RangeSize}");
      return (sz == undefined)? 0 : sz;
    };


    /***** internal methods *****/

    /**
     * fetch the first row in the collection
     */
    this.fetch = function(index, success, failed)
    {
      var tnb = this.getTreeNodeBindings();

      this.setCurrentIndex(index);

      if(this.currentKey !== undefined)
      {
        if(tnb.providers[this.currentKey] === undefined)
        {
          if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "TreeNodeIterator", "fetch",
                                   ("no provider present for the key " + this.currentKey +
                                    " need to fetch the value."));
          }
          this.fetchProviderByKey(this.currentKey, this.index, success, failed);
        }
        else
        {
          if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "TreeNodeIterator", "fetch",
                                   ("we have a provider for key " + this.currentKey +
                                   " = " + adf.mf.util.stringify(tnb.providers[this.currentKey])));
          }
          this.returnProvider(this.currentKey, new TreeNode(tb, this.index, this.treeBindingEL), success);
        }
      }
      else
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "TreeNodeIterator", "fetch",
                                 "no element found");
        }
        this.returnProvider(undefined, undefined, failed);
      }
    };

    /**
     * fetch a row in the collection
     */
    /* provider */
    this.localFetch = function(index)
    {
      var tnb      = this.getTreeNodeBindings();
      var  oldIndex = this.index;

      this.setCurrentIndex(index);

      if(this.currentKey !== undefined)
      {
        if(tnb.providers[this.currentKey] !== undefined)
        {
          if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "TreeNodeIterator", "fetch",
                                   ("we have a provider for key " + this.currentKey +
                                   " = " + adf.mf.util.stringify(tnb.providers[this.currentKey])));
          }
          var treeNode = new TreeNode(tb, this.index, this.treeBindingEL);
          var provider = treeNode.getProvider();
          if (provider['rowKey'] === undefined)
          {
            provider['rowKey'] = treeNode.rowKey();
          }
          return treeNode;
        }
      }

      this.setCurrentIndex(oldIndex);  /* move the cursor back to where it was first */
      return undefined;
    };


    this.getKeys = function(success, failed)
    {
      var cm = adf.mf.api.getLocalValue("#{" + this.id + ".collectionModel}");;
      return adf.mf.api.invokeMethod("oracle.adfmf.bindings.iterator.IteratorHandler", "getKeys",
                                          this.id,
                                          [function(a,b) { cm.treeNodeBindings.keys = b; },
                                          success], failed);
    };

    /**
     * remove the current row (provider)
     */
    this.removeCurrentRow = function(success, failed)
    {
      var tnb       = this.getTreeNodeBindings();
      var removeKey = this.currentKey;
      var range     = 0;
      var newIndex  = this.index;

      /* first lets remove the key in the JavaScript cached collection model */
      for(var i = 0; i < tnb.keys.length; ++i)
      {
        if(tnb.keys[i] === this.currentKey)
        {
          tnb.keys.splice(i, 1);
          break;
        }
      }

      range = tnb.keys.length - 1;
      if(newIndex == range)
      {   /* we removed the last one, so move the index to the new last */
        newIndex = (range - 1);
      }
      if(range < 0)
      {  /* there are no elements in the collection any more */
        this.index      = -1;
        this.currentKey = undefined;
      }
      else
      {
        this.setCurrentIndex(newIndex);
      }

      return adf.mf.api.invokeMethod("oracle.adfmf.bindings.iterator.IteratorHandler", "removeRowWithKey",
                                 this.id, removeKey, success, failed);
    };

    this.setCurrentRowKey = function(key)
    {
      var i = this.getTreeNodeBindings().keys.indexOf(key);
      if (i != -1) {
        this.index = i;
        this.currentKey = key;
        return true;
      }
      return false;
    };

    this.setCurrentRowWithKey = function(key, success, failed)
    {
      var tnb      = this.getTreeNodeBindings();
      var newIndex = -1;

      for(var i = 0; i < tnb.keys.length; ++i)
      {
        if(tnb.keys[i] === key)
        {
          newIndex = i;
          break;
        }
      }
      if(newIndex != -1)
      {
        this.setCurrentIndex(newIndex);

        adf.mf.api.invokeMethod("oracle.adfmf.bindings.iterator.IteratorHandler", "setCurrentRowWithKey",
                                      this.id, key, success, failed);
      }
      else
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "TreeNodeIterator", "setCurrentRowWithKey",
                                 ("unable to find the key to set the current row to."));
        }
      }
    };


    /* ---------- internal callback functions ------------- */

    this.fetchSet = function(pcns, index, success, failed)
    {
      var cm    = adf.mf.api.getLocalValue("#{" + this.id + ".collectionModel}");
      var scb   = [];
      var fcb   = [];
      var op    = "oracle.adfmf.bindings.iterator.IteratorHandler:fetchSetRelativeTo";
      var upf   = this.updateProviders;
      var start = adf.mf.internal.perf.startMonitorCall("Tree node iterator fetch set", adf.mf.log.level.FINER, op);
      

      scb = scb.concat(
        [
          function(a,b)
          {
            start.stop();
            start = adf.mf.internal.perf.startMonitorCall("Tree node iterator update providers", adf.mf.log.level.FINER,
              "adf.mf.api.TreeNodeIterator.updateProviders");
            try
            {
              upf(cm, b);
            }
            finally
            {
              start.stop();
            }
          }
        ]);
      scb = scb.concat(adf.mf.internal.util.is_array(success)? success : [success]);

      fcb = fcb.concat(
        [
          function(a,b)
          {
            start.stop();
            adf.mf.log.logInfoResource("ADFInfoBundle", adf.mf.log.level.WARNING,
              "TreeNodeIterator.fetchSet", "WARN_UNABLE_TO_FETCH_SET", adf.mf.util.stringify(arguments));
          }
        ]);

      fcb = fcb.concat(adf.mf.internal.util.is_array(failed) ? failed : [ failed ]);

      /* pcns: previous, current, or next set */
      return adf.mf.api.invokeMethod(
        "oracle.adfmf.bindings.iterator.IteratorHandler", "fetchSetRelativeTo",
        this.id, pcns, cm.treeNodeBindings.keys[index], scb, fcb);
    };

    /* ---------- internal callback functions ------------- */
    this.fetchProviderByKey = function(key, index, success, failed)
    {
      var rpf = this.returnProvider;

      this.fetchSet("next", index,
      function(a,b) { rpf(key, new TreeNode(tb, index, this.treeBindingEL), success); },
              failed);
    };


    this.updateKeys = function(keys)
    {
      try
      {
        var cm = adf.mf.api.getLocalValue("#{" + this.id + ".collectionModel}");
        cm.treeNodeBindings.keys = keys;
      }
      catch(e)
      {
        adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
          "TreeNodeIterator.updateKeys", "ERROR_TREENODEITERATOR_UPDATE_KEYS", this.id, e);
      }
    };

    this.updateProviders = function(cm, values)
    {
      var providers = values || {};
      var keys      = [];

      if(cm === undefined)
      {
        adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
          "TreeNodeIterator.updateProviders", "ERROR_TREENODEITERATOR_UPDATE_PROVIDERS");
      }
      else
      {
        for(var p in providers)
        {
          if(p !== undefined)
          {
            cm.treeNodeBindings.providers[p] = providers[p];
          }
        }
      }
    };

    this.returnProvider = function(name, provider, callback)
    {
      var request  = [{ 'name':name}];
      var response = [{ 'name':name, 'value': provider }];

      if(adf.mf.internal.util.is_array(callback))
      {
        var count = callback.length;

        for(var i = 0; i < count; ++i)
        {
          callback[i](request, response);
        }
      }
      else
      {
        callback(request, response);
      }
    };
  };

  adf.mf.internal.el.TreeNode   = TreeNode;
  adf.mf.el.TreeNodeIterator    = TreeNodeIterator;
})();




/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/TreeNode.js///////////////////////////////////////



/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/Adfel.js///////////////////////////////////////

/* Copyright (c) 2011, 2016, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- Adfel.js ---------------------- */
// @requires ELErrors
//
// @requires JavaScriptContext

// @requires ELParser
// @requires TreeNode
// @requires Utilities
// @requires AdfPerfTiming
// @requires AdfResource
// @requires AdfLocale

var PERFMON    = true;

var adf                    = window.adf                 || {};
adf.mf                     = adf.mf                     || {};
adf.mf.api                 = adf.mf.api                 || {};
adf.mf.el                  = adf.mf.el                  || {};
adf.mf.locale              = adf.mf.locale              || {};
adf.mf.log                 = adf.mf.log                 || {};
adf.mf.resource            = adf.mf.resource            || {};
adf.mf.util                = adf.mf.util                || {};

adf.mf.internal            = adf.mf.internal            || {};
adf.mf.internal.api        = adf.mf.internal.api        || {};
adf.mf.internal.el         = adf.mf.internal.el         || {};
adf.mf.internal.el.parser  = adf.mf.internal.el.parser  || {};
adf.mf.internal.el.parser.cache  = adf.mf.internal.el.parser.cache  || {};
adf.mf.internal.locale     = adf.mf.internal.locale     || {};
adf.mf.internal.log        = adf.mf.internal.log        || {};
adf.mf.internal.mb         = adf.mf.internal.mb         || {};
adf.mf.internal.perf       = adf.mf.internal.perf       || {};
adf.mf.internal.resource   = adf.mf.internal.resource   || {};
adf.mf.internal.util       = adf.mf.internal.util       || {};



adf.mf.internal.api.constants = adf.mf.internal.api.constants || {
  'KEY_PROPERTY'            : '.key',
  'NULL_FLAG_PROPERTY'      : '.null',
  'TYPE_PROPERTY'           : '.type',
  'TRANSIENT_FLAG_PROPERTY' : '.transient',
  'EXCEPTION_FLAG_PROPERTY' : '.exception',
  'VALUE_REF_PROPERTY'      : '.valueref',
  'WEAK_REFERENCE_PROPERTY' : '.weakref',
  'DEFERRED_PROPERTY'       : '.deferred'
};

(function() {
  /**
   * The JavaScriptContext is basic the javascript model layer.  It is an EL
   * context for javascript.  So things like root level variables, functions,
   * .. as well as wrapping the VMChannel and other base platform items.
   */
  adf.mf.internal.context = new adf.mf.internal.el.JavaScriptContext();

  /**
   * Define a 'default' binding instance
   */
  var bindingInstances    = {};

  /**
   * Topic: Understanding_DataChangeListeners:
   *
   * There is one dataChangeListener for EACH individual variable we are monitoring for
   * changes.  So for the EL Expression #{a + b} there would be two dataChangeListeners
   * (one for 'a' and one for 'b').  Each of these dataChangeListers records are handled
   * independently, since we might actually be monitoring 'a' or 'b' already or as part
   * of another expression.  The dataChangeListeners record contains two arrays; one for
   * the all the unique IDs (EL Expressions) that we should be listening on, and one for
   * the callbacks to notify.
   *
   * Given that, when a data change listener (via addDataChangeListener) is registered,
   * the EL Expression is decomposed into all of it's individual variables where each
   * variable get their own dataChangeListner record.  So given the above EL Expression
   * (#{a + b}), there is an 'a' DCL and a 'b' DCL that would look something like this:
   *
   *   dataChangeListeners["a"] = { "id":["#{a + b}"] "callback":[function() {...}] }
   *   dataChangeListeners["b"] = { "id":["#{a + b}"] "callback":[function() {...}] }
   *
   * now if we then register the EL Expression #{a + c}, we would get something like this:
   *
   *   dataChangeListeners["a"] = { "id":["#{a + b}", "#{a + c}"]
   *                                "callback":[function() {...}, function() {...}] }
   *   dataChangeListeners["b"] = { "id":["#{a + b}"] "callback":[function() {...}] }
   *   dataChangeListeners["c"] = { "id":["#{a + c}"] "callback":[function() {...}] }
   *
   * Notice how the dataChangeListeners["a"]'s id and callback array grew and the
   * inclusion of the "c" dataChangeListener record.
   *
   * Now, when some data is changed in the CVM layer a data change event (DCE) is raised
   * and passed back on a VMChannel response message.  The native container framework then
   * pulls this DCE off the response and passes it to (javascript) processDataChangeEvent.
   * In this javascript function the DCE is disected and for each and every variable/provider
   * change in the DCE the following is done:
   *   1. data is updated in the JavaScriptContext
   *   2. determine if any registered data change listeners exists for that variable or provider.
   *      This is done by simply looking up the variable name in the dataChangeListeners map
   *      (i.e. name->dataChangeListeners records (described above)).
   *
   * Since the data change listener record contains all the registered ELs (id) and handlers
   * (callback), we simply send a notification to all the handlers with each of the registered
   * EL Expression (id in the code).
   *
   * So if we code that looked like this:
   *  adf.mf.api.addDataChangeListeners("#{a}",   fa);   // 1
   *  adf.mf.api.addDataChangeListeners("#{!a}",  fna);  // 2
   *  adf.mf.api.addDataChangeListeners("#{b}",   fb);   // 3
   *  adf.mf.api.addDataChangeListeners("#{a+b}", fab);  // 4
   *
   * Then we receive a data change event for a, then following notifications would
   * be emitted:
   *   fa(#{a})    // registered by line 1
   *   fna(#{!a})  // registered by line 2
   *   fab(#{a+b}) // registered by line 4
   * If we then recieve a data change event fo b, these notifications would be emitted:
   *   fb(#{b})    // registered by line 3
   *   fab(#{a+b}) // registered by line 4
   *
   * To unregister a data change listener simply call adf.mf.api.removeDataChangeListeners
   * i.e.
   *   adf.mf.api.removeDataChangeListeners("#{a+b}") // remove the line 4 listener
   *
   *
   * In addition to the data change listeners for individual EL expressions, one can register for
   * a bulk notification mechanism.  In this case, the framework will not attempt to map individual
   * ELs to specific callback, instead the registered callback(s) will be invoked with the list of
   * ELs that where changed.  This 'bulk' mechanism has some PROs and CONs.  It provides a single
   * notification with all the changed ELs allowing the handler to process all the changes in a single
   * call (allowing a single update event for multiple changes in components like a table).  However,
   * it does place the work of filtering/routing EL changes to the proper sub-component.
   *
   * NOTE: The providers detail will only contain itemized changes provided the 'itemized'
   *       property exists and is true.  Otherwise the entire collection model should be
   *       updated since no detailed information is known.  This detailed information is
   *       delivered as a map with the collection model id being the key.  The value of the
   *       property will be a provider change record in the following format:
   *
   *       {
   *         bindings.notes.collectionModel: {
   *           itemized: true;
   *           created: [0: {key: UID-3464; }];
   *           updated: [];
   *           deleted: [];
   *           dirtied: [];
   *         };
   *       }
   *
   *       where:
   *         itemized: true | false,  // true if created,updated, and deleted information is provided
   *         created:[ c-record ],    // right now only contains a single key property
   *         updated:[ ids ],         // list of IDs that have been updated
   *         deleted:[ ids ]          // list of IDs that have been deleted
   *         dirtied:[ ids ]          // list of IDs that have been updated
   *
   * To register a bulk data change listener the following should be done:
   *   adf.mf.api.addBatchDataChangeListener(variables, providers);
   *
   * Then we you will received data change events as follows:
   *   fa(["#{a}", "{#!a}", "#{a + b}"],
   *      {myCollectionModel:{itemized:true, created:[0: {key: UID-3464; }], updated:[], deleted:[], dirtied:[]})
   *
   */
  var dataChangeListeners                    = {};

  /**
   * INTERNAL: the array of global batch data change listeners
   */
  adf.mf.internal.batchDataChangeListeners   = [];

  /**
   * INTERNAL: the array of pending requests
   */
  adf.mf.internal.batchRequest               = undefined;

  /**
   * INTERNAL: storage for batching missing get local values.
   *
   *   @see adf.mf.api.startGetValueBatchRequest
   *  @see adf.mf.api.flushGetValueBatchRequest
   */
  adf.mf.internal.el.getValueBatch           = undefined;

  /**
   * INTERNAL FUNCTION used to log all errors coming back from the JVM.
   */
  adf.mf.internal.logError = function(req, resp)
  {
    var msg = adf.mf.resource.getInfoString("ADFErrorBundle","ERROR_IN_REQUEST",
        adf.mf.util.stringify(req), adf.mf.util.stringify(resp));

    adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "adf.mf.internal", "logError", msg);
  };
  adf.mf.internal.errorHandlers = [adf.mf.internal.logError];

  /**
   * PUBLIC FUNCTION used to add a new data change listener (callback) for a given el expression (variable)
   *
   * e.g.
   *   adf.mf.api.addDataChangeListeners("#{bindings.apple}",                   appleChangedCallback);
   *   adf.mf.api.addDataChangeListeners("#{bindgins.apple + bindings.orange}", appleOrOrangeChangedCallback);
   *
   *    adf.mf.api.addDataChangeListeners("#{!bindings.foo}",                    bindingsFooChangedCallback);
   *
   *   where the callback would looks something like this:
   *   bindingsFooChangedCallback = function(id)
   *   {
   *      document.write("DataChangeNotification 1 notification for ID: " + id);
   *   }
   *
   * If the same expression/listener combination is registered several times, duplicates are discarded.
   *
   * For more details see @Understanding_DataChangeListeners
   *
   * @export
   */
  adf.mf.api.addDataChangeListeners = function(expression, callback)
  {
    if (!expression.tokens)
      expression = adf.mf.internal.el.parser.parse(expression);
    var variables  = expression.dependencies();
    var id         = expression;

    var perf = adf.mf.internal.perf.startMonitorCall("Add a new data change listener", adf.mf.log.level.FINE,
      "adf.mf.api.addDataChangeListeners");
    if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINEST, "adf.mf.api", "addDataChangeListeners",
          ("addDataChangeListeners " + expression + " ==> " + variables.length + " ==> " + variables.join()));
    }

    for(var v = 0; v < variables.length; ++v)
    {
      var alreadyRegistered = false;
      var variable          = variables[v];
      var dcl               = (variable.slice(0, "bindings".length) == "bindings")?
          currentBindingInstance.dataChangeListeners : dataChangeListeners;

      if(dcl[variable] === undefined)
      {   /* if currently we don't have a DCL record for this variable, create it */
        dcl[variable] = {"id":[], "callback":[]};
      };

      /* add the expression id to the dataChangeListeners */
      alreadyRegistered = false;
      for(var i = 0; i < dcl[variable]["id"].length; ++i)
      {
        if(dcl[variable]["id"][i] == id)
        {
          if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.api", "addDataChangeListeners",
                ("addDataChangeListener " + variable + " id=" + id + " was already registered."));
          }
          alreadyRegistered = true;
          break;  /* you only need to find one match */
        }
      }
      if(!alreadyRegistered)
      {
        dcl[variable]["id"].push(id);

        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "addDataChangeListeners",
              ("there are now " + dcl[variable]["id"].length + " different listener's IDs."));
        }
      }

      alreadyRegistered = false;
      for(var i = 0; i < dcl[variable]["callback"].length; ++i)
      {
        if(dcl[variable]["callback"][i].toString() == callback.toString())
        {
          if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "addDataChangeListeners",
                ("variable " + variable + " already has this callback registered."));
          }

          alreadyRegistered = true;
          break;  /* you only need to find one match */
        }
      }
      if(!alreadyRegistered)
      {
        dcl[variable]["callback"].push(callback);

        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "addDataChangeListeners",
              ("there are now " + dcl[variable]["callback"].length + " different callbacks registered."));
        }
      }

      if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.FINEST, "adf.mf.api", "addDataChangeListeners",
            ("adding the " + variable + " " +  adf.mf.util.stringify(dcl[variable]) + " listener."));
      }
    }
    perf.stop();
  };

  /**
   * PUBLIC FUNCTION used to add a new bulk data change listener (callback)
   *
   * e.g.
   *   adf.mf.api.addBatchDataChangeListener(printBatchDataChangeEvent);
   *
   *   where the callback would looks something like this:
   *
   *   printBatchDataChangeEvent = function(variables, providers) {
   *     if(variables != undefined) {
   *       document.write("Batch DCE -- <br> variables = " + adf.mf.util.stringify(variables)+ "<br>");
   *     }
   *     if(providers!= undefined) {
   *       document.write(" providers =" + adf.mf.util.stringify(providers) + "<br>");
   *     }
   *   };
   *
   * If the same listener is registered several times, duplicates are discarded.
   *
   * NOTE: if the providers detail will only contain itemized changes provided the 'itemized'
   *       property exists and is true.  Otherwise the entire collection model should be updated
   *       since no detailed information is known.
   *
   * For more details see @Understanding_DataChangeListeners
   *
   * @export
   */
  adf.mf.api.addBatchDataChangeListener = function(callback)
  {
    for(var i = 0; i < adf.mf.internal.batchDataChangeListeners.length; ++i)
    {
      if(adf.mf.internal.batchDataChangeListeners[i] == callback) return
    }
    adf.mf.internal.batchDataChangeListeners.push(callback);
  };

  /**
   * PUBLIC FUNCTION used to add a new error handler (callback)
   *
   * e.g.
   *   adf.mf.api.addErrorHandler(myErrorHandler);
   *
   *   where the callback would looks something like this:
   *   myErrorHandler = function(adfexception)
   *   {
   *      document.write("Error Handler 1 notification for: " + adfexception);
   *   }
   *
   * If the same handler is registered several times, duplicates are discarded.
   *
   * For more details see @Understanding_ErrorHandlers
   *
   * @export
   */
  adf.mf.api.addErrorHandler = function(callback)
  {
    for(var i = 0; i < adf.mf.internal.errorHandlers.length; ++i)
    {
      if(adf.mf.internal.errorHandlers[i] == callback) return
    }
    adf.mf.internal.errorHandlers.push(callback);
  };


  /**
   * PUBLIC FUNCTION used to get the current context ID.
   *
   * e.g. adf.mf.api.getContextId(successCallback, failedCallback);
   *
   * @deprecated
   * @export
   */
  /* void */
  adf.mf.api.getContextId = function(success, failed) {
    adf.mf.api.invokeMethod("oracle.adfmf.framework.api.Model", "getContextId", success, failed);
  };


  /**
   * PUBLIC FUNCTION used to get the current context's pagedef.
   *
   * e.g. adf.mf.api.getContextId(success, failed);
   *
   * @export
   */
  /* void */
  adf.mf.api.getContextPageDef = function(success, failed)
  {
    adf.mf.api.invokeMethod("oracle.adfmf.framework.api.Model", "getContextPageDef", success, failed);
  };


  /**
   * PUBLIC FINCTION used to get the current context's instance ID
   *
   * @export
   */
  /* void */
  adf.mf.api.getContextInstanceId = function(success, failed)
  {
    adf.mf.api.invokeMethod("oracle.adfmf.framework.api.Model", "getContextInstanceId", success, failed);
  };



  /**
   * PUBLIC FUNCTION used to invoke method in any class in classpath.
   *
   * e.g. adf.mf.api.invokeMethod(classname, methodname, param1, param2, ... , paramN ,successCallback, failedCallback);
   *
   * @param {string}                               classname  - name of the class
   * @param {string}                               methodname - name of the method
   * @param {Array.<string>}                       params     - parameters
   * @param {Array.<function(Object,Object):void>} success    - invoked when the method is successful invoked
   *                                                            (signature: success(request, response))
   * @param {Array.<function(Object,Object):void>} failed     - invoked when an error is encountered
   *                                                            (signature: failed(request, response))
   *
   * Examples:
   *      adf.mf.api.invokeMethod("TestBean", "setStringProp", "foo", success, failed);
   *      adf.mf.api.invokeMethod("TestBean", "getStringProp", success, failed);
   *      adf.mf.api.invokeMethod("TestBean", "testSimpleIntMethod", "101", success, failed); // Integer parameter
   *      adf.mf.api.invokeMethod("TestBean", "testComplexMethod",
   *              {"foo":"newfoo","baz":"newbaz",".type":"TestBeanComplexSubType"}, success, failed); // Comples parameter
   *      adf.mf.api.invokeMethod("TestBean", "getComplexColl", success, failed); // No parameter
   *      adf.mf.api.invokeMethod("TestBean", "testMethodStringStringString", "Hello ", "World", success, failed); // 2 string parameter
   */
  adf.mf.api.invokeMethod = function()
  {
    var args = [].splice.call(arguments,0);   // convert arguments into a real array

    var updatedArgs = [null];  // adding the default communication id

    adf.mf.internal.api.invokeMethod.apply(this, updatedArgs.concat(args));
  };

  /**
   * PUBLIC FUNCTION used to invoke Security Methods
   */
  adf.mf.api.invokeSecurityMethod = function(command, username, password, tenantname, success, failed)
  {
    adf.mf.internal.context.invokeSecurityMethod(command, username, password, tenantname, success, failed);
  };

  /**
   * PUBLIC FUNCTION used to remove all data change listeners associated with the variable
   *
   * For more details see @Understanding_DataChangeListeners
   */
  adf.mf.api.removeDataChangeListeners = function(expression)
  {
    if (!expression.tokens)
      expression = adf.mf.internal.el.parser.parse(expression);
    var variables  = expression.dependencies();
    var id         = expression;

    for(var i = 0; i < variables.length; ++i)
    {
      var v   = variables[i];
      var dcl = ((v.slice(0, "bindings".length) == "bindings")?
          currentBindingInstance.dataChangeListeners : dataChangeListeners);

      try
      {
        var ida = dcl[v]["id"];
        for(var j = 0; j < ida.length; ++j)
        {
          if(ida[j] === id)
          {
            if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
            {
              adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf", "removeDataChangeListeners",
                  ("removing the " + adf.mf.util.stringify(ida[j]) + " listener."));
            }
            ida.splice(j,1);
          }
        }
        if(ida.length == 0)
        {  /* clean up the dataChangeListener all together */
          if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf", "removeDataChangeListeners",
                ("removing the " + ida + " listener all together."));
          }
          delete dcl[v];
        }
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINEST, "adf", "removeDataChangeListeners",
              ("All the current data change listeners in the system:<br> " +
                  adf.mf.util.stringify(dcl)));
        }
      }
      catch(e)
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.SEVERE))
        {
          adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE, "adf.removeDataChangeListeners", "ERROR_EXCEPTION", e);
        }
      }
    }
  };


  /**
   * PUBLIC FUNCTION used to remove a bulk data change listener
   *
   * For more details see @Understanding_DataChangeListeners
   */
  adf.mf.api.removeBatchDataChangeListener = function(callback)
  {
    var temp = [];

    for(var i = 0; i < adf.mf.internal.batchDataChangeListeners.length; ++i)
    {
      if(adf.mf.internal.batchDataChangeListeners[i] != callback)
      {
        temp.push(adf.mf.internal.batchDataChangeListeners[i]);
      }
    }
    adf.mf.internal.batchDataChangeListeners = temp;
  };


  /**
   * PUBLIC FUNCTION used to remove an error handler
   *
   * For more details see @Understanding_ErrorHandlers
   */
  adf.mf.api.removeErrorHandler = function(callback)
  {
    var temp = [];

    for(var i = 0; i < adf.mf.internal.errorHandlers.length; ++i)
    {
      if(adf.mf.internal.errorHandlers[i] != callback)
      {
        temp.push(adf.mf.internal.errorHandlers[i]);
      }
    }
    adf.mf.internal.errorHandlers = temp;
  };


  /**
   * PUBLIC FUNCTION used to reset context. Call this before setting new context.
   * This is exactly the same as calling adf.mf.api.setContext with an empty context name.
   *
   * e.g. adf.mf.api.removeContextInstance(successCallback, failedCallback);
   */
  adf.mf.api.removeContextInstance = function(pageDef, instanceId, success, failed)
  {
    adf.mf.internal.el.resetBindingContext();
    adf.mf.api.invokeMethod("oracle.adfmf.framework.api.Model",
        "removeContextInstance", pageDef, instanceId, success, failed);
  };


  /**
   * PUBLIC FUNCTION used to reset context. Call this before setting new context.
   * This is exactly the same as calling adf.mf.api.setContext with an empty context name.
   *
   * e.g. adf.mf.api.resetContext(successCallback, failedCallback);
   *
   * @deprecated use adf.mf.api.setCurrentContext instead.
   */
  /* void */
  adf.mf.api.resetContext = function(success, failed)
  {
    adf.mf.api.setContext("", success, failed);
  };

  /**
   * PUBLIC FUNCTION used to set context for the specified name
   *
   * e.g. adf.mf.api.setContext("MyPage", "MyPage-1", true, true, successCallback, failedCallback);
   *
   * pageDef    - name of the page definition
   * instanceId - unique id for the instance
   * resetState - reset the bindings associated with this instance
   * reSync     - re-send the initial bindings structure to the container
   * 
   * @deprecated use adf.mf.api.setCurrentContext instead.
   */
  adf.mf.api.setContextInstance = function(pageDef, instanceId, resetState, /* boolean */reSync, success, failed)
  {
    adf.mf.api.setCurrentContext(pageDef, resetState, reSync, true, success, failed);
  };

  /**
   * PUBLIC FUNCTION used to set the current context.
   *
   * e.g. adf.mf.api.setCurrentContext("MyPage", true, true, true, successCallback, failedCallback);
   *
   * pageDef      - name of the page definition
   * resetState   - reset the bindings associated with this instance
   * reSync       - re-send the initial bindings structure to the container
   * newViewScope - should a new viewScope also be initialized, releasing the previous one?
   */
  adf.mf.api.setCurrentContext = function(pageDef, resetState, reSync, newViewScope, success, failed)
  {
    try
    {
      if((pageDef === undefined) || (pageDef === null) || (pageDef.length < 1))
      {
        //
        // clear all the bindings and listeners associated with this context.
        //
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf", "setCurrentContext",
              ("\n\n*******\nBindings = " + adf.mf.util.stringify(adf.mf.api.getLocalValue("#{bindings}")) + "\n*******\n\n"));
        }
        adf.mf.api.removeContextInstance(pageDef, null);
      }
      else
      {
        adf.mf.internal.el.switchBindingInstance(pageDef);
        adf.mf.api.invokeMethod("oracle.adfmf.framework.api.Model", "setCurrentContext",
            pageDef, resetState, reSync, newViewScope, success, failed);
      }
    }
    catch(ge)
    {
      if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.SEVERE))
      {
        adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE, "adf.setCurrentContext", "ERROR_EXCEPTION", ge);
      }
    }
  };


  /**
   * PUBLIC FUNCTION used to clear and then set context for the specified name
   *
   * @param name    - name of the context
   * @param success - call on success
   * @param failed  - call on failed
   *
   * this is the same as calling adf.mf.internal.api.setContext(name, true, success, failed);
   *
   * e.g. adf.mf.api.setContext("myContextName", successCallback, failedCallback);
   *
   * @deprecated use adf.mf.api.setCurrentContext instead.
   */
  /* void */
  adf.mf.api.clearAndSetContext = function(/* context name */ name, success, failed)
  {
    adf.mf.internal.api.setContext(name, true, success, failed);
  };

  /**
   * PUBLIC FUNCTION used to set context for the specified name
   *
   * @param name    - name of the context
   * @param success - call on success
   * @param failed  - call on failed
   *
   * this is the same as calling adf.mf.internal.api.setContext(name, false, success, failed);
   *
   * e.g. adf.mf.api.setContext("myContextName", successCallback, failedCallback);
   *
   * @deprecated use adf.mf.api.setCurrentContext instead.
   */
  /* void */
  adf.mf.api.setContext = function(/* context name */ name, success, failed)
  {
    adf.mf.internal.api.setContext(name, false, success, failed);
  };

  /**
   * INTERNAL FUNCTION used to set context for the specified name
   *
   * @param name       - name of the context
   * @param clearPrior - true for clear the current context
   * @param success    - call on success
   * @param failed     - call on failed
   *
   * e.g. adf.mf.api.setContext("myContextName", true, successCallback, failedCallback);
   *
   * @deprecated use adf.mf.api.setCurrentContext instead.
   */
  /* void */
  adf.mf.internal.api.setContext = function(/* String */ name, /* boolean */clearPrior, success, failed)
  {
    adf.mf.api.setCurrentContext(name, true, true, true, success, failed);
  };


  /**
   * PUBLIC FUNCTION used to create a top-level variable
   * into the context.  This should be thought of as adding
   * a variable to the root namespace for variables.
   *
   * i.e. adf.mf.api.addVariable("name", some_object);
   *
   * addVariable/removeVariable are used to add and then remove
   * temporary variables, like loop iterator variables along with
   * longer lasting variables.
   */
  /* void */
  adf.mf.el.addVariable = function(/* variable name */ name, /* new value */ value)
  {
    adf.mf.log.Framework.logp(adf.mf.log.level.FINEST, "adf.mf.api", "addVariable", name);
    adf.mf.internal.context.setVariable(name, value);
  };
  adf.mf.api.addVariable = adf.mf.el.addVariable;


  /**
   * PUBLIC FUNCTION will evaluate the passed in expression against
   * the local cache ONLY.  If there are terms that are currently
   * not cached or any function calls then undefined will be returned.
   * If the adf.mf.api.startGetValueBatchRequest has been called any
   * EL expression cache misses will be queued to fetched on the
   * adf.mf.api.flushGetValueBatchRequest call.
   *
   * @see adf.mf.api.addVariable
   * @see adf.mf.api.removeVariable
   *
   * @see adf.mf.api.getValue
   * @see adf.mf.api.setValue
   * @see adf.mf.api.setLocalValue
   *
   * @see adf.mf.api.startGetValueBatchRequest
   * @see adf.mf.api.flushGetValueBatchRequest
   */
  adf.mf.el.getLocalValue = function(/* expression */ expression)
  {
    var val = undefined;

    if (!expression.tokens)
      expression = adf.mf.internal.el.parser.parse(expression);

    var addToBatch = false;
    var context = adf.mf.internal.context;

    try
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINEST, "adf.mf.api", "getLocalValue", expression.getExpression ());
      adf.mf.internal.el.indexedExpressionUnresolved = false;
      val = expression.evaluate(context);

      // Check if the and indexed expression was unable to get its value. If so
      // no error is thrown, so add the term to the batch
      if (adf.mf.internal.el.indexedExpressionUnresolved)
      {
        addToBatch = true;
      }
    }
    catch(e1)
    {
      addToBatch = true;
    }
    finally
    {
      delete adf.mf.internal.el.indexedExpressionUnresolved;
    }

    if (addToBatch)
    {
      // expression was not found
      if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "getLocalValue",
            ("unable to resolve '" + expression.getExpression() + "' locally."));
      }

      // NOTE: only if the internal batch is defined will we batch the
      // expression to fetch when adf.mf.api.flushGetValueBatchRequest.
      if (adf.mf.internal.el.getValueBatch !== undefined)
      {
        var batch = adf.mf.internal.el.getValueBatch;

        try
        {
          var exp   = expression.stripLocalValues(true, undefined, true);
          var terms = exp.getELTerms();

          for (var t = 0; t < terms.length; ++t)
          {
            var term = terms[t];
            addToBatch = false;

            try
            {
              // Detect when properties were not found in indexed expressions
              // (no exceptions thrown for those)
              adf.mf.internal.el.indexedExpressionUnresolved = false;
              term.evaluate(context);
              if (adf.mf.internal.el.indexedExpressionUnresolved)
              {
                addToBatch = true
              }
            }
            catch(e3)
            {
              addToBatch = true;
            }
            finally
            {
              delete adf.mf.internal.el.indexedExpressionUnresolved;
            }

            if (addToBatch)
            {
              batch.push(term.getExpression());

              if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
              {
                adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.api", "getLocalValue",
                    "we currently do not have term: " + term + " cached, adding to the batch.");
              }
            }
          }
        }
        catch(e2)
        {
          // the only way you would get here is if the EL Expression can not be parsed

          // Look to see if there is any registered error handlers and call them.
          adf.mf.internal.api.notifyErrorHandlers(expression.getExpression (), e2);


          /*
           * Since the bulk of the callers do not handle exceptions well we are going
           * to simply return the exception as the value.  This is similar to what we
           * do in getValues so there is no difference here.  The UI should look at
           * the value and handle it correctly.
           */
          val = e2;
        }
      }
    }

    return val;
  };
  adf.mf.api.getLocalValue = adf.mf.el.getLocalValue;


  /**
   * startGetValueBatchRequest is responsible for starting a new get value
   * batch so theproper "behind the scene" call to get the values can be
   * called at the flushGetValueBatchRequest call.
   *
   * @see adf.mf.api.startGetValueBatchRequest
   */
  /* void */
  adf.mf.el.startGetValueBatchRequest = function()
  {
    if(adf.mf.internal.el.getValueBatch !== undefined)
    {
      throw new adf.mf.ELException("GetValueBatchRequest already started");
    }
    else
    {
      adf.mf.internal.el.getValueBatch = [];
    }
  };
  adf.mf.api.startGetValueBatchRequest = adf.mf.el.startGetValueBatchRequest;

  /**
   * @returns the list of all terms used in any of the ELs
   */
  /* String[] */
  adf.mf.internal.el.getListOfTerms = function(/* array */ els)
  {
    var variables = els || [];
    var terms     = [];
    var length    = 0;

    variables = adf.mf.internal.util.is_array(variables)? variables : [variables];
    length    = variables.length;

    for(var i = 0; i < length; ++i)
    {
      var ele   = adf.mf.internal.el.parser.parse(variables[i]);

      if((ele !== undefined) || (ele !== null)) {
        terms  = terms.concat(ele.dependencies());
      }
    }
    return terms;
  };


  /**
   * flushGetValueBatchRequest is responsible for closing off the current
   * batch and make the proper "behind the scene" call to get the values.
   *
   * @see adf.mf.api.startGetValueBatchRequest
   */
  /* void */
  adf.mf.el.flushGetValueBatchRequest = function()
  {
    if (adf.mf.internal.el.getValueBatch !== undefined)
    {
      if(adf.mf.internal.el.getValueBatch.length > 0)
      {
        var perf = adf.mf.internal.perf.startMonitorCall("Close current batch request", adf.mf.log.level.FINER,
          "adf.mf.api.flushGetValueBatchRequest");

        adf.mf.api.getValue(adf.mf.util.removeDuplicates(adf.mf.internal.el.getValueBatch),
          function(a,b)
          {
            try
            {
              var terms = adf.mf.internal.el.getListOfTerms(a.params[0]);

              adf.mf.internal.api.notifyDataChangeListeners(terms);
              perf.stop();
            }
            catch(e)
            {
              perf.stop();
            }
          },
          function(a, b)
          {
            perf.stop();
          });
      }

      adf.mf.internal.el.getValueBatch = undefined;
    }
    else
    {
      throw new adf.mf.IllegalStateException("No get value batch started.");
    }
  };
  adf.mf.api.flushGetValueBatchRequest = adf.mf.el.flushGetValueBatchRequest;



  /**
   * PUBLIC FUNCTION used to evaluate the expression(s) passed in and return the associated
   * value(s) via the success callback.  Since not all variables may not be resolved only the
   * resolved expressions will be returned in the 'response' property of the success callback.
   *
   * Given that you can use this method to get the value for:
   *
   * Evaluation of a single EL expression:
   * e.g. adf.mf.api.getValue("#{100+2*20/3}", success, failed);
   * e.g. adf.mf.api.getValue("#{bindings.userName.inputValue}", success, failed);
   *
   * Evaluation of an array of EL expressions:
   * e.g. adf.mf.api.getValue(["#{100+2*20/3}", "#{500/2}"], success, failed);
   * e.g. adf.mf.api.getValue(["#{bindings.foo}", "#{applicationScope.username}"], success, failed);
   *
   * Success Callback:
   * success(request, response)
   *   where the request echos the first argument passed in
   *     and the response is an array of name-value-pairs, one for each resolved expression.
   * so if we take our examples above:
   *   e.g. adf.mf.api.getValue("#{100+2*20/3}", success, failed);
   *        success(["#{100+2*20/3}"], [ {name:"#{100+2*20/3}", value:"113.33"} ] )
   *
   *   e.g. adf.mf.api.getValue("#{bindings.userName.inputValue}", success, failed);
   *        success(["#{bindings.userName.inputValue}"], [ {name:"#{bindings.userName.inputValue}", value:"me"} ] )
   *
   *   e.g. adf.mf.api.getValue(["#{100+2*20/3}", "#{500/2}"], success, failed);
   *        success(["#{100+2*20/3}", "#{500/2}"],
   *                [ {name:"#{100+2*20/3}", value:"113.33"}, {name:"#{500/2}", value:"250"} ] )
   *
   * Now let suppose that bindings.foo exists but not bindings.bar.  In this case would see:
   * e.g. adf.mf.api.getValue( ["#{bindings.foo}", "#{bindings.bar}"], success, failed);
   *        success(["#{bindings.foo}", "#{bindings.bar}"],
   *                [{ "name": "#{bindings.foo}", "value": "foo" }] )
   *          *** notice: binding.bar was not part of the result array
   *
   * Failed Callback:
   * failed(request, exception)
   *   where the request echos the first argument passed in
   *     and the exception encountered resulting in all of the expressions failing to be resolved
   *
   * There also exists another way to invoke the getValue used to resolve a property from an already
   * retrieved base object.  This version is used by the AMX layer to do things like iterator variables
   * when doing collection/lists/tables.  In this version, we simply let the EL resolvers determine
   * the "right thing to do" based on the 'base' and 'property' variables:
   *
   * e.g. adf.mf.api.getValue(base, property);
   *   where the value returned is value of the property or nil if it does not exists.
   **/
  adf.mf.el.getValue = function()
  {
    var argv  = arguments;
    var argc  = arguments.length;

    if (argc!=4 && argc!=3 && argc!=2)
    {
      throw new adf.mf.ELException("Wrong number of arguments");
    }

    try
    {
      if (typeof(argv[1])!='object' && (argv[1] instanceof Function))
      {
        /*
         * Note: in order to make [gs]etValue individual errors show up in the error view
         *       we will inject a nvpSimulatedErrors callback into the success callback vector.
         *       We only need to include it in the success because the failed will automatically
         *       be routed to the error handlers (see JavaScriptContext.nonBlockingCall)
         */
        var expression     = (adf.mf.internal.util.is_array(argv[0]))? argv[0] : [argv[0]];
        var success        = (adf.mf.internal.util.is_array(argv[1]))? argv[1] : [argv[1]];
        var failed         = (adf.mf.internal.util.is_array(argv[2]))? argv[2] : [argv[2]];
        var errorHandler   = ((argc == 4) && (argv[3] == true))?
            adf.mf.internal.api.nvpEatErrors :
              adf.mf.internal.api.nvpSimulatedErrors;
        var perf           = adf.mf.internal.perf.startMonitorCall("Evaluate EL expression", adf.mf.log.level.FINER,
          "adf.mf.api.getValue");
        var scb            = [errorHandler,
                              function() { perf.stop(); }];
        var fcb            = [function() { perf.stop(); }];

        expression = arrayToEL (expression);
        try
        {
          var count = expression.length;
          var nvpa  = [];

          for (var i = 0; i < count; i++)
          {
            var temp = undefined;

            if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
            {
              adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
                "adf.mf.el","getValue", "evaluating locally" + expression[i].getExpression());
            }

            if((temp = expression[i].evaluate(adf.mf.internal.context)) === undefined)
            {
              throw new adf.mf.PropertyNotFoundException(expression[i].getExpression());
            }
            else
            {
              nvpa.push({"name":expression[i].getExpression(), "expression":expression[i], "value":temp});
            }
          }

          if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "getValue",
                ("adfmf- did not call the server for " + expression.join(", ")));
          }

          // Found everything locally
          perf.stop();
          for(var i = 0; i < success.length; ++i)
          {
            try
            {
              success[i](expression, nvpa);
            }
            catch(fe)
            {
              adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                  "adf.mf.api.getValue", "ERROR_GETVALUE_SUCCESS_CB_ERROR", i, fe);
            }
          }
        }
        catch (e) {
          var terms = getTerms (expression);

          if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "getValue",
                ("adfmf- needs to call the server for " + terms.join(", ")));
          }
          /* inject the addtional callbacks for: caching and peformance */
          scb     = scb.concat(adf.mf.internal.el.cacheResult, success);
          fcb     = fcb.concat(failed);
          adf.mf.api.invokeMethod("oracle.adfmf.framework.api.Model", "getValue", terms, scb, fcb);
        }
      }
      else
      {
        var base     = argv[0];
        var property = argv[1];
        value        = adf.mf.internal.context.getELResolver().getValue(adf.mf.internal.context, base, property);
      }
    }
    catch(ge)
    {
      var expression     = (adf.mf.internal.util.is_array(argv[0]))? argv[0] : [argv[0]];
      var failed         = (adf.mf.internal.util.is_array(argv[2]))? argv[2] : [argv[2]];

      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
          "adf.mf.api.getValue", "ERROR_EXCEPTION_RESOLVING", ge, expression.join(", "));

      perf.stop();
      for(var i = 0; i < failed.length; ++i)
      {
        try
        {
          failed[i](expression, ge);
        }
        catch(fe)
        {
          adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.api.getValue", "ERROR_GETVALUE_FAILED_CB_ERROR", i, fe);
        }
      }
    }
  };
  adf.mf.api.getValue = adf.mf.el.getValue;

  /**
   * Returns array of terms for given array of expressions.
   *
   * @param {Array} expressions
   * @returns {Array}
   */
  function getTerms (expressions) {
    var map = {};
    for(var i = 0; i < expressions.length; i++)
    {
      var exp = expressions[i];
      var terms = exp.getELTerms();

      for (var j = 0; j < terms.length; j++)
      {
        var term = adf.mf.internal.context.uncompressReference(terms[j]);

        //  If the term is the same as the original expression then we don't want
        //  add it to the result collection a second time.
        if (term.getExpression() != exp.getExpression())
        {
          map[term.getExpression()] = true;
        }
      }
    }
    var result = [];
    for (var i = 0; i < expressions.length; i++)
    {
      result.push(expressions[i].getExpression());
    }
    for (var t in map)
    {
      result.push (t);
    }

    return result;
  }

  /**
   * Converts array of strings to array of ELExpressions.
   *
   * @param {type} expressions
   * @returns {Array}
   */
  function arrayToEL (expressions) {
    if (expressions[0].tokens)
      return expressions;
    var elExpressions = [];
    for (var i = 0; i < expressions.length; i++) {
      elExpressions.push (adf.mf.internal.el.parser.parse (expressions[i]));
    }
    return elExpressions;
  }

  /**
   * PUBLIC FUNCTION used to used to invoke a method expression in the java environment.
   *
   * expression: is the method expression itself
   *             i.e. #{bean.method}  #{applicationScope.bean.method}
   * params    : is an array of zero or more values that should be passed as the method parameters
   *             i.e. []                      - to invoke bean.method()
   *             or ["Hello"]                 - to invoke bean.method(String)
   *             or [[false, false], "Hello"] - to invoke bean.method(boolean[], String)
   * returnType: is the return type
   *             i.e. void                    -
   *             i.e. String                  - return type is a string
   * types     : i.e. []                      - no parameters
   *             i.e. [java.lang.String]      - one parameter of type String
   *             i.e. [java.lang.String, int] - parameter-1 of type String, parameter-2 of type int
   *
   * Given this information the correct method will be looked up and invoked from the given method.
   *
   * Evaluation of a single EL expression:
   * e.g. invoke("#{Bean.foobar}", [parameters], [parameter-types], success, failed);
   *
   * Success Callback:
   * success(request, response)
   *   where the request echos the first argument passed in
   *     and the response is an array of name-value-pairs, one for each resolved expression.
   * so if we take our examples above:
   *   e.g. adf.mf.api.invoke("#{Bean.foobar}", [], "java.lang.String", [], success, failed);
   *        success({method:"#{Bean.foobar}" arguments:[]}, {result:....} )
   *
   * Failed Callback:
   * failed(request, exception)
   *   where the request echos the first argument passed in
   *     and the exception encountered resulting in all of the expressions failing to be resolved
   **/
  adf.mf.el.invoke = function(expression, params, returnType, types, success, failed)
  {
    if (expression && expression.getExpression)
      expression = expression.getExpression ();
    adf.mf.api.invokeMethod("oracle.adfmf.framework.api.Model", "evaluateMethodExpression",
        expression, params, returnType, types, success, failed);
  };


  /**
   * PUBLIC FUNCTION used to update a value for a given variable expression.
   * Since variable expressions are the only type of expressions that can be LHS
   * (left-hand-side) expressions we can rule out all literal, complex, and method
   * expressions from the possible input.
   *
   * A simple name-value-pair object is used to denote the variable expression (name)
   * with it's desired value (value).  An example of this would be:
   *       { "name":"#{applicationScope.foo}", value:"foobar" }
   *
   * Similar to the getValue function, the setValue can take a single name-value-pair
   * or an array of them for doing batch sets.  The following examples will highlight
   * these cases:
   *
   * Passing only a single name-value-pair
   * e.g. adf.mf.api.setValue( { "name": "#{bindings.foo}", "value": "foo" }, success, failed);
   *      resulting in the bindings.foo variable being assigned foo
   *
   * Passing an array of name-value-pairs
   * e.g. adf.mf.api.setValue( [{ "name": "#{bindings.foo}", "value": "foo" },
   *                        { "name": "#{bindings.bar}", "value": "bar" }], success, failed);
   *      resulting in the bindings.foo variable being assigned foo and
   *                       bindings.bar variable being assigned bar
   *
   *
   * Success Callback:
   * success(request, response)
   *   where the request echos the first argument passed in
   *     and the response is an array of name-value-pairs, one for each resolved expression.
   * so if we take our examples above:
   *   e.g. adf.mf.api.setValue( { "name": "#{bindings.foo}", "value": "foo" }, success, failed);
   *        success(["{ "name": "#{bindings.foo}", "value": "foo" }"], [ { "name": "#{bindings.foo}", "value": "foo" } ] )
   *
   * e.g. adf.mf.api.setValue( [{ "name": "#{bindings.foo}", "value": "foo" },
   *                        { "name": "#{bindings.bar}", "value": "bar" }], success, failed);
   *        success([{ "name": "#{bindings.foo}", "value": "foo" },
   *                 { "name": "#{bindings.bar}", "value": "bar" }],
   *                [{ "name": "#{bindings.foo}", "value": "foo" },
   *                 { "name": "#{bindings.bar}", "value": "bar" }] )
   *
   * Now let suppose that bindings.foo exists but not bindings.bar.  In this case would see:
   * e.g. adf.mf.api.setValue( [{ "name": "#{bindings.foo}", "value": "foo" },
   *                        { "name": "#{bindings.bar}", "value": "bar" }], success, failed);
   *        success([{ "name": "#{bindings.foo}", "value": "foo" },
   *                 { "name": "#{bindings.bar}", "value": "bar" }],
   *                [{ "name": "#{bindings.foo}", "value": "foo" }] )
   *          *** notice: binding.bar was not part of the result array
   *
   * Failed Callback:
   * failed(request, exception)
   *   where the request echos the first argument passed in
   *     and the exception encountered resulting in all of the expressions failing to be resolved
   *
   * There also exists another way to invoke the setValue used to set a property from an already
   * retrieved base object.  This version is used by the AMX layer to do things like iterator variables
   * when doing collection/lists/tables.  In this version, we simply let the EL resolvers determine
   * the "right thing to do" based on the 'base' and 'property' variables:
   *
   * e.g. adf.mf.api.setValue(base, property, value);
   *   where the base.property is assigned the value of 'value'
   *
   **/
  adf.mf.el.setValue = function()
  {
    var argv  = arguments;
    var argc  = arguments.length;

    if (argc != 3)
    {
      throw new adf.mf.ELException("Wrong number of arguments");
    }

    try
    {
      /*
       * Note: in order to make [gs]etValue individual errors show up in the error view
       *       we will inject a nvpSimulatedErrors callback into the success callback vector.
       *       We only need to include it in the success because the failed will automatically
       *       be routed to the error handlers (see JavaScriptContext.nonBlockingCall)
       */
      var nvp     = (adf.mf.internal.util.is_array(argv[0]))? argv[0] : [argv[0]];
      var success = (adf.mf.internal.util.is_array(argv[1]))? argv[1] : [argv[1]];
      var failed  = (adf.mf.internal.util.is_array(argv[2]))? argv[2] : [argv[2]];
      var scb     = [];
      var fcb     = [];
      var perf    = adf.mf.internal.perf.startMonitorCall("Set EL value", adf.mf.log.level.FINER, "adf.mf.api.setValue");

      if (success[0] instanceof Function)
      {
        if(adf.mf.internal.isJavaAvailable())
        {  /* since java is available we need to also do the remote write */
          var nvp1 = [];
          for(var i = 0; i < nvp.length; ++i) {
            if (!nvp[i].expression)
              nvp[i].expression = adf.mf.internal.el.parser.parse(nvp[i].name);
            var uncompressedEL = adf.mf.internal.context.uncompressReference(nvp[i].expression);
            nvp[i].expression = uncompressedEL;
            var uncompressedELString = uncompressedEL.getExpression ();
            var v = {name: uncompressedELString, value: nvp[i].value};
            if (nvp[i][adf.mf.internal.api.constants["VALUE_REF_PROPERTY"]]) {
              v[adf.mf.internal.api.constants["VALUE_REF_PROPERTY"]] = true;
            }
            nvp1.push (v);
          }

          adf.mf.log.Framework.logp(adf.mf.log.level.FINEST, "adf.mf.api", "setValue",
            "We now have the uncompressed terms.");

          var rscb = [];

          rscb = rscb.concat([adf.mf.internal.api.nvpSimulatedErrors]);
          rscb = rscb.concat([function() { perf.stop(); }]);
          rscb = rscb.concat(success);

          scb = scb.concat(function() {
            adf.mf.api.invokeMethod("oracle.adfmf.framework.api.Model", "setValue", nvp1, rscb, failed);
          });
          fcb = scb.concat(failed);
        }
        else
        {  /* since java is _NOT_ available store the value locally and notify the data change listeners (ndcl) */
          for(var i = 0; i < nvp.length; ++i)
          {
            if (!nvp[i].expression)
              nvp[i].expression = adf.mf.internal.el.parser.parse(nvp[i].name);
            var uncompressedEL = adf.mf.internal.context.uncompressReference(nvp[i].expression);
            nvp[i].expression = uncompressedEL;
            nvp[i].name = uncompressedEL.getExpression();
          }

          adf.mf.log.Framework.logp(adf.mf.log.level.FINEST, "adf.mf.api", "setValue",
            "We now have the uncompressed terms.");

          var  ndcl = undefined;

          ndcl = [function() { for(var v = 0; v < nvp.length; ++v) {
            var terms = nvp[v].expression.dependencies();
            adf.mf.internal.api.notifyDataChangeListeners(terms); }
          }];

          scb = ndcl.concat(function() { perf.stop(); });
          scb = scb.concat(success);

          fcb = ndcl.concat(function() { perf.stop(); });
          fcb = fcb.concat(failed);
          adf.mf.log.logInfoResource("ADFInfoBundle", adf.mf.log.level.WARNING, "adf.mf.api.setValue", "WARN_SKIP_REMOTE_WRITE");
        }

        adf.mf.log.Framework.logp(adf.mf.log.level.FINEST, "adf.mf.api", "setValue",
          "now calling setLocalValue");

        adf.mf.api.setLocalValue(nvp, scb, fcb);
      }
      else
      {
        var base     = argv[0];
        var property = argv[1];
        var value    = argv[2];

        adf.mf.internal.context.getELResolver().setValue(adf.mf.internal.context, base, property, value);
        perf.stop();
      }
    }
    catch(ge)
    {
      perf.stop();
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
          "adf.mf.api.setValue", "ERROR_EXCEPTION", ge);
    }
    finally
    {
      // nothing more that needs to be done here.
    }
  };
  adf.mf.api.setValue = adf.mf.el.setValue;


  /**
   * PUBLIC FUNCTION used to set the value only on the javascript side.
   *
   * @see adf.mf.api.setValue
   */
  adf.mf.el.setLocalValue = function()
  {
    // no-value

    try
    {
      if (arguments.length != 3)
      {
        var errMsg = adf.mf.internal.resource.getResourceStringImpl("ADFErrorBundle", "ERROR_INCORRECT_NUM_ARGS_PASSED");
        throw new adf.mf.ELException(errMsg);
      }

      var argv    = arguments;
      var nvp     = (adf.mf.internal.util.is_array(argv[0]))? argv[0] : [argv[0]];
      var success = (adf.mf.internal.util.is_array(argv[1]))? argv[1] : [argv[1]];
      var failed  = (adf.mf.internal.util.is_array(argv[2]))? argv[2] : [argv[2]];

      if (success[0] instanceof Function)
      {
        try
        {
          var count = nvp.length;
          for (var i = 0; i < count; i++)
          {
            var nvpi = nvp[i];
            var n = nvpi.name;
            if (!nvpi.expression)
              nvpi.expression = adf.mf.internal.el.parser.parse(nvpi.name);
            var v = nvpi.value;

            if((nvpi != null) && (nvpi[adf.mf.internal.api.constants.VALUE_REF_PROPERTY] !== undefined))
            {
              if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
              {
                adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "setLocalValue",
                    ("adfmf- not caching '" + n + "' because it is value reference."));
              }
            }
            else
              if((nvpi != null) && (nvpi[adf.mf.internal.api.constants.TRANSIENT_FLAG_PROPERTY] !== undefined))
              {
                if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
                {
                  adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "setLocalValue",
                      ("adfmf- not caching '" + n + "' because it is transient."));
                }
              }
              else
              {
                nvpi.expression.setValue (adf.mf.internal.context, v);

                if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
                {
                  adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "setLocalValue",
                      ("adfmf- setting local value : " + n));
                }
              }
          }
        }
        catch(e1)
        {
          try
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                "adf.mf.api.setLocalValue", "ERROR_SET_LOCAL_VALUE_FAILED", e1);

            for(var i = 0; i < failed.length; ++i)
            {
              failed[i](nvp, e1);
            }
            if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
            {
              adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "setLocalValue",
                  ("set local value failed callback has been executed."));
            }
          }
          catch(e2)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                "adf.mf.api.setLocalValue", "ERROR_SET_LOCAL_VALUE_FAILED_CB", e2);
          }
          return;
        }

        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "setLocalValue",
          "set local value is now complete and now calling the success callback(s)");
        }
        for(var i = 0; i < success.length; ++i)
        {
          try
          {
            success[i](nvp, nvp);
          }
          catch(fe)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                "adf.mf.api.setLocalValue", "ERROR_SET_LOCAL_VALUE_SUCCESS_CB_FAILED", i, fe);
          }
        }
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "setLocalValue",
              ("set local value is now complete and " + success.length + " success callback has been executed."));
        }
      }
      else
      {
        var base     = argv[0];
        var property = argv[1];
        var value    = argv[2];

        adf.mf.internal.context.getELResolver().setValue(adf.mf.internal.context, base, property, value);
        if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
            "adf.mf.api", "setLocalValue",
            "context.getELResolver().setValue" + base + "." + property);
        }
      }
    }
    catch(ge)
    {
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
          "adf.mf.api.setLocalValue", "ERROR_EXCEPTION", ge);
    }
    finally
    {
      // no-value
    }
  };
  adf.mf.api.setLocalValue = adf.mf.el.setLocalValue;


  /**
   * PUBLIC FUNCTION used to remove a top-level variable
   * from the context.  This should be thought of as removing
   * a variable from the root namespace for variables.
   *
   * i.e. adf.mf.api.removeVariable("name");
   */
  /* void */
  adf.mf.el.removeVariable = function(/* variable name */ name)
  {
    adf.mf.log.Framework.logp(adf.mf.log.level.FINEST, "adf.mf.api", "removeVariable", name);
    adf.mf.internal.context.removeVariable(name);
    // no-value
  };
  adf.mf.api.removeVariable = adf.mf.el.removeVariable;


  /**
   * PUBLIC FUNCTION used to create a top-level variable
   * into the context.  This should be thought of as adding
   * a variable to the root namespace for variables.
   *
   * i.e. adf.mf.api.setVariable("name", some_object);
   *
   * Most of the time the 'some_object' will be a property
   * map.  So we can do things like:
   *   adf.mf.api.getValue("${name.property}");
   */
  /* void */
  adf.mf.el.setVariable = function(/* variable name */ name, /* new value */ value)
  {
    var perf = adf.mf.internal.perf.startMonitorCall("Add a top-level variable", adf.mf.log.level.FINEST,
      "adf.mf.api.setVariable");
    try
    {
      adf.mf.internal.context.setVariable(name, value);
      adf.mf.internal.api.notifyDataChangeListeners(name);
    }
    finally
    {
      perf.stop();
    }
  };
  adf.mf.api.setVariable = adf.mf.el.setVariable;

  /**
   * PUBLIC FUNCTION used to create a top-level variable
   * into the context.  This should be thought of as pushing
   * a variable onto the root namespace for variables.
   *
   * i.e. adf.mf.api.pushVariable("name", some_object);
   *
   * Most of the time the 'some_object' will be a property
   * map.  So we can do things like:
   *   adf.mf.api.getValue("${name.property}");
   *
   * NOTE: This call will _NOT_ generate a data change event.
   */
  /* void */
  adf.mf.el.pushVariable = function(/* variable name */ name, /* new value */ value)
  {
    adf.mf.internal.context.pushVariable(name, value);
  };
  adf.mf.api.pushVariable = adf.mf.el.pushVariable;

  /**
   * PUBLIC FUNCTION used to pop a top-level variable
   * from the context.  This should be thought of as poping
   * a variable off the root namespace for variables.
   *
   * i.e. adf.mf.api.popVariable("name");
   *
   * NOTE: This call will _NOT_ generate a data change event.
   */
  /* void */
  adf.mf.el.popVariable = function(/* variable name */ name)
  {
    adf.mf.internal.context.popVariable(name);
  };
  adf.mf.api.popVariable = adf.mf.el.popVariable;

  /**
   * PUBLIC FUNCTION used to process the data change event associated with response messages.
   *
   * DataChangeEvents can be sent as their own request message or as part of _any_ response
   * message.  This event is sent to inform the javascript side that some data was side-effected
   * in the CVM layer and should be propagated into the javascript cache as well as notify the
   * user interface of the change.  This event has the following JSON represention:
   *
   * DataChangeEvent
   * {
   *    variableChanges: {
   *         elExpression:value
   *         ...
   *    }
   *    providerChanges: {
   *      providerId: {
   *         <operation>:{
   *            current_row_key: { properties filtered by node }
   *            ...
   *         }
   *             ...
   *      }
   *      ...
   *    }
   * }
   *
   * Given that, we need to do the following for each data change event:
   * Variable Changes:
   *    set the value in the local cache
   *    notify anyone interested in that variable, that it has changed.
   *
   * Provider Changes:
   *    on Create:
   *      set the value in the local cache
   *    on Update:
   *      set the value in the local cache
   *      notify anyone interested in that variable, that it has changed.
   *    on Create:
   *      remove the value from the local cache
   *
   * For more details see @Understanding_DataChangeListeners
   */
  adf.mf.api.processDataChangeEvent = function(/* DataChangeEvent */ dce)
  {
    var dcevs  = [];  /* data change event variables  */
    var pdces  = {};  /* provider data change details */

    var perfOp = adf.mf.internal.perf.startMonitorOperation("Process data change event", adf.mf.log.level.FINER,
      "adf.mf.api.processDataChangeEvent");

    try
    {
      if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "processDataChangeEvent",
            ("processing a data change event with " + adf.mf.util.stringify(dce)));
      }

      try
      {
        var hasMoreKeysVariableChanges = {};
        var va;
        // Due to the way the API was created, the embedded side will always fire hasMoreKeys
        // data change events even when the value does not change (the API has no concept of the
        // current value, so has nothing to compare against). The problem with this is that
        // data change events may be expensive to process (like an AMX node tree visit). It
        // should be faster to check these values and ensure that these are broadcast as
        // changes when the value is actually changed.
        for (va in dce.variableChanges)
        {
          if (adf.mf.util.stringEndsWith(va, ".collectionModel.treeNodeBindings.hasMoreKeys"))
          {
            hasMoreKeysVariableChanges[va] = (true == adf.mf.el.getLocalValue("#{" + va + "}"));
          }
        }

        adf.mf.internal.api.updateGenericCacheElement(dce.variableChanges, false); // only update the cache

        /* add to the batch data change events */
        for (va in dce.variableChanges)
        {
          dcevs.push(va);

          if((weakref = adf.mf.internal.context.getWeakReference(va)) !== undefined)
          {
            dcevs.push(weakref);
          }

          // Look to see if the variable is of type TreeBindings and if so, add it to the provider
          // change list
          var variableChange = dce.variableChanges[va];

          // Check to see if the variable change is for the hasMoreKeys property of a collection
          // model's tree node bindings property. If so, treat it as an itemized provider change
          var hasMoreKeysOldValue = hasMoreKeysVariableChanges[va];
          if (hasMoreKeysOldValue != null)
          {
            // EL including the ".collectionModel":
            var collectionModelEl = va.substring(0, va.length - 29);

            // If another property has not changed on the tree bindings, then we can handle a
            // hasMoreKeys change in an optimized fashion.
            if (pdces[collectionModelEl] == null)
            {
              var hasMoreKeysNewValue = (true == adf.mf.el.getLocalValue("#{" + va + "}"));

              if (hasMoreKeysOldValue != hasMoreKeysNewValue)
              {
              // Notify the listeners that the hasMoreKeys property has changed
              pdces[collectionModelEl] = { itemized:true, hasMoreKeysChanged:true };
              dcevs.push(collectionModelEl); // for individual dce notifications
            }
          }
          }
          else if(adf.mf.util.isType(variableChange, "TreeBindings"))
          {
            pdces[va] = { itemized:false };
            dcevs.push(va); // for individual dce notifications
          }
          else if (adf.mf.util.stringEndsWith(va, ".collectionModel.treeNodeBindings.keys"))
          {
            // If the keys array has changed and there are no itemized set of changes in the
            // provider changes, then the entire collection model has changed and a
            // non-itemized change set should be recorded.
            var providerEl = va.substring(0, va.length - 38);
            if (dce.providerChanges[providerEl] == null)
            {
              pdces[collectionModelEl] = { itemized:false };
              dcevs.push(collectionModelEl); // for individual dce notifications
            }
          }
        }
      }
      catch(e)
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.WARNING))
        {
          adf.mf.log.logInfoResource("ADFInfoBundle", adf.mf.log.level.WARNING, "adf.mf.api.processDataChangeEvent", "WARN_PROCESSING_VAR_CHANGES", e);
        }
      }

      var perf = adf.mf.internal.perf.startMonitorCall("Process provider changes", adf.mf.log.level.FINER, 
			"adf.mf.api.processDataChangeEvent:providerChanges");
      try
      {
        if(dce.providerChanges !== undefined)
        {
          for(var p in dce.providerChanges)
          {
            // each property key is the name of the provider that has a change
            var pdce = dce.providerChanges[p];

            adf.mf.internal.api.updateGenericCacheElement(pdce.columnAttributes, true);

            if(pdce.providers)
            {
              // these are changes to the column attributes
              var cmpn   = p + ".collectionModel";
              var cmn    = "#{" + cmpn + "}";
              var cm     = adf.mf.api.getLocalValue(cmn);
              var create = pdce.providers.create || {};
              var update = pdce.providers.update || {};
              var dirty  = pdce.providers.dirty  || {};
              var remove = pdce.providers.remove || {};

              if(cm === undefined)
              {
                if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
                {
                  adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "processDataChangeEvent",
                      ("Warning: received a data change event before " + cmn + " has been cached.  Ignoring the change."));
                }
                break;
              }

              // See if the record was already added by a variable change
              var pd = pdces[cmpn];

              if (pd == null)
              {
                pd = { itemized:true };
                pdces[cmpn] = pd;
                dcevs.push(cmpn); // for individual dce notifications
              }

              pd.created = []; // Objects with "key" property
              pd.updated = []; // Key strings
              pd.deleted = []; // Key strings
              pd.dirtied = []; // Key strings

              // ensure there is a providers object to access
              var tnb = cm.treeNodeBindings;
              tnb.providers = tnb.providers || {};

              for(var k in create)
              {
                try
                {
                  // make sure we got the keys so we can actually see this new provider :-)
                  pd.created.push({key:k});
                  tnb.providers[k] = create[k];
                }
                catch(e)
                {
                  if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.WARNING))
                  {
                    adf.mf.log.logInfoResource("ADFInfoBundle", adf.mf.log.level.WARNING, "adf.mf.api.processDataChangeEvent", "WARN_PROCESSING_CREATE_DATA_CHANGE", p, e);
                  }
                }
              }
              for(var k in update)
              {
                try
                {
                  /* please note, this will add the provider if it is currently not in the cache */
                  pd.updated.push(k);
                  tnb.providers[k] = update[k];
                }
                catch(e)
                {
                  if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.WARNING))
                  {
                    adf.mf.log.logInfoResource("ADFInfoBundle", adf.mf.log.level.WARNING, "adf.mf.api.processDataChangeEvent", "WARN_PROCESSING_UPDATE_DATA_CHANGE", p, e);
                  }
                }
              }
              for(var k in dirty)
              {
                try
                {
                  /* actually removed the provider, if it is still there */
                  pd.dirtied.push(k);
                  delete tnb.providers[k];
                }
                catch(e)
                {
                  if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.WARNING))
                  {
                    adf.mf.log.logInfoResource("ADFInfoBundle", adf.mf.log.level.WARNING, "adf.mf.api.processDataChangeEvent", "WARN_PROCESSING_REMOVE_DATA_CHANGE", p, e);
                  }
                }
              }

              for(var k in remove)
              {
                try
                {
                  /* actually removed the provider, if it is still there */
                  pd.deleted.push(k);
                  delete tnb.providers[k];
                }
                catch(e)
                {
                  if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.WARNING))
                  {
                    adf.mf.log.logInfoResource("ADFInfoBundle", adf.mf.log.level.WARNING, "adf.mf.api.processDataChangeEvent", "WARN_PROCESSING_REMOVE_DATA_CHANGE", p, e);
                  }
                }
              }
            }
          }
        }
      }
      catch(e)
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.WARNING))
        {
          adf.mf.log.logInfoResource("ADFInfoBundle", adf.mf.log.level.WARNING, "adf.mf.api.processDataChangeEvent", "WARN_PROCESSING_PROVIDER_CHANGES", e);
        }
      }
      finally
      {
        perf.stop();
      }

      /* notify all the data change listeners (registered either individually or batch wise) */
      adf.mf.internal.api.notifyDataChangeListeners(dcevs, pdces);
    }
    catch(ge)
    {
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE, "adf.mf.api.processDataChangeEvent", "ERROR_PROCESSING_DATA_CHANGE_EVENT", ge);
    }
    finally
    {
      perfOp.stop();
      adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.api", "processDataChangeEvent", "process data change event done");
    }
  };

  /* String */
  adf.mf.internal.api.getWeakReference = function(/* String */ fqn)
  {
    return adf.mf.internal.context.getWeakReference(fqn);
  };

  /* String */
  adf.mf.internal.api.addCompressedReference = function(/* String */ reference)
  {
    return adf.mf.internal.context.addCompressedReference(reference);
  };

  /**
   * INTERNAL FUNCTION used to determine if Java is available or not.
   */
  adf.mf.internal.isJavaAvailable = function()
  {
    return ((window                                                 !== undefined) &&
        (window.container                                       !== undefined) &&
        (window.container.internal                              !== undefined) &&
        (window.container.internal.device                       !== undefined) &&
        (window.container.internal.device.integration           !== undefined) &&
        (window.container.internal.device.integration.vmchannel !== undefined));
  };


  /**
   * INTERNAL FUNCTION used to determine if we are or not in design time mode.
   */
  adf.mf.internal.isDesignTime = function()
  {
    return false;  /* TBD: add the ajax call to determine if this should be true or false */
  };


  /**
   * INTERNAL FUNCTION used to caches value for an expression
   */
  adf.mf.internal.el.cacheResult = function (request, response)
  {
    if(adf.mf.internal.util.is_array(response))
    {
      // we have an array of name value pairs
      for(var i = 0; i < response.length; ++i)
      {
        var nvp = response[i];

        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.internal.el", "cacheResult",
              ("adfmf- caching " + response.length + " values."));
        }

        /* we need to make sure we only try to cache individual terms */
                // old way: if(! adf.mf.internal.el.parser.parse(nvp.name).isComplexExpression())
        if(adf.mf.internal.util.isAssignable(nvp.name))
        {
          if(nvp[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] === true)
          {
            if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
            {
              adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
                "adf.mf.internal.el", "cacheResult",
                "Caching [" + nvp.name + "] as an exception - " + adf.mf.util.stringify(nvp));
            }
          }
          adf.mf.api.setLocalValue(nvp, function() {}, function() {});
        }
        else
        {
          if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.internal.el", "cacheResult",
                ("not caching complex expression [" + nvp.name + "]."));
          }
        }
      }
    }
  };


  /**
   * INTERNAL FUNCTION used by the processDataChangeEvent handler to update generic
   * properties in the cache.
   *
   * @param values
   *
   * For more details see @Understanding_DataChangeListeners
   */
  adf.mf.internal.api.updateGenericCacheElement = function(/* arguments */)
  {
    var values = (arguments.length > 0)? arguments[0] : null;
    var notify = (arguments.length > 1)? arguments[1] : true;

    /* update the cache's modification id */
    adf.mf.internal.context.updateModId();
    if(values !== undefined)
    {   /* each variable change property is an scalar property that was changed */
      var nvp    = [];

      for(var va in values)
      {
        var vk = '#{' + va + '}';
        var pvk = adf.mf.internal.el.parser.parse(vk);
        nvp.push({'name':vk, 'expression':pvk, 'value':values[va]});
      }

      if(nvp.length > 0)
      {
        try
        {
          adf.mf.api.setLocalValue(nvp,
              function(a,b) { if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
              {
                adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.internal.api", "updateGenericCacheElement",
                    ("updated the java script cache variables " + adf.mf.util.stringify(b)));
              }},
              function(a,b) { if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.SEVERE))
              {
                adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE, "adf.mf.internal.api.updateGenericCacheElement", "ERROR_UNABLE_TO_SET_DATA_CHANGE_VALS", adf.mf.util.stringify(b));
              }});

          if(notify) adf.mf.internal.api.notifyDataChangeListeners(values, null);
        }
        catch(e)
        {
          if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.WARNING))
          {
            adf.mf.log.logInfoResource("ADFInfoBundle", adf.mf.log.level.WARNING, "adf.mf.internal.api.updateGenericCacheElement", "WARN_UPDATING_CACHE");
          }
        }
      }
    };
  };


  /**
   * INTERNAL FUNCTION used to notify all the registered batch listeners
   * that the given variables have changed.
   *
   * #see Understanding_DataChangeListeners
   */
  adf.mf.internal.api.notifyBatchDataChangeListeners = function(variables, details)
  {
    var perf = adf.mf.internal.perf.startMonitorCall("Notify registered batch data change listeners", adf.mf.log.level.FINER,
      "adf.mf.internal.api.notifyBatchDataChangeListeners");

    for(var i = 0; i < adf.mf.internal.batchDataChangeListeners.length; ++i)
    {
      try
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.internal.api", "notifyBatchDataChangeListeners",
              "notify listener " + i + "th bulk data change callback");
        }
        adf.mf.internal.batchDataChangeListeners[i](variables, details);
      }
      catch(e)
      {
        adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
            "adf.mf.internal.api.notifyBatchDataChangeListeners",
            "ERROR_IN_BULK_NOTIFICATION_CALLBACK", e);
      }
    }

    perf.stop();
  };


  /**
   * INTERNAL FUNCTION used to notify all the registered listeners
   * that the given variable has changed.
   *
   * #see Understanding_DataChangeListeners
   */
  adf.mf.internal.api.notifyIndividualDataChangeListeners = function(variable)
  {
    var values = (adf.mf.internal.util.is_array(variable))? variable : [variable];  /* ensure values is an array */

    var perf = adf.mf.internal.perf.startMonitorCall("Notify individual data change listeners", adf.mf.log.level.FINER,
      "adf.mf.internal.api.notifyIndividualDataChangeListeners");

    for(var i = 0; i < values.length; ++i)
    {
      var  v  = values[i];
      var  la = (v.slice(0, "bindings".length) == "bindings")?
      currentBindingInstance.dataChangeListeners[v] : dataChangeListeners[v];

      if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "adf.mf.internal.api", "notifyIndividualDataChangeListeners",
            ("**NDCL** Variable " + i + ": " + v + " has changed (" + adf.mf.api.getLocalValue(v)  + ") "));
      }
      if(la !== undefined)
      {
        for(var j = 0; j < la["callback"].length; ++j)
        {
          var k = 0;  /* declared out here so we can use it in the exception log message */

          try
          {
            for(k = 0; k < la["id"].length; ++k)
            {
              if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
              {
                adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.internal.api", "notifyDataChangeListeners",
                    ("notify listener " + j + "th callback in " + adf.mf.util.stringify(la) + " listeners"));
              }
              la["callback"][j](la["id"][k]);
            }
          }
          catch(e)
          {
            adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
                "adf.mf.internal.api.notifyIndividualDataChangeListeners",
                "ERROR_IN_INDIVIDUAL_NOTIFICATION_CALLBACK", la["id"][k], e);
          }
        }
      }
      else
      {
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.internal.api", "notifyIndividualDataChangeListeners",
              ("no listener set is defined for " + values[i]));
        }
      }
    }

    perf.stop();
  };

  /**
   * INTERNAL FUNCTION used to notify all the registered listeners
   * that the given variable has changed.
   *
   * #see Understanding_DataChangeListeners
   */
  adf.mf.internal.api.notifyDataChangeListeners = function(vars, pdces)
  {
    if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
        "adf.mf.api", "notifyDataChangeListeners",
        "with variables " + adf.mf.util.stringify(vars));
      adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
        "adf.mf.api", "notifyDataChangeListeners",
        "with provider details" + adf.mf.util.stringify(pdces));
    }

    /* notify the individual listeners */
    adf.mf.internal.api.notifyIndividualDataChangeListeners(vars);

    /* notify the batched listeners */
    adf.mf.internal.api.notifyBatchDataChangeListeners(vars, pdces);
  };

  /**
   * PRIVATE FUNCTION used to eat standard errors for any name-value exceptions values
   */
  adf.mf.internal.api.nvpEatErrors = function(request, response)
  {
    adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.internal.api", "nvpEatErrors", "eat standard errors");
  };


  /**
   * PRIVATE FUNCTION used to simulate standard errors for any batch or array values
   */
  adf.mf.internal.api.arraySimulatedErrors = function(request, response)
  {
    var requests  = (adf.mf.internal.util.is_array(request ))? request  : [request ];  /* ensure response is an array */
    var responses = (adf.mf.internal.util.is_array(response))? response : [response];  /* ensure response is an array */
    var length    = responses.length;

    var perf = adf.mf.internal.perf.startMonitorCall("Simulate standard errors for any batch or array values",
      adf.mf.log.level.FINER, "adf.mf.internal.api.arraySimulatedErrors");

    for(var i = 0; i < length; ++i)
    {
      var rv = (adf.mf.internal.util.is_array(responses[i]))? responses[i][0] : responses[i];
      if(adf.mf.util.isType(rv, "NameValuePair"))
      {
        /*
         * if the response type is a NVP or and array of them simply forward
         * that request/response to nvpSimulatedErrors handler to do the work
         */
        adf.mf.internal.api.nvpSimulatedErrors(requests[0], responses[i]);
      }
      else if(adf.mf.util.isException(responses[i]))
      {
        try
        {
          /* notify the error handlers */
          adf.mf.internal.api.notifyErrorHandlers(requests[0], responses[i]);
        }
        catch(e)
        {
          adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE,
              "adf.mf.internal.api.arraySimulatedErrors", "ERROR_IN_ERROR_CALLBACK");
        }
      }
    }
    perf.stop();
  };


  /**
   * PRIVATE FUNCTION used to simulate standard errors for any name-value exceptions values
   */
  adf.mf.internal.api.nvpSimulatedErrors = function(request, response)
  {
    var responses = (adf.mf.internal.util.is_array(response))? response : [response];  /* ensure response is an array */

    var perf = adf.mf.internal.perf.startMonitorCall("Simulate standard errors for any name-value exceptions values",
      adf.mf.log.level.FINER, "adf.mf.internal.api.nvpSimulatedErrors");

    for(var i = 0; i < responses.length; ++i)
    {
      var nvp = responses[i];

      if(adf.mf.util.isType(nvp, "NameValuePair"))
      {
        if(nvp[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] !== undefined)
        {
          if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINEST))
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
              "adf.mf.internal.api", "nvpSimulatedErrors",
              "this is an exception: " + adf.mf.util.stringify(nvp));
          }

          /* lets be sure and make sure the value is true */
          if(nvp[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] == true)
          {
            try
            {
              /* notify the error handlers */
              adf.mf.internal.api.notifyErrorHandlers(nvp.name, nvp.value);
            }
            catch(e)
            {
              adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE, "adf.mf.internal.api.nvpSimulatedErrors", "ERROR_IN_ERROR_CALLBACK");
            }
          }
        }
      }
      else
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.internal.api", "nvpSimulatedErrors",
            "response element " + i + " was not of type NameValuePair - " + adf.mf.util.stringify(nvp));
      }
    }
    perf.stop();
  };


  /**
   * INTERNAL FUNCTION used to notify all the registered error handlers
   */
  adf.mf.internal.api.notifyErrorHandlers = function(req, resp)
  {
    var perf = adf.mf.internal.perf.startMonitorCall("Notify all registered error handlers", adf.mf.log.level.FINER,
      "adf.mf.internal.api.notifyErrorHandlers.callback");

    if((resp != undefined) && (resp != null) && (resp[adf.mf.internal.api.constants.DEFERRED_PROPERTY] != true))
    {
      for(var i = 0; i < adf.mf.internal.errorHandlers.length; ++i)
      {
        try
        {
          if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.internal.api", "notifyErrorHandlers",
                "notify error handler " + i + " of the error");
          }
          adf.mf.internal.errorHandlers[i](req, resp);
        }
        catch(e)
        {
          adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE, "adf.mf.internal.api.notifyErrorHandlers", "ERROR_CALLING_ERROR_HANDLERS", e);
        }
      }
    }
    perf.stop();
  };


  /**
   * INTERNAL FUNCTION used to clear all the binding variables
   * currently registered.
   */
  adf.mf.internal.el.resetBindingContext = function()
  {
    var perf = adf.mf.internal.perf.startMonitorCall("Reset binding context", adf.mf.log.level.FINER,
      "adf.mf.internal.el.resetBindingContext");

    try
    {
      adf.mf.api.removeVariable('bindings');
      adf.mf.api.addVariable('bindings', {});
      adf.mf.internal.el.clearWeakReferences();
      adf.mf.internal.el.parser.cache.clear();

      /* now clean up all the bindings data change listeners */
      currentBindingInstance.dataChangeListeners = {};
    }
    catch(e)
    {
      adf.mf.log.logInfoResource("ADFErrorBundle", adf.mf.log.level.SEVERE, "adf.mf.internal.el.resetBindingContext", "ERROR_RESETTING_BINDING_CONTEXT", e);
    }
    finally
    {
      perf.stop();
    }
  };

  /**
   * INTERNAL FUNCTION used to clear all weak references in the system.
   */
  /* void */
  adf.mf.internal.el.clearWeakReferences = function()
  {
    adf.mf.log.Framework.logp(adf.mf.log.level.FINEST,
      "adf.mf.internal.el", "clearWeakReferences", name);
    adf.mf.internal.context.clearWeakReferences();
  };


  adf.mf.el.removeCache = function(keys)
  {
    count = keys.length;
    for (var i = 0; i < count; i++) {
      elCache.kill(keys[i]);
    }
  };


  adf.mf.internal.el.getBindingInstance = function(/* String */ id)
  {
    var  bi = bindingInstances[id];

    if(bi == null)
    {
      bi = {"bindings": {}, "dataChangeListeners": {}};
      bindingInstances[id] = bi;
    }

    if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.internal.el", "purgeCache",
          ("getBindingInstance for '" + id + "' = " + adf.mf.util.stringify(bi)));
    }

    return bi;
  };

  adf.mf.internal.el.switchBindingInstance = function(id)
  {
    if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "adf.mf.internal.el", "switchBindingInstance",
          ("switchBindingInstance to '" + id + "'"));
    }

    currentBindingInstance = adf.mf.internal.el.getBindingInstance(id);

    adf.mf.api.removeVariable('bindings');
    adf.mf.api.addVariable('bindings',   currentBindingInstance.bindings);
    // adf.mf.internal.el.clearWeakReferences();
    adf.mf.internal.el.parser.cache.clear();
  };

  /**
   * PUBLIC FUNCTION used to add a performance monitor observation.  Can be called with or without the description parameter.
   * @param monitorId      - monitor ID
   * @param description    - description for the given monitor (optional)
   * @param duration       - observation duration.  This is the quantity value that is observed.
   * @param successCB      - success callback
   * @param failureCB      - failure callback
   *
   * e.g. adf.mf.api.addMonitorObservation("MyCategory.methodFoo", 123, successCB, failureCB);
   * e.g. adf.mf.api.addMonitorObservation("MyCategory.methodFoo", "Measures time spent in method Foo", 123, successCB, failureCB);
   *
   */
  /* void */
  adf.mf.api.addMonitorObservation = function()
  {
    var args = [].splice.call(arguments,0);   // convert arguments into a real array
    var updatedArgs = ["oracle.adfmf.framework.api.Model", "addMonitorObservation"];
    adf.mf.api.invokeMethod.apply(this, updatedArgs.concat(args));
  };

  /*
   * Initialize the default binding instance for HTML base interactions
   */
  var currentBindingInstance = adf.mf.internal.el.getBindingInstance("default");
})();



/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/Adfel.js///////////////////////////////////////



/////////////////////////////////////// start of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/AdfelBridge.js///////////////////////////////////////

/* Copyright (c) 2011, 2014, Oracle and/or its affiliates. All rights reserved. */
/* ------------------- AdfelBridge.js ---------------------- */
// @requires Adfel


var adf                    = window.adf                 || {};
adf.el                     = adf.el                     || {};
adf.log                    = adf.log                    || {};

adf.mf                     = adf.mf                     || {};
adf.mf.api                 = adf.mf.api                 || {};
adf.mf.api.adf             = adf.mf.api.adf             || {};
adf.mf.el                  = adf.mf.el                  || {};
adf.mf.locale              = adf.mf.locale              || {};
adf.mf.log                 = adf.mf.log                 || {};
adf.mf.resource            = adf.mf.resource            || {};
adf.mf.util                = adf.mf.util                || {};

adf.mf.internal            = adf.mf.internal            || {};
adf.mf.internal.api        = adf.mf.internal.api        || {};
adf.mf.internal.el         = adf.mf.internal.el         || {};
adf.mf.internal.el.parser  = adf.mf.internal.el.parser  || {};
adf.mf.internal.locale     = adf.mf.internal.locale     || {};
adf.mf.internal.log        = adf.mf.internal.log        || {};
adf.mf.internal.mb         = adf.mf.internal.mb         || {};
adf.mf.internal.perf       = adf.mf.internal.perf       || {};
adf.mf.internal.perf.story = adf.mf.internal.perf.story || {};
adf.mf.internal.resource   = adf.mf.internal.resource   || {};
adf.mf.internal.util       = adf.mf.internal.util       || {};


/**
 * PUBLIC FUNCTION used to add a new data change listener (callback) for a given el expression (variable)
 * 
 * e.g.
 *   adf.addDataChangeListeners("#{bindings.apple}",                   appleChangedCallback); 
 *   adf.addDataChangeListeners("#{bindgins.apple + bindings.orange}", appleOrOrangeChangedCallback);
 *                              
 * 	 adf.addDataChangeListeners("#{!bindings.foo}",                    bindingsFooChangedCallback);
 * 
 *   where the callback would looks something like this:
 *   bindingsFooChangedCallback = function(id)
 *   {
 *      document.write("DataChangeNotification 1 notification for ID: " + id);
 *   }
 *   
 * If the same expression/listener combination is registered several times, duplicates are discarded.
 * 
 * For more details see @Understanding_DataChangeListeners
 */
adf.addDataChangeListeners = function(expression, callback) 
{
	adf.mf.api.addDataChangeListeners.apply(this, arguments);
};

adf.mf.api.adf.loadADFMessageBundles = function(baseUrl, loadMessageBundleCallback)
{
	adf.mf.resource.loadADFMessageBundles.apply(this, arguments);
};

adf.mf.api.adf.getInfoString = function(bundleName, key)
{
	adf.mf.resource.getInfoString.apply(this, arguments);
};

adf.mf.api.adf.getErrorId = function(bundleName, key)
{
	adf.mf.resource.adf.getErrorId.apply(this, arguments);
};

adf.mf.api.adf.getErrorCause = function(bundleName, key)
{
	adf.mf.resource.getErrorCause.apply(this, arguments);
};

adf.mf.api.adf.getErrorAction = function(bundleName, key)
{
	adf.mf.resource.getErrorAction.apply(this, arguments);
};

adf.mf.api.adf.logAndThrowErrorResource = function(bundleName, methodName, key)
{
	adf.mf.log.logAndThrowErrorResource.apply(this, arguments);
};

adf.mf.api.adf.logInfoResource = function(bundleName, level, methodName, key)
{
	  adf.mf.log.logInfoResource.apply(this, arguments);
};




/**
 * PUBLIC FUNCTION used to get the current context ID. 
 *
 * e.g. adf.getContextId(success, failed);
 * 
 * @deprecated
 */
/* void */
adf.getContextId = function(success, failed) 
{ 
	adf.mf.api.getContextId.apply(this, arguments);
};


/**
 * PUBLIC FUNCTION used to get the current context's pagedef. 
 *
 * e.g. adf.getContextId(success, failed);
 * 
 */
adf.getContextPageDef = function(success, failed)
{
	adf.mf.api.getContextPageDef.apply(this, arguments);
};

/**
 * PUBLIC FINCTION used to get the current context's instance ID
 */
adf.getContextInstanceId = function(success, failed)
{
	adf.mf.api.getContextInstanceId.apply(this, arguments);
};


/**
 * setContext
 * pageDef    - name of the page definition
 * instanceId - unique id for the instance
 * resetState - reset the bindings associated with this instance
 * reSync     - resend the initial bindings structure to the container
 */
adf.setContextInstance = function(pageDef, instancedId, resetState, /* boolean */reSync, success, failed)
{
	adf.mf.api.setContextInstance.apply(this, arguments);
};

adf.removeContextInstance = function(pageDef, instanceId, success, failed)
{
	adf.mf.api.removeContextInstance.apply(this, arguments);
};


/**
 * PUBLIC FUNCTION used to invoke method in any class in classpath.
 * 
 * e.g. adf.invokeMethod(classname, methodname, param1, param2, ... , paramN ,successCallback, failedCallback);
 *
 * Examples:
 *      adf.invokeMethod("TestBean", "setStringProp", "foo", success, failed);                  
 *      adf.invokeMethod("TestBean", "getStringProp", success, failed);                  
 *      adf.invokeMethod("TestBean", "testSimpleIntMethod", "101", success, failed); // Integer parameter              
 *      adf.invokeMethod("TestBean", "testComplexMethod", 
 *              {"foo":"newfoo","baz":"newbaz",".type":"TestBeanComplexSubType"}, success, failed); // Comples parameter
 *      adf.invokeMethod("TestBean", "getComplexColl", success, failed); // No parameter
 *      adf.invokeMethod("TestBean", "testMethodStringStringString", "Hello ", "World", success, failed); // 2 string parameter
 *
 * @param classname  - name of the class
 * @param methodname - name of the method
 * @param params     - parameters
 * @param success    - invoked when the method is successfull invoked
 *                     (signature: success(request, response))
 * @param failed     - invoked when an error is encountered 
 *                     (signature: failed(request, response))
 */
adf.invokeMethod = function() 
{ 
	adf.mf.api.invokeMethod.apply(this, arguments);
};

/**
 * PUBLIC FUNCTION used to invoke IDM Mobile SDK methods
 */
adf.invokeSecurityMethod = function(command, username, password, tenantname)  
{ 
	adf.mf.security.invokeSecurityMethod.apply(this, arguments); 
};

/**
 * PUBLIC FUNCTION used to remove all data change listeners associated with the variable
 * 
 * For more details see @Understanding_DataChangeListeners
 */
adf.removeDataChangeListeners = function(expression) 
{
	adf.mf.api.removeDataChangeListeners.apply(this, arguments); 
};


/**
 * PUBLIC FUNCTION used to reset context. Call this before setting new context.
 * This is exactly the same as calling adf.setContext with an empty context name.
 *
 * e.g. adf.resetContext(successCallback, failedCallback);
 */
/* void */
adf.resetContext = function(success, failed) 
{ 
	adf.mf.api.resetContext.apply(this, arguments); 
};


/**
 * PUBLIC FUNCTION used to set context for the specified name
 * 
 * e.g. adf.setContext("myContextName", successCallback, failedCallback);
 */
/* void */
adf.setContext = function(/* context name */ name, success, failed) 
{
	adf.mf.api.setContext.apply(this, arguments); 
};


/**
 * PUBLIC FUNCTION used to create a top-level variable
 * into the context.  This should be thought of as adding
 * a variable to the root namespace for variables.
 * 
 * i.e. adf.el.addVariable("name", some_object);
 * 
 * addVariable/removeVariable are used to add and then remove
 * temporary variables, like loop iterator variables along with
 * longer lasting variables.
 */
/* void */
adf.el.addVariable = function(/* variable name */ name, /* new value */ value) 
{ 
	adf.mf.api.addVariable.apply(this, arguments); 
};


/**
 * PUBLIC FUNCTION will evaluate the passed in expression against
 * the local cache ONLY.  If there are terms that are currently
 * not cached or any function calls then undefined will be returned.
 * 
 * @see adf.el.addVariable
 * @see adf.el.removeVariable
 * 
 * @see adf.el.getValue
 * @see adf.el.setValue
 * @see adf.el.setLocalValue
 */
adf.el.getLocalValue = function(/* expression */ expression) 
{
	return adf.mf.api.getLocalValue.apply(this, arguments);
};


/** 
 * PUBLIC FUNCTION used to evaluate the expression(s) passed in and return the associated 
 * value(s) via the success callback.  Since not all variables may not be resolved only the
 * resolved expressions will be returned in the 'response' property of the success callback.
 *  
 * Given that you can use this method to get the value for:
 * 
 * Evaluation of a single EL expression:
 * e.g. adf.el.getValue("#{100+2*20/3}", success, failed);
 * e.g. adf.el.getValue("#{bindings.userName.inputValue}", success, failed);
 * 
 * Evaluation of an array of EL expressions:
 * e.g. adf.el.getValue(["#{100+2*20/3}", "#{500/2}"], success, failed);
 * e.g. adf.el.getValue(["#{bindings.foo}", "#{applicationScope.username}"], success, failed);
 * 
 * Success Callback:
 * success(request, response)
 *   where the request echos the first argument passed in
 *     and the response is an array of name-value-pairs, one for each resolved expression.
 * so if we take our examples above:
 *   e.g. adf.el.getValue("#{100+2*20/3}", success, failed);
 *        success(["#{100+2*20/3}"], [ {name:"#{100+2*20/3}", value:"113.33"} ] )
 *        
 *   e.g. adf.el.getValue("#{bindings.userName.inputValue}", success, failed);
 *        success(["#{bindings.userName.inputValue}"], [ {name:"#{bindings.userName.inputValue}", value:"me"} ] )
 * 
 *   e.g. adf.el.getValue(["#{100+2*20/3}", "#{500/2}"], success, failed);
 *        success(["#{100+2*20/3}", "#{500/2}"], 
 *                [ {name:"#{100+2*20/3}", value:"113.33"}, {name:"#{500/2}", value:"250"} ] )
 * 
 * Now let suppose that bindings.foo exists but not bindings.bar.  In this case would see:
 * e.g. adf.el.getValue( ["#{bindings.foo}", "#{bindings.bar}"], success, failed);
 *        success(["#{bindings.foo}", "#{bindings.bar}"], 
 *                [{ "name": "#{bindings.foo}", "value": "foo" }] )
 *          *** notice: binding.bar was not part of the result array
 *          
 * Failed Callback:
 * failed(request, exception)
 *   where the request echos the first argument passed in
 *     and the exception encountered resulting in all of the expressions failing to be resolved
 *   
 * There also exists another way to invoke the getValue used to resolve a property from an already 
 * retrieved base object.  This version is used by the AMX layer to do things like iterator variables
 * when doing collection/lists/tables.  In this version, we simply let the EL resolvers determine
 * the "right thing to do" based on the 'base' and 'property' variables:
 * 
 * e.g. adf.el.getValue(base, property);
 *   where the value returned is value of the property or nil if it does not exists.
 **/
adf.el.getValue = function() 
{
	adf.mf.api.getValue.apply(this, arguments);
};


/** 
 * PUBLIC FUNCTION used to used to invoke a method expression in the java environment.
 * 
 * expression: is the method expression itself
 *             i.e. #{bean.method}  #{applicationScope.bean.method}
 * params    : is an array of zero or more values that should be passed as the method parameters
 *             i.e. []                      - to invoke bean.method()
 *             or ["Hello"]                 - to invoke bean.method(String)
 *             or [[false, false], "Hello"] - to invoke bean.method(boolean[], String)
 * returnType: is the return type
 *             i.e. void                    - 
 *             i.e. String                  - return type is a string
 * types     : i.e. []                      - no parameters
 *             i.e. [java.lang.String]      - one parameter of type String
 *             i.e. [java.lang.String, int] - parameter-1 of type String, parameter-2 of type int
 *               
 * Given this information the correct method will be looked up and invoked from the given method.
 * 
 * Evaluation of a single EL expression:
 * e.g. invoke("#{Bean.foobar}", [parameters], [parameter-types], success, failed);
 * 
 * Success Callback:
 * success(request, response)
 *   where the request echos the first argument passed in
 *     and the response is an array of name-value-pairs, one for each resolved expression.
 * so if we take our examples above:
 *   e.g. adf.el.invoke("#{Bean.foobar}", [], "java.lang.String", [], success, failed);
 *        success({method:"#{Bean.foobar}" arguments:[]}, {result:....} )
 *          
 * Failed Callback:
 * failed(request, exception)
 *   where the request echos the first argument passed in
 *     and the exception encountered resulting in all of the expressions failing to be resolved
 **/
adf.el.invoke = function(expression, params, returnType, types, success, failed) 
{
	adf.mf.api.invoke.apply(this, arguments);
};


/** 
 * PUBLIC FUNCTION used to update a value for a given variable expression.
 * Since variable expressions are the only type of expressions that can be LHS
 * (left-hand-side) expressions we can rule out all literal, complex, and method 
 * expressions from the possible input.
 * 
 * A simple name-value-pair object is used to denote the variable expression (name)
 * with it's desired value (value).  An example of this would be: 
 *       { "name":"#{applicationScope.foo}", value:"foobar" } 
 * 
 * Similar to the getValue function, the setValue can take a single name-value-pair
 * or an array of them for doing batch sets.  The following examples will highlight
 * these cases:
 * 
 * Passing only a single name-value-pair
 * e.g. adf.el.setValue( { "name": "#{bindings.foo}", "value": "foo" }, success, failed);
 *      resulting in the bindings.foo variable being assigned foo
 *      
 * Passing an array of name-value-pairs
 * e.g. adf.el.setValue( [{ "name": "#{bindings.foo}", "value": "foo" }, 
 *                        { "name": "#{bindings.bar}", "value": "bar" }], success, failed);
 *      resulting in the bindings.foo variable being assigned foo and 
 *                       bindings.bar variable being assigned bar
 *      
 * 
 * Success Callback:
 * success(request, response)
 *   where the request echos the first argument passed in
 *     and the response is an array of name-value-pairs, one for each resolved expression.
 * so if we take our examples above:
 *   e.g. adf.el.setValue( { "name": "#{bindings.foo}", "value": "foo" }, success, failed);
 *        success(["{ "name": "#{bindings.foo}", "value": "foo" }"], [ { "name": "#{bindings.foo}", "value": "foo" } ] )
 *        
 * e.g. adf.el.setValue( [{ "name": "#{bindings.foo}", "value": "foo" }, 
 *                        { "name": "#{bindings.bar}", "value": "bar" }], success, failed);
 *        success([{ "name": "#{bindings.foo}", "value": "foo" }, 
 *                 { "name": "#{bindings.bar}", "value": "bar" }], 
 *                [{ "name": "#{bindings.foo}", "value": "foo" }, 
 *                 { "name": "#{bindings.bar}", "value": "bar" }] )
 * 
 * Now let suppose that bindings.foo exists but not bindings.bar.  In this case would see:
 * e.g. adf.el.setValue( [{ "name": "#{bindings.foo}", "value": "foo" }, 
 *                        { "name": "#{bindings.bar}", "value": "bar" }], success, failed);
 *        success([{ "name": "#{bindings.foo}", "value": "foo" }, 
 *                 { "name": "#{bindings.bar}", "value": "bar" }], 
 *                [{ "name": "#{bindings.foo}", "value": "foo" }] )
 *          *** notice: binding.bar was not part of the result array
 * 
 * Failed Callback:
 * failed(request, exception)
 *   where the request echos the first argument passed in
 *     and the exception encountered resulting in all of the expressions failing to be resolved
 *   
 * There also exists another way to invoke the setValue used to set a property from an already 
 * retrieved base object.  This version is used by the AMX layer to do things like iterator variables
 * when doing collection/lists/tables.  In this version, we simply let the EL resolvers determine
 * the "right thing to do" based on the 'base' and 'property' variables:
 * 
 * e.g. adf.el.setValue(base, property, value);
 *   where the base.property is assigned the value of 'value'
 **/
adf.el.setValue = function(nvp, success, failed) 
{
	adf.mf.api.setValue.apply(this, arguments);
};


/**
 * PUBLIC FUNCTION used to set the value only on the javascript side.
 * 
 * @see adf.el.setValue
 */
adf.el.setLocalValue = function() 
{
	adf.mf.api.setLocalValue.apply(this, arguments);
};


/**
 * PUBLIC FUNCTION used to remove a top-level variable
 * from the context.  This should be thought of as removing
 * a variable from the root namespace for variables.
 * 
 * i.e. adf.el.removeVariable("name");
 */
/* void */
adf.el.removeVariable = function(/* variable name */ name) 
{
	adf.mf.api.removeVariable.apply(this, arguments);
};


/**
 * PUBLIC FUNCTION used to create a top-level variable
 * into the context.  This should be thought of as adding
 * a variable to the root namespace for variables.
 * 
 * i.e. adf.el.setVariable("name", some_object);
 * 
 * Most of the time the 'some_object' will be a property
 * map.  So we can do things like:
 *   adf.el.getValue("${name.property}");
 */
/* void */
adf.el.setVariable = function(/* variable name */ name, /* new value */ value) 
{
	adf.mf.api.setVariable.apply(this, arguments);
};

 /**
 * PUBLIC FUNCTION used to process the data change event associated with response messages.
 * 
 * DataChangeEvents can be sent as their own request message or as part of _any_ response
 * message.  This event is sent to inform the javascript side that some data was side-effected
 * in the CVM layer and should be propagated into the javascript cache as well as notify the 
 * user interface of the change.  This event has the following JSON represention:
 *   
 * DataChangeEvent
 * {
 *  	variableChanges: {
 * 	    	elExpression:value
 * 	    	...
 *  	}
 *  	providerChanges: {
 *  		providerId: {
 *  		   <operation>:{ 
 *  		      current_row_key: { properties filtered by node }
 *  		      ...
 *  		   }
 *             ...
 *  		}
 *  		...
 *  	}
 * }
 * 
 * Given that, we need to do the following for each data change event:
 * Variable Changes:
 *    set the value in the local cache
 *    notify anyone interested in that variable, that it has changed.
 *    
 * Provider Changes:
 *    on Create:
 *      set the value in the local cache
 *    on Update:
 *      set the value in the local cache
 *      notify anyone interested in that variable, that it has changed.
 *    on Create:
 *      remove the value from the local cache
 * 
 * For more details see @Understanding_DataChangeListeners
 */
adf.processDataChangeEvent = function(/* DataChangeEvent */ dce)
{
	adf.mf.api.processDataChangeEvent.apply(this, arguments);
};


/////////////////////////////////////// end of /Volumes/MAF/JenkinsArchive/workspace/MAF-v2.3.x-tip-And-iOS/Container/JavaScript/ADF/js/AdfelBridge.js///////////////////////////////////////

/* Copyright (c) 2011, 2016, Oracle and/or its affiliates. All rights reserved. */
/*
 *
 * ADF Mobile v1.1 (iOS and Android)
 *
 * http://www.oracle.com/technetwork/developer-tools/adf/overview/adf-mobile-096323.html
 *
 * Copyright (c) 2011 Oracle.
 * All rights reserved.
 *
 */

try
{
    /* Helper code to resolve anonymous callback functions,

    If the function callback can be resolved by name it is returned unaltered.
    If the function is defined in an unknown scope and can't be resolved, an internal reference to the function is added to the internal map.

    Callbacks added to the map are one time use only, they will be deleted once called.

    example 1:
    function myCallback(){};
    fString = GetFunctionName(myCallback);
    - result, the function is defined in the global scope, and will be returned as is because it can be resolved by name.

    example 2:
    fString = GetFunctionName(function(){};);
    - result, the function is defined in place, so it will be returned unchanged.

    example 3:
    function myMethod()
    {
        var funk = function(){};
        fString = GetFunctionName(funk);
    }
    - result, the function CANNOT be resolved by name, so an internal reference wrapper is created and returned.
    */
   window._anomFunkMap = window._anomFunkMap || {};
   window._anomFunkMapNextId = window._anomFunkMapNextId || 0;

   window.anomToNameFunk = window.anomToNameFunk || function(fun)
   {
      var funkId = "f" + _anomFunkMapNextId++;
      var funk = function()
      {
         fun.apply(this,arguments);
         _anomFunkMap[funkId] = null;
         delete _anomFunkMap[funkId];
      }
      _anomFunkMap[funkId] = funk;

      return "_anomFunkMap." + funkId;
   };

   window.GetFunctionName = window.GetFunctionName || function(fn)
   {
      if (typeof fn === "function") {
         var name= fn.name;
         if (!name) {
            var m = fn.toString().match(/^\s*function\s+([^\s\(]+)/);
            name= m && m[1];
         }
         if (name && (window[name] === fn)) {
            return name;
         } else {
            return anomToNameFunk(fn);
         }
      }else {
         return null;
      }
   };

   // Page level API 'namespace' objects - 'window' is the same as
   // using 'var adf;'...
   window.adf = window.adf || {};
   window.adf.mf = window.adf.mf || {};
   window.adf.mf.internal = window.adf.mf.internal || {};
   window.adf.mf.internal.di = window.adf.mf.internal.di || {};
   window.adf.mf.internal.di.api = window.adf.mf.internal.di.api || {};
   window.getAdfmfApiRoot = function()
   {
      return adf.mf.internal.di.api;
   }
   // Location for all the adf.pg functions is container.internal.device.integration
   window.container = window.container || {};
   window.container.internal = window.container.internal || {};
   window.container.internal.device = window.container.internal.device || {};
   window.container.internal.device.integration = window.container.internal.device.integration || {};
   window.containerInternalRoot = window.containerInternalRoot || function()
   {
      return container.internal.device.integration;
   }
   window.containerInternalRootDescription = window.containerInternalRootDescription || function()
   {
      return "container.internal.device.integration";
   }
   containerInternalRoot().getAdfmfPhoneGap = containerInternalRoot().getAdfmfPhoneGap || function ()
   {
      if(typeof(cordova) == 'undefined')
      {
         alert("cordova is undefined.");
         return null;
      }
      return cordova;
   }

   /**
    * The 'adf.pg' varable is used to denote that we are running on a phonegap device and
    *        the user interface layer should act appropriately.
    */
   window.adf.pg = "RUNNING ON A PHONEGAP DEVICE";

   /**
    * Gets the AMX Includes specified for this feature.
    */
   containerInternalRoot().getAmxIncludeList = function(successCB, failureCB)
   {
      var cordovaRequest = new CordovaRequest({params:[]},
                                              function(request, result){ successCB(result) },
                                              failureCB);
      cordovaRequest.setPlugin("ADFMobileShell");
      cordovaRequest.setMethod("getAmxIncludeList");
      cordovaRequest.execute();
   };

   /**
    * Represents the API for interacting with features in the ADF Mobile Container.
    */
   window.ADFMobileFeatures = function()
   {
      this.inProgress = false;
      this.records = new Array();
      this.hideNavigationBar_errorCallback = null;
      this.showNavigationBar_errorCallback = null;
      this.registerActivationHandler_errorCallback = null;
   };

   /**
    * The method to register a function as a handler for activation notices.
    */
   ADFMobileFeatures.prototype.registerActivationHandler = function(scb, ecb)
   {
      // this is necessary until we fully move ADFMobileFeatures.m to use the passed-in ecb value
      this.registerActivationHandler_errorCallback = null;
      var bErrCallback = (ecb == undefined || ecb == null) ? false : true;
      if (bErrCallback)
      {
         this.registerActivationHandler_errorCallback = ecb;
      }

      // console.log("creating registerActivationHandler request");
      var cordovaRequest = new CordovaRequest({params:[window.GetFunctionName(scb)]}, function(){/* Don't Care about success. */}, ecb);
      cordovaRequest.setPlugin("ADFMobileFeatures");
      cordovaRequest.setMethod("registerActivationHandler");
      cordovaRequest.execute();
   };

   /**
    * Represents the API for interacting with the CVM in the ADF Mobile Native Framework.
    */
   window.ADFMobileJava = function()
   {
      this.inProgress = false;
      this.invokeJava_resultsCallback = null;
      this.invokeJava_errorCallback = null;
   };

   /**
    * The method to send a message into the VMChannel
    */
   ADFMobileJava.prototype.invoke = function(passedInMT, request, successCB, errorCB)
   {
      try
      {
         // console.log("creating ADFMobileJava.prototype.invoke request");
         var cordovaRequest = new CordovaRequest(request, successCB, errorCB);
         cordovaRequest.execute();
      }
      catch(e)
      {
         var msg = ("Error in ADFMobileJava.prototype.invoke - error=" + adf.mf.util.stringify(e) + " for request = " + adf.mf.util.stringify(request));

         alert(msg);

         adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "device.integration", "invoke",
               ("Error creating nd executing CordovaRequest error = " + msg));
      }
   };

   /**
    * Represents the API for interacting with regions in the ADF Mobile Container.
    */
   window.AdfmfSlidingWindowPlugIn =  window.AdfmfSlidingWindowPlugIn || function()
   {
   };

   /**
    * The method to create a sliding window
    * The success and failure callback methods have the signature function(request,result)
    * in the case of success the result object is the window identifier
    * in the case of failure the result object is a json map.  the error message can be obtained with result.description
    */
   AdfmfSlidingWindowPlugIn.prototype.create =    AdfmfSlidingWindowPlugIn.prototype.create ||  function(/* String */ featureId, success, failure)
   {
      var cordovaRequest = new CordovaRequest({params:[featureId]},success, failure);
      cordovaRequest.setPlugin("AdfmfSlidingWindowPlugIn");
      cordovaRequest.setMethod("create");
      cordovaRequest.execute();
   };

 /**
    * The method to destroy a sliding window
    */
   AdfmfSlidingWindowPlugIn.prototype.destroy =    AdfmfSlidingWindowPlugIn.prototype.destroy || function(/* String */ windowId, success, failure)
   {
      var cordovaRequest = new CordovaRequest({params : [windowId]}, success, failure);
      cordovaRequest.setPlugin("AdfmfSlidingWindowPlugIn");
      cordovaRequest.setMethod("destroy");
      cordovaRequest.execute();
   };

/**
    * The method to get the current window id for the webview this is called within.  Returns an empty string if the current
    web view was not created with the sliding window plugin
    */
   AdfmfSlidingWindowPlugIn.prototype.getCurrentWindowId =    AdfmfSlidingWindowPlugIn.prototype.getCurrentWindowId || function(success,failure)
   {
      var cordovaRequest = new CordovaRequest({params:[]}, success, failure);

      cordovaRequest.setPlugin("AdfmfSlidingWindowPlugIn");
      cordovaRequest.setMethod("getCurrentWindowId");
      cordovaRequest.execute();
   };

  /**
    * The method to get the top sliding window's identifier as returned by create
    */
   AdfmfSlidingWindowPlugIn.prototype.getTopWindowId =    AdfmfSlidingWindowPlugIn.prototype.getTopWindowId || function(success, failure)
   {
      var cordovaRequest = new CordovaRequest({params:[]}, success, failure);
      cordovaRequest.setPlugin("AdfmfSlidingWindowPlugIn");
      cordovaRequest.setMethod("getTopWindowId");
      cordovaRequest.execute();
   };

   /**
    * The method to get the identifiers of all the sliding windows that are created and valid
    */
   AdfmfSlidingWindowPlugIn.prototype.getWindowIds =    AdfmfSlidingWindowPlugIn.prototype.getWindowIds || function(success, failure)
   {
      var cordovaRequest = new CordovaRequest({params:[]}, success, failure);
      cordovaRequest.setPlugin("AdfmfSlidingWindowPlugIn");
      cordovaRequest.setMethod("getWindowIds");
      cordovaRequest.execute();
   };

   /**
    * The method to show a sliding window
    */
   AdfmfSlidingWindowPlugIn.prototype.show =    AdfmfSlidingWindowPlugIn.prototype.show || function(/* String */ windowId, options, success, failure)
   {
      var cordovaRequest = new CordovaRequest({params:[windowId, options]}, success, failure);
      cordovaRequest.setPlugin("AdfmfSlidingWindowPlugIn");
      cordovaRequest.setMethod("show");
      cordovaRequest.execute();
   };

   /**
    * The method to hide a sliding window
    */
   AdfmfSlidingWindowPlugIn.prototype.hide = AdfmfSlidingWindowPlugIn.prototype.hide || function(/* String */ windowId, success, failure)
   {
      var cordovaRequest = new CordovaRequest({params : [windowId]}, success, failure);
      cordovaRequest.setPlugin("AdfmfSlidingWindowPlugIn");
      cordovaRequest.setMethod("hide");
      cordovaRequest.execute();
   };

   /**
    * The method to get information about a sliding window
    */
    AdfmfSlidingWindowPlugIn.prototype.getWindowInfo =    AdfmfSlidingWindowPlugIn.prototype.getWindowInfo || function(/* String */ windowId, success, failure)
    {
    var cordovaRequest = new CordovaRequest({params:[windowId]}, success, failure);
    cordovaRequest.setPlugin("AdfmfSlidingWindowPlugIn");
    cordovaRequest.setMethod("getWindowInfo");
    cordovaRequest.execute();
    };

   /**
    * Represents the API for interacting with Push Notifications in the ADF Mobile Container.
    */
   window.ADFMobilePushNotifications = window.ADFMobilePushNotifications || function()
   {
   };

   /**
    * Register for notifications
    */
   ADFMobilePushNotifications.prototype.register = function(params, successCB, failureCB)
   {
      var cordovaRequest = new CordovaRequest(params, successCB, failureCB);
      cordovaRequest.setPlugin("PushPlugin");
      cordovaRequest.setMethod("register");
      cordovaRequest.execute();
   };

   /**
    * Represents the API for interacting with Local Notifications 
    */
   window.MafLocalNotification = window.MafLocalNotification || function()
   {
   };

   /**
    * local notifications - add
    */
   MafLocalNotification.prototype.add = function(params, successCB, failureCB)
   {
      var cordovaRequest = new CordovaRequest(params, successCB, failureCB);
      cordovaRequest.setPlugin("MafLocalNotification");
      cordovaRequest.setMethod("add");
      cordovaRequest.execute();
   };
   
   /**
    * local notifications - cancel
    */
   MafLocalNotification.prototype.cancel = function(params, successCB, failureCB)
   {
      var cordovaRequest = new CordovaRequest(params, successCB, failureCB);
      cordovaRequest.setPlugin("MafLocalNotification");
      cordovaRequest.setMethod("cancel");
      cordovaRequest.execute();
   };   

   /**
    * OutstandingRequestList is the implementation for the collection of request currently being processed.
    **/
   OutstandingRequestList = function()
   {
      this.queue      = {};
      this.nextId     = 500;
      this.size       = 0;

      /* return a unique request id */
      this.getUniqueRequestId = function()
      {
         return "CR-" + (++this.nextId);;
      };

      /* echo the outstanding request queue */
      this.showQueue = function()
      {
         try {
            var buf = " ";
            var cnt = 0;

            for(property in this.queue) {
               if((property !== undefined) && (property !== null)) {
                  if((typeof this.queue[property]) != 'function')
                  {
                     buf += ("\"" + property + ":" + this.queue[property].requestId + ":" + this.queue[property].timestamp + "\" ");
                     cnt++;
                  }
               }
            }
            return (" queue:"+cnt+"= [" + buf + "]");
         }
         catch(e)
         {
            return ("--error--");
         }
      };

      /* get (but do not remove) the request associated with the given id */
      this.getRequest = function(/* String */ id)
      {
         return this.queue[id];
      };

      /* insert a new request into the queue */
      this.insert = function(/* CordovaRequest */ cr)
      {
         this.size++;
         this.queue[cr.requestId] = cr;
         // console.log("OutstandingRequestList: insert: request=" + cr.requestId + "/" + cr.timestamp + " -- " + this.showQueue() + " scb="+cr.scb.length);
      };

      /* remove the associated request from the queue */
      this.remove = function(/* String */ id)
      {
         var cr = this.queue[id];

         if(cr === undefined) {
            adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "device.integration", "remove",
                  ("Error remvoving CordovaRequest: ERROR in Outstanding Request List ["+id+"] is not found."));
         }
         else {
            if(cr.requestId != id) {
               adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "device.integration", "remove",
                     ("Error remvoving CordovaRequest: ERROR in Outstanding Request List queue[" + id + "]/" + cr.timestamp + " is not " + cr.requestId));
            }
            delete this.queue[id];
            // console.log("OutstandingRequestList: remove: id=" + id + " request="+cr.requestId + this.showQueue() + " scb="+cr.scb.length);
         }

         return cr;
      };

      return this;
   };
   adf.mf.internal.processingRequestQueue = new OutstandingRequestList();


   /* Generate the associated success callback to be invoked by Corodova */
   containerInternalRoot().cordovaSuccessCallback = function(/* String */ id)
   {
      var body = "";

      body += "try{ ";
      body += "  var req = adf.mf.internal.processingRequestQueue.remove('" + id + "'); ";
      body += "  if((req != undefined) && (req != null))";
      body += "  {";
      body += "    adf.mf.log.Framework.logp(adf.mf.log.level.FINER, 'adf.mf.device.integration', 'cordovaSuccessCallback', 'Cordova Response Success Callback' + req.requestId);";
      // body += "    console.log('SUCCESS (id / req): " + id + " / ' + req.requestId );";
      body += "    req.success(r);";
      body += "  }else{";
      body += "    adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, 'adf.mf.device.integration', 'cordovaSuccessCallback', 'Cordova Success Response Handler Error: Request Id (" + id + ") was not found.');";
      body += "  }";
      body += "}catch(e){";
      body += "  adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, 'adf.mf.device.integration', 'cordovaSuccessCallback', 'Cordova Success Response Handler Error: Request Id (" + id + ") error=' + e);";
      body += "  alert('Cordova Response Success Handler Error:' + e);";
      body += "}";

      return new Function('r', body);
   };

   /* Generate the associated failure callback to be invoked by Corodova */
   containerInternalRoot().cordovaFailureCallback = function(/* String */ id)
   {
      var body = "";

      body += "try{ ";
      body += "  var req = adf.mf.internal.processingRequestQueue.remove('" + id + "'); ";
      body += "  if((req != undefined) && (req != null))";
      body += "  {";
      body += "    adf.mf.log.Framework.logp(adf.mf.log.level.FINER, 'adf.mf.device.integration', 'cordovaFailureCallback', 'Cordova Response Failure Callback' + req.requestId);";
      // body += "    console.log('FAILURE (id / req): " + id + " / ' + req.requestId + ' r=' + adf.mf.util.stringify(r));";
      body += "    req.failure(r);";
      body += "  }else{";
      body += "    adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, 'adf.mf.device.integration', 'cordovaSuccessCallback', 'Cordova Failure Response Handler Error: Request Id (" + id + ") was not found.');";
      body += "  }";
      body += "}catch(e){";
      body += "  adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, 'adf.mf.device.integration', 'cordovaFailureCallback', 'Cordova Failure Response Handler Error: Request Id (" + id + ") error=' + e);";
      body += "  alert('Cordova Response Failure Handler Error:' + e);";
      body += "}";

      return new Function('r', body);
   };

   /* Request object used to hold the pending Cordova request that is out being processed */
   CordovaRequest = function(request, success, failed)
   {
      try
      {
         this.timestamp      = "T" + ((new Date()).getTime() % 600000);
         this.requestId      = adf.mf.internal.processingRequestQueue.getUniqueRequestId();
         this.scb            = adf.mf.internal.util.is_array(success)? success : [success];
         this.fcb            = adf.mf.internal.util.is_array(failed)?  failed  : [failed ];
         this.plugin         = "ADFMobileShell";
         this.methodName     = "invokeJavaMethod";
         this.request        = request;

         /**
          * set the plugin name
          * @param  name
          **/
         /* void */
         this.setPlugin      = function(name)
         {
            this.plugin      = name;
         };

         /**
          * set the method name
          * @param  name
          **/
         /* void */
         this.setMethod      = function(name)
         {
            this.methodName  = name;
         };

         /* internal success callback for this request */
         this.success = function(result)
         {
            try
            {
               if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
               {
                  adf.mf.log.Framework.logp(adf.mf.log.level.FINE, "device.integration", "success",
                        "Inside the success callback for request " + this.requestId);
               }

               for(var i = 0; i < this.scb.length; ++i)
               {
                  try
                  {
                     // console.log("START: device.integration.success - request = " + this.requestId + " success callback " + i + " with result = " + result);
                     // adf.mf.internal.perf.start("device.integration.success", "request = " + this.requestId + " success callback " + i);
                	 if (this.scb[i])
                     {
                	   this.scb[i](this.request, result);
                	 }

                     // adf.mf.internal.perf.stop("device.integration.success", "request = " + this.requestId + " success callback " + i);
                     // console.log("END: device.integration.success - request = " + this.requestId + " success callback " + i);
                  }
                  catch(sce)
                  {
                     adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, "device.integration", "success",
                           ("Error executing Cordova request " + this.requestId +
                                 " success callback " + i + " or " + this.scb[i] +
                                 " request: " + adf.mf.util.stringify(this.request) +
                                 " result: " + adf.mf.util.stringify(result)) +
                                 " error: " + adf.mf.util.stringify(sce));
                     try
                     {
                        // adf.mf.internal.perf.start("device.integration.success", "request = " + this.requestId + " failure callback " + i);
                    	if(this.fcb[i])
                    	{
                    	  this.fcb[i](this.request, sce);
                    	}

                        // adf.mf.internal.perf.stop("device.integration.success", "request = " + this.requestId + " failure callback " + i);
                     }
                     catch(fatalError)
                     {
                        adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "device.integration", "success",
                              ("Error executing Cordova request " + this.requestId + " failed callback " + i + "   error = " + fatalError));
                     }
                  }
               }
            }
            catch(se)
            {
               adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "device.integration", "success",
                     ("Error executing cordovaSuccess callback - " + se));
            }
         }

         /* internal failure callback for this request */
         this.failure = function(result)
         {
            try
            {
               if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINE))
               {
                  adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "device.integration", "failure",
                        ("Inside the failure callback for request " + this.requestId));
               }

               for(var i = 0; i < this.fcb.length; ++i)
               {
                  try
                  {
                     // console.log("START: device.integration.failure - request = " + this.requestId + " failure callback " + i + " with result = " + result);
                     // adf.mf.internal.perf.start("device.integration.failure", "request = " + this.requestId + " failure callback " + i);
                     if(this.fcb[i])
                     {
                       this.fcb[i](this.request, result);
                     }

                     // adf.mf.internal.perf.stop("device.integration.failure", "request = " + this.requestId + " failure callback " + i);
                  }
                  catch(fce)
                  {
                     /* nothing we can do */
                     adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, "device.integration", "failure",
                           ("Error executing Cordova request " + this.requestId +
                                 " failure callback " + i + " or " + this.scb[i] +
                                 " request: " + adf.mf.util.stringify(this.request) +
                                 " result: " + adf.mf.util.stringify(result)) +
                                 " error: " + adf.mf.util.stringify(fce));
                }
               }
            }
            catch(fe)
            {
               adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "device.integration", "failure",
                     ("Error executing cordovaFailure callback - " + fe));
            }
         }
         this.fail = this.failure;


         this.execute = function()
         {
            try
            {
               if(typeof(cordova) == "undefined")
               {
                  adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "device.integration", "execute",
                     ("ERROR: Cordova has not been properly included. Aborting Cordova call to " + this.plugin + "." + this.methodName));
                  return;
               }

               adf.mf.internal.processingRequestQueue.insert(this);
               adf.mf.internal.processingRequestQueue.insert(this);

              cordova.exec(containerInternalRoot().cordovaSuccessCallback(this.requestId),
                     containerInternalRoot().cordovaFailureCallback(this.requestId),
                     this.plugin, this.methodName, [this.request]);
            }
            catch(e)
            {
               // console.log("Cordova Request post-exec with exception for " + this.requestId);
               adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "device.integration", "execute",
                     ("Error executing Cordova request " + this.requestId + " with error = " + adf.mf.util.stringify(e)));

               for(var i = 0; i < this.fcb.length; ++i)
               {
                  try
                  {
                	 if(this.fcb[i])
                	 {
                	   this.fcb[i](this.request, e);
                	 }
                  }
                  catch(fe)
                  {
                     /* nothing we can do */
                     adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "device.integration", "execute",
                           ("Error executing Cordova request " + this.requestId + " failed callback " + i));
                  }
               }
            }
         }

         if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.FINER))
         {
            adf.mf.log.Framework.logp(adf.mf.log.level.FINER, "device.integration", "constructor",
                  ("Cordova Request " + this.requestId + " has been created. " + adf.mf.util.stringify(this.request)));
         }
         return this;
      }
      catch(ex)
      {
         adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "device.integration", "execute",
               ("Error creating Cordova Request error = " + adf.mf.util.stringify(ex)));
      }
   };

   /**
    * Add the Features service to ADFMobile
    */
   containerInternalRoot().Features = new ADFMobileFeatures();
   adf.mf.Features                  = containerInternalRoot().Features;

   /**
    * Add the vmchannel (formerly Java) service to ADFMobile
    */
   containerInternalRoot().vmchannel = new ADFMobileJava();

   /**
    * Add the SlidingWindow service to ADFMobile
    */
   containerInternalRoot().SlidingWindow = new AdfmfSlidingWindowPlugIn();

   /**
    * Add the PushPlugin service to ADFMobile
    */
   containerInternalRoot().PushNotifications = new ADFMobilePushNotifications();

   /**
    * Add the Local Notification service to Maf
    */
   containerInternalRoot().LocalNotification = new MafLocalNotification();
   
}
catch(e)
{
   console.log("**************************************************");
   console.log("***** ERROR: adf.mf.device.integration.js buildout error: " + e);
}

adf.mf.internal.BUILD_INFO = {
PRODUCT_VERSION: "2.3.0.1.0",
JOB_NAME: "MAF-v2.3.x-tip-And-iOS",
BUILD_NUMBER: "15",
};
