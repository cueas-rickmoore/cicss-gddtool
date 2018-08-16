
function loadToolDependencies() {
    var csftool_url, gddtool_url;
    var tool_server = jQuery('meta[name="toolserver"]').attr("content");
    if (typeof tool_server === 'undefined') {
        tool_server = jQuery('meta[name="toolserver"]').attr("value");
    }
    var index = tool_server.indexOf("gddtool");
    if (index > 0) {
        csftool_url = tool_server.replace("gddtool","csftool");
        gddtool_url = tool_server;
    } else {
        csftool_url = tool_server + "/csftool";
        gddtool_url = tool_server + "/gddtool";
    }

    var dependency;
    var element = jQuery("body");
    dependency = document.createElement('link');
    dependency.setAttribute("rel","stylesheet");
    dependency.setAttribute("type","text/css");
    dependency.setAttribute("href", csftool_url + "/style/growth-circle.css");
    element.append(dependency);

    dependency = document.createElement('link');
    dependency.setAttribute("rel","stylesheet");
    dependency.setAttribute("type","text/css");
    dependency.setAttribute("href", csftool_url + "/style/test-csftool-jquery-ui.css");
    element.append(dependency);

    dependency = document.createElement('link');
    dependency.setAttribute("rel","stylesheet");
    dependency.setAttribute("type","text/css");
    dependency.setAttribute("href", csftool_url + "/style/location-dialog.css");
    element.append(dependency);

    dependency = document.createElement('link');
    dependency.setAttribute("rel","stylesheet");
    dependency.setAttribute("type","text/css");
    dependency.setAttribute("href", gddtool_url + "/style/gddtool.css");
    element.append(dependency);
}
loadToolDependencies();

