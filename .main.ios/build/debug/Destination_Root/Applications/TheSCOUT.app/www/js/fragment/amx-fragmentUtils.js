/* Copyright (c) 2013, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ---------- fragment/amx-fragmentUtils.js ------------- */
/* ------------------------------------------------------ */

(function()
{
  adf.mf.internal.amx.fragment = {};

  /**
   * XML namespace for the fragment meta-data
   */
  var FRAGMENT_XML_NS = "http://xmlns.oracle.com/adf/mf/amx/fragment";
  adf.mf.internal.amx.fragment.FRAGMENT_XML_NS = FRAGMENT_XML_NS;

  /**
   * Retrieves the owning fragment AMX node for a given AMX node
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the AMX node to find the closest fragment node
   * @return {adf.mf.api.amx.AmxNode|null} the fragment node or null if not found
   */
  adf.mf.internal.amx.fragment.findFragmentAmxNode = function(
    amxNode)
  {
    // The node may be in a facet of another fragment. As such, it is not enough to check for
    // the parent fragment AMX node. We can do this by finding the parent fragmentDef AMX node and
    // getting its parent.
    var fragmentDef = amxNode.findAncestorByTag(
      adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
      "fragmentDef");

    return fragmentDef == null ? null : fragmentDef.getParent();
  };

  /**
   * Utility function to look for a child XML tag by a given name and return its
   * text content if found.
   * @param {adf.mf.api.amx.AmxTag} parentTag the XML tag to look in for the child
   * @param {string} childTagName the name of the child tag to look for
   * @return {string|undefined} the text content if a child was found, undefined otherwise
   */
  function getTagTextValue(
    parentTag,
    childTagName)
  {
    var childTags = parentTag.getChildren(FRAGMENT_XML_NS, childTagName);
    return childTags.length == 0 ? undefined : childTags[0].getTextContent();
  }

  /* ------------------------------------------------------ */
  /* ---------------------- Objects ----------------------- */
  /* ------------------------------------------------------ */

  /* ------------------------------------------------------ */
  /* -------------- AttributeMetaDataHolder --------------- */
  /* ------------------------------------------------------ */
  function AttributeMetaDataHolder(metaDataTag)
  {
    this.Init(metaDataTag);
  }

  adf.mf.internal.amx.fragment.AttributeMetaDataHolder = AttributeMetaDataHolder;
  adf.mf.api.AdfObject.createSubclass(
    adf.mf.internal.amx.fragment.AttributeMetaDataHolder,
    adf.mf.api.AdfObject,
    "adf.mf.internal.amx.fragment.AttributeMetaDataHolder");

  AttributeMetaDataHolder.prototype.Init = function(metaDataTag)
  {
    AttributeMetaDataHolder.superclass.Init.call(this);

    this._attributes = {};
    this._attributeLists = {};

    // Parse attributes
    var attributeTags = metaDataTag.getChildren(
      FRAGMENT_XML_NS,
      "attribute");

    for (var a = 0, numAttrs = attributeTags.length; a < numAttrs; a++)
    {
      var attributeMetaData = new AttributeMetaData(attributeTags[a]);

      this._attributes[attributeMetaData.name] = attributeMetaData;
    }

    // Parse attribute lists
    var attributeListTags = metaDataTag.getChildren(
      FRAGMENT_XML_NS,
      "attribute-list");

    for (var l = 0, numAttrLists = attributeListTags.length; l < numAttrLists; l++)
    {
      var attributeListMetaData = new AttributeListMetaData(attributeListTags[l]);

      this._attributeLists[attributeListMetaData.name] = attributeListMetaData;
    }
  };

  AttributeMetaDataHolder.prototype.getAttributeMetaData = function(name)
  {
    return this._attributes[name];
  };

  AttributeMetaDataHolder.prototype.getAttributeListMetaData = function(name)
  {
    return this._attributeLists[name];
  };

  /**
   * Sets up the context for a tag instance that contains attribute tag instances
   *
   * @param {adf.mf.internal.amx.AmxTagInstance|adf.mf.api.amx.AmxNode} parentNodeOrTagInstance the
   *        AMX node or tag instance containing attribute tag instances
   * @return {object} object to pass to the tearDownContext method
   */
  AttributeMetaDataHolder.prototype.setupContext = function(
    parentNodeOrTagInstance)
  {
    var processedAttributes = {};
    var amxNode;
    var attributeTagInstances;
    var elReplacements = {};
    var variableNames = [];
    var expression;
    var hasElReplacements = false;
    var attributeMetaData;
    var attributeListTagInstances = null;
    var validateAttributeLists = !parentNodeOrTagInstance.getAttribute("_attrListsValidated");

    if (parentNodeOrTagInstance instanceof adf.mf.api.amx.AmxNode)
    {
      amxNode = parentNodeOrTagInstance;
      attributeTagInstances = amxNode.__getTagInstances(adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
        "attribute");

      if (validateAttributeLists)
      {
        attributeListTagInstances = amxNode.__getTagInstances(adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
          "attributeList");

        // Only validate once
        amxNode.setAttributeResolvedValue("_attrListsValidated", true);
      }
    }
    else
    {
      amxNode = parentNodeOrTagInstance.getParentAmxNode();
      attributeTagInstances = parentNodeOrTagInstance.getChildren(
        adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "attribute");
      if (validateAttributeLists)
      {
        attributeListTagInstances = parentNodeOrTagInstance.getChildren(
          adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "attributeList");

        // Only validate once
        parentNodeOrTagInstance.setAttribute("_attrListsValidated", true);
      }
    }

    if (validateAttributeLists && attributeListTagInstances)
    {
      for (var al = 0, numAttributeLists = attributeListTagInstances.length;
        al < numAttributeLists; ++al)
      {
        var attributeListTagInstance = attributeListTagInstances[al];
        var listName = attributeListTagInstance.getAttribute("name");
        var attributeListMetaData = this.getAttributeListMetaData(listName);
        if (attributeListMetaData == null)
        {
          throw new Error(adf.mf.resource.getInfoString("AMXErrorBundle",
            "ERROR_NO_ATTRIBUTE_LIST_DEFINED", listName));
        }
      }
    }

    for (var ati = 0, numAttrTagInstances = attributeTagInstances.length;
      ati < numAttrTagInstances;
      ++ati)
    {
      var attributeTagInstance = attributeTagInstances[ati];
      var attributeName = attributeTagInstance.getAttribute("name");

      processedAttributes[attributeName] = true;
      attributeMetaData = this.getAttributeMetaData(attributeName);

      if (attributeMetaData == null)
      {
        throw new Error(adf.mf.resource.getInfoString("AMXErrorBundle",
          "ERROR_FRAGMENT_ATTRIBUTE_NOT_DEFINED", attributeName));
      }

      attributeMetaData.validateTagInstance(attributeTagInstance);
      expression = attributeTagInstance.getAttributeExpression("value");

      var attributeValue = null;

      // See if this attribute has a default value
      if (attributeMetaData.defaultValue !== undefined)
      {
        // If there is a default value, then we need to check if the value is available or not
        // to know if the default should be used instead.
        attributeValue = attributeTagInstance.getAttribute("value");

        // If undefined, the default will not be used as it means that the value has not yet
        // been fetched and we do not yet know if the default should be used. On the other hand,
        // if the value is null and there is no expression, then the default should be used.
        var useDefault = attributeValue === null ||
          (attributeValue == null && expression == null);

        // Use a default value
        if (useDefault)
        {
          // See if the default value is an EL expression
          if (adf.mf.api.amx.AmxTag.__isELExpression(attributeMetaData.defaultValue))
          {
            // Perform any EL replacements in case this fragment is nested
            expression = adf.mf.api.amx.AmxNode.__performElSubstitutions(
              attributeMetaData.defaultValue);
          }
          else
          {
            attributeValue = attributeMetaData.defaultValue;
          }
        }
      }
      // See if the value is an expression, if not, then we can get the static value
      else if (expression == null)
      {
        attributeValue = attributeTagInstance.getAttribute("value");
      }

      if (expression != null)
      {
        // Value is non-null and is an EL expression, so perform EL replacement
        elReplacements[attributeName] = expression;
        hasElReplacements = true;
      }
      else
      {
        variableNames.push(attributeName);
        adf.mf.api.pushVariable(attributeName, attributeValue);
      }
    }

    // Process non-provided attributes
    for (var attributeName in this._attributes)
    {
      if (!processedAttributes[attributeName])
      {
        attributeMetaData = this._attributes[attributeName];
        attributeMetaData.validateTagInstance(null);

        if (attributeMetaData.defaultValue === undefined)
        {
          variableNames.push(attributeName);
          adf.mf.api.pushVariable(attributeName, adf.mf.api.OptionalFragmentArgument);
        }
        else if (adf.mf.api.amx.AmxTag.__isELExpression(attributeMetaData.defaultValue))
        {
          // Perform any EL replacements in case this fragment is nested
          elReplacements[attributeName] = adf.mf.api.amx.AmxNode.__performElSubstitutions(
            attributeMetaData.defaultValue);
          hasElReplacements = true;
        }
        else
        {
          variableNames.push(attributeName);
          adf.mf.api.pushVariable(attributeName, attributeMetaData.defaultValue);
        }
      }
    }

    if (hasElReplacements)
    {
      amxNode.__pushElReplacements(elReplacements);
    }

    return {
      "hasElReplacements": hasElReplacements,
      "elReplacements": elReplacements,
      "variableNames": variableNames,
      "amxNode": amxNode
    };
  };

  /**
   * Tear down the context
   *
   * @param {object} setupReturnValue the return value from setupContext
   */
  AttributeMetaDataHolder.prototype.tearDownContext = function(
    setupReturnValue)
  {
    if (setupReturnValue["hasElReplacements"])
    {
      setupReturnValue["amxNode"].__popElReplacements();
    }

    var variableNames = setupReturnValue["variableNames"];
    for (var v = 0, numVars = variableNames.length; v < numVars; ++v)
    {
      adf.mf.api.popVariable(variableNames[v]);
    }
  };

  /* ------------------------------------------------------ */
  /* ------------------ FragmentMetaData ------------------ */
  /* ------------------------------------------------------ */
  function FragmentMetaData(
    fragmentMetaDataTag)
  {
    this.Init(fragmentMetaDataTag);
  }

  adf.mf.internal.amx.fragment.FragmentMetaData = FragmentMetaData;
  adf.mf.api.AdfObject.createSubclass(
    adf.mf.internal.amx.fragment.FragmentMetaData,
    adf.mf.internal.amx.fragment.AttributeMetaDataHolder,
    "adf.mf.internal.amx.fragment.FragmentMetaData");

  FragmentMetaData.prototype.Init = function(fragmentMetaDataTag)
  {
    FragmentMetaData.superclass.Init.call(this, fragmentMetaDataTag);

    this._facets = [];
    this._popups = {};

    var facetTags = fragmentMetaDataTag.getChildren(
      FRAGMENT_XML_NS,
      "facet");

    for (var f = 0, numFacets = facetTags.length; f < numFacets; ++f)
    {
      this._facets[getTagTextValue(facetTags[f], "facet-name")] = true;
    }

    var popupTags = fragmentMetaDataTag.getChildren(
      FRAGMENT_XML_NS,
      "popup");

    for (var p = 0, numPopups = popupTags.length; p < numPopups; ++p)
    {
      var popupTag = popupTags[p];
      var popupId = getTagTextValue(popupTag, "popup-id");
      var ref = getTagTextValue(popupTag, "ref");

      this._popups[popupId] = ref == null ? true : ref;
    }
  };

  FragmentMetaData.prototype.hasExportedPopup = function(popupId)
  {
    return this._popups[popupId] != null;
  };

  FragmentMetaData.prototype.getExportedPopupReference = function(popupId)
  {
    var value = this._popups[popupId];
    return value === true ? null : value;
  };

  FragmentMetaData.prototype.validateFacets = function(amxNode)
  {
    var facetTags = amxNode.getTag().getChildrenFacetTags();

    for (var t = 0, numTags = facetTags.length; t < numTags; ++t)
    {
      var facetTag = facetTags[t];
      var facetName = facetTag.getAttribute("name");

      if (!this._facets[facetName])
      {
        throw new Error(adf.mf.resource.getInfoString("AMXErrorBundle",
          "ERROR_FRAGMENT_FACET_NOT_DEFINED", facetName));
      }
    }
  };

  FragmentMetaData.prototype.storeMetaData = function(fragmentAmxNode)
  {
    fragmentAmxNode.setAttributeResolvedValue("_fragmentMetaData", this);
  };

  FragmentMetaData.getMetaData = function(fragmentAmxNode)
  {
    return fragmentAmxNode.getAttribute("_fragmentMetaData");
  };

  /* ------------------------------------------------------ */
  /* ----------------- AttributeMetaData ------------------ */
  /* ------------------------------------------------------ */
  /**
   * Object to store attribute meta-data
   *
   * @param {adf.mf.api.amx.AmxTag} attributeTag the XML tag for the attribute meta-data
   */
  function AttributeMetaData(
    attributeTag)
  {
    this.Init(attributeTag);
  }

  adf.mf.internal.amx.fragment.AttributeMetaData = AttributeMetaData;
  adf.mf.api.AdfObject.createSubclass(
    adf.mf.internal.amx.fragment.AttributeMetaData,
    adf.mf.api.AdfObject,
    "adf.mf.internal.amx.fragment.AttributeMetaData");

  AttributeMetaData.prototype.Init = function(attributeTag)
  {
    AttributeMetaData.superclass.Init.call(this);

    this.name = getTagTextValue(attributeTag, "attribute-name");

    var required = getTagTextValue(attributeTag, "required");
    this.required = required != null && adf.mf.api.amx.isValueTrue(required);

    this.defaultValue = getTagTextValue(attributeTag, "default-value");
  };

  AttributeMetaData.prototype.validateTagInstance = function(
    attributeTagInstance)
  {
    // Bypass validation when run it DT
    if (adf.mf.environment.profile.dtMode)
    {
      return;
    }

    if (this.required && this.defaultValue === undefined)
    {
      var valid = attributeTagInstance != null;
      if (valid && !attributeTagInstance.getAttribute("_validated"))
      {
        var value = attributeTagInstance.getAttribute("value");
        if (value === undefined)
        {
          // If the value is undefined then the value has not yet been fetched, so we are not
          // yet able to validate the value. So wait until a future call before validating
          // the attribute tag
          return;
        }

        if (value == null)
        {
          valid = false;
        }

        attributeTagInstance.setAttribute("_validated", true);
      }

      if (!valid)
      {
        throw new Error(adf.mf.resource.getInfoString("AMXErrorBundle",
          "ERROR_FRAGMENT_REQUIRED_ATTRIBUTE_MISSING", this.name));
      }
    }
  };

  /* ------------------------------------------------------ */
  /* --------------- AttributeListMetaData ---------------- */
  /* ------------------------------------------------------ */
  /**
   * Object to store meta-data on attribute lists
   *
   * @param {adf.mf.api.amx.AmxTag} attributeListTag the XML tag for the attribute-list meta-data
   */
  function AttributeListMetaData(
    attributeListTag)
  {
    this.Init(attributeListTag);
  }

  adf.mf.internal.amx.fragment.AttributeListMetaData = AttributeListMetaData;
  adf.mf.api.AdfObject.createSubclass(
    adf.mf.internal.amx.fragment.AttributeListMetaData,
    adf.mf.internal.amx.fragment.AttributeMetaDataHolder,
    "adf.mf.internal.amx.fragment.AttributeListMetaData");

  AttributeListMetaData.prototype.Init = function(attributeListTag)
  {
    AttributeListMetaData.superclass.Init.call(this, attributeListTag);

    this.name = getTagTextValue(attributeListTag, "name");
  };
})();
