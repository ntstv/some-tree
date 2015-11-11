/**
 * Created by ntstv on 11.11.2015.
 */

/**
 * Tree node
 * @param {{
 *  itemId: Number,
 *  itemName: string,
 *  itemParentId: Number
 * }} params
 * @param {Object=} opt_children
 * @constructor
 */
var TreeNode = function(params, opt_children) {
    this.id_ = params.itemId;
    this.parent_ = params.itemParentId;
    this.name_ = params.itemName;
    this.children_ = opt_children ? opt_children : null;
    this.collapsed_ = true;
    this.element_ = null;
    this.inDocument_ = false;
    this.expandButton_ = null;
};

/**
 * Css classes
 * @enum {string}
 */
TreeNode.CssClass = {
    ROOT: 'b-node',
    EXPANDABLE: 'b-node_expandable',
    EXPAND_BUTTON: 'b-node__expand-button',
    COLLAPSED: 'b-node_collapsed',
    EXPANDED: 'b-node_expanded',
    TITLE: 'b-node__title',
    TITLE_TEXT: 'b-node__title-text',
    INTERNAL: 'b-node__internal'
};

/**
 * Returns id
 * @return {Number}
 */
TreeNode.prototype.getId = function() {
    return this.id_;
};

/**
 * Returns parent id
 * @return {Number}
 */
TreeNode.prototype.getParent = function() {
    return this.parent_;
};

/**
 * Returns true if has children
 * @return {boolean}
 */
TreeNode.prototype.hasChildren = function() {
    return this.getChildren().length > 0;
};

/**
 * Returns array of children
 * @return {Array<TreeNode>}
 */
TreeNode.prototype.getChildren = function() {
    var res = [];
    if (this.children_) {
        for(var i in this.children_) {
            if (this.children_.hasOwnProperty(i)) {
                res.push(this.children_[i]);
            }
        }
    }

    return res;
};

/**
 * Returns component element
 * @return {?Element}
 */
TreeNode.prototype.getElement = function() {
    return this.element_;
};

/**
 * Return true if collapsed
 * @return {boolean}
 */
TreeNode.prototype.isCollapsed = function() {
    return this.collapsed_;
};

TreeNode.prototype.getChild = function(id) {
    var res;
    if (this.children_) {
        id += '';
        res = this.children_[id];
    }
    return res;
};

/**
 * Renders node to the given element
 * @param {Element} opt_parentElem
 */
TreeNode.prototype.render = function(opt_parentElem) {
    var element = this.createDom();
    if (opt_parentElem) {
        opt_parentElem.appendChild(element);
    }
    else {
        document.body.appendChild(element);
    }
    this.element_ = element;
    this.enterDocument();
};

/**
 * Adds child
 * @param {TreeNode} child
 * @param {boolean=} opt_render
 */
TreeNode.prototype.addChild = function(child, opt_render) {
    if (!this.children_) {
        this.children_ = {};
        this.addClass_(TreeNode.CssClass.EXPANDABLE);
    }
    this.children_['' + child.getId] = child;
    if (opt_render) {
        child.render(this.getContentElement());
    }
    this.setCollapsed_(this.collapsed_);
};

/**
 * Return content element
 * @return {Element}
 */
TreeNode.prototype.getContentElement = function() {
   return this.element_.getElementsByClassName(
       TreeNode.CssClass.INTERNAL)[0];
};

/**
 * Creates element
 * @return {Element}
 */
TreeNode.prototype.createDom = function() {
    var element = document.createElement('div'),
        title = document.createElement('div'),
        titleText = document.createElement('div'),
        internal = document.createElement('div'),
        expandButton = document.createElement('div');
    element.className = TreeNode.CssClass.ROOT;
    title.className = TreeNode.CssClass.TITLE;
    titleText.className = TreeNode.CssClass.TITLE_TEXT;
    internal.className = TreeNode.CssClass.INTERNAL;
    expandButton.className = TreeNode.CssClass.EXPAND_BUTTON;

    if (this.hasChildren()) {
        element.className += ' ' + TreeNode.CssClass.EXPANDABLE;
        for (var i, node, arr = this.getChildren(); node = arr[i]; i++) {
            node.render(internal);
            internal.appendChild(node.getElement());
        }
        if (this.isCollapsed()) {
            element.className += ' ' + TreeNode.CssClass.COLLAPSED;
        } else {
            element.className += ' ' + TreeNode.CssClass.EXPANDED;
        }
    }

    titleText.textContent = this.name_;
    element.appendChild(expandButton);
    title.appendChild(expandButton);
    title.appendChild(titleText);
    element.appendChild(title);
    element.appendChild(internal);
    return element;
};

TreeNode.prototype.enterDocument = function() {
    if (this.inDocument_) {
        throw new Error('Already in document');
    }
    var expandButton = this.element_.getElementsByClassName(TreeNode.CssClass.EXPAND_BUTTON)[0];
    if (expandButton) {
        expandButton.addEventListener('click', this.onExpandButtonClick_.bind(this), false);
    }
    if (this.hasChildren()) {
        expandButton.textContent = '+';
    }
    this.expandButton_ = expandButton;
};

/**
 * On expand button click
 * @param {Event} event
 * @private
 */
TreeNode.prototype.onExpandButtonClick_ = function(event) {
    this.setCollapsed_(!this.collapsed_);
};

/**
 * Sets collapsed
 * @param {boolean} collapsed
 * @private
 */
TreeNode.prototype.setCollapsed_ = function(collapsed) {
    this.collapsed_ = collapsed;
    if (this.collapsed_) {
        this.removeClass_(TreeNode.CssClass.EXPANDED);
        this.addClass_(TreeNode.CssClass.COLLAPSED);
        this.expandButton_.textContent = '+';
    } else {
        this.removeClass_(TreeNode.CssClass.COLLAPSED);
        this.addClass_(TreeNode.CssClass.EXPANDED);
        this.expandButton_.textContent = '-';
    }
};

/**
 * Removes class from element
 * @param {string} className
 * @private
 */
TreeNode.prototype.removeClass_ = function(className) {
    var regExp = new RegExp('\s*' + className);
    this.element_.className = this.element_.className.replace(regExp, '');
};

/**
 * Adds class to element
 * @param {string} className
 * @private
 */
TreeNode.prototype.addClass_ = function(className) {
    var regExp = new RegExp('\s*' + className);
    if (!regExp.test(this.element_.className)) {
        this.element_.className += ' ' + className;
    }
};

/**
 * Tree
 * @param {Array<{itemId, itemName, itemParentId}>} data
 * @constructor
 */
var Tree = function(data) {
    this.data_ = data;
};

Tree.prototype.render = function(parentElem, opt_parentNode) {
    var children;
    if (!opt_parentNode) {
        children = this.getChildrenParams_(0);
    }else {
        children = this.getChildrenParams_(opt_parentNode.getId());
    }
    for(var i = 0, params; params = children[i]; i++) {
        var node = new TreeNode(params);
            node.render(parentElem);
        if (opt_parentNode) {
            opt_parentNode.addChild(node);
        }
        this.render(node.getContentElement(), node)
    }
};

/**
 * Returns children of given parentId
 * @param {Number} parentId
 * @returns {Array}
 * @private
 */
Tree.prototype.getChildrenParams_ = function(parentId) {
    var res = [];
    for (var i = 0, params; params = this.data_[i]; i++) {
        if (params.itemParentId == parentId) {
            res.push(params);
        }
    }

    return res;
};

var testData =  {data:[

    {itemId:1, itemName:"пункт №1", itemParentId:0},

    {itemId:2, itemName:"пункт №1.1", itemParentId:1},

    {itemId:3, itemName:"пункт №1.2", itemParentId:1},

    {itemId:4, itemName:"пункт №1.2.1", itemParentId:3},

    {itemId:5, itemName:"пункт №1.2.2", itemParentId:3},

    {itemId:6, itemName:"пункт №1.2.3", itemParentId:3},

    {itemId:7, itemName:"пункт №2", itemParentId:0},

    {itemId:8, itemName:"пункт №3", itemParentId:0},

    {itemId:9, itemName:"пункт №3.1", itemParentId:8},

    {itemId:10, itemName:"пункт №3.2", itemParentId:8},

    {itemId:11, itemName:"пункт №3.3", itemParentId:8},

    {itemId:12, itemName:"пункт №3.3.1", itemParentId:11},

    {itemId:13, itemName:"пункт №3.3.1.1", itemParentId:12},

    {itemId:14, itemName:"пункт №3.3.1.2", itemParentId:12},

    {itemId:15, itemName:"пункт №3.3.1.3", itemParentId:12},

    {itemId:16, itemName:"пункт №3.3.2", itemParentId:11},

    {itemId:17, itemName:"пункт №4", itemParentId:0},

    {itemId:18, itemName:"пункт №5", itemParentId:0},

    {itemId:19, itemName:"пункт №5.1", itemParentId:18}

]};

//var tree = new Tree(testData.data);
//if (!document.body) {
//    document.body = document.createElement('body');
//}
//tree.render(document.body, 0);