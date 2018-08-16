
;(function(jQuery) {

var isValidPropertyName = function(text) {
    var valid = /^[0-9a-zA-Z_]+$/;
    return valid.test(text);
}

var TheDialogContext = {
    changed: false,
    default_location: { address:"Cornell University, Ithaca, NY", lat:42.45, lng:-76.48, id:"default" },
    hidden_location_attrs: ["infowindow", "marker"],
    initialized: false,
    initial_location: null, // id of the location/marker selected when the dialog was opened
    locations: { }, // dictionary of all locations on the map
    selected_location: null, // id of the last location/marker selected

    baseLocation: function(loc_obj) {
        var loc_obj = loc_obj;
        if (typeof loc_obj === 'string') {
            if (loc_obj == 'initial') {
                loc_obj = this.locations[this.initial_location];
            } else if (loc_obj == 'selected') {
               loc_obj = this.locations[this.selected_location];
            } else { loc_obj = this.locations[loc_obj]; }
        }
        if (loc_obj) {
            var base_loc = { };
            var hidden = this.hidden_location_attrs;
            jQuery.each(loc_obj, function(key, value) {
                if (hidden.indexOf(key) < 0) { base_loc[key] = value; }
            });
            return base_loc;
        } else { return undefined; }
    },

    deleteLocation: function(loc_obj) {
        var loc_obj = this.locations[loc_obj.id];
        if (typeof loc_obj !== 'undefined') {
            var stuff;
            console.log("request to delete location : " + loc_obj.address);
            loc_obj.marker.setMap(null);
            stuff = loc_obj.infowindow;
            delete stuff;
            loc_obj.infowindow = null;
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
        if (this.selected_location != null) {
            return this.locations[this.selected_location];
        }
        return this.locations["default"];
    },

    initializeDialogs: function(dom_element) {
        var dom = DialogDOM;
        console.log("TheDialogContext.initializeDialogs() was called");
        // this.google.maps.controlStyle = 'azteca'; // use pre v3.21 control set
        jQuery(dom_element).html(dom.dialog_html); // initialze the container for all dialogs
        dom.container = dom_element;
        console.log("dialog root html installed in : " + dom.container);

        // create map dialog
        MapDialog.initializeDialog(dom.map_anchor);
        // create location editor dialog
        EditorDialog.initializeDialog(dom.editor_anchor);

        this.initialized = true;
        return this;
    },

    locationExists: function(loc_obj) {
        return typeof this.locations[loc_obj.id] !== 'undefined';
    },

    publicContext: function() {
        return { initial_location: this.baseLocation("initial"),
                 all_locations: this.publicLocations(),
                 selected_location: this.baseLocation("selected"),
               }
    },

    publicLocation: function(loc_obj) {
        return this.baseLocation(this.getLocation(loc_obj));
    },

    publicLocations: function() {
        var locations = { };
        jQuery.each(this.locations, function(id, loc) {
                    locations[id] = { address:loc.address, id:loc.id, lat:loc.lat, lng:loc.lng }
        });
        return locations;
    },

    saveLocation: function(loc_obj, changed) {
        console.log("request to save location : " + loc_obj.address);
        this.locations[loc_obj.id] = jQuery.extend({}, loc_obj);
        if (typeof changed === 'undefined') { this.changed = false; } else { this.changed = changed; }
    },

    selectLocation: function(loc) {
        //TODO: make sure the map gets updated
        //      previous selected gets generic icon
        //      new location gets selected icon
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
            console.log("executing call back for " + event_type + " event");
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
        console.log("EditorDialog.initializeDialog() was called");
        // initialze the location container html
        var editor_html = dom.editor_dialog_html.replace("${editor-default-id}", dom.editor_default_id);
        jQuery(dom_element).html(editor_html);
        console.log("location editor html installed in : " + dom_element);
        var options = jQuery.extend({}, EditorDialogOptions);
        jQuery(this.container).dialog(options);
        this.initialized = true;
        return this;
    },

    open: function(loc_obj) {
        console.log("EditorDialog.open() was called");
        this.setLocation(loc_obj);
        console.log("attempting to open dialog at " + this.container);
        jQuery("p.invalid-location-id").hide();
        jQuery(this.container).dialog("open");
        this.isopen = true;
        return false;
    },

    setLocation: function(loc_obj) {
        var dom = DialogDOM.editor_dom;
        var loc_obj = loc_obj;
        console.log("EditorDialog.setLocation() was called");
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
                         click: function () {
                             console.log("EditorDialog CANCEL button clicked");
                             EditorDialog.close();
                         },
                   },
               Delete: { "class": "csftool-loc-dialog-delete", text:"Delete",
                         click: function () {
                             console.log("EditorDialog DELETE button clicked");
                             var loc_obj = EditorDialog.getLocation();
                             if (isValidPropertyName(loc_obj.id)) {
                                console.log("attempting to delete location " + loc_obj.id);
                                TheDialogContext.deleteLocation(loc_obj);
                             } else { delete loc_obj; }
                             EditorDialog.close();
                         },
                  },
               Save: { "class": "csftool-loc-dialog-save", text:"Save",
                       click: function () {
                           console.log("EditorDialog SAVE button clicked");
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
                             console.log("EditorDialog SELECT button clicked");
                             var changes = EditorDialog.changes();
                             var loc_obj = changes[1];
                             if (isValidPropertyName(loc_obj.id)) {
                                if (changes[0]) { // if changes[0] === true, then data was changed
                                     MapLocationManager.addLocation(loc_obj);
                                 } else if (!(TheDialogContext.locationExists(loc_obj))) {
                                     MapLocationManager.addLocation(loc_obj);
                                 }
                                 TheDialogContext.selectLocation(loc_obj);
                                 EditorDialog.execCallback("select", loc_obj);
                                 EditorDialog.close();
                             } else { jQuery("p.invalid-location-id").show(); }
                        },
                   },
             },
    close: function(event, ui) {
        console.log("trying to close LOCATION dialog");
        EditorDialog.execCallback("close");
    },
    draggable: true,
    minHeight: 50,
    minWidth: 450,
    modal: true,
    position: { my: "center center", at: "center center", of: DialogDOM.center_loc_on },
    title: "Confirm/Edit Location Information",
}

// MAP DIALOG & OPTIONS

var restrictMapBounds = function() {
    var map_bounds = MapDialog.map_bounds;
    if (!(map_bounds == null)) {
        var lat = null, lng = null;
        var map = MapDialog.map;
        var bounds = map.getBounds();
        var center = bounds.getCenter();
        var map_ne = map_bounds.getNorthEast();
        var map_sw = map_bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        var sw = bounds.getSouthWest();
        if (sw.lng() < map_sw.lng()) { lng = map_sw.lng() + ((sw.lng() - ne.lng()) / 2.); } 
        else if (ne.lng() > map_ne.lng()) { lng = map_ne.lng() - ((sw.lng() - ne.lng()) / 2.); }
        if (sw.lat() < map_sw.lat()) { lat = map_sw.lat() + ((ne.lat() - sw.lat()) / 2.); }
        else if (ne.lat() > map_ne.lat()) { lat = map_ne.lat() - ((ne.lat() - sw.lat()) / 2.); }

        if (lat != null) {
            if (lng != null) { map.setCenter(new google.maps.LatLng(lat,lng)); } 
            else { map.setCenter(new google.maps.LatLng(lat, center.lng())); }
            console.log("GOOGLE MAPS :: map bounds restricted : " + map.getBounds());
        } else {
            if (lng != null) {
                map.setCenter(new google.maps.LatLng(center.lat(),lng));
                console.log("GOOGLE MAPS :: map bounds restricted : " + map.getBounds());
            }
        } 
    }
}

var MapDialog = {
    callbacks: { }, // map event callbacks
    changed: false,
    container: null,
    current_marker: null,
    default_center: {lat:43.2,lng:-74.17},
    geocoder: null,
    google: null,
    height: null,
    icons: { },
    initialized: false,
    isopen: false,
    map: null,
    map_bounds: null,
    map_center: null,
    root_element: null,
    supported_events: ["close",],
    width: null,
    zoom: null,

    afterClose: function() {
        console.log("     afterClose function called");
        this.isopen = false;
        this.execCloseCallback();
    },

    beforeClose: function() {
        console.log("     beforeClose function called");
        if (EditorDialog.isopen) { 
            console.log("an editor dialog is open");
            EditorDialog.close();
        }
    },

    centerMap: function(location_obj) {
        var center;
        if (typeof location_obj !== 'undefined') { center = this.locAsLatLng(location_obj);
        } else { center = this.locAsLatLng(); }
        this.map.panTo(center);
    },

    close: function() {
        console.log("LOCATION DIALOG :: trying to close locaiton dialog");
        this.beforeClose();
        console.log("     telling jQuery to close the dialog");
        jQuery(this.container).dialog("close");
        this.afterClose();
    },

    execCloseCallback: function(changed) {
        console.log("     execCloseCallback function called : callback exists : " + ("close" in this.callbacks));
        if ("close" in this.callbacks) {
            var context = TheDialogContext.publicContext();
            context["changed"] = TheDialogContext.changed;
            this.callbacks["close"]("close",  context);
        }
    },

    initializeDialog: function(dom_element) {
        // create map dialog
        var dom = DialogDOM;
        console.log("MAP DIALIG :: initializeDialog() was called");

        // initialze the map container html
        jQuery(dom_element).html(dom.map_dialog_html);
        this.root_element = dom_element;
        console.log("MAP DIALOG :: html installed in : " + this.root_element);

        var options = jQuery.extend({}, MapDialogOptions);
        if (this.height) { options.minHeight = this.height; }
        if (this.width) { options.minWidth = this.width }
        this.container = dom.map_content;
        jQuery(this.container).dialog(options);

        this.zoom = MapOptions.zoom;
        this.initialized = true;
        return this;
    },

    initializeGoogle: function(google) {
        console.log("MAP DIALOG :: initializing Google : " + google);
        this.google = google;
        // set the options that are dependent of Google Maps being ready
        MapOptions.mapTypeControlOptions = { style: this.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                                              position: this.google.maps.ControlPosition.TOP_RIGHT };
        MapOptions.mapTypeId = this.google.maps.MapTypeId.ROADMAP;
        MapOptions.zoomControlOptions = { style: this.google.maps.ZoomControlStyle.SMALL,
                                          position: this.google.maps.ControlPosition.TOP_LEFT };
        this.map_center = new this.google.maps.LatLng(this.default_center);
    },

    initializeMap: function(loc_obj) {
        var map_loc;
        var options = jQuery.extend( {}, MapOptions);
        if (this.height) { options.minHeight = this.height; }
        if (this.width) { options.minWidth = this.width }
        options.zoom = this.zoom;
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
            console.log("NO LOCATION PASSED");
            if (the_context.locationExists("default")) {
                map_loc = the_context.getLocation("default");
            } else { map_loc = MapLocationManager.createDefaultLocation(); }
        }
        console.log("    initial location " + map_loc.address);
        console.log("            marker : " + map_loc.marker);
        the_context.initial_location = map_loc.id;
        the_context.selected_location = map_loc.id;
        //options.center = map_loc.marker.getPosition();
        options.center = this.map_center;
        this.map = new this.google.maps.Map(document.getElementById(DialogDOM.map_element), options);
        console.log("    added map : " + this.map);
        var map_dialog = this;
        jQuery.each(the_context.locations, function(event_type, loc_obj) {
               console.log("    setting map for " + loc_obj.id);
               map_dialog.mappableLocation(loc_obj);
               }
        );
        // don't waste time generating urls that will never be used
        this.google.maps.event.clearListeners(this.map, 'url_changed');
        // create new location onclick events
        console.log("    adding map click event listener to " + this.map);

        this.google.maps.event.addListener(this.map, 'click', function(ev) {
            console.log("click event callback : " + ev.toString());
            MapLocationManager.createLocation(ev.latLng);
        });

        // when set, restrict viewing area to map bounds
        if (this.map_bounds != null) {
            this.google.maps.event.addListener(this.map, "dragstart", function() {
                console.log("    adding 'center_changed' listener to " + MapDialog.map);
                MapDialog.google.maps.event.addListener(MapDialog.map, "center_changed", restrictMapBounds);
            });
            this.google.maps.event.addListener(this.map, "dragend", function() {
                console.log("    removing 'center_changed' listeners from " + MapDialog.map);
                MapDialog.google.maps.event.clearListeners(MapDialog.map, "center_changed");
            });
        } else {
            this.google.maps.event.addListener(this.map, "dragend", function() {
                MapDialog.map_center = MapDialog.map.getBounds().getCenter();
            });
        }
        this.google.maps.event.addListener(this.map, "zoom_changed", function() {
            MapDialog.map_center = MapDialog.map.getBounds().getCenter();
            MapDialog.zoom = MapDialog.map.getZoom();
        });

        console.log("    google map created ... " + this.map);
        if (this.geocoder == null) {
            this.geocoder = new this.google.maps.Geocoder();
            console.log("    gecoder created");
        }
    },

    locAsLatLng: function(location_obj) {
        var loc;
        var the_context = TheDialogContext;
        if (typeof location_obj !== 'undefined') { loc = location_obj;
        } else if (the_context.selected_location == null) { loc = the_context.default_location;
        } else { loc = the_context.selected_location; }
        return new this.google.maps.LatLng(loc.lat, loc.lng);
    },

    mappableLocation: function(loc_obj) {
        if (loc_obj.marker == null) { MapLocationManager.createMarker(loc_obj);
        } else { loc_obj.marker.setMap(MapDialog.map); }
        if (loc_obj.infowindow == null) { MapLocationManager.createInfoWindow(loc_obj); }
    },

    open: function(loc_obj) {
        console.log("MAP DIALOG :: attempting to open MAP dialog");
        if (this.isopen) { this.close(); }
        if (this.initialized != true) { this.initializeDialog(this.root_element); }
        jQuery(this.container).dialog("open");
        this.initializeMap(loc_obj);
        this.isopen = true;
        TheDialogContext.changed = false;
        return false;
    },

    removeCallback: function(event_type) { if (event_type in this.callbacks) { delete this.callbacks[event_type]; } },

    setBounds: function(s_lat, w_lng, n_lat, e_lng) {
        console.log("LOCATION DIALOG :: setting map bounds : " + s_lat + "," + w_lng + " : " + n_lat + "," + e_lng);
        var sw = new this.google.maps.LatLng(s_lat, w_lng);
        var ne = new this.google.maps.LatLng(n_lat, e_lng);
        this.map_bounds = new this.google.maps.LatLngBounds(sw, ne);
        console.log("    bounds object : " + this.map_bounds);
        //this.bounds = { sw: { lat: s_lat, lng: w_lng }, ne: { lat: n_lat, lng: e_lng }, };
    },

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
    zoom: 6,
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

    addLocation: function(loc_obj) {
        var loc_obj = jQuery.extend({}, MapLocation, loc_obj);
        // add a marker
        loc_obj = this.createMarker(loc_obj);
        // create an info window and add a click event listener to display it
        loc_obj = this.createInfoWindow(loc_obj);
        // add this location to the context manager
        console.log("NEW LOCATION : " + loc_obj.address);
        TheDialogContext.saveLocation(loc_obj);
        return loc_obj;
    },

    addLocations: function(locations) {
        jQuery.each(locations, function(id, loc) {
            TheDialogContext.locations[id] = jQuery.extend({}, MapLocation, loc);
        });
    },

    createDefaultLocation: function() { return this.createLocation(TheDialogContext.default_location); },

    createInfoWindow: function(loc_obj) {
         var content, infowindow;
        // clear old inforwindow when present
        if (typeof loc_obj.infowindow !== 'undefined') {
            infowindow = loc_obj.infowindow;
            delete infowindow;
            loc_obj.infowindow = null;
        }
        // create a new infowindow based on input location
        content = (function(loc_obj) {
                console.log("for infowindow " + loc_obj.lat);
                console.log("for infowindow " + loc_obj.lng);
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
        infowindow = new MapDialog.google.maps.InfoWindow({ content: content});
        loc_obj.infowindow = infowindow;

        // add listeners to display/hide info window
        var marker = loc_obj.marker
        marker.addListener('mouseover', function() { infowindow.open(MapDialog.map, marker); });
        marker.addListener('mouseout', function() { infowindow.close(); });
        return loc_obj;
    },

    createLocation: function(loc_data) {
        var place = jQuery.extend({}, MapLocation);

        if (loc_data instanceof MapDialog.google.maps.LatLng) {
            console.log("creating map location from google.maps.LatLng");
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

        } else {
            var loc_obj = jQuery.extend(place, loc_data);
            // add a marker
            loc_obj = this.createMarker(loc_obj);
            // create an info window and add a click event listener to display it
            loc_obj = this.createInfoWindow(loc_obj);
            // add this location to the location tracker
            TheDialogContext.saveLocation(loc_obj, true);
            console.log("NEW LOCATION : " + loc_obj.address);
            return loc_obj;
        }
    },

    createMarker: function(loc_obj) {
        var dialog = MapDialog;
        var marker, marker_ops;
        // create a marker for the location
        marker_ops = jQuery.extend({}, MarkerOptions);
        marker_ops.map = dialog.map;
        marker_ops.position = dialog.locAsLatLng(loc_obj);
        marker_ops.title = loc_obj.id;
        marker = new dialog.google.maps.Marker(marker_ops);
        marker.addListener('click', function() { EditorDialog.open(loc_obj) });
        loc_obj.marker = marker;
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
    } else if (arguments.length == 2) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        switch(arg_0) {

            case "bind": // bind a list of callbacks
                 var callbacks = arg_1;
                 jQuery.each(callbacks, function(event_type, callback) { MapDialog.setCallback(event_type, callback); });
                 break;

            case "bounds": MapDialog.setBounds(arg_1[0], arg_1[1], arg_1[2], arg_1[3]); break;
            case "default": TheDialogContext.default_location = arg_1; break;
            case "height": case "width": MapDialog.setDimension(arg_0, arg_1); break;

            case "google": // init google map
                 console.log("OPTION :: setting Google API");
                 MapDialog.initializeGoogle(arg_1);
                 break;

            case "location":
                // when string, return the location info
                if (typeof arg_1 === 'string') {
                    return TheDialogContext.getLocation(arg_1);
                // when object, set the selected location
                } else { TheDialogContext.selectLocation(arg_1); }
                break;

            case "locations": return MapLocationManager.addLocations(arg_1); break;
            case "open": MapDialog.open(arg_1); break;
            case "title": MapDialog.setTitle(arg_1); break;
        }
    } else if (arguments.length == 3) {
        if (arguments[0] == "bind") { MapDialog.setCallback(arguments[1], arguments[2]); 
        } else if (arguments[0] == "bounds") { var sw = arguments[1]; var ne = arguments[2]; MapDialog.setBounds(sw[0],sw[1],ne[0],ne[1]); }
    } else if (arguments.length == 5) {
            if (arguments[0] == "bounds") { MapDialog.setBounds(arguments[1], arguments[2], arguments[3], arguments[4]); }
    }
    return undefined;
}

jQuery.fn.CsfToolLocationDialog = function(options) {
    if (typeof options !== 'undefined') {
        jQuery.each(options, function(key, value) {
            jQueryDialogProxy(key, value);
        });
    } else {
        console.log("jQuery.fn.CsfToolLocationDialog :: initializing map dialog");
        var dom_element = this.get(0);
        TheDialogContext.initializeDialogs(dom_element);
        return jQueryDialogProxy;
    }
}

})(jQuery);

