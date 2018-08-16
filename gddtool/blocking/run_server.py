#!/usr/bin/env python

import os, sys
import socket
import datetime

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from csftool.blocking.server  import CsfToolBlockingHttpServer
from csftool.utils import validateResourceConfiguration

from gddtool.blocking.request import GDDToolBlockingRequestManager

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from gddtool.blocking.data import GDDTOOL_DATA_HANDLERS
from gddtool.blocking.files import GDDTOOL_FILE_HANDLERS

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()
parser.add_option('--log', action='store', type='string', default=None,
                  dest='log_filepath')
parser.add_option('--page', action='store', type='string', default=None,
                  dest='tool_page')
parser.add_option('--plant_day', action='store', type='string', default=None,
                  dest='plant_day')
parser.add_option('--port', action='store', type='int', default=None,
                  dest='server_port')
parser.add_option('--tool', action='store', type='string', default=None,
                  dest='toolname')

parser.add_option('-c', action='store_true', default=False, dest='csftool')
parser.add_option('-d', action='store_true', default=False, dest='demo_mode')
parser.add_option('-p', action='store_true', default=False, dest='prod_mode')
parser.add_option('-t', action='store_true', default=False, dest='test_mode')
parser.add_option('-w', action='store_true', default=False, dest='wpdev_mode')

parser.add_option('-z', action='store_true', default=False, dest='debug')
options, args = parser.parse_args()

debug = options.debug

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #


# allow for specialized alternate tool configurations
if options.prod_mode: mode = "prod"
elif options.test_mode: mode = "test"
elif options.wpdev_mode: mode = "wpdev"
else: mode = "dev"
include_csftool = mode in ("dev", "wpdev") or options.csftool

# import the default GDD server configuration
from gddtool.config import CONFIG as GDD_TOOL_CONFIG
server_config = GDD_TOOL_CONFIG.copy()
# don't drag the tool config around
del GDD_TOOL_CONFIG

mode_config = server_config[mode]
server_config.mode = mode
server_config.update(mode_config.attrs)
server_config.dirpaths = mode_config.dirpaths.attrs
# validate the resources and get full path to each
server_config.resources = \
    { 'gddtool': validateResourceConfiguration(server_config, debug), }

if options.demo_mode:
    server_config.dates = server_config.demo.dates.copy('dates')
    server_config.season = server_config.demo.season

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

plant_day = options.plant_day
if plant_day is not None:
    server_config.tool.default_plant_day = \
                  tuple([int(num) for num in plant_day.split('-')])

if options.toolname is not None:
    toolname = options.toolname
else: toolname = server_config.tool.toolname 
server_config.toolname = toolname

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

# import the CSF tool configuration
if include_csftool:
    from csftool.config import CONFIG as CSF_TOOL_CONFIG
    csftool_config = CSF_TOOL_CONFIG.copy()
    csftool_requests = csftool_config.get('file_requests', None)
    del CSF_TOOL_CONFIG
    # validate the resources and get full path to each
    csftool_config.dirpaths.resources = \
        server_config.dirpaths.resources.replace('gddtool','csftool')
    server_config.resources.csftool = \
        validateResourceConfiguration(csftool_config, debug)
    del csftool_config

# create a request manager
request_manager =  GDDToolBlockingRequestManager(server_config)
request_manager.registerResponseHandlerClasses(toolname,
                                               **GDDTOOL_FILE_HANDLERS)
request_manager.registerResponseHandlerClasses(toolname,
                                               **GDDTOOL_DATA_HANDLERS)
#file_requests = server_config.file_requests.attrs
#print file_requests
#request_manager.registerResponseHandlers(toolname, file_requests)

if include_csftool:
    from csftool.blocking.files import CSFTOOL_FILE_HANDLERS
    request_manager.registerResponseHandlerClasses('csftool',
                                                   **CSFTOOL_FILE_HANDLERS)
    #if csftool_requests is not None:
    #    request_manager.registerHandlersForRequests('csftool',
    #                                                csftool_requests.attrs)

# create an HTTP server
http_server = CsfToolBlockingHttpServer(server_config, request_manager)
# run the server
http_server.run()

