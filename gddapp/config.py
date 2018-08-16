
import os, sys

import numpy as N
from scipy import stats as scipy_stats

from atmosci.utils.config import ConfigObject
from atmosci.utils.timeutils import asAcisQueryDate

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# take advantage of the default seasonal project configuration
# this helps keep common things consistent between projects
# which, in turn, means we can re-use scripts from the 
# atmosci.seasonal package without making changes 
from atmosci.seasonal.config import CFGBASE
CONFIG = CFGBASE.copy('config', None)
del CFGBASE


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# directory paths
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if 'win32' in sys.platform:
    CONFIG.dirpaths.project = 'C:\\Work\\app_data\\gdd'
    CONFIG.dirpaths.shared  = 'C:\\Work\\app_data\\shared'
    CONFIG.dirpaths.static  = 'C:\\Work\\app_data\\shared\\grid\\static'
    CONFIG.dirpaths.working = 'C:\\Work\\app_data'
else:
#    CONFIG.dirpaths.project = '/Volumes/data/app_data/gdd'
#    CONFIG.dirpaths.shared  = '/Volumes/data/app_data/shared'
#    CONFIG.dirpaths.static  = '/Volumes/data/app_data/shared/grid/static'
#    CONFIG.dirpaths.working = '/Volumes/data/app_data'
    CONFIG.dirpaths.project = '/Volumes/Transport/data/app_data/gdd'
    CONFIG.dirpaths.shared  = '/Volumes/Transport/data/app_data/shared'
    CONFIG.dirpaths.static  = '/Volumes/Transport/data/app_data/shared/grid/static'
    CONFIG.dirpaths.working = '/Volumes/Transport/data/app_data'


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# GDD project configuration
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CONFIG.project.bbox = { 'NE':'-82.75,37.125,-66.7916,47.708',
                        'conus':'-125.00001,23.99999,-66.04165,49.95834',
                      }
CONFIG.project.compression = 'gzip'
CONFIG.project.end_day = (10,31)
CONFIG.project.forecast = 'ndfd'
CONFIG.project.gdd_thresholds = (50, (86,50))
CONFIG.project.region = 'NE'
CONFIG.project.root = 'gdd'
CONFIG.project.scopes = { 'normal':(1981,2010),
                          'por':(1981,9999),    # 9999 = year previous to target
                          'recent':(-15,9999) } # -n = number of years previous
CONFIG.project.source = 'acis'
CONFIG.project.start_day = (1,1)
CONFIG.project.shared_forecast = True
CONFIG.project.shared_source = True
CONFIG.project.subproject_by_region = True
CONFIG.project.threshold_map = {"50":50, "8650":(86,50)}


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# GDD project datasets
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CONFIG.datasets.avgt = CONFIG.datasets.maxt.copy()
CONFIG.datasets.avgt.description = 'Average Temperature'
CONFIG.datasets.avgt.units = 'F'

CONFIG.datasets.cumgdd = CONFIG.datasets.dategrid.copy()
CONFIG.datasets.cumgdd.description = 'Accumulated Growing Degree Days'

CONFIG.datasets.gdddoyyear = { 'dtype':int, 'dtype_packed':'<i2',
                               'missing_packed':-999, 'missing_data':-999,
                               'scope':'season', 'period':'doy',
                               'view':('lat','lon','doy','year'),
                               'start_day':(1,1), 'end_day':(10,31),
                               'description':'Accumulated GDD Matrix' }

CONFIG.datasets.gddavg = CONFIG.datasets.doygrid.copy()
CONFIG.datasets.gddavg.path = 'avg'
CONFIG.datasets.gddavg.scope = 'por'
CONFIG.datasets.gddavg.description = \
                '%(timespan)s - Average %(coverage)s GDD (%(threshold)s)'
CONFIG.datasets.gddmax = CONFIG.datasets.doygrid.copy()
CONFIG.datasets.gddmax.path = 'max'
CONFIG.datasets.gddmax.scope = 'por'
CONFIG.datasets.gddmax.description = \
                '%(timespan)s - Maximum %(coverage)s GDD (%(threshold)s)'
CONFIG.datasets.gddmin = CONFIG.datasets.doygrid.copy()
CONFIG.datasets.gddmin.path = 'min'
CONFIG.datasets.gddmin.scope = 'por'
CONFIG.datasets.gddmin.description = \
                '%(timespan)s - Minimum %(coverage)s GDD (%(threshold)s)'
CONFIG.datasets.maxdev = CONFIG.datasets.doygrid.copy()
CONFIG.datasets.maxdev.path = 'maxdev'
CONFIG.datasets.maxdev.scope = 'por'
CONFIG.datasets.maxdev.description = \
                '%(timespan)s - max deviation from avg %(coverage)s GDD (%(threshold)s)'
CONFIG.datasets.mindev = CONFIG.datasets.doygrid.copy()
CONFIG.datasets.mindev.path = 'mindev'
CONFIG.datasets.mindev.scope = 'por'
CONFIG.datasets.mindev.description = \
                '%(timespan)s - min deviation from avg %(coverage)s GDD (%(threshold)s)'

CONFIG.datasets.srcgdd = CONFIG.datasets.dategrid.copy()
CONFIG.datasets.srcgdd.description = 'Growing Degree Days'
CONFIG.datasets.srccumgdd = CONFIG.datasets.dategrid.copy()
CONFIG.datasets.srccumgdd.description = 'Accumulated Growing Degree Days'


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# GDD project filename templates
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CONFIG.filenames.project = '%(year)d-GDD-%(gdd)s.h5'
CONFIG.filenames.por = '%(year)d-GDD-%(source)s-Daily.h5'
CONFIG.filenames.history = '%(year)d-%(coverage)s-GDD-%(threshold)s-History.h5'
CONFIG.filenames.normal = '%(year)d-%(coverage)s-GDD-%(threshold)s-Climate-Norm.h5'


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# GDD project filetypes
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# daily GDD data for individual year
CONFIG.filetypes.por = { 'scope':'year', 'period':'date', 
       'datasets':('lon','lat'),
       'groups':('daily50', 'daily8650'),
       'description':'Data downloaded from %(source)s',
       'start_day':(1,1), 'end_day':(12,31) }

# daily temperatures for individual year
CONFIG.filetypes.source = { 'scope':'year', 'period':'date', 
       'datasets':('lon','lat'), 'groups':('tempexts',),
       'description':'Data downloaded from %(source)s',
       'start_day':(1,1), 'end_day':(12,31) }

# GDD extremes for recent history (previous 15 years)
CONFIG.filetypes.history50 = { 'filename':'history', 'filetype':'history',
       'scope':'por', 'period':'doy', 'datasets':('lon','lat',),
       'groups':( ('timespan',{'path':'recent','threshold':'gdd>50',
                               'timespan':'Previous 15 Years'}),
                  ('timespan',{'path':'por','threshold':'gdd>50',
                               'timespan':'Period of Record'}), ),
       'description':'%(coverage)s GDD (gdd>50) Time Series',
       'start_day':(1,1), 'end_day':(12,31) }

CONFIG.filetypes.history8650 = { 'filename':'history', 'filetype':'history',
       'scope':'por', 'period':'doy', 'datasets':('lon','lat',),
       'groups':( ('timespan',{'path':'recent','threshold':'gdd>8650',
                               'timespan':'Recent Record'}),
                  ('timespan',{'path':'por','threshold':'gdd>8650',
                               'timespan':'Period of Record'}), ),
       'description':'%(coverage)s GDD (gdd>8650) Time Series',
       'start_day':(1,1), 'end_day':(12,31) }

# GDD climate normal extremes (1981-2010)
CONFIG.filetypes.normal50 = { 'filename':'normal', 'filetype':'normal',
       'scope':'por', 'period':'doy', 'datasets':('lon','lat',),
       'groups':( ('timespan',{'path':'normal','threshold':'gdd>50',
                               'timespan':'Climatological Record'}),
                ),
       'description':'%(coverage)s GDD (gdd>50) Time Series',
       'start_day':(1,1), 'end_day':(12,31) }

CONFIG.filetypes.normal8650 = { 'filename':'normal', 'filetype':'normal',
       'scope':'por', 'period':'doy', 'datasets':('lon','lat',),
       'groups':( ('timespan',{'path':'normal','threshold':'gdd>8650',
                               'timespan':'Climatological Record'}),
                ),
       'description':'%(coverage)s GDD (gdd>8650) Time Series',
       'start_day':(1,1), 'end_day':(12,31) }


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# GDD project data groups
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CONFIG.groups.daily50 = { 'path':'gdd50',
      'datasets':('daily:srcgdd','accumulated:srccumgdd','provenance:gddaccum'),
      'description':'Growing Degree Days (gdd>50)' }
CONFIG.groups.daily8650 = { 'path':'gdd8650',
      'datasets':('daily:srcgdd','accumulated:srccumgdd','provenance:gddaccum'),
      'description':'Growing Degree Days (50<gdd<86)' }

CONFIG.groups.tempexts = { 'path':'temps', 'description':'Daily temperatures',
                           'datasets':('maxt','mint','provenance:tempexts') }

CONFIG.groups.timespan = { 'keys':('timespan','threshold',),
       'description':'%(timespan)s - Growing Degree Days (%(threshold)s)',
       'datasets':('gddavg','gddmax','gddmin'), }


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# GDD project provencnace datasets
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CONFIG.provenance.types.gddaccum = CONFIG.provenance.types.dateaccum.copy()
CONFIG.provenance.types.gddaccum.generator = 'dateaccum'
CONFIG.provenance.types.gddaccum.scope = 'year'

