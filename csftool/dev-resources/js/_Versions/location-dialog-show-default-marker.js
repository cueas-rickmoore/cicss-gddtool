
(function() {

var AllDialogsContext = {
    default_location: { description:"Cornell University, Ithaca, NY", lat:42.45, lng:-76.48, name:"default" },
    initialized: false,
    initial_location: null, // the location selected when the dialog was opened
    locations: [ ],
    selected_location: null, // the last location chosen
}

var AllDialogsController = {

    initializeDialogs: function(dom_element, location_obj) {
        var dom = DialogDOM;
        console.log("initializeDialog() was called");
        // google.maps.controlStyle = 'azteca'; // use pre v3.21 control set
        jQuery(dom_element).html(dom.dialog_html); // initialze the container for all dialogs
        dom.container = dom_element;
        console.log("dialog root html installed in : " + dom.container);

        if (typeof location_obj !== 'undefined') { this.setLocation(location_obj);
        } else { this.setLocation(AllDialogsContext.default_location); }
        // create map dialog
        MapDialogController.initializeDialog(dom.map_anchor);

        AllDialogsContext.initialized = true;
        return this;
    },

    saveLocation: function() {
        var dom = DialogDOM.location_dom;
        var _location = { name:jQuery(dom.name).val(), description:jQuery(dom.description).val(),
                          lat:jQuery(dom.lat).val(), lng:jQuery(dom.lng).val() };
        console.log("request to save location : " + _location.description);
    },

    setLocation: function(location_object) {
        var new_location = jQuery.extend({}, location_object);
        var dom = DialogDOM.location_dom;
        jQuery(dom.description).val(new_location.description);
        jQuery(dom.lat).val(new_location.lat);
        jQuery(dom.lng).val(new_location.lng);
        jQuery(dom.name).val(new_location.name);
        MapContext.current_location = new_location;
        AllDialogsContext.selected_location = new_location;
    },
}

var DialogDOM = {
    center_loc_on:"#csftool-map-dialog-map",
    center_map_on:"#csftool-content",

    container: null,

    dialog_html: [ '<div id="csftool-location-dialogs">',
                   '<div id="csftool-map-dialog-anchor">',
                   '</div> <!-- end of csftool-map-dialog-anchor -->',
                   '<div id="csftool-location-dialog-anchor">',
                   '</div> <!-- close csftool-location-dialog-anchor -->',
                   '</div> <!-- end of csftool-location-dialogs -->'].join(''),

    loc_anchor: "#csftool-location-dialog-anchor",
    loc_content: "#csftool-location-dialog-content",
    loc_dialog_html: [ '<div id="csftool-location-dialog-content">',
                       '<div id="csftool-location-coords">',
                       '<label class="dialog-label">Name :</label>',
                       '<input type="text" id="csftool-location-name" class="dialog-text location-name">',
                       '<label class="dialog-label dialog-coord">Lat :</label>',
                       '<input id="csftool-location-lat" class="dialog-text dialog-coord" type="text">',
                       '<label class="dialog-label dialog-coord">Long :</label>',
                       '<input id="csftool-location-lng" class="dialog-text dialog-coord" type="text">',
                       '</div> <!--close csftool-location-coords -->',
                       '<div id="csftool-location-place"><label class="dialog-label">Place :</label>',
                       '<input type="text" id="csftool-location-address" class="dialog-text location-address"> </div>',
                       '</div> <!-- close csftool-location-dialog-content -->'].join(''),
    location_dom: { name: "#csftool-location-name", description: "#csftool-location-address",
                    lat: "#csftool-location-lat", lng: "#csftool-location-lng" },

    map_anchor: "#csftool-map-dialog-anchor",
    map_content: "#csftool-map-dialog-content",
    map_dialog_html: [ '<div id="csftool-map-dialog-content">',
                       '<div id="csftool-map-dialog-map" class="map-container"> </div>',
                       '</div> <!-- end of csftool-map-dialog-content -->'].join(''),
    map_element: "csftool-map-dialog-map",
}

// LOCATION DIALOG

var LocationDialogContext = {
    callbacks: { },
    container: null,
    initialized: false,
    supported_events: ["cancel","close","save"],
}

var LocationDialogController = {

    close: function() { jQuery(LocationDialogContext,container).dialog("close"); },

    execCallback: function(event_type, info) {
        var context = LocationDialogContext;
        if (event_type in context.callbacks) {
            console.log("executing call back for " + event_type + " event");
            if (typeof info !== 'undefined') {
                context.callbacks[event_type](event_type, info);
            } else {
                var dom = DialogDOM.location_dom;
                var _location = { name:jQuery(dom.name).val(), description:jQuery(dom.description).val(),
                                  lat:jQuery(dom.lat).val(), lng:jQuery(dom.lng).val() };
                context.callbacks[event_type](event_type, _location);
            }
        }
    },

    initializeDialog: function(dom_element) {
        // create map dialog
        var dom = DialogDOM;
        LocationDialogContext.container = dom.loc_content;
        console.log("LocationDialogController.initializeDialog() was called");
        // initialze the location container html
        jQuery(dom_element).html(dom.loc_dialog_html);
        console.log("location dialog html installed in : " + dom_element);
        var options = jQuery.extend({}, LocationDialogOptions);
        jQuery(LocationDialogContext.container).dialog(options);
        LocationDialogContext.initialized = true;
        return this;
    },
}

var LocationDialogOptions = {
    buttons: { Cancel: { "class": "csftool-loc-dialog-cancel", text:"Cancel",
                         click: function () {
                             console.log("LocationDialog CANCEL button clicked");
                             jQuery(LocationDialogContext.container).dialog("close");
                             }
                       },
               Save: { "class": "csftool-loc-dialog-save", text:"Save",
                       click: function () {
                           console.log("LocationDialog SAVE button clicked");
                           AllDialogsController.saveLocation();
                           LocationDialogController.execCallback("save");
                           jQuery(LocationContext.container).dialog("close");
                           }
                     }
             },
    close: function(event, ui) {
        console.log("LocationDialog CLOSED");
        LocationDialogController.execCallback("close");
    },
    draggable: true,
    minHeight: 50,
    minWidth: 450,
    modal: true,
    position: { my: "center center", at: "center center", of: DialogDOM.center_loc_on },
    title: "Confirm/Edit Location Information",
}

// MAP CONTROLLER & OPTIONS

var MapContext = {
    geocoder: null,
    icons: { },
    initialized: false,
    map: null,
    markers: [ ],
    current_location: null,
}

var MapController = {

    addMarker: function(gmapLatLng, location) {
        var marker;
        if (typeof location !== 'undefined') {
            marker = new Marker(gmapLatLng, location);
        } else { 
            var address;
            MapContext.geocoder.geocode( { latLng: gmapLatLng },
                function(result, status) {
                    //!TODO : figure out how to make this work
                });
            marker = new Marker(gmapLatLng, { name:"", description:address });
        }
        marker.marker.setMap(MapContext.map);
        MapContext.markers.push(marker);
    },

    centerMap: function(location_obj) {
        var center;
        if (typeof location_obj !== 'undefined') { center = this.locAsLatLng(location_obj);
        } else { center = this.locAsLatLng(); }
        MapContext.map.panTo(center);
    },

    initMap: function(location_obj) {
        if (typeof location_obj !== 'undefined') {
            MapOptions.center = this.locAsLatLng(location_obj);
        } else if (MapContext.current_location != null) {
            MapOptions.center = this.locAsLatLng(MapContext.current_location);
        } else { MapOptions.center = this.locAsLatLng(AllDialogsContext.default_location);
        }
        
        MapContext.map = new google.maps.Map(document.getElementById(DialogDOM.map_element), MapOptions);
        google.maps.event.addListener(MapContext.map, 'click', function(ev) {
            var marker = new google.maps.Marker({ position: ev.latLng, map: MapContext.map });
        });
        google.maps.event.addListener(MapContext.map, 'rightclick', function(ev) {
            console.log("right click event");
        });
        console.log("google map created ... " + MapContext.map);
        if (MapContext.geocoder == null) {
            //MapContext.geocoder = new google.maps.Geocoder();
            //console.log("gecoder created");
        }
    },

    locAsLatLng: function(location_obj) {
        var loc;
        if (typeof location_obj !== 'undefined') {
            loc = location_obj;
        } else if (AllDialogsContext.selected_location == null) {
            loc = AllDialogsContext.default_location;
        } else {
            loc = AllDialogsContext.selected_location;
        }
        return new google.maps.LatLng(loc.lat, loc.lng);
    }
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
    mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                             position: google.maps.ControlPosition.TOP_RIGHT },
    mapTypeId: google.maps.MapTypeId.HYBRID,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    maxZoom: 18,
    minZoom: 5,
    scaleControl: false,
    scrollwheel: true,
    streetViewControl: false,
    zoom: 10,
    zoomControl: true,
    zoomControlOptions: { style: google.maps.ZoomControlStyle.SMALL,
                          position: google.maps.ControlPosition.TOP_LEFT },
}

// MAP DIALOG CONTROLS

var MapDialogContext = {
    callbacks: { }, // map event callbacks
    container: null,
    initialized: false,
    supported_events: ["close","done"],
}

var MapDialogController = {

    close: function() { jQuery(DialogDOM.map_anchor).dialog("close"); },

    deleteLocation: function() {
        var dom = DialogDOM.location_dom;
        var _location = { name:jQuery(dom.name).val(), description:jQuery(dom.description).val(),
                          lat:jQuery(dom.lat).val(), lng:jQuery(dom.lng).val() };
        console.log("request to delete location : " + _location.description);
    },

    execCallback: function(event_type, info) {
        var context = MapDialogContext;
        if (event_type in context.callbacks) {
            console.log("executing call back for " + event_type + " event");
            if (typeof info !== 'undefined') {
                context.callbacks[event_type](event_type, info);
            } else {
                var dom = DialogDOM.location_dom;
                var _location = { name:jQuery(dom.name).val(), description:jQuery(dom.description).val(),
                                  lat:jQuery(dom.lat).val(), lng:jQuery(dom.lng).val() };
                context.callbacks[event_type](event_type, _location);
            }
        }
    },

    initializeDialog: function(dom_element) {
        // create map dialog
        var dom = DialogDOM;
        MapDialogContext.container = dom.map_content;
        console.log("MapDialogController.initializeDialog() was called");
        // initialze the map container html
        jQuery(dom_element).html(dom.map_dialog_html);
        console.log("map dialog html installed in : " + dom_element);
        var options = jQuery.extend({}, MapDialogOptions);
        jQuery(MapDialogContext.container).dialog(options);
        MapDialogContext.initialized = true;
        return this;
    },

    open: function(location_obj) {
        console.log("MapDialogController.open() was called");
        if (typeof location_obj !== 'undefined') { AllDialogsController.setLocation(location_obj); }
        console.log("setting map center to : " + MapContext.current_location.lat + " , " + MapContext.current_location.lng);
        //MapContext.map.setCenter(MapContext.current_location);
        jQuery(MapDialogContext.container).dialog("open");
        MapController.initMap();
        return false;
    },

    removeCallback: function(event_type) {
        if (event_type in MapContext.callbacks) { delete MapContext.callbacks[event_type]; }
    },

    setCallback: function(event_type, function_to_call) {
        var index = MapContext.supported_events.indexOf(event_type);
        if (index >= 0) { MapContext.callbacks[event_type] = function_to_call; }
    },

    setDimensions: function(dimensions) {
        if (Array.isArray(dimensions)) {
            MapDialogOptions.minHeight = dimensions[1];
            MapDialogOptions.minWidth = dimensions[0];
        } else { 
            MapDialogOptions.minHeight = dimensions.height;
            MapDialogOptions.minWidth = dimensions.width;
        }
    }
}

var MapDialogOptions = { appendTo: DialogDOM.map_anchor, autoOpen:false,
    buttons: { Close: { "class": "csftool-map-dialog-close", text:"Close",
                        click: function () {
                            console.log("MapDialog CLOSE button clicked");
                            jQuery(MapDialogContext.container).dialog("close");
                            }
                     }
    },
    close: function(event, ui) {
        console.log("MapDialog CLOSED");
        MapDialogController.execCallback("close");
    },
    draggable: true,
    minHeight: 500,
    minWidth: 450,
    modal: true,
    position: { my: "center center", at: "center center", of: DialogDOM.center_map_on },
    title: "Location Map Dialog",
}

// MARKERS

var MarkerCallback = function(marker, result, status_) {
    if (status === google.maps.GeocoderStatus.OK && result.length > 0) {
        marker.address = result[0].formatted_address;
    } else {
        marker.address = "Unable to decode lat/lng to physical address."
    }
}

var Marker = function(gmapLatLng, params) {
    var default_options, location, marker, selected;
    this.default_options = { clickable:true, draggable:false, icon:null, position:gmapLatLng };
    this.location = { lat: gmapLatLng.lat(), lng: gmapLatLng.lng(), name:"", address:"" };
    if (typeof params.name !== 'undefined') { this.location.name = params.name; }
    if (typeof params.address !== 'undefined') { this.location.address = params.address; }
    this.selected = false;

    var options = jquery.extend({}, this.default_options);
    if (typeof params.options !== 'undefined') { options = jquery.extend(options, params.options); }

    this.marker = google.maps.Marker(options);
    //google.maps.event.addListener(this.marker, 'click', function() {
        // show the info window
    //}
}




jQuery.fn.CsfToolLocationDialog = function() {

    if (arguments.length == 0) {
        var dom_element = this.get(0);
        AllDialogsController.initializeDialogs(dom_element);
        return this;
    }

    var arg_0 = arguments[0];

    if (arguments.length == 1) {
        if (typeof arg_0 === "string") {
            switch(arg_0) {

                case "close":
                    controller.close(); 
                    break;

                case "context":
                    return jQuery.extend({}, AllDialogsContext);
                    break;

                case "location":
                    return jQuery.extend({}, AllDialogsContext.selected_location);
                    break;

                case "map":
                    return jQuery.extend({}, MapContext); 
                    break;

                case "open":
                    MapDialogController.open();
                    break;
            }
        } else {
            var dom_element = this.get(0);
            AllDialogsController.initializeDialogs(dom_element, arg_0);
            return this;
        }

    } else {
        var arg_1 = arguments[1];
        switch(arg_0) {

            case "bind":
                if (arguments.length == 3) {
                   MapDialogController.setCallback(arg_1, arguments[2]);
                } else {
                    var callbacks = arg_1;
                    jQuery.each(callbacks, function(event_type, callback) {
                                MapDialogController.setCallback(event_type, callback);
                                });
                }
                break;
            case "dimensions":
                MapDialogController.setDimensions(arg_1);
                break;
            case "location":
                AllDialogsController.setLocation(arg_1);
                break;
            case "open":
                MapDialogController.open(arg_1);
                break;
            case "title":
                MapDialogController.setTitle(arg_1);
                break;
        } // end switch
    }
}

})(jQuery);

