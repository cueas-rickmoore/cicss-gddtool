# common request and request handler methods

import datetime

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolRequestHandlerMethods:

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def appDateFormat(self, date):
        return date.strftime('%Y-%m-%d')

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractDataAccessParameters(self, request_dict):
        parameter_dict = self.extractLocationParameters(request_dict)
        parameter_dict['gdd_threshold'] = \
            request_dict.get('gdd_threshold', self.tool.default_threshold)
        return parameter_dict

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractSeasonDates(self, request_dict, year=None):
        if year is None:
            year = request_dict.get('season', None)
            if year is None :
                if self.mode_config is not None:
                    year  = self.mode_config.dates.season
                start_date = self.appDateFormat(datetime.date(year,
                                            *self.tool.season_start_day))
                end_date = self.appDateFormat(datetime.date(year,
                                              *self.tool.season_end_day))
                return { 'season_start':start_date, 'season_end':end_date,
                         "season":year }

        if isinstance(year, basestring): year = int(year)

        start_date = request_dict.get('season_start', None)
        if start_date is None:
            if year is None: year = datetime.date.today().year
            start_date = self.appDateFormat(datetime.date(year,
                                            *self.tool.season_start_day))
        else: year = int(start_date.split('-')[0])
        parameter_dict = { 'season':year, 'season_start':start_date }

        end_date = request_dict.get('season_end', None)
        if end_date is None:
            end_date = self.appDateFormat(datetime.date(year,
                                          *self.tool.season_end_day))
        parameter_dict['season_end'] = end_date

        return parameter_dict

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractSeasonParameters(self, request_dict):
        parameter_dict = self.extractSeasonDates(request_dict)
        year = str(parameter_dict['season'])

        description = request_dict.get('season_description', None)
        if description is None:
            description = self.server_config.season_description % year
        parameter_dict['season_description'] = description

        return parameter_dict

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractLocationParameters(self, request_dict):
        location_dict = request_dict.get('location', None)
        if location_dict is None:
            location_dict = { }
            location_dict['key'] = self.tool.location.key
            location_dict['address'] = self.tool.location.address
            location_dict['coords'] = [ self.tool.location.lat,
                                        self.tool.location.lon ]
        return location_dict

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def setProjectConfig(self, server_config):
        tool = server_config.tool.copy()
        # use the region/source keys to lookup the correct config for each
        self.region = self.getRegionConfig(tool.data_region_key)
        self.source = self.getSourceConfig(tool.data_source_key)

        self.tool = tool

        self.config.dirpaths.update(self.server_config.dirpaths)

