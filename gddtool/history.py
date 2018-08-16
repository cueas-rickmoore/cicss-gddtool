
from atmosci.hdf5.manager import Hdf5DateGridFileReader
from atmosci.hdf5.manager import Hdf5DateGridFileManager

from atmosci.seasonal.methods.builder import TimeGridFileBuildMethods
from atmosci.seasonal.methods.timegrid import TimeGridFileReaderMethods
from atmosci.seasonal.methods.timegrid import TimeGridFileManagerMethods

from gddapp.history.access import GDDHistoryFileReader

from gddtool.grid import GDDToolFileMethods


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolHistoryAccessMethods(GDDToolFileMethods):

   # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getGDDAtNode(self, coverage, extreme, start_date, end_date,
                           lon, lat, **kwargs):
        dataset_path = self.gddDatasetPath(coverage, extreme)
        data = self.getSliceAtNode(dataset_path, start_date, end_date,
                                   lon, lat, **kwargs)
        return data

   # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getExtremesAtNode(self, coverage, start_date, end_date, lon, lat,
                                **kwargs):
        extremes = { }
        for extreme in ("avg", "min", "max"):
            dataset_path = self.gddDatasetPath(coverage, extreme)
            extremes[extreme] = self.getSliceAtNode(dataset_path, start_date,
                                               end_date, lon, lat, **kwargs)
        return extremes


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolHistoryDataReader(GDDToolHistoryAccessMethods, 
                               TimeGridFileReaderMethods,
                               Hdf5DateGridFileReader):

    def __init__(self, filepath, registry):
        self._preInitProject_(registry)
        Hdf5DateGridFileReader.__init__(self, filepath)
        self._postInitProject_()

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def gddDatasetPath(self, coverage, extreme):
        return '%s.%s' % (coverage, extreme)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        Hdf5DateGridFileReader._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolHistoryDataManager(GDDToolHistoryAccessMethods,
                                TimeGridFileManagerMethods,
                                Hdf5DateGridFileManager):

    def __init__(self, filepath, registry, mode='r'):
        self._preInitProject_(registry)
        Hdf5DateGridFileManager.__init__(self, filepath, mode=mode)
        self._postInitProject_()

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def gddDatasetPath(self, coverage, extreme):
        return '%s.%s' % (coverage, extreme)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def updateExtremes(self, coverage, start_date, min_gdd, avg_gdd, max_gdd):
        template = "%s.%%s" % coverage
        self.refreshDataset(template % "avg", start_date, avg_gdd)
        self.refreshDataset(template % "max", start_date, max_gdd)
        self.refreshDataset(template % "min", start_date, min_gdd)


    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        Hdf5DateGridFileManager._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolHistoryFileBuilder(TimeGridFileBuildMethods,
                                GDDToolHistoryDataManager):

    def __init__(self, filepath, registry, project_config, filetype, source,
                       target_year, region, **kwargs):
        self.preInitBuilder(project_config, filetype, source, target_year,
                            region, **kwargs)
        GDDToolHistoryDataManager.__init__(self, filepath, registry, 'w')
        self.initFileAttributes(**kwargs)
        self.postInitBuilder(**kwargs)
        self.close()

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def updateDataset(self, dataset_path, start_time, data, **kwargs):
        self.open('a')
        GDDToolHistoryDataManager.updateDataset(self, dataset_path, start_time,
                                                    data, **kwargs)
        self.close()

    def updateExtremes(self, coverage, start_date, min_gdd, avg_gdd, max_gdd):
        self.open('a')
        GDDToolHistoryDataManager.updateExtremes(self, coverage, start_date,
                                               min_gdd, avg_gdd, max_gdd)
        self.close()

    def updateProvenance(self, dataset_path, start_time, *data, **kwargs):
        self.open('a')
        GDDToolHistoryDataManager.updateProvenance(self, dataset_path, start_time,
                                                       *data, **kwargs)
        self.close()

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _getDatasetConfig(self, dataset_key, **kwargs):
        descrip_dict = { }
        name, dataset, keys = \
            TimeGridFileBuildMethods._getDatasetConfig(self, dataset_key)

        if 'timespan' in kwargs: timespan = kwargs['timespan']
        elif 'timespan' in dataset: timespan = dataset.timespan 
        else: timespan = None
        if timespan:
            if name in self.config.project.scopes:
                scope = self.config.project.scopes[name]
                descrip_dict['timespan'] = '%s %s' % (timespan, scope)
            else: descrip_dict['timespan'] = timespan

        if "coverage" in kwargs:
            coverage = kwargs['coverage']
        elif "coverage" in dataset: coverage = dataset.coverage
        else: coverage = None
        if coverage: descrip_dict['coverage'] = coverage

        if "threshold" in kwargs:
            threshold = kwargs['threshold']
        elif "threshold" in dataset: threshold = dataset.threshold
        else: threshold = None
        if threshold: descrip_dict['threshold'] = threshold

        if descrip_dict:
            dataset.description = dataset.description % descrip_dict

        return name, dataset, keys

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        GDDToolHistoryDataManager._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()

