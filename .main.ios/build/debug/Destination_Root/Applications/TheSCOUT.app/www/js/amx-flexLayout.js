/* Copyright (c) 2015, Oracle and/or its affiliates. All rights reserved. */
/* ---------------------------------------------------------------------- */
/* -------------------------- amx-flexLayout.js ------------------------- */
/* ---------------------------------------------------------------------- */
(function ()
{
  /**
   * handler for the amx:flexLayout tag.
   */
  var flexLayout = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "flexLayout");

  /**
   * Initialize the flexLayout handler.
   */
  flexLayout.prototype.Init = function ()
  {
    flexLayout.superclass.Init.call(this);
    // register attribute processors - these processors are used to set class name or dom attribute to the
    // root element or its direct descendants.
    this._processors = [
      new CSSAttributeProcessor("orientation", "auto"),
      //new CSSAttributeProcessor("itemFlexibility", "equal"),
      new CSSChildAttributeProcessor("itemFlexibility", "equal"), // this adds support for the array of the values e.g. itemFlexibility="flexible, shrink-only, inflexible"
      new CSSAttributeProcessor("itemAlignment", "stretch"),
      new CSSAttributeProcessor("itemJustification", "space-between"),
      new CSSAttributeProcessor("styleClass", "", function (value) {return value;}),
      new DOMAttributeProcessor("inlineStyle", "style"),
      new DOMAttributeProcessor("landmark", "role", function (value) {return value && "none" !== value;})
    ];
  };

  /**
   * Renders descendant and wraps it into the wrapper container in case that descendant is not another flexLayout.
   * It also add info class "amx-flexLayout-deprecated" in case that flexLayout has to use old -webkit-box
   * implementation of the FlexBox.
   */
  var _renderChild = function(descendant, amxNode, deprecatedImplementation, animation)
  {
    var descendantElement = descendant.render();
    // flexLayout is only component that uses flexbox so we can nested it directly into the
    // layout. For all others create extra div that will shield the real children. We don't
    // want to mess with its display property directly since it could cause unexpected behavior.
    if (descendant.getTag().getName() !== amxNode.getTag().getName())
    {
      // wrap content to the container that provides sizing
      var childWrapper = document.createElement("div");
      // default styleClass of the inner component
      childWrapper.className = "amx-flexLayout-itemContainer";
      // append wrapper into the layout component
      childWrapper.appendChild(descendantElement);

      descendantElement = childWrapper;
    }
    // is deprecated so add info style class
    if (deprecatedImplementation)
    {
      // Android 4.3 and earlier - we need to use -webkit-box as an earlier implementation of the FlexBox
      // this implementation has major problems with dimensions that has to be fixed independently
      descendantElement.className += " amx-flexLayout-deprecated";
    }
    return descendantElement;
  };

  /**
   * Render main div and all its child nodes.
   */
  flexLayout.prototype.render = function (amxNode, id)
  {
    var rootElement = document.createElement("div");
    // render all the descendants
    var descendants = amxNode.getRenderedChildren();
    var deprecatedImplementation = this._isFlexBoxDeprecatedImplementation();
    // append all rendered descendants to main root element
    descendants.forEach(function (descendant)
    {
      var descendantElement = _renderChild(descendant, amxNode, deprecatedImplementation, false);
      // add descendant as a root elements child
      rootElement.appendChild(descendantElement);
    });

    return rootElement;
  };

  flexLayout.prototype.init = function (rootElement, amxNode)
  {
    // apply each processor to the root element
    this._processors.forEach(function (processor)
    {
      // this should be set by default so we don't need to set it here
      // on refresh we must since it is not handled by the amx itself
      var attributeName = processor.getAttributeName();
      if (attributeName === "inlineStyle" || attributeName === "styleClass")
      {
        return;
      }
      processor.process(amxNode, rootElement, null, null);
    });
  };

  /**
   * Function always return refresh since this component has no complex structure and attributes
   * that needs to be completely replaced.
   */
  flexLayout.prototype.updateChildren = function (amxNode, attributeChanges)
  {
    // always return refresh since only styling attributes are present
    return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];
  };

  /**
   * All descendent changes should be handled by the refresh method on this handler.
   */
  flexLayout.prototype.getDescendentChangeAction = function (amxNode, changes)
  {
    return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];
  }

  /**
   * Handles state when any children of the flexLayout changes its rendered attribute. It seemlesly removes or add
   * new component to layout. This can be extended about the animation in future.
   *
   * @param amxNode {Object} flexLayout's amxNode
   * @param rootElement {HTMLDomElement} root dom element of the flexLayout
   * @param descendentChanges {Object} changes on the children - we are handling only changes in rendered attribute
   */
  flexLayout.prototype._processDescendantChanges = function(amxNode, rootElement, descendentChanges)
  {
    var deprecatedImplementation = this._isFlexBoxDeprecatedImplementation();
    var children = amxNode.getChildren();
    // get map of the existing dom elements for children
    var nodeMap = children.map(function (child){ return document.getElementById(child.getId()); });
    // process affected nodes for the rendered attributes changes
    descendentChanges.getAffectedNodes().forEach(function (affectedNode)
    {
      var changes = descendentChanges.getChanges(affectedNode);
      if (changes.hasChanged("rendered"))
      {
        var rendered = affectedNode.getAttribute("rendered");
        // child is newly rendered so add new dom element and start animation
        if (!adf.mf.api.amx.isValueFalse(rendered))
        {
          // rendered has changed and is not false -> render new div for the amxNode and insert
          // it into the right place in hierarchy
          var newElement = _renderChild(affectedNode, amxNode, deprecatedImplementation, true);
          newElement.classList.add("new");
          // get start index of the child element
          var index = children.indexOf(affectedNode);
          // find nearest next visible node and use it to insert this new element before
          while (index < nodeMap.length && !nodeMap[index])
          {
            index++;
          }
          // if the next sibling node is present thne insert new one before
          if (nodeMap[index])
          {
            var node = nodeMap[index];
            // get item container or flex container
            if (node.parentNode !== rootElement)
            {
              node = node.parentNode
            }
            // we have to keep original order to prevent unexpected behavior
            rootElement.insertBefore(newElement, node);
          }
          // this is last node visible so only append it as a child of the root element
          else
          {
            rootElement.appendChild(newElement);
          }
        }
        // in case that the rendered is false remove dom element from layout
        else
        {
          var childElement = document.getElementById(affectedNode.getId());
          if (childElement)
          {
            // in case of childWrapper we have to go one level deeper to remove
            // wrapper and not only the child element
            if (childElement.parentNode !== rootElement)
            {
              childElement = childElement.parentNode;
            }

            adf.mf.api.amx.removeDomNode(childElement);
          }
          // avoid keeping the reference to the dom element
          childElement = null;
        }
      }
    });

    nodeMap = null;
  }

  /**
   * Refreshes styleclasses of the main element and creates new
   */
  flexLayout.prototype.refresh = function (amxNode, attributeChanges, descendentChanges)
  {
    // process all the supported attributes and set their value
    var rootElement = document.getElementById(amxNode.getId());
    var args = new adf.mf.api.amx.AmxNodeUpdateArguments();

    if (descendentChanges)
    {
      //find changes in rendered state and create or remove dom nodes for children
      this._processDescendantChanges(amxNode, rootElement, descendentChanges);
      // not processed children mark for refresh
      amxNode.getChildren().forEach(function (existingChild, i)
      {
        if (descendentChanges.getAffectedNodes().indexOf(existingChild) === -1)
        {
          // refresh others nodes inlineStyle since the layout might have been changed
          if (document.getElementById(existingChild.getId()) !== null )
          {
            args.setAffectedAttribute(existingChild, "inlineStyle");
          }
        }
      });
    }
    // possible change of the dimensions so mark all the children for update
    else if (attributeChanges.hasChanged("inlineStyle") || attributeChanges.hasChanged("styleClass"))
    {
      var children = amxNode.getChildren();
      // get map of the existing dom elements for children
      var nodeMap = children.map(function (child) { return document.getElementById(child.getId()); });
      // each children with associated dom should be called
      children.forEach(function (existingChild, i)
      {
        if (nodeMap[i])
        {
          args.setAffectedAttribute(existingChild, "inlineStyle");
        }
      });

      nodeMap = null;
    }

    this._processors.forEach(function (processor)
    {
      processor.process(amxNode, rootElement, attributeChanges, descendentChanges);
    });

    adf.mf.api.amx.markNodeForUpdate(args);
  };

  /**
   * In older android versions than 4.4 the -webkit-box implementation is only implementation of the FlexBox
   * this implementation needs a few hacks to get it work correctly and also it is critical to behave a little
   * differently to this implementation. The most up to date implementation uses flex or -webkit-flex anotation.
   */
  flexLayout.prototype._isFlexBoxDeprecatedImplementation = function ()
  {
    if (this._deprecated == null)
    {
      // try to use CSS object to identify supported features
      if (typeof CSS !== "undefined" && CSS.supports("(display: flex) or (display: -webkit-flex) or (display: -ms-flex)"))
      {
        // if CSS object is supported and we know that it supports flex than we can return false
        this._deprecated = false;
      }
      else
      {
        // there is no CSS object defined so test it hard way
        var testDiv = document.createElement("div");
        // try to set flex
        testDiv.style.display = "-ms-flex";
        testDiv.style.display = "-webkit-flex";
        testDiv.style.display = "flex";
        // append it to the document
        document.body.appendChild(testDiv);
        // in case that both of the values above are not supported than the value in the property
        // should be empty. Simply anyhting but one of the property above.
        this._deprecated = testDiv.style.display !== "-ms-flex" && testDiv.style.display !== "-webkit-flex" && testDiv.style.display !== "flex";
        // remove from the body
        document.body.removeChild(testDiv);
        // clean context a little
        testDiv = null;
      }
    }
    return this._deprecated;
  };
  // --- Helper attribute processors to simplify the implementation --- //

  /**
   * Abstract implementation of the AmxNode attribute processor that provides basic functionality
   * as a attribute name and change decision handling.
   *
   * @param attribute {string} name of the AmxNode attribute
   * @abstract
   */
  var Processor = function (attribute)
  {
    this.Init(attribute);
  };

  adf.mf.api.AdfObject.createSubclass(Processor, adf.mf.api.AdfObject, "adf.mf.internal.amx.Processor");

  Processor.prototype.Init = function (attribute)
  {
    this._attribute = attribute;
  };

  Processor.prototype.getAttributeName = function ()
  {
    return this._attribute;
  };

  Processor.prototype.isChanged = function (attributeChanges)
  {
    return (attributeChanges) ? attributeChanges.hasChanged(this._attribute) : true;
  };

  /**
   * Helper Object that translates value of the attribute into the style class of the root DOM node.
   *
   * @param attribute {string} name of the AmxNode attribute
   * @param defaultValue {string} default value used when attribute is not set or is null
   * @param customTranslator {function} function that translates the value of the attribute into the valid classname.
   *                                    e.g. return function (value)
   *                                         {
   *                                           return "adfmf-flexLayout-" + attr + "_" + value;
   *                                         };
   */
  var CSSAttributeProcessor = function (attribute, defaultValue, customTranslator)
  {
    this.Init(attribute, defaultValue, customTranslator);
  };

  adf.mf.api.AdfObject.createSubclass(CSSAttributeProcessor, Processor, "adf.mf.internal.amx.CSSAttributeProcessor");

  CSSAttributeProcessor.prototype.Init = function (attribute, defaultValue, customTranslator)
  {
    CSSAttributeProcessor.superclass.Init.call(this, attribute);
    var createDefaultTranslator = function (attr)
    {
      return function (value)
      {
        return "adfmf-flexLayout-" + attr + "_" + value;
      };
    };
    this._translator = customTranslator || createDefaultTranslator(attribute);
    this._defaultValue = defaultValue;
  };

  CSSAttributeProcessor.prototype.process = function (amxNode, element, attributeChanges, descendentChanges)
  {
    if (this.isChanged(attributeChanges))
    {
      var translator = this._translator;
      var attribute = this.getAttributeName();
      var names;
      if (attributeChanges)
      {
        names = translator(attributeChanges.getOldValue(attribute) || this._defaultValue).split(" ");
        element.classList.remove.apply(element.classList, names);
      }
      names = translator(amxNode.getAttribute(attribute) || this._defaultValue).split(" ");
      element.classList.add.apply(element.classList, names);
    }
  };

  /**
   * Helper Object that translates value of the attribute into the style class of the root node's children DOM nodes.
   *
   * @param attribute {string} name of the AmxNode attribute
   * @param defaultValue {string} default value used when attribute is not set or is null
   * @param customTranslator {function} function that translates the value of the attribute into the valid classname.
   *                                    e.g. return function (value)
   *                                         {
   *                                           return "adfmf-flexLayout-" + attr + "_" + value;
   *                                         };
   */
  var CSSChildAttributeProcessor = function (attribute, defaultValue, customTranslator)
  {
    this.Init(attribute, defaultValue, customTranslator);
  };

  adf.mf.api.AdfObject.createSubclass(CSSChildAttributeProcessor, CSSAttributeProcessor, "adf.mf.internal.amx.CSSChildAttributeProcessor");

  CSSChildAttributeProcessor.prototype._mapToChildren = function(children, attrValue, translator, callback)
  {
    attrValue = attrValue.split(",");
    attrValue = attrValue.map(function(value) { return translator(value.trim()); });

    for (var i = 0, size = children.length; i < size; i++)
    {
      if (!children[i])
      {
        continue;
      }
      callback.call(this, children[i], attrValue[i % attrValue.length]);
    }
  };

  /**
   * @param amxNode {Object} flexLayout amxNode
   * @param ids {Array} list of the node ids present as a children of current flexLayout
   * @return {Array} nodes currently in the dom and left null in case that this node might be rendered by el expression
   * in the rendered attribute
   */
  var findAllNodes = function(element, amxNode, ids)
  {
    var result = [];
    // get all possible children
    var children = amxNode.getChildren();

    result.length = children.length;

    for (var i = 0, size = children.length; i < size; i++)
    {
      var child = children[i];
      // by default null is stored in the item
      result[i] = null;
      var id = child.getId();
      if (ids && ids.indexOf(id) === -1)
      {
        continue;
      }
      // try to obtain real child from the document by the index
      var node = document.getElementById(id);
      if (node && child.getTag().getName() !== amxNode.getTag().getName())
      {
        // the container (parent) node is required here since the sizing class should
        // be set on the wrapper and not child itself
        node = node.parentNode;
      }

      result[i] = node;
    }
    return result;
  }

  CSSChildAttributeProcessor.prototype.process = function (amxNode, element, attributeChanges, descendentChanges)
  {
    if (this.isChanged(attributeChanges) || descendentChanges)
    {
      var ids = null;
      if (descendentChanges)
      {
        // prepare list of the affected ids to filter them
        ids = descendentChanges.getAffectedNodes().map(function(affectedNode)
        {
          return affectedNode.getId();
        });
      }
      // find all existing nodes and use ids as a filter
      var children = findAllNodes(element, amxNode, ids);

      var attribute = this.getAttributeName();
      if (attributeChanges)
      {
        this._mapToChildren(children, attributeChanges.getOldValue(attribute) || this._defaultValue,
          this._translator,
          function(elem, styleClass)
          {
            if (styleClass != null && styleClass != "")
            {
              elem.classList.remove.apply(elem.classList, styleClass.split(" "));
            }
          });
      }
      this._mapToChildren(children, amxNode.getAttribute(attribute) || this._defaultValue,
        this._translator,
          function(elem, styleClass)
          {
            if (styleClass != null && styleClass != "")
            {
              elem.classList.add.apply(elem.classList, styleClass.split(" "));
            }
          });
    }
  };

  /**
   * Represents processor that maps value of the AmxNode attribute to the dom node attribute.
   *
   * @param attribute {string} name of the AmxNode attribute
   * @param domAttribute {string} name of the attribute that is located on the DOM node
   * @param customCondition {function} function that handles if the value is valid and
   *                                   should be set into the dom attribute.
   *                                   e.g. function (value)
   *                                        {
   *                                          return value ? true : false;
   *                                        };
   */
  var DOMAttributeProcessor = function (attribute, domAttribute, customCondition)
  {
    this.Init(attribute, domAttribute, customCondition);
  };

  adf.mf.api.AdfObject.createSubclass(DOMAttributeProcessor, Processor, "adf.mf.internal.amx.DOMAttributeProcessor");

  DOMAttributeProcessor.prototype.Init = function (attribute, domAttribute, customCondition)
  {
    DOMAttributeProcessor.superclass.Init.call(this, attribute);
    this._condition = customCondition || function (value)
    {
      return value ? true : false;
    };
    this._domAttribute = domAttribute;
  };

  DOMAttributeProcessor.prototype.process = function (amxNode, element, attributeChanges, descendentChanges)
  {
    if (this.isChanged(attributeChanges))
    {
      var value = amxNode.getAttribute(this.getAttributeName());
      if (this._condition(value))
      {
        element.setAttribute(this._domAttribute, value);
      }
      else
      {
        element.removeAttribute(this._domAttribute);
      }
    }
  };
})();
