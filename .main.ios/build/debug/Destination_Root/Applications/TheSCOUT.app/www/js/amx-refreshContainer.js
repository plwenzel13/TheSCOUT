/* Copyright (c) 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* -------------- amx-refreshContainer.js --------------- */
/* ------------------------------------------------------ */
(function()
{
  var refreshContainer = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "refreshContainer");

  refreshContainer.prototype.render = function(amxNode, id)
  {
    // Attributes:
    //   refreshDesc
    //   pullText
    //   busyText
    //   subText
    //   action
    //   actionListener
    //   refreshCompleteExpression

    // DOM Structure:
    //   root div amx-refreshContainer
    //     div amx-refreshContainer-pocketWrapper
    //       div amx-refreshContainer-pocket
    //         div amx-refreshContainer-icon
    //         div amx-refreshContainer-text
    //         div amx-refreshContainer-subText
    //     div amx-refreshContainer-content
    //       indexed children
    //     a amx-refreshContainer_refresh-link

    // Ability to disable/enable (optimize refresh so no redrawing and reset the offsets)
    var rootElement = document.createElement("div");

    var pocketWrapper = document.createElement("div");
    pocketWrapper.id = id + "_pocketWrapper";
    pocketWrapper.className = "amx-refreshContainer-pocketWrapper";
    rootElement.appendChild(pocketWrapper);

    // The pocket is aria-hidden because it is not applicable for VoiceOver...
    // (it uses the amx-refreshContainer_refresh-link instead)
    var pocket = document.createElement("div");
    pocket.id = id + "_pocket";
    pocket.className = "amx-refreshContainer-pocket amx-0";
    pocket.setAttribute("aria-hidden", "true");
    var icon = document.createElement("div");
    icon.id = id + "_icon";
    icon.className = "amx-refreshContainer-icon";
    pocket.appendChild(icon);
    var text = document.createElement("div");
    text.id = id + "_text";
    text.className = "amx-refreshContainer-text";
    var pullText = amxNode.getAttribute("pullText");
    if (pullText != null && pullText != "")
      pocket.classList.add("amx-hasText");
    var busyText = amxNode.getAttribute("busyText");
    if (busyText == null || busyText == "")
      busyText = pullText;
    text.textContent = pullText;
    text.setAttribute("data-pulltext", pullText);
    pocket.appendChild(text);
    var subText = document.createElement("div");
    subText.id = id + "_subText";
    subText.className = "amx-refreshContainer-subText";
    var subTextValue = amxNode.getAttribute("subText");
    if (subTextValue != null && subTextValue != "")
    {
      subText.textContent = subTextValue;
      pocket.classList.add("amx-hasSubText");
    }
    pocket.appendChild(subText);
    pocketWrapper.appendChild(pocket);

    var content = document.createElement("div");
    content.id = id + "_content";
    content.className = "amx-refreshContainer-content";
    rootElement.appendChild(content);
    var descendants = amxNode.renderDescendants();
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      content.appendChild(descendants[i]);
    }

    adf.mf.api.amx.addDragListener(rootElement,
      {
        "start": refreshContainer._handleDragStart,
        "drag": refreshContainer._handleDrag,
        "end": refreshContainer._handleDragEnd,
        "threshold": 5
      },
      {
        "id": id,
        "busyText": busyText,
        "amxNode": amxNode
      });

    adf.mf.api.amx.addBubbleEventListener(pocket, "tap", refreshContainer._handleReset, id);

    var linkText = amxNode.getAttribute("refreshDesc");
    if (linkText == null || linkText == "")
    {
      linkText = adf.mf.resource.getInfoString(
        "AMXInfoBundle","amx_refreshContainer_REFRESH_BUTTON");
    }
    rootElement.appendChild(refreshContainer._createRefreshLink(linkText, id, amxNode));

    return rootElement;
  };

  refreshContainer.prototype.attributeChangeResult = function(
    amxNode,
    attributeName,
    attributeChanges)
  {
    switch (attributeName)
    {
      case "refreshCompleteExpression":
      case "subText":
        return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];

      default:
        return refreshContainer.superclass.attributeChangeResult.call(this,
          amxNode, attributeName, attributeChanges);
    }
  };

  refreshContainer.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    var id = amxNode.getId();
    var refreshCompleteExpressionChanged = attributeChanges.hasChanged("refreshCompleteExpression");
    var subTextChanged = attributeChanges.hasChanged("subText");

    if (refreshCompleteExpressionChanged)
    {
      refreshContainer._handleReset({"data": id});
    }

    if (subTextChanged)
    {
      var subText = document.getElementById(id + "_subText");
      var subTextValue = amxNode.getAttribute("subText");
      subText.textContent = subTextValue;
      var pocket = document.getElementById(id + "_pocket");
      pocket.classList.remove("amx-hasSubText");
      if (subTextValue != null && subTextValue != "")
      {
        subText.textContent = subTextValue;
        pocket.classList.add("amx-hasSubText");
      }
    }

    refreshContainer.superclass.refresh.call(this,
      amxNode, attributeChanges, descendentChanges);
  };

  /**
   * Generates a link that VoiceOver can trigger to show/hide an accessory.
   */
  refreshContainer._createRefreshLink = function(linkText, id, amxNode)
  {
    var element = document.createElement("a");
    element.setAttribute("id", id + "_refresh");
    element.className = "amx-refreshContainer_refresh-link";
    element.setAttribute("tabindex", 0);

    // prevent the default behavior
    adf.mf.api.amx.addBubbleEventListener(element, "click", function(e)
    {
      e.stopPropagation();
      e.preventDefault();
    });

    // In order for VoiceOver to honor the action, we must provide an href
    element.setAttribute("href", "#");

    // VoiceOver can't do a tap on a tiny link so we must use click
    // instead. As a side bonus, this allows keyboard users to hit enter to
    // trigger the link.
    var eventName = "click";
    adf.mf.api.amx.addBubbleEventListener(
      element,
      eventName,
      refreshContainer._handleRefresh,
      {
        "id": id,
        "amxNode": amxNode
      });

    element.textContent = linkText;
    return element;
  };

  refreshContainer._handleRefresh = function(event)
  {
    // Trigger the action event.
    var eventData = event.data;
    var id = eventData["id"];
    var amxNode = eventData["amxNode"];
    var tag = amxNode.getTag();

    var rootElement = document.getElementById(id);
    if (rootElement != null)
    {
      adf.mf.api.amx.validate(rootElement, function()
        {
          if (adf.mf.api.amx.acceptEvent())
          {
            var actionEvent = new amx.ActionEvent();
            adf.mf.api.amx.processAmxEvent(
              amxNode,
              "action",
              undefined,
              undefined,
              actionEvent,
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

    // If an EL expression was given for refreshCompleteExpression then we will wait for a refresh
    // to happen to reset the pocket. Otherwise, we need to wait for the loading indicator to go
    // away.
    if (!tag.isAttributeElBound("refreshCompleteExpression"))
    {
      if (adf.mf.environment.profile.mockData) // use slight delay
      {
        adf.mf.api.amx.showLoadingIndicator();
        adf.mf.api.finishAnyLoading().then(
          function()
          {
            refreshContainer._handleReset({"data": id});
          });
        window.setTimeout(
          function()
          {
            adf.mf.api.amx.hideLoadingIndicator();
          },
          1000);
      }
      else // normal production behavior
      {
        adf.mf.api.finishAnyLoading().then(
          function()
          {
            refreshContainer._handleReset({"data": id});
          });
      }
    }
  };

  /**
   * Resets the component to its origin.
   */
  refreshContainer._handleReset = function(event)
  {
    var id = event.data;

    // Allow the pocketWrapper and content to animate its changes:
    var pocketWrapper = document.getElementById(id + "_pocketWrapper");
    if (pocketWrapper.classList.contains("amx-dragging"))
    {
      // Wait until the user lifts their finger:
      var pocket = document.getElementById(id + "_pocket");
      pocket.setAttribute("data-finishedRefresh", "true");
    }
    else
    {
      // No need to wait for a finger to be lifted:
      pocketWrapper.classList.remove("amx-dragging");
      var content = document.getElementById(id + "_content");
      content.classList.remove("amx-dragging");

      // Set the pocket back to its original state:
      var pocket = document.getElementById(id + "_pocket");
      pocket.className = pocket.className.replace(/amx-[0-9]+/, "amx-0");

      // Since this could happen while still dragging, we set a flag
      // to avoid a corrupt state while dragging or ending the drag.
      pocket.setAttribute("data-finishedRefresh", "true");

      // Restore the pull text:
      var text = document.getElementById(id + "_text");
      text.textContent = text.getAttribute("data-pulltext");

      // Move the pocketWrapper and content back to their original state:
      pocketWrapper.style.height = "0px";
      adf.shared.impl.animationUtils._setTransformTranslate(content, "0, 0");
    }
  };

  refreshContainer._handleDragStart = function(event, dragExtra)
  {
    // Determine whether everything between this element and the event source is scrolled to the top
    var source = event.srcElement;
    var element = this;
    var eventData = event.data;
    while (source != null && source != element)
    {
      if (source.scrollTop > 0)
      {
        eventData["scrolledToTop"] = false;
        return;
      }
      source = source.parentElement;
    }
    var id = eventData["id"];
    refreshContainer._handleReset({"data": id}); // in case already refreshing
    var pocket = document.querySelector(".amx-refreshContainer-pocket#" + id + "_pocket");
    var refreshDistance = pocket.offsetHeight;
    eventData["consuming"] = false;
    eventData["startPageY"] = null;
    eventData["scrolledToTop"] = true;
    eventData["refreshDistance"] = refreshDistance;
    eventData["restingDistance"] = 0;

    // Until we can access CSS properties to make a factor of the
    // refreshDistance configurable, we are making the assumption that the
    // position of the icon controls when we start the amx-N changes:
    var pocketBottom = adf.mf.internal.amx.getComputedStyle(pocket).bottom;
    var topAligned = isNaN(parseInt(pocketBottom, 10));
    var icon = document.querySelector(".amx-refreshContainer-icon#" + id + "_icon");
    var distanceWithoutChange = 0;
    var iconOffsetTop = icon.offsetTop;
    var iconHeight = icon.offsetHeight;
    if (!isNaN(iconOffsetTop) && !isNaN(iconHeight))
    {
      // Our assumption is that we want to start making changes when the user
      // can see a 3/4 of the icon's height--assuming the icon position as of
      // the amx-0 position.
      if (topAligned) // top aligned within the pocketWrapper
      {
        // Distance from top:
        distanceWithoutChange = iconOffsetTop + iconHeight*0.75;
      }
      else // bottom aligned within the pocketWrapper
      {
        // Distance from bottom:
        distanceWithoutChange = refreshDistance - (iconOffsetTop + iconHeight*0.25);
      }
    }
    eventData["distanceWithoutChange"] = distanceWithoutChange;

    pocket.setAttribute("data-finishedRefresh", "false");
  };

  refreshContainer._handleDrag = function(event, dragExtra)
  {
    var eventData = event.data;
    if (!eventData["scrolledToTop"])
      return;

    var id = eventData["id"];
    var element = this;
    var pocket = element.querySelector(".amx-refreshContainer-pocket#" + id + "_pocket");
    if (pocket == null || pocket.getAttribute == null)
      return; // we have navigated or otherwise redrawn this or an ancestor
    var finishedRefresh = (pocket.getAttribute("data-finishedRefresh") == "true");

    if (finishedRefresh || adf.mf.api.amx.acceptEvent())
    {
      // Only consider it a drag if the angle of the drag is within 30 degrees of due vertical
      var angle = Math.abs(dragExtra.originalAngle);
      if (angle >= 60 && angle <= 120)
      {
        // We don't rely on dragExtra.startPageY because of an issue with the auto-dismiss pane
        // on popups. By managing our own startPageY, we guarantee the correct drag start
        // coordinates.
        var startPageY = eventData["startPageY"];
        if (startPageY == null)
        {
          eventData["startPageY"] = dragExtra.pageY;
          return; // too soon to tell direction
        }

        var totalDelta = dragExtra.pageY - startPageY;
        var consumingTheDrag = (totalDelta > 0 || eventData["consuming"]);

        if (finishedRefresh || consumingTheDrag && dragExtra.requestDragLock(element, false, true))
        {
          event.preventDefault();
          event.stopPropagation();
          dragExtra.preventDefault = true;
          dragExtra.stopPropagation = true;
          eventData["consuming"] = true;

          var pocketWrapper = element.querySelector(".amx-refreshContainer-pocketWrapper#" + id + "_pocketWrapper");
          pocketWrapper.classList.add("amx-dragging");
          var content = element.querySelector(".amx-refreshContainer-content#" + id + "_content");
          content.classList.add("amx-dragging");
          var refreshDistance = eventData["refreshDistance"];
          var totalDeltaCss = Math.max(0, totalDelta);
          pocketWrapper.style.height = totalDeltaCss + "px";
          adf.shared.impl.animationUtils._setTransformTranslate(content, "0, " + totalDeltaCss + "px");

          var distanceWithoutChange = eventData["distanceWithoutChange"];
          var distanceIndex = 0;
          if (finishedRefresh)
          {
            distanceIndex = 10;
          }
          else if (totalDelta > distanceWithoutChange)
          {
            var percentDragged = (totalDelta-distanceWithoutChange)/(refreshDistance-distanceWithoutChange);
            distanceIndex = Math.min(10, Math.max(0, Math.round(10*percentDragged)));
          }

          // Only update counters if we haven't reached full refresh distance
          if (!finishedRefresh && !pocket.classList.contains("amx-10"))
          {
            if (distanceIndex == 10)
            {
              // Switch to 100% mode, swap the text, and kick off the event
              pocket.className = pocket.className.replace(/amx-[0-9]+/, "amx-10");
              eventData["restingDistance"] = refreshDistance;
              var text = element.querySelector(".amx-refreshContainer-text#" + id + "_text");
              text.textContent = eventData["busyText"];

              refreshContainer._handleRefresh(
                {
                  "data":
                    {
                      "id": id,
                      "amxNode": eventData["amxNode"]
                    }
                }); // kick off the refresh action event
            }
            else
            {
              // Keep adjusting the pre-100% styles
              pocket.className = pocket.className.replace(/amx-[0-9]+/, "amx-"+distanceIndex);
              eventData["restingDistance"] = 0;
            }
          }
        }
      }
    }
    else // event not accepted, e.g. due to transitioning or DT mode
    {
      eventData["consuming"] = false;
    }
  };

  refreshContainer._handleDragEnd = function(event, dragExtra)
  {
    var eventData = event.data;
    if (eventData["scrolledToTop"])
    {
      var id = eventData["id"];
      var element = this;
      var pocket = element.querySelector(".amx-refreshContainer-pocket#" + id + "_pocket");
      if (pocket != null && pocket.getAttribute != null)
      {
        var finishedRefresh = pocket.getAttribute("data-finishedRefresh");
        var pocketWrapper = element.querySelector(".amx-refreshContainer-pocketWrapper#" + id + "_pocketWrapper");
        var content = element.querySelector(".amx-refreshContainer-content#" + id + "_content");
        pocketWrapper.classList.remove("amx-dragging");
        content.classList.remove("amx-dragging");
        if (finishedRefresh == "false")
        {
          // Go to a resting state (either loading or not loading):
          var restingDistance = eventData["restingDistance"];
          pocketWrapper.style.height = restingDistance + "px";
          adf.shared.impl.animationUtils._setTransformTranslate(content, "0, " + restingDistance + "px");
        }
        else
        {
          // Reset finished while we were still dragging:
          refreshContainer._handleReset({"data": id});
        }
      }
    }
  };

})();

