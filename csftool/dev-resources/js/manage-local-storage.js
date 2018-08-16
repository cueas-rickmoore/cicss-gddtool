
;(function(jQuery) {
console.log('loading manage-local-storage');

var basil = null

var StorageOptions = {
    namespace: null,
    expireDays: 3650,
}

var StorageManager = {

    initializeBasil: function() {
        // intialize basil using options from StorageOptions.
        // StorageOptions.namespace must be explicitly assigned an appropriate value, otherwise basil init is not performed.
        console.log('INSIDE StorageManager.initializeBasil');
        if (StorageOptions.namespace == null) {
            console.log('manage-local-storage : error : namespace must be explicitly assigned prior to basil initialization');
            return;
        }
        basil = new window.Basil(StorageOptions)
    },

    readLocationsFromLocalStorage: function() {
        // read all locations saved in storage.
        // returns locations as key-value pairs (id: location)
        console.log('INSIDE StorageManager.readLocationsFromLocalStorage');
        var data = {};
        var basil_keys = basil.keys();
        for (var i = 0; i < basil_keys.length; i++) {
            console.log(i);
            data[basil_keys[i]] = basil.get(basil_keys[i]);
        }
        return data;
    },

    writeLocationsToLocalStorage: function(data,selected) {
        // write all provided locations to storage.
        // data : key-value pairs (id : location) for all saved locations
        // selected : id of currently selected location
        console.log('INSIDE StorageManager.writeLocationsToLocalStorage');
        var basil_keys = basil.keys()
        var new_loc = null; old_loc = null;
        jQuery.each(data, function(id, loc) {
            if (id == selected) {
                loc['selected'] = 1
            } else {
                loc['selected'] = 0
            }
            if (jQuery.inArray(id,basil_keys) != -1) {
                // location already exists, so extend
                old_loc = basil.get(id);
                new_loc = jQuery.extend({},old_loc,loc);
                basil.set(id,new_loc);
            } else {
                // new location, just create
                basil.set(id,loc);
            }
        });
    },

    getIdsToDeleteFromLocalStorage: function(data) {
        // get array of location IDs to delete.
        // The returned ids array contains ids that are currently in local storage, but on in the context returned by the location picker.
        // In other words, the returned ids array contains location IDs that the user would like removed.
        // data : should be context.all_locations returned from the location picker
        var ids = []
        var basil_keys = basil.keys()
        var location_ids = Object.keys(data)
        jQuery.each(basil_keys, function(idx,id) {
            if (jQuery.inArray(id,location_ids) == -1) {
                ids.push(id);
            };
        });
        return ids
    },

    deleteLocationsFromLocalStorage: function(loc_ids) {
        // delete locations, keyed by given IDs, from local storage
        // loc_ids : array of location keys
        jQuery.each(loc_ids, function(idx,id) {
            basil.remove(id);
        });
    },

    updateLocationInLocalStorage: function(id,loc,expire) {
        // update location from one or more key-value pairs in loc
        // id : key of location
        // loc : key-value pair(s) to update for this id
        // expire : integer number of days before stored data will expire
        var old_loc = null; new_loc = null;
        old_loc = basil.get(id);
        new_loc = jQuery.extend({},old_loc,loc);
        basil.set(id, new_loc, {'expireDays':expire});
    },

    getSelectedID: function() {
        // get the currently selected ID (only the id associated with the selected location, without location key-value pairs)
        console.log('INSIDE StorageManager.getSelectedID');
        var selectedID = null;
        var data = this.readLocationsFromLocalStorage();
        var idArray = Object.keys(data);
        for (var i = 0; i < idArray.length; i++) {
            if (data[idArray[i]]['selected'] == 1) { selectedID = idArray[i] }
        }
        return selectedID;
    },

    getSelectedLocation: function() {
        // get the currently selected location (all key-value pairs for location)
        console.log('INSIDE StorageManager.getSelectedLocation');
        var selectedID = null;
        var data = this.readLocationsFromLocalStorage();
        var idArray = Object.keys(data);
        for (var i = 0; i < idArray.length; i++) {
            if (data[idArray[i]]['selected'] == 1) { selectedID = idArray[i] }
        }
        return data[selectedID];
    },

}

var jQueryStorageProxy = function() {
    if (arguments.length==1) {
        var arg_0 = arguments[0];
        switch(arg_0) {
            case "init": StorageManager.initializeBasil(); break;
            case "read": return StorageManager.readLocationsFromLocalStorage(); break;
            case "selected_id": return StorageManager.getSelectedID(); break;
            case "selected_loc": return StorageManager.getSelectedLocation(); break;
        }
    } else if (arguments.length==2) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        switch(arg_0) {
            case "namespace": StorageOptions.namespace = arg_1; break;
            case "expireDays": StorageOptions.expireDays = arg_1; break;
            case "getIdsToDelete": return StorageManager.getIdsToDeleteFromLocalStorage(arg_1); break;
            case "delete": StorageManager.deleteLocationsFromLocalStorage(arg_1); break;
        }
    } else if (arguments.length==3) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        var arg_2 = arguments[2];
        switch(arg_0) {
            case "write": console.log('write to storage'); StorageManager.writeLocationsToLocalStorage(arg_1,arg_2); break;
        }
    } else if (arguments.length==4) {
        var arg_0 = arguments[0];
        var arg_1 = arguments[1];
        var arg_2 = arguments[2];
        var arg_3 = arguments[3];
        switch(arg_0) {
            case "write": console.log('update storage'); StorageManager.updateLocationInLocalStorage(arg_1,arg_2,arg_3); break;
        }
    }
}

jQuery.fn.CsfToolManageLocalStorage = function(options) {
    if (typeof options !== 'undefined') {
        jQuery.each(options, function(key,value) {
            jQueryStorageProxy(key,value);
        });
    } else {
        return jQueryStorageProxy;
    }
}

})(jQuery);
