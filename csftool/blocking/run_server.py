#!/usr/bin/env python

import os, sys
import socket
import datetime

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from csftool.blocking.request  import CsfToolBlockingRequestManager
from csftool.blocking.server  import CsfToolBlockingHttpServer
from csftool.utils import validateResourceConfiguration

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from csftool.blocking.files import CSFTOOL_FILE_HANDLERS

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()
parser.add_option('--log', action='store', type='string', default=None,
                  dest='log_filepath')
parser.add_option('--page', action='store', type='string', default=None,
                  dest='tool_page')
parser.add_option('--port', action='store', type='int', default=None,
                  dest='server_port')
parser.add_option('--tool', action='store', type='string', default=None,
                  dest='toolname')

parser.add_option('-d', action='store_true', default=False, dest='demo_mode')
parser.add_option('-p', action='store_true', default=False, dest='prod_mode')
parser.add_option('-t', action='store_true', default=False, dest='test_mode')
parser.add_option('-w', action='store_true', default=False, dest='wpdev_mode')

parser.add_option('-z', action='store_true', default=False, dest='debug')
options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# import thedefault CSF server configuration
from csftool.config import CONFIG
server_config = CONFIG.copy()
resources = validateResourceConfiguration(CONFIG, options.debug)
del server_config['resources']
# validate the resources and get full path to each
server_config.resources = { "csftool" : resources, }
# don't drag the CSF tool config around
del CONFIG

# look for a config overrides file
cfgfile = None
if 'CSF_CSFTOOL_CONFIG_PY' in os.environ:
    cfgfile = open(os.environ['CSF_CSFTOOL_CONFIG_PY'],'r')
else:
    dirpath = os.path.split(os.path.abspath(__file__))[0]
    filepath = os.path.join(dirpath, 'server_config.py')
    if os.path.exists(filepath):
        cfgfile = open(filepath,'r')
if cfgfile is not None:
    overrides = eval(cfgfile.read())
    cfgfile.close()
    server_config.update(overrides)

if options.toolname is not None:
    server_config.toolname = options.toolname
elif "tool" in server_config:
    if "toolname" in server_config.tool:
        server_config.toolname = server_config.tool.toolname 

if options.prod_mode:
    server_config.mode = "prod"
    server_config.update(server_config.prod.attrs)
elif options.demo_mode:
    server_config.mode = "demo"
    server_config.update(server_config.demo.attrs)
elif options.test_mode:
    server_config.mode = "test"
    server_config.update(server_config.test.attrs)
else:
    server_config.mode = "dev"
    server_config.update(server_config.dev.attrs)

server_config.debug = options.debug

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

# create a request manager
request_manager =  CsfToolBlockingRequestManager(server_config)
request_manager.registerResponseHandlerClasses('csftool',
                                                **CSFTOOL_FILE_HANDLERS)
file_requests = server_config.get('file_requests', None)
if file_requests is not None:
    request_manager.registerResponseHandlers('csftool', file_requests.attrs)
# create an HTTP server
http_server = \
    CsfToolBlockingHttpServer(server_config, request_manager)
# run the server
http_server.run()

