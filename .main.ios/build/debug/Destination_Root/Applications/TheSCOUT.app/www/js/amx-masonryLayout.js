/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------------- amx-masonryLayout.js -------------------- */
/* ------------------------------------------------------ */
(function ()
{
  /**
   * An event for Masonry Layout reorder changes.
   * See also the Java API oracle.adfmf.amx.event.MasonryReorderEvent.
   * @param {array} itemOrder An Array of integers (indices), or a String
   *   with comma-separated indices representing the new order of items
   *   in Masonry Layout
   * @constructor
   */
  adf.mf.api.amx.MasonryReorderEvent = function (itemOrder)
  {
    this.itemOrder = itemOrder;
    this[".type"] = "oracle.adfmf.amx.event.MasonryReorderEvent";
  };

  // tile dimensions constants
  var _MASONRY_1X1_CLASS = "amx-masonryLayoutItem-size-1x1";
  var _MASONRY_1X2_CLASS = "amx-masonryLayoutItem-size-1x2";
  var _MASONRY_1X3_CLASS = "amx-masonryLayoutItem-size-1x3";
  var _MASONRY_2X1_CLASS = "amx-masonryLayoutItem-size-2x1";
  var _MASONRY_2X2_CLASS = "amx-masonryLayoutItem-size-2x2";
  var _MASONRY_2X3_CLASS = "amx-masonryLayoutItem-size-2x3";
  var _MASONRY_3X1_CLASS = "amx-masonryLayoutItem-size-3x1";
  var _MASONRY_3X2_CLASS = "amx-masonryLayoutItem-size-3x2";
  // other class name constants
  var MASONRY_LAYOUT_ITEM = "amx-masonryLayoutItem";
  var MASONRY_LAYOUT_ITEM_DRAGGING = "amx-masonryLayoutItem-dragging";
  var _MASONRY_LAYOUT_TRANSITION_RESIZE_TO_CLASS = "amx-masonryLayout-transition-resize-to";
  var _MASONRY_LAYOUT_TRANSITION_RESIZE_TO_FAST_CLASS = "amx-masonryLayout-transition-resize-to-fast";
  var _MASONRY_TRANSITION_MOVE_TO_CLASS = "amx-masonryLayoutItem-transition-move-to";
  var _MASONRY_TRANSITION_MOVE_TO_FAST_CLASS = "amx-masonryLayoutItem-transition-move-to-fast";
  var _MASONRY_TRANSITION_RESIZE_TO_CLASS = "amx-masonryLayoutItem-transition-resize-to";
  var _MASONRY_TRANSITION_HIDE_FROM_CLASS = "amx-masonryLayoutItem-transition-hide-from";
  var _MASONRY_TRANSITION_HIDE_TO_CLASS = "amx-masonryLayoutItem-transition-hide-to";
  var _MASONRY_TRANSITION_SHOW_FROM_CLASS = "amx-masonryLayoutItem-transition-show-from";
  var _MASONRY_TRANSITION_SHOW_TO_CLASS = "amx-masonryLayoutItem-transition-show-to";

  /**
   * handler for the amx:masonryLayout tag. It represents one masonryLayout.
   */
  var masonryLayout = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "masonryLayout");

  /**
   * Initialize the masonryLayout handler.
   */
  masonryLayout.prototype.Init = function ()
  {
    masonryLayout.superclass.Init.call(this);
  };

  /**
   * Returns false.
   * @param {adf.mf.api.amx.AmxNode} amxNode amx node that represents Masonry Layout
   * @returns {Boolean}
   */
  masonryLayout.prototype.createChildrenNodes = function (amxNode)
  {
    return false;
  };

  /**
   * Calls visitStampedChildren ().
   * @param {adf.mf.api.amx.AmxNode} amxNode dom node that represents Masonry Layout
   * @param {Object} visitContext
   * @param {Object} callback
   */
  masonryLayout.prototype.visitChildren = function (amxNode, visitContext, callback)
  {
    return amxNode.visitStampedChildren(null, null, null, visitContext, callback);
  };

  var eventTypeConvertor = null;

  if (amx.hasTouch())
  {
    eventTypeConvertor =
    {
      "mousedown" : "touchstart", "mousemove" : "touchmove", "mouseup" : "touchend"
    };
  }
  else
  {
    eventTypeConvertor =
    {
      "touchstart" : "mousedown", "touchmove" : "mousemove", "touchend" : "mouseup"
    };
  }
 
  /**
   * Create dom element for masonryLayout.
   * @param {adf.mf.api.amx.AmxNode} mlAmxNode masonryLayoutItem amx node
   * @return {HTMLElement} domElement div which represents one masonryLayout
   */
  masonryLayout.prototype.render = function (mlAmxNode)
  {
    var _masonryLayout = document.createElement("div");
    this.initMLC(mlAmxNode, _masonryLayout);

    var nodes = [];
    var descendants = mlAmxNode.renderDescendants();
    for (var i = 0;i < descendants.length;i++)
    {
      var n = descendants[i];
      if (n)
      {
        n._originalIndex = i;
        nodes.push(n);
      }
    }
    this._applyOrder(mlAmxNode, _masonryLayout, nodes);
    var id = mlAmxNode.getId();
    var dataObject = { id: id, rtl: isRTL(), dragContext: new DragContext (), amxNode: mlAmxNode };
    if (!_masonryLayout.classList.contains("amx-masonryLayout-noDrag")) 
    {
      this._addListener(_masonryLayout, "mousedown", this._createMouseDownCallback(), dataObject);
      this._addListener(_masonryLayout, "mousemove", this._createMouseMoveCallback(), dataObject);
      this._addListener(_masonryLayout, "mouseup", this._createMouseUpCallback(mlAmxNode), dataObject);
    }
    return _masonryLayout;
  };

  /**
   * Calls MasonryLayoutCommon.setup ().
   * @param {HTMLElement} domNode masonryLayout dom node
   * @param {adf.mf.api.amx.AmxNode} amxNode masonryLayout amx node
   */
  masonryLayout.prototype.postDisplay = function (domNode, amxNode)
  {
    if (domNode._mlCommon) {
      domNode._mlCommon.setup(true);
    }
  };

  /**
   * Returns actio used to update descendant nodes.
   * @param {adf.mf.api.amx.AmxNode} amxNode masonryLayout amx node
   * @param {object} descendantChanges
   */
  masonryLayout.prototype.getDescendentChangeAction = function (amxNode, descendantChanges)
  {
    return adf.mf.api.amx.AmxNodeChangeResult['REFRESH'];
  };

  /**
   * @param {adf.mf.api.amx.AmxNode} amxNode masonryLayoutItem amx node
   * @param {Object} attributeChanges map of the changed attributes
   */
  masonryLayout.prototype.updateChildren = function (amxNode, attributeChanges)
  {
    return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];
  };

  /**
   * Updates dom element for masonryLayout.
   * @param {adf.mf.api.amx.AmxNode} amxNode masonryLayoutItem amx node
   * @param {Object} attributeChanges map of the changed attributes
   * @param {Object} descendentChanges map of the changed attributes
   */
  masonryLayout.prototype.refresh = function (amxNode, attributeChanges, descendentChanges)
  {
    var id = amxNode.getId();
    var _masonryLayout = document.getElementById(id);
    if (_masonryLayout._locked) {
      _masonryLayout._refresh = true;
      return;
    }
    _masonryLayout._locked = true;
    var oldNodes =
    {
    };
    var newNodes = [];
    var ns = _masonryLayout.childNodes;
    for (var i = 0;i < ns.length;i++)
    {
      if (ns[i].id)
      {
        oldNodes[ns[i].id] = ns[i];
      }
    }

    var amxNodes = amxNode.getRenderedChildren();
    var order = this._getInitialOrder(amxNode, amxNodes.length);
    var newNodeIndex = [];
    var position = 0;
    var updatedKeys = [];
    if (descendentChanges && descendentChanges.getAffectedNodes())
    {
      var node = descendentChanges.getAffectedNodes()[0];
      var changes = descendentChanges.getChanges(node);
      if (node && changes && changes.getCollectionChange("value"))
      {
        updatedKeys = changes.getCollectionChange("value").getUpdatedKeys();
      }
    }
    var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
    for (var i = 0; i < amxNodes.length; i++)
    {
      var index = order ? order [i] : i;
      var childAmxNode = amxNodes[index];
      if (updatedKeys.indexOf(index + '') > -1)
      {
        args.setAffectedAttribute(childAmxNode, "xx");
      }

      var childId = childAmxNode.getId();
      if (oldNodes[childId])
      {
        var oldNode = oldNodes[childId];
        if (oldNode)
          delete oldNodes[childId];
        moveNode(_masonryLayout, oldNode, _masonryLayout.children[position]);
        position++;

        var dimension = convertDimension (childAmxNode.getAttribute("dimension"));

        if (!oldNode.classList.contains (dimension))
        {
          var mlCommon = _masonryLayout._mlCommon;
          id = childAmxNode.getId ().replace(/:/g, "\\:");
          mlCommon.resizeTile("#" + id, dimension);  
        }

        continue;
      }
      var newNode = childAmxNode.render();
      if (newNode)
      {
        newNodes.push(newNode);
        newNodeIndex.push(position);
      }
    }
    if (updatedKeys.length > 0)
    {
      adf.mf.api.amx.markNodeForUpdate(args);
    }

    var oldNodes2 = [];
    for (var id in oldNodes)
    {
      var node = oldNodes[id];
      oldNodes2.push(node);
    }
    var mlCommon = _masonryLayout._mlCommon;
    if (oldNodes2.length > 0)
    {
      mlCommon._arInfoletsToHide = oldNodes2;
      mlCommon._hidingInfolets = true;
    }
    if (newNodes.length > 0)
    {
      mlCommon._arInfoletsToShow = newNodes;
      mlCommon._showingInfolets = true;
      for (var i = 0;i < newNodes.length;i++)
      {
        var n = newNodes[i];
        n.style.top = "-1px";
        n.style.left = "-1px";
        n.classList.add(_MASONRY_TRANSITION_SHOW_FROM_CLASS);
        mlCommon.insertTileDomElem(n, newNodeIndex[i]);
      }
    }
    mlCommon._queueRelayout();

    masonryLayout.superclass.refresh.call(this, amxNode, attributeChanges, descendentChanges);
  };
 
  /**
   * Function removes registered listeners.
   *
   * @param amxNode
   * @param node dom div element
   */
  masonryLayout.prototype.destroy = function (node, amxNode)
  {
    var resizeListener = amxNode.getAttribute("resizeListener");
    window.removeEventListener('resize', resizeListener);
  };
  
  /**
   * Initialize MasonryLayoutCommon.
   * @param {adf.mf.api.amx.AmxNode} amxNode amx node that represents Masonry Layout
   * @param {HTMLElement} _masonryLayout div node that represents Masonry Layout
   */
  masonryLayout.prototype.initMLC = function (amxNode, _masonryLayout)
  {
    _masonryLayout.classList.add("amx-masonryLayout");
    _masonryLayout.className += " " + amxNode.getAttribute ("styleClass");
    var automationEnabled = false;
    var selectors =
    {
    };
    selectors.tiles = "." + MASONRY_LAYOUT_ITEM + "." + _MASONRY_1X1_CLASS + ", " + "." + MASONRY_LAYOUT_ITEM + "." + _MASONRY_1X2_CLASS + ", " + "." + MASONRY_LAYOUT_ITEM + "." + _MASONRY_1X3_CLASS + ", " + "." + MASONRY_LAYOUT_ITEM + "." + _MASONRY_2X1_CLASS + ", " + "." + MASONRY_LAYOUT_ITEM + "." + _MASONRY_2X2_CLASS + ", " + "." + MASONRY_LAYOUT_ITEM + "." + _MASONRY_2X3_CLASS + ", " + "." + MASONRY_LAYOUT_ITEM + "." + _MASONRY_3X1_CLASS + ", " + "." + MASONRY_LAYOUT_ITEM + "." + _MASONRY_3X2_CLASS;
    var styles =
    {
    };
    styles.transitionComponentResizeToStyleClass = _MASONRY_LAYOUT_TRANSITION_RESIZE_TO_CLASS;
    styles.transitionComponentResizeToFastStyleClass = _MASONRY_LAYOUT_TRANSITION_RESIZE_TO_FAST_CLASS;
    styles.transitionMoveToStyleClass = _MASONRY_TRANSITION_MOVE_TO_CLASS;
    styles.transitionMoveToFastStyleClass = _MASONRY_TRANSITION_MOVE_TO_FAST_CLASS;
    styles.transitionResizeToStyleClass = _MASONRY_TRANSITION_RESIZE_TO_CLASS;
    styles.transitionHideFromStyleClass = _MASONRY_TRANSITION_HIDE_FROM_CLASS;
    styles.transitionHideToStyleClass = _MASONRY_TRANSITION_HIDE_TO_CLASS;
    styles.transitionShowFromStyleClass = _MASONRY_TRANSITION_SHOW_FROM_CLASS;
    styles.transitionShowToStyleClass = _MASONRY_TRANSITION_SHOW_TO_CLASS;

    var callbackInfo =
    {
      addStyleClassName: function(elem, className)
      {
        if (className != null && className != "")
        {
          elem.classList.add.apply(elem.classList, className.split(" "));
        }
      },
      removeStyleClassName: function(elem, className)
      {
        if (className != null && className != "")
        {
          elem.classList.remove.apply(elem.classList, className.split(" "));
        }
      }
    };
    callbackInfo.getSizeStyleClassName = function (e)
    {
      return getDimensionClassName(e);
    };
    callbackInfo.getTileSpan = function (e)
    {
      if (e.classList.contains(_MASONRY_1X1_CLASS))
        return {colSpan : 1, rowSpan : 1};
      if (e.classList.contains(_MASONRY_1X2_CLASS))
        return {colSpan : 1, rowSpan : 2};
      if (e.classList.contains(_MASONRY_1X3_CLASS))
        return {colSpan : 1, rowSpan : 3};
      if (e.classList.contains(_MASONRY_2X1_CLASS))
        return {colSpan : 2, rowSpan : 1};
      if (e.classList.contains(_MASONRY_2X2_CLASS))
        return {colSpan : 2, rowSpan : 2};
      if (e.classList.contains(_MASONRY_2X3_CLASS))
        return {colSpan : 2, rowSpan : 3};
      if (e.classList.contains(_MASONRY_3X1_CLASS))
        return {colSpan : 3, rowSpan : 1};
      if (e.classList.contains(_MASONRY_3X2_CLASS))
        return {colSpan : 3, rowSpan : 2};
      return {colSpan : 1, rowSpan : 1};
    };
    callbackInfo.showTileOnEndFunc = function (tile)
    {
    };
    callbackInfo.hideTileOnEndFunc = function (tile)
    {
      adf.mf.api.amx.removeDomNode(tile);
    };
    
    /**
     * Called after each change in masonryLayout (resize, move, hide/show)
     */
    callbackInfo.layoutOnEndFunc = function ()
    {
      _masonryLayout.stopDragging = false;
      var masonryLayoutAMXN = adf.mf.api.amx.AmxNode.getAmxNodeForElement(_masonryLayout);
      var dragContext = masonryLayoutAMXN.getAttribute("_pendingMove");
      if (dragContext) {
        masonryLayoutAMXN.setAttributeResolvedValue("_pendingMove", null);
        _moveTile (dragContext, _masonryLayout);
      }
    };
    
    /**
     * Called after each change in masonryLayout (resize, move, hide/show)
     */
    callbackInfo.layoutCycleOnStartFunc = function ()
    {
    };
    
    /**
     * Called after each change in masonryLayout (resize, move, hide/show)
     */
    callbackInfo.layoutCycleOnEndFunc = function ()
    {
      if (_masonryLayout._locked) {
        _masonryLayout._locked = false;
        if (_masonryLayout._refresh) {
          _masonryLayout._refresh = false;
          masonryLayout.prototype.refresh (amxNode);
        }
      }
    };

    var mlCommon = new window.adf.shared.impl.masonryLayout.MasonryLayoutCommon(_masonryLayout, isRTL(), automationEnabled, selectors, styles, callbackInfo);
    var resizeListener = function (event)
    {
      // bug 18391802: on resize handler must be postponed after the height/width have been set on 'body'
      setTimeout(function (e)
      {
        if (_masonryLayout._locked) {
          _masonryLayout._refresh = true;
          return;
        }
        _masonryLayout._locked = true;
        mlCommon.resizeNotify();
      }, 250, event);// here's the delay timout
    };
    amxNode.setAttributeResolvedValue("resizeListener", resizeListener);
    window.addEventListener('resize', resizeListener);
    
    _masonryLayout._mlCommon = mlCommon;
  };

  /**
   * Creates bubble event listener.
   * @param {HTMLElement} node dom node
   * @param {String} type event type
   * @param {Object} listener client listener
   * @param {Object} data data payload object
   */
  masonryLayout.prototype._addListener = function(node, type, listener, data)
  {
    /**
     * Converts mouse type events on touch events.
     * @param {type} type mouse type event name
     * @returns {String} touch type event name
     */
    var convertEventType = function(type)
    {
      var result = eventTypeConvertor[type];
      if (result)
      {
        return result;
      }
      return type;
    };
    if (amx.hasTouch())
    {
      adf.mf.api.amx.addBubbleEventListener(node, convertEventType(type), function (event)
      {
        if (event.type === "touchend")
        {
          listener(null, null, event);
          return;
        }
        if (event.touches.length != 1)
        {
          return;
        }
        var touch = event.touches[0];
        listener(touch.pageX, touch.pageY, event);
      }, data);
    }
    else
    {
      adf.mf.api.amx.addBubbleEventListener(node, convertEventType(type), function (event)
      {
        listener(event.pageX, event.pageY, event);
      }, data);
    }
  };
 
  masonryLayout.prototype._createMouseDownCallback = function()
  {
    var that = this;
    return function (pageX, pageY, event)
    {
      var tile = that._getTile(event);
      var amxNode = adf.mf.api.amx.AmxNode.getAmxNodeForElement(tile);
      var _masonryLayout = document.getElementById(event.data.id);

      if (!tile)
      {
        return;
      }

      if (ignoreMouseDown (event))
      {
        // Ignore for resize and close buttons
        return false;
      }
      var dragContext = event.data.dragContext;
      dragContext.timeout = window.setTimeout(function ()
      {
        dragContext.timeout = 0;
        if (isRTL ())
        {
          dragContext.startX = parseInt(tile.style.right, 10);
        }
        else
        {
          dragContext.startX = tile.offsetLeft;
        }
        dragContext.startY = tile.offsetTop;
        dragContext.startPageX = pageX;
        dragContext.startPageY = pageY;
        dragContext.tile = tile;

        var ghost = document.createElement("div");
        ghost.classList.add(MASONRY_LAYOUT_ITEM);
        ghost.classList.add(getDimensionClassName(tile));
        ghost.setAttribute("style", "position: absolute; background-color: lightGray");
        if (isRTL ())
        {
          ghost.style.right = tile.style.right;
        }
        else
        {
          ghost.style.left = tile.style.left;
        }
        ghost.style.top = tile.style.top;
        ghost._ghost = true;
        tile.style.zIndex = 300;
        tile._dragging = true;
        tile.classList.remove(MASONRY_LAYOUT_ITEM);
        tile.classList.add(MASONRY_LAYOUT_ITEM_DRAGGING);
        _masonryLayout.insertBefore(ghost, tile);
        dragContext.ghost = ghost;
      }, 125);
    };
  };

  masonryLayout.prototype._createMouseMoveCallback = function()
  {
    var that = this;
    return function (pageX, pageY, event)
    {
      var dragContext = event.data.dragContext;
      var _masonryLayout = document.getElementById(event.data.id);

      if (dragContext.timeout)
      {
        window.clearTimeout(dragContext.timeout);
        dragContext.timeout = null;
        return;
      }
      var tile = dragContext.tile;
      if (!dragContext.ghost)
      {
        return;
      }
      event.preventDefault();

      var x = dragContext.startX + pageX - dragContext.startPageX;
      var y = dragContext.startY + pageY - dragContext.startPageY;
      tile.style.left = x + 'px';
      if (isRTL ())
      {
        x = dragContext.startX - (pageX - dragContext.startPageX);
        tile.style.right = x + 'px';
        tile.style.left = "";
      }
      tile.style.top = y + 'px';
      if (_masonryLayout.stopDragging)
      {
        return;
      }

      var mlX = adf.mf.internal.amx.getElementLeft(_masonryLayout);
      var cx = pageX - mlX;
      if (isRTL ())
      {
        mlX = _masonryLayout.getBoundingClientRect().right;
        cx = mlX - pageX;
      }
      var mlY = adf.mf.internal.amx.getElementTop(_masonryLayout);
      var cy = pageY - mlY;
      var index = that._getTilePosition(tile.parentNode, cx, cy);
      if (index > 0)
      {
        if (index < _masonryLayout.childNodes.length)
        {
          if (_masonryLayout.childNodes.item(index)._ghost)
            return;
          var beforeNode = _masonryLayout.childNodes.item(index);
          moveNode(_masonryLayout, dragContext.ghost, beforeNode);
          dragContext.insertBefore = beforeNode;
        }
        else
        {
          adf.mf.api.amx.removeDomNode(dragContext.ghost);
          _masonryLayout.appendChild(dragContext.ghost);
        }
        _masonryLayout.stopDragging = true;
        if (dragContext.request)
        {
          window.cancelAnimationFrame(dragContext.request);
          dragContext.request = 0;
        }
        dragContext.request = window.requestAnimationFrame(function ()
        {
          if (_masonryLayout._locked) {
            _masonryLayout._refresh = true;
            return;
          }
          _masonryLayout._locked = true;
          _masonryLayout._mlCommon.setup(false);
        });
      }
    };
  };
 
  masonryLayout.prototype._createMouseUpCallback = function(masonryLayoutAMXN)
  {
    return function (pageX, pageY, event)
    {
      var dragContext = event.data.dragContext;
      var _masonryLayout = document.getElementById(event.data.id);
      if (_masonryLayout.stopDragging)
      {
        // If user is too fast, and transition/animation is still in progress
        masonryLayoutAMXN.setAttributeResolvedValue("_pendingMove", dragContext);
        return;
      }
      if (dragContext.timeout)
      {
        window.clearTimeout(dragContext.timeout);
        dragContext.timeout = 0;
        return;
      }
      var ghost = dragContext.ghost;
      if (!ghost)
      {
        dragContext.clear ();
        return;
      }
      event.preventDefault();
	  _moveTile (dragContext, _masonryLayout);
    };
  };

  /**
   * Returns tile that given dom node is nested in.
   *
   * @param {HTMLEvent} event
   * @returns {HTMLElement}
   */
  masonryLayout.prototype._getTile = function(event)
  {
    var node = event.target;
    while (node)
    {
      if (node.classList.contains("amx-masonryLayoutItem"))
      {
        return node;
      }
      if (node.classList.contains("amx-masonryLayout"))
      {
        return null;
      }
      node = node.parentNode;
    }
    return null;
  };

  /**
   * Returns value of initial order attribute of masonryLayout node.
   * @param {adf.mf.api.amx.AmxNode} amxNode masonryLayout node
   * @param {int} length
   * @returns {Array} Array of indices.
   */
  masonryLayout.prototype._getInitialOrder = function(amxNode, length)
  {
    var order = amxNode.getAttribute("initialOrder");
    if (!order)
    {
      return null;
    }
    var result = [];
    if (typeof order === "string")
    {
      order = order.split(',');
    }
    if (order.length)
    {
      var dup = {};
      for (var i = 0; i < order.length; i++) {
        var index = parseInt (order [i]);
        if (index < length && !dup [index]) {
          result.push (index);
          dup [index] = true;
        }
      }
    }
    for (var i = 0; i < length; i++) {
      if (result.indexOf (i) == -1)
        result.push (i);
    }
    return result;
  };

  /**
   * Apply initialOrder attribute value on dom node order.
   * @param {adf.mf.api.amx.AmxNode} amxNode
   * @param {HTMLElement} node
   * @param {Array} children
   */
  masonryLayout.prototype._applyOrder = function(amxNode, node, children)
  {
    var order = this._getInitialOrder(amxNode, children.length);
    if (!order)
    {
      for (var i = 0;i < children.length;i++)
      {
        node.appendChild(children[i]);
      }
      return;
    }
    for (var i = 0;i < order.length;i++)
    {
      if (order[i] < children.length)
        node.appendChild(children[order[i]]);
    }
  };

  /**
   * Rerender descendants for amxNode
   * @param {adf.mf.api.amx.AmxNode} amxNode
   */
  masonryLayout._renderDescendants = function(amxNode)
  {
    var ch = amxNode.getChildren();
    for (var i = 0;i < ch.length;i++)
    {
      var amxCh = ch[i];
      if (document.getElementById(amxCh.getId()) != null)
      {
        amxCh.rerender();
      }
    }
  };
  
  /**
   * Returns index of tile on given coordinates.
   * @param {HTMLElement} masonryLayout
   * @param {Number} x
   * @param {Number} y
   * @returns {Number} index of tile on given coordinates.
   */
  masonryLayout.prototype._getTilePosition = function(masonryLayout, x, y)
  {
    var children = masonryLayout.childNodes;
    for (var i = 1, k = children.length;i < k;i++)
    {
      var tile = children[i];
      if (tile._dragging)
        continue;
      if (tile._ghost)
        continue;

      if (isRTL())
      {
        var offsetRight = parseInt(tile.style.right, 10);
        if ((x < (offsetRight + tile.offsetWidth)) && (x > offsetRight) && (tile.offsetTop < y) && (y < tile.offsetTop + tile.offsetHeight))
        {
          if ((x - offsetRight) > (tile.offsetWidth / 2))
          {
            return i;
          }
          else
          {
            return i + 1;
          }
        }
      } else if ((tile.offsetLeft < x) && (x < tile.offsetLeft + tile.offsetWidth) && (tile.offsetTop < y) && (y < tile.offsetTop + tile.offsetHeight))
      {
        if (x > (tile.offsetLeft + tile.offsetWidth / 2))
        {
          return i;
        }
        else
        {
          return i + 1;
        }
      }
    }
    return  - 1;
  };

  function isRTL ()
  {
    return document.documentElement.dir == "rtl";
  };
  
  function ignoreMouseDown (event) {
    for (var element = event.target; element != null; element = element.parentNode) {
      if (element.classList.contains("amx-masonryLayoutItem") ||
          element.classList.contains("amx-masonryLayout")
      )
        return false;
      if (element.classList.contains("amx-commandLink") ||
          element.classList.contains("amx-commandButton")
      )
        return true;
    }
    return false;
  }

  function _moveTile (dragContext, _masonryLayout) {
      var tile = dragContext.tile;
	  var ghost = dragContext.ghost;
      if (isRTL ())
      {
        tile.style.right = ghost.style.right;
        tile.style.left = "";
      } else
      {
        tile.style.left = ghost.style.left;
      }
      tile.style.top = ghost.style.top;
      tile.style.zIndex = 0;
      tile.classList.add(MASONRY_LAYOUT_ITEM);
      tile.classList.remove(MASONRY_LAYOUT_ITEM_DRAGGING);
      tile._dragging = false;
      adf.mf.api.amx.removeDomNode(ghost);
      if (dragContext.insertBefore)
      {
          if (tile != dragContext.insertBefore)
          {
            moveNode(_masonryLayout, tile, dragContext.insertBefore);
          }
      }
      else
      {
        if (tile.parentNode == _masonryLayout)
        {
          _masonryLayout.removeChild(tile);
        }
        _masonryLayout.appendChild(tile);
      }
      dragContext.clear ();

      var reorderEvent = new adf.mf.api.amx.MasonryReorderEvent(getOrder(_masonryLayout));
	  var masonryLayoutAMXN = adf.mf.api.amx.AmxNode.getAmxNodeForElement(_masonryLayout);
      adf.mf.api.amx.processAmxEvent(masonryLayoutAMXN, "reorder", undefined, undefined, reorderEvent);
  }

  /**
   * Return class name that represent type of tile represented by given div element.
   * @param {HTMLElement} tile	 tile element
   * @returns {String} class name that represent type of tile represented by given div element.
   */
  function getDimensionClassName(tile)
  {
    if (tile.classList.contains(_MASONRY_1X1_CLASS))
      return _MASONRY_1X1_CLASS;
    if (tile.classList.contains(_MASONRY_1X2_CLASS))
      return _MASONRY_1X2_CLASS;
    if (tile.classList.contains(_MASONRY_1X3_CLASS))
      return _MASONRY_1X3_CLASS;
    if (tile.classList.contains(_MASONRY_2X1_CLASS))
      return _MASONRY_2X1_CLASS;
    if (tile.classList.contains(_MASONRY_2X2_CLASS))
      return _MASONRY_2X2_CLASS;
    if (tile.classList.contains(_MASONRY_2X3_CLASS))
      return _MASONRY_2X3_CLASS;
    if (tile.classList.contains(_MASONRY_3X1_CLASS))
      return _MASONRY_3X1_CLASS;
    if (tile.classList.contains(_MASONRY_3X2_CLASS))
      return _MASONRY_3X2_CLASS;
    return _MASONRY_1X1_CLASS;
  }
  
  function DragContext () {
	  this.timeout = 0;
	  this.request = 0;
	  this.ghost = null;
	  this.tile = null;
	  this.insertBefore = null;
	  this.startX = 0;
	  this.startY = 0;
	  this.startPageX = 0;
	  this.startPageY = 0;
  }
  
  DragContext.prototype.clear = function () {
	  this.timeout = 0;
	  this.request = 0;
	  this.ghost = null;
	  this.tile = null;
	  this.insertBefore = null;
	  this.startX = 0;
	  this.startY = 0;
	  this.startPageX = 0;
	  this.startPageY = 0;
  };

  /**
   * handler for the amx:masonryLayoutItem tag that should be nested inside of the amx:masonryLayout tag. It represents
   * one item of the masonryLayout.
   */
  var masonryLayoutItem = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "masonryLayoutItem");

  /**
   * Calls createStampedChildren.
   * @param {adf.mf.api.amx.AmxNode} amxNode masonryLayoutItem amx node
   * @return {adf.mf.api.amx.AmxNodeCreateChildrenNodesResult} result
   */
  masonryLayoutItem.prototype.createChildrenNodes = function (amxNode)
  {
    amxNode.createStampedChildren(null, [null, "primary", "secondary"]);
    amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
    return adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["HANDLED"];
  };

  /**
   * Calls visitStampedChildren.
   * @param {adf.mf.api.amx.AmxNode} amxNode masonryLayoutItem amx node
   * @param {Object} visitContext
   * @param {Object} callback
   */
  masonryLayoutItem.prototype.visitChildren = function (amxNode, visitContext, callback)
  {
    return amxNode.visitStampedChildren(null, null, null, visitContext, callback);
  };

  /**
   * Create dome element for masonryLayoutItem.
   * @param {adf.mf.api.amx.AmxNode} amxNode masonryLayoutItem amx node
   * @return {HTMLElement} domElement div which represents one masonryLayoutItem
   */
  masonryLayoutItem.prototype.render = function (amxNode)
  {
    var tile = document.createElement("div");
    var dimension = convertDimension(amxNode.getAttribute("dimension"));
    tile.classList.add(dimension);
    var ch = amxNode.getChildren("primary");
    if (ch.length < 1)
    {
      ch = amxNode.getChildren();
      for (var i = 0;i < ch.length;i++)
      {
        var amxCh = ch[i];
        var n = amxCh.render();
        if (n)
        {
          tile.appendChild(n);
        }
      }
    }
    var id = amxNode.getId();
    var oldTile = document.getElementById(id);
    if (oldTile) {
      if (isRTL ())
      {
        tile.style.right = oldTile.style.right;
      }
      else
      {
        tile.style.left = oldTile.style.left;
      }
      tile.style.top = oldTile.style.top;
      tile.classList.remove(dimension);
      var oldDimension = getDimensionClassName(oldTile);
      tile.classList.add(oldDimension);

      var _masonryLayout = oldTile.parentNode;
      if (_masonryLayout._locked) {
        _masonryLayout._refresh = true;
      } else {
        _masonryLayout._locked = true;
        var mlCommon = _masonryLayout._mlCommon;
        id = id.replace(/:/g, "\\:");

        tile.id = id;
        _masonryLayout.appendChild (tile);
        _masonryLayout.removeChild (oldTile);
        mlCommon.resizeTile("#" + id, dimension);
        _masonryLayout.removeChild (tile);
        _masonryLayout.appendChild (oldTile);
      }
    }
    return tile;
  };

  /**
   *
   * @param {adf.mf.api.amx.AmxNode} amxNode masonryLayoutItem amx node
   * @param {Object} attributeChanges map of the changed attributes
   */
  masonryLayoutItem.prototype.updateChildren = function (amxNode, attributeChanges)
  {
    return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];
  };
  
  /**
   * Returns action used to update descendant nodes.
   * @param {adf.mf.api.amx.AmxNode} amxNode
   * @param {Object} descendantChanges
   */
  masonryLayoutItem.prototype.getDescendentChangeAction = function (amxNode, descendantChanges)
  {
    return adf.mf.api.amx.AmxNodeChangeResult['REFRESH'];
  };
  
  /**
   * Updates dome element for masonryLayoutItem.
   * @param {adf.mf.api.amx.AmxNode} amxNode masonryLayoutItem amx node
   * @param {Object} attributeChanges map of the changed attributes
   * @param {Object} descendentChanges map of the changed attributes
   */
  masonryLayoutItem.prototype.refresh = function (amxNode, attributeChanges, descendentChanges)
  {
    amxNode.getParent ().refresh (attributeChanges, descendentChanges);
  };

  /**
   * Returns array of tile's indexes.
   * @param {HTMLElement} masonryLayout
   * @returns {Array} Array if numbers.
   */
  function getOrder(masonryLayout)
  {
    var order = [];
    var children = masonryLayout.childNodes;
    for (var i = 1, k = children.length;i < k;i++)
    {
      if (children[i]._originalIndex !== undefined)
        order.push(children[i]._originalIndex);
    }
    return order;
  }

  /**
   * Move element before beforeElement
   * @param {HTMLElement}  parent Parent for element and beforeElement
   * @param {HTMLElement}  element Element to be inserted before beforeElement
   * @param {HTMLElement}  beforeElement
   */
  function moveNode(parent, element, beforeElement)
  {
    if (element === beforeElement) return;
    parent.removeChild(element);
    parent.insertBefore(element, beforeElement);
  };

  /**
   * Converts value of dimension attribute of amx:masonryLayout node to class name.
   *
   * @param {String} dimension value of dimension attribute of amx:masonryLayout node.
   * @returns {String} Class name that defines tile behaviour.
   */
  function convertDimension(dimension)
  {
    if ("1x1" == dimension)
      return _MASONRY_1X1_CLASS;
    else if ("1x2" == dimension)
      return _MASONRY_1X2_CLASS;
    else if ("1x3" == dimension)
      return _MASONRY_1X3_CLASS;
    else if ("2x1" == dimension)
      return _MASONRY_2X1_CLASS;
    else if ("2x2" == dimension)
      return _MASONRY_2X2_CLASS;
    else if ("2x3" == dimension)
      return _MASONRY_2X3_CLASS;
    else if ("3x1" == dimension)
      return _MASONRY_3X1_CLASS;
    else if ("3x2" == dimension)
      return _MASONRY_3X2_CLASS;
    return _MASONRY_1X1_CLASS;
  }
})();
