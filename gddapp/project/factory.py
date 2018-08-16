
import datetime

from atmosci.seasonal.factory import BasicSeasonalProjectFactory
from atmosci.seasonal.methods.source import SourceFileAccessorMethods
from atmosci.seasonal.methods.static import StaticFileAccessorMethods


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class BaseGDDProjectFactory(SourceFileAccessorMethods,
                            StaticFileAccessorMethods,
                            BasicSeasonalProjectFactory):

    def __init__(self, config=None, registry=None):
        if config is None:
            from gddapp.config import CONFIG
            config = CONFIG
        if registry is None:
            from gddapp.registry import REGISTRY
            registry = REGISTRY
        BasicSeasonalProjectFactory.__init__(self, config, registry)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getAvailableScopes(self, target_year=None):
        """ returns all configured scopes adjusted for the target year
        """
        if target_year is None: target_year = datetime.date.today().year
        # get scopes from config file and adjust for target year
        scopes = { }
        for key, scope in self.config.project.scopes.attrs.items():
            first_year, last_year = scope
            if last_year == 9999: # last year is one previous to target year
                last_year = target_year - 1
            if first_year < 0: # contains a number years previous to last year
                first_year = first_year + last_year + 1
            scopes[key] = (first_year, last_year)
        return scopes

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getScopeTimespan(self, scope, target_year=None):
        """ returns all configured scopes adjusted for the target year
        """
        if target_year is None: target_year = datetime.date.today().year
        # get scopes from config file and adjust for target year
        first_year, last_year = self.config.project.scopes[scope]
        if last_year == 9999: # last year is one previous to target year
            last_year = target_year - 1
        if first_year < 0: # contains a number years previous to last year
            first_year = first_year + last_year + 1
        return first_year, last_year

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def gddThresholdAsString(self, gdd_threshold):
        if isinstance(gdd_threshold, (list,tuple)):
            return ''.join(['%02d' % th for th in gdd_threshold])
        elif isinstance(gdd_threshold, int):
            return '%02d' % gdd_threshold
        elif isinstance(gdd_threshold, basestring):
            return gdd_threshold
        else: return str(gdd_threshold)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 
    def gddThresholdsAsStrings(self):
        gdd_thresholds = [ ]
        for threshold in self.config.project.gdd_thresholds:
            gdd_thresholds.append(self.gddThresholdAsString(threshold))
        return tuple(gdd_thresholds)

