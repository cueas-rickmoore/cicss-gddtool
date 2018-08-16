
from atmosci.hdf5.manager import Hdf5DateGridFileReader
from atmosci.hdf5.manager import Hdf5DateGridFileManager

from atmosci.seasonal.methods.builder import TimeGridFileBuildMethods
from atmosci.seasonal.methods.timegrid import TimeGridFileReaderMethods
from atmosci.seasonal.methods.timegrid import TimeGridFileManagerMethods
from atmosci.utils.timeutils import ONE_DAY

from gddtool.grid import GDDToolFileMethods


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolTargetYearMethods(GDDToolFileMethods):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def gddDatasetPath(self, gdd_threshold):
        return 'gdd%s' % gdd_threshold

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getSignificantDates(self, dataset_path, include_season=False):
        dataset_attrs = self.getDatasetAttributes(dataset_path)
        dates = { }
        if include_season:
            dates['season_start'] = dataset_attrs['start_date']
            dates['season_end'] = dataset_attrs['end_date']
        dates['last_obs'] = dataset_attrs['last_obs_date']
        if 'fcast_start_date' in dataset_attrs:
            dates['fcast_start'] = dataset_attrs['fcast_start_date']
            dates['fcast_end'] = dataset_attrs['fcast_end_date']
        elif 'fcast_start' in dataset_attrs:
            dates['fcast_start'] = dataset_attrs['fcast_start']
            dates['fcast_end'] = dataset_attrs['fcast_end']
        dates['last_valid'] = dataset_attrs['last_valid_date']
        return dates

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolTargetYearReader(GDDToolTargetYearMethods,
                              TimeGridFileReaderMethods,
                              Hdf5DateGridFileReader):

    def __init__(self, filepath, registry):
        self._preInitProject_(registry)
        Hdf5DateGridFileReader.__init__(self, filepath)
        self._postInitProject_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolTargetYearManager(GDDToolTargetYearMethods,
                                TimeGridFileManagerMethods,
                                Hdf5DateGridFileManager):

    def __init__(self, filepath, registry, mode='r'):
        self._preInitProject_(registry)
        Hdf5DateGridFileManager.__init__(self, filepath, mode=mode)
        self._postInitProject_()

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        Hdf5DateGridFileManager._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolTargetYearBuilder(TimeGridFileBuildMethods,
                               GDDToolTargetYearManager):

    def __init__(self, filepath, registry, project_config, filetype, source,
                       target_year, region, **kwargs):
        self.preInitBuilder(project_config, filetype, source, target_year,
                            region, **kwargs)
        GDDToolTargetYearManager.__init__(self, filepath, registry, 'w')
        self.initFileAttributes(**kwargs)
        self.postInitBuilder(**kwargs)
        self.close()

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def updateDataset(self, dataset_path, start_time, data, **kwargs):
        self.open('a')
        GDDToolTargetYearManager.updateDataset(self, dataset_path, start_time,
                                                    data, **kwargs)
        self.close()

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _getDatasetConfig(self, dataset_key, **kwargs):
        descrip_dict = { }
        name, dataset, keys = \
            TimeGridFileBuildMethods._getDatasetConfig(self, dataset_key)

        if 'timespan' in kwargs: timespan = kwargs['timespan ']
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
        GDDToolTargetYearManager._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()


