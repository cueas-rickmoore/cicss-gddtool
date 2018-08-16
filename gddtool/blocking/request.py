
from tornado.httputil import HTTPHeaders, ResponseStartLine

from csftool.blocking.request import CsfToolBlockingRequestManager

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

ALLOWED_HEADERS = (
        "Accept","Accept-Encoding","Accept-Language","Cache-Control",
        "Content-Type","Depth","If-Modified-Since","Origin","User-Agent",
        "X-File-Size","X-File-Name", "X-Requested-With","X-Requested-By"
        )

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolBlockingRequestManager(CsfToolBlockingRequestManager):

    def __init__(self, server_config, log_filepath=None):
        # initialize requirements inherited from the base request manager
        CsfToolBlockingRequestManager.__init__(self, server_config,
                                                     log_filepath)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def __call__(self, request):
        if self.debug:
            print '\n\nreceived request\n', request, '\n\n'
        if request.method != 'OPTIONS':
            CsfToolBlockingRequestManager.__call__(self, request)
        else:
            self.respondToOptionsRequest(request)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def respondToOptionsRequest(self, request):
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

