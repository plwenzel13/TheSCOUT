/* Copyright (c) 2013, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ----------- fragment/amx-fragmentDef.js -------------- */
/* ------------------------------------------------------ */

(function()
{
  /**
   * XML namespace for the fragment meta-data
   */
  var FRAGMENT_XML_NS = "http://xmlns.oracle.com/adf/mf/amx/fragment";

  var fragmentDefHandler = adf.mf.api.amx.TypeHandler.register(
    adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "fragmentDef");

  /**
   * amx:fragmentDef has no UI represestation, flatten it
   */
  fragmentDefHandler.prototype.isFlattenable = function(amxNode)
  {
    return true;
  };

  /**
   * Loads any bundles, requests the fragment via AJAX and builds the
   * children nodes once the fragment source is available
   * @param {adf.mf.api.amx.AmxNode} amxNode the fragmentDef AMX node
   * @return {boolean} true meaning that this handler always handles child
   *         node creation
   */
  fragmentDefHandler.prototype.createChildrenNodes = function(amxNode)
  {
    var bundlesLoaded = this._loadBundles(amxNode);

    if (bundlesLoaded)
    {
      this._parseDefinition(amxNode);
      amxNode.createStampedChildren(null, null, definitionFilter);
    }
    else
    {
      amxNode.setState(adf.mf.api.amx.AmxNodeStates["INITIAL"]);
    }

    return true;
  };

  /**
   * Custom visit of the children to setup the proper EL context for the children
   * while visiting
   * @param {adf.mf.api.amx.AmxNode} amxNode the amx:fragmentDef AMX node
   * @param {adf.mf.api.amx.VisitContext} visitContext the visit context
   * @param {Function} callback the callback function
   * @return {boolean} true if the visitation is complete and should not continue.
   */
  fragmentDefHandler.prototype.visitChildren = function(
    amxNode,
    visitContext,
    callback)
  {
    var fragment = amxNode.getParent();
    var metaData = adf.mf.internal.amx.fragment.FragmentMetaData.getMetaData(fragment);

    var setupResult = metaData.setupContext(fragment);

    try
    {
      return amxNode.visitStampedChildren(null, null, null, visitContext, callback);
    }
    finally
    {
      metaData.tearDownContext(setupResult);
    }
  };

  /**
   * Attempts to find a popup with the given ID
   * @param {adf.mf.api.amx.AmxNode} amxNode the AMX node
   * @param {string} popupId the ID of the popup to find
   * @param {boolean} isInternalReference if true the popup is being referenced by a child
   *        of the fragment and may be allowed to find non-exported popups. If false, the
   *        popup must be exported as it is being referenced externally
   */
  fragmentDefHandler.prototype.findPopup = function(
    amxNode,
    popupId,
    isInternalReference)
  {
    // Fragments do not support referencing popups underneath them except by the exported
    // popup IDs and popup references
    if (popupId == null || popupId.indexOf(":") >= 0)
    {
      return null;
    }

    var metaData = adf.mf.internal.amx.fragment.FragmentMetaData.getMetaData(amxNode.getParent());

    // Ensure this popup exists and is exported if it is not an internal reference
    if (!isInternalReference && !metaData.hasExportedPopup(popupId))
    {
      return null;
    }

    var popupReference = metaData.getExportedPopupReference(popupId);

    if (popupReference == null)
    {
      // If the reference is null, then the popup must be a child of the fragmentDef
      var children = amxNode.getChildren();

      // The popups are children of the fragmentDef
      for (var c = 0, numChildren = children.length; c < numChildren; ++c)
      {
        var child = children[c];

        if (child.getTag().getAttribute("id") == popupId)
        {
          return child;
        }
      }

      return null;
    }
    else
    {
      // If a reference has been used, we need to locate the popup using the reference.
      return amxNode.__findPopup(popupReference);
    }
  };

  /**
   * Processes any amx:loadBundle tags at the root of the page (under the amx:fragmentDef node).
   * @param {adf.mf.api.amx.AmxNode} amxNode the fragmentDef AMX node
   * @return {boolean} true if the bundles have been loaded, false if the bundles are currently
   *         being loaded
   */
  fragmentDefHandler.prototype._loadBundles = function(
    amxNode)
  {
    var bundlesLoaded = amxNode.getAttribute("_bundlesLoaded");
    var bundlesLoading = amxNode.getAttribute("_bundlesLoading");

    if (bundlesLoaded)
    {
      return true;
    }

    // The request has alreay been made, do nothing until the bundles are done loading
    if (bundlesLoading)
    {
      return false;
    }

    // amx:loadBundle only allowed under the root tag of the fragment
    var bundles = amxNode.__getTagInstances(
      adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
      "loadBundle");
    var numBundles = bundles.length;

    if (numBundles == 0)
    {
      // There are no bundles to load
      amxNode.setAttributeResolvedValue("_bundlesLoaded", true);
      return true;
    }

    amxNode.setAttributeResolvedValue("_bundlesLoading", true);

    var childPromises = [];
    for (var i = 0; i < numBundles; ++i)
    {
      var bundleTagInstance = bundles[i];
      var basename = bundleTagInstance.getAttribute("basename");
      var variable = bundleTagInstance.getAttribute("var");

      var loadPromise = amx.loadBundle(basename, variable);
      childPromises.push(loadPromise);
    }

    // Set the state to initial to ensure the createChildrenNodes is called again during
    // any subsequent markNodeForUpdate calls
    amxNode.setState(adf.mf.api.amx.AmxNodeStates["INITIAL"]);

    adf.mf.internal.BasePromise.all(childPromises).then(
      function()
      {
        // Use markNodeForUpdate when the bundles are done loading so the callback
        // is processed in the correct context
        amxNode.setAttributeResolvedValue("_bundlesLoading", false);
        amxNode.setAttributeResolvedValue("_bundlesLoaded", true);

        var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
        args.setAffectedAttribute(amxNode, "_bundlesLoaded");
        adf.mf.api.amx.markNodeForUpdate(args);
      });

    return false;
  };

  /**
   * Parse the XML meta-data
   * @param {adf.mf.api.amx.AmxNode} amxNode the fragmentDef AMX node
   */
  fragmentDefHandler.prototype._parseDefinition = function(
    amxNode)
  {
    var fragmentDefTag = amxNode.getTag();
    var childTags = fragmentDefTag.getChildren(FRAGMENT_XML_NS, "fragment");

    if (childTags.length != 1)
    {
      throw new Error(adf.mf.resource.getInfoString("AMXErrorBundle",
        "ERROR_FRAGMENT_DEF_NO_META_DATA"));
    }

    var fragmentMetaDataTag = childTags[0];
    var metaData = new adf.mf.internal.amx.fragment.FragmentMetaData(fragmentMetaDataTag);
    var fragmentAmxNode = amxNode.getParent();

    metaData.validateFacets(fragmentAmxNode);
    metaData.storeMetaData(fragmentAmxNode);

    amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
  };

  /**
   * Filter used by the createStampedChildren call to ensure that AMX nodes are not
   * created for the meta-data tags
   * @param {adf.mf.api.amx.AmxNode} amxNode the parent AMX node
   * @param {string} key the stamp key
   * @param {adf.mf.api.amx.AmxTag} tag the child AMX tag to check
   * @param {string} facetName the facet name of the child, if any
   * @return {boolean} true if the node should be created for the tag
   */
  function definitionFilter(
    amxNode,
    key,
    tag,
    facetName)
  {
    // Do not create AMX nodes for the fragment meta-data
    return tag.getNamespace() != adf.mf.internal.amx.fragment.FRAGMENT_XML_NS;
  }

})();
