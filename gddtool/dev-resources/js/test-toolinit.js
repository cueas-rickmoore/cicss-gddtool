
;jQuery(document).ready( function () {
    console.log("EVENT :: document is ready");

    console.log("TOOLINIT :: creating user interface");
    GDDTOOL.ui = jQuery("#csftool-input").GddToolUserInterface( [
          { csftool: GDDTOOL.csf_common_url },
          { gddtool: GDDTOOL.tool_url },
          { initial_date: GDDTOOL.location.plant_date },
          ] );
    var ui = GDDTOOL.ui;

    console.log("TOOLINIT :: initializing user interface callbacks");

    ui("bind", "chartChangeRequest", function(ev, chart_type) {
        console.log("CALLBACK :: ui.chartChangeRequest executed : " + chart_type);
        GDDTOOL.display("chart_type", chart_type);
        GDDTOOL.display("redraw");
    });

    ui("bind", "gddThresholdChanged", function(ev, gdd_threshold) {
        console.log("CALLBACK :: ui.gddThresholdChanged executed");
        GDDTOOL.location.gdd_threshold = gdd_threshold;
        GDDTOOL.display("gdd_threshold", gdd_threshold);
        GDDTOOL.data.requestDataUpload();
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
    });

    console.log("TOOLINIT :: creating display");

    options = [ { data_manager: GDDTOOL.data },
                { date_manager: GDDTOOL.dates },
                { default: "trend" },
                { height: 450 },
                { labels: GDDTOOL.chart_labels },
                { location: GDDTOOL.location.location },
                { width: 700 } ];
    GDDTOOL.display = jQuery("#csftool-display").GddToolChart(options);

    console.log("TOOLINIT :: intializing data change callbacks");

    GDDTOOL.addListener("load.onComplete", function(manager) {
        console.log("CALLBACK :: load.onComplete executed");
        var display = GDDTOOL.display;
        if (display("pending")) { display("drawPending");
        } else { display("redraw"); }
    });

    GDDTOOL.data.addListener("onChangeNormal", function(ev) {
        console.log("CALLBACK :: data.onChangeNormal executed");
        GDDTOOL.display("addSeries", "normal"); 
    });

    GDDTOOL.data.addListener("onChangeSeason", function(ev) {
        console.log("CALLBACK :: data.onChangeSeason executed");
        GDDTOOL.display("addSeries", "season");
        GDDTOOL.display("addSeries", "forecast");
    });

    GDDTOOL.data.addListener("onChangePOR", function(ev) {
        console.log("CALLBACK :: data.onChangePOR executed");
        GDDTOOL.display("addSeries", "por"); 
    });

    GDDTOOL.data.addListener("onChangeRecent", function(ev) {
        console.log("CALLBACK :: data.onChangeRecent executed");
        GDDTOOL.display("addSeries", "recent"); 
    });

    GDDTOOL.data.addListener("onDataRequest", function(ev) {
        console.log("CALLBACK :: data.onDataRequest executed");
        GDDTOOL.display("change_pending", true);
    });

    GDDTOOL.dates.addListener("onChangePlantDate", function(ev, plant_date) {
        console.log("CALLBACK :: dates.onChangePlantDate executed");
        GDDTOOL.display("plant_date", plant_date);
        GDDTOOL.display("refresh");
    });

    GDDTOOL.location.addListener("onUpdate", function(ev, loc_obj) {
        console.log("CALLBACK :: location.onUpdate executed");
        GDDTOOL.display("location", loc_obj);
        GDDTOOL.data.requestDataUpload(loc_obj);
    });

    // draw any data that is wating on the chart to be fully functional
    console.log("EVENT :: executing pending data callbacks");
    GDDTOOL.data.executePendingCallbacks();
    GDDTOOL.display("drawPending")

    // create the map dialog last because the PHP site takes it's time
    // loading the Google Maps scripts
    console.log("TOOLINIT :: creating map dialog");
    jQuery("#csftool-input").append(GDDTOOL.map_dialog_container);

    var options = [ {width:600 }, {height:500} ];
    jQuery(GDDTOOL.map_dialog_anchor).CsfToolLocationDialog(options);
    GDDTOOL.map_dialog = jQuery(GDDTOOL.map_dialog_anchor).CsfToolLocationDialog();
    GDDTOOL.map_dialog("google", google);

    GDDTOOL.map_dialog("bind", "close", function(ev, context) { 
        console.log("EVENT :: LocationDialog closed");
        jQuery.each(context, function(key, value) { console.log("    ATTRIBUTE " + key + " = " + value); });
        if (context.selected_location != context.initial_location) {
            console.log("Selected location changed from " + context.initial_location.address + " to " + context.selected_location.address);
            var loc_obj = context.selected_location;
            GDDTOOL.ui("location", loc_obj);
        }
    });

});

