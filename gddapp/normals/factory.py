
import os

from atmosci.utils.timeutils import isLeapYear, daysInYear

from gddapp.project.factory import BaseGDDProjectFactory

from gddapp.normals.access import GDDNormalsFileReader, GDDNormalsFileManager
from gddapp.normals.access import GDDNormalsFileBuilder

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from gddapp.config import CONFIG
from gddapp.registry import REGISTRY


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDNormalsFileMethods:

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # GDD normal file accessors
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getNormalsFileBuilder(self, year, source, region, gdd_threshold,
                                    coverage, **kwargs):
        filepath = self.normalsGridFilepath(year, source, region,
                                           gdd_threshold, coverage)
        filetype = kwargs.get('filetype', 'normal%s' % gdd_threshold)
        if year in (365,366): days_in_year = year
        else: days_in_year = daysInYear(year)
        return self.getGridFileBuilder(filepath, filetype, source,
                    days_in_year, region, coverage=coverage, **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getNormalsFileManager(self, year, source, region, gdd_threshold,
                                    coverage, mode='r'):
        filepath = self.normalsGridFilepath(year, source, region,
                                            gdd_threshold, coverage)
        filetype = 'normal%s' % gdd_threshold
        return self.getGridFileManager(filepath, filetype, mode)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getNormalsFileReader(self, year, source, region, gdd_threshold,
                                   coverage):
        filepath = self.normalsGridFilepath(year, source, region,
                                            gdd_threshold, coverage)
        filetype = 'normal%s' % gdd_threshold
        return self.getGridFileReader(filepath, filetype)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # GDD normal directory and file paths
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def normalsGridDir(self, source, region):
        norm_dir = os.path.join(self.projectGridDir(source, region), 'normal')
        if not os.path.exists(norm_dir): os.makedirs(norm_dir)
        return norm_dir

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def normalsGridFilename(self, year, source, region, gdd_threshold,
                                  coverage, **kwargs):
        threshold_str = self.gddThresholdAsString(gdd_threshold)
        template = self.getFilenameTemplate('normal')
        template_args = dict(kwargs)
        template_args['coverage'] = coverage.title()
        template_args['region'] = self.regionToFilepath(region)
        template_args['source'] = self.sourceToFilepath(source)
        template_args['threshold'] = threshold_str
        if year in (365,366): template_args['year'] = year
        else: template_args['year'] = daysInYear(year)
        return template % template_args

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def normalsGridFilepath(self, year, source, region, gdd_threshold,
                                  coverage, **kwargs):
        filename = self.normalsGridFilename(year, source, region,
                                   gdd_threshold, coverage, **kwargs)
        normal_dir = self.normalsGridDir(source, region)
        return os.path.join(normal_dir, filename)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _registerNormalAccessClasses(self):
        self._registerAccessManagers('normal', GDDNormalsFileReader,
                                                GDDNormalsFileManager,
                                                GDDNormalsFileBuilder)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDNormalsFileFactory(GDDNormalsFileMethods, BaseGDDProjectFactory):

    def __init__(self, config=CONFIG, registry=REGISTRY):
        BaseGDDProjectFactory.__init__(self, config, registry)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _registerAccessClasses(self):
        BaseGDDProjectFactory._registerAccessClasses(self)
        self._registerNormalAccessClasses()

