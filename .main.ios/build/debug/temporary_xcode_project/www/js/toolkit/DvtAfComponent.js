// Copyright (c) 2008, 2016, Oracle and/or its affiliates. All rights reserved.
/**
 * Creates an instance of DvtText.
 * @extends {DvtText}
 * @class DvtText
 * @constructor
 * @param {DvtContext} dvtContext
 * @param {String} textString  Text to be displayed.
 * @param {number} x
 * @param {number} y
 * @param {String} id  Optional ID for the shape (see {@link  DvtDisplayable#setId}).
 */
var DvtText = function(dvtContext, textString, x, y, id)
{
  this.Init(dvtContext, textString, x, y, id);
};

DvtObj.createSubclass(DvtText, DvtShape, 'DvtText');

DvtText.ELLIPSIS = '\u2026';

// Horizontal Alignments
DvtText.H_ALIGN_LEFT = 'left';
DvtText.H_ALIGN_CENTER = 'center';
DvtText.H_ALIGN_RIGHT = 'right';
DvtText.H_ALIGN_DEFAULT = DvtText.H_ALIGN_LEFT;

// Vertical Alignments
DvtText.V_ALIGN_TOP = 'top';
DvtText.V_ALIGN_MIDDLE = 'middle';
DvtText.V_ALIGN_BOTTOM = 'bottom';
DvtText.V_ALIGN_BASELINE = 'baseline';
DvtText.V_ALIGN_DEFAULT = DvtText.V_ALIGN_TOP;

DvtText._BULK_TRUNCATION = true;

//bulk truncation internal state
DvtText._TRUNCATION_DONE = 0;
DvtText._TRUNCATION_GUESS_TOO_SHORT = 1;
DvtText._TRUNCATION_GUESS_TOO_LONG = 2;


/**
 * @override
 */
DvtText.prototype.Init = function(dvtContext, textString, x, y, id)
{
  DvtText.superclass.Init.call(this, dvtContext, 'text', id);

  this.setTextString(textString);
  this.setX(x);
  this.setY(y);

  // TODO this should be defined elsewhere
  // cursor is needed for chrome, but should be dependent on interactivity
  DvtToolkitUtils.setAttrNullNS(this.getElem(), 'font-family', 'tahoma, sans-serif');

  // TODO : Remove this workaround and the incorrect none default in DvtSvgShape.
  // Workaround to remove some strange defaulting for the fill, which is set to none in DvtSvgShape._Init.
  DvtToolkitUtils.removeAttrNullNS(this.getElem(), 'fill');

  // fix for bug 14528150 (the chrome case) and 14297988 (the ie case)
  if (DvtAgent.isRightToLeft(dvtContext)) {
    if (DvtAgent.isPlatformIE())
      this.setTextString('\u202B' + textString);
    else if (DvtText.needsTextAnchorAdjustment(dvtContext))
      this.alignLeft();
    else
      DvtToolkitUtils.setAttrNullNS(this.getElem(), 'unicode-bidi', 'embed');
  }

  //Bug 13879007 - NODE RENDERED INCORRECTLY IN IE9
  this._baseline = null;

  //  For edit mode
  this._bEditMode = false;
  this._editStartCallback = null;
  this._editEndCallback = null;
  this._editPxWidth;
  this._editElem = null;    // <textarea> elem
  this._editBorder = false;
  this._editTooltip = null;

  // Cache the text string to reduce DOM access
  this._textString = textString;

  // Initialize the alignment attrs.  Our impl defaults to start and baseline, so set the alignment if the defaults
  // don't match the impl defaults.
  this._horizAlign = DvtText.H_ALIGN_DEFAULT;
  if (DvtText.H_ALIGN_DEFAULT != DvtText.H_ALIGN_LEFT)
    this.setHorizAlignment(DvtText.H_ALIGN_DEFAULT);

  this._vertAlign = DvtText.V_ALIGN_DEFAULT;
  if (DvtText.V_ALIGN_DEFAULT != DvtText.V_ALIGN_BASELINE)
    this.setVertAlignment(DvtText.V_ALIGN_DEFAULT);

  this._maxw = -1;
  this._minChars = null; // minimum number of characters before ellipses

  this._bHtmlText = false;

  //flag indicating whether text is truncated
  this._bTruncated = false;
  this._inProcess = false;

  // for defer truncation
  this._defTrunc = false;
  this._setCachedDims(undefined);

  // for legend text to keep track of whether associated legend marker is hollow
  this._bHollow = false;

  // Clone
  this._cloneCSSStyle = null;

  // By default, hide text from VoiceOver
  this.setAriaProperty('hidden', 'true');
};


/**
 * Aligns the left side of the text to the x coordinate.
 */
DvtText.prototype.alignLeft = function() {
  this._horizAlign = DvtText.H_ALIGN_LEFT;
  this.impl_alignLeft();
};


/**
 * Aligns the center of the text to the x coordinate.
 */
DvtText.prototype.alignCenter = function() {
  this._horizAlign = DvtText.H_ALIGN_CENTER;
  this.impl_alignCenter();
};


/**
 * Aligns the right side of the text to the x coordinate.
 */
DvtText.prototype.alignRight = function() {
  this._horizAlign = DvtText.H_ALIGN_RIGHT;
  this.impl_alignRight();
};


/**
 * Aligns the top of the text to the y coordinate.
 */
DvtText.prototype.alignTop = function() {
  //save the member first so that the impl can depend on it
  this._vertAlign = DvtText.V_ALIGN_TOP;
  this.impl_alignTop();
};


/**
 * Aligns the middle of the text to the y coordinate.
 */
DvtText.prototype.alignMiddle = function() {
  //save the member first so that the impl can depend on it
  this._vertAlign = DvtText.V_ALIGN_MIDDLE;
  this.impl_alignMiddle();
};


/**
 * Aligns the bottom of the text to the y coordinate.
 */
DvtText.prototype.alignBottom = function() {
  //save the member first so that the impl can depend on it
  this._vertAlign = DvtText.V_ALIGN_BOTTOM;
  this.impl_alignBottom();
};


/**
 * Aligns the baseline of the text to the y coordinate.
 */
DvtText.prototype.alignBaseline = function() {
  //save the member first so that the impl can depend on it
  this._vertAlign = DvtText.V_ALIGN_BASELINE;
  this.impl_alignBaseline();
};


/**
 * Returns the horizontal alignment for this text object.  Valid constants begin with DvtText.H_ALIGN_.
 * @return {string}
 */
DvtText.prototype.getHorizAlignment = function() {
  return this._horizAlign;
};


/**
 * Specifies the horizontal alignment for this text object.  Valid constants begin with DvtText.H_ALIGN_.
 * @param {string} align
 */
DvtText.prototype.setHorizAlignment = function(align) {
  if (align == DvtText.H_ALIGN_LEFT)
    this.alignLeft();
  else if (align == DvtText.H_ALIGN_CENTER)
    this.alignCenter();
  else if (align == DvtText.H_ALIGN_RIGHT)
    this.alignRight();
};


/**
 * Returns the vertical alignment for this text object.  Valid constants begin with DvtText.V_ALIGN_.
 * @return {string} The horizontal alignment
 */
DvtText.prototype.getVertAlignment = function() {
  return this._vertAlign;
};


/**
 * Specifies the vertical alignment for this text object.  Valid constants begin with DvtText.V_ALIGN_.
 * @param {string} align
 */
DvtText.prototype.setVertAlignment = function(align) {
  if (align == DvtText.V_ALIGN_TOP)
    this.alignTop();
  else if (align == DvtText.V_ALIGN_MIDDLE)
    this.alignMiddle();
  else if (align == DvtText.V_ALIGN_BOTTOM)
    this.alignBottom();
  else if (align == DvtText.V_ALIGN_BASELINE)
    this.alignBaseline();
};


/**
 * Returns the x position for this text object.
 * @return {number} The x position.
 */
DvtText.prototype.getX = function() {
  return this.impl_getX();
};


/**
 * Specifies the x position for this text object.
 * @param {number} x The x position
 */
DvtText.prototype.setX = function(x) {
  this.impl_setX(x);
};


/**
 * Returns the y position for this text object.
 * @return {number} The y position.
 */
DvtText.prototype.getY = function() {
  return this.impl_getY();
};


/**
 * Specifies the y position for this text object.
 * @param {number} y The y position
 */
DvtText.prototype.setY = function(y) {
  this.impl_setY(y);
};


/**
 * @override
 */
DvtText.prototype.getTextString = function() {

  return String(this.impl_getTextString());
};


/**
 * Calculate the optimal text size based on the bounds provided.
 * @param {DvtRectangle} bounds The bounds to fit the label
 */
DvtText.prototype.getOptimalFontSize = function(bounds) {
  for (var i = Math.max(Math.min(bounds.w / this.getTextString().length, bounds.h / 2), 9); i < 51; i += 1) {
    this.setFontSize(i);
    var textDim = this.measureDimensions();
    if (textDim.w > bounds.w || textDim.h > bounds.h)
      return Math.min(i - 1, 50);
  }
  return 50;
};


/**
  *  Returns the edit mode of this text object.
  *  @return {boolean}  true if edift mode is on, else false.
  */
DvtText.prototype.getEditMode = function()
{
  return this.impl_getEditMode();
};


/**
  *  Sets the edit mode of this text object.
  *  @param {boolean} bEditMode  true if edit mode is to be set on, else false.
  *  @param {function} editStartCallback  optional function to call when editing starts that takes the string as
  *         an argument and can optionally return a replacement string
  *  @param {function} editEndCallback  optional function to call when editing ends that takes the string as
  *         an argument and can optionally return a replacement string
  */
DvtText.prototype.setEditMode = function(bEditMode, editStartCallback, editEndCallback)
{
  this.impl_setEditMode(bEditMode, editStartCallback, editEndCallback);
};


/**
  *  Sets the pixel width of the edititable area.
  *  @param {number} pxWidth  the pixel width of the edit area.
  */
DvtText.prototype.setEditWidth = function(pxWidth)
{
  this.impl_setEditWidth(pxWidth);
};


/**
  *  Sets the tooltip for this text object when it is in edit mode.
  *  @param {string} sTip  the tooltip to be shown when the cursor is
  *                        over the editable area and edit mode is set.
  */
DvtText.prototype.setEditTooltip = function(sTip)
{
  this.impl_setEditTooltip(sTip);
};


DvtText.prototype.getEditBorder = function(bShow)
{
  return this.impl_getEditBorder();
};

DvtText.prototype.setEditBorder = function(bShow)
{
  this.impl_setEditBorder(bShow);
};

DvtText.prototype.selectEditText = function() {
  if (this.impl_selectEditText) {
    this.impl_selectEditText();
  }
};

DvtText.prototype.focusEditText = function() {
  if (this.impl_focusEditText) {
    this.impl_focusEditText();
  }
};


/**
 * @override
 */
DvtText.prototype.setTextString = function(textString)
{
  this._textString = textString;
  this.impl_setTextString(textString);
  this._setCachedDims(undefined);
};


/**
 * Sets the font size.
 * @param {number} fontSize the font size
 */
DvtText.prototype.setFontSize = function(fontSize)
{
  // Note: A better version has been implemented in DvtText, but leaving this here for backwards compat until we
  // cleanup. Not updating JSDoc yet because the new version is less restrictive in the allowed font size format.
  this.impl_setFontSize(fontSize);
  this._setCachedDims(undefined);
  var style = this.getCSSStyle();
  if (style) {
    this._cloneCSSStyle = style.clone();
    this._cloneCSSStyle.setFontSize(DvtCSSStyle.FONT_SIZE, fontSize.toString());
  }
  else {
    this.setCSSStyle(new DvtCSSStyle());
    (this.getCSSStyle()).setFontSize(DvtCSSStyle.FONT_SIZE, fontSize.toString());
  }
};


/**
 * Set the maximum width allowed for this text field.
 * If this text field is longer than the maxWidth,
 * the text will be truncated.
 *
 * @param mw maximum width
 * @param minChars minimum number of characters before ellipses
 */
DvtText.prototype.setMaxWidth = function(mw, minChars) {
  this._maxw = mw;
  this._minChars = minChars;

  if (mw > 0)
    this._ProcessText();
};


/**
 * Gets the text string for this object.
 * @return {string} the text string
 */
DvtText.prototype.getText = function() {
  if (this.getEditMode() && this.impl_getText) {
    return this.impl_getText();
  }
  return this._text;
};


/**
 * Sets the text string for this text object.
 * @param {array} single line text or multiline text
 * @param {array} dimList Optional dimensions of multilines
 */
DvtText.prototype._setTextWithSize = function(text, dimList) {
  this.impl_setText(text, dimList);
};


/**
 * Sets the TruncateAt for this text object.
 * @param {number} truncateAt
 */
DvtText.prototype.setTruncateAt = function(truncateAt) {
  this._truncateAt = truncateAt;

  // reset the text
  this.DoSetText(this.getText());
};


/**
 * Gets the TruncateAt for this text object.
 * @return {number} truncateAt
 */
DvtText.prototype.getTruncateAt = function() {
  return this._truncateAt;
};


/**
 * Sets the text string for this object.
 * @param {string} text the text string
 */
DvtText.prototype.DoSetText = function(text) {
  //handle "truncate at" if specified
  text = this.DoTruncateAt(text, this.getTruncateAt());

  this._setCachedDims(undefined);
  this._setText(text);
  if (text)
    this._ProcessText();
};


/**
 * Truncate text at number of character specified
 * @param text text being truncated
 * @param {number} truncateAt
 * @return (String) truncated text
 */
DvtText.prototype.DoTruncateAt = function(text, truncateAt) {
  this._bTruncated = false;

  if (truncateAt && text && text.length > truncateAt) {
    text = text.substr(0, Math.max(truncateAt - 3, 0)) + '...';
    this._bTruncated = true;
  }

  return text;
};


/**
 * Determine if the text has been truncated.
 * @return true if text has been truncated, false if not
 */
DvtText.prototype.isTruncated = function() {
  return this._bTruncated;
};


/**
 * Returns the untruncated text string for this text object.  Returns null if the text string has not been truncated.
 * @return {string} the untruncated text string
 */
DvtText.prototype.getUntruncatedTextString = function() {
  return this._untruncatedTextString;
};


/**
 * Specifies the untruncated text string for this text object. This should only be set if the DvtText was
 * truncated by DvtTextUtils.
 * @param {string} textString the untruncated text string
 */
DvtText.prototype.setUntruncatedTextString = function(textString) {
  if (textString != this.getTextString())
    this._untruncatedTextString = textString;
};


/**
 * Is truncation enabled?
 * @return true if truncation is enabled, false if not
 */
DvtText.prototype.isTruncationEnabled = function() {
  //Note: no truncation on html text, because that's harder
  return (this._maxw > 0) && (! this._bHtmlText);
};


/**
 * Sets the text string for this text object.
 * It also performs word wrapping or truncation if enabled
 * @param {string} text the text string
 */
DvtText.prototype.setText = function(text) {
  // save the original text
  this._text = text;
  this.DoSetText(text);
};


/**
 * Sets the text string for this text object.
 * @param {array} single line text or multiline text
 */
DvtText.prototype._setText = function(text) {
  this.impl_setText(text);
};


/**
 * Gets the text string for this text object.
 * @return {string} the text string
 */
DvtText.prototype._getText = function() {
  return this.impl_getText();
};


/**
 * Sets the CSSStyle for this text object.
 * perform truncation if enabled
 * @param value text being set
 */
DvtText.prototype.setCSSStyle = function(style) {
  if (this._cloneCSSStyle)
    this._cloneCSSStyle = null;
  this._setCachedDims(undefined);

  DvtText.superclass.setCSSStyle.call(this, style);
  this.impl_setCSSStyle(style);

  if (this._text !== null && typeof this._text !== 'undefined') {
    this.setText(this.getText());  // Force the untruncated text into the SVGTextElement
  }
  else {
    this._ProcessText();
  }
};


/**
 * Performs truncation.
 */
DvtText.prototype._ProcessText = function() {
  if (this.isTruncationEnabled() && ! this._inProcess) {
    this._inProcess = true;
    this._TruncateText();
    this._inProcess = false;
  }
};


/**
 * Optimized version of getDimensions.  Unlike getDimensions, this function will always returns useful dimensions,
 * adding the object to the DOM as needed.  The current implementation achieves improvements in performance by
 * storing the text calculations in a LRU cache, taking advantage of the fact that dimensions calculations do
 * not depend on container information.
 * @param {DvtDisplayable=} targetCoordinateSpace The displayable defining the target coordinate space.
 * @return {DvtRectangle} The bounds of the text
 */
DvtText.prototype.measureDimensions = function(targetCoordinateSpace) {
  // Initialize the cache if not done already.  The cache stores the stage relative dims of text at (0,0).
  if (!DvtText._cache)
    DvtText._cache = new DvtCache();

  // Create the key for cache, which is a combination of all attrs that affect dimensions calculations.
  var cssStyle = this.getCSSStyle();
  var cssStyleKey = '';
  if (cssStyle) {
    if (cssStyle.getStyle(DvtCSSStyle.FONT_FAMILY))
      cssStyleKey += cssStyle.getStyle(DvtCSSStyle.FONT_FAMILY);
    if (cssStyle.getStyle(DvtCSSStyle.FONT_SIZE))
      cssStyleKey += cssStyle.getStyle(DvtCSSStyle.FONT_SIZE);
    if (cssStyle.getStyle(DvtCSSStyle.FONT_STYLE))
      cssStyleKey += cssStyle.getStyle(DvtCSSStyle.FONT_STYLE);
    if (cssStyle.getStyle(DvtCSSStyle.FONT_WEIGHT))
      cssStyleKey += cssStyle.getStyle(DvtCSSStyle.FONT_WEIGHT);
  }

  var cacheKey = this.getTextString().length > 0 ? this.getTextString() + this.getHorizAlignment() + this.getVertAlignment() + cssStyleKey : '';

  // Look for the value in the cache and add it if not found. Calculate the localDims.
  var localDims;
  var stageDims = DvtText._cache.get(cacheKey);
  if (stageDims != null) // Cache hit found, convert from stage coords to local and return.
    localDims = new DvtRectangle(stageDims.x + this.getX(), stageDims.y + this.getY(), stageDims.w, stageDims.h);
  else { // No cache hit.  Find the stage coords and add to cache.
    // Get the real local dimensions and cache the stage dimensions by removing x and y offsets.
    localDims = this.getDimensions();

    // For Firefox, localDims is null for disconnected elements
    if (!localDims)
      localDims = new DvtRectangle(0, 0, 0, 0);

    // If the object is not connected to the DOM, it will return incorrect size of 0.
    if (localDims.w <= 0 && localDims.h <= 0 && this.getTextString().length > 0) {
      // Saves the parent and the index
      var parent = this.getParent();
      var index;
      if (parent) {
        index = parent.getChildIndex(this);
      }
      // Add to the stage to obtain correct measurements
      var stage = this.getCtx().getStage();
      stage.addChild(this);
      localDims = this.getDimensions();
      stage.removeChild(this);
      // Restore the parent
      if (parent) {
        parent.addChildAt(this, index);
      }
    }

    // Convert to stage dims by removing own x and y.
    stageDims = new DvtRectangle(localDims.x - this.getX(), localDims.y - this.getY(), localDims.w, localDims.h);
    DvtText._cache.put(cacheKey, stageDims);
  }

  // Transform to the target coord space and return
  return (!targetCoordinateSpace || targetCoordinateSpace === this) ? localDims : this.ConvertCoordSpaceRect(localDims, targetCoordinateSpace);
};


/**
 * Check whether the text being shown needs to be truncated,
 * and truncate it if so.
 */
DvtText.prototype._TruncateText = function() {
  if (this.isTruncationEnabled()) {
    var maxLineWidth = this._maxw;

    var minChars = this._minChars;
    var cacheEnabled = false;
    if (isNaN(minChars) || minChars == null) {
      minChars = 0;
      cacheEnabled = true;
    }

    //indicating whether text is truncated
    this._bTruncated = false;

    var dim;
    if (cacheEnabled)
      dim = this.getCachedDims();
    else
      dim = this.measureDimensions();

    if (dim.w > maxLineWidth) {
      this._bTruncated = true;

      // defer text truncation
      if (! this._defTrunc) {
        dim = this._truncateLine(maxLineWidth, minChars, dim);
        if (cacheEnabled)
          this._setCachedDims(dim);
      }
    }
  }
};

DvtText.prototype._GetTempTextField = function() {
  if (this._ttf === undefined) {
    var tmp = new DvtText(this.getCtx(), null, 0, 0, this.getId() + '__tmp');

    //Bug 13878815 - TEXT IN NODE WRAPS UNNECESSARILY AT DIFFERENT ZOOM LEVELS
    //don't add the tempTextField to this parent, add it to the stage instead
    //so we always get the same dimensions
    // Temporarily add to the DOM so that metrics may be obtained
    //    if (this.getParent()) {
    //      this.getParent().addChild(tmp);
    //    }
    var stage = this.getCtx().getStage();
    stage.addChild(tmp);

    this._ttf = tmp;
  }
  return this._ttf;
};

// remove the temporary text field
DvtText.prototype._RemoveTempTextField = function() {
  if (this._ttf) {
    //Bug 13878815 - TEXT IN NODE WRAPS UNNECESSARILY AT DIFFERENT ZOOM LEVELS
    //    if (this.getParent()) {
    //      this.getParent().removeChild(this._ttf);
    //    }
    var stage = this.getCtx().getStage();
    stage.removeChild(this._ttf);

    this._ttf = undefined;
  }
};

/**
 *  Get dimensions from cache
 *  @return {DvtRectangle} The dimesions of the text
 */
DvtText.prototype.getCachedDims = function() {
  var dim = this._dim;
  if (! dim) {
    dim = this.GetDimsForCaching();
    this._setCachedDims(dim);
    // For Firefox, dim is null for disconnected elements
    // Note: following initialization is not cached
    if (!dim)
      dim = new DvtRectangle(0, 0, 0, 0);
  }
  return dim;
};


/**
 * Get dimensions for caching by getCachedDims().
 */
DvtText.prototype.GetDimsForCaching = function() {
  //DvtText always returned the superclass getDimensions call, but I'm not
  //sure why.  That call only calls the superclass function, not any
  //overrides in subclasses, like the one here in DvtText itself.
  //It seems like it should return this.getDimensions(), so that
  //any subclass overrides get called.
  return DvtText.superclass.getDimensions.call(this);
};

DvtText.prototype._setCachedDims = function(val) {
  DvtDisplayableUtils._setDimForced(this, val);
};


/**
 * set defer text truncation flag
 * if it's not defer, truncate text
 */
DvtText.prototype.truncateText = function(deferFlag) {
  this.setTruncationDeferred(deferFlag);
  if (! deferFlag) {
    this._ProcessText();
  }
};

DvtText.prototype.setTruncationDeferred = function(deferFlag) {
  this._defTrunc = deferFlag;
};

DvtText.prototype.isTruncationDeferred = function() {
  return this._defTrunc;
};


/**
 * Truncate texts for an array of DvtText.
 * @param {array} textFields
 */
DvtText.truncateTexts = function(textFields) {

  if (DvtText._BULK_TRUNCATION) {
    DvtText._bulkTruncation(textFields);
  }
  else {
    var len = textFields.length;
    for (var i = 0; i < len; i++) {
      var deferFlag = textFields[i].isTruncationDeferred();
      textFields[i].setTruncationDeferred(false);
      try {
        textFields[i]._ProcessText();
      }
      finally {
        textFields[i].setTruncationDeferred(deferFlag);
      }
    }
  }
};


/**
  *  @override
  */
DvtText.prototype.getDimensions = function(targetCoordinateSpace) {
  if (this.isTruncated() && this._defTrunc && !this._dim) {
    //Don't call superclass getDimensions(), because that will convert the coord space rect and
    //then we wouldn't be able to simply assign the maxWidth value here without converting that
    //to the target coord space first.  Instead, get the unconverted dims from the impl,
    //assign maxWidth, and then convert the rect.
    var dim = this.GetSvgDimensions();
    dim.w = this._maxw;
    return (!targetCoordinateSpace || targetCoordinateSpace === this) ? dim :
        this.ConvertCoordSpaceRect(dim, targetCoordinateSpace);
  }

  return DvtText.superclass.getDimensions.call(this);
};


/**
 *  @override
 */
DvtText.prototype.getCSSStyle = function() {
  if (this._cloneCSSStyle)
    return this._cloneCSSStyle;
  else
    return DvtText.superclass.getCSSStyle.call(this);
};


/**
 * Measures the dimensions of a text string. Sets the textString will be set before calling getDimensions. Used for
 * truncation methods.
 * @param {string} textString The text string to measure
 * @param {DvtCSSStyle} cssStyle CSS object specifying font styles
 * @return {DvtRectangle} The text dimensions
 */
DvtText.prototype._measureText = function(textString, cssStyle) {
  this.setTextString(textString);
  return this.getDimensions();
};


/**
 * Truncates the line to a given width. Assumes that the full text can't fit in the container.
 * @param {number} maxLineWidth Maximum line width
 * @param {number} minChars Minimum number of characters before the ellipsis
 * @param {DvtRectangle} dim The dimensions of the text before truncation
 * @return {DvtRectangle} The dimensions of the text after truncation
 */
DvtText.prototype._truncateLine = function(maxLineWidth, minChars, dim) {
  // Determine avg pixels per char
  var text = this.getTextString();
  var avgPixel = dim.w / text.length;

  //substract 3 for the ellipsis
  var maxNumChars = Math.max(Math.floor(maxLineWidth / avgPixel) - 3, minChars);

  //Determine whether we can use context to measure text.
  //If so, don't need to call getDimensions() at all, and only need to setTextString() at the very end.
  var cssFontStyles = this.getCSSStyle();
  var tmpTextString = text.substring(0, maxNumChars) + DvtText.ELLIPSIS;
  dim = this._measureText(tmpTextString, cssFontStyles);

  // initial guess is too short
  while (dim.w < maxLineWidth) {
    if (maxNumChars >= text.length)
      break;

    // Add 1 char at a time
    maxNumChars += 1;
    tmpTextString = text.substring(0, maxNumChars) + DvtText.ELLIPSIS;
    dim = this._measureText(tmpTextString, cssFontStyles);
  }

  // current guess is too long
  while (dim.w > maxLineWidth) {
    if (maxNumChars <= minChars) {
      tmpTextString = '';
      dim.w = 0;
      break;
    }

    // Truncate 1 char at a time
    maxNumChars -= 1;
    tmpTextString = text.substring(0, maxNumChars) + DvtText.ELLIPSIS;
    dim = this._measureText(tmpTextString, cssFontStyles);
  }

  this.setTextString(tmpTextString);
  return dim;
};


DvtText._bulkSetDimensions = function(textFields) {
  var tf;

  for (var i = 0; i < textFields.length; i++) {
    tf = textFields[i];
    tf._setCachedDims(tf.GetDimsForCaching());

  }
};


//1) init state
DvtText.prototype._initTruncation = function() {
  var dim = this.getCachedDims();
  var minChars = this._minChars;
  if (isNaN(minChars) || minChars == null) {
    minChars = 0;
  }
  var maxLineWidth = this._maxw;

  // Determine avg pixels per char
  var text = this.getTextString();
  var avgPixel = dim.w / text.length;

  //substract 3 for the ellipsis
  var maxNumChars = Math.max(Math.floor(maxLineWidth / avgPixel) - 3, minChars);

  // save state
  this.setTextString(text.substring(0, maxNumChars) + DvtText.ELLIPSIS);
  this._maxNumChars = maxNumChars;
  this._setCachedDims(undefined);

  this._originalText = text;
  this._minChars2 = minChars;

  this._state = DvtText._TRUNCATION_GUESS_TOO_SHORT;
};


// This method returns true if truncation is done, return false otherwise.a
DvtText.prototype._doTruncation = function() {
  var state = this._state;

  var text = this._originalText;
  var dim = this.getCachedDims();
  var maxNumChars = this._maxNumChars;
  var maxLineWidth = this._maxw;

  // initial guess is too short
  if (state == DvtText._TRUNCATION_GUESS_TOO_SHORT) {
    if (dim.w < maxLineWidth) {
      if (maxNumChars >= text.length) {
        state = DvtText._TRUNCATION_GUESS_TOO_LONG;
      }
      else {
        // Add 1 char at a time
        maxNumChars += 1;

        // save state
        this.setTextString(text.substring(0, maxNumChars) + DvtText.ELLIPSIS);
        this._maxNumChars = maxNumChars;
        this._setCachedDims(undefined);
      }
    }
    // done with this state, go to next state
    else {
      state = DvtText._TRUNCATION_GUESS_TOO_LONG;
    }
  }
  if (state == DvtText._TRUNCATION_GUESS_TOO_LONG) {
    if (dim.w > maxLineWidth) {
      if (maxNumChars <= this._minChars2) {
        this.setTextString('');
        dim.w = 0;
        state = DvtText._TRUNCATION_DONE;
      }

      else {
        // Truncate 1 char at a time
        maxNumChars -= 1;
        this.setTextString(text.substring(0, maxNumChars) + DvtText.ELLIPSIS);

        // done with truncation
        if (maxNumChars == 0) {
          dim.w = 0;
          state = DvtText._TRUNCATION_DONE;
        }
        else {
          // save state
          this._maxNumChars = maxNumChars;
          this._setCachedDims(undefined);
        }
      }
    }
    else {
      state = DvtText._TRUNCATION_DONE;
    }
  }

  // if done, clear state and return true
  if (state == DvtText._TRUNCATION_DONE) {
    this._maxNumChars = undefined;
    this._originalText = undefined;
    this._minChars2 = undefined;
    this._state = undefined;
    return true;
  }
  else {
    this._state = state;
    return false;
  }
};


/**
 * Bulk truncation
 * @param {array} textFields list of texts need to be truncated
 */
DvtText._bulkTruncation = function(textFields) {
  var tf;
  var toDoList = [];
  var dim;

  //1) Init state
  for (var i = 0; i < textFields.length; i++) {
    tf = textFields[i];

    tf._bTruncated = false;
    dim = tf.getCachedDims();

    // truncation required
    if (dim.w > tf._maxw) {
      tf._bTruncated = true;

      tf._initTruncation();
      toDoList.push(tf);
    }
  }

  //getDimensions for all texts
  textFields = toDoList;
  DvtText._bulkSetDimensions(textFields);

  var done = false;
  toDoList = [];

  //2) Guess too short or too long
  while (! done) {
    for (var i = 0; i < textFields.length; i++) {
      tf = textFields[i];

      //if not done
      if (! tf._doTruncation()) {
        toDoList.push(tf);
      }
    }

    if (toDoList.length > 0) {
      textFields = toDoList;
      DvtText._bulkSetDimensions(textFields);
      toDoList = [];
    }
    else {
      done = true;
    }
  }
};


/**
 * @override
 */
DvtText.prototype.copyShape = function()
{
  return new DvtText(this.getCtx(), this.getText(), this.getX(), this.getY());
};


/**
 * Returns the editing state for the object
 * @param {boolean} true if the editable text is currently being edited
 */
DvtText.prototype.isEditing = function()
{
  return this.impl_isEditing();
};


/**
 * @override
 */
DvtText.prototype.destroy = function() {
  DvtText.superclass.destroy.call(this);
  if (this.impl_destroy)
    this.impl_destroy();
};


/**
 * Returns the text string for this text object.
 * @return {string} the text string
 */
DvtText.prototype.impl_getTextString = function() {
  var txt;
  if (this._bEditMode && this._editElem) {      // if in edit mode
    txt = this._editElem.value;
  }
  else {
    var textNode = this.impl_GetTextElem().firstChild;
    if (textNode) {
      txt = textNode.nodeValue;
    }
  }
  return txt;
};


/**
 * Sets the text string for this text object.
 * @param {string} textStr the text string
 */
DvtText.prototype.impl_setTextString = function(textStr)
{
  // Update the text node if it is already created
  var textNode = this.impl_GetTextElem().firstChild;
  if (textNode !== null) {
    textNode.nodeValue = textStr;
  }
  else { // Otherwise create it
    textNode = document.createTextNode(textStr);
    DvtToolkitUtils.appendChildElem(this.impl_GetTextElem(), textNode);
  }

  if (this._editElem) {             // if an edit element, change its text also.
    this._editElem.value = textStr;
  }
  this._alignTextForEdit();
};


/**
 * @private
 * If edit mode is enabled for Bidi, right align the SVG text.
 */
DvtText.prototype._alignTextForEdit = function() 
{
  //Bug 20126842 - nls:hv:bidi:search panel does not display the search results data
  //If edit mode is enabled for Bidi, right align the SVG text so that it aligns to the editable text area.
  if (this._bEditMode && DvtAgent.isRightToLeft(this.getCtx())
        && this._editPxWidth != null && this._editPxWidth > 0) {

    var textElem = this.impl_GetTextElem();
    var dim;
    if (!textElem.parentNode) {
      //Temporarily add to compute dimensions
      this.getElem().appendChild(textElem);
      dim = textElem.getBBox();
      this.getElem().removeChild(textElem);
    } else {
      dim = textElem.getBBox();
    }

    if (this._editPxWidth > dim.width) {
      var transform = 'translate(' + (this._editPxWidth - dim.width) + ',0)';
      DvtToolkitUtils.setAttrNullNS(this.impl_GetTextElem(), 'transform', transform);
    } else {
      if (DvtAgent.isPlatformIE())
        DvtToolkitUtils.setAttrNullNS(this.impl_GetTextElem(), 'transform', null);

      DvtToolkitUtils.removeAttrNullNS(this.impl_GetTextElem(), 'transform');
    }
  }
};


/**
 * Gets the x position for this text object.
 * @return {number} the x position
 */
DvtText.prototype.impl_getX = function()
{
  return this._x;
};


/**
 * Sets the x position for this text object.
 * @param {number} x the x position
 */
DvtText.prototype.impl_setX = function(x)
{
  if (x !== this._x) {
    this._x = x;
    DvtToolkitUtils.setAttrNullNS(this.getElem(), 'x', x, 0);
  }
};


/**
 * Gets the y position for this text object.
 * @return {number} the y position
 */
DvtText.prototype.impl_getY = function()
{
  return this._y;
};


/**
 * Sets the y position for this text object.
 * @param {number} y the y position
 */
DvtText.prototype.impl_setY = function(y)
{
  if (y !== this._y) {
    this._y = y;
    DvtToolkitUtils.setAttrNullNS(this.getElem(), 'y', y, 0);
  }
};


/**
 * Sets the font size.
 * @param {number} fontSize the font size
 */
DvtText.prototype.impl_setFontSize = function(fontSize)
{
  DvtToolkitUtils.setAttrNullNS(this.getElem(), 'font-size', fontSize);

  //Bug 13879007 - NODE RENDERED INCORRECTLY IN IE9
  if (DvtAgent.isPlatformIE()) {
    this.setMatrix(this.getMatrix());
  }
};


/**
 * Aligns the left side of the text to the x coordinate. Note: This does not always correspond to what the browser
 * considers a "start" alignment, as we work around issues in rtl locales to provide a consistent API.
 */
DvtText.prototype.impl_alignLeft = function() {
  // Bug 17776065: When html dir="rtl", Webkit and FF25+ treat the right side of the text as the start, and the left
  // side of the text as end.  Our API always treats the left side as start, so we need to adjust based on agent.
  var bAdjust = DvtText.needsTextAnchorAdjustment(this.getCtx());
  DvtToolkitUtils.setAttrNullNS(this.getElem(), 'text-anchor', bAdjust ? 'end' : 'start');
};


/**
 * Aligns the center of the text to the x coordinate.
 */
DvtText.prototype.impl_alignCenter = function() {
  DvtToolkitUtils.setAttrNullNS(this.getElem(), 'text-anchor', 'middle');
};


/**
 * Aligns the right side of the text to the x coordinate. Note: This does not always correspond to what the browser
 * considers an "end" alignment, as we work around issues in rtl locales to provide a consistent API.
 */
DvtText.prototype.impl_alignRight = function() {
  // Bug 17776065: When html dir="rtl", Webkit and FF25+ treat the right side of the text as the start, and the left
  // side of the text as end.  Our API always treats the left side as start, so we need to adjust based on agent.
  var bAdjust = DvtText.needsTextAnchorAdjustment(this.getCtx());
  DvtToolkitUtils.setAttrNullNS(this.getElem(), 'text-anchor', bAdjust ? 'start' : 'end');
};

// TODO JSDOC Not sure how to expose these, so this is temporary
DvtText.prototype.impl_alignTop = function() {
  //Bug 13879007 - NODE RENDERED INCORRECTLY IN IE9
  if (DvtAgent.isPlatformIE()) {
    //+ font-size
    this.impl_SetBaseline(1);
  }
  else {
    this.impl_SetDominantBaselineAttr('text-before-edge');
  }
};

// TODO JSDOC Not sure how to expose these, so this is temporary
DvtText.prototype.impl_alignMiddle = function() {
  //Bug 13879007 - NODE RENDERED INCORRECTLY IN IE9
  if (DvtAgent.isPlatformIE()) {
    //+ 2/5 font-size
    this.impl_SetBaseline(.4);
  }
  else {
    this.impl_SetDominantBaselineAttr('middle');
  }
};

// TODO JSDOC Not sure how to expose these, so this is temporary
DvtText.prototype.impl_alignBottom = function() {
  //Bug 13879007 - NODE RENDERED INCORRECTLY IN IE9
  if (DvtAgent.isPlatformIE()) {
    //+ 1/5 font-size
    this.impl_SetBaseline(.2);
  }
  else {
    this.impl_SetDominantBaselineAttr('text-after-edge');
  }
};

// TODO JSDOC Not sure how to expose these, so this is temporary
DvtText.prototype.impl_alignBaseline = function() {
  //Bug 13879007 - NODE RENDERED INCORRECTLY IN IE9
  if (DvtAgent.isPlatformIE()) {
    this.impl_SetBaseline(0);
  }
  else {
    this.impl_SetDominantBaselineAttr(null);
  }
};


/**
 * @protected
 * Save the baseline and adjust the matrix for vertical alignment in IE.
 */
DvtText.prototype.impl_SetBaseline = function(baseline) {
  this._baseline = baseline;
  this.setMatrix(this.getMatrix());
};


/**
 * @protected
 * Set the dominant baseline for vertical alignment.
 */
DvtText.prototype.impl_SetDominantBaselineAttr = function(baseline) {
  if (baseline) {
    DvtToolkitUtils.setAttrNullNS(this.getElem(), 'dominant-baseline', baseline);
  }
  else {
    DvtToolkitUtils.removeAttrNullNS(this.getElem(), 'dominant-baseline');
  }
};


/**
 * Sets the text string for this text object.
 * @param {string} text the text string
 */
DvtText.prototype.impl_setText = function(text) {
  // Update the text node if it is already created
  var textNode = this.impl_GetTextElem().firstChild;
  if (textNode !== null) {
    textNode.nodeValue = text;
  }
  else { // Otherwise create it
    textNode = document.createTextNode(text);
    DvtToolkitUtils.appendChildElem(this.impl_GetTextElem(), textNode);
  }

  if (this._bEditMode && this._editElem) {             // if in edit mode, also change the textarea
    this._editElem.value = text;
  }
};


/**
 * @return the text string for this text object.
 */
DvtText.prototype.impl_getText = function() {
  if (this._bEditMode && this._editElem) {
    return this._editElem.value;
  }

  var textNode = this.impl_GetTextElem().firstChild;
  if (textNode) {
    return textNode.nodeValue;
  }
};


/**
 * Sets the DvtCSSStyle of this object.
 * @param {DvtCSSStyle} style The DvtCSSStyle of this object.
 */
DvtText.prototype.impl_setCSSStyle = function(style)
{
  var elem = this.getOuterElem();

  if (style) {
    //NOTE: svg does not recognize css "color" attribute, use "fill" instead
    var val = style.getStyle('color');
    var fillObj = DvtColorUtils.fixColorForPlatform(val);
    if (fillObj && fillObj['color']) {
      DvtToolkitUtils.setAttrNullNS(elem, 'fill', fillObj['color']);
      if (fillObj['alpha'] != null)
        DvtToolkitUtils.setAttrNullNS(elem, 'fill-opacity', fillObj['alpha'], 1);
    }

    val = style.getStyle('font-family');
    if (val) {
      DvtToolkitUtils.setAttrNullNS(elem, 'font-family', val);
    }
    val = style.getStyle('font-size');
    if (val) {
      DvtToolkitUtils.setAttrNullNS(elem, 'font-size', val);

      //Bug 13879007 - NODE RENDERED INCORRECTLY IN IE9
      if (DvtAgent.isPlatformIE()) {
        this.setMatrix(this.getMatrix());
      }
    }
    val = style.getStyle('font-style');
    if (val) {
      DvtToolkitUtils.setAttrNullNS(elem, 'font-style', val);
    }
    val = style.getStyle('font-weight');
    if (val) {
      DvtToolkitUtils.setAttrNullNS(elem, 'font-weight', val);
    }

    //NOTE: svg does not recognize css "text-align" attribute,
    //call alignCenter, alignLeft, alignRight... if needed.

    val = style.getStyle('text-decoration');
    if (val) {
      DvtToolkitUtils.setAttrNullNS(elem, 'text-decoration', val);
    }

    val = style.getStyle('cursor');
    if (val) {
      DvtToolkitUtils.setAttrNullNS(elem, 'cursor', val);
    }
  }
};


/**
 * Returns true if this text object is in editMode, else false.
 * @type {boolean}
 */
DvtText.prototype.impl_getEditMode = function()
{
  return this._bEditMode;
};


/**
 * Sets the edit mode of this text object.
 * @param bEditMode {boolean} true if the text is to be editable, else false.
 *                            The mode may be changed at any time.
 * @param {function} editStartCallback  optional function to call when editing starts that takes the string as
 *        an argument and can optionally return a replacement string
 * @param {function} editEndCallback  optional function to call when editing ends that takes the string as
 *        an argument and can optionally return a replacement string
 */
DvtText.prototype.impl_setEditMode = function(bEditMode, editStartCallback, editEndCallback) {
  this._editStartCallback = editStartCallback;
  this._editEndCallback = editEndCallback;
  if (this._bEditMode == bEditMode) {
    return;
  }
  this._bEditMode = bEditMode;

  //BUG 16901294: in edit mode, make this text a shape container and add a rect behind the text
  //to define the size of the edit box
  if (bEditMode) {
    var obj = this.getObj();
    var dims = obj.getDimensions();

    this.CreateChildGroupElem();
    this._editRectElem = DvtSvgShapeUtils.createElement('rect');
    DvtToolkitUtils.setAttrNullNS(this._editRectElem, 'x', 0);
    DvtToolkitUtils.setAttrNullNS(this._editRectElem, 'y', 0);
    DvtToolkitUtils.setAttrNullNS(this._editRectElem, 'width', this._editPxWidth);
    DvtToolkitUtils.setAttrNullNS(this._editRectElem, 'height', dims.h);
    DvtToolkitUtils.setAttrNullNS(this._editRectElem, 'fill', '#ffffff');
    DvtToolkitUtils.setAttrNullNS(this._editRectElem, 'fill-opacity', 0);
    DvtToolkitUtils.setAttrNullNS(this._editRectElem, 'cursor', 'text');
    DvtToolkitUtils.appendChildElem(this._childGroupElem, this._editRectElem);
    //BUG 18324259 - ie11: html5 hv search field has very small font and vertical scroll bar visible
    this._updateEditRectElem(); //Update the edit rect element for IE
    this._alignTextForEdit();
  }
  else {
    this._childGroupElem.removeChild(this._editRectElem);
    this._editRectElem = null;
  }
};

/**
 * @private
 * Update Edit Rect element transformation for IE
 * BUG 18324259 - ie11: html5 hv search field has very small font and vertical scroll bar visible
 */
DvtText.prototype._updateEditRectElem = function() {
  //In IE, by default the edit rect is created below the text and not behind the text
  //The rect is below the text because IE doesn't respect the dominant-baseline attr,
  //and we work around that by adjusting the transform on the DvtText to compensate (in setMatrix method).
  //However, when we create the childGroupElem(this.CreateChildGroupElem) to add the rect,
  //that adjusted transform moves to the group and that shifts the text and the rect together.
  //The dominant-baseline IE workaround should really only be applied to the text element itself, not the group.
  //Instead of doing that, we're making a simpler change by inversely adjusting the rect transform relative to the text,
  //so it visually appears unaffected by the IE workaround.
  if (DvtAgent.isPlatformIE() && this._editRectElem) {
    //baseline translation is the IE specific translation applied on DvtText
    var dy = this._getBaselineTranslation();
    //negating that baseline traslation on rect will fix the position of rect behind the text
    var transform = 'translate(0,' + (-dy) + ')';
    DvtToolkitUtils.setAttrNullNS(this._editRectElem, 'transform', transform);
  }
};

//BUG 16901294:
/**
 * @protected
 * Set whether editable text is currently being edited.
 * @param {boolean}  bEditing  true if editing, false otherwise
 */
DvtText.prototype.impl_SetEditing = function(bEditing) {
  if (!this._bEditMode || bEditing == this._bEditing) {
    if (bEditing && this._editElem) {
      this._updateEditElement();
    }
    return;
  }
  var obj = this.getObj();
  var textElem = this.impl_GetTextElem();
  var input;                                   // textArea elem

  if ((!bEditing) && this._editElem)
  {                                             // change from edit to non-edit mode
    var editedText = this._editElem.value;
    //(NOTE: set the text on the thisDvtText before calling the _editEndCallback, because the
    //callback might change the text on this DvtText, and that should take precedence)
    this.impl_setTextString(editedText);

    //call the callback and potentially get replacement text
    if (this._editEndCallback) {
      var retText = this._editEndCallback.call(null, editedText);
      if (retText) {
        this.impl_setTextString(retText);
      }
    }

    //put the SVG text behind the _editRectElem
    this.getElem().insertBefore(textElem, this._editRectElem);

    if (this._bEventListener) {
      input = this._editElem;
      //remove the listeners on the HTML text area
      if (this._htmlTextAreaListenerFunc) {
        DvtToolkitUtils.removeDomEventListener(input, DvtKeyboardEvent.KEYDOWN, this._htmlTextAreaListenerFunc, false);
        DvtToolkitUtils.removeDomEventListener(input, DvtKeyboardEvent.KEYUP, this._htmlTextAreaListenerFunc, false);
        DvtToolkitUtils.removeDomEventListener(input, 'keypress', this._htmlTextAreaListenerFunc, false);
        DvtToolkitUtils.removeDomEventListener(input, 'textInput', this._htmlTextAreaListenerFunc, false);
        DvtToolkitUtils.removeDomEventListener(input, 'textinput', this._htmlTextAreaListenerFunc, false);
        this._htmlTextAreaListenerFunc = null;
      }
      //remove the blur listener on the HTML text area
      if (this._editBlurFunc) {
        DvtToolkitUtils.removeDomEventListener(input, 'blur', this._editBlurFunc, false);
        this._editBlurFunc = null;
      }
      this._bEventListener = false;
    }
    //remove the HTML text area from its parent div AFTER removing listeners so that blur listener
    //does not get called due to removal from DOM
    if (this._editElem && this._editElem.parentNode) {
      this._editElem.parentNode.removeChild(this._editElem);
    }
  //This is commented out for now because when it is uncommented and a new HTML text area is created every time,
  //if you enter some text and then click outside and then click back inside the text, the cursor appears at
  //the beginning of the text.  With this commented out, the cursor appears wherever it last was, which seems
  //preferable.
  //this._editElem = null;
  }
  else                                       // change to editMode
  {
    var editText = this.impl_getText();
    //create the HTML text area
    //(NOTE: set the text on the HTML text area before calling the _editStartCallback, because the
    //callback might change the text on this DvtText, and that should take precedence)
    if (! this._editElem) {
      input = this.impl__createHtmlTextArea(obj, textElem, editText);
    }
    else {
      //update element position and clip rectangle
      this._updateEditElement();
    }

    //call the callback and potentially get replacement text
    if (this._editStartCallback) {
      var retText = this._editStartCallback.call(null, editText);
      if (retText) {
        this.impl_setTextString(retText);
      }
    }

    //remove the SVG text from the DOM
    this.getElem().removeChild(textElem);
    //BUG 16901294: add the HTML text area to the SVG parent div so that it can be overlaid on top of SVG content
    if (this._editElem) {
      DvtToolkitUtils.appendChildElem(obj.getCtx().getStage().getSVGRoot().parentNode, this._editElem);
    }

    input = this._editElem;
    var thisRef = this;
    //create a closure to redirect to the instance function so we have a valid "this" pointer in the listener
    this._htmlTextAreaListenerFunc = function(event) {
      thisRef.impl__handleHtmlTextAreaKeyboardEvent(event);
    };
    //add listeners on the HTML text area
    DvtToolkitUtils.addDomEventListener(input, DvtKeyboardEvent.KEYDOWN, this._htmlTextAreaListenerFunc, false);
    DvtToolkitUtils.addDomEventListener(input, DvtKeyboardEvent.KEYUP, this._htmlTextAreaListenerFunc, false);
    DvtToolkitUtils.addDomEventListener(input, 'keypress', this._htmlTextAreaListenerFunc, false);   // legacy event handler, works everywhere
    DvtToolkitUtils.addDomEventListener(input, 'textInput', this._htmlTextAreaListenerFunc, false);   // Safari and Chrome
    DvtToolkitUtils.addDomEventListener(input, 'textinput', this._htmlTextAreaListenerFunc, false);   // DOM Level 3 Events draft
    //create a closure to redirect to the instance function so we have a valid "this" pointer in the listener
    this._editBlurFunc = function(event) {
      thisRef.impl__blurEditText();
    };
    //listen for blur event to know when editing has stopped
    DvtToolkitUtils.addDomEventListener(input, 'blur', this._editBlurFunc, false);
    this._bEventListener = true;
  }
  //save value at end because other function calls above may depend on old value
  this._bEditing = bEditing;
};


/**
  *   Returns the horizontal pixel width of the edit field set by {@link DvtText#setEditWidth}.
  *    @type {number} the horizontal pixel width of the edit field.
  */
DvtText.prototype.impl_getEditWidth = function(pxWidth)
{
  return this._editPxWidth;
};


/**
  *    Defines the horizontal pixel width to contain the edit field.  This should be
  *    set before applying setEditMode(true).  If not specified,a size based on the
  *    number of characters in the DvtText is used.
  *    @param pxWidth {number} the horizontal pixel width to contain the edit field.
  */
DvtText.prototype.impl_setEditWidth = function(pxWidth)
{
  this._editPxWidth = pxWidth;
  this._alignTextForEdit();
};

DvtText.prototype.impl_setEditTooltip = function(sTip)
{
  this._editTooltip = sTip;
};


/*
DvtText.prototype.impl_getEditBorder = function(bShow)
{
  return this._editBorder ;
};


DvtText.prototype.impl_setEditBorder = function(bShow)
{
  this._editBorder = bShow ;
  if (this._editElem)
    this._editElem.setAttribute("style", "border: " + bShow? ";" : "none;") ;
    this._editElem.setAttribute("style", "border-width: " + bShow? "1;" : "none;") ;
};
*/


/**
 * @private
 * Handle keyboard event on the HTML text area used for editing.
 * @param {KeyboardEvent} event Native keyboard event
 */
DvtText.prototype.impl__handleHtmlTextAreaKeyboardEvent = function(event) {

  //filter the event
  //TO DO: this filtering may need to happen on the native event, which is handled in DvtHtmlKeyboardListenerUtils...
  DvtText._editFilter(event);
  //BUG 16901294: the HTML text area will be flagged so that DvtHtmlKeyboardListenerUtils ignores its native events,
  //and we want to dispatch events from the DvtText
  this.getObj().dispatchDisplayableEvent(event.type, DvtSvgEventFactory.newEvent(event, this.getCtx()));
};

DvtText._editFilter = function(event)
{
  var e = event || window.event;

  if (e.type == 'textinput' || e.type == 'textInput')
  {   //  for future filtering use
  }
  else if (e.type == 'keypress')
  {
    var code = e.charCode || e.keyCode;
    if (code < 32)                           // ascii ctl char?
    {
      if (code == 13) {                       // filter out CR
        if (e.preventDefault)
          e.preventDefault();
      }
    }
  }
};

DvtText.prototype.impl_selectEditText = function() {
  if (this._editElem) {
    this._editElem.select();
  }
};

DvtText.prototype.impl_focusEditText = function() {
  //BUG 16901294: actively editing when text field receives focus
  this.impl_SetEditing(true);
  if (this._editElem) {
    //set focus on HTML text area on timeout so that it will take precedence over any other elements that
    //may want to receive focus
    var thisRef = this;
    var func = function() {thisRef._editElem.focus();};
    window.setTimeout(func, 0);
  }
};


/**
 * @private
 * Remove focus from the HTML text area and stop editing.
 */
DvtText.prototype.impl__blurEditText = function() {
  this.impl_SetEditing(false);
};


/**
 * @private
 * Remove the default font attributes that are set in the constructor
 * Used the font attributes in the DvtCSSStyle instead
 * @param {DvtCssStyle} style The DvtCSSStyle of this object.
 */
DvtText.prototype.impl__removeDefaultFontAttributes = function(elem)
{
  DvtToolkitUtils.removeAttrNullNS(elem, 'font-family');
  DvtToolkitUtils.removeAttrNullNS(elem, 'fill');
};


DvtText.prototype.impl__createTSpan = function(text, parentElem) {
  var tspan = DvtSvgShapeUtils.createElement('tspan', undefined);
  if (parentElem) {
    DvtToolkitUtils.appendChildElem(parentElem, tspan);
  }
  else {
    DvtToolkitUtils.appendChildElem(this.getElem(), tspan);
  }

  var baseline = DvtToolkitUtils.getAttrNullNS(this.getElem(), 'dominant-baseline');
  if (baseline)
    DvtToolkitUtils.setAttrNullNS(tspan, 'dominant-baseline', baseline);
  var anchor = DvtToolkitUtils.getAttrNullNS(this.getElem(), 'text-anchor');
  if (anchor)
    DvtToolkitUtils.setAttrNullNS(tspan, 'text-anchor', anchor);

  // add text node
  if (text) {
    this.impl__addTextNode(tspan, text);
  }
  return tspan;
};


DvtText.prototype.impl__createTextNode = function(text) {
  this.impl__addTextNode(this.getElem(), text);
};

DvtText.prototype.impl__addTextNode = function(elem, text) {
  var textNode = document.createTextNode(text);
  if (elem) {
    DvtToolkitUtils.appendChildElem(elem, textNode);
  }
  else {
    DvtToolkitUtils.appendChildElem(this.getElem(), textNode);
  }
};


//Bug 13879007 - NODE RENDERED INCORRECTLY IN IE9
/**
 * Returns the y translation used to compensate for IE's lack of dominant-baseline support
 *
 * @return {number} the y translation
 */
DvtText.prototype._getBaselineTranslation = function() {
  //if not in IE, no adjustment required
  var dy = 0;
  if (this._baseline != null) {
    //default fontSize to 11px
    var fontSize = DvtToolkitUtils.getAttrNullNS(this.getElem(), 'font-size');
    if (!fontSize) {
      fontSize = DvtToolkitUtils.getAttrNullNS(this.getOuterElem(), 'font-size');
      if (!fontSize) {
        fontSize = '11';
      }
    }
    dy = this._baseline * parseFloat(fontSize);
  }
  return dy;
};


/**
 * Returns the specified matrix adjusted by the baseline (if any)
 *
 * @param {DvtMatrix} the matrix to adjust
 *
 * @return {DvtMatrix} the adjusted matrix
 */
DvtText.prototype._getBaselineAdjustedMatrix = function(mat) {
  if (this._baseline != null) {
    // this._baseline is only set for IE
    if (!mat) {
      mat = new DvtMatrix();
    }
    var nmat = new DvtMatrix(null, null, null, null, null, this._getBaselineTranslation());
    nmat.concat(mat);
    mat = nmat;
  }
  return mat;
};


/**
 *  @override
 *  Set the transformation matrix for DvtText
 *  @param {DvtMatrix} mat transformation matrix
 */
DvtText.prototype.setMatrix = function(mat) {
  if (DvtAgent.isPlatformIE()) {
    this._matrixForIE = mat;
    mat = this._getBaselineAdjustedMatrix(mat);
    //BUG 18324259 - ie11: html5 hv search field has very small font and vertical scroll bar visible
    //Update the edit rect element transformation as well
    this._updateEditRectElem();
  }
  DvtText.superclass.setMatrix.call(this, mat);
};


/**
 *  @override
 */
DvtText.prototype.getMatrix = function() {
  var matrix = null;
  if (DvtAgent.isPlatformIE()) {
    matrix = this._matrixForIE;
  }
  if (!matrix) {
    matrix = DvtText.superclass.getMatrix.call(this);
  }
  return matrix;
};


/**
 * @override
 */
DvtText.prototype.GetSvgDimensions = function() {
  var bbox = DvtText.superclass.GetSvgDimensions.call(this);

  //Bug 13879007 - NODE RENDERED INCORRECTLY IN IE9
  if (bbox)
    bbox.y += this._getBaselineTranslation();

  return bbox;
};


/**
 * @private
 * Create HTML Text area in the DOM
 *
 * @param {DvtText} obj  DvtText object
 * @param {HTMLElement} textElem  DOM Text element
 * @param {String} editText  Input text
 * @return {HTMLElement}  DOM Html Textarea
 */
DvtText.prototype.impl__createHtmlTextArea = function(obj, textElem, editText) {
  var input = document.createElement('textArea');
  this._editElem = input;
  this._editElem._obj = this;

  var bbox = obj.getDimensions();
  var txt = editText;
  var cssStyle = obj.getCSSStyle();
  var cssSize;
  var cssFamily;
  var cols = 0;       // textArea cols

  if (! cssStyle) {
    cssSize = DvtToolkitUtils.getAttrNullNS(textElem, 'font-size') || '11';
    cssFamily = DvtToolkitUtils.getAttrNullNS(textElem, 'font-family');
    cssStyle = new DvtCSSStyle('font-family:' + cssFamily + ';' + ' font-size: ' + cssSize + 'px;');
  } else {
    //clone the style for text area
    cssStyle = cssStyle.clone();
    //if css doesn't have font-size, initialize it
    cssSize = cssStyle.getStyle('font-size');
    if (!cssSize) {
      cssSize = DvtToolkitUtils.getAttrNullNS(textElem, 'font-size') || '11';
      cssStyle.setStyle('font-size', cssSize);
    }
    //if css doesn't have font-family, initialize it
    cssFamily = cssStyle.getStyle('font-family');
    if (!cssFamily) {
      cssFamily = DvtToolkitUtils.getAttrNullNS(textElem, 'font-family');
      cssStyle.setStyle('font-family', cssFamily);
    }
  }

  if (this._editPxWidth) {                            // pixel width is expected!
    // Figure out text char width to get approximate cols
    var t = new DvtText(obj.getCtx(), 'W');
    t.impl_setCSSStyle(cssStyle);
    t.alignMiddle();
    obj.getParent().addChild(t);
    var dims = t.getDimensions();
    obj.getParent().removeChild(t);
    cols = (this._editPxWidth / dims.w);
    bbox.w = this._editPxWidth;
  }
  else {                                              // no pixel width!
    if (bbox.w == 0) {                               // just use some default value so
      bbox.w = 10;                                  // that its at least visible.
    }
    this._editPxWidth = bbox.w * 2;
    cols = 2;
  }
  cols = Math.floor(cols * 1.5);                       // heuristic for cols

  input.setAttribute('rows', '1');
  input.setAttribute('cols', cols);           // cols determines edit box width
  if (txt) {
    input.value = txt;
  }
  else {
    input.value = '';
  }

  if (this._editTooltip) {
    input.setAttribute('title', this._editTooltip);
  }

  //BUG 18324259 - ie11: html5 hv search field has very small font and vertical scroll bar visible
  //By Default all versions of IE has scrollbar on textareas even when they are empty.
  //Setting the overflow attribute to hidden will hide the textarea scrollbar for all browsers
  cssStyle.setStyle('outline-offset', '0px');
  cssStyle.setStyle('overflow', 'hidden');
  cssStyle.setStyle('border', 'none');
  cssStyle.setStyle('border-width', '0px');
  cssStyle.setStyle('margin', '0px');
  cssStyle.setStyle('resize', 'none');
  cssStyle.setStyle('outline', 'none');
  cssStyle.setStyle('dominant-baseline', DvtToolkitUtils.getAttrNullNS(textElem, 'dominant-baseline'));
  //important attributes overrides the default font-size of text area in HTML DOM
  cssStyle.setStyle('font-size', cssSize + 'px !important');

  //BUG 16901294: absolutely position the HTML text area over the DvtText
  var localPoint = new DvtPoint(this.getX(), this.getY());
  var stagePoint = this.getObj().localToStage(localPoint);
  cssStyle.setStyle('position', 'absolute');
  cssStyle.setStyle('top', stagePoint.y + 'px');
  cssStyle.setStyle('left', stagePoint.x + 'px');
  cssStyle.setStyle('vertical-align', 'baseline');
  cssStyle.setStyle('outline-offset', '0px');

  var padding = 2;
  if (DvtAgent.isRightToLeft(this.getObj().getCtx())) {
    cssStyle.setStyle('text-align', 'right');
    cssStyle.setStyle('padding', '0px ' + padding + 'px 0px 0px');
  }
  else {
    cssStyle.setStyle('text-align', 'left');
    cssStyle.setStyle('padding', '0px 0px 0px ' + padding + 'px');
  }
  cssStyle.setStyle('width', bbox.w + 'px'); //set the css width of text area to the DvtText width
  // add clip rectangle - rect (top, right, bottom, left) - add 2px to account for the borders, seems that clip clips too early
  var savedRect = this._editElemClipRect || {};
  var top = savedRect.top ? savedRect.top : bbox.y;
  var right = savedRect.right ? savedRect.right : (bbox.x + bbox.w + 2);
  var bottom = savedRect.bottom ? savedRect.bottom : (bbox.y + bbox.h);
  var left = savedRect.left ? savedRect.left : bbox.x;
  cssStyle.setStyle('clip', 'rect(' + top + 'px,' + right + 'px,' + bottom + 'px,' + left + 'px)');
  input.setAttribute('style', cssStyle.toString());
  if (this._editElemClipRect)
    delete this._editElemClipRect;

  //Since input text has only 1 row, disable word wrap for all browsers
  input.setAttribute('wrap', 'off');

  //BUG 16901294: mark the HTML text area so that DvtHtmlKeyboardListenerUtils will ignore its native events,
  //because the div that DvtHtmlKeyboardListenerUtils listens on will also get the text area events
  input[DvtHtmlKeyboardListenerUtils.ATTR_IGNORE_EVENTS_FROM_TARGET] = true;

  return input;
};

DvtText.prototype.impl_AddElemListener = function(type, listener, useCapture) {
  if (this.impl_getEditMode() && this._editElem) {
    DvtToolkitUtils.addDomEventListener(this._editElem, type, listener, useCapture);
    if (type == DvtTouchEvent.TOUCHEND) {
      DvtToolkitUtils.addDomEventListener(this._editElem, DvtTouchEvent.TOUCHCANCEL, listener, useCapture);
    }
  }

  DvtText.superclass.AddElemListener.call(this, type, listener, useCapture);
};


//BUG 16901294: when editing, getElem() will not return the text element, so provide a function
//that will always do that
/**
 * @protected
 * Get the text DOM element.
 */
DvtText.prototype.impl_GetTextElem = function() {
  return this._elem;
};


/**
 * Removes existing textarea from the DOM including listeners attached to it
 */
DvtText.prototype.impl_destroy = function() {
  if (this._editElem) {
    this.impl_SetEditing(false);
    this._editElem = null;
  }
};


/**
 * Returns the editing state for the object
 * @param {boolean} true if the editable text is currently being edited
 */
DvtText.prototype.impl_isEditing = function() {
  return this._bEditing;
};


/**
 * Returns true if the text anchor needs to be flipped from "start" to "end" and vice versa.
 * @param {DvtContext} dvtContext
 * @return {boolean}
 */
DvtText.needsTextAnchorAdjustment = function(dvtContext) {
  // Bug 17776065: When html dir="rtl", Webkit and FF25+ treat the right side of the text as the start, and the left
  // side of the text as end.  Our API always treats the left side as start, so we need to adjust based on agent.
  return DvtAgent.isRightToLeft() &&
         (DvtAgent.isPlatformWebkit() || (DvtAgent.isPlatformGecko() && DvtAgent.getVersion() >= 25));
};

/**
 * Save clip rectangle that will be used on textarea element if necessary. See CSS clip property documentation for details.
 * @param {number} top top position for the clip rectangle
 * @param {number} right right position for the clip rectangle
 * @param {number} bottom bottom position for the clip rectangle
 * @param {number} left left position for the clip rectangle
 */
DvtText.prototype.updateClipRect = function(top, right, bottom, left) {
  this._editElemClipRect = {};
  this._editElemClipRect.top = top;
  this._editElemClipRect.right = right;
  this._editElemClipRect.bottom = bottom;
  this._editElemClipRect.left = left;
};


/**
 * Updates text area position and clip rectangle
 * @private
 */
DvtText.prototype._updateEditElement = function() {
  if (this._editElem) {
    //update element position
    var localPoint = new DvtPoint(this.getX(), this.getY());
    var stagePoint = this.getObj().localToStage(localPoint);
    this._editElem.style.top = stagePoint.y + 'px';
    this._editElem.style.left = stagePoint.x + 'px';

    //find clip rectangle values - everything between parentheses - rect(0px 50px 60px 0px)
    //and update them
    var clip = this._editElem.style.clip;
    var clipData = /\(([^)]+)\)/.exec(clip);
    if (clipData[1] && this._editElemClipRect) {
      var values = clipData[1].split(' ');
      var savedRect = this._editElemClipRect;
      var top = savedRect.top ? savedRect.top + 'px' : values[0];
      var right = savedRect.right ? savedRect.right + 'px' : values[1];
      var bottom = savedRect.bottom ? savedRect.bottom + 'px' : values[2];
      var left = savedRect.left ? savedRect.left + 'px' : values[3];
      var clipRectValue = 'rect(' + top + ' ' + right + ' ' + bottom + ' ' + left + ')';
      this._editElem.style.clip = clipRectValue;
      this._editElemClipRect = undefined;
    }
  }
};
// Copyright (c) 2008, 2015, Oracle and/or its affiliates. All rights reserved.
/*-------------------------------------------------------------------------*/
/*   DvtTextFormatted                   TextFormatted "shape"              */
/*-------------------------------------------------------------------------*/
/**
 * Creates an instance of DvtTextFormatted.
 * @extends  {DvtShape}
 * @class DvtTextFormatted
 * @constructor
 * @param {DvtContext} dvtContext
 * @param x {number} x the x position
 * @param y {number} y the y position
 * @param {String} id  Optional ID for the shape (see {@link  DvtDisplayable#setId}).
 */
var DvtTextFormatted = function(dvtContext, x, y, id) {
  this.Init(dvtContext, x, y, id);
};

DvtObj.createSubclass(DvtTextFormatted, DvtText, 'DvtTextFormatted');

DvtTextFormatted.BOLD = 'b';
DvtTextFormatted.BREAK = 'br';
DvtTextFormatted.ITALIC = 'i';
DvtTextFormatted.LIST_ITEM = 'li';
DvtTextFormatted.ORDERED_LIST = 'ol';
DvtTextFormatted.PARAGRAPH = 'p';
DvtTextFormatted.UNORDERED_LIST = 'ul';


/**
 * Initializes this instance of DvtTextFormatted.
 */
DvtTextFormatted.prototype.Init = function(dvtContext, x, y, id) {
  DvtTextFormatted.superclass.Init.call(this, dvtContext, '', x, y, id);

  this._bHtmlText = true;
};


/**
 * Returns the textFormatted string for this textFormatted object.
 * @return {string} the textFormatted string
 */
DvtTextFormatted.prototype.getText = function() {
  return this.impl_getText();
};


/**
 * Sets the textFormatted string for this textFormatted object.
 * @param {string} textFormattedStr the textFormatted string
 */
DvtTextFormatted.prototype.setText = function(text) {
  this.impl_setText(text);

};


/**
 * @override
 */
DvtTextFormatted.prototype.GetDimsForCaching = function() {
  var dim = this.getDimensions();
  //make sure that dimensions at least start at specified x so that
  //horizontal indentation for lists is taken into account
  var xx = this.getX();
  if (dim.x > xx) {
    dim.w = dim.w + (dim.x - xx);
    dim.x = xx;
  }
  return dim;
};


/**
 * @override
 */
DvtTextFormatted.prototype.copyShape = function()
{
  var copy = new DvtTextFormatted(this.getCtx(), this.getX(), this.getY());
  copy.setText(this.getText());
  return copy;
};


/**
 * Sets the text string for this textArea object.
 * @param {array} single line text or multiline text
 */
DvtTextFormatted.prototype.impl_setText = function(text) {
  // parse the formatted text
  var obj = this.getObj();
  var parser = new DvtXmlParser(obj.getCtx());

  // wrap around the text with a tag to make the dom parser happy
  var newText = '<root>' + text + '</root>';
  var node = parser.parse(newText);

  if (node) {
    //disable vertical indentation until something is rendered, so
    //that we don't render empty lines at the top
    this._bEnableVertIndent = false;
    this.impl__parseChildren(node, null, 0, false, false);
  }

};

DvtTextFormatted.prototype.impl__parseChildren = function(node, currTspan, nestedListLevel, bFirstListItem, bListItem) {
  var childNodes = node.getAllChildNodes();
  var childCnt = childNodes.length;

  var bPrevP = false;
  for (var i = 0; i < childCnt; i++) {
    var child = childNodes[i];
    if (child) {
      var childName = child.getName();

      //if <p>, then need to shift all subsequent siblings
      //by additional amount at end of paragraph
      if (bPrevP &&
          childName !== DvtTextFormatted.PARAGRAPH &&
          childName !== DvtTextFormatted.ORDERED_LIST &&
          childName !== DvtTextFormatted.UNORDERED_LIST) {
        var pTspan = this.impl__handleMarkup(DvtTextFormatted.PARAGRAPH, currTspan);
        currTspan = pTspan;
      }
      bPrevP = false;

      // text node
      if (childName === '#text') {
        var strText = child.getNodeValue();
        if (bListItem) {
          strText = '- ' + strText;
        }
        this.impl__addTextNode(currTspan, strText);
        //enable vertical indentation now that we've rendered something
        this._bEnableVertIndent = true;
      }
      // element
      else {
        var tspan = this.impl__handleMarkup(childName, currTspan, nestedListLevel, bFirstListItem);

        var childNestedListLevel = nestedListLevel;
        var childBFirstListItem = false;
        if (childName === DvtTextFormatted.ORDERED_LIST ||
            childName === DvtTextFormatted.UNORDERED_LIST) {
          if (childNestedListLevel == 0) {
            childBFirstListItem = true;
          }
          childNestedListLevel++;
        }

        this.impl__parseChildren(child, tspan, childNestedListLevel, childBFirstListItem, (childName === DvtTextFormatted.LIST_ITEM));

        //if <br>, then need to shift all subsequent siblings
        if (childName === DvtTextFormatted.BREAK) {
          currTspan = tspan;
        }
        //if <p>, then need to shift all subsequent siblings
        //by additional amount at end of paragraph
        if (childName === DvtTextFormatted.PARAGRAPH ||
            ((childName === DvtTextFormatted.ORDERED_LIST ||
              childName === DvtTextFormatted.UNORDERED_LIST) &&
             nestedListLevel < 1)) {
          bPrevP = true;
        }
        //if processed the first <li>, then toggle the flag to false
        if (childName === DvtTextFormatted.LIST_ITEM) {
          bFirstListItem = false;
        }
      }
    } //end if (child)
  } //end for (var i = 0; i < childCnt; i++)
};


// handle html markup
DvtTextFormatted.prototype.impl__handleMarkup = function(nodeName, currTspan, nestedListLevel, bFirstListItem) {
  // create tspan
  var tspan = this.impl__createTSpan(null, currTspan);

  // element
  if (nodeName === DvtTextFormatted.BOLD) {
    DvtToolkitUtils.setAttrNullNS(tspan, 'font-weight', 'bold');
  }
  else if (nodeName === DvtTextFormatted.ITALIC) {
    DvtToolkitUtils.setAttrNullNS(tspan, 'font-style', 'italic');
  }
  else if (nodeName === DvtTextFormatted.BREAK) {
    DvtToolkitUtils.setAttrNullNS(tspan, 'x', '0');
    DvtToolkitUtils.setAttrNullNS(tspan, 'dy', '1em');
  }
  else if (nodeName === DvtTextFormatted.PARAGRAPH) {
    if (this._bEnableVertIndent) {
      DvtToolkitUtils.setAttrNullNS(tspan, 'x', '0');
      DvtToolkitUtils.setAttrNullNS(tspan, 'dy', '2em');
    }
    //enable vertical indentation now that we've rendered something
    this._bEnableVertIndent = true;
  }
  else if (nodeName === DvtTextFormatted.ORDERED_LIST ||
           nodeName === DvtTextFormatted.UNORDERED_LIST) {
  }
  else if (nodeName === DvtTextFormatted.LIST_ITEM) {
    DvtToolkitUtils.setAttrNullNS(tspan, 'x', (nestedListLevel) + 'em');
    if (this._bEnableVertIndent) {
      if (bFirstListItem) {
        DvtToolkitUtils.setAttrNullNS(tspan, 'dy', '2em');
      }
      else {
        DvtToolkitUtils.setAttrNullNS(tspan, 'dy', '1em');
      }
    }
    //enable vertical indentation now that we've rendered something
    this._bEnableVertIndent = true;
  }
  //     DvtToolkitUtils.setAttrNullNS(tspan, 'text-decoration', 'underline');

  return tspan;
};


/**
 * Style Utilities
 * @class DvtAfStyleUtils
 * @constructor
 */
var DvtAfStyleUtils = function() {
};

DvtObj.createSubclass(DvtAfStyleUtils, DvtObj, 'DvtAfStyleUtils');

/*
 * styleClasses
 */
DvtAfStyleUtils.AFStretchWidth_STYLE_CLASS = 'AFStretchWidth';
DvtAfStyleUtils.AFAuxiliaryStretchWidth_STYLE_CLASS = 'AFAuxiliaryStretchWidth';

DvtAfStyleUtils.AFHVNodeTitleLabelStyle_STYLE_CLASS = 'AFHVNodeTitleLabelStyle';
DvtAfStyleUtils.AFHVNodeSubtitleLabelStyle_STYLE_CLASS = 'AFHVNodeSubtitleLabelStyle';
DvtAfStyleUtils.AFHVNodeLabelStyle_STYLE_CLASS = 'AFHVNodeLabelStyle';
DvtAfStyleUtils.AFHVPanelCardLabelStyle_STYLE_CLASS = 'AFHVPanelCardLabelStyle';

DvtAfStyleUtils.AFHVNodeTitleLabelStyle75_STYLE_CLASS = 'AFHVNodeTitleLabelStyle75';
DvtAfStyleUtils.AFHVNodeSubtitleLabelStyle75_STYLE_CLASS = 'AFHVNodeSubtitleLabelStyle75';
DvtAfStyleUtils.AFHVNodeLabelStyle75_STYLE_CLASS = 'AFHVNodeLabelStyle75';
DvtAfStyleUtils.AFHVPanelCardLabelStyle75_STYLE_CLASS = 'AFHVPanelCardLabelStyle75';

DvtAfStyleUtils.AFHVNodeTitleLabelStyle50_STYLE_CLASS = 'AFHVNodeTitleLabelStyle50';
DvtAfStyleUtils.AFHVNodeSubtitleLabelStyle50_STYLE_CLASS = 'AFHVNodeSubtitleLabelStyle50';
DvtAfStyleUtils.AFHVNodeLabelStyle50_STYLE_CLASS = 'AFHVNodeLabelStyle50';

DvtAfStyleUtils.AFHVNodeLabelStyle25_STYLE_CLASS = 'AFHVNodeLabelStyle25';

DvtAfStyleUtils.getTagSkinKeyMap = function() {
  /*
   * This map is only created when we run in local mode
   * key: component short name
   * val: list of selectors
   */
  if (DvtAfStyleUtils._tagSkinKeyMap === undefined) {
    var tagSkinKeyMap = {};

    tagSkinKeyMap['cb'] = ('af_commandButton,af_commandButton_icon-style,af_commandButton_text-by-icon-style,af_commandButton_active,af_commandButton_hover,af_commandButton.p_AFDisabled').split(',');
    tagSkinKeyMap['cil'] = ('af_commandImageLink,af_commandImageLink_image,af_commandImageLink_text,af_commandImageLink_active,af_commandImageLink_hover,af_commandImageLink.p_AFDisabled').split(',');
    tagSkinKeyMap['cl'] = ('af_commandLink,af_commandLink_active,af_commandLink_hover,af_commandLink.p_AFDisabled').split(',');
    tagSkinKeyMap['cmi'] = ('af_commandMenuItem,af_commandMenuItem_menu-item,af_commandMenuItem_menu-item-icon-style,af_commandMenuItem_menu-item-text,af_commandMenuItem.p_AFHighlighted_menu-item-text,af_commandMenuItem.p_AFDisabled').split(',');
    tagSkinKeyMap['gb'] = ('af_goButton,af_goButton_icon-style,af_goButton_text-by-icon-style,af_goButton_active,af_goButton_hover,af_goButton.p_AFDisabled').split(',');
    tagSkinKeyMap['gl'] = ('af_goLink,af_goLink_active,af_goLink_hover,af_goLink.p_AFDisabled').split(',');
    tagSkinKeyMap['i'] = ('af_image').split(',');
    tagSkinKeyMap['m'] = ('af_menu,af_menu_bar-item,af_menu_bar-item-icon-style,af_menu_bar-item-text,af_menu_bar-item-open-icon-style,af_menu_bar-item.p_AFDepressed,af_menu_bar-item.p_AFHighlighted,af_menu.p_AFDisabled').split(',');

    tagSkinKeyMap['pfl'] = ('af_panelFormLayout,AFPanelFormLayoutContentCell,af_panelFormLayout_label-cell').split(',');
    tagSkinKeyMap['pgl'] = ('af_panelGroupLayout').split(',');
    tagSkinKeyMap['plm'] = ('af_panelLabelAndMessage,af_panelLabelAndMessage_label,af_panelLabelAndMessage_content-cell').split(',');
    tagSkinKeyMap['se'] = ('af_separator').split(',');
    tagSkinKeyMap['lk'] = ('af_link,af_link_image,af_link_text,af_link_image-hover,af_link_image-depressed,af_link_active,af_link_hover,af_link.p_AFDisabled').split(',');
    tagSkinKeyMap['bt'] = ('af_button,af_button_image,af_button_text,af_button_image-hover,af_button_image-depressed,af_button_link,af_button_leading-text,af_button_depressed,af_button_hover,af_button.p_AFDisabled').split(',');


    DvtAfStyleUtils._tagSkinKeyMap = tagSkinKeyMap;
  }
  return DvtAfStyleUtils._tagSkinKeyMap;
};


/**
 * This method is called when parsing afCompoennt selectors map <st [tag=skin keys]+>
 * @param {object} selectors  Selectors object
 * @param {object} afStyles   AFStyles object
 */
DvtAfStyleUtils.setTagSkinKeyMap = function(selectors, afStyles) {

  //reload styles
  if (afStyles && afStyles.length > 0) {

    var afStylestyleMap = {};
    for (var i = 0; i < afStyles.length; i++) {
      var styles = afStyles[i];
      // default font
      if (styles.name == 'defaultFont') {
        var font = new DvtCSSStyle(styles.value);
        DvtAfStyleUtils._setDefaultFontFamily(font.getStyle(DvtCSSStyle.FONT_FAMILY));
        DvtAfStyleUtils._setDefaultFontSize(font.getStyle(DvtCSSStyle.FONT_SIZE));
        DvtAfStyleUtils._setDefaultFontColor(font.getStyle(DvtCSSStyle.COLOR));
      }
      else if (styles.name && styles.value != undefined) {
        afStylestyleMap[styles.name] = new DvtCSSStyle(styles.value);
      }
    }
    DvtAfStyleUtils._styleMap = afStylestyleMap;
  }

  if (selectors && selectors.length > 0) {

    var selList = '';
    var tagSkinKeyMap = {};
    for (var i = 0; i < selectors.length; i++) {
      var compSels = selectors[i];
      if (compSels.name && compSels.value !== undefined) {
        var tmpSels = compSels.value.split(',');
        tagSkinKeyMap[compSels.name] = tmpSels;

        if (! DvtAfStyleUtils._styleMap) {
          for (var j = 0; j < tmpSels.length; j++) {
            selList += tmpSels[j] + ' ';
          }
        }
      }
    }
    DvtAfStyleUtils._tagSkinKeyMap = tagSkinKeyMap;
  }

  //TODO: getStyleMap from css styleSheets
  //  DvtStylesUtils._styleMap = AdfDhtmlCommonFlash.getAllStyles(selList);

};


/**
 * Set tag skin keymap for Json Styles
 * @param {object} selectors  Selectors JSON object
 * @param {object} afStyles   AFStyles JSON object
 */
DvtAfStyleUtils.setTagSkinKeyMapJSON = function(selectors, afStyles) {

  //reload styles
  if (afStyles) {
    var afStylestyleMap = {};
    for (var key in afStyles) {
      if (afStyles.hasOwnProperty(key)) {
        var value = afStyles[key];
        // default font
        if (key == 'defaultFont') {
          var font = new DvtCSSStyle(value);
          DvtAfStyleUtils._setDefaultFontFamily(font.getStyle(DvtCSSStyle.FONT_FAMILY));
          DvtAfStyleUtils._setDefaultFontSize(font.getStyle(DvtCSSStyle.FONT_SIZE));
          DvtAfStyleUtils._setDefaultFontColor(font.getStyle(DvtCSSStyle.COLOR));
        }
        else if (key && value != undefined) {
          afStylestyleMap[key] = new DvtCSSStyle(value);
        }
      }
    }
    DvtAfStyleUtils._styleMap = afStylestyleMap;
  }


  if (selectors) {

    var selList = '';
    var tagSkinKeyMap = {};
    for (var key in selectors) {
      if (selectors.hasOwnProperty(key)) {
        var value = selectors[key];
        if (key && value !== undefined) {
          var tmpSels = value.split(',');
          tagSkinKeyMap[key] = tmpSels;

          if (! DvtAfStyleUtils._styleMap) {
            for (var j = 0; j < tmpSels.length; j++) {
              selList += tmpSels[j] + ' ';
            }
          }
        }

      }
    }
    DvtAfStyleUtils._tagSkinKeyMap = tagSkinKeyMap;
  }

  //TODO: getStyleMap from css styleSheets
  //  DvtStylesUtils._styleMap = AdfDhtmlCommonFlash.getAllStyles(selList);

};

DvtAfStyleUtils.getDefaultButtonDisabledStyle = function() {
  return new DvtCSSStyle('color:#6E7587;border-style:solid;border-width:1px;border-color:#9297A6;border-top:1px solid #D5D5D5;border-right:1px solid #D5D5D5;border-bottom:1px solid #D5D5D5;border-left:1px solid #D5D5D5;background-image:-moz-linear-gradient(top, #F4F4F4 0%, #E5E5E5 100%)');
};

DvtAfStyleUtils.getDefaultCommandButtonDisabledStyle = function() {
  new DvtCSSStyle('color:#6E7587;border-style:solid;border-width:1px;border-color:#9297A6;border-top:1px solid #D5D5D5;border-right:1px solid #D5D5D5;border-bottom:1px solid #D5D5D5;border-left:1px solid #D5D5D5;background-image:-moz-linear-gradient(top, #F4F4F4 0%, #E5E5E5 100%)');
};

DvtAfStyleUtils.getDefaultGoButtonDisabledStyle = function() {
  return new DvtCSSStyle('color:#6E7587;border-style:solid;border-width:1px;border-color:#9297A6;border-top:1px solid #D5D5D5;border-right:1px solid #D5D5D5;border-bottom:1px solid #D5D5D5;border-left:1px solid #D5D5D5;background-image:-moz-linear-gradient(top, #F4F4F4 0%, #E5E5E5 100%)');
};

DvtAfStyleUtils.getDefaultLinkDisabledStyle = function() {
  return new DvtCSSStyle('color:#8E97AF');
};

DvtAfStyleUtils.getDefaultCommandLinkDisabledStyle = function() {
  new DvtCSSStyle('text-decoration:none;cursor:default;color:#8E97AF');
};

DvtAfStyleUtils.getDefaultCommandImageLinkDisabledStyle = function() {
  new DvtCSSStyle('color:#8E97AF');
};

DvtAfStyleUtils.getDefaultGoLinkDisabledStyle = function() {
  return new DvtCSSStyle('text-decoration:none;cursor:default;color:#8E97AF');
};


/**
 * @this {DvtAfStyleUtils}
 */
DvtAfStyleUtils.getStyleMap = function() {
  if (DvtAfStyleUtils._styleMap) {
  }
  /*
   * This map is only created when we run in local mode
   * key: selector
   * val: list of styles
   */
  else {
    var styleMap = {};

    styleMap['af_panelGroupLayout'] = new DvtCSSStyle('');
    styleMap['af_image'] = new DvtCSSStyle('border:0px');
    styleMap['af_separator'] = new DvtCSSStyle('border-bottom:1px solid #D6DFE6;margin-top:3px;margin-bottom:3px;border-top:0px;border-left:0px;border-right:0px');
    styleMap['af_panelFormLayout'] = new DvtCSSStyle('');
    styleMap['AFPanelFormLayoutContentCell'] = new DvtCSSStyle('padding-left:8px;padding-right:0px;text-align:left;font-family:Tahoma, Verdana, Helvetica, sans-serif;vertical-align:top;padding-top:2px;padding-bottom:0px;padding:1px 0 0 2px');
    styleMap['af_panelFormLayout_label-cell'] = new DvtCSSStyle('padding:0px 6px 0px 0px;padding-left:8px;padding-right:0px;text-align:right;padding-top:3px;padding-bottom:1px;white-space:nowrap');
    styleMap['af_panelLabelAndMessage'] = new DvtCSSStyle('');
    styleMap['af_panelLabelAndMessage_label'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-size:11px;text-align:right;color:#4F4F4F;padding:0px 6px 0px 0px;font-weight:normal');
    styleMap['af_commandButton'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#333333;border-top:1px solid #95B6D4;border-right:1px solid #95B6D4;border-bottom:1px solid #92B3D1;border-left:1px solid #95B6D4;border-radius:3px;background-image:-moz-linear-gradient(top, #CCE2F6 0%, #B1D2F2 100%);text-decoration:none;white-space:nowrap;margin:0px;padding-top:1px;padding-bottom:3px;padding:1px 1px 0px 2px;padding-left:6px;padding-right:6px');
    styleMap['af_commandButton_icon-style'] = new DvtCSSStyle('vertical-align:middle;border-width:0px;padding-left:0px;padding-right:0px');
    styleMap['af_commandButton_text-by-icon-style'] = new DvtCSSStyle('padding-left:3px');
    styleMap['af_commandButton_active'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#333333;border-top:1px solid #648BAF;border-right:1px solid #789FC4;border-bottom:1px solid #789FC4;border-left:1px solid #789FC4;background-image:-moz-linear-gradient(top, #6AA1D5 0%, #ACCAE6 100%)');

    styleMap['af_commandButton_hover'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#333333;border-top:1px solid #E2CB9B;border-right:1px solid #E2CB9B;border-bottom:1px solid #D4BB87;border-left:1px solid #E2CB9B;background-image:-moz-linear-gradient(top, #FFE4A8 0%, #FFD475 100%)');

    //    styleMap["af_commandButton.p_AFDisabled"] = new DvtCSSStyle("color:#6E7587;border-style:solid;border-width:1px;border-color:#9297A6;border-top:1px solid #D5D5D5;border-right:1px solid #D5D5D5;border-bottom:1px solid #D5D5D5;border-left:1px solid #D5D5D5;background-image:-moz-linear-gradient(top, #F4F4F4 0%, #E5E5E5 100%)");
    styleMap['af_commandButton.p_AFDisabled'] = DvtAfStyleUtils.getDefaultCommandButtonDisabledStyle();

    styleMap['af_commandLink'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#003286;text-decoration:none');
    styleMap['af_commandLink_hover'] = new DvtCSSStyle('text-decoration:underline');
    styleMap['af_commandLink_active'] = new DvtCSSStyle('color:#72007C');

    //    styleMap["af_commandLink.p_AFDisabled"] = new DvtCSSStyle("text-decoration:none;cursor:default;color:#8E97AF");
    styleMap['af_commandLink.p_AFDisabled'] = DvtAfStyleUtils.getDefaultCommandLinkDisabledStyle();

    styleMap['af_commandImageLink'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#003286;text-decoration:none;white-space:nowrap');

    styleMap['af_commandImageLink_image'] = new DvtCSSStyle('border:none;vertical-align:middle;display:inline');
    styleMap['af_commandImageLink_text'] = new DvtCSSStyle('margin-left:3px');
    styleMap['af_commandImageLink_hover'] = new DvtCSSStyle('text-decoration:underline');
    styleMap['af_commandImageLink_active'] = new DvtCSSStyle('color:#72007C');

    //    styleMap["af_commandImageLink.p_AFDisabled"] = new DvtCSSStyle("color:#8E97AF");
    styleMap['af_commandImageLink.p_AFDisabled'] = DvtAfStyleUtils.getDefaultCommandImageLinkDisabledStyle();

    styleMap['af_goButton'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#333333;border-top:1px solid #95B6D4;border-right:1px solid #95B6D4;border-bottom:1px solid #92B3D1;border-left:1px solid #95B6D4;border-radius:3px;background-image:-moz-linear-gradient(top, #CCE2F6 0%, #B1D2F2 100%);text-decoration:none;white-space:nowrap;margin:0px;padding-top:1px;padding-bottom:3px;padding:1px 1px 0px 2px;padding-left:6px;padding-right:6px');
    styleMap['af_goButton_icon-style'] = new DvtCSSStyle('vertical-align:middle;border-width:0px;padding-left:0px;padding-right:0px');
    styleMap['af_goButton_text-by-icon-style'] = new DvtCSSStyle('padding-left:3px');
    styleMap['af_goButton_active'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#333333;border-top:1px solid #648BAF;border-right:1px solid #789FC4;border-bottom:1px solid #789FC4;border-left:1px solid #789FC4;background-image:-moz-linear-gradient(top, #6AA1D5 0%, #ACCAE6 100%)');

    styleMap['af_goButton_hover'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#333333;border-top:1px solid #E2CB9B;border-right:1px solid #E2CB9B;border-bottom:1px solid #D4BB87;border-left:1px solid #E2CB9B;background-image:-moz-linear-gradient(top, #FFE4A8 0%, #FFD475 100%)');

    //    styleMap["af_goButton.p_AFDisabled"] = new DvtCSSStyle("color:#6E7587;border-style:solid;border-width:1px;border-color:#9297A6;border-top:1px solid #D5D5D5;border-right:1px solid #D5D5D5;border-bottom:1px solid #D5D5D5;border-left:1px solid #D5D5D5;background-image:-moz-linear-gradient(top, #F4F4F4 0%, #E5E5E5 100%)");
    styleMap['af_goButton.p_AFDisabled'] = DvtAfStyleUtils.getDefaultGoButtonDisabledStyle();

    styleMap['af_goLink'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#003286;text-decoration:none');
    styleMap['af_goLink_hover'] = new DvtCSSStyle('text-decoration:underline');
    styleMap['af_goLink_active'] = new DvtCSSStyle('color:#72007C');

    //    styleMap["af_goLink.p_AFDisabled"] = new DvtCSSStyle("text-decoration:none;cursor:default;color:#8E97AF");
    styleMap['af_goLink.p_AFDisabled'] = DvtAfStyleUtils.getDefaultGoLinkDisabledStyle();

    styleMap['af_link'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#003286;text-decoration:none;white-space:nowrap');
    styleMap['af_link_image'] = new DvtCSSStyle('border:none;vertical-align:middle;display:inline');
    styleMap['af_link_text'] = new DvtCSSStyle('margin-left:3px');
    styleMap['af_link_image-hover'] = new DvtCSSStyle('border:none;vertical-align:middle;display:none');
    styleMap['af_link_image-depressed'] = new DvtCSSStyle('border:none;vertical-align:middle;display:none');
    styleMap['af_link_active'] = new DvtCSSStyle('color:#72007C');
    styleMap['af_link_hover'] = new DvtCSSStyle('text-decoration:underline');

    //    styleMap["af_link.p_AFDisabled"] = new DvtCSSStyle("color:#8E97AF");
    styleMap['af_link.p_AFDisabled'] = DvtAfStyleUtils.getDefaultLinkDisabledStyle();

    styleMap['af_button'] = new DvtCSSStyle('display:inline-block;padding:0px;cursor:default;white-space:nowrap;min-height:19px;border-top:1px solid #95B6D4;border-right:1px solid #95B6D4;border-bottom:1px solid #92B3D1;border-left:1px solid #95B6D4;border-radius:3px;background-image:-moz-linear-gradient(top, #CCE2F6 0%, #B1D2F2 100%);font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#333333');
    styleMap['af_button_image'] = new DvtCSSStyle('vertical-align:middle;border:0px transparent;display:inline');
    styleMap['af_button_text'] = new DvtCSSStyle('white-space:nowrap;text-decoration:none;padding-left:3px;padding-right:0px;min-height:15px;display:inline-block;vertical-align:middle;line-height:1em;color:inherit');
    styleMap['af_button_image-hover'] = new DvtCSSStyle('vertical-align:middle;border:0px transparent;display:none');
    styleMap['af_button_image-depressed'] = new DvtCSSStyle('vertical-align:middle;border:0px transparent;display:none');
    styleMap['af_button_link'] = new DvtCSSStyle('text-decoration:none;cursor:default;display:block;white-space:nowrap;padding:2px 9px 1px 9px;color:inherit');
    styleMap['af_button_leading-text'] = new DvtCSSStyle('white-space:nowrap;text-decoration:none;padding-left:0px;padding-right:3px');
    styleMap['af_button_depressed'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#333333;border-top:1px solid #648BAF;border-right:1px solid #789FC4;border-bottom:1px solid #789FC4;border-left:1px solid #789FC4;background-image:-moz-linear-gradient(top, #6AA1D5 0%, #ACCAE6 100%)');
    styleMap['af_button_hover'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#333333;border-top:1px solid #E2CB9B;border-right:1px solid #E2CB9B;border-bottom:1px solid #D4BB87;border-left:1px solid #E2CB9B;background-image:-moz-linear-gradient(top, #FFE4A8 0%, #FFD475 100%)');

    //    styleMap["af_button.p_AFDisabled"] = new DvtCSSStyle("color:#6E7587;border-style:solid;border-width:1px;border-color:#9297A6;border-top:1px solid #D5D5D5;border-right:1px solid #D5D5D5;border-bottom:1px solid #D5D5D5;border-left:1px solid #D5D5D5;background-image:-moz-linear-gradient(top, #F4F4F4 0%, #E5E5E5 100%)");
    styleMap['af_button.p_AFDisabled'] = DvtAfStyleUtils.getDefaultButtonDisabledStyle();

    styleMap['af_menu'] = new DvtCSSStyle('');
    styleMap['af_menu_bar-item'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;cursor:default;white-space:nowrap;height:17px;padding:3px 1px 1px 1px;border-radius:3px');
    styleMap['af_menu_bar-item-icon-style'] = new DvtCSSStyle('padding-left:3px;padding-right:0px');
    styleMap['af_menu_bar-item-text'] = new DvtCSSStyle('min-height:16px;display:block;padding:0px 0px 0px 5px;white-space:nowrap;cursor:default;text-decoration:none;color:#000000;padding-left:5px;padding-right:0px');
    styleMap['af_menu_bar-item-open-icon-style'] = new DvtCSSStyle('background-repeat:no-repeat;height:7px;background-image:url(/afr/skyros-v1/menu_l23_button_dropdown_ena.png);background-position:center bottom;width:9px;padding-left:3px;padding-right:3px');

    styleMap['af_commandMenuItem'] = new DvtCSSStyle('');
    styleMap['af_commandMenuItem_menu-item'] = new DvtCSSStyle('font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#333333;height:21px;background-color:transparent');
    styleMap['af_commandMenuItem_menu-item-icon-style'] = new DvtCSSStyle('background-image:none;padding:0px;cursor:default;text-decoration:none;background-color:transparent;text-align:center;width:21px;border-top:none;border-bottom:none');
    styleMap['af_commandMenuItem_menu-item-text'] = new DvtCSSStyle('background-color:#FFFFFF;background-image:none;cursor:default;text-decoration:none;white-space:nowrap;color:#000000;padding:0px 10px 0px 0px;border-top:none;border-bottom:none');
    styleMap['af_commandMenuItem.p_AFHighlighted_menu-item-text'] = new DvtCSSStyle('border-top:none;border-bottom:none;background-color:#C1E6FF');

    DvtAfStyleUtils._styleMap = styleMap;
  }
  return DvtAfStyleUtils._styleMap;
};


/**
 * Get text-align based on reading direction.
 *
 * @return CSS "key:val" string for text-align attribute
 */
DvtAfStyleUtils._getTextAlignAttr = function(rightAlign) {
  if (DvtAfStyleUtils.isLocaleR2L()) {
    return rightAlign ? 'text-align:left' : 'text-align:right';
  }
  else {
    return rightAlign ? 'text-align:right' : 'text-align:left';
  }
};


/**
 * Get background-position based on reading direction.
 *
 * @return CSS "key:val" string for background-position attribute
 */
DvtAfStyleUtils.getBackgroundPositionAttr = function() {
  if (DvtAfStyleUtils.isLocaleR2L())
    return 'background-position:right bottom';
  else
    return 'background-position:left bottom';
};


/**
 * Get default panel card styles
 * @return {DvtCSSStyle} panel card style
 */
DvtAfStyleUtils.getDefaultPanelCardStyles = function() {
  var defStyle = new DvtCSSStyle();

  defStyle.setStyle(DvtCSSStyle.PADDING, '4px');
  defStyle.setStyle(DvtCSSStyle.FILL_TYPE, 'gradient');
  defStyle.setStyle(DvtCSSStyle.BORDER_TYPE, 'gradient');
  defStyle.setStyle(DvtCSSStyle.BACKGROUND_COLOR, '#E0EAEB');
  defStyle.setStyle(DvtCSSStyle.BORDER_WIDTH, '1px');
  defStyle.setStyle(DvtCSSStyle.BORDER_COLOR, '#98ABBC');

  var styleList = [];
  styleList.push(defStyle);
  return styleList;
};


/**
 * @param {String} AF component tag name
 * @return an array of DvtCSSStyle objects for the specified component
 */
DvtAfStyleUtils.getDefaultCSSStyle = function(tagName) {
  var styleList = [];
  if (tagName) {
    var skinMap = DvtAfStyleUtils.getTagSkinKeyMap();
    var selectors = skinMap[tagName];
    var styleMap = DvtAfStyleUtils.getStyleMap();
    if (selectors && selectors.length > 0 && styleMap) {
      for (var i = 0; i < selectors.length; i++) {
        var sel = selectors[i];
        if (sel && styleMap[sel]) {
          styleList.push(styleMap[sel]);
        }
        else {
          styleList.push(new DvtCSSStyle());
        }
      }
    }
    if (tagName == 'pc') {
      //if no default panelCard styles
      if (! DvtAfStyleUtils._panelCardMap) {
        DvtAfStyleUtils._panelCardMap = DvtAfStyleUtils.getDefaultPanelCardStyles();
      }
      return DvtAfStyleUtils._panelCardMap;
    }
  }

  return styleList;
};


/**
 * @param {String} AF component tag name
 * @return an array of DvtCSSStyle objects for the specified component
 */
DvtAfStyleUtils.getStyleClass = function(styleClassName) {

  var styleMap = DvtAfStyleUtils.getStyleMap();
  if (styleMap && styleClassName && styleMap[styleClassName]) {
    return styleMap[styleClassName];
  }

  return '';
};

//
DvtAfStyleUtils.getDefaultTextStyle = function() {

  var style = new DvtCSSStyle();
  // Default to Tomoha font family
  style.setStyle(DvtCSSStyle.FONT_FAMILY, DvtAfStyleUtils.getDefaultFontFamily());

  // Default to 11px
  style.setStyle(DvtCSSStyle.FONT_SIZE, DvtAfStyleUtils.getDefaultFontSize());

  // Default to black
  style.setStyle(DvtCSSStyle.COLOR, 'black');
  return style;
};

DvtAfStyleUtils.getAFStretchWidthStyle = function(styleClassName) {
  if (DvtAfStyleUtils.AFStretchWidth_STYLE_CLASS == styleClassName ||
      DvtAfStyleUtils.AFAuxiliaryStretchWidth_STYLE_CLASS == styleClassName) {

    if (! DvtAfStyleUtils._afStretchWidth) {
      DvtAfStyleUtils._afStretchWidth = new DvtCSSStyle();
      DvtAfStyleUtils._afStretchWidth.setStyle(DvtCSSStyle.WIDTH, '100%');
    }

    return DvtAfStyleUtils._afStretchWidth;
  }
  return null;
};

DvtAfStyleUtils.getPLAMLabelStyle = function(styleClasses) {
  if (styleClasses) {
    if (styleClasses.indexOf(DvtAfStyleUtils.AFHVNodeTitleLabelStyle75_STYLE_CLASS) > -1)
      return DvtAfStyleUtils.getStyleClass(DvtAfStyleUtils.AFHVNodeTitleLabelStyle75_STYLE_CLASS);

    if (styleClasses.indexOf(DvtAfStyleUtils.AFHVNodeSubtitleLabelStyle75_STYLE_CLASS) > -1)
      return DvtAfStyleUtils.getStyleClass(DvtAfStyleUtils.AFHVNodeSubtitleLabelStyle75_STYLE_CLASS);

    if (styleClasses.indexOf(DvtAfStyleUtils.AFHVNodeLabelStyle75_STYLE_CLASS) > -1)
      return DvtAfStyleUtils.getStyleClass(DvtAfStyleUtils.AFHVNodeLabelStyle75_STYLE_CLASS);

    if (styleClasses.indexOf(DvtAfStyleUtils.AFHVPanelCardLabelStyle75_STYLE_CLASS) > -1)
      return DvtAfStyleUtils.getStyleClass(DvtAfStyleUtils.AFHVPanelCardLabelStyle75_STYLE_CLASS);

    if (styleClasses.indexOf(DvtAfStyleUtils.AFHVNodeTitleLabelStyle50_STYLE_CLASS) > -1)
      return DvtAfStyleUtils.getStyleClass(DvtAfStyleUtils.AFHVNodeTitleLabelStyle50_STYLE_CLASS);

    if (styleClasses.indexOf(DvtAfStyleUtils.AFHVNodeSubtitleLabelStyle50_STYLE_CLASS) > -1)
      return DvtAfStyleUtils.getStyleClass(DvtAfStyleUtils.AFHVNodeSubtitleLabelStyle50_STYLE_CLASS);

    if (styleClasses.indexOf(DvtAfStyleUtils.AFHVNodeLabelStyle50_STYLE_CLASS) > -1)
      return DvtAfStyleUtils.getStyleClass(DvtAfStyleUtils.AFHVNodeLabelStyle50_STYLE_CLASS);

    if (styleClasses.indexOf(DvtAfStyleUtils.AFHVNodeLabelStyle25_STYLE_CLASS) > -1)
      return DvtAfStyleUtils.getStyleClass(DvtAfStyleUtils.AFHVNodeLabelStyle25_STYLE_CLASS);

    if (styleClasses.indexOf(DvtAfStyleUtils.AFHVNodeTitleLabelStyle_STYLE_CLASS) > -1)
      return DvtAfStyleUtils.getStyleClass(DvtAfStyleUtils.AFHVNodeTitleLabelStyle_STYLE_CLASS);

    if (styleClasses.indexOf(DvtAfStyleUtils.AFHVNodeSubtitleLabelStyle_STYLE_CLASS) > -1)
      return DvtAfStyleUtils.getStyleClass(DvtAfStyleUtils.AFHVNodeSubtitleLabelStyle_STYLE_CLASS);

    if (styleClasses.indexOf(DvtAfStyleUtils.AFHVNodeLabelStyle_STYLE_CLASS) > -1)
      return DvtAfStyleUtils.getStyleClass(DvtAfStyleUtils.AFHVNodeLabelStyle_STYLE_CLASS);

    if (styleClasses.indexOf(DvtAfStyleUtils.AFHVPanelCardLabelStyle_STYLE_CLASS) > -1)
      return DvtAfStyleUtils.getStyleClass(DvtAfStyleUtils.AFHVPanelCardLabelStyle_STYLE_CLASS);

  }
  return null;
};

DvtAfStyleUtils.setPanelCardDefault = function(styleList) {
  DvtAfStyleUtils._panelCardMap = styleList;
};

DvtAfStyleUtils.getDefaultFontFamily = function() {
  return DvtAfStyleUtils._defaultFontFamily ? DvtAfStyleUtils._defaultFontFamily : DvtStyleUtils.DEFAULT_FONT_FAMILY;
};

DvtAfStyleUtils._setDefaultFontFamily = function(family) {
  DvtAfStyleUtils._defaultFontFamily = family;
};

DvtAfStyleUtils.getDefaultFontSize = function() {
  return DvtAfStyleUtils._defaultFontSize ? DvtAfStyleUtils._defaultFontSize : DvtStyleUtils.DEFAULT_FONT_SIZE;
};

DvtAfStyleUtils._setDefaultFontSize = function(size) {
  DvtAfStyleUtils._defaultFontSize = size;
};

DvtAfStyleUtils.getDefaultFontColor = function() {
  return DvtAfStyleUtils._defaultFontColor ? DvtAfStyleUtils._defaultFontColor : DvtStyleUtils.DEFAULT_FONT_COLOR;
};

DvtAfStyleUtils._setDefaultFontColor = function(color) {
  DvtAfStyleUtils._defaultFontColor = color;
};

/**
 * Reset the initialized styles
 */
DvtAfStyleUtils.resetStyles = function() {
  DvtAfStyleUtils.setPanelCardDefault(null);
  DvtAfStyleUtils._setDefaultFontFamily(null);
  DvtAfStyleUtils._setDefaultFontSize(null);
  DvtAfStyleUtils._setDefaultFontColor(null);
  DvtAfStyleUtils._styleMap = undefined;
  DvtAfStyleUtils._tagSkinKeyMap = undefined;
  DvtAfStyleUtils._afStretchWidth = undefined;
};
/**
 * @constructor
 * @param {DvtContext} dvtContext
 * @param {DvtEventManager} eventManager
 */
var DvtAfContext = function(dvtContext, eventManager) {
  this.Init(dvtContext, eventManager);
};

DvtObj.createSubclass(DvtAfContext, DvtObj, 'DvtAfContext');

/**
 * Initialize
 * @param {DvtContext} dvtContext  Context object
 * @param {DvtEventManager} eventManager  Event manager
 */
DvtAfContext.prototype.Init = function(dvtContext, eventManager) {
  this._dvtContext = dvtContext;
  this.setEventManager(eventManager);

  // if available size is not specified, default to Number.MAX_VALUE
  this._aw = Number.MAX_VALUE;
  this._ah = Number.MAX_VALUE;

  // if font size is not specified
  this._fs = DvtAfStyleUtils.getDefaultFontSize();
};

/**
 *  Returns a platform dependent implementation of the one and only
 *  tooltip manager.
 *  @type {DvtTooltipManager}
 */
DvtAfContext.prototype.getTooltipManager = function() {
  return this.getCtx().getTooltipManager();
};

/**
 * Returns the application context.
 * @return {DvtContext}
 */
DvtAfContext.prototype.getCtx = function() {
  return this._dvtContext;
};

/**
 * get elContext
 */
DvtAfContext.prototype.getELContext = function() {
  return this._elContext;
};

/**
 * set elContext
 */
DvtAfContext.prototype.setELContext = function(elContext) {
  this._elContext = elContext;
};

/**
 * get available width
 */
DvtAfContext.prototype.getAvailableWidth = function() {
  // if not specified, default to Number.MAX_VALUE
  if (this._aw == null || this._aw === undefined)
    return Number.MAX_VALUE;
  return this._aw;
};

/**
 * set available width
 */
DvtAfContext.prototype.setAvailableWidth = function(value) {
  if (value) {
    this._aw = value;
  }
};

/**
 * get available height
 */
DvtAfContext.prototype.getAvailableHeight = function() {
  return this._ah;
};

/**
 * set available height
 */
DvtAfContext.prototype.setAvailableHeight = function(value) {
  if (value) {
    this._ah = value;
  }
};

/**
 * get font size
 */
DvtAfContext.prototype.getFontSize = function() {
  return this._fs;
};

/**
 * set font size
 */
DvtAfContext.prototype.setFontSize = function(value) {
  if (value) {
    this._fs = value;
  }
};

/**
 * get skin name
 * @return {string} Skin name
 */
DvtAfContext.prototype.getSkinName = function() {
  return this._skinName;
};

/**
 * set skin name
 * @param {string} name  Skin name
 */
DvtAfContext.prototype.setSkinName = function(name) {
  if (name) {
    this._skinName = name;
  }
};

/**
 * Check to see if the skin is Alta Skin
 * @return {boolean} true if the skin is alta
 */
DvtAfContext.prototype.isSkinAlta = function() {
  return (this.getSkinName() == DvtCSSStyle.SKIN_ALTA);
};

/**
 * @param {string} tagName the name of the tag
 * @param {string} styleClass style class
 * @param {string} inlineStyle inlineStyle
 */
DvtAfContext.prototype.GetCSSStyle = function(tagName, styleClass, inlineStyle, isTextStyle) {

  var tagClass = tagName + '|' + (styleClass ? styleClass : '');
  inlineStyle = inlineStyle ? inlineStyle : ' ';

  if (! this._tagStyles) {
    this._tagStyles = {};
  }

  var sclass = this._tagStyles[tagClass];
  if (! sclass) {
    sclass = {};
    this._tagStyles[tagClass] = sclass;
  }

  if (! sclass[inlineStyle]) {
    var cs = isTextStyle ? DvtAfStyleUtils.getDefaultTextStyle() : new DvtCSSStyle();

    if (styleClass) {
      cs.merge(styleClass);
    }

    // all styles are merged here
    if (inlineStyle !== ' ') {
      cs.parseInlineStyle(inlineStyle);
    }
    sclass[inlineStyle] = cs;
  }

  return sclass[inlineStyle];
};

/**
 * set context callback
 * @param {object} obj instance of the object the callback is defined on
 * @param {function} the function to callback
 */
DvtAfContext.prototype.setContextCallback = function(obj, callback) {
  this._contextCallbackObj = obj;
  this._contextCallback = callback;
};


/**
 * get context callback
 */
DvtAfContext.prototype.getContextCallback = function() {
  return this._contextCallback;
};

/**
 * get context callbackObj
 */
DvtAfContext.prototype.getContextCallbackObj = function() {
  return this._contextCallbackObj;
};

/**
 * set image loaded callback
 * @param {object} obj instance of the object the callback is defined on
 * @param {function} the function to callback when an image is loaded
 * @param {function} the function to callback when an image is not in cache
 */
DvtAfContext.prototype.setImageCallback = function(obj, callback, notReadyCallback) {
  this._imageCallbackObj = obj;
  this._imageCallback = callback;
  //Bug 16717528 - diagram nodes overlapped if images are not loaded
  this._imageNotReadyCallback = notReadyCallback;
};

/**
 * get image callback
 */
DvtAfContext.prototype.getImageCallback = function() {
  return this._imageCallback;
};

/**
 * get image callbackObj
 */
DvtAfContext.prototype.getImageCallbackObj = function() {
  return this._imageCallbackObj;
};

/**
 * get image not ready callback
 */
DvtAfContext.prototype.getImageNotReadyCallback = function() {
  //Bug 16717528 - diagram nodes overlapped if images are not loaded
  return this._imageNotReadyCallback;
};

/**
 * set panelCard event callback
 * @param {object} obj instance of the object the callback is defined on
 * @param {function} the function to callback when an panelCard is loaded
 */
DvtAfContext.prototype.setPanelCardCallback = function(obj, callback) {
  this._panelCardCallbackObj = obj;
  this._panelCardCallback = callback;
};

/**
 * get panelCard callback
 */
DvtAfContext.prototype.getPanelCardCallback = function() {
  return this._panelCardCallback;
};

/**
 * get panelCard callbackObj
 */
DvtAfContext.prototype.getPanelCardCallbackObj = function() {
  return this._panelCardCallbackObj;
};

/**
 * set menu dorpDown container
 *
 * @param {object} container container of the menu dropdown shape
 */
DvtAfContext.prototype.setMenuDropdownContainer = function(container) {
  this._menuDropDownContainer = container;
};

/**
 * get menu dorpDown container
 */
DvtAfContext.prototype.getMenuDropdownContainer = function() {
  return this._menuDropDownContainer;
};

/**
 * remove any components that don't fit in the tree node
 */
DvtAfContext.prototype.setRmIfNotFit = function(flag) {
  this._rmIfNotFit = flag;
};

DvtAfContext.prototype.getRmIfNotFit = function() {
  return this._rmIfNotFit;
};

/**
 * set row index
 */
DvtAfContext.prototype.setRowIndex = function(index) {
  this._rowIndex = index;
};

DvtAfContext.prototype.getRowIndex = function() {
  return this._rowIndex;
};

/**
 * parent node
 */
DvtAfContext.prototype.setParentNode = function(node) {
  this._node = node;
};

DvtAfContext.prototype.getParentNode = function() {
  return this._node;
};

/**
 * Gets the DvtEventManager that should be used for associating display objects with their logical object counterparts
 * @return {DvtEventManager} eventManager the DvtEventManager instance
 */
DvtAfContext.prototype.getEventManager = function() {
  return this._eventManager;
};

/**
 * Sets the DvtEventManager that should be used for associating display objects with their logical object counterparts
 * @param {DvtEventManager} eventManager the DvtEventManager instance
 */
DvtAfContext.prototype.setEventManager = function(eventManager) {
  this._eventManager = eventManager;
};

DvtAfContext.prototype.registerTabStop = function(obj) {
  if (!this._tabStopsArray)
    return;
  this._tabStopsArray.push(obj);
};

DvtAfContext.prototype.unregisterTabStop = function(obj) {
  if (this._tabStopsArray) {
    for (var i = 0; i < this._tabStopsArray.length; i++) {
      if (this._tabStopsArray[i] == obj) {
        this._tabStopsArray.splice(i, 1);
        break;
      }
    }
  }
};

DvtAfContext.prototype.getTabStopsArray = function() {
  return this._tabStopsArray;
};

DvtAfContext.prototype.setTabStopsArray = function(array) {
  this._tabStopsArray = array;
};
/**
 * @constructor
 * This is an abstract class, do not use directly!!!
 *
 * Rect for content
 *  _cx  the origin point of the content (clientX)
 *  _cy  (clientY)
 *  _cw  the width of the content (clientWidth)
 *  _ch  (clientHeight)
 *
 * Available size
 *  _aw
 *  _ah
 *
 * Explicit size
 *  _ew
 *  _eh
 *
 */
var DvtAfComponent = function() {
  this.Init();
};


/**
 * make DvtAfComponent a subclass of DvtPropMap
 */
DvtObj.createSubclass(DvtAfComponent, DvtPropMap, 'DvtAfComponent');


DvtAfComponent.HALIGN_LEFT = 'left';
DvtAfComponent.HALIGN_RIGHT = 'right';
DvtAfComponent.HALIGN_CENTER = 'center';
DvtAfComponent.HALIGN_START = 'start';
DvtAfComponent.HALIGN_END = 'end';

DvtAfComponent.VALIGN_TOP = 'top';
DvtAfComponent.VALIGN_MIDDLE = 'middle';
DvtAfComponent.VALIGN_BOTTOM = 'bottom';


// Af Component Common Attributes
DvtAfComponent.ATTR_ID = 'id';
DvtAfComponent.ATTR_VISIBLE = 'visible';
DvtAfComponent.ATTR_RENDERED = 'rendered';
DvtAfComponent.ATTR_INLINE_STYLE = 'inlineStyle';
DvtAfComponent.ATTR_STYLE_CLASS = 'styleClass';
DvtAfComponent.ATTR_SHORT_DESC = 'shortDesc';


// For generating unique ID
DvtAfComponent._uniqueSeed = 0;


// Indicate whether to create a bg shape for the following af components
// outputText, outputFormatted, image, spacer and separator
DvtAfComponent._CREATE_BG_SHAPE = false;


// possible values for this._clipped
// removed this component during doLayout
DvtAfComponent._REMOVE_LATER = 'rmMe';

// set CLIP_CONTAINER on self and CLIP_LATER on container
DvtAfComponent._CLIP_CONTAINER = 'clipContainer';

// set flag on component to add clippath on displayObj during renderSelfAfterLayout
DvtAfComponent._CLIP_LATER = 'clipMe';

// this component has a clippath on displayObj
DvtAfComponent._CLIP_PATH = 'clipPath';


// For backward compatible with Flash HV, default box-sizing to border-box
// ie width and height include padding or border
DvtAfComponent.DEFAULT_BOX_SIZING = DvtCSSStyle.BORDER_BOX;
//DvtAfComponent.DEFAULT_BOX_SIZING = DvtCSSStyle.CONTENT_BOX;


/**
 * Initializes the instance.
 */
DvtAfComponent.prototype.Init = function() {
  DvtAfComponent.superclass.Init.call(this);

  // create default style
  this.createDefaultStyles();

  this._parentNode = null;
};

DvtAfComponent.prototype.getStyleClass = function() {
  return this.getProperty(DvtAfComponent.ATTR_STYLE_CLASS);
};

DvtAfComponent.prototype.setStyleClass = function(styleClass) {
  this.setProperty(DvtAfComponent.ATTR_STYLE_CLASS, styleClass);
};

DvtAfComponent.prototype.getInlineStyle = function() {
  return this.getProperty(DvtAfComponent.ATTR_INLINE_STYLE);
};

DvtAfComponent.prototype.setInlineStyle = function(inlineStyle) {
  this.setProperty(DvtAfComponent.ATTR_INLINE_STYLE, inlineStyle);
};

DvtAfComponent.prototype.isRendered = function() {
  return this.getBooleanProp(DvtAfComponent.ATTR_RENDERED, true);
};

DvtAfComponent.prototype.setRendered = function(rendered) {
  this.setProperty(DvtAfComponent.ATTR_RENDERED, rendered);
};

DvtAfComponent.prototype.isVisible = function() {
  return this.getBooleanProp(DvtAfComponent.ATTR_VISIBLE, true);
};

DvtAfComponent.prototype.setVisible = function(visible) {
  this.setProperty(DvtAfComponent.ATTR_VISIBLE, visible);
};

/**
 * @export
 * Get the short description of the component
 * @return {String}  short description
 */
DvtAfComponent.prototype.getShortDesc = function() {
  return this.getProperty(DvtAfComponent.ATTR_SHORT_DESC);
};

DvtAfComponent.prototype.setShortDesc = function(shortDesc) {
  this.setProperty(DvtAfComponent.ATTR_SHORT_DESC, shortDesc);
};


/**
 * @override
 * Stamp out this template object
 * @param {Object} elcontext EL binding context
 * @return {DvtAfComponent} a new DvtAfComponent tree
 */
DvtAfComponent.prototype.stamp = function(elcontext) {
  // stamp self
  var selfComp = DvtAfComponent.superclass.stamp.call(this, elcontext);
  selfComp._children = [];

  //Bug 16709968 - HTML5: POPUP IN PANEL CARD DOESN'T WORK AFTER PANEL CARD SWITCH
  if (this.getShowPopupBehaviors && this.getShowPopupBehaviors()) {
    selfComp._showPopupBehaviors = this._showPopupBehaviors;
  }
  else if (this.getClientBehaviors && this.getClientBehaviors()) {
    selfComp._clientBehaviors = this._clientBehaviors;
  }

  // stamp children
  var child;
  var childComp;

  for (var i = 0; i < this.getNumChildren(); i++) {
    child = this.getChildAt(i);
    childComp = child.stamp(elcontext);

    if (! child.renderMe || childComp.renderMe()) {

      //if there's a showPopupBehavior tag associated with this component
      //set it as component's property
      //TODO: what if stamp method is not called
      if (childComp instanceof DvtAfShowPopupBehavior) {
        selfComp.addShowPopupBehavior(childComp.createDisplayObj());
      }
      else if (childComp instanceof DvtAfClientBehavior) {
        selfComp.addClientBehavior(childComp.createDisplayObj());
      }
      else {
        selfComp.addChild(childComp);
      }
    } else if (childComp._isRenderEL()) {
      //Fix Bug 21775696 - conditional rendering of outputtext within panel card have issues
      //If child component render/visible attribute has unresolved EL expression even after stamping, still add the child component.
      //This will preserve the component tree until the render/visible EL expression is resolved.
      //This specifically is needed for Panel Cards when lazy loading is enabled.
      //Say, if a Panel Card has multiple show detail items in lazy load mode
      //Only first show detail item is stamped during initial render because only first show detail item has the data.
      //Remaining show detail item is loaded and stamped only when the user requests for it using panel card fetch event.
      //So if an AF Component with render/visible expression is present in first show detail item, it will be stamped during initial render.
      //And if the AF Component with render/visible expression is present in other show detail items,
      //it will be stamped during lazy load only when the data is available.
      //So we need to preserve the component until the render/visible expression is resolved.
      //If we don't add child component, when the data is available during lazy load, component won't be available to stamp.
      selfComp.addChild(childComp);
    }
  }

  return selfComp;
};


/**
 * set the content's origin point
 */
DvtAfComponent.prototype.setContentOrigin = function(cssStyle) {

  // calculate margin, border and padding
  var marginTop = cssStyle.getMargin(DvtCSSStyle.MARGIN_TOP);
  var marginLeft = cssStyle.getMargin(DvtCSSStyle.MARGIN_LEFT);
  var marginRight = cssStyle.getMargin(DvtCSSStyle.MARGIN_RIGHT);
  var marginBottom = cssStyle.getMargin(DvtCSSStyle.MARGIN_BOTTOM);

  var bdTopWidth = cssStyle.getBorderSideWidth(DvtCSSStyle.BORDER_TOP_WIDTH);
  var bdLeftWidth = cssStyle.getBorderSideWidth(DvtCSSStyle.BORDER_LEFT_WIDTH);
  var bdRightWidth = cssStyle.getBorderSideWidth(DvtCSSStyle.BORDER_RIGHT_WIDTH);
  var bdBottomWidth = cssStyle.getBorderSideWidth(DvtCSSStyle.BORDER_BOTTOM_WIDTH);

  var paddingTop = cssStyle.getPadding(DvtCSSStyle.PADDING_TOP);
  var paddingLeft = cssStyle.getPadding(DvtCSSStyle.PADDING_LEFT);
  var paddingRight = cssStyle.getPadding(DvtCSSStyle.PADDING_RIGHT);
  var paddingBottom = cssStyle.getPadding(DvtCSSStyle.PADDING_BOTTOM);

  // used to render content
  this.setCX(marginLeft + bdLeftWidth + paddingLeft);
  this.setCY(marginTop + bdTopWidth + paddingTop);

  // used in bidi mode
  this._rightx = marginRight + bdRightWidth + paddingRight;

  this._bottomy = marginBottom + bdBottomWidth + paddingBottom;

  this._marginWidth = marginLeft + marginRight;
  this._marginHeight = marginTop + marginBottom;
};


//Bug 14313127:
/**
 * Parse the given string as a float, and make sure the return value is
 * greater than or equal to 0.
 */
DvtAfComponent.ParseNonNegativeFloat = function(sNum) {
  var num = parseFloat(sNum);
  if (num < 0) {
    return 0;
  }
  return num;
};


/**
 * adjust client area: exclude margin, border and padding
 * if content size is specified, set explicit size
 * if content is larger than client area, then content is clipped
 *
 * @param {DvtCSSStyle} cssStyle The CSS Style object
 */
DvtAfComponent.prototype.adjustClientArea = function(cssStyle) {
  //----- calc width -----
  var num = 0;
  var sw = this._getExplicitWidth(cssStyle);
  var aWidth = this._aw;

  if (sw) {
    num = sw.indexOf('%');
    // size in percent
    if (num > -1) {
      sw = sw.slice(0, num);
      if (aWidth !== Number.MAX_VALUE && sw != null) {
        if (this.isContentBox()) {
          //Bug 13826722 - percent width nested <af:panelgrouplayout> inside <dvt:node> breaks rendering
          num = aWidth - this._getMarginBorderPaddingWidth();
          //Bug 14313127: make sure number is not negative
          aWidth = (DvtAfComponent.ParseNonNegativeFloat(sw) * num) / 100;
        }
        else {
          //Bug 14313127: make sure number is not negative
          num = (DvtAfComponent.ParseNonNegativeFloat(sw) * aWidth) / 100;
          //Bug 13826722 - percent width nested <af:panelgrouplayout> inside <dvt:node> breaks rendering
          aWidth = num - this._getMarginBorderPaddingWidth() + this._marginWidth;
        }
      }
    }
    // assume pixel for now
    else {
      //round size to the nearet integer
      //Bug 14313127: make sure number is not negative
      num = DvtAfComponent.ParseNonNegativeFloat(sw);
      if (this.isContentBox()) {
        aWidth = num;
      }
      else {
        aWidth = num - this._getMarginBorderPaddingWidth() + this._marginWidth;
      }
    }

    // explicitWidth
    this._ew = aWidth;
  }

  //if width or hight is specified for spacer, default to 1
  else if (sw === undefined && this instanceof DvtAfSpacer) {
    aWidth = 1;
    this._ew = aWidth;

    //TODO: do we need this??
    this._aw = aWidth;
  }

  else if (sw === undefined && aWidth !== Number.MAX_VALUE) {
    num = DvtAfComponent.ParseNonNegativeFloat(aWidth);
    aWidth = num - this._getMarginBorderPaddingWidth();
  }

  //----- calc height ------
  var sh = this._getExplicitHeight(cssStyle);
  var aHeight = this._ah;

  if (sh) {
    num = sh.indexOf('%');
    // size in percent
    if (num > -1) {
      sh = sh.slice(0, num);
      if (aHeight !== Number.MAX_VALUE && sh != null) {
        if (this.isContentBox()) {
          //Bug 13826722 - percent width nested <af:panelgrouplayout> inside <dvt:node> breaks rendering
          num = aHeight - this._getMarginBorderPaddingHeight();
          //Bug 14313127: make sure number is not negative
          aHeight = (DvtAfComponent.ParseNonNegativeFloat(sh) * num) / 100;
        }
        else {
          //Bug 14313127: make sure number is not negative
          num = (DvtAfComponent.ParseNonNegativeFloat(sh) * aHeight) / 100;
          //Bug 13826722 - percent width nested <af:panelgrouplayout> inside <dvt:node> breaks rendering
          aHeight = num - this._getMarginBorderPaddingHeight() + this._marginHeight;
        }
      }
    }
    // assume pixel for now
    else {
      //round size to the nearest integer
      //Bug 14313127: make sure number is not negative
      num = DvtAfComponent.ParseNonNegativeFloat(sh);
      if (this.isContentBox()) {
        aHeight = num;
      }
      else {
        aHeight = num - this._getMarginBorderPaddingHeight() + this._marginHeight;
      }
    }

    // explicit height
    this._eh = aHeight;
  }
  //if width or hight is specified for spacer, default to 1
  else if (sh === undefined && this instanceof DvtAfSpacer) {
    aHeight = 1;
    this._eh = aHeight;

    //TODO: do we need this??
    this._ah = aHeight;
  }

  else if (sh === undefined && aHeight !== Number.MAX_VALUE) {
    num = DvtAfComponent.ParseNonNegativeFloat(aHeight);
    aHeight = num - this._getMarginBorderPaddingHeight();
  }


  //----- adjust client area ------
  this._cw = aWidth;
  this._ch = aHeight;

  //Bug 17184456: Enable container clipping if the content width/height is greater than available width/height
  if (this._clipped === undefined && (aWidth <= 0 || aHeight <= 0 || aWidth > this._aw || aHeight > this._ah)) {
    //    this._clipped = DvtAfComponent._CLIP_LATER;
    this._clipped = DvtAfComponent._CLIP_CONTAINER;
  }


  //----- for clippath ------
  this._cpw = aWidth;
  this._cph = aHeight;

};

/**
 * Renders this component
 * @param {DvtAfContext} afContext
 */
DvtAfComponent.prototype.render = function(afContext) {
  this.setAfContext(afContext);
  this._render(DvtAfComponent.ParseNonNegativeFloat(afContext.getAvailableWidth()),
               DvtAfComponent.ParseNonNegativeFloat(afContext.getAvailableHeight()));

  //TODO: clear this._afContext member variable after render, because some of its info goes stale
};


/**
 * @private
 */
DvtAfComponent.prototype._render = function(availWidth, availHeight) {
  if (! this.renderMe())
    return;

  // get available size
  this._aw = availWidth;
  this._ah = availHeight;

  // perf: create computed style in createDisplayObj
  //   if (this.createComputedStyle)
  //     this.createComputedStyle();

  var cssStyle = this.getCSSStyle();
  var shape = this.getContentShape();
  if (! shape)
    return;

  // Transfer relevant attributes to shapes
  this._TransferAttributes(shape);

  // calculate margin, border and padding size
  if (this.setContentOrigin)
    this.setContentOrigin(cssStyle);

  // adjust client area
  // excluding margin, border and padding size
  if (this.adjustClientArea)
    this.adjustClientArea(cssStyle);

  //Bug 13486985 - double click on af:image that does not drill-down to the node
  //if shortDesc is specified, show it in a tooltip
  if (shape && this.isTooltipEnabled() && (! this.getAfContext().getRmIfNotFit())) {
    this.associate(shape, this);
  }

  if (this.renderSelfBeforeChildren)
    this.renderSelfBeforeChildren();

  if (this.renderChildren)
    this.renderChildren();

  if (this.renderSelfAfterChildren)
    this.renderSelfAfterChildren();

  if (this.doLayout)
    this.doLayout();

  if (this.renderSelfAfterLayout)
    this.renderSelfAfterLayout();

  //Bug 13486985 - double click on af:image that does not drill-down to the node
  //make all af components inside treemap mouse transparent
  if (this.getAfContext().getRmIfNotFit()) {
    var bgShape = this.getDisplayObj();
    if (bgShape) {
      bgShape.setMouseEnabled(false);
    }
    var shape = this.getContentShape();
    if (shape && shape !== bgShape) {
      shape.setMouseEnabled(false);
    }
  }
  else {
    //if this AF component has a showPopupBehavior tag, then
    //this AF component needs to be a logical object that the
    //event manager recognizes in order to launch the popup
    if (this.getDisplayObj() && (this.getShowPopupBehaviors() || this.getClientBehaviors())) {
      this.associate(this.getDisplayObj(), this);
    }
  }

};


/**
 * Note: only the AfSpacer tag has width and height attributes
 * All other tags specified width and height in cssStyle
 */
DvtAfComponent.prototype._getExplicitWidth = function(cssStyle) {
  var w;
  if (this.getWidth)
    w = this.getWidth();

  if (w === undefined)
    w = cssStyle.getWidth();

  return w;
};


/**
 * Note: only the AfSpacer tag has width and height attributes
 * All other tags specified width and height in cssStyle
 */
DvtAfComponent.prototype._getExplicitHeight = function(cssStyle) {
  var h;
  if (this.getHeight)
    h = this.getHeight();

  if (h === undefined)
    h = cssStyle.getHeight();

  return h;
};

// use the explicit width is set
// use availabel width if the specified width is wider
// use the specified width
DvtAfComponent.prototype.getCalcWidth = function(width) {
  if (this._ew !== undefined && this._ew !== Number.MAX_VALUE) {
    return this._ew;
  }
  if (this._cw < width) {
    return this._cw;
  }
  return width;
};

DvtAfComponent.prototype.getCalcHeight = function(height) {
  if (this._eh !== undefined && this._eh !== Number.MAX_VALUE) {
    return this._eh;
  }
  if (this._ch < height) {
    return this._ch;
  }
  return height;
};


/**
 * Render this object only, before children have been rendered.
 * If not a container, resolve (x, y, w, h)
 */
DvtAfComponent.prototype.renderSelfBeforeChildren = function() {
};


/**
 * Render this object only, after children have been rendered.
 */
DvtAfComponent.prototype.renderSelfAfterChildren = function() {
};


/**
 * @protected
 *
 * Render this object only, after layout have been calculated.
 */
DvtAfComponent.prototype.renderSelfAfterLayout = function(bgShape, style) {
  // set size on bgShape (middle of border width)
  var renderBg = bgShape;

  if (! bgShape) {
    bgShape = this.getDisplayObj();
  }
  if (! style) {
    style = this.getCSSStyle();
  }

  // Rect for background color or image
  var xx = style.getMargin(DvtCSSStyle.MARGIN_LEFT) + style.getBorderSideWidth(DvtCSSStyle.BORDER_LEFT_WIDTH) / 2;
  var yy = style.getMargin(DvtCSSStyle.MARGIN_TOP) + style.getBorderSideWidth(DvtCSSStyle.BORDER_TOP_WIDTH) / 2;
  var ww = this._cw + style.getBorderSideWidth(DvtCSSStyle.BORDER_RIGHT_WIDTH) +
      style.getPadding(DvtCSSStyle.PADDING_LEFT) + style.getPadding(DvtCSSStyle.PADDING_RIGHT);
  var hh = this._ch + style.getBorderSideWidth(DvtCSSStyle.BORDER_BOTTOM_WIDTH) +
      style.getPadding(DvtCSSStyle.PADDING_TOP) + style.getPadding(DvtCSSStyle.PADDING_BOTTOM);
  this.SetDisplayObjBounds(bgShape, xx, yy, ww, hh);


  //Bug 13842171 - CLIPPING SHOULD BE DONE BY THE PARENT CONTAINER
  // add clip path if not exists
  if (this._clipped == DvtAfComponent._CLIP_LATER) {
    this.addClipPath();
  }

  if (this._hasBgShape() || renderBg) {
    this.renderBackground(bgShape, style);
  }

  if (DvtAgent.isTouchDevice() && (this._hasBgShape() || renderBg))
    this.addAccessibilityAttributes(bgShape);
  else
    this.addAccessibilityAttributes(this.getDisplayObj());
};


/**
 * @protected
 */
DvtAfComponent.prototype.SetDisplayObjBounds = function(dispObj, xx, yy, ww, hh) {
  if (dispObj instanceof DvtOutputText || dispObj instanceof DvtMultilineText) {
    return;
  }

  if (dispObj.setX) {
    dispObj.setX(xx);
  }
  if (dispObj.setY) {
    dispObj.setY(yy);
  }
  if (dispObj.setWidth && ww !== Number.MAX_VALUE) {
    dispObj.setWidth(ww);
  }
  if (dispObj.setHeight && hh !== Number.MAX_VALUE) {
    dispObj.setHeight(hh);
  }
};


/**
 * Render the children of this object.
 */
DvtAfComponent.prototype.renderChildren = function() {
  var child;

  for (var i = 0; i < this.getNumChildren(); i++) {
    child = this.getChildAt(i);
    if (! child.renderMe || child.renderMe()) {
      this.renderChild(child);
    }
  }
};


/**
 * Render the children of this object.
 */
DvtAfComponent.prototype.renderChild = function(child) {
  if (child._render) {
    child._render(this._cw, this._ch);
  }
};


/**
 * Perform layout of this display object.
 */
DvtAfComponent.prototype.doLayout = function() {
};


/**
 * Add an AfComponent child to the AfComponent tree and
 * @param {DvtAfComponent} afComp
 * @return nothing
 */
DvtAfComponent.prototype.addChild = function(afComp) {

  //Note: not all children are instance of DvtAfComponet
  //  if (afComp instanceof DvtAfComponent) {

  // add the afComp to the afComponent tree
  if (afComp.setParent) {
    afComp.setParent(this);
  }
  this._getChildren().push(afComp);

  //  }
};


/**
 * Remove an AfComponent child from the AfComponent tree
 * @param {DvtDisplayable} comp
 */
DvtAfComponent.removeChild = function(comp) {
  var parent;

  //Note: not all children are instance of DvtAfComponet
  // remove the afComp from the afComponent tree
  if (comp instanceof DvtAfComponent) {
    parent = comp.getParent();
    var children = parent._getChildren();
    for (var i = 0; i < children.length; i++) {
      if (children[i] === comp) {
        comp.setParent(null);
        children.splice(i, 1);
        break;
      }
    }
  }

  var displayObj = comp.getDisplayObj();
  var shape = DvtAfComponent._getContentShape(comp);
  if (shape && shape !== displayObj) {
    parent = shape.getParent();
    if (parent) {
      parent.removeChild(shape);
      comp.setContentShape(displayObj, null);
    }
  }

  if (displayObj) {
    parent = displayObj.getParent();
    if (parent) {
      parent.removeChild(displayObj);
      comp._bgShape = null;
    }
  }
};

DvtAfComponent.prototype._getChildren = function() {
  if (this._children === undefined) {
    this._children = [];
  }
  return this._children;
};

DvtAfComponent.prototype.getNumChildren = function() {
  return (this._children ? this._children.length : 0);
};


/**
 * Returns the child at the specified zero-relative position, or null if
 * there is no child represented by the position.
 */
DvtAfComponent.prototype.getChildAt = function(idx) {
  var cnt = this.getNumChildren();
  if (idx >= 0 && cnt > idx) {
    return this._getChildren()[idx];
  }
  return null;
};

DvtAfComponent.prototype.getParent = function() {
  return this._afCompParent;
};

DvtAfComponent.prototype.setParent = function(parent) {
  this._afCompParent = parent;
};

/**
 * Get the top level ancestor of this component
 *
 * @return {DvtAfComponent}
 */
DvtAfComponent.prototype.getRoot = function() {
  var root = this;
  while (root.getParent()) {
    root = root.getParent();
  }
  return root;
};

/**
 * get the Adf style of this object
 * @return {DvtCSSStyle} the first Adf style
 */
DvtAfComponent.prototype.GetRootStyleClass = function() {
  return this.GetDefaultStyles()[0];
};


/**
 * create an array of Adf styles
 */
DvtAfComponent.prototype.createDefaultStyles = function() {
  // Note: only need to create one instance of _afStyle per class
  var styleList = this.GetDefaultStyles();
  //Reload the default CSS for Unit Tests
  //Since the styles are initialized in static variable, every unit test should reload the styles
  if (styleList === undefined || DvtAgent.isEnvironmentTest()) {
    styleList = DvtAfStyleUtils.getDefaultCSSStyle(this.getTagName());

    // if component does not have a default style, create an empty style for it
    if (styleList.length == 0) {
      styleList.push(new DvtCSSStyle());
    }
    this.SetDefaultStyles(styleList);
  }

};


/**
 * @private
 */
DvtAfComponent.prototype.createComputedStyle = function() {
  if (! this._computedStyle) {

    // merge styles: defaultStyle, styleClass and inlineStyles
    var def = this.GetRootStyleClass();
    var sc;

    //ex: styleClass="AFStretchWidht AFHVNodePadding"
    var scNames = this.getStyleClass();

    if (scNames) {
      var scss;
      var scName;
      var sca = scNames.split(' ');
      for (var i = 0; i < sca.length; i++) {
        scName = sca[i];
        if (scName && scName.length > 0) {
          scss = DvtAfStyleUtils.getAFStretchWidthStyle(scName);
          if (! scss) {
            scss = DvtAfStyleUtils.getStyleClass(scName);
          }
          if (sc) {
            sc.merge(scss);
          }
          else if (scss) {
            sc = scss.clone();
          }
        }
      }
    }

    var ins = this.getInlineStyle();

    var cssStyle;
    if (DvtAfComponentFactory.CACHE_STYLES) {
      var isText = (this instanceof DvtAfOutputText || this instanceof DvtAfOutputFormatted);
      //NOTE: may NOT work if style contains EM
      cssStyle = this.getAfContext().GetCSSStyle(this.getTagName(), sc, ins, isText);
    }
    else {
      var cssStyle = new DvtCSSStyle();
      if (sc) {
        cssStyle.merge(sc);
      }
      cssStyle.parseInlineStyle(ins);

      this._setOverrideStyle(cssStyle.isEmpty() ? null : cssStyle.clone());

      cssStyle.mergeUnder(def);
    }

    this._computedStyle = cssStyle;

    // resolve em unit
    this.ResolveEm(cssStyle);

  }

  return this._computedStyle;
};


/**
 * @private
 */
DvtAfComponent.prototype.ResolveEm = function(cssStyle) {
  this.resolveEmUnit(cssStyle, this.getParent());
};


/**
 * @private
 * @param {DvtAfComponent} startComp
 */
DvtAfComponent.prototype.resolveEmUnit = function(cssStyle, startComp) {
  // get fontSize in the following orders:
  // 1) current fontSize if not in "em"
  // 2) inherited fontSize
  // 3) nfontSize passed in
  // 4) DvtAfStyleUtils.getDefaultFontSize

  if (cssStyle) {
    var fontSize = cssStyle.getAbsoluteFontSize();

    if (! fontSize && startComp) {
      fontSize = startComp.getInheritedStyleAttr(DvtCSSStyle.FONT_SIZE);
    }
    if (! fontSize) {
      fontSize = this.getAfContext().getFontSize();
    }
    cssStyle.resolveEM(fontSize);
  }
};


/**
 * get style
 */
DvtAfComponent.prototype.getStyle = function(key) {
  if (this._computedStyle)
    return this.getCSSStyle().getStyle(key);
  else
    return undefined;
};

DvtAfComponent.prototype.getComputedStyles = function() {
  //TODO: return empty style for now
  return this._computedStyle;
};

DvtAfComponent.prototype.getCSSStyle = function() {
  if (this._cssStyle)
    return this._cssStyle;

  var styleList = this.getComputedStyles();

  if (DvtArrayUtils.isArray(styleList)) {
    this._cssStyle = styleList[0];
  }
  else {
    this._cssStyle = (styleList) ? styleList : new DvtCSSStyle(null);
  }
  return this._cssStyle;
};


/**
 * Get a style attribute. go up to the parent chain only if attribute is inherited
 * @private
 */
DvtAfComponent.prototype.getStyleAttr = function(key) {
  var ret = this.getCSSStyle().getStyle(key);

  //if style can be inherited, check parent hierarchy
  if (! ret && DvtCSSStyle.isInheritable(key) && this.getParent()) {
    ret = this.getParent().getInheritedStyleAttr(key);
  }
  return ret;
};


/**
 * Get a style attribute, go up to the parent chain if needed
 * @private
 */
DvtAfComponent.prototype.getInheritedStyleAttr = function(key) {
  var ret = this.getCSSStyle().getStyle(key);

  if (! ret && this.getParent()) {
    ret = this.getParent().getInheritedStyleAttr(key);
  }
  return ret;
};


/**
 * @private
 */
DvtAfComponent.prototype.getInheritedStyle = function(key, style, defaultStyle) {
  var ret;

  if (style) {
    ret = style.getStyle(key);
  }
  if (! ret) {
    ret = this.getStyleAttr(key);
    if (! ret && defaultStyle) {
      // TODO: the usage of this function is inconsistent right now, with object maps sometimes
      //       passed instead of DvtCSSStyle instances.  This should be fixed.
      ret = defaultStyle.getStyle ? defaultStyle.getStyle(key) : defaultStyle[key];
    }
  }
  return ret;
};


/**
 * @private
 * @return a DvtCSSStyle
 */
DvtAfComponent.prototype.createTextStyles = function(style, defaultStyle) {
  if (style == null) {
    style = this.getCSSStyle().clone();
    if (style == null)
      return null;
  }
  var k;
  var s;

  //Performance: use the same css style dont clone
  // style = style.clone();

  // Default to Tomoha font family
  k = DvtCSSStyle.FONT_FAMILY;
  if (! style.getStyle(k)) {
    s = this.getInheritedStyle(k, style, defaultStyle);
    style.setStyle(k, (s ? s : DvtAfStyleUtils.getDefaultFontFamily()));
  }

  //NOTE: size of textFormat is in "point" not "pixel"
  //unfortunary, Capabilities.screenDPI always returns 72
  // Default to 11px
  k = DvtCSSStyle.FONT_SIZE;
  if (! style.getStyle(k)) {
    s = this.getInheritedStyle(k, style, defaultStyle);
    if (!s) {
      s = DvtAfStyleUtils.getDefaultFontSize();
    }
    style.setStyle(k, s);
  }
  // Default to black
  k = DvtCSSStyle.COLOR;
  if (! style.getStyle(k)) {
    s = this.getInheritedStyle(k, style, defaultStyle);
    style.setStyle(k, (s ? s : DvtAfStyleUtils.getDefaultFontColor()));
  }

  k = DvtCSSStyle.FONT_WEIGHT;
  if (! style.getStyle(k)) {
    s = this.getInheritedStyle(k, style, defaultStyle);
    if (s)
      style.setStyle(k, s);
  }

  k = DvtCSSStyle.FONT_STYLE;
  if (! style.getStyle(k)) {
    s = this.getInheritedStyle(k, style, defaultStyle);
    if (s)
      style.setStyle(k, s);
  }

  k = DvtCSSStyle.TEXT_ALIGN;
  if (! style.getStyle(k)) {
    s = this.getInheritedStyle(k, style, defaultStyle);
    if (s) {
      style.setStyle(k, s);
    }
    //Bug 10275298 and Bug 10274543: if no text-align is specified, CSS treats it
    //as 'left' in non-BiDi and 'right' in BiDi, so if text-align is not specified
    //here and we're in BiDi, explicitly set it to 'right'
    //   else if (DvtAgent.isRightToLeft(this.getDvtContext())) {
    //      style.setStyle(k, "right");
    //    }
  }

  k = DvtCSSStyle.TEXT_DECORATION;
  if (! style.getStyle(k)) {
    s = this.getInheritedStyle(k, style, defaultStyle);
    if (s)
      style.setStyle(k, s);
  }
  return style;
};


/**
 * @private
 */
DvtAfComponent.prototype.createCallback = function(func) {
  return DvtObj.createCallback(this, func);
};


DvtAfComponent.prototype.getHAlign = function() {
  return DvtAfComponent.HALIGN_LEFT;
};


/**
 * Get the effective halign based on the locale's reading direction.
 *
 * @return effective halign based on locale's reading direction
 */
DvtAfComponent.prototype.getEffectiveHAlign = function() {
  var hAlign = this.getHAlign();

  if (hAlign == DvtAfComponent.HALIGN_START) {
    if (DvtAgent.isRightToLeft(this.getDvtContext()))
      hAlign = DvtAfComponent.HALIGN_RIGHT;
    else
      hAlign = DvtAfComponent.HALIGN_LEFT;
  }
  else if (hAlign == DvtAfComponent.HALIGN_END) {
    if (DvtAgent.isRightToLeft(this.getDvtContext()))
      hAlign = DvtAfComponent.HALIGN_LEFT;
    else
      hAlign = DvtAfComponent.HALIGN_RIGHT;
  }
  return hAlign;
};


/**
 * @param {DvtAfContext} afContext The rendering context which should contain width, height and optional fontSize.
 * @return {DvtAfComponent} the root of the DvtAfComponent tree
 */
DvtAfComponent.prototype.createDisplayObj = function(afContext) {
  //Don't create display object if rendered is false
  if (! this.renderMe())
    return null;

  //BUG 13971862: save the parent node so we can call back to it for popups
  this._parentNode = afContext.getParentNode();

  //TODO: clear this._afContext member variable after render, because some of its info goes stale
  this.setAfContext(afContext);
  var dvtContext = this.getDvtContext();
  this.registerAsTabStop();

  // save context callback
  this.SaveContextCallback();

  // perf: need css style in order to truncated text
  // create computed style
  if (this.createComputedStyle)
    this.createComputedStyle();

  // create shape
  this._shape = this.createContentShape(dvtContext);

  // create background shape
  this._bgShape = this.createBackgroundShape(dvtContext, this._shape);

  //save a reference back to the af component
  this._bgShape._afComp = this;
  return this._bgShape;
};


DvtAfComponent.prototype.getDisplayObj = function() {
  return this._bgShape;
};


DvtAfComponent.prototype.addChildDisplayObjs = function(afContext, parentDO) {
  var child;
  var childDO;
  var cnt = this.getNumChildren();

  for (var i = 0; i < cnt; i++) {
    child = this.getChildAt(i);
    if (! child.renderMe || child.renderMe()) {
      childDO = child.createDisplayObj(afContext);
      if (childDO) {
        parentDO.addChild(childDO);
      }
    }
  }
};


DvtAfComponent.prototype.createContentShape = function(dvtContext) {
  return null;
};


/**
 * Get the content pane where AfComponent children of this
 * AfComponent will be added.
 * In most cases the content pane will be this AfComponent itself,
 * but in AfPanelGroupLayout it is a separate sprite.
 *
 * @return the shape containing AfComponent children of this component
 *
 */
DvtAfComponent.prototype.getContentShape = function() {
  return this._shape;
};


/**
 * add the shape as a child to the background shape
 */
DvtAfComponent.prototype.setContentShape = function(bgShape, shape) {
  if (shape) {
    bgShape.addChild(shape);
    shape._prop = this._prop;
  }

  this._shape = shape;

};

/**
 * @private
 */
DvtAfComponent.prototype.getCX = function() {
  return this._cx;
};


/**
 * @private
 */
DvtAfComponent.prototype.setCX = function(relx) {
  this._cx = relx;
};


/**
 * @private
 */
DvtAfComponent.prototype.getCY = function() {
  return this._cy;
};


/**
 * @private
 */
DvtAfComponent.prototype.setCY = function(rely) {
  this._cy = rely;
};


DvtAfComponent.prototype.createBackgroundShape = function(dvtContext, shape) {
  var bgShape;

  if (this._hasBgShape()) {
    bgShape = new DvtRect(dvtContext, 0, 0, 0, 0, this._getUniqueId() + '_bg');

    // add to the background shape
    this.setContentShape(bgShape, shape);
  }
  else {
    bgShape = shape;
  }

  return bgShape;
};


/**
 * @protected
 *
 * render background and border
 */
DvtAfComponent.prototype.renderBackground = function(bgShape, style) {

  //if no background-color, use transparent white so that
  //there's still a rect drawn at the given size, even if
  //it's not visible to the user, because it may be used
  //to define the size of a component

  //color format: rgba(r, g, b, a)
  //ex: rgba(255, 0, 0, 1)
  var bgColor = 'rgba(255, 255, 255, 0)';

  var bgImg;
  if (! style) {
    style = this.getCSSStyle();
  }

  if (style) {
    bgColor = style.getStyle(DvtCSSStyle.BACKGROUND_COLOR);
    bgImg = style.getBackgroundImage();
  }

  //TODO: else apply a default css style
  //should we set background color on the shape?
  if (! bgShape) {
    bgShape = this.getDisplayObj();
  }

  this.RenderBackgroundStroke(bgShape, style);

  if (bgShape.setFill) {
    this.RenderBackgroundFill(bgShape, style, bgColor, bgImg);
    this.RenderBackgroundImage(bgShape, style, bgImg);
  }
};


/**
 * @protected
 *
 * render background fill
 */
DvtAfComponent.prototype.RenderBackgroundFill = function(bgShape, style, bgColor, bgImg) {
  if (bgImg && (bgImg instanceof DvtCSSGradient)) {
    var arColors = bgImg.getColors();
    var arAlphas = bgImg.getAlphas();
    var arStops = bgImg.getRatios();
    var angle = bgImg.getAngle();
    bgShape.setFill(new DvtLinearGradientFill(angle, arColors, arAlphas, arStops));
  }
  else {
    if (!bgColor) {
      bgShape.setFill(null);
    }
    else {
      bgShape.setSolidFill(bgColor);
    }
  }
};


/**
 * @protected
 * @param {DvtShape} bgShape background shape
 * @param {DvtCSSStyle} style css style to get stroke properties from
 * render background stroke
 */
DvtAfComponent.prototype.RenderBackgroundStroke = function(bgShape, style) {
  var bdColor;
  var bdWidth = 0;
  var bdType;

  if (style) {
    bdColor = DvtAfComponent.getBorderColor(style);
    if (bdColor == 'transparent') {
      bdColor = 'rgba(0,0,0,0)';
    }
    bdWidth = style.getBorderWidth();
    bdType = style.getStyle(DvtCSSStyle.BORDER_STYLE);
  }

  if (bdType != 'none') {
    if (bdColor) {
      if (isNaN(bdWidth))
        bdWidth = DvtAfComponent.ParseNonNegativeFloat(bdWidth);

      var stroke = new DvtSolidStroke(bdColor, null, bdWidth);
      stroke.setType(DvtStroke.convertTypeString(bdType));
      bgShape.setStroke(stroke);
    }
  }

  // border-radius
  if (style && bgShape instanceof DvtRect) {
    var borderRadius = style.getStyle(DvtCSSStyle.BORDER_RADIUS);
    if (borderRadius) {
      var radArr = DvtStringUtils.trim(borderRadius).split(' ');
      if (radArr.length > 0 && radArr[0]) {
        bgShape.setRx(DvtAfComponent.ParseNonNegativeFloat(radArr[0]));
      }
      if (radArr.length > 1 && radArr[1]) {
        bgShape.setRy(DvtAfComponent.ParseNonNegativeFloat(radArr[1]));
      }
    }
  }

};


/**
 * @protected
 *
 * render background image
 */
DvtAfComponent.prototype.RenderBackgroundImage = function(bgShape, style, bgImg) {
  if (bgImg && 'none' !== bgImg && (! (bgImg instanceof DvtCSSGradient))) {

    this._bgImg = bgImg;
    DvtImageLoader.loadImage(this.getDvtContext(),
                             bgImg,
                             this.createCallback(this.onBgImageLoaded));

  }
};


DvtAfComponent.prototype.onBgImageLoaded = function(image) {
  // set image size
  if (image != null && image.width && image.height) {
    var bgShape = this.getDisplayObj();

    var style = this.getCSSStyle();
    var bgRepeat = style.getStyle(DvtCSSStyle.BACKGROUND_REPEAT);

    var dim;
    if (! bgRepeat || bgRepeat != 'no-repeat') {
      dim = new DvtRectangle(0, 0, image.width, image.height);
    }
    else {
      dim = bgShape.getDimensions();
    }

    var bgImg = DvtAgent.isEnvironmentBatik() ? image.uri : this._bgImg;
    bgShape.setFill(new DvtImageFill(bgImg, dim, bgRepeat));

  }
};


/**
 * Determine to see if this component should be rendered
 * @return {boolean} return true if the component should be rendered
 */
DvtAfComponent.prototype.renderMe = function() {
  return (this instanceof DvtAfComponent &&
          this.isRendered() && this.isVisible());
};

/**
 * @private
 * Determine if the component render or visible attribute has EL expression
 * @return {boolean} return true if the render or visible attribute has EL expression
 */
DvtAfComponent.prototype._isRenderEL = function() {
  if (this instanceof DvtAfComponent) {
    var _render = this.getProperty(DvtAfComponent.ATTR_RENDERED);
    var _visible = this.getProperty(DvtAfComponent.ATTR_VISIBLE);
    return ((_render && typeof _render === 'string' && _render.match(DvtPropMap.REGEXP)) ||
           (_visible && typeof _visible === 'string' && _visible.match(DvtPropMap.REGEXP)));
  }
  return false;
};

//subclasses can override this method if necessary
//for example outputText to show full text when it is truncated
DvtAfComponent.prototype.isTooltipEnabled = function() {
  var text = this.getTooltip();
  return text && text.length > 0;
};


//subclasses can override the tooltip text if necessary
//for example outputText to show full text when it is truncated
DvtAfComponent.prototype.getTooltip = function() {
  return this.getShortDesc();
};


/**
 * @private
 * Transfer relevant attributes from the original tag to the shape element
 * @param {Object} shape  The shape element.
 */
DvtAfComponent.prototype._TransferAttributes = function(shape) {
  // dont set style unless we know the size of the component
};


/**
 * @protected
 */
DvtAfComponent.prototype.setTranslateX = function(relx) {
  var dispObj = this.getDisplayObj();
  if (dispObj) {
    dispObj.setTranslateX(relx);
  }
};


/**
 * @protected
 */
DvtAfComponent.prototype.setTranslateY = function(rely) {
  var dispObj = this.getDisplayObj();
  if (dispObj) {
    dispObj.setTranslateY(rely);
  }
};


/**
 * @protected
 * Return dimensions if child is not an instance DvtAfComponent
 */
DvtAfComponent.getDimensions = function(comp) {
  if (comp instanceof DvtAfComponent) {
    return comp.getBounds();
  }
  else {
    return comp.getDimensions();
  }
};


/**
 * Get bounding rectangle of a displayable object taking the clippaths into account
 * @return {DvtRectangle} the bounding rectangle
 */
DvtAfComponent.prototype.getBounds = function() {
  if (! this._dim) {
    var dim;

    if (this._cw && this._cw !== Number.MAX_VALUE &&
        this._ch && this._ch !== Number.MAX_VALUE) {
      dim = new DvtRectangle(0, 0, 0, 0);
    }
    else {
      dim = this.getDisplayObj().getDimensions();
      if (dim) {
        dim.x = 0;
        dim.y = 0;
      }
      else {
        dim = new DvtRectangle(0, 0, 0, 0);
      }
    }

    var style = this.getCSSStyle();
    if (this._cw && this._cw !== Number.MAX_VALUE) {
      dim.w = this._cw +
              style.getMargin(DvtCSSStyle.MARGIN_LEFT) + style.getMargin(DvtCSSStyle.MARGIN_RIGHT) +
              style.getPadding(DvtCSSStyle.PADDING_LEFT) + style.getPadding(DvtCSSStyle.PADDING_RIGHT) +
              style.getBorderSideWidth(DvtCSSStyle.BORDER_LEFT_WIDTH) + style.getBorderSideWidth(DvtCSSStyle.BORDER_RIGHT_WIDTH);
    }
    else {
      dim.w += style.getMargin(DvtCSSStyle.MARGIN_LEFT) + style.getMargin(DvtCSSStyle.MARGIN_RIGHT);
    }

    if (this._ch && this._ch !== Number.MAX_VALUE) {
      dim.h = this._ch +
              style.getMargin(DvtCSSStyle.MARGIN_TOP) + style.getMargin(DvtCSSStyle.MARGIN_BOTTOM) +
              style.getPadding(DvtCSSStyle.PADDING_TOP) + style.getPadding(DvtCSSStyle.PADDING_BOTTOM) +
              style.getBorderSideWidth(DvtCSSStyle.BORDER_TOP_WIDTH) + style.getBorderSideWidth(DvtCSSStyle.BORDER_BOTTOM_WIDTH);
    }
    else {
      dim.h += style.getMargin(DvtCSSStyle.MARGIN_TOP) + style.getMargin(DvtCSSStyle.MARGIN_BOTTOM);
    }

    this._dim = dim;
  }

  return this._dim;
};


DvtAfComponent._getContentShape = function(child) {
  if (child instanceof DvtAfComponent) {
    return child.getContentShape();
  }
  return child.getDisplayObj();
};


/**
 * @private
 */
DvtAfComponent._setTranslateGroup = function(child, relx, rely) {

  if (child instanceof DvtAfComponent) {
    var dispObj = child.getDisplayObj();
    if (dispObj) {
      dispObj.setTranslateX(relx);
      dispObj.setTranslateY(rely);
    }
  }
  else {
    if (child.setTranslateX) {
      child.setTranslateX(relx);
    }
    if (child.setTranslateY) {
      child.setTranslateY(rely);
    }
  }
};


DvtAfComponent.prototype.getTagName = function() {
};

// if this component has a bg shape?
// By default some af components such as Image don't create a background shape
// unless this method returns a true
DvtAfComponent.prototype._hasBgShape = function() {
  // create bgShape when needed
  if (this._needBgShape === undefined) {

    var style = this.getCSSStyle();
    this._needBgShape = (style &&
                         (style.getStyle(DvtCSSStyle.BACKGROUND_COLOR) || style.getBackgroundImage() ||
                          DvtAfComponent.getBorderColor(style) || style.getBorderWidth() ||
                          style.getStyle(DvtCSSStyle.BORDER_RADIUS)));
  }
  return this._needBgShape;
};


/**
 * Defer text truncation and sizing
 */
DvtAfComponent.prototype.createTextShape = function(isWordWrap, text, 
                                                    textStyle, defStyle, id) {
  var dvtContext = this.getDvtContext();

  if (! id) {
    id = this._getUniqueId();
  }
  var textShape;

  if (isWordWrap) {
    textShape = new DvtMultilineText(dvtContext, text, 0, 0, id);
  }
  else {
    textShape = new DvtOutputText(dvtContext, text, 0, 0, id);
  }

  var cssStyle = this.createTextStyles(textStyle, defStyle);
  if (cssStyle) {
    textShape.setCSSStyle(cssStyle);
  }

  textShape._prop = this._prop;

  return textShape;
};


DvtAfComponent.prototype.isCommandComponent = function() {
  return false;
};

DvtAfComponent.prototype.getShowPopupBehaviors = function() {
  return this._showPopupBehaviors;
};

DvtAfComponent.prototype.addShowPopupBehavior = function(spub) {
  if (! this._showPopupBehaviors) {
    this._showPopupBehaviors = [];
  }
  this._showPopupBehaviors.push(spub);
};

DvtAfComponent.prototype.getClientBehaviors = function() {
  return this._clientBehaviors;
};

DvtAfComponent.prototype.addClientBehavior = function(bhvr) {
  if (! this._clientBehaviors) {
    this._clientBehaviors = [];
  }
  this._clientBehaviors.push(bhvr);
};

/**
 * Stores a reference to the event callback function and object if this component is capable
 * of raising events
 * @protected
 */
DvtAfComponent.prototype.SaveContextCallback = function() {
  if ((this.getShowPopupBehaviors && this.getShowPopupBehaviors()) || this.getClientBehaviors() ||
      this.isCommandComponent() || this instanceof DvtAfPanelCard) {

    this.setContextCallbackObj(this.getAfContext().getContextCallbackObj());
    this.setContextCallback(this.getAfContext().getContextCallback());
  }

};

/**
 * Gets the stored event callback function
 * @return {function} the callback function
 */
DvtAfComponent.prototype.getContextCallback = function() {
  return this._contextCallback;
};

/**
 * Gets the object that should be treated as 'this' when the callback function is called
 * @return {object} the callback object
 */
DvtAfComponent.prototype.getContextCallbackObj = function() {
  return this._contextCallbackObj;
};

/**
 * Sets the stored event callback function
 * @param {function} callback the callback function
 */
DvtAfComponent.prototype.setContextCallback = function(callback) {
  this._contextCallback = callback;
};

/**
 * Sets the object that should be treated as 'this' when the callback function is called
 * @param {object} callbackObj the callback object
 */
DvtAfComponent.prototype.setContextCallbackObj = function(callbackObj) {
  this._contextCallbackObj = callbackObj;
};

// Render a DvtPropMap component (not necessary an afComponent)
DvtAfComponent._renderComp = function(afContext, comp, availWidth, availHeight) {

  //save available width and height
  var saveAW = afContext.getAvailableWidth();
  var saveAH = afContext.getAvailableHeight();
  afContext.setAvailableWidth(availWidth);
  afContext.setAvailableHeight(availHeight);

  if (comp.render) {
    comp.render(afContext);
  }
  //restore available width and height
  afContext.setAvailableWidth(saveAW);
  afContext.setAvailableHeight(saveAH);

};


// This method is called when this component is too big for its container
DvtAfComponent.prototype._addClipPathIfNeeded = function(afContext, xx, yy, aw, dimW, ah, dimH, shape) {

  if (dimW > (aw + DvtMath.TOLERANCE) ||
      dimH > (ah + DvtMath.TOLERANCE)) {

    //HTML5 HV: SOME TEXT IN NODES NOT VISIBLE
    //Note:text doesn't scale well, shape.getCachedDims sometimes returns incorrect dimensions
    if (shape) {
      var dim = DvtDisplayableUtils.getDimensionsForced(afContext.getCtx(), shape);

      if (dim.w <= (aw + DvtMath.TOLERANCE) &&
          dim.h <= (ah + DvtMath.TOLERANCE)) {
        return;
      }
    }

    if (afContext.getRmIfNotFit()) {
      this._clipped = DvtAfComponent._REMOVE_LATER;
    }
    else {
      //Bug 13842171 - CLIPPING SHOULD BE DONE BY THE PARENT CONTAINER
      //this.addClipPath(xx, yy, ww, hh);
      this._clipped = DvtAfComponent._CLIP_CONTAINER;

      /*
      //save clipPath in case this is a root component
      this._clipRect = new DvtRectangle(xx, yy,
                                        Math.min(aw, dimW),
                                        Math.min(ah, dimH));
      */
    }
  }
};


DvtAfComponent.prototype.setClipContainer = function(parent) {
  // set flag on the parent to add clipPath later
  if (this.isClippedNoClipPath()) {
    parent._clipped = DvtAfComponent._CLIP_LATER;
  }
};

DvtAfComponent.prototype.getClipped = function() {
  return this._clipped;
};


//add clipPath if not already exists
DvtAfComponent.prototype.addClipPath = function() {
  if (this.noClipPath()) {
    var clipPathDims = this.GetClipPathDimensions();

    //create new container for clipPath
    var newContainer = this.CreateNewContainerForChildren();

    var clipPath = new DvtClipPath(this._getUniqueId() + DvtAfComponentUtils._CLIP_PATH_SUFFIX);
    clipPath.addRect(clipPathDims.x, clipPathDims.y, clipPathDims.w, clipPathDims.h);
    newContainer.setClipPath(clipPath);

    this._clipped = DvtAfComponent._CLIP_PATH;
    return true;
  }
  return false;
};

/**
 * Gets the dimensions for this component's clip path
 * @protected
 * @return {DvtRectangle}
 */
DvtAfComponent.prototype.GetClipPathDimensions = function() {
  var xx = this.getCX();
  var yy = this.getCY();
  var ww = this._cpw;
  var hh = this._cph;

  if (ww == undefined || ww == Number.MAX_VALUE)
    ww = this._cw;

  if (hh == undefined || hh == Number.MAX_VALUE)
    hh = this._ch;

  return new DvtRectangle(xx, yy, ww, hh);
};

DvtAfComponent.prototype.isClippedNoClipPath = function() {
  return (this._clipped && this.noClipPath());
};

DvtAfComponent.prototype.noClipPath = function() {
  return (this._clipped !== DvtAfComponent._CLIP_PATH);
};

DvtAfComponent.genUniqueId = function() {
  return DvtAfComponent._uniqueSeed++;
};

// get unique id
DvtAfComponent.prototype._getUniqueId = function() {
  if (this._uniqueId) {
    return this._uniqueId;
  }

  var id = this.getId();
  var rowIndex = this.getAfContext().getRowIndex();
  if (id === undefined) {
    id = '_G' + this.getTagName() + '_' + DvtAfComponent.genUniqueId();
  }
  else if (rowIndex === undefined) {
    id += '_' + DvtAfComponent.genUniqueId();
  }
  else {
    id += '_' + rowIndex;
  }

  this._uniqueId = id;
  return this._uniqueId;
};


//Bug 13536792 - images without explicit size fail to render
//if image size is not specified, notify the component to re-layout the page
DvtAfComponent.prototype.RegisterImageCallback = function(imgSrc) {
  var owner = this.getAfContext().getImageCallbackObj();
  var func = this.getAfContext().getImageCallback();

  // if imageCallback is specified, when an image is loaded,
  // notify the component to re-layout the page
  if (owner && func) {
    DvtImageLoader.loadImage(this.getDvtContext(),
                             imgSrc,
                             DvtObj.createCallback(owner, func));

  }

  //Bug 16717528 - diagram nodes overlapped if images are not loaded
  func = this.getAfContext().getImageNotReadyCallback();
  if (owner && func) {
    DvtObj.createCallback(owner, func)(this._parentNode, imgSrc);
  }
};

//BUG 13971862: return the bounds of the object to use for aligning popups
DvtAfComponent.prototype.getPopupBounds = function(behavior) {
  if (behavior) {
    var alignId = behavior.getAlignId();
    if (alignId) {
      //if aligning to this component, return its bounds
      if (this.getId() == alignId) {
        var dispObj = this.getDisplayObj();
        if (dispObj) {
          return dispObj.getDimensions(dispObj.getCtx().getStage());
        }
      }
      else {
        //call back to the parent node to find the component
        if (this._parentNode && this._parentNode.findComponentPopupBounds) {
          return this._parentNode.findComponentPopupBounds(alignId);
        }
      }
    }
  }
  return null;
};


DvtAfComponent.prototype._getBoxSizing = function() {
  if (! this._boxSizing) {
    var bs = this.getStyle(DvtCSSStyle.BOX_SIZING);
    if (bs) {
      this._boxSizing = bs;
    }
    else {
      var parent = this.getParent();
      if (parent && parent instanceof DvtAfComponent)
        bs = parent._getBoxSizing();
      this._boxSizing = bs ? bs : DvtAfComponent.DEFAULT_BOX_SIZING;
    }
  }
  return this._boxSizing;
};

DvtAfComponent.prototype.isBorderBox = function() {
  return (this._getBoxSizing() == DvtCSSStyle.BORDER_BOX);
};

DvtAfComponent.prototype.isContentBox = function() {
  return (this._getBoxSizing() == DvtCSSStyle.CONTENT_BOX);
};


// Note: only valid after setContentOrigin
DvtAfComponent.prototype._getMarginBorderPaddingWidth = function() {
  return this._cx + this._rightx;
};

// Note: only valid after setContentOrigin
DvtAfComponent.prototype._getMarginBorderPaddingHeight = function() {
  return this._cy + this._bottomy;
};


//TODO:
DvtAfComponent.prototype.isContainerDisabled = function() {
  return false;
};

DvtAfComponent.prototype.associate = function(shape, logicalObject) {
  if (this.getAfContext().getEventManager())
    this.getAfContext().getEventManager().associate(shape, logicalObject ? logicalObject : this);
};


DvtAfComponent.prototype._getAfStyleAt = function(index) {
  var styleList = this.GetDefaultStyles();
  if (styleList.length > index) {
    return styleList[index];
  }
  return null;
};


// this method is overridden by DvtAfButtonLink for supporting mouse states
DvtAfComponent.prototype._setOverrideStyle = function(style) {
};

DvtAfComponent.prototype.postRender = function() {
  this.postRenderSelfBeforeChildren();
  this.postRenderChildren();
};


/**
 * Do any post-render processing on this obj before children.
 */
DvtAfComponent.prototype.postRenderSelfBeforeChildren = function() {
  //do nothing; subclasses must override and implement
};


/**
 * Do any post-render processing in children of this AfComponent
 */
DvtAfComponent.prototype.postRenderChildren = function() {

  var child;
  for (var i = 0; i < this.getNumChildren(); i++) {
    child = this.getChildAt(i);

    if ((! child.renderMe || child.renderMe()) && child.postRender) {
      child.postRender();
    }
  }

};


/**
 * create a new container and move all displayObj's children to the newContainer
 */
DvtAfComponent.prototype.CreateNewContainerForChildren = function() {
  var child;
  var dispObj = this.getDisplayObj();

  if (dispObj.getNumChildren() > 0) {
    // reparent disObj's children to new container
    var newContainer = new DvtContainer(this.getDvtContext());
    DvtAfComponent._reparentChildren(newContainer, dispObj);

    dispObj.addChild(newContainer);
    return newContainer;
  }

  else {
    return dispObj;
  }
};


/**
 * move all children from the container to this displayObj
 * remove the container
 * @param {DvtDisplayable} container
 */
DvtAfComponent.prototype.RemoveChildrenContainer = function(container) {

  var dispObj = this.getDisplayObj();

  // reparent container's children to dispObj
  DvtAfComponent._reparentChildren(dispObj, container);

  dispObj.removeChild(container);

};


/**
 * move children from source displayObj to target displayObj
 * @param {DvtDisplayable} target
 * @param {DvtDisplayable} source
 */
DvtAfComponent._reparentChildren = function(target, source) {
  var child;
  //Bug 16218082 - PANEL CARD DATA DISPLAYED OUTSIDE THE NODE.
  //children of panelcard didn't added to the clippingContainer
  var bindex = target.getNumChildren();

  for (var i = source.getNumChildren() - 1; i >= 0; i--) {
    child = source.getChildAt(i);
    target.addChildAt(child, bindex);
  }
};


/**
 * Gets WAI-ARIA label attribute
 * @return {string} WAI-ARIA label
 */
DvtAfComponent.prototype.getAriaLabel = function() {
  return this.getShortDesc();
};


/**
 * Adds WAI-ARIA attributes to the object
 * @param {DvtDisplayable} obj displayable object that has to get wai-aria attributes
 */
DvtAfComponent.prototype.addAccessibilityAttributes = function(obj) {
  var desc = this.getAriaLabel();
  if (!(obj && desc))
    return;

  // WAI-ARIA
  obj.setAriaRole(this.getAriaRole());
  if (!DvtAgent.deferAriaCreation()) {
    obj.setAriaProperty('label', desc);
  }
};


/**
 * Register itself as tabstop for keyboard navigation.
 * @override
 */
DvtAfComponent.prototype.registerAsTabStop = function() {
};


/**
 * Register itself as tabstop for keyboard navigation.
 */
DvtAfComponent.prototype.unregisterAsTabStop = function() {
  if (!this.getAfContext())
    return;

  this.getAfContext().unregisterTabStop(this);

  var cnt = this.getNumChildren();
  for (var i = 0; i < cnt; i++) {
    var child = this.getChildAt(i);
    if (child.unregisterAsTabStop)
      child.unregisterAsTabStop();
  }
};


/**
 * Show keyboard focus
 */
DvtAfComponent.prototype.showKeyboardFocusEffect = function() {
  if (!this._keyboardFocusEffect)
    this._keyboardFocusEffect = this.CreateKeyboardFocusEffect();
  this._keyboardFocusEffect.show();
  this._isShowingKeyboardFocusEffect = true;
  this.getDvtContext().setActiveElement(this.getDisplayObj()); //accessibility feature
};


/**
 * Hide keyboard focus
 */
DvtAfComponent.prototype.hideKeyboardFocusEffect = function() {
  if (this._keyboardFocusEffect)
    this._keyboardFocusEffect.hide();
  this._isShowingKeyboardFocusEffect = false;
};


/**
 * Returns true if this navigable is showing its keyboard focus effect
 * @return {boolean} true if showing keyboard focus effect
 */
DvtAfComponent.prototype.isShowingKeyboardFocusEffect = function() {
  return this._isShowingKeyboardFocusEffect;
};


/**
 * @protected
 * Creates keyboard focus effect for the component
 * @return {DvtKeyboardFocusEffect} keyboard focus effect
 */
DvtAfComponent.prototype.CreateKeyboardFocusEffect = function() {
  return new DvtKeyboardFocusEffect(this.getDvtContext(), this.getDisplayObj(), this.getDisplayObj().getDimensions());
};


/**
 * Handle "enter" event
 * @param {DvtKeyboardEvent} event keyboard event
 */
DvtAfComponent.prototype.handleKeyboardEvent = function(event) {
  var keyCode = event.keyCode;

  if (keyCode == DvtKeyboardEvent.ENTER) {
    var eventManager = this.getAfContext()._eventManager;
    var target = this.getDisplayObj();
    var point = target.localToStage(new DvtPoint(0, 0));
    var mouseEvent = eventManager.GenerateMouseEventFromKeyboardEvent(
        event, this.getDvtContext().getStage(), point.x, point.y);
    mouseEvent.target = target;
    eventManager.PreOnClick(mouseEvent);
  }
};


/**
 * Get size of the top level component.
 * returns null if size is not specified in width, height, css style, style class or skin.
 * @param {DvtAfContext} afContext
 * @return {DvtDimension} the size of top level component
 * Note: this method only looks at the top level component, NOT recurses on its children
 */
DvtAfComponent.prototype.getSize = function(afContext) {
  //stamp self, not recurses on its children
  var self = DvtAfComponent.superclass.stamp.call(this, afContext);
  var size = null;

  if (! self.renderMe || self.renderMe()) {
    self.setAfContext(afContext);

    if (self.createComputedStyle)
      self.createComputedStyle();

    var cssStyle = self.getCSSStyle();
    var ww = self._getExplicitWidth(cssStyle);
    var hh = self._getExplicitHeight(cssStyle);

    if (ww && hh) {
      size = new DvtDimension(ww, hh);
    }
  }

  return size;
};

DvtAfComponent.getBorderColor = function(style) {
  var bdColor;
  var bdWidth;

  if (style) {
    bdColor = style.getStyle(DvtCSSStyle.BORDER_COLOR);
    bdWidth = style.getBorderWidth();
  }

  if (! bdColor && bdWidth) {
    var bdTopColor = style.getStyle(DvtCSSStyle.BORDER_TOP_COLOR);
    var bdBottomColor = style.getStyle(DvtCSSStyle.BORDER_BOTTOM_COLOR);
    var bdLeftColor = style.getStyle(DvtCSSStyle.BORDER_LEFT_COLOR);
    var bdRightColor = style.getStyle(DvtCSSStyle.BORDER_RIGHT_COLOR);

    if (bdTopColor && bdBottomColor && bdLeftColor && bdRightColor) {
      if (bdLeftColor == bdRightColor && bdLeftColor == bdTopColor &&
          bdLeftColor == bdBottomColor)
        bdColor = bdLeftColor;
      //Note: we don't support individual side color
      else if (bdLeftColor == bdTopColor)
        bdColor = bdLeftColor;
      else if (bdRightColor == bdBottomColor)
        bdColor = bdRightColor;
    }
    if (! bdColor) {
      bdColor = style.getStyle(DvtCSSStyle.COLOR);
      if (! bdColor)
        bdColor = 'black';
    }
  }

  return bdColor;
};


/**
 * Gets aria role for the object
 * @return {string} aria role for the object
 */
DvtAfComponent.prototype.getAriaRole = function() {
  return 'img';
};

/**
 * Returns the currently set DvtAfContext
 * @return {DvtAfContext}
 */
DvtAfComponent.prototype.getAfContext = function() {
  return this._afContext;
};

/**
 * Sets the current DvtAfContext
 * @param {DvtAfContext} afContext
 */
DvtAfComponent.prototype.setAfContext = function(afContext) {
  this._afContext = afContext;
};


/**
 * Returns the currently set DvtContext
 * @return {DvtContext}
 */
DvtAfComponent.prototype.getDvtContext = function() {
  return this._afContext ? this._afContext.getCtx() : null;
};

/**
 * Indicates that this object should be ignored by any SelectionHandlers
 * @return {boolean}
 */
DvtAfComponent.prototype.isUnrelatedToSelection = function() {
  return true;
};

DvtBundle.addDefaultStrings(DvtBundle.AFCOMPONENT_PREFIX, {
  'ARIA_LABEL_ITEM_COUNT': '{0} of {1}'
});

/**
 *  A static class for DvtAfComponent objects
 *  @class DvtAfComponentUtils
 *  @constructor
 */
var DvtAfComponentUtils = function() {
};

DvtObj.createSubclass(DvtAfComponentUtils, DvtObj, 'DvtAfComponentUtils');

DvtAfComponentUtils._CLIP_PATH_SUFFIX = '_clp';


/**
 * @private
 * Calculate the content size for vertical layout
 * If a child does not fit remove it or add clipPath
 * returns max content size and dimensions of children
 *
 * @param {DvtAfContext} afContext  Dvt Af context
 * @param {DvtAfComponent} afRoot  The root of the afComponent tree.
 * @param {Array} arDim  Array of content dimensions
 * @param {boolean} isLink  Flag indicates if the content is link
 */
DvtAfComponentUtils._calcVContentSize = function(afContext, afRoot, arDim, isLink) {
  var cnt = afRoot.getNumChildren();
  if (cnt == 0) {
    return new DvtRectangle(0, 0, 0, 0);
  }
  var child;
  var contentWidth = 0;
  var contentHeight = 0;
  var toBeRm = [];

  var rootw;
  var rooth;
  if (isLink) {
    rootw = afRoot._aw;
    rooth = afRoot._ah;
    contentWidth = afRoot._cw;
    contentHeight = afRoot._ch;
  }
  else {
    rootw = afRoot._cw;
    rooth = afRoot._ch;
  }

  for (var i = 0; i < cnt; i++) {
    child = afRoot.getChildAt(i);

    if (! child.renderMe || child.renderMe()) {
      var dim = DvtAfComponent.getDimensions(child);
      var cw = dim.w;
      var ch = dim.h;

      // bug 13408941 remove component when size is 0
      //BUG 13942023: remove component when either width or height is 0
      // also remove children when there is no available space
      if (cw === 0 || ch === 0 || (!isLink && contentHeight == afRoot._ch)) {
        toBeRm.push(child);
        continue;
      }

      //collect the component doesn't fit
      if (child.getClipped() ||
          (contentHeight + ch) > (rooth + DvtMath.TOLERANCE) ||
          cw > (rootw + DvtMath.TOLERANCE)) {

        if (child.getClipped() == DvtAfComponent._REMOVE_LATER || afContext.getRmIfNotFit()) {
          toBeRm.push(child);
          continue;
        }
        else {
          //Bug 13842171 - CLIPPING SHOULD BE DONE BY THE PARENT CONTAINER
          // add clip path if not aexists
          //          if (child.isClippedNoClipPath()) {
          //            afRoot.addClipPath();
          //          }
          child.setClipContainer(afRoot);

          if (contentHeight + ch > rooth) {
            contentHeight = rooth;
          }
          else {
            contentHeight += ch;
          }
          if (cw > rootw) {
            contentWidth = rootw;
          }
          else {
            contentWidth = Math.max(contentWidth, cw);
          }
        }
      }
      else {
        if (! (child instanceof DvtAfSeparator)) {
          contentWidth = Math.max(contentWidth, cw);
        }
        contentHeight += ch;
      }
      arDim.push(dim);
    }
  }

  //remove child components that don't fit into the container
  for (var i = toBeRm.length - 1; i >= 0; i--) {
    child = toBeRm[i];
    DvtAfComponent.removeChild(child);
  }

  return new DvtRectangle(0, 0, contentWidth, contentHeight);

};


/**
 * Calculate the content size for horizontal layout
 * If a child does not fit remove it or add clipPath
 * returns max content size and dimensions of children
 *
 * @param {DvtAfContext} afContext
 * @param {DvtAfComponent} afRoot The root of the afComponent tree.
 */
DvtAfComponentUtils._calcHContentSize = function(afContext, afRoot, arDim) {
  var cnt = afRoot.getNumChildren();
  if (cnt == 0) {
    return new DvtRectangle(0, 0, 0, 0);
  }
  var child;
  var contentWidth = 0;
  var contentHeight = 0;
  var toBeRm = [];

  for (var i = 0; i < cnt; i++) {
    child = afRoot.getChildAt(i);

    if (! child.renderMe || child.renderMe()) {
      var dim = DvtAfComponent.getDimensions(child);
      var cw = dim.w;
      var ch = dim.h;

      // bug 13408941 remove component when size is 0
      //BUG 13942023: remove component when either width or height is 0
      // also remove children when there is no available space
      if (cw === 0 || ch === 0 || contentWidth == afRoot._cw) {
        toBeRm.push(child);
        continue;
      }

      //collect the component doesn't fit
      if (child.getClipped() ||
          (contentWidth + cw) > (afRoot._cw + DvtMath.TOLERANCE) ||
          ch > (afRoot._ch + DvtMath.TOLERANCE)) {
        if (child.getClipped() == DvtAfComponent._REMOVE_LATER || afContext.getRmIfNotFit()) {
          toBeRm.push(child);
          continue;
        }
        else {
          //Bug 13842171 - CLIPPING SHOULD BE DONE BY THE PARENT CONTAINER
          // add clip path if not aexists
          //          if (child.isClippedNoClipPath()) {
          //            afRoot.addClipPath();
          //          }
          child.setClipContainer(afRoot);

          if (contentWidth + cw > afRoot._cw) {
            contentWidth = afRoot._cw;
          }
          else {
            contentWidth += cw;
          }
          if (ch > afRoot._ch) {
            contentHeight = afRoot._ch;
          }
          else {
            contentHeight = Math.max(contentHeight, ch);
          }
        }
      }
      else {
        if (! (child instanceof DvtAfSeparator)) {
          contentHeight = Math.max(contentHeight, ch);
        }
        contentWidth += cw;
      }
      arDim.push(dim);
    }
  }

  //remove child components that don't fit into the container
  for (var i = toBeRm.length - 1; i >= 0; i--) {
    child = toBeRm[i];
    DvtAfComponent.removeChild(child);
  }

  return new DvtRectangle(0, 0, contentWidth, contentHeight);

};


/**
 * Layout the content vertically
 * If a child does not fit remove it or add clipPath
 * @param {DvtAfContext} afContext Dvt Af Context
 * @param {DvtAfComponent} afRoot The root of the afComponent tree.
 */
DvtAfComponentUtils.doVerticalLayout = function(afContext, afRoot) {
  if (! afRoot) {
    return;
  }

  var isLink = (afRoot instanceof DvtAfLink);
  var arDim = [];
  var afRootDim = DvtAfComponentUtils._calcVContentSize(afContext, afRoot, arDim, isLink);
  if (arDim.length == 0) {
    afRoot._cw = afRoot.getCalcWidth(afRootDim.w);
    afRoot._ch = afRoot.getCalcHeight(afRootDim.h);
    return;
  }

  var hAlign = afRoot.getEffectiveHAlign();
  var contentX = afRoot.getCX();
  var contentY = afRoot.getCY();

  //TODO: set on client area size (_cw and _ch) so we do not need contentSize
  //use explicit sizes if set
  //TODO: Note width and height should not include padding, border and margin
  //add afRoot.getCX() and afRoot.getCY() to account for right and bottom padding
  //around children
  if (isLink) {
    contentY += afRoot._ch;

    if (hAlign == DvtAfComponent.HALIGN_RIGHT && afRootDim.w > afRoot._cw) {
      afRoot.getDisplayObj().rightAlign(afRootDim.w, afRoot._cw, true);
    }

    afRoot._cw = afRootDim.w;
    afRoot._ch = afRootDim.h;


  }
  else {
    afRoot._cw = afRoot.getCalcWidth(afRootDim.w);
    afRoot._ch = afRoot.getCalcHeight(afRootDim.h);
  }

  var currY = contentY;
  var child;
  var childx;
  var childy;

  //TODO: need to get AfComponent children from content pane
  var cnt = afRoot.getNumChildren();
  for (var i = 0; i < cnt; i++) {
    if (! arDim[i])
      continue;

    child = afRoot.getChildAt(i);

    if (! child.renderMe || child.renderMe()) {
      var cw = arDim[i].w;
      var ch = arDim[i].h;

      childy = currY;

      //stretch the separator to fill the width of the layout,
      //and re-render it explicitly
      if (child instanceof DvtAfSeparator) {
        //make separator the width of the scrollable area, not the viewport
        if (afRoot._cw) {
          child.setMaxWidth(afRoot._cw);
        }
        childx = contentX;
      }
      else {
        if (hAlign == DvtAfComponent.HALIGN_LEFT) {
          childx = contentX;
        }
        else if (hAlign == DvtAfComponent.HALIGN_CENTER) {
          childx = contentX + (afRoot._cw - cw) / 2;
        }
        else if (hAlign == DvtAfComponent.HALIGN_RIGHT) {
          childx = contentX + afRoot._cw - cw;
        }
      }

      // set group translate x and y
      DvtAfComponent._setTranslateGroup(child, childx, childy);
      currY += ch;
    }
  }
};


/**
 * Layout the content horizontally
 * Layout the content of an afComponent.
 * If a child does not fit remove it or add clipPath
 * @param {DvtAfContext} afContext
 * @param {DvtAfComponent} afRoot The afComponent.
 */
DvtAfComponentUtils.doHorizontalLayout = function(afContext, afRoot) {
  if (! afRoot) {
    return;
  }
  var arDim = [];
  var afRootDim = DvtAfComponentUtils._calcHContentSize(afContext, afRoot, arDim);
  if (arDim.length == 0) {
    afRoot._cw = afRoot.getCalcWidth(afRootDim.w);
    afRoot._ch = afRoot.getCalcHeight(afRootDim.h);
    return;
  }

  //TODO: set on client area size (_cw and _ch) so we do not need contentSize
  //use explicit sizes if set
  //TODO: Note width and height should not include padding, border and margin
  //add afRoot.getCX() and afRoot.getCY() to account for right and bottom padding
  //around children
  afRoot._cw = afRoot.getCalcWidth(afRootDim.w);
  afRoot._ch = afRoot.getCalcHeight(afRootDim.h);

  var vAlign = afRoot.getVAlign();
  var contentX = afRoot.getCX();
  var contentY = afRoot.getCY();

  var child;
  var childx;
  var childy;

  var currX;

  //BiDi for horizontal layout
  //TODO: verify the size is correct
  //if an explicit width is set, or if the content is wider than the client width,
  //then start laying out at right side of client area
  //otherwise, start laying out at right side of content width
  if (DvtAgent.isRightToLeft(afRoot.getDvtContext())) {
    currX = contentX + afRoot.getCalcWidth(afRootDim.w);
  }
  else {
    currX = contentX;
  }

  //TODO: need to get AfComponent children from content pane
  var cnt = afRoot.getNumChildren();
  for (var i = 0; i < cnt; i++) {
    if (! arDim[i])
      continue;

    child = afRoot.getChildAt(i);

    if (! child.renderMe || child.renderMe()) {

      var cw = arDim[i].w;
      var ch = arDim[i].h;

      if (vAlign == DvtAfComponent.VALIGN_TOP) {
        childy = contentY;
      }
      else if (vAlign == DvtAfComponent.VALIGN_MIDDLE) {
        childy = contentY + (afRoot._ch - ch) / 2;
      }
      else if (vAlign == DvtAfComponent.VALIGN_BOTTOM) {
        childy = contentY + afRoot._ch - ch;
      }

      //BiDi for horizontal layout
      if (DvtAgent.isRightToLeft(afRoot.getDvtContext())) {
        //subtract width of component first, because x specifies position
        //of left side of component, not right side
        currX -= cw; //child.getCalculatedWidth();
        childx = currX;
      }
      else {
        childx = currX;
        currX += cw;
      }


      //stretch the separator to fill the width of the layout,
      //and re-render it explicitly
      if (child instanceof DvtAfSeparator) {
        //make separator the width of the scrollable area, not the viewport
        if (afRoot._cw) {
          child.setMaxWidth(afRoot._cw - currX);
        }
      }



      // set group translate x and y
      DvtAfComponent._setTranslateGroup(child, childx, childy);
    }
  }

};

/**
 * Base class for all DvtAfComponentHandler
 * This is an abstract class, do not use directly!!!
 * @param {function} constructor the af component constructor
 * @constructor
 */
var DvtAfTagHandler = function(constructor) {
  this.Init(constructor);
};

DvtObj.createSubclass(DvtAfTagHandler, DvtObj, 'DvtAfTagHandler');

/**
 * Initializes the instance.
 * @param {function} constructor the af component constructor
 */
DvtAfTagHandler.prototype.Init = function(constructor) {
  this._constructor = constructor;
};

/**
 * @protected
 * parse element and its attributes, but not children tags
 * @param {DOM Element} element
 * @return {DvtAfComponent} component
 */
DvtAfTagHandler.prototype.createComponent = function(element) {
  // create DvtAfComponent object
  var comp = this._createComponent();

  // set attributes
  if (comp) {
    comp.setProperties(element.getAttributes());
  }
  return comp;
};

/**
 * @protected
 * parse json object
 * @param {JSON Object} object
 * @return {DvtAfComponent} component
 */
DvtAfTagHandler.prototype.createJsonComponent = function(object) {
  var comp = this._createComponent();
  var value;
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      value = object[key];
      comp.setProperty(key, value);
    }
  }
  return comp;
};

/**
 * @protected
 * Add children to the parent component
 * @param {DvtAfComponent} parent component
 * @param {Array} childList a list of child component
 */
DvtAfTagHandler.prototype.addChildren = function(parent, childList) {
  if (parent && childList && childList.length > 0) {
    for (var i = 0; i < childList.length; i++) {
      if (childList[i]) {
        parent.addChild(childList[i]);
      }
    }
  }
};

/**
 * @private
 * Creates a new instance of the af component
 * @return {DvtAfComponent}
 */
DvtAfTagHandler.prototype._createComponent = function() {
  return new this._constructor();
};
/**
 * Dvt AfComponent Factory
 */
var DvtAfComponentFactory = function() {
};

DvtObj.createSubclass(DvtAfComponentFactory, DvtObj, 'DvtAfComponentFactory');

/*
 * Performance flags
 */
DvtAfComponentFactory.CACHE_STYLES = false;


/**
 * @private
 */
DvtAfComponentFactory._NAME_F = 'f';

DvtAfComponentFactory._NAME_COMPONENT = 'component';

DvtAfComponentFactory._registeredTags = {};


/**
 * Register a tag with DvtAfComponentFactory
 * @param {string} tagName the name of the tag
 * @param {function} constructor the af component constructor
 */
DvtAfComponentFactory.registerComponent = function(tagName, constructor) {
  if (tagName && constructor) {
    DvtAfComponentFactory._registeredTags[tagName] = new DvtAfTagHandler(constructor);
  }
};


/*-------------------------------------------------------------------------*/
/*   Parse an XML node into an AfComponent tree                            */
/*-------------------------------------------------------------------------*/
/**
 * Parses the XML node and returns the root of the DvtAfComponent tree.
 * @param {DvtXmlNode} xmlNode the XML node to parse
 * @return {DvtAfComponent} the root of the DvtAfComponent tree
 */
DvtAfComponentFactory.parseXml = function(xmlNode) {
  var childList = DvtAfComponentFactory._parseChildren(xmlNode);
  return (childList) ? childList[0] : null;
};


/**
 * Parses the JSON node and returns the root of the DvtAfComponent tree.
 * @param {JSON Object} jsonArray the JSON array to parse
 * @return {DvtAfComponent} the root of the DvtAfComponent tree
 */
DvtAfComponentFactory.parseJson = function(jsonArray) {
  var childList = DvtAfComponentFactory._parseJsonChildren(jsonArray);
  return (childList) ? childList[0] : null;
};


/**
 * Parses the XML element and returns the DvtAfComponent tree.
 * @param {DvtXmlNode} tagElement XML element to parse
 * @return {DvtAfComponent} the root of the DvtAfComponent tree
 */
DvtAfComponentFactory.parseElement = function(tagElement) {
  var tagName = tagElement.getName();
  var tagHandler = DvtAfComponentFactory._registeredTags[tagName];

  if (!tagHandler) {
    throw 'No tag handler for ' + tagName;
  }
  var tagComponent = tagHandler.createComponent(tagElement);

  if (tagComponent != null) {
    // get a list of child components
    var childList = DvtAfComponentFactory._parseChildren(tagElement);

    // call the handler to add children
    tagHandler.addChildren(tagComponent, childList);
  }

  return tagComponent;
};


/**
 * Parses the JSON element and returns the DvtAfComponent tree.
 * @param {JSON Object} tagElement JSON element to parse
 * @return {DvtAfComponent} the root of the DvtAfComponent tree
 */
DvtAfComponentFactory.parseJsonElement = function(tagElement) {
  var tagName = tagElement[DvtAfComponentFactory._NAME_COMPONENT];
  var tagHandler = DvtAfComponentFactory._registeredTags[tagName];

  if (!tagHandler) {
    throw 'No tag handler for ' + tagName;
  }
  var tagComponent = tagHandler.createJsonComponent(tagElement);

  if (tagComponent != null) {
    if (tagElement['children']) {
      var childList = DvtAfComponentFactory._parseJsonChildren(tagElement['children']);
      tagHandler.addChildren(tagComponent, childList);
    }
  }

  return tagComponent;
};


/**
 * @private
 * @param {DvtXmlNode} xmlNode XML element to parse
 * @return {DvtAfComponent} a list of child DvtAfComponent objects
 */
DvtAfComponentFactory._parseChildren = function(xmlNode) {
  var childList = null;

  if (xmlNode) {
    var childNodes = xmlNode.getChildNodes();
    var childComponent;
    childList = [];

    for (var i = 0; i < childNodes.length; i++) {
      var child = childNodes[i];
      var childName = child.getName();
      // only parse element
      if (child && childName != null) {
        //skip over facet tag
        if (childName === DvtAfComponentFactory._NAME_F) {
          continue;
        }
        childComponent = DvtAfComponentFactory.parseElement(child);
        if (childComponent) {
          childList.push(childComponent);
        }
      }
    }
  }

  return childList;
};


/**
 * @private
 * @param {JSON Object} jsonArray JSON array to parse
 * @return {DvtAfComponent} a list of child DvtAfComponent objects
 */
DvtAfComponentFactory._parseJsonChildren = function(jsonArray) {
  var childList = [];

  for (var i = 0; i < jsonArray.length; i++) {
    var child = jsonArray[i];
    var childName = child[DvtAfComponentFactory._NAME_COMPONENT];
    if (child && childName != null) {
      var childComponent = DvtAfComponentFactory.parseJsonElement(child);
      if (childComponent) {
        childList.push(childComponent);
      }
    }
  }
  return childList;
};

/*---------------------------------------------------------------------*/
/*   Parse and Layout an AfComponent tree                              */
/*---------------------------------------------------------------------*/
/**
 * @param {DvtAfContext} afContext may contain factory, available size, fontSize and ELcontext
 * @param {DvtXmlNode} xmlNode the XML node to parse
 * @param {DvtDisplayable} parent parent of the displayable AfComponent tree
 * @return {DvtDisplayable} the root of displayable AfComponent tree
 */
DvtAfComponentFactory.parseXmlAndLayout = function(afContext, xmlNode, parent)
{
  // parse xmlNode into a DvtAfComponent tree
  var templateTree = DvtAfComponentFactory.parseXml(xmlNode);
  return DvtAfComponentFactory.parseAndLayout(afContext, templateTree, parent);
};


/*---------------------------------------------------------------------*/
/*   Parse and Layout an AfComponent tree                              */
/*---------------------------------------------------------------------*/
/**
 * @param {DvtAfContext} afContext may contain factory, available size, fontSize and ELcontext
 * @param {DvtAfComponent} templateTree root of the DvtAfComponent tree
 * @param {DvtDisplayable} parent parent of the displayable AfComponent tree
 * @return {DvtDisplayable} the root of displayable AfComponent tree
 */
DvtAfComponentFactory.parseAndLayout = function(afContext, templateTree, parent) {
  // stamp out templateTree
  // Note: if xmlstring contains EL exps, ELcontext must provide data
  var compTree;

  //BUG 14456277: Save the parent node for aligning popups
  afContext.setParentNode(parent);

  //always call "stamp" just in case the component has a showPopupBehavior
  //  if (afContext.getELContext())
  compTree = templateTree.stamp(afContext.getELContext());
  //  else
  //    compTree = templateTree;

  return DvtAfComponentFactory.doLayout(afContext, compTree, parent);
};


/*---------------------------------------------------------------------*/
/*   Parse and Layout an AfComponent tree                              */
/*---------------------------------------------------------------------*/
/**
 * @param {DvtAfContext} afContext may contain factory, available size, fontSize and ELcontext
 * @param {DvtAfComponent} templateTree root of the DvtAfComponent tree
 * @param {DvtDisplayable} parent parent of the displayable AfComponent tree
 * @return {DvtDisplayable} the root of displayable AfComponent tree
 */
DvtAfComponentFactory.doLayout = function(afContext, compTree, parent) {
  var dispTree = DvtAfComponentFactory._createDisplayObj(afContext, compTree, parent);

  // layout the displayable tree
  // Note: render code uses available size and font size if specified
  if (dispTree && compTree) {
    //     compTree.render(afContext);
    DvtAfComponentFactory._render(afContext, dispTree, compTree);
  }

  return dispTree;
};



//Performance: make sure using the same context for parsing, stamping
//sizing, layout and rendering
//Note: this method returns dispTree, but keep compTree in the context
DvtAfComponentFactory.parseAndStamp = function(afContext, templateTree, parent) {
  // stamp out templateTree
  // Note: if xmlstring contains EL exps, ELcontext must provide data
  var compTree;

  // used in panelCard
  afContext.setParentNode(parent);

  //always call "stamp" just in case the component has a showPopupBehavior
  //  if (afContext.getELContext())
  compTree = templateTree.stamp(afContext.getELContext());
  //  else
  //    compTree = templateTree;

  var dispTree = DvtAfComponentFactory._createDisplayObj(afContext, compTree, parent);

  //TODO save compTree in dispTree for now
  if (dispTree)
    dispTree._compTree = compTree;

  return dispTree;
};

//Performance: make sure using the same context for parsing, stamping
//sizing, layout and rendering
DvtAfComponentFactory.layoutAndRender = function(afContext, dispTree) {
  if (dispTree) {
    //     dispTree._compTree.render(afContext);

    // clear dirty flag
    //    afContext._addDirty(-Infinity);

    DvtAfComponentFactory._render(afContext, dispTree, dispTree._compTree);
  }
};


// create displayable object tree and add to the parent
DvtAfComponentFactory._createDisplayObj = function(afContext, compTree, parent) {
  var dispTree;

  // create displayable object tree,
  // Note: afContext must contain factory
  if (compTree) {
    dispTree = compTree.createDisplayObj(afContext);
  }

  // add dispTree to parent so size and metrics may be obtained
  if (parent && dispTree) {
    parent.addChild(dispTree);
  }

  return dispTree;
};


//Render the component tree
DvtAfComponentFactory._render = function(afContext, dispTree, compTree) {
  if (compTree) {
    compTree.render(afContext);
    compTree.postRender(afContext);

    // remove the root node if it's too big for the container
    if (afContext.getRmIfNotFit()) {
      var dim = DvtAfComponent.getDimensions(compTree);
      var parent = dispTree.getParent();
      if ((parent && parent.removeChild) &&
          ((dim.w === 0 && dim.h === 0) ||
           dim.w > (afContext.getAvailableWidth() + DvtMath.TOLERANCE) ||
           dim.h > (afContext.getAvailableHeight() + DvtMath.TOLERANCE) ||
           compTree.getClipped())) {
        parent.removeChild(dispTree);
      }
    }
    //Bug 13842171 - CLIPPING SHOULD BE DONE BY THE PARENT CONTAINER
    // add clipPath in case the root component is not a container
    else if (compTree.getClipped()) {
      compTree.addClipPath();
    }

    // if dirty flag is on, re render the component tree again
    //    if (afContext._isDirty()) {
    dispTree._compTree = compTree;

    // clear dirty flag
    //      afContext._addDirty(-Infinity);
    //      compTree._render(afContext, dispTree, compTree);
    //    }

  }
};


DvtAfComponentFactory.getCompTree = function(dispTree) {
  if (dispTree)
    return dispTree._compTree;

  return null;
};


/**
 * Finds the DvtAfComponent associated with a DvtDisplayable
 *
 * @param {DvtDisplayable}
 * @return {DvtAfComponent}
 */
DvtAfComponentFactory.getAfComponent = function(displayable) {
  var currentDisplayable = displayable;
  var afComp = null;

  while (!afComp && currentDisplayable) {
    afComp = currentDisplayable._afComp;
    currentDisplayable = currentDisplayable.getParent();
  }

  return afComp;
};

/**
 * Find the AF component with the given id in the AfComponent tree
 * @param {DvtAfComponent} afComp The DvtAfComponent tree to search for a matching id
 * @param {String} id The AF component id
 * @return {DvtAfComponent}
 */
DvtAfComponentFactory.findAfComponent = function(afComp, id) {
  if (afComp == null || id == null)
    return null;

  if (afComp.getId() == id) {
    return afComp;
  } else {
    var numChildren = afComp.getNumChildren();
    for (var i = 0; i < numChildren; i++) {
      var child = afComp.getChildAt(i);
      if (id == child.getId()) {
        return child;
      } else {
        var matchedChild = DvtAfComponentFactory.findAfComponent(child, id);
        if (matchedChild)
          return matchedChild;
      }
    }
  }
  return null;
};


/*---------------------------------------------------------------------*/
/*   Get dimensions of the AfComponent tree                            */
/*---------------------------------------------------------------------*/
/**
 * @param {DvtDisplayable} the root of displayable AfComponent tree
 * @param {DvtDisplayable} targetCoordinateSpace The displayable defining the target coordinate space.
 * @return {DvtRectangel} the bounding rectangle  of the displable object
 */
DvtAfComponentFactory.getBounds = function(dispTree, targetCoordinateSpace) {
  var comp = DvtAfComponentFactory.getCompTree(dispTree);

  if (comp && (comp instanceof DvtAfComponent)) {
    var bounds = comp.getBounds();
    return targetCoordinateSpace ?
        dispTree.ConvertCoordSpaceRect(bounds, targetCoordinateSpace) : bounds;
  }
  else {
    return dispTree.getDimensions(targetCoordinateSpace);
  }
};

//returns whether size is specified in the tempalteTree
DvtAfComponentFactory.getSize = function(afContext, templateTree, parent) {

  afContext.setParentNode(parent);

  return templateTree.getSize(afContext);
};


/**
 * @constructor
 * Base class for DvtAfLink and DvtAfButton
 */
var DvtAfButtonLink = function() {
  this.Init();
};

/*
 * make DvtAfButtonLink a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfButtonLink, DvtAfComponent, 'DvtAfButtonLink');

// Common Attributes
DvtAfButtonLink.ATTR_TEXT = 'text';
DvtAfButtonLink.ATTR_DISABLED = 'disabled';

// AfCommandImageLink Attributes
DvtAfButtonLink.ATTR_ICON = 'icon';
DvtAfButtonLink.ATTR_ICON_POSITION = 'iconPosition';
//TODO: need for button???
DvtAfButtonLink.ATTR_DISABLED_ICON = 'disabledIcon';

// AfGoLink Attributes
DvtAfButtonLink.ATTR_DESTINATION = 'destination';
DvtAfButtonLink.ATTR_TARGET_FRAME = 'targetFrame';
DvtAfButtonLink.ATTR_FOCUSABLE = 'focusable';

// valid values for iconPosition. Default: leading
DvtAfButtonLink.ICON_POSITION_LEADING = 'leading';
DvtAfButtonLink.ICON_POSITION_TRAILING = 'trailing';
DvtAfButtonLink.ICON_POSITION_TOP = 'top';
DvtAfButtonLink.ICON_POSITION_BOTTOM = 'bottom';


/*---------------------------------------------------------------------*/
/*   AfComponent attributes                                            */
/*---------------------------------------------------------------------*/
DvtAfButtonLink.prototype.getText = function() {
  return this.getStringProp(DvtAfButtonLink.ATTR_TEXT, '');
};

DvtAfButtonLink.prototype.setText = function(text) {
  this.setProperty(DvtAfButtonLink.ATTR_TEXT, text);

  if (this.getContentShape()) {
    this.getContentShape().setTextString(text);
  }
};

DvtAfButtonLink.prototype.isDisabled = function() {
  var dis = this.getBooleanProp(DvtAfButtonLink.ATTR_DISABLED, false);
  return dis || this.isContainerDisabled();
};

DvtAfButtonLink.prototype.setDisabled = function(disabled) {
  this.setProperty(DvtAfButtonLink.ATTR_DISABLED, disabled);
};


DvtAfButtonLink.prototype.getIcon = function() {
  return this.getProperty(DvtAfButtonLink.ATTR_ICON);
};

DvtAfButtonLink.prototype.setIcon = function(icon) {
  this.setProperty(DvtAfButtonLink.ATTR_ICON, icon);
};

DvtAfButtonLink.prototype.getIconPosition = function() {
  return this.getStringProp(DvtAfButtonLink.ATTR_ICON_POSITION, 'leading');
};

DvtAfButtonLink.prototype.setIconPosition = function(iconPosition) {
  this.setProperty(DvtAfButtonLink.ATTR_ICON_POSITION, iconPosition);
};

DvtAfButtonLink.prototype.getDisabledIcon = function() {
  return this.getProperty(DvtAfButtonLink.ATTR_DISABLED_ICON);
};

DvtAfButtonLink.prototype.setDisabledIcon = function(icon) {
  this.setProperty(DvtAfButtonLink.ATTR_DISABLED_ICON, icon);
};

DvtAfButtonLink.prototype.getDestination = function() {
  return this.getProperty(DvtAfButtonLink.ATTR_DESTINATION);
};


DvtAfButtonLink.prototype.setDestination = function(destination) {
  this.setProperty(DvtAfButtonLink.ATTR_DESTINATION, destination);

  if (this.getContentShape()) {
    this.getContentShape().setDestination(destination);
  }
};

//Can either specify a user-defined frame name, or use one of the following values:
//    _blank: The link opens the document in a new window.
//    _parent: The link opens the document in the window of the parent.
//             For example, if the link appeared in a dialog window, the resulting page
//                          would render in the parent window.
//    _self: The link opens the document in the same page or region.
//    _top: The link opens the document in a full window, replacing the entire page.

DvtAfButtonLink.prototype.getTargetFrame = function() {
  return this.getProperty(DvtAfButtonLink.ATTR_TARGET_FRAME, false);
};

DvtAfButtonLink.prototype.setTargetFrame = function(targetFrame) {
  this.setProperty(DvtAfButtonLink.ATTR_TARGET_FRAME, targetFrame);
};

DvtAfButtonLink.prototype.isCommandComponent = function() {
  return (! this.getDestination());
};


DvtAfButtonLink.prototype.getIconSource = function(mouseState) {
  var iconSrc;

  switch (mouseState) {
    case DvtButton.STATE_DISABLED:
      iconSrc = this.getDisabledIcon();
      break;

    //TODO: support different icons for mouse state
    /*
  case DvtButton.STATE_OVER:
    iconSrc = this.getOverIcon();
    break;

  case DvtButton.STATE_DOWN:
    iconSrc = this.getDownIcon();
    break;
    */
    case DvtButton.STATE_ENABLED:
    default:
      iconSrc = this.getIcon();
      break;
  }

  return iconSrc;

};


/*---------------------------------------------------------------------*/
/*   Create Content Shape                                              */
/*---------------------------------------------------------------------*/
DvtAfButtonLink._createContentShape = function(dvtContext, afComp, mouseState, textStyle) {

  var id = afComp._getUniqueId() + '_s' + mouseState;
  var text = afComp.getText();
  var iconSrc = afComp.getIconSource(mouseState);
  var isLink = (afComp instanceof DvtAfLink);

  var group = null;

  // create a container for both icon and button text
  if (! isLink) {
    group = new DvtRect(dvtContext, 0, 0, 0, 0, id);
  }
  else if (iconSrc && text) {
    group = new DvtContainer(dvtContext, id);
  }

  var iconShape;
  var textShape;
  if (iconSrc) {
    iconShape = new DvtImage(dvtContext, iconSrc, 0, 0, 1, 1, id + '_img');

    if (group)
      group.addChild(iconShape);
    else
      group = iconShape;
  }

  if (text) {
    textShape = afComp.createTextShape(false, text, textStyle,
                                       afComp.GetTextStyle(mouseState), id + '_txt');

    //Remove the default cursor setting if this component is a link
    if (isLink) {
      textShape.setCursor(null);
    }

    if (group)
      group.addChild(textShape);
    else
      group = textShape;
  }

  if (! afComp._shapeLst) {
    afComp._shapeLst = [];
    afComp._iconLst = [];
    afComp._textLst = [];
  }
  afComp._shapeLst[mouseState] = group;

  if (iconShape)
    afComp._iconLst[mouseState] = iconShape;

  if (textShape)
    afComp._textLst[mouseState] = textShape;

  return group;
};


/**
 * @override
 */
DvtAfButtonLink._doLayout = function(afComp, mouseState, textStyle, arrowWidth) {

  // if icon specified, load image and set image (x, y)
  var iconPos = afComp.getIconPosition();
  var iconShape = afComp._iconLst[mouseState];
  var iconDim = afComp.RenderIcon(iconShape);
  if (! iconDim) {
    iconPos = 'noIcon';
  }

  var textShape = afComp._textLst[mouseState];
  var textRendered = textShape != null;
  if (! textShape) {
    if (iconPos == 'noIcon')
      return new DvtRectangle(0, 0, 0, 0);
    iconPos = 'noText';
  }

  var clientWidth = afComp._cw;
  var clientHeight = afComp._ch;
  var hpadding;
  var ww = 0;
  var hh = 0;
  var textDim;
  var isTruncated = false;
  var txtMaxWidth = clientWidth - arrowWidth;

  switch (iconPos) {
    case 'leading':
    case 'trailing':
      //.af_link_text {margin-left:3px}
      //.af_link.p_AFTextOnly .af_link_text {margin-left:0px}
      //.af_link.p_AFTrailing .af_link_text {margin-right:3px;margin-left:0px}
      if (textStyle) {
        hpadding = textStyle.getPadding(DvtCSSStyle.PADDING_LEFT) + textStyle.getMargin(DvtCSSStyle.MARGIN_LEFT) +
            textStyle.getPadding(DvtCSSStyle.PADDING_RIGHT) + textStyle.getMargin(DvtCSSStyle.MARGIN_RIGHT);
      }

      // For simple skin, allow some spaces between icon and button text
      if (! hpadding)
        hpadding = 3;

      txtMaxWidth = txtMaxWidth - iconDim.w - hpadding;

      break;
  }

  // use txtw instead of textDim.w when set text.x and icon.x
  var txtw = 0;
  if (textShape) {
    // set max width on link text
    //if the link is wider than the area allowed it, truncate the text
    if (DvtTextUtils.fitText(textShape, txtMaxWidth, clientHeight, textShape.getParent())) {
      textDim = textShape.getDimensions();
      isTruncated = textShape.isTruncated();

      txtw = isTruncated ? txtMaxWidth : textDim.w;
    }
    else {
      if (iconPos == 'noIcon')
        return new DvtRectangle(0, 0, 0, 0);
      else
        iconPos = 'noText';
      textRendered = false;
    }
  }

  var rtl = DvtAgent.isRightToLeft(afComp.getDvtContext());

  var diff;
  var vpadding = Math.max(textStyle.getPadding(DvtCSSStyle.PADDING_TOP) + textStyle.getPadding(DvtCSSStyle.PADDING_BOTTOM), 2);

  var xx = afComp.getCX();
  if (! xx)
    xx = 0;
  var yy = afComp.getCY();
  if (! yy)
    yy = 0;

  // Set X and Y position (to account for padding, etc.)
  switch (iconPos) {
    case 'top':
      textShape.alignCenter();
      diff = (txtw - iconDim.w) / 2;
      if (diff > 0) {
        iconDim.x = (rtl ? xx + arrowWidth : xx) + diff;
        textDim.x = (rtl ? xx + arrowWidth : xx) + txtw / 2;
        ww = txtw;
      }
      else {
        iconDim.x = (rtl ? xx + arrowWidth : xx);
        textDim.x = (rtl ? xx + arrowWidth : xx) - diff + txtw / 2;
        ww = iconDim.w;
      }

      iconDim.y = yy;
      vpadding = 1;
      textDim.y = yy + iconDim.h + vpadding;

      hh = iconDim.h + vpadding + textDim.h;
      break;

    case 'bottom':
      textShape.alignCenter();
      diff = (txtw - iconDim.w) / 2;
      if (diff > 0) {
        iconDim.x = (rtl ? xx + arrowWidth : xx) + diff;
        textDim.x = (rtl ? xx + arrowWidth : xx) + txtw / 2;
        ww = txtw;
      }
      else {
        iconDim.x = (rtl ? xx + arrowWidth : xx);
        textDim.x = (rtl ? xx + arrowWidth : xx) - diff + txtw / 2;
        ww = iconDim.w;
      }
      textDim.y = yy;
      vpadding = 1;
      iconDim.y = yy + textDim.h + vpadding;

      hh = textDim.h + vpadding + iconDim.h;
      break;

    case 'trailing':
      ww = txtw + hpadding + iconDim.w;
      hh = Math.max(textDim.h, iconDim.h) + vpadding;

      if (rtl) {
        iconDim.x = xx + arrowWidth;
        textDim.x = iconDim.x + iconDim.w + hpadding + txtw;
        textShape.alignRight();
      }
      else {
        iconDim.x = xx + txtw + hpadding;
        textDim.x = xx;
        textShape.alignLeft();
      }

      diff = (textDim.h - iconDim.h) / 2;
      if (diff > 0) {
        textDim.y = yy;
        iconDim.y = yy + diff;
      }
      else {
        textDim.y = yy - diff;
        iconDim.y = yy;
      }
      break;

    case 'leading':
      ww = iconDim.w + hpadding + txtw;
      hh = Math.max(textDim.h, iconDim.h) + vpadding;

      if (rtl) {
        iconDim.x = xx + arrowWidth + txtw + hpadding;
        textDim.x = xx + arrowWidth + txtw;
        textShape.alignRight();
      }
      else {
        iconDim.x = xx;
        textDim.x = xx + iconDim.w + hpadding;
        textShape.alignLeft();
      }

      diff = (iconDim.h - textDim.h) / 2;
      if (diff > 0) {
        iconDim.y = yy;
        textDim.y = yy + diff;
      }
      else {
        iconDim.y = yy - diff;
        textDim.y = yy;
      }
      break;

    case 'noIcon':
      if (rtl) {
        textDim.x = xx + arrowWidth + txtw;
        textShape.alignRight();
      }
      else {
        textDim.x = xx;
        textShape.alignLeft();
      }
      textDim.y = yy;
      ww = txtw;
      hh = textDim.h + vpadding;
      break;

    case 'noText':
      iconDim.x = rtl ? xx + arrowWidth : xx;
      iconDim.y = yy;
      ww = iconDim.w;
      hh = iconDim.h;
      break;
  }

  if (textShape && textRendered) {
    //check width and height
    // check if text isTruncated
    if (!isTruncated) {
      // add clip path if needed
      afComp._addClipPathIfNeeded(afComp.getAfContext(), xx, yy,
                                  afComp._aw, ww, afComp._ah, hh, textShape);
    }

    textShape.setX(textDim.x);
    textShape.setY(textDim.y);
  }

  // set x and y on the image shape
  if (iconDim) {
    iconShape.setX(iconDim.x);
    iconShape.setY(iconDim.y);
  }

  var dim = new DvtRectangle(0, 0, ww, hh);

  // handle menu dropdown arrow
  dim = afComp._RenderArrowIcon(mouseState, dim);

  dim.w = afComp.getCalcWidth(dim.w);
  dim.h = afComp.getCalcHeight(dim.h);

  //return contentBounds
  return dim;
};

/**
 * Render icon
 * @param {DvtImage} iconShape Icon image object
 * @return {DvtRectangle} dimension of the loaded image
 */
DvtAfButtonLink.prototype.RenderIcon = function(iconShape) {
  var dim;
  if (iconShape) {
    var iconStyle = this.GetIconStyle();
    if (iconStyle) {
      var styleWidth = iconStyle.getWidth();
      var styleHeight = iconStyle.getHeight();
      if (styleWidth && styleHeight) {
        var width = DvtAfComponent.ParseNonNegativeFloat(styleWidth);
        var height = DvtAfComponent.ParseNonNegativeFloat(styleHeight);
        if (width && height) {
          dim = new DvtRectangle(0, 0, width, height);
        }
      }
    }

    if (!dim) {
      var iconSrc = iconShape.getSrc();
      var imageDim = DvtImageLoader.loadImage(this.getDvtContext(), iconSrc);
      if (imageDim) {
        dim = new DvtRectangle(0, 0, imageDim.width, imageDim.height);
      }
    }

    if (dim) {
      iconShape.setWidth(dim.w);
      iconShape.setHeight(dim.h);
    }
    else {
      this.RegisterImageCallback(iconSrc);
    }
  }
  return dim;
};

/**
 * abstract method
 */
DvtAfButtonLink.prototype.GetIconStyle = function() {
  return null;
};


/**
 * abstract method
 */
DvtAfButtonLink.prototype.GetTextStyle = function(mouseState) {
  return null;
};


/**
 * abstract method
 */
DvtAfButtonLink.prototype.GetDisabledStyle = function() {
  return null;
};


/**
 * @override
 */
DvtAfButtonLink.prototype.ResolveEm = function(cssStyle) {
  DvtAfButtonLink.superclass.ResolveEm.call(this, cssStyle);
};

DvtAfButtonLink.prototype.getTooltip = function() {
  var tt = DvtAfButtonLink.superclass.getTooltip.call(this);
  //TODO: check disabled??
  if (!tt) {
    if (this._textLst) {
      var text = this._textLst[DvtButton.STATE_ENABLED];
      if (text && text.isTruncated()) {
        return this.getText();
      }
    }
  }
  return tt;
};


DvtAfButtonLink.prototype.deferTruncation = function() {
  return DvtAfComponentFactory.DEFER_TRUNCATION;
};

/*---------------------------------------------------------------------*/
/*   Create Content Shape                                              */
/*---------------------------------------------------------------------*/
DvtAfButtonLink.prototype.createContentShape = function(dvtContext) {
  return this.CreateButton();
};


/**
 * @override
 */
DvtAfButtonLink.prototype.renderSelfBeforeChildren = function() {
  DvtAfButtonLink.superclass.renderSelfBeforeChildren.call(this);

  this.CreateButton(this.getContentShape());
  this.RenderButton();
};

/**
 * Returns the callback function to set on the created DvtButton
 * @return {function} the callback function
 * @protected
 */
DvtAfButtonLink.prototype.GetClickListenerFunction = function() {
  return DvtToolkitUtils.getLinkCallback(this.getTargetFrame(), this.getDestination());
};

DvtAfButtonLink.prototype.isClickEventPropagationStopped = function() {
  return true;
};

/**
 * Creates (or updates) the DvtButton displayable for this DvtAfButtonLink
 * @param {DvtButton} button the DvtButton, if already created
 * @return {DvtButton} the created (or updated) DvtButton
 * @protected
 */
DvtAfButtonLink.prototype.CreateButton = function(button) {
  // only create empty button for the first time
  if (! button) {
    var up = this.CreateButtonState(DvtButton.STATE_ENABLED);
    var over = this.CreateButtonState(DvtButton.STATE_OVER);
    var down = this.CreateButtonState(DvtButton.STATE_DOWN);
    var dis = this.CreateButtonState(DvtButton.STATE_DISABLED);
    button = new DvtButton(this.getDvtContext(), up, over, down, dis,
                           this._getUniqueId(), this.GetClickListenerFunction(), this);
    this.associate(button, this);
  }
  button.setEnabled(!this.isDisabled());
  return button;
};

/**
 * Create a state of the button.
 *
 * @param buttonState button state: up, down, or over
 *
 * @return display obj to use for button state
 */
DvtAfButtonLink.prototype.CreateButtonState = function(buttonState) {
  var eStyle = this._getStateStyle(buttonState);
  var bgRect = DvtAfButtonLink._createContentShape(this.getDvtContext(),
                                                   this, buttonState,
                                                   eStyle);
  if (bgRect instanceof DvtRect && eStyle) {
    this.renderBackground(bgRect, eStyle);
  }

  return bgRect;
};

/**
 * Render a state of the button.
 *
 * @param {string} buttonState button state: up, down, over, or disabled
 *
 * @return {DvtRectangle} the dimensions of the rendered button state
 * @private
 */
DvtAfButtonLink.prototype._renderButtonState = function(buttonState) {
  var style = this._getStateStyle(buttonState);
  if (!style) {
    return null;
  }
  var dim = DvtAfButtonLink._doLayout(this, buttonState, this.GetTextStyle(buttonState),
                                      this.GetArrowWidth());
  var cw = this._cw;
  var ch = this._ch;
  try {
    this._cw = dim.w;
    this._ch = dim.h;

    //render background and border
    DvtAfButtonLink.superclass.renderSelfAfterLayout.call(this, this._shapeLst[buttonState], style);
  }
  finally {
    this._cw = cw;
    this._ch = ch;
  }
  return dim;
};

/**
 * Renders and caches the dimensions of the DvtButton displayable
 * @protected
 */
DvtAfButtonLink.prototype.RenderButton = function() {
  var disabledDim = this._renderButtonState(DvtButton.STATE_DISABLED);
  this._renderButtonState(DvtButton.STATE_OVER);
  this._renderButtonState(DvtButton.STATE_DOWN);
  var enabledDim = this._renderButtonState(DvtButton.STATE_ENABLED);
  var dim = this.isDisabled() ? disabledDim : enabledDim;

  if (dim) {
    this._cw = dim.w;
    this._ch = dim.h;
  }
  this.getContentShape().initState();
};

/**
 * override
 */
DvtAfButtonLink.prototype._setOverrideStyle = function(style) {
  this._overrideStyle = style;
};

DvtAfButtonLink.prototype._getStateStyle = function(mouseState) {
  var textStyle;

  switch (mouseState) {
    case DvtButton.STATE_DISABLED:
      textStyle = this.GetDisabledStyle();
      break;

    case DvtButton.STATE_OVER:
      textStyle = this.GetHoverStyle();
      break;

    case DvtButton.STATE_DOWN:
      textStyle = this.GetActiveStyle();
      break;

    case DvtButton.STATE_ENABLED:
    default:
      textStyle = this.GetEnabledStyle();
      break;
  }

  if (this._overrideStyle) {
    textStyle = textStyle.clone().merge(this._overrideStyle);
  }

  return textStyle;

};

//for menu only
DvtAfButtonLink.prototype._RenderArrowIcon = function(mouseState, dim) {
  return dim;
};

//for menu only
DvtAfButtonLink.prototype.GetArrowWidth = function() {
  return 0;
};

DvtAfButtonLink.prototype.registerAsTabStop = function() {
  this.getAfContext().registerTabStop(this);
};

/**
 * @override
 */
DvtAfButtonLink.prototype.addAccessibilityAttributes = function(obj) {
  // WAI-ARIA
  this.getDisplayObj().setAriaRole('link');
  if (!DvtAgent.deferAriaCreation()) {
    var desc = this.getAriaLabel();
    if (desc) {
      this.getDisplayObj().setAriaProperty('label', desc);
    }
  }
};

/**
 * @override
 */
DvtAfButtonLink.prototype.getAriaLabel = function() {
  var desc = this.getShortDesc();
  if (!desc)
    desc = this.getText();
  return desc;
};

/**
 * Handle "Enter" event
 * @param {DvtKeyboardEvent} event a keyboard event
 */
DvtAfButtonLink.prototype.handleKeyboardEvent = function(event) {
  var keyCode = event.keyCode;
  if (keyCode == DvtKeyboardEvent.ENTER || keyCode == DvtKeyboardEvent.SPACE) {
    var eventManager = this.getAfContext()._eventManager;
    var target = this.getDisplayObj();
    var point = target.localToStage(new DvtPoint(0, 0));
    var mouseEvent = eventManager.GenerateMouseEventFromKeyboardEvent(
        event, this.getDvtContext().getStage(), point.x, point.y);
    mouseEvent.target = target;
    target.dispatchNativeEvent(mouseEvent);
  }
};
/**
 * @constructor
 * DvtAfButton
 */
var DvtAfButton = function() {
  this.Init();
};

/*
 * make DvtAfButton a subclass of DvtAfButtonLink
 */
DvtObj.createSubclass(DvtAfButton, DvtAfButtonLink, 'DvtAfButton');

/*
 * Register the AfButton tag with DvtAfComponentFactory
 */
DvtAfButton.TAG_NAME = 'bt';
DvtAfComponentFactory.registerComponent(DvtAfButton.TAG_NAME, DvtAfButton);


/*---------------------------------------------------------------------*/
/*   AfComponent attributes                                            */
/*---------------------------------------------------------------------*/
DvtAfButton.prototype.getTagName = function() {
  return DvtAfButton.TAG_NAME;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfButton.prototype.GetDefaultStyles = function() {
  return DvtAfButton._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfButton.prototype.SetDefaultStyles = function(styleList) {
  DvtAfButton._afStyles = styleList;

  if (styleList.length > 5) {
    styleList[0].mergeUnder(styleList[5]);
  }

  if (styleList.length > 7) {
    styleList[7].mergeUnder(styleList[0]);
  }
  if (styleList.length > 8) {
    styleList[8].mergeUnder(styleList[0]);
  }

  //Note: disabled style does not contains font styles
  if (styleList.length > 9) {
    styleList[9].mergeUnder(styleList[0]);
  }


  //styleList[0] - af|button
  //styleList[1] - af|button_icon
  //styleList[2] - af|button_text
  //styleList[3] - af|button_icon_hover
  //styleList[4] - f|button_icon_depressed

  //styleList[5] - af|button_link
  //styleList[6] - af|button_leading_text

  //styleList[7] - af|button_active
  //styleList[8] - af|button_hover
  //styleList[9] - af|button_disabled

};


DvtAfButton.prototype.GetEnabledStyle = function() {
  return this._getAfStyleAt(0);
};


/**
 * @override
 */
DvtAfButton.prototype.GetIconStyle = function() {
  return this._getAfStyleAt(1);
};


/**
 * @override
 */
DvtAfButton.prototype.GetTextStyle = function(mouseState) {
  return this._getAfStyleAt(2);
};

/**
 * @override

DvtAfButton.prototype.GetButtonLinkStyle = function() {
  return this._getAfStyleAt(5);
};
 */


/**
 * @override
 */
DvtAfButton.prototype.GetActiveStyle = function() {
  return this._getAfStyleAt(7);
};


/**
 * @override
 */
DvtAfButton.prototype.GetHoverStyle = function() {
  return this._getAfStyleAt(8);
};


/**
 * @override
 */
DvtAfButton.prototype.GetDisabledStyle = function() {
  return this._getAfStyleAt(9);
};


/**
 * @override
 */
DvtAfButton.prototype.ResolveEm = function(cssStyle) {
  DvtAfButton.superclass.ResolveEm.call(this, cssStyle);

  var textStyle = this.GetTextStyle();
  if (textStyle) {
    this.resolveEmUnit(textStyle, this);
  }

  var disStyle = this.GetDisabledStyle();
  if (disStyle) {
    this.resolveEmUnit(disStyle, this);
  }
};


/**
 * @override
 */
DvtAfButton.prototype._hasBgShape = function() {
  return false;
};

DvtAfButton.prototype.renderSelfAfterLayout = function() {
};


/**
 * @override
 */
DvtAfButton.prototype.RenderBackgroundImage = function(bgShape, style, bgImg) {
  if (bgImg && 'none' !== bgImg && (! (bgImg instanceof DvtCSSGradient))) {
    this._bgImg = bgImg;

    var bgRepeat = style.getStyle(DvtCSSStyle.BACKGROUND_REPEAT);
    var callbackOnComplete = null;

    if (! bgRepeat || bgRepeat != 'no-repeat') {
      callbackOnComplete = function(imgDim) {
        if (imgDim && imgDim.width && imgDim.height) {
          var dim = new DvtRectangle(0, 0, imgDim.width, imgDim.height);
          bgShape.setFill(new DvtImageFill(DvtAgent.isEnvironmentBatik() ? imgDim.uri : bgImg, dim, bgRepeat));
        }
      };
    }
    else {
      var dim = bgShape.getDimensions(this.getAfContext().getParentNode());
      bgShape.setFill(new DvtImageFill(this._bgImg, dim, bgRepeat));
    }
    DvtImageLoader.loadImage(this.getDvtContext(),
        bgImg, callbackOnComplete);
  }
};
/**
 * DvtAfCommandButton
 */
var DvtAfCommandButton = function() {
  this.Init();
};


/**
 * make DvtAfCommandButton a subclass of DvtAfButton
 */
DvtObj.createSubclass(DvtAfCommandButton, DvtAfButton, 'DvtAfCommandButton');


/**
 * Register the AfCommandButton tag with DvtAfComponentFactory
 */
DvtAfCommandButton.TAG_NAME = 'cb';
DvtAfComponentFactory.registerComponent(DvtAfCommandButton.TAG_NAME, DvtAfCommandButton);

DvtAfCommandButton.prototype.getTagName = function() {
  return DvtAfCommandButton.TAG_NAME;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfCommandButton.prototype.GetDefaultStyles = function() {
  return DvtAfCommandButton._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfCommandButton.prototype.SetDefaultStyles = function(styleList) {
  DvtAfCommandButton._afStyles = styleList;
  if (styleList.length > 1) {
    styleList[1].mergeUnder(styleList[0]);
  }
  if (styleList.length > 2) {
    styleList[2].mergeUnder(styleList[0]);
  }

  //No padding and border radius in active style
  if (styleList.length > 3) {
    styleList[3].mergeUnder(styleList[0]);
  }

  //No padding and border raduis in hover style
  if (styleList.length > 4) {
    styleList[4].mergeUnder(styleList[0]);
  }

  if (styleList.length > 5) {
    styleList[5].mergeUnder(styleList[2]);
  }




  //styleList[0] - af|commandButton
  //styleList[1] - af|commandButton_icon
  //styleList[2] - af|commandButton_text_by_icon
  //styleList[3] - af|commandButton_active
  //styleList[4] - af|commandButton_hover
  //styleList[5] - af|commandButton_disabled

};


/**
 * @override
 */
DvtAfCommandButton.prototype.GetIconStyle = function() {
  return this._getAfStyleAt(1);
};


/**
 * @override
 */
DvtAfCommandButton.prototype.GetTextStyle = function(mouseState) {
  return this._getAfStyleAt(2);
};


/**
 * @override
 */
DvtAfCommandButton.prototype.GetActiveStyle = function() {
  return this._getAfStyleAt(3);
};


/**
 * @override
 */
DvtAfCommandButton.prototype.GetHoverStyle = function() {
  return this._getAfStyleAt(4);
};


/**
 * @override
 */
DvtAfCommandButton.prototype.GetDisabledStyle = function() {
  var style = this._getAfStyleAt(5);
  return style ? style :
      DvtAfStyleUtils.getDefaultCommandButtonDisabledStyle();
};

/**
 * DvtAfGoButton
 */
var DvtAfGoButton = function() {
  this.Init();
};


/**
 * make DvtAfGoButton a subclass of DvtAfButton
 */
DvtObj.createSubclass(DvtAfGoButton, DvtAfButton, 'DvtAfGoButton');


/**
 * Register the AfGoButton tag with DvtAfComponentFactory
 */
DvtAfGoButton.TAG_NAME = 'gb';
DvtAfComponentFactory.registerComponent(DvtAfGoButton.TAG_NAME, DvtAfGoButton);

DvtAfGoButton.prototype.getTagName = function() {
  return DvtAfGoButton.TAG_NAME;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfGoButton.prototype.GetDefaultStyles = function() {
  return DvtAfGoButton._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfGoButton.prototype.SetDefaultStyles = function(styleList) {
  DvtAfGoButton._afStyles = styleList;
  if (styleList.length > 1) {
    styleList[1].mergeUnder(styleList[0]);
  }
  if (styleList.length > 2) {
    styleList[2].mergeUnder(styleList[0]);
  }

  if (styleList.length > 3) {
    styleList[3].mergeUnder(styleList[0]);
  }

  if (styleList.length > 4) {
    styleList[4].mergeUnder(styleList[0]);
  }

  if (styleList.length > 5) {
    styleList[5].mergeUnder(styleList[2]);
  }

  //styleList[0] - af|goButton
  //styleList[1] - af|goButton_icon
  //styleList[2] - af|goButton_text_by_icon
  //styleList[3] - af|goButton_active
  //styleList[4] - af|goButton_hover
  //styleList[5] - af|goButton_disabled

};


/**
 * @override
 */
DvtAfGoButton.prototype.GetIconStyle = function() {
  return this._getAfStyleAt(1);
};


/**
 * @override
 */
DvtAfGoButton.prototype.GetTextStyle = function(mouseState) {
  return this._getAfStyleAt(2);
};


/**
 * @override
 */
DvtAfGoButton.prototype.GetActiveStyle = function() {
  return this._getAfStyleAt(3);
};


/**
 * @override
 */
DvtAfGoButton.prototype.GetHoverStyle = function() {
  return this._getAfStyleAt(4);
};


/**
 * @override
 */
DvtAfGoButton.prototype.GetDisabledStyle = function() {
  var style = this._getAfStyleAt(5);
  return style ? style :
      DvtAfStyleUtils.getDefaultGoButtonDisabledStyle();
};
/**
 * @constructor
 * DvtAfLink
 */
var DvtAfLink = function() {
  this.Init();
};

/*
 * make DvtAfLink a subclass of DvtAfButtonLink
 */
DvtObj.createSubclass(DvtAfLink, DvtAfButtonLink, 'DvtAfLink');

/*
 * Register the AfLink tag with DvtAfComponentFactory
 */
DvtAfLink.TAG_NAME = 'lk';
DvtAfComponentFactory.registerComponent(DvtAfLink.TAG_NAME, DvtAfLink);


/*---------------------------------------------------------------------*/
/*   AfComponent attributes                                            */
/*---------------------------------------------------------------------*/
DvtAfLink.prototype.getTagName = function() {
  return DvtAfLink.TAG_NAME;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfLink.prototype.GetDefaultStyles = function() {
  return DvtAfLink._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfLink.prototype.SetDefaultStyles = function(styleList) {
  DvtAfLink._afStyles = styleList;
  //  if (styleList.length > 2) {
  //    styleList[2].mergeUnder(styleList[0]);
  //  }

  if (styleList.length > 5) {
    styleList[5].mergeUnder(styleList[0]);
  }
  if (styleList.length > 6) {
    styleList[6].mergeUnder(styleList[0]);
  }
  if (styleList.length > 7) {
    styleList[7].mergeUnder(styleList[0]);
  }

  //styleList[0] - af|link
  //styleList[1] - af|link_icon
  //styleList[2] - af|link_text
  //styleList[3] - af|link_icon_hover
  //styleList[4] - f|link_icon_depressed
  //styleList[5] - af|link_active
  //styleList[6] - af|link_hover
  //styleList[7] - af|link_disabled

};


DvtAfLink.prototype.GetEnabledStyle = function() {
  return this._getAfStyleAt(0);
};

/**
 * @override
 */
DvtAfLink.prototype.createDisplayObj = function(afContext) {
  var dispObj = DvtAfLink.superclass.createDisplayObj.call(this, afContext);

  this.addChildDisplayObjs(afContext, this._shape);

  return dispObj;
};


/**
 * @override
 */
DvtAfLink.prototype.renderSelfBeforeChildren = function() {
  DvtAfLink.superclass.renderSelfBeforeChildren.call(this);

  //whole client area is available to children, but will
  //be reduced as children are rendered
  if (this.getNumChildren() > 0) {
    this._acw = this._aw;
    this._ach = this._ah - this._ch;
  }
};


/**
 * @override
 */
DvtAfLink.prototype.doLayout = function() {
  if (this.getNumChildren() > 0)
    DvtAfComponentUtils.doVerticalLayout(this.getAfContext(), this);
};


/**
 * @override
 */
DvtAfLink.prototype.renderChild = function(child) {
  if (child._render) {
    child._render(this._acw, this._ach);
  }
  else if (child.render) {
    //Performance: using the same af context during rendering
    //so we have a list of dimensions for all text objects
    DvtAfComponent._renderComp(this.getAfContext(), child, this._acw, this._ach);
  }

  var dim = DvtAfComponent.getDimensions(child);

  //adjust the remaining size of the client area available to
  //children based on the size of the child just rendered
  if (dim.h !== Number.MAX_VALUE)
    this._ach -= dim.h;

};


/**
 * @override
 */
DvtAfLink.prototype.getHAlign = function() {
  return DvtAfComponent.HALIGN_START;
};


/**
 * @override
 */
DvtAfLink.prototype.GetIconStyle = function() {
  return this._getAfStyleAt(1);
};


/**
 * @override
 */
DvtAfLink.prototype.GetTextStyle = function(mouseState) {
  return this._getAfStyleAt(2);
};


/**
 * @override
 */
DvtAfLink.prototype.GetActiveStyle = function() {
  return this._getAfStyleAt(5);
};


/**
 * @override
 */
DvtAfLink.prototype.GetHoverStyle = function() {
  return this._getAfStyleAt(6);
};


/**
 * @override
 */
DvtAfLink.prototype.GetDisabledStyle = function() {
  return this._getAfStyleAt(7);
};


/**
 * @override
 */
DvtAfLink.prototype.ResolveEm = function(cssStyle) {
  DvtAfLink.superclass.ResolveEm.call(this, cssStyle);

  var textStyle = this.GetTextStyle();
  if (textStyle) {
    this.resolveEmUnit(textStyle, this);
  }

  var disStyle = this.GetDisabledStyle();
  if (disStyle) {
    this.resolveEmUnit(disStyle, this);
  }
};

/**
 * @override
 */
DvtAfLink.prototype._hasBgShape = function() {
  return false;
};


/**
 * @override
 */
DvtAfLink.prototype.renderBackground = function(bgShape, style) {
};

/**
 * @constructor
 * DvtAfCommandLink
 */
var DvtAfCommandLink = function() {
  this.Init();
};

/*
 * make DvtAfCommandLink a subclass of DvtAfLink
 */
DvtObj.createSubclass(DvtAfCommandLink, DvtAfLink, 'DvtAfCommandLink');

/*
 * Register the AfCommandLink tag with DvtAfComponentFactory
 */
DvtAfCommandLink.TAG_NAME = 'cl';
DvtAfComponentFactory.registerComponent(DvtAfCommandLink.TAG_NAME, DvtAfCommandLink);


/*---------------------------------------------------------------------*/
/*   AfComponent attributes                                            */
/*---------------------------------------------------------------------*/
DvtAfCommandLink.prototype.getIcon = function() {
  return null;
};

DvtAfCommandLink.prototype.getDisabledIcon = function() {
  return null;
};

DvtAfCommandLink.prototype.getDestination = function() {
  return null;
};

DvtAfCommandLink.prototype.getTagName = function() {
  return DvtAfCommandLink.TAG_NAME;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfCommandLink.prototype.GetDefaultStyles = function() {
  return DvtAfCommandLink._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfCommandLink.prototype.SetDefaultStyles = function(styleList) {
  DvtAfCommandLink._afStyles = styleList;
  if (styleList.length > 1) {
    styleList[1].mergeUnder(styleList[0]);
  }

  if (styleList.length > 2) {
    styleList[2].mergeUnder(styleList[0]);
  }

  if (styleList.length > 3) {
    styleList[3].mergeUnder(styleList[0]);
  }

  //styleList[0] - af|commandLink
  //styleList[1] - af|commandLink_active
  //styleList[2] - af|commandLink_hover
  //styleList[3] - af|commandLink_disabled

};


/**
 * abstract method
 */
DvtAfCommandLink.prototype.GetIconStyle = function() {
  return null;
};


/**
 * @private
 */
DvtAfCommandLink.prototype.GetTextStyle = function(mouseState) {
  return this._getAfStyleAt(0);
};


/**
 * @override
 */
DvtAfCommandLink.prototype.GetActiveStyle = function() {
  return this._getAfStyleAt(1);
};


/**
 * @override
 */
DvtAfCommandLink.prototype.GetHoverStyle = function() {
  return this._getAfStyleAt(2);
};


/**
 * @private
 */
DvtAfCommandLink.prototype.GetDisabledStyle = function() {
  var style = this._getAfStyleAt(3);
  return style ? style :
      DvtAfStyleUtils.getDefaultCommandLinkDisabledStyle();
};

/**
 * @constructor
 * DvtAfCommandImageLink
 */
var DvtAfCommandImageLink = function() {
  this.Init();
};

/*
 * make DvtAfCommandImageLink a subclass of DvtAfLink
 */
DvtObj.createSubclass(DvtAfCommandImageLink, DvtAfLink, 'DvtAfCommandImageLink');

/*
 * Register the AfCommandImageLink tag with DvtAfComponentFactory
 */
DvtAfCommandImageLink.TAG_NAME = 'cil';
DvtAfComponentFactory.registerComponent(DvtAfCommandImageLink.TAG_NAME, DvtAfCommandImageLink);


/*---------------------------------------------------------------------*/
/*   AfComponent attributes                                            */
/*---------------------------------------------------------------------*/
DvtAfCommandImageLink.prototype.getDestination = function() {
  return null;
};

DvtAfCommandImageLink.prototype.getTagName = function() {
  return DvtAfCommandImageLink.TAG_NAME;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfCommandImageLink.prototype.GetDefaultStyles = function() {
  return DvtAfCommandImageLink._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfCommandImageLink.prototype.SetDefaultStyles = function(styleList) {
  DvtAfCommandImageLink._afStyles = styleList;
  if (styleList.length > 2) {
    styleList[2].mergeUnder(styleList[0]);
  }
  if (styleList.length > 5) {
    styleList[5].mergeUnder(styleList[0]);
  }

  //styleList[0] - af|commandImageLink
  //styleList[1] - af|commandImageLink_icon
  //styleList[2] - af|commandImageLink_text
  //styleList[3] - af|commandImageLink_active
  //styleList[4] - af|commandImageLink_hover
  //styleList[5] - af|commandImageLink_disabled

};


/**
 * @private
 */
DvtAfCommandImageLink.prototype.GetIconStyle = function() {
  return this._getAfStyleAt(1);
};


/**
 * @private
 */
DvtAfCommandImageLink.prototype.GetTextStyle = function(mouseState) {
  return this._getAfStyleAt(2);
};


/**
 * @override
 */
DvtAfCommandImageLink.prototype.GetActiveStyle = function() {
  return this._getAfStyleAt(3);
};


/**
 * @override
 */
DvtAfCommandImageLink.prototype.GetHoverStyle = function() {
  return this._getAfStyleAt(4);
};


/**
 * @private
 */
DvtAfCommandImageLink.prototype.GetDisabledStyle = function() {
  var style = this._getAfStyleAt(5);
  return style ? style :
      DvtAfStyleUtils.getDefaultCommandImageLinkDisabledStyle();
};


/**
 * @override
 */
DvtAfCommandImageLink.prototype.ResolveEm = function(cssStyle) {
  DvtAfCommandImageLink.superclass.ResolveEm.call(this, cssStyle);

  var style = this.GetIconStyle();
  if (style) {
    this.resolveEmUnit(style, this);
  }

};


/**
 * @constructor
 * DvtAfGoLink
 */
var DvtAfGoLink = function() {
  this.Init();
};

/*
 * make DvtAfGoLink a subclass of DvtAfLink
 */
DvtObj.createSubclass(DvtAfGoLink, DvtAfLink, 'DvtAfGoLink');

/*
 * Register the AfGoLink tag with DvtAfComponentFactory
 */
DvtAfGoLink.TAG_NAME = 'gl';
DvtAfComponentFactory.registerComponent(DvtAfGoLink.TAG_NAME, DvtAfGoLink);


/*-------------------------------------------------------------------------*/
/*   AfComponent attributes                                                */
/*-------------------------------------------------------------------------*/
DvtAfGoLink.prototype.getIcon = function() {
  return null;
};

DvtAfGoLink.prototype.getDisabledIcon = function() {
  return null;
};

DvtAfGoLink.prototype.getTagName = function() {
  return DvtAfGoLink.TAG_NAME;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfGoLink.prototype.GetDefaultStyles = function() {
  return DvtAfGoLink._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfGoLink.prototype.SetDefaultStyles = function(styleList) {
  DvtAfGoLink._afStyles = styleList;
  if (styleList.length > 1) {
    styleList[1].mergeUnder(styleList[0]);
  }

  if (styleList.length > 3) {
    styleList[3].mergeUnder(styleList[0]);
  }

  //styleList[0] - af|goLink
  //styleList[1] - af|goLink_active
  //styleList[2] - af|goLink_hover
  //styleList[3] - af|goLink_disabled


};


/**
 * @private
 */
DvtAfGoLink.prototype.GetTextStyle = function(mouseState) {
  return DvtAfGoLink._afStyles[0];
};


/**
 * @override
 */
DvtAfGoLink.prototype.GetActiveStyle = function() {
  return this._getAfStyleAt(1);
};


/**
 * @override
 */
DvtAfGoLink.prototype.GetHoverStyle = function() {
  return this._getAfStyleAt(2);
};


/**
 * @private
 */
DvtAfGoLink.prototype.GetDisabledStyle = function() {
  var style = this._getAfStyleAt(3);
  return style ? style :
      DvtAfStyleUtils.getDefaultGoLinkDisabledStyle();
};


/**
 * DvtAfCommandMenuItem
 */
var DvtAfCommandMenuItem = function() {
  this.Init();
};


/**
 * make DvtAfCommandMenuItem a subclass of DvtAfButton
 */
DvtObj.createSubclass(DvtAfCommandMenuItem, DvtAfButton, 'DvtAfCommandMenuItem');


/**
 * Register the AfCommandMenuItem tag with DvtAfComponentFactory
 */
DvtAfCommandMenuItem.TAG_NAME = 'cmi';
DvtAfComponentFactory.registerComponent(DvtAfCommandMenuItem.TAG_NAME, DvtAfCommandMenuItem);


DvtAfCommandMenuItem.prototype.getTagName = function() {
  return DvtAfCommandMenuItem.TAG_NAME;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfCommandMenuItem.prototype.GetDefaultStyles = function() {
  return DvtAfCommandMenuItem._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfCommandMenuItem.prototype.SetDefaultStyles = function(styleList) {
  DvtAfCommandMenuItem._afStyles = styleList;
  if (styleList.length > 1) {
    styleList[0].merge(styleList[1]);
  }

  if (styleList.length > 2) {
    styleList[2].mergeUnder(styleList[0]);
  }

  if (styleList.length > 3) {
    styleList[3].mergeUnder(styleList[2]);
    styleList[0].merge(styleList[3]);
  }

  if (styleList.length > 4) {
    styleList[4].mergeUnder(styleList[3]);
  }

  if (styleList.length > 5) {
    styleList[5].mergeUnder(styleList[3]);
  }

  //styleList[0] - af|commandMenuItem
  //styleList[1] - af|commandMenuItem::menu-item
  //styleList[2] - af|commandMenuItem::menu-item-icon-style
  //styleList[3] - af|commandMenuItem::menu-item-text

  //styleList[4] - af|commandMenuItem_hover
  //styleList[5] - af|commandMenuItem_disabled



  //  af_commandMenuItem = ""
  //
  //  af_commandMenuItem_menu-item = "font-family:Tahoma, Verdana, Helvetica, sans-serif;font-weight:normal;font-size:11px;color:#333333;height:21px;background-color:transparent"
  //
  //  af_commandMenuItem_menu-item-icon-style = "background-image:none;padding:0px;cursor:default;text-decoration:none;background-color:transparent;text-align:center;width:21px;border-top:none;border-bottom:none"
  //
  //  af_commandMenuItem_menu-item-text = "background-color:#FFFFFF;background-image:none;cursor:default;text-decoration:none;white-space:nowrap;color:#000000;padding:0px 10px 0px 0px;border-top:none;border-bottom:none"


};


/**
 * @override
 */
DvtAfCommandMenuItem.prototype.GetIconStyle = function() {
  return this._getAfStyleAt(2);
};


/**
 * @override
 */
DvtAfCommandMenuItem.prototype.GetTextStyle = function(mouseState) {
  if (mouseState == DvtButton.STATE_OVER) {
    return this._getAfStyleAt(4);
  }
  else if (mouseState == DvtButton.STATE_DOWN) {
    return this._getAfStyleAt(3);
  }
  else if (mouseState == DvtButton.STATE_DISABLED) {
    return this._getAfStyleAt(5);
  }
  else {
    return this._getAfStyleAt(3);
  }
};


/**
 * @override
 */
DvtAfCommandMenuItem.prototype.GetActiveStyle = function() {
  return this._getAfStyleAt(3);
};


/**
 * @override
 */
DvtAfCommandMenuItem.prototype.GetHoverStyle = function() {
  return this._getAfStyleAt(4);
};


/**
 * @override
 */
DvtAfCommandMenuItem.prototype.GetDisabledStyle = function() {
  var style = this._getAfStyleAt(5);
  return style ? style :
      DvtAfStyleUtils.getDefaultCommandMenuItemDisabledStyle();
};


/**
 * @override
 */
DvtAfCommandMenuItem.prototype.getIconPosition = function() {
  return DvtAfButtonLink.ICON_POSITION_LEADING;
};


/**
 * @override
 */
DvtAfCommandMenuItem.prototype.RenderBackgroundStroke = function(bgShape, style) {

};

/**
 * @override
 */
DvtAfCommandMenuItem.prototype.SaveContextCallback = function() {
  var baseCallback = DvtObj.createCallback(this.getAfContext().getContextCallbackObj(), this.getAfContext().getContextCallback());
  this.setContextCallbackObj(this);
  this.setContextCallback(function(event) {
    baseCallback(event);
    var menu = this.getParent();
    if (menu instanceof DvtAfMenu) {
      menu.hideDropdown();
    }
  });
};
/**
 * DvtAfMenu
 */
var DvtAfMenu = function() {
  this.Init();
};


/**
 * make DvtAfMenu a subclass of DvtAfButton
 */
DvtObj.createSubclass(DvtAfMenu, DvtAfButton, 'DvtAfMenu');


/**
 * Register the AfMenu tag with DvtAfComponentFactory
 */
DvtAfMenu.TAG_NAME = 'm';
DvtAfComponentFactory.registerComponent(DvtAfMenu.TAG_NAME, DvtAfMenu);


DvtAfMenu.DROPDOWN_PADDING = 1;
DvtAfMenu.HPADDING = 5;

DvtAfMenu.prototype.getTagName = function() {
  return DvtAfMenu.TAG_NAME;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfMenu.prototype.GetDefaultStyles = function() {
  return DvtAfMenu._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfMenu.prototype.SetDefaultStyles = function(styleList) {
  DvtAfMenu._afStyles = styleList;

  if (styleList.length > 1) {
    styleList[0].merge(styleList[1]);
  }

  if (styleList.length > 2) {
    styleList[2].mergeUnder(styleList[0]);
  }

  if (styleList.length > 5) {
    styleList[5].mergeUnder(styleList[2]);
  }

  if (styleList.length > 9) {
    styleList[9].mergeUnder(styleList[4]);
  }

  if (styleList.length > 10) {
    styleList[10].mergeUnder(styleList[4]);
  }

  if (styleList.length > 11) {
    styleList[11].mergeUnder(styleList[4]);
  }

  if (styleList.length > 12) {
    styleList[12].mergeUnder(styleList[5]);
  }

  if (styleList.length > 13) {
    styleList[13].mergeUnder(styleList[6]);
  }


  //styleList[0] - af|menu
  //styleList[1] - af|menu::bar-item
  //styleList[2] - af|menu::bar-item-icon-style
  //styleList[3] - af|menu::bar-item-text
  //styleList[4] - af|menu::bar-item-open-icon-style

  //styleList[5] - af|menu::bar-item:depressed
  //styleList[6] - af|menu::bar-item:highlighted
  //styleList[7] - af|menu::bar-item:disabled af|menu::bar-item-text

  //styleList[8] - .AFPopupSelector
  //styleList[9] -  af|menu:depressed af|menu::bar-item-open-icon-style
  //styleList[10] - af|menu:highlighted af|menu::bar-item-open-icon-style
  //styleList[11] - af|menu:disabled af|menu::bar-item-open-icon-style

  //styleList[12] - af|menu::bar-item:depressed af|menu::bar-item-text
  //styleList[13] - af|menu::bar-item:hover af|menu::bar-item-text

};


/**
 * @override
 */
DvtAfMenu.prototype.GetIconStyle = function() {
  return this._getAfStyleAt(2);
};


/**
 * @override
 */
DvtAfMenu.prototype.GetTextStyle = function(mouseState) {
  if (mouseState == DvtButton.STATE_OVER) {
    return this._getAfStyleAt(13);
  }
  else if (mouseState == DvtButton.STATE_DOWN) {
    return this._getAfStyleAt(12);
  }
  else if (mouseState == DvtButton.STATE_DISABLED) {
    return this._getAfStyleAt(7);
  }
  else {
    return this._getAfStyleAt(3);
  }

};


/**
 * @override
 */
DvtAfMenu.prototype.GetActiveStyle = function() {
  return this._getAfStyleAt(12);
};


/**
 * @override
 */
DvtAfMenu.prototype.GetHoverStyle = function() {
  return this._getAfStyleAt(13);
};


/**
 * @override
 */
DvtAfMenu.prototype.GetDisabledStyle = function() {
  var style = this._getAfStyleAt(7);
  return style ? style :
      DvtAfStyleUtils.getDefaultMenuDisabledStyle();
};


DvtAfMenu.prototype.GetOpenIconStyle = function(mouseState) {
  var arrowStyle;

  if (mouseState == DvtButton.STATE_OVER) {
    arrowStyle = this._getAfStyleAt(10);
  }
  else if (mouseState == DvtButton.STATE_DOWN) {
    arrowStyle = this._getAfStyleAt(9);
  }
  else if (mouseState == DvtButton.STATE_DISABLED) {
    arrowStyle = this._getAfStyleAt(11);
  }
  else {
    arrowStyle = this._getAfStyleAt(4);
  }

  if (arrowStyle) {
    var sw = arrowStyle.getWidth();
    var sh = arrowStyle.getHeight();
    if (sw && sh) {
      var ww = DvtAfComponent.ParseNonNegativeFloat(sw);
      var hh = DvtAfComponent.ParseNonNegativeFloat(sh);

      this._arrowDim = new DvtRectangle(0, 0, ww, hh);
    }
  }
  return arrowStyle;
};


DvtAfMenu.prototype._getPopupStyle = function() {
  return this._getAfStyleAt(8);
};


/**
 * @override
 */
DvtAfMenu.prototype.getIconPosition = function() {
  return DvtAfButtonLink.ICON_POSITION_LEADING;
};


/**
 * @override
 */
DvtAfMenu.prototype.CreateButtonState = function(mouseState) {
  var group = DvtAfMenu.superclass.CreateButtonState.call(this, mouseState);
  //add dropdown arrow
  var arrowStyle = this.GetOpenIconStyle(mouseState);
  if (group && arrowStyle) {
    var arrowSrc = arrowStyle.getBackgroundImage();
    if (arrowSrc) {
      if (! this._arrowLst)
        this._arrowLst = [];

      this._arrowLst[mouseState] = new DvtImage(this.getDvtContext(), arrowSrc, 0, 0,
                                                this._getArrowWidth(), this._getArrowHeight());
      group.addChild(this._arrowLst[mouseState]);
    }
  }
  group.setFill(null);
  return group;
};


/**
 * @override
 */
DvtAfMenu.prototype.GetArrowWidth = function() {
  var arrowStyle = this.GetOpenIconStyle(DvtButton.STATE_ENABLED);

  var padding = 0;
  if (arrowStyle) {
    padding = arrowStyle.getPadding(DvtCSSStyle.PADDING_LEFT) + arrowStyle.getPadding(DvtCSSStyle.PADDING_RIGHT);
  }
  return this._getArrowWidth() + padding;
};


/**
 * @override
 */
DvtAfMenu.prototype._RenderArrowIcon = function(mouseState, textIconDim) {
  var ashape = this._arrowLst[mouseState];

  if (ashape) {
    var arrowStyle = this.GetOpenIconStyle(mouseState);
    var padding = 0;

    if (DvtAgent.isRightToLeft(this.getDvtContext())) {
      //      if (arrowStyle) {
      //        padding = arrowStyle.getPadding(DvtCSSStyle.PADDING_RIGHT);
      //      }
      //      ashape.setX(padding);
      ashape.setX(this.getCX());
    }
    else {
      if (arrowStyle) {
        padding = arrowStyle.getPadding(DvtCSSStyle.PADDING_LEFT);
      }
      ashape.setX(textIconDim.w + padding);
    }

    //check icon position
    var yy = 2;
    var posArr = arrowStyle.parseBackgroundPosition();

    //skyros: background-position:center bottom
    if (posArr && posArr.length == 2) {
      if (posArr[1] == '100%') {
        yy = textIconDim.h - this._getArrowHeight() - 1;
      }
      else if (posArr[1] == '50%') {
        yy = (textIconDim.h - this._getArrowHeight()) / 2 + 1;
      }
    }

    ashape.setY(yy);
  }

  textIconDim.w += this._getArrowWidth() + padding + this.getCX();
  return textIconDim;
};


DvtAfMenu.prototype._getArrowWidth = function() {
  return this._arrowDim ? this._arrowDim.w : 0;
};

DvtAfMenu.prototype._getArrowHeight = function() {
  return this._arrowDim ? this._arrowDim.h : 0;
};


/**
 * @override
 */
DvtAfMenu.prototype.renderChildren = function() {
  //do nothing; children are rendered when dropDown is displayed
  //after the arrow button is clicked
};


/**
 * @override
 */
DvtAfMenu.prototype.GetClickListenerFunction = function() {
  return DvtObj.createCallback(this, this._handleClickAction);
};

/**
 * Displays the dropdown when the menu is clicked
 * @param {DvtMouseEvent|DvtTouchEvent} event the triggering event
 * @private
 */
DvtAfMenu.prototype._handleClickAction = function(event) {
  //don't displayDropDown if no commandMenuItems
  if (this.getNumChildren() > 0) {
    this.displayDropdown();
  }
};

/**
 * Hide the dropdown menu.
 */
DvtAfMenu.prototype.hideDropdown = function() {
  this.RemoveStageFocusChangeListeners();

  var container = this._getMenuDropdownContainer();
  if (container) {
    DvtAfMenu._updateDropdown(container, null);
  }

  this.getContentShape().setToggled(false);
};


/**
 * Display the dropdown menu.
 */
DvtAfMenu.prototype.displayDropdown = function() {
  //set menu to toggle button
  this.getContentShape().setToggled(true);

  var id = this.getId();

  //get the dropdown container, if not specified default to menu display object
  var hasDropDownContainer = false;
  var container = this._getMenuDropdownContainer(false);
  if (container) {
    hasDropDownContainer = true;
  }
  else {
    container = this._getMenuDropdownContainer(true);
  }

  //Note: menu size may vary based on the zoom level
  var menuDim = this.getDisplayObj().getDimensions(container);

  //create a container for all commandMenuItems
  //width and height will be updated later
  var dropdown = new DvtRect(this.getDvtContext(), 0, 0, menuDim.w, 1, id + '_dd');

  var puStyle = this._getPopupStyle();
  var bgColor = 'white';
  var bdColor = 'black';
  var bdWidth = 1;

  if (puStyle) {
    bgColor = puStyle.getStyle(DvtCSSStyle.BACKGROUND_COLOR);
    bdColor = DvtAfComponent.getBorderColor(puStyle);
    bdWidth = puStyle.getBorderWidth();
  }

  dropdown.setSolidFill(bgColor);
  dropdown.setSolidStroke(bdColor, null, bdWidth);

  //add the dropdown to the container
  DvtAfMenu._updateDropdown(container, dropdown);

  //populate dropdown
  //Note: use the menu context callback
  this.getAfContext().setContextCallback(this.getContextCallbackObj(),
      this.getContextCallback());
  this.populateDropdown(this.getAfContext(), dropdown);
  var ddWidth = dropdown.getWidth();

  if (hasDropDownContainer) {
    var point;
    var menuShape = this.getContentShape();

    //convert the bounds to global coords
    point = menuShape.localToStage(new DvtPoint(0, 0));

    //convert the bounds to the container coords
    point = container.stageToLocal(point);

    //adjust point to hover window coords if we're in hover window
    //    var hoverWindow = getAttribute("menuHoverWindow");
    //    if (hoverWindow)
    //      point = hoverWindow.stageToLocal(point);

    //for R2L, align to right side of menu
    if (DvtAgent.isRightToLeft(this.getDvtContext())) {
      dropdown.setTranslateX(point.x - ddWidth + menuDim.w);
    }
    else {
      dropdown.setTranslateX(point.x);
    }
    dropdown.setTranslateY(point.y + menuDim.h + 1);
  }
  else {
    //for R2L, align to right side of menu
    if (DvtAgent.isRightToLeft(this.getDvtContext())) {
      dropdown.setTranslateX(menuDim.w - ddWidth);
    }
    else {
      dropdown.setTranslateX(0);
    }
    dropdown.setTranslateY(menuDim.h + 1);
  }

  dropdown.setVisible(true);

  //handling mouseOut to hide dropdown
  //add a mouse focus change listener to the stage to detect
  //when we should auto-hide the dropdown
  var stage = this.getDvtContext().getStage();
  if (stage) {
    stage.addEvtListener(DvtAgent.isTouchDevice() ? DvtTouchEvent.TOUCHSTART : DvtMouseEvent.MOUSEDOWN, this.HandleStageFocusChange, true, this);
  }
};


/**
 * Populate the dropdown menu.
 */
DvtAfMenu.prototype.populateDropdown = function(afContext, dropdown) {

  var dim;
  var currY = DvtAfMenu.DROPDOWN_PADDING;

  var maxDDWidth = dropdown.getWidth(); //start with menu width
  var cmiWidths = [];
  var cmiHeights = [];
  var cmiShapes = [];
  var itemButton;

  //render commandMenuItems
  for (var i = 0; i < this.getNumChildren(); i++) {
    var cmi = this.getChildAt(i);
    if (! cmi.renderMe || cmi.renderMe()) {

      //create itemButton
      itemButton = cmi.createDisplayObj(afContext);

      //add itemButton to dropdown container
      dropdown.addChild(itemButton);

      this.renderChild(cmi);

      //move each item below the previous one
      itemButton.setTranslateY(currY);
      dim = DvtAfComponent.getDimensions(itemButton);
      maxDDWidth = Math.max(maxDDWidth, dim.w);

      currY += dim.h + DvtAfMenu.DROPDOWN_PADDING;

      cmiWidths.push(dim.w);
      cmiHeights.push(dim.h);
      cmiShapes.push(itemButton);

    }
  }

  var ddWidth = maxDDWidth + 2 * DvtAfMenu.DROPDOWN_PADDING;
  dropdown.setWidth(ddWidth);
  dropdown.setHeight(currY);

  //for BiDi, we want menu items right-aligned in dropdown, so we need
  //to calculate the actual size of the dropdown, which is at least as
  //big as the button, even though at this point the dropdown sprite is
  //only as big as the menu items themselves, which could be smaller
  //NOTE: need to save size before entering loop below because the menu
  //item sizes will be adjusted there, which in turn will affect the size
  //of the dropdown

  //make all items the same width
  for (var i = 0; i < cmiShapes.length; i++) {
    var itemButton = cmiShapes[i];

    if (itemButton) {
      var mw = maxDDWidth - DvtAfMenu.DROPDOWN_PADDING;

      itemButton.setSize(mw + 1, cmiHeights[i]);

      //for BiDi, move each menu item over so that it is right-aligned
      itemButton.setTranslateX(DvtAfMenu.DROPDOWN_PADDING);

      if (DvtAgent.isRightToLeft(this.getDvtContext())) {
        itemButton.rightAlign(mw, cmiWidths[i]);
      }

    }
  }

};


DvtAfMenu.prototype.renderChild = function(child) {
  if (child._render) {
    child._render(Number.MAX_VALUE, Number.MAX_VALUE);
  }
};


/**
 * Handle a focus change event on the stage.
 *
 * @param event FocusEvent
 */
DvtAfMenu.prototype.HandleStageFocusChange = function(event) {
  if (event.target) {
    var intObj = event.target;
    var container = this._getMenuDropdownContainer(true);

    //if the target is contained by the dropdown, don't hide dropdown
    for (; intObj != null; intObj = intObj.getParent()) {
      if (intObj == container._afMenuDropDown)
        return;
    }

    this.hideDropdown();
  }

};


/**
 * Remove focus change listeners from the stage.
 */
DvtAfMenu.prototype.RemoveStageFocusChangeListeners = function() {
  var stage = this.getDvtContext().getStage();
  if (stage) {
    stage.removeEvtListener(DvtAgent.isTouchDevice() ? DvtTouchEvent.TOUCHSTART : DvtMouseEvent.MOUSEDOWN, this.HandleStageFocusChange, true, this);
  }
};


DvtAfMenu._updateDropdown = function(container, dropdown) {
  //remove if exists
  if (container._afMenuDropDown) {
    container.removeChild(container._afMenuDropDown);
  }

  //add dropdown if specified
  if (dropdown) {
    if (! container.contains(dropdown)) {
      container.addChild(dropdown);
    }
  }
  container._afMenuDropDown = dropdown;
};


DvtAfMenu.prototype._getMenuDropdownContainer = function(create) {
  var container = this.getAfContext().getMenuDropdownContainer();
  if (create && ! container) {
    container = this.getDisplayObj();
  }

  return container;
};


/**
 * @override
 */
DvtAfMenu.prototype.CreateButton = function(button) {
  var shape = DvtAfMenu.superclass.CreateButton.call(this, button);
  shape.setToggleEnabled(true);
  return shape;
};

/**
 * @override
 */
DvtAfMenu.prototype.handleKeyboardEvent = function(event) {
  var keyCode = event.keyCode;
  if (keyCode == DvtKeyboardEvent.ESCAPE) {
    this.hideDropdown();
  }
  else {
    DvtAfMenu.superclass.handleKeyboardEvent.call(this, event);
  }
};

/**
 * @constructor
 * DvtAfImage
 */
var DvtAfImage = function() {
  this.Init();
};

/*
 * make DvtAfImage a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfImage, DvtAfComponent, 'DvtAfImage');

/*
 * Register the AfImage tag with DvtAfComponentFactory
 */
DvtAfImage.TAG_NAME = 'i';
DvtAfComponentFactory.registerComponent(DvtAfImage.TAG_NAME, DvtAfImage);

// AfImage Attributes
DvtAfImage.ATTR_SOURCE = 'source';


/*-------------------------------------------------------------------------*/
/*   AfComponent attributes                                                */
/*-------------------------------------------------------------------------*/
DvtAfImage.prototype.setSrc = function(src) {
  this.setProperty(DvtAfImage.ATTR_SOURCE, src);

  if (this.getContentShape())
    this.getContentShape().setSrc(src);
};

DvtAfImage.prototype.getSrc = function() {
  return this.getProperty(DvtAfImage.ATTR_SOURCE);
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfImage.prototype.GetDefaultStyles = function() {
  return DvtAfImage._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfImage.prototype.SetDefaultStyles = function(styleList) {
  DvtAfImage._afStyles = styleList;
};


/*-------------------------------------------------------------------------*/
/*   Create Content Shape                                                  */
/*-------------------------------------------------------------------------*/
DvtAfImage.prototype.createContentShape = function(dvtContext) {
  //Bug 13384179 - af:image border-color and border-width don't work
  return new DvtImage(dvtContext, this.getSrc(), 0, 0, 1, 1, this._getUniqueId());
};


DvtAfImage.prototype.renderSelfBeforeChildren = function() {
  DvtAfImage.superclass.renderSelfBeforeChildren.call(this);

  if (this.getSrc()) {
    var shape = this.getContentShape();
    shape.setX(this.getCX());
    shape.setY(this.getCY());

    if (this._cw !== Number.MAX_VALUE)
      shape.setWidth(this._cw);

    if (this._ch !== Number.MAX_VALUE)
      shape.setHeight(this._ch);

  }
};

/**
 * @override
 */
DvtAfImage.prototype.adjustClientArea = function(cssStyle) {
  if (this.getSrc()) {

    var image;
    image = DvtImageLoader.loadImage(this.getDvtContext(),
                                     this.getSrc(),
                                     this.createCallback(this.onImageLoaded));
    // image is not loaded
    if (!image) {
      //Bug 13536792 - images without explicit size fail to render
      //if image size is not specified, notify the component to re-layout the page
      if (!(this._getExplicitHeight(cssStyle) &&
            this._getExplicitWidth(cssStyle))) {
        this.RegisterImageCallback(this.getSrc());
      }
    }
  }

  DvtAfImage.superclass.adjustClientArea.call(this, cssStyle);

};


DvtAfImage.prototype.onImageLoaded = function(image) {

  // set image size
  if (image != null && image.width && image.height) {
    this._ew = this.getCalcWidth(image.width);
    this._eh = this.getCalcHeight(image.height);

    this._aw = this._ew;
    this._ah = this._eh;

    // set size on shape
    var shape = this.getContentShape();
    if (shape) {
      shape.setWidth(this._ew);
      shape.setHeight(this._eh);
    }

  }
};


DvtAfImage.prototype.getTagName = function() {
  return DvtAfImage.TAG_NAME;
};


/**
 * @override
 */
DvtAfImage.prototype.registerAsTabStop = function() {
  this.getAfContext().registerTabStop(this);
};
/**
 * @constructor
 * DvtAfMarker
 */
var DvtAfMarker = function() {
  this.Init();
};

/*
 * make DvtAfMarker a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfMarker, DvtAfComponent, 'DvtAfMarker');

/*
 * Register the DvtAfMarker tag with DvtAfComponentFactory
 */
DvtAfMarker.TAG_NAME = 'mk';
DvtAfComponentFactory.registerComponent(DvtAfMarker.TAG_NAME, DvtAfMarker);

// space between marker and label
DvtAfMarker.MARKER_LABEL_PADDING = 2;

// DvtAfMarker Attributes
DvtAfMarker.ATTR_LABEL_DISPLAY = 'labelDisplay';
DvtAfMarker.ATTR_LABEL_POSITION = 'labelPosition';
DvtAfMarker.ATTR_LABEL_STYLE = 'labelStyle';
DvtAfMarker.ATTR_VALUE = 'value';
DvtAfMarker.ATTR_SCALE_X = 'scaleX';
DvtAfMarker.ATTR_SCALE_Y = 'scaleY';
DvtAfMarker.ATTR_SHAPE = 'shape';
DvtAfMarker.ATTR_SHAPE_PATH = 'shapePath';
DvtAfMarker.ATTR_FILL_COLOR = 'fillColor';
DvtAfMarker.ATTR_FILL_PATTERN = 'fillPattern';
DvtAfMarker.ATTR_GRADIENT_EFFECT = 'gradientEffect';
DvtAfMarker.ATTR_OPACITY = 'opacity';
DvtAfMarker.ATTR_WIDTH = 'width';
DvtAfMarker.ATTR_HEIGHT = 'height';
DvtAfMarker.ATTR_X = 'x';
DvtAfMarker.ATTR_Y = 'y';
DvtAfMarker.ATTR_BORDER_STYLE = 'borderStyle';
DvtAfMarker.ATTR_BORDER_WIDTH = 'borderWidth';
DvtAfMarker.ATTR_BORDER_COLOR = 'borderColor';
DvtAfMarker.ATTR_SOURCE = 'source';
DvtAfMarker.ATTR_SOURCE_HOVER = 'sourceHover';
DvtAfMarker.ATTR_SOURCE_SELECTED = 'sourceSelected';
DvtAfMarker.ATTR_SOURCE_HOVER_SELECTED = 'sourceHoverSelected';

DvtAfMarker.ATTR_HAS_ACTION_LISTENER = 'hasActionListener';


// valid values for the Shape attribute. Default: circle
DvtAfMarker.CIRCLE = 'c';
DvtAfMarker.SQUARE = 's';
DvtAfMarker.DIAMOND = 'd';
DvtAfMarker.TRIANGLE_UP = 'tu';
DvtAfMarker.TRIANGLE_DOWN = 'td';
DvtAfMarker.PLUS = 'p';
DvtAfMarker.HUMAN = 'h';
DvtAfMarker.ROUNDED_RECTANGLE = 'rr';


//  Marker types (see DvtMarker)
//  Note: these marker types are defined in the same order
//        as the definitions in the parser.  Don't change
//        one without changing the other!
DvtAfMarker._markerTypeMap = {
  'c' : DvtSimpleMarker.CIRCLE,
  's' : DvtSimpleMarker.SQUARE,
  'd' : DvtSimpleMarker.DIAMOND,
  'tu' : DvtSimpleMarker.TRIANGLE_UP,
  'td' : DvtSimpleMarker.TRIANGLE_DOWN,
  'p' : DvtSimpleMarker.PLUS,
  'h' : DvtSimpleMarker.HUMAN,
  'rr' : DvtSimpleMarker.ROUNDED_RECT
};

DvtAfMarker._markerFillPatternMap = {
  'smallDiagonalLeft' : DvtPatternFill.SM_DIAG_UP_LT,
  'largeDiagonalLeft' : DvtPatternFill.LG_DIAG_UP_LT,
  'smallDiagonalRight' : DvtPatternFill.SM_DIAG_UP_RT,
  'largeDiagonalRight' : DvtPatternFill.LG_DIAG_UP_RT,
  'smallCrosshatch' : DvtPatternFill.SM_CROSSHATCH,
  'largeCrosshatch' : DvtPatternFill.LG_CROSSHATCH,
  'smallChecker' : DvtPatternFill.SM_CHECK,
  'largeChecker' : DvtPatternFill.LG_CHECK,
  'smallTriangle' : DvtPatternFill.SM_TRIANGLE_CHECK,
  'largeTriangle' : DvtPatternFill.LG_TRIANGLE_CHECK,
  'smallDiamond' : DvtPatternFill.SM_DIAMOND_CHECK,
  'largeDiamond' : DvtPatternFill.LG_DIAMOND_CHECK
};


/*-------------------------------------------------------------------------*/
/*   DvtAfMarker attributes                                                */
/*-------------------------------------------------------------------------*/
/**
 * Gets the shape of the marker.
 * @return the shape of the marker
 */
DvtAfMarker.prototype.getShape = function() {
  return this.getProperty(DvtAfMarker.ATTR_SHAPE);
};


/**
 * Specifies the shape of the marker.
 * @param shape the shape of the marker
 */
DvtAfMarker.prototype.setShape = function(shape) {
  this.setProperty(DvtAfMarker.ATTR_SHAPE, shape);
};


/**
 * Gets the path to the svg file to use as a custom shape
 * @return path to custom svg file
 */
DvtAfMarker.prototype.getShapePath = function() {
  return this.getProperty(DvtAfMarker.ATTR_SHAPE_PATH);
};


/**
 * Specifies the path to the svg file to use as a custom shape
 * @param shapePath path to custom svg file
 */
DvtAfMarker.prototype.setShapePath = function(shapePath) {
  this.setProperty(DvtAfMarker.ATTR_SHAPE_PATH, shapePath);
};


/**
 * @export
 * Gets the value of the component. When labelDisplay="on", this value will be used as the
 * text label for this marker
 * @return value of the component
 */
DvtAfMarker.prototype.getValue = function() {
  return this.getProperty(DvtAfMarker.ATTR_VALUE);
};


/**
 * Sets the value of the component. When labelDisplay="on", this value will be used as the
 * text label for this marker
 * @param value value of the component
 */
DvtAfMarker.prototype.setValue = function(value) {
  this.setProperty(DvtAfMarker.ATTR_VALUE, value);
};


/**
 * @export
 * Gets the fill color of this marker. Valid values are RGB hexadecimal
 * @return fill color of this marker
 */
DvtAfMarker.prototype.getFillColor = function() {
  return this.getProperty(DvtAfMarker.ATTR_FILL_COLOR);
};


/**
 * Sets the fill color of this marker. Valid values are RGB hexadecimal
 * @param fillColor fill color of this marker
 */
DvtAfMarker.prototype.setFillColor = function(fillColor) {
  this.setProperty(DvtAfMarker.ATTR_FILL_COLOR, fillColor);
};


/**
 * Gets the built-in pattern used to fill this marker. Valid values are:
 * "smallDiagonalLeft"
 * "smallChecker"
 * "smallDiagonalRight"
 * "smallTriangle"
 * "smallCrosshatch"
 * "smallDiamond"
 * "largeDiagonalLeft"
 * "largeChecker"
 * "largeDiagonalRight"
 * "largeTriangle"
 * "largeCrosshatch"
 * "largeDiamond"
 *
 * The pattern is drawn with a white background, and the foreground color is taken from the fillColor attribute.
 * @return pattern used to fill the marker
 */
DvtAfMarker.prototype.getFillPattern = function() {
  return this.getProperty(DvtAfMarker.ATTR_FILL_PATTERN);
};


/**
 * Sets the built-in pattern used to fill this marker. Valid values are:
 * "smallDiagonalLeft"
 * "smallChecker"
 * "smallDiagonalRight"
 * "smallTriangle"
 * "smallCrosshatch"
 * "smallDiamond"
 * "largeDiagonalLeft"
 * "largeChecker"
 * "largeDiagonalRight"
 * "largeTriangle"
 * "largeCrosshatch"
 * "largeDiamond"
 *
 * The pattern is drawn with a white background, and the foreground color is taken from the fillColor attribute.
 * @param pattern pattern used to fill the marker
 */
DvtAfMarker.prototype.setFillPattern = function(fillPattern) {
  this.setProperty(DvtAfMarker.ATTR_FILL_PATTERN, fillPattern);
};


/**
 * Gets the horizontal scale factor for this marker. This determines how much to scale the marker from its default size.
 * @return horizontal scale factor
 */
DvtAfMarker.prototype.getScaleX = function() {
  return this.getProperty(DvtAfMarker.ATTR_SCALE_X);
};


/**
 * Sets the horizontal scale factor for this marker. This determines how much to scale the marker from its default size.
 * @param scaleX horizontal scale factor
 */
DvtAfMarker.prototype.setScaleX = function(scaleX) {
  this.setProperty(DvtAfMarker.ATTR_SCALE_X, scaleX);
};


/**
 * Gets the vertical scale factor for this marker. This determines how much to scale the marker from its default size.
 * @return vertical scale factor
 */
DvtAfMarker.prototype.getScaleY = function() {
  return this.getProperty(DvtAfMarker.ATTR_SCALE_Y);
};


/**
 * Gets the vertical scale factor for this marker. This determines how much to scale the marker from its default size.
 * @param scaleY vertical scale factor
 */
DvtAfMarker.prototype.setScaleY = function(scaleY) {
  this.setProperty(DvtAfMarker.ATTR_SCALE_Y, scaleY);
};


/**
 * Gets the font style for labels associated with this marker. Accepts font-related CSS attributes like font-name,
 * font-weight, font-size, color, etc.
 * @return font style for labels associated with this marker
 */
DvtAfMarker.prototype.getLabelStyle = function() {
  return this.getProperty(DvtAfMarker.ATTR_LABEL_STYLE);
};


/**
 * Sets the font style for labels associated with this marker. Accepts font-related CSS attributes like font-name,
 * font-weight, font-size, color, etc.
 * @param labelStyle font style for labels associated with this marker
 */
DvtAfMarker.prototype.setLabelStyle = function(labelStyle) {
  this.setProperty(DvtAfMarker.ATTR_LABEL_STYLE, labelStyle);
};


/**
 * Gets the position relative to the marker that the specified value label should be displayed at. Valid values are:
 * "top" - Display the label on top of the marker
 * "bottom" - Display the label below the marker
 * "center" - (default) Display the label on the center of the marker
 * @return position of the marker's label
 */
DvtAfMarker.prototype.getLabelPosition = function() {
  return this.getProperty(DvtAfMarker.ATTR_LABEL_POSITION);
};


/**
 * Sets the position relative to the marker that the specified value label should be displayed at. Valid values are:
 * "top" - Display the label on top of the marker
 * "bottom" - Display the label below the marker
 * "center" - (default) Display the label on the center of the marker
 * @param labelPosition position of the marker's label
 */
DvtAfMarker.prototype.setLabelPosition = function(labelPosition) {
  this.setProperty(DvtAfMarker.ATTR_LABEL_POSITION, labelPosition);
};


/**
 * Gets the label display behavior for this marker. Valid values are:
 * "on" - Display the label provided in the value attribute
 * "off" - (default) Do not display the label provided in the value attribute
 * @return label display behavior for this marker
 */
DvtAfMarker.prototype.getLabelDisplay = function() {
  return this.getProperty(DvtAfMarker.ATTR_LABEL_DISPLAY);
};


/**
 * Sets the label display behavior for this marker. Valid values are:
 * "on" - Display the label provided in the value attribute
 * "off" - (default) Do not display the label provided in the value attribute
 * @param labelDisplay label display behavior for this marker
 */
DvtAfMarker.prototype.setLabelDisplay = function(labelDisplay) {
  this.setProperty(DvtAfMarker.ATTR_LABEL_DISPLAY, labelDisplay);
};


/**
 * Gets the gradient effect that should be used for this marker. Valid values are:
 * "auto" - (default) Sets a gradient on the marker
 * "none" - Do not use gradients on the marker. This causes markers to appear flat.
 * @return gradient effect for this marker
 */
DvtAfMarker.prototype.getGradientEffect = function() {
  return this.getProperty(DvtAfMarker.ATTR_GRADIENT_EFFECT);
};


/**
 * Specifies the gradient effect that should be used for this marker. Valid values are:
 * "auto" - (default) Sets a gradient on the marker
 * "none" - Do not use gradients on the marker. This causes markers to appear flat.
 * @param gradientEffect gradient effect for this marker
 */
DvtAfMarker.prototype.setGradientEffect = function(gradientEffect) {
  this.setProperty(DvtAfMarker.ATTR_GRADIENT_EFFECT, gradientEffect);
};


/**
 * Gets the opacity of the fill color of the marker. Valid values are from 0.0 - 1.0, where 0.0 is transparent and 1.0 is opaque.
 * @return opacity of the marker
 */
DvtAfMarker.prototype.getOpacity = function() {
  return this.getProperty(DvtAfMarker.ATTR_OPACITY);
};


/**
 * Specifies the opacity of the fill color of the marker. Valid values are from 0.0 - 1.0, where 0.0 is transparent and 1.0 is opaque.
 * @param opacity opacity of the marker
 */
DvtAfMarker.prototype.setOpacity = function(opacity) {
  this.setProperty(DvtAfMarker.ATTR_OPACITY, opacity);
};


/**
 * Gets the border style of this marker. Valid values are:
 * "none" - (default) No border will be displayed
 * "solid" - A solid border will be displayed
 * @return the border style
 */
DvtAfMarker.prototype.getBorderStyle = function() {
  return this.getProperty(DvtAfMarker.ATTR_BORDER_STYLE);
};


/**
 * Sets the border style of this marker. Valid values are:
 * "none" - (default) No border will be displayed
 * "solid" - A solid border will be displayed
 * @param borderStyle the border style
 */
DvtAfMarker.prototype.setBorderStyle = function(borderStyle) {
  this.setProperty(DvtAfMarker.ATTR_BORDER_STYLE, borderStyle);
};


/**
 * Gets the border width of this marker.
 * @return the border width
 */
DvtAfMarker.prototype.getBorderWidth = function() {
  return this.getFloatProp(DvtAfMarker.ATTR_BORDER_WIDTH);
};


/**
 * Sets the border width of this marker.
 * @param borderWidth the border width
 */
DvtAfMarker.prototype.setBorderWidth = function(borderWidth) {
  this.setProperty(DvtAfMarker.ATTR_BORDER_WIDTH, borderWidth);
};


/**
 * Gets the border color of this marker. Valid values are RGB hexadecimal
 * @return ther bordercolor
 */
DvtAfMarker.prototype.getBorderColor = function() {
  return this.getProperty(DvtAfMarker.ATTR_BORDER_COLOR);
};


/**
 * Sets the border color of this marker. Valid values are RGB hexadecimal
 * @param borderColor the border color
 */
DvtAfMarker.prototype.setBorderColor = function(borderColor) {
  this.setProperty(DvtAfMarker.ATTR_BORDER_COLOR, borderColor);
};


/**
 * Gets the width for this marker.
 * @return width
 */
DvtAfMarker.prototype.getWidth = function() {
  return this.getFloatProp(DvtAfMarker.ATTR_WIDTH);
};


/**
 * Sets the width for this marker.
 * @param width
 */
DvtAfMarker.prototype.setWidth = function(width) {
  this.setProperty(DvtAfMarker.ATTR_WIDTH, width);
};


/**
 * Gets the height for this marker.
 * @return height
 */
DvtAfMarker.prototype.getHeight = function() {
  return this.getFloatProp(DvtAfMarker.ATTR_HEIGHT);
};


/**
 * Gets the height for this marker.
 * @param height
 */
DvtAfMarker.prototype.setHeight = function(height) {
  this.setProperty(DvtAfMarker.ATTR_HEIGHT, height);
};


/**
 * Gets the image source for this marker.
 * @return source
 */
DvtAfMarker.prototype.getSource = function() {
  return this.getProperty(DvtAfMarker.ATTR_SOURCE);
};


/**
 * Sets the image source for this marker.
 * @param source
 */
DvtAfMarker.prototype.setSource = function(source) {
  this.setProperty(DvtAfMarker.ATTR_SOURCE, source);
};


/**
 * Gets the hover image source for this marker.
 * @return source
 */
DvtAfMarker.prototype.getSourceHover = function() {
  return this.getProperty(DvtAfMarker.ATTR_SOURCE_HOVER);
};


/**
 * Sets the hover image source for this marker.
 * @param source
 */
DvtAfMarker.prototype.setSourceHover = function(source) {
  this.setProperty(DvtAfMarker.ATTR_SOURCE_HOVER, source);
};


/**
 * Gets the selected image source for this marker.
 * @return source
 */
DvtAfMarker.prototype.getSourceSelected = function() {
  return this.getProperty(DvtAfMarker.ATTR_SOURCE_SELECTED);
};


/**
 * Sets the selected image source for this marker.
 * @param source
 */
DvtAfMarker.prototype.setSourceSelected = function(source) {
  this.setProperty(DvtAfMarker.ATTR_SOURCE_SELECTED, source);
};


/**
 * Gets the hover selected image source for this marker.
 * @return source
 */
DvtAfMarker.prototype.getSourceHoverSelected = function() {
  return this.getProperty(DvtAfMarker.ATTR_SOURCE_HOVER_SELECTED);
};


/**
 * Sets the hover selected image source for this marker.
 * @param source
 */
DvtAfMarker.prototype.setSourceHoverSelected = function(source) {
  this.setProperty(DvtAfMarker.ATTR_SOURCE_HOVER_SELECTED, source);
};

DvtAfMarker.prototype.getX = function() {
  return this.getFloatProp(DvtAfMarker.ATTR_X, 0);
};

DvtAfMarker.prototype.getY = function() {
  return this.getFloatProp(DvtAfMarker.ATTR_Y, 0);
};



/*-------------------------------------------------------------------------*/
/*   CreateDisplayObject                                                   */
/*-------------------------------------------------------------------------*/


/**
 * @override
 */
DvtAfMarker.prototype.createDisplayObj = function(afContext) {
  //Bug 13477511 - RENDERED FLAG ISN'T WORKING CORRECTLY FOR MARKERS
  if (! this.renderMe())
    return null;

  //BUG 13971862: save the parent node so we can call back to it for popups
  //BUG 14456277: Save the parent node for markers, because they do not call super.createDisplayObj
  this._parentNode = afContext.getParentNode();

  this.setAfContext(afContext);
  var dvtContext = this.getDvtContext();
  this.registerAsTabStop();

  //Bug 13491092 - action attribute on dvt:marker used within diagram overlay is ignored
  // save context callback
  this.SaveContextCallback();

  // if it has an Id, make it unique
  // otherwise, generate a unique Id
  var id = this._getUniqueId();

  var ww = this.getWidth();
  var hh = this.getHeight();
  var x = 0;
  var y = 0;
  if (ww && !hh) {
    hh = ww;
  }
  else if (!ww && hh) {
    ww = hh;
  }
  else if (!ww && !hh) {
    ww = DvtMarkerDef.BI_DEFAULT_MARKER_SIZE;
    hh = DvtMarkerDef.BI_DEFAULT_MARKER_SIZE;
  }

  var type;
  // Marker type can be
  // 1) custom marker image
  // 2) custom marker shape
  // 3) built-in marker shape
  var imgSrc = this.getSource();
  var shapeSrc = this.getShapePath();
  if (imgSrc) { // Case 1
    type = [imgSrc, this.getSourceSelected(), this.getSourceHover(), this.getSourceHoverSelected()];
  }
  else if (shapeSrc) { // Case 2
    // if shapePath is specified, find the custom marker def and use it
    //Note: in graph mt="s,10" or mt="/resources/svg/cherry.svg,9"
    type = shapeSrc;
    x = this.getX();
    y = this.getY();
  }
  else { // Case 3
    var mshape = this.getShape();
    // no svgPath and no shape specified, default to circle
    if (!mshape)
      mshape = DvtAfMarker.CIRCLE;
    type = DvtAfMarker._markerTypeMap[mshape];
  }

  //NOTE: get dimensions seems ignore scale
  //resolve scaleX and scaleY -
  //For builtin marker: width and height are scaled here
  var scaleX = this.getScaleX();
  var scaleY = this.getScaleY();

  // create marker
  var marker;
  var cx = x + 1 / 2 * ww;
  var cy = y + 1 / 2 * hh;
  if (type instanceof Array) {
    marker = new DvtImageMarker(dvtContext, cx, cy, scaleX ? ww * scaleX : ww, scaleY ? hh * scaleY : hh, type[0], type[1], type[2], type[3]);
  }
  else {
    marker = new DvtSimpleMarker(dvtContext, type, afContext.getSkinName(), cx, cy, scaleX ? ww * scaleX : ww, scaleY ? hh * scaleY : hh, false);
  }
  // Bug 17291324 - EM: CLICKABLE MOUSE CURSOR IS NOT SHOWN UP WHEN MOUSE OVER MARKER TAG
  var bAction = this.getProperty(DvtAfMarker.ATTR_HAS_ACTION_LISTENER);
  if (! bAction) {
    var spbs = this.getShowPopupBehaviors();
    if (DvtArrayUtils.isArray(spbs)) {
      for (var i = 0; i < spbs.length; i++) {
        if (spbs[i] && spbs[i].getTriggerType() == 'click') {
          bAction = true;
          break;
        }
      }
    }
    if (! bAction) {
      var cbs = this.getClientBehaviors();
      if (DvtArrayUtils.isArray(cbs)) {
        for (var i = 0; i < cbs.length; i++) {
          if (cbs[i] && cbs[i].getTriggerType() == 'click') {
            bAction = true;
            break;
          }
        }
      }
    }
  }
  marker.setCursor(bAction ? DvtSelectionEffectUtils.getSelectingCursor() : null);

  marker._prop = this._prop;

  // solid, gradient, pattern fill?
  var fc = this.getFillColor();
  var fa = this.getOpacity();
  var ge = this.getGradientEffect();
  var fp = this.getFillPattern();

  if (fp) {
    fp = DvtAfMarker._markerFillPatternMap[fp];
  }
  if (fp) {
    marker.setFill(new DvtPatternFill(fp, fc));
  }
  else if (ge == 'auto') {
    marker.setFill(DvtMarkerGradient.createMarkerGradient(fc ? fc : '#000000', marker, fa ? fa : 1.0));
  }
  else if (fc || fa) {
    marker.setSolidFill(fc, fa);
  }

  if (!this.getShapePath()) {
    var bs = this.getBorderStyle();
    if (bs && bs != 'none') {
      var bw = this.getBorderWidth();
      bw = bw ? bw : 1;
      var bc = this.getBorderColor();
      bc = bc ? bc : '#000000';

      var stroke = new DvtSolidStroke(bc, 1, bw);
      stroke.setType(DvtStroke.convertTypeString(bs));

      marker.setStroke(stroke);
    }
  }

  this._marker = marker;

  // create marker label
  var value = this.getValue();
  var bvis = (this.getLabelDisplay() && this.getLabelDisplay() === 'off') ? false : true;

  if (value && bvis) {
    var labelId = id + '_lb';
    var label = new DvtOutputText(dvtContext, value, 0, 0, labelId);

    var cssStyle;
    var lstyle = this.getLabelStyle();
    if (DvtAfComponentFactory.CACHE_STYLES) {
      cssStyle = afContext.GetCSSStyle(this.getTagName(), '', lstyle, true);
    }
    else {
      cssStyle = lstyle ? this.createTextStyles(new DvtCSSStyle(lstyle), DvtAfStyleUtils.getDefaultTextStyle()) : DvtAfStyleUtils.getDefaultTextStyle();
    }

    if (cssStyle) {
      label.setCSSStyle(cssStyle);
    }
    this._label = label;

    // create a container for both marker and label
    var group = new DvtContainer(dvtContext, id);
    var position = this.getLabelPosition();
    if (position === 'top') {
      group.addChild(label);
      group.addChild(marker);
    }
    else {
      group.addChild(marker);
      group.addChild(label);
    }
    this._bgShape = group;
  }
  else {
    this._bgShape = marker;
  }

  //save a reference back to the af component
  this._bgShape._afComp = this;
  return this._bgShape;
};


//extends DvtAfComponent
// DvtAfMarker.prototype.getDisplayObj = function() {
//   return this._bgShape;
// }

DvtAfMarker.prototype.getMarkerDisplayObj = function() {
  return this._marker;
};

//extends DvtAfComponent TODO: comment out?
DvtAfMarker.prototype.setTranslateX = function(relx) {
  this._bgShape.setTranslateX(relx);
};

//extends DvtAfComponent TODO: comment out?
DvtAfMarker.prototype.setTranslateY = function(rely) {
  this._bgShape.setTranslateY(rely);
};


DvtAfMarker.prototype.render = function(afContext) {
  //Bug 13477511 - RENDERED FLAG ISN'T WORKING CORRECTLY FOR MARKERS
  if (! this.renderMe())
    return;

  //if shortDesc is specified, show it in a tooltip
  var shape = this.getDisplayObj();
  if (this.getShortDesc() || this.getProperty(DvtAfMarker.ATTR_HAS_ACTION_LISTENER) || this.getShowPopupBehaviors() || this.getClientBehaviors()) {
    this.associate(shape, this);
  }

  var marker = this._marker;
  var label = this._label;
  var mkx = this.getX();
  var mky = this.getY();

  var msw = marker.getWidth();
  var msh = marker.getHeight();

  // no visible label
  if (! label) {
    //extends DvtAfComponent
    this._setBounds(afContext, mkx, mky, msw, msh);
    return;
  }

  //Bug 13408941 - diagrammer js code stops executing when markersize is zero
  if (msw === 0 && msh === 0) {
    this._setBounds(afContext, mkx, mky, 0, 0);
    return;
  }

  var mktx = marker.getTranslateX();
  mktx = (mktx === null || isNaN(mktx)) ? 0 : mktx;
  var mkty = marker.getTranslateY();
  mkty = (mkty === null || isNaN(mkty)) ? 0 : mkty;
  var markerDim = {
    x: (mkx + mktx),
    y: (mky + mkty),
    w: msw,
    h: msh
  };

  var labelDim;
  if (! (labelDim instanceof DvtRectangle)) {
    labelDim = label.getDimensions();
  }

  var lbtx = markerDim.x;
  var lbty = markerDim.y;
  label.setTranslateX(lbtx);
  label.setTranslateY(lbty);
  var gww;
  var ghh;
  var position = this.getLabelPosition();
  var wM_L = markerDim.w - labelDim.w;
  var hM_L = markerDim.h - labelDim.h;

  switch (position) {
    case 'top':
      if (wM_L > 0) {
        label.setTranslateX(lbtx + wM_L / 2);
      }
      else {
        marker.setTranslateX(mktx - wM_L / 2);
      }
      marker.setTranslateY(mkty + labelDim.h +
          DvtAfMarker.MARKER_LABEL_PADDING);

      gww = Math.max(markerDim.w, labelDim.w);
      ghh = labelDim.h + DvtAfMarker.MARKER_LABEL_PADDING + markerDim.h;
      break;

    case 'bottom':
      if (wM_L > 0) {
        label.setTranslateX(lbtx + wM_L / 2);
      }
      else {
        marker.setTranslateX(mktx - wM_L / 2);
      }
      label.setTranslateY(lbty + markerDim.h +
          DvtAfMarker.MARKER_LABEL_PADDING);

      gww = Math.max(markerDim.w, labelDim.w);
      ghh = markerDim.h + DvtAfMarker.MARKER_LABEL_PADDING + labelDim.h;
      break;

    case 'left':
      if (hM_L > 0) {
        label.setTranslateY(lbty + hM_L / 2);
      }
      else {
        marker.setTranslateY(mkty - hM_L / 2);
      }
      marker.setTranslateX(mktx + labelDim.w +
          DvtAfMarker.MARKER_LABEL_PADDING);

      gww = labelDim.w + DvtAfMarker.MARKER_LABEL_PADDING + markerDim.w;
      ghh = Math.max(markerDim.h, labelDim.h);
      break;

    case 'right':
      if (hM_L > 0) {
        label.setTranslateY(lbty + hM_L / 2);
      }
      else {
        marker.setTranslateY(mkty - hM_L / 2);
      }
      label.setTranslateX(lbtx + markerDim.w +
          DvtAfMarker.MARKER_LABEL_PADDING);

      gww = markerDim.w + DvtAfMarker.MARKER_LABEL_PADDING + labelDim.w;
      ghh = Math.max(markerDim.h, labelDim.h);
      break;

    case 'center':
    default:
      if (wM_L > 0) {
        label.setTranslateX(lbtx + wM_L / 2);
      }
      else {
        marker.setTranslateX(mktx - (wM_L / 2));
      }
      if (hM_L > 0) {
        label.setTranslateY(lbty + hM_L / 2);
      }
      else {
        marker.setTranslateY(mkty - (hM_L / 2));
      }
      gww = Math.max(markerDim.w, labelDim.w);
      ghh = Math.max(markerDim.h, labelDim.h);
      break;
  }

  //extends DvtAfComponent
  this._setBounds(afContext, lbtx, lbty, gww, ghh);

};


//extends DvtAfComponent
// DvtAfMarker.prototype.getDimensions = function() {
//   return this._groupDim;
// }



DvtAfMarker.prototype.getTagName = function() {
  return DvtAfMarker.TAG_NAME;
};


//extends DvtAfComponent
/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfMarker.prototype.GetDefaultStyles = function() {
  return DvtAfMarker._afStyles;
};


//extends DvtAfComponent
/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfMarker.prototype.SetDefaultStyles = function(styleList) {
  DvtAfMarker._afStyles = styleList;
};


//extends DvtAfComponent
/**
 * @private
 */
DvtAfMarker.prototype._render = function(availWidth, availHeight) {
  if (! this.renderMe())
    return;

  //if shortDesc is specified, show it in a tooltip
  var shape = this.getDisplayObj();
  if (this.getShortDesc() || this.getProperty(DvtAfMarker.ATTR_HAS_ACTION_LISTENER) || this.getShowPopupBehaviors() || this.getClientBehaviors()) {
    this.associate(shape, this);
  }

  //Performance: using the same context during rendering
  //so we have a list of dimensions for all text objects
  DvtAfComponent._renderComp(this.getAfContext(), this, availWidth, availHeight);
};

//extends DvtAfComponent
DvtAfMarker.prototype.renderSelfBeforeChildren = function() {
};


DvtAfMarker.prototype._setBounds = function(afContext, xx, yy, ww, hh) {
  this._dim = new DvtRectangle(xx, yy, ww, hh);

  // clipped?
  this._addClipPathIfNeeded(afContext, 0, 0,
                            afContext.getAvailableWidth(), this._dim.w,
                            afContext.getAvailableHeight(), this._dim.h);
};


/*
DvtAfMarker.prototype._getExplicitHeight = function(cssStyle) {
  return this.getProperty(DvtAfMarker.ATTR_HEIGHT);
};

DvtAfMarker.prototype._getExplicitWidth = function(cssStyle) {
  return this.getProperty(DvtAfMarker.ATTR_WIDTH);
};
*/


//Bug 13491092 - action attribute on dvt:marker used within diagram overlay is ignored
DvtAfMarker.prototype.isCommandComponent = function() {
  return true;
};

DvtAfMarker.prototype.isClickEventPropagationStopped = function() {
  return this.getProperty(DvtAfMarker.ATTR_HAS_ACTION_LISTENER);
};

DvtAfMarker.prototype.registerAsTabStop = function() {
  this.getAfContext().registerTabStop(this);
};

/**
 * @override
 */
DvtAfMarker.prototype.GetClipPathDimensions = function() {
  var afContext = this.getAfContext();
  return new DvtRectangle(0,
                          0,
                          Math.min(afContext.getAvailableWidth(), this._dim.w),
                          Math.min(afContext.getAvailableHeight(), this._dim.h));
};
/**
 * @constructor
 * DvtAfOutputText
 */
var DvtAfOutputText = function() {
  this.Init();
};

/*
 * make DvtAfOutputText a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfOutputText, DvtAfComponent, 'DvtAfOutputText');

/*
 * Register the AfOutputText tag with DvtAfComponentFactory
 */
DvtAfOutputText.TAG_NAME = 'ot';
DvtAfComponentFactory.registerComponent(DvtAfOutputText.TAG_NAME, DvtAfOutputText);


// AfOutputText Attributes
DvtAfOutputText.ATTR_VALUE = 'value';
DvtAfOutputText.ATTR_NO_WRAP = 'noWrap';
DvtAfOutputText.ATTR_TRUNCATE_AT = 'truncateAt';




/*-------------------------------------------------------------------------*/
/*   AfComponent attributes                                                */
/*-------------------------------------------------------------------------*/
DvtAfOutputText.prototype.setNoWrap = function(noWrap) {
  this.setProperty(DvtAfOutputText.ATTR_NO_WRAP, noWrap);
};

// default: wrapping
DvtAfOutputText.prototype.isNoWrap = function() {
  return this.getBooleanProp(DvtAfOutputText.ATTR_NO_WRAP, false);
};

DvtAfOutputText.prototype.setTruncateAt = function(truncateAt) {
  this.setProperty(DvtAfOutputText.ATTR_TRUNCATE_AT, truncateAt);
};

// default: no truncation
DvtAfOutputText.prototype.getTruncateAt = function() {
  return this.getIntegerProp(DvtAfOutputText.ATTR_TRUNCATE_AT, 0);
};

DvtAfOutputText.prototype.setValue = function(value) {
  this.setProperty(DvtAfOutputText.ATTR_VALUE, value);

  if (this.getContentShape()) {
    this.getContentShape().setTextString(value);
  }
};

DvtAfOutputText.prototype.getValue = function() {
  return this.getProperty(DvtAfOutputText.ATTR_VALUE);
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfOutputText.prototype.GetDefaultStyles = function() {
  return DvtAfOutputText._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfOutputText.prototype.SetDefaultStyles = function(styleList) {
  DvtAfOutputText._afStyles = styleList;
};


/**
 * @override
 */
DvtAfOutputText.prototype.createContentShape = function(dvtContext) {
  return this.createTextShape(! this.isNoWrap(), this.getValue(), null);
};


/**
 * @override
 */
DvtAfOutputText.prototype.renderSelfBeforeChildren = function() {
  DvtAfOutputText.superclass.renderSelfBeforeChildren.call(this);

  var untruncatedTextString = this.getValue();
  if (untruncatedTextString) {
    var shape = this.getContentShape();
    var maxChars = this._getMaximumCharacters();
    var isTruncated = false;
    if (maxChars && untruncatedTextString.length > maxChars) {
      isTruncated = true;
      shape.setTextString(untruncatedTextString.substring(0, maxChars - 3) + DvtOutputText.ELLIPSIS);
    }

    var rendered = DvtTextUtils.fitText(shape, this._cw, this._ch, shape.getParent());

    // Do not render if not added to the DOM
    if (rendered) {
      isTruncated = isTruncated || shape.isTruncated();
      var dim = shape.getDimensions();
      switch (this._getTextAlignment()) {
        case 'left':
          shape.setX(this.getCX());
          shape.alignLeft();
          break;
        case 'center':
          shape.setX(this.getCX() + dim.w / 2);
          shape.alignCenter();
          break;
        case 'right':
          shape.setX(this.getCX() + dim.w);
          shape.alignRight();
          break;
      }
      shape.setY(this.getCY());

      // add clip path if needed
      if (! isTruncated) {
        this._addClipPathIfNeeded(this.getAfContext(), this.getCX(), this.getCY(),
                                  this._aw, dim.w, this._ah, dim.h, shape);
      }

      this._cw = this.getCalcWidth(dim.w);
      this._ch = this.getCalcHeight(dim.h);

      // check if text isTruncated
      if (isTruncated) {
        this.associate(shape, this);
      }
    }
  }
  else {
    this._cw = 0;
    this._ch = 0;
  }
};

/**
 * @private
 *
 * @return {string} The resolved text alignment, taking locale into account
 */
DvtAfOutputText.prototype._getTextAlignment = function() {
  var textAlign = this.getCSSStyle().getStyle('text-align');
  var rtl = DvtAgent.isRightToLeft(this.getDvtContext());

  switch (textAlign) {
    case 'center':
    case 'right':
    case 'left':
      break;

    case 'end':
      textAlign = rtl ? 'left' : 'right';
      break;

    case 'start':
    default:
      textAlign = rtl ? 'right' : 'left';
      break;
  }

  return textAlign;
};

DvtAfOutputText.prototype.getTooltip = function() {
  var tt = DvtAfOutputText.superclass.getTooltip.call(this);
  if (!tt) {
    var shape = this.getContentShape();
    if (shape) {
      if (shape.isTruncated() || this._isTruncationForced()) {
        return this.getValue();
      }
    }
  }
  return tt;
};

/**
 * Returns the length at which the text should automatically begin truncating (subject to af:outputText rules)
 *
 * @return {number}
 * @private
 */
DvtAfOutputText.prototype._getMaximumCharacters = function() {
  var untruncatedTextString = this.getValue();
  var truncateAt = this.getTruncateAt();
  if (untruncatedTextString && truncateAt) {
    // af:outputText tagdoc indicates that it won't truncate strings shorter than fifteen characters (
    return Math.max(15, truncateAt);
  }
  return 0; // not forcing truncation
};

/**
 * Indicates whether or not truncation is being forced by the truncateAt attribute
 *
 * @return {boolean}
 * @private
 */
DvtAfOutputText.prototype._isTruncationForced = function() {
  var maxChars = this._getMaximumCharacters();
  if (maxChars) {
    var untruncatedTextString = this.getValue();
    if (untruncatedTextString) {
      return untruncatedTextString.length > maxChars;
    }
  }
  return false;
};

DvtAfOutputText.prototype.getTagName = function() {
  return DvtAfOutputText.TAG_NAME;
};


//---------------------------------------------------------------------//
// Accessibility Support                                               //
//---------------------------------------------------------------------//
/**
 * @override
*/
DvtAfOutputText.prototype.registerAsTabStop = function() {
  this.getAfContext().registerTabStop(this);
};


/**
 * @override
 */
DvtAfOutputText.prototype.getAriaLabel = function() {
  var desc = this.getShortDesc();
  if (!desc)
    desc = this.getValue();
  return desc;
};


/**
 * @override
 */
DvtAfOutputText.prototype.getAriaRole = function() {
  return 'group';
};
/**
 * @constructor
 * DvtAfOutputFormatted
 *
outputFormatted supports the following HTML markup:
    * <br>
    * <hr>
    * <li>, <ol>, <ul>
    * <p>
    * <b>
    * <i>
    * <tt>
    * <big>
    * <small>
    * <pre>
    * <span>
    * <a>

and the following entities:
    * &lt;
    * &gt;
    * &amp;
    * &reg;
    * &copy;
    * &nbsp;
    * &quot;
    *
 */
var DvtAfOutputFormatted = function() {
  this.Init();
};

/*
 * make DvtAfOutputFormatted a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfOutputFormatted, DvtAfComponent, 'DvtAfOutputFormatted');

/*
 * Register the AfOutputFormatted tag with DvtAfComponentFactory
 */
DvtAfOutputFormatted.TAG_NAME = 'otf';
DvtAfComponentFactory.registerComponent(DvtAfOutputFormatted.TAG_NAME, DvtAfOutputFormatted);


// AfOutputFormatted Attributes
DvtAfOutputFormatted.ATTR_VALUE = 'value';


/*-------------------------------------------------------------------------*/
/*   AfComponent attributes                                                */
/*-------------------------------------------------------------------------*/
DvtAfOutputFormatted.prototype.setValue = function(value) {
  this.setProperty(DvtAfOutputFormatted.ATTR_VALUE, value);

  if (this.getContentShape()) {
    this.getContentShape().setText(value);
  }
};

DvtAfOutputFormatted.prototype.getValue = function() {
  return this.getProperty(DvtAfOutputFormatted.ATTR_VALUE);
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfOutputFormatted.prototype.GetDefaultStyles = function() {
  return DvtAfOutputFormatted._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfOutputFormatted.prototype.SetDefaultStyles = function(styleList) {
  DvtAfOutputFormatted._afStyles = styleList;
};


/*-------------------------------------------------------------------------*/
/*   Create Content Shape                                                  */
/*-------------------------------------------------------------------------*/
DvtAfOutputFormatted.prototype.createContentShape = function(dvtContext) {
  var id = this._getUniqueId();
  var textShape = new DvtTextFormatted(dvtContext, 0, 0, id);

  var cssStyle = this.createTextStyles(null, null);
  if (cssStyle) {
    textShape.setCSSStyle(cssStyle);
  }

  textShape.setText(this.getValue());

  return textShape;
};


DvtAfOutputFormatted.prototype.renderSelfBeforeChildren = function() {
  DvtAfOutputFormatted.superclass.renderSelfBeforeChildren.call(this);

  var shape = this.getContentShape();

  // set max width
  shape.setMaxWidth(this._cw);
  shape.setX(this.getCX());
  shape.setY(this.getCY());

  var dim = shape.getCachedDims();

  //Bug 13817011 - <AF:OUTPUTFORMATTED> WITHIN A <DVT:NODE> OVERFLOWS/CHANGES NODE SIZE
  // add clip path if needed
  this._addClipPathIfNeeded(this.getAfContext(), this.getCX(), this.getCY(),
      this._aw, dim.w, this._ah, dim.h, shape);

  this._cw = this.getCalcWidth(dim.w);
  this._ch = this.getCalcHeight(dim.h);
};


DvtAfOutputFormatted.prototype.getTagName = function() {
  return DvtAfOutputFormatted.TAG_NAME;
};

//---------------------------------------------------------------------//
// Accessibility Support                                               //
//---------------------------------------------------------------------//
/**
 * @override
 */
DvtAfOutputFormatted.prototype.registerAsTabStop = function() {
  this.getAfContext().registerTabStop(this);
};


/**
 * @override
 */
DvtAfOutputFormatted.prototype.getAriaLabel = function() {
  var desc = this.getShortDesc();
  if (!desc)
    desc = this.getValue();
  return desc;
};


/**
 * @override
 */
DvtAfOutputFormatted.prototype.getAriaRole = function() {
  return 'group';
};


/**
 * @constructor
 * DvtAfPanelGroupLayout
 * Available client size
 *  _acw
 *  _ach
 *
 */
var DvtAfPanelGroupLayout = function() {
  this.Init();
};


/*
 * make DvtAfPanelGroupLayout a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfPanelGroupLayout, DvtAfComponent, 'DvtAfPanelGroupLayout');

/*
 * Register the AfImage tag with DvtAfComponentFactory
 */
DvtAfPanelGroupLayout.TAG_NAME = 'pgl';
DvtAfComponentFactory.registerComponent(DvtAfPanelGroupLayout.TAG_NAME, DvtAfPanelGroupLayout);

// AfPanelGroupLayout Attributes
DvtAfPanelGroupLayout.ATTR_LAYOUT = 'layout';
DvtAfPanelGroupLayout.ATTR_VALIGN = 'valign';
DvtAfPanelGroupLayout.ATTR_HALIGN = 'halign';


DvtAfPanelGroupLayout.LAYOUT_VERTICAL = 'vertical';
DvtAfPanelGroupLayout.LAYOUT_HORIZONTAL = 'horizontal';
DvtAfPanelGroupLayout.LAYOUT_SCROLL = 'scroll';



/*-------------------------------------------------------------------------*/
/*   AfComponent attributes                                                */
/*-------------------------------------------------------------------------*/
DvtAfPanelGroupLayout.prototype.getLayout = function() {
  return this.getStringProp(DvtAfPanelGroupLayout.ATTR_LAYOUT,
                            DvtAfPanelGroupLayout.LAYOUT_HORIZONTAL);
};

DvtAfPanelGroupLayout.prototype.setLayout = function(layout) {
  this.setProperty(DvtAfPanelGroupLayout.ATTR_LAYOUT, layout);
};

DvtAfPanelGroupLayout.prototype.getHAlign = function() {
  return this.getStringProp(DvtAfPanelGroupLayout.ATTR_HALIGN,
                            DvtAfComponent.HALIGN_START);
};

DvtAfPanelGroupLayout.prototype.setHAlign = function(hAlign) {
  this.setProperty(DvtAfPanelGroupLayout.ATTR_HALIGN, hAlign);
};

DvtAfPanelGroupLayout.prototype.getVAlign = function() {
  return this.getStringProp(DvtAfPanelGroupLayout.ATTR_VALIGN,
                            DvtAfComponent.VALIGN_TOP);
};

DvtAfPanelGroupLayout.prototype.setVAlign = function(vAlign) {
  this.setProperty(DvtAfPanelGroupLayout.ATTR_VALIGN, vAlign);
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfPanelGroupLayout.prototype.GetDefaultStyles = function() {
  return DvtAfPanelGroupLayout._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfPanelGroupLayout.prototype.SetDefaultStyles = function(styleList) {
  DvtAfPanelGroupLayout._afStyles = styleList;
};


/**
 * @override
 */
DvtAfPanelGroupLayout.prototype.createDisplayObj = function(afContext) {
  var dispObj = DvtAfPanelGroupLayout.superclass.createDisplayObj.call(this, afContext);

  this.addChildDisplayObjs(afContext, this._contentPane);

  return dispObj;
};


/*-------------------------------------------------------------------------*/
/*   Create Content Shape                                                  */
/*-------------------------------------------------------------------------*/
DvtAfPanelGroupLayout.prototype.createContentShape = function(dvtContext) {
  this._contentPane = new DvtRect(dvtContext, 0, 0, 0, 0, this._getUniqueId());

  // give the rect a transparent fill rather than fill="none" by default so that we get mouse events
  this._contentPane.setInvisibleFill();

  var style = this.getCSSStyle();
  this._contentPane.setCSSStyle(style);

  return this._contentPane;
};


/**
 * Get the content pane where AfComponent children of this
 * AfComponent will be added.
 * In most cases the content pane will be this AfComponent itself,
 * but in AfPanelGroupLayout it is a separate sprite.
 *
 * @return the shape containing AfComponent children of this component
 *
 */
DvtAfPanelGroupLayout.prototype.getContentShape = function() {
  return this._contentPane;
};


/*---------------------------------------------------------------------*/
/*   Create background Shape                                           */
/*---------------------------------------------------------------------*/
DvtAfPanelGroupLayout.prototype.createBackgroundShape = function(dvtContext, shape) {
  return shape;
};


DvtAfPanelGroupLayout.prototype.renderSelfBeforeChildren = function() {
  DvtAfPanelGroupLayout.superclass.renderSelfBeforeChildren.call(this);

  //whole client area is available to children, but will
  //be reduced as children are rendered
  this._acw = this._cw;
  this._ach = this._ch;

};

DvtAfPanelGroupLayout.prototype.renderChild = function(child) {
  if (child._render) {
    child._render(this._acw, this._ach);
  }
  else if (child.render) {
    //Performance: using the same af context during rendering
    //so we have a list of dimensions for all text objects
    DvtAfComponent._renderComp(this.getAfContext(), child, this._acw, this._ach);
  }

  var dim = DvtAfComponent.getDimensions(child);

  //adjust the remaining size of the client area available to
  //children based on the size of the child just rendered
  var bVerticalLayout = (this.getLayout() == DvtAfPanelGroupLayout.LAYOUT_VERTICAL);
  if (bVerticalLayout) {
    if (dim.h !== Number.MAX_VALUE)
      this._ach -= dim.h;
  }
  else {
    if (dim.w !== Number.MAX_VALUE)
      this._acw -= dim.w;
  }
};


/**
 * Perform layout of this display object.
 * @override
 */
DvtAfPanelGroupLayout.prototype.doLayout = function() {
  if (this.getLayout() == DvtAfPanelGroupLayout.LAYOUT_VERTICAL) {
    DvtAfComponentUtils.doVerticalLayout(this.getAfContext(), this);
  }
  else {
    DvtAfComponentUtils.doHorizontalLayout(this.getAfContext(), this);
  }
};



DvtAfPanelGroupLayout.prototype.getTagName = function() {
  return DvtAfPanelGroupLayout.TAG_NAME;
};

/**
 * @constructor
 * DvtAfPanelFormLayout
 * Available client size
 *  _acw
 *  _ach
 *
 */
var DvtAfPanelFormLayout = function() {
  this.Init();
};


/*
 * make DvtAfPanelFormLayout a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfPanelFormLayout, DvtAfComponent, 'DvtAfPanelFormLayout');

/*
 * Register the AfPanelFormLayout tag with DvtAfComponentFactory
 */
DvtAfPanelFormLayout.TAG_NAME = 'pfl';
DvtAfComponentFactory.registerComponent(DvtAfPanelFormLayout.TAG_NAME, DvtAfPanelFormLayout);

// AfPanelFormLayout Attributes



/*-------------------------------------------------------------------------*/
/*   AfComponent attributes                                                */
/*-------------------------------------------------------------------------*/


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfPanelFormLayout.prototype.GetDefaultStyles = function() {
  return DvtAfPanelFormLayout._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfPanelFormLayout.prototype.SetDefaultStyles = function(styleList) {
  DvtAfPanelFormLayout._afStyles = styleList;
};


//Note: this method doesn't clone the style, caller must clone if modify
DvtAfPanelFormLayout.prototype._getContentCellStyle = function() {
  if (DvtAfPanelFormLayout._afStyles.length > 1)
    return DvtAfPanelFormLayout._afStyles[1];

  return DvtAfPanelFormLayout._afStyles[0];
};


//Note: this method doesn't clone the style, caller must clone if modify
DvtAfPanelFormLayout.prototype._getLabelCellStyle = function() {
  if (DvtAfPanelFormLayout._afStyles.length > 2)
    return DvtAfPanelFormLayout._afStyles[2];

  return DvtAfPanelFormLayout._afStyles[0];
};



/*-------------------------------------------------------------------------*/
/*   CreateDisplayObject                                                   */
/*-------------------------------------------------------------------------*/
DvtAfPanelFormLayout.prototype.createDisplayObj = function(afContext) {
  var dispObj = DvtAfPanelFormLayout.superclass.createDisplayObj.call(this, afContext);

  this.addChildDisplayObjs(afContext, this._contentPane);

  return dispObj;
};


/*-------------------------------------------------------------------------*/
/*   Create Content Shape                                                  */
/*-------------------------------------------------------------------------*/
DvtAfPanelFormLayout.prototype.createContentShape = function(dvtContext) {
  this._contentPane = new DvtRect(dvtContext, 0, 0, 0, 0, this._getUniqueId() + '_cp');
  this._contentPane.setFill(null);
  var style = this.getCSSStyle();
  this._contentPane.setCSSStyle(style);

  return this._contentPane;
};


/**
 * Get the content pane where AfComponent children of this
 * AfComponent will be added.
 * In most cases the content pane will be this AfComponent itself,
 * but in AfPanelFormLayout it is a separate sprite.
 *
 * @return the shape containing AfComponent children of this component
 *
 */
DvtAfPanelFormLayout.prototype.getContentShape = function() {
  return this._contentPane;
};


DvtAfPanelFormLayout.prototype.renderSelfBeforeChildren = function() {
  DvtAfPanelFormLayout.superclass.renderSelfBeforeChildren.call(this);

  //whole client area is available to children, but will
  //be reduced as children are rendered
  this._acw = this._cw;
  this._ach = this._ch;

};


/**
 * @override
 * Override to determine child panelLabelAndMessage with
 * longest label, for layout and rendering purposes.
 */
DvtAfPanelFormLayout.prototype.renderChildren = function() {
  var child;
  var maxLabelWidth = 0;
  var cnt = this.getNumChildren();

  for (var i = 0; i < cnt; i++) {
    child = this.getChildAt(i);

    //figure out the longest label, so that we can render the
    //other panelLabelAndMessage children with reduced widths
    //in anticipation of them being shifted over to align
    //with the longest label
    if (child && child instanceof DvtAfPanelLabelAndMessage) {
      child.MergeUnderLabelStyle(this._getLabelCellStyle());
      child.MergeUnderContentStyle(this._getContentCellStyle());

      var dim = child.getLabelDimensions();
      maxLabelWidth = Math.max(dim.w, maxLabelWidth);
    }
  }

  this._maxLabelWidth = maxLabelWidth;

  DvtAfPanelFormLayout.superclass.renderChildren.call(this);
};


/**
 * @override
 */
DvtAfPanelFormLayout.prototype.renderChild = function(child) {

  //reduce the width available to children panelLabelAndMessages based
  //on the label width and the longest label width in anticipation of them
  //being shifted over to align with the longest label
  var labelWidthDiff = 0;

  var labelStyle = this._getContentCellStyle();
  var dim;

  if (child instanceof DvtAfPanelLabelAndMessage) {
    dim = child.getLabelDimensions();
    labelWidthDiff = this._maxLabelWidth - dim.w;

    if (child._getLabelStyle())
      labelStyle = child._getLabelStyle();

    child._setMaxLabelWidth(this._maxLabelWidth);
  }

  var paddingTop = labelStyle.getPadding(DvtCSSStyle.PADDING_TOP);
  var paddingLeft = labelStyle.getPadding(DvtCSSStyle.PADDING_LEFT);

  //BUG 14098688 - avoid duplicate subtraction of paddingRight - it is taken into consideration in DvtAfPanelLabelAndMessage class itself
  var paddingRight = 0;
  if (!(child instanceof DvtAfPanelLabelAndMessage)) {
    paddingRight = labelStyle.getPadding(DvtCSSStyle.PADDING_RIGHT);
  }

  var paddingBottom = labelStyle.getPadding(DvtCSSStyle.PADDING_BOTTOM);

  var ww = this._acw - labelWidthDiff - paddingLeft - paddingRight;
  if (child._render) {
    child._render(ww, this._ach);
  }
  else if (child.render) {
    //Performance: using the same af context during rendering
    //so we have a list of dimensions for all text objects
    DvtAfComponent._renderComp(this.getAfContext(), child, ww, this._ach);
  }

  //adjust the remaining size of the client area available to
  //children based on the size of the child just rendered
  dim = DvtAfComponent.getDimensions(child);
  this._ach -= dim.h - paddingTop - paddingBottom;
};


/**
 * Perform layout of this display object.
 * @override
 */
DvtAfPanelFormLayout.prototype.doLayout = function() {
  var dvtContext = this.getDvtContext();
  var arDim = [];
  var cnt = this.getNumChildren();
  var child;
  var contentX = 0;
  var maxContentX = 0;

  //for BiDi, make first pass at layout as if it was L2R, and then at end make second pass
  //to adjust for R2L
  for (var i = 0; i < cnt; i++) {
    child = this.getChildAt(i);

    if (! child.renderMe || child.renderMe()) {
      //Bug 14532617 - HTML5: PFL: CURRX UNDEFINED ERROR
      var dim = DvtAfComponent.getDimensions(child);
      arDim.push(dim);
      if (child instanceof DvtAfPanelLabelAndMessage) {
        maxContentX = Math.max(maxContentX, child._getContentX());
      }
    }
  }

  var labelStyle;
  var maxContentExtent = 0;
  var paddingTop = 0;
  var paddingBottom = 0;
  var paddingLR = 0;
  var dim;
  var currX = this.getCX();
  var currY = this.getCY();
  var childx;
  var childy;
  var textAlignEnd = false;

  for (var i = 0; i < cnt; i++) {
    child = this.getChildAt(i);
    labelStyle = this._getContentCellStyle();
    dim = arDim[i];

    if (child instanceof DvtAfPanelLabelAndMessage) {
      if (child._getLabelStyle()) {
        labelStyle = child._getLabelStyle();
      }
      if (labelStyle) {
        paddingTop = labelStyle.getPadding(DvtCSSStyle.PADDING_TOP);
        paddingBottom = labelStyle.getPadding(DvtCSSStyle.PADDING_BOTTOM);
        textAlignEnd = labelStyle.isTextAlignEnd(dvtContext);

        //for R2L locale, pad right side of label
        //for L2R locale, pad left side of label
        paddingLR = DvtAgent.isRightToLeft(dvtContext) ? labelStyle.getPadding(DvtCSSStyle.PADDING_RIGHT) :
                                                  labelStyle.getPadding(DvtCSSStyle.PADDING_LEFT);
      }

      childx = contentX + paddingLR;
      if (textAlignEnd) {
        childx += (maxContentX - child._getContentX());
      }

      childy = currY + paddingTop;
      currY += dim.h + paddingBottom;

      //calculate max coord of right side of content
      if (childx + dim.w > maxContentExtent)
        maxContentExtent = childx + dim.w;

      // set group translate x and y
      DvtAfComponent._setTranslateGroup(child, childx, childy);
    }
    else if (child instanceof DvtAfComponent) {
      childx = currX + paddingLR + (DvtAgent.isRightToLeft(dvtContext) ? this._maxLabelWidth : 0);

      childy = currY + paddingTop;

      currY += dim.h + paddingBottom;

      //calculate max coord of right side of content
      if (childx + dim.w > maxContentExtent)
        maxContentExtent = childx + dim.w;

      // set group translate x and y
      DvtAfComponent._setTranslateGroup(child, childx, childy);
    }
    dim.x = childx;
  }

  //re-layout for right-to-left locale
  if (DvtAgent.isRightToLeft(dvtContext)) {
    //if an explicit width is set, or if the content is wider than the client width,
    //then start laying out at right side of client area
    //Bug 14822046 - BIDI: NODEPARTS DEMO VERY MISALIGNED IN ARABIC
    if ((this._ew && this._ew !== Number.MAX_VALUE) ||
        maxContentExtent > this.getCX() + this._cw) {
      contentX = this.getCX() + this._cw;
    }
    //otherwise, start laying out at right side of content width
    else {
      contentX = maxContentExtent;
    }
    for (var i = 0; i < cnt; i++) {
      child = this.getChildAt(i);

      if (! child.renderMe || child.renderMe()) {
        dim = arDim[i];
        //content is currently laid out as if locale were L2R, so we can just
        //take the offsets for the left side of the content from the left edge
        //of the panelFormLayout and set them as the offsets for the right side
        //of the content from the right edge of the panelFormLayout for BiDi
        childx = contentX - (dim.x - this.getCX()) - dim.w;

        child.setTranslateX(childx);
      }
    }
  }

  dim = this.getContentShape().getDimensions();
  this._cw = this.getCalcWidth(dim.w);
  this._ch = this.getCalcHeight(dim.h);

};


/**
 * @override
 */
DvtAfPanelFormLayout.prototype.ResolveEm = function(cssStyle) {
  DvtAfPanelFormLayout.superclass.ResolveEm.call(this, cssStyle);

  this._cssStyle = cssStyle;

  if (! this._contentCellStyle) {
    this._contentCellStyle = DvtAfPanelFormLayout._afStyles[1].clone();
  }
  this.resolveEmUnit(this._contentCellStyle, this);

  if (! this._labelCellStyle) {
    this._labelCellStyle = DvtAfPanelFormLayout._afStyles[2].clone();
  }
  this.resolveEmUnit(this._labelCellStyle, this);
};



DvtAfPanelFormLayout.prototype.getTagName = function() {
  return DvtAfPanelFormLayout.TAG_NAME;
};


/**
 * @constructor
 * DvtAfPanelLabelAndMessage
 * Available client size
 *  _acw
 *  _ach
 *
 */
var DvtAfPanelLabelAndMessage = function() {
  this.Init();
};

/*
 * make DvtAfPanelLabelAndMessage a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfPanelLabelAndMessage, DvtAfComponent, 'DvtAfPanelLabelAndMessage');

/*
 * Register the AfPanelLabelAndMessage tag with DvtAfComponentFactory
 */
DvtAfPanelLabelAndMessage.TAG_NAME = 'plm';
DvtAfComponentFactory.registerComponent(DvtAfPanelLabelAndMessage.TAG_NAME, DvtAfPanelLabelAndMessage);

// AfPanelLabelAndMessage Attributes
DvtAfPanelLabelAndMessage.ATTR_LABEL = 'label';
DvtAfPanelLabelAndMessage.ATTR_LABEL_STYLE = 'labelStyle';


DvtAfPanelLabelAndMessage._HPADDING = 5;


/*-------------------------------------------------------------------------*/
/*   AfComponent attributes                                                */
/*-------------------------------------------------------------------------*/
DvtAfPanelLabelAndMessage.prototype.getLabel = function() {
  return this.getStringProp(DvtAfPanelLabelAndMessage.ATTR_LABEL);
};

DvtAfPanelLabelAndMessage.prototype.setLabel = function(label) {
  this.setProperty(DvtAfPanelLabelAndMessage.ATTR_LABEL, label);
};


/**
 * Get the inline styles for the label portion of the component.
 * @return {string} label style
 */
DvtAfPanelLabelAndMessage.prototype.getLabelStyle = function() {
  return this.getStringProp(DvtAfPanelLabelAndMessage.ATTR_LABEL_STYLE);
};


/**
 * Set the inline styles for the label portion of the component.
 * @param {string} labelStyle
 */
DvtAfPanelLabelAndMessage.prototype.setLabelStyle = function(labelStyle) {
  // get the default label style
  var labelCSSStyle = this._getDefaultLabelCSSStyle().clone();

  // set label style on top
  labelCSSStyle.parseInlineStyle(labelStyle);

  // set the label css style
  this._setLabelStyle(labelCSSStyle);

  //TODO: save labelStyle or labelCSSStyle.toString()?
  this.setProperty(DvtAfPanelLabelAndMessage.ATTR_LABEL_STYLE, labelCSSStyle.toString());
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfPanelLabelAndMessage.prototype.GetDefaultStyles = function() {
  return DvtAfPanelLabelAndMessage._afStyles;
};


/**
 * @private
 * @param {array} styleList is an array of DvtCSSStyle
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfPanelLabelAndMessage.prototype.SetDefaultStyles = function(styleList) {
  DvtAfPanelLabelAndMessage._afStyles = styleList;

  //label style: styleList[1]
  //content cell style: styleList[2]
};



/*-------------------------------------------------------------------------*/
/*   CreateDisplayObject                                                   */
/*-------------------------------------------------------------------------*/
DvtAfPanelLabelAndMessage.prototype.createDisplayObj = function(afContext) {
  var dispObj = DvtAfPanelLabelAndMessage.superclass.createDisplayObj.call(this, afContext);

  this.addChildDisplayObjs(afContext, this._contentPane);

  return dispObj;
};


/*-------------------------------------------------------------------------*/
/*   Create Content Shape                                                  */
/*-------------------------------------------------------------------------*/
DvtAfPanelLabelAndMessage.prototype.createContentShape = function(dvtContext) {
  this._contentPane = new DvtRect(dvtContext, 0, 0, 0, 0, this._getUniqueId() + '_cp');
  this._contentPane.setFill(null);
  this._maxLabelWidth = 0;
  this._contentX = 0;

  var style = this.getCSSStyle();
  this._contentPane.setCSSStyle(style);

  var label = this.getLabel();
  if (label) {
    // create just a DvtText instead
    var labelStyle = this._getLabelStyle();
    //can label and PLAM have the same id?
    this._labelField = this.createTextShape(false, label, labelStyle,
                                            this._getDefaultLabelCSSStyle());
    this._contentPane.addChild(this._labelField);
  }

  return this._contentPane;
};


/**
 * Get the content pane where AfComponent children of this
 * AfComponent will be added.
 * In most cases the content pane will be this AfComponent itself,
 * but in AfPanelLabelAndMessage it is a separate sprite.
 *
 * @return the shape containing AfComponent children of this component
 *
 */
DvtAfPanelLabelAndMessage.prototype.getContentShape = function() {
  return this._contentPane;
};

// return label's displayable (text shape)
DvtAfPanelLabelAndMessage.prototype._getLabelField = function() {
  return this._labelField;
};


//see DvtStyleUtils x15
DvtAfPanelLabelAndMessage.prototype._getDefaultLabelCSSStyle = function() {
  if (DvtAfPanelLabelAndMessage._afStyles.length > 1) {
    return DvtAfPanelLabelAndMessage._afStyles[1];
  }
  // should never return a null
  return null;
};


// Similiar to getLabelStyle but returns a DvtCSSStyle instead of a String
DvtAfPanelLabelAndMessage.prototype._getLabelStyle = function() {
  if (! this._labelStyle) {
    var style = this._getDefaultLabelCSSStyle().clone();

    // merge label styleClass
    var scss = DvtAfStyleUtils.getPLAMLabelStyle(this.getStyleClass());
    if (scss) {
      style.merge(scss);
    }
    var inlineStyle = this.getLabelStyle();
    if (inlineStyle) {
      style.parseInlineStyle(inlineStyle);
    }
    this._labelStyle = style;
  }

  return this._labelStyle;
};

// Similiar to setLabelStyle but pass in a DvtCSSStyle instead of a String
DvtAfPanelLabelAndMessage.prototype._setLabelStyle = function(labelStyle) {
  this._labelStyle = labelStyle;
};


DvtAfPanelLabelAndMessage.prototype._getContentCellStyle = function() {
  return this._contentCellStyle;
};


// af contentCellStyle + cssStyle
DvtAfPanelLabelAndMessage.prototype._getContentStyle = function() {
  if (! this._contentStyle) {
    this._contentStyle = this._getContentCellStyle().clone();
    this._contentStyle.merge(this.getCSSStyle());
  }
  return this._contentStyle;
};

DvtAfPanelLabelAndMessage.prototype.MergeUnderContentStyle = function(style) {
  var contentStyle = this._getContentStyle();
  contentStyle.mergeUnder(style);
};

DvtAfPanelLabelAndMessage.prototype.MergeUnderLabelStyle = function(style) {
  var labelStyle = this._getLabelStyle();
  labelStyle.mergeUnder(style);
};


DvtAfPanelLabelAndMessage.prototype.ResolveEm = function(cssStyle) {
  DvtAfPanelLabelAndMessage.superclass.ResolveEm.call(this, cssStyle);

  this._cssStyle = cssStyle;

  if (! this._contentCellStyle) {
    this._contentCellStyle = DvtAfPanelLabelAndMessage._afStyles[2].clone();
  }
  this.resolveEmUnit(this._contentCellStyle, this);

  if (this._labelStyle != null) {
    this.resolveEmUnit(this._labelStyle, this);
  }
};

DvtAfPanelLabelAndMessage.prototype._getContentX = function() {
  //this is set during doLayout()
  return this._contentX;
};


/**
 * @private
 * @param {int} maxWidth
 */
DvtAfPanelLabelAndMessage.prototype._setMaxLabelWidth = function(maxWidth) {
  //this is set during doLayout() of panelFormLayout
  this._maxLabelWidth = maxWidth;
};


/**
 * Calculate the width of the label part of the component.
 *
 * @return width of label
 */
DvtAfPanelLabelAndMessage.prototype.getLabelDimensions = function() {
  //this function should draw the label the same
  //as renderSelfBeforeChildren() to calculate the
  //width, but without rendering to the display
  if (! this._labelDim) {
    var label = this._getLabelField();
    this._labelDim = label ? label.getDimensions() : new DvtRectangle(0, 0, 0, 0);
  }

  return this._labelDim;
};


DvtAfPanelLabelAndMessage.prototype.renderSelfBeforeChildren = function() {
  DvtAfPanelLabelAndMessage.superclass.renderSelfBeforeChildren.call(this);

  //whole client area is available to children, but will
  //be reduced as children are rendered
  this._acw = this._cw;
  this._ach = this._ch;

  // add label
  var labelField = this._getLabelField();

  //Bug 15864408 - HTML5: HV IS NOT RENDERED PROPERLY
  //panelLabelAndMessage with an empty label
  if (labelField) {
    labelField.setX(this.getCX());
    labelField.setY(this.getCY());

    DvtTextUtils.fitText(labelField, this._acw, this._ach, labelField.getParent());
    var labelDim = this.getLabelDimensions();

    // if label text is truncated
    if (labelField.isTruncated()) {
      labelDim.w = this._acw;
    }
    this._acw -= (labelDim.w + this._getLabelPadding());
  }
};

DvtAfPanelLabelAndMessage.prototype.renderChild = function(child) {
  if (child._render) {

    child._render(this._acw, this._ach);
  }
  else if (child.render) {
    //Performance: using the same af context during rendering
    //so we have a list of dimensions for all text objects
    DvtAfComponent._renderComp(this.getAfContext(), child, this._acw, this._ach);
  }

  var dim = DvtAfComponent.getDimensions(child);

  //adjust the remaining size of the client area available to
  //children based on the size of the child just rendered
  this._acw -= dim.w;

};


/**
 * Perform layout of this display object.
 * @override
 */
DvtAfPanelLabelAndMessage.prototype.doLayout = function() {

  var afRoot = this;
  var cnt = afRoot.getNumChildren();

  var ww = this._cw;
  var hh = this._ch;
  var parent = this.getParent();

  //TODO: parent's client width and height??
  if (parent instanceof DvtAfPanelFormLayout) {
    ww = parent.getCalcWidth(parent._cw);
    hh = parent.getCalcHeight(parent._ch);
  }

  var child;
  var arDim = [];
  var lbDim = this.getLabelDimensions();
  var maxChildHeight = lbDim.h;
  var contentWidth = 0;

  for (var i = 0; i < cnt; i++) {
    child = afRoot.getChildAt(i);

    if (! child.renderMe || child.renderMe()) {
      var dim = DvtAfComponent.getDimensions(child);

      //Bug 13842171 - CLIPPING SHOULD BE DONE BY THE PARENT CONTAINER
      if (child.getClipped() ||
          (contentWidth + dim.w) > (ww + DvtMath.TOLERANCE) ||
          dim.h > (hh + DvtMath.TOLERANCE)) {

        if (ww) {
          child.setClipContainer(afRoot);
        }
        if (contentWidth + dim.w > ww) {
          contentWidth = ww;
          dim.w = ww - contentWidth;
        }
        else {
          contentWidth += dim.w;
        }
        if (dim.h > hh) {
          maxChildHeight = hh;
          dim.h = hh;
        }
        else {
          maxChildHeight = Math.max(maxChildHeight, dim.h);
        }
      }
      else {
        maxChildHeight = Math.max(maxChildHeight, dim.h);
        contentWidth += dim.w;
      }
      arDim.push(dim);
    }
  }

  //   var afRootDim = DvtAfComponentUtils._calcHContentSize(this.getAfContext(), afRoot, arDim);
  //   afRootDim.h = Math.max(afRootDim.h, lbDim.h);
  //   var maxChildHeight = this.getCalcHeight(afRootDim.h);

  var vAlign = this.getStyle(DvtCSSStyle.VERTICAL_ALIGN);
  if (! vAlign) {
    vAlign = DvtAfComponent.VALIGN_TOP;
  }

  var contentX = this.getCX();
  var contentY = this.getCY();
  var childx;
  var childy;

  //BiDi: need to calculate labelWidth based on textAlign and reading direction
  var labelStyle = this._getLabelStyle();
  var labelWidth = labelStyle.isTextAlignEnd(this.getDvtContext()) ? lbDim.w : this._maxLabelWidth;

  this._contentX = contentX + labelWidth + this._getLabelPadding();
  //begin currX
  var currX = this._contentX;

  //need to setCX or labels of multi plms won't align correctly
  this.setCX(currX);

  //for BiDi, make first pass at layout as if it was L2R, and then at end make second pass
  //to swap order of label and contents
  for (var i = 0; i < cnt; i++) {
    if (! arDim[i])
      continue;

    child = afRoot.getChildAt(i);

    if (! child.renderMe || child.renderMe()) {
      var cw = arDim[i].w;
      var ch = arDim[i].h;

      if (vAlign == DvtAfComponent.VALIGN_TOP) {
        childy = contentY;
      }
      else if (vAlign == DvtAfComponent.VALIGN_MIDDLE) {
        childy = contentY + (afRoot._ch - ch) / 2;
      }
      else if (vAlign == DvtAfComponent.VALIGN_BOTTOM) {
        childy = contentY + afRoot._ch - ch;
      }

      childx = currX;
      currX += cw;

      // set group translate x and y
      DvtAfComponent._setTranslateGroup(child, childx, childy);
    }
  }

  var labelField = this._getLabelField();

  //BiDi: re-layout for right-to-left locale
  if (DvtAgent.isRightToLeft(this.getDvtContext())) {
    //currX should now be rightmost extent of contents, so adjust left
    //by width of label to position label

    //Bug 15864408 - HTML5: HV IS NOT RENDERED PROPERLY
    if (labelField)
      labelField.setX(currX - lbDim.w);

    //set currX to be mirror of itself, so that it is offset from right side
    //instead of left side
    currX = currX + contentX - this._getContentX();

    for (var i = 0; i < cnt; i++) {
      child = this.getChildAt(i);
      if (! child.renderMe || child.renderMe()) {

        //subtract width of component first, because currX is currently
        //set to right side of component
        currX -= arDim[i].w;
        childx = currX;
      }

      child.setTranslateX(childx);
    }
  }

  //TODO: textField is padded with 2px on all 4 sides
  //Bug 15864408 - HTML5: HV IS NOT RENDERED PROPERLY
  if (labelField) {
    vAlign = labelStyle.getStyle(DvtCSSStyle.VERTICAL_ALIGN);
    if (vAlign == null) {
      vAlign = DvtAfComponent.VALIGN_MIDDLE;
    }

    if (vAlign == DvtAfComponent.VALIGN_MIDDLE) {
      labelField.setY(contentY + (maxChildHeight - lbDim.h) / 2);
    }
    else if (vAlign == DvtAfComponent.VALIGN_BOTTOM) {
      labelField.setY(contentY + maxChildHeight - lbDim.h);
    }
  }

  var dim = DvtDisplayableUtils.getDimensionsForced(this.getDvtContext(), this.getContentShape());
  this._cw = this.getCalcWidth(dim.x + dim.w);
  this._ch = this.getCalcHeight(dim.y + dim.h);

};

DvtAfPanelLabelAndMessage.prototype._getLabelPadding = function() {
  var cellStyle;
  //for right-to-left locale, use padding from the right side of the content
  if (DvtAgent.isRightToLeft(this.getDvtContext())) {
    cellStyle = this._getContentCellStyle();
  }
  //for left-to-right locale, use padding from the right side of the label
  else {
    cellStyle = this._getLabelStyle();
  }

  var paddingRight;
  if (cellStyle && cellStyle.getPadding(DvtCSSStyle.PADDING_RIGHT)) {
    paddingRight = cellStyle.getPadding(DvtCSSStyle.PADDING_RIGHT);
  }
  else {
    paddingRight = DvtAfPanelLabelAndMessage._HPADDING;
  }

  return paddingRight;
};


DvtAfPanelLabelAndMessage.prototype.getTagName = function() {
  return DvtAfPanelLabelAndMessage.TAG_NAME;
};


/**
 * @override
 */
DvtAfPanelLabelAndMessage.prototype.addClipPath = function() {
  if (this.noClipPath()) {
    var xx = 0;
    var yy = 0;

    //clipPath exclude border and padding
    var ww = this._cw;

    if (DvtAgent.isRightToLeft(this.getDvtContext()))
      ww -= (this.getLabelDimensions().w + this._getLabelPadding());

    var hh = this._ch;

    //create new container for clipPath
    var newContainer = this.CreateNewContainerForChildren();

    //clipPath exclude label field
    var child;
    var dispObj = this.getDisplayObj();

    if (dispObj != newContainer) {
      for (var i = 0; i < newContainer.getNumChildren(); i++) {
        child = newContainer.getChildAt(i);
        if (child == this._getLabelField()) {
          dispObj.addChild(child);
          break;
        }
      }
    }

    var clipPath = new DvtClipPath(this._getUniqueId() + DvtAfComponentUtils._CLIP_PATH_SUFFIX);
    clipPath.addRect(xx, yy, ww, hh);

    newContainer.setClipPath(clipPath);

    this._clipped = DvtAfComponent._CLIP_PATH;
    return true;
  }
  return false;
};


//---------------------------------------------------------------------//
// Accessibility Support                                               //
//---------------------------------------------------------------------//
/**
 * @override
 */
DvtAfPanelLabelAndMessage.prototype.registerAsTabStop = function() {
  this.getAfContext().registerTabStop(this);
};


/**
 * @override
 */
DvtAfPanelLabelAndMessage.prototype.getAriaLabel = function() {
  var desc = this.getShortDesc();
  if (!desc)
    desc = this.getLabel();
  return desc;
};


/**
 * @override
 */
DvtAfPanelLabelAndMessage.prototype.getAriaRole = function() {
  return 'group';
};
/**
 * @constructor
 * DvtAfSpacer
 */
var DvtAfSpacer = function() {
  this.Init();
};


/**
 * make DvtAfSpacer a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfSpacer, DvtAfComponent, 'DvtAfSpacer');

/*
 * Register the AfSpacer tag with DvtAfComponentFactory
 */
DvtAfSpacer.TAG_NAME = 'sp';
DvtAfComponentFactory.registerComponent(DvtAfSpacer.TAG_NAME, DvtAfSpacer);

// AfSpacer Attributes
DvtAfSpacer.ATTR_WIDTH = 'width';
DvtAfSpacer.ATTR_HEIGHT = 'height';


/*-------------------------------------------------------------------------*/
/*   AfComponent attributes                                                */
/*-------------------------------------------------------------------------*/
DvtAfSpacer.prototype.setWidth = function(width) {
  this.setProperty(DvtAfSpacer.ATTR_WIDTH, width);
};

DvtAfSpacer.prototype.getWidth = function() {
  return this.getProperty(DvtAfSpacer.ATTR_WIDTH);
};

DvtAfSpacer.prototype.setHeight = function(height) {
  this.setProperty(DvtAfSpacer.ATTR_HEIGHT, height);
};

DvtAfSpacer.prototype.getHeight = function() {
  return this.getProperty(DvtAfSpacer.ATTR_HEIGHT);
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfSpacer.prototype.GetDefaultStyles = function() {
  return DvtAfSpacer._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfSpacer.prototype.SetDefaultStyles = function(styleList) {
  DvtAfSpacer._afStyles = styleList;
};


/*-------------------------------------------------------------------------*/
/*   Create Content Shape                                                  */
/*-------------------------------------------------------------------------*/
DvtAfSpacer.prototype.createContentShape = function(dvtContext) {
  this._contentPane = new DvtRect(dvtContext, 0, 0, 1, 1);
  this._contentPane.setFill(null);
  return this._contentPane;
};


DvtAfSpacer.prototype.renderSelfBeforeChildren = function() {
  DvtAfSpacer.superclass.renderSelfBeforeChildren.call(this);
};

DvtAfSpacer.prototype.getTagName = function() {
  return DvtAfSpacer.TAG_NAME;
};


DvtAfSpacer.prototype._hasBgShape = function() {
  return false;
};
/**
 * @constructor
 * DvtAfSeparator
 */
var DvtAfSeparator = function() {
  this.Init();
};

/*
 * make DvtAfSeparator a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfSeparator, DvtAfComponent, 'DvtAfSeparator');

/*
 * Register the AfSeparator tag with DvtAfComponentFactory
 */
DvtAfSeparator.TAG_NAME = 'se';
DvtAfComponentFactory.registerComponent(DvtAfSeparator.TAG_NAME, DvtAfSeparator);


/*-------------------------------------------------------------------------*/
/*   AfComponent attributes                                                */
/*-------------------------------------------------------------------------*/
/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfSeparator.prototype.GetDefaultStyles = function() {
  return DvtAfSeparator._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfSeparator.prototype.SetDefaultStyles = function(styleList) {
  DvtAfSeparator._afStyles = styleList;
};


/*-------------------------------------------------------------------------*/
/*   Create Content Shape                                                  */
/*-------------------------------------------------------------------------*/
DvtAfSeparator.prototype.createContentShape = function(dvtContext) {
  // create a container for separator
  var id = this._getUniqueId();
  var group = new DvtContainer(dvtContext, id);

  this._line1 = new DvtLine(dvtContext, 0, 0, 1, 0, id + '_1');
  this._line2 = new DvtLine(dvtContext, 0, 1, 1, 1, id + '_2');
  this._line1.setPixelHinting(true);
  this._line2.setPixelHinting(true);

  var style = this.getCSSStyle();
  var color1 = style.getStyle(DvtCSSStyle.BORDER_TOP_COLOR);
  var color2 = style.getStyle(DvtCSSStyle.BORDER_BOTTOM_COLOR);

  if (! color1) {
    color1 = '#ADB6C7';
  }
  if (! color2) {
    color2 = '#FFFFFF';
  }
  var stroke1 = new DvtSolidStroke(color1, 1, 1);
  this._line1.setStroke(stroke1);

  var stroke2 = new DvtSolidStroke(color2, 1, 1);
  this._line2.setStroke(stroke2);

  group.addChild(this._line1);
  group.addChild(this._line2);

  return group;
};


/**
 * @override
 */
DvtAfSeparator.prototype.renderSelfBeforeChildren = function() {
  DvtAfSeparator.superclass.renderSelfBeforeChildren.call(this);

  var cy = this.getCY();
  this._line1.setY1(cy);
  this._line1.setY2(cy);

  this._line2.setY1(cy + 1);
  this._line2.setY2(cy + 1);
};


/**
 * @protected
 * Return bounding rectangle
 */
DvtAfSeparator.prototype.getBounds = function() {
  this._ch = 0;
  return DvtAfSeparator.superclass.getBounds.call(this);
};


/**
 */
DvtAfSeparator.prototype.setMaxWidth = function(w) {
  var x1 = this.getCX();
  var x2 = Math.max(0, w - x1);

  this._line1.setX1(x1);
  this._line1.setX2(x2);

  this._line2.setX1(x1);
  this._line2.setX2(x2);

};


DvtAfSeparator.prototype.getTagName = function() {
  return DvtAfSeparator.TAG_NAME;
};

DvtAfSeparator.prototype._hasBgShape = function() {
  return false;
};

/**
 * @constructor
 * DvtAfShowDetailItem
 */
var DvtAfShowDetailItem = function() {
  this.Init();
};

/*
 * make DvtAfShowDetailItem a subclass of DvtAfPanelGroupLayout
 */
DvtObj.createSubclass(DvtAfShowDetailItem, DvtAfPanelGroupLayout, 'DvtAfShowDetailItem');

/*
 * Register the AfShowDetailItem tag with DvtAfComponentFactory
 */
DvtAfShowDetailItem.TAG_NAME = 'sdi';
DvtAfComponentFactory.registerComponent(DvtAfShowDetailItem.TAG_NAME, DvtAfShowDetailItem);


// AfShowDetailItem Attributes
DvtAfShowDetailItem.ATTR_TEXT = 'text';
DvtAfShowDetailItem.ATTR_ICON = 'icon';
DvtAfShowDetailItem.ATTR_DISABLED = 'disabled';


/*-------------------------------------------------------------------------*/
/*   AfComponent attributes                                                */
/*-------------------------------------------------------------------------*/
DvtAfShowDetailItem.prototype.setText = function(text) {
  this.setProperty(DvtAfShowDetailItem.ATTR_TEXT, text);

  if (this.getContentShape()) {
    this.getContentShape().setTextString(text);
  }
};

/**
 * @export
 * Get show detail item text
 * @return {String} show detail item text
 */
DvtAfShowDetailItem.prototype.getText = function() {
  return this.getStringProp(DvtAfShowDetailItem.ATTR_TEXT, '');
};

DvtAfShowDetailItem.prototype.setIcon = function(icon) {
  this.setProperty(DvtAfShowDetailItem.ATTR_ICON, icon);
};

DvtAfShowDetailItem.prototype.getIcon = function() {
  return this.getProperty(DvtAfShowDetailItem.ATTR_ICON);
};

DvtAfShowDetailItem.prototype.isDisabled = function() {
  return this.getProperty(DvtAfShowDetailItem.ATTR_DISABLED);
};

DvtAfShowDetailItem.prototype.setDisabled = function(disabled) {
  this.setProperty(DvtAfShowDetailItem.ATTR_DISABLED, disabled);
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfShowDetailItem.prototype.GetDefaultStyles = function() {
  return DvtAfShowDetailItem._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfShowDetailItem.prototype.SetDefaultStyles = function(styleList) {
  DvtAfShowDetailItem._afStyles = styleList;
};


/*---------------------------------------------------------------------*/
/*   Create Content Shape                                              */
/*---------------------------------------------------------------------*/
DvtAfShowDetailItem.prototype.createContentShape = function(dvtContext) {
  //Initialize instance variables
  //Note: this._loaded is initialized to false if panelCard.contentDelivery = lazy
  this._loaded = true;

  this._contentPane = new DvtContainer(dvtContext, this._getUniqueId());

  var style = this.getCSSStyle();
  this._contentPane.setCSSStyle(style);

  return this._contentPane;
};

/*TODO: should add children when it is disclosed???
DvtAfShowDetailItem.prototype.addChildDisplayObjs = function(afContext, parentDO) {
  if (! this.IsLoaded())
    return;

  DvtAfShowDetailItem.superclass.addChildDisplayObjs.call(this, afContext, parentDO);
}
*/

/**TODO: should add children when it is disclosed???
 * @override

DvtAfShowDetailItem.prototype.renderSelfBeforeChildren = function() {
  //TODO: remove this method??
  if (! this.IsLoaded())
    return;

  DvtAfShowDetailItem.superclass.renderSelfBeforeChildren.call(this);
};

 */

/**
 * @override

DvtAfComponent.prototype.stampChildren = function(elcontext, parentComp) {
  return this._template = this;
};
 */

DvtAfShowDetailItem.prototype.getTagName = function() {
  return DvtAfShowDetailItem.TAG_NAME;
};

/*
 * Set whether data is already loaded
 */
DvtAfShowDetailItem.prototype.SetLoaded = function(flag) {
  this._loaded = flag;
};

/*
 * return whether data is already loaded
 */
DvtAfShowDetailItem.prototype.IsLoaded = function() {
  return this._loaded;
};

/*
 * set whether its display object is visible
 */
DvtAfShowDetailItem.prototype.SetDOVisible = function(flag) {
  if (this.getDisplayObj())
    this.getDisplayObj().setVisible(flag);
};

/*
 * return whether its display object is visible
 */
DvtAfShowDetailItem.prototype.IsDOVisible = function() {
  if (this.getDisplayObj())
    return this.getDisplayObj().getVisible();
  return false;
};


/**
 * @override
 */
DvtAfShowDetailItem.prototype.getLayout = function() {
  //Bug 16991582 - SHOWDETAILITEM INSIDE DIAGRAM/HV DOESN'T LAYOUT ITS CHIDLREN CORRECTLY
  return DvtAfPanelGroupLayout.LAYOUT_VERTICAL;
};



//---------------------------------------------------------------------//
// Accessibility Support                                               //
//---------------------------------------------------------------------//
/**
 * @override
 */
DvtAfShowDetailItem.prototype.registerAsTabStop = function() {
  this.getAfContext().registerTabStop(this);
};


/**
 * Gets WAI-ARIA label attribute
 * @return {string} WAI-ARIA label
 */
DvtAfShowDetailItem.prototype.getAriaLabel = function() {
  var parent = this.getParent();
  var desc = this.getShortDesc();
  if (parent instanceof DvtAfPanelCard) {
    var count = DvtBundle.getTranslatedString(DvtBundle.AFCOMPONENT_PREFIX, 'ARIA_LABEL_ITEM_COUNT',
        [parent.getVisibleDetailItemIndex(this.getText() || this.getIcon()) + 1, parent.getDetailItemCount()]);
    desc = desc ? desc + DvtBundle.getTranslatedString(DvtBundle.UTIL_PREFIX, 'ARIA_LABEL_DESC_DELIMITER') + count : count;
  }
  return desc;
};


/**
 * @override
 */
DvtAfShowDetailItem.prototype.getAriaRole = function() {
  return 'group';
};


/**
 * @protected
 * Creates keyboard focus effect for the component
 * @return {DvtKeyboardFocusEffect} keyboard focus effect
 */
DvtAfShowDetailItem.prototype.CreateKeyboardFocusEffect = function() {
  var dispObj = this.getParent().getDisplayObj();
  return new DvtKeyboardFocusEffect(this.getDvtContext(), dispObj,
      new DvtRectangle(dispObj.getX(), dispObj.getY(), dispObj.getWidth(), dispObj.getHeight()));
};
/**
 * A PanelCard event.
 * @param {String} subType the type of panelCard event
 * @param {map} params the subType-specific parameters for the panelCard event
 * @class
 * @constructor
 * @export
 */
var DvtPanelCardEvent = function(subType, params) {
  this.Init(DvtPanelCardEvent.TYPE);
  this._subType = subType;
  this._params = params;
};

DvtObj.createSubclass(DvtPanelCardEvent, DvtBaseComponentEvent, 'DvtPanelCardEvent');


/**
 * @export
 */
DvtPanelCardEvent.TYPE = 'dvtPanelCard';


/**
 * @export
 */
DvtPanelCardEvent.PANELCARD_INDEX_EVENT = 'indexEvent';


/**
 * @export
 */
DvtPanelCardEvent.PANELCARD_FETCH_EVENT = 'fetchEvent';


/**
 * Returns the type of panelCard event
 * @return {String} the type of panelCard event
 * @export
 */
DvtPanelCardEvent.prototype.getSubType = function() {
  return this._subType;
};


/**
 * Returns the subType-specific parameters for the panelCard event
 * @return {map} the subType-specific parameters for the panelCard event
 * @export
 */
DvtPanelCardEvent.prototype.getParams = function() {
  return this._params;
};
/*
 * DvtPanelCardButtonLAFUtils Utility class for providing LAF for PanelCard navigation buttons.
 */
var DvtPanelCardButtonLAFUtils = {
};

DvtObj.createSubclass(DvtPanelCardButtonLAFUtils, DvtObj, 'DvtPanelCardButtonLAFUtils');

DvtPanelCardButtonLAFUtils.R = 2;
DvtPanelCardButtonLAFUtils.TAN_PI_8 = Math.tan(Math.PI / 8) * DvtPanelCardButtonLAFUtils.R;
DvtPanelCardButtonLAFUtils.SIN_PI_4 = Math.sin(Math.PI / 4) * DvtPanelCardButtonLAFUtils.R;


/**
 * Create the displayObject used in the prev navigation button.
 *
 * @param state button state
 *
 * @return displayObject used in prev button
 */
DvtPanelCardButtonLAFUtils.createLeftArrowState = function(dvtContext, state, buttonStyles) {

  var s = DvtPanelCardButtonLAFUtils.buttonShape(dvtContext, state, 'la' + state, buttonStyles);
  DvtPanelCardButtonLAFUtils.make_leftarrow_Icon(dvtContext, s, state, buttonStyles);

  return s;
};


/**
 * Create the displayObject used in the next navigation button.
 *
 * @param state button state
 *
 * @return displayObject used in next button
 */
DvtPanelCardButtonLAFUtils.createRightArrowState = function(dvtContext, state, buttonStyles) {

  var s = DvtPanelCardButtonLAFUtils.buttonShape(dvtContext, state, 'ra' + state, buttonStyles);
  DvtPanelCardButtonLAFUtils.make_rightarrow_Icon(dvtContext, s, state, buttonStyles);

  return s;
};

////// FILL BUTTON //////////////////
DvtPanelCardButtonLAFUtils.ena_lineAndFill = function(t, ww, hh, xx, yy, buttonStyle) {

  var DefaultStart = '#F4F8F9';
  var DefaultMid = '#EBEFF1';
  var DefaultEnd = '#FFFFFF';

  var fillType = 'gradient';
  var borderColor = '#9BA2B0';
  var backgroundColor = DefaultStart;

  if (buttonStyle != null) {
    fillType = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle, DvtCSSStyle.FILL_TYPE, fillType);
    borderColor = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle, DvtCSSStyle.BORDER_COLOR,
                                                      borderColor);
    backgroundColor = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle,
                                                          DvtCSSStyle.BACKGROUND_COLOR,
                                                          backgroundColor);
  }

  t.setSolidStroke(borderColor);

  if (fillType == 'solid')
    t.setSolidFill(backgroundColor);

  else {
    var startColor = backgroundColor;
    var midColor = DefaultMid;
    var endColor = DefaultEnd;
    if (startColor != DefaultStart) {
      midColor = DvtColorUtils.inferColor(DefaultStart, DefaultMid, startColor);
    }
    var fill_colors = [startColor, midColor, endColor];
    var fill_alphas = [1, 1, 1];
    var fill_ratios = [40 / 255, 130 / 255, 200 / 255];

    t.setFill(new DvtLinearGradientFill(-270, //rot
                                        fill_colors,
                                        fill_alphas,
                                        fill_ratios,
                                        [xx, yy, ww, hh]));
  }
};

DvtPanelCardButtonLAFUtils.ovr_lineAndFill = function(t, ww, hh, xx, yy, buttonStyle) {
  var DefaultStart = '#7BA0D9';
  var DefaultStartTwo = '#437ACD';
  var DefaultMid = '#3474D3';
  var DefaultEnd = '#BFD8FB';

  var fillType = 'gradient';
  var borderColor = '#404451';
  var backgroundColor = DefaultStart;

  if (buttonStyle != null) {
    fillType = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle, DvtCSSStyle.FILL_TYPE, fillType);
    borderColor = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle,
                                                      DvtCSSStyle.BORDER_COLOR, borderColor);
    backgroundColor = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle, DvtCSSStyle.BACKGROUND_COLOR,
                                                          backgroundColor);
  }

  t.setSolidStroke(borderColor);

  if (fillType == 'solid')
    t.setSolidFill(backgroundColor);

  else {
    var startColor = backgroundColor;
    var startColorTwo = DefaultStartTwo;
    var midColor = DefaultMid;
    var endColor = DefaultEnd;
    if (startColor != DefaultStart) {
      startColorTwo = DvtColorUtils.inferColor(DefaultStart, DefaultStartTwo, startColor);
      midColor = DvtColorUtils.inferColor(DefaultStart, DefaultMid, startColor);
      endColor = DvtColorUtils.inferColor(DefaultStart, DefaultEnd, startColor);
    }

    var fill_colors = [startColor, startColorTwo, midColor, endColor];
    var fill_alphas = [1, 1, 1, 1];
    var fill_ratios = [0, 160 / 255, 170 / 255, 1];

    t.setFill(new DvtLinearGradientFill(-270, //rot
                                        fill_colors,
                                        fill_alphas,
                                        fill_ratios,
                                        [xx, yy, ww, hh]));

  }
};

DvtPanelCardButtonLAFUtils.dwn_lineAndFill = function(t, ww, hh, xx, yy, buttonStyle) {
  var DefaultStart = '#69849E';
  var DefaultMid = '#69849E';
  var DefaultEnd = '#3C4E5E';

  var fillType = 'gradient';
  var borderColor = '#303F47';
  var backgroundColor = DefaultStart;

  if (buttonStyle != null) {
    fillType = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle, DvtCSSStyle.FILL_TYPE, fillType);
    borderColor = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle,
                                                      DvtCSSStyle.BORDER_COLOR, borderColor);
    backgroundColor = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle,
                                                          DvtCSSStyle.BACKGROUND_COLOR,
                                                          backgroundColor);
  }

  t.setSolidStroke(borderColor);

  if (fillType == 'solid')
    t.setSolidFill(backgroundColor);

  else {
    var startColor = backgroundColor;
    var midColor = DefaultMid;
    var endColor = DefaultEnd;
    if (startColor == DefaultStart) {
      midColor = DvtColorUtils.inferColor(DefaultStart, DefaultMid, startColor);
      endColor = DvtColorUtils.inferColor(DefaultStart, DefaultEnd, startColor);
    }

    var fill_colors = [startColor, midColor, endColor];
    var fill_alphas = [1, 1, 1];
    var fill_ratios = [0, 125 / 255, 1];

    t.setFill(new DvtLinearGradientFill(-270, //rot
                                        fill_colors,
                                        fill_alphas,
                                        fill_ratios,
                                        [xx, yy, ww, hh]));
  }
};

/// fills for iconic pictogramms ////////////////
DvtPanelCardButtonLAFUtils.ena_Icon_lineAndFill = function(t, xx, yy, ww, hh, buttonStyle) {
  var DefaultStart = '#0066FF';
  var DefaultEnd = '#0066FF';

  var borderColor = '#303F47';
  var backgroundColor = DefaultStart;

  if (buttonStyle != null) {
    borderColor = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle, DvtCSSStyle.BORDER_COLOR,
                                                      borderColor);
    backgroundColor = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle, DvtCSSStyle.COLOR,
                                                      backgroundColor);
  }

  t.setSolidStroke(borderColor);

  // both colors are the same, but I might change DvtPanelCardButtonLAFUtils...
  // because both alphas and colors are the same for start and end, ignore gradient fill for now

  t.setSolidFill(backgroundColor);
};


DvtPanelCardButtonLAFUtils.ovr_Icon_lineAndFill = function(t, xx, yy, ww, hh, buttonStyle) {
  var DefaultStart = '#FFFFFF';
  var DefaultEnd = '#FFFFFF';

  var borderColor = '#303F47';
  var backgroundColor = DefaultStart;

  if (buttonStyle != null) {
    borderColor = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle, DvtCSSStyle.BORDER_COLOR,
                                                      borderColor);
    backgroundColor = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle, DvtCSSStyle.COLOR,
                                                          backgroundColor);
  }

  t.setSolidStroke(borderColor);

  // both colors are the same, but I might change DvtPanelCardButtonLAFUtils...
  // because both alphas and colors are the same for start and end, ignore gradient fill for now

  t.setSolidFill(backgroundColor);
};

DvtPanelCardButtonLAFUtils.dwn_Icon_lineAndFill = function(t, xx, yy, ww, hh, buttonStyle) {
  var DefaultStart = '#FFFFFF';
  var DefaultEnd = '#FFFFFF';
  var borderColor = '#303F47';
  var backgroundColor = DefaultStart;

  if (buttonStyle != null) {
    borderColor = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle, DvtCSSStyle.BORDER_COLOR,
                                                      borderColor);
    backgroundColor = DvtPanelCardButtonLAFUtils.getStyle(buttonStyle, DvtCSSStyle.COLOR,
                                                          backgroundColor);
  }

  t.setSolidStroke(borderColor);

  // both colors are the same, but I might change DvtPanelCardButtonLAFUtils...
  // because both alphas and colors are the same for start and end, ignore gradient fill for now

  t.setSolidFill(backgroundColor);
};


/////////////////// SATES FILL SELECTORS /////////////////////////
/*
 * buttonStyles = [CardNavButtonStyle, CardNavButtonHoverStyle, CardNavButtonActiveStyle]
 */
DvtPanelCardButtonLAFUtils.fillShape = function(st, t, ww, hh, xx, yy, buttonStyles) {
  // based on the passed variable "st" switch statement calls the right fill and line style function
  var buttonStyle;

  switch (st) {
    case DvtButton.STATE_ENABLED:
      buttonStyle = (buttonStyles ? buttonStyles[0] : null);
      DvtPanelCardButtonLAFUtils.ena_lineAndFill(t, ww, hh, xx, yy, buttonStyle);
      break;
    case DvtButton.STATE_OVER:
      buttonStyle = (buttonStyles ? buttonStyles[1] : null);
      DvtPanelCardButtonLAFUtils.ovr_lineAndFill(t, ww, hh, xx, yy, buttonStyle);
      break;
    case DvtButton.STATE_DOWN:
      buttonStyle = (buttonStyles ? buttonStyles[2] : null);
      DvtPanelCardButtonLAFUtils.dwn_lineAndFill(t, ww, hh, xx, yy, buttonStyle);
      break;
  }
};

/*
 * buttonStyles = [CardNavButtonStyle, CardNavButtonHoverStyle, CardNavButtonActiveStyle]
 */
DvtPanelCardButtonLAFUtils.fillIconShape = function(st, t, xx, yy, ww, hh, buttonStyles) {
  var buttonStyle;

  switch (st) {
    case DvtButton.STATE_ENABLED:
      buttonStyle = (buttonStyles ? buttonStyles[0] : null);
      DvtPanelCardButtonLAFUtils.ena_Icon_lineAndFill(t, xx, yy, ww, hh, buttonStyle);
      break;
    case DvtButton.STATE_OVER:
      buttonStyle = (buttonStyles ? buttonStyles[1] : null);
      DvtPanelCardButtonLAFUtils.ovr_Icon_lineAndFill(t, xx, yy, ww, hh, buttonStyle);
      break;
    case DvtButton.STATE_DOWN:
      buttonStyle = (buttonStyles ? buttonStyles[2] : null);
      DvtPanelCardButtonLAFUtils.dwn_Icon_lineAndFill(t, xx, yy, ww, hh, buttonStyle);
      break;
  }
};

///////////// DRAWING BUTTON SHAPE  //////////////

DvtPanelCardButtonLAFUtils.buttonShape = function(dvtContext, state, id, buttonStyles) {
  var r = DvtPanelCardButtonLAFUtils.R;
  var ww = 16 - (2 * r);
  var hh = 16 - (2 * r);

  var x = ww + r;
  var y = hh + r;

  var cmds = DvtPathUtils.moveTo(x + r, y);

  cmds += DvtPathUtils.quadTo(r + x, DvtPanelCardButtonLAFUtils.TAN_PI_8 + y,
                              DvtPanelCardButtonLAFUtils.SIN_PI_4 + x,
                              DvtPanelCardButtonLAFUtils.SIN_PI_4 + y);
  cmds += DvtPathUtils.quadTo(DvtPanelCardButtonLAFUtils.TAN_PI_8 + x, r + y, x, r + y);

  cmds += DvtPathUtils.lineTo(x, r + y);
  cmds += DvtPathUtils.lineTo(x - ww, r + y);
  x = x - ww;
  y = y;

  cmds += DvtPathUtils.quadTo(-DvtPanelCardButtonLAFUtils.TAN_PI_8 + x, r + y,
                              -DvtPanelCardButtonLAFUtils.SIN_PI_4 + x,
                              DvtPanelCardButtonLAFUtils.SIN_PI_4 + y);
  cmds += DvtPathUtils.quadTo(-r + x, DvtPanelCardButtonLAFUtils.TAN_PI_8 + y, -r + x, y);

  cmds += DvtPathUtils.lineTo(-r + x, y);
  cmds += DvtPathUtils.lineTo(-r + x, y - hh);
  x = x;
  y = y - hh;

  cmds += DvtPathUtils.quadTo(-r + x, -DvtPanelCardButtonLAFUtils.TAN_PI_8 + y,
                              -DvtPanelCardButtonLAFUtils.SIN_PI_4 + x,
                              -DvtPanelCardButtonLAFUtils.SIN_PI_4 + y);
  cmds += DvtPathUtils.quadTo(-DvtPanelCardButtonLAFUtils.TAN_PI_8 + x, -r + y, x, -r + y);

  cmds += DvtPathUtils.lineTo(x, -r + y);
  cmds += DvtPathUtils.lineTo(x + ww, -r + y);
  x = x + ww;
  y = y;

  cmds += DvtPathUtils.quadTo(DvtPanelCardButtonLAFUtils.TAN_PI_8 + x, -r + y,
                              DvtPanelCardButtonLAFUtils.SIN_PI_4 + x,
                              -DvtPanelCardButtonLAFUtils.SIN_PI_4 + y);
  cmds += DvtPathUtils.quadTo(r + x, -DvtPanelCardButtonLAFUtils.TAN_PI_8 + y, r + x, y);
  cmds += DvtPathUtils.closePath();

  var shape = new DvtPath(dvtContext, cmds, id);

  //line style and fill
  DvtPanelCardButtonLAFUtils.fillShape(state, shape, 16, 16, 0, 0, buttonStyles);

  return shape;
};

///////////////////// DRAWING ICON /////////////////////////////////

DvtPanelCardButtonLAFUtils.make_leftarrow_Icon = function(dvtContext, parent, st, buttonStyles) {
  var ww = 6;
  var hh = 9;

  var trh = hh * 0.6;
  var hmid = ww / 2;
  var vmid = hh / 2;
  var x = 3.85; //0;
  var y = 3.85;//0;

  var cmds = DvtPathUtils.moveTo(x, y + vmid);
  y = y + vmid;

  cmds += DvtPathUtils.lineTo(x + ww, y - vmid);
  x = x + ww;
  y = y - vmid;

  cmds += DvtPathUtils.lineTo(x, y + hh);
  y = y + hh;

  cmds += DvtPathUtils.lineTo(x - ww, y - vmid);
  cmds += DvtPathUtils.closePath();

  var shape = new DvtPath(dvtContext, cmds);

  parent.addChild(shape);
  DvtPanelCardButtonLAFUtils.fillIconShape(st, shape, x, y, ww, hh, buttonStyles);

  return parent;
};


DvtPanelCardButtonLAFUtils.make_rightarrow_Icon = function(dvtContext, parent, st, buttonStyles) {
  var ww = 6;
  var hh = 9;

  var hmid = ww / 2;
  var vmid = hh / 2;
  var x = 6.95; //0;
  var y = 3.85; //0;

  var cmds = DvtPathUtils.moveTo(x, y);
  cmds += DvtPathUtils.lineTo(x, y + hh);

  y = y + hh;

  cmds += DvtPathUtils.lineTo(x + ww, y - vmid);
  x = x + ww;
  y = y - vmid;

  cmds += DvtPathUtils.lineTo(x - ww, y - vmid);
  DvtPathUtils.closePath();

  var shape = new DvtPath(dvtContext, cmds, 'rightArrow');

  parent.addChild(shape);
  DvtPanelCardButtonLAFUtils.fillIconShape(st, shape, x, y, ww, hh, buttonStyles);

  return parent;
};

DvtPanelCardButtonLAFUtils.getStyle = function(style, key, defVal) {
  var val = style.getStyle(key);
  return (val ? val : defVal);
};

/**
 * @constructor
 * DvtAfPanelCard
 * Available client size
 *  _acw
 *  _ach
 *
 */
var DvtAfPanelCard = function() {
  this.Init();
};

/*
 * make DvtAfPanelCard a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfPanelCard, DvtAfComponent, 'DvtAfPanelCard');

/*
 * Register the AfImage tag with DvtAfComponentFactory
 */
DvtAfPanelCard.TAG_NAME = 'pc';
DvtAfComponentFactory.registerComponent(DvtAfPanelCard.TAG_NAME, DvtAfPanelCard);

// AfPanelCard Attributes
DvtAfPanelCard.ATTR_EFFECT = 'effect';
DvtAfPanelCard.ATTR_CONTENT_DELIVERY = 'contentDelivery';

// Possible values for DvtAfPanelCard.ATTR_EFFECT
DvtAfPanelCard.EFFECT_IMMEDIATE = 'immediate';
DvtAfPanelCard.EFFECT_SLIDE_HORZ = 'slideHorz';
DvtAfPanelCard.EFFECT_FLIP_HORZ = 'flipHorz';
DvtAfPanelCard.EFFECT_NODE_FLIP_HORZ = 'nodeFlipHorz';
DvtAfPanelCard.EFFECT_CUBE_ROTATE_HORZ = 'cubeRotateHorz';
DvtAfPanelCard.EFFECT_NODE_CUBE_ROTATE_HORZ = 'nodeCubeRotateHorz';

DvtAfPanelCard.DEFAULT_EFFECT = DvtAfPanelCard.EFFECT_SLIDE_HORZ;

//TODO: do we need to support these old values?
DvtAfPanelCard.OLD_EFFECT_SLIDE_HORZ = 'slide_horz';
DvtAfPanelCard.OLD_EFFECT_FLIP_HORZ = 'flip_horz';
DvtAfPanelCard.OLD_EFFECT_NODE_FLIP_HORZ = 'node_flip_horz';
DvtAfPanelCard.OLD_EFFECT_CUBE_ROTATE_HORZ = 'cube_rotate_horz';
DvtAfPanelCard.OLD_EFFECT_NODE_CUBE_ROTATE_HORZ = 'node_cube_rotate_horz';


DvtAfPanelCard.DISPLAYED_DETAIL_ITEM_INDEX_KEY = 'dispSdiIdx';

DvtAfPanelCard.POPUP_TIMER_INTERVAL = 2000; //in ms

DvtAfPanelCard.SET_PROP_EVENT = 'setProp';
DvtAfPanelCard.FETCH_DATA_EVENT = 'fetchData';

DvtAfPanelCard.BUTTON_COLOR = '#CCCCCC';
DvtAfPanelCard.BUTTON_PADDING = 0;
/**
 * Alta Padding - Horizontal
 */
DvtAfPanelCard.ALTA_BUTTON_HPADDING = 5;
/**
 * Alta Padding - Vertical
 */
DvtAfPanelCard.ALTA_BUTTON_VPADDING = 0;
DvtAfPanelCard.EFFECT_DURATION = .5;

DvtAfPanelCard.DISABLED_BACKGROUND_COLOR = '#E5E5E0';
DvtAfPanelCard.DISABLED_BORDER_COLOR = '#B9B9B4';
DvtAfPanelCard.DISABLED_COLOR = '#737373';
DvtAfPanelCard.DISABLED_ALPHA = .5;

DvtAfPanelCard.MAX_TRAIN_ITEM_COUNT = 8;

DvtAfPanelCard.POPUP_NAME = 'panelCardNavPopup';
DvtAfPanelCard.SHAPE_RECT = 'rect';
DvtAfPanelCard.SHAPE_ROUNDED_RECT = 'roundedRect';
DvtAfPanelCard.SHAPE_ELLIPSE = 'ellipse';

DvtAfPanelCard.DFLT_STYLE_INDX = 0;
DvtAfPanelCard.DFLT_NAV_STYLE_INDX = 1;
DvtAfPanelCard.DFLT_NAV_HOVER_STYLE_INDX = 2;
DvtAfPanelCard.DFLT_NAV_ACTIVE_STYLE_INDX = 3;
DvtAfPanelCard.DFLT_HEADER_ZOOM_100_STYLE_INDX = 4;
DvtAfPanelCard.DFLT_HEADER_ZOOM_75_STYLE_INDX = 5;
DvtAfPanelCard.DFLT_PREV_IMAGES_INDX = 6;
DvtAfPanelCard.DFLT_PREV_HOVER_IMAGES_INDX = 7;
DvtAfPanelCard.DFLT_PREV_ACTIVE_IMAGES_INDX = 8;
DvtAfPanelCard.DFLT_NEXT_IMAGES_INDX = 9;
DvtAfPanelCard.DFLT_NEXT_HOVER_IMAGES_INDX = 10;
DvtAfPanelCard.DFLT_NEXT_ACTIVE_IMAGES_INDX = 11;

DvtAfPanelCard.DFLT_TRAIN_STYLE_INDX = 12;
DvtAfPanelCard.DFLT_TRAIN_HOVER_STYLE_INDX = 13;
DvtAfPanelCard.DFLT_TRAIN_ACTIVE_STYLE_INDX = 14;

DvtAfPanelCard.ROUND_CORNER_SIZE = 6;


/*-------------------------------------------------------------------------*/
/*   PanelCard attributes                                                  */
/*-------------------------------------------------------------------------*/
/**
 * Convert an old effect constant to its new version.
 *
 * @param effect effect constant
 *
 * @return new version of effect constant
 */
DvtAfPanelCard.convertOldEffectToNew = function(effect) {
  if (effect == DvtAfPanelCard.OLD_EFFECT_SLIDE_HORZ)
    return DvtAfPanelCard.EFFECT_SLIDE_HORZ;
  else if (effect == DvtAfPanelCard.OLD_EFFECT_FLIP_HORZ)
    return DvtAfPanelCard.EFFECT_FLIP_HORZ;
  else if (effect == DvtAfPanelCard.OLD_EFFECT_NODE_FLIP_HORZ)
    return DvtAfPanelCard.EFFECT_NODE_FLIP_HORZ;
  else if (effect == DvtAfPanelCard.OLD_EFFECT_CUBE_ROTATE_HORZ)
    return DvtAfPanelCard.EFFECT_CUBE_ROTATE_HORZ;
  else if (effect == DvtAfPanelCard.OLD_EFFECT_NODE_CUBE_ROTATE_HORZ)
    return DvtAfPanelCard.EFFECT_NODE_CUBE_ROTATE_HORZ;
  return effect;
};

DvtAfPanelCard.prototype.getEffect = function() {
  var effect = this.getStringProp(DvtAfPanelCard.ATTR_EFFECT);
  return effect ? DvtAfPanelCard.convertOldEffectToNew(effect) : DvtAfPanelCard.DEFAULT_EFFECT;
};

DvtAfPanelCard.prototype.setEffect = function(effect) {
  this.setProperty(DvtAfPanelCard.ATTR_EFFECT, effect);
};

DvtAfPanelCard.prototype.getContentDelivery = function() {
  return this.getStringProp(DvtAfPanelCard.ATTR_CONTENT_DELIVERY);
};

DvtAfPanelCard.prototype.setContentDelivery = function(contentDelivery) {
  this.setProperty(DvtAfPanelCard.ATTR_CONTENT_DELIVERY, contentDelivery);
};

DvtAfPanelCard.prototype.getNextButtonIcon = function() {
  if (!this._nextButtonIcon)
    this._nextButtonIcon = this.getDefaultStyleAt(DvtAfPanelCard.DFLT_NEXT_IMAGES_INDX);
  return this._nextButtonIcon;
};

DvtAfPanelCard.prototype.setNextButtonIcon = function(icon) {
  this._nextButtonIcon = icon;
};

DvtAfPanelCard.prototype.getNextButtonHoverIcon = function() {
  if (!this._nextButtonHoverIcon)
    this._nextButtonHoverIcon = this.getDefaultStyleAt(DvtAfPanelCard.DFLT_NEXT_HOVER_IMAGES_INDX);
  return this._nextButtonHoverIcon;
};

DvtAfPanelCard.prototype.setNextButtonHoverIcon = function(icon) {
  this._nextButtonHoverIcon = icon;
};

DvtAfPanelCard.prototype.getNextButtonActiveIcon = function() {
  if (!this._nextButtonActiveIcon)
    this._nextButtonActiveIcon = this.getDefaultStyleAt(DvtAfPanelCard.DFLT_NEXT_ACTIVE_IMAGES_INDX);
  return this._nextButtonActiveIcon;
};

DvtAfPanelCard.prototype.setNextButtonActiveIcon = function(icon) {
  this._nextButtonActiveIcon = icon;
};

DvtAfPanelCard.prototype.getNextButtonDisabledIcon = function() {
  return this._nextButtonDisabledIcon;
};

DvtAfPanelCard.prototype.setNextButtonDisabledIcon = function(icon) {
  this._nextButtonDisabledIcon = icon;
};

DvtAfPanelCard.prototype.getPrevButtonIcon = function() {
  if (!this._prevButtonIcon)
    this._prevButtonIcon = this.getDefaultStyleAt(DvtAfPanelCard.DFLT_PREV_IMAGES_INDX);

  return this._prevButtonIcon;
};

DvtAfPanelCard.prototype.setPrevButtonIcon = function(icon) {
  this._prevButtonIcon = icon;
};

DvtAfPanelCard.prototype.getPrevButtonHoverIcon = function() {
  if (!this._prevButtonHoverIcon)
    this._prevButtonHoverIcon = this.getDefaultStyleAt(DvtAfPanelCard.DFLT_PREV_HOVER_IMAGES_INDX);
  return this._prevButtonHoverIcon;
};

DvtAfPanelCard.prototype.setPrevButtonHoverIcon = function(icon) {
  this._prevButtonHoverIcon = icon;
};

DvtAfPanelCard.prototype.getPrevButtonActiveIcon = function() {
  if (!this._prevButtonActiveIcon)
    this._prevButtonActiveIcon = this.getDefaultStyleAt(DvtAfPanelCard.DFLT_PREV_ACTIVE_IMAGES_INDX);
  return this._prevButtonActiveIcon;
};

DvtAfPanelCard.prototype.setPrevButtonActiveIcon = function(icon) {
  this._prevButtonActiveIcon = icon;
};

DvtAfPanelCard.prototype.getPrevButtonDisabledIcon = function() {
  return this._prevButtonDisabledIcon;
};

DvtAfPanelCard.prototype.setPrevButtonDisabledIcon = function(icon) {
  this._prevButtonDisabledIcon = icon;
};


/*
 * styleList: List of the following skin selectors
 * af|dvt-panelCard
 * af|dvt-panelCard::train-button
 * af|dvt-panelCard::train-button:active
 * af|dvt-panelCard::navigation-button
 * af|dvt-panelCard::navigation-button:hover
 * af|dvt-panelCard::navigation-button:active
 * af|dvt-panelCard::header-text
 * af|dvt-panelCard::header-text:zoom75
 * af|dvt-panelCard::navigation-prev-icon
 * af|dvt-panelCard::navigation-prev-icon:hover
 * af|dvt-panelCard::navigation-prev-icon:active
 * af|dvt-panelCard::navigation-next-icon
 * af|dvt-panelCard::navigation-next-icon:hover
 * af|dvt-panelCard::navigation-next-icon:active
 * af|dvt-panelCard::train-button-icon
 * af|dvt-panelCard::train-button-icon:hover
 * af|dvt-panelCard::train-button-icon:active
 */
/**
 * @private
 */
DvtAfPanelCard.prototype.GetDefaultStyles = function() {
  return DvtAfPanelCard._afStyles;
};


/**
 * @private
 */
DvtAfPanelCard.prototype.SetDefaultStyles = function(styleList) {
  DvtAfPanelCard._afStyles = styleList;
};


DvtAfPanelCard.prototype.getDefaultStyleAt = function(index) {
  return this._getAfStyleAt(index);
};

// panelCard header text style
DvtAfPanelCard.prototype.setHeaderStyle = function(style) {
  this._headerStyle = style;
};

DvtAfPanelCard.prototype.getHeaderStyle = function() {
  if (!this._headerStyle) {
    var zoomFacet = this.getZoomPct();

    if (zoomFacet > .75)
      this._headerStyle = this.getDefaultStyleAt(DvtAfPanelCard.DFLT_HEADER_ZOOM_100_STYLE_INDX);
    else
      this._headerStyle = this.getDefaultStyleAt(DvtAfPanelCard.DFLT_HEADER_ZOOM_75_STYLE_INDX);
  }
  return this._headerStyle;
};

/*-------------------------------------------------------------------------*/
/*   CreateDisplayObject                                                   */
/*-------------------------------------------------------------------------*/
/**
 * @override
 */
DvtAfPanelCard.prototype.createDisplayObj = function(afContext) {

  this._setNode(afContext.getParentNode());
  var dispObj = DvtAfPanelCard.superclass.createDisplayObj.call(this, afContext);

  //flag indicating if we're currently transitioning between two detail items
  this._bTransitioning = false;

  //flag indicating if navigation should loop through from last to first and
  //from first to last detail items
  this._bNavLoop = true;

  this.addChildDisplayObjs(afContext, this._contentPane);

  if (this.needsNavUi()) {
    this.CreatePrevButton();
    this.CreateNextButton();
    var prevButton = this.GetPrevButtonObj();
    var nextButton = this.GetNextButtonObj();
    afContext.registerTabStop(prevButton);
    afContext.registerTabStop(nextButton);
  }
  return dispObj;
};


DvtAfPanelCard.prototype.addChildDisplayObjs = function(afContext, parentDO) {

  // get the current showDetailItem
  var sdiIndex = this.getDisplayedDetailItemIndex();
  if (! sdiIndex) {
    sdiIndex = 0;
  }

  var childDO;
  var sdi = this.getChildAt(sdiIndex);

  if (sdi && (! sdi.renderMe || sdi.renderMe())) {
    childDO = sdi.createDisplayObj(afContext);

    //Note: Don't create showDetailItem display object until it's disclosed
    if (childDO) {
      parentDO.addChild(childDO);
    }
  }

};


/*-------------------------------------------------------------------------*/
/*   Create Content Shape                                                  */
/*-------------------------------------------------------------------------*/
DvtAfPanelCard.prototype.createContentShape = function(dvtContext) {
  var style = this.getCSSStyle();

  switch (this.getNodeShape()) {
    case DvtAfPanelCard.SHAPE_RECT:
      this._contentPane = new DvtRect(dvtContext, 0, 0, 0, 0, this._getUniqueId());
      style.setStyle('border-radius', null);
      break;
    case DvtAfPanelCard.SHAPE_ELLIPSE:
      this._contentPane = new DvtPath(dvtContext, '', this._getUniqueId());
      break;

    case DvtAfPanelCard.SHAPE_ROUNDED_RECT:
    default:
      this._contentPane = new DvtRect(dvtContext, 0, 0, 0, 0, this._getUniqueId());
      var radius = style.getStyle(DvtCSSStyle.BORDER_RADIUS);
      if (! radius)
        radius = DvtAfPanelCard.ROUND_CORNER_SIZE;
      this._contentPane.setRx(radius);
      this._contentPane.setRy(radius);
      break;
  }

  this._contentPane.setCSSStyle(style);
  this.associate(this._contentPane, this);

  return this._contentPane;
};


/**
 * Get the content pane where AfComponent children of this
 * AfComponent will be added.
 * In most cases the content pane will be this AfComponent itself,
 * but in AfPanelCard it is a separate sprite.
 *
 * @return the shape containing AfComponent children of this component
 *
 */
DvtAfPanelCard.prototype.getContentShape = function() {
  return this._contentPane;
};


/*---------------------------------------------------------------------*/
/*   Create background Shape                                           */
/*---------------------------------------------------------------------*/
DvtAfPanelCard.prototype.createBackgroundShape = function(dvtContext, shape) {
  return shape;
};


/**
 * Override to only allow adding ShowDetailItem.
 * @override
 */
DvtAfPanelCard.prototype.addChild = function(comp) {
  //NOTE: template
  if (comp instanceof DvtAfShowDetailItem) {
    DvtAfPanelCard.superclass.addChild.call(this, comp);
  }
};

DvtAfPanelCard.prototype.renderChild = function(sdi) {
  sdi._render(this._acw, this._ach);
  this._child = sdi;
};


/**
 * Override to render the single displayed detail item of this panel card.
 *
 * @param comp AfComponentBase representing this template
 * @param nodeData node data
 */
DvtAfPanelCard.prototype.renderChildren = function() {
  var index = this.getDisplayedDetailItemIndex();
  var sdi = this.getVisibleChild(index);

  //NOTE: only render if displayObj exists
  if (sdi && sdi.getDisplayObj()) {
    this.renderChild(sdi);
  }
};


/**
 * @export
 * Get the number of visible children of this panelCard.
 *
 * @param nodeData NodeData for the node sprite making the request
 *
 * @return number of visible children of this panelCard
 */
DvtAfPanelCard.prototype.getDetailItemCount = function() {
  var children = this._getChildren();
  var numChildren = 0;

  //iterate over all the children and count how many are actually visible
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.isRendered() && child.isVisible()) {
      numChildren++;
    }
  }
  return numChildren;
};


/**
 * Get the visible child template at the given index.
 *
 * @param index index of the visible child to get
 * @param nodeData NodeData for the node sprite making the request
 *
 * @return visible child template at the given index
 */
DvtAfPanelCard.prototype.getVisibleChild = function(index) {
  var children = this._getChildren();
  var numChildren = 0;

  //iterate over all the children and count how many are actually visible
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.isRendered() && child.isVisible()) {
      if (numChildren == index)
        return child;
      numChildren++;
    }
  }
  return null;
};

/**
 * @export
 * Get the current visible child
 * @return {DvtAfShowDetailItem} Current visible child
 */
DvtAfPanelCard.prototype.getCurrentVisibleChild = function() {
  return this.getVisibleChild(this.getDisplayedDetailItemIndex());
};

/**
 * Get the index of visible AfShowDetailItem with the text/icon matches the given text
 *
 * @param text text of the visible child to get
 * @param nodeData NodeData for the node sprite making the request
 *
 * @return index of visible child template or -1 if not found
 */
DvtAfPanelCard.prototype.getVisibleDetailItemIndex = function(text) {
  var children = this._getChildren();
  var numChildren = 0;

  //iterate over all the children and count how many are actually visible
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.isRendered() && child.isVisible()) {
      //if the text or icon matches the specified text, return it
      if (text == child.getText() || text == child.getIcon())
        return numChildren;
      numChildren++;
    }
  }
  return -1;
};



/*---------------------------------------------------------------------*/
/*   Event Handling Support                                            */
/*---------------------------------------------------------------------*/


/**
 * Adds an event listener.
 * @param {function} listener the function to call
 * @param {object} obj instance of the object the listener is defined on
 */
DvtAfPanelCard.prototype.addEvtListener = function(listener, obj) {
  var listeners = this._getListeners(true);
  listeners.push(listener);
  listeners.push(obj);
};


/**
 * Removes an event listener.
 * @param {function} listener the function to call
 * @param {object} obj instance of the object the listener is defined on
 */
DvtAfPanelCard.prototype.removeEvtListener = function(listener, obj) {
  var listeners = this._getListeners(false);
  if (listeners) {
    for (var i = 0; i < listeners.length; i += 2) {
      if (listeners[i] === listener &&
          listeners[i + 1] === obj) {
        listeners.splice(i, 2);
        break;
      }
    }
  }
};


/**
 * @param {boolean} createNew whether the array should be created if it doesn't exist
*/
DvtAfPanelCard.prototype._getListeners = function(createNew) {
  // First find the object where the listener arrays are stored
  if (! this._listenerObj) {
    if (createNew) {
      this._listenerObj = [];
    }
    else {
      return null;
    }
  }
  return this._listenerObj;
};


/**
 * Notifies all applicable event listeners of the given event.
 * @param {String} type either SET_PROP_EVENT or FETCH_DATA_EVENT
 * @param {int} index new selected showDetailItem index
 */
DvtAfPanelCard.prototype.FireListener = function(type, index) {
  var listeners = this._getListeners(false);
  if (listeners) {
    for (var i = 0; i < listeners.length; i += 2) {
      var obj = listeners[i + 1];
      if (listeners[i]) {
        listeners[i].call(obj, type, this._getNodeId(), index);
      }
    }
  }
};


DvtAfPanelCard.prototype.getTagName = function() {
  return DvtAfPanelCard.TAG_NAME;
};


DvtAfPanelCard.prototype.isPanelCardDeliveryLazy = function() {
  var cd = this.getContentDelivery();
  return (cd && cd == 'lazy');
};


DvtAfPanelCard.prototype.setDisplayedDetailItemIndex = function(index) {
  var node = this._getNode();
  if (node && node.setStateProp) {
    node.setStateProp(DvtAfPanelCard.DISPLAYED_DETAIL_ITEM_INDEX_KEY, index);
  }
};

DvtAfPanelCard.prototype.getDisplayedDetailItemIndex = function() {
  var index;
  var node = this._getNode();
  if (node && node.getStateProp) {
    index = node.getStateProp(DvtAfPanelCard.DISPLAYED_DETAIL_ITEM_INDEX_KEY);
    if (index != null && index >= 0 && index < this.getDetailItemCount()) {
      return index;
    }
  }
  return 0;
};

DvtAfPanelCard.prototype.hasNextDetailItem = function() {
  //if navigating in a loop, then there is always a next item
  //as long as there is more than 1, otherwise there is no next item
  if (this._bNavLoop) {
    return (this.getDetailItemCount() > 1);
  }

  //if not navigating in a loop, then there is no next item
  //if currently showing the last item
  return (this.getDisplayedDetailItemIndex() < this.getDetailItemCount() - 1);
};

DvtAfPanelCard.prototype.hasPrevDetailItem = function() {
  //if navigating in a loop, then there is always a prev item
  //as long as there is more than 1, otherwise there is no prev item
  if (this._bNavLoop) {
    return (this.getDetailItemCount() > 1);
  }

  //if not navigating in a loop, then there is no prev item
  //if currently showing the first item
  return (this.getDisplayedDetailItemIndex() > 0);
};

DvtAfPanelCard.prototype.displayNextDetailItem = function() {
  if (this.hasNextDetailItem()) {
    this.displayDetailItem(this.getDisplayedDetailItemIndex() + 1);
  }
};

DvtAfPanelCard.prototype.displayPrevDetailItem = function() {
  if (this.hasPrevDetailItem()) {
    this.displayDetailItem(this.getDisplayedDetailItemIndex() - 1);
  }
};

//is the showDetailItem locally available?
DvtAfPanelCard.prototype.isShowDetailItemLoaded = function(index) {
  var sdi = this.getVisibleChild(index);
  if (sdi) {
    var diagram = this._getDiagram();
    if (diagram) {
      return diagram.isShowDetailItemLoaded(this._getNodeId(), index);
    }
  }
  return false;
};


/**
 * This method is called to display a new showDetailItem
 * @param index specified new index to display
 */
DvtAfPanelCard.prototype.displayDetailItem = function(index) {
  var disIndex = this.getDisplayedDetailItemIndex();
  if (disIndex < index) {
    var button = this.GetPrevButtonObj();
    if (button) {
      if (button.isShowingKeyboardFocusEffect()) {
        button.hideKeyboardFocusEffect();
      }
    }
  }
  else if (disIndex > index) {
    var button = this.GetNextButtonObj();
    if (button) {
      if (button.isShowingKeyboardFocusEffect()) {
        button.hideKeyboardFocusEffect();
      }
    }
  }
  //BiDi: going to prev item is still a "forward" navigation (to the right)
  var bForward = ((index > disIndex) && ! DvtAgent.isRightToLeft(this.getDvtContext())) ||
      ((index < disIndex) && DvtAgent.isRightToLeft(this.getDvtContext()));

  if (this._bNavLoop) {
    //loop through from last detail item to first
    if (index > this.getDetailItemCount() - 1)
      index = 0;

    //loop through from first detail item to last
    else if (index < 0)
      index = this.getDetailItemCount() - 1;
  }

  //only change detail items if we're not already in the middle of a transition
  if (! this._bTransitioning) {
    //defer panelCard loading
    //if the showDetailItem already loaded, display it
    if (this.isShowDetailItemLoaded(index)) {
      //toggle the flag, indicating we're in the middle of a transition
      this._bTransitioning = true;
      this.setDisplayedDetailItemIndex(index);

      // fire a prop change event to server
      this.FireListener(DvtAfPanelCard.SET_PROP_EVENT, index);
      this.renderDetailItem(bForward);
    }

    //fire a fetch event to fetch more showDetailItems from server

    //TODO: Note: component need to check if it's in a hover window
    //var bHoverWindow = node.isHoverWindow();
    else {
      this.FireListener(DvtAfPanelCard.FETCH_DATA_EVENT, index);
    }
  }
};

/**
 * @override
 */
DvtAfPanelCard.prototype.renderSelfBeforeChildren = function() {
  DvtAfPanelCard.superclass.renderSelfBeforeChildren.call(this);

  //whole client area is available to children, but will
  //be reduced as children are rendered
  this._acw = this._cw;

  //try to render the showDetailItem icon so that we know how much space
  //is left for the panelCard contents below the title bar
  var sdi = this.getVisibleChild(this.getDisplayedDetailItemIndex());
  if (! sdi)
    return;

  sdi = this._loadDetailItem(sdi, false);

  var titleBar = this.CreateTitleBar(sdi);
  this._ach = this._ch - titleBar.getDimensions().h;

  //BUG FIX #8895471: don't show the train and prev/next buttons when
  //there's no or only one showDetailItem
  if (this.needsNavUi()) {

    var rootDO = this._getGroupDO();
    var prevButton = this.GetPrevButtonObj();
    var nextButton = this.GetNextButtonObj();

    var maxH = 0;

    if (prevButton) {
      if (! rootDO.contains(prevButton))
        rootDO.addChild(prevButton);

      maxH = Math.max(maxH, prevButton.getDimensions().h);
    }

    if (nextButton) {
      if (! rootDO.contains(nextButton))
        rootDO.addChild(nextButton);

      maxH = Math.max(maxH, nextButton.getDimensions().h);
    }

    this._ach -= maxH + 1;
  }

  //Note: (this._acw, this._ach) are available size for rendering sdi

};


/**
 * Render this object only, after children have been rendered.
 * @override
 */
DvtAfPanelCard.prototype.renderSelfAfterChildren = function() {
  //set child's text on label text field, or if there is
  //no child, set an empty string
  if (this._child) {
    //position the icon and text field within the title bar sprite
    this.positionIconAndTextField();
  }
  else {
    if (this._text)
      this._text.setTextString('');
  }

  //BUG FIX #8895471: don't show the train and prev/next buttons when
  //there's no or only one showDetailItem
  if (!this.needsNavUi())
    return;

  var rootDO = this._getGroupDO();
  var prevButton = this.GetPrevButtonObj();
  var nextButton = this.GetNextButtonObj();
  var prevDim;
  var nextDim;

  if (prevButton) {
    if (! rootDO.contains(prevButton))
      rootDO.addChild(prevButton);
    prevDim = prevButton.getDimensions();
  }

  if (nextButton) {
    if (! rootDO.contains(nextButton))
      rootDO.addChild(nextButton);
    nextDim = nextButton.getDimensions();
  }

  this.updateButtonStates();

  //create an array of the ShowDetailItem text values
  //to use as tooltips in the train
  var labels = [];
  var children = this._getChildren();
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.isRendered() && child.isVisible()) {
      labels.push(child.getText());
    }
  }

  var train;
  var trainDim;
  //show a train if there are only a few items or cardTrainButtonVisible is true
  //TODO: need to check the skinning key
  //view.isCardTrainButtonVisible()
  if (labels.length <= DvtAfPanelCard.MAX_TRAIN_ITEM_COUNT) {
    train = new DvtTrain(this.getDvtContext(), this.getAfContext().getEventManager(),
                         labels, this.getTrainButtonStyles(),
                         this.getId() + '_train', this.isSkinAlta());
    //Add train compute to train dimensions
    rootDO.addChild(train);
    trainDim = train.getDimensions();
    rootDO.removeChild(train);
  }

  var prevTransX;
  var nextTransX;
  var hPadding, vPadding = 0;
  if (this.isSkinAlta()) {
    hPadding = DvtAfPanelCard.ALTA_BUTTON_HPADDING;
    vPadding = DvtAfPanelCard.ALTA_BUTTON_VPADDING;
    if (this.getZoomPct() > 0.50 && train) {
      //previous button translation cannot be less than minimum padding
      prevTransX = (this._cw - trainDim.w) / 2 - prevDim.w;
      prevTransX = this.getCX() + (hPadding > prevTransX ? hPadding : prevTransX);
      //next button translation cannot be less than minimum padding on the right
      nextTransX = (this._cw + trainDim.w) / 2;
      nextTransX = this.getCX() + (hPadding > (this._cw - nextTransX - nextDim.w) ? (this._cw - hPadding - nextDim.w) : nextTransX);
    } else {
      prevTransX = this.getCX() + hPadding;
      nextTransX = this.getCX() + this._cw - nextDim.w - hPadding;
    }
  } else {
    hPadding = DvtAfPanelCard.BUTTON_PADDING;
    vPadding = DvtAfPanelCard.BUTTON_PADDING;
    prevTransX = this.getCX() + hPadding;
    nextTransX = this.getCX() + this._cw - nextDim.w - hPadding;
  }

  //Translate Previous button
  if (prevButton) {
    prevButton.setTranslateX(prevTransX);
    prevButton.setTranslateY(this.getCY() + this._ch - prevDim.h - vPadding);
  }
  //Translate Next button
  if (nextButton) {
    nextButton.setTranslateX(nextTransX);
    nextButton.setTranslateY(this.getCY() + this._ch - nextDim.h - vPadding);
  }

  //For Alta Skin, don't display train button for zoom percent 0.5 or lesser
  if (train && !(this.isSkinAlta() && this.getZoomPct() <= 0.5)) {
    //Translate train
    var prevRightX = 0;
    if (prevButton) {
      prevRightX = prevTransX + prevDim.w;
    }
    rootDO.addChild(train);
    this._train = train;

    //only render the train if it will fit within the available space
    //between the navigation buttons
    //Bug 17583050 - PANELCARD TRAIN BUTTONS DISPLAYED AT TOP LEFT CORNER OF THE NODE
    if (trainDim.w <= Math.round(nextTransX - prevRightX)) {
      train.setTranslateX(prevRightX +
                          ((nextTransX - prevRightX) - trainDim.w) / 2);
      train.setTranslateY(prevButton.getTranslateY() + (prevDim.h - trainDim.h) / 2);

      this._setTrainSelectedIndex();
      train.addTrainEventListener(this.HandleTrainEvent, this);
    } else {
      rootDO.removeChild(this._train);
    }
  }
};


/**
 * Perform layout of this display object.
 * @override
 */
DvtAfPanelCard.prototype.doLayout = function() {
  var tbDim;

  if (this._titleBar) {
    tbDim = this._titleBar.getDimensions();

    var align = 'center';
    var headerStyle = this.getHeaderStyle();
    if (headerStyle && headerStyle.getStyle(DvtCSSStyle.TEXT_ALIGN)) {
      align = headerStyle.getStyle(DvtCSSStyle.TEXT_ALIGN);
    }

    var xx = this.getCX();
    if (((align == 'end' || align == 'right') && ! DvtAgent.isRightToLeft(this.getDvtContext())) ||
        ((align == 'start' || align == 'left') && DvtAgent.isRightToLeft(this.getDvtContext()))) {
      xx += this._cw - tbDim.w;
    }
    else if (align == 'center') {
      xx += (this._cw - tbDim.w) / 2;
    }
    this._titleBar.setTranslateX(xx);
    this._titleBar.setTranslateY(this.getCY());
  }

  if (this._child) {
    var cDo = this._child.getDisplayObj();
    cDo.setTranslateX(this.getCX());
    cDo.setTranslateY(this.getCY() + 5 + (tbDim ? tbDim.h : 0));
  }
};

DvtAfPanelCard.prototype.renderSelfAfterLayout = function() {
  var newSize = this.getBounds();
  var bgShape = this.getDisplayObj();

  this.SetDisplayObjBounds(bgShape, 0, 0, newSize.w, newSize.h);

  //determine whether the node is elliptical
  var bEllipse = (this._shape === DvtAfPanelCard.SHAPE_ELLIPSE);

  //if the node is not an ellipse, simply draw a rounded rect;
  //if the node is an ellipse, a flattened ellipse will be drawn in
  //postRenderSelfBeforeChildren();
  if (! bEllipse) {
    DvtAfPanelCard.superclass.renderSelfAfterLayout.call(this);
  }

  //comment out scrollRect in order to support elliptical panelCard:
  //set the scrollrect so that content is cropped to the size of this container
  //scrollRect = new Rectangle(0, 0, newSize.width, newSize.height);

};


/**
 * Determine whether the train and prev/next buttons are necessary.
 *
 * @return {boolean} true if the navigation UI is necessary, false if not
 */
DvtAfPanelCard.prototype.needsNavUi = function() {
  //if there is no or only one showDetailItem, don't need to render train and prev/next buttons
  //key to determine whether the nav UI should be shown
  if (this.getDetailItemCount() <= 1) {

    //TODO: need to check the skinning key
    //view.isPanelCardSingleItemNavUi();
    return false;
  }

  return true;
};


/**
 * Render the new detail item, transitioning from the old one.
 * @param {boolean} bForward true if moving to the next detail item,
 *        false if moving to the previous detail item
 */
DvtAfPanelCard.prototype.renderDetailItem = function(bForward) {
  //save old showDetailItem for transition and removal
  var sdi = this._child;
  this._oldChild = sdi;
  this._oldTitleBar = this._titleBar;

  //reset keyboard navigation - we will restore the keyboard effect after new detail item rendered
  var prevButton = this.GetPrevButtonObj();
  var nextButton = this.GetNextButtonObj();

  //Determine which is the object that was previously in focus
  var focusedObject;
  if (sdi.isShowingKeyboardFocusEffect()) {
    sdi.hideKeyboardFocusEffect();
    focusedObject = sdi;
  }
  else if (prevButton.isShowingKeyboardFocusEffect()) {
    focusedObject = prevButton;
  }
  else if (nextButton.isShowingKeyboardFocusEffect()) {
    focusedObject = nextButton;
  }

  this._getNode().resetTabStops();
  //remove old items from tab stops array, then split array into two in order for the new sdi items to be added to the correct position
  //the second part - tailTabStops - will be added back to the tab stops array at the end
  var nodeTabStopsArray = this._getNode().getTabStopsArray();
  var sdiTabStopIndex = DvtArrayUtils.getIndex(nodeTabStopsArray, sdi);
  this.getAfContext().setTabStopsArray(nodeTabStopsArray);
  sdi.unregisterAsTabStop();
  var tailTabStops = nodeTabStopsArray.splice(sdiTabStopIndex, nodeTabStopsArray.length - sdiTabStopIndex + 1);

  //if this transition is on the whole node
  //create a copy of old node and it's removed at the end of the transition
  var effect = this.getEffect();
  if (effect == DvtAfPanelCard.EFFECT_NODE_FLIP_HORZ ||
      effect == DvtAfPanelCard.EFFECT_NODE_CUBE_ROTATE_HORZ) {

    var node = this._getNode();
    if (node && node.getParent()) {
      //clear the node matrix temporary, so the cloned node has an identity matrix
      var omat = node.getMatrix();
      node.setMatrix(null);
      this._oldNode = node.createCopy();
      node.addChild(this._oldNode);

      //restore matrix
      node.setMatrix(omat);
    }
  }

  //get new showDetailItem
  sdi = this.getVisibleChild(this.getDisplayedDetailItemIndex());
  if (sdi) {
    sdi = this._loadDetailItem(sdi, true);

    //clear out variables related to old icon
    this._titleBar = null;
    this._icon = null;

    //render new showDetailItem
    this.renderChild(sdi);

    //TODO: can't do this if node size is not specified
    //need to set the avail client width and height on template in
    //order to render the displayObjs
    //    sdi.setNodeWidth(this._acw);
    //    sdi.setNodeHeight(this._ach);

    var titleBar = this.CreateTitleBar(sdi);

    //TODO: icon loaded??
    if (this._icon)
      this.positionIconAndTextField();

    //move text field behind navigation buttons in z-order so
    //that when transition between detail items occurs, text field
    //moves behind buttons instead of on top of them
    //TODO: already in CreateTitleBar, do we need this??
    //    this._getGroupDO().addChildAt(titleBar, 1);
  }

  this.updateButtonStates();
  this.doLayout();

  if (this._savedAfContext) {
    this.setAfContext(this._savedAfContext);
    this._savedAfContext = undefined;
  }

  //remove old sdi and title because we already create a copy of entire node
  if (this._oldNode) {
    this.removeOldDisplayItem(true);
  }

  //finish with tab stops by appending the saved tab stops tail and restorinig the focus if necessary
  for (var i = 0; i < tailTabStops.length; i++) {
    nodeTabStopsArray.push(tailTabStops[i]);
  }

  var updateKeyboardEffectOnEnd;

  if (focusedObject) {
    //define a function that will update focus effect after transition is done, otherwise screen reader fails to read label for the panel card
    var thisRef = this;
    var displayObj = focusedObject instanceof DvtAfShowDetailItem ? sdi.getDisplayObj() : focusedObject;
    focusedObject = focusedObject instanceof DvtAfShowDetailItem ? sdi : focusedObject;//focusedObject updated with new sdi if needed
    updateKeyboardEffectOnEnd = function() {
      var firstTabStop = thisRef._getNode().getCurrentTabStop(); // compare to the first object to prevent endless loop if something went wrong
      var testStop = firstTabStop;
      do {
        testStop = thisRef._getNode().getNextTabStop();
      } while (testStop != focusedObject && testStop != firstTabStop);
      var ariaLabel = focusedObject.getAriaLabel();
      if (ariaLabel) {
        displayObj.setAriaProperty('label', ariaLabel);
      }
      focusedObject.showKeyboardFocusEffect();
    };
  }

  this.TransitionDisplayItems(effect, bForward, updateKeyboardEffectOnEnd);
};

/**
 * Creates the previous button on the panel
 * @protected
 */
DvtAfPanelCard.prototype.CreatePrevButton = function() {
  this._prevButton = new DvtNavButton(this,
                                      this.getDvtContext(),
                                      this.CreateUpState(false),
                                      this.CreateOverState(false),
                                      this.CreateDownState(false));

  this.associate(this._prevButton, this._prevButton);
  this._prevButton.setCallback(this.HandlePrevButtonClick, this);
  this._prevButton.setAriaRole('button');
  this._prevButton.setAriaProperty('label', this._prevButton.getTooltip());
};
/**
 * Creates the next button on the panel
 * @protected
 */
DvtAfPanelCard.prototype.CreateNextButton = function() {
  this._nextButton = new DvtNavButton(this,
                                      this.getDvtContext(),
                                      this.CreateUpState(true),
                                      this.CreateOverState(true),
                                      this.CreateDownState(true));

  this.associate(this._nextButton, this._nextButton);
  this._nextButton.setCallback(this.HandleNextButtonClick, this);
  this._nextButton.setAriaRole('button');
  this._nextButton.setAriaProperty('label', this._nextButton.getTooltip());
};


/**
 * Get the prev button object
 * @return object used to represent the prev button
 */
DvtAfPanelCard.prototype.GetPrevButtonObj = function() {
  return this._prevButton;
};


/**
 * Get the next button object
 * @return object used to represent the next button
 */
DvtAfPanelCard.prototype.GetNextButtonObj = function() {
  return this._nextButton;
};

/**
 * release resources.
 */
DvtAfPanelCard.prototype.destroy = function() {

  if (this._popupMenu)
    this.destroyPopup();

  if (this._train)
    this._train.destroy(this.HandleTrainEvent);

  DvtAfPanelCard.superclass.destroy.call(this);

};


/**
 * Handle a mouse down event
 *
 * @param event mouse down event
 */
DvtAfPanelCard.prototype.ConsumeEvent = function(event) {
  DvtEventManager.consumeEvent(event);
};


DvtAfPanelCard.prototype.CreateUpState = function(bNext) {
  var s = null;
  var bDisabled = this.isDisabled();

  if (bNext) {
    if (bDisabled && this.getNextButtonDisabledIcon())
      s = this.CreateButtonIconState(this.getNextButtonDisabledIcon(),
                                     DvtButton.STATE_ENABLED, bNext);
    else if (this.getNextButtonIcon())
      s = this.CreateButtonIconState(this.getNextButtonIcon(),
                                     DvtButton.STATE_ENABLED, bNext);
  }
  else {
    if (bDisabled && this.getPrevButtonDisabledIcon())
      s = this.CreateButtonIconState(this.getPrevButtonDisabledIcon(),
                                     DvtButton.STATE_ENABLED, bNext);
    else if (this.getPrevButtonIcon())
      s = this.CreateButtonIconState(this.getPrevButtonIcon(),
                                     DvtButton.STATE_ENABLED, bNext);
  }
  if (s == null) {
    s = this.CreateButtonState(bNext, DvtButton.STATE_ENABLED);
    if (bDisabled)
      s.setAlpha(DvtAfPanelCard.DISABLED_ALPHA);
  }

  s.setCursor('default');
  return s;
};

DvtAfPanelCard.prototype.CreateDownState = function(bNext) {
  var s = null;
  if (bNext) {
    if (this.getNextButtonActiveIcon())
      s = this.CreateButtonIconState(this.getNextButtonActiveIcon(),
                                     DvtButton.STATE_DOWN, bNext);
    else if (this.getNextButtonIcon())
      s = this.CreateButtonIconState(this.getNextButtonIcon(),
                                     DvtButton.STATE_DOWN, bNext);
  }
  else {
    if (this.getPrevButtonActiveIcon())
      s = this.CreateButtonIconState(this.getPrevButtonActiveIcon(),
                                     DvtButton.STATE_DOWN, bNext);
    else if (this.getPrevButtonIcon())
      s = this.CreateButtonIconState(this.getPrevButtonIcon(),
                                     DvtButton.STATE_DOWN, bNext);
  }
  if (s == null)
    s = this.CreateButtonState(bNext, DvtButton.STATE_DOWN);

  s.setCursor('pointer');
  return s;
};

DvtAfPanelCard.prototype.CreateOverState = function(bNext) {
  var s = null;
  if (bNext) {
    if (this.getNextButtonHoverIcon())
      s = this.CreateButtonIconState(this.getNextButtonHoverIcon(),
                                     DvtButton.STATE_OVER, bNext);
    else if (this.getNextButtonIcon())
      s = this.CreateButtonIconState(this.getNextButtonIcon(),
                                     DvtButton.STATE_OVER, bNext);
  }
  else {
    if (this.getPrevButtonHoverIcon())
      s = this.CreateButtonIconState(this.getPrevButtonHoverIcon(),
                                     DvtButton.STATE_OVER, bNext);
    else if (this.getPrevButtonIcon())
      s = this.CreateButtonIconState(this.getPrevButtonIcon(),
                                     DvtButton.STATE_OVER, bNext);
  }
  if (s == null)
    s = this.CreateButtonState(bNext, DvtButton.STATE_OVER);

  s.setCursor('pointer');
  return s;
};

/**
 * Create Button Icon for a specific state
 * @param {String} iconSrc  Icon source
 * @param {String} buttonState  button state
 * @param {boolean} bNext flag indicating the button is previous or next
 * @return {DvtImage}  image object
 */
DvtAfPanelCard.prototype.CreateButtonIconState = function(iconSrc, buttonState, bNext) {
  var dvtContext = this.getDvtContext();
  var iconShape = new DvtImage(dvtContext, iconSrc, 0, 0, 1, 1);
  /*
  var onLoadFunc = null;

  switch (buttonState) {
  case DvtButton.STATE_OVER:
    onLoadFunc = bNext? this.onNextButtonHoverIconLoaded : this.onPrevButtonHoverIconLoaded;
    break;

  case DvtButton.STATE_DOWN:
    onLoadFunc = bNext? this.onNextButtonActiveIconLoaded : this.onPrevButtonActiveIconLoaded;
    break;

  case DvtButton.STATE_ENABLED:
  default:
    onLoadFunc = bNext? this.onNextButtonIconLoaded : this.onPrevButtonIconLoaded;
    break;
  }

  if (onLoadFunc) {
  */
  var imageDims = DvtImageLoader.loadImage(dvtContext, iconSrc);
  // image is cached
  if (imageDims) {
    iconShape.setWidth(imageDims.width);
    iconShape.setHeight(imageDims.height);
  } else {
    this.RegisterImageCallback(iconSrc);
  }
  //  }

  return iconShape;
};

/*
DvtAfPanelCard.prototype.onNextButtonIconLoaded = function (image) {
  if (image) {
    this._nextUp = new DvtDimension(image.width, image.height);
  }
}

DvtAfPanelCard.prototype.onNextButtonHoverIconLoaded = function (image) {
  if (image) {
    this._nextOver = new DvtDimension(image.width, image.height);
  }
}

DvtAfPanelCard.prototype.onNextButtonActiveIconLoaded = function (image) {
  if (image) {
    this._nextDown = new DvtDimension(image.width, image.height);
  }
}

DvtAfPanelCard.prototype.onPrevButtonIconLoaded = function (image) {
  if (image) {
    this._prevUp = new DvtDimension(image.width, image.height);
  }
}

DvtAfPanelCard.prototype.onPrevButtonHoverIconLoaded = function (image) {
  if (image) {
    this._prevOver = new DvtDimension(image.width, image.height);
  }
}

DvtAfPanelCard.prototype.onPrevButtonActiveIconLoaded = function (image) {
  if (image) {
    this._prevDown = new DvtDimension(image.width, image.height);
  }
}
*/

DvtAfPanelCard.prototype.CreateButtonState = function(bNext, state) {
  var s;
  var dvtContext = this.getDvtContext();
  if (bNext)
    s = DvtPanelCardButtonLAFUtils.createRightArrowState(dvtContext, state, this.getCardNavButtonStyles());
  else
    s = DvtPanelCardButtonLAFUtils.createLeftArrowState(dvtContext, state, this.getCardNavButtonStyles());
  return s;
};


/**
 * Render the header icon.
 *
 * @param iconUrl url to the icon
 *
 * @return true if there is an icon to load, false if not
 */
DvtAfPanelCard.prototype._renderIcon = function(iconUrl) {
  DvtImageLoader.loadImage(this.getDvtContext(), iconUrl,
                           this.createCallback(this.onIconLoaded));

};

DvtAfPanelCard.prototype.onIconLoaded = function(image) {
  if (image && image.width && image.height) {
    this._icon.setWidth(image.width);
    this._icon.setHeight(image.height);
  }
};


/**
 * This method create the title bar which may include icon/text
 */
DvtAfPanelCard.prototype.CreateTitleBar = function(sdi) {
  // create a container for both icon and text
  var dvtContext = this.getDvtContext();
  var id = sdi._getUniqueId();

  var titleBar = new DvtContainer(dvtContext, id + '_tBar');

  var iconUrl = sdi.getIcon();
  if (iconUrl && iconUrl.length > 0) {
    this._icon = new DvtImage(dvtContext, iconUrl, 0, 0, 1, 1, id + '_icon');
    this._renderIcon(iconUrl);
    titleBar.addChild(this._icon);
  }

  var title = sdi.getText();
  if (title && title.length > 0) {
    //set sample text so the text field has some height;
    //use characters that extend high and low relative to the baseline
    //    title = "ATgj";

    var defStyle = this.GetDefaultStyles();
    var textStyle = this.getHeaderStyle();
    this._text = this.createTextShape(false, title,
                                      textStyle, defStyle,
                                      id + '_hd');

    titleBar.addChild(this._text);
  }

  // add the titleBar to panelCard
  this._getGroupDO().addChildAt(titleBar, 1);
  this._titleBar = titleBar;

  return titleBar;
};


/**
 * Position the icon and text field within the title bar sprite.
 */
DvtAfPanelCard.prototype.positionIconAndTextField = function() {
  // if icon specified, load image and set image (x, y)
  var isLocaleR2L = DvtAgent.isRightToLeft(this.getDvtContext());

  var currX = 0;
  var iconw = 0;
  var iconh = 0;
  if (this._icon) {
    var iconDim = this._icon.getDimensions();
    iconw = iconDim.w ? iconDim.w : 0;
    iconh = iconDim.h ? iconDim.h : 0;
    currX += iconw;
  }

  var textw = 0;
  var texth = 0;
  if (this._text) {
    this._text.alignCenter();
    var textDim = this._text.getDimensions();
    textw = textDim.w;
    texth = textDim.h;
    if (this.isSkinAlta())
      this._text.setTranslateX(currX + textw / 2);
    else
      this._text.setTranslateX(currX + 2 + textw / 2);
  }

  var headerDim = this._titleBar.getDimensions();

  //BiDi
  //for R2L, reverse the order of the icon and text
  if (isLocaleR2L) {
    //save the width, because it will change once we start repositioning
    //the components below
    var origWidth = headerDim.w;

    if (this._icon)
      this._icon.setTranslateX(origWidth - this._icon.getTranslateX() - iconw);

    if (this._text)
      this._text.setTranslateX(origWidth - this._text.getTranslateX());
  }

  //vertically center the icon and the textField
  if (this._icon)
    this._icon.setTranslateY((headerDim.h - iconh) / 2.0);

  if (this._text)
    this._text.setTranslateY((headerDim.h - texth) / 2.0);

};

/**
 * Check whether the skin is Alta
 * @return {boolean} return true if the skin is Alta
 */
DvtAfPanelCard.prototype.isSkinAlta = function() {
  //Bug fix: 19270204 - diagram panel card nav buttons are not aligned
  //Use the skin name to position the panel card navigation buttons
  var skinName = this._getDiagram().getCardNavButtonSkin();
  return skinName == DvtCSSStyle.SKIN_ALTA;
};

/**
 * Remove the old detail item from the display.
 * @param {boolean} forced  true to force remove old display item
 */
DvtAfPanelCard.prototype.removeOldDisplayItem = function(forced) {
  var parent;

  if (this._oldTitleBar && (forced || this._oldTitleBar !== this._titleBar)) {
    this._oldTitleBar.setVisible(false);
    parent = this._oldTitleBar.getParent();
    if (parent)
      parent.removeChild(this._oldTitleBar);
    this._oldTitleBar = null;
  }

  var sdi = this._oldChild;
  if (sdi && (forced || sdi !== this._child)) {
    DvtAfPanelCard._setItemDisplayableVisible(sdi, false);
    //TODO: remove listeners of sdi
    //    rootDO.removeChild(sdi.getDisplayObj());

    var sdiDO = sdi.getDisplayObj();
    var shape = sdi.getContentShape();
    if (shape && shape !== sdiDO) {
      parent = shape.getParent();
      if (parent) {
        parent.removeChild(shape);
        sdi.setContentShape(sdiDO, null);
      }
    }

    if (sdiDO) {
      parent = sdiDO.getParent();
      if (parent) {
        parent.removeChild(sdiDO);
        sdi._bgShape = null;
      }
    }

    this._oldChild = null;
  }

};


/**
 * Update button states
 */
DvtAfPanelCard.prototype.updateButtonStates = function() {
  //BUG FIX #8895471: don't show the train and prev/next buttons when
  //there's no or only one showDetailItem
  if (! this.needsNavUi())
    return;

  //TODO: tabEnabled???
  //the enabled and tabEnabled properties only apply to the buttons
  if (this.hasPrevDetailItem()) {
    if (this._prevButton) {
      this._prevButton.setEnabled(true);
    }
    this.GetPrevButtonObj().setAlpha(1);
  }
  else {
    if (this._prevButton) {
      this._prevButton.setEnabled(false);
    }
    this.GetPrevButtonObj().setAlpha(.5);
  }

  if (this.hasNextDetailItem()) {
    if (this._nextButton) {
      this._nextButton.setEnabled(true);
    }
    this.GetNextButtonObj().setAlpha(1);
  }
  else {
    if (this._nextButton) {
      this._nextButton.setEnabled(false);
    }
    this.GetNextButtonObj().setAlpha(.5);
  }
};

DvtAfPanelCard.prototype.HandlePrevButtonClick = function(event) {
  //don't want click to fall through to rest of node
  DvtEventManager.consumeEvent(event);

  //BiDi: prev button actually navigates to next item
  if (DvtAgent.isRightToLeft(this.getDvtContext())) {
    if (this.hasNextDetailItem())
      this.displayNextDetailItem();
  }
  else {
    if (this.hasPrevDetailItem())
      this.displayPrevDetailItem();
  }
};

DvtAfPanelCard.prototype.HandleNextButtonClick = function(event) {
  //don't want click to fall through to rest of node
  DvtEventManager.consumeEvent(event);

  //BiDi: next button actually navigates to prev item
  if (DvtAgent.isRightToLeft(this.getDvtContext())) {
    if (this.hasPrevDetailItem())
      this.displayPrevDetailItem();
  }
  else {
    if (this.hasNextDetailItem())
      this.displayNextDetailItem();
  }
};

/**
 * Handle a TrainEvent.
 *
 * @param event TrainEvent
 */
DvtAfPanelCard.prototype.HandleTrainEvent = function(event) {
  var newIndex = event.getIndex();
  this.displayDetailItem(newIndex);
};


/**
 * Get the tooltip to show when the mouse hovers over a navigation button.
 *
 * @param button navigation button
 *
 * @return tooltip to show
 */
DvtAfPanelCard.prototype.getNavButtonTooltip = function(button) {
  //BiDi: prev button navigates to next item and next button
  //navigates to prev item
  var bidi = DvtAgent.isRightToLeft(this.getDvtContext());
  var index = this.getDisplayedDetailItemIndex();
  var last = this.getDetailItemCount() - 1;
  var i;

  if ((button === this._nextButton && ! bidi) ||
      (button === this._prevButton && bidi)) {

    //if on the last item, show tooltip for first item if navigating in a loop
    if (index == last) {
      if (this._bNavLoop)
        i = 0;
      else
        return null;
    }
    else
      i = index + 1;
  }
  else {
    //if on the first item, show tooltip for last item if navigating in a loop
    if (index == 0) {
      if (this._bNavLoop)
        i = last;
      else
        return null;
    }
    else
      i = index - 1;
  }

  //get the text of the displayed showDetailItem
  var sdi = this.getVisibleChild(i);

  return sdi ? sdi.getText() : null;
};

DvtAfPanelCard.prototype._getGroupDO = function() {
  return this.getDisplayObj();
};

//TODO: need this method???
DvtAfPanelCard.prototype.isDisabled = function() {
  return false;
};

// node is the container(must be a display object) of this panelCard, it is used to get
// nodeId
// size: width/height
// shape: ellipse, rectangle
// isHover: is this panelCard in a hover window
// zoomPct:
// get/setStateProp: showDetailItem index state
// train css styles: normal and active
// custom icons
// skinning key: isCardTrainButtonVisible / isPanelCardSingleItemNavUi

/**
 * Set parent node of card
 * @private
 * @param {DvtAdfDiagramNode} node
 */
DvtAfPanelCard.prototype._setNode = function(node) {
  this._parentNode = node;
};

/**
 * Get parent node of card
 * @private
 * @return {DvtAdfDiagramNode}
 */
DvtAfPanelCard.prototype._getNode = function() {
  return this._parentNode;
};

/**
 * Get node def of card
 * @private
 * @return {DvtAdfDiagramNodeDef}
 */
DvtAfPanelCard.prototype._getNodeDef = function() {
  var node = this._getNode();
  return node && node.getNodeDef ? node.getNodeDef() : null;
};

/**
 * Get shape of node
 *
 * @return {string} shape
 */
DvtAfPanelCard.prototype.getNodeShape = function() {
  var nodeDef = this._getNodeDef();
  if (nodeDef && nodeDef.getShape) {
    return nodeDef.getShape();
  }

  return DvtAfPanelCard.SHAPE_ROUNDED_RECT;
};

/**
 * Get width of node
 *
 * @return {number} width
 */
DvtAfPanelCard.prototype.getNodeWidth = function() {
  //Bug 17368203 - HTML5: HV PANELCARD TRANSITION EFFECTS DON'T WORK
  var node = this._getNode();
  if (node) {
    if (node.getWidth)
      return node.getWidth();

    if (node.getContentBounds) {
      var dim = node.getContentBounds();
      return dim.w;
    }
  }
  return this._aw;
};

/**
 * Get height of node
 *
 * @return {number} height
 */
DvtAfPanelCard.prototype.getNodeHeight = function() {
  //Bug 17368203 - HTML5: HV PANELCARD TRANSITION EFFECTS DON'T WORK
  var node = this._getNode();
  if (node) {
    if (node.getHeight)
      return node.getHeight();

    if (node.getContentBounds) {
      var dim = node.getContentBounds();
      return dim.h;
    }
  }
  return this._ah;
};

/**
 * Get zoom percent
 *
 * @return {number} zoom
 */
DvtAfPanelCard.prototype.getZoomPct = function() {
  var node = this._getNode();
  var zoomFacet = 1;
  if (node && node._zoom) {
    zoomFacet = node._zoom;
  }
  return zoomFacet;
};

/**
 * Get train object
 *
 * @return {DvtTrain}
 */
DvtAfPanelCard.prototype.getTrain = function() {
  return this._train;
};

/**
 * Get id of node
 * @private
 * @return {String} id
 */
DvtAfPanelCard.prototype._getNodeId = function() {
  var node = this._getNode();
  if (node && node.getId) {
    return node.getId();
  }
  return null;
};


DvtAfPanelCard.prototype._getDiagram = function() {
  var node = this._getNode();
  if (node && node.GetDiagram) {
    return node.GetDiagram();
  }

  return null;
};

/**
 * @return buttonStyles=[TrainButtonStyle, TrainButtonHoverStyle, TrainButtonActiveStyle]
 */
DvtAfPanelCard.prototype.getTrainButtonStyles = function() {
  if (!this._trainButtonStyles) {
    this._trainButtonStyles = [];

    //set train button size
    var style = this.getDefaultStyleAt(DvtAfPanelCard.DFLT_TRAIN_STYLE_INDX);
    var enaIcon = style ? style.getIconUrl() : null;
    if (enaIcon) {
      var img = this.CreateButtonIconState(enaIcon);
      style.setStyle(DvtCSSStyle.WIDTH, '' + img.getWidth() + 'px');
    }
    this._trainButtonStyles.push(style);

    var hover = this.getDefaultStyleAt(DvtAfPanelCard.DFLT_TRAIN_HOVER_STYLE_INDX);
    if (! hover)
      hover = style;
    this._trainButtonStyles.push(hover);

    var active = this.getDefaultStyleAt(DvtAfPanelCard.DFLT_TRAIN_ACTIVE_STYLE_INDX);
    if (! active)
      active = style;
    this._trainButtonStyles.push(active);
  }
  return this._trainButtonStyles;
};


/**
 * @return buttonStyles = [CardNavButtonStyle, CardNavButtonHoverStyle, CardNavButtonActiveStyle]
 */
DvtAfPanelCard.prototype.getCardNavButtonStyles = function() {

  if (!this._cardNavButtonStyles) {
    this._cardNavButtonStyles = [];
    this._cardNavButtonStyles.push(this.getDefaultStyleAt(DvtAfPanelCard.DFLT_NAV_STYLE_INDX));
    this._cardNavButtonStyles.push(this.getDefaultStyleAt(DvtAfPanelCard.DFLT_NAV_HOVER_STYLE_INDX));
    this._cardNavButtonStyles.push(this.getDefaultStyleAt(DvtAfPanelCard.DFLT_NAV_ACTIVE_STYLE_INDX));
  }
  return this._cardNavButtonStyles;
};


/**
 * @protected
 * render background fill
 */
DvtAfPanelCard.prototype.RenderBackgroundFill = function(bgShape, style, bgColor) {
  //  var style = this.getCSSStyle();
  if (style && style.getStyle(DvtCSSStyle.FILL_TYPE) == 'gradient') {
    var fill = this.CreateGradientFill(bgColor);
    bgShape.setFill(fill);
  }
  else {
    DvtAfPanelCard.superclass.RenderBackgroundFill.call(this, bgShape, style, bgColor);
  }
};


/**
 * @protected
 * render background stroke
 */
DvtAfPanelCard.prototype.RenderBackgroundStroke = function(bgShape, style) {

  if (style && style.getStyle(DvtCSSStyle.BORDER_TYPE) == 'gradient') {
    var bdColor = style.getStyle(DvtCSSStyle.BORDER_COLOR);
    var bdWidth = style.getBorderWidth();
    var stroke = this.CreateGradientStroke(bdColor, bdWidth);
    bgShape.setStroke(stroke);
  }
  else {
    DvtAfPanelCard.superclass.RenderBackgroundStroke.call(this, bgShape, style);
  }
};

DvtAfPanelCard.prototype.CreateGradientFill = function(color) {
  var arColors = this.GetFillGradientColors(color);
  var gradAlpha = DvtColorUtils.getAlpha(color);
  var arAlphas = [gradAlpha, gradAlpha, gradAlpha];
  var arStops = [0, 50 / 255, 1];
  var fill = new DvtLinearGradientFill(-90, arColors, arAlphas, arStops);
  return fill;
};

DvtAfPanelCard.prototype.CreateGradientStroke = function(color, sw) {
  var arColors = this.GetStrokeGradientColors(color);
  var gradAlpha = DvtColorUtils.getAlpha(color);
  var arAlphas = [gradAlpha, gradAlpha, gradAlpha];
  var arStops = [0, 130 / 255, 1];
  var stroke = new DvtLinearGradientStroke(-90, arColors, arAlphas, arStops, null, sw);
  return stroke;
};


/**
 * Get the gradient colors to use for a gradient fill on this AfComponentBase.
 *
 * @param color specified fill color
 *
 * @return array of fill gradient colors
 */
DvtAfPanelCard.prototype.GetFillGradientColors = function(color) {

  //  var StartFillColor = 0xE0EAEB; //color
  var MidFillColor = '#FFFFFF';
  var EndColor = '#FFFFFF';

  var colorArray = [color, MidFillColor, EndColor];
  return colorArray;
};


/**
 * Get the gradient colors to use for a gradient border on this AfComponentBase.
 *
 * @param color specified border color
 *
 * @return array of border gradient colors
 */
DvtAfPanelCard.prototype.GetStrokeGradientColors = function(color) {

  var startLineColor = '#98ABBC'; //color
  var midLineColor = '#D7DFE3';
  var endLineColor = '#ADBEC9';

  var rrRatio = (DvtColorUtils.getRed(midLineColor) - DvtColorUtils.getRed(startLineColor)) /
      (255 - DvtColorUtils.getRed(startLineColor));
  var ggRatio = (DvtColorUtils.getGreen(midLineColor) - DvtColorUtils.getGreen(startLineColor)) /
      (255 - DvtColorUtils.getGreen(startLineColor));
  var bbRatio = (DvtColorUtils.getBlue(midLineColor) - DvtColorUtils.getBlue(startLineColor)) /
      (255 - DvtColorUtils.getBlue(startLineColor));

  var rr = DvtColorUtils.getRed(color);
  var gg = DvtColorUtils.getGreen(color);
  var bb = DvtColorUtils.getBlue(color);

  var newRR = rr + rrRatio * (255 - rr);
  var newGG = gg + ggRatio * (255 - gg);
  var newBB = bb + bbRatio * (255 - bb);
  var newMidColor = DvtColorUtils.makePound(newRR, newGG, newBB);

  rrRatio = (DvtColorUtils.getRed(endLineColor) - DvtColorUtils.getRed(startLineColor)) /
      (255 - DvtColorUtils.getRed(startLineColor));
  ggRatio = (DvtColorUtils.getGreen(endLineColor) - DvtColorUtils.getGreen(startLineColor)) /
      (255 - DvtColorUtils.getGreen(startLineColor));
  bbRatio = (DvtColorUtils.getBlue(endLineColor) - DvtColorUtils.getBlue(startLineColor)) /
      (255 - DvtColorUtils.getBlue(startLineColor));

  rr = DvtColorUtils.getRed(color);
  gg = DvtColorUtils.getGreen(color);
  bb = DvtColorUtils.getBlue(color);

  newRR = rr + rrRatio * (255 - rr);
  newGG = gg + ggRatio * (255 - gg);
  newBB = bb + bbRatio * (255 - bb);
  var newEndColor = DvtColorUtils.makePound(newRR, newGG, newBB);

  return [color, newMidColor, newEndColor];
};


DvtAfPanelCard.prototype._render = function(availWidth, availHeight) {
  DvtAfPanelCard.superclass._render.call(this, availWidth, availHeight);


  // add event listeners
  var cbObj = this.getAfContext().getPanelCardCallbackObj();
  var cbFunc = this.getAfContext().getPanelCardCallback();

  if (cbObj && cbFunc) {
    this.addEvtListener(cbFunc, cbObj);
  }

};


DvtAfPanelCard.prototype._loadDetailItem = function(sdi, reload) {
  // create display object if not exists
  if (reload || (! sdi.getDisplayObj())) {
    var diagram = this._getDiagram();
    if (diagram) {
      var afContext = diagram.createAfContext(this._getNodeId());
      afContext.setParentNode(this._getNode());

      // save context callback for action and showPopup events
      afContext.setContextCallback(this.getContextCallbackObj(),
                                   this.getContextCallback());

      //get panelCard's size after layout
      afContext.setAvailableWidth(this._acw);
      afContext.setAvailableHeight(this._ach);
      afContext.setTabStopsArray(this._getNode().getTabStopsArray());

      this._savedAfContext = this.getAfContext();
      this.setAfContext(afContext);

      var newSdi = sdi.stamp(afContext.getELContext());
      newSdi.setParent(this);
      var childDO = newSdi.createDisplayObj(afContext);

      sdi = this._insertChild(sdi, newSdi);

      sdi.SetLoaded(true);
      DvtAfPanelCard._setItemDisplayableVisible(sdi, true);
    }
  }
  return sdi;
};


/**
 * @private
 * Insert new show detail item in panel card at the existing show detail item index
 * @param {DvtAfShowDetailItem} oldsdi  old show detail item
 * @param {DvtAfShowDetailItem} newsdi  new show detail item
 * @return {DvtAfShowDetailItem} inserted new show detail item
 */
DvtAfPanelCard.prototype._insertChild = function(oldsdi, newsdi) {
  var index = -1;
  var child;
  var sdi;

  for (var i = 0; i < this.getNumChildren(); i++) {
    child = this.getChildAt(i);
    if (child === oldsdi) {
      index = i;
      break;
    }
  }

  //remove oldsdi from the afcomp tree
  var children = this._getChildren();
  if (index >= 0) {
    children.splice(index, 1, newsdi);
  }
  else {
    children.push(newsdi);
  }

  //Bug 20407864 - panel card refresh issue if more than 5 cards present in hv
  //oldsdi index is component index and cannot be used by display object to insert child at that index
  //add newsdi display object as first child of current display object
  this.getDisplayObj().addChildAt(newsdi.getDisplayObj(), 0);

  return newsdi;
};

DvtAfPanelCard.prototype.isSwipeTarget = function() {
  return this.getDetailItemCount() > 1;
};

DvtAfPanelCard.prototype.handleSwipe = function(deltaX, deltaY) {
  if (Math.abs(deltaX) > 20 && Math.abs(deltaY / deltaX) < 2) {
    if (deltaX > 0) {
      this.HandlePrevButtonClick(null);
    }
    else {
      this.HandleNextButtonClick(null);
    }
    return true;
  }
  return false;
};

DvtAfPanelCard.prototype.postRenderSelfBeforeChildren = function() {
  var node = this._getNode();

  if (this.getNodeShape() === DvtAfPanelCard.SHAPE_ELLIPSE &&
      node && node.stageToLocal) {

    var rootNode = DvtAfPanelCard._getNodeContentRoot(node);
    var zoomPct = this.getZoomPct();

    //use 10 pixels padding between the outer node ellipse and
    //the panelCard flattened ellipse;
    //padding must be scaled by zoom pct
    var padding = 10.0 * zoomPct;

    //need to scale the nodeDef width and height by the
    //current zoom pct
    var nodeDefWidth = this.getNodeWidth() * zoomPct;
    var nodeDefHeight = this.getNodeHeight() * zoomPct;

    //get the panelCard bounds in the panelCard's own coordinate system
    var rect = this.getBounds();
    var pcTopLeft = new DvtPoint(rect.x, rect.y);
    var pcBottomRight = new DvtPoint(rect.x + rect.w, rect.y + rect.h);

    var shape = this._getGroupDO();

    //convert the bounds to global coords
    var globalPCTopLeft = shape.localToStage(pcTopLeft);
    var globalPCBottomRight = shape.localToStage(pcBottomRight);

    //convert the bounds to rootNode coords
    var rootPCTopLeft = rootNode.stageToLocal(globalPCTopLeft);
    var rootPCBottomRight = rootNode.stageToLocal(globalPCBottomRight);

    //ellipse equation:
    //(x - h)^2   (y - k)^2
    //--------- + --------- = 1
    //   a^2         b^2
    //
    //solve for x:
    //            /       /     (y - k)^2 \ \
    //x = h + sqrt| a^2 * | 1 - ---------  | |
    //            \       \        b^2    / /

    var eA = (nodeDefWidth - 2 * padding) / 2;
    var eB = (nodeDefHeight - 2 * padding) / 2;
    var eH = nodeDefWidth / 2;
    var eK = nodeDefHeight / 2;

    //get the corner points of the flattened ellipse in rootNode coords
    var topLeftX = this._solveEllipseForX(eA, eB, eH, eK, rootPCTopLeft.y);
    var topRightX = nodeDefWidth - topLeftX;

    var bottomLeftX = this._solveEllipseForX(eA, eB, eH, eK, rootPCBottomRight.y);
    var bottomRightX = nodeDefWidth - bottomLeftX;

    var tmpNum;
    if (topLeftX > topRightX) {
      tmpNum = topLeftX;
      topLeftX = topRightX;
      topRightX = tmpNum;
    }
    if (bottomLeftX > bottomRightX) {
      tmpNum = bottomLeftX;
      bottomLeftX = bottomRightX;
      bottomRightX = tmpNum;
    }

    //convert the corner points to the panelCard's coordinate system
    var pTopLeft = shape.stageToLocal(rootNode.localToStage(new DvtPoint(topLeftX, rootPCTopLeft.y)));
    var pTopRight = shape.stageToLocal(rootNode.localToStage(new DvtPoint(topRightX, rootPCTopLeft.y)));
    var pBottomLeft = shape.stageToLocal(rootNode.localToStage(new DvtPoint(bottomLeftX, rootPCBottomRight.y)));
    var pBottomRight = shape.stageToLocal(rootNode.localToStage(new DvtPoint(bottomRightX, rootPCBottomRight.y)));

    //convert the center point to the panelCard's coordinate system
    var eCenter = shape.stageToLocal(rootNode.localToStage(new DvtPoint(eH, eK)));

    //draw the flattened ellipse
    this.drawFlattenedEllipse(pTopLeft.x, pTopRight.x, pTopLeft.y,
                              pBottomLeft.x, pBottomRight.x, pBottomLeft.y,
                              eCenter.x, eCenter.y, eA, eB, shape);

  }

};


/**
 * Solve the ellipse equation for x.
 *
 * @param eA horizontal radius of ellipse
 * @param eB vertical radius of ellipse
 * @param eH horizontal center of ellipse
 * @param eK vertical center of ellipse
 * @param eY vertical coord to find x coord for
 *
 * @return x coord for given y coord on ellipse
 */
DvtAfPanelCard.prototype._solveEllipseForX = function(eA, eB, eH, eK, eY) {

  //ellipse equation:
  //(x - h)^2   (y - k)^2
  //--------- + --------- = 1
  //   a^2         b^2
  //
  //solve for x:
  //            /       /     (y - k)^2 \ \
  //x = h + sqrt| a^2 * | 1 - ---------  | |
  //            \       \        b^2    / /

  var yk2 = (eY - eK) * (eY - eK);
  var b2 = eB * eB;

  return eH + eA * Math.sqrt(1.0 - yk2 / b2);
};


/**
 * Convenience method to draw an ellipse.
 *
 * @param iX x coord
 * @param iY y coord
 * @param iWidth width
 * @param iHeight height
 */
DvtAfPanelCard.prototype.drawFlattenedEllipse = function(
    iX1L, iX1R, iY1, iX2L, iX2R, iY2, centerX, centerY, radiusX, radiusY, 
    bgShape, style) {

  var iHeight = Math.abs(iY1 - iY2);
  var iWidth1 = Math.abs(iX1R - iX1L);
  var iWidth2 = Math.abs(iX2R - iX2L);

  if (! style)
    style = this.getCSSStyle();

  var bgColor;
  var bdColor;
  var bdWidth;
  var bgImg;
  var sFillType;
  var sBorderType;

  if (style) {
    bgColor = style.getStyle(DvtCSSStyle.BACKGROUND_COLOR);
    bdColor = DvtAfComponent.getBorderColor(style);
    bdWidth = style.getBorderWidth();
    bgImg = style.getBackgroundImage();

    //TODO: need fill_type???
    sFillType = style.getStyle(DvtCSSStyle.FILL_TYPE);
    sBorderType = style.getStyle(DvtCSSStyle.BORDER_TYPE);
  }

  if (bgColor || bdColor) {
    var halfThick = 0;
    if (bdWidth > 1)
      halfThick = Math.floor(bdWidth / 2.0);

    //solve for points on ellipse:
    //x = h + a * cos(t);
    //y = k + b * sin(t);

    //Math.acos() returns angle in radians between 0 and PI, so convert to degrees
    //and adjust for angles between 0 and -PI
    var startAngle = Math.acos((iX1R - centerX) / radiusX) * (180.0 / Math.PI);
    var endAngle = Math.acos((iX2R - centerX) / radiusX) * (180.0 / Math.PI);
    if (iY1 < centerY)
      startAngle = - startAngle;
    if (iY2 < centerY)
      endAngle = - endAngle;
    var angleSpan = endAngle - startAngle;

    //calc right arc clockwise
    var points = this.getArcPoints(centerX, centerY, radiusX, radiusY, startAngle / 360.0, angleSpan / 360.0, 20);
    var point;
    var point2;
    var startI;
    var endI;
    var cornerRadius = 8;
    var tmpLength;

    //figure out where to round the corners between flat horizontal segments
    //and arc segments
    tmpLength = 0;
    startI = 0;
    endI = points.length - 1;
    //calculate accumulated length along start of arc until it's bigger
    //than the desired corner radius, and use the next arc point as the
    //connection point
    for (var i = 0; i < points.length - 1; i++) {
      point = points[i];
      point2 = points[i + 1];
      tmpLength += Math.sqrt((point2.x - point.x) * (point2.x - point.x) +
                             (point2.y - point.y) * (point2.y - point.y));

      if (tmpLength > cornerRadius) {
        startI = i + 1;
        if (startI > points.length - 1)
          startI = points.length - 1;
        break;
      }
    }

    //calculate accumulated length along end of arc until it's bigger
    //than the desired corner radius, and use the prev arc point as the
    //connection point
    tmpLength = 0;
    for (var i = points.length - 2; i > 0; i--) {
      point = points[i];
      point2 = points[i + 1];
      tmpLength += Math.sqrt((point2.x - point.x) * (point2.x - point.x) +
                             (point2.y - point.y) * (point2.y - point.y));

      if (tmpLength > cornerRadius) {
        endI = i;
        if (endI < 0)
          endI = 0;
        break;
      }
    }

    //draw top horizontal line left-to-right
    //draw rounded corner connecting top line to right arc
    var cmds = DvtPathUtils.moveTo(iX1L + cornerRadius, iY1) +
               DvtPathUtils.lineTo(iX1R - cornerRadius, iY1) +
               DvtPathUtils.quadTo(iX1R, iY1, points[startI].x, points[startI].y);

    //draw right arc clockwise
    for (i = startI; i <= endI; i++) {
      point = points[i];
      cmds += DvtPathUtils.lineTo(point.x, point.y);
    }

    //draw rounded corner connecting right arc to bottom line
    //draw bottom horizontal line right-to-left
    cmds += DvtPathUtils.quadTo(iX2R, iY2, iX2R - cornerRadius, iY2) +
        DvtPathUtils.lineTo(iX2L + cornerRadius, iY2);

    //calc left arc clockwise
    points = this.getArcPoints(centerX, centerY, radiusX, radiusY, (180.0 - endAngle) / 360.0, angleSpan / 360.0, 20);

    //flip start and end I because left arc points are in reverse order from right arc
    //(right arc goes from top to bottom, but left arc goes from bottom to top)
    i = startI;
    startI = points.length - 1 - endI;
    endI = points.length - 1 - i;

    //draw rounded corner connecting bottom line to left arc
    cmds += DvtPathUtils.quadTo(iX2L, iY2, points[startI].x, points[startI].y);

    //draw left arc clockwise
    for (i = startI; i <= endI; i++) {
      point = points[i];
      cmds += DvtPathUtils.lineTo(point.x, point.y);
    }

    //finish by drawing rounded corner connecting left arc
    //to top line
    cmds += DvtPathUtils.quadTo(iX1L, iY1, iX1L + cornerRadius, iY1) +
            DvtPathUtils.closePath();

    if (bgShape && bgShape.setCmds)
      bgShape.setCmds(cmds);
  }

  if (bgColor) {
    this.RenderBackgroundFill(bgShape, style, bgColor);
  }

  this.RenderBackgroundStroke(bgShape, style);

  //draw background-image, if url is specified
  this.RenderBackgroundImage(bgShape, style, bgImg);

};


//
// Angles are expressed as a number between 0 and 1.  .25 = 90 degrees.
// If you prefer using degrees, write 90 degrees like so "90/360".
/**
 * Get the points along an arc.
 *
 * @param centerX center of arc
 * @param centerY center of arc
 * @param radiusX horizontal radius of arc
 * @param radiusY vertical radius of arc
 * @param startAngle starting angle of arc, expressed as fraction
 *        between 0 and 1, for example 90.0 / 360.0, with angle 0
 *        pointing to the right along the x axis
 * @param arcAngle angle arc spans, expressed as fraction
 *        between 0 and 1, for example 145.0 / 360.0, with
 *        positive angles drawing clockwise from starting angle
 * @param steps number of points on arc to calculate
 *
 * @return array of points on arc
 */
DvtAfPanelCard.prototype.getArcPoints = function(
    centerX, centerY, radiusX, radiusY, startAngle, arcAngle, steps) {

  var points = [];

  // For convenience, store the number of radians in a full circle.
  var twoPI = 2 * Math.PI;

  // To determine the size of the angle between each point on the
  // arc, divide the overall angle by the total number of points.
  var angleStep = arcAngle / steps;

  // Determine coordinates of first point using basic circle math.
  var xx = centerX + Math.cos(startAngle * twoPI) * radiusX;
  var yy = centerY + Math.sin(startAngle * twoPI) * radiusY;

  // Add the first point.
  points.push(new DvtPoint(xx, yy));

  // Calculate each point on the arc.
  for (var i = 1; i <= steps; i++) {
    // Increment the angle by "angleStep".
    var angle = startAngle + i * angleStep;

    // Determine next point's coordinates using basic circle math.
    xx = centerX + Math.cos(angle * twoPI) * radiusX;
    yy = centerY + Math.sin(angle * twoPI) * radiusY;

    // Add the next point.
    points.push(new DvtPoint(xx, yy));
  }

  return points;
};


/**
 * Transition from the old to the new detail item.
 *
 * @param {string} effect transition effect identifier
 * @param {boolean} bForward true if moving to the next detail item,
 *        false if moving to the previous detail item
 * @param {function} updateKeyboardEffectOnEnd optional function that updates focus effect on the new detail item after transition is done
 * @protected
 */
DvtAfPanelCard.prototype.TransitionDisplayItems = function(effect, bForward, updateKeyboardEffectOnEnd) {

  var node;
  var p;

  if (effect == DvtAfPanelCard.EFFECT_SLIDE_HORZ) {
    // add clipPath for transition
    this._addTransitionClipPath();

    p = this.TransitionSlideHorizontal(bForward);
  }
  else if (effect == DvtAfPanelCard.EFFECT_FLIP_HORZ) {
    node = this._getNode();
    var oldChild = this._oldChild ? this._oldChild.getDisplayObj() : null;
    var child = this._child ? this._child.getDisplayObj() : null;
    p = this.TransitionBitmaps(node, oldChild, child, bForward,
                               this.createCallback(this.createCombinedFlip));
  }
  else if (effect == DvtAfPanelCard.EFFECT_NODE_FLIP_HORZ) {
    node = this._getNode();
    p = this.TransitionBitmaps(node, node, node, bForward,
                               this.createCallback(this.createCombinedFlip));
  }
  else if (effect == DvtAfPanelCard.EFFECT_CUBE_ROTATE_HORZ) {
    node = this._getNode();
    var oldChild = this._oldChild ? this._oldChild.getDisplayObj() : null;
    var child = this._child ? this._child.getDisplayObj() : null;
    p = this.TransitionBitmaps(node, oldChild, child, bForward,
                               this.createCallback(this.createCombinedCube));
  }
  else if (effect == DvtAfPanelCard.EFFECT_NODE_CUBE_ROTATE_HORZ) {
    node = this._getNode();
    p = this.TransitionBitmaps(node, node, node, bForward,
                               this.createCallback(this.createCombinedCube));
  }
  else {
    this.TransitionImmediate();
    this._endTransition();
    if (updateKeyboardEffectOnEnd)
      updateKeyboardEffectOnEnd.call();
  }

  if (p) {
    //disable navigation buttons until transition ends
    //ENH #7281410: initialize old values to true so that
    //if buttons are created before transitioner ends, which could
    //happen if navigating using the popup menu, then the buttons
    //will be live
    var bOldNextME = true;
    var bOldPrevME = true;
    if (this._nextButton) {
      bOldNextME = this._nextButton.isMouseEnabled();
      this._nextButton.setMouseEnabled(false);
    }
    if (this._prevButton) {
      bOldPrevME = this._prevButton.isMouseEnabled();
      this._prevButton.setMouseEnabled(false);
    }

    var thisRef = this;
    var newOnEnd;
    var oldOnEnd = p.getOnEnd();

    if (oldOnEnd) {
      newOnEnd = function() {
      	if (thisRef._nextButton)
      	  thisRef._nextButton.setMouseEnabled(bOldNextME);
      	if (thisRef._prevButton)
      	  thisRef._prevButton.setMouseEnabled(bOldPrevME);

      	oldOnEnd[0].call(oldOnEnd[1]);

        thisRef._endTransition();
        if (updateKeyboardEffectOnEnd)
          updateKeyboardEffectOnEnd.call();
      };
    }
    else {
      newOnEnd = function() {
        if (thisRef._nextButton)
      	  thisRef._nextButton.setMouseEnabled(bOldNextME);
        if (thisRef._prevButton)
      	  thisRef._prevButton.setMouseEnabled(bOldPrevME);

        thisRef._endTransition();
        if (updateKeyboardEffectOnEnd)
          updateKeyboardEffectOnEnd.call();
      };
    }

    p.setOnEnd(newOnEnd, this);
    p.play();

  }
};


/**
 * Transition from the old to the new detail item with
 * a horizontal slide.
 *
 * @param bForward true if moving to the next detail item,
 *        false if moving to the previous detail item
 *
 * @return Transitioner used to animate the transition
 */
DvtAfPanelCard.prototype.TransitionSlideHorizontal = function(bForward) {

  var oldContent = this._oldChild.getDisplayObj();
  var newContent = this._child.getDisplayObj();

  var oldTitleBar = this._oldTitleBar;
  var titleBar = this._titleBar;

  var oldObjs = [];
  var newObjs = [];
  var animator;

  this._setTrainSelectedIndex();

  var offsetX = this.getNodeWidth();
  if (!bForward) {
    offsetX = -offsetX;
  }

  if (oldContent != newContent) {
    oldObjs.push(oldContent);
    newObjs.push(newContent);
    newContent.setTranslateX(newContent.getTranslateX() + offsetX);
  }

  if (oldTitleBar != titleBar) {
    if (oldTitleBar) {
      oldObjs.push(oldTitleBar);
    }
    if (titleBar) {
      newObjs.push(titleBar);
      titleBar.setTranslateX(titleBar.getTranslateX() + offsetX);
    }
  }

  if (oldObjs.length || newObjs.length) {
    animator = new DvtCombinedAnimMoveBy(this.getDvtContext(), oldObjs, newObjs,
        new DvtPoint(-offsetX), new DvtPoint(-offsetX),
        DvtAfPanelCard.EFFECT_DURATION);

    //remove the old sdi at the end of the transition0
    animator.setOnEnd(this.removeOldDisplayItem, this);
    animator.play();
  }
  return animator;
};


/**
 * Transition from the old to the new detail item immediately,
 * with no effect.
 */
DvtAfPanelCard.prototype.TransitionImmediate = function() {
  this.removeOldDisplayItem();

  this._setTrainSelectedIndex();
};


/**
 * Create a CombinedFlip animation.
 *
 * @param oldDispObj old item
 * @param newDispObj new item
 * @param bForward true if navigating forward, false if backward
 *
 * @return Playable object
 */
DvtAfPanelCard.prototype.createCombinedFlip = function(oldDispObj, newDispObj, bForward) {

  var axis = DvtBaseAnimation.AXIS_Y;
  var rotationDir;
  if (bForward)
    rotationDir = DvtBaseAnimation.ROT_DIR_COUNTERCLOCKWISE;
  else
    rotationDir = DvtBaseAnimation.ROT_DIR_CLOCKWISE;

  var playable = new DvtCombinedAnimFlip(this.getDvtContext(),
                                         oldDispObj, newDispObj, axis, rotationDir,
                                         DvtAfPanelCard.EFFECT_DURATION);
  return playable;
};


/**
 * Create a CombinedCube animation.
 *
 * @param oldDispObj old item
 * @param newDispObj new item
 * @param bForward true if navigating forward, false if backward
 *
 * @return Playable object
 */
DvtAfPanelCard.prototype.createCombinedCube = function(oldDispObj, newDispObj, bForward) {

  var axis = DvtBaseAnimation.AXIS_Y;
  var rotationDir;
  if (bForward)
    rotationDir = DvtBaseAnimation.ROT_DIR_COUNTERCLOCKWISE;
  else
    rotationDir = DvtBaseAnimation.ROT_DIR_CLOCKWISE;

  var playable = new DvtCombinedAnimCube(this.getDvtContext(),
                                         oldDispObj, newDispObj, axis, rotationDir,
                                         DvtAfPanelCard.EFFECT_DURATION * 2);
  return playable;
};


/**
 * Transition showDetailItems using bitmap representations instead of the real sprites.
 *
 * @param node node containing this panelCard
 * @param dOld old display object
 * @param dNew new display object
 * @param bForward true if navigating forward, false if backward
 * @param playableCreator function that takes (oldDispObj, newDispObj, bForward) and returns a Playable to use for animating the transition
 *
 * @return Playable to use for animating the transition
 */
DvtAfPanelCard.prototype.TransitionBitmaps = function(
    node, dOld, dNew, bForward, playableCreator) {

  //flag to indicate if this transition is on the whole node
  var oldNode = this._oldNode;

  //RootNode of this node
  var rootNode = DvtAfPanelCard._getNodeContentRoot(node);

  //create bitmapData of old item
  //BUG 10080242: include title bar in transition
  var oldObjs = this.createBitmapDataForTransition(oldNode, oldNode, dOld, this._oldTitleBar);

  //create bitmapData of new item
  //BUG 10080242: include title bar in transition
  var newObjs = this.createBitmapDataForTransition(oldNode, rootNode, dNew, this._titleBar);

  //create the actual animation
  var playable = playableCreator(oldObjs, newObjs, bForward);
  var thisRef = this;

  //Create onEnd function for bitmap transition animation.
  //remove old detail item when transition is done
  var func = function() {
    //update train
    thisRef._setTrainSelectedIndex();

    //remove the oldNode
    if (oldNode) {
      var parent = oldNode.getParent();
      if (parent) {
        parent.removeChild(oldNode);
      }
      thisRef._oldNode = null;
    }
    //remove the old showDetailItem and associated display objects
    else {
      thisRef.removeOldDisplayItem();
    }

    //reapply drop shadow after transition
    //    node.getView().getNodeRenderer().applyDropShadow(node);
  };

  playable.setOnEnd(func, this);

  //return the Playable
  return playable;
};


/**
 * Create a BitmapData for animating a transition.
 *
 * @param dispObj object to create an image of
 * @param titleBar title bar to include in image
 *
 * @return bitmap data representing the given object
 */
DvtAfPanelCard.prototype.createBitmapDataForTransition = function(
    oldNode, node, dispObj, titleBar) {

  if (oldNode) {
    return [node];
  }
  else {
    return [dispObj, titleBar];
  }
};

DvtAfPanelCard.prototype._addTransitionClipPath = function() {
  // save the clippath container
  this._cpContainer = this.CreateNewContainerForChildren();

  var clipPath = new DvtClipPath(this._getUniqueId() + DvtAfComponentUtils._CLIP_PATH_SUFFIX);

  if (this.getNodeShape() == DvtAfPanelCard.SHAPE_ELLIPSE) {
    clipPath.addPath(this._contentPane.getCmds());
  }
  else {
    var dim = DvtAfComponent.getDimensions(this);
    clipPath.addRect(dim.x, dim.y, dim.w, dim.h);
  }

  // add clipPath to the new container
  this._cpContainer.setClipPath(clipPath);
};


DvtAfPanelCard.prototype._removeTransitionClipPath = function() {
  if (this._cpContainer) {

    //    this._cpContainer.setClipPath(null);
    this.RemoveChildrenContainer(this._cpContainer);
    this._cpContainer = null;
  }
};

DvtAfPanelCard.prototype._endTransition = function() {
  //turn off the flag because the transition is over
  this._bTransitioning = false;

  //remove clipPath
  this._removeTransitionClipPath();
};


DvtAfPanelCard._getNodeContentRoot = function(node) {
  var afRoot;
  if (node.GetAfComponentRoot) {
    afRoot = node.GetAfComponentRoot();
  }
  if (afRoot && afRoot.getDisplayObj)
    return afRoot.getDisplayObj();

  return node;
};

DvtAfPanelCard._setTitleBarVisible = function(titleBar, visible) {
  if (titleBar) {
    titleBar.setVisible(visible);
  }
};

DvtAfPanelCard._setItemDisplayableVisible = function(sdi, visible) {
  if (sdi && sdi.SetDOVisible) {
    sdi.SetDOVisible(visible);
  }
};


DvtAfPanelCard.prototype._setTrainSelectedIndex = function() {
  if (this._train) {
    this._train.setSelectedIndex(this.getDisplayedDetailItemIndex());
  }
};


var DvtNavButton = function(panelCard, dvtContext, upState, overState, downState, id) {
  this.Init(panelCard, dvtContext, upState, overState, downState, id);
};

DvtObj.createSubclass(DvtNavButton, DvtButton, 'DvtNavButton');

DvtNavButton.prototype.Init = function(panelCard, dvtContext, upState, overState, downState, id) {
  DvtNavButton.superclass.Init.call(this, dvtContext, upState, overState, downState, id);
  this._panelCard = panelCard;
};

DvtNavButton.prototype.getTooltip = function() {
  return this._panelCard.getNavButtonTooltip(this);
};

/**
 * Returns the aria label of the button
 * @return {String} the aria label
 */
DvtNavButton.prototype.getAriaLabel = function() {
  return this.getTooltip();
};



/**
 * Get panel card this button belongs to.
 * @return {DvtAfPanelCard}
 */
DvtNavButton.prototype.getPanelCard = function() {
  return this._panelCard;
};


/**
 * @constructor
 * DvtAfShowPopupBehavior
 */
var DvtAfShowPopupBehavior = function() {
  this.Init();
};

/*
 * make DvtAfShowPopupBehavior a subclass of DvtPropMap
 */
DvtObj.createSubclass(DvtAfShowPopupBehavior, DvtPropMap, 'DvtAfShowPopupBehavior');

/*
 * Register the DvtAfMarker tag with DvtAfComponentFactory
 */
DvtAfShowPopupBehavior.TAG_NAME = 'spb';
DvtAfComponentFactory.registerComponent(DvtAfShowPopupBehavior.TAG_NAME, DvtAfShowPopupBehavior);


DvtAfShowPopupBehavior.ATTR_POPUP_ID = 'popupId';
DvtAfShowPopupBehavior.ATTR_TRIGGER_TYPE = 'triggerType';
DvtAfShowPopupBehavior.ATTR_ALIGN_ID = 'alignId';
DvtAfShowPopupBehavior.ATTR_ALIGN = 'align';


/**
 * Returns the id of the popup that will be fired by this instance.
 * @return {string} The id of the popup that will be fired.
 */
DvtAfShowPopupBehavior.prototype.getPopupId = function() {
  return this.getProperty(DvtAfShowPopupBehavior.ATTR_POPUP_ID);
};


/**
 * Sets the id of the popup that will be fired by this instance.
 * @param {string} popupId The id of the popup that will be fired.
 */
DvtAfShowPopupBehavior.prototype.setPopupId = function(popupId) {
  this.setProperty(DvtAfShowPopupBehavior.ATTR_POPUP_ID, popupId);
};


/**
 * Returns the interaction type that triggers the popup.
 * @return {string} The the interaction type that triggers the popup.
 */
DvtAfShowPopupBehavior.prototype.getTriggerType = function() {
  return this.getProperty(DvtAfShowPopupBehavior.ATTR_TRIGGER_TYPE);
};


/**
 * Sets the interaction type that triggers the popup.
 * @param {string} triggerType The the interaction type that triggers the popup.
 */
DvtAfShowPopupBehavior.prototype.setTriggerType = function(triggerType) {
  this.setProperty(DvtAfShowPopupBehavior.ATTR_TRIGGER_TYPE, triggerType);
};


/**
 * Returns the id of the object that the popup will be aligned to.
 * @return {string} The id of the object that the popup will be aligned to.
 */
DvtAfShowPopupBehavior.prototype.getAlignId = function() {
  return this.getProperty(DvtAfShowPopupBehavior.ATTR_ALIGN_ID);
};


/**
 * Sets the id of the object that the popup will be aligned to.
 * @param {string} alignId The id of the object that the popup will be aligned to.
 */
DvtAfShowPopupBehavior.prototype.setAlignId = function(alignId) {
  this.setProperty(DvtAfShowPopupBehavior.ATTR_ALIGN_ID, alignId);
};


/**
 * Returns the alignment position for the popup.
 * @return {string} The alignment position for the popup.
 */
DvtAfShowPopupBehavior.prototype.getAlign = function() {
  return this.getProperty(DvtAfShowPopupBehavior.ATTR_ALIGN);
};


/**
 * Sets the alignment position for the popup.
 * @param {string} align The alignment position for the popup.
 */
DvtAfShowPopupBehavior.prototype.setAlign = function(align) {
  this.setProperty(DvtAfShowPopupBehavior.ATTR_ALIGN, align);
};

/*-------------------------------------------------------------------------*/
/*   CreateDisplayObject                                                   */
/*-------------------------------------------------------------------------*/
DvtAfShowPopupBehavior.prototype.createDisplayObj = function(afContext) {
  return new DvtShowPopupBehavior(this.getPopupId(),
                                  this.getTriggerType(),
                                  this.getAlignId(),
                                  this.getAlign());
};

/**
 * @constructor
 * DvtAfClientBehavior
 */
var DvtAfClientBehavior = function() {
  this.Init();
};

/*
 * make DvtAfClientBehavior a subclass of DvtPropMap
 */
DvtObj.createSubclass(DvtAfClientBehavior, DvtPropMap, 'DvtAfClientBehavior');

/*
 * Register the DvtAfClientBehavior tag with DvtAfComponentFactory
 */
DvtAfClientBehavior.TAG_NAME = 'bhvr';
DvtAfComponentFactory.registerComponent(DvtAfClientBehavior.TAG_NAME, DvtAfClientBehavior);

DvtAfClientBehavior.ATTR_TYPE = 'type';
DvtAfClientBehavior.ATTR_TRIGGER_TYPE = 'triggerType';


/**
 * Returns the type of client behavior
 * @return {string} The type of client behavior.
 */
DvtAfClientBehavior.prototype.getType = function() {
  return this.getProperty(DvtAfClientBehavior.ATTR_TYPE);
};


/**
 * Sets the type of client behavior.
 * @param {string} type The type of client behavior.
 */
DvtAfClientBehavior.prototype.setType = function(type) {
  this.setProperty(DvtAfClientBehavior.ATTR_TYPE, type);
};


/**
 * Returns the interaction type that triggers the client behavior.
 * @return {string} The interaction type that triggers the client behavior.
 */
DvtAfClientBehavior.prototype.getTriggerType = function() {
  return this.getProperty(DvtAfClientBehavior.ATTR_TRIGGER_TYPE);
};


/**
 * Sets the interaction type that triggers the client behavior.
 * @param {string} triggerType The interaction type that triggers the client behavior.
 */
DvtAfClientBehavior.prototype.setTriggerType = function(triggerType) {
  this.setProperty(DvtAfClientBehavior.ATTR_TRIGGER_TYPE, triggerType);
};

/*-------------------------------------------------------------------------*/
/*   CreateDisplayObject                                                   */
/*-------------------------------------------------------------------------*/
DvtAfClientBehavior.prototype.createDisplayObj = function(afContext) {
  var behavior = new DvtClientBehavior(this.getType(), this.getTriggerType());
  for (var prop in this._props) {
    if (prop != DvtAfClientBehavior.ATTR_TYPE && prop != DvtAfClientBehavior.ATTR_TRIGGER_TYPE) {
      behavior.setProperty(prop, this.getProperty(prop));
    }
  }
  return behavior;
};

/**
 * @constructor
 * DvtAfGroup
 */
var DvtAfGroup = function() {
  this.Init();
};

/*
 * make DvtAfGroup a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfGroup, DvtAfComponent, 'DvtAfGroup');

/*
 * Register the AfGroup tag with DvtAfComponentFactory
 */
DvtAfGroup.TAG_NAME = 'grp';
DvtAfComponentFactory.registerComponent(DvtAfGroup.TAG_NAME, DvtAfGroup);


/*-------------------------------------------------------------------------*/
/*   AfComponent attributes                                                */
/*-------------------------------------------------------------------------*/
/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfGroup.prototype.GetDefaultStyles = function() {
  return DvtAfGroup._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfGroup.prototype.SetDefaultStyles = function(styleList) {
  DvtAfGroup._afStyles = styleList;
};


DvtAfGroup.prototype.getTagName = function() {
  return DvtAfGroup.TAG_NAME;
};

DvtAfGroup.prototype._hasBgShape = function() {
  return false;
};


/**
 * @override
 */
DvtAfGroup.prototype.stamp = function(elcontext) {
  // Don't stamp out children, only want to stamp out the propMap
  return DvtAfComponent.superclass.stamp.call(this, elcontext);
};
/**
 * @constructor
 * DvtAfPointLocation
 */
var DvtAfPointLocation = function() {
  this.Init();
};

/*
 * make DvtAfPointLocation a subclass of DvtAfComponent
 */
DvtObj.createSubclass(DvtAfPointLocation, DvtAfComponent, 'DvtAfPointLocation');

/*
 * Register the AfPointLocation tag with DvtAfComponentFactory
 */
DvtAfPointLocation.TAG_NAME = 'pLoc';
DvtAfComponentFactory.registerComponent(DvtAfPointLocation.TAG_NAME, DvtAfPointLocation);


/*-------------------------------------------------------------------------*/
/*   AfComponent attributes                                                */
/*-------------------------------------------------------------------------*/
/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfPointLocation.prototype.GetDefaultStyles = function() {
  return DvtAfPointLocation._afStyles;
};


/**
 * @private
 * Note: only need to create one instance of _afStyles per class
 */
DvtAfPointLocation.prototype.SetDefaultStyles = function(styleList) {
  DvtAfPointLocation._afStyles = styleList;
};


DvtAfPointLocation.prototype.getTagName = function() {
  return DvtAfPointLocation.TAG_NAME;
};

DvtAfPointLocation.prototype._hasBgShape = function() {
  return false;
};


/**
 * @override
 */
DvtAfPointLocation.prototype.stamp = function(elcontext) {
  // Don't stamp out children, only want to stamp out the propMap
  return DvtAfComponent.superclass.stamp.call(this, elcontext);
};
