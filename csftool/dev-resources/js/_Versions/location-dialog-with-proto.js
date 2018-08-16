
CsfToolLocationDialog = function (name, description, lat, lon) {
    console.log("creating instance of CsfToolLocationDialog");
    this._state_ = this.initDefaultState();
    typeof description !== 'undefined' ? this._state_["description"] = description : 0;
    typeof lat !== 'undefined' ? this._state_["lat"] = lat : 0 ;
    typeof lon !== 'undefined' ? this._state_["lon"] = lon : 0;
    typeof name !== 'undefined' ? this._state_["name"] = name : 0;

    Object.defineProperty(CsfToolLocationDialog.prototype, "centerAnchor", { configurable:false, enumerable:false, get:function() { return this._state_['centerAnchor']; }, });
    Object.defineProperty(CsfToolLocationDialog.prototype, "contentAnchor", { configurable:false, enumerable:false, get:function() { return this._state_['contentAnchor']; }, });
    Object.defineProperty(CsfToolLocationDialog.prototype, "dialogAnchor", { configurable:false, enumerable:false, get:function() { return this._state_['dialogAnchor']; }, });
    Object.defineProperty(CsfToolLocationDialog.prototype, "height", { configurable:false, enumerable:false, get:function() { return this._state_['height']; }, });
    Object.defineProperty(CsfToolLocationDialog.prototype, "width", { configurable:false, enumerable:false, get:function() { return this._state_['width']; }, });

    Object.defineProperty(CsfToolLocationDialog.prototype, "description", { configurable:false, enumerable:false, get:function() { return this._state_['description']; }, });
    Object.defineProperty(CsfToolLocationDialog.prototype, "lat", { configurable:false, enumerable:false, get:function() { return this._state_['lat']; }, });
    Object.defineProperty(CsfToolLocationDialog.prototype, "lon", { configurable:false, enumerable:false, get:function() { return this._state_['lon']; }, });
    Object.defineProperty(CsfToolLocationDialog.prototype, "name", { configurable:false, enumerable:false, get:function() { return this._state_['name']; }, });
}

CsfToolLocationDialog.prototype.dialogHtml = function() {
    return ['<div id="csftool-location-dialog-content">',
            '<div class="dialog ">',
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
}

CsfToolLocationDialog.prototype.initDefaultState = function() {
    return { contentAnchor:"#csftool-location-dialog-content", centerAnchor:"#csftool-content",
             dialogAnchor:"#csftool-location-dialog", height:750, width:750,
             cancelButtonId:"csftool-location-cancel", deleteButtonId:"csftool-location-delete",
             saveButtonId:"csftool-location-save",
             description:"Cornell University, Ithaca, NY", lat:42.45, lon:-76.48, name:"default" }
}

CsfToolLocationDialog.prototype.setDialogAttrs = function(dialogAnchor, contentAnchor, centerAnchor, height, width) {
    typeof centerAnchor !== 'undefined' ? this._state_["centerAnchor"] = centerAnchor : 0;
    typeof contentAnchor !== 'undefined' ? this._state_["contentAnchor"] = contentAnchor : 0;
    typeof dialogAnchor !== 'undefined' ? this._state_["dialogAnchor"] = dialogAnchor : 0;
    typeof height !== 'undefined' ? this._state_["height"] = height : 0;
    typeof width !== 'undefined' ? this._state_["width"] = width : 0;
}

CsfToolLocationDialog.prototype.setLocation = function(name, description, lat, lon) {
    typeof description !== 'undefined' ? this._state_["description"] = description : 0;
    typeof lat !== 'undefined' ? this._state_["lat"] = lat : 0;
    typeof lon !== 'undefined' ? this._state_["lon"] = lon : 0;
    typeof name !== 'undefined' ? this._state_["name"] = name : 0;
}

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

