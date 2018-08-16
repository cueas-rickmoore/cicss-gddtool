
import os

from atmosci.utils.timeutils import isLeapYear

from gddapp.project.factory import BaseGDDProjectFactory
from gddapp.por.factory import GDDPeriodOfRecordFileMethods

from gddtool.grid import GDDToolHistoryDataReader, GDDToolHistoryDataManager
from gddtool.grid import GDDToolHistoryFileBuilder

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from gddtool.config import CONFIG

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolFactory(BaseGDDProjectFactory):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def appDateFormat(self, date):
        return date.strftime('%Y-%m-%d')

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def projectRootDir(self):
        if 'project' in self.server_config.dirpaths:
            return self.server_config.dirpaths.project
        else: return BaseGDDProjectFactory.projectRootDir(self)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolPORFactory(GDDPeriodOfRecordFileMethods, GDDToolFactory):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getSignificantDates(self, coverage, gdd_threshold):
        reader = \
            self.getPORFileReader(self.season, self.source, self.region)
        dataset_path = reader.gddDatasetPath(coverage, gdd_threshold)
        dates = reader.getSignificantDates(dataset_path)
        reader.close()
        return dates

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _registerAccessClasses(self):
        GDDToolFactory._registerAccessClasses(self)
        from gddtool.grid import GDDToolPeriodOfRecordReader
        self._registerAccessManager('por', 'read', GDDToolPeriodOfRecordReader)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolHistoryFactory(GDDToolFactory):

    def __init__(self):
        GDDToolFactory.__init__(self, CONFIG)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # GDD history file accessors
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getHistoryFileBuilder(self, year, source, region, gdd_threshold,
                                  **kwargs):
        filepath = self.historyGridFilepath(year, source, region,
                                          gdd_threshold)
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

    def historyGridDir(self, source, region):
        tooldir = self.server_config.dirpaths.tooldata
        sum_dir = os.path.join(self.projectGridDir(source, region), 'history')
        if not os.path.exists(sum_dir): os.makedirs(sum_dir)
        return sum_dir

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def historyGridFilename(self, year, source, region, gdd_threshold,
                                **kwargs):
        threshold_str = self.gddThresholdAsString(gdd_threshold)
        template = self.getFilenameTemplate('history')
        template_args = dict(kwargs)
        template_args['threshold'] = threshold_str
        if year in (365,366): template_args['days'] = year
        elif isLeapYear(year): template_args['days'] = 366
        else: template_args['days'] = 365
        return template % template_args

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def historyGridFilepath(self, year, source, region, gdd_threshold,
                                **kwargs):
        filename = self.historyGridFilename(year, source, region,
                                          gdd_threshold, **kwargs)
        history_dir = self.historyGridDir(source, region)
        return os.path.join(history_dir, filename)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def projectRootDir(self):
        return self.server_config.dirpaths.tooldata

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _registerAccessClasses(self):
        GDDToolFactory._registerAccessClasses(self)
        self._registerAccessManagers('history', GDDToolHistoryDataReader,
                                                GDDToolHistoryDataManager,
                                                GDDToolHistoryFileBuilder)

