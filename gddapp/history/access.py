
from dateutil.relativedelta import relativedelta
ONE_DAY = relativedelta(days=1)

import numpy as N

from gddapp.project.access import GDDGridFileReader, GDDGridFileManager
from gddapp.project.access import GDDGridFileBuilder


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDHistoryFileReadMethods:

    def getAverageAtNode(self, scope, start_date, end_date, lon, lat):
        path = '%s.avg' % scope
        return self.getSliceAtNode(path, start_date, end_date, lon, lat)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getExtremesAtNode(self, scope, start_date, end_date, lon, lat):
        path = '%s.min' % scope
        node_min = self.getSliceAtNode(path, start_date, end_date, lon, lat)
        path = '%s.max' % scope
        node_max = self.getSliceAtNode(path, start_date, end_date, lon, lat)
        return node_min, node_max

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDHistoryFileReader(GDDHistoryFileReadMethods, GDDGridFileReader):

    def __init__(self, filepath, registry):
        GDDGridFileReader.__init__(self, filepath, registry)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        GDDGridFileReader._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDHistoryFileManageMethods(GDDHistoryFileReadMethods):

    def refreshScopeStats(self, scope, min_grid, max_grid, avg_grid, **kwargs):
        path_tmpl = '%s.%%s' % scope
        for dataset_name in ('min','max','avg'):
            path = path_tmpl % dataset_name
            if gdd.ndim == 3:
                self.insertTimeSlice(path, start_date, gdd, **kwargs)
            else:
                self.insertByTime(_path, start_date, gdd, **kwargs)

    updateScopeStats = refreshScopeStats


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDHistoryFileManager(GDDHistoryFileManageMethods, GDDGridFileManager):

    def __init__(self, filepath, registry, mode='r'):
        GDDGridFileManager.__init__(self, filepath, registry, mode)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        GDDGridFileManager._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDHistoryFileBuilder(GDDHistoryFileManageMethods, GDDGridFileBuilder):

    def __init__(self, filepath, registry, project_config, filetype, source,
                       target_year, region, **kwargs):
        GDDGridFileBuilder.__init__(self, filepath, registry, project_config,
                           filetype, source, target_year, region, **kwargs)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        GDDGridFileBuilder._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()
