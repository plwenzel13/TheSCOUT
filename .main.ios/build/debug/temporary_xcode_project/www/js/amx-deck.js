/* Copyright (c) 2013, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* -------------------- amx-deck.js --------------------- */
/* ------------------------------------------------------ */

(function()
{
  var deck = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "deck");

  deck.prototype.createChildrenNodes = function(amxNode)
  {
    var tag = amxNode.getTag();

    if (amxNode.getAttribute("displayedChild") === undefined)
    {
      // See if this is EL bound and the value is currently not loaded
      if (tag.isAttributeElBound("displayedChild"))
      {
        // In this case we cannot create the children yet
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["INITIAL"]);
        return true;
      }
    }

    var displayedTagAndIndex = this._getDisplayedTagAndIndex(amxNode);
    var displayedTag = null;
    var childIndex = -1;
    if (displayedTagAndIndex != null)
    {
      displayedTag = displayedTagAndIndex[0];
      childIndex = displayedTagAndIndex[1];
    }
    var resolvedDisplayedChildId = displayedTag == null ? null : displayedTag.getAttribute("id");
    amxNode.setVolatileState(
      {
        "resolvedDisplayedChildId": resolvedDisplayedChildId,
        "childIndex": childIndex
      });

    // Create the child for the selected item
    if (displayedTag != null)
      amxNode.addChild(displayedTag.buildAmxNode(amxNode, null));

    return true;
  };

  deck.prototype.attributeChangeResult = function(
    amxNode,
    attributeName,
    attributeChanges)
  {
    switch (attributeName)
    {
      case "displayedChild":
        return this._updateDisplayedChild(amxNode) ?
          adf.mf.api.amx.AmxNodeChangeResult["REFRESH"] :
          adf.mf.api.amx.AmxNodeChangeResult["NONE"];

      default:
        return deck.superclass.attributeChangeResult.call(this,
          amxNode, attributeName, attributeChanges);
    }
  };

  deck.prototype.render = function(amxNode)
  {
    // Attributes:
    //   displayedChild
    //   landmark
    //   shortDesc

    // DOM Structure:c
    //   root div amx-deck (and amx-stretched if dimensionsFromParent--needed for the animations to work)
    //     div amx-deck_items data-index
    //       child component current/new

    try
    {
      // Create the top level div that will house all the components used in the deck.
      var rootElement = document.createElement("div");

      // TODO - We need an improved mechanism for detecting dimensionsFromParent...
      // It is too early to look at a computed style because the element hasn't been added to the DOM.
      // All we can do now is examine the inlineStyle.
      var dimensionsFromParent = false;
      var inlineStyle = amxNode.getAttribute("inlineStyle");
      if (inlineStyle != null)
      {
        if (inlineStyle.indexOf("height:") != -1)
          dimensionsFromParent = true;
        else if (inlineStyle.indexOf("top:") != -1 && inlineStyle.indexOf("bottom:") != -1)
          dimensionsFromParent = true;
      }
      if (dimensionsFromParent)
      {
        rootElement.className = "amx-deck amx-stretched";
      }

      rootElement.setAttribute("title", this._ensureValidString(amxNode.getAttribute("shortDesc"), ""));
      var landmark = amxNode.getAttribute("landmark");
      if (landmark != null && "none" != landmark)
      {
        rootElement.setAttribute("role", landmark);
      }

      var newDisplayedChildIndex = amxNode.getVolatileState()["childIndex"];
      var items = document.createElement("div");
      items.setAttribute("data-index", ""+newDisplayedChildIndex);
      items.className = "amx-deck_items";

      rootElement.appendChild(items);

      // Render the items (should just be 1).
      var children = amxNode.getRenderedChildren();
      var selectedNode = children.length > 0 ? children[0] : null;
      if (selectedNode != null)
      {
        var newChildElement = selectedNode.render();
        if (newChildElement != null)
        {
          items.appendChild(newChildElement);
        }
      }

      return rootElement;
    }
    catch (problem)
    {
      console.error(problem);
    }
  };

  deck.prototype.postDisplay = function(rootElement, amxNode)
  {
    // TODO - We need an improved mechanism for detecting dimensionsFromParent...
    if (rootElement.classList.contains("amx-stretched"))
    {
      // The inlineStyle didn't have "stretching" styles in it so now we must look at the computed style
      // to determine whether we are stretched.
      // We can't look at "height" because being "auto" in a computedStyle doesn't mean an explicit
      // height was given.
      var computedStyle = adf.mf.internal.amx.getComputedStyle(rootElement);
      if (computedStyle != null && computedStyle.top != "auto" && computedStyle.bottom != "auto")
      {
        rootElement.classList.add("amx-stretched");
      }
    }
  };

  deck.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    try
    {
      var rootElement = document.getElementById(amxNode.getId());
      var dimensionsFromParent = rootElement.classList.contains("amx-stretched");
      var items = rootElement.firstChild;

      //if (rootElement.classList.contains("changingDisplayedChild"))
      //{
        // Changing the selected item too quickly--another one is in progress.
        // TODO need to handle this scenario (if can't clean up the DOM then cover up the navigators when busy)
      //}
      rootElement.classList.add("changingDisplayedChild");

      var childElements = items.childNodes;
      var childCount = childElements.length;
      var currentChild = null;
      if (childCount > 0)
        currentChild = childElements[0];

      // The old child will be removed by the createChildrenNodes function
      // which is called before the refresh function, but the new
      // selected node needs to be rendered still.
      var childAmxNodes = amxNode.getRenderedChildren();
      var oldDisplayedChildIndex = parseInt(items.getAttribute("data-index"), 10);
      var newDisplayedChildIndex = amxNode.getVolatileState()["childIndex"];

      // Render the newly-selected child
      var newChild = null;
      if (childAmxNodes.length > 0)
      {
        var selectedNode = childAmxNodes[0];
        newChild = selectedNode.render();
        if (newChild != null)
        {
          var resolvedDisplayedChildId = newChild == null ? null : newChild.getAttribute("id");
          amxNode.setVolatileState({ "resolvedDisplayedChildId": resolvedDisplayedChildId });
          items.setAttribute("data-index", ""+newDisplayedChildIndex);
          items.appendChild(newChild);
          // --MRE: This is a temporary fix for resizing certain components like DVT. The issue is when the component
          // is created it does not know the size and defaults to a much smaller size. This will now call the
          // resize event if there is only a single child root element.
          if (newChild != null)
          {
            adf.mf.api.amx.triggerBubbleEventListener(newChild, "resize");
          }
        }
      }
      else
      {
        items.setAttribute("data-index", "-1");
      }

      var transitionTagInstances = amxNode.__getTagInstances(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "transition");
      var backNavigateTransition = null;
      var forwardNavigateTransition = null;
      for (var i=0, transitionCount=transitionTagInstances.length; i<transitionCount; ++i)
      {
        var transitionTagInstance = transitionTagInstances[i];
        var triggerType = transitionTagInstance.getAttribute("triggerType");
        if (triggerType == "backNavigate")
        {
          backNavigateTransition = transitionTagInstance.getAttribute("transition");
        }
        else if (triggerType == "forwardNavigate")
        {
          forwardNavigateTransition = transitionTagInstance.getAttribute("transition");
        }
      }

      // Determine which transition should be used:
      transitionType = forwardNavigateTransition;
      if (newDisplayedChildIndex < oldDisplayedChildIndex)
        transitionType = backNavigateTransition;

      if (transitionType == "none")
        transitionType = null;

      if (transitionType != null)
      {
        var deckTransitionCancelFunctionKey = "_deckTransitionCancelFunction" + rootElement.id;
        if (this[deckTransitionCancelFunctionKey] != null)
        {
          this[deckTransitionCancelFunctionKey]();
        }

        // Prevent AMX node hierarchy and DOM node changes during transition animation
        adf.mf.internal.amx.pauseUIChanges();

        // Ensure prerequisites are met:
        var computedStyle, displayValue;
        if (currentChild != null)
        {
          computedStyle = adf.mf.internal.amx.getComputedStyle(currentChild);
          displayValue = computedStyle ? computedStyle.display : null;
          // bug 18692037 : avoid overwriting of the -webkit-box value mostly used for
          // the filmstrip
          if (displayValue !== "-webkit-box" && displayValue !== "flex" && displayValue !== "-webkit-flex")
          {
            currentChild.style.display = "block";
          }
        }
        if (newChild != null)
        {
          computedStyle = adf.mf.internal.amx.getComputedStyle(newChild);
          displayValue = computedStyle ? computedStyle.display : null;
          // bug 18692037 : avoid overwriting of the -webkit-box value mostly used for
          // the filmstrip
          if (displayValue !== "-webkit-box" && displayValue !== "flex" && displayValue !== "-webkit-flex")
          {
            newChild.style.display = "block";
          }
        }

        var properties = {};
        properties["parentFlipAllowed"] = true; // no other visible siblings plus parent and grandparent have equal dimensions
        properties["dimensionsFromParent"] = dimensionsFromParent;
        properties["finishedFunction"] = adf.shared.impl.animationUtils.getProxyFunction(this, this._animationFinished);
        properties["callbackParams"] = [ newChild, items, rootElement ];
        properties["animationEnabled"] = true;
        properties["isRtl"] = document.documentElement.dir == "rtl";
        properties["fineLogger"] = function(message)
        {
          adf.mf.log.AMX.logp(adf.mf.log.level.FINEST,
            "adf.mf.internal.amx.deck", "refresh", message);
        };

        this[deckTransitionCancelFunctionKey] =
          adf.shared.impl.animationUtils.transition( // WARNING this is impl (not a public API) and will change without notice
            transitionType,
            currentChild,
            newChild,
            properties);
      }
      else // no animation
      {
        this._removeAllButThisChild(newChild, items);
        rootElement.classList.remove("changingDisplayedChild");
      }

      deck.superclass.refresh.call(this, amxNode, attributeChanges, descendentChanges);
    }
    catch (problem)
    {
      console.error(problem);
    }
  };

  deck.prototype._updateDisplayedChild = function(amxNode)
  {
    var oldDisplayedChild = amxNode.getVolatileState()["resolvedDisplayedChildId"];
    var newDisplayedChild = amxNode.getAttribute("displayedChild");
    if (newDisplayedChild != oldDisplayedChild)
    {
      var children = amxNode.getChildren();
      if (children.length > 0)
      {
        var oldSelectedNode = children[0];

        // Remove the old child
        amxNode.removeChild(oldSelectedNode);
      }

      // Create the new item
      var displayedTagAndIndex = this._getDisplayedTagAndIndex(amxNode);
      var displayedTag = null;
      var childIndex = 0;
      if (displayedTagAndIndex != null)
      {
        displayedTag = displayedTagAndIndex[0];
        childIndex = displayedTagAndIndex[1];
      }

      if (displayedTag == null)
      {
        // Update the selected item stored in the volatile state
        amxNode.setVolatileState(
          {
            "resolvedDisplayedChildId": null,
            "childIndex": -1
          });
      }
      else
      {
        // Create the child for the selected item
        amxNode.addChild(displayedTag.buildAmxNode(amxNode, null));

        // Update the selected item stored in the volatile state
        amxNode.setVolatileState(
          {
            "resolvedDisplayedChildId": displayedTag.getAttribute("id"),
            "childIndex": childIndex
          });
      }

      return true;
    }

    return false;
  };

  deck.prototype._animationFinished = function(callbackParams)
  {
    var newChild = callbackParams[0];
    var items = callbackParams[1];
    var rootElement = callbackParams[2];
    this._removeAllButThisChild(newChild, items);
    rootElement.classList.remove("changingDisplayedChild");
    this["_deckTransitionCancelFunction" + rootElement.id] = null;
    adf.mf.internal.amx.resumeUIChanges();
  };

  deck.prototype._getDisplayedTagAndIndex = function(amxNode)
  {
    var displayedChild = amxNode.getAttribute("displayedChild");
    if (displayedChild == null)
      return null; // Nothing to look for

    var tag = amxNode.getTag();
    var childrenTags = tag.getChildren();

    // Loop through all the children UI tags and look for the selected
    // tag. If there is no selected item, DO NOT use the first child tag.
    for (var i=0, size=childrenTags.length; i<size; ++i)
    {
      var childTag = childrenTags[i];

      // The selected item is the ID (not scoped ID) of the child tag. If this
      // matches use this tag.
      if (childTag.getAttribute("id") == displayedChild)
      {
        return [ childTag, i ]; // Found the match
      }
    }

    return null; // No match found
  };

  deck.prototype._removeAllButThisChild = function(childToKeep, items)
  {
    var childNodes = items.childNodes;
    var childNodeCount = childNodes.length;
    for (var i=childNodeCount; i >= 0; --i)
    {
      var child = childNodes[i];
      if (child != childToKeep)
        adf.mf.api.amx.removeDomNode(child);
    }
  };

  deck.prototype._ensureValidString = function(rawValue, defaultValue)
  {
    // TODO is there a shared util we can use instead?
    if (rawValue == null)
      return defaultValue;
    return rawValue;
  };

})();
