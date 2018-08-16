
function loadToolDependencies() {
    var meta = document.querySelector('meta[name="toolserver"]');
    var tool_server = meta && meta.getAttribute("content");
    var csftool_url = tool_server + "/csftool";
    var gddtool_url = tool_server + "/gddtool";

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

