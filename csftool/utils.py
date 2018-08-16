
import os

from atmosci.utils.config import ConfigMap
from atmosci.utils.timeutils import asDatetimeDate

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

def validateResourceConfiguration(server_config, debug=False):
    resource_dirpath = server_config.dirpaths.resources
    resources = { }

    for name, config in server_config.resource_map.items():
        handler_key, resource_type, path = config

        if isinstance(path, (tuple,list)):
            path_size = len(path)
        else: path_size = 1

        if path_size == 1:
            path = os.path.join(resource_dirpath, path)
        else: path = os.path.join(resource_dirpath, *path)

        if os.path.exists(path):
            resources[name] = (handler_key, resource_type, path)
            if debug: print "    ", name, ":", resources[name]
        else:
            raise IOError, '%s does not exist : %s' % (resource_type, path)

    return ConfigMap(resources)

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

def validateSeasonDates(dates):
    season_end = dates['season_end']
    end_date = asDatetimeDate(season_end)
    last_obs = asDatetimeDate(dates['last_obs'])
    if last_obs > end_date:
        dates['last_obs'] = season_end
        last_obs = end_date
    dates = validateForecastDates(dates, last_obs, end_date)
    last_valid = asDatetimeDate(dates['last_valid'])
    if last_valid > end_date:
        dates['last_valid'] = season_end
    return dates

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

def validateForecastDates(dates, last_obs, end_date):
    if 'fcast_start' in dates:
        fcast_start = asDatetimeDate(dates['fcast_start'])
        if fcast_start > last_obs:
            fcast_end = asDatetimeDate(dates['fcast_end'])
            if fcast_start < end_date:
                if fcast_end > end_date:
                    dates['fcast_end'] = dates['season_end']
                elif fcast_start == end_date:
                    dates['fcast_end'] = dates['fcast_start']
            else:
                del dates['fcast_start']
                del dates['fcast_end']
        else:
            del dates['fcast_start']
            del dates['fcast_end']

    elif 'fcast_start_date' in dates:
        fcast_start = asDatetimeDate(dates['fcast_start_date'])
        if fcast_start > last_obs:
            fcast_dates['fcast_start'] = dates['fcast_start_date']
            if fcast_start < end_date:
                fcast_end = asDatetimeDate(dates['fcast_end_date'])
                if fcast_end > end_date:
                    dates['fcast_end'] = dates['season_end']
                elif fcast_start == end_date:
                    dates['fcast_end'] = dates['fcast_start_date']
                else: dates['fcast_end'] = dates['fcast_end_date']
        del dates['fcast_start_date']
        del dates['fcast_end_date']

    return dates
