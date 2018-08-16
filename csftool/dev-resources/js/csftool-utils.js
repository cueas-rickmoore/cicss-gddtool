
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// common CSF functions
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function csfToolDateToDateObj(date_value) {
    if (date_value instanceof Date) { return date_value;
    } else { return new Date(date_value+'T12:00:00-04:30'); }
}

function csfToolDateToTime(date_value) {
    if (date_value instanceof Date) { return date_value,getTime();
    } else {
        var the_date = new Date(date_value+'T12:00:00-04:30');
        return the_date.getTime();
    }
}

function csfToolIsInstanceOf(obj) { return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase() }

function csfToolInheritFrom(subclass, superclass) {
    var temp_class = function(){};
    temp_class.prototype = superclass.prototype;
    subclass.prototype = new temp_class();
    subclass.prototype.constructor = subclass;
}

function csfToolExtendPrototype(subclass, superclass) {
    subclass.prototype = jQuery.extend(subclass, superclass.prototype)
    subclass.prototype.constructor = subclass;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// CSF Persistent Store classe
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function CsfToolPersistentStore(state_key) {
    var location_namespace, store, state_namespace;
    this.location_namespace = "csftool_locations";
    this.state_namespace = state_key + '_state';
    //this.store = new window.Basil({ namespace:this.state_namespace, storages:["local","cookie"], storage:"local", expireDays:730 });
}

CsfToolPersistentStore.prototype.getLocation = function(key) {
    return undefined;
    //var loc = this.store.get(key, {"namespace":this.location_namespace});
    //if (typeof loc !== undefined) { loc = JSON.parse(loc)['location']; }
    //return loc;
}

CsfToolPersistentStore.prototype.getState = function(key) {
    return undefined;
    //var state = this.store.get(key, {"namespace":this.state_namespace});
    //if (typeof state !== undefined) { state = JSON.parse(state)["state"]; }
    //return state;
}

CsfToolPersistentStore.prototype.saveLocation = function(key, loc_obj) {
    var key, loc_json;
    loc_json = '{"location":{"name":'+loc_obj.name+',"description":"'+loc_obj.description+'","lat":'+loc_obj.lat.toString()+',"lon":'+loc_obj.lon.toString()+'}}'
    //this.store.set(key, loc_json, {"namespace":this.location_namespace});
    console.log('CsfToolPersistentStore.saveLocation("'+key+'"='+loc_json+')')
}

CsfToolPersistentStore.prototype.saveState = function(key, state_obj) {
    var state_json;
    if (csfToolIsInstanceOf(state_obj, 'string')) { state_json = state_obj; } else { state_json = JSON.stringify(state_obj); }
    //this.store.set(key, '{"state":'+state_json+'}', {"namespace":this.state_namespace});
    console.log('CsfToolPersistentStore.setState('+key+'='+state_json+')')
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// base implementation of a location object
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function CsfToolLocationState() {}
CsfToolLocationState.prototype = { _listeners_:{ }, _state_:{ } };
CsfToolLocationState.prototype.constructor = function(name, description, lat, lon) {
    this._state_ = this.initLocationObject();
    this._state_["description"] = description;
    this._state_["lat"] = lat;
    this._state_["lon"] = lon;
    this._state_["name"] = name;

    // protected properties
    Object.defineProperty(CsfToolLocationState.prototype, "coords", { configurable:false, enumerable:false,
        get:function() { return [ this._state_['lat'], this._state_['lon'] ]; },
        set:function(coords) {
                if (coords instanceof Array) { 
                    this._state_["lat"] = coords[0];
                    this._state_["lon"] = coords[1];
                    if ("onChangeCoords" in this._listeners_) {
                        this._listeners_.onChangeCoords( { "lat":coords[0],"lon":coords[1] });
                    }
                } else {
                    this._state_["lat"] = coords["lat"];
                    this._state_["lon"] = coords["lon"];
                    if ("onChangeCoords" in this._listeners_) {
                        this._listeners_.onChangeCoords( { "lat":coords["lat"],"lon":coords["lon"] });
                    }
                }
            },
    });

    Object.defineProperty(CsfToolLocationState.prototype, "description", { configurable:false, enumerable:false,
        get:function() { return this._state_['description']; },
        set:function(value) { this._state_['description'] = value; },
    });

    Object.defineProperty(CsfToolLocationState.prototype, "lat", { configurable:false, enumerable:false, get:function() { return this._state_['lat']; }, });
    Object.defineProperty(CsfToolLocationState.prototype, "lon", { configurable:false, enumerable:false, get:function() { return this._state_['lon']; }, });

    Object.defineProperty(CsfToolLocationState.prototype, "name", { configurable:false, enumerable:false,
        get:function() { return this._state_['name']; },
        set:function(value) { this._state_['name'] = value; },
    });

    // immutable properties
    Object.defineProperty(CsfToolLocationState.prototype, "supported_listeners", { configurable:false, enumerable:false, writable:false, value: ["onChangeCoords",] });

}

// functions
CsfToolLocationState.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_listeners.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}

CsfToolLocationState.prototype.callListeners = function(event_type, obj) {
    if (event_type in this._listeners_) {
        var listeners = this._listeners_[event_type];
        if (jQuery.isArray(listeners)) {
            for (var i=0; i < listeners.length; i++) { listeners[i](obj); }
        } else { listeners(obj) }
    }
}

CsfToolLocationState.prototype.initLocationObject = function() { return { "description":null, "lat":null, "lon":null, "name":null } }

CsfToolLocationState.prototype.persist = function() {
    loc_json = '{"prototype":"CsfToolLocationState","_state_":{' + JSON.stringify(this._state_) + '}';
    console.log("persisting " + loc_json);
}

CsfToolLocationState.prototype.updateLocation = function(loc_name, loc_description, loc_lat, loc_lon) {
    this.name = loc_name; this.description = loc_description; this.coords = [loc_lat, loc_lon];
}

CsfToolLocationState.prototype.updateLocation = function(new_loc) {
    if (new_loc.name != this.name) { this.name = new_loc.name; }
    if (new_loc.description != this.description) { this.description = new_loc.description; }
    if ( (new_loc.lat != this.lat) | (new_loc.lon != this.lon) ) { this.coords([new_loc.lat, new_loc.lon]); }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// widget used indicate wait for data load
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function CsfToolWaitWidget() {}
CsfToolWaitWidget.prototype = { html:null, is_active:false };
CsfToolWaitWidget.prototype.constructor = function() {
    this.html = '<div id="csftool-wait-widget" class="nowait">';
    this.is_active = false;

    Object.defineProperty(CsfToolWaitWidget.prototype, "state", { configurable:false, enumerable:false,
           get:function() {
               var widget=jQuery("#csftool-wait-widget")[0];
               if (widget === undefined) { return "nowait" } else { return widget.getAttribute("class"); }
               }
    });
}

CsfToolWaitWidget.prototype.start = function() {
    jQuery("#csftool-wait-widget")[0].setAttribute("class","wait");
    this.is_active = true;
}

CsfToolWaitWidget.prototype.stop = function() {
    var widget = jQuery("#csftool-wait-widget")[0];
    widget.setAttribute("class","nowait");
    this.is_active = false;
}


