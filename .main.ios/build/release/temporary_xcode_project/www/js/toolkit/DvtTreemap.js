var DvtTreemap=function(a,b,c){this.Init(a,b,c)};DvtObj.createSubclass(DvtTreemap,DvtBaseTreeView,"DvtTreemap");DvtTreemap._BUFFER_SPACE=7;DvtTreemap._MIN_BUFFER_SPACE=1;DvtTreemap._BACKGROUND_FILL_COLOR="#EBEFF5";DvtTreemap._BACKGROUND_BORDER_COLOR="#DBE0EA";DvtTreemap._BACKGROUND_INLINE_DEFAULT="background-color:"+DvtTreemap._BACKGROUND_FILL_COLOR+";border-color:"+DvtTreemap._BACKGROUND_BORDER_COLOR+";border-width:2px";DvtTreemap.newInstance=function(a,b,c){return new DvtTreemap(a,b,c)};
DvtTreemap.prototype.Init=function(a,b,c){DvtTreemap.superclass.Init.call(this,a,b,c);this.Defaults=new DvtTreemapDefaults;this.setId("treemap1000"+Math.floor(1E9*Math.random()))};
DvtTreemap.prototype.ApplyParsedProperties=function(a){DvtTreemap.superclass.ApplyParsedProperties.call(this,a);a=this.getOptions();this._layout="sliceAndDiceHorizontal"==a.layout?new DvtSliceAndDiceLayout(!0):"sliceAndDiceVertical"==a.layout?new DvtSliceAndDiceLayout(!1):new DvtSquarifyingLayout;this._isolatedNodes=[];this._processInitialIsolate(a.isolatedNode);"auto"==a.animationOnDisplay&&(a.animationOnDisplay="alphaFade")};
DvtTreemap.prototype.Layout=function(a){var b="jet"!=this.getOptions()._environment?DvtTreemap._BUFFER_SPACE:DvtTreemap._MIN_BUFFER_SPACE,b=Math.max(Math.ceil(b*Math.min(a.w,a.h)/400),DvtTreemap._MIN_BUFFER_SPACE);a.x+=b;a.y+=b;a.w-=2*b;a.h-=2*b;b=this._layout.getGapSize(this,1);a.x+=b;a.w-=2*b;this.LayoutBreadcrumbs(a);this.LayoutLegend(a);a.x-=b;a.w+=2*b;b=this._isolatedNodes.length;if(0<b&&this._isolateRestoreLayout)this._layout.layout(this,this._isolatedNodes[b-1],a.x,a.y,a.w,a.h,!0);else{this._root&&
this._layout.layout(this,this._root,a.x,a.y,a.w,a.h,!1);for(var c=0;c<b;c++)this._layout.layout(this,this._isolatedNodes[c],a.x,a.y,a.w,a.h,!0)}};
DvtTreemap.prototype.Render=function(a,b){this.RenderBackground(a,DvtTreemap._BACKGROUND_INLINE_DEFAULT);this.RenderBreadcrumbs(a);this.RenderLegend(a);if(this.HasValidData()){this._groupTextLayer=new DvtContainer(this.getCtx());a.addChild(this._groupTextLayer);this._isolatedNode?this._isolatedNode.render(a):this._root.hasChildren()?(this._root.renderChildren(a),this.UpdateAriaNavigation(this._root)):this._root.render(a);this._isolatedLayer=new DvtContainer(this.getCtx());a.addChild(this._isolatedLayer);
this._selectedLayer=new DvtContainer(this.getCtx());a.addChild(this._selectedLayer);a.addChild(this._groupTextLayer);this._hoverEffect=new DvtPolyline(this.getCtx(),[]);this._hoverEffect.setVisible(!1);this._hoverEffect.setMouseEnabled(!1);this._hoverEffect.setPixelHinting(!0);a.addChild(this._hoverEffect);for(var c=0;c<this._isolatedNodes.length;c++){var d=this._isolatedNodes[c].getDisplayable();this._isolatedLayer.addChild(d)}}else this.RenderEmptyText(a)};
DvtTreemap.prototype.OnAnimationEnd=function(){if(!this.AnimationStopped){this._container.removeChildren();var a=new DvtRectangle(0,0,this.Width,this.Height);this.Layout(a);this.Render(this._container);this.ReselectNodes()}DvtTreemap.superclass.OnAnimationEnd.call(this)};
DvtTreemap.prototype.ReselectNodes=function(){for(var a=this._selectionHandler?this._selectionHandler.getSelection():[],b=0;b<a.length;b++)if(0<this._isolatedNodes.length){var c=this._isolatedNodes[this._isolatedNodes.length-1];(a[b]==c||a[b].isDescendantOf(c))&&a[b].setSelected(!0)}else a[b].setSelected(!0)};DvtTreemap.prototype.CreateKeyboardHandler=function(a){return new DvtTreemapKeyboardHandler(a)};
DvtTreemap.prototype.CreateEventManager=function(a,b,c,d){return new DvtTreemapEventManager(a,b,c,d)};DvtTreemap.prototype.GetInitialFocusedItem=function(a){var b=this.__getLastIsolatedNode();return b?this.__getDefaultNavigable(DvtBaseTreeUtils.getLeafNodes(b)):a?this.__getDefaultNavigable(DvtBaseTreeUtils.getLeafNodes(a)):null};DvtTreemap.prototype.__showHoverEffect=function(a,b,c){this._hoverEffect.setPoints(a);this._hoverEffect.setStroke(b);this._hoverEffect.setVisible(!0)};
DvtTreemap.prototype.__hideHoverEffect=function(){this._hoverEffect.setVisible(!1)};DvtTreemap.prototype.__getGroupTextLayer=function(){return this._groupTextLayer};DvtTreemap.prototype.__moveToSelectedLayer=function(a){for(var b=0,c=this._selectedLayer.getNumChildren(),d=0;d<c;d++){var e=this._selectedLayer.getChildAt(d);a.zIndex>e.zIndex&&(b=d+1)}b<c?this._selectedLayer.addChildAt(a,b):this._selectedLayer.addChild(a)};
DvtTreemap.prototype.__getNodeUnderPoint=function(a,b){return 0<this._isolatedNodes.length?this._isolatedNodes[this._isolatedNodes.length-1].getNodeUnderPoint(a,b):this._root.getNodeUnderPoint(a,b)};
DvtTreemap.prototype.__isolate=function(a){var b=this.__getEventManager().getFocus();b&&b.hideKeyboardFocusEffect();this._isolatedNodes.push(a);this.getOptions().isolatedNode=a.getId();this.__dispatchEvent(new DvtTreemapIsolateEvent(a.getId()));this._isolateRestoreLayout=!0;this.Layout(new DvtRectangle(0,0,this.Width,this.Height));this._isolateRestoreLayout=!1;b=a.getDisplayable();this._isolatedLayer.addChild(b);this._renderIsolateRestore(a)};
DvtTreemap.prototype.__restore=function(){var a=this._isolatedNodes.pop();this.getOptions().isolatedNode=0<this._isolatedNodes.length?this._isolatedNodes[this._isolatedNodes.length-1].getId():null;var b=this.__getEventManager().getFocus();b&&b.hideKeyboardFocusEffect();this.__setNavigableIdToFocus(a.getId());this.__dispatchEvent(new DvtTreemapIsolateEvent);this._isolateRestoreLayout=!0;this.Layout(new DvtRectangle(0,0,this.Width,this.Height));this._isolateRestoreLayout=!1;this._renderIsolateRestore(a)};
DvtTreemap.prototype.__getLastIsolatedNode=function(){return this._isolatedNodes&&0<this._isolatedNodes.length?this._isolatedNodes[this._isolatedNodes.length-1]:null};
DvtTreemap.prototype._renderIsolateRestore=function(a){if("none"!=this.getOptions().animationOnDataChange){for(var b=this._selectionHandler?this._selectionHandler.getSelection():[],c=0;c<b.length;c++)b[c].setSelected(!1);a=a.getIsolateAnimation();this.Animation=new DvtParallelPlayable(this.getCtx(),a);this.Animation.setOnEnd(this.OnAnimationEnd,this);this._eventHandler.removeListeners(this);this.Animation.play()}else this.render(null,this.Width,this.Height,!0)};
DvtTreemap.prototype._processInitialIsolate=function(a){if(a&&this._root){var b=this._root.getDescendantNodes();b.push(this._root);for(var c=0;c<b.length;c++)if(b[c].getId()==a){this._isolatedNodes.push(b[c]);break}}};DvtTreemap.prototype.__getDefaultNavigable=function(a){var b=this._eventHandler.getKeyboardHandler();return b?b.getDefaultNavigable(a):a&&0<a.length?a[0]:null};
DvtTreemap.prototype.getShapesForViewSwitcher=function(a){var b={};if(this._root)for(var c=[this._root];0<c.length;){var d=c.splice(0,1)[0],e=d.getId(),g=d.getDisplayable();if(e&&g&&(b[e]=g,b[e+"_text"]=d._text,d._topLeftShape&&g.removeChild(d._topLeftShape),d._fillShape&&g.removeChild(d._fillShape),g.setFill(d.GetFill()),a&&(e=d.GetParent()))){var h=e.getDisplayable(),e=null;if(e=h?h.getParent():this._container)h=e.getChildIndex(h),d._border&&e.addChildAt(d._border,h+1),d._borderBR&&e.addChildAt(d._borderBR,
h+1),d._borderTL&&e.addChildAt(d._borderTL,h+1),d._text&&e.addChildAt(d._text,h+1),e.addChildAt(g,h+1)}(d=d.getChildNodes())&&(c=c.concat(d))}return b};DvtTreemap.prototype.GetComponentDescription=function(){return DvtBundle.getTranslation(this.getOptions(),"componentName",DvtBundle.UTIL_PREFIX,"TREEMAP")};DvtTreemap.prototype.getBundlePrefix=function(){return DvtBundle.TREEMAP_PREFIX};DvtTreemap.prototype.CreateNode=function(a){return new DvtTreemapNode(this,a)};
var DvtTreemapNode=function(a,b){this.Init(a,b);var c=this._view.getOptions(),d=c.nodeDefaults,e=d.header,g=b.header?b.header:{};this._groupLabelDisplay=b.groupLabelDisplay?b.groupLabelDisplay:d.groupLabelDisplay;this._labelDisplay=b.labelDisplay?b.labelDisplay:d.labelDisplay;this._labelHalign=b.labelHalign?b.labelHalign:d.labelHalign;this._labelValign=b.labelValign?b.labelValign:d.labelValign;this._headerHalign=g.labelHalign?g.labelHalign:e.labelHalign;this._headerLabelStyle=g.labelStyle?new DvtCSSStyle(g.labelStyle):
null;this._bHeaderUseNodeColor="on"==(g.useNodeColor?g.useNodeColor:e.useNodeColor);this._isolate=g.isolate?g.isolate:e.isolate;"auto"==this._isolate&&(this._isolate=DvtAgent.isTouchDevice()?"off":"on");this._bIsolated=null!=c.isolatedNode&&c.isolatedNode==this.getId()};DvtObj.createSubclass(DvtTreemapNode,DvtBaseTreeNode,"DvtTreemapNode");DvtTreemapNode.TEXT_STYLE_HEADER="header";DvtTreemapNode.TEXT_STYLE_NODE="node";DvtTreemapNode.TEXT_STYLE_OFF="off";DvtTreemapNode.TEXT_BUFFER_HORIZ=4;
DvtTreemapNode.TEXT_BUFFER_VERT=2;DvtTreemapNode.MIN_TEXT_BUFFER=2;DvtTreemapNode._LINE_FUDGE_FACTOR=1;DvtTreemapNode._ANIMATION_ISOLATE_DURATION=.3;DvtTreemapNode._MIN_TITLE_BAR_HEIGHT=15;DvtTreemapNode._MIN_TITLE_BAR_HEIGHT_ISOLATE=15;DvtTreemapNode.DEFAULT_HEADER_BORDER_WIDTH=1;DvtTreemapNode.DEFAULT_HEADER_WITH_NODE_COLOR_ALPHA=.5;DvtTreemapNode._ISOLATE_ICON_SIZE=12;DvtTreemapNode._ISOLATE_GAP_SIZE=1;DvtTreemapNode._ISOLATE_TOUCH_BUFFER=2;DvtTreemapNode.DEFAULT_NODE_TOP_BORDER_COLOR="#FFFFFF";
DvtTreemapNode.DEFAULT_NODE_BOTTOM_BORDER_COLOR="#000000";DvtTreemapNode.DEFAULT_NODE_BORDER_WIDTH=1;DvtTreemapNode.DEFAULT_NODE_BORDER_OPACITY=.3;DvtTreemapNode.DEFAULT_NODE_PATTERN_BORDER_OPACITY=.15;DvtTreemapNode.MIN_SIZE_FOR_BORDER=2*DvtTreemapNode.DEFAULT_NODE_BORDER_WIDTH;DvtTreemapNode.GROUP_HOVER_INNER_OPACITY=.8;DvtTreemapNode.GROUP_HOVER_INNER_WIDTH=3;DvtTreemapNode.NODE_HOVER_OPACITY=1;DvtTreemapNode.NODE_SELECTION_WIDTH=2;
DvtTreemapNode.prototype.render=function(a){if(this._hasLayout){this._shape=this._createShapeNode();a.addChild(this._shape);var b;this.hasChildren()?(this._childNodeGroup=new DvtContainer(this.getView().getCtx()),this._shape.addChild(this._childNodeGroup),this.renderChildren(this._childNodeGroup)):b=this.GetTemplate();if(b){var c=this.GetElAttributes(),d=this.GetAfContext();d.setELContext(c);var c=DvtTreemapNode.DEFAULT_NODE_BORDER_WIDTH+DvtTreemapNode._LINE_FUDGE_FACTOR,e=DvtTreemapNode.TEXT_BUFFER_HORIZ,
g=DvtTreemapNode.TEXT_BUFFER_VERT,h=this._width-2*e-c,k=this._height-2*g-c;0<h&&0<k&&(d.setAvailableWidth(h),d.setAvailableHeight(k),d.setFontSize(this.GetTextSize()),this._contentRoot=b=DvtAfComponentFactory.parseAndLayout(d,b,this._shape),DvtAgent.isRightToLeft(a.getCtx())?(a=b.getDimensions(),a=this._x+this._width-e-.5*c-a.w):a=this._x+e+.5*c,b.setTranslate(a,this._y+g+.5*c))}else this._text=this._createTextNode(this._shape),null!=this._text&&this._pattern&&this._textStyle!=DvtTreemapNode.TEXT_STYLE_HEADER&&
(c=this._text.measureDimensions(),this._textBackground=new DvtRect(this.getView().getCtx(),c.x,c.y,c.w,c.h),this._textBackground.setSolidFill("#FFFFFF"),this._textBackground.setMouseEnabled(!1),this._shape.addChild(this._textBackground),this._addChildText(this._text));this.hasChildren()?this._shape.setAriaRole("group"):this._shape.setAriaRole("img");this.UpdateAriaLabel()}};
DvtTreemapNode.prototype.setSelected=function(a){DvtTreemapNode.superclass.setSelected.call(this,a);if(this._shape){a=this.getView().getOptions().nodeDefaults;var b=a.header;if(this.isSelected()){var c=this._x,d=this._y+DvtTreemapNode._LINE_FUDGE_FACTOR,e=this._width-DvtTreemapNode._LINE_FUDGE_FACTOR,g=this._height-DvtTreemapNode._LINE_FUDGE_FACTOR;DvtAgent.isPlatformWebkit()&&(d-=DvtTreemapNode._LINE_FUDGE_FACTOR);this._removeChildShape(this._selectionOuter);this._removeChildShape(this._selectionInner);
this._selectionInner=this._selectionOuter=null;this._selectionOuter=new DvtRect(this.getView().getCtx(),c,d,e,g);this._selectionOuter.setMouseEnabled(!1);this._selectionOuter.setFill(null);this._selectionOuter.setPixelHinting(!0);this._shape.addChild(this._selectionOuter);this._selectionInner=new DvtRect(this.getView().getCtx(),c+1,d+1,e-2,g-2);this._selectionInner.setMouseEnabled(!1);this._selectionInner.setFill(null);this._selectionInner.setPixelHinting(!0);this._shape.addChild(this._selectionInner);
this._textStyle==DvtTreemapNode.TEXT_STYLE_HEADER?(this.IsHover||this.isShowingKeyboardFocusEffect()?this._innerShape.setSolidFill(b.hoverBackgroundColor):(this._innerShape.setSolidFill(b.selectedBackgroundColor),this._text&&this.ApplyHeaderTextStyle(this._text,"_selectedLabelStyle")),this._selectionOuter.setSolidStroke(b.selectedOuterColor),this._selectionInner.setSolidStroke(b.selectedInnerColor),DvtAgent.isTouchDevice()&&(this._isolateButton=this._createIsolateRestoreButton(this._shape))):(this._selectionOuter.setSolidStroke(a.selectedOuterColor),
this._selectionInner.setSolidStroke(a.selectedInnerColor),DvtAgent.isBrowserSafari()||DvtAgent.isPlatformGecko()||this._shape.addDrawEffect(DvtBaseTreeNode.__NODE_SELECTED_SHADOW),this.getView().__moveToSelectedLayer(this._shape))}else this._removeChildShape(this._selectionInner),this._selectionInner=null,DvtAgent.isTouchDevice()&&this._removeIsolateRestoreButton(),this._textStyle==DvtTreemapNode.TEXT_STYLE_HEADER?(this.IsHover||this.isShowingKeyboardFocusEffect()?this._innerShape.setSolidFill(b.hoverBackgroundColor):
(this.ApplyHeaderStyle(this._shape,this._innerShape),this._text&&(this.isDrillReplaceEnabled()?this.ApplyHeaderTextStyle(this._text,"_drillableLabelStyle"):this.ApplyHeaderTextStyle(this._text,"labelStyle"))),this._selectionOuter&&(this.IsHover||this.isShowingKeyboardFocusEffect()?this._selectionOuter.setSolidStroke(b.hoverOuterColor):(this._removeChildShape(this._selectionOuter),this._selectionOuter=null))):(this._shape.removeAllDrawEffects(),this._selectionOuter&&(this._removeChildShape(this._selectionOuter),
this._selectionOuter=null),(a=this.GetParent())&&a._childNodeGroup&&a._childNodeGroup.addChild(this._shape))}};
DvtTreemapNode.prototype.showHoverEffect=function(){if(this._shape&&this._hasLayout){var a=this.getView().getOptions().nodeDefaults,b=a.header,c=this._view.__getLastIsolatedNode();if(null==c||c==this||this.isDescendantOf(c)){var c=[],d,e,g,h;this._textStyle==DvtTreemapNode.TEXT_STYLE_HEADER?(this._innerShape.setSolidFill(b.hoverBackgroundColor),this._selectionOuter||(a=this._x,d=this._y+DvtTreemapNode._LINE_FUDGE_FACTOR,e=this._width-DvtTreemapNode._LINE_FUDGE_FACTOR,g=this._height-DvtTreemapNode._LINE_FUDGE_FACTOR,
DvtAgent.isPlatformWebkit()&&(d-=DvtTreemapNode._LINE_FUDGE_FACTOR),this._selectionOuter=new DvtRect(this.getView().getCtx(),a,d,e,g),this._selectionOuter.setMouseEnabled(!1),this._selectionOuter.setFill(null),this._selectionOuter.setPixelHinting(!0),this._shape.addChild(this._selectionOuter)),this._selectionOuter.setSolidStroke(this.isSelected()?b.selectedOuterColor:b.hoverOuterColor),d=this._x+DvtTreemapNode.GROUP_HOVER_INNER_WIDTH/2+DvtTreemapNode._LINE_FUDGE_FACTOR,g=this._x+this._width-DvtTreemapNode.GROUP_HOVER_INNER_WIDTH/
2-DvtTreemapNode._LINE_FUDGE_FACTOR,e=this._y+this._titleBarHeight,h=this._y+this._height-DvtTreemapNode.GROUP_HOVER_INNER_WIDTH/2-DvtTreemapNode._LINE_FUDGE_FACTOR,c.push(g,e,g,h,d,h,d,e),b=new DvtSolidStroke(b.hoverInnerColor,DvtTreemapNode.GROUP_HOVER_INNER_OPACITY,DvtTreemapNode.GROUP_HOVER_INNER_WIDTH),this._text&&(this.isDrillReplaceEnabled()?this.ApplyHeaderTextStyle(this._text,"_drillableHoverLabelStyle"):this.ApplyHeaderTextStyle(this._text,"_hoverLabelStyle"))):(d=this._x+DvtTreemapNode.NODE_SELECTION_WIDTH/
2,g=this._x+this._width-DvtTreemapNode.NODE_SELECTION_WIDTH/2,e=this._y+DvtTreemapNode.NODE_SELECTION_WIDTH/2,h=this._y+this._height-DvtTreemapNode.NODE_SELECTION_WIDTH/2,c.push(this._x,e,g,e,g,h,d,h,d,e),b=new DvtSolidStroke(a.hoverColor,DvtTreemapNode.NODE_HOVER_OPACITY,DvtTreemapNode.NODE_SELECTION_WIDTH));this.getView().__showHoverEffect(c,b,this)}}};
DvtTreemapNode.prototype.hideHoverEffect=function(){if(this._shape&&this._hasLayout){var a=this.getView().getOptions().nodeDefaults.header;this._textStyle==DvtTreemapNode.TEXT_STYLE_HEADER&&(this.isSelected()?(this._innerShape.setSolidFill(a.selectedBackgroundColor),this._selectionOuter.setSolidStroke(a.selectedOuterColor),this._text&&(this.isDrillReplaceEnabled()?this.ApplyHeaderTextStyle(this._text,"_drillableSelectedLabelStyle"):this.ApplyHeaderTextStyle(this._text,"_selectedLabelStyle"))):(this.ApplyHeaderStyle(this._shape,
this._innerShape),this._selectionOuter&&(this._shape.removeChild(this._selectionOuter),this._selectionOuter=null),this._text&&(this.isDrillReplaceEnabled()?this.ApplyHeaderTextStyle(this._text,"_drillableLabelStyle"):this.ApplyHeaderTextStyle(this._text,"labelStyle"))));this.getView().__hideHoverEffect()}};
DvtTreemapNode.prototype.highlight=function(a,b){this.hasChildren()?(this._text&&this._text.setAlpha(b),this._textStyle==DvtTreemapNode.TEXT_STYLE_HEADER&&this._bHeaderUseNodeColor&&this._innerShape&&this._innerShape.setAlpha(b)):DvtTreemapNode.superclass.highlight.call(this,a,b)};DvtTreemapNode.prototype.isIsolateEnabled=function(){return"off"!=this._isolate&&this._textStyle==DvtTreemapNode.TEXT_STYLE_HEADER};
DvtTreemapNode.prototype.getPopupBounds=function(a){return a&&a.getAlign()?new DvtRectangle(this._x,this._y,this._width,this._height):DvtTreemapNode.superclass.getPopupBounds.call(this,a)};
DvtTreemapNode.prototype.getNextNavigable=function(a){var b;if(a.type==DvtMouseEvent.CLICK)return DvtTreemapNode.superclass.getNextNavigable.call(this,a);b=a.keyCode;if(b==DvtKeyboardEvent.SPACE&&a.ctrlKey)return this;if(b==DvtKeyboardEvent.UP_ARROW&&a.altKey||b==DvtKeyboardEvent.CLOSE_BRACKET)(b=this.GetParent())&&b.getId()!=this.getView().getRootNode().getId()?(a=b,b.MarkAsLastVisitedChild()):a=this;else if(b==DvtKeyboardEvent.DOWN_ARROW&&a.altKey||b==DvtKeyboardEvent.OPEN_BRACKET)a=(a=this.GetLastVisitedChild())?
a:this.hasChildren()?this.getView().__getDefaultNavigable(this.getChildNodes()):this;else{var c=this.getView().__getLastIsolatedNode(),d=0;if(c)if(this==c)d=0;else for(b=this.GetParent(),d=1;c!=b;)d++,b=b.GetParent();else{for(c=this;c.GetParent();)c=c.GetParent();d=this.GetDepth()}b=this.GetNodesAtDepth(c,d);a=DvtKeyboardHandler.getNextNavigable(this,a,b)}a.MarkAsLastVisitedChild();return a};
DvtTreemapNode.prototype.getKeyboardBoundingBox=function(a){return new DvtRectangle(this._x,this._y,this._width,this._height)};DvtTreemapNode.prototype.getTargetElem=function(){return this._shape?this._shape.getElem():null};DvtTreemapNode.prototype.setZIndex=function(a){this._zIndex=a};
DvtTreemapNode.prototype.setLayoutParams=function(a,b,c,d){if(!(0>=c||0>=d)){this._hasLayout=!0;this._oldState=this.GetAnimationParams();this._x=a;this._y=b;this._width=c?c:0;this._height=d?d:0;this.hasChildren()?this._textStyle=this._groupLabelDisplay:this._textStyle=this._labelDisplay;this._textStr||(this._textStyle=DvtTreemapNode.TEXT_STYLE_OFF);if(this._textStyle==DvtTreemapNode.TEXT_STYLE_HEADER){this._titleBarHeight=DvtTreemapNode._MIN_TITLE_BAR_HEIGHT;a=new DvtOutputText(this.getView().getCtx(),
this._textStr);a.setFontSize(this.GetTextSize());this.ApplyHeaderTextStyle(a,"labelStyle");a=DvtTextUtils.guessTextDimensions(a).h;this._titleBarHeight=Math.max(this._titleBarHeight,a);this.isIsolateEnabled()&&(this._titleBarHeight=Math.max(this._titleBarHeight,DvtTreemapNode._MIN_TITLE_BAR_HEIGHT_ISOLATE));a=this._x;b=this._y+this._titleBarHeight;c=this._width;d=this._height-this._titleBarHeight;if(0<=c&&0<=d)return new DvtRectangle(a,b,c,d);this._textStyle=null}return new DvtRectangle(this._x,this._y,
this._width,this._height)}};DvtTreemapNode.prototype.getNodeUnderPoint=function(a,b){if(this.contains(a,b)||!this._hasLayout){for(var c=this.getChildNodes(),d=0;d<c.length;d++)if(c[d].contains(a,b))return c[d].getNodeUnderPoint(a,b);if(this._hasLayout)return this}return null};DvtTreemapNode.prototype.contains=function(a,b){return a>=this._x&&a<=this._x+this._width&&b>=this._y&&b<=this._y+this._height};
DvtTreemapNode.prototype.GetAnimationParams=function(){var a=DvtColorUtils.getRed(this._color),b=DvtColorUtils.getGreen(this._color),c=DvtColorUtils.getBlue(this._color);return[this._x,this._y,this._width,this._height,a,b,c,this.hasChildren()?0:Math.random()]};DvtTreemapNode.prototype.SetAnimationParams=function(a){this.setLayoutParams(a[0],a[1],a[2],a[3]);var b=Math.round(a[4]),c=Math.round(a[5]);a=Math.round(a[6]);this._color=DvtColorUtils.makeRGB(b,c,a);this._updateShapes()};
DvtTreemapNode.prototype.getIsolateAnimation=function(){for(var a=[this._getIsolateAnimation()],b=this.getDescendantNodes(),c=0;c<b.length;c++)a.push(b[c]._getIsolateAnimation());return a};
DvtTreemapNode.prototype._getIsolateAnimation=function(){if(this._oldState){var a=new DvtCustomAnimation(this.getView().getCtx(),this,DvtTreemapNode._ANIMATION_ISOLATE_DURATION);a.getAnimator().addProp(DvtAnimator.TYPE_NUMBER_ARRAY,this,this.GetAnimationParams,this.SetAnimationParams,this.GetAnimationParams());this.SetAnimationParams(this._oldState);return a}return null};
DvtTreemapNode.prototype.animateUpdate=function(a,b){return 0==this.GetDepth()||b._hasLayout&&0<b._width&&0<b._height?DvtTreemapNode.superclass.animateUpdate.call(this,a,b):this.animateInsert(a)};
DvtTreemapNode.prototype._createShapeNode=function(){var a=this.getView().getCtx(),b;if(this._textStyle==DvtTreemapNode.TEXT_STYLE_HEADER)b=new DvtRect(a,this._x,this._y,this._width,this._height),this._innerShape=new DvtRect(a,this._x+1,this._y+1,this._width-2,this._height-2),this.ApplyHeaderStyle(b,this._innerShape),this._innerShape.setMouseEnabled(!1),b.addChild(this._innerShape),this.__isIsolated()&&(this._isolateButton=this._createIsolateRestoreButton(b));else{var c=this.GetFill();b=new DvtRect(a,
this._x,this._y,this._width,this._height);if((1E3>this.getView().__getNodeCount()||!DvtAgent.isTouchDevice())&&this._width>=DvtTreemapNode.MIN_SIZE_FOR_BORDER&&this._height>=DvtTreemapNode.MIN_SIZE_FOR_BORDER){new DvtSolidStroke(DvtTreemapNode.DEFAULT_NODE_TOP_BORDER_COLOR);new DvtSolidStroke(DvtTreemapNode.DEFAULT_NODE_BOTTOM_BORDER_COLOR,DvtTreemapNode.DEFAULT_NODE_BORDER_OPACITY);this._pattern&&new DvtSolidStroke(this._color,DvtTreemapNode.DEFAULT_NODE_PATTERN_BORDER_OPACITY);var d=this.getColor(),
e=DvtColorUtils.interpolateColor(DvtTreemapNode.DEFAULT_NODE_TOP_BORDER_COLOR,d,1-DvtTreemapNode.DEFAULT_NODE_BORDER_OPACITY),d=DvtColorUtils.interpolateColor(DvtTreemapNode.DEFAULT_NODE_BOTTOM_BORDER_COLOR,d,1-DvtTreemapNode.DEFAULT_NODE_BORDER_OPACITY),g=Math.min(this._width,this._height);4<=g?(b.setSolidFill(d),this._topLeftShape=new DvtRect(a,this._x,this._y,this._width-1,this._height-1),this._topLeftShape.setSolidFill(e),this._topLeftShape.setMouseEnabled(!1),b.addChild(this._topLeftShape),this._fillShape=
new DvtRect(a,this._x+1,this._y+1,this._width-2,this._height-2),this._fillShape.setFill(c),this._fillShape.setMouseEnabled(!1),b.addChild(this._fillShape)):2<=g?(b.setSolidFill(d),this._fillShape=new DvtRect(a,this._x,this._y,this._width-1,this._height-1),this._fillShape.setFill(c),this._fillShape.setMouseEnabled(!1),b.addChild(this._fillShape)):b.setFill(c)}else b.setFill(c)}this.getView().__getEventManager().associate(b,this);this.isSelectable()?b.setSelectable(!0):b.setCursor("default");b.zIndex=
this._zIndex;return b};
DvtTreemapNode.prototype._createIsolateRestoreButton=function(a){if(this._textStyle!=DvtTreemapNode.TEXT_STYLE_HEADER||!this.isIsolateEnabled())return null;var b=null,c=this._x,d=this._x+this._width-DvtTreemapNode._LINE_FUDGE_FACTOR,e=this._y+DvtTreemapNode._LINE_FUDGE_FACTOR,g=this._y+this._titleBarHeight;d-c-2*DvtTreemapNode._ISOLATE_GAP_SIZE>DvtTreemapNode._ISOLATE_ICON_SIZE&&(b=this.__isIsolated()?this._getRestoreButton():this._getIsolateButton(),c=DvtAgent.isRightToLeft(a.getCtx())?c+DvtTreemapNode._ISOLATE_GAP_SIZE:
d-DvtTreemapNode._ISOLATE_ICON_SIZE-DvtTreemapNode._ISOLATE_GAP_SIZE,b.setTranslate(c,(g+e-DvtTreemapNode._ISOLATE_ICON_SIZE)/2),a.addChild(b),DvtAgent.isTouchDevice()&&(a=new DvtRect(a.getCtx(),-DvtTreemapNode._ISOLATE_TOUCH_BUFFER,-DvtTreemapNode._ISOLATE_TOUCH_BUFFER,DvtTreemapNode._ISOLATE_ICON_SIZE+2*DvtTreemapNode._ISOLATE_TOUCH_BUFFER,DvtTreemapNode._ISOLATE_ICON_SIZE+2*DvtTreemapNode._ISOLATE_TOUCH_BUFFER),a.setInvisibleFill(),b.addChild(a)),DvtCSSStyle.afterSkinAlta(this.getView().getOptions().skin)?
this.getView().__getEventManager().associate(b,this):(a=DvtBundle.getTranslation(this.getView().getOptions(),this.__isIsolated()?"tooltipRestore":"tooltipIsolate",DvtBundle.TREEMAP_PREFIX,this.__isIsolated()?"RESTORE":"ISOLATE"),this.getView().__getEventManager().associate(b,new DvtBaseTreePeer(this,this.getId(),a))));return b};DvtTreemapNode.prototype._removeIsolateRestoreButton=function(){this._isolateButton&&(this._removeChildShape(this._isolateButton),this._isolateButton=null)};
DvtTreemapNode.prototype._createTextNode=function(a){var b=DvtAgent.isRightToLeft(a.getCtx());if(!this._textStr||!a||!this._textStyle||this._textStyle==DvtTreemapNode.TEXT_STYLE_OFF)return null;var c=this._height;if(this.GetTextSize()>c)return null;var d=this._textStyle==DvtTreemapNode.TEXT_STYLE_NODE?this._labelHalign:this._headerHalign;b&&("start"==d?d="end":"end"==d&&(d="start"));var e=this._width-(DvtTreemapNode.TEXT_BUFFER_HORIZ+DvtTreemapNode.MIN_TEXT_BUFFER),g=0;this.isIsolateEnabled()&&(g=
DvtTreemapNode._ISOLATE_ICON_SIZE+DvtTreemapNode._ISOLATE_GAP_SIZE,e="center"==d?e-2*g:e-g);if(0>=e)return null;var h=new DvtOutputText(this.getView().getCtx(),this._textStr);h.setFontSize(this.GetTextSize());"start"==d?(b?h.setX(this._x+DvtTreemapNode.TEXT_BUFFER_HORIZ+g):h.setX(this._x+DvtTreemapNode.TEXT_BUFFER_HORIZ),h.alignLeft()):"center"==d?(h.setX(this._x+this._width/2),h.alignCenter()):"end"==d&&(b?h.setX(this._x+this._width-DvtTreemapNode.TEXT_BUFFER_HORIZ):h.setX(this._x+this._width-DvtTreemapNode.TEXT_BUFFER_HORIZ-
g),h.alignRight());this._textStyle==DvtTreemapNode.TEXT_STYLE_NODE?(this.ApplyLabelTextStyle(h),c=this._height-2*DvtTreemapNode.TEXT_BUFFER_VERT,b=DvtTextUtils.getTextHeight(h),"top"==this._labelValign?h.setY(this._y+DvtTreemapNode.TEXT_BUFFER_VERT):"center"==this._labelValign?h.setY(this._y+this._height/2-b/2):"bottom"==this._labelValign&&h.setY(this._y+this._height-DvtTreemapNode.TEXT_BUFFER_VERT-b)):this._textStyle==DvtTreemapNode.TEXT_STYLE_HEADER&&(b=DvtAgent.isPlatformWebkit()?DvtTreemapNode._LINE_FUDGE_FACTOR:
0,h.setY(this._y+DvtTreemapNode.DEFAULT_HEADER_BORDER_WIDTH+this._titleBarHeight/2+b),h.alignMiddle(),this.ApplyHeaderTextStyle(h,"labelStyle"));if(null!=h)return this._textStyle==DvtTreemapNode.TEXT_STYLE_HEADER&&this.isDrillReplaceEnabled()?(this.ApplyHeaderTextStyle(h,"_drillableLabelStyle"),h.setCursor("pointer"),b=new DvtBaseTreePeer(this,this.getId(),null,this.getDatatip(),this.getDatatipColor()),b.setDrillable(!0),this.getView().__getEventManager().associate(h,b)):h.setMouseEnabled(!1),DvtTextUtils.fitText(h,
e,c,a)?h:null};DvtTreemapNode.prototype.ApplyHeaderStyle=function(a,b){var c=this.getView().getOptions().nodeDefaults.header;if(this._bHeaderUseNodeColor){var d=this.getColor();b.setSolidFill(d);c=DvtColorUtils.interpolateColor(c.borderColor,d,1-DvtTreemapNode.DEFAULT_HEADER_WITH_NODE_COLOR_ALPHA);a.setSolidFill(c)}else a.setSolidFill(c.borderColor),b.setSolidFill(c.backgroundColor)};
DvtTreemapNode.prototype.ApplyHeaderTextStyle=function(a,b){var c=[];1>=this.GetDepth()&&c.push(new DvtCSSStyle("font-weight:bold;"));c.push(this.getView().getOptions().nodeDefaults.header[b]);!this._bHeaderUseNodeColor||"labelStyle"!=b&&"_drillableLabelStyle"!=b||c.push(new DvtCSSStyle("color: "+DvtBaseTreeNode.GetNodeTextColor(this)));this._headerLabelStyle&&c.push(this._headerLabelStyle);a.setCSSStyle(DvtCSSStyle.mergeStyles(c))};
DvtTreemapNode.prototype.handleMouseOver=function(){this._isolateButton||DvtAgent.isTouchDevice()||(this._isolateButton=this._createIsolateRestoreButton(this._shape));DvtTreemapNode.superclass.handleMouseOver.call(this)};DvtTreemapNode.prototype.handleMouseOut=function(){!0===this.__isIsolated()||DvtAgent.isTouchDevice()||this._removeIsolateRestoreButton();DvtTreemapNode.superclass.handleMouseOut.call(this)};
DvtTreemapNode.prototype._updateShapes=function(){this._shape&&(this._shape.setRect(this._x,this._y,this._width,this._height),this._innerShape&&this._innerShape.setRect(this._x+1,this._y+1,this._width-2,this._height-2),(this._textStyle!=DvtTreemapNode.TEXT_STYLE_HEADER||this._bHeaderUseNodeColor)&&this._shape.setFill(this.GetFill()),this.isSelected()&&this.setSelected(!1),this._removeChildShape(this._fillShape),this._removeChildShape(this._topLeftShape),this._topLeftShape=this._fillShape=null,this._removeIsolateRestoreButton(),
this.GetTemplate()?(this._removeChildShape(this._contentRoot),this._contentRoot=null):(this._removeChildShape(this._textBackground),this._textBackground=null,this._text&&this._text.getParent().removeChild(this._text),this._text=this._createTextNode(this._shape)))};DvtTreemapNode.prototype.getDropSiteFeedback=function(){return this._shape?new DvtRect(this.getView().getCtx(),this._shape.getX(),this._shape.getY(),this._shape.getWidth(),this._shape.getHeight()):null};
DvtTreemapNode.prototype._addChildText=function(a){this._textStyle==DvtTreemapNode.TEXT_STYLE_NODE&&this.hasChildren()?this.getView().__getGroupTextLayer().addChild(a):this._shape.addChild(a)};DvtTreemapNode.prototype._removeChildShape=function(a){a&&this._shape.removeChild(a)};
DvtTreemapNode.prototype._getIsolateButton=function(){var a=this.getView().getCtx(),b=DvtAgent.isRightToLeft(this._context),c=this.getView().getOptions()._resources,d=b&&c.isolateDownRtl?c.isolateDownRtl:c.isolateDown,e=b&&c.isolateOverRtl?c.isolateOverRtl:c.isolateOver,b=new DvtImage(a,b&&c.isolateRtl?c.isolateRtl:c.isolate,0,0,DvtTreemapNode._ISOLATE_ICON_SIZE,DvtTreemapNode._ISOLATE_ICON_SIZE),d=new DvtImage(a,d,0,0,DvtTreemapNode._ISOLATE_ICON_SIZE,DvtTreemapNode._ISOLATE_ICON_SIZE),e=new DvtImage(a,
e,0,0,DvtTreemapNode._ISOLATE_ICON_SIZE,DvtTreemapNode._ISOLATE_ICON_SIZE);b.setInvisibleFill();d.setInvisibleFill();e.setInvisibleFill();a=new DvtButton(a,b,d,e);a.addEvtListener(DvtMouseEvent.CLICK,this.__isolateNode,!1,this);return a};
DvtTreemapNode.prototype._getRestoreButton=function(){var a=this.getView().getCtx(),b=DvtAgent.isRightToLeft(this._context),c=this.getView().getOptions()._resources,d=b&&c.restoreDownRtl?c.restoreDownRtl:c.restoreDown,e=b&&c.restoreOverRtl?c.restoreOverRtl:c.restoreOver,b=new DvtImage(a,b&&c.restoreRtl?c.restoreRtl:c.restore,0,0,DvtTreemapNode._ISOLATE_ICON_SIZE,DvtTreemapNode._ISOLATE_ICON_SIZE),d=new DvtImage(a,d,0,0,DvtTreemapNode._ISOLATE_ICON_SIZE,DvtTreemapNode._ISOLATE_ICON_SIZE),e=new DvtImage(a,
e,0,0,DvtTreemapNode._ISOLATE_ICON_SIZE,DvtTreemapNode._ISOLATE_ICON_SIZE);b.setInvisibleFill();d.setInvisibleFill();e.setInvisibleFill();a=new DvtButton(a,b,d,e);a.addEvtListener(DvtMouseEvent.CLICK,this.__restoreNode,!1,this);return a};DvtTreemapNode.prototype.__isIsolated=function(){return this._bIsolated};DvtTreemapNode.prototype.__isolateNode=function(a){this._bIsolated=!0;this.hideHoverEffect();this.getView().__isolate(this);this._removeIsolateRestoreButton();this.UpdateAriaLabel();a&&a.stopPropagation()};
DvtTreemapNode.prototype.__restoreNode=function(a){this._bIsolated=!1;this.hideHoverEffect();this.getView().__restore();this._removeIsolateRestoreButton();this.UpdateAriaLabel();a&&a.stopPropagation()};DvtTreemapNode.prototype.getDatatip=function(a,b,c){return a&&a instanceof DvtButton?null:DvtTreemapNode.superclass.getDatatip.call(this,a,b,c)};DvtTreemapNode.prototype.getDatatipColor=function(a){return a&&a instanceof DvtButton?null:DvtTreemapNode.superclass.getDatatipColor.call(this,a)};
DvtTreemapNode.prototype.getTooltip=function(a){return a&&a instanceof DvtButton?DvtBundle.getTranslation(this.getView().getOptions(),this.__isIsolated()?"tooltipRestore":"tooltipIsolate",DvtBundle.TREEMAP_PREFIX,this.__isIsolated()?"RESTORE":"ISOLATE"):null};
DvtTreemapNode.prototype.getAriaLabel=function(){var a=this.getView().getOptions(),b=[];this.isSelectable()&&b.push(DvtBundle.getTranslation(a,this.isSelected()?"stateSelected":"stateUnselected",DvtBundle.UTIL_PREFIX,this.isSelected()?"STATE_SELECTED":"STATE_UNSELECTED"));this.__isIsolated()&&b.push(DvtBundle.getTranslation(a,"stateIsolated",DvtBundle.UTIL_PREFIX,"STATE_ISOLATED"));this.isDrillReplaceEnabled()&&b.push(DvtBundle.getTranslation(a,"stateDrillable",DvtBundle.UTIL_PREFIX,"STATE_DRILLABLE"));
return DvtDisplayable.generateAriaLabel(this.getShortDesc(),b)};DvtTreemapNode.prototype.UpdateAriaLabel=function(){!DvtAgent.deferAriaCreation()&&this._shape&&this._shape.setAriaProperty("label",this.getAriaLabel())};var DvtBaseTreemapLayout=function(){this.Init()};DvtObj.createSubclass(DvtBaseTreemapLayout,DvtObj,"DvtBaseTreemapLayout");DvtBaseTreemapLayout._GROUP_GAP=3;DvtBaseTreemapLayout.prototype.Init=function(){this._zIndex=0};DvtBaseTreemapLayout.prototype.layout=function(a,b,c,d,e,g,h){};
DvtBaseTreemapLayout.prototype.setNodeBounds=function(a,b,c,d,e,g){a.setZIndex(this._zIndex);this._zIndex++;if(!g||!a.hasChildren()){var h=this.getGapSize(a.getView(),a.GetDepth());g=Math.round(b+h);var k=Math.round(c+h),m=Math.round(b+d-h)-g,h=Math.round(c+e-h)-k;if(a=a.setLayoutParams(g,k,m,h))return a}return new DvtRectangle(b,c,d,e)};
DvtBaseTreemapLayout.prototype.getGapSize=function(a,b){var c=a.getOptions().groupGaps;return"outer"==c?1==b&&2<=a.__getMaxDepth()?DvtBaseTreemapLayout._GROUP_GAP:0:"all"==c?b<a.__getMaxDepth()?DvtBaseTreemapLayout._GROUP_GAP:0:0};var DvtSquarifyingLayout=function(){this.Init()};DvtObj.createSubclass(DvtSquarifyingLayout,DvtBaseTreemapLayout,"DvtSquarifyingLayout");DvtSquarifyingLayout.prototype.layout=function(a,b,c,d,e,g,h){this._layout(b,c,d,e,g,h?!1:!0)};
DvtSquarifyingLayout.prototype._layout=function(a,b,c,d,e,g){b=this.setNodeBounds(a,b,c,d,e,g);a=a.getChildNodes();null!=a&&0<a.length&&(this._calcPixelSize(a,b.w*b.h),a=a.slice(0).sort(function(a,b){return a.getSize()-b.getSize()}),c=Math.min(b.w,b.h),b=new DvtRectangle(b.x,b.y,b.w,b.h),this._squarify(a,[],c,b,Infinity))};
DvtSquarifyingLayout.prototype._calcPixelSize=function(a,b){for(var c=0,d=0,d=0;d<a.length;d++)c+=0<a[d].getSize()?a[d].getSize():0;c=0==b?0:b/c;for(d=0;d<a.length;d++){var e=a[d];e.__pxSize=e.getSize()*c}};
DvtSquarifyingLayout.prototype._squarify=function(a,b,c,d,e){if(null==a||0==a.length)this._layoutRow(b,c,d);else for(;0<a.length;){var g=a.pop();if(0>g.__pxSize){this._layoutRow(b,c,d);break}b.push(g);var h=this._getWorst(b,c);if(h>e){a.push(g);b.pop();d=this._layoutRow(b,c,d);this._squarify(a,[],Math.min(d.w,d.h),d,Infinity);break}else if(0==a.length){this._layoutRow(b,c,d);break}else e=h}};
DvtSquarifyingLayout.prototype._getWorst=function(a,b){for(var c=0,d=Infinity,e=-Infinity,g=0;g<a.length;g++)c+=a[g].__pxSize,d=Math.min(d,a[g].__pxSize),e=Math.max(e,a[g].__pxSize);c*=c;g=b*b;return Math.max(g*e/c,c/(g*d))};
DvtSquarifyingLayout.prototype._layoutRow=function(a,b,c){var d=0,e;for(e=0;e<a.length;e++)d+=a[e].__pxSize;var g=c.x,h=c.y;if(b==c.w){d=0==b?0:d/b;for(e=0;e<a.length;e++)b=a[e].__pxSize/d,this._layout(a[e],g,h,b,d,!1),g+=b;return new DvtRectangle(c.x,c.y+d,c.w,c.h-d)}b=0==b?0:d/b;for(e=0;e<a.length;e++)d=a[e].__pxSize/b,this._layout(a[e],g,h,b,d,!1),h+=d;return new DvtRectangle(c.x+b,c.y,c.w-b,c.h)};var DvtSliceAndDiceLayout=function(a){this.Init();this._isHoriz=a};
DvtObj.createSubclass(DvtSliceAndDiceLayout,DvtBaseTreemapLayout,"DvtSliceAndDiceLayout");DvtSliceAndDiceLayout.prototype.layout=function(a,b,c,d,e,g,h){this._layout(this._isHoriz,a,b,c,d,e,g,h?!1:!0)};
DvtSliceAndDiceLayout.prototype._layout=function(a,b,c,d,e,g,h,k){var m=b.getOptions();d=this.setNodeBounds(c,d,e,g,h,k);c=c.getChildNodes();if(null!=c){e=d.x;g=d.y;h=d.w;k=d.h;var n=0,t;for(t=0;t<c.length;t++)n+=0<c[t].getSize()?c[t].getSize():0;"on"==m.sorting&&(c=c.slice(0),c.sort(function(a,b){return b.getSize()-a.getSize()}));a&&DvtAgent.isRightToLeft(b.getCtx())&&(c=c.slice(0).reverse());for(t=0;t<c.length;t++)if(m=c[t],!(0>=m.getSize())){var u=m.getSize()/n;a?h=d.w*u:k=d.h*u;this._layout(!a,
b,m,e,g,h,k,!1);a?e+=h:g+=k}}};var DvtTreemapIsolateEvent=function(a){this.Init(DvtTreemapIsolateEvent.TYPE);this._id=a?a:null};DvtObj.createSubclass(DvtTreemapIsolateEvent,DvtBaseComponentEvent,"DvtTreemapIsolateEvent");DvtTreemapIsolateEvent.TYPE="treemapIsolate";DvtTreemapIsolateEvent.prototype.getId=function(){return this._id};var DvtTreemapKeyboardHandler=function(a){this.Init(a)};DvtObj.createSubclass(DvtTreemapKeyboardHandler,DvtBaseTreeKeyboardHandler,"DvtTreemapKeyboardHandler");
DvtTreemapKeyboardHandler.prototype.isNavigationEvent=function(a){var b=DvtTreemapKeyboardHandler.superclass.isNavigationEvent.call(this,a);b||(a=a.keyCode,a!=DvtKeyboardEvent.OPEN_BRACKET&&a!=DvtKeyboardEvent.CLOSE_BRACKET)||(b=!0);return b};var DvtTreemapEventManager=function(a,b,c,d){DvtBaseTreeEventManager.call(this,a,b,c,d)};DvtObj.createSubclass(DvtTreemapEventManager,DvtBaseTreeEventManager,"DvtTreemapEventManager");
DvtTreemapEventManager.prototype.ProcessKeyboardEvent=function(a){var b=!0;if(a.keyCode==DvtKeyboardEvent.ENTER&&a.ctrlKey){var c=this.getFocus();c.isIsolateEnabled()&&(c.__isIsolated()?c.__restoreNode():c.__isolateNode());DvtEventManager.consumeEvent(a)}else b=DvtTreemapEventManager.superclass.ProcessKeyboardEvent.call(this,a);return b};DvtTreemapEventManager.prototype.isClearMenuAllowed=function(){return!1};
DvtBundle.addDefaultStrings(DvtBundle.TREEMAP_PREFIX,{COLOR:"Color",ISOLATE:"Isolate",OTHER:"Other",RESTORE:"Restore",SIZE:"Size"});var DvtTreemapDefaults=function(){this.Init({skyros:DvtTreemapDefaults.VERSION_1,alta:{}})};DvtObj.createSubclass(DvtTreemapDefaults,DvtBaseTreeDefaults,"DvtTreemapDefaults");
DvtTreemapDefaults.VERSION_1={groupGaps:"outer",nodeDefaults:{header:{backgroundColor:"#FFFFFF",borderColor:"#d6dfe6",hoverBackgroundColor:"#ebeced",hoverOuterColor:"#ebeced",hoverInnerColor:"#d6d7d8",isolate:"auto",labelHalign:"start",labelStyle:new DvtCSSStyle("font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px;color:#252525;"),selectedBackgroundColor:"#dae9f5",selectedInnerColor:"#FFFFFF",selectedOuterColor:"#000000",useNodeColor:"off",_hoverLabelStyle:new DvtCSSStyle("font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px;color:#252525;"),
_selectedLabelStyle:new DvtCSSStyle("font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px;color:#252525;"),_drillableLabelStyle:new DvtCSSStyle("font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color:#145c9e;"),_drillableHoverLabelStyle:new DvtCSSStyle("font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color:#145c9e;"),_drillableSelectedLabelStyle:new DvtCSSStyle("font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color:#145c9e;")},
hoverColor:"#ebeced",groupLabelDisplay:"header",labelDisplay:"node",labelHalign:"center",labelValign:"center",selectedInnerColor:"#FFFFFF",selectedOuterColor:"#000000"}};