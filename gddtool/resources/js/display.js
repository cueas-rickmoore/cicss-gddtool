
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

    data_manager: null,
    change_pending: true,
    date_manager: null,
    default_chart: null,
    display_anchor: null,
    dom: '<div id="gddtool-display-chart"></div>',
    drawn: [ ],
    gdd_threshold: null,
    initialized: false,
    location: null,
    pending_series: [ ],
    plant_date: null,
    season: null,

    // FUNCTIONS
    highchartsIsAvailable: function() { return (typeof Highcharts != "undefined"); },

    addSeries: function(data_type, data) {
        this.validChart();
        if (this.chart) {
                this.chart.addSeries(data, true);
                this.drawn.push(data_type);
                if (this.pending_series.length  > 0) { this.drawPending(); }
        } else {
             console.log("CHART NOT READY ... " + data_type + " wants to be drawn");
             this.pending_series.push([data_type, data]);
        }
    },

    addSeriesType: function(data_type) {
        var data = null;
        switch(data_type) {
            case "forecast": data = this.genCurrentForecast(this.data_manager); break;
            case "normal": data = this.genClimateNormal(this.data_manager); break;
            case "season": data = this.genCurrentSeason(this.data_manager); break;
            case "por": data = this.genPeriodOfRecord(this.data_manager); break;
            case "recent": data = this.genRecentHistory(this.data_manager); break;
        }
        if (data !== null) { this.addSeries(data_type, data); }
    },

    clear: function() {
        while( this.chart.series.length > 0 ) { this.chart.series[0].remove(false); }
        this.drawn = [ ];
    },

    draw: function() {
        this.addSeries("season", this.genCurrentSeason(this.data_manager));
        this.addSeries("forecast", this.genCurrentForecast(this.data_manager));
        this.addSeries("recent", this.genRecentHistory(this.data_manager));
        this.addSeries("normal", this.genClimateNormal(this.data_manager));
        this.addSeries("por", this.genPeriodOfRecord(this.data_manager));
    },

    drawChartLabel: function() {
        var label = this.date_manager.season + " " + this.chart_labels[this.chart_type];
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
        }
    },

    genDataPairs: function(data_type, start, end, base) {
        var base_value = this.data_manager.dataAt(data_type, base);
        var data = this.data_manager.sliceData(data_type, start, end);
        var days = this.date_manager.sliceDays(start, end);
        var result;
        var series = [ ];
        for (var i=0; i < data.length; i++) { 
            result = [ days[i], data[i]-base_value ];
            //result = [ days[i], data[i] ];
            series.push(result);
        }
        return series;
    },

    genClimateNormal: function() {
        var end = null;
        if (this.chart_type == "trend") { end = this.trendEndIndex(); }
        var start = this.date_manager.indexOf("plant_date");
        return jQuery.extend(true, { data: this.genDataPairs("normal", start, end, start) }, this.components.normal);
    },

    genCurrentSeason: function() { // from plant date thru last obs
        var start = this.date_manager.indexOf("plant_date");
        var end = this.trendEndIndex("last_obs");
        return jQuery.extend(true, { data: this.genDataPairs("season", start, end, start) }, this.components.season);
    },

    genCurrentForecast: function() { // add forecast to extend season
        var base = this.date_manager.indexOf("plant_date");
        var start = this.date_manager.indexOf("fcast_start");
        if (start >= this.date_manager.num_days_in_season) { return null; }
        var end = this.trendEndIndex("fcast_end");
        return jQuery.extend(true, { data: this.genDataPairs("season", start, end, base) }, this.components.forecast);
    },

    genPeriodOfRecord: function() {
        var end = null;
        if (this.chart_type == "trend") { end = this.trendEndIndex(); }
        var start = this.date_manager.indexOf("plant_date");
        // turn POR data into array of [date, min, max]
        var days = this.date_manager.sliceDays(start, end);
        var por_avg = this.data_manager.sliceData("poravg", start, end);
        var base = por_avg[0];
        var por_max = this.data_manager.sliceData("pormax", start, end);
        var por_min = this.data_manager.sliceData("pormin", start, end);
        var data = por_avg.map(function(value, index, obj) { var avg = value - base; return [ days[index], avg * por_min[index], avg * por_max[index] ]; });
        return jQuery.extend(true, { data:data, }, this.components.por);
    },

    genRecentHistory: function() {
        var end = null;
        if (this.chart_type == "trend") { end = this.trendEndIndex(); }
        var start = this.date_manager.indexOf("plant_date");
        return jQuery.extend(true, { data: this.genDataPairs("recent", start, end, start) }, this.components.recent);
    },

    init: function(dom_element) {
        this.display_anchor = dom_element.id;
        dom_element.innerHTML = this.dom;
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

    setChartHeight: function(height) { this.chart_config.chart["height"] = height; },
    setChartType: function(chart_type) { this.chart_type = chart_type; this.change_pending = true; },
    setChartWidth: function(width) { this.chart_config.chart["width"] = width; },

    setGddThreshold: function(threshold) { 
        if (threshold != this.gdd_threshold) { this.gdd_threshold = threshold.toString(); this.change_pending = true; }
    },

    setLabel: function(key, label) { this.chart_labels[key] = label; },
    setLabels: function(labels) { this.chart_labels = jQuery.extend(this.chart_labels , labels); },

    setLocation: function(loc_obj) {
        var address;
        if (typeof loc_obj === 'string') { address = loc_obj.toString();
        } else { address = loc_obj.address.toString(); }
        if ((this.location == null) || (address != this.location)) { 
            this.location = address
            this.change_pending = true;
        }
    },

    setOption: function(key, value) {
        switch(key) {
            case "chart":
            case "chart_type":
                this.setChartType(value);
                break;
            case "data_manager": this.data_manager = value; break;
            case "change_pending": this.change_pending = value; break; 
            case "date_manager": this.date_manager = value; break;
            case "default": this.default_chart = value; break;
            case "gdd_threshold": this.setGddThreshold(value); break;
            case "height": this.setChartHeight(value); break;
            case "labels": this.setLabels(value); break;
            case "location": this.setLocation(value); break;
            case "plant_date": this.setPlantDate(value); break;
            case "season": this.season = value; break;
            case "width": this.setChartWidth(value); break;
        }
    },

    setOptions: function(options) {
        jQuery.each(options, function (i) {
            var option = options[i];
            for (var key in option) { GddChartController.setOption(key, option[key]); }
        });
    },

    setPlantDate: function(plant_date) { this.plant_date = plant_date; },
    subtitle: function() { return "@ " + this.location; },
    title: function() { return "Cumulative Base " + this.gdd_threshold + " Growing Degree Days"; },

    trendEndIndex: function() {
        end_index = this.date_manager.indexOf("fcast_end");
        if (end_index >= 0) { return end_index } else { return this.date_manager.indexOf("last_obs"); }
    },

    validChart: function() {
        if ( this.change_pending || (typeof this.chart === 'undefined') || (this.chart === null) ) {
            this.newChart();
        }
    },
}

var jQueryDisplayProxy = function() {

    if (arguments.length == 1) {
        switch(arguments[0]) {
            case "change_pending": // return current state
                return GddChartController.change_pending;
                break;
            case "chart": // return currently display chart type
            case "chart_type":
                return GddChartController.chart_type;
                break;
            case "chart_anchor": return GddChartController.chart_anchor; break;
            case "display_anchor": return GddChartController.display_anchor; break;
            case "draw": GddChartController.draw(); break;
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
            case "new_data": GddChartController.newDataAvailable(arg_1); break;
            case "options": GddChartController.setOptions(arg_1); break;
            default: GddChartController.setOption(arg_0, arg_1); break;
        } // end of 2 argument switch

    } else if (arguments.length == 3) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        var arg_2 = arguments[2];
        switch(arg_0) {
            case "label": GddChartController.setLabel(arg_1, arg_2); break;
            case "option": GddChartController.setOption(arg_1, arg_2); break;
        } // end of 3 argument switch
    }
    return undefined;
}

jQuery.fn.GddToolChart = function(options) {
    var dom_element = this.get(0);
    if (typeof options !== 'undefined') { GddChartController.setOptions(options); }
    GddChartController.init(dom_element);
    return jQueryDisplayProxy;
}

})(jQuery);

