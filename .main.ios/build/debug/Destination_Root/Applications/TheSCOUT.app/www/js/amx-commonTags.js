/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------------- amx-commonTags.js ---------------- */
/* ------------------------------------------------------ */

(function()
{
  var view = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "view");

  view.prototype.render = function(amxNode, id)
  {
    var domNode = document.createElement("div");
    var descendants = amxNode.renderDescendants();
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      domNode.appendChild(descendants[i]);
    }

    // An amx:loadingIndicatorBehavior has these attribute: failSafeDuration, failSafeClientHandler
    var failSafeDuration = 10000;
    var failSafeClientHandler = null;
    var loadingIndicatorBehaviorTagInstances =
      amxNode.__getTagInstances(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "loadingIndicatorBehavior");
    if (loadingIndicatorBehaviorTagInstances != null)
    {
      var libtisLength = loadingIndicatorBehaviorTagInstances.length;
      if (libtisLength > 0)
      {
        var lastLibti = loadingIndicatorBehaviorTagInstances[libtisLength-1];
        var fsd = parseInt(lastLibti.getAttribute("failSafeDuration"), 10);
        if (!isNaN(fsd))
          failSafeDuration = fsd;
        var fsch = lastLibti.getAttribute("failSafeClientHandler");
        if (fsch != null && fsch != "")
        {
          try
          {
            var fschFunction = new Function("return " + fsch + "()");
            failSafeClientHandler = fschFunction;
          }
          catch (problem)
          {
            // Catch invalid values for failSafeClientHandler
            adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.SEVERE,
              "amx.view.render", "MSG_INVALID_TAG_ATTRIBUTE_VALUE",
              "loadingIndicatorBehavior", "failSafeClientHandler", problem, fsch);
          }
        }
      }
    }

    // Update the values used in adf.mf.api.amx.showLoadingIndicator():
    adf.mf.internal.amx._failSafeDuration = failSafeDuration;
    adf.mf.internal.amx._failSafeClientHandler = failSafeClientHandler;

    // An amx:navigationDragBehavior has these attributes: direction, disabled, action
    var navigationDragBehaviorTagInstances =
      amxNode.__getTagInstances(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "navigationDragBehavior");
    var navigationDragBehaviors = [];
    for (var i=0, dragBehaviorCount=navigationDragBehaviorTagInstances.length; i<dragBehaviorCount; ++i)
    {
      var dragBehavior = navigationDragBehaviorTagInstances[i];
      navigationDragBehaviors.push(dragBehavior);
    }

    if (navigationDragBehaviors.length > 0)
    {
      adf.mf.api.amx.addDragListener(domNode,
        {
          "start": view._handleDragStart,
          "drag": view._handleDrag,
          "end": view._handleDragEnd,
          "threshold": 5
        },
        {
          "navigationDragBehaviors" : navigationDragBehaviors,
          "viewNodeId": id
        });
    }

    // always clear out and reinitialize the systemActionBehaviors map
    adf.mf.internal.api.initializePageLevelSystemActionOverrides();

    // A amx:systemActionBehavior has these attributes: type, actionListener, action
    var systemActionBehaviorInstances =
      amxNode.__getTagInstances(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "systemActionBehavior");
    for (var i=0, systemActionBehaviorCount=systemActionBehaviorInstances.length; i<systemActionBehaviorCount; ++i)
    {
      var systemActionBehavior = systemActionBehaviorInstances[i];
      var type = systemActionBehavior.getAttribute("type");
      if (type == "back")
      {
        adf.mf.internal.api.registerSystemActionBehavior(type, view._systemActionBack, systemActionBehavior);
      }
    }

    return domNode;
  };

  view.prototype.__experimentalCLAssociation = function(
    amxNode,
    amxNodeId,
    eventType,
    rootElement)
  {
    // DO NOT USE; this method is experimental and will be removed without notice.
    // This is a temporary experiment for TypeHandler-speicfic clientListener implementation.
    // The idea is this can be overridden to connect a listener to a DOM element other than the
    // root (the default element bound to the event).
    var useDocument = false;
    switch (eventType)
    {
      case "showpagecomplete":
      case "mafviewvisible":
      case "mafviewhidden":
      case "amxnavigatestart":
      case "amxnavigateend":
        useDocument = true; // these are document events
        break;
    }
    view.superclass.__experimentalCLAssociation.call(
      this,
      amxNode,
      amxNodeId,
      eventType,
      rootElement,
      useDocument);
  };

  view.prototype.findPopup = function(
    amxNode,
    popupId)
  {
    var children = amxNode.getChildren();

    for (var c = 0, numChildren = children.length; c < numChildren; ++c)
    {
      var child = children[c];

      if (child.getTag().getAttribute("id") == popupId)
      {
        return child;
      }
    }

    return null;
  };

  view._systemActionBack = function(systemActionBehavior)
  {
    var wasHandled = false;
    if (adf.mf.api.amx.acceptEvent())
    {
      // "action" can be a literal value or a method expression
      var action = systemActionBehavior.getAttribute("action", false);
      if (action !== undefined)
      {
        // if action was specified at all, we consider the action handled
        wasHandled = true;
      }

      var actionFunc = function()
      {
        if (action != null)
        {
          try
          {
            adf.mf.api.amx.doNavigation(action);
          }
          catch (problem)
          {
            adf.mf.api.amx.addMessage("severe", problem, null, null);
          }
        }
      };

      // invoke the actionListener
      var actionListener = systemActionBehavior.getAttribute("actionListener", false);
      if (actionListener != null)
      {
        var amxEvent      = new amx.ActionEvent();
        var attParams     = [];
        var attParamTypes = [];
        attParams.push(amxEvent);
        attParamTypes.push(amxEvent[".type"]);

        // both the success and failure callbacks will invoke actionFunc
        adf.mf.api.amx.invokeEl(actionListener, attParams, null, attParamTypes, actionFunc, actionFunc);
      }
      else
      {
        // no actionListener, so invoke actionFunc directly
        actionFunc();
      }
    }
    return wasHandled;
  };

  view._handleDragStart = function(event, dragExtra)
  {
    if (adf.mf.api.amx.acceptEvent())
    {
      var navigationDragBehaviors = event.data["navigationDragBehaviors"];
      var hasBackDragBehavior = false;
      var hasForwardDragBehavior = false;
      for (var i=0, count=navigationDragBehaviors.length; i<count; ++i)
      {
        var dragBehavior = navigationDragBehaviors[i];
        var direction = dragBehavior.getAttribute("direction");

        if (!hasBackDragBehavior && direction == "back" && !adf.mf.api.amx.isValueTrue(dragBehavior.getAttribute("disabled")))
        {
          hasBackDragBehavior = true;
          event.data["backDragBehavior"] = dragBehavior;
        }
        else if (!hasForwardDragBehavior && direction == "forward" && !adf.mf.api.amx.isValueTrue(dragBehavior.getAttribute("disabled")))
        {
          hasForwardDragBehavior = true;
          event.data["forwardDragBehavior"] = dragBehavior;
        }

        if (hasBackDragBehavior && hasForwardDragBehavior)
          break;
      }

      // For this drag attempt, see if we are allowed to drag in either direction:
      event.data["hasBackDragBehavior"] = hasBackDragBehavior;
      event.data["hasForwardDragBehavior"] = hasForwardDragBehavior;
    }
  };

  view._handleDrag = function(event, dragExtra)
  {
    if (adf.mf.api.amx.acceptEvent())
    {
      // Only consider it a drag if the angle of the drag is within 30 degrees of due horizontal
      var angle = Math.abs(dragExtra.originalAngle);
      if (angle <= 30 || angle >= 150)
      {
        var element = this;
        if (dragExtra.requestDragLock(element, true, false))
        {
          event.preventDefault();
          event.stopPropagation();
          dragExtra.preventDefault = true;
          dragExtra.stopPropagation = true;

          // We don't rely on dragExtra.startPageX because of an issue with the auto-dismiss pane
          // on popups. By managing our own startPageX, we guarantee the correct drag start
          // coordinates.
          var startPageX = event.data["startPageX"];
          if (startPageX == null)
          {
            event.data["startPageX"] = dragExtra.pageX;
            return; // too soon to tell direction
          }

          var totalDelta = dragExtra.pageX - startPageX;
          var dragDirectionIsBack = event.data["dragDirectionIsBack"];
          var historyIndicator = event.data["historyIndicator"];
          var isRtl = (document.documentElement.dir == "rtl");

          if (dragDirectionIsBack == null)
          {
            if (totalDelta == 0)
              return; // we can't tell which direction yet

            // Initialize the history indicator if applicable:
            historyIndicator = document.getElementById("historyIndicator");
            if (historyIndicator != null)
            {
              // There was some old indicator that was left around so clean it up:
              adf.mf.api.amx.removeDomNode(historyIndicator);
            }

            if (isRtl)
              dragDirectionIsBack = (totalDelta < 0);
            else
              dragDirectionIsBack = (totalDelta > 0);

            if (dragDirectionIsBack && !event.data["hasBackDragBehavior"])
              return; // not applicable
            else if (!dragDirectionIsBack && !event.data["hasForwardDragBehavior"])
              return; // not applicable
            else
              event.data["dragDirectionIsBack"] = dragDirectionIsBack; // it is applicable

            // Create the new indicator for this series of start-drag-end calls:
            historyIndicator = document.createElement("div");
            historyIndicator.id = "historyIndicator";
            historyIndicator.className = (dragDirectionIsBack ? "amx-view-historyIndicatorBack" : "amx-view-historyIndicatorForward");
            document.getElementById("bodyPageViews").appendChild(historyIndicator);
            event.data["historyIndicator"] = historyIndicator;
          }
          else
          {
            // Move the history indicator we previously created
            var indicatorWidth = event.data["indicatorWidth"];
            if (indicatorWidth == null)
            {
              // We want to minimize the number of times we compute an offset for performance reasons
              indicatorWidth = historyIndicator.offsetWidth;
              event.data["indicatorWidth"] = indicatorWidth;
            }

            var invertedDirection = !dragDirectionIsBack;
            if (isRtl)
              invertedDirection = dragDirectionIsBack;
            var totalDistanceInRevealDirection = 0;
            if (invertedDirection)
            {
              totalDistanceInRevealDirection = -totalDelta;
            }
            else
            {
              totalDistanceInRevealDirection = totalDelta;
            }

            // A number from 0 to 1:
            var percentageMoved =
              Math.max(0, Math.min(indicatorWidth, totalDistanceInRevealDirection) / indicatorWidth);

            // At 0% use 0.3 opacity, at 100% use 1.0 opacity:
            var opacity = 0.3 + 0.7 * percentageMoved;
            historyIndicator.style.opacity = opacity;

            // At 0% use 0, at 100% use indicatorWidth:
            var translateX = indicatorWidth * percentageMoved;
            if (invertedDirection)
              historyIndicator.style.right = (translateX - indicatorWidth) + "px";
            else
              historyIndicator.style.left = (translateX - indicatorWidth) + "px";

            event.data["limitReached"] = (percentageMoved == 1);
          }
        }
      }
    }
    else // event not accepted, e.g. due to transitioning or DT mode
    {
      event.data["limitReached"] = false;
      view._concludeHistoryIndicator(event, dragExtra);
    }
  };

  view._handleDragEnd = function(event, dragExtra)
  {
    view._concludeHistoryIndicator(event, dragExtra);
  };

  view._concludeHistoryIndicator = function(event, dragExtra)
  {
    var limitWasReached = true === event.data["limitReached"];
    var dragDirectionIsBack = true === event.data["dragDirectionIsBack"];

    var historyIndicator = event.data["historyIndicator"];
    delete event.data["hasBackDragBehavior"];
    delete event.data["hasForwardDragBehavior"];
    delete event.data["startPageX"];
    delete event.data["historyIndicator"];
    delete event.data["dragDirectionIsBack"];
    delete event.data["limitReached"];
    event.preventDefault();
    event.stopPropagation();
    dragExtra.preventDefault = true;
    dragExtra.stopPropagation = true;

    if (historyIndicator != null)
    {
      adf.shared.impl.animationUtils._setTransition(historyIndicator, "all 200ms linear");

      if (limitWasReached)
      {
        var viewNodeId = event.data["viewNodeId"];
        var viewNode = document.getElementById(viewNodeId);
        if (viewNode)
        {
          var dragBehaviorTag = null;
          if (dragDirectionIsBack)
            dragBehaviorTag = event.data["backDragBehavior"];
          else
            dragBehaviorTag = event.data["forwardDragBehavior"];

          if (dragBehaviorTag)
          {
            adf.mf.api.amx.validate(viewNode, function()
              {
                if (adf.mf.api.amx.acceptEvent())
                {
                  // "action" can be a literal value or a method expression
                  var action = dragBehaviorTag.getAttribute("action", false);
                  if (action != null)
                  {
                    try
                    {
                      adf.mf.api.amx.doNavigation(action);
                    }
                    catch (problem)
                    {
                      adf.mf.api.amx.addMessage("severe", problem, null, null);
                    }
                  }
                }
            });
          }
        }
      }

      // Clean up the indicator in an elegant fashion (delayed to allow the screen to paint)
      setTimeout(function()
        {
          if (historyIndicator != null)
          {
            adf.mf.api.amx.addBubbleEventListener(
              historyIndicator,
              adf.mf.internal.amx.agent.getTransitionEndEventName(),
              function()
              {
                adf.mf.api.amx.removeDomNode(this);
              });
            if (!limitWasReached)
            {
              // Slide back away
              var backIndicator = historyIndicator.classList.contains(
                "amx-view-historyIndicatorBack");
              if (document.documentElement.dir == "rtl")
              {
                if (backIndicator)
                  historyIndicator.style.right = - (historyIndicator.offsetWidth) + "px";
                else
                  historyIndicator.style.left = - (historyIndicator.offsetWidth) + "px";
              }
              else // ltr
              {
                if (backIndicator)
                  historyIndicator.style.left = - (historyIndicator.offsetWidth) + "px";
                else
                  historyIndicator.style.right = - (historyIndicator.offsetWidth) + "px";
              }
            }
            historyIndicator.style.opacity = 0;
          }
        }, 1);
    }
  };

  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "spacer").prototype.render = function(amxNode)
  {
    var width = amx.getTextValue(amxNode.getAttribute("width"));
    var height = amx.getTextValue(amxNode.getAttribute("height"));
    var hidden = !amx.isNodeRendered(amxNode);

    if (hidden || width == null || width.length <= 0)
    {
      if (hidden || height == null || height.length < 0)
      {
        // Both width and height are null or zero, just render an empty span.
        return document.createElement("span");
      }
      else // it has a height but not a width
      {
        if (height.length != 0)
        {
          // our default unit is px
          var domNode = document.createElement("div");
          domNode.style.marginTop = height + "px";
          return domNode;
        }
        else
        {
          return document.createElement("div");
        }
      }
    }
    else // it at least has a width (it might have a height)
    {
      if (height == null || height.length <= 0)
      {
        height = 0;
      }

      var domNode = document.createElement("div");
      var domNodeStyle = domNode.style;
      domNodeStyle.display = "inline-block";
      domNodeStyle.marginTop = height + "px";
      domNodeStyle.marginRight = width + "px";
      return domNode;
    }
  };

  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "verbatim").prototype.render = function(amxNode)
  {
    var domNode = document.createElement("div");
    var content = amxNode.getTag().getTextContent();
    adf.mf.api.amx.applyInnerHtml(domNode, content, true);
    return domNode;
  };

  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "goLink").prototype.render = function(amxNode)
  {
    var domNode;

    if(adf.mf.api.amx.isValueTrue(amxNode.getAttribute("disabled")))
    {
      //in accordance with HTML 4.01 disabled elements cannot receive focus, are skipped in tabbing navigation and cannot be successful
      //disabled attribute is not supported by A tag -> change to span (read-only, non-focusable, not successful by definition)
      domNode = document.createElement("span");
      domNode.setAttribute("aria-disabled", "true");

      var text = amxNode.getAttribute("text");
      if (text != null)
      {
        var label = document.createElement("label");
        label.appendChild(document.createTextNode(text));
        // VoiceOver will not apply "dimmed" to a label inside of an anchor
        // so we will mark the label as presentation/hidden and define the
        // text as the aria-label of the anchor element instead.
        label.setAttribute("role", "presentation");
        label.setAttribute("aria-hidden", "true");
        domNode.setAttribute("aria-label", text);
        domNode.appendChild(label);
      }
    }
    else
    {
      domNode = document.createElement("a");
      domNode.setAttribute("href", amx.getTextValue(amxNode.getAttribute("url")));
      domNode.appendChild(document.createTextNode(amx.getTextValue(amxNode.getAttribute("text"))));

      // Adding event listener for touchstart to call stop propogation because
      // otherwise goLink inside listItem would trigger listItem's action.
      var mousedown = "mousedown";
      if (amx.hasTouch())
      {
        mousedown = "touchstart";
      }
      adf.mf.api.amx.addBubbleEventListener(domNode, mousedown, function(e)
      {
        e.stopPropagation(); // needed for nesting in a listItem
      });
      adf.mf.api.amx.addBubbleEventListener(domNode, "click", function(e)
      {
        e.stopPropagation(); // needed for nesting in a commandLink
      });
    }

    // Adding WAI-ARIA Attribute to the markup for the role attribute
    domNode.setAttribute("role", "link");
    var shortDesc = amxNode.getAttribute("shortDesc");
    if (shortDesc != null)
    {
      domNode.setAttribute("title", shortDesc);
    }

    //render child elements if there are any
    var descendants = amxNode.renderDescendants();
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      domNode.appendChild(descendants[i]);
    }
    return domNode;
  };

  var outputText = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "outputText");

  outputText.prototype.attributeChangeResult = function(
    amxNode,
    attributeName,
    attributeChanges)
  {
    switch (attributeName)
    {
      case "value":
        return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];

      default:
        return outputText.superclass.attributeChangeResult.call(this,
          amxNode, attributeName, attributeChanges);
    }
  };

  outputText.prototype.render = function(amxNode)
  {
    var rootElement = document.createElement("span");

    // Mark this with a role of heading if it has a styleClass that makes it a heading:
    var styleClass = amxNode.getAttribute("styleClass");
    if (styleClass != null && /\bamx-text-sectiontitle\b/.test(styleClass))
    {
      rootElement.setAttribute("role", "heading");
    }

    var displayValue = this._getDisplayValue(amxNode, rootElement);
    rootElement.appendChild(document.createTextNode(displayValue));
    return rootElement;
  };

  outputText.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    if (attributeChanges.hasChanged("value"))
    {
      var id = amxNode.getId();
      var rootElement = document.getElementById(id);
      var displayValue = this._getDisplayValue(amxNode, rootElement);
      rootElement.textContent = displayValue;
    }

    outputText.superclass.refresh.call(this, amxNode, attributeChanges, descendentChanges);
  };

  outputText.prototype._getDisplayValue = function(amxNode, rootElement)
  {
    var displayValue = amx.getTextValue(amxNode.getAttribute("value"));
    var truncateAt = parseInt(amxNode.getAttribute("truncateAt"));
    if (!isNaN(truncateAt) && truncateAt > 0 && typeof amxNode.getAttribute("value") != "undefined")
    {
      // from the tagdoc:
      // the length at which the text should automatically begin truncating.
      // When set to zero (the default), the string will never truncate. Values
      // from one to fifteen will display the first 12 characters followed by an
      // ellipsis (...). The outputText component will not truncate strings shorter
      // than fifteen characters. For example, for the value of 1234567890123456,
      // setting truncateAt to 0 or 16 will not truncate. Setting truncateAt to any
      // value between 1-15 will truncate to 123456789012...
      if (truncateAt < 15)
      {
        truncateAt = 15;
      }

      rootElement.setAttribute("amx-data-value", displayValue);
      if (truncateAt < displayValue.length)
      {
        displayValue = displayValue.substring(0,truncateAt - 3)+"...";
      }
      rootElement.classList.add("amx-outputText-truncateAt");
    }
    return displayValue;
  };

  var outputHtml = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "outputHtml");

  outputHtml.prototype.render = function(amxNode, compId)
  {
    var domNode = document.createElement("div");
    // Get the security attribte. If it is not defined then we will assume that the security is set to high. There are
    // currently two values this can be none, high (default).
    var security = amxNode.getAttribute("security");
    if (security == "none")
    {
      adf.mf.api.amx.applyInnerHtml(domNode, amx.getTextValue(amxNode.getAttribute("value")), true);
    }
    else
    {
      // Any other value of security will force this to be set to high.
      function idX(id) { return compId + "_" + id;}
      var inputHTML = amx.getTextValue(amxNode.getAttribute("value"));
      adf.mf.api.amx.applyInnerHtml(domNode, html_sanitize(inputHTML, null, idX), true);
    }
    return domNode;
  };

  var inputText = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "inputText");

  inputText.prototype.getInputValueAttribute = function()
  {
    return "value";
  };

  inputText.prototype.attributeChangeResult = function(
    amxNode,
    attributeName,
    attributeChanges)
  {
    // readOnly fields are special - the inputElement is a div, so don't do
    // any fancy refreshing here
    if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("readOnly")))
    {
      return adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];
    }

    // If the current inputElement is the one that has focus, and we are on Android, just
    // return false to make sure the node is recreated fully. Android generic has a
    // problem when refreshing inputText controls that have focus. We can revisit the
    // dirty behavior if it is deemed to be incorrect. For now, the safest thing to do
    // is maintain the current behavior.
    // This issue still remains in Android 4.4 where the WebView was switched to use Chromium.
    var isActiveElementAndValueChanging = false;
    if (attributeName == "maximumLength" || attributeName == "value")
    {
      if (amxNode._dirty == true)
      {
        isActiveElementAndValueChanging = true;
      }
      else
      {
        var inputElement = document.getElementById(amxNode.getId() + "__inputElement");
        if (inputElement != null && document.activeElement == inputElement &&
          adf.mf.internal.amx.agent["type"] == "Android" &&
          adf.mf.internal.amx.agent["version"] < 537.36) // less than 5.0.2
        {
          isActiveElementAndValueChanging = true;
        }
      }
    }

    switch (attributeName)
    {
      case "maximumLength":
        return isActiveElementAndValueChanging ?
          adf.mf.api.amx.AmxNodeChangeResult["RERENDER"] :
          adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];

      case "value":
        return isActiveElementAndValueChanging &&
          amxNode.getAttribute("value") != attributeChanges.getOldValue("value") ?
          adf.mf.api.amx.AmxNodeChangeResult["RERENDER"] :
          adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];

      case "label":
        return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];

      default:
        return inputText.superclass.attributeChangeResult.call(this,
          amxNode, attributeName, attributeChanges);
    }
  };

  inputText.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    var maxLengthChanged = attributeChanges.hasChanged("maximumLength");
    var valueChanged = attributeChanges.hasChanged("value");
    var labelChanged = attributeChanges.hasChanged("label");

    var id = amxNode.getId();
    var inputElement = document.getElementById(id + "__inputElement");

    // if maxLength changed, then we just update the value and it will do truncation (once it comes online)
    if (valueChanged || maxLengthChanged)
    {
      this._setValue(amxNode, inputElement);
      inputText._updateEmptyMarker(id);
    }

    var simple = adf.mf.api.amx.isValueTrue(amxNode.getAttribute("simple"));
    if (labelChanged && !simple)
    {
      this._setLabel(amxNode, inputElement);
    }

    inputText.superclass.refresh.call(this, amxNode, attributeChanges, descendentChanges);
  };

  inputText.prototype.render = function(amxNode, id)
  {
    var forId = id + "__inputElement";
    var field = amx.createField(amxNode, forId); // generate the fieldRoot/fieldLabel/fieldValue structure

    field.fieldLabel.setAttribute("id", amxNode.getId() + "__fieldLabel");
    var inputElement;
    amxNode._oldValue = null;
    amxNode._dirty = false;
    var wrapTagName = "div";
    var inputName = amxNode.getAttribute("name");

    // iOS supports "keyboardDismiss" values of "normal", "go", "search":
    var keyboardDismiss = amx.getTextValue(amxNode.getAttribute("keyboardDismiss"));
    if (keyboardDismiss == "go")
    {
      wrapTagName = "form";
    }
    else if (keyboardDismiss == "search")
    {
      wrapTagName = "form";
      inputName = "search";
    }

    var wrapElement = document.createElement(wrapTagName);
    wrapElement.className = "wrap";
    field.fieldValue.appendChild(wrapElement);

    var isRequired = (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("showRequired")) ||
                      adf.mf.api.amx.isValueTrue(amxNode.getAttribute("required")));
    var isReadOnly = adf.mf.api.amx.isValueTrue(amxNode.getAttribute("readOnly"));

    if (isReadOnly)
    {
      inputElement = document.createElement("div");
      inputElement.className = "readOnlyLabel";
      inputElement.setAttribute("aria-readonly", "true");
      inputElement.appendChild(document.createTextNode(amx.getTextValue(amxNode.getAttribute("value"))));
      wrapElement.appendChild(inputElement);
    }
    else
    {
      var rowsAttr = amxNode.getAttribute("rows");
      if (rowsAttr && parseInt(rowsAttr, 10) > 1)
      {
        inputElement = document.createElement("textarea");
        inputElement.setAttribute("rows", rowsAttr);
        inputElement.setAttribute("aria-multiline", "true");
      }
      else
      {
        if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("secret")))
        {
          inputElement = document.createElement("input");
          inputElement.setAttribute("type", "password");
        }
        else
        {
          var inputType = amxNode.getAttribute("inputType");
          switch (inputType)
          {
            case "number":
            case "email":
            case "url":
            case "tel":
              // input type is correct, just break
              break;
             /*
             case "search": // custom image added to emulate like native search type untill it is supported in iOS & Android
               inputType = amxNode.getAttribute("inputType");
                var searchIcon = document.createElement("img");
                searchIcon.className = "afmf-inputText-search"; // Fucntionality not implemted yet (07/11/2013)
                break;
             */
            default:
              inputType = "text";
              break;
          }
          inputElement = document.createElement("input");
          inputElement.setAttribute("type", inputType);
        }
      }

      inputElement.setAttribute("id", forId);
      inputElement.className = "amx-inputText-content";

      // Adding html5 placeholder attribute for the hint-text
      inputElement.setAttribute("placeholder", amx.getTextValue(amxNode.getAttribute("hintText")));

      // HTML5 "autocapitalize" values include "sentences", "none", "words", "characters":
      var autoCapitalize = amx.getTextValue(amxNode.getAttribute("autoCapitalize"));
      if (autoCapitalize != "" || autoCapitalize != "auto")
        inputElement.setAttribute("autocapitalize", autoCapitalize);

      // HTML5 "autocorrect" values include "on" and "off":
      var autoCorrect = amx.getTextValue(amxNode.getAttribute("autoCorrect"));
      if (autoCorrect != "" || autoCorrect != "auto")
        inputElement.setAttribute("autocorrect", autoCorrect);

      wrapElement.appendChild(inputElement);

      // Attaching Bubble Event Listeners to the InputText element
      this._registerTextInputHandlers(inputElement, amxNode);

      // adding event listener for touchstart/mousedown to call stop propogation because otherwise inputText inside listItem would
      // trigger listItem's action
      var mousedown = "mousedown";
      if (amx.hasTouch())
      {
        mousedown = "touchstart";
      }
      adf.mf.api.amx.addBubbleEventListener(inputElement, mousedown, function(e)
      {
        e.stopPropagation();
      });

      this._setValue(amxNode, inputElement);

      adf.mf.internal.amx.registerBlur(
        inputElement,
        function()
        {
          inputElement.parentNode.classList.remove("amx-wrap-active");
          // if we aren't dirty, then exit early
          if (amxNode._dirty == false)
          {
            return;
          }

          if (document.activeElement == inputElement)
            return; // Don't let dual blurs occur from "blur" and "touchstart" events (22373795)

          amxNode._dirty = false;
          var value = inputElement.value;
          var maxLength = amxNode.getAttribute("maximumLength");
          if (maxLength > 0)
          {
            // We should only get here if using the clipboard to edit the value.
            // In that use case, we might not have the proper length so we may
            // need to cut off the end here:
            value = value.substring(0, maxLength);
            inputElement.value = value;
          }

          // Reformat the user-input value, if the node has a converter.
          var converter = amxNode.getConverter();

          if (converter != null)
          {
             // Get (and validate) the user-input value
            var rawValue = converter.getAsObject(value);

            // The getAsObject method returns an empty string if an error occurs.  The only way to
            // determine if the call failed is to compare the return value against the value passed
            // in.
            if (rawValue === "" && value !== "")
            {
              // Do not process the value if there was a conversion error
              return;
            }

            value = converter.getAsString(rawValue);

            // If the attribute is not EL-bound, explicitly set the element value.  Otherwise, the
            // UI never shows the converted/reformatted value.
            var tag = amxNode.getTag();

            if (!tag.isAttributeElBound("value"))
            {
              // TODO: Use standard re-render code for non-EL-bound attributes (i.e. markNodeForUpdate)
              inputElement.value = value;
            }
          }

          // set the amxNode value so that it stays in sync
          amxNode.setAttributeResolvedValue("value", value);
          if (amxNode._oldValue !== value)
          {
            var vce = new amx.ValueChangeEvent(amxNode._oldValue, value);
            adf.mf.api.amx.processAmxEvent(amxNode,"valueChange","value",value, vce);
          }
          else
          {
            adf.mf.api.amx.processAmxEvent(amxNode,"valueChange","value",value);
          }
        });

      if (keyboardDismiss == "go")
        field.fieldRoot.className += " amx-inputText-go";
      else if (keyboardDismiss == "search")
      {
        field.fieldRoot.className += " amx-inputText-search";

        var clearElem = document.createElement("a");
        clearElem.id = id + "__clear";
        var clearLabel = adf.mf.resource.getInfoString("AMXInfoBundle","amx_inputText_LABEL_CLEAR_BUTTON");
        clearElem.setAttribute("aria-label", clearLabel);
        clearElem.className = "amx-inputText-clear";
        if (inputElement.value == "")
          field.fieldRoot.className += " amx-inputText-empty";
        else
          field.fieldRoot.className += " amx-inputText-nonEmpty";
        wrapElement.appendChild(clearElem);
        adf.mf.api.amx.addBubbleEventListener(clearElem, amx.hasTouch() ? "touchstart" : "mousedown", this._handleClear, amxNode);
      }

      var outerThis = this;
      // register this node in order to receive events when another control is tapped
      adf.mf.internal.amx.registerFocus(
        inputElement,
        function()
        {
          inputElement.parentNode.classList.add("amx-wrap-active");
          outerThis._setOldValue(amxNode, inputElement);
        });
    }

    if (wrapTagName == "form")
    {
      // we don't want any forms to submit; submission would cause our bootstrap to reload
      adf.mf.api.amx.addBubbleEventListener(
        wrapElement,
        "submit",
        function()
        {
          inputElement.blur();
          return false;
        });
    }

    if (inputName != null)
      inputElement.setAttribute("name", inputName);

    // Using ARIA role of textbox, other ARIA metadata specified throughout method.
    inputElement.setAttribute("role", "textbox");

    var simple = adf.mf.api.amx.isValueTrue(amxNode.getAttribute("simple"));
    if (simple)
    {
      var labelText = amx.getTextValue(amxNode.getAttribute("label"));
      inputElement.setAttribute("aria-label", labelText);
    }
    else
    {
      var labelId = id + "::" + "lbl";
      inputElement.setAttribute("aria-labelledby", labelId);
    }

    // Set wai-aria required attribute to true if required/showRequired is set to true
    if (isRequired)
      inputElement.setAttribute("aria-required", "true");

    if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("disabled")))
    {
      inputElement.setAttribute("disabled", true);
      inputElement.setAttribute("aria-disabled", "true");
    }

    // call applyRequiredMarker in amx-core.css to determine and implement required/showRequired style
    adf.mf.api.amx.applyRequiredMarker(amxNode, field);

    return field.fieldRoot;
  };

  inputText.prototype.__getTestJavaScriptURI = function(amxTag)
  {
    return "js/testing/amx-inputText.js";
  };

  /**
   * Since the textInput event has its own event data, we need to use a closure
   * in order for the amxNode to also be made available to the handler.
   * @param {HTMLElement} inputElement the text input or textarea element
   * @param {adf.mf.api.amx.AmxNode} amxNode the amxNode for the inputText
   */
  inputText.prototype._registerTextInputHandlers = function(inputElement, amxNode)
  {
    var typeHandler = this;
    var isAndroid = (adf.mf.internal.amx.agent["type"] == "Android");
    var isAndroidChrome = (isAndroid && (adf.mf.internal.amx.agent["subtype"] == "Chrome"));

    var eventHandler = function(e)
    {
      var result = typeHandler._handleTextInput(e, amxNode, isAndroidChrome);
      return result; // we need to return a result from the listener to honor max length typing
    };
    adf.mf.api.amx.addBubbleEventListener(inputElement, "keypress", eventHandler);
    // even though we detect keypresses, we also need to detect keyup events
    // to make sure we catch non-printable keys (like DEL)
    adf.mf.api.amx.addBubbleEventListener(inputElement, "keyup", eventHandler);
    adf.mf.api.amx.addBubbleEventListener(inputElement, "textInput", eventHandler);

    if (isAndroid)
    {
      var eventHandler2 = function(e)
      {
        // for Android+Chrome, we are going to be slightly inefficient (but correct) by always marking
        // ourselves dirty when we receive the "input" event on types that require special delete handling.
        // sometimes (like type=number) the only way we are told of an event (like a softkey backspace) is
        // via the "input" method and nothing else, so we just mark ourselves dirty when we see this.
        // for Android 4.0.4 the japanese characters on a SonyErricson phone produces only input event and
        // none of the above events (keypress, keyup, textInput). So we need to mark the amxNode_dirty or else
        // we won't get a value change event.
        amxNode._dirty = true;
        return true;
      };
      adf.mf.api.amx.addBubbleEventListener(inputElement, "input", eventHandler2);
    }
  }

  /**
   * Handles any event that needs maximum length protection or deals
   * with keyboard/clipboard changing of the field's value.
   * @param {Object} event the tap event
   * @param {adf.mf.api.amx.AmxNode} amxNode the amxNode for the inputText
   * @param {boolean} isAndroidChrome whether or not this is Android 4.4+ (Android+Chrome)
   */
  inputText.prototype._handleTextInput = function(e, amxNode, isAndroidChrome)
  {
    var id = amxNode.getId();
    var inputElement = document.getElementById(id + "__inputElement");
    var clearElement = document.getElementById(id + "__clear");

    if (clearElement != null)
    {
      // If escape was pressed (not all platforms support it), treat it like a "clear"
      if (e.charCode == 27) // escape was pressed
        inputElement.value = "";

      // Make sure the clear element is shown/hidden as appropriate
      inputText._updateEmptyMarker(id);
    }

    var maxLength = amxNode.getAttribute("maximumLength");
    if (maxLength <= 0)
    {
      // we are allowing characters, so we are dirty
      amxNode._dirty = true;
      // no max length specified so return true to allow the chars
      return true;
    }

    var val = inputElement.value;
    var stringToAdd;
    if (e.type == "textInput")
    {
      if (e.oldData)
      {
        // When getting a "textInput" event, the stringToAdd is the full
        // value so we need to clear out the existing "val" or else we will
        // get duplicated characters.
        val = "";
        stringToAdd = e.oldData;
      }
      else if (isAndroidChrome && e.data)
      {
        // the alt events (Android+Chrome webview) handling now uses e.data
        // for the string value to add to the input text's value
        // When getting a "textInput" event, the stringToAdd is the full
        // value so we need to clear out the existing "val" or else we will
        // get duplicated characters.
        val = "";
        stringToAdd = e.data;
      }
      else
      {
        // we are allowing characters, so we are dirty
        amxNode._dirty = true;
        // this is a text event with no text, return true
        return true;
      }
    }
    else
    {
      if (isAndroidChrome)
      {
        // the alt events (Android+Chrome webview) handling now uses the input text's current
        // value as the string to add so that our max length checks work as expected
        //
        // Chromium has been sending charCode=0 for years, which breaks our old logic:
        // https://code.google.com/p/chromium/issues/detail?id=118639
        stringToAdd = val;
        val = "";
      }
      else
      {
        // assume a single keypress
        stringToAdd = String.fromCharCode(e.charCode);
      }
    }

    var addLength = stringToAdd.length;
    var numNewCharsAllowed = maxLength - val.length;
    if (addLength > numNewCharsAllowed)
    {
      // detect if there are any characters to add instead of disallowing all
      if (numNewCharsAllowed > 0)
      {
        // we are allowing characters, so we are dirty
        amxNode._dirty = true;
        // add only the allowed number of characters
        inputElement.value = val + stringToAdd.substring(0, numNewCharsAllowed);
      }
      return false;
    }

    // we are allowing characters, so we are dirty
    amxNode._dirty = true;
    return true;
  };

  /**
   * Handles a tap on the clear button.
   * @param {Object} event the tap event
   */
  inputText.prototype._handleClear = function(event)
  {
    // Eat the event since this link is handling it:
    event.preventDefault();
    event.stopPropagation();

    var amxNode = event.data;
    var id = amxNode.getId();
    var inputElement = document.getElementById(id + "__inputElement");
    inputElement.focus();
    inputElement.value = "";
    amxNode._dirty = true;
    var clearElement = document.getElementById(id + "__clear");
    inputText._updateEmptyMarker(id);
  };

  /**
   * Sets the value of the current inputElement instance to the value of the amxNode and update
   * amxNode._oldValue with the current value
   * @param {Object} amxNode the current amxNode instance
   * @param {HTMLElement} inputElement the current inputElement instance
   */
  inputText.prototype._setValue = function(amxNode, inputElement)
  {
    if (inputElement)
    {
      amxNode._dirty = false;
      // !== null also checks for boolean false value inside inputText
      var valueAttr = amxNode.getAttribute("value");
      if (valueAttr !== null && valueAttr !== "")
      {
        var textValue = amx.getTextValue(valueAttr);
        // the following code should be enabled, but since it changes
        // the current functionality a new bug will need to be filed
        // var maxLength = amxNode.getAttribute("maximumLength");
        // if (maxLength > 0 && maxLength < textValue.length)
        // {
          // textValue = textValue.substring(0, maxLength);
          // the text was clipped so we need to set ourselves to dirty
          // so the next time we blur we send a change event
          // amxNode._dirty = true;
        // }
        inputElement.value = textValue;
      }
      else
      {
        inputElement.value = null;
      }

      this._setOldValue(amxNode, inputElement);
    }
  };

  /**
   * Sets amxNode._oldValue to the value of the current inputElement's value
   * @param {Object} amxNode the current amxNode instance
   * @param {HTMLElement} inputElement the current inputElement instance
   */
  inputText.prototype._setOldValue = function(amxNode, inputElement)
  {
    if (inputElement === undefined || inputElement === null)
    {
      inputElement = document.getElementById(amxNode.getId() + "__inputElement");
    }

    if (inputElement)
    {
      amxNode._oldValue = inputElement.value;
    }
  };

  /**
   * Sets label value of field to the value of the amxNode's label attribute
   * @param {Object} amxNode the current amxNode instance
   * @param {HTMLElement} inputElement the current inputElement instance
   */
  inputText.prototype._setLabel = function(amxNode, inputElement)
  {
    var labelText = amx.getTextValue(amxNode.getAttribute("label"));
    var fieldLabel = document.getElementById(amxNode.getId() + "__fieldLabel");
    if (fieldLabel)
    {
      fieldLabel.removeChild(fieldLabel.childNodes[0]);
      fieldLabel.appendChild(document.createTextNode(labelText));
    }

    if (inputElement)
    {
      var simple = adf.mf.api.amx.isValueTrue(amxNode.getAttribute("simple"));
      if (simple)
        inputElement.setAttribute("aria-label", labelText);
    }
  };

  /**
   * Updates the marker class for the clear button.
   * @param {String} id the ID of the inputText
   */
  inputText._updateEmptyMarker = function(id)
  {
    var clearElement = document.getElementById(id + "__clear");
    if (clearElement != null)
    {
      var inputElement = document.getElementById(id + "__inputElement");
      if (inputElement != null)
      {
        var rootElement = document.getElementById(id);
        if (rootElement != null)
        {
          if (inputElement.value == "")
            rootElement.className = rootElement.className.replace(/amx-inputText-(nonE|e)?mpty/, "amx-inputText-empty");
          else
            rootElement.className = rootElement.className.replace(/amx-inputText-(nonE|e)?mpty/, "amx-inputText-nonEmpty");
        }
      }
    }
  };

  /**
   * Helper function for checking the existence of files
   */
  var image = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "image");

  image.prototype.render = function(amxNode)
  {
    var domNode = document.createElement("img");
    var source = amx.getTextValue(amxNode.getAttribute("source"));
    var srcPath = adf.mf.api.amx.buildRelativePath(source);

    // Record the original path which we will use if the source fails to load
    if (srcPath != source)
    {
      amxNode.setAttributeResolvedValue("_originalPath", source);
    }

    domNode.setAttribute("src", srcPath);
    adf.mf.api.amx.addBubbleEventListener(domNode, "error", this._handleError, amxNode);

    var shortDesc = amxNode.getAttribute("shortDesc");
    if (shortDesc == null || shortDesc == "")
    {
      // This is a decorative image so for voice over just seeting aria attribute correctly
      domNode.setAttribute("aria-hidden", "true");
      domNode.setAttribute("alt", "");
    }
    else
    {
      // This is not a decorative image, we don't need to add any role to it just alt
      domNode.setAttribute("alt", shortDesc);
    }

    return domNode;
  };

  image.prototype._handleError = function (event)
  {
    var imageElement = event.target;

    var src = imageElement.getAttribute("src");
    var amxNode = event.data;
    var isUWP = (adf.mf.internal.amx.agent["type"] === "UWP");

    var onFailBlock = function ()
    {
      // See if this is a result of the relative path not being found
      var origSource = amxNode.getAttribute("_originalPath");
      if (origSource != null)
      {
        // Try using an absolute path instead
        amxNode.setAttributeResolvedValue("_originalPath", null);
        var path = isUWP ? "" : "file://" + origSource;
        imageElement.setAttribute("src", path);
      }
      else
      {
        // Both the relative path and absolute paths were not found, load an error image
        adf.mf.api.amx.removeBubbleEventListener(imageElement, "error");
        imageElement.setAttribute("data-original-src", src);
        imageElement.setAttribute("src", "data:image/gif;base64,R0lGODlhAQABAPAAAP+A/wAAACH5BAUAAAAALAAAAAABAAEAQAICRAEAOw==");
        imageElement.classList.add("amx-image-error");
      }
    }

    // On windows platform check if the url is from local folder
    if (isUWP && AdfmfCallback.isLocalImage(src))
    {
      // use callback interface from windows to get data uri from a file
      AdfmfCallback.setDataURIForLocalImage(imageElement, src).then(null, onFailBlock);
    }
    else
    {
      onFailBlock();
    }
  };

  var commandLink = adf.mf.api.amx.TypeHandler.register(
    adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "commandLink")

  commandLink.prototype.render = function(amxNode)
  {
    var domNode = document.createElement("a");

    // Adding WAI-ARIA Attribute to the markup for the A element
    domNode.setAttribute("role", "link");

    // prevent the default behavior
    adf.mf.api.amx.addBubbleEventListener(domNode, "click", function(e)
    {
      e.stopPropagation();
      e.preventDefault();
    });

    if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("disabled")))
    {
      domNode.className = "amx-disabled";

      // Adding WAI-ARIA Attribute to the markup for disabled state
      domNode.setAttribute("aria-disabled", "true");
    }
    else if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("readOnly")))
    {
      domNode.className = "amx-readOnly";

      // Adding WAI-ARIA Attribute to the markup for readonly state
      domNode.setAttribute("aria-readonly", "true");
    }
    else
    {
      // In order for VoiceOver to honor the action, we must provide an href
      domNode.setAttribute("href", "#");
    }

    adf.mf.api.amx.addBubbleEventListener(domNode, "tap", function(event)
      {
        // Make sure keyboards are dismissed:
        domNode.focus();

        // Eat the event since this link is handling it:
        event.preventDefault();
        event.stopPropagation();
        domNode.focus();

        if (!adf.mf.api.amx.isValueTrue(amxNode.getAttribute("disabled")) &&
          !adf.mf.api.amx.isValueTrue(amxNode.getAttribute("readOnly")))
        {
          adf.mf.api.amx.validate(domNode, function()
            {
              if (adf.mf.api.amx.acceptEvent())
              {
                var event = new amx.ActionEvent();
                adf.mf.api.amx.processAmxEvent(amxNode, "action", undefined, undefined, event,
                  function()
                  {
                    var action = amxNode.getAttributeExpression("action", true);
                    if (action != null)
                    {
                      adf.mf.api.amx.doNavigation(action);
                    }
                  });
              }
            });
        }
      });

    var text = amxNode.getAttribute("text");
    if (text != null)
    {
      var label = document.createElement("label");
      label.appendChild(document.createTextNode(text));
      // VoiceOver will not apply "dimmed" to a label inside of an anchor
      // so we will mark the label as presentation/hidden and define the
      // text as the aria-label of the anchor element instead.
      label.setAttribute("role", "presentation");
      label.setAttribute("aria-hidden", "true");
      domNode.setAttribute("aria-label", text);
      domNode.appendChild(label);
    }

    var shortDesc = amxNode.getAttribute("shortDesc");
    if (shortDesc != null)
    {
      domNode.setAttribute("title", shortDesc);
    }

    adf.mf.api.amx.enableAmxEvent(amxNode, domNode, "swipe");
    adf.mf.api.amx.enableAmxEvent(amxNode, domNode, "tapHold");

    var descendants = amxNode.renderDescendants();
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      domNode.appendChild(descendants[i]);
    }
    return domNode;
  };

  commandLink.prototype.__getTestJavaScriptURI = function(amxTag)
  {
    return "js/testing/amx-commandLink.js";
  };

  var commandButton = adf.mf.api.amx.TypeHandler.register(
    adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "commandButton");

  commandButton.prototype.render = function(amxNode)
  {
    var domNode = document.createElement("div");
    domNode.setAttribute("tabindex", "0");
    var label = document.createElement("label");
    label.className = "amx-commandButton-label";
    label.appendChild(document.createTextNode(amx.getTextValue(amxNode.getAttribute("text"))));
    domNode.appendChild(label);

    // Adding WAI-ARIA Attribute to the markup for the role attribute
    domNode.setAttribute("role", "button");

    //Back Button creation and render
    var action = amxNode.getAttributeExpression("action", true);
    if (action == "__back")
    {
      var styleClass = amxNode.getAttribute("styleClass");
      if (styleClass == null || !/\bamx-commandButton-normal\b/.test(styleClass))
      {
        domNode.classList.add("amx-commandButton-back");
      }
    }

    return domNode;
  };

  commandButton.prototype.init = function(domNode, amxNode)
  {
    if (amxNode.getAttribute("icon"))
    {
      // if we have an '.', then assume it is an image
      if (amxNode.getAttribute("icon").indexOf(".") > -1)
      {
        var icon = document.createElement("img");
        icon.className = "amx-commandButton-icon";
        icon.setAttribute("src", adf.mf.api.amx.buildRelativePath(amxNode.getAttribute("icon")));
        domNode.insertBefore(icon, domNode.firstChild);
      }

      // Check for img icon position to be trailing or leading
      if (amxNode.getAttribute("iconPosition") == "trailing")
      {
        domNode.classList.add("amx-iconPosition-trailing");
      }
      else
      {
        domNode.classList.add("amx-iconPosition-leading");
      }
    }

    // Grabbing the label text of the commandButton
    var childNodes = domNode.childNodes;
    var length = childNodes.length;
    var commandButtonLabel = null;
    for (var i=0; i<length; i++)
    {
      var child = childNodes[i];
      if (child.classList.contains("amx-commandButton-label"))
      {
        commandButtonLabel = child;
        break;
      }
    }
    var commandButtonLabelText = commandButtonLabel != null ? commandButtonLabel.textContent : "";

    var shortDesc = amxNode.getAttribute("shortDesc");
    if (shortDesc != null)
    {
      domNode.setAttribute("aria-label", shortDesc);
    }

    if (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("disabled")))
    {
      // Adding WAI-ARIA Attribute to the markup for disabled state
      domNode.setAttribute("aria-disabled", "true");

      domNode.classList.add("amx-disabled");
    }

    if (commandButtonLabelText == "")
    {
      domNode.classList.add("amx-label-no-text");
    }

    adf.mf.api.amx.addBubbleEventListener(domNode, "tap", function(event)
      {
        // Make sure keyboards are dismissed:
        domNode.focus();

        // Eat the event since this button is handling it:
        event.preventDefault();
        event.stopPropagation();

        if (!adf.mf.api.amx.isValueTrue(amxNode.getAttribute("disabled")))
        {
          adf.mf.api.amx.validate(domNode, function()
            {
              if (adf.mf.api.amx.acceptEvent())
              {
                var event = new amx.ActionEvent();
                adf.mf.api.amx.processAmxEvent(amxNode, "action", undefined, undefined, event,
                  function()
                  {
                    var action = amxNode.getAttributeExpression("action", true, true);
                    if (action != null)
                    {
                      adf.mf.api.amx.doNavigation(action);
                    }
                  });
              }
             });
        }
      });

    // Add an extended target area to increase success with finger contact:
    var targetArea = document.createElement("div");
    targetArea.className = "amx-extendedTarget";
    domNode.appendChild(targetArea);

    if (!adf.mf.api.amx.isValueTrue(amxNode.getAttribute("disabled")))
    {
      var mousedown = "mousedown";
      var mouseup = "mouseup";
      if (amx.hasTouch())
      {
        mousedown = "touchstart";
        mouseup = "touchend";
      }
      //added the following code to block processing of the touch/mouse events because extraneous events
      //were being generated after the tap event. This was causing particular problems when components were being added
      //or removed (e.g. popups) because underlying components could receive unintended events.
      adf.mf.api.amx.addBubbleEventListener(domNode, mousedown, function(e)
      {
        domNode.classList.add("amx-selected");
        // Adding WAI-ARIA Attribute to the markup for button-pressed state
        domNode.setAttribute("aria-pressed", "true");
      });
      adf.mf.api.amx.addBubbleEventListener(domNode, mouseup, function(e)
      {
        domNode.classList.remove("amx-selected");
        // Adding WAI-ARIA Attribute to the markup for button-unpressed state
        domNode.setAttribute("aria-pressed", "false");
      });
      adf.mf.api.amx.addBubbleEventListener(domNode, "mouseout", function()
      {
        domNode.classList.remove("amx-selected");
        // Adding WAI-ARIA Attribute to the markup for button-unpressed state
        domNode.setAttribute("aria-pressed", "false");
      });
    }
  };

  commandButton.prototype.__getTestJavaScriptURI = function(amxTag)
  {
    return "js/testing/amx-commandButton.js";
  };

  // --------- AMX Helper Functions --------- //

  (function()
  {
    /**
     * Constructs the basic structure for all the form controls (i.e. field).
     * @param {Object} amxNode the AMX Node to generate the form field control from
     * @param {string=} forId The DOM ID assigned to the actual field element,
     *                        e.g. an "input" element that will be assigned to
     *                        the "label" element's "for" attribute.
     *                        If not specified, no "for" attribute will be assigned.
     * @return {Object} an object with properties "fieldRoot" for the root element,
     *                  "fieldLabel" for the label element, and "fieldValue" for
     *                  the value content element
     */
    amx.createField = function(amxNode, forId)
    {
      var field = {};

      var fieldRoot = document.createElement("div");
      fieldRoot.className = "field";

      field.fieldRoot = fieldRoot;
      field.isReadOnly = adf.mf.api.amx.isValueTrue(amxNode.getAttribute("readOnly"));
      field.isDisable = adf.mf.api.amx.isValueTrue(amxNode.getAttribute("disabled"));

      var fieldLabel = document.createElement("div");
      fieldLabel.className = "field-label";
      field.fieldLabel = fieldLabel;
      fieldRoot.appendChild(fieldLabel);

      var simple = adf.mf.api.amx.isValueTrue(amxNode.getAttribute("simple"));
      if (simple)
      {
        fieldRoot.classList.add("amx-simple");
      }
      else
      {
        // inputText uses knowledge of this structure to update the label as a refresh. Any
        // changes to how the label is created needs to also propagate to inputText._setLabel
        var label = document.createElement("label");

        var stampedId = amxNode.getId();
        var labelId = stampedId + "::" + "lbl";
        label.setAttribute("id", labelId);
        if (forId != null)
          label.setAttribute("for", forId);

        label.appendChild(document.createTextNode(amx.getTextValue(amxNode.getAttribute("label"))));
        fieldLabel.appendChild(label);
      }

      var fieldValue = document.createElement("div");
      fieldValue.className = "field-value";
      field.fieldValue = fieldValue;
      fieldRoot.appendChild(fieldValue);

      return field;
    };
  })();
  // --------- /AMX Helper Functions --------- //

})();
