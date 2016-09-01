/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------------- amx-resource.js ------------------ */
/* ------------------------------------------------------ */

// base-adfel.js defines all of the other namespaces
if (!window.adf) window.adf = {};
                  adf.mf              = adf.mf              || {};
                  adf.mf.api          = adf.mf.api          || {};
/** @namespace */ adf.mf.api.amx      = adf.mf.api.amx      || {};
                  adf.mf.internal     = adf.mf.internal     || {};
/** @namespace */ adf.mf.internal.amx = adf.mf.internal.amx || {};
                  adf.mf.resource     = adf.mf.resource     || {};
if (!window.amx) window.amx = {}; /* deprecated */

// --------- Config Initialization --------- //
(function()
{
  // define the names of the 2 known message bundles here
  adf.mf.resource.AMXErrorBundleName = "AMXErrorBundle";
  adf.mf.resource.AMXInfoBundleName  = "AMXInfoBundle";
})();
// --------- /Config Initialization --------- //

// --------- Utilities --------- //
(function()
{
  function loadTrinidadLocaleElements(baseUrl, localeList, callback)
  {
    var getLocaleElementsUrl = function(locale)
    {
      return baseUrl + "/resource/LocaleElements_" + adf.mf.locale.getJavaLanguage(locale) + ".js";
    };

    var isLocaleElementsLoaded = function(locale)
    {
      var suffix = "_" + adf.mf.locale.getJavaLanguage(locale);
      if (typeof window["LocaleSymbols" + suffix] !== "undefined")
      {
        return true;
      }
      return false;
    };

    adf.mf.api.amx.loadJavaScriptByLocale(
      localeList,
      getLocaleElementsUrl,
      isLocaleElementsLoaded,
      callback,
      true);
  }

  function loadTrinidadMessageBundle(baseUrl, languageList, callback)
  {
    var getMessageBundleUrl = function(language)
    {
      var url = baseUrl + "/resource/MessageBundle";
      if (language.indexOf("en") == 0)
      {
        return url + ".js";
      }
      return url + "_" + adf.mf.locale.getJavaLanguage(language) + ".js";
    };

    var isMessageBundleLoaded = function(locale)
    {
      return typeof TrMessageFactory._TRANSLATIONS !== "undefined";
    };

    adf.mf.api.amx.loadJavaScriptByLocale(
      languageList,
      getMessageBundleUrl,
      isMessageBundleLoaded,
      callback,
      true);
  }

  function loadOtherMessageBundles(baseUrl, languageList)
  {
    /* first load the ADF message bundles */
    adf.mf.resource.loadADFMessageBundles(
      baseUrl,
      languageList.slice(0),
      true);

    /* now load the AMX message bundles */
    adf.mf.resource.loadMessageBundle(
      adf.mf.resource.AMXErrorBundleName,
      baseUrl,
      languageList.slice(0),
      true);
    adf.mf.resource.loadMessageBundle(
      adf.mf.resource.AMXInfoBundleName,
      baseUrl,
      languageList.slice(0),
      true);
  }

  // --------- /Private helper methods --------- //

  // --------- Public methods --------- //

  adf.mf.api.amx.loadJavaScriptByLocale = function(localeList, constructor, predicate, callback, async)
  {
    // clone the array before calling the load method since it will actually
    // modify the array as it searches
    var clonedList = [].concat(localeList);

    var loadedResolve = null;
    var loadedPromise = new adf.mf.internal.BasePromise(
      function(resolve, reject)
      {
        loadedResolve = resolve;
      });
    var wrappedCallback = function(result)
    {
      loadedResolve();
      callback(result);
    };
    adf.mf.internal.resource.loadJavaScriptByLocale(clonedList, constructor, predicate, wrappedCallback, async);
    return loadedPromise;
  };

  adf.mf.api.amx.loadTrinidadResources = function(baseUrl) /* used by base-controller.js */
  {
    // before doing anything, we need to register the error handler
    adf.mf.api.addErrorHandler(adf.mf.internal.amx.errorHandlerImpl);

    // Bootstrap the Trinidad locale globals
    _df2DYS = null;

    // Return global variable _locale if it is non-null; otherwise return the browser language
    _locale = adf.mf.locale.getUserLocale();
    var language = adf.mf.locale.getUserLanguage();

    var localeList = adf.mf.locale.generateLocaleList(_locale, true);
    var languageList = adf.mf.locale.generateLocaleList(language, false);

    loadTrinidadLocaleElements(baseUrl, localeList,
      function(locale)
      {
        if (locale === null)
        {
          // for this low-level method, always send in the english string
          if (adf.mf.log.Framework.isLoggable(adf.mf.log.level.WARNING))
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, "amx", "loadTrinidadResources",
              "Failed to load LocaleElements");
          }
        }
        else
        {
          // Reassign global locale (necessary since Trinidad does not fallback to en-US).
          _locale = locale;
        }
      });

    loadTrinidadMessageBundle(baseUrl, languageList, function(language)
    {
      if (language === null)
      {
        // for this low-level method, always send in the english string
        if(adf.mf.log.Framework.isLoggable(adf.mf.log.level.WARNING))
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, "amx", "loadTrinidadResources",
            "Failed to load MessageBundle");
        }
      }
    });

    // load any other message bundles that the js system depends on
    loadOtherMessageBundles(baseUrl, languageList);
  };
  // --------- /Public methods --------- //

}) ();
//--------- /Utilities --------- //
/* Copyright (c) 2013, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* --------------- amx-elDependencies.js ---------------- */
/* ------------------------------------------------------ */

(function()
{
  /**
   * Object to parse the EL dependencies for attributes and maintain a map for what EL
   * dependencies are used by certain attributes. Internal object used by AmxTag and
   * AmxNode.
   * @constructor adf.mf.internal.amx.AmxElDependencies
   * @augments adf.mf.api.AdfObject
   */
  function AmxElDependencies(
    attributes)
  {
    this.Init(attributes);
  }

  adf.mf.internal.amx.AmxElDependencies = AmxElDependencies;
  adf.mf.api.AdfObject.createSubclass(
    adf.mf.internal.amx.AmxElDependencies,
    adf.mf.api.AdfObject,
    "adf.mf.internal.amx.AmxElDependencies");

  /**
   * Initialization method. Using adf.mf.internal.amx.acceptAttributeForElProcessing, this function
   * will gather all the EL dependencies of the attributes so that they may be hooked into the
   * data change event framework.
   *
   * @param {Object.<string, string>} a map of the attribute names as keys and the raw value from
   *                                  the amx or amxf file for the attribute.
   * @protected
   */
  adf.mf.internal.amx.AmxElDependencies.prototype.Init = function(attributes)
  {
    AmxElDependencies.superclass.Init.call(this);

    this._attributeElDependencies = {};
    this._elTokens = [];

    for (var attrName in attributes)
    {
      var attrVal = attributes[attrName];
      if (typeof attrVal == "string" || attrVal instanceof String)
      {
        attrVal = adf.mf.internal.el.parser.parse(attrVal);
      }

      if (adf.mf.internal.amx.acceptAttributeForElProcessing(attrName, attrVal))
      {
        var dependencies = attrVal.getIndexedDependencies();
        for (var i = 0, size = dependencies.length; i < size; ++i)
        {
          var dependency = dependencies[i];
          var attrDependencies = this._attributeElDependencies[dependency];
          if (attrDependencies == null)
          {
            this._attributeElDependencies[dependency] = [ attrName ];
          }
          else
          {
            attrDependencies.push(attrName);
          }

          // Avoid duplicates:
          if (this._elTokens.indexOf(dependency) == -1)
          {
            this._elTokens.push(dependency);
          }
        }
      }
    }
  };

  /**
   * Get the names of the attributes that are affected by a change
   * to the given EL dependency.
   *
   * @param {adf.mf.internal.el.parser.ELExpression} valueExpression the value expression
   *        containing one term
   * @return {Array.<string>} array of attribute names.
   */
  adf.mf.internal.amx.AmxElDependencies.prototype.getAttributesForElDependency = function(
    valueExpression)
  {
    var attrs = this._attributeElDependencies[valueExpression.getIndexedRepresentation()];
    return attrs == null ? [] : attrs;
  };

  /**
   * Get the EL tokens that all the attributes are dependent on.
   *
   * @return {Array.<string>} the EL tokens
   */
  adf.mf.internal.amx.AmxElDependencies.prototype.getElTokens = function()
  {
    return this._elTokens;
  };

})();
/* Copyright (c) 2013, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* -------------------- amx-tag.js ---------------------- */
/* ------------------------------------------------------ */

(function()
{
  // ------ AMX Tag ------ //
  /**
   * AMX tag object. JS object representation of the AMX node definition from the AMX page.
   * Constructor should only be by the framework.
   *
   * @param {(adf.mf.api.amx.AmxTag|null)} parentTag the parent tag or null for the root.
   * @param {Node} xmlNode the XML DOM node from the AMX page
   * @param {Array.<number>} nextAutoGeneratedId an array with a single integer (to be able
   *        to change the value) for tags without IDs, the next auto-generated
   *        one to use.
   * @constructor adf.mf.api.amx.AmxTag
   * @augments adf.mf.api.AdfObject
   */
  function AmxTag(
    parentTag,
    xmlNode,
    nextAutoGeneratedId)
  {
    this.Init(parentTag, xmlNode, nextAutoGeneratedId);
  }

  adf.mf.api.amx.AmxTag = AmxTag;
  adf.mf.api.AdfObject.createSubclass(adf.mf.api.amx.AmxTag, adf.mf.api.AdfObject,
    "adf.mf.api.amx.AmxTag");

  adf.mf.api.amx.AmxTag.prototype.Init = function(
    parentTag,
    xmlNode,
    nextAutoGeneratedId)
  {
    AmxTag.superclass.Init.call(this);

    // TODO assert that xmlNode != null and xmlNode.nodeType == 1
    this._parent = parentTag;
    this._ns = xmlNode.namespaceURI;
    this._prefixedName = xmlNode.tagName;
    this._name = xmlNode.localName;
    this._nsPrefixedName = this._ns + ":" + this._name;
    this._textContent = "";
    this._elDependencies = null;
    this._attr = {};
    this._uiTag = null;

    if (this._name == "parsererror")
    {
      var errorText = xmlNode.textContent;
      if (adf.mf.environment.profile.mockData)
        console.log("*** " + errorText); // make more obvious error for mock mode
      throw new Error(adf.mf.resource.getInfoString("AMXErrorBundle",
        "ERROR_XML_PARSING_ERROR", errorText));
    }

    var attrs = xmlNode.attributes;
    var i, size;
    var idFound = false;

    for (i = 0, size = attrs.length; i < size; ++i)
    {
      var a = attrs[i];
      this._attr[a.name] = a.value;
      if (idFound == false && a.name == "id")
      {
        idFound = true;
      }
    }

    if (!idFound)
    {
      // Assign a unique ID to the tag
      if (nextAutoGeneratedId == null)
      {
        nextAutoGeneratedId = [ 0 ];
      }

      this._attr["id"] = "_auto" + (nextAutoGeneratedId[0]++);
    }

    this._children = [];
    var children = xmlNode.childNodes;
    for (i = 0, size = children.length; i < size; ++i)
    {
      var child = children[i];

      switch (child.nodeType)
      {
        case 1: // element
          var tag = new adf.mf.api.amx.AmxTag(this, child, nextAutoGeneratedId);
          this._children.push(tag);
          break;
        case 3: // text node
        case 4: // CDATA node
          if (this._textContent == null)
          {
            // First text or CDATA node encountered:
            this._textContent = child.textContent;
          }
          else
          {
            // Subsequent text or CDATA nodes:
            this._textContent += child.textContent;
          }
          break;
      }
    }
  };

  AmxTag.NAMESPACE_AMX = "http://xmlns.oracle.com/adf/mf/amx";
  AmxTag.NAMESPACE_DVTM = AmxTag.NAMESPACE_AMX + "/dvt";

  /**
   * Get the XML namespace URI for the tag.
   * @return {string} the namespace URI
   */
  adf.mf.api.amx.AmxTag.prototype.getNamespace = function()
  {
    return this._ns;
  };

  /**
   * @deprecated
   */
  adf.mf.api.amx.AmxTag.prototype.getPrefixedName = function()
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "AmxTag.getPrefixedName", "MSG_DEPRECATED", "amxTag.getPrefixedName",
      "Use amxTag.getNsPrefixedName instead.");
    return this._prefixedName;
  };

  /**
   * Return the tag name including the namespace prefix (not the local xmlns prefix).
   * This is the full XML name like "http://xmlns.example.com/custom:custom".
   * @return {string} the tag name with the prefix
   */
  adf.mf.api.amx.AmxTag.prototype.getNsPrefixedName = function()
  {
    return this._nsPrefixedName;
  };

  /**
   * Get the tag name. This is the local XML tag name without the prefix.
   * @return {string} the tag name
   */
  adf.mf.api.amx.AmxTag.prototype.getName = function()
  {
    return this._name;
  };

  /**
   * Get the parent tag.
   * @return {(adf.mf.api.amx.AmxTag|null)} the parent tag or null for the top level
   *         tag.
   */
  adf.mf.api.amx.AmxTag.prototype.getParent = function()
  {
    return this._parent;
  };

  /**
   * Returns the text content of the tag.
   * @return {string} the text content, or an empty string.
   */
  adf.mf.api.amx.AmxTag.prototype.getTextContent = function()
  {
    return this._textContent;
  };

  /**
   * Recursively search the tag hierarchy for tags with the given
   * namespace and tag name. Returns the current tag if a match as well.
   *
   * @param {string} namespace the namespace of the children to retrieve.
   * @param {string} tagName the name of the tags to return.
   * @return {Array.<adf.mf.api.amx.AmxTag>} array of all the matching tags.
   */
  adf.mf.api.amx.AmxTag.prototype.findTags = function(
    namespace,
    tagName)
  {
    var tags = [];
    if (tagName == this.getName() && this.getNamespace() == namespace)
    {
      tags.push(this);
    }

    for (var i = 0, size = this._children.length; i < size; ++i)
    {
      var child = this._children[i];
      var result = child.findTags(namespace, tagName);
      if (result.length > 0)
      {
        tags = tags.concat(result);
      }
    }

    return tags;
  };

  /**
   * Get the children of the tag. Provides for optional filtering of the children
   * namespaces and tag names.
   * @param {(string|null)} namespace the namespace to filter the children by. If
   *        null all the children will be returned.
   * @param {(string|null)} tagName the name of the tag to filter the children by.
   *        Only considered if the namespace parameter is non-null. If null, the
   *        children will not be filtered by tag name.
   * @return {Array.<adf.mf.api.amx.AmxTag>} array of all the matching children tags.
   */
  adf.mf.api.amx.AmxTag.prototype.getChildren = function(
    namespace,
    tagName)
  {
    var result = [];
    for (var i = 0, size = this._children.length; i < size; ++i)
    {
      var child = this._children[i];
      if ((namespace == null || namespace == child.getNamespace()) &&
        (tagName == null || tagName == child.getName()))
      {
        result.push(child);
      }
    }

    return result;
  };

  /**
   * Convenience function to get all of the children facet tags. Meant to assist
   * the creation of the AMX node process.
   * @return {Array.<adf.mf.api.amx.AmxTag>} array of all the facet tags.
   */
  adf.mf.api.amx.AmxTag.prototype.getChildrenFacetTags = function()
  {
    return this.getChildren(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "facet");
  };

  /**
   * Convenience function to get the facet tag with the given name. Meant to assist
   * the code if the presence of a facet changes the behavior of a type handler.
   * @param {string} name the name of the facet to find.
   * @return {(adf.mf.api.amx.AmxTag|null)} the child facet tag or null if none has been
   *         provided with the given name.
   */
  adf.mf.api.amx.AmxTag.prototype.getChildFacetTag = function(name)
  {
    var facetTags = this.getChildren(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "facet");
    for (var i = 0, size = facetTags.length; i < size; ++i)
    {
      var tag = facetTags[i];
      if (tag.getAttribute("name") == name)
      {
        return tag;
      }
    }

    return null;
  };

  /**
   * Convenience function to get all children tags that are UI tags. Meant to assist
   * the creation of the AMX node process. Does not return any facet tags.
   * @return {Array.<adf.mf.api.amx.AmxTag>} array of all the children UI tags.
   */
  adf.mf.api.amx.AmxTag.prototype.getChildrenUITags = function()
  {
    var children = this.getChildren();
    var result = children.filter(
      function(tag, index, array)
      {
        return tag.isUITag();
      });

    return result;
  };

  /**
   * Get all of the defined attribute names for the tag.
   * @return {Array.<string>} all of the attribute names for the attributes that were
   *         specified on the tag.
   */
  adf.mf.api.amx.AmxTag.prototype.getAttributeNames = function()
  {
    var names = [];
    for (var name in this._attr)
    {
      names.push(name);
    }

    return names;
  };

  /**
   * Get if the given attribute is bound to an EL expression.
   * @param {string} name the name of the attribute to check.
   * @return {boolean} true if there is EL in the attribute value or false if the value
   *         is static or if the attribute was not defined.
   */
  adf.mf.api.amx.AmxTag.prototype.isAttributeElBound = function(name)
  {
    return AmxTag.__isELExpression(this.getAttribute(name));
  };

  /**
   * Get the attribute value (may be an EL string) for the attribute of the given name.
   * @param {string} name the name of the attribute
   * @return {string|undefined} the attribute value or undefined if the attribute was not specified.
   *         Returns the expression string for EL attributes.
   */
  adf.mf.api.amx.AmxTag.prototype.getAttribute = function(name)
  {
    return this._attr[name];
  };

  /**
   * Get a k/v pair map of the attributes and their values.
   * @return {Object.<string, value>} map of name to value pairs.
   */
  adf.mf.api.amx.AmxTag.prototype.getAttributes = function()
  {
    return this._attr;
  };

  /**
   * Get if the node is a UI tag with a type handler and renders content.
   * @return {boolean} true if a UI tag
   */
  adf.mf.api.amx.AmxTag.prototype.isUITag = function()
  {
    if (this._uiTag == null)
    {
      // Lazily load the value. This ensures that the tag resources are loaded before we check
      // for a tag handler in case the tag handler is registered inside of a resource.
      var hasTagHandler = adf.mf.internal.amx.AmxTagHandler.__hasTagHandler(this._nsPrefixedName);
      this._uiTag = !hasTagHandler;
    }

    return this._uiTag;
  };

  /**
   * Get the tags for the children of this facet and the name of the facet if this tag
   * is a facet tag. Convenience function for building the AMX node tree.
   * @return {({name:string, children:Array.<adf.mf.api.amx.AmxTag>}|null)} an object with the
   *         name of the facet and the children tags of the facet. Returns null if the tag
   *         is not an AMX facet tag.
   */
  adf.mf.api.amx.AmxTag.prototype.getFacet = function()
  {
    if (this._nsPrefixedName == adf.mf.api.amx.AmxTag.NAMESPACE_AMX+":facet")
    {
      var children = this.getChildren();
      var facetName = this.getAttribute("name");

      return { "name": facetName, "children": children };
    }

    return null;
  };

  /**
   * Create a new instance of an AMX node for this tag given the stamp ID. If the tag
   * is a facet tag, the tag will create the node for the child tag. This function does
   * not initialize the node.
   *
   * @param {(adf.mf.api.amx.AmxNode|null)} parentNode the parent AMX node or null if the
   *        tag/node is the root
   * @param {(Object|null)} key the stamp key to identify the node with the given key. May
   *        be null for non-iterating parent tags.
   * @return {(adf.mf.api.amx.AmxNode|null)} an un-initialized AMX node object or null
   *         for non-UI tags
   */
  adf.mf.api.amx.AmxTag.prototype.buildAmxNode = function(
    parentNode,
    key)
  {
    if (!this.isUITag())
    {
      // Currently do nothing for other non-UI tags, but we should consider adding
      // behaviors and other types of tags in the future to remove the hard-coded nature
      // of processing tags like the AMX setPropertyListener tag.
      return null;
    }

    return new adf.mf.api.amx.AmxNode(parentNode, this, key);
  };

  /**
   * Get the type handler for this tag.
   * @return {Object} the type handler
   */
  adf.mf.api.amx.AmxTag.prototype.getTypeHandler = function()
  {
    if (this._typeHandler === undefined)
    {
      var typeHandler = null;
      if (this._nsPrefixedName)
      {
        typeHandler = adf.mf.api.amx.TypeHandler._instanceDictionary[this._nsPrefixedName];
        if (typeHandler == null)
        {
          var typeHandlerClass = adf.mf.api.amx.TypeHandler._classDictionary[this._nsPrefixedName];
          if (typeHandlerClass != null)
          {
            typeHandler = new typeHandlerClass();
            adf.mf.api.amx.TypeHandler._instanceDictionary[this._nsPrefixedName] = typeHandler;
          }
        }
      }

      if (typeHandler === undefined && adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
      {
        // Could not find an associated TypeHandler.
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.api.amx.AmxTag", "getTypeHandler",
          "Unable to find TypeHandler for namespace = " + this._ns + ", ns prefixed name = " +
          this._nsPrefixedName + ", local name = " + this._name);
      }

      this._typeHandler = typeHandler;
    }

    return this._typeHandler;
  };

  /**
   * Internal function to check if the given value is an EL expression.
   * @param {(string|null)} value the value to check
   * @return {boolean} true if there is EL in the value or false if the value
   *         is static or if the value is null.
   * @ignore
   */
  adf.mf.api.amx.AmxTag.__isELExpression = function(value)
  {
    return value != null && value.indexOf("#{") >= 0;
  };

  /**
   * Get a type handler function (JavaScript class) for the given namespace and name.
   * Primarily used by the test JavaScript files to extend an existing type handler prototype.
   *
   * @param {string} tagNs the tag namespace
   * @param {string} tagName the tag name
   * @return {function} the type handler function if found, otherwise null
   */
  AmxTag.getTypeHandlerFunction = function(tagNs, tagName)
  {
    // Internal usage is for the first param to be the prefixed name
    var nsPrefixedName = arguments.length == 1 ? tagNs : tagNs + ":" + tagName;

    return adf.mf.api.amx.TypeHandler._classDictionary[nsPrefixedName];
  };

})();
/* Copyright (c) 2013, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ---------------- amx-tagInstance.js ------------------ */
/* ------------------------------------------------------ */

(function()
{
  /**
   * @namespace
   */
  adf.mf.internal.amx.AmxTagInstanceStates =
  {
    /** EL based attributes needed for rendering have not been fully loaded yet */
    "WAITING_ON_EL_EVALUATION": 0,
    /** EL attributes have been loaded, the node has not yet been rendered */
    "LOADED": 1
  };

  /**
   * Constructor for a tag instance. The tag instance represents a non-UI tag of an AMX
   * node and store node specific information. In the case of fragments, the tag instance
   * holds onto replaced EL strings that are specific to each individual node.
   *
   * @param {adf.mf.api.amx.AmxNode} parentAmxNode the AMX node that this tag instance
   *        belongs to
   * @param {adf.mf.internal.amx.AmxTagInstance} parentTagInstance the parent tag instance if
   *        nested
   * @param {adf.mf.api.amx.AmxTag} tag the refence to the tag for this instance
   * @constructor adf.mf.internal.amx.AmxTagInstance
   * @augments adf.mf.api.AdfObject
   */
  function AmxTagInstance(
    parentAmxNode,
    parentTagInstance,
    tag)
  {
    this.Init(parentAmxNode, parentTagInstance, tag);
  }

  adf.mf.internal.amx.AmxTagInstance = AmxTagInstance;
  adf.mf.api.AdfObject.createSubclass(adf.mf.internal.amx.AmxTagInstance, adf.mf.api.AdfObject,
    "adf.mf.internal.amx.AmxTagInstance");

  /**
   * Initialize the tag instance. This function will evaluate the EL expressions, storing the
   * cached values into the object so that the values may be retrieved later without EL
   * evaluation. It also sets up the EL dependencies that will be used for data change events
   * to ensure the cached values are kept up to date.
   *
   * @param {adf.mf.api.amx.AmxNode} parentAmxNode the AMX node that this tag instance
   *        belongs to
   * @param {adf.mf.internal.amx.AmxTagInstance} parentTagInstance the parent tag instance if
   *        nested
   * @param {adf.mf.api.amx.AmxTag} tag the refence to the tag for this instance
   */
  adf.mf.internal.amx.AmxTagInstance.prototype.Init = function(
    parentAmxNode,
    parentTagInstance,
    tag)
  {
    AmxTagInstance.superclass.Init.call(this);

    this._parentAmxNode = parentAmxNode;
    this._parentTagInstance = parentTagInstance;
    this._tag = tag;
    this._elAttributeMap = {}; // maps string (attribute name) to ELExpression (attribute value)
    this._tagHandler = adf.mf.internal.amx.AmxTagHandler.__getHandler(
      tag.getNsPrefixedName());

    this._attributesWaitingOnEl = 0;
    this._attributeNamesWaitingOnEl = {};
    this._state = adf.mf.internal.amx.AmxTagInstanceStates["LOADED"];

    // Create a set of the attributes that have their values stored on the tag instance
    this._cachedAttributes = {};

    // A map of the local (cached) attribute values
    this._attrs = {};

    var attrs = tag.getAttributes();
    for (var attrName in attrs)
    {
      var value = attrs[attrName];

      if (attrName != "id" && adf.mf.api.amx.AmxTag.__isELExpression(value))
      {
        var elExpression = adf.mf.internal.el.parser.parse(value);
        var expr = adf.mf.api.amx.AmxNode.__performElSubstitutions(elExpression);
        this._elAttributeMap[attrName] = expr;

        if (this._tagHandler.shouldPrefetchAttribute(attrName, expr))
        {
          var value = adf.mf.internal.amx.evaluateExpression(expr);
          this._attrs[attrName] = value;
          this._cachedAttributes[attrName] = true;
          if (value === undefined)
          {
            this._state = adf.mf.internal.amx.AmxTagInstanceStates["WAITING_ON_EL_EVALUATION"];
            ++this._attributesWaitingOnEl;
            this._attributeNamesWaitingOnEl[attrName] = true;
          }
        }
      }
    }

    this._elDependencies = new adf.mf.internal.amx.AmxElDependencies(this._elAttributeMap);

    this._tagHandler.initializeTagInstance(this);

    this._children = [];

    if (parentTagInstance != null)
    {
      parentTagInstance._children.push(this);
    }
  };

  /**
   * @return {adf.mf.api.amx.AmxNode} get the AMX node that this tag instance belongs to
   */
  adf.mf.internal.amx.AmxTagInstance.prototype.getParentAmxNode = function()
  {
    return this._parentAmxNode;
  };

  /**
   * @return {(adf.mf.internal.amx.AmxTagInstance|null)} get the parent tag instance
   */
  adf.mf.internal.amx.AmxTagInstance.prototype.getParentTagInstance = function()
  {
    return this._parentTagInstance;
  };

  /**
   * @return {adf.mf.api.amx.AmxTag} get the tag for this instance
   */
  adf.mf.internal.amx.AmxTagInstance.prototype.getTag = function()
  {
    return this._tag;
  };

  /**
   * @param {(string|null)} namespace the namespace to filter the children by
   * @param {(string|null)} tagName the tag name to filter the children by (requires namespace to be
   *        provided)
   * @return {Array.<adf.mf.internal.amx.AmxTagInstance>} the children tag instances
   */
  adf.mf.internal.amx.AmxTagInstance.prototype.getChildren = function(
    namespace,
    tagName)
  {
    var children = [];
    for (var i = 0, size = this._children.length; i < size; ++i)
    {
      var child = this._children[i];
      if (namespace != null)
      {
        var tag = child.getTag();
        if ((tagName != null && tagName != tag.getName()) ||
          namespace != tag.getNamespace())
        {
          continue;
        }
      }

      children.push(child);
    }
    return children;
  };

  /**
   * Get an EL expression for an attribute. For fragments, the EL expression will be already
   * replaced.
   *
   * @return {(ELExpression|null)} for EL bound attributes, returns the ELExpression of an attribute.
   *         Returns undefined for attributes that are not EL bound.
   */
  adf.mf.internal.amx.AmxTagInstance.prototype.getAttributeExpression = function(name)
  {
    return this._elAttributeMap[name];
  };

  /**
   * Get an attribute value
   *
   * @param {string} name the name of the attribute to get the value
   * @param {boolean=} evaluateEl if not given, or true EL based attributes will be evaluated. If
   *        false, the EL string will be returned for EL based attributes.
   * @return {(Object|string)} returns the attribute value or the EL expression for the attribute.
   */
  adf.mf.internal.amx.AmxTagInstance.prototype.getAttribute = function(
    name,
    evaluateEl)
  {
    // Default evaluateEl not being passed to a true value
    if (evaluateEl === undefined)
    {
      evaluateEl = true;
    }

    // Check to see if this is an attribute that has its value cached
    if (evaluateEl && this._cachedAttributes[name] == true)
    {
      return this._attrs[name];
    }

    var expr = this.getAttributeExpression(name);
    if (expr == null)
    {
      return this.getTag().getAttribute(name);
    }

    // If not evaluating the EL, return the expression
    return evaluateEl ? adf.mf.internal.amx.evaluateExpression(expr) : expr.getExpression ();
  };

  /**
   * Called from the node when a markNodeForUpdate call is being processed. This is
   * usually called as a result of a data change event.
   *
   * @param {Array.<string>} attributeNames the names of the attributes that should be
   *        updated. Any cached attributes in this array will re-evaluate their EL
   *        values to get the current values.
   */
  adf.mf.internal.amx.AmxTagInstance.prototype.updateAttributes = function(
    attributeNames)
  {
    var oldValues = {};

    for (var a = 0, numAttrs = attributeNames.length; a < numAttrs; ++a)
    {
      var attrName = attributeNames[a];

      if (this._cachedAttributes[attrName] == true)
      {
        var expr = this.getAttributeExpression(attrName);
        var val = adf.mf.internal.amx.evaluateExpression(expr);

        var oldValue = this._attrs[attrName];
        oldValues[attrName] = oldValue;

        this._attrs[attrName] = val;

        // Notify the tag handler that a cached attribute's value has been changed
        this._tagHandler.attributeUpdated(this, attrName, oldValue, val);

        if (val !== undefined && this._attributeNamesWaitingOnEl[attrName])
        {
          delete this._attributeNamesWaitingOnEl[attrName];
          if (--this._attributesWaitingOnEl == 0)
          {
            this._state = adf.mf.internal.amx.AmxTagInstanceStates["LOADED"];
          }
        }
      }
    }
  };

  /**
   * Set a local value for an attribute on a tag instance. Allows type handlers and
   * tag instance handlers to store attributes on a tag instance
   *
   * @param {string} attributeName the name of the attribute
   * @param {Object} value the value to store. If undefined is passed, the attribute
   *        is removed from the cache
   */
  adf.mf.internal.amx.AmxTagInstance.prototype.setAttribute = function(
    attributeName,
    value)
  {
    if (value === undefined)
    {
      delete this._cachedAttributes[attributeName];
      delete this._attrs[attributeName];
    }
    else
    {
      this._cachedAttributes[attributeName] = true;
      this._attrs[attributeName] = value;
    }
  };

  /**
   * Get the EL dependencies of this tag instance
   *
   * @return {adf.mf.internal.amx.AmxElDependencies} EL dependencies object
   */
  adf.mf.internal.amx.AmxTagInstance.prototype.getElDependencies = function()
  {
    return this._elDependencies;
  };

  adf.mf.internal.amx.AmxTagInstance.prototype.getState = function()
  {
    return this._state;
  };
})();
/* Copyright (c) 2013, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ----------------- amx-tagHandler.js ------------------ */
/* ------------------------------------------------------ */

(function()
{

  var handlerClassMap = {};
  var handlerInstanceMap = {};
  /**
   * The base class for handlers of non-UI tags.
   * This class is currently internal and the API is very rudimentary at the moment.
   * @constructor adf.mf.internal.amx.AmxTagHandler
   * @augments adf.mf.api.AdfObject
   */
  function AmxTagHandler()
  {
    this.Init();
  }

  // Make this internal as the API should not be exposed at this time until a full and
  // stable API can be designed.
  adf.mf.internal.amx.AmxTagHandler = AmxTagHandler;
  adf.mf.api.AdfObject.createSubclass(adf.mf.internal.amx.AmxTagHandler, adf.mf.api.AdfObject,
    "adf.mf.internal.amx.AmxTagHandler");

  /**
   * Register a tag handler with a namespace and name.
   * @param {string} namespace the xmlns for the tag
   * @param {string} tagName the name of the tag (no namespace)
   * @param {(adf.mf.internal.amx.AmxTagHandler|null)} precreatedClass optional pre-created class to
   *        register
   * @return {Function} the registered adf.mf.internal.amx.AmxTagHandler subclass
   */
  adf.mf.internal.amx.AmxTagHandler.register = function(
    namespace,
    tagName,
    precreatedClass)
  {
    // make sure that our class is initialized, since we are using a Factory Method
    adf.mf.api.AdfObject.ensureClassInitialization(AmxTagHandler);
    var registeredClass = precreatedClass;

    if (namespace != null && tagName != null)
    {
      if (registeredClass == null)
      {
        // Create the new class and make it inherit from adf.mf.internal.amx.AmxTagHandler:
        registeredClass =
          function RegisteredTagHandler()
          {
            this.Init();
          };

        adf.mf.api.AdfObject.createSubclass(
          registeredClass,
          adf.mf.internal.amx.AmxTagHandler,
          "TagHandler[" + namespace + ":" + tagName + "]");
      }

      // Make the association so we can find the class:
      var id = namespace + ":" + tagName;
      handlerClassMap[id] = registeredClass;
    }
    else // invalid registration, do not register the TagHandler class
    {
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
        "TagHandler.register", "MSG_ERROR_IN_SCRIPT", "adf.mf.internal.amx.AmxTagHandler.register",
        "Invalid TagHandler registration: " + namespace + ", tagName = " + tagName);
    }

    return registeredClass;
  };

  /**
   * Function used by the tag instances to retrieve a tag handler instance.
   *
   * @param {string} nsPrefixedTagName the namespace and tag name separated by a colon
   * @return {(adf.mf.internal.amx.AmxTagHandler|null)} an instance of a tag handler if one
   *         is registered for the given name, otherwise null is returned.
   * @ignore
   */
  adf.mf.internal.amx.AmxTagHandler.__getHandler = function(
    nsPrefixedTagName)
  {
    var instance = handlerInstanceMap[nsPrefixedTagName];

    if (instance == null)
    {
      var cls = handlerClassMap[nsPrefixedTagName];

      if (cls != null)
      {
        instance = new cls();
        handlerInstanceMap[nsPrefixedTagName] = instance;
      }
    }

    return instance;
  };

  /**
   * Check if a tag handler has been specified for the prefixed name. If
   * there is no tag handler, the tag is a UI tag.
   *
   * @param {string} nsPrefixedTagName the namespace then a colon then the tag name
   * @return {boolean} true if there is a registered tag handler
   * @ignore
   */
  adf.mf.internal.amx.AmxTagHandler.__hasTagHandler = function(
    nsPrefixedTagName)
  {
    return AmxTagHandler.__getHandler(nsPrefixedTagName) != null;
  };

  adf.mf.internal.amx.AmxTagHandler.prototype.Init = function()
  {
    AmxTagHandler.superclass.Init.call(this);
  };

  /**
   * Check if the tag attribute with the given EL expression should
   * be pre-fetched during the construction of the tag instance.
   * This ensures that the value is present in the cache when the
   * value should be retrieved. It also ensures that no EL values will
   * be evaluated during rendering.
   *
   * @param {string} attrName the name of the tag attribute
   * @param {string} elExpression the EL expression for the attribute.
   *        In the case of fragments, it will already have been resolved
   *        of any fragment attribute names.
   * @return {boolean} true if the attribute should be evaluated during
   *         tag instance construction
   */
  adf.mf.internal.amx.AmxTagHandler.prototype.shouldPrefetchAttribute = function(
    attrName,
    elExpression)
  {
    // By default pre-fetch all EL bound attribute values
    return true;
  };

  /**
   * Callback after all of the attributes for the tag instance have been
   * fetched. Allows the tag handler to perform any initialization. The base
   * implementation will mark the parent AMX node as waiting on EL evaluation
   * if any of the attributes were not in the EL cache.
   *
   * @param {adf.mf.internal.amx.AmxTagInstance} tagInstance the tag instance
   *        being initialized
   */
  adf.mf.internal.amx.AmxTagHandler.prototype.initializeTagInstance = function(
    tagInstance)
  {
  };

  /**
   * Callback to notify the tag handler that an attribute has been updated on
   * the tag instance. Typically called as a result of a data change event.
   *
   * @param {adf.mf.internal.amx.AmxTagInstance} tagInstance the tag instance
   *        that was updated
   * @param {string} attributeName the name of the attribute that was updated
   * @param {Object} oldValue the old value of the attribute
   * @param {Object} newValue the new value of the attribute
   */
  adf.mf.internal.amx.AmxTagHandler.prototype.attributeUpdated = function(
    tagInstance,
    attributeName,
    oldValue,
    newValue)
  {
    var amxNode = tagInstance.getParentAmxNode();
    if (newValue == undefined && tagInstance.getAttributeExpression(attributeName) != null &&
      amxNode.isReadyToRender())
    {
      amxNode.setState(adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"]);
    }
  };

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ---------------- amx-tagHandlers.js ------------------ */
/* ------------------------------------------------------ */

(function()
{
  // This file houses the built in tag (non-UI) handlers. The tag handlers are currently mostly
  // place holders until a full tag API can be designed.

  var AmxTagHandler = adf.mf.internal.amx.AmxTagHandler;

  // --------- Temporary handlers --------- //
  // Register tag handlers for tags that have no behavior in this file (other tags
  // handle the logic)
  AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "attributeList",
    AmxTagHandler);
  AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "attributeSet",
    AmxTagHandler);
  AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "facet", AmxTagHandler);
  AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "transition", AmxTagHandler);
  AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "loadingIndicatorBehavior",
    AmxTagHandler);
  AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "validationBehavior",
    AmxTagHandler);

  // TODO: introduce a special API for converters. For now, just let them use the default handler
  AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "convertNumber", AmxTagHandler);
  AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "convertDateTime", AmxTagHandler);

  // TODO: introduce an action/behavior tag to process events. For now, use the default
  AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "showPopupBehavior", AmxTagHandler);
  AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "closePopupBehavior", AmxTagHandler);
  // --------- /Temporary handlers --------- //

  // --------- attribute --------- //
  // Tag handler for AMX fragment attributes. Prevent the fetching of the value attribute by default
  // in case the EL points to a method and not a value expression.
  var attributeTagHandler = AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "attribute",
    AmxTagHandler);
  attributeTagHandler.prototype.shouldPrefetchAttribute = function(name)
  {
    return name != "value";
  };
  // --------- /attribute --------- //


  // --------- actionListener --------- //
  // Use a custom tag handler for the actionListener tag to prevent the EL evaluation of the binding
  // attribute during tag instance construction
  var actionListenerTagHandler = AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
    "actionListener");

  actionListenerTagHandler.prototype.shouldPrefetchAttribute = function(name)
  {
    return name != "binding";
  };
  // --------- /actionListener --------- //

  // --------- clientListener --------- //
  var clientListenerTagHandler = AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
    "clientListener");

  clientListenerTagHandler._NON_DOM_EVENT_TYPES = {
    "move": true,
    "rangeChange": true,
    "selection": true,
    "valueChange": true
  };

  clientListenerTagHandler.prototype.initializeTagInstance = function(tagInstance)
  {
    // Get the attribute type. If none is specified assume an action attribute.
    var attrType;
    var type = tagInstance.getAttribute("type");
    if (type != null)
      attrType = adf.mf.internal._getEventTypeResolvedForBidi(type);
    else // use default type
      attrType = "action";

    // Only add types that are DOM events (non-DOM events are already handled):
    if (!clientListenerTagHandler._NON_DOM_EVENT_TYPES[attrType])
    {
      // The parent AMX node will have a list without duplication (map with dummy keys) that indicate
      // which clientListener events the app developer wants the TypeHandler to support.
      var parentAmxNode = tagInstance.getParentAmxNode();
      var clientListenerTypesKey = "data-clientListenerTypes";
      var clientListenerTypes = parentAmxNode.getAttribute(clientListenerTypesKey);
      if (clientListenerTypes == null)
      {
        clientListenerTypes = {};
        parentAmxNode.setAttributeResolvedValue(clientListenerTypesKey, clientListenerTypes);
      }

      clientListenerTypes[attrType] = true;
    }
  };
  // --------- /clientListener --------- //

  // --------- navigationDragBehavior --------- //
  // Use a custom tag handler for the navigationDragBehavior tag to prevent the EL evaluation of the action
  // attribute during tag instance construction
  var navigationDragBehaviorTagHandler = AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
    "navigationDragBehavior");

  navigationDragBehaviorTagHandler.prototype.shouldPrefetchAttribute = function(name)
  {
    return name != "action";
  };
  // --------- /navigationDragBehavior --------- //
  
  // --------- setPropertyListener --------- //
  // Use a custom tag handler for the setPropertyListener tag to prevent the EL evaluation of the
  // attributes during tag instance construction
  var setPropertyListenerTagHandler = AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
    "setPropertyListener");

  setPropertyListenerTagHandler.prototype.shouldPrefetchAttribute = function(name)
  {
    return false;
  };
  // --------- /setPropertyListener --------- //

  // --------- loadBundle --------- //
  // Use a custom tag handler for the loadBundle tag to prevent the EL evaluation of the
  // basename attribute during tag instance construction
  var loadBundleTagHandler = AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
    "loadBundle");

  loadBundleTagHandler.prototype.shouldPrefetchAttribute = function(name)
  {
    return name != "basename";
  };
  // --------- /loadBundle --------- //
  
  // --------- systemActionBehavior --------- //
  // Use a custom tag handler for the systemActionBehavior tag to prevent the EL evaluation of the actionListener
  // and action attributes during tag instance construction
  var systemActionBehaviorTagHandler = AmxTagHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
    "systemActionBehavior");

  systemActionBehaviorTagHandler.prototype.shouldPrefetchAttribute = function(name)
  {
    return (name != "actionListener" && name != "action");
  };
  // --------- /systemActionBehavior --------- //
})();
/* Copyright (c) 2011, 2013, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------ amx-nodeUpdateArguments.js -------------- */
/* ------------------------------------------------------ */

(function()
{
  /**
   * Internal object for the arguments to the markNodeForUpdate function
   * @constructor adf.mf.api.amx.AmxNodeUpdateArguments
   * @augments adf.mf.api.AdfObject
   */
  function AmxNodeUpdateArguments()
  {
    this.Init();
  }

  /**
   * @deprecated
   */
  adf.mf.internal.amx.AmxNodeUpdateArguments = AmxNodeUpdateArguments;

  /*
   * Object for the arguments passed into the adf.mf.api.amx.markNodeForUpdate function.
   */
  adf.mf.api.amx.AmxNodeUpdateArguments = AmxNodeUpdateArguments;

  adf.mf.api.AdfObject.createSubclass(
    adf.mf.api.amx.AmxNodeUpdateArguments,
    adf.mf.api.AdfObject,
    "adf.mf.api.amx.AmxNodeUpdateArguments");

  adf.mf.api.amx.AmxNodeUpdateArguments.prototype.Init = function()
  {
    AmxNodeUpdateArguments.superclass.Init.call(this);
    this._amxNodes = [];
    this._affectedAttributes = {};
    this._collectionChanges = {};
    this._affectedTagInstances = {};
    this._affectedTagInstanceAttributes = {};
    this._canceled = false;
  };

  /**
   * Check if the update has been canceled
   * @return {boolean} true if canceled
   */
  adf.mf.api.amx.AmxNodeUpdateArguments.prototype.isCanceled = function()
  {
    return this._canceled;
  };

  /**
   * Request that the update be canceled. If the update has been queued, calling this function
   * will prevent the update from being executed. This may be used if an asynchronous event has
   * occurred while the update has been queued that makes the update undesirable. If the update
   * has already run or is in progress this function will not have an effect.
   */
  adf.mf.api.amx.AmxNodeUpdateArguments.prototype.cancel = function()
  {
    this._canceled = true;
  };

  /**
   * Get an array of affected AmxNodes
   * @return {Array.<adf.mf.api.amx.AmxNode>} array of nodes
   */
  adf.mf.api.amx.AmxNodeUpdateArguments.prototype.getAffectedNodes = function()
  {
    return this._amxNodes;
  };

  /**
   * Get an object representing the affected attributes for a given AmxNode ID
   * @param {string} amxNodeId the AmxNode ID
   * @return {Object<string, boolean>} an object with the changed
   *         attributes as keys and "true" as the value.
   */
  adf.mf.api.amx.AmxNodeUpdateArguments.prototype.getAffectedAttributes = function(amxNodeId)
  {
    var affected = this._affectedAttributes[amxNodeId];
    return affected == null ? {} : affected;
  };

  /**
   * Get the collection changes for a given AmxNode and property
   * @param {string} amxNodeId the AmxNode ID
   * @return {(Object<string, adf.mf.api.amx.AmxCollectionChange>|undefined)} an object with the
   *         attributes as keys and the collection change objects for the values. May
   *         be undefined if there are no changes for a given AmxNode
   */
  adf.mf.api.amx.AmxNodeUpdateArguments.prototype.getCollectionChanges = function(amxNodeId)
  {
    return this._collectionChanges[amxNodeId];
  };

  /**
   * Mark an attribute of an AmxNode as affected
   * @param {adf.mf.api.amx.AmxNode} amxNode the affected AmxNode
   * @param {string} attributeName the name of the affected attribute
   */
  adf.mf.api.amx.AmxNodeUpdateArguments.prototype.setAffectedAttribute = function(
    amxNode,
    attributeName)
  {
    var amxNodeId = amxNode.getId();
    var affected = this._affectedAttributes[amxNodeId];
    if (affected == null)
    {
      affected = {};
      this._affectedAttributes[amxNodeId] = affected;

      // Mark the node dirty if it hasn't already
      if (this._affectedTagInstances[amxNode] == null)
      {
        this._amxNodes.push(amxNode);
      }
    }

    affected[attributeName] = true;
  };

  /**
   * Set the collection changes for a given AmxNode's attribute
   * @param {string} amxNodeId the AMX node ID
   * @param {string} attributeName the name of the attribute that the collection had changes
   * @param {adf.mf.api.amx.AmxCollectionChange} collectionChanges the changes for the collection
   */
  adf.mf.api.amx.AmxNodeUpdateArguments.prototype.setCollectionChanges = function(
    amxNodeId,
    attributeName,
    collectionChanges)
  {
    var obj = this._collectionChanges[amxNodeId];
    if (obj == null)
    {
      obj = {};
      this._collectionChanges[amxNodeId] = obj;
    }

    obj[attributeName] = collectionChanges;
  };

  /**
   * Internal function to get a list of affected tag instance IDs for a given AMX node.
   *
   * @param {string} amxNodeId the AMX node ID
   * @return {Array.<string>} IDs of the affected tag instances. Will return an empty array if
   *         there are not IDs.
   * @ignore
   */
  adf.mf.api.amx.AmxNodeUpdateArguments.prototype.__getAffectedTagInstanceIds = function(
    amxNodeId)
  {
    var affected = this._affectedTagInstances[amxNodeId];
    return affected == null ? [] : affected;
  };

  /**
   * Internal function to get the affected attribute names for an AMX node and its tag instance ID
   *
   * @param {string} amxNodeId the ID of the affected AMX node
   * @param {string} amxTagId the ID of the affected AMX tag ID
   * @return {Array.<string>} array of affected attributes. Will return an empty array if there are
   *         none.
   * @ignore
   */
  adf.mf.api.amx.AmxNodeUpdateArguments.prototype.__getAffectedAttributesForTagInstance = function(
    amxNodeId,
    amxTagId)
  {
    var key = amxNodeId + "/" + amxTagId;
    var affected = this._affectedTagInstanceAttributes[key];
    return affected == null ? [] : affected;
  };

  /**
   * Internal function to mark a tag's attribute as dirty
   *
   * @param {adf.mf.internal.amx.AmxTagInstance} tagInstance the affected tag instance
   * @param {string} attributeName the name of the affected attribute
   * @ignore
   */
  adf.mf.api.amx.AmxNodeUpdateArguments.prototype.__setAffectedAttributeForTagInstance = function(
    tagInstance,
    attributeName)
  {
    var amxNode = tagInstance.getParentAmxNode();
    var amxTagId = tagInstance.getTag().getAttribute("id");
    var amxNodeId = amxNode.getId();
    var affectedTagInstanceIds = this._affectedTagInstances[amxNodeId];

    // Mark the instance dirty
    if (affectedTagInstanceIds == null)
    {
      affectedTagInstanceIds = [ amxTagId ];
      this._affectedTagInstances[amxNodeId] = affectedTagInstanceIds;

      // Mark the node dirty if it has not already
      if (this._affectedAttributes[amxNodeId] == null)
      {
        this._amxNodes.push(amxNode);
      }
    }
    else if (affectedTagInstanceIds.indexOf(amxTagId) == -1)
    {
      // Mark the instance as dirty
      affectedTagInstanceIds.push(amxTagId);
    }

    // Mark the attribute dirty
    var key = amxNodeId + "/" + amxTagId;

    var affectedAttributes = this._affectedTagInstanceAttributes[key];

    if (affectedAttributes == null)
    {
      this._affectedTagInstanceAttributes[key] = [ attributeName ];
    }
    else if (affectedAttributes.indexOf(attributeName) == -1)
    {
      affectedAttributes.push(attributeName);
    }
  };

})();
/* Copyright (c) 2013, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------------- amx-node.js ---------------------- */
/* ------------------------------------------------------ */

(function()
{
  var nodeToElMap = {};

  // ------ AMX Node ------ //
  /**
   * AMX node definition. The AMX node constructor is private and only the framework
   * may create new node objects.
   * (parameters TBD)
   * @constructor adf.mf.api.amx.AmxNode
   * @augments adf.mf.api.AdfObject
   */
  function AmxNode(
    parentNode,
    tag,
    key)
  {
    this.Init(parentNode, tag, key);
  }

  adf.mf.api.amx.AmxNode = AmxNode;
  adf.mf.api.AdfObject.createSubclass(adf.mf.api.amx.AmxNode, adf.mf.api.AdfObject,
    "adf.mf.api.amx.AmxNode");

  AmxNode.prototype.Init = function(
    parentNode,
    tag,
    key)
  {
    AmxNode.superclass.Init.call(this);

    this._tag = tag;
    this._parent = parentNode;
    this._children = {};
    this._facets = {};
    this._attr = {};
    this._modifiableEl = {};
    this._key = key === undefined ? null : key;
    this._state = adf.mf.api.amx.AmxNodeStates["INITIAL"];
    this._childrenCreated = false;
    this._id = null;
    this._converterTag = null;
    this._converter = null;
    this._elDependencies = null;
    this._elAttributeMap = null;

    // Store the tag instances for all children non-UI tags
    this._tagInstances = null;

    // Variables to track what EL is not yet cached that is required
    this._tagInstancesWaitingOnEl = 0;
    this._tagInstanceIdsWaitingOnEl = {};
    this._attributesWaitingOnEl = 0;
    this._attributeNamesWaitingOnEl = {};

    // Increment the number of nodes waiting
    adf.mf.internal.amx._pageBusyTracker.increment();
  };

  /**
   * Get the unique identifier for this node. This is used as the ID on the root HTML element
   * rendered by this node.
   */
  AmxNode.prototype.getId = function()
  {
    return this._id;
  };

  /**
   * Get the AMX tag that created this node.
   * @return {adf.mf.api.amx.AmxTag} the tag that created the node
   */
  AmxNode.prototype.getTag = function()
  {
    return this._tag;
  };

  /**
   * Get the type handler for this node.
   * @return {Object} the type handler
   */
  AmxNode.prototype.getTypeHandler = function()
  {
    return this.getTag().getTypeHandler();
  };

  /**
   * Fetches the client state for this AMX node based on its ID that was previously stored.
   * TypeHandlers would call this to retrieve old state in render(), refresh(), or postDisplay().
   * @return {Object} undefined or the client state data that was previously stored in this view instance
   */
  AmxNode.prototype.getClientState = function()
  {
    var amxNodeId = this.getId();
    var stateValue = adf.mf.internal.amx._getClientStateMap();
    if (amxNodeId == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_ASSOCIATING_CLIENT_STATE",
	  			amxNodeId));
    }
    else if (stateValue == null)
    {
      // The client side state map may not be available if this call is performed on a view that
      // is being destroyed. For example, when a task flow return has been executed, the map will
      // be set to null until the new page context has been setup
      if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINE))
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINE,
          "adf.mf.api.amx.AmxNode", "getClientState",
          "State not able to be retrieved, client state map is not available for AmxNode " +
          amxNodeId);
      }
      return undefined;
    }
    else
    {
      var payloadJsonObject = stateValue[amxNodeId];
      return payloadJsonObject;
    }
  };

  /**
   * Stores/replaces the client state for this AMX node based on its ID (if the ID changes, you won't
   * get the same data).
   * Preferrably, TypeHandler functions would call this whenever a state change happens (i.e. something
   * you want to cache so that when the user navigates to a new page and later comes back, you will be
   * able to restore it like a scroll position).
   * However, it is not always feasible to detect when a state change happens so you may need
   * to update the state for your component just before the view is going to be
   * discarded. There are 2 possible scenarios that you will need to account for:
   * - Renderer refresh() (for navigating to the same view again)
   * - Renderer preDestroy() (for navigating to a new view and navigating back at a later time)
   * @param {String} amxNodeId the amxNode.id that uniquely identifies the stored data
   * @param {Object} payloadJsonObject the client state data to store for the lifetime of this view instance
   */
  AmxNode.prototype.setClientState = function(payloadJsonObject)
  {
    var amxNodeId = this.getId();
    var stateValue = adf.mf.internal.amx._getClientStateMap();
    if (amxNodeId == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_ASSOCIATING_CLIENT_STATE",
	  			amxNodeId));
    }
    else if (stateValue == null)
    {
      // The client side state map may not be available if this call is performed on a view that
      // is being destroyed. For example, when a task flow return has been executed, the map will
      // be set to null until the new page context has been setup
      if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINE))
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINE,
          "adf.mf.api.amx.AmxNode", "setClientState",
          "State not being saved, client state map is not available for AmxNode " + amxNodeId);
      }
    }
    else
    {
      stateValue[amxNodeId] = payloadJsonObject;
    }
  };

  /**
   * Fetches the volatile state for this AMX node based on its ID that was previously stored.
   * TypeHandlers would call this to retrieve old state in render(), refresh(), or postDisplay().
   * @return {Object} undefined or the volatile state data that was previously stored since the last navigation
   */
  AmxNode.prototype.getVolatileState = function()
  {
    var amxNodeId = this.getId();
    var stateValue = adf.mf.internal.amx._getVolatileStateMap();
    if (amxNodeId == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_ASSOCIATING_VOLATILE_STATE",
	  			amxNodeId));
    }
    else if (stateValue == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_VOLATILE_STATE_NOT_AVAILABLE",
	  			stateValue));
    }
    else
    {
      var payloadJsonObject = stateValue[amxNodeId];
      return payloadJsonObject;
    }
  };

  /**
   * Stores/replaces the AMX volatile state for the specified AMX node ID.
   * Preferrably, renderers would call this whenever a volatile state change happens (i.e. something you want
   * to forget when navigating to a new AMX page but might want to keep around in case a component gets redrawn.
   * @param {Object} payloadJsonObject the volatile state data to store until navigation
   */
  AmxNode.prototype.setVolatileState = function(payloadJsonObject)
  {
    var amxNodeId = this.getId();
    var stateValue = adf.mf.internal.amx._getVolatileStateMap();
    if (amxNodeId == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_ASSOCIATING_VOLATILE_STATE",
	  			amxNodeId));
    }
    else if (stateValue == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_VOLATILE_STATE_NOT_AVAILABLE",
	  			stateValue));
    }
    else
    {
      stateValue[amxNodeId] = payloadJsonObject;
    }
  };

  /**
   * Get the converter, if set, for this node.
   */
  AmxNode.prototype.getConverter = function()
  {
    return this._converter;
  };

  /**
   * Set the converter for this node.
   */
  AmxNode.prototype.setConverter = function(converter)
  {
    this._converter = converter;
  };

  /**
   * For an attribute, create and store an EL expression that may be used to set EL values
   * into the model. The value is context insensitive and may be used to set a value at any
   * time. Common use is to set a value based on user interaction. May be called by type
   * handlers.
   *
   * @param {string} name the name of the attribute
   * @return {(string|null)} the modifyable EL. Also stored on the node. Returns null if the
   *         attribute in question is not bound to an EL value.
   */
  AmxNode.prototype.storeModifyableEl = function(name)
  {
    var tag = this.getTag();
    if (tag.isAttributeElBound(name))
    {
      var el = this.getAttributeExpression(name, false, true);
      el = el.toContextFreeExpression();
      this._modifiableEl[name] = el;
      return el;
    }
    else
    {
      return null;
    }
  };

  /**
   * Initializes the node, performing any EL evaluation and any other pre-render logic.
   * Called by the framework. It is expected for the state to be WAITING_ON_EL_EVALUATION,
   * ABLE_TO_RENDER or UNRENDERED after invoking this function. This function also creates
   * the children AMX nodes once the status is WAITING_ON_EL_EVALUATION, but does not
   * initialize them.
   */
  AmxNode.prototype.init = function()
  {
    var perf = adf.mf.internal.perf.startMonitorCall("Initialize AMX node", adf.mf.log.level.FINEST, null);
    var state = this.getState();
    var tag = this.getTag();
    var attr = tag.getAttributes();
    var name = null;

    try
    {
      // Create a unique ID that is based on the stamped key, if present.
      this._createUniqueId();
      
      // Set Call instance name after unique id has been created
      var instanceName = tag.getName() + ":" + this.getId();
      perf.setInstanceName(instanceName);

      // TODO: although no types currently need to customize how attributes
      // are loaded, we really need a method to allow the type handlers to
      // control what attributes are processed and how they are processed.
      // Due to time constraints and the desire to make sure the API is solid,
      // it is not being added at this time.

      // Process the rendered attribute if we haven't already
      var cacheMiss = this._processAttribute("rendered");

      if (cacheMiss)
      {
        // Ensure the state is still INITIAL so that the building
        // of the node hierarchy does not continue
        this.setState(adf.mf.api.amx.AmxNodeStates["INITIAL"]);

        // At this time, only setup the data change events for the rendered attribute
        this._registerRenderedAttributeForDataChange();

        return;
      }

      if (!this.getAttribute("rendered"))
      {
        if (this.getAttributeExpression("rendered") != null)
        {
          // Hookup data change events on the rendered attribute when EL bound
          this._registerRenderedAttributeForDataChange();
        }

        // Update the state
        this.setState(adf.mf.api.amx.AmxNodeStates["UNRENDERED"]);
        return;
      }

      for (name in attr)
      {
        // ID and rendered attributes have already been processed
        if (name == "rendered" || name == "id")
        {
          continue;
        }

        this._processAttribute(name);
      }

      // Now, look for a converter tag
      this._processConverterTag();

      // Update the state to reflect if all the EL is available
      this.setState(this._tagInstancesWaitingOnEl == 0 &&
        this._attributesWaitingOnEl == 0 ?
        adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"] :
        adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"]);

      state = this.getState();
      if (state == adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"] ||
        state == adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"])
      {
        // Once all the necessary EL has been loaded, create the children nodes,
        // but do not initialize them
        this._createChildren();

        state = this.getState();
        if (state == adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"] ||
          state == adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"])
        {
          if (this._processConverter())
          {
            this._convertValue();
          }
        }
      }

      // Setup validation of the input value of this node if there is one
      this._setupInputValueValidation();

      // Finally hook up the data change events
      this._elDependencies = new adf.mf.internal.amx.AmxElDependencies(
        this._getAttributesExpressionMap());
      this._postProcessForDataChangeNotification(true);
    }
    finally
    {
      perf.stop();
    }
  };

  /**
   * Get the stamp key for the AMX node. The stamp key identifies AMX nodes that are produced inside of
   * iterating containers. This is provided by the parent node. An example tag that uses stamp keys is
   * the AMX iterator tag.
   * @return {(Object|null)} the key or null if the node was not stamped
   */
  AmxNode.prototype.getStampKey = function()
  {
    return this._key;
  };

  /**
   * Get a list of the attribute names that have been defined for this node.
   * @return {Array.<string>} array of the attribute names
   */
  AmxNode.prototype.getDefinedAttributeNames = function()
  {
    var names = [];
    for (var name in this._attr)
    {
      names.push(name);
    }
    return names;
  };

  /**
   * Gets an attribute value for the attribute of the given name.
   * @param {string} name the name of the attribute
   * @return {(Object|null|undefined)} returns the value (may be null) or
   *         undefined if the attribute is not set or is not yet loaded.
   */
  AmxNode.prototype.getAttribute = function(name)
  {
    return this._attr[name];
  };

  /**
   * Given the name of an attribute, get the EL expression.
   *
   * @param {string} name the name of the attribute
   * @param {boolean=} returnStaticValue if true and the attribute is not EL bound, the string
   *        value of the attribute from the tag will be returned or undefined if the attribute is
   *        not defined on the tag
   * @param {boolean} returnEL if true, the ELExpression value of the attribute from the tag
   *        will be returned or undefined if the attribute is not defined on the tag.
   *        If false, it will return String representation of EL Expression.
   * @return {(string|null)} the EL expression if the attribute is EL bound, otherwise null.
   */
  AmxNode.prototype.getAttributeExpression = function(
    name,
    returnStaticValue,
    returnEL)
  {
    var tag = this.getTag();

    // See if this attribute is an EL expression
    if (!tag.isAttributeElBound(name))
    {
      return (returnStaticValue === true) ? tag.getAttribute(name) : null;
    }

    var expr;
    if (this.elAttributeMap != null)
    {
      expr = this.elAttributeMap[name];
      if (expr != null)
      {
        return returnEL ? expr: expr.getExpression();
      }
    }

    var value = tag.getAttribute(name);

    var expr = adf.mf.internal.el.parser.parse(value);
    expr = AmxNode.__performElSubstitutions(expr);

    if (expr != null)
    {
      if (this.elAttributeMap == null)
      {
        this.elAttributeMap = {};
      }

      this.elAttributeMap[name] = expr;
    }

    return returnEL ? expr : expr.getExpression();
  };

  /**
   * Used by the type handler or the framework to store the attribute value for an attribute onto
   * the node. This function does not update the model.
   * @param {string} name the name of the attribute
   * @param {object} value the value of the attribute
   */
  AmxNode.prototype.setAttributeResolvedValue = function(name, value)
  {
    this._attr[name] = value;
  };

  /**
   * For use by type handlers to set the value of an attribute on the model. This value will be sent
   * to the Java side to update the EL value. The value on the AMX node will not be updated by this
   * call, it is expected that a data change event will result to update the AMX node.
   * @param {string} name the name of the attribute
   * @param {object} value the new value of the attribute
   */
  AmxNode.prototype.setAttribute = function(name, value)
  {
    var that = this;
    return new adf.mf.internal.BasePromise(
      function(resolve, reject)
      {
        var el = that._modifiableEl[name];

        if (el == null)
        {
          var tag = that.getTag();

          // If the EL is null, then this will not work if the node is
          // not in context. Try to set the EL using the raw EL from the tag
          //
          // First, ensure the attribute is EL bound
          if (tag.isAttributeElBound(name))
          {
            el = that.getTag().getAttribute(name);
          }
        }

        that.setAttributeResolvedValue(name, value);

        if (el == null)
        {
          // If this attribute was not EL based, just resolve the promise
          resolve();
        }
        else
        {
          var oldValue = that.getAttribute(name);
          var p = {"name": el, "value": value};
          if (!el.indexOf) {
              p["name"] = el.getExpression();
              p["expression"] = el;
          }
          amx.setElValue(p)
            .then(
              function()
              {
                resolve();
              },
              function()
              {
                that.setAttributeResolvedValue(name, oldValue);
              });
        }
      }); // TODO We do not want to support/document that this returns a promise object resolved once the
          //      value has been set. Instead, we ought to provide success/failed callbacks as parameters.
  };

  /**
   * Check if the attribute has been specified.
   * @param {string} name the name of the attribute
   * @return {boolean} true if the attribute was defined by the user
   */
  AmxNode.prototype.isAttributeDefined = function(name)
  {
    return this._tag.getAttribute(name) !== undefined;
  };

  /**
   * Get the parent AMX node.
   * @return {(adf.mf.api.amx.AmxNode|null)} the parent node or null for the top level
   *         node.
   */
  AmxNode.prototype.getParent = function()
  {
    return this._parent;
  };

  /**
   * Adds a child AMX node to this node. Should only be called by the framework or the type handler.
   * @param {adf.mf.api.amx.AmxNode} child the child to add
   * @param {(string|null)} facetName the name of the facet or null if the child does not belong in a
   *        facet.
   */
  AmxNode.prototype.addChild = function(child, facetName)
  {
    var key = child.getStampKey();
    var children;
    if (facetName == null)
    {
      children = this._children[key];
      if (children == null)
      {
        this._children[key] = children = [];
      }
    }
    else
    {
      var facets = this._facets[key];
      if (facets == null)
      {
        facets = this._facets[key] = {};
      }
      children = facets[facetName];
      if (children == null)
      {
        facets[facetName] = children = [];
      }
    }

    children.push(child);
  };

  /**
   * Remove a child node from this node. Note that the AMX node will be removed from the hierarchy,
   * but not the DOM for that node. It is up to the caller to remove the DOM. This is to allow
   * type handlers to handle animation and other transitions when DOM is replaced.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the node to remove
   * @return {boolean} true if the node was found and removed.
   */
  AmxNode.prototype.removeChild = function(amxNode)
  {
    var key = amxNode.getStampKey();
    var nodeId = amxNode.getId();
    var state = amxNode.getState();
    var result = this._findChildIndexAndFacetName(key, nodeId);

    if (result == null)
    {
      return false;
    }

    amxNode._removeFromDataChangeNotification(true);

    var facetName = result["facetName"];
    var childrenArray = null;
    var index = result["index"];

    if (facetName == null)
    {
      childrenArray = this._children[key];
    }
    else
    {
      childrenArray = this._facets[key][facetName];
    }

    // Splice updates the array in place
    childrenArray.splice(index, 1);

    // If the state of the child was not resolved, decrement the node waiting count
    switch (state)
    {
      case adf.mf.api.amx.AmxNodeStates["INITIAL"]:
      case adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"]:
      case adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"]:
        adf.mf.internal.amx._pageBusyTracker.decrement();
        break;
    }

    return true;
  };

  /**
   * Removes any children that are present with the given stamp key
   * @param {object} stampKey the key to use to find the nodes
   * @return {Array.<adf.mf.api.amx.AmxNode>} array of the nodes removed
   */
  AmxNode.prototype.removeChildrenByKey = function(
    stampKey)
  {
    var removed = [];

    // Note, slice used to create a copy so it will not be modified during changes
    var children = this.getChildren(null, stampKey).slice();

    for (var c = 0, numChildren = children.length; c < numChildren; ++c)
    {
      var child = children[c];
      if (this.removeChild(child))
      {
        removed.push(child);
      }
    }

    return removed;
  };

  /**
   * Replace a child node with a new node.
   * @param {adf.mf.api.amx.AmxNode} oldNode the node to replace
   * @param {adf.mf.api.amx.AmxNode} newNode the replacement node
   * @return {boolean} true if the old node was found and replaced.
   */
  AmxNode.prototype.replaceChild = function(
    oldNode,
    newNode)
  {
    var key = oldNode.getStampKey();
    var nodeId = oldNode.getId();
    var result = this._findChildIndexAndFacetName(key, nodeId);
    if (result == null)
    {
      return false;
    }

    oldNode._removeFromDataChangeNotification(true);

    var facetName = result["facetName"];
    if (facetName == null)
    {
      this._children[key][result["index"]] = newNode;
    }
    else
    {
      var facetChildren = this._facets[key][facetName];
      facetChildren[result["index"]] = newNode;
    }

    return true;
  };

  /**
   * Get the children AMX nodes.
   * @param {(string|null|undefined)} facetName the name of the facet to retrieve the children
   *        or null to get the non-facet children.
   * @param {(Object|null|undefined)} key An optional key to specify for stamping. If provided, it will retrieve
   *        the children AMX nodes for a given stamping key.
   * @return {Array.<adf.mf.api.amx.AmxNode>} an array of the children AMX nodes. Returns an empty array
   *         if no children exist or if there are no children for the given stamp key.
   */
  AmxNode.prototype.getChildren = function(facetName, key)
  {
    if (key === undefined)
    {
      key = null;
    }

    var children;
    if (facetName == null)
    {
      children = this._children[key];
    }
    else
    {
      var facets = this._facets[key];
      if (facets == null)
      {
        return [];
      }

      children = facets[facetName];
    }

    return children == null ? [] : children;
  };

  /**
   * Get all of the facets of the AMX node.
   * @param {(Object|null|undefined)} key An optional key to specify for stamping. If provided, it will retrieve
   *        the facet AMX nodes for a given stamping key.
   * @return {Object.<string, Array.<adf.mf.api.amx.AmxNode>>} map of facets defined for the node
   */
  AmxNode.prototype.getFacets = function(key)
  {
    if (key === undefined)
    {
      key = null;
    }

    var facets = this._facets[key];
    return facets == null ? {} : facets;
  };

  /**
   * Perform a tree visitation starting from this node.
   * @param {adf.mf.api.amx.VisitContext} context the visit context
   * @param {Function} callback the callback function to invoke when visiting. Should accept
   *        the context and the node as arguments
   * @return {boolean} true if the visitation is complete and should not continue.
   */
  AmxNode.prototype.visit = function(
    context,
    callback)
  {
    var th = this.getTypeHandler();
    if (adf.mf.internal.amx.implementsFunction(th, "visit"))
    {
      return th.visit(this, context, callback);
    }

    if (context.isVisitAll() || context.getNodesToVisit().indexOf(this) >= 0)
    {
      var result = callback(context, this);
      switch (result)
      {
        case adf.mf.api.amx.VisitResult["ACCEPT"]:
          return this.visitChildren(context, callback);

        case adf.mf.api.amx.VisitResult["REJECT"]:
          return false;

        case adf.mf.api.amx.VisitResult["COMPLETE"]:
        default:
          return true;
      }
    }

    return this.visitChildren(context, callback);
  };

  /**
   * Perform a tree visitation of the children of the node.
   * @param {adf.mf.api.amx.VisitContext} context the visit context
   * @param {Function} callback the callback function to invoke when visiting. Should accept
   *        the context and the node as arguments
   * @return {boolean} true if the visitation is complete and should not continue.
   */
  AmxNode.prototype.visitChildren = function(
    context,
    callback)
  {
    var th = this.getTypeHandler();
    if (adf.mf.internal.amx.implementsFunction(th, "visitChildren"))
    {
      return th.visitChildren(this, context, callback);
    }

    return this.visitStampedChildren(null, null, null,
      context, callback);
  };

  /**
   * Convenience function for type handlers that stamp their children to
   * visit the children AMX nodes from inside of a custom visitChildren
   * function.
   *
   * @param {object} key the stamp key of the children to visit.
   * @param {(Array.<string>|null)} facetNamesToInclude list of facet names to visit.
   *        If empty the facets will not be processed for this
   *        stamp. If null, all the facets will be processed. To visit the children of
   *        non-facets, include null in the array.
   * @param {(function|null)} filterCallback an optional function to filter the children
   *        to visit. The function will be invoked with this node,
   *        the stamp key, and the child node.
   *        Function must return a boolean. If true, the tag will be used to create
   *        children, if false the tag will not be processed.
   * @param {adf.mf.api.amx.VisitContext} context the visit context
   * @param {Function} callback the callback function to invoke when visiting. Should accept
   *        the context and the node as arguments
   * @return {boolean} true if the visitation is complete and should not continue.
   */
  AmxNode.prototype.visitStampedChildren = function(
    key,
    facetNamesToInclude,
    filterCallback,
    visitContext,
    visitCallback)
  {
    var visitAll = visitContext.isVisitAll();
    var nodesToWalk = visitContext.getNodesToWalk();

    var facetNames;
    if (facetNamesToInclude == null)
    {
      facetNames = [];
      var facets = this.getFacets(key);
      for (var name in facets)
      {
        facetNames.push(name);
      }
      facetNames.push(null);
    }
    else
    {
      facetNames = facetNamesToInclude;
    }

    for (var f = 0, numFacets = facetNames.length; f < numFacets; ++f)
    {
      var facetName = facetNames[f];
      var children = this.getChildren(facetName, key);
      // Loop through all the children, note if the facet name is null
      // then we are visiting the direct (non-facet) children.
      for (var i = 0, size = children.length; i < size; ++i)
      {
        var child = children[i];
        // See if we are visiting all or if the node is one to be visited
        if (visitAll || nodesToWalk.indexOf(child) >= 0)
        {
          // If there is a filter function, call it to see if this node
          // should be visited
          if (filterCallback == null ||
            filterCallback(this, key, child))
          {
            if (child.visit(visitContext, visitCallback))
            {
              return true;
            }
          }
        }
      }
    }

    return false;
  };

  /**
   * Get the rendered children of the AMX node.
   * @param {(string|null)} facetName the name of the facet to retrieve the rendered children for
   *        or null to get the rendered children outside of the facets.
   * @param {(Object|null)} key An optional key to specify for stamping. If provided, it will
   *        retrieve the children AMX nodes for a given stamping key.
   * @return {Array.<adf.mf.api.amx.AmxNode>} the children that should be rendered for the given
   *         stamp key. This function will flatten any flattenable components and will not return
   *         any non-rendered nodes.
   */
  AmxNode.prototype.getRenderedChildren = function(facetName, key)
  {
    var result = [];
    var children = this.getChildren(facetName, key);

    for (var i = 0, size = children.length; i < size; ++i)
    {
      var vc = new adf.mf.api.amx.VisitContext();
      var child = children[i];

      child.visit(vc,
        function (context, node)
        {
          if (!node.isReadyToRender())
          {
            return adf.mf.api.amx.VisitResult["REJECT"];
          }

          // Skip over any flattened nodes. Note that this means that the type handler
          // will never be called for preDestroy and destroy as those functions are currently
          // based on DOM nodes, not AMX nodes.
          if (node.isFlattenable())
          {
            // To support the functionality of amx:facetRef, use a "__getRenderedChildren" method
            // to allow the facet reference to resolve the children to be rendered as the children
            // of the fragment facet tag. The "__" prefix is used as this should not be consumed
            // by 3rd party type handlers, it is specifically for internal use only.
            var th = node.getTypeHandler();
            if (adf.mf.internal.amx.implementsFunction(th, "__getRenderedChildren"))
            {
              var nodes = th.__getRenderedChildren(node);
              result.push.apply(result, nodes);
              return adf.mf.api.amx.VisitResult["REJECT"];
            }

            return adf.mf.api.amx.VisitResult["ACCEPT"];
          }

          result.push(node);
          return adf.mf.api.amx.VisitResult["REJECT"];
        });
    }

    return result;
  };

  /**
   * Get if the node is flattenable. A flattened node produces no HTML but instead provides
   * information to the parent or about how the children should be handled. Allows for customizing
   * the creation of children nodes as well.
   *
   * @return {boolean} true if the node is flattenable
   */
  AmxNode.prototype.isFlattenable = function()
  {
    var th = this.getTypeHandler();
    return adf.mf.internal.amx.implementsFunction(th, "isFlattenable") && th.isFlattenable(this);
  };

  /**
   * Get the current state of the node.
   * @return {int} the current state, as a constant value from adf.mf.api.amx.AmxNodeStates.
   */
  AmxNode.prototype.getState = function()
  {
    return this._state;
  };

  /**
   * Moves the state of the node. Should only be called by the framework or the node's type handler.
   * @param {int} state the new state of the node
   */
  AmxNode.prototype.setState = function(state)
  {
    var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);

    if (isFinestLoggingEnabled)
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "adf.mf.api.amx.AmxNode", "setState",
        "Setting state of AmxNode " + this.getId() + " to " +
        adf.mf.api.amx.AmxNodeStates.getLabelForValue(state));
    }

    switch (state)
    {
      case adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"]:
      case adf.mf.api.amx.AmxNodeStates["INITIAL"]:
      case adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"]:
      {
        switch (this._state)
        {
          case adf.mf.api.amx.AmxNodeStates["UNRENDERED"]:
          case adf.mf.api.amx.AmxNodeStates["RENDERED"]:
          case adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]:
          {
            // The node was "resolved" but now will be waiting on a condition. Mark the node as
            // being in a pending state
            adf.mf.internal.amx._pageBusyTracker.increment();
            break;
          }
        }
        break;
      }
      default:
      {
        switch (this._state)
        {
          case adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"]:
          case adf.mf.api.amx.AmxNodeStates["INITIAL"]:
          case adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"]:
          {
            // The node was waiting on a condition but now is "resolved"
            adf.mf.internal.amx._pageBusyTracker.decrement();
            break;
          }
        }
        break;
      }
    }
    this._state = state;
  };

  /**
   * @deprecated use render instead
   */
  AmxNode.prototype.renderNode = function()
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "renderNode", "MSG_DEPRECATED", "amxNode.renderNode", "amxNode.render");

    var renderResult = this.render();
    return renderResult;
  };

  /**
   * Render the AmxNode.
   * @return {(HTMLElement|null)} the root HTML element for this AmxNode or null if there is no type handler for this node
   */
  AmxNode.prototype.render = function()
  {
    var domNode = null;

    // facet are not rendered as they should be handled by the parent
    var tag = this.getTag();
    if (tag.isUITag())
    {
      // if there are a "rendered" property set to false, then, we do not render
      if (this.getAttribute("rendered") === false)
      {
        // domNode will be null
      }
      else
      {
        var nodeTypeHandler = this.getTypeHandler();

        // if renderer found
        if (adf.mf.internal.amx.implementsFunction(nodeTypeHandler, "render"))
        {
          var id = this.getId();
          if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
          {
            adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
              "adf.mf.api.amx.AmxNode", "renderNode",
              "Rendering AmxNode " + id);
          }

          domNode = nodeTypeHandler.render(this, id);

          // render the AmxNode
          try
          {
            domNode.setAttribute("id", id);
          }
          catch (ex)
          {
            adf.mf.log.logInfoResource("AMXInfoBundle",
              adf.mf.log.level.SEVERE, "renderNode", "MSG_CREATE_FAILED",
              this.getTag().getNsPrefixedName(), ex);
            return null;
          }

          try
          {
            // Add this AmxNode to init and post display queues
            if (adf.mf.internal.amx.implementsFunction(nodeTypeHandler, "init"))
            {
              amx.queueForInit(this);
            }
            if (adf.mf.internal.amx.implementsFunction(nodeTypeHandler, "postDisplay"))
            {
              amx.queueForPostDisplay(this);
            }

            adf.mf.internal.amx._setNonPrimitiveElementData(domNode, "amxNode", this);

            // add the amx classes
            domNode.classList.add("amx-node");
            if (tag._rootClassName == null)
            {
              var theNamespace = tag.getNamespace();
              if (theNamespace == adf.mf.api.amx.AmxTag.NAMESPACE_AMX)
              {
                tag._rootClassName = "amx-" + tag.getName();
              }
              else if (theNamespace == adf.mf.api.amx.AmxTag.NAMESPACE_DVTM)
              {
                tag._rootClassName = "dvtm-" + tag.getName();
              }
              else
              {
                tag._rootClassName = ""; // custom components should add their own class names
              }
            }
            if (tag._rootClassName != "")
            {
              domNode.classList.add(tag._rootClassName);
            }
            var styleClass = this.getAttribute("styleClass");
            if (styleClass != null && styleClass != "")
            {
              if (adf.mf.environment.profile.dtMode)
              {
                // if adf.mf.environment.profile.dtMode, remove el
                styleClass = styleClass.replace(/#\{(.*?)\}/ig, ' ');
              }
              var splits = styleClass.split(" ");
              for (var i=0, count=splits.length; i<count; ++i)
              {
                var split = splits[i];
                if ("" != split)
                  domNode.classList.add(split);
              }
            }
            if (adf.mf.api.amx.isValueTrue(this.getAttribute("readOnly")))
            {
              domNode.classList.add("amx-readOnly");
            }
            if (adf.mf.api.amx.isValueTrue(this.getAttribute("disabled")))
            {
              domNode.classList.add("amx-disabled");
            }
            if (typeof nodeTypeHandler.destroy === "function")
            {
              domNode.classList.add("amx-has-destroy");
            }
            if (typeof nodeTypeHandler.preDestroy === "function")
            {
              domNode.classList.add("amx-has-predestroy");
            }

            // add the eventual inlineStyle
            var inlineStyle = this.getAttribute("inlineStyle");
            if (inlineStyle)
            {
              if (adf.mf.environment.profile.dtMode)
              {
                // if adf.mf.environment.profile.dtMode, remove el
                inlineStyle = inlineStyle.replace(/#\{(.*?)\}/ig, ' ');
              }
              var existingStyle = domNode.getAttribute("style");
              if (existingStyle == null)
                domNode.setAttribute("style", inlineStyle);
              else
                domNode.setAttribute("style", existingStyle + ";" + inlineStyle);
            }

            this._applyClientListenerAssociations(domNode);
          }
          catch (ex)
          {
            adf.mf.log.logInfoResource("AMXInfoBundle",
              adf.mf.log.level.SEVERE, "render", "MSG_CREATE_FAILED",
              this.getTag().getNsPrefixedName(), ex);
          }
        }
        else
        {
          adf.mf.log.logInfoResource("AMXInfoBundle",
            adf.mf.log.level.WARNING, "render", "MSG_NO_RENDERER",
            this.getTag().getNsPrefixedName());
        }
      }
    }

    if (this.getState() != adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"])
    {
      this.setState(adf.mf.api.amx.AmxNodeStates["RENDERED"]);
    }
    return domNode;
  };

  /**
   * Apply clientListener event type associations.
   * @param {HTMLElement} rootElement the root element of this component
   */
  AmxNode.prototype._applyClientListenerAssociations = function(rootElement)
  {
    var clientListenerTypes = this.getAttribute("data-clientListenerTypes");
    if (clientListenerTypes)
    {
      var amxNodeId = this.getId();
      var th = this.getTypeHandler();
      for (var eventType in clientListenerTypes)
        th.__experimentalCLAssociation(
          this,
          amxNodeId,
          eventType,
          rootElement); // TODO what if the type or method changes due to DCEs?
    }
  };

  /**
   * @deprecated
   */
  AmxNode.prototype.renderSubNodes = function(facetName, key)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "amxNode.renderSubNodes", "MSG_DEPRECATED", "amxNode.renderSubNodes", "amxNode.renderDescendants");
    var arrayOfHtmlElements = this.renderDescendants(facetName, key);
    var subNodes = [];
    for (var i=0, size=arrayOfHtmlElements.length; i<size; ++i)
    {
      var elementToAdd = arrayOfHtmlElements[i];
      subNodes.push(elementToAdd);
    }
    return subNodes;
  };

  /**
   * Renders the sub-AmxNodes of this AmxNode.
   * @param {(string|null)} facetName the name of the facet to render the children for or null
   *        to render the non-facet children.
   * @param {(Object|null)} key An optional key to specify for stamping. If provided, it will render
   *        the children AMX nodes for a given stamping key.
   * @return {Array<HtmlElement>} array of all of the rendered HTML nodes
   */
  AmxNode.prototype.renderDescendants = function(facetName, key)
  {
    var arrayOfHtmlElements = [];
    var children = this.getRenderedChildren(facetName, key);
    for (var i=0, size=children.length; i<size; ++i)
    {
      var childAmxNode = children[i];
      var subElement = childAmxNode.render();
      if (subElement)
      {
        arrayOfHtmlElements.push(subElement);
      }
    }

    return arrayOfHtmlElements;
  };

  /**
   * @deprecated
   */
  AmxNode.prototype.rerenderNode = function()
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "amxNode.rerenderNode", "MSG_DEPRECATED", "amxNode.rerenderNode", "amxNode.rerender");
    this.rerender();
  };

  /**
   * Re-renders the AmxNode.
   */
  AmxNode.prototype.rerender = function()
  {
    var oldDomNode = document.getElementById(this.getId());
    if (oldDomNode == null)
    {
      var amxNode = this.__getRenderingParent().__getClosestRenderedNode();
      if (amxNode != null)
      {
        amxNode.rerender();
      }
      return;
    }

    var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);
    if (isFinestLoggingEnabled)
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "adf.mf.api.amx.AmxNode", "rerenderNode",
        "Re-rendering AmxNode " + this.getId());
    }

    var newDomNode = this.render();
    if (newDomNode)
    {
      oldDomNode.parentNode.insertBefore(newDomNode, oldDomNode);
    }
    adf.mf.api.amx.removeDomNode(oldDomNode);
    // rerender function is called independently from outside of the amx core so
    // init and postDisplay have to be invoked now to ensure that the node
    // will be fully initialized
    if (amx.mustProcessQueues === true)
    {
      amx.processAndCleanInitQueue();
      amx.processAndCleanPostDisplayQueue();
    }
  };

  /**
   * Checks the state of the node to see if the node was rendered or is able to be be rendered.
   * The node is considered to be renderable if it is in the ABLE_TO_RENDER,
   * RENDERED or PARTIALLY_RENDERED state.
   *
   * @return {boolean} true if the node was rendered or should be rendered.
   */
  AmxNode.prototype.isReadyToRender = function()
  {
    switch (this.getState())
    {
      case adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]:
      case adf.mf.api.amx.AmxNodeStates["RENDERED"]:
      case adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"]:
        return true;
      default:
        return false;
    }
  };

  /**
   * Checks if a node was rendered and the DOM is still present on the page.
   *
   * @return {boolean} true if the node was rendered and it's DOM node is present on the page
   */
  AmxNode.prototype.isRendered = function()
  {
    switch (this.getState())
    {
      // Note that WAITING_ON_EL_EVALUATION may be the state if updateAttributes set it to that
      // value after the state was previously PARTIALLY_RENDERED
      case adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"]:
      case adf.mf.api.amx.AmxNodeStates["RENDERED"]:
      case adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"]:
        return document.getElementById(this.getId()) != null;
      default:
        return false;
    }
  };

  /**
   * Called to refresh the HTML of a node. This method is called after the updateChildren
   * method and should be implemented by type handlers that wish to update their DOM in
   * response to a change.
   * @param {adf.mf.api.amx.AmxAttributeChange} attributeChanges the changed attributes
   * @param {(adf.mf.api.amx.AmxDescendentChanges|null)} descendentChanges the changes for any
   *        descendent nodes that need to be refreshed.
   */
  AmxNode.prototype.refresh = function(attributeChanges, descendentChanges)
  {
    var th = this.getTypeHandler();
    if (adf.mf.internal.amx.implementsFunction(th, "refresh"))
    {
      th.refresh(this, attributeChanges, descendentChanges);
    }
  };

  /**
   * Applies any attribute changes. Usually called as a result of the data change
   * framework.
   *
   * @param {Object.<string, boolean>} affectedAttributes object with keys of the
   *        attribute names that have changed and a value of true.
   * @param {Object.<string, adf.mf.api.amx.AmxCollectionChange>} collectionChanges the change
   *        details for collection attributes that have changed
   * @return {adf.mf.api.amx.AmxAttributeChange} returns the changed properties and their old
   *         values.
   */
  AmxNode.prototype.updateAttributes = function(affectedAttributes, collectionChanges)
  {
    // First, update the attributes that have changed
    var changes = new adf.mf.api.amx.AmxAttributeChange();
    var cacheMiss = false;

    // See if one of the affected attributes is the rendered attribute
    if (affectedAttributes["rendered"])
    {
      var oldValue = this.getAttribute("rendered");
      var cacheMiss = this._processAttribute("rendered");

      if (cacheMiss)
      {
        // The new value is not in the EL cache
        this.setState(adf.mf.api.amx.AmxNodeStates["INITIAL"]);
        changes.__addChangedAttribute("rendered", oldValue);
        return changes;
      }

      // Ensure a boolean type
      var newValue = this.getAttribute("rendered");
      if (oldValue != newValue)
      {
        changes.__addChangedAttribute("rendered", oldValue, null);

        if (!newValue)
        {
          // The node is no longer rendered. Remove any children and any other
          // properties that do not need to be kept anymore
          this._removeFromDataChangeNotification(false);
          this._facets = {};
          this._children = {};
          this._modifiableEl = {};
          this._childrenCreated = false;
          this._converter = null;
          this._tagInstances = null;
          this._elDependencies = null;
          this._tagInstanceIdsWaitingOnEl = {};
          this._tagInstancesWaitingOnEl = 0;

          // Update the state
          this.setState(adf.mf.api.amx.AmxNodeStates["UNRENDERED"]);

          // Register for data change events only on the rendered attribute
          this._registerRenderedAttributeForDataChange();

          // Don't process any more attribute changes on unrendered nodes.
          return changes;
        }

        // The node was not rendered but now is. Allow the rest of the attributes
        // to be process. First, change the state to INITIAL so that the children
        // may be built. This will result in the init method being called again for this
        // node.
        this.setState(adf.mf.api.amx.AmxNodeStates["INITIAL"]);

        // Return the old values to the caller
        return changes;
      }
    }

    // If the node is not rendered, then do not process any other attributes
    if (this.getState() == adf.mf.api.amx.AmxNodeStates["UNRENDERED"])
    {
      return changes;
    }

    // At this point, the rendered attribute has not changed, just process the changed
    // attributes
    for (var attrName in affectedAttributes)
    {
      if (attrName == "rendered")
      {
        continue;
      }

      var oldValue = this.getAttribute(attrName);
      cacheMiss = this._processAttribute(attrName) || cacheMiss;

      var collectionChange = collectionChanges == null ? null : collectionChanges[attrName];
      changes.__addChangedAttribute(attrName, oldValue, collectionChange);
    }

    // Update the state to reflect if all the EL is available
    if (cacheMiss && this.isReadyToRender())
    {
      // Update the state, if necessary, to reflect that the node does not have all
      // the required attributes.
      this.setState(adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"]);
    }
    else if (this._tagInstancesWaitingOnEl == 0 && this._attributesWaitingOnEl == 0 &&
      this.getState() == adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"])
    {
      this.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
    }

    return changes;
  };

  /**
   * Process any necessary updates to the children AMX nodes during an attribute
   * change. This is called after the updateAttributes function and before the refresh
   * function. Type handlers may implement a function updateChildren with the amx node and
   * the old attribute values as the parameters. The implementation of the function should
   * remove any old children and create and add any new children to the AMX node. The
   * framework will initialize the children and call the refresh function on the nodes
   * once they are ready to render.
   * @param {adf.mf.api.amx.AmxAttributeChange} attributeChanges the changed attributes
   * @return {number} one of the adf.mf.api.amx.AmxNodeChangeResult constants.
   */
  AmxNode.prototype.updateChildren = function(attributeChanges)
  {
    // See if the node ever created children
    if (this._childrenCreated)
    {
      var th = this.getTypeHandler();

      // Do not call the type handler if no attributes have changed. This will happen if the
      // tag instances have changed and not any attributes
      if (attributeChanges.getSize() > 0)
      {
        if (adf.mf.internal.amx.implementsFunction(th, "updateChildren"))
        {
          // Note that the type handler should check for styleClass and
          // inlineStyle and return REFRESH for those if implementing a custom
          // updateChildren or use the result from defaultUpdateChildren
          return th.updateChildren(this, attributeChanges);
        }

        return adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];
      }
      else
      {
        // Do not rerender nodes if only the tag instances have been updated
        return adf.mf.api.amx.AmxNodeChangeResult["NONE"];
      }
    }
    else
    {
      // The node never created its children, so use the _createChildren
      // method instead of the updateChildren
      state = this.getState();
      if (state == adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"] ||
        this.isReadyToRender())
      {
        this._createChildren();
      }

      return adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];
    }
  };

  /**
   * Convenience function for type handlers that stamp their children to
   * create the children AMX nodes from inside of a custom createChildrenNodes
   * function. It will create children for any UI tags.
   *
   * @param {object} key the stamp key to use
   * @param {(Array.<string>|null)} facetNamesToInclude list of facet names to create
   *        children for. If empty the facets will not be processed for this
   *        stamp. If null, all the facets will be processed. Include a null value
   *        inside the array to create children for non-facet tags.
   * @param {(function|null)} filterCallback an optional function to filter the children
   *        to create the children for. The function will be invoked with the node,
   *        the stamp key, the child tag and the facet name (or null for non-facets).
   *        Function must return a boolean. If true, the tag will be used to create
   *        children, if false the tag will not be processed.
   * @return {Array.<adf.mf.api.amx.AmxNode>} the children that were created
   */
  AmxNode.prototype.createStampedChildren = function(
    key,
    facetNamesToInclude,
    filterCallback)
  {
    var tag = this.getTag();
    var node, i, size;
    var created = [];

    // First create the AMX nodes for the facets
    if (facetNamesToInclude == null || facetNamesToInclude.length > 0)
    {
      var facetTags = tag.getChildrenFacetTags();
      for (i = 0, size = facetTags.length; i < size; ++i)
      {
        var facetData = facetTags[i].getFacet();
        var facetName = facetData["name"];

        if (facetNamesToInclude != null &&
          facetNamesToInclude.length > 0 &&
          facetNamesToInclude.indexOf(facetName) == -1)
        {
          continue;
        }

        var facetTagChildren = facetData["children"];

        for (var j = 0, facetChildrenSize = facetTagChildren.length;
          j < facetChildrenSize; ++j)
        {
          var facetTag = facetTagChildren[j];
          if (!facetTag.isUITag())
          {
            continue;
          }

          if (filterCallback == null ||
            filterCallback(this, key, facetTag, facetName))
          {
            node = facetTag.buildAmxNode(this, key);
            created.push(node);
            this.addChild(node, facetName);
          }
        }
      }
    }

    // Create the nodes for the children
    if (facetNamesToInclude == null ||
      facetNamesToInclude.indexOf(null) >= 0)
    {
      var childrenUiTags = tag.getChildrenUITags();
      for (i = 0, size = childrenUiTags.length; i < size; ++i)
      {
        var childTag = childrenUiTags[i];

        if (filterCallback == null ||
          filterCallback(this, key, childTag, null))
        {
          node = childTag.buildAmxNode(this, key);
          created.push(node);
          this.addChild(node);
        }
      }
    }

    return created;
  };

  /**
   * Attempts to find a parent AMX node by its tag's namespace and tag name
   *
   * @param {string} ns the namespace
   * @param {string} tagName the tag name
   * @return {(adf.mf.api.amx.AmxNode|null)} the ancestor AMX node or null if not found
   */
  AmxNode.prototype.findAncestorByTag = function(
    ns,
    tagName)
  {
    for (var amxNode = this.getParent(); amxNode != null; amxNode = amxNode.getParent())
    {
      var tag = amxNode.getTag();
      if (tag.getName() == tagName && tag.getNamespace() == ns)
      {
        return amxNode;
      }
    }

    return null;
  };

  /**
   * Attempts to find an AMX node relative to the current node by its XML ID. This will search in
   * the current naming container for the given node. If not found, it will look in the parent
   * naming container. By providing colons in the string, the code will search for children of
   * found parent nodes.
   *
   * @param {string} xmlIdSearchExpression the XML ID optionally separated by colons for a hierarchy of nodes.
   * @param {boolean} if true the code will search in parent files. If false, it will only check
   *        the current file
   * @return {(adf.mf.api.amx.AmxNode|null)} the node if found
   */
  AmxNode.prototype.findRelativeAmxNode = function(
    xmlIdSearchExpression,
    searchAcrossMultiplePages)
  {
    var namingContainerInfo = this._findNamingContainerAndStampKey();
    var idsToFind = xmlIdSearchExpression.split(":");
    var ncAmxNode = namingContainerInfo["amxNode"];
    var amxNode = ncAmxNode;

    for (var i = 0, numIds = idsToFind.length; i < numIds && amxNode != null; ++i)
    {
      amxNode = amxNode._findAmxNode(idsToFind[0], i == 0 ? namingContainerInfo["stampKey"] : null);
    }

    if (amxNode == null)
    {
      var tag = ncAmxNode.getTag();
      var parent = ncAmxNode.getParent();

      if (parent == null ||
        (tag.getName() == "fragment" && tag.getNamespace() == adf.mf.api.amx.AmxTag.NAMESPACE_AMX &&
          searchAcrossMultiplePages != true))
      {
        return null;
      }

      // Search the naming container above the current one
      return parent.findRelativeAmxNode(xmlIdSearchExpression, searchAcrossMultiplePages);
    }

    return amxNode;
  };

  /**
   * Update the tag instance attributes. This is usually called as a result of a data change
   * event. Currently internal until a formal API can be fully designed
   *
   * @param {adf.mf.api.amx.AmxNodeUpdateArguments} nodeUpdateArguments the arguments to the
   *                                                markNodeForUpdate call.
   * @ignore
   */
  AmxNode.prototype.__updateTagInstanceAttributes = function(nodeUpdateArguments)
  {
    var amxNodeId = this.getId();
    var affectedInstanceIds = nodeUpdateArguments.__getAffectedTagInstanceIds(amxNodeId);
    var numInstances = affectedInstanceIds.length;

    if (numInstances > 0)
    {
      var th = this.getTypeHandler();
      // Delegate to the type handler if the custom function has been provided
      var typeHandlerHasNotifyMethod = adf.mf.internal.amx.implementsFunction(
        th, "__tagInstanceUpdated");

      for (var i = 0; i < numInstances; ++i)
      {
        var tagInstanceId = affectedInstanceIds[i];
        var affectedAttributes = nodeUpdateArguments.__getAffectedAttributesForTagInstance(
          amxNodeId, tagInstanceId);

        var tagInstance = this._tagInstances[tagInstanceId];
        tagInstance.updateAttributes(affectedAttributes);

        if (this._tagInstanceIdsWaitingOnEl[tagInstanceId] &&
          tagInstance.getState() == adf.mf.internal.amx.AmxTagInstanceStates["LOADED"])
        {
          delete this._tagInstanceIdsWaitingOnEl[tagInstanceId];
          --this._tagInstancesWaitingOnEl;
        }

        if (typeHandlerHasNotifyMethod)
        {
          // Use a temporary API to notify the type handler that a tag instance has been updated.
          // This API needs to be improved before making public (same with the entire tag instance
          // API)
          th.__tagInstanceUpdated(this, tagInstance);
        }
      }

      // See if the node is now ready to render (if all the EL is now loaded)
      if (this._tagInstancesWaitingOnEl == 0 && this._attributesWaitingOnEl == 0 &&
        this.getState() == adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"])
      {
        this.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
      }
    }
  };

  /**
   * Checks to see if the converter needs to be re-created and the value re-converted as a result
   * of a change.
   *
   * @param {adf.mf.api.amx.AmxNodeUpdateArguments} nodeUpdateArguments the arguments to the
   *                                                markNodeForUpdate call
   * @param {adf.mf.api.amx.AmxAttributeChange} attributeChanges the attribute changes created by
   *                                            the updateAttributes call
   */
  AmxNode.prototype.__processConverterChanges = function(
    nodeUpdateArguments,
    attributeChanges)
  {
    if (this._converterTag == null)
    {
      // There is no converter
      return;
    }

    var id = this.getId();
    var converterTagId = this._converterTag.getAttribute("id");
    var affectedTagInstanceIds = nodeUpdateArguments.__getAffectedTagInstanceIds(id);
    var converterAffected = affectedTagInstanceIds.indexOf(converterTagId) >= 0;
    var valueAffected = nodeUpdateArguments.getAffectedAttributes(id)["value"];

    var hasConverter = this.getConverter() != null;

    if (converterAffected || hasConverter == false)
    {
      // Force the re-creation of the converter, if necessary
      this._converter = null;

      if (this._processConverter())
      {
        // Check if the the node has a "value" attribute. This is a work-around for bug 17055533
        // where DVT is using converters on AMX nodes that do not have value attributes.
        if (this.getTag().getAttribute("value") !== undefined)
        {
          var oldValue = this.getAttribute("value");

          // If the value was not changed in this update and the converter was set
          // before, then we need a clean copy of the value
          if (hasConverter && valueAffected != true && !adf.mf.environment.profile.dtMode)
          {
            var valueEl = this.getAttributeExpression("value");
            this.setAttributeResolvedValue("value",
              adf.mf.internal.amx.evaluateExpression(valueEl));
          }

          this._convertValue();
          attributeChanges.__addChangedAttribute("value", oldValue, null);
        }
      }
    }
    else if (valueAffected)
    {
      this._convertValue();
    }
  };

  /**
   * The AMX facetRef allows facets to be relocated for purposes of rendering (rendered in a
   * location that they are not defined in). In these cases, the framework must be able to
   * determine the parent AMX node responsible for rendering a node instead of the one that
   * is used to define it. This function normally returns the parent, but for facets used by
   * amx:facetRef, this function will return the facetRef.
   *
   * @return {adf.mf.api.amx.AmxNode} the parent node for rendering purposes.
   */
  AmxNode.prototype.__getRenderingParent = function()
  {
    return this._renderingParent == null ? this.getParent() : this._renderingParent;
  };

  /**
   * See __getRenderingParent
   */
  AmxNode.prototype.__setRenderingParent = function(renderingParent)
  {
    this._renderingParent = renderingParent;
  };

  /**
   * Function to push a map of EL tokens that should be replaced and their replacement
   * values onto a stack. Allows EL aliasing. Used internally for amx:fragmentDef to perform
   * attribute aliasing.
   *
   * @param {Object.<string, string>} map a map with the name to replace as a key and the
   *        token replacement as a value.
   */
  AmxNode.prototype.__pushElReplacements = function(map)
  {
    AmxNode._pushElReplacements(map);
  };

  /**
   * Function to push a map of EL tokens that should be replaced and their replacement
   * values onto a stack. Allows EL aliasing. Used internally for amx:fragmentDef to perform
   * attribute aliasing.
   *
   * @param {Object.<string, string>} map a map with the name to replace as a key and the
   *        token replacement as a value.
   */
  AmxNode.prototype.__popElReplacements = function()
  {
    AmxNode._popElReplacements();
  };

  AmxNode.prototype.__getConverterTag = function()
  {
    return this._converterTag;
  };

  /**
   * Returns the node closest to the this node, which may
   * be the current node, that is rendered and returns it.
   * @param {(boolean|null)} checkAbleToRenderNodes if true nodes in the ABLE_TO_RENDER state
   *        will be checked if rendered. This is useful during the data change event processing
   *        where a node's state may have been altered
   * @return {(adf.mf.api.amx.AmxNode|null)} the closest rendered node or null if no
   *         nodes are rendered.
   */
  AmxNode.prototype.__getClosestRenderedNode = function(checkAbleToRenderNodes)
  {
    var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);

    var targetNodeId = null;
    if (isFinestLoggingEnabled)
    {
      targetNodeId = this.getId();
    }

    for (var amxTargetNode = this; amxTargetNode != null;
      amxTargetNode = amxTargetNode.__getRenderingParent())
    {
      var state = amxTargetNode.getState();
      switch (state)
      {
        case adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"]:
        case adf.mf.api.amx.AmxNodeStates["RENDERED"]:
        case adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]:
          // If in the ABLE_TO_RENDER, only use if checkAbleToRenderNodes is true
          if (checkAbleToRenderNodes !== true &&
            state == adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"])
          {
            continue;
          }

          // Verify that the DOM node still exists (state is consistent)
          if (document.getElementById(amxTargetNode.getId()) != null)
          {
            if (isFinestLoggingEnabled)
            {
              adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
                "adf.mf.api.amx.AmxNode", "__getClosestRenderedNode",
                "Closest rendered ancestor node of node " + targetNodeId +
                " was found to be " + amxTargetNode.getId());
            }
            return amxTargetNode;
          }
          break;
      }
    }

    if (isFinestLoggingEnabled)
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "adf.mf.api.amx.AmxNode", "__getClosestRenderedNode",
        "No rendered ancestor node could be found for node " + targetNodeId);
    }

    return null;
  };

  AmxNode.prototype.__getDescendentChangeAction = function(changes)
  {
    var th = this.getTypeHandler();
    // Delegate to the type handler if the custom function has been provided
    if (adf.mf.internal.amx.implementsFunction(th, "getDescendentChangeAction"))
    {
      return th.getDescendentChangeAction(this, changes);
    }

    // If a custom handler function has not been provided, the default behavior is
    // to re-render the closest rendered ancestor AMX node if any of the children
    // have had their rendered state changed.
    var changedAmxNodes = changes.getAffectedNodes();
    for (var i = 0, size = changedAmxNodes.length; i < size; ++i)
    {
      var descendentAmxNode = changedAmxNodes[i];
      var oldState = changes.getPreviousNodeState(descendentAmxNode);
      var rendered = descendentAmxNode.isReadyToRender();
      var wasRendered = (
          oldState == adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"] ||
          oldState == adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"] ||
          oldState == adf.mf.api.amx.AmxNodeStates["RENDERED"]
        ) && document.getElementById(descendentAmxNode.getId()) != null;

      if ((rendered == false && wasRendered) ||
       (rendered && wasRendered == false))
      {
        // The descendent AMX node's rendered state has changed.
        // We need to re-render the ancestor to reflect the change in the UI
        // since the ancestor is not configured to handle the change itself
        return adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];
      }
    }

    // If none of the changes result in a rendered state change, by default
    // we do not need to take any action.
    return adf.mf.api.amx.AmxNodeChangeResult["NONE"];
  };

  /**
   * Get the names of the attributes that are affected by a change
   * to the given EL dependency.
   * @param {adf.mf.internal.el.parser.ELExpression} valueExpression the value expression
   * @return {Array.<string>} array of attribute names.
   */
  AmxNode.prototype.__getAttributesForElDependency = function(valueExpression)
  {
    var attrs = null;
    if (this._elDependencies != null)
    {
      attrs = this._elDependencies.getAttributesForElDependency(valueExpression);
    }
    else
    {
      attrs = [];
    }

    return attrs;
  };

  /**
   * Populates the AMX node update arguments for the tag instances
   *
   * @param {adf.mf.api.amx.AmxNodeUpdateArguments} nodeUpdateArguments the object
   * @param {adf.mf.internal.el.parser.ELExpression} valueExpression the value expression
   */
  AmxNode.prototype.__processTagInstancesForElDependency = function(
    nodeUpdateArguments,
    valueExpression)
  {
    var tagInstances = this.__getAllTagInstances();
    for (var i = 0, numInstances = tagInstances.length; i < numInstances; ++i)
    {
      var tagInstance = tagInstances[i];
      var elDependencies = tagInstance.getElDependencies();
      var affectedAttributes = elDependencies.getAttributesForElDependency(valueExpression);

      for (var a = 0, numAttrbitues = affectedAttributes.length; a < numAttrbitues; ++a)
      {
        nodeUpdateArguments.__setAffectedAttributeForTagInstance(
          tagInstance, affectedAttributes[a]);
      }
    }
  };

  /**
   * Internal function to retrieve the tag instances that are present under this node for
   * a specific namespace and tag name.
   *
   * @param {string} namespace the XML namespace of the tag
   * @param {string} tagName the tag name
   * @return {Array.<adf.mf.internal.amx.AmxTagInstance>} array of all the tag instances for
   *         the given namespace and tag name
   */
  AmxNode.prototype.__getTagInstances = function(
    namespace,
    tagName)
  {
    var result = [];
    for (var id in this._tagInstances)
    {
      var instance = this._tagInstances[id];

      // Skip instances underneath another instance
      if (instance.getParentTagInstance() == null)
      {
        var tag = instance.getTag();
        if (tag.getName() == tagName &&
          tag.getNamespace() == namespace)
        {
          result.push(instance);
        }
      }
    }

    return result;
  };

  /**
   * Internal function to get an array of all the tag instances for this AMX node. Includes
   * tag instances that are nested under other tag instances as well (flattens the hierarchy).
   * Not meant to be used outside of amx-core.js.
   *
   * @return {Array.<adf.mf.internal.amx.AmxTagInstance>} array of all the tag instances
   *         for the node
   */
  AmxNode.prototype.__getAllTagInstances = function()
  {
    var result = [];
    for (var id in this._tagInstances)
    {
      result.push(this._tagInstances[id]);
    }

    return result;
  };

  AmxNode.prototype.__findPopup = function(
    popupId)
  {
    if (popupId == null)
    {
      return null;
    }

    // See if the pop-up points to a child of a fragment
    var index = popupId.indexOf(":");
    var th;

    if (index == -1)
    {
      for (var amxNode = this; amxNode != null; amxNode = amxNode.getParent())
      {
        th = amxNode.getTypeHandler();

        if (adf.mf.internal.amx.implementsFunction(th, "findPopup"))
        {
          return th.findPopup(amxNode, popupId, true);
        }
      }

      return null;
    }

    var fragmentId = popupId.substring(0, index);
    var fragmentAmxNode = this.findRelativeAmxNode(fragmentId, false);

    if (fragmentAmxNode != null)
    {
      var children = fragmentAmxNode.getChildren();
      if (children.length > 0)
      {
        var fragmentDefAmxNode = children[0];

        th = fragmentDefAmxNode.getTypeHandler();

        if (adf.mf.internal.amx.implementsFunction(th, "findPopup"))
        {
          return th.findPopup(fragmentDefAmxNode, popupId.substring(index + 1), false);
        }
      }
    }

    return null;
  };

  /**
   * Internal function to get the attribute that should be validated
   *
   * @return {string} the name of the attribute to validate or null if the node has no input
   *         value to validate.
   */
  AmxNode.prototype.__getAttributeToValidate = function()
  {
    return this._attributeToValidate;
  };

  /**
   * Find the naming container node and the stamp key for the current node.
   *
   * @return {{amxNode: adf.mf.api.amx.AmxNode, stampKey: object}} the naming container for the
   *         current node
   */
  AmxNode.prototype._findNamingContainerAndStampKey = function()
  {
    for (var amxNode = this; true; amxNode = amxNode.getParent())
    {
      var stampKey = amxNode.getStampKey();
      if (stampKey != null)
      {
        return { "amxNode": amxNode.getParent(), "stampKey": stampKey };
      }
      else if (amxNode._isNamingContainer() || amxNode.getParent() == null)
      {
        return { "amxNode": amxNode, "stampKey": null };
      }
    }

    // This code will not be reached
    return null;
  };

  AmxNode.prototype._findAmxNode = function(
    xmlId,
    stampKey)
  {
    var childrenToSearch = this.getChildren(null, stampKey);
    var facets = this.getFacets(stampKey);

    for (var facetName in facets)
    {
      childrenToSearch = childrenToSearch.concat(facets[facetName]);
    }

    var numChildren = childrenToSearch.length;
    var c;

    // Look to see if it is one of the children
    for (c = 0; c < numChildren; ++c)
    {
      var child = childrenToSearch[c];
      var tagId = child.getTag().getAttribute("id");

      if (tagId == xmlId)
      {
        return child;
      }
    }

    // Search the decedents of the children
    for (c = 0; c < numChildren; ++c)
    {
      var child = childrenToSearch[c];

      // Do not search into child naming containers
      if (child._isNamingContainer())
      {
        continue;
      }

      var amxNode = child._findAmxNode(xmlId, null);
      if (amxNode != null)
      {
        return amxNode;
      }
    }

    return null;
  };

  /**
   * Function called when there is a cache miss on the rendered attribute or the EL expression
   * for the rendered attribute resolves to false. Only wires the rendered attribute for data change
   * events and ignores other attributes.
   */
  AmxNode.prototype._registerRenderedAttributeForDataChange = function()
  {
    if (this._elDependencies == null)
    {
      var el = this.getAttributeExpression("rendered", false, true);
      this._elDependencies = new adf.mf.internal.amx.AmxElDependencies(
        { "rendered": el });
      this._postProcessForDataChangeNotification(false);
    }
  };

  var iteratorEL = adf.mf.internal.el.parser.parse ("#{iterator}");
  var nullEL = adf.mf.internal.el.parser.parse("#{null}");

  /**
   * Handles the evaluation and conversion of an attribute. Called by both the initialization
   * code as well as the update code.
   *
   * @param {string} attrName the name of the attribute to be processed
   * @return {boolean} whether an EL bound attribute had a cache miss
   */
  AmxNode.prototype._processAttribute = function(attrName)
  {
    var cacheMiss = false;

    var tag = this.getTag();
    if (!tag.isAttributeElBound(attrName))
    {
      // Do not process non-EL attributes if they have already been loaded
      if (this.getAttribute(attrName) !== undefined)
      {
        return cacheMiss;
      }

      var value = tag.getAttribute(attrName);

      // Convert the rendered to a boolean
      if (attrName == "rendered")
      {
        value = value === undefined || adf.mf.api.amx.isValueTrue(value);
      }

      // Do not process attributes not on the tag
      if (value == undefined)
      {
        return cacheMiss;
      }

      this.setAttributeResolvedValue(attrName, value);
      return cacheMiss;
    }

    var el = this.getAttributeExpression(attrName, false, true);

    if (adf.mf.environment.profile.dtMode)
    {
      this.setAttributeResolvedValue(attrName, attrName == "rendered" ? true : el.getExpression());
      return cacheMiss;
    }

    // TODO: move the acceptAttributeForElProcessing into the AmxNode class
    // instead of a global function
    //
    if (!acceptAttributeForElProcessing(attrName, el))
    {
      return cacheMiss;
    }

    var value = adf.mf.internal.amx.evaluateExpression(el);
    if (value === undefined)
    {
      cacheMiss = true;
      if (this._attributeNamesWaitingOnEl[attrName])
      {
        // If this is the second time that we had a cache miss on the same attribute,
        // check to make sure that the EL is valid. For example, a complex EL statement
        // cannot be cached within the JS EL cache and therefore the value would
        // never come back as having a value.
        var unassignableDependency = this._checkForUnassignableEl(el);
        if (unassignableDependency != null)
        {
          // First, replace the EL on the node so that we do not try to evaluate it again:
          this._elAttributeMap[attrName] = nullEL;
          // Second, throw an error to let the user/developer know that the EL is not valid
          throw new Error(adf.mf.resource.getInfoString("AMXErrorBundle",
            "ERROR_UNASSIGNABLE_ATTRIBUTE", this.getId(), attrName, unassignableDependency));
        }
      }
      else
      {
        // Record that at least one EL was not available so that we update
        // the state appropriately
        this._attributeNamesWaitingOnEl[attrName] = true;
        ++this._attributesWaitingOnEl;
      }
    }
    else
    {
      if (this._attributeNamesWaitingOnEl[attrName])
      {
        delete this._attributeNamesWaitingOnEl[attrName];
        --this._attributesWaitingOnEl;
      }

      // Convert the rendered to a boolean
      if (attrName == "rendered")
      {
        value = adf.mf.api.amx.isValueTrue(value);
      }
      // Temporary hack for backwards compatibility is needed here. The old code, when getting
      // a collection model, would first look up the collection model via EL but then use the
      // javascript iterator as the returned attribute value. As a result, we first need to
      // get the collection model (ensuring the value is not an array), and only if that is
      // not undefined, get the iterator and store that.
      else if (attrName == "value" && tag.getAttribute("var") != null &&
         value != null && !Array.isArray(value))
      {
        // If this code is reached, then the value variable is the collection model, but we
        // need the JavaScript iterator for the type handlers. Temporarily "hack" the code so that
        // we now get the iterator from EL
        var iteratorEl = el.concat(iteratorEL);
        value = adf.mf.internal.amx.evaluateExpression(iteratorEl);
        if (value === undefined)
        {
          cacheMiss = true;
        }
      }

      // Store on the node
      this.setAttributeResolvedValue(attrName, value);
    }

    return cacheMiss;
  };

  AmxNode.prototype._checkForUnassignableEl = function(el)
  {
    var elDependencies = el.dependencies();
    for (var i = 0, numDeps = elDependencies.length; i < numDeps; ++i)
    {
      var dependency = elDependencies[i];
      if (!adf.mf.internal.util.isAssignable(dependency))
      {
        return dependency;
      }
    }

    return null;
  };

  AmxNode.prototype._createChildren = function()
  {
    // By default only create the children once
    if (this._childrenCreated)
    {
      return;
    }

    this._childrenCreated = true;

    // Create the non-UI tag instances
    this._createNonUITagInstances();

    var th = this.getTypeHandler();
    // Delegate to the type handler if the custom function has been provided
    if (adf.mf.internal.amx.implementsFunction(th, "createChildrenNodes"))
    {
      var createChildrenNodesResult = th.createChildrenNodes(this);
      if (this.getState() == adf.mf.api.amx.AmxNodeStates["INITIAL"] ||
        createChildrenNodesResult == adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["DEFERRED"])
      {
        // If the type handler moves the state to INITIAL, call the createChildrenNodes
        // again.
        // Similarly, also if the display is deferred (to display a temporary placeholder).
        this._childrenCreated = false;
        return;
      }

      if (createChildrenNodesResult == adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["HANDLED"])
      {
        return;
      }
    }

    // Create the non-facet children (non-stamped)
    this.createStampedChildren(null, null, null);
  };

  AmxNode.prototype._processConverterTag = function()
  {
    var tags = this.getTag().getChildren(adf.mf.api.amx.AmxTag.NAMESPACE_AMX);
    for (var i = 0, size = tags.length; i < size; ++i)
    {
      var tag = tags[i];
      var tagName = tag.getName();
      if (tagName == "convertNumber" || tagName == "convertDateTime")
      {
        this._converterTag = tag;

        // TODO: make this into an official API for registering converters
        break;
      }
    }
  };

  /**
   * Create the converter if it has not already been created
   *
   * @return {boolean} true if a converter was created during this call, otherwise false
   */
  AmxNode.prototype._processConverter = function()
  {
    if (this._converter != null || this._converterTag == null ||
      adf.mf.environment.profile.dtMode == true)
    {
      return false;
    }

    var convTag = this._converterTag;
    var convTagName = convTag.getName();
    var dirty = false;

    // Only process the converter if the node is in a state ready to be rendered
    if (this.isReadyToRender())
    {
      var converterTagInstance = this._tagInstances[convTag.getAttribute("id")];

      if (convTagName == "convertNumber" && amx.createNumberConverter)
      {
        var label = this.isAttributeDefined("label") ? this.getAttribute("label") : null;
        this.setConverter(amx.createNumberConverter(converterTagInstance, label));
        dirty = true;
      }
      else if (convTagName == "convertDateTime" && amx.createDateTimeConverter)
      {
        var label = this.isAttributeDefined("label") ? this.getAttribute("label") : null;
        this.setConverter(amx.createDateTimeConverter(converterTagInstance, label));
        dirty = true;
      }

      // Notify the type handler that the converter has been changed if desired.
      // This is currently only present for DVT and not a publicly supported API at this
      // time.
      var th = this.getTypeHandler();
      if (adf.mf.internal.amx.implementsFunction(th, "__converterCreated"))
      {
        th.__converterCreated(this, this._converter);
      }
    }

    return dirty;
  };

  AmxNode.prototype._convertValue = function()
  {
    if (this._converter != null)
    {
      this.setAttributeResolvedValue("value",
        this._converter.getAsString(this.getAttribute("value")));
    }
  };

  AmxNode.prototype._isNamingContainer = function()
  {
    var tag = this.getTag();
    var ns = tag.getNamespace();
    var name = tag.getName();

    // This function only needs to return true for tags that do not stamp but need
    // to have unique name containers. So list view and the itertor tags are not needed
    // here since they are stamping nodes.
    return (name == "fragment" || name == "facetRef") &&
      ns == adf.mf.api.amx.AmxTag.NAMESPACE_AMX;
  };

  /**
   * Creates the tag instances for the node. Only creates them once, may be called
   * multiple times. Called from the _createChildren method before the AMX children nodes
   * are created.
   * @param {adf.mf.internal.amx.AmxTagInstance=} parentTagInstance the parent tag instance or null
   */
  AmxNode.prototype._createNonUITagInstances = function(parentTagInstance)
  {
    if (parentTagInstance == null)
    {
      // Only execute once per AMX node
      if (this._tagInstances != null)
      {
        return;
      }

      this._tagInstances = {};
    }

    // No need to create non-UI AmxTagInstance if in DT mode.
    if (adf.mf.environment.profile.dtMode)
    {
      return;
    }

    var tag = parentTagInstance == null ? this.getTag() : parentTagInstance.getTag();

    var children = tag.getChildren();
    for (var i = 0, size = children.length; i < size; ++i)
    {
      var childTag = children[i];
      if (childTag.isUITag() == false)
      {
        // Skip amx:facet as there is no need for that tag to have instances
        if (!(childTag.getName() == "facet" &&
          childTag.getNamespace() == adf.mf.api.amx.AmxTag.NAMESPACE_AMX))
        {
          var id = childTag.getAttribute("id");
          var instance = new adf.mf.internal.amx.AmxTagInstance(this, parentTagInstance, childTag);

          this._tagInstances[id] = instance;

          if (instance.getState() ==
            adf.mf.internal.amx.AmxTagInstanceStates["WAITING_ON_EL_EVALUATION"])
          {
            ++this._tagInstancesWaitingOnEl;
            this._tagInstanceIdsWaitingOnEl[id] = true;
          }

          // Process any nested tag instances
          this._createNonUITagInstances(instance);
        }
      }
    }

    if (this._tagInstancesWaitingOnEl > 0 && this.isReadyToRender())
    {
      // Make the node wait to render until the needed EL is loaded for all tag
      // instances
      this.setState(adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"]);
    }
  };

  AmxNode.prototype._createUniqueId = function()
  {
    var id = this.getAttribute("id");
    if (id === undefined)
    {
      id = this.getTag().getAttribute("id");
      this.setAttributeResolvedValue("id", id);
    }

    var parent = this.__getRenderingParent();

    if (parent == null)
    {
      this._id = id;
    }
    else
    {
      var parentId = parent.getId();
      var stampKey = this.getStampKey();
      var parentIsNamingContainer = parent._isNamingContainer();

      if (stampKey == null || parentIsNamingContainer)
      {
        if (parentIsNamingContainer)
        {
          this._id = parentId + ":" + id;
        }
        else
        {
          // Find the portion af the parent with a colon in the ID
          var idx = parentId == null ? -1 : parentId.lastIndexOf(":");
          if (idx == -1)
          {
            // The parent is not "namespaced"
            this._id = id;
          }
          else
          {
            // Get the parent's "namespace" from the ID and use that as this node's prefix
            var prefix = parentId.substring(0, idx + 1);
            this._id = prefix + id;
          }
        }
      }
      else
      {
        var re = /[^\w\.\-]/g;
        var strVal = stampKey.toString();
        // Replace any non-ID friendly values with a sequence of characters unlikely to appear in the
        // value. This assumes that most characters
        // of the iterationKey will be valid and will therefore produce a unique key. Using a token
        // cache would address this if this assumption becomes an issue. If we end up with duplicate
        // IDs due to escaping, we'll have to create a token cache approach.
        strVal = strVal.replace(re, "._.");

        this._id = parentId + ":" + strVal + ":" + id;
      }
    }
  };

  AmxNode.prototype._findChildIndex = function(
    stampKey,
    nodeId,
    facetName)
  {
    var children = this.getChildren(facetName, stampKey);

    for (var i = 0, size = children.length; i < size; ++i)
    {
      var node = children[i];
      if (node.getId() == nodeId)
      {
        return i;
      }
    }

    return -1;
  };

  AmxNode.prototype._findChildIndexAndFacetName = function(
    stampKey,
    nodeId)
  {
    var foundFacetName = null;
    // First search for the child in the children
    var index = this._findChildIndex(stampKey, nodeId, null);
    if (index == -1)
    {
      // If it was not found as a child, look for it as a facet child
      var facets = this.getFacets(stampKey);
      for (var facetName in facets)
      {
        index = this._findChildIndex(stampKey, nodeId, facetName);
        if (index >= 0)
        {
          foundFacetName = facetName;
          break;
        }
      }
    }

    return index == -1 ? null :
      {
        "index": index,
        "facetName": foundFacetName
      };
  };

  /**
   * Function to handle any necessary code to properly notify the node of changes from the model.
   *
   * @param {boolean} includeTagInstances if true the EL in the tag instances will also be
   *        registered.
   */
  AmxNode.prototype._postProcessForDataChangeNotification = function(
    includeTagInstances)
  {
    var elTokens = this._elDependencies.getElTokens();

    if (includeTagInstances)
    {
      var tagInstances = this.__getAllTagInstances();
      for (var i = 0, numInstances = tagInstances.length; i < numInstances; ++i)
      {
        var tagInstance = tagInstances[i];
        elTokens = elTokens.concat(tagInstance.getElDependencies().getElTokens());
      }
    }

    for (var t = 0, numTokens = elTokens.length; t < numTokens; ++t)
    {
      var token = elTokens[t];
      var nodes = nodeToElMap[token];

      if (nodes == null)
      {
        nodes = [ this ];
        nodeToElMap[token] = nodes;
      }
      else
      {
        if (nodes.indexOf(this) == -1)
        {
          nodes.push(this);
        }
      }
    }

    // Cache the value for the removal code
    this._registeredElTokens = elTokens;
  };

  /**
   * Removes the node and descendents from listening to data change events.
   *
   * @param {boolean} nodeWillBeRemoved if true, the a notification will be fired
   *        to the type handler to be notified that the AMX node is going to be removed
   *        from the hierarchy.
   */
  AmxNode.prototype._removeFromDataChangeNotification = function(nodeWillBeRemoved)
  {
    // Notify the type handler this node will be removed or is now unrendered
    this._fireNotification(adf.mf.api.amx.AmxNodeNotifications[
      nodeWillBeRemoved ? "PRE_REMOVAL" : "UNRENDERED"]);

    // Remove this node from notifications
    var tokens = this._registeredElTokens;

    if (tokens != null)
    {
      for (var i = 0, size = tokens.length; i < size; ++i)
      {
        var token = tokens[i];
        var nodes = nodeToElMap[token];
        if (nodes != null)
        {
          var index = nodes.indexOf(this);
          if (index >= 0)
          {
            nodes.splice(index, 1);
          }
        }
      }
    }

    this._registeredElTokens = null;

    this._removeChildrenFromDataChangeNotification();
  };

  /**
   * Removes this node's children from being notified of any data changes. Typically this is called
   * when the node is being set to an un-rendered state or when the node is being removed from the
   * node hierarchy.
   */
  AmxNode.prototype._removeChildrenFromDataChangeNotification = function()
  {
    var i, size, children, stampKey = null;

    for (stampKey in this._children)
    {
      children = this._children[stampKey];
      for (i = 0, size = children.length; i < size; ++i)
      {
        children[i]._removeFromDataChangeNotification(true);
      }
    }

    for (stampKey in this._facets)
    {
      var facets = this._facets[stampKey];
      for (var facetName in facets)
      {
        children = facets[facetName];
        for (i = 0, size = children.length; i < size; ++i)
        {
          children[i]._removeFromDataChangeNotification(true);
        }
      }
    }
  };

  /**
   * Fires a notification of an AMX node event to the type handler
   *
   * @param {string} one of the adf.mf.api.amx.AmxNodeNotifications constants
   */
  AmxNode.prototype._fireNotification = function(
    notificationType)
  {
    var th = this.getTypeHandler();
    if (adf.mf.internal.amx.implementsFunction(th, "handleNotification"))
    {
      th.handleNotification(this, notificationType);
    }
  };

  /**
   * Get the EL expression map for the node. This will get all the EL expressions with
   * replacement for any EL bound attributes.
   *
   * @return {Object.<string, string>} map of the attribute name to the replaced EL expression
   */
  AmxNode.prototype._getAttributesExpressionMap = function()
  {
    var tag = this.getTag();
    var attrs = tag.getAttributes();
    var replacedAttrs = {};
    for (var name in attrs)
    {
      var expr = this.getAttributeExpression(name, false, true);

      if (expr != null)
      {
        replacedAttrs[name] = expr;
      }
    }

    return replacedAttrs;
  };

  /**
   * Called during initialization to set the input value attribute of the node, allowing validation
   * of that parameter to take place and sets up the EL to permit context free usage during the
   * posting of the changes back to the model.
   */
  AmxNode.prototype._setupInputValueValidation = function()
  {
    // Note, if this function is changed at all, the amx-core.js function amx.registerInputValue
    // must also be changed as it has the deprecated version of this code.
    var th = this.getTypeHandler();

    if (this._attributeToValidate === undefined)
    {
      var attr = adf.mf.internal.amx.implementsFunction(th, "getInputValueAttribute") ?
        th.getInputValueAttribute() :
        null;
      this._attributeToValidate = attr;

      if (attr != null)
      {
        // Convert the EL to a context free EL string to be able to safely call back into the model
        // without any local javascript variables
        this.storeModifyableEl(attr);
      }
    }
  };

  /**
   * Given an HTML element, find the closest AMX node
   * @param {HTMLElement} element the DOM element
   * @return {adf.mf.api.amx.AmxNode|null} the node if found or null
   */
  AmxNode.getAmxNodeForElement = function(element)
  {
    for (var e = element; e != null && e.classList != null; e = e.parentNode)
    {
      if (e.classList.contains("amx-node"))
      {
        return adf.mf.internal.amx._getNonPrimitiveElementData(e, "amxNode");
      }
    }

    return null;
  };

  /**
   * Performs any EL substitutions for the given EL expression. Must be called in-context so that
   * EL variables are correctly recognized and substituted.
   *
   * @param {string} expr the EL expression
   * @return {string} the EL expression with any EL replacements made
   */
  AmxNode.__performElSubstitutions = function(expr)
  {
    if (!expr.tokens)
        expr = adf.mf.internal.el.parser.parse(expr);

    var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);

    var replacementStack = AmxNode._elReplacementsStack;
    var origExpr = expr;

    try
    {
        expr = adf.mf.internal.util.stripLocalValues(expr, true, replacementStack);
    }
    catch (e)
    {
        // If the replacement fails, log the error and fall back to using the non-replaced EL.
        // This will make it easier to track down the EL expression that had caused the error.
        amx.log.error(e.message);
        return origExpr;
    }

    if (isFinestLoggingEnabled)
    {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.api.amx.AmxNode", "__performElSubstitutions",
            "Original expression: " + origExpr + ". Replacement: " + expr);
    }

    return expr;
  };

  /**
   * Pushes a new map of EL expressions onto the EL replacement stack.
   *
   * @param {Object.<string, string>} map of the EL variable name to
   *        the EL string replacement to be made.
   */
  AmxNode._pushElReplacements = function(map)
  {
    var stack = AmxNode._elReplacementsStack;
    if (stack == null)
    {
      AmxNode._elReplacementsStack = [ map ];
    }
    else
    {
      stack.unshift(map);
    }
  };

  /**
   * Removes the last EL replacement map from the stack
   *
   * @return {Object.<string, string>} the map that was removed
   */
  AmxNode._popElReplacements = function()
  {
    var stack = AmxNode._elReplacementsStack;
    var item = stack.shift();

    if (stack.length == 0)
    {
      delete AmxNode._elReplacementsStack;
    }

    return item;
  };

  /**
   * Sort nodes of in an array so that parents appear first
   * and descendents later.
   */
  AmxNode.__sortNodesByDepth = function(nodes)
  {
    function getNodeDepth(node)
    {
      var depth = 0;
      for (var n = node; n != null; n = n.getParent())
      {
        ++depth;
      }

      return depth;
    }

    function nodeCompare(n1, n2)
    {
      if (n1 == n2)
      {
        return 0;
      }

      var n1p = n1.getParent();
      var n2p = n2.getParent();

      if (n1p == n2p)
      {
        // If in the same parent, first compare the stamp keys
        var s1 = n1.getStampKey();
        var s2 = n2.getStampKey();

        if (s1 == s2)
        {
          // The nodes are in the same parent with the same stamp key,
          // return the order of the nodes in the children array
          var n1data = n1p._findChildIndexAndFacetName(s1, n1.getId());
          var n2data = n2p._findChildIndexAndFacetName(s2, n2.getId());

          var n1f = n1data["facetName"];
          var n2f = n2data["facetName"];


          if (n1f == n2f)
          {
            // They have the same facet (may be null), so just compare the
            // indexes
            return n1data["index"] - n2data["index"] < 0 ? -1 : 1;
          }
          else
          {
            if (n1f == null)
            {
              return 1;
            }
            else if (n2f == null)
            {
              return -1;
            }

            return n1f < n2f ? -1 : 1;
          }
        }
        else // The stamp keys are not the same
        {
          // Use a string comparisson of the keys
          return (("" + s1) < ("" + s2)) ? -1 : 1;
        }
      }
      else // The parents are not the same
      {
        var d1 = getNodeDepth(n1);
        var d2 = getNodeDepth(n2);

        var tmp1 = n1;
        var tmp2 = n2;
        var origD1 = d1;
        var origD2 = d2;

        // Ensure that they are the same depth
        if (d1 != d2)
        {
          while (d1 > d2)
          {
            tmp1 = tmp1.getParent();
            --d1;
          }

          while (d2 > d1)
          {
            tmp2 = tmp2.getParent();
            --d2;
          }

          if (tmp1 == tmp2)
          {
            // The nodes are the same, return the one that was more shallow
            return origD1 < origD2 ? -1 : 1;
          }

          if (tmp1.getParent() == tmp2.getParent())
          {
            // If they have the same parent at this level, then recursively
            // use this function
            return nodeCompare(tmp1, tmp2);
          }
        }

        // At this point, we have nodes at the same depth, but the parents are not the same.
        // We need to walk up the parent hierarchy until we find nodes that share the same parent.
        for (var depth = d1; depth > 0; --depth)
        {
          var tmp1p = tmp1.getParent();
          var tmp2p = tmp2.getParent();

          if (tmp1p == tmp2p)
          {
            // We found the parents that are the same, use a recursive call
            return nodeCompare(tmp1, tmp2);
          }

          // Keep looking up the ancestory chain
          tmp1 = tmp1p;
          tmp2 = tmp2p;
        }

        // We should not have reached here as there is only one root node. This would only
        // happen if the nodes are from different hierarchies, which is not valid.
        // Throw an error so that we know it failed.
        throw new Error(adf.mf.resource.getInfoString("AMXErrorBundle",
          "ERROR_FAILED_TO_SORT_AMX_NODES"));
      }
    }

    nodes.sort(nodeCompare);
  };

  /**
   * Internal function called from amx-core.js in the handling of data change events
   * @param {adf.mf.internal.el.parser.ELExpression} valueExpression
   *        the value expression to get the nodes
   * @return {Array.<adf.mf.api.amx.AmxNode>} array of nodes that are registered for the EL token
   */
  AmxNode.__getNodesDependentOnElToken = function(valueExpression)
  {
    var token = valueExpression.getIndexedRepresentation();

    // Now get the nodes
    var nodes = nodeToElMap[token];
    return nodes == null ? [] : nodes;
  };

  AmxNode.__clearBindings = function()
  {
    nodeToElMap = {};
  };

  // ------ /AMX Node ------ //

  // return true if this attribute/value needs to be EL resolved
  acceptAttributeForElProcessing.noProcessAttributes =
  {
    valueChangeListener:true,
    from:true,
    to:true,
    selectionChangeListener:true,
    actionListener:true,
    action:true,
    binding:true,
    rangeChangeListener:true
  };

  function acceptAttributeForElProcessing(attrName, attrValue)
  {
    var accept = (!acceptAttributeForElProcessing.noProcessAttributes[attrName] &&
      attrValue);
    accept = accept && (attrName.indexOf("Listener") === -1);
    return accept;
  }

  adf.mf.internal.amx.acceptAttributeForElProcessing = acceptAttributeForElProcessing;

})();
/* Copyright (c) 2011, 2016, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------------- amx-core.js ---------------------- */
/* ------------------------------------------------------ */

adf.mf.log.AMX = adf.mf.log.AMX ||
  new adf.mf.log.logger("oracle.adfmf.amx");

// --------- Config Initialization --------- //
(function()
{
  amx.dtmode = false; // TODO deprecated, use adf.mf.environment.profile.dtMode instead
  // this boolean value will be set directly via the Selenium scripts
  amx.testmode = amx.testmode || false;
  amx.failsafeinvoked = false;

  // GREGOR
  amx.CALL_IDX = 1;

  if (adf.mf.environment.profile.dtMode != null)
  {
    amx.dtmode = adf.mf.environment.profile.dtMode;
  }

  /**
   * Gets the agent type and version.
   * @param {string} givenUserAgentString the navigator's userAgent property
   * @return {Object} with members: a String for the agent type ("iOS", "Android", "trident",
   *                  "webkit", "gecko"), a String for the agent subtype if applicable ("Chrome",
   *                  "Generic", null), and a Number for the agent version
   * @private
   */
  function _getAgentTypeAndVersion(givenUserAgentString)
  {
    var versionParser = _parseFloatVersion;
    var agentType = "unknown";
    var agentSubtype = null;
    var agentVersion = -1;
    var incompatible = false;
    var userAgent = givenUserAgentString.toLowerCase();
    if (userAgent.indexOf("msie") != -1 || userAgent.indexOf("trident") != -1)
    {
      agentType = "trident";
      var possibleVersion = versionParser(userAgent, /trident\/(\d+[.]\d+)/);
      if (possibleVersion != -1)
      {
        // 7.0 = IE11
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
      incompatible = _getReasonIfUnsupported(agentVersion, 6);
    }
    else if (userAgent.indexOf("edge") !== -1)
    {
      agentType = "UWP";

      // we do not need a agentSubtype for now since it will always be edge

      agentVersion = versionParser(userAgent, /edge\/(\d+([.]\d+)*)/);

      // for now it will be compatible until we move to a newer edge for input type="time" etc.
      incompatible = false;
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
      if (userAgent.match(/ip(hone|ad|od)/))
      {
        agentType = "iOS";
        var mobileSafariVersion = versionParser(userAgent, /version\/(\d+([.]\d+)*)/);
        if (mobileSafariVersion != -1) // WebView won't contain version info
          incompatible = _getReasonIfUnsupported(mobileSafariVersion, 6.0);
      }
      else if (userAgent.match(/android/))
      {
        if (userAgent.match(/chrome\//))
        {
          agentType = "Android";
          agentSubtype = "Chrome";
        }
        else // pre-KitKat aka 4.4
        {
          agentType = "Android";
          agentSubtype = "Generic";
        }
        var androidVersion = versionParser(userAgent, /android (\d+([.]\d+)*)/);
        incompatible = _getReasonIfUnsupported(androidVersion, 4);
      }
      else if (userAgent.match(/chrome/)) // desktop Chrome
      {
        var chromeVersion = versionParser(userAgent, /chrome\/(\d+([.]\d+)*)/);
        incompatible = _getReasonIfUnsupported(chromeVersion, 29);
      }
      else // desktop Safari
      {
        var safariVersion = versionParser(userAgent, /version\/(\d+([.]\d+)*)/);
        incompatible = _getReasonIfUnsupported(safariVersion, 6.1);
      }
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
      incompatible = _getReasonIfUnsupported(agentVersion, 28);
    }

    var agentClass = " amx-" + agentType.toLowerCase();
    if (agentSubtype)
      agentClass += "-" + agentSubtype.toLowerCase();
    document.documentElement.className += agentClass;

    if (incompatible)
    {
      // Append the given User Agent string in case it is simply a matter of it
      // being in an unexpected format.
      incompatible += "; " + givenUserAgentString;
    }

    return {
      "type": agentType,
      "subtype": agentSubtype,
      "version": agentVersion,
      "incompatible": incompatible
    };
  }

  function _getReasonIfUnsupported(versionFound, versionRequired)
  {
    if (versionFound < versionRequired)
      return "" + versionFound + " < " + versionRequired;
    return false;
  }

  /**
   * Parses the float version out of of the specified agent string using
   * a regular expression to identify the version portion of the string.
   * @param {string} userAgent the lowercase navigator user agent string
   * @param {RegExp} versionNumberPattern the regular expression pattern used to extract a number that will be parsed into a float
   * @private
   */
  function _parseFloatVersion(userAgent, versionNumberPattern)
  {
    var matches = userAgent.match(versionNumberPattern);
    if (matches)
    {
      var versionString = matches[1];
      if (versionString)
        return parseFloat(versionString);
    }
    return -1;
  }

  // Add agent marker classes:
  adf.mf.internal.amx.agent = _getAgentTypeAndVersion(navigator.userAgent);

  adf.mf.internal.amx.agent.getTransitionEndEventName = function()
  {
    if (adf.mf.internal.amx.agent._transitionEndEventName == null)
    {
      var transitionEndEventName = "transitionend";
      var element = document.createElement("div");
      var transitions = {
        "WebkitTransition": "webkitTransitionEnd",
        "transition": "transitionend",
        "OTransition": "oTransitionEnd",
        "MozTransition": "transitionend"
      };

      for (var t in transitions)
      {
        if (element.style[t] !== undefined)
        {
          transitionEndEventName = transitions[t];
          break;
        }
      }
      adf.mf.internal.amx.agent._transitionEndEventName = transitionEndEventName;
    }
    return adf.mf.internal.amx.agent._transitionEndEventName;
  };

  /**
   * Internal cache of the isTransitionAfterRender result.
   */
  adf.mf.internal.amx.transitionAfterRender = null;

  /**
   * WARNING - This function and property are not supported and will be removed
   *           without any notice.
   * Internal flag that specifies whether we should render before transitioning or
   * display an empty placeholder for immediate transitioning.
   * @param {boolean} isFirstPage whether this is the initial page render
   * @return true for rendering before or false for immediate transitioning
   */
  adf.mf.internal.amx.isTransitionAfterRender = function(isFirstPage)
  {
    // See if an unsupported override was specified as an adf-property in the adf-config.xml file.
    // <adf-property name="amxTransitionMode" value="placeholder"/>
    var transitionAfterRender = adf.mf.internal.amx.transitionAfterRender;
    if (transitionAfterRender == null)
    {
      transitionAfterRender = true;

      // Get the value from the adf-config.xml object (might not be defined):
      var amxTransitionModeELExpression = adf.mf.internal.el.parser.parse ("#{applicationScope.configuration.amxTransitionMode}");
      var amxTransitionMode =
        adf.mf.environment.profile.mockData ?
          null :
        adf.mf.el.getLocalValue(amxTransitionModeELExpression);

      if ("placeholder" == amxTransitionMode)
        transitionAfterRender = false; // fast but ugly
      else
        transitionAfterRender = true; // pretty but slow

      if (isFirstPage)
      {
        // Unfortunately, applicationScope.configuration is not made available automatically
        // so we have to kick off an extra request for it so that the next time this method
        // gets called, we will know what the value is.
        // (Just before the first adf.mf.api.setContext call, we kicked off a request so
        // it will be available by the time we transition.)
        // Also, since we don't know what it is yet, we won't save off a cached result yet.
      }
      else
      {
        // Save it off so we don't have to continuously re-evaluate it.
        adf.mf.internal.amx.transitionAfterRender = transitionAfterRender;
      }
    }
    return transitionAfterRender;
  };

  amx.config =
  {
    debug:
    {
      enable: false,
      onScreen: false
    }
  };

  // TODO this and any of its uses need to be removed
  amx.log = {};

  function addToOnScreenAmxLog(text)
  {
    if (amx.config.debug.onScreen && !amx.amxDebug)
    {
      var debugDiv = document.createElement("div");
      debugDiv.setAttribute("id", "amxDebug");
      document.body.appendChild(debugDiv);
      amx.amxDebug = debugDiv;
      }

    if (amx.amxDebug)
      {
      if (amx.amxDebug.childNodes.length == 1)
        amx.amxDebug.appendChild(document.createElement("br"));
      else
        amx.amxDebug.insertBefore(document.createElement("br"), amx.amxDebug.firstChild);
      amx.amxDebug.insertBefore(document.createTextNode(text), amx.amxDebug.firstChild);
      }
  };

  amx.log.debug = function(text)
      {
    if (amx.config.debug.enable)
    {
      addToOnScreenAmxLog(text);
        console.log(text);
      }
  };

  amx.log.error = function(text)
  {
    text = "AMX-ERROR: " + text;
    addToOnScreenAmxLog(text);
    console.log(text);
  };

  amx.log.warn = function(text)
  {
    text = "AMX-WARN: " + text;
    addToOnScreenAmxLog(text);
      console.log(text);
  };

  // Add the AMX-specific loading contributors so that base-core's
  // adf.mf.api.isLoading() API will consider AMX's needs:
  adf.mf.api.addLoadingContributor(function()
    {
      // Return true if these things are all idle/finished or false if at least
      // one is still busy/processing.
      var isIdle =
        adf.mf.api.amx.acceptEvent() &&
        (adf.mf.internal.amx._showLoadingCalls == 0) &&
        (adf.mf.internal.getUnresolvedCallDepth() == 0) &&
        (amx.getCurrentPageName() != null) &&
        adf.mf.internal.amx._pageBuildPromiseResolve == null &&
        !adf.mf.internal.amx.isUIChangePaused();
      if (!isIdle)
        return false; // short circuit; busy, still loading

      var animatingElements = document.getElementsByClassName("amx-animating")
      var animatingElementsCount = animatingElements.length;
      if (animatingElementsCount > 0)
      {
        // We need to look at every animating element and check whether it is using
        // display none styling
        for (var i = 0; i < animatingElementsCount; ++i)
        {
          if (animatingElements[i].style.display != "none")
            return false; // short circuit; found one non-display:none animation; busy
        }
      }

      var deferredLoadingElements = document.getElementsByClassName("amx-deferred-loading")
      var deferredLoadingElementCount = deferredLoadingElements.length;
      if (deferredLoadingElementCount > 0)
      {
        // We need to look at every deferred loading element and check whether it is using
        // display  none styling
        for (var i=0; i<deferredLoadingElementCount; ++i)
        {
          if (deferredLoadingElements[i].style.display != "none")
            return false; // short circuit; found one non-display:none indicator; busy
        }
      }

      return true; // idle, not loading
    });

})();

/**
 * Internal function for looping over object members.
 * @private
 */
adf.mf.internal.amx._each = function(obj, callback)
{
  for (var key in obj)
  {
    if (obj.hasOwnProperty(key))
      callback(key, obj[key]);
  }
};

// --------- /Config Initialization --------- //
/**
 * A counter for the numnber of calls made to showLoading indicator. This is required because there are several starting
 * points that can occur for long operations. The issue is that they can overlap so you are calling the start more then
 * once. The solution to this problem is to keep a count of the number of calls to start and increment this value. There
 * will be a corresponding number if calls to hide and when we get to zero we will do hiding.
 * @type {number}
 * @private
 */
adf.mf.internal.amx._showLoadingCalls = 0;

/**
 * Internal function called to bring up the loading indicator.
 * @private
 */
adf.mf.internal.amx._showLoadingIndicator = function()
{
  var loadingDiv = document.getElementById("amx-loading");
  var cl = loadingDiv.classList;
  cl.remove("hidden");        // get rid of the display:none
  cl.add("beforeShowing");    // now at display:block but with opacity:0
  cl.remove("beforeShowing"); // get rid of opacity:0
  cl.add("showing");          // animate to opacity:1

  // Let WAI-ARIA users know the page is loading
  var loadingLiveRegion = document.getElementById("amx-loading-live-region");
  if (loadingLiveRegion != null)
  {
    var msgLoading = adf.mf.resource.getInfoString("AMXInfoBundle", "MSG_LOADING");
    if (msgLoading == null) // will be null if too soon (e.g. initial page load)
      msgLoading = "Loading";
    loadingLiveRegion.textContent = msgLoading;
  }
};

/**
 * This function shows the busy indicator.
 * You are responsible for hiding the indicator or else it will be shown longer than necessary.
 * First consider whether you really need to use this API.
 * This function is generally targeted for component developers.
 * If you are an app developer, you might simply need to use amx:loadingIndicatorBehavior tag in
 * your page with its failSafeDuration attribute.
 * @param {number} failSafeDuration The approximate duration (non-negative integer in milliseconds) that the framework
 *                                  will wait between showing and hiding the loading indicator (assuming some other
 *                                  trigger has not already shown the indicator); if null or not specified, 10000 (10
 *                                  seconds) will be used instead.
 * @param {function() : string} failSafeClientHandler The optional JavaScript function that will be invoked when the failSafeDuration
 *                                         has been reached. This function can be used to decide how to proceed. This
 *                                         function must return a String that is one of these values:
 *                                         (a) "hide" (meaning just hide the indicator like the default fail-safe),
 *                                         (b) "repeat" (meaning restart the timer for another duration where the function
 *                                             may get invoked again), or
 *                                         (c) "freeze" (meaning keep the indicator up and wait indefinitely; the page may
 *                                             become stuck in a frozen state until restarted).
 */
adf.mf.api.amx.showLoadingIndicator = function(failSafeDuration, failSafeClientHandler)
{
  // This will set a timer to actually launch the busy indicator.
  // This is set on a timer to allow us to cancel this and not show any busy indicator if the action being
  // performed is less then 250ms.

  // If this is the first call to showing the Loading/Busy Indicator and we are not starting of the feature
  // then we have to set the timer to show the loading/busy indicator.
  if (adf.mf.internal.amx._showLoadingCalls == 0 && adf.mf.internal.amx._loadingIndicatorNotFirstTime == true)
  {
    adf.mf.internal.amx._showLoadingIndicator();

    // Need a failsafe timer that will guarantee that the loading indicator is removed.

    // The amx:view tag supports an amx:loadingIndicatorBehavior which lets you
    // define defaults for the page (see amx:view's render() function):
    var actualFailSafeDuration = adf.mf.internal.amx._failSafeDuration; // default is 10 seconds (10,000 ms)
    var actualFailSafeClientHandler = adf.mf.internal.amx._failSafeClientHandler;

    // If passed-in overrides were given, use those instead of the defaults:
    if (failSafeDuration !== undefined)
      actualFailSafeDuration = failSafeDuration;
    if (failSafeClientHandler !== undefined)
      actualFailSafeClientHandler = failSafeClientHandler;

    var failSafeTimerHandler = function()
    {
      var result = "hide";
      try
      {
        if (actualFailSafeClientHandler != null)
          result = actualFailSafeClientHandler();
      }
      catch (problem)
      {
        adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
          "adf.mf.api.amx.showLoadingIndicator", "MSG_PROBLEM_WHILE_INVOKING_FAIL_SAFE_HANDLER",
          problem);
      }

      if (adf.mf.internal.amx._failSafeTimer != null) // if still applicable
      {
        if (result == "freeze")
          return;
        else if (result == "repeat")
          adf.mf.internal.amx._failSafeTimer =
            window.setTimeout(failSafeTimerHandler, actualFailSafeDuration);
        else // "hide"
          adf.mf.internal.amx.killLoadingIndicator();
      }
    };

    adf.mf.internal.amx._failSafeTimer =
      window.setTimeout(failSafeTimerHandler, actualFailSafeDuration);
    // Set the number of calls to 1
    adf.mf.internal.amx._showLoadingCalls = 1;
  }
  else
  {
    // This is not the first call so we need to just increase the number of calls. This is neeeded as we will decrement
    // this value and when we hit zero then we will remove the loading/busy indicator.
    adf.mf.internal.amx._showLoadingCalls = adf.mf.internal.amx._showLoadingCalls + 1;
  }
};

/**
 * To ensure that the loading/busy indicator for some unknown reason is removed we have a failsafe timer that will
 * ensure that this is removed. This is required because the user will be unable to interact with the page as loading/
 * busy indicator is blocking all input.
 */
adf.mf.internal.amx.killLoadingIndicator = function()
{
  // Since the failsafe had to kick in we need to clear the timer and also delete the old timer.
  // Clear the timer so it is not called again.
  window.clearTimeout(adf.mf.internal.amx._failSafeTimer);
  // Need to delete the old timer
  delete adf.mf.internal.amx._failSafeTimer;
  // Need to reset the calls to 0
  adf.mf.internal.amx._showLoadingCalls = 0;
  // Transition the loading/busy indicator off.
  var loadingDiv = document.getElementById("amx-loading");
  var transitionEndFunction =
    function()
    {
      loadingDiv.classList.remove("hiding"); // no longer animating
      loadingDiv.classList.add("hidden");    // set display:none

      // Blank out the loading WAI-ARIA live region so that you won't hear the text when not loading
      var loadingLiveRegion = document.getElementById("amx-loading-live-region");
      if (loadingLiveRegion != null)
      {
        loadingLiveRegion.textContent = "";
      }

      // We are done with showing the initial HTML for the page:
      adf.mf.internal.api.queueShowPageComplete();
      adf.mf.internal.amx.addBuildGestureIfApplicable();
    };
  adf.shared.impl.animationUtils.addOneTimeTransitionEndWithFailsafe(
    loadingDiv,
    transitionEndFunction);

  loadingDiv.classList.remove("showing"); // get rid of opacity:1
  loadingDiv.classList.add("hiding");     // animate to opacity:0

  // if we are in test mode, then set the failsafe invoked flag
  if (amx.testmode)
  {
    amx.failsafeinvoked = true;
  }
};

/**
 * Hides one instance of the loading indicator.
 */
adf.mf.api.amx.hideLoadingIndicator = function()
{
  // This function will decrement the showLoadingIndicator calls.
  // Once attribute and when it goes to zero will start the process for hiding the loading/busy indicator.

  if (adf.mf.internal.amx._showLoadingCalls == 0)
    return;
  adf.mf.internal.amx._showLoadingCalls = adf.mf.internal.amx._showLoadingCalls - 1;
  if (adf.mf.internal.amx._showLoadingCalls == 0)
  {
    var loadingDiv = document.getElementById("amx-loading");
    var cl = loadingDiv.classList;
    cl.remove("showing"); // get rid of opacity:1
    cl.add("hiding");     // animate to opacity:0
    cl.remove("hiding");  // no longer animating
    cl.add("hidden");     // set display:none

    // Clear the failsafe timer so it is not called.
    window.clearTimeout(adf.mf.internal.amx._failSafeTimer);

    // Need to delete the old failsafe timer
    delete adf.mf.internal.amx._failSafeTimer;

    // Blank out the loading WAI-ARIA live region so that you won't hear the text when not loading
    var loadingLiveRegion = document.getElementById("amx-loading-live-region");
    if (loadingLiveRegion != null)
    {
      loadingLiveRegion.textContent = "";
    }
  }
};

/**
 * This is a special case for clearing the loading/busy indicator. On the initial load of the feature we set the style
 * on the DIV to show the loading indicator. This means there will be no call to hiding and instead call this function.
 * Unfortunalty this function will get called multiple times based on where this call had to put. This means we need
 * to make sure this is only called the once and we rely on the attribute being set for this.
 */
adf.mf.api.amx.hideLoadingIndicatorOnlyIfFirstTime = function()
{
  // If this is the first time this function is called then we will hide the loading/busy indicator.
  if (adf.mf.internal.amx._loadingIndicatorNotFirstTime == null)
  {
    // Based on the path taken to all this function there may have been other calls to showing. We need to ensure that
    // the counter has been set back to zero.
    adf.mf.internal.amx._showLoadingCalls = 0;
    adf.mf.internal.amx._loadingIndicatorNotFirstTime = true;
    var loadingDiv = document.getElementById("amx-loading");
    var transitionEndFunction = function()
      {
        loadingDiv.classList.remove("hiding"); // no longer animating
        loadingDiv.classList.add("hidden");    // set display:none

        // We are done with showing the initial HTML for the page:
        adf.mf.internal.api.queueShowPageComplete();
        adf.mf.internal.amx.addBuildGestureIfApplicable();
      };
    adf.shared.impl.animationUtils.addOneTimeTransitionEndWithFailsafe(
      loadingDiv,
      transitionEndFunction);

    loadingDiv.classList.remove("showing"); // get rid of opacity:1
    loadingDiv.classList.add("hiding");     // animate to opacity:0

    // MAX's use of iframes makes computed styles unfeasible; this may cause
    // other problems for MAX.
    if (adf.mf.internal.amx.getComputedStyle(loadingDiv).opacity == 0 ||
        adf.mf.internal.amx.isMobileApplicationAcceleratorMode())
    {
      // Already at zero opacity so no transition will take place, clean up now:
      transitionEndFunction();
    }

    var incompatible = adf.mf.internal.amx.agent["incompatible"];
    if (incompatible)
    {
      // Log the warning:
      adf.mf.log.logInfoResource(
        "AMXInfoBundle",
        adf.mf.log.level.SEVERE,
        "_getAgentTypeAndVersion",
        "MSG_ERROR_UNSUPPORTED_BROWSER",
        incompatible);

      // Show the warning to the user so they can take action:
      if (!adf.mf.environment.profile.dtMode && // not in DT mode
        !adf.suppressUnsupportedBrowserError) // isn't suppressing the warning
      {
        var unsupportedBrowserError =
          adf.mf.resource.getInfoString(
            "AMXInfoBundle",
            "MSG_ERROR_UNSUPPORTED_BROWSER",
            incompatible);
        alert(unsupportedBrowserError);
      }
    }
  }
  else
  {
    adf.mf.api.amx.hideLoadingIndicator();
  }
};

/**
 * When an app is deployed using debug mode, allow repeated taps on the page
 * that occur within a set time limit to cause build information to be displayed
 * to the user.
 */
adf.mf.internal.amx.addBuildGestureIfApplicable = function()
{
  if (adf._debugBodyPageTapCount == null)
  {
    adf._debugBodyPageTapCount = [ 0, 0 ]; // tap count, timestamp
    var bodyPage = document.getElementById("bodyPage");
    if (bodyPage != null &&
        bodyPage.classList.contains("amx-debug"))
    {
      adf.mf.api.amx.addBubbleEventListener(
        bodyPage,
        "touchend",
        function(event)
        {
          var currentTime = (new Date()).getTime();

          // Have we surpassed the limit for repeated tapping?
          if (currentTime - adf._debugBodyPageTapCount[1] > 3000)
            adf._debugBodyPageTapCount = [ 1, currentTime ]; // exceeded time limit
          else
            ++adf._debugBodyPageTapCount[0]; // increment the tap counter

          if (adf._debugBodyPageTapCount[0] == 10) // tapped enough times
          {
            var buildInfo = adf.mf.internal.BUILD_INFO;
            if (buildInfo != null)
            {
              var productVersion = buildInfo["PRODUCT_VERSION"];
              var jobName = buildInfo["JOB_NAME"];
              var buildNumber = buildInfo["BUILD_NUMBER"];

              // Do not show an alert if there is nothing to display or if we are
              // in automation mode (don't want to interfere with testing when
              // rapidly tapping).
              if (productVersion != "?" &&
                document.getElementById("bodyPage").className.indexOf("amx-automation") == -1)
              {
                var buildInfo = "Oracle MAF " + productVersion + " - " + jobName + " " + buildNumber;
                adf.mf.api.amx.addMessage("info", buildInfo, null, null);
              }
            }
          }
        });
    }
  }
};

/**
 * Bulk load a set of providers so they cached and accessibly locally.
 * @param {Object} treeNodeIterator is the tree node iterator to load the provider from
 * @param {number} startingPoint to load from, typically 0 but recursive calls will change those to
 *        be page/set boundary markers
 * @param {number} numberOfRows to load up to the number of providers in the collection. Represents
 *        the total number of rows, not relative to the starting point
 * @param {function} success the callback to invoke when all the providers have been loaded
 * @param {function} failed the callback to invoke on error
 */
adf.mf.api.amx.bulkLoadProviders = function(
  treeNodeIterator,
  startingPoint,
  numberOfRows,
  success,
  failed)
{
  var navigationIdAtStart = adf.mf.internal.amx._navigationId;
  var scb = success;
  var fcb = failed;

  var tnb = treeNodeIterator.getTreeNodeBindings();

  // Get the number of cached rows after the starting point
  var cachedRows = treeNodeIterator.getCachedRowCount(startingPoint);
  // Get the total number of rows in the collection model (not just cached)
  var maxRows = tnb.keys.length;
  // Get the desired number of rows that should be cached (from 0, aka total)
  var desiredRowCount =
    (
      (numberOfRows == -1) ||
      (maxRows < numberOfRows &&
        (
          !tnb ||
          !tnb.hasMoreKeys
        )
      )
    ) ? maxRows : numberOfRows;

  if (cachedRows + startingPoint < desiredRowCount)
  {
    // fetch more data - note this will call nextSet and then recurse to fetch any remaining rows
    // if need be
    var newIndex = startingPoint + cachedRows;
    var isFetchingMoreRows = false;
    if (newIndex < 0)
    {
      newIndex = 0;
    }
    else if (newIndex >= maxRows)
    {
      newIndex = maxRows - 1;
      isFetchingMoreRows = true;
    }
    treeNodeIterator.setCurrentIndex(newIndex);

    var hasMoreKeys = tnb.hasMoreKeys;

    treeNodeIterator.nextSet(
      function()
      {
        // If the page has been navigated when we got here after we started the load, then
        // there's nothing for us to do with the fetched data so we must ignore it:
        if (navigationIdAtStart != adf.mf.internal.amx._navigationId)
        {
          var loadIgnoredMessage =
            adf.mf.resource.getInfoString(
              "AMXErrorBundle", "ERROR_BULK_LOAD_IGNORED_DUE_TO_NAVIGATION");
          fcb(loadIgnoredMessage, null); // invoke failure callback; load was invalid
          return;
        }

        // See if the last call was supposed to load more than the maximum number of rows
        if (isFetchingMoreRows)
        {
          tnb = treeNodeIterator.getTreeNodeBindings();
          var newMaxRows = tnb.keys.length;
          if (newMaxRows <= maxRows)
          {
            if (!tnb.hasMoreKeys && hasMoreKeys)
            {
              // If the flag for hasMoreKeys was true but is now false, then the load was
              // successful but there were no rows to be loaded
              scb(null, null);
              return;
            }
            else
            {
              // See if the number of cached rows changed. If so, then call the success callback,
              // else treat this as a failure since no rows were loaded with no apparent reason
              var newCachedRows = treeNodeIterator.getCachedRowCount(startingPoint);

              // Get the total number of rows in the collection model (not just cached)
              if (newCachedRows > cachedRows)
              {
                scb(null, null);
              }
              else
              {
                fcb(null, null);
              }
              return;
            }
          }
        }

        if (isFetchingMoreRows)
        {
          ++newIndex;
        }
        adf.mf.api.amx.bulkLoadProviders(treeNodeIterator, newIndex, desiredRowCount,
          success, failed);
      },
      fcb);
  }
  else
  {
    // we have the data already cached
    try
    {
      scb(null, null);
    }
    catch(fe)
    {
      fcb(fe, null);
    }
  }
};

// ------ amx UI ------ //
(function()
{
  // this tells if the app is transitioning something (events should be frozen when doing so)
  amx.transitioning = false;

  amx.acceptEvent = function()
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "amx.acceptEvent", "MSG_DEPRECATED", "amx.acceptEvent", "adf.mf.api.amx.acceptEvent");
    return adf.mf.api.amx.acceptEvent();
  };

  /**
   * Determines whether an event can be processed.
   * @return {Boolean} whether it is safe to proceed with event processing (not in the middle of a transition)
   */
  adf.mf.api.amx.acceptEvent = function()
  {
    return !amx.transitioning && !adf.mf.environment.profile.dtMode;
  };

  amx.getCurrentPageName = function()
  {
    var currentPage = document.querySelector(".amx-view-container.current");
    if (currentPage != null)
      return currentPage.getAttribute("data-pagename");
    return null;
  };

  /**
   * Determines whether the environmentMode is set to mobileApplicationAccelerator.
   * @return {Boolean} true if environmentMode is set to mobileApplicationAccelerator, otherwise false.
   */
  adf.mf.internal.amx.isMobileApplicationAcceleratorMode = function ()
  {
    if (adf.mf.environment.profile.environmentMode == "mobileApplicationAccelerator")
    {
      return true;
    }
    return false;
  };

  amx.hooks = {};
  // ------ Public API ------ //
  var isFirstPage = true;
  var initPromise = null;

  //  Let the navigation handler manage view history and the MfContextInstance.
  adf.mf.internal.useNavHandlerViewHistory = true;

  /**
   * @deprecated Use amxNode.getVolatileState instead.
   */
  adf.mf.api.amx.getVolatileState = function(amxNodeId)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "adf.mf.api.amx.getVolatileState", "MSG_DEPRECATED", "adf.mf.api.amx.getVolatileState",
      "amxNode.getVolatileState");

    var stateValue = adf.mf.internal.amx._getVolatileStateMap();

    if (amxNodeId == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_ASSOCIATING_VOLATILE_STATE",
          amxNodeId));
    }
    else if (stateValue == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_VOLATILE_STATE_NOT_AVAILABLE",
          stateValue));
    }
    else
    {
      var payloadJsonObject = stateValue[amxNodeId];
      return payloadJsonObject;
    }
  };

  /**
   * @deprecated Use amxNode.setVolatileState instead.
   */
  adf.mf.api.amx.setVolatileState = function(amxNodeId, payloadJsonObject)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "adf.mf.api.amx.setVolatileState", "MSG_DEPRECATED", "adf.mf.api.amx.setVolatileState",
      "amxNode.setVolatileState");

    var stateValue = adf.mf.internal.amx._getVolatileStateMap();

    if (amxNodeId == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_ASSOCIATING_VOLATILE_STATE",
          amxNodeId));
    }
    else if (stateValue == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_VOLATILE_STATE_NOT_AVAILABLE",
          stateValue));
    }
    else
    {
      stateValue[amxNodeId] = payloadJsonObject;
    }
  };

  adf.mf.internal.amx._getVolatileStateMap = function()
  {
    if (adf.mf.environment.profile.dtMode && adf.mf.internal.amx._volatileStateMap == null)
    {
      // This is needed because the controller will not call setMfContextInstance in DT mode:
      adf.mf.internal.amx._volatileStateMap = {};
    }
    return adf.mf.internal.amx._volatileStateMap;
  };

  /**
   * @deprecated Use amxNode.getClientState instead.
   */
  adf.mf.api.amx.getClientState = function(amxNodeId)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "adf.mf.api.amx.getClientState", "MSG_DEPRECATED", "adf.mf.api.amx.getClientState",
      "amxNode.getClientState");

    var stateValue = adf.mf.internal.amx._getClientStateMap();
    if (amxNodeId == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_ASSOCIATING_CLIENT_STATE",
          amxNodeId));
    }
    else if (stateValue == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_CLIENT_STATE_NOT_AVAILABLE",
          stateValue));
    }
    else
    {
      var payloadJsonObject = stateValue[amxNodeId];
      return payloadJsonObject;
    }
  };

  /**
   * @deprecated Use amxNode.setClientState instead.
   */
  adf.mf.api.amx.setClientState = function(amxNodeId, payloadJsonObject)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "adf.mf.api.amx.setClientState", "MSG_DEPRECATED", "adf.mf.api.amx.setClientState",
      "amxNode.setClientState");
    var stateValue = adf.mf.internal.amx._getClientStateMap();
    if (amxNodeId == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_ASSOCIATING_CLIENT_STATE",
          amxNodeId));
    }
    else if (stateValue == null)
    {
      throw new Error(
        adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_CLIENT_STATE_NOT_AVAILABLE",
          stateValue));
    }
    else
    {
      stateValue[amxNodeId] = payloadJsonObject;
    }
  };

  /**
   * Using true for the following flag results in "oracle.adfmf.framework - adf.mf.el - setValue] Since the
   * java is not available we will skip the remote write." failure messages when attempting to navigate.
   * @private
   */
  adf.mf.internal.amx._useBruceApproach = (adf.mf.api.getQueryStringParamValue(adf.mf.api.getQueryString(), "useBruceWay") == "true");

  adf.mf.internal.amx._getClientStateMap = function()
  {
    var stateValue;
    if (adf.mf.internal.amx._useBruceApproach)
    {
      var stateName = "#{bindings.amxInternalClientState}";
      if ((stateValue = adf.mf.el.getLocalValue(stateName)) === undefined)
      {
        stateValue = {};
        var getFailed  = function(req, message)
        {
          throw new Error(
            adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_CLIENT_STATE_ACCESS_FAILED",
              message));
        };
        adf.mf.el.setLocalValue({"name":stateName, "value":stateValue}, function(){}, getFailed);
      }
    }
    else // don't use Bruce's way
    {
      if (adf.mf.environment.profile.dtMode && adf.mf.internal.amx._nonBruceClientStateMap == null)
      {
        // This is needed because the controller will not call setMfContextInstance in DT mode:
        adf.mf.internal.amx._nonBruceClientStateMap = {};
      }
      stateValue = adf.mf.internal.amx._nonBruceClientStateMap;
    }

    return stateValue;
  };

  /**
   * Establish (or re-establish) the mfContext instance for the page that the user will now be interacting with.
   * Used by the controller's navigation handler during tansition to a new view.
   * @param viewHistoryItem  the view history stack entry associtated with the current view.
   * @param brandNewInstance is this a new view instance or an existing one (e.g. a back navigation)?
   * @export
   */
  adf.mf.internal.amx.setMfContextInstance = function(viewHistoryItem, brandNewInstance)
  {
    // Prepare the client state map (the bucket that survives navigation):
    if (adf.mf.internal.amx._useBruceApproach)
    {
      var pageDef    = viewHistoryItem.amxPage;
      var resetState = false; // per Bruce, use false here (may in the future consider how brandNewInstance plays into it)
      var reSync     = false; // per Bruce, use false here (may in the future consider how brandNewInstance plays into it)
      var resetViewScope = adf.mf.internal.lastNavIsNewView;
      var setFailed  = function(req, message)
      {
        throw new Error(
          adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_MF_CONTEXT_SET_FAILED",
            message));
      };
      adf.mf.api.setCurrentContext(pageDef, resetState, reSync, resetViewScope, function(){}, setFailed);
    }
    else // don't use Bruce's way
    {
      if (viewHistoryItem._nonBruceClientStateMap == null)
      {
        viewHistoryItem._nonBruceClientStateMap = {};
      }
      adf.mf.internal.amx._nonBruceClientStateMap = viewHistoryItem._nonBruceClientStateMap;
    }

    // Prepare a fresh volatile state map (the bucket that resets at navigation):
    adf.mf.internal.amx._volatileStateMap = {};
  };

  /**
   * Remove the mfContext instance for the page that the user will now be leaving.
   * Used by the controller's navigation handler during tansition to a new view.
   * @param viewHistoryItem  the view history stack entry associtated with the view to be removed.
   * @export
   */
  adf.mf.internal.amx.removeMfContextInstance = function(viewHistoryItem)
  {
    // Purge the client state map (the bucket that survives navigation) since this instance will never be used again:
    if (adf.mf.internal.amx._useBruceApproach)
    {
      var pageDef      = viewHistoryItem.amxPage;
      var instanceId   = viewHistoryItem.itemId;
      var removeFailed = function(req, message)
      {
        throw new Error(
          adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_MF_CONTEXT_REMOVE_FAILED",
            message));
      };
      adf.mf.api.removeContextInstance(pageDef, instanceId, function(){}, removeFailed);
    }
    else // don't use Bruce's way
    {
      adf.mf.internal.amx._nonBruceClientStateMap = null;
    }
  };

  adf.mf.internal.amx._purgeOnNav = function()
  {
    // Purge any elements that might be disconnected from the bodyPage.
    // Examples: inputDate and selectManyChoice pickers on Android.
    var elementsToPurge = document.getElementsByClassName("amx-purge-on-nav");
    for (var i=elementsToPurge.length-1; i>=0; --i)
      adf.mf.api.amx.removeDomNode(elementsToPurge[i]);
  };

  adf.mf.internal.amx._handlePageTransition = function(transitionType, isBack, currentElement, newElement, alwaysFunction)
  {
    if (adf.mf.internal.amx._pageTransitionCancelFunction != null)
      adf.mf.internal.amx._pageTransitionCancelFunction();

    // Ensure prerequisites are met:
    currentElement.style.display = "block";
    newElement.style.display = "block";
    newElement.classList.remove("new");
    newElement.classList.add("current");

    var properties = {};
    properties["parentFlipAllowed"] = true; // no other visible siblings plus parent and grandparent have equal dimensions
    properties["dimensionsFromParent"] = true;
    properties["finishedFunction"] = alwaysFunction;
    properties["callbackParams"] = [];
    properties["animationEnabled"] = true;
    properties["isRtl"] = document.documentElement.dir == "rtl";
    properties["fineLogger"] = function(message)
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINER,
        "adf.mf.internal.amx", "_handlePageTransition", message);
    };

    if (isBack)
    {
      if (transitionType.indexOf("Start") != -1)
        transitionType = transitionType.replace(/Start/, "End");
      else if (transitionType.indexOf("End") != -1)
        transitionType = transitionType.replace(/End/, "Start");
      else if (transitionType.indexOf("Left") != -1)
        transitionType = transitionType.replace(/Left/, "Right");
      else if (transitionType.indexOf("Right") != -1)
        transitionType = transitionType.replace(/Right/, "Left");
      else if (transitionType.indexOf("Up") != -1)
        transitionType = transitionType.replace(/Up/, "Down");
      else if (transitionType.indexOf("Down") != -1)
        transitionType = transitionType.replace(/Down/, "Up");
      else if ("slide" == transitionType)
        transitionType = "slideEnd";
      else if ("flip" == transitionType)
        transitionType = "flipEnd";
    }

    adf.mf.internal.amx._pageTransitionCancelFunction =
      adf.shared.impl.animationUtils.transition( // WARNING this is impl (not a public API) and will change without notice
        transitionType,
        currentElement,
        newElement,
        properties);
  };

  /**
   * Checks and logs windows event leaks in debug mode.
   * @param callerFunctionName name of caller function to display in log
   * @private
   */
  adf.mf.internal.amx._checkForWindowsEventLeaks = function(callerFunctionName)
  {
      if ("release" != adf.mf.internal.BUILD_CONFIGURATION) // if debug mode...
      {
        // Check for window event leaks:
        var windowEventDebugString = adf.mf.api.amx.getEventDebugString(window, 200);
        if ("DOM events: \n  n/a\nSpecial events:\n  n/a" != windowEventDebugString)
        {
          adf.mf.log.logInfoResource("AMXInfoBundle",
                                      adf.mf.log.level.SEVERE,
                                      callerFunctionName,
                                      "MSG_WINDOW_EVENT_LEAKS",
                                      "\n" + windowEventDebugString);
        }
      }
  };

  /**
   * @deprecated
   */
  amx.doNavigation = function(outcome)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.WARNING, "doNavigation",
      "MSG_DEPRECATED", "amx.doNavigation", "adf.mf.api.amx.doNavigation");
    adf.mf.api.amx.doNavigation.apply(this, arguments);
  };

  adf.mf.api.amx.doNavigation = function(outcome)
  {
    adf.mf.internal.amx._queueCriticalSectionFunction(
      doNavigationImpl,
      this,
      outcome);
  };
  
  // Global value to indicate if the last navigation resulted in a new view.
  adf.mf.internal.lastNavIsNewView = true;
  
  function doNavigationImpl(outcome)
  {
    var perfOp = adf.mf.internal.perf.startMonitorOperation("Perform navigation", adf.mf.log.level.FINE, "adf.mf.api.amx.doNavigation");
    adf.mf.api.amx.showLoadingIndicator();
    adf.mf.internal.triggerEvent(
      document,
      "Events",
      "amxnavigatestart",
      false,
      false,
      null,
      {
        "outcome": outcome
      });

    var promise = new adf.mf.internal.BasePromise(function(resolve, reject)
      {
    if (!amx.containsELExpressions (outcome))
    {
      // no el expressions detected, just pass outcome as-is
          resolve(outcome);
    }
    else
    {
      var invokeCallback = function(req,res)
      {
            resolve(res);
      };
      try
      {
        // Assume that this is a method expression that returns a String.
        // Also, we do not care if it is a success or failure - any exception passed back
        // will be converted properly below via the amx.getObjectValue call.
        adf.mf.el.invoke(outcome,[],"java.lang.String",[], invokeCallback, invokeCallback);
      }
      catch(e)
      {
        // just invoke the callback
        invokeCallback(outcome, e);
      }
    }
      });

    promise.then(
      function(outcome)
    {
      var navRequest = {};
      navRequest.currentViewId = adf.mf.internal.controller.ViewHistory.peek().viewId;
      // be sure to convert from any json type structures to something
      // usable by javascript
      navRequest.outcome = amx.getObjectValue(outcome);

      var navSuccess = function(req, result)
      {
        var transitionType = result.getTransitionType();
        var amxPage = result.getVdlDocumentPath();
        var isBack = result.isBackNavigation();
        adf.mf.internal.lastNavIsNewView = result.isNewViewId();

        if (transitionType == "none")
          transitionType = null;

        // We did not find a target for navigation, so exit early. This is a valid case
        // and Faces behaves similarly. It allows developers to return "null" or an invalid
        // target and stay on the same page. If we do not exit here, the bindings will be
        // cleared and not re-initialized
        if (amxPage == null)
        {
          adf.mf.api.amx.hideLoadingIndicator();
          return;
        }

        // before attempting to navigate, make sure all popups are closed
        // NOTE: amx-popup is lazily loaded, so we must check for the existence
        // of the function before calling it
        if (adf.mf.internal.amx.closePopups)
        {
          adf.mf.internal.amx.closePopups();
        }

        // Before we strip off the IDs, call the destroy methods on any AMX nodes
          var current = document.querySelector("#bodyPageViews > .current");
          adf.mf.internal.amx.processDestroy(current);

        // Strip off any ID attributes on the old page's elements. This will prevent any issues
        // with getElementById finding elements on the old page instead of the new page.
          if (current != null)
        {
            adf.mf.internal.amx.stripIds(current);
        }

        if (adf.mf.internal.amx.isTransitionAfterRender(false)) // render before transitioning
        {
            adf.mf.api.amx.displayAmxPage(amxPage).then(function(page)
          {
            var perf = adf.mf.internal.perf.startMonitorCall("Transition to page", adf.mf.log.level.FINER, "adf.mf.api.amx.doNavigation:transition");

            try
            {
                var newPage = page;

              if (transitionType != null)
              {
                amx.transitioning = true;

                // Purge any elements that might be disconnected from the bodyPage:
                adf.mf.internal.amx._purgeOnNav();

                adf.mf.internal.amx._handlePageTransition(
                    transitionType, isBack, current, newPage,
                  function()
                  {
                    amx.transitioning = false;
                    adf.mf.api.amx.hideLoadingIndicator();
                      adf.mf.api.amx.removeDomNode(current);
                    adf.mf.internal.amx._pageTransitionCancelFunction = null;
                    adf.mf.internal.triggerEvent(
                      document,
                      "Events",
                      "amxnavigateend",
                      false,
                      false,
                      null,
                      {
                        "outcome": outcome,
                        "amxPage": amxPage
                      });
                    perf.stop();
                  });
              }
              else
              {
                adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.WARNING,
                  "doNavigation", "MSG_NOT_TRANSITIONING");
                amx.transitioning = true;

                // Purge any elements that might be disconnected from the bodyPage:
                adf.mf.internal.amx._purgeOnNav();

                // we just show it.
                  current.classList.remove("current");
                  current.classList.add("old");
                  newPage.classList.remove("new");
                  newPage.classList.add("current");
                  adf.mf.internal.amx.processDestroy(current);
                  adf.mf.api.amx.removeDomNode(current);
                amx.transitioning = false;
                adf.mf.api.amx.hideLoadingIndicator();
                adf.mf.internal.triggerEvent(
                  document,
                  "Events",
                  "amxnavigateend",
                  false,
                  false,
                  null,
                  {
                    "outcome": outcome,
                    "amxPage": amxPage
                  });
                perf.stop();
              }
            }
            catch (e)
            {
              perf.stop();
              throw e;
            }
          });
        }
        else // use placeholder transitioning
        {
          // Transition to blank immediately, don't wait for the new page to be present:
          amx.transitioning = true;

          // Purge any elements that might be disconnected from the bodyPage:
          adf.mf.internal.amx._purgeOnNav();

          amx._stillTransitioningAway = true;
          amx._stillDisplayingAmxPage = true;
          var viewContainerElement = adf.mf.internal.amx._createViewContainerElement();
            var newPage = viewContainerElement;
          if (transitionType != null)
          {
              adf.mf.internal.amx._handlePageTransition(transitionType, isBack, current, viewContainerElement, function()
            {
              amx._stillTransitioningAway = false;
              amx.transitioning = (amx._stillDisplayingAmxPage || amx._transitioningAway);
                adf.mf.api.amx.removeDomNode(current);
              adf.mf.internal.amx._pageTransitionCancelFunction = null;
            });
          }
          else
          {
            adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.WARNING, "doNavigation", "MSG_NOT_TRANSITIONING");
            amx._stillTransitioningAway = false;
            // we just show it.
              current.classList.remove("current");
              current.classList.add("old");
              newPage.classList.remove("new");
              newPage.classList.add("current");
              adf.mf.internal.amx.processDestroy(current);
              adf.mf.api.amx.removeDomNode(current);
          }

            adf.mf.api.amx.displayAmxPage(amxPage).then(function(page)
          {
            amx._stillDisplayingAmxPage = false;
            amx.transitioning = (amx._stillDisplayingAmxPage || amx._stillTransitioningAway);
            adf.mf.api.amx.hideLoadingIndicator();
            adf.mf.internal.triggerEvent(
              document,
              "Events",
              "amxnavigateend",
              false,
              false,
              null,
              {
                "outcome": outcome,
                "amxPage": amxPage
              });
          });
        }
      };

      var navFailed = function(req, message)
      {
        adf.mf.api.amx.hideLoadingIndicator();
        throw new Error(
          adf.mf.resource.getInfoString("AMXErrorBundle", "ERROR_NAVIGATION_FAILED", message));
      };

      // Give renderers a chance to save off anything they want to preserve (e.g. scroll positions):
        var current = document.querySelector("#bodyPageViews > .current");
        adf.mf.internal.amx.processPreDestroy(current);

      // if debug mode...
      // Check for window event leaks
      adf.mf.internal.amx._checkForWindowsEventLeaks("doNavigation");

      adfc.NavigationHandler.handleNavigation(navRequest, navSuccess, navFailed);

        perfOp.stop();
      },
      function()
      {
        perfOp.stop();
      });

    return promise;
  }

  var initQueue = [];
  var postDisplayQueue = [];

  /**
   * This should only be called by adf.mf.api.amx.removeDomNode().
   * Remove an AMXNode for a given DOM node. Calls any pre-destroy and destroy methods
   * on the type handlers for nodes removed as a result of this call and then removes
   * the HTML from the page.
   * @param  {Node} domNode the HTML DOM node to remove. Must be a root DOM node for an
   *         AMX node.
   * @return {boolean} true if the node is a DOM node that represents an AMX node and
   *         was removed.
   */
  adf.mf.internal.amx.removeAmxDomNode = function(domNode)
  {
    var amxNode = adf.mf.internal.amx._getNonPrimitiveElementData(domNode, "amxNode");
    if (amxNode != null)
    {
      adf.mf.internal.amx.processPreDestroy(domNode);
      adf.mf.internal.amx.processDestroy(domNode);
      return true;
    }

    return false;
  };

  adf.mf.internal.amx.processPreDestroy = function(parent)
  {
    // Find all elements that have a preDestroy implementation (including parent)
    var childrenWithPreDestroy = parent.querySelectorAll(".amx-has-predestroy");

    var handlePreDestroy =
      function(domNode)
      {
        var amxNode = adf.mf.internal.amx._getNonPrimitiveElementData(domNode, "amxNode");
        var nodeTypeHandler = amxNode.getTypeHandler();
        if (nodeTypeHandler && nodeTypeHandler.preDestroy)
        {
          // Prevent duplicate preDestroy calls:
          if (domNode.getAttribute("data-predestroyed") == null)
          {
            domNode.setAttribute("data-predestroyed", true);

            /**
             * Renderer function so you can be notified just before the current view is destroyed;
             * when about to navigate to a new view.
             * @param domNode the root DOM node associated with this renderer
             * @param amxNode the AMX component object associated with this renderer
             */
            nodeTypeHandler.preDestroy(domNode, amxNode);
          }
        }
      };

    if (parent.classList.contains("amx-has-predestroy"))
      handlePreDestroy(parent);
    for (var i=0, count=childrenWithPreDestroy.length; i<count; ++i)
      handlePreDestroy(childrenWithPreDestroy[i]);
  };

  adf.mf.internal.amx.processDestroy = function(parent)
  {
    // Find all elements that have a destroy implementation (including parent)
    var childrenWithDestroy = parent.querySelectorAll(".amx-has-destroy");

    var handleDestroy =
      function(domNode)
      {
        var amxNode = adf.mf.internal.amx._getNonPrimitiveElementData(domNode, "amxNode");
        var nodeTypeHandler = amxNode.getTypeHandler();
        if (nodeTypeHandler && nodeTypeHandler.destroy)
        {
          // Prevent duplicate destroy calls:
          if (domNode.getAttribute("data-destroyed") == null)
          {
            domNode.setAttribute("data-destroyed", true);

            nodeTypeHandler.destroy(domNode, amxNode);
          }
        }
      };

    if (parent.classList.contains("amx-has-predestroy"))
      handleDestroy(parent);
    for (var i=0, count=childrenWithDestroy.length; i<count; ++i)
      handleDestroy(childrenWithDestroy[i]);
  };

  /**
   * This function processes the amxNodes registered by the amx.queueForInit and
   * calls 'init' function on their related typeHandlers.
   *
   * The processing of the queue takes place immediatelly after the rendering
   * of the amx tree or application of the updates to the amx tree.
   *
   * The amxNodes are processed in the same hierarchical order as they are
   * rendered.
   */
  amx.processAndCleanInitQueue = function()
  {
    _processAndCleanQueue(initQueue, "init");
  };

  /**
   * This function processes the amxNodes registered by the amx.queueForPostDisplay and
   * calls 'postDisplay' function on their related typeHandlers.
   *
   * The processing of the queue takes place immediatelly after the processing of the
   * init queue.
   *
   * The amxNodes are processed in the same hierarchical order as they are
   * rendered.
   *
   * The amxNodes that are currently outside of the document will not be processed.
   */
  amx.processAndCleanPostDisplayQueue = function()
  {
    _processAndCleanQueue(postDisplayQueue, "postDisplay");
  };

  /**
   * This is implementation of the queue processing used for the init and post display queues.
   *
   * The amxNodes are processed in the same hierarchical order as they are
   * rendered.
   *
   * @param queue {Array<Object>} queue which will be processed.
   * @param method {String} function to be called on typeHandler of each amxNode in the queue.
   */
  var _processAndCleanQueue = function(queue, method)
  {
    if (queue.length > 0 && method != null)
    {
      var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);
      // sort queue by depth to ensure that the nodes are processed in hierarchical order
      adf.mf.api.amx.AmxNode.__sortNodesByDepth(queue);
      // processing the queue with shift enable to handle concurent addition of the
      // amxNodes into the queue
      var amxNode;
      while ((amxNode = queue.shift()) != null)
      {
        // try to get fresh domNode
        // using getElementById ensures that the domNode is already in document
        // in all other cases there is no reason to process it since it is
        // not initable or displayable amxNode
        var domNode = document.getElementById(amxNode.getId());
        if (domNode != null)
        {
          var nodeTypeHandler = amxNode.getTypeHandler();
          // verify that the typeHandler implements current method
          if (adf.mf.internal.amx.implementsFunction(nodeTypeHandler, method))
          {
            if (isFinestLoggingEnabled)
            {
              adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
                "amx", "_processAndCleanQueue",
                "Invoking the \'" + method + "\' method on the type handler for node " +
                amxNode.getId());
            }
            // invoke typeHandler function for current AmxNode
            nodeTypeHandler[method](domNode, amxNode);
          }
          else
          {
            adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.WARNING,
              "_processAndCleanQueue", "MSG_CANT_" + method.toUpperCase() + "_NODE", domNode);
          }
        }
      }
    }
  };

  /**
   * This function enques the amxNode to the end of the init processing queue.
   *
   * The queue itself will be processed after the render phase where all
   * newly rendered or rerendered amxNodes are inserted into the document.
   *
   * Nodes that are currently outside of the document will not be processed.
   *
   * The amxNodes are processed in the same hierarchical order as they are
   * rendered.
   *
   * @param amxNode {Object} node which typeHandler supports init method
   */
  amx.queueForInit = function(amxNode)
  {
    if (amxNode != null)
    {
      initQueue[initQueue.length] = amxNode;
    }
  };

  /**
   * This function enques the amxNode to the end of the post display processing queue.
   *
   * The queue itself will be processed after the init phase where all
   * amxNodes from init queue (registered by the #queueForInit function)
   * are processed.
   *
   * Nodes that are currently outside of the document will not be processed.
   *
   * The amxNodes are processed in the same hierarchical order as they are
   * rendered.
   *
   * @param amxNode {Object} node which typeHandler supports postDisplay method
   */
  amx.queueForPostDisplay = function(amxNode)
  {
    if (amxNode != null)
    {
      postDisplayQueue[postDisplayQueue.length] = amxNode;
    }
  };

  /**
   * Create and insert a new view container element (no content yet).
   * @return {HTMLElement} the newly-created view container element
   * @private
   */
  adf.mf.internal.amx._createViewContainerElement = function()
  {
    var viewContainerElement = document.createElement("div");
    viewContainerElement.className = "amx-view-container new";
    // TODO consider injecting placeholder DOM here so it isn't completely blank
    document.getElementById("bodyPageViews").appendChild(viewContainerElement);
    return viewContainerElement;
  };

  /**
   * Processes all the bundles on the page
   * @private
   * @param {adf.mf.api.amx.AmxTag} amxTag the root tag of the page
   * @return {Object} promise object that is resolved once all bundles have been loaded
   */
  function loadBundles(amxTag)
  {
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
    if (adf.mf.environment.profile.dtMode)
    {
          resolve();
    }
    else
    {
      // amx:loadBundle only allowed under the root tag of the page
      // or the fragment
      var bundles = amxTag.getChildren(
        adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
        "loadBundle");

          var childPromises = [];
      var numBundles = bundles.length;

      if (numBundles == 0)
      {
            resolve();
      }
      else
      {
        for (var i = 0; i < numBundles; ++i)
        {
          var bundleTag = bundles[i];
          var basename = bundleTag.getAttribute("basename");
          var variable = bundleTag.getAttribute("var");

              var loadPromise = amx.loadBundle(basename, variable);
              childPromises.push(loadPromise);

              adf.mf.internal.BasePromise.all(childPromises).then(
              function()
              {
                  resolve();
                },
              function()
              {
                  reject.apply(null, arguments);
              });
        }
      }
    }
      });
  }

  /**
   * Load and display an AMX page.
   * @param {Object} amxPageName the name of the page to load
   * @return {Object} promise object that is resolved once the page has been rendered. Currently
   *         resolved with the DOM node for the view container element
   */
  adf.mf.api.amx.displayAmxPage = function(amxPageName) /* used by base-controller.js */
  {
    adf.mf.api.amx.showLoadingIndicator();
    var that = this;
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
    adf.mf.internal.amx._queueCriticalSectionFunction(
      displayAmxPageImpl,
          that,
          amxPageName,
          {
            "resolve": resolve,
            "reject": reject
          });
      });
  };

  /**
   * Object to track AMX nodes that are busy. This is used for performance to track when a page has
   * fully loaded or after a page has fully reacted to a data change event after an AMX event has
   * been queued.
   *
   * @constructor
   */
  function PageBusyTracker()
  {
    this._operations = [];
    this._nodeCount = 0;
  }

  /**
   * Sets the node count to zero. Used when a new page is being loaded
   */
  PageBusyTracker.prototype.reset = function()
  {
    this._nodeCount = 0;

    adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
      "adf.mf.internal.amx._pageWaitingInformation", "reset",
      "Node count has been reset");
  };

  /**
   * Increments the number of nodes waiting on a condition.
   */
  PageBusyTracker.prototype.increment = function()
  {
    ++this._nodeCount;

    if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "adf.mf.internal.amx._pageWaitingInformation", "increment",
        "Nodes in a waiting state is now " + this._nodeCount);
    }
  };

  /**
   * Decrements the number of nodes waiting on a condition.
   */
  PageBusyTracker.prototype.decrement = function()
  {
    --this._nodeCount;

    if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "adf.mf.internal.amx._pageWaitingInformation", "decrement",
        "Nodes in a waiting state is now " + this._nodeCount);
    }
  };

  /**
   * Notifies the tracker that a top level operation has begun that should not be stopped until all
   * the nodes are in a resolved state (not INITIAL, WAITING_ON_EL_EVALUATION or
   * PARTIALLY_RENDERED).
   *
   * @param {boolean} stopCurrent if true and there already is an active operation, it will be
   *        stopped as part of this call. If not, the new operation will be stopped along with
   *        the current one.
   * @param {string} operationName the name of the operation
   * @param {Object} the logging level for this operation
   * @param {string} operationDescription the description of the operation
   * @param {string} instance name for this operation. For example, event name
   */
  PageBusyTracker.prototype.startOperation = function(
    stopCurrent,
    operationName,
    level,
    operationDescription,
    instanceName)
  {
    var numOper = this._operations.length;
    if (numOper)
    {
      if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx._pageWaitingInformation", "startOperation",
          "An operation was already running: " + this.getActiveOperation() +
          "\n  New operation: " + operationName + " " + instanceName);
      }

      if (stopCurrent)
      {
        for (var i = 0; i < numOper; ++i)
        {
          this._operations[i].stop();
        }

        this._operations = [];
      }
    }

    var oper = adf.mf.internal.perf.startMonitorOperation(operationName, level, operationDescription, instanceName);
    this._operations.push(oper);
  };

  /**
   * Checks if all AMX nodes are in a resolved state, and if so, stops any ongoing operations.
   */
  PageBusyTracker.prototype.checkComplete = function()
  {
    var numOper = this._operations.length;
    if (numOper && this._nodeCount == 0)
    {
      if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx._pageWaitingInformation", "checkComplete",
          "Operation is complete: " + this.getActiveOperation());
      }

      for (var i = 0; i < numOper; ++i)
      {
        this._operations[i].stop();
      }

      this._operations = [];
    }
    else if (numOper)
    {
      if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx._pageWaitingInformation", "checkComplete",
          "Operation is not complete yet. Waiting count: " + this._nodeCount);
      }
    }
    else
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "adf.mf.internal.amx._pageWaitingInformation", "checkComplete",
        "checkComplete called when there was no active operation");
    }
  };

  /**
   * Gets if an operation is active
   *
   * @return {boolean} true if there is an active operation
   */
  PageBusyTracker.prototype.isOperationActive = function()
  {
    return this._operations.length > 0;
  };

  /**
   * Get the active operation if there is one
   *
   * @return {Object|null} the active operation or null
   */
  PageBusyTracker.prototype.getActiveOperation = function()
  {
    return this.isOperationActive() ? this._operations[0] : null;
  };

  adf.mf.internal.amx._pageBusyTracker = new PageBusyTracker();

  function displayAmxPageImpl(amxPageName, promiseCallbacks)
  {
    // Return a promise object that holds the critical section
    // as long as needed
    return new adf.mf.internal.BasePromise(
      function(resolve, reject)
      {
        // Start a new page off with a node waiting count of 0
        adf.mf.internal.amx._pageBusyTracker.reset();

        adf.mf.internal.amx._pageBusyTracker.startOperation(
            false,
            "Load page",
            adf.mf.log.level.INFO,
            "Time to fully render the page", amxPageName);

        // Track the time to the initial page rendering (not fully-loaded)
        var perfOp = adf.mf.internal.perf.startMonitorOperation(
          "Initial page render",
          adf.mf.log.level.FINE,
          "adf.mf.api.amx.displayAmxPage");

        adf.mf.api.addBatchDataChangeListener(adf.mf.internal.amx._handleBatchDataChangeListener);

        // Store the current page name. This is used by the fragment to resolve relative URIs
        adf.mf.internal.amx._currentPageName = amxPageName;

        // Get the page (this must be a promise because it is an AJAX call)
        var amxPageTagPromise = getAmxTagForPage(adfc.Util.addFeatureRootPrefix(amxPageName), false);

        var initDataPromise = initData(amxPageName); // initializes the context

        // clear the bindings
        amx.clearBindings();

        // When amxPage, initData, and initUI resolve, we continue:
        var promises = [ amxPageTagPromise, initDataPromise, initUI() ];
        adf.mf.internal.BasePromise.all(promises).then(
          function(params)
            {
              // Load the message bundles before evaluating any EL
            var amxPageTag = params[0];
            loadBundles(amxPageTag).then(
                  function()
                  {
                    // Build the AMX node tree once the tags have been loaded
                var buildAmxNodeTreePromise = buildAmxNodeTree(amxPageName, amxPageTag);

                    // Resume any queued critical section requests, from this point
                    // on we are not operating in the critical section
                    resolve();

                    // Wait for the EL to arrive so that we may render the page
                buildAmxNodeTreePromise.then(
                        function(amxPageNode)
                        {
                          //debugPrintAmxNodeTree(amxPageNode);

                          // We render the page
                          var perfRender = adf.mf.internal.perf.startMonitorCall("Render AMX page",
                             adf.mf.log.level.FINER, "adf.mf.api.amx.displayAmxPage:render", amxPageName);
                    var pageContentElement;
                          // set flag to prevent independent processing of the init and postDisplay queues
                          // only wait if there is some render event which enqueues the rendered node into
                          // the processing queue and process these queues after the whole render phase is complete
                          amx.mustProcessQueues = false;
                          try
                          {
                      pageContentElement = amxPageNode.render();
                          }
                          finally
                          {
                            perfRender.stop();
                          }

                    var perfAfterRender =
                      adf.mf.internal.perf.startMonitorCall(
                        "After render AMX page",
                        adf.mf.log.level.FINER,
                        "adf.mf.api.amx.displayAmxPage:afterRender",
                        amxPageName);

                          try
                          {
                      var viewContainer;
                            if (adf.mf.internal.amx.isTransitionAfterRender(isFirstPage)) // render before transitioning
                            {
                              // TODO: remove jQ code and stop using string concatination with HTML
                        viewContainer = document.createElement("div");
                        viewContainer.setAttribute("data-pageName", amxPageName);
                        viewContainer.className = "amx-view-container";
                        viewContainer.classList.add("new");

                        document.getElementById("bodyPageViews").appendChild(viewContainer);
                            }
                            else // use placeholder transitioning
                            {
                              var viewContainerElement;
                              if (isFirstPage)
                              {
                                // Since we are not doing a navigation, we have to create the element ourselves:
                                viewContainerElement = adf.mf.internal.amx._createViewContainerElement();
                              }
                              else
                              {
                                // The element was already created in the doNavigation code (where it might kick off a
                                // transition animation) so just get it and use it:
                                var viewContainerElements = document.getElementsByClassName("amx-view-container");
                                viewContainerElement = viewContainerElements[viewContainerElements.length - 1];
                              }
                              viewContainerElement.setAttribute("data-pageName", amxPageName);
                              adf.mf.api.amx.emptyHtmlElement(viewContainerElement);
                            }

                      if (pageContentElement != null)
                        viewContainer.appendChild(pageContentElement);

                            //TODO: needs to move this refresh above
                            // We process and clean the initQueue
                            amx.processAndCleanInitQueue();

                            //If it is the first page, we handler the display
                            if (isFirstPage)
                            {
                        viewContainer.classList.remove("new");
                        viewContainer.classList.add("current");
                              isFirstPage = false;
                            }

                            amx.processAndCleanPostDisplayQueue();

                      promiseCallbacks["resolve"](viewContainer);
                          }
                          finally
                          {
                            perfAfterRender.stop();
                            adf.mf.api.amx.hideLoadingIndicatorOnlyIfFirstTime();
                            perfOp.stop();
                            // reset mustProcessQueues to true
                            // every call of the rerender outside of the data change event
                            // will immediatelly trigger processing of the init and postDisplay
                            // queues
                            amx.mustProcessQueues = true;
                            // Check if the page has finished rendering
                            adf.mf.internal.amx._pageBusyTracker.checkComplete();
                          }
                 },
                 function()
                 {
                   perfOp.stop();
                   adf.mf.internal.amx._pageBusyTracker.checkComplete();
                       });
              },
              function()
              {
                perfOp.stop();
                adf.mf.internal.amx._pageBusyTracker.checkComplete();
                // Reject the promise return
                reject();
                  });
          },
          function()
          {
            // TODO: print error
            adf.mf.api.amx.hideLoadingIndicator();
            perfOp.stop();
            // Reject the promise return
            reject();
            });
      });
  }

  // ------ resource loading ------ //
  var loadedJavaScriptResources = {};
  var loadedCssResources = {};
  var loadingCssLinks = [];
  var cssLoadingCheckInterval = null;
  var cssLoadingWaitStarted = 0;
  var cssLastCheckSheetCount = 0;

  /**
   * Internal function for loading XML files
   * @param {string} resourceName the resource to load
   * @param {boolean} async whether the request should be asynchronous
   * @param {function} successCB the XML file could be parsed
   * @param {function} errorCB the XML file could not be parsed
   * @private
   */
  adf.mf.internal.amx._loadXmlFile = function(resourceName, async, successCB, errorCB)
  {
    var perfOp = adf.mf.internal.perf.startMonitorOperation("Load XML file", adf.mf.log.level.FINE, "adf.mf.internal.amx._loadXmlFile", resourceName);
    var perf = adf.mf.internal.perf.startMonitorCall("Load XML file", adf.mf.log.level.FINER, "adf.mf.internal.amx._loadXmlFile.load");

    //  Load the XML:
    adf.mf.api.resourceFile._loadFileWithAjax(
      resourceName,
      async,
      function(responseText)
      {
        perf.stop();
        if ((responseText != null) && (responseText.length > 0))
        {
          perf = adf.mf.internal.perf.startMonitorCall("Parse XML file", adf.mf.log.level.FINER, "adf.mf.internal.amx._loadXmlFile.parse");
          var parser = new DOMParser();
          var amxPage = parser.parseFromString(responseText, "text/xml");
          var firstTag = null;
          var possibleFirstTag = amxPage.firstChild;
          while (firstTag == null && possibleFirstTag != null)
          {
            if (possibleFirstTag.nodeType == 1) // an element
              firstTag = possibleFirstTag;
            else
              possibleFirstTag = possibleFirstTag.nextSibling;
          }

          perf.stop();
          if (firstTag != null)
          {
            try
            {
              perf = adf.mf.internal.perf.startMonitorCall("Parse tags", adf.mf.log.level.FINER, "adf.mf.internal.amx._loadXmlFile.parseTags");
              var amxPageTag = new adf.mf.api.amx.AmxTag(null, firstTag);
              perf.stop();

              var promise = adf.mf.internal.amx._preProcessTagTree(amxPageTag);
              promise.then(
                function()
                {
                  perfOp.stop();
                  successCB(amxPageTag);
                });
            }
            catch (e)
            {
              perfOp.stop();
              errorCB(e);
            }
          }
          else
          {
            perfOp.stop();
            errorCB("No root view tag found");
          }
        }
        else
        {
          perfOp.stop();
          errorCB("Empty response");
        }
      },
      function()
      {
        perfOp.stop();
        errorCB.apply(window, arguments);
      });
  };

  /**
   * Function to load a JavaScript file
   * @param {string} src the URI to the JavaScript file
   * @return {Object} a promise for when the loading is complete
   */
  amx.includeJs = function(src)
  {
    var loadState = loadedJavaScriptResources[src];
    if (loadState == null) // possibilities are null, a promise, or true
    {
      // Never attempted to load this file so load it:
      var promise = new adf.mf.internal.BasePromise(function(resolve, reject)
        {
      // Use an XHR to retrieve the JavaScript. Usage of an XHR allows us to be notified
      // of when the script has been loaded, or has failed to load to be able to correctly
          // invoke the correct promise method.
      adf.mf.api.resourceFile.loadJsFile(
        src,
        true,
        function()
        {
          loadedJavaScriptResources[src] = true;
              resolve();
        },
        function()
        {
          adf.mf.api.adf.logInfoResource(
            "AMXInfoBundle",
            adf.mf.log.level.SEVERE,
            "amx.includeJs",
            "MSG_FAILED_TO_LOAD",
            src);
              reject();
        },
        null);
        });
      loadedJavaScriptResources[src] = promise;
      return promise;
    }
    else if (loadState === true) // other options are undefined and false
    {
      // File was already loaded successfully:
      return adf.mf.internal.BasePromise.resolve();
    }
    else // a promise
    {
      // File was already requested to be loaded with this promise:
      return loadState;
    }
  };

  /**
   * Function that checks for the completion of loading CSS files
   * (polls from a callback from a window interval)
   */
  function waitTillCssLoaded()
  {
    var styleSheets = document.styleSheets;
    var numStyleSheets = styleSheets.length;

    // Don't bother checking if the count has not changed from the last poll
    if (cssLastCheckSheetCount == numStyleSheets)
    {
      return;
    }
    cssLastCheckSheetCount = numStyleSheets;
    // Loop through all the nodes that we are still waiting to finish loading
    for (var i = 0; i < loadingCssLinks.length; ++i)
    {
      var obj = loadingCssLinks[i];
      var nonLoadedNode = obj["node"];

      for (var j = 0; j < numStyleSheets; ++j)
      {
        var linkNode = styleSheets[j].ownerNode;
        // See if this style sheet is for the node we are waiting to be loaded.
        if (nonLoadedNode == linkNode)
        {
          // When the style sheet appears in the styleSheets collection,
          // it has finished loading
          obj["resolve"](linkNode);

          // Remove the item from the array
          loadingCssLinks.splice(i--, 1);

          if (loadingCssLinks.length == 0)
          {
            // We are not waiting on any more nodes
            window.clearInterval(cssLoadingCheckInterval);
            cssLoadingCheckInterval = null;
            return;
          }

          break;
        }
      }
    }

    var timeWaiting = new Date().getMilliseconds() - cssLoadingWaitStarted;
    // Since the code is not notified of CSS files that failed to load, only way for a maximum
    // of 5 seconds for all CSS files to load and then throw an error
    if (timeWaiting >= 5000)
    {
      for (var index = 0, size = loadingCssLinks.length; i < size; ++i)
      {
        var obj = loadingCssLinks[index];
        // Notify the listener that the resource failed to load
        obj["reject"]();
        adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
          "amx.includeCss",
          "MSG_FAILED_TO_LOAD", obj["path"]);
      }
      loadingCssLinks = [];
      window.clearInterval(cssLoadingCheckInterval);
      cssLoadingCheckInterval = null;
    }
  };

  /**
   * Function to load a CSS file
   * @param {string} path the URI to the CSS file
   * @return {Object} promise that is resolved once the style sheet has been loaded.
   */
  amx.includeCss = function(path)
  {
    var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);
    if (loadedCssResources[path])
    {
      if (isFinestLoggingEnabled)
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "amx", "includeCss",
          "CSS file has already been loaded: " + path);
      }

      // Return a promise object already resolved to indicate that the source
      // has already been loaded
      return adf.mf.internal.BasePromise.resolve();
    }

    // Currently, the only supported means in WebKit browsers to determine if a style sheet has
    // finished loading is to check for the style sheet to appear in the document.styleSheets
    // collection. There are no events that are associated with the loading, so polling this
    // collection is the only means, at the moment, to determine this information.
    //
    // We need to use a <link> tag so that the URLs in the CSS are preserved. If we were to
    // attempt to use a <style> tag and inject the content from the CSS file into the page, the
    // relative URLs would no longer work.

    // First add the
    var node = document.createElement("link");
    node.setAttribute("rel", "stylesheet");
    node.setAttribute("type", "text/css");
    node.setAttribute("href", path);
    document.head.appendChild(node);

    if (isFinestLoggingEnabled)
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "amx", "includeCss",
        "Loading CSS file : " + path);
    }
    loadedCssResources[path] = true;

    var perf = null;
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
        // Store an object with the promise object to be able to notify when loaded,
    // and the node to check to see when the loading has completed.
    loadingCssLinks.push(
      {
        "path": path,
        "node": node,
            "resolve": resolve,
            "reject": reject
      });

    // See if a timer has already been started, if not start one to poll the document.styleSheets
    // collection
    if (cssLoadingCheckInterval == null)
    {
      // Use a 10ms timeout. These resources are local to the device, so it should not take long
      // for them to be loaded.
      cssLoadingCheckInterval = window.setInterval(waitTillCssLoaded, 10);
    }

    // Set or reset when we started to wait for the CSS to load. This leaves a maximum wait time
    // of 5 seconds from the last CSS file added.
    cssLoadingWaitStarted = new Date().getMilliseconds();

        // Return the promise object so that the caller may be notified once the CSS file has been
    // completely loaded
    var perf = adf.mf.internal.perf.startMonitorCall("Include CSS file", adf.mf.log.level.FINER, "amx.includeCss");
      }).then(
      function()
      {
        if (isFinestLoggingEnabled)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "amx", "includeCss",
            "Successfully loaded CSS file: " + path);
        }

          if (perf != null)
        perf.stop();
      });
  };
  // ------ /resource loading ------ //

  // TODO: add more comments to the iterator implementation classes below
  /**
   * Iterator object to support iterating over a JavaScript items array with hasNext and next methods
   * @constructor
   */
  function ArrayIterator(items)
  {
    // Empty arrays are currently sent to the JavaScript side as nulls by the embedded side. As
    // such, convert the value into an empty array
    this._items = items || [];
    this._index = -1;
    this._length = this._items.length;
  }

  ArrayIterator.prototype =
  {
    next: function()
    {
      return this.hasNext() ? this._items[++this._index] : undefined;
    },

    hasNext: function()
    {
      return this._index + 1 < this._length;
    },

    previous: function()
    {
      return this.hasPrevious() ? this._items[--this._index] : undefined;
    },

    hasPrevious: function()
    {
      return this._index > 0 && this._index - 1 < this._length;
    },

    getCurrent: function()
    {
      return this._index >= 0 && this._index <= this._length ? this._items[this._index] : undefined;
    },

    getCurrentIndex: function()
    {
      return this._index;
    },

    isTreeNodeIterator: function()
    {
      return false;
    },

    isAllDataLoaded: function()
    {
      // Arrays cannot implement the behavior of notifying the consumer that more data may be able
      // to be loaded. It is up to the page author to configure the loading of more information
      // manually
      return true;
    },

    getAvailableCount: function()
    {
      return this._length;
    },

    getTotalCount: function()
    {
      return this._length;
    },

    getRowKey: function()
    {
      if (this._index == -1)
      {
        return null;
      }

      var currentItem = this._items[this._index];
      return currentItem == null ? null :
        typeof currentItem["rowKey"] === "function" ?
          currentItem.rowKey() : this._index;
    },

    /**
     * Sets the index to the value specified. Note that calling next will cause
     * the item after this index to be returned. Therefore, calling the function
     * with -1 will cause the next item to load to be the first item (index 0).
     */
    setCurrentIndex: function(index)
    {
      this._index = index;
    },

    /**
     * Sets the current item by the row key
     * @param {string} rowKey the row key
     * @return {boolean} true if the rowKey was found, false otherwise
     */
    setCurrentRowKey: function(rowKey)
    {
      this._index = -1;
      while (this.hasNext())
      {
        this.next();
        if (this.getRowKey() == rowKey)
        {
          return true;
        }
      }

      return false;
    }
  };

  /**
   * Iterator object to use with TreeNodeIterator with hasNext and next methods
   * @constructor
   */
  function TreeNodeIteratorWrapper(items)
  {
    this._first = true;
    this._items = items;
    // cache available size of the iterator to avoid
    // multiple calculations
    // Iterator is not suppose to life longer than one iteration
    // so this is safe to do here since any data change
    // during the iteration will corrupt data anyway and it should
    // be avoided in a code that uses this iterator.
    this._availableCount = items.getCachedRowCount(0);
    this._totalCount = items.getTreeNodeBindings().keys.length;
  }

  TreeNodeIteratorWrapper.prototype =
  {
    /**
     * @return {TreeNode} representation of the next row in the collection
     */
    next: function()
    {
      if (this._first)
      {
        this._first = false;
        return this._items.localFirst();
      }

      return this._items.localNext();
    },

    /**
     * @return {Boolean} true if the next row is available in local collection
     */
    hasNext: function()
    {
      if (this._first)
      {
        return this._items.localFirst() !== undefined;
      }
      return this._items.getCurrentIndex() < this._availableCount - 1;
    },

    /**
     * @return {TreeNode} representation of the previous row in the collection or undefined
     *         if already at the beginning
     */
    previous: function()
    {
      return this._first ? undefined : this._items.localPrevious();
    },

    /**
     * @return {Boolean} true if the previous row is available in local collection
     */
    hasPrevious: function()
    {
      return this._first == false;
    },

    /**
     * @return {TreeNode} representation of the row on current index
     */
    getCurrent: function()
    {
      return this._items.getCurrentRow();
    },

    /**
     * @return {Integer} index of the current position in collection
     */
    getCurrentIndex: function()
    {
      return this._items.getCurrentIndex();
    },

    isTreeNodeIterator: function()
    {
      return true;
    },

    /**
     * @return true if there are more data to be loaded from the backend
     */
    isAllDataLoaded: function()
    {
      return this._items.getTreeNodeBindings().hasMoreKeys !== true;
    },

    /**
     * @return {Integer} number of all available items on the backend
     */
    getAvailableCount: function()
    {
      return this._availableCount;
    },

   /**
    * @return {Integer} total number of items in collection on backend
    */
    getTotalCount: function()
    {
      return this._totalCount;
    },

   /**
    * @return {String} rowKey of the current position in collection
    */
    getRowKey: function()
    {
      if (this._first)
      {
        return null;
      }

      return this._items.getCurrentKey();
    },

    /**
     * Sets the index to the value specified. Note that calling next will cause
     * the item after this index to be returned. Therefore, calling the function
     * with -1 will cause the next item to load to be the first item (index 0).
     */
    setCurrentIndex: function(index)
    {
      this._items.setCurrentIndex(index);
      this._first = index == -1;
    },

    /**
     * Sets the current item by the row key
     * @param {string} rowKey the row key
     * @return {boolean} true if the rowKey was found, false otherwise
     */
    setCurrentRowKey: function(rowKey)
    {
      this._first = false;
      return this._items.setCurrentRowKey(rowKey);
    }
  };

  /**
   * Create an iterator that will support either a JavaScript array of objects or iterator over a
   * tree node iterator (collection model).
   * @param {(Array|TreeNodeIterator)} the items to iterate over
   * @return {Object} iterator object with "next", "hasNext", and "isTreeNodeIterator" functions
   *                           where "next" will return undefined when no more objects are available.
   */
  adf.mf.api.amx.createIterator = function(items)
  {
    if (items != null && items[".type"] === "TreeNodeIterator")
    {
      return new TreeNodeIteratorWrapper(items);
    }
    else
    {
      return new ArrayIterator(items);
    }
  };

  /**
   * Convenient method to sequentialy resolve each item of an array. If the itemResolver method
   * returns a promise, it will wait until resolved before processing the next element.
   * If the itemResolver returns the direct value, it will to the next item.
   *
   * @param {(Array|TreeNodeIterator)} items is the array or the TreeNodeIterator to iterate threw
   * @param {function} itemResolver(item) function that will resolve the item. Can return the value
   *        or a promise that will resolve with the value
   * @return {Promise} promise that will resolve with the array of values returned by the item
   *         resolver
   */
  amx.serialResolve = function(items,itemResolver)
  {
    var _type = null;

    try
    {
      if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST, "amx", "serialResolve",
          "items is of type: " + items.constructor.name + " or " + items[".type"]);
      }
      _type = items.constructor.name || items[".type"];
    }
    catch (te)
    {
      /* ignore */
    }

    if (_type === "TreeNodeIterator")
    {
      return amx.iteratorResolve(items, itemResolver);
    }
    else
    {
      var promiseResolve = null;
      var promiseReject = null;
      var promise = new adf.mf.internal.BasePromise(function(resolve, reject)
        {
          promiseResolve = resolve;
          promiseReject = reject;
        });
      var results = [];
      var i = 0;

      function resolveAndNext()
      {
        if (i < items.length)
        {
          var item = items[i];
          var itemResolverResult = itemResolver(item, i);

          // if it is a promise (but not a jquery object, which is also a promise), then, pipe it
          if (typeof itemResolverResult !== "undefined" && itemResolverResult !== null &&
            adf.mf.internal.amx.implementsFunction(itemResolverResult, "then") &&
            !itemResolverResult.jquery)
          {
            itemResolverResult.then(
              function(result)
            {
              results.push(result);
              i += 1;
              resolveAndNext();
              },
              function(result)
            {
              adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "resolveAndNext", "MSG_SERIAL_RESOLVE_DEFERRED_REJECTED", i);
                promiseReject();
            });
          }
          else
          {
            // if it is a normal object or a jqueryObject, then, just push the value and move to the next
            results.push(itemResolverResult);
            i += 1;
            resolveAndNext();
          }
        }
        else
        {
          // once we run out
          promiseResolve(results);
        }
      }
      resolveAndNext();
      return promise;
    }
  };

  /**
   * Determine if parameter is a finite number
   * @param {Object} n is the object to check
   */
  adf.mf.internal.amx.isFiniteNumber = function (n)
  {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };

  /**
   * Iterates over items provided by elNodeIterator and executes itemResolver for each item.  The number of iterations can be
   * limited by providing maxIterations.  If the itemResolver method returns a promise, it will wait until resolved before processing the next element.
   * If the itemResolver returns the direct value, it will do the next item.
   * @param {TreeNodeIterator} elNodeIterator is the iterator to iterate over
   * @param {function} itemResolver(item) function that will resolve the item. Can return the value or a promise that will resolve with the value
   * @param {Object} maxIterations specifies the maximum number of iterations to perform
   */
  amx.iteratorResolve = function(elNodeIterator,itemResolver,maxIterations)
  {
    var promiseResolve = null;
    var promise = new adf.mf.internal.BasePromise(function(resolve, reject)
      {
        promiseResolve = resolve;
      });
    var results = [];
    var methodNext = "first";
    var rowCount = 0;
    var _maxIterations = Infinity;
    if (maxIterations)
    {
      _maxIterations = maxIterations;
    }

    function resolveNext()
    {
      if (elNodeIterator.hasNext() && rowCount < _maxIterations)
      {
        elNodeIterator[methodNext](function(a,b)
        {
          methodNext = "next";
          var item = b[0].value;

          //FIXME: for now, turn this off for debugging
          var itemResolverResult = itemResolver(item,elNodeIterator.getCurrentIndex());

          // if it is a promise (but not a jquery object, which is also a promise), then, pipe it
          if (typeof itemResolverResult !== "undefined" && itemResolverResult !== null &&
            adf.mf.internal.amx.implementsFunction(itemResolverResult, "promise") &&
            !itemResolverResult.jquery)
          {
            itemResolverResult.then(function(result)
            {
              results.push(result);
              ++rowCount;
              resolveNext();
            });
          }
          else
          {
            // if it is a normal object or a jqueryObject, then, just push the value and move to the next
            results.push(itemResolverResult);
            ++rowCount;
            resolveNext();
          }
        }, function(a,b)
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "resolveNext", "MSG_ITERATOR_FIRST_NEXT_ERROR", a, b);
        });
      }
      else
      {
        promiseResolve(results);
      }
    }
    resolveNext();

    return promise;
  };

  /*TreeNodeIterator
k: id
k: treeNodeBindings
k: index
k: currentKey
k: createRow
k: first
k: getCurrentIndex
k: getCurrentKey
k: getCurrentRow
k: hasNext
k: hasPrevious
k: last
k: next
k: nextSet
k: previous
k: previousSet
k: refresh
k: setCurrentIndex
k: fetch
k: getKeys
k: removeCurrentRow
k: setCurrentRowWithKey
k: fetchSet
k: fetchProviderByKey
k: updateKeys
   */

  // ------ /Public API ------ //

  function initUI()
  {
    if (initPromise)
    {
      return initPromise;
    }
    else
    {
      initPromise = new adf.mf.internal.BasePromise(
        function(resolve, reject)
        {
      // adf.mf.environment.profile.mockData=true for the DT as well as the RT test harness mode. The DT
      // requires that featureLevelIncludes.jso be in the feature root, NOT relative
      // to the directory of the AMX
      if (adf.mf.environment.profile.mockData)
      {
        adf.mf.api.resourceFile.loadJsonFile(
          adfc.Util.addFeatureRootPrefix("featureLevelIncludes.jso"),
          true,
          function(data)
          {
            loadIncludes(data);
                resolve();
          },
          function()
          {
            // do nothing, no config.
                resolve();
          });
      }
      else
      {
            container.internal.device.integration.getAmxIncludeList(
              function(includes)
        {
          loadIncludes(includes);
                resolve();
              },
              function(er)
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "initUI", "MSG_AMX_INCLUDE_FAILED", er);
                resolve();
        });
      }
        });
      return initPromise;
    }
  }

  function loadIncludes(includes)
  {
    if (includes)
    {
      adf.mf.internal.amx._each(includes, function(idx, include)
      {
        var file = include.file;
        if (!amx.hasProtocol(file))
        {
          file = adfc.Util.addFeatureRootPrefix(include.file);
        }
        if (include.type == "StyleSheet")
        {
          amx.includeCss(file);
        }
        else if (include.type == "JavaScript")
        {
          amx.includeJs(file);
        }
      });
    }
  }

  function initData(amxPageName)
  {
    return mockInitData(amxPageName);
  }

  var initDataDone = false;

  function mockInitData(pagename)
  {
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
    // if the data has not been initialized, and we are not in the Oracle Shell (ADFMobile undefined), then, we load the model.jso
    //TODO: need to add condition for :  typeof ADFMobile === "undefined" & and !forceInitDataMock
    if (!initDataDone && adf.mf.environment.profile.mockData)
    {
      // before we do anything, make sure all of the el gets set up by trying to retrieve the application scope
      // this will allow any data in model.jso that isn't bindings related to not get over-written
      adf.mf.el.getLocalValue("#{applicationScope}");
      pagename = pagename || "nopage";
      // adf.mf.environment.profile.mockData=true for the DT as well as the RT test harness mode. The DT
      // requires that model.jso be in the feature root, NOT relative
      // to the directory of the AMX
      adf.mf.api.resourceFile.loadJsonFile(
        adfc.Util.addFeatureRootPrefix("model.jso"),
        true,
        function(data)
        {
          if (data)
          {
            //model = data;
            //adf.mf.el.addVariable("bindings", data);
                adf.mf.internal.amx._each(data, function(key,value)
            {
              adf.mf.el.addVariable(key, value);
            });

            adf.mf.el.addVariable("applicationScope", {});
            adf.mf.el.addVariable("pageFlowScope", {});
            initDataDone = true;
            adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.INFO, "mockInitData-a", "MSG_AMX_MODEL_JSO_LOADED");
                initContext(pagename, resolve);
          }
          else
          {
            adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "mockInitData-b", "MSG_NO_MODEL_JSO_FOUND");
            adf.mf.environment.profile.mockData = false;
                initContext(pagename, resolve);
          }
        },
        function(error)
        {
              adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "mockInitData-c; " + error, "MSG_NO_MODEL_JSO_FOUND");
              adf.mf.environment.profile.mockData = false;
              initContext(pagename, resolve);
        });
    }
    else
    {
          initContext(pagename, resolve);
    }
    });
  }

  var amxTransitionModeELExpression = adf.mf.internal.el.parser.parse ("#{applicationScope.configuration.amxTransitionMode}");

  function initContext(amxPageName, callback)
  {
    var promise = new adf.mf.internal.BasePromise(function (resolve, reject)
    {
      if (!adf.mf.environment.profile.mockData)
      {
        var perf = adf.mf.internal.perf.startMonitorCall("Initialize context for", adf.mf.log.level.FINER, "adf.mf.internal.amx:initContext", amxPageName);
        // Prime the EL values for the a variable that will be used in
        // adf.mf.internal.amx.isTransitionAfterRender:
        if (!adf.mf.environment.profile.mockData)
          amx.getElValue(amxTransitionModeELExpression, true);

        //
        //  Set the current context.
        //
        var newViewScope = adf.mf.internal.lastNavIsNewView;
        adf.mf.api.setCurrentContext(amxPageName, true, true, newViewScope, function ()
        {
          perf.stop();
          resolve();
        },
        function (ex)
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.WARNING, "initContext", "MSG_SET_CONTEXT_FAILED", amxPageName, ex);
          perf.stop();
          resolve();
        });
      }
      else 
      {
        resolve();
      }
    });
    promise.then(function ()
    {
      callback();
    });
  }
  
  // pageStructAndDef data by pageName
  var amxPages = {};

  /**
   * Load a new instance of the amxPage JSON structure.
   * Returns a promise that will resolve with the amxPage JSON Structure. <br />
   *
   * @param {Object} uri the URI to the AMX page
   */
  function loadAmxPage(uri)
  {
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
    adf.mf.internal.amx._loadXmlFile(
      uri,
      true,
      function(data)
      {
            resolve(data);
      },
      function(e)
      {
            reject("Unable to load the XML file: " + uri, e);
      });
      });
  }


  /**
   * Reloads the current AMX page UI.
   * It should only be invoked in MobileApplicationAcceleratorMode.
   * This function does not reload the feature or page,
   * nor it affects any of the bindings, scopes, etc.
   *
   * This is an internal API and it is used by MAX.
   *
   * @return {Promise}
   */
  adf.mf.internal.amx.softReloadCurrentAmxPage = function ()
  {
    var that = this;
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
    adf.mf.api.finishAnyLoading().then(function ()
    {
      adf.mf.api.amx.showLoadingIndicator();

          adf.mf.internal.amx._queueCriticalSectionFunction(
            softReloadCurrentAmxPageImpl,
            that,
            {
              "resolve": resolve,
              "reject": reject
    });
        });
      });
  };


  function softReloadCurrentAmxPageImpl(promiseCallbacks)
  {
    var amxPage = amx.getCurrentPageName();

    // if current page path is null
    // or the environmentMode is not set to MobileApplicationAccelerator
    // hide the loading indicator and do nothing
    if (amxPage == null || !adf.mf.internal.amx.isMobileApplicationAcceleratorMode())
    {
      adf.mf.api.amx.hideLoadingIndicator();
      promiseCallbacks["reject"]();
    }
    else
    {
      // NOTE: amx-popup is lazily loaded, so we must check for the existence
      // of the function before calling it
      if (adf.mf.internal.amx.closePopups)
      {
        adf.mf.internal.amx.closePopups();
      }

      // Before we strip off the IDs, call the destroy methods on any AMX nodes
      var current = document.querySelector("#bodyPageViews > .current");
      adf.mf.internal.amx.processDestroy(current);

      // Strip off any ID attributes on the page's elements.
      if (current != null)
      {
        adf.mf.internal.amx.stripIds(current);
      }

      // Purge any elements that might be disconnected from the bodyPage:
      adf.mf.internal.amx._purgeOnNav();

      // invoke displayAmxPage to reload the amxPage
      adf.mf.api.amx.displayAmxPage(amxPage).then(
        function(newPage)
      {
          current.classList.remove("current");
          current.classList.add("old");
          newPage.classList.remove("new");
          newPage.classList.add("current");
          adf.mf.internal.amx.processDestroy(current);
          adf.mf.api.amx.removeDomNode(current);
        adf.mf.api.amx.hideLoadingIndicator();
          promiseCallbacks["resolve"]();
      });

      // if debug mode...
      // Check for window event leaks
      adf.mf.internal.amx._checkForWindowsEventLeaks("softReloadCurrentAmxPage");
    }
  };

  /**
   * Removes all element IDs from the given subtree (root included).
   * @param {Element} root the root element of the subtree whose IDs are to be removed
   */
  adf.mf.internal.amx.stripIds = function(root)
  {
    // Strip off any ID attributes on the old page's elements. This will prevent any issues
    // with getElementById finding elements on the old page instead of the new page.
    var treeWalker =
     document.createTreeWalker(
       root,
       NodeFilter.SHOW_ELEMENT,
       function(node)
       {
         return (node.hasAttribute("id")) ?
           NodeFilter.FILTER_ACCEPT :
           NodeFilter.FILTER_SKIP;
       },
       false);
 
    while (treeWalker.nextNode())
    {
      treeWalker.currentNode.removeAttribute("id");
    }

    root.removeAttribute("id"); // remove it from the root too
  };

  var amxTagForPagePromiseMap = {};

  /**
   * Return a promise object (or cached tag) that will get resolved with the amxPage root tag.
   * This will first try to get it from the cache, or load it if needed.
   *
   * @param {Object} uri The URI of the page to load
   * @param {Boolean} getCacheInsteadOfPromise whether to get the cached tag or a promise
   * @return {Object} either a promise object or a possibly undefined adf.mf.api.amx.AmxTag
   */
  function getAmxTagForPage(uri, getCacheInsteadOfPromise)
  {
    // Note that we are caching the tag hierarchy per page. If there is ever a problem with the
    // retained AMX tag hierarchies taking up too much RAM, then we should remove the cache and
    // regenerate the tags from the XML each time.

    // Get the base URI to resolve the relative path
    var prefix = adfc.Util.addFeatureRootPrefix("/");
    var relUri = uri;
    if (relUri.substring(0, prefix.length) == prefix)
    {
      relUri = relUri.substring(prefix.length);
    }

    var amxPageTag = amxPages[relUri];
    if (getCacheInsteadOfPromise)
    {
      return amxPageTag;
    }

    var promise;

    if (amxPageTag)
    {
      promise = new adf.mf.internal.BasePromise(
        function(resolve, reject)
        {
      if (amxPageTag instanceof adf.mf.api.amx.AmxTag)
      {
            resolve(amxPageTag);
      }
      else
      {
        // The tag is not actually a tag, but the error arguments stored in the map
            reject(amxPageTag);
      }
        });
    }
    else
    {
      promise = amxTagForPagePromiseMap[relUri];
      if (promise == null)
      {
        promise = new adf.mf.internal.BasePromise(
          function(resolve, reject)
          {
            loadAmxPage(uri).then(
            function(amxPageTag)
            {
              // do not cache if in MAX Mode
              if(!adf.mf.internal.amx.isMobileApplicationAcceleratorMode())
              {
                amxPages[relUri] = amxPageTag;
              }

                delete amxTagForPagePromiseMap[relUri];

                resolve(amxPageTag);
              },
              function(msgAndE)
            {
                var msg = msgAndE[0];
                var e = msgAndE[1];
              amxPages[relUri] = [ msg, e ];
                delete amxTagForPagePromiseMap[relUri];

                // forward the failure argument to the promise
              var args = Array.prototype.slice.call(arguments);
                reject.apply(null, args);
            });
          });
        amxTagForPagePromiseMap[relUri] = promise;
      }
    }

    return promise;
  }

  // Expose for use by the amx:fragment
  adf.mf.internal.amx.__getAmxTagForPage = getAmxTagForPage;

  /**
   * Get the AmxNode root node for the currently loaded page.
   *
   * @return {(adf.mf.api.amx.AmxNode|null)} the amx node or null if the
   *         page is not loaded.
   */
  adf.mf.api.amx.getPageRootNode = function()
  {
    return amxPageRootNode;
  };

  /**
   * Object used by the functions in markNodeForUpdate to pass the state
   * of the changes between the functions.
   * @constructor
   * @private
   */
  function AmxNodeChangesResults()
  {
    this._affectedNodeIds = {};
    this._affectedNodes = [];

    this._nodesToRecreate = [];

    this._descendentChanges = {};
    this._ancestorNodes = [];

    this._attributeChanges = {};

    this._changeResult = {};

    this._initialStates = {};

    this._hasChanges = false;
  }

  AmxNodeChangesResults.prototype =
  {
    /**
     * Get if there are changes to any nodes
     * @return {Boolean} true if any nodes were updated
     */
    hasChanges: function()
    {
      return this._hasChanges;
    },

    /**
     * Get the array of AMX nodes that have been changed and need to
     * be visited during the application of render changes.
     * @return {Array.<adf.mf.api.amx.AmxNode>} array of AMX nodes to visit
     */
    getAffectedNodes: function()
    {
      return this._affectedNodes;
    },

    /**
     * Get the result of the updateChildren function for an affected AMX node.
     * @param {number} amxNodeId the ID of the AMX node
     * @return {(number|null)} the result or null. One of the adf.mf.api.amx.AmxNodeChangeResult
     *         constants
     */
    getChangeResult: function(amxNodeId)
    {
      return this._changeResult[amxNodeId];
    },

    /**
     * Get the change result for a given AMX node ID
     * @param {number} amxNodeId the ID of the AMX node
     * @return {(adf.mf.api.amx.AmxAttributeChange|null)} the attribute change object or null
     *         if the node was not affected
     */
    getAttributeChanges: function(amxNodeId)
    {
      return this._attributeChanges[amxNodeId];
    },

    /**
     * Get the AMX nodes that need to be re-created
     * @return {Array.<adf.mf.api.amx.AmxNode>} array of AMX nodes to re-create
     */
    getAmxNodesToRecreate: function()
    {
      return this._nodesToRecreate;
    },

    /**
     * Get the AMX nodes that have been queued to see if they can handle changes to descendents
     * @return {Array.<adf.mf.api.amx.AmxNode>} array of AMX ancestor nodes
     */
    getAmxNodesForDescendentChanges: function()
    {
      return this._ancestorNodes;
    },

    /**
     * Get the AMX descedent changes for a given ancestor AMX node ID
     * @param {number} amxNodeId the ID of the ancestor AMX node
     * @return {(adf.mf.api.amx.AmxDescendentChanges|null)} the changes object or null if the node
     *         has no descendent changes.
     */
    getDescendentChanges: function(amxNodeId)
    {
      return this._descendentChanges[amxNodeId];
    },

    /**
     * Notifies this object that a node has been recreated
     * @param {adf.mf.api.amx.AmxNode} oldAmxNode node that was re-created
     * @param {adf.mf.api.amx.AmxNode} newAmxNode re-created node
     */
    amxNodeRecreated: function(oldAmxNode, newAmxNode)
    {
      var index = this._affectedNodes.indexOf(oldAmxNode);
      if (index != -1)
      {
        this._affectedNodes[index] = newAmxNode;
      }

      var wasRendered = oldAmxNode.isRendered();

      if (wasRendered)
      {
        // If the node was rendered, and still is, we will just swap the root DOM
        // in place
        var id = newAmxNode.getId();
        if (newAmxNode.isReadyToRender())
        {
          this._changeResult[id] = adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];
        }
        else
        {
          // Otherwise we need to mark the parent to be re-rendered
          var initialState = this._initialStates[id];
          var attributeChanges = this._attributeChanges[id];
          var renderedAmxNode = newAmxNode.__getClosestRenderedNode(true);

          this._markNodeAffected(renderedAmxNode);
          this._queueCallToAncestor(newAmxNode, initialState, attributeChanges, renderedAmxNode);
        }
      }
    },

    /**
     * Called after calling the ancestor nodes getDescendentChangeAction function to see how
     * a change should be handled.
     * @param {adf.mf.api.amx.AmxNode} amxNode the ancestor AMX node.
     * @param {number} descendentChangeResult the value returned from getDescendentChangeAction
     */
    setDescendentChangesResult: function(
      amxNode,
      descendentChangeResult)
    {
      var amxNodeId = amxNode.getId();
      var currentResult = this._changeResult[amxNodeId];

      // If the node is not already marked for another change or if the
      // descendent changes require a more invasive change, then store the result
      // from asking about the descendent refresh changes
      if (currentResult == null || descendentChangeResult > currentResult)
      {
        this._changeResult[amxNodeId] = descendentChangeResult;

        if (descendentChangeResult != adf.mf.api.amx.AmxNodeChangeResult["NONE"])
        {
          this._markNodeAffected(amxNode);
        }
      }
    },

    /**
     * During the application of changes, adds a change result to this object.
     * @param {adf.mf.api.amx.AmxNode} amxNode the affected AMX node
     * @param {number} initialState one of the AMX node state constants representing the node
     *        state before the attributes and children were updated
     * @param {adf.mf.api.amx.AmxAttributeChange} attributeChanges the attribute changes
     *        object for the AMX node
     * @param {number} changeResult the change result returned from updateChildren
     */
    addChangeResult: function(
      amxNode,
      initialState,
      attributeChanges,
      changeResult)
    {
      // Get the closest ancestor rendered AMX node
      var renderedAmxNode = amxNode.__getClosestRenderedNode(true);

      var id = amxNode.getId();

      this._initialStates[id] = initialState;
      this._attributeChanges[id] = attributeChanges;

      this._hasChanges = true;

      // See if this is a recreate result
      if (changeResult == adf.mf.api.amx.AmxNodeChangeResult["REPLACE"])
      {
        this._nodesToRecreate.push(amxNode);
      }

      if (renderedAmxNode == null)
      {
        // The rendered AMX node will be null if the page has not rendered yet, in that case
        // the change result does not matter
        return;
      }

      // Mark the rendered AMX node as one to visit later if the change result is not NONE
      if (changeResult != adf.mf.api.amx.AmxNodeChangeResult["NONE"])
      {
        this._markNodeAffected(renderedAmxNode);
      }

      if (renderedAmxNode === amxNode)
      {
        // Honor the change result if the affected node is currently rendered
        this._changeResult[id] = changeResult;
      }
      else
      {
        // Allow the rendered ancestor to be notified of the change
        this._queueCallToAncestor(amxNode, initialState, attributeChanges, renderedAmxNode);
      }
    },

    _markNodeAffected: function(amxNode)
    {
      var id = amxNode.getId();
      if (this._affectedNodeIds[id] !== true)
      {
        this._affectedNodeIds[id] = true;
        this._affectedNodes.push(amxNode);
      }
    },

    _queueCallToAncestor: function(
      amxNode,
      initialState,
      attributeChanges,
      renderedAmxNode)
    {
      var renderedId = renderedAmxNode.getId();

      // If the rendered AMX node is not the changed AMX node, then we need
      // to ask the rendered node if it wishes to perform a refresh instead
      // of being rerendered
      var changes = this._descendentChanges[renderedId];

      // See if this parent has already been added as one to be called
      if (changes == null)
      {
        // Create a new changes object to be used later
        changes = new adf.mf.api.amx.AmxDescendentChanges();
        this._descendentChanges[renderedId] = changes;
        this._ancestorNodes.push(renderedAmxNode);
      }

      // Add the child's attribute changes and other state to the changes object
      // so that the parent can decide if it can refresh based on the results
      changes.__addAmxNode(
        amxNode,
        initialState,
        attributeChanges);

      // Note that we do not actually call the parent at this point, that is done
      // in a later pass
    }
  };

  /**
   * Called by markNodeForUpdate to update the attributes and initialize any new nodes created
   * as a result.
   * @param {adf.mf.api.amx.AmxNode} rootNode the root AMX node of the page
   * @param {adf.mf.api.amx.AmxNodeUpdateArguments} args the information passed to the
   *        mark node for update function
   * @private
   */
  function applyUpdatesToAmxNodeHierarchy(
    rootNode,
    args)
  {
    var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);
    var affectedAmxNodes = args.getAffectedNodes();
    var visitContext = new adf.mf.api.amx.VisitContext({ "amxNodes": affectedAmxNodes });
    var changes = new AmxNodeChangesResults();

    rootNode.visit(
      visitContext,
      function (
        visitContext,
        amxNode)
      {
        var nodeId = amxNode.getId();
        var affectedAttributes = args.getAffectedAttributes(nodeId);

        // Get the attributes that have changed for this node
        if (isFinestLoggingEnabled)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.internal.amx", "applyUpdatesToAmxNodeHierarchy",
            "Found node to apply updates. ID: " + nodeId);
        }

        var nodeWasRendered = amxNode.isRendered();

        var initialState = amxNode.getState();

        // Notify the node of the changed attributes
        var collectionChanges = args.getCollectionChanges(nodeId);
        var attributeChanges = amxNode.updateAttributes(affectedAttributes, collectionChanges);

        // Notify the tag instances
        amxNode.__updateTagInstanceAttributes(args);

        // See if the AMX node's converter was affected
        amxNode.__processConverterChanges(args, attributeChanges);

        var state = amxNode.getState();
        if (isFinestLoggingEnabled)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.internal.amx", "applyUpdatesToAmxNodeHierarchy",
            "Node attributes have been applied. New node state: " +
            adf.mf.api.amx.AmxNodeStates.getLabelForValue(state));
        }

        if (state == adf.mf.api.amx.AmxNodeStates["UNRENDERED"])
        {
          // Allow the rendered ancestor node to be notified of the change
          changes.addChangeResult(amxNode, initialState, attributeChanges,
            adf.mf.api.amx.AmxNodeChangeResult[nodeWasRendered ? "RERENDER" : "NONE"]);

          // Do not attempt to apply changes to nodes if a parent is not rendered.
          // The node should have removed all the children at this point, so this
          // function does not need to perform that logic.
          return adf.mf.api.amx.VisitResult["REJECT"];
        }

        var skipBuild;
        var changeResult;

        // Do not create or update the children of nodes in the initial state
        if (state != adf.mf.api.amx.AmxNodeStates["INITIAL"])
        {
          if (isFinestLoggingEnabled)
          {
            adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
              "adf.mf.internal.amx", "applyUpdatesToAmxNodeHierarchy",
              "Updating the children of the node");
          }

          // Update the children of the node only if the node is not in the
          // initial state. If it is, then the _buildVisitCallback below
          // will initialize the children
          changeResult = amxNode.updateChildren(attributeChanges);

          // Pick up any changes to the node's state as a result of the updateChildren
          // call.
          state = amxNode.getState();

          // Skip the initialization of the node and descendents if the updateChildren
          // call has caused the state of the node to go back to the initial state.
          // This means that the node's type handler changed the state back to initial
          // as a result of not being able to successfully create its children.
          skipBuild = (state == adf.mf.api.amx.AmxNodeStates["INITIAL"]);

          if (isFinestLoggingEnabled)
          {
            adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
              "adf.mf.internal.amx", "applyUpdatesToAmxNodeHierarchy",
              "New node state: " +
              adf.mf.api.amx.AmxNodeStates.getLabelForValue(state) +
              ". Should the build visit callback be skipped: " + skipBuild +
              ". Update children method returned: " +
              adf.mf.api.amx.AmxNodeChangeResult.getLabelForValue(changeResult));
          }
        }
        else
        {
          changeResult = adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];
          skipBuild = false;
        }

        // Record the change result
        changes.addChangeResult(amxNode, initialState, attributeChanges, changeResult);

        // See if the node has requested to be recreated
        var resultIsRecreate = changeResult == adf.mf.api.amx.AmxNodeChangeResult["REPLACE"];
        if (resultIsRecreate)
        {
          skipBuild = true;
        }

        // Process the children tree under the node to initialize any newly
        // created nodes (does nothing if they are all already rendered or in the
        // unrendered state) as long as the node was able to create its children.
        if (skipBuild == false)
        {
          // Pass in the affected nodes into the visit context. This will allow
          // the _buildVisitCallback to skip any descendent nodes (they will be visited
          // later when they are updated). This improves performance by not visiting
          // the same nodes more than once.
          var contextData = {
            "affectedAmxNodes": affectedAmxNodes,
            "targetNode": amxNode
          };

          amxNode.visit(
            new adf.mf.api.amx.VisitContext({ "data": contextData }),
            adf.mf.internal.amx._buildVisitCallback);

          // Pick up any changes to the state as a result of initialization
          state = amxNode.getState();

          if (isFinestLoggingEnabled)
          {
            adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
              "adf.mf.internal.amx", "applyUpdatesToAmxNodeHierarchy",
              "Node state after invoking the build visit callback: " +
              adf.mf.api.amx.AmxNodeStates.getLabelForValue(state));
          }
        }

        // Do not progress down the hierarchies of nodes that are in the initial state,
        // or are not rendered or if the change result is to replace (recreate) the node
        if (resultIsRecreate ||
          state == adf.mf.api.amx.AmxNodeStates["INITIAL"] ||
          state == adf.mf.api.amx.AmxNodeStates["UNRENDERED"])
        {
          return adf.mf.api.amx.VisitResult["REJECT"];
        }
        else
        {
          return adf.mf.api.amx.VisitResult["ACCEPT"];
        }
      });

    return changes;
  }

  /**
   * Called by markNodeForUpdate to recreate any AMX nodes and their descendants.
   * @private
   */
  function recreateRequestedAmxNodes(
    rootNode,
    changeResults)
  {
    var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);

    // For each node, we actually only want the parent node in context. Therefore, go through the
    // array and collect all of the parent nodes.
    var childNodesByParentId = {};
    var affectedNodeParents = [];
    var amxNode;
    var parentId;

    var amxNodes = changeResults.getAmxNodesToRecreate();

    for (var i = 0, size = amxNodes.length; i < size; ++i)
    {
      amxNode = amxNodes[i];
      if (isFinestLoggingEnabled)
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx", "recreateRequestedAmxNodes",
          "Will attempt to recreate node with ID " + amxNode.getId());
      }

      var parent = amxNode.getParent();
      parentId = parent.getId();
      var children = childNodesByParentId[parentId];
      if (children == null)
      {
        children = [ amxNode ];
        childNodesByParentId[parentId] = children;
        affectedNodeParents.push(parent);
      }
      else
      {
        children.push(amxNode);
      }
    }

    // Now visit each parent
    rootNode.visit(
      new adf.mf.api.amx.VisitContext({ "amxNodes": affectedNodeParents }),
      function(
        visitContext,
        parentAmxNode)
      {
        var parentId = parentAmxNode.getId();
        var children = childNodesByParentId[parentId];
        var recreatedNodes = [];
        var i, size;

        // Loop through each child node that has changes
        for (i = 0, size = children.length; i < size; ++i)
        {
          var amxNode = children[i];
          if (isFinestLoggingEnabled)
          {
            adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
              "adf.mf.internal.amx", "recreateRequestedAmxNodes",
              "Re-creating node " + amxNode.getId());
          }

          var tag = amxNode.getTag();
          var stampKey = amxNode.getStampKey();
          var newAmxNode = tag.buildAmxNode(parentAmxNode, stampKey);

          // Replace the child
          if (parentAmxNode.replaceChild(amxNode, newAmxNode))
          {
            // Push the nodes onto an array to process after initialization
            recreatedNodes.push([ amxNode, newAmxNode ]);
          }
          else
          {
            // TODO: log warning
          }
        }

        // Initialize the new nodes and create their children by visiting
        // the parent so that the parent is put into context
        parentAmxNode.visit(
          new adf.mf.api.amx.VisitContext(),
          adf.mf.internal.amx._buildVisitCallback);

        // Notify the change results of the new children (has to be done after node initialization)
        for (i = 0, size = recreatedNodes.length; i < size; ++i)
        {
          var arr = recreatedNodes[i];
          // Replace the node in the change results object
          changeResults.amxNodeRecreated(arr[0], arr[1]);
        }

        // Return accept since we are visiting the parent of the node to replace and not the node
        // itself.
        return adf.mf.api.amx.VisitResult["ACCEPT"];
      });
  }

  /**
   * Called by markNodeForUpdate to see if ancestor AMX nodes wish to handle changes to non-rendered
   * descendent AMX nodes.
   * @private
   */
  function processDescendentChanges(
    rootNode,
    changeResults)
  {
    var amxNodes = changeResults.getAmxNodesForDescendentChanges();
    var visitContext = new adf.mf.api.amx.VisitContext({ "amxNodes": amxNodes });

    rootNode.visit(
      visitContext,
      function (
        visitContext,
        amxNode)
      {
        var id = amxNode.getId();
        var descendentChanges = changeResults.getDescendentChanges(id);
        var descendentChangeAction = amxNode.__getDescendentChangeAction(descendentChanges);

        // We do not support a value of REPLACE for child refresh changes
        if (descendentChangeAction == adf.mf.api.amx.AmxNodeChangeResult["REPLACE"])
        {
          // TODO: log error
          descendentChangeAction = adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];
        }

        changeResults.setDescendentChangesResult(amxNode, descendentChangeAction);

        return adf.mf.api.amx.VisitResult["ACCEPT"];
      });
  }

  /**
   * Called by markNodeForUpdate to re-render any nodes and invoke and refresh methods
   * as appropriate.
   * @private
   */
  function applyRenderChanges(
    rootNode,
    changeResults)
  {
    var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);
    var affectedNodes = changeResults.getAffectedNodes();
    var visitContext = new adf.mf.api.amx.VisitContext({ "amxNodes": affectedNodes });

    var perf = adf.mf.internal.perf.startMonitorCall("Apply render changes", adf.mf.log.level.FINER, "adf.mf.internal.amx:applyRenderChanges");
    // set flag to prevent independent processing of the init and postDisplay queues
    // only wait if there is some rerender event which enqueues the rendered node into
    // the processing queue and process these queues after the whole refresh is complete
    amx.mustProcessQueues = false;

    rootNode.visit(
      visitContext,
      function (
        visitContext,
        amxNode)
      {
        var id = amxNode.getId();
        var changeResult = changeResults.getChangeResult(id);

        if (isFinestLoggingEnabled)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.internal.amx", "applyRenderChanges",
            "Found node to apply render changes. ID: " + id +
            ". Change result: " +
            adf.mf.api.amx.AmxNodeChangeResult.getLabelForValue(changeResult));
        }

        switch (changeResult)
        {
          case adf.mf.api.amx.AmxNodeChangeResult["REFRESH"]:
            var attributeChanges = changeResults.getAttributeChanges(id);
            var descendentChanges = changeResults.getDescendentChanges(id);

            // Don't pass null as the attribute changes, but instead pass an empty object
            // so that it is easier to work with
            if (attributeChanges == null)
            {
              attributeChanges = new adf.mf.api.amx.AmxAttributeChange();
            }

            amxNode.refresh(attributeChanges, descendentChanges);
            if (isFinestLoggingEnabled)
            {
              adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
                "adf.mf.internal.amx", "applyRenderChanges",
                "Completed the refresh of node " + id);
            }
            break;

          case adf.mf.api.amx.AmxNodeChangeResult["RERENDER"]:
            amxNode.rerender();
            if (isFinestLoggingEnabled)
            {
              adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
                "adf.mf.internal.amx", "applyRenderChanges",
                "Completed the re-render of node " + id);
            }

            // Do not perform operations on the children
            return adf.mf.api.amx.VisitResult["REJECT"];
        }

        if (isFinestLoggingEnabled)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.internal.amx", "applyRenderChanges",
            "Completed the processing of the changes for node " + id);
        }

        return adf.mf.api.amx.VisitResult["ACCEPT"];
      });

      // now process the queues at once to init and postDisplay
      // all newly rendered nodes
      amx.processAndCleanInitQueue();
      amx.processAndCleanPostDisplayQueue();
      // set flag that the single rerender function call on the amxNode should also invoke
      // processing of the init and postDisplay queues
      amx.mustProcessQueues = true;

    perf.stop();
  }

  /**
   * @deprecated
   */
  adf.mf.internal.amx.markNodeForUpdate = function(value)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "markNodeForUpdate", "MSG_DEPRECATED", "adf.mf.internal.amx.markNodeForUpdate",
      "adf.mf.api.amx.markNodeForUpdate");
    return adf.mf.api.amx.markNodeForUpdate.apply(this, arguments);
  };

  /**
   * Function for TypeHandlers to notify the framework of a state change to an AmxNode that requires the
   * AmxNode hierarchy to be updated at that node and below. If a custom createChildrenNodes method
   * exists on the TypeHandlers, it will be called again for these AmxNode. This will allow AmxNode that
   * stamp their children to add new stamps due to a user change.
   * The refresh method will be called on the AmxNode with the provided properties if the AmxNode is
   * ready to render. If the AmxNode is not ready to render, the framework will wait for any EL to be
   * resolved and the refresh method will be called once all the data is available.
   * @param {adf.mf.api.amx.AmxNodeUpdateArguments} args the change arguments
   */
  adf.mf.api.amx.markNodeForUpdate = function(args)
  {
    // See if the function was called with the deprecated API
    if (!(args instanceof adf.mf.internal.amx.AmxNodeUpdateArguments))
    {
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
        "adf.mf.api.amx.markNodeForUpdate", "MSG_DEPRECATED",
        "Passing nodes and objects as arguments",
        "Pass one adf.mf.api.amx.AmxNodeUpdateArguments object");

      // Use a temporary variable until we are done reading from arguments
      var convertedArgs = new adf.mf.internal.amx.AmxNodeUpdateArguments();

      for (var arg = 0, argc = arguments.length; arg < argc; arg += 2)
      {
        amxNode = arguments[arg];
        affectedAttributes = arguments[arg + 1];

        for (var attrName in affectedAttributes)
        {
          convertedArgs.setAffectedAttribute(amxNode, attrName);
        }
      }

      // Now update the args variable
      args = convertedArgs;
    }

    adf.mf.internal.amx._queueCriticalSectionFunction(
      adf.mf.internal.amx._markNodeForUpdateImpl,
      this,
      args);
  };

  adf.mf.internal.amx._markNodeForUpdateImpl = function(
    args)
  {
    // Check if the update has been canceled since it was queued
    if (args.isCanceled())
    {
      if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx._markNodeForUpdateImpl", "Canceled",
          "The node update has been canceled");
      }

      return;
    }

    // Begin tracking EL cache misses in a batch (only if not in the mock data environment)
    if (!adf.mf.environment.profile.mockData)
    {
      adf.mf.el.startGetValueBatchRequest();
    }

    var perfOp = adf.mf.internal.perf.startMonitorOperation("Mark node for update", adf.mf.log.level.FINE,
      "adf.mf.api.amx.markNodeForUpdate");

    var rootNode = adf.mf.api.amx.getPageRootNode();
    try
    {
      // First, ensure the nodes are sorted
      var amxNodes = args.getAffectedNodes();
      if (amxNodes.length > 1)
      {
        adf.mf.api.amx.AmxNode.__sortNodesByDepth(amxNodes);
      }

      // Make a first pass at the nodes. In this pass we are only applying attribute
      // changes and initializing the AMX node hierarchy, no rendering should be done
      // at this point.
      var changeResults = applyUpdatesToAmxNodeHierarchy(rootNode, args);

      // See if any nodes are marked to be re-created
      if (changeResults.getAmxNodesToRecreate().length > 0)
      {
        // Make a second pass to recreate any AMX nodes marked for recreation by
        // the type handler
        recreateRequestedAmxNodes(rootNode, changeResults);

        amxNodes = changeResults.getAffectedNodes();
        // Ensure the nodes are still in the correct hierarchical order
        if (amxNodes.length > 1)
        {
          adf.mf.api.amx.AmxNode.__sortNodesByDepth(amxNodes);
        }
      }

      // Now process any ancestor nodes that are re-rendered to handle changes
      // to descendent AMX nodes
      processDescendentChanges(
        rootNode,
        changeResults);

      var pageBuildPromiseResolve = adf.mf.internal.amx._pageBuildPromiseResolve;

      if (pageBuildPromiseResolve == null)
      {
        // Only perform re-rendering if the page has been rendered
        applyRenderChanges(
          rootNode,
          changeResults);
      }
      // If the page has not yet been rendered and nodes were affected, then go ahead and resolve
      // the page build promise so the render may take place once the update has completed
      else if (changeResults.hasChanges())
      {
        adf.mf.internal.amx._pageBuildPromiseResolve = null;
        pageBuildPromiseResolve(rootNode);
      }
    }
    catch(e)
    {
      adf.mf.internal.amx.errorHandlerImpl(null, e);
    }
    finally
    {
      try
      {
        // Flush the batch so that any missed EL are sent for loading
        if (!adf.mf.environment.profile.mockData)
        {
          adf.mf.el.flushGetValueBatchRequest();
        }
      }
      catch(e)
      {
        adf.mf.internal.amx.errorHandlerImpl(null, e);
      }

      perfOp.stop();

      adf.mf.internal.amx._pageBusyTracker.checkComplete();
    }
  };

  var amxPageRootNode = null;
  adf.mf.internal.amx._buildVisitCallback = function (
    visitContext,
    node)
  {
    var state = node.getState();
    var contextData = visitContext.data;
    if (contextData != null)
    {
      var targetAmxNode = contextData["targetNode"];
      if (targetAmxNode != node)
      {
        // Now see if the node being visited is actually a descendant that
        // will be visited later by another change.
        var affectedAmxNodes = contextData["affectedAmxNodes"];
        if (affectedAmxNodes.indexOf(node) >= 0)
        {
          // No need to visit this node now
          return adf.mf.api.amx.VisitResult["REJECT"];
        }
      }
    }

    if (state == adf.mf.api.amx.AmxNodeStates["UNRENDERED"])
    {
      // If the node is unrendered, nothing more needs to be done
      return adf.mf.api.amx.VisitResult["REJECT"];
    }

    if (state != adf.mf.api.amx.AmxNodeStates["INITIAL"])
    {
      // Only initialize nodes in the initial state. All other states
      // are updated by the data change framework
      return adf.mf.api.amx.VisitResult["ACCEPT"];
    }

    // Initialize the node. This will populate the attributes,
    // both static and EL driven and also create the children
    node.init();

    // Check to see the new state of the node
    switch (node.getState())
    {
      case adf.mf.api.amx.AmxNodeStates["INITIAL"]:
        // Store on the context that a cache miss occurred:
        visitContext._allNodesReadyToRender = false;

        // Do not process the children of a node in the initial state:
        return adf.mf.api.amx.VisitResult["REJECT"];

      case adf.mf.api.amx.AmxNodeStates["UNRENDERED"]:
        // Do not process the children of unrendered nodes:
        return adf.mf.api.amx.VisitResult["REJECT"];

      case adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"]:
        // Store on the context that a cache miss occurred:
        visitContext._allNodesReadyToRender = false;

        // Process the children (type handlers must set the node's state
        // to initial to stop children creation and processing):
        return adf.mf.api.amx.VisitResult["ACCEPT"];

      default:
        return adf.mf.api.amx.VisitResult["ACCEPT"];
    }
  };

  adf.mf.internal.amx._pageBuildPromiseResolve = null;
  /**
   * Builds the AMX node hierarchy.
   *
   * @private
   * @param {string} amxPageName the name of the page that is being loaded.
   * @param {adf.mf.api.amx.AmxTag} rootTag the root AMX tag of the page
   * @return {Object} promise object resolved with the root AMX node once the page
   *         is ready to render.
   */
  function buildAmxNodeTree(
    amxPageName,
    rootTag)
  {
    var promise = new adf.mf.internal.BasePromise(function(resolve, reject)
      {
    var visitContext = null;

    var perf = adf.mf.internal.perf.startMonitorCall("Build AMX node tree", adf.mf.log.level.FINER, "adf.mf.internal.amx:buildAmxNodeTree");
    try
    {
          // Store off the promise object so that we can use it during the first data
      // change event
          adf.mf.internal.amx._pageBuildPromiseResolve = resolve;

      visitContext = new adf.mf.api.amx.VisitContext();
      visitContext._allNodesReadyToRender = true;

      if (amxPageName == null)
      {
        var viewHistory = adf.mf.internal.controller.ViewHistory.peek();
        amxPageName = viewHistory["amxPage"];
      }

      if (rootTag == null)
      {
        rootTag = amxPages[amxPageName];
      }

      amxPageRootNode = rootTag.buildAmxNode(null, null);

      if (!adf.mf.environment.profile.mockData)
      {
        adf.mf.el.startGetValueBatchRequest(); // prevent chatty getValue calls

        // we want to make sure we always are updated with the current values for
        // availableHeight and availableWidth, so we attempt to retrieve the values
        // here and then we can just call getLocalValue in any place afterwards
        adf.mf.internal.amx.evaluateExpression("#{deviceScope.hardware.screen.availableHeight}");
        adf.mf.internal.amx.evaluateExpression("#{deviceScope.hardware.screen.availableWidth}");
      }
      amxPageRootNode.visit(
        visitContext,
        adf.mf.internal.amx._buildVisitCallback);
    }
    catch(e)
    {
      adf.mf.internal.amx.errorHandlerImpl(null, e);
    }
    finally
    {
      perf.stop();
    }

    try
    {
      if (!adf.mf.environment.profile.mockData)
      {
        adf.mf.el.flushGetValueBatchRequest(); // done preventing chatty getValue calls
      }
    }
    catch(e)
    {
      adf.mf.internal.amx.errorHandlerImpl(null, e);
    }

    if (visitContext._allNodesReadyToRender)
    {
      // If there were no cache misses, then do not wait for a data change event
      // and render immediately
          adf.mf.internal.amx._pageBuildPromiseResolve = null;
          resolve(amxPageRootNode);
    }

        // Do not resolve the promise if the node tree has not yet been rendered.
    // We will wait for the first data change event that delivers the first batch
    // of EL values to the cache to render the page.
      },
      true /* needed for jQuery-like callbacks without timeouts */);

    return promise;
  }

  function debugPrintAmxTagTree(tag, prefix)
  {
    if (prefix == null)
    {
      prefix = "";
    }

    var str = prefix + "<" + tag._prefixedName;
    var attr = tag.getAttributes();
    for (var name in attr)
    {
      str += " " + name + "=\"" + attr[name] + "\"";
    }

    var children = tag.getChildren();
    if (children.length == 0)
    {
      str += "/>";
      console.log(str);
      return;
    }

    str += ">";
    console.log(str);
    for (var i = 0, size = children.length; i < size; ++i)
    {
      var childTag = children[i];
      debugPrintAmxTagTree(childTag, prefix + "  ");
    }

    console.log(prefix + "</" + tag._prefixedName + ">");
  }

  function debugPrintAmxNodeTree(rootNode)
  {
    rootNode.visit(
      new adf.mf.api.amx.VisitContext(),
      function(
        visitContext,
        node)
      {
        var prefix = "";
        for (var p = node.getParent(); p != null; p = p.getParent())
        {
          prefix += "  ";
        }
        var str = "AmxNode(" + node.getId() +"): ";
        var attrNames = node.getDefinedAttributeNames();
        for (var i in attrNames)
        {
          str += (attrNames[i] + ":" + node.getAttribute(attrNames[i])) + " ";
        }
        console.log(prefix + str);

        return adf.mf.api.amx.VisitResult["ACCEPT"];
      });
  }

// --------- Rendering Logic --------- //
  /**
   * Singleton object for maintaining a stack of prefixes for IDs on HTML elements inside of
   * iterating AMX nodes.
   */
  var iterationIdStack =
  {
    _prefix: "",
    _lengthStack: [],
    // Valid ID characters are everything that NMTOKEN allows from XML minus ":" since we are using
    // colons as separators. See http://www.w3.org/TR/2000/WD-xml-2e-20000814#NT-Nmtoken
    // For now just check a sub-set of NMTOKEN as the list is quite lengthy of allowed unicode
    // characters.
    _invalidCharsRe: /[^\w\.\-]/g,

    /**
     * Get the current prefix.
     * @return {String} a non-null string to use as a prefix for node IDs
     */
    getCurrentPrefix: function()
    {
      return this._prefix;
    },

    /**
     * Push an iterator prefix onto the stack.
     * @param {string} baseId the ID of the iterating AMX node to use as the base of the ID prefix
     *                 for the iterator's children nodes.
     * @param {Object} iterationKey the object to convert to a string to uniquely identify items
     *                 in the iterator.
     */
    pushIterator: function(baseId, iterationKey)
    {
      // Save off the old prefix length so that we know the length to truncate to during the
      // pop call.
      var oldLength = this._prefix.length;
      this._lengthStack.push(oldLength);

      // Create the new prefix
      var newPrefix = baseId + ":" + this._escapeIterationKey(iterationKey);

      this._prefix += newPrefix + ":";
    },

    /**
     * Pop the prefix back to the value before the current iteration.
     */
    popIterator: function()
    {
      var newLength = this._lengthStack.pop();
      if (newLength > 0)
      {
        this._prefix = this._prefix.substr(0, newLength);
      }
      else
      {
        this._prefix = "";
      }
    },

    /**
     * Escape an iteration key for usage in an HTML ID attribute.
     * @param {Object} iterationKey the key for the current iteration
     * @return {string} an ID-safe string that may be used to identify the current iteration
     * @private
     */
    _escapeIterationKey: function(iterationKey)
    {
      // Note that we may want to consider using an ID token cache to improve memory usage
      // so that smaller strings are used. The disadvantage is that the token generation would
      // have to be repeatable so that the node state would be correctly re-applied. For now,
      // we just wish to ensure there are no invalid characters
      if (iterationKey == null)
      {
        adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "_escapeIterationKey",
          "MSG_INVALID_ITERATION_KEY", iterationKey);
        return "null";
      }
      var strVal = iterationKey.toString();
      // Replace any non-ID friendly values with a sequence of characters unlikely to appear in the
      // value. This assumes that most characters
      // of the iterationKey will be valid and therefore produce a unique key. Using a token
      // cache would address this if this assumption becomes an issue.
      return strVal.replace(this._invalidCharsRe, "._.");
    },

    /**
     * Determine if there is an iteration container.  Searches the prefix for ":" and returns true
     * if the character is found.
     * @return {Boolean} true if an iteration container has been set; false otherwise.
     */
    hasTopIterationContainer: function()
    {
      if (this._prefix.indexOf(":") > -1)
      {
        return true;
      }
      return false;
    },

    /**
     * Returns ID of top-most iteration container.  Finds first occurence of ":" in prefix and returns
     * substring leading up to it.
     * @return {String} ID of top-most iteration container
     */
    getTopIterationContainer: function()
    {
      if (this._prefix.indexOf(":") > -1)
      {
        return this._prefix.substr(0,this._prefix.indexOf(":"));
      }
      return "";
    }
  };

  // ------ resource loading ------ //
  var resourcesData = null;
  // Load the resources.json file that contains the mapping of the resources
  // needed for AMX nodes:
  adf.mf.api.resourceFile.loadJsonFile(
    adf.wwwPath + "js/amx-resources.json",
    true,
    function(data)
    {
      resourcesData = data;
    },
    function()
    {
      // TODO this needs to be promoted to a formal error; do not use amx.log
      amx.log.error("Unable to load the resources JSON file.");
    });

  /**
   * Internal function for loading the JS files from the profile in series.
   * @param {Array.<string>} listOfFiles the list of files to load
   * @return {adf.mf.internal.BasePromise} a promise that will resolve when all Files are loaded
   */
  var loadFilesSequentialPromise = function(listOfFiles)
  {
    var promise = new adf.mf.internal.BasePromise(
      function(resolve, reject)
      {
        // Load the JS resources serially since the order is required due to dependencies:
        if (listOfFiles == null)
        {
          resolve(); // no JS files to load
        }
        else // load all of the files
        {
          _resourceLoadNextResource(resolve, listOfFiles, 0, listOfFiles.length);
        }
      });
    return promise;
  };

  var _resourceLoadNextResource = function(entrireListLoadedResolve, listOfFiles, listIndex, fileCount)
  {
    if (listIndex == fileCount)
    {
      // All jsResource files have been loaded
      entrireListLoadedResolve();
    }
    else // load the next file in the list
    {
      var theResource = listOfFiles[listIndex];
      var nextIndex = listIndex+1;
      var loadState = loadedJavaScriptResources[theResource];
      if (loadState == null) // possibilities are null, a promise, or true
      {
        // No attempt has been made yet to load this file:
        var loadedArrayResolve = null;
        var loadedArrayReject = null;
        loadedJavaScriptResources[theResource] =
          new adf.mf.internal.BasePromise(function(resolve, reject)
            {
              loadedArrayResolve = resolve;
              loadedArrayReject = reject;
            });
        adf.mf.api.resourceFile.loadJsFile(
          theResource,
          true,
          function()
          {
            loadedArrayResolve(theResource);
            loadedJavaScriptResources[theResource] = true;
            _resourceLoadNextResource(entrireListLoadedResolve, listOfFiles, nextIndex, fileCount);
          },
          function(failure)
          {
            loadedArrayReject(failure);
            loadedJavaScriptResources[theResource] = true;
            _resourceLoadNextResource(entrireListLoadedResolve, listOfFiles, nextIndex, fileCount);
          },
          null);
      }
      else if (loadState == true)
      {
        // This file was already loaded so move onto the next file
        _resourceLoadNextResource(entrireListLoadedResolve, listOfFiles, nextIndex, fileCount);
      }
      else
      {
        // Someone has already made a request for it so we need to wait on its promise
        // before we move onto the next file:
        loadState.then(
          function()
          {
            _resourceLoadNextResource(entrireListLoadedResolve, listOfFiles, nextIndex, fileCount);
          });
      }
    }
  };

  /**
   * Called from findResourcesForTag to find all the resources for a given namespace object and tag name.
   * @param {Object} nsObj resources object for a namespace from the JSON object.
   * @param {string} tagName the local AMX node name or "*" for resources global to the namespace.
   * @param {Array.<string>} fileList Array where a list of files to load will be added
   */
  function findTagNsResources(nsObj, tagName, fileList)
  {
    var tagObj = nsObj[tagName];
    if (tagObj == null)
    {
      return;
    }
    var js = tagObj["js"];
    var index, size;
    if (js != null)
    {
      // Load any required javascript files:
      if (Array.isArray(js))
      {
        for (index = 0, size = js.length; index < size; ++index)
        {
          var theResource = js[index];
          if (loadedJavaScriptResources[theResource] !== true && // if undefined or a promise, then push
            fileList.indexOf(theResource) == -1) // prevent repeats
          {
            fileList.push(theResource);
          }
        }
      }
      else
      {
        if (loadedJavaScriptResources[js] !== true) // if undefined or a promise, then push
        {
          if (fileList.indexOf(js) == -1) // prevent repeats
            fileList.push(js);
        }
      }
    }
  }

  /**
   * Function to load any JavaScript or CSS file dependencies for an AMX tag.
   * @param {adf.mf.api.amx.AmxTag} tag the AMX tag.
   * @param {Array.<string>} fileList of resource to be loaded to allow the calling function to
   *                determine when all the resources have been loaded.
   */
  function findResourcesForTag(tag, fileList)
  {
    // The first level of objects are keyed by the namespace URI of the XML node:
    var ns = tag.getNamespace();
    var nsObj = resourcesData[ns];
    if (nsObj != null)
    {
      // Load any resources for all tags in this namespace:
      findTagNsResources(nsObj, "*", fileList);

      // Second level are keyed by the tag's local name:
      findTagNsResources(nsObj, tag.getName(), fileList);
    }

    // Process all the children tags
    var children = tag.getChildren();
    for (var index = 0, size = children.length; index < size; ++index)
    {
      var childTag = children[index];
      findResourcesForTag(childTag, fileList);
    }
  }
  // ------ /resource loading ------ //

  // ------ API for TypeHandlers ------ //

  /**
   * @deprecated
   */
  amx.registerRenderers = function(theNamespace, typeHandlerMap)
  {
    var typeHandlerDetail = "";
    adf.mf.internal.amx._each(typeHandlerMap, function(key, value)
    {
      if (typeHandlerDetail != "")
        typeHandlerDetail += ", ";
      typeHandlerDetail += key;
    });
    adf.mf.log.logInfoResource("AMXInfoBundle",
      adf.mf.log.level.SEVERE, "registerRenderers", "MSG_DEPRECATED", "amx.registerRenderers",
      "Use adf.mf.api.amx.TypeHandler.register for " + typeHandlerDetail + " (namespace " + theNamespace + ")");

    if (theNamespace == "amx")
    {
      adf.mf.log.logInfoResource("AMXInfoBundle",
        adf.mf.log.level.SEVERE, "registerTypeHandlers", "MSG_DEPRECATED", "namespace URL amx",
        "Use the http://xmlns.oracle.com/adf/mf/amx namespace URL instead. " +
        "TypeHandlers = " + typeHandlerMap);
      theNamespace = adf.mf.api.amx.AmxTag.NAMESPACE_AMX;
    }
    else if (theNamespace == "dvtm")
    {
      adf.mf.log.logInfoResource("AMXInfoBundle",
        adf.mf.log.level.SEVERE, "registerTypeHandlers", "MSG_DEPRECATED", "namespace URL dvtm",
        "Use the http://xmlns.oracle.com/adf/mf/amx/dvt namespace URL instead. " +
        "TypeHandlers = " + typeHandlerMap);
      theNamespace = adf.mf.api.amx.AmxTag.NAMESPACE_DVTM;
    }

    adf.mf.internal.amx._each(typeHandlerMap, function(tagName, deprecatedTypeHandlerObject)
    {
      // If it is a function, then, it is actually the "render" of the NodeTypeHandler
        if (deprecatedTypeHandlerObject && (typeof deprecatedTypeHandlerObject === "function"))
      {
        deprecatedTypeHandlerObject =
        {
          render: deprecatedTypeHandlerObject
        };
      }

      // Convert the old style TypeHandler objects into classes needed for the new API:
      var typeHandlerClass = adf.mf.api.amx.TypeHandler.register(theNamespace, tagName);
        adf.mf.internal.amx._each(deprecatedTypeHandlerObject, function(functionName, functionImplementation)
      {
        typeHandlerClass.prototype[functionName] = functionImplementation;
      });
    });
  };

  /**
   * Notify the framework that an iteration node is being processed. Should be called by iterating
   * renderers for each stamp.
   * @param {string} amxNodeId the ID of the iterating AMX node to use as the base of the ID prefix
   *                 for the iterator's children nodes.
   * @param {Object} iterationKey the object to convert to a string to uniquely identify items
   *                 in the iterator.
   */
  amx.beginIterationContainer = function(amxNodeId, iterationKey)
  {
    iterationIdStack.pushIterator(amxNodeId, iterationKey);
  };

  /**
   * Notify the framework that an iteration node has finished being processed. Should be called by
   * iterating renderers after each stamp. Must correspond to a call to beginIterationContainer.
   */
  amx.endIterationContainer = function()
  {
    iterationIdStack.popIterator();
  };

  /**
   * @deprecated
   */
  amx.renderSubNodes = function(amxNode)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "renderSubNodes", "MSG_DEPRECATED", "amx.renderSubNodes", "amxNode.renderDescendants");
    return adf.mf.api.amx.renderSubNodes.apply(this, arguments);
  };

  /**
   * @deprecated
   */
  adf.mf.api.amx.renderSubNodes = function(amxNode)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "renderSubNodes", "MSG_DEPRECATED", "adf.mf.api.amx.renderSubNodes", "amxNode.renderDescendants");

    return amxNode.renderSubNodes();
  };

  /**
   * @deprecated
   */
  amx.isUITag = function(nsPrefixedTagName)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "isUITag", "MSG_DEPRECATED", "amx.isUITag", "AmxTag.isUITag");

    return adf.mf.internal.amx.AmxTagHandler.__hasHandler(nsPrefixedTagName) == false;
  };

  /**
   * @deprecated
   */
  amx.renderNode = function(node)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "renderNode", "MSG_DEPRECATED", "amx.renderNode", "amxNode.render");
    return adf.mf.api.amx.renderNode.apply(this, arguments);
  };

  /**
   * Render a amxNode or the xmlNode. If it is an xmlNode, then, it will be processed before rendering it.
   * @param {(xmlNode|adf.mf.api.amx.AmxNode)} node The node for a given element. Can be the process AMXNode or the XMLNode.
   * @return the rendered DOM node or null if nothing rendered
   */
  adf.mf.api.amx.renderNode = function(node)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle",
      adf.mf.log.level.SEVERE, "renderNode", "MSG_DEPRECATED", "adf.mf.api.amx.renderNode", "amxNode.render");
    return node.renderNode();
  };

  // --------- Critical section --------- //
  /**
   * Singleton class to handle the critical section of updating the AMX node hierarchy
   * @private
   */
  var criticalSection =
  {
    _queue: [],
    _blockedCount: 0,
    _timeout: null,
    _running: false,

    /**
     * Queues a method to be run in the critical section
     * @private
     */
    queue: function(method)
    {
      var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);
      if (isFinestLoggingEnabled)
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx", "criticalSection.queue",
          "Queuing method");
      }
      this._queue.push(method);
      if (this._queue.length == 1 && this._blockedCount == 0 && this._running == false)
      {
        if (isFinestLoggingEnabled)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.internal.amx", "criticalSection.queue",
            "Running method now. Queue length is " + this._queue.length);
        }

        // If this is the only method and we are not blocked, run it synchronously
        this.run();
      }
      else
      {
        if (isFinestLoggingEnabled)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.internal.amx", "criticalSection.queue",
            "Scheduling execution for later. Queue length is " + this._queue.length);
        }

        // Run the method later
        this._scheduleTimeout();
      }
    },

    /**
     * Prevent any more methods from running until the resume has been called. The resume must
     * be called one time for every call to pause.
     * @private
     */
    pause: function()
    {
      ++this._blockedCount;
      if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx", "criticalSection.pause",
          "Blocked count: " + this._blockedCount);
      }
    },

    /**
     * Resume after having been paused
     * @private
     */
    resume: function()
    {
      this._blockedCount = Math.max(0, this._blockedCount - 1);
      if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx", "criticalSection.resume",
          "Blocked count: " + this._blockedCount);
      }
      this._scheduleTimeout();
    },

    /**
     * Runs the next function in critical section
     * @private
     */
    run: function()
    {
      var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);
      if (isFinestLoggingEnabled)
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx", "criticalSection.run",
          "Run invoked");
      }

      this._timeout = null;

      // Ensure that we are ready to run
      if (this._running || this._blockedCount > 0 || this._queue.length == 0)
      {
        if (isFinestLoggingEnabled)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.internal.amx", "criticalSection.run",
            (this._running ? "Run called when a method is already running" :
              (this._blockedCount ?
                ("Block count preventing run. Count: " + this._blockedCount) :
                "The queue is empty"
              )
            ));
        }

        return;
      }

      this._running = true;

      var method = this._queue.shift();
      var methodFinished = false;

      try
      {
        var fn = method["func"];
        var params = method["params"];
        var thisObj = method["thisObj"];

        if (isFinestLoggingEnabled)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.internal.amx", "criticalSection.run",
            "Before critical method invocation. Queue length is now " + this._queue.length);
        }

        var result = fn.apply(thisObj, params);

        // The function is allowed to return a promise object if the task is asynchronous
        // and we need to block until it is fully finished
        if (result != null && typeof(result["then"]) == "function")
        {
          if (isFinestLoggingEnabled)
          {
            adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
              "adf.mf.internal.amx", "criticalSection.run",
              "Promise object was returned, will wait for resolution");
          }
          var callback = adf.mf.internal.getProxyFunction(this, this._promiseCallback);
          result.then(callback, callback);
        }
        else
        {
          if (isFinestLoggingEnabled)
          {
            adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
              "adf.mf.internal.amx", "criticalSection.run",
              "Method finished without a Promise object");
          }
          methodFinished = true;
        }
      }
      catch (e)
      {
        // If there was an exception, a promise object was not returned
        methodFinished = true;

        adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
          "criticalSection.run",
          "MSG_CRITICAL_SECTION_FUNCTION_EXCEPTION", e.message);
      }
      finally
      {
        if (methodFinished)
        {
          this._running = false;
          this._scheduleTimeout();
        }
      }
    },

    /**
     * Callback when a method has returned a promise object
     * @private
     */
    _promiseCallback: function()
    {
      if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx", "criticalSection._promiseCallback",
          "_promiseCallback called");
      }

      this._running = false;
      this._scheduleTimeout();
    },

    /**
     * Schedules the run method to be called when not busy
     * @private
     */
    _scheduleTimeout: function()
    {
      var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);
      if (isFinestLoggingEnabled)
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx", "criticalSection._scheduleTimeout",
          "_scheduleTimeout called");
      }

      // Ensure the critical section is ready before scheduling a callback and ensure that a
      // callback has not already been set
      if (this._running == false && this._timeout == null && this._blockedCount == 0 &&
        this._queue.length > 0)
      {
        if (isFinestLoggingEnabled)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.internal.amx", "criticalSection._scheduleTimeout",
            "Scheduling a timeout");
        }

        this._timeout = window.setTimeout(adf.mf.internal.getProxyFunction(this, this.run), 1);
      }
      else if (isFinestLoggingEnabled)
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx", "criticalSection._scheduleTimeout",
          (this._running ? "A method is already running" :
            (this._timeout != null ? "Timeout was already scheduled" :
              (this._blockedCount != 0 ?
                ("Critical section is blocked. Count: " + this._blockedCount) :
                "Queue is empty"
              )
            )
          ));
      }
    }
  };

  /**
   * Allows code that needs to use the critical section to queue a callback
   * when the critical section is free. This functionality is akin to the Java synchronized
   * block.
   * @param {function} func the function to invoke. It may return a promise object which
   *        will block the critical section until resolved (or fails)
   * @param {Object} thisObject the object to use as "this" when invoking the function.
   * @param {...Object} var_args parameters to pass to the function.
   * @private
   */
  adf.mf.internal.amx._queueCriticalSectionFunction = function(
    func,
    thisObject
    /* ... arguments */)
  {
    if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "adf.mf.internal.amx", "_queueCriticalSectionFunction",
        "Critical section function being queued");
    }

    var params = Array.prototype.slice.call(arguments, 2);
    criticalSection.queue({ "func": func, "thisObj": (thisObject || window), "params": params });
  };

  /**
   * Internal function for usage by type handlers to be able to pause changes to the UI.
   * Typical use case is to prevent updates to the AMX hierarchy and DOM nodes during
   * an animation. This prevents the DOM from being replaced while another task, like animation
   * is under way.
   */
  adf.mf.internal.amx.pauseUIChanges = function()
  {
    criticalSection.pause();
  };

  /**
   * Internal function for usage by type handlers to be able to resume changes to the UI.
   * See adf.mf.internal.amx.pauseUIChanges.
   */
  adf.mf.internal.amx.resumeUIChanges = function()
  {
    criticalSection.resume();
  };

  /**
   * Internal function for usage by the isLoading() API to be able to tell if
   * something is pausing UI changes.
   * See adf.mf.internal.amx.pauseUIChanges.
   */
  adf.mf.internal.amx.isUIChangePaused = function()
  {
    return criticalSection._running || criticalSection._blockedCount != 0;
  };
  // --------- /Critical section --------- //

  // --------- Data Change Logic --------- //
  var queuedBatchDataChanges = [];
  var queuedCollectionModelChanges = {};

  // Used to suspend data change event processing during navigation. If the page is navigating,
  // evaluating EL during a data change event may cause errors from the embedded side.
  var navigationInProgress = false;

  // Used to prevent bulk loads from invalidly be processed across navigation boundaries.
  adf.mf.internal.amx._navigationId = 0;

  /**
   * Process the data change queue once the critical section is available.
   * Method is only to be called from the critical section
   * @private
   */
  function processBatchDataChangeQueue()
  {
    // Ensure that there are queued changes
    if (queuedBatchDataChanges.length == 0)
    {
      return;
    }

    var q = queuedBatchDataChanges;
    var cmc = queuedCollectionModelChanges;

    queuedBatchDataChanges = [];
    queuedCollectionModelChanges = {};

    // Process the changes
    handleDataChangeImpl(q, cmc);
  }

  /**
   * Queue batch data changes and schedule the callback to the processBatchDataChangeQueue.
   * @param {Array.<string>} dependencyArray the array of EL to queue.
   * @param {Object} collectionModelChanges collection model changes
   */
  function queueBatchDataChange(dependencyArray, collectionModelChanges)
  {
    var initialLength = queuedBatchDataChanges.length;
    for (var i = 0, size = dependencyArray.length; i < size; ++i)
    {
      var el = dependencyArray[i];
      // Ensure the EL is only added once
      if (queuedBatchDataChanges.indexOf(el) < 0)
      {
        queuedBatchDataChanges.push(el);
      }

      if (collectionModelChanges != null)
      {
        var collectionChanges = collectionModelChanges[el];
        if (collectionChanges != null)
        {
          var currentCollectionModelChanges = queuedCollectionModelChanges[el];
          if (currentCollectionModelChanges != null)
          {
            // If a value is already present, we cannot merge the changes, so ensure that
            // itemized is false.
            queuedCollectionModelChanges[el] = { "itemized": false };
          }
          else
          {
            queuedCollectionModelChanges[el] = collectionChanges;
          }
        }
      }
    }

    // If the queue was empty, queue the callback to the process function
    // to handle the queued changes once the critical section is available
    if (initialLength == 0)
    {
      adf.mf.internal.amx._queueCriticalSectionFunction(
        processBatchDataChangeQueue,
        this);
    }
  }

  function navigationListener(event)
  {
    if (event.isNavigationStart())
    {
      navigationInProgress = true;

      // Increment the navigationId
      if (adf.mf.internal.amx._navigationId > 1000000)
        adf.mf.internal.amx._navigationId = 0;
      adf.mf.internal.amx._navigationId++;
    }
    else if (event.isNavigationEnd())
    {
      navigationInProgress = false;
      var navResult = event.getNavigationResult();

      if (!navResult.isNewViewId())
      {
        // Handle any queued data change events since a new view was not loaded
        if (queuedBatchDataChanges.length)
        {
          adf.mf.internal.amx._queueCriticalSectionFunction(
            processBatchDataChangeQueue,
            this);
        }
      }
      else
      {
        // There is a new page, do not carry any data change events over from the
        // old view
        queuedBatchDataChanges = [];
      }
    }
  }

  // The 'adfc' window object is loaded after amx-core, so delay the addition if the listener until
  // after the page finishes loading
  document.addEventListener("showpagecomplete",
    function ()
    {
      adfc.NavigationHandler.addNavigationListener(navigationListener);
    }, false);

  // On Android 4.0.x releases, we have noticed that the UI will not always repaint after the DOM
  // has been changed in a data change listener. As a result, we need to check the user agent
  // to see if this is an Android 4.0 device.
  var requiresUiInValidation = false;
  if (adf.mf.internal.amx.agent["type"] == "Android")
  {
    // Example user agent string we want to match:
    // Mozilla/5.0 (Linux; U; Android 4.0.3; ko-kr; LG-L160L Build/IML74K) AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30
    var ua = navigator.userAgent;
    if (/Android 4\.0(\.\d+)?;/.test(ua))
    {
      requiresUiInValidation = true;
    }
  }

  /**
   * Callback used to handle batch data changes.
   * @param {Array} dependencyArray an Array of EL expression dependency strings that have changed
   *        (not full expressions)
   * @see adf.mf.api.addBatchDataChangeListener
   * @private
   */
  adf.mf.internal.amx._handleBatchDataChangeListener = function(
    dependencyArray,
    collectionModelChanges)
  {
    if (dependencyArray != null)
    {
      // If there is no root node, then we are getting a data change during navigation, or during
      // the building of the tree. Since we have not yet built the node hierarchy, we do not need
      // to process the change at this time.
      var rootAmxNode = adf.mf.api.amx.getPageRootNode();
      if (rootAmxNode == null)
      {
        return;
      }

      // Queue the work onto a critical section function
      queueBatchDataChange(dependencyArray, collectionModelChanges);
    }
  }

  /**
   * Process the work of _handleBatchDataChangeListener. This is called from
   * processBatchDataChangeQueue which is run from the critical section.
   * This method should never be called directly, but always from a critical section
   */
  function handleDataChangeImpl(dependencyArray, collectionModelChanges)
  {
      // Do not process data change events during navigation
    if (navigationInProgress)
    {
      return;
    }
    var perfOp = adf.mf.internal.perf.startMonitorOperation("Process data change event", adf.mf.log.level.FINE, 
      "adf.mf.internal.amx._handleBatchDataChangeListener");

    var affectedNodeCount = 0;
    try
    {
      var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);

      if (isFinestLoggingEnabled)
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "adf.mf.internal.amx", "_handleBatchDataChangeListener",
          adf.mf.util.stringify(dependencyArray));
      }

      var markNodeForUpdateArgs = new adf.mf.internal.amx.AmxNodeUpdateArguments();
      var hasCollectionModelChanges = collectionModelChanges != null;
      var collectionChangesElMap = null;

      if (hasCollectionModelChanges)
      {
        collectionChangesElMap = {};
        for (var el in collectionModelChanges)
        {
          var data = collectionModelChanges[el];
          collectionChangesElMap[el] = new adf.mf.api.amx.AmxCollectionChange(data);
        }
      }

      for (var i = 0, size = dependencyArray.length; i < size; ++i)
      {
        var el = dependencyArray[i];
        var valueExpr = adf.mf.internal.el.parser.parse("#{" + el + "}");

        var nodes = adf.mf.api.amx.AmxNode.__getNodesDependentOnElToken(valueExpr);
        for (var n = 0, nodeSize = nodes.length; n < nodeSize; ++n)
        {
          var node = nodes[n];
          var nodeId = node.getId();

          if (isFinestLoggingEnabled)
          {
            adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
              "adf.mf.internal.amx", "_handleBatchDataChangeListener",
              "Node affected by change to EL #{" + el + "}: "+ nodeId);
          }

          var attrNames = node.__getAttributesForElDependency(valueExpr);
          for (var a = 0, asize = attrNames.length; a < asize; ++a)
          {
            var attrName = attrNames[a];
            if (isFinestLoggingEnabled)
            {
              adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
                "adf.mf.internal.amx", "_handleBatchDataChangeListener",
                "Affected attribute: " + attrName);
            }

            markNodeForUpdateArgs.setAffectedAttribute(node, attrName);

            if (hasCollectionModelChanges)
            {
              var collectionChange = collectionChangesElMap[el];
              if (collectionChange != null)
              {
                markNodeForUpdateArgs.setCollectionChanges(nodeId, attrName, collectionChange);
              }
            }
          }

          node.__processTagInstancesForElDependency(markNodeForUpdateArgs, valueExpr);
        }
      }

      affectedNodeCount = markNodeForUpdateArgs.getAffectedNodes().length;
      if (affectedNodeCount > 0)
      {
        if (isFinestLoggingEnabled)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.internal.amx", "_handleBatchDataChangeListener",
            affectedNodeCount + " nodes have been affected by the data changes");
        }

        // Call the internal mark node for update function which does not check for being in
        // the critical section since we are already in the critical section
        adf.mf.internal.amx._markNodeForUpdateImpl(markNodeForUpdateArgs);

        // On Android, there is a bug in the web view that changes from the data change events may
        // not be redrawn. So, invoke a callback to invalidate the WebView, forcing the repainting of
        // the WebView. Bug seen in at least the 4.0.3 Android version of the WebView
        if (requiresUiInValidation && window["AdfmfCallback"] != null)
        {
          window.AdfmfCallback.invalidateUi();
        }
      }
    }
    catch (ex)
    {
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
        "renderNode", "MSG_BATCH_DATA_CHANGE_FAILED", ex);
    }
    finally
    {
      perfOp.stop();
    }
  };

  amx.clearBindings = function()
  {
    adf.mf.api.amx.AmxNode.__clearBindings();
  };

  // Helper method
  // return boolean
  amx.containsELExpressions = function(elString)
  {
		if (!elString)
			return false;
		if (elString.getExpression)
			return true;
		return amx.getElsFromString(elString).length > 0;
  };

  // Helper method
  // return an array
  amx.getElsFromString = function(elString)
  {
    var result = [];

    if (elString != null)
    {
      var regEx = /[#,$]{.*?}/g;
      var m = regEx.exec(elString);
      while (m != null)
      {
        if (result.indexOf(m[0]) < 0)
        {
          result.push(m[0]);
        }
        m = regEx.exec(elString);
      }
    }

    return result;
  };
  // --------- /Data Change Logic --------- //

  /**
   * An event triggering an outcome-based navigation.
   * See also the Java API oracle.adfmf.amx.event.ActionEvent.
   * @constructor
   */
  adf.mf.api.amx.ActionEvent = function()
  {
    this[".type"] = "oracle.adfmf.amx.event.ActionEvent";
  };
  amx.ActionEvent = adf.mf.api.amx.ActionEvent; // deprecated syntax

  /**
   * A DOM event.
   * @param {string} amxNodeId the component ID
   * @param {Object} eventType the type of event
   * @param {Event} originalEvent the original DOM event object
   * @constructor
   */
  adf.mf.api.amx.DomEvent = function(amxNodeId, eventType, originalEvent)
  {
    this[".type"] = "oracle.adfmf.amx.event.DomEvent";
    this.amxNodeId = amxNodeId;
    this.eventType = eventType;
    this.source = originalEvent.target;
    this.currentTarget = originalEvent.currentTarget;
    this.originalEvent = originalEvent;
  };

  /**
   * An event for notifying that a specified row has been moved.
   * It contains the key for the row that was moved along with the key for the row it was inserted before.
   * See also the Java API oracle.adfmf.amx.event.MoveEvent.
   * @param {Object} rowKeyMoved the rowKey that was moved
   * @param {Object} rowKeyInsertedBefore the rowKey that the moved row was inserted before
   * @constructor
   */
  adf.mf.api.amx.MoveEvent = function(rowKeyMoved, rowKeyInsertedBefore)
  {
    this[".type"] = "oracle.adfmf.amx.event.MoveEvent";
    this.rowKeyMoved = rowKeyMoved;
    this.rowKeyInsertedBefore = rowKeyInsertedBefore;
  };
  adf.mf.internal.amx.MoveEvent = adf.mf.api.amx.MoveEvent; // deprecated syntax

  /**
   * An event for changes of selection for a component.
   * See also the Java API oracle.adfmf.amx.event.SelectionEvent.
   * @param {Object} oldRowKey the rowKey that has just been unselected
   * @param {Array<Object>} selectedRowKeys the array of rowKeys that have just been selected.
   * @constructor
   */
  adf.mf.api.amx.SelectionEvent = function(oldRowKey, selectedRowKeys)
  {
    this.oldRowKey = oldRowKey;
    this.selectedRowKeys = selectedRowKeys;
    this[".type"] = "oracle.adfmf.amx.event.SelectionEvent";
  };
  amx.SelectionEvent = adf.mf.api.amx.SelectionEvent; // deprecated syntax

  /**
   * An event for changes of value for a component.
   * See also the Java API oracle.adfmf.amx.event.ValueChangeEvent.
   * @param {Object} oldValue the previous value of the component.
   * @param {Object} newValue the new value of the component.
   * @constructor
   */
  adf.mf.api.amx.ValueChangeEvent = function(oldValue, newValue)
  {
    this.oldValue = oldValue;
    this.newValue = newValue;
    this[".type"] = "oracle.adfmf.amx.event.ValueChangeEvent";
  };
  amx.ValueChangeEvent = adf.mf.api.amx.ValueChangeEvent; // deprecated syntax

  /**
   * An event for range changes for a component (e.g. load more rows in listView).
   * See also the Java API oracle.adfmf.amx.event.RangeChangeEvent.
   * @param {string} eventSourceId the source ID of the event
   * @param {string} contextFreeValue the context-free value expression or null if not available
   * @param {Object} lastLoadedRowKey the row key of the last row loaded before the requested range or null if not available
   * @param {number} fetchSize the size to fetch or null if not available
   * @constructor
   */
  adf.mf.api.amx.RangeChangeEvent = function(
    eventSourceId,
    contextFreeValue,
    lastLoadedRowKey,
    fetchSize)
  {
    this.eventSourceId = eventSourceId;
    this.contextFreeValue = contextFreeValue;
    this.lastLoadedRowKey = lastLoadedRowKey;
    this.fetchSize = fetchSize;
    this[".type"] = "oracle.adfmf.amx.event.RangeChangeEvent";
    // Consider using: this[".type"] = "oracle.adfmf.framework.event.RangeChangeEvent";
  };

  /**
   * Process an AMX Event. Change the value if attributeValueName is defined, process the appropriate
   * setPropertyListener and actionListener sub tags and then process the [amxEventType]Listener attribute.
   * @param {adf.mf.api.amx.AmxNode} amxNode The node to process the event on.
   * @param {string} amxEventType String that represents the event type that triggered the call.
   * @param {string} attributeValueName The name of the attribute whose value will be changed (or undefined if not applicable).
   * @param {string} newValue The new value to be applied to the attribute sent in (or undefined if not applicable).
   * @param {Object} amxEvent The new AmxEvent being queued.
   * @param {Object} finishedCallback The optional function to invoke once the event has been processed.
   * @deprecated
   */
  amx.processAmxEvent = function(
    amxNode,
    amxEventType,
    attributeValueName,
    newValue,
    amxEvent,
    finishedCallback)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.WARNING, "processAmxEvent",
      "MSG_DEPRECATED", "amx.processAmxEvent", "amxNode.processAmxEvent");
    return adf.mf.api.amx.processAmxEvent(amxNode, amxEventType,
      attributeValueName, newValue, amxEvent, finishedCallback);
  };

  //adf.mf.internal.amx._useBatchProcessing = false;

  /**
   * Process an AMX Event. Change the value if attributeValueName is defined, process the
   * appropriate setPropertyListener and actionListener sub tags and then process the
   * [amxEventType]Listener attribute. For valueChange events, the attribute must have already
   * been registered on the node as the input value. Use getInputValueAttribute on the type handler
   * of the AMX node to return the attribute name that accepts the input value for which value
   * changes occur.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode The node to process the event on.
   * @param {string} amxEventType String that represents the event type that triggered the call.
   * @param {(string|undefined)} attributeValueName The name of the attribute whose value will be
   *        changed (or undefined if not applicable).
   * @param {(string|undefined)} newValue The new value to be applied to the attribute sent in
   *        (or undefined if not applicable).
   * @param {Object} amxEvent The new AmxEvent being queued.
   * @param {function=} successfulCallback An optional function to invoke once the event has been
   *        successfully processed.
   * @param {function=} failureCallback Optional callback function if the processing of the event
   *        fails
   */
   adf.mf.api.amx.processAmxEvent = function(
    amxNode,
    amxEventType,
    attributeValueName,
    newValue,
    amxEvent,
    successfulCallback,
    failureCallback)
  {
    // Need a wrapper promise incase we are in design time and we will resolve this either in the else
    // or end of phase 4.
    var that = this;
    var promise = new adf.mf.internal.BasePromise(
      function(resolve, reject)
      {
    var currPage = amx.getCurrentPageName();
    var nodeId = amxNode.getId();
    adf.mf.internal.amx._pageBusyTracker.startOperation(
        true,
        "Process AMX event",
        adf.mf.log.level.INFO,
        "Time to process event",
        "Page: " + currPage + " event of type " + amxEventType + " on node " + nodeId);

    // No adf.mf.internal.amx._pageBusyTracker.checkComplete will be called from this method. This
    // allows any subsequent data change events to be tracked and included in the current operation

    if (adf.mf.api.amx.getPageRootNode() == null)
    {
      // Do not process any events after the page has been unloaded.
      // This may happen if an event kicks off a navigation and other events are still being
      // delivered.
          reject();
    }
    else
    {
      var funcType = adf.mf.internal.amx.processAmxEventImplSerial;
      if (adf.mf.environment.profile.useBatchProcessing && !adf.mf.environment.profile.mockData)
      {
        funcType = adf.mf.internal.amx.processAmxEventImplBatch;
      }

      adf.mf.internal.amx._queueCriticalSectionFunction(
        funcType,
            that,
        amxNode,
        amxEventType,
        attributeValueName,
        newValue,
        amxEvent,
            {
              "resolve": resolve,
              "reject": reject
            });
    }
      });

    if (successfulCallback != null)
    {
      promise.then(successfulCallback);
    }

    if (failureCallback != null)
    {
      promise["catch"](failureCallback);
    }

    return promise;
  };

  adf.mf.internal.amx.processAmxEventImplBatch = function(
    amxNode,
    amxEventType,
    attributeValueName,
    newValue,
    amxEvent,
    promiseArgs)
  {
    // Return a promise object to the critical section
    return new adf.mf.internal.BasePromise(function(batchResolve, batchReject)
      {
    // Perform a visit to the node to put it back into context
    // TODO: find a way to get context free EL for listener tags so that we do not need to re-establish context
    var rootNode = adf.mf.api.amx.getPageRootNode();
    if (rootNode == null)
    {
      // Do not process any events after the page has been unloaded.
      // This may happen if an event kicks off a navigation and other events are still being delivered.
          promiseArgs["reject"]();
          batchReject();
          return;
    }

    var perf = adf.mf.internal.perf.startMonitorCall("Process AMX batch", adf.mf.log.level.FINER, "adf.mf.internal.amx.processAmxEventImplBatch");

    // Check if the deprecated API is in use (passing the AMX node as a jQuery object with the
    // root DOM element)
    if (amxNode != null && amxNode.jquery)
    {
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.WARNING,
        "processAmxEventImplBatch", "MSG_DEPRECATED", "adf.mf.api.processAmxEvent with a jQuery parameter",
        "adf.mf.api.amx.processAmxEvent with an adf.mf.api.amx.AmxNode as the first parameter");
      amxNode = amxNode.data("amxNode");
    }

    // Show the loading indicator as this could take some time to process.
    adf.mf.api.amx.showLoadingIndicator();

    // We need to use visit pattern to set up the context for this node the event is attached to.
    var nodeFound = rootNode.visit(
      new adf.mf.api.amx.VisitContext({ "amxNodes": [ amxNode ] }),
      function (visitContext, amxNode)
      {
        // This function is only called when the node has been found and the context setup.
            var validationGroup = null;
        var popupActions = [];
        if (!adf.mf.environment.profile.dtMode)
        {
          // Start the batch request. This is to prevent us from doing all the set property and action event one at a time and
          // instead process all all the children at once we queue up all the EL that needs to be proccessed in order. Once
          // completed the flush will process all the EL in one round trip.
          adf.mf.util.startBatchRequest();

          adf.mf.internal.pushNonBlockingCall();
          // detect if we might need to refresh the validation message area
          if (amxEventType === "valueChange" &&
            attributeValueName === amxNode.__getAttributeToValidate())
          {
            // First find the closest rendered node for validation group purposes
            var domNode = null;
            var renderedAmxNode = amxNode.__getClosestRenderedNode();
            if (renderedAmxNode != null)
            {
              domNode = document.getElementById(renderedAmxNode.getId());
            }

                // we need to retrieve this here because calling setElValue will cause this domNode to potentially
            // be swapped out with a new one if the control doesn't support the refresh method
                validationGroup = _getClosestWithClass(domNode, "amx-validationGroup");
          }

          // If this is a value change event then we need to convert the new value first before we continue to process.
          var converter = amxNode.getConverter();
          if (converter && amxEventType === "valueChange" && attributeValueName === "value")
          {
            var rawValue = newValue;
            newValue = converter.getAsObject(newValue);
            if (newValue === "" && rawValue !== "")
            {
              // There was a conversion error, do not process the event
              return adf.mf.api.amx.VisitResult["COMPLETE"];
            }
          }

          // Phase 1) Set the new value on the attribute. We need to first fetch the current value of the attribute (this
          //          has to be an EL Expression so we assume it is and let the setELValue figure out where it really needs
          //          to go. For our part we just get the value for this attribute that get returned and assume it is an
          //          EL expression for this attribute. This is  different from the rich client. First we
          //          know what the type (EL Expression or literal) and set the value immediatly if this is a literal. Once
          //          the "value" has been fetched for this attribute then the assumed EL expression and send off in another
          //          request for to be updated with the new value.

          // Make sure we have an attribute value name we are looking to update.
          if (attributeValueName)
          {
                // TODO: Need to change this into a non-promise call as we are in batch mode here.
            amxNode.setAttribute(attributeValueName, newValue);
          }

          // Phase 2) Process the setPropertyListeners and actionListeners of this node passed in. Since any component
          //          can have other types of components we are going to be looking for specific component types. We
              //          need to create a childrenPromise to make sure we can wait on this before we go to the next phase.
          // Get all the child tag instances from the AMX node.
          var tagInstances = amxNode.__getAllTagInstances();
          // Loop over all the children
          // Looking for one of five specific AMX tags here.
          //   1) setPropertyListener
          //   2) actionListener
          //   3) clientListener
          //   4) showPopupBehavior
          //   5) closePopupBehavior
          for (var i=0, length = tagInstances.length; i < length; i++)
          {
            var tagInstance = tagInstances[i];
            // Get the attribute type. If none is specified assume an action attribute.
            // TODO: Not sure thie assumption is correct as it assumes a type when none existis. I would expect a type
            //       would always be specified but because you are looking at AMX XML nodes we only see what is defined.
            var attrType;
            var type = tagInstance.getAttribute("type");
            if (type != null)
            {
              attrType = adf.mf.internal._getEventTypeResolvedForBidi(type);
            }
            else
            {
              // use default type
              attrType = "action";
            }

            var subTag = tagInstance.getTag();

            if ((subTag.getNsPrefixedName() ===
                adf.mf.api.amx.AmxTag.NAMESPACE_AMX + ":setPropertyListener") &&
              attrType === amxEventType)
            {
              // Get the from expression
              var from = tagInstance.getAttributeExpression("from");
              var isEl = false;
              if (from) {
                from = from.toContextFreeExpression().getExpression();
                isEl = true;
              } else {
                from = tagInstance.getAttribute("from", false);
              }
              if (from != null)
              {
                // Get a context free EL expression for the "to" so that we do not need to perform another visit
                // to set the value.
                var toEl = tagInstance.getAttributeExpression("to").toContextFreeExpression();

                // Set the value without trying to resolve the "from" value.
                var setObject = {
                  "name": toEl.getExpression(),
                  "expression": toEl,
                  "value": from
                };
                if (isEl)
                {
                  setObject[adf.mf.internal.api.constants["VALUE_REF_PROPERTY"]] = true; // "from" is just a reference alias
                }

                amx.setElValue(setObject);
              }
            }
            else if (subTag.getNsPrefixedName() === adf.mf.api.amx.AmxTag.NAMESPACE_AMX+":actionListener")
            {
              // Process the action listener tag if there is an amxEventType passed matches the attribute type.
              if (attrType == amxEventType)
              {
                // Create the arrays of paramaters and and paramater types.
                var params     = [];
                var paramTypes = [];
                if (amxEvent)
                {
                  params.push(amxEvent);
                  paramTypes.push(amxEvent[".type"]);
                }

                    // Invoke the action event. This returns a promise.
                var expr = tagInstance.getAttributeExpression("binding");
                adf.mf.api.amx.invokeEl(expr, params, null, paramTypes);
              }
            }
            else if ((subTag.getNsPrefixedName() ===
                adf.mf.api.amx.AmxTag.NAMESPACE_AMX + ":clientListener") &&
              attrType === amxEventType)
            {
              // Execute it:
              adf.mf.internal._processClientListener(attrType, amxEvent, amxNode, tagInstance);
            }
            else if (subTag.getNsPrefixedName() === adf.mf.api.amx.AmxTag.NAMESPACE_AMX+":showPopupBehavior")
            {
              // Process the show popup behavior tag if there is an amxEventType passed in matches the attribute type.
              if (attrType === amxEventType)
              {
                popupActions.push({"type": "show", "node": amxNode, "tagInstance": tagInstance});
              }
            }
            else if (subTag.getNsPrefixedName() === adf.mf.api.amx.AmxTag.NAMESPACE_AMX+":closePopupBehavior")
            {
              // Process the close popup behavior tag if there is an amxEventType passed in matches the attribute type.
              if (attrType === amxEventType)
              {
                popupActions.push({"type": "close", "node": amxNode, "tagInstance": tagInstance});
              }
            }
          }
          // Start of Phase 3.
          // Process the listener if there is an amxEvent passed in and we have a listenr attribute on the compoenent.
          if (amxEvent)
          {
            var attParams     = [];
            var attParamTypes = [];
            attParams.push(amxEvent);
            attParamTypes.push(amxEvent[".type"]);

            var el = amxNode.getAttributeExpression(amxEventType + "Listener");
            adf.mf.api.amx.invokeEl(el, attParams, null, attParamTypes);
          }

          var scb = function(request, response)
          {
            // Check if an exception was returned (the success callback is still invoked in these
            // cases, so this callback must process the presence of an exception)
            if (Array.isArray(response) && response.length >= 1)
            {
              var rl = response.length;
              for (var r=0; r < rl; r++)
              {
                var obj = response[r];
                if (obj != null && obj[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] === true)
                {
                    // Call the failure callback instead
                    fcb(request, response);
                    return;
                }
              }
            }

            // Have a call back from all the events being proccessed. Now need to go over the popup stack and
            // process them
            for (var j=0, len = popupActions.length; j < len; j++)
            {
              amxNode = popupActions[j]["node"];
              var tagInstance = popupActions[j]["tagInstance"];
              var type = popupActions[j]["type"];

              // we want to show the popup
              rootNode.visit(
                new adf.mf.api.amx.VisitContext({ "amxNodes": [ amxNode ] }),
                function (visitContext, amxNode)
                {
                      // Invoke the show popup behavior. This returns a promise to the calling function.
                  if (type == "show")
                  {
                    amx.processShowPopupBehavior(amxNode, tagInstance);
                  }
                  else
                  {
                    amx.processClosePopupBehavior(amxNode, tagInstance);
                  }

                  return adf.mf.api.amx.VisitResult["COMPLETE"];
                });
            }

            // Phase 4) Required Validations process the required validators. First we will wait for the previous phase to
            //          complete.
            // detect if we need to refresh the validation message area
                if (validationGroup !== undefined && adf.mf.api.amx.isValueTrue(amxNode.getAttribute("required")))
            {
                  // Due to the fact that we have been called back both by the setAttribute promise
              // object as well as the serialResolve being used to iterate the children, we have
              // lost the context of the amxNode. Use a visit to re-obtain the context so that
              // iterating EL expressions may be correctly evaluated.
              rootNode.visit(
                new adf.mf.api.amx.VisitContext({ "amxNodes": [ amxNode ] }),
                function (visitContext, amxNode)
                {
                  // this is a required value, so refresh the messages for this group
                  // let the validation context know that this group has been modified
                  // this method is defined in amx-validation.js
                      amx.requiredControlValueChanged(validationGroup);
                  return adf.mf.api.amx.VisitResult["COMPLETE"];
                });
            }

                // resolve the root promise
                promiseArgs["resolve"]();
                batchResolve();
            adf.mf.api.amx.hideLoadingIndicator();
            adf.mf.internal.popNonBlockingCall();
          };
          var fcb = function()
          {
                // resolve the root promise
                promiseArgs["reject"].apply(null, arguments);
                batchReject.apply(null, arguments);
            adf.mf.api.amx.hideLoadingIndicator();
            adf.mf.internal.popNonBlockingCall();
            // TODO: Need to do something here. Not sure what
          };

          // Done processing all the events in batch mode. Time to send them over to the java side
          // to be processed
          perf.stop();
          adf.mf.util.flushBatchRequest(false, [scb], [fcb]);
        }
        else
        {
          perf.stop();

              // if adf.mf.environment.profile.dtMode, just resolve the promise
              promiseArgs["resolve"]();
              batchResolve();
          adf.mf.api.amx.hideLoadingIndicator();
        }

        return adf.mf.api.amx.VisitResult["COMPLETE"];
      });

    if (nodeFound == false)
    {
      perf.stop();

      // This may happen if an AMX event is processed after a navigation takes place. If so,
          // then just resolve the promise and hide the loading indicator
          promiseArgs["reject"]();
          batchReject();
      adf.mf.api.amx.hideLoadingIndicator();
    }
      });
  };

  adf.mf.internal.amx.processAmxEventImplSerial = function(
    amxNode,
    amxEventType,
    attributeValueName,
    newValue,
    amxEvent,
    promiseArgs)
  {
    return new adf.mf.internal.BasePromise(
      function(serialPromiseResolve, serialPromiseReject)
      {
    // Perform a visit to the node to put it back into context
    // TODO: find a way to get context free EL for listener tags so that we do not need to re-establish context
    var rootNode = adf.mf.api.amx.getPageRootNode();
    if (rootNode == null)
    {
      // Do not process any events after the page has been unloaded.
      // This may happen if an event kicks off a navigation and other events are still being delivered.

          promiseArgs["reject"]();
          serialPromiseReject();
          return;
    }

    // Prevent any data change events from processing while the event is being processed.
    // This is necessary to stop the AMX node hierarchy from being modified as we are
    // processing the child tags and nodes of the target node. If we remove the target,
    // we are no longer able to setup context of the node using visiting.
    var perf = adf.mf.internal.perf.startMonitorCall("Process AMX event", adf.mf.log.level.FINER, "adf.mf.internal.amx.processAmxEventImplSerial");

    // Check if the deprecated API is in use (passing the AMX node as a jQuery object with the
    // root DOM element)
    if (amxNode != null && amxNode.jquery)
    {
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.WARNING,
        "processAmxEventImplSerial", "MSG_DEPRECATED", "adf.mf.internal.amx.processAmxEvent with a jQuery parameter",
        "adf.mf.api.amx.processAmxEvent with an adf.mf.api.amx.AmxNode as the first parameter");
      amxNode = amxNode.data("amxNode");
    }

    // Show the loading indicator as this could take some time to process.
    adf.mf.api.amx.showLoadingIndicator();

    // We need to use visit pattern to set up the context for this node the event is attached to.
    var nodeFound = rootNode.visit(
      new adf.mf.api.amx.VisitContext({ "amxNodes": [ amxNode ] }),
      function (visitContext, amxNode)
      {
            var validationGroup = null;
        if (!adf.mf.environment.profile.dtMode)
        {
          adf.mf.internal.pushNonBlockingCall();
          // detect if we might need to refresh the validation message area
          if (amxEventType === "valueChange" &&
            attributeValueName === amxNode.__getAttributeToValidate())
          {
            // First find the closest rendered node for validation group purposes
            var domNode = null;
            var renderedAmxNode = amxNode.__getClosestRenderedNode();
            if (renderedAmxNode != null)
            {
              domNode = document.getElementById(renderedAmxNode.getId());
            }

                // we need to retrieve this here because calling setElValue will cause this domNode to potentially
            // be swapped out with a new one if the control doesn't support the refresh method
                validationGroup = _getClosestWithClass(domNode, "amx-validationGroup");
          }

          // If this is a value change event then we need to convert the new value first before we continue to process.
          if (amxNode.getConverter() && amxEventType === "valueChange" && attributeValueName === "value")
          {
            newValue = amxNode.getConverter().getAsObject(newValue);
          }

          // Phase 1) Set the new value on the attribute. We need to first fetch the current value of the attribute (this
          //          has to be an EL Expression so we assume it is and let the setELValue figure out where it really needs
          //          to go. For our part we just get the value for this attribute that get returned and assume it is an
          //          EL expression for this attribute. This is  different from the rich client. First we
          //          know what the type (EL Expression or literal) and set the value immediatly if this is a literal. Once
          //          the "value" has been fetched for this attribute then the assumed EL expression and send off in another
          //          request for to be updated with the new value.
          // TODO: I do not know what this means for input values as they are most likly never EL bound. Another question
          //       is what does this mean for disclosure state. In the rich client EL driven disclosure state is only driven
          //       the first time it is evaluated and from then on it is controlled by the component (or the developer) who
          //       set the value in JS.

              // Need a new promise to represent when the set has completed. Since this can go to Java that means this operation
          // may happen asynchronously and we need to wait for it to finish. This will be initialized later but we need this
              // defined here for scoping purposes as this is used below in the promise.all.
              var setValuePromise = [];
          // Make sure we have an attribute value name we are looking to update.
          if (attributeValueName)
          {
                setValuePromise.push(amxNode.setAttribute(attributeValueName, newValue));
          }

              // Wait for Phase 1 to complete.
              // Note: when setValuePromise is undefined, then, the promise.all will resolve immediately (which is what we want).
          // Other wise we will continue to wait until the set value has completed.
              var childrenPromise = null;
              adf.mf.internal.BasePromise.all(setValuePromise)["catch"](function()
          {
                // bug 16371894: setValuePromise failed so we abort further processing and reject childrenPromise
            adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "adf.mf.internal.amx.processAmxEventImplSerial", "MSG_PROCESS_AMX_EVENT_SET_VALUE_REJECTED", newValue);
                childrenPromise = new adf.mf.internal.BasePromise(
                  function(resolve, reject)
                  {
                    reject();
                  });
          })
              .then(function()
          {
            // Phase 2) Process the setPropertyListeners and actionListeners of this node passed in. Since any component
            //          can have other types of components we are going to be looking for specific component types. We
                //          need to create a childrenPromise to make sure we can wait on this before we go to the next phase.
            // Get all the child tag instances from the AMX node.
            var tagInstances = amxNode.__getAllTagInstances();
                //  Need a new promise variable as proccessing the child components action, set property, show popup, close popu
            //  behaviors may require calls into the Java engine and this will always be done Asynchronously.
            if (tagInstances.length > 0)
            {
              // Restore the child variables if this is an iterator or stamped component. This is required in order to
              // process the specific children in the same and have thier attribute EL or values.
              // Call serialResolve on the chidlren and pass it the anonyos function to be applied to all the children.
                  // The returned promise will be used to make sure to wait on it before perfriming the next phase.
              // TODO: Break this our into its own function. This shoudl be a simple case statement that calls the specific
              //       function for the type of component.
                  childrenPromise = amx.serialResolve(tagInstances, function(tagInstance, i)
              {
                // Get the attribute type. If none is specified assume an action attribute.
                // TODO: Not sure thie assumption is correct as it assumes a type when none existis. I would expect a type
                //       would alwats be specified but because you are looking at AMX XML nodes we only see what is defined.
                var attrType;
                if (tagInstance.getAttribute("type") != null)
                {
                  attrType = adf.mf.internal._getEventTypeResolvedForBidi(tagInstance.getAttribute("type"));
                }
                else
                {
                  // use default type
                  attrType = "action";
                }

                var subTag = tagInstance.getTag();

                // Looking for one of five specific AMX tags here.
                //   1) setPropertyListener
                //   2) actionListener
                //   3) clientListener
                //   4) showPopupBehavior
                //   5) closePopupBehavior
                // TODO: this code could explode as more behaviors are added. This needs to be broken out into a core
                //       behavior class that is subclassed by the specific behaviors. and then just call the function on the
                //       behavior. Maybe this should be an interface that we look for and then execute the function if it is
                //       defined.
                if (subTag.getNsPrefixedName() === adf.mf.api.amx.AmxTag.NAMESPACE_AMX+":setPropertyListener" && attrType === amxEventType)
                {
                      // Need a new promise as set property listener has two phases. One to retrieve the data "from" and one to set the "to".
                      var propPromiseResolve = null;
                      var propPromise = new adf.mf.internal.BasePromise(
                        function(resolve, reject)
                        {
                          propPromiseResolve =
                            function()
                            {
                              resolve();
                            };
                        });

                      // Due to the fact that we have been called back both by the setAttribute promise
                  // object as well as the serialResolve being used to iterate the children, we have
                  // lost the context of the amxNode. Use a visit to re-obtain the context so that
                  // iterating EL expressions may be correctly evaluated.
                  var nestedVisitNodeFound = rootNode.visit(
                    new adf.mf.api.amx.VisitContext({ "amxNodes": [ amxNode ] }),
                    function (visitContext, amxNode)
                    {
                      // Get the from expression
                      var fromEL = tagInstance.getAttributeExpression("from");
                      if (fromEL)
                      {
                        // Get a context free EL expression for the "to" so that we do not need to perform another visit
                        // to set the value.
                        var toEl = tagInstance.getAttributeExpression("to").toContextFreeExpression();
                        // Get the value and when it has been retieved the always function will be invoked and this is where
                        // we will set the value we just retrieved.
                            var getAlways = 
                              function(requestAndResponse)
                          {
                                var response = requestAndResponse[1];
                            // Have the new value now set it based on the EL binding for the element.
                            amx.setElValue(
                              {
                                "name": toEl.getExpression(),
                                "expression": toEl,
                                "value": response[0].value
                                  }).then(propPromiseResolve, propPromiseResolve);
                              };
                            amx.getElValue(fromEL).then(getAlways, getAlways);
                      }
                      else
                      {
                        var from = tagInstance.getAttribute("from", false);
                        // Get a context free EL expression for the "to" so that we do not need to perform another visit
                        // to set the value.
                        var toEl = tagInstance.getAttributeExpression("to").toContextFreeExpression();
                        amx.setElValue(
                          {
                            "name": toEl.getExpression(),
                            "expression": toEl,
                            "value": from
                              }).then(propPromiseResolve, propPromiseResolve);
                      }

                      return adf.mf.api.amx.VisitResult["COMPLETE"];
                    });

                  if (nestedVisitNodeFound == false)
                  {
                        // Resolve the promise if the node could no longer be found
                        propPromiseResolve();
                  }

                      // Return the promise to the calling function (This is within the amx.serialResolve. It needs
                  // this as it will wait for this to finish before going to the next child in the hiearchy.
                      return propPromise;
                }
                else if (subTag.getNsPrefixedName() === adf.mf.api.amx.AmxTag.NAMESPACE_AMX+":actionListener")
                {
                  // Process the action listener tag if there is an amxEventType passed matches the attribute type.
                  if (attrType == amxEventType)
                  {
                    // Create the arrays of paramaters and and paramater types.
                    var params     = [];
                    var paramTypes = [];
                    if (amxEvent)
                    {
                      params.push(amxEvent);
                      paramTypes.push(amxEvent[".type"]);
                    }

                        var actionListenerPromise = null;

                        // Due to the fact that we have been called back both by the setAttribute promise
                    // object as well as the serialResolve being used to iterate the children, we have
                    // lost the context of the amxNode. Use a visit to re-obtain the context so that
                    // iterating EL expressions may be correctly evaluated.
                    rootNode.visit(
                      new adf.mf.api.amx.VisitContext({ "amxNodes": [ amxNode ] }),
                      function (visitContext, amxNode)
                      {
                            // Invoke the action event. This returns a promise.
                        var expr = tagInstance.getAttribute("binding");
                            actionListenerPromise = adf.mf.api.amx.invokeEl(expr, params, null, paramTypes);
                        return adf.mf.api.amx.VisitResult["COMPLETE"];
                      });

                        return actionListenerPromise;
                  }
                  else
                  {
                    // returning null. This allows any calling function to resolve immediatly.
                    return null;
                  }
                }
                else if (subTag.getNsPrefixedName() === adf.mf.api.amx.AmxTag.NAMESPACE_AMX+":clientListener")
                {
                  // Process the clientListener tag if there is an amxEventType passed in matches the attribute type.
                  if (attrType === amxEventType)
                  {
                        // Due to the fact that we have been called back both by the setAttribute promise
                    // object as well as the serialResolve being used to iterate the children, we have
                    // lost the context of the amxNode. Use a visit to re-obtain the context so that
                    // iterating EL expressions may be correctly evaluated.
                    rootNode.visit(
                      new adf.mf.api.amx.VisitContext({ "amxNodes": [ amxNode ] }),
                      function (visitContext, amxNode)
                      {
                        // Invoke the clientListener.
                        adf.mf.internal._processClientListener(attrType, amxEvent, amxNode, tagInstance);
                        return adf.mf.api.amx.VisitResult["COMPLETE"];
                      });

                    return null;
                  }
                  else
                  {
                    // returning null. This allows any calling function to resolve immediatly.
                    return null;
                  }
                }
                else if (subTag.getNsPrefixedName() === adf.mf.api.amx.AmxTag.NAMESPACE_AMX+":showPopupBehavior")
                {
                  // Process the show popup behavior tag if there is an amxEventType passed in matches the attribute type.
                  if (attrType === amxEventType)
                  {
                        var showPopupPromise = null;

                        // Due to the fact that we have been called back both by the setAttribute promise
                    // object as well as the serialResolve being used to iterate the children, we have
                    // lost the context of the amxNode. Use a visit to re-obtain the context so that
                    // iterating EL expressions may be correctly evaluated.
                    rootNode.visit(
                      new adf.mf.api.amx.VisitContext({ "amxNodes": [ amxNode ] }),
                      function (visitContext, amxNode)
                      {
                            // Invoke the show popup behavior. This returns a promise to the calling function.
                            showPopupPromise = amx.processShowPopupBehavior(amxNode, tagInstance);
                        return adf.mf.api.amx.VisitResult["COMPLETE"];
                      });

                        return showPopupPromise;
                  }
                  else
                  {
                    // returning null. This allows any calling function to resolve immediatly.
                    return null;
                  }
                }
                else if (subTag.getNsPrefixedName() === adf.mf.api.amx.AmxTag.NAMESPACE_AMX+":closePopupBehavior")
                {
                  // Process the close popup behavior tag if there is an amxEventType passed in matches the attribute type.
                  if (attrType === amxEventType)
                  {
                        var closePopupPromise = null;

                        // Due to the fact that we have been called back both by the setAttribute promise
                    // object as well as the serialResolve being used to iterate the children, we have
                    // lost the context of the amxNode. Use a visit to re-obtain the context so that
                    // iterating EL expressions may be correctly evaluated.
                    rootNode.visit(
                      new adf.mf.api.amx.VisitContext({ "amxNodes": [ amxNode ] }),
                      function (visitContext, amxNode)
                      {
                            // Invoke the close popup behavior. This returns a promise to the
                        // calling function.
                            closePopupPromise = amx.processClosePopupBehavior(amxNode, tagInstance);
                        return adf.mf.api.amx.VisitResult["COMPLETE"];
                      });

                        return closePopupPromise;
                  }
                  else
                  {
                    // returning null. This allows any calling function to resolve immediatly.
                    return null;
                  }
                }
                else
                {
                  // returning null if there are no match to any tag (this is the catch all). This allows any calling
                  // function to resolve immediatly.
                  return null;
                }
              });
            }
            else
            {
                  // There are no children so we need to create an empty promise and resolve it. This is because we will be waiting
              // on this before going to the next phase.
                  childrenPromise = new adf.mf.internal.BasePromise(
                    function(resolve, reject)
                    {
                      resolve();
                    });
            }
          });

          // Phase 3) process the listeners. First we will wait for the previous phase to finish before we continue on.

              // Need to create another promise for the listeners. This is required to be able to wait for the this phase to
          // complete.
              var listenerPromiseResolve = null;
              var listenerPromiseReject = null;
              var listenerPromise = new adf.mf.internal.BasePromise(
                function(resolve, reject)
                {
                  listenerPromiseResolve = resolve;
                  listenerPromiseReject = reject;
                });
          // Wait for phase 2 to complete.
              adf.mf.internal.BasePromise.all([childrenPromise])["catch"](function()
          {
                // bug 16371894: childrenPromise was rejected so we abort further processing and reject listenerPromise
            adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "adf.mf.internal.amx.processAmxEventImplSerial", "MSG_PROCESS_AMX_EVENT_CHILDREN_REJECTED");
                listenerPromiseReject();
          })
              .then(function()
          {
            // Start of Phase 3.
            // Process the istener if there is an amxEvent passed in.
            if (amxEvent)
            {
              var params     = [];
              var paramTypes = [];
              params.push(amxEvent);
              paramTypes.push(amxEvent[".type"]);

                  // Due to the fact that we have been called back both by the setAttribute promise
              // object as well as the serialResolve being used to iterate the children, we have
              // lost the context of the amxNode. Use a visit to re-obtain the context so that
              // iterating EL expressions may be correctly evaluated.
              var nestedVisitNodeFound = rootNode.visit(
                new adf.mf.api.amx.VisitContext({ "amxNodes": [ amxNode ] }),
                function (visitContext, amxNode)
                {
                  var el = amxNode.getAttributeExpression(amxEventType + "Listener");
                  adf.mf.api.amx.invokeEl(el, params, null, paramTypes,
                    function()
                    {
                          listenerPromiseResolve();
                    },
                    function()
                    {
                          listenerPromiseResolve();
                    });
                  return adf.mf.api.amx.VisitResult["COMPLETE"];
                });

              if (nestedVisitNodeFound == false)
              {
                    // Resolve the promise if the node could no longer be found
                    listenerPromiseResolve();
              }
            }
            else
            {
                  listenerPromiseResolve();
            }
          });

          // Phase 4) Required Validations process the required validators. First we will wait for the previous phase to
          //          complete.
              adf.mf.internal.BasePromise.all([listenerPromise])["catch"](function()
          {
                // bug 16371894: listenerPromise failed so skip validation.  We are done at this point so reject promise and clean up
            adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "adf.mf.internal.amx.processAmxEventImplSerial", "MSG_PROCESS_AMX_EVENT_LISTENERS_REJECTED");
            perf.stop();
            adf.mf.api.amx.hideLoadingIndicator();
            adf.mf.internal.popNonBlockingCall();
                // reject the root promise
                promiseArgs["reject"]();
                serialPromiseReject();
          })
              .then(
            function()
            {
              // detect if we need to refresh the validation message area
                  if (validationGroup !== undefined && adf.mf.api.amx.isValueTrue(amxNode.getAttribute("required")))
              {
                    // Due to the fact that we have been called back both by the setAttribute promise
                // object as well as the serialResolve being used to iterate the children, we have
                // lost the context of the amxNode. Use a visit to re-obtain the context so that
                // iterating EL expressions may be correctly evaluated.
                rootNode.visit(
                  new adf.mf.api.amx.VisitContext({ "amxNodes": [ amxNode ] }),
                  function (visitContext, amxNode)
                  {
                    // this is a required value, so refresh the messages for this group
                    // let the validation context know that this group has been modified
                    // this method is defined in amx-validation.js
                        amx.requiredControlValueChanged(validationGroup);
                    return adf.mf.api.amx.VisitResult["COMPLETE"];
                  });
              }

              perf.stop();
                  // resolve the root promise
                  promiseArgs["resolve"]();
                  serialPromiseResolve();
              adf.mf.api.amx.hideLoadingIndicator();
              adf.mf.internal.popNonBlockingCall();
            });
        }
        else
        {
          perf.stop();

              // if adf.mf.environment.profile.dtMode, just resolve the promise
              promiseArgs["resolve"]();
              serialPromiseResolve();
          adf.mf.api.amx.hideLoadingIndicator();
        }

        return adf.mf.api.amx.VisitResult["COMPLETE"];
      });

    if (nodeFound == false)
    {
      perf.stop();

      // This may happen if an AMX event is processed after a navigation takes place. If so,
          // then just resolve the promise and hide the loading indicator
          promiseArgs["reject"]();
          serialPromiseReject();
      adf.mf.api.amx.hideLoadingIndicator();
    }
      });
  };

  function _getClosestWithClass(domNode, classNameToMatch)
  {
    // Find the closest ancestor (including self that uses the given class name)
    if (domNode == null ||
      (domNode.classList && domNode.classList.contains(classNameToMatch)))
      return domNode;
    return _getClosestWithClass(domNode.parentNode, classNameToMatch);
  }

  /**
   * Internal function to invoke a clientListener.
   * @param {string} type the event type that occurred
   * @param {Object} amxEvent the AMX event that occurred
   * @param {adf.mf.api.amx.AmxNode} amxNode the AMX node of the component that triggered the event
   * @param {adf.mf.internal.amx.AmxTagInstance} clientListenerTagInstance the AMX tag instance of the clientListener
   */
  adf.mf.internal._processClientListener = function(
    type,
    amxEvent,
    amxNode,
    clientListenerTagInstance)
  {
    var method = clientListenerTagInstance.getAttribute("method");
    if (method != null && method.length > 0)
    {
      try
      {
        // Produce the client event object by copying over the AMX event properties to it.
        var timeStamp = (new Date()).getTime();
        var clientEvent =
        {
          "toString": function()
          {
            return "oracle.adfmf.amx.event.ClientEvent[" + amxNode.getId() + "," + type + "," + timeStamp + "]";
          }
        };
        for (var key in amxEvent)
        {
          clientEvent[key] = amxEvent[key];
        }

        // Add some additional properties if they don't overwrite ones of the same name from the
        // AMX event.
        if (clientEvent["type"] === undefined)
          clientEvent["type"] = type;
        if (clientEvent["amxNode"] === undefined)
          clientEvent["amxNode"] = amxNode;
        if (clientEvent["timeStamp"] === undefined)
          clientEvent["timeStamp"] = timeStamp;

        // Invoke the clientListener's method as a function.
        // If it is not already a function (e.g. a use case for MAX) then we
        // need to sandbox-convert it to a function via new Function:
        if (typeof method != "function")
          method = (new Function("return " + method))();
        method(clientEvent);
      }
      catch (problem)
      {
        var message = "Problem with clientListener type=\"" + type + "\" method=\"" + method + "\":\n\n";
        alert(message + problem);
      }
    }
  };

  /**
   * Internal function to convert bidi types so both bidi and non-bidi equivalents are handled
   * with the same event.
   * @param {string} rawEventType the application developer-specified event type
   * @return {string} the resolved direction-explicit event type
   * @private
   */
  adf.mf.internal._getEventTypeResolvedForBidi = function(rawEventType)
  {
    var resolvedEventType = rawEventType;
    if (resolvedEventType == "swipeStart")
    {
      if (document.documentElement.dir == "rtl")
        resolvedEventType = "swipeRight";
      else
        resolvedEventType = "swipeLeft";
    }
    else if (resolvedEventType == "swipeEnd")
    {
      if (document.documentElement.dir == "rtl")
        resolvedEventType = "swipeLeft";
      else
        resolvedEventType = "swipeRight";
    }
    return resolvedEventType;
  };

  /**
   * Internal function. Calls adf.mf.el.getLocalValue and processes the resulting value, performing
   * any conversions if necessary. Currently converts JS objects with a ".null" property to a null
   * value.
   *
   * @param {string} expr The EL expression
   * @return {Object} the result
   */
  adf.mf.internal.amx.evaluateExpression = function(expr)
  {
    var value = adf.mf.el.getLocalValue(expr);

    return (value != null && value[".null"] === true) ? null : value;
  };

  /**
   * adf.mf.el.getValue wrapper using the promise for asynchronous
   * .then(requestAndResponse)  - response is an array of the values in the
   *                            same order as the el values passed in
   * .catch(requestAndException) - never invoked
   * @param {boolean=} ignoreErrors if true, causes EL errors to be ignored.
   *                   use sparingly for pre-loading data into the client side
   *                   EL cache. Primary goal is to ignore loop based variables
   *                   during pre-fetching of data while not stamping.
   */
  amx.getElValue = function (singleOrArrayOfEls, ignoreErrors)
  {
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
    if (!adf.mf.environment.profile.dtMode)
    {
      var arrayOfEls = (adf.mf.internal.util.is_array(singleOrArrayOfEls))? singleOrArrayOfEls : [singleOrArrayOfEls];

      arrayOfEls = arrayToEL (arrayOfEls);
      var perf = adf.mf.internal.perf.startMonitorCall("AMX get EL value", adf.mf.log.level.FINER, "amx:getElValue");

      // this function will help convert the response from a call to adf.mf.el.getValue
      // to an array of objects that is exactly the length of the request el.
      // This handles full failure, full success, and partial success situations
      var makeResponseArray = function(partialResponses)
      {
        // in a full failure case, the partialResponses will be undefined
        if (partialResponses === undefined)
        {
          partialResponses = [];
        }

        var partialResponseIndex = 0;

        var resultArray = [];

        for (var i = 0; i < arrayOfEls.length; ++i)
        {
          var currentEl = arrayOfEls[i];
          var val = null;
          // we are guaranteed that any successes will be in the order of the request/ However,
          // we are not guaranteed that the length of the response array is the length of the request
          // array, so we keep state to know which partial response index we are on and we will use
          // that value instead of making the slightly more costly call of getLocalValue
          var isException = true;
          if (partialResponseIndex < partialResponses.length && partialResponses[partialResponseIndex].name == currentEl.getExpression())
          {
            var nvp = partialResponses[partialResponseIndex];
            if (nvp !== null && nvp[adf.mf.internal.api.constants.EXCEPTION_FLAG_PROPERTY] === undefined)
            {
              isException = false;
              val = nvp.value;
              // we found a match, so incremement the partial response index for when we loop back around
              ++partialResponseIndex;
            }
          }

          if (isException)
          {
            try
            {
              // we don't have any data for what this el is, so call getLocalValue and use what is cached
              val = adf.mf.el.getLocalValue(currentEl);
            }
            catch(innerEx)
            {
              // if this throws an exception, then do nothing, since val will be undefined
              // and we will set it to null in the check below
              ;
            }
          }

          // make sure we never return an "undefined" value - make sure it is just a json null struct
          if (val === undefined)
          {
            val = {".null" : true};
          }
          resultArray.push({name: currentEl.getExpression(), expression: currentEl, value: val});
        }

        return resultArray;
      };

      var successFunc = function(request,response)
      {
        var resultArray;
        try
        {
          resultArray = makeResponseArray(response);
        }
        finally
        {
          perf.stop();
        }

            resolve([request,resultArray]);
      };

      var failureFunc = function(request,exception)
      {
        var resultArray;
        try
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "getElValue", "MSG_GETVALUE_FAILED", request, exception);
          resultArray = makeResponseArray();
        }
        finally
        {
          perf.stop();
        }
            resolve([request,resultArray]);
      };

      try
      {
        adf.mf.el.getValue(arrayOfEls, successFunc, failureFunc, ignoreErrors);
      }
      catch (ex)
      {
        adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "getElValue", "MSG_GETVALUE_EXCEPTION", arrayOfEls, ex);
            // call the failure function to handle resolving the promise object
        failureFunc(arrayOfEls, ex);
      }
    }
    else
    {
      // if adf.mf.environment.profile.dtMode then, return the result
      var response = [{value:singleOrArrayOfEls}];
          resolve([singleOrArrayOfEls,response]);
    }
      });
  };

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
   * adf.mf.el.setValue wrapper using the promise for asynchronous
   */
  amx.setElValue = function(nameValues)
  {
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
    if (!adf.mf.environment.profile.dtMode)
    {
      var perf = adf.mf.internal.perf.startMonitorCall("AMX set EL value", adf.mf.log.level.FINER, "amx:setElValue");
      try
      {
        adf.mf.el.setValue(nameValues,
          function(request, response)
          {
            perf.stop();
                resolve([request,response]);
          },
          function(request, exception)
          {
            perf.stop();
            adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "setElValue",
              "MSG_SETVALUE_FAILED", nameValues, exception);
                reject([request,exception]);
          });
      }
      catch (ex)
      {
        perf.stop();

        adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "setElValue",
          "MSG_SETVALUE_EXCEPTION", nameValues.name, ex);
        // TODO: why is this resolve and not reject?
            resolve();
      }
    }
    else
    {
      // if adf.mf.environment.profile.dtMode, just resolve
          resolve();
    }
      });
  };

  amx.loadBundle = function(basename, variable)
  {
    if (!adf.mf.environment.profile.mockData)
    {
      return new adf.mf.internal.BasePromise(function(resolve, reject)
        {
      try
      {
        adf.mf.el.addVariable(variable, {});  /* kilgore: add a placeholder for the resources to be loaded into */
        adf.mf.api.invokeMethod('oracle.adfmf.framework.api.Model', 'loadBundle',basename,variable,function()
        {
              resolve();
            },
            function(req,ex)
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "loadBundle", "MSG_LOADBUNDLE_FAILED", basename, variable, ex);
              resolve();
        });
      }
      catch (ex)
      {
        adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "loadBundle", "MSG_LOADBUNDLE_EXCEPTION", basename, variable, ex);
      }
        });
    }
    else
    {
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.WARNING, "loadBundle", "MSG_LOADBUNDLE_SKIPPED", basename, variable);
      return;
    }
  };

  /**
   * @deprecated
   */
  amx.invokeEl = function(expression, params, returnType, types)
  {
    if (expression && expression.getExpression)
      expression = expression.getExpression ();
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "amx.invokeEl", "MSG_DEPRECATED", "amx.invokeEl", "adf.mf.api.amx.invokeEl");
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
    try
    {
      if (expression && !adf.mf.environment.profile.dtMode)
      {
        if (!adf.mf.environment.profile.mockData)
        {
          //TODO: needs to inject correct params, and handle return type
          adf.mf.el.invoke(expression,params,"void",types,function(req,res)
          {
                resolve(res);
          },function(req,exp)
          {
                reject(exp);
          });
        }
        else
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.INFO, "invokeEl", "MSG_AMX_DO_NOT_CALL_ADFMF_EL_INVOKE", expression);
              resolve();
        }
      }
      else
      {
            resolve();
      }
    }
    catch (ex)
    {
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "invokeEl", "MSG_INVOKEEL_EXCEPTION", expression, ex);
          resolve();
    }
      });
  };

  /**
   * Utility similar to adf.mf.el.invoke() for invoking an EL method but will refrain execution in environments such as design time previews.
   * @param {string} expression the EL method to invoke
   * @param {Array.<string>} params an array of parameters to send to the method
   * @param {string} returnType null or the return type for the method
   * @param {Array.<string>} paramTypes an array of types for each parameter in the params array
   * @param {function} successCallback optional function to call when the method is invoked
   * @param {function} failureCallback optional function to call if something failed while attempting to invoke the method
   */
  adf.mf.api.amx.invokeEl = function(expression, params, returnType, paramTypes, successCallback, failureCallback)
  {
    try
    {
      if (expression && expression.getExpression)
        expression = expression.getExpression ();
      if (expression && !adf.mf.environment.profile.dtMode)
      {
        if (!adf.mf.environment.profile.mockData)
        {
          //TODO: needs to inject correct params, and handle return type
          if (returnType == null)
            returnType = "void";
          adf.mf.el.invoke(expression, params, returnType, paramTypes, successCallback, failureCallback);
        }
        else
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.INFO, "invokeEl", "MSG_AMX_DO_NOT_CALL_ADFMF_EL_INVOKE", expression);
          if (successCallback)
            successCallback();
        }
      }
      else
      {
        if (successCallback)
          successCallback();
      }
    }
    catch (ex)
    {
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "invokeEl", "MSG_INVOKEEL_EXCEPTION", expression, ex);
      if (failureCallback)
        failureCallback();
    }
  };

  /**
   * Take the varName and varValue and store it for this domNode.
   */
  amx.storeVariable = function(domNode, varName, varValue) // TODO is this still used?
  {
    var amxVar = adf.mf.internal.amx._getNonPrimitiveElementData(domNode, "amxVar");
    domNode.classList.add("amxVar");
    if (!amxVar)
    {
      amxVar = {};
      adf.mf.internal.amx._setNonPrimitiveElementData(domNode, "amxVar", amxVar);
    }
    amxVar.name = varName;
    amxVar.value = varValue;
  };

  //FIXME: remove this (for backward compability with the dvt team)
  amx.storeVarNameValue = amx.storeVariable; // TODO is this still used?

  /**
   * Restore iterator stamp variables for use during listener invocation.
   * May be used by component authors to reset the EL context during a callback.
   * @return a non-null (but possibly empty) array of amxVar data objects that were restored
   * @see cleanVariables
   * @deprecated use adf.mf.internal.amx.restoreContext instead
   */
  amx.restoreVariables = function(domNodes) // TODO is this still used?
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "restoreVariables", "MSG_DEPRECATED", "amx.restoreVariables",
      "adf.mf.internal.amx.restoreContext (now non-jQuery parameter)");

    if (domNodes.length == 1)
    {
      return adf.mf.internal.amx.restoreContext(domNodes);
    }
    else
    {
      var results = [];
      for (var i = 0, size = domNodes.length; i < size; ++i)
      {
        results = results.concat(adf.mf.internal.amx.restoreContext(domNodes[i]));
      }
      return results;
    }
  };

  /**
   * Use to restore rendering context of a node post-rendering.
   * May be used by component authors to reset the EL context during a callback.
   * @param {DOMNode} domNode the HTML DOM node to restore the context of.
   * @return a non-null (but possibly empty) array of amxVar data objects that were restored
   * @see cleanVariables
   */
  adf.mf.internal.amx.restoreContext = function(domNode) // TODO is this still used?
  {
    // TODO: consider allowing the type handlers for the DOM nodes
    // to have hooks for restoring the context instead of hard-coding
    // this to only support AMX variables that were introduced during
    // rendering.
    var amxVars = getAmxVars(domNode);
    for (var i = 0, size = amxVars.length; i < size; ++i)
    {
      var amxVar = amxVars[i];
      adf.mf.el.addVariable(amxVar.name, amxVar.value);
    }
    return amxVars;
  };

  /**
   * @deprecated use adf.mf.internal.amx.tearDownContext instead
   */
  amx.cleanVariables = function(varsToClean) // TODO is this still used?
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "cleanVariables", "MSG_DEPRECATED", "amx.cleanVariables",
      "adf.mf.internal.amx.tearDownContext");

    adf.mf.internal.amx.tearDownContext(varsToClean);
  };

  /**
   * Tear down the context setup by adf.mf.internal.amx.restoreContext.
   * @param {Object} contextResult the value returned from adf.mf.internal.amx.restoreContext
   * @see adf.mf.internal.amx.restoreContext
   */
  adf.mf.internal.amx.tearDownContext = function(contextResult) // TODO is this still used?
  {
    for (var i = 0, size = contextResult.length; i < size; ++i)
    {
      adf.mf.el.removeVariable(contextResult[i].name);
    }
  };


  /**
   * @deprecated
   */
  amx.isValueFalse = function(value)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "isValueFalse", "MSG_DEPRECATED", "amx.isValueFalse", "adf.mf.api.amx.isValueFalse");
    return adf.mf.api.amx.isValueFalse.apply(this, arguments);
  };

  /**
   * Returns true if the value is boolean false or string "false".
   * If undefined, returns false.
   */
  adf.mf.api.amx.isValueFalse = function(value)
  {
    if (typeof value !== "undefined")
    {
      if (value === false || value === "false" || value === 0 || value === "0")
      {
        return true;
      }
      else
      {
        return false;
      }
    }
    else
    {
      return false;
    }
  };

  /**
   * @deprecated
   */
  amx.isValueTrue = function(value)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "isValueTrue", "MSG_DEPRECATED", "amx.isValueTrue", "adf.mf.api.amx.isValueTrue");
    return adf.mf.api.amx.isValueTrue.apply(this, arguments);
  };

  /**
   * Returns true if the value is boolean true or string "true".
   * If undefined, returns false.
   */
  adf.mf.api.amx.isValueTrue = function(value)
  {
    if (typeof value !== "undefined")
    {
      if (value === true || value === "true" || value === 1 || value === "1")
      {
        return true;
      }
      else
      {
        return false;
      }
    }
    else
    {
      return false;
    }
  };

  /**
   * Return the list of var object {name:..,value:..} starting from this domNode up to the root document.
   */
  function getAmxVars(domNode) // TODO is this still used?
  {
    var amxVars = [];
    _getAmxVars(amxVars, domNode);
    return amxVars;
    }

  function _getAmxVars(amxVars, node)
    {
    if (node != null)
    {
      if (node.classList.contains("amxVar"))
      {
        amxVars.push(adf.mf.internal.amx._getNonPrimitiveElementData(node, "amxVar"));
  }
      _getAmxVars(amxVars, node.parentNode);
    }
  }

  // ------ API for TypeHandlers ------ //
  /**
   * Function called for each time a page has been loaded. Walks the entire tag tree and
   * performs any necessary initialization.
   * @param {adf.mf.api.amx.AmxTag} rootTag the root AMX tag of the page
   * @return {Object} Promise object that is resolved once the processing has been
   *         completed.
   * @private
   */
  adf.mf.internal.amx._preProcessTagTree = function(rootTag)
  {
    var fileArray = [];

    var perf = adf.mf.internal.perf.startMonitorCall("Process tag tree", adf.mf.log.level.FINER, "adf.mf.internal.amx._preProcessTagTree");
    findResourcesForTag(rootTag, fileArray);

    // Create a promise to load all the resources serially.
    var loadResourcePromise = loadFilesSequentialPromise(fileArray);

    // Hook to load additional files for the page when in automation mode. This function
    // will only exist if amx-automation.js has been loaded
    if (adf.mf.internal.amx.getAutomationResourcesForHierarchy != null)
    {
      // Save off the base promise
      var basePromise = loadResourcePromise;

      // Setup a new promise to return
      loadResourcePromise = new adf.mf.internal.BasePromise(
        function (resolve, reject)
        {
          // Wait for the base files to load
          basePromise.then(
            function()
            {
              // Now that the type handlers have loaded, load any needed automation files
              var automationFiles = adf.mf.internal.amx.getAutomationResourcesForHierarchy(rootTag);
              loadFilesSequentialPromise(automationFiles).then(
                function()
                {
                  // Resolve the promise for performance and the code waiting on the processing
                  resolve();
                });
            });

        });
    }

    return loadResourcePromise.then(
      function()
      {
        perf.stop();
      });
  };

  function processCssLinks(amxNode)
  {
    cssNodes = [];

    // We build the list of cssNodes
    adf.mf.internal.amx._each(amxNode.nodes, function(idx, node)
    {
      if (node.tagName === "amx:CSSInclude") // TODO is this still valid?
      {
        cssNodes.push(node);
      }
    });

    // We add them to the <head /> document
    // TODO: needs to check if the css was already added
    // TODO: probably needs to try to return a promise that will resolve when the css is loaded.
    adf.mf.internal.amx._each(cssNodes, function(idx, cssNode)
    {
      amx.includeCss(cssNode.file);
    });
  }

  amx.getNodeTypeHandler = getNodeTypeHandler;
  function getNodeTypeHandler(amxNode)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle",
      adf.mf.log.level.SEVERE, "getNodeTypeHandler", "MSG_DEPRECATED", "amx.getNodeTypeHandler",
      "Use amxTag.getTypeHandler or amxNode.getTypeHandler instead");

    return amxNode.getTypeHandler();
  }

  // ------ TypeHandler ------ //

  /**
   * Abstraction for TypeHandler implementations.
   * To extend TypeHandler, use:
   * <pre><code>(function()
   *   {
   *     // TypeHandler for custom "x" tags:
   *     var x = adf.mf.api.amx.TypeHandler.register("http://xmlns.example.com/custom", "x");
   *
   *     x.prototype.render = function(amxNode)
   *     {
   *       var rootElement = document.createElement("div");
   *       rootElement.appendChild(document.createTextNode("Hello World"));
   *       return rootElement;
   *     };
   *
   *     // TypeHandler for custom "y" tags:
   *     var y = adf.mf.api.amx.TypeHandler.register("http://xmlns.example.com/custom", "y");
   *
   *     y.prototype.render = function(amxNode)
   *     {
   *       var rootElement = document.createElement("div");
   *       rootElement.appendChild(document.createTextNode("Goodbye World"));
   *       return rootElement;
   *     };
   *
   *   })();</code></pre>
   * @constructor adf.mf.api.amx.TypeHandler
   * @augments adf.mf.api.AdfObject
   */
  function TypeHandler()
  {
    this.Init();
  }

  // make adf.mf.api.amx.TypeHandler a subclass of adf.mf.api.AdfObject
  adf.mf.api.amx.TypeHandler = TypeHandler;
  adf.mf.api.AdfObject.createSubclass(adf.mf.api.amx.TypeHandler, adf.mf.api.AdfObject, "adf.mf.api.amx.TypeHandler");

  /**
   * Initializes the TypeHandler class
   * @protected
   */
  adf.mf.api.amx.TypeHandler.InitClass = function()
  {
    TypeHandler._classDictionary = {};
    TypeHandler._instanceDictionary = {};
  };

  /**
   * Register a TypeHandler class with a tag namespace and name.
   * @param {string} theNamespace the xmlns for the tag
   * @param {string} tagName the name of the tag (no namespace)
   * @param {adf.mf.api.amx.TypeHandler=} precreatedClass optional pre-created class to register
   * @return {function} the registered adf.mf.api.amx.TypeHandler subclass so that prototype functions can be added
   */
  adf.mf.api.amx.TypeHandler.register = function(theNamespace, tagName, precreatedClass)
  {
    // make sure that our class is initialized, since we are using a Factory Method
    adf.mf.api.AdfObject.ensureClassInitialization(TypeHandler);
    var registeredClass = precreatedClass;

    if (theNamespace != null && theNamespace.indexOf(":") != -1 && tagName != null)
    {
      if (registeredClass == null)
      {
        // Create the new class and make it inherit from adf.mf.api.amx.TypeHandler:
        registeredClass = function RegisteredTypeHandler()
        {
          this.Init();
        };
        adf.mf.api.AdfObject.createSubclass(registeredClass, adf.mf.api.amx.TypeHandler,
          "TypeHandler[" + theNamespace + ":" + tagName + "]");
      }

      // Make the association so we can find the class:
      var id = theNamespace + ":" + tagName;
      this._classDictionary[id] = registeredClass;
    }
    else // invalid registration, do not register the TypeHandler class
    {
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
        "TypeHandler.register", "MSG_ERROR_IN_SCRIPT", "adf.mf.api.amx.TypeHandler.register",
        "Invalid TypeHandler registration: " + theNamespace + ", tagName = " + tagName);
    }

    return registeredClass;
  };

  /**
   * Renders the initial set of DOM for this component.
   * @param {adf.mf.api.amx.AmxNode} amxNode an object that describes the instance of the component to be rendered
   * @param {string} id the id of this component
   */
  adf.mf.api.amx.TypeHandler.prototype.render = function(amxNode, id)
  {
    if (this.create)
    {
      adf.mf.log.logInfoResource("AMXInfoBundle",
        adf.mf.log.level.SEVERE, "render", "MSG_DEPRECATED", "typeHandler.render",
        "Use typeHandler.prototype.render instead for " + amxNode.getTag().getNsPrefixedName());
      return this.create(amxNode, id);
    }
    else
    {
      var tag = amxNode.getTag();
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.WARNING, "render",
        "MSG_NO_RENDERER", tag.getNsPrefixedName());

      var rootElement = document.createElement("div");
      rootElement.appendChild(document.createTextNode(
        "Missing prototype.render function in the TypeHandler for the " + tag.getName() +
        " tag in the " + tag.getNamespace() + " namespace; id = " + id));

      return rootElement;
    }
  };

  /**
   * Function that checks to see if the attributes that have changed may be handled
   * by the refresh function. May be overridden to make custom changes to the children
   * due to an attribute change. If the sub-class only needs to react to individual
   * attribute changes, it may override only the attributeChangeResult function
   * instead.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode AMX node that has changed
   * @param {adf.mf.api.amx.AmxAttributeChange} attributeChanges the changed attributes
   * @return {number} one of the adf.mf.api.amx.AmxNodeChangeResult constants.
   */
  adf.mf.api.amx.TypeHandler.prototype.updateChildren = function(
    amxNode,
    attributeChanges)
  {
    var changedAttributes = attributeChanges.getChangedAttributeNames();
    var result = adf.mf.api.amx.AmxNodeChangeResult["NONE"];

    for (var i = 0, num = changedAttributes.length; i < num; ++i)
    {
      // The AmxNodeChangeResult is order by the least amount of changes as the lowest
      // number, so using the maximum return value will provide the desired behavior
      result = Math.max(result,
        this.attributeChangeResult(amxNode, changedAttributes[i], attributeChanges));
    }

    return result;
  };

  /**
   * Checks if the type handler can handle updating the DOM in response to a changed
   * attribute. Called from updateChildren. Currently the base implementation supports
   * styleClass and inlineStyle changes to be handled by the refresh function.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode AMX node that has changed
   * @param {string} attributeName the name of the attribute to check
   * @param {adf.mf.api.amx.AmxAttributeChange} attributeChanges the changed attributes
   * @return {number} one of the adf.mf.api.amx.AmxNodeChangeResult constants.
   */
  adf.mf.api.amx.TypeHandler.prototype.attributeChangeResult = function(
    amxNode,
    attributeName,
    attributeChanges)
  {
    return attributeName == "styleClass" || attributeName == "inlineStyle" ?
      adf.mf.api.amx.AmxNodeChangeResult["REFRESH"] :
      adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];
  };

  /**
   * Called to refresh the HTML of a node. This method is called after the updateChildren
   * method and should be implemented by type handlers that wish to update their DOM in
   * response to a change.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode AMX node that has changed
   * @param {adf.mf.api.amx.AmxAttributeChange} attributeChanges the changed attributes
   * @param {(adf.mf.api.amx.AmxDescendentChanges|null)} descendentChanges the changes for any
   *        descendent nodes that need to be refreshed.
   */
  adf.mf.api.amx.TypeHandler.prototype.refresh = function(
    amxNode,
    attributeChanges,
    descendentChanges)
  {
    var styleClassChanged = attributeChanges.hasChanged("styleClass");
    var inlineStyleChanged = attributeChanges.hasChanged("inlineStyle");

    if (styleClassChanged || inlineStyleChanged)
    {
      var element = document.getElementById(amxNode.getId());
      if (element != null)
      {
        if (styleClassChanged)
        {
          this._refreshStyleClass(amxNode, attributeChanges, element);
        }

        if (inlineStyleChanged)
        {
          this._refreshInlineStyle(amxNode, attributeChanges, element);
        }
      }
    }
  };

  /**
   * Allows a DOM element to be associated to the AMX node. Necessary for
   * AmxNode.getAmxNodeForElement to function. Calling this method is only necessary
   * if the element is located outside of its parent element or under a different node's
   * element (element is not a direct descendent of a node rendered for the amxNode's
   * root element or its own children elements).
   * @param {adf.mf.api.amx.AmxNode} amxNode the AMX node
   * @param {object} elem the DOM element
   */
  adf.mf.api.amx.TypeHandler.prototype.associateElementWithAmxNode = function(amxNode, elem)
  {
    adf.mf.internal.amx._setNonPrimitiveElementData(elem, "amxNode", amxNode);
    elem.classList.add("amx-node");
  };

  /**
   * Updates the style class of the root DOM element. This function will use the difference from
   * the old value and the new value to determine what style classes to add and which to remove,
   * so all style classes that were added by other code (like the render function of AmxNode) will
   * not be affected.
   *
   * @param {adf.mf.api.amx.AmxAttributeChange} attributeChanges the changed attributes
   * @param {Element} element the DOM element to which to apply the changes
   * @return {boolean} true if the changes were made
   */
  adf.mf.api.amx.TypeHandler.prototype._refreshStyleClass = function(
    amxNode,
    attributeChanges,
    element)
  {
    var oldValue = attributeChanges.getOldValue("styleClass");
    var newValue = amxNode.getAttribute("styleClass");

    oldValue = oldValue == null || oldValue == "" ? [] : oldValue.split(" ");
    newValue = newValue == null || newValue == "" ? [] : newValue.split(" ");

    var i, num, sc;
    var classList = element.classList;

    for (i = 0, num = oldValue.length; i < num; ++i)
    {
      sc = oldValue[i];
      if (newValue.indexOf(sc) == -1 && sc != "")
      {
        classList.remove(sc);
      }
    }

    for (i = 0, num = newValue.length; i < num; ++i)
    {
      sc = newValue[i];
      if (oldValue.indexOf(sc) == -1 && sc != "")
      {
        classList.add(sc);
      }
    }
  };

  /**
   * Called from the refresh function to update the
   * inline style of the root DOM element. This function will use the difference from the old value
   * and the new value to determine what changes to apply. So all style
   * that was added by other code (like the render function of AmxNode) will not be
   * affected.
   *
   * @param {adf.mf.api.amx.AmxAttributeChange} attributeChanges the changed attributes
   * @param {Element} element the DOM element to which to apply the changes
   * @return {boolean} true if the changes were made
   */
  adf.mf.api.amx.TypeHandler.prototype._refreshInlineStyle = function(
    amxNode,
    attributeChanges,
    element)
  {
    var oldValue = attributeChanges.getOldValue("inlineStyle");
    var newValue = amxNode.getAttribute("inlineStyle");
    var style;

    if (adf.mf.environment.profile.dtMode)
    {
      // if adf.mf.environment.profile.dtMode, remove el
      newValue = newValue.replace(/#\{(.*?)\}/ig, ' ');
    }

    var newStyle = null;
    if (oldValue != null && oldValue != "")
    {
      if (style == oldValue)
      {
        newStyle = newValue;
      }
      else
      {
        style = element.getAttribute("style") || "";
        index = style.indexOf(oldValue);
        if (index >= 0)
        {
          var prefix;
          if (index == 0)
          {
            prefix = ""
          }
          else
          {
            prefix = style.substr(0, index);
          }

          var suffix;
          if (index == oldValue.length - 1)
          {
            suffix = "";
          }
          else
          {
            suffix = style.substr(index + oldValue.length);
          }

          newStyle = prefix + newValue + suffix;
        }
      }
    }
    else if (newValue != null && newValue != "")
    {
      style = element.getAttribute("style") || "";
      if (style.length > 0)
      {
        if (style.charAt(style.length - 1) === ";")
        {
          newStyle = style + newValue;
        }
        else
        {
          newStyle = style + ";" + newValue;
        }
      }
      else
      {
        newStyle = newValue;
      }
    }

    if (newStyle != null)
    {
      // Use setAttribute and not style.cssText as Safari will change the style attribute
      // and 'sanitize' the value. While not a bad thing, causes the ability to compare
      // the new value and the old value to be broken. If the style is set via the attribute,
      // the formatting is kept and the value can be used for comparisson
      element.setAttribute("style", newStyle);
    }
  };

  /**
   * DO NOT USE; this method is experimental and will be removed without notice.
   * @param {adf.mf.api.amx.AmxNode} amxNode an object that describes the instance of the component
   * @param {string} amxNodeId the id of this component
   * @param {string} eventType the event type
   * @param {HTMLElement} rootElement the root element of the component
   * @param {boolean} useDocument in some cases, the event node is the document
   */
  adf.mf.api.amx.TypeHandler.prototype.__experimentalCLAssociation = function(
    amxNode,
    amxNodeId,
    eventType,
    rootElement,
    useDocument)
  {
    // DO NOT USE; this method is experimental and will be removed without notice.
    // This is a temporary experiment for TypeHandler-speicfic clientListener implementation.
    // The idea is this can be overridden to connect a listener to a DOM element other than the
    // root (the default element bound to the event).
    adf.mf.api.amx.addBubbleEventListener(
      useDocument ? document : rootElement,
      eventType,
      adf.mf.api.amx.TypeHandler._experimentalCLHandler,
      {
        "amxNode": amxNode,
        "amxNodeId": amxNodeId,
        "eventType": eventType
      });

    if (useDocument)
    {
      // If rootElement is document then the listener could leak so we have to
      // define an __amxRemoveFunctions entry so that it will be cleaned up when
      // the real element is removed:
      if (rootElement.__amxRemoveFunctions == null)
        rootElement.__amxRemoveFunctions = [];
      rootElement.__amxRemoveFunctions.push(
        function()
        {
          adf.mf.api.amx.removeBubbleEventListener(
            document,
            eventType,
            adf.mf.api.amx.TypeHandler._experimentalCLHandler);
        });
    }
  };

  /**
   * DO NOT USE; this method is experimental and will be removed without notice.
   * @param {Object} domEvent the browser's DOM event object
   */
  adf.mf.api.amx.TypeHandler._experimentalCLHandler = function(domEvent)
  {
    var data = domEvent.data;
    var amxNode = data["amxNode"];
    var amxNodeId = data["amxNodeId"];
    var eventType = data["eventType"];
    var event = new adf.mf.api.amx.DomEvent(amxNodeId, eventType, domEvent);
    adf.mf.api.amx.processAmxEvent(amxNode, eventType, undefined, undefined, event, function() {});
  };

  /**
   * Gets the attribute to be used for validation. If a non-null value is returned, the
   * AmxNode's storeModifyableEl method will be called for this attribute, so it is not necessary
   * for the type handler to manually call this method.
   *
   * @return {string|null} the name of the attribute to use for validation. By default null is
   *         returned.
   */
  adf.mf.api.amx.TypeHandler.prototype.getInputValueAttribute = function()
  {
    return null;
  };

  // ------ /TypeHandler ------ //

  // ------ AmxNode enums ------ //
  /**
   * @namespace
   */
  adf.mf.api.amx.AmxNodeStates =
  {
    /** Initial state. The node has been created but not populated */
    "INITIAL": 0,
    /** EL based attributes needed for rendering have not been fully loaded yet */
    "WAITING_ON_EL_EVALUATION": 1,
    /** EL attributes have been loaded, the node has not yet been rendered */
    "ABLE_TO_RENDER": 2,
    /**
     * The EL is not fully loaded but the node has partially rendered itself (reserved for future
     * use)
     */
    "PARTIALLY_RENDERED": 3,
    /** The node has been fully rendered */
    "RENDERED": 4,
    /** The node is not to be rendered */
    "UNRENDERED": 5,

    /**
     * Method that may be used for debugging (should not be used for normal usage) to get
     * the state label for a state value
     *
     * @param {int} state one of the node state values
     * @return {string|null} the label or null if not a valid state
     */
    getLabelForValue: function(state)
    {
      for (var label in adf.mf.api.amx.AmxNodeStates)
      {
        if (adf.mf.api.amx.AmxNodeStates[label] == state)
        {
          return label;
        }
      }

      return null;
    }
  };

  /**
   * @namespace
   */
  adf.mf.api.amx.AmxNodeChangeResult =
  {
    /**
     * Allows a type handler that is rendered to take no action in response to an attribute change
     * on a non-rendered descendent AMX node.
     */
    "NONE": 0,

    /**
     * The type handler is able to handle the change to AMX node and its children AMX nodes and
     * will be able to update DOM in response to a change after a call to the refresh method.
     */
    "REFRESH": 1,

    /**
     * The type handler is able to handle the change to the AMX node and its children AMX nodes,
     * but the HTML should only be recreated, there is no need to modify the node hierarchy. The
     * refresh method will not be called on the type handler.
     */
    "RERENDER": 2,

    /**
     * The type handler cannot handle the change. The HTML as well as the
     * node hierarchy should be recreated. This value may only be returned from the updateChildren
     * method on a type handler and cannot be returned from the getDescendentChangeAction method.
     */
    "REPLACE": 3,

    /**
     * Method that may be used for debugging (should not be used for normal usage) to get
     * the label for a constant value
     *
     * @param {int} result one of the change result values
     * @return {string|null} the label or null if not a valid change result
     */
    getLabelForValue: function(result)
    {
      for (var label in adf.mf.api.amx.AmxNodeChangeResult)
      {
        if (adf.mf.api.amx.AmxNodeChangeResult[label] == result)
        {
          return label;
        }
      }

      return null;
    }
  };

  /**
   * @namespace
   */
  adf.mf.api.amx.AmxNodeCreateChildrenNodesResult =
  {
    /**
     * The type handler could not create the children yet.
     */
    "NONE": 0,

    /**
     * The type handler created the children.
     */
    "HANDLED": 1,

    /**
     * The type handler generated a placeholder to be shown until the real children can be created.
     */
    "DEFERRED": 2,

    /**
     * Method that may be used for debugging (should not be used for normal usage) to get
     * the label for a constant value
     *
     * @param {int} result one of the children node result values
     * @return {string|null} the label or null if not a valid result
     */
    getLabelForValue: function(result)
    {
      for (var label in adf.mf.api.amx.AmxNodeCreateChildrenNodesResult)
      {
        if (adf.mf.api.amx.AmxNodeCreateChildrenNodesResult[label] == result)
        {
          return label;
        }
      }

      return null;
    }
  };

  /**
   * @namespace
   */
  adf.mf.api.amx.AmxNodeNotifications =
  {
    /**
     * Notification type broadcast to a type handler when an AMX node is about to be removed from
     * the node hierarchy.
     */
    "PRE_REMOVAL": 0,
    /**
     * Notification type broadcast to a type handler when an AMX node is going from a rendered to an
     * unrendered state.
     */
    "UNRENDERED": 1
  };
  // ------ /Node enums ------ //

  // ------ Visit ------ //
  /**
   * Constant values for visit results.
   * @namespace
   */
  adf.mf.api.amx.VisitResult =
  {
    /** Continue visiting the children of the current node. */
    "ACCEPT": 0,
    /** Skip the children of the current node but continue visiting. */
    "REJECT": 1,
    /** Stop visiting */
    "COMPLETE": 2
  };

  /**
   * A visit context object to direct tree visitation.
   * <p>
   * Parameter properties:
   * <dl>
   *   <dt>amxNodes</dt>
   *   <dd>An array of AMX nodes to visit</dd>
   * </dl>
   * @param {{amxNodes: Array.<adf.mf.api.amx.AmxNode>, data: Object}} params An object
   *        containing key/value pairs to populate the visit context. If the "data" object
   *        is passed, it may be retrieved in the callback via the "data" field value.
   * @constructor adf.mf.api.amx.VisitContext
   */
  function VisitContext(params)
  {
    this._walk = null;
    this._visit = null;

    if (params != null)
    {
      // Allow custom data to be stored on the context
      this.data = params["data"];

      var nodes = params["amxNodes"];
      if (nodes != null)
      {
        this._visit = nodes;
        this._walk = [];
        for (var i = 0, size = nodes.length; i < size; ++i)
        {
          for (var n = nodes[i]; n != null; n = n.getParent())
          {
            if (this._walk.indexOf(n) >= 0)
            {
              break;
            }

            this._walk.push(n);
          }
        }
      }
    }
    else
    {
      this.data = null;
    }
  }

  adf.mf.api.amx.VisitContext = VisitContext;

  adf.mf.api.amx.VisitContext.prototype =
  {
    /**
     * Get if all nodes should be visited.
     * @return {boolean} true if all nodes should be visited
     */
    isVisitAll: function()
    {
      return this._visit == null;
    },

    /**
     * Get the nodes that should be walked during visitation. This list does not necessarily
     * include the nodes that should be visited (callback invoked).
     * @return {Array.<adf.mf.api.amx.AmxNode>} array of nodes that should be walked.
     */
    getNodesToWalk: function()
    {
      return this._walk;
    },

    /**
     * Get the list of nodes to visit.
     * @return {Array.<adf.mf.api.amx.AmxNode>} array of nodes that should be visited.
     */
    getNodesToVisit: function()
    {
      return this._visit;
    },

    /**
     * Convenience function to determine what child AMX nodes, including facets, if any,
     * should be walked of the given parent AMX node. Allows for type handlers to optimize how to
     * walk the children if not all are being walked.
     *
     * @param {adf.mf.api.amx.AmxNode} parentNode the parent node
     * @return {(Array.<adf.mf.api.amx.AmxNode>|null)} array of the children to walk, may be empty.
     *         returns null if all the children should be visited (isVisitAll is true)
     */
    getChildrenToWalk: function(parentNode)
    {
      if (this._walk == null)
      {
        return null;
      }

      return this._walk.filter(
        function(node, index, array)
        {
          return node.getParent() == parentNode;
        });
    }
  };
  // ------ /Visit ------ //

  // ------ AMX Collection change ------ //
  function AmxCollectionChange(data)
  {
    this._itemized = data["itemized"];
    this._hasMoreKeysChanged = data["hasMoreKeysChanged"] == true;

    if (this._itemized)
    {
      this._created = [];
      this._deleted = [];
      this._updated = [];
      this._dirtied = [];

      var i;
      var size;

      var created = data["created"];
      if (created != null)
      {
        for (i = 0, size = created.length; i < size; ++i)
        {
          var obj = created[i];
          this._created.push(obj["key"]);
          // Note: In a future version we may need to pull more information off of the "obj"
        }
      }

      var updated = data["updated"];
      if (updated != null)
      {
        for (i = 0, size = updated.length; i < size; ++i)
        {
          this._updated.push(updated[i]);
        }
      }

      var deleted = data["deleted"];
      if (deleted != null)
      {
        for (i = 0, size = deleted.length; i < size; ++i)
        {
          this._deleted.push(deleted[i]);
        }
      }

      var dirtied = data["dirtied"];
      if (dirtied != null)
      {
        for (i = 0, size = dirtied.length; i < size; ++i)
        {
          this._dirtied.push(dirtied[i]);

          // It is possible for the embedded side to send both dirtied and updated
          // at the same time. Check for this, and remove the key from the updated
          // if present
          var index = this._updated.indexOf(dirtied[i]);
          if (index >= 0)
          {
            this._updated.splice(index, 1);
          }
        }
      }
    }
  }

  adf.mf.api.amx.AmxCollectionChange = AmxCollectionChange;

  AmxCollectionChange.prototype =
  {
    /**
     * Return true if the flag has changed marking if more rows are available or not
     * has changed state.
     */
    hasMoreKeysChanged: function()
    {
      return this._hasMoreKeysChanged;
    },

    /**
     * Return if the change to the collection may be itemized
     * @return {boolean} true if the change may be itemized
     */
    isItemized: function()
    {
      return this._itemized;
    },

    /**
     * Get an array of the keys that were created.
     * @return {Array.<string>|null} created keys or null if the change cannot be itemized
     */
    getCreatedKeys: function()
    {
      return this._itemized ? this._created : null;
    },

    /**
     * Get an array of the keys that were removed.
     * @return {Array.<string>|null} the array of keys or null if the change cannot be itemized
     */
    getDeletedKeys: function()
    {
      return this._itemized ? this._deleted : null;
    },

    /**
     * Get an array of the keys that were updated.
     * @return {Array.<string>|null} the array of keys or null if the change cannot be itemized
     */
    getUpdatedKeys: function()
    {
      return this._itemized ? this._updated : null;
    },

    /**
     * Get an array of the keys that were dirtied.
     * @return {Array.<string>|null} the array of keys or null if the change cannot be itemized
     */
    getDirtiedKeys: function()
    {
      return this._itemized ? this._dirtied : null;
    }
  };
  // ------ /AMX Collection change ------ //


  // ------ AMX Attribute change ------ //
  /**
   * Object to allow type handlers to determine the changes that have been made during a data change
   * event.
   */
  function AmxAttributeChange()
  {
    this._changedAttributes = {};
    this._oldValues = {};
    this._length = 0;
    this._collectionChanges = {};
    this._custom = {};
  }
  adf.mf.api.amx.AmxAttributeChange = AmxAttributeChange;

  AmxAttributeChange.prototype =
  {
    /**
     * Get a custom value stored by setCustomValue
     * @param {string} key the key
     * @return {(Object|null)} the object or null if not set
     */
    getCustomValue: function(key)
    {
      return this._custom[key];
    },

    /**
     * Set a custom value. This is useful for a type handler to "pass" information between the
     * updateChildren method and the refresh method.
     * @param {string} key the key
     * @param {Object} value the value to store
     */
    setCustomValue: function(key, value)
    {
      return this._custom[key] = value;
    },

    /**
     * Get the names of the attributes that have been affected during the current change.
     * @return {Array.<string>} array of the attribute names
     */
    getChangedAttributeNames: function()
    {
      return Object.keys(this._changedAttributes);
    },

    /**
     * Check if the attribute change is a collection change
     * @param {string} name the attribute name
     * @return {boolean} true if the change is a collection change
     */
    isCollectionChange: function(name)
    {
      return this._collectionChanges[name] != null;
    },

    /**
     * Get the collection model change information for an attribute
     * @param {string} name the attribute name
     * @return {(adf.mf.api.amx.AmxCollectionChange|null)} the change object if available
     */
    getCollectionChange: function(name)
    {
      var change = this._collectionChanges[name];
      return change == null ? null : change;
    },

    /**
     * Get the value of the attribute before the change was made
     * @param {string} name the attribute name
     */
    getOldValue: function(name)
    {
      return this._oldValues[name];
    },

    /**
     * Check if the attribute with the given name has changed.
     * @param {string} name the attribute name
     */
    hasChanged: function(name)
    {
      return this._changedAttributes[name] == true;
    },

    /**
     * Get the number of attribute changes
     */
    getSize: function()
    {
      return this._length;
    },

    /**
     * Mark an attribute as having been changed
     * @param {string} name the attribute name
     * @param {Object} oldValue the attribute's old value
     * @param {(adf.mf.api.amx.AmxCollectionChange|null)} collectionChanges the collection model
     *        change information if applicable
     * @ignore
     */
    __addChangedAttribute: function(name, oldValue, collectionChanges)
    {
      if (this.hasChanged(name) == false)
      {
        ++this._length;
        this._changedAttributes[name] = true;
      }
      this._oldValues[name] = oldValue;

      if (collectionChanges != null)
      {
        this._collectionChanges[name] = collectionChanges;
      }
    }
  };
  // ------ /AMX Attribute change ------ //

  // ------ AMX children changes ------ //
  function AmxDescendentChanges()
  {
    this._amxNodes = [];
    this._amxNodeChanges = {};
    this._previousStates = {};
  }

  adf.mf.api.amx.AmxDescendentChanges = AmxDescendentChanges;

  AmxDescendentChanges.prototype =
  {
    /**
     * Get the un-rendered changed descendent AMX nodes.
     * @return {Array.<adf.mf.api.amx.AmxNode>} array of AMX nodes that have changed
     */
    getAffectedNodes: function()
    {
      return this._amxNodes;
    },

    /**
     * Get the changes for a given AMX node.
     * @param {adf.mf.api.amx.AmxNode} amxNode the descendent AMX node that was changed
     * @return {adf.mf.api.amx.AmxAttributeChange} the changes that were made to the descendent node
     */
    getChanges: function(amxNode)
    {
      var id = amxNode.getId();
      return this._amxNodeChanges[id];
    },

    /**
     * Get the state of the descendent node before the changes were applied.
     * @param {adf.mf.api.amx.AmxNode} amxNode the descendent AMX node that was changed
     * @return {number} one of the adf.mf.api.amx.AmxNodeStates constant values
     */
    getPreviousNodeState: function(amxNode)
    {
      var id = amxNode.getId();
      return this._previousStates[id];
    },

    __addAmxNode: function(
      amxNode,
      previousState,
      attributeChanges)
    {
      var id = amxNode.getId();
      this._amxNodes.push(amxNode);
      this._previousStates[id] = previousState;
      this._amxNodeChanges[id] = attributeChanges;
    }
  };
  // ------ /AMX children changes ------ //

})();
// ------ /amx UI ------ //

// --------- amx UA --------- //
(function()
{
  var _hasTouch = null;

  amx.hasTouch = function()
  {
    if (_hasTouch === null)
    {
      _hasTouch = isEventSupported("touchstart");
      
      if (_hasTouch &&
        adf.mf.environment.profile.mockData &&
        navigator.userAgent.indexOf("Windows") != -1)
      {
        // Mock mode for browsers (e.g. Chrome) on UWP is better when using mouse events:
        _hasTouch = false;
      }
    }
    return _hasTouch;
  };

  var isEventSupported = (function()
  {
    var TAGNAMES =
    {
      'select' : 'input',
      'change' : 'input',
      'submit' : 'form',
      'reset' : 'form',
      'error' : 'img',
      'load' : 'img',
      'abort' : 'img'
    };

    function isEventSupported(eventName)
    {
      var el = document.createElement(TAGNAMES[eventName] || 'div');
      eventName = 'on' + eventName;
      var isSupported = (eventName in el);
      if (!isSupported)
      {
        el.setAttribute(eventName, 'return;');
        isSupported = typeof el[eventName] == 'function';
      }
      el = null;
      return isSupported;
    }
    return isEventSupported;
  })();
})();
// --------- /amx UA --------- //

// --------- Utilities --------- //
(function()
{
  // Private array of chars to use
  var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

  amx.uuid = function(len)
  {
    len = len || 10;
    var chars = CHARS, uuid = [];
    var radix = chars.length;

    for (var i = 0; i < len; i++)
      uuid[i] = chars[0 | Math.random()*radix];

    return uuid.join('');
  };

  amx.arrayRemove = function(a, from, to)
  {
    var rest = a.slice((to || from) + 1 || a.length);
    a.length = from < 0 ? a.length + from : from;
    return a.push.apply(a, rest);
  };

  /**
   * @deprecated use adf.mf.api.amx.TypeHandler.prototype.getInputValueAttribute instead
   */
  amx.registerInputValue = function(amxNode, attrName)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "registerInputValue",
      "MSG_DEPRECATED", "amx.registerInputValue",
      "adf.mf.api.amx.TypeHandler.prototype.getInputValueAttribute");

    // Mirror the code in AmxNode's _setupInputValueValidation without calling the type handler
    if (amxNode._attributeToValidate === undefined)
    {
      amxNode._attributeToValidate = attrName;
      amxNode.storeModifyableEl(attrName);
    }
  };

  /**
   * Rendrer would call this function to change the style of showRequired attribute
   * @param {Object} amxNode This is the amxNode object
   * @param {Object} field This object is returned from createField method and must have a "fieldRoot" property
   * @see See also the definition of amx.createField method inside amx-commonTags.js
   */
  adf.mf.api.amx.applyRequiredMarker = function(amxNode, field)
  {
    if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("showRequired")) || adf.mf.api.amx.isValueTrue(amxNode.getAttribute("required")))
    {
      field.fieldRoot.classList.add("required");
    }
  };

  // safely return the value, handling json null objects,
  // undefined objects, and null objects by returning null
  amx.getObjectValue = function(value)
  {
    if (value == null)
    {
      return null;
    }

    if (typeof value === "undefined")
    {
      return null;
    }

    if (typeof value[".null"] !== "undefined")
    {
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.INFO, "getObjectValue", "MSG_UNHANDLED_NULL");
      if (value[".null"] == true)
      {
        return null;
      }
    }

    return value;
  };

  /**
   * Get the value as a string. Null or undefined objects will
   * be returned as an empty string.
   * @param {Object} value the value
   * @return {string} the value as a string.
   */
  amx.getTextValue = function(value)
  {
    value = amx.getObjectValue(value);
    if (value == null)
    {
      return "";
    }

    // Ensure the value is a string
    return "" + value;
  };

  // Gets the amx_dtfolderpath if it is on the URL
  amx.getDtFolderPath = function()
  {
    var queryString = adf.mf.api.getQueryString();
    var amx_dtfolderpath = adf.mf.api.getQueryStringParamValue(queryString, "amx_dtfolderpath", null);
    return amx_dtfolderpath;
  };

  // Builds a string that is the relative path to
  // the folder containing the amx page we are currently
  // viewing.
  amx.currentPageContainingFolder = function()
  {
    try
    {
      // Check for DT folder path
      var amx_dtfolderpath = amx.getDtFolderPath();
      if(amx_dtfolderpath !== null)
      {
        return amx_dtfolderpath;
      }
      // Get current amx filename
      var amxPage = adf.mf.internal.controller.ViewHistory.peek().amxPage;
      // Break up the filename so we can get the length
      // of just the filename.
      var parts = amxPage.split("/");
      // Add the feature root prefix to the filename
      var amxPageFullPath = adfc.Util.addFeatureRootPrefix(amxPage);
    }
    catch (ex)
    {
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "currentPageContainingFolder", "MSG_CURRENT_PAGE_FOLDER_FAILED", ex);
      return "";
    }
    // Strip off the filename
    return amxPageFullPath.substr(0,
      amxPageFullPath.length - parts[parts.length - 1].length);
  };

  // Determines if the tartget string has a protocol
  amx.hasProtocol = function(url)
  {
    return /^(:?ms-app*|\w+:)/.test(url);
  };

  // Builds the relative path based to the specified
  // resource assuming it is relative to the current
  // amx page.  If there is a protocol on the resource
  // then it is assumed to be an absolute path and
  // left unmodified
  amx.buildRelativePath = function(url)
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "buildRelativePath", "MSG_DEPRECATED", "amx.buildRelativePath", "adf.mf.api.amx.buildRelativePath");
    return adf.mf.api.amx.buildRelativePath.apply(this, arguments);
  };

  /**
   * Builds the relative path based to the specified resource assuming it is relative to the current
   * AMX page. If there is a protocol on the resource then it is assumed to be an absolute path and
   * left unmodified.
   * @param {string} url the location of the specified resource
   * @return {string} the resolved path
   */
  adf.mf.api.amx.buildRelativePath = function(url)
  {
    if(amx.hasProtocol(url))
    {
      return url;
    }

    url = url.replace("\\", "/");
    if(url.charAt(0) == "/")
    {
        // Check for DT folder path
        var amx_dtfolderpath = amx.getDtFolderPath();
        if (amx_dtfolderpath !== null)
        {
            var publicHtmlString = 'public_html/';
            var publicHtmlIndex    = amx_dtfolderpath.indexOf(publicHtmlString);

            return (amx_dtfolderpath.substring(0, publicHtmlIndex + publicHtmlString.length)) + url.substring(1);
        }
        else
        {
            return adfc.Util.addFeatureRootPrefix(url.substring(1));
        }
    }

    return amx.currentPageContainingFolder() + url;
  };

  /**
   * Adds a CSS className to the dom node if it doesn't already exist in the classNames list and
   * returns <code>true</code> if the class name was added.
   * @param {HTMLElement} domElement DOM Element to add style class name to
   * @param {string} className Name of style class to add
   * @return {boolean} <code>true</code> if the style class was added
   * @deprecated Use domElement.classList.add instead.
   */
  adf.mf.internal.amx.addCSSClassName = function(domElement, className) // TODO move into some "domutils" class
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "adf.mf.internal.amx.addCSSClassName", "MSG_DEPRECATED",
      "adf.mf.internal.amx.addCSSClassName",
      "domElement.classList.add");

    // TODO AdfAssert.assertDomElement(domElement);
    var added = false;

    if (className != null)
    {
      var classNames = className.split(" ");
      for (var i = 0, num = classNames.length; i < num; ++i)
      {
        var className = classNames[i];
        if (!domElement.classList.contains(className))
        {
          domElement.classList.add(className);
          added = true;
        }
      }
    }

    return added;
  };

  /**
   * Removes a CSS className to the dom node if it existd in the classNames list and
   * returns <code>true</code> if the class name was removed.
   * @param {HTMLElement} domElement DOM Element to remove style class name from
   * @param {string} className Name of style class to remove
   * @return {boolean} <code>true</code> if the style class was removed
   * @deprecated Use domElement.classList.remove instead.
   */
  adf.mf.internal.amx.removeCSSClassName = function(domElement, className) // TODO move into some "domutils" class
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "adf.mf.internal.amx.removeCSSClassName", "MSG_DEPRECATED",
      "adf.mf.internal.amx.removeCSSClassName",
      "domElement.classList.remove");
    // TODO AdfAssert.assertDomElement(domElement);

    var removed = false;

    if (className != null)
    {
      var classNames = className.split(" ");
      for (var i = 0, num = classNames.length; i < num; ++i)
      {
        var className = classNames[i];
        if (domElement.classList.contains(className))
        {
          domElement.classList.remove(className);
          removed = true;
        }
      }
    }

    return removed;
  };

  /**
   * Convenient function to add or removes a CSS className from the dom node. Will be deprecated
   * once all supported browsers support the classList.toggle function fully (IE 10 and 11
   * do not support the second argument of toggle).
   *
   * @param {boolean} add boolean value if we should do an add of a CSS className
   * @param {HTMLElement} domElement DOM Element to remove style class name from
   * @param {string} className the CSS className which should be added or removed
   * @return {boolean} <code>true</code> if the element's style class list changed
   */
  adf.mf.internal.amx.addOrRemoveCSSClassName = function(
    add,
    domElement,
    className) // TODO move into some "domutils" class
  {
    // For backward compatibility usage, check for spaces in the name
    var classNames = className.split(" ");

    var contains = false;
    var num = classNames.length;
    var classList = domElement.classList;

    for (var i = 0; i < num; ++i)
    {
      if (classList.contains(classNames[i]))
      {
        contains = true;
        break;
      }
    }


    if (add && !contains)
    {
      classList.add.apply(classList, classNames);
      return true;
    }
    else if (!add && contains)
    {
      classList.remove.apply(classList, classNames);
      return true;
    }

    return false;
  };

  /**
   * Check if the dom node contains the className
   * @param {HTMLElement} domElement DOM Element to remove style class name from
   * @param {string} className Name of style class to remove
   * @return {boolean} <code>true</code> if the style class is on the domElement
   * @deprecated Use domElement.classList.contains instead.
   */
  adf.mf.internal.amx.containsCSSClassName = function(domElement, className) // TODO move into some "domutils" class
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "adf.mf.internal.amx.containsCSSClassName", "MSG_DEPRECATED",
      "adf.mf.internal.amx.containsCSSClassName",
      "domElement.classList.contains");
    var classNames = className.split(" ");
    var containsAll = true;

    for (var i = 0, num = classNames.length; i < num; ++i)
    {
      var className = classNames[i];
      if (!domElement.classList.contains(className))
      {
        containsAll = false;
        break;
      }
    }

    return containsAll;
  };

  /**
   * Returns the index at which <code>className</code> appears within <code>currentClassName</code>
   * with either a space or the beginning or end of <code>currentClassName</code> on either side.
   * This function optimizes the runtime speed by not creating objects in most cases and assuming
   * 1) It is OK to only check for spaces as whitespace characters
   * 2) It is rare for the searched className to be a substring of another className, therefore
   *    if we get a hit on indexOf, we have almost certainly found our className
   * 3) It is even rarer for the searched className to be a substring of more than one className,
   *    therefore, repeating the search from the end of the string should almost always either return
   *    our className or the original search hit from indexOf
   * @param {string} currentClassName Space-separated class name string to search
   * @param {string} className String to search for within currentClassName
   * @return {number} index of className in currentClassName, or -1 if it doesn't exist
   * @deprecated Use domElement.classList instead.
   */
  adf.mf.internal.amx.getCSSClassNameIndex = function(currentClassName, className) // TODO move into some "domutils" class
  {
    adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
      "adf.mf.internal.amx.getCSSClassNameIndex", "MSG_DEPRECATED",
      "adf.mf.internal.amx.getCSSClassNameIndex",
      "domElement.classList");
    // if no current class
    if (!currentClassName)
      return -1;
    else
    {
      // if the strings are equivalent, then the start index is the beginning of the string
      if (className === currentClassName)
        return 0;
      else
      {
        var classNameLength = className.length;
        var currentClassNameLength = currentClassName.length;

        // check if our substring exists in the string at all
        var nameIndex = currentClassName.indexOf(className);

        // if our substring exists then our class exists if either:
        // 1) It is at the beginning of the classNames String and has a following space
        // 2) It is at the end of the classNames String and has a leading space
        // 3) It has a space on either side
        if (nameIndex >= 0)
        {
          var hasStart = (nameIndex == 0) || (currentClassName.charAt(nameIndex - 1) == " ");
          var endIndex = nameIndex + classNameLength;
          var hasEnd = (endIndex == currentClassNameLength) || (currentClassName.charAt(endIndex) == " ");

          //one of the three condition above has been met so our string is in the parent string
          if (hasStart && hasEnd)
            return nameIndex;
          else
          {
            // our substring exists in the parent string but didn't meet the above conditions,  Were
            // going to be lazy and retest, searchig for our substring from the back of the classNames
            // string
            var lastNameIndex = currentClassName.lastIndexOf(className);

            // if we got the same index as the search from the beginning then we aren't in here
            if (lastNameIndex != nameIndex)
            {
              // recheck the three match cases
              hasStart = currentClassName.charAt(lastNameIndex - 1);
              endIndex = lastNameIndex + classNameLength;
              hasEnd =  (endIndex == currentClassNameLength) || (currentClassName.charAt(endIndex) == " ");

              if (hasStart && hasEnd)
                return lastNameIndex;
              else
              {
                // this should only happen if the searched for className is a substring of more
                // than one className in the classNames list, so it is OK for this to be slow.  We
                // also know at this point that we definitely didn't get a match at either the very
                // beginning or very end of the classNames string, so we can safely append spaces
                // at either end
                return currentClassName.indexOf(" " + className + " ");
              }
            }
          }
        }

        // no match
        return -1;
      }
    }
  };

  /**
   * Returns the element's right side in Window coordinates.
   * @param {HTMLElement} domElement the DOM Element to look at
   * @return {number} the element's right side position in Window coordinates
   */
  adf.mf.internal.amx.getElementRight = function(domElement) // TODO move into some "agent" class
  {
    var documentElementOffsetWidth = document.documentElement.offsetWidth;
    var domElementOffsetWidth = domElement.offsetWidth;
    var domElementLeft = adf.mf.internal.amx.getElementLeft(domElement);
    var domElementRight = documentElementOffsetWidth - domElementLeft - domElementOffsetWidth;
    return domElementRight;
  };

  /**
   * Returns the element's left side in Window coordinates.
   * @param {HTMLElement} domElement the DOM Element to look at
   * @return {number} the element's left side position in Window coordinates
   */
  adf.mf.internal.amx.getElementLeft = function(domElement) // TODO move into some "agent" class
  {
    if (navigator.userAgent.toLowerCase().indexOf("applewebkit") != -1)
      return adf.mf.internal.amx._webkitGetElementLeft(domElement);
    return adf.mf.internal.amx._baseGetElementLeft(domElement);
  };

  adf.mf.internal.amx._baseGetElementLeft = function(element) // TODO move into some "agent" class
  {
    // TODO AmxRcfAssert.assertDomNode(element);

    var bodyElement = element.ownerDocument.body;
    var currParent  = element.offsetParent;
    var currLeft    = element.offsetLeft;

    while (currParent)
    {
      element = currParent;
      currLeft += element.offsetLeft;

      if (element != bodyElement)
        currLeft -= element.scrollLeft;

      currParent = currParent.offsetParent;
    }

    return currLeft;
  };

  adf.mf.internal.amx._webkitGetElementLeft = function(element) // TODO move into some "agent" class
  {
    // TODO AmxRcfAssert.assertDomElement(element);

    // getBoundingClientRect was added in safari 4, webkit version 533
    // just look for the API versus the version
    if (!element.getBoundingClientRect)
      return this._baseGetElementLeft(element);

    var boundingRect = element.getBoundingClientRect();
    var elemLeft = boundingRect.left;
    var docElement = element.ownerDocument.documentElement;

    // adjust for the document scroll positions and window borders
    elemLeft -= (docElement.clientLeft - adf.mf.internal.amx.getBrowserViewportScrollLeft());
    return elemLeft;
  };

  /**
   * Returns the element's top side in Window coordinates.
   * @param {HTMLElement} domElement the DOM Element to look at
   * @return {number} the element's top side position in Window coordinates
   */
  adf.mf.internal.amx.getElementTop = function(domElement) // TODO move into some "agent" class
  {
    if (navigator.userAgent.toLowerCase().indexOf("applewebkit") != -1)
      return adf.mf.internal.amx._webkitGetElementTop(domElement);
    return adf.mf.internal.amx._baseGetElementTop(domElement);
  };

  adf.mf.internal.amx._baseGetElementTop = function(element) // TODO move into some "agent" class
  {
    // TODO AmxRcfAssert.assertDomNode(element);

    var bodyElement = element.ownerDocument.body;
    var currParent  = element.offsetParent;
    var currTop     = element.offsetTop;

    //In safari/opera position absolute incorrectly account for body offsetTop
    if (adf.mf.internal.amx.getComputedStyle(element).position == "absolute")
    {
      currTop -= bodyElement.offsetTop;
    }

    while (currParent)
    {
      element = currParent;
      currTop += element.offsetTop;

      if (element != bodyElement)
        currTop -= element.scrollTop;

      currParent = currParent.offsetParent;
    }

    return currTop;
  };

  adf.mf.internal.amx._webkitGetElementTop = function(element) // TODO move into some "agent" class
  {
    // TODO AmxRcfAssert.assertDomElement(element);

    // getBoundingClientRect was added in safari 4, webkit version 533
    // just look for the API versus the version
    if (!element.getBoundingClientRect)
      return adf.mf.internal.amx._baseGetElementTop(element);

    var boundingRect = element.getBoundingClientRect();
    var elemTop = boundingRect.top;
    var docElement = element.ownerDocument.documentElement;

    // adjust for the document scroll positions and window borders
    elemTop -= (docElement.clientTop - adf.mf.internal.amx.getBrowserViewportScrollTop());
    return elemTop;
  };

  /**
   * @return {Number} returns the starting position on the canvas of the viewport
   */
  adf.mf.internal.amx.getBrowserViewportScrollLeft = function() // TODO move into some "agent" class
  {
    if (navigator.userAgent.toLowerCase().indexOf("applewebkit") != -1)
      return this._webkitGetBrowserViewportScrollLeft();
    return this._baseGetBrowserViewportScrollLeft();
  };

  adf.mf.internal.amx._baseGetBrowserViewportScrollLeft = function() // TODO move into some "agent" class
  {
    return document.documentElement.scrollLeft;
  };

  adf.mf.internal.amx._webkitGetBrowserViewportScrollLeft = function() // TODO move into some "agent" class
  {
    return document.body.scrollLeft;
  };

  /**
   * @return {Number} returns the top position on the canvas the viewport begins
   */
  adf.mf.internal.amx.getBrowserViewportScrollTop = function() // TODO use adf.mf.internal.amx.getBrowserViewportScrollTop
  {
    if (navigator.userAgent.toLowerCase().indexOf("applewebkit") != -1)
      return this._webkitGetBrowserViewportScrollTop();
    return this._baseGetBrowserViewportScrollTop();
  };

  adf.mf.internal.amx._baseGetBrowserViewportScrollTop = function() // TODO move into some "agent" class
  {
    return document.documentElement.scrollTop;
  };

  adf.mf.internal.amx._webkitGetBrowserViewportScrollTop = function() // TODO move into some "agent" class
  {
    return document.body.scrollTop;
  };

  /**
   * Tries to return the current style, taking into account the inline styles and style sheets.
   * @param {HTMLElement} element the element in question
   * @param {string} pseudoElement the name of the pseudo-element e.g. ":after" or null if not applicable
   * @return {Object} the style computed style object
   */
  adf.mf.internal.amx.getComputedStyle = function(element, pseudoElement) // TODO move into some "agent" class
  {
    return element.ownerDocument.defaultView.getComputedStyle(element, pseudoElement);
  };

  /**
   * Checks to see if the "ancestorNode" is a ancestor of "node" or if they are the same.
   * Called from our test code
   * @export
   * @param {DOMNode} ancestorNode the potential ancestor or possibly same node as the descendant
   * @param {DOMNode} node the potential descendant or same node as the ancestor
   * @return whether the ancestorNode is an ancestor of the node or they are the same nodes
   */
  adf.mf.internal.amx.isAncestorOrSelf = function(ancestorNode, node)
  {
    return (node == ancestorNode) ? true : adf.mf.internal.amx.isAncestor(ancestorNode, node);
  };

  /**
   * Checks to see if the "ancestorNode" is a ancestor of "node".
   * @param {DOMNode} ancestorNode the potential ancestor
   * @param {DOMNode} node the potential descendant
   * @return whether the ancestorNode is an ancestor of the node
   */
  adf.mf.internal.amx.isAncestor = function(ancestorNode, node)
  {
    if (node == null)
      return false;
    var parentNode = node.parentNode;
    while (parentNode)
    {
      if (parentNode == ancestorNode)
        return true;
      parentNode = parentNode.parentNode;
    }
    return false;
  };

  /**
   * Temporary solution for getting non-primitive element data.
   * @param {HTMLElement} domElement the DOM element the data is associated with
   * @param {string} key the data key
   * @return {Object} the non-primitive data
   * @private
   */
  adf.mf.internal.amx._getNonPrimitiveElementData = function(domElement, key)
  {
    if (domElement == null) return undefined;
    if (domElement._amxNonPrimitiveData == null)
      return undefined;
    return domElement._amxNonPrimitiveData[key];
  };

  /**
   * Temporary solution for setting non-primitive element data.
   * @param {HTMLElement} domElement the DOM element the data is associated with
   * @param {string} key the data key
   * @param {Object} nonPrimitiveData the non-primitive data
   * @private
   */
  adf.mf.internal.amx._setNonPrimitiveElementData = function(domElement, key, nonPrimitiveData)
  {
    if (domElement == null) return;
    if (domElement._amxNonPrimitiveData == null)
      domElement._amxNonPrimitiveData = {};
    domElement._amxNonPrimitiveData[key] = nonPrimitiveData;
  };

  /**
   * Adds padding to a number string.  Does nothing if number is longer than paddingLength.
   * @param {number} number to be padded
   * @param {number} paddingLength specifies length to which to pad
   * @return {string} padded number at least paddingLength long
   */
  adf.mf.internal.amx.addPadding = function(number, paddingLength)
  {
    var padded = "" + number;
    for (var i = padded.length; i < paddingLength; ++i)
    {
      padded = "0" + padded;
    }
    return padded;
  };

  /**
   * Extracts time portion from date object and returns it as "HH:mm:ss"
   * @param {Date} dateObject
   * @return {string} returns time as "HH:mm:ss"
   */
  adf.mf.internal.amx.extractTimeFromDateObject = function(dateObject)
  {
    var time = adf.mf.internal.amx.addPadding(dateObject.getHours(), 2) + ":" +
      adf.mf.internal.amx.addPadding(dateObject.getMinutes(), 2) + ":" +
      adf.mf.internal.amx.addPadding(dateObject.getSeconds(), 2) + "." +
      adf.mf.internal.amx.addPadding(dateObject.getMilliseconds(), 3);
    return time;
  };

  /**
   * Extracts date portion from date object and returns it as "yyyy-MM-dd"
   * @param {Date} dateObject
   * @return {string} returns date as "yyyy-MM-dd"
   */
  adf.mf.internal.amx.extractDateFromDateObject = function(dateObject)
  {
    var time = adf.mf.internal.amx.addPadding(dateObject.getFullYear(), 4) + "-" +
      adf.mf.internal.amx.addPadding(dateObject.getMonth() + 1, 2) + "-" +
      adf.mf.internal.amx.addPadding(dateObject.getDate(), 2);
    return time;
  };

  /**
   * Updates time portion of date object with given time.
   * @param {Date} dateObject is the Date to be updated
   * @param {string} time is a string with this format: "hh:mm"
   */
  adf.mf.internal.amx.updateTime = function(dateObject, time)
  {
    if (time != null && typeof time !== "undefined" && time.length > 4)
    {
      var h = time.substring(0,2);
      var m = time.substring(3,5);
      dateObject.setHours(h);
      dateObject.setMinutes(m);
    }
  };

  /**
   * Updates date portion of date object with given date.
   * @param {Date} dateObject is the Date to be updated
   * @param {string} date is a string with this format: "yyyy-MM-dd".  The year must be full length (e.g. 1999, not 99)
   */
  adf.mf.internal.amx.updateDate = function(dateObject, date)
  {
    if (date != null && typeof date !== "undefined" && date.length > 9)
    {
      var i = date.indexOf("-");
      if (i > 3)
      {
        var year = date.substring(0, i);
        var j = date.indexOf("-", i+1);
        if (j > -1)
        {
          var month = date.substring(i+1, j) - 1;
          var day = date.substring(j+1, date.length);
          dateObject.setFullYear(year);
          dateObject.setMonth(month);
          dateObject.setDate(day);
        }
      }
    }
  };

  /**
   * Check if an object implements a function
   *
   * @param {(Object|null)} obj the object to check.
   * @param {string} name the name of the function to look for
   * @return {boolean} true if the object is non-null and implements a function by the given name
   */
  adf.mf.internal.amx.implementsFunction = function(
    obj,
    name)
  {
    return obj != null && typeof obj[name] === "function";
  };

  adf.mf.internal.NONBLOCKING_CALL_COUNTER = 0;
  adf.mf.internal.pushNonBlockingCall = function()
  {
    ++adf.mf.internal.NONBLOCKING_CALL_COUNTER;
  };

  adf.mf.internal.popNonBlockingCall = function()
  {
    --adf.mf.internal.NONBLOCKING_CALL_COUNTER;
  };

  adf.mf.internal.getUnresolvedCallDepth = function()
  {
    return adf.mf.internal.NONBLOCKING_CALL_COUNTER;
  };
}) ();
/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* --------------------- amx-event.js ------------------- */
/* ------------------------------------------------------ */

(function()
{
  var _currentFocusDomNode = null;
  var _focusBlurEventData = {}; // allows these focus/blur events to be unique from other focus/blur events

  /**
   * Internal method to bind to the focus method and be notified when another control gains focus
   */
  adf.mf.internal.amx.registerFocus = function(domNode, callback)
  {
    adf.mf.api.amx.addBubbleEventListener(
      domNode,
      "focus",
      function(event)
      {
        // register this node in order to receive events when another control is tapped
        _currentFocusDomNode = domNode;
        if (callback)
        {
          callback(event);
        }
      },
      _focusBlurEventData);
  };

  /**
   * Internal method to bind to the blur method and be notified when another control gains focus
   */
  adf.mf.internal.amx.registerBlur = function(domNode, callback)
  {
    adf.mf.api.amx.addBubbleEventListener(
      domNode,
      "blur",
      function(event)
      {
        // unregister this node - no more need to receive events when another control is tapped
        if (_currentFocusDomNode == domNode)
        {
          _currentFocusDomNode = null;
        }
        if (callback)
        {
          callback(event);
        }
      },
      _focusBlurEventData);
  };

  // this method calls blur on the currentFocus node
  // in order to give it a chance to saved its internal changes
  // first we will blur the node in order to trigger value change events etc
  // then we restore focus back so that we don't accidently cause the user to get the
  // wrong focus - due to keyboard hiding/showing in other words, so that the touchstart &
  // touchend events occur on the same element
  function blurCurrentNode()
  {
    var oldCurrentNode = _currentFocusDomNode;
    var oldActiveElement = document.activeElement;
 
    if (_currentFocusDomNode != null)
      adf.mf.api.amx.triggerBubbleEventListener(_currentFocusDomNode, "blur");

    if (document.activeElement != null && document.activeElement.blur != null)
      document.activeElement.blur();

    if (oldCurrentNode != null)
    {
      if (oldCurrentNode.tagName == "SELECT" || oldCurrentNode.tagName == "INPUT")
        adf.mf.api.amx.triggerBubbleEventListener(oldCurrentNode, "focus");
    }
 
    if (oldActiveElement != null && oldActiveElement.focus != null)
    {
      if (oldActiveElement.tagName == "SELECT" || oldActiveElement.tagName == "INPUT")
        oldActiveElement.focus();
    }

  }

  function triggerEvent(eventTarget, eventName, triggerExtra)
  {
    if (eventName == "tap")
    {
      // "tap" is not a real event so we need to trigger the real events for it
      var tapEvents = _getTapEvents();
      triggerEvent(eventTarget, tapEvents.start, triggerExtra);
      triggerEvent(eventTarget, tapEvents.end, triggerExtra);
    }
    else if (eventName == "taphold")
    {
      // "taphold" is not a real event so we need to trigger the real events for
      // it (the 2nd event needs to take place after the underlying 1st event's
      // timeout occurs hence the addition of 1 to the threshold).
      var tapHoldEvents = _getTapEvents();
      triggerEvent(eventTarget, tapHoldEvents.start, triggerExtra);
      setTimeout(
        function()
        {
          triggerEvent(eventTarget, tapHoldEvents.end, triggerExtra);
        },
        1+holdThreshold);
    }
    else
    {
      adf.mf.internal.triggerEvent(
        eventTarget,
        "HTMLEvents",
        eventName,
        true,
        true,
        triggerExtra);
    }
  }

  function _isSimpleObject(o)
  {
    return Object.prototype.toString.call(o) == "[object Object]";
  }

  /**
   * Utility to merge an arbitrary list of simple objects onto the given base object.
   * If any of the given objects is determined to not be a simple object, the merging
   * will cease and false is returned.
   * @param {Object} baseObject the simple object that the remaining objects will be added to (in order)
   * @return {Boolean} whether the full set of objects was merged
   */
  function _mergeSimpleObjects(baseObject)
  {
    if (!_isSimpleObject(baseObject))
      return false;

    // Loop through the rest of the arguments to merge their properties into the base object
    var args = Array.prototype.slice.call(arguments);
    for (var i=1, count=args.length; i<count; ++i)
    {
      var objectToMerge = args[i];

      if (!_isSimpleObject(objectToMerge))
        return false;

      for (var key in objectToMerge)
        baseObject[key] = objectToMerge[key];
    }

    return true;
  }

  var tapPendingIds = {};

  function cancelPendingTap()
  {
    tapPendingIds = {};
  }

  var _tapEvents = null;
  var _getTapEvents = function()
  {
    if (_tapEvents == null)
      _tapEvents = amx.hasTouch() ? { start: "touchstart", end: "touchend", cancel: "touchcancel" } : { start: "mousedown", end: "mouseup", cancel: "" };
    return _tapEvents;
  };

  var _addSpecialTapBubbleEventListener = function(domNode, eventType, listener, eventData)
  {
    var tapEvents = _getTapEvents();
    var tapId = null;
    var originalPosition = null;
    var startListener = function(event)
    {
      // if there is a node that registered its focus, then
      // the first thing to do is blur that focus here
      var newFocusedTagName = domNode.tagName;
      if (newFocusedTagName != "INPUT" && newFocusedTagName != "SELECT") // virtual keyboard elements
        blurCurrentNode();
      tapId = amx.uuid(); // TODO don't use amx.foo!
      tapPendingIds[tapId] = true;
      originalPosition = _getEventPagePosition(event);
    };
    var endListener = function(event)
    {
      if (tapPendingIds[tapId])
      {
        // Ignore taps if the finger moves too much between start and end.
        // The points might be null in automated testing mode so allow the tap
        // if points cannot be determined.
        var newPosition = _getEventPagePosition(event);
        var pointsCloseEnough =
          Math.abs(originalPosition["pageX"] - newPosition["pageX"]) < 25 &&
          Math.abs(originalPosition["pageY"] - newPosition["pageY"]) < 25;
        if (pointsCloseEnough ||
           originalPosition["pageX"] == null ||
           originalPosition["pageY"] == null ||
           newPosition["pageX"] == null ||
           newPosition["pageY"] == null)
        {
          adf.mf.api.amx.showLoadingIndicator();
          listener.call(this, event);
          adf.mf.api.amx.hideLoadingIndicator();
        }
        originalPosition = null;
        delete tapPendingIds[tapId];
        cancelPendingDrag(true, false);
      }
    };
    var cancelListener = function(event)
    {
      // Starting in Android 4.4, sometimes the browser will trigger a cancel
      // event before you lift your finger. In such cases, we can't reliably
      // honor the gesture as a tap because the 2 points are inaccurate.
      if (tapPendingIds[tapId])
      {
        originalPosition = null;
        delete tapPendingIds[tapId];
        cancelPendingDrag(true, false);
      }
    };
    // We used to ignore tap cancel but this is no longer valid with the new Chrome WebView in 4.4. Like native Chrome,
    // this will generate the cancel event if the preventDefault is not registered within 250ms. Since we get a touchStart
    // we need to figure out what the intent of the touch is (tap and hold or just tap or drag and drop). The issue
    // is the 250ms is a system time (outside the WebView) and when the WebView is busy (over long runs in Selenium), or
    // lots of open features then we start to slow down where some of the clicks are not addressed in time and we get a
    // touch cancel. What we do instead is treat the cancel like a touch end.
    if (tapEvents.cancel != "")
    {
      _addSpecialBubbleEventListener(
        domNode,
        eventType,
        listener,
        eventData,
        [
          [ tapEvents.start,  startListener ],
          [ tapEvents.end,    endListener ],
          [ tapEvents.cancel, cancelListener ]
        ]);
    }
    else
    {
      _addSpecialBubbleEventListener(
        domNode,
        eventType,
        listener,
        eventData,
        [
          [ tapEvents.start, startListener ],
          [ tapEvents.end,   endListener ]
        ]);
    }
  };
  // --------- /Tap Event --------- //

  // --------- Tap Hold --------- //
  var tapHoldPendingIds = {};

  function cancelPendingTapHold()
  {
    tapHoldPendingIds = {};
  }

  var holdThreshold = 800;

  var _addSpecialTapHoldBubbleEventListener = function(domNode, eventType, listener, eventData)
  {
    var tapEvents = _getTapEvents();
    var tapId = null;
    var startListener = function(event)
    {
      tapId = amx.uuid(); // TODO don't use amx.foo!
      tapHoldPendingIds[tapId] = new Date().getTime();

      // Since we are using a timer, we need to fetch our eventData now for reapplication in the timer
      var eventData = event.data;

      setTimeout(function()
      {
        // Note: here we double check if the time is greater than the threshold. This is useful since sometime timeout
        //       is not really reliable.
        if (tapHoldPendingIds[tapId] > 0)
        {
          var timeOffset = new Date().getTime() - tapHoldPendingIds[tapId];
          if (timeOffset >= holdThreshold)
          {
            // Call the listener but make sure our eventData is used:
            var eventDataToRestore = event.data;
            event.data = eventData;
            var result = listener.call(domNode, event);
            event.data = eventDataToRestore;

            // if the handler consumes the tapHold, remove it from the tapPendingIds so that it does not count like a tap
            if (result === "consumeTapHold")
            {
              // Android requires that we preventDefault, otherwise native select/edit text mode can be triggered
              // This code does also fixes softKeyboard show/hide bug and let's user select/edit text for inputText component
              var agent = adf.mf.internal.amx.agent;
              if (agent["type"] == "Android")
              {
                event.preventDefault();
              }
              cancelPendingTap();
              cancelPendingTapHold();
              cancelPendingDrag(false, false);
            }
          }
          delete tapHoldPendingIds[tapId];
        }

      }, holdThreshold);
    };
    var endListener = function(event)
    {
      if (tapHoldPendingIds[tapId])
      {
        delete tapHoldPendingIds[tapId];
      }
    };
    _addSpecialBubbleEventListener(
      domNode,
      eventType,
      listener,
      eventData,
      [
        [ tapEvents.start, startListener ],
        [ tapEvents.end, endListener ]
      ]);
  };
  // --------- /Tap Hold --------- //

  // --------- Drag Event --------- //
  var dragPendingIds = {};
  var dragEvents = null;

  function cancelPendingDrag(releaseLocks, triggerCancelOrEndBeforeRemove)
  {
    if (!triggerCancelOrEndBeforeRemove)
      dragPendingIds = {};

    if (releaseLocks)
    {
      if (!dragEvents)
        dragEvents = amx.hasTouch() ? touchDragEvents : mouseDragEvents;

      if (triggerCancelOrEndBeforeRemove)
      {
        // If a container is listening to drag events but a descendant gets removed, we need to
        // trigger the cancel/end listeners or else that container could get in a corrupt state:
        if (dragEvents.cancel != "")
          adf.mf.api.amx.triggerBubbleEventListener(document.documentElement, dragEvents.cancel);
        else
          adf.mf.api.amx.triggerBubbleEventListener(document.documentElement, dragEvents.end);
      }

      adf.mf.api.amx.removeBubbleEventListener(document.documentElement, dragEvents.drag, documentDragDrag);
      adf.mf.api.amx.removeBubbleEventListener(document.documentElement, dragEvents.end, documentDragEnd);
      if (dragEvents.cancel != "")
        adf.mf.api.amx.removeBubbleEventListener(document.documentElement, dragEvents.cancel, documentDragCancel);
      releaseDragLock();

      // delete the dragContext since it no longer applies
      adf.mf.internal.amx._setNonPrimitiveElementData(document.documentElement, "dragCtx", null);
    }
  }

  var DRAGSTART = "amxdragstart";
  var DRAGDRAG = "amxdragdrag";
  var DRAGEND = "amxdragend";

  /**
   * Options optional method implementation:
   */
  var mouseDragEvents =
  {
    start: "mousedown",
    drag: "mousemove",
    end: "mouseup",
    cancel: ""
  };

  var touchDragEvents =
  {
    start: "touchstart",
    drag: "touchmove",
    end: "touchend",
    cancel: "touchcancel"
  };

  // Handler for the event DRAGSTART event.
  function handleDragEvent(e, options)
  {
    var domNode = this;
    var id = "_" + amx.uuid(); // TODO don't use amx.foo!

    dragPendingIds[id] = true;

    var startEvent = e;
    var startPagePos = _getEventPagePosition(startEvent);

    // so far, we prevent the default, otherwise, we see some text select which can be of a distracting
    // since we create "meta events" we consume this one
    // e.preventDefault();
    // e.stopPropagation();

    var documentDragData = {
      "options": options,
      "domNode": domNode,
      "id": id,
      "startEvent": startEvent,
      "startPagePos": startPagePos,
      "dragStarted": false
    };

    if (!dragEvents)
      dragEvents = amx.hasTouch() ? touchDragEvents : mouseDragEvents;

    // We use the documentElement for the following 2 events so that the dragging doesn't stop when leaving the domNode.
    // In order to uniquely identify these listeners for removal the documentDragData will be passed in so that other
    // events of the same names on the document don't get lost.

    // drag
    adf.mf.api.amx.addBubbleEventListener(document.documentElement, dragEvents.drag, documentDragDrag, documentDragData);

    // drag end
    adf.mf.api.amx.addBubbleEventListener(document.documentElement, dragEvents.end, documentDragEnd, documentDragData);

    // drag cancel
    if (dragEvents.cancel != "")
      adf.mf.api.amx.addBubbleEventListener(document.documentElement, dragEvents.cancel, documentDragCancel, documentDragData);
  }

  function documentDragDrag(e)
  {
    var documentDragData = e.data;
    var options = documentDragData["options"];
    var domNode = documentDragData["domNode"];
    var id = documentDragData["id"];
    var startEvent = documentDragData["startEvent"];
    var startPagePos = documentDragData["startPagePos"];

    // if the drag has not started, check if we need to start it
    if (!documentDragData["dragStarted"] && dragPendingIds[id])
    {
      var currentPagePos = _getEventPagePosition(e);
      var offsetX = (startPagePos.pageX - currentPagePos.pageX);
      var offsetY = (startPagePos.pageY - currentPagePos.pageY);

      // if the diff > threshold, then, we start the drag
      if (Math.abs(offsetX) > options.threshold || Math.abs(offsetY) > options.threshold)
      {
        var dragCtx = adf.mf.internal.amx._getNonPrimitiveElementData(document.documentElement, "dragCtx");
        if (dragCtx == null) // if no drag is already in progress on the element...
        {
          documentDragData["dragStarted"] = true;

          // we cancel any pending tap event
          cancelPendingTap();
          cancelPendingTapHold();

          // create the dragCtx
          adf.mf.internal.amx._setNonPrimitiveElementData(document.documentElement, "dragCtx", {});

          var dragStartExtra = buildDragExtra(startEvent, domNode, DRAGSTART, startPagePos, currentPagePos);
          triggerEvent(domNode, DRAGSTART, dragStartExtra);
        }
      }
    }

    if (documentDragData["dragStarted"] && dragPendingIds[id])
    {
      // making sure they they are canceled
      cancelPendingTap();
      cancelPendingTapHold();

      var dragExtra = buildDragExtra(e, domNode, DRAGDRAG);
      triggerEvent(domNode, DRAGDRAG, dragExtra);

      // since we create "meta events" we consume this event if the meta event was consumed
      if (dragExtra.preventDefault)
        e.preventDefault();
      if (dragExtra.stopPropagation)
        e.stopPropagation();
    }
  }

  function documentDragEnd(e)
  {
    _documentDragFinish(e);
  }

  function documentDragCancel(e)
  {
    _documentDragFinish(e);
  }

  function _documentDragFinish(e)
  {
    var documentDragData = e.data;
    var domNode = documentDragData["domNode"];
    var id = documentDragData["id"];

    if (documentDragData["dragStarted"] && dragPendingIds[id])
    {
      var extra = buildDragExtra(e, domNode, DRAGEND);
      triggerEvent(domNode, DRAGEND, extra);

      // since we create "meta events" we consume this event if the meta event was consumed
      if (extra.preventDefault)
        e.preventDefault();
      if (extra.stopPropagation)
        e.stopPropagation();

      // Let other elements have a chance at handling drag events:
      extra.releaseDragLock();
    }

    // unbind the document event that is specifically tied to this documentDragData instance
    adf.mf.api.amx.removeBubbleEventListener(document.documentElement, dragEvents.drag, documentDragDrag, documentDragData);
    adf.mf.api.amx.removeBubbleEventListener(document.documentElement, dragEvents.end, documentDragEnd, documentDragData);
    if (dragEvents.cancel != "")
      adf.mf.api.amx.removeBubbleEventListener(document.documentElement, dragEvents.cancel, documentDragCancel, documentDragData);
    delete dragPendingIds[id];

    // delete the dragContext
    adf.mf.internal.amx._setNonPrimitiveElementData(document.documentElement, "dragCtx", null);
  }

  var currentDragElementH = null;
  var currentDragElementV = null;

  /**
   * Mechanism to release a reservation for horizontal and/or vertical drag behavior for the given element.
   * @param {HTMLElement} element the element that no longer wants to consume the specified drag events
   * @param {Boolean} horizontal whether you want to reserve drag events for the horizontal axis
   * @param {Boolean} vertical whether you want to reserve drag events for the horizontal axis
   * @return {Boolean} whether your release request was successful for the specified axes
   */
  function releaseDragLock(element, horizontal, vertical)
  {
    var releasedTheLock = false;

    if (element)
    {
      releasedTheLock = true;

      if (horizontal)
      {
        if (currentDragElementH == null || currentDragElementH == element)
          currentDragElementH = null;
        else
          releasedTheLock = false;
        }

      if (vertical)
      {
        if (currentDragElementV == null || currentDragElementV == element)
          currentDragElementV = null;
        else
          releasedTheLock = false;
        }
      }
    else // purge all
    {
      releasedTheLock = true;
      currentDragElementH = null;
      currentDragElementV = null;
    }

    return releasedTheLock;
  }

  /**
   * Mechanism to establish a reservation for horizontal and/or vertical drag behavior for the given element.
   * @param {HTMLElement} element the element that wants to consume the specified drag events
   * @param {Boolean} horizontal whether you want to reserve drag events for the horizontal axis
   * @param {Boolean} vertical whether you want to reserve drag events for the horizontal axis
   * @return {Boolean} whether your reservation request was granted for the specified axes
   */
  function requestDragLock(element, horizontal, vertical)
  {
    var gotTheLock = false;

    if (element)
    {
      gotTheLock = true;

      if (horizontal)
      {
        if (currentDragElementH == null || currentDragElementH == element)
          currentDragElementH = element;
        else
          gotTheLock = false;
      }

      if (vertical)
      {
        if (currentDragElementV == null || currentDragElementV == element)
          currentDragElementV = element;
        else
          gotTheLock = false;
      }
    }

    return gotTheLock;
  }

  /**
   * Build the extra event info for the drag event.
   * @param {Object} event TODO
   * @param {HTMLElement} domNode the dragged element
   * @param {String} dragType the custom drag event name
   * @param {Object} startPagePos optional argument with pageX and pageY properties
   * @param {Object} currentPagePos optional argument with pageX and pageY properties
   */
  function buildDragExtra(event, domNode, dragType, startPagePos, currentPagePos)
  {
    var hasTouch = amx.hasTouch(); // TODO don't use amx.foo!
    var extra = _getEventPagePosition(event); // fetch the pageX and pageY as appropriate
    extra["eventSource"] = event;
    extra["preventDefault"] = false;
    extra["stopPropagation"] = false;
    extra["releaseDragLock"] = releaseDragLock;
    extra["requestDragLock"] = requestDragLock;

    if (hasTouch)
    {
      extra.touches = event.touches;
    }

    var dragCtx = adf.mf.internal.amx._getNonPrimitiveElementData(document.documentElement, "dragCtx");
    if (dragCtx)
    {
      if (dragType === DRAGSTART)
      {
        dragCtx.startPageX = extra.startPageX = extra.pageX;
        dragCtx.startPageY = extra.startPageY = extra.pageY;

        dragCtx.lastPageX = dragCtx.startPageX = extra.startPageX;
        dragCtx.lastPageY = dragCtx.startPageY = extra.startPageY;
      }
      else if (dragType === DRAGEND)
      {
        // because, on iOS, the touchEnd event does not have the .touches[0].pageX
        extra.pageX = dragCtx.lastPageX;
        extra.pageY = dragCtx.lastPageY;
      }

      if (startPagePos != null && dragCtx.originalAngle == null)
      {
        // Calculate, using the start page event location, the angle that the user moved their
        // finger. Allows callers to determine the directionality that the user intends to scroll.
        diffX = currentPagePos.pageX - startPagePos.pageX;
        diffY = startPagePos.pageY - currentPagePos.pageY; // Y direction is reversed;

        // Determine the angle
        // angle = arctan(opposite/adjacent) (converted from radians to degrees)
        // Note that this computation uses 0 degrees as east, 90 is north.
        // Angles to the south and west are negative (-90 is south)
        dragCtx.originalAngle = Math.round(Math.atan2(diffY, diffX) * 180 / Math.PI);
      }

      extra.originalAngle = dragCtx.originalAngle;
      extra.startPageX = dragCtx.startPageX;
      extra.startPageY = dragCtx.startPageY;
      extra.deltaPageX = extra.pageX - dragCtx.lastPageX;
      extra.deltaPageY = extra.pageY - dragCtx.lastPageY;

      dragCtx.lastPageX = extra.pageX;
      dragCtx.lastPageY = extra.pageY;
    }
    else
    {
      adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.WARNING, "buildDragExtra", "MSG_DRAG_CTX_NULL");
    }

    return extra;
  }

  function _getEventPagePosition(e)
  {
    var pageX, pageY;
    if (e.changedTouches && e.changedTouches.length > 0)
    {
      pageX = e.changedTouches[0].pageX;
      pageY = e.changedTouches[0].pageY;
    }
    else if (e.touches && e.touches.length > 0)
    {
      pageX = e.touches[0].pageX;
      pageY = e.touches[0].pageY;
    }
    else
    {
      pageX = e.pageX;
      pageY = e.pageY;
    }

    return {
      "pageX": pageX,
      "pageY": pageY
    };
  }

  // --------- /Drag Event --------- //

  // -------- Swipe Event --------- //

  var swipeThreshold = 5;

  /**
   * Determine if it is a swipe event, and if yes, build the swipeExtra
   */
  function buildSwipeExtra(domNode, event, dragExtra)
  {
    var swipeExtra = null;
    var swipeDone = domNode.getAttribute("data-swipeDone");

    if (swipeDone != "true" && dragExtra)
    {
      var offsetX = (dragExtra.pageX - dragExtra.startPageX);
      var offsetY = (dragExtra.pageY - dragExtra.startPageY);
      var absOffsetX = Math.abs(offsetX);
      var absOffsetY = Math.abs(offsetY);
      if (absOffsetX >= absOffsetY && absOffsetX > swipeThreshold)
      {
        // Only consider it a drag if the angle of the drag is within 30 degrees of due horizontal
        var angle = Math.abs(dragExtra.originalAngle);
        if (angle <= 30 || angle >= 150)
        {
          swipeExtra = {};
          swipeExtra.swipeType = (offsetX > -1)?"swipeRight":"swipeLeft";
          domNode.setAttribute("data-swipeDone", "true");
        }
      }
      else if (absOffsetY >= absOffsetX && absOffsetY > swipeThreshold)
      {
        // Only consider it a drag if the angle of the drag is within 30 degrees of due vertical
        var ang = Math.abs(dragExtra.originalAngle);
        if (ang >= 60 && ang <= 120)
        {
          swipeExtra = {};
          swipeExtra.swipeType = (offsetY > -1)?"swipeDown":"swipeUp";
          domNode.setAttribute("data-swipeDone", "true");
        }
      }
    }

    return swipeExtra;
  }
  // -------- /Swipe Event --------- //

// --------- /events --------- //

// --------- Event Enabler --------- //

  /**
   * Triggers an HTML bubble event listener (e.g. tap, taphold, keydown,
   * touchstart, touchmove, touchend, focus, blur, resize, etc.).
   * It is important to note that web browsers do not support all event types on
   * all DOM nodes. Refer to browser documentation for specifics.
   * @param {DOMNode} eventTarget the target DOM node for this event
   * @param {String} eventName the name of the HTML event to listen for
   */
  adf.mf.api.amx.triggerBubbleEventListener = function(eventTarget, eventName)
  {
    triggerEvent(eventTarget, eventName);
  };

  /**
   * Register a bubble event listener (e.g. tap, taphold, keydown, touchstart, touchmove, touchend, focus,
   * blur, resize, etc.). It is important to note that web browsers do not support all event types on all
   * DOM nodes. Refer to browser documentation for specifics. The eventData is optional and
   * serves as extra data to be made available to your listener function.
   * @param {DOMNode} domNode the target element for this event
   * @param {String} eventType the name of the event to listen for
   * @param {Function} listener the function that will be invoked when the specified element encounters this event (with a parameter that is the DOM event object)
   * @param {Object} eventData extra event data that will be made available on the "data" member of the event object
   */
  adf.mf.api.amx.addBubbleEventListener = function(domNode, eventType, listener, eventData)
  {
    // For special events (ones we made up that delegate to other real events), we have more
    // work to do in order to add the listeners:
    if ("tap" == eventType)
    {
      _addSpecialTapBubbleEventListener(domNode, eventType, listener, eventData);
    }
    else if ("taphold" == eventType)
    {
      _addSpecialTapHoldBubbleEventListener(domNode, eventType, listener, eventData);
    }
    else
    {
      // Adding a real event listener:
      _addBubbleEventListener(domNode, eventType, listener, eventData);
    }
  };

  var _addBubbleEventListener = function(domNode, eventType, listener, eventData)
  {
    // Internal note: we will support eventData using a technique similar to this:
    // domNode.addEventListener("click", function() { var tempData = eventData; yourListener(tempData); }, false)
    // but we need to follow the removeEventListener "handleEvent" guidance noted here and we will need a
    // mechanism to remove all listeners at once (for the removeDomNode function) so that means we need to
    // track the listeners using some ID mechanism).

    if (domNode != null && listener != null)
    {
      var actualListener = function(event)
      {
// TODO integrate .registerFocus and .registerBlur here
        var oldData = event.data;
        if (eventData != null)
        {
          if (oldData == null)
          {
            // No merging necessary (only new data)
            event.data = eventData;
          }
          else // Try merging the 2 pieces of data
          {
            var merged = {};
            if (_mergeSimpleObjects(merged, oldData, eventData))
              event.data = merged; // Use the merged result
            else
              event.data = eventData; // Both are not objects so we can't merge; use only new data
          }
        }
        var result = listener.call(this, event, event.triggerExtra);
        event.data = oldData;
        if (result !== undefined)
        {
          if ((event.result = result) === false)
          {
            // Stop the event from continuing (e.g. max length hit in an inputText)
            event.preventDefault();
            event.stopPropagation();
          }
        }
      };
      var newListener = {
        "actualListener": actualListener,
        "eventType": eventType,
        "listener": listener,
        "eventData": eventData
      };
      if (domNode._amxListeners == null)
        domNode._amxListeners = [];
      domNode._amxListeners.push(newListener);
      domNode.addEventListener(eventType, actualListener, false);
    }
  };

  var _addSpecialBubbleEventListener = function(domNode, eventType, eventKey, eventData, backingListeners)
  {
    // specialEventsMap is a map with keys like "tap", "taphold", "amxdrag":
    var specialEventsMap = domNode._amxSpecialEvents;
    if (specialEventsMap == null)
    {
      specialEventsMap = {};
      domNode._amxSpecialEvents = specialEventsMap;
    }

    // Since there can be multiple instances of each special event type, each type points to an instance map.
    // The eventKeysMap is keyed by something that allows unique removal.
    // This key could be the developer's passed-in listener function (in the case of "tap" and "taphold") or
    // the developer's payload object (in the case of "amxdrag").
    var eventKeysMap = specialEventsMap[eventType];
    if (eventKeysMap == null)
    {
      eventKeysMap = {};
      specialEventsMap[eventType] = eventKeysMap;
    }

    // Each entry in eventKeysMap is a map keyed by the event data (possibly null):
    var eventDataMap = eventKeysMap[eventKey];
    if (eventDataMap == null)
    {
      eventDataMap = {};
      eventKeysMap[eventKey] = eventDataMap;
    }

    // Each entry in eventDataMap is an array of instance listeners.
    var instanceListenersArray = eventDataMap[eventData];
    if (instanceListenersArray == null)
    {
      instanceListenersArray = [];
      eventDataMap[eventData] = instanceListenersArray;
    }

    // Each member of instanceListeners is a backing listener array where index 0 is an
    // DOM event type and index 1 is a DOM event handler function.
    for (var i=0, count=backingListeners.length; i<count; ++i)
    {
      var backingListener = backingListeners[i];
      _addBubbleEventListener(domNode, backingListener[0], backingListener[1], eventData);
      instanceListenersArray.push(backingListener);
    }
  };

  /**
   * Unregister a bubble event listener that was added via adf.mf.api.amx.addBubbleEventListener.
   * If eventType is not specified, all listeners registered by the add function will be removed.
   * If listener is not specified, all listeners registered by the add function of the given type will be removed.
   * @param {DOMNode} domNode the target element for which an event listener was previously added
   * @param {String} eventType the name of the event
   * @param {Function} listener the event listener function
   * @param {Object} eventData the extra event data
   */
  adf.mf.api.amx.removeBubbleEventListener = function(
    domNode,
    eventType,
    listener,
    eventData)
  {
    if (domNode != null)
    {
      if (eventType == null)
      {
        // Remove all special event listeners:
        _removeSpecialBubbleEventListener(domNode);
        delete domNode._amxSpecialEvents;

        // Remove all real event listeners:
        _removeBubbleEventListener(domNode);
      }
      else if ("tap" == eventType || "taphold" == eventType || "amxdrag" == eventType)
      {
        // For special events (ones we made up that delegate to other real events), we have more
        // work to do in order to remove the listeners:
        var eventKey = listener; // for "tap" and "taphold", the listener is the eventKey
        _removeSpecialBubbleEventListener(domNode, eventType, eventKey, eventData);
      }
      else
      {
        // Removing a real event listener:
        _removeBubbleEventListener(domNode, eventType, listener, eventData);
      }
    }
  };

  /**
   * Remove a bubble event listener.
   * @param {DOMNode} domNode the DOM node that owns the event listeners
   * @param {String} eventType the DOM event type (if not specified, all events will be removed)
   * @param {Function} listener the DOM event listener (if not specified, all events of the given type will be removed)
   * @param {Object} eventData the optional event data that is bundled with the event listener
   */
  var _removeBubbleEventListener = function(domNode, eventType, listener, eventData)
  {
    if (domNode != null && listener != null)
    {
      // Account for listeners not added via adf.mf.api.amx.addBubbleEventListener:
      domNode.removeEventListener(eventType, listener, false);
    }

    if (domNode != null && domNode._amxListeners != null)
    {
      // Account for listeners added via adf.mf.api.amx.addBubbleEventListener:
      var savedListeners = domNode._amxListeners;
      var savedListenerCount = savedListeners.length;
      for (var i=savedListenerCount-1; i>=0; --i)
      {
        var savedListener = savedListeners[i];
        var removeThisListener = false;
        if (eventType === undefined) // remove all saved listeners
        {
          eventType = savedListener["eventType"];
          removeThisListener = true;
        }
        else if (listener === undefined) // remove all saved listeners of this event type
          removeThisListener = savedListener["eventType"] == eventType;
        else if (eventData === undefined) // remove all saved listeners of this event type and listener function
          removeThisListener = savedListener["eventType"] == eventType && savedListener["listener"] == listener;
        else // remove only listeners that match this type, listener function, and event data
          removeThisListener = savedListener["eventType"] == eventType && savedListener["listener"] == listener && savedListener["eventData"] == eventData;

        if (removeThisListener)
        {
          domNode.removeEventListener(eventType, savedListener["actualListener"], false);
          savedListeners.splice(i, 1); // remove that listener from the array
        }
      }

      if (domNode._amxListeners.length == 0)
        delete domNode._amxListeners;
    }
  };

  /**
   * Remove any special event listeners associated with the given information.
   * @param {DOMNode} domNode the DOM node that owns the event listeners
   * @param {String} eventType optional eventType to limit what gets removed
   * @param {Object} eventKey optional eventKey to limit what gets removed
   * @param {Object} eventData optional eventData to limit what gets removed
   */
  var _removeSpecialBubbleEventListener = function(domNode, eventType, eventKey, eventData)
  {
    var specialEventsMap = domNode._amxSpecialEvents;
    if (specialEventsMap == null)
    {
      return; // nothing was registered so nothing to remove
    }

    if (eventType == null)
    {
      // Remove for all possible special eventType values
      for (var foundEventType in specialEventsMap)
      {
        _removeSpecialEventForKeyAndData(domNode, specialEventsMap[foundEventType]);
        delete specialEventsMap[foundEventType];
      }
    }
    else
    {
      // Restrict removal to just this special eventType
      var eventKeysMap = specialEventsMap[eventType];
      _removeSpecialEventForKeyAndData(domNode, eventKeysMap, eventKey, eventData);
      if (Object.keys(eventKeysMap).length == 0)
        delete specialEventsMap[eventType]; // no more keys for this event type
    }

    if (Object.keys(specialEventsMap).length == 0)
      delete domNode._amxSpecialEvents; // no more special events of any type
  };

  /**
   * Remove special event listeners of a specific type associated with the given information.
   * @param {DOMNode} domNode the DOM node that owns the event listeners
   * @param {Object} eventKeysMap map of all special event keys for a particular eventType
   * @param {Object} eventKey optional eventKey to limit what gets removed
   * @param {Object} eventData optional eventData to limit what gets removed
   */
  var _removeSpecialEventForKeyAndData = function(domNode, eventKeysMap, eventKey, eventData)
  {
    if (eventKeysMap == null)
    {
      return; // nothing was registered so nothing to remove
    }

    if (eventKey == null)
    {
      // Remove all instances of this special eventType
      for (var foundEventKey in eventKeysMap)
      {
        _removeSpecialEventForData(domNode, eventKeysMap[foundEventKey]);
        delete eventKeysMap[foundEventKey];
      }
    }
    else
    {
      // Restrict removal to just this eventKey
      var eventDataMap = eventKeysMap[eventKey];
      _removeSpecialEventForData(domNode, eventDataMap, eventData);
      if (Object.keys(eventDataMap).length == 0)
        delete eventKeysMap[eventKey]; // no more keys for this event type and key combo
    }
  };

  /**
   * Remove special event listeners of a specific eventData associated with the given information.
   * @param {DOMNode} domNode the DOM node that owns the event listeners
   * @param {Object} eventDataMap map of all special eventData for a particular eventType and eventKey
   * @param {Object} eventData optional eventData to limit what gets removed
   * @return {Boolean} whether the specified listeners were removed
   */
  var _removeSpecialEventForData = function(domNode, eventDataMap, eventData)
  {
    if (eventDataMap == null)
    {
      return; // nothing was registered so nothing to remove
    }

    if (eventData == null)
    {
      // Remove all instances of this special eventData
      for (var foundEventData in eventDataMap)
      {
        _removeSpecialEventInstanceListeners(domNode, eventDataMap[foundEventData], foundEventData);
        delete eventDataMap[foundEventData];
      }
    }
    else
    {
      // Restrict removal to just this eventData
      var instanceListeners = eventDataMap[eventData];
      _removeSpecialEventInstanceListeners(domNode, instanceListeners, eventData);
      delete eventDataMap[eventData]; // no more keys for this event type and key combo
    }
  };

  /**
   * Remove special event listeners of associated with the given information.
   * @param {DOMNode} domNode the DOM node that owns the event listeners
   * @param {Object} instanceListeners the backing listener array
   * @param {Object} eventData optional eventData to limit what gets removed
   */
  var _removeSpecialEventInstanceListeners = function(domNode, instanceListeners, eventData)
  {
    if (instanceListeners == null)
    {
      return; // nothing was registered so nothing to remove
    }

    // Remove the real underlying events for this custom event listener
    for (var i=instanceListeners.length-1; i>=0; --i)
    {
      var backingListener = instanceListeners[i];
      // Note, for now we are not passing along eventData so that callers can delete references to
      // instanceListeners.
      _removeBubbleEventListener(domNode, backingListener[0], backingListener[1], eventData);
    }
  };

  /**
   * Allow a DOM node to trigger custom AMX events for amx:showPopupBehavior, amx:setPropertyListener, etc.
   * like "tapHold" and the "swipe".
   * @param {adf.mf.api.amx.AmxNode} amxNode the AmxNode that owns the DOM for the event
   * @param {DOMNode} domNode the DOM node that can trigger the event
   * @param {String} eventType the type of event being associated; either "tapHold" or "swipe"
   */
  adf.mf.api.amx.enableAmxEvent = function(amxNode, domNode, eventType)
  {
    if (eventType == "swipe")
      _enableSwipe(amxNode, domNode);
    else if (eventType == "tapHold")
      _enableTapHold(amxNode, domNode);
  };

  var _enableSwipe = function(amxNode, domNode)
  {
    var handler = function(event, swipeExtra)
    {
      var tag = amxNode.getTag();
      var swipeType = swipeExtra.swipeType;

      // check that we have at least one action with this type
      var childrenTags = tag.getChildren();
      for (var i=0, size=childrenTags.length; i<size; ++i)
      {
        var childTag = childrenTags[i];
        var childType = childTag.getAttribute("type");

        // The event processing doesn't know about start/end so use left/right if applicable:
        if (childType == "swipeStart")
        {
          if (document.documentElement.dir == "rtl")
            childType = "swipeRight";
          else
            childType = "swipeLeft";
        }
        else if (childType == "swipeEnd")
        {
          if (document.documentElement.dir == "rtl")
            childType = "swipeLeft";
          else
            childType = "swipeRight";
        }

        if (childType == swipeType)
        {
          var event = new amx.ActionEvent(); // TODO don't use amx.foo!
          adf.mf.api.amx.processAmxEvent(amxNode, swipeType, undefined, undefined, event);
          return "consumeSwipe";
        }
      }
    };

    var swipeConsumed = false;
    adf.mf.api.amx.addDragListener(
      domNode,
      {
        start: function(event, dragExtra) {},

        drag: function(event, dragExtra)
        {
          if (!swipeConsumed)
          {
            var swipeExtra = buildSwipeExtra(domNode, event, dragExtra);
            if (swipeExtra)
            {
              var result = handler.call(this, event, swipeExtra);
              if (result === "consumeSwipe")
              {
                swipeConsumed = true;
                domNode.removeAttribute("data-swipeDone");
              }
            }
           }
        },

        end: function(event, dragExtra)
        {
          swipeConsumed = false;
          domNode.removeAttribute("data-swipeDone");
        },

        threshold: 5
      });
  };

  var _enableTapHold = function(amxNode, domNode)
  {
    adf.mf.api.amx.addBubbleEventListener(
      domNode,
      "taphold",
      function(event)
      {
        var tag = amxNode.getTag();

        // check that we have at least one action with this type
        var childrenTags = tag.getChildren();
        for (var i=0, size=childrenTags.length; i<size; ++i)
        {
          var childTag = childrenTags[i];
          if (childTag.getAttribute("type") == "tapHold")
          {
            var event = new amx.ActionEvent(); // TODO don't use amx.foo!
            adf.mf.api.amx.processAmxEvent(amxNode, "tapHold", undefined, undefined, event);
            return "consumeTapHold";
          }
        }
      });
  };

  /**
   * Allow a DOM node to trigger AMX drag events.
   * The payload object defines 3 member functions: "start", "drag", "end" where each one's first parameter
   * is the DOM event, the second parameter is a "dragExtra" object with members: "eventSource" (the DOM event
   * source), "pageX" (the x coordinate of the event, "pageY" the y coordinate of the event, "startPageX" (the
   * original pageX), "startPageY" (the original pageY), "deltaPageX" (the change in pageX), "deltaPageY" (the
   * change in pageY), "originalAngle" (if available, it will be the original angle of the drag in degrees
   * where 0 degrees as east, 90 is north, -90 is south, 180 is west), and modifiable member flags:
   * "preventDefault", and "stopPropagation".
   * @param {DOMNode} domNode the DOM node that can trigger the drag event
   * @param {Object} playload the specifics about the drag event
   * @param {Object} eventData the extra event data
   */
  adf.mf.api.amx.addDragListener = function(domNode, payload, eventData)
  {
    var options =
    {
      threshold: 5
    };
    _mergeSimpleObjects(options, payload);

    var backingListeners = [];
    if (options.start)
      backingListeners.push([ DRAGSTART, options.start ]);
    if (options.drag)
      backingListeners.push([ DRAGDRAG, options.drag ]);
    if (options.end)
      backingListeners.push([ DRAGEND, options.end ]);

    var dragEvents = amx.hasTouch() ? touchDragEvents : mouseDragEvents;

    backingListeners.push([ dragEvents.start, function(e)
      {
        domNode.setAttribute("data-amxDragInProgress", "yes");
        handleDragEvent.call(domNode, e, options);
      }]);
    backingListeners.push([ dragEvents.end, function(e)
      {
        cleanElementsWithDragInProgress();
      }]);
    if (dragEvents.cancel != "")
    {
      backingListeners.push([ dragEvents.cancel, function(e)
        {
          cleanElementsWithDragInProgress();
        }]);
    }

    _addSpecialBubbleEventListener(
      domNode,
      "amxdrag",
      payload,
      eventData,
      backingListeners);
  };

  function cleanElementsWithDragInProgress()
  {
    // Since we are not guaranteed to get an "end" for a "start" (e.g. the drag ended
    // on a different element than the start element) then we need to find all drag
    // elements and remove their "in-progress" markers:
    var elementsWithDragInProgress = document.querySelectorAll("*[data-amxDragInProgress]");
    for (var i = 0, count = elementsWithDragInProgress.length; i < count; ++i)
      elementsWithDragInProgress[i].removeAttribute("data-amxDragInProgress");

    // Ensure the drag is concluded:
    cancelPendingDrag(true, true);
  }

  /**
   * Apply innerHTML upon on element (this will call adf.mf.api.amx.emptyHtmlElement for
   * you).
   * @param {HTMLElement} parentElement the parent HTML element whose innerHTML is to be applied
   * @param {string} innerHtml the HTML to apply in the parentElement
   * @param {boolean} scriptEval whether script tags should be evaluated
   */
  adf.mf.api.amx.applyInnerHtml = function(parentElement, innerHtml, scriptEval)
  {
    adf.mf.api.amx.emptyHtmlElement(parentElement);
    parentElement.innerHTML = innerHtml;
    if (scriptEval)
    {
      // Loop through all script nodes in the parent (might be more than just innerHTML's):
      var scriptNodes = parentElement.querySelectorAll("script");
      for (var i = 0; i < scriptNodes.length; i++)
      {
        // Clone the node (if not previously-cloned)
        var scriptNode = scriptNodes[i];
        var scriptClone = cloneScriptNode(scriptNode);
        if (scriptClone)
          scriptNode.parentNode.replaceChild(scriptClone, scriptNode);
      }
    }
  };

  function cloneScriptNode(oldNode)
  {
    if (oldNode == null)
      return oldNode;
    var newNode = document.createElement("script");
    var cloneIdentifier = "data-amx-script-clone";
    newNode.setAttribute(cloneIdentifier, "yes"); // marker to prevent re-cloning
    newNode.text = oldNode.innerHTML;
    var attrs = oldNode.attributes;
    for (var i = attrs.length-1; i >= 0; i--)
    {
      var attr = oldNode.attributes[i];
      var attrName = attr.name;
      if (attrName == cloneIdentifier)
        return null; // found a script node that was previously-cloned
      newNode.setAttribute(attrName, attr.value);
    }
    return newNode;
  }

  /**
   * Remove a DOM node (and its children) but first removes event listeners
   * that were added via adf.mf.api.amx.addBubbleEventListener and ensures any
   * components inside it get cleaned up properly.
   * @param {DOMNode} domNode the DOM node to remove
   */
  adf.mf.api.amx.removeDomNode = function(domNode)
  {
    var i;

    // We need to proceed depth-first:
    if (domNode != null)
    {
      // Cancel pending drags if applicable
      // We need to cancel pending drags because they may have been abandoned
      // due to element removal during their "dragdrag" handlers.
      // This is needed for bug 18775524 but means we can't have a navigationDragBehavior.
      if (domNode.getAttribute && "yes" == domNode.getAttribute("data-amxDragInProgress"))
      {
        cancelPendingDrag(true, true);
      }

      // First we need to clean up any associated AMXNodes before the DOM is
      // removed or else the destroy handlers might lose important context.
      adf.mf.internal.amx.removeAmxDomNode(domNode);

      // Going depth-first, clean up the children:
      var children = domNode.childNodes;
      if (children != null)
      {
        for (i = children.length - 1; i >= 0; --i)
        {
          adf.mf.api.amx.removeDomNode(children[i]);
        }
      }

      // Unregister the event listeners:
      adf.mf.api.amx.removeBubbleEventListener(domNode);

      // In some cases an element delegates event listeners to the document like
      // amx:view for some document events. We need to make sure those get
      // unregistered too or else there would be a leak:
      if (domNode.__amxRemoveFunctions != null)
      {
        var removeFunctionCount = domNode.__amxRemoveFunctions.length;
        for (i = removeFunctionCount - 1; i >= 0; --i)
        {
          var removeFunc = domNode.__amxRemoveFunctions[i];
          try
          {
            removeFunc();
          }
          catch (problem)
          {
            adf.mf.log.logInfoResource(
              "AMXInfoBundle",
              adf.mf.log.level.SEVERE,
              "adf.mf.api.amx.removeDomNode",
              "MSG_ERROR_IN_SCRIPT", removeFunc, problem);
          }
        }
        domNode.__amxRemoveFunctions = null;
      }

      // Remove the node:
      if (domNode.parentNode != null)
        domNode.parentNode.removeChild(domNode);
    }
  };

  /**
   * Empty an HTML element by removing children DOM nodes and calling adf.mf.api.amx.removeDomNode on each
   * of the children nodes.
   * @param {HTMLElement} element the HTML element to empty
   */
  adf.mf.api.amx.emptyHtmlElement = function(element)
  {
    // HTMLElement element
    if (element != null)
    {
      var children = element.childNodes;
      if (children != null)
      {
        for (var i=children.length-1; i>=0; --i)
          adf.mf.api.amx.removeDomNode(children[i]);
      }
    }
  };

  /**
   * Enable scrolling for the given element.
   * This operation may append a style class to the element so ensure that you
   * do not overwrite the element class name after calling this API.
   */
  adf.mf.api.amx.enableScrolling = function(element)
  {
    var scrollPolicyClassName = "amx-scrollable";

    // In legacy skins, scrolling is much more aggressive so we have a different class name:
    var args = Array.prototype.slice.call(arguments);
    if (args.length == 2)
    {
      if (args[1] === true) // 2nd magic argument is whether you need legacy scrolling support
        scrollPolicyClassName = "amx-scrollPolicy-auto";
    }

    // Apply the class name:
    element.classList.add(scrollPolicyClassName);

    // Enable programmatic scrolling for Android if applicable:
    if (adf.mf.internal.amx.bindManualScrollers)
      adf.mf.internal.amx.bindManualScrollers(element);
  };

  function _shorten(object, limit)
  {
    if (object == null)
      result = object;
    else
    {
      var string = "" + object;
      if (string.length > limit)
        result = string.substring(0, limit-3).trim() + "...";
      else
        result = string;
      result = result.replace(/\n/g, " ").trim();
      result = result.replace(/[\s]+/g, " "); // collapse all spaces
    }
    return result;
  }

  /**
   * Generate a debugging string for events associated with a given HTML element.
   * @param {HTMLElement} element the HTML element whose event detail will be generated
   * @param {Number} shortenLimit optional number that can change the limit to the length of debug listener or data text
   * @return {String} a debugging string representing details about events associated with the given HTML element
   */
  adf.mf.api.amx.getEventDebugString = function(element, shortenLimit)
  {
    if (element == null)
      return element;

    if (shortenLimit === undefined)
      shortenLimit = 25;

    var domEventsMessage = "\n  n/a";
    var domListeners = element._amxListeners;
    if (domListeners != null)
    {
      var domListeners = element._amxListeners;
      var domListenerCount = domListeners.length;
      domEventsMessage = "";
      for (var i=0; i<domListenerCount; ++i)
      {
        var domListener = domListeners[i];
        var firstPrefix = "  " + (1+i) + " - ";
        var otherPrefix = Array(1+firstPrefix.length).join(" "); // empty spaces of equal length
        domEventsMessage += "\n" + firstPrefix + "type: " + domListener["eventType"];
        domEventsMessage += "\n" + otherPrefix + "listener: " + _shorten(domListener["listener"], shortenLimit);
        domEventsMessage += "\n" + otherPrefix + "data: " + _shorten(domListener["eventData"], shortenLimit);
      }
    }

    var specialEventsMessage = "\n  n/a";
    var specialEventsMap = element._amxSpecialEvents;
    if (specialEventsMap != null)
    {
      specialEventsMessage = "";
      var eventTypeCounter = 0;
      for (var eventType in specialEventsMap)
      {
        // Since there can be multiple instances of each special event type, each type points to an event key map.
        // The eventKeysMap is keyed by something that allows unique removal.
        // This key could be the developer's passed-in listener function (in the case of "tap" and "taphold") or
        // the developer's payload object (in the case of "amxdrag").
        var eventKeysMap = specialEventsMap[eventType];
        specialEventsMessage += "\n  " + ++eventTypeCounter + " - type: " + eventType;
        var eventKeyCounter = 0;
        for (var eventKey in eventKeysMap)
        {
          // Each entry in eventKeysMap is a eventDataMap.
          var eventDataMap = eventKeysMap[eventKey];
          specialEventsMessage += "\n    " + eventTypeCounter + "." + ++eventKeyCounter + " - key: " + _shorten(eventKey, shortenLimit);
          var eventDataCounter = 0;
          for (var eventData in eventDataMap)
          {
            // Each entry in eventDataMap is an array of instance listeners.
            var instanceListenersArray = eventDataMap[eventData];
            var instanceListenerCount = instanceListenersArray.length;
            specialEventsMessage += "\n      " + eventTypeCounter + "." + eventKeyCounter + "." + ++eventDataCounter + " - data: " + _shorten(eventData, shortenLimit);
            for (var i=0; i<instanceListenerCount; ++i)
            {
              // Each member of instanceListenersArray is a backing listener array where index 0 is an
              // DOM event type and index 1 is a DOM event handler function.
              specialEventsMessage += "\n        " + eventTypeCounter + "." + eventKeyCounter + "." + eventDataCounter + "." + (1+i) + " - DOM type: " + instanceListenersArray[i][0];
            }
          }
        }
      }
    }

    var message =
      "DOM events: " + domEventsMessage +
      "\nSpecial events:" + specialEventsMessage;
    return message;
  };

  //NOTE: The body of this function was removed to allow use of native scrolling in iOS 5.0 by
  // the use of the CSS "-webkit-overflow-scrolling: touch" on the amx-scrollable class, but the
  // binding itself remains because removing it causes AMX-processed touch events to fail
  // altogether.
  //TODO : Do we still need this (was in a jQuery load of amx-core)?
  adf.mf.api.amx.addBubbleEventListener(document.body, "touchmove", function(event) {});

  adf.mf.api.finishAnyLoading().then(
    function()
    {
      // Android workaround for form elements not appearing within visible part of the display
      // when a keyboard is shown (they would otherwise be covered up by the keyboard).
      if (adf.mf.internal.amx.agent["type"] == "Android")
      {
        var lastShowKeyboardTime = 0;
        var lastResizeTime = 0;
        var timeOutRunning = false;

        var scrollActiveElementIntoView = function()
        {
          timeOutRunning = false;

          var ae = document.activeElement;

          // Ignore the document body (when the active element has not been set).
          if (ae != document.body)
          {
            // Not every browser implements scrollIntoViewIfNeeded. The mobile browsers mostly
            // implement it, but check first before falling back on scrollIntoView.
            ae["scrollIntoViewIfNeeded"] ? ae.scrollIntoViewIfNeeded() : ae.scrollIntoView();
          }
        };

        var scrollActiveElementIntoViewIfAppropriate = function(newerTime, olderTime)
        {
          // Determine how long between the most recent showkeyboard and resize events.
          var timeDiff = newerTime - olderTime;

          // Is this resize due to the keyboard (close in time to the event)?
          if (timeDiff <= 750 && !timeOutRunning)
          {
            timeOutRunning = true;

            // Use a timeout to allow the browser time to redraw before trying to bring the
            // element into view.
            window.setTimeout(scrollActiveElementIntoView, 150);
          }
        };

        // Note: showkeyboard is only called on Android and it is called several times per one
        // showing of the keyboard for some unknown reason.
        document.addEventListener("showkeyboard",
          function(event)
          {
            // Record when the event was generated
            lastShowKeyboardTime = (new Date()).getTime();

            scrollActiveElementIntoViewIfAppropriate(lastShowKeyboardTime, lastResizeTime);
          });

        // The android:windowSoftInputMode is set to adjustResize, so the window will resize
        // to fit to the space left without the keyboard. Listen for this event so that we can
        // catch the resize event that happens after the showkeyboard event.
        window.addEventListener("resize",
          function(event)
          {
            // Record when the event was generated
            lastResizeTime = (new Date()).getTime();

            scrollActiveElementIntoViewIfAppropriate(lastResizeTime, lastShowKeyboardTime);
          });
      }
    });

})();
/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------------- amx-validation.js ---------------------- */
/* ------------------------------------------------------ */

// ------ amx validations ------ //
(function()
{
  var ERROR_UPPER_STR = "ERROR";
  var WARNING_UPPER_STR = "WARNING";

  var INFO_STR = "info";
  var CONFIRMATION_STR = "confirmation";
  var WARNING_STR = "warning";
  var ERROR_STR = "error";
  var FATAL_STR = "fatal";

  // initialize display strings with fallback values - too early to load from resource bundle
  var INFO_DISPLAY_STR = "Info";
  var CONFIRMATION_DISPLAY_STR = "Confirmation";
  var WARNING_DISPLAY_STR = "Warning";
  var ERROR_DISPLAY_STR = "Error";
  var FATAL_DISPLAY_STR = "Fatal";

  var INFO_VAL = 4;
  var CONFIRMATION_VAL = 3;
  var WARNING_VAL = 2;
  var ERROR_VAL = 1;
  var FATAL_VAL = 0;

  // these maps are used to convert to and from severity string/int values
  var __severityStringToInt = {};
  __severityStringToInt[INFO_STR] = INFO_VAL;
  __severityStringToInt[CONFIRMATION_STR] = CONFIRMATION_VAL;
  __severityStringToInt[WARNING_STR] = WARNING_VAL;
  __severityStringToInt[ERROR_STR] = ERROR_VAL;
  __severityStringToInt[FATAL_STR] = FATAL_VAL;

  var __severityIntToDisplayString = {};
  __severityIntToDisplayString[INFO_VAL] = INFO_DISPLAY_STR;
  __severityIntToDisplayString[CONFIRMATION_VAL] = CONFIRMATION_DISPLAY_STR;
  __severityIntToDisplayString[WARNING_VAL] = WARNING_DISPLAY_STR;
  __severityIntToDisplayString[ERROR_VAL] = ERROR_DISPLAY_STR;
  __severityIntToDisplayString[FATAL_VAL] = FATAL_DISPLAY_STR;

  // This map is used to provide the associated resource bundle key. These ADFInfoBundle keys
  // are special cased in getResourceStringImpl(), and will always return a displayable value.
  var __severityDisplayStringBundleKey = {};
  __severityDisplayStringBundleKey[INFO_DISPLAY_STR] = "LBL_INFO_DISPLAY_STR";
  __severityDisplayStringBundleKey[CONFIRMATION_DISPLAY_STR] = "LBL_CONFIRMATION_DISPLAY_STR";
  __severityDisplayStringBundleKey[WARNING_DISPLAY_STR] = "LBL_WARNING_DISPLAY_STR";
  __severityDisplayStringBundleKey[ERROR_DISPLAY_STR] = "LBL_ERROR_DISPLAY_STR";
  __severityDisplayStringBundleKey[FATAL_DISPLAY_STR] = "LBL_FATAL_DISPLAY_STR";

  amx.validationsUnsetListEl = adf.mf.internal.el.parser.parse("#{validationScope.unsetList}");
  amx.validationsInvalidListEl = adf.mf.internal.el.parser.parse("#{validationScope.invalidList}");

  // this keeps track of the groups that have been validated
  // so that we know if we should be showing the required failures
  // or not
  var __validatedGroups = {};

  // this keeps track of whether or not we are currently validating group[s]
  var __isValidating = false;

  var validationExName = "oracle.adfmf.framework.exception.ValidationException";
  var batchValidationExName = "oracle.adfmf.framework.exception.BatchValidationException";

  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "validationGroup").prototype.render = function(amxNode)
  {
    var rootElement = document.createElement("div");
    var descendants = amxNode.renderDescendants();
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      rootElement.appendChild(descendants[i]);
    }
    return rootElement;
  };

  // data change handler for when the validationList changes
  function validationsDataChangeHandler(el)
  {
    updateValidationMessages();
  }

  /**
   * This method will go through all of the items in validationData and extract
   * the current validation exceptions for the group id and add them to the
   * error message box.
   * @param validationData the data that contains all of the validation info
   * @param groupId the current group id
  */
  function updateValidationMessagesByGroupId(validationData, groupId)
  {
      var groupValidationData = validationData[groupId];
      if (groupValidationData === undefined)
      {
        return;
      }

      var groupInvalid = groupValidationData.invalid;
      for (item in groupInvalid)
      {
        var arrayList = groupInvalid[item];
        for(var index in arrayList)
        {
          var nvp = arrayList[index];
          adf.mf.api.amx.addMessage(nvp.name.toLowerCase(), nvp.value, null, null);
        }
      }

      // check for required failures
      var groupRequired = groupValidationData.required;
      for (item in groupRequired)
      {
        var text = groupRequired[item];
        adf.mf.api.amx.addMessage(ERROR_STR, text, null, null);
      }
  }

  /**
   * This method builds up the validation data given an array
   * of group ids to check. If any validation errors are present,
   * then they will be added to the error message box
   * @param groupsToCheck  the array of groups to check for validation errors
  */
  function updateValidationMessages(groupsToCheck)
  {
    if (amx.isValidating())
    {
      return;
    }

    // get all of the groups and all of the messages
    var validationGroupElements = document.getElementsByClassName("amx-validationGroup");

    if (validationGroupElements.length == 0)
    {
      // do nothing
      return;
    }

    var always =
      function(validationData)
      {
        // now show the message box
        if (groupsToCheck !== undefined && groupsToCheck != null && groupsToCheck.length > 0)
        {
          for (var i = 0; i < groupsToCheck.length; ++i)
          {
            var groupId = groupsToCheck[i];

            var groupValidationData = validationData[groupId];
            if (groupValidationData === undefined)
            {
              // no validation data present
              continue;
            }

            updateValidationMessagesByGroupId(validationData, groupId);
          }
        }
      };
    amx.buildValidationData(validationGroupElements).then(always, always);
  }

  function getCurrentPageGroup(id)
  {
    var thisPage = adf.mf.internal.controller.ViewHistory.peek().viewId;
    if (__validatedGroups[thisPage] === undefined)
    {
      __validatedGroups[thisPage] = {};
    }

    return __validatedGroups[thisPage];
  }

  function setGroupValidated(id)
  {
    var pageGroups = getCurrentPageGroup(id);
    pageGroups[id] = true;
  }

  function isGroupValidated(id)
  {
    var pageGroups = getCurrentPageGroup(id);
    return pageGroups[id] === true;
  }


  // detect if the xmlNode is rendered, visible, and shown on the screen
  amx.isNodeRendered = function(amxNode)
  {
    if (!amxNode.isReadyToRender())
    {
      return false;
    }

    // TODO: this has no place in a global function:
    if (amxNode.getTag().getNsPrefixedName() == adf.mf.api.amx.AmxTag.NAMESPACE_AMX+":popup")
    {
      if (amxNode.getAttribute("_renderPopup"))
      {
        return true;
      }

      return false;
    }

    var attr = amxNode.getAttribute("visible");
    if(typeof attr !== "undefined")
    {
      if(adf.mf.api.amx.isValueFalse(attr))
      {
        return false;
      }
    }

    return true;
  };

  function setValidationWatchData(groupId, amxNode, watchData, addRequired)
  {
    var attributeValue = amxNode.__getAttributeToValidate();
    if (attributeValue == null)
    {
      return;
    }

    var attributeValueEl = amxNode.getAttributeExpression(attributeValue, true);

    if (amx.containsELExpressions(attributeValueEl))
    {
      if (watchData.el[attributeValueEl] === undefined)
      {
        watchData.el[attributeValueEl] = [];
      }

      if(watchData.el[attributeValueEl].indexOf(groupId) < 0)
      {
        watchData.el[attributeValueEl].push(groupId);
      }
    }

    // now check to see if this is required
    if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("required")) == false)
    {
      return;
    }

    var nodeValue = amxNode.getAttribute(attributeValue);
    // if the returned value is an array, then we will validate the length
    if (Array.isArray(nodeValue))
    {
      if (nodeValue.length > 0)
      {
        return;
      }
    }
    else if (amx.getTextValue(nodeValue) !== "")
    {
      return;
    }

    if (addRequired == false)
    {
      // this group has not been validated yet, so disregard
      return;
    }

    var tag = amxNode.getTag();
    var key;
    var nsPrefixedName = tag.getNsPrefixedName();
    if (nsPrefixedName == adf.mf.api.amx.AmxTag.NAMESPACE_AMX+":selectOneChoice" ||
        nsPrefixedName == adf.mf.api.amx.AmxTag.NAMESPACE_AMX+":selectManyChoice")
    {
      key = "MSG_MAKE_A_SELECTION";
    }
    else
    {
      key = "MSG_ENTER_A_VALUE";
    }

    var msg = adf.mf.resource.getInfoString("AMXInfoBundle", key);
    var label = amxNode.getAttribute("label");
    if (label == null)
    {
      label = "";
    }
    var text = label + ": " + msg;

    if (watchData.required[groupId] === undefined)
    {
      watchData.required[groupId] = [];
    }

    watchData.required[groupId].push(text);
  }

  // add to the passed in list an el expressions that this node
  // and this node's descendants are watching
  function buildValidationWatchData(groupId, domElement, watchData, addRequired)
  {
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
        var childNodes = domElement.childNodes;

        if (childNodes && childNodes.length > 0)
        {
          var childPromiseArray = [];
          // for each node
          for (var i = 0; i < childNodes.length; ++i)
          {
            var childNode = childNodes[i];

            // only check for node info if this is an amx-node
            // if not, just assume this is a container for actual amx-nodes
            if (childNode.nodeType == 1/*ELEMENT_NODE*/ && childNode.classList.contains("amx-node"))
            {
              var amxNode = adf.mf.internal.amx._getNonPrimitiveElementData(childNode, "amxNode");
              if (amxNode === undefined)
              {
                continue;
              }

              if (amx.isNodeRendered(amxNode) == false)
              {
                continue;
              }

              setValidationWatchData(groupId, amxNode, watchData, addRequired);
            }

            var childPromise = buildValidationWatchData(groupId, childNode, watchData, addRequired);
            childPromiseArray.push(childPromise);
          }
          adf.mf.internal.BasePromise.all(childPromiseArray).then(
            function()
            {
              resolve();
            });
        }
        else
        {
          resolve();
        }
      });
  }

  // build a list of all the el expressions that this group/array of groups are watching
  function buildValidationGroupWatchData(groupElements, isValidating)
  {
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
        var arrayOfPromises = [];
        var watchData = {
          el: {},
          required: {}
        };

        for (var i = 0; i < groupElements.length; ++i)
        {
          var groupElement = groupElements[i];
          if (groupElement.length != null)
          {
            groupElement = groupElement[0];
          }
          var addRequired;
          var id = adf.mf.internal.amx._getNonPrimitiveElementData(groupElement, "amxNode").getId();
          if (isValidating == true)
          {
            // add this to the list so that buildElWatchArray will return any required
            // failures for this group
            setGroupValidated(id);
            addRequired = true;
          }
          else
          {
            addRequired = isGroupValidated(id);
          }

          arrayOfPromises.push(buildValidationWatchData(id, groupElement, watchData, addRequired));
        }

        adf.mf.internal.BasePromise.all(arrayOfPromises).then(
          function()
          {
            resolve(watchData);
          });
      });
  }

  function getValidationDataForGroup(validationData, groupId, watchData)
  {
    if (validationData[groupId] === undefined)
    {
      validationData[groupId] = {
        invalid: [],
        required: []
      };
    }

    return validationData[groupId];
  }

  function buildValidationDataInternal(groupElements, isValidating, validationWatchData)
  {
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
        if (groupElements.length == 0)
        {
          // nothing to do here, so just resolve it
          resolve();
          return;
        }
        amx.getElValue(amx.validationsInvalidListEl).then(
          function(requestAndResponse)
          {
            var response = requestAndResponse[1];
            var invalidList = response[0].value;
            var elWatchPromise =
              new adf.mf.internal.BasePromise(
                function(elWatchPromiseResolve, elWatchPromiseReject)
                {
                  if (validationWatchData == null)
                  {
                    var always = function(watchData)
                      {
                        validationWatchData = watchData;
                        elWatchPromiseResolve();
                      };
                    buildValidationGroupWatchData(groupElements, isValidating).then(always, always);
                  }
                  else
                  {
                    elWatchPromiseResolve();
                  }
                });

            var elWatchPromiseAlways = function()
            {
              var hasError = false;
              var hasWarning = false;
              var validationData = {};

              for(var item in validationWatchData.required)
              {
                if(validationWatchData.required.hasOwnProperty(item))
                {
                  hasError = true;

                  var groupValidationData = getValidationDataForGroup(validationData, item, validationWatchData);
                  // add all of these to the required list
                  groupValidationData.required = validationWatchData.required[item];
                }
              }

              // iterate through the invalid el expressions and determine if
              // the expression is in the list of el expressions that are
              // defined in descendants of the validationGroup tag
              for(var item in invalidList)
              {
                if(invalidList.hasOwnProperty(item))
                {
                  var elInfo = validationWatchData.el[item];
                  if(elInfo === undefined)
                  {
                    // not in the list
                    continue;
                  }

                  var arrayList = invalidList[item];
                  if (hasError == false)
                  {
                    for(var index in arrayList)
                    {
                      var nvp = arrayList[index];
                      if (nvp.name == ERROR_UPPER_STR)
                      {
                        hasError = true;
                        break;
                      }

                      if (nvp.name == WARNING_UPPER_STR)
                      {
                        hasWarning = true;
                      }
                    }
                  }

                  for (var group in elInfo)
                  {
                    var groupId = elInfo[group];
                    var groupValidationData = getValidationDataForGroup(validationData, groupId, validationWatchData);
                    groupValidationData.invalid.push(arrayList);
                  }
                }
              }

              if (hasError)
              {
                // let the caller know that navigation should fail
                reject(validationData);
                return;
              }

              // succeeded, but with possible warnings, so send in the data array
              resolve(validationData);
            };

            elWatchPromise.then(elWatchPromiseAlways, elWatchPromiseAlways);
          },
          function(requestAndResponse)
          {
            // failed to retrieve the invalid list - allow navigation to proceed
            resolve();
          });
      });
  }

  amx.buildValidationData = function(elementArray)
  {
    return buildValidationDataInternal(elementArray, false, null);
  };

  function getGroupsById(domElement)
  {
    var popupElement = _getClosestAncestorByClassName(domElement, "amx-popup");
    var validationGroupElements;
    if (popupElement != null)
    {
      // we are inside a popup, so we need to get a list of all of the groups in this popup
      validationGroupElements = popupElement.getElementsByClassName("amx-validationGroup");
    }
    else
    {
      validationGroupElements = document.getElementsByClassName("amx-validationGroup");
    }

    var groupsById = {};
    for (var i = 0; i < validationGroupElements.length; ++i)
    {
      var groupElement = validationGroupElements[i];
      var amxNode = adf.mf.internal.amx._getNonPrimitiveElementData(groupElement, "amxNode");
      var id = amxNode.getId();
      groupsById[id] = groupElement;
    }

    return groupsById;
  }

  // get the list of all of the groups that this control validates against
  function getValidationGroupList(domElement)
  {
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
        var amxNode = adf.mf.internal.amx._getNonPrimitiveElementData(domElement, "amxNode");
        if (amxNode == null && adf.mf.environment.profile.mockData)
        {
          // Hosted CompGallery will experience this when changing row selection (e.g. listItemStyles.amx)
          resolve([]);
          return;
        }
        var tag = amxNode.getTag();
        var children = tag.getChildren(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "validationBehavior");
        var len = children.length;
        var groups = [];

        if (len > 0)
        {
          var groupIdArray = [];
          var propPromises = [];

          for (var i = 0; i < len; ++i)
          {
            var subTag = children[i];

            var disabledEl = subTag.getAttribute("disabled");
            if (disabledEl != null)
            {
              var propPromise = new adf.mf.internal.BasePromise(
                function(propPromiseResolve, propPromiseReject)
                {
                  amx.getElValue(disabledEl)
                    .then(
                      function(requestAndResponse)
                      {
                        var response = requestAndResponse[1];
                        var resp = response[0];
                        if (adf.mf.api.amx.isValueTrue(resp.value))
                        {
                          propPromiseResolve();
                          return;
                        }
                        var groupId = subTag.getAttribute("group");
                        if (groupIdArray.indexOf(groupId) < 0)
                        {
                          groupIdArray.push(groupId);
                        }
                        propPromiseResolve();
                      },
                      propPromiseResolve);
                  });

              propPromises.push(propPromise);
            }
            else
            {
              var groupId = subTag.getAttribute("group");
              if (groupIdArray.indexOf(groupId) < 0)
              {
                groupIdArray.push(groupId);
              }
            }
          }

          adf.mf.internal.BasePromise.all(propPromises).then(
            function()
            {
              var groupsById = getGroupsById(domElement);
              for (var i = 0; i < groupIdArray.length; ++i)
              {
                var group = groupsById[groupIdArray[i]];
                if (typeof group !== "undefined")
                {
                  groups.push(group);
                }
              }

              resolve(groups);
            });
        }
        else
        {
          resolve(groups);
        }
      }, true /* needed for jQuery-like callbacks without timeouts */);
  }

  amx.requiredControlValueChanged = function(validationGroup)
  {
    if (amx.isValidating())
    {
      return;
    }

    // mark this group as validated
    var amxNode = adf.mf.internal.amx._getNonPrimitiveElementData(validationGroup, "amxNode");
    if (amxNode)
    {
      setGroupValidated(amxNode.getId());
      updateValidationMessages();
    }
  };

  function validateBegin()
  {
    __isValidating = true;
  }

  function validateEnd(groupElements, validationData)
  {
    __isValidating = false;

    if (groupElements === undefined || groupElements.length == 0)
    {
      // no groups were validated, exit early
      return;
    }

    var groupsToCheck = [];

    if (validationData !== undefined)
    {
      // if the validationData is not undefined, then there was a failure
      // go through and create a list of the groups that may need a message box
      for (groupId in validationData)
      {
        if(validationData.hasOwnProperty(groupId) == false)
        {
          continue;
        }

        groupsToCheck.push(groupId);
      }
    }

    updateValidationMessages(groupsToCheck);
  }

  amx.isValidating = function()
  {
    return __isValidating;
  };

  function validateInternal(domElement)
  {
    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
        var always =
          function(groupElements)
          {
            // we now have the list of groups that we need to validate, so go
            // through them all and verify every el expressions is in the valid state
            if (groupElements.length == 0)
            {
              // everything is valid since there are no groups
              resolve(groupElements);
              return;
            }

            // make sure all of the unset values are validated
            amx.getElValue(amx.validationsUnsetListEl).then(
              function(requestAndResponse)
              {
                var response = requestAndResponse[1];
                var unsetList = response[0].value;
                // set this to null so that we only build up the node list when we want to
                // figure out if an item is valid or not
                var validationWatchData = null;
                var elToResolve = [];
                var unsetPromise =
                  new adf.mf.internal.BasePromise(
                    function(unsetPromiseResolve, unsetPromiseReject)
                    {
                      if (unsetList.length > 0)
                      {
                        buildValidationGroupWatchData(groupElements, true).then(function(watchData)
                        {
                          validationWatchData = watchData;
                          for (var i = 0; i < unsetList.length; ++i)
                          {
                            var item = unsetList[i];
                            if(validationWatchData.el[item] === undefined)
                            {
                              // not in the list
                              continue;
                            }

                            elToResolve.push(item);
                          }

                          if (elToResolve.length > 0)
                          {
                            amx.getElValue(elToResolve).then(
                              function(requestAndResponse)
                              {
                                var response = requestAndResponse[1];
                                // all the el expressions are resolved, so create an
                                // array of values to set
                                var setList = [];
                                // we might have more responses than just our requests, so make sure we handle that here
                                for (var i = 0; i < response.length; ++i)
                                {
                                  var item = response[i];
                                  if (elToResolve.indexOf(item.name) < 0)
                                  {
                                    // not part of what we requested
                                    continue;
                                  }

                                  setList.push({name:item.name, value:amx.getObjectValue(item.value)});
                                }
                                amx.setElValue(setList).then(
                                  function(requestAndResponse)
                                  {
                                    // success (but with possible failures), just continue
                                    // and check the invalid list later
                                    unsetPromiseResolve();
                                  },
                                  function(requestAndResponse)
                                  {
                                    // failure, just continue and check the invalid list later
                                    unsetPromiseResolve();
                                  });
                              },
                              function(requestAndResponse)
                              {
                                // failure, just continue and check the invalid list later
                                unsetPromiseResolve();
                              });
                          }
                          else
                          {
                            unsetPromiseResolve();
                          }
                        },
                        function()
                        {
                          unsetPromiseResolve();
                        });
                      }
                      else
                      {
                        unsetPromiseResolve();
                      }
                    });

                unsetPromise.then(
                  function()
                  {
                    buildValidationDataInternal(groupElements, true, validationWatchData).then(
                      function(validationData)
                      {
                        // we can navigate (may have warnings)
                        resolve([groupElements, validationData]);
                      },
                      function(validationData)
                      {
                        // we can NOT navigate
                        reject([groupElements, validationData]);
                      });
                  });
              },
              function(requestAndResponse)
              {
                // failed to retrieve the unset list - allow navigation to proceed
                resolve(groupElements);
              });
          };
        getValidationGroupList(domElement).then(always, always);
      }, true /* needed for jQuery-like callbacks without timeouts */);
  }

  /**
   * Use this when performing an operation like a navigation where you would want to prevent navigating
   * when there are unsatisfied validators (required or AMX validationBehavior).
   * The successCallback will be invoked if allowed to proceed.
   * @param {DOMNode} domNode the element whose associated validation is to be tested
   * @param {function} successCallback the function to invoke if the event should be accepted
   */
  adf.mf.api.amx.validate = function(domNode, successCallback)
  {
    amx.validate(domNode).then(function()
    {
      if (successCallback && adf.mf.api.amx.acceptEvent())
      {
        successCallback();
      }
    });
  };

  /**
   * Private, internal function.
   */
  amx.validate = function(domElement)
  {
    var perf = adf.mf.internal.perf.startMonitorCall("Validate node", adf.mf.log.level.FINER, "amx.validate");

    return new adf.mf.internal.BasePromise(function(resolve, reject)
      {
        validateBegin();
        validateInternal(domElement)
          .then(
            function(groupElementsAndValidationData)
            {
              var groupElements = groupElementsAndValidationData[0];
              validateEnd(groupElements);
              perf.stop();
              resolve();
            },
            function(groupElementsAndValidationData)
            {
              var groupElements = groupElementsAndValidationData[0];
              var validationData = groupElementsAndValidationData[1];
              validateEnd(groupElements, validationData);
              perf.stop();
              reject();
            });
      }, true /* needed for jQuery-like callbacks without timeouts */);
  };

  // register the data change handler
  adf.mf.api.addDataChangeListeners(amx.validationsInvalidListEl, validationsDataChangeHandler);

  //--------- ErrorHandler ---------//
  // taken from Trinidad.Core.js
  /**
   * Return true if the object or any of its prototypes'
   * are an instance of the specified object type.
   * @param {Object} obj the object instance
   * @param {Object} type the constructor function
   */
  function _instanceof(obj, type)
  {
    if (type == (void 0))
      return false;

    if (obj == (void 0))
      return false;

    while (typeof(obj) == "object")
    {
      if (obj.constructor == type)
        return true;

      // walk up the prototype hierarchy
      obj = obj.prototype;
    }

    return false;
  }

  /**
   * The is the home for all error handling. This gets registered as an error handler
   * in adf.mf.api.amx.loadTrinidadResources (amx-resource.js) and will extract the
   * relevant error information and call adf.mf.api.amx.addMessage
   *
   * @param request the channel request, can be null if this is called manually
   * @param response a JS Error instance, a TrConverterException or TrValidatorException instance,
   *                 or an exception in JSON form
  */
  adf.mf.internal.amx.errorHandlerImpl = function(request, response)
  {
    // detect if this is a known Trinidad error class
    if (_instanceof(response, window["TrConverterException"]) || _instanceof(response, window["TrValidatorException"]))
    {
      var facesMsg = response.getFacesMessage();
      var severity = facesMsg.getSeverity();
      var severityStr = ERROR_STR;
      if (severity == TrFacesMessage.SEVERITY_INFO)
      {
        severityStr = "info";
      }
      else if (severity == TrFacesMessage.SEVERITY_WARN)
      {
        severityStr = "warning";
      }
      else if (severity == TrFacesMessage.SEVERITY_ERROR)
      {
        severityStr = ERROR_STR;
      }
      else // if (severity == TrFacesMessage.SEVERITY_FATAL)
      {
        severityStr = "fatal";
      }
      adf.mf.api.amx.addMessage(severityStr, facesMsg.getDetail(), null, null);
      return;
    }

    // detect if this is a known js error class
    if (_instanceof(response, Error))
    {
      adf.mf.api.amx.addMessage(ERROR_STR, response.message, null, null);
      return;
    }

    // assume this is an exception from the channel
    var exceptionClassName = response[adf.mf.internal.api.constants.TYPE_PROPERTY];
    var isBatchValidation = (exceptionClassName == batchValidationExName);
    // check to see if we are in the process of validating all of the
    // el expressions contained in this group. We will go back and add
    // of the validation messages from the validationContext, so don't
    // add any that fire right now
    if (amx.isValidating())
    {
      if (isBatchValidation || exceptionClassName == validationExName)
      {
        return;
      }
    }

    if (isBatchValidation)
    {
      // loop through the the batch exceptions and add them one by one
      var batch = response.batch;
      if (batch !== undefined && batch != null)
      {
        for (var i = 0; i < batch.length; ++i)
        {
          addMessageFromException(batch[i]);
        }
      }
      return;
    }

    addMessageFromException(response);
  };

  function addMessageFromException(ex)
  {
    if (ex.exception)
      ex = ex.exception;
    var msg = ex.message;
    var severity = ex.severity;
    if (severity === undefined)
      severity = "fatal";
    adf.mf.api.amx.addMessage(severity == null ? "severe" : severity.toLowerCase(), msg, null, null);
  }

  /**
   * Adds a message to the message box (and shows it if it isn't already showing.
   * @param {string} severity the severity of the message (e.g. "fatal", "error", "warning", "confirmation", "info")
   * @param {string} summary the short title of the message (e.g. exception message)
   * @param {string} detail null or the optional long detail of the message (e.g. stack trace)
   * @param {string} clientId null or the optional client ID that uniquely identify which component instance the message should be associated with
   */
  adf.mf.api.amx.addMessage = function(severity, summary, detail, componentClientId)
  {
    messageBoxCreate().addItem(severity, summary, detail);
  };

  function severityStringToInt(severity)
  {
    var val = __severityStringToInt[severity];
    if (val == null)
    {
      val = ERROR_VAL;
    }

    return val;
  }

  function severityIntToDisplayString(severity)
  {
    var val = __severityIntToDisplayString[severity];
    if (val == null)
    {
      val = ERROR_DISPLAY_STR;
    }

    return val;
  }

  //--------- ErrorHandler ---------//

  /**
   * Get the child elements that have the specified class names.
   * @param {HTMLElement} parentElement the element whose children will be traversed
   * @param {Array.<String>} classNames the class names to search for
   * @param {boolean} searchInChildOrder whether to start looking at the first child then second, etc.
   * @return {Array} an array of found elements whose entries match the specified classNames order
   */
  function _getChildrenByClassNames(parentElement, classNames, searchInChildOrder)
  {
    var childNodes = parentElement.childNodes;
    var childNodeCount = childNodes.length;
    var classNameCount = classNames.length;
    var foundChildren = [];
    var foundCount = 0;
    if (searchInChildOrder === false) // start with the last index
    {
      for (var i = childNodeCount - 1; i >= 0 && foundCount < classNameCount; --i)
      {
        var child = childNodes[i];
        for (var j = 0; j < classNameCount; ++j)
        {
          if (child.nodeType == 1/*ELEMENT_NODE*/ && child.classList.contains(classNames[j]))
          {
            foundChildren[j] = child;
            ++foundCount;
            break; // done with this specific child
          }
        }
      }
    }
    else // start with the first index:
    {
      for (var i = 0; i < childNodeCount && foundCount < classNameCount; ++i)
      {
        var child = childNodes[i];
        for (var j = 0; j < classNameCount; ++j)
        {
          if (child.nodeType == 1/*ELEMENT_NODE*/ && child.classList.contains(classNames[j]))
          {
            foundChildren[j] = child;
            ++foundCount;
            break; // done with this specific child
          }
        }
      }
    }
    return foundChildren;
  }

  /**
   * Get the nearest ancestor element that has the specified class name (could be the specified element too).
   * @param {HTMLElement} startingElement the element (inclusive) to find the closest ancestor with the given className
   * @param {string} className the class name to search for
   * @return {HTMLElement} the found ancestor element whose or null if not found
   */
  function _getClosestAncestorByClassName(startingElement, className)
  {
    if (startingElement == null)
      return null;
    else if (startingElement.className == className)
      return startingElement;
    else
      return _getClosestAncestorByClassName(startingElement.parentNode, className);
  }

  //--------- MessageBox ---------//
  function MessageBox()
  {
  }

 /**
   * Creates or returns the header object as the first entry in the content.
  */
  MessageBox.prototype.getHeader = function()
  {
    var headerClassName = "amx-messages-header";
    // ake sure that the first item in the content is not a header
    var firstNode = this.contentElement.firstChild;
    var headerNode;
    if (firstNode == null ||
      firstNode.nodeType != 1 /*ELEMENT_NODE*/ ||
      !firstNode.classList.contains(headerClassName))
    {
      headerNode = document.createElement("div");
      headerNode.className = headerClassName;
      this.contentElement.parentNode.insertBefore(headerNode, this.contentElement);
    }
    else
    {
      headerNode = firstNode;
    }
    return headerNode;
  };

  /**
   * This updates the messagebox label if the type of message
   * is more severe than the current label severity
   * ("error" takes precedence over "warning")
   * @param type the severity of the message (e.g. "fatal", "error", "warning", "confirmation", "info")
   */
  MessageBox.prototype.setHeaderLabel = function(type)
  {
    var typeValue = severityStringToInt(type);

    if (this.headerValue == null || typeValue < this.headerValue)
    {
      this.headerValue = typeValue;
    }
    else
    {
      return;
    }

    // Ensure that we only have the most-severe header:
    var parentNode = this.contentElement.parentNode;
    var headers = parentNode.querySelectorAll(".amx-messages-header");
    for (var i=headers.length-1; i>=0; --i)
    {
      var oldHeader = headers[i];
      var oldValue = parseInt(oldHeader.getAttribute("data-value"), 10);
      if (oldValue >= this.headerValue)
      {
        adf.mf.api.amx.removeDomNode(oldHeader);
      }
    }

    var newHeader = severityIntToDisplayString(this.headerValue);
    var headerNode = this.getHeader();
    headerNode.setAttribute("data-value", this.headerValue);
    // remove the current message, if it exists
    headerNode.innerHTML = "";
    // now add the message label
    var labelNode = document.createElement("div");
    labelNode.className = "amx-messages-header-text";
    labelNode.textContent = adf.mf.resource.getInfoString(adf.mf.resource.ADFInfoBundleName, __severityDisplayStringBundleKey[newHeader]);
    labelNode.setAttribute("role", "heading");
    headerNode.appendChild(labelNode);
  };

  /**
   * This adds the passed in data to the current message box
   * Note: if the type of message is more severe than the current
   * label severity, it will be replace
   * ("error" takes precedence over "warning")
   * @param type the severity of the message (e.g. "fatal", "error", "warning", "confirmation", "info")
   * @param summary the error summary message
   * @param detail any extra detail to be shown to the user, or null
  */
  MessageBox.prototype.addItem = function(type, summary, detail)
  {
    this.setHeaderLabel(type);
    // for now, type can only be warning or error since we don't have graphics
    // for the other ones. So error will be "error" and "fatal" and all else
    // will be warnings
    var typeValue = severityStringToInt(type);
    var errorClass;
    switch (typeValue)
    {
      case INFO_VAL:
        errorClass = INFO_STR;
        break;
      case CONFIRMATION_VAL:
        errorClass = CONFIRMATION_STR;
        break;
      case WARNING_VAL:
        errorClass = WARNING_STR;
        break;
      default: // error and fatal
        errorClass = ERROR_STR;
    }
    var itemNode = document.createElement("div");
    itemNode.className = "amx-messages-item";
    itemNode.setAttribute("role", "listitem");
    var textItem1 = document.createElement("div");
    textItem1.className = "amx-messages-text amx-messages-text-" + errorClass + " amx-messages-" + errorClass;
    textItem1.textContent = summary;
    if (detail !== undefined && detail != null && detail != "")
    {
      textItem1.appendChild(document.createElement("br"));
      textItem1.appendChild(document.createTextNode(detail));
    }
    var prevMessagesItem = _getChildrenByClassNames(this.contentElement, ["amx-messages-item"], false)[0];
    var prevTextItem = null;
    if (prevMessagesItem != null)
      prevTextItem = _getChildrenByClassNames(prevMessagesItem, ["amx-messages-text"], false)[0];
    if (prevTextItem == null)
    {
      textItem1.classList.add("amx-messages-first");
    }
    else
    {
      prevTextItem.classList.remove("amx-messages-last");
    }
    // this is the last item
    textItem1.classList.add("amx-messages-last");
    itemNode.appendChild(textItem1);
    var icon = document.createElement("div");
    icon.className = "amx-messages-icon amx-messages-icon-" + errorClass;
    itemNode.appendChild(icon);
    this.contentElement.appendChild(itemNode);

    // now center the whole msg box vertically
    var messageBoxElement = this.messageBoxElement;
    var messageBoxComputedStyle = adf.mf.internal.amx.getComputedStyle(messageBoxElement);
    var messageBoxMarginTop = messageBoxComputedStyle.marginTop;
    var messageBoxMarginBottom = messageBoxComputedStyle.marginBottom;
    var messageBoxOuterHeight =
      messageBoxElement.offsetHeight +
      parseInt(messageBoxMarginTop, 10) +
      parseInt(messageBoxMarginBottom, 10);

    // In order to center the message box on the view, we need its height.
    // It is possible to display an error prior to displaying the first view so
    // in that case we should use the body height as a fallback.
    var bodyPageViews = document.getElementById("bodyPageViews");
    var firstViewContainer = _getChildrenByClassNames(bodyPageViews, ["amx-view-container"])[0];
    var viewElement = document.body;
    if (firstViewContainer != null)
      viewElement = _getChildrenByClassNames(firstViewContainer, ["amx-view"])[0];
    var viewHeight = viewElement.offsetHeight;

    var newTop;
    if (messageBoxOuterHeight < viewHeight)
    {
      newTop = (viewHeight - messageBoxOuterHeight)/2;
    }
    else
    {
      newTop = 0;
    }

    messageBoxElement.style.top = newTop + "px";
  };

  /**
   * Adds the footer than contains the OK button
  */
  MessageBox.prototype.addFooter = function(messageBoxContainer)
  {
    var footerNode = document.createElement("div");
    footerNode.className = "amx-messages-footer";
    var btnNode = document.createElement("div");
    btnNode.className = "amx-messages-btn amx-commandButton";
    // Adding WAI-ARIA Attribute for the message box commandButton role attribute
    btnNode.setAttribute("role", "button");
    var buttonLabel = document.createElement("div");
    buttonLabel.className = "amx-messages-btn-label amx-commandButton-label";

    // ADFInfoBundle[LBL_OK_DISPLAY_STR] is special cased in getResourceStringImpl(), and will always return a displayable value
    buttonLabel.textContent = adf.mf.resource.getInfoString(adf.mf.resource.ADFInfoBundleName, "LBL_OK_DISPLAY_STR");

    btnNode.appendChild(buttonLabel);
    footerNode.appendChild(btnNode);
    var mousedown = "mousedown";
    var mouseup = "mouseup";
    if (amx.hasTouch())
    {
      mousedown = "touchstart";
      mouseup = "touchend";
    }
    adf.mf.api.amx.addBubbleEventListener(btnNode, mousedown, function()
    {
      btnNode.classList.add("amx-selected");
    });
    adf.mf.api.amx.addBubbleEventListener(btnNode, mouseup, function()
    {
      btnNode.classList.remove("amx-selected");
    });
    adf.mf.api.amx.addBubbleEventListener(btnNode, "mouseout", function()
    {
      btnNode.classList.remove("amx-selected");
    });

    var extendedTarget = document.createElement("div");
    extendedTarget.className = "amx-extendedTarget";
    btnNode.appendChild(extendedTarget);

    messageBoxContainer.appendChild(footerNode);
    return btnNode;
  };

  /**
   * Creates the basic structure of this message box class
  */
  MessageBox.prototype.create = function()
  {
    var bodyPageViews = document.getElementById("bodyPageViews");
    var messageBoxElement = document.createElement("div");
    messageBoxElement.id = "amxMessageBox";
    // make sure this responds to dragging for scrolling purposes
    adf.mf.api.amx.enableScrolling(messageBoxElement);
    messageBoxElement.classList.add("messageBox");
    var messageBoxScreen = document.createElement("div");
    messageBoxScreen.className = "transparentScreen messageBoxScreen";
    bodyPageViews.appendChild(messageBoxScreen);
    bodyPageViews.appendChild(messageBoxElement);
    adf.mf.internal.amx._setNonPrimitiveElementData(messageBoxElement, "messageBox", this);
    var messageBoxObject = this;
    this.e = messageBoxElement;
    this.screen = messageBoxScreen;
    messageBoxElement.style.display = "none";
    var messageBoxContainer = document.createElement("div");
    messageBoxContainer.className = "messageBoxContainer";
    // Adding WAI-ARIA Attribute for role the message container div
    messageBoxContainer.setAttribute("role", "alertdialog");
    messageBoxElement.appendChild(messageBoxContainer);
    var messageBoxContent = document.createElement("div");
    messageBoxContent.className = "messageBoxContent";
    messageBoxContent.setAttribute("role", "list");
    messageBoxContainer.appendChild(messageBoxContent);
    this.contentElement = messageBoxContent;
    this.messageBoxElement = messageBoxElement;
    var okButton = this.addFooter(messageBoxContainer);

    /*adf.mf.api.amx.addBubbleEventListener(messageBoxScreen, "tap", function()
    {
      // this is always modal for now
      // messageBox.hide();
    });*/

    adf.mf.api.amx.addBubbleEventListener(okButton, "tap", function(event)
      {
        // Eat the event since this button is handling it:
        event.preventDefault();
        event.stopPropagation();

        // Delay the DOM removal so that the event eating doesn't fail to trigger a focus
        // on some input component behind this popup (we don't want the input's keyboard to appear):
        setTimeout(function()
        {
          messageBoxObject.hide();
        },
        0);
      });

    return messageBoxElement;
  };

  /**
   * Shows the message box to the user
  */
  MessageBox.prototype.show = function()
  {
    var messageBoxElement = this.e;
    var messageBoxScreen = this.screen;

    messageBoxScreen.style.display = "";
    messageBoxElement.style.display = "";

    // All view containers are now hidden from screen readers (we can't just
    // look for the first one because an error could occur while transitioning):
    var foundViewContainers = document.getElementsByClassName("amx-view-container");
    for (var i=0, elementCount=foundViewContainers.length; i<elementCount; i++)
    {
      foundViewContainers[i].setAttribute("aria-hidden", "true"); // Note: toggling this doesn't work on iOS 5 but does in iOS 6
    }
  };

  /**
   * Hides the message box from the user
  */
  MessageBox.prototype.hide = function()
  {
    var messageBoxElement = this.e;
    var messageBoxScreen = this.screen;

    var messageBoxContent = this.contentElement;
    messageBoxContent.innerHTML = "";

    adf.mf.api.amx.removeDomNode(messageBoxElement);
    adf.mf.api.amx.removeDomNode(messageBoxScreen);

    // All view containers are no longer hidden from screen readers (we can't just
    // look for the first one because an error could occur while transitioning):
    var foundViewContainers = document.getElementsByClassName("amx-view-container");
    for (var i=0, elementCount=foundViewContainers.length; i<elementCount; i++)
    {
      foundViewContainers[i].setAttribute("aria-hidden", "false"); // Note: toggling this doesn't work on iOS 5 but does in iOS 6
    }
  };

  function messageBoxCreate()
  {
    var messageBoxElement = null;
    var messageBoxObject = null;
    var foundMessageBoxElements = document.getElementsByClassName("messageBox");
    if (foundMessageBoxElements.length > 0)
    {
      messageBoxElement = foundMessageBoxElements[0];
      messageBoxObject = adf.mf.internal.amx._getNonPrimitiveElementData(messageBoxElement, "messageBox");
    }
    else
    {
      messageBoxObject = new MessageBox();
      messageBoxElement = messageBoxObject.create();
    }
    messageBoxObject.show();
    return messageBoxObject;
  };
  //--------- /MessageBox ---------//
})();
