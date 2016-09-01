(function(){var a=adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX,"filmStripItem");a.prototype.createChildrenNodes=function(a){return!0===a.getAttribute("_visible")?adf.mf.api.amx.AmxNodeCreateChildrenNodesResult.NONE:adf.mf.api.amx.AmxNodeCreateChildrenNodesResult.HANDLED};a.prototype.render=function(a,b){var c=a.getAttribute("shortDesc"),e=a.getAttribute("text"),g=document.createElement("div");c&&g.setAttribute("title",c);d(a.getParent(),k(a))&&g.classList.add("adfmf-filmStripItem-selected");
c=document.createElement("div");c.id=b+"_content";if(!1!==a.getAttribute("_visible"))for(var h=a.renderDescendants(),m=0;m<h.length;++m)c.appendChild(h[m]);g.appendChild(c);c.className="amx-filmStrip-item-content";e&&(c=document.createElement("div"),c.id=b+"_text",c.className="amx-filmStrip-item-text",c.textContent=e,g.appendChild(c));adf.mf.api.amx.addBubbleEventListener(g,"tap",this._handleTap,{elementId:b,itemAmxNode:a});return g};a.prototype.refresh=function(b,c){a.superclass.refresh.call(this,
b,c);var d=b.getId(),e=document.getElementById(d);if(c.hasChanged("_visible")&&!1!==b.getAttribute("_visible"))for(var g=document.getElementById(d+"_content"),h=b.renderDescendants(),k=0;k<h.length;++k)g.appendChild(h[k]);c.hasChanged("shortDesc")&&((g=b.getAttribute("shortDesc"))?e.setAttribute("title",g):e.removeAttribute("title"));c.hasChanged("text")&&(g=b.getAttribute("text"),(h=document.getElementById(d+"_text"))?g?textContent.textContent=g:adf.mf.api.amx.removeDomNode(h):g&&(h=document.createElement("div"),
h.id=d+"_text",h.className="amx-filmStrip-item-text",h.textContent=g,e.appendChild(textContent)))};a.prototype.attributeChangeResult=function(b,c,d){switch(c){case "_visible":if(!0===b.getAttribute("_visible"))b.createStampedChildren(null,null,null),b.setAttributeResolvedValue("_visible",null);else if(1===d.getSize())return adf.mf.api.amx.AmxNodeChangeResult.NONE;return adf.mf.api.amx.AmxNodeChangeResult.REFRESH;case "shortDesc":case "text":return adf.mf.api.amx.AmxNodeChangeResult.REFRESH}return a.superclass.attributeChangeResult.call(this,
b,c,d)};var b=function(a,b){var c=a.getVolatileState();null==c&&(c={});c.selectedRowKeys||(c.selectedRowKeys={});b=b.trim?b.trim():b;c.selectedRowKeys[b]=b;a.setVolatileState(c)},c=function(a,b){b=b.trim();var c=a.getVolatileState();null!=c&&c.selectedRowKeys&&(delete c.selectedRowKeys[b],a.setVolatileState(c))},d=function(a,b){var c=a.getVolatileState();return null!=c&&c.selectedRowKeys&&c.selectedRowKeys[b]?!0:!1},e=function(a){a=a.getVolatileState();var b=[];if(null!=a&&a.selectedRowKeys)for(var c in a.selectedRowKeys)b.push(c);
return b},g=function(a){var b=a.getVolatileState();null!=b&&(delete b.selectedRowKeys,a.setVolatileState(b))};a.prototype._handleTap=function(a){a.stopPropagation();var h=document.getElementById(a.data.elementId),m=a.data.itemAmxNode;a=m.getParent();adf.mf.api.amx.validate(h,function(){if(adf.mf.api.amx.acceptEvent()){var a=new adf.mf.api.amx.ActionEvent;adf.mf.api.amx.processAmxEvent(m,"action",void 0,void 0,a,null)}});if(adf.mf.api.amx.acceptEvent()){var n=a.getAttribute("selection");if("single"===
n||"multiple"===n){var t=k(m),u=e(a),v=d(a,t);if("single"===n){if(n=document.getElementById(a.getId()).querySelectorAll(".adfmf-filmStripItem-selected"))for(var w=0;w<n.length;w++)n[w].classList.remove("adfmf-filmStripItem-selected");g(a)}else!0===v&&(h.classList.remove("adfmf-filmStripItem-selected"),c(a,t));!1===v&&(h.classList.add("adfmf-filmStripItem-selected"),b(a,t));h=e(a);h=new adf.mf.api.amx.SelectionEvent(u,h);adf.mf.api.amx.processAmxEvent(a,"selection",void 0,void 0,h)}}};var h=adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX,
"filmStrip");h.prototype.createChildrenNodes=function(a){var b=null;a.getAttribute("var")&&a.isAttributeDefined("value")&&(b=a.getAttribute("value"));if(void 0===b)return a.setState(adf.mf.api.amx.AmxNodeStates.INITIAL),!0;if(b){var c=adf.mf.api.amx.createIterator(b);c.getTotalCount()>c.getAvailableCount()&&(adf.mf.api.amx.showLoadingIndicator(),adf.mf.api.amx.bulkLoadProviders(b,0,-1,function(){try{var b=new adf.mf.api.amx.AmxNodeUpdateArguments;b.setAffectedAttribute(a,"value");adf.mf.api.amx.markNodeForUpdate(b)}finally{adf.mf.api.amx.hideLoadingIndicator()}},
function(a,b){adf.mf.api.adf.logInfoResource("AMXInfoBundle",adf.mf.log.level.SEVERE,"createChildrenNodes","MSG_ITERATOR_FIRST_NEXT_ERROR",a,b);adf.mf.api.amx.hideLoadingIndicator()}));for(;c.hasNext();)c.next(),m(a,c.getRowKey())}else m(a,null);a.setState(adf.mf.api.amx.AmxNodeStates.ABLE_TO_RENDER);return!0};var k=function(a){var b=a.getStampKey();null==b&&(b=a.getAttribute("_virtualStamp"));return b||null},m=function(a,b){var c=a.createStampedChildren(b,null,null);adf.mf.environment.profile.dtMode||
c.forEach(function(a,c){a.setAttributeResolvedValue("_visible",!1);null==b&&a.setAttributeResolvedValue("_virtualStamp",""+c)});return c};h.prototype.visitChildren=function(a,b,c){var d=a.getAttribute("value"),e=a.getAttribute("var"),g=d?adf.mf.api.amx.createIterator(d):null;if(!b.isVisitAll()){a=b.getChildrenToWalk(a);for(var h=0;h<a.length;h++){var k=!1,m=a[h].getStampKey();if(g&&null!=m){if(!g.setCurrentRowKey(m))continue;k=null;k=g.isTreeNodeIterator()?d.localFetch(d.getCurrentIndex()):g.getCurrent();
if(!k)continue;adf.mf.el.pushVariable(e,k);k=!0}try{if(a[h].visit(b,c))return!0}finally{k&&adf.mf.el.popVariable(e)}}return!1}if(g){for(;g.hasNext();){d=g.next();adf.mf.el.pushVariable(e,d);try{if(a.visitStampedChildren(g.getRowKey(),[null],null,b,c))return!0}finally{adf.mf.el.popVariable(e)}}return!1}return a.visitStampedChildren(null,[null],null,b,c)};h.prototype.attributeChangeResult=function(a,b,c){switch(b){case "value":return this._updateCollectionModel(a,c);case "halign":case "itemSizing":case "itemsPerPage":case "orientation":case "pageControlPosition":case "shortDesc":case "valign":return adf.mf.api.amx.AmxNodeChangeResult.REFRESH}return h.superclass.attributeChangeResult.call(this,
a,b,c)};h.prototype._updateCollectionModel=function(a,b){var c=a.getAttribute("value"),d=b.getCollectionChange("value");if(!c||!d||!d.isItemized())return adf.mf.api.amx.AmxNodeChangeResult.REPLACE;var e=adf.mf.api.amx.createIterator(c);if(e.getTotalCount()>e.getAvailableCount())return adf.mf.api.amx.showLoadingIndicator(),adf.mf.api.amx.bulkLoadProviders(c,0,-1,function(){try{var b=new adf.mf.api.amx.AmxNodeUpdateArguments;b.setAffectedAttribute(a,"value");b.setCollectionChanges(a.getId(),"value",
d);adf.mf.api.amx.markNodeForUpdate(b)}finally{adf.mf.api.amx.hideLoadingIndicator()}},function(a,b){adf.mf.api.adf.logInfoResource("AMXInfoBundle",adf.mf.log.level.SEVERE,"createChildrenNodes","MSG_ITERATOR_FIRST_NEXT_ERROR",a,b);adf.mf.api.amx.hideLoadingIndicator()}),b.setCustomValue("bulkLoad",!0),adf.mf.api.amx.AmxNodeChangeResult.NONE;var g=!1,h={deleted:[],replaced:[],created:[]};d.getDeletedKeys().forEach(function(b){b=a.removeChildrenByKey(b);h.deleted=h.deleted.concat(b)});d.getCreatedKeys().forEach(function(b){g=
!0;b=m(a,b);h.created=h.created.concat(b)});c=d.getUpdatedKeys();c=c.concat(d.getDirtiedKeys());c.forEach(function(b){g=!0;a.removeChildrenByKey(b);b=a.createStampedChildren(b,null,null);b.forEach(function(a){a.setAttributeResolvedValue("_visible",!0)});h.replaced=h.replaced.concat(b)});if(g)b.setCustomValue("amxNodeCollectionChanges",h);else return adf.mf.api.amx.AmxNodeChangeResult.NONE;return adf.mf.api.amx.AmxNodeChangeResult.REFRESH};h.prototype._createHandlers=function(a,b){var c=this.getPageCount(a),
d={origin:null,startTime:null,vertical:"vertical"===a.getAttribute("orientation"),pageCount:c},e=this;b.addEventListener(amx.hasTouch()?"touchstart":"mousedown",function(b){var c;b.touches&&0<b.touches.length?(c=b.touches[0].pageX,b=b.touches[0].pageY):(c=b.pageX,b=b.pageY);d.origin={x:c,y:b};u(this.childNodes,!1);d.baseSize=d.vertical?this.childNodes[0].offsetHeight:this.childNodes[0].offsetWidth;d.activePageIndex=e.getCurrentPageIndex(a)});b.addEventListener(amx.hasTouch()?"touchend":"mouseup",
function(a){u(this.childNodes,!0)});adf.mf.api.amx.addDragListener(b,{threshold:0,start:function(a,b){a.stopPropagation();a.preventDefault();b.preventDefault=!0;b.stopPropagation=!0;b.requestDragLock(this,!0,!0);var c=a.data.context;c.startTime=Date.now();c.swipeFound=0;c.lastChange=null;c.swipeStart=null},drag:function(a,b){a.stopPropagation();a.preventDefault();b.stopPropagation=!0;var c=a.data.context;t(c,b,40)&&(b.preventDefault=!0);var d=Math.abs(c.vertical?b.deltaPageY:b.deltaPageX);c.delta&&
(c.delta<d/2?(c.swipeFound=!0,c.swipeStart=Date.now()):c.swipeFound&&200<Date.now()-c.swipeStart&&(c.swipeFound=!1,c.swipeStart=null));c.delta=d;var d=0,e=n(c,b);c.lastChange=e;var g=c.activePageIndex,h=c.pageCount;if(0===g&&0<e||h-1===g&&0>e)d=.7*e;w(a.data.amxNode,this.childNodes,c.vertical,Math.floor(100*(-100*g+e-d))/100)},end:function(a,b){a.stopPropagation();a.preventDefault();a.stopPropagation();a.preventDefault();var c=a.data.context,d=Date.now()-c.startTime;u(this.childNodes,!0);var e=c.lastChange;
e||(e=n(c,b));if(0!==e){var g=a.data.amxNode,h=a.data.renderer,k=c.activePageIndex,m=0;if(!0===c.swipeFound||200<d&&50<Math.abs(e)||200>=d&&10<Math.abs(e)&&t(c,b,40))m=-1*(e/Math.abs(e));h.setCurrentPageByIndex(g,k+m)}}},{amxNode:a,context:d,renderer:this});adf.mf.api.amx.addBubbleEventListener(b,"tap",this._handleTap,{amxNode:a});b=null};var n=function(a,b){return a.origin?(a.vertical?b.pageY-a.origin.y:b.pageX-a.origin.x)/a.baseSize*100:0},t=function(a,b,c){return a.vertical?Math.abs(Math.abs(b.originalAngle)-
90)<c:Math.abs(Math.abs(Math.abs(b.originalAngle)-90)-90)<c};h.prototype._handleTap=function(a){if(adf.mf.api.amx.acceptEvent()){a=a.data.amxNode;var b=a.getAttribute("selection");if("single"===b||"multiple"===b){var b=e(a),c=document.getElementById(a.getId()).querySelectorAll(".adfmf-filmStripItem-selected");if(c)for(var d=0;d<c.length;d++)c[d].classList.remove("adfmf-filmStripItem-selected");g(a);b=new adf.mf.api.amx.SelectionEvent(b,[]);adf.mf.api.amx.processAmxEvent(a,"selection",void 0,void 0,
b)}}};var u=function(a,b){var c="amx-filmStrip_page";!0===b&&(c+=" animation");for(var d=0,e=a.length;d<e;d++)a[d].className!==c&&(a[d].className=c)},v=function(a){return"vertical"===a.getAttribute("orientation")?!1:"rtl"==document.documentElement.dir},w=function(a,b,c,d){if(v(a)){var e=y(a);d+=100*(e-1)}d+="%";if(e=window.requestAnimationFrame||window.webkitRequestAnimationFrame){var g=a.getAttribute("_rafid");if(g){var h=window.cancelAnimationFrame||window.webkitCancelAnimationFrame;h&&(h(g),g=
null)}g=e(function(e){x(b,c,d);b=null;a.setAttributeResolvedValue("_rafid",null)});a.setAttributeResolvedValue("_rafid",g)}else x(b,c,d),b=null},x=function(a,b,c){b=b?"translateY":"translateX";for(var d=0,e=a.length;d<e;d++)void 0!==a[d].style.transform?a[d].style.transform=b+"("+c+")":a[d].style.WebkitTransform=b+"("+c+")"};h.prototype.setPageCount=function(a,b){var c=a.getVolatileState();null==c&&(c={});c._pageCount=b;a.setVolatileState(c)};var y=function(a){a=a.getVolatileState();return null!=
a&&a._pageCount?a._pageCount:0};h.prototype.getPageCount=y;h.prototype.getCurrentPageIndex=function(a){return(a=B(a))?a:0};h.prototype.setCurrentPageByIndex=function(a,b){var c=this.getPageCount(a);b?(b=Math.max(b,0),b=Math.min(b,c-1)):b=0;var d=b;v(a)&&(d=c-1-d);var e=b,g=a.getClientState();null==g&&(g={});g._selectedPage=e;a.setClientState(g);g=a.getId();if(e=document.getElementById(g+"_pageControl"))for(var h=e.childNodes,e=0;e<h.length;e++)e!==d?h[e].classList.remove("selected"):h[e].classList.add("selected");
e=a.getAttribute("orientation");if(g=document.getElementById(g+"_pageContainer"))if(w(a,g.childNodes,"vertical"===e,-100*b),a.getAttribute("__currentPage")!==b){a.setAttributeResolvedValue("__currentPage",b);for(var h=null,k=Math.max(d-1,0),c=Math.min(d+1,c-1);k<=c;k++)if(d=g.childNodes[k])for(d=d.childNodes,e=0;e<d.length;e++){var m=adf.mf.internal.amx._getNonPrimitiveElementData(d[e],"amxNode");m&&!1===m.getAttribute("_visible")&&(null===h&&(h=new adf.mf.api.amx.AmxNodeUpdateArguments),m.setAttributeResolvedValue("_visible",
!0),h.setAffectedAttribute(m,"_visible"))}null!==h&&adf.mf.api.amx.markNodeForUpdate(h)}};h.prototype._renderPageControl=function(a,b){var c=a.getAttribute("orientation"),d=a.getAttribute("pageControlPosition"),e=a.getId(),g=document.getElementById(e+"_pageControl");g&&adf.mf.api.amx.removeDomNode(g);if("none"!==d){var c="vertical"!==c?"horizontal":"vertical",h=c+"_"+d;g||(g=document.createElement("div"),g.id=e+"_pageControl");switch(h){case "vertical_start":case "vertical_insideStart":case "horizontal_top":case "horizontal_insideTop":b.insertBefore(g,
b.firstElementChild);break;case "vertical_end":case "vertical_insideEnd":case "horizontal_bottom":case "horizontal_insideBottom":b.appendChild(g);break;default:d="vertical"===c?"end":"bottom",b.appendChild(g)}g.className="amx-filmStrip_pageControl position-"+d}else g=null;return g};h.prototype.render=function(a,c){var d=a.getAttribute("orientation"),e=a.getAttribute("itemSizing"),h=a.getAttribute("valign"),k=a.getAttribute("halign"),m=a.getAttribute("shortDesc");g(a);var n=a.getAttribute("selection");
if("single"===n||"multiple"===n)if(n=a.getAttribute("selectedRowKeys"))for("string"===typeof n?n=-1<n.indexOf(",")?n.split(","):-1<n.indexOf(" ")?n.split(" "):[n]:"number"===typeof n&&(n=[n]),n=adf.mf.api.amx.createIterator(n);n.hasNext();)b(a,n.next());n=document.createElement("div");m&&(n.title=m);"stretched"===e&&n.classList.add("amx-filmStrip-stretchItems");"vertical"===d&&n.classList.add("vertical");h&&n.classList.add("valign-"+h);k&&n.classList.add("halign-"+k);d=document.createElement("div");
n.appendChild(d);e=document.createElement("div");e.id=a.getId()+"_pageContainer";e.className="amx-filmStrip_page-container";d.appendChild(e);this._createHandlers(a,e);d=document.createElement("div");d.className="amx-filmStrip_page";e.appendChild(d);if(e=a.getAttribute("value"))for(h=adf.mf.api.amx.createIterator(e);h.hasNext();)for(h.next(),k=a.renderDescendants(null,h.getRowKey()),e=0;e<k.length;e++)d.appendChild(k[e]);else for(h=a.renderDescendants(),e=0;e<h.length;e++)d.appendChild(h[e]);return n};
h.prototype.destroy=function(a,b){var c=a.classList.contains("amx-filmStrip-stretchItems"),d=this._isFlexBoxDeprecatedImplementation();c&&!d||this._unregisterResizeHandler(b)};h.prototype._registerResizeHandler=function(a){if(this._resizeObservers)this._resizeObservers.push(a);else{var b=this;this._batchResizeHandler=function(a){b._resizeObservers.forEach(function(a){b.__redistributeItems(a)})};this._resizeObservers=[a];window.addEventListener("resize",this._batchResizeHandler,!0)}};h.prototype._unregisterResizeHandler=
function(a){if(this._resizeObservers){var b=[];this._resizeObservers.forEach(function(c){c!==a&&b.push(c)});0<b?this._resizeObservers=b:this._batchResizeHandler&&(delete this._resizeObservers,window.removeEventListener("resize",this._batchResizeHandler,!0),delete this._batchResizeHandler)}};var z=function(a){a.data.renderer.__redistributeItems(a.data.amxNode)};h.prototype.init=function(a,b){adf.mf.api.amx.addBubbleEventListener(a,"resize",z,{amxNode:b,renderer:this});var c=a.classList.contains("amx-filmStrip-stretchItems"),
d=this._isFlexBoxDeprecatedImplementation();c&&!d||this._registerResizeHandler(b)};h.prototype.__calculateItemsPerPage=function(a){var b=a.getId(),c=document.getElementById(b),d=a.getAttribute("orientation"),b=document.getElementById(b+"_pageContainer"),e=b.firstElementChild,g=c.classList.contains("amx-filmStrip-stretchItems"),h=null,k=null;a.isAttributeDefined("itemsPerPage")&&(h=a.getAttribute("itemsPerPage"));!g&&(a=window.getComputedStyle(e.childNodes[0]),"vertical"===d?(maxSize=c.clientHeight,
size=e.childNodes[0].offsetHeight+parseFloat(a.marginTop)+parseFloat(a.marginBottom)):(maxSize=b.parentNode.clientWidth,size=e.childNodes[0].offsetWidth+parseFloat(a.marginLeft)+parseFloat(a.marginRight)),size=Math.min(size,maxSize),k=Math.floor(maxSize/size),isNaN(k)||!1===isFinite(k))&&(k=1);h&&k?k=Math.min(k,h):h?k=h:k||(k=1);return k};h.prototype.__redistributeItems=function(a,b){var c=this.__calculateItemsPerPage(a);if(c===a.getAttribute("__itemsPerPage"))this._isFlexBoxDeprecatedImplementation()&&
this.__recalculatePageCount(a,b);else{a.setAttributeResolvedValue("__itemsPerPage",c);var d=document.getElementById(a.getId()+"_pageContainer"),e=null;b||(e=this.getCurrentPageIndex(a),e=d.childNodes[e].firstChild.id);for(var g=d.firstElementChild;g;){var h=g.nextElementSibling;if(g.childElementCount>c)for(var k=g.childElementCount-1;k>=c;k--){var m=g.childNodes[k];m.classList.contains("amx-empty")?adf.mf.api.amx.removeDomNode(m):(h||(h=document.createElement("div"),h.className="amx-filmStrip_page",
d.appendChild(h)),h.firstElementChild?h.insertBefore(m,h.firstElementChild):h.appendChild(m))}else if(g.childElementCount<c&&h)for(var n=c-g.childElementCount,k=0;k<n&&(m=h.firstElementChild,m.classList.contains("amx-empty")?adf.mf.api.amx.removeDomNode(m):g.appendChild(m),0!==h.childNodes.length||(m=h,h=h.nextElementSibling,adf.mf.api.amx.removeDomNode(m),h));k++);g=h}g=d.lastElementChild;for(d=g.childNodes.length;d<c;d++)emptyItem=document.createElement("div"),emptyItem.className="amx-filmStripItem amx-empty",
g.appendChild(emptyItem);this.__recalculatePageCount(a,b);this.__recalculateInitialPage(a,e,b)}};h.prototype.__recalculateInitialPage=function(a,b,c){for(var d=document.getElementById(a.getId()+"_pageContainer"),e=document.createTreeWalker(d,NodeFilter.SHOW_ELEMENT,{acceptNode:function(a){return a===d||a.parentNode===d?NodeFilter.FILTER_SKIP:a.classList.contains("amx-filmStripItem")?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}}),g=0,h=!1;e.nextNode();){var k=e.currentNode;if(b&&k.id===b||!b&&
k.classList.contains("adfmf-filmStripItem-selected")){if(b=k.parentNode)for(;b.previousSibling;)g++,b=b.previousSibling;h=!0;break}}!h&&c?(g=B(a),null==g&&(g=v(a)?this.getPageCount(a)-1:0)):v(a)&&(g=this.getPageCount(a)-1-g);this.setCurrentPageByIndex(a,g)};h.prototype.__recalculatePageCount=function(a,b){var c=this._isFlexBoxDeprecatedImplementation();b=b||c;var d=this.getPageCount(a),e=a.getId(),g=document.getElementById(e+"_pageContainer"),e=document.getElementById(e+"_pageControl"),h=g.childElementCount;
if(b||d!==h)"vertical"===a.getAttribute("orientation")?(c=c?h*g.parentNode.offsetHeight+"px":100*h+"%",g.style.width="",g.style["min-width"]="",g.style.height=c,g.style["min-height"]=c):(c=c?h*g.parentNode.offsetWidth+"px":100*h+"%",g.style.height="",g.style["min-height"]="",g.style.width=c,g.style["min-width"]=c);if(e&&(b||e.childElementCount!==h))for(adf.mf.api.amx.emptyHtmlElement(e),c=0;c<h;c++)A(a,e,this._createPageControlTapHandler(a,c,g.childNodes));this.setPageCount(a,h)};h.prototype.postDisplay=
function(a,b){var c=document.getElementById(b.getId()+"_pageContainer");if(c)var d=c.firstElementChild;d&&(d.className="amx-filmStrip_page",d.childNodes&&0!==d.childNodes.length&&(this._renderPageControl(b,a),this.__redistributeItems(b,!0)))};h.prototype._isFlexBoxDeprecatedImplementation=function(){if(null==this._deprecated)if("undefined"!==typeof CSS&&CSS.supports("(display: flex) or (display: -webkit-flex) or (display: -ms-flex)"))this._deprecated=!1;else{var a=document.createElement("div");a.style.display=
"-ms-flex";a.style.display="-webkit-flex";a.style.display="flex";document.body.appendChild(a);this._deprecated="-ms-flex"!==a.style.display&&"-webkit-flex"!==a.style.display&&"flex"!==a.style.display;document.body.removeChild(a)}return this._deprecated};var A=function(a,b,c){var d=document.createElement("div");d.className="amx-filmStrip_pageControlButton";adf.mf.api.amx.addBubbleEventListener(d,"tap",c,null);c=document.createElement("div");c.className="amx-filmStrip_pageControlButton-chevron";d.appendChild(c);
v(a)&&b.firstChild?b.insertBefore(d,b.firstChild):b.appendChild(d);return d};h.prototype._createPageControlTapHandler=function(a,b,c){var d=this;return function(e){u(c,!0);d.setCurrentPageByIndex(a,b)}};var B=function(a){a=a.getClientState();return null==a||null==a._selectedPage?null:a._selectedPage};h.prototype.refresh=function(a,b){h.superclass.refresh.call(this,a,b);var c=a.getId(),d=document.getElementById(c),e=b.hasChanged("inlineStyle")||b.hasChanged("styleClass")||b.hasChanged("itemsPerPage"),
g=!1;if(b.hasChanged("pageControlPosition")){var k=this._renderPageControl(a,d);if(k){var m=document.getElementById(c+"_pageContainer");adf.mf.api.amx.emptyHtmlElement(k);var n=this.getPageCount(a),t=this.getCurrentPageIndex(a);v(a)&&(t=n-1-t);for(var u=0;u<n;u++){var w=A(a,k,this._createPageControlTapHandler(a,u,m.childNodes));u===t&&w.classList.add("selected")}}}b.hasChanged("orientation")&&("vertical"===a.getAttribute("orientation")?d.classList.add("vertical"):d.classList.remove("vertical"),g=
e=!0);b.hasChanged("itemSizing")&&("stretched"===a.getAttribute("itemSizing")?d.classList.add("amx-filmStrip-stretchItems"):d.classList.remove("amx-filmStrip-stretchItems"),e=!0);b.hasChanged("shortDesc")&&((k=a.getAttribute("shortDesc"))?d.setAttribute("title",k):d.removeAttribute("title"));b.hasChanged("valign")&&D(d,"valign",b.getOldValue("valign"),a.getAttribute("valign"));b.hasChanged("halign")&&D(d,"halign",b.getOldValue("halign"),a.getAttribute("halign"));b.hasChanged("value")&&!0!==b.getCustomValue("bulkLoad")&&
(d=b.getCustomValue("amxNodeCollectionChanges"))&&(d.deleted.forEach(function(a){a=document.getElementById(a.getId());adf.mf.api.amx.removeDomNode(a)}),d.replaced.forEach(function(a){!1!==a.getAttribute("rendered")?a.rerender():(a=document.getElementById(a.getId()),adf.mf.api.amx.removeDomNode(a))}),m=document.getElementById(c+"_pageContainer"),d.created.forEach(function(a){!1!==a.getAttribute("rendered")&&(a=a.render(),m.lastElementChild.appendChild(a))}),e=!0);e&&(this.__redistributeItems(a),g&&
this.__recalculatePageCount(a,!0))};var D=function(a,b,c,d){c&&a.classList.remove(b+"-"+c);d&&a.classList.add(b+"-"+d)}})();