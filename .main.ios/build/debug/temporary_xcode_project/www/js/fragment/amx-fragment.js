/* Copyright (c) 2013, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------- fragment/amx-fragment.js --------------- */
/* ------------------------------------------------------ */

(function()
{
  // During the creation of the children nodes, the fragment attempts to see if the
  // fragment is already loaded. If not, it will start the loading of the fragment and queue
  // a markNodeForUpdate callback when the loading is complete to update the view. If the fragment
  // has already been loaded, then the fragment is processed and the children nodes are created.

  var fragmentHandler = adf.mf.api.amx.TypeHandler.register(
    adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "fragment");

  /**
   * Creates the children nodes. Will kick of an AJAX call to load the fragment XML page
   * if it has not been already loaded.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the node for which to create the children
   * @return {boolean} true representing that the base functionality should not be used to
   *         create the children
   */
  fragmentHandler.prototype.createChildrenNodes = function(amxNode)
  {
    if (amxNode.getAttribute("src") == null)
    {
      // If the page attribute was not given, set the status to unrendered, otherwise
      // set it to the initial state so that this method will be called again (when the
      // fragment source is an EL value)
      amxNode.setState(
        amxNode.getAttributeExpression("src") == null ?
          adf.mf.api.amx.AmxNodeStates["UNRENDERED"] :
          adf.mf.api.amx.AmxNodeStates["INITIAL"]);
    }
    else
    {
      amxNode.setAttributeResolvedValue("_fragmentState",
        {
          "rendered": false,
          "placeholderRendered": false,
          "childrenCreated": false,
          "fragmentLoading": false,
          "waitingOnEl": (amxNode.getState() ==
            adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"])
        });

      this._createChildrenFromFragment(amxNode);
    }

    return true;
  };

  /**
   * Perform any updates of the children. If called back from the creation of facets, the
   * attribute name of _facetsToBeCreated is used by the af:facetRef to indicate the facet
   * stamps that should be created for each reference.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the node
   * @param {adf.mf.api.amx.AmxAttributeChange} attributeChanges the attribute changes
   * @return {int} the adf.mf.api.amx.AmxNodeChangeResult constant
   */
  fragmentHandler.prototype.updateChildren = function(
    amxNode,
    attributeChanges)
  {
    var fragmentState = amxNode.getAttribute("_fragmentState");

    // If the source has changed since trying to load the file, replace the node.
    if (attributeChanges.hasChanged("src") && fragmentState["childrenCreated"])
    {
      return adf.mf.api.amx.AmxNodeChangeResult["REPLACE"];
    }

    if (attributeChanges.hasChanged("_fragmentLoaded"))
    {
      // Do not hang onto the update argument reference
      delete fragmentState["updateArguments"];

      // Check if the children were already created and the fragment was rendered
      if (fragmentState["childrenCreated"] && !fragmentState["placeholderRendered"])
      {
        // This is the use case where the markNodeForUpdate call was made for the fragment promise being
        // resolved, but an attribute update (probably due to a data change event) already handled
        // the children creation. As such, we no longer need to do anything in this method
        if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "amx:fragment", "updateChildren",
            "Update children called due to attribute _fragmentLoaded, but the fragment has already " +
            "been rendered. Node: " +
            amxNode.getId());
        }

        return adf.mf.api.amx.AmxNodeChangeResult["NONE"];
      }
    }

    if (attributeChanges.hasChanged("_facetsToBeCreated"))
    {
      this._createFacets(amxNode, amxNode.isRendered());
    }

    if (amxNode.getState() == adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"])
    {
      fragmentState["waitingOnEl"] = true;
      if (fragmentState["placeholderRendered"] && document.getElementById(amxNode.getId()) != null)
      {
        // The placeholder has already been rendered
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"]);
        return adf.mf.api.amx.AmxNodeChangeResult["NONE"];
      }
      else
      {
        // Render a placeholder
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
        return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];
      }
    }
    else
    {
      fragmentState["waitingOnEl"] = false;
    }

    // The children will be created either (1) after the fragment XHR completes or
    // (2) after all the EL has been loaded. In #2, the _handleLoadedFragment function
    // will not create the children if the node state is WAITING_ON_EL_EVALUATION. As a
    // result we need to potentially create the children regardless of what attribute
    // changed.
    var childrenWereLoaded = false;
    var fragmentState = amxNode.getAttribute("_fragmentState");

    if (!fragmentState["childrenCreated"] && !fragmentState["waitingOnEl"] &&
      !fragmentState["fragmentLoading"])
    {
      if (this._createChildrenFromFragment(amxNode))
      {
        childrenWereLoaded = true;
      }
    }

    var result = fragmentHandler.superclass.updateChildren.call(this, amxNode, attributeChanges);

    // Return whichever result is more "destructive" using Math.max.
    return Math.max(
      adf.mf.api.amx.AmxNodeChangeResult[childrenWereLoaded ? "REFRESH" : "NONE" ],
      result);
  };

  /**
   * Renders a DIV tag that contains the contents of the fragment. Current fragments do not support
   * flattening so multiple fragment children will be placed in-line into the fragment DIV.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the node to render
   * @return {Element} the HTML element
   */
  fragmentHandler.prototype.render = function(amxNode)
  {
    var fragmentState = amxNode.getAttribute("_fragmentState");
    var div = document.createElement("div");

    // See if the fragment is loading the source or waiting on EL, if so,
    // just render a placeholder DIV
    if (fragmentState["waitingOnEl"] || fragmentState["childrenCreated"] == false)
    {
      div.className = "amx-deferred-loading";
      amxNode.setState(adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"]);
      fragmentState["placeholderRendered"] = true;
    }
    else
    {
      this._renderChildren(amxNode, div);
    }

    return div;
  };

  /**
   * Called to refresh the HTML of the fragment.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the AMX fragment node
   * @param {adf.mf.api.amx.AmxAttributeChange} attributeChanges the changed attributes
   * @param {(adf.mf.api.amx.AmxDescendentChanges|null)} descendentChanges the changes for any
   *        descendent nodes that need to be refreshed.
   */
  fragmentHandler.prototype.refresh = function(
    amxNode,
    attributeChanges,
    descendentChanges)
  {
    var fragmentState = amxNode.getAttribute("_fragmentState");

    if (fragmentState["waitingOnEl"] || fragmentState["childrenCreated"] == false)
    {
      // Nothing to do as the placeholder should already have been rendered
      return;
    }

    var div = document.getElementById(amxNode.getId());

    if (fragmentState["childrenCreated"])
    {
      if (fragmentState["placeholderRendered"])
      {
        fragmentState["placeholderRendered"] = false;
        div.classList.remove("amx-deferred-loading");
      }

      if (!fragmentState["rendered"])
      {
        this._renderChildren(amxNode, div);
      }
    }

    fragmentHandler.superclass.refresh.call(this,
      amxNode, attributeChanges, descendentChanges);
  };

  /**
   * Visits the fragment children in the context of the fragment so that relative URIs may
   * be resolved and then the facet stamps for each facet reference.
   */
  fragmentHandler.prototype.visitChildren = function(
    amxNode,
    visitContext,
    callback)
  {
    // First visit the indexed children
    // Put the fragment URI onto a stack so that we can get the current URI for relative
    // path processing
    var uri = this._getFragmentUri(amxNode);
    var fragmentStackCreated = false;
    if (this._fragmentStack == null)
    {
      this._fragmentStack = [ uri ];
      fragmentStackCreated = true;
    }
    else
    {
      this._fragmentStack.push(uri);
    }

    try
    {
      if (amxNode.visitStampedChildren(null, null, null, visitContext, callback))
      {
        return true;
      }
    }
    finally
    {
      if (fragmentStackCreated)
      {
        delete this._fragmentStack;
      }
      else
      {
        this._fragmentStack.pop();
      }
    }

    // Visit the stamps (facets created for the amx:facetRef nodes)
    var facetVisitData = amxNode.getAttribute("_facetVisitData");
    if (facetVisitData != null)
    {
      for (var i = 0, size = facetVisitData.length; i < size; ++i)
      {
        var data = facetVisitData[i];
        var facetName = data["name"];
        var facetAttrs = data["attributes"];
        var facetStampKey = data["key"];

        this._setupFacetContext(facetAttrs);

        try
        {
          if (amxNode.visitStampedChildren(facetStampKey, [ facetName ], null, visitContext, callback))
          {
            return true;
          }
        }
        finally
        {
          this._tearDownFacetContext(facetAttrs);
        }
      }
    }

    return false;
  };

  /**
   * Called from the type handler for the amx:facetRef when a facet ref is being removed from the
   * AMX node hierarchy. Allows the fragment to remove the facet and perform any necessary clean up.
   * @param {adf.mf.api.amx.AmxNode} fragmentAmxNode the fragment AMX node
   * @param {adf.mf.api.amx.AmxNode} facetRefAmxNode the facetRef AMX node
   */
  fragmentHandler.prototype.__removeFacet = function(
    fragmentAmxNode,
    facetRefAmxNode)
  {
    var facetName = facetRefAmxNode.getAttribute("facetName");
    var visitData = fragmentAmxNode.getAttribute("_facetVisitData");
    var stampKey = facetRefAmxNode.getId();
    var facets = fragmentAmxNode.getChildren(facetName, stampKey);

    if (facets.length > 0)
    {
      for (var i = facets.length - 1; i >= 0; --i)
      {
        var facet = facets[i];

        // Remove the facet
        if (!fragmentAmxNode.removeChild(facet))
        {
          this._removePendingFacetRefCreation(fragmentAmxNode, facetRefAmxNode);
        }

        // Remove, if present, any data for visiting the facets
        if (visitData != null)
        {
          for (var v = 0, numVisitData = visitData.length; v < numVisitData; ++v)
          {
            var facetVisitData = visitData[v];
            if (facetVisitData["key"] == stampKey)
            {
              visitData.splice(v, 1);
              break;
            }
          }
        }
      }
    }
    else
    {
      this._removePendingFacetRefCreation(fragmentAmxNode, facetRefAmxNode);
    }
  };

  fragmentHandler.prototype._renderChildren = function(
    amxNode,
    div)
  {
    var renderedDescendants = amxNode.renderDescendants();
    for (var i = 0, size = renderedDescendants.length; i < size; ++i)
    {
      div.appendChild(renderedDescendants[i]);
    }

    var fragmentState = amxNode.getAttribute("_fragmentState");
    fragmentState["placeholderRendered"] = false;
    fragmentState["rendered"] = true;

    amxNode.setState(adf.mf.api.amx.AmxNodeStates["RENDERED"]);
  };

  /**
   * Check for a facet ref's children marked to be created that just had the facet ref
   * node removed.
   * @param {adf.mf.api.amx.AmxNode} fragmentAmxNode the fragment AMX node
   * @param {adf.mf.api.amx.AmxNode} facetRefAmxNode the facetRef AMX node
   */
  fragmentHandler.prototype._removePendingFacetRefCreation = function(
    fragmentAmxNode,
    facetRefAmxNode)
  {
    // There is a chance that a facet ref AMX node being removed it is still pending
    // creation for its facets. If that is the case, ensure that the data is removed before
    // we attempt to create the facet in the _createFacets call
    var newFacets = fragmentAmxNode.getAttribute("_facetsToBeCreated");
    if (newFacets != null)
    {
      for (var i = 0, size = newFacets.length; i < size; ++i)
      {
        var pendingFacetRefAmxNode = newFacets[i];
        if (facetRefAmxNode === pendingFacetRefAmxNode)
        {
          // Remove this item so that it is no longer scheduled to be created
          newFacets.splice(i, 1);
          --size;
          --i;
        }
      }
    }
  };

  /**
   * Setup the EL variables for any attributes that need to be passed from the facetRef to the facet
   */
  fragmentHandler.prototype._setupFacetContext = function(
    facetAttributes)
  {
    if (facetAttributes != null)
    {
      for (var a = 0, numAttrs = facetAttributes.length; a < numAttrs; ++a)
      {
        var attrData = facetAttributes[a];
        adf.mf.api.pushVariable(attrData["name"], attrData["value"]);
      }
    }
  };

  /**
   * Tear down the EL variables for any attributes that were passed from the facetRef to the facet
   */
  fragmentHandler.prototype._tearDownFacetContext = function(
    facetAttributes)
  {
    if (facetAttributes != null)
    {
      for (var a = 0, numAttrs = facetAttributes.length; a < numAttrs; ++a)
      {
        var attrData = facetAttributes[a];
        adf.mf.api.popVariable(attrData["name"]);
      }
    }
  };

  /**
   * Get the fragment URI, taking into account any relative paths so that they are resolved to
   * the including page or fragment.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the fragment AMX node
   */
  fragmentHandler.prototype._getFragmentUri = function(amxNode)
  {
    var uri = amxNode.getAttribute("_uri");
    if (uri == null)
    {
      uri = amxNode.getAttribute("src");
      if (uri != null)
      {
        if (this._fragmentStack == null || uri[0] == "/")
        {
          uri = adf.mf.api.amx.buildRelativePath(uri);
        }
        else
        {
          // This is a relative URI, get the currently processing fragment URI
          var baseUri = this._fragmentStack[this._fragmentStack.length - 1];
          // Remove the last path element
          var lastSlashIndex = baseUri.lastIndexOf("/");
          if (lastSlashIndex >= 0)
          {
            uri = baseUri.substring(0, lastSlashIndex) + "/" + uri;
          }
        }
      }
    }

    // Store it so we can avoid having to re-calculate the value. This is okay since the AMX node
    // is recreated when the page attribute changes
    amxNode.setAttributeResolvedValue("_uri", uri);
    return uri;
  };

  /**
   * Checks if the fragment is being included in an infinite loop (recursion).
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the fragment AMX node
   * @param {string} fragmentUri the URI of the fragment source
   * @return {boolean} true if an infinite loop has been detected
   */
  fragmentHandler.prototype._isInfiniteLoop = function(
    amxNode,
    fragmentUri)
  {
    var fragmentStack = this._fragmentStack;
    if (fragmentStack)
    {
      // Due to the fact that EL is not evaluated in the DT and therefore nothing can prevent a
      // recursive loop from being evaluated, we need to prevent recursive loops by
      // not rendering the repeated child.
      if (adf.mf.environment.profile.dtMode)
      {
        if (fragmentStack.indexOf(fragmentUri) >= 0)
        {
          amxNode.setState(adf.mf.api.amx.AmxNodeStates["UNRENDERED"]);
          return true;
        }
      }
      else
      {
        // Allow the user to override the stack size (in case there is an app that needs to perform
        // a deep recursion
        var stackSizeToCheckAt = adf.mf.api.amx.fragmentRecursionLimit || 25;

        // To prevent recursive loops and exceeding the JavaScript stack, do not permit fragments to
        // have an unlimited recursion depth. The code currently consideres a loop if 25 or more
        // fragments are in the current stack and the current fragment has already been included
        // in the stack at least once
        if (fragmentStack.length >= stackSizeToCheckAt && fragmentStack.indexOf(fragmentUri) >= 0)
        {
          // Set the node to unrendered to stop any more recursion
          amxNode.setState(adf.mf.api.amx.AmxNodeStates["UNRENDERED"]);

          // Show the error, but do not harm rendering the rest of the page by throwing the error
          adf.mf.internal.amx.errorHandlerImpl(null, new Error(adf.mf.resource.getInfoString(
            "AMXErrorBundle", "ERROR_FRAGMENT_RECURSIVE_LOOP")));

          // Also log the error to the console with more detailed information to assist with
          // debugging to find out what fragment caused the recursion
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
            "fragmentHandler.prototype._createChildrenFromFragment", "amx_fragment_RECURSION",
            amxNode.getId(), fragmentUri);
          return true;
        }
      }
    }

    return false;
  };

  /**
   * Create the children from the fragment. This function causes the fragment to be loaded using the
   * adf.mf.internal.amx.__getAmxTagForPage function. Once the tags are loaded, the
   * _handleLoadedFragment is invoked.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the AMX node
   * @return {boolean|undefined} undefined if the node's URI is null, otherwise will return a
   *         boolean value representing if the fragment's tags have been successfully loaded. A
   *         value of false means that either the AJAX call failed or if the AJAX call is currently
   *         in process.
   */
  fragmentHandler.prototype._createChildrenFromFragment = function(amxNode)
  {
    var fragmentUri = this._getFragmentUri(amxNode);
    var fragmentState = amxNode.getAttribute("_fragmentState");

    if (fragmentUri == null)
    {
      amxNode.setState(adf.mf.api.amx.AmxNodeStates["UNRENDERED"]);
      fragmentState["waitingOnEl"] = false;
      fragmentState["childrenCreated"] = true;
      return;
    }

    if (this._isInfiniteLoop(amxNode, fragmentUri))
    {
      fragmentState["waitingOnEl"] = false;
      fragmentState["childrenCreated"] = true;
      return true;
    }

    var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);
    if (isFinestLoggingEnabled)
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "amx:fragment", "_createChildrenFromFragment",
        "Requesting the fragment tag for AMX node '" + amxNode.getId() + "' and URI: " +
        fragmentUri);
    }

    // Load the AMX tags for the fragment
    var fragmentTag = adf.mf.internal.amx.__getAmxTagForPage(fragmentUri, true);
    if (fragmentTag != null)
    {
      // The fragment has already been loaded, probably by another fragment
      if (isFinestLoggingEnabled)
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "amx:fragment", "_createChildrenFromFragment",
          "Fragment was cached. Calling _handleLoadedFragment (URI: " + fragmentUri +
          ", AmxNode: " + amxNode.getId() + ")");
      }

      fragmentState["fragmentLoading"] = false;

      // Try to cancel the pending mark node for update if it exists
      var updateArgs = fragmentState["updateArguments"];
      if (updateArgs != null)
      {
        updateArgs.cancel();
        delete fragmentState["updateArguments"];
      }

      this._handleLoadedFragment(amxNode, fragmentTag);
      return true;
    }
    else // not cached, so try with a promise
    {
      // The fragment file is still being loaded asynchronously, wait until it has finished
      if (isFinestLoggingEnabled)
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "amx:fragment", "_createChildrenFromFragment",
          "Waiting on the fragment file to load and the tags to be built (URI: " + fragmentUri +
          ", AmxNode: " + amxNode.getId() + ")");
      }

      // Avoid duplicate markNodeForUpdate calls (only call once)
      if (!fragmentState["fragmentLoading"])
      {
        fragmentState["fragmentLoading"] = true;
        this._loadFragment(amxNode, fragmentUri);
      }
      return false;
    }
  };

  /**
   * Called once the fragment has been loaded. The calling function must ensure that
   * the deferred object has already been resolved when this function is invoked.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the fragment node
   * @param {adf.mf.api.amx.AmxTag} the root adf.mf.api.amx.AmxTag for the fragment
   */
  fragmentHandler.prototype._handleLoadedFragment = function(
    amxNode,
    fragmentTag)
  {
    var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);

    // Do not process the children if the node is waiting on EL. This will ensure that any
    // amx:attribute tag instances have been loaded before the children are created. This
    // ensures that we only have one cache miss per EL used by an attribute and not multiple
    // (which will happen if a fragment is loaded before the data change event for the attribute's
    // data)
    if (amxNode.getState() == adf.mf.api.amx.AmxNodeStates["WAITING_ON_EL_EVALUATION"])
    {
      if (isFinestLoggingEnabled)
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "amx:fragment", "_handleLoadedFragment",
          "Node is waiting on EL: " + amxNode.getId());
      }

      // Render a placeholder until all the attributes have been loaded
      amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
      return;
    }

    // The fragment was already found and is loaded at this time, we can safely
    // process it and create the children.
    if (isFinestLoggingEnabled)
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "amx:fragment", "_handleLoadedFragment",
        "Fragment tag promise callback invoked for node: " + amxNode.getId());
    }

    var childAmxNode = fragmentTag.buildAmxNode(amxNode, null);
    amxNode.addChild(childAmxNode);
    if (adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST))
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "amx:fragment", "_fragmentLoaded",
        "Children created. Node: " + amxNode.getId());
    }

    // Mark the node as having created the children
    amxNode.getAttribute("_fragmentState")["childrenCreated"] = true;
  };

  /**
   * Displas the loading indicator, changes the state of the AMX node and kicks waits for the
   * deferred object to be resolved. Once resolved, this function will call
   * adf.mf.api.amx.markNodeForUpdate with the "_fragmentLoaded" virtual attribute being marked
   * as dirty.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the fragment AMX node
   * @param {string} fragmentUri the fragement URI to load
   */
  fragmentHandler.prototype._loadFragment = function(
    amxNode,
    fragmentUri)
  {
    var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);

    // At this point the fragment has been requested but has not yet been loaded
    adf.mf.api.amx.showLoadingIndicator();
    var that = this;
    var fragmentTagPromise = adf.mf.internal.amx.__getAmxTagForPage(fragmentUri, false);
    fragmentTagPromise
      .then(
        function()
        {
          try
          {
            var fragmentState = amxNode.getAttribute("_fragmentState");

            // It is possible for the fragment to have processed the tags during an attribute
            // update. If that happened, the fragmentLoading state will be false instead of true.
            // So if it is false, then we don't need to incur the overhead of a
            // markNodeForUpdate for update call and we are done.
            if (!fragmentState["fragmentLoading"])
            {
              if (isFinestLoggingEnabled)
              {
                adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
                  "amx:fragment", "_loadFragment",
                  "The fragment tag promise has completed, but the state is no longer " +
                  "loading. The markNodeForUpdate method will not be invoked for node: " +
                  amxNode.getId());
              }
            }
            else
            {
              if (isFinestLoggingEnabled)
              {
                adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
                  "amx:fragment", "_loadFragment",
                  "The fragment tag promise was fulfilled. Calling markNodeForUpdate for node: " +
                  amxNode.getId());
              }

              fragmentState["fragmentLoading"] = false;

              // Use markNodeForUpdate to update the children in context
              var args = new adf.mf.internal.amx.AmxNodeUpdateArguments();
              args.setAffectedAttribute(amxNode, "_fragmentLoaded");

              // Store the update arguments to allow the update to be canceled
              // if an attribute update handles the creation of the children before
              // the fragment is able to
              fragmentState["updateArguments"] = args;

              adf.mf.api.amx.markNodeForUpdate(args);
            }
          }
          finally
          {
            adf.mf.api.amx.hideLoadingIndicator();
          }
        },
        function(msg, e)
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
            "amx-fragment._loadFragment", "MSG_ERROR_IN_SCRIPT", "amx-fragment._loadFragment",
            "Error loading fragment '" + amxNode.getAttribute("src") + "': " + msg);
          if (e instanceof Error)
          {
            adf.mf.internal.amx.errorHandlerImpl(null, e);
          }

          var fragmentState = amxNode.getAttribute("_fragmentState");
          fragmentState["waitingOnEl"] = false;
          fragmentState["childrenCreated"] = true;

          // We failed to load the fragment, do not render this node
          amxNode.setState(adf.mf.api.amx.AmxNodeStates["UNRENDERED"]);

          adf.mf.api.amx.hideLoadingIndicator();
        }
      );

    // We can render a placeholder, so update the state to reflect
    amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
  };

  /**
   * Called from a markNodeForUpdate call once facet ref tags have been processed to create
   * the stamps of the facets for each reference. If the fragment has already been rendered,
   * this function will kick of a nested markNodeForUpdate call to cause the parents of the
   * amx:facetRef tags to be re-rendered.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the fragment AMX node
   * @param {boolean} fragmentIsRendered true if the fragment has already been rendered
   */
  fragmentHandler.prototype._createFacets = function(
    amxNode,
    fragmentIsRendered)
  {
    var isFinestLoggingEnabled = adf.mf.log.AMX.isLoggable(adf.mf.log.level.FINEST);
    if (isFinestLoggingEnabled)
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "amx:fragment", "_createFacets",
        "Creating the facets for " + amxNode.getId());
    }

    var newFacets = amxNode.getAttribute("_facetsToBeCreated");
    amxNode.setAttributeResolvedValue("_facetsToBeCreated", null);

    // Keep a list of the facet stamp keys. This is used to visit the children
    var facetVisitData = amxNode.getAttribute("_facetVisitData");
    if (facetVisitData == null)
    {
      facetVisitData = [];
      amxNode.setAttributeResolvedValue("_facetVisitData", facetVisitData);
    }

    // We will use markNodeForUpdate to cause the rendering of the facets by using
    // the facetRef nodes. This ensures that we only re-render what is necessary
    var args = fragmentIsRendered ? new adf.mf.internal.amx.AmxNodeUpdateArguments() : null;

    if (isFinestLoggingEnabled)
    {
      adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
        "amx:fragment", "_createFacets",
        "Number of facets to be created: " + newFacets.length);
    }

    for (var i = 0, size = newFacets.length; i < size; ++i)
    {
      var facetRefAmxNode = newFacets[i];
      var facetName = facetRefAmxNode.getAttribute("facetName");
      var facetStampKey = facetRefAmxNode.getId();

      // Record the information needed for visiting
      facetVisitData.push({
        "key": facetStampKey,
        "name": facetName,
        "attributes": facetRefAmxNode.getAttribute("_attributeData")
      });

      var created = amxNode.createStampedChildren(facetStampKey, [ facetName ]);
      for (var c = 0, numCreated = created.length; c < numCreated; ++c)
      {
        var facetAmxNode = created[c];

        // Set the parent that is used for rendering purposes. This allows the framework
        // to only re-render based on the location in the page rather than needing to
        // re-render the full fragment when a facet changes.
        facetAmxNode.__setRenderingParent(facetRefAmxNode);
      }

      if (fragmentIsRendered && created.length > 0)
      {
        // Mark the node as needing to be updated using a dummy attribute name
        args.setAffectedAttribute(facetRefAmxNode, "_facetCreated");
      }

      // Mark the facetRef ready to be rendered now that the facet has been created
      facetRefAmxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
    }

    // Only schedule the update if the fragment is rendered. If the fragment is not yet rendered,
    // there is no need for the overhead of marking the facets as having been changed
    if (fragmentIsRendered && args.getAffectedNodes().length > 0)
    {
      if (isFinestLoggingEnabled)
      {
        adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
          "amx:fragment", "_createFacets",
          "The fragment was already rendered, calling markNodeForUpdate to update the UI " +
          "with the facets");
      }

      adf.mf.api.amx.markNodeForUpdate(args);
    }
  };
})();
