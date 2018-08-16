
;(function(jQuery) {

var adjustTimeZone = function(date_value) {
    return new Date(date_value.toISOString().split('T')[0]+'T12:00:00-04:30');
}

var dateToDateObject = function(date_value) {
    if (date_value instanceof Date) { return adjustTimeZone(date_value);
    } else if (Array.isArray(date_value)) { return adjustTimeZone(new Date(date_value[0], date_value[1]-1, date_value[2]));
    } else { return new Date(date_value+'T12:00:00-04:30'); }
}

var logObjectAttrs = function(obj) {
    jQuery.each(obj, function(key, value) { console.log("    ATTRIBUTE " + key + " = " + value); });
}

var ChartTypeInterface = {
    active: true,
    callback: null,
    chart_types: { "trend":"Recent Trend", "outlook":"Season Outlook" },
    default_chart: "trend",

    chartType: function(chart_type) {
        if (this.active) { return jQuery("#gddtool-toggle-button").val();
        } else { return "season"; }
    },

    execCallback: function(chart_type) {
        if (this.callback) { this.callback("chartChangeRequest", chart_type); }
    },

    hideChartSelector: function() {
        jQuery("#gddtool-toggle-display").hide();
        jQuery("#gddtool-no-toggle-text").show();
    },

    init: function() {
        var init_chart = this.default_chart;
        var next_chart;
        if (init_chart == "trend" ) { next_chart = "outlook"; } else { next_chart = "trend"; }
        jQuery("#gddtool-toggle-button").addClass(init_chart);
        jQuery("#gddtool-toggle-button").button({ label: this.chart_types[next_chart] });
        jQuery("#gddtool-toggle-button").click( function() { ChartTypeInterface.toggleChart(); } );
    },

    setCallback: function (callback) { this.callback = callback; },

    setChartType: function(chart_type) {
        if (chart_type == "trend") {
            if (jQuery("#gddtool-toggle-button").hasClass("outlook")) { 
                jQuery("#gddtool-toggle-button").removeClass("outlook");
            }
            jQuery("#gddtool-toggle-button").addClass("trend");
            jQuery("#gddtool-toggle-button").button({ label: this.chart_types["outlook"] });
            this.execCallback("trend");
        } else if (chart_type == "outlook") {
            if (jQuery("#gddtool-toggle-button").hasClass("trend")) { 
                jQuery("#gddtool-toggle-button").removeClass("trend");
            }
            jQuery("#gddtool-toggle-button").addClass("outlook");
            jQuery("#gddtool-toggle-button").button({ label: this.chart_types["trend"] });
            this.execCallback("outlook");
        }
    },

    setChartTypes: function(chart_types) { this.chart_types = jQuery.extend(this.chart_types, chart_types); },

    setDefault: function(chart_type) { this.default_chart = chart_type; },

    showChartSelector: function() {
        jQuery("#gddtool-toggle-display").show();
        jQuery("#gddtool-no-toggle-text").hide();
    },

    toggleChart: function() {
        if (jQuery("#gddtool-toggle-button").hasClass("trend")) {
            jQuery("#gddtool-toggle-button").removeClass("trend");
            jQuery("#gddtool-toggle-button").addClass("outlook");
            jQuery("#gddtool-toggle-button").button({ label: this.chart_types["trend"] });
            this.execCallback("outlook");
        } else if (jQuery("#gddtool-toggle-button").hasClass("outlook")) {
            jQuery("#gddtool-toggle-button").removeClass("outlook");
            jQuery("#gddtool-toggle-button").addClass("trend");
            jQuery("#gddtool-toggle-button").button({ label: this.chart_types["outlook"] });
            this.execCallback("trend");
        }
    },
}

var DateInterface = {
    anchor: "#gddtool-datepicker",
    callbacks: { },
    datepicker: '#ui-datepicker-div',
    date_format: "yy-mm-dd",
    initialized: false,
    max_date: null,
    min_date: null,
    show_months: true,
    show_years: false,
    start_date: null,
    year_range: null,

    execCallback: function(ev, data) {
        var callback = this.callbacks[ev]
        if (!(typeof callback === 'undefined')) { var result = callback(ev, data); }
    },
    getDate: function() { return jQuery(this.anchor).datepicker("getDate"); },

    init: function(initial_date) {
        var options = {
            //appendTo: "caftool-date-selector",
            autoclose: true,
            beforeShow: function() {
                jQuery(DateInterface.datepicker).hide();
                jQuery("#gddtool-date-selector").append(jQuery(DateInterface.datepicker));
                //jQuery('#ui-datepicker-div').maxZIndex();
            },
			buttonImage: InterfaceManager.csftool_url + "/icons/calendar-24x24.png",
			buttonImageOnly: true,
			buttonText: this.button_label,
            changeMonth: this.month_menu,
            changeYear: this.year_menu,
            dateFormat: this.date_format,
			gotoCurrent: true,
            onChangeMonthYear: function(year, month, datepicker) {
                console.log("datepicker.onChangeMonthYear : " + DateInterface.start_date.getFullYear() + " : " + year);
            },
            onSelect: function(date_text, datepicker) {
                DateInterface.start_date = dateToDateObject(date_text);
                DateInterface.execCallback('plantDateChanged', date_text);
                jQuery("#ui-datepicker-div").hide();
            },
            showAnim: "clip",
            showButtonPanel: false,
			showOn: "button",
            showOtherMonths: true,
		}
        if (this.max_date != null && this.min_date != null) { 
            options['maxDate'] = this.max_date;
            options['minDate'] = this.min_date;
        }
        if (this.year_range != null) { 
            options.changeYear = true;
            options['yearRange'] = this.year_range;
        }

        jQuery(this.anchor).datepicker(options);
        this.initialized = true;
        jQuery(this.datepicker).hide();
        jQuery("#gddtool-datepicker").change(function () { DateInterface.execCallback("plantDateChanged", this.value); });
        jQuery("#ui-datepicker-div .ui-datepicker-header .ui-datepicker-title .ui-datepicker-year").change(
               function () { console.log("#ui-datepicker-year.change :: " + this.value);
                             //DateInterface.execCallback("yearChanged", this.value);
        });
    
        if (typeof initial_date !== 'undefined') { this.setStartDate(initial_date);
        } else if (this.start_date != null) { this.setStartDate(this.start_date);
        } else { this.setStartDate(new Date().toISOString().split('T')[0]) }
    },

    setCallback: function (ev, callback) { this.callbacks[ev] = callback; },

    setDateRange: function(min_date, max_date) {
        this.min_date = dateToDateObject(min_date);
        this.max_date = dateToDateObject(max_date);
    },

    setStartDate: function(new_date) {
        this.start_date = dateToDateObject(new_date);
        this.current_year = this.start_date.getFullYear();
        if (this.initialized) { jQuery(this.anchor).datepicker("setDate", this.start_date); }
    },

    setYearRange: function(min_year, max_year) {
        this.min_year = min_year;
        this.max_year = max_year;
        this.year_range = min_year.toString() + ":" + max_year.toString();
    },
}

var gddThresholdChangeRequest = function() {
    var gdd_threshold = document.querySelector('input[name="gdd-select-threshold"]:checked').value;
    GddThresholdInterface.setThreshold(gdd_threshold);
}

var GddThresholdInterface = {
    callback: null,
    current: null,
    default: "50",

    execCallback: function(gdd_threshold) {
        if (this.callback) {
            this.callback("gddThresholdChanged", gdd_threshold); }
    },

    init: function() {
        jQuery.each(document.getElementsByName("gdd-select-threshold"),
               function () { this.addEventListener("click", gddThresholdChangeRequest); }
               );
        var target = 'input[name="gdd-select-threshold"] [value="' + this.default + '"]'
        this.current = this.default;
        jQuery(target).prop("checked", true);
    },

    setCallback: function (callback) { this.callback = callback; },

    setThreshold: function(gdd_threshold) {
        if (gdd_threshold != this.current) {
            var target = 'input[name="gdd-select-threshold"] [value="' + this.current + '"]'
            jQuery(target).prop("checked", false);
            target = 'input[name="gdd-select-threshold"] [value="' + gdd_threshold + '"]'
            jQuery(target).prop("checked", true);
            this.current = gdd_threshold;
            this.execCallback(gdd_threshold);
        }
    },

    threshold: function() { return jQuery('input[name="gdd-select-threshold"]:checked').val(); },
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
            if (typeof loc_arg === 'undefined') { loc_obj = this.location(); }
            callback(ev, loc_obj);
            return true;
        } else { return false; }
    },

    init: function() {
        if (this.current) { this.setLocation(this.current);
        } else { this.setLocation(this.default); }
        jQuery("#gddtool-change-location").button( { label: "Change Location", } );
        jQuery("#gddtool-change-location").click(function() { LocationInterface.execCallback("locationChangeRequest"); });
    },

    location: function() { return jQuery.extend({}, this.current); },

    locationsAreDifferent: function(loc_obj_1, loc_obj_2) {
        return ( (loc_obj_1.address != loc_obj_2.address) ||
                 (loc_obj_1.lat != loc_obj_2.lat) ||
                 (loc_obj_1.lng != loc_obj_2.lng) );
    },

    setCallback: function (key, callback) { this.callbacks[key] = callback; },
    setDefault: function(loc_obj) { this.default = jQuery.extend({}, loc_obj); },

    setLocation: function(loc_obj) {
        logObjectAttrs(loc_obj);

        var span = '<span class="gddtool-location-address">{{ address }}</span>'
        var changed = false;

        if (this.current == null || this.locationsAreDifferent(loc_obj,this.current)) {  
            var address = null;
            var index = loc_obj.address.indexOf(", USA");
            if (index > 0) { address = loc_obj.address.replace(", USA","");
            } else { address = loc_obj.address; }
            var parts = address.split(", ");
            if (parts.length > 1) {
            address = span.replace("{{ address }}", parts[0]) + '</br>' + 
                      span.replace("{{ address }}", parts.slice(1).join(", "));
            } else { address = span.replace("{{ address }}", address); }

            jQuery("#gddtool-current-address").empty().append(address);
            jQuery("#gddtool-current-lat").empty().append(loc_obj.lat.toFixed(7));
            jQuery("#gddtool-current-lng").empty().append(loc_obj.lng.toFixed(7));

            if (this.current != null) { this.execCallback("locationChanged", jQuery.extend({}, loc_obj)); }
            this.current = jQuery.extend({}, loc_obj);

        } else if (loc_obj.key != this.current.key) {
            // location key was changed but not location data
            this.current = jQuery.extend({}, loc_obj);
        }
    },
}

var InterfaceManager = {
    dom: ['<div id="gddtool-location">',
          '<span class="csftool-em">Current Location :</span>',
          '<div id="gddtool-current-address"><span class="gddtool-location-address"> </span></div>',
          '<span class="csftool-em">Latitude : </span><span id="gddtool-current-lat"> </span>',
          '<br/><span class="csftool-em">Longitude : </span><span id="gddtool-current-lng"> </span>',
          '<button id="gddtool-change-location"></button>',
          '</div>',
          '<div id="gddtool-plant-date">',
          '<span class="csftool-em">Planting Date:</span>',
          '<div id="gddtool-date-selector">',
          '<input type="text" id="gddtool-datepicker">',
          '</div>',
          '</div>',
          '<div id="gddtool-thresholds">',
          '<form><span class="csftool-em">GDD Threshold</span><br/>',
          '<input type="radio" name="gdd-select-threshold" class="gdd50" value="50" checked="checked"></input>&nbsp;Base 50<br/>',
          '<input type="radio" name="gdd-select-threshold" class="gdd8650" value="8650"></input>&nbsp;Base 8650',
          '</form>',
          '</div>',
          '<div id="gddtool-chart-button">',
          '<p id="gddtool-no-toggle-text">Growing season is over.</p>',
          '<div id="gddtool-toggle-display">',
          '<button id="gddtool-toggle-button"></button>',
          '</div>',
          '</div>',
          '</div>'].join(''),
    csftool_url: null,
    gddtool_url: null,
    initial_date: undefined,

    init: function(dom_element) {
        //document.getElementById('csftool-input').innerHTML = this.dom;
        dom_element.innerHTML = this.dom;
        LocationInterface.init();
        DateInterface.init(this.initial_date);
        GddThresholdInterface.init();
        ChartTypeInterface.init();
    },

    setCallback: function(request_type, callback) {
        switch(request_type) {
            case "chartChangeRequest": ChartTypeInterface.setCallback(callback); break;
            case "gddThresholdChanged": GddThresholdInterface.setCallback(callback); break;
            case "locationChanged": LocationInterface.setCallback("locationChanged", callback); break;
            case "locationChangeRequest": LocationInterface.setCallback("locationChangeRequest", callback); break;
            case "plantDateChanged": DateInterface.setCallback('plantDateChanged', callback); break;
            case "yearChanged": DateInterface.setCallback('yearChanged', callback); break;
        }
    },

    setInitialDate: function(initial_date) { this.initial_date = dateToDateObject(initial_date); },
    setURL: function(tool, url) { if (tool == "csftool") { this.csftool_url = url; } else if (tool == "gddtool") { this.gddtool_url = url; } },
}

var jQueryInterfaceProxy = function() {

    if (arguments.length == 1) {
        var arg = arguments[0];
        switch(arg) {
            case "chart": // return currently selected chart
                return ChartTypeInterface.chartType();
                break;

            case "date_range": // return min and max dates for datepicker
                return { min_date: DateInterface.min_date, max_date: DateInterface.max_date }
                break;

            case "gdd_threshold": // return current GDD threhsold
                return GddThresholdInterface.threshold();
                break;

            case "hide_chart_selector": 
                return ChartTypeInterface.hideChartSelector();
                break;

            case "location": // return current location
                return LocationInterface.location();
                break;

            case "plant_date": // return current plant date
                return DateInterface.getDate();
                break;

            case "show_chart_selector": 
                return ChartTypeInterface.showChartSelector();
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

            case "chart": ChartTypeInterface.setChartType(arg_1); break;
            case "chart_types": ChartTypeInterface.setChartTypes(arg_1); break;
            case "csftool": InterfaceManager.setURL(arg_0, arg_1); break;
            case "date_range": DateInterface.setDateRange(arg_1[0], arg_1[1]); break;
            case "gddtool": InterfaceManager.setURL(arg_0, arg_1); break;
            case "initial_date": InterfaceManager.setInitialDate(arg_1); break;
            case "location": LocationInterface.setLocation(arg_1); break;
            case "plant_date": DateInterface.setStartDate(arg_1); break;
            case "year_range": DateInterface.setYearRange(arg_1[0], arg_1[1]); break;
        } // end of 2 argument switch

    } else if (arguments.length == 3) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        var arg_2 = arguments[2];
        switch(arg_0) {

            case "bind": InterfaceManager.setCallback(arg_1, arg_2); break;
            case "date_range": DateInterface.setDateRange([arg_1, arg_2]); break;
            case "year_range": DateInterface.setYearRange(arg_1, arg_2); break;
            case "default":
                if (arg_1 == "chart") { ChartTypeInterface.setDefault(arg_2);
                } else if (arg_1 == "location") { LocationInterface.setDefault(arg_2);
                } break;
        } // end of 3 argument switch
    }
    return undefined;
}

jQuery.fn.GddToolUserInterface = function(options) {
    var dom_element = this.get(0);
    if (options) {
        jQuery.each(options, function (i) {
            var option = options[i];
            for (var key in option) { jQueryInterfaceProxy(key, option[key]); }
        });
    }
    InterfaceManager.init(dom_element);
    console.log("EVENT :: GddToolUserInterface plugin ready");
    return jQueryInterfaceProxy;
}

})(jQuery);

