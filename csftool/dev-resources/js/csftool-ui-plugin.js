
;(function(jQuery) {

var dateValueToDateObject = function(date_value) {
     if (date_value instanceof Date) { return date_value;
     } else { return new Date(date_value+'T12:00:00-04:30'); }
}

var logObjectAttrs = function(obj) {
    jQuery.each(obj, function(key, value) { console.log("    ATTRIBUTE " + key + " = " + value); });
}

var mergeArrays = function(i,x){h={};n=[];for(a=2;a--;i=x)i.map(function(b){h[b]=h[b]||n.push(b)});return n}

var sourceChangeRequest = function() {
    var ui = DataSourceInterface;
    ui.selectSource(document.querySelector(ui.selector_query).value);
}

var ChartTypeInterface = {
    callback: null,
    chart_types: { "trend":"Recent Trend", "season":"Season Outlook" },
    default_chart: "trend",

    chartType: function() { return jQuery("#csftool-chart-toggle").val(); },

    execCallback: function(chart_type) {
        if (this.callback) { this.callback("chartChangeRequest", chart_type); }
    },

    init: function() {
        var init_chart = this.default_chart;
        var next_chart;
        if (init_chart == "trend" ) { next_chart = "season"; } else { next_chart = "trend"; }
        jQuery("#csftool-chart-toggle").addClass(init_chart);
        jQuery("#csftool-chart-toggle").button({ label: this.chart_types[next_chart] });
        jQuery("#csftool-chart-toggle").click( function() { ChartTypeInterface.toggleChart(); } );
    },

    setCallback: function (callback) { this.callback = callback; },

    setChartType: function(chart_type) {
        if (chart_type == "trend") {
            if (jQuery("#csftool-chart-toggle").hasClass("season")) { 
                jQuery("#csftool-chart-toggle").removeClass("season");
            }
            jQuery("#csftool-chart-toggle").addClass("trend");
            jQuery("#csftool-chart-toggle").button({ label: this.chart_types["season"] });
            this.execCallback("trend");
        } else if (chart_type == "season") {
            if (jQuery("#csftool-chart-toggle").hasClass("trend")) { 
                jQuery("#csftool-chart-toggle").removeClass("trend");
            }
            jQuery("#csftool-chart-toggle").addClass("season");
            jQuery("#csftool-chart-toggle").button({ label: this.chart_types["trend"] });
            this.execCallback("season");
        }
    },

    setChartTypes: function(chart_types) { this.chart_types = jQuery.extend(this.chart_types, chart_types); },

    setDefault: function(chart_type) { this.default_chart = chart_type; },

    toggleChart: function() {
        if (jQuery("#csftool-chart-toggle").hasClass("trend")) {
            jQuery("#csftool-chart-toggle").removeClass("trend");
            jQuery("#csftool-chart-toggle").addClass("season");
            jQuery("#csftool-chart-toggle").button({ label: this.chart_types["trend"] });
            this.execCallback("season");
        } else if (jQuery("#csftool-chart-toggle").hasClass("season")) {
            jQuery("#csftool-chart-toggle").removeClass("season");
            jQuery("#csftool-chart-toggle").addClass("trend");
            jQuery("#csftool-chart-toggle").button({ label: this.chart_types["season"] });
            this.execCallback("trend");
        }
    },
}

var DataSourceInterface = {
    anchor: null,
    button_dom: '<input type="radio" name="select-crop-variety" class="{{key}}" value="{{key}}"></input>&nbsp;{{source}}<br/>',
    callback: null,
    default: null,
    selected: null,
    selector_query: 'input[name="select-data-source"]:checked',
    source_form_label: "Data Source",
    source_description_dom: '<span id="csftool_data-source-label" class="csftool-em">{{label}}</span><br/>',
    source_keys: [ ],
    source_selector: 'input[name="select-data-source"] [value="{{key}}"]',
    sources: { },

    execCallback: function(source_obj) { if (this.callback) { this.callback("sourceChanged", source_obj); } },

    init: function(anchor) {
        if (typeof anchor !== 'undefined') { this.anchor = anchor; }
        if (this.default == null) { this.setDefaultSource(this.source_keys[0]) };
        jQuery(this.anchor).append(this.source_description_dom.replace("{{label}}", this.source_form_label));

        var ui = this;
        jQuery.each(this.source_keys, function (i, key) {
            var source = ui.sources[key];
            var button = ui.button_dom.replace('{{key}}',key).replace('{{key}}',key).replace('{{source}}',source);
            jQuery(ui.anchor).append(button);
            jQuery(ui.source_selector.replace('{{key}}', key)).click(sourceChangeRequest);
            if (key == ui.selected) { jQuery("."+key).prop("checked", true) }
        });
    },

    mergeSources: function(sources) {
        jQuery.each(sources, function (i, source) {
            var key = source.key;
            DataSourceInterface.sources[key] = source.description;
            if (DataSourceInterface.source_keys.indexOf(key) < 0) { DataSourceInterface.source_keys.push(key); }
        });
    },

    setCallback: function (callback) { this.callback = callback; },
    selectedSource: function() { return { key: this.selected, description: this.sources[key] } },

    selectSource: function(source_key) {
        var selected = this.selected;
        if (source_key != selected) {
            jQuery("."+selected).prop("checked", false);
            this.selected = source_key;
            jQuery("."+source_key).prop("checked", true);
            this.execCallback({ key: source_key, description: this.sources[source_key], });
        }
    },

    setDefaultSource: function(source_key) {
        this.default = source_key; 
        if (this.selected == null) { this.selected = this.default; }
    }

}

var DateInterface = {
    anchor: "#csftool-chart-start-datepicker",
    button_label: "Select date",
    callback: null,
    datepicker: '#ui-datepicker-div',
    date_format: "yy-mm-dd",
    initialized: false
    max_date: null,
    min_date: null,
    start_date: null,

    execCallback: function(new_date) { if (this.callback) { var result = this.callback("startDateChanged", new_date); } },
    getDate: function() { return jQuery(this.anchor).datepicker("getDate"); },

    init: function(start_date) {
        var options = {
            autoclose: true,
            beforeShow: function() {
                jQuery(DateInterface.datepicker).hide();
                jQuery("#csftool-chart-date-selector").append(jQuery(DateInterface.datepicker));
            },
			buttonImage: InterfaceManager.resource_url + "/icons/calendar-24x24.png",
			buttonImageOnly: true,
			buttonText: this.button_label,
            dateFormat: this.date_format,
            onSelect: function(date_text, inst) {
                DateInterface.start_date = dateValueToDateObject(date_text);
                DateInterface.execCallback(date_text);
                jQuery(DateInterface.datepicker).hide();
            },
            showAnim: "clip",
            showButtonPanel: false,
			showOn: "button",
            showOtherMonths: true,
		}
        if (this.max_date != null) { options['maxDate'] = this.max_date; }
        if (this.min_date != null) { options['minDate'] = this.min_date; }

        jQuery(this.anchor).datepicker(options);
        this.initialized = true;
        jQuery(this.datepicker).hide();

        if (typeof start_date !== 'undefined') { this.setStartDate(start_date);
        } else if (this.start_date != null) { this.setStartDate(this.start_date); }
        } else { this.setStartDate(new Date().toISOString().split('T')[0]) }
    },

    setCallback: function (callback) { this.callback = callback; },
    setDateRange: function(min_date, max_date) {
        this.min_date = dateValueToDateObject(min_date);
        this.max_date = dateValueToDateObject(max_date);
    },
    setStartDate: function(new_date) {
        this.start_date = dateValueToDateObject(new_date);
        if (this.initialized) { jQuery(this.anchor).datepicker("setDate",this.start_date); }
    },
}

var LocationInterface = {
    callbacks: { },
    container: null,
    current: null,
    default: { address:"Cornell University, Ithaca, NY", lat:42.45, lng:-76.48, key:"default" },
    dialog: null,

    execCallback: function(ev, loc_arg) {
        var callback = this.callbacks[ev];
        if (typeof callback !== 'undefined') {
            var loc_obj = loc_arg;
            if (typeof loc_arg === 'undefined') { loc_obj = jQuery.extend({}, this.current); }
            callback(ev, loc_obj);
            return true;
        } else { return false; }
    },

    init: function() {
        if (this.current) { this.setLocation(this.current);
        } else { this.setLocation(this.default); }
        jQuery("#csftool-change-location").button( { label: "Change Location", } );
        jQuery("#csftool-change-location").click(function() { LocationInterface.execCallback("locationChangeRequest"); });
    },

    locationsAreDifferent: function(loc_obj_1, loc_obj_2) {
        return ( (loc_obj_1.address != loc_obj_2.address) ||
                 (loc_obj_1.lat != loc_obj_2.lat) ||
                 (loc_obj_1.lng != loc_obj_2.lng) );
    },

    setCallback: function (key, callback) { this.callbacks[key] = callback; },
    setDefault: function(loc_obj) { this.default = jQuery.extend({}, loc_obj); },

    setLocation: function(loc_obj) {
        logObjectAttrs(loc_obj);

        var span = '<span class="csftool-location-address">{{address}}</span>'
        var changed = false;

        if (this.current == null || this.locationsAreDifferent(loc_obj,this.current)) {  
            var address = null;
            var index = loc_obj.address.indexOf(", USA");
            if (index > 0) { address = loc_obj.address.replace(", USA","");
            } else { address = loc_obj.address; }
            var parts = address.split(", ");
            if (parts.length > 1) {
            address = span.replace("{{address}}", parts[0]) + '</br>' + 
                      span.replace("{{address}}", parts.slice(1).join(", "));
            } else { address = span.replace("{{address}}", address); }

            jQuery("#csftool-current-address").empty().append(address);
            jQuery("#csftool-current-lat").empty().append(loc_obj.lat.toFixed(7));
            jQuery("#csftool-current-lng").empty().append(loc_obj.lng.toFixed(7));

            if (this.current != null) { this.execCallback("locationChanged", jQuery.extend({}, loc_obj)); }
            this.current = jQuery.extend({}, loc_obj);

        } else if (loc_obj.key != this.current.key) {
            // location key was changed but not location data
            this.current = jQuery.extend({}, loc_obj);
        }
    },
}

var InterfaceManager = {
    dom: ['<div id="csftool-location-interface">',
          '<span class="csftool-em">Current Location :</span>',
          '<div id="csftool-current-address"><span class="csftool-location-address"> </span></div>',
          '<span class="csftool-em">Latitude : </span><span id="csftool-current-lat"> </span>',
          '<br/><span class="csftool-em">Longitude : </span><span id="csftool-current-lng"> </span>',
          '<button id="csftool-change-location"></button>',
          '</div>',
          '<div id="csftool-chart-start-date">',
          '<span class="csftool-em">Plot Start Date:</span>',
          '<div id="csftool-chart-date-selector">',
          '<input type="text" id="csftool-chart-start-datepicker">',
          '</div>',
          '</div>',
          '<div id="csftool-data-sources">',
          '<form id="csftool-data-sources-form">',
          '</form>',
          '</div>',
          '<div id="csftool-chart-button">',
          '<p id="csftool-no-toggle-text">Growing season is over.</p>',
          '<div id="csftool-toggle-display">',
          '<button id="csftool-chart-toggle"></button>',
          '</div>',
          '</div>',
          '<div id="csftool-location-dialog"> </div>'].join(''),
    data_sources_form: "#csftool-data-sources-form",
    resource_url: null,
    start_date: undefined,

    init: function(dom_element) {
        //document.getElementById('csftool-input').innerHTML = this.dom;
        dom_element.innerHTML = this.dom;
        LocationInterface.init();
        DateInterface.init(this.start_date);
        DataSourceInterface.init(this.data_sources_form);
        ChartTypeInterface.init();
    },

    setCallback: function(request_type, callback) {
        switch(request_type) {
            case "chartChangeRequest": ChartTypeInterface.setCallback(callback); break;
            case "dataSourceChanged": DataSourceInterface.setCallback(callback); break;
            case "locationChanged": LocationInterface.setCallback("locationChanged", callback); break;
            case "locationChangeRequest": LocationInterface.setCallback("locationChangeRequest", callback); break;
            case "startDateChanged": DateInterface.setCallback(callback); break;
        }
    },

    setStartDate: function(start_date) { this.start_date = dateValueToDateObject(start_date); },
    setResourceURL: function(url) { this.resource_url = url; },
}

var jQueryInterfaceProxy = function() {

    if (arguments.length == 1) {
        switch(arg) {
            case "chart": // return currently selected chart
                return ChartTypeInterface.chartType();
                break;

            case "data_sources":
            case "sources":
                return jQuery.extend({}, DataSourceInterface.sources);
                break;

            case "data_source": // return current data source
            case "source": // return current data source
                return DataSourceInterface.selectedSource();
                break;

            case "date_range": // return min and max dates for datepicker
                return { min_date: DateInterface.min_date, max_date: DateInterface.max_date }
                break;

            case "location": // return current location
                return jQuery.extend({}, LocationInterface.current);
                break;

            case "resource_url":
                return InterfaceManager.resource_url;
                break;

            case "start_date": // return chart start date
                return DateInterface.startDate();
                break;

        } // end of single argument switch

    } else if (arguments.length == 2) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        switch(arg_0) {

            case "bind":
                jQuery.each(arg_1, function(i) {
                    var bind = arg_1[i];
                    for (var key in bind) { InterfaceManager.setCallback(key, bind[key]); }
                });
                break;

            case "chart": ChartTypeInterface.setChartType(arg_1) break;
            case "chart_types": ChartTypeInterface.setChartTypes(arg_1); break;
            case "resource_url": InterfaceManager.setResourceURL(arg_1); break;
            case "data_sources": DataSourceInterface.mergeSources(arg_1); break;
            case "date_range": DateInterface.setDateRange(arg_1) break;
            case "location": LocationInterface.setLocation(arg_1); break;
            case "start_date": DateInterface.setStartDate(arg_1); break;
            case "sources": DataSourceInterface.mergeSources(arg_1); break;
            case "source_form_label": DataSourceInterface.source_form_label = arg_1; break;

        } // end of 2 argument switch

    } else if (arguments.length == 3) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        var arg_2 = arguments[2];
        switch(arg_0) {

            case "bind": InterfaceManager.setCallback(arg_1, arg_2); break;
            case "date_range": DateInterface.setDateRange([arg_1, arg_2]); break;
            case "default":
                if (arg_1 == "chart") { ChartTypeInterface.setDefault(arg_2);
                } else if (arg_1 == "location") { LocationInterface.setDefault(arg_2);
                } else if (arg_1 == "source") { DataSourceInterface.setDefaultSource(arg_2); }
                break;
        } // end of 3 argument switch
    }
    return undefined;
}

jQuery.fn.CsfToolUserInterfacePlugin = function(options) {
    var dom_element = this.get(0);
    if (options) {
        jQuery.each(options, function (i) {
            var option = options[i];
            if (jQuery.isArray(option)) {
                if (option.length == 2) { jQueryInterfaceProxy(option[0], option[1]);
                } else if (option.length == 3) { jQueryInterfaceProxy(option[0], option[1], option[2]); }
            } else { for (var key in option) { jQueryInterfaceProxy(key, option[key]); } }
        });
    }
    InterfaceManager.init(dom_element);
    return jQueryInterfaceProxy;
}

})(jQuery);

