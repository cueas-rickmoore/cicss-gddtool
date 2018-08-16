
import os

import numpy as N

from atmosci.utils.config import ConfigObject, ConfigMap

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

SERVER_DIRPATH = os.path.split(os.path.abspath(__file__))[0]
PKG_DIRPATH = SERVER_DIRPATH[:SERVER_DIRPATH.rfind(os.sep)]
RESOURCE_PATH = os.path.join(SERVER_DIRPATH, 'resources')

PROJECT_END_DAY = (12,31)
PROJECT_START_DAY = (1,1)

SEASON_END_DAY = (10,31)
SEASON_START_DAY = (1,1)

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# specialize the ConfigObject slightly
class ToolConfigObject(ConfigObject):

    def getFiletype(self, filetype_key):
        if '.' in filetype_key:
           filetype, other_key = filetype_key.split('.')
           return self[filetype][other_key]
        else: return self.filetypes[filetype_key]


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

CONFIG = ToolConfigObject('config', None)

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# mode-specific configurations
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CONFIG.build = ConfigObject('build', CONFIG)
CONFIG.build.dirpaths = { 'tooldata':'/Volumes/data/app_data/gddtool',
                          'project' :'/Volumes/data/app_data/gdd',
                          'shared'  :'/Volumes/data/app_data/shared',
                          'static'  :'/Volumes/data/app_data/shared/grid/static',
                          'working' :'/Volumes/data/app_data'
                        }


CONFIG.prod = ConfigObject('prod', CONFIG)
CONFIG.prod.dirpaths = { 'tooldata' :'/home/web/nrcc_data/cicca/gddtool/app_data/gddtool',
                         'project'  :'/home/web/nrcc_data/cicca/gddtool/app_data/gdd',
                         'shared'   :'/home/web/nrcc_data/cicca/gddtool/app_data/shared',
                         'static'   :'/home/web/nrcc_data/cicca/gddtool/app_data/shared/static',
                         'working'  :'/home/web/nrcc_data/cicca/gddtool/app_data',
                       }
CONFIG.prod.gddtool_url = 'http://tools.climatesmartfarming.org/gddtool'
CONFIG.prod.server_address = 'http://tools.climatesmartfarming.org'
CONFIG.prod.server_port = 20004
CONFIG.prod.server_url = 'http://tools.climatesmartfarming.org'

CONFIG.demo = CONFIG.prod.copy("demo")
CONFIG.demo.dates = { 'fcast_end':'2015-07-10',
                      'fcast_start':'2015-07-05',
                      'last_obs':'2015-07-04',
                      'last_valid':'2015-07-10',
                      'plant_date':'2015-05-01',
                      'season':2015,
                    }

CONFIG.dev = ConfigObject('dev', CONFIG)
CONFIG.dev.dates = CONFIG.demo.dates.copy("dates")
CONFIG.dev.dirpaths = { 'tooldata':'/Volumes/Transport/data/app_data/gddtool',
                        'project' :'/Volumes/Transport/data/app_data/gdd',
                        'shared'  :'/Volumes/Transport/data/app_data/shared',
                        'static'  :'/Volumes/Transport/data/app_data/shared/grid/static',
                        'working' :'/Volumes/Transport/data/app_data'
                      }
CONFIG.dev.home = 'dev-gddtool.html'
CONFIG.dev.csftool_url = \
'file://localhost/Volumes/Transport/venvs/csftool/csftool_pkg/csftool/resources'
CONFIG.dev.gddtool_url = \
'file://localhost/Volumes/Transport/venvs/gddtool/gddtool_pkg/gddtool/resources'
CONFIG.dev.server_address = 'file://localhost'
CONFIG.dev.server_port = 8082
CONFIG.dev.server_url = \
'file://localhost/Volumes/Transport/venvs/gddtool/gddtool_pkg/gddtool/resources'

CONFIG.test = ConfigObject('test', CONFIG)
CONFIG.test.dates = CONFIG.dev.copy("test")
CONFIG.test.home = 'test-gddtool.html'
CONFIG.test.server_address = 'http://cyclone.nrcc.cornell.edu'
CONFIG.test.server_url = 'http://cyclone.nrcc.cornell.edu:8082'

CONFIG.wpdev = CONFIG.dev.copy("wpdev")
CONFIG.wpdev.home = 'wpdev-gddtool.html'

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# paths to GDD tool directories
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CONFIG.dirpaths = { 'package':PKG_DIRPATH,     # GDD tool package directory
                    'resources':RESOURCE_PATH, # GDD tool resource directory
                    'server':SERVER_DIRPATH,   # GDD tool server directory
                  }
# delete the directory path constants
del PKG_DIRPATH, RESOURCE_PATH, SERVER_DIRPATH

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# directory paths for GDD tool files
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# project defaults necessary for tool initialization
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CONFIG.tool = { 'toolname':'gddtool',       # name forwarding server knows
       'inherit_resources':'csftool',       # key to inherited set or resources
       'data_region_key':'NE',              # region covered by the server
       'data_source_key':'acis',            # source of model data
       'default_plant_day':(5,1),           # day to begin GDD calculations 
       'default_threshold':'50',            # default GDD threshold
       'season_start_day':SEASON_START_DAY, # first day required by tool
       'season_end_day':SEASON_END_DAY,     # last day required by tool
       }

CONFIG.tool.button_labels = \
       '{"trend":"Show Recent Trend", "season":"Show Season Outlook"}'
# must be a javascript associative array as a string
CONFIG.tool.chart_labels = \
       '{"trend":"Recent Trend", "season":"Season Outlook"}'
# must be a simple javascript array as a string
CONFIG.tool.chart_types = '["trend","season"]'

# default location for this tool
CONFIG.tool.location = { 'address':'Cornell University, Ithaca, NY',
                         'lat':42.4439614, 'lon':-76.5018807, 
                         'key':'default',
                       }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# paths to resource files
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
resource_map = { '/' : ('page', 'file', ('pages','gddtool.html')),
                 'icons'   : ('icon',  'dir', 'icons'),
                 'images'  : ('image', 'dir', 'images'),
                 'js'      : ('file',  'dir', 'js'),
                 'pages'   : ('page',  'dir', 'pages'),
                 'style'   : ('file',  'dir', 'style'),
                 'toolinit.js' : ('tool', 'dir', 'js'),
                 'gddtool.js' : ('tool', 'dir', 'js'),
                 'dev-gddtool.js' : ('tool', 'dir', 'js'),
                 'test-gddtool.js' : ('tool', 'dir', 'js'),
                 'dev-gddtool.html' : ('page',  'dir', 'pages'),
                 'test-gddtool.html' : ('page',  'dir', 'pages'),
                 'wpdev-gddtool.html' : ('page',  'dir', 'pages'),
               }
CONFIG.resources = ConfigMap(resource_map)
del resource_map
# resources that require template validation
CONFIG.data_requests = ('daysInSeason', 'history', 'pordaily', 'season')
CONFIG.templates = ( '/', '/dev-gddtool.html', '/test-gddtool.html',
                     '/wpdev-gddtool.html',
                     '/js/toolinit.js', '/js/dev-gddtool.js'
                   )

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# miscelaneous tool configuration
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CONFIG.server_address = 'http://cyclone.nrcc.cornell.edu'
CONFIG.season_description = '%s Growing Season'
CONFIG.server_port = 8082

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# regional coordinate bounding boxes for data and maps
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ConfigObject('regions', CONFIG)
CONFIG.regions.conus = { 'description':'Continental United States',
                         'data':'-125.00001,23.99999,-66.04165,49.95834',
                         'maps':'-125.,24.,-66.25,50.' }
CONFIG.regions.NE = { 'description':'NOAA Northeast Region (U.S.)',
                      'data':'-82.75,37.125,-66.7916,47.708',
                      'maps':'-82.70,37.20,-66.90,47.60' }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
#
# configuration for GDD tool factory and grid builder/manager/reader
#
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ConfigObject('project', CONFIG)

CONFIG.project.compression = 'gzip'
CONFIG.project.end_day = PROJECT_END_DAY
CONFIG.project.gdd_thresholds = (50, (86,50))
CONFIG.project.region = 'NE'
CONFIG.project.root = 'gddtool'
CONFIG.project.scopes = { 'normal':(1981,2010),
                          'por':(1981,9999),    # 9999 = year previous to target
                          'recent':(-15,9999) } # -n = number of years previous
CONFIG.project.start_day = PROJECT_START_DAY
CONFIG.project.shared_source = True
CONFIG.project.subproject_by_region = True
CONFIG.project.threshold_map = {"50":50, "8650":(86,50)}

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# GDD tool datasets
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ConfigObject('datasets', CONFIG)

CONFIG.datasets.lat = { 'dtype':float, 'dtype_packed':float, 'units':'degrees',
                        'missing_packed':N.nan, 'missing_data':N.nan,
                        'view':('lat','lon'),
                        'description':'Latitude' }
CONFIG.datasets.lon = { 'dtype':float, 'dtype_packed':float, 'units':'degrees',
                        'missing_packed':N.nan, 'missing_data':N.nan,
                        'view':('lat','lon'),
                        'description':'Longitude' }

CONFIG.datasets.doygrid = { 'dtype':int, 'dtype_packed':'<i2',
                            'missing_packed':-999, 'missing_data':-999,
                            'scope':'season', 'period':'doy',
                            'view':('time','lat','lon'),
                            'start_day':PROJECT_START_DAY,
                            'end_day':PROJECT_END_DAY,
                            'description':'Accumulated GDD Matrix' }

CONFIG.datasets.gddavg = CONFIG.datasets.doygrid.copy()
CONFIG.datasets.gddavg.compression = 'gzip'
CONFIG.datasets.gddavg.chunks = ('num_days',1,1)
CONFIG.datasets.gddavg.dtype = float
CONFIG.datasets.gddavg.dtype_packed = float
CONFIG.datasets.gddavg.missing_data = N.nan
CONFIG.datasets.gddavg.missing_packed = N.nan
CONFIG.datasets.gddavg.path = 'avg'
CONFIG.datasets.gddavg.scope = 'por'
CONFIG.datasets.gddavg.description = \
    '%(timespan)s - AVG %(coverage)s GDD (%%(threshold)s)'
CONFIG.datasets.gddavg.timespan = 'Period of Record'

CONFIG.datasets.pormax = CONFIG.datasets.gddavg.copy()
CONFIG.datasets.pormax.path = 'max'
CONFIG.datasets.pormax.description = \
    '%(timespan)s - MAX deviation from avg %(coverage)s GDD (%%(threshold)s)'

CONFIG.datasets.pormin = CONFIG.datasets.gddavg.copy()
CONFIG.datasets.pormin.path = 'min'
CONFIG.datasets.pormin.description = \
    '%(timespan)s - MIN deviation from avg %(coverage)s GDD (%%(threshold)s)'

CONFIG.datasets.normal = CONFIG.datasets.doygrid.copy()
CONFIG.datasets.normal.compression = 'gzip'
CONFIG.datasets.normal.chunks = ('num_days',1,1)
CONFIG.datasets.normal.path = 'normal'
CONFIG.datasets.normal.scope = 'normal'
CONFIG.datasets.normal.timespan = 'Climatological Normal'
CONFIG.datasets.normal.description = \
    '%(timespan)s - AVG accumulated GDD (%%(threshold)s)'

CONFIG.datasets.recent = CONFIG.datasets.doygrid.copy()
CONFIG.datasets.recent.compression = 'gzip'
CONFIG.datasets.recent.chunks = ('num_days',1,1)
CONFIG.datasets.recent.path = 'recent'
CONFIG.datasets.recent.scope = 'recent'
CONFIG.datasets.recent.timespan = 'Recent Record'
CONFIG.datasets.recent.description = \
    '%(timespan)s - AVG accumulated GDD (%%(threshold)s)'

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# dataset view mapping
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CONFIG.view_map = { ('time','lat','lon'):'tyx', ('lat','lon','time'):'yxt',
                     ('time','lon','lat'):'txy', ('lon','lat','time'):'xyt',
                     ('lat','lon'):'yx', ('lon','lat'):'xy',
                     ('lat','time'):'yt', ('time',):'t',
                   }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# GDD tool filename templates
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CONFIG.filenames = { 'history':'%(days)d-Day-GDD-%(threshold)s-History.h5',
                     'normal':'%(days)d-Day-GDD-%(threshold)s-Normal.h5',
                   }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# GDD tool filetypes
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CONFIG.filetypes = { 'history' : { 'scope':'season', 'period':'doy', 
                                   'groups':('por',),
                                   'datasets':('lat','lon','recent'), 
                                   'start_day':PROJECT_START_DAY,
                                   'end_day':PROJECT_END_DAY,
                                   'description':'Historical GDD Extremes'
                                 },
                     'normal' : { 'scope':'season', 'period':'doy', 
                                  'datasets':('lat','lon','normal'), 
                                  'start_day':PROJECT_START_DAY,
                                  'end_day':PROJECT_END_DAY,
                                  'description':'Climate Normal GDD Extremes'
                                }
                    }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# GDD tool data groups
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ConfigObject('groups', CONFIG)

CONFIG.groups.por = { 'path':'por', 'keys':('timespan','threshold',),
       'datasets':('gddavg','pormax','pormin'),
       'start_day':PROJECT_START_DAY, 'end_day':PROJECT_END_DAY,
       'description':'Growing Degree Days - Period of Record Accumulation'
       }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# data sources
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

from atmosci.seasonal.config import CFGBASE
CFGBASE.sources.copy('sources', CONFIG)
del CFGBASE

