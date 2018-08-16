
;jQuery(document).ready( function () {
    console.log(" ");
    console.log("............ DOCUMENT IS READY ............");
    console.log("TOOLINIT :: creating load wait widget");
    //GDDTOOL.wait_widget.create()
    var widget = GDDTOOL.createWaitWidget();
    console.log("EVENT :: WAIT WIDGET CREATED");
    if (!(widget.load_is_complete)) { widget.open(); }

    console.log(" ");
    console.log("TOOLINIT :: creating display");

    var options = { height: 456 , width: 690, location: GDDTOOL.location.location }
    var display = GDDTOOL.createDisplay("#csftool-display", options);
    display("bind", "drawing_complete", function(ev) { GDDTOOL.wait_widget.close(); });

    GDDTOOL.addListener("onDataRequest", function(ev) {
        console.log("CALLBACK :: GDDTOOL onDataRequest executed");
        GDDTOOL.display("remove");
        GDDTOOL.wait_widget.start(['days','normal','por','recent','season']);
    });

    console.log(" ");
    console.log("TOOLINIT :: creating user interface");
    options = { date_button_url: GDDTOOL.csf_common_url + "/icons/calendar-24x24.png",
                initial_date: GDDTOOL.location.plant_date }
    var ui = GDDTOOL.createUserInterface("#csftool-input", options);
    console.log("TOOLINIT :: initializing user interface callbacks");

    ui("bind", "chartChangeRequest", function(ev, chart_type) {
        console.log("CALLBACK :: ui.chartChangeRequest executed : " + chart_type);
        GDDTOOL.display("chart_type", chart_type);
        GDDTOOL.display("redraw");
    });

    ui("bind", "gddThresholdChanged", function(ev, gdd_threshold) {
        console.clear();
        console.log("CALLBACK :: ui.gddThresholdChanged executed");
        GDDTOOL.location.gdd_threshold = gdd_threshold;
        GDDTOOL.display("gdd_threshold", gdd_threshold);
        GDDTOOL.uploadAllData();
    });

    ui("bind", "locationChanged", function(ev, loc_obj) {
        console.log("CALLBACK :: ui.locationChanged executed : " + loc_obj.address);
        if (typeof loc_obj.address === 'undefined') {
            console.log("BAD LOCATION :: " + loc_obj.lat + " , " + loc_obj.lng);
        } else { GDDTOOL.location.update(loc_obj); }
    });

    ui("bind", "locationChangeRequest", function(ev, loc_obj) {
        console.log(".........");
        console.log("CALLBACK :: ui.locationChangeRequest received : old is " + loc_obj.address);
        GDDTOOL.map_dialog("open", loc_obj);
    });

    ui("bind", "plantDateChanged", function(ev, plant_date) {
        console.log("CALLBACK :: ui.plantDateChanged executed : " + plant_date);
        GDDTOOL.dates.plant_date = plant_date;
        GDDTOOL.location.plant_date = plant_date;
    });

    console.log("TOOLINIT :: intializing data change callbacks");

    GDDTOOL.addListener("load.onComplete", function(manager) {
        console.log("CALLBACK :: load.onComplete executed");
        var display = GDDTOOL.display;
        if (display("pending")) { display("drawPending");
        } else { display("redraw"); }
    });

    GDDTOOL.data_mgr.addListener("onChangeNormal", function(ev) {
        console.log("CALLBACK :: data.onChangeNormal executed");
        // GDDTOOL.wait_widget.close();
        GDDTOOL.display("addSeries", "normal"); 
    });

    GDDTOOL.data_mgr.addListener("onChangeSeason", function(ev) {
        console.log("CALLBACK :: data.onChangeSeason executed");
        // GDDTOOL.wait_widget.close();
        console.log("     adding season data series");
        GDDTOOL.display("addSeries", "season");
        console.log("     adding forecast data series");
        GDDTOOL.display("addSeries", "forecast");
    });

    GDDTOOL.data_mgr.addListener("onChangePOR", function(ev) {
        console.log("CALLBACK :: data.onChangePOR executed");
        // GDDTOOL.wait_widget.close();
        GDDTOOL.display("addSeries", "por"); 
    });

    GDDTOOL.data_mgr.addListener("onChangeRecent", function(ev) {
        console.log("CALLBACK :: data.onChangeRecent executed");
        // GDDTOOL.wait_widget.close();
        GDDTOOL.display("addSeries", "recent"); 
    });

    GDDTOOL.dates.addListener("onChangePlantDate", function(ev, prev_date, plant_date) {
        console.log("CALLBACK :: dates.onChangePlantDate executed");
        console.log("    prev date : " + prev_date.toISOString());
        console.log("    plant date : " + plant_date.toISOString());
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
        console.log("CALLBACK :: dates.onClipSeason executed");
        GDDTOOL.ui("hide_chart_selector","season-over");
        GDDTOOL.display("chart", "season");
    });

    GDDTOOL.dates.addListener("onResetTrend", function(ev, last_obs) {
        console.log("CALLBACK :: dates.onResetTrend executed");
        GDDTOOL.ui("chart_type", "trend");
        GDDTOOL.ui("show_chart_selector");
        GDDTOOL.display("chart", "trend");
    });

    GDDTOOL.location.addListener("onUpdate", function(ev, loc_obj) {
        console.log("CALLBACK :: location.onUpdate executed");
        GDDTOOL.display("remove");
        GDDTOOL.display("location", loc_obj);
        GDDTOOL.wait_widget.start();
        GDDTOOL.uploadAllData(loc_obj);
    });

    // draw any data that is wating on the chart to be fully functional
    console.log("EVENT :: executing pending data callbacks");
    GDDTOOL.data_mgr.executePendingCallbacks();

    if (widget.load_is_complete) {
        console.log("TOOLINIT :: load is complete, stopping spinner");
        widget.stop();
    }

    widget.addListener("onLoadComplete", function(ev) {
        GDDTOOL.wait_widget.stop();
        GDDTOOL.display('redraw');
    });

    // create the map dialog last because the PHP site takes it's time
    // loading the Google Maps scripts
    console.log("TOOLINIT :: creating map dialog");
    //var map_dialog = GDDTOOL.createMapDialog("#csftool-input", options);
    //var options = { height:500, width:600 }
    var options = { width:600, height:500, google: google };
    jQuery("#csftool-input").append(GDDTOOL.map_dialog_container);
    jQuery(GDDTOOL.map_dialog_anchor).CsfToolLocationDialog(options);
    var map_dialog = jQuery(GDDTOOL.map_dialog_anchor).CsfToolLocationDialog();
    //map_dialog("google", google);
    GDDTOOL.map_dialog = map_dialog;

    map_dialog("bind", "close", function(ev, context) { 
        console.log("EVENT :: LocationDialog closed");
        jQuery.each(context, function(key, value) { console.log("    ATTRIBUTE " + key + " = " + value); });
        if (context.selected_location != context.initial_location) {
            console.log("    location changed from " + context.initial_location.address + " to " + context.selected_location.address);
            var loc_obj = context.selected_location;
            GDDTOOL.ui("location", loc_obj);
        }
    });
    map_dialog("bounds", [37.20, -82.70, 47.60, -66.90]);

    //GDDTOOL.display("redraw");
});

