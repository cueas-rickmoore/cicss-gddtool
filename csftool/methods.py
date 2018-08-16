
import os
import datetime
import json

import tornado
from tornado.httputil import HTTPHeaders, ResponseStartLine

from atmosci.utils.timeutils import DateIterator

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

SIMPLE_RESPONSE = "HTTP/1.1 200 OK\r\nContent-Length: {length:d}\r\n\r\n{content}"

INVALID_URI = 404
NO_CONTENT = 204

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class RequestHandlerAttributes(object):

    def __init__(self, **kwargs):
        self.attributes = kwargs.copy()
        self.reset()

    def __iter__(self): return self

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def next(self):
        if self._attr_keys_:
            key = self._attr_keys_.pop()
            return (key, self.attributes[key])
        # automatically reset so it can be used again
        self.reset()
        # but stop the current iteration
        raise StopIteration

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def reset(self):
        self._attr_keys_ = list(self.attributes.keys())
        self._attr_keys_.sort()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class CsfToolRequestHandlerMethods:

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def __call__(self, request):
        raise NotImplementedError

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def appDateFormat(self, date):
        return date.strftime('%Y-%m-%d')

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # DEPRECATED - DO NOT USE - FOR BACKWARD COMPATIBILITY ONLY 
    def constructResponse(self, content):
        return SIMPLE_RESPONSE.format(length=len(content), content=content)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def decodeUri(self, uri):
        # asking for the tool dev page
        if uri == '/' or uri == '/%s/' % self.toolname: 
            if self.mode == "test":
                return self.toolname, 'page', ('/',)
            else: return INVALID_URI

        # asking for a REST api query
        q = uri.find('?')
        if q > 0:
            # uri form must be "/resource_group/query_type?query"
            root_uri, query = uri.split('?')
            if root_uri[0] == '/': root_uri = root_uri[1:]
            resource_group, query_type = root_uri.split('/')
            if self.debug:
                print 'query reuest :', resource_group, query_type, query
            return resource_group, 'query', (query_type, query)

        # all other resources must be fully defined
        if uri[0] == '/': uri_path = uri[1:].split('/')
        else: uri_path = uri.split('/')

        # look for data or file resources
        if len(uri_path) == 3:
            if self.debug: print 'decodeUri :', uri_path
            resource_group = uri_path[0]
            resource_type = uri_path[1]
            if resource_type == 'data': return tuple(uri_path)
            resource_name = uri_path[2]
            resource_path = '/'.join(uri_path[1:])
            if resource_name in self.templates \
            or resource_path in self.templates:
                return resource_group, 'template', tuple(uri_path[1:])
            if '.htm' in os.path.splitext(resource_name)[1] :
                return resource_group, 'page', tuple(uri_path[1:])
            return resource_group, 'file', tuple(uri_path[1:])
        elif len(uri_path) == 2:
            if (uri_path[0] in (self.toolname, 'csftool')):
                resource_path = uri_path[1]
                if '.' in resource_path:
                    resource_type = uri_path[1].split('.')[1]
                    if resource_type.startswith('htm'):
                        return self.toolname, 'page', ('pages',resource_path)
                    return uri_path[0], 'file', (resource_type, resource_path)
                else: return self.toolname, 'file', tuple(uri_path)
            else: return self.toolname, 'file', tuple(uri_path)
        return INVALID_URI

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def defaultLocation(self):
        location = self.tool.get('location', None)
        if location is None:
            locations = self.tool.get('locations', None)
            if locations is not None:
                default = self.tool.get('default_location', None)
                if default is not None:
                    location = locations[default]

        if location is not None:
            return { 'key': location.get('key', location.name),
                     'address': location.address,
                     'coords': [ location.lat, location.lon ], }
        else: return NO_CONTENT

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractLocationParameters(self, request_dict):
        location_dict = request_dict.get('location', None)
        if location_dict is None:
            location_dict = self.defaultLocation()

        if 'coords' not in location_dict:
            location_dict['coords'] = \
                [ location_dict['lat'], location_dict['lon'] ]
            del location_dict['lat'], location_dict['lon']

        if 'id' in location_dict:
            if 'key' not in location_dict:
                location_dict['key'] = location_dict['id']
            del location_dict['id'] 

        return location_dict

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractSeasonDates(self, request_dict, year=None):
        if year is None:
            year = request_dict.get('season', None)
            if year is None:
                year  = self.mode_config.get('season', None)
            if year is None: year = datetime.date.today().year
        if isinstance(year, basestring): year = int(year)

        start_date = request_dict.get('season_start', None)
        if start_date is None:
            start_date = self.appDateFormat(self.seasonStartDate(year))
        parameter_dict = { 'season':year, 'season_start':start_date }

        end_date = request_dict.get('season_end', None)
        if end_date is None:
            end_date = self.appDateFormat(self.seasonEndDate(year))
        parameter_dict['season_end'] = end_date

        return parameter_dict

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractSeasonParameters(self, request_dict, year=None):
        parameter_dict = self.extractSeasonDates(request_dict, year)
        season = str(parameter_dict['season'])

        description = request_dict.get('season_description', None)
        if description is None:
            description = self.formatSeasonDescription(season)
        parameter_dict['season_description'] = description

        return parameter_dict

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def formatSeasonDescription(self, season):
        return self.server_config.season_description % {'season': season}

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def handleInvalidRequest(self, request):
        """ default request handler
        """
        template = "HTTP/1.1 200 OK\r\nContent-Length: %d\r\n\r\n%s"
        msg = "Unknown request URI : %s" % request.uri
        request.write(template % (len(msg), msg))
        if self.debug: print 'handleInvalidRequest :', msg

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def hostUrl(self, request):
        host = request.host
        try:
            if 'localhost' in host:
                host = request.headers['X-Forwarded-Server']
        except: pass
        return "%s://%s" % (request.protocol,host)
    getHostUrl = hostUrl

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def locations(self):
        locations = self.tool.get('locations', None)
        if locations is not None:
            locs = [ ]
            for key in locations.asDict():
                loc = locations[key]
                locs.append( { 'key': key, 'address': loc.address,
                               'coords': [ loc.lat, loc.lon ] }
                           )
            return locs

        location = self.tool.get('location', None)
        if location is not None:
            return [ { 'key': location.key, 'address': location.address,
                       'coords': [ location.lat, location.lon ] },
                   ]

        else: return NO_CONTENT

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def requestAsDict(self, request):
        if '?' in request.uri:
            root_uri, query = request.uri.split('?')
            request_dict = self.uriQueryToDict(query)
        else:
            request_data = tornado.escape.url_unescape(request.body)
            if len(request_data) == 0: return  { }
            try:
                request_dict = tornado.escape.json_decode(request_data)
            except Exception as e:
                raise ValueError(request.body)

        if self.debug: print '\nrequestAsDict\n', request_dict
        return request_dict

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def resourceConfig(self, resource_group, resource_path):
        resources = self.resources.get(resource_group, None)
        if resources is not None:
            config = resources.get(resource_path[0], None)
            if config: return config
        return self.resources.get(resource_path[0], None) 
    getResourceConfig = resourceConfig

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def resourcePath(self, uri):
        if uri == '/': # asking for the tool dev page
            resource_group = self.toolname
            resource_path = '/'
        elif uri.endswith('.html'):
            # handle alternative pages used in debug & development
            resource_group = self.toolname
            resource_path = uri
        else: # all other resources must be fully defined
            if uri[0] == '/': split_uri = uri[1:].split('/')
            else: split_uri = uri.split('/')
            resource_group = split_uri[0]
            resource_path = split_uri[1:]

        config = self.resourceConfig(resource_group, resource_path)
        # got a valid resource, figure out it's path 
        if config is not None:
            x, rtype, config_path = config
            # resource is the full path to a file
            if rtype == 'file':
                return config_path 

            # resource is a directory path, need the uri_path to complete it
            if rtype == 'dir':
                if len(resource_path) == 1:
                    filepath = os.path.join(config_path, resource_path[0])
                else: filepath = os.path.join(config_path, *resource_path[1:])
                return filepath
            
        # no such resource
        return INVALID_URI
    getResourcePath = resourcePath

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def respondToConnection(self, request, response_json):
        headers = { "Access-Control-Allow-Origin":request.headers["Origin"],
                    # "Content-Type":"application/json",
                    "Content-Length":"%d" % len(response_json),
                  }
        request.connection.write_headers(
                           ResponseStartLine(request.version, 200, 'OK'),
                           HTTPHeaders(**headers)
                           )
        request.connection.write(response_json)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def respondWithJSON(self, request, response_json):
        response = "HTTP/1.1 200 OK"
        header = "Content-Type: application/json"
        response = "%s\r\n%s" % (response,header)
        header = "Content-Length: %d" % len(response_json)
        response = "%s\r\n%s" % (response,header)
        if "Origin" in request.headers:
            origin = request.headers["Origin"]
            header = "Access-Control-Allow-Origin: %s" % origin
            response = "%s\r\n%s" % (response,header)
        response = "%s\r\n\r\n%s" % (response,response_json)
        request.write(response)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def serializeDates(self, start_date, end_date, fmt='%Y-%m-%d'):
        dates = [ date.strftime(fmt)
                  for date in DateIterator(start_date, end_date) ]
        return self.tightJsonString(dates)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def serializeData(self, data, template="%.3f"):
        return '[%s]' % ','.join([template % x for x in data])

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def seasonEndDate(self, target_year):
        return datetime.date(target_year, *self.tool.season_end_day)

    def seasonStartDate(self, target_year):
        start_day = self.tool.season_start_day
        if start_day[0] > self.tool.season_end_day[0]:
            return datetime.date(target_year-1, *start_day)
        return datetime.date(target_year, *start_day)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def setHandlerAttributes(self, **kwargs):
        self.attributes = RequestHandlerAttributes(**kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def setServerConfig(self, server_config):
        self.server_config = config = server_config.copy('config', None)
        self.setToolConfig(config)
        tool = self.tool
        toolname = self.toolname

        # construct resource search order
        search_order = tool.get('inherit_resources', None)
        if search_order is not None:
            if toolname not in search_order:
                if isinstance(search_order, tuple):
                    search_order =  (toolname,) + search_order
                elif isinstance(search_order, list):
                    search_order = tuple([toolname,].extend[search_order])
            self.resource_search = search_order
        else: self.resource_search = (toolname,)

        # create attribute for reference to resources config
        self.resources = config.resources.copy('resources', None)

        # create attribute for list of template requests
        self.templates = config.get('request_types.template',())

        # create dmode attribute to override dataset provided dates
        # with a consitent set of dates from the config file
        self.mode = config.mode
        
        mode_config = 'modes.%s' % self.mode
        self.mode_config = config.get(mode_config, None)
        # DEPRECATED - USE CONFIG.modes configuration tree in stead
        if self.mode_config is None:
            self.mode_config = config.get(self.mode, None)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def setToolConfig(self, server_config):
        # create attribute for reference to tool config
        self.tool = server_config.get('tool', None)
        if self.tool is not None:
            self.toolname = toolname = self.tool.get('toolname', 'csftool')
        else: self.toolname = 'csftool'

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def tightJsonString(self, value):
        return json.dumps(value, separators=(',', ':'))

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def uriQueryToDict(self, uri_args):
        arg_dict = { }
        for pair in uri_args.split('&'):
            key, value = pair.split('=')
            arg_dict[key] = value
        return arg_dict

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class CsfToolVarietyRequestHandlerMethods(CsfToolRequestHandlerMethods):
    # REQUIRED : HANDLER MUST BE DERIVED FROM A HANDLER WITH A "tool"
    # CondfigObject PROPERTY AND ONE OF :
    #     1) the "tool" config contains a ConfigObject named "variety"
    #        containing attributes for a single plant variety
    #     2) the handler's "tool" config contains a ConfigObject
    #        named "varieties" containing multiple plant variety
    #        ConfigObjects PLUS either:
    #        b) the "varieties" config object contains a string attribute 
    #           named "default_variety"
    #        a) the handler's "tool" object contains a string attribute
    #           named "default_variety"

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractVarietyParameters(self, request):
        tool = self.tool
        variety = request.get('variety', None)
        if variety is None:
            location = request.get('location', None)
            if location is not None:
                variety = location.get('variety', None)

        if variety is None:
            variety = tool.get('variety', tool.get('default_variety',
                      tool.get('varieties.default_variety', None) ) )
        if variety is not None: return { 'variety':variety }

        errmsg = 'Unable to determine variety from request or %s'
        errmsg = errmsg % self.__class__.__name__
        raise LookupError, '%s configuration properties.' % errmsg

