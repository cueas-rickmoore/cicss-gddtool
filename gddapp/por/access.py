
from dateutil.relativedelta import relativedelta
ONE_DAY = relativedelta(days=1)

import numpy as N

from gddapp.project.access import GDDGridFileReader, GDDGridFileManager
from gddapp.project.access import GDDGridFileBuilder


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDPeriodOfRecordReader(GDDGridFileReader):

    def __init__(self, filepath, registry):
        GDDGridFileReader.__init__(self, filepath, registry)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        GDDGridFileReader._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDPeriodOfRecordManager(GDDGridFileManager):

    def __init__(self, filepath, registry, mode='r'):
        GDDGridFileManager.__init__(self, filepath, registry, mode)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        GDDGridFileManager._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDPeriodOfRecordBuilder(GDDGridFileBuilder):

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        GDDGridFileBuilder._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()
