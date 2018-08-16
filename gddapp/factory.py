
import os
import datetime

from atmosci.acis.griddata import AcisGridDownloadMixin

from gddapp.history.factory import GDDHistoryFileMethods
from gddapp.normals.factory import GDDNormalsFileMethods
from gddapp.por.factory import GDDPeriodOfRecordFileMethods
from gddapp.project.factory import BaseGDDProjectFactory


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from gddapp.config import CONFIG
from gddapp.registry import REGISTRY


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDAppProjectFactory(GDDPeriodOfRecordFileMethods, GDDNormalsFileMethods,
                           GDDHistoryFileMethods, BaseGDDProjectFactory):

    def __init__(self, config=CONFIG, registry=REGISTRY):
        BaseGDDProjectFactory.__init__(self, config, registry)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _registerAccessClasses(self):
        BaseGDDProjectFactory._registerAccessClasses(self)
        self._registerPORAccessClasses()
        self._registerHistoryAccessClasses()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDAppSourceGridFactory(AcisGridDownloadMixin, BaseGDDProjectFactory):

    def __init__(self, config=CONFIG, registry=REGISTRY):
        BaseGDDProjectFactory.__init__(self, config, registry)

