
from atmosci.seasonal.factory import BasicSeasonalProjectFactory

from csftool.methods import CsfToolRequestHandlerMethods

from gddtool.handler import GDDToolRequestHandlerMethods

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

GDDTOOL_OPTIONS_HANDLER = None

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolBlockingRequestHandler(GDDToolRequestHandlerMethods,
                                    CsfToolRequestHandlerMethods,
                                    BasicSeasonalProjectFactory):

    def __init__(self, server_config, debug=False, **kwargs):
        # initialize the factory and it's inherited config/registry
        BasicSeasonalProjectFactory.__init__(self)
        # server config requirements for CsfToolRequestHandlerMethods
        self.setServerConfig(server_config)
        # cache GDDTool-specific items from server config
        self.setProjectConfig(server_config)
        # additional attributes required by specific request handlers
        if kwargs: self.setHandlerAttributes(self, **kwargs)

        self.debug = debug

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolOptionsRequestHandler(object):

    def __init__(self, server_config, debug=False, **kwargs):
        self.server_config = server_config.copy()
        self.debug = debug

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def __call__(self, request):
        if self.debug: print '\nGDDToolOptionsRequestHandler'

        # set options headers
        request.set_header("Access-Control-Allow-Origin", "*")
        request.set_header("Access-Control-Allow-Credentials", "true")
        request.set_header('Access-Control-Max-Age', 1728000)
        request.set_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        request.set_header("Content-Length", 0)
        request.set_header("Content-Type", "text/html; charset=UTF-8")

        #request.set_header("Access-Control-Allow-Headers",
        #    "Accept,Accept-Encoding,Accept-Language,Cache-Control,Content-Type,Depth,If-Modified-Since,Origin,User-Agent,X-File-Size,X-File-Name,X-Requested-With,X-Requested-By")
        req_headers = request.getHeader('Access-Control-Request-Headers')
        request.setHeader('Access-Control-Allow-Headers', req_headers)

        request.set_status(204)
        request.write('')

GDDTOOL_OPTIONS_HANDLER = GDDToolOptionsRequestHandler
