
;(function(jQuery) {

var dateValueToDateObject = function(date_value) {
     if (date_value instanceof Date) { return date_value;
     } else { return new Date(date_value+'T12:00:00-04:30'); }
}

var logObjectAttrs = function(obj) {
    jQuery.each(obj, function(key, value) { console.log("    ATTRIBUTE " + key + " = " + value); });
}

var mergeArrays = function(i,x){h={};n=[];for(a=2;a--;i=x)i.map(function(b){h[b]=h[b]||n.push(b)});return n}

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

    setCallback: function (callback) {
        console.log("SET CALLBACK :: ChartTypeInterface : " + callback);
        this.callback = callback;
    },

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
        console.log("user interface toggle chart type");
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

var DateInterface = {
    anchor: "#csftool-chart-start-datepicker",
    callback: null,
    datepicker: '#ui-datepicker-div',

    execCallback: function(new_date) { if (this.callback) { var result = this.callback("startDateChanged", new_date); } },
    getDate: function() { return jQuery(this.anchor).datepicker("getDate"); },

    init: function(start_date) {
        console.log("DATEPICKER.init :: creating a datepicker instance");
        jQuery(this.anchor).datepicker({
            //appendTo: "caftool-date-selector",
            autoclose: true,
            beforeShow: function() {
                console.log("DATEPICKER.beforeShow :: datepicker.hide() ???");
                jQuery(DateInterface.datepicker).hide();
                console.log('DATEPICKER.beforeShow :: "#csftool-chart-date-selector" append(datepicker)');
                jQuery("#csftool-chart-date-selector").append(jQuery(DateInterface.datepicker));
                console.log("DATEPICKER.beforeShow :: DONE");
            },
			buttonImage: InterfaceManager.csftool_url + "/icons/calendar-24x24.png",
			buttonImageOnly: true,
			buttonText: "Select date",
            dateFormat: "yy-mm-dd",
            onSelect: function(date_text, inst) {
                console.log("datepicker is changing date to " + date_text);
                DateInterface.execCallback(date_text);
                jQuery(DateInterface.datepicker).hide();
            },
            showAnim: "clip",
            showButtonPanel: false,
			showOn: "button",
            showOtherMonths: true,
		});
        console.log("DATEPICKER.init :: hiding the datepicker instance");
        jQuery(this.datepicker).hide();
        if (typeof start_date !== 'undefined') {
            jQuery(this.anchor).datepicker("setDate", dateValueToDateObject(start_date));
        }
    },

    setCallback: function (callback) { this.callback = callback; },
    setDate: function(new_date) { jQuery(this.anchor).datepicker("setDate", dateValueToDateObject(new_date)); },
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
            console.log('EXEC CALLBACK :: LocationInterface.' + ev);
                logObjectAttrs(loc_obj);
            callback(ev, loc_obj);
            return true;
        } else { return false; }
    },

    init: function() {
        if (this.current) { this.setLocation(this.current);
        } else { this.setLocation(this.default); }
        jQuery("#csftool-change-location").button( { label: "Change Location", } );
        jQuery("#csftool-change-location").click(function() {
               console.log("EVENT :: Change Location button was clicked");
               LocationInterface.execCallback("locationChangeRequest");
        });
    },

    locationsAreDifferent: function(loc_obj_1, loc_obj_2) {
        return ( (loc_obj_1.address != loc_obj_2.address) ||
                 (loc_obj_1.lat != loc_obj_2.lat) ||
                 (loc_obj_1.lng != loc_obj_2.lng) );
    },

    setCallback: function (key, callback) {
        console.log("SET CALLBACK :: LocationInterface." + key + " : " + callback);
        this.callbacks[key] = callback;
    },

    setDefault: function(loc_obj) { this.default = jQuery.extend({}, loc_obj); },

    setLocation: function(loc_obj) {
        console.log("LOCATION INTERFACE :: set location : " + loc_obj.address);
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

            if (this.current != null) {
                console.log("EVENT :: LOCATION INTERFACE : location changed to " + loc_obj.address);
                this.execCallback("locationChanged", jQuery.extend({}, loc_obj));
            }
            this.current = jQuery.extend({}, loc_obj);

        } else if (loc_obj.key != this.current.key) {
            // location key was changed but not location data
            this.current = jQuery.extend({}, loc_obj);
        }
    },
}

var varietyChangeRequest = function() {
    var variety_key = document.querySelector('input[name="select-crop-variety"]:checked').value;
    VarietyInterface.selectVariety(variety_key);
}

var VarietyInterface = {
    anchor: null,
    callback: null,
    default: { key: "empire", variety: "Empire", },
    input_dom: '<input type="radio" name="select-crop-variety" class="{{key}}" value="{{key}}"></input>&nbsp;{{variety}}<br/>',
    selected: null,
    selector: 'input[name="select-crop-variety"] [value="{{key}}"]',
    var_keys: [ ],
    varieties: { },

    execCallback: function(variety) { if (this.callback) { this.callback("varietyChanged", variety); } },

    init: function(anchor) {
        if (typeof anchor !== 'undefined') { this.anchor = anchor; }

        var ui = this;
        jQuery.each(this.var_keys, function (i, key) {
            var anchor = VarietyInterface.anchor;
            var variety = ui.varieties[key];
            var element = ui.input_dom.replace('{{key}}',key).replace('{{key}}',key).replace('{{variety}}',variety);
            console.log("    adding UI input element to " + anchor + " :: ");
            console.log("    " + element);
            jQuery(anchor).append(element);
            var target = ui.selector.replace('{{key}}', key);
            console.log("    ui.selector :: " + target);
            if (i == 0) {
                jQuery(target).prop("checked", true).click(varietyChangeRequest);
                ui.selected = jQuery.extend({}, variety);
            } else { jQuery(target).click(varietyChangeRequest); }
        });
    },

    mergeVarieties: function(varieties) {
        console.log("VarietyInterface :: merge " + varieties.length + " varieties");
        jQuery.each(varieties, function (i, variety) {
            var key = variety.key;
            console.log("    merging : " + key + " (" + variety.variety + ")");
            VarietyInterface.varieties[key] = variety.variety;
            if (VarietyInterface.var_keys.indexOf(key) < 0) { VarietyInterface.var_keys.push(key); }
        });
        console.log("   all varieities : " + VarietyInterface.var_keys)
    },

    setCallback: function (callback) { this.callback = callback; },

    selectVariety: function(variety_key) {
        var selected = this.selected.key;
        if (variety_key != selected) {
            console.log("changing variety from " + selected + " to " + variety_key);
            var target = this.selector.replace('{{key}}', selected);
            jQuery(target).prop("checked", false);
            target = this.selector.replace('{{key}}', variety_key);
            jQuery(target).prop("checked", true);
            this.selected = { key: variety_key, variety: this.varieties[variety_key], };
            this.execCallback({ key: variety_key, variety: this.varieties[variety_key], });
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
          '<div id="csftool-crop-varieties">',
          '<form id="csftool-variety-form"><span class="csftool-em">Variety</span><br/>',
          '</form>',
          '</div>',
          '<div id="csftool-chart-button">',
          '<p id="csftool-no-toggle-text">Growing season is over.</p>',
          '<div id="csftool-toggle-display">',
          '<button id="csftool-chart-toggle"></button>',
          '</div>',
          '</div>',
          '<div id="csftool-location-dialog"> </div>'].join(''),
    csftool_url: null,
    frapple_url: null,
    start_date: undefined,

    init: function(dom_element) {
        //document.getElementById('csftool-input').innerHTML = this.dom;
        dom_element.innerHTML = this.dom;
        LocationInterface.init();
        DateInterface.init(this.start_date);
        VarietyInterface.init("#csftool-variety-form");
        ChartTypeInterface.init();
    },

    setCallback: function(request_type, callback) {
        switch(request_type) {
            case "chartChangeRequest":
                ChartTypeInterface.setCallback(callback);
                break;

            case "varietyChanged":
                VarietyInterface.setCallback(callback);
                break;

            case "locationChanged":
                LocationInterface.setCallback("locationChanged", callback);
                break;

            case "locationChangeRequest":
                LocationInterface.setCallback("locationChangeRequest", callback);
                break;

            case "startDateChanged":
                DateInterface.setCallback(callback);
                break;
        }
    },

    setStartDate: function(start_date) {
        this.start_date = dateValueToDateObject(start_date);
    },

    setURL: function(tool, url) {
        if (tool == "csftool") { this.csftool_url = url;
        } else if (tool == "thistool") { this.tool_url = url; }
    },
}

var jQueryInterfaceProxy = function() {

    if (arguments.length == 1) {
        switch(arg) {
            case "chart": // return currently selected chart
                return ChartTypeInterface.chartType();
                break;

            case "variety": // return current variety
                return jQuery.extend({}, VarietyInterface.selected);
                break;

            case "location": // return current location
                return jQuery.extend({}, LocationInterface.current);
                break;

            case "start_date": // return chart start date
                return DateInterface.startDate();
                break;

            case "varieties":
                return jQuery.extend({}, VarietyInterface.varieties);
                break;

        } // end of single argument switch

    } else if (arguments.length == 2) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        console.log("jQueryInterfaceProxy :: " + arg_0 + " : " + arg_1);
        switch(arg_0) {

            case "bind":
                jQuery.each(arg_1, function(i) {
                    var bind = arg_1[i];
                    for (var key in bind) { InterfaceManager.setCallback(key, bind[key]); }
                });
                break;

            case "chart":
                ChartTypeInterface.setChartType(arg_1)
                break;

            case "chart_types":
                ChartTypeInterface.setChartTypes(arg_1);
                break;

            case "csftool":
            case "thistool":
                InterfaceManager.setURL(arg_0, arg_1);
                break;

            case "location":
                LocationInterface.setLocation(arg_1);
                break;

            case "start_date":
                DateManager.setStartDate(arg_1);
                break;

            case "varieties":
                VarietyInterface.mergeVarieties(arg_1);
                break;

        } // end of 2 argument switch

    } else if (arguments.length == 3) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        var arg_2 = arguments[2];
        switch(arg_0) {

            case "bind":
                console.log("BIND :: CsfToolVarietyUserInterface." + arg_1);
                InterfaceManager.setCallback(arg_1, arg_2);
                break;

            case "default":
                if (arg_1 == "chart") {
                    ChartTypeInterface.setDefault(arg_2);
                } else if (arg_1 == "location") {
                    LocationInterface.setDefault(arg_2);
                } break;
        } // end of 3 argument switch
    }
    return undefined;
}

jQuery.fn.CsfToolVarietyUserInterface = function(options) {
    var dom_element = this.get(0);
    console.log("CsfToolVarietyUserInterface :: options : " + options);
    if (options) {
        jQuery.each(options, function (i) {
            var option = options[i];
            for (var key in option) { jQueryInterfaceProxy(key, option[key]); }
        });
    }
    InterfaceManager.init(dom_element);
    console.log("EVENT :: CsfToolUserInterface plugin ready");
    return jQueryInterfaceProxy;
}

})(jQuery);

