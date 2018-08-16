
try:
    import json
except:
    import simplejson as json

from atmosci.hdf5.manager import Hdf5DateGridFileReader
from atmosci.hdf5.manager import Hdf5DateGridFileManager

from atmosci.seasonal.methods.builder import TimeGridFileBuildMethods
from atmosci.seasonal.methods.timegrid import TimeGridFileReaderMethods
from atmosci.seasonal.methods.timegrid import TimeGridFileManagerMethods
from atmosci.utils.timeutils import ONE_DAY, DateIterator

from gddapp.history.access import GDDHistoryFileReader
from gddapp.por.access import GDDPeriodOfRecordReader


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolFileMethods:

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getEncodedDays(self, start_date, end_date):
        days = [ date.strftime('%Y-%m-%d')
                 for date in DateIterator(start_date, end_date) ]
        return self.tightJsonString(days)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def gddThresholdString(self, gdd_threshold):
        if isinstance(gdd_threshold, basestring):
            threshold = \
                self.config.project.threshold_map.get(gdd_threshold, None)
            if threshold: return self.gddThresholdString(threshold)
        if isinstance(gdd_threshold, (list,tuple)):
            return ''.join(['%02d' % th for th in gdd_threshold])
        elif isinstance(gdd_threshold, int):
            return '%02d' % gdd_threshold
        elif isinstance(gdd_threshold, basestring):
            return gdd_threshold
        else: return str(gdd_threshold)

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

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def tightJsonString(self, value):
        return json.dumps(value, separators=(',', ':'))


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolHistoryDataReader(GDDToolFileMethods, TimeGridFileReaderMethods,
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

class GDDToolHistoryDataManager(GDDToolFileMethods, TimeGridFileManagerMethods,
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
        GDDToolHistoryDataManager._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolPeriodOfRecordReader(GDDToolFileMethods, GDDPeriodOfRecordReader):

    def __init__(self, filepath, registry):
        GDDPeriodOfRecordReader.__init__(self, filepath, registry)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getAccumulatedGDDSince(self, threshold, start_date, end_date,
                                     lon, lat, initial_gdd=0.):
        prev_date = start_date - ONE_DAY
        gdd = self.getGDDAtNode('accumulated', threshold, prev_date, end_date,
                                               lon, lat)
        return (gdd[1:] - gdd[0]) + initial_gdd

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getDailyGDD(self, threshold, start_date, end_date, lon, lat):
        return self.getGDDAtNode('daily', threshold, start_date, end_date,
                                          lon, lat)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getSignificantDates(self, dataset_path):
        dataset_attrs = self.getDatasetAttributes(dataset_path)
        dates = { }
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

