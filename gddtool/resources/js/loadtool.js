function loadCsfTool() {
    CSFAPP_SERVER = window.location.href;
    //CSFTOOL_NAME = jQuery("meta[name='toolname']")[0].attr("value");
    var meta = document.querySelector('meta[name="toolname"]');
    CSFTOOL_NAME = meta && meta.getAttribute("content");
    //CSFTOOL_SERVER = jQuery("meta[name='toolserver']")[0].attr("value");
    meta = document.querySelector('meta[name="toolserver"]');
    CSFTOOL_SERVER = meta && meta.getAttribute("content");
    CSFTOOL_URL = CSFTOOL_SERVER + '/' + CSFTOOL_NAME;

    script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", CSFTOOL_URL + "/js/load-dependencies.js");
    window.document.body.appendChild(script);

    script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    console.log("attempting to load toolinit.js");
    script.setAttribute("src", CSFTOOL_URL + "/js/toolinit.js");
    window.document.body.appendChild(script);
    console.log("toolinit.js added to body");
}

