""" Classes for accessing  and managing data in Hdf5 encoded grid files.
"""

import os
from datetime import datetime

import h5py
import numpy as N
from atmosci.utils.data import safedict, dictToWhere, listToWhere
from atmosci.utils.timeutils import asDatetime

from atmosci.hdf5.mixin import Hdf5DataReaderMixin, Hdf5DataWriterMixin

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from atmosci.hdf5.mixin import BOGUS_VALUE

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class Hdf5FileReader(Hdf5DataReaderMixin, object):
    """ Provides read-only access to datasets, groups and other obsects in
    Hdf5-encoded files.
    """

    def __init__(self, hdf5_filepath):
        self.__hdf5_file = None
        self.__hdf5_filepath = None
        self.__hdf5_filemode = None

        self._dataset_names = None
        self._group_names = None
        self._packers = { }
        self._unpackers = { }

        if not hasattr(self, '_access_authority'):
            self._access_authority = ('r',)
            self._open_(hdf5_filepath, 'r')


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # properties - access to protected and private attributes
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    @property
    def dataset_names(self):
        if self._dataset_names is None:
            self.assertFileOpen('Attempt to list dataset names failed.')
            self._dataset_names = self.listDatasetsIn('__file__')
        return self._dataset_names

    @property
    def group_names(self):
        if self._group_names is None:
            self.assertFileOpen('Attempt to list group names failed.')
            self.group_names = self.listGroupsIn('__file__')
        return self._group_names

    @property
    def file(self):
        return self.__hdf5_file

    @property
    def filepath(self):
        return self.__hdf5_filepath

    @property
    def filemode(self):
        return self.__hdf5_filemode

    @property
    def unpackers(self):
        return self._unpackers


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # accessability
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def assertFileOpen(self, reason=None):
        if self.__hdf5_file is None:
            errmsg = 'Hdf5 file is not open : %s' % self.filepath
            if reason is not None:
                errmsg = '%s\n%s' % (reason, errmsg)
            raise IOError, errmsg

    def isOpen(self):
        return self.__hdf5_file is not None


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def assertFileWritable(self):
        raise IOError, 'Hdf5 file is read only : %s' % self.filepath

    def isWritable(self):
        return self.filemode in ('a','w')


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    #
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def copy(self, to_object, *object_names, **kwargs):
        mangled_attr = self._mangle_('__hdf5_file', to_object)
        if hasattr(to_object, mangled_attr):
            to_object.assertFileWritable()
            self._writeToFile(to_object.file, *object_names, **kwargs)
        elif isinstance(to_object, h5py._hl.files.File):
            if to_object == self.file:
                errmsg = 'Attempting to copy objects to READ ONLY file : %s'
                raise IOError, errmsg % self.filepath
            self._writeToFile(to_object, *object_names, **kwargs)
        elif hasattr(to_object, 'file'):
            if to_object.file == self.file:
                errmsg = 'Attempting to copy objects to READ ONLY file : %s'
                raise IOError, errmsg % self.filepath
            expand_refs = kwargs.get('expand_refs', False)
            if object_names:
                for object_name in object_names:
                    obj_name = object_name.replace('.','/')
                    self.file.copy(obj_name, to_object)
            else: # none specified, copy all contained objects
                for obj_name in self.file.keys():
                    self.file.copy(obj_name, to_object)
        else:
            ermsg = 'Invalid type for "to_object" : %s' % type(to_object)
            raise TypeError, errmsg


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def dotPaths(self, obj_keys):
        paths = [self.dotPath(key) for key in obj_keys]
        paths.sort()
        if isinstance(obj_keys, tuple): return tuple(paths)
        else: return paths

    def dotPath(self, key):
        if key.startswith('/'): return key[1:].replace('/','.')
        return key.replace('/','.')


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getData(self, dataset_name, **kwargs):
        self.assertFileOpen()
        data = self._getData_(self.file, dataset_name, **kwargs)
        return self._processDataOut(dataset_name, data, **kwargs)

    def getDataWhere(self, dataset_name, criteria=None, **kwatgs):
        datasets = [ ]
        if criteria:
            indexes = self._where(criteria)
            if indexes and len(indexes[0]) > 0:
                return self.getData(dataset_name, indexes=indexes, **kwargs)
            else:
                errmsg = 'No entries meet search criteria : %s'
                raise ValueError, errmsg % str(criteria)
        return self.getData(dataset_name, **kwargs)


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def datasetExists(self, dataset_name):
        return dataset_name in self._dataset_names
    hasDataset = datasetExists

    def datasetExistsIn(self, dataset_name, parent_name):
        if parent_name == '__file__':
            return dataset_name in self._dataset_names
        else:
            self.assertFileOpen()
            return datast_name in self._getDatasetKeys_(parent_name)

    def datasetHasAttribute(self, dataset_name, attr_name):
        self.assertFileOpen()
        dataset_attrs = self._getDatasetAttributes_(self.file, dataset_name)
        return attr_name in dataset_attrs.keys()
    datasetHasAttr = datasetHasAttribute

    def getDataset(self, dataset_name):
        self.assertFileOpen()
        return self._getDataset_(self.file, dataset_name)

    def getDatasetAttribute(self, dataset_name, attr_name, default=BOGUS_VALUE):
        self.assertFileOpen()
        parent = self.file
        attr_value = self._getDatasetAttribute_(parent, dataset_name, 
                                                attr_name, default)
        return attr_value

    def getDatasetAttributes(self, dataset_name):
        self.assertFileOpen()
        return self._getDatasetAttributes_(self.file, dataset_name)
    getDatasetAttrs = getDatasetAttributes

    def getDatasetShape(self, dataset_name):
        return self.getDataset(dataset_name).shape

    def getDatasetType(self, dataset_name):
        return self.getDataset(dataset_name).dtype

    def listDatasets(self):
        return self.listDatasetsIn('__file__')

    def listDatasetsIn(self, parent_name):
        self.assertFileOpen()
        if parent_name == '__file__': _object = self.file
        else: _object = self._getObject_(self.file, parent_name)
        keys = [ self.dotPath(key) for key in self._getObjectKeys_(_object)
                                   if isinstance(_object[key], h5py.Dataset) ]
        return list(keys)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def close(self):
        mangled_attr = self._mangle_('__hdf5_file')
        if hasattr(self, mangled_attr) and self.file is not None:
            self._clearManagerAttributes_()
            self._close_(self.file)
        self.__hdf5_file = None
        self.__hdf5_filemode = None

    def fileHasAttribute(self, attr_name):
        self.assertFileOpen()
        return attr_name in self._getFileAttributes_(self.file).keys()
    fileHasAttr = fileHasAttribute

    def getFileAttribute(self, attr_name, default=BOGUS_VALUE):
        self.assertFileOpen()
        return self._getFileAttribute_(self.file, attr_name, default)

    def getFileAttributes(self):
        self.assertFileOpen()
        return self._getFileAttributes_(self.file)

    def getFileHierarchy(self, grouped=False):
        if grouped:
            groups, datasets =\
            self._getObjectHierarchy_(self.file, '.', True)
            return (tuple(groups), tuple(datasets))
        else:
            return tuple(self._getObjectHierarchy_(self.file, '.'))

    def open(self, mode='r'):
        if mode not in self._access_authority:
            errmsg = "'%s' is not in list of modes allowed by this manager."
            raise ValueError, errmsg % mode
        mangled_attr = self._mangle_('__hdf5_filemode')
        if hasattr(self, 'mangled_attr') and self.filemode != mode:
            self.close()
        if self.file is None:
            self._open_(self.filepath, mode)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getGroup(self, group_name):
        self.assertFileOpen()
        _object = self._getGroup_(self.file, group_name)
        return _object

    def getGroupAttribute(self, group_name, attr_name, default=BOGUS_VALUE):
        self.assertFileOpen()
        attr_value = self._getGroupAttribute_(self.file, group_name,
                                              attr_name, default)
        return attr_value 

    def getGroupAttributes(self, group_name):
        self.assertFileOpen()
        return self._getGroupAttributes_(self.file, group_name)

    def groupExists(self, group_name, parent_name=None):
        if parent_name in('__file__', None):
            return group_name in self._group_names
        else: return group_name in self.listGroupsIn(parent_name)
    hasGroup = groupExists

    def groupHasAttribute(self, group_name, attr_name):
        self.assertFileOpen()
        group_attrs = self._getGroupAttributes_(self.file, group_name)
        return attr_name in group_attrs.keys()
    groupHasAttr = groupHasAttribute

    def getGroupHierarchy(self, group_name):
        _object = self.getGroup(group_name)
        return tuple(self._getObjectHierarchy_(_object, '.'))

    def listGroups(self):
        return self.listGroupsIn('__file__')

    def listGroupsIn(self, parent_name):
        self.assertFileOpen()
        if parent_name == '__file__': _object = self.file
        else: _object = self._getObject_(self.file, parent_name)
        keys = [ self.dotPath(key) for key in self._getObjectKeys_(_object)
                                   if isinstance(_object[key], h5py.Group) ]
        return list(keys)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getObject(self, object_name):
        self.assertFileOpen()
        if object_name.lower() == '__file__': return self.file
        return self._getObject_(self.file, object_name)

    def getObjectAttribute(self, object_name, attr_name, default=BOGUS_VALUE):
        self.assertFileOpen()
        attr_value = self._getObjectAttribute_(self.getObject(object_name),
                                               attr_name, default)
        return attr_value 

    def getObjectAttributes(self, object_name):
        self.assertFileOpen()
        return self._getObjectAttributes_(self.getObject(object_name))

    def getObjectHierarchy(self, object_name):
        _object = self.getObject(object_name)
        return tuple(self._getObjectHierarchy_(_object, '.'))

    def getObjectShape(self, object_name):
        self.assertFileOpen()
        return self._getObjectShape_(self.getObject(object_name))

    def objectExists(self, object_name, parent_name=None):
        return object_name in self.listObjects(parent_name)

    def listObjects(self):
        return self.listObjectsIn('__file__')

    def listObjectsIn(self, parent_name=None):
        self.assertFileOpen()
        if parent_name == '__file__': _object = self.file
        else: _object = self.getObject(self.file, parent_name)
        return list(self.dotPaths(self._getObjectKeys_(_object)))

    def objectHasAttribute(self, object_name, attr_name):
        self.assertFileOpen()
        object_attrs = self._getObjectAttributes_(self.getObject(object_name))
        return attr_name in object_attrs.keys()
    objectHasAttr = objectHasAttribute


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def registerDataPacker(dataset_name, function):
        self._packers[dataset_name] = function

    def registerDataUnpacker(dataset_name, function):
        self._unpackers[dataset_name] = function


    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _dotPathToHdf5Path(self, path):
        return '/%s' % key.replace('.','/')


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _objectToFile(self, obj):
        if '.' in object_path: names = object_path.split('.')
        elif '/' in object_path:
            if object_path[0] == '/': return self.file
            names = path.split('/')
            return object_name, self._getObject_(root_object, parent_path)


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _pathToNameAndParent(self, root_object, object_key):
        dot = object_key.rfind('.')
        if dot < 0: dot = object_key.rfind('/')

        if dot < 0: return object_key, root_object
        else:
            parent_path = object_key[:dot]
            object_name = object_key[dot+1:]
            return object_name, self._getObject_(root_object, parent_path)


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _processDataOut(self, dataset_name, data, **kwargs):
        if kwargs.get('raw', False): return data
        data = self._unpackData(dataset_name, data, **kwargs)
        return self._postUnpack(dataset_name, data, **kwargs)

    def _getUnpacker(self, dataset_name):
        return self.unpackers.get(dataset_name,
                                  self.unpackers.get('default', None))

    def _postUnpack(self, dataset_name, data, **kwargs):
        return data

    def _unpackData(self, dataset_name, data, **kwargs):
        unpack = self._getUnpacker(dataset_name)
        if unpack is None: return data
        else: return unpack(data)


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _where(self, criteria):
        if criteria:
            errmsg = 'Key for filter criteria is not a valid dataset name : %s'
            where = None
            constraint_data = { }
            dataset_names = self.allDatasetNames()

            if isinstance(criteria, dict):
                for key, constraint in criteria.items():
                    if constraint is None: continue
                    if key in dataset_names:
                        if key not in constraint_data:
                            constraint_data[key] = self.getData(key)
                    else: raise KeyError, errmsg % key
                if constraint_data:
                    where = dictToWhere(criteria)

            elif isinstance(criteria, (list,tuple)):
                for rule in criteria:
                    key = rule[0]
                    if key in dataset_names:
                        if key not in constraint_data:
                            constraint_data[key] = self.getData(key)
                    else: raise KeyError, errmsg % key
                if constraint_data:
                    where = listToWhere(criteria)

            if where is not None:
                return eval(where, globals(), constraint_data)

        return None


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _writeToFile(self, to_file, *object_names, **kwargs):
        if to_file.mode != 'r':
            expand_refs = kwargs.get('expand_refs', False)
            if object_names:
                for obj_name in object_names:
                    to_file.copy(self.file[obj_name], obj_name)
            else: # none specified, copy all contained objects
                for obj_name, obj in self.file.items():
                    to_file.copy(obj, obj_name)
        else:
            errmsg = 'Attempting to copy objects to READ ONLY file : %s'
            raise IOError, errmsg % to_file.filename


    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _mangle_(self, attr_name, instance=None):
        if instance is not None:
            return '%s%s' % (instance.__class__.__name__, attr_name)
        else: return '%s%s' % (self.__class__.__name__, attr_name)

    def _clearManagerAttributes_(self):
        pass

    def _loadManagerAttributes_(self):
        self.assertFileOpen()
        groups, datasets = self.getFileHierarchy(grouped=True)
        self._dataset_names = list(datasets)
        self._group_names = list(groups)
        attributes = self.getFileAttributes()
        for attr_name, attr_value in attributes.items():
            if attr_name in ('created', 'updated'):
                try:
                    self.__dict__[attr_name] = asDatetime(attr_value)
                except:
                    self.__dict__[attr_name] = attr_value
            else: self.__dict__[attr_name] = attr_value

    def _open_(self, filepath, mode, load=True):
        self.__hdf5_file = self._openFile_(filepath, mode)
        self.__hdf5_filepath = filepath
        self.__hdf5_filemode = mode
        self._loadManagerAttributes_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class Hdf5FileManager(Hdf5DataWriterMixin, Hdf5FileReader):
    """ Provides read/write access to datasets, groups and other obsects
    in Hdf5-encoded files.
    """

    def __init__(self, hdf5_filepath, mode='r', **kwargs):

        if not hasattr(self, '_access_authority'):
            self._access_authority = ('r','a')
            if mode not in self._access_authority:
                errmsg = "'%s' is not in list of modes allowed by this manager."
                raise ValueError, errmsg % mode
        Hdf5FileReader.__init__(self, hdf5_filepath)
        self._open_(hdf5_filepath, mode)


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # properties - access to protected and private attributes
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    @property
    def packers(self):
        return self._packers


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def copy(self, object_path, to_object):
        if isinstance(to_object, basestring):
            self.assertFileWritable()
            self.file.copy(object_path, self.getObject(to_object))
        else:
            self.file.copy(object_path, to_object)

    def move(self, from_path, to_path):
        self.assertFileWritable()
        name, parent = self._pathToNameAndParent(self.file, from_path)

        dest_path = '/%s' % to_path.replace('.','/')
        parent.move(name, dest_path)


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def createDataset(self, dataset_name, numpy_array, **kwargs):
        self.assertFileWritable()

        name, parent = self._pathToNameAndParent(self.file, dataset_name)
        self._createEmptyDataset_(parent, name, numpy_array.shape, 
                                  numpy_array.dtype, **kwargs)
        self._registerDatasetName(dataset_name)
        dataset = self._updateDataset_(parent, name, 
                      self._processDataIn(dataset_name, numpy_array, **kwargs), 
                      {}, update_timestamp=False, **kwargs)
        return dataset

    def createEmptyDataset(self, dataset_name, shape, dtype, fill_value=None,
                                 **kwargs):
        self.assertFileWritable()

        kwargs['dtype'] = dtype 
        if 'fillvalue' is not None:
            kwargs['fillvalue']  = fill_value

        name, parent = self._pathToNameAndParent(self.file, dataset_name)
        dataset = self._createDataset_(parent, name, shape, **kwargs)
        self._registerDatasetName(dataset)
        return dataset

    def createExtensibleDataset(self, dataset_name, initial_shape, max_shape,
                                      dtype, fill_value, **kwargs):
        self.assertFileWritable()

        kwargs['dtype'] = dtype 
        kwargs['fillvalue']  = fill_value
        kwargs['maxshape'] = max_shape

        name, parent = self._pathToNameAndParent(self.file, dataset_name)
        dataset = self._createDataset_(parent, name, initial_shape, **kwargs)
        self._registerDatasetName(dataset)
        return dataset


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def replaceDataset(self, dataset_name, data, attributes):
        self.deleteDataset(dataset_name)
        attributes['updated'] = self._timestamp_()
        self.createDataset(dataset_name, data, attributes)

    def resizeDataset(self, dataset_name, max_index):
        self.assertFileOpen()
        dataset = self.getDataset(dataset_name)
        old_shape = self.file[dataset_name].shape
        new_size = (max_index,) + old_shape[1:]
        self.file[dataset_name].resize(new_size)

    def updateDataset(self, dataset_name, numpy_array, attributes={}, **kwargs):
        self.assertFileWritable()
        
        name, parent = self._pathToNameAndParent(self.file, dataset_name)
        if name in self.dataset_names:
            dataset = self._updateDataset_(parent, name, 
                      self._processDataIn(dataset_name, numpy_array, **kwargs), 
                                          attributes, **kwargs)
        else:
            dataset = self.createDataset(dataset_name, numpy_array,
                                         **attributes)
        return dataset


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def deleteDataset(self, dataset_name):
        self.assertFileWritable()
        self._deleteDataset_(self.file, dataset_name, attr_name)

    def deleteDatasetAttribute(self, dataset_name, attr_name):
        self.assertFileWritable()
        self._deleteDatasetAttribute_(self.file, dataset_name, attr_name)

    def setDatasetAttribute(self, dataset_name, attr_name, attr_value):
        self.assertFileWritable()
        self._setDatasetAttribute_(self.file, dataset_name,
                                  attr_name, attr_value)

    def setDatasetAttributes(self, dataset_name, **kwargs):
        self.assertFileWritable()
        self._setDatasetAttributes_(self.file, dataset_name, kwargs)


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def assertFileWritable(self):
        if self.file is None:
            raise IOError, 'Hdf5 file is not open : %s' % self.filepath
        if self.filemode not in ('w','a'): 
            raise IOError, 'Hdf5 file is not writable : %s' % self.filepath

    def deleteFileAttribute(self, attr_name):
        self.assertFileWritable()
        self._deleteFileAttribute_(self.file, attr_name)

    def setFileAttribute(self, attr_name, attr_value):
        self.assertFileWritable()
        self._setFileAttribute_(self.file, attr_name, attr_value)

    def setFileAttributes(self, **kwargs):
        self.assertFileWritable()
        for attr_name, attr_value in kwargs.items():
            self._setFileAttribute_(self.file, attr_name, attr_value)


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def createGroup(self, group_name, **attributes):
        """ Creates a new group in the parent and returns a pointer to
        it. Raises IOError exception if the group already exists.
        """
        self.assertFileWritable()

        attrs = safedict(attributes)
        if 'created' not in attrs:
            attrs['created'] = self._timestamp_()

        name, parent = self._pathToNameAndParent(self.file, group_name)
        if name in parent.keys():
            errmsg = "'%s' group already exists in current data file."
            raise IOError, errmsg % group_name

        group = self._createGroup_(parent, name, **attrs)
        self._registerGroupName(group)
        return group


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def deleteGroup(self, group_name):
        self.assertFileWritable()
        self._deleteGroup_(self.file, group_name)

    def deleteGroupAttribute(self, group_name, attr_name):
        self.assertFileWritable()
        group = self.getGroup(group_name)
        self._deleteGroupAttribute_(self.file, group_name, attr_name)

    def setGroupAttribute(self, group_name, attr_name, attr_value):
        self.assertFileWritable()
        self._setGroupAttribute_(self.file, group_name, attr_name,
                                  attr_value)

    def setGroupAttributes(self, group_name, **kwargs):
        self.assertFileWritable()
        self._setGroupAttributes_(self.file, group_name, kwargs)


    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def deleteObject(self, object_name):
        self.assertFileWritable()
        name, parent = self._pathToNameAndParent(self.file, dataset_name)
        self._deleteObject_(parent, object_name)

    def deleteObjectAttribute(self, object_name, attr_name):
        self._deleteObjectAttribute_(self.getObject(object_name), attr_name)

    def setObjectAttribute(self, object_name, attr_name, attr_value):
        self.assertFileWritable()
        _object = self.getObject(object_name)
        self._setObjectAttribute_(_object, attr_name, attr_value)

    def setObjectAttributes(self, object_name, **kwargs):
        self.assertFileWritable()
        self._setObjectAttributes_(self.getObject(object_name), kwargs)


    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _processDataIn(self, dataset_name, data, **kwargs):
        data = self._prePack(dataset_name, data, **kwargs)
        return self._packData(dataset_name, data, **kwargs)

    def _getPacker(self, dataset_name):
        return self.packers.get(dataset_name,
                                self.packers.get('default', None))

    def _packData(self, dataset_name, data, **kwargs):
        pack = self._getPacker(dataset_name)
        if pack is None: return data
        else: return pack(data)

    def _prePack(self, dataset_name, data, **kwargs):
        return data


    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _registerDatasetName(self, dataset):
        if isinstance(dataset, h5py.Dataset):
            path = self.dotPath(dataset.name)
        elif isinstance(dataset, basestring):
            path = dataset
        else:
            errmsg = 'Invalid type for "dataset" argumnent : %s'
            raise TypeError, errmsg % type(dataset)
        if path not in self._dataset_names:
            names = list(self._dataset_names)
            names.append(path)
            names.sort()
            self._dataset_names = tuple(names)

    def _registerGroupName(self, group):
        if isinstance(group, h5py.Group):
            path = self.dotPath(group.name)
            if path not in self._group_names:
                names = list(self._group_names)
                names.append(path)
                names.sort()
                self._group_names = tuple(names)
        else:
            errmsg = 'Invalid type for "group" argumnent : %s'
            raise TypeError, errmsg % type(group)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class Hdf5FileBuilder(Hdf5FileManager):
    """ Provides read/write access to datasets, groups and other obsects
    in Hdf5-encoded files.
    """

    def __init__(self, hdf5_filepath, mode='w'):
        self._access_authority = ('r','a','w')
        if mode not in self._access_authority:
            errmsg = "'%s' is not in list of modes allowed by this manager."
            raise ValueError, errmsg % mode

        Hdf5FileManager.__init__(self, hdf5_filepath, mode)

        self.setFileAttribute('created', self.timestamp)
        self.close()
        self.open(mode='a')

