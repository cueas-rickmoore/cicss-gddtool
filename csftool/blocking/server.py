
import tornado.httpserver
import tornado.ioloop

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class CsfToolBlockingHttpServer(object):

    def __init__(self, server_config, request_manager):
        self.port = server_config.get('server_port', 80)
        self.request_manager = request_manager
        self.server_config = server_config.copy()

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def run(self):
        # create an HTTP server
        http_server = tornado.httpserver.HTTPServer(self.request_manager)
        http_server.listen(self.port)
        # initiate the event loop
        ioloop = tornado.ioloop.IOLoop.instance()
        ioloop.start()

