;(function(jQuery) {

var waitForItem = function(widget, item) {
    console.log("WAIT WIDGET :: waitForItem : " + item);
    if (widget.items_available.indexOf(item) < 0) { widget.items_to_watch.push(item); if (widget.dialog) { widget.showDialog(); } }
}

var waitForItems = function(widget, items) {
    console.log("WAIT WIDGET :: waitForItems : " + items);
    var _widget = widget; jQuery.each(items, function(i) { waitForItem(_widget, items[i]); });
}

var DialogOptions = {
    autoOpen:false,
    center_on: "#csftool-content",
    draggable: false,
    height: 200,
    modal: false,
    resizable: false,
    width: 200,
}

var CsfToolWaitWidget = {
    _listeners_: { },
    auto_stop: false,
    dialog: null,
    initialized: false,
    initial_class: "nowait",
    isactive: false,
    items_available: [ ],
    items_to_watch: [ ],
    supported_listeners: ["allItemsAvailable", "itemIsAvailable", "onStart", "onStop"],
    widget_anchor: "body",

    allItemsAvailable: function() { return (jQuery(this.items_available).not(this.items_to_watch).length === 0) && (jQuery(this.items_to_watch).not(this.items_available).length === 0); },

    available: function(item_type) {
        console.log("WAIT WIDGET : " + item_type + " is ready");
        var exists = this.items_available.indexOf(item_type);
        if (exists < 0) {
            this.items_available.push(item_type);
            if ("itemIsAvailable" in this._listeners_) {
                console.log("EVENT :: WAIT WIDGET : itemIsAvailable : " + item_type),
                this._listeners_.itemIsAvailable("itemIsAvailable", item_type);
            } else { console.log('...... WAIT WIDGET HAS NO CALLBACK FOR "itemIsAvailable" event ......'); }
            if (this.allItemsAvailable()) {
                if (this.auto_stop) { this.stop(); }
                if ("allItemsAvailable" in this._listeners_) {
                    this._listeners_.allItemsAvailable("allItemsAvailable", this.items_available); } else { console.log('...... WAIT WIDGET HAS NO CALLBACK FOR "allItemsAvailable" event ......'); }
            }
        }
    },

    bind: function(event_type, callback) { if (this.supported_listeners.indexOf(event_type) >= 0) { this._listeners_[event_type] = callback; } },

    createDialog: function(options) {
        var dialog_options = this.mergeDialogOptions(options, this.dialog_options);
        console.log("WAIT WIDGET :: creating spinner dialog");
        this.dialog = jQuery(this.widget_anchor).CsfToolSpinnerDialog(dialog_options);
        if (this.items_to_watch.length > 0) { this.dialog.open(); }
    },

    hideDialog: function() { if (this.dialog != null && this.dialog.isopen) { this.dialog.close(); } },
 
    init: function(options) {
        this.dialog_options = this.mergeDialogOptions(options, DialogOptions);
        this.initialized = true;
        console.log("WAIT WIDGET :: initialized");
        return this;
    },

    isavailable: function(item_type) { return (this.items_available.indexOf(item_type) > -1); },

    mergeDialogOptions: function(options, with_options) {
        var merged = jQuery.extend({}, with_options);
        if (typeof options !== 'undefined') {
            var settable = ['center_on', 'height', 'width'];
            jQuery.each(options, function (key, value) { if (settable.indexOf(key) >= 0) { merged[key] = value; } });
        }
        return merged;
    },

    showDialog: function() { if (this.dialog != null && !(this.dialog.isopen)) { this.dialog.open(); } },

    start: function() {
        var wait_for = null;
        if (arguments.length > 0) { wait_for = arguments[0]; }
        if (arguments.length > 1) { this.auto_stop = arguments[1]; } else { this.auto_stop = false; }
        this.items_available = [];
        this.items_to_watch = [];
        this.isactive = true;
        if (wait_for) { this.waitFor(wait_for); }
        console.log("WAIT WIDGET :: start : waiting for " + this.items_to_watch);
        if ("onStart" in this._listeners_) { this._listeners_.onStart("onStart", this.items_to_watch); }
        // attempt to show the spinner dialog only after it has been created
        if (this.dialog != null) { this.showDialog(); }
    },

    stop: function() {
        console.log("WAIT WIDGET :: stopping wait widget in " +  this.widget_anchor);
        console.log("               available items : " +  this.items_available);
        if (this.dialog != null) {
            var hide = false;
            if (arguments.length == 1) { hide = arguments[0]; }
            if (hide && this.dialog.isopen) { this.hideDialog(); }
        }
        this.isactive = false;
        if ("onStop" in this._listeners_) { this._listeners_.onStop("onStop", this.items_available); }
    },

    waitFor: function(wait_for) {
        console.log("WAIT WIDGET :: waitFor : active : " + this.isactive);
        console.log("                      data_type : " + wait_for);
        if (this.isactive) {
            if (jQuery.type(wait_for) === 'string') { waitForItem(this, wait_for); } else { waitForItems(this, wait_for); }
        } else { 
            if (jQuery.type(wait_for) === 'string') { this.start([wait_for,]); } else { this.start(wait_for); } }
    },

    waiting: function() { return (jQuery(this.items_to_watch).not(this.items_available).length > 0); },
}

jQuery.fn.CsfToolWaitWidget = function(options) {
    var dom_element = this.get(0);
    var widget = jQuery.extend({ }, CsfToolWaitWidget);
    if (typeof dom_element !== 'undefined') {
        if (jQuery(dom_element).is("body")) {
           console.log('CREATING WAIT WIDGET :: in "body"'); 
           widget.widget_anchor = "body";
        } else if (typeof dom_element.id === 'string') {
           console.log('CREATING WAIT WIDGET :: in "#' + dom_element.id + '"'); 
           widget.widget_anchor = "#" + dom_element.id;
        } else { throw 'DOM Element used to create an instance of CsfToolWaitWidget must have a unique id or be the "body" element.' }
        console.log("                        widget anchor = " + widget.widget_anchor);
    }
    if (typeof options !== 'undefined') { widget.createDialog(options); }
    return widget;
}

})(jQuery);
