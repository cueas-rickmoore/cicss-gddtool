#! /Volumes/projects/venvs/test/bin/python
####! /usr/bin/env python

import os, sys, warnings
import datetime, time
BUILD_START_TIME = datetime.datetime.now()

from dateutil.relativedelta import relativedelta
ONE_DAY = relativedelta(days=1)

import numpy as N

from atmosci.utils.timeutils import elapsedTime

from gddapp.factory import GDDAppSourceGridFactory

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

PERFORMANCE_MSG = 'completed build for %d in %s'

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()

parser.add_option('-i', action='store', dest='increment', type='int',
                  default=10)
parser.add_option('-r', action='store', dest='region', default=None)
parser.add_option('-s', action='store', dest='source', default=None)
parser.add_option('-v', action='store_true', dest='verbose', default=False)
parser.add_option('-w', action='store', dest='wait_time', type='int',
                  default=0)
parser.add_option('-z', action='store_true', dest='debug', default=False)

options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

days = options.increment-1
if days > 0:
    INCREMENT = relativedelta(days=days)
else: INCREMENT = None

debug = options.debug
verbose = options.verbose or debug
wait_time = options.wait_time
total_wait_time = 0

factory = GDDAppSourceGridFactory()
project = factory.getProjectConfig()
if verbose:
    print 'project :\n', project

region_key = options.region
if region_key is None: region_key = project.region
if len(region_key) == 2: region_key = region_key.upper()
region = factory.getRegionConfig(region_key)
bbox = region.data
if verbose:
    print '\nregion :\n', region

source_key = options.source
if source_key is None: source_key = project.source
source = factory.getSourceConfig(source_key)
if verbose:
    print '\nsource :\n', source
    print ' '
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

groups_in_file = factory.getFiletypeConfig('source').groups

# filter annoying numpy warnings
warnings.filterwarnings('ignore',"All-NaN axis encountered")
warnings.filterwarnings('ignore',"All-NaN slice encountered")
warnings.filterwarnings('ignore',"invalid value encountered in greater")
warnings.filterwarnings('ignore',"invalid value encountered in less")
warnings.filterwarnings('ignore',"Mean of empty slice")
# MUST ALSO TURN OFF WARNING FILTERS AT END OF SCRIPT !!!!!

reader = factory.getStaticFileReader(source, region)
lons = reader.lons
lats = reader.lats
reader.close()
del reader

num_years = len(target_years)
for target_year in target_years:
    year_start_time = datetime.datetime.now()

    start_date = datetime.date(target_year,1,1)
    if start_date > latest_available_date:
        print '%s data is not available for %d' % (source.tag, target_year)
        continue

    end_date = datetime.date(target_year,12,31)
    if end_date > latest_available_date:
        end_date = latest_available_date
        errmsg = '%s data is only available thru %s'
        print errmsg % (source.tag, latest_available_date.isoformat())

    # create a build and initialize the file
    builder = factory.getSourceFileBuilder(source, target_year, region,
                                           'temps', bbox=bbox)
    print '\nbuilding', builder.filepath
    if debug:
        print '\nbuilder source :\n', builder.source
        print '\nbuilder region :\n', builder.region

    # create lat,lon grids
    print '    creating lat/lon datasets'
    builder.initLonLatData(lons, lats)

    # build the groups and their datasets
    for group_name in groups_in_file:
        print '    building group : %s' % group_name
        builder.buildGroup(group_name, True)

    # retrieve data for the entire year
    span_end = None
    span_start = start_date
    while span_start < end_date:
        if INCREMENT is not None:
            span_end = span_start + INCREMENT
            if span_end > end_date: span_end = end_date
        print '    downloading temps for', span_start, span_end
        data = factory.getAcisGridData(source_key, 'maxt,mint', span_start,
                       span_end, False, bbox=bbox, debug=debug)
        builder.open('a')
        builder.updateTempGroup(span_start, data['mint'], data['maxt'],
                                source.tag)
        builder.close()

        # incrment to next sequence of dates
        if INCREMENT is not None:
            span_start = span_end + ONE_DAY
            span_end = span_start + INCREMENT
        else: span_start = span_start + ONE_DAY

    del data
    elapsed_time = elapsedTime(year_start_time, True)
    print PERFORMANCE_MSG % (target_year, elapsed_time)

    if wait_time > 0 and num_years > 1 :
        time.sleep(wait_time)
        total_wait_time += wait_time

# turn annoying numpy warnings back on
warnings.resetwarnings()

elapsed_time = elapsedTime(BUILD_START_TIME, True)
print 'completed build for %d years in %s' % (len(target_years), elapsed_time)
if total_wait_time > 0:
    msg = 'total wait time between %d years = %s seconds'
    print msg % (num_years, total_wait_time)

