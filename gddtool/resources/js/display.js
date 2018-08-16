
;(function(jQuery) {

var gddToolTooltipFormatter = function() {
    var tip = '<span style="font-size:12px;font-weight:bold;text-align:center">' + Highcharts.dateFormat('%b %d, %Y', this.x) + '</span>'
    jQuery.each(this.points, function() {
        if (this.series.type == "line") {
            tip += '<br/>' + this.y + ' : <span style="color:'+this.color+'">' + this.series.name + '</span>';
        } else {
            tip += '<br/>' + this.point.low.toFixed(0) + '-' + this.point.high.toFixed(0) + ' : <span style="color:'+this.color+'">' + this.series.name + '</span>';
        }
    });
    return tip;
}

var GddChartController = {
    // PROPERTIES
    callback: null,
    chart: null,
    chart_anchor: "#gddtool-display-chart",
    chart_labels: { },
    chart_type: null,
    chart_config: { chart: { type:"line"}, plotOptions: { series: { states: { hover: { enabled: true, halo: false } } } },
        credits: { text:"Powered by NRCC", href:"http://www.nrcc.cornell.edu/", color:"#000000" },
        title: { text: 'Cumulative Growing Degree Days' },
        subtitle: { text: 'location address', style: { "font-size":"14px", color: "#000000" } },
        xAxis: { type: 'datetime', crosshair: { width:1, color:"#ff0000", snap:true }, labels: { style: { color: "#000000" } },
                 dateTimeLabelFormats: { millisecond: '%H:%M:%S.%L', second: '%H:%M:%S', minute: '%H:%M', hour: '%H:%M', day: '%d %b', week: '%d %b', month: '%b<br/>%Y', year: '%Y' },
                },
        yAxis: { title: { text: 'Cumulative GDD', style: { "font-size":"14px", color: "#000000" } }, min: 0, labels: { style: { color: "#000000" } } },
        tooltip: { useHtml: true, shared: true, borderColor: "#000000", borderWidth: 2, borderRadius: 8, shadow: false, backgroundColor: "#ffffff", 
                   crosshairs: { width:2, color:"#000000" }, xDateFormat: "%b %d, %Y", positioner: function () { return { x: 80, y: 60 }; },
                   formatter: gddToolTooltipFormatter
                   //pointFormat: '<span style="color:{point.color}">{series.name}</span>: <b>{point.y}</b><br/>',
                   //headerFormat: '<span style="font-size: 12px">{point.key}</span><br/>'
                  },
        legend: { floating: true, backgroundColor: "#ffffff", borderRadius: 5, borderWidth: 1, align: 'left', verticalAlign: 'top', x: 70, y: 50, width: 135, zindex: 20 },
        series: [ ],
    },

    components: { // pointInterval is always 1 day in milliseconds
        "forecast" : { name: "6 Day Forecast", type: "line", zIndex: 15, lineWidth: 2, color: "#ff0000",
                       marker: { enabled: true, fillColor: "#ff0000", lineWidth: 2, lineColor: "#ff0000", radius:2, symbol:"circle" } },
        "normal" : { name: '30 Year "Normal"', type: "line", zIndex: 12, lineWidth: 2, color: "#B041FF",
                     marker: { enabled: false, states: { hover: { enabled: false }} } },
        "por" : { name: 'Period of Record', type: "arearange", zIndex: 10, lineWidth: 2, color: "#444444", fillColor: "#eeeeee", fillOpacity: 0.1,
                  marker: { enabled: false, states: { hover: { enabled: false }} } },
        "recent" : { name: "15 Year Average", type: "line", zIndex: 13, lineWidth: 2, color: "#0000ff",
                     marker: { enabled: false, states: { hover: { enabled: false }} } },
        "season" : { name: "Year to Date", type: "line", zIndex: 14, lineWidth: 2, color: "#00dd00",
                     marker: { enabled: true, fillColor: "#00dd00", lineWidth: 2, lineColor: "#00dd00", radius:2, symbol:"circle" } },
    },

    change_pending: true,
    default_chart: null,
    display_anchor: null,
    dom: '<div id="gddtool-display-chart"></div>',
    drawn: [ ],
    gdd_threshold: null,
    initialized: false,
    location: null,
    pending_series: [ ],
    series_order: ["season","forecast","recent","normal","por"],
    plant_date: null,
    tool: null,
    year: null,

    // FUNCTIONS
    addSeries: function(data_type, data) {
        var series = jQuery.extend(true, { data: data}, this.components[data_type]);
        if (data.length > 0) {
            this.validChart();
            if (this.chart) {
                this.chart.addSeries(series, true);
                this.drawn.push(data_type);
                if (this.pending_series.length > 0) { this.drawPending(); }
            } else { this.pending_series.push([data_type, series]); }
        } else { this.drawn.push(data_type); }
        this.complete(true);
    },

    addSeriesType: function(data_type) {
        var data = null;
        switch(data_type) {
            case "forecast": data = this.tool.forecast(); break;
            case "normal": data = this.tool.climateNorms(this.chart_type); break;
            case "season": data = this.tool.observations(this.chart_type); break;
            case "por": data = this.tool.periodOfRecord(this.chart_type); break;
            case "recent": data = this.tool.recentHistory(this.chart_type); break;
        }
        if (data !== null) { this.addSeries(data_type, data); }
    },

    allDrawn: function() { return (this.drawn.length == this.series_order.length); },
    bind: function(event_type, callback) { this.callback = callback; },

    changeGddThreshold: function(threshold) { 
        if (threshold != this.gdd_threshold) {
            this.gdd_threshold = threshold.toString();
            this.change_pending = true;
        }
    },

    changeLocation: function(loc_obj) {
        var address;
        if (typeof loc_obj === 'string') { address = loc_obj.toString();
        } else { address = loc_obj.address.toString(); }
        if (address != this.location) {
            this.location = address
            this.change_pending = true;
        }
    },

    clear: function() { while( this.chart.series.length > 0 ) { this.chart.series[0].remove(false); } this.drawn = [ ]; },
    complete: function(reset) { if (this.allDrawn()) { this.execCallback(reset); } },

    draw: function() {
        this.drawn = [ ];
        this.addSeries("season", this.tool.observations(this.chart_type));
        this.addSeries("forecast", this.tool.forecast());
        this.addSeries("recent", this.tool.recentHistory(this.chart_type));
        this.addSeries("normal", this.tool.climateNorms(this.chart_type));
        this.addSeries("por", this.tool.periodOfRecord(this.chart_type));
    },

    drawChartLabel: function() {
        var label = this.tool.dates.season + " " + this.chart_labels[this.chart_type];
        this.chart.renderer.text(label, 325, 85).css({ color: "#000000", fontSize: "16px"}).add();
    },

    drawPending: function() {
        if (this.pending_series.length > 0) {
            this.validChart();
            var series;
            while (this.pending_series.length > 0) {
                series = this.pending_series.pop();
                this.chart.addSeries(series[1], true);
                if (this.drawn.indexOf(series[0]) < 0) { this.drawn.push(series[0]); }
            }
            this.complete(true);
        }
    },

    execCallback: function(reset) {
        if (typeof this.callback !== 'undefined' && this.callback != null) { 
            this.callback("drawing_complete");
            if (typeof reset !== 'undefined' && reset === true) { this.drawn = [ ]; }
        }
    },

    highchartsIsAvailable: function() { return (typeof Highcharts != "undefined"); },

    init: function(dom_element) {
        this.display_anchor = dom_element.id;
        jQuery(dom_element).append(this.dom);
        Highcharts.setOptions({ global: { useUTC: false } });
        this.initialized = true;
        if (this.chart_type == null) { this.chart_type = this.default_chart; }
    },

    newChart: function() {
        if (this.chart != null) { this.chart.destroy(); this.chart = null; }

        var config = jQuery.extend(true, { }, this.chart_config);
        config.series = [ ];
        config.title.text = this.title();
        config.subtitle.text = this.subtitle();
        jQuery("#gddtool-display-chart").highcharts("Chart", config);
        this.chart = jQuery("#gddtool-display-chart").highcharts();
        this.drawChartLabel();

        this.change_pending = false;
        this.drawn = [ ];
        this.pending_series = [ ];
    },

    redraw: function() { this.newChart(); this.draw(); },
    refresh: function() { this.clear(); this.draw(); },
    remove: function() { if (this.chart != null) { this.chart.destroy(); this.chart = null; } },
    setChartType: function(chart_type) { this.chart_type = chart_type; this.change_pending = true; },

    subtitle: function() { return "@ " + this.location; },
    title: function() { return "Cumulative Base " + this.gdd_threshold + " Growing Degree Days"; },

    trendEndIndex: function() {
        end_index = this.tool.dates.indexOf("fcast_end");
        if (end_index >= 0) { return end_index } else { return this.tool.dates.indexOf("last_obs"); }
    },

    validChart: function() {
        if ( this.change_pending || (typeof this.chart === 'undefined') || (this.chart === null) ) {
            this.newChart();
        }
    },
}

var DisplayProxy = function() {

    if (arguments.length == 1) {
        switch(arguments[0]) {
            case "all_series_drawn": return GddChartController.allDrawn(); break;
            case "change_pending": return GddChartController.change_pending; break;
            case "chart": case "chart_type": return GddChartController.chart_type; break;
            case "chart_anchor": return GddChartController.chart_anchor; break;
            case "display_anchor": return GddChartController.display_anchor; break;
            case "draw": GddChartController.draw(); break;
            case "drawn": return GddChartController.drawn; break;
            case "drawPending": GddChartController.drawPending(); break;
            case "gdd_threshold": return GddChartController.gdd_threshold; break;
            case "location": return GddChartController.location; break;
            case "pending": return GddChartController.pending.length; break;
            case "plant_date": return GddChartController.plant_date; break;
            case "redraw": GddChartController.redraw(); break;
            case "refresh": GddChartController.refresh(); break;
            case "season": return GddChartController.season; break;
        } // end of single argument switch


    } else if (arguments.length == 2) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        switch(arg_0) {
            case "addSeries": GddChartController.addSeriesType(arg_1); break;
            case "change_pending": GddChartController.change_pending = arg_1; break;
            case "chart": case "chart_type": GddChartController.setChartType(arg_1); break;
            case "default": GddChartController.default_chart = arg_1; break;
            case "gdd_threshold": GddChartController.changeGddThreshold(arg_1); break;
            case "height": GddChartController.chart_config.chart["height"] = arg_1; break;
            case "labels": GddChartController.chart_labels = jQuery.extend({ }, arg_1); break;
            case "location": GddChartController.changeLocation(arg_1); break;
            case "new_data": GddChartController.newDataAvailable(arg_1); break;
            case "options": jQuery.each(arg_1, function(key, value) { DisplayProxy(key, value) }); break;
            case "plant_date": GddChartController.plant_date = arg_1; break;
            case "season": GddChartController.season = arg_1; break;
            case "tool": GddChartController.tool = arg_1; break;
            case "width": GddChartController.chart_config.chart["width"] = arg_1; break;
        } // end of 2 argument switch

    } else if (arguments.length == 3) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        var arg_2 = arguments[2];
        switch(arg_0) {
            case "bind": GddChartController.bind(arg_1, arg_2); break;
            case "label": GddChartController.chart_labels[arg_1] = arg_2; break;
            case "option": this(arg_1, arg_2); break;
        } // end of 3 argument switch
    }
    return undefined;
}

jQuery.fn.GddToolChart = function(options) {
    var dom_element = this.get(0);
    if (typeof options !== 'undefined') { DisplayProxy("options", options); }
    GddChartController.init(dom_element);
    return DisplayProxy;
}

})(jQuery);

