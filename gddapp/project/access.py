
from dateutil.relativedelta import relativedelta
ONE_DAY = relativedelta(days=1)

import numpy as N

from atmosci.seasonal.grid import SeasonalGridFileReader
from atmosci.seasonal.grid import SeasonalGridFileManager
from atmosci.seasonal.grid import SeasonalGridFileBuilder

from gddapp.project.methods import GDDProjectFileMethods


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDGridFileReader(GDDProjectFileMethods, SeasonalGridFileReader):

    def __init__(self, filepath, registry):
        SeasonalGridFileReader.__init__(self, filepath, registry)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        SeasonalGridFileReader._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDFileManagerMethods(GDDProjectFileMethods):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # GDD threshold group update - updates all 3 datasets in the group
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def refreshThresholdGroup(self, threshold, start_date, mint, maxt,
                                    source_tag, **kwargs):
        debug = kwargs.get('debug', False)
        verbose = kwargs.get('verbose', debug)

        gdd_group  = 'gdd%s' % self.gddThresholdAsString(threshold)
        daily_path = '%s.daily' % gdd_group
        accum_path = '%s.accumulated' % gdd_group
        prov_path  = '%s.provenance' % gdd_group

        if verbose: print '    caclculating GDD'
        gdd = self.calcGDD(self.calcAvgTemp(maxt, mint, threshold), threshold)

        if verbose: print '    accumulating GDD'
        prev_accum_date = start_date - ONE_DAY
        if prev_accum_date.year == self.start_date.year:
            where_gdd_was_nan = N.where(N.isnan(gdd))
            gdd[where_gdd_was_nan] = 0.
            prev_accum_gdds = self.getDataForTime(accum_path, prev_accum_date)
            if gdd.ndim == 2:
                accum_gdd = gdd + prev_accum_gdds
            else:
                accum_gdd = self.accumulateGDD(gdd) + prev_accum_gdds
            gdd[where_gdd_was_nan] = N.nan
        else:
            accum_gdd = gdd

        if verbose: print '    updating data in', gdd_group
        if gdd.ndim == 3:
            last_obs_date = kwargs.get('last_obs_date',
                            start_date + relativedelta(days=gdd.shape[0]-1))
            self.insertTimeSlice(daily_path, start_date, gdd, **kwargs)
            self.insertTimeSlice(accum_path, start_date, accum_gdd, **kwargs)
            self.insertGroupProvenance(prov_path, start_date, gdd, accum_gdd,
                                       **kwargs)
        else:
            last_obs_date = kwargs.get('last_obs_date', start_date)
            self.insertByTime(daily_path, start_date, gdd, **kwargs)
            self.insertByTime(accum_path, start_date, accum_gdd, **kwargs)
            self.insertGroupProvenance(prov_path, start_date, gdd, accum_gdd,
                                       **kwargs)
        del gdd, accum_gdd

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def updateThresholdGroup(self, threshold, start_date, mint, maxt,
                                   source_tag, **kwargs):
        self.refreshThresholdGroup(threshold, start_date, mint, maxt,
                                   source_tag, **kwargs)

        gdd_group  = 'gdd%s' % self.gddThresholdAsString(threshold)
        daily_path = '%s.daily' % gdd_group
        accum_path = '%s.accumulated' % gdd_group
        prov_path  = '%s.provenance' % gdd_group

        self.setValidationDates((prov_path, daily_path, accum_path),
                                start_date, mint, **kwargs)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDGridFileManager(GDDFileManagerMethods, SeasonalGridFileManager):

    def __init__(self, filepath, registry, mode='r'):
        SeasonalGridFileManager.__init__(self, filepath, registry, mode)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        SeasonalGridFileManager._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDGridFileBuilder(GDDFileManagerMethods, SeasonalGridFileBuilder):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _getFileDescription(self, source, **kwargs):
        template = self._getFileDescriptionTemplate(self.filetype)
        descrip_dict = { 'source':kwargs.get('source',source).upper(), }
        if 'coverage' in kwargs:
            descrip_dict['coverage'] = kwargs['coverage'].title()
        return template % descrip_dict

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _resolveGroupBuildAttributes(self, group_config, group_keydict,
                                           **kwargs):
        if group_keydict is not None:
            timespan = group_keydict.get('timespan', None)
            if timespan is not None:
                if 'timespan' in kwargs:
                    timespan = '%s (%d thru %d)' % (timespan, kwargs['timespan'])
                elif 'scopes' in kwargs:
                    scopes = kwargs['scopes']
                    years = '(%d thru %d)' % scopes[group_keydict['path']]
                    timespan = '%s %s' % (timespan, years)
                group_keydict['timespan'] = timespan

        return SeasonalGridFileBuilder._resolveGroupBuildAttributes(self,
                                        group_config, group_keydict, **kwargs)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def initFileAttributes(self, **kwargs):
        #!TODO
        #!TODO NEED TO MAKE SURE there are START & END dates/days/doys 
        #!TODO
        SeasonalGridFileBuilder.initFileAttributes(self, **kwargs)

