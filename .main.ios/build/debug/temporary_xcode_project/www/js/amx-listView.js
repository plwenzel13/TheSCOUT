/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------------- amx-listView.js ------------------ */
/* ------------------------------------------------------ */

(function()
{
  var listView = adf.mf.api.amx.TypeHandler.register(
      adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "listView");

  listView.prototype.createChildrenNodes = function(amxNode)
  {
    // Store the selected row key on the node as it needs to be evaluated
    // when the EL context has been setup
    amxNode.setAttributeResolvedValue("_selectedRowKey", _getSelectedRowKey(amxNode));

    // See if the listview is bound to a collection
    if (!amxNode.isAttributeDefined("value"))
    {
      // Let the default behavior occur of building the child nodes
      return false;
    }

    var dataItems;
    if (adf.mf.environment.profile.dtMode)
    {
      // If in DT mode, create 3 dummy children so that something is displayed
      // on the page
      dataItems = [{},{},{}];
      amxNode.setAttributeResolvedValue("value", dataItems);
    }
    else
    {
      dataItems = amxNode.getAttribute("value");
      if (dataItems === undefined)
      {
        // Mark it so the framework knows that the children nodes cannot be
        // created until the collection model has been loaded.
        // We want to display a temporary placeholder until the real content can be displayed:
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
        amxNode.setAttributeResolvedValue("_placeholder", "yes");
        return adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["DEFERRED"];
      }
      else if (dataItems == null)
      {
        // No items, nothing to do
        return true;
      }
    }

    var fetchSize = Infinity;
    var maxRows = null;
    var fetchSizeAttribute = amxNode.getAttribute("fetchSize");
    if (fetchSizeAttribute != null &&
      adf.mf.internal.amx.isFiniteNumber(parseInt(fetchSizeAttribute, 10)))
    {
      fetchSize = parseInt(fetchSizeAttribute, 10);
      if (fetchSize < 0)
      {
        fetchSize = Infinity;
      }
      else if (fetchSize == 0)
      {
        fetchSize = 25;
      }
    }
    amxNode.setAttributeResolvedValue("fetchSize", fetchSize);

    var iter = adf.mf.api.amx.createIterator(dataItems);

    // See if there is a stored max rows in the client state
    var clientState = amxNode.getClientState();
    if (clientState != null)
    {
      maxRows = clientState.maxRows;
      if (maxRows != null)
      {
        amxNode.setAttributeResolvedValue("maxRows", maxRows);
      }
    }

    if (maxRows == null)
    {
      if (amxNode.isAttributeDefined("maxRows") == false)
      {
        maxRows = fetchSize;
        amxNode.setAttributeResolvedValue("maxRows", fetchSize);
      }
      else
      {
        maxRows = parseInt(amxNode.getAttribute("maxRows"), 10);
        if (isNaN(maxRows))
        {
          maxRows = fetchSize;
          amxNode.setAttributeResolvedValue("maxRows", fetchSize);
        }
      }
    }
    amxNode.setAttributeResolvedValue("_oldMaxRows", maxRows);

    // See if all the rows have been loaded, if not, force the necessary
    // number of rows to load and then build this node's children
    if (iter.getTotalCount() > iter.getAvailableCount() &&
      iter.getAvailableCount() < maxRows)
    {
      adf.mf.api.amx.showLoadingIndicator();
      adf.mf.api.amx.bulkLoadProviders(dataItems, 0, maxRows, function()
      {
        try
        {
          // Call the framework to have the new children nodes constructed.
          var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
          args.setAffectedAttribute(amxNode, "value");
          args.setAffectedAttribute(amxNode, "_bulkLoad");
          adf.mf.api.amx.markNodeForUpdate(args);
        }
        finally
        {
          adf.mf.api.amx.hideLoadingIndicator();
        }
      },
      function(message, resp)
      {
        adf.mf.api.adf.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
          "createChildrenNodes", "MSG_ITERATOR_FIRST_NEXT_ERROR", message, resp);
        adf.mf.api.amx.hideLoadingIndicator();
      });

      // We want to display a temporary placeholder until the real content can be displayed:
      amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
      amxNode.setAttributeResolvedValue("_placeholder", "yes");
      return adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["DEFERRED"];
    }

    // We no longer want a placeholder to be visible.
    // We can't just set the _placeholder value to null here because the framework will
    // call preDestroy and destroy inbetween the time that render and postDisplay are
    // called. Those 2 calls (preDestroy and destroy) are bogus for listView and we don't
    // want to execute that code until after postDisplay has been called so we need to
    // be able to distinguish this section of the lifecycle from other times.
    // We will set the value to "nomore" for now and then in postDisplay, set it to null:
    amxNode.setAttributeResolvedValue("_placeholder", "nomore");

    // Create the children for the facets outside of the stamps
    amxNode.createStampedChildren(null, ["header", "footer"]);

    var variableName = amxNode.getAttribute("var");
    var valueElExpression = amxNode.getAttributeExpression("value", false, true);

    // Now create the stamped children
    for (var i = 0; i < maxRows && iter.hasNext(); ++i)
    {
      var item = iter.next();
      var children = amxNode.createStampedChildren(iter.getRowKey(), [ null ]);

      adf.mf.el.pushVariable(variableName, item);
      try
      {
        pushElValueReplacement(amxNode, iter, variableName, valueElExpression);

        // Only 1 child should ever be created as only one amx:listItem is supported
        // per stamp.
        this._evaluateDividerAttribute(amxNode, children[0]);
      }
      finally
      {
        adf.mf.el.popVariable(variableName);
        popElValueReplacement(amxNode, iter);
      }
    }

    // Record how many rows were processed (used in the _updateChildrenForCollectionChange)
    amxNode.setAttributeResolvedValue("_rowCount", iter.getCurrentIndex() + 1);

    amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
    return true;
  };

  listView.prototype.attributeChangeResult = function(
    amxNode,
    attributeName,
    attributeChanges)
  {
    switch (attributeName)
    {
      case "dividerAttribute":
      case "dividerMode":
        // Not a common use case, use REPLACE to ensure the AmxNode properties are correctly
        // initialized
        return adf.mf.api.amx.AmxNodeChangeResult["REPLACE"];

      case "value":
        var collectionChange = attributeChanges.getCollectionChange("value");
        var isBulkLoadUpdate = attributeChanges.hasChanged("_bulkLoad");
        if (isBulkLoadUpdate || (collectionChange != null && collectionChange.isItemized()))
        {
          return this._updateChildrenForCollectionChange(
            amxNode,
            attributeChanges,
            collectionChange);
        }
        else
        {
          return adf.mf.api.amx.AmxNodeChangeResult["REPLACE"];
        }

      case "_bulkLoad":
        // Handled by the "value" as both attributes are marked as changed for this use case
        return adf.mf.api.amx.AmxNodeChangeResult["NONE"];

      case "maxRows":
        return this._updateChildrenForCollectionChange(
          amxNode,
          attributeChanges,
          attributeChanges.getCollectionChange("value"));

      case "showMoreStrategy":
        return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];

      case "editMode":
        var newEditMode = amxNode.getAttribute("editMode");
        var oldEditMode = attributeChanges.getOldValue("editMode");
        if (newEditMode == oldEditMode)
        {
          return adf.mf.api.amx.AmxNodeChangeResult["NONE"];
        }

        if (adf.mf.api.amx.isValueTrue(newEditMode))
        {
          return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];
        }

        return adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];

      case "selectedRowKeys":
        amxNode.setAttributeResolvedValue("_selectedRowKey", _getSelectedRowKey(amxNode));
        return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];

      default:
        return listView.superclass.attributeChangeResult.call(this,
          amxNode, attributeName, attributeChanges);
    }
  };

  listView.prototype.visitChildren = function(amxNode, visitContext, callback)
  {
    var dataItems = amxNode.getAttribute("value");

    if (dataItems === undefined)
    {
      // If the children are not being stamped
      return amxNode.visitStampedChildren(null, null, null, visitContext, callback);
    }

    // Visit the header and footer first
    if (amxNode.visitStampedChildren(null, ["header", "footer"], null, visitContext, callback))
    {
      return true;
    }

    // Now visit the stamped children
    var iter = adf.mf.api.amx.createIterator(dataItems);
    var variableName = amxNode.getAttribute("var");
    var valueElExpression = amxNode.getAttributeExpression("value", false, true);

    //TODO: implement an optimized visit if only certain nodes need to be walked
    //var nodesToWalk = visitContext.getChildrenToWalk();
    while (iter.hasNext())
    {
      var item = iter.next();
      adf.mf.el.pushVariable(variableName, item);
      try
      {
        pushElValueReplacement(amxNode, iter, variableName, valueElExpression);

        if (amxNode.visitStampedChildren(iter.getRowKey(), [null], null, visitContext, callback))
        {
          return true;
        }
      }
      finally
      {
        popElValueReplacement(amxNode, iter);
        adf.mf.el.popVariable(variableName);
      }
    }

    return false;
  };

  listView.prototype.render = function(amxNode, id)
  {
    var rootElement = document.createElement("div");
    rootElement.className = "amx-listView";

    if ("cards" == amxNode.getAttribute("layout") &&
        !adf.mf.api.amx.isValueTrue(amxNode.getAttribute("editMode")))
      rootElement.classList.add("amx-listView-cards");
    else
      rootElement.classList.add("amx-listView-rows");

    if ("yes" == amxNode.getAttribute("_placeholder"))
    {
      var placeholder = document.createElement("div");
      placeholder.id = id + "_placeholder";
      placeholder.className = "amx-listView-placeholder amx-deferred-loading";
      var msgLoading = adf.mf.resource.getInfoString("AMXInfoBundle", "MSG_LOADING");
      placeholder.setAttribute("aria-label", msgLoading);
      rootElement.appendChild(placeholder);
      amxNode.setState(adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"]);
      return rootElement;
    }

    this._renderHeaderFacet(amxNode, rootElement);

    // main content div - it contains indexBar, main list and
    // top static divider in case of the android devices
    var listViewContent = document.createElement("div");
    rootElement.appendChild(listViewContent);
    listViewContent.className = "amx-listView-main";

    // list div itself which contains list items elements
    var innerListElement = document.createElement("div");
    listViewContent.appendChild(innerListElement);

    // Adding WAI-ARIA role of list
    innerListElement.setAttribute("role", "list");
    innerListElement.id = id + "_innerList";
    innerListElement.className = "amx-listView-innerList";

    switch (amxNode.getAttribute("halign"))
    {
      case "start":
        innerListElement.style.textAlign = (document.documentElement.dir == "rtl" ? "right" : "left");
        break;
      case "end":
        innerListElement.style.textAlign = (document.documentElement.dir == "rtl" ? "left" : "right");
        break;
      case "center":
        innerListElement.style.textAlign = "center";
        break;
      case "left":
        innerListElement.style.textAlign = "left";
        break;
      case "right":
        innerListElement.style.textAlign = "right";
        break;
    }

    adf.mf.api.amx.enableScrolling(innerListElement);
    var selectedRowKey = amxNode.getAttribute("_selectedRowKey");
    var i;
    var maxRows = amxNode.getAttribute("maxRows");
    var dividerAttrEl = null;

    var dividerAttribute = amxNode.getAttribute("dividerAttribute");
    if (dividerAttribute != null && dividerAttribute != "")
    {
      if (amxNode.getAttribute("sectionIndex") !== "off" &&
        amxNode.getAttribute("dividerMode") === "firstLetter")
      {
        // initialize the register of first letters
        // it is not possible to render items from
        // render function so the mediator is created
        // to allow register callback before the real
        // element exists
        amxNode.setAttributeResolvedValue("_indexBarRegister", {});
        // create indexBar element itself
        var indexBar = document.createElement("div");
        indexBar.className = "amx-listView-index";

        listViewContent.appendChild(indexBar);
      }
      //var useSticky = !adf.mf.api.amx.isValueTrue(amxNode.getAttribute("editMode"));
      //amxNode.setAttributeResolvedValue("_useSticky", useSticky);
    }
    else // no dividers
    {
      // When not using dividers, the innerListElement is the only content element:
      innerListElement.classList.add("amx-listView-content");
      var contentStyle = amxNode.getAttribute("contentStyle");
      if (contentStyle != null)
      {
        var existingStyle = innerListElement.getAttribute("style");
        if (existingStyle != null && existingStyle != "")
          innerListElement.setAttribute("style", existingStyle + ";" + contentStyle);
        else
          innerListElement.setAttribute("style", contentStyle);
      }
    }

    var dataItems = amxNode.getAttribute("value");
    var showMoreRowsLink = false;
    if (dataItems !== undefined)
    {
      var iter = adf.mf.api.amx.createIterator(dataItems);
      var previousListItemAmxNode = null;
      var previousListItemAmxNodeElement = null;

      for (i = 0; i < maxRows && iter.hasNext(); ++i)
      {
        iter.next();
        var children = amxNode.getRenderedChildren(null, iter.getRowKey());
        if (children.length > 0)
        {
          // List view only supports one child per stamp
          var listItemAmxNode = children[0];
          previousListItemAmxNodeElement = this._renderStampedItem(
            false, amxNode, innerListElement, listItemAmxNode, previousListItemAmxNode,
            previousListItemAmxNodeElement);
          previousListItemAmxNode = listItemAmxNode;
        }
      }

      // Add or remove the load more rows link after all the data has been loaded
      showMoreRowsLink = iter.getTotalCount() > maxRows || !iter.isAllDataLoaded();

      if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("showDividerCount")) &&
        amxNode.getAttribute("_dividerAttrEl") != null)
      {
        this._displayDividerCount(innerListElement);
      }

      // The edit mode handle has already been added to listItems.
      // Now we just add the editMode class to the listView.
      if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("editMode")))
      {
        innerListElement.classList.add("amx-listView-editMode");
      }
    }
    else
    {
      // If there is no value attribute, just render the children
      var descendants = amxNode.renderDescendants();
      for (var i = 0, size = descendants.length; i < size; ++i)
      {
        var childDomNode = descendants[i];

        // Store the row key so it can be used in selection management
        var rowKeyString = "" + i;
        if (selectedRowKey == rowKeyString)
          _markRowAsSelected(amxNode, childDomNode);
        childDomNode.setAttribute("data-listViewRk", rowKeyString);

        innerListElement.appendChild(childDomNode);
      }
    }

    // Add or remove the load more rows link after all the data has been loaded
    this._addOrRemoveLoadMoreRowsDom(amxNode, id, innerListElement, showMoreRowsLink, true);

    this._appendFooter(amxNode, rootElement);

    return rootElement;
  };

  listView.prototype.init = function(rootElement, amxNode)
  {
    // We use only one scroll listener for all things scrolling-related;
    // it gets replaced in the refresh phase too:
    var innerListElement = rootElement.querySelector(".amx-listView-innerList");
    this._createScrollHandler(amxNode, innerListElement, rootElement);
  };

  listView.prototype.__getTestJavaScriptURI = function(amxTag)
  {
    return "js/testing/amx-listView.js";
  };

  /**
   * Called after the children listItem AMX nodes have been created by either the
   * createChildrenNodes or updateChildren to set the divider attribute values onto
   * the items.
   *
   * @param {adf.mf.api.amx.AmxNode} listViewAmxNode the AmxNode for the listView
   * @param {adf.mf.api.amx.AmxNode} listItemAmxNode the AmxNode to update
   * @param {Object} iter the dataItems iterator
   */
  listView.prototype._evaluateDividerAttribute = function(
    listViewAmxNode,
    listItemAmxNode)
  {
    var dividerAttribute = listViewAmxNode.getAttribute("dividerAttribute");
    if (dividerAttribute != null && dividerAttribute != "")
    {
      var dividerAttrEl = listViewAmxNode.getAttribute("_dividerAttrEl");
      if (dividerAttrEl == null)
      {
        dividerAttrEl = "#{" + listViewAmxNode.getAttribute("var") + "." + dividerAttribute + "}";
        listViewAmxNode.setAttributeResolvedValue("_dividerAttrEl", dividerAttrEl);
      }

      var dividerValue = this._getCurrentDivider(listViewAmxNode, dividerAttrEl);
      listItemAmxNode.setAttributeResolvedValue("_dividerValue", dividerValue);
    }
  };

  listView.prototype._endLoadMoreRows = function(amxNode)
  {
    var perfOp = amxNode.getAttribute("_loadMoreRowsPerf");
    if (perfOp != null)
    {
      var perfOpTimeout = amxNode.getAttribute("_loadMoreRowsPerfTimeout");
      amxNode.setAttributeResolvedValue("_loadMoreRowsPerf", null);
      amxNode.setAttributeResolvedValue("_loadMoreRowsPerfTimeout", null);

      if (perfOpTimeout != null)
      {
        window.clearTimeout(perfOpTimeout);
      }

      perfOp.stop();
    }
  };

  listView.prototype._createChildForKey = function(
    amxNode,
    key,
    iter,
    maxRows)
  {
    iter.setCurrentRowKey(key);
    // See if this row should be added (it is being inserted so others
    // should be removed)
    if (iter.getCurrentIndex() < maxRows)
    {
      created = amxNode.createStampedChildren(key, [null]);
      if (created.length == 1)
      {
        // Evaluate the divider attribute
        this._evaluateDividerAttribute(amxNode, created[0]);

        return true;
      }
    }

    return false;
  };

  /**
   * Update the children AmxNodes due to a collection model change.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the AmxNode that has been updated
   * @param {adf.mf.api.amx.AmxCollectionChange} collectionChange the information regarding what
   *        collections changes there were. This may be null if this is being called as a result of
   *        bulkLoadProviders being called to fetch more data.
   * @param {adf.mf.api.amx.AmxAttributeChange} attributeChanges the changed attributes
   * @return {number} the updateChildren return value
   */
  listView.prototype._updateChildrenForCollectionChange = function(
    amxNode,
    attributeChanges,
    collectionChange)
  {
    var dataItems = amxNode.getAttribute("value");
    if (dataItems === undefined)
    {
      // We went from having a model to not having one, recreate
      return adf.mf.api.amx.AmxNodeChangeResult["REPLACE"];
    }

    var rowsAddedOrDeleted = false;

    // Setup data that will be available to the refresh function representing what
    // was done in this function.
    var changes =
    {
      "created": {}, // Map of key:true (set of keys)
      "removed": [], // Array of AmxNode IDs
      "updated": [], // Array of keys
      "rowsAdded": false
    };

    attributeChanges.setCustomValue("amxNodeCollectionChanges", changes);

    var rowCount = amxNode.getAttribute("_rowCount");
    var maxRows = amxNode.getAttribute("maxRows");
    var i, numKeys, key, numChildren, c, created, removed;
    var iter = adf.mf.api.amx.createIterator(dataItems);
    var variableName = amxNode.getAttribute("var");
    var valueElExpression = amxNode.getAttributeExpression("value", false, true);

    // The collectionChange will be null if the update is due to a load more rows
    if (collectionChange != null)
    {
      // Dirtied is handled oddly by the JS EL cache side. It will remove the provider from
      // the collection model. Since the provider is not around, the listView cannot handle
      // this change for now as the provider is needed.
      var dirtyKeys = collectionChange.getDirtiedKeys();
      if (dirtyKeys.length > 0)
      {
        var keysToLoad = [];
        // Now see which keys affect those listItems that have been created/rendered
        for (i = 0, numDirty = dirtyKeys.length; i < numDirty; ++i)
        {
          var dirtyKey = dirtyKeys[i];
          iter.setCurrentRowKey(dirtyKey);
          if (iter.getCurrentIndex() < maxRows)
          {
            keysToLoad.push(dirtyKey);
          }
        }

        if (keysToLoad.length > 0)
        {
          var numDirty = keysToLoad.length;
          var numLoaded = 0;
          var rejected = false;

          // Force the loading of the missing rows
          for (var d = 0; d < numDirty; ++d)
          {
            dataItems.setCurrentRowKey(keysToLoad[d]);
            dataItems.nextSet(
              function()
              {
                if (!rejected)
                {
                  if (++numLoaded == numDirty)
                  {
                    // All sets have been loaded
                    var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
                    args.setAffectedAttribute(amxNode, "value");
                    var updateCollectionChange = new adf.mf.api.amx.AmxCollectionChange(
                      {
                        "itemized": true,
                        "updated": keysToLoad
                      });
                    args.setCollectionChanges(amxNode.getId(), "value", updateCollectionChange);
                    adf.mf.api.amx.markNodeForUpdate(args);
                  }
                }
              },

              function()
              {
                rejected = true;
                // TODO: log error
              });
          }
        }
      }

      var updatedKeys = collectionChange.getUpdatedKeys();
      var createdKeys = collectionChange.getCreatedKeys();
      var deletedKeys = collectionChange.getDeletedKeys();
      var oldRowCount = rowCount;

      // See if anything has changed
      if (createdKeys.length > 0 ||
        updatedKeys.length > 0 ||
        deletedKeys.length > 0)
      {
        // Handle deletes
        for (i = 0, numKeys = deletedKeys.length; i < numKeys; ++i)
        {
          var removed = amxNode.removeChildrenByKey(deletedKeys[i]);
          if (removed.length > 0)
          {
            // Record that a key was removed in case more need to be added to satisfy the maxRows
            --rowCount;
            rowsAddedOrDeleted = true;
            for (c = 0, numChildren = removed.length; c < numChildren; ++c)
            {
              changes["removed"].push(removed[c].getId());
            }
          }
        }

        // Handle updates
        for (i = 0, numKeys = updatedKeys.length; i < numKeys; ++i)
        {
          // Get the key
          key = updatedKeys[i];
          if (iter.setCurrentRowKey(key))
          {
            adf.mf.el.pushVariable(variableName, iter.getCurrent());
            try
            {
              pushElValueReplacement(amxNode, iter, variableName, valueElExpression);
              // Note, slice used to create a copy so it will not be modified during changes
              var children = amxNode.getChildren(null, key).slice();

              // Note that the number of children will be zero if there was an update
              // to a key that was not previously rendered (for example if the update
              // was to a row beyond the maxRows)
              for (c = 0, numChildren = children.length; c < numChildren; ++c)
              {
                var oldAmxNode = children[c];

                // Remove the old list item:
                amxNode.removeChild(oldAmxNode);

                // Create the new list item:
                created = amxNode.createStampedChildren(key, [null]);
                if (created.length != 1)
                {
                  // Ensure a child was created
                  return adf.mf.api.amx.AmxNodeChangeResult["REPLACE"];
                }

                // Evaluate the divider attribute
                this._evaluateDividerAttribute(amxNode, created[0]);
              }
            }
            finally
            {
              adf.mf.el.popVariable(variableName);
              popElValueReplacement(amxNode, iter);
            }

            changes["updated"].push(key);
          }
        }

        // Handle inserts
        for (i = 0, numKeys = createdKeys.length; i < numKeys; ++i)
        {
          key = createdKeys[i];
          iter.setCurrentRowKey(key);

          // Ensure adding this row will not cause the count to go above the maxRows
          if (iter.getCurrentIndex() < maxRows)
          {
            // It is possible (due to timing with the bulkLoadProviders calls),
            // that an insert update event may be sent more than once for a provider.
            // If that happens, do not create a node for it
            if (amxNode.getChildren(null, key).length == 0)
            {
              adf.mf.el.pushVariable(variableName, iter.getCurrent());
              try
              {
                pushElValueReplacement(amxNode, iter, variableName, valueElExpression);
                if (this._createChildForKey(amxNode, key, iter, maxRows))
                {
                  ++rowCount;
                  rowsAddedOrDeleted = true;
                  changes["created"][key] = true;
                  changes["rowsAdded"] = true;
                }
                else
                {
                  return adf.mf.api.amx.AmxNodeChangeResult["REPLACE"];
                }
              }
              finally
              {
                adf.mf.el.popVariable(variableName);
                popElValueReplacement(amxNode, iter);
              }
            }
          }
        }

        if (rowCount > maxRows)
        {
          // We now have too many rows, remove them until the maxRows has been satisfied
          iter.setCurrentIndex(maxRows - 1);
          while (rowCount > maxRows && iter.hasNext())
          {
            iter.next();
            key = iter.getRowKey();
            removed = amxNode.removeChildrenByKey(key);
            if (removed.length > 0)
            {
              --rowCount;
              rowsAddedOrDeleted = true;

              // Note, should only be 1
              for (c = 0, numChildren = removed.length; c < numChildren; ++c)
              {
                changes["removed"].push(removed[c].getId());
              }
            }
          }

          // If somehow the rows are not in the collection model that were used to create
          // the previous nodes, then we cannot refresh, just recreate the listView
          if (rowCount > maxRows)
          {
            return adf.mf.api.amx.AmxNodeChangeResult["REPLACE"];
          }
        }
      }
    }

    // See if the row count is less than the max rows. This will either happen if rows
    // were deleted or if this method is a result of a bulkLoadProviders call
    if (rowCount < maxRows && iter.getTotalCount() > rowCount)
    {
      // There are now fewer rows than the maxRows. See if there are items that can
      // be added.
      iter.setCurrentIndex(rowCount - 1);
      for (var i = rowCount; i < maxRows && iter.hasNext(); ++i)
      {
        var item = iter.next();
        var key = iter.getRowKey();
        adf.mf.el.pushVariable(variableName, item);
        try
        {
          pushElValueReplacement(amxNode, iter, variableName, valueElExpression);
          if (this._createChildForKey(amxNode, key, iter, maxRows))
          {
            ++rowCount;
            rowsAddedOrDeleted = true;
            changes["created"][key] = true;
            changes["rowsAdded"] = true;
          }
          else
          {
            return adf.mf.api.amx.AmxNodeChangeResult["REPLACE"];
          }
        }
        finally
        {
          adf.mf.el.popVariable(variableName);
          popElValueReplacement(amxNode, iter);
        }
      }

      // See if we failed to add any as they were not in the cache
      if (iter.getTotalCount() > iter.getAvailableCount() &&
        iter.getAvailableCount() < maxRows)
      {
        // Do not add these rows, but instead schedule a bulk load that will
        // result in a second updateChildren/refresh call
        adf.mf.api.amx.showLoadingIndicator();
        adf.mf.api.amx.bulkLoadProviders(dataItems, 0, maxRows, function()
        {
          try
          {
            // Ensure that the EL context is correct while rendering:
            var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
            args.setAffectedAttribute(amxNode, "value");
            args.setAffectedAttribute(amxNode, "_bulkLoad");
            adf.mf.api.amx.markNodeForUpdate(args);
          }
          finally
          {
            adf.mf.api.amx.hideLoadingIndicator();
          }
        },
        function(req, resp)
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
            "createChildrenNodes", "MSG_ITERATOR_FIRST_NEXT_ERROR", req, resp);
          adf.mf.api.amx.hideLoadingIndicator();
        });
      }
    }

    if (rowsAddedOrDeleted)
    {
      // Ensure the _rowCount is up to date
      amxNode.setAttributeResolvedValue("_rowCount", rowCount);
    }

    return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];
  };

  /**
   * Function to create a scroll event listener to handles:
   * - sticky position of dividers,
   * - buffered viewports,
   * - scrolling-based loading of more pages of rows
   * @param {adf.mf.api.amx.AmxNode} amxNode the AmxNode that has been updated
   * @param {HTMLElement} innerListElement the scrollable element of this listView
   * @param {HTMLElement} rootElement the root element of this listView
   */
  listView.prototype._createScrollHandler = function(
    amxNode,
    scrollableElement,
    rootElement)
  {
    // See if we need are using a showMoreStrategy that involves scrolling:
    var usesShowMoreScroll = false;
    var showMoreStrategy = amxNode.getAttribute("showMoreStrategy");
    if (showMoreStrategy == "autoScroll" || showMoreStrategy == "forceScroll")
    {
      usesShowMoreScroll = true;
    }
    // See if we need are using a bufferStrategy that involves scrolling:
    var usesViewportBuffering = false;
    var bufferStrategy = amxNode.getAttribute("bufferStrategy");
    if (bufferStrategy == "viewport")
    {
      usesViewportBuffering = true;
    }
    adf.mf.api.amx.removeBubbleEventListener(scrollableElement, "scroll");

    var usesStickyPositioning = amxNode.getAttribute("_useSticky");
    /* For now, we want no sticky header support on Android nor iOS because of performance.
    if (adf.mf.internal.amx.agent["type"] != "Android")
    {
      // For now, we only want to support sticky headers on Android devices or
      // in mock browser mode where a skin override is an Android skin.
      // This is because on iOS, the JS-based implementation of sticky headers
      // causes an unwanted jumpy effect during the scroll.
      // In the future, consider a CSS-based solution for iOS instead.

      // See if we are using an Android skin in browser mode:
      var androidSkinInBrowserMode = false;
      if (!adf.mf.environment.profile.dtMode)
      {
        // When using a non-DT, browser-based presentation mode that indicates the
        // skin is for Android, then turn back on sticky positioning:
        if (adf._bootstrapMode == "dev" || adf._bootstrapMode == "hosted")
        {
          var qs = adf.mf.api.getQueryString();
          var skinFolderOverride = adf.mf.api.getQueryStringParamValue(qs, "amx_skin_folder_override");
          var skinOverride = adf.mf.api.getQueryStringParamValue(qs, "amx_skin_override");
          if (skinFolderOverride != null && skinFolderOverride.indexOf("android") != -1)
            androidSkinInBrowserMode = true;
          else if (skinOverride != null && skinOverride.indexOf("android") != -1)
            androidSkinInBrowserMode = true;
        }
      }

      if (!androidSkinInBrowserMode)
        usesStickyPositioning = false; // turn sticky off for iOS
    }*/
    usesStickyPositioning = false; // turn sticky off for Android and iOS

    if (usesStickyPositioning !== true && !usesShowMoreScroll && !usesViewportBuffering &&
        !rootElement.classList.contains("amx-listView-hasScrollClientListener"))
    {
      return; // no need for a scroll listener
    }
    var listViewScrollHandler = function (event)
    {
      var amxNode = event.data[0];
      var typeHandler = event.data[1];
      var id = amxNode.getId();
      var innerListElement = event.target;
      if (!innerListElement || innerListElement.id != id + "_innerList")
      {
        return; // this event came from another descendant, ignore it
      }
      var innerListHeight = innerListElement.offsetHeight;
      if (innerListHeight == null || innerListHeight == 0)
      {
        return; // listView is not displayed
      }
      var inEditMode =
        innerListElement.classList.contains("amx-listView-editMode");

      if (!inEditMode && usesStickyPositioning === true)
      {
        var groups = innerListElement.childNodes;

        for (var i = 0; i < groups.length; i++)
        {
          var groupElement = groups[i];
          var dividerElement = groupElement.childNodes[0];
          var offsetTop = groupElement.offsetTop;
          var offsetHeight = groupElement.offsetHeight;
          var dividerOffsetHeight = dividerElement.offsetHeight;
          var scrollTop = innerListElement.scrollTop;

          // scroll position is intersecting with one bottom divider
          // so listView makes it visible and start to fade it out/in
          // based on direction of scrolling in the same time we hide
          // the top fixed divider so we get naturally looking animation
          if (offsetTop <= scrollTop && scrollTop <= offsetTop + offsetHeight - dividerOffsetHeight)
          {
            if (!groupElement.classList.contains("amx-static"))
            {
              groupElement.classList.add("amx-static");
            }
          }
          else if (groupElement.classList.contains("amx-static"))
          {
            groupElement.classList.remove("amx-static");
          }

          if (scrollTop > offsetTop + offsetHeight - dividerOffsetHeight)
          {
            if (!dividerElement.classList.contains("amx-bottom"))
            {
              dividerElement.classList.add("amx-bottom");
            }
            dividerElement.style.opacity = Math.max(1 - (scrollTop - offsetTop - offsetHeight + dividerOffsetHeight) / dividerOffsetHeight, 0.5);
          }
          else if (dividerElement.classList.contains("amx-bottom"))
          {
            dividerElement.classList.remove("amx-bottom");
            dividerElement.style.opacity = 1;
          }
        }
      }

      if (!inEditMode && usesShowMoreScroll)
      {
        // See if we have a "more rows" indicator and if so, check to see if we
        // have scrolled to the point where we should invoke it:
        var moreRowsElement = document.getElementById(id + "_loadMoreRows");
        if (moreRowsElement != null &&
          innerListElement.scrollHeight != innerListElement.offsetHeight)
        {
          if (!moreRowsElement.classList.contains("amx-listItem-scrollStrategy"))
          {
            // It is possible we got here while still showing a link (because
            // the initial scroll measurements were undefined) so we should
            // apply the style now:
            moreRowsElement.classList.add("amx-listItem-scrollStrategy");
          }

          var lastItemHeight = 0;
          if ("cards" == amxNode.getAttribute("layout") &&
              !adf.mf.api.amx.isValueTrue(amxNode.getAttribute("editMode")))
          {
            // When in card layout mode, we need to adjust the point at which load more via
            // scrolling triggers earlier so the chance of seeing partially-filled rows will be
            // reduced (if the fetch is slow, you'll still see a partial row).
            // In this listView, get all of the last listItems from each group then take the very
            // last one of those and use its height as the trigger.
            var lastListItems = innerListElement.querySelectorAll(".amx-listItem.amx-node:last-child");
            if (lastListItems != null)
            {
              var lastListItemCount = lastListItems.length;
              if (lastListItemCount == 0)
              {
                // The previous query will be empty if not using dividers so try an alternate one:
                lastListItems = innerListElement.querySelectorAll(".amx-listItem.amx-node");
              }
              if (lastListItems != null)
              {
                lastListItemCount = lastListItems.length;
                if (lastListItemCount > 1)
                {
                  var veryLastListItem = lastListItems[lastListItemCount-1];
                  lastItemHeight = veryLastListItem.offsetHeight;
                }
              }
            }
          }

          if (innerListElement.scrollTop >
            innerListElement.scrollHeight - innerListElement.offsetHeight - moreRowsElement.offsetHeight - lastItemHeight)
          {
            // prevent-double query
            if (!moreRowsElement.classList.contains("amx-listItem-scrollStrategyLoading"))
            {
              // Since permanent animating GIFs are bad for performance, we only
              // make it animate when we are actually doing the load:
              moreRowsElement.classList.add("amx-listItem-scrollStrategyLoading");

              // Use a timer to allow the animation to kick in plus this will
              // unblock the scroll thread:
              requestAnimationFramePolyfill(
                function()
                {
                  var typeHandler = amxNode.getTypeHandler();
                  typeHandler._handleMoreRowsAction(amxNode);
                });
            }
          }
        }
      }

      if (usesViewportBuffering)
      {
        typeHandler._updateViewportBuffer(amxNode, innerListElement);
      }

      var rootElement = document.getElementById(id);
      if (rootElement.classList.contains("amx-listView-hasScrollClientListener"))
      {
        var event = new adf.mf.api.amx.DomEvent(id, "scroll", event);
        adf.mf.api.amx.processAmxEvent(amxNode, "scroll", undefined, undefined, event, function() {});
      }
    };

    // Register for the scroll listener
    adf.mf.api.amx.addBubbleEventListener(scrollableElement, "scroll", listViewScrollHandler, [amxNode, this]);

    // Invoke the scroll listener for initial positioning but delay it after a
    // screen paint so that it actually does something meaningful:
    var typeHandler = this;
    requestAnimationFramePolyfill(function()
      {
        listViewScrollHandler({ "target": scrollableElement, "data": [ amxNode, typeHandler ] });
      });
  };

  /**
   * Update which rows of the listView are to be displayed based on the size
   * of the viewport and the extra bufferSize distance from the edges of the
   * viewport.
   * @param {adf.mf.api.amx.AmxNode} amxNode the AmxNode that has been updated
   * @param {HTMLElement} innerListElement the scrollable row container
   */
  listView.prototype._updateViewportBuffer = function(amxNode, innerListElement)
  {
    var bufferSize = parseInt(amxNode.getAttribute("bufferSize"), 10);
    if (isNaN(bufferSize) || bufferSize < 0)
      bufferSize = 100; // number of pixels beyond the viewport to keep

    var viewportScrollTop = Math.max(0, innerListElement.scrollTop); // restrain for overscroll flicker
    var viewportHeight = innerListElement.offsetHeight;
    var viewportScrollHeight = innerListElement.scrollHeight;
    viewportScrollTop = Math.min(viewportScrollTop, viewportScrollHeight - viewportHeight); // restrain for overscroll flicker
    var innerListChildren = innerListElement.childNodes;
    var minChildTop = viewportScrollTop - bufferSize;
    var maxChildTop = viewportScrollTop + viewportHeight + bufferSize;
    var gatheredInfo =
      {
        outsideViewport: [],
        insideViewport: []
      };

    // Find all of the rows (even searching inside of groups) so that
    // we can later change their display as needed.
    // It is important to note that we are simply gathering the list
    // of row elements in this loop and not making any changes to styles
    // or classes because making changes like that while examining details
    // about the elements would trigger the browser to perform an
    // expensive re-layout. We will make our changes after we've gathered
    // all of the info.
    for (var i = 0, innerListChildCount=innerListChildren.length; i < innerListChildCount; ++i)
    {
      var innerListChild = innerListChildren[i];

      if (innerListChild.classList.contains("amx-listItem-moreRows"))
      {
        continue; // never mess with this type of element
      }

      var isGroup = innerListChild.classList.contains("amx-listView-group");
      if (isGroup)
      {
        var groupChildren = innerListChild.childNodes;
        for (var j = 0, groupChildCount=groupChildren.length; j < groupChildCount; ++j)
        {
          var groupChild = groupChildren[j];
          var groupTop = innerListChild.offsetTop;
          if (groupChild.classList.contains("amx-listView-divider") ||
            groupChild.classList.contains("amx-listItem-undisclosed"))
          {
            continue; // never mess with this type of element
          }
          if (innerListChild.classList.contains("amx-static"))
          {
            // If the group is statically-positioned, we don't need a separate groupTop:
            groupTop = 0;
          }
          this._gatherViewportChildInfo(groupChild, minChildTop, maxChildTop, groupTop, gatheredInfo);
        }
      }
      else
      {
        // Not a group:
        this._gatherViewportChildInfo(innerListChild, minChildTop, maxChildTop, 0, gatheredInfo);
      }
    }

    // Now that we have gathered all of the info we needed, we can now
    // make the changes that would trigger an expensive browser re-layout.
    this._adjustViewportChildren(gatheredInfo.outsideViewport, false);
    this._adjustViewportChildren(gatheredInfo.insideViewport, true);
  };

  /**
   * Determine whether the given element is within the viewport range
   * so that we will mark it has hidden or shown.
   * @param {HTMLElement} viewportChild the viewport child to examine
   * @param {Number} minChildTop the minimum offset top for displaying
   * @param {Number} maxChildTop the maximum offset top for displaying
   * @param {Number} extraTop if the child is inside of a group, its offset
   *                          value will be relative to the group, this
   *                          number that needs to be added to the offset
   *                          so that we are relative to the scrollable area
   * @param {Object} gatheredInfo an object with lists to store the data
   *                              that we need to make display changes later
   */
  listView.prototype._gatherViewportChildInfo = function(
    viewportChild, minChildTop, maxChildTop, extraTop, gatheredInfo)
  {
    var offsetTop = viewportChild.offsetTop + extraTop;
    var offsetHeight = viewportChild.offsetHeight;

    var viewportDebug = false; // whether to add extra debug info on the DOM
    if (offsetTop + offsetHeight < minChildTop)
    {
      // Element is now above the viewport
      gatheredInfo.outsideViewport.push(viewportChild);
      if (viewportDebug)
      {
        viewportChild.setAttribute(
          "data-viewportDebug",
          "above ot+oh=" + (offsetTop + offsetHeight) +
            " < min=" + minChildTop +
            ", ot=" + offsetTop +
            ", oh=" + offsetHeight);
      }
    }
    else if (offsetTop > maxChildTop)
    {
      // Element is now below the viewport
      gatheredInfo.outsideViewport.push(viewportChild);
      if (viewportDebug)
      {
        viewportChild.setAttribute(
          "data-viewportDebug",
          "below ot=" + offsetTop + " > max=" + maxChildTop);
      }
    }
    else
    {
      // Element is inside the viewport
      gatheredInfo.insideViewport.push(viewportChild);
      if (viewportDebug)
      {
        viewportChild.setAttribute(
          "data-viewportDebug",
          "inside min=" + minChildTop +
            ", max=" + maxChildTop +
            ", ot=" + offsetTop +
            ", oh=" + offsetHeight);
      }
    }
  };

  /**
   * From a list of gathered data, hide or show row contents.
   * @param {Array} viewportData an array of row elements
   * @param {Boolean} toReveal whether the contents are to be shown or hidden
   */
  listView.prototype._adjustViewportChildren = function(viewportData, toReveal)
  {
    for (i = 0, aboveCount=viewportData.length; i < aboveCount; ++i)
    {
      var childElement = viewportData[i];
      if (toReveal)
      {
        if (childElement.classList.contains("amx-listItem-outsideOfBuffer"))
        {
          // Restore the existing style width/height:
          childElement.style.height = childElement.getAttribute("data-sh");
          childElement.style.width = childElement.getAttribute("data-sw");
          childElement.classList.remove("amx-listItem-outsideOfBuffer");
        }
      }
      else // to be hidden
      {
        if (!childElement.classList.contains("amx-listItem-outsideOfBuffer"))
        {
          // Save off the existing style width/height for restoration later:
          childElement.setAttribute("data-sh", childElement.style.height);
          childElement.setAttribute("data-sw", childElement.style.width);

          // Force the current dimensions since we are about to hide the contents of the listItem
          childElement.style.height = childElement.offsetHeight + "px";
          childElement.style.width = childElement.offsetWidth + "px";
          childElement.classList.add("amx-listItem-outsideOfBuffer");
        }
      }
    }
  };

  listView.prototype.postDisplay = function(rootElement, amxNode)
  {
    if ("yes" == amxNode.getAttribute("_placeholder"))
      return; // this function is not applicable for placeholders
    else if ("nomore" == amxNode.getAttribute("_placeholder"))
    {
      amxNode.setAttributeResolvedValue("_placeholder", null); // now null for real

      if (amxNode.getState() == adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"])
      {
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["RENDERED"]);
      }
    }

    // Restore the old scroll position in case this view instance already had one:
    var innerListElement = rootElement.querySelector(".amx-listView-innerList");
    this._restoreScrollPosition(amxNode, innerListElement);

    // Creates items in the index bar:
    createIndexBarItems(rootElement, amxNode);

    var data = {
      "innerListElement": innerListElement,
      "typeHandler":      this,
      "amxNode":          amxNode
    };
    _setVolatileStateProperty(amxNode, "resizeData", data);

    // Listen if someone resizes the window:
    adf.mf.api.amx.addBubbleEventListener(window, "resize", this._handleResize, data);

    // Listen if someone explicitly queues a resize on my root element:
    adf.mf.api.amx.addBubbleEventListener(rootElement, "resize", this._handleResize, data);
  };

  listView.prototype._handleResize = function(event)
  {
    var innerListElement = event.data.innerListElement;
    var typeHandler      = event.data.typeHandler;
    var amxNode          = event.data.amxNode;

    if (innerListElement != null)
    {
      var bufferStrategy = amxNode.getAttribute("bufferStrategy");
      if (bufferStrategy == "viewport")
        typeHandler._updateViewportBuffer(amxNode, innerListElement);
    }
  };

  /**
   * In order to prevent removal of all window resize handlers, we need to
   * make a formal function and use it in the removeBubbleEventListener calls.
   * @param {Object} event the resize event
   */
  var indexBarResizeHandler = function(event)
  {
    // in case of the resize it is important to
    // repaint whole index area
    var amxNode = event.data;
    var id = amxNode.getId();
    var rootElement = document.getElementById(id);

    // Purge the cached heights:
    var indexBar = rootElement.querySelector(".amx-listView-index");
    if (indexBar != null)
    {
      indexBar._amxLinkHeight = null;
      indexBar._amxTotalHeight = null;
    }

    createIndexBarItems(rootElement, amxNode, false);
  };

  /**
   * @param rootElement
   * @param amxNode
   * @param newIndex
   */
  var createIndexBarItems = function(rootElement, amxNode, newIndex)
  {
    var indexBar = rootElement.querySelector(".amx-listView-index");
    var innerListElement = document.getElementById(amxNode.getId() + "_innerList");

    if (indexBar !== null)
    {
      var register = amxNode.getAttribute("_indexBarRegister");
      if (register)
      {
        rootElement.classList.add("amx-listView-has-index");

        // load index info from resources
        var indexString = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_listView_INDEX_STRING").toUpperCase();
        var otherLetterChar = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_listView_INDEX_OTHERS").toUpperCase();
        var indexDivider = String.fromCharCode(9679); // bullet character
        // erase the content of the index bar
        adf.mf.api.amx.emptyHtmlElement(indexBar);

        // Add an extended target area so the user can have greater success in
        // touching the index bar:
        var indexBarTargetArea = document.createElement("div");
        indexBarTargetArea.className = "amx-extendedTarget";
        indexBar.appendChild(indexBarTargetArea);

        // INDEX 0 -- create the first letter into the index
        var link =
          createListViewIndexItem(
            innerListElement,
            indexBar,
            indexString.charAt(0),
            register[indexString.charAt(0)]!=null,
            "amx-listView-indexCharacter",
            null);

        // this first letter provides height of the items for the further
        // calculations
        var indexLinkHeight = indexBar._amxLinkHeight;
        if (indexLinkHeight == null)
        {
          indexLinkHeight = link.offsetHeight;
          indexBar._amxLinkHeight = indexLinkHeight; // will be purged on resize
        }

        if (newIndex !== false)
        {
          // don't register this listener from inside calls
          adf.mf.api.amx.addBubbleEventListener(window, "resize", indexBarResizeHandler, amxNode);

          var lastIndex = undefined;
          adf.mf.api.amx.addDragListener(
            indexBar,
            {
              "start":
                function(event, dragExtra)
                {
                  // disable manual scrolling of the list to prevent
                  // items move during the drag
                  innerListElement.classList.add("amx-listView-scrollable-disabled");
                  lastIndex = undefined;
                },
              "drag":
                function(event, dragExtra)
                {
                  event.preventDefault();
                  event.stopPropagation();
                  var offsetTop = adf.mf.internal.amx.getElementTop(indexBar);
                  var yWithinBar = dragExtra.pageY - offsetTop;
                  lastIndex =
                    _handleIndexBarTrigger(
                      indexBar,
                      innerListElement,
                      yWithinBar,
                      indexLinkHeight,
                      indexString,
                      otherLetterChar,
                      register,
                      lastIndex,
                      false); // use false so that dragging is more responsive
                },
              "end":
                function(event, dragExtra)
                {
                  // allow manual scrolling after the drag is finished
                  innerListElement.classList.remove("amx-listView-scrollable-disabled");
                }
            });

          adf.mf.api.amx.addBubbleEventListener(
            indexBar,
            "tap",
            function(event)
            {
              event.preventDefault();
              event.stopPropagation();
              var offsetTop = adf.mf.internal.amx.getElementTop(indexBar);

              var pageY;
              if (event.touches && event.touches.length > 0)
                pageY = event.touches[0].pageY;
              else if (event.changedTouches && event.changedTouches.length > 0)
                pageY = event.changedTouches[0].pageY;
              else
                pageY = event.pageY;

              var yWithinBar = pageY - offsetTop;
              lastIndex =
                _handleIndexBarTrigger(
                  indexBar,
                  innerListElement,
                  yWithinBar,
                  indexLinkHeight,
                  indexString,
                  otherLetterChar,
                  register,
                  lastIndex,
                  true); // use true because repeated taps are rare
            });
        }

        // get total height of the index bar to allow proper item distribution
        var totalHeight = indexBar._amxTotalHeight;
        if (totalHeight == null)
        {
          totalHeight = indexBar.offsetHeight;
          indexBar._amxTotalHeight = totalHeight; // will be purged on resize
        }
        if (totalHeight === 0)
          totalHeight = indexLinkHeight;

        // Count how many index items we can fit in the listView
        var spotsToShow = Math.floor(totalHeight / indexLinkHeight);
        var indexCount = indexString.length;
        var maxIndexCountWithOther = indexCount+1;
        if (spotsToShow < maxIndexCountWithOther && spotsToShow % 2 == 1)
        {
          // We can only have an even number if using skip groups so subtract one:
          --spotsToShow;
        }
        if (spotsToShow < 4)
        {
          // Remove the index bar when there is not enough space for three items and one bullet
          // divider:
          adf.mf.api.amx.removeDomNode(indexBar);
          return;
        }

        // When there is not enough space for all the index items and one item for the unknown
        // character, then the listView has to calculate number of items that must be skipped to
        // achieve regular distribution of the items.
        var finalIndex = indexCount-1;
        var itemCountPerSkip = 0;
        if (spotsToShow < maxIndexCountWithOther)
        {
          // Determine how many items that we have to skip in order to distribute items regurarly
          // into the index bar.
          // We want to show at least (and disperse items if possible between the 1st and last):
          //  - the 1st character
          //  - the last character
          //  - the "other" character
          // This leaves (spotsToShow - 3) spots to fill from a possible (indexCount - 2) items.
          var spotsToFill = (spotsToShow - 3);
          var explicitFillSpotCount = Math.floor(spotsToFill / 2); // spots with real characters
          var skipSpotCount = explicitFillSpotCount + 1; // spots with bullet characters
          var fillerItemCountToChooseFrom = indexCount - 2; // e.g. exclude "A" and "Z"
          var fillerSkipItemCount = fillerItemCountToChooseFrom - explicitFillSpotCount; // non-explicit char count

          // We use floor because we want any excess items given to the last skip group.
          var decimalItemsPerSkip = fillerSkipItemCount / skipSpotCount;
          itemCountPerSkip = Math.floor(decimalItemsPerSkip); // non-explicit char count in each skip group

          // However, when doing a floor, we may end up in a situation where there are too many
          // skip groups which would make the index bar too tall to fit so in that case we will do a
          // ceil instead; if at least one more skip group will fit using the skip count, use ceil:
          if (fillerSkipItemCount > itemCountPerSkip * skipSpotCount + 1) // too many skip groups
            itemCountPerSkip = Math.ceil(decimalItemsPerSkip);
        }

        // Calculate the members of each skip group.
        // In order to determine whether the index item is shown in an active manner, we need to
        // determine which characters are explicitly shown and which belong to skip groups.
        // If there is at least one member of a skip group that is active (one member of a bullet),
        // then that group needs to be displayed as active, otherwise it will be shown as inactive.
        var toShow = indexString[0];
        var toSkip = "_";
        var numberTilExplicit = itemCountPerSkip + 1;
        for (var i = 1; i < finalIndex; ++i)
        {
          if (i % numberTilExplicit == 0 && i+numberTilExplicit <= finalIndex)
          {
            toShow += indexString[i];
            toSkip += "_";
          }
          else
          {
            toShow += "_";
            toSkip += indexString[i];
          }
        }
        toSkip += "_";
        toShow += indexString[finalIndex];

        var debug = false;
        if (debug)
        {
          // Print lines to visualize the explicit and skip characters:
          console.log("raw ", indexString + otherLetterChar);
          console.log("show", toShow + otherLetterChar);
          console.log("skip", toSkip + "_");
        }

        // Now that we know what exists in each skip group, we can begin adding the index items to
        // the bar.
        var active = false;
        var skipList = null;
        for (var i = 1; i <= finalIndex; ++i)
        {
          var showChar = toShow[i];
          if (showChar == "_")
          {
            var skipChar = toSkip[i];
            active = active || register[skipChar]; // group is active if there's even just 1 active
            if (skipList == null)
              skipList = [];
            skipList.push(skipChar);
          }
          else // explicitly show this char
          {
            // Take care of a skip group that we first need to add to the index bar if applicable:
            if (skipList != null)
            {
              createListViewIndexItem(
                innerListElement,
                indexBar,
                indexDivider,
                active,
                "amx-listView-indexBullet",
                skipList.join(""));
            }

            // Add the shown char:
            active = (register[showChar] !== undefined);
            createListViewIndexItem(
              innerListElement,
              indexBar,
              showChar,
              active,
              "amx-listView-indexCharacter",
              showChar);

            // Reset the state in case we encounter another skip group:
            active = false;
            skipList = null;
          }
        }

        // OTHER INDEX -- insert character for the unknown letters
        createListViewIndexItem(
          innerListElement,
          indexBar,
          otherLetterChar,
          register[otherLetterChar]!=null,
          "amx-listView-indexOther",
          null);
      }
      else
      {
        // remove index bar when no index register is available
        adf.mf.api.amx.removeDomNode(indexBar);
      }
    }
  }

  /**
   * Create an index DOM entry.
   * @param {HTMLElement} innerListElement the scrollable that this index controls
   * @param {HTMLElement} indexBar the container for the index
   * @param {string} character the character presented to the user for this index item
   * @param {boolean} active whether this index item should be presented as active (has a corresponding divider)
   * @param {string} extraClass an additional style class to append to the link's class name that indicates which kind of index item it is
   * @param {string} range the character or characters that this item represents
   * @return {HTMLElement} the DOM element that represents this one item of the listView's index
   */
  var createListViewIndexItem = function(innerListElement, indexBar, character, active, extraClass, range)
  {
    var link = document.createElement("div");
    var className = "amx-listView-indexItem";
    if (active)
      className += " amx-listView-indexItem-active";

    link.className = className + " " + extraClass;
    link.textContent = "" + character;
    if (range == null)
      range = character;
    link.setAttribute("data-range", range);
    indexBar.appendChild(link);

    return link;
  }

  /**
   * Handle a drag or tap on the index bar.
   * @param {HTMLElement} indexBar the element for the entire index bar
   * @param {HTMLElement} innerListElement the scrollable area that the index is controlling
   * @param {number} yWithinBar the number of px from the top of the indexBar that this event occurred
   * @param {number} indexLinkHeight the height of each link in the index
   * @param {string} indexString the main portion of index characters (in order)
   * @param {string} otherLetterChar the final portion of the index characters
   * @param {Object.<string, Function>} register the map of functions that scroll to a specific index character
   * @param {number} lastIndex the last index (or undefined) that was visited
   * @param {boolean} alwaysJump whether to jump regardless of whether the we last jumped to that spot
   * @return {number} the new value for lastIndex
   */
  var _handleIndexBarTrigger = function(
    indexBar,
    innerListElement,
    yWithinBar,
    indexLinkHeight,
    indexString,
    otherLetterChar,
    register,
    lastIndex,
    alwaysJump)
  {
    var indexBarTotalHeight = indexBar.offsetHeight;

    // count the size of the one item
    var threshold = (indexBarTotalHeight - indexLinkHeight) / indexString.length;

    // get index of the letter from drag position
    var targetIndex = Math.round((yWithinBar) / threshold);
    var indexStringLength = indexString.length;

    if (targetIndex < indexStringLength) // the target is a non-other index item
    {
      if (lastIndex !== targetIndex || alwaysJump)
      {
        // find callback in register and fire it just
        // once until it is changed to another letter
        if (register[indexString.charAt(targetIndex)])
        {
          lastIndex = targetIndex;
          register[indexString.charAt(targetIndex)]();
        }
        else // find nearest header
        {
          // Start at the target and search above/below it:
          lastIndex = undefined;
          for (var i = 0; i < indexStringLength; ++i)
          {
            var aboveIndex = targetIndex - i;
            var belowIndex = targetIndex + i;
            if (belowIndex >= indexStringLength)
            {
              // We are closer to the end so scroll there instead:
              if (register[otherLetterChar]) // the last header (if exists)
              {
                lastIndex = -1;
                register[otherLetterChar]();
              }
              else // otherwise just scroll to the bottom
              {
                lastIndex = undefined; // let people keep revisiting the bottom (it might fetch more)
                innerListElement.scrollTop = innerListElement.scrollHeight;
              }
              break;
            }
            else if (aboveIndex >= 0 && register[indexString.charAt(aboveIndex)])
            {
              lastIndex = aboveIndex;
              register[indexString.charAt(aboveIndex)]();
              break;
            }
            else if (belowIndex < indexStringLength && register[indexString.charAt(belowIndex)])
            {
              lastIndex = belowIndex;
              register[indexString.charAt(belowIndex)]();
              break;
            }
          }
        }
      }
    }
    else // the target belongs to the "other letter" area of the index
    {
      if (lastIndex !== -1 || alwaysJump)
      {
        // fire other letter event when new index is out of range
        if (register[otherLetterChar])
        {
          lastIndex = -1;
          register[otherLetterChar]();
        }
        else // scroll to the bottom
        {
          lastIndex = undefined; // let people keep revisiting the bottom (it might fetch more)
          innerListElement.scrollTop = innerListElement.scrollHeight;
        }
      }
    }

    return lastIndex;
  };

  listView.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    listView.superclass.refresh.call(this, amxNode, attributeChanges, descendentChanges);

    if ("yes" == amxNode.getAttribute("_placeholder"))
      return; // this function is not applicable for placeholders

    var id = amxNode.getId();
    var rootElement = document.getElementById(id);
    var innerListElement = document.getElementById(id + "_innerList");
    var collectionChange = attributeChanges.getCollectionChange("value");

    // Get the changes recorded during the _updateChildrenForCollectionChange method. This
    // will be null if the value did not change or if the collection change cannot be handled
    var collectionChanges = attributeChanges.getCustomValue("amxNodeCollectionChanges");

    // See if the value changed
    if (collectionChanges != null)
    {
      this._refreshCollectionChanges(
          amxNode,
          collectionChanges,
          rootElement,
          innerListElement);
    }

    if (attributeChanges.hasChanged("editMode"))
    {
      // The updateChildren function already checked that the new edit mode is
      // true, so we do not need to check it here. Just switch to the edit mode
      switchToEditMode(this, amxNode, innerListElement, rootElement);

      if (rootElement.classList.contains("amx-listView-cards"))
      {
        // Force to "rows" layout when in edit mode:
        rootElement.classList.remove("amx-listView-cards");
        rootElement.classList.add("amx-listView-rows");
      }

      //amxNode.setAttributeResolvedValue("_useSticky", false);
    }

    if (attributeChanges.hasChanged("selectedRowKeys"))
    {
      var selectedRowKey = amxNode.getAttribute("_selectedRowKey");

      // Unselect the old list item
      if (attributeChanges.getOldValue("selectedRowKeys") != null)
      {
        var selectedListItemElem = rootElement.querySelector(".amx-listItem-selected");
        if (selectedListItemElem != null)
        {
          _markRowAsUnselected(selectedListItemElem);
        }
      }

      // Find the AmxNode for the given row key
      var amxListItems = amxNode.getChildren(null, selectedRowKey);
      if (amxListItems.length > 0)
      {
        var element = document.getElementById(amxListItems[0].getId());
        if (element != null)
        {
          _markRowAsSelected(amxNode, element);
        }
      }
    }

    // If the collection has changed or the show strategy, check if the load more rows DOM
    // needs to be updated
    if (attributeChanges.hasChanged("showMoreStrategy") ||
      attributeChanges.hasChanged("value") ||
      collectionChanges != null)
    {
      var showMoreRowsLink = false;
      var dataItems = amxNode.getAttribute("value");
      if (dataItems != null) // e.g. using literal listItems instead
      {
        var iter = adf.mf.api.amx.createIterator(dataItems);
        var maxRows = amxNode.getAttribute("maxRows");
        showMoreRowsLink = iter.getTotalCount() > maxRows || !iter.isAllDataLoaded();
      }

      this._addOrRemoveLoadMoreRowsDom(amxNode, id, innerListElement, showMoreRowsLink, false);

      if (attributeChanges.hasChanged("showMoreStrategy"))
      {
        // Reset the scroll handler in case the value has changed from scrolling to link or
        // vice versa
        this._createScrollHandler(amxNode, innerListElement, rootElement);
      }

      // Update the view port if necessary
      if (amxNode.getAttribute("bufferStrategy") == "viewport")
      {
        this._updateViewportBuffer(amxNode, innerListElement);
      }
    }

    // Update the client state
    this._storeClientState(amxNode, innerListElement);

    // Consider it the end of a load more rows if we added any rows
    if (collectionChanges != null &&
      collectionChanges["rowsAdded"] &&
      amxNode.getAttribute("_loadMoreRowsPerf") != null)
    {
      this._endLoadMoreRows(amxNode);
    }
  };

  listView.prototype.preDestroy = function(rootElement, amxNode)
  {
    // this function is not applicable for placeholders or until postDisplay is called after a
    // placeholder
    if (amxNode.getAttribute("_placeholder") != null)
      return;

    // Store off the current scroll position in case this view instance is ever revisited:
    this._storeClientState(amxNode, document.getElementById(amxNode.getId() + "_innerList"));

    // Clean up the window resize listeners:
    var volatileState = amxNode.getVolatileState();
    if (volatileState)
    {
      var listViewResizeData = volatileState["resizeData"];
      if (listViewResizeData)
      {
        adf.mf.api.amx.removeBubbleEventListener(window, "resize", this._handleResize, listViewResizeData);
      }
    }
    adf.mf.api.amx.removeBubbleEventListener(window, "resize", indexBarResizeHandler, amxNode);
  };

  listView.prototype.destroy = function(rootElement, amxNode)
  {
    // this function is not applicable for placeholders or until postDisplay is called after a
    // placeholder
    if (amxNode.getAttribute("_placeholder") != null)
      return;

    // remove scroll handler that animates dividers if such exists
    var innerListElement = rootElement.querySelector(".amx-listView-innerList");
    if (innerListElement)
    {
      adf.mf.api.amx.removeBubbleEventListener(innerListElement, "scroll");
    }

    // remove item bar's item handlers
    var indexBar = rootElement.querySelector(".amx-listView-index");
    if (indexBar)
    {
      adf.mf.api.amx.removeBubbleEventListener(window, "resize", indexBarResizeHandler, amxNode);
    }
  }

  /**
   * Perform an animated removal of a listItem or group.
   * {HTMLElement} element The listItem element or divider group element
   * {boolean} cards Whether this listView is using layout="cards"
   * {String} animationMarkerClass The marker CSS class for enabling animation
   * {String} animationTransitionClass The marker CSS class for executing animation
   * {Function} afterAnimateFunction The function to invoke when the animation is complete
   */
  listView.prototype._animatedRemoval = function(
    element,
    cards,
    animationMarkerClass,
    animationTransitionClass,
    afterAnimateFunction)
  {
    var offsetHeight = element.offsetHeight;
    var elementStyle = element.style;
    elementStyle.height = offsetHeight + "px";
    elementStyle.minHeight = offsetHeight + "px";
    if (cards)
      elementStyle.width = element.offsetWidth + "px";
    element.classList.add(animationMarkerClass);
    adf.mf.internal.amx.stripIds(element);
    adf.shared.impl.animationUtils._requestAnimationFrame(
      function()
      {
        element.classList.add(animationTransitionClass);
        elementStyle = element.style;
        elementStyle.height = "0";
        elementStyle.minHeight = "0";
        if (cards)
          elementStyle.width = "0";
        adf.shared.impl.animationUtils.addOneTimeTransitionEndWithFailsafe(
          element,
          afterAnimateFunction);
      });
  };

  /**
   * Removes a listItem row and its surrounding group if this is the last listItem
   * of the group.
   * {adf.mf.api.amx.AmxNode} listViewAmxNode The AmxNode of the listView
   * {String} listItemAmxNodeIdToRemove The ID of the listItem to remove
   */
  listView.prototype._removeListItemByAmxNode = function(
    listViewAmxNode,
    listItemAmxNodeIdToRemove)
  {
    var listItemDomElement = document.getElementById(listItemAmxNodeIdToRemove);
    var listItemAmxNode = adf.mf.api.amx.AmxNode.getAmxNodeForElement(listItemDomElement);
    if (listItemDomElement != null && listItemDomElement.parentNode != null)
    {
      var promises = [];
      var parentNode = listItemDomElement.parentNode;
      var cards = ("cards" == listViewAmxNode.getAttribute("layout"));
      var indexNeedsUpdate = false;
      var typeHandler = this;
      typeHandler._animationStarted(listViewAmxNode);
      var animationInProgressClass = "amx-animating"; // a loading contributor
      listItemDomElement.classList.add(animationInProgressClass);
      promises.push(
        new adf.mf.internal.BasePromise(
          function(resolve, reject)
          {
            typeHandler._animatedRemoval(
              listItemDomElement, cards, "amx-listItem-delete", "amx-listItem-delete-active",
              function()
              {
                adf.mf.api.amx.removeDomNode(listItemDomElement);
                resolve();
              });
          }));

      // See if this node was in a divider group
      if (parentNode.classList.contains("amx-listView-group"))
      {
        // See if there are any list items left in this group
        if (parentNode.querySelector(".amx-listItem.amx-node:not(.amx-listItem-delete)") == null)
        {
          // There are no remaining list items, remove the divider group
          parentNode.classList.add(animationInProgressClass);
          promises.push(
            new adf.mf.internal.BasePromise(
              function(resolve, reject)
              {
                typeHandler._animatedRemoval(
                  parentNode, cards, "amx-listItem-delete", "amx-listItem-delete-active",
                  function()
                  {
                    // Register callback function that will allow to jump to divider that
                    // corresponds to the letter in the index
                    var dividerValue = listItemAmxNode.getAttribute("_dividerValue");
                    var register = listViewAmxNode.getAttribute("_indexBarRegister");
                    if (register != null && register[dividerValue] != null)
                    {
                      delete register[dividerValue];
                      indexNeedsUpdate = true;
                    }

                    adf.mf.api.amx.removeDomNode(parentNode);

                    resolve();
                  });
              }));
        }
      }

      // Once all of the promises have resolved, update the viewport buffer since some
      // listItems might now need to be revealed:
      adf.mf.internal.BasePromise.all(promises).then(
        function()
        {
          var listViewId = listViewAmxNode.getId();

          typeHandler._accountForScrollPositionChanges(listViewAmxNode, typeHandler);

          // Refresh items in the bar acording to the value change
          if (indexNeedsUpdate)
          {
            var rootElement = document.getElementById(listViewId);
            if (rootElement)
              createIndexBarItems(rootElement, listViewAmxNode, false);
          }

          typeHandler._animationEnded(listViewAmxNode);
        });
    }
  };

  /**
   * Perform an animated insert of a listItem.
   * {adf.mf.api.amx.AmxNode} listViewAmxNode The AmxNode of the listView
   * {HTMLElement} listItemElement The listItem element to insert
   */
  listView.prototype._animateListItemInsert = function(
    listViewAmxNode,
    listItemElement)
  {
    var animationInProgressClass = "amx-animating"; // a loading contributor
    var animationMarkerClass = "amx-listItem-insert";
    var animationTransitionClass = "amx-listItem-insert-active";
    var typeHandler = this;
    typeHandler._animationStarted(listViewAmxNode);
    var cards = ("cards" == listViewAmxNode.getAttribute("layout"));
    var listItemStyle = listItemElement.style;
    var originalWidth = listItemStyle.width;
    var originalHeight = listItemStyle.height;
    var originalMinHeight = listItemStyle.minHeight;
    var offsetWidth = listItemElement.offsetWidth;
    var offsetHeight = listItemElement.offsetHeight;
    listItemStyle.height = "0";
    listItemStyle.minHeight = "0";
    if (cards)
      listItemStyle.width = "0";
    listItemElement.classList.add(animationMarkerClass);
    listItemElement.classList.add(animationInProgressClass);
    adf.shared.impl.animationUtils._requestAnimationFrame(
      function()
      {
        listItemElement.classList.add(animationTransitionClass);
        listItemStyle = listItemElement.style;
        listItemStyle.height = offsetHeight + "px";
        listItemStyle.minHeight = offsetHeight + "px";
        if (cards)
          listItemStyle.width = offsetWidth + "px";
        adf.shared.impl.animationUtils.addOneTimeTransitionEndWithFailsafe(
          listItemElement,
          function()
          {
            // Clean up the animation properties that are no longer needed:
            listItemElement.classList.remove(animationMarkerClass);
            listItemElement.classList.remove(animationTransitionClass);
            listItemStyle = listItemElement.style;
            listItemStyle.height = originalHeight;
            listItemStyle.minHeight = originalMinHeight;
            if (cards)
              listItemStyle.width = originalWidth;

            typeHandler._accountForScrollPositionChanges(listViewAmxNode, typeHandler);
            listItemElement.classList.remove(animationInProgressClass);
            typeHandler._animationEnded(listViewAmxNode);
          });
      });
  };

  /**
   * Indicate that an animation in this listView (e.g. row CRUD or disclosure
   * has started.
   * {adf.mf.api.amx.AmxNode} lvAmxNode The AmxNode of the listView
   */
  listView.prototype._animationStarted = function(lvAmxNode)
  {
    // On iOS animating and having elastic scrolling can cause the WebView to crash so
    // while animating, we want need to turn it off (may cause a white flash).
    if (adf.mf.internal.amx.agent["type"] == "iOS")
    {
      var animationCount = lvAmxNode.getAttribute("_animationsInProgress");

      if (animationCount == null || animationCount == 0)
      {
        // First animation starting:
        animationCount = 0;
        var lvElement = document.getElementById(lvAmxNode.getId());
        if (lvElement != null)
        {
          lvElement.classList.add("adfmf-low-memory"); // disables elastic scrolling
        }
      }

      // Increment the number of currently-running animations:
      lvAmxNode.setAttributeResolvedValue("_animationsInProgress", ++animationCount);
    }
  };

  /**
   * Indicate that an animation in this listView (e.g. row CRUD or disclosure
   * has ended.
   * {adf.mf.api.amx.AmxNode} lvAmxNode The AmxNode of the listView
   */
  listView.prototype._animationEnded = function(lvAmxNode)
  {
    // On iOS animating and having elastic scrolling can cause the WebView to crash so
    // while animating, we want need to turn it off (may cause a white flash).
    if (adf.mf.internal.amx.agent["type"] == "iOS")
    {
      var animationCount = lvAmxNode.getAttribute("_animationsInProgress");

      if (animationCount == null || animationCount == 0)
        return;

      if (animationCount == 1)
      {
        // Last animation ending:
        var lvElement = document.getElementById(lvAmxNode.getId());
        if (lvElement != null)
        {
          lvElement.classList.remove("adfmf-low-memory"); // restores elastic scrolling
        }
      }

      // Increment the number of currently-running animations:
      lvAmxNode.setAttributeResolvedValue("_animationsInProgress", --animationCount);
    }
  };

  /**
   * Update aspects of the listView that depend upon scroll position changes.
   * This could be from directly changing scroll position or indirectly via
   * row CRUD operations or divider group disclosure changes.
   * {adf.mf.api.amx.AmxNode} listViewAmxNode The AmxNode of the listView
   * {adf.mf.api.amx.TypeHandler} typeHandler The listView TypeHandler
   */
  listView.prototype._accountForScrollPositionChanges = function(
    listViewAmxNode,
    typeHandler)
  {
    var id = listViewAmxNode.getId();
    var innerListElement = document.getElementById(id + "_innerList");

    // Update the viewport buffer if applicable:
    if (listViewAmxNode.getAttribute("bufferStrategy") == "viewport")
      typeHandler._updateViewportBuffer(listViewAmxNode, innerListElement);

    // Invoke the scroll listener (e.g. to trigger scroll-based load more):
    triggerEvent(innerListElement, "scroll", [listViewAmxNode, typeHandler]);
  };

  /**
   * Update the children AMX nodes after the value attribute has changed
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the listView AMX node
   * @param {Object} collectionChanges the value from the _updateChildrenForCollectionChange
   *        function that was stored on the attributeChanges object
   * @param {Element} rootElement the root DOM element of the listView
   * @param {Element} innerListElement the DOM element containing the listItem DOM
   */
  listView.prototype._refreshCollectionChanges = function(
    amxNode,
    collectionChanges,
    rootElement,
    innerListElement)
  {
    var key, i, count, children, child;

    // First process updates (includes dirtied keys)
    var updated = collectionChanges["updated"];
    for (i = 0, count = updated.length; i < count; ++i)
    {
      key = updated[i];
      children = amxNode.getRenderedChildren(null, key);

      if (children.length > 0)
      {
        // Only one child is supported per key
        child = children[0];

        // Note, we are assuming that the divider attribute value is not changing during an
        // update of the provider. This is because the listView currently assumes that the
        // collection model is sorted by this attribute. Therefore, if the value changed,
        // then we really should have received a delete and insert instead of an update
        child.rerender(); // TODO consider possibility of animating this re-render like animateOnPostDisplay
      }
    }

    // Next, handle deletes
    var removed = collectionChanges["removed"];
    for (i = 0, count = removed.length; i < count; ++i)
      this._removeListItemByAmxNode(amxNode, removed[i]);

    // Next, handle created. Since we want to do this in order and the row keys
    // do not tell us order, we must use the iterator to find the created row keys
    // to see where they were inserted into the collection
    var created = collectionChanges["created"];
    var previousKey = null;
    if (collectionChanges["rowsAdded"])
    {
      var dataItems = amxNode.getAttribute("value");
      var iter = adf.mf.api.amx.createIterator(dataItems);
      var previousListItemAmxNode = null;

      while (iter.hasNext())
      {
        iter.next();
        key = iter.getRowKey();

        var child = null;
        children = amxNode.getRenderedChildren(null, key);
        if (children.length > 0)
        {
          child = children[0];
        }

        // See if this is a new row
        if (child != null && created[key] == true)
        {
          var previousListItemAmxNodeElement = previousListItemAmxNode == null ?
            null : document.getElementById(previousListItemAmxNode.getId());

          this._renderStampedItem(true, amxNode, innerListElement, child,
            previousListItemAmxNode, previousListItemAmxNodeElement);
        }

        if (child != null)
        {
          previousListItemAmxNode = child;
        }
      }

      // If rows were added, then check to see if the amx-listItem-scrollStrategyLoading CSS
      // class needs to be removed
      var moreRowsElement = document.getElementById(amxNode.getId() + "_loadMoreRows");
      if (moreRowsElement != null)
      {
        moreRowsElement.classList.remove("amx-listItem-scrollStrategyLoading");
      }
    }

    if (amxNode.getState() == adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"])
    {
      amxNode.setState(adf.mf.api.amx.AmxNodeStates["RENDERED"]);
    }

    // Refresh items in the bar acording to the value change
    createIndexBarItems(rootElement, amxNode, false);

    // Update any divider counts
    if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("showDividerCount")) &&
      amxNode.getAttribute("_dividerAttrEl") != null)
    {
      this._displayDividerCount(innerListElement);
    }
  };

  /**
   * Stores the client state of the list view
   * @param {HTMLElement} innerListElement the scrollable innerList element
   * @param {Object} amxNode the unique identifier for this listView instance
   */
  listView.prototype._storeClientState = function(amxNode, innerListElement)
  {
    if (innerListElement != null)
    {
      // Store off the current scroll position in case this view instance is ever revisited:
      var scrollLeft = innerListElement.scrollLeft;
      var scrollTop = innerListElement.scrollTop;

      var storedData = amxNode.getClientState() || {};

      if (scrollLeft != null || scrollTop != null)
      {
        storedData.scrollLeft = scrollLeft;
        storedData.scrollTop = scrollTop;
      }

      storedData.maxRows = amxNode.getAttribute("maxRows");

      amxNode.setClientState(storedData);
    }
  };

  listView.prototype._restoreScrollPosition = function(amxNode, innerListElement)
  {
    var storedData = amxNode.getClientState();
    if (storedData != null)
    {
      // First look to see if we have a scrollTop saved, then use it:
      var scrollLeft = storedData.scrollLeft;
      if (scrollLeft != null)
      {
        innerListElement.scrollLeft = scrollLeft;
      }
      var scrollTop = storedData.scrollTop;
      if (scrollTop != null)
      {
        innerListElement.scrollTop = scrollTop;
      }
    }
    else
    {
      // Otherwise, look to see if we have an initialScrollRowKeys setting:
      var initialScrollRowKey = _getInitialScrollRowKey(amxNode);
      if (initialScrollRowKey != null)
      {
        // Escape backslashes and quotes
        initialScrollRowKey = ""+initialScrollRowKey; // ensure it is a string
        initialScrollRowKey = initialScrollRowKey.replace(/[\\]/g, "\\\\");
        initialScrollRowKey = initialScrollRowKey.replace(/["]/g, "\\\"");
        var row =
          innerListElement.querySelector(
            ".amx-listItem[data-listViewRk=\"" + initialScrollRowKey + "\"]");
        if (row)
          innerListElement.scrollTop = row.offsetTop;
      }
    }
  };

  /**
   * Get the divider element to be used. Renders the element and adds it to the DOM
   * if needed.
   *
   * @param {adf.mf.api.amx.AmxNode} listViewAmxNode the AMX node for the list view
   * @param {Element} innerListElement the list element for the list view
   * @param {adf.mf.api.amx.AmxNode} listItemAmxNode the AMX node for the current list item
   * @param {adf.mf.api.amx.AmxNode} previousListItemAmxNode the AMX node for the previous
   *        list item or null if there is no previous list item
   * @param {Element} previousListItemAmxNodeElement DOM node for the previous list item
   *        if there is one, otherwise null
   * @return {Object} object with a key "element" for the divider element and "insertBefore" as
   *         a list item element if the item should be inserted as the first list item in
   *         the divider group. null will be returned if no dividers are being rendered
   */
  listView.prototype._getDividerElement = function(
    listViewAmxNode,
    innerListElement,
    listItemAmxNode,
    previousListItemAmxNode,
    previousListItemAmxNodeElement)
  {
    // Element for the divider group, will be returned
    var returnValue = null;

    // Get the divider attribute value for this list item (set by _evaluateDividerAttribute)
    var dividerValue = listItemAmxNode.getAttribute("_dividerValue");
    if (dividerValue != null)
    {
      var dividerGroup;
      var lastDividerValue = previousListItemAmxNode == null ? null :
        previousListItemAmxNode.getAttribute("_dividerValue");

      // Get the group (parent node) of the previously listItem (rendered)
      var previousGroupElement = previousListItemAmxNodeElement == null ?
        null : previousListItemAmxNodeElement.parentNode;

      var storedState = listItemAmxNode.getClientState() || {};
      var insertBefore = null;
      var existingGroup;

      // See if the item should be added to the first group
      if (dividerValue == lastDividerValue)
      {
        dividerGroup = previousGroupElement;
        existingGroup = true;
        insertBefore = previousListItemAmxNodeElement.nextSibling;
      }
      else
      {
        // See if the item belongs in the next group element (or first if there is
        // no previous list item)
        var potentialDividerGroup = previousGroupElement == null ?
          innerListElement.querySelector(".amx-listView-group") :
          previousGroupElement.nextSibling;

        if (potentialDividerGroup != null &&
          potentialDividerGroup.classList.contains("amx-listView-group"))
        {
          var firstListItemElement = potentialDividerGroup.querySelector(".amx-listItem");
          if (firstListItemElement != null)
          {
            var firstListItemAmxNode = adf.mf.api.amx.AmxNode.getAmxNodeForElement(
              firstListItemElement);
            if (dividerValue == firstListItemAmxNode.getAttribute("_dividerValue"))
            {
              dividerGroup = potentialDividerGroup;
              existingGroup = true;
              insertBefore = firstListItemElement;
            }
          }
        }

        if (dividerGroup == null)
        {
          // Create a new divider group element
          storedState.isHidden = false;

          // All items that generates same divider will be placed into the
          // special div that helps with animation
          dividerGroup = document.createElement("div");
          dividerGroup.classList.add("amx-listView-group");

          // When using dividers, each group element is a content element:
          dividerGroup.classList.add("amx-listView-content");
          var contentStyle = listViewAmxNode.getAttribute("contentStyle");
          if (contentStyle != null)
          {
            dividerGroup.setAttribute("style", contentStyle);
          }

          // Insert the group into the listView DOM
          if (previousGroupElement == null) // insert at top
            innerListElement.insertBefore(dividerGroup, innerListElement.firstChild);
          else // insert elsewhere
            this._appendToListView(false, listViewAmxNode, innerListElement, dividerGroup, previousGroupElement);

          // Create the divider DOM element and add to the group
          this._createDivider(listViewAmxNode, dividerValue, dividerGroup);

          // Register callback function that will allow to jump to divider that
          // corresponds to the letter in the index
          var register = listViewAmxNode.getAttribute("_indexBarRegister");
          if (register != null && register[dividerValue] == null)
          {
            register[dividerValue] = this._createIndexBarHandler(innerListElement, dividerGroup);
          }

          listViewAmxNode.setAttributeResolvedValue("_indexBarRegister", register);
        }
      }

      storedState.isHidden = dividerGroup.classList.contains("amx-listView-undisclosed");

      listItemAmxNode.setClientState(storedState);

      returnValue = { "insertBefore": insertBefore, "element": dividerGroup };
    }

    return returnValue;
  };

  /**
   * Renders a stamped listItem and adds it to the DOM hierarchy. Includes the logic to create the dividers
   * as needed.
   * @param {Boolean} animate Whether to animation this render
   * @param {adf.mf.api.amx.AmxNode} listViewAmxNode the AMX node for the listView
   * @param {Element} innerListElement the DIV housing the listItem DOM
   * @param {adf.mf.api.amx.AmxNode} listItemAmxNode the AMX node for the listItem to render
   * @param {adf.mf.api.amx.AmxNode} previousListItemAmxNode the previous listItem AMX node or null
   *        if there is no previous AMX node
   * @return {Element} the DOM element
   */
  listView.prototype._renderStampedItem = function(
    animate,
    listViewAmxNode,
    innerListElement,
    listItemAmxNode,
    previousListItemAmxNode,
    previousListItemAmxNodeElement)
  {
    // Render the divider if needed
    var dividerGroup = this._getDividerElement(
      listViewAmxNode,
      innerListElement,
      listItemAmxNode,
      previousListItemAmxNode,
      previousListItemAmxNodeElement);

    var listItemElement = listItemAmxNode.render();

    // Ensure an element was rendered
    if (listItemElement != null)
    {
      // Check if this is a divider case (element added to the group)
      if (dividerGroup != null)
      {
        // Add the undisclosed CSS style if needed
        var storedState = listItemAmxNode.getClientState();
        if (storedState.isHidden)
        {
          listItemElement.classList.add("amx-listItem-undisclosed");
        }

        // Check if there was no previous item or if the divider group is new
        if (dividerGroup["insertBefore"] != null)
        {
          dividerGroup["element"].insertBefore(listItemElement, dividerGroup["insertBefore"]);
          if (animate)
            this._animateListItemInsert(listViewAmxNode, listItemElement);
        }
        else
        {
          dividerGroup["element"].appendChild(listItemElement);
          if (animate)
            this._animateListItemInsert(listViewAmxNode, listItemElement);
        }
      }
      else // No dividers
      {
        if (previousListItemAmxNodeElement != null)
        {
          this._appendToListView(animate, listViewAmxNode, innerListElement, listItemElement,
            previousListItemAmxNodeElement);
        }
        else
        {
          // There is no previous element, so this must be inserting at the top of the listView
          var firstListElement = innerListElement.querySelector(".amx-listItem.amx-node");
          if (firstListElement == null)
          {
            // This is the first listItem in the listView
            this._appendToListView(animate, listViewAmxNode, innerListElement, listItemElement, null);
          }
          else
          {
            innerListElement.insertBefore(listItemElement, firstListElement);
            if (animate)
              this._animateListItemInsert(listViewAmxNode, listItemElement);
          }
        }
      }
    }

    return listItemElement;
  };

  /**
   * Function creates the callback that scrolls the
   * scrollable element to position of the element
   *
   * @param scrollableElement {HTMLElement} element that has scrolling enabled
   * @param child {HTMLElement} child of the scrollableElement
   */
  listView.prototype._createIndexBarHandler = function(scrollableElement, child)
  {
    if (child && scrollableElement)
    {
      return function()
      {
        scrollableElement.scrollTop = child.offsetTop;
      };
    }
  };

  listView.prototype._displayDividerCount = function(innerListElement)
  {
    var listViewChildren = innerListElement.childNodes;
    for (var i = 0, childCount = listViewChildren.length; i < childCount; ++i)
    {
      var dividerGroup = listViewChildren[i];
      if (dividerGroup.classList.contains("amx-listView-group"))
      {
        var count =
          dividerGroup.querySelectorAll(
            ".amx-listItem:not(.amx-listItem-moreRows):not(.amx-listView-divider):not(.amx-listItem-delete)").length;
        var dividers = dividerGroup.querySelectorAll(".amx-listView-divider:not(.amx-listItem-delete)");
        for (var divIndex = 0; divIndex < dividers.length; divIndex++)
        {
          var dividerCounterText = dividers[divIndex].querySelector(
            ".amx-listView-dividerCounterText");
          if (dividerCounterText)
          {
            dividerCounterText.textContent = count;
          }
        }
      }
    }
  };

  listView.prototype._collapseDividerIfNecessary = function(amxNode, divider, dividerTitle)
  {
    if (amxNode.getAttribute("collapsedDividers"))
    {
      var collapsedDividersArray = amxNode.getAttribute("collapsedDividers");
      if (collapsedDividersArray != null && collapsedDividersArray.indexOf(dividerTitle) != -1)
      {
        var dividerChildren = divider.childNodes;
        for (var i = 0, dividerChildCount = dividerChildren.length; i < dividerChildCount; ++i)
        {
          var dividerChild = dividerChildren[i];
          if (dividerChild.classList.contains("amx-listView-disclosedIcon"))
          {
            dividerChild.classList.remove("amx-listView-disclosedIcon");
            dividerChild.classList.add("amx-listView-undisclosedIcon");
            var dividerGroup = dividerChild.parentNode.parentNode;
            if (!dividerGroup.classList.contains("amx-listView-undisclosed"))
            {
              dividerGroup.classList.add("amx-listView-undisclosed");
            }
          }
        }
      }
    }
  };

  listView.prototype._renderHeaderFacet = function(amxNode, rootElement, topDivider)
  {
    var headerFacetChildren = amxNode.getRenderedChildren("header");
    if (headerFacetChildren.length)
    {
      var header = document.createElement("div");
      header.className = "amx-listView-header";
      rootElement.appendChild(header);
      var div = document.createElement("div");
      div.className = "amx-listView-facet-header";
      header.appendChild(div);

      for (var i = 0, size=headerFacetChildren.length; i < size; ++i)
      {
        var childElement = headerFacetChildren[i].render();
        if (childElement)
          div.appendChild(childElement);
      }
    }
  };

  listView.prototype._appendToListView = function(
    animate,
    listViewAmxNode,
    innerListElement,
    listItemElement,
    lastListItemElement)
  {
    // Since this may be called after the footer and next rows elements have
    // been added to the list view, insert the rows after the last list item
    // if it exists
    if (lastListItemElement)
    {
      _insertAfter(innerListElement, lastListItemElement, listItemElement);
      if (animate)
        this._animateListItemInsert(listViewAmxNode, listItemElement);
    }
    else
    {
      innerListElement.appendChild(listItemElement);
      if (animate)
        this._animateListItemInsert(listViewAmxNode, listItemElement);
    }
  };

  listView.prototype._appendFooter = function(amxNode, rootElement)
  {
    var footerFacetChildren = amxNode.getRenderedChildren("footer");
    if (footerFacetChildren.length)
    {
      var footer = document.createElement("div");
      footer.className = "amx-listView-footer";
      rootElement.appendChild(footer);
      var facetFooter = document.createElement("div");
      facetFooter.className = "amx-listView-facet-footer";
      footer.appendChild(facetFooter);

      for (var i = 0, size=footerFacetChildren.length; i < size; ++i)
      {
        var childElement = footerFacetChildren[i].render();
        if (childElement)
          facetFooter.appendChild(childElement);
      }
    }
  };

  /**
   * @param {adf.mf.api.amx.AmxNode} amxNode the listView AMX node. Used to get the dividerMode
   *        attribute value.
   * @param {string} dividerAttrEl the EL use to get the divider attribute.
   * @return {string} value for divider.
   */
  listView.prototype._getCurrentDivider = function(amxNode, dividerAttrEl)
  {
    var dividerAttributeValue = adf.mf.el.getLocalValue(dividerAttrEl);
    if (adf.mf.environment.profile.dtMode)
    {
      return dividerAttrEl;
    }

    // if divider attribute is not found in the collection, throw a property not found exception.
    if (dividerAttributeValue === undefined)
    {
      throw new adf.mf.PropertyNotFoundException(adf.mf.resource.getInfoString("AMXInfoBundle",
        "amx_listView_LABEL_UNKNOWN_DIVIDER_ATTRIBUTE",amxNode.getAttribute("dividerAttribute")));
    }

    if (amxNode.getAttribute("dividerMode") === "firstLetter" && dividerAttributeValue != null)
    {
      var character = dividerAttributeValue.charAt(0);
      // make character case insensitive
      character = character.toUpperCase();
      // contains information about all available characters in index
      var indexString = adf.mf.resource.getInfoString("AMXInfoBundle",
        "amx_listView_INDEX_STRING").toUpperCase();
      // contains character that represents all unknown characters
      var otherLetterChar = adf.mf.resource.getInfoString("AMXInfoBundle",
        "amx_listView_INDEX_OTHERS").toUpperCase();
      // accent mapping for current index representation
      var accentMap = adf.mf.resource.getInfoString("AMXInfoBundle",
        "amx_listView_INDEX_ACCENT_MAP").toUpperCase();

      if (indexString.indexOf(character) > -1)
      {
        // in case that character is in index listiview returns character itself
        return "" + character;
      }
      else
      {
        // in other case listview tries to find this character in the map of accents for each letter
        // accent map has following structure: |A�|D�| (The first letter in each group is the real index and all
        // characters behind this one are possible mutations of this letter)
        var index = accentMap.indexOf(character);
        if (index > 0)
        {
          while (accentMap.charAt(index) !== "|" && accentMap.charAt(--index) !== "|")
          {
            character = accentMap.charAt(index);
          }
          // returns the first character befor "|" in map
          return character;
        }
        else
        {
          // in this case listview was unable to find suitable character so it returns character that represents
          // unknown letters
          return "" + otherLetterChar;
        }
      }
    }
    // this happens when divider mode is set to all
    return "" + dividerAttributeValue;
  };

  /**
   * Create and append the divider
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the listView AMX node
   * @param {string} divider the value of the divider text
   * @param {Element} dividerGroup the DIV for the divider group
   */
  listView.prototype._createDivider = function(
    amxNode,
    divider,
    dividerGroup)
  {
    var dividerActual = document.createElement("div");
    dividerGroup.appendChild(dividerActual);
    dividerActual.setAttribute("tabindex", "0");

    // Check for when collapsible dividers and showCount properties are true/false
    if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("collapsibleDividers")))
    {
      dividerActual.className = "amx-listView-divider";

      var disclosedIcon = document.createElement("div");
      disclosedIcon.className = "amx-listView-disclosedIcon";
      disclosedIcon.setAttribute("role","button");
      disclosedIcon.setAttribute("aria-expanded","true");
      dividerActual.appendChild(disclosedIcon);

      var dividerText = document.createElement("div");
      dividerText.setAttribute("role", "heading");
      dividerText.className = "amx-listView-dividerText";
      dividerText.textContent = divider;
      dividerActual.appendChild(dividerText);

      if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("showDividerCount")))
      {
        var dividerCounterContainer = document.createElement("div");
        dividerCounterContainer.className = "amx-listView-dividerCounter";
        dividerActual.appendChild(dividerCounterContainer);

        var dividerCounterText = document.createElement("div");
        dividerCounterText.className = "amx-listView-dividerCounterText";
        dividerCounterContainer.appendChild(dividerCounterText);
      }
    }
    else
    {
      dividerActual.className = "amx-listView-divider amx-listView-nonCollapsibleDivider";

      var dividerText = document.createElement("div");
      dividerText.setAttribute("role", "heading");
      dividerText.className = "amx-listView-nonCollapsibleDivider amx-listView-dividerText";
      dividerText.textContent = divider;
      dividerActual.appendChild(dividerText);

      if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("showDividerCount")))
      {
        var dividerCounterContainer = document.createElement("div");
        dividerCounterContainer.className = "amx-listView-dividerCounter";
        dividerActual.appendChild(dividerCounterContainer);

        var dividerCounterText = document.createElement("div");
        dividerCounterText.className = "amx-listView-dividerCounterText";
        dividerCounterContainer.appendChild(dividerCounterText);
      }
    }

    var items = [];
    adf.mf.internal.amx._setNonPrimitiveElementData(dividerActual, "items", items);
    if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("collapsibleDividers")))
    {
      this._collapseDividerIfNecessary(amxNode, dividerActual, divider);
      var typeHandler = this;

      // Add an empty drag listener so that a scroll of the listView will not
      // accidentally trigger a divider tap:
      adf.mf.api.amx.addDragListener(
        dividerActual,
        {
          start: function(event, dragExtra) {},
          drag: function(event, dragExtra) {},
          end: function(event, dragExtra) {},
          threshold: 5
        });

      adf.mf.api.amx.addBubbleEventListener(dividerActual, "tap", function(event)
      {
        if (adf.mf.api.amx.acceptEvent())
        {
          var dividerElement = this;
          var animationInProgressClass = "amx-animating"; // a loading contributor
          if (!dividerElement.classList.contains(animationInProgressClass))
          {
            dividerElement.classList.add(animationInProgressClass);
            var toggleClosure = function()
            {
              return function()
              {
                var listItem = dividerElement.nextSibling;
                var reset = false;
                var promises = [];
                var className = listItem.className;
                while (listItem != null &&
                  className.indexOf("amx-listItem-moreRows") == -1 &&
                  className.indexOf("amx-listItem") != -1 &&
                  className.indexOf("amx-listView-divider") == -1)
                {
                  var itemAmxNode = adf.mf.internal.amx._getNonPrimitiveElementData(
                    listItem, "amxNode");
                  var storedState = itemAmxNode.getClientState();
                  if (storedState == null)
                  {
                    storedState = { };
                  }
                  if (listItem.classList.contains("amx-listItem-undisclosed") ||
                      listItem.classList.contains("amx-listItem-disclosing"))
                  {
                    promises.push(_discloseListItem(listItem));
                    storedState.isHidden = false;
                  }
                  else
                  {
                    promises.push(_undiscloseListItem(listItem));
                    storedState.isHidden = true;
                    reset = true;
                  }
                  itemAmxNode.setClientState(storedState);
                  listItem = listItem.nextSibling;
                  className = listItem != null ? listItem.className : "";
                }
                var id = amxNode.getId();
                var actualInnerListElement = document.getElementById(id + "_innerList");
                if (reset === true &&
                  actualInnerListElement.scrollTop > dividerElement.parentNode.offsetTop)
                {
                  dividerElement.classList.remove("amx-bottom");
                  actualInnerListElement.scrollTop = dividerElement.parentNode.offsetTop;
                }

                // It is possible that we lost scrolling due to toggling the collapsed state.
                // If we did then we need to make sure the loadMoreRows element (if applicable)
                // no longer has the scrollStrategy marker:
                if (actualInnerListElement.scrollHeight <= actualInnerListElement.offsetHeight)
                {
                  var moreRowsElem = document.getElementById(id + "_loadMoreRows");
                  if (moreRowsElem != null)
                    moreRowsElem.classList.remove("amx-listItem-scrollStrategy");
                }

                // Once all the animations have completed, remove the marker from the
                // divider so that it can be toggled again. If we didn't prevent re-entry
                // during an animation then the listItems could get stuck in a temporary
                // state so we must wait.
                adf.mf.internal.BasePromise.all(promises).then(
                  function()
                  {
                    typeHandler._accountForScrollPositionChanges(amxNode, typeHandler);
                    dividerElement.classList.remove(animationInProgressClass);
                  });
              };
            };

            // MDO: bug 14114778 - the browser doesn't always redraw when we simply toggle the "display"
            // property so we do the toggle from the timeout.  That seems to fix the issue.
            requestAnimationFramePolyfill(toggleClosure());

            var divActualChildren = dividerElement.childNodes;
            for (var i = 0, divActualChildrenCount = divActualChildren.length;
              i < divActualChildrenCount;
              ++i)
            {
              var divActualChild = divActualChildren[i];
              if (divActualChild.classList.contains("amx-listView-disclosedIcon"))
              {
                // Found a disclosedIcon, make it undisclosed:
                divActualChild.classList.remove("amx-listView-disclosedIcon");
                divActualChild.classList.add("amx-listView-undisclosedIcon");
                divActualChild.setAttribute("aria-expanded","false");
                var dividerGroup = divActualChild.parentNode.parentNode;
                dividerGroup.classList.add("amx-listView-undisclosed");
              }
              else if (divActualChild.classList.contains("amx-listView-undisclosedIcon"))
              {
                // Found an undisclosedIcon, make it disclosed:
                divActualChild.classList.remove("amx-listView-undisclosedIcon");
                divActualChild.classList.add("amx-listView-disclosedIcon");
                divActualChild.setAttribute("aria-expanded","true");
                var dividerGroup = divActualChild.parentNode.parentNode;
                dividerGroup.classList.remove("amx-listView-undisclosed");
              }
            }
          }
        }
      });
    }
    return dividerActual;
  };

  function _discloseListItem(listItem)
  {
    // Disclose this list item and return a promise for when it finished animating
    return new adf.mf.internal.BasePromise(
      function(resolve, reject)
      {
        listItem.classList.remove("amx-listItem-undisclosed");
        var originalHeight = listItem.style.height;
        var originalMinHeight = listItem.style.minHeight;
        var offsetHeight = listItem.offsetHeight;
        listItem.style.height = "0";
        listItem.style.minHeight = "0";
        var animationInProgressClass = "amx-animating"; // a loading contributor
        listItem.classList.add(animationInProgressClass);
        adf.shared.impl.animationUtils._requestAnimationFrame(
          function()
          {
            var animationTransitionClass = "amx-listItem-disclosing";
            listItem.classList.add(animationTransitionClass);

            // Subtract 1 just in case there's a border to avoid over expansion.
            listItem.style.height = offsetHeight-1 + "px";
            listItem.style.minHeight = offsetHeight-1 + "px";

            adf.shared.impl.animationUtils.addOneTimeTransitionEndWithFailsafe(
              listItem,
              function()
              {
                // Clean up the animation properties that are no longer needed:
                listItem.classList.remove(animationTransitionClass);
                listItem.style.height = originalHeight;
                listItem.style.minHeight = originalMinHeight;
                listItem.classList.remove(animationInProgressClass);
                resolve();
              });
          });
      });
  };

  function _undiscloseListItem(listItem)
  {
    // Undisclose this list item and return a promise for when it finished animating
    return new adf.mf.internal.BasePromise(
      function(resolve, reject)
      {
        var originalHeight = listItem.style.height;
        var originalMinHeight = listItem.style.minHeight;
        var offsetHeight = listItem.offsetHeight;

        // Subtract 1 just in case there's a border to avoid over expansion.
        listItem.style.height = offsetHeight-1 + "px";
        listItem.style.minHeight = offsetHeight-1 + "px";

        var animationInProgressClass = "amx-animating"; // a loading contributor
        listItem.classList.add(animationInProgressClass);
        adf.shared.impl.animationUtils._requestAnimationFrame(
          function()
          {
            var animationTransitionClass = "amx-listItem-undisclosing";
            listItem.classList.add(animationTransitionClass);
            listItem.style.height = "0";
            listItem.style.minHeight = "0";
            adf.shared.impl.animationUtils.addOneTimeTransitionEndWithFailsafe(
              listItem,
              function()
              {
                listItem.classList.remove(animationTransitionClass);
                listItem.classList.add("amx-listItem-undisclosed");
                listItem.style.height = originalHeight;
                listItem.style.minHeight = originalMinHeight;
                listItem.classList.remove(animationInProgressClass);
                resolve();
              });
          });
      });
  }

  function triggerEvent(eventTarget, eventType, triggerExtra)
  {
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent(eventType, true, true);
    evt.view = window;
    evt.altKey = false;
    evt.ctrlKey = false;
    evt.shiftKey = false;
    evt.metaKey = false;
    evt.keyCode = 0;
    evt.charCode = 'a';
    if (triggerExtra != null)
      evt.triggerExtra = triggerExtra;
    eventTarget.dispatchEvent(evt);
  }

  /**
   * Creates the load more rows item in the list for the user to be
   * able to load the next block of rows.
   */
  listView.prototype._createAndAppendTheMoreRowsDom = function(
    amxNode,
    rootId,
    innerListElement,
    scrollStrategy)
  {
    var loadMoreRowsString = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_listView_MSG_LOAD_MORE_ROWS");

    var moreRowsElem = document.createElement("div");
    moreRowsElem.id = rootId + "_loadMoreRows";
    moreRowsElem.setAttribute("role", "button");
    moreRowsElem.setAttribute("tabindex", "0");
    if (scrollStrategy &&
      innerListElement.scrollHeight <= innerListElement.offsetHeight) // TODO cache this value until a CRUD operation or refresh occurs
      scrollStrategy = false; // it isn't scrollable so use a link instead

    // Add the styleClasses as applicable:
    if (scrollStrategy)
    {
      moreRowsElem.className = "amx-listItem amx-listItem-moreRows amx-listItem-scrollStrategy";
      moreRowsElem.setAttribute("aria-label", loadMoreRowsString);
    }
    else
      moreRowsElem.className = "amx-listItem amx-listItem-moreRows";

    // This is the link of the text (hidden when using a scroll showMoreStrategy):
    var span = document.createElement("span");
    span.appendChild(document.createTextNode(loadMoreRowsString));
    span.className = "amx-outputText";
    moreRowsElem.appendChild(span);
    innerListElement.appendChild(moreRowsElem);

    // We still want to support taps regardless whether this is a tap or a scroll
    // in case for whatever reason the scroll doesn't invoke it.
    adf.mf.api.amx.addBubbleEventListener(moreRowsElem, "tap", this._handleMoreRowsTap, amxNode);
  };

  /**
   * Adds or removes the DOM for the user to be able to load more rows.
   */
  listView.prototype._addOrRemoveLoadMoreRowsDom = function(
    amxNode,
    rootId,
    innerListElement,
    showMoreRowsLink,
    initialRender)
  {
    var moreRowsElement = null;
    if (!initialRender)
      moreRowsElement = document.getElementById(rootId + "_loadMoreRows");

    // The available strategies for loading more rows are:
    // off:
    //  - no affordance is provided for loading more rows
    // autoLink (default):
    //  - a "link" will appear or disappear as the framework determines applicable (e.g. if the
    //    rows are value-bound and the collection model indicates that more rows might be
    //    available)
    // forceLink:
    //  - a "link" will always be shown regardless of need
    // autoScroll:
    //  - when scrolling to the edge of the viewport, the effect of clicking the link will
    //    occur; no link is visually-presented to the user
    // forceScroll:
    //  - when scrolling to the edge of the viewport, the effect of clicking the link will
    //    occur; no link is visually-presented to the user
    var showMoreStrategy = amxNode.getAttribute("showMoreStrategy");
    if (showMoreStrategy == "off")
      showMoreRowsLink = false;
    else if (showMoreStrategy == "forceLink")
      showMoreRowsLink = true;
    else if (showMoreStrategy == "forceScroll")
      showMoreRowsLink = true;

    var scrollStrategy = (showMoreStrategy == "autoScroll" || showMoreStrategy == "forceScroll");

    // Get and store off the scroll strategy so that we can try to avoid removing and re-adding
    // the DOM if this value has not changed since the last call to this function
    var lastScrollStrategy = amxNode.getAttribute("_renderedScrollStrategy");
    amxNode.setAttributeResolvedValue("_renderedScrollStrategy", scrollStrategy);

    if (showMoreRowsLink && moreRowsElement == null)
    {
      // There are more rows that can be loaded, but we have not yet added
      // the DOM to have the user load the rows
      this._createAndAppendTheMoreRowsDom(amxNode, rootId, innerListElement, scrollStrategy);
    }
    else if (!showMoreRowsLink && moreRowsElement != null)
    {
      // There are no more rows (neither locally or ones that need fetching),
      // but the more rows DOM is still present, so we need to remove it
      // including all event listeners and data:
      adf.mf.api.amx.removeDomNode(moreRowsElement);
    }
    else if (moreRowsElement != null &&
      // Only update the DOM if the scroll strategy has changed since the last rendering for
      // performance reasons:
      lastScrollStrategy != scrollStrategy)
    {
      // Recreate it to update the display of the element based on the showMoreStrategy:
      adf.mf.api.amx.removeDomNode(moreRowsElement);
      this._createAndAppendTheMoreRowsDom(amxNode, rootId, innerListElement, scrollStrategy);
    }
  };

  listView.prototype._handleMoreRowsTap = function(event)
  {
    var amxNode = event.data;
    var typeHandler = amxNode.getTypeHandler();
    typeHandler._handleMoreRowsAction(amxNode);
  };

  listView.prototype._queueRangeChangeListener = function(amxNode, iter, availableCount, fetchSize)
  {
    var rangeChangeListener = amxNode.getAttributeExpression("rangeChangeListener");
    if (rangeChangeListener != null)
    {
      var eventSourceId = amxNode.getId();

      // Figure out what the last loaded row key was:
      var lastLoadedRowKey = null;
      if (iter != null)
      {
        lastLoadedRowKey = iter.getRowKey();

        if (availableCount > 0)
        {
          var rowKeyToRestore = iter.getRowKey();

          iter.setCurrentIndex(availableCount - 1);
          lastLoadedRowKey = iter.getRowKey();
          if (rowKeyToRestore != null)
            iter.setCurrentRowKey(rowKeyToRestore);
        }
      }

      var contextFreeValue = null;
      var valueEL = amxNode.getAttributeExpression("value");

      if (valueEL != null)
      {
        contextFreeValue = adf.mf.util.getContextFreeExpression(valueEL);
      }

      var rce = new adf.mf.api.amx.RangeChangeEvent(eventSourceId, contextFreeValue, lastLoadedRowKey, fetchSize);
      adf.mf.api.amx.processAmxEvent(amxNode, "rangeChange", undefined, undefined, rce);
    }
  };

  listView.prototype._handleMoreRowsAction = function(amxNode)
  {
    var quantityToLoad = amxNode.getAttribute("fetchSize");
    var maxRows = amxNode.getAttribute("maxRows");
    var dataItems = amxNode.getAttribute("value");

    // For PSR, start an operation for this
    var perfOp = adf.mf.internal.perf.startMonitorOperation(
      "Load more rows for list view with ID " + amxNode.getId(), adf.mf.log.level.FINE, "amx:listView.loadMoreRows");
    amxNode.setAttributeResolvedValue("_loadMoreRowsPerf", perfOp);

    // There is a chance that a response may never be receieved for a load
    // more rows action. As such, schedule a timer to prevent infinite waiting
    var perfOpTimeout = window.setTimeout(
      function()
      {
        var perfOp = amxNode.getAttribute("_loadMoreRowsPerf");
        if (perfOp != null)
        {
          amxNode.getTypeHandler()._endLoadMoreRows(amxNode);
        }
      }, 10000);
    amxNode.setAttributeResolvedValue("_loadMoreRowsPerfTimeout", perfOpTimeout);

    if (quantityToLoad === undefined || maxRows === undefined || dataItems === undefined)
    {
      // This is the case where there are explicit children; no stamping but the
      // app developer wanted a link shown:
      this._queueRangeChangeListener(amxNode, null, 0, 0);
      return;
    }
    else if (maxRows == Infinity && quantityToLoad == Infinity)
    {
      // This is the case where there an Array is used for stamping but the
      // app developer wanted a link shown anyhow:
      this._queueRangeChangeListener(amxNode, null, 0, 0);
      return;
    }

    var currentRows = maxRows;

    adf.mf.api.amx.showLoadingIndicator();
    // First update the maximum number of rows to show if applicable
    if (maxRows != Infinity && quantityToLoad > 0)
    {
      amxNode.setAttributeResolvedValue("_oldMaxRows", currentRows);
      maxRows = maxRows + quantityToLoad;
      amxNode.setAttributeResolvedValue("maxRows", maxRows);

      // In case a data change event arrives, save off the maxRows so it will be retained if the
      // list view AMX node is re-created
      var innerListElement = document.getElementById(amxNode.getId() + "_innerList");
      this._storeClientState(amxNode, innerListElement);

      var iter = adf.mf.api.amx.createIterator(dataItems);

      // See if the cache actually has the needed rows, if not then we should
      // force the new rows to load into the cache before attempting to rerender
      var availableCount = iter.getAvailableCount();
      var totalCount = iter.getTotalCount();
      if ((totalCount > availableCount || !iter.isAllDataLoaded()) &&
        availableCount < maxRows)
      {
        this._queueRangeChangeListener(amxNode, iter, availableCount, quantityToLoad);

        if (iter.isTreeNodeIterator())
        {
          // Note that the bulk load providers call may cause the firing of a
          // RangeChangeEvent. If that happens, a data change event will arrive
          // before the callback.
          amxNode.setState(adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"]);
          adf.mf.api.amx.bulkLoadProviders(dataItems, currentRows, maxRows, function()
          {
            try
            {
              var oldMaxRows = amxNode.getAttribute("_oldMaxRows");

              // The following check will not be true if a data change event was processed
              // before this callback. If so, we don't need to incur the cost of a
              // markNodeForUpdate call
              if (currentRows == oldMaxRows)
              {
                // No rows have been loaded since our call, schedule a visit
                var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
                args.setAffectedAttribute(amxNode, "maxRows");
                adf.mf.api.amx.markNodeForUpdate(args);
              }
            }
            finally
            {
              adf.mf.api.amx.hideLoadingIndicator();
            }
          },
          function(message, resp)
          {
            adf.mf.api.adf.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
              "_handleMoreRowsAction", "MSG_ITERATOR_FIRST_NEXT_ERROR", message, resp);
            adf.mf.api.amx.hideLoadingIndicator();
          });
        }
        else
        {
          adf.mf.api.amx.hideLoadingIndicator();
        }
      }
      else if (totalCount <= availableCount && availableCount < maxRows &&
        amxNode.getAttributeExpression("rangeChangeListener") != null)
      {
        // Fire a range change event to see if more can be loaded
        this._queueRangeChangeListener(amxNode, iter, availableCount, quantityToLoad);
        adf.mf.api.amx.hideLoadingIndicator();
      }
      else // The rows are actually in the cache
      {
        // Notify the framework so that the new children nodes are created
        // and we are called back with the refresh method. We record that the
        // changed attribute is the generated maxRows attribute so that the
        // refresh function knows to only render the new rows and not rerender
        // the entire list view
        var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
        args.setAffectedAttribute(amxNode, "maxRows");
        adf.mf.api.amx.markNodeForUpdate(args);
        adf.mf.api.amx.hideLoadingIndicator();
      }
    }
  };

  listView.prototype.__experimentalCLAssociation = function(
    amxNode,
    amxNodeId,
    eventType,
    rootElement)
  {
    if (eventType == "scroll")
    {
      rootElement.classList.add("amx-listView-hasScrollClientListener");
    }
    listView.superclass.__experimentalCLAssociation.call(
      this,
      amxNode,
      amxNodeId,
      eventType,
      rootElement,
      false);
  };

  var listItem = adf.mf.api.amx.TypeHandler.register(
    adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "listItem");

  listItem.prototype.render = function(amxNode, id)
  {
    var listItemElement = document.createElement("div");
    var caretShown;
    var shortDesc = amxNode.getAttribute("shortDesc");

    listItemElement.setAttribute("tabindex", "0");

    // We are adding title attribute to the listItemElement for ACC purposes mainly - as per ACC architect James Nurthen
    if (shortDesc != null)
    {
      listItemElement.setAttribute("title", shortDesc);
    }

    if (adf.mf.api.amx.isValueFalse(amxNode.getAttribute("showLinkIcon")))
      caretShown = false;
    else
      caretShown = true;

    if (caretShown)
    {
      var caret = document.createElement("div");
      caret.className = "amx-listItem-caret";
      listItemElement.appendChild(caret);
    }
    else
    {
      listItemElement.className = "amx-listItem-noCaret";
    }

    if (amxNode.getAttribute("action") != null)
    {
      // If there is action attribute set, it is a button, add WAI-ARIA roles of listitem and button, note that
      // voiceover announces item as a button if "button" is first in the role string.
      listItemElement.setAttribute("role", "button listitem");
    }
    else
    {
      // If it doesn't have an action attribute set, just add WAI-ARIA role of listitem
      listItemElement.setAttribute("role", "listitem");
    }

    var descendants = amxNode.renderDescendants();
    for (var i = 0, size=descendants.length; i < size; ++i)
    {
      listItemElement.appendChild(descendants[i]);
    }

    adf.mf.api.amx.enableAmxEvent(amxNode, listItemElement, "swipe");
    adf.mf.api.amx.enableAmxEvent(amxNode, listItemElement, "tapHold");

    var amxNodeParent = amxNode.getParent();
    var selectedRowKey = amxNodeParent.getAttribute("_selectedRowKey");
    if (selectedRowKey !== null && selectedRowKey == amxNode.getStampKey())
    {
      _markRowAsSelected(amxNodeParent, listItemElement);
    }
    listItemElement.setAttribute("data-listViewRk", amxNode.getStampKey());
    var storedState = amxNode.getClientState();
    if (storedState != null && storedState.isHidden == true)
    {
      listItemElement.classList.add("amx-listItem-undisclosed");
    }

    var parentAmxNode = amxNode.getParent();
    if (parentAmxNode.getAttribute("value") !== undefined && adf.mf.api.amx.isValueTrue(parentAmxNode.getAttribute("editMode")))
    {
      var handle = document.createElement("div");
      handle.className = "amx-listItem-handle";
      listItemElement.appendChild(handle);
      handleMove(listItemElement);
    }

    adf.mf.api.amx.addBubbleEventListener(listItemElement, "tap", this._handleTap,
    {
      "elementId": id,
      "itemAmxNode": amxNode
    });

    return listItemElement;
  };

  listItem.prototype._handleTap = function(event)
  {
    // Eat the event since this listItem is handling it:
    event.stopPropagation();
    event.preventDefault();

    var listItemElementId = event.data["elementId"];
    var listItemElement = document.getElementById(listItemElementId);
    if (listItemElement == null)
      return;
    var innerListElement = findListViewAncestor(listItemElement);
    var listItemAmxNode = event.data["itemAmxNode"];
    var listViewAmxNode = listItemAmxNode.getParent();
    var oldSelectedRowKey = listViewAmxNode.getAttribute("_selectedRowKey");
    var newSelectedRowKey = listItemElement.getAttribute("data-listViewRk");

    if (!innerListElement.classList.contains("amx-listView-editMode") &&
      !listItemElement.classList.contains("amx-listItem-moreRows"))
    {
      // Removed the old selected state (max 1 item should be selected at a time).
      // In the future we could consider an option to allow multiple selection.
      var oldSelection = innerListElement.querySelector(".amx-listItem-selected");
      if (oldSelection != null)
        _markRowAsUnselected(oldSelection);

      // Added a new style for the listItem that is tapped
      _markRowAsSelected(listViewAmxNode, listItemElement);
      _storeSelectedRowKey(newSelectedRowKey, listViewAmxNode);

      // perform the tap only if the editMode is undefined or false
      if (!adf.mf.api.amx.isValueTrue(listViewAmxNode.getAttribute("editMode")))
      {
        if (adf.mf.api.amx.acceptEvent())
        {
          var se = new adf.mf.api.amx.SelectionEvent(oldSelectedRowKey, [newSelectedRowKey]);
          adf.mf.api.amx.processAmxEvent(listViewAmxNode, "selection", undefined, undefined, se);
        }
        adf.mf.api.amx.validate(listItemElement, function()
        {
          if (adf.mf.api.amx.acceptEvent())
          {
            var event = new adf.mf.api.amx.ActionEvent();
            adf.mf.api.amx.processAmxEvent(listItemAmxNode, "action", undefined, undefined, event,
              function()
              {
                var action = listItemAmxNode.getAttributeExpression("action", true);
                if (action != null)
                {
                  adf.mf.api.amx.doNavigation(action);
                }
              });
          }
        });
      }
    }

  };

  var iterator = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "iterator");

  iterator.prototype.createChildrenNodes = function(amxNode)
  {
    // See if the listview is bound to a collection
    if (!amxNode.isAttributeDefined("value"))
    {
      // Let the default behavior occur of building the child nodes
      return false;
    }

    var dataItems;
    if (adf.mf.environment.profile.dtMode)
    {
      // If in DT mode, create 3 dummy children so that something is
      // displayed in the preview:
      dataItems = [{},{},{}];
      amxNode.setAttributeResolvedValue("value", dataItems);
    }
    else
    {
      dataItems = amxNode.getAttribute("value");
      if (dataItems === undefined)
      {
        // Mark it so the framework knows that the children nodes cannot be
        // created until the collection model has been loaded
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["INITIAL"]);
        return true;
      }
      else if (dataItems == null)
      {
        // No items, nothing to do
        return true;
      }
    }

    var iter = adf.mf.api.amx.createIterator(dataItems);

    // See if all the rows have been loaded
    if (iter.getTotalCount() > iter.getAvailableCount())
    {
      adf.mf.api.amx.showLoadingIndicator();
      adf.mf.api.amx.bulkLoadProviders(dataItems, 0, -1, function()
      {
        // Ensure that the EL context is correct while rendering:
        try
        {
          var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
          args.setAffectedAttribute(amxNode, "value");
          args.setAffectedAttribute(amxNode, "_bulkLoad");
          adf.mf.api.amx.markNodeForUpdate(args);
        }
        finally
        {
          adf.mf.api.amx.hideLoadingIndicator();
        }
      },
      function(req, resp)
      {
        adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE, "createChildrenNodes",
          "MSG_ITERATOR_FIRST_NEXT_ERROR", req, resp);
        adf.mf.api.amx.hideLoadingIndicator();
      });

      amxNode.setState(adf.mf.api.amx.AmxNodeStates["INITIAL"]);
      return true;
    }

    while (iter.hasNext())
    {
      var item = iter.next();
      // Create the stamped children for the non-facet children (null array item)
      amxNode.createStampedChildren(iter.getRowKey(), [null]);
    }

    amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
    return true;
  };

  iterator.prototype.updateChildren = function(amxNode, attributeChanges)
  {
    if (attributeChanges.hasChanged("value"))
    {
      var collectionChange = attributeChanges.getCollectionChange("value");

      // The iterator only supports changed records
      if (collectionChange != null &&
        collectionChange.isItemized() &&
        collectionChange.getCreatedKeys().length == 0 &&
        collectionChange.getDeletedKeys().length == 0 &&
        collectionChange.getDirtiedKeys().length == 0)
      {
        var updatedKeys = collectionChange.getUpdatedKeys();

        for (var i = 0, numKeys = updatedKeys.length; i < numKeys; ++i)
        {
          // Get the key
          var key = updatedKeys[i];

          // Remove any children for the row key
          var removed = amxNode.removeChildrenByKey(key);
          for (var r = 0, numRemoved = removed.length; r < numRemoved; ++r)
          {
            adf.mf.api.amx.removeDomNode(document.getElementById(removed[r].getId()));
          }

          // Recreate the children
          amxNode.createStampedChildren(key, [ null ]);
        }

        // Re-render the parent AmxNode that has DOM since the iterator does not produce
        // any DOM itself that can be refreshed
        return adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];
      }

      // Unsupported collection change
      return adf.mf.api.amx.AmxNodeChangeResult["REPLACE"];
    }

    // This should not happen, iterator supports no other EL bound attributes at this time,
    // but re-render in case someone is using a "fake attribute change" to force re-rendering
    return adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];
  };

  iterator.prototype.visitChildren = function(amxNode, visitContext, callback)
  {
    var dataItems = amxNode.getAttribute("value");
    var iter = adf.mf.api.amx.createIterator(dataItems);
    var variableName = amxNode.getAttribute("var");
    var valueElExpression = amxNode.getAttributeExpression("value", false, true);

    // TODO: implement an optimized visit if only certain nodes need to be walked
    // var nodesToWalk = visitContext.getChildrenToWalk();
    while (iter.hasNext())
    {
      var item = iter.next();
      adf.mf.el.pushVariable(variableName, item);
      try
      {
        pushElValueReplacement(amxNode, iter, variableName, valueElExpression);

        if (amxNode.visitStampedChildren(iter.getRowKey(), [null], null, visitContext, callback))
        {
          return true;
        }
      }
      finally
      {
        adf.mf.el.popVariable(variableName);
        popElValueReplacement(amxNode, iter);
      }
    }

    return false;
  };

  iterator.prototype.isFlattenable = function(amxNode)
  {
    return true;
  };

  /**
   * Function used by both the list view and the iterator to
   * perform a variable substitution on the "var" variable so that any
   * objects that do not come directly from a binding (i.e. an array) are
   * escaped so that they are resolvable in the embedded side.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the iterator or listView AMX node
   * @param {object} iter the iterator returned from adf.mf.api.amx.createIterator
   * @param {string} variableName the "var" value for the node
   * @param {string} varEl the EL expression of the value attribute
   */
  function pushElValueReplacement(
    amxNode,
    iter,
    variableName,
    varEL)
  {
    if (!iter.isTreeNodeIterator())
    {
      var replacements = {};
      var rowKey = iter.getRowKey().toString().replace("'", "\\'");

      replacements[variableName] = varEL.appendIndex(rowKey);
      amxNode.__pushElReplacements(replacements);
    }
  }

  /**
   * Corresponding function to the pushElValueReplacement to undo the changes
   * to the environment.
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode the iterator or listView AMX node
   * @param {object} iter the iterator returned from adf.mf.api.amx.createIterator
   */
  function popElValueReplacement(
    amxNode,
    iter)
  {
    if (!iter.isTreeNodeIterator())
    {
      amxNode.__popElReplacements();
    }
  }

  function _setVolatileStateProperty(amxNode, key, value)
  {
    var volatileState = amxNode.getVolatileState();
    if (volatileState === undefined)
    {
      volatileState = {};
      amxNode.setVolatileState(volatileState);
    }
    volatileState[key] = value;
  };

  /**
   * Retrieves null or the rowKey of the first list item row key to try scrolling to.
   * @param {String} listViewAmxNode the AMX Node we are working with.
   * @return {String} null or the rowKey
   */
  function _getInitialScrollRowKey(listViewAmxNode)
  {
    var initialScrollRowKeys =
      _getNormalizedRowKeys(listViewAmxNode.getAttribute("initialScrollRowKeys"));
    if (initialScrollRowKeys != null)
      return initialScrollRowKeys[0];
    return null;
  }

  /**
   * Shared utility for "RowKeys" attributes that might be an array or keys,
   * a number, or a string whose value is a key or has keys delimited.
   * @param {Object} rowKeys the AmxNode "row keys" value
   * @return {Array<Object>} null or an array of row keys adapted from the given value
   */
  function _getNormalizedRowKeys(rowKeys)
  {
    if (rowKeys == null)
      return rowKeys;

    // Parse the keys if applicable
    if (typeof rowKeys === "string" || rowKeys instanceof String)
    {
      if (rowKeys.indexOf(",") > -1)
        rowKeys = rowKeys.split(","); // comma-delimited
      else if (rowKeys.indexOf(" ") > -1)
        rowKeys = rowKeys.split(" "); // space-delimited
      else
        rowKeys = [rowKeys];
    }
    else if (typeof rowKeys === "number" || rowKeys instanceof Number)
    {
      rowKeys = [rowKeys];
    }
    return rowKeys;
  }

  /**
   * Stores the rowKey of the selected list item.
   * @param {String} selectedRowKey null or the rowKey
   * @param {String} listViewAmxNode the AMX Node we are working with.
   */
  function _storeSelectedRowKey(selectedRowKey, listViewAmxNode)
  {
    var selectedRowKeysEL = listViewAmxNode.getAttributeExpression("selectedRowKeys");

    listViewAmxNode.setAttributeResolvedValue("_selectedRowKey", selectedRowKey);

    if (selectedRowKeysEL === undefined || selectedRowKeysEL == null)
    {
      _setVolatileStateProperty(listViewAmxNode, "selectedRowKey", selectedRowKey);
    }
    else
    {
      // In order to evaluate the EL, we must be in the correct EL context
      adf.mf.api.amx.getPageRootNode().visit(
        new adf.mf.api.amx.VisitContext({ "amxNodes": [ listViewAmxNode ] }),
        function (
          visitContext,
          amxNode)
        {
          adf.mf.el.setValue({'name':selectedRowKeysEL, 'value':[selectedRowKey]},
            function() {;}, null);
          return adf.mf.api.amx.VisitResult["COMPLETE"];
        });
     }
   }

  /**
   * Retrieves null or the rowKey of the selected list item.
   * @param {String} listViewAmxNode the AMX Node we are working with.
   * @return {String} null or the rowKey
   */
  function _getSelectedRowKey(listViewAmxNode)
  {
    var selectedRowKeysEL = listViewAmxNode.getAttributeExpression("selectedRowKeys");
    if (selectedRowKeysEL === undefined || selectedRowKeysEL == null)
    {
      var storedData = listViewAmxNode.getVolatileState();
      if (storedData != null)
      {
        var storedKey = storedData["selectedRowKey"];
        if (storedKey === undefined)
          return null;
        return storedKey;
      }
    }
    else
    {
      var keySet =
        _getNormalizedRowKeys(adf.mf.el.getLocalValue(selectedRowKeysEL));

      if (keySet != null)
        return keySet[0];
    }
    return null;
  }

  /**
   * Adds a marker class to the specified listItem element to make it appear selected.
   * Identifies to assistive technology (e.g. VoiceOver) that the listItem is selected.
   * @param {adf.mf.api.amx.AmxNode} listViewAmxNode the AmxNode of the listView
   * @param {Object} listItemElement the list item element that should be selected
   */
  function _markRowAsSelected(listViewAmxNode, listItemElement)
  {
    // Look at the tag to see if a selectionListener was specified.
    // We don't look at the AmxNode directly because it is a special attribute
    // that won't have its EL evaluated in the AMX layer.
    var listViewTag = listViewAmxNode.getTag();
    var selectionListener = listViewTag.getAttribute("selectionListener");
    if (selectionListener != null)
    {
      listItemElement.classList.add("amx-listItem-selected");
      listItemElement.setAttribute("aria-selected", true);
    }
  }

  /**
   * Removes the marker class from the specified listItem element to make it appear unselected.
   * Identifies to assistive technology (e.g. VoiceOver) that the listItem is no longer selected.
   * @param {Object} listItemElement the list item element that should be unselected
   */
  function _markRowAsUnselected(listItemElement)
  {
    listItemElement.classList.remove("amx-listItem-selected");
    listItemElement.setAttribute("aria-selected", false);
  }

  /**
   * Get the child elements that have the specified class names.
   * @param {HTMLElement} parentElement the element whose children will be traversed
   * @param {Array<String>} classNames the class names to search for
   * @return {Array} an array of found elements whose entries match the specified classNames order
   */
  function _getChildrenByClassNames(parentElement, classNames)
  {
    var childNodes = parentElement.childNodes;
    var childNodeCount = childNodes.length;
    var classNameCount = classNames.length;
    var foundChildren = [];
    var foundCount = 0;
    for (var i = 0; i < childNodeCount && foundCount < classNameCount; ++i)
    {
      var child = childNodes[i];
      for (var j = 0; j < classNameCount; ++j)
      {
        if (child.classList.contains(classNames[j]))
        {
          foundChildren[j] = child;
          ++foundCount;
          break;// done with this specific child
        }
      }
    }
    return foundChildren;
  }

  function handleMove(listItemElement)
  {
    var dropSpaceElement = null;
    var rowKeyMoved = null;
    var rowKeyInsertedBefore = null;
    var listItemOffsetHeight = null;
    var maximumDragTop = null;
    var listItemHandleElement = _getChildrenByClassNames(listItemElement, ["amx-listItem-handle"])[0];
    if (listItemHandleElement != null)
    {
      adf.mf.api.amx.addDragListener(listItemHandleElement,
      {
        "start": function(event, dragExtra)
        {
          // Declare this element as the one that is currently handling drag events:
          var element = this;
          dragExtra.requestDragLock(element, true, true);

          rowKeyMoved = undefined;
          rowKeyInsertedBefore = undefined;
          listItemOffsetHeight = listItemElement.offsetHeight;
          maximumDragTop = listItemElement.parentNode.scrollHeight + 1 + listItemOffsetHeight / 2;
          var amxNode = adf.mf.internal.amx._getNonPrimitiveElementData(listItemElement, "amxNode");
          if (amxNode != null)
          {
            rowKeyMoved = amxNode.getStampKey();
          }
          listItemElement.classList.add("move");
          dropSpaceElement = document.createElement("div");
          dropSpaceElement.className = "amx-listItem amx-listItem-drop-spacer";
          _insertAfter(listItemElement.parentNode, listItemElement, dropSpaceElement);
        },
        "drag": function(event, dragExtra)
        {
          event.preventDefault();
          event.stopPropagation();
          //since "drag" is a meta-event and we are consuming it, we also need to indicate to the parent
          //event handler to consume the "source" event as well
          dragExtra.preventDefault = true;
          dragExtra.stopPropagation = true;
          var listItemElementTop = adf.mf.internal.amx.getElementTop(listItemElement);
          var eventPageY = dragExtra.pageY;
          var top = listItemElementTop + dragExtra.deltaPageY;
          var innerListElement = listItemElement.parentNode;
          var parentOffsetTop = adf.mf.internal.amx.getElementTop(innerListElement);
          if (top < parentOffsetTop)
          {
            top = parentOffsetTop;
          }

          //scroll view
          if (top <= parentOffsetTop + 5)
          {
            innerListElement.setAttribute("data-stop", false);
            scrollView(innerListElement, -1);
          }
          else if (top + listItemOffsetHeight >= parentOffsetTop + innerListElement.offsetHeight - 5)
          {
            innerListElement.setAttribute("data-stop", false);
            scrollView(innerListElement, 1);
          }
          else
          {
            innerListElement.setAttribute("data-stop", true);
          }

          // Reposition the dragged element but don't let it go on forever past the last item in the list:
          var halfItemHeight = listItemOffsetHeight / 2;
          var currentDragTop = eventPageY - halfItemHeight - parentOffsetTop + innerListElement.scrollTop;
          var newListItemTop = Math.min(maximumDragTop, currentDragTop);
          listItemElement.style.top = newListItemTop + "px";

          innerListElement.classList.add("notSelect");

          // Move around the drop space element:
          var listViewChildren = innerListElement.childNodes;
          var siblingItems = [];
          for (var i = 0, childCount=listViewChildren.length; i < childCount; ++i)
          {
            var listViewChild = listViewChildren[i];
            if (listViewChild.classList.contains("amx-listItem") &&
              !listViewChild.classList.contains("amx-listItem-drop-spacer") &&
              !listViewChild.classList.contains("move") &&
              !listViewChild.classList.contains("amx-listItem-moreRows"))
            {
              siblingItems.push(listViewChild);
            }
          }

          for (var i = 0, siblingCount=siblingItems.length; i < siblingCount; ++i)
          {
            var siblingItemElement = siblingItems[i];
            var siblingItemOffsetTop = siblingItemElement.offsetTop;
            var siblingItemOffsetHeight = siblingItemElement.offsetHeight;
            var draggedItemOffsetTop = listItemElement.offsetTop + halfItemHeight;
            if (siblingItemOffsetTop <= draggedItemOffsetTop &&
              draggedItemOffsetTop <= siblingItemOffsetTop + siblingItemOffsetHeight)
            {
              if (draggedItemOffsetTop <= siblingItemOffsetTop + siblingItemOffsetHeight / 2)
              {
                innerListElement.insertBefore(dropSpaceElement, siblingItemElement);
              }
              else
              {
                _insertAfter(innerListElement, siblingItemElement, dropSpaceElement);
              }
              break;
            }
          }
        },
        "end": function(event, dragExtra)
        {
          var cloneElement = listItemElement.cloneNode(true);
          var innerListElement = listItemElement.parentNode;
          innerListElement.appendChild(cloneElement);
          listItemElement.style.display = "none";
          var nextRowElement = dropSpaceElement.nextSibling;
          if (nextRowElement != null)
          {
            var nextRowAmxNode = adf.mf.internal.amx._getNonPrimitiveElementData(nextRowElement, "amxNode");
            if (nextRowAmxNode != null)
            {
              rowKeyInsertedBefore = nextRowAmxNode.getStampKey();
            }
          }

          var rowHeight = cloneElement.offsetHeight;
          _animateForReorder(
            cloneElement,
            {
              "opacity": 0,
              "height": 0
            },
            function()
            {
              adf.mf.api.amx.removeDomNode(cloneElement);
              _insertAfter(innerListElement, dropSpaceElement, listItemElement);
              listItemElement.style.display = "";
              listItemElement.classList.remove("move");
              listItemElement.style.top = "";
              adf.mf.api.amx.removeDomNode(dropSpaceElement);
            });

          _animateForReorder(
            dropSpaceElement,
            {
              "height": rowHeight+"px"
            });

          innerListElement.classList.remove("notSelect");
          innerListElement.setAttribute("data-stop", true);
          if (typeof rowKeyMoved !== "undefined")
          {
            var moveEvent = new adf.mf.internal.amx.MoveEvent(rowKeyMoved, rowKeyInsertedBefore);
            var listView = findListViewAncestor(listItemElement);
            if (listView != null)
            {
              var amxNode = adf.mf.internal.amx._getNonPrimitiveElementData(listView, "amxNode");
              adf.mf.api.amx.processAmxEvent(amxNode, "move", undefined, undefined, moveEvent);
            }
          }
        }
      });
    }
  }

  function _animateForReorder(element, properties, completeCallback)
  {
    adf.shared.impl.animationUtils._requestAnimationFrame(
      function()
      {
        var transitionProperty =
          adf.shared.impl.animationUtils._getBrowserSpecificName("transition");

        var style = element.style;
        if (properties.hasOwnProperty("height"))
        {
          // Allow height to be animated:
          style.height = element.offsetHeight + "px";
          style.minHeight = 0;
          style.overflow = "hidden";
        }

        // Set up the transition mode:
        style[transitionProperty] = "all .4s ease-in-out";

        adf.shared.impl.animationUtils._requestAnimationFrame(
          function()
          {
            // Apply the new animated property values:
            for (var key in properties)
            {
              style[key] = properties[key];
            }

            if (completeCallback)
            {
              adf.shared.impl.animationUtils.addOneTimeTransitionEndWithFailsafe(
                element,
                completeCallback);
            }
          });
      });
  }

  /**
   * Locates the first listView parent for the given node.
   * @param {HTMLElement} element some element whose nearest listView ancestor we are seeking
   * @return {HTMLElement} the nearest listView ancestor if there is one, undefined otherwise
   */
  function findListViewAncestor(element)
  {
    if (element)
    {
      var parentElement = element.parentNode;
      while (parentElement != null)
      {
        if (parentElement.classList && parentElement.classList.contains("amx-listView"))
        {
          return parentElement;
        }
        parentElement = parentElement.parentNode;
      }
    }
  }

  function switchToEditMode(typeHandler, listViewAmxNode, innerListElement, rootElement)
  {
    // MDO - bug 14033329: ignore editMode when listView is static
    if (listViewAmxNode == null || listViewAmxNode.getAttribute("value") === undefined)
    {
      return;
    }

    // Now in edit mode:
    innerListElement.classList.add("amx-listView-editMode");

    // Make adjustments for sticky dividers:
    var container = findListViewAncestor(innerListElement);

    // Make adjustments for the index bar:
    var indexBar = container.querySelector(".amx-listView-index");
    if (indexBar)
    {
      // remove index bar if exists and remove item handlers
      adf.mf.api.amx.removeDomNode(indexBar);
      adf.mf.api.amx.removeBubbleEventListener(window, "resize", indexBarResizeHandler, listViewAmxNode);

    }

    // Add the draggable handle nodes:
    var children = innerListElement.childNodes;// get the 1st-level children (e.g. listItems but could be others)
    for (var i = 0; i < children.length; ++i)
    {
      var child = children[i];
      if (child.classList.contains("amx-listView-group"))
      {
        // in case that there is one extra div in hierarchy we need to add it's children into its parent
        var groupChildren = child.childNodes;
        for (var gi = 0; gi < groupChildren.length; ++gi)
        {
          var groupChild = groupChildren[gi];
          // we can't use "adf.mf.api.amx.removeDomNode" here because
          // we want to keep content of this child
          child.removeChild(groupChild);
          if (groupChild.classList.contains("amx-listItem") &&
            !groupChild.classList.contains("amx-listItem-moreRows") &&
            !groupChild.classList.contains("amx-listView-divider"))
          {
            innerListElement.appendChild(groupChild);
            // we don't have to create handle here because we are on the same index all the time
            // thanks to the --i line.
          }
          --gi;
        }
        adf.mf.api.amx.removeDomNode(child);
        --i;
      }
      else
      {
        if (child.classList.contains("amx-listItem") &&
          !child.classList.contains("amx-listItem-moreRows"))
        {
          // child is a listItem
          createHandle(child);
        }
        else if (child.classList.contains("amx-listView-divider"))
        {
          adf.mf.api.amx.removeDomNode(child);
          --i;
        }
      }
    }

    // We use only one scroll listener for all things scrolling-related;
    // it gets replaced in the refresh phase too:
    typeHandler._createScrollHandler(listViewAmxNode, innerListElement, rootElement);
  }

  function createHandle(itemElement)
  {
    var handle = document.createElement("div");
    handle.className = "amx-listItem-handle";
    itemElement.appendChild(handle);
    handleMove(itemElement);
  }

  function scrollView(scrollableElement, direction)
  {
    direction = direction == 1 ? 1 : -1;
    var stop = adf.mf.api.amx.isValueTrue(scrollableElement.getAttribute("data-stop"));
    scrollableElement.scrollTop = scrollableElement.scrollTop + (direction * 5);
    if (!stop)
    {
      setTimeout(function()
      {
        scrollView(scrollableElement, direction);
      },
      300);
    }
  }

  function _insertAfter(parentElement, referenceChild, childToInsert)
  {
    var nodeAfterInsert = referenceChild.nextSibling;
    if (nodeAfterInsert == null)
    {
      parentElement.appendChild(childToInsert);
    }
    else
    {
      parentElement.insertBefore(childToInsert, nodeAfterInsert);
    }
  }

  function requestAnimationFramePolyfill(callback)
  {
    var lastTime = 0;
    var vendors = ['webkit', 'ms', 'moz', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x)
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
  }

})();
