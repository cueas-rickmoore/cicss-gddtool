#! /usr/bin/env python

import os, sys
import warnings

import datetime
UPDATE_START_TIME = datetime.datetime.now()

from atmosci.utils.timeutils import elapsedTime

from gddapp.factory import GDDAppProjectFactory

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()

parser.add_option('-v', action='store_true', dest='verbose', default=False)
parser.add_option('-z', action='store_true', dest='debug', default=False)

options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

debug = options.debug
verbose = options.verbose or debug

target_year = datetime.date.today().year

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

# get a a source file reader for the target year
reader = factory.getSourceFileReader(source, target_year, region, 'temps')
print 'reading from %s file %s' % (source.tag, reader.filepath)

# get forecast time span
fcast_start_date = \
    reader.getDateAttribute('temps.mint', 'fcast_start_date', None)
if fcast_start_date is None:
    print 'No forecast data in file'
    exit()
fcast_end_date = reader.getDateAttribute('temps.mint', 'fcast_end_date')

# get the POR file manager
manager = factory.getPORFileManager(target_year, source, region, mode='a')
print 'updating forecast GDD in', manager.filepath

# retrieve the temperature data
print '    retrieving temperature extremes'
mint = reader.getTimeSlice('temps.mint', fcast_start_date, fcast_end_date)
maxt = reader.getTimeSlice('temps.maxt', fcast_start_date, fcast_end_date)
reader.close()
del reader


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
    print 'updating forecast in GDD %s group' % thresh_str
    manager.open('a')
    manager.updateThresholdGroup(threshold, fcast_start_date, mint, maxt,
                                 source.tag, forecast=True)
    manager.close()
    print 'completed update of GDD %s group' % thresh_str

del manager

# turn annoying numpy warnings back on
warnings.resetwarnings()


elapsed_time = elapsedTime(UPDATE_START_TIME, True)
if fcast_end_date == fcast_start_date:
    msg = 'completed update for %s in %s'
    print msg % (fcast_start_date.isoformat(), elapsed_time)
else:
    msg = 'completed update for %s thru %s in %s'
    print msg % (fcast_start_date.strftime('%m-%d'),
                 fcast_end_date.strftime('%m-%d, %Y'),
                 elapsed_time)

