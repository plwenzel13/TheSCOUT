/* Copyright (c) 2013, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------- fragment/amx-facetRef.js --------------- */
/* ------------------------------------------------------ */

(function()
{
  // Functionality to handle the logic for the amx:facetRef tag

  var facetRefHandler = adf.mf.api.amx.TypeHandler.register(
    adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "facetRef");

  /**
   * Allow amx:facetRef to be flattened, so that the children of the amx:facet tag are used
   * for rendering.
   * @param {adf.mf.api.amx.AmxNode} the facet reference AMX node
   * @return {boolean} always returs true
   */
  facetRefHandler.prototype.isFlattenable = function(amxNode)
  {
    return true;
  };

  /**
   * Does not actually create the children nodes, but instead sets an attribute on the
   * fragment AMX node with all the facets that need to be created. Then triggers a call
   * to markNodeForUpdate so that the fragment will create the facets in the correct EL
   * context.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the facet reference AMX node
   * @return {boolean} always returs true, representing that the facet reference handled
   *         creating its own "children"
   */
  facetRefHandler.prototype.createChildrenNodes = function(amxNode)
  {
    // Facets cannot actually be created by the facetRef as the EL context is not correct for
    // where the facet is defined. As such, the facet reference node ID is used to generate
    // stamp keys to be able to tie the facet reference to the facet instance.
    var fragment = adf.mf.internal.amx.fragment.findFragmentAmxNode(amxNode);
    var facetWillBeCreated = false;

    if (fragment != null)
    {
      // First, check to see if there is a facet for this facetRef. If there is no facet, we
      // can improve performance by not trying to create any facets in a subsequent
      // markNodeForUpdate call.
      var fragmentTag = fragment.getTag();
      var facetName = amxNode.getAttribute("facetName");
      if (fragmentTag.getChildFacetTag(facetName) == null)
      {
        // Nothing to be done, the facet was not provided
        return true;
      }

      var facetsToBeCreated = fragment.getAttribute("_facetsToBeCreated");
      if (facetsToBeCreated == null)
      {
        facetsToBeCreated = [];
        fragment.setAttributeResolvedValue("_facetsToBeCreated", facetsToBeCreated);

        // Queue the callback so that the fragment type handler can create the facets
        // in the correct context. This is only done when _facetsToBeCreated is null (for
        // the first facetRef encountered).
        var args = new adf.mf.internal.amx.AmxNodeUpdateArguments();
        args.setAffectedAttribute(fragment, "_facetsToBeCreated");
        adf.mf.api.amx.markNodeForUpdate(args);

        facetWillBeCreated = true;
      }

      facetsToBeCreated.push(amxNode);
      this._addAttributeValues(amxNode);

      // Prevent the fragment from rendering until the facets have been created/initialized
      if (fragment.getState() == adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"])
      {
        fragment.setState(adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"]);
      }
    }

    // Set the state to WAITING_ON_EL_EVALUATION if the facet is yet to be created. This reduces
    // the chance of multiple rendering cycles during an update
    amxNode.setState(adf.mf.api.amx.AmxNodeStates[
      facetWillBeCreated ? "WAITING_ON_EL_EVALUATION" : "ABLE_TO_RENDER"]);
    return true;
  };

  /**
   * If the facet reference AMX node is removed from the hierarchy, this method ensures that
   * the corresponding facet nodes on the fragment AMX nodes are removed as well.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the facet reference AMX node
   * @param {int} type the adf.mf.api.amx.AmxNodeNotifications notification type
   */
  facetRefHandler.prototype.handleNotification = function(
    amxNode,
    type)
  {
    if (type == adf.mf.api.amx.AmxNodeNotifications["PRE_REMOVAL"])
    {
      var fragment = adf.mf.internal.amx.fragment.findFragmentAmxNode(amxNode);

      if (fragment != null)
      {
        // Delegate to the fragment type handler to remove the facet nodes that are referenced
        // by this facetRef
        var typeHandler = fragment.getTypeHandler();
        typeHandler.__removeFacet(fragment, amxNode);
      }
    }
  };

  /**
   * Allows the facet reference node to return the facets from the fragment as the nodes to be
   * rendered when flattening.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the facet reference AMX node
   * @return {Array.<adf.mf.api.amx.AmxNode>} the nodes to be rendered
   */
  facetRefHandler.prototype.__getRenderedChildren = function(
    amxNode)
  {
    var fragment = adf.mf.internal.amx.fragment.findFragmentAmxNode(amxNode);
    var facetName = amxNode.getAttribute("facetName");

    if (fragment == null || facetName == null)
    {
      return [];
    }

    // A facet stamp key is the facet ref ID
    var stampKey = amxNode.getId();

    return fragment.getRenderedChildren(facetName, stampKey);
  };

  facetRefHandler.prototype.__tagInstanceUpdated = function(
    amxNode,
    tagInstance)
  {
    var tag = tagInstance.getTag();
    if (tag.getName() != "attribute" || tag.getNamespace() != adf.mf.api.amx.AmxTag.NAMESPACE_AMX)
    {
      return;
    }

    var attributeData = amxNode.getAttributeResolvedValue("_attributeData", attributeData);
    var attributeName = tagInstance.getAttribute("name");
    var attributeValue = tagInstance.getAttribute("value");

    for (var a = 0, numDataSets = attributeData.length; a < numDataSets; ++a)
    {
      var obj = attributeData[a];
      if (obj["name"] == attributeName)
      {
        obj["value"] = attributeValue;
        break;
      }
    }
  };

  facetRefHandler.prototype._addAttributeValues = function(
    amxNode)
  {
    var attributeData = [];
    var attributeTagInstances = amxNode.__getTagInstances(
      adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
      "attribute");

    amxNode.setAttributeResolvedValue("_attributeData", attributeData);

    for (var a = 0, numAttributes = attributeTagInstances.length; a < numAttributes; ++a)
    {
      var attributeTagInstance = attributeTagInstances[a];
      var attributeName = attributeTagInstance.getAttribute("name");
      var attributeValue = attributeTagInstance.getAttribute("value");

      attributeData.push({ "name": attributeName, "value": attributeValue });
    }
  };
})();
