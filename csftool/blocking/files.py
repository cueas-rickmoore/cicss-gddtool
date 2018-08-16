
import os,sys

import tornado.template

from csftool.blocking.handler import CsfToolBlockingRequestHandler

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

CSFTOOL_FILE_HANDLERS = { }
IMAGE_RESPONSE = \
        "HTTP/1.1 200 OK\r\nContent-Length: {length:d}\r\nContent-Type:image/png\r\n\r\n{image}"

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #


class CsfToolBlockingFileHandler(CsfToolBlockingRequestHandler):
    """ Put contents of a file into the response.
    Primarily used for accessing local css and javascript files.
    """

    def __call__(self, request):
        if self.debug: print '\nFileRequestHandler', request.uri
        resource_path = self.getResourcePath(request.uri)
        if self.debug: print '    requested file :', resource_path

        with open(resource_path, 'r') as _file_:
            request.write(self.constructResponse(_file_.read()))

CSFTOOL_FILE_HANDLERS['default'] = CsfToolBlockingFileHandler
CSFTOOL_FILE_HANDLERS['file'] = CsfToolBlockingFileHandler


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class CsfToolBlockingImageFileHandler(CsfToolBlockingFileHandler):
    """ Add image from a file to the response.
    """

    def constructResponse(self, content):
        return IMAGE_RESPONSE.format(length=len(content), image=content)

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CSFTOOL_FILE_HANDLERS['icon'] = CsfToolBlockingImageFileHandler
CSFTOOL_FILE_HANDLERS['image'] = CsfToolBlockingImageFileHandler

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class CsfToolBlockingTemplateHandler(CsfToolBlockingRequestHandler):
    """ add contents of a file to the response.
    Primarily used for accessing local css and javascript files.
    """

    def __call__(self, request):
        if self.debug: print '\nTemplateRequestHandler'
        resource_path = self.getResourcePath(request.uri)

        with open(resource_path, 'r') as _file_:
            template = _file_.read()

        variables = self.server_config.project.attrs
        template = tornado.template.Template(template)
        content = template.generate(server_url=self.getHostUrl(request),
                                    **variables)
        request.write(self.constructResponse(content))

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CSFTOOL_FILE_HANDLERS['page'] = CsfToolBlockingTemplateHandler
CSFTOOL_FILE_HANDLERS['tmpl'] = CsfToolBlockingTemplateHandler
CSFTOOL_FILE_HANDLERS['template'] = CsfToolBlockingTemplateHandler

