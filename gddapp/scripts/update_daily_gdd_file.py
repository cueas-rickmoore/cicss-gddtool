#!/usr/bin/env python
import os, sys
import warnings

import datetime
UPDATE_START_TIME = datetime.datetime.now()
from dateutil.relativedelta import relativedelta
ONE_DAY = relativedelta(days=1)

import numpy as N

from atmosci.utils.timeutils import elapsedTime

from gddapp.factory import GDDAppProjectFactory

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

def updateGDD(factory, manager, source, start_date, mint, maxt, is_forecast):
    # calculate GDD and update datasets iwth observed data
    for threshold in factory.project.gdd_thresholds:
        thresh_str = factory.gddThresholdAsString(threshold)
        print '    updating GDD data for GDD %s group' % thresh_str
        manager.open('a')
        manager.updateThresholdGroup(threshold, start_date, mint, maxt,
                                     source.tag, forecast=is_forecast)
        manager.close()
        print '    completed GDD update for %s group' % thresh_str

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()

parser.add_option('-f', action='store_true', dest='update_forecast',
                  default=False)
parser.add_option('-v', action='store_true', dest='verbose', default=False)
parser.add_option('-z', action='store_true', dest='debug', default=False)

options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

debug = options.debug
update_forecast = options.update_forecast
verbose = options.verbose or debug

factory = GDDAppProjectFactory()
project = factory.getProjectConfig()

source_key = args[0]
if source_key is None: source_key = project.source
source = factory.getSourceConfig(source_key)
if verbose:
    print 'the source config is :\n', source
    print ' '

region = args[1]
if region is None: region = project.region
if len(region) == 2: region = region.upper()
bbox = factory.getRegionConfig(region).data

# get the last possible date that data might be available from this source
latest_available_date = factory.latestAvailableDate(source)

target_year = datetime.date.today().year

# get a source file reader for the target year
reader = factory.getSourceFileReader(source, target_year, region, 'temps')
print 'reading from %s file %s' % (source.tag, reader.filepath)

# get date of first and last days in forecast
fcast_start_date = \
    reader.getDateAttribute('temps.mint', 'fcast_start_date', None)
fcast_end_date = reader.getDateAttribute('temps.mint', 'fcast_end_date', None)

# in the source file, the last_obs_date is the date associated with the
# last observed temperature
obs_end_date = reader.getDateAttribute('temps.mint', 'last_obs_date', None)
if obs_end_date is None:
    # This should only happen the first day of the season
    if fcast_start_date is not None: # has forecast data, so stop there
        obs_end_date = fcast_start_date - ONE_DAY
    else: # no forecast - stop at last valid date
        obs_end_date = datetime.date.today()

# get the POR file manager
manager = factory.getPORFileManager(target_year, source, region, mode='a')
print 'updating GDD in', manager.filepath

# in the POR file, the last_obs_date is the date associated with the
# last day with observated temperatures prior to this update
obs_start_date = \
    manager.getDateAttribute('gdd50.daily', 'last_obs_date', None)
if obs_start_date is None:
    # This should only happen the first day of the season
    obs_start_date = datetime.date(obs_end_date.year,1,1)

if obs_start_date > latest_available_date:
    errmsg = '%s data is only available thru %s'
    print 'EXITING :', __file__
    print errmsg % (source.tag, latest_available_date.isoformat())
    os._exit(99)

elif obs_start_date > obs_end_date:
    print 'EXITING :', __file__
    errmsg = 'temps are only available thru %s'
    print errmsg % obs_end_date.isoformat()
    os._exit(99)

elif obs_start_date == obs_end_date:
    obs_end_date = None

# filter annoying numpy warnings
warnings.filterwarnings('ignore',"All-NaN axis encountered")
warnings.filterwarnings('ignore',"All-NaN slice encountered")
warnings.filterwarnings('ignore',"invalid value encountered in greater")
warnings.filterwarnings('ignore',"invalid value encountered in less")
warnings.filterwarnings('ignore',"Mean of empty slice")
# MUST ALSO TURN OFF WARNING FILTERS AT END OF SCRIPT !!!!!

# retrieve the observed temperature data
print '    retrieving observed temperature extremes'
mint = reader.getTimeSlice('temps.mint', obs_start_date, obs_end_date)
maxt = reader.getTimeSlice('temps.maxt', obs_start_date, obs_end_date)
reader.close()

print '    updating observed GDD'
updateGDD(factory, manager, source, obs_start_date, mint, maxt, False)
end_date = obs_end_date

if update_forecast and fcast_start_date is not None:
    if fcast_start_date <= obs_end_date:
        fcast_start_date = obs_end_date + ONE_DAY
    reader.open()
    if fcast_end_date >= fcast_start_date:
        # retrieve the observed temperature data
        print '\n    retrieving forecast temperature extremes'
        mint = \
            reader.getTimeSlice('temps.mint', fcast_start_date, fcast_end_date)
        maxt = \
            reader.getTimeSlice('temps.maxt', fcast_start_date, fcast_end_date)
        reader.close()
        print '    updating forecast GDD'
        updateGDD(factory, manager, source, fcast_start_date, mint, maxt, True)
        end_date = fcast_end_date

# turn annoying numpy warnings back on
warnings.resetwarnings()


elapsed_time = elapsedTime(UPDATE_START_TIME, True)
if end_date is None or end_date == obs_start_date:
    msg = 'completed update for %s in %s'
    print msg % (obs_start_date.isoformat(), elapsed_time)
else:
    start_date = obs_start_date.strftime('%m-%d')
    end_date = end_date.strftime('%m-%d, %Y')
    msg = 'completed update for %s thru %s in %s'
    print msg % (start_date, end_date, elapsed_time)

