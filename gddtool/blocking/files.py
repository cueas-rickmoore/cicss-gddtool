
import os,sys
from copy import deepcopy
import datetime

import tornado.template

from csftool.blocking.files import CsfToolBlockingFileHandler
from csftool.blocking.files import CsfToolBlockingImageFileHandler

from gddtool.blocking.handler import GDDToolBlockingRequestHandler

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

GDDTOOL_FILE_HANDLERS = { 'file' : CsfToolBlockingFileHandler,
                          'icon' : CsfToolBlockingImageFileHandler,
                          'image' : CsfToolBlockingImageFileHandler }

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolBlockingTemplateHandler(GDDToolBlockingRequestHandler):
    """ add contents of a file to the response.
    Primarily used for accessing local css and javascript files.
    """

    def __call__(self, request):
        if self.debug:
            print '\nGDDToolBlockingTemplateHandler'
            print "processing request for", request.uri

        resource_path = self.getResourcePath(request.uri)
        if self.debug: print 'resource path', resource_path

        with open(resource_path, 'r') as _file_:
            template = tornado.template.Template(_file_.read())

        request_dict = self.requestAsDict(request)
        parameter_dict = self.extractTemplateParameters(request_dict)
        content = template.generate(csf_server_url=self.getHostUrl(request),
                                    **parameter_dict)

        request.write(self.constructResponse(content.replace('&quot;','"')))

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractTemplateParameters(self, request_dict):
        params = { 'server_url':self.server_config.server_url,
                   'tool_url':self.server_config.gddtool_url,
                 }
        if 'csftool_url' in self.server_config:
            params['csftool_url'] = self.server_config.csftool_url
        return params

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

GDDTOOL_FILE_HANDLERS['/'] = GDDToolBlockingTemplateHandler
GDDTOOL_FILE_HANDLERS['page'] = GDDToolBlockingTemplateHandler
GDDTOOL_FILE_HANDLERS['tmpl'] = GDDToolBlockingTemplateHandler
GDDTOOL_FILE_HANDLERS['template'] = GDDToolBlockingTemplateHandler

GDDTOOL_FILE_HANDLERS['/test-gddtool.html'] = GDDToolBlockingTemplateHandler
GDDTOOL_FILE_HANDLERS['/wpdev-gddtool.html'] = GDDToolBlockingTemplateHandler
GDDTOOL_FILE_HANDLERS['load-dependencies.js'] = GDDToolBlockingTemplateHandler
GDDTOOL_FILE_HANDLERS['/load-dependencies.js'] = GDDToolBlockingTemplateHandler
GDDTOOL_FILE_HANDLERS['dev-load-dependencies.js'] = GDDToolBlockingTemplateHandler
GDDTOOL_FILE_HANDLERS['/dev-load-dependencies.js'] = GDDToolBlockingTemplateHandler
GDDTOOL_FILE_HANDLERS['test-load-dependencies.js'] = GDDToolBlockingTemplateHandler
GDDTOOL_FILE_HANDLERS['/test-load-dependencies.js'] = GDDToolBlockingTemplateHandler
GDDTOOL_FILE_HANDLERS['toolinit.js'] = GDDToolBlockingTemplateHandler
GDDTOOL_FILE_HANDLERS['/toolinit.js'] = GDDToolBlockingTemplateHandler


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolBlockingInitHandler(GDDToolBlockingTemplateHandler):
    """ Assemble configuration parameters for the tool initialization script.
    """

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractTemplateParameters(self, request_dict):
        # start with dates of current season 
        parameter_dict = self.extractSeasonParameters(request_dict)

        urls = GDDToolBlockingTemplateHandler.extractTemplateParameters(self,
                                              request_dict)
        parameter_dict.update(urls)

        # add plant date
        plant_date = request_dict.get('plant_date', None)
        if plant_date is None:
            year = int(parameter_dict['season'])
            plant_date = datetime.date(year, *self.tool.default_plant_day)
        parameter_dict['plant_date'] = plant_date

        # add GDD threshold
        parameter_dict['gdd_threshold'] = \
            request_dict.get('gdd_threshold', self.tool.default_threshold)

        # add location parameters
        location = self.extractLocationParameters(request_dict)
        coords = location['coords']
        parameter_dict['location_lat'] = coords[0]
        parameter_dict['location_lon'] = coords[1]
        parameter_dict['location_key'] = location['key']
        parameter_dict['location_address'] = location['address']

        # prameters specific to toolint.js script initialization
        parameter_dict['button_labels'] = self.tool.button_labels
        parameter_dict['chart_labels'] = self.tool.chart_labels
        parameter_dict['chart_types'] = self.tool.chart_types
        parameter_dict['server_url'] = self.server_config.server_url
        parameter_dict['toolname'] = self.toolname

        return parameter_dict

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

GDDTOOL_FILE_HANDLERS['tool'] = GDDToolBlockingInitHandler
GDDTOOL_FILE_HANDLERS['tool.js'] = GDDToolBlockingInitHandler
GDDTOOL_FILE_HANDLERS['/tool.js'] = GDDToolBlockingInitHandler
GDDTOOL_FILE_HANDLERS['dev-tool.js'] = GDDToolBlockingInitHandler
GDDTOOL_FILE_HANDLERS['/dev-tool.js'] = GDDToolBlockingInitHandler
GDDTOOL_FILE_HANDLERS['test-tool.js'] = GDDToolBlockingInitHandler
GDDTOOL_FILE_HANDLERS['/test-tool.js'] = GDDToolBlockingInitHandler

