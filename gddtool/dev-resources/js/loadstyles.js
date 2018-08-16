
function loadGDDToolStyles() {
    var csftool_url, dependency, element, gddtool_url;
    gddtool_url = jQuery('meta[name="toolserver"]').attr("content");
    if (typeof gddtool_url === 'undefined') {
        gddtool_url = jQuery('meta[name="toolserver"]').attr("value");
    }
    if (gddtool_url.indexOf("/gddtool") > 0) {
        csftool_url = gddtool_url.replace("gddtool","csftool");
    } else { 
        csftool_url = gddtool_url + "/csftool"; 
        gddtool_url = gddtool_url + "/gddtool"; 
    }

    element = jQuery("head");
    dependency = document.createElement('link');
    dependency.setAttribute("rel","stylesheet");
    dependency.setAttribute("type","text/css");
    dependency.setAttribute("href", csftool_url + "/style/csftool.css");
    element.append(dependency);

    dependency = document.createElement('link');
    dependency.setAttribute("rel","stylesheet");
    dependency.setAttribute("type","text/css");
    dependency.setAttribute("href", csftool_url + "/style/csftool-spinner.css");
    element.append(dependency);

    dependency = document.createElement('link');
    dependency.setAttribute("rel","stylesheet");
    dependency.setAttribute("type","text/css");
    dependency.setAttribute("href", csftool_url + "/style/csftool-jquery-ui.css");
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
loadGDDToolStyles();

