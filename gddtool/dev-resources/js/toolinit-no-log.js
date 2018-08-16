
;jQuery(document).ready( function () {
    //GDDTOOL.wait_widget.create()
    var widget = GDDTOOL.createWaitWidget();
    if (!(widget.load_is_complete)) { widget.open(); }

    var options = { height: 456 , width: 690, location: GDDTOOL.location.location }
    var display = GDDTOOL.createDisplay("#csftool-display", options);
    display("bind", "drawing_complete", function(ev) { GDDTOOL.wait_widget.close(); });

    GDDTOOL.addListener("onDataRequest", function(ev) {
        GDDTOOL.display("remove");
        GDDTOOL.wait_widget.start(['days','normal','por','recent','season']);
    });

    options = { date_button_url: GDDTOOL.csf_common_url + "/icons/calendar-24x24.png",
                initial_date: GDDTOOL.location.plant_date }
    var ui = GDDTOOL.createUserInterface("#csftool-input", options);

    ui("bind", "chartChangeRequest", function(ev, chart_type) {
        GDDTOOL.display("chart_type", chart_type);
        GDDTOOL.display("redraw");
    });

    ui("bind", "gddThresholdChanged", function(ev, gdd_threshold) {
        GDDTOOL.location.gdd_threshold = gdd_threshold;
        GDDTOOL.display("gdd_threshold", gdd_threshold);
        GDDTOOL.uploadAllData();
    });

    ui("bind", "locationChanged", function(ev, loc_obj) {
        if (typeof loc_obj.address !== 'undefined') { GDDTOOL.location.update(loc_obj); }
    });

    ui("bind", "locationChangeRequest", function(ev, loc_obj) {
        GDDTOOL.map_dialog("open", loc_obj);
    });

    ui("bind", "plantDateChanged", function(ev, plant_date) {
        GDDTOOL.dates.plant_date = plant_date;
        GDDTOOL.location.plant_date = plant_date;
    });


    GDDTOOL.addListener("load.onComplete", function(manager) {
        var display = GDDTOOL.display;
        if (display("pending")) { display("drawPending");
        } else { display("redraw"); }
    });

    GDDTOOL.data_mgr.addListener("onChangeNormal", function(ev) {
        GDDTOOL.display("addSeries", "normal"); 
    });

    GDDTOOL.data_mgr.addListener("onChangeSeason", function(ev) {
        GDDTOOL.display("addSeries", "season");
        GDDTOOL.display("addSeries", "forecast");
    });

    GDDTOOL.data_mgr.addListener("onChangePOR", function(ev) {
        GDDTOOL.display("addSeries", "por"); 
    });

    GDDTOOL.data_mgr.addListener("onChangeRecent", function(ev) {
        GDDTOOL.display("addSeries", "recent"); 
    });

    GDDTOOL.dates.addListener("onChangePlantDate", function(ev, prev_date, plant_date) {
        var plant_year = plant_date.getFullYear();
        if (plant_year == prev_date.getFullYear()) {
            GDDTOOL.display("plant_date", plant_date);
            var latest_available = GDDTOOL.dates.fcast_end;
            if ( latest_available == null) { latest_available = GDDTOOL.dates.last_obs; }
            if (plant_date > latest_available) {
                GDDTOOL.ui("chart","outlook");
                GDDTOOL.ui("hide_chart_selector","plant-late");
            } else { GDDTOOL.display("refresh"); }
        } else { GDDTOOL.dates.season = plant_year }
    });

    GDDTOOL.dates.addListener("onChangeSeason", function(ev, year) {
        GDDTOOL.display("plant_date", GDDTOOL.dates.plant_date);
        GDDTOOL.display("remove");
        GDDTOOL.wait_widget.start();
        GDDTOOL.display("change_pending", true);
        GDDTOOL.uploadAllData();
    });

    GDDTOOL.dates.addListener("onClipSeason", function(ev, last_obs) {
        GDDTOOL.ui("hide_chart_selector","season-over");
        GDDTOOL.display("chart", "season");
    });

    GDDTOOL.dates.addListener("onResetTrend", function(ev, last_obs) {
        GDDTOOL.ui("chart_type", "trend");
        GDDTOOL.ui("show_chart_selector");
        GDDTOOL.display("chart", "trend");
    });

    GDDTOOL.location.addListener("onUpdate", function(ev, loc_obj) {
        GDDTOOL.display("remove");
        GDDTOOL.display("location", loc_obj);
        GDDTOOL.wait_widget.start();
        GDDTOOL.uploadAllData(loc_obj);
    });

    // draw any data that is wating on the chart to be fully functional
    GDDTOOL.data_mgr.executePendingCallbacks();

    if (widget.load_is_complete) {
        widget.stop();
    }

    widget.addListener("onLoadComplete", function(ev) {
        GDDTOOL.wait_widget.stop();
        GDDTOOL.display('redraw');
    });

    var options = { width:600, height:500, google: google };
    jQuery("#csftool-input").append(GDDTOOL.map_dialog_container);
    jQuery(GDDTOOL.map_dialog_anchor).CsfToolLocationDialog(options);
    var map_dialog = jQuery(GDDTOOL.map_dialog_anchor).CsfToolLocationDialog();
    //map_dialog("google", google);
    GDDTOOL.map_dialog = map_dialog;

    map_dialog("bind", "close", function(ev, context) { 
        if (context.selected_location != context.initial_location) {
            var loc_obj = context.selected_location;
            GDDTOOL.ui("location", loc_obj);
        }
    });
    map_dialog("bounds", [37.20, -82.70, 47.60, -66.90]);

    //GDDTOOL.display("redraw");
});

