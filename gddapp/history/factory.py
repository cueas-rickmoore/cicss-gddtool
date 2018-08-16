
import os

from atmosci.utils.timeutils import isLeapYear

from gddapp.project.factory import BaseGDDProjectFactory

from gddapp.history.access import GDDHistoryFileReader, GDDHistoryFileManager
from gddapp.history.access import GDDHistoryFileBuilder

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from gddapp.config import CONFIG
from gddapp.registry import REGISTRY


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDHistoryFileMethods:

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # GDD history file accessors
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getHistoryFileBuilder(self, year, source, region, gdd_threshold,
                                    coverage, **kwargs):
        filepath = self.historyGridFilepath(year, source, region,
                                            gdd_threshold, coverage)
        filetype = kwargs.get('filetype', 'history%s' % gdd_threshold)
        return self.getGridFileBuilder(filepath, filetype, source, year,
                                       region, coverage=coverage, **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getHistoryFileManager(self, year, source, region, gdd_threshold,
                                    coverage, mode='r'):
        filepath = self.historyGridFilepath(year, source, region,
                                            gdd_threshold, coverage)
        filetype = 'history%s' % gdd_threshold
        return self.getGridFileManager(filepath, filetype, mode)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getHistoryFileReader(self, year, source, region, gdd_threshold,
                                   coverage):
        filepath = self.historyGridFilepath(year, source, region,
                                            gdd_threshold, coverage)
        filetype = 'history%s' % gdd_threshold
        return self.getGridFileReader(filepath, filetype)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # GDD history directory and file paths
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def historyGridDir(self, source, region):
        sum_dir = os.path.join(self.projectGridDir(source, region), 'history')
        if not os.path.exists(sum_dir): os.makedirs(sum_dir)
        return sum_dir

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def historyGridFilename(self, year, source, region, gdd_threshold,
                                  coverage, **kwargs):
        threshold_str = self.gddThresholdAsString(gdd_threshold)
        template = self.getFilenameTemplate('history')
        template_args = dict(kwargs)
        template_args['coverage'] = coverage.title()
        template_args['region'] = self.regionToFilepath(region)
        template_args['source'] = self.sourceToFilepath(source)
        template_args['threshold'] = threshold_str
        if year in (365,366): template_args['year'] = year
        elif isLeapYear(year): template_args['year'] = 366
        else: template_args['year'] = 365
        return template % template_args

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def historyGridFilepath(self, year, source, region, gdd_threshold,
                                  coverage, **kwargs):
        filename = self.historyGridFilename(year, source, region,
                                   gdd_threshold, coverage, **kwargs)
        history_dir = self.historyGridDir(source, region)
        return os.path.join(history_dir, filename)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _registerHistoryAccessClasses(self):
        self._registerAccessManagers('history', GDDHistoryFileReader,
                                                GDDHistoryFileManager,
                                                GDDHistoryFileBuilder)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDHistoryFileFactory(GDDHistoryFileMethods, BaseGDDProjectFactory):

    def __init__(self, config=CONFIG, registry=REGISTRY):
        BaseGDDProjectFactory.__init__(self, config, registry)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _registerAccessClasses(self):
        BaseGDDProjectFactory._registerAccessClasses(self)
        self._registerHistoryAccessClasses()

