
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
CONFIG.prod.dirpaths = { 'project'  :'/app_data/gdd',
                         'resources':'/opt/tool_pkg/gddtool/resources',
                         'shared'   :'/app_data/shared',
                         'static'   :'/app_data/shared/static',
                         'tooldata' :'/app_data/gddtool',
                         'working'  :'/app_data',
                       }
CONFIG.prod.gddtool_url = 'http://tools.climatesmartfarming.org/gddtool'
CONFIG.prod.server_address = 'http://tools.climatesmartfarming.org'
CONFIG.prod.server_port = 20004
CONFIG.prod.server_url = 'http://tools.climatesmartfarming.org'

CONFIG.demo = ConfigObject('demo', CONFIG)
CONFIG.demo.dates = { 'fcast_end':'2016-07-10',
                      'fcast_start':'2016-07-05',
                      'last_obs':'2016-07-04',
                      'last_valid':'2016-07-10',
                      'plant_date':'2016-05-01',
                    }
CONFIG.demo.season = 2016

CONFIG.dev = ConfigObject('dev', CONFIG)
CONFIG.dev.dirpaths = { 'project'  :'/Volumes/Transport/data/app_data/gdd',
                        'resources':'/Volumes/Transport/venvs/gdd/tool_pkg/gddtool/dev-resources',
                        'shared'   :'/Volumes/Transport/data/app_data/shared',
                        'static'   :'/Volumes/Transport/data/app_data/shared/grid/static',
                        'tooldata' :'/Volumes/Transport/data/app_data/gddtool',
                        'working'  :'/Volumes/Transport/data/app_data'
                      }
CONFIG.dev.home = 'gddtool.html'
CONFIG.dev.csftool_url = 'http://localhost:8082/csftool'
CONFIG.dev.gddtool_url = 'http://localhost:8082/gddtool'
CONFIG.dev.server_address = 'file://localhost'
CONFIG.dev.server_port = 8082
CONFIG.dev.server_url = 'http://localhost:8082'

CONFIG.test = ConfigObject('test', CONFIG)
CONFIG.test.dirpaths = CONFIG.dev.dirpaths.copy("dirpaths")
CONFIG.test.dirpaths.resources = '/Volumes/Transport/venvs/gdd/tool_pkg/gddtool/resources'
#CONFIG.test.dirpaths.resources = '/Volumes/Transport/venvs/gddtool/gddtool_pkg/gddtool/dev-resources'
CONFIG.test.csftool_url = 'http://cyclone.nrcc.cornell.edu:8082/csftool'
CONFIG.test.gddtool_url = 'http://cyclone.nrcc.cornell.edu:8082/gddtool'
CONFIG.test.home = 'test-gddtool.html'
CONFIG.test.server_address = 'http://cyclone.nrcc.cornell.edu'
CONFIG.test.server_url = 'http://cyclone.nrcc.cornell.edu:8082'

CONFIG.wpdev = CONFIG.dev.copy("wpdev", CONFIG)
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
       'default_plant_day':[3,1],           # day to begin GDD calculations 
       'default_threshold':'50',            # default GDD threshold
       'first_year':2016,                   # first year with data
       'season_available':[3,1],            # day that new season is available
       'season_start_day':SEASON_START_DAY, # first day required by tool
       'season_end_day':SEASON_END_DAY,     # last day required by tool
       }

CONFIG.tool.button_labels = \
       '{"outlook":"Show Season Outlook", "trend":"Show Recent Trend"}'
# must be a javascript associative array as a string
CONFIG.tool.chart_labels = \
       '{"outlook":"Season Outlook", "season":"Season", "trend":"Recent Trend"}'
# must be a simple javascript array as a string
CONFIG.tool.chart_types = '["season", "trend"]'

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
                 'gddtool.html' : ('page',  'dir', 'pages'),
#                 'toolinit.js' : ('tool', 'dir', 'js'),
#                 'gddtool.js' : ('tool', 'dir', 'js'),
#                 'dev-gddtool.js' : ('tool', 'dir', 'js'),
#                 'test-gddtool.js' : ('tool', 'dir', 'js'),
#                 'dev-gddtool.html' : ('page',  'dir', 'pages'),
#                 'test-gddtool.html' : ('page',  'dir', 'pages'),
#                 'wpdev-gddtool.html' : ('page',  'dir', 'pages'),
               }
CONFIG.resource_map = ConfigMap(resource_map)
CONFIG.templates = ( 'tool.js', )
del resource_map
# resources that require template validation
CONFIG.request_types = {
        'file' : ( 'display.js', 'gddtool.css', 'interface.js',
                   'load-dependencies.js', 'loadtool.js', 'loadstyles.js',
                   'toolinit.js', 'ui.min.js', 'wp-style.css' ),
        'page' : ( 'gddtool.html', 'dev-gddtool.html', 'test-gddtool.html',
                   'wpdev-gddtool.html', ),
        'template' : ( 'tool.js', 'tool.min.js' ),
        }

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
CONFIG.project.source = 'acis'
CONFIG.project.shared_forecast = True
CONFIG.project.shared_source = True
CONFIG.project.start_day = PROJECT_START_DAY
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

CONFIG.datasets.compressed = CONFIG.datasets.doygrid.copy()
CONFIG.datasets.compressed.compression = 'gzip'
CONFIG.datasets.compressed.chunks = ('num_days',1,1)
CONFIG.datasets.compressed.dtype = float
CONFIG.datasets.compressed.dtype_packed = float
CONFIG.datasets.compressed.missing_data = N.nan
CONFIG.datasets.compressed.missing_packed = N.nan

CONFIG.datasets.gddavg = CONFIG.datasets.compressed.copy()
CONFIG.datasets.gddavg.path = 'avg'
CONFIG.datasets.gddavg.scope = 'por'
CONFIG.datasets.gddavg.description = \
    '%(timespan)s - AVG %(coverage)s GDD (%%(threshold)s)'
CONFIG.datasets.gddavg.timespan = 'Period of Record'

CONFIG.datasets.gdd50 = CONFIG.datasets.compressed.copy('gdd50')
CONFIG.datasets.gdd50.scope = '%(year)d'
CONFIG.datasets.gdd50.description = 'Accumulated Daily GDD (gdd>50)'
CONFIG.datasets.gdd50.timespan = '%(year)d'

CONFIG.datasets.gdd8650 = CONFIG.datasets.gdd50.copy('gdd8650')
CONFIG.datasets.gdd8650.description = 'Accumulated Daily GDD (50<gdd<86)'

CONFIG.datasets.pormax = CONFIG.datasets.gddavg.copy('pormax')
CONFIG.datasets.pormax.path = 'max'
CONFIG.datasets.pormax.description = \
    '%(timespan)s - MAX deviation from AVG %(coverage)s GDD (%%(threshold)s)'

CONFIG.datasets.pormin = CONFIG.datasets.pormax.copy('pormin')
CONFIG.datasets.pormin.path = 'min'
CONFIG.datasets.pormin.description = \
    '%(timespan)s - MIN deviation from AVG %(coverage)s GDD (%%(threshold)s)'

CONFIG.datasets.normal = CONFIG.datasets.doygrid.copy('normal')
CONFIG.datasets.normal.compression = 'gzip'
CONFIG.datasets.normal.chunks = ('num_days',1,1)
CONFIG.datasets.normal.path = 'normal'
CONFIG.datasets.normal.scope = 'normal'
CONFIG.datasets.normal.timespan = 'Climatological Normal'
CONFIG.datasets.normal.description = \
    '%(timespan)s - AVG accumulated GDD (%%(threshold)s)'

CONFIG.datasets.recent = CONFIG.datasets.doygrid.copy('recent')
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
CONFIG.filenames = { 'history':'%(year)d-GDD-%(threshold)s-History.h5',
                     'target':'%(year)d-GDD-%(source)s-Daily.h5',
                   }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# GDD tool filetypes
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CONFIG.filetypes = { 'history' : { 'scope':'season', 'period':'doy', 
                                   'groups':('por',),
                                   'datasets':('lat','lon','recent','normal'), 
                                   'start_day':PROJECT_START_DAY,
                                   'end_day':PROJECT_END_DAY,
                                   'description':'Historical GDD Extremes'
                                 },
                     'target' : { 'scope':'year', 'period':'doy', 
                                  'datasets':('lat','lon','gdd50', 'gdd8650'), 
                                  'start_day':PROJECT_START_DAY,
                                  'end_day':PROJECT_END_DAY,
                                  'description':'Daily Accumulated GDD'
                                }
                    }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# GDD tool data groups
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ConfigObject('groups', CONFIG)

CONFIG.groups.por = { 'path':'por', 'keys':('timespan','threshold',),
       'datasets':('gddavg','pormax','pormin'),
       'start_day':PROJECT_START_DAY, 'end_day':PROJECT_END_DAY,
       'description':'%(timespan)s - Accumulated GDD (%(threshold)s)'
       }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# data sources
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

from atmosci.seasonal.config import CFGBASE
CFGBASE.sources.copy('sources', CONFIG)
del CFGBASE

