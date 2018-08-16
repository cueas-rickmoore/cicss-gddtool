
(function() {

var DialogContext = {
    callbacks: { }, // event callbacks
    default_location: { description:"Cornell University, Ithaca, NY", lat:42.45, lng:-76.48, name:"default" },
    dialog_content:"#csftool-map-dialog-content", 
    dimensions: { height:600, width:600 },
    initialized: false,
    initial_location: { name:null, description:null, lat:null, lng:null }, // the location selected when the dialog was opened
    location_dom: { name: "#csftool-location-name", description: "#csftool-location-address",
                    lat: "#csftool-location-lat", lng: "#csftool-location-lng" },
    locations: [ ],
    selected_location: { name:null, description:null, lat:null, lng:null }, // the last location chosen
    supported_events: ["cancel","close","delete","save"],
    title: "Location Selection Dialog",
}

var DialogDOM = {
    container: null,
    dialog_html: [ '<div id="csftool-location-dialogs">',
                   '<div id="csftool-map-dialog-anchor">',
                   '</div> <!-- end of csftool-map-dialog-anchor -->',
                   '<div id="csftool-location-dialog-anchor">',
                   '</div> <!-- close csftool-location-dialog-anchor -->',
                   '</div> <!-- end of csftool-location-dialogs -->'].join(''),

    loc_anchor: "#csftool-location-dialog-anchor",
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

    map_anchor: "#csftool-map-dialog-anchor",
    map_center_on:"#csftool-content",
    map_content: "#csftool-map-dialog-content",
    map_dialog_html: [ '<div id="csftool-map-dialog-content">',
                       '<div id="csftool-map-dialog-map" class="map-container"> </div>',
                       '</div> <!-- end of csftool-map-dialog-content -->'].join(''),
    map_element: "csftool-map-dialog-map",
}

var DialogController = {
    
    close: function() {
        jQuery(DialogDOM.map_anchor).dialog("close");
        this.execCallback("close", jQuery.extend({}, DialogContext.selected_location));
    },

    deleteLocation: function() {
        var dom = DialogContext.location_dom;
        var _location = { name:jQuery(dom.name).val(), description:jQuery(dom.description).val(),
                          lat:jQuery(dom.lat).val(), lng:jQuery(dom.lng).val() };
        console.log("request to delete location : " + _location.description);
    },

    dialogButtons: function() {
        return { Cancel: { "class": "csftool-map-dialog-cancel", text:"Cancel",
                           click: function () {
                               console.log("CANCEL button clicked");
                               jQuery(DialogContext.dialog_content).dialog("close");
                               DialogController.execCallback("cancel");
                               }
                         },
                 Delete: { "class": "csftool-map-dialog-delete", text:"Delete",
                           click: function () { 
                               console.log("DELETE button clicked");
                               DialogController.execCallback("delete");
                               }
                         },
                 Save: { "class": "csftool-map-dialog-save", text:"Save",
                         click: function () {
                             console.log("SAVE button clicked");
                             DialogController.saveLocation();
                             DialogController.execCallback("save");
                             }
                       },
                 Done: { "class": "csftool-map-dialog-done", text:"Done",
                         click: function () {
                             console.log("DONE button clicked");
                             jQuery(DialogContext.dialog_content).dialog("close");
                             DialogController.execCallback("done");
                             }
                       },
               }
    },

    execCallback: function(event_type, info) {
        var context = DialogContext;
        if (event_type in context.callbacks) {
            console.log("executing call back for " + event_type + " event");
            if (typeof info !== 'undefined') {
                context.callbacks[event_type](event_type, info, this);
            } else {
                var dom = context.location_dom;
                var _location = { name:jQuery(dom.name).val(), description:jQuery(dom.description).val(),
                                  lat:jQuery(dom.lat).val(), lng:jQuery(dom.lng).val() };
                context.callbacks[event_type](event_type, _location, this);
            }
        }
    },

    initializeDialog: function(dom_element) {
        var context = DialogContext;
        var dom = DialogDOM;
        console.log("initializeDialog() was called");
        // initialze the container for all dialogs
        jQuery(dom_element).html(dom.dialog_html);
        jQuery(dom.map_anchor).html(dom.map_dialog_html);
        dom.container = dom_element;
        console.log("dialog html installed in : " + dom.container);
        // create map dialog
        var buttons = jQuery.extend({}, this.dialogButtons());
        console.log("creating modal dialog in : " + dom.map_anchor); 
        jQuery(dom.map_content).dialog( {
            autoOpen:false,
            appendTo: dom.map_anchor,
            modal: true, buttons: buttons, title: context.title,
            minHeight:context.dimensions.height, minWidth:context.dimensions.width,
            position: { my: "center center", at: "center center", of: dom.map_center_on },
            } );
        
        this.setLocation(context.default_location);
        context.initialized = true;
        return this;
    },

    open: function(location_obj) {
        var context = DialogContext;
        if (typeof location_obj !== 'undefined') { context.setLocation(location_obj); }
        console.log("CsfToolLocationDialog.open() was called");
        jQuery(context.dialog_content).dialog("open");
        return false;
    },

    removeCallback: function(event_type) {
        var context = DialogContext;
        if (event_type in context.callbacks) { delete context.callbacks[event_type]; }
    },

    saveLocation: function() {
        var dom = DialogContext.location_dom;
        var _location = { name:jQuery(dom.name).val(), description:jQuery(dom.description).val(),
                          lat:jQuery(dom.lat).val(), lng:jQuery(dom.lng).val() };
        console.log("request to save location : " + _location.description);
    },

    setCallback: function(event_type, function_to_call) {
        var context = DialogContext;
        var index = context.supported_events.indexOf(event_type);
        if (index >= 0) { context.callbacks[event_type] = function_to_call; }
    },

    setDimensions: function(dimensions) {
        var context = DialogContext;
        if (Array.isArray(dimensions)) {
            this.dimensions["width"] = dimensions[0];
            this.dimensions["height"] = dimensions[1];
        } else {
            jQuery.each(dimensions, function(dimension, size) { context.dimensions[dimension] = size; });
        }
    },

    setLocation: function(location_object) {
        var context = DialogContext;
        var new_location = jQuery.extend({}, context.selected_location, location_object);
        var dom = context.location_dom;
        jQuery(dom.description).val(new_location.description);
        jQuery(dom.lat).val(new_location.lat);
        jQuery(dom.lng).val(new_location.lng);
        jQuery(dom.name).val(new_location.name);
        context.selected_location = new_location;
    },
}

var MapContext = {
    geocoder: null,
    icons: { },
    map: null,
    markers: [ ],
    selected: null,
}

var MapMarkerCallback = function(marker, result, status_) {
    if (status === google.maps.GeocoderStatus.OK && result.length > 0) {
        marker.address = result[0].formatted_address;
    } else {
        marker.address = "Unable to decode lat/lng to physical address."
    }
}

var MapMarker = function(gmapLatLng, params) {
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

var MapOptions = {
    backgroundColor: "white",
    center: null,
    //disableDefaultUI: true,
    //draggable: true,
    //enableAutocomplete: false,
    //enableReverseGeocode: true,
    //mapTypeControl: true,
    //mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
    //                         position: google.maps.ControlPosition.TOP_RIGHT },
    //mapTypeId: google.maps.MapTypeId.HYBRID,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    //maxZoom: 18,
    //minZoom: 5,
    //panControl: true,
    //panControlOptions: { position: google.maps.ControlPosition.LEFT_TOP },
    //scaleControl: false, 
    //scaleControlOptions: { position: google.maps.ControlPosition.TOP_CENTER },
    //scrollwheel: true,
    //streetViewControl: false,
    zoom: 10,
    //zoomControl: true,
    //zoomControlOptions: { style: google.maps.ZoomControlStyle.LARGE,
    //                      position: google.maps.ControlPosition.LEFT_TOP },
}

var MapController = {

    addMarker: function(gmapLatLng, location) {
        var marker;
        if (typeof location !== 'undefined') {
            marker = new MapMarker(gmapLatLng, location);
        } else { 
            var address;
            MapContext.geocoder.geocode( { latLng: gmapLatLng },
                function(result, status) {
                    //!TODO : figure out how to make this work
                });
            marker = new MapMarker(gmapLatLng, { name:"", description:address });
        }
        marker.marker.setMap(MapContext.map);
        MapContext.markers.push(marker);
    },
    centerMap: function(location) {
        context.map.panTo(this.locAsLatLng(location));
    },
    initMap: function(options) {
        //if (typeof options !== 'undefined') { jQuery.extend(MapOptions, options); }
        if (MapOptions.center === null) {
            //var center = this.locAsLatLng();
            //MapOptions.center = { lat:center.lat(), lng:center.lng() };
            MapOptions.center = this.locAsLatLng();
        }
        MapContext.map = new google.maps.Map(document.getElementById(DialogDOM.map_element), MapOptions);
        console.log("google map created ... " + MapContext.map);
        //MapContext.geocoder = new google.maps.Geocoder();
        //console.log("gecoder created");
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
    }
}

jQuery.fn.CsfToolLocationDialog = function() {

    if (arguments.length == 0) {
        var dom_element = this.get(0);
        DialogController.initializeDialog(dom_element);
        //MapController.initMap();
        return this;
    }

    var controller = DialogController;
    var context = DialogContext;
    var arg_0 = arguments[0];

    if (arguments.length == 1) {
        if (typeof arg_0 === "string") {
            switch(arg_0) {

                case "close":
                    controller.close(); 
                    break;

                case "context":
                    return jQuery.extend({}, context);
                    break;

                case "dimensions":
                    return jQuery.extend({}, context.dimensions);
                    break;

                case "location":
                    return jQuery.extend({}, context.selected_location);
                    break;

                case "map":
                    return jQuery.extend({}, MapContext); 
                    break;

                case "open":
                    controller.open(); 
                    MapController.initMap();
                    break;

                case "title":
                    return context.title;
                    break;
            }
        } else {
            var dom_element = this.get(0);
            controller.initializeDialog(dom_element);
            //MapController.initMap();
            return this;
        }

    } else {
        var arg_1 = arguments[1];
        switch(arg_0) {

            case "bind":
                if (arguments.length == 3) {
                   controller.setCallback(arg_1, arguments[2]);
                } else {
                    var callbacks = arg_1;
                    jQuery.each(callbacks, function(event_type, callback) {
                                controller.setCallback(event_type, callback);
                                });
                }
                break;
            case "dimensions":
                controller.setDimensions(arg_1);
                break;
            case "location":
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

