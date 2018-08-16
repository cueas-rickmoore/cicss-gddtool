
GDDTOOL = {
    _listeners_: { },
    button_labels: {{ button_labels }},
    chart: null,
    chart_labels: {{ chart_labels }},
    chart_types: {{ chart_types }},
    csf_common_url: "{{ csftool_url }}",
    data: null,
    dates: null,
    display: null,
    load_wait_widget: null,
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

    addCorsHeader: function(xhr) {
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.setRequestHeader('Access-Control-Request-Method', 'GET');
        xhr.setRequestHeader('Access-Control-Request-Headers', 'X-Requested-With');
        xhr.withCredentials = true;
    },

    addListener: function(event_type, function_to_call) {
        if (event_type.substring(0,6) != "load.") {
            var index = this.supported_listeners.indexOf(event_type);
            if (index >= 0) { this._listeners_[event_type] = function_to_call; }
        } else{ this.load_wait_widget.addListener(event_type.split('.')[1], function_to_call); }
    },

    adjustTimeZone: function(date_value) { return new Date(date_value.toISOString().split('T')[0]+'T12:00:00-04:30'); },

    climateNorms: function(chart_type) {
        var indexes;
        if (chart_type == "trend") { indexes = this.dates.recentTrendIndexes();
        } else { indexes = this.dates.seasonOutlookIndexes(); }
        var start = indexes[0];
        return this.data.genDataPairs("normal", start, indexes[1], start)
    },

    dataChanged: function(data_type) { if (this.load_wait_widget.state == "wait") { this.load_wait_widget.dataReady(data_type); } },

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
        var plant = this.dates.indexOf(this.dates.plantDate());
        var start = indexes[0];
        var end = indexes[1];
        if (start >= plant) { return this.genDataPairs("forecast", start, end, plant)
        } else if (end >= plant) { return this.genDataPairs("forecast", plant, end, plant)
        } else { return [ ]; }
    },

    genDataPairs: function(data_type, start, end, base) {
        var base_value = this.data.dataAt(data_type, base);
        var slice = this.data.sliceData(data_type, start, end);
        var days = this.dates.sliceDays([start, end]);
        var pairs = [ ];
        if (typeof base_value !== 'undefined') {
            for (var i=0; i < slice.length; i++) { pairs.push([ days[i], slice[i]-base_value ]); }
        } else {
            for (var i=0; i < slice.length; i++) { pairs.push([ days[i], slice[i] ]); }
        }
        return pairs;
    },

    locationsAreDifferent: function(loc_obj_1, loc_obj_1) {
        return ( (loc_obj_1.address != loc_obj_2.address) ||
                 (loc_obj_1.key != loc_obj_2.key) ||
                 (loc_obj_1.lat != loc_obj_2.lat) ||
                 (loc_obj_1.lng != loc_obj_2.lng) );
    },

    logObjectAttrs: function(obj) { jQuery.each(obj, function(key, value) { console.log("    ATTRIBUTE " + key + " = " + value); }); },

    observations: function() {
        var indexes = this.dates.observationIndexes();
        if (indexes[0] == null) { return [ ]; }
        var plant = this.dates.indexOf(this.dates.plantDate());
        var end = indexes[1];
        if (plant <= end) { return this.genDataPairs("season", plant, end, plant) }
        return [ ];
    },

    periodOfRecord: function(chart_type) {
        var indexes;
        if (chart_type == "trend") { indexes = this.dates.recentTrendIndexes();
        } else { indexes = this.dates.seasonOutlookIndexes(); }
        var start = indexes[0];
        return this.data.genPeriodOfRecord(start, indexes[1], start)
    },

    recentHistory: function(chart_type) {
        var indexes;
        if (chart_type == "trend") { indexes = this.dates.recentTrendIndexes();
        } else { indexes = this.dates.seasonOutlookIndexes(); }
        var start = indexes[0];
        return this.data.genDataPairs("recent", start, indexes[1], start)
    },

    uploadAllData: function(loc_obj) {
        if (!(typeof loc_obj === 'undefined')) { this.location.update(loc_obj, false); }
        this.dates.uploadDaysInSeason()
        this.data.uploadSeasonData();
        this.data.uploadHistoryData();
    },

    waitForDataType: function(data_type) {
        if (this.load_wait_widget.is_active){
            this.load_wait_widget.addDataType(data_type);
        } else { this.load_wait_widget.start([data_type,]); }
    },

    waitForDataTypes: function(data_types) {
        if (this.load_wait_widget.is_active){
            var state = this;
            jQuery.each(data_types, function(i) {
                state.load_wait_widget.addDataType(data_types[i]); });
        } else { this.load_wait_widget.start(data_types); }
    },
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function GddToolDataLoadWidget(upload_complete_listener) {
    var _listeners_;
    this._listeners_ = { };

    var data_types, data_ready, html, is_active;
    this.data_ready = [ ];
    this.data_types = [ ];
    this.html = '<div id="csftool-wait-widget" class="nowait">';
    this.is_active = false;

    Object.defineProperty(this, "state", { configurable:false, enumerable:false,
        get:function() {
            var widget=jQuery("#csftool-wait-widget")[0];
            if (widget === undefined) { return "nowait"
            } else { return jQuery("#csftool-wait-widget").attr("class"); }
        },
    });

    Object.defineProperty(this, "load_is_complete", {
        configurable:false, enumerable:false,
        get:function() {
            return (jQuery(this.data_ready).not(this.data_types).length === 0) && (jQuery(this.data_types).not(this.data_ready).length === 0);
        },
    });

    // immutable properties
    Object.defineProperty(this, "supported_listeners", {
        configurable:false, enumerable:false, writable:false,
        value: ["onStart", "onLoadComplete"]
    });
}

GddToolDataLoadWidget.prototype.addListener = function(event_type, function_to_call) {
    var index = this.supported_listeners.indexOf(event_type);
    if (index >= 0) { this._listeners_[event_type] = function_to_call; }
}

GddToolDataLoadWidget.prototype.addDataType = function(data_type) {
    var exists = this.data_ready.indexOf(data_type);
    if (exists < 0) { this.data_types.push(data_type); }
}

GddToolDataLoadWidget.prototype.dataReady = function(data_type) {
    var exists = this.data_ready.indexOf(data_type);
    if (exists < 0) {
        this.data_ready.push(data_type);
        if (this.load_is_complete) {
            this.stop();
            if ("onLoadComplete" in this._listeners_) {
                this.onLoadComplete("onLoadComplete")
            } else { console.log("...... NO UPLOAD LISTENER AVAILABLE ......"); }
        }
    }
}

GddToolDataLoadWidget.prototype.start = function(data_types) {
    jQuery("#csftool-wait-widget").attr("class","wait");
    this.is_active = true;
    this.data_ready = [ ];
    this.data_types = data_types;
    if ("onStart" in this._listeners_) { this._listeners_.onStart("onStart", this.data_types); }
}

GddToolDataLoadWidget.prototype.stop = function() {
    var widget = jQuery("#csftool-wait-widget")[0];
    widget.setAttribute("class","nowait");
    this.is_active = false;
    if ("onLoadComplete" in this._listeners_) { this._listeners_.onLoadComplete("onLoadComplete", this.data_ready); }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function GddToolDataManager(tool) {
    var _data_, _listeners_;
    this._data_ = { "normal":[], "poravg":[], "pormax":[], "pormin":[], "recent":[], "season":[] }
    this._listeners_ = { }

    var callback_pending, error_callbacks, load_wait_widget, tool, upload_callbacks, upload_pending;
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
                    this._listeners_.onChangePOR("onChangePOR");
                } else { if (!("por" in this.callback_pending)) { this.callback_pending.push("por"); } }
            }
    });

    Object.defineProperty(this, "recent", {
        configurable:false, enumerable:true,
        get:function() { return this._data_["recent"]; },
        set:function(data) { this._data_["recent"] = data;
                this.tool.dataChanged("recent"); 
                if ("onChangeRecent" in this._listeners_) {
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
                    this._listeners_.onChangeSeason("onChangeSeason");
                } else { if (!("season" in this.callback_pending)) { this.callback_pending.push("season"); } }
            }
    });

    Object.defineProperty(this, "callback_map", {
        configurable:false, enumerable:false, writable:false,
        value: { season: "onChangeSeason", recent: "onChangeRecent", normal: "onChangeNormal", por: "onChangePOR" }
    });

    // immutable properties
    Object.defineProperty(this, "data_arrays", {
        configurable:false, enumerable:false, writable:false,
        value: ["normal", "poravg", "pormax", "pormin", "recent", "season"]
    });

    Object.defineProperty(this, "data_types", {
        configurable:false, enumerable:false, writable:false,
        value: ["normal", "por", "recent", "season"]
    });

    Object.defineProperty(this, "load_is_complete", {
        configurable:false, enumerable:false,
        get:function() { return this.load_wait_widget.load_is_complete; }
    });

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
        var keys = this.callback_pending;
        for (var i in keys) {
            var callback = this._listeners_[this.callback_map[keys[i]]];
            if (typeof callback !== 'undefined') { callback(this); }
        }
    }
}

GddToolDataManager.prototype.sliceData = function(data_type, start_index, end_index) {
    var data_array = this._data_[data_type];
    if ( (end_index == undefined) | (end_index == null) ) {
        return data_array.slice(start_index, -1)
    } else { return data_array.slice(start_index, end_index) }
}

GddToolDataManager.prototype.requestDataUpload = function() {
    if ("onDataRequest" in this._listeners_) { this._listeners_.onDataRequest("onDataRequest"); }
    this.uploadSeasonData();
    this.uploadHistoryData();
}

GddToolDataManager.prototype.stopWaitWidget = function() {
    this.load_wait_widget.stop(); 
    if ("onStopWaitWidget" in this._listeners_) { this._listeners_.onStopWaitWidget(); }
}

GddToolDataManager.prototype.update = function(data_dict) {
    var changed = [];
    // update the data in the order the type-specific listeners should fire
    if ("season" in data_dict) { this.season = data_dict["season"]; changed.push("season"); }
    if ("recent" in data_dict) { this.recent = data_dict["recent"]; changed.push("recent"); }
    if ("normal" in data_dict) { this.normal = data_dict["normal"]; changed.push("normal"); }
    if ("poravg" in data_dict) { this.por = [data_dict["poravg"], data_dict["pormin"], data_dict["pormax"]]; changed.push("por"); }
    if ( (changed.length > 0) && ("onUpdate" in this._listeners_) ) { this._listeners_["onUpdate"]("onUpdateData", changed, this); }
}

GddToolDataManager.prototype.uploadHistoryData = function() {
    this.tool.waitForDataTypes(["normal","por","recent"]);
    var url = this.tool.tool_url + '/history';
    var loc = this.tool.location;
    var query = {location:{key:loc.key, address:loc.address, lat:loc.lat, lon:loc.lng}, gdd_threshold:loc.gdd_threshold, season:this.tool.dates.season}
    query = JSON.stringify(query);
    var options = { url:url, type:'post', dataType:'json', crossDomain:true, data:query,
                    error: this.error_callbacks.history, success: this.upload_callbacks.history,
                    beforeSend: function(xhr) { GDDTOOL.addCorsHeader(xhr); }
    }
    jQuery.ajax(options);
}

GddToolDataManager.prototype.uploadSeasonData = function () {
    this.tool.waitForDataType("season");
    var url = this.tool.tool_url + '/season';
    var loc = this.tool.location._state_;
    var query = {location:{key:loc.key, address:loc.address, lat:loc.lat, lon:loc.lng}, gdd_threshold:loc.gdd_threshold, season:this.tool.dates.season}
    query = JSON.stringify(query);
    var options = { url:url, type:'post', dataType:'json', crossDomain:true, data:query,
                    error:this.error_callbacks.season, success:this.upload_callbacks.season,
                    beforeSend: function(xhr) { GDDTOOL.addCorsHeader(xhr); },
    }
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
                if ("onChangeDays" in this._listeners_) { this._listeners_.onChangeDays("onChangeDays", this._days_); }
            }
    });

    Object.defineProperty(this, "fcast_end", {
        configurable:false, enumerable:true,
        get:function() { return this._dates_["fcast_end"]; },
        set:function(new_date) {
            var fcast_end = this.tool.dateToDateObj(new_date);
            if (fcast_end <= this.season_end) { this._dates_["fcast_end"] = fcast_end; } else { this._dates_["fcast_end"] = null; }
        }
    });

    Object.defineProperty(this, "fcast_start", {
        configurable:false, enumerable:true,
        get:function() { return this._dates_["fcast_start"]; },
        set:function(new_date) { var fcast_start = this.tool.dateToDateObj(new_date);
            if (fcast_start <= this.season_end) { this._dates_["fcast_start"] = fcast_start; } else { this._dates_["fcast_start"] = null; }
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
                if (this.season_is_clipped) { this.season_is_clipped = false;
                    if ("onResetTrend" in this._listeners_) { this._listeners_.onResetTrend("onResetTrend", last_obs); }
                }
            } else {
                this._dates_["last_obs"] = season_end;
                if (!(this.season_is_clipped)) { 
                    this.season_is_clipped = true;
                    if ("onClipSeason" in this._listeners_) { this._listeners_.onClipSeason("onClipSeason", last_obs); }
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
                if (prev_date != null && "onChangePlantDate" in this._listeners_) {
                    this._listeners_.onChangePlantDate("onChangePlantDate", prev_date, next_date);
                }
            }
        }
    });

    Object.defineProperty(this, "season", { 
        configurable:false, enumerable:false,
        get:function() { return this._dates_["season"]; },
        set:function(year) {
            prev_year = this._dates_['season'];
            new_year = Number(year);
            if (new_year != prev_year) {
                this._dates_['season'] = new_year;
                if (prev_year != null && "onChangeSeason" in this._listeners_) {
                    this._listeners_.onChangeSeason("onChangeSeason", new_year);
                }
            }
        }
    });

    Object.defineProperty(this, "season_end", { 
        configurable:false, enumerable:false,
        get:function() { return this.tool.dateToDateString(Array.concat([this.season,],this.season_end_day)); }
    });

    Object.defineProperty(this, "season_start", {
        configurable:false, enumerable:false,
        get:function() { return this.tool.dateToDateString(Array.concat([this.season,],this.season_start_day)); }
    });

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

GddToolDates.prototype.indexOf = function(date_type) {
    if (date_type instanceof Date) { return this._days_.indexOf(date_type.getTime());
    } else {
        var the_date = this._dates_[date_type];
        if (the_date == null) { return -1 }
        return this._days_.indexOf(the_date.getTime());
    }
}

GddToolDates.prototype.indexesForDatePair = function(date_pair) { return [this.indexOf(date_pair[0]), this.indexOf(date_pair[1])] }

GddToolDates.prototype.plantDate = function() {
    var plant_date = this.__dates__.plant_date;
    if (plant_date == null) { plant_date = this.tool.dateToDateObj(Array.concat([this.season,],this.default_plant_day)) }
    return plant_date;
}

GddToolDates.prototype.forecastDates = function() { return [this.fcast_start, this.fcast_end]; }
GddToolDates.prototype.forecastIndexes = function() {
    var dates = this.forecastDates();
    if (dates[0] != null) { return this.indexesForDatePair(dates); } else { return [null, null] }
}

GddToolDates.prototype.observationDates = function() {
    var last_obs = this.last_obs;
    if (last_obs != null) { return [this.season_start, last_obs];
    } else { return [null, null] }
}
GddToolDates.prototype.observationIndexes = function() {
    var dates = this.observationDates();
    if (dates[0] != null) { return this.indexesForDatePair(dates); } else { return [null, null] }
}

GddToolDates.prototype.recentTrendDates = function() {
    var plant_date = this.plantDate();
    var end_date = this.last_obs;
    if (end_date != null && plant_date < end_date) { return [plant_date, end_date]; }
    // plant date set to future ... give them eareir of 30 days or season end
    var season_end = this.seasonEndDate();
    end_date = plant_date.getDate() + 30;
    if (end_date < season_end) { return [plant_date, end_date];
    } else { return [plant_date, season_end]; }
}
GddToolDates.prototype.recentTrendDays = function() { return this.sliceDays('trend'); }
GddToolDates.prototype.recentTrendIndexes = function() { return this.indexesForDatePair(this.recentTrendDates()); }

GddToolDates.prototype.seasonEndDate = function(year) {
    var date_array = [ ];
    if (typeof year == 'undefined') { date_array = Array.concat([this.season,],this.season_end_day);
    } else { date_array = Array.concat([year,],this.season_end_day); }
    return this.tool.dateToDateObj(date_array);
}

GddToolDates.prototype.seasonOutlookDates = function() { return [this.plantDate(), this.seasonEndDate()]; }
GddToolDates.prototype.seasonOutlookDays = function() { return this.sliceDays("season"); }
GddToolDates.prototype.seasonOutlookIndexes = function() { return this.indexesForDatePair(this.seasonOutlookDates()); }

GddToolDates.prototype.seasonStartDate = function(year) {
    var date_array = [ ];
    if (typeof year == 'undefined') { date_array = Array.concat([this.season,],this.season_start_day);
    } else { date_array = Array.concat([year,],this.season_start_day); }
    return this.tool.dateToDateObj(date_array);
}

GddToolDates.prototype.sliceDays = function(arg) {
    var indexes;
    if (Array.isArray(arg)) { indexes = arg;
    } else if (arg == 'trend') { indexes = this.recentTrendIndexes();
    } else if  (arg == 'season') { indexes = this.seasonOutlookIndexes();
    } else { indexes = [arg, -1]; }
    var end_index = indexes[1];
    if ( (end_index == undefined) | (end_index == null) ) {
        return this._days_.slice(indexes[0], -1)
    } else { return this._days_.slice(indexes[0], end_index) }
}

GddToolDates.prototype.update = function(date_dict) {
    var changed = [];
    if ("last_obs" in date_dict) { this.last_obs = date_dict["last_obs"]; changed.push("last_obs"); }
    if ("fcast_start" in date_dict) { this.fcast_start = date_dict["fcast_start"]; changed.push("fcast_start");
    } else { this.fcast_start = null; }
    if ("fcast_end" in date_dict) { this.fcast_end = date_dict["fcast_end"]; changed.push("fcast_end"); 
    } else { this.fcast_end = null; }
    if ( (changed.length > 0) && ("onUpdate" in this._listeners_) ) { 
        this._listeners_.onUpdate("onUpdate", changed); }
}

GddToolDates.prototype.uploadDaysInSeason = function() {
    this.tool.waitForDataType("days");
    var url = this.tool.tool_url + '/daysInSeason';
    var query = { season:this.season, season_start:this.season_start, season_end:this.season_end }
    query = JSON.stringify(query);
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
                    if ("onChangeGddThreshold" in this._listeners_) { this._listeners_.onChangeGddThreshold("onChangeGddThreshold", value); }
                }
            }
    });

    Object.defineProperty(GddToolLocation.prototype, "plant_date", { configurable:false, enumerable:true,
        get:function() { return this._state_["plant_date"]; },
        set:function(date_value) {
                var new_date = this.tool.dateToDateObj(date_value);
                var prev_date = this._state_["plant_date"];
                if (new_date != prev_date) {
                    this._state_["plant_date"] = new_date; 
                    if (prev_date != null && "onChangePlantDate" in this._listeners_) { this._listeners_.onChangePlantDate("onChangePlantDate", date_obj); }
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
}

GddToolLocation.prototype.persist = function() {
    loc_json = '{"prototype":"CsfToolLocationState","_state_":{' + JSON.stringify(this._state_) + '}';
    console.log("persisting " + loc_json);
}

GddToolLocation.prototype.persist = function() {
    loc_json = '{"prototype":"GddToolLocation","_state_":{' + JSON.stringify(this._state_) + '}';
    console.log("persisting " + loc_json);
}

GddToolLocation.prototype.update = function(new_loc, fire_event) {
    var changed = false;
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
        var loc_obj = jQuery.extend({}, this._state_);
        var callback = this._listeners_.onUpdate;
        callback("onUpdateLocation", loc_obj);
    }
    console.log("GddToolLocation.update :: COMPLETE");
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// set state globals
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function initializeGddTool() {
    console.log("initializing GDD tool state");
    jQuery.ajaxPrefilter(function(options, original_request, jqXHR) {
        jqXHR.original_request = original_request;
    });

    // get last used location and it's parameters from browser storage
    var gdd_threshold = "{{ gdd_threshold }}";
    var prev_loc = { key:"{{ location_key }}", address:"{{ location_address }}",
                     lat:{{ location_lat }}, lng:{{ location_lon }}, }
    var prev_plant_date = null;
    var prev_season = {{ season }};
    if (prev_season == null) { prev_season = new Date().getFullYear(); }
    if (prev_plant_date == null) { prev_plant_date = GDDTOOL.dateToDateObj([prev_season,1,1]); }

    GDDTOOL.load_wait_widget = new GddToolDataLoadWidget();
    var display_html = '<div id="gddtool-display-chart">' + GDDTOOL.load_wait_widget.html + '</div>';
    jQuery("#csftool-display").html = display_html;

    GDDTOOL.dates = new GddToolDates(GDDTOOL);
    GDDTOOL.dates.plant_date = prev_plant_date;
    GDDTOOL.dates.season = prev_season;

    GDDTOOL.dates.error_callback = function(jq_xhr, status_text, error_thrown) {
        console.log('BUMMER : request for Dates : Error Thrown : ' + error_thrown);
        console.log('  request : ' + jq_xhr.original_request.uri);
        console.log('  status : ' + status_text);
        console.log('  jqXHR : ' + jq_xhr.readyState, + ' : ' + jq_xhr.status + ' : ' + jq_xhr.statusText);
        console.log('  response text : ' + jq_xhr.responseText);
        console.log('  response xml : ' + jq_xhr.responseXML);
        console.log('  headers : ' + jq_xhr.getAllResponseHeaders());
    }
    GDDTOOL.dates.upload_callback = function(data_dict, status_text, jq_xhr) { GDDTOOL.dates.days = data_dict.days; }

    GDDTOOL.location = new GddToolLocation(GDDTOOL);
    GDDTOOL.location.init(prev_loc, gdd_threshold, prev_plant_date);

    GDDTOOL.data = new GddToolDataManager(GDDTOOL);
    GDDTOOL.data.error_callbacks.history = function(jq_xhr, status_text, error_thrown) {
        console.log('BUMMER : request for History : Error Thrown : ' + error_thrown);
        jQuery.each(jq_xhr.original_request, function(key, value) { console.log("    " + key + " : " + value); });
        console.log('  request : ' + jq_xhr.original_request.uri);
        console.log('  status : ' + status_text);
        console.log('  jqXHR : ' + jq_xhr.readyState, + ' : ' + jq_xhr.status + ' : ' + jq_xhr.statusText);
        console.log('  response text : ' + jq_xhr.responseText);
        console.log('  response xml : ' + jq_xhr.responseXML);
        console.log('  headers : ' + jq_xhr.getAllResponseHeaders());
    }
    GDDTOOL.data.error_callbacks.season = function(jq_xhr, status_text, error_thrown) {
        console.log('BUMMER : requset for Season : Error Thrown : ' + error_thrown);
        console.log('  request : ' + jq_xhr.original_request.uri);
        console.log('  status : ' + status_text);
        console.log('  jqXHR : ' + jq_xhr.readyState, + ' : ' + jq_xhr.status + ' : ' + jq_xhr.statusText);
        console.log('  response text : ' + jq_xhr.responseText);
        console.log('  response xml : ' + jq_xhr.responseXML);
        console.log('  headers : ' + jq_xhr.getAllResponseHeaders());
    }
    GDDTOOL.data.upload_callbacks.history = function(data_dict, status_text, jq_xhr) { GDDTOOL.data.update(data_dict.history.data); }
    GDDTOOL.data.upload_callbacks.season = function(data_dict, status_text, jq_xhr) {
        GDDTOOL.logObjectAttrs(data_dict.season.dates);
        GDDTOOL.dates.update(data_dict.season.dates);
        GDDTOOL.location.update(data_dict.season.location);
        GDDTOOL.data.update(data_dict.season.data);
    }

    console.log("GDDTOOL FULLY INITIALIZED :: GDD threshold = " + GDDTOOL.location.gdd_threshold);
    // get data for location in initial request
    GDDTOOL.uploadAllData();
}
initializeGddTool();

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// install the maxZIndex function
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
jQuery.maxZIndex = jQuery.fn.maxZIndex = function(opt) {
    /// <summary>
    /// Returns the max zOrder in the document (no parameter)
    /// Sets max zOrder by passing a non-zero number
    /// which gets added to the highest zOrder.
    /// </summary>    
    /// <param name="opt" type="object">
    /// inc: increment value, 
    /// group: selector for zIndex elements to find max for
    /// </param>
    /// <returns type="jQuery" />
    var def = { inc: 10, group: "*" };
    jQuery.extend(def, opt);    
    var zmax = 0;
    jQuery(def.group).each(function() {
        var cur = parseInt(jQuery(this).css("z-index"));
        zmax = cur > zmax ? cur : zmax;
    });
    if (!this.jquery)
        return zmax;

    return this.each(function() {
        zmax += def.inc;
        jQuery(this).css("z-index", zmax);
    });

}
