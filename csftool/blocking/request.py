
import os

from csftool.methods import CsfToolRequestHandlerMethods
from csftool.blocking.handler import CsfToolOptionsRequestHandler

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
        if self.debug and 'csftool' not in request.uri:
            print "\nCsfToolBlockingRequestManager :: processing request"
            print request

        if request.method != 'OPTIONS':
            self.respondToDataRequest(request)
        else: self.respondToOptionsRequest(request)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def createHandler(self, HandlerClass):
        return HandlerClass(self.server_config, debug=self.debug)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def handlerClassForUri(self, uri):
        if self.debug: print '\nhandlerClassForUri :', uri

        # decode the uri to find the resource info
        result = self.decodeUri(uri)
        if not isinstance(result, tuple): return None
        resource_group, resource_type, resource_path = result
        if self.debug: 
            print "seeking handler for", uri
            msg = '    group, type, resource : %s , %s , %s'
            print msg % (resource_group, resource_type, resource_path)

        if resource_type != 'query': # HTML resource string
            handler = \
                self.handlerClassSearch(resource_group, resource_type, resource_path)
        else: # REST API query
            query_key, query_string = respource_path
            handler = self.handlerClassSearch(resource_group, 'query', query_key)
        # handler found
        if handler != None: return handler

        # no handler found
        if self.mode in ("dev","test"):
             print 'No handler found to satisfy reguest for file', uri
             print '    associated resource group is', resource_group
        return None

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def handlerClassSearch(self, resource_group, resource_type, path):
        handlers = self.response_handlers.get(resource_group, None)
        if self.debug and resource_group != 'csftool':
            print 'handlerClassSearch', resource_group, resource_type, path
        if handlers:
            resource_path = None
            if isinstance(path, (tuple,list)):
                handler = handlers.get(path[-1], None)
                if handler is not None:
                    if self.debug: print path[-1], 'handler :', handler
                    return handler
                else: resource_path = '/'.join(path)
            else: resource_path = path
            handler = handlers.get(resource_path, None)
            if handler is None:
                handler = handlers.get('/%s' % resource_path, None)
                if handler is None:
                    handler = handlers.get(resource_type, None)
                    if handler is None:
                        handler = handlers.get('file', None)
            if self.debug: print resource_path, 'handler :', handler
            return handler
        return None

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def resourceToString(self, resource_path):
        return '/%s' % '/'.join(resource_path)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def registerResponseHandlerClass(self, key, ResponseHandlerClass,
                                           group=None):
        if group is not None:
            if group not in self.response_handlers:
                self.response_handlers[group] = { }
            self.response_handlers[group][key] = ResponseHandlerClass
        else: self.response_handlers[key] = ResponseHandlerClass

    def registerResponseHandlerClasses(self, group,
                                             **response_handler_classes):
        if group not in self.response_handlers:
            self.response_handlers[group] = response_handler_classes
        else: self.response_handlers[group].update(response_handler_classes)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def respondToDataRequest(self, request):
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

    def respondToOptionsRequest(self, request):
        handler = self.createHandler(CsfToolOptionsRequestHandler)
        handler(request)

