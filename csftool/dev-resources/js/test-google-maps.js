
var MapContext = {
    dom_element: "csftool-location-dialog-map",
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
        console.log("initializing Google map at : " + MapOptions.center.lat() + ' , ' + MapOptions.center.lng());
        //console.log(MapOptions);
        MapContext.map = new google.maps.Map(MapContext.dom_element, MapOptions);
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

