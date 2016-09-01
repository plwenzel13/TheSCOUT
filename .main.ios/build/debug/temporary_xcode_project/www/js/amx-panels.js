/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------------- amx-panels.js -------------------- */
/* ------------------------------------------------------ */
(function()
{
  var panelPage = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "panelPage");

  panelPage.prototype._handleOverflowTap = function(e)
  {
    window.AdfmfCallback.openMenu();
  };

  panelPage.prototype._handleOverflowRefresh = function(e, header)
  {
    if (header == null)
    {
      header = document.getElementById(e.data + "_header");
    }

    if (header)
    {
      if (window.AdfmfCallback.hasOverflow())
      {
        header.classList.remove("amx-panelPage-overflowSuppressed");
      }
      else
      {
        header.classList.add("amx-panelPage-overflowSuppressed");
      }
    }
  };

  /**
   * Function to handle changes in status bar height (e.g. carrier info, phone call in progress).
   * @param {Object} e the event object or basic object from initial rendering
   */
  panelPage.prototype._handleContentOffsetTopChange = function(e)
  {
    // Get the new top content offset:
    var topContentOffset = panelPage._lastTopContentOffset;
    if (e == null)
    {
      // Invalid case:
      adf.mf.log.AMX.logp(adf.mf.log.level.FINER, "panelPage", "_handleContentOffsetTopChange", "Unexpected parameter.");
      return;
    }
    else if (e.detail == null)
    {
      // Initial rendering case:
      topContentOffset = adf.mf.api.topContentOffset;
      if (topContentOffset == null)
      {
        var queryString = adf.mf.api.getQueryString();
        topContentOffset = parseInt(adf.mf.api.getQueryStringParamValue(queryString, "topContentOffset", "0"), 10);
      }
    }
    else
    {
      // Event case:
      var eventDetail = e.detail;
      if (!isNaN(eventDetail))
        topContentOffset = eventDetail;
    }
    if (topContentOffset === undefined)
      topContentOffset = 0;
    topContentOffset = Math.max(0, topContentOffset); // ensure it is a non-negative offset
    panelPage._lastTopContentOffset = topContentOffset; // save for next time

    // Share the topContentOffset for popup positioning (so popups do not get positioned in the
    // status bar area when they get shown for the first time)
    document.querySelector("#bodyPage").setAttribute("data-topContentOffset", topContentOffset);

    // Apply the new top content offset:
    var panelPageId = e.data;
    var ppElement = document.getElementById(panelPageId);
    var ppHeaderElement = document.getElementById(panelPageId + "_header");
    var ppHeaderAppIconElement = panelPage._getHeaderChildByClass(ppHeaderElement, panelPageId, "amx-panelPage-header-appIcon");
    var ppHeaderOverflowElement = panelPage._getHeaderChildByClass(ppHeaderElement, panelPageId, "amx-panelPage-header-overflowIcon");
    var ppHeaderPrimaryElement = panelPage._getHeaderChildByClass(ppHeaderElement, panelPageId, "amx-panelPage-facet-primary");
    var ppHeaderSecondaryElement = panelPage._getHeaderChildByClass(ppHeaderElement, panelPageId, "amx-panelPage-facet-secondary");
    var ppHeaderHeaderElement = panelPage._getHeaderChildByClass(ppHeaderElement, panelPageId, "amx-panelPage-facet-header");
    var ppContentElement = document.getElementById(panelPageId + "_content");

    if (ppHeaderElement == null)
    {
      // No header content present:
      panelPage._applyStyle(ppHeaderElement, "padding-top", "0px");
      if (ppHeaderElement && adf.mf.internal.amx.getComputedStyle(ppHeaderElement).display == "block")
      {
        // These margins are only applicable when using display:block style for header content.
        // These margins are not applicable if using flex boxes.
        panelPage._applyStyle(ppHeaderAppIconElement, "margin-top", "0px");
        panelPage._applyStyle(ppHeaderOverflowElement, "margin-top", "0px");
        panelPage._applyStyle(ppHeaderPrimaryElement, "margin-top", "0px");
        panelPage._applyStyle(ppHeaderSecondaryElement, "margin-top", "0px");
        panelPage._applyStyle(ppHeaderHeaderElement, "margin-top", "0px");
      }
      panelPage._applyStyle(ppContentElement, "padding-top", topContentOffset + "px");
    }
    else
    {
      // Header content is present:
      panelPage._applyStyle(ppHeaderElement, "padding-top", topContentOffset + "px");
      if (ppHeaderElement && adf.mf.internal.amx.getComputedStyle(ppHeaderElement).display == "block")
      {
        // These margins are only applicable when using display:block style for header content.
        // These margins are not applicable if using flex boxes.
        panelPage._applyStyle(ppHeaderAppIconElement, "margin-top", topContentOffset + "px");
        panelPage._applyStyle(ppHeaderOverflowElement, "margin-top", topContentOffset + "px");
        panelPage._applyStyle(ppHeaderPrimaryElement, "margin-top", topContentOffset + "px");
        panelPage._applyStyle(ppHeaderSecondaryElement, "margin-top", topContentOffset + "px");
        panelPage._applyStyle(ppHeaderHeaderElement, "margin-top", topContentOffset + "px");
      }
      panelPage._applyStyle(ppContentElement, "padding-top", "0px");
    }
  };

  /**
   * Gets a child element by class name.
   * @param {HTMLElement} ppHeaderElement null or the panelPage header element
   * @param {string} panelPageId the id of the panelPage root element
   * @param {string} className the name of the class the direct child should have
   * @return {HTMLElement} null or the found child
   */
  panelPage._getHeaderChildByClass = function(ppHeaderElement, panelPageId, className)
  {
    var foundChild = null;
    if (ppHeaderElement != null)
      foundChild = ppHeaderElement.querySelector("#" + panelPageId + "_header > ." + className);
    return foundChild;
  };

  /**
   * Applies a style to the given element or does nothing if the element is null.
   * @param {HTMLElement} element null or the element to apply a style property to
   * @param {string} styleProperty the name of the style property to assign
   * @param {string} styleValue the style value to assign
   */
  panelPage._applyStyle = function(element, styleProperty, styleValue)
  {
    if (element != null)
      element.style[styleProperty] = styleValue;
  };

  panelPage.prototype.render = function(amxNode, id)
  {
    var rootElement = document.createElement("div");

    // render the facet header if present
    var primaryFacetChildren = amxNode.getRenderedChildren("primary");
    var headerFacetChildren = amxNode.getRenderedChildren("header");
    var secondaryFacetChildren = amxNode.getRenderedChildren("secondary");

    // render the facet header if present
    if (primaryFacetChildren.length || headerFacetChildren.length || secondaryFacetChildren.length)
    {
      // we used <header> element here but removed it dues to under ACC, VO calls it 'landmark start/end'
      var header = document.createElement("div");
      header.className = "amx-panelPage-header";
      header.id = id + "_header";

      var appIcon = document.createElement("section");
      appIcon.className = "amx-panelPage-header-appIcon";
      header.appendChild(appIcon);

      if (headerFacetChildren.length)
      {
        var headerFacet = document.createElement("div");
        headerFacet.className = "amx-panelPage-facet-header amx-panelPage-bar";
        headerFacet.setAttribute("role", "heading");
        header.appendChild(headerFacet);
        for (var i in headerFacetChildren)
        {
          var headerFacetChild = headerFacetChildren[i].render();
          if (headerFacetChild)
            headerFacet.appendChild(headerFacetChild);
        }
      }

      var primaryIsBack = false;
      var primaryFacetChildCount = primaryFacetChildren.length;
      if (primaryFacetChildCount)
      {
        var primaryFacet = document.createElement("section");
        primaryFacet.className = "amx-panelPage-facet-primary amx-panelPage-bar";
        header.appendChild(primaryFacet);

        for (var i in primaryFacetChildren)
        {
          var primaryFacetNode = primaryFacetChildren[i].render();
          if (primaryFacetNode == null)
            continue;
          if (primaryFacetChildCount == 1 &&
              primaryFacetNode.classList.contains("amx-commandButton-back"))
          {
            primaryIsBack = true;
          }
          primaryFacet.appendChild(primaryFacetNode);
        }
      }

      // This style class is added when primary facet has a back button inside
      if (primaryIsBack)
        header.classList.add("amx-panelPage-header-primaryIsBack");

      if (secondaryFacetChildren.length)
      {
        var secondaryFacet = document.createElement("section");
        secondaryFacet.className = "amx-panelPage-facet-secondary amx-panelPage-bar";
        header.appendChild(secondaryFacet);
        for (var i in secondaryFacetChildren)
        {
          var secondaryFacetChild = secondaryFacetChildren[i].render();
          if (secondaryFacetChild)
            secondaryFacet.appendChild(secondaryFacetChild);
        }
      }

      // only try to add the overflow icon if there is a header facet and AdfmfCallback is defined
      // AdfmfCallback is only ever defined on Android, so we can use this as a simple Android check
      // as well and not worry about doing anything additional
      if (headerFacetChildren.length && window['AdfmfCallback'] != null)
      {
        var overflowIcon = document.createElement("section");
        overflowIcon.className = "amx-panelPage-header-overflowIcon";
        overflowIcon.setAttribute("tabindex", "0");
        overflowIcon.setAttribute("role", "button");
        var overflowLabel =
          adf.mf.resource.getInfoString(
            "AMXInfoBundle",
            "amx_panelPage_LABEL_OVERFLOW_BUTTON");
        overflowIcon.setAttribute("aria-label", overflowLabel);
        header.appendChild(overflowIcon);
        // now add the tap handling
        adf.mf.api.amx.addBubbleEventListener(overflowIcon, "tap", this._handleOverflowTap);

        // Now add the page show handling. This will be used to refresh the overflow menu when a webview is
        // hidden and then reshown, since it is possible that the menu state has changed while the view was
        // hidden
        adf.mf.api.amx.addBubbleEventListener(document, "mafviewvisible", this._handleOverflowRefresh, id);

        // Now add the refresh handling (goes to the same handler as above). This will be called by the Java
        // layer when a webview is currently being displayed and the application information has changed. In
        // this scenario, we want to refresh the menu so that we are in sync with the application info
        adf.mf.api.amx.addBubbleEventListener(document, "mafoverflowrefresh", this._handleOverflowRefresh, id);

        // set the initial state
        this._handleOverflowRefresh(null, header);
      }

      rootElement.appendChild(header);
    }
    // Bug 17593596: because of the webkit bug with the height
    // of the inner components content itself has to be wrapped
    // inside of another div
    var contentWrapper = document.createElement("div");
    contentWrapper.className = "amx-panelPage-contentWrapper";
    // real content div that contains all the children components
    var content = document.createElement("div");
    content.id = id + "_content";
    content.className = "amx-panelPage-content";
    adf.mf.api.amx.enableScrolling(content);
    contentWrapper.appendChild(content);
    rootElement.appendChild(contentWrapper);
    var descendants = amxNode.renderDescendants();
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      content.appendChild(descendants[i]);
    }

    var footerFacetChildren = amxNode.getRenderedChildren("footer");
    if (footerFacetChildren.length)
    {
      var footer = document.createElement("footer");
      footer.className = "amx-panelPage-footer";
      rootElement.appendChild(footer);

      var footerFacet = document.createElement("div");
      footerFacet.className = "amx-panelPage-facet-footer amx-panelPage-bar";
      footer.appendChild(footerFacet);
      for (var i in footerFacetChildren)
      {
        var footerFacetChild = footerFacetChildren[i].render();
        if (footerFacetChild)
          footerFacet.appendChild(footerFacetChild);
      }
    }

    return rootElement;
  };

  panelPage.prototype.postDisplay = function(domNode, amxNode)
  {
    var panelPageId = amxNode.getId();

    // Restore the old scroll position in case this view instance already had one:
    var storedData = amxNode.getClientState();
    if (storedData != null)
    {
      var content = document.getElementById(panelPageId + "_content");
      if (content)
      {
        var scrollLeft = storedData.scrollLeft;
        if (scrollLeft != null)
          content.scrollLeft = scrollLeft;
        var scrollTop = storedData.scrollTop;
        if (scrollTop != null)
          content.scrollTop = scrollTop;
      }
    }

    // Initialize the panelPage's top offset and register a listener for updates:
    this._handleContentOffsetTopChange({"data": panelPageId});
    adf.mf.api.amx.addBubbleEventListener(window, "mafcontentoffsettop", this._handleContentOffsetTopChange, panelPageId);
  };

  panelPage.prototype.preDestroy = function(domNode, amxNode)
  {
    // Store off the current scroll position in case this view instance is ever revisited:
    var content = document.getElementById(amxNode.getId() + "_content");
    if (content)
    {
      var scrollLeft = content.scrollLeft;
      var scrollTop = content.scrollTop;
      if (scrollLeft != null || scrollTop != null)
      {
        var storedData =
        {
          scrollLeft: scrollLeft,
          scrollTop: scrollTop
        };
        amxNode.setClientState(storedData);
      }
    }

    // Clean up document event listeners that were potentially added when the panelPage was rendered:
    var id = amxNode.getId();
    adf.mf.api.amx.removeBubbleEventListener(document, "mafviewvisible", this._handleOverflowRefresh, id);
    adf.mf.api.amx.removeBubbleEventListener(document, "mafoverflowrefresh", this._handleOverflowRefresh, id);
    adf.mf.api.amx.removeBubbleEventListener(window, "mafcontentoffsettop", this._handleContentOffsetTopChange, id);
  };

  var panelFormLayout = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "panelFormLayout");

  panelFormLayout.prototype.render = function(amxNode)
  {
    // Generate the outer structure:
    var rootElement = document.createElement("div");
    var rootStyleClasses = [];
    rootStyleClasses.push("amx-panelFormLayout");
    // Adding WAI-ARIA Attribute for the PFL Node
    rootElement.setAttribute("role", "form");
    var body = document.createElement("div");
    body.className = "amx-panelFormLayout_body";
    rootElement.appendChild(body);

    // Apply the labelAlignement marker class:
    var labelPositionStyle = "amx-label-position-start"; // default is "start"
    if (amxNode.getAttribute("labelPosition") != null)
    {
      if (amxNode.getAttribute("labelPosition") === "end")
        labelPositionStyle = "amx-label-position-end";
      else if (amxNode.getAttribute("labelPosition") === "center")
        labelPositionStyle = "amx-label-position-center";
      else if (amxNode.getAttribute("labelPosition") === "topStart")
        labelPositionStyle = "amx-label-position-topStart";
      else if (amxNode.getAttribute("labelPosition") === "topCenter")
        labelPositionStyle = "amx-label-position-topCenter";
      else if (amxNode.getAttribute("labelPosition") === "topEnd")
        labelPositionStyle = "amx-label-position-topEnd";
    }
    rootStyleClasses.push(labelPositionStyle);

    var fieldHalignStyle = "amx-field-halign-end"; // default is "end"
    if (amxNode.getAttribute("fieldHalign") != null)
    {
      if (amxNode.getAttribute("fieldHalign") === "start")
        fieldHalignStyle = "amx-field-halign-start";
      else if (amxNode.getAttribute("fieldHalign") === "center")
        fieldHalignStyle = "amx-field-halign-center";
    }
    rootStyleClasses.push(fieldHalignStyle);

    var descendants = amxNode.renderDescendants();
    var maxColumns = amxNode.getAttribute("maxColumns");
    if (!maxColumns)
      maxColumns = Number.MAX_VALUE;
    var rows = amxNode.getAttribute("rows");
    if (!rows)
      rows = Number.MAX_VALUE;

    // By default ("skin") we should not add a style class; let the skin decide.
    // If set to "true" explicitly, add a marker requesting it be shown.
    // If set to "false" explicitly, add a marker requesting it be hidden.
    var showHorizontalDividers = amxNode.getAttribute("showHorizontalDividers");
    if ("true" == showHorizontalDividers)
      rootStyleClasses.push("amx-panelFormLayout_showHorizontalDividers");
    else if ("false" == showHorizontalDividers)
      rootStyleClasses.push("amx-panelFormLayout_hideHorizontalDividers");

    var rowsCount = Math.max(Math.ceil(descendants.length / maxColumns), rows);

    var labelWidth = amxNode.getAttribute("labelWidth");
    if(this._nonNegativeNumberRegExp.test(labelWidth))
    {
      labelWidth = labelWidth+"px";
    }
    var valueWidth = amxNode.getAttribute("fieldWidth");
    if(this._nonNegativeNumberRegExp.test(valueWidth))
    {
      valueWidth = valueWidth+"px";
    }
    var labelIsPercent = (labelWidth == null ? false : labelWidth == this._nonNegativePercentRegExp.exec(labelWidth));
    var fieldIsPercent = (valueWidth == null ? false : valueWidth == this._nonNegativePercentRegExp.exec(valueWidth));

    var labelIsPx = !labelIsPercent && (labelWidth == null ? false : labelWidth == this._nonNegativePxRegExp.exec(labelWidth));
    var fieldIsPx = !fieldIsPercent && (valueWidth == null ? false : valueWidth == this._nonNegativePxRegExp.exec(valueWidth));
    var labelSizingWidth = "";
    var fieldSizingWidth = "";

    if (labelIsPercent && fieldIsPercent)
    {
      // normalize the percents and use both
      labelWidth = parseFloat(labelWidth);
      valueWidth = parseFloat(valueWidth);
      totalPercent = labelWidth + valueWidth;
      labelWidth = 100*labelWidth/totalPercent + "%";
      valueWidth = 100*valueWidth/totalPercent + "%";

      labelSizingWidth = labelWidth;
      fieldSizingWidth = valueWidth;
    }
    else if (labelIsPx || (labelIsPx && fieldIsPx))
    {
      // label gets pixels, field becomes undefined
      labelSizingWidth = labelWidth;
    }
    else if (fieldIsPx)
    {
      // field gets pixels, label becomes undefined
      fieldSizingWidth = valueWidth;
    }

    //TABLE
    var currentRow = 0;
    var column = null;
    var sizingTable = null;
    rootElement.className = rootStyleClasses.join(" ");
    adf.mf.api.amx.enableScrolling(rootElement, true); // legacy scrolling only
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      if (!column)
      {
        column = document.createElement("div");
        column.className = "amx-panelFormLayout_column";

        sizingTable = document.createElement("div");
        sizingTable.className = "amx-panelFormLayout_sizingTable";
        column.appendChild(sizingTable);

        // Creating the Sizing Parent Div and it's 2 children --> Label Div and Value Div for sizing purpose only
        var sizingRow = document.createElement("div");
        sizingRow.className = "amx-panelFormLayout_sizingRow";
        var sizingLabelCell = document.createElement("div");
        sizingLabelCell.className = "field-label";
        sizingLabelCell.style.width = labelSizingWidth;
        var sizingValueCell = document.createElement("div");
        sizingValueCell.className = "field-value";
        sizingValueCell.style.width = fieldSizingWidth;

        // Append the 3 div's to the PFL_body div
        sizingRow.appendChild(sizingLabelCell);
        sizingRow.appendChild(sizingValueCell);
        sizingTable.appendChild(sizingRow);
      }

      body.appendChild(column);
      sizingTable.appendChild(descendants[i]);

      currentRow++;
      if (currentRow >= rowsCount)
      {
        column = null;
        currentRow = 0;
      }
    }
    return rootElement;
  };

  panelFormLayout.prototype._nonNegativeNumberRegExp = new RegExp(/^[0-9]+[.]?[0-9]*$/);
  panelFormLayout.prototype._nonNegativePercentRegExp = new RegExp(/[0-9]+[.]?[0-9]*[%]/);
  panelFormLayout.prototype._nonNegativePxRegExp = new RegExp(/[0-9]+[.]?[0-9]*[p][x]/);

  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "panelLabelAndMessage").prototype.render = function(amxNode)
  {
    var field = amx.createField(amxNode); // generate the fieldRoot/fieldLabel/fieldValue structure
    var fieldRoot = field.fieldRoot;
    // Adding WAI-ARIA Attributes for the component
    fieldRoot.setAttribute("aria-labelledby", amxNode.getAttribute("label"));
    var fieldValue = field.fieldValue;
    var descendants = amxNode.renderDescendants();
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      fieldValue.appendChild(descendants[i]);
    }

    var isRequired = adf.mf.api.amx.isValueTrue(amxNode.getAttribute("showRequired"));
    if (isRequired)
      fieldValue.setAttribute("aria-required", "true");

    // calls applyRequiredMarker to determine and implement required/showRequired style
    adf.mf.api.amx.applyRequiredMarker(amxNode, field);
    return fieldRoot;
  };

  var panelGroupLayout = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "panelGroupLayout");

  panelGroupLayout.prototype.render = function(amxNode)
  {
    var rootElement;
    var childWrapperParent = null;
    var layout = amxNode.getAttribute("layout");
    var scrollPolicyScroll = amxNode.getAttribute("scrollPolicy");
    var isHorizontal = (layout === "horizontal");
    var isWrap = (layout === "wrap");
    var halign = (!isWrap ? amxNode.getAttribute("halign") : null);
    var valign = (isHorizontal ? amxNode.getAttribute("valign") : null);

    if (isHorizontal)
    {
      rootElement = document.createElement("div");
      rootElement.className = "amx-horizontal";
      if (scrollPolicyScroll == "scroll")
        adf.mf.api.amx.enableScrolling(rootElement);
      else if (scrollPolicyScroll != "none")
        adf.mf.api.amx.enableScrolling(rootElement, true); // legacy scrolling only
      var table = document.createElement("table");
      rootElement.appendChild(table);
      childWrapperParent = table.insertRow(-1);
      if (halign == "center")
      {
        table.setAttribute("align", "center");
      }
      else if (halign == "end")
      {
        // The first child of a horizontal layout must be an empty "100%-wide" cell to force the
        // other cells to be pushed to the end side of the table:
        var wrapper = childWrapperParent.insertCell(-1);
        wrapper.setAttribute("width", "100%");
      }
    }
    else if (isWrap)
    {
      rootElement = document.createElement("span");
      rootElement.className = "amx-wrap";
      if (scrollPolicyScroll == "scroll")
        adf.mf.api.amx.enableScrolling(rootElement);
      else if (scrollPolicyScroll != "none")
        adf.mf.api.amx.enableScrolling(rootElement, true); // legacy scrolling only
    }
    else // isVertical
    {
      rootElement = document.createElement("div");
      rootElement.className = "amx-vertical";
      if (scrollPolicyScroll == "scroll")
        adf.mf.api.amx.enableScrolling(rootElement);
      else if (scrollPolicyScroll != "none")
        adf.mf.api.amx.enableScrolling(rootElement, true); // legacy scrolling only
      if (halign == "center")
      {
        rootElement.setAttribute("align", "center");
      }
      else if (halign == "end")
      {
        if (document.documentElement.dir == "rtl")
          rootElement.setAttribute("align", "left");
        else
          rootElement.setAttribute("align", "right");
      }
    }

    var descendants = amxNode.renderDescendants();
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      var elem = descendants[i];
      if (isHorizontal)
      {
        var wrapper = childWrapperParent.insertCell(-1);
        wrapper.appendChild(elem);
        if (valign == "top" || valign == "middle" || valign == "bottom")
          wrapper.setAttribute("valign", valign);
      }
      else if (isWrap)
      {
        rootElement.appendChild(elem);
      }
      else // isVertical
      {
        var wrapper = document.createElement("div");
        wrapper.appendChild(elem);
        rootElement.appendChild(wrapper);
      }
    }
    return rootElement;
  };

  panelGroupLayout.prototype.postDisplay = function(domNode, amxNode)
  {
    if ("scroll" == amxNode.getAttribute("scrollPolicy"))
    {
      // Restore the old scroll position in case this view instance already had one:
      var storedData = amxNode.getClientState();
      if (storedData != null)
      {
        var scrollLeft = storedData.scrollLeft;
        if (scrollLeft != null)
          domNode.scrollLeft = scrollLeft;
        var scrollTop = storedData.scrollTop;
        if (scrollTop != null)
          domNode.scrollTop = scrollTop;
      }
    }
  };

  panelGroupLayout.prototype.preDestroy = function(domNode, amxNode)
  {
    if ("scroll" == amxNode.getAttribute("scrollPolicy"))
    {
      // Store off the current scroll position in case this view instance is ever revisited:
      var scrollLeft = domNode.scrollLeft;
      var scrollTop = domNode.scrollTop;
      if (scrollLeft != null || scrollTop != null)
      {
        var storedData =
        {
          scrollLeft: scrollLeft,
          scrollTop: scrollTop
        };
        amxNode.setClientState(storedData);
      }
    }
  };

  // AMX Table Layout
  var tableLayout = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "tableLayout");

  tableLayout.prototype.render = function(amxNode)
  {
    var rootElement = document.createElement("div");
    adf.mf.api.amx.enableScrolling(rootElement, true); // legacy scrolling only

    var table = document.createElement("table");
    table.setAttribute("border", _ensureValidInt(amxNode.getAttribute("borderWidth"), 0));
    table.setAttribute("cellPadding", _ensureValidInt(amxNode.getAttribute("cellPadding"), 0));
    table.setAttribute("cellSpacing", _ensureValidInt(amxNode.getAttribute("cellSpacing"), 0));

    var halign = _ensureValidEnum(amxNode.getAttribute("halign"), "start", "center", "end"); // start is the default
    if (halign == "end")
    {
      if (document.documentElement.dir == "rtl")
        table.setAttribute("align", "left");
      else
        table.setAttribute("align", "right");
    }
    else if (halign == "center")
    {
      table.setAttribute("align", halign);
    }

    var layout = _ensureValidEnum(amxNode.getAttribute("layout"), "fixed", "weighted"); // fixed is the default
    if (layout == "fixed")
      table.style.tableLayout = "fixed";

    var shortDesc = amxNode.getAttribute("shortDesc");
    if (shortDesc != null)
      table.title = shortDesc;

    table.summary = _ensureValidString(amxNode.getAttribute("summary"), "");
    // If table layout is not used for data, only for presentation then we need to set the correct wai-aria role
    if (table.summary == "")
      table.setAttribute("role", "presentation");

    var width = amxNode.getAttribute("width");
    if (width != null)
      table.width = width;

    rootElement.appendChild(table);

    // Append the rows to the table:
    var descendants = amxNode.renderDescendants();
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      var row = descendants[i];
      if (row.tagName == "TR")
        table.appendChild(row);
      else
        console.log("Illegal child found in tableLayout: " + row);
    }

    return rootElement;
  };

  tableLayout.prototype.attributeChangeResult = function(
    amxNode,
    attributeName,
    attributeChanges)
  {
    switch (attributeName)
    {
      case "width":
        return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];

      default:
        return tableLayout.superclass.attributeChangeResult.call(this,
          amxNode, attributeName, attributeChanges);
    }
  };

  tableLayout.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    if (attributeChanges.hasChanged("width"))
    {
      var rootElement = document.getElementById(amxNode.getId());
      var table = rootElement.firstChild;
      var width = amxNode.getAttribute("width");
      table.width = width;
    }

    tableLayout.superclass.refresh.call(this,
      amxNode, attributeChanges, descendentChanges);
  };

  var rowLayout = adf.mf.api.amx.TypeHandler.register(
    adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "rowLayout")

  rowLayout.prototype.render = function(amxNode)
  {
    var row = document.createElement("tr");

    // Append the cells to the row:
    var descendants = amxNode.renderDescendants();
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      var cell = descendants[i];
      if (cell.tagName == "TD")
        row.appendChild(cell);
      else if (cell.tagName == "TH")
        row.appendChild(cell);
      else
        console.log("Illegal child found in rowLayout: " + cell);
    }

    return row;
  };

  var cellFormat = adf.mf.api.amx.TypeHandler.register(
    adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "cellFormat");

  cellFormat.prototype.render = function(amxNode)
  {
    var cell;
    var header = _ensureValidBoolean(amxNode.getAttribute("header"), false);
    if (header)
      cell = document.createElement("th");
    else
      cell = document.createElement("td");

    var columnSpan = Math.max(1, _ensureValidInt(amxNode.getAttribute("columnSpan"), 1));
    cell.setAttribute("colspan", columnSpan);

    var rowSpan = Math.max(1, _ensureValidInt(amxNode.getAttribute("rowSpan"), 1));
    cell.setAttribute("rowspan", rowSpan);

    // start is the default
    var halign = _ensureValidEnum(amxNode.getAttribute("halign"), "start", "center", "end");
    if (halign == "end")
    {
      if (document.documentElement.dir == "rtl")
        cell.setAttribute("align", "left");
      else
        cell.setAttribute("align", "right");
    }
    else if (halign == "center")
    {
      cell.setAttribute("align", halign);
    }
    else
    {
      if (document.documentElement.dir == "rtl")
        cell.setAttribute("align", "right");
      else
        cell.setAttribute("align", "left");
    }

    // middle is the default
    var valign = _ensureValidEnum(amxNode.getAttribute("valign"), "middle", "top", "bottom");
    cell.setAttribute("valign", valign);

    var shortDesc = amxNode.getAttribute("shortDesc");
    if (shortDesc != null)
      cell.title = shortDesc;

    var width = amxNode.getAttribute("width");
    if (width != null)
      cell.width = width;

    var height = amxNode.getAttribute("height");
    if (height != null)
      cell.height = height;

    // Append the content to the cell:
    var descendants = amxNode.renderDescendants();
    for (var i=0, size=descendants.length; i<size; ++i)
    {
      cell.appendChild(descendants[i]);
    }

    return cell;
  };

  cellFormat.prototype.attributeChangeResult = function(
    amxNode,
    attributeName,
    attributeChanges)
  {
    switch (attributeName)
    {
      case "width":
      case "height":
        return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];

      default:
        return cellFormat.superclass.attributeChangeResult.call(this,
          amxNode, attributeName, attributeChanges);
    }
  };

  cellFormat.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    if (attributeChanges.hasChanged("width"))
    {
      var rootElement = document.getElementById(amxNode.getId());
      var width = amxNode.getAttribute("width");
      rootElement.width = width;
    }

    if (attributeChanges.hasChanged("height"))
    {
      var rootElement = document.getElementById(amxNode.getId());
      var height = amxNode.getAttribute("height");
      rootElement.height = height;
    }

    cellFormat.superclass.refresh.call(this,
      amxNode, attributeChanges, descendentChanges);
  };

  function _ensureValidInt(rawValue, defaultValue)
  {
    if (rawValue == null)
      return defaultValue;
    var result = parseInt(rawValue, 10);
    if (isNaN(result))
      return defaultValue;
    return result;
  }

  function _ensureValidBoolean(rawValue, defaultValue)
  {
    if ("true" === rawValue || true === rawValue)
      return true;
    else if ("false" === rawValue || false === rawValue)
      return false;
    return defaultValue;
  }

  function _ensureValidString(rawValue, defaultValue)
  {
    if (rawValue == null)
      return defaultValue;
    return rawValue;
  }

  function _ensureValidEnum()
  {
    var argLength = arguments.length;
    if (argLength < 2)
      console.log("Not enough _ensureValidEnum arguments");
    var rawValue = arguments[0];
    for (var i=1; i<argLength; i++)
    {
      if (rawValue == arguments[i])
        return rawValue;
    }
    return arguments[1]; // use the default value instead
  }

  var panelStretchLayout = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "panelStretchLayout");

  var stratchAreas = {top: "top", bottom: "bottom", /*start: "start", end: "end",*/ center: "center"};

  panelStretchLayout.prototype.createChildrenNodes = function(amxNode)
  {
    for (var area in stratchAreas)
    {
      this._createChildrenNodes(amxNode, area);
    }
    return true;
  };

  panelStretchLayout.prototype._createChildrenNodes = function(amxNode, area)
  {
    var tag = amxNode.getTag();
    var facetTag = tag.getChildFacetTag(area);
    if (facetTag !== null)
    {
      var facetTagChildren = facetTag.getChildrenUITags();
      for (var i = 0, size = facetTagChildren.length; i < size; ++i)
      {
        var facetTagChild = facetTagChildren[i];
        amxNode.addChild(facetTagChild.buildAmxNode(amxNode, null), area);
      }
    }
  };

  panelStretchLayout.prototype.render = function(amxNode)
  {
    try
    {
      var rootElement = document.createElement("div");
      rootElement.className = "amx-fitParent";
      var topElement = document.createElement("div");
      topElement.className = "amx-panelStretchLayout_top";
      var middleElement = document.createElement("div");
      var centerElement = document.createElement("div");
      centerElement.className = "amx-panelStretchLayout_center";
      var bottomElement = document.createElement("div");
      bottomElement.className = "amx-panelStretchLayout_bottom";

      rootElement.appendChild(topElement);
      rootElement.appendChild(middleElement);
      middleElement.appendChild(centerElement);
      rootElement.appendChild(bottomElement);

      var areaToComponent = this._getAreaToComponent (rootElement);
      var scrollPolicy = amxNode.getAttribute("scrollPolicy");
      if (scrollPolicy == "scroll")
        adf.mf.api.amx.enableScrolling(areaToComponent["center"]);
      else if (scrollPolicy != "none")
        adf.mf.api.amx.enableScrolling(areaToComponent["center"], true); // legacy scrolling only
      for (var area in stratchAreas)
      {
        this._render(amxNode, areaToComponent, area);
      }
      return rootElement;
    }
    catch (problem)
    {
      console.error(problem);
    }
  };

  panelStretchLayout.prototype._render = function(amxNode, areaToComponent, area)
  {
    var facetChildren = amxNode.getRenderedChildren(area);
    if (facetChildren.length)
    {
      var areaComponent = areaToComponent[area];
      for (var i in facetChildren)
      {
        var facetChild = facetChildren[i].render();
        if (facetChild)
          areaComponent.appendChild(facetChild);
      }
    }
  };

  panelStretchLayout.prototype._getAreaToComponent = function(rootElement)
  {
    var areas = {};
    for (var area in stratchAreas)
    {
      var nodeList = rootElement.getElementsByClassName("amx-panelStretchLayout_" + area);
      if (nodeList.length > 0)
        areas[area] = nodeList[0];
    }
    return areas;
  };

})();

