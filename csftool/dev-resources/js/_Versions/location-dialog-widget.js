
;( function(jQuery) {
    jQuery.widget("csftools.locationDialog", jQuery.ui.dialog, {

        options: { draggable:true, height:750, width:750, },

        // INFORMATION

        anchors: { centerAnchor:"#csftool-content",
                   contentAnchor:"#csftool-location-dialog-content",
                   dialogAnchor:"#csftool-location-dialog",
                   cancelButtonId:"csftool-location-cancel",
                   deleteButtonId:"csftool-location-delete",
                   saveButtonId:"csftool-location-save",
                 },

        locations: { "default": { description:"Cornell University, Ithaca, NY", lat:42.45, lon:-76.48 }, },
        selected: "default",

        // FUNCTIONS

        anchor: function(key, value) { // make anchor access/update behave like options
            if (arguments.length === 0) { // return all anchors
                return jQuery.widget.extend( { }, this.anchors);
            }
            if (typeof key === "string") {
                if (arguments.length === 1) { // return value of anchor
                    return this.anchors[key] === undefined ? null : this.anchors[key];
                } else { this._setAnchor(key, value) } // set value for anchor
            } else { this._setAnchors(key); }
            return this;
        },

        dialogHtml: function () {
            return ['<div id="csftool-location-dialog-content">',
                    '<div class="dialog">',
                    '<div id="csftool-location-data">',
                    '<div id="csftool-location-coords">',
                    '<label class="dialog-label">Name :</label>',
                    '<input type="text" id="csftool-location-name" class="dialog-text">',
                    '<label class="dialog-label dialog-coord">Lat :</label>',
                    '<input id="csftool-location-lat" class="dialog-text dialog-coord" type="text">',
                    '<label class="dialog-label dialog-coord">Long :</label>',
                    '<input id="csftool-location-lon" class="dialog-text dialog-coord" type="text">',
                    '</div>',
                    '<div id="csftool-location-description"><label class="dialog-label">Place :</label>',
                    '<input type="text" id="csftool-location-address" class="dialog-text"> </div>',
                    '</div> <!-- close csftool-location-data -->',
                    '<div id="csftool-location-map"> </div>',
                    '</div> <!-- end of dialog -->',
                    '</div> <!-- end of csftool-location-dialog-content -->'].join('');
        },

        location: function(name, full_location) {
            // accepts zero or 1 argument -- if one argument, it must be a full location object
            if (arguments.length === 0) { // return all locations
                return jQuery.widget.extend( { }, this.locations); // return a copy !!!
            } else if (arguments.length === 1) { // return one location
                return this.locations[key] === undefined ? null : this.locations[key];
            } else if (arguments.length === 2) { // change the location
                // TODO: short cut to change the "current" location using the name of another location
                return this._setLocation(name, full_location);
            } else { return false; } // did not follow the rules
        },

        open: function () {
            // TODO: overide to capture actual ui.dialog instance ... probably do not subclass ui.dialog
            this._super()
        },

        // "PROTECTED" FUNCTIONS

        _create: function () {
            this.anchors.extend(this._anchors());
            jQuery(this.anchor("dialogAnchor")).html(this.dialogHtml());
            this._super()
        },

        _isValidAnchor: function(anchor_key) { return true; }

        _isValidLocationAttr: function(attr_name) { return true; }

        _setAnchor: function(key, value) { // TODO: check for valid values
            if (this._isValidAnchor(key)) { this.anchors[key] = value; }
            return this;
        },

        _setAnchors: function(anchors) {
            var key;
            for (key in anchors) { this._setAnchor(key, anchors[key]); }
            return this;
        },

        _setLocation: function(key, full_location) { // TODO: fail if the location is incomplete
            var attr_name;
            // TODO: check to see if name is in list of locations
            // if not, the locatio n must be complete, otherwise
            // allow change to subset of attributes
            for (attr_name in full_location) {
                if (this._isValidLocationAttr(attr_name)) { this.location[name][attr] = full_location[attr]); }
            return this;
        },


} ) (jQuery);



// NEED TO FINISH --- create instance


CsfToolLocationDialog.prototype.createDialogInstance = function() {
    console.log("CsfToolLocationDialog.createDialogInstance() was called : " + jQuery(this));
    console.log ("this _state_ : " + this._state_);
    console.log("this name : " + this.name);
    console.log("dialogAnchor : " + this.dailogAnchor);
    console.log("this dialogHtml : " + this.dialogHtml);
    jQuery(this.dialogAnchor).html(this.dialogHtml());
    console.log("dialogAnchor : " + this.dailogAnchor);
    console.log("saveButtonId : " + this.saveButtonId);
    jQuery(this.contentAnchor).dialog( { modal:true,
           minHeight:this.height, minWidth:this.width, autoOpen:false,
           appendTo: this.dialogAnchor,
           title:"Location Selection Dialog",
           position: { my: "center center", at: "center center", of: this.centerAnchor },
           buttons: { 
               Cancel: { id: this.cancelButtonId, text:"Cancel", click: function () {
                   console.log("CANCEL button clicked");
                   console.log("contentAnchor", this.contentAnchor);
                   console.log("contentAnchor div", jQuery(this.contentAnchor));
                   jQuery(this.contentAnchor).dialog("close");
               } },
               Delete: { id: this.deleteButtonId, text:"Delete", click: function () { console.log("DELETE button clicked"); } },
               Save: { id: this.saveButtonId, text:"Save", click: function () { console.log("SAVE button clicked"); } },
               }
           });
    return this;
}

CsfToolLocationDialog.prototype.show = function() { 
    console.log("CsfToolLocationDialog.show() was called");
    jQuery(this.contentAnchor).dialog("open");
    return false;
}

