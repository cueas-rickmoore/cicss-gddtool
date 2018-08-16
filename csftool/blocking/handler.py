
from csftool.methods import CsfToolRequestHandlerMethods

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class CsfToolBlockingRequestHandler(CsfToolRequestHandlerMethods, object):

    def __init__(self, server_config, debug=False, **kwargs):
        self.debug = debug
        self.setServerConfig(server_config)

        if kwargs: self.setHandlerAttributes(self, **kwargs)

