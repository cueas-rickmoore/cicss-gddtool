
//LOCATION_DIALOG = null;

function CsfToolLocationDialog() {
    var anchors, dialog, dimensions, locations, options, supported_events, title;
    this.dialog = null;
    this.anchors = this.dialogAnchors();
    this.dimensions = this.dialogDimensions();
    this.locations = { };
    this.supported_events = ["cancel","delete","save", "show"];
    this.title = this.dialogTitle();

    var _initial_location_, _listeners_, _selected_location_;
    // the location selected when the dialog was opened
    this._initial_location_ = { name:null, description:null, lat:null, lon:null };
    // event listeners
    this._listeners_ = { };
    // the last location chosen
    this._selected_location_ = { name:null, description:null, lat:null, lon:null };

    Object.defineProperty(CsfToolLocationDialog.prototype, "coords", { configurable:false, enumerable:false,
        get:function() { return { lat: this._selected_location_['lat'], lon: this._selected_location_['lon'] }; }
    } );
    Object.defineProperty(CsfToolLocationDialog.prototype, "location", { configurable:false, enumerable:false,
        get:function() { return jQuery.extend( { }, this._selected_location_); }
    } );
}

CsfToolLocationDialog.prototype.clearLocation = function() {
    jQuery("#csftool-location-address").val("");
    jQuery("#csftool-location-lat").val("");
    jQuery("#csftool-location-lon").val("");
    jQuery("#csftool-location-name").val("");
}

CsfToolLocationDialog.prototype.createDialogInstance = function(dom_element) {
    console.log("CsfToolLocationDialog.createDialogInstance() was called : " + jQuery(this));
    jQuery(dom_element).html(this.dialogHtml());
    this.anchors.parent = dom_element;
    var buttons = jQuery.extend({}, this.dialogButtons());
    console.log("anchors.wrapper : " + this.anchors.wrapper);
    var dialog = jQuery(this.anchors.wrapper).dialog( { autoOpen:false,
           appendTo: dom_element,
           modal: true, buttons: buttons, title: this.title,
           minHeight:this.dimensions.height, minWidth:this.dimensions.width,
           position: { my: "center center", at: "center center", of: this.anchors.center },
           } );
    this.dialog = dialog;
    console.log("this.dialog : " + this.dialog);
    return this;
}

CsfToolLocationDialog.prototype.dialogAnchors = function() {
    return { center:"#csftool-content", wrapper:"#csftool-location-dialog-wrapper" };
}

CsfToolLocationDialog.prototype.dialogButtons = function() { 
    var wrapper = this.anchors.wrapper;
    return { Cancel: { "class": "csftool-location-dialog-cancel", text:"Cancel",
                       click: this.cancelButtonClicked },
             Delete: { "class": "csftool-location-dialog-delete", text:"Delete",
                       click: this.deleteButtonClicked },
             Save: { "class": "csftool-location-dialog-save", text:"Save",
                     click: this.saveButtonClicked }
           }
}

CsfToolLocationDialog.prototype.dialogDimensions = function() { return { height:600, width:600 }; }

CsfToolLocationDialog.prototype.dialogHtml = function() {
    return ['<div id="csftool-location-dialog-wrapper">',
            '<div id="csftool-location-content">',
            '<div id="csftool-location-data">',
            '<div id="csftool-location-coords">',
            '<label class="dialog-label">Name :</label>',
            '<input type="text" id="csftool-location-name" class="dialog-text">',
            '<label class="dialog-label dialog-coord">Lat :</label>',
            '<input id="csftool-location-lat" class="dialog-text dialog-coord" type="text">',
            '<label class="dialog-label dialog-coord">Long :</label>',
            '<input id="csftool-location-lon" class="dialog-text dialog-coord" type="text">',
            '</div>',
            '<div id="csftool-location-description"><label class="dialog-label">Place :</label>',
            '<input type="text" id="csftool-location-address" class="dialog-text"> </div>',
            '</div> <!-- close csftool-location-data -->',
            '<div id="csftool-location-map"> </div>',
            '</div> <!-- end of csftool-location-content -->',
            '</div> <!-- end of csftool-location-dialog-wrapper -->'].join('');
}

CsfToolLocationDialog.prototype.defaultLocation = function() { return { description:"Cornell University, Ithaca, NY", lat:42.45, lon:-76.48, name:"default" }; }

CsfToolLocationDialog.prototype.dialogTitle = function() { return "Location Selection Dialog"; }

CsfToolLocationDialog.prototype.executeCallback = function(event_key) {
    if (event_key in this._listeners_) {
        var callback = this._listeners_[event_key];
        if (typeof callback !== 'undefined') { callback(event_key, this); }
    }
}

CsfToolLocationDialog.prototype.locationChanged = function() {
    var initial_location = this._initial_location_;
    var selected_location = this._selected_location_;
    if (this.selected_location.lat != this.initial_location.lat) { return true; }
    if (this.selected_location.lon != this.initial_location.lon) { return true; }
    if (this.selected_location.description != this.initial_location.description) { return true; }
    if (this.selected_location.name != this.initial_location.name) { return true; }
    return false;
}

CsfToolLocationDialog.prototype.setDialogAnchors = function(dialog_anchor, center_anchor) {
    if (typeof center_anchor !== 'undefined') { this.anchors["center"] = center_anchor; }
    if (typeof dialog_anchor !== 'undefined') { this.anchors["dialog"] = dialog_anchor; }
}

CsfToolLocationDialog.prototype.setDimensions = function(width, height) {
    if (typeof height !== 'undefined') { this.dimensions["height"] = height; }
    if (typeof width !== 'undefined') { this.dimensions["width"] = width; }
}

CsfToolLocationDialog.prototype.setLocation = function(location_object) {
    if (typeof location_object !== 'undefined') { 
        var initial_location = jQuery.extend( {}, location_object );
        this._initial_location_ = initial_location;
        this._selected_location_ = initial_location;
        jQuery("#csftool-location-address").val(location_object.description);
        jQuery("#csftool-location-lat").val(location_object.lat);
        jQuery("#csftool-location-lon").val(location_object.lon);
        jQuery("#csftool-location-name").val(location_object.name);
    } else { this.clearLocation(); }
}

CsfToolLocationDialog.prototype.show = function() {
    this.executeCallback("show");
    console.log("CsfToolLocationDialog.show() was called");
    jQuery(this.anchors.wrapper).data("instance", this).dialog("open");
    return false;
}

// button click event handlers ued by dialog

CsfToolLocationDialog.prototype.cancelButtonClicked = function() { 
    console.log("CANCEL button clicked");
    console.log("this : " + this);
    var wrapper = this.anchors.wrapper;
    //!TODO check for change when cancel and prompt : "Are you sure ?"
    jQuery(wrapper).dialog("close");
    this.executeCallback("cancel");
}
CsfToolLocationDialog.prototype.deleteButtonClicked = function() { 
    console.log("DELETE button clicked");
    this.executeCallback("delete");
}
CsfToolLocationDialog.prototype.saveButtonClicked = function() { 
    console.log("SAVE button clicked");
    this.executeCallback("save");
    if (this.locationChanged()) { this.executeCallback("changed"); }
}

// event callbacks supplied by application

CsfToolLocationDialog.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_events.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}
CsfToolLocationDialog.prototype.callListener = function(event_type, info) {
    if (event_type in this._listeners_) { this._listeners[event_type](event_type, info, this); }
}
CsfToolLocationDialog.prototype.removeListener = function(event_type) {
    if (event_type in this._listeners_) { delete this._listeners_[event_type]; }
}

//LOCATION_DIALOG = new CsfToolLocationDialog();

