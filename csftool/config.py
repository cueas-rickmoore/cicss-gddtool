
import os

from atmosci.utils.config import ConfigObject, ConfigMap

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

SERVER_DIRPATH = os.path.split(os.path.abspath(__file__))[0]
PKG_DIRPATH = SERVER_DIRPATH[:SERVER_DIRPATH.rfind(os.sep)]
RESOURCE_PATH = os.path.join(SERVER_DIRPATH, 'resources')

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

CONFIG = ConfigObject('config', None)
# tool name - used in request/response uri
CONFIG.tool = { 'toolname':'csftool', }

CONFIG.demo = ConfigObject('demo', CONFIG)
CONFIG.demo.csftool_url = 'http://tools.climatesmartfarming.org/csftool'
CONFIG.demo.server_address = 'http://tools.climatesmartfarming.org'
CONFIG.demo.server_port = 20003
CONFIG.demo.server_url = 'http://tools.climatesmartfarming.org'

CONFIG.dev = CONFIG.demo.copy("dev")
CONFIG.dev.csftool_url = 'http://localhost:8081/csftool'
CONFIG.dev.server_address = 'http://localhost'
CONFIG.dev.server_port = 8081
CONFIG.dev.server_url = 'http://localhost:8081'

CONFIG.prod = CONFIG.demo.copy("prod")

CONFIG.test = CONFIG.dev.copy("test")
CONFIG.test.csftool_url = 'http://cyclone.nrcc.cornell.edu:8081/csftool'
CONFIG.test.server_address = 'http://cyclone.nrcc.cornell.edu'
CONFIG.test.server_url = 'http://cyclone.nrcc.cornell.edu:8081'

# paths to application directories
CONFIG.dirpaths = { 'package':PKG_DIRPATH, # CSF tool package directory
                    'resources':RESOURCE_PATH, # CSF tool resource directory
                    'server':SERVER_DIRPATH, # CSF tool server directory
                  } 
# delete the directory path constants
del PKG_DIRPATH, RESOURCE_PATH, SERVER_DIRPATH

# paths to resource files
CONFIG.resource_map = ConfigMap( { 'icons'  : ('icon',  'dir',  'icons'),
                                   'images' : ('image', 'dir',  'images'),
                                   'js'     : ('file',  'dir',  'js'),
                                   'style'  : ('file',  'dir',  'style'),
                                   'pages'  : ('page',  'dir',  'pages'),
                               } )

CONFIG.server_port = 8081
CONFIG.server_url = 'cyclone.nrcc.cornell.edu'

CONFIG.templates = ( )

