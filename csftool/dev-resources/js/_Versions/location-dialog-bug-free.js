
//LOCATION_DIALOG = null;

function CsfToolLocationDialog(name_element, description_element, lat_element, lon_element) {
    var anchor, anchors, dimensions, options, supported_events, title;
    this.anchor = null;
    this.anchors = this.dialogAnchors();
    this.dimensions = this.dialogDimensions();
    this.supported_events = ["cancel","delete","save"];
    this.title = this.dialogTitle();

    var _current_location_, _initial_location_, _listeners_, _location_elements_;
    this._listeners_ = { };
    // the last location chosen
    this._current_location_ = { name:null, description:null, lat:null, lon:null };
    // the location selected when the dialog was opened
    this._initial_location_ = { name:null, description:null, lat:null, lon:null };
    this._location_elements_ = { };

    // set the default location
    //jQuery.each(this.dialogLocation(), function (key, value) {
    //    this._current_location_[key] = value;
    //    this._initial_location_[key] = value;
    //} );

    Object.defineProperty(CsfToolLocationDialog.prototype, "location", { configurable:false, enumerable:false,
        get:function() { return jQuery.extend( { }, this._location_); }
    } );
    Object.defineProperty(CsfToolLocationDialog.prototype, "coords", { configurable:false, enumerable:false,
        get:function() { return { lat: this._location_['lat'], lon: this._location_['lon'] }; }
    } );
}

CsfToolLocationDialog.prototype.bindLocationElements = function(name_element, description_element, lat_element, lon_element) {
    this._location_elements_["description"] = description_element;
    this._location_elements_["lat"] = lat_element;
    this._location_elements_["lon"] = lon_element;
    this._location_elements_["name"] = name_element;
}

CsfToolLocationDialog.prototype.dialogAnchors = function() {
    return { center:"#csftool-content", wrapper:"#csftool-location-dialog-wrapper" };
}

CsfToolLocationDialog.prototype.dialogButtons = function() { 
    var wrapper = this.anchors.wrapper;
    return { Cancel: { "class": "csftool-location-dialog-cancel", text:"Cancel",
                       click: function () {
                           console.log("CANCEL button clicked");
                           jQuery(wrapper).dialog("close");
                           }
                     },
             Delete: { "class": "csftool-location-dialog-delete", text:"Delete",
                       click: function () { console.log("DELETE button clicked"); }
                     },
             Save: { "class": "csftool-location-dialog-save", text:"Save",
                     click: function () { console.log("SAVE button clicked"); }
                   },
           }
}

CsfToolLocationDialog.prototype.dialogDimensions = function() { return { height:600, width:600 }; }

CsfToolLocationDialog.prototype.dialogHtml = function() {
    return [
            '<div id="csftool-location-dialog-wrapper">',
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

CsfToolLocationDialog.prototype.setDialogAnchors = function(dialog_anchor, center_anchor) {
    if (typeof center_anchor !== 'undefined') { this.anchors["center"] = center_anchor; }
    if (typeof dialog_anchor !== 'undefined') { this.anchors["dialog"] = dialog_anchor; }
}

CsfToolLocationDialog.prototype.setDimensions = function(width, height) {
    if (typeof height !== 'undefined') { this.dimensions["height"] = height; }
    if (typeof width !== 'undefined') { this.dimensions["width"] = width; }
}

CsfToolLocationDialog.prototype.setLocation = function(name, description, lat, lon) {
    if (typeof description !== 'undefined') {
        this._location_["description"] = description;
        jQuery("#csftool-location-address").val(description);
    }
    if (typeof lat !== 'undefined') {
        this._location_["lat"] = lat;
        jQuery("#csftool-location-lat").val(lat);
    }
    if (typeof lon !== 'undefined') {
        this._location_["lon"] = lon;
        jQuery("#csftool-location-lon").val(lon);
    }
    if (typeof name !== 'undefined') {
        this._location_["name"] = name;
        jQuery("#csftool-location-name").val(name);
    }
}

CsfToolLocationDialog.prototype.createDialogInstance = function(dom_element) {
    console.log("CsfToolLocationDialog.createDialogInstance() was called : " + jQuery(this));
    jQuery(dom_element).html(this.dialogHtml());
    this.anchors.content = dom_element;
    var buttons = jQuery.extend({}, this.dialogButtons());
    console.log("anchors.wrapper : " + this.anchors.wrapper);
    var anchor = jQuery(this.anchors.wrapper).dialog( { autoOpen:false,
           appendTo: dom_element,
           modal: true, buttons: buttons, title: this.title,
           minHeight:this.dimensions.height, minWidth:this.dimensions.width,
           position: { my: "center center", at: "center center", of: this.anchors.center },
           } );
    console.log("this.anchor : " + anchor);
    var loc = this.location;
    jQuery("#csftool-location-name").val(loc.name);
    jQuery("#csftool-location-address").val(loc.description);
    jQuery("#csftool-location-lat").val(loc.lat);
    jQuery("#csftool-location-lon").val(loc.lon);
    return this;
}

CsfToolLocationDialog.prototype.show = function(location) {
    if (typeof location !== 'undefined') { this._location_ = jQuery.extend( {}, location ); }
    console.log("CsfToolLocationDialog.show() was called");
    jQuery(this.anchors.wrapper).dialog("open");
    return false;
}

// manage event listeners

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

