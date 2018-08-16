
import os
import json
import tornado

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

SIMPLE_RESPONSE = "HTTP/1.1 200 OK\r\nContent-Length: {length:d}\r\n\r\n{content}"

INVALID_URI = 404

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

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def constructResponse(self, content):
        return SIMPLE_RESPONSE.format(length=len(content), content=content)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def decodeUri(self, uri):
        # asking for the tool dev page
        if uri == '/': 
            if self.test_mode:
                return self.toolname, '/', ('/',)
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
        if len(uri_path) > 1:
            resource_group = uri_path[0]
            uri_path = uri_path[1:]
            # test for a data request
            if uri_path[0] in self.data_requests:
                return resource_group, 'data', tuple(uri_path)
            # test for a templated resource
            resource_key = uri_path[0]
            path = '/%s' % '/'.join(uri_path)
            if path in self.templates:
                return resource_group, 'template', tuple(uri_path)
        else:
            resource_group = 'csftool'
            if uri_path[0] in self.data_requests:
                return resource_group, 'data', tuple(uri_path)
            if uri_path[0] in self.templates:
                return resource_group, 'template', tuple(uri_path)

        return resource_group, 'file', tuple(uri_path)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getHostUrl(self, request):
        host = request.host
        try:
            if 'localhost' in host:
                host = request.headers['X-Forwarded-Server']
        except: pass
        return "%s://%s" % (request.protocol,host)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getResourceConfig(self, resource_group, resource_path):
        resources = self.resources.get(resource_group, None)
        if resources is not None:
            config = resources.get(resource_path[0], None)
            if config: return config
        return self.resources.get(resource_path[0], None) 

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getResourcePath(self, uri):
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

        config = self.getResourceConfig(resource_group, resource_path)
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

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def handleInvalidRequest(self, request):
        """ default request handler
        """
        template = "HTTP/1.1 200 OK\r\nContent-Length: %d\r\n\r\n%s"
        msg = "Unknown request URI : %s" % request.uri
        request.write(template % (len(msg), msg))
        if self.debug: print 'handleInvalidRequest :', msg

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

    def setHandlerAttributes(self, **kwargs):
        self.attributes = RequestHandlerAttributes(**kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def setServerConfig(self, server_config):
        config = server_config.copy()
        toolname = 'csftool'
        search_order = None

        # construct resource search order
        if 'tool' in config:
            toolname = config.tool.toolname
            if 'inherit_resources' in config.tool:
                search_order = config.tool.inherit_resources
        if 'toolname' in config:
            toolname = config.toolname

        if search_order is not None:
            if toolname not in search_order:
                if isinstance(search_order, tuple):
                    search_order =  (toolname,) + search_order
                elif isinstance(search_order, list):
                    search_order = tuple([toolname,].extend[search_order])
            self.resource_search = search_order
        else: self.resource_search = (toolname,)

        # create attribute for tool name
        self.toolname = toolname

        # create attribute for reference to tool config 
        self.tool = config.tool

        # create attribute for reference to resources config
        self.resources = config.resources

        # create attribute for list of template requests
        self.templates = config.get('templates',())

        # create attribute for list of data requests
        self.data_requests = config.get('data_requests',())

        # create dmode attribute to override dataset provided dates
        # with a consitent set of dates from the config file
        self.mode = server_config.mode
        if self.mode != 'prod':
            self.mode_config = server_config[server_config.mode]
        else: self.mode_config = None

        # create attribute for the rest of the configuration
        self.server_config = config

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

