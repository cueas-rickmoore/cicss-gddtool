
;(function(jQuery) {

var DialogOptions = {
    autoOpen:false,
    draggable: false,
    height: 200,
    modal: false,
    resizable: false,
    width: 200,
}

var SpinnerDialog = {
    center_on:"#csftool-content",
    container: "#csftool-wait-dialog-content",
    dialog_anchor: "#csftool-wait-dialog",
    dialog_class: "csftool-spinner-dialog",
    dialog_content: "#csftool-wait-dialog-content",
    dialog_html: ['<div id="csftool-wait-dialog">',
                  '<div id="csftool-wait-dialog-content">',
                  '<div id="csftool-spinner" class="nowait"> </div>',
                  '</div></div>'].join(''),
    initialized: false,
    isopen: false,
    spinner: "#csftool-spinner",

    close: function() {
        console.log("EVENT :: close spinner dialog in " + this.container);
        jQuery(this.container).dialog("close");
        if (jQuery(this.spinner).hasClass("wait")) { jQuery(this.spinner).removeClass("wait"); }
        if (!(jQuery(this.spinner).hasClass("nowait"))) { jQuery(this.spinner).attr("class", "nowait"); }
        this.isopen = false;
    },

    create: function(dom_element, options) {
        console.log("EVENT :: creating new SpinnerDialog : " + this.container);
        jQuery(dom_element).append(this.dialog_html);
        console.log("    html installed in : " + dom_element);
        var dialog_options = this.mergeOptions(options)
        console.log("    appendTo : " + dialog_options.appendTo);
        jQuery(this.container).dialog(dialog_options);
        jQuery(this.container).dialog("widget").find(".ui-dialog-header").css({ border:0, padding:0 })
                                               .find(".ui-dialog-header").css({ display:"none" }).end();
        //                                       .find(".ui-dialog-titlebar-close").css({ display:"none" });
        this.center_on = dialog_options.center_on;
        this.initialized = true;
        return this;
    },

    destroy: function() {
        if (this.isopen) { this.close() };
        jQuery(this.container).dialog("destroy");
        jQuery(this.dialog_anchor).remove();
        this.initialized = false;
    },

    mergeOptions: function(options) {
        var merged = jQuery.extend({}, DialogOptions);
        merged['appendTo'] = this.dialog_anchor;
        merged['dialogClass'] = this.dialog_class;
        merged["position"] = { my:"center center", at:"center center", of:this.center_on };
        if (typeof options !== 'undefined') {
            var self = this;
            jQuery.each(options, function (key, value) {
                if (key == "center_on") {
                    self.center_on = value;
                    merged["position"] = { my: "center center", at: "center center", of: value };
                } else { merged[key] = value; }
            });
        }
        return merged;
    },

    open: function(div_id) {
        console.log("EVENT :: open spinner dialog in " + this.container);
        if (typeof div_id === "string") { this.position(div_id); }
        if (jQuery(this.spinner).hasClass("nowait")) { jQuery(this.spinner).removeClass("nowait"); }
        if (!(jQuery(this.spinner).hasClass("wait"))) { jQuery(this.spinner).attr("class", "wait"); }
        jQuery(this.container).dialog("open");
        this.isopen = true;
        return false;
    },

    position: function(div_id) {
        var position = { my: "center center", at: "center center", of: div_id }
        this.center_on = div_id;
        jQuery(this.container).dialog("position", position);
    },

    waiting: function() { return jQuery(this.spinner).hasClass("wait"); },
}

jQuery.fn.CsfToolSpinnerDialog = function(options) {
    var dom_element = this.get(0);
    var dialog = SpinnerDialog.create(dom_element, options);
    return dialog;
}

})(jQuery);

