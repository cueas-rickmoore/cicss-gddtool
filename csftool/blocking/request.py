
import os

from csftool.methods import CsfToolRequestHandlerMethods

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class CsfToolBlockingRequestManager(CsfToolRequestHandlerMethods, object):

    def __init__(self, server_config, log_filepath=None):
        self.count = 0
        self.debug = server_config.debug
        self.log_filepath = log_filepath
        self.response_handlers = { }
        if server_config: self.setServerConfig(server_config)
        if self.debug:
            print "server URL", self.server_config.server_url 

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def __call__(self, request):
        self.count += 1
        if self.debug:
            print "\nCsfToolBlockingRequestManager :: processing request"
            print request
        if self.log_filepath is not None:
            log_file = open(os.path.abspath(self.log_filepath),'w')
            log_file.write('\n')
            log_file.write(str(request))
            log_file.close()

        HandlerClass = self.handlerClassForUri(request.uri)
        if self.debug: print "HandlerClass :", HandlerClass
        if HandlerClass is not None:
            handler = self.createHandler(HandlerClass)
            handler(request)
        # no handler was found, send invalid request message
        else:
            self.handleInvalidRequest(request)
        # finish request
        request.finish()

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def createHandler(self, HandlerClass):
        return HandlerClass(self.server_config, debug=self.debug)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def handlerClassForDataRequest(self, resource_group, resource_path):
        handlers = self.response_handlers.get(resource_group, None)
        path = self.resourceToString(resource_path)
        if handlers:
            handler = handlers.get(path, None)
            if handler is None:
                handler = handlers.get(resource_path[0], None)
            return handler
        return None

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def handlerClassForPage(self, resource_group, page_key):
        return self.handlerClassSearch(resource_group, page_key)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def handlerClassForQuery(self, resource_group, query):
        query_key, query_string = query
        return self.handlerClassSearch(resource_group, query_key)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def handlerClassForTemplate(self, resource_group, resource_path):
        handler = self.handlerClassSearch(resource_group, resource_path)
        if handler: return handler
        return self.handlerClassSearch(resource_group, 'template')

     # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def handlerClassForUri(self, uri):
        if self.debug: print '\nhandlerClassForUri :', uri
        # one of the dev or test pages
        if uri == '/' or uri.endswith('.html'):
            return self.handlerClassForPage(self.toolname, '/')

        # decode the uri to find the resource info
        result = self.decodeUri(uri)
        if not isinstance(result, tuple): return None
        if self.debug: print "seeking handler for", uri, result
        resource_group, resource_type, resource = result
        if self.debug: 
            msg = 'group, type, resource : %s , %s , %s'
            print msg % (resource_group, resource_type, resource)

        # check special cases first
        # templates
        if resource_type == 'template':
            return self.handlerClassForTemplate(resource_group, resource)
        # data request
        elif resource_type == 'data':
            return self.handlerClassForDataRequest(resource_group, resource)
        # REST API query
        elif resource_type == 'query':
            return self.handlerClassForQuery(resource_group, resource)
        # ordinary resource files
        elif resource_type == 'file':
            handler = self.handlerClassSearch(resource_group, resource)
            if handler is not None: return handler
            else:
                res_config = self.getResourceConfig(resource_group, resource)
                if res_config is not None:
                    # res_config[0] is the handler key
                    return self.handlerClassSearch(resource_group, res_config[0])
                else:
                    if self.mode in ("dev","test"):
                        print 'No handler found to satisfy reguest for file', uri
                        print '    associated resource group is', resource_group
        return None

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def handlerClassFromPath(self, resource_group, resource_path):
        handlers = self.response_handlers.get(resource_group, None)
        if handlers:
            return self.handlerClassSearch(resource_group, resource_path)
        return None

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def handlerClassSearch(self, resource_group, resource_path):
        handlers = self.response_handlers.get(resource_group, None)
        if handlers:
            if isinstance(resource_path, basestring):
                handler = handlers.get(resource_path, None)
            else:
                path = self.resourceToString(resource_path)
                handler = handlers.get(path, None)
                if handler is None and len(resource_path) > 1:
                    # look for file at end of sequence
                    handler = handlers.get(resource_path[-1], None)
                if handler is None:
                    # most generic case
                    handler = handlers.get(resource_path[0], None)
            return handler
        return None

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def resourceToString(self, resource_path):
        return '/%s' % '/'.join(resource_path)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def registerResponseHandler(self, key, ResponseHandlerClass, group=None):
        if group is not None:
            if group not in self.response_handlers:
                self.response_handlers[group] = { }
            self.response_handlers[group][key] = ResponseHandlerClass
        else: self.response_handlers[key] = ResponseHandlerClass

    def registerResponseHandlers(self, group, **response_handler_classes):
        if group not in self.response_handlers:
            self.response_handlers[group] = response_handler_classes
        else: self.response_handlers[group].update(response_handler_classes)

