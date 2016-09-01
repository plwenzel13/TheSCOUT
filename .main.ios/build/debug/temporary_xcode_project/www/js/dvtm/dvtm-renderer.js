/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    DvtmObject.js
 */
// register DvtObj because of some issues with toolkit renderers
DvtObj = function () {};
DvtObj["owner"] = window;

(function()
{ 
  // Base object which provides basic function for object creation
  var DvtmObject = function() {};
  
  adf.mf.api.AdfObject.createSubclass(DvtmObject, adf.mf.api.AdfObject, 'adf.mf.internal.dvt.DvtmObject');
  
  /**
   * function create hierarchy of packages by given typeName and places the clazz object
   * into the leaf object of this hierarchy
   * @param typeName qualified name of the class/type (e.g. package.subpackage.ClassName)
   * @param clazz class or object itself
   * @param overwrite if true then it rewrites leaf object if this object exists
   * @param root base package from whitch this hierarchy is constructed (default is window)
   *
   */
  var _createPackageAndClass = function (typeName, clazz, overwrite, root)
  {
    if(root === undefined)
    {
      root = window;
    }
    while (typeName.indexOf('.') > -1)
    {
      var subPackage = typeName.substring(0, typeName.indexOf('.'));
      if (root[subPackage] === undefined)
      {
        root[subPackage] = {};
      }
      root = root[subPackage];
      typeName = typeName.substring(typeName.indexOf('.') + 1, typeName.length);
    }
    if(root[typeName] === undefined || overwrite === true)
    {
      root[typeName] = clazz;
    } 
  }
  
  // register new DvtmObject
  _createPackageAndClass('adf.mf.internal.dvt.DvtmObject', DvtmObject, false, window); 
   
  DvtmObject.SCOPE = 
  {
    // generaly available class (default)
    'PUBLIC' : 0,
    // public object wrapped into the simple object where only getInstance function is visible
    'SINGLETON' : 1
  }
   
  /**
   * @export
   *  Provides inheritance by subclassing a class from a given base class.
   *  @param  {class} extendingClass  The class to be extended from the base class.
   *  @param  {class} baseClass  The base class
   *  @param  {string} typeName The type of the extending class
   *  @param  {string} scope of the extending class (PUBLIC (default), PRIVATE, SINGLETON, ABSTRACT)
   */
  DvtmObject.createSubclass = function (extendingClass, baseClass, typeName, scope) 
  {
    if(baseClass && typeof baseClass === 'string')
    {
      baseClass = _getClass(baseClass);
    }
    
    adf.mf.api.AdfObject.createSubclass(extendingClass, baseClass, typeName);
  
    if (extendingClass !== baseClass) 
    {
      _createScope(extendingClass, typeName, scope);
    }
  }
  
  /**
   * Creates package given by packageName parameter 
   * @param packageName qualified name of the package (e.g. package.subpackage)
   * @param rootPackage base package from whitch this hierarchy is constructed (default is window)
   */
  DvtmObject.createPackage = function (packageName, rootPackage)
  {
    _createPackageAndClass(packageName, {}, false, rootPackage);
  } 
  
  /**
   * @param className qualified name of the class to be resolved
   * @return object on path described by the className 
   */
  var _getClass = function (className)
  {
    var root = window;
    while (className.indexOf('.') > -1)
    {
      var subPackage = className.substring(0, className.indexOf('.'));
      if (root[subPackage] === undefined)
      {
        return undefined;
      }
      root = root[subPackage];
      className = className.substring(className.indexOf('.') + 1, className.length);
    }
    return root[className];
  }
  
  /**
   * creates scope for the object
   * @param extendingClass top level class object
   * @param typeName fully qualified name of the class
   * @scope DvtmObject.SCOPE
   */
  var _createScope = function (extendingClass, typeName, scope) 
  {
    if(scope !== undefined && typeof scope === 'string')
    {
      scope =  DvtmObject.SCOPE[scope.toUpperCase()];
    }
    if(scope === DvtmObject.SCOPE['SINGLETON'])
    {
      var clazz = {
          'getInstance' : function()
            {
              if(extendingClass['_instance'] === undefined)
              {
                extendingClass['_instance'] = new extendingClass();
              }
              
              return extendingClass['_instance'];
            }
        }
      _createPackageAndClass(typeName, clazz, true);
    }
    else
    {
      _createPackageAndClass(typeName, extendingClass, true);
    }
  }
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    util/JSONPath.js
 */
(function()
{
  /**
   * @param object root from which this path should be resolved
   * @param path string path of the object
   * @param delimiter optional char which delimits packages (default is '/')
   */
  var JSONPath = function (object, path, delimiter)
  {
    this._path = path;
    this._root = object;
    if(delimiter === undefined)
    {
      this._delimiter = '/';
    }
    else
    {
      this._delimiter = delimiter; 
    }
  }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(JSONPath, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.util.JSONPath');
   
   /**
   * function resolves parameter of the leaf object and the leaf object itself
   */
  JSONPath.prototype._resolveLeafObjectAndProperty = function(root, path, delimiter, createIfMissing)
  {
    var result = {};
    for (var index = path.indexOf(delimiter); root && index > -1; path = path.substring(index + 1, path.length), index = path.indexOf(delimiter))
    {
      var subProperty = path.substring(0, index);     
      if(createIfMissing && root[subProperty] === undefined)
      {
        root[subProperty] = {};
      }
      root = root[subProperty];
    }
    
    if (root)
    {
      result['object'] = root;
      result['parameter'] = path;
    }
    
    return result;
  }
  
  /**
   * resolve path to the leaf object and parameter of this object
   * 
   * @param createIfMissing creates the hierarchy of the namespaces when his doesn't exist
   */
  JSONPath.prototype._resolvePath = function (createIfMissing)
  {
    if(this._leaf === undefined)
    {
      var result = this._resolveLeafObjectAndProperty(this._root, this._path, this._delimiter, createIfMissing);
        
      this._leaf = result['object'];
      this._param = result['parameter']; 
    }
  }
  
   /**
   * Returns value of the leaf element of the path.
   * 
   * @return value of the leaf element or undefined if path structure is not yet created
   */
  JSONPath.prototype.getValue = function ()
  {
    this._resolvePath(false);
    return this._leaf === undefined ? undefined : this._leaf[this._param];
  }

  /**
   * Sets value of the leaf element of the path.
   * 
   * @param value
   * @return true when value of the leaf element of the path has been changed
   */
  JSONPath.prototype.setValue = function (value)
  {
    this._resolvePath(true);
    
    if (this._leaf[this._param] !== value)
    {
      this._leaf[this._param] = value;
      return true;
    }
    return false;
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    util/DOMUtils.js
 */
(function()
{
  
  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.util');
  
  var DOMUtils = {}
  adf.mf.internal.dvt.DOMUtils = DOMUtils;
  
  DOMUtils.createDIV = function ()
  {
    return document.createElement("div");
  }
  
  /**
   * @param node {DOMElement}
   * @return {int} pixel width of the element's content without margin, border and padding
   */
  DOMUtils.getWidth = function (node)
  {
    var baseWidth = node.offsetWidth;
    var compStyle = window.getComputedStyle(node);
    if (compStyle)
    {
      baseWidth -= (compStyle.borderLeftWidth ? parseInt(compStyle.borderLeftWidth) : 0);
      baseWidth -= (compStyle.borderRightWidth ? parseInt(compStyle.borderRightWidth) : 0);
      baseWidth -= (compStyle.paddingLeft ? parseInt(compStyle.paddingLeft) : 0);
      baseWidth -= (compStyle.paddingRight ? parseInt(compStyle.paddingRight) : 0);
    }
    return baseWidth;
  }
  
  /**
   * @param node {DOMElement}
   * @param width {string} string representation of the width value (e.g, 10px, 10%, etc.).
   */
  DOMUtils.setWidth = function (node, width)
  {
    node.style.width = width;
  }
  
  /**
   * @param node {DOMElement}
   * @return {int} pixel height of the element's content without margin, border and padding
   */
  DOMUtils.getHeight = function (node)
  {
    var baseHeight = node.offsetHeight;
    var compStyle = window.getComputedStyle(node);
    if (compStyle)
    {
      baseHeight -= (compStyle.borderTopWidth ? parseInt(compStyle.borderTopWidth) : 0);
      baseHeight -= (compStyle.borderBottomWidth ? parseInt(compStyle.borderBottomWidth) : 0);
      baseHeight -= (compStyle.paddingTop ? parseInt(compStyle.paddingTop) : 0);
      baseHeight -= (compStyle.paddingBottom ? parseInt(compStyle.paddingBottom) : 0);
    }
    return baseHeight;
  }
  
  /**
   * @param node {DOMElement}
   * @param height {string} string representation of the height value (e.g, 10px, 10%, etc.).
   */
  DOMUtils.setHeight = function (node, height)
  {
    node.style.height = height;
  }
  
  /**
   * @param node {DOMElement}
   * @return {int} pixel height of the element's content that includes margin, border and padding
   */
  DOMUtils.getOuterHeight = function (node)
  {
    var baseHeight = node.offsetHeight;
    var compStyle = window.getComputedStyle(node);
    if (compStyle)
    {
      baseHeight += (compStyle.marginTop ? parseInt(compStyle.marginTop) : 0);
      baseHeight += (compStyle.marginBottom ? parseInt(compStyle.marginBottom) : 0);
    }
    return baseHeight;
  }
  
  /**
   * @param node {DOMElement}
   * @return {int} pixel width of the element's content  that includes  margin, border and padding
   */
  DOMUtils.getOuterWidth = function (node)
  {
    var baseWidth = node.offsetWidth;
    var compStyle = window.getComputedStyle(node);
    if (compStyle)
    {
      baseWidth += (compStyle.marginLeft ? parseInt(compStyle.marginLeft) : 0);
      baseWidth += (compStyle.marginRight ? parseInt(compStyle.marginRight) : 0);
    }
    return baseWidth;
  }
  
   /**
   * @return value of the width or height attribute
   */
  DOMUtils.parseStyleSize = function (strSize, percent)
  {
    if(strSize)
    {
      var index = strSize.indexOf(percent ? '%' : 'px');
      if(index > -1)
      {
        strSize = strSize.substring(0, index);
        var value = parseInt(strSize);
        if(value > 0)
        {
          return value;
        }
      }
    }
    return percent ? 100 : 0;
  }
  
  /**
   * writes ID attribute to the DOM element
   * 
   * @param element DOM Element
   * @param id 
   * @private
   */
  DOMUtils.writeIDAttribute = function (node, id)
  {
    node.setAttribute('id', id);
  }

  /**
   * writes style attribute to the DOM element
   * 
   * @param element DOM Element
   * @param style 
   * @private
   */
  DOMUtils.writeStyleAttribute = function (node, style)
  {
    node.setAttribute('style', style);
  }
  
  /**
   * writes class attribute to the DOM element
   * 
   * @param element DOM Element
   * @param styleClass 
   * @private
   */
  DOMUtils.writeClassAttribute = function (node, styleClass)
  {
    node.setAttribute('class', styleClass);
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/Attributes.js
 */
(function(){
  
  /**
   *  Class representing a set of attributes.        
   */ 
  var Attributes = function(attributes)
  {
    this['attributes'] = attributes;
    this['_size'] = Object.keys(attributes).length;
  };
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(Attributes, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.common.attributeGroup.Attributes');
  
  /**
   *  Processes attributes set on given amx node.
   *  @param amxNode amx node     
   */  
  Attributes.processAttributes = function(amxNode, types) {
    var attrMap = {};
    // process private _tagInstances objects
    var tagInstances = amxNode["_tagInstances"];
    var tagInstance;
    
    var keys = Object.keys(tagInstances);
    for (var ii = 0, length = keys.length; ii < length; ii++)
    {
      var k = keys[ii];
      if(tagInstances.hasOwnProperty(k)) {
        for(var i=0; i < types.length; i++) {
          tagInstance = tagInstances[k];
          if(tagInstance.getTag().getName() == 'attribute') {
            var attrName = tagInstance.getTag().getAttribute("name");
            var attrValue;
            if(attrName) {
              var match = new RegExp('^'+types[i]+'\\d*$').exec(attrName);
              if(match && match.length == 1) {
                attrValue = tagInstance.getTag().getAttribute("value"); 
                if(attrValue.indexOf("#{") == -1) {
                  // static value
                  attrMap[attrName] = attrValue;
                  break; 
                } else {
                  // resolved el
                  attrValue = tagInstance["_attrs"]["value"];
                  if(attrValue) {
                    attrMap[attrName] = attrValue;
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return new Attributes(attrMap);
  };
  
  /**
   *  Returns iterator that can be used to iterate over given attribute set
   *  Each attribute has following structure:
   *  {
   *    'name': 'Attribute name',
   *    'value': 'Attribute value'      
   *  }
   *  @return iterator that can be used to iterate over given attribute set     
   */  
  Attributes.prototype.iterator = function () {
    var map = this['attributes'];
    var attributes = Object.keys(map).map(function (name) 
      {
        return {'name' : name, 'value' : map[name]};
      });
    
    return adf.mf.api.amx.createIterator(attributes);
  };
  
  /**
   *  Applies all attributes in this set of attributes on given item.
   *  @param item item     
   */  
  Attributes.prototype.applyAttributes = function (item) {
    var map = this['attributes'];
    var keys = Object.keys(map);
    for (var i = 0, length = keys.length; i < length; i++)
    {
      var name = keys[i];
      item[name] = map[name];
    }
  };
  
  /**
   *  Returns value of attribute which name equals given type or null if no such attribute exists.
   *  @param type type to be resolved (e.g. color, pattern)
   *  return value of attribute which name equals given type or null if no such attribute exists   
   */ 
  Attributes.prototype.resolveValue = function(type) {
    return this['attributes'][type];
  };
  
  /**
   *  Returns size of this attribute set.
   *  @return size of this attribute set     
   */  
  Attributes.prototype.size = function () {
    return this['_size'];
  };
  
  /**
   *  Merges attrs attribute set into this attribute set
   *  @param attrs Attributes class instance
   */
  Attributes.prototype.merge = function (attrs)
  {
    if(!attrs || !attrs['attributes']) return;
    
    var keys = Object.keys(attrs['attributes']);
    for (var i = 0, length = keys.length; i < length; i++)
    {
      var name = keys[i];
      this['attributes'][name] = attrs['attributes'][name];
    }
  };
  
  /**
   *  Returns true if attributes1 equals attributes2, otherwise returns false.
   *  @param attributes1 Attributes class instance
   *  @param attributes2 Attributes class instance      
   *  @return true if attributes1 equals attributes2, otherwise returns false    
   */ 
  Attributes.equals = function (attrs1, attrs2)
  {
    if(attrs1 === attrs2) return true;
    if(!attrs1 || !attrs2 || !attrs1['attributes'] || !attrs2['attributes']) return false;
    
    var attrkeys = Object.keys(attrs1['attributes']);
    var name, i, length;
    
    for (i = 0, length = attrkeys.length; i < length; i++)
    {
      name = attrkeys[i];
      if(attrs1['attributes'][name] != attrs2['attributes'][name]) return false;
    }
    
    attrkeys = Object.keys(attrs2['attributes']);
    for (i = 0, length = attrkeys.length; i < length; i++)
    {
      name = attrkeys[i];
      if(attrs2['attributes'][name] != attrs1['attributes'][name]) return false;
    }
    
    return true;
  };
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/AttributeGroup.js
 */
(function(){
  
  /**
   *  Class representing attribute group.  
   */  
  var AttributeGroup = function()
  {
    this['params'] = {};
  };
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(AttributeGroup, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.common.attributeGroup.AttributeGroup');
  
  /**
   *  Initializes given attribute group based on given attribute groups node.  
   */  
  AttributeGroup.prototype.Init = function (amxNode, attrGroupsNode)
  {
    var Rules = adf.mf.internal.dvt.common.attributeGroup.Rules;
    var Attributes = adf.mf.internal.dvt.common.attributeGroup.Attributes;
    var Categories = adf.mf.internal.dvt.common.attributeGroup.Categories;
    
    this['id'] = attrGroupsNode.getAttribute('id');
    this['discriminant'] = attrGroupsNode.getAttribute('discriminant');
    this['categories'] = new Categories(this['discriminant']);
    this.SetType(attrGroupsNode);
    this['rules'] = new Rules();
    
    this['attributes'] = Attributes.processAttributes(attrGroupsNode, this['types']);
    
    this['legendItems'] = null;
    this['attributeValuesResolver'] = null;
    this['sharedAttributesUpdateAllowed'] = false;
  };
  
  /**
   *  Sets types this attribute group supports.
   *  @param attrGroupsNode attribute groups node     
   */  
  AttributeGroup.prototype.SetType = function (attrGroupsNode) {
    this['type'] = attrGroupsNode.getAttribute('type');
    this['types'] = [];
    if (this['type'])
    {
      this['types'] = this._parseTypes(this['type']);
    }
  };
  
  /**
   *  Returns array of types processed by the attribute group.
   *  @return array of types processed by the attribute group
   */
  AttributeGroup.prototype.getTypes = function () {
    return this['types'];
  }
  
  /**
   *  Parses type attribute and return array of particular types.
   *  @param type string containing all supported types
   *  @return array of types        
   */  
  AttributeGroup.prototype._parseTypes = function (type) {
    var types = [];
    var existingTypes = type.split(/\s+/);
    for(var i=0; i<existingTypes.length; i++) {
      if(existingTypes[i]) {
        types.push(existingTypes[i]);
      }
    }
    return types;
  };
  
  /**
   *  Returns category for given index.
   *  @param index index
   *  @return cateogory        
   */  
  AttributeGroup.prototype.getCategoryValue = function(index) {
    return this['categories'].getValueByIndex(index);
  };
  
  /**
   *  Processes item represented by given attribute groups node instance and returns processing result in the form:
   *  {
   *    'value' : processed value,
   *    'appliedExceptionRules' : array of applied exception rules indices      
   *  }
   *  @param attrGroupsNode attribute groups node
   *  @return processing information          
   */  
  AttributeGroup.prototype.processItem = function (attrGroupsNode) {
    var value = this.ProcessItemValue(attrGroupsNode);
    var exceptionRulesInfo = this.ProcessItemRules(attrGroupsNode);
    var groupLabel = attrGroupsNode.getAttribute('groupLabel');
    this['label'] = groupLabel;
    
    var info = {};
    info['value'] = value;
    info['appliedExceptionRules'] = exceptionRulesInfo;
    
    return info;
  };
  
  /**
   *  Processes given node and returns item value. Default implementation returns index of item category.
   *  @param attrGroupsNode attribute groups node
   *  @return item value          
   */  
  AttributeGroup.prototype.ProcessItemValue = function(attrGroupsNode) {
    var value = attrGroupsNode.getAttribute('value');
    var label = attrGroupsNode.getAttribute('label');
    value = this['categories'].addCategory(value, label);
    return value;
  };
  
  /**
   *  Processes given node and returns array of rules indices that are applied on given item.
   *  @param attrGroupsNode attribute groups node
   *  @return array of rules indices that are applied on given item          
   */
  AttributeGroup.prototype.ProcessItemRules = function(attrGroupsNode) {
    var rules = this['rules'];
    var appliedExceptionRuleIndices = rules.processItemRules(attrGroupsNode, this['types']);
    return appliedExceptionRuleIndices;  
  };
  
  /**
   *  Configures given attribute group so that it can be applied on data items.
   *  It is guaranteed that this method is called before data items are processed.
   *  @param amxNode amx node
   *  @param attributeGroupConfig attribute group configuration           
   */  
  AttributeGroup.prototype.configure = function (amxNode, attributeGroupConfig) {
    var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
    var AttributeValuesResolver = adf.mf.internal.dvt.common.attributeGroup.AttributeValuesResolver;
    var LegendItems = adf.mf.internal.dvt.common.attributeGroup.LegendItems;
    var Rules = adf.mf.internal.dvt.common.attributeGroup.Rules;
    
    this['config'] = attributeGroupConfig;
    this['attributeValuesResolver'] = new AttributeValuesResolver(amxNode, this);
    
    var types = this['types'];
    var categories = this['categories'];
    var exceptionRules = this['rules'];
    var resolver = this['attributeValuesResolver'];
    
    this['legendItems'] = new LegendItems(types, categories, exceptionRules, resolver);
  };
  
  /**
   *  Sets if shared attributes can be updated. 
   *  @param allowed true if update is allowed, false otherwise           
   */
  AttributeGroup.prototype.setSharedAttributesUpdateAllowed = function(allowed) {
    this['sharedAttributesUpdateAllowed'] = allowed;
  }
  
  /**
   *  Returns true if this group initializes shared properties and false otherwise.
   *  @return true if this group initializes shared properties and false otherwise            
   */
  AttributeGroup.prototype.isSharedAttributesUpdateAllowed = function() {
    return this['sharedAttributesUpdateAllowed'] === true;
  }
  
  /**
   *  Applies the group on given data item. All information needed to process the item
   *  is stored in given info parameter:
   *  {
   *    'config' : DataItemConfig class instance
   *    'nodeInfo' : info returned by processItem function      
   *  }
   *  @param amxNode amx node
   *  @param dataItem data item
   *  @param info information needed for data item processing returned by processItem function            
   *  @param attributeGroupConfig attribute groups configuration, instance of AttributeGroupConfig class
   */  
  AttributeGroup.prototype.applyGroup = function(amxNode, dataItem, info, attributeGroupConfig) {
    var Rules = adf.mf.internal.dvt.common.attributeGroup.Rules;

    var types = this['types'];
    var indices = info['nodeInfo']['appliedExceptionRules'];
    var appliedRules = this['rules'].getByIndices(indices);
    var itemValue = info['nodeInfo']['value'];

    var type = null, mappedType, value = null;
    var updateValueCallback = null;

    // for each type (e.g. pattern, color) defined by this attribute group
    for(var i=0; i < types.length; i++) {
      type = types[i];
      mappedType = type;

      // resolve mapped type -> name of data item attribute that the resolved value will be assigned to
      if(attributeGroupConfig && attributeGroupConfig.getTypeToItemAttributeMapping(type)) { 
        mappedType = attributeGroupConfig.getTypeToItemAttributeMapping(type);
      }

      // if value is set then it won't be resolved
      // this can happen only in two cases: - the value has been set by an attribute, - the value has been set by another attribute group
      value = AttributeGroup._getAttributeValue(dataItem, mappedType);
      if(!value) {
        value = this.ResolveValue(type, appliedRules, itemValue);

        // if value is resolved then set it on given data item
        if(value) {
        
          // if update value callback is defined for given type then apply it
          if(attributeGroupConfig) {
            updateValueCallback = attributeGroupConfig.getUpdateValueCallback(type);
            if(updateValueCallback) {
              value = updateValueCallback(value, dataItem);
            }
          }
          AttributeGroup._setAttributeValue(dataItem, mappedType, value);
        }
      }
    }
    
    // update categories
    this.UpdateCategories(dataItem, info);
  };
  
  /**
   *  For each type defined by this attribute group applies default values on given data item for given type. 
   *  Default value for given type is applied only in case that given data item has no value defined for given type.
   *  
   *  @param amxNode amx node
   *  @param dataItem data item
   *  @param dataItemConfig data item configuration            
   *  @param attributeGroupConfig attribute groups configuration, instance of AttributeGroupConfig class
   */  
  AttributeGroup.applyDefaultValues = function(amxNode, dataItem, dataItemConfig, attributeGroupConfig) {
    if(dataItemConfig) {
      var types = dataItemConfig.getDefaultValueTypes();
      var type = null, mappedType = null, value = null;

      // for each type (e.g. pattern, color) to that default value should be assigned
      for(var i=0; i < types.length; i++) {
        type = types[i];
        
        mappedType = type;
      
        // resolve mapped type -> name of data item attribute that the resolved value will be assigned to
        if(attributeGroupConfig && attributeGroupConfig.getTypeToItemAttributeMapping(type)) { 
          mappedType = attributeGroupConfig.getTypeToItemAttributeMapping(type);
        }
      
        value = AttributeGroup._getAttributeValue(dataItem, mappedType);
      
        // if default value callback is defined then call it
        if(!value) {
          if(dataItemConfig.getTypeDefaultValue(type)) {
            value = dataItemConfig.getTypeDefaultValue(type);
          }
        
          if(value) {
            AttributeGroup._setAttributeValue(dataItem, mappedType, value);
          }
        }
      }
    }
  };
    
  AttributeGroup._getAttributeValue = function(dataItem, mappedType) {
    var mappedTypeArray = mappedType.split ('.');
    for (var i = 0; i < mappedTypeArray.length; i++) {
      if (!dataItem) return dataItem;
      dataItem = dataItem [mappedTypeArray [i]];
    }
    return dataItem;
  };

  AttributeGroup._setAttributeValue = function(dataItem, mappedType, value) {
    var mappedTypeArray = mappedType.split ('.');
    for (var i = 0; i < mappedTypeArray.length - 1; i++) {
      var newDataItem = dataItem [mappedTypeArray [i]];
      if (!newDataItem) {
        newDataItem = {};
        dataItem [mappedTypeArray [i]] = newDataItem;
      }
      dataItem = newDataItem;
    }
    dataItem [mappedTypeArray [mappedTypeArray.length - 1]] = value;
  };  
  
  /**
   *  Resolves and returns value for given type based on given applied rules and item value.
   *  @param type type
   *  @param appliedRules applied rules
   *  @param itemValue item value
   *  @return resolved value for given type based on given applied rules and item value.                
   */  
  AttributeGroup.prototype.ResolveValue = function(type, exceptionRules, itemValue) {
    return this['attributeValuesResolver'].resolveValue(type, exceptionRules, itemValue);
  };
  
  /**
   *  Updates categories on given data item.
   *  @param dataItem data item
   *  @param info processing information           
   */  
  AttributeGroup.prototype.UpdateCategories = function(dataItem, info) {
    var attrGroupConfig = this['config'];
    var itemValue = info['nodeInfo']['value'];
    var indices = info['nodeInfo']['appliedExceptionRules'];
    var exceptionRules = this['rules'].getByIndices(indices);
    
    // if callback function is defined then call it
    var updateCategoriesCallback = attrGroupConfig ? attrGroupConfig.getUpdateCategoriesCallback() : null;
    if(updateCategoriesCallback) 
    {
      updateCategoriesCallback(this, dataItem, itemValue, exceptionRules);
    } 
    else 
    {
      // add category by its index
      if (!dataItem['categories']) dataItem['categories'] = [];
      var categories = dataItem['categories'];
      categories.push(this['categories'].getValueByIndex(itemValue));
      
      // for each exception rule add exception rule value to the categories array
      var rules = exceptionRules.getRules();
      for(var i=0; i < rules.length; i++) {
        categories.push(rules[i]['value']);
      }
    }
    
  };
  
  /**
   *  Returns array of legend items.
   *  @return array of legend items           
   */  
  AttributeGroup.prototype.getLegendItems = function() {
    return this['legendItems'].getItems();
  };
  
  /**
   *  Returns attribute group id.
   *  @return attribute group id     
   */  
  AttributeGroup.prototype.getId = function() {
    return this['id'];
  };
  
  /**
   *  Returns true if this attribute group is continuous otherwise returns false
   *  @return true if this attribute group is continuous otherwise returns false     
   */  
  AttributeGroup.prototype.isContinuous = function() {
    return false;
  };
  
  /**
   *  Returns the attribute group description in the form:
   *  {
   *    'id' : id,
   *    'type' : continuous/discrete,
   *    'groups' : array of legend items         
   *  }     
   */  
  AttributeGroup.prototype.getDescription = function() {
    var obj = {};
    obj['id'] = this['id'];
    obj['type'] = this['legendItems'].getLegendType();
    if (this['label'])
      obj['label'] = this['label'];
    obj['groups'] = this['legendItems'].getItems();
    return obj;
  };
  
  /**
   * Sets custom parameter value.
   * @param param custom parameter
   * @param value custom value
   */
  AttributeGroup.prototype.setCustomParam = function(param, value) {
    this['params'][param] = value;  
  };
  
  /**
   * Returns custom parameter value.
   * @param param custom parameter
   * @return custom parameter value
   */
  AttributeGroup.prototype.getCustomParam = function(param) {
    return this['params'][param];  
  };
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/AttributeGroupManager.js
 */
(function(){
  
  /**
   *  A facade used to work with attribute groups. The intented usage is as follows:
   *  1. AttributeGroupManager.init
   *       Called to initialize attribute group processing.
   *          
   *  Then for each data item following functions should be called (order matters):
   *  2. AttributeGroupManager.processAttributeGroup
   *       Processes attribute group node and stores processing information into context. Processing information contains rules that are applied for
   *       this instance of attribute group node, value of this attribute group node instance etc.      
   *  3. AttributeGroupManager.registerDataItem
   *       a) Takes processing information from the context (i.e. detaches context - see AttributeGroupManager.detachProcessedAttributeGroups function)
   *       b) Connects given processing information and given data item
   *       c) Registers given data item so that all attribute groups processed using AttributeGroupManager.processAttributeGroup can be applied on it
   *  
   *  After all data items are registered following function is supposed to be called to apply attribute groups on registered data items            
   *  4. AttributeGroupManager.applyAttributeGroups
   *       Apply attribute groups on registered data items.   
   *
   *  Example:
   *     
   *   Initialize:
   *      AttributeGroupManager.init(context);
   *      ...
   *
   *   Create attribute groups and data items:
   *      var marker = this._processMarker(amxNode, markerNode);
   *      if(marker != null) {      
   *         var attributeGroupsNodes = markerNode.getChildren();
   *         var iter = adf.mf.api.amx.createIterator(attributeGroupsNodes);
   *         while (iter.hasNext())
   *         {
   *           var attrGroupsNode = iter.next();
   *           ...
   *           AttributeGroupManager.processAttributeGroup(attrGroupsNode, amxNode, context);
   *         }
   *         var dataItem = this._applyMarkerToModel(amxNode, marker);
   *         // all attribute groups processed in previous step are connected to given data item and this data item is
   *         // registered so that given attribute groups can be applied on it         
   *         AttributeGroupManager.registerDataItem(context, dataItem, null);   
   *         ...
   *      }
   *      ...
   *      
   *   Apply attribute groups on data items:
   *      AttributeGroupManager.applyAttributeGroups(amxNode, null, context);                            
   */  
  var AttributeGroupManager = function()
  {};
  AttributeGroupManager["_sharedCategories"] = {};
  AttributeGroupManager["_sharedAttributes"] = {};
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(AttributeGroupManager, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager');
  
  /**
   *  Resets attribute groups saved on given amx node.
   *  @param amxNode amx node     
   */  
  AttributeGroupManager.reset = function(amxNode) {
    amxNode["_attributeGroups"] = [];
  };
  
  /**
   *  Initializes context for attribute group processing.
   *  @param context context to be initialized     
   */  
  AttributeGroupManager.init = function(context) {
    context['_attributeGroupsInfo'] = {};
    context['_attributeGroupsInfo']['dataItems'] = [];
  };
  
  /**
   *  Returns true if context is initialized, otherwise returns false.
   *  @param context context
   *  @return true if context is initialized, otherwise returns false         
   */  
  AttributeGroupManager.isContextInitialized = function(context) {
    return context['_attributeGroupsInfo'] !== undefined;
  };
  
  /**
   *  Returns true if amx node is initialized, otherwise returns false.
   *  @param node amx node
   *  @return true if amx node is initialized, otherwise returns false         
   */
  AttributeGroupManager.isAmxNodeInitialized = function(node) {
    return node['_attributeGroups'] !== undefined;
  };
  
  /**
   *  Processes given attribute groups node and saves result into the context.
   *  @param attrGroupsNode attribute groups node
   *  @param amxNode amx node
   *  @param context context            
   */  
  AttributeGroupManager.processAttributeGroup = function(attrGroupsNode, amxNode, context) {
    if(!AttributeGroupManager.isAmxNodeInitialized(amxNode)) {
      adf.mf.log.Application.logp(adf.mf.log.level.SEVERE, "AttributeGroupManager", "applyAttributeGroups", "Manager not initialized.");
      return;
    }
    
    var attrGrp = AttributeGroupManager.findGroupById(amxNode, AttributeGroupManager._getAttributeGroupId(attrGroupsNode));
    
    if(attrGrp == null) {
      attrGrp = AttributeGroupManager._createGroup(amxNode, attrGroupsNode); 
      amxNode['_attributeGroups'].push(attrGrp);
    }
    // process attribute groups node instance and return processing information (applied rules, category index used etc.)
    var nodeInfo = attrGrp.processItem(attrGroupsNode);

    if(!context['_itemAttrGroups']) context['_itemAttrGroups'] = [];

    // save attribute group together with the processing information into the context
    var markerAttrGroups = context['_itemAttrGroups'];
    markerAttrGroups.push({
      'attrGroup' : attrGrp, 'nodeInfo' : nodeInfo
    });
  };
  
  /**
   *  Registers data item for further processing. Takes result of processAttributeGroup function, attaches it to the data item and 
   *  registers given data item so that attribute groups can be applied on it.
   *  @param context context
   *  @param dataItem data item
   *  @param config data item configuration, instance of DataItemConfig class           
   */  
  AttributeGroupManager.registerDataItem = function(context, dataItem, config) {
    if(!AttributeGroupManager.isContextInitialized(context)) {
      adf.mf.log.Application.logp(adf.mf.log.level.INFO, "AttributeGroupManager", "registerDataItem", "Manager not initialized.");
      return;
    }
    
    // detach processed attribute groups
    var itemAttrGroups = AttributeGroupManager.detachProcessedAttributeGroups(context);
    // and attach them to given data item
    dataItem['__attrGroups'] = itemAttrGroups;
    // together with this data item configuration
    dataItem['__dataItemConfiguration'] = config;
    // and register given data item
    context['_attributeGroupsInfo']['dataItems'].push(dataItem);
  };
  
  /**
   *  Detaches result of AttributeGroupManager.processAttributeGroup function from the context and returns it. Once corresponding data item can be registered, the detached
   *  result must be attached using AttributeGroupManager.attachProcessedAttributeGroups function so that AttributeGroupManager.registerDataItem
   *  function can be called.
   *  @param context context
   *  @return result of AttributeGroupManager.processAttributeGroup function                 
   */  
  AttributeGroupManager.detachProcessedAttributeGroups = function(context) {
    var processedGroups = context['_itemAttrGroups'] ? context['_itemAttrGroups'].slice(0) : [];
    context['_itemAttrGroups'] = [];
    return processedGroups;
  };
  
  /**
   *  Attaches result of AttributeGroupManager.processAttributeGroup function to the context so that corresponding data item can be registered
   *  using AttributeGroupManager.registerDataItem function.
   *  @param context context
   *  @param detachedGroups detached groups                
   */
  AttributeGroupManager.attachProcessedAttributeGroups = function(context, detachedGroups) {
    context['_itemAttrGroups'] = detachedGroups;
  };
  
  /**
   *  Applies attribute groups on registered data items. 
   *  @param amxNode amx node
   *  @param attributeGroupConfig attribute groups configuration, instance of AttributeGroupConfig class
   *  @param context context           
   */  
  AttributeGroupManager.applyAttributeGroups = function(amxNode, attributeGroupConfig, context) {
    if(!AttributeGroupManager.isContextInitialized(context) || !AttributeGroupManager.isAmxNodeInitialized(amxNode)) {
      adf.mf.log.Application.logp(adf.mf.log.level.SEVERE, "AttributeGroupManager", "applyAttributeGroups", "Manager not initialized.");
      return;
    }
    
    var AttributeGroup = adf.mf.internal.dvt.common.attributeGroup.AttributeGroup;
    
    // retrieve data items to be processed
    var dataItems = context['_attributeGroupsInfo']['dataItems'];
    var infos, dataItemConfig, attrGroup, dataItem;
    
    // configure attribute groups so that they can be applied on data items
    AttributeGroupManager._configureAttributeGroups(amxNode, attributeGroupConfig);
    
    // process registered data items
    if(dataItems.length > 0) {
      for(var i=0; i < dataItems.length; i++) {
        // get item
        dataItem = dataItems[i];
        // get all attribute groups that should be applied on the item together with information used to do the processing (applied rules, category index used etc.) 
        infos = dataItem['__attrGroups'];
        // get data item configuration
        dataItemConfig = dataItem['__dataItemConfiguration'];
        if (infos && infos.length > 0) 
        {
          // last attribute group wins -> reverse processing of the array
          // when particular attribute group sets a value for given type other attribute groups are not applied for given type 
          for (var j = infos.length - 1; j >= 0; j--) 
          {
            // get attribute group
            attrGroup = infos[j]['attrGroup'];
            // get information used to do the processing (applied rules, category index used etc.)
            nodeInfo = infos[j]['nodeInfo'];
            
            // apply attribute group on given data item
            var processingInfo = {
              'nodeInfo' : nodeInfo,
              'config' : dataItemConfig
            } 
            attrGroup.applyGroup(amxNode, dataItem, processingInfo, attributeGroupConfig); 
          }
        }
        // apply default values
        AttributeGroup.applyDefaultValues(amxNode, dataItem, dataItemConfig, attributeGroupConfig); 
        
        delete dataItem['__attrGroups'];
        delete dataItem['__dataItemConfiguration'];
      }
    }
    
    delete context['_attributeGroupsInfo']['dataItems'];
    delete context['_attributeGroupsInfo'];
  };
  
  /**
   *  Find attribute group by id.
   *  @param amxNode amx node
   *  @param id attribute group id
   *  @return attribute group with given id or null if no such group exists           
   */  
  AttributeGroupManager.findGroupById = function(amxNode, id) {
    if(!AttributeGroupManager.isAmxNodeInitialized(amxNode)) {
      adf.mf.log.Application.logp(adf.mf.log.level.SEVERE, "AttributeGroupManager", "applyAttributeGroups", "Manager not initialized.");
      return null;
    }
    
    var attrGroups = amxNode['_attributeGroups'];
    var attrGroup = null;
    if(id) {
      for (var g = 0;g < attrGroups.length;g++)
      {
        if (attrGroups[g]['id'] === id) {
          attrGroup = attrGroups[g];
          break;
        }
      }
    }
    return attrGroup;
  };
  
  /**
   *  Returns shared categories by discriminant.
   *  @param discriminant attribute group discriminant
   *  @return shared categories by given discriminant or null if no such shared categories exists           
   */  
  AttributeGroupManager.getSharedCategories = function(discriminant) {
    var sharedCategories = AttributeGroupManager["_sharedCategories"];
    return sharedCategories[discriminant];
  };
  
  AttributeGroupManager.observeSharedCategories = function(discriminant, callback) {
    var sharedCategories = AttributeGroupManager["_sharedCategories"];
    var instance = sharedCategories[discriminant];
    if(!instance) {
      instance = new adf.mf.internal.dvt.common.attributeGroup.Categories();
      AttributeGroupManager["_sharedCategories"][discriminant] = instance;
    }

    instance.observe(callback);
  };
  
  /**
   *  Adds shared category by discriminant.
   *  @param discriminant shared attribute group discriminant
   *  @param category category value to be added
   *  @param label category label to be added
   *  @return index of given category in the shared categories array       
   */  
  AttributeGroupManager.addSharedCategory = function(discriminant, category, label) {
    var sharedCategories = AttributeGroupManager["_sharedCategories"];
    var instance = sharedCategories[discriminant];
    if(!instance) {
      instance = new adf.mf.internal.dvt.common.attributeGroup.Categories();
      AttributeGroupManager["_sharedCategories"][discriminant] = instance;
    }
    return instance.addCategory(category, label);
  };
  
  /**
   *  Returns shared attribute by discriminant.
   *  @param discriminant shared attribute group discriminant
   *  @param attributeName shared attribute name (e.g. minValue)
   *  @return shared attribute or null if no attribute exists for given name
   */
  AttributeGroupManager.getSharedAttribute = function(discriminant, attributeName) {
    if (AttributeGroupManager['_sharedAttributes'][discriminant])
    {
      return AttributeGroupManager['_sharedAttributes'][discriminant][attributeName];
    };
    return null;
  };
  
  /**
   *  For given discriminant and attribute name adds given attribute to shared attributes.
   *  @param discriminant shared attribute group discriminant
   *  @param attributeName shared attribute name (e.g. minValue)
   *  @param value value
   */
  AttributeGroupManager.addSharedAttribute = function(discriminant, attributeName, value) {
    var sharedAttributes = AttributeGroupManager['_sharedAttributes'][discriminant];  
    if (!sharedAttributes)
    {
      sharedAttributes = {};
    }
    sharedAttributes[attributeName] = value;

    AttributeGroupManager['_sharedAttributes'][discriminant] = sharedAttributes;
  };
  
  /**
   *  For given discriminant returns true if it has been already initialized or false otherwise.
   *  @param discriminant shared attribute group discriminants
   *  @return true if it has been already initialized or false otherwise.
   */
  AttributeGroupManager.isSharedGroupInitialized = function(discriminant) {
    return (AttributeGroupManager['_sharedAttributes'][discriminant] != undefined && AttributeGroupManager['_sharedAttributes'][discriminant]['initialized'] == true);
  }
  
  /**
   *  For given discriminant sets that its configuration is done.
   *  @param discriminant shared attribute group discriminants
   */
  AttributeGroupManager.setSharedGroupInitialized = function(discriminant) {
    if (!AttributeGroupManager['_sharedAttributes'][discriminant])
    {
      AttributeGroupManager['_sharedAttributes'][discriminant] = {};
    }
    AttributeGroupManager['_sharedAttributes'][discriminant]['initialized'] = true;
  }
  
  /**
   *  Creates attribute group, initializes it and returns it.
   *  @param amxNode amx node
   *  @param attrGroupsNode attribute groups node
   *  @return created attribute group           
   */  
  AttributeGroupManager._createGroup = function(amxNode, attrGroupsNode) {
    var ContinuousAttributeGroup = adf.mf.internal.dvt.common.attributeGroup.ContinuousAttributeGroup;
    var DiscreteAttributeGroup = adf.mf.internal.dvt.common.attributeGroup.DiscreteAttributeGroup;
  
    var attrGrp;
    if(attrGroupsNode.getAttribute("attributeType") === "continuous") {
      attrGrp = new ContinuousAttributeGroup();
    } else {
      attrGrp = new DiscreteAttributeGroup();
    }
    attrGrp.Init(amxNode, attrGroupsNode);
    return attrGrp;
  };
  
  /**
   *  Returns id of given attribute groups node.
   *  @param attrGroupsNode attribute groups node
   *  @return id of given attribute groups node or null if no id is defined for this node       
   */  
  AttributeGroupManager._getAttributeGroupId = function(attrGroupsNode) {
    var id = null;
    if (attrGroupsNode.isAttributeDefined('id'))
    {
      id = attrGroupsNode.getAttribute('id');
    }
    return id;
  };
  
  /**
   *  Configures all attribute groups saved on given amxNode and passes given attribute group configuration to each of them.
   *  @param amxNode amx node
   *  @param attributeGroupConfig attribute group configuration        
   */  
  AttributeGroupManager._configureAttributeGroups = function(amxNode, attributeGroupConfig) {
    var attrGroups = amxNode['_attributeGroups'];
    var discriminant; 
    for (var i = 0;i < attrGroups.length; i++)
    {
      discriminant = attrGroups[i]['discriminant'];
      if(discriminant && !AttributeGroupManager.isSharedGroupInitialized(discriminant)) {
        attrGroups[i].setSharedAttributesUpdateAllowed(true);
      }
      
      attrGroups[i].configure(amxNode, attributeGroupConfig);
      
      if(attrGroups[i].isSharedAttributesUpdateAllowed()) {
        AttributeGroupManager.setSharedGroupInitialized(discriminant);
        attrGroups[i].setSharedAttributesUpdateAllowed(false);
      }
    }
  };
  
  /**
   *  Returns all attribute groups saved on given attribute groups node.
   *  @param amxNode amx node
   *  @param context context
   *  @return all attribute groups saved on given amx node
   */  
  AttributeGroupManager.getAttributeGroups = function(amxNode, context) {
    return amxNode['_attributeGroups'];
  };
  
  /**
   *  Adds descriptions of attribute groups associated with given amx node to given dest object.
   *  If attrName is specified it overrides default 'attributeGroups' dest object attribute name.
   *  @param amxNode amx node
   *  @param context context
   *  @param dest destination object
   *  @param attrName optional attribute name
   */  
  AttributeGroupManager.addDescriptions = function(amxNode, context, dest, attrName) {
    var groups = AttributeGroupManager.getAttributeGroups(amxNode, context);
    if(groups)
    {
      attrName = attrName ? attrName : 'attributeGroups';
      dest[attrName] = [];
      for (var i = 0; i < groups.length; i++)
      {
        dest[attrName].push(groups[i].getDescription());
      }
    }
  }
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    util/ResizeHandler.js
 */
(function(){
  
  var ResizeHandler = function ()
  {
    this._callbacks = [];
  }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(ResizeHandler, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.util.ResizeHandler', 'singleton');
  
  /**
   * register callback that will be notified on window change event
   * 
   * @param id unique identificator of this callback
   * @param callback callback immediately executed on window resize event - function has parameter event and should 
   *   return context which will be passed into postCallback (e.g. function (event)&#123;return &#123;'contextinfo' : 'success'};})
   * @param postResizeCallback callback which is called when all callbacks are executed - function has one parameter and
   *   no return value. This parameter represents return value of function callback (e.g. function(context)&#123;}).
   *  
   * @author Tomas 'Jerry' Samek
   */
  ResizeHandler.prototype.addResizeCallback = function (id, callback, postResizeCallback, resizeData)
  {
    // register global window resize event listener only once
    if(!this['__resizeHandlerRegistered'])
    {
      this._registerResizeHandler();
      this['__resizeHandlerRegistered'] = true;
    }

    resizeData = resizeData ? resizeData : {};
    // remove all other listeners under this id
    this.removeResizeCallback(id);
    
    // add objects that represents resize handler
    this._callbacks.push({
      'id' : id,
      'callback' : function(event)
        {
          if(callback)
          {
            var result = callback (event);
            if(result)
            {
              return result;
            }
          }
          // if there is no context then create new empty one
          return {};
        },
      'postCallback' : function (event, context)
        {
          if(postResizeCallback)
          {
            postResizeCallback(event, context);
          }
        },
      'extraData' : resizeData
    });
  }

  /**
   * removes callback by specified id
   * @param id id of resize callback
   * 
   * @author Tomas 'Jerry' Samek
   */
  ResizeHandler.prototype.removeResizeCallback = function (id)
  {
    var tempArray = [];
    var callbacks = this._getResizeCallbacks();
    for(var i = 0; i < callbacks.length; i++)
    {
      if(callbacks[i]['id'] != id)
      {
        tempArray.push(callbacks[i]);
      }
    }
    this._callbacks = tempArray;
  }

  /**
   * @return array of resize handlers
   * 
   * @author Tomas 'Jerry' Samek
   */
  ResizeHandler.prototype._getResizeCallbacks = function () 
  {
    return this._callbacks;
  }

  /**
   * registeres new window resize listener which notifies all our resize handlers
   * 
   * @author Tomas 'Jerry' Samek
   */
  ResizeHandler.prototype._registerResizeHandler = function ()
  {
    var resizeHandler = function (event)
    {
      var callbacks = this._getResizeCallbacks();
      var postCallbacks = [];
      var eventDataToRestore = event.data;
      // notify all handlers about window resize event and save their return context
      for(var i = 0; i < callbacks.length; i++)
      { 
        try
        {
          event.data = callbacks[i]['extraData'];
          var returnContext = callbacks[i]['callback'](event);
          postCallbacks.push(callbacks[i]);
          // add information about event
          postCallbacks.push(returnContext);
        }
        catch (exception)
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, this.getTypeName(), '_registerResizeHandler.callback', 'Exception: ' + exception.message + " (line: " + exception.line + ")");
          adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, this.getTypeName(), '_registerResizeHandler.callback', 'Stack: ' + exception.stack);
        }
      }
      // notify all postCallbacks with context from previous callbacks
      for(var j = 0; j < postCallbacks.length; j = j + 2)
      {
        try
        {
          event.data = postCallbacks[j]['extraData'];
          postCallbacks[j]['postCallback'](event, postCallbacks[j + 1]);
        }
        catch (exception)
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE,
              this.getTypeName(), "_registerResizeHandler.postCallback", "Exception: " + exception.message + " (line: " + exception.line + ")");
          adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, 
              this.getTypeName(), '_registerResizeHandler.postCallback', 'Stack: ' + exception.stack);
        }
      }
      event.data = eventDataToRestore;
    };
    
    window.addEventListener('resize', function (event)
    {
      // bug 18391802: on resize handler must be postponed after the height/width have been set on 'body' 
      setTimeout(function(e) 
      {
        resizeHandler.call(adf.mf.internal.dvt.util.ResizeHandler.getInstance(), e);
      }, 250, event);        // here's the delay timout
    });
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    util/ResourceBundleLoader.js
 */
(function()
{    
  var ResourceBundleLoader = function ()
  {
    this._loaded = [];
  };

  adf.mf.internal.dvt.DvtmObject.createSubclass(ResourceBundleLoader, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.util.ResourceBundleLoader', 'singleton');

  /**
   * Loads given resource bundles.
   * @param bundles array of resource bundles to be loaded
   */
  ResourceBundleLoader.prototype.loadBundles = function (bundles, callback)
  {
    var bundle = null;

    if (bundles && bundles.length > 0)
    {
      var loadedCount = 0;
      var loadCallback = function (fromCache) 
      {
        loadedCount++;

        if (loadedCount === bundles.length)
        {
          if (!fromCache)
          {
            for (var i = 0; i < bundles.length; i++) 
            {
              bundle = bundles[i];
              var bundleCallback = bundle.getLoadCallback();
              if (bundleCallback)
              {
                bundleCallback();
              }
            }
          }

          if (callback)
          {
            callback();
          }
        }
      };

      for (var i = 0; i < bundles.length; i++) 
      {
        bundle = bundles[i];
        this.loadDvtResources(bundle.getUrl(), bundle.getCheckCallback(), loadCallback);  
      }
    }
  };

   /**
   * Load DVT bundles based on user locale
   * @param url base url of Resource Bundle
   * @param loadCheck optional check if Bundle was properly loaded
   */
  ResourceBundleLoader.prototype.loadDvtResources = function (url, checkCallback, loadCallback)
  {
    var loadedBundles = this._loaded;
     
    if (loadedBundles[url] !== undefined)
    {
      if (loadCallback) 
      {
        loadCallback(true);
      }
      // resource is already loaded or function tried to load this resource but failed
      return;
    }

    var _locale = adf.mf.locale.getUserLanguage();
    var localeList = adf.mf.locale.generateLocaleList(_locale, true);
      
    var callback = function (locale)
    {
      // store some information about state of loaded js
      loadedBundles[url] = (locale === null);
      if (loadCallback) 
      {
        loadCallback(false);
      }
    };
    // function creates real path to js bundle
    var resourceBundleUrlConstructor = function (locale)
    {
      if (locale.indexOf("en") == 0)
      {
        return url + ".js";
      }
      return url + "_" + adf.mf.locale.getJavaLanguage(locale) + ".js";
    };

    var resourceBundleLoaded = function ()
    {
      // we have to leave additional check on caller funcion since Resource bundles are different in nature
      // and we don't know what kind of changes these bundles are doing.
      if (checkCallback)
      {
        return checkCallback();
      }
      // when there is no aditional check then js load success itself is resolved as complete success.
      return true;
    };

    this._loadJavaScriptByLocale(localeList, resourceBundleUrlConstructor, resourceBundleLoaded, callback);
  };

  /**
   * Function looks for first Resource Bundle that is loadable and satisfies predicate function.
   * @param localeList list of possible locales
   * @param contructor function that contructs complete url by locale and bundle base url
   * @param predicate tells if Resource Bundle is loaded successfully
   * @param callback function which will be notified after this method is complete
   *
   */
  ResourceBundleLoader.prototype._loadJavaScriptByLocale = function (localeList, constructor, predicate, callback)
  {
    // clone the array before calling the load method since it will actually
    // modify the array as it searches    
    var clonedList = localeList.slice(0);
    this._loadJavaScriptByLocaleImpl(clonedList, constructor, predicate, callback);
  };

  /**
   * Function looks recursively for the first Resource Bundle that is loadable and satisfies predicate function.
   * @param localeList list of possible locales
   * @param contructor function that contructs complete url by locale and bundle base url
   * @param predicate tells if Resource Bundle is loaded successfully
   * @param callback function which will be notified after this method is complete
   *
   * function will notify callback with null argument if no B is loaded in other case it will notify
   * callback function with locale of loaded bundle as a parameter.
   */
  ResourceBundleLoader.prototype._loadJavaScriptByLocaleImpl = function (localeList, constructor, predicate, callback)
  {
    if (localeList.length === 0)
    {
      callback(null);
      return;
    }

    var locale = localeList.pop();
    var url = constructor(locale);

    var that = this;
    // temporary synchronous solution
    adf.mf.api.resourceFile.loadJsFile(url, true, function()
    {
      if (predicate(locale))
      {
        callback(locale);
      }
      else 
      {
        that._loadJavaScriptByLocaleImpl(localeList, constructor, predicate, callback);
      }
    },
    function()
    {
      that._loadJavaScriptByLocaleImpl(localeList, constructor, predicate, callback);
    },
    function(t)
    {
      return t;
    });
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    AttributeProcessor.js
 */
(function(){   
  adf.mf.internal.dvt.AttributeProcessor = 
    {
      'TEXT' : 
        function (value)
        {
          if(value !== null)
          {
            return '' + value;
          } 
          return undefined;
        },
      'BOOLEAN' : 
        function (value)
        {
          return adf.mf.api.amx.isValueTrue(value);
        },
      'ON_OFF' : 
        function (value)
        {
          return adf.mf.api.amx.isValueTrue(value) ? 'on' : 'off';
        },
      'INTEGER' : 
        function (value)
        {
          return value === null ? 0 : parseInt(value);
        },
      'FLOAT' : 
        function (value)
        {
          return value === null ? 0.0 : parseFloat(value);
        },
      'PERCENTAGE' : 
        function (value)
        {
          return _processPercentageAttribute(value, true);
        },
      'PERCENTAGE2' : 
        function (value)
        {
          return _processPercentageAttribute(value, false);
        },
      'DATETIME' :
        function (value)
        {
          return _convertDate(value);
        },
      'ROWKEYARRAY' :
        function (value)
        {
          return _processStringArray(value, false);
        },
      'STRINGARRAY' :
        function (value)
        {
          return _processStringArray(value, true);
        },
      'RATING_STEP' :
        function (value)
        {
          var retVal;
          if (value !== null)
          {
            if (value === 'full')
              retVal = 1.0;
            else if (value === 'half')
              retVal = 0.5;
            else
              retVal = parseFloat(value);
            if (!isNaN(retVal))
              return retVal;
          }
          return undefined;
        },
      'GAUGE_STEP' :
        function (value)
        {
          var retVal;
          if (value !== null)
          {
            retVal = parseFloat(value);
            if (!isNaN(retVal))
              return retVal;
          }
          return undefined;
        }
    };
    
  /**
   * Parses the string attribute that can have value 0.0-1.0 or 0.0%-100.0% and 
   * returns float 0.0-1.0, in case of any error 1.0  
   *
   * parameters
   *
   * @param attribute - string that can be 0.0-1.0 or 0.0%-100.0%
   * @param normalize - if true, attribute will be normalized to 0.0-1.0 interval
   * @return float 0.0-1.0, in case of any error 1.0
   *
   */
  var _processPercentageAttribute = function (attribute,normalize) 
  {
    // result, default value
    var fl = 1.0;
    // is attribute percentage
    var percentage = false;
    var attributeLength;
  
    if (attribute !== undefined && attribute !== null)
    {  
      // trim attribute
      attribute = attribute.replace(/(^\s*)|(\s*$)/g, '');
      // number of characteres of attribute
      attributeLength = attribute.length - 1;
      
      // is the attribute percentage
      if (attribute.charAt(attributeLength) === '%') 
      {
        // set flag
        percentage = true;
        // remove percentage character
        attribute = attribute.substr(0, attributeLength);
      }
    
      // try to parse float value from first part of attribute without '%'
      fl = parseFloat(attribute);
      
      // is parsed number valid?
      if (!isNaN(fl)) 
      {
        // convert percent to number
        if (percentage) fl /= 100.0;
        if (normalize) {
          // check if number is 0.0-1.0
          if (fl < 0.0 || fl > 1.0) fl = 1.0;
        }
      }
      else 
        // any error
        fl = 1.0;
    } 
    
    return fl;
  };
  
  /**
   * Converts an ISO 8601 encoded date string to a timestamp
   *
   * @param dateStr a string containing a date/time (supposedly in ISO 8601 format)
   * @return a converted date as a timestamp, or the original date string, if the conversion failed
   */
  var _convertDate = function (dateStr)
  {
    var date = new Date(dateStr);

    if (!isNaN(date))
    {
      return date.getTime();
    }
    else 
    {
      return dateStr;
    }
  };
  
  /**
   * parses an array of strings or numbers. The input can be specified as an array or
   * a string separated with comma or whitespace
   *
   * @param {Object} strings input list
   * @param {boolean} convertNumber input list
   * @return {Array} array of strings
   */
  var _processStringArray = function (strings, convertNumber)
  {
    var result = [];
    
    if (!strings)
    {
      return result;
    }
    
    if (strings instanceof Array)
    {
      // already an array, just return a copy 
      result = strings.slice(0);
    }
    // parse selection in case that it is in a string format
    else if (typeof strings === "string")
    {
      if (strings.indexOf(",") >  -1)
      {
        result = strings.split(",");
      }
      else if (strings.indexOf(" ") >  - 1)
      {
        result = strings.split(" ");
      }
      else 
      {
        result = [strings];
      }
    }
    else if (typeof strings === "number")
    {
      if (convertNumber)
      {
        result = ['' + strings];
      }
      else
      {
        result = [strings];
      }
    }
    return result;
  };

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    StyleProcessor.js
 */
(function ()
{  
  adf.mf.internal.dvt.StyleProcessor = 
  {
    'VISIBILITY' :
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        return nodeStyle['visibility'] === 'hidden' ? 'off' : 'on';
      },
    'CSS_TEXT' : 
      function(node, styleString)
      {
          var ignoreProperties = {};
          if (node) {
            if (hasClassName (node, "dvtm-gaugeMetricLabel") &&
                hasClassName (node.parentNode, "dvtm-ledGauge")
            ) {
              ignoreProperties ['font-size'] = true;
              ignoreProperties ['color'] = true;
            }
            if (hasClassName (node, "dvtm-chartSliceLabel") ||
                hasClassName (node, "dvtm-treemapNodeLabel") ||
                hasClassName (node, "dvtm-sunburstNodeLabel")
            ) {
              ignoreProperties ['color'] = true;
            }
          }
          var nodeStyle = _getComputedStyle(node);
          return _mergeOptionsAndDivStyle(node, nodeStyle, styleString, false, ignoreProperties);
      },
    'CSS_TEXT_TR' : 
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        return _mergeOptionsAndDivStyleTr(node, nodeStyle, styleString);
      },
    'CSS_TEXT_WITH_BORDER_COLOR' : 
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        styleString = _mergeOptionsAndDivStyle(node, nodeStyle, styleString);
        return styleString;
      },      
    'BACKGROUND' : 
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        return nodeStyle.getPropertyValue('background-color');
      },
    'BORDER_COLOR' : 
      function(node, styleString) 
      {
        var nodeStyle = _getComputedStyle(node);
        return nodeStyle.getPropertyValue('border-bottom-color');
      },
    'BORDER_COLOR_TOP' : 
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        return nodeStyle.getPropertyValue('border-top-color');
      },
    'BORDER_RADIUS' : 
      function(node, styleString) 
      {
        var nodeStyle = _getComputedStyle(node);
        var value = nodeStyle.getPropertyValue('border-bottom-radius');
        if (!value) return undefined;
        return value;
      },
    'COLOR' : 
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        return nodeStyle.getPropertyValue('color');
      },
    'OPACITY' : 
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        return +nodeStyle.getPropertyValue('opacity');
      },
    'BORDER_STYLE' : 
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        return nodeStyle.getPropertyValue('border-bottom-style');
      },
    'BOTTOM_BORDER_WIDTH' : 
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        return nodeStyle.getPropertyValue('border-bottom-width');
      },

    'CSS_BACK' : 
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        return _mergeOptionsAndDivStyle(node, nodeStyle, styleString, true);
      },
    'TOP_BORDER_WHEN_WIDTH_GT_0PX' :
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        if(nodeStyle.getPropertyValue('border-bottom-width') === '0px')
        {
          return undefined;
        }
        return nodeStyle.getPropertyValue('border-top-color');
      },
    'CSS' : 
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        return _mergeOptionsAndDivStyle(node, nodeStyle, styleString);
      },
    'WIDTH' : 
      function(node, styleString)
      {
        var nodeStyle = _getComputedStyle(node);
        return nodeStyle.getPropertyValue('width');
      }
  }

  function hasClassName (node, className) {
    var classList = node.classList;
    if (!classList) return false;
    for (var i = 0; i < classList.length; i++) {
      if (classList [i] === className)
        return true;
    }
    return false;
  }
  
  adf.mf.internal.dvt.ROOT_NODE_STYLE = '_self';
  
  var _getComputedStyle = function (node)
  {
    return window.getComputedStyle(node, null);
  }
  
  var _buildCssBackStyleString = function (divStyle)
  {
    var styleString = "";
    var bbColor = divStyle.getPropertyValue('border-bottom-color');
    if (bbColor)
    {
      styleString += "border-color: " + bbColor + ";";
    }
    
    // border without border-style is always nonsense (with width 0px)
    var bbWidth = divStyle.getPropertyValue('border-bottom-width');
    var bStyle = divStyle.getPropertyValue('border-style');
    if (bbWidth && (bStyle && bStyle !== 'none'))
    {
      styleString += "border-width: " + bbWidth + ";";
    }
    
    var bgColor = divStyle.getPropertyValue('background-color');
    if (bgColor)
    {
      styleString += "background-color: " + bgColor + ";";
    }
    
    return styleString;
  }
  
  /**
   * build css style string
   */
  var _buildTextCssStyleString = function (divStyle, ignoreProperties)
  {   
    var styleString = "";
  
    var fFamily = divStyle.getPropertyValue('font-family');
    var fSize = divStyle.getPropertyValue('font-size');
    var fWeight = divStyle.getPropertyValue('font-weight');
    var fColor = divStyle.getPropertyValue('color');
    var fStyle = divStyle.getPropertyValue('font-style');
  
    if (fFamily)
    {
      styleString += "font-family: " + fFamily + ";";
    }
    if (fSize && !ignoreProperties ['font-size'])
    {
      var nSize = parseFloat(fSize);
      if (nSize >= 1) {
        styleString += "font-size: " + fSize + ";";
      }
    }
    if (fWeight)
    {
      styleString += "font-weight: " + fWeight + ";";
    }
    if (fColor && !ignoreProperties ['color'])
    {
      styleString += "color: " + fColor + ";";
    }
    if (fStyle)
    {
      styleString += "font-style: " + fStyle + ";";
    }
    return styleString;
  }
  
  var _mergeOptionsAndDivStyleTr = function (cssDiv, cssDivStyle, optionsStyle)
  {
    if(!cssDiv) 
    {
      return optionsStyle;  
    }
    
    var oldStyle;
    if(optionsStyle) 
    {
      oldStyle = cssDiv.getAttribute("style");
      cssDiv.setAttribute("style", oldStyle + ";" + optionsStyle);
    }
    var styleString = '';
    var btColor = cssDivStyle.getPropertyValue('border-top-color');
    var bbColor = cssDivStyle.getPropertyValue('border-bottom-color');
    if (btColor)
    {
      styleString += "-tr-inner-color: " + btColor + ";";
    }
    if (bbColor)
    {
      styleString += "-tr-outer-color: " + bbColor + ";";
    }
    return styleString;
  }  

  /**
   * Merges style on div with css text in optionsStyle.
   * 
   * @param cssDiv element with style class or with some default style
   * @param optionsStyle extending CSS text style
   * @return merged CSS text style
   * @private
   * @ignore
   */
  _mergeOptionsAndDivStyle = function(cssDiv, cssDivStyle, optionsStyle, back, ignoreProperties)
  {     
    if (!ignoreProperties)
      ignoreProperties = {};
    
    if(!cssDiv) 
    {
      return optionsStyle;  
    }
    
    var oldStyle;
    if(optionsStyle) 
    {
      oldStyle = cssDiv.getAttribute("style");
      cssDiv.setAttribute("style", oldStyle + ";" + optionsStyle);
    }      
    
    var styleString = '';
    
    if(back !== true)
    {
      styleString += _buildTextCssStyleString(cssDivStyle, ignoreProperties);
    }
    
    if(back !== false)
    {
      styleString += _buildCssBackStyleString(cssDivStyle);
    }
    if(oldStyle)
    {
      cssDiv.setAttribute("style", oldStyle);
    }
    return styleString;
  }

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    BaseRenderer.js
 */
(function ()
{
  var JSONPath = adf.mf.internal.dvt.util.JSONPath;
  /**
   * Class describes how the renderers should be processed to achive unified processing of
   * all attributes and child amx nodes.
   */
  var BaseRenderer = function ()
  {}

  adf.mf.internal.dvt.DvtmObject.createSubclass(BaseRenderer, 'adf.mf.api.amx.TypeHandler', 'adf.mf.internal.dvt.BaseRenderer');

  BaseRenderer.DATA_OBJECT = '_optionsObj';
  var DATA_DIRTY = '_optionsDirty';

  /**
   * @param amxNode
   * @return object that describes atributes of the component.
   */
  BaseRenderer.prototype.GetAttributesDefinition = function (amxNode)
  {
    return {};
  }

  /**
   * @param {String} facetName an optional name of the facet containing the items to be rendered
   * @return object that describes child renderers of the component.
   */
  BaseRenderer.prototype.GetChildRenderers = function (facetName)
  {
    return {};
  }

  BaseRenderer.prototype.ProcessComponent = function (amxNode, id)
  {
    // a temporary workaround to enable SVG element id's for testing purposes
    if (typeof DvtDisplayable !== 'undefined')
    {
      DvtDisplayable.SET_ID_ON_DOM = true;
    }

    // prepare processing context
    var context = this.CreateContext(amxNode, null, null);
    // process attributes of parameter amxNode and translate its attributes
    // to the attributes on the options object
    this._processAttributes(amxNode, context);
    // process children of the amxNode and let them set options object
    this._processChildren(amxNode, context);
  }

  BaseRenderer.prototype.RefreshComponent = function (amxNode, attributeChanges, descendentChanges)
  {
    // prepare processing context
    var context = this.CreateContext(amxNode, attributeChanges, descendentChanges ? descendentChanges : null);
    // process attributes of parameter amxNode and translate its attributes
    // to the attributes on the options object
    this._processAttributes(amxNode, context);
    // process children of the amxNode and let them set options object
    this._processChildren(amxNode, context);
  }

  /**
   * process chart's children found on the amxNode
   *
   * @param amxNode current amxNode
   * @param context rendering context
   */
  BaseRenderer.prototype._processAttributes = function (amxNode, context)
  {
    var options = this.GetDataObject(amxNode);
    // call BaseRenderer's ProcessAttributes function to resolve attributes.
    var changed = this.ProcessAttributes(options, amxNode, context);
    if (changed)
    {
      this.SetOptionsDirty(amxNode, true);
    }
  }

  /**
   * process chart's children found on the amxNode
   *
   * @param amxNode current amxNode
   * @param context rendering context
   */
  BaseRenderer.prototype._processChildren = function (amxNode, context)
  {
    // create new context for processing of the child nodes
    var options = this.GetDataObject(amxNode);
    // call CompositeRenderer's ProcessChildren function to resolve child nodes.
    var changed = this.ProcessChildren(options, amxNode, context);

    if (changed)
    {
      this.SetOptionsDirty(amxNode, true);
    }
  }

  /**
   * @param amxNode current amxNode
   * @param attributeChanges
   * @param descendentChanges
   * @return context for processing of the attributes and children
   */
  BaseRenderer.prototype.CreateContext = function (amxNode, attributeChanges, descendentChanges)
  {
    var context = 
    {
      'amxNode' : amxNode, '_attributeChanges' : attributeChanges, '_descendentChanges' : descendentChanges
    };

    return context;
  }

  BaseRenderer.prototype.GetDataObject = function (amxNode)
  {
    var data = amxNode.getAttribute(BaseRenderer.DATA_OBJECT);
    if (!data)
    {
      data = {};
      this.SetDataObject(data);
    }
    return data;
  };

  BaseRenderer.prototype.SetDataObject = function (amxNode, data)
  {
    amxNode.setAttributeResolvedValue(BaseRenderer.DATA_OBJECT, data);
  };

  BaseRenderer.prototype.GetOptions = function (options)
  {
    return options;
  }

  BaseRenderer.prototype.SetOptionsDirty = function (amxNode, value)
  {
    if (value === true)
    {
      amxNode.setAttributeResolvedValue(DATA_DIRTY, true);
    }
    else 
    {
      amxNode.setAttributeResolvedValue(DATA_DIRTY, false);
    }
  }

  BaseRenderer.prototype.IsOptionsDirty = function (amxNode)
  {
    if (amxNode.getAttribute(DATA_DIRTY))
    {
      return true;
    }
    return false;
  }

  /**
   * Function processes supported attributes which are on amxNode. This attributes
   * should be converted into the options object.
   *
   * @param options main component options object
   * @param amxNode child amxNode
   * @param context rendering context
   */
  BaseRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {
    options = this.GetOptions(options);
    var attributeMap = this.GetAttributesDefinition(amxNode);
    var changed = false;
    var that = this;

    var keys = attributeMap ? Object.keys(attributeMap) : [];
    for (var i = 0, length = keys.length;i < length;i++)
    {
      var attribute = keys[i];

      adf.mf.log.Framework.logp(adf.mf.log.level.FINE, that.getTypeName(), "ProcessAttributes", "Attribute changed: " + attribute);

      var definition = attributeMap[attribute];
      var path = new JSONPath(options, definition['path']);
      var attrChanged = false;

      var value = undefined;
      if (adf.mf.environment.profile.dtMode && definition['dtvalue'])
      {
        value = definition['dtvalue'];
      }
      else if (amxNode.isAttributeDefined(attribute))
      {
        value = amxNode.getAttribute(attribute);
        if (adf.mf.environment.profile.dtMode && typeof value === 'string' && value.indexOf('#{') >  - 1)
        {
          value = undefined;
        }

        if (value !== undefined && definition['type'])
        {
          value = definition['type'](value);
        }
      }

      if (value !== undefined)
      {
        attrChanged = path.setValue(value);
      }
      else if (definition['default'] !== undefined)
      {
        attrChanged = path.setValue(definition['default']);
      }

      changed = changed || attrChanged;
    }
    return changed;
  }

  /**
   * @param amxNode current amxNode
   * @param context rendering context
   * @return list of child nodes of the amxNode
   */
  BaseRenderer.prototype.GetChildrenNodes = function (amxNode, context)
  {
    return amxNode.getChildren(context['_currentFacet']);
  }

  BaseRenderer.EMPTY_CHANGES = new adf.mf.api.amx.AmxAttributeChange();

  /**
   * Function processes supported childTags which are on amxNode.
   *
   * @param options main component options object
   * @param amxNode child amxNode
   * @param context renderingcontext
   */
  BaseRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {
    var renderers = this.GetChildRenderers();
    // skip processing when component has no child renderers
    if (renderers)
    {
      var facets;
      if (this.GetFacetNames)
      {
        facets = this.GetFacetNames();
      }
      else 
      {
        facets = [null];
      }
      options = this.GetOptions(options);
      var i, j, length;
      var forProcessing = [];
      var originalChanges = context['_attributeChanges'];
      for (j = 0;j < facets.length;j++)
      {
        context['_currentFacet'] = facets[j];
        var children = this.GetChildrenNodes(amxNode, context);
        context['_currentFacet'] = null;
        var occurrences = 
        {
        };
        // at the first iteration find only supported child nodes
        for (i = 0, length = children.length;i < length;i++)
        {
          var tagName = children[i].getTag().getName();
          var rendererObject = renderers[tagName];
          // find if there is a renderer for current child node
          if (rendererObject && rendererObject['renderer'])
          {
            var renderer = rendererObject['renderer'];
            // skip renderer for tag whose 'rendered' attribute is false,
            // unless the renderer has a special handler for it
            var attributeMap = renderer.GetAttributesDefinition(children[i]);
            if (children[i].isAttributeDefined('rendered') 
                     && adf.mf.api.amx.isValueFalse(children[i].getAttribute('rendered'))
                     && attributeMap['rendered'] === undefined)
            {
              continue;
            }
            // check if how many children can be nested in this amxNode
            var maxOccurrences = renderer['maxOccurrences'];
            if (maxOccurrences !== undefined && maxOccurrences !== null)
            {
              if (occurrences[tagName] === undefined)
              {
                occurrences[tagName] = 0;
              }
              // check if function can still process this child node
              if (occurrences[tagName] < maxOccurrences)
              {
                occurrences[tagName] = occurrences[tagName] + 1;
              }
              else 
              {
                adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, this.getTypeName(), "ProcessChildren", "Too many occurrences of the node '" + tagName + "'!");
                continue;
              }
            }
            // add job to be processed
            forProcessing.push(
            {
              'r' : renderer, 'c' : children[i], 'p' : (rendererObject['order'] === undefined ? 0 : rendererObject['order']), 'o' : i
            });
          }
          else 
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, this.getTypeName(), "ProcessChildren", "There is no renderer for node '" + tagName + "'!");
          }
        }
      }
      // sort all nodes which are supposed to be rendered by priority to
      // ensure proper child resolution and dependencies
      forProcessing.sort(function (a, b)
      {
        return (a['p'] === b['p']) ? a['o'] - b['o'] : a['p'] - b['p'];
      });
      // call attribute processing and child processing on each child which should be rendered
      var changed = false;
      for (i = 0, length = forProcessing.length;i < length;i++)
      {
        if (forProcessing[i]['r'].ProcessAttributes)
        {
          var changes = context['_attributeChanges'];
          var descendentChanges = context['_descendentChanges'];
          if (descendentChanges)
          {
            context['_attributeChanges'] = descendentChanges.getChanges(forProcessing[i]['c']);
            if (!context['_attributeChanges'])
            {
              context['_attributeChanges'] = BaseRenderer.EMPTY_CHANGES;
            }
          }
          else if (changes)
          {
            context['_attributeChanges'] = BaseRenderer.EMPTY_CHANGES;
          }
          changed = changed | forProcessing[i]['r'].ProcessAttributes(options, forProcessing[i]['c'], context);
          context['_attributeChanges'] = changes;
        }
        else 
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, this.getTypeName(), "ProcessChildren", "There is a missing ProcessAttributes method on renderer for '" + forProcessing[i]['c'].getTag().getName() + "'!");
        }
        if (forProcessing[i]['r'].ProcessChildren)
        {
          changed = changed | forProcessing[i]['r'].ProcessChildren(options, forProcessing[i]['c'], context);
        }
        else 
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, this.getTypeName(), "ProcessChildren", "There is a missing ProcessChildren method on renderer for '" + forProcessing[i]['c'].getTag().getName() + "'!");
        }
      }
      return changed;
    }
    else 
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, this.getTypeName(), "ProcessChildren", "There are no child renderers for node '" + amxNode.getTag().getName() + "'!");
      return false;
    }
  }

  /**
   * Helper that provides quick array filtering.
   * 
   * @param array {array} array of the items
   * @param test {function} callback that tests the item in the array (e.g. function(value, index, array){return true;});
   * @return {array} new instance of the array with items that passes test in same order as in the source array
   */
  BaseRenderer.prototype.filterArray = function(array, test)
  {
    var match = [];
    if (array)
    {
      for (var i = 0, size = array.length; i < size; i++)
      {
        if (test(array[i], i, array))
        {
          match[match.length] = array[i];
        }
      }
    }

    return match;
  }

  BaseRenderer.prototype.findAllAmxNodes = function (root, clientIds)
  {
    var result = [];
    if (clientIds)
    {
      var found = 0;
      root.visitChildren(new adf.mf.api.amx.VisitContext(), function (visitContext, amxNode)
      {
        if (clientIds.indexOf(amxNode.getId()) > -1)
        {
          result.push(amxNode);
          found++;
          if (found === clientIds.length)
          {
            return adf.mf.api.amx.VisitResult['COMPLETE'];
          }
          return adf.mf.api.amx.VisitResult['REJECT'];
        }
        return adf.mf.api.amx.VisitResult['ACCEPT'];
      });
    }
    return result;
  };

  BaseRenderer.prototype.findAmxNode = function (root, clientId)
  {
    var itemNode = null;
    if (clientId)
    {
      root.visitChildren(new adf.mf.api.amx.VisitContext(), function (visitContext, amxNode)
      {
        if (amxNode.getId() === clientId)
        {
          itemNode = amxNode;
          return adf.mf.api.amx.VisitResult['COMPLETE'];
        }
        return adf.mf.api.amx.VisitResult['ACCEPT'];
      });
    }
    return itemNode;
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    BaseComponentRenderer.js
 */
(function ()
{
  var DOMUtils = adf.mf.internal.dvt.DOMUtils;
  var JSONPath = adf.mf.internal.dvt.util.JSONPath;

  /**
   * Common ancestor for all top level dvt component renderers which directly interacts with the amx layer.
   *
   * Implemented AMX Interface functions
   *  - create (function contructs component's Options)
   *  - init (function registers listeners for new component)
   *  - postDisplay (function renders chart itself)
   *  - refresh (function refreshes component's Options)
   *  - destroy (function removes registered listeners from init function)
   */
  var BaseComponentRenderer = function ()
  {};

  // renderer extend adf.mf.internal.dvt.BaseRenderer which means that this renderer supports
  // rendering of the child tags
  adf.mf.internal.dvt.DvtmObject.createSubclass(BaseComponentRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.BaseComponentRenderer');

  adf.mf.internal.dvt.AMX_NAMESPACE = 'http://xmlns.oracle.com/adf/mf/amx';
  adf.mf.internal.dvt.DVT_NAMESPACE = 'http://xmlns.oracle.com/adf/mf/amx/dvt';

  var COMPONENT_INSTANCE = '_jsComponentInstance';

  BaseComponentRenderer.DEFAULT_WIDTH = 300;
  BaseComponentRenderer.DEFAULT_HEIGHT = 200;

  // allow to override default behavior
  BaseComponentRenderer.prototype.isRendered = function (amxNode)
  {
    // first check if this data item should be rendered at all
    var rendered = true;
    var attrValue = amxNode.getAttribute('rendered');
    if (attrValue !== undefined)
    {
      if (adf.mf.api.amx.isValueFalse(attrValue))
      {
        rendered = false;
      }
    }
    return rendered;
  };

  /**
   * Function creates component's options, merges them with default styles.
   *
   * @param amxNode
   * @return jquery div element
   */
  BaseComponentRenderer.prototype.render = function (amxNode, id)
  {
    // set a private flag to indicate whether the node can be populated with contents
    // should an exception occur during data processing, this flag will be set to false
    this._setReadyToRender(amxNode, true);

    try
    {
      // new fresh component so release old toolkit instance if any
      amxNode.setAttributeResolvedValue(COMPONENT_INSTANCE, null);
      // load resource bundles for this component
      this._loadResourceBundles(amxNode);
      // get empty options object
      var options = {};
      // create new options object
      this.InitComponentOptions(amxNode, options);
      // fill newly created object with default and custom styles
      options = this.MergeComponentOptions(amxNode, options);
      // store options object to the amxNode
      this.SetDataObject(amxNode, options);
      // call parent renderer to resolve atributes and childrens
      this.ProcessComponent(amxNode, id);
    }
    catch (ex)
    {
      // set flag that unexpected state occured and renderer is not able to render this amxNode
      this._setReadyToRender(amxNode, false);
      if (ex instanceof adf.mf.internal.dvt.exception.NodeNotReadyToRenderException)
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.INFO, this.getTypeName(), "create", ex + " (line: " + ex.line + ")");
        adf.mf.log.Framework.logp(adf.mf.log.level.FINE, this.getTypeName(), "create", "Stack: " + ex.stack);
      }
      else 
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, this.getTypeName(), "create", "Exception: " + ex.message + " (line: " + ex.line + ")");
        adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, this.getTypeName(), "create", "Stack: " + ex.stack);
      }
    }
    // create new jquery div element for this amxNode
    return this.SetupComponent(amxNode);
  };

  /**
   * Function initilazes component's dom node and registers listeners for this component.
   *
   * @param amxNode
   * @param node dom div element
   */
  BaseComponentRenderer.prototype.init = function (node, amxNode)
  {
    try 
    {
      // call internal function that performs initialization
      this.InitComponent(node, amxNode);
    }
    catch (ex)
    {
      // set flag that unexpected state occured and renderer is not able to render this amxNode
      this._setReadyToRender(amxNode, false);
      if (ex instanceof adf.mf.internal.dvt.exception.NodeNotReadyToRenderException)
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.INFO, this.getTypeName(), "init", ex + " (line: " + ex.line + ")");
        adf.mf.log.Framework.logp(adf.mf.log.level.FINE, this.getTypeName(), "init", "Stack: " + ex.stack);
      }
      else 
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, this.getTypeName(), "init", "Exception: " + ex.message + " (line: " + ex.line + ")");
        adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, this.getTypeName(), "init", "Stack: " + ex.stack);
      }
    }
  };

  /**
   * Function renders component.
   *
   * Render is skipped when _isReadyToRender function returns false which indicates that some exception occures before
   * this state and there can be some inconsistency in data so all render phase is skipped
   *
   * @param amxNode
   * @param node dom div element
   */
  BaseComponentRenderer.prototype.postDisplay = function (node, amxNode)
  {
    if (this._isReadyToRender(amxNode))
    {
      this._renderComponent(node, amxNode);
    }
  };

  /**
   * Function resets component's options and renderes component.
   *
   * @param amxNode
   * @param attributeChanges changes of current amxNode
   */
  BaseComponentRenderer.prototype.refresh = function (amxNode, attributeChanges, descendentChanges)
  {
    // set a private flag to indicate whether the node can be populated with contents
    // should an exception occur during data processing, this flag will be set to false
    this._setReadyToRender(amxNode, true);

    try 
    {
      // reset options object
      this.ResetComponentOptions(amxNode, this.GetDataObject(amxNode), attributeChanges, descendentChanges);
      // call parent renderer to resolve atributes and childrens
      this.RefreshComponent(amxNode, attributeChanges, descendentChanges);
      // reset current dimensions to allow component to adjust size
      // to its content
      this.ResetComponentDimensions(document.getElementById(this.GetComponentId(amxNode)), amxNode);
    }
    catch (ex)
    {
      // set flag that unexpected state occured and renderer is not able to render this amxNode
      this._setReadyToRender(amxNode, false);
      if (ex instanceof adf.mf.internal.dvt.exception.NodeNotReadyToRenderException)
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.INFO, this.getTypeName(), "refresh", ex + " (line: " + ex.line + ")");
        adf.mf.log.Framework.logp(adf.mf.log.level.FINE, this.getTypeName(), "refresh", "Stack: " + ex.stack);
      }
      else 
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, this.getTypeName(), "refresh", "Exception: " + ex.message + " (line: " + ex.line + ")");
        adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, this.getTypeName(), "refresh", "Stack: " + ex.stack);
      }
    }
    // find the dom node for amxNode
    if (this._isReadyToRender(amxNode))
    {
      this.renderNode(amxNode);
    }
  };

  BaseComponentRenderer.prototype.renderNode = function (amxNode)
  {
    var node = document.getElementById(this.GetComponentId(amxNode));
    this._renderComponent(node, amxNode);
  };

  /**
   * Function removes registered listeners.
   *
   * @param amxNode
   * @param node dom div element
   */
  BaseComponentRenderer.prototype.destroy = function (node, amxNode)
  {
    this.DestroyComponent(node, amxNode);
  };

/**
 * Type handler callback to obtain a locator for a DOM element under this comp onent
 *
 * @param {Object} amxNode of the component
 * @param {Element} domElement the element
 * @return {string} the locator plus any needed sub-id for the element
 */
 	
  BaseComponentRenderer.prototype.getElementLocator = function (amxNode, domElement)
  {
    var componentInstance = this.GetComponentInstance(null, amxNode);
    if (!componentInstance)
    {
      return null;
    }

    var automation = null;
    if (componentInstance.getAutomation)
    {
      automation = componentInstance.getAutomation();
    }

    if (!automation)
    {
      return null;
    }

    return automation.getSubIdForDomElement(domElement);
  };
 
/**
  * Type handler callback to obtain a DOM element for a locator/sub-id handled by the component
  *
  * @param {Object} amxNode of the component
  * @param {string} elementLocator the locator plus any needed sub-id for the e lement
  * @return {Element} domElement the DOM element
  */ 
  BaseComponentRenderer.prototype.getElementForLocator = function(amxNode, elementLocator)
  {
    var componentInstance = this.GetComponentInstance(null, amxNode);
    if (!componentInstance)
    {
      return null;
    }
  
    var automation = null;
    if (componentInstance.getAutomation)
    {
      automation = componentInstance.getAutomation();
    }

    if (!automation)
    {
      return null;
    }

    return automation.getDomElementForSubId(elementLocator);
  };

  // END OF AMX INTERFACE

  /**
   * Function is called in init phase and should initialize shell of the options object
   *
   * @param amxNode
   */
  BaseComponentRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    this.SetOptionsDirty(amxNode, true);
  };

  /**
   * Function is called in refresh phase and should reset the options object according to attributeChanges parameter.
   *
   * @param amxNode
   * @param attributeChanges
   */
  BaseComponentRenderer.prototype.ResetComponentOptions = function (amxNode, options, attributeChanges, descendentChanges)
  {
    // clear the 'dirty' flag on the options object
    this.SetOptionsDirty(amxNode, false);
  };

  /**
   * @return unique ID of rendered component
   */
  BaseComponentRenderer.prototype.GetComponentId = function (amxNode)
  {
    var id = amxNode.getId();

    if (id === undefined)
    {
      idAttr = '';
    }
    return id;
  };

  /**
   * sets up chart's outer div element
   *
   * @param amxNode
   */
  BaseComponentRenderer.prototype.SetupComponent = function (amxNode)
  {
    // create main div
    var contentDiv = DOMUtils.createDIV();
    // set up basic div's attributes
    var id = this.GetComponentId(amxNode);
    DOMUtils.writeIDAttribute(contentDiv, id);

    var contentDivClass = this.GetContentDivClassName();
    var className = 'dvtm-component';
    if (contentDivClass)
    {
      className = className + ' ' + contentDivClass;
    }
    DOMUtils.writeClassAttribute(contentDiv, className);
    // set inner content of the div with generated html which contains all the helper divs
    var styleClassMap = this.GetStyleClassesDefinition();
    contentDiv.innerHTML = _generateInnerHTML(styleClassMap, amxNode);

    return contentDiv;
  };

  BaseComponentRenderer.prototype.GetContentDivClassName = function ()
  {
    return null;
  };

  var _generateInnerHTML = function (classes, amxNode)
  {
    var innerHtml = '';
    var keys = Object.keys(classes);
    for (var i = 0, length = keys.length; i < length;i++)
    {
      var styleClass = keys[i];

      if (styleClass === adf.mf.internal.dvt.ROOT_NODE_STYLE)
      {
        continue;
      }

      innerHtml += '<div class="';
      var builderFunction = classes[styleClass]['builderFunction'];
      if (builderFunction !== undefined)
      {
        var result = builderFunction(amxNode);
        innerHtml += result;
      }
      else 
      {
        innerHtml += styleClass;
      }
      innerHtml += '" style="display:none;"><\/div>';
    }

    return innerHtml;
  };

  /**
   * @return object that describes styleClasses of the component.
   */
  BaseComponentRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    return {};
  };

  /**
   * @return string path from the window to user specified custom styles.
   */
  BaseComponentRenderer.prototype.GetCustomStyleProperty = function (amxNode)
  {
    return 'CustomComponentStyle';
  };

  /**
   * @return default style object for the component.
   */
  BaseComponentRenderer.prototype.GetDefaultStyles = function (amxNode)
  {
    return {};
  };

  /**
   * Function fills options object with merged styles from default styles and custom styles.
   * Default styles are returned from GetCustomStyleProperty function and default style object
   * is returne by function GetDefaultStyles
   *
   * @param amxNode amxNode of this component
   */
  BaseComponentRenderer.prototype.MergeComponentOptions = function (amxNode, options)
  {
    // first, apply JSON style properties
    var styleJSON;
    var property = this.GetCustomStyleProperty(amxNode);
    var jsonPath = new JSONPath(window, property);
    var customStyles = jsonPath.getValue();

    if (customStyles !== undefined)
    {
      styleJSON = adf.mf.internal.dvt.util.JSONUtils.mergeObjects(customStyles, this.GetDefaultStyles(amxNode));
    }
    else 
    {
      styleJSON = this.GetDefaultStyles(amxNode);
    }
    // if we got here, assume the options object *will* be modified
    this.SetOptionsDirty(amxNode, true);
    // the 'optionsObject' is a result of the default and custom style
    return adf.mf.internal.dvt.util.JSONUtils.mergeObjects(styleJSON, options);
  };

  /**
   * returns the component's width
   *
   * @author Tomas 'Jerry' Samek
   */
  BaseComponentRenderer.prototype.GetComponentWidth = function (simpleNode, amxNode)
  {
    var width = DOMUtils.getWidth(simpleNode);
    if (width <= 1)
    {
      // width not set or too small, try using parent width instead
      width = DOMUtils.getWidth(simpleNode.parentNode);
    }
   
    return width;
  };

  /**
   * @returns true when component can use extended form of the height determination.
   * We don't want this to happen in case of the components that manage the layout itself
   * or in case that we are the only one component in the parent.
   *
   * @author Tomas 'Jerry' Samek
   */
  BaseComponentRenderer.prototype.IsSmartLayoutCapable = function (simpleNode, amxNode)
  {
    if (amxNode === null || amxNode.getParent() === null)
    {
      return false;
    }
    // try to find cached information about the smart layout
    if (amxNode.getAttribute("__smartLayout") != null)
    {
      return amxNode.getAttribute("__smartLayout");
    }
    // in case that we are the only child don't use smart layout
    if (!simpleNode || !simpleNode.parentNode || simpleNode.parentNode.childNodes.length === 1)
    {
      amxNode.setAttributeResolvedValue("__smartLayout", false);
      return false;
    }
    // filter known cases of the layouts that always wrap component
    // to the extra div but in some cases (transitions for example)
    // can contain two components in one wrapper for short amount of
    // time.
    switch (amxNode.getParent().getTag().getName())
    {
      case 'deck':
      case 'flexLayout':
      case 'panelGroupLayout':
        amxNode.setAttributeResolvedValue("__smartLayout", false);
        return false;
      default :
        amxNode.setAttributeResolvedValue("__smartLayout", true);
        return true;
    }
  };

  /**
   * @param simpleNode components root element
   * @param amxNode AmxNode that represents this component
   * 
   * @returns the component's height
   *
   * @author Tomas 'Jerry' Samek
   */
  BaseComponentRenderer.prototype.GetComponentHeight = function (simpleNode, amxNode)
  {
    // ask component if it can use the complex calculation of the height
    if (this.IsSmartLayoutCapable(simpleNode, amxNode))
    {
      return this._getAugmentedHeight(simpleNode, amxNode);
    }
    // use standard height detection from simple dom node
    var height = DOMUtils.getHeight(simpleNode);
    if (height <= 1)
    {
      // height not set or too small, try using parent height instead
      height = DOMUtils.getHeight(simpleNode.parentNode);
    }
    return Math.floor(height);
  };

  /**
   * @param simpleNode components root element
   * @param amxNode AmxNode that represents this component
   * 
   * @returns the component's height based on the parent size without sizes
   *  of the fixed sized elements
   *
   * @author Tomas 'Jerry' Samek
   */
  BaseComponentRenderer.prototype._getAugmentedHeight = function (simpleNode, amxNode)
  {
    // height set in fixed units for example px
    var height =  + simpleNode.getAttribute('_userheight');
    if (!height)
    {
      height = 0;
    }

    if (height < 1 && simpleNode.parentNode)
    {
      // height not set or too small, try using parent height instead
      var parentHeight = DOMUtils.getHeight(simpleNode.parentNode);
      var nodePercentage =  + simpleNode.getAttribute('_relativeheight');
      var totalPercentage = nodePercentage;

      var sibblingsAndMe = simpleNode.parentNode.childNodes;
      var myId = simpleNode['id'];
      // subtracts all siblings with fixed width and tries to determine weight of
      // current component by its percentage height
      for (var i = 0; i < sibblingsAndMe.length; i++)
      {
        if (myId !== sibblingsAndMe[i]['id'])
        {
          // relative height in scope of all other components
          var sibblingRelHeight = sibblingsAndMe[i].getAttribute('_relativeheight');
          var sibblingUserHeight =  + sibblingsAndMe[i].getAttribute('_userheight');
          var sibHeight = DOMUtils.getHeight(sibblingsAndMe[i]);
          if ((sibHeight <= 1 || sibblingRelHeight) && !sibblingUserHeight)
          {
            var sibblingNodePercentage =  + sibblingRelHeight;
            if (!sibblingNodePercentage || sibblingNodePercentage <= 0)
            {
              sibblingNodePercentage =  + DOMUtils.parseStyleSize(sibblingsAndMe[i].style.height, true);
            }
            // add relative height of sibbling to total relative height
            totalPercentage = totalPercentage + sibblingNodePercentage;
            parentHeight = parentHeight + sibHeight;
          }
          // substract sibblings height and also its padding, border and margin
          if (sibblingUserHeight)
          {
            sibblingUserHeight =  + sibblingUserHeight;
            parentHeight = parentHeight - sibblingUserHeight;
          }
          else 
          {
            parentHeight = parentHeight - DOMUtils.getOuterHeight(sibblingsAndMe[i]);
          }
        }
      }
      // height is portion of the available parent height without fixed height components divided by weight
      // of this component in scope of all present components with relative height.
      height = parentHeight * (nodePercentage / Math.max(totalPercentage, 100));
    }

    return Math.floor(height);
  };

  /**
   * removes calculated values from component's dom node
   */
  BaseComponentRenderer.prototype.ResetComponentDimensions = function (simpleNode, amxNode)
  {
    // reset all computed values at first
    this._setComputedHeight(amxNode, null);
    this._setComputedWidth(amxNode, null);
    // restore original value of the width in case that
    // the width has been forced because of the zero parent
    // width
    var forcedWidth = amxNode.getAttribute('_forcedWidth');
    if (forcedWidth !== null)
    {
      simpleNode.style.width = forcedWidth;
      amxNode.setAttributeResolvedValue('_forcedWidth', null);
    }

    var forcedHeight = amxNode.getAttribute('_forcedHeight');
    // in case of the smart layout the height is forced to the dom in all cases 
    // and for proper calculation from the parent node we have to set it to 0px
    if (this.IsSmartLayoutCapable(simpleNode, amxNode))
    {
      DOMUtils.setHeight(simpleNode, '0px');
    }
    // restore original value of the height in case that
    // the height has been forced because of the zero parent
    // height - this has not colide with the smart layout behavior
    else if (forcedHeight !== null)
    {
      simpleNode.style.height = forcedHeight;
      amxNode.setAttributeResolvedValue('_forcedHeight', null);
    }
  };

  BaseComponentRenderer.prototype.GetPreferredSize = function (simpleNode, amxNode, width, height)
  {
    return null;
  };

  /**
   * sets newly calculated dimensions to the dom node
   */
  BaseComponentRenderer.prototype.GetComponentDimensions = function (simpleNode, amxNode)
  { 
    // try to get computed width first to prevent
    // dom operations
    var width = this._getComputedWidth(amxNode);
    var height = this._getComputedHeight(amxNode);

    var computed = true;
    if (!width)
    {
      // obtain width from the root simpleNode that nests the component
      // itself
      width = this.GetComponentWidth(simpleNode, amxNode);
      computed = false;
    }
    // try to get computed height first to prevent
    // dom operations
    if (!height)
    {
      // obtain height from the root simpleNode that nests the component
      // itself
      height = this.GetComponentHeight(simpleNode, amxNode);
      computed = false;
    }
    // in case that the fresh new dimensions are calculated 
    // process them and adjust node if needed
    if (!computed)
    {
      var forcedWidth = false;
      var forcedHeight = false;
      // in case that the component supports preferred size try
      // to calculate
      var ps = this.GetPreferredSize(simpleNode, amxNode, width, height);
      if (ps)
      {
        if (ps['w'])
        {
          forcedWidth = true;
          width = ps['w'];
        }

        if (ps['h'])
        {
          forcedHeight = true;
          height = ps['h'];
        }
      }
      // in case that the dom element has near to zero value set the default value
      // we are trying to detect that the parent is zero size container and require child 
      // to define its dimensions
      if (width <= 1)
      {
        width = BaseComponentRenderer.DEFAULT_WIDTH;
      }
      // same as the comment for width above
      if (height < 1)
      {
        height = BaseComponentRenderer.DEFAULT_HEIGHT;
      }
      // in some cases when parent has 0-1px size we need to stretch this div to ensure default component width
      // also set forced width in case that the component has preferred size and this size is applied
      if (forcedWidth || DOMUtils.getWidth(simpleNode) < width)
      {
        amxNode.setAttributeResolvedValue('_forcedWidth', simpleNode.style.width);
        DOMUtils.setWidth(simpleNode, width + 'px');
      }
      // store the node's width
      this._setComputedWidth(amxNode, width);
      // adjust and store the node's height
      this._setComputedHeight(amxNode, height);
      // in case that component is using smart layout set fixed height
      // in every case
      if (this.IsSmartLayoutCapable(simpleNode, amxNode))
      {
        DOMUtils.setHeight(simpleNode, height + 'px');
      }
      // in some cases when parent has 0-1px size we need to stretch this div to ensure default component height
      // also set forced height in case that the component has preferred size and this size is applied
      // this has to not colide with the smart layout behavior
      else if (forcedHeight || DOMUtils.getHeight(simpleNode) < height)
      {
        amxNode.setAttributeResolvedValue('_forcedHeight', simpleNode.style.height);
        DOMUtils.setHeight(simpleNode, height + 'px');
      }
    }
    // calculate width and height of the rendered component inside of the node
    this._adjustStageParameters(this.GetStageId(amxNode), width, height);

    return { 'w' : width, 'h' : height };
  };

  /**
   * checks if the node passed as the first parameter is the ancestor of the
   * node
   *
   * @param ancestorNode  the presumed ancestorNode
   * @param node  a presumed descendant of the ancestorNode
   * @return 'true' if node is a descendant of the ancestorNode
   *
   */
  BaseComponentRenderer.prototype.IsAncestor = function (ancestorNode, node)
  {
    var parentNode = node.parentNode;

    while (parentNode)
    {
      if (parentNode === ancestorNode)
        return true;

      parentNode = parentNode.parentNode;
    }
    return false;
  };

  /**
   * Initialize all dvtm components.
   *
   * @param simpleNode root dom node of this component
   * @param amxNode amxNode of this component
   *
   * @author Tomas 'Jerry' Samek
   */
  BaseComponentRenderer.prototype.InitComponent = function (simpleNode, amxNode)
  {
    // install filsters preventing touch event propagation
    // in case that component should consume it
    this._installEventFilters(simpleNode, amxNode);
    // get user defined dimensions
    var userHeight = DOMUtils.parseStyleSize(simpleNode.style.height);
    var userWidth = DOMUtils.parseStyleSize(simpleNode.style.width);
    // in case of the smart layout save original width and height to the 
    // extra attributes
    if (this.IsSmartLayoutCapable(simpleNode, amxNode))
    {
      // determine if height of this component if fixed or relative
      // we don't have to care about width since it's computed by webview itself properly
      if (userHeight > 0)
      {
        simpleNode.setAttribute('_userheight', userHeight);
      }
      else 
      {
        var nodePercentage = DOMUtils.parseStyleSize(simpleNode.style.height, true);
        simpleNode.setAttribute('_relativeheight', nodePercentage);
      }
    }
    // prepare the initial dimensions for the component
    this.ResetComponentDimensions(simpleNode, amxNode);
    // register the resize handler in case we need to resize the chart later
    // listener should be registered only when at least one dimension is relative
    if (userWidth == 0 || userHeight == 0)
    {
      this.InitResizeHandler(simpleNode, amxNode);
    }
  };

  BaseComponentRenderer.prototype._stopPropagationHandler = function (event)
  {
    event.stopPropagation();
  };

  BaseComponentRenderer.prototype._installEventFilters = function(node, amxNode)
  {
    if (this.PreventsSwipe(amxNode))
    {
      node.addEventListener('mousedown', this._stopPropagationHandler, false);
      node.addEventListener('touchstart', this._stopPropagationHandler, false);
    }
    else 
    {
      node.removeEventListener('mousedown', this._stopPropagationHandler);
      node.removeEventListener('touchstart', this._stopPropagationHandler);
    }
  };

  BaseComponentRenderer.prototype.GetParentResizeCallback = function ()
  {
    if (!this._parentResizeCallback)
    {
      this._parentResizeCallback = function (event)
      {
        var self = event.data['self'];
        var amxNode = event.data['amxNode'];
        var simpleNode = document.getElementById(amxNode.getId());
        var renderCallback = self.GetRenderCallback(amxNode);

        if (!simpleNode || !self.GetComponentInstance(null, amxNode))
        {
          // simpleNode is not in DOM, do not render
          return;
        }

        self.ResetComponentDimensions(simpleNode, amxNode);

        adf.mf.log.Framework.logp(adf.mf.log.level.INFO, self.getTypeName(), "InitComponent.resize", "Re-rendering component due to a node resize event.");

        var dimensions = self.GetComponentDimensions(simpleNode, amxNode);
        // call render callback to rerender component
        renderCallback.call(self, self.GetComponentInstance(simpleNode, amxNode), dimensions['w'], dimensions['h'], amxNode, self.GetStageId(amxNode));
      };
    }
    return this._parentResizeCallback;
  };

  BaseComponentRenderer.prototype.InitResizeHandler = function (simpleNode, amxNode)
  {
    var resizeData = 
    {
      'amxNode' : amxNode, 'self' : this
    };
    // resize called by parent containers
    adf.mf.api.amx.addBubbleEventListener(simpleNode, "resize", this.GetParentResizeCallback(), resizeData);

    var resizeHandler = adf.mf.internal.dvt.util.ResizeHandler.getInstance();
    // add resize callbacks
    resizeHandler.addResizeCallback(amxNode.getId(), this.GetResizeCallback(), this.GetPostResizeCallback(), resizeData);
  };

  BaseComponentRenderer.prototype.GetRenderCallback = function (amxNode)
  {
    return this.RenderComponent;
  };

  BaseComponentRenderer.prototype.GetResizeCallback = function ()
  {
    if (!this._windowResizeCallback)
    {
      this._windowResizeCallback = function (event)
      {
        var activeInstance = event.data['self'];
        var amxNode = event.data['amxNode'];
        var simpleNode = document.getElementById(amxNode.getId());
        // store old dimensions
        var oldHeight = activeInstance._getComputedHeight(amxNode);
        var oldWidth = activeInstance._getComputedWidth(amxNode);
        // reset all computed value at first
        activeInstance.ResetComponentDimensions(simpleNode, amxNode);
        // return old values as a context
        return {'oldwidth' : oldWidth, 'oldheight' : oldHeight};
      };
    }
    return this._windowResizeCallback;
  };

  BaseComponentRenderer.prototype.GetPostResizeCallback = function ()
  {
    if (!this._windowPostResizeCallback)
    {
      this._windowPostResizeCallback = function (event, context)
      {
        var activeInstance = event.data['self'];
        var amxNode = event.data['amxNode'];
        var simpleNode = document.getElementById(amxNode.getId());

        if (!simpleNode)
        {
          // simpleNode is not in DOM, do not render
          return;
        }
        var renderCallback = activeInstance.GetRenderCallback(amxNode);
        var stageId = activeInstance.GetStageId(amxNode);
        // if dimensions are different then rerender component
        var dimensions = activeInstance.GetComponentDimensions(simpleNode, amxNode);
        if (dimensions['h'] != context['oldheight'] || dimensions['w'] != context['oldwidth'])
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.INFO, activeInstance.getTypeName(), "InitComponent.postResizeCallback", "Re-rendering component due to a window resize event.");
          // call render callback to rerender component
          renderCallback.call(activeInstance, activeInstance.GetComponentInstance(simpleNode, amxNode), dimensions['w'], dimensions['h'], amxNode, stageId);
        }
      };
    }
    return this._windowPostResizeCallback;
  };

  /**
   * Function renders component.
   * @private
   */
  BaseComponentRenderer.prototype._renderComponent = function (simpleNode, amxNode)
  {
    try 
    {
      // get fresh new dom node
      simpleNode = document.getElementById(amxNode.getId());
      if (!simpleNode)
      {
        // simpleNode is not in DOM, do not render
        return;
      }
      // obtain component instance
      var componentInstance = this.GetComponentInstance(simpleNode, amxNode);
      // process style classes and set style related options
      this.ProcessStyleClasses(simpleNode, amxNode);
      // get components dimensions
      var dimensions = this.GetComponentDimensions(simpleNode, amxNode);
      // render the component itself
      this.RenderComponent(componentInstance, dimensions['w'], dimensions['h'], amxNode);
      // component instance rendered, reset the dirty flag
      this.SetOptionsDirty(amxNode, false);
    }
    catch (ex)
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, this.getTypeName(), "_renderComponent", "Exception: " + ex.message + " (line: " + ex.line + ")");
      adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, this.getTypeName(), "_renderComponent", "Stack: " + ex.stack);
      // remove the rendered content, if it exists, it's broken anyway
      var stageId = this.GetStageId(amxNode);
      var stage = document.getElementById(stageId);
      if (stage)
      {
        simpleNode.removeChild(stage);
      }
    }
  };

  /**
   * @return unique id of the element which is used for rendering
   */
  BaseComponentRenderer.prototype.GetStageId = function (amxNode)
  {
    var id = this.GetComponentId(amxNode);
    if (!id)
    {
      id = amxNode.getTag().getName();
    }

    id = id + '_svg';

    return id;
  };

  /**
   * @param node root node of the component
   * @param stageId unique id of element where the rendering is performed
   * @param width width of the component
   * @param height height of the component
   * @return DvtToolkitContext
   */
  BaseComponentRenderer.prototype.CreateRenderingContext = function (root, stageId)
  {
    var stage = document.getElementById(stageId);
    if (stage)
    {
      root.removeChild(stage);
    }
    var context = new DvtContext(root, root.id);

    return context;
  };

  BaseComponentRenderer.prototype._adjustStageParameters = function (stage, width, height)
  {
    if (typeof stage === 'string')
    {
      stage = document.getElementById(stage);
    }

    if (stage instanceof SVGSVGElement)
    {
      var stageDim = this.AdjustStageDimensions(
      {
        'width' : width, 'height' : height
      });
      stage.setAttribute('viewBox', "0 0 " + stageDim['width'] + " " + stageDim['height']);
      stage.setAttribute('preserveAspectRatio', "none");
    }
  };

  BaseComponentRenderer.prototype.AdjustStageDimensions = function (dim)
  {
    return dim;
  };

  /**
   * @return callback object for the toolkit component which handles value change, selection and other types
   * of events.
   */
  BaseComponentRenderer.prototype.CreateComponentCallback = function (amxNode)
  {
    return null;
  };

  BaseComponentRenderer.prototype.CreateComponentInstance = function (simpleNode, amxNode)
  {
    var stageId = this.GetStageId(amxNode);
    var context = this.CreateRenderingContext(simpleNode, stageId);
    var callbackObj = this.CreateComponentCallback(amxNode);
    if (!callbackObj)
    {
      callbackObj = null;
    }
    var callback = (callbackObj === null) ? null : callbackObj['callback'];

    var instance = this.CreateToolkitComponentInstance(context, stageId, callbackObj, callback, amxNode);
    if (context)
    {
      context.getStage().addChild(instance);
    }
    return instance;
  };

  /**
   * @return instance for the toolkit component
   */
  BaseComponentRenderer.prototype.GetComponentInstance = function (simpleNode, amxNode)
  {
    var componentInstance = amxNode.getAttribute(COMPONENT_INSTANCE);
    if (!componentInstance && simpleNode)
    {
      componentInstance = this.CreateComponentInstance(simpleNode, amxNode);
      amxNode.setAttributeResolvedValue(COMPONENT_INSTANCE, componentInstance);
    }
    return componentInstance;
  };

  /**
   * @param context DvtToolkitContext
   * @param stageId unique id of element where the rendering is performed
   * @param callbackObj object which wraps callback function
   * @param callback function which handles value changes and other type of events
   * @amxNode amxNode of this component
   * @return initiliazed instance of the toolkit representation of thie component which will be used to render this component.
   */
  BaseComponentRenderer.prototype.CreateToolkitComponentInstance = function (context, stageId, callbackObj, callback, amxNode)
  {
    return null;
  };

  /**
   * Function should invoke render function on the toolkit representation of the component
   *
   * @param instance component instance created in function CreateToolkitComponentInstance
   * @param width width of the component
   * @param height height of the component
   * @param amxNode amxNode of this component
   */
  BaseComponentRenderer.prototype.RenderComponent = function (instance, width, height, amxNode)
  {};

  /**
   * unregister all DOM node's listeners
   */
  BaseComponentRenderer.prototype.DestroyComponent = function (simpleNode, amxNode)
  {
    var resizeHandler = adf.mf.internal.dvt.util.ResizeHandler.getInstance();
    resizeHandler.removeResizeCallback(amxNode.getId());

    adf.mf.api.amx.removeBubbleEventListener(simpleNode, 'resize', this._parentResizeHandler);

    amxNode.setAttributeResolvedValue(COMPONENT_INSTANCE, null);
  };

  /**
   * sets legend style properties based on CSS
   */
  BaseComponentRenderer.prototype.ProcessStyleClasses = function (node, amxNode)
  {
    var styleClassMap = this.GetStyleClassesDefinition();

    if (styleClassMap[adf.mf.internal.dvt.ROOT_NODE_STYLE] !== undefined)
    {
      this._processStyleClass(amxNode, node, styleClassMap[adf.mf.internal.dvt.ROOT_NODE_STYLE]);
    }

    var child = node.firstElementChild;

    while (child)
    {
      var classList = child.classList;
      if (classList)
      {
        for (var i = 0, length = classList.length;i < length;i++)
        {
          var className = classList[i];
          if (className)
          {
            var classDefinition = styleClassMap[className];
            if (classDefinition)
            {
              this._processStyleClass(amxNode, child, classDefinition);
            }
          }
        }
      }
      child = child.nextElementSibling;
    }
  };

  BaseComponentRenderer.prototype.IsSkyros = function ()
  {
    var resources = adf.mf.environment.profile.cssResources;
    for (var i = 0;i < resources.length;i++)
    {
      if (resources[i].indexOf("Fusion") > 0)
        return true;
    }
    return false;
  };

  BaseComponentRenderer.prototype.IsAlta = function ()
  {
    if (this.IsSkyros())
    {
      return false;
    }

    var resources = adf.mf.environment.profile.cssResources;
    for (var i = 0;i < resources.length;i++)
    {
      if (resources[i].indexOf("mobileAlta") > 0)
      {
        if (resources[i].indexOf('-1.3') > 0 ||   
            resources[i].indexOf('-1.2') > 0 ||   
            resources[i].indexOf('-1.1') > 0 ||   
            resources[i].indexOf('-1.0') > 0)
        {
          return true;
        }    
      }
    }

    return false;
  };

  BaseComponentRenderer.prototype.IsNextSkin = function ()
  {
    return !this.IsSkyros() && !this.IsAlta();
  };

  /**
   * Determines if the component should prevent propagation of swipe/drag gestures.
   * Components that handle swipe/drag internally should not propagate events further
   * to their containers to avoid gesture conflicts. By default, all DVT components
   * propagation of swipe/drag start events. The type handler should override this method
   * when the component is mostly static and should propagate drag/swipe gestures to its
   * container.
   */
  BaseComponentRenderer.prototype.PreventsSwipe = function (amxNode)
  {
    return true;
  };

  BaseComponentRenderer.prototype._getComputedHeight = function (amxNode)
  {
    return amxNode.getAttribute('_computedheight');
  };

  BaseComponentRenderer.prototype._getComputedWidth = function (amxNode)
  {
    return amxNode.getAttribute('_computedwidth');
  };

  BaseComponentRenderer.prototype._setComputedHeight = function (amxNode, value)
  {
    amxNode.setAttributeResolvedValue('_computedheight', value);
  };

  BaseComponentRenderer.prototype._setComputedWidth = function (amxNode, value)
  {
    amxNode.setAttributeResolvedValue('_computedwidth', value);
  };

  BaseComponentRenderer.prototype._processStyleClass = function (amxNode, node, definition)
  {
    if (definition instanceof Array)
    {
      for (var i = 0;i < definition.length;i++)
      {
        this._resolveStyle(amxNode, node, definition[i]);
      }
    }
    else 
    {
      this._resolveStyle(amxNode, node, definition);
    }
  };

  BaseComponentRenderer.prototype._resolveStyle = function (amxNode, node, definition)
  {
    var path = new JSONPath(this.GetDataObject(amxNode), definition['path']);
    var value = undefined;
    var part = null;

    if (definition['type'])
    {
      if (definition['type'] instanceof Array)
      {
        for (var i = 0;i < definition['type'].length;i++)
        {
          part = definition['type'][i](node, path.getValue());
          if (part)
          {
            if (!value)
              value = '';
            value += part;
          }
        }
      }
      else 
      {
        value = definition['type'](node, path.getValue());
      }
    }

    if (value !== undefined && (definition['overwrite'] !== false || path.getValue() === undefined) && !(definition['ignoreEmpty'] === true && (value == null || (typeof value == 'string' && value.replace(/^\s+/g, '') == ''))))
    {
      if (path.setValue(value))
      {
        this.SetOptionsDirty(amxNode, true);
      }
    }
  };

  BaseComponentRenderer.prototype._isReadyToRender = function (amxNode)
  {
    if (amxNode.getAttribute("_rbLoaded") === "loading")
    {
      return false;
    }
    if (amxNode.getAttribute('_readyToRender'))
    {
      return true;
    }

    return false;
  };

  BaseComponentRenderer.prototype._setReadyToRender = function (amxNode, value)
  {
    amxNode.setAttributeResolvedValue('_readyToRender', value ? true : false);
  };

  BaseComponentRenderer.prototype.isNodeReadyToRender = function (amxNode)
  {
    return ((amxNode.isReadyToRender && amxNode.isReadyToRender()) || (amxNode.getState() == adf.mf.api.amx.AmxNodeStates["UNRENDERED"]));
  };

  BaseComponentRenderer.prototype.GetResourceBundles = function ()
  {
    return [adf.mf.internal.dvt.util.ResourceBundle.createLocalizationBundle('DvtUtilBundle')];
  };
  
  BaseComponentRenderer.prototype.IsRTL = function()
  {
    return document.documentElement.dir == "rtl";
  };

  BaseComponentRenderer.prototype._loadResourceBundles = function (amxNode)
  {
    var resourceLoader, bundles;
    if (this._loaded === true)
    {
      amxNode.setAttributeResolvedValue("_rbLoaded", "ok");
      return;
    }

    if (!adf.mf.environment.profile.dtMode && typeof DvtBundle !== "undefined")
    {
      if (this._loading)
      {
        this._loading.push(amxNode);
        amxNode.setAttributeResolvedValue("_rbLoaded", "loading");
        return;
      }
      else
      {
        this._loading = [amxNode];
        amxNode.setAttributeResolvedValue("_rbLoaded", "loading");
      }

      bundles = this.GetResourceBundles();

      if (bundles && bundles.length > 0)
      {
        resourceLoader = adf.mf.internal.dvt.util.ResourceBundleLoader.getInstance();
        var that = this;
        resourceLoader.loadBundles(bundles, function()
        {
          that._loaded = true;
          if (that._loading)
          {
            var args = new adf.mf.api.amx.AmxNodeUpdateArguments();

            that._loading.forEach(function(n)
            {
              n.setAttributeResolvedValue("_rbLoaded", "ok");
              args.setAffectedAttribute(n, "_rbLoaded");
            });

            delete that._loading;
            adf.mf.api.amx.markNodeForUpdate(args);
          }
        });
      }
    }
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    DataStampRenderer.js
 */
(function ()
{
  /**
   * This renderer provides support for processing of the facets which depends on value attribute.
   */
  var DataStampRenderer = function ()
  {};

  adf.mf.internal.dvt.DvtmObject.createSubclass(DataStampRenderer, 'adf.mf.internal.dvt.BaseComponentRenderer', 'adf.mf.internal.dvt.DataStampRenderer');

  /**
   * Creates chart's children AMX nodes
   */
  DataStampRenderer.prototype.createChildrenNodes = function (amxNode)
  {
    if (!adf.mf.environment.profile.dtMode)
    {
      // verify that the value el is available and resolved
      // has to be done before basic non stamped children to avoid
      // duplicities
      var action = this.GetElValueNotReadyAction(amxNode);
      if (action !== null)
      {
        return action;
      }
    }
    // create basic amx child nodes (e.g. legend)
    action = this.CreateSimpleChildrenNodes(amxNode);
    if (action !== null)
    {
      return action;
    }
    // in case of DT stop processing here
    // value is not available in this case so skip
    // creation of the stamped children
    if (adf.mf.environment.profile.dtMode)
    {
      // design time so process only simple nodes and not stamped nodes
      amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);

      return adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["HANDLED"];
    }
    // create nodes that should be stamped
    action = this.CreateStampedChildrenNodes(amxNode);
    if (action !== null)
    {
      return action;
    }
    // ready to render without need of any data loading
    amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
    amxNode.setAttributeResolvedValue("_placeholder", "nomore");

    return adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["HANDLED"];
  }

  DataStampRenderer.prototype._getSimpleFacets = function()
  {
    var facets = this.GetFacetNames ? this.GetFacetNames() : [null];
    var stampedFacets = this.GetStampedFacetNames();
    // find facets that are not stamped and doesn't depend on the value
    var simpleFacets = facets.slice(0);
    if (stampedFacets)
    {
      simpleFacets = this.filterArray(simpleFacets, function(name)
      {
        return stampedFacets.indexOf(name) === -1;
      });
    }

    return simpleFacets;
  }

  DataStampRenderer.prototype.CreateSimpleChildrenNodes = function (amxNode)
  {
    // use default amx method to create faceted children
    amxNode.createStampedChildren(null, this._getSimpleFacets());
    return null;
  }

  DataStampRenderer.prototype.CreateStampedChildrenNodes = function (amxNode)
  {
    if (amxNode.isAttributeDefined('value'))
    {
      var dataItems = amxNode.getAttribute('value');
      // el is resolved to null so return and render no data message
      if (!dataItems)
      {
        return null;
      }

      var iter = adf.mf.api.amx.createIterator(dataItems);
      // in case of the collection model it si possible that some of the data providers are not loaded
      // in that case fetch new data and return that the component can render with waiting placeholder
      // instead of the chart
      if (iter.getTotalCount() > iter.getAvailableCount())
      {
        this.FetchDataItems(amxNode, dataItems);

        amxNode.setAttributeResolvedValue("_placeholder", "yes");
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);

        return adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["HANDLED"];
      }
      // create stamped children since collection model has all the data providers loaded
      while (iter.hasNext())
      {
        iter.next();
        amxNode.createStampedChildren(iter.getRowKey(), this.GetStampedFacetNames());
      }
      // remove placeholder if it is in place
      if ("yes" == amxNode.getAttribute("_placeholder"))
      {
        amxNode.setAttributeResolvedValue("_placeholder", "nomore");
      }
    }
    else
    {
      // value is not defined so process stamped facets without rowKey
      amxNode.createStampedChildren(null, this.GetStampedFacetNames());
    }
    return null;
  }

  DataStampRenderer.prototype.FetchDataItems = function (amxNode, dataItems, collectionChange)
  {
    if (!DataStampRenderer._fetchCache)
    {
      DataStampRenderer._fetchCache = {};
    }
    var expression = amxNode.getAttributeExpression('value');
    var skip = true;
    if (!DataStampRenderer._fetchCache[expression])
    {
      skip = false;
      DataStampRenderer._fetchCache[expression] = new adf.mf.api.amx.AmxNodeUpdateArguments();
    }

    DataStampRenderer._fetchCache[expression].setAffectedAttribute(amxNode, "value");
    if (collectionChange)
    {
      DataStampRenderer._fetchCache[expression].setCollectionChanges(amxNode.getId(), "value", collectionChange);
    }
    if (skip)
    {
      return;
    }
    // fetch children out of the current stack
    window.setTimeout(
      function(items, el, renderer)
      {
        // try to load all dataproviders at oce
        adf.mf.api.amx.bulkLoadProviders(items, 0,  - 1,
          function (req, resp)
          {

            if (renderer._fetchCache && renderer._fetchCache[el])
            {
              var args = renderer._fetchCache[el];
              renderer._fetchCache[el] = null;
              adf.mf.api.amx.markNodeForUpdate(args);
            }
          },
          function (req, resp)
          {
            adf.mf.api.adf.logInfoResource("AMXInfoMessageBundle", adf.mf.log.level.SEVERE, "createChildrenNodes", "MSG_ITERATOR_FIRST_NEXT_ERROR", req, resp);
            //adf.mf.api.amx.hideLoadingIndicator();
          });
      },
    1, dataItems, expression, DataStampRenderer);

    dataItems = null;
    amxNode = null;
    expression = null;
  }

  DataStampRenderer.prototype.GetElValueNotReadyAction = function (amxNode)
  {
    if (amxNode.isAttributeDefined('value') && amxNode.getAttribute('value') === undefined)
    {
      // Mark it so the framework knows that the children nodes cannot be
      // created until the collection model has been loaded
      amxNode.setAttributeResolvedValue("_placeholder", "yes");
      amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);

      return adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["DEFERRED"];
    }

    return null;
  }

  DataStampRenderer.prototype.render = function (amxNode, id)
  {
    var rootElement = DataStampRenderer.superclass.render.call(this, amxNode, id);

    if ("yes" == amxNode.getAttribute("_placeholder"))
    {
      var placeholder = document.createElement("div");
      placeholder.id = id + "_placeholder";
      placeholder.className = "dvtm-component-placeholder amx-deferred-loading";
      var msgLoading = adf.mf.resource.getInfoString("AMXInfoBundle", "MSG_LOADING");
      placeholder.setAttribute("aria-label", msgLoading);
      rootElement.appendChild(placeholder);

      amxNode.setState(adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"]);
    }

    return rootElement;
  }

  DataStampRenderer.prototype.postDisplay = function (rootElement, amxNode)
  {
    if ("yes" == amxNode.getAttribute("_placeholder"))
    {

      if (this.IsAncestor(document.body, rootElement))
      {
        this.GetComponentDimensions(rootElement, amxNode);
      }
      return; // this function is not applicable for placeholders
    }

    if ("nomore" == amxNode.getAttribute("_placeholder"))
    {
      amxNode.setAttributeResolvedValue("_placeholder", null); // now null for real

      if (amxNode.getState() == adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"])
      {
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["RENDERED"]);
      }
      var placeholder = document.getElementById(amxNode.getId() + "_placeholder");
      if (placeholder)
      {
        placeholder.parentNode.removeChild(placeholder);
      }
    }
    DataStampRenderer.superclass.postDisplay.call(this, rootElement, amxNode);
  }

  DataStampRenderer.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    if ("yes" == amxNode.getAttribute("_placeholder"))
      return; // this function is not applicable for placeholders

    if ("nomore" == amxNode.getAttribute("_placeholder"))
    {
      amxNode.setAttributeResolvedValue("_placeholder", null);

      if (amxNode.getState() == adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"])
      {
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["RENDERED"]);
      }
      var placeholder = document.getElementById(amxNode.getId() + "_placeholder");
      if (placeholder)
      {
        placeholder.parentNode.removeChild(placeholder);
      }
    }
    /* BUG 17458279: Check if we have some descendent changes available. If so, then use them and drop them. */
    if ((descendentChanges === undefined) && (amxNode["_pendingDescendentChanges"] !== undefined))
    {
      descendentChanges = amxNode["_pendingDescendentChanges"];
    }
    delete amxNode["_pendingDescendentChanges"];
    // recover all the information about attribute changes before bulkLoadProvider
    if (amxNode["_pendingAttributeChanges"])
    {
      attributeChanges = amxNode["_pendingAttributeChanges"];
      delete amxNode["_pendingAttributeChanges"];
    }

    DataStampRenderer.superclass.refresh.call(this, amxNode, attributeChanges, descendentChanges);
  }

  DataStampRenderer.prototype._partialVisitChildren = function (amxNode, visitContext, callback)
  {
    // find all visitable nodes and visit only them
    var nodesToWalk = visitContext.getChildrenToWalk(amxNode);
    if (nodesToWalk.length === 0)
    {
      return false;
    }

    var varName = null;
    var iter = undefined;

    for (var i = 0; i < nodesToWalk.length; i++)
    {
      // create iterator instance only in case that the node has
      // a stamp key set on it
      var variableSet = false;
      if (iter !== null && nodesToWalk[i].getStampKey() !== null)
      {
    	if (iter === undefined)
    	{
    	  var dataItems = amxNode.getAttribute('value');
    	  if (dataItems)
    	  {
            // find data collection and variable name
    	    iter = adf.mf.api.amx.createIterator(amxNode.getAttribute('value'));
    	    varName = amxNode.getAttribute('var');
    	  }
    	  else
    	  {
            iter = null;
    	  }
    	}

    	if (iter)
    	{
    	  // set context variable related to the node being visited
          iter.setCurrentRowKey(nodesToWalk[i].getStampKey());
          adf.mf.el.addVariable(varName, getCurrent(iter));

          variableSet = true;
    	}
      }
      // visit the node
      if (nodesToWalk[i].visit(visitContext, callback))
      {
    	if (variableSet)
    	{
    	  adf.mf.el.removeVariable(varName);
    	}
        return true;
      }
      if (variableSet)
      {
        adf.mf.el.removeVariable(varName);
      }
    }

    return false;
  }

  // XXX[Jerry] Hack that retrieves TreeNode object from
  // the iterator instead of the simple json as the current
  // implementation of the getCurrent does.
  // ------------------------------------------------------
  // issue is tracked in the bug 19561544
  var getCurrent = function(iter)
  {
    if (!iter.isTreeNodeIterator())
      return iter.getCurrent();

    var dataItems = iter._items;
    return dataItems.localFetch(dataItems.index);
  }

  DataStampRenderer.prototype._fullVisitChildren = function (amxNode, visitContext, callback)
  {
    // visit all faceted children which are independent on the value attribue
    amxNode.visitStampedChildren(null, this._getSimpleFacets(), null, visitContext, callback);

    var facets = this.GetStampedFacetNames();
    // visit all faceted children that relies on the value attribute in
    // case that this attribue is not defined - use without any rowKey
    if (!amxNode.isAttributeDefined('value'))
    {
      return amxNode.visitStampedChildren(null, facets ? facets : [null], null, visitContext, callback);
    }

    var dataItems = amxNode.getAttribute('value');
    if (dataItems)
    {
      var varName = amxNode.getAttribute('var');
      var iter = adf.mf.api.amx.createIterator(dataItems);
      // go through whole collection and visit chidren one by one
      while (iter.hasNext())
      {
        adf.mf.el.addVariable(varName, iter.next());

        if (amxNode.visitStampedChildren(iter.getRowKey(), facets ? facets : [null], null, visitContext, callback))
        {
          adf.mf.el.removeVariable(varName);
          return true;
        }
        adf.mf.el.removeVariable(varName);
      }
    }

    return false;
  }

  /**
   * Visits chart's children nodes
   */
  DataStampRenderer.prototype.visitChildren = function (amxNode, visitContext, callback)
  {
    if (visitContext.isVisitAll())
    {
      return this._fullVisitChildren(amxNode, visitContext, callback);
    }
    else
    {
      return this._partialVisitChildren(amxNode, visitContext, callback);
    }
  }

  /**
   * @param collectionChange {adf.mf.api.amx.AmxCollectionChange}
   * @return {boolean} true when collection change contains informations about individual changes
   */
  var isItemizedChange = function (collectionChange)
  {
    if (collectionChange != null && collectionChange.isItemized())
    {
      return true;
    }

    return false;
  }
  /**
   * Updates chart's children nodes
   */
  DataStampRenderer.prototype.updateChildren = function (amxNode, attributeChanges)
  {
    // nothing to do if there are no attribue changes
    if (!attributeChanges || attributeChanges.getSize() === 0)
    {
      return adf.mf.api.amx.AmxNodeChangeResult['NONE'];
    }
    // if inlineStyle has changed we need to recreate chart instance
    if (attributeChanges.hasChanged('inlineStyle'))
    {
      return adf.mf.api.amx.AmxNodeChangeResult['REPLACE'];
    }
    // if 'value' changed, need to rebuild the nodes hierarchy
    if (attributeChanges.hasChanged('value'))
    {
      var dataItems = amxNode.getAttribute('value');

      if (dataItems === undefined || dataItems === null)
      {
        return adf.mf.api.amx.AmxNodeChangeResult['REPLACE'];
      }
      var oldValue = attributeChanges.getOldValue("value");
      var collectionChange = attributeChanges.getCollectionChange("value");

      // Do not handle the collection change if only the hasMoreKeys flag is
      // changing
      if (collectionChange != null && collectionChange.hasMoreKeysChanged() &&
        collectionChange.getCreatedKeys().length == 0 &&
        collectionChange.getUpdatedKeys().length == 0 &&
        collectionChange.getDeletedKeys().length == 0 &&
        collectionChange.getDirtiedKeys().length == 0)
      {
        return adf.mf.api.amx.AmxNodeChangeResult['NONE'];
      }

      var iter = adf.mf.api.amx.createIterator(dataItems);
      // process changes from the data change event before loading the data
      // to avoid problems with slow down data provider
      if (amxNode.getAttribute('_waitForData') !== true)
      {
        // verify that we can update the individual items
        if (oldValue && isItemizedChange(collectionChange))
        {
          this._itemizedUpdate(amxNode, collectionChange, this.GetStampedFacetNames());
        }
        else
        {
          this._nonItemizedUpdate(amxNode, this.GetStampedFacetNames(), dataItems, oldValue);
        }
      }
      // loading of rows not available in the cache
      if (iter.getTotalCount() > iter.getAvailableCount() || (amxNode.getAttribute('_waitForData') !== true && isItemizedChange(collectionChange)))
      {
        // set flag to avoid infinite call of bulk load providers
        amxNode.setAttributeResolvedValue("_waitForData", true);
        if (!amxNode["_pendingAttributeChanges"])
        {
          amxNode["_pendingAttributeChanges"] = attributeChanges;
        }
        this.FetchDataItems(amxNode, dataItems, collectionChange);
        // cannot rebuild the structure yet, wating for dataa
        return adf.mf.api.amx.AmxNodeChangeResult['NONE'];
      }
      // reset _secondCall flag
      amxNode.setAttributeResolvedValue("_waitForData", false);

      if ("yes" == amxNode.getAttribute("_placeholder"))
      {
        amxNode.setAttributeResolvedValue("_placeholder", "nomore");
      }
    }

    return adf.mf.api.amx.AmxNodeChangeResult['REFRESH'];
  }

  /**
   * Handles update that allows to rebuild only part of the hierarchy of the stamped children.
   *
   * @param amxNode {AmxNode} component's amxNode
   * @param collectionChange {adf.mf.api.amx.AmxCollectionChange} contains information about all the changes
   * @param facets {Array<String>} facets that should be affected
   */
  DataStampRenderer.prototype._itemizedUpdate = function (amxNode, collectionChange, facets)
  {
    // TODO: Handler UpdatedKeys in more sophisticated manner.
    var deletedKeys = collectionChange.getDeletedKeys();
    // var updatedKeys = collectionChange.getUpdatedKeys();
    var dirtiedKeys = collectionChange.getDirtiedKeys();
    var createdKeys = collectionChange.getCreatedKeys();
    // determine keys that should be removed
    var keysForRemoval = deletedKeys/*.concat(updatedKeys)*/.concat(dirtiedKeys);
    // remove deleted or changed keys
    for (var i = 0, size = keysForRemoval.length; i < size; i++)
    {
      var deletedKey = keysForRemoval[i];
      var children;
      if (facets)
      {
        children = [];
        for (var k = 0; k < facets.length; k++)
        {
          var subSet = amxNode.getChildren(facets[k], deletedKey);
          children = children.concat(subSet);
        }
      }
      else
      {
        children = amxNode.getChildren(null, deletedKey);
      }
      for (j = children.length - 1; j >= 0; j--)
      {
        amxNode.removeChild(children[j]);
      }
    }
    // determine new keys and updated keys to recreate amxNode
    var modifiedKeys = /*updatedKeys.concat*/(dirtiedKeys).concat(createdKeys);
    // add new keys and new keys for changed keys
    for (var idx = 0; idx < modifiedKeys.length; idx++)
    {
      amxNode.createStampedChildren(modifiedKeys[idx], facets);
    }
  }

  /**
   * Handles update that requires to rebuild completely the hierarchy of the stamped children.
   *
   * @param amxNode {AmxNode} component's amxNode
   * @param facets {Array<String>} facets that should be affected
   */
  DataStampRenderer.prototype._nonItemizedUpdate = function (amxNode, facets, dataItems, oldValue)
  {
    var i, ii, j, length, iter, keys, children;
    facets = facets || [null];

    if (oldValue)
    {
      for (i = 0, length = facets.length; i < length; i++)
      {
        iter = adf.mf.api.amx.createIterator(oldValue);
        if (iter.isTreeNodeIterator())
        {
          keys = dataItems.treeNodeBindings.keys;
          for (ii = 0, length = keys.length; ii < length; ii++)
          {
            children = amxNode.getChildren(facets[i], keys[ii]);
            for (j = children.length - 1; j >= 0; j--)
            {
              amxNode.removeChild(children[j]);
            }
          }
        }
        else
        {
          while (iter.hasNext())
          {
            iter.next();
            children = amxNode.getChildren(facets[i], iter.getRowKey());
            for (j = children.length - 1; j >= 0; j--)
            {
              amxNode.removeChild(children[j]);
            }
          }
        }
      }
    }
    // create the new stamped children hierarchy
    if (dataItems)
    {
      iter = adf.mf.api.amx.createIterator(dataItems);
      if (iter.isTreeNodeIterator())
      {
        keys = dataItems.treeNodeBindings.keys;
        for (i = 0, length = keys.length; i < length;i++)
        {
          amxNode.createStampedChildren(keys[i], facets);
        }
      }
      else
      {
        while (iter.hasNext())
        {
          iter.next();
          amxNode.createStampedChildren(iter.getRowKey(), facets);
        }
      }
    }
  }

  DataStampRenderer.prototype.getDescendentChangeAction = function (amxNode, descendentChanges)
  {
    amxNode["_pendingDescendentChanges"] = descendentChanges;
    return adf.mf.api.amx.AmxNodeChangeResult['REFRESH'];
  }

  // END OF THE AMX INTERFACE
  /**
   * function iterates through collection returned by value attribute and for each item from this collection
   * renders each child in the specified facet.
   */
  DataStampRenderer.prototype.ProcessStampedChildren = function (options, amxNode, context, facetName)
  {
    var varName = amxNode.getAttribute('var');// need to use this since var is reserved
    var value = amxNode.getAttribute('value');

    if (facetName)
    {
      if (!amxNode.getTag().getChildFacetTag(facetName))
      {
        // expected stamped facet not present, nothing to do
        return false;
      }
    }
    else
    {
      var stampedChildTags = amxNode.getTag().getChildren(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, this.GetStampedChildTagName(facetName));
      if (!stampedChildTags || stampedChildTags.length === 0)
      {
        // expected stamped child tag not found, nothing to do
        return false;
      }
    }

    if (value === undefined)
    {
      return this.ProcessStampedChild(options, amxNode, context, facetName);
    }

    var iter = adf.mf.api.amx.createIterator(value);
    var changed = false;
    while (iter.hasNext())
    {
      adf.mf.el.addVariable(varName, iter.next());
      changed |= this.ProcessStampedChild(options, amxNode, context, facetName, iter.getRowKey());
      adf.mf.el.removeVariable(varName);
    }

    return changed;
  };

  DataStampRenderer.prototype.PopulateCategories = function ()
  {
    return false;
  };

  DataStampRenderer.prototype.ProcessStampedChild = function (options, amxNode, context, facetName, rowKey)
  {
    // get all children for the facet and rowKey
    var chartDataItemNodes = amxNode.getChildren(facetName, rowKey);
    var changed = false;
    var iter2 = adf.mf.api.amx.createIterator(chartDataItemNodes);
    // iterate through child nodes and run renderer for each of them
    while (iter2.hasNext())
    {
      var childNode = iter2.next();

      if (childNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(childNode.getAttribute('rendered')))
        continue;// skip unrendered nodes
      // if the node includes unresolved attributes, no point to proceed
      if (!childNode.isReadyToRender())
      {
        throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException;
      }

      var rendererName = (facetName) ? facetName : 'stamped';
      var rendererObject = this.GetChildRenderers(rendererName)[childNode.getTag().getName()];
      if (rendererObject && rendererObject['renderer'])
      {
        // setup context
        context['_rowKey'] = rowKey;
        var renderer = rendererObject['renderer'];
        if (renderer.ProcessAttributes)
        {
          var changes = context['_attributeChanges'];
          var descendentChanges = context['_descendentChanges'];
          if (descendentChanges)
          {
            context['_attributeChanges'] = descendentChanges.getChanges(childNode);
            if (!context['_attributeChanges'])
            {
              context['_attributeChanges'] = adf.mf.internal.dvt.BaseRenderer.EMPTY_CHANGES;
            }
          }
          else if (changes)
          {
            context['_attributeChanges'] = adf.mf.internal.dvt.BaseRenderer.EMPTY_CHANGES;
          }
          changed = changed | renderer.ProcessAttributes(options, childNode, context);
          context['_attributeChanges'] = changes;
        }
        else
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, this.getTypeName(), "ProcessChildren", "There is a missing ProcessAttributes method on renderer for '" + childNode.getTag().getName() + "'!");
        }
        if (renderer.ProcessChildren)
        {
          changed = changed | renderer.ProcessChildren(options, childNode, context);
        }
        else
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, this.getTypeName(), "ProcessChildren", "There is a missing ProcessAttributes method on renderer for '" + childNode.getTag().getName() + "'!");
        }
        // clear context
        delete context['_rowKey'];
      }
    }
    return changed;
  }

  /**
   * @return array of the facet names
   */
  DataStampRenderer.prototype.GetStampedFacetNames = function ()
  {
    return [null];
  }

  /**
   * Returns the name of the stamped child tag.
   * @abstract
   * @param {String} facetName optional facet name where the stamped child lives
   * @return {String} stamped child tag name
   */
  DataStampRenderer.prototype.GetStampedChildTagName = function (facetName)
  {
    return null;
  }

  /**
   * Function extends parent function with processing of the stamped children.
   * After all childs are processed parent function is called to resolve simple children nodes.
   */
  DataStampRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {
    var facets = this.GetStampedFacetNames() || [null];
    var changed = false;

    var changes = context['_attributeChanges'];
    var descendentChanges = context['_descendentChanges'];

    if (!changes || changes.hasChanged('value') || descendentChanges)// TODO: be smarter with descendentChanges
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINE, this.getTypeName(), "ProcessChildren", "Processing value attribute '" + amxNode.getTag().getName() + "'!");

      for(var i = 0, length = facets.length; i < length; i++)
      {
        changed = changed | this.ProcessStampedChildren(options, amxNode, context, facets[i]);
      }
    }

    return changed | DataStampRenderer.superclass.ProcessChildren.call(this, options, amxNode, context);
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/BaseChartRenderer.js
 */
(function()
{
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;

  // create the DVT API namespace
  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.api.dvt');

  /*
   * Chart event objects
   */
  /**
   * An event for viewport changes in DVT charts
   * See also the Java API oracle.adfmf.amx.event.ViewportChangeEvent.
   * @param {Object} xMin minimum x coordinate of the viewport
   * @param {Object} xMax maximum x coordinate of the viewport
   * @param {Object} startGroup the first visible group index
   * @param {Object} endGroup the last visible group index
   * @param {Object} yMin minimum y coordinate of the viewport
   * @param {Object} yMax maximum y coordinate of the viewport
   */
  adf.mf.api.dvt.ViewportChangeEvent = function(xMin, xMax, startGroup, endGroup, yMin, yMax)
  {
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
    this.startGroup = startGroup;
    this.endGroup = endGroup;
    this[".type"] = "oracle.adfmf.amx.event.ViewportChangeEvent";
  };

  /**
   * Chart Drill event
   * @param {Number} id
   * @param {Number} rowkey
   * @param {String} series
   * @param {String} group
   */
  adf.mf.api.dvt.ChartDrillEvent = function(id, rowkey, series, group)
  {
    this.id = id;
    this.rowkey = rowkey;
    this.series = series;
    this.group = group;
    this[".type"] = "oracle.adfmf.amx.event.ChartDrillEvent";
  };

  /**
   * An event for changes of selection for DVT charts
   * See also the Java API oracle.adfmf.amx.event.ChartSelectionEvent.
   * @param {Object} oldRowKey the rowKey that has just been unselected
   * @param {Array<Object>} selectedRowKeys the array of rowKeys that have just been selected.
   * @param {Object} xMin minimum x coordinate of the viewport
   * @param {Object} xMax maximum x coordinate of the viewport
   * @param {Object} startGroup the first visible group index
   * @param {Object} endGroup the last visible group index
   * @param {Object} yMin minimum y coordinate of the viewport
   * @param {Object} yMax maximum y coordinate of the viewport
   * @param {Object} y2Min minimum y2 coordinate of the viewport
   * @param {Object} y2Max maximum y2 coordinate of the viewport
   */
  adf.mf.api.dvt.ChartSelectionEvent = function(oldRowKey, selectedRowKeys,
                                                xMin, xMax, startGroup, endGroup,
                                                yMin, yMax, y2Min, y2Max)
  {
    this.oldRowKey = oldRowKey;
    this.selectedRowKeys = selectedRowKeys;
    this.xMin = xMin;
    this.xMax = xMax;
    this.startGroup = startGroup;
    this.endGroup = endGroup;
    this.yMin = yMin;
    this.yMax = yMax;
    this.y2Min = y2Min;
    this.y2Max = y2Max;
    this[".type"] = "oracle.adfmf.amx.event.ChartSelectionEvent";
  };

  /**
   * Renderer common for all charts except SparkChart.
   */
  var BaseChartRenderer = function ()
  { };

  adf.mf.internal.dvt.DvtmObject.createSubclass(BaseChartRenderer, 'adf.mf.internal.dvt.DataStampRenderer', 'adf.mf.internal.dvt.chart.BaseChartRenderer');

  /**
   * returns the chart type
   */
  BaseChartRenderer.prototype.GetChartType = function ()
  {
    return null;
  };

  BaseChartRenderer.prototype.GetFacetNames = function()
  {
    return [null, 'overview'];
  };

  /**
   * Merge default and custom options
   */
  BaseChartRenderer.prototype.MergeComponentOptions = function (amxNode, options)
  {
    options = BaseChartRenderer.superclass.MergeComponentOptions.call(this, amxNode, options);

    var styleDefaults = options['styleDefaults'];

    if (styleDefaults && styleDefaults['colors'])
    {
      amxNode['_defaultColors'] = styleDefaults['colors'];
    }
    else
    {
      amxNode['_defaultColors'] = DvtChart.getDefaults()['styleDefaults']['colors'];
    }

    if (styleDefaults && styleDefaults['shapes'])
    {
      amxNode['_defaultShapes'] = styleDefaults['shapes'];
    }
    else
    {
      amxNode['_defaultShapes'] = DvtChart.getDefaults()['styleDefaults']['shapes'];
    }
    if (styleDefaults && styleDefaults['patterns'])
    {
      amxNode['_defaultPatterns'] = styleDefaults['patterns'];
    }
    else
    {
      amxNode['_defaultPatterns'] = DvtChart.getDefaults()['styleDefaults']['patterns'];
    }
    return options;
  };

  /**
   * @param {String} facetName an optional name of the facet containing the items to be rendered
   * @return object that describes child renderers of the component.
   */
  BaseChartRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      var FormatRenderer = adf.mf.internal.dvt.common.format.FormatRenderer;
      var LegendRenderer = adf.mf.internal.dvt.common.legend.LegendRenderer;
      var AxisRenderer = adf.mf.internal.dvt.common.axis.AxisRenderer;
      var OverviewRenderer = adf.mf.internal.dvt.common.overview.OverviewRenderer;

      this._renderers =
        {
          'facet':
            {
              'seriesStamp' :
                {
                  'seriesStyle' : { 'renderer' : new adf.mf.internal.dvt.chart.SeriesStyleRenderer(this.GetChartType()) }
                },
              'dataStamp' :
                {
                  'chartDataItem' : { 'renderer' : new adf.mf.internal.dvt.chart.ChartDataItemRenderer(this.GetChartType()) }
                },
              'groupStamp':
                {
                  'chartGroup' : { 'renderer' : new adf.mf.internal.dvt.chart.ChartGroupRenderer() }
                }
            },
          'simple' :
            {
              'xAxis' : { 'renderer' : new AxisRenderer('X'), 'order' : 1, 'maxOccurrences' : 1 },
              'yAxis' : { 'renderer' : new AxisRenderer('Y'), 'order' : 1, 'maxOccurrences' : 1 },
              'y2Axis' : { 'renderer' : new AxisRenderer('Y2'), 'order' : 1, 'maxOccurrences' : 1 },
              'xFormat' : { 'renderer' : new FormatRenderer('X'), 'order' : 2, 'maxOccurrences' : 1 },
              'yFormat' : { 'renderer' : new FormatRenderer('Y'), 'order' : 2, 'maxOccurrences' : 1  },
              'y2Format' : { 'renderer' : new FormatRenderer('Y2'), 'order' : 2, 'maxOccurrences' : 1 },
              'zFormat' : { 'renderer' : new FormatRenderer('Z'), 'order' : 2, 'maxOccurrences' : 1 },
              'chartValueFormat' : { 'renderer' : new FormatRenderer('*'), 'order' : 2, 'maxOccurences' : 10 },
              'legend' : { 'renderer' : new LegendRenderer(), 'order' : 3, 'maxOccurrences' : 1 },
              'overview' : { 'renderer' : new OverviewRenderer(), 'order' : 3, 'maxOccurences' : 1 }
            }
        }
    }

    if(facetName)
    {
      return this._renderers['facet'][facetName];
    }

    return this._renderers['simple'];
  };

  BaseChartRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = BaseChartRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['title'] = {'path' : 'title/text', 'type' : AttributeProcessor['TEXT']};
    attrs['titleHalign'] = {'path' : 'title/hAlign', 'type' : AttributeProcessor['TEXT']};
    attrs['subtitle'] =  {'path' : 'subtitle/text', 'type' : AttributeProcessor['TEXT']};
    attrs['footnote'] = {'path' : 'footnote/text', 'type' : AttributeProcessor['TEXT']};
    attrs['footnoteHalign'] = {'path' : 'footnote/hAlign', 'type' : AttributeProcessor['TEXT']};
    attrs['timeAxisType'] = {'path' : 'timeAxisType', 'type' : AttributeProcessor['TEXT']};
    attrs['seriesEffect'] = {'path' : 'styleDefaults/seriesEffect', 'type' : AttributeProcessor['TEXT']};
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
    attrs['animationOnDisplay'] = {'path' : 'animationOnDisplay', 'type' : AttributeProcessor['TEXT']};
    attrs['animationOnDataChange'] = {'path' : 'animationOnDataChange', 'type' : AttributeProcessor['TEXT']};
    attrs['animationDuration'] = {'path' : 'styleDefaults/animationDuration', 'type' : AttributeProcessor['INTEGER']};
    attrs['animationIndicators'] = {'path' : 'styleDefaults/animationIndicators', 'type' : AttributeProcessor['TEXT']};
    attrs['animationDownColor'] = {'path' : 'styleDefaults/animationDownColor', 'type' : AttributeProcessor['TEXT']};
    attrs['animationUpColor'] = {'path' : 'styleDefaults/animationUpColor', 'type' : AttributeProcessor['TEXT']};
    attrs['dataSelection'] = {'path' : 'selectionMode', 'type' : AttributeProcessor['TEXT'], 'dtvalue' : 'none'};
    attrs['hideAndShowBehavior'] = {'path' : 'hideAndShowBehavior', 'type' : AttributeProcessor['TEXT'], 'dtvalue' : 'none'};
    attrs['rolloverBehavior'] = {'path' : 'hoverBehavior', 'type' : AttributeProcessor['TEXT'], 'dtvalue' : 'none'};
    attrs['dataCursor'] = {'path' : 'dataCursor', 'type' : AttributeProcessor['TEXT'], 'dtvalue' : 'off'};
    attrs['dataCursorBehavior'] = {'path' : 'dataCursorBehavior', 'type' : AttributeProcessor['TEXT'], 'dtvalue' : ''};
    attrs['stack'] = {'path' : 'stack', 'type' : AttributeProcessor['TEXT']};
    attrs['emptyText'] = {'path' : 'emptyText', 'type' : AttributeProcessor['TEXT']};
    attrs['zoomAndScroll'] = {'path' : 'zoomAndScroll', 'type' : AttributeProcessor['TEXT']};
    attrs['dataLabelPosition'] = {'path' : 'styleDefaults/dataLabelPosition', 'type' : AttributeProcessor['TEXT']};
    attrs['orientation'] = {'path' : 'orientation', 'type' : AttributeProcessor['TEXT']};
    
    // Polar Charts
    attrs['coordinateSystem'] = {'path' : 'coordinateSystem', 'type' : AttributeProcessor['TEXT']};
    // attrs['startAngle'] = {'path' : 'startAngle', 'type' : AttributeProcessor['TEXT']};
    attrs['polarGridShape'] = {'path' : 'polarGridShape', 'type' : AttributeProcessor['TEXT']};

    // Bar Width Customization: these apply only to barChart and comboChart
    attrs['barGapRatio'] = {'path' : 'styleDefaults/barGapRatio', 'type' : AttributeProcessor['PERCENTAGE']};
    attrs['maxBarWidth'] = {'path' : 'styleDefaults/maxBarWidth', 'type' : AttributeProcessor['FLOAT']};
    
    attrs['sorting'] = {'path' : 'sorting', 'type' : AttributeProcessor['TEXT']};
    attrs['initialZooming'] = {'path' : 'initialZooming', 'type' : AttributeProcessor['TEXT']};

    // Drill event
    attrs['drilling'] = {'path' : 'drilling', 'type' : AttributeProcessor['TEXT']};
    
    attrs['splitDualY'] = {'path' : 'splitDualY', 'type' : AttributeProcessor['TEXT'], 'default' : 'off'};

    return attrs;
  };

  /**
   * @return object that describes styleClasses of the component.
   */
  BaseChartRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = BaseChartRenderer.superclass.GetStyleClassesDefinition.call(this);

    styleClasses['dvtm-chartPlotArea'] = {'path' : 'plotArea/backgroundColor', 'type' : StyleProcessor['BACKGROUND']};

    styleClasses['dvtm-legend'] = [{'path' : 'legend/textStyle', 'type' : StyleProcessor['CSS_TEXT']}, {'path' : 'legend/backgroundColor', 'type' : StyleProcessor['BACKGROUND']}, {'path' : 'legend/borderColor', 'type' : StyleProcessor['TOP_BORDER_WHEN_WIDTH_GT_0PX']}];
    styleClasses['dvtm-legendTitle'] = {'path' : 'legend/titleStyle', 'type' : StyleProcessor['CSS_TEXT']};
    styleClasses['dvtm-legendSectionTitle'] = {'path' : 'legend/sectionTitleStyle', 'type' : StyleProcessor['CSS_TEXT']};

    styleClasses['dvtm-chartTitle'] =  {'path' : 'title/style', 'type' : StyleProcessor['CSS_TEXT']};
    styleClasses['dvtm-chartSubtitle'] =  {'path' : 'subtitle/style', 'type' : StyleProcessor['CSS_TEXT']};
    styleClasses['dvtm-chartFootnote'] =  {'path' : 'footnote/style', 'type' : StyleProcessor['CSS_TEXT']};
    styleClasses['dvtm-chartTitleSeparator'] = [{'path' : 'titleSeparator/rendered', 'type' : StyleProcessor['VISIBILITY']}, {'path' : 'titleSeparator/upperColor', 'type' :  StyleProcessor['BORDER_COLOR_TOP']}, {'path' : 'titleSeparator/lowerColor', 'type' : StyleProcessor['BORDER_COLOR']}];

    styleClasses['dvtm-chartXAxisTitle'] = {'path' : 'xAxis/titleStyle', 'type' : StyleProcessor['CSS_TEXT']};

    styleClasses['dvtm-chartYAxisTitle'] = {'path' : 'yAxis/titleStyle', 'type' : StyleProcessor['CSS_TEXT']};

    styleClasses['dvtm-chartY2AxisTitle'] = {'path' : 'y2Axis/titleStyle', 'type' : StyleProcessor['CSS_TEXT']};

    styleClasses['dvtm-chartXAxisTickLabel'] = {'path' : 'xAxis/tickLabel/style', 'type' : StyleProcessor['CSS_TEXT']};

    styleClasses['dvtm-chartYAxisTickLabel'] = {'path' : 'yAxis/tickLabel/style', 'type' : StyleProcessor['CSS_TEXT']};

    styleClasses['dvtm-chartY2AxisTickLabel'] = {'path' : 'y2Axis/tickLabel/style', 'type' : StyleProcessor['CSS_TEXT']};

    if (this.IsNextSkin())
    {
      styleClasses['dvtm-chartTooltipLabel'] = {'path' : 'styleDefaults/tooltipLabelStyle', 'type' : StyleProcessor['CSS_TEXT']};
      styleClasses['dvtm-chartTooltipValue'] = {'path' : 'styleDefaults/tooltipValueStyle', 'type' : StyleProcessor['CSS_TEXT']};
    }
    return styleClasses;
  };

  /**
   * Initialize generic options for all chart component.
   */
  BaseChartRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    BaseChartRenderer.superclass.InitComponentOptions.call(this, amxNode, options);

    options['titleSeparator'] =
      {
        'rendered' : 'off'
      };

    options["type"] = this.GetChartType();

    options['series'] = [];
    options['groups'] = [];
    
    // for locales other than en/en-us, set the locale info 
    var locale = adf.mf.locale.getUserLanguage();
    if (locale !== 'en' && locale !== 'en-us')
    {
      options['_locale'] = locale;
    }

    AttributeGroupManager.reset(amxNode);
    amxNode['_stylesResolved'] = false;
  };

  /**
   * Reset options for all chart component.
   */
  BaseChartRenderer.prototype.ResetComponentOptions = function (amxNode, options, attributeChanges, descendentChanges)
  {
    BaseChartRenderer.superclass.ResetComponentOptions.call(this, amxNode, options, attributeChanges, descendentChanges);

    if (attributeChanges.getSize() > 0 || descendentChanges)
    {
      if (attributeChanges.hasChanged('value') || descendentChanges)
      {
        options['series'] = [];
        options['groups'] = [];
        AttributeGroupManager.reset(amxNode);
      }
      
      if (options['legend']) {
        delete options['legend']['sections'];
      }

      delete options['valueFormats'];
      delete options['xAxis'];
      delete options['yAxis'];
      delete options['y2Axis'];
     
      var selection = amxNode.getAttribute('_selection');
      if (selection !== undefined)
      {
        options['selection'] = selection;
      }
    }
  };

  BaseChartRenderer.prototype.updateChildren = function (amxNode, attributeChanges)
  {
    var state = BaseChartRenderer.superclass.updateChildren.call(this, amxNode, attributeChanges);
    if (attributeChanges.hasChanged('selectedRowKeys'))
    {
      // discard all user changes to the selection to allow newly defined selectedRowKeys to be processed
      amxNode.setAttributeResolvedValue('_selection', null);
      // in case that the result of superclass call is none than force refresh
      // in case that it is rerender or replace we are keeping original
      // state
      if (state < adf.mf.api.amx.AmxNodeChangeResult['REFRESH'])
      {
        state = adf.mf.api.amx.AmxNodeChangeResult['REFRESH'];
      }
    }
    return state;
  };

  BaseChartRenderer.prototype.GetCustomStyleProperty = function (amxNode)
  {
    return 'CustomChartStyle';
  };

  BaseChartRenderer.prototype.GetDefaultStyles = function (amxNode)
  {
    var currentStyle;

    if (!this.IsSkyros())
    {
      currentStyle = adf.mf.internal.dvt.util.JSONUtils.mergeObjects(adf.mf.internal.dvt.chart.DefaultChartStyle.SKIN_ALTA,
                                        adf.mf.internal.dvt.chart.DefaultChartStyle.VERSION_1);
      if (!this.IsAlta())
      {
        currentStyle = adf.mf.internal.dvt.util.JSONUtils.mergeObjects(adf.mf.internal.dvt.chart.DefaultChartStyle.SKIN_NEXT, currentStyle);
      }
    }
    else
    {
      return adf.mf.internal.dvt.chart.DefaultChartStyle.VERSION_1;
    }
    return currentStyle;
  };

  /**
   * Function processes supported attributes which are on amxNode. This attributes
   * should be converted into the options object.
   *
   * @param options main component options object
   * @param amxNode child amxNode
   * @param context processing context
   */
  BaseChartRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {
    var changed = BaseChartRenderer.superclass.ProcessAttributes.call(this, options, amxNode, context);

    // if neither dataSelection, nor zoomAndScroll attributes are specified, drop the _resources array from options
    if (!amxNode.isAttributeDefined('dataSelection') && !amxNode.isAttributeDefined('zoomAndScroll'))
    {
      if (options['_resources'] !== undefined)
      {
        delete options['_resources'];
        changed = true;
      }
    }
    if (amxNode.isAttributeDefined('timeAxisType'))
    {
      var timeAxisType = amxNode.getAttribute('timeAxisType');
      context['timeAxisType'] = timeAxisType;
      this._hasTimeAxis = false;
      if (timeAxisType === 'enabled' || timeAxisType === 'mixedFrequency')
      {
        this._hasTimeAxis = true;
      }
    }

    if (amxNode.isAttributeDefined('selectedRowKeys') && ((typeof options['selection'] == undefined) || (!options['selection'])))
    {
      var _selection = [];
      var selection = AttributeProcessor['ROWKEYARRAY'](amxNode.getAttribute('selectedRowKeys'));
      for (i = 0;i < selection.length;i++)
      {
        var selectionObject = {};
        var dataForRowKey = amxNode.getChildren('dataStamp', selection[i]);
        if ((Object.prototype.toString.call(dataForRowKey) === '[object Array]') && (dataForRowKey.length > 0))
        {
          selectionObject['id'] = dataForRowKey[0].getId();
          _selection.push(selectionObject);
        }
      }
      options['selection'] = _selection;
      amxNode.setAttributeResolvedValue("_selection", _selection);
    }
    return changed;
  };

  /**
   * Check if renderer is running in dtmode. If so then load only dummy data. In other case leave processing on the
   * parent.
   */
  BaseChartRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {  
    if (adf.mf.environment.profile.dtMode)
    {
      var definition = adf.mf.internal.dvt.ComponentDefinition.getComponentDefinition(amxNode.getTag().getName());
      var dtModeData = definition.getDTModeData();

      options['groups'] = dtModeData['groups'];
      options['series'] = dtModeData['series'];

      return true;
    }
    else
    {
      return BaseChartRenderer.superclass.ProcessChildren.call(this, options, amxNode, context);
    }
  };

  /**
   * @return supported facet's names
   */
  BaseChartRenderer.prototype.GetStampedFacetNames = function ()
  {
    // the processing order is important here
    // 1. we need to prepare structure of chart groups
    // 2. distribute all data items into the series and groups
    // 3. add advanced style for each series
    return ['groupStamp', 'dataStamp', 'seriesStamp'];
  };

  /**
   * Returns the name of the stamped child tag.
   * @param {String} facetName optional facet name where the stamped child lives 
   * @return {String} stamped child tag name
   */
  BaseChartRenderer.prototype.GetStampedChildTagName = function(facetName)
  {
    switch (facetName)
    {
      case 'dataStamp':
        return 'chartDataItem';
        
      case 'seriesStamp':
        return 'seriesStyle';
      
      case 'groupStamp':
        return 'chartGroup';
        
      default:
        return null;
    }
  };

  /**
   * function iterates through collection returned by value attribute and for each item from this collection
   * renders each child in the specified facet.
   */
  BaseChartRenderer.prototype.ProcessStampedChildren = function (options, amxNode, context, facetName)
  {
    AttributeGroupManager.init(context);
      
    var changed = BaseChartRenderer.superclass.ProcessStampedChildren.call(this, options, amxNode, context, facetName);

    var config = this.CreateAttributeGroupConfig();

    AttributeGroupManager.applyAttributeGroups(amxNode, config, context);
    return changed;
  };

  BaseChartRenderer.prototype.ProcessStyleClasses = function (node, amxNode)
  {
    BaseChartRenderer.superclass.ProcessStyleClasses.call(this, node, amxNode);
    
    var options = this.GetDataObject(amxNode);
    if (options['plotArea'] && options['plotArea']['backgroundColor'])
    {
      // remove transparent background color from the payload
      if (options['plotArea']['backgroundColor'] === 'rgba(0, 0, 0, 0)')
      {
        delete options['plotArea'];
      }
    }
  };

  BaseChartRenderer.prototype.CreateAttributeGroupConfig = function ()
  {
    var shape = adf.mf.internal.dvt.common.attributeGroup.DefaultPalettesValueResolver.SHAPE;
    
    var config = new adf.mf.internal.dvt.common.attributeGroup.AttributeGroupConfig();
    
    var updateCallback = null;

    if (!this.PopulateCategories())
    {
      updateCallback = function(attrGrp, dataItem, valueIndex, exceptionRules) {
        // do nothing
      };
    }
    
    if(updateCallback) {
      config.setUpdateCategoriesCallback(updateCallback);
    }
    config.addTypeToItemAttributeMapping(shape, 'markerShape');
    config.addTypeToDefaultPaletteMapping('markerShape', shape);
    config.setOverrideDefaultPalettes(true);
    
    return config;
  };

  /**
   * Function creates callback for the toolkit component which is common for all chart components
   */
  BaseChartRenderer.prototype.CreateComponentCallback = function(amxNode)
  {
    var that = this;
    var callbackObject =
      {
        'callback' : function (event, component)
          {
            var rowKey;
            var i;
            var xMin, xMax, yMin, yMax;
            var startGroup, endGroup;

            if (event.getType() === 'selection')
            {
              // selectionChange event support
              var selection = event.getSelection();
              if (selection !== undefined)
              {
                var idMapper = function(item)
                {
                  return item.getId ? item.getId() : item['id'];
                };

                var rkMapper = function(item)
                {
                  return item.getStampKey();
                };

                var selectedRowKeys = that.findAllAmxNodes(amxNode, selection.map(idMapper)).map(rkMapper);

                var userSelection = amxNode.getAttribute("_selection") || [];
                userSelection = that.findAllAmxNodes(amxNode, userSelection.map(idMapper)).map(rkMapper);
                // filter all removed keys
                var removedKeys = that.filterArray(userSelection, function(key)
                {
                  return selectedRowKeys.indexOf(key) === -1;
                });

                var se = new adf.mf.api.amx.SelectionEvent(removedKeys, selectedRowKeys);
                adf.mf.api.amx.processAmxEvent(amxNode, 'selection', undefined, undefined, se);

                var _selection = [];
                if (selection !== undefined && selection !== null)
                {
                  for (i = 0; i < selection.length; i++)
                  {
                    var eventSelectionObject = selection[i];

                    var selectionObject = {};
                    selectionObject['id'] = eventSelectionObject.getId();
                    selectionObject['group'] = eventSelectionObject.getGroup();
                    selectionObject['series'] = eventSelectionObject.getSeries();

                    _selection.push(selectionObject);
                  }
                }

                amxNode.setAttributeResolvedValue("_selection", _selection);
              }
            }
            else if (event.getType() === 'dvtAct')
            {
              // action event support
              var actionEvent = event.getClientId(); // event is of type DvtActionEvent
              var itemId = actionEvent;
              var notString = typeof event.getClientId() != "string"; // hack, because clientId can be string or object
              if (notString) {
                itemId = actionEvent.getId();
              }
              rowKey = event.getCommandId(); // no need to use rowkey cache
              if (rowKey !== undefined)
              {
                // get data item's amxNode (assume the rowKey to be unique)
                var item;
                if (notString) {
                  item = amxNode.getChildren('dataStamp', rowKey)[0];
                } else {
                  var j = 0;
                  // need to find right seriesStyle node where we process action attribute
                  var seriesStyles;
                  do {
                    seriesStyles = amxNode.getChildren('seriesStamp', j);
                    // there can be more seriesStyle items for one rowKey
                    for (i = 0; i < seriesStyles.length; i++) {
                        // itemId = seriesId or series name (series)
                        if ((seriesStyles[i].getAttribute("seriesId") == itemId) || (seriesStyles[i].getAttribute("series") == itemId)) {
                            if (seriesStyles[i].getAttribute("rendered")) { // seriesStyle must be rendered
                              item = seriesStyles[i];
                              seriesStyles = undefined;
                              break;
                            }
                        }
                    }
                    j++;
                  } while ((seriesStyles != undefined) && (seriesStyles.length > 0));
                }
                if (item !== undefined && item != null)
                {
                  // fire ActionEvent and then process the 'action' attribute
                  var ae = new adf.mf.api.amx.ActionEvent();
                  adf.mf.api.amx.processAmxEvent(item, 'action', undefined, undefined, ae,
                    function ()
                    {
                      var action = item.getAttributeExpression("action", true);
                      if (action != null)
                      {
                        adf.mf.api.amx.doNavigation(action);
                      }
                    });
                }
              }
            }
            // new zoomAndScroll code
            else if (event.getType() === 'viewportChange')
            {
              // convert time axis range to Date types
              if (that._hasTimeAxis)
              {
                xMin = new Date(event.getXMin());
                xMax = new Date(event.getXMax());
              }
              else
              {
                xMin = event.getXMin();
                xMax = event.getXMax();
              }
              yMin = event.getYMin();
              yMax = event.getYMax();
              startGroup = event.getStartGroup();
              endGroup = event.getEndGroup();

              var vce = new adf.mf.api.dvt.ViewportChangeEvent(xMin, xMax, startGroup, endGroup, yMin, yMax);
              adf.mf.api.amx.processAmxEvent(amxNode, 'viewportChange', undefined, undefined, vce);
            }
            else if (event.getType() === 'dvtDrill')
            {
              var id = event.getId();
              var series = event.getSeries();
              var group = event.getGroup();

              rowKey = null;
              if (id)
              {
                var stampedNode = that.findAmxNode(amxNode, id);
                if (stampedNode)
                {
                  rowKey = stampedNode.getStampKey();
                }
              }

              var drillEvent = new adf.mf.api.dvt.ChartDrillEvent(id, rowKey, series, group);
              adf.mf.api.amx.processAmxEvent(amxNode, 'drill', undefined, undefined, drillEvent);
            }
          }
      };
    return callbackObject;
  };

  /**
   * Function creates new instance of DvtChart
   */
  BaseChartRenderer.prototype.CreateToolkitComponentInstance = function(context, stageId, callbackObj, callback, amxNode)
  {
    var instance = DvtChart.newInstance(context, callback, callbackObj);
    context.getStage().addChild(instance);
    return instance;
  };

  BaseChartRenderer.prototype.AdjustStageDimensions = function (dim)
  {
    var width = dim['width'];
    var height = dim['height'];

    var widthThreshold = Math.floor(adf.mf.internal.dvt.BaseComponentRenderer.DEFAULT_WIDTH / 3);
    var heightThreshold = Math.floor(adf.mf.internal.dvt.BaseComponentRenderer.DEFAULT_HEIGHT / 3);

    if(width - widthThreshold < 0 || height - heightThreshold < 0)
    {
      var ratio;
      if(width - widthThreshold < height - heightThreshold)
      {
        ratio = height / width ;
        width = widthThreshold;
        height = width * ratio;
      }
      else
      {
        ratio = width / height ;
        height = heightThreshold;
        width = height * ratio;
      }
    }

    return {'width' : width, 'height' : height};
  };

  /**
   * sets newly calculated dimensions to the dom node
   */
  BaseChartRenderer.prototype.GetComponentDimensions = function(simpleNode, amxNode)
  {
    var result = BaseChartRenderer.superclass.GetComponentDimensions.call(this, simpleNode, amxNode);

    // if overview is defined, add the overview div for height calculations
    var options = this.GetDataObject(amxNode);
    var overviewId = amxNode.getId() + '_overview';
    var overviewNode = null;

    if (options && options['overview'] && options['overview']['style'] !== undefined)
    {
      overviewNode = simpleNode.querySelector('#' + overviewId);
      if (!overviewNode)
      {
        overviewNode = document.createElement('div');
        overviewNode.setAttribute('id', overviewId);
        overviewNode.setAttribute('style', 'position:absolute; bottom:0px; top:auto; display:block; visibility:hidden; ' + options['overview']['style']);
        simpleNode.appendChild(overviewNode);
      }
      options['overview']['height'] = overviewNode.offsetHeight;
    }

    return result;
  };

  /**
   * Function renders instance of the component
   */
  BaseChartRenderer.prototype.RenderComponent = function(instance, width, height, amxNode)
  {
    var data = null;
    if(this.IsOptionsDirty(amxNode))
    {
      data = this.GetDataObject(amxNode);
    }
    var dim = this.AdjustStageDimensions({'width' : width, 'height' : height});
    instance.render(data, dim['width'], dim['height']);
  };

  BaseChartRenderer.prototype.GetResourceBundles = function ()
  {
    var ResourceBundle = adf.mf.internal.dvt.util.ResourceBundle;

    var bundles = BaseChartRenderer.superclass.GetResourceBundles.call(this);
    bundles.push(ResourceBundle.createLocalizationBundle('DvtChartBundle'));

    return bundles;
  };

  BaseChartRenderer.prototype.PreventsSwipe = function (amxNode)
  {
    // charts should prevent swipe gestures when 'zoomAndScroll' or 'dataCursor' attributes are defined
    if ((amxNode.isAttributeDefined('zoomAndScroll') && amxNode.getAttribute('zoomAndScroll') !== 'off')
      || (amxNode.isAttributeDefined('dataCursor') && amxNode.getAttribute('dataCursor') !== 'off'))
    {
      return true;
    }
    return false;
  };

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    gauge/BaseGaugeRenderer.js
 */
(function()
{
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;

  var BaseGaugeRenderer = function ()
  { };

  adf.mf.internal.dvt.DvtmObject.createSubclass(BaseGaugeRenderer, 'adf.mf.internal.dvt.BaseComponentRenderer', 'adf.mf.internal.dvt.gauge.BaseGaugeRenderer');

  BaseGaugeRenderer.prototype.updateChildren = function (amxNode, attributeChanges)
  {
    // if inlineStyle has changed we need to recreate gauge instance
    if (attributeChanges.hasChanged('inlineStyle'))
    {
      return adf.mf.api.amx.AmxNodeChangeResult['REPLACE'];
    }
    // always refresh on any value change
    return adf.mf.api.amx.AmxNodeChangeResult['REFRESH'];
  };

  BaseGaugeRenderer.prototype.getDescendentChangeAction = function (amxNode, descendentChanges)
  {
    // always refresh on any descendent change
    return adf.mf.api.amx.AmxNodeChangeResult['REFRESH'];
  };

  /**
   * Function creates component's options, merges them with default styles,
   * and returns the coponent's main div element.
   *
   * @param amxNode
   * @return jquery div element
   */
  BaseGaugeRenderer.prototype.render = function (amxNode, id)
  {
    // set a private flag to indicate whether the node can be populated with contents
    // should an exception occur during data processing, this flag will be set to false
    this._setReadyToRender(amxNode, true);

    amxNode.setState(adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"]);

    try
    {
      // load resource bundles for this component
      this._loadResourceBundles(amxNode);
      // create new options object
      var options = {};
      // create new options object
      this.InitComponentOptions(amxNode, options);
      // fill newly created object with default and custom styles
      options = this.MergeComponentOptions(amxNode, options);
      // store options object to the amxNode
      this.SetDataObject(amxNode, options);
    }
    catch (ex)
    {
      // set flag that unexpected state occured and renderer is not able to render this amxNode
      this._setReadyToRender(amxNode, false);
      if (ex instanceof adf.mf.internal.dvt.exception.NodeNotReadyToRenderException)
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.INFO, this.getTypeName(), "create", ex + " (line: " + ex.line + ")");
        adf.mf.log.Framework.logp(adf.mf.log.level.FINE, this.getTypeName(), "create", "Stack: " + ex.stack);
      }
      else 
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, this.getTypeName(), "create", "Exception: " + ex.message + " (line: " + ex.line + ")");
        adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, this.getTypeName(), "create", "Stack: " + ex.stack);
      }
    }

    return this.SetupComponent(amxNode);
   };

  /**
   * Function renders component.
   *
   * @param rootElement root element node
   * @param amxNode gauge amxNode
   */
  BaseGaugeRenderer.prototype.postDisplay = function (rootElement, amxNode)
  {
    if (this.IsAncestor(document.body, rootElement))
    {
      this.GetComponentDimensions(rootElement, amxNode);
    }

    var args = new adf.mf.api.amx.AmxNodeUpdateArguments();

    // re-schedule the actual rendering for later to move relatively expensive
    // gauge rendering out of the page display cycle
    args.setAffectedAttribute(amxNode, "_renderMeLater");
    adf.mf.api.amx.markNodeForUpdate(args);

    return; // this function is not applicable for placeholders
  };

  /**
   * Function resets component's options and re-renders component.
   *
   * @param amxNode
   * @param attributeChanges changes of current amxNode
   * @param descendentChanges changes in pontential child components
   */
  BaseGaugeRenderer.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    if (amxNode.getState() == adf.mf.api.amx.AmxNodeStates["PARTIALLY_RENDERED"])
    {
      amxNode.setState(adf.mf.api.amx.AmxNodeStates["RENDERED"]);
    }
    BaseGaugeRenderer.superclass.refresh.call(this, amxNode, attributeChanges, descendentChanges);
  };

  BaseGaugeRenderer.prototype.getInputValueAttribute = function()
  {
    return "value";
  };
 
  BaseGaugeRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    BaseGaugeRenderer.superclass.InitComponentOptions.call(this, amxNode, options);

    options['metricLabel'] = 
    {
      'rendered' : 'on',
      'scaling' : 'auto'
    };
  };

  /**
   * Function is called in refresh phase and should reset the options object according to attributeChanges parameter.
   * 
   * @param amxNode
   * @param attributeChanges
   * @param descendentChanges
   */
  BaseGaugeRenderer.prototype.ResetComponentOptions = function (amxNode, options, attributeChanges, descendentChanges)
  {   
    BaseGaugeRenderer.superclass.ResetComponentOptions.call(this, amxNode, options, attributeChanges, descendentChanges);
    // must clear the thresholds and referenceLines arrays, if they exist
    if (attributeChanges.getSize() > 0 || descendentChanges)
    {
      if (options['thresholds'])
      {
        options['thresholds'] = [];
      }
      if (options['referenceLines'])
      {
        options['referenceLines'] = [];
      }
      if (attributeChanges.getChangedAttributeNames().indexOf("value") >= 0) // if value has changed
      {
        amxNode.setAttributeResolvedValue('changed', true); // this is just 'internal' change for node
        //amxNode.setAttribute('changed', true); - THIS WOULD CHANGE ALSO EL EXPRESSION - sometimes this can be usefull
        options['changed'] = true;
      }
    }
  };

  /**
   * processes the components's child tags
   */
  BaseGaugeRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      var TickLabelRenderer = adf.mf.internal.dvt.common.axis.TickLabelRenderer;
      this._renderers = 
        {
          'referenceLine' : { 'renderer' : new adf.mf.internal.dvt.common.axis.ReferenceLineRenderer() },
          'tickLabel' : { 'renderer' : new TickLabelRenderer(), 'maxOccurrences' : 1 },
          'metricLabel' : { 'renderer' : new TickLabelRenderer(false, true), 'maxOccurrences' : 1 },
          'gaugeLabelFormat' : { 'renderer' : new TickLabelRenderer(false, true), 'maxOccurrences' : 1 },
          'threshold' : { 'renderer' : new adf.mf.internal.dvt.gauge.ThresholdRenderer() }
        };
    }
    return this._renderers;
  };

  BaseGaugeRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = BaseGaugeRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['animationOnDisplay'] = {'path' : 'animationOnDisplay', 'type' : AttributeProcessor['TEXT']};
    attrs['animationOnDataChange'] = {'path' : 'animationOnDataChange', 'type' : AttributeProcessor['TEXT']};
    attrs['animationDuration'] = {'path' : 'styleDefaults/animationDuration', 'type' : AttributeProcessor['INTEGER']};
    attrs['emptyText'] = {'path' : 'emptyText', 'type' : AttributeProcessor['TEXT']};
    attrs['type'] = {'path' : 'type', 'type' : AttributeProcessor['TEXT']};
    attrs['visualEffects'] = {'path' : 'visualEffects', 'type' : AttributeProcessor['TEXT']};
    attrs['value'] = {'path' : 'value', 'type' : AttributeProcessor['FLOAT'], 'dtvalue' : 65, 'default' : 65};
    attrs['minValue'] = {'path' : 'min', 'type' : AttributeProcessor['FLOAT'], 'dtvalue' : 0, 'default' : 0};
    attrs['maxValue'] = {'path' : 'max', 'type' : AttributeProcessor['FLOAT'], 'dtvalue' : 100, 'default' : 100};
    attrs['borderColor'] = {'path' : 'borderColor', 'type' : AttributeProcessor['TEXT'], 'dtvalue' : null, 'default' : null};
    attrs['color'] = {'path' : 'color', 'type' : AttributeProcessor['TEXT']};
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
    attrs['readOnly'] = {'path' : 'readOnly', 'type' : AttributeProcessor['BOOLEAN'], 'default' : true};
    attrs['rotation'] = {'path' : 'rotation', 'type' : AttributeProcessor['TEXT']};
    attrs['labelDisplay'] = {'path' : 'metricLabel/rendered', 'type' : AttributeProcessor['TEXT'], 'default' : 'off'};

    return attrs;
  };

  BaseGaugeRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = BaseGaugeRenderer.superclass.GetStyleClassesDefinition.call(this);

    styleClasses['dvtm-gaugeIndicatorArea'] = [
      {'path' : 'borderColor', 'type' : StyleProcessor['BORDER_COLOR'], 'overwrite' : false }, 
      {'path' : 'borderRadius', 'type' : StyleProcessor['BORDER_RADIUS'], 'overwrite' : false }, 
      {'path' : 'color', 'type' : StyleProcessor['COLOR'], 'overwrite' : false }
    ];
    styleClasses['dvtm-gaugeMetricLabel'] = {'path' : 'metricLabel/style', 'type' : StyleProcessor['CSS_TEXT']};    

    return styleClasses; 
  };

  BaseGaugeRenderer.prototype.GetCustomStyleProperty = function (amxNode)
  {
    return 'CustomGaugeStyle';
  };

  BaseGaugeRenderer.prototype.GetDefaultStyles = function (amxNode)
  {
    var currentStyle;
    
    if (!this.IsSkyros())
    {
      currentStyle = adf.mf.internal.dvt.util.JSONUtils.mergeObjects(adf.mf.internal.dvt.gauge.DefaultGaugeStyle.SKIN_ALTA, 
                                        adf.mf.internal.dvt.gauge.DefaultGaugeStyle.VERSION_1);
    }
    else
    {
      return adf.mf.internal.dvt.gauge.DefaultGaugeStyle.VERSION_1;
    }
    return currentStyle;
  };

  /**
   * Function processes supported attributes which are on amxNode. This attributes
   * should be converted into the options object.
   *
   * @param options main component options object
   * @param amxNode child amxNode
   * @param context rendering context
   */
  BaseGaugeRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {    
    var changed = BaseGaugeRenderer.superclass.ProcessAttributes.call(this, options, amxNode, context);

    // bug 18406297: turn off data animation when the value is undefined
    if (options['value'] === undefined || options['value'] === null || isNaN(options['value']))
    {
      options['animationOnDataChange'] = 'none';
    }

    return changed;
  };

  /**
   * Function processes supported childTags which are on amxNode.
   *
   * @param options main component options object
   * @param amxNode child amxNode
   * @param context rendering context
   */
  BaseGaugeRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {
    context['__refObjPropertyName'] = 'referenceLines';
    var changed = BaseGaugeRenderer.superclass.ProcessChildren.call(this, options, amxNode, context);
    delete context['__refObjPropertyName'];

    return changed;
  };

  BaseGaugeRenderer.prototype.CreateComponentCallback = function(amxNode)
  {
    var callbackObject = 
      {
        'callback' : function (event, component)
        {
          var type = event.getType();
          if (type === DvtValueChangeEvent.TYPE)
          {
            var newValue = event.getNewValue();
            // fire the valueChange event if the value has changed
            if (newValue !== event.getOldValue())
            {
              var vce = new adf.mf.api.amx.ValueChangeEvent(event.getOldValue(), event.getNewValue());
              adf.mf.api.amx.processAmxEvent(amxNode, "valueChange", "value", newValue, vce);
            }
          }
        }
      };
    return callbackObject;
  };

  BaseGaugeRenderer.prototype.RenderComponent = function(instance, width, height, amxNode)
  { 
    var data = null;
    if(this.IsOptionsDirty(amxNode))
    {
      data = this.GetDataObject(amxNode);
    }
    instance.render(data, width, height);  
  };

  BaseGaugeRenderer.prototype.GetResourceBundles = function () 
  {
    var ResourceBundle = adf.mf.internal.dvt.util.ResourceBundle;

    var bundles = BaseGaugeRenderer.superclass.GetResourceBundles.call(this);
    bundles.push(ResourceBundle.createLocalizationBundle('DvtGaugeBundle'));

    return bundles;
  };

  /**
   * Determines if the component should prevent propagation of swipe/drag gestures.
   * Components that handle swipe/drag internally should not propagate events further
   * to their containers to avoid gesture conflicts. By default, all DVT components
   * propagation of swipe/drag start events. The type handler should override this method
   * when the component is mostly static and should propagate drag/swipe gestures to its
   * container.
   */
  BaseGaugeRenderer.prototype.PreventsSwipe = function (amxNode)
  {
    // if gauge accepts input, prevent event propagation
    if (amxNode.isAttributeDefined('readOnly') && adf.mf.api.amx.isValueFalse(amxNode.getAttribute('readOnly')))
      return true;
    // for read-only gauges, let the events go through
    return false;
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    treeview/TreeviewUtils.js
 */
(function(){
  
  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.treeview');
  
  var JSONPath = adf.mf.internal.dvt.util.JSONPath;
  
  var TreeviewUtils = {};
  adf.mf.internal.dvt.treeview.TreeviewUtils = TreeviewUtils;
  
  TreeviewUtils.copyOptionIfDefined = function (options, fromPath, toPath)
  {
    var value = new JSONPath(options, fromPath).getValue();
    if (value)
    {
      new JSONPath(options, toPath).setValue(value);
    }
  };
  
  TreeviewUtils.getMergedStyleValue = function (options, path)
  {
    return new JSONPath(options, path).getValue();
  };
  
  TreeviewUtils.isAttributeGroupNode = function (amxNode)
  {
    if(amxNode && amxNode.getTag() && amxNode.getTag().getName() === 'attributeGroups')
    {
      return true;
    }
    return false;
  };
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    treeview/TreeModelBuilder.js
 */
(function(){

  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;

  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.treeview');
  
  var TreeModelBuilder = {};
  adf.mf.internal.dvt.treeview.TreeModelBuilder = TreeModelBuilder;
 
  TreeModelBuilder.createModelNodes = function (options, amxNode, context)
  {
    var dataItems = amxNode["_dataItems"];
    var ignoredProps = (function() {
      return {
        props : ['attrGroups'],
        contains : function (arg) {
           return this.props.indexOf(arg) > -1;
        }
      };
    })();
    
    var i, j, length, length2, dataItem, node, detachedGroups, config, randomColor;
    var DefaultPalettesValueResolver = adf.mf.internal.dvt.common.attributeGroup.DefaultPalettesValueResolver;
    
    for (i = 0, length = dataItems.length; i < length; i++)
    {
      dataItem = dataItems[i];
      
      node = {};
      // copy properties
      var keys = Object.keys(dataItem);
      for (j = 0, length2 = keys.length; j < length2; j++)
      {
    	var key = keys[j];
        if (dataItem.hasOwnProperty(key)) 
        {
          // copy every non private and non ingored string property to node object
          if(typeof key === 'string' && key.indexOf('_') !== 0 && !ignoredProps.contains(key))
          {
            node[key] = dataItem[key];
          }
        }
      }

      detachedGroups = dataItem['_detachedGroups']
      AttributeGroupManager.attachProcessedAttributeGroups(context, detachedGroups);
      
      config = new adf.mf.internal.dvt.common.attributeGroup.DataItemConfig();
      randomColor = DefaultPalettesValueResolver.resolveValue(amxNode, DefaultPalettesValueResolver.COLOR, i);
      config.addTypeDefaultValue(DefaultPalettesValueResolver.COLOR, randomColor);
      
      AttributeGroupManager.registerDataItem(context, node, config);

      options["nodes"].push(node);
    }
  };
  
})();
/* Copyright (c) 2013, 2015, Oracle and/or its affiliates. All rights reserved. */
/*
 *    treeview/BaseTreeviewRenderer.js
 */
(function ()
{
  var TreeviewUtils = adf.mf.internal.dvt.treeview.TreeviewUtils;
  var TreeModelBuilder = adf.mf.internal.dvt.treeview.TreeModelBuilder;
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;

  /**
   * Common renderer for all tree views.
   */
  var BaseTreeviewRenderer = function ()
  {};

  adf.mf.internal.dvt.DvtmObject.createSubclass(BaseTreeviewRenderer, 'adf.mf.internal.dvt.DataStampRenderer', 'adf.mf.internal.dvt.treeview.BaseTreeviewRenderer');

  /**
   * @param {Object} amxNode
   * @return the chart type or null
   */
  BaseTreeviewRenderer.prototype.GetChartType = function ()
  {
    return null;
  };

  BaseTreeviewRenderer.prototype.MergeComponentOptions = function (amxNode, options)
  {
    options = BaseTreeviewRenderer.superclass.MergeComponentOptions.call(this, amxNode, options);

    if (!options['nodeDefaults'])
    {
      options['nodeDefaults'] = {};
    }

    // almost every property can have default value -> some defautls are handled by toolkit using nodeDefaults options property
    // some are handled by renderer (in GetAttributesDefinition function)
    // set toolkit defaults
    TreeviewUtils.copyOptionIfDefined(options, 'node/labelDisplay', 'nodeDefaults/labelDisplay');
    TreeviewUtils.copyOptionIfDefined(options, 'node/labelHalign', 'nodeDefaults/labelHalign');
    TreeviewUtils.copyOptionIfDefined(options, 'node/labelValign', 'nodeDefaults/labelValign');

    // extract default colors from styleDefaults and dispose styleDefaults so that it's not passed to toolkit
    var styleDefaults = options['styleDefaults'];
    if (styleDefaults)
    {
      if (styleDefaults['colors'])
      {
        amxNode['_defaultColors'] = styleDefaults['colors'];
      }
      if (styleDefaults['patterns'])
      {
        amxNode['_defaultPatterns'] = styleDefaults['patterns'];
      }
      delete options['styleDefaults'];// remove styleDefaults from options, no longer needed
    }
    return options;
  };

  BaseTreeviewRenderer.prototype.GetStyleComponentName = function ()
  {
    return null;
  };

  BaseTreeviewRenderer.prototype.SetupComponent = function (amxNode)
  {
    var outerDiv = BaseTreeviewRenderer.superclass.SetupComponent.call(this, amxNode);

    var inlineStyle = amxNode.getAttribute("inlineStyle");
    var styleClass = amxNode.getAttribute("styleClass");

    var classes = this.GetOuterDivClass() + " ";
    if (styleClass)
    {
      classes += styleClass;
    }

    if (!inlineStyle)
    {
      inlineStyle = "";
    }

    outerDiv.className = (outerDiv.className + " " + classes);

    var currStyle = outerDiv.getAttribute('style');
    if (!currStyle)
      currStyle = "";

    currStyle = currStyle.replace(/^\s+|\s+$/g, '');
    if (currStyle.length > 0 && !(currStyle.lastIndexOf(";") === (currStyle.length - 1)))
    {
      currStyle = currStyle + ";";
    }
    outerDiv.setAttribute('style', currStyle + inlineStyle);

    return outerDiv;
  };

  /**
   * Returns outer div class if any
   * @abstract
   * @returns outer div class if any
   */
  BaseTreeviewRenderer.prototype.GetOuterDivClass = function ()
  {
    return null;
  };

  BaseTreeviewRenderer.prototype.GetAttributesDefinition = function (amxNode)
  {
    var attrs = BaseTreeviewRenderer.superclass.GetAttributesDefinition.call(this, amxNode);

    // set renderer defaults where needed
    var styleCName = this.GetStyleComponentName();
    var options = this.GetDataObject(amxNode);

    attrs['animationDuration'] = {'path' : 'animationDuration', 'type' : AttributeProcessor['INTEGER'], 'default' : TreeviewUtils.getMergedStyleValue(options, styleCName+'/animationDuration')};
    attrs['animationOnDisplay'] = {'path' : 'animationOnDisplay', 'type' : AttributeProcessor['TEXT'], 'default' : TreeviewUtils.getMergedStyleValue(options, styleCName+'/animationOnDisplay')};
    attrs['animationOnDataChange'] = {'path' : 'animationOnDataChange', 'type' : AttributeProcessor['TEXT'], 'default' : TreeviewUtils.getMergedStyleValue(options, styleCName+'/animationOnDataChange')};
    attrs['nodeSelection'] = {'path' : 'selectionMode', 'type' : AttributeProcessor['TEXT'], 'default' : TreeviewUtils.getMergedStyleValue(options, styleCName+'/nodeSelection')};
    attrs['sorting'] = {'path' : 'sorting', 'type' : AttributeProcessor['TEXT'], 'default' : TreeviewUtils.getMergedStyleValue(options, styleCName+'/sorting')};
    attrs['emptyText'] = {'path' : 'emptyText', 'type' : AttributeProcessor['TEXT'], 'default' : TreeviewUtils.getMergedStyleValue(options, styleCName+'/emptyText')};
    attrs['rendered'] = {'path' : 'rendered', 'type' : AttributeProcessor['TEXT']};
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
    attrs['sizeLabel'] = {'path' : 'sizeLabel', 'type' : AttributeProcessor['TEXT']};
    attrs['colorLabel'] = {'path' : 'colorLabel', 'type' : AttributeProcessor['TEXT']};
    attrs['legendSource'] = {'path' : 'legendSource', 'type' : AttributeProcessor['TEXT']};

    return attrs;
  };

  /**
   * Initialize generic options.
   */
  BaseTreeviewRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    BaseTreeviewRenderer.superclass.InitComponentOptions.call(this, amxNode, options);

    options["nodeDefaults"] = {};
    options["nodes"] = [];

    // if the data attribute is defined, use it to initialize the data object
    if (amxNode.isAttributeDefined('data'))
    {
      options["nodes"] = amxNode.getAttribute('data');
    }

    options["type"] = this.GetChartType();

    amxNode["_dataItems"] = [];
    AttributeGroupManager.reset(amxNode);
    amxNode['_stylesResolved'] = false;
  };

  BaseTreeviewRenderer.prototype.updateChildren = function (amxNode, attributeChanges)
  {
    var state = BaseTreeviewRenderer.superclass.updateChildren.call(this, amxNode, attributeChanges);
    if (attributeChanges.hasChanged('selectedRowKeys'))
    {
      // discard all user changes to the selection to allow newly defined selectedRowKeys to be processed
      amxNode.setAttributeResolvedValue('_selection', null);
      // in case that the result of superclass call is none than force refresh
      // in case that it is rerender or replace we are keeping original
      // state
      if (state < adf.mf.api.amx.AmxNodeChangeResult['REFRESH'])
      {
        state = adf.mf.api.amx.AmxNodeChangeResult['REFRESH'];
      }
    }
    return state;
  };

  BaseTreeviewRenderer.prototype.setSelectedAndIsolatedNodes = function (amxNode)
  {
    var changed = false;
    var userSelection = amxNode.getAttribute("_selection");
    var isolatedRowKey = amxNode.isAttributeDefined("isolatedRowKey") ? amxNode.getAttribute("isolatedRowKey") : null;
    var selectedRowKeys = null;
    var options = this.GetDataObject(amxNode);

    if (userSelection == null)
    {
      selectedRowKeys = amxNode.isAttributeDefined("selectedRowKeys") ? AttributeProcessor['ROWKEYARRAY'](amxNode.getAttribute("selectedRowKeys")) : null;
    }
    else 
    {
      changed = true;
      options["selection"] = userSelection;
    }

    if (isolatedRowKey || (selectedRowKeys && selectedRowKeys.length > 0))
    {
      if (!amxNode.isAttributeDefined('value'))
      {
        return this._processIsolatedAndSelectedNodesForRowKey(amxNode, isolatedRowKey, selectedRowKeys, null);
      }
      else 
      {
        var value = amxNode.getAttribute('value');
        if (value)
        {
          var iter = adf.mf.api.amx.createIterator(value);
          while (iter.next())
          {
            changed = changed | this._processIsolatedAndSelectedNodesForRowKey(amxNode, isolatedRowKey, selectedRowKeys, iter.getRowKey());
          }
        }
      }
    }

    amxNode.setAttributeResolvedValue("_selection", options["selection"]);

    return changed;
  };

  /**
   *
   * @param {Object} amxNode parent amxNode
   * @param {String} isolatedRowKey isolated node rowkey
   * @param {Array} selectedRowKeys array of selected rowkeys
   * @param {String} masterRowKey stamped collection rowkey or null for static data
   * @returns {Boolean} indicates wheter options object was modified
   */
  BaseTreeviewRenderer.prototype._processIsolatedAndSelectedNodesForRowKey = function (amxNode, isolatedRowKey, selectedRowKeys, masterRowKey)
  {
    var options = this.GetDataObject(amxNode);
    var treeviewNodes = amxNode.getChildren(null, masterRowKey);
    var changed = false;

    var iter2 = adf.mf.api.amx.createIterator(treeviewNodes);
    while (iter2.hasNext())
    {
      var treeviewNode = iter2.next();
      var id = treeviewNode.getId();
      var rowKey;

      if (masterRowKey === null)
      {
        rowKey = iter2.getRowKey() + '';
      }
      else 
      {
        rowKey = treeviewNode.getStampKey();
      }

      if (isolatedRowKey !== null)
      {
        if (rowKey === isolatedRowKey)
        {
          options["isolatedNode"] = id;
          changed = true;
        }
      }
      if (selectedRowKeys !== null)
      {
        if (selectedRowKeys.indexOf(rowKey) >  - 1)
        {
          if (!options["selection"])
          {
            options["selection"] = [];
          }
          options["selection"].push(id);
          changed = true;
        }
      }
    }

    return changed;
  };

  /**
   * Check if renderer is running in dtmode. If so then load only dummy data. In other case leave processing on the
   * parent.
   */
  BaseTreeviewRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {
    var perf = adf.mf.internal.perf.startMonitorCall("Render tree children", adf.mf.log.level.FINER, "adf.mf.internal.dvt.treeview.BaseTreeviewRenderer.ProcessChildren");
    try 
    {
      if (adf.mf.environment.profile.dtMode)
      {
        var definition = adf.mf.internal.dvt.ComponentDefinition.getComponentDefinition('treeView');
        var dtModeData = definition.getDTModeData();

        options['nodes'] = dtModeData['nodes'];

        if (amxNode.isAttributeDefined('displayLevelsChildren'))
        {
          this.enforceLevelsChildren(options['nodes'], amxNode.getAttribute('displayLevelsChildren'));
        }

        return true;
      }
      else 
      {
        AttributeGroupManager.init(context);

        var changed = BaseTreeviewRenderer.superclass.ProcessChildren.call(this, options, amxNode, context);
        changed = changed | this.setSelectedAndIsolatedNodes(amxNode);

        //build tree model
        TreeModelBuilder.createModelNodes(options, amxNode, context);

        var updateCategories = function (attrGrp, dataItem, valueIndex, exceptionRules)
        {
          if (!dataItem['categories'])
            dataItem['categories'] = [];
          var categories = dataItem['categories'];

          if (attrGrp.isContinuous())
          {
            categories.push(attrGrp.getId() + ":" + valueIndex);
          }
          else 
          {
            categories.push(attrGrp.getId() + ":" + attrGrp.getCategoryValue(valueIndex));
          }

          var rules = exceptionRules.getRules();
          for (var i = 0;i < rules.length;i++)
          {
            categories.push(attrGrp.getId() + ":" + rules[i]['value']);
          }
        };

        // process attribute groups
        var config = new adf.mf.internal.dvt.common.attributeGroup.AttributeGroupConfig();
        config.addTypeToItemAttributeMapping('fillColor', adf.mf.internal.dvt.common.attributeGroup.DefaultPalettesValueResolver.COLOR);
        config.addTypeToDefaultPaletteMapping('fillColor', adf.mf.internal.dvt.common.attributeGroup.DefaultPalettesValueResolver.COLOR);
        config.addTypeToItemAttributeMapping('fillPattern', adf.mf.internal.dvt.common.attributeGroup.DefaultPalettesValueResolver.PATTERN);
        config.addTypeToDefaultPaletteMapping('fillPattern', adf.mf.internal.dvt.common.attributeGroup.DefaultPalettesValueResolver.PATTERN);
        config.setUpdateCategoriesCallback(updateCategories);

        AttributeGroupManager.applyAttributeGroups(amxNode, config, context);

        // if legendSource is defined add corresponding attribute group description to the options
        var legendSource = options['legendSource'];
        var attrGroup = AttributeGroupManager.findGroupById(amxNode, legendSource);

        if (attrGroup)
        {
          if (!options["attributeGroups"])
          {
            options["attributeGroups"] = [];
          }
          options["attributeGroups"].push(attrGroup.getDescription());
        }

        return changed;
      }
    }
    finally 
    {
      perf.stop();
    }
  };

  BaseTreeviewRenderer.prototype.enforceLevelsChildren = function (nodes, level)
  {
    if (!nodes)
      return;
    if (level < 0)
      level = 0;
    if (level === 0)
    {
      for (var i = 0;i < nodes.length;i++)
      {
        if (nodes[i].nodes)
          nodes[i].nodes = null;
      }
    }
    else 
    {
      for (var i = 0;i < nodes.length;i++)
      {
        this.enforceLevelsChildren(nodes[i].nodes, level - 1);
      }
    }
  };

  /**
   * Reset options for all treeview components.
   */
  BaseTreeviewRenderer.prototype.ResetComponentOptions = function (amxNode, options, attributeChanges, descendentChanges)
  {
    BaseTreeviewRenderer.superclass.ResetComponentOptions.call(this, amxNode, options, attributeChanges, descendentChanges);

    // make a note that this is a refresh phase
    amxNode['_attributeChanges'] = attributeChanges;

    if (attributeChanges.hasChanged('value') || descendentChanges)
    {
      amxNode["_dataItems"] = [];
    }

    options["nodes"] = [];

    AttributeGroupManager.reset(amxNode);
    if (options["selection"])
    {
      options["selection"] = null;
    }
    if (options["selectedNodes"])
    {
      options["selectedNodes"] = null;
    }
  };

  /**
   * Function creates callback for the toolkit component which is common for all treeview components
   */
  BaseTreeviewRenderer.prototype.CreateComponentCallback = function (amxNode)
  {
    var renderer = this;
    var callbackObject = 
    {
      'callback' : function (event, component)
      {
        if (event.getType() === 'selection')
        {
          // selectionChange event support
          var selection = event.getSelection();
          if (selection !== undefined)
          {
            var selectedRowKeys = [];
            var selectedIds = [];
            for (var i = 0;i < selection.length;i++)
            {
              var itemNode = renderer.findAmxNode(amxNode, selection[i]);
              if (itemNode)
              {
                var stampKey = itemNode.getStampKey();
                selectedRowKeys.push(stampKey);
                selectedIds.push(itemNode.getId());
              }
            }

            var userSelection = amxNode.getAttribute("_selection") || [];
            // filter all removed keys
            var removedIDs = renderer.filterArray(userSelection, function (id)
            {
              return selectedIds.indexOf(id) ===  - 1;
            }) || [];

            var removedKeys = removedIDs.map(function (id)
            {
              return renderer.findAmxNode(amxNode, id);
            });

            var se = new adf.mf.api.amx.SelectionEvent(removedKeys, selectedRowKeys);
            adf.mf.api.amx.processAmxEvent(amxNode, 'selection', undefined, undefined, se);

            amxNode.setAttributeResolvedValue("_selection", selectedIds);
          }
        }
      }
    };
    return callbackObject;
  };

  BaseTreeviewRenderer.prototype.CreateToolkitComponentInstance = function (context, stageId, callbackObj, callback, amxNode)
  {
    return null;
  };

  BaseTreeviewRenderer.prototype.AdjustStageDimensions = function (dim)
  {
    var width = dim['width'];
    var height = dim['height'];

    var widthThreshold = Math.floor(adf.mf.internal.dvt.BaseComponentRenderer.DEFAULT_WIDTH / 3);
    var heightThreshold = Math.floor(adf.mf.internal.dvt.BaseComponentRenderer.DEFAULT_HEIGHT / 3);

    if (width - widthThreshold < 0 || height - heightThreshold < 0)
    {
      var ratio;
      if (width - widthThreshold < height - heightThreshold)
      {
        ratio = height / width;
        width = widthThreshold;
        height = width * ratio;
      }
      else 
      {
        ratio = width / height;
        height = heightThreshold;
        width = height * ratio;
      }
    }

    return { 'width' : width, 'height' : height };
  };

  /**
   * Function renders instance of the component
   */
  BaseTreeviewRenderer.prototype.RenderComponent = function (instance, width, height, amxNode)
  {
    var data = null;
    if (this.IsOptionsDirty(amxNode))
    {
      data = this.GetDataObject(amxNode);
    }
    var dim = this.AdjustStageDimensions(
    {
      'width' : width, 'height' : height
    });
    instance.render(data, dim['width'], dim['height']);
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    treeview/BaseTreeviewNodeRenderer.js
 */
(function(){

  var TreeviewUtils = adf.mf.internal.dvt.treeview.TreeviewUtils;
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
  
  var BaseTreeviewNodeRenderer = function()
  {};
  

  adf.mf.internal.dvt.DvtmObject.createSubclass(BaseTreeviewNodeRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.treeview.BaseTreeviewNodeRenderer');

  BaseTreeviewNodeRenderer.prototype.GetAttributesDefinition = function (amxNode)
  {
    var attrs = BaseTreeviewNodeRenderer.superclass.GetAttributesDefinition.call(this, amxNode);

    attrs['value'] = {'path' : 'value', 'type' : AttributeProcessor['FLOAT']};
    attrs['label'] = {'path' : 'label', 'type' : AttributeProcessor['TEXT']};
    attrs['fillColor'] = {'path' : 'color', 'type' : AttributeProcessor['TEXT']};
    attrs['fillPattern'] = {'path' : 'pattern', 'type' : AttributeProcessor['TEXT']};
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
    attrs['labelDisplay'] = {'path' : 'labelDisplay', 'type' : AttributeProcessor['TEXT']};
    attrs['labelHalign'] = {'path' : 'labelHalign', 'type' : AttributeProcessor['TEXT']};

    return attrs;
  };

  BaseTreeviewNodeRenderer.prototype.ProcessAttributes = function (options, treeviewNode, context)
  {
    var amxNode = context['amxNode'];
    var dataItem = this.CreateTreeViewNode(amxNode, treeviewNode, context);

    if(dataItem)
    {
      dataItem['_rowKey'] = context['_rowKey'];
      dataItem['id'] = treeviewNode.getId();
      // always process all attributes -> temporarily delete _attributeChanges
      var currentAttributeChanges = context['_attributeChanges'];
      context['_attributeChanges'] = null;

      // process marker attributes
      BaseTreeviewNodeRenderer.superclass.ProcessAttributes.call(this, dataItem, treeviewNode, context);

      context['_attributeChanges'] = currentAttributeChanges;

      amxNode["_dataItems"].push(dataItem);

      var childNodes = treeviewNode.getChildren();
      var iter3 = adf.mf.api.amx.createIterator(childNodes);
      while (iter3.hasNext())
      {
        var childNode = iter3.next();

        if(!TreeviewUtils.isAttributeGroupNode(childNode))
        {
          continue;
        }

        if (childNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(childNode.getAttribute('rendered')))
          continue;         // skip unrendered nodes

        if (!childNode.isReadyToRender())
        {
          throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException();
        }
        AttributeGroupManager.processAttributeGroup(childNode, amxNode, context);
      }
      var detached = AttributeGroupManager.detachProcessedAttributeGroups(context);
      dataItem['_detachedGroups'] = detached;
    }

    context["dataItem"] = dataItem;

    return true;
  };


  BaseTreeviewNodeRenderer.prototype.CreateTreeViewNode = function (amxNode, treeviewNode, context)
  {
    var attr;

    // first check if this data item should be rendered at all
    attr = treeviewNode.getAttribute('rendered');
    if (attr !== undefined)
    {
      if (adf.mf.api.amx.isValueFalse(attr))
        return null;
    }

    var dataItem =
    {
      'attrGroups' : []
    };

    return dataItem;
  };

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    Definitions.js
 */
(function(){

  var DOM_STRUCTURES = 
  {
    'areaChart' : 
      {
        'dtModeData' : 
          {
            'groups' : ["Group A", "Group B", "Group C", "Group D"], 
            'series' : [
                {name : "Series 1", items : [74, 42, 70, 46]},
                {name : "Series 2", items : [50, 58, 46, 54]},
                {name : "Series 3", items : [34, 22, 30, 32]},
                {name : "Series 4", items : [18, 6, 14, 22]}
            ]
          }
      },
    'barChart' : 
      {
        'dtModeData' : 
          {
            'groups' : ["Group A", "Group B"], 
            'series' : [
                {name : "Series 1", items : [42, 34]},
                {name : "Series 2", items : [55, 30]},
                {name : "Series 3", items : [36, 50]},
                {name : "Series 4", items : [22, 46]},
                {name : "Series 5", items : [22, 46]}
            ]
          }
        },
    'bubbleChart' : 
      {
        'dtModeData' :
          {
            'groups' : ["Group A", "Group B", "Group C"], 
            'series' : [
                {name : "Series 1", items : [{x : 15, y : 25, z : 5},{x : 25, y : 30, z : 12},{x : 25, y : 45, z : 12}]},
                {name : "Series 2", items : [{x : 15, y : 15, z : 8},{x : 20, y : 35, z : 14},{x : 40, y : 55, z : 35}]},
                {name : "Series 3", items : [{x : 10, y : 10, z : 8},{x : 18, y : 55, z : 10},{x : 40, y : 50, z : 18}]},
                {name : "Series 4", items : [{x : 8, y : 20, z : 6},{x : 11, y : 30, z : 8},{x : 30, y : 40, z : 15}]}
              ]
          }
      },
    'comboChart' : 
      {
        'dtModeData' : 
          {
            'groups' : ["Group A", "Group B"], 
            'series' : [
                {name : "Series 1", items : [42, 34]},
                {name : "Series 2", items : [55, 30]},
                {name : "Series 3", items : [36, 50]},
                {name : "Series 4", items : [22, 46]},
                {name : "Series 5", items : [22, 46]}
            ]
          }
      },
    'funnelChart' : 
      {
        'dtModeData' : 
          {
            'groups' : [], 
            'series' : [
                {name : "Series 1", items : [42, 34]},
                {name : "Series 2", items : [55, 30]},
                {name : "Series 3", items : [36, 50]},
                {name : "Series 4", items : [22, 46]},
                {name : "Series 5", items : [22, 46]}
            ]
          }
      },            
    'horizontalBarChart' : 
      {
        'dtModeData' : 
          {
            'groups' : ["Group A", "Group B"], 
            'series' : [
                {name : "Series 1", items : [42, 34]},
                {name : "Series 2", items : [55, 30]},
                {name : "Series 3", items : [36, 50]},
                {name : "Series 4", items : [22, 46]},
                {name : "Series 5", items : [22, 46]}
            ]
          }
      },
    'lineChart' : 
      {
        'dtModeData' : 
          {
            'groups' : ["Group A", "Group B", "Group C", "Group D", "Group E"], 
            'series' : [
               {name : "Series 1", items : [74, 62, 70, 76, 66]},
               {name : "Series 2", items : [50, 38, 46, 54, 42]},
               {name : "Series 3", items : [34, 22, 30, 32, 26]},
               {name : "Series 4", items : [18, 6, 14, 22, 10]},
               {name : "Series 5", items : [3, 2, 3, 3, 2]}
              ]
          }
      },
    'pieChart' : 
      {        
        'dtModeData' : 
          {
            'groups' : [""],
            'series' : [
                {id : "Series 1", name : "Series 1", items : [42]},
                {id : "Series 2", name : "Series 2", items : [55]},
                {id : "Series 3", name : "Series 3", items : [36]},
                {id : "Series 4", name : "Series 4", items : [22]},
                {id : "Series 5", name : "Series 5", items : [22]}
            ]
          }
      },
    'scatterChart' : 
      {
        'dtModeData' : 
          {
            'groups' : ["Group A", "Group B", "Group C"], 
            'series' : [
                {name : "Series 1", items : [{x : 15, y : 15},{x : 25, y : 43},{x : 25, y : 25}]},
                {name : "Series 2", items : [{x : 25, y : 15},{x : 55, y : 45},{x : 57, y : 47}]},
                {name : "Series 3", items : [{x : 17, y : 36},{x : 32, y : 52},{x : 26, y : 28}]},
                {name : "Series 4", items : [{x : 38, y : 22},{x : 43, y : 43},{x : 58, y : 36}]}
            ]
          }
      },
    'sparkChart' : 
      {
        'dtModeData' : [20, 25, 15, 10, 18, 15, 20, 15, 25, 30, 20, 18, 25, 28, 30]
      },
    'stockChart' : 
      {
        'dtModeData' :
          {
            'groups' : [""],
            'series' : [
                {id : "BTC", name : "BTC", type: "candlestick", items : [
                  {
                   "id": "cdi1",
                   "close": 588.91,
                   "high": 591,
                   "low": 578.21,
                   "open": 589.6,
                   "shortDesc": "Stock Data Item",
                   "volume": 2803,
                   "x": "1407016800000"
                  },
                  {
                   "id": "cdi1",
                   "close": 598.2,
                   "high": 607.2,
                   "low": 581.77,
                   "open": 583.54,
                   "shortDesc": "Stock Data Item",
                   "volume": 11940,
                   "x": "1406844000000"
                  },
                  {
                   "id": "cdi1",
                   "close": 563.84,
                   "high": 586,
                   "low": 557.12,
                   "open": 585.93,
                   "shortDesc": "Stock Data Item",
                   "volume": 10499,
                   "x": "1406671200000"
                  },
                  {
                   "id": "cdi1",
                   "close": 586.53,
                   "high": 596,
                   "low": 570.5,
                   "open": 592.61,
                   "shortDesc": "Stock Data Item",
                   "volume": 10540,
                   "x": "1406498400000"
                  },
                  {
                   "id": "cdi1",
                   "close": 596.23,
                   "high": 603,
                   "low": 590,
                   "open": 602.93,
                   "shortDesc": "Stock Data Item",
                   "volume": 3608,
                   "x": "1406325600000"
                  },
                  {
                   "id": "cdi1",
                   "close": 601.66,
                   "high": 621.99,
                   "low": 591.12,
                   "open": 620.95,
                   "shortDesc": "Stock Data Item",
                   "volume": 10241,
                   "x": "1406152800000"
                  }
                 ]}
            ]
          }
      },
    'treeView' :
      {
        'dtModeData' :
        {
          'nodes': [
              {id: "00", value: 70, color: "#336699", label: "Massachusetts"},
              {id: "01", value: 95, color: "#CC3300", label: "New York"},
              {id: "02", value: 30, color: "#F7C808", label: "Connecticut"},
              {id: "03", value: 83, color: "#F7C808", label: "Maine"},
              {id: "04", value: 12, color: "#F7C808", label: "Vermont"}
           ]
         }
      },
    'timeline' :
      {
        'dtModeData' :
        {
          "start": 1263237200000,
          "selectionMode": "single",
          "end": 1266238000000,
          "minorAxis": {
            "scale": "days"
          }
        }
      },
    'timelineSeries' :
      {
        'dtModeData' :
        {
          'items0': [
              {"id": "ts1:1:ti1", "title": "Jan 13, 2010", "start": 1263337200000, "end": 1263737200000, "description": "Event 1"},
              {"id": "ts1:2:ti1", "title": "Jan 27, 2010", "start": 1264546800000, "description": "Event 2"},
              {"id": "ts1:3:ti1", "title": "Jan 29, 2010", "start": 1264719600000, "end": 1265019600000, "description": "Event 3"},
              {"id": "ts1:4:ti1", "title": "Feb 4, 2010", "start": 1265238000000, "description": "Event 4"}
           ],
           'items1': [
              {"id": "ts2:1:ti1", "title": "Jan 13, 2010", "start": 1263337200000, "end": 1263737200000, "description": "Event 1"},
              {"id": "ts2:2:ti1", "title": "Jan 27, 2010", "start": 1264546800000, "description": "Event 2"},
              {"id": "ts2:3:ti1", "title": "Jan 29, 2010", "start": 1264719600000, "end": 1265019600000, "description": "Event 3"},
              {"id": "ts2:4:ti1", "title": "Feb 4, 2010", "start": 1265238000000, "description": "Event 4"}
           ]
         }
      }
  }
  
  var ComponentDefinition = function(structure)
  {
    if(structure !== undefined)
    {
      this._dtModeData = structure['dtModeData'];
    }
    else
    {
      this._dtModeData = null;
    }
  }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(ComponentDefinition, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.ComponentDefinition');
  
  var definitionCache = {};
  
  adf.mf.internal.dvt.ComponentDefinition = {};
  adf.mf.internal.dvt.ComponentDefinition.getComponentDefinition = function(name)
  {
    if(definitionCache === undefined)
    {
      definitionCache = {};
    }
    
    if(definitionCache[name] === undefined)
    {
      var structure = DOM_STRUCTURES[name];
      definitionCache[name] = new ComponentDefinition(structure);
    }
    
    return definitionCache[name];
  }
 
  ComponentDefinition.prototype.getDTModeData = function()
  {
    return this._dtModeData;
  }

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/AreaChartRenderer.js
 */
(function(){

  var AreaChartRenderer = function ()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(AreaChartRenderer, 'adf.mf.internal.dvt.chart.BaseChartRenderer', 'adf.mf.internal.dvt.chart.AreaChartRenderer');
  
  AreaChartRenderer.prototype.GetChartType = function ()
  {
    return 'area';
  }
  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'areaChart', AreaChartRenderer);
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/BarChartRenderer.js
 */
(function(){

  var BarChartRenderer = function ()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(BarChartRenderer, 'adf.mf.internal.dvt.chart.BaseChartRenderer', 'adf.mf.internal.dvt.chart.BarChartRenderer');
 
  BarChartRenderer.prototype.GetChartType = function ()
  {
    return 'bar';
  }
  
  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'barChart', BarChartRenderer);
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/BubbleChartRenderer.js
 */
(function(){

  var BubbleChartRenderer = function ()
  { }  

  adf.mf.internal.dvt.DvtmObject.createSubclass(BubbleChartRenderer, 'adf.mf.internal.dvt.chart.BaseChartRenderer', 'adf.mf.internal.dvt.chart.BubbleChartRenderer');
  
  BubbleChartRenderer.prototype.GetChartType = function ()
  {
    return 'bubble';
  }
  
  BubbleChartRenderer.prototype.PopulateCategories = function() {
    return true;
  };
 
  BubbleChartRenderer.prototype.GetDefaultStyles = function (amxNode)
  {
    var currentStyle = BubbleChartRenderer.superclass.GetDefaultStyles.call(this, amxNode);
    // need to override the default style for bubble chart, markers should be on by default
    currentStyle['styleDefaults']['markerDisplayed'] = 'on';
    return currentStyle;
  }
  
  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'bubbleChart', BubbleChartRenderer);
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/ChartDataItemRenderer.js
 */
(function ()
{
  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;

  var ChartDataItemRenderer = function (chartType)
  {
    this._chartType = chartType;
  };

  adf.mf.internal.dvt.DvtmObject.createSubclass(ChartDataItemRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.chart.ChartDataItemRenderer');

  ChartDataItemRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = ChartDataItemRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['x'] = {'path' : 'x', 'type' : AttributeProcessor['FLOAT']};
    attrs['y'] = {'path' : 'y', 'type' : AttributeProcessor['FLOAT']};
    attrs['z'] = {'path' : 'z', 'type' : AttributeProcessor['FLOAT']};
    attrs['label'] = {'path' : 'label'};
    attrs['labelPosition'] = {'path' : 'labelPosition', 'type' : AttributeProcessor['TEXT']};
    attrs['labelStyle'] = {'path' : 'labelStyle', 'type' : AttributeProcessor['TEXT']};
    attrs['markerSize'] = {'path' : 'markerSize', 'type' : AttributeProcessor['FLOAT']};
    attrs['value'] = {'path' : 'y', 'type' : AttributeProcessor['FLOAT']};
    attrs['borderColor'] = {'path' : 'borderColor', 'type' : AttributeProcessor['TEXT']};
    attrs['color'] = {'path' : 'color', 'type' : AttributeProcessor['TEXT']};
    attrs['markerShape'] = {'path' : 'shape', 'type' : AttributeProcessor['TEXT']};
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
    attrs['markerDisplayed'] = {'path' : 'markerDisplayed', 'type' : AttributeProcessor['BOOLEAN']};
    attrs['pattern'] = {'path' : 'pattern', 'type' : AttributeProcessor['TEXT']};
    // Range values for area and column chart (ER: 21171401)
    if (this._chartType === 'area' || this._chartType === 'bar')
    {
      attrs['low'] = {'path' : 'low', 'type' : AttributeProcessor['FLOAT']};
      attrs['high'] = {'path' : 'high', 'type' : AttributeProcessor['FLOAT']};
    }

    // on/off
    attrs['drilling'] = {'path' : 'drilling', 'type' : AttributeProcessor['TEXT']};

    return attrs;
  };

  ChartDataItemRenderer.prototype.ProcessAttributes = function (options, markerNode, context)
  {
    if (markerNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(markerNode.getAttribute('rendered')))
    {
      return true;
    }

    var amxNode = context['amxNode'];

    var dataItem = 
    {
      'id' : markerNode.getId()
    };

    ChartDataItemRenderer.superclass.ProcessAttributes.call(this, dataItem, markerNode, context);

    if (this._hasAction(markerNode))
    {
      dataItem['action'] = context['_rowKey'];
    }

    var seriesId = this._getSeriesId(markerNode);
    var groupId = null;
    var group = null;
    var seriesName = null;

    if (markerNode.isAttributeDefined('groupId'))
    {
      groupId = markerNode.getAttribute('groupId')
    }

    if (markerNode.isAttributeDefined('group'))
    {
      group = markerNode.getAttribute('group');
    }

    if (markerNode.isAttributeDefined('series'))
    {
      seriesName = markerNode.getAttribute('series');
    }

    if (markerNode.isAttributeDefined('timeAxisType'))
    {
      if ('mixedFrequency' === amxNode.getAttribute('timeAxisType'))
      {
        if (dataItem['x'])
          dataItem['x'] = adf.mf.internal.dvt.AttributeProcessor['DATETIME'](dataItem['x']);

        if (group)
          group = adf.mf.internal.dvt.AttributeProcessor['DATETIME'](group);
      }
    }

    var series = adf.mf.internal.dvt.chart.SeriesHelper.getSeriesByIdAndName(amxNode, seriesId, seriesName === null ? "" : seriesName);
    // there is seriesStyle available for these two charts so
    // always mark the series as not displayable in legend
    if (this._chartType === 'bubble' || this._chartType === 'scatter')
    {
      series['displayInLegend'] = 'off';
    }

    var groupIndex = this._addGroup(amxNode, groupId, group, context);
    if (seriesId === null || groupIndex === null)
    {
      series['items'][series['items'].length] = dataItem;
    }
    else
    {
      series['items'][groupIndex] = dataItem;
    }

    // process marker attributes
    var attributeGroupsNodes = markerNode.getChildren();
    for (var i = 0; i < attributeGroupsNodes.length; i++)
    {
      var attrGroupsNode = attributeGroupsNodes[i];

      if (attrGroupsNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(attrGroupsNode.getAttribute('rendered')))
        continue;// skip unrendered nodes
      if (!attrGroupsNode.isReadyToRender())
      {
        throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException();
      }

      AttributeGroupManager.processAttributeGroup(attrGroupsNode, amxNode, context);
    }

    // add the marker to the model
    AttributeGroupManager.registerDataItem(context, dataItem, null);

    return true;
  };

  ChartDataItemRenderer.prototype._hasAction = function (markerNode)
  {
    if (markerNode.isAttributeDefined('action'))
    {
      return true;
    }

    var actionTags;
    // should fire action, if there are any 'setPropertyListener' or 'showPopupBehavior' child tags
    actionTags = markerNode.getTag().getChildren(adf.mf.internal.dvt.AMX_NAMESPACE, 'setPropertyListener');
    if (actionTags.length > 0)
      return true;

    actionTags = markerNode.getTag().getChildren(adf.mf.internal.dvt.AMX_NAMESPACE, 'showPopupBehavior');
    if (actionTags.length > 0)
      return true;

    return false;
  };

  ChartDataItemRenderer.prototype._getSeriesId = function (markerNode)
  {
    var seriesId = null;
    if (markerNode.isAttributeDefined('seriesId'))
    {
      seriesId = markerNode.getAttribute('seriesId');
    }

    if (seriesId === null && markerNode.isAttributeDefined('series'))
    {
      seriesId = markerNode.getAttribute('series');
    }

    return seriesId || null;
  };

  /**
   *  adds a new group to the groups array
   *
   *  if groupId exists, the group is identified by groupId, and a new groups
   *  item is created as: {'id': groupId, name: group}
   *  if groupId is missing, the group is identified by the 'group' parameter
   *  and the groups item is a plain string
   */
  ChartDataItemRenderer.prototype._addGroup = function (amxNode, groupId, group, context)
  {
    if (groupId && context['groupIds'] && context['groupIds'][groupId] != null)
    {
      return context['groupIds'][groupId];
    }

    var options = this.GetDataObject(amxNode);
    var groups = options['groups'];
    var g;

    for (g = 0; g < groups.length; g++)
    {
      if ((groupId && groups[g]['id'] === groupId)
        || groups[g]['name'] === group)
      {
        return g;  
      }
    }

    g = null;
    if (group || groupId)
    {
      var newGroup = {};
  
      if (group)
      {
        newGroup['name'] = group;
      }

      if (groupId)
      {
        newGroup['id'] = groupId;
      }

      g = groups.length;
      groups[groups.length] = newGroup;
    }

    return g;
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/ChartDefaults.js
 */
(function(){
  
  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.chart');

  adf.mf.internal.dvt.chart.DefaultChartStyle = {};

  adf.mf.internal.dvt.chart.DefaultChartStyle.SKIN_NEXT = 
  {
    // set default skin family
    'skin' : 'next'
  }

  adf.mf.internal.dvt.chart.DefaultChartStyle.SKIN_ALTA = 
  {
    // set default skin family
    'skin' : 'alta',
    // common chart properties
    // chart title separator properties
    'titleSeparator' : 
    {
      // separator upper color
      'upperColor' : "#74779A", 
      // separator lower color
      'lowerColor' : "#FFFFFF", 
      // should display title separator
      'rendered' : false
    },

    // default style values
    'styleDefaults' : 
    {
      // default color palette
      'colors' : ["#267db3", "#68c182", "#fad55c", "#ed6647", "#8561c8", "#6ddbdb", 
                  "#ffb54d", "#e371b2", "#47bdef", "#a2bf39", "#a75dba", "#f7f37b"],
      // default marker shapes
      'shapes' : ['circle', 'square', 'diamond', 'plus', 'triangleUp', 'triangleDown', 'human'], 
      // series effect
      'seriesEffect' : "color"
    }

  };

  adf.mf.internal.dvt.chart.DefaultChartStyle.VERSION_1 = 
  {
    // set default skin family
    'skin' : 'skyros',
    // common chart properties
    // text to be displayed, if no data is provided
    'emptyText' : null, 
    // animation effect when the data changes
    'animationOnDataChange' : "none", 
    // animation effect when the chart is displayed
    'animationOnDisplay' : "none", 
    // time axis type - disabled / enabled / mixedFrequency
    'timeAxisType' : "disabled",

    // chart legend properties
    'legend' : 
    {
      // legend position none / auto / start / end / top / bottom
      'position' : "auto"
    },

    // default style values
    'styleDefaults' : 
    {
      // default color palette
      'colors' : ["#003366", "#CC3300", "#666699", "#006666", "#FF9900", "#993366", 
                  "#99CC33", "#624390", "#669933", "#FFCC33", "#006699", "#EBEA79"], 
      // default series patterns, use only if you want to modify default pattern set
      // 'patterns': ["smallDiagonalRight", "smallChecker", "smallDiagonalLeft", "smallTriangle", "smallCrosshatch", "smallDiamond", 
      //           "largeDiagonalRight", "largeChecker", "largeDiagonalLeft", "largeTriangle", "largeCrosshatch", "largeDiamond"],
      // default marker shapes
      'shapes' : ['circle', 'square', 'plus', 'diamond', 'triangleUp', 'triangleDown', 'human'], 
      // series effect (gradient, color, pattern)
      'seriesEffect' : "gradient", 
      // animation duration in ms
      'animationDuration' : 1000, 
      // animation indicators - all / none
      'animationIndicators' : "all", 
      // animation up color
      'animationUpColor' : "#0099FF", 
      // animation down color
      'animationDownColor' : "#FF3300", 
      // default line width (for line chart)
      'lineWidth' : 3, 
      // default line style (for line chart) - solid / dotted / dashed
      'lineStyle' : "solid", 
      // should markers be displayed (in line and area charts)
      'markerDisplayed' : "off", 
      // default marker color
      'markerColor' : null, 
      // default marker shape
      'markerShape' : "auto", 
      // default marker size
      'markerSize' : 8, 
      // pie feeler color (pie chart only)
      'pieFeelerColor' : "#BAC5D6", 
      // slice label position and text type (pie chart only)
      'sliceLabel' : 
      {
        'position' : "outside", 'textType' : "percent"
      },
      'stockRisingColor': '#6b6f74',
      'stockFallingColor': '#ED6647',
      'stockRangeColor': '#B8B8B8'
    },
    '_resources' :
    {
      'panUp' :       'css/images/chart/pan-up.png',
      'panDown' :     'css/images/chart/pan-down.png',
      'zoomUp' :      'css/images/chart/zoom-up.png',
      'zoomDown' :    'css/images/chart/zoom-down.png',
      'selectUp' :    'css/images/chart/marquee-up.png',
      'selectDown' :  'css/images/chart/marquee-down.png'
    }
  };

  adf.mf.internal.dvt.chart.DefaultSparkChartStyle = {};
  
  adf.mf.internal.dvt.chart.DefaultSparkChartStyle.SKIN_ALTA = {
    'skin' : "alta",
    'color' : "#267db3"
  };

  adf.mf.internal.dvt.chart.DefaultSparkChartStyle.VERSION_1 = {
    'skin' : "skyros",
    'type' : "line",
    'animationOnDisplay' : "none",
    'animationOnDataChange' : "none",
    'emptyText' : null, 
    'color' : "#666699",
    'firstColor' : null, 
    'lastColor' : null, 
    'highColor' : null, 
    'lowColor' : null,  
    'visualEffects' : "auto",
    'lineWidth' : 1,
    'lineStyle' : "solid",
    'markerSize' : 5,
    'markerShape' : "auto"
  };  
  
  adf.mf.internal.dvt.chart.DEFAULT_SPARK_OPTIONS = 
  {
    'type' : "line", 
    'color' : "#00FF00"
  }
})();
/* Copyright (c) 2013, 2015, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/ChartGroupRenderer.js
 */
(function ()
{
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;

  var ChartGroupRenderer = function ()
  { };

  adf.mf.internal.dvt.DvtmObject.createSubclass(ChartGroupRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.chart.ChartGroupRenderer');

  ChartGroupRenderer.prototype.GetChildRenderers = function (facetName)
  {
    var _renderer = this;
    return { 'chartGroup' : { 'renderer' : _renderer } };
  };

  ChartGroupRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = ChartGroupRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['group'] = {'path' : 'name', 'type' : AttributeProcessor['TEXT']};
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
    attrs['labelStyle'] = {'path' : 'labelStyle', 'type' : AttributeProcessor['TEXT']};
    // on/off
    attrs['drilling'] = {'path' : 'drilling', 'type' : AttributeProcessor['TEXT']};
    return attrs;
  };
  
  ChartGroupRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {
    var id = amxNode.getAttribute('groupId');
    var name = amxNode.getAttribute('group');
    
    var groupItem = null;
    options["groups"] = options['groups'] || [];
    
    for (var i = 0, l = options["groups"].length; i < l; i++)
    {
      if (options["groups"][i]["name"] === name)
      {
        groupItem = options["groups"][i];
        break;
      }
    }

    if (groupItem === null)
    {
      groupItem = {};
      options["groups"].push(groupItem);
      
      ChartGroupRenderer.superclass.ProcessAttributes.call(this, groupItem, amxNode, context);
      
      if (id)
      {
        context['groupOrder'] = context['groupOrder'] || 0;
        context['groupIds'] = context['groupIds'] || {};
        context['groupIds'][amxNode.getAttribute('groupId')] = context['groupOrder'];
        context['groupOrder']++;
      }
    }

    context["_items"] = context["_items"] || [];
    
    context["_groupItem"] = groupItem;
  };

  ChartGroupRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {
    var groupItem = context["_groupItem"];
    if (!groupItem)
    {
      return false;
    }

    delete context["_groupItem"];

    return ChartGroupRenderer.superclass.ProcessChildren.call(this, groupItem, amxNode, context);
  };

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/ComboChartRenderer.js
 */
(function(){

  var ComboChartRenderer = function ()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(ComboChartRenderer, 'adf.mf.internal.dvt.chart.BaseChartRenderer', 'adf.mf.internal.dvt.chart.ComboChartRenderer');
  
  ComboChartRenderer.prototype.GetChartType = function ()
  {
    return 'combo';
  }
  
  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'comboChart', ComboChartRenderer);
})();
/* Copyright (c) 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/FunnelChartDefaults.js
 */
(function(){

  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.funnelChart');
  
  adf.mf.internal.dvt.funnelChart.DefaultFunnelChartStyle = 
  {
    // default style values
    'styleDefaults': {
      'backgroundColor' : 'lightgrey'
    }
  };
})();
/* Copyright (c) 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/FunnelChartRenderer.js
 */
(function(){

  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
  
  var FunnelChartRenderer = function ()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(FunnelChartRenderer, 'adf.mf.internal.dvt.chart.BaseChartRenderer', 'adf.mf.internal.dvt.chart.FunnelChartRenderer');
  
  FunnelChartRenderer.prototype.GetChartType = function ()
  {
    return 'funnel';
  }
  
  FunnelChartRenderer.prototype.GetStampedFacetNames = function ()
  {
    return ['dataStamp']; 
  }
 
  /**
   * Returns the name of the stamped child tag.
   * @param {String} facetName optional facet name where the stamped child lives 
   * @return {String} stamped child tag name
   */
  FunnelChartRenderer.prototype.GetStampedChildTagName = function(facetName)
  {
    switch (facetName)
    {
      case 'dataStamp':
        return 'funnelDataItem';
        
      default:
        return null;
    }
  };
  
  FunnelChartRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {
    return FunnelChartRenderer.superclass.ProcessChildren.call(this, options, amxNode, context);
  }
    
  /**
   * Function processes supported attributes which are on amxNode. This attributes
   * should be converted into the options object.
   *
   * @param options main component options object
   * @param amxNode child amxNode
   * @param context processing context
   */
  FunnelChartRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {
    var changed = FunnelChartRenderer.superclass.ProcessAttributes.call(this, options, amxNode, context);
    var attr;
    
    if (amxNode.isAttributeDefined('sliceGaps'))
    {
      attr = amxNode.getAttribute('sliceGaps');
      // convert 'on/off' to newly supported values
      if (attr === 'on')
      {
        attr = '100%';
      }
      else if (attr === 'off')
      {
        attr = '0%';
      }
      options['styleDefaults']['sliceGaps'] = AttributeProcessor['PERCENTAGE'](attr);
    }
    
    return changed;
  }
  
  /**
   * processes the components's child tags
   */
  FunnelChartRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      this._renderers =
        {
          'facet':
            {
             'dataStamp' :
               {
                 'funnelDataItem' : { 'renderer' : new adf.mf.internal.dvt.chart.FunnelDataItemRenderer() }
               }
            },
          'simple' :
            {
              'chartValueFormat' : { 'renderer' : new adf.mf.internal.dvt.common.format.FormatRenderer('*'), 'order' : 2, 'maxOccurrences' : 1 },
              'legend' : { 'renderer' : new adf.mf.internal.dvt.common.legend.LegendRenderer(), 'order' : 3, 'maxOccurrences' : 1 }
            }
        }
    }
    
    if(facetName !== undefined)
    {
      return this._renderers['facet'][facetName];
    }

    return this._renderers['simple'];
  }
  
  FunnelChartRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = FunnelChartRenderer.superclass.GetAttributesDefinition.call(this);
    // Defines whether the chart is displayed with a 3D effect. Only applies to pie and funnel charts.
    attrs['threeDEffect'] = {'path' : 'styleDefaults/threeDEffect', 'type' : AttributeProcessor['TEXT']};

    return attrs;
  }
    
  FunnelChartRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = FunnelChartRenderer.superclass.GetStyleClassesDefinition.call(this);
    
    styleClasses['dvtm-funnelDataItem'] = [
      {'path' : 'styleDefaults/borderColor', 'type' : StyleProcessor['BORDER_COLOR']},
      {'path' : 'styleDefaults/backgroundColor', 'type' : StyleProcessor['BACKGROUND']}
    ];
    
    return styleClasses; 
  }
  FunnelChartRenderer.prototype.GetDefaultStyles = function (amxNode)
  {
    return adf.mf.internal.dvt.funnelChart.DefaultFunnelChartStyle;
  }
  FunnelChartRenderer.prototype.PopulateCategories = function() {
    return true;
  };

  FunnelChartRenderer.prototype.PreventsSwipe = function (amxNode)
  {
    // funnel chart should not prevent swipe/drag gestures
    return false;
  }

  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'funnelChart', FunnelChartRenderer); 
})();
/* Copyright (c) 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/FunnelDataItemRenderer.js
 */
(function(){

  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
  
  var FunnelDataItemRenderer = function ()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(FunnelDataItemRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.chart.FunnelDataItemRenderer');
  
FunnelDataItemRenderer.prototype.ProcessAttributes = function (options, funnelDataItemNode, context)
  {
    var amxNode = context['amxNode'];
    
    var label;
    if (funnelDataItemNode.isAttributeDefined('label'))
    {
      label = funnelDataItemNode.getAttribute('label') + '';  // make sure label is passed as a string
    }

    var val = funnelDataItemNode.getAttribute('value');
    var action;

    
    var dataItem = {};
    
    // process attribute groups, if any
    dataItem['attrGroups'] = [];
    var attributeGroupsNodes = funnelDataItemNode.getChildren();
    var iter = adf.mf.api.amx.createIterator(attributeGroupsNodes);
    while (iter.hasNext()) {
      var attributeGroupsNode = iter.next();
      if (!attributeGroupsNode.isReadyToRender())
        {
          throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException();
        }
      AttributeGroupManager.processAttributeGroup(attributeGroupsNode, amxNode, context);
    }
    
    // for funnelChart we use value, not 'y'
    dataItem['value'] =  + val;
  
    if (funnelDataItemNode.isAttributeDefined('action'))
    {
      action = context['_rowKey'];
    }
    else 
    {
      var actionTags;
      var firesAction = false;
      // should fire action, if there are any 'setPropertyListener' or 'showPopupBehavior' child tags  
      actionTags = funnelDataItemNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'setPropertyListener');
      if (actionTags.length > 0)
        firesAction = true;
      else 
      {
        actionTags = funnelDataItemNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'showPopupBehavior');
        if (actionTags.length > 0)
          firesAction = true;
      }
      if (firesAction)
      {
        // need to set 'action' to some value to make the event fire
        action = context['_rowKey'];
      }
    }
 
    if (action !== undefined)
    {
      dataItem['action'] = action;
    }
    
    dataItem['id'] = funnelDataItemNode.getId();

    if (funnelDataItemNode.isAttributeDefined('shortDesc'))
    {
      dataItem['shortDesc'] = funnelDataItemNode.getAttribute('shortDesc');
    }
    // data item labels
    if (funnelDataItemNode.isAttributeDefined('label'))
    {
      dataItem['label'] = funnelDataItemNode.getAttribute('label') + '';
    }
    if (funnelDataItemNode.isAttributeDefined('labelStyle'))
    {
      dataItem['labelStyle'] = funnelDataItemNode.getAttribute('labelStyle') + '';
    }    
    if (funnelDataItemNode.isAttributeDefined('targetValue'))
    {
      dataItem['targetValue'] = + funnelDataItemNode.getAttribute('targetValue');
    }
    
    // on/off
    if (funnelDataItemNode.isAttributeDefined('drilling'))
    {
      dataItem['drilling'] = funnelDataItemNode.getAttribute('drilling');
    }

    var slice = 
    {
      'id' : label, 'name' : funnelDataItemNode.getAttribute('label') + '', 'items' : [dataItem]
    };

    if (funnelDataItemNode.isAttributeDefined('color'))
    {
      slice['color'] = funnelDataItemNode.getAttribute('color');
    }    
    if (funnelDataItemNode.isAttributeDefined('borderColor'))
    {
      slice['borderColor'] = funnelDataItemNode.getAttribute('borderColor');
    }

    this._addSeriesItem(options, slice);

    AttributeGroupManager.registerDataItem(context, dataItem, null);    
    return true;
  }
  
  /**
   * adds a name/data pair to the series.  The item must be of type
   * { name: X, 'data': Y }.
   */
  FunnelDataItemRenderer.prototype._addSeriesItem = function (options, item)
  {
    options['series'].push(item);
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/HorizontalBarChartRenderer.js
 */
(function(){

  var HorizontalBarChartRenderer = function ()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(HorizontalBarChartRenderer, 'adf.mf.internal.dvt.chart.BaseChartRenderer', 'adf.mf.internal.dvt.chart.HorizontalBarChartRenderer');
  
  HorizontalBarChartRenderer.prototype.GetChartType = function ()
  {
    return 'horizontalBar';
  }
  
  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'horizontalBarChart', HorizontalBarChartRenderer);
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/LineChartRenderer.js
 */
(function(){

  var LineChartRenderer = function ()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(LineChartRenderer, 'adf.mf.internal.dvt.chart.BaseChartRenderer', 'adf.mf.internal.dvt.chart.LineChartRenderer');
  
  LineChartRenderer.prototype.GetChartType = function ()
  {
    return 'line';
  }
  
  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'lineChart', LineChartRenderer);
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/PieChartRenderer.js
 */
(function(){

  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
  
  var PieChartRenderer = function ()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(PieChartRenderer, 'adf.mf.internal.dvt.chart.BaseChartRenderer', 'adf.mf.internal.dvt.chart.PieChartRenderer');
  
  PieChartRenderer.prototype.GetChartType = function ()
  {
    return 'pie';
  }
  
  PieChartRenderer.prototype.GetStampedFacetNames = function ()
  {
    return ['dataStamp']; 
  }
  
  /**
   * Returns the name of the stamped child tag.
   * @param {String} facetName optional facet name where the stamped child lives 
   * @return {String} stamped child tag name
   */
  PieChartRenderer.prototype.GetStampedChildTagName = function(facetName)
  {
    switch (facetName)
    {
      case 'dataStamp':
        return 'pieDataItem';
        
      default:
        return null;
    }
  }
  
  PieChartRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {
    return PieChartRenderer.superclass.ProcessChildren.call(this, options, amxNode, context);
  }
  
  /**
   * processes the components's child tags
   */
  PieChartRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      this._renderers =
        {
          'facet':
            {
             'dataStamp' :
               {
                 'pieDataItem' : { 'renderer' : new adf.mf.internal.dvt.chart.PieDataItemRenderer() }
               }
            },
          'simple' :
            {
              'sliceLabel' : { 'renderer' : new adf.mf.internal.dvt.common.format.SliceLabelFormatRenderer(), 'order' : 1, 'maxOccurrences' : 1 },
              'pieValueFormat' : { 'renderer' : new adf.mf.internal.dvt.common.format.FormatRenderer('PIE'), 'order' : 2, 'maxOccurrences' : 1 },
              'chartValueFormat' : { 'renderer' : new adf.mf.internal.dvt.common.format.FormatRenderer('*'), 'order' : 2, 'maxOccurrences' : 1 },
              'legend' : { 'renderer' : new adf.mf.internal.dvt.common.legend.LegendRenderer(), 'order' : 3, 'maxOccurrences' : 1 }
            }
        }
    }
    
    if(facetName !== undefined)
    {
      return this._renderers['facet'][facetName];
    }

    return this._renderers['simple'];
  }
  
  PieChartRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = PieChartRenderer.superclass.GetAttributesDefinition.call(this);
    attrs['sliceLabelPosition'] = {'path' : 'styleDefaults/sliceLabelPosition', 'type' : AttributeProcessor['TEXT']};
    attrs['sliceLabelType'] = {'path' : 'styleDefaults/sliceLabelType', 'type' : AttributeProcessor['TEXT']};
    // attrs['sliceLabelStyle'] = {'path' : 'styleDefaults/sliceLabelStyle', 'type' : AttributeProcessor['TEXT']};
    attrs['threeDEffect'] = {'path' : 'styleDefaults/threeDEffect', 'type' : AttributeProcessor['TEXT']};
    attrs['otherColor'] = {'path' : 'styleDefaults/otherColor', 'type' : AttributeProcessor['TEXT']};
    attrs['sorting'] = {'path' : 'sorting', 'type' : AttributeProcessor['TEXT']};
    attrs['otherThreshold'] = {'path' : 'otherThreshold', 'type' : AttributeProcessor['PERCENTAGE']};
    attrs['innerRadius'] = {'path' : 'styleDefaults/pieInnerRadius', 'type' : AttributeProcessor['PERCENTAGE']};
    attrs['centerLabel'] = {'path' : 'pieCenterLabel/text', 'type' : AttributeProcessor['TEXT']};
    attrs['selectionEffect'] = {'path' : 'styleDefaults/selectionEffect', 'type' : AttributeProcessor['TEXT']};
    attrs['sliceGaps'] = {'path' : 'styleDefaults/sliceGaps', 'type' : AttributeProcessor['PERCENTAGE']};

    return attrs;
  }
  
  /**
   * We are trying to keep support for old sliceLabel element, as well as sliceLabel in styleDefaults,
   * but we use it only if new version in styleDefaults is not defined!
   * Bug 17198620 - uptake chart json api changes for slicelabel
   * @author midrozd
   */
  PieChartRenderer.prototype.MergeComponentOptions = function (amxNode, options)
  {
    options = PieChartRenderer.superclass.MergeComponentOptions.call(this, amxNode, options);
    
    var styleDefaults = options['styleDefaults'];
    if (styleDefaults && styleDefaults['sliceLabel'])
    {
      var sliceLabelOptions = styleDefaults['sliceLabel'];
      if (sliceLabelOptions)
      {
        if (styleDefaults['sliceLabelPosition'] === undefined && sliceLabelOptions['position'])
          styleDefaults['sliceLabelPosition'] = sliceLabelOptions['position'];
        if (styleDefaults['sliceLabelType'] === undefined && sliceLabelOptions['textType'])
          styleDefaults['sliceLabelType'] = sliceLabelOptions['textType'];
        if (styleDefaults['sliceLabelStyle'] === undefined && sliceLabelOptions['style'])
          styleDefaults['sliceLabelStyle'] = sliceLabelOptions['style'];

      }
    }
    return options;
  }
  
  PieChartRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = PieChartRenderer.superclass.GetStyleClassesDefinition.call(this);
    
    styleClasses['dvtm-chartPieLabel'] = {'path' : 'styleDefaults/pieLabelStyle', 'type' : StyleProcessor['CSS_TEXT']};
    styleClasses['dvtm-chartSliceLabel'] = {'path' : 'styleDefaults/sliceLabelStyle', 'type' : StyleProcessor['CSS_TEXT']};
    styleClasses['dvtm-chartPieCenterLabel'] = {'path' : 'pieCenterLabel/style', 'type' : StyleProcessor['CSS_TEXT']};
    
    return styleClasses; 
  }
  
  /**
   * Renders instance of the component
   */
  PieChartRenderer.prototype.RenderComponent = function(instance, width, height, amxNode)
  {
    var options = this.GetDataObject(amxNode);
    // if pieCenterLabel has no 'text' property, remove it
    if (options && options['pieCenterLabel'] && !options['pieCenterLabel']['text'])
    {
      delete options['pieCenterLabel'];
    }
    PieChartRenderer.superclass.RenderComponent.call(this, instance, width, height, amxNode);
  }   
  
  
  PieChartRenderer.prototype.PreventsSwipe = function (amxNode)
  {
    // pie chart does not prevent swipe gestures
    return false;
  }
  
  PieChartRenderer.prototype.CreateAttributeGroupConfig = function ()
  {
    var pattern = adf.mf.internal.dvt.common.attributeGroup.DefaultPalettesValueResolver.PATTERN;
    
    // pattern is set on the data item
    // there is currently one to one mapping between slices and data items -> set the pattern on corresponding data item
    var callback = function(value, sliceItem) {
      sliceItem['items'][0]['pattern'] = value;
    };
    
    var config = PieChartRenderer.superclass.CreateAttributeGroupConfig.call(this);
    config.addUpdateValueCallback(pattern, callback);
    return config;
  }
  
  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'pieChart', PieChartRenderer); 
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/PieDataItemRenderer.js
 */
(function(){

  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;

  var PieDataItemRenderer = function ()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(PieDataItemRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.chart.PieDataItemRenderer');
  
  PieDataItemRenderer.prototype.ProcessAttributes = function (options, pieDataItemNode, context)
  {
    var sliceId;
    if (pieDataItemNode.isAttributeDefined('sliceId'))
    {
      sliceId = pieDataItemNode.getAttribute('sliceId') + '';  // make sure sliceId is passed as a string
    }
    else 
    {
      sliceId = pieDataItemNode.getAttribute('label') + '';  // make sure sliceId is passed as a string
    }

    var val = pieDataItemNode.getAttribute('value');
    var action;

    if (pieDataItemNode.isAttributeDefined('action'))
    {
      action = context['_rowKey'];
    }
    else 
    {
      var actionTags;
      var firesAction = false;
      // should fire action, if there are any 'setPropertyListener' or 'showPopupBehavior' child tags  
      actionTags = pieDataItemNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'setPropertyListener');
      if (actionTags.length > 0)
        firesAction = true;
      else 
      {
        actionTags = pieDataItemNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'showPopupBehavior');
        if (actionTags.length > 0)
          firesAction = true;
      }
      if (firesAction)
      {
        // need to set 'action' to some value to make the event fire
        action = context['_rowKey'];
      }
    }
    var dataItem = {};
    
    dataItem['y'] =  + val;
    
    if (action !== undefined)
    {
      dataItem['action'] = action;
    }
    
    dataItem['id'] = pieDataItemNode.getId();

    if (pieDataItemNode.isAttributeDefined('shortDesc'))
    {
      dataItem['shortDesc'] = pieDataItemNode.getAttribute('shortDesc');
    }
    
    if (pieDataItemNode.isAttributeDefined('pattern'))
    {
      dataItem['pattern'] = pieDataItemNode.getAttribute('pattern');
    }
    
    // on/off
    if (pieDataItemNode.isAttributeDefined('drilling'))
    {
      dataItem['drilling'] = pieDataItemNode.getAttribute('drilling');
    }

    var slice = 
    {
      'id' : sliceId, 'name' : pieDataItemNode.getAttribute('label') + '', 'items' : [dataItem]
    };

    if (pieDataItemNode.isAttributeDefined('explode'))
    {
      var explode = parseFloat(pieDataItemNode.getAttribute('explode'));
      // Bug 18154290 - JSON API pieSliceExplode values are [0..1]
      if (explode > 1)
        explode = explode / 100;
      slice['pieSliceExplode'] = explode;
    }
    if (pieDataItemNode.isAttributeDefined('color'))
    {
      slice['color'] = pieDataItemNode.getAttribute('color');
    }
    if (pieDataItemNode.isAttributeDefined('borderColor'))
    {
      slice['borderColor'] = pieDataItemNode.getAttribute('borderColor');
    }
    if (pieDataItemNode.isAttributeDefined('displayInLegend'))
    {
      slice['displayInLegend'] = pieDataItemNode.getAttribute('displayInLegend');
    }
    // data item labels
    if (pieDataItemNode.isAttributeDefined('sliceLabel'))
    {
      // make sure a number is passed if possible
      var strLabel = pieDataItemNode.getAttribute('sliceLabel');
      var numLabel = parseFloat(strLabel);
      if ((numLabel + '') == strLabel)
      {
        dataItem['label'] = numLabel;
      }
      else
      {
        dataItem['label'] = strLabel;
      }
    }
    this._addSeriesItem(options, slice);

    var amxNode = context['amxNode'];
    
    var attributeGroupsNodes = pieDataItemNode.getChildren();
    var iter3 = adf.mf.api.amx.createIterator(attributeGroupsNodes);
    while (iter3.hasNext())
    {
      var attrGroupsNode = iter3.next();

      if (attrGroupsNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(attrGroupsNode.getAttribute('rendered')))
        continue;         // skip unrendered nodes

      if (!attrGroupsNode.isReadyToRender())
      {
        throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException();
      }
      
      AttributeGroupManager.processAttributeGroup(attrGroupsNode, amxNode, context);
    }
    
    AttributeGroupManager.registerDataItem(context, slice, null);
    
    return true;
  }
  
  /**
   * adds a name/data pair to the series.  The item must be of type
   * { name: X, 'data': Y }.
   */
  PieDataItemRenderer.prototype._addSeriesItem = function (options, item)
  {
    options['series'].push(item);
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/ScatterChartRenderer.js
 */
(function(){

  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;

  var ScatterChartRenderer = function ()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(ScatterChartRenderer, 'adf.mf.internal.dvt.chart.BaseChartRenderer', 'adf.mf.internal.dvt.chart.ScatterChartRenderer');
  
  ScatterChartRenderer.prototype.GetChartType = function ()
  {
    return 'scatter';
  }
  
  ScatterChartRenderer.prototype.PopulateCategories = function() {
    return true;
  };

  
  ScatterChartRenderer.prototype.GetDefaultStyles = function (amxNode)
  {
    var currentStyle = ScatterChartRenderer.superclass.GetDefaultStyles.call(this, amxNode);
    // need to override the default style for scatter chart, markers should be on by default
    currentStyle['styleDefaults']['markerDisplayed'] = 'on';
    return currentStyle;
  }
    
  ScatterChartRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = ScatterChartRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['markerDisplayed'] = {'path' : 'markerDisplayed', 'type' : AttributeProcessor['TEXT']};
    
    return attrs;
  };
  
  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'scatterChart', ScatterChartRenderer); 
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/SeriesHelper.js
 */
(function ()
{
  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.chart');

  var SeriesHelper = 
  {};

  adf.mf.internal.dvt.chart.SeriesHelper = SeriesHelper;

  /**
   * returns a reference to the series object.  First tries to find
   * the existing series by its id. If not found, creates a new series
   * object with the name and empty data array.
   */
  SeriesHelper.getSeriesByIdAndName = function (amxNode, id, name)
  {
    var options = amxNode.getAttribute(adf.mf.internal.dvt.BaseRenderer.DATA_OBJECT);
    var series = options['series'];
    var groups = options['groups'];
    var hiddenSeries = false;
    // use default id to mark default series
    if (id === null)
    {
      id = "_1";
      hiddenSeries = true;
    }

    // find existing series or create a new one
    for (var s = 0;s < series.length;s++)
    {
      if (series[s]['id'] === id)
      {
        return series[s];
      }
    }

    var ser = { 'id' : id, 'name' : name };
    // default series should not be displayed in legend
    if (hiddenSeries)
    {
      ser['displayInLegend'] = 'off';
      ser['items'] = [];
    }
    else 
    {
      var items = new Array(groups.length);
      for (var i = 0; i < groups.length; i++)
      {
        items[i] = null;
      }
      // create legend with default setting and prepared array of items
      ser['displayInLegend'] = 'on';
      ser['items'] = items;
    }
    // add it to the end of the list of series
    series[series.length] = ser;

    return ser;
  };

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/SeriesStyleRenderer.js
 */
(function()
{
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;

  var SeriesStyleRenderer = function (chartType)
  {
    this._typeAttrSupported = chartType === 'combo' || chartType === 'stock' || chartType === 'line';
    this._chartType = chartType;
  }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(SeriesStyleRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.chart.SeriesStyleRenderer');
   
  SeriesStyleRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = SeriesStyleRenderer.superclass.GetAttributesDefinition.call(this);

    // Bug 19423990 - bar chart displays lines not bars
    // this is only case of the Combo Chart so disable this attribute for all other chart types
    if (this._typeAttrSupported)
    {
      attrs['type'] = {'path' : 'type', 'type' : AttributeProcessor['TEXT'], 'default' : 'line'};
    }
    attrs['color'] = {'path' : 'color', 'type' : AttributeProcessor['TEXT']};
    attrs['pattern'] = {'path' : 'pattern', 'type' : AttributeProcessor['TEXT']};
    attrs['borderColor'] = {'path' : 'borderColor', 'type' : AttributeProcessor['TEXT']};
    attrs['markerDisplayed'] = {'path' : 'markerDisplayed', 'type' : AttributeProcessor['ON_OFF']};
    attrs['markerShape'] = {'path' : 'markerShape', 'type' : AttributeProcessor['TEXT']};  
    attrs['markerColor'] = {'path' : 'markerColor', 'type' : AttributeProcessor['TEXT']};
    attrs['markerSize'] = {'path' : 'markerSize', 'type' : AttributeProcessor['INTEGER']};
    attrs['lineWidth'] = {'path' : 'lineWidth', 'type' : AttributeProcessor['INTEGER']};
    attrs['lineStyle'] = {'path' : 'lineStyle', 'type' : AttributeProcessor['TEXT']};
    attrs['lineType'] = {'path' : 'lineType', 'type' : AttributeProcessor['TEXT']};
    attrs['assignedToY2'] = {'path' : 'assignedToY2', 'type' : AttributeProcessor['ON_OFF']};
    // Bug 16757581 - ADD DISPLAYINLEGEND ATTRIBUTE TO PIEDATAITEM AND CHARTSERIESSTYLE
    attrs['displayInLegend'] = {'path' : 'displayInLegend', 'type' : AttributeProcessor['TEXT']};
    attrs['areaColor'] = {'path' : 'areaColor', 'type' : AttributeProcessor['TEXT']};
    attrs['stackCategory'] = {'path' : 'stackCategory', 'type' : AttributeProcessor['TEXT']};
    // on/off
    attrs['drilling'] = {'path' : 'drilling', 'type' : AttributeProcessor['TEXT']};
    return attrs;
  } 
  /**
   * Update options series with seriesStyleNode data
   */
  SeriesStyleRenderer.prototype.ProcessAttributes = function (options, seriesStyleNode, context)
  {
    // do not apply the style, if 'rendered' is defined and evaluates to false
    if (seriesStyleNode.isAttributeDefined('rendered'))
    {
      if (adf.mf.api.amx.isValueFalse(seriesStyleNode.getAttribute('rendered')))
        return false;
    }
    
    if (!context['__processedSeriesIDs']) 
    {
        context['__processedSeriesIDs'] = {};
    }
    
    // seriesStyle can be matched on seriesId or series, seriesId takes precedence, if present
    var seriesId = null;
    if (seriesStyleNode.isAttributeDefined('seriesId'))
    {
      seriesId = seriesStyleNode.getAttribute('seriesId');
    }
    var seriesName = null;
    if (seriesStyleNode.isAttributeDefined('series'))
    {
      seriesName = seriesStyleNode.getAttribute('series');
    }
    if (!seriesId && !seriesName)
    {
      // no id to match this seriesStyle on, exit
      return false;
    }
    else if (!seriesId)
    {
      seriesId = seriesName;
    }
    
    if (context['__processedSeriesIDs'][seriesId] === true)
    {
      return false;
    }    
    else 
    {
      context['__processedSeriesIDs'][seriesId] = true;
    }

    // find the series item to be updated
    var ser = adf.mf.internal.dvt.chart.SeriesHelper.getSeriesByIdAndName(context['amxNode'], seriesId, seriesName);

    var action;
    if (seriesStyleNode.isAttributeDefined('action') || seriesStyleNode.isAttributeDefined('actionListener'))
    {
      action = context['_rowKey'];
    }
    else 
    {
      var actionTags;
      var firesAction = false;
      // should fire action, if there are any 'setPropertyListener' or 'showPopupBehavior' child tags  
      actionTags = seriesStyleNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'setPropertyListener');
      if (actionTags.length > 0)
        firesAction = true;
      else 
      {
        actionTags = seriesStyleNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'showPopupBehavior');
        if (actionTags.length > 0)
          firesAction = true;
      }
      if (firesAction)
      {
        // need to set 'action' to some value to make the event fire
        action = context['_rowKey'];
      }
    }    
    
    if (action !== undefined)
    {
      ser['action'] = action;
    }
 
    return SeriesStyleRenderer.superclass.ProcessAttributes.call(this, ser, seriesStyleNode, context);
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/SparkChartRenderer.js
 */
(function(){

  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
  
  var SparkChartRenderer = function ()
  { }
  
  SparkChartRenderer.DEFAULT_HEIGHT = 100;

  adf.mf.internal.dvt.DvtmObject.createSubclass(SparkChartRenderer, 'adf.mf.internal.dvt.DataStampRenderer', 'adf.mf.internal.dvt.chart.SparkChartRenderer');

  SparkChartRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = SparkChartRenderer.superclass.GetAttributesDefinition.call(this);
    
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
    attrs['emptyText'] = {'path' : 'emptyText', 'type' : AttributeProcessor['TEXT']};
    attrs['type'] = {'path' : 'type', 'type' : AttributeProcessor['TEXT']};
    attrs['animationOnDisplay'] = {'path' : 'animationOnDisplay', 'type' : AttributeProcessor['TEXT']};
    attrs['animationOnDataChange'] = {'path' : 'animationOnDataChange', 'type' : AttributeProcessor['TEXT']};
    attrs['animationDuration'] = {'path' : 'styleDefaults/animationDuration', 'type' : AttributeProcessor['INTEGER']};
    attrs['color'] = {'path' : 'color', 'type' : AttributeProcessor['TEXT']};
    attrs['firstColor'] = {'path' : 'firstColor', 'type' : AttributeProcessor['TEXT']};
    attrs['lastColor'] = {'path' : 'lastColor', 'type' : AttributeProcessor['TEXT']};
    attrs['highColor'] = {'path' : 'highColor', 'type' : AttributeProcessor['TEXT']};
    attrs['lowColor'] = {'path' : 'lowColor', 'type' : AttributeProcessor['TEXT']};
    attrs['baselineScaling'] = {'path' : 'baselineScaling', 'type' : AttributeProcessor['TEXT']};
    attrs['lineStyle'] = {'path' : 'lineStyle', 'type' : AttributeProcessor['TEXT']};
    attrs['lineWidth'] = {'path' : 'lineWidth', 'type' : AttributeProcessor['INTEGER']};
    attrs['lineType'] = {'path' : 'lineType', 'type' : AttributeProcessor['TEXT']};
    
    return attrs;
  }
  
  SparkChartRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = SparkChartRenderer.superclass.GetStyleClassesDefinition.call(this);
    
    styleClasses['_self'] = {'path' : 'plotArea/backgroundColor', 'type' : StyleProcessor['BACKGROUND']};
        
    return styleClasses; 
  }    
    
  /**
   * Initialize options for spark chart component.
   */
  SparkChartRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    SparkChartRenderer.superclass.InitComponentOptions.call(this, amxNode, options);
    
    options['titleSeparator'] =
      {
        'rendered' : 'off'
      };
    
    options['items'] = [];
    options['referenceObjects'] = [];

    amxNode['_stylesResolved'] = false;
  }
  
  SparkChartRenderer.prototype.GetCustomStyleProperty = function (amxNode)
  {
    return 'CustomChartStyle';
  }
  
  SparkChartRenderer.prototype.GetDefaultStyles = function (amxNode)
  {
    var currentStyle;
    
    if (!this.IsSkyros())
    {
      currentStyle = adf.mf.internal.dvt.util.JSONUtils.mergeObjects(adf.mf.internal.dvt.chart.DefaultSparkChartStyle.SKIN_ALTA, 
                                        adf.mf.internal.dvt.chart.DefaultSparkChartStyle.VERSION_1);
    }
    else
    {
      return adf.mf.internal.dvt.chart.DefaultSparkChartStyle.VERSION_1;
    }
    return currentStyle;
  }
  
  /**
   * Reset options for spark chart component.
   */
  SparkChartRenderer.prototype.ResetComponentOptions = function (amxNode, options, attributeChanges, descendentChanges)
  {
    SparkChartRenderer.superclass.ResetComponentOptions.call(this, amxNode, options, attributeChanges, descendentChanges);
    
    if (attributeChanges.getSize() > 0 || descendentChanges)
    {
      // if 'value' changed, the dataObject must be recreated from scratch
      if (attributeChanges.hasChanged('value') || descendentChanges)
      {
        options['items'] = [];
      }
      options['referenceObjects'] = [];
    }
  }
  
    /**
   * processes the components's child tags
   */
  SparkChartRenderer.prototype.GetChildRenderers = function (facetName)
  {
  
    if(this._renderers === undefined)
    {
      this._renderers = 
        {
          'facet' : 
            {
              'dataStamp' :
              {
                'sparkDataItem' : { 'renderer' : new adf.mf.internal.dvt.chart.SparkDataItemRenderer() }
              }              
            },
          'simple' :
            {
              'referenceObject' : { 'renderer' : new adf.mf.internal.dvt.common.axis.ReferenceObjectRenderer('spark') }
            }
        }
    }
    
    if(facetName)
    {
      return this._renderers['facet'][facetName];
    }
   
    return this._renderers['simple'];
  }
  
  SparkChartRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {    
    // if renderer detects design time mode than it skips standard 
    // child processing and only generates dummy data for graph.         
    if (adf.mf.environment.profile.dtMode)
    {
      this._processSparkDummyData(amxNode);
      return true;
    }
    else 
    {
      return SparkChartRenderer.superclass.ProcessChildren.call(this, options, amxNode, context);
    }
  }
  
  /**
   * @return supported facet's names
   */
  SparkChartRenderer.prototype.GetStampedFacetNames = function ()
  {
    return ['dataStamp']; 
  }
   
  /**
   * Returns the name of the stamped child tag.
   * @param {String} facetName optional facet name where the stamped child lives 
   * @return {String} stamped child tag name
   */
  SparkChartRenderer.prototype.GetStampedChildTagName = function(facetName)
  {
    switch (facetName)
    {
      case 'dataStamp':
        return 'sparkDataItem';
        
      default:
        return null;
    }
  };
  
  /**
   * Function creates new instance of DvtSparkChart
   */
  SparkChartRenderer.prototype.CreateToolkitComponentInstance = function(context, stageId, callbackObj, callback, amxNode)
  {
    var instance = DvtSparkChart.newInstance(context, null, null);
    context.getStage().addChild(instance);
    return instance;
  }  
 
  SparkChartRenderer.prototype.GetComponentHeight = function (node, amxNode)
  {
    var height =  SparkChartRenderer.superclass.GetComponentHeight.call(this, node, amxNode);
    if(height <= 1)
    {
      height = SparkChartRenderer.DEFAULT_HEIGHT;
    }
    return height;
  }
  
  /**
   * Function renders instance of the component
   */
  SparkChartRenderer.prototype.RenderComponent = function(instance, width, height, amxNode)
  { 
    var data = null;
    if(this.IsOptionsDirty(amxNode))
    {
      data = this.GetDataObject(amxNode);
    }
    instance.render(data, width, height);  
  }
  
  
  /**
   *  Instead of parsing value renderer preparse dummy data for spark graph.
   */
  SparkChartRenderer.prototype._processSparkDummyData = function (amxNode)
  {
    var options = this.GetDataObject(amxNode);
    if (options['items'] == undefined)
    {
      options['items'] = [];
    }

    // if color is not set than renderer sets default graph type.
    // Renderer also ignores el expressions.
    if (options['type'] == undefined || options['type'].indexOf("#{") == 0)
    {
      options['type'] = adf.mf.internal.dvt.chart.DEFAULT_SPARK_OPTIONS['type'];
    }

    // if color is not set than renderer sets default color.
    // Renderer also ignores el expressions.
    if (options['color'] == undefined || options['color'].indexOf("#{") == 0)
    {
      options['color'] = adf.mf.internal.dvt.chart.DEFAULT_SPARK_OPTIONS['color'];
    }

    // renderer prepares data for graph based with default marker setting.
    var items = options['items'];

    var definition = adf.mf.internal.dvt.ComponentDefinition.getComponentDefinition(amxNode.getTag().getName());
    var dtModeData = definition.getDTModeData();
      
    var iter = adf.mf.api.amx.createIterator(dtModeData);

    while (iter.hasNext())
    {
      var item = 
      {
        'markerDisplayed' : false,
        'rendered' : 'on',
        'value' : iter.next()
      };

      items.push(item);
    }
  }

  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'sparkChart', SparkChartRenderer);
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/SparkDataItemRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  
  var SparkDataItemRenderer = function()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(SparkDataItemRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.chart.SparkDataItemRenderer');
  
  /**
   * parses the sparkDataItem node attributes
   *
   * sparkDataItem has the following attributes
   *
   *   color            - String(Color): support CSS color values
   *   date             - Number: ms since 1970/1/1
   *   floatValue       - Number: the float value
   *   markerDisplayed  - Boolean: should marker display
   *   rendered         - Boolean: should spark data item render
   *   value            - Number: the spark data item value
   *
   */
  SparkDataItemRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = SparkDataItemRenderer.superclass.GetAttributesDefinition.call(this);
    
    attrs['color'] = {'path' : 'color', 'type' : AttributeProcessor['TEXT']};
    attrs['date'] = {'path' : 'date', 'type' : AttributeProcessor['DATETIME']};
    attrs['floatValue'] = {'path' : 'floatValue', 'type' : AttributeProcessor['FLOAT']};
    attrs['markerDisplayed'] = {'path' : 'markerDisplayed', 'type' : AttributeProcessor['ON_OFF']};
    attrs['rendered'] = {'path' : 'rendered', 'type' : AttributeProcessor['ON_OFF']};  
    attrs['value'] = {'path' : 'value', 'type' : AttributeProcessor['FLOAT']};
    /*
     * @TODO: markerShape: default value has been changed from 'square' to 'auto' in DT,
     * but here I better force it to square due to compatibility with old charts! (see stockChart bug)
     */
    attrs['markerShape'] = {'path' : 'markerShape', 'type' : AttributeProcessor['TEXT'], 'default' : 'square'};
    attrs['borderColor'] = {'path' : 'borderColor', 'type' : AttributeProcessor['TEXT']};
    attrs['markerSize'] = {'path' : 'markerSize', 'type' : AttributeProcessor['INTEGER']};
  
    return attrs;
  }
  
  SparkDataItemRenderer.prototype.ProcessAttributes = function (options, sparkItemNode, context)
  {
    var item = {};
    var changed = SparkDataItemRenderer.superclass.ProcessAttributes.call(this, item, sparkItemNode, context);
    if(changed)
    {
      if(item['date'])
      {
        options['timeAxisType'] = 'enabled';    
      }
    }
      
    var itemsPath = (new adf.mf.internal.dvt.util.JSONPath(options, 'items')); 
    var items = itemsPath.getValue();
    if(items === undefined)
    {
      items = [];
      itemsPath.setValue(items);
    }
    items.push(item);
    
    return changed;
  }
})();
/* Copyright (c) 2015, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/StockChartRenderer.js
 */
(function ()
{

  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;

  var StockChartRenderer = function ()
  {}

  adf.mf.internal.dvt.DvtmObject.createSubclass(StockChartRenderer, 'adf.mf.internal.dvt.chart.BaseChartRenderer', 'adf.mf.internal.dvt.chart.StockChartRenderer');

  StockChartRenderer.prototype.GetChartType = function ()
  {
    return 'stock';
  }

  /**
   * Returns the name of the stamped child tag.
   * @param {String} facetName optional facet name where the stamped child lives
   * @return {String} stamped child tag name
   */
  StockChartRenderer.prototype.GetStampedChildTagName = function (facetName)
  {
    switch (facetName)
    {
      case 'dataStamp':
        return 'stockDataItem';
        
      case 'seriesStamp':
        return 'seriesStyle';
        
      default:
        return null;
    }
  };

  StockChartRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {
    return StockChartRenderer.superclass.ProcessChildren.call(this, options, amxNode, context);
  }

  /**
   * processes the components's child tags
   */
  StockChartRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if (this._renderers === undefined)
    {
      var FormatRenderer = adf.mf.internal.dvt.common.format.FormatRenderer;
      var AxisRenderer = adf.mf.internal.dvt.common.axis.AxisRenderer;
      var OverviewRenderer = adf.mf.internal.dvt.common.overview.OverviewRenderer;
      
      this._renderers = 
      {
        'facet' : 
        {
          'dataStamp' : 
          {
            'stockDataItem' : 
            {
              'renderer' : new adf.mf.internal.dvt.chart.StockDataItemRenderer()
            }
          },
          'seriesStamp' :
          {
            'seriesStyle' : { 'renderer' : new adf.mf.internal.dvt.chart.SeriesStyleRenderer(this.GetChartType()) }
          }
        },
        'simple' : 
        {
          'xAxis' : 
          {
            'renderer' : new AxisRenderer('X'), 'order' : 1, 'maxOccurrences' : 1
          },
          'yAxis' : 
          {
            'renderer' : new AxisRenderer('Y'), 'order' : 1, 'maxOccurrences' : 1
          },
          'y2Axis' : 
          {
            'renderer' : new AxisRenderer('Y2'), 'order' : 1, 'maxOccurrences' : 1
          },
          'chartValueFormat' : 
          {
            'renderer' : new FormatRenderer('*'), 'order' : 2, 'maxOccurences' : 10
          },        
          'overview' : 
          {
            'renderer' : new OverviewRenderer(), 'order' : 3, 'maxOccurences' : 1
          }
        }
      }
    }

    if (facetName !== undefined)
    {
      return this._renderers['facet'][facetName];
    }

    return this._renderers['simple'];
  }

  StockChartRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = StockChartRenderer.superclass.GetAttributesDefinition.call(this);

    // Color when open price is higher than close price
    attrs['fallingColor'] = 
    {
      'path' : 'styleDefaults/stockFallingColor', 'type' : AttributeProcessor['TEXT']
    };
    // Color for the range bar
    attrs['rangeColor'] = 
    {
      'path' : 'styleDefaults/stockRangeColor', 'type' : AttributeProcessor['TEXT']
    };
    // Color when close price is higher than open price
    attrs['risingColor'] = 
    {
      'path' : 'styleDefaults/stockRisingColor', 'type' : AttributeProcessor['TEXT']
    };
    // Color for volume bars
    attrs['volumeColor'] = 
    {
      'path' : 'volumeColor', 'type' : AttributeProcessor['TEXT']
    };

    return attrs;
  }

  StockChartRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = StockChartRenderer.superclass.GetStyleClassesDefinition.call(this);

    styleClasses['dvtm-stockDataItem'] = [{'path' : 'styleDefaults/backgroundColor', 'type' : StyleProcessor['BACKGROUND'], 'overwrite' : false}];
    styleClasses['dvtm-stockChart-rising'] = [{'path' : 'styleDefaults/stockRisingColor', 'type' : StyleProcessor['COLOR'], 'overwrite' : false}];
    styleClasses['dvtm-stockChart-falling'] = [{'path' : 'styleDefaults/stockFallingColor', 'type' : StyleProcessor['COLOR'], 'overwrite' : false}];
    styleClasses['dvtm-stockChart-range'] = [{'path' : 'styleDefaults/stockRangeColor', 'type' : StyleProcessor['COLOR'], 'overwrite' : false}];

    /* 
     * I had to comment this line, because for volume there are 2 different colors (for rising and falling), so one default color would be undesirable.
     * styleClasses['dvtm-stockChart-volume'] = [{'path' : 'styleDefaults/stockVolumeColor', 'type' : StyleProcessor['COLOR'], 'ignoreEmpty' : true}];
     */

    return styleClasses;
  }
  /**
   * Function processes supported attributes which are on amxNode. This attributes
   * should be converted into the options object.
   *
   * @param options main component options object
   * @amxNode child amxNode
   */
  StockChartRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {
    var changed = StockChartRenderer.superclass.ProcessAttributes.call(this, options, amxNode, context);
    if (['auto'].indexOf(options['timeAxisType']) > -1) 
    {
      options['timeAxisType'] = 'regular';
    }
    return changed;
  }

  StockChartRenderer.prototype.PopulateCategories = function ()
  {
    return true;
  };

  StockChartRenderer.prototype.PreventsSwipe = function (amxNode)
  {
    // stock chart should not prevent swipe/drag gestures
    return false;
  }

  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'stockChart', StockChartRenderer);
})();
/* Copyright (c) 2015, Oracle and/or its affiliates. All rights reserved. */
/*
 *    chart/StockDataItemRenderer.js
 */
(function ()
{

  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;

  var StockDataItemRenderer = function ()
  {};

  adf.mf.internal.dvt.DvtmObject.createSubclass(StockDataItemRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.chart.StockDataItemRenderer');

  StockDataItemRenderer.prototype._hasAction = function (markerNode)
  {
    if (markerNode.isAttributeDefined('action'))
    {
      return true;
    }

    var actionTags;
    // should fire action, if there are any 'setPropertyListener' or 'showPopupBehavior' child tags
    actionTags = markerNode.getTag().getChildren(adf.mf.internal.dvt.AMX_NAMESPACE, 'setPropertyListener');
    if (actionTags.length > 0)
      return true;

    actionTags = markerNode.getTag().getChildren(adf.mf.internal.dvt.AMX_NAMESPACE, 'showPopupBehavior');
    if (actionTags.length > 0)
      return true;

    return false;
  };
  
  StockDataItemRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = StockDataItemRenderer.superclass.GetAttributesDefinition.call(this);
    
    attrs['borderColor'] = {'path' : 'borderColor', 'type' : AttributeProcessor['TEXT']};
    attrs['borderWidth'] = {'path' : 'borderWidth', 'type' : AttributeProcessor['TEXT']};
    attrs['color'] = {'path' : 'color', 'type' : AttributeProcessor['TEXT']};
    attrs['close'] = {'path' : 'close', 'type' : AttributeProcessor['FLOAT']};
    attrs['high'] = {'path' : 'high', 'type' : AttributeProcessor['FLOAT']};
    attrs['low'] = {'path' : 'low', 'type' : AttributeProcessor['FLOAT']};
    attrs['open'] = {'path' : 'open', 'type' : AttributeProcessor['FLOAT']};
    attrs['markerDisplayed'] = {'path' : 'markerDisplayed', 'type' : AttributeProcessor['BOOLEAN']};
    attrs['markerShape'] = {'path' : 'markerShape', 'type' : AttributeProcessor['TEXT'], 'default' : 'auto'};
    attrs['markerSize'] = {'path' : 'markerSize', 'type' : AttributeProcessor['TEXT']};
    attrs['pattern'] = {'path' : 'pattern', 'type' : AttributeProcessor['TEXT']};
    attrs['rendered'] = {'path' : 'rendered', 'type' : AttributeProcessor['TEXT']};
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
    attrs['volume'] = {'path' : 'volume', 'type' : AttributeProcessor['FLOAT']};
    attrs['x'] = {'path' : 'x', 'type' : AttributeProcessor['TEXT']};

    return attrs;
  };

  StockDataItemRenderer.prototype.ProcessAttributes = function (options, markerNode, context)
  {
    if (markerNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(markerNode.getAttribute('rendered')))
    {
      return true;
    }

    var amxNode = context['amxNode'];

    var dataItem = 
    {
      'id' : markerNode.getId()
    };

    StockDataItemRenderer.superclass.ProcessAttributes.call(this, dataItem, markerNode, context);
    if (this._hasAction(markerNode))
    {
      dataItem['action'] = context['_rowKey'];
    }

    var seriesId = "Series 1";
    var group = null;
    var groupId = null;
    var seriesName = null;

    if (markerNode.isAttributeDefined('group'))
    {
      group = markerNode.getAttribute('group');
    }

    if (markerNode.isAttributeDefined('groupId'))
    {
      groupId = markerNode.getAttribute('groupId');
    }

    if (markerNode.isAttributeDefined('series'))
    {
      seriesName = markerNode.getAttribute('series');
      seriesId = seriesName;
    }

    var series = adf.mf.internal.dvt.chart.SeriesHelper.getSeriesByIdAndName(amxNode, seriesId, seriesName === null ? "" : seriesName);

    if ('mixedFrequency' === options['timeAxisType'])
    {
      dataItem['x'] = adf.mf.internal.dvt.AttributeProcessor['DATETIME'](dataItem['x']);

      if (group)
      {
        // group should be unique so use it as groupId
        groupId = group;
        group = adf.mf.internal.dvt.AttributeProcessor['DATETIME'](group);
      }
    }

    var groupIndex = this._addGroup(amxNode, groupId, group, context);
    if (groupIndex === null)
    {
      series['items'][series['items'].length] = dataItem;
    }
    else
    {
      series['items'][groupIndex] = dataItem;
    }

    // process marker attributes
    var attributeGroupsNodes = markerNode.getChildren();
    for (var i = 0;i < attributeGroupsNodes.length;i++)
    {
      var attrGroupsNode = attributeGroupsNodes[i];

      if (attrGroupsNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(attrGroupsNode.getAttribute('rendered')))
        continue;// skip unrendered nodes
      if (!attrGroupsNode.isReadyToRender())
      {
        throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException();
      }

      AttributeGroupManager.processAttributeGroup(attrGroupsNode, amxNode, context);
    }

    // add the marker to the model
    AttributeGroupManager.registerDataItem(context, dataItem, null);

    return true;
  };

  /**
   * adds a name/data pair to the series.  The item must be of type
   * { name: X, 'data': Y }.
   */
  StockDataItemRenderer.prototype._addSeriesItem = function (options, item)
  {
    options['series'].push(item);
  };

  /**
   *  adds a new group to the groups array
   *
   *  item is created as group
   */
  StockDataItemRenderer.prototype._addGroup = function (amxNode, groupId, group, context)
  {
    if (groupId && context['groupIds'] && context['groupIds'][groupId] != null)
    {
      return context['groupIds'][groupId];
    }

    var options = this.GetDataObject(amxNode);
    var groups = options['groups'];
    var g;

    for (g = 0;g < groups.length;g++)
    {
      if ((groupId && groups[g]['id'] === groupId) || groups[g]['name'] === group)
      {
        return g;
      }
    }

    g = null;
    if (group || groupId)
    {
      var newGroup = 
      {
        'name' : group
      };

      if (groupId)
      {
        newGroup['id'] = groupId;
      }

      g = groups.length;
      groups[groups.length] = newGroup;
    }

    return g;
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/AttributeGroupConfig.js
 */
(function(){
  
  /**
   *  Class representing attribute group configuration. Following configuration is supported:
   *  1. updateCategoriesCallback
   *        Callback used to update categories on an data item. It is then up to the callback to set categories properly on the data item.
   *  2. typeToItemAttributeMapping
   *        Particular attribute group type can be mapped to particular attribute of an data item. Resolved value is assigned to
   *        given attribute on the data item.    
   *  3. typeToLegendAttributeMapping
   *        Particular attribute group type can be mapped to particular attribute of an legend item. Resolved value is assigned to
   *        given attribute on the legend item.
   *  4. typeToDefaultPaletteMapping
   *        Particular attribute group type can be mapped to a default palette. When no value is resolved
   *        for given type then value from given default palette is taken.
   */ 
  var AttributeGroupConfig = function()
  {
    this['updateCategoriesCallback'] = null;
    this['typeToItemAttributeMapping'] = {};
    this['typeToDefaultPaletteMapping'] = {};
    this['updateValuesCallback'] = {};
    this['typeToLegendAttributeMapping'] = {};
    this['legendTypeCallback'] = null;
    this['applyDefaultPaletteOverrides'] = false;
  };
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(AttributeGroupConfig, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.common.attributeGroup.AttributeGroupConfig');
  
  /**
   *  Sets callback used for categories update.
   *  @param callback categories update callback     
   */   
  AttributeGroupConfig.prototype.setUpdateCategoriesCallback = function(callback) {
    this['updateCategoriesCallback'] = callback;
  };
  
  /**
   *  Returns callback used for categories update or null if no callback is defined.
   *  @return callback used for categories update or null if no callback is defined     
   */
  AttributeGroupConfig.prototype.getUpdateCategoriesCallback = function() {
    return this['updateCategoriesCallback'];
  };
  
  /**
   *  Adds type to item attribute mapping.
   *  @param type type
   *  @param attribute attribute           
   */  
  AttributeGroupConfig.prototype.addTypeToItemAttributeMapping = function(type, attribute) {
    this['typeToItemAttributeMapping'][type] = attribute;
  };
  
  /**
   *  Returns item attribute for given type or undefined if no item attribute is defined for given type.
   *  @param type type
   *  @return item attribute for given type or undefined if no item attribute is defined for given type        
   */  
  AttributeGroupConfig.prototype.getTypeToItemAttributeMapping = function(type) {
    return this['typeToItemAttributeMapping'][type];
  };
  
  /**
   *  Adds type to default palette mapping.
   *  @param type type
   *  @param defaultPalette default palette           
   */  
  AttributeGroupConfig.prototype.addTypeToDefaultPaletteMapping = function(type, defaultPalette) {
    this['typeToDefaultPaletteMapping'][type] = defaultPalette;
  };
  
  /**
   *  Returns default palette mapping for given type or undefined if no default palette is defined for given type.
   *  @param type type
   *  @param default palette mapping for given type or undefined if no default palette is defined for given type.           
   */
  AttributeGroupConfig.prototype.getTypeToDefaultPaletteMapping = function(type) {
    return this['typeToDefaultPaletteMapping'][type];
  };
  
  /**
   *  Adds callback used to update value for given type.
   *  @param type type
   *  @param callback value update callback           
   */  
  AttributeGroupConfig.prototype.addUpdateValueCallback = function(type, callback) {
    this['updateValuesCallback'][type] = callback;
  };
  
  /**
   *  Returns callback used for value update or null if no callback is defined.
   *  @param type type
   *  @return callback used for value update or null if no callback is defined.           
   */
  AttributeGroupConfig.prototype.getUpdateValueCallback = function(type) {
    return this['updateValuesCallback'][type];
  };
  
  /**
   *  Adds type to legend attribute mapping.
   *  @param type type
   *  @param attribute attribute           
   */  
  AttributeGroupConfig.prototype.addTypeToLegendAttributeMapping = function(type, attribute) {
    this['typeToLegendAttributeMapping'][type] = attribute;
  };
  
  /**
   *  Returns legend attribute for given type or undefined if no legend attribute is defined for given type.
   *  @param type type
   *  @return legend attribute for given type or undefined if no legend attribute is defined for given type        
   */  
  AttributeGroupConfig.prototype.getTypeToLegendAttributeMapping = function(type) {
    return this['typeToLegendAttributeMapping'][type];
  };
  
  /**
   *  Sets legend type callback. The callback can be a function with signature
   *  function(type, legendAttributeName, attributeGroup).
   *  @param callback callback           
   */  
  AttributeGroupConfig.prototype.setLegendTypeCallback = function(callback) {
    this['legendTypeCallback'] = callback;
  };
  
  /**
   *  Returns legend type callback
   *  @return legend type callback        
   */  
  AttributeGroupConfig.prototype.getLegendTypeCallback = function() {
    return this['legendTypeCallback'];
  };
  
  /**
   *  Sets if default palettes should be overriden
   *  @param apply if default palettes should be overriden
   */
  AttributeGroupConfig.prototype.setOverrideDefaultPalettes = function(apply) {
    this['applyDefaultPaletteOverrides'] = apply;  
  };
  
  /**
   *  Returns true if default palettes should be overriden otherwise false
   *  @return true if default palettes should be overriden otherwise false
   */
  AttributeGroupConfig.prototype.isOverrideDefaultPalettes = function() {
    return this['applyDefaultPaletteOverrides'];
  };
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/AttributeValuesResolver.js
 */
(function(){
  
  /**
   *  Sets/updates attribute values.
   *  @param amxNode amx node
   *  @param attributeGroup attribute group                
   */  
  var AttributeValuesResolver = function(amxNode, attributeGroup)
  {
    this['types'] = attributeGroup['types'];;
    this['categories'] = attributeGroup['categories']; 
    this['attributes'] = attributeGroup['attributes']; 
    this['rules'] = attributeGroup['rules'];
    this['config'] = attributeGroup['config'];
    this['discriminant'] = attributeGroup['discriminant']
    this['attributeGroup'] = attributeGroup;
    
    this['defaultPalettes'] = {};
    
    this._updateDefaultPalettes(amxNode);
  };
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(AttributeValuesResolver, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.common.attributeGroup.AttributeValuesResolver'); 
  
  AttributeValuesResolver.TYPE_ATTR = "type";
  AttributeValuesResolver.STYLE_DEFAULTS_PALETTE_ATTR = "styleDefaultsPalette";
  AttributeValuesResolver.PALETTE_ATTR = "palette";
  AttributeValuesResolver.INDEX_ATTR = "categoryIndex";
  AttributeValuesResolver.VALUE_ATTR = "value";
  
  /**
   *  Inits default palettes overrides that are then used in resolveDefaultValue function. 
   *  @param amxNode amx node
   */  
  AttributeValuesResolver.prototype._updateDefaultPalettes = function(amxNode) {
    var DefaultPalettesValueResolver = adf.mf.internal.dvt.common.attributeGroup.DefaultPalettesValueResolver;
    var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
     
    var value, match, type, attr, matchRuleGroup, categoryIndex, styleDefaultsPalette, palette, defaultsPaletteName;
    var types = this['types'];
    var attrs = null;
    var rules = this['rules'];
    var defaultPaletteChanged;
    var sharedPalette;
    
    // RULE - last override wins
    // process attributes
    for(var i=0; i < types.length; i++) {
      type = types[i];
      defaultsPaletteName = this._getDefaultsPaletteName(type);
      styleDefaultsPalette = DefaultPalettesValueResolver.getStyleDefaultsPalette(defaultsPaletteName);
      palette = DefaultPalettesValueResolver.getDefaultsPalette(defaultsPaletteName);
      
      defaultPaletteChanged = false;
      
      if(this['discriminant']) {
        sharedPalette = AttributeGroupManager.getSharedAttribute(this['discriminant'], 'palette.'+type);
        if(sharedPalette) {
          // shared palette already exists for given type -> reuse it
          this['defaultPalettes'][type] = sharedPalette.slice();
          defaultPaletteChanged = true;
        } else {
          this['defaultPalettes'][type] = amxNode[palette] ? amxNode[palette].slice() : [];
        }
      } else {
        this['defaultPalettes'][type] = amxNode[palette] ? amxNode[palette].slice() : [];
      }
      
      // process attributes
      attrs = this['attributes'].iterator();
      while(attrs.hasNext()) {
        attr = attrs.next();
        match = new RegExp('^('+type+')(\\d+)$').exec(attr['name']);
        if(match && match.length == 3) { 
          value = attr['value'];
          categoryIndex = match[2]-1;
          this['defaultPalettes'][type][categoryIndex] = value;
          defaultPaletteChanged = true;
        }
      }
      
      // process match rules - match rules wins over attributes therefore are processed after attributes
      matchRuleInfos = rules.resolveMatchRuleGroupsAndValue(type);
      for(var k = 0; k < matchRuleInfos.length; k++) {
        matchRuleGroup = matchRuleInfos[k]['group'];
        value = matchRuleInfos[k]['value'];
        categoryIndex = this['categories'].getIndexByValue(matchRuleGroup);
        this['defaultPalettes'][type][categoryIndex] = value;
        defaultPaletteChanged = true;
      }
      
      if(this['discriminant'] && !sharedPalette) {
        // newly built palette must be shared
        // to cover corner cases the isSharedAttributesUpdateAllowed is ignored, i.e. when palette is not shared for given type then share it
        AttributeGroupManager.addSharedAttribute(this['discriminant'], 'palette.'+type, this['defaultPalettes'][type]);
      }
      
      if(this['config'] && this['config'].isOverrideDefaultPalettes() && defaultPaletteChanged) {
        // charts build legend based on style default palettes -> update them for given type
        this._updateStyleDefaultPalette(amxNode, type, styleDefaultsPalette);
      }
    };   
  };
  
  AttributeValuesResolver.prototype._updateStyleDefaultPalette = function(amxNode, type, styleDefaultsPalette) {
    var options = amxNode.getAttribute(adf.mf.internal.dvt.BaseRenderer.DATA_OBJECT);
    var styleDefaults = options['styleDefaults'];
    if(!styleDefaults) {
      styleDefaults = {};
      options['styleDefaults'] = styleDefaults;
    }
    styleDefaults[styleDefaultsPalette] = this['defaultPalettes'][type].slice();
    
    var chartPaletteIndx = 0;
    var resolver = this;
    if(this['discriminant']) {
      this['categories'].each(function(index, category){
        var value = {};
        resolver.resolveLegendValues(value, index);
        styleDefaults[styleDefaultsPalette][chartPaletteIndx] = value[type];
        chartPaletteIndx++;
      });
    }
  };
  
  /**
   *  Returns defaults palette name for given type.
   *  @param type type
   *  @return default palette name         
   */  
  AttributeValuesResolver.prototype._getDefaultsPaletteName = function(type) {
    if(this['config'] && this['config'].getTypeToDefaultPaletteMapping(type)) {
      return this['config'].getTypeToDefaultPaletteMapping(type);
    }
    return type;
  }
  
  /**
   *  Returns legend attribute name for given type
   *  @param type type
   *  @return legend attribute name for given type 
   */  
  AttributeValuesResolver.prototype._getLegendAttributeName = function(type) {
    if(this['config'] && this['config'].getTypeToLegendAttributeMapping(type)) {
      return this['config'].getTypeToLegendAttributeMapping(type);
    }
    return this._getDefaultsPaletteName(type);
  }
  
  /**
   *  Resolves value for given type, exception rules and category index.
   *  @param type type
   *  @param exceptionRules exception rules
   *  @param categoryIndex category index
   *  @return resolved value or null value is not defined for given type                  
   */  
  AttributeValuesResolver.prototype.resolveValue = function(type, exceptionRules, categoryIndex)
  {
    // 1. return exception rule value if it exists
    // 2. return default value:
    //    1. match rule value if override exists
    //    2. attribute value if override exists
    //    3. default palette value if it exists
    var value = null;
    if (this['types'].indexOf(type) >= 0)
    {
      if(exceptionRules) {
        value = exceptionRules.resolveValue(type);
      }
      
      if(value == null) {
        value = this.resolveDefaultValue(type, categoryIndex);
      }
    }

    return value;
  };
  
  /**
   *  Resolves default value for given type and category index.
   *  @param type type
   *  @param categoryIndex category index
   *  @return default value or null value is not defined for given type                  
   */  
  AttributeValuesResolver.prototype.resolveDefaultValue = function(type, categoryIndex) {
    var value = null;
    
    var defaults = this['defaultPalettes'][type];          
    if(defaults != undefined && categoryIndex >= 0 && defaults.length > 0) 
    {            
      value = defaults[categoryIndex % defaults.length];
    }
    
    return value;
  };
  
  /**
   *  Resolves and sets values for given legendItem and category index.
   *  @param legendItem legend item
   *  @param categoryIndex category index                  
   */
  AttributeValuesResolver.prototype.resolveLegendValues = function(legendItem, categoryIndex)
  {
    var types = this['types'];
    var type = null;
    var legendAttributeName = null;
    for(var i=0; i < types.length; i++) {
      type = types[i];
      legendAttributeName = this._getLegendAttributeName(type);
      // match rules, attributes and default palettes are taken into consideration
      legendItem[legendAttributeName] = this.resolveValue(type, null, categoryIndex);
    }
  };
  
  /**
   *  Returns legend type.
   *  @return legend type                 
   */
  AttributeValuesResolver.prototype.getLegendType = function()
  {
    var types = this['types'];
    var type = null;
    var legendType = null;
    for(var i=0; i < types.length; i++) {
      type = types[i];
      type = this._getLegendTypeName(type);
      legendType = legendType ? (legendType + ' ' + type) : type;
    }
    return legendType;
  };
  
  /**
   *  Returns legend type name for given type
   *  @param type type
   *  @return legend type name for given type 
   */  
  AttributeValuesResolver.prototype._getLegendTypeName = function(type) {
    var legendAttributeName = this._getLegendAttributeName(type);
    if(this['config'] && this['config'].getLegendTypeCallback()) {
      var callback = this['config'].getLegendTypeCallback();
      return callback(type, legendAttributeName, this['attributeGroup']);
    }
    return legendAttributeName;
  };
    
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/Categories.js
 */
(function(){
  
  /**
   *  Categories representation.  
   */  
  var Categories = function(discriminant)
  {
    this['categories'] = [];
    this['categoryToIndexMap'] = {};
    this['discriminant'] = discriminant;
    this['observers'] = [];
  };
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(Categories, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.common.attributeGroup.Categories');
  
  /**
   *  Returns category by index.
   *  @param index index
   *  @return category by index or null if no category is defined for given index        
   */  
  Categories.prototype.getByIndex = function(index) {
    if(index >= 0 && index < this['categories'].length) {
      return this['categories'][index];
    }
    return null;
  };
  
  /**
   *  Returns category label by index.
   *  @param index index
   *  @return category label by index or null if no category is defined for given index     
   */  
  Categories.prototype.getLabelByIndex = function(index) {
    var category = this.getByIndex(index);
    if(category) {
      return category['label'];
    }
    return null;
  };
  
  /**
   *  Returns category value by index.
   *  @param index index
   *  @return category value by index or null if no category is defined for given index     
   */
  Categories.prototype.getValueByIndex = function(index) {
    var category = this.getByIndex(index);
    if(category) {
      return category['value'];
    }
    return null;
  };
  
  /**
   *  Returns category by value.
   *  @param value value
   *  @return category by value or null if no category is defined for given value     
   */
  Categories.prototype.getByValue = function(value) {
    var index = this.getIndexByValue(value);
    return getByIndex(index);
  };
  
  /**
   *  Returns category index for given category value.
   *  @param value value
   *  @return category index for given category value or -1 if no index is defined for given value     
   */
  Categories.prototype.getIndexByValue = function(value) {
    if(value && this['categoryToIndexMap'][value] >= 0){
      return this['categoryToIndexMap'][value];
    }
    return -1;
  };
  
  /**
   *  Returns category label for given category value.
   *  @param value value
   *  @return category label for given category value or -1 if no category is defined for given value     
   */
  Categories.prototype.getLabelByValue = function(value) {
    var category = this.getByValue(value);
    if(category) {
      return category['label'];
    }
    return null;
  };
  
  /**
   *  Returns true if this categories object contains category with given value and label, otherwise returns false.
   *  @param value value
   *  @param label label   
   *  @return true if this categories object contains category with given value and label, otherwise returns false     
   */
  Categories.prototype.contains = function(value, label) {
    var index = getIndex(value, label);
    if(index != -1) return true;
    return false;
  };
  
  Categories.prototype.observe = function(callback) {
    this.unobserve(callback);
    this['observers'].push(callback);
  };

  Categories.prototype.unobserve = function(callback) {
    var observers = [];
    this['observers'].forEach(function(item)
    {
      if (item !== callback)
      {
        observers.push(item);
      }
    });

    this['observers'] = observers;
  };

  /**
   *  Returns index of category with given value and label or -1 if no such category exists.
   *  @param value value
   *  @param label label   
   *  @return index of category with given value and label or -1 if no such category exists     
   */
  Categories.prototype.getIndex = function(value, label) {
    var index = this.getIndexByValue(value);
    if(index != -1 && this.getLabelByIndex(index) === label) {
      return index;
    }
    return -1;
  };
  
  /**
   *  Iterates over categories array.
   *  @param callback callback that is called for each defined item in the array     
   */  
  Categories.prototype.each = function(callback) {
    var categories = this['categories'];
    for(var i = 0; i < categories.length; i++) {
      if(categories[i]) {
        callback(i, categories[i]);
      }
    }
  };

  /**
   *  Adds new category to array of categories and returns index of given category.
   *  @param category category value
   *  @param label category label
   *  @return index of category represented by given params          
   */  
  Categories.prototype.addCategory = function (category, label) {
    var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
    var sharedCategory, index, catLabel, value;
    var discriminant = this['discriminant'];

    if(discriminant) 
    {
      index = AttributeGroupManager.addSharedCategory(discriminant, category, label);
      sharedCategory = AttributeGroupManager.getSharedCategories(discriminant).getByIndex(index);
      value = sharedCategory['value'];
      catLabel = label ? label : sharedCategory['label'];
      this['categories'][index] = this._createCategory(value, catLabel);
      this['categoryToIndexMap'][category] = index;
    }
    else
    {
      index = this.getIndexByValue(category);
      if(index == -1) {
        if(!category) category = "__"+this['categories'].length;
        
        catLabel = label ? label : category;  
        this['categories'].push(this._createCategory(category, catLabel));
        index = this['categories'].length - 1;
        this['categoryToIndexMap'][category] = index;
      }
    }
    var that = this;
    this['observers'].forEach(function(observer)
    {
      observer(that);
    });
    
    return index;
  };

  Categories.prototype._createCategory = function(value, label) {
    return {
      "value" : value,
      "label" : label
    };
  };
    
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/ColorConverter.js
 */
(function(){
  
  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.common.attributeGroup');
  
  /**
   *  Converter used to convert RGBA, RGB, 6HEX, 3HEX, keyword colors to following representation:
   *  [R, G, B, A] where, R - red channel value, G - green channel value, B - blue channel value, A - opacity value        
   */  
  var ColorConverter = function() {
    this.converters = [];
    
    // extended colors converter
    this.converters.push(this._createExtColorConverter(regexp, handler));
    
    // RGBA converter
    var regexp = /^rgba\(([\d]+),([\d]+),([\d]+),([\d]+|[\d]*.[\d]+)\)/;
    var handler = function(matches) {
      return [+matches[1], +matches[2], +matches[3], +matches[4]];
    } 
    this.converters.push(this._createRegexpConverter(regexp, handler));
    
    // RGB converter
    regexp = /^rgb\(([\d]+),([\d]+),([\d]+)\)/;
    handler = function(matches) {
      return [+matches[1], +matches[2], +matches[3], 1];
    }
    this.converters.push(this._createRegexpConverter(regexp, handler));
    
    // 6HEX converter
    regexp = /^#([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})/;
    handler = function(matches) {
      return [parseInt(matches[1], 16), parseInt(matches[2], 16), parseInt(matches[3], 16), 1];
    } 
    this.converters.push(this._createRegexpConverter(regexp, handler));
    
    // 3HEX converter
    regexp = /^#([\da-fA-F])([\da-fA-F])([\da-fA-F])/;
    handler = function(matches) {
      return [parseInt(matches[1], 16) * 17, parseInt(matches[2], 16) * 17, parseInt(matches[3], 16) * 17, 1];
    } 
    this.converters.push(this._createRegexpConverter(regexp, handler));
  };
  
  /**
   *  Creates and returns regular expression based color converter.
   *  @param regexp regular expression
   *  @param matchesHandler handler to be called for given regexp exec result
   *  @return converter         
   */     
  ColorConverter.prototype._createRegexpConverter = function(regexp, matchesHandler) {
    var converter = {};
    converter.convert = function(colorStr) {
      var ret = regexp.exec(colorStr);
      if(ret) {
        ret = matchesHandler(ret);
        if(!(Object.prototype.toString.call(ret) === '[object Array]' && ret.length == 4)) {
          ret = null;
        }
      } 
      return ret;
    }
    return converter;
  };
  
  /**
   *  Creates and returns extended color keywords converter.  
   */  
  ColorConverter.prototype._createExtColorConverter = function() {
    // extended color keywords coverage - http://www.w3.org/TR/css3-color/
    extColorMap = {};
    extColorMap['black'] = [0,0,0,1];
    extColorMap['silver'] = [192,192,192,1];
    extColorMap['gray'] = [128,128,128,1];
    extColorMap['white'] = [255,255,255,1];
    extColorMap['maroon'] = [128,0,0,1];
    extColorMap['red'] = [255,0,0,1];
    extColorMap['purple'] = [128,0,128,1];
    extColorMap['fuchsia'] = [255,0,255,1];
    extColorMap['green'] = [0,255,0,1];
    extColorMap['lime'] = [191,255,0,1];
    extColorMap['olive'] = [128,128,0,1];
    extColorMap['yellow'] = [255,255,0,1];
    extColorMap['navy'] = [0,0,128,1];
    extColorMap['blue'] = [0,0,255,1];
    extColorMap['teal'] = [0,128,128,1];
    extColorMap['aqua'] = [0,255,255,1];
    extColorMap['aliceblue'] = [240,248,255,1];
    extColorMap['antiquewhite'] = [250,235,215,1];
    extColorMap['aqua'] = [0,255,255,1];
    extColorMap['aquamarine'] = [127,255,212,1];
    extColorMap['azure'] = [240,255,255,1];
    extColorMap['beige'] = [245,245,220,1];
    extColorMap['bisque'] = [255,228,196,1];
    extColorMap['black'] = [0,0,0,1];
    extColorMap['blanchedalmond'] = [255,235,205,1];
    extColorMap['blue'] = [0,0,255,1];
    extColorMap['blueviolet'] = [138,43,226,1];
    extColorMap['brown'] = [165,42,42,1];
    extColorMap['burlywood'] = [222,184,135,1];
    extColorMap['cadetblue'] = [95,158,160,1];
    extColorMap['chartreuse'] = [127,255,0,1];
    extColorMap['chocolate'] = [210,105,30,1];
    extColorMap['coral'] = [255,127,80,1];
    extColorMap['cornflowerblue'] = [100,149,237,1];
    extColorMap['cornsilk'] = [255,248,220,1];
    extColorMap['crimson'] = [220,20,60,1];
    extColorMap['cyan'] = [0,255,255,1];
    extColorMap['darkblue'] = [0,0,139,1];
    extColorMap['darkcyan'] = [0,139,139,1];
    extColorMap['darkgoldenrod'] = [184,134,11,1];
    extColorMap['darkgray'] = [169,169,169,1];
    extColorMap['darkgreen'] = [0,100,0,1];
    extColorMap['darkgrey'] = [169,169,169,1];
    extColorMap['darkkhaki'] = [189,183,107,1];
    extColorMap['darkmagenta'] = [139,0,139,1];
    extColorMap['darkolivegreen'] = [85,107,47,1];
    extColorMap['darkorange'] = [255,140,0,1];
    extColorMap['darkorchid'] = [153,50,204,1];
    extColorMap['darkred'] = [139,0,0,1];
    extColorMap['darksalmon'] = [233,150,122,1];
    extColorMap['darkseagreen'] = [143,188,143,1];
    extColorMap['darkslateblue'] = [72,61,139,1];
    extColorMap['darkslategray'] = [47,79,79,1];
    extColorMap['darkslategrey'] = [47,79,79,1];
    extColorMap['darkturquoise'] = [0,206,209,1];
    extColorMap['darkviolet'] = [148,0,211,1];
    extColorMap['deeppink'] = [255,20,147,1];
    extColorMap['deepskyblue'] = [0,191,255,1];
    extColorMap['dimgray'] = [105,105,105,1];
    extColorMap['dimgrey'] = [105,105,105,1];
    extColorMap['dodgerblue'] = [30,144,255,1];
    extColorMap['firebrick'] = [178,34,34,1];
    extColorMap['floralwhite'] = [255,250,240,1];
    extColorMap['forestgreen'] = [34,139,34,1];
    extColorMap['fuchsia'] = [255,0,255,1];
    extColorMap['gainsboro'] = [220,220,220,1];
    extColorMap['ghostwhite'] = [248,248,255,1];
    extColorMap['gold'] = [255,215,0,1];
    extColorMap['goldenrod'] = [218,165,32,1];
    extColorMap['gray'] = [128,128,128,1];
    extColorMap['green'] = [0,128,0,1];
    extColorMap['greenyellow'] = [173,255,47,1];
    extColorMap['grey'] = [128,128,128,1];
    extColorMap['honeydew'] = [240,255,240,1];
    extColorMap['hotpink'] = [255,105,180,1];
    extColorMap['indianred'] = [205,92,92,1];
    extColorMap['indigo'] = [75,0,130,1];
    extColorMap['ivory'] = [255,255,240,1];
    extColorMap['khaki'] = [240,230,140,1];
    extColorMap['lavender'] = [230,230,250,1];
    extColorMap['lavenderblush'] = [255,240,245,1];
    extColorMap['lawngreen'] = [124,252,0,1];
    extColorMap['lemonchiffon'] = [255,250,205,1];
    extColorMap['lightblue'] = [173,216,230,1];
    extColorMap['lightcoral'] = [240,128,128,1];
    extColorMap['lightcyan'] = [224,255,255,1];
    extColorMap['lightgoldenrodyellow'] = [250,250,210,1];
    extColorMap['lightgray'] = [211,211,211,1];
    extColorMap['lightgreen'] = [144,238,144,1];
    extColorMap['lightgrey'] = [211,211,211,1];
    extColorMap['lightpink'] = [255,182,193,1];
    extColorMap['lightsalmon'] = [255,160,122,1];
    extColorMap['lightseagreen'] = [32,178,170,1];
    extColorMap['lightskyblue'] = [135,206,250,1];
    extColorMap['lightslategray'] = [119,136,153,1];
    extColorMap['lightslategrey'] = [119,136,153,1];
    extColorMap['lightsteelblue'] = [176,196,222,1];
    extColorMap['lightyellow'] = [255,255,224,1];
    extColorMap['lime'] = [0,255,0,1];
    extColorMap['limegreen'] = [50,205,50,1];
    extColorMap['linen'] = [250,240,230,1];
    extColorMap['magenta'] = [255,0,255,1];
    extColorMap['maroon'] = [128,0,0,1];
    extColorMap['mediumaquamarine'] = [102,205,170,1];
    extColorMap['mediumblue'] = [0,0,205,1];
    extColorMap['mediumorchid'] = [186,85,211,1];
    extColorMap['mediumpurple'] = [147,112,219,1];
    extColorMap['mediumseagreen'] = [60,179,113,1];
    extColorMap['mediumslateblue'] = [123,104,238,1];
    extColorMap['mediumspringgreen'] = [0,250,154,1];
    extColorMap['mediumturquoise'] = [72,209,204,1];
    extColorMap['mediumvioletred'] = [199,21,133,1];
    extColorMap['midnightblue'] = [25,25,112,1];
    extColorMap['mintcream'] = [245,255,250,1];
    extColorMap['mistyrose'] = [255,228,225,1];
    extColorMap['moccasin'] = [255,228,181,1];
    extColorMap['navajowhite'] = [255,222,173,1];
    extColorMap['navy'] = [0,0,128,1];
    extColorMap['oldlace'] = [253,245,230,1];
    extColorMap['olive'] = [128,128,0,1];
    extColorMap['olivedrab'] = [107,142,35,1];
    extColorMap['orange'] = [255,165,0,1];
    extColorMap['orangered'] = [255,69,0,1];
    extColorMap['orchid'] = [218,112,214,1];
    extColorMap['palegoldenrod'] = [238,232,170,1];
    extColorMap['palegreen'] = [152,251,152,1];
    extColorMap['paleturquoise'] = [175,238,238,1];
    extColorMap['palevioletred'] = [219,112,147,1];
    extColorMap['papayawhip'] = [255,239,213,1];
    extColorMap['peachpuff'] = [255,218,185,1];
    extColorMap['peru'] = [205,133,63,1];
    extColorMap['pink'] = [255,192,203,1];
    extColorMap['plum'] = [221,160,221,1];
    extColorMap['powderblue'] = [176,224,230,1];
    extColorMap['purple'] = [128,0,128,1];
    extColorMap['red'] = [255,0,0,1];
    extColorMap['rosybrown'] = [188,143,143,1];
    extColorMap['royalblue'] = [65,105,225,1];
    extColorMap['saddlebrown'] = [139,69,19,1];
    extColorMap['salmon'] = [250,128,114,1];
    extColorMap['sandybrown'] = [244,164,96,1];
    extColorMap['seagreen'] = [46,139,87,1];
    extColorMap['seashell'] = [255,245,238,1];
    extColorMap['sienna'] = [160,82,45,1];
    extColorMap['silver'] = [192,192,192,1];
    extColorMap['skyblue'] = [135,206,235,1];
    extColorMap['slateblue'] = [106,90,205,1];
    extColorMap['slategray'] = [112,128,144,1];
    extColorMap['slategrey'] = [112,128,144,1];
    extColorMap['snow'] = [255,250,250,1];
    extColorMap['springgreen'] = [0,255,127,1];
    extColorMap['steelblue'] = [70,130,180,1];
    extColorMap['tan'] = [210,180,140,1];
    extColorMap['teal'] = [0,128,128,1];
    extColorMap['thistle'] = [216,191,216,1];
    extColorMap['tomato'] = [255,99,71,1];
    extColorMap['turquoise'] = [64,224,208,1];
    extColorMap['violet'] = [238,130,238,1];
    extColorMap['wheat'] = [245,222,179,1];
    extColorMap['white'] = [255,255,255,1];
    extColorMap['whitesmoke'] = [245,245,245,1];
    extColorMap['yellow'] = [255,255,0,1];
    extColorMap['yellowgreen'] = [154,205,50,1];
    
    var converter = {};
    converter.convert = function(colorStr) {
      var color = extColorMap[colorStr];
      return color;
    };
    
    return converter; 
  }
  
  /**
   *  Converts given array of colors to array of [R, G, B, A] representations.
   *  @param array of supported colors
   *  @return array of [R, G, B, A] representations        
   */  
  ColorConverter.prototype.convertArrayToRGBA = function(colors) {
    if(!colors || colors.length == 0) return colors;
    
    var ret = [];
    for(var i=0; i<colors.length; i++) {
      ret.push(this.convertToRGBA(colors[i]));
    }
    return ret;
  };
  
  /**
   *  Converts given color to its [R, G, B, A] representation.
   *  @param colorStr supported color string
   *  @return [R, G, B, A] representation for given color        
   */  
  ColorConverter.prototype.convertToRGBA = function(colorStr) {
    colorStr = colorStr.replace(/\s/g, '');
    var ret = null;
    for(var i=0; i<this.converters.length; i++) {
      ret = this.converters[i].convert(colorStr);
      if(ret) {
        return ret;
      }
    }
    return null;
  };
  
  adf.mf.internal.dvt.common.attributeGroup.ColorConverter = new ColorConverter();
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/ContinuousAttributeGroup.js
 */
(function(){
  
  /**
   * Continuous attribute group implementation.  
   */  
  var ContinuousAttributeGroup = function()
  {
    adf.mf.internal.dvt.common.attributeGroup.AttributeGroup.apply(this);
  };
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(ContinuousAttributeGroup, 'adf.mf.internal.dvt.common.attributeGroup.AttributeGroup', 'adf.mf.internal.dvt.common.attributeGroup.ContinuousAttributeGroup');
  
  /**
   *  See parent for comment.  
   */  
  ContinuousAttributeGroup.prototype.Init = function (amxNode, attrGroupsNode)
  {
    ContinuousAttributeGroup.superclass.Init.call(this, amxNode, attrGroupsNode);
    this['attributeType'] = 'continuous';
    
    var attr = attrGroupsNode.getAttribute('maxLabel');
    if(attr) this['maxLabel'] = attr;
    attr = attrGroupsNode.getAttribute('maxValue');
    if(attr) this['maxValue'] = attr;
    attr = attrGroupsNode.getAttribute('minLabel');
    if(attr) this['minLabel'] = attr;
    attr = attrGroupsNode.getAttribute('minValue');
    if(attr) this['minValue'] = attr; 
    if(this['minValue']) this['minValue'] = +this['minValue'];
    if(this['maxValue']) this['maxValue'] = +this['maxValue'];
    this['updateMinValue'] = this['minValue'] ? false : true; 
    this['updateMaxValue'] = this['maxValue'] ? false : true; 
  };
  
  /**
   *  See parent for comment.  
   */
  ContinuousAttributeGroup.prototype.SetType = function (attrGroupsNode) {
    var color = 'color';
    this['type'] = color;
    this['types'] = [color];
  };
  
  /**
   *  See parent for comment.  
   */
  ContinuousAttributeGroup.prototype.configure = function (amxNode, attributeGroupConfig) {
    var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
    var sharedMin, sharedMax;
    
    ContinuousAttributeGroup.superclass.configure.call(this, amxNode, attributeGroupConfig);
    
    if(this['discriminant']) {
      // initialize shared min, max values and save them when needed
      if(this.isSharedAttributesUpdateAllowed()) {
        if(!this['minLabel']) this['minLabel'] = this['minValue'];
        if(!this['maxLabel']) this['maxLabel'] = this['maxValue'];
        // share min, max values
        AttributeGroupManager.addSharedAttribute(this['discriminant'], 'minValue', this['minValue']);
        AttributeGroupManager.addSharedAttribute(this['discriminant'], 'maxValue', this['maxValue']);
        AttributeGroupManager.addSharedAttribute(this['discriminant'], 'minLabel', this['minLabel']);
        AttributeGroupManager.addSharedAttribute(this['discriminant'], 'maxLabel', this['maxLabel']);
      } else { 
        // use shared min, max values and min, max labels if they weren't set explicitly
        if(this['updateMinValue']) this['minValue'] = AttributeGroupManager.getSharedAttribute(this['discriminant'], 'minValue');
        if(this['updateMaxValue']) this['maxValue'] = AttributeGroupManager.getSharedAttribute(this['discriminant'], 'maxValue');
        if(!this['minLabel']) this['minLabel'] = AttributeGroupManager.getSharedAttribute(this['discriminant'], 'minLabel');
        if(!this['maxLabel']) this['maxLabel'] = AttributeGroupManager.getSharedAttribute(this['discriminant'], 'maxLabel');
      }
    } else {
      if(!this['minLabel']) this['minLabel'] = this['minValue'];
      if(!this['maxLabel']) this['maxLabel'] = this['maxValue'];
    }
    
    var colors = this._getRangeColors(amxNode);
    this._initColorMappings(colors);
  };
  
  /**
   *  See parent for comment.  
   */
  ContinuousAttributeGroup.prototype.processItem = function (attrGroupsNode) {
    var processedInfo = ContinuousAttributeGroup.superclass.processItem.call(this, attrGroupsNode);
    
    var value = +processedInfo['value'];
    this._updateMinMaxValues(value);
    
    return processedInfo;
  };
  
  ContinuousAttributeGroup.prototype._updateMinMaxValues = function(value) {
    if(this['updateMinValue'] && ((this['minValue'] == null) || value < this['minValue'])) this['minValue'] = value;
    if(this['updateMaxValue'] && ((this['maxValue'] == null) || value > this['maxValue'])) this['maxValue'] = value; 
  };
  
  /**
   *  See parent for comment.  
   */
  ContinuousAttributeGroup.prototype.ProcessItemValue = function(attrGroupsNode) {
    return attrGroupsNode.getAttribute('value');
  };
  
  /**
   *  See parent for comment.  
   */
  ContinuousAttributeGroup.prototype.isContinuous = function() {
    return true;
  };
  
  ContinuousAttributeGroup.prototype._getRangeColors = function(amxNode) {
    var colors = [];
    var value = null;
    var maxIndex = this._getColorAttributeMaxIndex();
    
    // we need at least 2 colors
    if(maxIndex < 2) maxIndex = 2;
    for(var i=0; i < maxIndex; i++) {
      value = this['attributeValuesResolver'].resolveDefaultValue('color', i);
      colors.push(value);
    }
    return adf.mf.internal.dvt.common.attributeGroup.ColorConverter.convertArrayToRGBA(colors);
  };
  
  ContinuousAttributeGroup.prototype._getColorAttributeMaxIndex = function() {
    var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
    var attrs = this['attributes'].iterator();
    var maxIndex = -1;
    var sharedMaxIndex;
    
    while(attrs.hasNext()) {
      var vals = /^\s*color([\d]+)\s*/.exec((attrs.next()['name']));
      if(vals && vals.length == 2 && ( (maxIndex == null) || (+vals[1] > maxIndex) )) {
        maxIndex = +vals[1];
      }
    }
    
    if(this['discriminant']) {
      if(this.isSharedAttributesUpdateAllowed()) {
        AttributeGroupManager.addSharedAttribute(this['discriminant'], 'colorAttributeMaxIndex', maxIndex);
      } else {
        sharedMaxIndex = AttributeGroupManager.getSharedAttribute(this['discriminant'], 'colorAttributeMaxIndex');
        if(sharedMaxIndex > maxIndex) maxIndex = sharedMaxIndex;
      }
    }
    return maxIndex;
  };
  
  /**
   *  Creates mapping of values to colors.
   *  @param colors array of colors
   *  @param minValue min value
   *  @param maxValue max value           
   */  
  ContinuousAttributeGroup.prototype._initColorMappings = function(colors) {
    this['colors'] = colors;
    var minValue = this['minValue'], maxValue = this['maxValue'];
    
    this['mappings'] = [];
    var diff = (Math.abs(maxValue) + Math.abs(minValue)) / (colors.length - 1);
    
    // map every color to particular value
    // first color will be mapped to min value
    // last color will be mapped to max value
    var mapping = null, tmpVal = null;
    for(var i=0; i<colors.length; i++) {
      if(i==0){
        tmpVal = minValue;
      } else if (i==(colors.length - 1)) {
        tmpVal = maxValue;
      } else {
        tmpVal = tmpVal + diff;
      }
      mapping = {"value": tmpVal, "color": colors[i]};
      this['mappings'].push(mapping);
    }
  };
  
  ContinuousAttributeGroup.prototype._getRangeMappings = function(value) {
    var i;
    var mappings = this['mappings'];
    var mapping = null, rangeMappings = [];
    if(value <= this['minValue']) {
      mapping = mappings[0];
    } else if(value >= this['maxValue']) {
      mapping = mappings[mappings.length-1];
    } else {
      for(i=0; i<mappings.length; i++) {
        if(value == mappings[i].value) {
          mapping = mappings[i];
          break;
        }
      }
    }
    
    if(mapping != null) {
      rangeMappings.push(mapping);
    } else {
      for(i=0; i<mappings.length; i++) {
        if(value > mappings[i].value && value < mappings[i + 1].value) {
          rangeMappings.push(mappings[i]);
          rangeMappings.push(mappings[i+1]);
          break;
        }
      }
    }
    
    return rangeMappings;
  };
  
  /**
   *  See parent for comment.  
   */  
  ContinuousAttributeGroup.prototype.ResolveValue = function(type, appliedRules, value) {
    var resolved = appliedRules.resolveValue(type);
    
    if(resolved == null) {
      resolved = this._getColor(value);
    }
    
    return resolved;
  };
  
  /**
   *  Return css rgba color for given value.
   *  @param value value
   *  @return css rgba color for given value        
   */  
  ContinuousAttributeGroup.prototype._getColor = function(value) {
    value = +value;
    var range = this._getRangeMappings(value);
    var red = null;
    var green = null;
    var blue = null;
    var opacity = null;
    if(range.length == 1) {
      // exact match
      var col = range[0].color;
      red = col[0];
      green = col[1];
      blue = col[2];
      opacity = col[3];
    } else {
      var startCol = range[0].color;
      var startVal = range[0].value;
      var endCol = range[1].color;
      var endVal = range[1].value;
      
      // normalize
      var max, val;
      if(startVal < 0) {
        max = endVal + Math.abs(startVal);
        val = value + Math.abs(startVal);
      } else {
        max = endVal - Math.abs(startVal);
        val = value -  Math.abs(startVal);
      }
      
      var percent = Math.abs(val / max);
      
      red = startCol[0] + parseInt(percent * (endCol[0] - startCol[0]));
      green = startCol[1] + parseInt(percent * (endCol[1] - startCol[1]));
      blue = startCol[2] + parseInt(percent * (endCol[2] - startCol[2]));
      opacity = startCol[3] + (percent * (endCol[3] - startCol[3]));
    }
    return this._toRGBAColor([red, green, blue, opacity]);
  };
  
  ContinuousAttributeGroup.prototype._toRGBAColor = function(arr) {
    return "rgba("+arr[0]+", "+ arr[1]+", "+ arr[2]+ ", " + arr[3]+")";
  };
  
  /**
   *  See parrent for comment.  
   */  
  ContinuousAttributeGroup.prototype.getDescription = function() {
    var obj = ContinuousAttributeGroup.superclass.getDescription.call(this);
    obj['min'] = this['minValue'];
    obj['max'] = this['maxValue'];
    obj['minLabel'] = this['minLabel'];
    obj['maxLabel'] = this['maxLabel'];
    obj['colors'] = [];
    for(var i=0; i < this['colors'].length; i++){
      obj['colors'].push(this._toRGBAColor(this['colors'][i]));
    }
    obj['attributeType'] = 'continuous';
    return obj;
  };

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/DataItemConfig.js
 */
 (function(){
  
  /**
   *  Class representing data item configuration. Following configuration is supported:
   *  1. typeDefaultValue
   *          Default value for given type can be set. When no value is resolved for given type then this default value is set to an data item.              
   */ 
  var DataItemConfig = function()
  {
    this['defaultValues'] = {};
  };
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(DataItemConfig, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.common.attributeGroup.DataItemConfig');
  
  /**
   *  Adds type default value.
   *  @param type type
   *  @param defaultValue default value        
   */   
  DataItemConfig.prototype.addTypeDefaultValue = function(type, defaultValue) {
    this['defaultValues'][type] = defaultValue;
  };
  
  /**
   *  Returns default value for given type or undefined if no value is defined.
   *  @param type type
   *  @return default value for given type or undefined if no value is defined.        
   */
  DataItemConfig.prototype.getTypeDefaultValue = function(type) {
    return this['defaultValues'][type];
  };
  
  /**
   *  Returns array of types for which default value is defined or empty array if no override exists.
   *  @return array of types for which default value is defined or empty array if no override exists.        
   */
  DataItemConfig.prototype.getDefaultValueTypes = function() {
    return Object.keys(this['defaultValues']);
  };
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/DefaultPalettesValueResolver.js
 */
(function(){
  
  /**
   *  Default palettes values resolver. Currently supported palettes are shape, pattern and color.  
   */  
  var DefaultPalettesValueResolver = function()
  {
  };
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(DefaultPalettesValueResolver, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.common.attributeGroup.DefaultPalettesValueResolver');
  
  DefaultPalettesValueResolver.SHAPE = 'shape';
  DefaultPalettesValueResolver.PATTERN = 'pattern';
  DefaultPalettesValueResolver.COLOR = 'color'; 
  
  /**
   *  Returns defaults palette for given type. Returned value can be used to access defaults palette on amx nodes. 
   *  @param type type (supported types are shape, pattern, color)
   *  @return defaults palette name        
   */  
  DefaultPalettesValueResolver.getDefaultsPalette = function (type) {
    var defaultsPalette = null;
    switch (type)
    {
      case DefaultPalettesValueResolver.SHAPE:
        defaultsPalette = '_defaultShapes';
        break;
      case DefaultPalettesValueResolver.COLOR:
        defaultsPalette = '_defaultColors';
        break;
      case DefaultPalettesValueResolver.PATTERN:
        defaultsPalette = '_defaultPatterns';
        break;
      default:
        defaultsPalette = '_' + type;
    }
    return defaultsPalette;
  }; 
  
  /**
   *  Returns style defaults palette name for given type. Returned value can be used to access defaults palette on style defaults objects.
   *  @param type type (supported types are shape, pattern, color)
   *  @return style defaults palette name     
   */  
  DefaultPalettesValueResolver.getStyleDefaultsPalette = function (type) {
    var defaultsPalette = null;
    switch (type)
    {
      case DefaultPalettesValueResolver.SHAPE:
        defaultsPalette = 'shapes';
        break;
      case DefaultPalettesValueResolver.COLOR:
        defaultsPalette = 'colors';
        break;
      case DefaultPalettesValueResolver.PATTERN:
        defaultsPalette = 'patterns';
        break;
      default:
        defaultsPalette = null;
    }
    return defaultsPalette;
  };
  
  /**
   *  Returns value found on given index in defaults palette for given type.
   *  @param amxNode amx node
   *  @param type type
   *  @param index index in default palette for given type
   *  @return value found on given index in defaults palette for given type               
   */  
  DefaultPalettesValueResolver.resolveValue = function(amxNode, type, index) {
    var value = null;
    var defaults = null;
    var defaultsPalette = DefaultPalettesValueResolver.getDefaultsPalette(type);

    if(defaultsPalette && amxNode[defaultsPalette])
    {
      defaults = amxNode[defaultsPalette];          
      if(defaults != undefined && index >= 0 && defaults.length > 0) 
      {            
        value = defaults[index % defaults.length];
      }
    }
    
    return value;
  };
    
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/DiscreteAttributeGroup.js
 */
(function(){
  
  /**
   *  Discrete attribute group.  
   */  
  var DiscreteAttributeGroup = function()
  {
    adf.mf.internal.dvt.common.attributeGroup.AttributeGroup.apply(this);
  };
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(DiscreteAttributeGroup, 'adf.mf.internal.dvt.common.attributeGroup.AttributeGroup', 'adf.mf.internal.dvt.common.attributeGroup.DiscreteAttributeGroup');
  
  DiscreteAttributeGroup.prototype.Init = function (amxNode, attrGroupsNode)
  {
    DiscreteAttributeGroup.superclass.Init.call(this, amxNode, attrGroupsNode);
    this['attributeType'] = 'discrete';
  };
  
  DiscreteAttributeGroup.prototype.getDescription = function() {
    var obj = DiscreteAttributeGroup.superclass.getDescription.call(this);
    obj['attributeType'] = 'discrete';
    return obj;
  };

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/LegendItems.js
 */
(function(){
  
  /**
   *  Class representing legend items. To every category and exception rule corresponds one legend item.
   *  @param types types
   *  @param categories categories
   *  @param exceptionRules exception rules
   *  @param attributeValuesResolver attribute values resolver 
   */  
  var LegendItems = function(types, categories, exceptionRules, attributeValuesResolver)
  {
    this['types'] = types;
    this['categories'] = categories;
    this['exceptionRules'] = exceptionRules; 
    this['attributeValuesResolver'] = attributeValuesResolver;
    
    this['items'] = [];
    this._createItems();
  };
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(LegendItems, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.common.attributeGroup.LegendItems'); 
  
  /**
   *  Creates legend items array.    
   */  
  LegendItems.prototype._createItems = function () {
    var legendItem, exceptionRule;
    var attributeValuesResolver = this['attributeValuesResolver'];
    var items = this['items'];
    
    this['categories'].each(function(index, category){
       legendItem = {};
       legendItem['id'] = category['value'];
       legendItem['label'] = category['label'];
      
       attributeValuesResolver.resolveLegendValues(legendItem, index);
      
       items.push(legendItem); 
    });
    
    // create item for every exception rule
    var rules = this['exceptionRules'].getRules();
    for(var j=0; j < rules.length; j++) {
      exceptionRule = rules[j];
      
      legendItem = {};
      legendItem['id'] = exceptionRule['value'];
      legendItem['label'] = exceptionRule['label'];
      
      exceptionRule['attributes'].applyAttributes(legendItem); 
      
      this['items'].push(legendItem);
    }
    
    this['legendType'] = attributeValuesResolver.getLegendType();
  };
  
  /**
   *  Returns array of legend items. Each legend item has following form:
   *  {
   *    'id' : id,
   *    'label': label,
   *    'supported type' : type value,
   *    ...
   *    'supported type' : type value                  
   *  }     
   */  
  LegendItems.prototype.getItems = function () {
    return this['items']; 
  }; 
  
  /**
   * Returns legend type.
   */
  LegendItems.prototype.getLegendType = function() {
    return this['legendType'];
  };
    
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/attributeGroup/Rules.js
 */
(function(){
  
  var Attributes = adf.mf.internal.dvt.common.attributeGroup.Attributes;
  
  /**
   *  Class representing a set of attribute group rules. There does exist 2 types of rules: match rule and exception rule.        
   */  
  var Rules = function(matchrules, exceptionrules)
  {
    this['matchrules'] = matchrules ? matchrules : {};
    this['exceptionrules'] = exceptionrules ? exceptionrules : [];
  };
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(Rules, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.common.attributeGroup.Rules');
  
  /**
   *  Processes particular instance of attribute groups node and creates representation of each rule it does contain (when it does not exist yet).
   *  @param attrGroupsNode attribute groups node   
   *  @return array of applied rules indeces  
   */  
  Rules.prototype.processItemRules = function(attrGroupsNode, types) {
    var appliedExceptionRules = [], rule, child;
    
    var children = attrGroupsNode.getRenderedChildren();
    
    for (var i = 0; i < children.length; i++)
    {
      child = children[i];
      if(child.getTag().getName() == 'attributeMatchRule') {
        this._processMatchRule(child, attrGroupsNode, types);  
      }
      if(child.getTag().getName() == 'attributeExceptionRule') {
        index = this._addExceptionRule(child, attrGroupsNode, types);
        if(child.getAttribute('condition') == "true" || child.getAttribute('condition') == true) {
          appliedExceptionRules.push(index);
        }
      }
    }
    return appliedExceptionRules;
  };
  
  /**
   *  Returns rules by their indices. Type (of returned rules) can be restricted using optional ruleType parameter.
   *  This method returns instance of Rules class.   
   *  @param indices array of rule indices
   *  @param ruleType rule type
   *  @return rules in the form of Rules class instance            
   */  
  Rules.prototype.getByIndices = function(indices) {
    var exceptionrules = [];
    if(indices) {
      for(var i=0; i < indices.length; i++) {
        exceptionrules.push(this['exceptionrules'][indices[i]]);
      }
    }
    return new Rules(this['matchrules'], exceptionrules); 
  };
  
  /**
   *  Returns array of exception rules represented by this instance.
   *  Exception rules have following structure:
   *  { 
   *    'label' : 'Rule label',
   *    'attributes' : Attributes class instance,
   *    'value' : Unique string representing this rule            
   *  }
   *  
   *  @param ruleType rule type            
   *  @return array of rules.     
   */  
  Rules.prototype.getRules = function(ruleType) {
    return this['exceptionrules'];
  };
  
  /**
   *  Resolves type (e.g. color, pattern) value for the set of rules represented by this Rules class instance.  
   *  @param type type to be resolved (e.g. color, pattern)   
   *  @return value for given type or null if no value is specified for given type        
   */  
  Rules.prototype.resolveValue = function(type) {
    // match rules have been incorporated into default palettes -> process exception rules (preserve order)
    var rules = this['exceptionrules'], value;
    for(var i = rules.length-1; i >= 0; i--) {
      value = rules[i]['attributes'].resolveValue(type);
      if(value) {
        return value;
      }
    }
    return null;
  };
  
  /**
   *  Returns groups and value of last match rule for which given type (e.g. color, pattern) is defined (i.e. match rule that overrides given type).  
   *  @param type type to be resolved (e.g. color, pattern)  
   *  @return array of groups and their values for given type        
   */  
  Rules.prototype.resolveMatchRuleGroupsAndValue = function(type) {
    var ret = [], value;
    var keys = Object.keys(this['matchrules']);
    for (var i = 0, length = keys.length; i < length; i++)
    {
      var group = keys[i];
      value = this['matchrules'][group].resolveValue(type);
      if(value) ret[ret.length] = {'group': group, 'value' : value};
    }
    return ret;
  };
  
  /**
   *  For given attribute groups node and rule node returns newly created rule object. 
   *  @param ruleNode rule node
   *  @param attrGroupsNode attribute groups node     
   *  @return rule object    
   */ 
  Rules.prototype._processMatchRule = function (ruleNode, attrGroupsNode, types) {
    if(attrGroupsNode.getAttribute('value') == ruleNode.getAttribute('group')) {
      var group = ruleNode.getAttribute('group');
      var newAttributes = Attributes.processAttributes(ruleNode, types);
      if(this['matchrules'][group]) {
        this['matchrules'][group].merge(newAttributes);  
      } else {
        this['matchrules'][group] = newAttributes;  
      }
      newAttributes.merge(this['matchrules'][group]);
      
      if(newAttributes.size() > 0) {
        this['matchrules'][group] = newAttributes;  
      }
    }
  };
  
  /**
   *  Adds given exception rule to the exception rules array if it hasn't been added already.
   *  Returns rule index in the array.       
   *  @param ruleNode rule node
   *  @param attrGroupsNode attribute groups node
   *  @param types supported attribute types
   *  @return rule index in the array of all rules    
   */ 
  Rules.prototype._addExceptionRule = function (ruleNode, attrGroupsNode, types) {
    var attributes = Attributes.processAttributes(ruleNode, types);
      
    rule = {};
    rule['label'] = ruleNode.getAttribute('label');
    rule['attributes'] = attributes;
    // Sets unique identifier to a 'value' attribute of given exception rule
    rule['value'] = ruleNode.getId();
    
    var rules = this['exceptionrules'];

    // add only unique rule
    for(var i=0; i < rules.length; i++) {
      if(Rules._equals(rules[i], rule)) {
        return i;
      }
    }
    
    rules.push(rule);
    return rules.length - 1;
  };
  
  /**
   *  Returns true if rule1 equals rule2, otherwise returns false.
   *  @param rule1 first rule
   *  @param rule2 second rule      
   *  @return true if rule1 equals rule2, otherwise returns false    
   */  
  Rules._equals = function (rule1, rule2)
  {
    if(rule1 === rule2) return true;
    if(!rule1 || !rule2) return false;
    
    if(rule1['group'] != rule2['group']) return false;
    if(rule1['label'] != rule2['label']) return false;
    
    return Attributes.equals(rule1['attributes'], rule2['attributes']);
  };
    
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/axis/AxisLineRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
    
  var AxisLineRenderer = function()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(AxisLineRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.axis.AxisLineRenderer');
  
  AxisLineRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = AxisLineRenderer.superclass.GetAttributesDefinition.call(this);
    
    attrs['lineColor'] = {'path' : 'axisLine/lineColor', 'type' : AttributeProcessor['TEXT']};
    attrs['lineWidth'] = {'path' : 'axisLine/lineWidth', 'type' : AttributeProcessor['INTEGER']};    
    attrs['rendered'] = {'path' : 'axisLine/rendered', 'type' : AttributeProcessor['ON_OFF']};
    
    return attrs;
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/axis/AxisRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  
  var AXIS_TYPE = 
    {
      'X' : 'xAxis',
      'Y' : 'yAxis',
      'Y2' : 'y2Axis'
    } 
    
  /**
   * processes the node representing the axis tag
   *
   * @param amxNode  the current amxNode
   * @param axisNode amxNode representing the axis tag
   * @param axisId   the axis name (xAxis, yAxis, or y2Axis)
   */
  var AxisRenderer = function (axisType)
  { 
    if(AXIS_TYPE[axisType] === undefined)
    {
      throw new adf.mf.internal.dvt.exception.DvtmException('AxisType[' + axisType + '] not supported!');
    }
    this._axisType = AXIS_TYPE[axisType];
  } 
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(AxisRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.axis.AxisRenderer');
           
  /**
   * processes the components's child tags
   */
  AxisRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      this._renderers = 
      {
        'referenceObject' : { 'renderer' : new adf.mf.internal.dvt.common.axis.ReferenceObjectRenderer() },
        'referenceLine' : { 'renderer' : new adf.mf.internal.dvt.common.axis.ReferenceLineRenderer() },
        'referenceArea' : { 'renderer' : new adf.mf.internal.dvt.common.axis.ReferenceAreaRenderer() },
        'tickLabel' : { 'renderer' : new adf.mf.internal.dvt.common.axis.TickLabelRenderer(this._axisType === AXIS_TYPE['X']), 'maxOccurrences' : 1 },
        'axisLine' : { 'renderer' : new adf.mf.internal.dvt.common.axis.AxisLineRenderer(), 'maxOccurrences' : 1 },
        'majorTick' : { 'renderer' : new adf.mf.internal.dvt.common.axis.TickRenderer(true), 'maxOccurrences' : 1 },
        'minorTick' : { 'renderer' : new adf.mf.internal.dvt.common.axis.TickRenderer(false), 'maxOccurrences' : 1 }
      };
    }
    return this._renderers;
  } 
  
  AxisRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = AxisRenderer.superclass.GetAttributesDefinition.call(this);
    
    attrs['title'] = {'path' : 'title', 'type' : AttributeProcessor['TEXT']};
    attrs['axisMinValue'] = {'path' : 'min', 'type' : AttributeProcessor['FLOAT']};    
    attrs['axisMaxValue'] = {'path' : 'max', 'type' : AttributeProcessor['FLOAT']};
    attrs['dataMinValue'] = {'path' : 'dataMin', 'type' : AttributeProcessor['FLOAT']};    
    attrs['dataMaxValue'] = {'path' : 'dataMax', 'type' : AttributeProcessor['FLOAT']};
    attrs['majorIncrement'] = {'path' : 'step', 'type' : AttributeProcessor['FLOAT']};
    attrs['maxSize'] = {'path' : 'maxSize', 'type' : AttributeProcessor['TEXT']};
    attrs['minorIncrement'] = {'path' : 'minorStep', 'type' : AttributeProcessor['FLOAT']};
    attrs['minimumIncrement'] = {'path' : 'minStep', 'type' : AttributeProcessor['FLOAT']};
    attrs['scaledFromBaseline'] = {'path' : 'baselineScaling', 'type' : AttributeProcessor['TEXT']};
    attrs['size'] = {'path' : 'size', 'type' : AttributeProcessor['TEXT']};
    attrs['position'] = {'path' : 'position', 'type' : AttributeProcessor['TEXT']};
    if (this._axisType === AXIS_TYPE['X'])
    {
      attrs['timeRangeMode'] = {'path' : 'timeRangeMode', 'type' : AttributeProcessor['TEXT']};
    }
    if (this._axisType === AXIS_TYPE['Y2'])
    {
      attrs['alignTickMarks'] = {'path' : 'alignTickMarks', 'type' : AttributeProcessor['ON_OFF']};
    }
    if (this._axisType === AXIS_TYPE['X'])
    {
      attrs['viewportStartGroup'] = {'path' : 'viewportStartGroup', 'type' : AttributeProcessor['TEXT']};
      attrs['viewportEndGroup'] = {'path' : 'viewportEndGroup', 'type' : AttributeProcessor['TEXT']};
    }
    if (this._axisType === AXIS_TYPE['X'] || this._axisType === AXIS_TYPE['Y'])
    {
      attrs['viewportMinValue'] = {'path' : 'viewportMin', 'type' : AttributeProcessor['TEXT']};
      attrs['viewportMaxValue'] = {'path' : 'viewportMax', 'type' : AttributeProcessor['TEXT']};
    }

    return attrs;
  }
  
  AxisRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  { 
    options[this._axisType] = options[this._axisType] ? options[this._axisType] : {};
    
    var changed = AxisRenderer.superclass.ProcessAttributes.call(this, options[this._axisType], amxNode, context);
    
    // for time axis, convert viewport limits to timestamps
    if (this._axisType === AXIS_TYPE['X'] && (context['timeAxisType'] == 'enabled' || context['timeAxisType'] == 'mixedFrequency'))
    {
      if (options[this._axisType]['viewportMin'])
      {
        options[this._axisType]['viewportMin'] = AttributeProcessor['DATETIME'](options[this._axisType]['viewportMin']);
      }
      if (options[this._axisType]['viewportMax'])
      {
        options[this._axisType]['viewportMax'] = AttributeProcessor['DATETIME'](options[this._axisType]['viewportMax']);
      }
    }
    
    return changed;
  }
  
  AxisRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  { 
    options[this._axisType] = options[this._axisType] ? options[this._axisType] : {};
    
    AxisRenderer.superclass.ProcessChildren.call(this, options[this._axisType], amxNode, context);
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/axis/ReferenceAreaItemRenderer.js
 */
(function(){
   
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  
  var ReferenceAreaItemRenderer = function ()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(ReferenceAreaItemRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.axis.ReferenceAreaItemRenderer');
  
  ReferenceAreaItemRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = ReferenceAreaItemRenderer.superclass.GetAttributesDefinition.call(this);
   
    attrs['minValue'] = {'path' : 'min', 'type' : AttributeProcessor['FLOAT']};
    attrs['maxValue'] = {'path' : 'max', 'type' : AttributeProcessor['FLOAT']};
    attrs['x'] = {'path' : 'x', 'type' : AttributeProcessor['FLOAT']};
    
    return attrs;
  }
  
  ReferenceAreaItemRenderer.prototype.ProcessAttributes = function (options, referenceAreaNode, context)
  {
    options['items'] = options['items'] ? options['items'] : [];
    
    var item = {};
    ReferenceAreaItemRenderer.superclass.ProcessAttributes.call(this, item, referenceAreaNode, context);
    
    options['items'].push(item);
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/axis/ReferenceAreaRenderer.js
 */
(function(){

  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  
  var ReferenceAreaRenderer = function()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(ReferenceAreaRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.axis.ReferenceAreaRenderer');

  ReferenceAreaRenderer.prototype.GetChildRenderers = function (facetName)
  {
     if(this._renderers === undefined)
    {
      this._renderers = 
      {
        'referenceAreaItem' : { 'renderer' : new adf.mf.internal.dvt.common.axis.ReferenceAreaItemRenderer() }
      };
     }
    return this._renderers;
  }

  ReferenceAreaRenderer.prototype.GetChildrenNodes = function (amxNode, context)
  {
    return amxNode.getRenderedChildren(context['_currentFacet']);
  }

  /**
   * parses the referenceArea node attributes
   *
   * referenceArea has the following attributes
   *
   *   text       - String: tooltip and legend text for this reference line
   *   type       - String: line, area
   *   location   - String: front, back
   *   color      - String(Color): support CSS color values
   *   lineWidth  - Number
   *   lineStyle  - String
   *   lineValue  - Number
   *   lowValue   - Number
   *   highValue  - Number
   *   shortDesc   - String: custom tooltip for this reference line
   *   displayInLegend  - String: on/off - legend item should be added for this ref obj
   *
   */
  ReferenceAreaRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = ReferenceAreaRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['color'] = {'path' : 'color', 'type' : AttributeProcessor['TEXT']};
    attrs['displayInLegend'] = {'path' : 'displayInLegend', 'type' : AttributeProcessor['TEXT'], 'default' : 'on'};
    attrs['location'] = {'path' : 'location', 'type' : AttributeProcessor['TEXT']};
    attrs['minValue'] = {'path' : 'min', 'type' : AttributeProcessor['FLOAT']};
    attrs['maxValue'] = {'path' : 'max', 'type' : AttributeProcessor['FLOAT']};
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
    attrs['text'] = {'path' : 'text', 'type' : AttributeProcessor['TEXT']};
    attrs['lineType'] = {'path' : 'lineType', 'type' : AttributeProcessor['TEXT']};
    
    return attrs;
  }

  ReferenceAreaRenderer.prototype.ProcessAttributes = function (options, referenceAreaNode, context)
  {
    options['referenceObjects'] = options['referenceObjects'] ? options['referenceObjects'] : [];
    
    var refObj = 
    {
      'type' : 'area'
    };

    if (!referenceAreaNode.isReadyToRender())
    {
      throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException;
    }
    
    ReferenceAreaRenderer.superclass.ProcessAttributes.call(this, refObj, referenceAreaNode, context);
    
    context['__activeRefOBJ'] = refObj;
  }

  ReferenceAreaRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  { 
    var refObj = context['__activeRefOBJ'];
    delete context['__activeRefOBJ'];
     
    ReferenceAreaRenderer.superclass.ProcessChildren.call(this, refObj, amxNode, context);
    
    options['referenceObjects'].push(refObj);
  }

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/axis/ReferenceLineItemRenderer.js
 */
(function(){

  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
     
  var ReferenceLineItemRenderer = function ()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(ReferenceLineItemRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.axis.ReferenceLineItemRenderer');
  
  ReferenceLineItemRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = ReferenceLineItemRenderer.superclass.GetAttributesDefinition.call(this);
   
    attrs['value'] = {'path' : 'value', 'type' : AttributeProcessor['FLOAT']};
    attrs['x'] = {'path' : 'x', 'type' : AttributeProcessor['FLOAT']};
    
    return attrs;
  }
  
  ReferenceLineItemRenderer.prototype.ProcessAttributes = function (options, referenceLineNode, context)
  {
    options['items'] = options['items'] ? options['items'] : [];
    
    var item = {};
    ReferenceLineItemRenderer.superclass.ProcessAttributes.call(this, item, referenceLineNode, context);
    
    options['items'].push(item);
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/axis/ReferenceLineRenderer.js
 */
(function(){

  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;

  var ReferenceLineRenderer = function()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(ReferenceLineRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.axis.ReferenceLineRenderer');
  
  ReferenceLineRenderer.prototype.GetChildRenderers = function (facetName)
  {
     if(this._renderers === undefined)
    {
      this._renderers = 
      {
        'referenceLineItem' : { 'renderer' : new adf.mf.internal.dvt.common.axis.ReferenceLineItemRenderer() }
      };
    }
    return this._renderers;
  }

  ReferenceLineRenderer.prototype.GetChildrenNodes = function (amxNode, context)
  {
    return amxNode.getRenderedChildren(context['_currentFacet']);
  }

  /**
   * parses the referenceLine node attributes
   *
   * referenceLine has the following attributes
   *
   *   text       - String: tooltip and legend text for this reference line
   *   type       - String: line, area
   *   location   - String: front, back
   *   color      - String(Color): support CSS color values
   *   lineWidth  - Number
   *   lineStyle  - String
   *   lineType   - String
   *   lineValue  - Number
   *   lowValue   - Number
   *   highValue  - Number
   *   shortDesc   - String: custom tooltip for this reference line
   *   displayInLegend  - String: on/off - legend item should be added for this ref obj
   *
   */
  ReferenceLineRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = ReferenceLineRenderer.superclass.GetAttributesDefinition.call(this);
    
    attrs['color'] = {'path' : 'color', 'type' : AttributeProcessor['TEXT']};
    attrs['displayInLegend'] = {'path' : 'displayInLegend', 'type' : AttributeProcessor['TEXT'], 'default' : 'on'};
    attrs['lineStyle'] = {'path' : 'lineStyle', 'type' : AttributeProcessor['TEXT']};
    attrs['lineWidth'] = {'path' : 'lineWidth', 'type' : AttributeProcessor['INTEGER']};
    attrs['lineType'] = {'path' : 'lineType', 'type' : AttributeProcessor['TEXT']};
    attrs['location'] = {'path' : 'location', 'type' : AttributeProcessor['TEXT']};
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
    attrs['text'] = {'path' : 'text', 'type' : AttributeProcessor['TEXT']};
    attrs['value'] = {'path' : 'value', 'type' : AttributeProcessor['FLOAT']};
    
    return attrs;
  }

  ReferenceLineRenderer.prototype.ProcessAttributes = function (options, referenceLineNode, context)
  {
    //options['referenceObjects'] = options['referenceObjects'] ? options['referenceObjects'] : [];

    var refObj = 
    {
      'type' : 'line'
    };

    if (!referenceLineNode.isReadyToRender())
    {
      throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException;
    }
    
    ReferenceLineRenderer.superclass.ProcessAttributes.call(this, refObj, referenceLineNode, context);
    
    context['__activeRefOBJ'] = refObj;
  }

  ReferenceLineRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  { 
    var refObj = context['__activeRefOBJ'];
    delete context['__activeRefOBJ'];

    // see if we got the array property name to populate, use 'referenceObjects' as default 
    var refObjPropertyName = context['__refObjPropertyName'];
    if (!refObjPropertyName)
      refObjPropertyName ='referenceObjects';

    // initialize the referenceObjects array
    if (options[refObjPropertyName] === undefined)
      options[refObjPropertyName] = [];
    
    ReferenceLineRenderer.superclass.ProcessChildren.call(this, refObj, amxNode, context);
    
    options[refObjPropertyName].push(refObj);
  }

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/axis/ReferenceObjectRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;   
    
  var ReferenceObjectRenderer = function()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(ReferenceObjectRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.axis.ReferenceObjectRenderer');
  
  /**
   * parses the referenceObject node attributes
   *
   * referenceObject has the following attributes
   *
   *   text       - String: tooltip and legend text for this reference object
   *   type       - String: line, area
   *   location   - String: front, back
   *   color      - String(Color): support CSS color values
   *   lineWidth  - Number
   *   lineStyle  - String
   *   lineValue  - Number
   *   lowValue   - Number
   *   highValue  - Number
   *   shortDesc   - String: custom tooltip for this reference object
   *   displayInLegend  - String: on/off - legend item should be added for this ref obj
   *
   */
  ReferenceObjectRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = ReferenceObjectRenderer.superclass.GetAttributesDefinition.call(this);
    
    attrs['text'] = {'path' : 'text', 'type' : AttributeProcessor['TEXT']};
    attrs['type'] = {'path' : 'type', 'type' : AttributeProcessor['TEXT']};
    attrs['location'] = {'path' : 'location', 'type' : AttributeProcessor['TEXT']};
    attrs['color'] = {'path' : 'color', 'type' : AttributeProcessor['TEXT']};
    attrs['lineWidth'] = {'path' : 'lineWidth', 'type' : AttributeProcessor['INTEGER']};
    attrs['lineStyle'] = {'path' : 'lineStyle', 'type' : AttributeProcessor['TEXT']};
    attrs['lineValue'] = {'path' : 'value', 'type' : AttributeProcessor['FLOAT']};
    attrs['value'] = {'path' : 'value', 'type' : AttributeProcessor['FLOAT']};
    attrs['lowValue'] = {'path' : 'min', 'type' : AttributeProcessor['FLOAT']};
    attrs['highValue'] = {'path' : 'max', 'type' : AttributeProcessor['FLOAT']};
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
    attrs['displayInLegend'] = {'path' : 'displayInLegend', 'type' : AttributeProcessor['TEXT']};
    
    return attrs;
  }
  
  ReferenceObjectRenderer.prototype.ProcessAttributes = function (options, referenceObjNode, context)
  {  
    options['referenceObjects'] = options['referenceObjects'] ? options['referenceObjects'] : [];
    
    var refObj = {};
    
    var changed = ReferenceObjectRenderer.superclass.ProcessAttributes.call(this, refObj, referenceObjNode, context);

    options['referenceObjects'].push(refObj);
    
    return changed;
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/axis/TickLabelRenderer.js
 */
(function(){

  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
 
  var TickLabelRenderer = function(xAxis, metric)
  {
    this._isXAxis = xAxis;
    this._isMetric = metric;
  }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(TickLabelRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.axis.TickLabelRenderer');
  
  /** parses tickLabel node attributes
   *
   *  tickLabel has the following attributes:
   *
   *  autoPrecision     - String: on, off
   *  rendered          - Boolean: true if the tickLabel should be rendered
   *  scaling           - String: auto, none, thousand, million, billion, trillion, quadrillion
   *  style             - String: font related CSS attributes
   *
   */
  TickLabelRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = TickLabelRenderer.superclass.GetAttributesDefinition.call(this);
   
    attrs['autoPrecision'] = {'path' : 'autoPrecision', 'type' : AttributeProcessor['TEXT']};
    attrs['scaling'] = {'path' : 'scaling', 'type' : AttributeProcessor['TEXT']};
    attrs['labelStyle'] = {'path' : 'style', 'type' : AttributeProcessor['TEXT']};
    attrs['rendered'] = {'path' : 'rendered', 'type' : AttributeProcessor['ON_OFF'], 'default' : 'on'};
    
    if (this._isMetric === true)
    {
      attrs['textType'] = {'path' : 'textType', 'type' : AttributeProcessor['TEXT'], 'default' : 'number'};
      attrs['text'] = {'path' : 'text', 'type' : AttributeProcessor['TEXT']};
      attrs['position'] = {'path' : 'position', 'type' : AttributeProcessor['TEXT']};
    }
    
    if (this._isXAxis === true) 
    {
      attrs['rotation'] = {'path' : 'rotation', 'type' : AttributeProcessor['TEXT']};
    }
    attrs['position'] = {'path' : 'position', 'type' : AttributeProcessor['TEXT']};
    
    return attrs;
  }
  /**
   *  converter         - Object: numberConverter or dateTimeConverter 
   */
  TickLabelRenderer.prototype.ProcessAttributes = function (options, labelNode, context)
  {
    var root = this._isMetric === true ? 'metricLabel' : 'tickLabel';    
    options[root] = options[root] ? options[root] : {};
    
    var changed = TickLabelRenderer.superclass.ProcessAttributes.call(this, options[root], labelNode, context);
    
    // if amx:convertNumber or amx:convertDateTime is used as a child tag of the tickLabel,
    // then the labelNode would have a converter object
    // we pass that converter to js chart API
    // TODO: check this
    var converter = labelNode.getConverter();
    if (converter)
    {
      changed = true;
      options[root]['converter'] = converter;     
    }
    
    return changed;
  }  
})();  
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/axis/TickRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;

  var TickRenderer = function(majorTick)
  {
    this._majorTick = majorTick;
  }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(TickRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.axis.TickRenderer');
  
  /**
   * processes major/minorTick node attributes
   *
   * tick has the following attributes:
   *
   * lineColor      - String(Color): support CSS color values
   * lineWidth      - Number: e.g. 1
   * rendered       - Boolean: true if the tick should be rendered
   *                  default true for major, false for minor ticks
   */
  TickRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = TickRenderer.superclass.GetAttributesDefinition.call(this);
    
    var root = this._majorTick === true ? 'majorTick/' : 'minorTick/';
    
    attrs['lineColor'] = {'path' : root + 'lineColor', 'type' : AttributeProcessor['TEXT']};
    attrs['lineWidth'] = {'path' : root + 'lineWidth', 'type' : AttributeProcessor['INTEGER']};
    attrs['lineStyle'] = {'path' : root + 'lineStyle', 'type' : AttributeProcessor['TEXT']};
    attrs['rendered'] = {'path' : root + 'rendered', 'type' : AttributeProcessor['ON_OFF']};

    if (this._majorTick === true)
    {
      attrs['baselineColor'] = {'path' : root + 'baselineColor', 'type' : AttributeProcessor['TEXT']};
      attrs['baselineWidth'] = {'path' : root + 'baselineWidth', 'type' : AttributeProcessor['INTEGER']};
      attrs['baselineStyle'] = {'path' : root + 'baselineStyle', 'type' : AttributeProcessor['TEXT']};
    }
    return attrs;
  }  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/format/FormatRenderer.js
 */
(function(){
  
  var FORMAT_TYPE = 
  {
    'X' : 'x',
    'Y' : 'y',
    'Y2' : 'y2',
    'Z' : 'z',
    'PIE' : 'value',
    '*' : '*'
  } 

  /**
   * Format renderer
   * 
   * Handles rendering of the old (now deprecated) xFormat, yFormat, etc. tags.
   * The new dvtm:chartFormatRenderer is handled by the ValueFormatRenderer class.
   */
  var FormatRenderer = function(formatType)
  { 
    if(FORMAT_TYPE[formatType] === undefined)
    {
      throw new adf.mf.internal.dvt.exception.DvtmException('FormatType[' + formatType + '] not supported!');
    }
    this._formatType = FORMAT_TYPE[formatType];
  }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(FormatRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.format.FormatRenderer');
  
  
  FormatRenderer.prototype.ProcessAttributes = function (options, childAmxNode, context)
  {
    var type;
    var converter;
    var tooltipLabel;
    
    if (this._formatType == '*')
    {
      // new style -- get the type from the chartValueFormat attribute
      type = childAmxNode.getAttribute('type');
    }
    else
    {
      // get type for the old format tags (xFormat, yFormat, etc.)
      type = this._formatType;
    }
    // get the converter object
    converter = childAmxNode.getConverter();
    // if no type or converter attributes defined, do nothing
    if (type)
    {
      // store the new valueFormat properties into the options/valueFormats array
      var path = new adf.mf.internal.dvt.util.JSONPath(options, 'valueFormats');
      var item = { 'type' : type };
      
      if (converter) 
      {
        item['converter'] = converter;
      }
      
      if (childAmxNode.isAttributeDefined('scaling'))
      {
        item['scaling'] = childAmxNode.getAttribute('scaling');
      }
      if (childAmxNode.isAttributeDefined('tooltipLabel'))
      {
        item['tooltipLabel'] = childAmxNode.getAttribute('tooltipLabel');
      }
      if (childAmxNode.isAttributeDefined('tooltipDisplay'))
      {
        item['tooltipDisplay'] = childAmxNode.getAttribute('tooltipDisplay');        
      }
        
      var valueFormats = path.getValue();
      // if there's no valueFormats array yet, create it
      if (valueFormats === undefined)
      {
        valueFormats = [];
        path.setValue(valueFormats);
      }
      // add the new valueFormat object
      valueFormats.push(item);
      
      return true;
    }
    // options not modified
    return false;
  }

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/format/SliceLabelFormatRenderer.js
 */
/**
 * @deprecated
 * Bug 17198668 - deprecate pie slicelabel tag
 * Bug 17198620 - uptake chart json api changes for slicelabel
 * sliceLabel is deprecated now, use attributes in pieChart like sliceLabelPosition, sliceLabelType, sliceLabelStyle
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;   
  
  var SliceLabelFormatRenderer = function()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(SliceLabelFormatRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.format.SliceLabelFormatRenderer');
  
  /**
  * textType processor replaces deprecated value 'value' with value 'number' 
  */
  var SliceLabelTextTypeAttributeProcessor = function (value)
  {
    var result = AttributeProcessor['TEXT'](value);

    if (result === 'value')
    {
      result = 'number';
    }

    return result;
  }

   /** parses sliceLabel node attributes
   *  sliceLabel has the following attributes:
   *
   *  position        - String: none, inside, outside
   *  style           - String: accepts font related CSS attributes
   *  textType        - String: text, value, percent, textAndPercent
   *  //scaling         - String: auto, none, thousand, million, billion, trillion, quadrillion
   *  //autoPrecision   - String: on (default), off
   */
  SliceLabelFormatRenderer.prototype.GetAttributesDefinition = function (amxNode)
  {
    var attrs = SliceLabelFormatRenderer.superclass.GetAttributesDefinition.call(this);
        
    var root = 'styleDefaults';
      attrs['position'] = {'path' : root + '/sliceLabelPosition', 'type' : AttributeProcessor['TEXT']}; 
      attrs['textType'] = {'path' : root + '/sliceLabelType', 'type' : SliceLabelTextTypeAttributeProcessor};
    
    return attrs;
  }
  
  /** 
   *  converter       - Object: numberConverter
   */
  SliceLabelFormatRenderer.prototype.ProcessAttributes = function (options, sliceLabelNode, context)
  {
    var changed = SliceLabelFormatRenderer.superclass.ProcessAttributes.call(this, options, sliceLabelNode, context);
    
    var converter = sliceLabelNode.getConverter();
    if (converter)
    {  
      (new adf.mf.internal.dvt.util.JSONPath(options, 'styleDefaults/sliceLabel/converter')).setValue(converter);     
      return true;
    }
    return changed;
  }  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/layer/AreaDataLayerRenderer.js
 */
(function()
{
  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  
  var AreaDataLayerRenderer = function()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(AreaDataLayerRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.layer.AreaDataLayerRenderer');

  AreaDataLayerRenderer.prototype.ProcessAttributes = function (options, areaDataLayerNode, context)
  {
    var amxNode = context['amxNode'];
    if (areaDataLayerNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(areaDataLayerNode.getAttribute('rendered')))
      return;

    if (!areaDataLayerNode.isReadyToRender())
    {
      throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException();
    }

    var dataLayer = {};

    var areaLayerNode = areaDataLayerNode.getParent();

    dataLayer['associatedLayer'] = areaLayerNode.getAttribute('layer');
    var layerOptions = null;
    for (var i = 0; i < options['areaLayers'].length; i++) 
    {
      if (options['areaLayers'][i]['layer'] === dataLayer['associatedLayer']) 
      {
        layerOptions = options['areaLayers'][i];
        break;
      }
    }

    if (layerOptions === null)
    {
      throw new adf.mf.internal.dvt.exception.DvtmException('Area layer "' + areaLayerNode.getAttribute('layer') + '" was not found!');
    }
    if (areaDataLayerNode.getId() !== undefined)
      dataLayer['id'] = areaDataLayerNode.getId();

    if (areaDataLayerNode.isAttributeDefined('animationDuration'))
      dataLayer['animationDuration'] = areaDataLayerNode.getAttribute('animationDuration');

    if (areaDataLayerNode.isAttributeDefined('animationOnDataChange'))
      dataLayer['animationOnDataChange'] = areaDataLayerNode.getAttribute('animationOnDataChange');

    if (areaDataLayerNode.isAttributeDefined('disclosedItems'))
      dataLayer['disclosedItems'] = areaDataLayerNode.getAttribute('disclosedItems');

    if (areaDataLayerNode.isAttributeDefined('isolatedRowKey'))
      dataLayer['isolatedItem'] = areaDataLayerNode.getAttribute('isolatedRowKey');

    var prevSelection = amxNode.getAttribute('__userselection') ? amxNode.getAttribute('__userselection')[areaDataLayerNode.getId()] : null;
    if (prevSelection)
    {
      dataLayer['selection'] = prevSelection;
    }
    else if (areaDataLayerNode.isAttributeDefined('selectedRowKeys'))
    {  
      dataLayer['selection'] = AttributeProcessor['ROWKEYARRAY'](areaDataLayerNode.getAttribute('selectedRowKeys'));
      var userSelection = amxNode.getAttribute('__userselection') || {};
      userSelection[areaDataLayerNode.getId()] = dataLayer['selection'];
      amxNode.setAttributeResolvedValue('__userselection', userSelection);
    }
    if (areaDataLayerNode.isAttributeDefined('dataSelection'))
      dataLayer['selectionMode'] = areaDataLayerNode.getAttribute('dataSelection');

    if (areaDataLayerNode.isAttributeDefined('emptyText'))
      dataLayer['emptyText'] = areaDataLayerNode.getAttribute('emptyText');

    AttributeGroupManager.init(context);
    
    // process stamped children
    dataLayer['areas'] = [];
    dataLayer['markers'] = [];
    
    // amxNode.value is the array of "stamps"
    var value = areaDataLayerNode.getAttribute('value');
    if(value)
    {
      // collection is available so iterate through data and process each areaLocation
      var iter = adf.mf.api.amx.createIterator(value);
      while (iter.hasNext())
      {
        var stamp = iter.next();
        var children = areaDataLayerNode.getChildren(null, iter.getRowKey());     
        // iteration through all child elements
        var iter2 = adf.mf.api.amx.createIterator(children);
        while (iter2.hasNext())
        {
          var areaLocNode = iter2.next();
          var rowKey = iter.getRowKey();
          // process each location node
          adf.mf.internal.dvt.processAreaLocation.call(this, amxNode, dataLayer, areaLocNode, rowKey, context);
        }
      }
    }
    else
    {
      // collection does not exist so iterate only through child tags
      // and resolve them without var context variable
      var tagChildren = areaDataLayerNode.getChildren();
      var tagIterator = adf.mf.api.amx.createIterator(tagChildren);
      while (tagIterator.hasNext())
      {
        var tagAreaLocNode = tagIterator.next();
        var tagAreaRowKey = "" + (tagIterator.getRowKey() + 1);
        // process each location node
        adf.mf.internal.dvt.processAreaLocation.call(this, amxNode, dataLayer, tagAreaLocNode, tagAreaRowKey, context);
      }
    }
    layerOptions['areaDataLayer'] = dataLayer;
    
    AttributeGroupManager.applyAttributeGroups(amxNode, null, context);
    
    return false;
  }

  AreaDataLayerRenderer.prototype.ProcessChildren = function (options, areaDataLayerNode, context)
  {
    if (areaDataLayerNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(areaDataLayerNode.getAttribute('rendered')))
      return;

    return AreaDataLayerRenderer.superclass.ProcessChildren.call(this, options, areaDataLayerNode, context);
  }

  adf.mf.internal.dvt.processAreaLocation = function(amxNode, dataLayer, areaLocNode, rowKey, context)
  {
    if (areaLocNode.getTag().getName() !== 'areaLocation')
      return;

    if (!areaLocNode.isAttributeDefined('rendered') || adf.mf.api.amx.isValueTrue(areaLocNode.getAttribute('rendered')))
    {
      var areaLocChildren = areaLocNode.getChildren();
      for (var i=0; i<areaLocChildren.length; i++) {
        var childData = {};
        childData['location'] = areaLocNode.getAttribute('name');
        //childData['type'] = areaLocChildren[i].getTag().getName()
        childData['id'] = rowKey;
        adf.mf.internal.dvt.processThematicMapDataItem.call(this, amxNode, childData, areaLocChildren[i], context);
        if (areaLocChildren[i].getTag().getName() === 'area') {
          dataLayer['areas'].push(childData);
        } else 
        {
          dataLayer['markers'].push(childData);
        }
      }
    }
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/layer/AreaLayerRenderer.js
 */
(function(){

  var AreaLayerRenderer = function()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(AreaLayerRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.layer.AreaLayerRenderer');

  /**
   * processes the components's child tags
   */
  AreaLayerRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      this._renderers =
        {
          'areaDataLayer' : { 'renderer' : new adf.mf.internal.dvt.common.layer.AreaDataLayerRenderer() },
          // deprecated case
          'pointDataLayer' : { 'renderer' : new adf.mf.internal.dvt.common.layer.PointDataLayerRenderer() }
        };
    }

    return this._renderers;
  }

  AreaLayerRenderer.prototype.ProcessAttributes = function (options, layerNode, context)
  {
    var amxNode = context['amxNode'];
    if (layerNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(layerNode.getAttribute('rendered')))
      return;

    if (!layerNode.isReadyToRender())
    {
      throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException();
    }

    adf.mf.internal.dvt.setThematicMapLayerProperties.call(this, 'area', amxNode, layerNode);
    return true;
  }

  AreaLayerRenderer.prototype.ProcessChildren = function (options, layerNode, context)
  {
    if (layerNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(layerNode.getAttribute('rendered')))
      return;

    return AreaLayerRenderer.superclass.ProcessChildren.call(this, options, layerNode, context);
  }

   /**
   * Sets the thematic map properties found on the amxNode
   */
  adf.mf.internal.dvt.setThematicMapLayerProperties = function(type, amxNode, layerNode)
  {
    var options = this.GetDataObject(amxNode);
    if (!options['areaLayers'])
      options['areaLayers'] = [];
    var layer = {'labelDisplay': 'auto', 'labelType': 'short'};
    this.SetOptionsDirty(amxNode, true);

    if (layerNode.isAttributeDefined('layer'))
    {
      layer['layer'] = layerNode.getAttribute('layer');
      // load resource and base map layer
      if (!options['source'])
        adf.mf.internal.dvt.loadMapLayerAndResource.call(this, amxNode, options['basemap'], layer['layer']);
    }
    else
    {
      layer['layer'] = 'cities';
      layer['type'] = 'point';
      return;
    }

//    if (type)
//      layer['type'] = type;
    if (layerNode.isAttributeDefined('areaLabelDisplay'))
      layer['labelDisplay'] = layerNode.getAttribute('areaLabelDisplay');

    if (layerNode.isAttributeDefined('labelStyle'))
      layer['labelStyle'] = layerNode.getAttribute('labelStyle');

    if (layerNode.isAttributeDefined('labelType'))
      layer['labelType'] = layerNode.getAttribute('labelType');

//    if (layerNode.isAttributeDefined('animationDuration'))
//      layer['animationDuration'] = layerNode.getAttribute('animationDuration');

    if (layerNode.isAttributeDefined('animationOnLayerChange'))
      layer['animationOnLayerChange'] = layerNode.getAttribute('animationOnLayerChange');

    if (layerNode.isAttributeDefined('areaStyle'))
      layer['areaStyle'] = layerNode.getAttribute('areaStyle');
      
    options['areaLayers'].push(layer);
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/layer/AreaLayerRendererDT.js
 */
(function(){
  
  var AreaLayerRendererDT = function()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(AreaLayerRendererDT, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.layer.AreaLayerRendererDT');
  
  AreaLayerRendererDT.prototype.ProcessAttributes = function (options, layerNode, context)
  {
    var layer = {};
    
    layer['type'] = "area";    
    layer['layer'] = 'continents'; 
    if(layerNode)
    {
      layer['layer'] = this._nullIfEl(layerNode.getAttribute('layer'));
    }    
    if(!layer['layer'])
    {
      layer['layer'] = this._getDTModeTopLayer(options['basemap']);
    }
    
    if (!options['areaLayers'])
    {
      options['areaLayers'] = [];
    }
  
    // load resource and base map layer 
    adf.mf.internal.dvt.loadMapLayerAndResource.call(this, null, options['basemap'], layer['layer']); 
    options['areaLayers'].push(layer);
    return false;
  }    
    
  /**
   * functions check if value is EL expression. If so then it returns
   * null value.
   */
  AreaLayerRendererDT.prototype._nullIfEl = function(value)
  {
    if(!value || value == null || value.indexOf("#{") > -1) 
    {
      return null;
    }
    return value;
  }
  
  /**
   * function determines default top layer for given basemap.
   */
  AreaLayerRendererDT.prototype._getDTModeTopLayer = function(baseMap)
  {  
    var topLayer = adf.mf.internal.dvt.thematicmap.THEMATICMAP_DEFAULT_TOP_LAYER_MAPPING[baseMap];
    if(topLayer) 
    {
       return topLayer;
    }
    return null;    
  }
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/layer/AreaLocationRenderer.js
 */
(function(){
  
  var AreaLocationRenderer = function()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(AreaLocationRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.layer.AreaLocationRenderer');
  
  AreaLocationRenderer.prototype.ProcessAttributes = function (options, legendNode, context)
  {
    return false;
  }  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/layer/DataLayerRenderer.js
 */
(function ()
{
  var DOMUtils = adf.mf.internal.dvt.DOMUtils;

  var DataLayerRenderer = function ()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(DataLayerRenderer, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.common.layer.DataLayerRenderer');

  DataLayerRenderer.prototype.createChildrenNodes = function (amxNode)
  {
    return this._createDataLayerChildrenNodes(amxNode);
  }

  DataLayerRenderer.prototype.visitChildren = function (amxNode, visitContext, callback)
  {
    return this._visitDataLayerChildrenNodes(amxNode, visitContext, callback);
  }

  DataLayerRenderer.prototype.updateChildren = function (amxNode, attributeChanges)
  {
    return this._updateDataLayerChildrenNodes(amxNode, attributeChanges);
  }

  // END OF THE AMX INTERFACE
  /**
   * Create a data layer's children AMX nodes
   */
  DataLayerRenderer.prototype._createDataLayerChildrenNodes = function (amxNode)
  {
    var dataItems = amxNode.getAttribute("value");
    var parent = this._findRealParent(amxNode);
    if (dataItems === undefined)
    {
      if (amxNode.isAttributeDefined("value"))
      {
        
        // Mark it so the framework knows that the children nodes cannot be
        // created until the collection model has been loaded
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["INITIAL"]);
        return true;
      }
      // value attribute is not defined and we are in no collection mode
      // expect that childTags has attributes set independently on collection
      var children = amxNode.getTag().getChildren();
      for (var i = 0; i < children.length; i++)
      {
        var childAmxNode = children[i].buildAmxNode(amxNode);
        amxNode.addChild(childAmxNode);
      }
      amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
      return true;
    }
    else if (dataItems == null)
    {
      // No items, nothing to do
      return true;
    }
    var iter = adf.mf.api.amx.createIterator(dataItems);
    // copied from amx:listView - on refresh the component need to initiate
    // loading of rows not available in the cache
    if (iter.getTotalCount() > iter.getAvailableCount())
    {
      adf.mf.api.amx.showLoadingIndicator();
      //var currIndex = dataItems.getCurrentIndex();
      adf.mf.api.amx.bulkLoadProviders(dataItems, 0, -1, function ()
      {
        try 
        {
          // Call the framework to have the new children nodes constructed.
          var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
          args.setAffectedAttribute(amxNode, "value");
          adf.mf.api.amx.markNodeForUpdate(args);
        }
        finally 
        {
          adf.mf.api.amx.hideLoadingIndicator();
        }
      },
      function ()
      {
        adf.mf.api.adf.logInfoResource("AMXInfoMessageBundle", adf.mf.log.level.SEVERE, "createChildrenNodes", "MSG_ITERATOR_FIRST_NEXT_ERROR", req, resp);
        adf.mf.api.amx.hideLoadingIndicator();
      });

      amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
      return true;
    }

    if (parent && !parent.getAttribute('__userselection') && amxNode.isAttributeDefined('selectedRowKeys'))
    {
      var selection = adf.mf.internal.dvt.AttributeProcessor['ROWKEYARRAY'](amxNode.getAttribute('selectedRowKeys'));
      if (selection && selection.length > 0)
      {
        dataItems.setCurrentRowWithKey(selection[0]);
        parent.setAttributeResolvedValue('__userselection', selection);
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["INITIAL"]);
        return true;
      }
    }

    while (iter.hasNext())
    {
      iter.next();
      amxNode.createStampedChildren(iter.getRowKey(), null);
    }

    amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
    return true;
  }

  /**
   * Visits a data layer's children nodes
   */
  DataLayerRenderer.prototype._visitDataLayerChildrenNodes = function (amxNode, visitContext, callback)
  {
    var dataItems = amxNode.getAttribute("value");
    if (dataItems === undefined && !amxNode.isAttributeDefined("value"))
    {
      // visit child nodes in no collection mode since there is no value specified
      var children = amxNode.getChildren();
      for (var i = 0; i < children.length; i++)
      {
        if (children[i].visit(visitContext, callback))
        {
          return true;
        }
      }
      return false;
    }

    var iter = adf.mf.api.amx.createIterator(dataItems);
    var variableName = amxNode.getAttribute("var");

    while (iter.hasNext())
    {
      adf.mf.el.addVariable(variableName, iter.next());
      try 
      {
        if (amxNode.visitStampedChildren(iter.getRowKey(), null, null, visitContext, callback))
          return true;
      }
      finally 
      {
        adf.mf.el.removeVariable(variableName);
      }
    }
    return false;
  }

  /**
   * Update a data layer's children nodes
   */
  DataLayerRenderer.prototype._updateDataLayerChildrenNodes = function (amxNode, attributeChanges)
  {
    var parent = this._findRealParent(amxNode);
    if (attributeChanges.hasChanged("value"))
    {
      // remove the old stamped children
      var children;
      var j;
      var iter;
      if (amxNode.getState() === adf.mf.api.amx.AmxNodeStates["INITIAL"])
      {
        amxNode.setState(adf.mf.api.amx.AmxNodeStates["ABLE_TO_RENDER"]);
      }
      // create the new stamped children hierarchy
      var dataItems = amxNode.getAttribute("value");
      if (dataItems)
      {
        iter = adf.mf.api.amx.createIterator(dataItems);
        // copied from amx:listView - on refresh the component need to initiate
        // loading of rows not available in the cache
        if (iter.getTotalCount() > iter.getAvailableCount())
        {
          adf.mf.api.amx.showLoadingIndicator();
          //var currIndex = dataItems.getCurrentIndex();
          adf.mf.api.amx.bulkLoadProviders(dataItems, 0, -1, function ()
          {
            try 
            {
              // Call the framework to have the new children nodes constructed.
              var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
              args.setAffectedAttribute(amxNode, "value");
              adf.mf.api.amx.markNodeForUpdate(args);
            }
            finally 
            {
              adf.mf.api.amx.hideLoadingIndicator();
            }
          },
          function ()
          {
            adf.mf.api.adf.logInfoResource("AMXInfoMessageBundle", adf.mf.log.level.SEVERE, "updateChildrenNodes", "MSG_ITERATOR_FIRST_NEXT_ERROR", req, resp);
            adf.mf.api.amx.hideLoadingIndicator();
          });
          return adf.mf.api.amx.AmxNodeChangeResult["NONE"];
        }
      }

      var oldValue = attributeChanges.getOldValue("value");
      if (oldValue)
      {
        iter = adf.mf.api.amx.createIterator(oldValue);
        while (iter.hasNext())
        {
          iter.next();
          children = amxNode.getChildren(null, iter.getRowKey());
          for (j = children.length - 1; j >= 0; j--)
          {
            amxNode.removeChild(children[j]);
          }
        }
      }

      if (dataItems)
      {
        if (parent && !parent.getAttribute('__userselection') && amxNode.isAttributeDefined('selectedRowKeys'))
        {
          var selection = adf.mf.internal.dvt.AttributeProcessor['ROWKEYARRAY'](amxNode.getAttribute('selectedRowKeys'));
          if (selection && selection.length > 0)
          {
            parent.setAttributeResolvedValue('__userselection', selection)
            dataItems.setCurrentRowWithKey(selection[0]);
            return adf.mf.api.amx.AmxNodeChangeResult["NONE"];
          }
        }

        iter = adf.mf.api.amx.createIterator(dataItems);
        while (iter.hasNext())
        {
          iter.next();
          amxNode.createStampedChildren(iter.getRowKey(), null);
        }
      }
    }

    return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];
  }

  DataLayerRenderer.prototype._findRealParent = function (amxNode)
  {
    var parent = amxNode.getParent();
    while (parent && parent.getTag().getName() !== "thematicMap" && parent.getTag().getName() !== "geographicMap")
    {
      parent = parent.getParent();
    }

    return parent;
  }

  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'areaDataLayer', DataLayerRenderer);
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'pointDataLayer', DataLayerRenderer);
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/layer/PointDataLayerRenderer.js
 */
(function(){

  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  
  var PointDataLayerRenderer = function()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(PointDataLayerRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.layer.PointDataLayerRenderer');

  PointDataLayerRenderer.prototype.ProcessAttributes = function (options, pointDataLayerNode, context)
  {
    var amxNode = context['amxNode'];
    if (pointDataLayerNode.isAttributeDefined('rendered')
        && adf.mf.api.amx.isValueFalse(pointDataLayerNode.getAttribute('rendered')))
      return false;

    if (!pointDataLayerNode.isReadyToRender())
    {
      throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException();
    }

    var loadCityLayer = false;
    var dataLayer = {};

    var parentNode = pointDataLayerNode.getParent();
    var layerOptions = null;
    if(parentNode.getTag().getName() === 'areaLayer')
    {
      dataLayer['associatedWith'] = parentNode.getAttribute('layer');
      for (var i = 0; i < options['areaLayers'].length; i++) 
      {
        if (options['areaLayers'][i]['layer'] === dataLayer['associatedWith']) 
        {
          layerOptions = options['areaLayers'][i];
          break;
        }
      }
      if (layerOptions === null)
      {
        throw new adf.mf.internal.dvt.exception.DvtmException('Area layer "' + areaLayerNode.getAttribute('layer') + '" was not found!');
      }
    }
    else
    {
      layerOptions = options;
      adf.mf.internal.dvt.setThematicMapLayerProperties.call(this, 'point', amxNode, pointDataLayerNode);
    }
    dataLayer['associatedLayer'] = 'cities';

    if (pointDataLayerNode.getId() !== undefined)
      dataLayer['id'] = pointDataLayerNode.getId();

    if (pointDataLayerNode.isAttributeDefined('animationDuration'))
      dataLayer['animationDuration'] = pointDataLayerNode.getAttribute('animationDuration');

    if (pointDataLayerNode.isAttributeDefined('animationOnDataChange'))
      dataLayer['animationOnDataChange'] = pointDataLayerNode.getAttribute('animationOnDataChange');

    var prevSelection = amxNode.getAttribute('__userselection') ? amxNode.getAttribute('__userselection')[pointDataLayerNode.getId()] : null;
    if (prevSelection)
    {
      dataLayer['selection'] = prevSelection;
    }
    else if (pointDataLayerNode.isAttributeDefined('selectedRowKeys'))
    {  
      dataLayer['selection'] = AttributeProcessor['ROWKEYARRAY'](pointDataLayerNode.getAttribute('selectedRowKeys'));
      var userSelection = amxNode.getAttribute('__userselection') || {};
      userSelection[pointDataLayerNode.getId()] = dataLayer['selection'];
      amxNode.setAttributeResolvedValue('__userselection', userSelection);
    }
    if (pointDataLayerNode.isAttributeDefined('dataSelection'))
    {
      dataLayer['selectionMode'] = pointDataLayerNode.getAttribute('dataSelection');
    }

    if (pointDataLayerNode.isAttributeDefined('emptyText'))
      dataLayer['emptyText'] = pointDataLayerNode.getAttribute('emptyText');

    AttributeGroupManager.init(context);
    
    // process stamped children
    var varName = pointDataLayerNode.getAttribute("var");
    dataLayer['markers'] = [];
    // amxNode.value is the array of "stamps"
    var value = pointDataLayerNode.getAttribute('value');
    if(value)
    {
      // collection is available so iterate through data and process each pointLocation
      var iter = adf.mf.api.amx.createIterator(value);
      while (iter.hasNext()) {
        var stamp = iter.next();
        var children = pointDataLayerNode.getChildren(null, iter.getRowKey());      
        // iteration through all child elements
        var iter2 = adf.mf.api.amx.createIterator(children);
        while (iter2.hasNext()) {
          var pointLocNode = iter2.next();
          var rowKey = iter.getRowKey();
          // process each location node
          loadCityLayer = loadCityLayer | adf.mf.internal.dvt._processPointLocationNode.call(this, amxNode, dataLayer, pointLocNode, rowKey, context)
        }
      }
    }
    else
    {
      // collection does not exist so iterate only through child tags
      // and resolve them without var context variable
      var tagChildren = pointDataLayerNode.getChildren();
      var tagChildrenIterator = adf.mf.api.amx.createIterator(tagChildren);

      while (tagChildrenIterator.hasNext()) {
        var tagPointLocNode = tagChildrenIterator.next();
        var tagChildrenRowKey = "" + (tagChildrenIterator.getRowKey() + 1);
        // process each location node
        loadCityLayer = loadCityLayer | adf.mf.internal.dvt._processPointLocationNode.call(this, amxNode, dataLayer, tagPointLocNode, tagChildrenRowKey, context)
      }
    }
    /**
     * Following will add layer either in options root or in areaLayers.
     * It depends on where pointDataLayers are placed in AMX!
     */
    if (!layerOptions['pointDataLayers'])
    {
      layerOptions['pointDataLayers'] = [];
    }
    layerOptions['pointDataLayers'].push(dataLayer);    

    // load resource and base map layer
    if (!options['source'] && loadCityLayer)
      adf.mf.internal.dvt.loadMapLayerAndResource.call(this, amxNode, options['basemap'], 'cities');

    AttributeGroupManager.applyAttributeGroups(amxNode, null, context);
      
    return true;
  }

  PointDataLayerRenderer.prototype.ProcessChildren = function (options, dataLayer, context)
  {
    if (dataLayer.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(dataLayer.getAttribute('rendered')))
      return;

    return PointDataLayerRenderer.superclass.ProcessChildren.call(this, options, dataLayer, context);
  }

  adf.mf.internal.dvt._processPointLocationNode = function(amxNode, dataLayer, pointLocNode, rowKey, context)
  {
    var loadCityLayer = false;
    if (pointLocNode.getTag().getName() !== 'pointLocation')
      return loadCityLayer;
    if (!pointLocNode.isAttributeDefined('rendered') || adf.mf.api.amx.isValueTrue(pointLocNode.getAttribute('rendered')))
    {
      var markerNodes = pointLocNode.getChildren();
      if (markerNodes.length > 0) {
        var markerData = {};
        if (pointLocNode.isAttributeDefined('pointName'))
        {
          loadCityLayer = true;
          markerData['location'] = pointLocNode.getAttribute('pointName');
        }
        else if (pointLocNode.isAttributeDefined('pointX') && pointLocNode.isAttributeDefined('pointY'))
        {
          markerData['x'] = pointLocNode.getAttribute('pointX');
          markerData['y'] = pointLocNode.getAttribute('pointY');
        }
        markerData['type'] = 'marker';
        markerData['id'] = rowKey;
        adf.mf.internal.dvt.processThematicMapDataItem.call(this, amxNode, markerData, markerNodes[0], context);
        dataLayer['markers'].push(markerData);
      }
    }
    return loadCityLayer;
  }


})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/layer/PointLocationRenderer.js
 */
(function(){
  
  var PointLocationRenderer = function()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(PointLocationRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.layer.PointLocationRenderer');
  
  PointLocationRenderer.prototype.ProcessAttributes = function (options, legendNode, context)
  {
    
  }  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/layer/ThematicMapDataItemRenderer.js
 */
(function(){

  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
  
  var ThematicMapDataItemRenderer = function()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(ThematicMapDataItemRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.layer.ThematicMapDataItemRenderer');
  
 
  ThematicMapDataItemRenderer.prototype.ProcessAttributes = function (options, legendNode, context)
  {
    return false;
  }  
  
  adf.mf.internal.dvt.processThematicMapDataItem = function(amxNode, data, dataNode, context) 
  {
    var options = this.GetDataObject(amxNode);
  
    //First check if this data item should be rendered at all
    if (dataNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(dataNode.getAttribute('rendered')))
      return null;
      
    // process attribute groups, if any
    data['attrGroups'] = [];
    var attributeGroupsNodes = dataNode.getChildren();
    var iter = adf.mf.api.amx.createIterator(attributeGroupsNodes);
    while (iter.hasNext()) {
      var attributeGroupsNode = iter.next();
      AttributeGroupManager.processAttributeGroup(attributeGroupsNode, amxNode, context);
    }
    
    if (dataNode.isAttributeDefined('source'))
      data['source'] = adf.mf.api.amx.buildRelativePath(dataNode.getAttribute('source'));
    
    if (dataNode.isAttributeDefined('sourceHover'))
      data['sourceHover'] = adf.mf.api.amx.buildRelativePath(dataNode.getAttribute('sourceHover'));
      
    if (dataNode.isAttributeDefined('sourceSelected'))
      data['sourceSelected'] = adf.mf.api.amx.buildRelativePath(dataNode.getAttribute('sourceSelected'));
      
    if (dataNode.isAttributeDefined('sourceHoverSelected'))
      data['sourceHoverSelected'] = adf.mf.api.amx.buildRelativePath(dataNode.getAttribute('sourceHoverSelected'));
    
    if (dataNode.isAttributeDefined('gradientEffect'))
      data['gradientEffect'] = dataNode.getAttribute('gradientEffect');
    
    if (dataNode.isAttributeDefined('opacity'))
      data['opacity'] = +dataNode.getAttribute('opacity');

    if (dataNode.isAttributeDefined('borderStyle'))
      data['borderStyle'] = dataNode.getAttribute('borderStyle');
    
    if (dataNode.isAttributeDefined('borderColor'))
      data['borderColor'] = dataNode.getAttribute('borderColor');

    if (dataNode.isAttributeDefined('borderWidth'))
    {
      data['borderWidth'] = dataNode.getAttribute('borderWidth');
      if (!isNaN(data['borderWidth']))
      {
        if ((data['borderWidth'] > 0) && !dataNode.isAttributeDefined('borderStyle')) 
        {
          data['borderStyle'] = 'solid';
        }
      }
    }
 
    if (dataNode.isAttributeDefined('shortDesc'))
      data['shortDesc'] = dataNode.getAttribute('shortDesc');
    
    if (dataNode.getAttribute('labelDisplay') === 'on')
    {
      if (dataNode.isAttributeDefined('value'))
        data['label'] = dataNode.getAttribute('value');

      if (dataNode.isAttributeDefined('labelPosition'))
        data['labelPosition'] = dataNode.getAttribute('labelPosition');

      if (dataNode.isAttributeDefined('labelStyle'))
        data['labelStyle'] = dataNode.getAttribute('labelStyle');
    }

    if (dataNode.isAttributeDefined('rotation'))
      data['rotation'] = dataNode.getAttribute('rotation');
      
    if (dataNode.isAttributeDefined('width'))
      data['width'] = dataNode.getAttribute('width');
   
    if (dataNode.isAttributeDefined('height'))
      data['height'] = dataNode.getAttribute('height');
      
    if (dataNode.isAttributeDefined('scaleX'))
      data['scaleX'] = +dataNode.getAttribute('scaleX');
 
    if (dataNode.isAttributeDefined('scaleY'))
      data['scaleY'] = +dataNode.getAttribute('scaleY');    

    if (dataNode.isAttributeDefined('fillColor') && dataNode.getAttribute('fillColor')) {
      data['color'] = dataNode.getAttribute('fillColor');
    }

    if (dataNode.isAttributeDefined('fillPattern'))
      data['pattern'] = dataNode.getAttribute('fillPattern');
      
    if (dataNode.isAttributeDefined('shape'))
      data['shape'] = dataNode.getAttribute('shape');

    data['clientId'] = dataNode.getId();
    
    if (dataNode.isAttributeDefined('action')) 
    {
      data['action'] = data['id'];
    }
    else 
    {
      var firesAction = false;
      var actionTags;
      // should fire action, if there are any 'setPropertyListener' or 'showPopupBehavior' child tags  
      actionTags = dataNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'setPropertyListener');
      if (actionTags.length > 0)
        firesAction = true;
      else 
      {
        actionTags = dataNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'showPopupBehavior');
        if (actionTags.length > 0)
          firesAction = true;
      }
      if (firesAction) 
      {
        // need to set 'action' to some value to make the event fire
        data['action'] = data['id'];
      }
    }
    
    var config = new adf.mf.internal.dvt.common.attributeGroup.DataItemConfig();
    
    var shape = adf.mf.internal.dvt.common.attributeGroup.DefaultPalettesValueResolver.SHAPE;
    if (data['type'] === 'marker' &&  !dataNode.isAttributeDefined(shape)) {
      // old markerStyle.type was replaced by new keys: styleDefaults.dataMarkerDefaults.shape
      config.addTypeDefaultValue(shape, options['styleDefaults']['dataMarkerDefaults']['shape']);
    }

    AttributeGroupManager.registerDataItem(context, data, config);    
  }
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/legend/LegendRenderer.js
 */
(function()
{
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;

  var LegendRenderer = function()
  { };

  adf.mf.internal.dvt.DvtmObject.createSubclass(LegendRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.legend.LegendRenderer');

  /**
   * processes the components's child tags
   */
  LegendRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      this._renderers = 
        {
          'legendSection' : { 'renderer' : new adf.mf.internal.dvt.common.legend.LegendSectionRenderer() }
        };
    }
    return this._renderers;
  };

  LegendRenderer.prototype.GetOptions = function (options)
  {
    if (!options['legend'])
    {
      options['legend'] = {};
    }
    return options['legend'];
  };

  /**
   * Sets properties of a legend.
   *
   * The following properties are supported:
   *   rendered        - tag attribute
   *   backgroundColor - style template
   *   borderColor     - style template
   *   position        - tag attribute
   *   scrolling       - tag attribute
   *   textStyle       - style template
   *   titleHalign     - tag attribute
   *   titleStyle      - style template
   *   title           - tag attribute
   */
  LegendRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = LegendRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['rendered'] = {'path' :  'rendered', 'type' : AttributeProcessor['ON_OFF']};
    attrs['position'] = {'path' : 'position', 'type' : AttributeProcessor['TEXT']};
    attrs['scrolling'] = {'path' : 'scrolling', 'type' : AttributeProcessor['TEXT']};
    attrs['maxSize'] = {'path' : 'maxSize', 'type' : AttributeProcessor['TEXT']};
    attrs['size'] = {'path' : 'size', 'type' : AttributeProcessor['TEXT']};
    attrs['titleHalign'] = {'path' : 'titleHalign', 'type' : AttributeProcessor['TEXT']};
    attrs['sectionTitleHalign'] = {'path' : 'sectionTitleHalign', 'type' : AttributeProcessor['TEXT']};
    attrs['title'] = {'path' : 'title', 'type' : AttributeProcessor['TEXT']};   
    attrs['referenceObjectTitle'] = {'path' : 'referenceObjectTitle', 'type' : AttributeProcessor['TEXT']};

    return attrs;
  };

  LegendRenderer.prototype.ProcessAttributes = function (options, legendNode, context)
  {
    var changed = LegendRenderer.superclass.ProcessAttributes.call(this, options, legendNode, context);
    if(changed)
    {
      options = this.GetOptions(options);
      var position = (new adf.mf.internal.dvt.util.JSONPath(options, 'position')).getValue();
    
      if(position === 'none')
      {
        (new adf.mf.internal.dvt.util.JSONPath(options, 'rendered')).setValue('off');
      }
    }

    return changed;
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/legend/LegendSectionRenderer.js
 */
(function()
{
  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
  var LegendRenderer = adf.mf.internal.dvt.common.legend.LegendRenderer;
  
  var LegendSectionRenderer = function()
  { };
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(LegendSectionRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.legend.LegendSectionRenderer');
  
  // TODO: legendSection processing has changed
  /**
   * processes the legendSection node
   */
  LegendSectionRenderer.prototype.ProcessAttributes = function (options, legendSectionNode, context)
  {
    var amxNode = context['amxNode'];

    var agid;
    var ag;

    if (legendSectionNode.isAttributeDefined('source'))
    {
      agid = legendSectionNode.getAttribute('source');

      ag = AttributeGroupManager.findGroupById(amxNode, agid);

      // if the group could not be found by id, nothing to do here
      if (ag == null)
      {
        return;
      }

      // attribute group found, copy the info into the section legend
      var section = 
      {
        'title' : legendSectionNode.getAttribute('title'), 'items' : []
      };

      var legendItems = ag.getLegendItems();
      var legendItem = null;
      for (var i = 0;i < legendItems.length;i++)
      {
        legendItem = legendItems[i]; 
        var item = 
        {
          'id' : legendItem['id']
        };

        item.text = legendItem['label'];

        if (legendItem['color'])
        {
          item['color'] = legendItem['color'];
        }
        if (legendItem['shape'])
        {
          item['markerShape'] = legendItem['shape'];
        }
        if (legendItem['pattern'])
        {
          item['pattern'] = legendItem['pattern'];
        }

        section['items'].push(item);
      }

      var sectionsPath = (new adf.mf.internal.dvt.util.JSONPath(options, 'sections'));
      var sections = sectionsPath.getValue();
      if(!sections)
      {
        sections = [];
        sectionsPath.setValue(sections);
      }

      sections.push(section);
    }
    return false;
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    common/overview/OverviewRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  
  var OverviewRenderer = function()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(OverviewRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.common.overview.OverviewRenderer');
  
  /**
   * Sets properties of an overview.
   *
   * The following properties are supported:
   *   rendered        - tag attribute
   */
  OverviewRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = OverviewRenderer.superclass.GetAttributesDefinition.call(this);
    
    attrs['rendered'] = {'path' :  'overview/rendered', 'type' : AttributeProcessor['ON_OFF'], 'default' : 'on'};
    attrs['inlineStyle'] = {'path' : 'overview/style', 'type' : AttributeProcessor['TEXT']};
    
    return attrs;
  }
  
  OverviewRenderer.prototype.ProcessAttributes = function (options, overviewNode, context)
  {
    var changed = OverviewRenderer.superclass.ProcessAttributes.call(this, options, overviewNode, context);
    
    return changed;
  }  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    exception/DvtmException.js
 */
(function()
{ 
  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.exception');
   /*
   * Represents any of the DVT flavored exceptions
   */
  adf.mf.internal.dvt.exception.DvtmException = function (message)
  {
    this.name = 'DvtmException';
    this.message = (message || "Generic Dvtm Exception");
  };
  adf.mf.internal.dvt.exception.DvtmException.prototype = new Error();
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    exception/NodeNotReadyToRenderException.js
 */
(function()
{  
  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.exception');
  /*
   * Represents an exception when a node cannot be rendered due to missing data.
   */
  adf.mf.internal.dvt.exception.NodeNotReadyToRenderException = function (message)
  {
    this.name = 'NodeNotReadyToRenderException';
    this.message = (message || "Node not ready to render");
  };
  adf.mf.internal.dvt.exception.NodeNotReadyToRenderException.prototype = new Error();
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    gauge/DialGaugeRenderer.js
 */
(function(){

  var dialGaugeStyles = {};
  var dialGaugeStylesResolved = false;
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
   
  var DialGaugeRenderer = function ()
  { }
  
  DialGaugeRenderer.DEFAULT_HEIGHT = 150;  
  DialGaugeRenderer.DEFAULT_WIDTH = 150;

  adf.mf.internal.dvt.DvtmObject.createSubclass(DialGaugeRenderer, 'adf.mf.internal.dvt.gauge.BaseGaugeRenderer', 'adf.mf.internal.dvt.gauge.DialGaugeRenderer');
 
  DialGaugeRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = DialGaugeRenderer.superclass.GetStyleClassesDefinition.call(this);
    
    styleClasses['dvtm-gaugeTickLabel'] = 
    {
      'builderFunction' : createDialGaugeClassFunction('dvtm-gaugeTickLabel'),
      'path' : 'tickLabel/style', 'type' : StyleProcessor['CSS_TEXT']
    }; 
    
    styleClasses['dvtm-gaugeMetricLabel'] = 
    {
      'builderFunction' : createDialGaugeClassFunction('dvtm-gaugeMetricLabel'),
      'path' : 'metricLabel/style', 'type' : StyleProcessor['CSS_TEXT']
    }
    
    return styleClasses; 
  } 
  
  var createDialGaugeClassFunction = function (baseClass)
  {
    return function (amxNode)
    {
      if(amxNode.isAttributeDefined('background'))
      {
        return baseClass + ' dvtm-dialGauge-background-' + amxNode.getAttribute('background');
      }
      else
      {
        return baseClass;
      }
    }
  }
 
  DialGaugeRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    DialGaugeRenderer.superclass.InitComponentOptions.call(this, amxNode, options);
    
    options['tickLabel'] = 
      {
        'rendered' : 'on',
        'scaling' : 'auto'
      };
  }
  
  DialGaugeRenderer.prototype.MergeComponentOptions = function (amxNode, options)
  {
    options = DialGaugeRenderer.superclass.MergeComponentOptions.call(this, amxNode, options);

    // if style template exists, load predefined backgrounds/indicators
    if (!dialGaugeStylesResolved)
    {
      dialGaugeStylesResolved = true;

      dialGaugeStyles['backgrounds'] = adf.mf.internal.dvt.gauge.DefaultDialGaugeStyle['backgrounds'];
      dialGaugeStyles['indicators'] = adf.mf.internal.dvt.gauge.DefaultDialGaugeStyle['indicators'];

      // if CustomDialGaugeStyle is defined, merge it with the default style
      if (window['CustomDialGaugeStyle'] != undefined)
      {
        var item, imgs, imgIndx, keys, i, length;
        if (window['CustomDialGaugeStyle']['backgrounds'] != undefined)
        {
          keys = Object.keys(window['CustomDialGaugeStyle']['backgrounds']);
          for (i = 0, length = keys.length; i < length; i++)
          {
            item = keys[i];
            dialGaugeStyles['backgrounds'][item] = window['CustomDialGaugeStyle']['backgrounds'][item];
            imgs = dialGaugeStyles['backgrounds'][item]["images"];
            for (imgIndx = 0;imgIndx < imgs.length;imgIndx++)
            {
              imgs[imgIndx]["src"] = adf.mf.api.amx.buildRelativePath(imgs[imgIndx]["source"]);
            }
          }
        }
        if (window['CustomDialGaugeStyle']['indicators'] != undefined)
        {
          keys = Object.keys(window['CustomDialGaugeStyle']['indicators']);
          for (i = 0, length = keys.length; i < length; i++)
          {
            item = keys[i];
            dialGaugeStyles['indicators'][item] = window['CustomDialGaugeStyle']['indicators'][item];
            imgs = dialGaugeStyles['indicators'][item]["images"];
            for (imgIndx = 0;imgIndx < imgs.length;imgIndx++)
            {
              imgs[imgIndx]["src"] = adf.mf.api.amx.buildRelativePath(imgs[imgIndx]["source"]);
            }
          }
        }
      }
    }
    return options;
  }

  DialGaugeRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = DialGaugeRenderer.superclass.GetAttributesDefinition.call(this);
    attrs['inputIncrement'] = {'path' : 'step', 'type' : AttributeProcessor['GAUGE_STEP']};
    return attrs;
  }
  
  DialGaugeRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {
    var changed = DialGaugeRenderer.superclass.ProcessAttributes.call(this, options, amxNode, context);
    
    var dialGaugeBackground = amxNode.getAttribute('background');
    var dialGaugeIndicator = amxNode.getAttribute('indicator');
   
    if (!dialGaugeBackground || dialGaugeStyles['backgrounds'][dialGaugeBackground] === undefined)
    {
      var b2iMap = adf.mf.internal.dvt.gauge.DEFAULT_DIAL_GAUGE_BACKGROUND_INDICATOR_MAPS['indicatorToBackground'];
      var defaultDialGaugeBackground = adf.mf.internal.dvt.gauge.DEFAULT_DIAL_GAUGE_PROPERTIES['background'];
      dialGaugeBackground = this._getValueByKeyWithDefault(b2iMap, dialGaugeIndicator, defaultDialGaugeBackground);
      changed = true;
    }
    
    if (!dialGaugeIndicator || dialGaugeStyles['indicators'][dialGaugeIndicator] === undefined)
    {
      var i2bMap = adf.mf.internal.dvt.gauge.DEFAULT_DIAL_GAUGE_BACKGROUND_INDICATOR_MAPS['backgroundToIndicator'];
      var defaultDialGaugeIndicator = adf.mf.internal.dvt.gauge.DEFAULT_DIAL_GAUGE_PROPERTIES['indicator'];
      dialGaugeIndicator = this._getValueByKeyWithDefault(i2bMap, dialGaugeBackground, defaultDialGaugeIndicator);
      changed = true;
    }
           
    options['background'] = dialGaugeStyles['backgrounds'][dialGaugeBackground];          
    options['indicator'] = dialGaugeStyles['indicators'][dialGaugeIndicator];  
    return changed;
  }
  
  DialGaugeRenderer.prototype.CreateToolkitComponentInstance = function(context, stageId, callbackObj, callback, amxNode)
  {
    var instance = DvtDialGauge.newInstance(context, callback, callbackObj);
    context.getStage().addChild(instance);
    return instance;
  } 
   
  DialGaugeRenderer.prototype.GetComponentWidtht = function (node, amxNode)
  {
    var width =  DialGaugeRenderer.superclass.GetComponentWidtht.call(this, node, amxNode);
    if(width <= 1)
    {
      width = DialGaugeRenderer.DEFAULT_WIDTH;
    }
    return width;
  }
  
  DialGaugeRenderer.prototype.GetComponentHeight = function (node, amxNode)
  {
    var height =  DialGaugeRenderer.superclass.GetComponentHeight.call(this, node, amxNode);
    if(height <= 1)
    {
      height = DialGaugeRenderer.DEFAULT_HEIGHT;
    }
    return height;
  }
  
    /**
   * @param map
   * @param key 
   * @param defaultValue - optional
   * 
   * @return value from map for given key, defaultValue when there is no value for key in map. 
   *    If not specified, defaultValue is 'undefined';
   */
  DialGaugeRenderer.prototype._getValueByKeyWithDefault = function(map, key, defaultValue)
  {
    var value = undefined;
    if(map && key)
    {
      value = map[key];
    }
    if (value === undefined)
    {
      value = defaultValue;
    }
    return value;
  }
        
  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'dialGauge', DialGaugeRenderer); 
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    gauge/GaugeDefaults.js
 */
(function() {  

  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.gauge');

  adf.mf.internal.dvt.gauge.DefaultGaugeStyle = {};

  adf.mf.internal.dvt.gauge.DefaultGaugeStyle.SKIN_ALTA =
  {
    // skin id
    'skin' : 'alta'
  };
  
  adf.mf.internal.dvt.gauge.DefaultGaugeStyle.VERSION_1 = 
  {
    // skin id
    'skin' : 'skyros',
    // default animation duration in milliseconds
    'animationDuration': 1000,
    // default animation effect on data change
    'animationOnDataChange': "none",
    // default animation effect on gauge display
    'animationOnDisplay': "none",
    // default visual effect
    'visualEffects': "auto"
  };
  
  adf.mf.internal.dvt.gauge.DEFAULT_DIAL_GAUGE_PROPERTIES = 
  {
    'background' : 'circleAntique',
    'indicator' : 'needleAntique'
  };
  
  adf.mf.internal.dvt.gauge.DEFAULT_DIAL_GAUGE_BACKGROUND_INDICATOR_MAPS = 
  {
    'indicatorToBackground':
    {
      'needleAntique' : 'circleAntique',
      'needleLight' : 'circleLight',
      'needleDark' : 'circleDark'
    },
    
    'backgroundToIndicator' : 
    {
      'rectangleAntique' : 'needleAntique',
      'rectangleAntiqueCustom' : 'needleAntique',
      'domeAntique' : 'needleAntique',
      'domeAntiqueCustom' : 'needleAntique',
      'circleAntique' : 'needleAntique',
      'circleAntiqueCustom' : 'needleAntique',
      
      'rectangleLight' : 'needleLight',
      'rectangleLightCustom' : 'needleLight',
      'domeLight' : 'needleLight',
      'domeLightCustom' : 'needleLight',
      'circleLight' : 'needleLight',
      'circleLightCustom' : 'needleLight',
      
      'rectangleDark' : 'needleDark',
      'rectangleDarkCustom' : 'needleDark',
      'domeDark' : 'needleDark',
      'domeDarkCustom' : 'needleDark',
      'circleDark' : 'needleDark',
      'circleDarkCustom' : 'needleDark'
    }
  };
    
  // location of dial gauge resources
  var _dialGaugePath = 'css/images/chart/gauge/';
  var translatePath = function (path)
  {
    return _dialGaugePath + path;
  }
  
  adf.mf.internal.dvt.gauge.DefaultDialGaugeStyle = 
  {
    'backgrounds' : 
    {
      "rectangleAntique" : 
      {
        "anchorX" : 100.5,
        "anchorY" : 95.8,
        "startAngle" : 207.6,
        "angleExtent" : 235,
        "indicatorLength" : 1.05,
        "images" : [
        {
          "src" : translatePath("antique/bg-rectangle-200x200-bidi.png"),
          "width" : 200,
          "height" : 168,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("antique/bg-rectangle-200x200.png"),
          "width" : 200,
          "height" : 168
        },
        {
          "src" : translatePath("antique/bg-rectangle-400x400-bidi.png"),
          "width" : 400,
          "height" : 335,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("antique/bg-rectangle-400x400.png"),
          "width" : 400,
          "height" : 335
        } ],
        "metricLabelBounds" :
        {
          "x" : 79,
          "y" : 125,
          "width" : 42,
          "height" : 40
        }
      },
      
      "rectangleAntiqueCustom" : 
      {
        "anchorX" : 100.5,
        "anchorY" : 95.8,
        "startAngle" : 207.6,
        "angleExtent" : 235,
        "indicatorLength" : 1.05,
        "radius": 65,
        "majorTickCount": 6,
        "images" : [
        {
          "src" : translatePath("antique/bg-rectangle-200x200-noLabels.png"),
          "width" : 200,
          "height" : 168,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("antique/bg-rectangle-200x200-noLabels.png"),
          "width" : 200,
          "height" : 168
        },
        {
          "src" : translatePath("antique/bg-rectangle-400x400-noLabels.png"),
          "width" : 400,
          "height" : 335,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("antique/bg-rectangle-400x400-noLabels.png"),
          "width" : 400,
          "height" : 335
        } ],
        "metricLabelBounds" :
        {
          "x" : 79,
          "y" : 125,
          "width" : 42,
          "height" : 40
        }
      },      
      
      "domeAntique" : 
      {
        "anchorX" : 99.3,
        "anchorY" : 95.8,
        "startAngle" : 195.5,
        "angleExtent" : 210.8,
        "indicatorLength" : 0.98,
        "images" : [
        {
          "src" : translatePath("antique/bg-dome-200x200-bidi.png"),
          "width" : 200,
          "height" : 176,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("antique/bg-dome-200x200.png"),
          "width" : 200,
          "height" : 176
        },
        {
          "src" : translatePath("antique/bg-dome-400x400-bidi.png"),
          "width" : 400,
          "height" : 352,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("antique/bg-dome-400x400.png"),
          "width" : 400,
          "height" : 352
        } ],
        "metricLabelBounds" :
        {
          "x" : 81,
          "y" : 135,
          "width" : 38,
          "height" : 35
        }
      },

      "domeAntiqueCustom" : 
      {
        "anchorX" : 99.3,
        "anchorY" : 95.8,
        "startAngle" : 195.5,
        "angleExtent" : 210.8,
        "indicatorLength" : 0.98,
        "radius": 65,
        "majorTickCount": 6,
        "images" : [
        {
          "src" : translatePath("antique/bg-dome-200x200-noLabels.png"),
          "width" : 200,
          "height" : 176,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("antique/bg-dome-200x200-noLabels.png"),
          "width" : 200,
          "height" : 176
        },
        {
          "src" : translatePath("antique/bg-dome-400x400-noLabels.png"),
          "width" : 400,
          "height" : 352,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("antique/bg-dome-400x400-noLabels.png"),
          "width" : 400,
          "height" : 352
        } ],
        "metricLabelBounds" :
        {
          "x" : 81,
          "y" : 135,
          "width" : 38,
          "height" : 35
        }
      },
      
      "circleAntique" : 
      {
        "anchorX" : 100,
        "anchorY" : 100,
        "startAngle" : 220.5,
        "angleExtent" : 261.1,
        "indicatorLength" : 0.85,
        "images" : [
        {
          "src" : translatePath("antique/bg-circle-200x200-bidi.png"),
          "width" : 200,
          "height" : 200,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("antique/bg-circle-200x200.png"),
          "width" : 200,
          "height" : 200
        },
        {
          "src" : translatePath("antique/bg-circle-400x400-bidi.png"),
          "width" : 400,
          "height" : 400,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("antique/bg-circle-400x400.png"),
          "width" : 400,
          "height" : 400
        } ],
        "metricLabelBounds" :
        {
          "x" : 77,
          "y" : 133,
          "width" : 46,
          "height" : 34
        }
      },
    
     "circleAntiqueCustom" : 
      {
        "anchorX" : 100,
        "anchorY" : 100,
        "startAngle" : 220.5,
        "angleExtent" : 261.1,
        "indicatorLength" : 0.85,
        "radius": 63,
        "majorTickCount": 6,
        "images" : [
        {
          "src" : translatePath("antique/bg-circle-200x200-noLabels.png"),
          "width" : 200,
          "height" : 200,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("antique/bg-circle-200x200-noLabels.png"),
          "width" : 200,
          "height" : 200
        },
        {
          "src" : translatePath("antique/bg-circle-400x400-noLabels.png"),
          "width" : 400,
          "height" : 400,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("antique/bg-circle-400x400-noLabels.png"),
          "width" : 400,
          "height" : 400
        } ],
        "metricLabelBounds" :
        {
          "x" : 77,
          "y" : 133,
          "width" : 46,
          "height" : 34
        }
      },

      "rectangleLight" : 
      {
        "anchorX" : 100,
        "anchorY" : 91.445,
        "startAngle" : 211,
        "angleExtent" : 242,
        "indicatorLength" : 1.1,
        "images" : [
        {
          "src" : translatePath("light/bg-rectangle-200x200-bidi.png"),
          "width" : 200,
          "height" : 154,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("light/bg-rectangle-200x200.png"),
          "width" : 200,
          "height" : 154
        },
        {
          "src" : translatePath("light/bg-rectangle-400x400-bidi.png"),
          "width" : 400,
          "height" : 307,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("light/bg-rectangle-400x400.png"),
          "width" : 400,
          "height" : 307
        } ],
        "metricLabelBounds" :
        {
          "x" : 78,
          "y" : 75,
          "width" : 44,
          "height" : 38
        }
      },
      
      "rectangleLightCustom" : 
      {
        "anchorX" : 100,
        "anchorY" : 91.445,
        "startAngle" : 211,
        "angleExtent" : 242,
        "indicatorLength" : 1.1,
        "radius": 60.5,
        "majorTickCount": 6,
        "images" : [
        {
          "src" : translatePath("light/bg-rectangle-200x200-noLabels.png"),
          "width" : 200,
          "height" : 154,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("light/bg-rectangle-200x200-noLabels.png"),
          "width" : 200,
          "height" : 154
        },
        {
          "src" : translatePath("light/bg-rectangle-400x400-noLabels.png"),
          "width" : 400,
          "height" : 307,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("light/bg-rectangle-400x400-noLabels.png"),
          "width" : 400,
          "height" : 307
        } ],
        "metricLabelBounds" :
        {
          "x" : 78,
          "y" : 75,
          "width" : 44,
          "height" : 38
        }
      },
      
      "domeLight" : 
      {
        "anchorX" : 100.2,
        "anchorY" : 89,
        "startAngle" : 201,
        "angleExtent" : 222,
        "indicatorLength" : 1.23,
        "images" : [
        {
          "src" : translatePath("light/bg-dome-200x200-bidi.png"),
          "width" : 200,
          "height" : 138,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("light/bg-dome-200x200.png"),
          "width" : 200,
          "height" : 138
        },
        {
          "src" : translatePath("light/bg-dome-400x400-bidi.png"),
          "width" : 400,
          "height" : 276,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("light/bg-dome-400x400.png"),
          "width" : 400,
          "height" : 276
        } ],
        "metricLabelBounds" :
        {
          "x" : 80,
          "y" : 70,
          "width" : 41,
          "height" : 39
        }
      },
      
      "domeLightCustom" : 
      {
        "anchorX" : 100.2,
        "anchorY" : 89,
        "startAngle" : 201,
        "angleExtent" : 222,
        "indicatorLength" : 1.23,
        "radius": 57,
        "majorTickCount": 6,
        "images" : [
        {
          "src" : translatePath("light/bg-dome-200x200-noLabels.png"),
          "width" : 200,
          "height" : 138,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("light/bg-dome-200x200-noLabels.png"),
          "width" : 200,
          "height" : 138
        },
        {
          "src" : translatePath("light/bg-dome-400x400-noLabels.png"),
          "width" : 400,
          "height" : 276,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("light/bg-dome-400x400-noLabels.png"),
          "width" : 400,
          "height" : 276
        } ],
        "metricLabelBounds" :
        {
          "x" : 80,
          "y" : 70,
          "width" : 41,
          "height" : 39
        }
      },

      "circleLight" : 
      {
        "anchorX" : 100,
        "anchorY" : 100,
        "startAngle" : 220.5,
        "angleExtent" : 261.1,
        "indicatorLength" : 0.82,
        "images" : [
        {
          "src" : translatePath("light/bg-circle-200x200-bidi.png"),
          "width" : 200,
          "height" : 200,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("light/bg-circle-200x200.png"),
          "width" : 200,
          "height" : 200
        },
        {
          "src" : translatePath("light/bg-circle-400x400-bidi.png"),
          "width" : 400,
          "height" : 400,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("light/bg-circle-400x400.png"),
          "width" : 400,
          "height" : 400
        } ],
        "metricLabelBounds" :
        {
          "x" : 76,
          "y" : 82,
          "width" : 48,
          "height" : 40
        }
      },

      "circleLightCustom" : 
      {
        "anchorX" : 100,
        "anchorY" : 100,
        "startAngle" : 220.5,
        "angleExtent" : 261.1,
        "indicatorLength" : 0.82,
        "radius": 60,
        "majorTickCount": 6,
        "images" : [
        {
          "src" : translatePath("light/bg-circle-200x200-noLabels.png"),
          "width" : 200,
          "height" : 200,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("light/bg-circle-200x200-noLabels.png"),
          "width" : 200,
          "height" : 200
        },
        {
          "src" : translatePath("light/bg-circle-400x400-noLabels.png"),
          "width" : 400,
          "height" : 400,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("light/bg-circle-400x400-noLabels.png"),
          "width" : 400,
          "height" : 400
        } ],
        "metricLabelBounds" :
        {
          "x" : 76,
          "y" : 82,
          "width" : 48,
          "height" : 40
        }
      },
      
      "circleDark" : 
      {
        "anchorX" : 100,
        "anchorY" : 100,
        "startAngle" : 220.5,
        "angleExtent" : 261.5,
        "indicatorLength" : 0.82,
        "images" : [
        {
          "src" : translatePath("dark/bg-circle-200x200-bidi.png"),
          "width" : 200,
          "height" : 200,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("dark/bg-circle-200x200.png"),
          "width" : 200,
          "height" : 200
        },
        {
          "src" : translatePath("dark/bg-circle-400x400-bidi.png"),
          "width" : 400,
          "height" : 400,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("dark/bg-circle-400x400.png"),
          "width" : 400,
          "height" : 400
        } ],
        "metricLabelBounds" :
        {
          "x" : 76,
          "y" : 82,
          "width" : 48,
          "height" : 40
        }
      },
  
      "circleDarkCustom" : 
      {
        "anchorX" : 100,
        "anchorY" : 100,
        "startAngle" : 220.5,
        "angleExtent" : 261.5,
        "indicatorLength" : 0.82,
        "radius": 63,
        "majorTickCount": 6,
        "images" : [
        {
          "src" : translatePath("dark/bg-circle-200x200-noLabels.png"),
          "width" : 200,
          "height" : 200,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("dark/bg-circle-200x200-noLabels.png"),
          "width" : 200,
          "height" : 200
        },
        {
          "src" : translatePath("dark/bg-circle-400x400-noLabels.png"),
          "width" : 400,
          "height" : 400,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("dark/bg-circle-400x400-noLabels.png"),
          "width" : 400,
          "height" : 400
        } ],
        "metricLabelBounds" :
        {
          "x" : 76,
          "y" : 82,
          "width" : 48,
          "height" : 40
        }
      },

      "rectangleDark" : 
      {
        "anchorX" : 100.2,
        "anchorY" : 99.5,
        "startAngle" : 201,
        "angleExtent" : 222,
        "indicatorLength" : 1.1,
        "images" : [
        {
          "src" : translatePath("dark/bg-rectangle-200x200-bidi.png"),
          "width" : 200,
          "height" : 154,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("dark/bg-rectangle-200x200.png"),
          "width" : 200,
          "height" : 154
        },
        {
          "src" : translatePath("dark/bg-rectangle-400x400-bidi.png"),
          "width" : 400,
          "height" : 307,
          "rtl" : "rtl"
        },
        {
          "src" : translatePath("dark/bg-rectangle-400x400.png"),
          "width" : 400,
          "height" : 307
        } ],
        "metricLabelBounds" :
        {
          "x" : 80,
          "y" : 83,
          "width" : 41,
          "height" : 36
        }
      },
      
      "rectangleDarkCustom" : 
      {
        "anchorX" : 100.2,
        "anchorY" : 99.5,
        "startAngle" : 201,
        "angleExtent" : 222,
        "indicatorLength" : 1.1,
        "radius": 65,
        "majorTickCount": 6,
        "images" : [
        {
          "src" : translatePath("dark/bg-rectangle-200x200-noLabels.png"),
          "width" : 200,
          "height" : 154,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("dark/bg-rectangle-200x200-noLabels.png"),
          "width" : 200,
          "height" : 154
        },
        {
          "src" : translatePath("dark/bg-rectangle-400x400-noLabels.png"),
          "width" : 400,
          "height" : 307,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("dark/bg-rectangle-400x400-noLabels.png"),
          "width" : 400,
          "height" : 307
        } ],
        "metricLabelBounds" :
        {
          "x" : 80,
          "y" : 83,
          "width" : 41,
          "height" : 36
        }
      },

      "domeDark" : 
      {
        "anchorX" : 100.2,
        "anchorY" : 89,
        "startAngle" : 201,
        "angleExtent" : 222,
        "indicatorLength" : 1.23,
        "images" : [
        {
          "src" : translatePath("dark/bg-dome-200x200-bidi.png"),
          "width" : 200,
          "height" : 138,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("dark/bg-dome-200x200.png"),
          "width" : 200,
          "height" : 138
        },
        {
          "src" : translatePath("dark/bg-dome-400x400-bidi.png"),
          "width" : 400,
          "height" : 276,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("dark/bg-dome-400x400.png"),
          "width" : 400,
          "height" : 276
        } ],
        "metricLabelBounds" :
        {
          "x" : 80,
          "y" : 73,
          "width" : 41,
          "height" : 36
        }
      },
      
      "domeDarkCustom" : 
      {
        "anchorX" : 100.2,
        "anchorY" : 89,
        "startAngle" : 201,
        "angleExtent" : 222,
        "indicatorLength" : 1.23,
        "radius": 57,
        "majorTickCount": 6,
        "images" : [
        {
          "src" : translatePath("dark/bg-dome-200x200-noLabels.png"),
          "width" : 200,
          "height" : 138,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("dark/bg-dome-200x200-noLabels.png"),
          "width" : 200,
          "height" : 138
        },
        {
          "src" : translatePath("dark/bg-dome-400x400-noLabels.png"),
          "width" : 400,
          "height" : 276,
          "dir" : "rtl"
        },
        {
          "src" : translatePath("dark/bg-dome-400x400-noLabels.png"),
          "width" : 400,
          "height" : 276
        } ],
        "metricLabelBounds" :
        {
          "x" : 80,
          "y" : 73,
          "width" : 41,
          "height" : 36
        }
      }
    },

    'indicators' : 
    {
      "needleAntique" : 
      {
        "anchorX" : 42,
        "anchorY" : 510,
        "images" : [
        {
          "src" : translatePath("antique/needle-1600x1600.png"),
          "width" : 81,
          "height" : 734
        } ]
      },

      "needleLight" : 
      {
        "anchorX" : 227,
        "anchorY" : 425,
        "images" : [
        {
          "src" : translatePath("light/needle-1600x1600.png"),
          "width" : 454,
          "height" : 652
        } ]
      },

      "needleDark" : {
        "anchorX" : 227,
        "anchorY" : 425,
        "images" : [
        {
          "src" : translatePath("dark/needle-1600x1600.png"),
          "width" : 454,
          "height" : 652
        } ]
      }
    }
  }


})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    gauge/LedGaugeRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
   
  var LedGaugeRenderer = function ()
  { }
  
  LedGaugeRenderer.DEFAULT_HEIGHT = 80;  
  LedGaugeRenderer.DEFAULT_WIDTH = 100;

  adf.mf.internal.dvt.DvtmObject.createSubclass(LedGaugeRenderer, 'adf.mf.internal.dvt.gauge.BaseGaugeRenderer', 'adf.mf.internal.dvt.gauge.LedGaugeRenderer');
    
  LedGaugeRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = LedGaugeRenderer.superclass.GetAttributesDefinition.call(this);
    
    attrs['labelDisplay'] = {'path' : 'metricLabel/rendered', 'type' : AttributeProcessor['TEXT'], 'default' : 'on'};
    attrs['size'] = {'path' : 'size', 'type' : AttributeProcessor['PERCENTAGE']};
    attrs['title'] = {'path' : 'title/text', 'type' : AttributeProcessor['TEXT']};
    attrs['titleStyle'] = {'path' : 'title/style', 'type' : AttributeProcessor['TEXT']};
    
    return attrs;
  }
  
  LedGaugeRenderer.prototype.CreateComponentCallback = function(amxNode)
  {
    return null;
  }
  
  LedGaugeRenderer.prototype.CreateToolkitComponentInstance = function(context, stageId, callbackObj, callback, amxNode)
  {
    var instance = DvtLedGauge.newInstance(context, callback, callbackObj);
    context.getStage().addChild(instance);
    return instance;
  }
  
  LedGaugeRenderer.prototype.GetComponentWidth = function (node, amxNode)
  {
    var width = LedGaugeRenderer.superclass.GetComponentWidth.call(this, node, amxNode);
    if(width <= 1)
    {
      width = LedGaugeRenderer.DEFAULT_WIDTH;
    }
    return width;
  }
  
  LedGaugeRenderer.prototype.GetComponentHeight = function (node, amxNode)
  {
    var height =  LedGaugeRenderer.superclass.GetComponentHeight.call(this, node, amxNode);
    if(height <= 1)
    {
      height = LedGaugeRenderer.DEFAULT_HEIGHT;
    }
    return height;
  }
  
  LedGaugeRenderer.prototype.ProcessStyleClasses = function (node, amxNode)
  {
    LedGaugeRenderer.superclass.ProcessStyleClasses.call(this, node, amxNode);
    
    // make sure metricLabel/labelStyle overrides the default skin settings
    var options = this.GetDataObject(amxNode);
    var children = amxNode.getChildren();
    for (var i = 0; i < children.length; i++) 
    {
      if (children[i].getTag().getName() === 'metricLabel') {
        if (children[i].isAttributeDefined('labelStyle'))
        {
          options['metricLabel']['style'] = children[i].getAttribute('labelStyle');
        }
        break;
      }
    }
  }
  
  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'ledGauge', LedGaugeRenderer); 
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    gauge/RatingGaugeRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
  
  var RatingGaugeRenderer = function ()
  { }
  
  RatingGaugeRenderer.DEFAULT_HEIGHT = 30;  
  RatingGaugeRenderer.MAX_HEIGHT = 50;  
  RatingGaugeRenderer.DEFAULT_WIDTH = 160;

  adf.mf.internal.dvt.DvtmObject.createSubclass(RatingGaugeRenderer, 'adf.mf.internal.dvt.gauge.BaseGaugeRenderer', 'adf.mf.internal.dvt.gauge.RatingGaugeRenderer');

  RatingGaugeRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    RatingGaugeRenderer.superclass.InitComponentOptions.call(this, amxNode, options);
    
    options['selectedState'] = {};
    options['unselectedState'] = {};
    options['hoverState'] = {};
    options['changedState'] = {};
  }
  
  RatingGaugeRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = RatingGaugeRenderer.superclass.GetAttributesDefinition.call(this);
    
    attrs['value'] = {'path' : 'value', 'type' : AttributeProcessor['FLOAT'], 'dtvalue' : 3, 'default' : 3};
    attrs['minValue'] = {'path' : 'min', 'type' : AttributeProcessor['FLOAT'], 'dtvalue' : 0, 'default' : 0};
    attrs['maxValue'] = {'path' : 'max', 'type' : AttributeProcessor['FLOAT'], 'dtvalue' : 5, 'default' : 5};
    attrs['labelDisplay'] = {'path' : 'metricLabel/rendered', 'type' : AttributeProcessor['TEXT'], 'default' : 'on'};
    attrs['inputIncrement'] = {'path' : 'step', 'type' : AttributeProcessor['RATING_STEP']};
    attrs['readOnly'] = {'path' : 'readOnly', 'type' : AttributeProcessor['BOOLEAN'], 'default' : false};
    attrs['changed'] = {'path' : 'changed', 'type' : AttributeProcessor['BOOLEAN'], 'default' : false};
    attrs['orientation'] = {'path' : 'orientation', 'type' : AttributeProcessor['TEXT']};
    attrs['selectedColor'] = {'path' : 'selectedState/color', 'type' : AttributeProcessor['TEXT']};
    attrs['selectedBorderColor'] = {'path' : 'selectedState/borderColor', 'type' : AttributeProcessor['TEXT']};
    attrs['unselectedColor'] = {'path' : 'unselectedState/color', 'type' : AttributeProcessor['TEXT']};
    attrs['unselectedBorderColor'] = {'path' : 'unselectedState/borderColor', 'type' : AttributeProcessor['TEXT']};
    attrs['changedColor'] = {'path' : 'changedState/color', 'type' : AttributeProcessor['TEXT']};
    attrs['changedBorderColor'] = {'path' : 'changedState/borderColor', 'type' : AttributeProcessor['TEXT']};
    attrs['hoverColor'] = {'path' : 'hoverState/color', 'type' : AttributeProcessor['TEXT']};
    attrs['hoverBorderColor'] = {'path' : 'hoverState/borderColor', 'type' : AttributeProcessor['TEXT']};
    
    return attrs;
  }
  
  RatingGaugeRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = RatingGaugeRenderer.superclass.GetStyleClassesDefinition.call(this);
  
    styleClasses['dvtm-ratingGaugeSelected'] = [
      {'path' : 'selectedState/color', 'type' : StyleProcessor['COLOR'], 'overwrite' : false},
      {'path' : 'selectedState/borderColor', 'type' : StyleProcessor['BORDER_COLOR_TOP'], 'overwrite' : false}
    ];
    styleClasses['dvtm-ratingGaugeUnselected'] = [
      {'path' : 'unselectedState/color', 'type' : StyleProcessor['COLOR'], 'overwrite' : false}, 
      {'path' : 'unselectedState/borderColor', 'type' : StyleProcessor['BORDER_COLOR_TOP'], 'overwrite' : false}
    ];
    styleClasses['dvtm-ratingGaugeHover'] = [
      {'path' : 'hoverState/color', 'type' : StyleProcessor['COLOR'], 'overwrite' : false}, 
      {'path' : 'hoverState/borderColor', 'type' : StyleProcessor['BORDER_COLOR_TOP'], 'overwrite' : false}];
    styleClasses['dvtm-ratingGaugeChanged'] = [
      {'path' : 'changedState/color', 'type' : StyleProcessor['COLOR'], 'overwrite' : false}, 
      {'path' : 'changedState/borderColor', 'type' : StyleProcessor['BORDER_COLOR_TOP'], 'overwrite' : false}
    ];
    return styleClasses; 
  }  
          
  RatingGaugeRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {
    RatingGaugeRenderer.superclass.ProcessAttributes.call(this, options, amxNode, context);
    
    var DEFAULT_SHAPE = 'star';  
    var shape = DEFAULT_SHAPE;
    var unselectedShape;
    var changedShape;
    
    if (amxNode.isAttributeDefined('shape')) 
    {
      shape = amxNode.getAttribute('shape');
    }
    options['selectedState']['shape'] = shape;
    // make the 'changed' and 'hover' states follow the selected shape
    options['hoverState']['shape'] = shape;
    options['changedState']['shape'] = shape;
  
    if (amxNode.isAttributeDefined('unselectedShape'))
    {
      unselectedShape = amxNode.getAttribute('unselectedShape');
      // if 'auto', follow the selected shape
      if (unselectedShape === 'auto')
        options['unselectedState']['shape'] = shape;
      else
        options['unselectedState']['shape'] = unselectedShape;
    }
    else 
    {
      options['unselectedState']['shape'] = shape;
    }

    if (amxNode.isAttributeDefined('changedShape'))
    {
      changedShape = amxNode.getAttribute('changedShape');
      // if 'auto', follow the selected shape
      if (changedShape === 'auto')
        options['changedState']['shape'] = shape;
      else
        options['changedState']['shape'] = changedShape;
    }
    else 
    {
      options['changedState']['shape'] = shape;
    }
    
    return true;
  }

  RatingGaugeRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      this._renderers = 
        {
          'threshold' : { 'renderer' : new adf.mf.internal.dvt.gauge.ThresholdRenderer() }
        };
    }
    return this._renderers;
  }
  
  RatingGaugeRenderer.prototype.CreateToolkitComponentInstance = function(context, stageId, callbackObj, callback, amxNode)
  {   
    var instance = DvtRatingGauge.newInstance(context, callback, callbackObj);
    context.getStage().addChild(instance);
    return instance;
  }
  
  RatingGaugeRenderer.prototype.GetComponentWidtht = function (node, amxNode)
  {
    var width = RatingGaugeRenderer.superclass.GetComponentWidtht.call(this, node, amxNode);
    if(width <= 1)
    {
      width = RatingGaugeRenderer.DEFAULT_WIDTH;
    }
    return width;
  }
  
  RatingGaugeRenderer.prototype.GetComponentHeight = function (node, amxNode)
  {
    var height = RatingGaugeRenderer.superclass.GetComponentHeight.call(this, node, amxNode);
    if(height <= 1)
    {
      height = RatingGaugeRenderer.DEFAULT_HEIGHT;
    }
    else if(height > RatingGaugeRenderer.MAX_HEIGHT)
    {
      if (amxNode.getAttribute("orientation") == "horizontal")
        height = RatingGaugeRenderer.MAX_HEIGHT;
    }
    
    return height;
  }
  
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'ratingGauge', RatingGaugeRenderer);
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    gauge/StatusMeterGaugeRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
  
  var StatusMeterGaugeRenderer = function ()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(StatusMeterGaugeRenderer, 'adf.mf.internal.dvt.gauge.BaseGaugeRenderer', 'adf.mf.internal.dvt.gauge.StatusMeterGaugeRenderer');

  StatusMeterGaugeRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    StatusMeterGaugeRenderer.superclass.InitComponentOptions.call(this, amxNode, options);
    
    options['indicatorSize'] = 1;
    options['thresholdDisplay'] = 'onIndicator';
    options['plotArea'] = 
      {
        'rendered' : 'auto'
      }; 
  }
  
  StatusMeterGaugeRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = StatusMeterGaugeRenderer.superclass.GetAttributesDefinition.call(this);
    
    attrs['angleExtent'] = {'path' : 'angleExtent', 'type' : AttributeProcessor['INTEGER']};
    attrs['borderRadius'] = {'path' : 'borderRadius', 'type' : AttributeProcessor['TEXT']};
    attrs['indicatorSize'] = {'path' : 'indicatorSize', 'type' : AttributeProcessor['PERCENTAGE2']};
    attrs['inputIncrement'] = {'path' : 'step', 'type' : AttributeProcessor['GAUGE_STEP']};
    attrs['innerRadius'] = {'path' : 'innerRadius', 'type' : AttributeProcessor['PERCENTAGE']};
    attrs['orientation'] = {'path' : 'orientation', 'type' : AttributeProcessor['TEXT'], 'default' : 'horizontal'};    
    attrs['plotArea'] = {'path' : 'plotArea/rendered', 'type' : AttributeProcessor['TEXT']};
    attrs['plotAreaColor'] = {'path' : 'plotArea/color', 'type' : AttributeProcessor['TEXT']};
    attrs['plotAreaBorderColor'] = {'path' : 'plotArea/borderColor', 'type' : AttributeProcessor['TEXT']};
    attrs['plotAreaBorderRadius'] = {'path' : 'plotArea/borderRadius', 'type' : AttributeProcessor['TEXT']};
    attrs['startAngle'] = {'path' : 'startAngle', 'type' : AttributeProcessor['INTEGER']};
    attrs['title'] = {'path' : 'title/text', 'type' : AttributeProcessor['TEXT']};
    attrs['titlePosition'] = {'path' : 'title/position', 'type' : AttributeProcessor['TEXT']};
    attrs['titleStyle'] = {'path' : 'title/style', 'type' : AttributeProcessor['TEXT']};

    attrs['thresholdDisplay'] = {'path' : 'thresholdDisplay', 'type' : AttributeProcessor['TEXT']};
    
    return attrs;
  }
  
  StatusMeterGaugeRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = StatusMeterGaugeRenderer.superclass.GetStyleClassesDefinition.call(this);
    
    styleClasses['dvtm-gaugeMetricLabel'] = {'path' : 'metricLabel/style', 'type' : StyleProcessor['CSS_TEXT']};    
    styleClasses['dvtm-gaugePlotArea'] = [
      {'path' : 'plotArea/borderColor', 'type' : StyleProcessor['BORDER_COLOR'], 'overwrite' : false},
      {'path' : 'plotArea/borderRadius', 'type' : StyleProcessor['BORDER_RADIUS'], 'overwrite' : false},
      {'path' : 'plotArea/color', 'type' : StyleProcessor['BACKGROUND'], 'overwrite' : false}
    ];
        
    return styleClasses; 
  }  
  
  StatusMeterGaugeRenderer.prototype.CreateToolkitComponentInstance = function(context, stageId, callbackObj, callback, amxNode)
  {
    var instance = DvtStatusMeterGauge.newInstance(context, callback, callbackObj);
    context.getStage().addChild(instance);
    return instance;
  }  
  
  StatusMeterGaugeRenderer.prototype.GetComponentHeight = function (node, amxNode)
  {
    var height =  StatusMeterGaugeRenderer.superclass.GetComponentHeight.call(this, node, amxNode);
    if(height <= 1)
    {
      height = 40;
    }
    return height;
  }
   
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'statusMeterGauge', StatusMeterGaugeRenderer); 
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    gauge/ThresholdRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;   
  
  var ThresholdRenderer = function()
  { }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(ThresholdRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.gauge.ThresholdRenderer');
  
  /**
   * parses the threshold node attributes
   *
   * threshold has the following attributes
   *
   *   borderColor - String(Color): support CSS color values
   *   color       - String(Color): support CSS color values
   *   text        - String: the threshold text
   *   value       - Number: the breakpoint of the range
   *
   */
  ThresholdRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = ThresholdRenderer.superclass.GetAttributesDefinition.call(this);
    
    attrs['borderColor'] = {'path' : 'borderColor', 'type' : AttributeProcessor['TEXT']};
    attrs['color'] = {'path' : 'color', 'type' : AttributeProcessor['TEXT']};
    attrs['text'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
    attrs['maxValue'] = {'path' : 'max', 'type' : AttributeProcessor['FLOAT']};
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};
   
    return attrs;
  }
  
  ThresholdRenderer.prototype.ProcessAttributes = function (options, thresholdNode, context)
  {
    var threshold = {};

    var changed = ThresholdRenderer.superclass.ProcessAttributes.call(this, threshold, thresholdNode, context);

    options['thresholds'] = options['thresholds'] ? options['thresholds'] : [];
    options['thresholds'].push(threshold);
    
    return changed;
  }  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    geoMap/GeographicMapRenderer.js
 */
(function ()
{
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var DOMUtils = adf.mf.internal.dvt.DOMUtils;

  var GeographicMapRenderer = function ()
  {
    this._configuration = null;
    this._googleApiLoaded = null;
    this._oracleMVApiLoaded = null;

    this._waitingNodes = [];
  };

  adf.mf.internal.dvt.DvtmObject.createSubclass(GeographicMapRenderer, 'adf.mf.internal.dvt.BaseComponentRenderer', 'adf.mf.internal.dvt.geomap.GeographicMapRenderer');

  GeographicMapRenderer.prototype.createChildrenNodes = function (amxNode)
  {
    if (this._configuration === null)
    {
      this._waitingNodes.push(amxNode);
      amxNode.setAttributeResolvedValue("_configuration", "waiting");

      this._loadConfiguration(
        function (config)
        {
          var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
          var renderer = this;

          this._waitingNodes.forEach(function (node)
          {
            renderer._mapConfigurationToAmxNode(node, config);

            args.setAffectedAttribute(node, "_configuration");
          });

          this._waitingNodes.length = 0;
          adf.mf.api.amx.markNodeForUpdate(args);
        },
        function ()
        {
          // error
          var args = new adf.mf.api.amx.AmxNodeUpdateArguments();

          this._waitingNodes.forEach(function (node)
          {
            node.setAttributeResolvedValue("_configuration", "failure");
            args.setAffectedAttribute(node, "_configuration");
          });

          this._waitingNodes.length = 0;
          adf.mf.api.amx.markNodeForUpdate(args);
        });

      return adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["HANDLED"];
    }

    this._mapConfigurationToAmxNode(amxNode, this._configuration);

    if (this._configuration["networkStatus"] !== "NotReachable")
    {
      switch (this._configuration["mapProvider"])
      {
        case "oraclemaps":
          if (this._oracleMVApiLoaded === true)
          {
            amxNode.setAttributeResolvedValue("_apiLoaded", "success");

            return false;
          }
          else
          {
            this._loadApi(amxNode, this._loadOracleMVApi);
            return adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["HANDLED"];
          }
          break;
        case "googlemaps":
        default :
          if (this._googleApiLoaded === true)
          {
            amxNode.setAttributeResolvedValue("_apiLoaded", "success");

            return false;
          }
          else
          {
            this._loadApi(amxNode, this._loadGoogleApi);
            return adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["HANDLED"];
          }
      }
    }
    else
    {
      amxNode.setAttributeResolvedValue("_apiLoaded", "failure");

      return adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["HANDLED"];
    }

    // let the framework create children
    return adf.mf.api.amx.AmxNodeCreateChildrenNodesResult["NONE"];
  };

  GeographicMapRenderer.prototype._mapConfigurationToAmxNode = function(amxNode, config)
  {
    amxNode.setAttributeResolvedValue("_configuration", "success");

    amxNode.setAttributeResolvedValue("_networkAvailable", config["networkStatus"] !== "NotReachable");
    amxNode.setAttributeResolvedValue("_mapProvider", config["mapProvider"]);
    amxNode.setAttributeResolvedValue("_mapViewerUrl", config["mapViewerUrl"]);
    amxNode.setAttributeResolvedValue("_eLocationUrl", config["eLocationUrl"]);
    amxNode.setAttributeResolvedValue("_baseMap", config["baseMap"]);
    amxNode.setAttributeResolvedValue("_geoMapClientId", config["geoMapClientId"]);
    amxNode.setAttributeResolvedValue("_geoMapKey", config["geoMapKey"]);
    amxNode.setAttributeResolvedValue("_accessibilityEnabled", config["accessibilityEnabled"] ? true : false)
  };

  var _createApiLoadCallback = function(state)
  {
    return function ()
    {
      var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
      this._waitingNodes.forEach(function (node)
      {
        node.setAttributeResolvedValue("_apiLoaded", state);
        args.setAffectedAttribute(node, "_apiLoaded");
      });
      //
      this._waitingNodes.length = 0;
      //
      adf.mf.api.amx.markNodeForUpdate(args);
    };
  };

  GeographicMapRenderer.prototype._loadApi = function(amxNode, fn)
  {
    amxNode.setAttributeResolvedValue("_apiLoaded", "waiting");
    this._waitingNodes.push(amxNode);

    fn.call(this, _createApiLoadCallback("success"), _createApiLoadCallback("failure"));
  };

  GeographicMapRenderer.prototype.updateChildren = function (amxNode, attributeChanges)
  {
    if (attributeChanges.hasChanged("_configuration")
      && amxNode.getAttribute("_configuration") === "success")
    {
      return adf.mf.api.amx.AmxNodeChangeResult['REPLACE'];
    }

    if (attributeChanges.hasChanged("_configuration")
      && amxNode.getAttribute("_configuration") === "reload")
    {
      this._configuration = null;
      return adf.mf.api.amx.AmxNodeChangeResult['REPLACE'];
    }

    if (attributeChanges.hasChanged("_apiLoaded")
      && amxNode.getAttribute("_apiLoaded") === "success")
    {
      return adf.mf.api.amx.AmxNodeChangeResult['REPLACE'];
    }

    return adf.mf.api.amx.AmxNodeChangeResult['REFRESH'];
  };

  GeographicMapRenderer.prototype._loadConfiguration = function (success, error)
  {
    if (this._isLoading === true)
    {
      return;
    }

    this._isLoading = true;

    var map =
    {
      "#{deviceScope.hardware.networkStatus}" : "networkStatus", // NotReachable
      "#{applicationScope.configuration.mapProvider}" : "mapProvider", //toLowerCase
      "#{applicationScope.configuration.geoMapKey}" : "geoMapKey",
      "#{applicationScope.configuration.geoMapClientId}" : "geoMapClientId",
      "#{applicationScope.configuration.mapViewerUrl}" : "mapViewerUrl",
      "#{applicationScope.configuration.eLocationUrl}" : "eLocationUrl",
      "#{applicationScope.configuration.baseMap}" : "baseMap",
      "#{applicationScope.configuration.accessibilityEnabled}" : "accessibilityEnabled"
    };

    var renderer = this;
    var els = Object.keys(map);

    this._configuration = null;

    if (adf.mf.internal.isJavaAvailable())
    {
      var scb = function (request, response)
      {
        var _configuration = {};
        var _dataChangeListener = function(result)
        {
          var expression = result.getExpression();
          var dcvalue = adf.mf.el.getLocalValue(expression);
          if (dcvalue && dcvalue[".null"] === true)
          {
            dcvalue = null;
          }
          // set new configuration value and continue without notification
          // of the nodes currently rendered
          if (renderer._configuration)
          {
            var name = map[expression];
            if (name === "mapProvider" && dcvalue)
            {
              dcvalue = dcvalue.toLowerCase();
            }
            renderer._configuration[name] = dcvalue;
          }
        };

        response.forEach(function (item)
        {
          var name = map[item.name];
          var value = item.value;
          if (value && value[".null"] === true)
          {
            value = null;
          }

          if (name === "mapProvider" && value)
          {
            value = value.toLowerCase();
          }

          _configuration[name] = value;
          // register listener to listen for configuration changes
          adf.mf.api.addDataChangeListeners(item.name, _dataChangeListener);
        });

        renderer._configuration = _configuration;
        renderer._isLoading = false;

        success.call(renderer, _configuration);
      };

      var ecb = function (request, response)
      {
        renderer._configuration = null;
        error.call(renderer);
        renderer._isLoading = false;
      };

      // ask backend for the fresh configuration
      adf.mf.el.getValue(els, scb, ecb);
    }
    else
    {
      this._configuration = {};
      // try to get configuration from local cache
      els.forEach(function (expression)
      {
        var name = map[expression];
        var value = adf.mf.el.getLocalValue(expression);
        if (value && value[".null"] === true)
        {
          value = null;
        }

        if (name === "mapProvider" && value)
        {
          value = value.toLowerCase();
        }
        renderer._configuration[name] = value;
      });

      this._isLoading = false;
      success.call(this, this._configuration);
    }
  };

  GeographicMapRenderer.prototype._loadGoogleApi = function (success, error)
  {
    if (this._googleApiLoaded === true || this._gapiLoading === true)
    {
      return;
    }

    this._gapiLoading = true;

    var renderer = this;

    GeographicMapRenderer._gapiLoadedCallback = function ()
    {
      renderer._googleApiLoaded = true;
      renderer._gapiLoading = false;
      GeographicMapRenderer._gapiLoadedCallback = null;
      success.call(renderer);
    };

    var errorCallback = function()
    {
      renderer._googleApiLoaded = false;
      renderer._gapiLoading = false;
      GeographicMapRenderer._gapiLoadedCallback = null;
      error.call(renderer);
    };

    var mapApiBaseUrl = "https://maps.googleapis.com/maps/api/js?v=3&sensor=false&callback=adf.mf.internal.dvt.geomap.GeographicMapRenderer._gapiLoadedCallback";
    var url;
    if (this._configuration["geoMapKey"])
    {
      url = mapApiBaseUrl + "&key=" + this._configuration["geoMapKey"];
    }
    else if (this._configuration["geoMapClientId"])
    {
      url = mapApiBaseUrl + "&client=" + this._configuration["geoMapClientId"];
    }
    else
    {
      url = mapApiBaseUrl;
    }
    // set 30s timeout for the google api callback failure
    window.setTimeout(function()
    {
      if (GeographicMapRenderer._gapiLoadedCallback !== null)
      {
        errorCallback();
      }
    }, 30 * 1000);
    // start loading API
    adf.mf.api.resourceFile.loadJsFile(url, true, function ()
    {
      // google provides only async loader so we have nothing to do here
    },
    errorCallback);
  };

  GeographicMapRenderer.prototype._loadOracleMVApi = function (success, error)
  {
    if (this._oracleMVApiLoaded === true || this._omvapiLoading === true)
    {
      return;
    }

    this._omvapiLoading = true;

    var renderer = this;

    var mapViewerUrl = this._configuration["mapViewerUrl"];
    if (mapViewerUrl == null)
    {
      mapViewerUrl = DvtGeographicMap.MAP_VIEWER_URL;
    }

    var url = mapViewerUrl + "/fsmc/jslib/oraclemaps.js";

    var errorCallback = function()
    {
      renderer._oracleMVApiLoaded = false;
      renderer._omvapiLoading = false;
      error.call(renderer);
    };
    // 30 seconds timeout for the file evaluation
    var counter = 30 * 1000 / 100;
    // we have to set timeout to find out when the MV api is fully loaded
    var timer = setInterval(function()
    {
      // verify existence of the MVMapView.version property
      if (window.MVMapView !== undefined && MVMapView.version)
      {
        clearInterval(timer);
        renderer._oracleMVApiLoaded = true;
        renderer._omvapiLoading = false;
        success.call(renderer);
      }
      else if (counter === 0)
      {
        clearInterval(timer);
        errorCallback();
      }

      counter--;
    }, 100);
    // start loading API
    adf.mf.api.resourceFile.loadJsFile(url, true, function ()
    {
    }, errorCallback);
  };

  // create the DVT API namespace
  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.api.dvt');

  /*
   * GeoMap event objects
   */

  /**
   * An event for map view property changes in DvtGeographicMap.
   * The event object is passed to the handler specified
   * in the mapBoundsChangeListener attribute.
   * See also the Java API oracle.adfmf.amx.event.MapBoundsChangeEvent.
   * @param {Object} minX minimum x coordinate (longitude) of map view
   * @param {Object} minY minimum y coordinate (latitude) of map view
   * @param {Object} maxX maximum x coordinate (longitude) of map view
   * @param {Object} maxY maximum y coordinate (latitude) of map view
   * @param {Object} centerX x coordinate (longitude) of map center
   * @param {Object} centerY y coordinate (latitude) of map center
   * @param {Number} zoomLevel current zoom level
   */
  adf.mf.api.dvt.MapBoundsChangeEvent = function (minX, minY, maxX, maxY, centerX, centerY, zoomLevel)
  {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    this.centerX = centerX;
    this.centerY = centerY;
    this.zoomLevel = zoomLevel;
    this[".type"] = "oracle.adfmf.amx.event.MapBoundsChangeEvent";
  };

  /**
   * An event fired when a click/tap, mousedown/up event occurs in DvtGeographicMap.
   * The event object is passed to the handler specified in the mapInputListener attribute.
   * Event properties include x/y coordinates (longitude/latitude) of the location where
   * the click/tap occurred and the event type id -- 'click', 'mousedown', 'mouseup'.
   * See also the Java API oracle.adfmf.amx.event.MapInputEvent.
   * @param {String} type event type id
   * @param {Object} pointX x coordinate (longitude) of the click point
   * @param {Object} pointY y coordinate (latitude) of the click point
   */
  adf.mf.api.dvt.MapInputEvent = function (type, pointX, pointY)
  {
    this.type = type;
    this.pointX = pointX;
    this.pointY = pointY;
    this[".type"] = "oracle.adfmf.amx.event.MapInputEvent";
  };

  GeographicMapRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = GeographicMapRenderer.superclass.GetStyleClassesDefinition.call(this);

    styleClasses['_self'] =
    {
      'path' : 'background-color', 'type' : adf.mf.internal.dvt.StyleProcessor['BACKGROUND']
    };

    return styleClasses;
  };

  GeographicMapRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    GeographicMapRenderer.superclass.InitComponentOptions.call(this, amxNode, options)

    options['mapOptions'] = {};

    amxNode["_dataObj"] =
    {
      'dataLayers' : [],
      'routes' : [],
      'mapOptions' : {}
    };
  };

  GeographicMapRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = GeographicMapRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['mapType'] = {'path' : 'mapOptions/mapType', 'type' : AttributeProcessor['TEXT']};
    attrs['centerX'] = {'path' : 'mapOptions/centerX', 'type' : AttributeProcessor['TEXT']};
    attrs['centerY'] = {'path' : 'mapOptions/centerY', 'type' : AttributeProcessor['TEXT']};
    attrs['zoomLevel'] = {'path' : 'mapOptions/zoomLevel', 'type' : AttributeProcessor['TEXT']};
    attrs['initialZooming'] = {'path' : 'mapOptions/initialZooming', 'type' : AttributeProcessor['TEXT'], 'default' : 'auto'};
    attrs['animationOnDisplay'] = {'path' : 'mapOptions/animationOnDisplay', 'type' : AttributeProcessor['TEXT']};
    attrs['shortDesc'] = {'path' : 'mapOptions/shortDesc', 'type' : AttributeProcessor['TEXT']};

    return attrs;
  };

  GeographicMapRenderer.prototype.ResetComponentOptions = function (amxNode, options, attributeChanges, descendentChanges)
  {
    GeographicMapRenderer.superclass.ResetComponentOptions.call(this, amxNode, options, attributeChanges, descendentChanges);
    // make a note that this is a refresh phase
    amxNode['_attributeChanges'] = attributeChanges;
    // clear the 'dirty' flag on the options object
    this.SetOptionsDirty(amxNode, false);
    // dataObject will be recreated from scratch
    amxNode["_dataObj"] =
    {
      'dataLayers' : [],
      'routes' : [],
      'mapOptions' : {}
    };

    if (amxNode.getAttribute('__userselection'))
    {
      var nodes = descendentChanges.getAffectedNodes();
      nodes.forEach(function (node)
      {
        var nodeChanges = descendentChanges.getChanges(node);
        if (nodeChanges && nodeChanges.hasChanged('selectedRowKeys'))
        {
          var userSelection = amxNode.getAttribute('__userselection');
          userSelection[node.getId] = null;
          amxNode.setAttributeResolvedValue('__userselection', userSelection);
        }
      });
    }
  };

  GeographicMapRenderer.prototype.getDescendentChangeAction = function (amxNode, changes)
  {
    return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];
  };

  /**
   * Function processes supported attributes which are on amxNode. This attributes
   * should be converted into the options object.
   *
   * @param options main component options object
   * @param amxNode child amxNode
   * @param context rendering context
   */
  GeographicMapRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {
    var changed = GeographicMapRenderer.superclass.ProcessAttributes.call(this, options, amxNode, context);
    // if refreshing existing map, turn off initial zoom and onDisplay animation
    var renderer = this;

    var routeCondition = function (n)
    {
      if (n.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(n.getAttribute('rendered')))
      {
        return false;
      }
      return "route" === n.getTag().getName();
    };

    var markerCondition = function (n)
    {
      if (n.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(n.getAttribute('rendered')))
      {
        return false;
      }
      return "marker" === n.getTag().getName();
    };

    var routePointCreator = function (waypointNode, index)
    {
      var position =
      {
        'id' : waypointNode.getId(),
        'x' : waypointNode.getAttribute('pointX'),
        'y' : waypointNode.getAttribute('pointY'),
        'address' : waypointNode.getAttribute('address'),
        '_rowKey' : '' + (index + 1),
        'displayMarker' : false
      };
      var markerNode = null;
      var list = waypointNode.getChildren();
      for (var i = 0;i < list.length;i++)
      {
        if (markerCondition.call(list, list[i]))
        {
          markerNode = list[i];
          break;
        }
      }
      // not supported on older versions
      // var markerNode = waypointNode.getChildren().find(markerCondition);
      if (markerNode)
      {
        if (markerNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(markerNode.getAttribute('rendered')))
        {
          return position;
        }
        position['displayMarker'] = true;
        renderer.processGeographicMapDataItem(null, position, markerNode);
      }

      return position;
    };

    var routeNodes = this.filterArray(amxNode.getChildren(), routeCondition);

    amxNode["_dataObj"]['routes'] = routeNodes.map(function (routeNode)
    {
      var result =
      {
        'id' : routeNode.getId(), 'style' :
        {
          'default' :
          {
            'color' : routeNode.getAttribute("lineColor"), 'width' : routeNode.getAttribute("lineWidth"), 'opacity' : routeNode.getAttribute("lineOpacity")
          }
        },
        'travelMode' : routeNode.getAttribute("travelMode"), 'wayPoints' : routeNode.getRenderedChildren().map(routePointCreator)
      };

      if (renderer._hasAction(routeNode))
      {
        result['action'] = result['id'];
      }
      return result;
    });

    options['mapOptions']['hasMapInputActionListener'] = amxNode.isAttributeDefined('mapInputListener');
    options['mapOptions']['hasMapBoundsChangeActionListener'] = amxNode.isAttributeDefined('mapBoundsChangeListener');

    return changed;
  };

  /**
   * Sets the geographic map properties found on the amxNode
   * @param options main component options object
   * @param amxNode child amxNode
   * @param context rendering context
   * @throws NodeNotReadyToRenderException exception thrown in case that the model is not ready
   */
  GeographicMapRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {
    return this.processGeographicMapPointDataLayerTags(context['amxNode'], amxNode, true);
  };

  GeographicMapRenderer.prototype.CreateComponentCallback = function (amxNode)
  {
    var renderer = this;
    var mapCallbackObj =
    {
      'callback' : function (event, component)
      {
        // fire the selectionChange event
        var type = event.getType();
        var itemNode = null;

        if (type === DvtGeoMapSelectionEvent.TYPE)
        {
          var userSelection = amxNode.getAttribute('__userselection') || {};
          var dataLayerId = event.getParamValue('dataLayerId');
          if (dataLayerId)
          {
            itemNode = renderer.findAmxNode(amxNode, dataLayerId);

            var selection = event.getSelection();
            selection = selection.map(function(item)
            {
              return item["rowKey"];
            });

            // filter all removed keys
            var removedKeys = renderer.filterArray(userSelection[dataLayerId], function(key)
            {
              return selection.indexOf(key) === -1;
            });

            var se = new adf.mf.api.amx.SelectionEvent(removedKeys, selection);

            userSelection[dataLayerId] = selection;

            amxNode.setAttributeResolvedValue('__userselection', userSelection);

            adf.mf.api.amx.processAmxEvent(itemNode, 'selection', undefined, undefined, se, null);
          }
          else
          {
            var oldSelections = userSelection;
            userSelection = {};
            amxNode.setAttributeResolvedValue('__userselection', userSelection);
            // component is deselecting all rowkeys in all layers so iterate through all previous
            // layers and trigger selection event
            var dataLayerIds = Object.keys(oldSelections);
            dataLayerIds.forEach(function(dlId)
            {
              itemNode = renderer.findAmxNode(amxNode, dlId);
              se = new adf.mf.api.amx.SelectionEvent(oldSelections[dlId], []);

              adf.mf.api.amx.processAmxEvent(itemNode, 'selection', undefined, undefined, se, null);
            });
          }
        }
        else if (type === DvtMapActionEvent.TYPE)
        {
          itemNode = renderer.findAmxNode(amxNode, event.getClientId());

          if (itemNode)
          {
            // marker node found, fire event and handle action
            var point = event.getParamValue('pointXY');
            if (point)
            {
              var markerIdEsc = itemNode.getId().replace(/:/g, '\\:');
              var markerDiv = document.getElementById(markerIdEsc);
              if (!markerDiv)
              {
                var canvasId = amxNode.getId() + '_canvas';
                var canvas = document.getElementById(canvasId);
                markerDiv = DOMUtils.createDIV();
                DOMUtils.writeIDAttribute(markerDiv, itemNode.getId());
                DOMUtils.writeStyleAttribute(markerDiv, "position: absolute; width:1px; height:1px;");
                canvas.appendChild(markerDiv);
              }
              markerDiv.style.cssText += 'top:' + (point.y - 2) + 'px;' + 'left:' + (point.x + 1) + 'px;';
            }

            var actionEvent = new adf.mf.api.amx.ActionEvent();
            var actionType = event.getParamValue('actionType') || 'click';
            var callback = function(){/*default callback without any action*/};

            // toolkit returns action types click and tapHold. AMX layer
            // however supports action and tapHold events so it is necessary to
            // translate click to action.
            if (actionType === 'click')
            {
              actionType = 'action';
              // in case and only in case of action event we want to perform navigation
              callback = function()
              {
                // action callback which is able to invoke navigation
                var action = itemNode.getAttributeExpression("action", true);
                if (action != null)
                {
                  adf.mf.api.amx.doNavigation(action);
                }
              };
            }

            adf.mf.api.amx.processAmxEvent(itemNode, actionType, undefined, undefined, actionEvent, callback);
          }
        }
        else if (type === DvtMapInputEvent.TYPE && amxNode.isAttributeDefined('mapInputListener'))
        {
          var mie = new adf.mf.api.dvt.MapInputEvent(event.getEventId(), event.getPointX(), event.getPointY());
          adf.mf.api.amx.processAmxEvent(amxNode, 'mapInput', undefined, undefined, mie);
        }
        else if (type === DvtMapBoundsChangeEvent.TYPE && amxNode.isAttributeDefined('mapBoundsChangeListener'))
        {
          var mbce = new adf.mf.api.dvt.MapBoundsChangeEvent(event.getMinX(), event.getMinY(), event.getMaxX(), event.getMaxY(), event.getCenterX(), event.getCenterY(), event.getZoomLevel());
          adf.mf.api.amx.processAmxEvent(amxNode, 'mapBoundsChange', undefined, undefined, mbce);
        }
      }
    };

    return mapCallbackObj;
  };

  GeographicMapRenderer.prototype.CreateRenderingContext = function (root, stageId)
  {
    return null;
  };

  GeographicMapRenderer.prototype.CreateToolkitComponentInstance = function (context, stageId, callbackObj, callback, amxNode)
  {
    return adf.mf.internal.dvt.geomap.DvtGeographicMap.newInstance(callback, callbackObj, this.GetDataObject(amxNode));
  };

  /**
   * sets up chart's outer div element
   *
   * @param amxNode
   */
  GeographicMapRenderer.prototype.SetupComponent = function (amxNode)
  {
    var contentDiv = GeographicMapRenderer.superclass.SetupComponent.call(this, amxNode);

    var canvasDiv = DOMUtils.createDIV();
    var id = amxNode.getId() + '_canvas';
    DOMUtils.writeIDAttribute(canvasDiv, id);
    DOMUtils.writeStyleAttribute(canvasDiv, 'width: 100%; height: 100%;');
    contentDiv.appendChild(canvasDiv);

    if (adf.mf.environment.profile.dtMode)
    {
      var readonly = document.createElement("div");
      readonly.className = "dvtm-readonly";
      contentDiv.appendChild(readonly);
    }
    return contentDiv;
  };

  GeographicMapRenderer.prototype._checkAndRenderWarning = function(amxNode, name)
  {
    switch(amxNode.getAttribute(name))
    {
      case "success":
        return true;
      case "failure":
        this._renderReloadPage(amxNode, amxNode.getId() + '_canvas');
        return false;
      case "waiting":
        default:
        this._renderPlaceholder(amxNode.getId() + '_canvas');
        return false;
    }
  };

  GeographicMapRenderer.prototype.postDisplay = function (rootElement, amxNode)
  {
    if (this.IsAncestor(document.body, rootElement))
    {
      this.GetComponentDimensions(rootElement, amxNode);
    }

    // render reload button when api is not available
    if (!this._checkAndRenderWarning(amxNode, "_configuration"))
    {
      return;
    }
    // render reload button when network is not available
    if (amxNode.getAttribute("_networkAvailable") === false)
    {
      this._renderReloadPage(amxNode, amxNode.getId() + '_canvas');
      return;
    }

    if (!this._checkAndRenderWarning(amxNode, "_apiLoaded"))
    {
      return;
    }

    if (this.__isReadyToRender(amxNode) === false)
    {
      this._renderPlaceholder(amxNode.getId() + '_canvas');
      return;
    }

    GeographicMapRenderer.superclass.postDisplay.call(this, rootElement, amxNode);
  };

  GeographicMapRenderer.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    if (attributeChanges.hasChanged("inlineStyle"))
    {
      var element = document.getElementById(amxNode.getId());
      element.setAttribute("style", amxNode.getAttribute("inlineStyle"));
    }
    // render reload button when network is not available
    if (amxNode.getAttribute("_networkAvailable") === false)
    {
      this._renderReloadPage(amxNode, amxNode.getId() + '_canvas');
      return;
    }

    if (!this._checkAndRenderWarning(amxNode, "_apiLoaded"))
    {
      return;
    }

    if (this.__isReadyToRender(amxNode) === false)
    {
      return;
    }

    GeographicMapRenderer.superclass.refresh.call(this, amxNode, attributeChanges, descendentChanges);
  };

  GeographicMapRenderer.prototype.__isReadyToRender = function(amxNode)
  {
    var ready = true;
    amxNode.visitChildren(new adf.mf.api.amx.VisitContext(), function (visitContext, anode)
    {
      if (anode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(anode.getAttribute('rendered')))
      {
        return adf.mf.api.amx.VisitResult['COMPLETE'];
      }

      if (anode.getTag().getName() === "pointDataLayer")
      {
        if (anode.isAttributeDefined("value"))
        {
          var items = anode.getAttribute("value");
          if (items === undefined)
          {
            ready = false;
            return adf.mf.api.amx.VisitResult['COMPLETE'];
          }

          if (items && items.treeNodeBindings)
          {
            var iter = adf.mf.api.amx.createIterator(items);
            if (iter.getTotalCount() > iter.getAvailableCount())
            {
              ready = false;
              return adf.mf.api.amx.VisitResult['COMPLETE'];
            }
          }
        }

        return adf.mf.api.amx.VisitResult['REJECT'];
      }
      return adf.mf.api.amx.VisitResult['ACCEPT'];
    });

    return ready;
  };

  GeographicMapRenderer.prototype.RenderComponent = function (instance, width, height, amxNode)
  {
    var mapCanvas = document.getElementById(amxNode.getId() + '_canvas');
    // everything is ok and we can rendere the map itself
    instance.setMapProvider(amxNode.getAttribute("_mapProvider"));
    instance.setMapViewerUrl(amxNode.getAttribute("_mapViewerUrl"));
    instance.setELocationUrl(amxNode.getAttribute("_eLocationUrl"));
    instance.setBaseMap(amxNode.getAttribute("_baseMap"));
    instance.setScreenReaderMode(amxNode.getAttribute("_accessibilityEnabled"));

    var options = this.GetDataObject(amxNode);

    // set options to project any changes to the map instance
    instance.setOptions(options);
    instance.render(mapCanvas, amxNode['_dataObj'], width, height);
  };

  GeographicMapRenderer.prototype._renderPlaceholder = function(canvasId)
  {
    var mapCanvas = document.getElementById(canvasId);
    adf.mf.api.amx.emptyHtmlElement(mapCanvas);

    var placeholder = document.createElement("div");
    placeholder.id = canvasId + "_placeholder";
    placeholder.className = "dvtm-component-placeholder amx-deferred-loading";

    var msgLoading = adf.mf.resource.getInfoString("AMXInfoBundle", "MSG_LOADING");
    placeholder.setAttribute("aria-label", msgLoading);

    mapCanvas.appendChild(placeholder);
  };

  GeographicMapRenderer.prototype._renderReloadPage = function(amxNode, canvasId)
  {
    var mapCanvas = document.getElementById(canvasId);
    adf.mf.api.amx.emptyHtmlElement(mapCanvas);

    var reloadDiv = document.createElement("div");
    reloadDiv.classList.add("dvtm-geographicMap-loadPage");

    var innerDiv = document.createElement("div");

    var label = document.createElement("div");
    label.appendChild(document.createTextNode(adf.mf.resource.getInfoString("AMXInfoBundle","dvtm_geographicMap_FAILED_LOAD_API")));
    innerDiv.appendChild(label);

    var button = document.createElement("div");
    button.setAttribute("tabindex", "0");
    label = document.createElement("label");
    label.classList.add("amx-commandButton-label");
    label.appendChild(document.createTextNode(adf.mf.resource.getInfoString("AMXInfoBundle","dvtm_geographicMap_RELOAD_BUTTON_LABEL")));
    button.appendChild(label);

    // Adding WAI-ARIA Attribute to the markup for the role attribute
    button.setAttribute("role", "button");
    button.classList.add("amx-node", "amx-commandButton");

    adf.mf.api.amx.addBubbleEventListener(button, 'tap', function (event)
    {
      var args = new adf.mf.api.amx.AmxNodeUpdateArguments();

      amxNode.setAttributeResolvedValue("_configuration", "reload");
      args.setAffectedAttribute(amxNode, "_configuration");

      adf.mf.api.amx.emptyHtmlElement(document.getElementById(canvasId));
      adf.mf.api.amx.markNodeForUpdate(args);
    });

    innerDiv.appendChild(button);

    reloadDiv.appendChild(innerDiv);

    mapCanvas.appendChild(reloadDiv);
    mapCanvas = null;
  };

  /**
   * Process the point data layer tag
   *
   * @throws NodeNotReadyToRenderException exception thrown in case that the model is not ready
   */
  GeographicMapRenderer.prototype.processGeographicMapPointDataLayerTags = function (amxNode, node, setMapProp)
  {
    var data = amxNode["_dataObj"];

    var children = node.getChildren();
    var iter = adf.mf.api.amx.createIterator(children);

    while (iter.hasNext())
    {
      var pointDataLayerNode = iter.next();

      if (pointDataLayerNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(pointDataLayerNode.getAttribute('rendered')))
        continue;

      // accept only dvtm:pointDataLayer nodes
      if (pointDataLayerNode.getTag().getName() !== 'pointDataLayer')
      {
        continue;
      }

      // if the model is not ready don't render the map
      if (!pointDataLayerNode.isReadyToRender())
      {
        throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException;
      }

      var dataLayer =
      {
      };

      var idx = iter.getRowKey();
      dataLayer['idx'] = idx;

      this.processSingleGeographicMapPointDataLayerTag(amxNode, pointDataLayerNode, dataLayer);

      data['dataLayers'].push(dataLayer);
    }
  };

  GeographicMapRenderer.prototype.processSingleGeographicMapPointDataLayerTag = function (amxNode, pointDataLayerNode, dataLayer)
  {
    var attr;

    attr = pointDataLayerNode.getAttribute('id');
    if (attr)
      dataLayer['id'] = attr;

    attr = pointDataLayerNode.getAttribute('animationOnDuration');
    if (attr)
      dataLayer['animationOnDuration'] = attr;

    attr = pointDataLayerNode.getAttribute('animationOnDataChange');
    if (attr)
      dataLayer['animationOnDataChange'] = attr;

    var strSelections = "";
    var k;
    var userSelection = amxNode.getAttribute('__userselection');
    if (userSelection)
    {
      for (k = 0;k < userSelection.length;k++)
      {
        if (k)
          strSelections += " ";
        strSelections += userSelection[k];
      }
      dataLayer['selectedRowKeys'] = strSelections;
    }
    else
    {
      attr = pointDataLayerNode.getAttribute('selectedRowKeys');
      if (attr)
      {
        // geomap renderer currently expects selected rowkeys as a space-separated string
        // TODO: fix this when the renderer accepts an array
        var arSelections = AttributeProcessor['ROWKEYARRAY'](attr);
        if (arSelections && arSelections.length > 0)
        {
          for (k = 0;k < arSelections.length;k++)
          {
            if (k)
              strSelections += " ";
            strSelections += arSelections[k];
          }
        }
        dataLayer['selectedRowKeys'] = strSelections;
        userSelection = userSelection || {};
        userSelection[pointDataLayerNode.getId()] = arSelections;
        amxNode.setAttributeResolvedValue('__userselection', userSelection);
      }
    }
    attr = pointDataLayerNode.getAttribute('dataSelection');
    if (attr)
      dataLayer['dataSelection'] = attr;

    attr = pointDataLayerNode.getAttribute('emptyText');
    if (attr)
      dataLayer['emptyText'] = attr;

    this.processGeographicMapPointLocationTag(amxNode, dataLayer, pointDataLayerNode);
  };

  GeographicMapRenderer.prototype.processGeographicMapPointLocationTag = function (amxNode, dataLayer, pointDataLayerNode)
  {
    dataLayer['data'] = [];
    var varName = pointDataLayerNode.getAttribute('var');
    var value = pointDataLayerNode.getAttribute('value');

    if (adf.mf.environment.profile.dtMode && value && value.replace(/\s+/g, '').indexOf('#{') >  - 1)
    {
      return;
    }

    if (value)
    {
      // collection is available so iterate through data and process each pointLocation
      var iter = adf.mf.api.amx.createIterator(value);
      while (iter.hasNext())
      {
        var stamp = iter.next();
        var children = pointDataLayerNode.getChildren(null, iter.getRowKey());
        // set context variable for child tag processing
        adf.mf.el.addVariable(varName, stamp);
        // iteration through all child elements
        var iter2 = adf.mf.api.amx.createIterator(children);
        while (iter2.hasNext())
        {
          var pointLocNode = iter2.next();
          var rowKey = iter.getRowKey();
          // process each location node
          this._processGeographicMapPointLocation(amxNode, dataLayer, pointLocNode, rowKey);
        }
        adf.mf.el.removeVariable(varName);
      }
    }
    else
    {
      // collection does not exist so iterate only through child tags
      // and resolve them without var context variable
      var tagChildren = pointDataLayerNode.getChildren();
      var childTagIterator = adf.mf.api.amx.createIterator(tagChildren);

      while (childTagIterator.hasNext())
      {
        var tagPointLocNode = childTagIterator.next();
        var tagRowKey = "" + (childTagIterator.getRowKey() + 1);
        // process each location node
        this._processGeographicMapPointLocation(amxNode, dataLayer, tagPointLocNode, tagRowKey);
      }
    }
  };

  GeographicMapRenderer.prototype._processGeographicMapPointLocation = function (amxNode, dataLayer, pointLocNode, rowKey)
  {
    // accept dvtm:pointLocation only
    if (pointLocNode.getTag().getName() !== 'pointLocation')
    {
      return;
    }

    if (pointLocNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(pointLocNode.getAttribute('rendered')))
    {
      return;
    }

    if (!pointLocNode.isReadyToRender())
    {
      throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException;
    }

    var data =
    {
    };

    if (pointLocNode.isAttributeDefined('type'))
    {
      data['type'] = pointLocNode.getAttribute('type');
    }
    if (pointLocNode.isAttributeDefined('pointX') && pointLocNode.isAttributeDefined('pointY'))
    {
      data['x'] = pointLocNode.getAttribute('pointX');
      data['y'] = pointLocNode.getAttribute('pointY');
    }
    else if (pointLocNode.isAttributeDefined('address'))
    {
      data['address'] = pointLocNode.getAttribute('address');
    }

    if (pointLocNode.isAttributeDefined('id'))
    {
      data['id'] = pointLocNode.getAttribute('id');
    }

    var markerNodes = pointLocNode.getChildren();

    if (markerNodes.length > 0 && markerNodes[0].getTag().getName() === 'marker')
    {
      data['_rowKey'] = rowKey;
      this.processGeographicMapDataItem(amxNode, data, markerNodes[0]);
    }

    dataLayer['data'].push(data);
  };

  GeographicMapRenderer.prototype.processGeographicMapDataItem = function (amxNode, data, dataNode)
  {
    // First check if this data item should be rendered at all
    if (dataNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(dataNode.getAttribute('rendered')))
      return;

    if (!dataNode.isReadyToRender())
    {
      throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException;
    }

    if (dataNode.isAttributeDefined('source'))
      data['source'] = adf.mf.api.amx.buildRelativePath(dataNode.getAttribute('source'));

    if (dataNode.isAttributeDefined('sourceHover'))
      data['sourceHover'] = adf.mf.api.amx.buildRelativePath(dataNode.getAttribute('sourceHover'));

    if (dataNode.isAttributeDefined('sourceSelected'))
      data['sourceSelected'] = adf.mf.api.amx.buildRelativePath(dataNode.getAttribute('sourceSelected'));

    if (dataNode.isAttributeDefined('sourceHoverSelected'))
      data['sourceHoverSelected'] = adf.mf.api.amx.buildRelativePath(dataNode.getAttribute('sourceHoverSelected'));

    if (dataNode.isAttributeDefined('shortDesc'))
      data['shortDesc'] = dataNode.getAttribute('shortDesc');

    if (dataNode.getAttribute('labelDisplay') === "on")
    {
      if (dataNode.isAttributeDefined('value'))
        data['label'] = dataNode.getAttribute('value');

      if (dataNode.isAttributeDefined('labelPosition'))
        data['labelPosition'] = dataNode.getAttribute('labelPosition');

      if (dataNode.isAttributeDefined('labelStyle'))
        data['labelStyle'] = dataNode.getAttribute('labelStyle');
    }

    if (dataNode.isAttributeDefined('width'))
      data['width'] = +dataNode.getAttribute('width');

    if (dataNode.isAttributeDefined('height'))
      data['height'] = +dataNode.getAttribute('height');

    if (dataNode.isAttributeDefined('scaleX'))
      data['scaleX'] = +dataNode.getAttribute('scaleX');

    if (dataNode.isAttributeDefined('scaleY'))
      data['scaleY'] = +dataNode.getAttribute('scaleY');

    if (dataNode.isAttributeDefined('rotation'))
      data['rotation'] = +dataNode.getAttribute('rotation');

    if (dataNode.isAttributeDefined('opacity'))
      data['opacity'] = +dataNode.getAttribute('opacity');

    data['clientId'] = dataNode.getId();

    if (this._hasAction(dataNode))
    {
      data['action'] = data['_rowKey'];
    }
    else
    {
      data['action'] = null;
    }
  };

  GeographicMapRenderer.prototype._hasAction = function (amxNode)
  {
    if (amxNode.isAttributeDefined('action'))
    {
      return true;
    }
    else
    {
      var actionTags;
      // should fire action, if there are any 'setPropertyListener' or 'showPopupBehavior' child tags
      actionTags = amxNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'setPropertyListener');
      if (actionTags.length > 0)
        return true;

      actionTags = amxNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'showPopupBehavior');
      if (actionTags.length > 0)
        return true;

      actionTags = amxNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'actionListener');
      if (actionTags.length > 0)
        return true;

      return false;
    }
  };

  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'geographicMap', GeographicMapRenderer);
})();
/* Copyright (c) 2013, 2015 Oracle and/or its affiliates. All rights reserved. */
/*
 *    geoMap/GeographicMapToolkit.js
 */
(function ()
{
  var DvtGeographicMap = function (callback, callbackObj)
  {
    this.Init(callback, callbackObj);
  };

  adf.mf.internal.dvt.DvtmObject.createSubclass(DvtGeographicMap, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.geomap.DvtGeographicMap');

  /** @private */
  // TODO change to supported map providers
  DvtGeographicMap.MAP_PROVIDER_ORACLE = 'oraclemaps';
  DvtGeographicMap.MAP_PROVIDER_GOOGLE = 'googlemaps';
  DvtGeographicMap.MAP_VIEWER_URL = 'http://elocation.oracle.com/mapviewer';
  DvtGeographicMap.ELOCATION_BASE_URL = 'http://elocation.oracle.com/elocation';

  DvtGeographicMap.BASE_MAP = 'ELOCATION_MERCATOR.WORLD_MAP';

  DvtGeographicMap.prototype.Init = function (callback, callbackObj)
  {
    this._callback = callback;
    this._callbackObj = callbackObj;
    // by default, use google map as the provider
    this.mapProvider = DvtGeographicMap.MAP_PROVIDER_GOOGLE;
    this.mapViewerUrl = DvtGeographicMap.MAP_VIEWER_URL;
    this.eLocationUrl = DvtGeographicMap.ELOCATION_BASE_URL;
    this.baseMap = DvtGeographicMap.BASE_MAP;
    this.selection = [];
    this.initialSelectionApplied = false;// apply selectedRowKeys on a new instance only
    this.screenReaderMode = false;
  };

  /**
   * Returns a new instance of DvtGeographicMap.
   * @param {string} callback The function that should be called to dispatch component events.
   * @param {object} callbackObj The optional object instance on which the callback function is defined.
   * @param {object} options The object containing options specifications for this component.
   * @return {DvtGeographicMap}
   */
  DvtGeographicMap.newInstance = function (callback, callbackObj, options)
  {
    var map = new DvtGeographicMap(callback, callbackObj);
    map.setOptions(options);
    return map;
  };

  /**
   * Returns the map provider
   * @return {string}
   */
  DvtGeographicMap.prototype.getMapProvider = function ()
  {
    return this.mapProvider;
  };

  /**
   * Specifies the map provider
   * @param {string} provider The map provider.
   */
  DvtGeographicMap.prototype.setMapProvider = function (provider)
  {
    // TODO change to supported map providers
    if (provider == DvtGeographicMap.MAP_PROVIDER_ORACLE 
      || provider == DvtGeographicMap.MAP_PROVIDER_GOOGLE)
      this.mapProvider = provider;
  };

  /**
   * Returns the map viewer url
   * @return {string}
   */
  DvtGeographicMap.prototype.getMapViewerUrl = function ()
  {
    return this.mapViewerUrl;
  };

  DvtGeographicMap.prototype.getELocationUrl = function ()
  {
    return this.eLocationUrl;
  };

  /**
   * Specifies the map viewer url
   * @param {string} mapViewerUrl The map viewer url
   */
  DvtGeographicMap.prototype.setMapViewerUrl = function (url)
  {
    if (url)
    {
      this.mapViewerUrl = url;
    }
  };

  DvtGeographicMap.prototype.setELocationUrl = function (url)
  {
    if (url)
    {
      this.eLocationUrl = url;
    }
  };
  /**
   * Returns the base map
   * @return {string}
   */
  DvtGeographicMap.prototype.getBaseMap = function ()
  {
    return this.baseMap;
  };

  /**
   * Specifies the base map for oracle maps
   * @param {string} baseMap The base map
   */
  DvtGeographicMap.prototype.setBaseMap = function (baseMap)
  {
    this.baseMap = baseMap;
  };

  /**
   * Specifies the non-data options for this component.
   * @param {object} options The object containing options specifications for this component.
   * @protected
   */
  DvtGeographicMap.prototype.setOptions = function (options)
  {
    this.Options = DvtGeographicMapDefaults.calcOptions(options);
  };

  /**
   * Returns the screenReaderMode
   * @return {boolean}
   */
  DvtGeographicMap.prototype.getScreenReaderMode = function ()
  {
    return this.screenReaderMode;
  };

  /**
   * Set the screen reader mode
   * @param {boolean} mode
   */
  DvtGeographicMap.prototype.setScreenReaderMode = function (mode)
  {
    this.screenReaderMode = mode;
  };

  /**
   * Dispatches the event to the callback function.
   * @param {object} event The event to be dispatched.
   */
  DvtGeographicMap.prototype.__dispatchEvent = function (event)
  {
    if (!this._callback)
      return;
    else if (this._callback && this._callback.call)
      this._callback.call(this._callbackObj, event, this);
  };

  /**
   * Renders the component with the specified data.  If no data is supplied to a component
   * that has already been rendered, the component will be rerendered to the specified size.
   * @param {object} mapCanvas The div to render the map.
   * @param {object} data The object containing data for this component.
   * @param {number} width The width of the component.
   * @param {number} height The height of the component.
   */
  DvtGeographicMap.prototype.render = function (mapCanvas, data, width, height)
  {
    this.Data = data;
    this._width = width;
    this._height = height;

    DvtGeographicMapRenderer.render(this, mapCanvas, width, height);
  };

  /**
   * Base class for component level events.
   * @class The base class for component level events.
   * @constructor
   * @export
   */
  var DvtBaseComponentEvent = function()
  {};

  adf.mf.internal.dvt.DvtmObject.createSubclass(DvtBaseComponentEvent, 'adf.mf.internal.dvt.DvtmObject', 'DvtBaseComponentEvent', 'PRIVATE');

  DvtBaseComponentEvent.CLIENT_ROW_KEY = 'clientRowKey';

  /**
   * @param {string} type The event type for this event.
   * @protected
   */
  DvtBaseComponentEvent.prototype.Init = function (type)
  {
    this._type = type;
  };

  /**
   * Returns the event type for this event.
   * @return {string} The event type for this event.
   * @export
   */
  DvtBaseComponentEvent.prototype.getType = function ()
  {
    return this._type;
  };

  /**
   * Return a list of additional parameter keys
   * @return {array} paramKeys additional parameter keys
   */
  DvtBaseComponentEvent.prototype.getParamKeys = function ()
  {
    return this._paramKeys;
  };

  /**
   * Return a list of additional parameter values
   * @return {array} paramValues additional parameter values
   */
  DvtBaseComponentEvent.prototype._getParamValues = function ()
  {
    return this._paramValues;
  };

  /**
   * Add an additional parameter (key, value) to this event (ex clientRowKey)
   * @param {String} paramKey parameter key
   * @param {String} paramValue parameter value
   */
  DvtBaseComponentEvent.prototype.addParam = function (paramKey, paramValue)
  {
    if (!this._paramKeys)
    {
      this._paramKeys = [];
      this._paramValues = [];
    }

    this._paramKeys.push(paramKey);
    this._paramValues.push(paramValue);
  };

  /**
   * Get parameter value in this event
   * @param {String} paramKey parameter key
   * @return {String} paramValue parameter value
   * @export
   */
  DvtBaseComponentEvent.prototype.getParamValue = function (paramKey)
  {
    if (!paramKey || !this._paramKeys || !this._paramValues)
    {
      return null;
    }

    var index =  - 1;
    for (var i = 0;i < this._paramKeys.length;i++)
    {
      if (this._paramKeys[i] == paramKey)
      {
        index = i;
        break;
      }
    }

    if (index !=  - 1)
    {
      return this._paramValues[index];
    }

    return null;
  };

  /**
   * Default values and utility functions for chart versioning.
   * @class
   */
  var DvtGeographicMapDefaults = function ()
  {
  };

  adf.mf.internal.dvt.DvtmObject.createSubclass(DvtGeographicMapDefaults, 'adf.mf.internal.dvt.DvtmObject', 'DvtGeographicMapDefaults', 'PRIVATE');

  /**
   * Defaults for version 1.
   */
  DvtGeographicMapDefaults.VERSION_1 =
  {
    'mapOptions' :
    {
      'mapType' : 'ROADMAP',
      'zoomLevel' : '14',
      'centerX' : '-98.57',
      'centerY' : '39.82',
      'doubleClickBehavior' : 'zoomin'
    }
  };

  /**
   * Combines the user options with the defaults for the specified version.  Returns the
   * combined options object.  This object will contain internal attribute values and
   * should be accessed in internal code only.
   * @param {object} userOptions The object containing options specifications for this component.
   * @return {object} The combined options object.
   */
  DvtGeographicMapDefaults.calcOptions = function (userOptions)
  {
    var defaults = DvtGeographicMapDefaults._getDefaults(userOptions);

    // Use defaults if no overrides specified
    if (!userOptions)
      return defaults;
    // add flag to identify if the zoom level is defined
    // in user options or not
    // this is needed during initial zooming
    var explicitZoom = userOptions['mapOptions']['zoomLevel'] ? true : false;
    // Merge the options object with the defaults
    var merged = adf.mf.internal.dvt.util.JSONUtils.mergeObjects(userOptions, defaults);
    merged['mapOptions']['explicitZoom'] = explicitZoom;

    return merged;
  };

  /**
   * Returns the default options object for the specified version of the component.
   * @param {object} userOptions The object containing options specifications for this component.
   * @private
   */
  DvtGeographicMapDefaults._getDefaults = function (userOptions)
  {
    // Note: Version checking will eventually get added here
    // Note: Future defaults objects are deltas on top of previous objects
    return adf.mf.internal.dvt.util.JSONUtils.cloneObject(DvtGeographicMapDefaults.VERSION_1);
  };

  /**
   * Renderer for DvtGeographicMap.
   * @class
   */
  var DvtGeographicMapRenderer = function ()
  {};

  adf.mf.internal.dvt.DvtmObject.createSubclass(DvtGeographicMapRenderer, 'adf.mf.internal.dvt.DvtmObject', 'DvtGeographicMapRenderer', 'PRIVATE');

  DvtGeographicMapRenderer.DEFAULT_ORACLE_MARKER_IMG = 'css/images/geomap/ball_ena.png';
  DvtGeographicMapRenderer.DEFAULT_ORACLE_MARKER_HOVER_IMG = 'css/images/geomap/ball_ovr.png';
  DvtGeographicMapRenderer.DEFAULT_ORACLE_MARKER_SELECT_IMG = 'css/images/geomap/ball_sel.png';
  DvtGeographicMapRenderer.DEFAULT_GOOGLE_MARKER_IMG = 'css/images/geomap/red-circle.png';
  DvtGeographicMapRenderer.DEFAULT_GOOGLE_MARKER_HOVER_IMG = 'css/images/geomap/ylw-circle.png';
  DvtGeographicMapRenderer.DEFAULT_GOOGLE_MARKER_SELECT_IMG = 'css/images/geomap/blu-circle.png';
  DvtGeographicMapRenderer.MOUSE_OVER = 'mouseover';
  DvtGeographicMapRenderer.MOUSE_OUT = 'mouseout';
  DvtGeographicMapRenderer.CLICK = 'click';
  DvtGeographicMapRenderer.SEL_NONE = 'none';
  DvtGeographicMapRenderer.SEL_SINGLE = 'single';
  DvtGeographicMapRenderer.SEL_MULTIPLE = 'multiple';

  /**
   * Renders the geographic map in the specified area.
   * @param {DvtGeographicMap} map The geographic map being rendered.
   * @param {object} mapCanvas The div to render the map.
   * @param {number} width The width of the component.
   * @param {number} height The height of the component.
   */
  DvtGeographicMapRenderer.render = function (map, mapCanvas, width, height)
  {
    var mapProvider = map.getMapProvider();
    if (mapProvider == DvtGeographicMap.MAP_PROVIDER_ORACLE)
      DvtGeographicMapRenderer.renderOracleMap(map, mapCanvas, width, height);
    else if (mapProvider == DvtGeographicMap.MAP_PROVIDER_GOOGLE)
      DvtGeographicMapRenderer.renderGoogleMap(map, mapCanvas, width, height);

    // For screen reader mode, render the marker shortDesc
    if (map.getScreenReaderMode() == true)
      DvtGeographicMapRenderer.renderMarkerText(map, mapCanvas);
  };

  /**
   * Renders the marker text for screen reader mode
   * @param {DvtGeographicMap} map The geographic map
   * @param {object} mapCanvas The div to render the map.
   */
  DvtGeographicMapRenderer.renderMarkerText = function (map, mapCanvas)
  {
    var data = map.Data;
    var options = map.Options;
    var mapStr = '';
    if (options.mapOptions.shortDesc)
      mapStr = options.mapOptions.shortDesc + ': ';

    var dataLayers = data['dataLayers'];
    for (var i = 0;i < dataLayers.length;i++)
    {
      var dataLayer = dataLayers[i];
      var points = dataLayer['data'];
      for (var j = 0;j < points.length;j++)
      {
        mapStr += DvtGeographicMapRenderer.getTooltip(points[j]) + ', ';
      }
    }

    var length = mapStr.length;
    if (length >= 2)
      mapStr = mapStr.substring(0, length - 2);

    var mapTextDiv = document.createElement('div');
    mapTextDiv.innerHTML = mapStr;
    mapCanvas.parentNode.appendChild(mapTextDiv);
  };

  /**
   * Renders the geographic map in the specified area.
   * @param {DvtGeographicMap} map The geographic map being rendered.
   * @param {object} mapCanvas The div to render the map.
   * @param {number} width The width of the component.
   * @param {number} height The height of the component.
   * @this
   */
  DvtGeographicMapRenderer.renderOracleMap = function (map, mapCanvas, width, height)
  {
    var options = map.Options;
    var data = map.Data;
    var baseURL = map.getMapViewerUrl();
    var baseMap = map.getBaseMap();
    var mapCenterLon = options.mapOptions.centerX;
    var mapCenterLat = options.mapOptions.centerY;
    var mapZoom = options.mapOptions.zoomLevel;
    var doubleClickAction = 'recenter';

    var mpoint;
    if (!map['center'])
      mpoint = MVSdoGeometry.createPoint(parseFloat(mapCenterLon), parseFloat(mapCenterLat), 8307);
    else
      mpoint = map['center'];

    var mapview = new MVMapView(mapCanvas, baseURL);
    mapview.addMapTileLayer(new MVBaseMap(baseMap));
    mapview.setCenter(mpoint);
    // filter all empty values
    if (mapZoom)
    {
      mapview.setZoomLevel(parseInt(mapZoom));
    }
    mapview.removeAllFOIs();

    var initialZooming = true;
    if (!DvtGeographicMapRenderer._mapIncludesData(map))
    {
      initialZooming = false;
    }
    else if (options.mapOptions.initialZooming)
      initialZooming = options.mapOptions.initialZooming == 'none' ? false : true;

    // define double click/tap action
    if (options.mapOptions['doubleClickBehavior'] !== undefined)
    {
      doubleClickAction = options.mapOptions['doubleClickBehavior'];
    }
    mapview.setDoubleClickAction(doubleClickAction);

    // set touchHold behaviour
    mapview.setTouchBehavior(
    {
      touchHold : 'mouse_over'
    });

    var fireMapBoundsChangeEvent = function ()
    {
      if (!options.mapOptions.hasMapBoundsChangeActionListener)
      {
        return;
      }

      var bbox = mapview.getMapWindowBBox();
      var center = mapview.getCenter();
      // return immediately if properties not initialized
      if (!bbox || !center)
        return;

      var zoomLevel = mapview.getZoomLevel();

      var callback = function (geom)
      {
        var mbr = geom.getMBR();
        mapview.transformGeom(center, 8307, null, function (centerGeom)
        {
          var evt = new DvtMapBoundsChangeEvent(mbr[0], mbr[1], mbr[2], mbr[3], centerGeom.getPointX(), centerGeom.getPointY(), zoomLevel);
          map.__dispatchEvent(evt);
        });
      };
      // convert to the 8307 coords system
      mapview.transformGeom(bbox, 8307, null, callback);
    };

    var recenter = function ()
    {
      options.mapOptions.initialZooming = 'none';
      map['center'] = mapview.getCenter();
      fireMapBoundsChangeEvent();
    };

    var zoom = function (beforeLevel, afterLevel)
    {
      options.mapOptions.initialZooming = 'none';
      options.mapOptions.zoomLevel = '' + mapview.getZoomLevel();
      fireMapBoundsChangeEvent();
    };

    var clickHandler = function (eventId)
    {
      // convert to the 8307 coords system
      var callback = function (geom)
      {
        var evt = new DvtMapInputEvent(eventId, geom.getPointX(), geom.getPointY());
        map.__dispatchEvent(evt);
      };

      var location = mapview.getMouseLocation();
      mapview.transformGeom(location, 8307, null, callback);
    };

    mapview.attachEventListener(MVEvent.RECENTER, recenter);
    mapview.attachEventListener(MVEvent.ZOOM_LEVEL_CHANGE, zoom);

    if (options.mapOptions.hasMapInputActionListener)
    {
      mapview.attachEventListener(MVEvent.MOUSE_CLICK, function ()
      {
        clickHandler('click')
      });
      mapview.attachEventListener(MVEvent.MOUSE_DOWN, function ()
      {
        clickHandler('mousedown')
      });
      mapview.attachEventListener(MVEvent.MOUSE_UP, function ()
      {
        clickHandler('mouseup')
      });
    }
    // set the data layer
    DvtGeographicMapRenderer.setOracleMapDataLayer(map, mapview, data, initialZooming);

    mapview.display();
  };

  var _oracleHasMatch = function(addressResult, address)
  {
    if (addressResult)
    {
      switch (addressResult.matchCode)
      {
        case 1: adf.mf.log.Framework.logp(adf.mf.log.level.FINE, 'adf.mf.internal.dvt.geomap.DvtGeographicMap', address, 'Exact match. All fields in the input geocode operation matched values in the geocoding data set.');
          return true;
        case 2: adf.mf.log.Framework.logp(adf.mf.log.level.FINE, 'adf.mf.internal.dvt.geomap.DvtGeographicMap', address, 'All of the input fields of the geocoding operation match the geocoding data except the street type, prefix, or suffix.');
          return true;
        case 3: adf.mf.log.Framework.logp(adf.mf.log.level.FINE, 'adf.mf.internal.dvt.geomap.DvtGeographicMap', address, 'All of the input fields of the geocoding operation match except the house or building number. Also the street type, prefix, or suffix may not match as well.');
          return true;
        case 4: adf.mf.log.Framework.logp(adf.mf.log.level.FINE, 'adf.mf.internal.dvt.geomap.DvtGeographicMap', address, 'The address does not match, but the city name and postal code do match.');
          return true;
        case 10: adf.mf.log.Framework.logp(adf.mf.log.level.FINE, 'adf.mf.internal.dvt.geomap.DvtGeographicMap', address, 'The postal code does not match the input geocoding request, but the city name does match.');
          return true;
        case 11: adf.mf.log.Framework.logp(adf.mf.log.level.FINE, 'adf.mf.internal.dvt.geomap.DvtGeographicMap', address, 'The postal code matches the data used for geocoding, but the city name does not match.');
          return true;
        case 12: adf.mf.log.Framework.logp(adf.mf.log.level.FINE, 'adf.mf.internal.dvt.geomap.DvtGeographicMap', address, 'The region is matched, but the postal code and city name are not matched.');
          return true;
        default:
      }

      if (addressResult.errorMessage)
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.FINE, 'adf.mf.internal.dvt.geomap.DvtGeographicMap', address, 'Geocoder error:' + addressResult.errorMessage);
      }
      else
      {
        adf.mf.log.Framework.logp(adf.mf.log.level.FINE, 'adf.mf.internal.dvt.geomap.DvtGeographicMap', address, 'No matching address found!');
      }
    }
    else
    {
      adf.mf.log.Framework.logp(adf.mf.log.level.FINE, 'adf.mf.internal.dvt.geomap.DvtGeographicMap', address, 'No matching address found!');
    }
    return false;
  };

  /**
   * Set the data layer on oracle map
   * @param {DvtGeographicMap} map The geographic map being rendered.
   * @param {object} mapview The MVMapView
   * @param {object} data The geographic map data object
   * @param {boolean} initialZooming Should the map zoom to the data points
   */
  DvtGeographicMapRenderer.setOracleMapDataLayer = function(map, mapview, data, initialZooming)
  {
    var dataLayers = data['dataLayers'];
    var foiCount = 10000;
    var minX = null;
    var maxX = null;
    var minY = null;
    var maxY = null;
    for (var i = 0;i < dataLayers.length;i++)
    {
      var dataLayer = dataLayers[i];
      var points = dataLayer['data'];
      var selectedRowKeys = DvtGeographicMapRenderer._getSelectedRowKeys(map, dataLayer, i);
      for (var j = 0; j < points.length; j++)
      {
        var params = DvtGeographicMapRenderer.getParams(points[j], DvtGeographicMap.MAP_PROVIDER_ORACLE);
        var selMode = DvtGeographicMapRenderer.getSelMode(dataLayer);

        params['selMode'] = selMode;
        params['dataLayerId'] = dataLayer['id'];

        if (selMode == DvtGeographicMapRenderer.SEL_SINGLE || selMode == DvtGeographicMapRenderer.SEL_MULTIPLE)
        {
          params['selected'] = (selectedRowKeys.indexOf(points[j]['_rowKey']) !== -1) ? true : false;
        }
        if (points[j]['x'] && points[j]['y'])
        {
          DvtGeographicMapRenderer.addPointFOI(map, mapview, points[j], foiCount++, params);
          minX = DvtGeographicMapRenderer.getMin(minX, parseFloat(points[j]['x']));
          maxX = DvtGeographicMapRenderer.getMax(maxX, parseFloat(points[j]['x']));
          minY = DvtGeographicMapRenderer.getMin(minY, parseFloat(points[j]['y']));
          maxY = DvtGeographicMapRenderer.getMax(maxY, parseFloat(points[j]['y']));
          if (initialZooming && (i == dataLayers.length - 1 && j == points.length - 1))
          {
            if (map['Options']['mapOptions']['explicitZoom'])
            {
              var mpoint = MVSdoGeometry.createPoint((minX + maxX) / 2, (minY + maxY) / 2, 8307);
              mapview.setCenter(mpoint);
            }
            else
            {
              mapview.zoomToRectangle(MVSdoGeometry.createRectangle(minX, minY, maxX, maxY, 8307));
            }
          }
        }
        else if (points[j]['address'])
        {
          var callback = function (mapParams, address)
          {
            map['_jobs'] = map['_jobs'] ? map['_jobs'] + 1 : 1;
            return function(gcResult)
            {
              map['_jobs'] = map['_jobs'] - 1;
              // one or more matching address is found
              // we get the first one
              var addrObj = gcResult[0];

              if (_oracleHasMatch(addrObj, address))
              {
                DvtGeographicMapRenderer.addPointFOI(map, mapview, addrObj, foiCount++, mapParams);
                // This cannot be simply moved outside the loop because the callback may not be finished after the loop ends
                minX = DvtGeographicMapRenderer.getMin(minX, parseFloat(addrObj['x']));
                maxX = DvtGeographicMapRenderer.getMax(maxX, parseFloat(addrObj['x']));
                minY = DvtGeographicMapRenderer.getMin(minY, parseFloat(addrObj['y']));
                maxY = DvtGeographicMapRenderer.getMax(maxY, parseFloat(addrObj['y']));
              }

              if (initialZooming && map['_jobs'] === 0 && (minX && maxX && minY && maxY))
              {
                delete map['_jobs'];
                if (map['Options']['mapOptions']['explicitZoom'])
                {
                  var mpoint = MVSdoGeometry.createPoint((minX + maxX) / 2, (minY + maxY) / 2, 8307);
                  mapview.setCenter(mpoint);
                }
                else
                {
                  mapview.zoomToRectangle(MVSdoGeometry.createRectangle(minX, minY, maxX, maxY, 8307));
                }
              }
            }
          };

          var addr = points[j]['address'];
          var url = map.getELocationUrl() + '/jslib/oracleelocation.js';
          var success = function (address, mapParams)
          {
            // need this closure since this is in a loop
            return function ()
            {
              DvtGeographicMapRenderer['geoCoderAPILoaded'] = true;
              var eloc = new OracleELocation(map.getELocationUrl());
              eloc.geocode(address, callback(mapParams, address));
            }
          };

          var failure = function()
          {
            adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, 'adf.mf.internal.dvt.geomap.DvtGeographicMap', 'setOracleMapDataLayer', 'Failed to load GeoCoder API!');
          };

          if (!DvtGeographicMapRenderer['geoCoderAPILoaded'])
          {
            DvtGeographicMapRenderer.loadJS(url, success(addr, params), failure);
          }
          else
          {
            var eloc = new OracleELocation(map.getELocationUrl());
            eloc.geocode(addr, callback(params));
          }
        }
      }
    }
    map.initialSelectionApplied = true;// initial selection has been applied by now
  };

  /**
   * Add point FOI to map
   * @param {DvtGeographicMap} map The geographic map being rendered.
   * @param {object} mapview The map view
   * @param {object} point The point
   * @param {string} pointId The point ID
   * @param {params} params The params for the point foi
   */
  DvtGeographicMapRenderer.addPointFOI = function (map, mapview, point, pointId, params)
  {
    var action = params['action'];
    var selMode = params['selMode'];
    var dataLayerId = params['dataLayerId'];
    var selected = params['selected'];
    var sourceImg;

    if (selected)
    {
      sourceImg = params['sourceSelected'];
    }
    else
    {
      sourceImg = params['source'];
    }
    var geoPoint = MVSdoGeometry.createPoint(parseFloat(point['x']), parseFloat(point['y']), 8307);
    var pointFOI = MVFOI.createMarkerFOI(pointId.toString(), geoPoint, sourceImg);
    if (params['tooltip'])
      pointFOI.setInfoTip(params['tooltip']);
    if (params['opacity'])
      pointFOI.setOpacity(params['opacity']);
    if (params.label)
    {
      var translateX = -50;
      if (document.documentElement.dir == "rtl")
      {
         translateX *= -1;
      }
      var span = "<span " +
      "style=\"" + (params.labelStyle || "") + ";" +
        "position:absolute;" +
        "-webkit-transform: translateX(" + translateX + "%);" +
        "transform: translateX(" + translateX + "%);" +
        "white-space:nowrap;" +
      "\">" +
      params.label +
      "</span>";

      var top = 0;
      switch (params['labelPosition'])
      {
        case "center" :
          top = 0
          break;
        case "top" :
          top = (-1) * Math.floor(params["height"] / 2);
          break;
        case "bottom" :
        default:
          top = Math.floor(params["height"] / 2);
      }

      pointFOI.setHTMLElement(span, Math.floor(params["width"] / 2), top);
    }
    // attach selection related event listeners
    if (selMode == DvtGeographicMapRenderer.SEL_SINGLE || selMode == DvtGeographicMapRenderer.SEL_MULTIPLE)
    {
      if (!amx.hasTouch())
      {
        // bug 18113730: do not register hover listeners on touch devices
        DvtGeographicMapRenderer.attachEventListener(map, pointFOI, DvtGeographicMapRenderer.MOUSE_OVER, params);
        DvtGeographicMapRenderer.attachEventListener(map, pointFOI, DvtGeographicMapRenderer.MOUSE_OUT, params);
      }
      DvtGeographicMapRenderer.attachEventListener(map, pointFOI, DvtGeographicMapRenderer.CLICK, params);
      // if the point is selected, add it to the selection cache
      if (selected)
      {
        var selection = map['selection'][dataLayerId];
        if (selection === undefined)
        {
          selection = map['selection'][dataLayerId] = [];
        }
        pointFOI['selected'] = true;
        pointFOI['rowKey'] = params['rowKey'];
        pointFOI['dataLayerId'] = dataLayerId;
        selection.push(pointFOI);
      }
    }

    if (action)
    {
      // real listener implementation that handles click and tapHold on the FOI point
      var listener = function (event)
      {
        var actionEvent = new DvtMapActionEvent(params['clientId'], params['rowKey'], action);
        actionEvent.addParam('dataLayerId', params['dataLayerId']);
        actionEvent.addParam('actionType', event.data.type);
        var mbr = mapview.getMapWindowBBox().getMBR();
        var geom = pointFOI.getGeometry();
        if (mbr && geom)
        {
          // get marker coordinates in pixels
          var pixelX = Math.floor((geom.getPointX() - mbr[0]) * mapview.getPixelsPerXUnit());
          var pixelY = Math.floor((mbr[3] - geom.getPointY()) * mapview.getPixelsPerYUnit());
          actionEvent.addParam('pointXY',
          {
            'x' : pixelX, 'y' : pixelY
          });
          // report lat/long in 8307 coordinate system
          var callback = function (transGeom)
          {
            actionEvent.addParam('latLng',
            {
              'lat' : transGeom.getPointY(), 'lng' : transGeom.getPointX()
            });
            map.__dispatchEvent(actionEvent);
          };
          geom = mapview.transformGeom(geom, 8307, null, callback);
        }
        else
        {
          map.__dispatchEvent(actionEvent);
        }
      };
      // function that registers 
      var registrator = function(start, stop, cancel)
      {
        pointFOI.attachEventListener(MVEvent.MOUSE_DOWN, start);
        // click is used since mouse_up event is not working here
        pointFOI.attachEventListener(MVEvent.MOUSE_CLICK, stop);
        pointFOI.attachEventListener(MVEvent.MOUSE_OUT, cancel);
      };

      _addTapHoldEventListener(pointFOI, registrator, listener);
    }

    mapview.addFOI(pointFOI);
  };

  /**
   * Attach event listeners
   * @param {DvtGeographicMap} map The geographic map being rendered.
   * @param {object} pointFOI The point FOI
   * @param {string} eventType The event type
   * @param {object} params The params for the point foi
   */
  DvtGeographicMapRenderer.attachEventListener = function (map, pointFOI, eventType, params)
  {
    switch (eventType)
    {
      case DvtGeographicMapRenderer.MOUSE_OVER:
        pointFOI.attachEventListener(MVEvent.MOUSE_OVER, function ()
        {
          if (!pointFOI.selected)
          {
            pointFOI.updateImageURL(params['sourceHover']);
          }
          else
          {
            pointFOI.updateImageURL(params['sourceHoverSelected']);
          }
        });
        break;
      case DvtGeographicMapRenderer.MOUSE_OUT:
        pointFOI.attachEventListener(MVEvent.MOUSE_OUT, function ()
        {
          if (!pointFOI.selected)
          {
            pointFOI.updateImageURL(params['source']);
          }
        });
        break;
      case DvtGeographicMapRenderer.CLICK:
        pointFOI.attachEventListener(MVEvent.MOUSE_CLICK, function ()
        {
          var id = params['dataLayerId'];
          var i;
          if (!map.selection[id])
            map.selection[id] = [];
          var selMode = params['selMode'];
          if (!pointFOI.selected)
          {
            var selection = map.selection[id];
            if (selMode == DvtGeographicMapRenderer.SEL_SINGLE)
            {
              if (selection.length != 0)
              {
                for (i = 0;i < selection.length;i++)
                {
                  selection[i].updateImageURL(params['source']);
                  selection[i].selected = false;
                }
                map.selection[id] = [];
              }
            }
            pointFOI.updateImageURL(params['sourceSelected']);
            pointFOI.selected = true;
            pointFOI.rowKey = params['rowKey'];
            pointFOI.dataLayerId = id;
            map.selection[id].push(pointFOI);
          }
          else
          {
            // deselect
            pointFOI.updateImageURL(params['source']);
            pointFOI.selected = false;
            // remove from selection
            if (selMode == DvtGeographicMapRenderer.SEL_SINGLE)
            {
              map.selection[id] = [];
            }
            else if (selMode == DvtGeographicMapRenderer.SEL_MULTIPLE)
            {
              for (i = 0;i < map.selection[id].length;i++)
              {
                if (pointFOI.getId() == map.selection[id][i].getId())
                {
                  map.selection[id].splice(i, 1);
                  break;
                }
              }
            }
          }
          var evt = new DvtGeoMapSelectionEvent(map.selection[id]);
          evt.addParam('dataLayerId', id);
          map.__dispatchEvent(evt);
        });
        break;
      default :
        break;
    }
  };

  /**
   * Renders the geographic map in the specified area.
   * @param {DvtGeographicMap} map The geographic map being rendered.
   * @param {object} mapCanvas The div to render the map.
   * @param {number} width The width of the component.
   * @param {number} height The height of the component.
   * @this
   */
  DvtGeographicMapRenderer.renderGoogleMap = function (map, mapCanvas, width, height)
  {
    var options = map.Options;
    var data = map.Data;

    var mapTypeId = '';

    switch (options.mapOptions.mapType)
    {
      case 'ROADMAP':
        mapTypeId = google.maps.MapTypeId.ROADMAP;
        break;
      case 'SATELLITE':
        mapTypeId = google.maps.MapTypeId.SATELLITE;
        break;
      case 'HYBRID':
        mapTypeId = google.maps.MapTypeId.HYBRID;
        break;
      case 'TERRAIN':
        mapTypeId = google.maps.MapTypeId.TERRAIN;
        break;
      default :
        mapTypeId = google.maps.MapTypeId.ROADMAP;
        break;
    }

    var initialZooming = true;
    if (!DvtGeographicMapRenderer._mapIncludesData(map))
    {
      initialZooming = false;
    }
    else if (options.mapOptions.initialZooming)
    {
      initialZooming = options.mapOptions.initialZooming == 'none' ? false : true;
    }
    var animationOnDisplay = 'none';
    if (options.mapOptions.animationOnDisplay)
    {
      animationOnDisplay = options.mapOptions.animationOnDisplay;
    }

    var gmap;
    map._firstTime = false;

    if (initialZooming)
    {
      // create empty instance of the google map without information
      // about the map type - this prevents map from rendering immediately
      if (!map['_googlemap'])
      {
        map._firstTime = true;
        // create google map instance on the map component
        map['_googlemap'] = new google.maps.Map(mapCanvas);
      }
      gmap = map['_googlemap'];
    }
    else
    {
      // resolve information required for the map without initial zooming
      var mapCenterLon = parseFloat(options.mapOptions.centerX);
      var mapCenterLat = parseFloat(options.mapOptions.centerY);
      // create standard map which will be displayed imediately
      if (!map['_googlemap'])
      {
        map._firstTime = true;
        // prepare initial options
        var mapOptions = new Object();
        mapOptions.mapTypeId = mapTypeId;
        // create google map instance on the map component
        map['_googlemap'] = new google.maps.Map(mapCanvas, mapOptions);
      }

      gmap = map['_googlemap'];
      gmap.setCenter(new google.maps.LatLng(mapCenterLat, mapCenterLon));
      gmap.setZoom(parseInt(options.mapOptions.zoomLevel));
    }
    // set map type
    gmap.setMapTypeId(mapTypeId);
    // remove all old markers from the google map instance
    if (map._currentMarkers)
    {
      for (var ind = 0;ind < map._currentMarkers.length;ind++)
      {
        if (map._currentMarkers[ind] && map._currentMarkers[ind].setMap)
        {
          map._currentMarkers[ind].setMap(null);
        }
      }
      // clear array of old markers
      map._currentMarkers.length = 0;
    }
    else
    {
      map._currentMarkers = [];
    }

    DvtGeographicMapRenderer.googleMapRenderRoutes(map, gmap, data, initialZooming);
    // set the data layer
    DvtGeographicMapRenderer.setGoogleMapDataLayer(map, gmap, data, initialZooming, animationOnDisplay);
    // when map is initialized in hidden panel, we need to resize and recenter the map
    google.maps.event.addListenerOnce(gmap, 'idle', function ()
    {
      var center = gmap.getCenter();
      google.maps.event.trigger(gmap, 'resize');
      gmap.setCenter(center);
    });
  };

  DvtGeographicMapRenderer.googleMapRenderRoutes = function (map, gmap, data, initialZooming)
  {
    if (!data.routes || data.routes.length === 0)
      return;

    var routeBounds = null;
    var requests = 0;

    data.routes.forEach(function (routeOptions)
    {
      if (!routeOptions["wayPoints"] || routeOptions["wayPoints"].length < 2)
      {
        return;
      }

      var tMode = null;
      var mode = routeOptions['travelMode'];
      if (mode)
        mode = mode.toLowerCase();
      switch (mode)
      {
        case 'walking':
          tMode = google.maps.TravelMode.WALKING;
          break;
        case 'cycling':
          tMode = google.maps.TravelMode.BICYCLING;
          break;
        default :
          tMode = google.maps.TravelMode.DRIVING;
      }

      var wayPointTranslator = function (point)
      {
        if (point['address'])
        {
          return {location : point['address']};
        }
        return {location : new google.maps.LatLng(point['y'], point['x'])};
      };

      var markerParamTranslator = function (point)
      {
        if (point['displayMarker'] !== true)
        {
          return null;
        }
        return DvtGeographicMapRenderer.getParams(point, map.getMapProvider());
      };

      var wayPoints = routeOptions["wayPoints"].map(wayPointTranslator);
      var params = routeOptions["wayPoints"].map(markerParamTranslator);

      var directionsService = new google.maps.DirectionsService();

      var request =
      {
        origin : wayPoints[0]['location'], destination : wayPoints[wayPoints.length - 1]['location'], travelMode : tMode, provideRouteAlternatives : false, waypoints : wayPoints.slice(1, wayPoints.length - 1)
      };

      var routeStyle = routeOptions['style']['default'];
      var polyOptions =
      {
        strokeColor : routeStyle['color'] || '#1fb5fb', strokeOpacity : routeStyle['opacity'] || 1, strokeWeight : routeStyle['width'] || 8
      };

      var routeAction = routeOptions['action'];
      var routeId = routeOptions['id'];

      requests++;
      directionsService.route(request, function (result, status)
      {
        requests--;
        var createClickHandler = function (clientId, action)
        {
          return function (e)
          {
            var actionEvent = new DvtMapActionEvent(clientId, null, action);
            var clickPosition = e.latLng;
            var pointXY = fromLatLngToPixel(gmap, clickPosition);
            actionEvent.addParam('pointXY',
            {
              'x' : pointXY.x, 'y' : pointXY.y
            });
            actionEvent.addParam('latLng',
            {
              'lat' : clickPosition.lat(), 'lng' : clickPosition.lng()
            });

            map.__dispatchEvent(actionEvent);
          };
        };

        if (status === google.maps.DirectionsStatus.OK)
        {
          result.routes.forEach(function (route, routeIndex)
          {
            if (initialZooming)
            {
              if (!routeBounds)
              {
                routeBounds = route.bounds;
              }
              routeBounds = routeBounds.union(route.bounds);
              if (requests === 0 && routeBounds)
              {
                gmap.fitBounds(routeBounds);
                routeBounds = null;
              }
            }
            route.legs.forEach(function (leg, legIndex)
            {
              if (params[legIndex])
              {
                DvtGeographicMapRenderer.processGoogleMapDataPoint(map, gmap, leg['start_location'], params[legIndex], false, false);
              }
              if (legIndex === route.legs.length - 1 && params[legIndex + 1])
              {
                DvtGeographicMapRenderer.processGoogleMapDataPoint(map, gmap, leg['end_location'], params[legIndex + 1], false, false);
              }

              leg.steps.forEach(function (step, stepIndex)
              {
                var polyline = new google.maps.Polyline(polyOptions);
                polyline.setPath(step.path);

                if (routeAction)
                {
                  google.maps.event.addListener(polyline, DvtGeographicMapRenderer.CLICK, createClickHandler(routeId, routeAction));
                }

                polyline.setMap(gmap);
                // need to remove this on the next search
                map._currentMarkers = map._currentMarkers || [];
                map._currentMarkers.push(polyline);
              });
            });
          });
        }
        else
        {
          adf.mf.log.Framework.logp(adf.mf.log.level.WARNING, 'adf.mf.internal.dvt.geomap.DvtGeographicMap', 'googleMapRenderRoutes', 'Can\'t render the route because of the service error [returned status: \'' + status + '\']');
        }
      });
    });
  };

  var TextOverlay = null;

  var createTextOverlayClass = function()
  {
    if (!TextOverlay)
    {
      /** @constructor */
      TextOverlay = function(map, gmap) {

        // Now initialize all properties.
        this.instance_ = map;
        this.map_ = gmap;

        // Define a property to hold the texts' div. We'll
        // actually create this div upon receipt of the onAdd()
        // method so we'll leave it null for now.
        this.div_ = null;

        // Explicitly call setMap on this overlay
        this.setMap(gmap);
      };

      TextOverlay.prototype = new google.maps.OverlayView();

      /**
       * onAdd is called when the map's panes are ready and the overlay has been
       * added to the map.
       */
      TextOverlay.prototype.onAdd = function() {

        var div = document.createElement('div');
        div.style.border = 'none';
        div.style.borderWidth = '0px';
        div.style.position = 'absolute';
        div.style.left = 0;
        div.style.top = 0;
        div.style.right = 0;
        div.style.down = 0;

        this.div_ = div;

        // Add the element to the "overlayImage" pane.
        var panes = this.getPanes();
        panes.overlayImage.appendChild(this.div_);
      };

      TextOverlay.prototype.draw = function() {

        // We use the south-west and north-east
        // coordinates of the overlay to peg it to the correct position and size.
        // To do this, we need to retrieve the projection from the overlay.
        var overlayProjection = this.getProjection();
        var map = this.getMap();
        var bounds = map.getBounds();
        var div = this.div_;
        div.innerHTML = "";
        this.instance_._currentMarkers.forEach(function(marker)
        {
          if (marker.label && marker.getVisible())
          {
            var latLng = marker.getPosition();
            if (bounds.contains(latLng))
            {
              // retrieve pixel coordinates for the latlng position of the marker
              var position = overlayProjection.fromLatLngToDivPixel(latLng);

              var span = document.createElement("span");
              span.textContent = marker.label;
              if (marker.labelStyle)
              {
                span.setAttribute("style", marker.labelStyle);
              }

              span.style.position = "absolute";
              span.style.whiteSpace = "nowrap";
              span.style.right = "auto";
              span.style.bottom = "auto";
              span.style.width = "auto";
              span.style.height = "auto";

              div.appendChild(span);

              span.style.left = (position.x - span.offsetWidth / 2) + 'px';
              var icon = marker.getIcon();

              switch (marker.labelPosition)
              {
                case "center" :
                  span.style.top = (position.y - Math.floor((icon.size.height + span.offsetHeight) / 2 )) + 'px';
                  break;
                case "top" :
                  span.style.top = (position.y - Math.floor((icon.size.height + span.offsetHeight)) - 1) + 'px';
                  break;
                case "bottom" :
                default:
                   span.style.top = (position.y + 1) + 'px';
              }
            }
          }
        });
      };

      TextOverlay.prototype.onRemove = function() {
        this.div_.parentNode.removeChild(this.div_);
      };

      // Set the visibility to 'hidden' or 'visible'.
      TextOverlay.prototype.hide = function() {
        if (this.div_) {
          // The visibility property must be a string enclosed in quotes.
          this.div_.style.visibility = 'hidden';
        }
      };

      TextOverlay.prototype.show = function() {
        if (this.div_) {
          this.div_.style.visibility = 'visible';
        }
      };

      TextOverlay.prototype.toggle = function() {
        if (this.div_) {
          if (this.div_.style.visibility === 'hidden') {
            this.show();
          } else {
            this.hide();
          }
        }
      };

      // Detach the map from the DOM via toggleDOM().
      // Note that if we later reattach the map, it will be visible again,
      // because the containing <div> is recreated in the overlay's onAdd() method.
      TextOverlay.prototype.toggleDOM = function() {
        if (this.getMap()) {
          // Note: setMap(null) calls OverlayView.onRemove()
          this.setMap(null);
        } else {
          this.setMap(this.map_);
        }
      };
    }
  };

  /**
   * @param {DvtGeographicMap} gmap Google Map instance
   * @param {object} map instance of the GeographicMap
   * @param {array} points Arraz of data points
   * @this
   */
  DvtGeographicMapRenderer.googleMapRenderEnd = function (gmap, map, points)
  {
    createTextOverlayClass();
    var geocoderQueue = [];
    // process all resolved marker points and add them to the google map
    for (var i = 0;i < points.length;i++)
    {
      var point = points[i];
      if (point)
      {
        if (point['resolved'] === true)
        {
          DvtGeographicMapRenderer.processGoogleMapDataPoint(map, gmap, point['latLng'], point['params'], point['animation'], point['initialZooming']);
        }
        else
        {
          geocoderQueue.push(point);
        }
      }
    }

    if (geocoderQueue.length > 0)
    {
      var timeStamp = (new Date()).getTime();
      var callback = function (markerParams, aAddress, animation)
      {
        return function (results, status)
        {
          // add map point when result is returned
          if (status === google.maps.GeocoderStatus.OK)
          {
            var addrMarkerLatLng = results[0].geometry.location;
            DvtGeographicMapRenderer._addresscache[aAddress] = addrMarkerLatLng;
            timeStamp = (new Date()).getTime();
            DvtGeographicMapRenderer.processGoogleMapDataPoint(map, gmap, addrMarkerLatLng, markerParams, animation, false);
          }

          if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT)
          {
            geocoderQueue.push(
            {
              'resolved' : false, 'address' : aAddress, 'params' : markerParams, 'animation' : animation, 'initialZooming' : false
            });
          }
        }
      };

      var ITEMS_PER_SECOND = 10;

      setTimeout(function (geocoderCallback, renderer, queue)
      {
        var geocoder = new google.maps.Geocoder();
        var consumer = window.setInterval(function ()
        {
          if (queue.length === 0 || (new Date()).getTime() - timeStamp > 3000)
          {
            clearInterval(consumer);
            if ((new Date()).getTime() - timeStamp > 3000)
            {
              throw new Error('ERR_DAILY_QUOTA_EXCEEDED');
            }
            return;
          }

          var geo = queue.shift();
          if (geo)
          {
            var address = geo['address'];
            // create address cache if not exists
            if (renderer._addresscache === undefined)
            {
              renderer._addresscache =
              {
              };
            }
            // try to load information about address location from cache
            var cachedPoint = renderer._addresscache[address];
            if (cachedPoint)
            {
              renderer.processGoogleMapDataPoint(map, gmap, cachedPoint, geo['params'], geo['animation'], false);
            }
            else
            {
              geocoder.geocode(
              {
                'address' : address
              },
              geocoderCallback(geo['params'], address, geo['animation']));
            }
          }
        },
        Math.floor(1000 / ITEMS_PER_SECOND) + 1);
      }, 1000 - Math.floor(1000 / ITEMS_PER_SECOND) + 1, callback, DvtGeographicMapRenderer, geocoderQueue);
    }

    map.initialSelectionApplied = true;// initial selection has been applied by now
    // when bounds are selected zoom to them
    if (map._bounds)
    {
      var zoomLevel = parseInt(map['Options']['mapOptions']['zoomLevel']);
      var ne = map._bounds.getNorthEast();
      var sw = map._bounds.getSouthWest();
      // when northeast and southwest corners of the map bounds are equal
      // then zoom only to one point
      if (ne.equals(sw))
      {
        DvtGeographicMapRenderer.zoomToMarker(gmap, ne, zoomLevel);
      }
      // in case that there is explicit zoom set by developer
      // use initial zoom only to center the map and use
      // custom zoom level as default
      else if (map['Options']['mapOptions']['explicitZoom'])
      {
        var center = map._bounds.getCenter();
        DvtGeographicMapRenderer.zoomToMarker(gmap, center, zoomLevel);
      }
      else
      {
        gmap.fitBounds(map._bounds);
      }

      map._bounds = null;
    }
    else if (!gmap.getZoom())
    {
      var centerLat = parseFloat(map['Options']['mapOptions']['centerY']);
      var centerLng = parseFloat(map['Options']['mapOptions']['centerX']);

      var center = new google.maps.LatLng(centerLat, centerLng);

      DvtGeographicMapRenderer.zoomToMarker(gmap, center, 2);
    }

    // register listeners which handle user interaction with map on the first time map is rendered
    if (map._firstTime)
    {
      map.textOverlay = new TextOverlay(map, gmap);
      // this method fires an MapBoundsChangeEvent on map view property changes
      var fireMapBoundsChangeEvent = function ()
      {
        var options = map['Options'];
        if (!options.mapOptions.hasMapBoundsChangeActionListener)
        {
          return;
        }
        var bounds = gmap.getBounds();
        var zoomLevel = gmap.getZoom();
        // bug 17863212: return immediately if map not fully initialized yet
        if (!bounds)
          return;

        var evt = new DvtMapBoundsChangeEvent(bounds.getSouthWest().lng(), bounds.getSouthWest().lat(), bounds.getNorthEast().lng(), bounds.getNorthEast().lat(), bounds.getCenter().lng(), bounds.getCenter().lat(), zoomLevel);
        map.__dispatchEvent(evt);
      };

      // save information about new map center and zoom when user change it by dragging the map
      // user interaction is similar to changing of properties of the map so store it to Options of the map.
      google.maps.event.addListener(gmap, 'dragend', function ()
      {
        // renderer should reset all these options object on component refresh
        var options = map['Options'];
        var center = gmap.getCenter();
        if (center)
        {
          options.mapOptions.centerX = '' + center.lng();
          options.mapOptions.centerY = '' + center.lat();
        }
        var zoom = gmap.getZoom();
        if (zoom)
        {
          options.mapOptions.zoomLevel = '' + zoom;
        }
        if (zoom || center)
        {
          options.mapOptions.initialZooming = 'none';
        }
        // notify clients
        fireMapBoundsChangeEvent();
      });

      // store information about user selected map type
      google.maps.event.addListener(gmap, 'maptypeid_changed', function ()
      {
        var options = map['Options'];
        switch (gmap.getMapTypeId())
        {
          case google.maps.MapTypeId.ROADMAP:
            options.mapOptions.mapType = 'ROADMAP';
            break;
          case google.maps.MapTypeId.SATELLITE:
            options.mapOptions.mapType = 'SATELLITE';
            break;
          case google.maps.MapTypeId.HYBRID:
            options.mapOptions.mapType = 'HYBRID';
            break;
          case google.maps.MapTypeId.TERRAIN:
            options.mapOptions.mapType = 'TERRAIN';
            break;
          default :
            options.mapOptions.mapType = 'ROADMAP';
            break;
        }
      });

      var clickHandler = function (eventId, event)
      {
        var latLng = event.latLng;
        var evt = new DvtMapInputEvent('click', latLng.lng(), latLng.lat());
        map.__dispatchEvent(evt);
      };

      var lastLatLng = null;

      var domEventHandler = function (eventId)
      {
        if (lastLatLng)
        {
          var evt = new DvtMapInputEvent(eventId, lastLatLng.lng(), lastLatLng.lat());
          map.__dispatchEvent(evt);
        }
      };

      var mouseMoveHandler = function (event)
      {
        lastLatLng = event.latLng;
      };

      if (map['Options'].mapOptions.hasMapInputActionListener)
      {
        google.maps.event.addListener(gmap, 'click', function (event)
        {
          clickHandler('click', event);
        });
        google.maps.event.addListener(gmap, 'mousemove', function (event)
        {
          mouseMoveHandler(event)
        });
        google.maps.event.addDomListener(gmap.getDiv(), 'mousedown', function (event)
        {
          domEventHandler('mousedown');
        });
        google.maps.event.addDomListener(gmap.getDiv(), 'mouseup', function (event)
        {
          domEventHandler('mouseup');
        });
      }

      google.maps.event.addListener(gmap, 'zoom_changed', fireMapBoundsChangeEvent);
    }
  };

  /**
   * @param {DvtGeographicMap} map The geographic map being rendered.
   * @param {object} gmap The google map
   * @param {object} markerLatLng
   * @param {params} params The params for the marker
   * @param {string} animation Marker animation
   * @param {boolean} initialZooming Should the map zoom to the data points
   * @this
   */
  DvtGeographicMapRenderer.processGoogleMapDataPoint = function (map, gmap, markerLatLng, params, animation, initialZooming)
  {
    // add marker into the map
    DvtGeographicMapRenderer.addMarker(map, gmap, markerLatLng, params, animation);
    // when initial zooming is enabled determin proper bounds for all markers
    if (initialZooming)
    {
      if (!map._bounds)
      {
        map._bounds = new google.maps.LatLngBounds(markerLatLng, markerLatLng);
      }
      // function extends current bounds to include new marker
      map._bounds = map._bounds.extend(markerLatLng);
    }
  };

    // --------- Tap Hold --------- //
  var tapHoldPendingIds = {};

  function cancelPendingTapHold()
  {
    tapHoldPendingIds = {};
  }

  var holdThreshold = 800;

  var _addTapHoldEventListener = function(marker, listenerAddCallback, listener, eventData)
  {
    eventData = eventData || {};
    var tapId = null;
    var startListener = function(event)
    {
      tapId = amx.uuid(); // TODO don't use amx.foo!
      tapHoldPendingIds[tapId] = new Date().getTime();

      setTimeout(function()
      {
        // Note: here we double check if the time is greater than the threshold. This is useful since sometime timeout
        //       is not really reliable.
        if (tapHoldPendingIds[tapId] > 0)
        {
          delete tapHoldPendingIds[tapId];
          // Call the listener but make sure our eventData is used:
          var eventDataToRestore = event.data;
          event.data = eventData;
          event.data.type = "tapHold";
          listener.call(marker, event);
          event.data = eventDataToRestore;
        }

      }, holdThreshold);
    };

    var endListener = function(event)
    {
      if (tapHoldPendingIds[tapId])
      {
        delete tapHoldPendingIds[tapId];
      
        var eventDataToRestore = event.data;
        event.data = eventData;
        event.data.type = "click";
        listener.call(marker, event);
        event.data = eventDataToRestore;
      }
    };

    listenerAddCallback.call(this, startListener, endListener, cancelPendingTapHold);
  };
  // --------- /Tap Hold --------- //


  /**
   * Set the data layer on google map
   * @param {DvtGeographicMap} map The geographic map being rendered.
   * @param {object} gmap The google map
   * @param {object} data The geographic map data object
   * @param {boolean} initialZooming Should the map zoom to the data points
   * @param {string} animation Marker animation
   * @this
   */
  DvtGeographicMapRenderer.setGoogleMapDataLayer = function (map, gmap, data, initialZooming, animation)
  {
    map._bounds = null;
    var dataLayers = data['dataLayers'];
    map._jobCount = 0;// number of remaining map points to resolve
    var result = [];
    var index = 0;

    var geocoder = undefined;
    var geocoderRequestCount = 0;
    for (var i = 0;i < dataLayers.length;i++)
    {
      var dataLayer = dataLayers[i];
      var points = dataLayer['data'];
      var selectedRowKeys = DvtGeographicMapRenderer._getSelectedRowKeys(map, dataLayer, i);

      map._jobCount += points.length;
      result.length += points.length;

      for (var j = 0;j < points.length;j++)
      {
        var params = DvtGeographicMapRenderer.getParams(points[j], map.getMapProvider());
        var selMode = DvtGeographicMapRenderer.getSelMode(dataLayer);

        params['selMode'] = selMode;
        params['dataLayerId'] = dataLayer['id'];

        if (selMode == DvtGeographicMapRenderer.SEL_SINGLE || selMode == DvtGeographicMapRenderer.SEL_MULTIPLE)
        {
          params['selected'] = (selectedRowKeys.indexOf(points[j]['_rowKey']) !==  - 1) ? true : false;
        }

        if (points[j]['x'] && points[j]['y'])
        {
          var markerLatLng = new google.maps.LatLng(parseFloat(points[j]['y']), parseFloat(points[j]['x']));
          result[index] =
          {
            'resolved' : true, 'latLng' : markerLatLng, 'params' : params, 'animation' : animation, 'initialZooming' : initialZooming
          };
          map._jobCount--;// map point resolved
        }
        else if (points[j]['address'])
        {
          var address = points[j]['address'];
          // create address cache if not exists
          if (DvtGeographicMapRenderer._addresscache === undefined)
          {
            DvtGeographicMapRenderer._addresscache =
            {
            };
          }
          // try to load information about address location from cache
          var cachedPoint = DvtGeographicMapRenderer._addresscache[address];
          if (cachedPoint)
          {
            result[index] =
            {
              'resolved' : true, 'address' : address, 'latLng' : cachedPoint, 'params' : params, 'animation' : animation, 'initialZooming' : initialZooming
            };
            map._jobCount--;// map point resolved
          }
          else
          {
            // callback object which handles result from geocoder
            var callback = function (map, markerParams, aIndex, aAddress)
            {
              return function (results, status)
              {
                map._jobCount--;
                // add map point when result is returned
                if (status == google.maps.GeocoderStatus.OK)
                {
                  var addrMarkerLatLng = results[0].geometry.location;
                  DvtGeographicMapRenderer._addresscache[aAddress] = addrMarkerLatLng;

                  result[aIndex] =
                  {
                    'resolved' : true, 'address' : aAddress, 'latLng' : addrMarkerLatLng, 'params' : markerParams, 'animation' : animation, 'initialZooming' : initialZooming
                  };
                }

                if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT)
                {
                  result[aIndex] =
                  {
                    'resolved' : false, 'address' : aAddress, 'params' : markerParams, 'animation' : animation, 'initialZooming' : initialZooming
                  };
                }

                // endpoint of asynchronous callback
                if (map._jobCount === 0)
                {
                  DvtGeographicMapRenderer.googleMapRenderEnd(gmap, map, result);
                }
              }
            };
            // create geocoder service if it does not exist
            if (geocoder === undefined)
            {
              geocoder = new google.maps.Geocoder();
            }

            if (geocoderRequestCount < 10)
            {
              geocoderRequestCount++;
              geocoder.geocode(
              {
                'address' : address
              },
              callback(map, params, index, address));
            }
            else
            {
              map._jobCount--;
              result[index] =
              {
                'resolved' : false, 'address' : address, 'params' : params, 'animation' : animation, 'initialZooming' : initialZooming
              };
            }
          }
        }
        index++;
      }
    }
    // in case there are no points or all points have been already added call end function
    if (map._jobCount === 0)
    {
      DvtGeographicMapRenderer.googleMapRenderEnd(gmap, map, result);
    }
  };

  var __getMarkerIcon = function (image, params)
  {
    var dim = new google.maps.Size(params['width'] * params['scaleX'], params['height'] * params['scaleY']);
    return {
      url : image,
      size : dim,
      scaledSize : dim
    };
  };

  /**
   * Add marker to map
   * @param {DvtGeographicMap} map The geographic map being rendered.
   * @param {object} gmap The google map
   * @param {object} markerLatLng
   * @param {params} params The params for the point foi
   * @param {string} animation Marker animation
   * @this
   */
  DvtGeographicMapRenderer.addMarker = function (map, gmap, markerLatLng, params, animation)
  {
    // create array which holds information about markers on the map
    if (map._currentMarkers === undefined)
    {
      map._currentMarkers = [];
    }
    var selMode = params['selMode'];
    var dataLayerId = params['dataLayerId'];
    var selected = params['selected'];
    var action = params['action'];
    var tooltip = '';
    if (params['tooltip'])
      tooltip = params['tooltip'];

    var sourceImg;
    if (selected)
    {
      sourceImg = __getMarkerIcon(params['sourceSelected'], params);
    }
    else
    {
      sourceImg = __getMarkerIcon(params['source'], params);
    }

    var marker = new google.maps.Marker(
    {
      opacity : params['opacity'],
      position : markerLatLng,
      //  optimized: false,
      icon : sourceImg,
      title : tooltip
    });

    marker.label = params['label'];
    marker.labelStyle = params['labelStyle'];
    marker.labelPosition = params['labelPosition'];

    if (animation == 'auto')
      marker.setAnimation(google.maps.Animation.DROP);

    // Add marker to the map
    marker.setMap(gmap);
    // add information that map contains marker
    map._currentMarkers.push(marker);

    // attach selection related event listeners
    if (selMode == DvtGeographicMapRenderer.SEL_SINGLE || selMode == DvtGeographicMapRenderer.SEL_MULTIPLE)
    {
      if (!amx.hasTouch())
      {
        // bug 18113730: do not register hover listeners on touch devices
        DvtGeographicMapRenderer.attachGMapEventListener(map, marker, DvtGeographicMapRenderer.MOUSE_OVER, params);
        DvtGeographicMapRenderer.attachGMapEventListener(map, marker, DvtGeographicMapRenderer.MOUSE_OUT, params);
      }
      DvtGeographicMapRenderer.attachGMapEventListener(map, marker, DvtGeographicMapRenderer.CLICK, params);

      if (selected)
      {
        var selection = map['selection'][dataLayerId];
        if (selection === undefined)
        {
          selection = map['selection'][dataLayerId] = [];
        }
        marker['selected'] = true;
        marker['rowKey'] = params['rowKey'];
        marker['dataLayerId'] = dataLayerId;
        selection.push(marker);
      }
    }

    if (action)
    {
      var listener = function (event)
      {
        var actionEvent = new DvtMapActionEvent(params['clientId'], params['rowKey'], action);
        actionEvent.addParam('dataLayerId', params['dataLayerId']);
        actionEvent.addParam('actionType', event.data.type);
        var markerPos = marker.getPosition();
        var pointXY = fromLatLngToPixel(gmap, markerPos);

        actionEvent.addParam('pointXY', 
        {
          'x' : pointXY.x, 'y' : pointXY.y
        });
        actionEvent.addParam('latLng', 
        {
          'lat' : markerPos.lat(), 'lng' : markerPos.lng()
        });
        map.__dispatchEvent(actionEvent);
      };

      var registrator = function(start, stop, cancel)
      {
        google.maps.event.addListener(marker, "mousedown", start);
        google.maps.event.addListener(marker, "mouseup", stop);
        google.maps.event.addListener(marker, "mouseout", cancel);
      };

      _addTapHoldEventListener(marker, registrator, listener);
    }
  };

  var fromLatLngToPixel = function (gmap, position)
  {
    var scale = Math.pow(2, gmap.getZoom());
    var proj = gmap.getProjection();
    var bounds = gmap.getBounds();
    var nw = proj.fromLatLngToPoint(new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng()));
    var point = proj.fromLatLngToPoint(position);

    return new google.maps.Point(Math.floor((point.x - nw.x) * scale), Math.floor((point.y - nw.y) * scale));
  };

  /**
   * Attach event listeners
   * @param {DvtGeographicMap} map The geographic map being rendered.
   * @param {object} marker The marker
   * @param {string} eventType The event type
   * @param {object} params The params for the point
   */
  DvtGeographicMapRenderer.attachGMapEventListener = function (map, marker, eventType, params)
  {
    switch (eventType)
    {
      case DvtGeographicMapRenderer.MOUSE_OVER:
        google.maps.event.addListener(marker, DvtGeographicMapRenderer.MOUSE_OVER, function ()
        {
          if (!marker.selected)
          {
            marker.setIcon(__getMarkerIcon(params['sourceHover'], params));
          }
          else
          {
            marker.setIcon(__getMarkerIcon(params['sourceHoverSelected'], params));
          }
        });
        break;
      case DvtGeographicMapRenderer.MOUSE_OUT:
        google.maps.event.addListener(marker, DvtGeographicMapRenderer.MOUSE_OUT, function ()
        {
          if (!marker.selected)
          {
            marker.setIcon(__getMarkerIcon(params['source'], params));
          }
        });
        break;
      case DvtGeographicMapRenderer.CLICK:
        google.maps.event.addListener(marker, DvtGeographicMapRenderer.CLICK, function ()
        {
          var id = params['dataLayerId'];
          var i;
          if (!map.selection[id])
            map.selection[id] = [];
          var selMode = params['selMode'];
          if (!marker.selected)
          {
            var selection = map.selection[id];
            if (selMode == DvtGeographicMapRenderer.SEL_SINGLE)
            {
              if (selection.length != 0)
              {
                for (i = 0;i < selection.length;i++)
                {
                  selection[i].setIcon(__getMarkerIcon(params['source'], params));
                  selection[i].selected = false;
                }
                map.selection[id] = [];
              }
            }
            marker.setIcon(__getMarkerIcon(params['sourceSelected'], params));
            marker.selected = true;
            marker.rowKey = params['rowKey'];
            marker.dataLayerId = id;
            map.selection[id].push(marker);
          }
          else
          {
            // deselect
            marker.setIcon(__getMarkerIcon(params['source'], params));
            marker.selected = false;
            // remove from selection
            if (selMode == DvtGeographicMapRenderer.SEL_SINGLE)
            {
              map.selection[id] = [];
            }
            else if (selMode == DvtGeographicMapRenderer.SEL_MULTIPLE)
            {
              for (i = 0;i < map.selection[id].length;i++)
              {

                if (marker.rowKey == map.selection[id][i].rowKey && marker.dataLayerId == map.selection[id][i].dataLayerId)
                {
                  map.selection[id].splice(i, 1);
                  break;
                }
              }
            }
          }
          var evt = new DvtGeoMapSelectionEvent(map.selection[id]);
          evt.addParam('dataLayerId', id);
          map.__dispatchEvent(evt);
        });
        break;
      default :
        break;
    }
  };

  /**
   * Zoom to a single marker
   * @param {object} gmap the Google map
   * @param {object} markerLatLng the LatLng google maps object
   * @param {number} zoomLevel the zoom level (optional)
   */
  DvtGeographicMapRenderer.zoomToMarker = function (gmap, markerLatLng, zoomLevel)
  {
    gmap.setCenter(markerLatLng);
    if (zoomLevel)
      gmap.setZoom(zoomLevel);
  };

  /**
   * Get the params for the point
   *
   * @param {object} point The data object
   * @param {string} mapProvider The map provider id
   * @return {object} params The params for the point
   */
  DvtGeographicMapRenderer.getParams = function (point, mapProvider)
  {
    var tooltip = DvtGeographicMapRenderer.getTooltip(point);
    var source = DvtGeographicMapRenderer.getSource(point, mapProvider);
    var sourceHover = DvtGeographicMapRenderer.getSourceHover(point, mapProvider);
    var sourceSelected = DvtGeographicMapRenderer.getSourceSelected(point, mapProvider);
    var sourceHoverSelected = DvtGeographicMapRenderer.getSourceHoverSelected(point, mapProvider);
    var rowKey = point['_rowKey'];
    var clientId = point['clientId'];
    var params = {};

    params['label'] = point['label'];
    params['labelPosition'] = point['labelPosition'];
    params['labelStyle'] = point['labelStyle'];
    params['width'] = point['width'] || 32;
    params['height'] = point['height'] || 32;
    params['scaleX'] = point['scaleX'] || 1;
    params['scaleY'] = point['scaleY'] || 1;
    params['rotation'] = point['rotation'] || 0;
    params['opacity'] = point['opacity'] || 1;
    params['source'] = source;
    params['sourceHover'] = sourceHover;
    params['sourceSelected'] = sourceSelected;
    params['sourceHoverSelected'] = sourceHoverSelected;
    params['tooltip'] = tooltip;
    if (point['action'])
      params['action'] = point['action'];
    params['rowKey'] = rowKey;
    params['clientId'] = clientId;
    return params;
  };

  /**
   * Get dataSelection mode
   * @param {object} dataLayer The dataLayer
   * @return {string} The selection mode
   */
  DvtGeographicMapRenderer.getSelMode = function (dataLayer)
  {
    var selMode = DvtGeographicMapRenderer.SEL_NONE;
    if (dataLayer['dataSelection'])
      selMode = dataLayer['dataSelection'];

    return selMode;
  };

  /**
   * Get marker tooltip
   * @param {object} point
   * @return {string} The tooltip
   */
  DvtGeographicMapRenderer.getTooltip = function (point)
  {
    var tooltip = null;
    if (point['shortDesc'])
      tooltip = point['shortDesc'];
    return tooltip;
  };

  /**
   * Get marker source URL
   * @param {object} point
   * @param {string} mapProvider The map provider
   * @return {string} The source URL
   */
  DvtGeographicMapRenderer.getSource = function (point, mapProvider)
  {
    var source;
    if (point['source'])
      source = point['source'];
    else
    {
      if (mapProvider == DvtGeographicMap.MAP_PROVIDER_ORACLE)
      {
        source = DvtGeographicMapRenderer.DEFAULT_ORACLE_MARKER_IMG;
      }
      else if (mapProvider == DvtGeographicMap.MAP_PROVIDER_GOOGLE)
      {
        source = DvtGeographicMapRenderer.DEFAULT_GOOGLE_MARKER_IMG;
      }
    }
    return source;
  };

  /**
   * Get marker sourceSelected URL
   * @param {object} point
   * @param {string} mapProvider The map provider
   * @return {string} The sourceSelected URL
   */
  DvtGeographicMapRenderer.getSourceSelected = function (point, mapProvider)
  {
    var sourceSelected;
    if (point['sourceSelected'])
      sourceSelected = point['sourceSelected'];
    else
    {
      if (mapProvider == DvtGeographicMap.MAP_PROVIDER_ORACLE)
      {
        sourceSelected = DvtGeographicMapRenderer.DEFAULT_ORACLE_MARKER_SELECT_IMG;
      }
      else if (mapProvider == DvtGeographicMap.MAP_PROVIDER_GOOGLE)
      {
        sourceSelected = DvtGeographicMapRenderer.DEFAULT_GOOGLE_MARKER_SELECT_IMG;
      }
    }
    return sourceSelected;
  };

  /**
   * Get marker sourceHover URL
   * @param {object} point
   * @param {string} mapProvider The map provider
   * @return {string} The sourceHover URL
   */
  DvtGeographicMapRenderer.getSourceHover = function (point, mapProvider)
  {
    var sourceHover;
    if (point['sourceHover'])
      sourceHover = point['sourceHover'];
    else
    {
      if (mapProvider == DvtGeographicMap.MAP_PROVIDER_ORACLE)
      {
        sourceHover = DvtGeographicMapRenderer.DEFAULT_ORACLE_MARKER_HOVER_IMG;
      }
      else if (mapProvider == DvtGeographicMap.MAP_PROVIDER_GOOGLE)
      {
        sourceHover = DvtGeographicMapRenderer.DEFAULT_GOOGLE_MARKER_HOVER_IMG;
      }
    }
    return sourceHover;
  };

  /**
   * Get marker sourceHoverSelected URL
   * @param {object} point
   * @param {string} mapProvider The map provider
   * @return {string} The sourceHoverSelected URL
   */
  DvtGeographicMapRenderer.getSourceHoverSelected = function (point, mapProvider)
  {
    var sourceHoverSelected;
    if (point['sourceHoverSelected'])
      sourceHoverSelected = point['sourceHoverSelected'];
    else
    {
      if (mapProvider == DvtGeographicMap.MAP_PROVIDER_ORACLE)
      {
        sourceHoverSelected = DvtGeographicMapRenderer.DEFAULT_ORACLE_MARKER_SELECT_IMG;
      }
      else if (mapProvider == DvtGeographicMap.MAP_PROVIDER_GOOGLE)
      {
        sourceHoverSelected = DvtGeographicMapRenderer.DEFAULT_GOOGLE_MARKER_SELECT_IMG;
      }
    }
    return sourceHoverSelected;
  };

  /**
   * Get minimum number
   * @param {number} min
   * @param {number} n
   * @return {number} min
   */
  DvtGeographicMapRenderer.getMin = function (min, n)
  {
    if (min == null || min > n)
      min = n;
    return min;
  };

  /**
   * Get maximum number
   * @param {number} max
   * @param {number} n
   * @return {number} max
   */
  DvtGeographicMapRenderer.getMax = function (max, n)
  {
    if (max == null || max < n)
      max = n;
    return max;
  };

  /**
   * If selection is enabled, returns the initial selection status for a data layer.
   * On first render, returns array of row keys found in the 'selectedRowKeys' property.
   * On re-render, returns the previously selected row keys
   * @private
   * @param {object} map
   * @param {object} dataLayer
   * @param {string} id dataLayer id
   * @return {array} array of selected row keys
   */
  DvtGeographicMapRenderer._getSelectedRowKeys = function (map, dataLayer, id)
  {
    var selMode = DvtGeographicMapRenderer.getSelMode(dataLayer);
    var selectedRowKeys = [];

    // if data selection is off, nothing to do
    if (selMode === DvtGeographicMapRenderer.SEL_SINGLE || selMode === DvtGeographicMapRenderer.SEL_MULTIPLE)
    {
      // first time through, check if there's an initial selection to be set
      if (!map.initialSelectionApplied)
      {
        if (dataLayer['selectedRowKeys'] !== undefined)
        {
          selectedRowKeys = dataLayer['selectedRowKeys'].split(' ');
        }
      }
      else // next time, preserve existing selections
      {
        var selection = map['selection'][id];// selected points for this layer
        if (selection)
        {
          for (var i = 0;i < selection.length;i++)
          {
            selectedRowKeys.push(selection[i]['rowKey']);
          }
          // clear the previous selection as we'll populate a new one
          selection.length = 0;
        }
      }
    }
    return selectedRowKeys;
  };

  /**
   * Checks if the map includes any data layers.
   * @private
   * @param {object} map DvtGeographicMap instance
   * @return {boolean} true if the map includes any data layers, false otherwise
   */
  DvtGeographicMapRenderer._mapIncludesData = function (map)
  {
    var data = map['Data'];

    if (data && data['routes'] && data['routes'].length > 0)
      return true;

    if (!data || !data['dataLayers'] || data['dataLayers'].length == 0)
      return false;

    return true;
  };

  /**
   * Loads javascript by url.
   * @param {string} url javascript url to load
   * @param {object} success callback called on success
   * @param {object} failure callback called on failure
   */
  DvtGeographicMapRenderer.loadJS = function (url, success, failure)
  {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = false;
    script.onload = success;
    script.onerror = failure;
    head.appendChild(script);
  };

  /**
   * Map action event.
   * @param {string} [clientId] The client id associated with this action event.
   * @param {string} [rowKey] The rowKey for the object associated with this event.
   * @param {string} [action] The action name.
   * @class
   * @constructor
   * @export
   */
  var DvtMapActionEvent = function (clientId, rowKey, action)
  {
    this.Init(DvtMapActionEvent.TYPE);
    this._clientId = clientId;
    this._rowKey = rowKey;
    this._action = action;
  };

  adf.mf.internal.dvt.DvtmObject.createSubclass(DvtMapActionEvent, DvtBaseComponentEvent, 'DvtMapActionEvent', 'PRIVATE');
  /**
   * @export
   */
  DvtMapActionEvent.TYPE = 'action';

  /**
   * Returns the clientId associated with this event.
   * @return {string} clientId.
   * @export
   */
  DvtMapActionEvent.prototype.getClientId = function ()
  {
    return this._clientId;
  };

  /**
   * A component level selection event.
   * @param {array} selection The array of currently selected ids for the component.
   * @class
   * @constructor
   * @export
   */
  var DvtGeoMapSelectionEvent = function (selection)
  {
    this.Init(selection);
  };

  adf.mf.internal.dvt.DvtmObject.createSubclass(DvtGeoMapSelectionEvent, DvtBaseComponentEvent, 'DvtGeoMapSelectionEvent');

  /**
   * @export
   */
  DvtGeoMapSelectionEvent.TYPE = 'geoSelection';

  /**
   * @export
   */
  DvtGeoMapSelectionEvent.TYPE_INPUT = 'geoSelectionInput';

  /**
   * @param {array} selection The array of currently selected ids for the component.
   * @param {string} [type] DvtGeoMapSelectionEvent.TYPE if none specified.
   * @override
   */
  DvtGeoMapSelectionEvent.prototype.Init = function (selection, type)
  {
    DvtGeoMapSelectionEvent.superclass.Init.call(this, type ? type : DvtGeoMapSelectionEvent.TYPE);
    this._selection = selection;
  };

  /**
   * Returns the array of currently selected ids for the component.
   * @return {array} The array of currently selected ids for the component.
   * @export
   */
  DvtGeoMapSelectionEvent.prototype.getSelection = function ()
  {
    return this._selection;
  };

  /**
   * Returns the rowKey of the object associated with this event.
   * @return {string} rowKey.
   * @export
   */
  DvtMapActionEvent.prototype.getRowKey = function ()
  {
    return this._rowKey;
  };

  /**
   * Returns the action name.
   * @return {string} action.
   * @export
   */
  DvtMapActionEvent.prototype.getAction = function ()
  {
    return this._action;
  };

  /**
   * Map bounds change event.
   * @param {number} [minX] minimum x bounds coordinate (longitude).
   * @param {number} [minY] minimum y bounds coordinate (latitude).
   * @param {number} [maxX] maximum x bounds coordinate (longitude).
   * @param {number} [maxY] maximum y bounds coordinate (latitude).
   * @param {number} [centerX] x coordinate (longitude) of map center.
   * @param {number} [centerY] y coordinate (latitude) of map center.
   * @param {number} [zoomLevel] zoom level.
   * @class
   * @constructor
   * @export
   */
  var DvtMapBoundsChangeEvent = function (minX, minY, maxX, maxY, centerX, centerY, zoomLevel)
  {
    this.Init(DvtMapBoundsChangeEvent.TYPE);
    this._minX = minX;
    this._minY = minY;
    this._maxX = maxX;
    this._maxY = maxY;
    this._centerX = centerX;
    this._centerY = centerY;
    this._zoomLevel = zoomLevel;
  };

  adf.mf.internal.dvt.DvtmObject.createSubclass(DvtMapBoundsChangeEvent, DvtBaseComponentEvent, 'DvtMapBoundsChangeEvent', 'PRIVATE');

  /**
   * @export
   */
  DvtMapBoundsChangeEvent.TYPE = 'map_bounds_change';

  /**
   * Returns minimum x bounds coordinate (longitude).
   * @return {number} minX
   * @export
   */
  DvtMapBoundsChangeEvent.prototype.getMinX = function ()
  {
    return this._minX;
  };

  /**
   * Returns minimum y bounds coordinate (latitude).
   * @return {number} minY
   * @export
   */
  DvtMapBoundsChangeEvent.prototype.getMinY = function ()
  {
    return this._minY;
  };

  /**
   * Returns maximum x bounds coordinate (longitude).
   * @return {number} maxX
   * @export
   */
  DvtMapBoundsChangeEvent.prototype.getMaxX = function ()
  {
    return this._maxX;
  };

  /**
   * Returns maximum y bounds coordinate (latitude).
   * @return {number} maxY
   * @export
   */
  DvtMapBoundsChangeEvent.prototype.getMaxY = function ()
  {
    return this._maxY;
  };

  /**
   * Returns x coordinate (longitude) of map center.
   * @return {number} centerX
   * @export
   */
  DvtMapBoundsChangeEvent.prototype.getCenterX = function ()
  {
    return this._centerX;
  };

  /**
   * Returns y coordinate (latitude) of map center.
   * @return {number} centerY
   * @export
   */
  DvtMapBoundsChangeEvent.prototype.getCenterY = function ()
  {
    return this._centerY;
  };

  /**
   * Returns current zoom level.
   * @return {number} zoomLevel
   * @export
   */
  DvtMapBoundsChangeEvent.prototype.getZoomLevel = function ()
  {
    return this._zoomLevel;
  };

  /**
   * Map input event.
   * @param {string} [eventId] input event type id (e.g. mousedown, mouseup, click)
   * @param {number} [pointX] x coordinate (longitude) of the event.
   * @param {number} [pointY] y coordinate (latitude) of the event.
   * @class
   * @constructor
   * @export
   */
  var DvtMapInputEvent = function (eventId, pointX, pointY)
  {
    this.Init(DvtMapInputEvent.TYPE);
    this._eventId = eventId;
    this._pointX = pointX;
    this._pointY = pointY;
  };

  adf.mf.internal.dvt.DvtmObject.createSubclass(DvtMapInputEvent, DvtBaseComponentEvent, 'DvtMapInputEvent', 'PRIVATE');

  /**
   * @export
   */
  DvtMapInputEvent.TYPE = 'mapinput';

  /**
   * Returns the event type id -- mousedown, mouseup, or click.
   * @return {string} eventId
   * @export
   */
  DvtMapInputEvent.prototype.getEventId = function ()
  {
    return this._eventId;
  };

  /**
   * Returns x coordinate (longitude).
   * @return {number} pointX
   * @export
   */
  DvtMapInputEvent.prototype.getPointX = function ()
  {
    return this._pointX;
  };

  /**
   * Returns y coordinate (latitude).
   * @return {number} pointY
   * @export
   */
  DvtMapInputEvent.prototype.getPointY = function ()
  {
    return this._pointY;
  };
})();
/* Copyright (c) 2013, 2015, Oracle and/or its affiliates. All rights reserved. */
/*
 *    StandaloneLegendItemRenderer.js
 */
(function ()
{
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;

  /**
   * This renderer provides support for processing of the facets which depends on value attribute.
   */
  var StandaloneLegendItemRenderer = function ()
  {};

  adf.mf.internal.dvt.DvtmObject.createSubclass(StandaloneLegendItemRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.legend.StandaloneLegendItemRenderer');

  StandaloneLegendItemRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = StandaloneLegendItemRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['borderColor'] = {'path' :  'borderColor', 'type' : AttributeProcessor['TEXT']};
    attrs['categories'] = {'path' :  'categories', 'type' : AttributeProcessor['STRINGARRAY']};
    attrs['color'] = {'path' :  'color', 'type' : AttributeProcessor['TEXT']};
    attrs['drilling'] = {'path' : 'drilling', 'type' : AttributeProcessor['ON_OFF']};
    attrs['lineStyle'] = {'path' : 'lineStyle', 'type' : AttributeProcessor['TEXT']};
    attrs['lineWidth'] = {'path' : 'lineWidth', 'type' : AttributeProcessor['TEXT']};
    attrs['markerColor'] = {'path' : 'markerColor', 'type' : AttributeProcessor['TEXT']};
    attrs['markerShape'] = {'path' : 'markerShape', 'type' : AttributeProcessor['TEXT']};
    attrs['pattern'] = {'path' : 'pattern', 'type' : AttributeProcessor['TEXT']};
    attrs['source'] = {'path' : 'source', 'type' : AttributeProcessor['TEXT']};
    attrs['symbolType'] = {'path' : 'symbolType', 'type' : AttributeProcessor['TEXT']};
    attrs['text'] = {'path' : 'text', 'type' : AttributeProcessor['TEXT']};

    return attrs;
  };

  StandaloneLegendItemRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {
    var item = {
      'id' : amxNode.getId()
    };

    StandaloneLegendItemRenderer.superclass.ProcessAttributes.call(this, item, amxNode, context);

    options['items'].push(item);
  };
})();
/* Copyright (c) 2013, 2015, Oracle and/or its affiliates. All rights reserved. */
/*
 *    StandaloneLegendRenderer.js
 */
(function ()
{
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
  var DOMUtils = adf.mf.internal.dvt.DOMUtils;

  /**
   * This renderer provides support for processing of the facets which depends on value attribute.
   */
  var StandaloneLegendRenderer = function ()
  {};

  adf.mf.internal.dvt.DvtmObject.createSubclass(StandaloneLegendRenderer, 'adf.mf.internal.dvt.BaseComponentRenderer', 'adf.mf.internal.dvt.legend.StandaloneLegendRenderer');

  /**
   * @param {String} facetName an optional name of the facet containing the items to be rendered
   * @return object that describes child renderers of the component.
   */
  StandaloneLegendRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if (!this._renderers)
    {
      this._renderers = 
      {
        'legendSection' : {'renderer' : new adf.mf.internal.dvt.legend.StandaloneLegendSectionRenderer()}
      };
    }
    return this._renderers;
  };

  StandaloneLegendRenderer.prototype.GetChildrenNodes = function (amxNode, context)
  {
    return amxNode.getRenderedChildren();
  };

  StandaloneLegendRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = StandaloneLegendRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['rendered'] = {'path' : 'rendered', 'type' : AttributeProcessor['ON_OFF']};
    attrs['drilling'] = {'path' : 'drilling', 'type' : AttributeProcessor['TEXT']};
    attrs['orientation'] = {'path' : 'orientation', 'type' : AttributeProcessor['TEXT']};
    attrs['scrolling'] = {'path' : 'scrolling', 'type' : AttributeProcessor['TEXT']};
    attrs['halign'] = {'path' : 'halign', 'type' : AttributeProcessor['TEXT']};
    attrs['valign'] = {'path' : 'valign', 'type' : AttributeProcessor['TEXT']};
    attrs['titleHalign'] = {'path' : 'titleHalign', 'type' : AttributeProcessor['TEXT']};
    attrs['title'] = {'path' : 'title', 'type' : AttributeProcessor['TEXT']};
    attrs['titleStyle'] = {'path' : 'titleStyle', 'type' : AttributeProcessor['TEXT']};
    attrs['symbolHeight'] = {'path' : 'symbolHeight', 'type' : AttributeProcessor['INTEGER']};
    attrs['symbolWidth'] = {'path' : 'symbolWidth', 'type' : AttributeProcessor['INTEGER']};

    return attrs;
  };

  /**
   * @return object that describes styleClasses of the component.
   */
  StandaloneLegendRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = StandaloneLegendRenderer.superclass.GetStyleClassesDefinition.call(this);

    styleClasses['dvtm-legend'] = [{'path' : 'textStyle', 'type' : StyleProcessor['CSS_TEXT']},{'path' : 'backgroundColor', 'type' : StyleProcessor['BACKGROUND']},{'path' : 'borderColor', 'type' : StyleProcessor['TOP_BORDER_WHEN_WIDTH_GT_0PX']}];
    styleClasses['dvtm-legendTitle'] = {'path' : 'titleStyle', 'type' : StyleProcessor['CSS_TEXT'], 'overwrite' : false};
    styleClasses['dvtm-legendSectionTitle'] = {'path' : 'sectionTitleStyle', 'type' : StyleProcessor['CSS_TEXT']};

    return styleClasses;
  };

  /**
   * Initialize generic options for all chart component.
   */
  StandaloneLegendRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    StandaloneLegendRenderer.superclass.InitComponentOptions.call(this, amxNode, options);
    // create simple legend options with empty section object
    options['sections'] = [];

    var suffix = this.IsRTL() ? '-r' : '';
    options['_resources'] = 
    {
      'closedEnabled' : 'css/images/legend/alta/closed-ena' + suffix + '.png',
      'closedOver' : 'css/images/legend/alta/closed-ovr' + suffix + '.png',
      'closedDown' : 'css/images/legend/alta/closed-dwn' + suffix + '.png',
      'openEnabled' : 'css/images/legend/alta/open-ena' + suffix + '.png',
      'openOver' : 'css/images/legend/alta/open-ovr' + suffix + '.png',
      'openDown' : 'css/images/legend/alta/open-dwn' + suffix + '.png'
    };
  };

  StandaloneLegendRenderer.prototype.updateChildren = function (amxNode, attributeChanges)
  {
    return adf.mf.api.amx.AmxNodeChangeResult['REFRESH'];
  };

  StandaloneLegendRenderer.prototype.getDescendentChangeAction = function (amxNode, changes)
  {
    return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];
  };

  /**
   * Reset options for all chart component.
   */
  StandaloneLegendRenderer.prototype.ResetComponentOptions = function (amxNode, options, attributeChanges, descendentChanges)
  {
    StandaloneLegendRenderer.superclass.ResetComponentOptions.call(this, amxNode, options, attributeChanges, descendentChanges);
    // reset sections
    this.InitComponentOptions(amxNode, options);
  };

  StandaloneLegendRenderer.prototype.GetCustomStyleProperty = function (amxNode)
  {
    return 'CustomLegendStyle';
  };

  StandaloneLegendRenderer.prototype.CreateToolkitComponentInstance = function (context, stageId, callbackObj, callback, amxNode)
  {
    var instance = DvtLegend.newInstance(context, callback, callbackObj);
    context.getStage().addChild(instance);
    return instance;
  };

  /**
   * Function renders instance of the component
   */
  StandaloneLegendRenderer.prototype.RenderComponent = function (instance, width, height, amxNode)
  {
    var data = this.GetDataObject(amxNode);

    instance.render(data, width, height);
  };

  StandaloneLegendRenderer.prototype.GetPreferredSize = function (simpleNode, amxNode, width, height)
  {
    var componentInstance = this.GetComponentInstance(simpleNode, amxNode);
    if (componentInstance.getPreferredSize)
    {
      // find out if there is user defined width and height
      var uh = DOMUtils.parseStyleSize(simpleNode.style.height) || DOMUtils.parseStyleSize(simpleNode.style.height, true);
      var uw = DOMUtils.parseStyleSize(simpleNode.style.width) || DOMUtils.parseStyleSize(simpleNode.style.width, true);
      // get preferred size of the component based on the data and computed
      // dimensions
      if (!uh || !uw)
      {
        // there is no constrain so use maximum space available
        // use 10000 since it is bug number and svg safe
        if (height <= 1)
        {
          height = 10000;
        }
        // same as above
        if (width <= 1)
        {
          width = 10000;
        }
        // preffered size based on the component's data and constrained by the maximum
        // possible width and height
        var size = componentInstance.getPreferredSize(this.GetDataObject(amxNode), width, height);
        // replace size with preffered size in case that there is no user defined size
        width = uw ? null : size['w'];
        height = uh ? null : size['h'];
        // return preferred size
        return { 'w' : width, 'h' : height };
      }
    }
    // in all other cases return null so base width and height should be used instead of the
    // preferred size
    return null;
  };

  /**
   * Function creates callback for the toolkit component which is common for the legent component
   */
  StandaloneLegendRenderer.prototype.CreateComponentCallback = function (amxNode)
  {
    var renderer = this;
    var callbackObject =
    {
      'callback' : function (event, component)
      {
        if (event.getType() === 'dvtDrill')
        {
          var id = event.getId() || null;
          var series = event.getSeries() || null;
          var key = null;
          if (id)
          {
            var stampedNode = renderer.findAmxNode(amxNode, id);
            if (stampedNode)
            {
              key = stampedNode.getStampKey();
            }
          }
          var drillEvent = new adf.mf.api.dvt.ChartDrillEvent(id, key, series, null);
          adf.mf.api.amx.processAmxEvent(amxNode, 'drill', undefined, undefined, drillEvent);
        }
      }
    };
    return callbackObject;
  };

  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'legend', StandaloneLegendRenderer);
})();
/* Copyright (c) 2013, 2015, Oracle and/or its affiliates. All rights reserved. */
/*
 *    StandaloneLegendSectionRenderer.js
 */
(function ()
{
  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;

  /**
   * This renderer provides support for processing of the facets which depends on value attribute.
   */
  var StandaloneLegendSectionRenderer = function ()
  {};

  adf.mf.internal.dvt.DvtmObject.createSubclass(StandaloneLegendSectionRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.legend.StandaloneLegendSectionRenderer');

  StandaloneLegendSectionRenderer.prototype.GetChildrenNodes = function (amxNode, context)
  {
    return amxNode.getRenderedChildren();
  };

  StandaloneLegendSectionRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if (!this._renderers)
    {
      this._renderers =
      {
        'legendItem' :
        {
          'renderer' : new adf.mf.internal.dvt.legend.StandaloneLegendItemRenderer()
        }
      };
    }
    return this._renderers;
  };

  StandaloneLegendSectionRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = StandaloneLegendSectionRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['disclosed'] = {'path' :  'expanded', 'type' : AttributeProcessor['TEXT']};
    attrs['showDisclosure'] = {'path' : 'collapsible', 'type' : AttributeProcessor['TEXT']};
    attrs['title'] = {'path' : 'title', 'type' : AttributeProcessor['TEXT']};
    attrs['titleHalign'] = {'path' : 'titleHalign', 'type' : AttributeProcessor['TEXT']};
    attrs['titleStyle'] = {'path' : 'titleStyle', 'type' : AttributeProcessor['TEXT']};

    return attrs;
  };

  StandaloneLegendSectionRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {
    var section = {
      'items' : []
    };

    StandaloneLegendSectionRenderer.superclass.ProcessAttributes.call(this, section, amxNode, context);

    context['__activeSection'] = section;
  };

  var _timeouts = {};
  var _args = {};

  StandaloneLegendSectionRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {
    var section = context['__activeSection'];
    delete context['__activeSection'];

    var discriminant = amxNode.getAttribute('source');
    if (discriminant)
    {
      var id = amxNode.getParent().getId();
      var mapper = this.CreateMapper(discriminant, section['items']);
      // map initial categories for one discriminant
      var categories = AttributeGroupManager.getSharedCategories(discriminant);
      mapper(categories);
      // add this mapper as an observer for discriminant to get 
      // notification about any changes in categories
      AttributeGroupManager.observeSharedCategories(discriminant, function (cat)
      {
        // categories have changed
        // so legend has to be rerendered
        // but there might be too many 
        // refreshes so setTimeout is used to 
        // filter multiple calls of the markForUpdate
        // function
        var timeout = _timeouts[id];
        if (timeout)
        {
          clearTimeout(timeout);
          delete _timeouts[id];
        }

        if (mapper(cat))
        {
          _args[id] = _args[id] || new adf.mf.api.amx.AmxNodeUpdateArguments();
          _args[id].setAffectedAttribute(amxNode, "_categories");
        }

        _timeouts[id] = setTimeout(function (jid)
        {
            var args = _args[jid]
            delete _timeouts[jid];
            delete _args[jid];

            adf.mf.api.amx.markNodeForUpdate(args);
        }, 100, id);
      });
    }
    else
    {
      StandaloneLegendSectionRenderer.superclass.ProcessChildren.call(this, section, amxNode, context);
    }

    options['sections'].push(section);
  };

  StandaloneLegendSectionRenderer.prototype.CreateMapper = function (discriminant, items)
  {
    return function (cats)
    {
      var oldItems = items;
      var changed = oldItems.length !== (cats && cats.categories ? cats.categories.length : 0);

      items.length = 0;

      if (cats)
      {
        var colors = AttributeGroupManager.getSharedAttribute(discriminant, "palette.color");
        var shapes = AttributeGroupManager.getSharedAttribute(discriminant, "palette.shape");
        var patterns = AttributeGroupManager.getSharedAttribute(discriminant, "palette.pattern");
        var i = 0;
        cats.each(function (index)
        {
          var label = cats.getLabelByIndex(index);
          var value = cats.getValueByIndex(index);
          var text = label || value;
          if (text)
          {
            var color = colors ? colors[index % colors.length] : null;
            var shape = shapes ? shapes[index % shapes.length] : null;
            var pattern = patterns ? patterns[index % patterns.length] : null;

            changed = changed
                     || !oldItems[i]
                    || (oldItems[i]['text'] !== text
                     || oldItems[i]['color'] !== color
                     || oldItems[i]['markerShape'] !== shape
                     || oldItems[i]['pattern'] !== pattern);

            items.push(
            {
              'text' : text,
              'color' : color || null,
              'markerShape' : shape || null,
              'pattern' : pattern || null
            });
            i++;
          }
        });
      }
      return changed;
    };
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    nBox/ArrayItemRenderer.js
 */
(function()
{
  var ArrayItemRenderer = function()
  {};

  adf.mf.internal.dvt.DvtmObject.createSubclass(ArrayItemRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.nbox.ArrayItemRenderer');

  ArrayItemRenderer.prototype.GetArrayName = function()
  {
    return null;
  };

  ArrayItemRenderer.prototype.ProcessAttributes = function(options, markerNode, context)
  {
    if (adf.mf.api.amx.isValueFalse(markerNode.getAttribute ("rendered")))
    {
      return false;
    }
    if (!markerNode.isReadyToRender())
    {
      throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException;
    }
    var arrayName = this.GetArrayName();
    if (!arrayName)
      throw new adf.mf.internal.dvt.exception.DvtmException("ArrayName not specified!");
    if (!options [arrayName])
    {
      options [arrayName] = [];
    }
    var array = options [arrayName];

    var result = this.ProcessArrayItem(options, markerNode, context);
    array.push (result);
    return true;
  };

  ArrayItemRenderer.prototype.ProcessArrayItem = function(options, markerNode, context)
  {
    return {};
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    nBox/NBoxCellRenderer.js
 */
(function() {

  var NBoxCellRenderer = function()
  {
  };

  adf.mf.internal.dvt.DvtmObject.createSubclass(NBoxCellRenderer, 'adf.mf.internal.dvt.nbox.ArrayItemRenderer', 'adf.mf.internal.dvt.nbox.NBoxCellRenderer');

  NBoxCellRenderer.prototype.GetArrayName = function()
  {
    return "cells";
  };

  NBoxCellRenderer.prototype.ProcessArrayItem = function(options, cellNode, context)
  {
    NBoxCellRenderer.superclass.ProcessArrayItem.call(this, options, cellNode, context);
    var cell = {};
   
    if (cellNode.getAttribute("row"))
      cell ['row'] = cellNode.getAttribute("row");
    if (cellNode.getAttribute("column"))
      cell ['column'] = cellNode.getAttribute("column");
    if (cellNode.getAttribute("label")) {
      cell ['label'] = cellNode.getAttribute("label");
 
      if (cellNode.getAttribute("labelHalign")) {
       cell ['labelHalign'] = cellNode.getAttribute("labelHalign");
      }
      if (cellNode.getAttribute("labelStyle")) {
        cell ['labelStyle'] = cellNode.getAttribute("labelStyle");
      }
    }
    if (cellNode.getAttribute("showCount"))
      cell ['showCount'] = "on";
    if (cellNode.getAttribute("showMaximize"))
      cell ['showMaximize'] = "on";
    if (cellNode.getAttribute("background"))
      cell ['style'] = "background-color:" + cellNode.getAttribute("background");
    return cell;
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    nBox/NBoxColumnRenderer.js
 */
(function() {

  var NBoxColumnRenderer = function()
  {
  };

  adf.mf.internal.dvt.DvtmObject.createSubclass(NBoxColumnRenderer, 'adf.mf.internal.dvt.nbox.ArrayItemRenderer', 'adf.mf.internal.dvt.nbox.NBoxColumnRenderer');

  NBoxColumnRenderer.prototype.GetArrayName = function()
  {
    return "columns";
  };

  NBoxColumnRenderer.prototype.ProcessArrayItem = function(options, columnNode, context)
  {
    var column = {};
   
    if (columnNode.getAttribute("value"))
      column ['id'] = columnNode.getAttribute("value");
    if (columnNode.getAttribute("label")) {
      column ['label'] = columnNode.getAttribute("label");
      if (columnNode.getAttribute("labelHalign")) {
       column ['labelHalign'] = columnNode.getAttribute("labelHalign");
      }
      if (columnNode.getAttribute("labelStyle")) {
        columnNode['labelStyle'] = columnNode.getAttribute("labelStyle");
      }
    }
    return column;
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    nBox/NBoxDefaults.js
 */
(function() {

  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.nbox');

  adf.mf.internal.dvt.nbox.DefaultNBoxStyle =
    {
      'styleDefaults':
        {
          // default color palette
          'color': ["#267db3", "#68c182", "#fad55c", "#ed6647", "#8561c8", "#6ddbdb", "#ffb54d", "#e371b2", "#47bdef", "#a2bf39", "#a75dba", "#f7f37b"],
          // default shapes
          'shape': ['circle', 'square', 'plus', 'diamond', 'triangleUp', 'triangleDown', 'human'],
          // default indicator color palette
          'indicatorColor': ["#267db3", "#68c182"],
          // default patterns
          'pattern': ['smallChecker', 'smallCrosshatch', 'smallDiagonalLeft', 'smallDiagonalRight', 'smallDiamond', 'smallTriangle', 'largeChecker', 'largeCrosshatch', 'largeDiagonalLeft', 'largeDiagonalRight', 'largeDiamond', 'largeTriangle']
        }
    };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    nBox/NBoxMarkerRenderer.js
 */
(function() {

  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;


  var NBoxMarkerRenderer = function()
  {
  }

  adf.mf.internal.dvt.DvtmObject.createSubclass(NBoxMarkerRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.nbox.NBoxMarkerRenderer');

  NBoxMarkerRenderer.prototype.ProcessAttributes = function(options, amxNode, context)
  {
    if (!amxNode.getAttribute ("rendered"))
        return;
    var facetName = amxNode.getTag().getParent().getAttribute('name');
    var marker = options ['_currentNode'] [facetName];
    if (!marker) {
      marker = {};
      options ['_currentNode'] [facetName] = marker;
    }

    if (amxNode.getAttribute("color"))
      marker.color = amxNode.getAttribute("color");
    if (amxNode.getAttribute("gradientEffect"))
      marker.gradientEffect = amxNode.getAttribute("gradientEffect");
    if (amxNode.getAttribute("height"))
      marker.height = +amxNode.getAttribute("height");
    if (amxNode.getAttribute("opacity"))
      marker.opacity = amxNode.getAttribute("opacity");
    if (amxNode.getAttribute("scaleX"))
      marker.scaleX = +amxNode.getAttribute("scaleX");
    if (amxNode.getAttribute("scaleY"))
      marker.scaleY = +amxNode.getAttribute("scaleY");
    if (amxNode.getAttribute("shape"))
      marker.shape = amxNode.getAttribute("shape");
    if (amxNode.getAttribute("pattern"))
      marker.shape = amxNode.getAttribute("pattern");
    if (amxNode.getAttribute("source"))
      marker.source = adf.mf.api.amx.buildRelativePath(amxNode.getAttribute("source"));
    if (amxNode.getAttribute("width"))
      marker.width = +amxNode.getAttribute("width");
    
    // resolve attribute groups
    var attributeChildren = amxNode.getChildren();
    for (var i = 0; i < attributeChildren.length; i++) {
      var ag = attributeChildren [i];
      var rendered = ag.getAttribute ('rendered');
      if (rendered) {
        AttributeGroupManager.processAttributeGroup(ag, context.amxNode, context);
        var attrGrp = AttributeGroupManager.findGroupById(context.amxNode, AttributeGroupManager._getAttributeGroupId(ag));
        attrGrp.setCustomParam("_facetName", facetName);
      }
    }
    AttributeGroupManager.registerDataItem(context, marker, null);
    
    return true;
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    nBox/NBoxNodeRenderer.js
 */
(function() {

  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;

  var NBoxNodeRenderer = function()
  {};

  adf.mf.internal.dvt.DvtmObject.createSubclass(NBoxNodeRenderer, 'adf.mf.internal.dvt.nbox.ArrayItemRenderer', 'adf.mf.internal.dvt.nbox.NBoxNodeRenderer');

  NBoxNodeRenderer.prototype.GetArrayName = function()
  {
    return "nodes";
  };

  NBoxNodeRenderer.prototype.ProcessArrayItem = function(options, nodeNode, context)
  {
    var node = {};
    options._currentNode = node;
    if (nodeNode.getAttribute("color"))
      node.color = nodeNode.getAttribute("color");
    if (nodeNode.getAttribute("column"))
      node.column = nodeNode.getAttribute("column");
    node.id = "_" + nodeNode.getId();
    if (nodeNode.getAttribute("label"))
      node.label = nodeNode.getAttribute("label");
      
    if (nodeNode.getAttribute("row"))
      node.row = nodeNode.getAttribute("row");
  
    if (nodeNode.getAttribute("secondaryLabel"))
      node.secondaryLabel = nodeNode.getAttribute("secondaryLabel");
    if (nodeNode.getAttribute("shortDesc"))
      node.shortDesc = nodeNode.getAttribute("shortDesc");
    if (nodeNode.getAttribute("xPercentage"))
      node.xPercentage = nodeNode.getAttribute("xPercentage");
    if (nodeNode.getAttribute("yPercentage"))
      node.yPercentage = nodeNode.getAttribute("yPercentage");

    // resolve attribute groups
    var attributeChildren = nodeNode.getChildren();
    for (var i = 0; i < attributeChildren.length; i++) {
      var ag = attributeChildren [i];
      var rendered = ag.getAttribute ('rendered');
      if (rendered)
        AttributeGroupManager.processAttributeGroup(ag, context.amxNode, context);
    }
    AttributeGroupManager.registerDataItem(context, node, null);

    if (nodeNode.isAttributeDefined('action'))
    {
      node['action'] = nodeNode.getId(); // context['_rowKey'];
    }
    else
    {
      var actionTags;
      var firesAction = false;
      // should fire action, if there are any 'setPropertyListener' or 'showPopupBehavior' child tags
      actionTags = nodeNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'setPropertyListener');
      if (actionTags.length > 0)
        firesAction = true;
      else
      {
        actionTags = nodeNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'showPopupBehavior');
        if (actionTags.length > 0)
          firesAction = true;
      }
      if (firesAction)
      {
        // need to set 'action' to some value to make the event fire
        node['action'] = nodeNode.getId();  // context['_rowKey'];
      }
    }
    
    return node;
  };


  /**
   * @param facetName name of the facet for which the map of the renderers is requested
   * @return map of the child renderers for given facetName
   */
  NBoxNodeRenderer.prototype.GetChildRenderers = function(facetName)
  {
    if (this._renderers === undefined)
    {
      this._renderers =
        {
          'marker': {'renderer': new adf.mf.internal.dvt.nbox.NBoxMarkerRenderer()}
        };
    }
    return this._renderers;
  };

  /**
   * Returns array of used facet names.
   * 
   * @returns {Array.<string>} supported facet's names
   */
  NBoxNodeRenderer.prototype.GetFacetNames = function()
  {
    return ['icon', 'indicator'];
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    nBox/NBoxRenderer.js
 */
(function ()
{

  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;

  var NBoxRenderer = function ()
  {};

  adf.mf.internal.dvt.DvtmObject.createSubclass(NBoxRenderer, 'adf.mf.internal.dvt.DataStampRenderer', 'adf.mf.internal.dvt.nbox.NBoxRenderer');

  /**
   * Returns array of used facet names.
   *
   * @returns {Array.<string>} supported facet's names
   */
  NBoxRenderer.prototype.GetFacetNames = function ()
  {
    return ["rows", "columns", "cells"];
  };

  // render ..................................................................
  NBoxRenderer.prototype.GetDefaultStyles = function (amxNode)
  {
    return adf.mf.internal.dvt.nbox.DefaultNBoxStyle;
  };

  /**
   * Merge default and custom options
   */
  NBoxRenderer.prototype.MergeComponentOptions = function (amxNode, options)
  {
    options = NBoxRenderer.superclass.MergeComponentOptions.call(this, amxNode, options);

    // add default colors, shapes... to amxNode
    var styleDefaults = options['styleDefaults'];
    if (styleDefaults && styleDefaults['color'])
    {
      amxNode['_defaultColors'] = styleDefaults['color'];
    }
    if (styleDefaults && styleDefaults['indicatorColor'])
    {
      amxNode['_indicatorColor'] = styleDefaults['indicatorColor'];
    }
    if (styleDefaults && styleDefaults['shape'])
    {
      amxNode['_defaultShapes'] = styleDefaults['shape'];
    }
    if (styleDefaults && styleDefaults['pattern'])
    {
      amxNode['_defaultPatterns'] = styleDefaults['pattern'];
    }
    return options;
  }

  /**
   * @param facetName name of the facet for which the map of the renderers is requested
   * @return map of the child renderers for given facetName
   */
  NBoxRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if (this._renderers === undefined)
    {
      this._renderers = 
      {
        'nBoxRow' : 
        {
          'renderer' : new adf.mf.internal.dvt.nbox.NBoxRowRenderer()
        },
        // HACK facet renderrers are registerred as top level renderrers
        // because facet renderrers are ignored in 
        'nBoxColumn' : 
        {
          'renderer' : new adf.mf.internal.dvt.nbox.NBoxColumnRenderer()
        },
        'nBoxCell' : 
        {
          'renderer' : new adf.mf.internal.dvt.nbox.NBoxCellRenderer()
        },
        'nBoxNode' : 
        {
          'renderer' : new adf.mf.internal.dvt.nbox.NBoxNodeRenderer()
        }
      }
    }

    return this._renderers;
  };

  NBoxRenderer.prototype.GetCustomStyleProperty = function (amxNode)
  {
    return 'CustomNBoxStyle';
  };

  /**
   * @return object that describes styleClasses of the component.
   */
  NBoxRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = NBoxRenderer.superclass.GetStyleClassesDefinition.call(this);

    styleClasses['dvtm-nBox-cell'] = [{'path' : '_cell_border', 'type' : BORDER},{'path' : '_cell_backgroundColor', 'type' : StyleProcessor['BACKGROUND']}];
    styleClasses['dvtm-nBox-cell-label'] = [{'path' : '_cell_label', 'type' : StyleProcessor['CSS_TEXT']}/*{'path' : '_cell_label_align', 'type' : TEXT_ALIGN}*/];
    styleClasses['dvtm-nBox-column-label'] = [{'path' : '_column_label', 'type' : StyleProcessor['CSS_TEXT']}/*{'path' : '_cell_label_align', 'type' : TEXT_ALIGN}*/];
    styleClasses['dvtm-nBox-row-label'] = [{'path' : '_row_label', 'type' : StyleProcessor['CSS_TEXT']}/*{'path' : '_cell_label_align', 'type' : TEXT_ALIGN}*/];
    styleClasses['dvtm-nBox-columns-title'] = [{'path' : 'styleDefaults/columnLabelStyle', 'type' : StyleProcessor['CSS_TEXT']}];
    styleClasses['dvtm-nBox-rows-title'] = [{'path' : 'styleDefaults/rowLabelStyle', 'type' : StyleProcessor['CSS_TEXT']}];

    return styleClasses;
  };

  NBoxRenderer.prototype.ProcessStyleClasses = function (node, amxNode)
  {
    NBoxRenderer.superclass.ProcessStyleClasses.call(this, node, amxNode);
    var options = this.GetDataObject(amxNode);

    var cells = options['cells'];
    if (cells)
    {
      for (var i = 0;i < cells.length;i++)
      {
        var cell = cells[i];

        if (options['_cell_backgroundColor'])
        {
          if (!cell['style'])
          {
            cell['style'] = "background-color:" + options['_cell_backgroundColor'];
          } 
        }
        if (options['_cell_border'])
        {
          if (cell['style'])
          {
            cell['style'] = "border:" + options['_cell_border'] + ';' + cell['style'];
          }
          else 
            cell['style'] = "border:" + options['_cell_border'];
        }
        var cellLabel = cell['label'];
        if (cellLabel)
        {
          if (options['_cell_label'])
          {
            if (cellLabel['style'])
            {
              cellLabel['style'] = options['_cell_label'] + ';' + cellLabel['style'];
            }
            else 
              cellLabel['style'] = options['_cell_label'];
          }
          if (options['_cell_label_align'])
          {
            cellLabel['halign'] = options['_cell_label_align'];
          }
        }
      }
    }

    var columns = options['columns'];
    if (columns)
    {
      for (var i = 0;i < columns.length;i++)
      {
        var column = columns[i];
        var columnLabel = column['label'];
        if (columnLabel)
        {
          if (options['_column_label'])
          {
            if (columnLabel['style'])
            {
              columnLabel['style'] = options['_column_label'] + ';' + columnLabel['style'];
            }
            else 
              columnLabel['style'] = options['_column_label'];
          }
        }
      }
    }

    var rows = options['rows'];
    if (rows)
    {
      for (var i = 0;i < rows.length;i++)
      {
        var row = rows[i];
        var rowLabel = row['label'];
        if (rowLabel)
        {
          if (options['_row_label'])
          {
            if (rowLabel['style'])
            {
              rowLabel['style'] = options['_row_label'] + ';' + rowLabel['style'];
            }
            else 
              rowLabel['style'] = options['_row_label'];
          }
        }
      }
    }

    delete options['_cell_backgroundColor'];
    delete options['_cell_border'];
    delete options['_cell_label'];
    delete options['_column_label'];
  };

  /**
   * Initialize generic options for all chart component.
   */
  NBoxRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    NBoxRenderer.superclass.InitComponentOptions.call(this, amxNode, options);

    AttributeGroupManager.reset(amxNode);
  };

  NBoxRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = NBoxRenderer.superclass.GetAttributesDefinition.call(this);
    attrs['animationOnDataChange'] = {'path' : 'animationOnDataChange', 'type' : AttributeProcessor['TEXT']};
    attrs['animationOnDisplay'] = {'path' : 'animationOnDisplay', 'type' : AttributeProcessor['TEXT']};
    attrs['columnsTitle'] = {'path' : 'columnsTitle', 'type' : AttributeProcessor['TEXT']};
    attrs['emptyText'] = {'path' : 'emptyText', 'type' : AttributeProcessor['TEXT']};
    attrs['groupBy'] = 
    {
      'path' : 'groupBy', 'type' : PROP_TEXT_ARRAY
    };
    attrs['groupBehavior'] = 
    {
      'path' : 'groupBehavior', 'type' : PROP_TEXT
    };
    attrs['highlightedRowKeys'] = 
    {
      'path' : 'highlightedItems', 'type' : PROP_ROW_KEYS
    };
    attrs['legendDisplay'] = 
    {
      'path' : 'legendDisplay', 'type' : PROP_TEXT
    };
    attrs['maximizedColumn'] = 
    {
      'path' : 'maximizedColumn', 'type' : PROP_TEXT
    };
    attrs['maximizedRow'] = 
    {
      'path' : 'maximizedRow', 'type' : PROP_TEXT
    };
    attrs['nodeSelection'] = 
    {
      'path' : 'selectionMode', 'type' : PROP_TEXT
    };
    attrs['otherThreshold'] = 
    {
      'path' : 'otherThreshold', 'type' : PROP_TEXT
    };
    attrs['rowsTitle'] = 
    {
      'path' : 'rowsTitle', 'type' : AttributeProcessor['TEXT']
    };

    return attrs;
  };

  NBoxRenderer.prototype.updateChildren = function (amxNode, attributeChanges)
  {
    var state = NBoxRenderer.superclass.updateChildren.call(this, amxNode, attributeChanges);
    if (attributeChanges.hasChanged('selectedRowKeys'))
    {
      // discard all user changes to the selection to allow newly defined selectedRowKeys to be processed
      amxNode.setAttributeResolvedValue('_selection', null);
      // in case that the result of superclass call is none than force refresh
      // in case that it is rerender or replace we are keeping original
      // state
      if (state < adf.mf.api.amx.AmxNodeChangeResult['REFRESH'])
      {
        state = adf.mf.api.amx.AmxNodeChangeResult['REFRESH'];
      }
    }
    return state;
  };

  NBoxRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {
    var changed = NBoxRenderer.superclass.ProcessAttributes.call(this, options, amxNode, context);
    
    if (amxNode.isAttributeDefined('selectedRowKeys') && ((typeof options['selection'] == undefined) || (!options['selection'])))
    {
      var _selection = [];
      var selection = AttributeProcessor['ROWKEYARRAY'](amxNode.getAttribute('selectedRowKeys'));
      for (i = 0;i < selection.length;i++)
      {
        var dataForRowKey = amxNode.getChildren(null, selection[i]);
        if ((Object.prototype.toString.call(dataForRowKey) === '[object Array]') && (dataForRowKey.length > 0))
        {
          _selection.push(dataForRowKey[0].getId());
        }
      }
      options['selection'] = codeIDs(_selection);
      amxNode.setAttributeResolvedValue("_selection", _selection);
    }

    return changed;
  };

  /**
   * Function extends parent function with processing of the stamped children.
   * After all childs are processed parent function is called to resolve simple children nodes.
   */
  NBoxRenderer.prototype.ProcessStampedChildren = function (options, amxNode, context)
  {
    AttributeGroupManager.init(context);

    var changed = NBoxRenderer.superclass.ProcessStampedChildren.call(this, options, amxNode, context);

    if (!options["nodes"])
      options["nodes"] = [];
    delete options['_currentNode'];
    var config = new adf.mf.internal.dvt.common.attributeGroup.AttributeGroupConfig();
    config.setUpdateCategoriesCallback(function (attrGrp, dataItem, valueIndex, exceptionRules)
    {
      if (!dataItem['categories'])
        dataItem['categories'] = [];
      var categories = dataItem['categories'];

      if (attrGrp.isContinuous())
      {
        categories.push(attrGrp.getId() + ":" + valueIndex);
      }
      else 
      {
        categories.push(attrGrp.getId() + ":" + attrGrp.getCategoryValue(valueIndex));
      }

      var rules = exceptionRules.getRules();
      for (var i = 0; i < rules.length; i++)
      {
        categories.push(attrGrp.getId() + ":" + rules[i]['value']);
      }
    });
    config.addTypeToDefaultPaletteMapping('indicatorColor', 'color');
    config.addTypeToLegendAttributeMapping('indicatorColor', 'color');
    config.setLegendTypeCallback(function (type, legendAttributeName, attrGrp)
    {
      var facetName = attrGrp.getCustomParam("_facetName");
      if (facetName)
      {
        if (type === 'color')
          type = facetName + 'Fill';
        else if (type === 'shape')
          type = facetName + 'Shape';
        else if (type === 'pattern')
          type = facetName + 'Pattern';
      }
      return type;
    });
    AttributeGroupManager.applyAttributeGroups(amxNode, config, context);

    AttributeGroupManager.addDescriptions(amxNode, context, options, 'attributeGroups');

    return changed;
  };

  NBoxRenderer.prototype.CreateComponentCallback = function (amxNode)
  {
    var renderer = this;
    
    var callbackObject = 
    {
      'callback' : function (event, component)
      {
        var type = event.getType();
        if (type === DvtSelectionEvent.TYPE)
        {
          var selection = event.getSelection();
          var rkMapper = function(item)
          {
            return item.getStampKey();
          };
          var ids = decodeIDs (selection);
          var selectedRowKeys = renderer.findAllAmxNodes(amxNode, ids).map(rkMapper);
          var userSelection = amxNode.getAttribute("_selection") || [];
          userSelection = renderer.findAllAmxNodes(amxNode, userSelection).map(rkMapper);
          // filter all removed keys
          var removedKeys = renderer.filterArray(userSelection, function(key)
          {
            return selectedRowKeys.indexOf(key) === -1;
          });

          amxNode.setAttributeResolvedValue("_selection", ids);
          // fire the selectionChange event
          var se = new adf.mf.api.amx.SelectionEvent(removedKeys, selectedRowKeys);
          adf.mf.api.amx.processAmxEvent(amxNode, 'selection', undefined, undefined, se, null);
        }
        if (type === DvtActionEvent.TYPE)
        {
          var commandId = event.getCommandId();
          var itemNode = renderer.findAmxNode(amxNode, commandId);

          if (itemNode)
          {
            // fire ActionEvent and then process the 'action' attribute
            var ae = new adf.mf.api.amx.ActionEvent();
            adf.mf.api.amx.processAmxEvent(itemNode, 'action', undefined, undefined, ae,
              function ()
              {
                var action = itemNode.getAttributeExpression("action", true);
                if (action != null)
                {
                  adf.mf.api.amx.doNavigation(action);
                }
              });
          }
        }
      }
    };

    return callbackObject;
  };

  NBoxRenderer.prototype.CreateToolkitComponentInstance = function (context, stageId, callbackObj, callback, amxNode)
  {
    var instance = DvtNBox.newInstance(context, callback, callbackObj, null);
    context.getStage().addChild(instance);
    return instance;
  };

  /**
   * Function renders instance of the component
   */
  NBoxRenderer.prototype.RenderComponent = function (instance, width, height, amxNode)
  {
    var data = null;
    if (this.IsOptionsDirty(amxNode))
    {
      data = this.GetDataObject(amxNode);
      if (adf.mf.environment.profile.dtMode)
      {
        if (!data.rows || data.rows.length < 1)
        {
          data.rows = [{id : "low"},{id : "medium"},{id : "high"}];
        }
        if (!data.columns || data.columns.length < 1)
        {
          data.columns = [{id : "low"},{id : "medium"},{id : "high"}];
        }
        if (!data.nodes || data.nodes.length < 1)
        {
          data.nodes = [{row : "low", column : "low"}];
        }
      }
      if (!data['_resources'])
      {
        data['_resources'] = 
        {
          "overflow_dwn" : 
          {
            "height" : 9, "width" : 34, "src" : "css/images/nBox/alta/overflow_dwn.png"
          },
          "close_dwn" : 
          {
            "height" : 16, "width" : 16, "src" : "css/images/nBox/alta/close_dwn.png"
          },
          "overflow_ena" : 
          {
            "height" : 9, "width" : 34, "src" : "css/images/nBox/alta/overflow_ena.png"
          },
          "close_ena" : 
          {
            "height" : 16, "width" : 16, "src" : "css/images/nBox/alta/close_ena.png"
          },
          "overflow_ovr" : 
          {
            "height" : 9, "width" : 34, "src" : "css/images/nBox/alta/overflow_ovr.png"
          },
          "close_ovr" : 
          {
            "height" : 16, "width" : 16, "src" : "css/images/nBox/alta/close_ovr.png"
          },
          "overflow_dis" : 
          {
            "height" : 9, "width" : 34, "src" : "css/images/nBox/alta/overflow_dis.png"
          },
          "legend_dwn" : 
          {
            "height" : 24, "width" : 24, "src" : "css/images/panelDrawer/panelDrawer-legend-dwn.png"
          },
          "legend_ena" : 
          {
            "height" : 24, "width" : 24, "src" : "css/images/panelDrawer/panelDrawer-legend-ena.png"
          },
          "legend_ovr" : 
          {
            "height" : 24, "width" : 24, "src" : "css/images/panelDrawer/panelDrawer-legend-ovr.png"
          }
        };
      }
      if (!data['attributeGroups'] || !data['attributeGroups'].length)
      {
        data['legendDisplay'] = 'off';
      }
    }
    instance.render(data, width, height);
  };

  // render ..................................................................
  NBoxRenderer.prototype.ResetComponentOptions = function (amxNode, options, attributeChanges, descendentChanges)
  {
    NBoxRenderer.superclass.ResetComponentOptions.call(this, amxNode, options, attributeChanges, descendentChanges);
    if (options)
    {
      delete options["cells"];
      delete options["columns"];
      delete options["rows"];
      
      if (!attributeChanges || attributeChanges.hasChanged('value') || descendentChanges)
      {
        delete options["nodes"];
      }
    }

    var selection = amxNode.getAttribute('_selection');
    if (selection !== undefined)
    {
      options['selection'] = codeIDs(selection);
    }

    AttributeGroupManager.reset(amxNode);
  };

  NBoxRenderer.prototype.PreventsSwipe = function (amxNode)
  {
    // NBox should not prevent swipe at the moment
    return false;
  };

  // property readers ........................................................
  var PROP_TEXT = function (value)
  {
    if (value !== null && value !== "")
    {
      return '' + value;
    }
    return undefined;
  };
  var PROP_TEXT_ARRAY = function (value)
  {
    if (value !== null && value !== "")
    {
      return ('' + value).split(" ");
    }
    return undefined;
  };
  var PROP_ROW_KEYS = function (value)
  {
    var array = AttributeProcessor['ROWKEYARRAY'](value);
    if (array.length > 0)
    {
      var items = [];
      for (var i = 0;i < array.length;i++)
      {
        items.push(
        {
          'id' : array[i]
        });
      }
      return items;
    }
    return undefined;
  };

  var BORDER = function (node, styleString)
  {
    var nodeStyle = window.getComputedStyle(node, null);
    if (nodeStyle.getPropertyValue('border-top-style').indexOf('none') >= 0)
      return null;
    if (nodeStyle.getPropertyValue('border-top-width').indexOf('0') >= 0)
      return null;
    var border = nodeStyle.getPropertyValue('border-top-width') + " " + nodeStyle.getPropertyValue('border-top-style') + " " + nodeStyle.getPropertyValue('border-top-color');
    return border;
  };
  
  function codeIDs (ids) {
    if (!ids) return ids;
    var result = []
    for (var i = 0; i < ids.length; i++)
      result.push ('_' + ids [i]);
    return result;
  }
  
  function decodeIDs (ids) {
    if (!ids) return ids;
    var result = []
    for (var i = 0; i < ids.length; i++)
      result.push (ids [i].substring (1));
    return result;
  }

  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'nBox', NBoxRenderer);
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    nBox/NBoxRowRenderer.js
 */
(function() {

  var NBoxRowRenderer = function()
  {
  }

  adf.mf.internal.dvt.DvtmObject.createSubclass(NBoxRowRenderer, 'adf.mf.internal.dvt.nbox.ArrayItemRenderer', 'adf.mf.internal.dvt.nbox.NBoxRowRenderer');

  NBoxRowRenderer.prototype.GetArrayName = function()
  {
    return "rows";
  };

  NBoxRowRenderer.prototype.ProcessArrayItem = function(options, rowNode, context)
  {
    var row = {};
   
    if (rowNode.getAttribute("value"))
      row ['id'] = rowNode.getAttribute("value");
    if (rowNode.getAttribute("label")) {
      row ['label'] = rowNode.getAttribute("label");
      if (rowNode.getAttribute("labelHalign")) {
       row ['labelHalign'] = rowNode.getAttribute("labelHalign");
      }
      if (rowNode.getAttribute("labelStyle")) {
        row['labelStyle'] = rowNode.getAttribute("labelStyle");
      }
    }
    return row;
  };
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    thematicMap/ThematicMapDefaults.js
 */
(function(){

  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.thematicmap');
  
  adf.mf.internal.dvt.thematicmap.DefaultThematicMapStyle = 
  {
    // marker properties
    'marker': 
    {
      // separator upper color
      'scaleX': 1.0,
      // separator lower color
      'scaleY': 1.0,
      // should display title separator
      'type': 'circle'
    },

    // thematic map legend properties
    'legend': 
    {
      // legend position none / auto / start / end / top / bottom
      'position': "auto",
      'rendered': true
    },
    
    // default style values - WILL BE DELETED AND NOT PASSED TO TOOLKIT
    'styleDefaults': {
      // default color palette
      'colors': ["#003366", "#CC3300", "#666699", "#006666", "#FF9900", "#993366", "#99CC33", "#624390", "#669933",
                 "#FFCC33", "#006699", "#EBEA79"],               
      // default marker shapes
      'shapes' : [ 'circle', 'square', 'plus', 'diamond', 'triangleUp', 'triangleDown', 'human']
    }
  };
  
  adf.mf.internal.dvt.thematicmap.DefaultThematicMapStyleAlta = 
  {
    // marker properties
    'marker': 
    {
      // separator upper color
      'scaleX': 1.0,
      // separator lower color
      'scaleY': 1.0,
      // should display title separator
      'type': 'circle'
    },

    // thematic map legend properties
    'legend': 
    {
      // legend position none / auto / start / end / top / bottom
      'position': "auto",
      'rendered': true
    },
    
    // default style values - WILL BE DELETED AND NOT PASSED TO TOOLKIT
    'styleDefaults': {
      // default color palette
      'colors': ["#267db3", "#68c182", "#fad55c", "#ed6647", "#8561c8", "#6ddbdb", "#ffb54d", "#e371b2", "#47bdef", "#a2bf39", "#a75dba", "#f7f37b"],
      // default marker shapes
      'shapes' : [ 'circle', 'square', 'plus', 'diamond', 'triangleUp', 'triangleDown', 'human']
    }
  };
  /**
   * contains information about top layer for each basemap
   */
  adf.mf.internal.dvt.thematicmap.THEMATICMAP_DEFAULT_TOP_LAYER_MAPPING = 
  {
    'world' : 'continents', 
    'worldRegions' : 'regions', 
    'usa' : 'country', 
    'africa' : 'continent', 
    'asia' : 'continent', 
    'australia' : 'continent', 
    'europe' : 'continent', 
    'northAmerica' : 'continent', 
    'southAmerica' : 'continent', 
    'apac' : 'region', 
    'emea' : 'region', 
    'latinAmerica' : 'region', 
    'usaAndCanada' : 'region'
  };


})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    thematicMap/ThematicMapRenderer.js
 */
(function()
{
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
  var LegendRenderer = adf.mf.internal.dvt.common.legend.LegendRenderer;
  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;

  var loadedCustomBasemaps = {};

  var ThematicMapRenderer = function ()
  { };

  adf.mf.internal.dvt.DvtmObject.createSubclass(ThematicMapRenderer, 'adf.mf.internal.dvt.BaseComponentRenderer', 'adf.mf.internal.dvt.thematicmap.ThematicMapRenderer');
  
  ThematicMapRenderer.prototype.PreventsSwipe = function (amxNode)
  {
    if ((amxNode.isAttributeDefined('zooming') && amxNode.isAttributeDefined('zooming') !== 'none')
     || (amxNode.isAttributeDefined('panning') && amxNode.isAttributeDefined('panning') !== 'none'))
    {
      return true;
    }
    return false;
  };

  ThematicMapRenderer.prototype.__isReadyToRender = function(amxNode)
  {
    var ready = true;
    if (amxNode.getAttribute("_baseMap") === "loading")
    {
      return false;
    }

    amxNode.visitChildren(new adf.mf.api.amx.VisitContext(), function (visitContext, anode)
    {
      if (anode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(anode.getAttribute('rendered')))
      {
        return adf.mf.api.amx.VisitResult['COMPLETE'];
      }

      if (anode.getTag().getName() === "pointDataLayer" || anode.getTag().getName() === "areaDataLayer")
      {
        if (anode.isAttributeDefined("value"))
        {
          var items = anode.getAttribute("value");
          if (items === undefined)
          {
            ready = false;
            return adf.mf.api.amx.VisitResult['COMPLETE'];
          }

          if (items && items.treeNodeBindings)
          {
            var iter = adf.mf.api.amx.createIterator(items);
            if (iter.getTotalCount() > iter.getAvailableCount())
            {
              ready = false;
              return adf.mf.api.amx.VisitResult['COMPLETE'];
            }
          }
        }

        return adf.mf.api.amx.VisitResult['REJECT'];
      }

      return adf.mf.api.amx.VisitResult['ACCEPT'];
    });

    return ready;
  };

  ThematicMapRenderer.prototype.render = function (amxNode, id)
  {
    var rootElement = ThematicMapRenderer.superclass.render.call(this, amxNode, id);

    if (this.__isReadyToRender(amxNode) === false)
    {
      var placeholder = document.createElement("div");
      placeholder.id = id + "_placeholder";
      placeholder.className = "dvtm-component-placeholder amx-deferred-loading";
      var msgLoading = adf.mf.resource.getInfoString("AMXInfoBundle", "MSG_LOADING");
      placeholder.setAttribute("aria-label", msgLoading);
      rootElement.appendChild(placeholder);
    }

    return rootElement;
  };

  ThematicMapRenderer.prototype.postDisplay = function (rootElement, amxNode)
  {
    if (this.__isReadyToRender(amxNode) === false)
    {
      if (this.IsAncestor(document.body, rootElement))
      {
        this.GetComponentDimensions(rootElement, amxNode);
      }
      return; // this function is not applicable for placeholders
    }

    var placeholder = document.getElementById(amxNode.getId() + "_placeholder");
    if (placeholder)
    {
      placeholder.parentNode.removeChild(placeholder);
    }

    ThematicMapRenderer.superclass.postDisplay.call(this, rootElement, amxNode);
  };
  
  ThematicMapRenderer.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    if (this.__isReadyToRender(amxNode) === false)
    {
      return; // this function is not applicable for placeholders
    }

    var placeholder = document.getElementById(amxNode.getId() + "_placeholder");
    if (placeholder)
    {
      placeholder.parentNode.removeChild(placeholder);
    }

    /* BUG 17458279: Check if we have some descendent changes available. If so, then use them and drop them. */
    if ((descendentChanges === undefined) && (amxNode["_pendingDescendentChanges"] !== undefined))
    {
      descendentChanges = amxNode["_pendingDescendentChanges"];
    }
    delete amxNode["_pendingDescendentChanges"];
    // recover all the information about attribute changes before bulkLoadProvider
    if (amxNode["_pendingAttributeChanges"])
    {
      attributeChanges = amxNode["_pendingAttributeChanges"];
      delete amxNode["_pendingAttributeChanges"];
    }

    ThematicMapRenderer.superclass.refresh.call(this, amxNode, attributeChanges, descendentChanges);
  };

  /**
   * processes the components's child tags
   */
  ThematicMapRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if (this._renderers === undefined)
    {
      if (adf.mf.environment.profile.dtMode)
      {
        this._renderers =
          {
            'areaLayer' : { 'renderer' : new adf.mf.internal.dvt.common.layer.AreaLayerRendererDT() }
          };
      }
      else
      {
        this._renderers =
          {
            'areaLayer' : { 'renderer' : new adf.mf.internal.dvt.common.layer.AreaLayerRenderer(), 'order' : 1 },
            'pointDataLayer' : { 'renderer' : new adf.mf.internal.dvt.common.layer.PointDataLayerRenderer(), 'order' : 2 },
            'legend' : { 'renderer' : new LegendRenderer(), 'order' : 3, 'maxOccurrences' : 1 }
          };
      }
    }
    return this._renderers;
  };

  ThematicMapRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = ThematicMapRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['animationDuration'] = {'path' : 'animationDuration', 'type' : AttributeProcessor['INTEGER'], 'default' : 1000};
    attrs['animationOnDisplay'] = {'path' : 'animationOnDisplay', 'type' : AttributeProcessor['TEXT'], 'default' : 'none'};
    attrs['animationOnMapChange'] = {'path' : 'animationOnMapChange', 'type' : AttributeProcessor['TEXT'], 'default' : 'none'};
    attrs['initialZooming'] = {'path' : 'initialZooming', 'type' : AttributeProcessor['TEXT'], 'default' : 'none'};
    attrs['markerZoomBehavior'] = {'path' : 'markerZoomBehavior', 'type' : AttributeProcessor['TEXT'], 'default' : 'fixed'};
    attrs['zooming'] = {'path' : 'zooming', 'type' : AttributeProcessor['TEXT'], 'default' : 'none'};
    attrs['panning'] = {'path' : 'panning', 'type' : AttributeProcessor['TEXT'], 'default' : 'none'};
    attrs['basemap'] = {'path' : 'basemap', 'type' : AttributeProcessor['TEXT'], 'default' : 'world'};
    attrs['tooltipDisplay'] = {'path' : 'tooltipDisplay', 'type' : AttributeProcessor['TEXT'], 'default' : 'auto'};

    return attrs;
  };

   /**
   * @return object that describes styleClasses of the component.
   */
  ThematicMapRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = ThematicMapRenderer.superclass.GetStyleClassesDefinition.call(this);

    styleClasses['dvtm-area'] = {'path' : 'styleDefaults/areaStyle', 'type' : [StyleProcessor['CSS_TEXT'], StyleProcessor['CSS_BACK']]};
    styleClasses['_self'] = {'path' : 'styleDefaults/background-color', 'type' : StyleProcessor['BACKGROUND']};
    styleClasses['dvtm-areaLayer'] = {'path' : 'styleDefaults/dataAreaDefaults/borderColor', 'type' : StyleProcessor['BORDER_COLOR']};
    styleClasses['dvtm-areaHover'] = {'path' : 'styleDefaults/dataAreaDefaults/hoverColor', 'type' : StyleProcessor['BORDER_COLOR']};
    styleClasses['dvtm-areaSelected'] = [{'path' : 'styleDefaults/dataAreaDefaults/selectedInnerColor', 'type' : StyleProcessor['BORDER_COLOR_TOP']}, {'path' : 'styleDefaults/dataAreaDefaults/selectedOuterColor', 'type' : StyleProcessor['BORDER_COLOR']}];

    styleClasses['dvtm-legend'] = [{'path' : 'legend/textStyle', 'type' : StyleProcessor['CSS_TEXT']}, {'path' : 'legend/backgroundColor', 'type' : StyleProcessor['BACKGROUND']}, {'path' : 'legend/borderColor', 'type' : StyleProcessor['TOP_BORDER_WHEN_WIDTH_GT_0PX']}];
    styleClasses['dvtm-legendTitle'] = {'path' : 'legend/titleStyle', 'type' : StyleProcessor['CSS_TEXT']};
    styleClasses['dvtm-legendSectionTitle'] = {'path' : 'legend/sectionTitleStyle', 'type' : StyleProcessor['CSS_TEXT']};

    styleClasses['dvtm-marker'] = [
      {'path' : 'styleDefaults/dataMarkerDefaults/labelStyle', 'type' : StyleProcessor['CSS_TEXT']},
      {'path' : 'styleDefaults/dataMarkerDefaults/color', 'type' : StyleProcessor['BACKGROUND']},
      {'path' : 'styleDefaults/dataMarkerDefaults/opacity', 'type' : StyleProcessor['OPACITY']},
      {'path' : 'styleDefaults/dataMarkerDefaults/borderStyle', 'type' : StyleProcessor['BORDER_STYLE']},
      {'path' : 'styleDefaults/dataMarkerDefaults/borderColor', 'type' : StyleProcessor['BORDER_COLOR']},
      {'path' : 'styleDefaults/dataMarkerDefaults/borderWidth', 'type' : StyleProcessor['BOTTOM_BORDER_WIDTH']}
    ];

    return styleClasses;
  };

  ThematicMapRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    ThematicMapRenderer.superclass.InitComponentOptions.call(this, amxNode, options);

    AttributeGroupManager.reset(amxNode);
    amxNode['_stylesResolved'] = false;
    amxNode.setAttributeResolvedValue('__userselection', null);
   
    options['animationDuration'] = 1000;
    options['animationOnDisplay'] = 'none';
    options['animationOnMapChange'] = 'none';
    options['areaLayers'] = [];
    options['basemap'] = {};
    options['initialZooming'] = 'none';
    options['markerZoomBehavior'] = 'fixed';
    options['panning'] = 'none';
    options['pointDataLayers'] = [];
    options['styleDefaults'] = { 'dataAreaDefaults' : {}, 'dataMarkerDefaults' : {} };
    options['tooltipDisplay'] = 'auto';
    options['zooming'] = 'none';
    options['legend'] = {};
  };

  ThematicMapRenderer.prototype.ResetComponentOptions = function (amxNode, options, attributeChanges, descendentChanges)
  {
    ThematicMapRenderer.superclass.ResetComponentOptions.call(this, amxNode, options, attributeChanges, descendentChanges);

    amxNode['_attributeChanges'] = attributeChanges;
    // clear the 'dirty' flag on the options object
    this.SetOptionsDirty(amxNode, false);

    AttributeGroupManager.reset(amxNode);

    options['areaLayers'].length = 0;
    delete options['legend']['sections'];

    if (amxNode.getAttribute('__userselection'))
    {
      var nodes = descendentChanges.getAffectedNodes();
      nodes.forEach(function (node)
      {
        var nodeChanges = descendentChanges.getChanges(node);
        if (nodeChanges && nodeChanges.hasChanged('selectedRowKeys'))
        {
          var userSelection = amxNode.getAttribute('__userselection');
          userSelection[node.getId] = null;
          amxNode.setAttributeResolvedValue('__userselection', userSelection);
        }
      });
    }
  };

  ThematicMapRenderer.prototype.getDescendentChangeAction = function (amxNode, changes)
  {
    return adf.mf.api.amx.AmxNodeChangeResult["REFRESH"];
  };

  ThematicMapRenderer.prototype.GetCustomStyleProperty = function (amxNode)
  {
    return 'CustomThematicMapStyle';
  };

  ThematicMapRenderer.prototype.GetDefaultStyles = function (amxNode)
  {
    if (this.IsSkyros())
    {
      return adf.mf.internal.dvt.thematicmap.DefaultThematicMapStyle;
    }
    else 
    {
      return adf.mf.internal.dvt.thematicmap.DefaultThematicMapStyleAlta;
    }
  };

  ThematicMapRenderer.prototype.MergeComponentOptions = function (amxNode, options)
  {
    options = ThematicMapRenderer.superclass.MergeComponentOptions.call(this, amxNode, options);

    if (options['marker'])
    {
      if (options['styleDefaults'] === undefined)
      {
        options['styleDefaults'] = {};
      }
      if (options['styleDefaults']['dataMarkerDefaults'] === undefined)
      {
        options['styleDefaults']['dataMarkerDefaults'] = {};
      }
      // marker styling
      if (options['marker']['type'])
      {
        // now it is shape, not type
        options['styleDefaults']['dataMarkerDefaults']['shape'] = options['marker']['type'];
      }
    }

    // extract default colors from styleDefaults and dispose styleDefaults so that it's not passed to toolkit
    var styleDefaults = options['styleDefaults'];
    if (styleDefaults)
    {
      if (styleDefaults['colors'])
      {
        amxNode['_defaultColors'] = styleDefaults['colors'];
      }
      if (styleDefaults['shapes'])
      {
        amxNode['_defaultShapes'] = styleDefaults['shapes'];
      }
      delete options['styleDefaults']['colors'];    // remove styleDefaults colors from options, no longer needed
      delete options['styleDefaults']['shapes'];    // remove styleDefaults shapes from options, no longer needed
      delete options['marker']; // remove marker from options, no longer needed
    }
    return options;
  };

  ThematicMapRenderer.prototype.ProcessAttributes = function (options, amxNode, context)
  {
    ThematicMapRenderer.superclass.ProcessAttributes.call(this, options, amxNode, context);

    if (!adf.mf.environment.profile.dtMode && amxNode.isAttributeDefined('source'))
    {
      options['source'] = adf.mf.api.amx.buildRelativePath(amxNode.getAttribute('source'));
      options['sourceXml'] = this._getCustomBaseMapMetadata(amxNode, options['source']);
    }
  };

  ThematicMapRenderer.prototype.ProcessChildren = function (options, amxNode, context)
  {
    if(adf.mf.environment.profile.dtMode && amxNode.getChildren().length === 0)
    {
      this.GetChildRenderers()['areaLayer']['renderer'].ProcessAttributes(options, null, context);
      return true;
    }
    else
    {
      return ThematicMapRenderer.superclass.ProcessChildren.call(this, options, amxNode, context);
    }
  };

  ThematicMapRenderer.prototype.CreateComponentCallback = function(amxNode)
  {
    var renderer = this;
    var callbackObject = 
    {
      'callback' : function (event, component)
      {
        // fire the selectionChange event
        var type = event.getType();
        var itemNode = null;

        if (type === DvtSelectionEvent.TYPE)
        {
          var se;
          var userSelection = amxNode.getAttribute('__userselection') || {};
          var clientId = event.getParamValue('clientId');
          if (clientId)
          {
            itemNode = renderer.findAmxNode(amxNode, clientId);
  
            var selection = event.getSelection();
            // filter all removed keys
            var removedKeys = renderer.filterArray(userSelection[clientId], function(key)
            {
              return selection.indexOf(key) === -1;
            });
  
            se = new adf.mf.api.amx.SelectionEvent(removedKeys, selection);
            userSelection[clientId] = event.getSelection();
            amxNode.setAttributeResolvedValue('__userselection', userSelection);

            adf.mf.api.amx.processAmxEvent(itemNode, 'selection', undefined, undefined, se, null);
          }
          else
          {
            var oldSelections = userSelection;
            userSelection = {};
            amxNode.setAttributeResolvedValue('__userselection', userSelection);
            // component is deselecting all rowkeys in all layers so iterate through all previous
            // layers and trigger selection event
            var dataLayerIDs = Object.keys(oldSelections);
            dataLayerIDs.forEach(function(dlId)
            {
               itemNode = renderer.findAmxNode(amxNode, dlId);
               se = new adf.mf.api.amx.SelectionEvent(oldSelections[dlId], []);

               adf.mf.api.amx.processAmxEvent(itemNode, 'selection', undefined, undefined, se, null);
            });
          }
        }
        else if (type === DvtMapActionEvent.TYPE)
        {
          itemNode = renderer.findAmxNode(amxNode, event.getClientId());

          if (itemNode)
          {
            // area/marker node found, fire event and handle the 'action' attribute
            var ae = new adf.mf.api.amx.ActionEvent();
            adf.mf.api.amx.processAmxEvent(itemNode, 'action', undefined, undefined, ae, function ()
            {
              var action = itemNode.getAttributeExpression("action", true);
              if (action != null)
              {
                adf.mf.api.amx.doNavigation(action);
              }
            });
          }
        }
      }
    };

    return callbackObject;
  };

  ThematicMapRenderer.prototype.CreateToolkitComponentInstance = function(context, stageId, callbackObj, callback, amxNode)
  {
    return DvtAmxThematicMap.newInstance(context, callback, callbackObj, this.GetDataObject(amxNode));
  };

  ThematicMapRenderer.prototype.RenderComponent = function(instance, width, height, amxNode)
  {
    instance.render(this.GetDataObject(amxNode), width, height);
  };

  ThematicMapRenderer.prototype._getCustomBaseMapMetadata = function (amxNode, src)
  {
    if (loadedCustomBasemaps[src])
    {
      return loadedCustomBasemaps[src];
    }
    
    var successCB = function (responseText)
    {
      var parser = new DOMParser();
      var metadataNode = parser.parseFromString(responseText, "text/xml");
      var layerNodes = metadataNode.getElementsByTagName('layer');
      for (var i = 0; i < layerNodes.length; i++)
      {
        var imageNodes = layerNodes[i].getElementsByTagName('image');
        for (var j = 0; j < imageNodes.length; j++)
        {
          var source = imageNodes[j].getAttribute('source');
          var relativePath = adf.mf.api.amx.buildRelativePath(source);
          imageNodes[j].setAttribute('source', relativePath);
        }
      }

      var serializer = new XMLSerializer();
      var serialized = serializer.serializeToString(metadataNode);
      loadedCustomBasemaps[src] = serialized;

      amxNode.setAttributeResolvedValue("_baseMap", "ok");
      var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
  
      args.setAffectedAttribute(amxNode, "_baseMap");
      adf.mf.api.amx.markNodeForUpdate(args);
    };

    var errorCB = function (message)
    {
      amxNode.setAttributeResolvedValue("_baseMap", "failed");
      args.setAffectedAttribute(amxNode, "_baseMap");
      
      adf.mf.log.Framework.logp(adf.mf.log.level.SEVERE, "ThematicMapRenderer", "_getCustomBaseMapMetadata", "Error: " + message);
    };

    amxNode.setAttributeResolvedValue("_baseMap", "loading");

    adf.mf.api.resourceFile._loadFileWithAjax(src, true, successCB, errorCB)

    return null;
  };

  var loading = {};
  var loaded = {};

  // OLD STUFF
  /**
   * Loads thematicMap base map layers and resources
   */
  adf.mf.internal.dvt.loadMapLayerAndResource = function(amxNode, basemap, layer)
  {
    var basemapName = basemap.charAt(0).toUpperCase() + basemap.slice(1);
    var layerName = layer.charAt(0).toUpperCase() + layer.slice(1);

    var baseMapLayer = "DvtBaseMap" + basemapName + layerName + ".js";

    if (loaded[baseMapLayer])
    {
      amxNode.setAttributeResolvedValue("_baseMap", "ok");
      return;
    }

    amxNode.setAttributeResolvedValue("_baseMap", "loading");

    if (loading[baseMapLayer])
    {
      loading[baseMapLayer].push(amxNode);
      return;
    }
    else
    {
      loading[baseMapLayer] = [amxNode];
    }

    adf.mf.api.resourceFile.loadJsFile("js/thematicMap/basemaps/" + baseMapLayer, true,
    function()
    {
      var locale = adf.mf.locale.getUserLanguage();
      // Do not load resource bundle if language is english because it is included in the base map by default
      if (locale.indexOf("en") === -1)
      {
        var bundleName = basemapName + layerName + "Bundle";
        var resourceLoader = adf.mf.internal.dvt.util.ResourceBundleLoader.getInstance();
        resourceLoader.loadDvtResources("js/thematicMap/resource/" + bundleName, null, function()
        {
          var args = new adf.mf.api.amx.AmxNodeUpdateArguments();
  
          loading[baseMapLayer].forEach(function(n)
          {
            n.setAttributeResolvedValue("_baseMap", "ok");
            args.setAffectedAttribute(n, "_baseMap");
          });
    
          loaded[baseMapLayer] = true;
          delete loading[baseMapLayer];
    
          adf.mf.api.amx.markNodeForUpdate(args);
        });
      }
      else
      {
        var args = new adf.mf.api.amx.AmxNodeUpdateArguments();

        loading[baseMapLayer].forEach(function(n)
        {
          n.setAttributeResolvedValue("_baseMap", "ok");
          args.setAffectedAttribute(n, "_baseMap");
        });

        loaded[baseMapLayer] = true;
        delete loading[baseMapLayer];
  
        adf.mf.api.amx.markNodeForUpdate(args);
      }
    },
    function()
    {
      var args = new adf.mf.api.amx.AmxNodeUpdateArguments();

      loading[baseMapLayer].forEach(function(n)
      {
        n.setAttributeResolvedValue("_baseMap", "failed");
        args.setAffectedAttribute(n, "_baseMap");
      });

      adf.mf.api.amx.markNodeForUpdate(args);
      delete loading[baseMapLayer];
    }, function(t) { return t; });
  };

  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'thematicMap', ThematicMapRenderer);
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    timeline/TimeAxisRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  
  var TimeAxisRenderer = function()
  {
  }
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(TimeAxisRenderer, 'adf.mf.internal.dvt.BaseComponentRenderer', 'adf.mf.internal.dvt.timeline.TimeAxisRenderer');
 
  TimeAxisRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = TimeAxisRenderer.superclass.GetAttributesDefinition.call(this);
        
    attrs['inlineStyle'] = {'path' :  'style', 'type' : AttributeProcessor['TEXT']};
    //attrs['rendered'] = {'path' :  'axis/rendered', 'type' : AttributeProcessor['BOOLEAN']};
    attrs['styleClass'] = {'path' : 'styleClass', 'type' : AttributeProcessor['TEXT']};
    attrs['scale'] = {'path' : 'scale', 'type' : AttributeProcessor['TEXT']};
    
    return attrs;
  };
  
  TimeAxisRenderer.prototype.ProcessAttributes = function (options, axisNode, context)
  {
    var axisOptions = options['minorAxis'];
    if (axisNode.isAttributeDefined('type'))
    {
      var type = axisNode.getAttribute('type');
      if (type === 'major')
      {
        axisOptions = options['majorAxis'];
      }
      else if (type === 'minor')
      {
        axisOptions = options['minorAxis'];
      }
      else
      {
        // invalid axis type, do nothing
        return false;
      }
    }
    
    var changed = TimeAxisRenderer.superclass.ProcessAttributes.call(this, axisOptions, axisNode, context);
    
    var converter = axisNode.getConverter();
    if (converter)
    {
      changed = true;
      //if(!options[this._type]) options[this._type] = {};
      axisOptions['converter'] = converter;     
    }
    
    return changed;
  }
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    timeline/TimelineDefaults.js
 */
(function(){
  
  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.timeline');
  
  adf.mf.internal.dvt.timeline.DefaultTimelineStyle = 
  {
    // text to be displayed, if no data is provided
    'emptyText' : null,

    // default style values
    'styleDefaults': 
    {
      'timelineSeries': 
      {
         'colors': ["#267db3", "#68c182", "#fad55c", "#ed6647", "#8561c8", "#6ddbdb", "#ffb54d", "#e371b2", "#47bdef", "#a2bf39", "#a75dba", "#f7f37b"]
      }
   },
   '_resources' : 
   { 
     'scrollLeft' :   'css/images/timeline/scroll_l.svg', 
     'scrollRight' :  'css/images/timeline/scroll_r.svg', 
     'scrollUp' :     'css/images/timeline/scroll_t.svg', 
     'scrollDown' :   'css/images/timeline/scroll_d.svg',
     'zoomIn' :       'css/images/timeline/control-magnify-ena.png',
     'zoomIn_a' :     'css/images/timeline/control-magnify-dwn.png',
     'zoomOut' :      'css/images/timeline/control-deMagnify-ena.png',
     'zoomOut_a' :    'css/images/timeline/control-deMagnify-dwn.png',
     'overviewHandleHor' :  'css/images/timeline/drag_horizontal.png',
     'overviewHandleVert' : 'css/images/timeline/drag_vertical.png'
   } 
  };  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    timeline/TimelineItemRenderer.js
 */
(function()
{
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;

  var TimelineItemRenderer = function()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(TimelineItemRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.timeline.TimelineItemRenderer');
 
  TimelineItemRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = TimelineItemRenderer.superclass.GetAttributesDefinition.call(this);
    attrs['description'] = {'path' : 'description', 'type' : AttributeProcessor['TEXT']};
    attrs['endTime'] = {'path' : 'end', 'type' : AttributeProcessor['DATETIME']};
    attrs['inlineStyle'] = {'path' :  'style', 'type' : AttributeProcessor['TEXT']};
    attrs['startTime'] = {'path' : 'start', 'type' : AttributeProcessor['DATETIME']};
    attrs['styleClass'] = {'path' : 'styleClass', 'type' : AttributeProcessor['TEXT']};
    attrs['title'] = {'path' : 'title', 'type' : AttributeProcessor['TEXT']};
    attrs['durationFillColor'] = {'path' : 'durationFillColor', 'type' : AttributeProcessor['TEXT']};
    return attrs;
  };

  TimelineItemRenderer.prototype.ProcessAttributes = function (options, timelineItemNode, context)
  {
    var series = context["series"];
    var amxNode = context['amxNode'];

    var timelineItem = {};
    timelineItem['id'] = timelineItemNode.getId();
    timelineItem['_rowKey'] = context['_rowKey'];
    
    if(context["selectedRowKeys"] && context["selectedRowKeys"].indexOf(context['_rowKey']) > -1)
    {
      if(!series["selectedItems"])
      {
        series["selectedItems"] = [];
      }
      series["selectedItems"].push(timelineItem['id']);
    }
            
    if (timelineItemNode.isAttributeDefined('action'))
    {
      timelineItem['action'] = context['_rowKey'];
    }
    else
    {
      var actionTags;
      var firesAction = false;
      // should fire action, if there are any 'setPropertyListener' or 'showPopupBehavior' child tags
      actionTags = timelineItemNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'setPropertyListener');
      if (actionTags.length > 0)
        firesAction = true;
      else
      {
        actionTags = timelineItemNode.getTag().findTags(adf.mf.internal.dvt.AMX_NAMESPACE, 'showPopupBehavior');
        if (actionTags.length > 0)
          firesAction = true;
      }
      if (firesAction)
      {
        // need to set 'action' to some value to make the event fire
        timelineItem['action'] = context['_rowKey'];
      }
    }

    TimelineItemRenderer.superclass.ProcessAttributes.call(this, timelineItem, timelineItemNode, context);

    series['items'].push(timelineItem);

    var attributeGroupsNodes = timelineItemNode.getChildren();
    var iter = adf.mf.api.amx.createIterator(attributeGroupsNodes);
    while (iter.hasNext())
    {
      var attrGroupsNode = iter.next();

      if (attrGroupsNode.getTag().getName() !== 'attributeGroups' || (attrGroupsNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(attrGroupsNode.getAttribute('rendered'))))
        continue;         // skip non attr groups and unrendered attr groups

      if (!attrGroupsNode.isReadyToRender())
      {
        throw new adf.mf.internal.dvt.exception.NodeNotReadyToRenderException();
      }

      AttributeGroupManager.processAttributeGroup(attrGroupsNode, amxNode, context);
    }

    AttributeGroupManager.registerDataItem(context, timelineItem, null);

    return true;
  };
  
    
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    timeline/TimelineRenderer.js
 */
(function(){
    
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;
  var OverviewRenderer = adf.mf.internal.dvt.common.overview.OverviewRenderer;

  var TimelineRenderer = function()
  { }

  adf.mf.internal.dvt.DvtmObject.createSubclass(TimelineRenderer, 'adf.mf.internal.dvt.BaseComponentRenderer', 'adf.mf.internal.dvt.timeline.TimelineRenderer');
  
  TimelineRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = TimelineRenderer.superclass.GetStyleClassesDefinition.call(this);

    // timeline time axis styles
    styleClasses['timeAxis-backgroundColor'] = {'path' : 'styleDefaults/timeAxis/backgroundColor', 'type' : StyleProcessor['COLOR']};
    styleClasses['timeAxis-borderColor'] = {'path' : 'styleDefaults/timeAxis/borderColor', 'type' : StyleProcessor['COLOR']};
    styleClasses['timeAxis-borderWidth'] = {'path' : 'styleDefaults/timeAxis/borderWidth', 'type' : StyleProcessor['WIDTH']};
    styleClasses['timeAxis-labelStyle'] = {'path' : 'styleDefaults/timeAxis/labelStyle', 'type' : StyleProcessor['CSS_TEXT'], 'ignoreEmpty' : true};
    styleClasses['timeAxis-separatorColor'] = {'path' : 'styleDefaults/timeAxis/separatorColor', 'type' : StyleProcessor['COLOR']};

    // timeline item styles
    styleClasses['timelineItem-backgroundColor'] =  {'path' : 'styleDefaults/timelineItem/backgroundColor', 'type' : StyleProcessor['COLOR']};
    styleClasses['timelineItem-selectedBackgroundColor'] =  {'path' : 'styleDefaults/timelineItem/selectedBackgroundColor', 'type' : StyleProcessor['COLOR']};
    styleClasses['timelineItem-borderColor'] =  {'path' : 'styleDefaults/timelineItem/borderColor', 'type' : StyleProcessor['COLOR']};
    styleClasses['timelineItem-selectedBorderColor'] =  {'path' : 'styleDefaults/timelineItem/selectedBorderColor', 'type' : StyleProcessor['COLOR']};
    styleClasses['timelineItem-borderWidth'] =  {'path' : 'styleDefaults/timelineItem/borderWidth', 'type' : StyleProcessor['WIDTH']};
    styleClasses['timelineItem-selectedBorderWidth'] =  {'path' : 'styleDefaults/timelineItem/selectedBorderWidth', 'type' : StyleProcessor['WIDTH']};
    styleClasses['timelineItem-feelerColor'] =  {'path' : 'styleDefaults/timelineItem/feelerColor', 'type' : StyleProcessor['COLOR']};
    styleClasses['timelineItem-selectedFeelerColor'] =  {'path' : 'styleDefaults/timelineItem/selectedFeelerColor', 'type' : StyleProcessor['COLOR']};
    styleClasses['timelineItem-feelerWidth'] =  {'path' : 'styleDefaults/timelineItem/feelerWidth', 'type' : StyleProcessor['WIDTH']};
    styleClasses['timelineItem-selectedFeelerWidth'] =  {'path' : 'styleDefaults/timelineItem/selectedFeelerWidth', 'type' : StyleProcessor['WIDTH']};
    styleClasses['timelineItem-descriptionStyle'] = {'path' : 'styleDefaults/timelineItem/descriptionStyle', 'type' : StyleProcessor['CSS_TEXT'], 'ignoreEmpty' : true};
    styleClasses['timelineItem-titleStyle'] = {'path' : 'styleDefaults/timelineItem/titleStyle', 'type' : StyleProcessor['CSS_TEXT'], 'ignoreEmpty' : true};
    
    // timeline series styles
    styleClasses['timelineSeries-backgroundColor'] =  {'path' : 'styleDefaults/timelineSeries/backgroundColor', 'type' : StyleProcessor['COLOR']};
    styleClasses['timelineSeries-labelStyle'] = {'path' : 'styleDefaults/timelineSeries/labelStyle', 'type' : StyleProcessor['CSS_TEXT'], 'ignoreEmpty' : true};
    styleClasses['timelineSeries-emptyTextStyle'] = {'path' : 'styleDefaults/timelineSeries/emptyTextStyle', 'type' : StyleProcessor['CSS_TEXT'], 'ignoreEmpty' : true};

    return styleClasses;
  };

  TimelineRenderer.prototype.GetContentDivClassName = function ()
  {
    return 'dvtm-timeline';
  };

  /**
   * @param {String} facetName an optional name of the facet containing the items to be rendered
   * @return object that describes child renderers of the component.
   */
  TimelineRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      var TimelineSeriesRenderer = adf.mf.internal.dvt.timeline.TimelineSeriesRenderer;
      var TimeAxisRenderer = adf.mf.internal.dvt.timeline.TimeAxisRenderer;
      var OverviewRenderer = adf.mf.internal.dvt.common.overview.OverviewRenderer;
      this._renderers = 
        {
          'overview' : { 'renderer' : new OverviewRenderer(), 'order' : 3, 'maxOccurences' : 1 },
          'timelineSeries' : { 'renderer' : new TimelineSeriesRenderer() },
          'timeAxis' : { 'renderer' : new TimeAxisRenderer() }
        };
    }
    return this._renderers;
  }; 

  TimelineRenderer.prototype.GetAttributesDefinition = function (amxNode)
  {
    var attrs = TimelineRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['id'] = {'path' : 'id', 'type' : AttributeProcessor['TEXT']};
    attrs['inlineStyle'] = {'path' : 'style', 'type' : AttributeProcessor['TEXT']};    
    attrs['itemSelection'] = {'path' : 'selectionMode', 'type' : AttributeProcessor['TEXT']}; 
    attrs['orientation'] = {'path' : 'orientation', 'type' : AttributeProcessor['TEXT']}; 
    attrs['selectionMode'] = {'path' : 'selectionMode', 'type' : AttributeProcessor['TEXT']}; 
    attrs['shortDesc'] = {'path' : 'shortDesc', 'type' : AttributeProcessor['TEXT']};     
    attrs['styleClass'] = {'path' : 'styleClass', 'type' : AttributeProcessor['TEXT']};

    if (!adf.mf.environment.profile.dtMode)
    {
      attrs['endTime'] = {'path' : 'end', 'type' : AttributeProcessor['DATETIME']};  
      attrs['startTime'] = {'path' : 'start', 'type' : AttributeProcessor['DATETIME']}; 
      attrs['viewportEnd'] = {'path' : 'viewportEnd', 'type' : AttributeProcessor['DATETIME']};  
      attrs['viewportStart'] = {'path' : 'viewportStart', 'type' : AttributeProcessor['DATETIME']}; 
    }

    return attrs;
  };

  /**
   * Initialize generic options for all chart component.
   */
  TimelineRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    TimelineRenderer.superclass.InitComponentOptions.call(this, amxNode, options);

    options["type"] = "timeline";
    options['series'] = [];
    options['minorAxis'] = {};
    options['majorAxis'] = {};

    if (adf.mf.environment.profile.dtMode)
    {
      var definition = adf.mf.internal.dvt.ComponentDefinition.getComponentDefinition(amxNode.getTag().getName());
      var dtModeData = definition.getDTModeData();
      for(var prop in dtModeData)
      {
        options[prop] = dtModeData[prop];  
      }
      
      var children = amxNode.getChildren();
      var containsSeries = false;
      for(var i=0; i < children.length; i++) 
      {
        if(children[i].getTag().getName() === 'timelineSeries') {
          containsSeries = true;
          break;
        }
      }
      if(!containsSeries)
      {
        // add series
        definition = adf.mf.internal.dvt.ComponentDefinition.getComponentDefinition('timelineSeries');
        dtModeData = definition.getDTModeData();
        
        var series = {};
        series['id'] = 'timelineSeries' + Math.random();
        series['items'] = dtModeData['items0'];
        series['label'] = 'Label 0';
        options['series'][0] = series;
        
        series = {};
        series['id'] = 'timelineSeries' + Math.random();
        series['items'] = dtModeData['items1'];
        series['label'] = 'Label 1';
        options['series'][1] = series;
      }
    }
    
    amxNode["_seriesOrder"] = [];

    amxNode['_stylesResolved'] = false;
    
    AttributeGroupManager.reset(amxNode);
  };

  /**
   * Reset options for all chart component.
   */
  TimelineRenderer.prototype.ResetComponentOptions = function (amxNode, options, attributeChanges)
  {
    TimelineRenderer.superclass.ResetComponentOptions.call(this, amxNode, options, attributeChanges);

    options['series'] = [];

    var selection = amxNode.getAttribute('_selection');
    if (selection !== undefined && selection !== null)
    {
      options['selectedItems'] = selection;
    }
    
    AttributeGroupManager.reset(amxNode);
  };

  TimelineRenderer.prototype.GetCustomStyleProperty = function (amxNode)
  {
    return 'CustomTimelineStyle';
  };

  TimelineRenderer.prototype.GetDefaultStyles = function (amxNode)
  {
    return adf.mf.internal.dvt.timeline.DefaultTimelineStyle;
  };

  TimelineRenderer.prototype.MergeComponentOptions = function(amxNode, options)
  {
    options = TimelineRenderer.superclass.MergeComponentOptions.call(this, amxNode, options);

    // extract default colors from styleDefaults that will be used when attribute groups are defined
    var styleDefaults = options['styleDefaults'];
    if (styleDefaults)
    {
      if (styleDefaults['timelineSeries'] && styleDefaults['timelineSeries']['colors'])
      {
        amxNode['_durationBarFillColor'] = styleDefaults['timelineSeries']['colors'];
      }
    }
    return options;
  };

  /**
   * Function creates callback for the toolkit component
   */
  TimelineRenderer.prototype.CreateComponentCallback = function(amxNode)
  {
    var renderer = this;
    var callbackObject =
      {
        'callback' : function (event, component)
          {
            var clientId, itemNode;
            var _selection = [];

            if (event.getType() === 'selection')
            {
              // check if anything is selected
              if (event.getSelection() && event.getSelection().length > 0)
              {
                // find the timelineSeriesNode to fire on
                clientId = event.getSelection()[0];
                itemNode = renderer.findAmxNode(amxNode, clientId);
                if (itemNode)
                {
                  _selection.push(itemNode.getStampKey());
                }
                itemNode = itemNode ? itemNode.getParent() : null;
              }
              else
              {
                // empty selection, get the last firing timelineSeries node
                var lastSourceId = amxNode.getAttribute('_lastSelectionSourceId');
                itemNode = renderer.findAmxNode(amxNode, lastSourceId);
              }

              if (itemNode)
              {
                // fire the event
                var userSelection = amxNode.getAttribute('_selection') || [];
                // filter all removed keys
                var removedKeys = renderer.filterArray(userSelection, function(key)
                {
                  return _selection.indexOf(key) === -1;
                });

                var se = new adf.mf.api.amx.SelectionEvent(removedKeys, _selection);
                adf.mf.api.amx.processAmxEvent(itemNode, 'selection', undefined, undefined, se, null);
                // store the last selection info
                amxNode.setAttributeResolvedValue('_selection', _selection);
                amxNode.setAttributeResolvedValue('_lastSelectionSourceId', itemNode.getId());
              }
            }
            else if (event.getType() === 'dvtAct')
            {
              // action event support
              clientId = event.getClientId();
              itemNode = renderer.findAmxNode(amxNode, clientId);

              if (itemNode)
              {
                // fire ActionEvent and then process the 'action' attribute
                var ae = new adf.mf.api.amx.ActionEvent();
                adf.mf.api.amx.processAmxEvent(itemNode, 'action', undefined, undefined, ae,
                  function ()
                  {
                    var action = itemNode.getAttributeExpression("action", true);
                    if (action != null)
                    {
                      adf.mf.api.amx.doNavigation(action);
                    }
                  });
              }
            }
          }
      };
    return callbackObject;
  };

  TimelineRenderer.prototype.updateChildren = function (amxNode, attributeChanges)
  {
    // when descendants changes then refresh whole series
    return adf.mf.api.amx.AmxNodeChangeResult['RERENDER'];
  };

  /**
   * Function creates new instance of Timeline
   */
  TimelineRenderer.prototype.CreateToolkitComponentInstance = function(context, stageId, callbackObj, callback, amxNode)
  {
    var instance = DvtTimeline.newInstance(context, callback, callbackObj);
    context.getStage().addChild(instance);
    return instance;
  };

  TimelineRenderer.prototype.getDescendentChangeAction = function (amxNode, changes)
  {
    // when descendants changes then refresh whole series
    return adf.mf.api.amx.AmxNodeChangeResult["RERENDER"];
  };

  /**
   * Function renders instance of the component
   */
  TimelineRenderer.prototype.RenderComponent = function(instance, width, height, amxNode)
  {
    // we need to send data object always because of the bug that prevents only simple resize of the 
    // component
    var data = this.GetDataObject(amxNode);
    var dim = this.AdjustStageDimensions({'width' : width, 'height' : height});
    instance.render(data, dim['width'], dim['height']);
  };

  TimelineRenderer.prototype.__isReadyToRender = function(amxNode)
  {
    var ready = true;
    amxNode.visitChildren(new adf.mf.api.amx.VisitContext(), function (visitContext, anode)
    {
      if (anode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(anode.getAttribute('rendered')))
      {
        return adf.mf.api.amx.VisitResult['COMPLETE'];
      }

      if (anode.getTag().getName() === "timelineSeries")
      {
        if (anode.isAttributeDefined("value"))
        {
          var items = anode.getAttribute("value");
          if (items === undefined)
          {
            ready = false;
            return adf.mf.api.amx.VisitResult['COMPLETE'];
          }

          if (items && items.treeNodeBindings)
          {
            var iter = adf.mf.api.amx.createIterator(items);
            if (iter.getTotalCount() > iter.getAvailableCount())
            {
              ready = false;
              return adf.mf.api.amx.VisitResult['COMPLETE'];
            }
          }
        }

        return adf.mf.api.amx.VisitResult['REJECT'];
      }
      return adf.mf.api.amx.VisitResult['ACCEPT'];
    });

    return ready;
  }

  TimelineRenderer.prototype.render = function (amxNode, id)
  {
    var rootElement = TimelineRenderer.superclass.render.call(this, amxNode, id);

    if (this.__isReadyToRender(amxNode) === false)
    {
      var placeholder = document.createElement("div");
      placeholder.id = id + "_placeholder";
      placeholder.className = "dvtm-component-placeholder amx-deferred-loading";
      var msgLoading = adf.mf.resource.getInfoString("AMXInfoBundle", "MSG_LOADING");
      placeholder.setAttribute("aria-label", msgLoading);
      rootElement.appendChild(placeholder);
    }

    return rootElement;
  }

  TimelineRenderer.prototype.postDisplay = function (rootElement, amxNode)
  {
    if (this.__isReadyToRender(amxNode) === false)
    {
      if (this.IsAncestor(document.body, rootElement))
      {
        this.GetComponentDimensions(rootElement, amxNode);
      }
      return; // this function is not applicable for placeholders
    }

    var placeholder = document.getElementById(amxNode.getId() + "_placeholder");
    if (placeholder)
    {
      placeholder.parentNode.removeChild(placeholder);
    }

    TimelineRenderer.superclass.postDisplay.call(this, rootElement, amxNode);
  }

  TimelineRenderer.prototype.refresh = function(amxNode, attributeChanges, descendentChanges)
  {
    if (this.__isReadyToRender(amxNode) === false)
    {
      return; // this function is not applicable for placeholders
    }

    var placeholder = document.getElementById(amxNode.getId() + "_placeholder");
    if (placeholder)
    {
      placeholder.parentNode.removeChild(placeholder);
    }

    /* BUG 17458279: Check if we have some descendent changes available. If so, then use them and drop them. */
    if ((descendentChanges === undefined) && (amxNode["_pendingDescendentChanges"] !== undefined))
    {
      descendentChanges = amxNode["_pendingDescendentChanges"];
    }
    delete amxNode["_pendingDescendentChanges"];
    // recover all the information about attribute changes before bulkLoadProvider
    if (amxNode["_pendingAttributeChanges"])
    {
      attributeChanges = amxNode["_pendingAttributeChanges"];
      delete amxNode["_pendingAttributeChanges"];
    }

    TimelineRenderer.superclass.refresh.call(this, amxNode, attributeChanges, descendentChanges);
  }

  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'timeline', TimelineRenderer); 
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    timeline/TimelineSeriesRenderer.js
 */
(function()
{
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
  var AttributeGroupManager = adf.mf.internal.dvt.common.attributeGroup.AttributeGroupManager;

  /**
   * Timeline renderer
   */
  var TimelineSeriesRenderer = function ()
  {}

  adf.mf.internal.dvt.DvtmObject.createSubclass(TimelineSeriesRenderer, 'adf.mf.internal.dvt.DataStampRenderer', 'adf.mf.internal.dvt.timeline.TimelineSeriesRenderer');
  
  /**
   * @param {String} facetName an optional name of the facet containing the items to be rendered
   * @return object that describes child renderers of the component.
   */
  TimelineSeriesRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      var TimelineItemRenderer = adf.mf.internal.dvt.timeline.TimelineItemRenderer;
      this._renderers = 
      {
        'stamped' : {
          'timelineItem' : { 'renderer' : new TimelineItemRenderer(), 'order' : 1}
        },
        'simple' : {
        }
      };
    }
    
    if(facetName) 
    {
      return this._renderers['stamped'];
    }
    else
    {
      return this._renderers['simple'];
    }
  };

  TimelineSeriesRenderer.prototype.GetAttributesDefinition = function ()
  {
    var attrs = TimelineSeriesRenderer.superclass.GetAttributesDefinition.call(this);

    attrs['emptyText'] = {'path' : 'emptyText', 'type' : AttributeProcessor['TEXT']};
    attrs['inlineStyle'] = {'path' : 'style', 'type' : AttributeProcessor['TEXT']};
    attrs['label'] = {'path' : 'label', 'type' : AttributeProcessor['TEXT']};
    attrs['styleClass'] = {'path' : 'styleClass', 'type' : AttributeProcessor['TEXT']};

    return attrs;
  };

  TimelineSeriesRenderer.prototype.updateTimelineNode = function (seriesAmxNode)
  {
    // update series order
    var timelineNode = seriesAmxNode.getParent();
    var seriesId = seriesAmxNode.getId();
    if(timelineNode["_seriesOrder"].indexOf(seriesId) == -1)
    {
      timelineNode["_seriesOrder"].push(seriesId);
    }
  };

  TimelineSeriesRenderer.prototype.ProcessAttributes = function (options, seriesAmxNode, context)
  {
    this.updateTimelineNode(seriesAmxNode);

    var timelineAmxNode = seriesAmxNode.getParent();
    var seriesId = seriesAmxNode.getId();

    var series = {};

    series['id'] = seriesId;
    series['items'] = [];

    context['series'] = series;
    TimelineSeriesRenderer.superclass.ProcessAttributes.call(this, series, seriesAmxNode, context);

    // set either processed series or null (when rendered equals false)
    // when dual series is null do not add it to the array
    var seriesIndex = timelineAmxNode["_seriesOrder"].indexOf(seriesId);
    if(!(seriesIndex === 1 && series === null))
    {
      options['series'][seriesIndex] = series;
    }

    return true;
  };

  /**
   * Check if renderer is running in dtmode. If so then load only dummy data. In other case leave processing on the
   * parent.
   */
  TimelineSeriesRenderer.prototype.ProcessChildren = function (options, seriesAmxNode, context)
  {
    if (adf.mf.environment.profile.dtMode)
    {
      var definition = adf.mf.internal.dvt.ComponentDefinition.getComponentDefinition(seriesAmxNode.getTag().getName());
      var dtModeData = definition.getDTModeData();

      var series = {};
      series['id'] = seriesAmxNode.getId();

      var timelineAmxNode = seriesAmxNode.getParent();
      var seriesIndex = timelineAmxNode["_seriesOrder"].indexOf(seriesAmxNode.getId());
      if(!(seriesIndex == 1 && series === null)) {
        series['items'] = dtModeData['items'+seriesIndex];
        series['label'] = ('Label '+ seriesIndex);
        
        options['series'][seriesIndex] = series;
      }

      return true;
    }
    else
    {
      AttributeGroupManager.init(context);

      context["selectedRowKeys"] = seriesAmxNode.isAttributeDefined("selectedRowKeys") ? seriesAmxNode.getAttribute("selectedRowKeys") : null;

      var changed = TimelineSeriesRenderer.superclass.ProcessChildren.call(this, options, seriesAmxNode, context);
      
      delete context["selectedRowKeys"];

      var config = new adf.mf.internal.dvt.common.attributeGroup.AttributeGroupConfig();
      config.addTypeToDefaultPaletteMapping('durationFillColor', 'durationBarFillColor');
      config.setUpdateCategoriesCallback(function(attrGrp, dataItem, valueIndex, exceptionRules) {
        // do nothing
      });

      AttributeGroupManager.applyAttributeGroups(seriesAmxNode.getParent(), config, context);

      return changed;
    }
  };

  TimelineSeriesRenderer.prototype.InitComponent = function(simpleNode, amxNode)
  {
    // do not handle resize
  };
  
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'timelineSeries', TimelineSeriesRenderer); 
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    treeview/SunburstNodeRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  
  var SunburstNodeRenderer = function()
  {};
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(SunburstNodeRenderer, 'adf.mf.internal.dvt.treeview.BaseTreeviewNodeRenderer', 'adf.mf.internal.dvt.treeview.SunburstNodeRenderer');
  
  
  SunburstNodeRenderer.prototype.GetAttributesDefinition = function (amxNode)
  {
    var attrs = SunburstNodeRenderer.superclass.GetAttributesDefinition.call(this, amxNode);
    
    attrs['radius'] = {'path' : 'radius', 'type' : AttributeProcessor['FLOAT']};
    
    return attrs;
  };
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    treeview/SunburstRenderer.js
 */
(function(){

  var TreeviewUtils = adf.mf.internal.dvt.treeview.TreeviewUtils;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  
  var SunburstRenderer = function ()
  {};
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(SunburstRenderer, 'adf.mf.internal.dvt.treeview.BaseTreeviewRenderer', 'adf.mf.internal.dvt.treeview.SunburstRenderer');
 
  SunburstRenderer.prototype.GetChartType = function ()
  {
    return 'sunburst';
  };
  
  SunburstRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      var SunburstNodeRenderer = adf.mf.internal.dvt.treeview.SunburstNodeRenderer;
      var LegendRenderer = adf.mf.internal.dvt.common.legend.LegendRenderer;
      this._renderers = 
      {
        'stamped' : {
          'sunburstNode' : { 'renderer' : new SunburstNodeRenderer()}
        },
        'simple' : {
          'legend' : { 'renderer' : new LegendRenderer(), 'maxOccurrences' : 1 }
        }
      };
    }
   
    if(facetName) 
    {
      return this._renderers['stamped'];
    }
    else
    {
      return this._renderers['simple'];
    }
  };
  
  SunburstRenderer.prototype.GetStyleComponentName = function () {
    return 'sunburst';
  };
  
  SunburstRenderer.prototype.GetAttributesDefinition = function (amxNode)
  {
    var attrs = SunburstRenderer.superclass.GetAttributesDefinition.call(this, amxNode);
    
    var options = this.GetDataObject(amxNode);
    
    attrs['rotation'] = {'path' : 'rotation', 'type' : AttributeProcessor['TEXT'],  'default' : TreeviewUtils.getMergedStyleValue(options, 'sunburst/rotation')};
    attrs['rotationAngle'] = {'path' : 'startAngle', 'type' : AttributeProcessor['INTEGER'],  'default' : TreeviewUtils.getMergedStyleValue(options, 'sunburst/rotationAngle')};

    return attrs;
  };
  
  SunburstRenderer.prototype.GetOuterDivClass = function ()
  {
    return "dvtm-sunburst";
  };
  
  SunburstRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = SunburstRenderer.superclass.GetStyleClassesDefinition.call(this);
    
    styleClasses['dvtm-sunburstNode'] = [{'path' : 'nodeDefaults/borderColor', 'type' : StyleProcessor['BORDER_COLOR']}];
    styleClasses['dvtm-sunburstNodeSelected'] = [{'path' : 'nodeDefaults/selectedOuterColor', 'type' : StyleProcessor['BORDER_COLOR_TOP']}, {'path' : 'nodeDefaults/selectedInnerColor', 'type' : StyleProcessor['BORDER_COLOR']}];
    styleClasses['dvtm-sunburstNodeLabel'] = [{'path' : 'nodeDefaults/labelStyle', 'type' : StyleProcessor['CSS_TEXT']}];
    
    styleClasses['dvtm-sunburstAttributeTypeLabel'] = [{'path' : 'styleDefaults/_attributeTypeTextStyle', 'type' : StyleProcessor['CSS_TEXT']}];
    styleClasses['dvtm-sunburstAttributeValueLabel'] = [{'path' : 'styleDefaults/_attributeValueTextStyle', 'type' : StyleProcessor['CSS_TEXT']}];
    
    return styleClasses;
  };
  
  SunburstRenderer.prototype.GetCustomStyleProperty = function (amxNode)
  {
    return 'CustomSunburstStyle';
  };
  
  SunburstRenderer.prototype.GetDefaultStyles = function (amxNode)
  {
    return adf.mf.internal.dvt.treeview.DefaultSunburstStyle;
  };
  
  /**
   * Returns the name of the stamped child tag.
   * @param {String} facetName optional facet name where the stamped child lives 
   * @return stamped child tag name
   */
  SunburstRenderer.prototype.GetStampedChildTagName = function(facetName)
  {
    return "sunburstNode";
  };
  
  SunburstRenderer.prototype.CreateToolkitComponentInstance = function(context, stageId, callbackObj, callback, amxNode)
  {
    return DvtSunburst.newInstance(context, callback, callbackObj);
  };
  
  SunburstRenderer.prototype.GetResourceBundles = function () 
  {
    var ResourceBundle = adf.mf.internal.dvt.util.ResourceBundle;
    
    var bundles = SunburstRenderer.superclass.GetResourceBundles.call(this);
    bundles.push(ResourceBundle.createLocalizationBundle('DvtSunburstBundle'));
    
    return bundles;
  };
  
  SunburstRenderer.prototype.PreventsSwipe = function (amxNode)
  {
    // sunburst should prevent swipe gestures when 'rotation' attribute is defined
    if (amxNode.isAttributeDefined('rotation') && amxNode.getAttribute('rotation') !== 'off')
    {
      return true;
    }
    return false;
  }
  
  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'sunburst', SunburstRenderer);
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    treeview/TreemapNodeHeaderRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  
  var TreemapNodeHeaderRenderer = function()
  {};
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(TreemapNodeHeaderRenderer, 'adf.mf.internal.dvt.BaseRenderer', 'adf.mf.internal.dvt.treeview.TreemapNodeHeaderRenderer');
  
  TreemapNodeHeaderRenderer.prototype.GetAttributesDefinition = function (amxNode)
  {
    var attrs = TreemapNodeHeaderRenderer.superclass.GetAttributesDefinition.call(this, amxNode);
    
    attrs['isolate'] = {'path' : 'isolate', 'type' : AttributeProcessor['TEXT']};
    attrs['titleHalign'] = {'path' : 'labelHalign', 'type' : AttributeProcessor['TEXT']};
    attrs['useNodeColor'] = {'path' : 'useNodeColor', 'type' : AttributeProcessor['TEXT']};

    return attrs;
  };
  
  TreemapNodeHeaderRenderer.prototype.ProcessAttributes = function (options, treemapHeaderNode, context)
  {
    var dataItem = context["dataItem"];
    dataItem['header'] = {};
    
    if(dataItem)
    {
      // always process all attributes -> temporarily delete _attributeChanges
      var currentAttributeChanges = context['_attributeChanges'];
      context['_attributeChanges'] = null;
      
      TreemapNodeHeaderRenderer.superclass.ProcessAttributes.call(this, dataItem['header'], treemapHeaderNode, context);
      
      context['_attributeChanges'] = currentAttributeChanges;
    }
    return true;
  };
  
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    treeview/TreemapNodeRenderer.js
 */
(function(){
  
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  
  var TreemapNodeRenderer = function()
  {};
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(TreemapNodeRenderer, 'adf.mf.internal.dvt.treeview.BaseTreeviewNodeRenderer', 'adf.mf.internal.dvt.treeview.TreemapNodeRenderer');
  
  TreemapNodeRenderer.prototype.GetAttributesDefinition = function (amxNode)
  {
    var attrs = TreemapNodeRenderer.superclass.GetAttributesDefinition.call(this, amxNode);
    
    attrs['labelValign'] = {'path' : 'labelValign', 'type' : AttributeProcessor['TEXT']};
    attrs['groupLabelDisplay'] = {'path' : 'groupLabelDisplay', 'type' : AttributeProcessor['TEXT']};
    
    return attrs;
  };
  
  TreemapNodeRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      var TreemapNodeHeaderRenderer = adf.mf.internal.dvt.treeview.TreemapNodeHeaderRenderer;
      this._renderers = 
        {
          'treemapNodeHeader' : { 'renderer' : new TreemapNodeHeaderRenderer()}
        };
    }
   
    return this._renderers;
  };
  
  TreemapNodeRenderer.prototype.ProcessChildren = function (options, layerNode, context)
  {
    if (layerNode.isAttributeDefined('rendered') && adf.mf.api.amx.isValueFalse(layerNode.getAttribute('rendered')))
      return;
    
    return TreemapNodeRenderer.superclass.ProcessChildren.call(this, options, layerNode, context);
  };
  
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    treeview/TreemapRenderer.js
 */
(function(){
  
  var TreeviewUtils = adf.mf.internal.dvt.treeview.TreeviewUtils;
  var AttributeProcessor = adf.mf.internal.dvt.AttributeProcessor;
  var StyleProcessor = adf.mf.internal.dvt.StyleProcessor;

  var TreemapRenderer = function ()
  {};
  
  adf.mf.internal.dvt.DvtmObject.createSubclass(TreemapRenderer, 'adf.mf.internal.dvt.treeview.BaseTreeviewRenderer', 'adf.mf.internal.dvt.treeview.TreemapRenderer');
 
  TreemapRenderer.prototype.GetChartType = function ()
  {
    return 'treemap';
  };
  
  TreemapRenderer.prototype.GetChildRenderers = function (facetName)
  {
    if(this._renderers === undefined)
    {
      var LegendRenderer = adf.mf.internal.dvt.common.legend.LegendRenderer;
      var TreemapNodeRenderer = adf.mf.internal.dvt.treeview.TreemapNodeRenderer;
      this._renderers = 
      {
        'stamped' : {
          'treemapNode' : { 'renderer' : new TreemapNodeRenderer(), 'order' : 1}
        },
        'simple' : {
          'legend' : { 'renderer' : new LegendRenderer(), 'maxOccurrences' : 1 }
        }
      };
    }
    
    if(facetName) 
    {
      return this._renderers['stamped'];
    }
    else
    {
      return this._renderers['simple'];
    }
  };
  
  /**
   * Initialize treemap options.
   */
  TreemapRenderer.prototype.InitComponentOptions = function (amxNode, options)
  {
    TreemapRenderer.superclass.InitComponentOptions.call(this, amxNode, options);
    
    if (options["nodeDefaults"]["header"] === undefined)
    {
      options["nodeDefaults"]["header"] = {};
    }
  };
  
  TreemapRenderer.prototype.MergeComponentOptions = function (amxNode, options)
  {
    options = TreemapRenderer.superclass.MergeComponentOptions.call(this, amxNode, options);

    // set toolkit defaults
    TreeviewUtils.copyOptionIfDefined(options, 'node/groupLabelDisplay', 'nodeDefaults/groupLabelDisplay');
    TreeviewUtils.copyOptionIfDefined(options, 'header/isolate', 'nodeDefaults/header/isolate');
    TreeviewUtils.copyOptionIfDefined(options, 'header/titleHalign', 'nodeDefaults/header/labelHalign');
    TreeviewUtils.copyOptionIfDefined(options, 'header/useNodeColor', 'nodeDefaults/header/useNodeColor');

    return options;
  };
  
  TreemapRenderer.prototype.GetStyleComponentName = function () {
    return 'treemap';
  };
  
  TreemapRenderer.prototype.GetAttributesDefinition = function (amxNode)
  {
    var attrs = TreemapRenderer.superclass.GetAttributesDefinition.call(this, amxNode);
    
    var options = this.GetDataObject(amxNode);
    
    // set options
    attrs['layout'] = {'path' : 'layout', 'type' : AttributeProcessor['TEXT'], 'default' : TreeviewUtils.getMergedStyleValue(options, 'treemap/layout')};
    attrs['groupGaps'] = {'path' : 'groupGaps', 'type' : AttributeProcessor['TEXT'], 'default': TreeviewUtils.getMergedStyleValue(options, 'treemap/groupGaps')};

    return attrs;
  };
  
  TreemapRenderer.prototype.GetOuterDivClass = function ()
  {
    return "dvtm-treemap";
  };
  
  TreemapRenderer.prototype.GetStyleClassesDefinition = function ()
  {
    var styleClasses = TreemapRenderer.superclass.GetStyleClassesDefinition.call(this);
    
    styleClasses['dvtm-treemapNodeSelected'] = [{'path' : 'nodeDefaults/selectedOuterColor', 'type' : StyleProcessor['BORDER_COLOR_TOP']}, {'path' : 'nodeDefaults/selectedInnerColor', 'type' : StyleProcessor['BORDER_COLOR']}];
    styleClasses['dvtm-treemapNodeHeader'] = [{'path' : 'nodeDefaults/header/backgroundColor', 'type' : StyleProcessor['BACKGROUND']}, {'path' : 'nodeDefaults/header/borderColor', 'type' : StyleProcessor['BORDER_COLOR']}];
    styleClasses['dvtm-treemapNodeHeaderSelected'] = [{'path' : 'nodeDefaults/header/selectedOuterColor', 'type' : StyleProcessor['BORDER_COLOR_TOP']}, {'path' : 'nodeDefaults/header/selectedInnerColor', 'type' : StyleProcessor['BORDER_COLOR']}];
    styleClasses['dvtm-treemapNodeHeaderHover'] = [{'path' : 'nodeDefaults/header/hoverOuterColor', 'type' : StyleProcessor['BORDER_COLOR_TOP']}, {'path' : 'nodeDefaults/header/hoverInnerColor', 'type' : StyleProcessor['BORDER_COLOR']}];
    styleClasses['dvtm-treemapNodeLabel'] = [{'path' : 'nodeDefaults/labelStyle', 'type' : StyleProcessor['CSS_TEXT']}];
    styleClasses['dvtm-treemapNodeHeaderLabel'] = [{'path' : 'nodeDefaults/header/labelStyle', 'type' : StyleProcessor['CSS_TEXT']}];
    
    styleClasses['dvtm-treemapAttributeTypeLabel'] = [{'path' : 'styleDefaults/_attributeTypeTextStyle', 'type' : StyleProcessor['CSS_TEXT']}];
    styleClasses['dvtm-treemapAttributeValueLabel'] = [{'path' : 'styleDefaults/_attributeValueTextStyle', 'type' : StyleProcessor['CSS_TEXT']}];
    
    return styleClasses;
  };
  
  TreemapRenderer.prototype.GetCustomStyleProperty = function (amxNode)
  {
    return 'CustomTreemapStyle';
  };
  
  TreemapRenderer.prototype.GetDefaultStyles = function (amxNode)
  {
    return adf.mf.internal.dvt.treeview.DefaultTreemapStyle;
  };
  
  /**
   * Returns the name of the stamped child tag.
   * @param {String} facetName optional facet name where the stamped child lives 
   * @return stamped child tag name
   */
  TreemapRenderer.prototype.GetStampedChildTagName = function(facetName)
  {
    return "treemapNode";
  };
  
  TreemapRenderer.prototype.CreateToolkitComponentInstance = function(context, stageId, callbackObj, callback, amxNode)
  {
    return DvtTreemap.newInstance(context, callback, callbackObj);
  };
  
  TreemapRenderer.prototype.GetResourceBundles = function () 
  {
    var ResourceBundle = adf.mf.internal.dvt.util.ResourceBundle;
    
    var bundles = TreemapRenderer.superclass.GetResourceBundles.call(this);
    bundles.push(ResourceBundle.createLocalizationBundle('DvtTreemapBundle'));
    
    return bundles;
  };
  
  TreemapRenderer.prototype.PreventsSwipe = function (amxNode)
  {
    // treemap does not prevent swipe gestures to be handled by its container
    return false;
  }
  
  // register them to amx layer
  adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_DVTM, 'treemap', TreemapRenderer);
})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    treeview/TreeviewDefaults.js
 */
(function(){
  
  adf.mf.internal.dvt.DvtmObject.createPackage('adf.mf.internal.dvt.treeview');
  
  adf.mf.internal.dvt.treeview.DefaultTreemapStyle =
  {
    // treemap properties
    "treemap" : {
      // Animation effect when the data changes - none, auto
      //"animationOnDataChange": "auto",
      // Specifies the animation that is shown on initial display - none, auto
      //"animationOnDisplay": "auto",
      // Specifies the animation duration in milliseconds
      //"animationDuration": "500",
      // The text of the component when empty
      //"emptyText": "No data to display",
      // Specifies whether gaps are displayed between groups - outer, all, none
      //"groupGaps": "all",
      // Specifies the layout of the treemap - squarified, sliceAndDiceHorizontal, sliceAndDiceVertical
      //"layout": "squarified",
      // Specifies the selection mode - none, single, multiple
      //"nodeSelection": "multiple",
      // Specifies whether whether the nodes are sorted by size - on, off
      //"sorting": "on"
    },
    // treemap node properties
    "node" : {
      // The label display behavior for group nodes - header, node, off
      //"groupLabelDisplay": "off",
      // The label display behavior for nodes - node, off
      //"labelDisplay": "off",
      // The horizontal alignment for labels displayed within the node - center, start, end
      //"labelHalign": "end",
      // The vertical alignment for labels displayed within the node - center, top, bottom
      //"labelValign": "center"
    },
    // treemap node header properties
    "header" : {
      // Specifies whether isolate behavior is enabled on the node - on, off
      //"isolate": "on",
      // The horizontal alignment of the title of this header - start, end, center
      //"titleHalign": "start",
      // Specifies whether the node color should be displayed in the header - on, off
      //"useNodeColor": "on"
    },
    // default style values
    'styleDefaults' : 
    {
      // default color palette
      'colors' : ["#267db3", "#68c182", "#fad55c", "#ed6647", "#8561c8", "#6ddbdb", "#ffb54d", "#e371b2", "#47bdef", "#a2bf39", "#a75dba", "#f7f37b"],
      // default patterns palette
      'patterns' : ["smallDiagonalRight", "smallChecker", "smallDiagonalLeft", "smallTriangle", "smallCrosshatch", "smallDiamond", "largeDiagonalRight", "largeChecker", "largeDiagonalLeft", "largeTriangle", "largeCrosshatch", "largeDiamond"]
    }
  };  
  
  adf.mf.internal.dvt.treeview.DefaultSunburstStyle =
  {
    // sunburst properties
    "sunburst" : {
      // is client side rotation enabled? - on, off
      //"rotation": "off",
      // The text of the component when empty
      //"emptyText": "No data to display",
      // Specifies the selection mode - none, single, multiple
      //"nodeSelection": "multiple",
      // Animation effect when the data changes - none, auto
      //"animationOnDataChange": "auto",
      // Specifies the animation that is shown on initial display - none, auto
      //"animationOnDisplay": "auto",
      // Specifies the animation duration in milliseconds
      //"animationDuration": "500",
      // The color that is displayed during a data change animation when a node is updated
      //"animationUpdateColor" : "#FFD700",
      // Specifies the starting angle of the sunburst
      //"startAngle": "90",
      // Specifies whether whether the nodes are sorted by size - on, off
      //"sorting": "on"
    },
    // sunburst node properties
    "node" : {
      // Node border color
      //"borderColor": "#000000",
      // Is label displayed? - on, off
      //"labelDisplay": "off",
      // Label horizontal align
      //"labelHalign": "center",
      // Node color on hover
      //"hoverColor": "#FFD700",
      // Selected node color
      //"selectedColor": "#DAA520"
    },
    // default style values
    'styleDefaults' : 
    {
      // default color palette
      'colors' : ["#267db3", "#68c182", "#fad55c", "#ed6647", "#8561c8", "#6ddbdb", "#ffb54d", "#e371b2", "#47bdef", "#a2bf39", "#a75dba", "#f7f37b"],
      // default patterns palette
      'patterns' : ["smallDiagonalRight", "smallChecker", "smallDiagonalLeft", "smallTriangle", "smallCrosshatch", "smallDiamond", "largeDiagonalRight", "largeChecker", "largeDiagonalLeft", "largeTriangle", "largeCrosshatch", "largeDiamond"]
    }
  };
  
})();;
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    util/JSONUtils.js
 */(function ()
{
  var JSONUtils = function ()
  {}

  adf.mf.internal.dvt.DvtmObject.createSubclass(JSONUtils, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.util.JSONUtils');

  JSONUtils.mergeObjects = function (source, destination)
  {
    // Clone so that content isn't modified
    destination = JSONUtils.cloneObject(destination);
    if (source == null)
    {
      return destination;
    }
    else if (destination == null)
    {
      return JSONUtils.cloneObject(source);
    }
    // in default case just copy source to the cloned destination
    JSONUtils.copy(source, destination);
    return destination;
  };

  JSONUtils.cloneObject = function (obj, keyFunc)
  {
    if (obj == null)
    {
      return null;
    }

    var ret = null, i, size;

    if (obj instanceof Array)
    {
      ret = [];

      // Loop through and copy the Array
      for (i = 0, size = obj.length;i < size;i++)
      {
        if (_isDeepClonable(obj[i]))
        {
          // deep clone objects
          ret[i] = JSONUtils.cloneObject(obj[i], keyFunc);
        }
        else 
        {
          // copy values
          ret[i] = obj[i];
        }
      }
    }
    else if (obj instanceof Date)
    {
      // convert Date to time millis
      ret = obj.getTime();
    }
    else if (obj instanceof Object)
    {
      ret = {};

      // Loop through all properties of the object
      var keys = Object.keys(obj);
      for (i = 0, size = keys.length;i < size;i++)
      {
        var key = keys[i];
        if (!keyFunc || keyFunc(key))
        {
          var value = obj[key];
          if (_isDeepClonable(value))
          {
            // deep clone objects
            ret[key] = JSONUtils.cloneObject(value, keyFunc);
          }
          else 
          {
            // copy values
            ret[key] = value;
          }
        }
      }
    }

    return ret;
  };

  JSONUtils.copy = function (a, b)
  {
    var keys = Object.keys(a);
    for (var i = 0, size = keys.length; i < size;i++)
    {
      var key = keys[i];
      var value = a[key];
      if (value && (value instanceof Array))
      {
        // Copy the array over, since we don't want arrays to be merged
        b[key] = JSONUtils.cloneObject(value);
      }
      else if (_isDeepClonable(value))
      {
        // Deep clone if object exists in b, copy otherwise
        if (b[key])
        {
          JSONUtils.copy(value, b[key]);
        }
        else 
        {
          b[key] = JSONUtils.cloneObject(value);
        }
      }
      else 
      {
        b[key] = value;
      }
    }
  };

  var _isDeepClonable = function (obj)
  {
    if (typeof obj === 'undefined')
      return false;
    else 
      return (obj instanceof Object) && !(obj instanceof Boolean) && !(obj instanceof String) && !(obj instanceof Number) && !(obj instanceof Function);
  };

})();
/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
/*
 *    util/ResourceBundle.js
 */
(function()
{
  var ResourceBundle = function (path, resourceName, checkCallback, loadCallback)
  {
    this.path = path;
    this.resourceName = resourceName;
    this.checkCallback = checkCallback;
    this.loadCallback = loadCallback;
  };

  adf.mf.internal.dvt.DvtmObject.createSubclass(ResourceBundle, 'adf.mf.internal.dvt.DvtmObject', 'adf.mf.internal.dvt.util.ResourceBundle');

  ResourceBundle.L18N_BUNDLES_PATH = 'js/toolkit/resource/';

  ResourceBundle.prototype.getPath = function()
  {
    return this.path;
  };

  ResourceBundle.prototype.getResourceName = function()
  {
    return this.resourceName;
  };

  ResourceBundle.prototype.getCheckCallback = function()
  {
    return this.checkCallback;
  };

  ResourceBundle.prototype.getLoadCallback = function()
  {
    return this.loadCallback;
  };

  ResourceBundle.prototype.getUrl = function()
  {
    var url = this.getPath();
    if (!(url.indexOf("/", url.length - "/".length) !== -1))
    {
      url += "/";
    }
    url += this.getResourceName();

    return url;
  };

  ResourceBundle.createLocalizationBundle = function(resourceName, path, bundleProperty)
  {
    if (!path) path = ResourceBundle.L18N_BUNDLES_PATH;
    if (!bundleProperty) bundleProperty = resourceName + '_RB';

    var checkCallback = function() 
    {
      return typeof window[bundleProperty] != 'undefined';  
    };

    var loadCallback = function() 
    {
      DvtBundle.addLocalizedStrings(window[bundleProperty]);  
    };

    return new ResourceBundle(path, resourceName, checkCallback, loadCallback); 
  };
})();
