/* Copyright (c) 2013, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------- fragment/amx-AttributeListIterator.js -------- */
/* ------------------------------------------------------ */

(function()
{
  var AttributeListIterator = adf.mf.api.amx.TypeHandler.register(
    adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "attributeListIterator");

  AttributeListIterator.prototype.createChildrenNodes = function(amxNode)
  {
    if (adf.mf.environment.profile.dtMode)
    {
      return this._createDtChildren(amxNode);
    }

    // If, in the future, attribute lists may be defined by Java code, the
    // code should check the iterator's available count versus the total count
    // here to see if data needs to be loaded (see af:iterator). Since all attribute
    // lists are defined by XML at the moment, this is not needed.

    this._initialize(amxNode);

    var attributeListTagInstance = amxNode.getAttribute("_listTagInstance");
    if (attributeListTagInstance != null)
    {
      var attributeSets = attributeListTagInstance.getChildren(
        adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
        "attributeSet");

      var varStatus = this._setupVarStatus(amxNode, attributeSets);
      var step = varStatus["step"];

      for (var i = varStatus["begin"], end = varStatus["end"];
        (step < 0 && i >= end) ||
        (step > 0 && i <= end);
        i += step)
      {
        amxNode.createStampedChildren(i, [ null ]);
      }
    }

    return true;
  };

  /**
   * Custom visit of the children to setup the proper EL context for the children
   * while visiting
   * @param {adf.mf.api.amx.AmxNode} amxNode the amx:attributeListIterator AMX node
   * @param {adf.mf.api.amx.VisitContext} visitContext the visit context
   * @param {Function} callback the callback function
   * @return {boolean} true if the visitation is complete and should not continue.
   */
  AttributeListIterator.prototype.visitChildren = function(
    amxNode,
    visitContext,
    callback)
  {
    var attributeListTagInstance = amxNode.getAttribute("_listTagInstance");
    if (attributeListTagInstance == null)
    {
      return false;
    }

    var listMetaData = amxNode.getAttribute("_listMetaData");
    var attributeSets = attributeListTagInstance.getChildren(
      adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
      "attributeSet");
    var varStatus = this._setupVarStatus(amxNode, attributeSets);
    var step = varStatus["step"];

    for (var i = varStatus["begin"], end = varStatus["end"], count = 1;
      (step < 0 && i >= end) ||
      (step > 0 && i <= end);
      i += step)
    {
      var set = attributeSets[i];

      varStatus["index"] = i;
      varStatus["count"] = count++;
      varStatus["last"] = (i == end);

      var setupResult = this._setupContext(amxNode, listMetaData, set, varStatus);
      try
      {
        if (amxNode.visitStampedChildren(i, null, null, visitContext, callback))
        {
          return true;
        }
      }
      finally
      {
        this._tearDownContext(amxNode, setupResult);
      }

      varStatus["first"] = false;
    }

    return false;
  };

  /**
   * The iterator is always flattened
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the amx:attributeListIterator AMX node
   * @return {boolean} true that the node is flattenable
   */
  AttributeListIterator.prototype.isFlattenable = function(amxNode)
  {
    return true;
  };

  /**
   * Sets up the EL context of the iterator
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the amx:attributeListIterator AMX node
   * @param {adf.mf.internal.amx.fragment.AttributeListMetaData} listMetaData the attribute list
   *        meta-data
   * @param {adf.mf.internal.amx.AmxTagInstance} attributeSet the attributeSet tag instance
   * @param {Object} varStatus the varStatus object
   * @return {Object} the setup result to pass to _tearDownContext
   */
  AttributeListIterator.prototype._setupContext = function(
    amxNode,
    listMetaData,
    attributeSet,
    varStatus)
  {
    var setupResult = listMetaData.setupContext(attributeSet);

    var varStatusVariableName = amxNode.getAttribute("varStatus");
    if (varStatusVariableName != null)
    {
      adf.mf.api.pushVariable(varStatusVariableName, varStatus);
    }

    var lastSetTagInstance = amxNode.getAttribute("_currentSetTagInstance");
    amxNode.setAttributeResolvedValue("_currentSetTagInstance", attributeSet);

    return {
      "metaDataSetupResult": setupResult,
      "lastSetTagInstance": lastSetTagInstance,
      "metaData": listMetaData,
      "varStatusVariableName": varStatusVariableName
    };
  };

  /**
   * Tear down the EL context
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the amx:attributeListIterator AMX node
   * @param {Object} setupResult the result returned from _setupContext
   * @see _setupContext
   */
  AttributeListIterator.prototype._tearDownContext = function(
    amxNode,
    setupResult)
  {
    setupResult["metaData"].tearDownContext(setupResult["metaDataSetupResult"]);

    if (setupResult["varStatusVariableName"] != null)
    {
      adf.mf.api.popVariable(setupResult["varStatusVariableName"]);
    }

    amxNode.setAttributeResolvedValue("_currentSetTagInstance", setupResult["lastSetTagInstance"]);
  };

  /**
   * Create fake children in DT mode
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the amx:attributeListIterator AMX node
   * @return {boolean} true that the children were created
   */
  AttributeListIterator.prototype._createDtChildren = function(
    amxNode)
  {
    // Create dummy data to show in the DT preview
    for (var i = 0; i < 3; ++i)
    {
      amxNode.createStampedChildren(i, [ null ]);
    }

    amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
    return true;
  };

  /**
   * Perform any initialization of the node
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the amx:attributeListIterator AMX node
   */
  AttributeListIterator.prototype._initialize = function(
    amxNode)
  {
    // Prevent duplicate calls
    if (amxNode.getAttribute("_listTagInstance") !== undefined)
    {
      return;
    }

    var attributeName = amxNode.getAttribute("name");
    var parentAmxNode = this._getParentAmxNode(amxNode);
    var tagInstance = this._findAttributeListTagInstance(parentAmxNode, attributeName);

    amxNode.setAttributeResolvedValue("_listTagInstance", tagInstance);

    if (tagInstance != null)
    {
      // Get the meta-data and store it as well as it is needed to set up the context as well
      // as for nested attribute list iterators
      var listIsNested = parentAmxNode.getTag().getName() == "attributeListIterator";
      var parentListMetaData = listIsNested ?
        parentAmxNode.getAttribute("_listMetaData") :
        adf.mf.internal.amx.fragment.FragmentMetaData.getMetaData(parentAmxNode);

      var listMetaData = parentListMetaData.getAttributeListMetaData(attributeName);

      if (listMetaData == null)
      {
        throw new Error(adf.mf.resource.getInfoString("AMXErrorBundle",
          "ERROR_NO_ATTRIBUTE_LIST_DEFINED", attributeName));
      }

      amxNode.setAttributeResolvedValue("_listMetaData", listMetaData);
    }
  };

  /**
   * Get the parent amx:attributeListIterator or amx:fragment AMX node
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the AMX node to start searching from
   * @return {adf.mf.api.amx.AmxNode} the fragment or attribute list AMX node or null if neither
   *         found
   */
  AttributeListIterator.prototype._getParentAmxNode = function(
    amxNode)
  {
    // See if this attribute list is nested in another list or at the top of the definition
    for (var parent = amxNode.getParent(); parent != null; parent = parent.getParent())
    {
      var parentTag = parent.getTag();
      if (parentTag.getNamespace() != adf.mf.api.amx.AmxTag.NAMESPACE_AMX)
      {
        continue;
      }

      if (parentTag.getName() == "fragmentDef")
      {
        return parent.getParent();
      }

      if (parentTag.getName() == "attributeListIterator")
      {
        return parent;
      }
    }

    return null;
  };

  /**
   * Get the tag instance for the amx:attributeList tag on the fragment node
   *
   * @param {adf.mf.api.amx.AmxNode} parentAmxNode the amx:attributeListIterator
   *        or amx:fragment AMX node to search
   * @param {string} listName the name of the attribute list to find
   * @return {adf.mf.internal.amx.AmxTagInstance} the tag instance if found
   */
  AttributeListIterator.prototype._findAttributeListTagInstance = function(
    parentAmxNode,
    listName)
  {
    if (parentAmxNode == null)
    {
      throw new Error(adf.mf.resource.getInfoString("AMXErrorBundle",
        "ERROR_ATTRIBUTE_LIST_NOT_IN_FRAGMENT", listName));
    }

    var attributeListTagInstances = null;

    if (parentAmxNode.getTag().getName() == "attributeListIterator")
    {
      // During iteration the _currentSetTagInstance is set to the attributeSet tag instance
      // that is currently being processed. This tag must use an attribute list in that
      // attribute set.
      var currentAttributeSetTagInstance = parentAmxNode.getAttribute(
        "_currentSetTagInstance");

      if (currentAttributeSetTagInstance == null)
      {
        throw new Error(adf.mf.resource.getInfoString("AMXErrorBundle",
          "ERROR_PARENT_ATTRIBUTE_LIST_NOT_ACTIVE"));
      }

      attributeListTagInstances = currentAttributeSetTagInstance.getChildren(
        adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
        "attributeList");
    }
    else
    {
      // Parent AMX node is a fragment node
      attributeListTagInstances = parentAmxNode.__getTagInstances(
        adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
        "attributeList");
    }

    var tagInstance = null;
    if (attributeListTagInstances != null)
    {
      // Search all attribute list tag instances in the parent to see if one has the desired
      // name
      for (var l = 0, numLists = attributeListTagInstances.length; l < numLists; ++l)
      {
        var attributeListTagInstance = attributeListTagInstances[l];
        if (attributeListTagInstance.getAttribute("name") == listName)
        {
          tagInstance = attributeListTagInstance;
          break;
        }
      }
    }

    if (tagInstance != null)
    {
      // See if this is a reference to another attributeList tag instance
      var listReference = tagInstance.getAttribute("ref");
      if (listReference != null)
      {
        // Find the parent list iterator or fragment node for the found tag instance
        var parentAmxNode = this._getParentAmxNode(tagInstance.getParentAmxNode());

        tagInstance = this._findAttributeListTagInstance(parentAmxNode, listReference);
      }
    }

    return tagInstance;
  };

  AttributeListIterator.prototype._setupVarStatus = function(
    amxNode,
    attributeSets)
  {
    var numItems = attributeSets.length;
    var begin = this._getIntAttributeWithDefault(amxNode, "begin", 0);
    var end = this._getIntAttributeWithDefault(amxNode, "end", numItems - 1);
    var step = this._getIntAttributeWithDefault(amxNode, "step", 1);

    if (step == 0)
    {
      throw new Error(adf.mf.resource.getInfoString("AMXErrorBundle",
        "ERROR_ATTRIBUTE_LIST_STEP_0"));
    }

    if (step > 0 && end > numItems - 1)
    {
      end = numItems - 1;
    }

    if (begin < 0)
    {
      begin = 0;
    }

    if (step > 1)
    {
      // The end may need to be adjusted if the step is not one
      end = end - ((end - begin) % step);
    }
    else if (step < -1)
    {
      begin = begin + ((end - begin) % step);
    }

    return {
      "begin": begin,
      "end": end,
      "first": true,
      "last": (begin == end),
      "index": begin,
      "count": 1,
      "step": step
    };
  };

  AttributeListIterator.prototype._getIntAttributeWithDefault = function(
    amxNode,
    attributeName,
    defaultValue)
  {
    var attr = amxNode.getAttribute(attributeName);
    return attr == undefined ? defaultValue : parseInt(attr, 10);
  };
})();
