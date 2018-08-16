
from tornado.httputil import HTTPHeaders, ResponseStartLine

from csftool.methods import CsfToolRequestHandlerMethods


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

ALLOWED_HEADERS = (
        "Accept","Accept-Encoding","Accept-Language","Cache-Control",
        "Content-Type","Depth","If-Modified-Since","Origin","User-Agent",
        "X-File-Size","X-File-Name", "X-Requested-With","X-Requested-By"
        )


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class CsfToolBlockingRequestHandler(CsfToolRequestHandlerMethods, object):

    def __init__(self, server_config, debug=False, **kwargs):
        self.debug = debug
        self.setServerConfig(server_config)

        if kwargs: self.setHandlerAttributes(self, **kwargs)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class CsfToolOptionsRequestHandler(CsfToolBlockingRequestHandler):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def __call__(self, request):
        if self.debug:
            print 'OPTIONS REQUEST :: processed via CsfToolOptionsRequestHandler'
        allowed = list(ALLOWED_HEADERS)
        requested = request.headers['Access-Control-Request-Headers']
        if ',' in requested:
            for header in requested.split(','):
                if not header in allowed: allowed.append(header)
        else:
            if not requested in allowed: allowed.append(requested)

        headers = { "Access-Control-Allow-Origin":request.headers["Origin"],
                    "Access-Control-Allow-Credentials":"true",
                    'Access-Control-Allow-Headers':','.join(allowed),
                    'Access-Control-Max-Age':'1728000',
                    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
                    "Content-Length":'0',
                    "Content-Type":"text/html; charset=UTF-8"
                  }
        request.connection.write_headers(
                           ResponseStartLine(request.version, 204, 'OK'),
                           HTTPHeaders(**headers)
                           )
        request.connection.write('')
        request.connection.finish()

