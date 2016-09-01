/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------------- amx-popup.js --------------------- */
/* ------------------------------------------------------ */

(function()
{
  function handleResize(event)
  {
    var popupElementId = event.data;
    _handlePopupResize(popupElementId);
  }

  function _handlePopupResize(popupElementId)
  {
    var popupElement = document.getElementById(popupElementId);
    if (popupElement != null)
    {
      var firstViewContainer = _getChildrenByClassNames(bodyPageViews, ["amx-view-container"])[0];
      var viewElement = _getChildrenByClassNames(firstViewContainer, ["amx-view"])[0];
      var alignElementId = popupElement.getAttribute("data-alignElementId");
      var align          = popupElement.getAttribute("data-align");
      var popupZIndex    = popupElement.style.zIndex;
      var baseCssText    = popupElement.getAttribute("data-baseCssText");
      popupElement.style.cssText = baseCssText; // reset
      popupElement.style.zIndex = popupZIndex;
      var popupAnchor = document.getElementById(popupElement.id + "_anchor");
      if (popupAnchor != null)
      {
        var popupAnchorZIndex = popupAnchor.style.zIndex;
        popupAnchor.style.cssText = ""; // reset
        popupAnchor.style.zIndex = popupAnchorZIndex;
      }
      var newPositions = alignPopup(viewElement, popupElement, alignElementId, align);

      // set the new position for the popup element and its anchor
      var props = ["top", "right", "left", "bottom"];
      props.forEach(function(prop)
      {
        // iterate over array of possible properties [left, right, bottom, top] and
        // try to set it as a style property based on the calculated startPositions
        if (newPositions[prop] != null)
        {
          // set position of the element
          popupElement.style[prop] = newPositions[prop] + "px";
          // in case of the anchor set position to anchor
          if (popupAnchor && newPositions["anchor_" + prop] != null)
          {
            popupAnchor.style[prop] = newPositions["anchor_" + prop] + "px";
          }
        }
      });
    }
  }

  /**
   * Helper function to get the number value if the given length is in "px" units.
   * @param {String} computedStyleLength the given CSS length value
   * @param {Number} defaultValue the number to return if value is not in "px" units
   * @return {Number} the number of pixels in the given length or the defaultValue if unable get it
   */
  function getPxValue(computedStyleLength, defaultValue)
  {
    if (computedStyleLength.indexOf("px") != -1)
    {
      var intValue = parseInt(computedStyleLength, 10);
      if (!isNaN(intValue))
      {
        return intValue;
      }
    }
    if (defaultValue == null)
      return 0;
    return defaultValue;
  }

  /**
   * Helper function to set an element position style if the given element style is non-null.
   * @param {Object} elementStyle null or an element's style object
   * @param {String} propertyName the style property to set
   * @param {Number} value the number of pixels to assign
   */
  function setPosition(elementStyle, propertyName, value)
  {
    if (elementStyle != null)
    {
      elementStyle[propertyName] = value + "px";
    }
  }

  /**
   * Helper function to get the shifts associated with the currently defined anchor.
   * @param {HTMLElement} popupAnchor null or the popupAnchor element
   * @return {Array} a non-null array where the values are left, right, top, and bottom
   */
  function getAnchorShifts(popupAnchor)
  {
    if (popupAnchor == null)
      return [ 0, 0, 0, 0 ];
    var anchorCS = adf.mf.internal.amx.getComputedStyle(popupAnchor);
    anchorShiftL = -getPxValue(anchorCS.left);
    anchorShiftR = -getPxValue(anchorCS.right);
    anchorShiftT = -getPxValue(anchorCS.top);
    anchorShiftB = -getPxValue(anchorCS.bottom);
    return [ anchorShiftL, anchorShiftR, anchorShiftT, anchorShiftB ];
  }

  // All of the "align" values (excludes deprecated values):
  var ALIGN = {
    BS: "bottomStart", // the default
    TS: "topStart",
    TC: "topCenter",
    TE: "topEnd",
    ST: "startTop",
    SM: "startMiddle",
    SB: "startBottom",
    ET: "endTop",
    EM: "endMiddle",
    EB: "endBottom",
    BC: "bottomCenter",
    BE: "bottomEnd",
    CTS: "cornerTopStart",
    CTE: "cornerTopEnd",
    CBS: "cornerBottomStart",
    CBE: "cornerBottomEnd",
    OTS: "overlapTopStart",
    OTC: "overlapTopCenter",
    OTE: "overlapTopEnd",
    OMS: "overlapMiddleStart",
    OME: "overlapMiddleEnd",
    OBS: "overlapBottomStart",
    OBC: "overlapBottomCenter",
    OBE: "overlapBottomEnd",
    OMC: "overlapMiddleCenter"
  };

  /**
   * In matrix format:
   *  CTS | TS  |  TC | TE  | CTE
   * -----+-----+-----+-----+-----
   *  ST  | OTS | OTC | OTE | ET
   * -----+-----+-----+-----+-----
   *  SM  | OMS | OMC | OME | EM
   * -----+-----+-----+-----+-----
   *  SB  | OBS | OBC | OBE | EB
   * -----+-----+-----+-----+-----
   *  CBS | BS  | BC  | BE  | CBE
   */
  var ALIGN_MATRIX = null;

  /**
   * Map of align values to strategy matrix.
   */
  var ALIGN_STRATEGIES = {};

  /**
   * Map of align values to candidate lists.
   */
  var ALIGN_FALLBACK_CANDIDATES = {};

  /**
   * Helper function to return an empty strategy matrix.
   * @return {Array} a new 5 by 5 sparse matrix
   */
  function getNewEmptyStrategy()
  {
    var result = new Array(5);
    for (var i=0; i<5; ++i)
      result[i] = new Array(5);
    return result;
  }

  /**
   * Helper function to initialize the strategy objects.
   */
  function initStrategies()
  {
    if (ALIGN_MATRIX == null)
    {
      ALIGN_MATRIX = [
        [ ALIGN.CTS, ALIGN.TS, ALIGN.TC, ALIGN.TE, ALIGN.CTE ],
        [ ALIGN.ST, ALIGN.OTS, ALIGN.OTC, ALIGN.OTE, ALIGN.ET ],
        [ ALIGN.SM, ALIGN.OMS, ALIGN.OMC, ALIGN.OME, ALIGN.EM ],
        [ ALIGN.SB, ALIGN.OBS, ALIGN.OBC, ALIGN.OBE, ALIGN.EB ],
        [ ALIGN.CBS, ALIGN.BS, ALIGN.BC, ALIGN.BE, ALIGN.CBE ]
      ];

      // Strategy (2) OTS:
      //    |   |   |   |
      // ---@---+---+---+---
      //    | 1 | 5 | 3 |
      // ---+---+---+---+---
      //    | 4 | 9 | 8 |
      // ---+---+---+---+---
      //    | 2 | 7 | 6 |
      // ---+---+---+---+---
      //    |   |   |   |
      strategy = getNewEmptyStrategy();
      strategy[1][1] = 1;
      strategy[1][2] = 5;
      strategy[1][3] = 3;
      strategy[2][1] = 4;
      strategy[2][2] = 9;
      strategy[2][3] = 8;
      strategy[3][1] = 2;
      strategy[3][2] = 7;
      strategy[3][3] = 6;
      ALIGN_STRATEGIES[ALIGN.OTS] = strategy;

      // Strategy (3) OTC:
      //    |   |   |   |
      // ---+---+-@-+---+---
      //    | 3 | 1 | 4 |
      // ---+---+---+---+---
      //    | 7 | 9 | 8 |
      // ---+---+---+---+---
      //    | 5 | 2 | 6 |
      // ---+---+---+---+---
      //    |   |   |   |
      strategy = getNewEmptyStrategy();
      strategy[1][1] = 3;
      strategy[1][2] = 1;
      strategy[1][3] = 4;
      strategy[2][1] = 7;
      strategy[2][2] = 9;
      strategy[2][3] = 8;
      strategy[3][1] = 5;
      strategy[3][2] = 2;
      strategy[3][3] = 6;
      ALIGN_STRATEGIES[ALIGN.OTC] = strategy;

      // Strategy (4) CBS:
      //   7 |  8 | 15 | 11 | 10
      // ----+----+----+----+----
      //   9 |    |    |    | 12
      // ----+----+----+----+----
      //  14 |    | 18 |    | 16
      // ----+----+----+----+----
      //   3 | 17 |    |    |  6
      // ----@----+----+----+----
      //   1 |  2 | 13 |  5 |  4
      strategy = getNewEmptyStrategy();
      strategy[0][0] = 7;
      strategy[0][1] = 8;
      strategy[0][2] = 15;
      strategy[0][3] = 11;
      strategy[0][4] = 10;
      strategy[1][0] = 9;
      strategy[1][4] = 12;
      strategy[2][0] = 14;
      strategy[2][2] = 18;
      strategy[2][4] = 16;
      strategy[3][0] = 3;
      strategy[3][1] = 17;
      strategy[3][4] = 6;
      strategy[4][0] = 1;
      strategy[4][1] = 2;
      strategy[4][2] = 13;
      strategy[4][3] = 5;
      strategy[4][4] = 4;
      ALIGN_STRATEGIES[ALIGN.CBS] = strategy;

      // Strategy (5) BC:
      //  13 | 11 |  2 | 12 | 14
      // ----+----+----+----+----
      //  15 |    |    |    | 16
      // ----+----+----+----+----
      //   3 |    | 18 |    |  4
      // ----+----+----+----+----
      //   9 |    | 17 |    | 10
      // ----+----+--@-+----+----
      //   7 |  5 |  1 |  6 |  8
      strategy = getNewEmptyStrategy();
      strategy[0][0] = 13;
      strategy[0][1] = 11;
      strategy[0][2] = 2;
      strategy[0][3] = 12;
      strategy[0][4] = 14;
      strategy[1][0] = 15;
      strategy[1][4] = 16;
      strategy[2][0] = 3;
      strategy[2][2] = 18;
      strategy[2][4] = 4;
      strategy[3][0] = 9;
      strategy[3][2] = 17;
      strategy[3][4] = 10;
      strategy[4][0] = 7;
      strategy[4][1] = 5;
      strategy[4][2] = 1;
      strategy[4][3] = 6;
      strategy[4][4] = 8;
      ALIGN_STRATEGIES[ALIGN.BC] = strategy;

      // Strategy (6) BS:
      //  14 |  2 | 10 |  4 | 16
      // ----+----+----+----+----
      //   7 |    |    |    |  8
      // ----+----+----+----+----
      //  11 |    | 18 |    | 12
      // ----+----+----+----+----
      //   5 | 17 |    |    |  6
      // ----@----+----+----+----
      //  13 |  1 |  9 |  3 | 15
      strategy = getNewEmptyStrategy();
      strategy[0][0] = 14;
      strategy[0][1] = 2;
      strategy[0][2] = 10;
      strategy[0][3] = 4;
      strategy[0][4] = 16;
      strategy[1][0] = 7;
      strategy[1][4] = 8;
      strategy[2][0] = 11;
      strategy[2][2] = 18;
      strategy[2][4] = 12;
      strategy[3][0] = 5;
      strategy[3][1] = 17;
      strategy[3][4] = 6;
      strategy[4][0] = 13;
      strategy[4][1] = 1;
      strategy[4][2] = 9;
      strategy[4][3] = 3;
      strategy[4][4] = 15;
      ALIGN_STRATEGIES[ALIGN.BS] = strategy;
    }
  }

  /**
   * Helper function to flip a strategy matrix horizontally.
   * @param {Array} original the original strategy matrix
   * @return {Array} the flipped strategy matrix
   */
  function flipH(original)
  {
    var w = original.length;
    var h = original[0].length;
    var result = new Array(w);

    for (var i=0; i<h; ++i)
    {
      result[i] = new Array(h);
      for (var j=0; j<w; ++j)
        result[i][j] = original[i][w-j-1];
    }

    if (amx.config.debug.enable)
    {
      amx.log.debug("*** flipH ***\noriginal = " + matrixToString(original) +
        "\nresult = " + matrixToString(result));
    }

    return result;
  }

  /**
   * Helper function to flip a strategy matrix vertically.
   * @param {Array} original the original strategy matrix
   * @return {Array} the flipped strategy matrix
   */
  function flipV(original)
  {
    var w = original.length;
    var h = original[0].length;
    var result = new Array(w);

    for (var i=0; i<h; ++i)
    {
      result[i] = new Array(h);
      for (var j=0; j<w; ++j)
        result[i][j] = original[h-i-1][j];
    }

    if (amx.config.debug.enable)
    {
      amx.log.debug("*** flipV ***\noriginal = " + matrixToString(original) +
        "\nresult = " + matrixToString(result));
    }

    return result;
  }

  /**
   * Helper function to rotate a strategy matrix clockwise.
   * @param {Array} original the original strategy matrix
   * @return {Array} the rotated strategy matrix
   */
  function rotateCW(original)
  {
    var w = original.length;
    var h = original[0].length;
    var result = new Array(h);

    for (var i=0; i<h; ++i)
    {
      result[i] = new Array(w);
      for (var j=0; j<w; ++j)
        result[i][j] = original[w-j-1][i];
    }

    if (amx.config.debug.enable)
    {
      amx.log.debug("*** rotateCW ***\noriginal = " + matrixToString(original) +
        "\nresult = " + matrixToString(result));
    }

    return result;
  }

  /**
   * Helper function to rotate a strategy matrix counterclockwise.
   * @param {Array} original the original strategy matrix
   * @return {Array} the rotated strategy matrix
   */
  function rotateCCW(original)
  {
    var w = original.length;
    var h = original[0].length;
    var result = new Array(h);

    for (var i=0; i<h; ++i)
    {
      result[i] = new Array(w);
      for (var j=0; j<w; ++j)
        result[i][j] = original[j][h-i-1];
    }

    if (amx.config.debug.enable)
    {
      amx.log.debug("*** rotateCCW ***\noriginal = " + matrixToString(original) +
        "\nresult = " + matrixToString(result));
    }

    return result;
  }

  /**
   * Helper function to get a string representation of a matrix.
   * @param {Array} matrix the 2-dimensional matrix
   */
  function matrixToString(matrix)
  {
    var w = matrix.length;
    var h = matrix[0].length;
    var sb = [];
    sb.push("[\n");
    for (var i=0; i<w; ++i)
    {
      sb.push("[ ");
      for (var j=0; j<h; ++j)
      {
        if (j != 0)
          sb.push(", ");
        var value = matrix[i][j];
        if (value == null)
          value = "--";
        else if (value < 10)
          sb.push(" "); // indent a space for 1-digit values
        sb.push(value);
      }
      sb.push(" ]\n");
    }
    sb.push("]");
    return sb.join("");
  }

  /**
   * Helper function that converts a strategy matrix into a strategy list.
   * @param {Array} strategyMatrix the 5 by 5 sparse strategy matrix
   * @return {Array} the list of ALIGN values in attempt order for the strategy
   */
  function toStrategyList(strategyMatrix)
  {
    var list = [];
    for (var x=0; x<5; ++x)
    {
      for (var y=0; y<5; ++y)
      {
        var orderNumber = strategyMatrix[x][y];
        if (orderNumber != null)
        {
          var alignValue = ALIGN_MATRIX[x][y];
          list[orderNumber-1] = alignValue;
        }
      }
    }
    return list;
  }

  /**
   * Helper function to get the series of alignment fallback candidates needed
   * (in the order at which to attempt fitting a popup in that location) for the
   * given align value.
   * For example, if you want an overlap alignment, we should attempt all of the
   * possible overlap options before moving to any non-overlap options.
   * @param {String} desiredAlignValue the desired align value
   * @return {Array} array of align values to try
   */
  function getAlignFallbackCandidates(desiredAlignValue)
  {
    var candidateList = ALIGN_FALLBACK_CANDIDATES[desiredAlignValue];
    if (candidateList != null)
      return candidateList; // use cached list

    // --- ORDER STRATEGIES ---
    // - ALIGN.OMC always fits so that's *always* the last option
    // - There are 6 patterns (just rotated or flipped):
    //   (1) Overlap middle center = OMC
    //   (2) Overlap corner = OTS, OBS, OTE, OBE
    //   (3) Overlap edge = OTC, OBC, OMS, OME
    //   (4) Outer corner = CBS, CTS, CTE, CBE
    //   (5) Outer side = BC, TC, SM, EM
    //   (6) Outer side corner = BS, TS, TE, ST, ET, SB, EB, BE
    initStrategies();

    switch (desiredAlignValue)
    {
      case ALIGN.TS:
      case "before": // deprecated
        // Use strategy #6 (BS) but flip vertically
        candidateList = toStrategyList(flipV(ALIGN_STRATEGIES[ALIGN.BS]));
        break;
      case ALIGN.TC:
        // Use strategy #5 (BC) but flip vertically
        candidateList = toStrategyList(flipV(ALIGN_STRATEGIES[ALIGN.BC]));
        break;
      case ALIGN.TE:
        // Use strategy #6 (BS) but flip vertically and horizontally
        candidateList = toStrategyList(flipH(flipV(ALIGN_STRATEGIES[ALIGN.BS])));
        break;
      case ALIGN.ST:
        // Use strategy #6 (BS) but rotate clockwise
        candidateList = toStrategyList(rotateCW(ALIGN_STRATEGIES[ALIGN.BS]));
        break;
      case ALIGN.SM:
        // Use strategy #5 (BC) but rotate clockwise
        candidateList = toStrategyList(rotateCW(ALIGN_STRATEGIES[ALIGN.BC]));
        break;
      case ALIGN.SB:
        // Use strategy #6 (BS) but flip vertically and rotate counterclockwise
        candidateList = toStrategyList(rotateCCW(flipV(ALIGN_STRATEGIES[ALIGN.BS])));
        break;
      case ALIGN.ET:
        // Use strategy #6 (BS) but rotate clockwise and flip horizontally
        candidateList = toStrategyList(flipH(rotateCW(ALIGN_STRATEGIES[ALIGN.BS])));
        break;
      case ALIGN.EM:
        // Use strategy #5 (BC) but rotate counterclockwise
        candidateList = toStrategyList(rotateCCW(ALIGN_STRATEGIES[ALIGN.BC]));
        break;
      case ALIGN.EB:
        // Use strategy #6 (BS) but rotate counterclockwise
        candidateList = toStrategyList(rotateCCW(ALIGN_STRATEGIES[ALIGN.BS]));
        break;
      case ALIGN.BC:
        // Directly use strategy #5 (BC)
        candidateList = toStrategyList(ALIGN_STRATEGIES[ALIGN.BC]);
        break;
      case ALIGN.BE:
        // Use strategy #6 (BS) but flip horizontally
        candidateList = toStrategyList(flipH(ALIGN_STRATEGIES[ALIGN.BS]));
        break;
      case ALIGN.CTS:
        // Use strategy #4 (CBS) but flip vertically
        candidateList = toStrategyList(flipV(ALIGN_STRATEGIES[ALIGN.CBS]));
        break;
      case ALIGN.CTE:
        // Use strategy #4 (CBS) but flip vertically and horizontally
        candidateList = toStrategyList(flipH(flipV(ALIGN_STRATEGIES[ALIGN.CBS])));
        break;
      case ALIGN.CBS:
        // Directly use strategy #4 (CBS)
        candidateList = toStrategyList(ALIGN_STRATEGIES[ALIGN.CBS]);
        break;
      case ALIGN.CBE:
        // Use strategy #4 (CBS) but flip horizontally
        candidateList = toStrategyList(flipH(ALIGN_STRATEGIES[ALIGN.CBS]));
        break;
      case ALIGN.OTS:
      case "overlapTop": // deprecated
        // Directly use strategy #2 (OTS)
        candidateList = toStrategyList(ALIGN_STRATEGIES[ALIGN.OTS]);
        break;
      case ALIGN.OTC:
        // Directly use strategy #3 (OTC)
        candidateList = toStrategyList(ALIGN_STRATEGIES[ALIGN.OTC]);
        break;
      case ALIGN.OTE:
        // Use strategy #2 (OTS) but flip horizontally
        candidateList = toStrategyList(flipH(ALIGN_STRATEGIES[ALIGN.OTS]));
        break;
      case ALIGN.OMS:
        // Use strategy #3 (OTC) but rotate counterclockwise
        candidateList = toStrategyList(rotateCCW(ALIGN_STRATEGIES[ALIGN.OTC]));
        break;
      case ALIGN.OME:
        // Use strategy #3 (OTC) but rotate clockwise
        candidateList = toStrategyList(rotateCW(ALIGN_STRATEGIES[ALIGN.OTC]));
        break;
      case ALIGN.OBS:
      case "overlapBottom": // deprecated
        // Use strategy #2 (OTS) but flip vertically
        candidateList = toStrategyList(flipV(ALIGN_STRATEGIES[ALIGN.OTS]));
        break;
      case ALIGN.OBC:
        // Use strategy #3 (OTC) but flip vertically
        candidateList = toStrategyList(flipV(ALIGN_STRATEGIES[ALIGN.OTC]));
        break;
      case ALIGN.OBE:
        // Use strategy #2 (OTS) but flip horizontally and vertically
        candidateList = toStrategyList(flipV(flipH(ALIGN_STRATEGIES[ALIGN.OTS])));
        break;
      case ALIGN.OMC:
        // Directly use strategy #1 (OMC)
        candidateList = [ ALIGN.OMC ];
        break;
      default: // the default: ALIGN.BS or the deprecated "after"
        // Directly use strategy #6 (BS)
        candidateList = toStrategyList(ALIGN_STRATEGIES[ALIGN.BS]);
    }

    ALIGN_FALLBACK_CANDIDATES[desiredAlignValue] = candidateList;
    return candidateList;
  }

  /**
   * Helper function to align the popup based on the align value
   * and the alignId control's location.
   * @param {HTMLElement} viewElement the view element for this page
   * @param {HTMLElement} popupElement the current popup DOM node
   * @param {String} alignElementId the DOM ID of the element to align to
   * @param {String} alignValue the type of alignment to be done
   */
  function alignPopup(viewElement, popupElement, alignElementId, alignValue)
  {
    var alignCandidates = getAlignFallbackCandidates(alignValue);
    var alignCandidateCount = alignCandidates.length;

    // Loop through the candidates to find one that is successful:
    var result = null;
    for (var i=0; i<alignCandidateCount; ++i)
    {
      var alignValueToTry = alignCandidates[i];
      result = attemptAlignPopup(viewElement, popupElement, alignElementId, alignValueToTry);
      if (result != null)
        return result;
    }

    // We should never leave the for-loop without a success because the last
    // candidate should be ALIGN.OMC which will never result in a failure.
  }

  /**
   * Helper function to attempt an alignment of the popup based on the align value
   * and the alignId control's location.
   * @param {HTMLElement} viewElement the view element for this page
   * @param {HTMLElement} popupElement the current popup DOM node
   * @param {String} alignElementId the DOM ID of the element to align to
   * @param {String} alignValue the type of alignment to be done
   * @return {Boolean} whether the alignment was successful
   */
  function attemptAlignPopup(viewElement, popupElement, alignElementId, alignValue)
  {
    var isRtl = (document.documentElement.dir == "rtl");
    var popupAnchor = document.getElementById(popupElement.id + "_anchor");
    var anchorStyle = null;
    if (popupAnchor != null)
    {
      // Since we might make attempts at different alignments, we need to stash
      // what the last className we used so that we can safely remove it (don't
      // want to have conflicting classes applied).
      var lastAnchorClassName = popupAnchor.getAttribute("data-lastClass");
      popupAnchor.classList.remove(lastAnchorClassName);

      anchorStyle = popupAnchor.style;
      var anchorClassName = "";
      switch (alignValue)
      {
        case ALIGN.OTC:
        case ALIGN.BC:
        case ALIGN.OMC:
          anchorClassName = "amx-popup-anchor-top";
          break;
        case ALIGN.ST:
        case ALIGN.OTE:
        case ALIGN.CBS:
        case ALIGN.BE:
          anchorClassName = "amx-popup-anchor-top-end";
          break;
        case ALIGN.OMS:
        case ALIGN.EM:
          anchorClassName = "amx-popup-anchor-start";
          break;
        case ALIGN.SM:
        case ALIGN.OME:
          anchorClassName = "amx-popup-anchor-end";
          break;
        case ALIGN.TS:
        case ALIGN.CTE:
        case ALIGN.OBS:
        case ALIGN.EB:
          anchorClassName = "amx-popup-anchor-bottom-start";
          break;
        case ALIGN.TC:
        case ALIGN.OBC:
          anchorClassName = "amx-popup-anchor-bottom";
          break;
        case ALIGN.CTS:
        case ALIGN.TE:
        case ALIGN.SB:
        case ALIGN.OBE:
          anchorClassName = "amx-popup-anchor-bottom-end";
          break;
        default: // overlapTopStart, endTop, bottomStart, cornerBottomEnd
          anchorClassName = "amx-popup-anchor-top-start";
          break;
      }

      if (isRtl)
      {
        anchorClassName = anchorClassName.replace("start", "right");
        anchorClassName = anchorClassName.replace("end", "left");
      }
      else
      {
        anchorClassName = anchorClassName.replace("start", "left");
        anchorClassName = anchorClassName.replace("end", "right");
      }
      popupAnchor.setAttribute("data-lastClass", anchorClassName);
      popupAnchor.classList.add(anchorClassName);
    }

    // The alignElement is not guaranteed to stay around so we can't hold onto
    // a reference of it. Instead, we need to only hold onto an ID and if that
    // ID cannot be found, align to the viewElement instead.
    var alignElement = document.getElementById(alignElementId);
    if (alignElement == null)
      alignElement = viewElement;
    var alignCS = adf.mf.internal.amx.getComputedStyle(alignElement);
    var alignMarginT = parseInt(alignCS.marginTop, 10);
    var alignMarginB = parseInt(alignCS.marginBottom, 10);
    var alignMarginL = parseInt(alignCS.marginLeft, 10);
    var alignMarginR = parseInt(alignCS.marginRight, 10);
    var alignWidth = alignElement.offsetWidth + alignMarginL + alignMarginR;
    var alignHeight = alignElement.offsetHeight + alignMarginT + alignMarginB;

    var popupStyle = popupElement.style;
    var popupWidth = popupElement.offsetWidth;
    var popupHeight = popupElement.offsetHeight;

    // If the WebView is shown under the status bar, we want to reduce the
    // amount of space where popups can be shown so they do not appear
    // behind it:
    var topContentOffset =
      parseInt(document.querySelector("#bodyPage").getAttribute("data-topContentOffset"), 10);
    if (isNaN(topContentOffset))
      topContentOffset = 0;

    var viewWidth = viewElement.offsetWidth;
    var viewHeight = viewElement.offsetHeight - topContentOffset;

    var availableLeft =
      adf.mf.internal.amx.getElementLeft(alignElement) - alignMarginL;
    var availableTop =
      adf.mf.internal.amx.getElementTop(alignElement) - alignMarginT - topContentOffset;

    var anchorShifts = getAnchorShifts(popupAnchor); // array of L, R, T, B
    var anchorShiftL = anchorShifts[0];
    var anchorShiftR = anchorShifts[1];
    var anchorShiftT = anchorShifts[2];
    var anchorShiftB = anchorShifts[3];
    var anchorWidth = 0;
    var anchorHeight = 0;
    if (popupAnchor != null)
    {
      anchorWidth = popupAnchor.offsetWidth;
      anchorHeight = popupAnchor.offsetHeight;
    }

    var popupLeft = null;
    var popupRight = null;
    var popupTop = null;
    var popupBottom = null;

    var anchorLeft = null;
    var anchorRight = null;
    var anchorTop = null;
    var anchorBottom = null;

    var hideAnchor = false;
    var horizontallyFits = false;
    var verticallyFits = false;

    // Try out some horizontal positions:
    if (popupWidth > viewWidth)
    {
      // The popup extends off of both sides of the screen; clip it
      setPosition(popupStyle, "left", 0);
      setPosition(popupStyle, "right", 0);
      horizontallyFits = true;
      hideAnchor = true;
    }
    else
    {
      // Figure out the algorithm to use in terms of left and right instead of start and end:
      var alignValueH = "";
      if (isRtl)
      {
        switch (alignValue)
        {
          case ALIGN.CTS:
          case ALIGN.ST:
          case ALIGN.SM:
          case ALIGN.SB:
          case ALIGN.CBS:
            // Line up the left of the popup with the right of the alignment element:
            alignValueH = "popupLeftAlignRight";
            break;
          case ALIGN.TC:
          case ALIGN.OTC:
          case ALIGN.OMC:
          case ALIGN.OBC:
          case ALIGN.BC:
            // Line up the center of the popup with the center of the alignment element:
            alignValueH = "popupCenterAlignCenter";
            break;
          case ALIGN.TE:
          case ALIGN.OTE:
          case ALIGN.OME:
          case ALIGN.OBE:
          case ALIGN.BE:
            // Line up the left of the popup with the left of the alignment element:
            alignValueH = "popupLeftAlignLeft";
            break;
          case ALIGN.CTE:
          case ALIGN.ET:
          case ALIGN.EM:
          case ALIGN.EB:
          case ALIGN.CBE:
            // Line up the right of the popup with the left of the alignment element:
            alignValueH = "popupRightAlignLeft";
            break;
          default: // topStart, overlapTopStart, overlapMiddleStart, overlapBottomStart, bottomStart
            // Line up the right of the popup with the right of the alignment element:
            alignValueH = "popupRightAlignRight";
        }
      }
      else // ltr
      {
        switch (alignValue)
        {
          case ALIGN.CTS:
          case ALIGN.ST:
          case ALIGN.SM:
          case ALIGN.SB:
          case ALIGN.CBS:
            // Line up the right of the popup with the left of the alignment element:
            alignValueH = "popupRightAlignLeft";
            break;
          case ALIGN.TC:
          case ALIGN.OTC:
          case ALIGN.OMC:
          case ALIGN.OBC:
          case ALIGN.BC:
            // Line up the center of the popup with the center of the alignment element:
            alignValueH = "popupCenterAlignCenter";
            break;
          case ALIGN.TE:
          case ALIGN.OTE:
          case ALIGN.OME:
          case ALIGN.OBE:
          case ALIGN.BE:
            // Line up the right of the popup with the right of the alignment element:
            alignValueH = "popupRightAlignRight";
            break;
          case ALIGN.CTE:
          case ALIGN.ET:
          case ALIGN.EM:
          case ALIGN.EB:
          case ALIGN.CBE:
            // Line up the left of the popup with the right of the alignment element:
            alignValueH = "popupLeftAlignRight";
            break;
          default: // topStart, overlapTopStart, overlapMiddleStart, overlapBottomStart, bottomStart
            // Line up the left of the popup with the left of the alignment element:
            alignValueH = "popupLeftAlignLeft";
        }
      }

      // Do the work for the horizontal alignment:
      switch (alignValueH)
      {
        case "popupRightAlignLeft":
          // Line up the right of the popup with the left of the alignment element:
          var idealRight = viewWidth - availableLeft;
          var adjustedRight = snapPopup(idealRight, popupWidth + anchorShiftR, viewWidth);
          horizontallyFits = (idealRight == adjustedRight);
          popupRight = anchorShiftR + idealRight;
          anchorRight = idealRight;
          break;
        case "popupCenterAlignCenter":
          // Line up the center of the popup with the center of the alignment element:
          var halfAlignWidth = alignWidth/2;
          var halfPopupWidth = popupWidth/2;
          var idealLeft = availableLeft + halfAlignWidth - halfPopupWidth;
          var adjustedLeft = snapPopup(idealLeft, popupWidth, viewWidth);
          anchorLeft = idealLeft + halfPopupWidth; // due to negative margins, this is effectively a middle
          var halfAnchorWidth = anchorWidth/2;
          // We can allow some adjustment as long as the anchor fits within the popup (can't be too close to the corner)
          horizontallyFits = (idealLeft == adjustedLeft) ||
            (anchorLeft - halfAnchorWidth > adjustedLeft) &&
            (anchorLeft + halfAnchorWidth < adjustedLeft + popupWidth);
          popupLeft = adjustedLeft;
          break;
        case "popupRightAlignRight":
          // Line up the right of the popup with the right of the alignment element:
          var idealRight = adf.mf.internal.amx.getElementRight(alignElement);
          var adjustedRight = snapPopup(idealRight, popupWidth + anchorShiftR, viewWidth);
          horizontallyFits = (idealRight == adjustedRight);
          popupRight = anchorShiftR + idealRight;
          anchorRight = idealRight;
          break;
        case "popupLeftAlignRight":
          // Line up the left of the popup with the right of the alignment element:
          var idealLeft = viewWidth - adf.mf.internal.amx.getElementRight(alignElement);
          var adjustedLeft = snapPopup(idealLeft, popupWidth + anchorShiftL, viewWidth);
          horizontallyFits = (idealLeft == adjustedLeft);
          popupLeft = anchorShiftL + idealLeft;
          anchorLeft = idealLeft;
          break;
        default: // popupLeftAlignLeft
          // Line up the left of the popup with the left of the alignment element:
          var idealLeft = availableLeft;
          var adjustedLeft = snapPopup(idealLeft, popupWidth + anchorShiftL, viewWidth);
          horizontallyFits = (idealLeft == adjustedLeft);
          popupLeft = anchorShiftL + idealLeft;
          anchorLeft = idealLeft;
      }
    }
    if (ALIGN.OMC == alignValue)
    {
      // It always fits if alignValue is ALIGN.OMC
      horizontallyFits = true;
    }

    // Try out some vertical positions:
    if (popupHeight > viewHeight)
    {
      // The popup extends off of both the top and bottom of the screen; clip it
      setPosition(popupStyle, "top", topContentOffset);
      setPosition(popupStyle, "bottom", 0);
      verticallyFits = true;
      hideAnchor = true;
    }
    else
    {
      switch (alignValue)
      {
        case ALIGN.CTS:
        case ALIGN.TS:
        case ALIGN.TC:
        case ALIGN.TE:
        case ALIGN.CTE:
          // Line up the bottom of the popup with the top of the alignment element:
          var idealBottom = viewHeight - availableTop;
          var adjustedBottom = snapPopup(idealBottom, popupHeight + anchorShiftB, viewHeight);
          verticallyFits = (idealBottom == adjustedBottom);
          popupBottom = anchorShiftB + idealBottom;
          anchorBottom = idealBottom;
          break;
        case ALIGN.ST:
        case ALIGN.OTS:
        case ALIGN.OTC:
        case ALIGN.OTE:
        case ALIGN.ET:
          // Line up the top of the popup with the top of the alignment element:
          var idealTop = availableTop;
          var adjustedTop = snapPopup(idealTop, popupHeight + anchorShiftT, viewHeight);
          verticallyFits = (idealTop == adjustedTop);
          popupTop = anchorShiftT + idealTop + topContentOffset;
          anchorTop = idealTop + topContentOffset;
          break;
        case ALIGN.SM:
        case ALIGN.OMS:
        case ALIGN.OME:
        case ALIGN.EM:
          // Line up the middle of the popup with the middle of the alignment element:
          var halfAlignHeight = alignHeight/2;
          var halfPopupHeight = popupHeight/2;
          var idealTop = availableTop + halfAlignHeight - halfPopupHeight;
          var adjustedTop = snapPopup(idealTop, popupHeight, viewHeight);
          anchorTop = idealTop + halfPopupHeight; // due to negative margins, this is effectively a middle
          var halfAnchorHeight = anchorHeight/2;
          // We can allow some adjustment as long as the anchor fits within the popup (can't be too close to the corner)
          verticallyFits = (idealTop == adjustedTop) ||
            (anchorTop - halfAnchorHeight > adjustedTop) &&
            (anchorTop + halfAnchorHeight < adjustedTop + popupHeight);
          anchorTop += topContentOffset;
          popupTop = adjustedTop + topContentOffset;
          break;
        case ALIGN.SB:
        case ALIGN.OBS:
        case ALIGN.OBC:
        case ALIGN.OBE:
        case ALIGN.EB:
          // Line up the bottom of the popup with the bottom of the alignment element:
          var idealBottom = viewHeight - (availableTop + alignHeight);
          var adjustedBottom = snapPopup(idealBottom, popupHeight + anchorShiftB, viewHeight);
          verticallyFits = (idealBottom == adjustedBottom);
          popupBottom = anchorShiftB + idealBottom;
          anchorBottom = idealBottom;
          break;
        case ALIGN.OMC:
          // Line up the middle of the popup with the middle of the alignment element and put the anchor above the popup:
          var halfAlignHeight = alignHeight/2;
          var halfPopupHeight = popupHeight/2;
          var idealTop = availableTop + halfAlignHeight - halfPopupHeight;
          var adjustedTop = snapPopup(idealTop, popupHeight, viewHeight);
          verticallyFits = true; // It always fits if alignValue is ALIGN.OMC
          popupTop = adjustedTop + topContentOffset;
          anchorTop = adjustedTop - anchorShiftT + topContentOffset;
          if (anchorTop < availableTop + topContentOffset)
            hideAnchor = true;
          break;
        default: // cornerBottomStart, bottomStart, bottomCenter, bottomEnd, cornerBottomEnd
          // Line up the top of the popup with the bottom of the alignment element:
          var idealTop = availableTop + alignHeight;
          var adjustedTop = snapPopup(idealTop, popupHeight + anchorShiftT, viewHeight);
          verticallyFits = (idealTop == adjustedTop);
          popupTop = anchorShiftT + idealTop + topContentOffset;
          anchorTop = idealTop + topContentOffset;
      }
    }

    // TODO support some way to make popups not touch the edge of the viewport, e.g. 8px buffer all around

    if (horizontallyFits && verticallyFits)
    {
      var outcome = {
        right: null,
        left: null,
        top: null,
        bottom: null,
        anchor_right: null,
        anchor_left: null,
        anchor_top: null,
        anchor_bottom: null,
        hasAnchor: anchorStyle != null ? true : false
      };

      if (hideAnchor && anchorStyle != null)
      {
        outcome.hasAnchor = false;
      }
      if (popupLeft != null)
      {
        outcome.left = popupLeft;
        if (anchorStyle != null)
        {
          outcome.anchor_left = anchorLeft;
        }
      }
      if (popupRight != null)
      {
        outcome.right = popupRight;
        if (anchorStyle != null)
        {
          outcome.anchor_right = anchorRight;
        }
      }
      if (popupTop != null)
      {
        outcome.top = popupTop;
        if (anchorStyle != null)
        {
          outcome.anchor_top = anchorTop;
        }
      }
      if (popupBottom != null)
      {
        outcome.bottom = popupBottom;
        if (anchorStyle != null)
        {
          outcome.anchor_bottom = anchorBottom;
        }
      }
      return outcome;
    }
    return null;
  }

  /**
   * Get a position value such that the popup is adjusted to fit within the viewport.
   * @param {Number} popupStart the ideal popup location if truncation is not an issue
   * @param {popupSize} the size of the popup in the associated orientation
   * @param {viewSize} the size of the view in the associated orientation
   * @return {Number} the possibly adjusted popup position
   */
  function snapPopup(popupStart, popupSize, viewSize)
  {
    if (popupStart < 0)
    {
      //the popup extends off the top/left of the screen; move it
      return 0;
    }
    else if (popupStart + popupSize > viewSize)
    {
      return viewSize - popupSize;
    }
    return popupStart;
  }

  function findNode(callback)
  {
    var foundAmxNode = null;
    var rootNode = adf.mf.api.amx.getPageRootNode();
    rootNode.visit(
      new adf.mf.api.amx.VisitContext(),
      function (visitContext, amxNode)
      {
        if (callback(amxNode))
        {
          foundAmxNode = amxNode;
          return adf.mf.api.amx.VisitResult["COMPLETE"];
        }

        return adf.mf.api.amx.VisitResult["ACCEPT"];
      });

    return foundAmxNode;
  }

  function findNodeByIdAttribute(nodeAttributeId)
  {
    return findNode(
      function (amxNode)
      {
        // TODO: this should be using a stamp ID instead of the node's ID attribute
        return nodeAttributeId == amxNode.getAttribute("id");
      });
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
  }

// TODO finish the migration from "amx.*" to "adf.mf.api.amx.*" and "adf.mf.internal.amx.*"
  amx.processShowPopupBehavior = function(amxNode, showPopupBehaviorTagInstance)
  {
    // TODO these should be relative IDs!
    var popupId    = showPopupBehaviorTagInstance.getAttribute("popupId");
    var alignId    = showPopupBehaviorTagInstance.getAttribute("alignId");
    var align      = showPopupBehaviorTagInstance.getAttribute("align");
    var decoration = showPopupBehaviorTagInstance.getAttribute("decoration");

    // Find the popup node in the hierarchy with the provided ID. First use the AMX node
    // API. If not found, use the deprecated API of finding any AMX node in the hierarchy with
    // the given popup ID
    var popupAmxNode = amxNode.__findPopup(popupId);
    if (popupAmxNode == null && adf.mf.internal.amx.disableDeprecatedPopupFind != true)
    {
      popupAmxNode = findNodeByIdAttribute(popupId);
    }

    if (popupAmxNode == null)
    {
      // TODO: log error
      return;
    }

    var alignAmxNode = alignId == null ? null : amxNode.findRelativeAmxNode(alignId, false);

    // we set the _renderPopup to force full rendering
    var showPopupAttributes = {
      "popupId": popupId,
      "alignAmxNode": alignAmxNode,
      "align": align,
      "decoration": decoration
    };

    popupAmxNode.setAttributeResolvedValue("_showPopupAttributes", showPopupAttributes);
    popupAmxNode.setAttributeResolvedValue("_renderPopup", true);

    var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
    args.setAffectedAttribute(popupAmxNode, "_showPopupAttributes");
    args.setAffectedAttribute(popupAmxNode, "_renderPopup");
    adf.mf.api.amx.markNodeForUpdate(args);
  };

  function closePopup(popupElement, skipUpdates)
  {
    if (popupElement == null)
      return;
    var screenId = popupElement.getAttribute("data-screenId");
    var bodyPageViews = document.getElementById("bodyPageViews");
    var popupTransparentScreen = document.getElementById(screenId);

    var popupAmxNode = adf.mf.internal.amx._getNonPrimitiveElementData(popupElement, "amxNode");
    popupAmxNode.setAttributeResolvedValue("_renderPopup", false);

    if (!skipUpdates)
    {
      var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
      args.setAffectedAttribute(popupAmxNode, "_renderPopup");
      adf.mf.api.amx.markNodeForUpdate(args);
    }

    adf.mf.api.amx.removeBubbleEventListener(window, "resize", handleResize, popupElement.id);


    // Get all the input & select elements on the page
    var pageInputElems = document.getElementsByTagName("input");
    var pageSelectElems = document.getElementsByTagName("select");

    _calcTabForClosePopup(pageInputElems);
    _calcTabForClosePopup(pageSelectElems);

    adf.mf.api.amx.removeDomNode(popupTransparentScreen);
    var popupContainer = null;
    var popupAnchor = null;
    var popupWasClosed = false;
    if (popupElement != null)
    {
      var popupElementId = popupElement.id;
      popupContainer = document.getElementById(popupElementId + "_cont");
      popupAnchor = document.getElementById(popupElementId + "_anchor");

      if (popupElement.parentNode != null)
      {
        popupWasClosed = true;
      }
    }
    adf.mf.api.amx.removeDomNode(popupAnchor);
    adf.mf.api.amx.removeDomNode(popupElement);
    adf.mf.api.amx.removeDomNode(popupContainer);

    if (popupWasClosed && getShownPopupElements().length == 0)
    {
      // No more popups are shown.
      // The view container is no longer hidden from screen readers:
      var firstViewContainer = _getChildrenByClassNames(bodyPageViews, ["amx-view-container"])[0];
      firstViewContainer.setAttribute("aria-hidden", "false"); // Note: toggling this doesn't work on iOS 5 but does in iOS 6
    }
  }

  /**
   * Processes the closePopupBehavior event.
   * @param {adf.mf.api.amx.AmxNode} amxNode the amxNode of the component that triggered the event
   * @param {adf.mf.internal.amx.AmxTagInstance} closePopupBehaviorTagInstance the AMX tag instance for the
   *        closePopupBehavior tag (to access the popupId to close)
   */
  amx.processClosePopupBehavior = function(amxNode, closePopupBehaviorTagInstance)
  {
    var popupIdToClose = closePopupBehaviorTagInstance.getAttribute("popupId");

    // Find the popup node in the hierarchy with the provided ID. First use the AMX node
    // API. If not found, use the deprecated API of finding any AMX node in the hierarchy with
    // the given popup ID
    var popupAmxNode = amxNode.__findPopup(popupIdToClose);

    if (popupAmxNode == null && adf.mf.internal.amx.disableDeprecatedPopupFind != true)
    {
      popupAmxNode = findNodeByIdAttribute(popupIdToClose);
    }

    var popupElement = popupAmxNode == null ? null :
      document.getElementById(popupAmxNode.getId() + "::popupElement");

    if (popupElement == null &&
      (popupIdToClose == null || popupIdToClose == ""))
    {
      // We could not find it so use the one nearest the component that triggered the event:
      var triggerNodeId = amxNode.getId();
      // TODO this needs to be promoted to a formal warning; do not use amx.log
      amx.log.debug(
        "No element with the closePopupBehavior popupId found: " +
        popupIdToClose +
        " so using the triggerNodeId=" +
        triggerNodeId +
        " instead");

      var popupCandidate = document.getElementById(triggerNodeId);
      while (popupCandidate != null)
      {
        if (popupCandidate.classList.contains("amx-popup"))
        {
          popupElement = popupCandidate;
          break;
        }
        popupCandidate = popupCandidate.parentNode;
      }
    }

    if (popupElement == null)
    {
      // TODO this either needs to be removed or needs to be promoted to a formal debug message; do not use amx.log
      amx.log.debug("No nearest popup found for closing");
    }
    else
    {
      closePopup(popupElement);
    }
  };

  var popup = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "popup");

  popup.prototype.createChildrenNodes = function(amxNode)
  {
    // We only want to generate the children amxNode objects
    // that are inside of a popup if the popup is being shown:
    if (amxNode.getAttribute("_renderPopup"))
    {
      amxNode.createStampedChildren(null, null, null);
    }
    return true;
  };

  popup.prototype.attributeChangeResult = function(
    amxNode,
    attributeName,
    attributeChanges)
  {
    switch (attributeName)
    {
      case "_renderPopup":
        // Create the children if they have not already been created in a previous
        // event.
        if (amxNode.getAttribute("_renderPopup") && amxNode.getChildren().length == 0)
        {
          // If now shown, create the children amxNodes:
          amxNode.createStampedChildren(null, null, null);
        }

        return amxNode.getAttribute("_renderPopup") ?
          adf.mf.api.amx.AmxNodeChangeResult["REFRESH"] :
          adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];

      case "_showPopupAttributes":
        return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];

      default:
        return popup.superclass.attributeChangeResult.call(this,
          amxNode, attributeName, attributeChanges);
    }
  };

  popup.prototype.render = function(amxNode)
  {
    var holderElement = document.createElement("div");
    holderElement.className = "popup-holder";

    try
    {
      var amxNodeId = amxNode.getId();
      var popupElementId = amxNodeId + "::popupElement";
      var popupElement = document.getElementById(popupElementId);
      if (popupElement != null)
      {
        // A popup is already shown:
        if (amxNode.getAttribute("_renderPopup"))
        {
          adf.mf.api.amx.removeBubbleEventListener(window, "resize", handleResize, popupElementId);

          // We need to clear out the children, re-add them, and reposition if applicable
          adf.mf.api.amx.removeDomNode(popupElement);
          var popupContainer = document.getElementById(popupElementId + "_cont");
          var popupAnchor = document.getElementById(popupElementId + "_anchor");
          adf.mf.api.amx.removeDomNode(popupAnchor);
          adf.mf.api.amx.removeDomNode(popupContainer);
          this._showPopup(amxNode, false);
        }
        else
        {
          // We need to remove the existing popup:
          closePopup(popupElement, true);
        }
      }
    }
    catch (problem)
    {
      console.log(problem);
    }

    return holderElement;
  };

  popup.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    var styleClassChanged = attributeChanges.hasChanged("styleClass");
    var inlineStyleChanged = attributeChanges.hasChanged("inlineStyle");
    var amxNodeId = amxNode.getId();
    var popupElementId = amxNodeId + "::popupElement";
    var popupElement = document.getElementById(popupElementId);
    var wasOnlyStyleChanges = false;

    if (styleClassChanged || inlineStyleChanged)
    {
      if (styleClassChanged && inlineStyleChanged)
      {
        if (attributeChanges.getSize() == 2) // both changed
          wasOnlyStyleChanges = true;
      }
      else if (attributeChanges.getSize() == 1) // only 1 changed
      {
        wasOnlyStyleChanges = true;
      }
    }

    if (!wasOnlyStyleChanges)
    {
      if (popupElement != null)
      {
        // There is an old popup that we need to clean up:
        closePopup(popupElement, true);
      }
      this._showPopup(amxNode, true);
    }

    // Make sure inlineStyle and styleClass get updated
    popup.superclass.refresh.call(this,
      amxNode, attributeChanges, descendentChanges);

    if (wasOnlyStyleChanges)
    {
      var popupHolder = document.getElementById(amxNodeId);

      if (popupHolder != null && popupElement != null)
      {
        // Copy over the styleClass from the root element:
        if (styleClassChanged)
          popupElement.className = popupHolder.className;

        // Re-apply the updated CSS text (aka inlineStyle):
        var baseCssText = popupHolder.style.cssText;
        popupElement.setAttribute("data-baseCssText", baseCssText);
      }

      // resize the popup
      _handlePopupResize(popupElementId);
    }
  };

  popup.prototype._showPopup = function(amxNode, completelyNewPopup)
  {
    var showPopupAttributes = amxNode.getAttribute("_showPopupAttributes");
    var alignAmxNode = showPopupAttributes["alignAmxNode"];
    var align = showPopupAttributes["align"];
    var decoration = showPopupAttributes["decoration"];

    var bodyPage = document.getElementById("bodyPage");
    var bodyPageViews = document.getElementById("bodyPageViews");
    var firstViewContainer = _getChildrenByClassNames(bodyPageViews, ["amx-view-container"])[0];
    var viewElement = _getChildrenByClassNames(firstViewContainer, ["amx-view"])[0];

    var amxNodeId = amxNode.getId();
    var popupHolder = document.getElementById(amxNodeId);
    var popupElement = document.createElement("div");

    adf.mf.internal.amx._setNonPrimitiveElementData(popupElement, "amxNode", amxNode);

    var popupElementId = amxNodeId + "::popupElement";

    popupElement.setAttribute("id", popupElementId);
    var baseCssText = popupHolder.style.cssText;
    popupElement.style.cssText = baseCssText;
    popupElement.setAttribute("data-baseCssText", baseCssText);
    popupElement.className = popupHolder.className;
    popupElement.classList.remove("popup-holder");

    var popupContainer = document.createElement("div");
    popupContainer.setAttribute("id", popupElementId + "_cont");
    popupContainer.className = "amx-popup-animate-container";

    var popupAnchor = null;
    if ("anchor" == decoration)
    {
      popupAnchor = document.createElement("div");
      popupAnchor.setAttribute("id", popupElementId + "_anchor");
      popupAnchor.className = "amx-popup-anchor";
    }

    // Adding WAI-ARIA Attribute for the popup component
    popupElement.setAttribute("role", "dialog");

    // make sure this responds to dragging for scrolling purposes
    adf.mf.api.amx.enableScrolling(popupElement);

   var descendants = amxNode.renderDescendants();

   // Get all the input & select elements on the page
   var pageInputElems = document.getElementsByTagName("input");
   var pageSelectElems = document.getElementsByTagName("select");

   _calcTabForShowPopup(pageInputElems);
   _calcTabForShowPopup(pageSelectElems);

   // Iterate thru the elements that goes inside of the popup and append them to the popupElement
   for (var i=0, size = descendants.length; i<size; ++i)
   {
     // Get all the input & select elements inside of the popup when shown
     var popupInputElems = descendants[i].getElementsByTagName("input");
     var noOfPopupInputElems = popupInputElems.length;
     var popupSelectElems = descendants[i].getElementsByTagName("select");
     var noOfPopupSelectElems = popupSelectElems.length;

     popupElement.appendChild(descendants[i]);
   }

    if (alignAmxNode == null)
    {
      // if there isn't an AMX node to align to, just set align to the current view
      alignAmxNode = findNode(
        function (amxNode)
        {
          var tag = amxNode.getTag();
          return (tag.getName() == "view" &&
            tag.getNamespace() == adf.mf.api.amx.AmxTag.NAMESPACE_AMX);
        });
    }

    // hide the popupElement during positioning (since we have to add it first)
    // Note: z-index did not work here.
    var popupContainerStyle = popupContainer.style;
    popupContainerStyle.opacity = "0";

    var popupTransparentScreen = null;
    if (completelyNewPopup)
    {
      var preventDefaultEventFunc = function(event, dragExtra)
      {
        if (dragExtra)
        {
          // Declare this element as the one that is currently handling drag events:
          var element = this;
          dragExtra.requestDragLock(element, true, true);
        }
        // If we don't eat the event then tapping the glass pane could also trigger
        // taps on things like inputText or selectOneChoice
        event.preventDefault();
        event.stopPropagation();
      };

      // append the screen for this popup (each popup has its own)
      popupTransparentScreen = document.createElement("div");

      // if backgroundDimming attribute is defined and has value "off" than
      // clear opacity using CSS
      if (amxNode.isAttributeDefined("backgroundDimming") && amxNode.getAttribute("backgroundDimming") === "off")
      {
        popupTransparentScreen.style.opacity = "0";
      }

      var autoDismiss = amxNode.getAttribute("autoDismiss");
      if (adf.mf.api.amx.isValueTrue(autoDismiss))
      {
        // Make the auto-dismiss screen accessible
        popupTransparentScreen.setAttribute("role", "button");
        popupTransparentScreen.setAttribute("tabindex", "0");
        var dismissButtonLabel =
          adf.mf.resource.getInfoString("AMXInfoBundle","amx_popup_DISMISS_BUTTON_LABEL");
        popupTransparentScreen.setAttribute("aria-label", dismissButtonLabel);
      }
      popupTransparentScreen.className = "popupTransparentScreen";
      var screenId = amx.uuid();
      amxNode.setAttributeResolvedValue("_screenId", screenId);
      popupTransparentScreen.id = screenId;

      // Since we can have multiple popups open at the same time, we need to
      // manage the z-index of each popup.
      // Note that the z-index of the popupContainer matches the z-index of the
      // popupElement because the popupContainer is a temporary wrapper for
      // animation purposes so the popupElement and popupAnchor can animate
      // together as one unit.
      // In other words, each popup reserves 3 z-index slots.
      var startingZIndex = 999;
      var shownPopups = getShownPopupElements(); // the newest first is first
      if (shownPopups.length > 0)
      {
        // Start at 2 past the most recent popup (1 for its anchor, and another
        // to be beyond that value).
        var mostRecentPopupElement = shownPopups[0];
        startingZIndex = parseInt(mostRecentPopupElement.style.zIndex, 10) + 2;
      }
      popupTransparentScreen.style.zIndex = startingZIndex;
      popupContainer.style.zIndex = startingZIndex + 1;
      popupElement.style.zIndex = startingZIndex + 1;
      if (popupAnchor != null)
        popupAnchor.style.zIndex = startingZIndex + 2;

      // Remember the z-index in case the popup is re-rendered
      amxNode.setAttributeResolvedValue("_zIndex", startingZIndex + 1);

      // The view container is now hidden from screen readers:
      firstViewContainer.setAttribute("aria-hidden", "true"); // Note: toggling this doesn't work on iOS 5 but does in iOS 6

      bodyPageViews.appendChild(popupTransparentScreen);
      popupElement.setAttribute("data-screenId", screenId);

      var clickHandler = function(event)
      {
        preventDefaultEventFunc(event);
        // make the screen perform autodismiss if needed
        var autoDismiss = amxNode.getAttribute("autoDismiss");
        if (adf.mf.api.amx.isValueTrue(autoDismiss))
        {
          closePopup(document.getElementById(popupElementId));
        }
      };

      // make sure the transparent screen blocks events from being sent to controls on the amx page under the popup
      adf.mf.api.amx.addBubbleEventListener(popupTransparentScreen, "tap", clickHandler);
      adf.mf.api.amx.addBubbleEventListener(popupTransparentScreen, "click", preventDefaultEventFunc);
      adf.mf.api.amx.addBubbleEventListener(popupTransparentScreen, "mouseup", preventDefaultEventFunc);
      adf.mf.api.amx.addBubbleEventListener(popupTransparentScreen, "mousemove", preventDefaultEventFunc);
      adf.mf.api.amx.addBubbleEventListener(popupTransparentScreen, "mousedown", preventDefaultEventFunc);
      adf.mf.api.amx.addBubbleEventListener(popupTransparentScreen, "touchstart", preventDefaultEventFunc);
      adf.mf.api.amx.addBubbleEventListener(popupTransparentScreen, "touchmove", preventDefaultEventFunc);
      adf.mf.api.amx.addBubbleEventListener(popupTransparentScreen, "touchend", preventDefaultEventFunc);
      adf.mf.api.amx.addDragListener(popupTransparentScreen,
        {
          start: preventDefaultEventFunc,
          drag: preventDefaultEventFunc,
          end: preventDefaultEventFunc
        });
    }
    else
    {
      popupElement.setAttribute("data-screenId", amxNode.getAttribute("_screenId"));

      // Use the z-index from when the popup was first shown
      var zIndex = amxNode.getAttribute("_zIndex");
      popupContainer.style.zIndex = zIndex;
      popupElement.style.zIndex = zIndex;
    }

    // need to append first, cause we need to get the popupElement's height;
    popupContainer.appendChild(popupElement);
    if (popupAnchor != null)
      popupContainer.appendChild(popupAnchor);
    bodyPageViews.appendChild(popupContainer);

    var alignElementId = alignAmxNode.getId();
    var startPositions = alignPopup(viewElement, popupElement, alignElementId, align);

    if (startPositions.hasAnchor === false && popupAnchor)
    {
      popupAnchor.style.display = "none";
    }

    var animation = amxNode.getAttribute("animation");

    var props = ["top", "right", "left", "bottom"];
    if (animation == "zoom")
    {
      // set proper position for the container
      // since the animation is performed on the container itself
      // and we need to set content size to ensure
      // scaling from the proper start point
      popupElement.style.position = "relative";
      props.forEach(function(prop)
      {
        // reset default position properties to auto to prevent stretching
        popupContainer.style[prop] = "auto";
        if (startPositions[prop] != null)
        {
          // set position of the container
          popupContainer.style[prop] = startPositions[prop] + "px";
          // in case of the anchor set position to element
          if (popupAnchor && startPositions["anchor_" + prop] != null)
          {
            popupElement.style[prop] = "0px";
          }
        }
      });
    }
    else
    {
      // set proper position for the popup element and
      // its anchor
      // this is default case
      props.forEach(function(prop)
      {
        // iterate over array of possible properties [left, right, bottom, top] and
        // try to set it as a style property based on the calculated startPositions
        if (startPositions[prop] != null)
        {
          // set position of the element
          popupElement.style[prop] = startPositions[prop] + "px";
          // in case of the anchor set position to anchor
          if (popupAnchor && startPositions["anchor_" + prop] != null)
          {
            popupAnchor.style[prop] = startPositions["anchor_" + prop] + "px";
          }
        }
      });
    }
    // now we remove the opacity (not that we set the "" to remove the css property rather to set one
    // in case it is part of a transition)
    popupContainerStyle.opacity = "";

    if (completelyNewPopup)
    {
      var hasTransition = true;
      var documentElement = document.documentElement;
      var isRtl = (documentElement.dir == "rtl");
      var translateDistance = 300;

      if (animation == "slideUp" || animation == "slideDown")
      {
        translateDistance = Math.max(300, documentElement.clientHeight);
      }
      else
      {
        translateDistance = Math.max(300, documentElement.clientWidth);
      }

      var transformValue = null;
      if (animation == "zoom")
      {
        var transX = 0;
        var transY = 0;
        // transformation should be set only in case that the popup is not in the middle
        // since in this case we want simple scale
        if (startPositions != null && align !== ALIGN.OMC)
        {
          // origin of the transformation is calculated from the pointing anchor if any and from the
          // initial position of the popup element

          if (startPositions.top != null)
          {
            transY = 0 - popupElement.offsetHeight / 2 + (startPositions["anchor_top"] ? startPositions["anchor_top"] - startPositions.top : 0);
          }
          else if (startPositions.bottom != null)
          {
            transY = popupElement.offsetHeight / 2 - (startPositions["anchor_bottom"] ? startPositions["anchor_bottom"] - startPositions.bottom : 0);
          }

          if (startPositions.left != null)
          {
            transX = 0 - popupElement.offsetWidth / 2 + (startPositions["anchor_left"] ? startPositions["anchor_left"] - startPositions.left : 0);
          }
          else if (startPositions.right != null)
          {
            transX = popupElement.offsetWidth / 2 - (startPositions["anchor_right"] ? startPositions["anchor_right"] - startPositions.right : 0);
          }
        }
        // set translate to point origin from which the popup will be zoomed
        // scale has to be at the end of the string to prevent unwanted
        // scale of the translate X and Y coordinates
        transformValue = "translate(" + transX + "px," + transY + "px) scale(0)";
      }
      else if (animation == "slideUp")
      {
        transformValue = "translate(0px,"+translateDistance+"px)";
      }
      else if (animation == "slideDown")
      {
        transformValue = "translate(0px,-"+translateDistance+"px)";
      }
      else if (animation == "slideStart")
      {
        if (isRtl)
          transformValue = "translate(-"+translateDistance+"px,0px)";
        else
          transformValue = "translate("+translateDistance+"px,0px)";
      }
      else if (animation == "slideEnd")
      {
        if (isRtl)
          transformValue = "translate("+translateDistance+"px,0px)";
        else
          transformValue = "translate(-"+translateDistance+"px,0px)";
      }
      else if (animation == "slideLeft")
      {
        transformValue = "translate("+translateDistance+"px,0px)";
      }
      else if (animation == "slideRight")
      {
        transformValue = "translate(-"+translateDistance+"px,0px)";
      }
      else
      {
        hasTransition = false;
      }

      var agentType = adf.mf.internal.amx.agent["type"];
      if (transformValue != null)
      {
        if (agentType == "iOS" || agentType == "Android" || agentType == "webkit")
          popupContainerStyle.webkitTransform = transformValue;
        else
          popupContainerStyle.transform = transformValue;
      }

      if (hasTransition)
      {
        setTimeout(function()
        {
          popupContainer.classList.add("transitioning");
          if (agentType == "iOS" || agentType == "Android" || agentType == "webkit")
            popupContainerStyle.webkitTransform = "translate(0px,0px) scale(1)";
          else
            popupContainerStyle.transform = "translate(0px,0px) scale(1)";
          adf.mf.api.amx.addBubbleEventListener(
            popupContainer,
            adf.mf.internal.amx.agent.getTransitionEndEventName(),
            function()
            {
              _removeTempContainer(popupElement, popupAnchor, popupContainer);
              if (animation == "zoom")
              {
                // set absolute position if not already set
                popupElement.style.position = "absolute";
                // set proper position for the popup element and
                // its anchor
                props.forEach(function(prop)
                {
                  // iterate over array of possible properties [left, right, bottom, top] and
                  // try to set it as a style property based on the calculated startPositions
                  if (startPositions[prop] != null)
                  {
                    popupElement.style[prop] = startPositions[prop] + "px";
                    if (popupAnchor && startPositions["anchor_" + prop] != null)
                    {
                      popupAnchor.style[prop] = startPositions["anchor_" + prop] + "px";
                    }
                  }
                });
              }
            });
        },
        0);
      }
      else // no transition
      {
        _removeTempContainer(popupElement, popupAnchor, popupContainer);
      }
    }
    else // redrawing an already-shown popup
    {
      _removeTempContainer(popupElement, popupAnchor, popupContainer);
    }

    // Data needed for handleResize:
    popupElement.setAttribute("data-alignElementId", alignElementId);
    popupElement.setAttribute("data-align", align);

    adf.mf.api.amx.addBubbleEventListener(window, "resize", handleResize, popupElementId);
  }; // end of _showPopup

  function _removeTempContainer(
    popupElement,
    popupAnchor,
    popupContainer)
  {
    // Remove the popupContainer and reparent the popup and anchor
    // to the bodyPageViews since we are done positioning things:
    var bodyPageViews = document.getElementById("bodyPageViews");
    bodyPageViews.appendChild(popupElement);
    if (popupAnchor != null)
      bodyPageViews.appendChild(popupAnchor);
    adf.mf.api.amx.removeDomNode(popupContainer);
  };

  /**
   * Gets an array of the currently-shown popups, ordered newest first.
   * @return {Array} non-null array of popup elements
   */
  function getShownPopupElements()
  {
    // We only care about popups that are shown so we need to do some filtering:
    var popups = new Array();
    var possiblePopups = document.getElementsByClassName("amx-popup");
    var bodyPageViews = document.getElementById("bodyPageViews");
    var length = possiblePopups.length;
    for (var i=length-1; i>=0; --i) // get the newest first
    {
      var possiblePopup = possiblePopups[i];
      if (possiblePopup.parentNode == bodyPageViews)
        popups.push(possiblePopup);
    }
    return popups;
  }

  /**
   * Close all popups currently showing on the screen.
   */
  adf.mf.internal.amx.closePopups = function()
  {
    // We only care about popups that are shown so we need to do some filtering:
    var popupsToHide = getShownPopupElements(); // close the newest first
    var length = popupsToHide.length;
    for (var i=0; i<length; ++i)
    {
      closePopup(popupsToHide[i]);
    }
  };

  /**
   * Calculate TabIndex for page <input> and <select> elements while opening a popupup window.
   */
  function _calcTabForShowPopup(pageElems)
  {
    var noOfPageElems = pageElems.length;
    // Iterate thru the page elements
    for (var k=0; k < noOfPageElems; k++)
    {
      // use data-popuplevel to cumulate the level of element.
      // If the page elements has any data-popuplevel, then data-popuplevel--;
      // else set data-popuplevel to "0", store the current tabIndex using data-oldTabIndex.
      var elem = pageElems[k];
      var oldTabIndex = elem.tabIndex;
      var prePopupLevel = elem.getAttribute("data-popupLevel");

      if (prePopupLevel == null)
      {
        elem.setAttribute("data-popupLevel", "0");
        elem.setAttribute("data-oldTabIndex", oldTabIndex);
      }
      else
      {
        var updatePopupLevel = Number(prePopupLevel)-1;
        elem.setAttribute("data-popupLevel", updatePopupLevel);
      }

      // set tabindex to "-1"
      elem.setAttribute("tabindex", "-1");
    }
  }

  /**
   * Calculate TabIndex for page <input> and <select> elements while closing a popupup window.
   */
  function _calcTabForClosePopup(pageElems)
  {
    var noOfPageElems = pageElems.length;

    // Iterate thru page elements and restore their tabindex default value if popupLevel is 0;
    for (var j=0; j < noOfPageElems; j++)
    {
      // use data-popupLevel to cumulate the level of element.
      var elem = pageElems[j];
      var prePopupLevel = elem.getAttribute("data-popupLevel")
      if (prePopupLevel != null)
      {
        //if prePopupLevel is "0", set current tabindex to value of data-oldTabIndex
        //and set "data-popupLevel" to null;
        //if prePopupLevel is not "0", data-popupLevel++.
        if(prePopupLevel == "0")
        {
          var oldTabIndex = elem.getAttribute("data-oldTabIndex");
          elem.setAttribute("tabindex", oldTabIndex);
          elem.removeAttribute("data-popupLevel");
          elem.removeAttribute("data-oldTabIndex");
        }
        else
        {
          var updatePopupLevel = Number(prePopupLevel)+1;
          elem.setAttribute("data-popupLevel", updatePopupLevel);
        }
      }
    }
  }
})();
