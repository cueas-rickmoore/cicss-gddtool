
GDDTOOL = {
    _listeners_: { },
    button_labels: {{ button_labels }},
    chart: null,
    chart_labels: {{ chart_labels }},
    chart_types: {{ chart_types }},
    csf_common_url: "{{ csftool_url }}",
    data_mgr: null,
    dates: null,
    display: null,
    wait_widget: null,
    map_dialog_anchor: "#gddtool-location-dialog",
    map_dialog_container: '<div id="gddtool-location-dialog"> </div>',
    max_year: {{ max_year }},
    min_year: {{ min_year }},
    season: "{{ season_description }}",
    server_url: "{{ server_url }}",
    supported_listeners: ["onDataRequest", "onStopWaitWidget"],
    toolname: "gddtool",
    tool_url: "{{ tool_url }}",
    ui: null,
    wait_dialog_anchor: "#gddtool-wait-dialog",
    wait_dialog_container: '<div id="gddtool-wait-dialog"> </div>',

    addCorsHeader: function(xhr) {
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.setRequestHeader('Access-Control-Request-Method', 'GET');
        xhr.setRequestHeader('Access-Control-Request-Headers', 'X-Requested-With');
        xhr.withCredentials = true;
    },

    addDomElement: function(container_id, element_type, options) {
        var container, id;
        if (container_id.indexOf('#') < 0) { id = container_id; } else { id = container_id.substring(1); }
        container = document.getElementById(container_id);
        console.log('DOM :: <' + element_type + ' id="' + id + '" > : ' + container);
        if (container != null) {
            var element = document.createElement(element_type);
            if (typeof options !== 'undefined') { jQuery.each(options, function(key, value) { element.setAttribute(key, value); }); }
            container.appendChild(element);
            return true;
        }
        return false; 
    },

    addListener: function(event_type, function_to_call) {
        if (event_type.substring(0,6) != "load.") {
            var index = this.supported_listeners.indexOf(event_type);
            if (index >= 0) { this._listeners_[event_type] = function_to_call; }
        } else{ this.wait_widget.addListener(event_type.split('.')[1], function_to_call); }
    },

    adjustTimeZone: function(date_value) { return new Date(date_value.toISOString().split('T')[0]+'T12:00:00-04:30'); },

    climateNorms: function(chart_type) {
        var indexes;
        if (chart_type == "trend") { indexes = this.dates.recentTrendIndexes();
        } else { indexes = this.dates.seasonOutlookIndexes(); }
        return this.genDataPairs("normal", indexes[0], indexes[1], indexes[0]);
    },

    dataChanged: function(data_type) {
        if (this.wait_widget.is_active) { this.wait_widget.dataReady(data_type); }
    },

    dateToDateObj: function(date_value) {
        if (date_value instanceof Date) { return this.adjustTimeZone(date_value);
        } else if (Array.isArray(date_value)) { return this.adjustTimeZone(new Date(date_value[0], date_value[1]-1, date_value[2]));
        } else { return new Date(date_value+'T12:00:00-04:30'); }
    },

    dateToDateString: function(date_value) { return this.dateToDateObj(date_value).toISOString().split("T")[0]; },

    dateToTime: function(date_value) {
        if (date_value instanceof Date) { return date_value.getTime();
        } else { return new Date(date_value+'T12:00:00-04:30').getTime(); }
    },

    forecast: function() {
        var indexes = this.dates.forecastIndexes();
        var end = indexes[1];
        var plant = this.dates.indexOf(this.dates.plantDate());
        var start = indexes[0];
        if (start >= plant) { return this.genDataPairs("season", start, end, plant)
        } else if (end >= plant) { return this.genDataPairs("season", plant, end, plant)
        } else { return [ ]; }
    },

    genDataPairs: function(data_type, start, end, base_indx) {
        console.log("\n\nREQUEST :: gen data pairs : " + data_type + " : " + start + " : " + end + " : " + base_indx);
        var indx;
        var data = this.data_mgr._data_[data_type];
        var base = data[base_indx];
        var days = this.dates.days;
        var pairs = [];
        for (indx=start; indx <= end; indx++) {
            if (typeof days[indx] !== 'undefined') { pairs.push([ days[indx], data[indx] - base ]); }
        }
        console.log("DATA for " + pairs.length + " days");
        console.log("   start : " + pairs[0]);
        console.log("   end : " + pairs[pairs.length-1]);
        console.log(pairs);
        console.log('\n\n');
        return pairs;
    },

    genDataRanges: function(data_type, start, end, avg_array, max_array, min_array) {
        var base = avg_array[start];
        var days = this.dates.days;
        console.log("\n\nREQUEST :: gen data range : " + data_type + " : " + start + " : " + end + " : " + start);
        var avg, indx, value;
        var data = [];
        for (indx=start; indx <= end; indx++) {
            if (typeof days[indx] !== 'undefined') { 
                avg = avg_array[indx] - base;
                data.push([ days[indx], avg * min_array[indx], avg * max_array[indx] ]);
            }
        }
        console.log("DATA for " + data.length + " days");
        console.log("   start : " + data[0]);
        console.log("   end : " + data[data.length-1]);
        console.log(data);
        console.log('\n\n');
        return data;
    },

    locationsAreDifferent: function(loc_obj_1, loc_obj_1) {
        return ( (loc_obj_1.address != loc_obj_2.address) ||
                 (loc_obj_1.key != loc_obj_2.key) ||
                 (loc_obj_1.lat != loc_obj_2.lat) ||
                 (loc_obj_1.lng != loc_obj_2.lng) );
    },

    logObjectAttrs: function(obj) { jQuery.each(obj, function(key, value) { console.log("    ATTRIBUTE " + key + " = " + value); }); },

    logObjectHtml: function(container) {
        if (typeof container === 'string') {
            var element = document.getElementById(container);
            console.log(element.outerHTML);
        } else { console.log(contaner.outerHTML); }
    },

    observations: function() {
        var end, indexes;
        indexes = this.dates.observationIndexes();
        console.log("DATA :: SEASON : indexes = " + indexes);
        if (indexes[0] != null) {
            var plant = this.dates.indexOf(this.dates.plantDate());
            end = indexes[1];
            if (plant <= end) { return this.genDataPairs("season", plant, end, plant) }
        }
        return [ ];
    },

    periodOfRecord: function(chart_type) {
        var indexes;
        if (chart_type == "trend") { indexes = this.dates.recentTrendIndexes();
        } else { indexes = this.dates.seasonOutlookIndexes(); }
        var por_avg = this.data_mgr.poravg;
        var por_max = this.data_mgr.pormax;
        var por_min = this.data_mgr.pormin;
        // turn POR data into array of [date, min, max]
        return this.genDataRanges("por",  indexes[0], indexes[1], por_avg, por_max, por_min);
    },

    recentHistory: function(chart_type) {
        var indexes;
        if (chart_type == "trend") { indexes = this.dates.recentTrendIndexes();
        } else { indexes = this.dates.seasonOutlookIndexes(); }
        return this.genDataPairs("recent", indexes[0], indexes[1], indexes[0]);
    },

    uploadAllData: function(loc_obj) {
        console.log("REQUEST :: GDDTOOL.uploadAllData");
        if (!(typeof loc_obj === 'undefined')) { this.location.update(loc_obj, false); }
        this.dates.uploadDaysInSeason(true)
        this.data_mgr.requestDataUpload(true);
        if ("onDataRequest" in this._listeners_) {
            console.log("EXEC CALLBACK :: GDDTOOL.onDataRequest");
            this._listeners_.onDataRequest("onDataRequest");
        }
    },

    waitForDataType: function(data_type) {
        if (this.wait_widget.is_active){
            this.wait_widget.addDataType(data_type);
        } else { this.wait_widget.start([data_type,]); }
    },

    waitForDataTypes: function(data_types) {
        if (this.wait_widget.is_active){
            var state = this;
            jQuery.each(data_types, function(i) {
                state.wait_widget.addDataType(data_types[i]); });
        } else { this.wait_widget.start(data_types); }
    },

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // TO BE CALLED ONLY AFTER PAGE BODY IS COMPLETE
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    createDisplay: function(anchor, options) {
        var chart_options = { default: "trend",
                              gdd_threshold: this.location.gdd_threshold,
                              height: 456,
                              labels: this.chart_labels,
                              location: this.location.location,
                              width: 690 };
        if (typeof options !== 'undefined') {
            this.display = jQuery(anchor).GddToolChart(jQuery.extend({tool:this}, chart_options, options));
        } else { this.display = jQuery(anchor).GddToolChart(jQuery.extend({tool:this}, chart_options)); }
        return this.display;
    },

    createMapDialog: function(anchor, options) {
        var map_options = { width:600, height:500 }
        jQuery(anchor).append(this.map_dialog_container);
        if (options) { 
            jQuery(this.map_dialog_anchor).CsfToolLocationDialog(jQuery.extend({}, map_options, options));
        } else { jQuery(this.map_dialog_anchor).CsfToolLocationDialog(jQuery.extend({}, map_options)); }
        this.map_dialog = jQuery(this.map_dialog_anchor).CsfToolLocationDialog();
        this.map_dialog("google", google);
        return this.map_dialog;
    },

    createUserInterface: function(anchor, options) {
        var ui_options =  { csftool: this.csf_common_url,
                            gddtool: this.tool_url,
                            year_range: [this.min_year, this.max_year] };
        if (typeof options !== 'undefined') {
            this.ui = jQuery(anchor).GddToolUserInterface(jQuery.extend({}, ui_options, options));
        } else { this.ui = jQuery(anchor).GddToolUserInterface(jQuery.extend({}, ui_options)); }
        return this.ui;
    },

    createWaitWidget: function() {
        this.wait_widget.create();
        return this.wait_widget;
    },
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// hiddon content managers
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

;(function(GDDTOOL, jQuery) {

function GddToolWaitWidget(gddtool) {
    var _listeners_;
    this._listeners_ = { };

    var anchor_html, available_types, center_on, container_id, data_ready, data_types, dialog, dialog_anchor, initial_class, is_active, tool, widget_anchor;
    this.anchor_html = '<div id="gddtool-wait-dialog"> </div>';
    this.center_on = "#csftool-display";
    this.container_id = null;
    this.data_ready = [ ];
    this.data_types = [ ];
    this.dialog = null;
    this.dialog_anchor = "#gddtool-wait-dialog";
    this.initial_class = "nowait";
    this.is_active = false;
    this.tool = gddtool;
    this.widget_anchor = "#csftool-content";

    Object.defineProperty(this, "state", { configurable:false, enumerable:false,
        get:function() {
            var widget = jQuery("#csftool-wait-widget")[0];
            if (widget === undefined) { return "nowait"
            } else { return jQuery("#csftool-wait-widget").attr("class"); }
        },
    });

    Object.defineProperty(this, "load_is_complete", {
        configurable:false, enumerable:false,
        get:function() { return (jQuery(this.data_ready).not(this.data_types).length === 0) && (jQuery(this.data_types).not(this.data_ready).length === 0);
        },
    });

    // immutable properties
    Object.defineProperty(this, "supported_listeners", {
        configurable:false, enumerable:false, writable:false,
        value: ["onLoadComplete", "onStart", "onStop"]
    });
}

GddToolWaitWidget.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_listeners.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}

GddToolWaitWidget.prototype.addDataType = function(data_type) {
    if (this.data_ready.indexOf(data_type) < 0) { this.data_types.push(data_type); }
}

GddToolWaitWidget.prototype.close = function() { if (this.dialog != null) { if (this.dialog.isopen) { this.dialog.close(); } } }

GddToolWaitWidget.prototype.create = function(options) {
    var dialog_options = { center_on: this.center_on, };
    if (typeof options !== 'undefined') { dialog_options = jQuery.extend(dialog_options, options); }
    
    var widget = document.getElementById(this.widget_anchor.substring(1));
    console.log("WAIT WIDGET :: create : widget anchor : " + this.widget_anchor + " : " + widget);
    jQuery(this.widget_anchor).append(this.anchor_html);
    console.log("WAIT WIDGET :: create : dialog anchor : " + this.dialog_anchor);
    this.dialog = jQuery(this.dialog_anchor).CsfToolSpinnerDialog(dialog_options);
}

GddToolWaitWidget.prototype.dataReady = function(data_type) {
    console.log(" ");
    console.log("EVENT :: WAIT WIDGET notified : " + data_type + " is ready");
    var exists = this.data_ready.indexOf(data_type);
    if (exists < 0) {
        this.data_ready.push(data_type);
        if (this.load_is_complete) {
            console.log(" ");
            console.log(" ");
            console.log("...... DATA LOAD IS COMPLETE ......")
            console.log(" ");
            console.log(" ");
            if ("onLoadComplete" in this._listeners_) {
                console.log("EVENT :: GddToolWaitWidget.onLoadComplete"),
                this._listeners_.onLoadComplete("onLoadComplete");
            } else { console.log("...... NO " + data_type + " UPLOAD LISTENER AVAILABLE ......"); }
        }
    }
}

GddToolWaitWidget.prototype.open = function() { if (this.dialog != null) { this.dialog.open() } }

GddToolWaitWidget.prototype.start = function(data_types) {
    console.log("EVENT :: GddToolWaitWidget started : waiting for " + data_types);
    if (this.dialog == null) { this.create() }
    if (this.dialog != null) { this.dialog.open() }
    this.is_active = true;
    this.data_ready = [ ];
    if (typeof data_types !== 'undefined') { this.data_types = data_types; }
    if ("onStart" in this._listeners_) { this._listeners_.onStart("onStart", this.data_types); }
}

GddToolWaitWidget.prototype.stop = function() {
    console.log("EVENT :: GddToolWaitWidget stopped : data types in ready pool : " +  this.data_ready);
    if (this.dialog != null) { this.dialog.close() }
    this.is_active = false;
    if ("onStop" in this._listeners_) { this._listeners_.onStop("onStop", this.data_types); }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function GddToolDataManager(tool) {
    var _data_, _listeners_;
    this._data_ = { "normal":[], "poravg":[], "pormax":[], "pormin":[], "recent":[], "season":[] }
    this._listeners_ = { }

    var callback_pending, error_callbacks, wait_widget, tool, upload_callbacks, upload_pending;
    this.callback_pending = [ ];
    this.error_callbacks = { history: null, season: null };
    this.tool = tool;
    this.upload_callbacks = { history: null, season: null };
    this.upload_pending = [ ];
 
    Object.defineProperty(this, "available_types", {
        configurable:false, enumerable:true, 
        get:function() { var available = [ ];
            if (this._data_["season"].length > 0) { available.push("season"); }
            if (this._data_["normal"].length > 0) { available.push("normal"); }
            if (this._data_["recent"].length > 0) { available.push("recent"); }
            if (this._data_["poravg"].length > 0) { available.push("por"); }
            return available;
        }
    });

    Object.defineProperty(this, "normal", {
        configurable:false, enumerable:true, 
        get:function() { return this._data_["normal"]; },
        set:function(data) { this._data_["normal"] = data;
                this.tool.dataChanged("normal");
                if ("onChangeNormal" in this._listeners_) {
                    console.log("EXEC CALLBACK :: GddToolDataManager.onChangeNormal");
                    this._listeners_.onChangeNormal("onChangeNormal");
                } else { if (!("normal" in this.callback_pending)) { this.callback_pending.push("normal"); } }
            }
    });

    Object.defineProperty(this, "por", { 
        configurable:false, enumerable:true,
        get:function() { return [this._data_["poravg"],this._data_["pormin"],this._data_["pormax"]]; },
        set:function(por) {
                var data = { poravg:por[0], pormin:por[1], pormax:por[2] };
                this._data_ = jQuery.extend(this._data_, data);
                this.tool.dataChanged("por");
                if ("onChangePOR" in this._listeners_) {
                    console.log("EXEC CALLBACK :: GddToolDataManager.onChangePOR");
                    this._listeners_.onChangePOR("onChangePOR");
                } else { if (!("por" in this.callback_pending)) { this.callback_pending.push("por"); } }
            }
    });

    Object.defineProperty(this, "poravg", { configurable:false, enumerable:false, get:function() { return this._data_["poravg"]; } });
    Object.defineProperty(this, "pormax", { configurable:false, enumerable:false, get:function() { return this._data_["pormax"]; } });
    Object.defineProperty(this, "pormin", { configurable:false, enumerable:false, get:function() { return this._data_["pormin"]; } });

    Object.defineProperty(this, "recent", {
        configurable:false, enumerable:true,
        get:function() { return this._data_["recent"]; },
        set:function(data) { this._data_["recent"] = data;
                this.tool.dataChanged("recent"); 
                if ("onChangeRecent" in this._listeners_) {
                    console.log("EXEC CALLBACK :: GddToolDataManager.onChangeRecent");
                    this._listeners_.onChangeRecent("onChangeRecent");
                } else { if (!("recent" in this.callback_pending)) { this.callback_pending.push("recent"); } }
            }
    });

    Object.defineProperty(this, "season", {
        configurable:false, enumerable:true, 
        get:function() { return this._data_["season"]; },
        set:function(data) { this._data_["season"] = data;
                this.tool.dataChanged("season");
                if ("onChangeSeason" in this._listeners_) {
                    console.log("EXEC CALLBACK :: GddToolDataManager.onChangeSeason");
                    this._listeners_.onChangeSeason("onChangeSeason");
                } else { if (!("season" in this.callback_pending)) { this.callback_pending.push("season"); } }
            }
    });

    Object.defineProperty(this, "callback_map", {
        configurable:false, enumerable:false, writable:false,
        value: { season: "onChangeSeason", recent: "onChangeRecent", normal: "onChangeNormal", por: "onChangePOR" }
    });

    // immutable properties
    Object.defineProperty(this, "data_arrays", { configurable:false, enumerable:false, writable:false, value: ["normal", "poravg", "pormax", "pormin", "recent", "season"] });
    Object.defineProperty(this, "data_types", { configurable:false, enumerable:false, writable:false, value: ["normal", "por", "recent", "season"] });

    Object.defineProperty(this, "supported_listeners", {
        configurable:false, enumerable:false, writable:false,
        value: ["onChangeSeason", "onChangeRecent", "onChangeNormal", "onChangePOR", "onDataRequest", "onUpdate"]
    });
}

GddToolDataManager.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_listeners.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}

GddToolDataManager.prototype.callListeners = function(event_type, obj) {
    console.log("EXEC CALLBACK :: GddToolDataManager." + event_type);
    this.tool.logObjectAttrs(obj);
    if (event_type in this._listeners_) {
        var listeners = this._listeners_[event_type];
        if (jQuery.isArray(listeners)) {
            for (var i=0; i < listeners.length; i++) { listeners[i](obj); }
        } else { listeners(obj) }
    }
}

GddToolDataManager.prototype.dataAt = function(data_type, index) { return this._data_[data_type][index]; }
GddToolDataManager.prototype.dataLength = function(data_type) { return this._data_[data_type].length; }

GddToolDataManager.prototype.executePendingCallbacks = function() {
    if (this.callback_pending.length > 0) {
        console.log("EXEC :: GddToolDataManager.executePendingCallbacks");
        var keys = this.callback_pending;
        for (var i in keys) {
            console.log("    EXEC CALLBACK :: GddToolDataManager." +  keys[i]);
            var callback = this._listeners_[this.callback_map[keys[i]]];
            if (typeof callback !== 'undefined') { callback(this); }
        }
    }
}

GddToolDataManager.prototype.requestDataUpload = function(wait) {
    console.log("REQUEST :: GddToolDataManager.requestDataUpload");
    if ("onDataRequest" in this._listeners_) {
        console.log("EXEC CALLBACK :: GddToolDataManager.onDataRequest");
        this._listeners_.onDataRequest("onDataRequest");
    }
    this.uploadSeasonData(wait);
    this.uploadHistoryData(wait);
}

GddToolDataManager.prototype.update = function(data_dict) {
    var changed = [];
    // update the data in the order the type-specific listeners should fire
    if ("season" in data_dict) { this.season = data_dict["season"]; changed.push("season"); }
    if ("recent" in data_dict) { this.recent = data_dict["recent"]; changed.push("recent"); }
    if ("normal" in data_dict) { this.normal = data_dict["normal"]; changed.push("normal"); }
    if ("poravg" in data_dict) { this.por = [data_dict["poravg"], data_dict["pormin"], data_dict["pormax"]]; changed.push("por"); }
    if ( (changed.length > 0) && ("onUpdate" in this._listeners_) ) {
        console.log("EXEC CALLBACK :: GddToolDataManager.onUpdate");
        this._listeners_["onUpdate"]("onUpdateData", changed, this); 
    }
}

GddToolDataManager.prototype.uploadHistoryData = function(wait) {
    var loc = this.tool.location;
    console.log("REQUEST :: GddToolDataManager.uploadHistoryData");
    if (wait === true) { this.tool.waitForDataTypes(["normal","por","recent"]); }
    var url = this.tool.tool_url + '/data/history';
    var query = {location:{key:loc.key, address:loc.address, lat:loc.lat, lon:loc.lng}, gdd_threshold:loc.gdd_threshold, season:this.tool.dates.season}
    query = JSON.stringify(query);
    console.log("QUERY :: " + query);
    var options = { url:url, type:'post', dataType:'json', crossDomain:true, data:query,
                    error: this.error_callbacks.history, success: this.upload_callbacks.history,
                    beforeSend: function(xhr) { GDDTOOL.addCorsHeader(xhr); }
    }
    this._data_ = jQuery.extend(this._data_, {"normal":[],"poravg":[],"pormax":[],"pormin":[],"recent":[]});
    jQuery.ajax(options);
}

GddToolDataManager.prototype.uploadSeasonData = function (wait) {
    var loc = this.tool.location._state_;
    console.log("REQUEST :: GddToolDataManager.uploadSeasonData");
    if (wait === true) { this.tool.waitForDataType("season"); }
    var url = this.tool.tool_url + '/data/season';
    var query = {location:{key:loc.key, address:loc.address, lat:loc.lat, lon:loc.lng}, gdd_threshold:loc.gdd_threshold, season:this.tool.dates.season}
    query = JSON.stringify(query);
    console.log("QUERY :: " + query);
    var options = { url:url, type:'post', dataType:'json', crossDomain:true, data:query,
                    error:this.error_callbacks.season, success:this.upload_callbacks.season,
                    beforeSend: function(xhr) { GDDTOOL.addCorsHeader(xhr); },
    }
    this._data_["season"] = [ ] ;
    jQuery.ajax(options);
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function GddToolDates(gddtool) {
    var _dates_, _days_, _indexes_, _listeners_;

    this._dates_ = { "fcast_start":null, "fcast_end":null, "last_obs":null, "plant_date": null };
    this._days_ = [ ];
    this._indexes_ = [ ];
    this._listeners_ = { };

    var default_plant_day, error_callback, season_end_day, season_start_day, season_is_clipped, tool, upload_callback;
    this.default_plant_day = {{ default_plant_day }};
    this.error_callback = null;
    this.season_end_day = {{ season_end_day }};
    this.season_is_clipped = false;
    this.season_start_day = {{ season_start_day }};
    this.tool = gddtool;
    this.upload_callback = null;

    // protected  properties
    Object.defineProperty(this, "days", {
        configurable:false, enumerable:true,
        get:function() { return this._days_; },
        set:function(days_array) {
                this._days_ = days_array.map(function(day) { return GDDTOOL.dateToTime(day); });
                this.tool.dataChanged("days");
                if ("onChangeDays" in this._listeners_) {
                    console.log("EXEC CALLBACK :: GddToolDates.onChangeDays");
                    this._listeners_.onChangeDays("onChangeDays", this._days_);
                }
            }
    });

    Object.defineProperty(this, "fcast_end", {
        configurable:false, enumerable:true,
        get:function() { return this._dates_["fcast_end"]; },
        set:function(new_date) {
            var fcast_end = this.tool.dateToDateObj(new_date);
            if (fcast_end <= this.season_end_date) { this._dates_["fcast_end"] = fcast_end; } else { this._dates_["fcast_end"] = null; }
            console.log("EVENT :: GddToolDates : forecast end date changed : " + this._dates_["fcast_end"]);
        }
    });

    Object.defineProperty(this, "fcast_start", {
        configurable:false, enumerable:true,
        get:function() { return this._dates_["fcast_start"]; },
        set:function(new_date) { var fcast_start = this.tool.dateToDateObj(new_date);
            if (fcast_start <= this.season_end_date) { this._dates_["fcast_start"] = fcast_start; } else { this._dates_["fcast_start"] = null; }
            console.log("EVENT :: GddToolDates : forecast start date changed : " + this._dates_["fcast_start"]);
        }
    });

    Object.defineProperty(this, "last_obs", {
        configurable:false, enumerable:true,
        get:function() { return this._dates_["last_obs"]; },
        set:function(new_date) { 
            var season_end = this.seasonEndDate();
            var last_obs = this.tool.dateToDateObj(new_date);
            if (last_obs < season_end) {
                this._dates_["last_obs"] = last_obs;
                console.log("EVENT :: GddToolDates.last_obs changed : " + this._dates_["last_obs"]);
                if (this.season_is_clipped) { this.season_is_clipped = false;
                    if ("onResetTrend" in this._listeners_) {
                        console.log("EXEC CALLBACK :: GddToolDates.onResetTrend");
                        this._listeners_.onResetTrend("onResetTrend", last_obs);
                    }
                }
            } else {
                this._dates_["last_obs"] = season_end;
                console.log("EVENT :: GddToolDates.last_obs changed : " + this._dates_["last_obs"]);
                if (!(this.season_is_clipped)) { 
                    this.season_is_clipped = true;
                    if ("onClipSeason" in this._listeners_) {
                        console.log("EXEC CALLBACK :: GddToolDates.onClipSeason");
                        this._listeners_.onClipSeason("onClipSeason", last_obs);
                    }
                }
            }
        }
    });

    Object.defineProperty(this, "num_days_in_season", {
        configurable:false, enumerable:false,
        get:function() { return this._days_.length; }
    });

    Object.defineProperty(this, "plant_date", {
        configurable:false, enumerable:false,
        get:function() { return this._dates_["plant_date"]; },
        set:function(new_date) {
            var next_date = this.tool.dateToDateObj(new_date);
            var plant_year = next_date.getFullYear();
            var prev_date = this._dates_["plant_date"];
            if (next_date != prev_date) {
                this._dates_["plant_date"] = next_date;
                console.log("EVENT :: GddToolDates.plant_date changed : " + this._dates_["plant_date"]);
                if (prev_date != null && "onChangePlantDate" in this._listeners_) {
                    console.log("EXEC CALLBACK :: GddToolDates.onChangePlantDate : " + next_date);
                    this._listeners_.onChangePlantDate("onChangePlantDate", prev_date, next_date);
                }
            }
        }
    });

    Object.defineProperty(this, "season", { 
        configurable:false, enumerable:false,
        get:function() { return this._dates_["season"]; },
        set:function(year) {
            var prev_year = this._dates_['season'];
            var new_year = Number(year);
            if (new_year != prev_year) {
                console.log("EVENT :: GddToolDates season changed : " + new_year);
                this._dates_['season'] = new_year;
                var date_array = jQuery.merge([this.season,],this.season_end_day);
                this._dates_['season_end'] =  this.tool.dateToDateString(date_array);
                console.log("         season_end = " + this._dates_['season_end']);
                this._dates_["season_end_date"] = this.tool.dateToDateObj(date_array);
                console.log("         season_end_date = " + this._dates_['season_end_date']);
                date_array = jQuery.merge([this.season,],this.season_start_day);
                this._dates_['season_start'] = this.tool.dateToDateString(date_array);
                console.log("         season_start = " + this._dates_['season_start']);
                this._dates_['season_start_date'] = this.tool.dateToDateObj(date_array);
                console.log("         season_start_date = " + this._dates_['season_start_date']);
                if (prev_year != null && "onChangeSeason" in this._listeners_) {
                    this._listeners_.onChangeSeason("onChangeSeason", new_year); 
                }
            }
        }
    });

    Object.defineProperty(this, "season_end", { configurable:false, enumerable:false, get:function() { return this._dates_['season_end']; } });
    Object.defineProperty(this, "season_end_date", { configurable:false, enumerable:false, get:function() { return this._dates_["season_end_date"]; } });
    Object.defineProperty(this, "season_start", { configurable:false, enumerable:false, get:function() { return this._dates_['season_start']; } });
    Object.defineProperty(this, "season_start_date", { configurable:false, enumerable:false, get:function() { return this._dates_['season_start_date']; } });

    //immmutable properties
    Object.defineProperty(this, "supported_listeners", { configurable:false, enumerable:false, writable:false,
        value: ["onChangeDays","onChangePlantDate", "onChangeSeason", "onClipSeason", "onResetTrend", "onUpdate"] });
}

GddToolDates.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_listeners.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}

GddToolDates.prototype.callListeners = function(event_type, obj) {
    if (event_type in this._listeners_) {
        var listeners = this._listeners_[event_type];
        if (jQuery.isArray(listeners)) {
            for (var i=0; i < listeners.length; i++) { listeners[i](obj); }
        } else { listeners(obj) }
    }
}

GddToolDates.prototype.forecastDates = function() { return [this.fcast_start, this.fcast_end]; }
GddToolDates.prototype.forecastIndexes = function() {
    var dates = this.forecastDates();
    if (dates[0] != null) { return this.indexesForDatePair(dates); } else { return [null, null] }
}

GddToolDates.prototype.indexesForDatePair = function(date_pair) { return [this.indexOf(date_pair[0]), this.indexOf(date_pair[1])+1] }

GddToolDates.prototype.indexOf = function(date_type) {
    if (date_type instanceof Date) { return this._days_.indexOf(date_type.getTime());
    } else {
        var the_date = this._dates_[date_type];
        if (the_date == null) { return -1 }
        return this._days_.indexOf(the_date.getTime());
    }
}

GddToolDates.prototype.observationDates = function() { return [this.season_start_date, this.last_obs]; }
GddToolDates.prototype.observationIndexes = function() {
    console.log("OBSERVATION INDEXES :: last_obs = " + this.last_obs + " : season_start = " + this.season_start_date);
    if (this.last_obs != null) {
        return [this.indexOf(this.season_start_date), this.indexOf(this.last_obs)]
    } else { return [null, null] }
}

GddToolDates.prototype.plantDate = function() {
    var plant_date = this._dates_.plant_date;
    if (plant_date == null) { plant_date = this.tool.dateToDateObj(jQuery.merge([this.season,],this.default_plant_day)) }
    return plant_date;
}

GddToolDates.prototype.recentTrendDates = function() {
    var plant_date = this.plantDate();
    var end_date = this.fcast_end;
    if (end_date == null) { end_date = this.last_obs; }
    if (end_date != null && plant_date < end_date) { return [plant_date, end_date]; }
    // plant date set to future ... give them eareir of 30 days or season end
    var season_end = this.seasonEndDate();
    end_date = plant_date.getDate() + 30;
    if (end_date < season_end) { return [plant_date, end_date];
    } else { return [plant_date, season_end]; }
}
GddToolDates.prototype.recentTrendIndexes = function() {
    return this.indexesForDatePair(this.recentTrendDates());
}

GddToolDates.prototype.seasonEndDate = function(year) {
    if (typeof year == 'undefined') { return this.tool.dateToDateObj(jQuery.merge([this.season,],this.season_end_day));
    } else { return this.tool.dateToDateObj(jQuery.merge([year,],this.season_end_day)); }
}

GddToolDates.prototype.seasonOutlookDates = function() { return [this.plantDate(), this.seasonEndDate()]; }
GddToolDates.prototype.seasonOutlookIndexes = function() { return [this.indexOf(this.plantDate()), this.indexOf(this.seasonEndDate())]; }

GddToolDates.prototype.seasonStartDate = function(year) {
    if (typeof year === 'undefined') { return this.tool.dateToDateObject(jQuery.merge([this.season,],this.season_start_day));
    } else { return this.tool.dateToDateObject(jQuery.merge([year,],this.season_start_day)); }
}

GddToolDates.prototype.update = function(date_dict) {
    console.log('EVENT :: GddToolDates.update :');
    this.tool.logObjectAttrs(date_dict);
    var changed = [];
    if ("last_obs" in date_dict) { this.last_obs = date_dict["last_obs"]; changed.push("last_obs"); }
    if ("fcast_start" in date_dict) { this.fcast_start = date_dict.fcast_start; changed.push("fcast_start");
    } else { this.fcast_start = null; }
    if ("fcast_end" in date_dict) { this.fcast_end = date_dict.fcast_end; changed.push("fcast_end"); 
    } else { this.fcast_end = null; }
    if ( (changed.length > 0) && ("onUpdate" in this._listeners_) ) { 
        this._listeners_.onUpdate("onUpdate", changed); }
}

GddToolDates.prototype.uploadDaysInSeason = function(wait) {
    console.log("REQUEST :: uploadDaysInSeason");
    if (wait === true) { this.tool.waitForDataType("days"); }
    var url = this.tool.tool_url + '/data/daysInSeason';
    console.log("REQUEST URL :: " + url);
    var query = { season:this.season, season_start:this.season_start, season_end:this.season_end }
    query = JSON.stringify(query);
    console.log("QUERY :: " + query);
    this._days_ = [ ];
    jQuery.ajax({ url:url, type:'post', dataType:'json', crossDomain:true, data:query,
        error: this.error_callback, success: this.upload_callback,
        beforeSend: function(xhr) { GDDTOOL.addCorsHeader(xhr); },
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function GddToolLocation(tool){
    var _listeners_, _state_;
    this._listeners_ = { };
    this._state_ = { "address":null, "gdd_threshold":null, "lat":null, "lng":null, "key":null, "plant_date":null };

    var tool;
    this.tool = tool;

    // protected properties
    Object.defineProperty(GddToolLocation.prototype, "coords", { configurable:false, enumerable:false,
        get:function() { return [ this._state_['lat'], this._state_['lng'] ]; },
        set:function(coords) {
                var changed, lat, lng;
                if (coords instanceof Array) { lat = coords[0]; lng = coords[1]; } else { lat = coords.lat; lng = coords.lng; }
                if (lat != this._state_.lat) { this._state_.lat = lat; changed = true; }
                if (lng != this._state_.lng) { this._state_.lng = lng; changed = true; }
                if (changed == true) {
                    if ("onChangeCoords" in this._listeners_) {
                        this._listeners_.onChangeCoords("onChangeCoords", { "lat":coords["lat"],"lng":coords["lng"] });
                    }
                }
            },
    });

    Object.defineProperty(GddToolLocation.prototype, "address", { configurable:false, enumerable:false,
        get:function() { return this._state_['address']; },
        set:function(value) { this._state_['address'] = value; },
    });

    Object.defineProperty(GddToolLocation.prototype, "lat", { configurable:false, enumerable:false, get:function() { return this._state_['lat']; }, });
    Object.defineProperty(GddToolLocation.prototype, "lng", { configurable:false, enumerable:false, get:function() { return this._state_['lng']; }, });

    Object.defineProperty(GddToolLocation.prototype, "key", { configurable:false, enumerable:false,
        get:function() { return this._state_['key']; },
        set:function(value) { this._state_['key'] = value; },
    });

    Object.defineProperty(GddToolLocation.prototype, "gdd_threshold", {
        configurable:false, enumerable:true, 
        get:function() { return this._state_["gdd_threshold"]; },
        set:function(value) {
                if (value != this._state_["gdd_threshold"]) {
                    this._state_["gdd_threshold"] = value;
                    console.log("EVENT :: GddToolLocation GDD threshold changed : " + this._state_["gdd_threshold"]);
                    if ("onChangeGddThreshold" in this._listeners_) {
                        console.log("EXEC CALLBACK :: GddToolLocation.onChangeGddThreshold : " + value);
                        this._listeners_.onChangeGddThreshold("onChangeGddThreshold", value);
                    }
                }
            }
    });

    Object.defineProperty(GddToolLocation.prototype, "plant_date", { configurable:false, enumerable:true,
        get:function() { return this._state_["plant_date"]; },
        set:function(date_value) {
                var date_obj = this.tool.dateToDateObj(date_value);
                var prev_date = this._state_["plant_date"];
                if (date_obj != prev_date) {
                    this._state_["plant_date"] = date_obj; 
                    console.log("EVENT :: GddToolLocation plant date changed : " + this._state_["plant_date"]);
                    if (prev_date != null && "onChangePlantDate" in this._listeners_) {
                        console.log("EXEC CALLBACK :: GddToolLocation.onChangePlantDate : " + date_obj)
                        this._listeners_.onChangePlantDate("onChangePlantDate", date_obj);
                    }
                }
            }
    });

    Object.defineProperty(GddToolLocation.prototype, "location", { configurable:false, enumerable:false, get:function() { return jQuery.extend({}, this._state_); }, });

    // immutable properties
    Object.defineProperty(GddToolLocation.prototype, "supported_listeners", { configurable:false, enumerable:false, writable:false, value: ["onChangeCoords","onChangeGddThreshold","onChangePlantDate","onUpdate"] });
}

// functions
GddToolLocation.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_listeners.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}

GddToolLocation.prototype.callListeners = function(event_type, obj) {
    if (event_type in this._listeners_) {
        var listeners = this._listeners_[event_type];
        if (jQuery.isArray(listeners)) {
            for (var i=0; i < listeners.length; i++) { listeners[i](obj); }
        } else { listeners(obj) }
    }
}

GddToolLocation.prototype.init = function(loc_obj, gdd_threshold, plant_date) {
    this._state_ = jQuery.extend(this._state_, loc_obj);
    this._state_["gdd_threshold"] = gdd_threshold;
    if (plant_date != null) { this._state_["plant_date"] = this.tool.dateToDateObj(plant_date); }
    console.log("GDDTOOL :: initial location : " + this._state_.key);
    console.log("           address : " + this._state_.address);
    console.log("           GDD threshold : " + this._state_.gdd_threshold);
    console.log("           plant date : " + this._state_.plant_date);
}

GddToolLocation.prototype.persist = function() {
    loc_json = '{"prototype":"CsfToolLocationState","_state_":{' + JSON.stringify(this._state_) + '}}';
    console.log("persisting " + loc_json);
}

GddToolLocation.prototype.persist = function() {
    loc_json = '{"prototype":"GddToolLocation","_state_":{' + JSON.stringify(this._state_) + '}}';
    console.log("persisting " + loc_json);
}

GddToolLocation.prototype.update = function(new_loc, fire_event) {
    var changed = false;
    console.log("EVENT :: GddToolLocation.update : " + new_loc);
    this.tool.logObjectAttrs(new_loc);
    if (new_loc.key != this.key) { this.key = new_loc.key; changed=true; }
    if (new_loc.address != this.address) { this.address = new_loc.address;  changed=true;}
    var new_lng = new_loc.lng;
    if (typeof new_lng === 'undefined') { new_lng = new_loc.lon; }
    if ( (new_loc.lat != this.lat) | (new_lng != this.lng) ) { this.coords = [new_loc.lat, new_lng];  changed=true; }
    if (typeof new_loc.gdd_threshold !== 'undefined') { this.gdd_threshold = new_loc.gdd_threshold; changed = true; } 
    if (typeof new_loc.plant_date !== 'undefined') { this.plant_date = new_loc.plant_date; changed = true; }
    var should_fire_event = ("onUpdate" in this._listeners_ && changed == true && fire_event != false);
    if (should_fire_event) { 
        console.log("EXEC CALLBACK :: GddToolLocation.onUpdateLocation");
        var loc_obj = jQuery.extend({}, this._state_);
        var callback = this._listeners_.onUpdate;
        callback("onUpdateLocation", loc_obj);
    }
    console.log("COMPLETE :: GddToolLocation.update");
}

console.log("GDDTOOL :: INITIALIZING");
jQuery.ajaxPrefilter(function(options, original_request, jqXHR) { jqXHR.original_request = original_request; });
 
GDDTOOL.wait_widget = new GddToolWaitWidget(GDDTOOL);

// get last used location and it's parameters from browser storage
var gdd_threshold = "{{ gdd_threshold }}";
var prev_loc = { key:"{{ location_key }}", address:"{{ location_address }}",
                 lat:{{ location_lat }}, lng:{{ location_lon }}, }
var prev_plant_date = null;
var prev_season = {{ season }};
if (prev_season == null) { prev_season = new Date().getFullYear(); }
if (prev_plant_date == null) { prev_plant_date = GDDTOOL.dateToDateObj([prev_season,1,1]); }

GDDTOOL.dates = new GddToolDates(GDDTOOL);
GDDTOOL.dates.plant_date = prev_plant_date;
GDDTOOL.dates.season = prev_season;

GDDTOOL.dates.error_callback = function(jq_xhr, status_text, error_thrown) {
    console.log('ERROR CALLBACK :: GDDTOOL.dates.upload : ' + error_thrown);
    console.log('  request : ' + jq_xhr.original_request.uri);
    console.log('  status : ' + status_text);
    console.log('  jqXHR : ' + jq_xhr.readyState, + ' : ' + jq_xhr.status + ' : ' + jq_xhr.statusText);
    console.log('  response text : ' + jq_xhr.responseText);
    console.log('  response xml : ' + jq_xhr.responseXML);
    console.log('  headers : ' + jq_xhr.getAllResponseHeaders());
}
GDDTOOL.dates.upload_callback = function(data_dict, status_text, jq_xhr) {
    console.log('CALLBACK :: GDDTOOL.dates.upload : COMPLETE');
    GDDTOOL.dates.days = data_dict.days;
}

GDDTOOL.location = new GddToolLocation(GDDTOOL);
GDDTOOL.location.init(prev_loc, gdd_threshold, prev_plant_date);

GDDTOOL.data_mgr = new GddToolDataManager(GDDTOOL);
GDDTOOL.data_mgr.error_callbacks.history = function(jq_xhr, status_text, error_thrown) {
    console.log('ERROR CALLBACK : GDDTOOL.data_mgr.upload History : ' + error_thrown);
    jQuery.each(jq_xhr.original_request, function(key, value) { console.log("    " + key + " : " + value); });
    console.log('  request : ' + jq_xhr.original_request.uri);
    console.log('  status : ' + status_text);
    console.log('  jqXHR : ' + jq_xhr.readyState, + ' : ' + jq_xhr.status + ' : ' + jq_xhr.statusText);
    console.log('  response text : ' + jq_xhr.responseText);
    console.log('  response xml : ' + jq_xhr.responseXML);
    console.log('  headers : ' + jq_xhr.getAllResponseHeaders());
}
GDDTOOL.data_mgr.error_callbacks.season = function(jq_xhr, status_text, error_thrown) {
    console.log('ERROR CALLBACK : GDDTOOL.data_mgr.upload Season : ' + error_thrown);
    console.log('  request : ' + jq_xhr.original_request.uri);
    console.log('  status : ' + status_text);
    console.log('  jqXHR : ' + jq_xhr.readyState, + ' : ' + jq_xhr.status + ' : ' + jq_xhr.statusText);
    console.log('  response text : ' + jq_xhr.responseText);
    console.log('  response xml : ' + jq_xhr.responseXML);
    console.log('  headers : ' + jq_xhr.getAllResponseHeaders());
}
GDDTOOL.data_mgr.upload_callbacks.history = function(data_dict, status_text, jq_xhr) {
    console.log('CALLBACK :: GDDTOOL.data_mgr.upload History : COMPLETE');
    GDDTOOL.data_mgr.update(data_dict.history.data);
}
GDDTOOL.data_mgr.upload_callbacks.season = function(data_dict, status_text, jq_xhr) {
    console.log("CALLBACK :: GDDTOOL.data_mgr.upload Season : COMPLETE");
    GDDTOOL.logObjectAttrs(data_dict.season.dates);
    GDDTOOL.dates.update(data_dict.season.dates);
    GDDTOOL.logObjectAttrs(data_dict.season.location);
    GDDTOOL.location.update(data_dict.season.location);
    GDDTOOL.data_mgr.update(data_dict.season.data);
}

console.log("GDDTOOL FULLY INITIALIZED");

})(GDDTOOL, jQuery);
