    function insertLocationDialogHtml(dom_element, dialog_html) {
    }

    function locationDialogHtml() {
        return [
            '<div id="csftool-location-dialog">',
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

function initCsfLocationDialog(dialog_container, height, width) {
    var it = jQuery(dialog_container).html(locationDialogHtml());
    console.log("initCsfLocationDialog : " + it);
    height = typeof height !== 'undefined' ? height : 750;
    width = typeof width !== 'undefined' ? width : 750;
    jQuery("#csftool-location-dialog").dialog( { modal:true,
           minHeight:height, minWidth:width, autoOpen:false,
           appendTo: "#csftool-location-dialog-content",
           title:"Location Selection Dialog",
           position: { my: "center center", at: "center center", of: "#csftool-content" },
           buttons: { 
               Cancel: { id: "csftool-location-cancel", text:"Cancel", click: function () { $(this).dialog("close"); } },
               SaveAs: { id: "csftool-location-saveas", text:"Save As", click: function () { console.log("SAVE AS button clicked"); } },
               Save: { id: "csftool-location-save", text:"Save", click: function () { console.log("SAVE button clicked"); } },
               }
           });
}

function showCsfLocationDialog() { 
    console.log("showCsfLocationDialog was called");
    jQuery("#csftool-location-dialog").dialog("open");
    return false;
}

