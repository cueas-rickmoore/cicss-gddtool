function loadCsfTool() {
    CSFAPP_SERVER = window.location.href;
    CSFTOOL_NAME = jQuery("meta[name='toolname']").attr("content");
    CSFTOOL_URL = jQuery("meta[name='toolserver']").attr("content");

    var script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", CSFTOOL_URL + "/js/load-dependencies.js");
    window.document.body.appendChild(script);

    script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", CSFTOOL_URL + "/js/toolinit.js");
    window.document.body.appendChild(script);
    console.log("toolinit.js added to body");
}

