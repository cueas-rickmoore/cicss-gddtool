
;(function(jQuery) {

var isValidPropertyName = function(text) {
    var valid = /^[0-9a-zA-Z_]+$/;
    return valid.test(text);
}

var TheDialogContext = {
    changed: false,
    default_location: { address:"Cornell University, Ithaca, NY", lat:42.45, lng:-76.48, id:"default" },
    initialized: false,
    initial_location: null, // id of the location/marker selected when the dialog was opened
    locations: { }, // dictionary of all locations on the map
    selected_location: null, // id of the last location/marker selected

    baseLocation: function(loc_obj) {
        var loc_obj = loc_obj;
        if (typeof loc_obj === 'string') {
            if (loc_obj == 'initial') { loc_obj = this.locations[this.initial_location];
            } else if (loc_obj == 'selected') { loc_obj = this.locations[this.selected_location];
            } else { loc_obj = this.locations[loc_obj]; }
        }
        if (loc_obj) {
            return { address: loc_obj.address, lat: loc_obj.lat, lng: loc_obj.lng, id: loc_obj.id }
        } else { return undefined; }
    },

    deleteLocation: function(loc_obj) {
        var loc_obj = this.locations[loc_obj.id];
        if (typeof loc_obj !== 'undefined') {
            var stuff;
            loc_obj.marker.setMap(null);
            stuff = loc_obj.infowindo;
            delete stuff;
            loc_obj.infowindo = null;
            stuff = loc_obj.marker;
            delete stuff;
            loc_obj.marker = null;
            stuff = loc_obj;
            delete this.locations[loc_obj.id];
            delete stuff;
            this.changed = true;
        }
    },

    getLocation: function(loc_obj) {
        var loc_obj = loc_obj;
        if (typeof loc_obj === 'string') {
            if (loc_obj == 'initial') { return this.locations[this.initial_location];
            } else if (loc_obj == 'selected') { return this.locations[this.selected_location];
            } else { return this.locations[loc_obj]; }
        }
        if (typeof loc_obj !== 'undefined') { return this.locations[loc_obj.id]; } 
        if (this.selected_location != null) { return this.locations[this.selected_location]; }
        return this.locations["default"];
    },

    initializeDialogs: function(dom_element) {
        var dom = DialogDOM;
        jQuery(dom_element).html(dom.dialog_html); // initialze the container for all dialogs
        dom.container = dom_element;
        // create map dialog
        MapDialog.initializeDialog(dom.map_anchor);
        // create location editor dialog
        EditorDialog.initializeDialog(dom.editor_anchor);
        this.initialized = true;
        return this;
    },

    locationExists: function(loc_obj) { return typeof this.locations[loc_obj.id] !== 'undefined'; },

    publicContext: function() {
        return { initial_location: this.baseLocation("initial"),
                 all_locations: this.publicLocations(),
                 selected_location: this.baseLocation("selected"),
               }
    },

    publicLocation: function(loc_obj) { return this.baseLocation(this.getLocation(loc_obj)); },

    publicLocations: function() {
        var locations = { };
        jQuery.each(this.locations, function(id, loc) {
                    locations[id] = { address:loc.address, lat:loc.lat, lng:loc.lng, id:loc.id }
        });
        return locations;
    },

    saveLocation: function(loc_obj) { this.locations[loc_obj.id] = jQuery.extend({}, loc_obj); this.changed = true; },

    selectLocation: function(loc) {
        if (typeof loc === 'string') { this.selected_location = loc;
        } else { this.selected_location = loc.id; }
        this.changed = true;
    },
}

var DialogDOM = {
    center_loc_on:"#csftool-map-dialog-map",
    center_map_on:"#csftool-content",
    container: null,

    dialog_html: [ '<div id="csftool-location-dialogs">',
                   '<div id="csftool-map-dialog-anchor">',
                   '</div> <!-- end of csftool-map-dialog-anchor -->',
                   '<div id="csftool-location-editor-anchor">',
                   '</div> <!-- close csftool-location-editor-anchor -->',
                   '</div> <!-- end of csftool-location-dialogs -->'].join(''),

    editor_anchor: "#csftool-location-editor-anchor",
    editor_content: "#csftool-location-editor-content",
    editor_default_id: "Enter unique id",
    editor_dialog_html: [ '<div id="csftool-location-editor-content">',
                       '<p class="invalid-location-id">ID must contain only alpha-numeric characters and underscores</p>',
                       '<label class="dialog-label">ID :</label>',
                       '<input type="text" id="csftool-location-id" class="dialog-text location-id" placeholder="${editor-default-id}">',
                       '<div id="csftool-location-place"><label class="dialog-label">Place :</label>',
                       '<input type="text" id="csftool-location-address" class="dialog-text location-address"> </div>',
                       '<div id="csftool-location-coords">',
                       '<span class="dialog-label dialog-coord">Lat : </span>',
                       '<span id="csftool-location-lat" class="dialog-text dialog-coord"> </span>',
                       '<span class="dialog-label dialog-coord">, Long : </span>',
                       '<span id="csftool-location-lng" class="dialog-text dialog-coord"> </span>',
                       '</div> <!--close csftool-location-coords -->',
                       '</div> <!-- close csftool-location-editor-content -->'].join(''),
    editor_dom: { id: "#csftool-location-id", address: "#csftool-location-address",
                    lat: "#csftool-location-lat", lng: "#csftool-location-lng" },

    infoaddress: '</br><span class="loc-address">${address_component}</span>',
    infobubble: [ '<div class="locationInfobubble">',
                  '<span class="loc-id">${loc_obj_id}</span>',
                  '${loc_obj_address}',
                  '</br><span class="loc-coords">${loc_obj_lat} , ${loc_obj_lng}</span>', 
                  '</div>'].join(''),

    map_anchor: "#csftool-map-dialog-anchor",
    map_content: "#csftool-map-dialog-content",
    map_dialog_html: [ '<div id="csftool-map-dialog-content">',
                       '<div id="csftool-map-dialog-map" class="map-container"> </div>',
                       '</div> <!-- end of csftool-map-dialog-content -->'].join(''),
    map_element: "csftool-map-dialog-map",
}

// LOCATION DIALOG

var EditorDialog = {
    callbacks: { },
    container: null,
    editor_location: null,
    initialized: false,
    isopen: false,
    supported_events: ["cancel","close","delete","save","select"],

    clear: function() {
        var dom = DialogDOM.editor_dom;
        var loc_obj = this.editor_location;
        this.editor_location = null;
        delete loc_obj;
        jQuery(dom.id).val("");
        jQuery(dom.address).val("");
        jQuery(dom.lat).text("");
        jQuery(dom.lng).text("");
    },

    close: function() {
        jQuery(this.container).dialog("close");
        this.clear();
        this.isopen = false;
    },

    execCallback: function(event_type, info) {
        if (event_type in this.callbacks) {
            if (typeof info !== 'undefined') {
                this.callbacks[event_type](event_type, info);
            } else {
                var dom = DialogDOM.editor_dom;
                var _location = { id:jQuery(dom.id).val(), address:jQuery(dom.address).val(),
                                  lat:jQuery(dom.lat).val(), lng:jQuery(dom.lng).val() };
                this.callbacks[event_type](event_type, _location);
            }
        }
    },

    changes: function() {
        var after = this.getLocation();
        var before = this.getLocationBeforeEdit();
        var changed = false;
        var loc_obj = jQuery.extend({}, before);
        if (after.address != before.address) { loc_obj.address = after.address; changed = true; }
        if (after.lat != before.lat) { loc_obj.lat = after.lat; changed = true; }
        if (after.lng != before.lng) { loc_obj.lng = after.lng; changed = true; }
        if (after.id != before.id) { loc_obj.id = after.id; changed = true; }
        return [changed, loc_obj];
    },

    getLocation: function() {
        var dom = DialogDOM.editor_dom;
        var loc_obj = {
            address: jQuery(dom.address).val(),
            lat: this.editor_location.lat,
            lng: this.editor_location.lng,
            id: jQuery(dom.id).val()
        };
        //!TODO: add check for valid values for id and address
        return loc_obj
    },

    getLocationBeforeEdit: function() {
        var dom = DialogDOM.editor_dom;
        return { address: this.editor_location.address,
                 lat: this.editor_location.lat,
                 lng: this.editor_location.lng,
                 id: this.editor_location.id };
    },

    initializeDialog: function(dom_element) {
        // create map dialog
        var dom = DialogDOM;
        this.container = dom.editor_content;
        // initialze the location container html
        var editor_html = dom.editor_dialog_html.replace("${editor-default-id}", dom.editor_default_id);
        jQuery(dom_element).html(editor_html);
        var options = jQuery.extend({}, EditorDialogOptions);
        jQuery(this.container).dialog(options);
        this.initialized = true;
        return this;
    },

    open: function(loc_obj) {
        this.setLocation(loc_obj);
        jQuery("p.invalid-location-id").hide();
        jQuery(this.container).dialog("open");
        this.isopen = true;
        return false;
    },

    setLocation: function(loc_obj) {
        var dom = DialogDOM.editor_dom;
        var loc_obj = loc_obj;
        if (typeof loc_obj.id !== 'undefined') { jQuery(dom.id).val(loc_obj.id); } else { jQuery(dom.id).val(""); }
        if (typeof loc_obj.address !== 'undefined') { jQuery(dom.address).val(loc_obj.address); } else { jQuery(dom.address).val(""); }
        if (typeof loc_obj.lat !== 'undefined') { jQuery(dom.lat).text(loc_obj.lat.toFixed(6)); } else { jQuery(dom.lat).text(""); }
        if (typeof loc_obj.lng !== 'undefined') { jQuery(dom.lng).text(loc_obj.lng.toFixed(6)); } else { jQuery(dom.lng).text(""); }
        this.editor_location = jQuery.extend({}, loc_obj);
    },
}

var EditorDialogOptions = {
    appendTo: DialogDOM.editor_anchor,
    autoOpen:false,
    buttons: { Cancel: { "class": "csftool-loc-dialog-cancel", text:"Cancel",
                         click: function () { EditorDialog.close(); },
                   },
               Delete: { "class": "csftool-loc-dialog-delete", text:"Delete",
                         click: function () {
                             var loc_obj = EditorDialog.getLocation();
                             if (isValidPropertyName(loc_obj.id)) {
                                TheDialogContext.deleteLocation(loc_obj);
                             } else { delete loc_obj; }
                             EditorDialog.close();
                         },
                  },
               Save: { "class": "csftool-loc-dialog-save", text:"Save",
                       click: function () {
                           var loc_obj = EditorDialog.getLocation();
                           if (isValidPropertyName(loc_obj.id)) {
                               EditorDialog.close();
                               MapLocationManager.saveLocation(loc_obj);
                               EditorDialog.execCallback("save", loc_obj);
                           } else { jQuery("p.invalid-location-id").show(); }
                       },
                   },
               Select: { "class": "csftool-loc-dialog-select", text:"Select",
                         click: function () {
                             var changes = EditorDialog.changes();
                             var loc_obj = changes[1];
                             if (isValidPropertyName(loc_obj.id)) {
                                if (changes[0]) { // if changes[0] === true, then data was changed
                                     MapLocationManager.saveLocation(loc_obj);
                                 } else if (!(TheDialogContext.locationExists(loc_obj))) {
                                     MapLocationManager.saveLocation(loc_obj);
                                 }
                                 TheDialogContext.selectLocation(loc_obj);
                                 EditorDialog.execCallback("select", loc_obj);
                                 EditorDialog.close();
                             } else { jQuery("p.invalid-location-id").show(); }
                        },
                   },
             },
    close: function(event, ui) { EditorDialog.execCallback("close"); },
    draggable: true,
    minHeight: 50,
    minWidth: 450,
    modal: true,
    position: { my: "center center", at: "center center", of: DialogDOM.center_loc_on },
    title: "Confirm/Edit Location Information",
}

// MAP DIALOG & OPTIONS

var MapDialog = {
    callbacks: { }, // map event callbacks
    changed: false,
    container: null,
    current_marker: null,
    geocoder: null,
    google: null,
    height: null,
    icons: { },
    initialized: false,
    isopen: false,
    map: null,
    root_element: null,
    supported_events: ["close",],
    width: null,

    afterClose: function() { this.isopen = false; this.execCloseCallback(); },
    beforeClose: function() { if (EditorDialog.isopen) { EditorDialog.close(); } },

    centerMap: function(location_obj) {
        var center;
        if (typeof location_obj !== 'undefined') { center = this.locAsLatLng(location_obj);
        } else { center = this.locAsLatLng(); }
        this.map.panTo(center);
    },

    close: function() {
        this.beforeClose();
        jQuery(this.container).dialog("close");
        this.afterClose();
    },

    execCloseCallback: function(changed) {
        if ("close" in this.callbacks) {
            var context = TheDialogContext.publicContext();
            context["changed"] = TheDialogContext.changed;
            this.callbacks["close"]("close",  context);
        }
    },

    initializeDialog: function(dom_element) {
        // create map dialog
        var dom = DialogDOM;
        // initialze the map container html
        jQuery(dom_element).html(dom.map_dialog_html);
        this.root_element = dom_element;

        var options = jQuery.extend({}, MapDialogOptions);
        if (this.height) { options.minHeight = this.height; }
        if (this.width) { options.minWidth = this.width }
        this.container = dom.map_content;
        jQuery(this.container).dialog(options);

        this.initialized = true;
        return this;
    },

    initializeGoogle: function(google) {
        this.google = google;
        // set the options that are dependent of Google Maps being ready
        MapOptions.mapTypeControlOptions = { style: this.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                                              position: this.google.maps.ControlPosition.TOP_RIGHT };
        MapOptions.mapTypeId = this.google.maps.MapTypeId.ROADMAP;
        MapOptions.zoomControlOptions = { style: this.google.maps.ZoomControlStyle.SMALL,
                                          position: this.google.maps.ControlPosition.TOP_LEFT };
    },

    initializeMap: function(loc_obj) {
        var map_loc;
        var options = jQuery.extend( {}, MapOptions);
        if (this.height) { options.minHeight = this.height; }
        if (this.width) { options.minWidth = this.width }
        var the_context = TheDialogContext;

        if (loc_obj) {
            if (typeof loc_obj === 'string') {
                map_loc = the_context.getLocation(loc_obj);
            } else if (the_context.locationExists(loc_obj)) {
                map_loc = the_context.getLocation(loc_obj);
            } else { map_loc = MapLocationManager.createLocation(loc_obj); }
        } else { map_loc = undefined; }
        // if no location was passed, show default location at center
        if (typeof map_loc === 'undefined') {
            if (the_context.locationExists("default")) {
                map_loc = the_context.getLocation("default");
            } else { map_loc = MapLocationManager.createDefaultLocation(); }
        }
        options.center = map_loc.marker.getPosition();
        this.map = new this.google.maps.Map(document.getElementById(DialogDOM.map_element), options);
        jQuery.each(the_context.locations, function(event_type, loc_obj) { loc_obj.marker.setMap(MapDialog.map) });
        this.google.maps.event.addListener(this.map, 'click', function(ev) { MapLocationManager.createLocation(ev.latLng); });
        if (this.geocoder == null) { this.geocoder = new this.google.maps.Geocoder(); }
    },

    locAsLatLng: function(location_obj) {
        var loc;
        var the_context = TheDialogContext;
        if (typeof location_obj !== 'undefined') { loc = location_obj;
        } else if (the_context.selected_location == null) { loc = the_context.default_location;
        } else { loc = the_context.selected_location; }
        return new this.google.maps.LatLng(loc.lat, loc.lng);
    },

    open: function(loc_obj) {
        if (this.isopen) { this.close(); }
        if (this.initialized != true) { this.initializeDialog(this.root_element); }
        jQuery(this.container).dialog("open");
        this.initializeMap(loc_obj);
        this.isopen = true;
        TheDialogContext.changed = false;
        return false;
    },

    removeCallback: function(event_type) { if (event_type in this.callbacks) { delete this.callbacks[event_type]; } },

    setCallback: function(event_type, function_to_call) {
        var index = this.supported_events.indexOf(event_type);
        if (index >= 0) { this.callbacks[event_type] = function_to_call; }
    },

    setDimension: function(dim, size) {
        if (dim == "height") { this.height = size;
        } else if (dim == "width") { this.width = size; }
    },
}

var MapDialogOptions = { appendTo: DialogDOM.map_anchor, autoOpen:false,
    beforeClose: function(event, ui) { MapDialog.beforeClose(); },
    buttons: { Done: { "class": "csftool-map-dialog-close", text:"Done",
                        click: function () { MapDialog.close(); }
                     }
    },
    close: function(event, ui) { MapDialog.afterClose(); },
    draggable: true,
    minHeight: 400,
    minWidth: 400,
    modal: true,
    position: { my: "center center", at: "center center", of: DialogDOM.center_map_on },
    resizable: false,
    title: "Location Map Dialog",
}

var MapOptions = {
    backgroundColor: "white",
    center: null,
    disableDefaultUI: true,
    disableDoubleClickZoom: true,
    draggable: true,
    enableAutocomplete: false,
    //enableReverseGeocode: true,
    mapTypeControl: true,
    mapTypeControlOptions: null,
    mapTypeId: null,
    maxZoom: 18,
    minZoom: 6,
    scaleControl: false,
    scrollwheel: true,
    streetViewControl: false,
    zoom: 7,
    zoomControl: true,
    zoomControlOptions: null,
}

// MANAGE MAP LOCATIONS/MARKERS

var MapLocation = {
    id:null,
    address:null,
    infowindow: null,
    lat: null, lng:null,
    marker:null
}

var MarkerOptions = {
    clickable:true,
    draggable:false,
    icon:null,
    map:null,
    position:null,
    title:"New Marker"
}

var MapLocationManager = {

    addLocation: function(loc_obj) { TheDialogContext.locations[loc_obj.id] = jQuery.extend({}, MapLocation, loc_obj); },
    addLocations: function(locations) { jQuery.each(locations, function(id, loc) { TheDialogContext.locations[id] = jQuery.extend({}, MapLocation, loc); }); },
    createDefaultLocation: function() { return this.createLocation(TheDialogContext.default_location); },

    createLocation: function(loc_data) {
        var place = jQuery.extend({}, MapLocation);
        if (loc_data instanceof MapDialog.google.maps.LatLng) {
            place.lat = loc_data.lat();
            place.lng = loc_data.lng();
            var callback =
                (function(place) { var place = place; return function(result, status) {
                        if (status === MapDialog.google.maps.GeocoderStatus.OK && result.length > 0) {
                            place.address = result[0].formatted_address;
                        } else { place.address = "Unable to decode lat/lng to physical address."; }
                        EditorDialog.open(place);
                    }
                })(place);
            MapDialog.geocoder.geocode( { latLng: loc_data }, callback);

        } else { return this.saveLocation(jQuery.extend(place, loc_data)); }
    },

    saveLocation: function(loc_obj) {
        var loc_obj = loc_obj;
        var dialog = MapDialog;
        var content, marker, marker_ops;
        if (typeof loc_obj.infowindow !== 'undefined') {
            infowindow = loc_obj.infowindo;
            delete infowindo;
            loc_obj.infowindo = null;
        }
        content = (function(loc_obj) {
                var template = DialogDOM.infobubble;
                template = template.replace("${loc_obj_id}", loc_obj.id);
                template = template.replace("${loc_obj_lat}", loc_obj.lat.toFixed(5));
                template = template.replace("${loc_obj_lng}", loc_obj.lng.toFixed(5));

                var index = loc_obj.address.indexOf(", USA");
                if (index > 0) { loc_obj.address = loc_obj.address.replace(", USA",""); }
                var parts = loc_obj.address.split(", ");
                if (parts.length > 1) {
                    var address;
                    address = DialogDOM.infoaddress.replace("${address_component}", parts[0]);
                    address = address + 
                              DialogDOM.infoaddress.replace("${address_component}", parts.slice(1).join(", "));
                    return template.replace("${loc_obj_address}", address);
                } else { return template.replace("${loc_obj_address}", loc_obj.address); }
            })(loc_obj);
        var infowindow = new dialog.google.maps.InfoWindow({ content: content});
        loc_obj.infowindow = infowindow;
        marker_ops = jQuery.extend({}, MarkerOptions);
        marker_ops.map = dialog.map;
        marker_ops.position = dialog.locAsLatLng(loc_obj);
        marker_ops.title = loc_obj.id;
        marker = loc_obj.marker = new dialog.google.maps.Marker(marker_ops); 
        marker.addListener('mouseover', function() { infowindow.open(MapDialog.map, marker); });
        marker.addListener('mouseout', function() { infowindow.close(); });
        marker.addListener('click', function() { EditorDialog.open(loc_obj) });
        TheDialogContext.saveLocation(loc_obj);
        return loc_obj;
    },
}

var jQueryDialogProxy = function() {
    if (arguments.length == 1) {
        var arg = arguments[0];
        switch(arg) {
            case "close": MapDialog.close(); break;
            case "context": return TheDialogContext.publicContext(); break;
            case "locations": return TheDialogContext.publicLocations(); break;
            case "open": MapDialog.open(); break;
            case "selected": return TheDialogContext.baseLocation("selected"); break;
        }
    } else {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        switch(arg_0) {

            case "bind": 
                if (arguments.length == 3) { MapDialog.setCallback(arg_1, arguments[2]);
                } else { var callbacks = arg_1;
                    jQuery.each(callbacks, function(event_type, callback) {
                                MapDialog.setCallback(event_type, callback);
                                });
                }
                break;
            case "height": case "width": MapDialog.setDimension(arg_0, arg_1); break;
            case "google": MapDialog.initializeGoogle(arg_1); break;
            case "location":
                if (typeof arg_1 === 'string') { return TheDialogContext.getLocation(arg_1);
                } else { TheDialogContext.selectLocation(arg_1); }
                break;
            case "locations": return MapLocationManager.addLocations(arg_1); break;
            case "open": MapDialog.open(arg_1); break;
            case "title": MapDialog.setTitle(arg_1); break;
        }
    }
    return undefined;
}

jQuery.fn.CsfToolLocationDialog = function(options) {
    if (typeof options !== 'undefined') {
        jQuery.each(options, function(key, value) {
            jQueryDialogProxy(key, value);
        });
    } else {
        var dom_element = this.get(0);
        TheDialogContext.initializeDialogs(dom_element);
        return jQueryDialogProxy;
    }
}

})(jQuery);

