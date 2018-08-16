
import os

from atmosci.utils.config import ConfigObject, ConfigMap

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

SERVER_DIRPATH = os.path.split(os.path.abspath(__file__))[0]
PKG_DIRPATH = SERVER_DIRPATH[:SERVER_DIRPATH.rfind(os.sep)]
RESOURCE_PATH = os.path.join(SERVER_DIRPATH, 'resources')

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

CONFIG = ConfigObject('config', None)

# tool name - used in request/response uri
CONFIG.toolname = 'csftool'


# paths to application directories
CONFIG.dirpaths = { 'package':PKG_DIRPATH, # CSF tool package directory
                    'resources':RESOURCE_PATH, # CSF tool resource directory
                    'server':SERVER_DIRPATH, # CSF tool server directory
                  } 

# paths to resource files
CONFIG.resources = ConfigMap( { 'icons'  : ('icon',  'dir',  'icons'),
                                'images' : ('image', 'dir',  'images'),
                                'js'     : ('file',  'dir',  'js'),
                                'style'  : ('file',  'dir',  'style'),
                              } )

CONFIG.server_port = 8088
CONFIG.server_url = 'cyclone.nrcc.cornell.edu'

CONFIG.templates = ( )

# delete the directory path constants
del PKG_DIRPATH, RESOURCE_PATH, SERVER_DIRPATH

