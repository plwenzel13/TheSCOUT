/* Copyright (c) 2016, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* --------------- amx-accessoryLayout.js --------------- */
/* ------------------------------------------------------ */

(function()
{
  var accessoryLayout = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "accessoryLayout");

  accessoryLayout.prototype.render = function(amxNode, id)
  {
    // Attributes:
    //   startWidth
    //   startDesc
    //   startClass
    //   startStyle
    //   startFullTriggerSelector
    //   endWidth
    //   endDesc
    //   endClass
    //   endStyle
    //   endFullTriggerSelector

    // DOM Structure:
    //   root div amx-accessoryLayout
    //     div amx-accessoryLayout_content
    //       indexed children
    //     div amx-accessoryLayout_start
    //       div amx-accessoryLayout_startWrap
    //         start facet content
    //     a amx-accessoryLayout_toggle-start
    //     div amx-accessoryLayout_end
    //       div amx-accessoryLayout_endWrap
    //         end facet content
    //     a amx-accessoryLayout_toggle-end
    try
    {
      var rootElement = document.createElement("div");

      // The content element houses the indexed children.
      var contentElem = document.createElement("div");
      contentElem.setAttribute("id", id + "_content");
      contentElem.className = "amx-accessoryLayout_content " + this._ensureValidString(amxNode.getAttribute("contentClass"), "");
      contentElem.setAttribute("style", this._ensureValidString(amxNode.getAttribute("contentStyle"), ""));
      rootElement.appendChild(contentElem);

      // Render the indexed children:
      var children = amxNode.getRenderedChildren();
      for (var i=0, size=children.length; i<size; ++i)
      {
        var childElement = children[i].render();
        if (childElement != null)
          contentElem.appendChild(childElement);
      }

      var startWidth = 0;
      var endWidth = 0;
      var startFullTriggerSelector = null;
      var endFullTriggerSelector = null;
      var hasStartAccessory = false;
      var hasEndAccessory = false;

      // Render the start facet:
      var startWrap = null;
      children = amxNode.getRenderedChildren("start");
      for (var i=0, size=children.length; i<size; ++i)
      {
        var childElement = children[i].render();
        if (childElement != null)
        {
          if (startWrap == null)
          {
            hasStartAccessory = true;
            startFullTriggerSelector =
              this._ensureValidString(amxNode.getAttribute("startFullTriggerSelector"), "");
            var startElement = document.createElement("div");
            startElement.setAttribute("id", id + "_start");
            startElement.className = "amx-accessoryLayout_start " + this._ensureValidString(amxNode.getAttribute("startClass"), "");
            startElement.setAttribute("style", this._ensureValidString(amxNode.getAttribute("startStyle"), ""));

            var startWrap = document.createElement("div");
            startWrap.setAttribute("id", id + "_startWrap");
            startWrap.className = "amx-accessoryLayout_startWrap";
            startElement.appendChild(startWrap);

            startWidth = this._ensureValidWidth(amxNode.getAttribute("startWidth"));

            var startDesc = this._ensureValidString(amxNode.getAttribute("startDesc"), "");
            rootElement.appendChild(startElement);
            rootElement.appendChild(
              accessoryLayout._createToggleLink(startDesc, id, "start", startWidth));
          }
          startWrap.appendChild(childElement);
        }
      }

      // Render the end facet:
      var endWrap = null;
      children = amxNode.getRenderedChildren("end");
      for (var i=0, size=children.length; i<size; ++i)
      {
        var childElement = children[i].render();
        if (childElement != null)
        {
          if (endWrap == null)
          {
            hasEndAccessory = true;
            endFullTriggerSelector =
              this._ensureValidString(amxNode.getAttribute("endFullTriggerSelector"), "");
            var endElement = document.createElement("div");
            endElement.setAttribute("id", id + "_end");
            endElement.className = "amx-accessoryLayout_end " + this._ensureValidString(amxNode.getAttribute("endClass"), "");
            endElement.setAttribute("style", this._ensureValidString(amxNode.getAttribute("endStyle"), ""));

            var endWrap = document.createElement("div");
            endWrap.setAttribute("id", id + "_endWrap");
            endWrap.className = "amx-accessoryLayout_endWrap";
            endElement.appendChild(endWrap);

            endWidth = this._ensureValidWidth(amxNode.getAttribute("endWidth"));

            var endDesc = this._ensureValidString(amxNode.getAttribute("endDesc"), "");
            rootElement.appendChild(endElement);
            rootElement.appendChild(
              accessoryLayout._createToggleLink(endDesc, id, "end", endWidth));
          }
          endWrap.appendChild(childElement);
        }
      }

      // Add a drag listener if applicable:
      if (hasStartAccessory || hasEndAccessory)
      {
        adf.mf.api.amx.addDragListener(rootElement,
          {
            "start": accessoryLayout._handleDragStart,
            "drag": accessoryLayout._handleDrag,
            "end": accessoryLayout._handleDragEnd,
            "threshold": 5
          },
          {
            "id":                       id,
            "startWidth":               startWidth,
            "endWidth":                 endWidth,
            "hasStart":                 hasStartAccessory,
            "hasEnd":                   hasEndAccessory,
            "startFullTriggerSelector": startFullTriggerSelector,
            "endFullTriggerSelector":   endFullTriggerSelector,
            "dragState":                "closed"
          });
      }

      return rootElement;
    }
    catch (problem)
    {
      console.error(problem);
    }
  };

  /**
   * Generates a link that VoiceOver can trigger to show/hide an accessory.
   */
  accessoryLayout._createToggleLink = function(linkText, id, facetName, facetWidth)
  {
    var element = document.createElement("a");
    element.setAttribute("id", id + "_" + facetName + "Toggle");
    element.className = "amx-accessoryLayout_toggle-" + facetName;
    element.setAttribute("tabindex", 0);

    // prevent the default behavior
    adf.mf.api.amx.addBubbleEventListener(element, "click", function(e)
    {
      e.stopPropagation();
      e.preventDefault();
    });

    // In order for VoiceOver to honor the action, we must provide an href
    element.setAttribute("href", "#");

    var eventData = {
      "id":         id,
      "facetName":  facetName,
      "facetWidth": facetWidth
    };

    // VoiceOver can't do a tap on a tiny link so we must use click
    // instead. As a side bonus, this allows keyboard users to hit enter to
    // trigger the link.
    var eventName = "click";
    adf.mf.api.amx.addBubbleEventListener(
      element,
      eventName,
      accessoryLayout._handleToggle,
      eventData);

    element.textContent = linkText;
    return element;
  };

  /**
   * Handler for the hidden accessory toggle link.
   */
  accessoryLayout._handleToggle = function(event)
  {
    // Eat the event since this link is handling it:
    event.preventDefault();
    event.stopPropagation();
    var id = event.data["id"];
    var facetName = event.data["facetName"];
    var facetWidth = event.data["facetWidth"];
    var elementId = id + "_" + facetName + "Toggle";
    var element = document.getElementById(elementId);
    element.focus();

    // Set up the element states:
    var contentElement = document.getElementById(id + "_content");
    contentElement.parentNode.classList.add("amx-active");
    var startElement = null;
    var endElement = null;
    var facetElement = null;
    if (facetName == "start")
    {
      startElement = document.getElementById(id + "_start")
      startElement.style.display = "block";
      facetElement = startElement;
    }
    else
    {
      endElement = document.getElementById(id + "_end")
      endElement.style.display = "block";
      facetElement = endElement;
    }

    facetWidth =
      accessoryLayout._getFacetWidth(contentElement, facetElement, facetWidth);

    // Set the appropriate sizing:
    var invertedDirection = (facetName != "start");
    if (invertedDirection)
      facetWidth = -facetWidth;
    else
      facetWidth = facetWidth;

    // Are we disclosing or undisclosing?
    var disclosing = (accessoryLayout._cleanupId != id);

    // Reset since we are showing a new accessory:
    accessoryLayout._resetAccessoryLayouts();

    if (disclosing)
    {
      // Open up this accessory:
      accessoryLayout._setFinalStates(
        startElement,
        endElement,
        contentElement,
        facetWidth,
        true);
      accessoryLayout._startCleanupInterval(id, false);
    }
  };

  accessoryLayout.prototype._ensureValidString = function(rawValue, defaultValue)
  {
    if (rawValue == null)
      return defaultValue;
    return rawValue;
  };

  accessoryLayout.prototype._ensureValidWidth = function(rawValue)
  {
    if (rawValue == null || rawValue == "auto")
      return 0;
    if (rawValue == "100%")
      return -1;
    var intValue = parseInt(rawValue, 10);
    if (isNaN(intValue) || intValue < 0)
      return 0;
    return intValue;
  };

  accessoryLayout._handleDragStart = function(event, dragExtra)
  {
    // Reset since we are showing a new accessory:
    accessoryLayout._resetAccessoryLayouts();
  };

  accessoryLayout._handleDrag = function(event, dragExtra)
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
          var eventData = event.data;
          var startPageX = eventData["startPageX"];
          if (startPageX == null)
          {
            eventData["startPageX"] = dragExtra.pageX;
            return; // too soon to tell direction
          }

          var totalDelta = dragExtra.pageX - startPageX;
          var id = eventData["id"];
          var dragDirectionIsStart = eventData["dragDirectionIsStart"];
          var contentElement = eventData["contentElement"];
          var startElement = eventData["startElement"];
          var endElement = eventData["endElement"];
          var isRtl = (document.documentElement.dir == "rtl");

          if (dragDirectionIsStart == null) // do initial setup
          {
            if (totalDelta == 0)
              return; // we can't tell which direction yet

            if (isRtl)
              dragDirectionIsStart = (totalDelta < 0);
            else
              dragDirectionIsStart = (totalDelta > 0);

            if (dragDirectionIsStart && !eventData["hasStart"])
              return; // not applicable
            else if (!dragDirectionIsStart && !eventData["hasEnd"])
              return; // not applicable
            else
              eventData["dragDirectionIsStart"] = dragDirectionIsStart; // it is applicable

            // Initialize the temporary element references:
            contentElement = document.getElementById(id + "_content");
            eventData["contentElement"] = contentElement;
            startElement = document.getElementById(id + "_start");
            eventData["startElement"] = startElement;
            endElement = document.getElementById(id + "_end");
            eventData["endElement"] = endElement;
          }
          else
          {
            // We are set up so move the applicable elements
            var contentWidth = eventData["contentWidth"];
            if (contentWidth == null)
            {
              // We want to minimize the number of times we compute an offset for performance reasons
              contentWidth = contentElement.offsetWidth;
              eventData["contentWidth"] = contentWidth;
            }
            contentElement.parentNode.classList.add("amx-active");

            var invertedDirection = !dragDirectionIsStart;
            if (isRtl)
              invertedDirection = dragDirectionIsStart;
            var totalDistanceInRevealDirection = 0;
            if (invertedDirection)
              totalDistanceInRevealDirection = -totalDelta;
            else
              totalDistanceInRevealDirection = totalDelta;

            if (dragDirectionIsStart)
            {
              // Make sure content only moves from the start direction:
              if (isRtl)
                totalDelta = Math.min(0, totalDelta);
              else
                totalDelta = Math.max(0, totalDelta);

              accessoryLayout._handleDirectionMovement(
                eventData,
                "startFullTriggerSelector",
                "startWidth",
                startElement,
                contentWidth,
                contentElement,
                totalDistanceInRevealDirection);
            }
            else // direction is end
            {
              // Make sure content only moves from the start direction:
              if (isRtl)
                totalDelta = Math.max(0, totalDelta);
              else
                totalDelta = Math.min(0, totalDelta);

              accessoryLayout._handleDirectionMovement(
                eventData,
                "endFullTriggerSelector",
                "endWidth",
                endElement,
                contentWidth,
                contentElement,
                totalDistanceInRevealDirection);
            }

            // Adjust the content's position:
            adf.shared.impl.animationUtils._setTransformTranslate(contentElement, totalDelta + "px,0px");
          }
        }
      }
    }
    else // event not accepted, e.g. due to transitioning or DT mode
    {
      event.data["dragState"] = "closed";
      accessoryLayout._concludeMovement(event, dragExtra);
    }
  };

  accessoryLayout._handleDragEnd = function(event, dragExtra)
  {
    accessoryLayout._concludeMovement(event, dragExtra);
  };

  accessoryLayout._getFacetWidth = function(
    contentElement,
    facetElement,
    rawFacetWith)
  {
    var facetWidth = rawFacetWith;
    if (facetWidth == 0) // aka auto
    {
      // We cannot use scrollWidth because of the use of floats
      var children = facetElement.childNodes;
      for (var i=0, count=children.length; i<count; ++i)
        facetWidth += children[i].offsetWidth;
    }
    else if (facetWidth == -1) // aka 100%
    {
      facetWidth = contentElement.offsetWidth;
    }
    return facetWidth;
  };

  /**
   * Helper for the drag listener. This shared function deals with either the
   * start or the end styles of movement.
   */
  accessoryLayout._handleDirectionMovement = function(
    eventData,
    fullTriggerSelectorKey,
    facetWidthKey,
    facetElement,
    contentWidth,
    contentElement,
    totalDistanceInRevealDirection)
  {
    var hasFullDrag=false;
    facetElement.style.display = "block"; // make sure the facet gets shown

    var facetWidth = eventData["facetWidth"];
    if (facetWidth == null)
    {
      facetWidth =
        accessoryLayout._getFacetWidth(
          contentElement,
          facetElement,
          eventData[facetWidthKey]);
      eventData["facetWidth"] = facetWidth;
    }

    // Determine if this instance uses a "full trigger" gesture:
    var fullTriggerSelector = eventData[fullTriggerSelectorKey];
    if (fullTriggerSelector != "")
    {
      if (eventData["foundFullTriggerElement"] == null)
      {
        hasFullDrag = (facetElement.querySelector(fullTriggerSelector) != null);
        eventData["foundFullTriggerElement"] = hasFullDrag;
      }
      else
      {
        hasFullDrag = eventData["foundFullTriggerElement"];
      }
    }

    // Determine the new width for the start/end wrapper:
    var distanceNeededForFull = 2*facetWidth;
    var halfContentWidth = contentWidth/2;
    if (halfContentWidth < distanceNeededForFull)
      distanceNeededForFull = Math.max(halfContentWidth, facetWidth + 20);
    var rootElement = contentElement.parentNode;
    if (hasFullDrag && totalDistanceInRevealDirection > distanceNeededForFull)
    {
      eventData["dragState"] = "full";
      if (!rootElement.classList.contains("amx-full"))
      {
        rootElement.classList.add("amx-full");
        adf.shared.impl.animationUtils.addOneTimeTransitionEndWithFailsafe(
          facetElement,
          function()
          {
            rootElement.classList.remove("amx-gap");
          });
      }
      facetWidth = totalDistanceInRevealDirection;
    }
    else
    {
      eventData["dragState"] = totalDistanceInRevealDirection < facetWidth/2 ? "closed" : "open";
      if (totalDistanceInRevealDirection > facetWidth)
        rootElement.classList.add("amx-gap");
      else
        rootElement.classList.remove("amx-gap");
      rootElement.classList.remove("amx-full");
      facetWidth = Math.min(facetWidth, totalDistanceInRevealDirection);
    }
    facetElement.style.width = Math.max(0, facetWidth) + "px";
  };

  /**
   * Handler for the finishing of the drag gesture.
   */
  accessoryLayout._concludeMovement = function(event, dragExtra)
  {
    var eventData = event.data;
    if (eventData["startPageX"]) // if accessoryLayout has a drag lock...
    {
      var dragDirectionIsStart = true === eventData["dragDirectionIsStart"];
      var contentWidth = eventData["contentWidth"];
      var facetWidth = eventData["facetWidth"];

      // Delete the temporary parts of the event data (not all of it):
      var contentElement = eventData["contentElement"];
      var startElement = eventData["startElement"];
      var endElement = eventData["endElement"];
      delete eventData["startPageX"];
      delete eventData["contentElement"];
      delete eventData["startElement"];
      delete eventData["endElement"];
      delete eventData["dragDirectionIsStart"];
      delete eventData["contentWidth"];
      delete eventData["facetWidth"];
      delete eventData["foundFullTriggerElement"];

      event.preventDefault();
      event.stopPropagation();
      dragExtra.preventDefault = true;
      dragExtra.stopPropagation = true;

      if (contentElement != null)
      {
        var transitionValue = "all 200ms ease-out";
        adf.shared.impl.animationUtils._setTransition(contentElement, transitionValue);
        if (startElement != null)
          adf.shared.impl.animationUtils._setTransition(startElement, transitionValue);
        if (endElement != null)
          adf.shared.impl.animationUtils._setTransition(endElement, transitionValue);

        // Clean up the indicator in an elegant fashion (delayed to allow the screen to paint)
        setTimeout(function()
          {
            if (contentElement != null) // being null would be rare (e.g. bad timing on component replacement)
            {
              var isRtl = (document.documentElement.dir == "rtl");
              switch (eventData["dragState"])
              {
                case "open":
                  // Open; sized to the specified width
                  accessoryLayout._setFinalStates(
                    dragDirectionIsStart ? startElement : null,
                    dragDirectionIsStart ? null : endElement,
                    contentElement,
                    dragDirectionIsStart ? facetWidth : -facetWidth,
                    true);
                  accessoryLayout._startCleanupInterval(eventData["id"], true);
                  break;
                case "full":
                  // Temporarily we will become full; sized to the content width and trigger the selector
                  accessoryLayout._setFinalStates(
                    dragDirectionIsStart ? startElement : null,
                    dragDirectionIsStart ? null : endElement,
                    contentElement,
                    dragDirectionIsStart ? contentWidth : -contentWidth,
                    true);
                  setTimeout(function()
                    {
                      // Trigger a tap on the selector's match:
                      var firstMatchingElement = null;
                      if (dragDirectionIsStart)
                      {
                        firstMatchingElement =
                          startElement.querySelector(eventData["startFullTriggerSelector"]);
                      }
                      else
                      {
                        firstMatchingElement =
                          endElement.querySelector(eventData["endFullTriggerSelector"]);
                      }
                      if (firstMatchingElement != null)
                      {
                        // A goLink can't be invoked via "tap", it requires a "click":
                        var className = firstMatchingElement.className;
                        if (className != null && className.indexOf("amx-goLink") != -1)
                          adf.mf.api.amx.triggerBubbleEventListener(firstMatchingElement, "click");
                        else
                          adf.mf.api.amx.triggerBubbleEventListener(firstMatchingElement, "tap");
                      }

                      // We now can become closed again; slide back
                      accessoryLayout._setFinalStates(
                        startElement,
                        endElement,
                        contentElement,
                        0,
                        false);
                    },
                    500);
                  break;
                default:
                  // Closed; slide back
                  accessoryLayout._setFinalStates(
                    startElement,
                    endElement,
                    contentElement,
                    0,
                    true);
              }
            }
          }, 1);
      }
    }
  };

  /**
   * Applies the resting positions for the elements in the component.
   */
  accessoryLayout._setFinalStates = function(
    startElement,
    endElement,
    contentElement,
    distance,
    allowTransition)
  {
    try
    {
      if (allowTransition)
      {
        // Wait do to finish completely after a graceful transition
        adf.shared.impl.animationUtils.addOneTimeTransitionEndWithFailsafe(
          contentElement,
          function()
          {
            accessoryLayout._setFinalStatesPartB(
              startElement,
              endElement,
              contentElement,
              distance);
          });
      }

      if (startElement != null)
        startElement.style.width = Math.abs(distance) + "px";
      if (endElement != null)
        endElement.style.width = Math.abs(distance) + "px";

      if (document.documentElement.dir == "rtl")
        distance = -distance;
      adf.shared.impl.animationUtils._setTransformTranslate(
        contentElement,
        distance + "px,0px");

      if (!allowTransition)
      {
        // Do not transition, just finish completely now
        accessoryLayout._setFinalStatesPartB(
          startElement,
          endElement,
          contentElement,
          distance);
      }
    }
    catch (problem)
    {
      // We don't care if there was a problem because if there was, the
      // component was already disconnected.
      console.error(problem);
    }
  };

  /**
   * This should only be called by _setFinalStates and only if there isn't an
   * animation still running.
   */
  accessoryLayout._setFinalStatesPartB = function(
    startElement,
    endElement,
    contentElement,
    distance)
  {
    // Erase transitions:
    adf.shared.impl.animationUtils._setTransition(contentElement, "");
    if (startElement != null)
      adf.shared.impl.animationUtils._setTransition(startElement, "");
    if (endElement != null)
      adf.shared.impl.animationUtils._setTransition(endElement, "");

    // Reset classes and display styles:
    if (distance == 0)
    {
      var rootElement = contentElement.parentNode;
      rootElement.classList.remove("amx-active", "amx-gap", "amx-full");

      if (startElement != null)
        startElement.style.display = "none"; // make sure the facet gets hidden
      if (endElement != null)
        endElement.style.display = "none"; // make sure the facet gets hidden
    }
  };

  /**
   * If there is any accessoryLayout that is disclosed, this method will
   * undisclose it.
   */
  accessoryLayout._resetAccessoryLayouts = function()
  {
    // See if we have an accessoryLayout disclosed:
    if (accessoryLayout._intervalKey != null)
    {
      // Clear its timer interval if applicable:
      window.clearInterval(accessoryLayout._intervalKey);

      // Undisclose it:
      accessoryLayout._handleCleanup(accessoryLayout._cleanupId);
    }
  };

  /**
   * We don't want more than 1 instance of accessoryLayout open at a time so
   * this utility is used to manage that.
   * @param {string} id the id of the accessory layout being disclosed
   * @param {boolean} fromGesture whether the disclosure came from a drag
   */
  accessoryLayout._startCleanupInterval = function(id, fromDragGesture)
  {
    accessoryLayout._resetAccessoryLayouts();

    accessoryLayout._cleanupId = id;
    accessoryLayout._startedFromDragGesture = fromDragGesture;

    // We cannot record the starting activeElement yet because the app developer
    // might wrap the listView with a commandLink (for search swipeUp/down
    // gesture purposes so we need to give it 1ms first):
    window.setTimeout(
      function()
      {
        var activeElementAtStart = document.activeElement;
        accessoryLayout._intervalKey = window.setInterval(
          function()
          {
            if (accessoryLayout._startedFromDragGesture &&
              activeElementAtStart != document.activeElement)
            {
              // If the disclosure came from a drag gesture then a change in active
              // element means we should clean it up.
              // We don't want to do this if the disclosure came from a keyboard or
              // VoiceOver user because then it would be impossible to tab into the
              // disclosed content (they would need to manually undisclose it).
              accessoryLayout._handleCleanup();
            }
            else
            {
              // Make sure there is still something left to clean up:
              var rootElement = document.getElementById(id);
              if (rootElement == null ||
                !rootElement.classList.contains("amx-active"))
              {
                // Nothing left to watch; kill the interval:
                window.clearInterval(accessoryLayout._intervalKey);
              }
            }
          },
          500);
        },
        1);
  };

  /**
   * Cleanup handler for the accessoryLayout._startCleanupInterval function.
   */
  accessoryLayout._handleCleanup = function()
  {
    var id = accessoryLayout._cleanupId;
    window.clearInterval(accessoryLayout._intervalKey);
    accessoryLayout._intervalKey = null;
    accessoryLayout._cleanupId = null;

    var rootElement = document.getElementById(id);
    if (rootElement != null &&
      rootElement.classList.contains("amx-active"))
    {
      var contentElement = document.getElementById(id + "_content");
      var startElement = document.getElementById(id + "_start");
      var endElement = document.getElementById(id + "_end");
      accessoryLayout._setFinalStates(startElement, endElement, contentElement, 0, false);
    }
  };

})();
