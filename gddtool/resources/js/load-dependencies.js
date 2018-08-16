
function loadGddToolDependencies() {
    var csftool_url, gddtool_url;
    gddtool_url = jQuery('meta[name="toolserver"]').attr("content");
    if (typeof gddtool_url === 'undefined') { gddtool_url = jQuery('meta[name="toolserver"]').attr("value"); }
    if (gddtool_url.indexOf("/gddtool") > 0) { csftool_url = gddtool_url.replace("gddtool","csftool");
    } else { csftool_url = gddtool_url + "/csftool"; gddtool_url = gddtool_url + "/gddtool"; }
    GDDTOOL.uploadAllData();
}
loadGddToolDependencies();

