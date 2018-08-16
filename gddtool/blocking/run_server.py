#!/usr/bin/env python

import os, sys
import socket
import datetime

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from csftool.blocking.server  import CsfToolBlockingHttpServer
from csftool.utils import validateResourceConfiguration

from gddtool.blocking.request import GDDToolBlockingRequestManager

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from csftool.blocking.files import CSFTOOL_FILE_HANDLERS

from gddtool.blocking.data import GDDTOOL_DATA_HANDLERS
from gddtool.blocking.files import GDDTOOL_FILE_HANDLERS

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()
parser.add_option('--local', action='store_true', default=False, dest='localhost')
parser.add_option('--log', action='store', type='string', default=None,
                  dest='log_filepath')
parser.add_option('--page', action='store', type='string', default=None,
                  dest='tool_page')
parser.add_option('--pkg', action='store', type='string', default=None,
                  dest='pkg_dirpath')
parser.add_option('--plant_day', action='store', type='string', default=None,
                  dest='plant_day')
parser.add_option('--port', action='store', type='int', default=None,
                  dest='server_port')
parser.add_option('--region', action='store', type='string', default=None,
                  dest='region_key')
parser.add_option('--source', action='store', type='string', default=None,
                  dest='source_key')
parser.add_option('--tool', action='store', type='string', default=None,
                  dest='toolname')

parser.add_option('-c', action='store_false', default=True, dest='csftool')
parser.add_option('-d', action='store_true', default=False, dest='demo_mode')
parser.add_option('-p', action='store_true', default=False, dest='prod_mode')
parser.add_option('-t', action='store_true', default=False, dest='test_mode')
parser.add_option('-w', action='store_true', default=False, dest='wpdev_mode')

parser.add_option('-z', action='store_true', default=False, dest='debug')
options, args = parser.parse_args()

debug = options.debug

include_csftool_resources = options.csftool

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# import the default GDD server configuration
from gddtool.config import CONFIG as GDD_TOOL_CONFIG
server_config = GDD_TOOL_CONFIG.copy()
del server_config['resources']
# validate the resources and get full path to each
gdd_resources = validateResourceConfiguration(GDD_TOOL_CONFIG)
# don't drag the tool config around
del GDD_TOOL_CONFIG
# create a new resources config 
server_config.resources = { 'gddtool':gdd_resources, }
del gdd_resources

# look for a config overrides file
cfgfile = None
if 'CSF_GDDTOOL_CONFIG_PY' in os.environ:
    cfgfile = open(os.environ['CSF_GDDTOOL_CONFIG_PY'],'r')
else:
    dirpath = os.path.split(os.path.abspath(__file__))[0]
    filepath = os.path.join(dirpath, 'server_config.py')
    if os.path.exists(filepath):
        cfgfile = open(filepath,'r')
if cfgfile is not None:
    overrides = eval(cfgfile.read())
    cfgfile.close()
    server_config.update(overrides)

# apply overrides from command line
if options.source_key is not None:
    server_config.tool.data_source_key = options.source_key

if options.region_key is not None:
    server_config.tool.data_region_key = options.region_key

if options.pkg_dirpath is not None:
    server_config.dirpaths.package = os.path.abspath(options.pkg_dirpath)

plant_day = options.plant_day
if plant_day is not None:
    server_config.tool.default_plant_day = \
                  tuple([int(num) for num in plant_day.split('-')])

if options.toolname is not None:
    toolname = options.toolname
else: toolname = server_config.tool.toolname 
server_config.toolname = toolname

# allow for specialized alternate tool pages

if options.prod_mode:
    server_config.mode = "prod"
    server_config.update(server_config.prod.attrs)
    include_csftool_resources = False
elif options.demo_mode:
    server_config.mode = "demo"
    server_config.update(server_config.demo.attrs)
    include_csftool_resources = False
elif options.test_mode:
    server_config.mode = "test"
    server_config.update(server_config.test.attrs)
elif options.wpdev_mode:
    server_config.mode = "wpdev"
    server_config.update(server_config.wpdev.attrs)
else:
    server_config.mode = "dev"
    server_config.update(server_config.dev.attrs)

if options.tool_page is None:
    tool_page = server_config.get('home', None)
else: tool_page = options.tool_page

if tool_page is not None:
    abspath = os.path.abspath(tool_page)
    if not os.path.exists(abspath):
        gdd_resource_path = server_config.dirpaths.resources
        tool_page = os.path.join(gdd_resource_path, 'pages', tool_page)
        if not os.path.exists(tool_page):
            raise IOError, 'invalid file path for home page : %s' % tool_page
    else: tool_page = abspath 
    # create a new resources entry in the server config
    server_config.resources.gddtool['/'] = ('page', 'file', tool_page)

if options.log_filepath is not None:
    import logging
    log_filepath = os.path.abspath(options.log_filepath)
    app_logger = logging.getLogger("tornado.application")
    app_logger.addHandler(logging.FileHandler(log_filepath))


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# track the pid for use by rc.d script
if len(args) > 0:
    pid_filepath = os.path.abspath(args[0])
    pid_file = open(pid_filepath, 'w')
    pid_file.write('%d' % os.getpid())
    pid_file.close()

server_config.debug = debug
# create a request manager
request_manager =  GDDToolBlockingRequestManager(server_config)
request_manager.registerResponseHandlers(toolname, **GDDTOOL_FILE_HANDLERS)
request_manager.registerResponseHandlers(toolname, **GDDTOOL_DATA_HANDLERS)

# import the CSF tool configuration
if include_csftool_resources:
    from csftool.config import CONFIG as CSF_TOOL_CONFIG
    # validate the resources and get full path to each
    csf_resources = validateResourceConfiguration(CSF_TOOL_CONFIG)
    # don't drag the CSF tool config around
    del CSF_TOOL_CONFIG
    server_config.resources.csftool = csf_resources
    del csf_resources
    request_manager.registerResponseHandlers('csftool',**CSFTOOL_FILE_HANDLERS)

# create an HTTP server
http_server = \
    CsfToolBlockingHttpServer(server_config, request_manager)
# run the server
http_server.run()

