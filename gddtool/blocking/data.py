
import datetime

from tornado.httputil import HTTPHeaders, ResponseStartLine

from atmosci.utils.timeutils import asDatetimeDate, DateIterator, elapsedTime

from csftool.blocking.handler import CsfToolRequestHandlerMethods

from gddtool.factory import GDDToolPORFactory, GDDToolHistoryFactory
from gddtool.handler import GDDToolRequestHandlerMethods

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

RESPONSE_HEADER = "HTTP/1.1 200 OK\r\nContent-Length: length:%d"

GDDTOOL_DATA_HANDLERS =  { }

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolBlockingDataMethods(GDDToolRequestHandlerMethods,
                                 CsfToolRequestHandlerMethods):

    def __init__(self, server_config, debug=False, **kwargs):
        self.debug = debug
        self.setServerConfig(server_config)
        self.setProjectConfig(server_config)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def serializeDates(self, start_date, end_date, fmt='%Y-%m-%d'):
        dates = [ date.strftime(fmt)
                  for date in DateIterator(start_date, end_date) ]
        return self.tightJsonString(dates)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def serializeData(self, data, decimals=1):
        template = "%%.%df" % decimals
        return '[%s]' % ','.join([template % x for x in data])

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def respond(self, request, response_json):
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


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolPORDailyDataHandler(GDDToolHistoryFactory,
                                 GDDToolBlockingDataMethods):

    def __init__(self, server_config, debug=False, **kwargs):
        GDDToolHistoryFactory.__init__(self)
        GDDToolBlockingDataMethods.__init__(self, server_config)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def __call__(self, request):
        start_response = datetime.datetime.now()

        # decode request variables into a dictionary
        request_dict = self.requestAsDict(request)

        # extract location coordinates
        location = request_dict['location']
        coords = location.get('coords',None)
        if coords is not None:
            lat = float(coords[0])
            lon = float(coords[1])
        else:
            lat = float(location['lat'])
            lon = float(location['lon'])

        # GDD threshold and target_year
        gdd_threshold = request_dict['gdd_threshold']
        year = request_dict.get('season', None)

        # get the configured season limits
        dates = self.extractSeasonDates(request_dict, year)
        season_start = asDatetimeDate(dates['season_start'])
        season_end = asDatetimeDate(dates['season_end'])
        target_year = dates['season']
        del dates['season']
        # initialize response string with season dates
        response = \
            '{"daily":{%s,"data":{' % self.tightJsonString(dates)[1:-1]

        reader = self.getHistoryFileReader(target_year, self.source,
                                    self.region, gdd_threshold, 'daily')
        # add period of record extremes
        data = self.serializeData(reader.getSliceAtNode('por.max', season_start, season_end, lon, lat))
        response = '%s"pormax":%s' % (response, data)

        data = self.serializeData(reader.getSliceAtNode('por.min', season_start, season_end, lon, lat))
        response = '%s,"pormin":%s}}}' % (response, data)

        reader.close()
        del data
        if self.mode in ('dev', 'test'):
            print 'pordaily data retrieved in',elapsedTime(start_response,True)

        self.respond(request, response)

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

GDDTOOL_DATA_HANDLERS['pordaily'] = GDDToolPORDailyDataHandler
GDDTOOL_DATA_HANDLERS['/pordaily'] = GDDToolPORDailyDataHandler


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolAccumulationHistoryHandler(GDDToolHistoryFactory,
                                        GDDToolBlockingDataMethods):

    def __init__(self, server_config, debug=False, **kwargs):
        GDDToolHistoryFactory.__init__(self)
        GDDToolBlockingDataMethods.__init__(self, server_config)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def __call__(self, request):
        start_response = datetime.datetime.now()

        # decode request variables into a dictionary
        request_dict = self.requestAsDict(request)
        print "GDDToolAccumulationHistoryHandler request\n", request_dict

        # extract location coordinates
        location = request_dict['location']
        coords = location.get('coords',None)
        if coords is not None:
            lat = float(coords[0])
            lon = float(coords[1])
        else:
            lat = float(location['lat'])
            lon = float(location['lon'])

        # GDD threshold and target_year
        gdd_threshold = request_dict['gdd_threshold']
        target_year = request_dict.get('season', None)

        # get the configured season limits
        dates = self.extractSeasonDates(request_dict, target_year)
        season_start = asDatetimeDate(dates['season_start'])
        season_end = asDatetimeDate(dates['season_end'])
        target_year = dates['season']
        del dates['season']
        # initialize response string with season dates
        response = \
            '{"history":{%s,"data":{' % self.tightJsonString(dates)[1:-1]

        reader = self.getHistoryFileReader(target_year, self.source,
                                           self.region, gdd_threshold)
        # add recent averages
        data = \
        reader.getSliceAtNode('recent', season_start, season_end, lon, lat)
        response = '%s"recent":%s' % (response, self.serializeData(data))

        # add climate normal averages
        data = \
        reader.getSliceAtNode('normal', season_start, season_end, lon, lat)
        response = '%s,"normal":%s' % (response, self.serializeData(data))

        # add period of record averages
        data = \
        reader.getSliceAtNode('por.avg', season_start, season_end, lon, lat)
        response = '%s,"poravg":%s' % (response, self.serializeData(data, 4))

        # add period of record - percent diffrence max GDD to average GDD
        data = \
        reader.getSliceAtNode('por.max', season_start, season_end, lon, lat)
        response = '%s,"pormax":%s' % (response, self.serializeData(data, 4))

        # add period of record - percent diffrence min GDD to average GDD
        data = \
        reader.getSliceAtNode('por.min', season_start, season_end, lon, lat)
        response = '%s,"pormin":%s' % (response, self.serializeData(data, 4))

        reader.close()
        del data
        if self.mode in ('dev','test'):
            print 'history data retrieved in', elapsedTime(start_response,True)

        self.respond(request, '%s}}}' % response)

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

GDDTOOL_DATA_HANDLERS['history'] = GDDToolAccumulationHistoryHandler
GDDTOOL_DATA_HANDLERS['/history'] = GDDToolAccumulationHistoryHandler


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #


class GDDToolCurrentSeasonDataHandler(GDDToolPORFactory,
                                      GDDToolBlockingDataMethods):

    def __init__(self, server_config, debug=False, **kwargs):
        GDDToolPORFactory.__init__(self)
        GDDToolBlockingDataMethods.__init__(self, server_config)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def __call__(self, request):
        start_response = datetime.datetime.now()

        # decode request variables into a dictionary
        request_dict = self.requestAsDict(request)
        print "GDDToolCurrentSeasonDataHandler request\n", request_dict

        # extract location coordinates
        location = request_dict['location']
        coords = location.get('coords',None)
        if coords is not None:
            lat = float(coords[0])
            lon = float(coords[1])
        else:
            lat = float(location['lat'])
            lon = float(location['lon'])

        # GDD threshold and target_year
        gdd_threshold = str(request_dict['gdd_threshold'])
        year = request_dict.get('season', None)

        # get the configured season limits
        dates = self.extractSeasonDates(request_dict, year)
        season_start = asDatetimeDate(dates['season_start'])
        season_end = asDatetimeDate(dates['season_end'])
        target_year = dates['season']

        # initialize the response
        response_json = \
            '{"season":{"gdd_threshold":"%s","season":%d' % (gdd_threshold,target_year)
        response_json = \
            '%s,"location":%s' % (response_json,self.tightJsonString(location))

        # create a POR file reader
        reader = self.getPORFileReader(target_year, self.source, self.region)
        
        # create path to GDD dataset
        dataset_path = reader.gddDatasetPath('accumulated', gdd_threshold)

        # capture the significant dates for the dataset
        if self.mode_config != None:
            dates.update(self.mode_config.dates.attrs)
        else: dates.update(reader.getSignificantDates(dataset_path))

        fcast_end = asDatetimeDate(dates['fcast_end'])
        if fcast_end > season_end: fcast_end = season_end
        # temporarily free up the POR file
        reader.close()

        # add season dates to response
        response_json = \
            '%s,%s' % (response_json, self.tightJsonString(dates)[1:-1])
        del dates

        # get the accumulated GDD for Y axis of data plots
        reader.open()
        response_json = '%s,"data":{"season":%s}}}' % (response_json, 
                        self.serializeData(reader.getDataAtNode(dataset_path,
                                           lon, lat, season_start, fcast_end)))
        reader.close()
        if self.mode in ('dev','test'):
            print 'season data retrieved in ', elapsedTime(start_response,True)

        # send the response
        self.respond(request, response_json)


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

GDDTOOL_DATA_HANDLERS['season'] = GDDToolCurrentSeasonDataHandler
GDDTOOL_DATA_HANDLERS['/season'] = GDDToolCurrentSeasonDataHandler


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #


class GDDToolCurrentSeasonDaysHandler(GDDToolPORFactory,
                                      GDDToolBlockingDataMethods):

    def __init__(self, server_config, debug=False, **kwargs):
        GDDToolPORFactory.__init__(self)
        GDDToolBlockingDataMethods.__init__(self, server_config)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def __call__(self, request):
        # decode request variables into a dictionary
        request_dict = self.requestAsDict(request)

        # get the configured season limits
        dates = self.extractSeasonDates(request_dict)
        season_start = asDatetimeDate(dates['season_start'])
        season_end = asDatetimeDate(dates['season_end'])
        # create an array of days for X axis of data plots
        response_json = \
            '{"days":%s}' % self.serializeDates(season_start, season_end)

        # send the respnse
        self.respond(request, response_json)


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

GDDTOOL_DATA_HANDLERS['daysInSeason'] = GDDToolCurrentSeasonDaysHandler
GDDTOOL_DATA_HANDLERS['/daysInSeason'] = GDDToolCurrentSeasonDaysHandler

