#!/usr/bin/env python

import os, sys, warnings

import datetime
BUILD_START_TIME = datetime.datetime.now()

from dateutil.relativedelta import relativedelta

import numpy as N

from atmosci.ag.gdd import accumulateGDD, calcAvgTemp, calcGDD
from atmosci.utils.timeutils import elapsedTime, asDatetimeDate

from gddapp.project.access import GDDGridFileBuilder
from gddapp.por.factory import GDDPeriodOfRecordFactory

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

PERFORMANCE_MSG = 'completed build for %d in %s'

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()

parser.add_option('-r', action='store', dest='region', default=None)
parser.add_option('-s', action='store', dest='source', default=None)
parser.add_option('-v', action='store_true', dest='verbose', default=False)
parser.add_option('-z', action='store_true', dest='debug', default=False)

options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

current_year = datetime.date.today().year

debug = options.debug
verbose = options.verbose

factory = GDDPeriodOfRecordFactory()
project = factory.getProjectConfig()
if verbose:
    print '\nproject :\n', project

region_key = options.region
if region_key is None: region_key = project.region
if len(region_key) == 2: region_key = region_key.upper()
region = factory.getRegionConfig(region_key)
if verbose:
    print '\nregion :\n', region
bbox = region.data

source_key = options.source
if source_key is None: source_key = project.source
source = factory.getSourceConfig(source_key)
if verbose:
    print '\nsource :\n', source
latest_available_date = factory.latestAvailableDate(source)
latest_available_time = \
    factory.latestAvailableTime(source, latest_available_date)

current_year = BUILD_START_TIME.year
if len(args) == 0:
    target_years = [current_year,]
elif len(args) == 1:
    arg = args[0]
    if arg.isdigit():
        target_years = [int(arg),]
    else:
        scope = list(project.scopes[arg])
        if scope[1] == 9999: scope[1] = current_year - 1
        target_years = [year for year in range(scope[0],scope[1]+1)]
elif len(args) == 2:
    target_years =  [year for year in range(int(args[0]),int(args[1])+1)]
else: target_years = [int(arg) for arg in args]

gdd_thresholds = tuple( [ (th, factory.gddThresholdAsString(th))
                        for th in project.gdd_thresholds ] )
groups_in_file = factory.getFiletypeConfig('por').groups

if verbose:
    print '\ntarget years', target_years
    print 'GDD thresholds', gdd_thresholds
    print 'groups in file', groups_in_file


# filter annoying numpy warnings
warnings.filterwarnings('ignore',"All-NaN axis encountered")
warnings.filterwarnings('ignore',"All-NaN slice encountered")
warnings.filterwarnings('ignore',"invalid value encountered in greater")
warnings.filterwarnings('ignore',"invalid value encountered in less")
warnings.filterwarnings('ignore',"Mean of empty slice")
# MUST ALSO TURN OFF WARNING FILTERS AT END OF SCRIPT !!!!!

for target_year in target_years:
    year_start_time = datetime.datetime.now()

    start_date = datetime.date(target_year,1,1)
    if start_date > latest_available_date:
        print '%s data is not avaibale for %d' % (source.tag, target_year)
        continue
    end_date = datetime.date(target_year, 12, 31)

    # create a build and initialize the file
    builder = factory.getPORFileBuilder(target_year, source, region, bbox=bbox)
    print 'building', builder.filepath

    # build the groups and their datasets
    for group_name in groups_in_file:
        if verbose: print '    building group : %s' % group_name
        builder.buildGroup(group_name, True)

    # create a source file reader
    reader = factory.getSourceFileReader(source, target_year, region, 'temps')

    # create lat,lon grids in POR file
    if verbose: print '    creating lat/lon datasets'
    builder.initLonLatData(reader.lons, reader.lats)

    # don't get data past last valid date in current year
    if target_year == current_year:
        lvd = reader.getDatasetAttribute('temps.mint', 'last_valid_date')
        end_date = asDatetimeDate(lvd)

    # get minimum and maximum temperatures
    mint = reader.getTimeSlice('temps.mint', start_date, end_date)
    maxt = reader.getTimeSlice('temps.maxt', start_date, end_date)
    reader.close()
    del reader

    # build the GDD datasets for the first sequence of dates
    for threshold, th_string in gdd_thresholds:
        manager.open('a')
        manager.updateThresholdGroup(threshold, start_date, mint, maxt,
                                     source.tag, **kwargs)
        manager.close()

    #report performance
    elapsed_time = elapsedTime(year_start_time, True)
    print PERFORMANCE_MSG % (target_year, elapsed_time)

# turn annoying numpy warnings back on
warnings.resetwarnings()

elapsed_time = elapsedTime(BUILD_START_TIME, True)
print 'completed build for %d years in %s' % (len(target_years), elapsed_time)

