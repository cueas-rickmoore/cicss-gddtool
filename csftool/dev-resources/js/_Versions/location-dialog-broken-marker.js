
(function() {

var AllDialogsContext = {
    default_location: { description:"Cornell University, Ithaca, NY", lat:42.45, lng:-76.48, name:"default" },
    initialized: false,
    initial_location: null, // name of the location/marker selected when the dialog was opened
    markers: { }, // disctionary of all markes on the map
    selected_location: null, // name of the last location/marker selected
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

    close: function() { 
        jQuery(LocationDialogContext.container).dialog("close");
    },

    execCallback: function(event_type, info) {
        var context = LocationDialogContext;
        if (event_type in LocationDialogContext.callbacks) {
            console.log("executing call back for " + event_type + " event");
            if (typeof info !== 'undefined') {
                LocationDialogContext.callbacks[event_type](event_type, info);
            } else {
                var dom = DialogDOM.location_dom;
                var _location = { name:jQuery(dom.name).val(), description:jQuery(dom.description).val(),
                                  lat:jQuery(dom.lat).val(), lng:jQuery(dom.lng).val() };
                LocationDialogContext.callbacks[event_type](event_type, _location);
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

    open: function(location_obj) {
        console.log("LocationDialogController.open() was called");
        var dom = DialogDOM.location_dom;
        var loc;
        if (typeof location_obj !== 'undefined') { loc = location_obj; } else { loc =  MapContext.current_location; }
        if (typeof loc.name !== 'undefined') { jQuery(dom.name).val(loc.name); } else { jQuery(dom.name).val(""); }
        if (typeof loc.description !== 'undefined') { jQuery(dom.description).val(loc.description); } else { jQuery(dom.description).val(""); }
        if (typeof loc.lat !== 'undefined') { jQuery(dom.lat).val(loc.lat); } else { jQuery(dom.lat).val(""); }
        if (typeof loc.lng !== 'undefined') { jQuery(dom.lng).val(loc.lng); } else { jQuery(dom.lng).val(""); }
        jQuery(LocationDialogContext.container).dialog("open");
        return false;
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
    current_marker: null,
}

var MapController = {

    centerMap: function(location_obj) {
        var center;
        if (typeof location_obj !== 'undefined') { center = this.locAsLatLng(location_obj);
        } else { center = this.locAsLatLng(); }
        MapContext.map.panTo(center);
    },

    deleteMarker: function(marker) {
        marker.map = null;
        delete markers[marker.name];
        marker = null;
    },

    initMap: function(location_obj) {
        var loc;
        if (typeof location_obj === 'undefined') {
            if (MapContext.selected_location != null) { loc = MapContext.selected_location;
            } else { loc = AllDialogsContext.default_location; }
        } else { loc = location_obj; }
        MapOptions.center = this.locAsLatLng(loc);
        MapContext.map = new google.maps.Map(document.getElementById(DialogDOM.map_element), MapOptions);

        if (!(loc instanceof google.maps.Marker)) {
            console.log("no marker exists for location : " + loc.name);
            MarkerManager.createMarker(loc);
        }

        google.maps.event.addListener(MapContext.map, 'click', function(ev) {
            MarkerManager.createMarker(ev.latLng);
            // var marker = new google.maps.Marker({ position: ev.latLng, map: MapContext.map });
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
        var _center_location;
        if (typeof location_obj !== 'undefined') {
            _center_on = location_obj;
        } else if (AllDialogsContext.selected_location != null) {
             _center_location = AllDialogsContext.selected_location;
        } else {
            _center_on = AllDialogsController.default_location;
        }
        //if (!(_center_on.name in AllDialogsController.markers)) {
        //}
        //var marker = AllDialogsController.setLocation(_center_location);

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
    minHeight: 400,
    minWidth: 400,
    modal: true,
    position: { my: "center center", at: "center center", of: DialogDOM.center_map_on },
    resizable: false,
    title: "Location Map Dialog",
}

// MARKERS

var MarkerOptions = { clickable:true, draggable:false, icon:null, map:null, position:null,  title:"New Marker" }

var MarkerManager = {

    createMarker: function(location_obj) {
        var marker;
        var loc_options = { description:null, infowindow:null, name:"CHANGE ME!" }
        var options = jQuery.extend({}, MarkerOptions);
        options.map = MapContext.map;
        if (location_obj instanceof google.maps.LatLng) {
            console.log("creating marker for google.maps.LatLng");
            options.position = location_obj;
            (function(options, loc_options) { // decode the address for the location
                MapContext.geocoder.geocode( { latLng: options.position }, function(result, status) {
                    if (status === google.maps.GeocoderStatus.OK && result.length > 0) {
                        loc_options.description = result[0].formatted_address;
                    } else { loc_options.description = "Unable to decode lat/lng to physical address."; }
                });
            })(options, loc_options);
            marker = new google.maps.Marker(options);
            // add our extra properies
            marker["name"] = loc_options.name;
            console.log("name : " + marker.name);
            marker["description"] = loc_options.description;
            marker["infowindow"] = loc_options.infowindow;
            // open the location editor dialog
            LocationDialogController.open(marker);
        } else {
            console.log("creating marker for location");
            options.position = MapController.locAsLatLng(location_obj);
            console.log("position : " + options.position.lat() + " , " + options.position.lng());
            options.title = location_obj.name;
            marker = new google.maps.Marker(options);
            console.log("MARKER CREATED : " + marker.title);
            // add our extra properies
            marker["name"] = location_obj.name;
            console.log("name : " + marker.name);
            marker["description"] = location_obj.description;
            console.log("description : " + marker.description);
            marker["infowindow"] = loc_options.infowindow;
            this.saveMarker(marker);
        }
    },

    removeMarker: function(marker) {
        var _marker;
        if (typeof marker === 'String') { _marker = AllDialogsContext.markers[marker]; } else { _marker = marker; }
        if (_marker) {
            _marker.map = null; // remove it form the map
            // remove it from the marker dictionary
            if (_marker.name in AllDialogsContext.markers) { delete AllDialogsContext.markers[_marker.name]; }
            _marker = null; // release it for garbage collection
        }
    },

    saveMarker: function(marker) {
        console.log("instanceof google.maps.Marker : " + marker instanceof google.maps.Marker);
        // create an info window and add a click event listener to display it
        (function(marker) {
            console.log("instanceof google.maps.Marker : " + marker instanceof google.maps.Marker);
            var infowindow;
            var map = marker.getMap();
            if (typeof marker.infowindow !== 'undefined') {
                infowindow = marker.infowindo;
                delete infowindo;
                marker.infowindo = null;
            }
            console.log("marker : " + marker instanceof google.maps.Marker);
            infowindow = new google.maps.InfoWindow({
                content: '<div class="locationMarkerInfo">' + marker.name + ' @ ' +
                         marker.lat() + ', ' + marker.lng() + '</br>' + marker.description + '</div>'
                });
            marker.infowindow = infowindow;
            marker.addListener('mouseover', function() { infowindow.open(map, marker); });
            marker.addListener('mouseout', function() { infowindow.close(); });
        })(marker);
        AllDialogsContext.markers[marker.name] = marker;
    },
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

