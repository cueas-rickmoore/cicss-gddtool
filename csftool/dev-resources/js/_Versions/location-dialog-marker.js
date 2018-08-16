
(function($) {

var DialogContext = {
    callbacks: { }, // event callbacks
    center: null, // location of map cnter ... instance of Google LatLng
    current_marker: { name:null, description:null, lat:null, lng:null }, // the last marker created
    default_location: { description:"Cornell University, Ithaca, NY", lat:42.45, lng:-76.48, name:"default" },
    dimensions: { height:600, width:600 },
    geocoder: null, // instance of Google GeoCoder
    icons: { }, // icons available for markers
    initialized: false,
    initial_location: { name:null, description:null, lat:null, lng:null }, // the location selected when the dialog was opened
    locations: { }, // all locations available to the dialog/map
    map: null, // instance pf Google Map
    markers: { }, // all markers posted to the map
    open: false,
    selected_location: { name:null, description:null, lat:null, lng:null }, // the last location chosen
    supported_events: ["cancel","close","delete","select"],
    title: "Location Selection Dialog",
}

var DialogController = {
    close: function() {
        $(DialogDOM.location_anchor).dialog("close");
        var changed = LocationManager.stateChanged();
        var state = { "changed":changed, "location":$.extend({},DialogContext.selected_location) }
        DialogEventManager.execCallback("close", state);
        DialogContext.open = false;
    },

    initializeDialog: function(dom_element, initial_location) {
        console.log("initializeDialog() was called");
        $(dom_element).html(DialogDOM.dialog_html);
        DialogDOM.container = dom_element;
        console.log("dialog html installed in : " + DialogDOM.container);
        var buttons = $.extend({}, DialogDOM.location_buttons);
        console.log("creating location dialog instance : " + DialogDOM.location_anchor); 
        $(DialogDOM.location_anchor).dialog( {
            autoOpen:false,
            appendTo: dom_element,
            modal: true, buttons: buttons, title: DialogContext.title,
            minHeight:DialogContext.dimensions.height, minWidth:DialogContext.dimensions.width,
            position: { my: "center center", at: "center center", of: DialogDOM.center_on },
            } );

        MapController.initMap();

        if (typeof initial_location !== 'undefined') {
            LocationManager.setInitialLocation(initial_location);
            LocationManager.setSelectedLocation(initial_location);
        } else {
            LocationManager.setInitialLocation(DialogContext.default_location);
            LocationManager.setSelectedLocation(DialogContext.default_location);
        }
        DialogContext.initialized = true;
        return this;
    },

    open: function(location_obj) {
        if (typeof location_obj !== 'undefined') { DialogContext.setLocation(location_obj); }
        console.log("CsfToolLocationDialog.show() was called");
        $(DialogDOM.location_anchor).dialog("open");
        DialogContext.open = true;
        return false;
    },

    setDimensions: function(dimensions) {
        if (Array.isArray(dimensions)) {
            this.dimensions["width"] = dimensions[0];
            this.dimensions["height"] = dimensions[1];
        } else {
            $.each(dimensions, function(dimension, size) { DialogContext.dimensions[dimension] = size; });
        }
    },
}

var DialogDOM = {
    center_on:"#csftool-content",
    container: null,
    dialog_html: [ '<div id="csftool-location-dialog">',
                   '<div id="csftool-location-dialog-anchor">',
                   '<div id="csftool-location-dialog-content">',
                   '<div id="csftool-location-dialog-map"> </div>',
                   '</div> <!-- end of csftool-location-dialog-content -->',
                   '</div> <!-- end of csftool-location-dialog-anchor -->',
                   '<div id="csftool-marker-dialog-anchor">',
                   '<div id="csftool-marker-dialog-content">',
                   '<div id="csftool-marker-data">',
                   '<div id="csftool-marker-coords">',
                   '<label class="dialog-label">Name :</label>',
                   '<input type="text" id="csftool-marker-name" class="dialog-text">',
                   '<label class="dialog-label dialog-coord">Lat :</label>',
                   '<input id="csftool-marker-lat" class="dialog-text dialog-coord" type="text">',
                   '<label class="dialog-label dialog-coord">Long :</label>',
                   '<input id="csftool-marker-lng" class="dialog-text dialog-coord" type="text">',
                   '</div> <!-- end of csftool-marker-coords -->',
                   '<div id="csftool-marker-place"><label class="dialog-label">Place :</label>',
                   '<input type="text" id="csftool-marker-address" class="dialog-text"> </div>',
                   '</div> <!-- end of csftool-marker-data -->',
                   '</div> <!-- end of csftool-marker-dialog-content -->',
                   '</div> <!-- end of csftool-marker-dialog-anchor -->',
                   '</div> <!-- end of csftool-location-dialog -->'].join(''),

    location_anchor:"#csftool-location-dialog-anchor", 
    location_buttons:{ Done: { "class": "csftool-location-dialog-done", text:"Done",
                         click: function () {
                             console.log("DONE button clicked");
                             $(DialogDOM.location_anchor).dialog("close");
                             DialogEventManager.execCallback("done");
                             }
                      },
    },
    map_element: "#csftool-location-dialog-map",
    marker_anchor:"#csftool-marker-dialog-anchor",
    marker_buttons: { Cancel: { "class": "csftool-marker-dialog-cancel", text:"Cancel",
                           click: function () {
                               console.log("marker dialog CANCEL button clicked");
                               $(DialogDOM.marker_anchor).dialog("close");
                               DialogEventManager.execCallback("cancel", DialogContext.current_marker);
                               }
                     },
                     Delete: { "class": "csftool-marker-dialog-delete", text:"Delete",
                           click: function () { 
                               console.log("marker dialog DELETE button clicked");
                               var marker = $.extend({}, DialogContext.current_marker);
                                
                               DialogEventManager.execCallback("delete", DialogContext.current_marker);
                               }
                     },
                     Save: { "class": "csftool-marker-dialog-save", text:"Save",
                         click: function () {
                             console.log("marker dialog SAVE button clicked");
                             DialogController.saveLocation();
                             DialogEventManager.execCallback("save", DialogContext.current_marker);
                             }
                     },
    marker_dom: { name: "#csftool-marker-name", description: "#csftool-marker-address",
                    lat: "#csftool-marker-lat", lng: "#csftool-marker-lng" },
    },
}

var DialogEventManager = {
    callbackExists: function(event_type) { return event_type in DialogContext.callbacks; },

    execCallback: function(event_type, info) {
        if (event_type in DialogContext.callbacks) {
            console.log("executing call back for " + event_type + " event");
            if (typeof info !== 'undefined') {
                DialogContext.callbacks[event_type](event_type, info);
            } else {
                var loc = DialogContext.selected_location
                var dom = DialogContext.marker_dom;
                var _location = { name:$(dom.name).val(), description:$(dom.description).val(),
                                  lat:$(dom.lat).val(), lng:$(dom.lng).val() };
                DialogContext.callbacks[event_type](event_type, _location, this);
            }
        }
    },
    removeCallback: function(event_type) {
        if (event_type in DialogContext.callbacks) { delete DialogContext.callbacks[event_type]; }
    },
    setCallback: function(event_type, function_to_call) {
        var index = DialogContext.supported_events.indexOf(event_type);
        if (index >= 0) { DialogContext.callbacks[event_type] = function_to_call; }
    },
}

var LocationContext = {
    description: null,
    infowindow: null,
    lat: null,
    lng: null,
    marker: null,
    name: null,
}

var LocationFactory = {

    addLocation: function(location_context) {
        var name = location_context.name;
        DialogContext.locations[name] = jquery.extend({}, location_context);
    },

    addLocations: function(locations) {
        if (Array.isArray(locations)) {
            $.each(locations, function(index, context) {
                var name = context.name;
                DialogContext.locations[name] = jquery.extend({}, context);
            });
        } else {
            if (locations.hasOwnProperty("name")) { // called with a single location 
                var name = locations.name;
                DialogContext.locations[name] = $.extend({}, locations);
            } else { // an object with multiple locations keyed by name 
                DialogContext.locations = $.extend(true, DialogContext.locations, locations);
            }
        }
    },

    createLocation: function(name, latlng, description) {
        var loc = $.extend({}, LocationContext);
        loc.name = name;
        loc.lat = latlng.lat();
        loc.lng = latlng.lng();
        loc.description = description;

        // create the info window and set the mouse event listeners
        loc.infowindow = new google.maps.InfoWindow({
            content: '<div class="locationMarkerInfo">' + loc.name + ' @ ' +
                     loc.lat + ', ' + loc.lng + '</br>' + loc.description + '</div>'
        });

        // create a marker for the location
        loc.marker = MarkerFactory.createMarker(loc);
        DialogContext.locations[loc.name] = loc;
        return loc
    },

    decodeLatLng: function(latlng) {
        var address = "unknown";
        DialogContext.geocoder.geocode( {location:latlng},
            function (results, _status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    if (results[0]) {
                        address = results[0];
                    } else {
                        address = "No known address @ : " + latlng.lat() + ", " + latlng.lng();
                    }
                } else { console.log("reverse geocode failed : " + _status); } 
        });
        console.log("DECODED ADDRESS : " + address);
        return address
    },

    deleteLocation: function(arg) {
        var loc = undefined;
        if (typeof arg === "string") { // just in case only the name was passed
            if (arg in DialogContext.locations) { loc  = DialogContext.locations[arg]; }
        } else if (arg instanceof Object) { // assumes a location context object was passed
            loc = arg;
        }

        if (loc !== undefined) {
            console.log("request to delete location : " + loc.name);
            if (loc.infowindow !== null) {
                delete loc.infowindow;
                loc.infowindow = null;
            }
            if (loc.marker !== null) { loc.marker = MarkerManager.deleteMarker(loc.marker); }
            if (loc.name in DialogContext.locations) { delete DialogContext.locations[loc.name] }
            delete loc;
        } else {
            console.log("request to delete location  " + arg + " : no such location");
        }
    },

    saveLocation: function() {
        var dom = DialogContext.marker_dom;
        var _location = { name:$(dom.name).val(), description:$(dom.description).val(),
                          lat:$(dom.lat).val(), lng:$(dom.lng).val() };
        console.log("request to save location : " + _location.description);
    },
}

var LocationManager = {
    setCurrentMarker: function(arg) {
    },

    setInitialLocation: function(arg) {
    },

    setSelectedLocation: function(arg) {
    },
}

var MarkerDialogController = {

    close: function() {
        $(DialogDOM.marker_anchor).dialog("close");
        var marker = DialogContext.current_marker;
        DialogContext.setCurrentMarker = null;
        DialogEventManager.execCallback("close", $.extend({}, DialogContext.selected_location));
    },

    open: function(arg) {
        if (typeof arg !== 'undefined') {
            LocationManager.setCurrentMarker(arg);
        } else { LocationManager.setCurrentMarker(); }

        console.log("MarkerDialogController.open() was called");
        $(DialogDOM.location_anchor).dialog("open");
        return false;
    },

    initializeDialog: function(location) {
        console.log("MarkerDialogController.initializeDialog() was called");
        var buttons = $.extend({}, DialogDOM.marker_buttons);
        console.log("creating modal dialog in : " + DialogDOM.marker_anchor); 
        $(DialogDOM.marker_anchor).dialog({ appendTo: DialogDOM.marker_anchor,
            autoOpen:false, buttons: buttons, minHeight: 50, minWidth: 60,
            modal: true, title: "Location Editor",
            position: { my: "center center", at: "center center", of: DialogDOM.map_element },
            });

        if (typeof location === 'undefined') {
            LocationManager.setCurrentMarker(DialogContext.selected_location);
        } else { LocationManager.setCurrentMarker(location); }

        DialogContext.initialized = true;
        return this;
    },

    setLocation: function(arg) {
        var loc = undefined;
        if (typeof arg === "String") { loc = DialogContext.locations[arg];
        } else if (arg instanceof Object) { loc = arg; }

        if (loc !== undefined) {
            if (!(loc.name in DialogContext.locations)) { loc = LocationFactory.createLocation(loc); }
            var dom = DialogContext.marker_dom;
            $(dom.description).val(loc.description);
            $(dom.lat).val(loc.lat);
            $(dom.lng).val(loc.lng);
            $(dom.name).val(loc.name);
        }
    },
}

var MarkerFactory = {

    createMarker: function(loc) {
        // create a marker for the location
        var marker = new google.maps.Marker({
                clickable:true,
                draggable:false, 
                icon:null,
                map: MapContext.map,
                position: new google.maps.LatLng(lat, lng),
                title: name,
            });

        // create a click listener to show location data dialog
        (function(marker, md_controller) {
            var name = marker.getTitle();
            marker.addlistener('click', function() { md_controller.open(name); });
        })(loc, MarkerDialogController);

        // set info window mouse event listeners
        (function(loc, marker) {
            var infowindow = loc.infowindow;
            var map = marker.getMap();
            marker.addListener('mouseover', function() { infowindow.open(map); });
            marker.addListener('mouseout', function() { infowindow.close(); });
        })(loc);

        return marker; 
    },

    deleteMarker: function(marker) {
        marker.setMap(null);
        delete marker;
        return null;
    },
}

var MarkerManager = {

    setCurrentMarker: function(arg) {
        var marker;
        if (arg instanceof google.maps.Marker) { marker = arg;
        } else if (typeof marker === "string") {
            marker = DialogContext.locations[arg].marker;
        } else { // assume tha a location object was passed
            marker = arg.marker;
        }
        //!TODO: highlight the current marker
        DialogContext.current_marker = marker;
    },
}

var MapMarkerCallback = function(marker, result, _status) {
    if (status === google.maps.GeocoderStatus.OK && result.length > 0) {
        marker.address = result[0].formatted_address;
    } else {
        marker.address = "Unable to decode lat/lng to physical address."
    }
}

var MapOptions = {
    backgroundColor: "white",
    center: null,
    disableDefaultUI: true,
    draggable: true,
    //enableAutocomplete: false,
    //enableReverseGeocode: true,
    mapTypeControl: true,
    mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                             position: google.maps.ControlPosition.TOP_RIGHT },
    mapTypeId: google.maps.MapTypeId.HYBRID,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    maxZoom: 18,
    minZoom: 5,
    panControl: true,
    panControlOptions: { position: google.maps.ControlPosition.LEFT_TOP },
    //scaleControl: false, 
    //scaleControlOptions: { position: google.maps.ControlPosition.TOP_CENTER },
    //scrollwheel: true,
    streetViewControl: false,
    zoom: 8,
    zoomControl: true,
    zoomControlOptions: { style: google.maps.ZoomControlStyle.LARGE,
                          position: google.maps.ControlPosition.LEFT_TOP },
}

var MapController = {

    initMap: function(options) {
        //if (typeof options !== 'undefined') { $.extend(MapOptions, options); }
        if (MapOptions.center === null) {
            //var center = this.locAsLatLng();
            //MapOptions.center = { lat:center.lat(), lng:center.lng() };
            MapOptions.center = this.locAsLatLng();
            DialogContext.center = this.locAsLatLng();
        }
        DialogContext.map = new google.maps.Map(document.getElementById(DialogContext.dom_element), MapOptions);
        console.log("google map created ... " + DialogContext.map);
        //DialogContext.geocoder = new google.maps.Geocoder();
        //console.log("gecoder created");
        (function(context, md_controller) {
            var map = context.map;
            map.addListener('click', function(_event, _status) {
                md_controller.setCurrentMarker(_event);
            });
        })(DialogContext, MarkerDialogController);
    },

    locAsLatLng: function(location) {
        var lat, lng;
        if (typeof location !== 'undefined') { 
            lat = location.lat;
            lng = location.lng;
        } else {
            var selected = DialogContext.selected_location;
            lat = selected.lat;
            lng = selected.lng;
        }
        return new google.maps.LatLng(lat, lng);
    },

    locationChanged: function() {
        var initial = DialogContext.initial_location;
        var selected = DialogContext.selected_location;
        if ( selected.name != initial.name 
                ) { return true;
        } else {
            if (selected.lat != initial.lat) { return true;
            } else {
                if (selected.lon != initial.lon) { return true;
                } else {
                    if (selected.description != initial.description) { return true; }
                }
            }
        }
        return false;
    },
}

var MapView = {

    centerMap: function(location) {
        if (typeof location !== 'undefined') {
            DialogContext.center = this.locAsLatLng(location);
        } //} else { DialogContext.center = this.locAsLatLng(); }
        DialogContext.map.panTo(DialogContext.center);
    },

    setSelectedLocation: function(arg) {
        var loc = undefined;
        if (typeof loc === "string") {
            if (arg in DialogContext.locations) { loc = DialogContext.locations[arg]; }

        } else if ( arg instanceof Object) {
            if (arg.name in DialogContext.locations) {
                loc = arg;
            } else { // create a new location object
            }
        }
        if (loc !== undefined) { DialogContext.selected_location = loc; }
    },

    showMap: function() {
        var map = DialogContext.map;
        google.maps.event.trigger(map, 'resize');
        map.setCenter(DialogContext.center);
    }
}

$.fn.CsfToolLocationDialog = function() {

    if (arguments.length == 0) {
        var dom_element = this.get(0);
        MarkerDialogController.initializeDialog();
        DialogController.initializeDialog(dom_element);
        //MapController.initMap();
        return this;
    }

    var arg_0 = arguments[0];

    if (arguments.length == 1) {
        if (typeof arg_0 === "string") {
            switch(arg_0) {

                case "close":
                    DialogController.close(); 
                    break;

                case "context":
                    return $.extend({}, DialogContext);
                    break;

                case "dimensions":
                    return $.extend({}, DialogContext.dimensions);
                    break;

                case "location":
                    return $.extend({}, DialogContext.selected_location);
                    break;

                case "locations":
                    return $.extend({}, DialogContext.locations);
                    break;

                case "map":
                    return $.extend({}, DialogContext.map); 
                    break;

                case "open":
                    DialogController.open(); 
                    MapController.showMap();
                    break;

                case "title":
                    return DialogContext.title;
                    break;
            }
        } else {
            var dom_element = this.get(0);
            MarkerDialogController.initializeDialog();
            DialogController.initializeDialog(dom_element);
            //MapController.initMap();
            return this;
        }

    } else {
        var arg_1 = arguments[1];
        var controller = DialogController;

        switch(arg_0) {

            case "bind":
                if (arguments.length == 3) {
                   DialogEventManager.setCallback(arg_1, arguments[2]);
                } else {
                    var callbacks = arg_1;
                    $.each(callbacks, function(event_type, callback) {
                           DialogEventManager.setCallback(event_type, callback);
                           });
                }
                break;
            case "dimensions":
                controller.setDimensions(arg_1);
                break;
            case "location":
                controller.setLocation(arg_1);
                break;
            case "locations":
                controller.setLocation(arg_1);
                break;
            case "open":
                controller.open(arg_1);
                MapController.initMap();
                break;
            case "title":
                controller.setTitle(arg_1);
                break;
        } // end switch
    }
}

})(jQuery);

