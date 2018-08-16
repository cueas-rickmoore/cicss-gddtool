
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
        jQuery(this.container).dialog("close");
        jQuery(this.spinner).attr("class","nowait");
        this.isopen = false;
    },

    create: function(dom_element, options) {
        jQuery(dom_element).append(this.dialog_html);
        var dialog_options = this.mergeOptions(options)
        jQuery(this.container).dialog(dialog_options);
        jQuery(this.container).dialog("widget").find(".ui-dialog-header").css({ border:0, padding:0 })
                                               .find(".ui-dialog-header").css({ display:"none" }).end();
        this.initialized = true;
        return this;
    },

    open: function(div_id) {
        if (typeof div_id === "string") { this.position(div_id); }
        jQuery(this.spinner).attr("class","wait");
        jQuery(this.container).dialog("open");
        this.isopen = true;
        return false;
    },

    mergeOptions: function(options) {
        var merged = jQuery.extend({}, DialogOptions);
        merged['appendTo'] = this.dialog_anchor;
        merged['dialogClass'] = this.dialog_class;
        merged["position"] = { my:"center center", at:"center center", of:this.center_on };
        if (typeof options !== 'undefined') {
            jQuery.each(options, function (key, value) {
                if (key == "center_on") { 
                    merged["position"] = { my: "center center", at: "center center", of: value };
                } else { merged[key] = value; }
            });
        }
        return merged;
    },

    position: function(div_id) {
        var position = { my: "center center", at: "center center", of: div_id }
        Dialog.center_on = div_id;
        jQuery(this.container).dialog("position", position);
    },
}

jQuery.fn.CsfToolSpinnerDialog = function(options) {
    var dom_element = this.get(0);
    var dialog = SpinnerDialog.create(dom_element, options);
    return dialog;
}

})(jQuery);

