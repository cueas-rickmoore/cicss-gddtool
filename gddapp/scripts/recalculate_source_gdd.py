#!/usr/bin/env python

import os, sys
import datetime
from dateutil.relativedelta import relativedelta
ONE_DAY = relativedelta(days=1)

import numpy as N

from atmosci.utils.timeutils import asDatetimeDate, elapsedTime

from gddapp.factory import GDDPeriodOfRecordFactory

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()

parser.add_option('-s', action='store', dest='source', default=None)
parser.add_option('-v', action='store_true', dest='verbose', default=False)
parser.add_option('-z', action='store_true', dest='debug', default=False)

options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

debug = options.debug
verbose = options.verbose or debug

factory = GDDPeriodOfRecordFactory()
project = factory.getProjectConfig()

region = options.region
if region is None: region = project.region
bbox = factory.config.regions[region].data

if options.source is None:
    source = factory.getSourceConfig(project.source)
else: source = factory.getSourceConfig(options.source)
source_key = source.name

gdd_thresholds = tuple( [ (th, factory.gddThresholdAsString(th))
                        for th in project.gdd_thresholds ] )

# get the date span
num_args = len(args)

# determine target year from number of arguments
if num_args in (0,2,4):
    target_year = UPDATE_START_TIME.year
elif num_args in (1,3,5):
    target_year = int(args[0])
else:
    raise SyntaxError, INPUT_ERROR

# get a file manager for the target year
reader = factory.getSourceFileManager(source_key, target_year, region, 'temps')
print 'source filepath', reader.filepath
# need last valid date for 
last_valid_date = \
    asDatetimeDate(reader.getDatasetAttribute('temps.mint','last_valid_date'))

# reprocess all days in the current year
if num_args == 0:
    start_date = datetime.date(target_year, 1, 1)
    end_date = datetime.date(target_year, 12, 31)
# reprocess a single day in the current year
elif num_args == 2:
    end_date = start_date = \
        datetime.date(target_year, int(args[0]), int(args[1]))
# reprocess single day in a specifc year
elif num_args == 3:
    end_date = start_date = \
        datetime.date(target_year, int(args[1]), int(args[2]))
# reprocess range of dates in the current year
elif num_args == 4:
    start_date = datetime.date(target_year, int(args[0]), int(args[1]))
    end_date = datetime.date(target_year, int(args[2]), int(args[3]))
# reprocess range of dates in a specific year
elif num_args == 5:
    start_date = datetime.date(target_year, int(args[1]), int(args[2]))
    end_date = datetime.date(target_year,int(args[3]), int(args[4]))

if end_date == start_date: end_date = None
else: end_date = min(end_date, last_valid_date)

# get the temperature datasets and close thereader
maxt = reader.getTimeSlice('temps.maxt', start_date, end_date)
mint = reader.getTimeSlice('temps.mint', start_date, end_date)
reader.close()
del reader

# get the appropriate GDD manager for the source
manager = factory.getPORFileManager(target_year, source, region, mode='a')
print 'recalculating gdd in', manager.filepath
# recalculate GDD and update the file 
for threshold, th_string in gdd_thresholds:
    start_time = datetime.datetime.now()
    manager.open('a')
    manager.updateThresholdGroup(threshold, start_date, mint, maxt,
                                 source.tag, **kwargs)
    manager.close()
    elapsed_time = elapsedTime(start_time, True)
    print '    processed GDD %s in %s', (th_string,elapsed_time)

