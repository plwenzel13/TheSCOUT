/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
(function()
{
  var panelItem = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "panelItem");

  panelItem.prototype.render = function(amxNode)
  {
    // Attributes:
    //   animation (String; animation override for this panelItem; use the panelSplitter's by default)
    //   shortDesc (String)

    // Create the top level div that will hhouse all the components used in the splitter.
    var rootElement = document.createElement("div");
    rootElement.setAttribute("title", this._ensureValidString(amxNode.getAttribute("shortDesc"), ""));
    var descendants = amxNode.renderDescendants();
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      rootElement.appendChild(descendants[i]);
    }
    rootElement.classList.add("current");
    return rootElement;
  };

  panelItem.prototype._ensureValidString = function(rawValue, defaultValue)
  {
    // TODO is there a shared util we can use instead?
    if (rawValue == null)
      return defaultValue;
    return rawValue;
  };

  var panelSplitter = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "panelSplitter");

  panelSplitter.prototype.createChildrenNodes = function(amxNode)
  {
    var tag = amxNode.getTag();
    if (amxNode.getAttribute("selectedItem") === undefined)
    {
      // See if this is EL bound and the value is currently not loaded
      if (tag.isAttributeElBound("selectedItem"))
      {
        // In this case we cannot create the children yet
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["INITIAL"]);
        return true;
      }

      // Otherwise the attribute was simply not specified, so default
      // to the first item found
    }

    var selectedTag = this._getSelectedTag(amxNode);
    var resolvedSelectedItemId = selectedTag == null ? null : selectedTag.getAttribute("id");
    this._setVolatileStateProperty(amxNode, "resolvedSelectedItemId", resolvedSelectedItemId);

    // Create the child for the selected item
    if (selectedTag != null)
      amxNode.addChild(selectedTag.buildAmxNode(amxNode, null));

    // Process the navigator facet
    var navigatorFacetTag = tag.getChildFacetTag("navigator");
    if (navigatorFacetTag != null)
    {
      var facetTagChildren = navigatorFacetTag.getChildrenUITags();
      for (i = 0, size = facetTagChildren.length; i < size; ++i)
      {
        var facetTagChild = facetTagChildren[i];
        amxNode.addChild(facetTagChild.buildAmxNode(amxNode, null), "navigator");
      }
    }

    return true;
  };

  panelSplitter.prototype.attributeChangeResult = function(
    amxNode,
    attributeName,
    attributeChanges)
  {
    switch (attributeName)
    {
      case "selectedItem":
        // Using attributeChanges.getOldValue("selectedItem") isn't sufficient because we might also default to the 1st child in some cases
        var oldSelectedItem = amxNode.getVolatileState()["resolvedSelectedItemId"];
        var newSelectedItem = amxNode.getAttribute("selectedItem");
        if (newSelectedItem != oldSelectedItem)
        {
          var children = amxNode.getChildren();
          if (children.length > 0)
          {
            var oldSelectedNode = children[0];

            // Remove the old child
            amxNode.removeChild(oldSelectedNode);
          }

          // Create the new item
          var selectedTag = this._getSelectedTag(amxNode);

          // Create the child for the selected item
          amxNode.addChild(selectedTag.buildAmxNode(amxNode, null));

          // Update the selected item stored in the volatile state
          this._setVolatileStateProperty(amxNode, "resolvedSelectedItemId", selectedTag.getAttribute("id"));

          return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];
        }
        else
        {
          // Nothing really changed, so don't re-render anything
          return adf.mf.api.amx.AmxNodeChangeResult["NONE"];
        }

      default:
        return panelSplitter.superclass.attributeChangeResult.call(this,
          amxNode, attributeName, attributeChanges);
    }
  };

  panelSplitter.prototype.render = function(amxNode)
  {
    // Attributes:
    //   animation (String; default animation for a panelItem)
    //   inlineStyle (String)
    //   navigatorTitle (String)
    //   position (String; CSS length)
    //   selectedItem (String; id of a panelItem child)
    //   shortDesc (String)
    //   styleClass (String)

    // DOM Structure:
    //   root div data-orientation amx-panelSplitter
    //     div amx-panelSplitter_inner
    //       div amx-panelSplitter_button (has optional "disclosed", "no-animate")
    //       div amx-panelSplitter_screenPortrait
    //       div amx-panelSplitter_navLandscape
    //         navigator facet e.g. listView component (if displaying in landscape mode)
    //       div amx-panelSplitter_navPortrait (has optional "no-animate")
    //         navigator facet e.g. listView component (if displaying in portrait mode)
    //       div amx-panelSplitter_contentContainer amx-landscape/amx-portrait amx-noNavigation
    //         div amx-panelSplitter_items amx-landscape/amx-portrait amx-noNavigation
    //           div amx-panelItem current/new/old/showing/transitioning/transitioning-slow/face/front/flip

    try
    {
      // Get the initial portrait/landscape mode (updates are handled during resize).
      var orientation = this._getOrientation();

      var position = this._getPosition(amxNode);

      // Create the top level div that will house all the components used in the splitter.
      var rootElement = document.createElement("div");
      rootElement.setAttribute("title", this._ensureValidString(amxNode.getAttribute("shortDesc"), ""));
      rootElement.setAttribute("data-orientation", orientation);

      // =-= melges:
      // This is a bit of a hack but we need to create an inner DIV to protect from styling infringing on the
      // splitter content and navigation elements. Without this we would get extra space in both.
      var inner = document.createElement("div");
      inner.className = "amx-panelSplitter_inner";
      rootElement.appendChild(inner);

      var content = document.createElement("div");
      content.className = "amx-panelSplitter_contentContainer";
      adf.mf.api.amx.enableScrolling(content);
      // Adding WAI-ARIA Role Attribute for the content div
      content.setAttribute("role", "contentinfo");

      var items = document.createElement("div");
      items.className = "amx-panelSplitter_items";
      content.appendChild(items);

      //  First thing to check for is that we have a navigator facet.
      var navigatorChildren = amxNode.getRenderedChildren("navigator");
      if (navigatorChildren.length > 0)
      {
        var inLandscape = (orientation == "landscape"); // side-by-side mode
        this._createNavigation(inLandscape, amxNode, inner, rootElement, position);
        if (inLandscape)
        {
          content.classList.add("amx-landscape");
          if (document.documentElement.dir == "rtl")
            content.style.right = position.landscape;
          else
            content.style.left = position.landscape;
        }
        else
        {
          content.classList.add("amx-portrait");
        }
      }
      else
      {
        content.classList.add("amx-noNavigation");
      }

      inner.appendChild(content);

      // Render the items.
      var children = amxNode.getRenderedChildren();
      var selectedNode = children.length > 0 ? children[0] : null;
      if (selectedNode != null)
      {
        var viewElement = selectedNode.render();
        if (viewElement != null)
        {
          viewElement.classList.add("current");
          items.appendChild(viewElement);
        }
      }

      return rootElement;
    }
    catch (problem)
    {
      console.error(problem);
    }
  };

  panelSplitter.prototype.postDisplay = function(rootElement, amxNode)
  {
    try
    {
      var inner = rootElement.firstChild;
      var foundChildNodes =
        this._getChildrenByClassNames(
          inner,
          [
            "amx-panelSplitter_navLandscape",
            "amx-panelSplitter_navPortrait",
            "amx-panelSplitter_contentContainer"
          ]);
      var navLandscape = foundChildNodes[0];
      var navPortrait  = foundChildNodes[1];
      var content      = foundChildNodes[2];

      // Restore the old scroll position in case this view instance already had one:
      var storedData = amxNode.getClientState();
      if (storedData != null)
      {
        this._restoreScrollPositions(navLandscape, storedData.navLandscape);
        this._restoreScrollPositions(navPortrait, storedData.navPortrait);
        this._restoreScrollPositions(content, storedData.content);
      }

      // Add resize event listeners
      if (amxNode.getChildren("navigator").length > 0)
      {
        var eventData = {
          "rootElement": rootElement,
          "peer":        this,
          "amxNode":     amxNode
        };
        this._setVolatileStateProperty(amxNode, "resizeData", eventData);

        // Listen if someone resizes the window:
        adf.mf.api.amx.addBubbleEventListener(window, "resize", this._handleResize, eventData);

        // Listen if someone explicitly queues a resize on my root element:
        adf.mf.api.amx.addBubbleEventListener(rootElement, "resize", this._handleResize, eventData);
      }
    }
    catch (problem)
    {
      console.error(problem);
    }
  };

  panelSplitter.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    try
    {
      panelSplitter.superclass.refresh.call(this,
        amxNode, attributeChanges, descendentChanges);

      // The old child will be removed by the createChildrenNodes function
      // which is called before the refresh function, but the new
      // selected node needs to be rendered still.
      var children = amxNode.getRenderedChildren();
      if (children.length == 0)
      {
        // There was no selected node found (no children tags) so there is
        // nothing to do.
        return;
      }

      // get the current root element
      var rootElement = document.getElementById(amxNode.getId());
      var inner = rootElement.firstChild;
      var content = this._getChildrenByClassNames(inner, ["amx-panelSplitter_contentContainer"])[0];
      var items = content.firstChild;

      if (rootElement.classList.contains("changingSelectedItem"))
      {
        // Changing the selected item too quickly--another one is in progress.
        // TODO need to handle this scenario (if can't clean up the DOM then cover up the navigators when busy)
      }
      rootElement.classList.add("changingSelectedItem");

      var currentPanelItem = this._getChildrenByClassNames(items, ["current"])[0];

      // Render the newly-selected panelItem
      var selectedNode = children[0];
      var viewElement = selectedNode.render();
      if (viewElement != null)
      {
        var resolvedSelectedItemId = viewElement == null ? null : viewElement.getAttribute("id");
        this._setVolatileStateProperty(amxNode, "resolvedSelectedItemId", resolvedSelectedItemId);
        viewElement.classList.add("new");
        items.appendChild(viewElement);
        // --MRE: This is a temporary fix for resizing certain components like DVT. The issue is when the component
        // is created it does not know the size and defaults to a much smaller size. This will now call the
        // resize event if there is only a single child root element.
        if (viewElement.childNodes.length == 1)
        {
          adf.mf.api.amx.triggerBubbleEventListener(viewElement.childNodes[0], "resize");
        }
      }

      // Animate the transition of the old-to-new panelItems
      if (rootElement.getAttribute("data-orientation") == "portrait")
      {
        try
        {
          var position = this._getPosition(amxNode);
          this._undiscloseNavPortrait(rootElement, position);
        }
        catch (problem)
        {
          console.error(problem);
        }
      }

      var newPanelItem = this._getChildrenByClassNames(items, ["new"])[0];
      var transitionType = this._getTransitionParams(amxNode, selectedNode);

      if (transitionType == "none")
        transitionType = null;

      if (transitionType != null)
      {
        if (this._pageTransitionCancelFunction != null)
          this._pageTransitionCancelFunction();

        // Prevent AMX node hierarchy and DOM node changes during transition animation
        adf.mf.internal.amx.pauseUIChanges();

        // Ensure prerequisites are met:
        currentPanelItem.style.display = "block";
        newPanelItem.style.display = "block";
        newPanelItem.classList.remove("new");
        newPanelItem.classList.add("current");

        var properties = {};
        properties["parentFlipAllowed"] = true; // no other visible siblings plus parent and grandparent have equal dimensions
        properties["dimensionsFromParent"] = true;
        properties["finishedFunction"] = adf.shared.impl.animationUtils.getProxyFunction(this, this._animationFinished);
        properties["callbackParams"] = [ newPanelItem, items, rootElement ];
        properties["animationEnabled"] = true;
        properties["isRtl"] = document.documentElement.dir == "rtl";
        properties["fineLogger"] = function(message)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.internal.amx.panelSplitter", "refresh", message);
        };

        this._pageTransitionCancelFunction =
          adf.shared.impl.animationUtils.transition( // WARNING this is impl (not a public API) and will change without notice
            transitionType,
            currentPanelItem,
            newPanelItem,
            properties);
      }
      else // no animation
      {
        newPanelItem.classList.remove("new");
        newPanelItem.classList.add("current");
        this._removeAllButThisOrTheOnlyPanelItem(newPanelItem, items);
        rootElement.classList.remove("changingSelectedItem");
      }
    }
    catch (problem)
    {
      console.error(problem);
    }
  };

  panelSplitter.prototype.preDestroy = function(rootElement, amxNode)
  {
    // Store off the current scroll position in case this view instance is ever revisited:
    this._storeScrollPositions(rootElement, amxNode);

    // Clean up the window resize listener:
    var volatileState = amxNode.getVolatileState();
    if (volatileState)
    {
      var resizeData = volatileState["resizeData"];
      if (resizeData)
      {
        adf.mf.api.amx.removeBubbleEventListener(window, "resize", this._handleResize, resizeData);
      }
    }
  };

  panelSplitter.prototype.__getTestJavaScriptURI = function(amxTag)
  {
    return "js/testing/amx-panelSplitter.js";
  };

  panelSplitter.prototype._setVolatileStateProperty = function(amxNode, key, value)
  {
    var volatileState = amxNode.getVolatileState();
    if (volatileState === undefined)
    {
      volatileState = {};
      amxNode.setVolatileState(volatileState);
    }
    volatileState[key] = value;
  };

  panelSplitter.prototype._animationFinished = function(callbackParams)
  {
    var newPanelItem = callbackParams[0];
    var items = callbackParams[1];
    var rootElement = callbackParams[2];
    this._removeAllButThisOrTheOnlyPanelItem(newPanelItem, items);
    rootElement.classList.remove("changingSelectedItem");
    this._pageTransitionCancelFunction = null;
    adf.mf.internal.amx.resumeUIChanges();
  };

  panelSplitter.prototype._getSelectedTag = function(amxNode)
  {
    var tag = amxNode.getTag();
    var selectedItem = amxNode.getAttribute("selectedItem");
    var childrenTags = tag.getChildren(adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
      "panelItem");
    var firstTag = null;

    // Loop through all the children UI tags and look for the selected
    // tag. If there is no selected item, use the first child tag
    for (var i = 0, size = childrenTags.length; i < size; ++i)
    {
      var childTag = childrenTags[i];
      if (selectedItem == null)
      {
        // Just use the first UI tag if there is no selected one
        return childTag;
      }

      if (i == 0)
      {
        // Remember the first tag in case the selected one is not found
        firstTag = childTag;
      }

      // The selected item is the ID (not scoped ID) of the child tag. If this
      // matches use this tag.
      if (childTag.getAttribute("id") == selectedItem)
      {
        return childTag;
      }
    }

    // If the selected tag was never found, use the first tag instead
    return firstTag;
  };

  panelSplitter.prototype._removeAllButThisOrTheOnlyPanelItem = function(panelItemToKeep, items)
  {
    var childNodes = items.childNodes;
    var childNodeCount = childNodes.length;
    for (var i=childNodeCount; i>=0 && items.childNodes.length > 1; --i)
    {
      var child = childNodes[i];
      if (child != panelItemToKeep)
        adf.mf.api.amx.removeDomNode(child);
    }
  };

  /**
   * Get the child elements that have the specified class names.
   * @param {HTMLElement} parentElement the element whose children will be traversed
   * @param {Array<String>} classNames the class names to search for
   * @return {Array} an array of found elements whose entries match the specified classNames order
   */
  panelSplitter.prototype._getChildrenByClassNames = function(parentElement, classNames)
  {
    var childNodes = parentElement.childNodes;
    var childNodeCount = childNodes.length;
    var classNameCount = classNames.length;
    var foundChildren = [];
    var foundCount = 0;
    for (var i=0; i<childNodeCount && foundCount<classNameCount; ++i)
    {
      var child = childNodes[i];
      for (var j=0; j<classNameCount; ++j)
      {
        if (child.classList.contains(classNames[j]))
        {
          foundChildren[j] = child;
          ++foundCount;
          break; // done with this specific child
        }
      }
    }
    return foundChildren;
  };

  panelSplitter.prototype._storeScrollPositions = function(rootElement, amxNode)
  {
    // Store off the current scroll position in case this view instance is ever revisited:
    var inner = rootElement.firstChild;
    var foundChildNodes =
      this._getChildrenByClassNames(
        inner,
        [
          "amx-panelSplitter_navLandscape",
          "amx-panelSplitter_navPortrait",
          "amx-panelSplitter_contentContainer"
        ]);
    var navLandscape = foundChildNodes[0];
    var navPortrait  = foundChildNodes[1];
    var content      = foundChildNodes[2];
    var storedData =
    {
      navLandscape: this._getScrollPositions(navLandscape),
      navPortrait:  this._getScrollPositions(navPortrait),
      content:      this._getScrollPositions(content)
    };
    amxNode.setClientState(storedData);
  };

  panelSplitter.prototype._getScrollPositions = function(domNode)
  {
    if (domNode)
    {
      var scrollLeft = domNode.scrollLeft;
      var scrollTop = domNode.scrollTop;
      if (scrollLeft != null && scrollTop != null)
      {
        return {
          scrollLeft: scrollLeft,
          scrollTop: scrollTop
        };
      }
    }
    return null;
  };

  panelSplitter.prototype._restoreScrollPositions = function(domNode, scrollPositions)
  {
    if (domNode && scrollPositions)
    {
      var scrollLeft = scrollPositions.scrollLeft;
      if (scrollLeft != null)
        domNode.scrollLeft = scrollLeft;
      var scrollTop = scrollPositions.scrollTop;
      if (scrollTop != null)
        domNode.scrollTop = scrollTop;
    }
  };

  panelSplitter.prototype._getTransitionParams = function(amxNodeSplitter, amxNodePanelItem)
  {
    // The panelItem we are going to show has first crack at defining the animation.
    var animation = "none";

    if (amxNodePanelItem.getAttribute("animation") != null)
    {
      animation = amxNodePanelItem.getAttribute("animation");
    }
    else if (amxNodeSplitter.getAttribute("animation") != null)
    {
      animation = amxNodeSplitter.getAttribute("animation");
    }
    return animation;
  };

  panelSplitter.prototype._getAttribute = function(rawValue, defaultValue)
  {
    if (rawValue == null || rawValue == "")
      return defaultValue;
    if (adf.mf.environment.profile.dtMode && rawValue.charAt(0) == "#")
      return defaultValue;
    return rawValue;
  };

  panelSplitter.prototype._getPosition = function(amxNodeSplitter)
  {
    var positionLandscape = this._getAttribute(amxNodeSplitter.getAttribute("position"), "31.25%");
    var positionPortrait = "41.67%"; // TODO we ought to expose an API for this
    return {
      landscape: positionLandscape,
      portrait:  positionPortrait
    };
  };

  panelSplitter.prototype._getOrientation = function()
  {
    if (document.body.offsetWidth < document.body.offsetHeight)
    {
      return "portrait";
    }
    return "landscape";
  };

  /**
   * Private function to create the navigation content.
   */
  panelSplitter.prototype._createNavigation = function(inLandscape, amxNode, inner, rootElement, position)
  {
    var navLandscape = document.createElement("div");
    navLandscape.className = "amx-panelSplitter_navLandscape";
    adf.mf.api.amx.enableScrolling(navLandscape);
    navLandscape.style.width = position.landscape;

    // Adding WAI-ARIA Role Attribute for the navigation div
    navLandscape.setAttribute("role", "navigation");

    var screenPortrait = document.createElement("div");
    screenPortrait.className = "amx-panelSplitter_screenPortrait";
    screenPortrait.style.display = "none";

    var button = document.createElement("div");

    // WAI-ARIA support:
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
    button.setAttribute("aria-expanded", "false");
    var defaultTitle =
      adf.mf.resource.getInfoString("AMXInfoBundle","amx_panelSplitter_NAVIGATOR_TOGGLE_BUTTON");
    var buttonTitle = this._ensureValidString(
      amxNode.getAttribute("navigatorTitle"),
      defaultTitle); // TODO same title for disclose and undisclose?
    button.setAttribute("title", buttonTitle);

    button.className = "amx-panelSplitter_button";
    inner.appendChild(button);
    inner.appendChild(screenPortrait);
    inner.appendChild(navLandscape);

    // Bind the screenPortrait and the button to the toggle code:
    var data = {"rootElement": rootElement, "amxNode": amxNode, "peer": this};
    adf.mf.api.amx.addBubbleEventListener(screenPortrait, "tap", this._handleNavPortraitToggle, data);
    adf.mf.api.amx.addBubbleEventListener(button, "tap", this._handleNavPortraitToggle, data);

    var navPortrait = document.createElement("div");
    var navPortraitId = amxNode.getId() + "::navp";
    navPortrait.setAttribute("id", navPortraitId);
    button.setAttribute("aria-owns", navPortraitId);
    navPortrait.setAttribute("aria-hidden", "true");
    navPortrait.className = "amx-panelSplitter_navPortrait";
    adf.mf.api.amx.enableScrolling(navPortrait);
    inner.appendChild(navPortrait);
    navPortrait.style.width = position.portrait;

    // Adding WAI-ARIA Role Attribute for the navigation div
    navPortrait.setAttribute("role", "navigation");

    if (inLandscape)
    {
      navPortrait.style.opacity = "0";
      navPortrait.style.display = "none"; // TODO might need to do animation chaining now
      navPortrait.style.zIndex = "0";
      button.style.display = "none"; // TODO might need to do animation chaining now
    }
    else // in portrait
    {
      navLandscape.style.opacity = "0";
      navLandscape.style.display = "none"; // TODO might need to do animation chaining now
      if (document.documentElement.dir == "rtl")
        navPortrait.style.right = "-" + position.portrait;
      else
        navPortrait.style.left = "-" + position.portrait;
    }

    var initialNavigatorHome = inLandscape ? navLandscape : navPortrait;
    var navigatorChildren = amxNode.getRenderedChildren("navigator");
    for (var i = 0, size = navigatorChildren.length; i < size; ++i)
    {
      var subElement = navigatorChildren[i].render();
      if (subElement)
        initialNavigatorHome.appendChild(subElement);
    }
  };

  panelSplitter.prototype._handleNavPortraitToggle = function(event)
  {
    // TODO need to toggle the button label
    // TODO need to toggle the aria-hidden states of the navigator & content
    // TODO need to make sure that swiching orientations also updates both
    try
    {
      event.preventDefault();
      event.stopPropagation();
      var rootElement = event.data.rootElement;
      var peer = event.data.peer;
      var amxNode = event.data.amxNode;
      var position = peer._getPosition(amxNode);
      var inner = rootElement.firstChild;
      var button = peer._getChildrenByClassNames(inner, ["amx-panelSplitter_button"])[0];

      if (button.classList.contains("disclosed"))
      {
        // Animate the undisclosure of the navPortrait
        peer._undiscloseNavPortrait(rootElement, position);
      }
      else // undisclosed
      {
        // Animate the disclosure of the navPortrait
        peer._discloseNavPortrait(rootElement, position);
      }
    }
    catch (problem)
    {
      console.error(problem);
    }
  };

  panelSplitter.prototype._discloseNavPortrait = function(rootElement, position)
  {
    // 1. set the display of the screenPortrait to block
    var inner = rootElement.firstChild;
    var foundChildNodes =
      this._getChildrenByClassNames(
        inner,
        [
          "amx-panelSplitter_screenPortrait",
          "amx-panelSplitter_navPortrait",
          "amx-panelSplitter_button",
          "amx-panelSplitter_contentContainer"
        ]);
    var screenPortrait = foundChildNodes[0];
    var navPortrait    = foundChildNodes[1];
    var button         = foundChildNodes[2];
    var content        = foundChildNodes[3];

    if (screenPortrait && navPortrait && button)
    {
      screenPortrait.style.display = "block";

      // 2. set the opacity of amx-panelSplitter_navPortrait to full
      navPortrait.classList.add("no-animate"); // TODO this doesn't work; might need to do animation chaining now
      navPortrait.style.opacity = "1";
      navPortrait.style.display = "block"; // TODO might need to do animation chaining now
      navPortrait.style.zIndex = "1002";
      navPortrait.classList.remove("no-animate");

      // 3. set the start side of amx-panelSplitter_navPortrait to be zero
      var isRtl = (document.documentElement.dir == "rtl");
      if (isRtl)
        navPortrait.style.right = "0px";
      else
        navPortrait.style.left = "0px";

      // 4. set the start side of the button to be position.portrait
      if (isRtl)
        button.style.right = position.portrait;
      else
        button.style.left = position.portrait;

      // 5. add the disclosed marker class
      button.classList.add("disclosed");

      // 6. update for screen readers
      navPortrait.setAttribute("aria-hidden", "false");
      button.setAttribute("aria-expanded", "true");
      content.setAttribute("aria-hidden", "true");
    }
  };

  panelSplitter.prototype._undiscloseNavPortrait = function(rootElement, position)
  {
    // 1. set the display of the screenPortrait to none
    var inner = rootElement.firstChild;
    var foundChildNodes =
      this._getChildrenByClassNames(
        inner,
        [
          "amx-panelSplitter_screenPortrait",
          "amx-panelSplitter_navPortrait",
          "amx-panelSplitter_button",
          "amx-panelSplitter_contentContainer"
        ]);
    var screenPortrait = foundChildNodes[0];
    var navPortrait    = foundChildNodes[1];
    var button         = foundChildNodes[2];
    var content        = foundChildNodes[3];

    if (screenPortrait && navPortrait && button)
    {
      screenPortrait.style.display = "none";

      // 2. set the start side of amx-panelSplitter_navPortrait to be -position.portrait
      var isRtl = (document.documentElement.dir == "rtl");
      if (isRtl)
        navPortrait.style.right = "-" + position.portrait;
      else
        navPortrait.style.left = "-" + position.portrait;

      // 3. set the start side of the button to be zero
      if (isRtl)
        button.style.right = "0px";
      else
        button.style.left = "0px";

      // 4. add the disclosed marker class
      button.classList.remove("disclosed");

      // 5. update for screen readers
      navPortrait.setAttribute("aria-hidden", "true");
      button.setAttribute("aria-expanded", "false");
      content.setAttribute("aria-hidden", "false");
    }
  };

  panelSplitter.prototype._ensureValidString = function(rawValue, defaultValue)
  {
    // TODO is there a shared util we can use instead?
    if (rawValue == null)
      return defaultValue;
    return rawValue;
  };

  panelSplitter.prototype._handleResize = function(event)
  {
    var rootElement  = event.data.rootElement;
    var amxNode      = event.data.amxNode;
    var splitterPeer = event.data.peer;
    var inner        = rootElement.firstChild;
    if (inner == null)
    {
      // This instance no longer exists in the document so unregister the window resize handler:
      adf.mf.api.amx.removeBubbleEventListener(window, "resize", splitterPeer._handleResize, event.data);
      return;
    }
    var foundChildNodes =
      splitterPeer._getChildrenByClassNames(
        inner,
        [
          "amx-panelSplitter_navPortrait",
          "amx-panelSplitter_button",
          "amx-panelSplitter_screenPortrait",
          "amx-panelSplitter_navLandscape",
          "amx-panelSplitter_contentContainer"
        ]);
    var navPortrait    = foundChildNodes[0];
    var button         = foundChildNodes[1];
    var screenPortrait = foundChildNodes[2];
    var navLandscape   = foundChildNodes[3];
    var content        = foundChildNodes[4];
    var orientation    = splitterPeer._getOrientation();
    var position       = splitterPeer._getPosition(amxNode);
    var isRtl          = (document.documentElement.dir == "rtl");

    // Determine if we are going from portrait to landscape or landscape to portrait
    if (navPortrait && button && screenPortrait && navLandscape &&
        rootElement.getAttribute("data-orientation") == "portrait" && orientation == "landscape")
    {
      // -- from portrait to landscape --

      // First check to see if
      // - the drawer is disclosed, and
      // - something other than the body or disclosure button is active
      // and if so, don't change to landscape because there might be a keyboard
      // shown which means the drawer will close and the user wouldn't be able
      // to change the value.
      if (document.activeElement != document.body &&
          document.activeElement != button &&
          button.classList.contains("disclosed"))
      {
        // Something other than the body or disclosure button is active and
        // the drawer is open so don't switch views.
        return;
      }

      // 1. set the start side of amx-panelSplitter_navPortrait to be -position.portrait
      navPortrait.classList.add("no-animate"); // TODO this doesn't work; might need to do animation chaining now
      if (isRtl)
        navPortrait.style.right = "-" + position.portrait;
      else
        navPortrait.style.left = "-" + position.portrait;

      // 2. set the opacity of amx-panelSplitter_navPortrait to none
      navPortrait.style.opacity = "0";
      navPortrait.style.display = "none"; // TODO might need to do animation chaining now
      navPortrait.style.zIndex = "0";
      navPortrait.classList.remove("no-animate");

      // 3. set the start side of the button to be zero
      button.classList.add("no-animate"); // TODO this doesn't work; might need to do animation chaining now
      if (isRtl)
        button.style.right = "0px";
      else
        button.style.left = "0px";

      // 4. set the opacity of the button to none
      button.style.display = "none"; // TODO might need to do animation chaining now
      button.classList.remove("no-animate");

      // 5. remove the disclosed class from the button
      button.classList.remove("disclosed");

      // 6. set the display of the screenPortrait to none
      screenPortrait.style.display = "none";

      // 7. reparent the amx-panelSplitter_navPortrait children to amx-panelSplitter_navLandscape
      while (navPortrait.childNodes.length > 0)
        navLandscape.appendChild(navPortrait.childNodes[0]);

      // 8. set the opacity of amx-panelSplitter_navLandscape to full
      navLandscape.style.opacity = "1";
      navLandscape.style.display = "block"; // TODO might need to do animation chaining now

      // 9. set the start side of amx-panelSplitter_contentContainer to be position.landscape
      if (isRtl)
        content.style.right = position.landscape;
      else
        content.style.left = position.landscape;

      // 10. remember our new orientation in a data attribute
      rootElement.setAttribute("data-orientation", "landscape");

      // 11. update the content area's orientation style classes
      content.classList.remove("amx-portrait");
      content.classList.add("amx-landscape");

      // 12. update for screen readers
      content.setAttribute("aria-hidden", "false");
    }
    else if (rootElement.getAttribute("data-orientation") == "landscape" && orientation == "portrait")
    {
      // -- from landscape to portrait --

      // 1. set the start side of amx-panelSplitter_navPortrait to be -position.portrait
      if (isRtl)
        navPortrait.style.right = "-" + position.portrait;
      else
        navPortrait.style.left = "-" + position.portrait;
      navPortrait.style.zIndex = "1002";

      // 2. set the start side of the button to be zero
      if (isRtl)
        button.style.right = "0px";
      else
        button.style.left = "0px";

      // 3. set the opacity of amx-panelSplitter_navLandscape to none
      navLandscape.style.opacity = "0";
      navLandscape.style.display = "none"; // TODO might need to do animation chaining now

      // 4. set the opacity of the button to full
      button.style.display = "block"; // TODO might need to do animation chaining now

      // 5. set the start side of amx-panelSplitter_contentContainer to be portrait-start in the CSS file
      if (isRtl)
        content.style.right = ""; // use blank to purge the custom overide if applicable
      else
        content.style.left = ""; // use blank to purge the custom overide if applicable

      // 6. reparent the amx-panelSplitter_navLandscape children to amx-panelSplitter_navPortrait
      while (navLandscape.childNodes.length > 0)
        navPortrait.appendChild(navLandscape.childNodes[0]);

      // 7. remember our new orientation in a data attribute
      rootElement.setAttribute("data-orientation", "portrait");

      // 8. update the content area's orientation style classes
      content.classList.remove("amx-landscape");
      content.classList.add("amx-portrait");

      // 9. update for screen readers
      navPortrait.setAttribute("aria-hidden", "true");
      button.setAttribute("aria-expanded", "false");
      content.setAttribute("aria-hidden", "false");
    }
  };

})();
