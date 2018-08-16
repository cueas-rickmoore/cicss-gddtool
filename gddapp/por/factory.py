
import os
import datetime

from atmosci.acis.griddata import AcisGridDownloadMixin

from gddapp.project.factory import BaseGDDProjectFactory


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from gddapp.config import CONFIG
from gddapp.registry import REGISTRY


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDPeriodOfRecordFileMethods:

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # GDD Period-Of-Record file accessors
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getPORFileBuilder(self, year, source, region=None, **kwargs):
        filepath = self.porGridFilepath(year, source, region)
        return self.getGridFileBuilder(filepath, 'por', source, year, region,
                                       **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getPORFileManager(self, year, source, region=None, mode='r'):
        filepath = self.porGridFilepath(year, source, region)
        return self.getGridFileManager(filepath, 'por', mode)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getPORFileReader(self, year, source, region=None):
        filepath = self.porGridFilepath(year, source, region)
        return self.getGridFileReader(filepath, 'por')

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # GDD Period-Of-Record directory and file paths
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def porGridDir(self, source, region):
        por_dir = self.config.dirpaths.get('por', None)
        if por_dir is None:
            shared = self.project.get('shared_por', False)
            if shared:
                region_dir = self.subdirByRegion(self.sharedRootDir(), region)
                source_dir = \
                    os.path.join(region_dir, self.sourceToDirpath(source)) 
            else: 
                source_dir = self.projectGridDir(source, region)
            por_dir = os.path.join(source_dir, 'por')
        if not os.path.exists(por_dir): os.makedirs(por_dir)
        return por_dir        

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def porGridFilename(self, year, source, region, **kwargs):
        template = self.getFilenameTemplate('por')
        template_args = dict(kwargs)
        template_args['region'] = self.regionToFilepath(region)
        template_args['source'] = self.sourceToFilepath(source)
        template_args['year'] = year
        return template % template_args

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def porGridFilepath(self, year, source, region, **kwargs):
        filename = self.porGridFilename(year, source, region, **kwargs)
        por_dir = self.porGridDir(source, region)
        return os.path.join(por_dir, filename)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _registerPORAccessClasses(self):
        from gddapp.por.access import GDDPeriodOfRecordReader
        from gddapp.por.access import GDDPeriodOfRecordManager
        from gddapp.por.access import GDDPeriodOfRecordBuilder

        self._registerAccessManagers('por', GDDPeriodOfRecordReader,
                                            GDDPeriodOfRecordManager,
                                            GDDPeriodOfRecordBuilder)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDPeriodOfRecordFactory(GDDPeriodOfRecordFileMethods,
                               AcisGridDownloadMixin,
                               BaseGDDProjectFactory):

    def __init__(self, config=CONFIG, registry=REGISTRY):
        BaseGDDProjectFactory.__init__(self, config, registry)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _registerAccessClasses(self):
        BaseGDDProjectFactory._registerAccessClasses(self)
        self._registerPORAccessClasses()

