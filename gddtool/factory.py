
import os

from atmosci.seasonal.factory import BaseProjectFactory
from atmosci.seasonal.methods.access import BasicFileAccessorMethods

from atmosci.utils.config import ConfigObject
from atmosci.utils.timeutils import daysInYear

from gddtool.history import GDDToolHistoryDataReader, \
                            GDDToolHistoryDataManager, \
                            GDDToolHistoryFileBuilder

from gddtool.target import GDDToolTargetYearReader, \
                           GDDToolTargetYearManager, \
                           GDDToolTargetYearBuilder


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from gddtool.config import CONFIG
from gddtool.registry import REGISTRY


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolFactoryMethods:

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def appDateFormat(self, date):
        return date.strftime('%Y-%m-%d')

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def gddThresholdAsString(self, gdd_threshold):
        if isinstance(gdd_threshold, (list,tuple)):
            return ''.join(['%02d' % th for th in gdd_threshold])
        elif isinstance(gdd_threshold, int):
            return '%02d' % gdd_threshold
        elif isinstance(gdd_threshold, basestring):
            return gdd_threshold
        else: return str(gdd_threshold)
        
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 
    def gddThresholdsAsStrings(self):
        gdd_thresholds = [ ]
        for threshold in self.config.project.gdd_thresholds:
            gdd_thresholds.append(self.gddThresholdAsString(threshold))
        return tuple(gdd_thresholds)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getFileAccessorClass(self, filetype, access_type):
        return self.AccessClasses[filetype][access_type]

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getFilenameTemplate(self, filetype, default=None):
        return self.config.filenames.get(filetype, default)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def normalizeFilename(self, name):
        _name = name.replace('_',' ').replace('-',' ').replace('.',' ')
        return _name.title().replace(' ','-')

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def normalizeDirpath(self, path):
        _path = path.replace(' ','_').replace('-','_').replace('.',os.sep)
        return os.path.normpath(_path)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def regionToDirpath(self, region):
        if isinstance(region, ConfigObject):
            path = region.get('tag', None)
            if path is not None: return path
            path = region.name
        else: path = region
        if len(path) in (1, 2): return path.upper()
        else: return self.normalizeDirpath(path)
    regionToFilepath = regionToDirpath

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def sourceToDirpath(self, source):
        if isinstance(source, ConfigObject):
            return self.normalizeDirpath(source.name.lower())
        return self.normalizeDirpath(source.lower())

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def sourceToFilepath(self, source):
        if isinstance(source, ConfigObject):
            return self.normalizeFilename(source.name)
        else: return self.normalizeFilename(source)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def toolDataDirpath(self, source, region, data_type=None):
        if isinstance(region, ConfigObject):
            region_dir = region.get('tag', None)
            if region_dir is None: region_dir = region.name
        else: region_dir = region
        if len(region_dir) in (1, 2): region_dir = region_dir.upper()

        if isinstance(source, ConfigObject):
            source_dir = source.get('subdir', None)
            if source_dir is None: source_dir = source.name.lower()
    
        path = os.path.join(self.config.dirpaths.tooldata,
                            self.normalizeDirpath(region_dir),
                            self.normalizeDirpath(source_dir))
        if data_type is not None:
            path = os.path.join(path, data_type.lower())
        return path


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolHistoryFactory(GDDToolFactoryMethods, BasicFileAccessorMethods,
                            BaseProjectFactory):

    def __init__(self, for_prod_builds=False):
        BaseProjectFactory.__init__(self, CONFIG, REGISTRY)
        if for_prod_builds:
            self.config.dirpaths.update(CONFIG.build.dirpaths.attrs)
        else: self.config.dirpaths.update(CONFIG.dev.dirpaths.attrs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # GDD history file accessors
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getHistoryFileBuilder(self, year, source, region, gdd_threshold,
                                  **kwargs):
        filepath = self.historyGridFilepath(year, source, region,
                                            gdd_threshold, **kwargs)
        return self.getGridFileBuilder(filepath, 'history', source, year,
                                       region, **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getHistoryFileManager(self, year, source, region, gdd_threshold,
                                  mode='r'):
        filepath = self.historyGridFilepath(year, source, region,
                                          gdd_threshold)
        return self.getGridFileManager(filepath, 'history', mode)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getHistoryFileReader(self, year, source, region, gdd_threshold):
        filepath = self.historyGridFilepath(year, source, region,
                                          gdd_threshold)
        return self.getGridFileReader(filepath, 'history')

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # GDD history directory and file paths
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def historyGridFilename(self, year, source, region, gdd_threshold,
                                **kwargs):
        threshold_str = self.gddThresholdAsString(gdd_threshold)
        template = self.getFilenameTemplate('history')
        template_args = dict(kwargs)
        template_args['threshold'] = threshold_str
        template_args['year'] = year
        return template % template_args

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def historyGridFilepath(self, year, source, region, gdd_threshold,
                                **kwargs):
        filename = self.historyGridFilename(year, source, region,
                                            gdd_threshold, **kwargs)
        history_dir = self.toolDataDirpath(source, region, 'history')
        if not os.path.exists(history_dir): os.makedirs(history_dir)
        return os.path.join(history_dir, filename)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _registerAccessClasses(self):
        self._registerAccessManagers('history', GDDToolHistoryDataReader,
                                                GDDToolHistoryDataManager,
                                                GDDToolHistoryFileBuilder)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolTargetYearFactory(GDDToolFactoryMethods, BasicFileAccessorMethods,
                               BaseProjectFactory):


    def __init__(self, for_prod_builds=False):
        BaseProjectFactory.__init__(self, CONFIG, REGISTRY)
        if for_prod_builds:
            self.config.dirpaths.update(CONFIG.build.dirpaths.attrs)
        else: self.config.dirpaths.update(CONFIG.dev.dirpaths.attrs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getSignificantDates(self, coverage, gdd_threshold):
        reader = \
            self.getTargetYearFileReader(self.season, self.source, self.region)
        dataset_path = reader.gddDatasetPath(coverage, gdd_threshold)
        dates = reader.getSignificantDates(dataset_path)
        reader.close()
        return dates

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getTargetYearFileBuilder(self, year, source, region=None, **kwargs):
        filepath = self.targetYearFilepath(year, source, region)
        return self.getGridFileBuilder(filepath, 'target', source, year,
                                       region, **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getTargetYearFileManager(self, year, source, region=None, mode='r'):
        filepath = self.targetYearFilepath(year, source, region)
        return self.getGridFileManager(filepath, 'target', mode)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getTargetYearFileReader(self, year, source, region=None):
        filepath = self.targetYearFilepath(year, source, region)
        return self.getGridFileReader(filepath, 'target')

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # GDD target year directory and file paths
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def targetYearFilename(self, year, source, region, **kwargs):
        template = self.getFilenameTemplate('target')
        template_args = dict(kwargs)
        template_args['region'] = self.regionToFilepath(region)
        template_args['source'] = self.sourceToFilepath(source)
        template_args['year'] = year
        return template % template_args

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def targetYearFilepath(self, year, source, region, **kwargs):
        filename = self.targetYearFilename(year, source, region, **kwargs)
        target_dir = self.toolDataDirpath(source, region, 'target')
        if not os.path.exists(target_dir): os.makedirs(target_dir)
        return os.path.join(target_dir, filename)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _registerAccessClasses(self):
        self._registerAccessManagers('target', GDDToolTargetYearReader,
                                               GDDToolTargetYearManager,
                                               GDDToolTargetYearBuilder)

