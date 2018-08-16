
;jQuery(document).ready( function () {
    console.log("EVENT :: document is ready");
    console.log("TOOLINIT :: creating display");

    options = [ { data_manager: GDDTOOL.data },
                { date_manager: GDDTOOL.dates },
                { default: "trend" },
                { gdd_threshold: GDDTOOL.location.gdd_threshold },
                { height: 450 },
                { labels: GDDTOOL.chart_labels },
                { location: GDDTOOL.location.location },
                { width: 700 } ];
    GDDTOOL.display = jQuery("#csftool-display").GddToolChart(options);

    console.log("TOOLINIT :: creating user interface");

    GDDTOOL.ui = jQuery("#csftool-input").GddToolUserInterface( [
          { csftool: GDDTOOL.csf_common_url },
          { gddtool: GDDTOOL.tool_url },
          { initial_date: GDDTOOL.location.plant_date }, 
          { year_range: [GDDTOOL.min_year, GDDTOOL.max_year]  },
          ] );
    var ui = GDDTOOL.ui;

    console.log("TOOLINIT :: initializing user interface callbacks");

    ui("bind", "chartChangeRequest", function(ev, chart_type) {
        GDDTOOL.display("chart_type", chart_type);
        GDDTOOL.display("redraw");
    });

    ui("bind", "gddThresholdChanged", function(ev, gdd_threshold) {
        GDDTOOL.location.gdd_threshold = gdd_threshold;
        GDDTOOL.display("gdd_threshold", gdd_threshold);
        GDDTOOL.data.requestDataUpload();
    });

    ui("bind", "locationChanged", function(ev, loc_obj) {
        if (typeof loc_obj.address === 'undefined') {
            console.log("BAD LOCATION :: " + loc_obj.lat + " , " + loc_obj.lng);
        } else { GDDTOOL.location.update(loc_obj); }
    });

    ui("bind", "locationChangeRequest", function(ev, loc_obj) { GDDTOOL.map_dialog("open", loc_obj); });

    ui("bind", "plantDateChanged", function(ev, plant_date) {
        GDDTOOL.dates.plant_date = plant_date;
        GDDTOOL.location.plant_date = plant_date;
    });

    console.log("TOOLINIT :: intializing data change callbacks");

    GDDTOOL.addListener("load.onComplete", function(manager) {
        var display = GDDTOOL.display;
        if (display("pending")) { display("drawPending");
        } else { display("redraw"); }
    });

    GDDTOOL.data.addListener("onChangeNormal", function(ev) { GDDTOOL.display("addSeries", "normal"); });

    GDDTOOL.data.addListener("onChangeSeason", function(ev) {
        GDDTOOL.display("addSeries", "season");
        if (GDDTOOL.dates.fcast_end != null) { GDDTOOL.display("addSeries", "forecast"); }
    });

    GDDTOOL.data.addListener("onChangePOR", function(ev) { GDDTOOL.display("addSeries", "por"); });
    GDDTOOL.data.addListener("onChangeRecent", function(ev) { GDDTOOL.display("addSeries", "recent"); });
    GDDTOOL.data.addListener("onDataRequest", function(ev) { GDDTOOL.display("change_pending", true); });

    GDDTOOL.dates.addListener("onChangePlantDate", function(ev, prev_date, plant_date) {
        var plant_year = plant_date.getFullYear();
        if (plant_year == prev_date.getFullYear()) {
            GDDTOOL.display("plant_date", plant_date);
            GDDTOOL.display("refresh");
        } else { GDDTOOL.dates.season = plant_year }
    });

    GDDTOOL.dates.addListener("onChangeSeason", function(ev, year) {
        GDDTOOL.display("plant_date", GDDTOOL.dates.plant_date);
        GDDTOOL.display("change_pending", true);
        GDDTOOL.uploadAllData();
    });

    GDDTOOL.dates.addListener("onClipSeason", function(ev, last_obs) {
        GDDTOOL.ui("hide_chart_selector");
        GDDTOOL.display("chart", "season");
    });

    GDDTOOL.dates.addListener("onResetTrend", function(ev, last_obs) {
        GDDTOOL.ui("chart_type", "trend");
        GDDTOOL.ui("show_chart_selector");
        GDDTOOL.display("chart", "trend");
    });

    GDDTOOL.location.addListener("onUpdate", function(ev, loc_obj) {
        GDDTOOL.display("location", loc_obj);
        GDDTOOL.data.requestDataUpload(loc_obj);
    });


    // draw any data that is wating on the chart to be fully functional
    GDDTOOL.data.executePendingCallbacks();
    GDDTOOL.display("drawPending")

    // create the map dialog last because the PHP site takes it's time
    // loading the Google Maps scripts
    console.log("TOOLINIT :: creating map dialog");
    jQuery("#csftool-input").append(GDDTOOL.map_dialog_container);

    var options = { width:600, height:500 };
    jQuery(GDDTOOL.map_dialog_anchor).CsfToolLocationDialog(options);
    GDDTOOL.map_dialog = jQuery(GDDTOOL.map_dialog_anchor).CsfToolLocationDialog();
    GDDTOOL.map_dialog("google", google);

    GDDTOOL.map_dialog("bind", "close", function(ev, context) { 
        if (context.selected_location != context.initial_location) {
            var loc_obj = context.selected_location;
            GDDTOOL.ui("location", loc_obj);
        }
    });

});

