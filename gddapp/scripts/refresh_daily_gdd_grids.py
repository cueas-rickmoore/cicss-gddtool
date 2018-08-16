#!/usr/bin/env python

import os, sys
import warnings

import datetime
UPDATE_START_TIME = datetime.datetime.now()
from dateutil.relativedelta import relativedelta
ONE_DAY = relativedelta(days=1)

import numpy as N

from atmosci.utils.timeutils import elapsedTime, asDatetimeDate

from gddapp.factory import GDDAppProjectFactory

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()

parser.add_option('-r', action='store', dest='region', default=None)
parser.add_option('-s', action='store', dest='source', default=None)
parser.add_option('-v', action='store_true', dest='verbose', default=False)
parser.add_option('-z', action='store_true', dest='debug', default=False)

options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

debug = options.debug
verbose = options.verbose or debug
if debug: print '\refeesh_daily_gdd_grids.py', args

factory = GDDAppProjectFactory()
project = factory.getProjectConfig()

region = options.region
if region is None: region = project.region
if len(region) == 2: region = region.upper()
bbox = factory.getRegionConfig(region).data

source_key = options.source
if source_key is None: source_key = project.source
source = factory.getSourceConfig(source_key)
if verbose:
    print 'the source config is :\n', source
    print ' '
latest_available_date = factory.latestAvailableDate(source)
latest_available_time = \
    factory.latestAvailableTime(source, latest_available_date)
if latest_available_time > datetime.datetime.now():
    latest_available_date = latest_available_date - ONE_DAY

# get the date span
num_args = len(args)
end_date = None
target_year = datetime.date.today().year
if num_args == 0:
    start_date = None
elif num_args == 4:
    start_date = datetime.date(target_year, int(args[0]), int(args[1]))
    end_date = datetime.date(target_year, int(args[2]), int(args[3]))
elif num_args in (3,5):
    target_year = int(args[0])
    start_date = datetime.date(target_year, int(args[1]), int(args[2]))
    if num_args == 5:
        end_date = datetime.date(target_year,int(args[3]), int(args[4]))
else:
    print 'EXITING :', __file__
    print ' unable to parse date from args "%s"' % ' '.join(args) 
    os._exit(99)

if datetime.date(target_year,1,1) > latest_available_date:
    print 'EXITING :', __file__
    print 'aata is not avaiable for %d' % target_year
    os._exit(99)


# get a a source file reader for the target year
reader = factory.getSourceFileReader(source, target_year, region, 'temps')
print 'reading from %s file %s' % (source.tag, reader.filepath)

# get last valid date for temperatures
temps_end_date = \
asDatetimeDate(reader.getDatasetAttribute('temps.mint', 'last_valid_date'))

last_obs_date = \
asDatetimeDate(reader.getDatasetAttribute('temps.mint', 'last_obs_date'))


# get the POR file manager
manager = factory.getPORFileManager(target_year, source, region, mode='a')
print 'updating GDD in', manager.filepath


if start_date is None:
    prev_update = \
        manager.getDatasetAttribute('gdd50.provenance', 'last_obs_date', None)
    if prev_update is None:
        prev_update = manager.getDatasetAttribute('gdd50.provenance',
                                                  'last_valid_date', None)
    if prev_update is not None:
        start_date = asDatetimeDate(prev_update)
    else: start_date = datetime.date(target_year,1,1)

elif start_date > latest_available_date:
    errmsg = '%s data is only available thru %s'
    print 'EXITING :', __file__
    print errmsg % (source.tag, latest_available_date.isoformat())
    os._exit(99)

elif start_date > temps_end_date:
    print 'EXITING :', __file__
    errmsg = '%d temps are only available thru %s'
    print errmsg % (target_year, temps_end_date.isoformat())
    os._exit(99)

else: prev_update = None

if end_date is None:
    if start_date < temps_end_date:
        end_date = temps_end_date
else:
    if end_date > temps_end_date:
        end_date = temps_end_date
        errmsg = '%s data is only available thru %s'
        print 'WARNING :', errmsg % (target_year, end_date.isoformat())
    if end_date == start_date:
        end_date = None
        msg = 'Updating daily GDD for %s thru %s'
        print msg % (start_date.strftime('%m-%d'),
                     end_date.strftime('%m-%d, %Y'))


if end_date is None:
    print 'Updating daily GDD for %s' % start_date.strftime('%m-%d, %Y')

if debug:
    print '    start_date', start_date
    print '    end_date', end_date
    print '    latest available', latest_available_date
    print '    prev GDD date', prev_update

# retrieve the temperature data
print '    retrieving temperature extremes'
mint = reader.getTimeSlice('temps.mint', start_date, end_date)
maxt = reader.getTimeSlice('temps.maxt', start_date, end_date)
reader.close()


# filter annoying numpy warnings
warnings.filterwarnings('ignore',"All-NaN axis encountered")
warnings.filterwarnings('ignore',"All-NaN slice encountered")
warnings.filterwarnings('ignore',"invalid value encountered in greater")
warnings.filterwarnings('ignore',"invalid value encountered in less")
warnings.filterwarnings('ignore',"Mean of empty slice")
# MUST ALSO TURN OFF WARNING FILTERS AT END OF SCRIPT !!!!!

# calculate GDD and update datasets
for threshold in project.gdd_thresholds:
    thresh_str = factory.gddThresholdAsString(threshold)
    print 'updating GDD data for GDD %s group' % thresh_str
    manager.open('a')
    manager.refreshThresholdGroup(threshold, start_date, mint, maxt,
                                  source.tag)
    manager.close()
    print 'completed GDD refresh for %s group' % thresh_str

# turn annoying numpy warnings back on
warnings.resetwarnings()


num_days = (end_date-start_date).days+1
elapsed_time = elapsedTime(UPDATE_START_TIME, True)
print 'completed GDD refresh for %d days in %s' % (num_days, elapsed_time)

