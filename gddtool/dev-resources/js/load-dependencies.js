
function loadGddToolDependencies() {
    var csftool_url, gddtool_url;
    console.log("GDDTOOL :: LOAD DEPENDENCIES : executing");
    gddtool_url = jQuery('meta[name="toolserver"]').attr("content");
    if (typeof gddtool_url === 'undefined') {
        gddtool_url = jQuery('meta[name="toolserver"]').attr("value");
    }
    //console.log("GDDTOOL :: TOOL_SERVER : " + gddtool_url);
    if (gddtool_url.indexOf("/gddtool") > 0) {
        csftool_url = gddtool_url.replace("gddtool","csftool");
    } else {
        csftool_url = gddtool_url + "/csftool";
        gddtool_url = gddtool_url + "/gddtool";
    }
    //console.log("GDDTOOL :: CSFTOOL_URL : " + csftool_url);
    //console.log("GDDTOOL :: GDDTOOL_URL : " + gddtool_url);

    console.log("GDDTOOL : sending data upload requests");
    GDDTOOL.uploadAllData();
}
loadGddToolDependencies();

