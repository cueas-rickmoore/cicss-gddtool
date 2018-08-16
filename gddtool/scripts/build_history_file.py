#!/usr/bin/env python

import os
import datetime
import warnings

import numpy as N

from atmosci.utils.timeutils import elapsedTime, daysInYear

from gddapp.factory import GDDAppProjectFactory

from gddtool.factory import GDDToolHistoryFactory

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()

parser.add_option('-p', action='store_true', dest='for_prod_build',
                  default=False)
parser.add_option('-r', action='store', dest='region', default=None)
parser.add_option('-s', action='store', dest='source', default=None)
parser.add_option('-v', action='store_true', dest='verbose', default=False)
parser.add_option('-z', action='store_true', dest='debug', default=False)

options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

debug = options.debug
for_prod_build = options.for_prod_build
source = options.source
verbose = options.verbose

app_factory = GDDAppProjectFactory()

target_year = int(args[0])
days_in_history = daysInYear(target_year)
gdd_threshold = args[1] # string version of GDD threshold

project = app_factory.getProjectConfig()
if verbose:
    print '\nproject :\n', project

region_key = options.region
if region_key is None: region_key = project.region
if len(region_key) == 2: region_key = region_key.upper()
region = app_factory.getRegionConfig(region_key)
if verbose:
    print '\nregion :\n', region

source_key = options.source
if source_key is None: source_key = project.source
source = app_factory.getSourceConfig(source_key)

build_start = datetime.datetime.now()

# filter annoying numpy warnings
warnings.filterwarnings('ignore',"All-NaN axis encountered")
warnings.filterwarnings('ignore',"All-NaN slice encountered")
warnings.filterwarnings('ignore',"invalid value encountered in greater")
warnings.filterwarnings('ignore',"invalid value encountered in less")
warnings.filterwarnings('ignore',"Mean of empty slice")
# MUST ALSO TURN OFF WARNING FILTERS AT END OF SCRIPT !!!!!


# create the history file and initialize it's groups/datasets
scopes = app_factory.getAvailableScopes(target_year)
reader = app_factory.getHistoryFileReader(target_year, source, region,
                                          gdd_threshold, 'accumulated')

tool_factory = GDDToolHistoryFactory(for_prod_build)
# delete existing file
filepath = tool_factory.historyGridFilepath(target_year, source, region,
                                            gdd_threshold)
if os.path.exists(filepath): os.remove(filepath)
# build a new file
builder = tool_factory.getHistoryFileBuilder(target_year, source, region,
                       gdd_threshold, bbox=reader.data_bbox)
threshold_str = builder.gddThresholdString(gdd_threshold)
end_date = datetime.date(target_year, *builder.config.groups.por.end_day)
start_date = datetime.date(target_year, *builder.config.groups.por.start_day)
print 'building', builder.filepath

builder.initLonLatData(lons=reader.lons, lats=reader.lats)
builder.close()
builder.open('a')
builder.initFileAttributes()
builder.close()

# set chunk size for each dataset
for dataset_name in ("gddavg", "normal", "pormax", "pormin", "recent"):
    if "chunks" in builder.config.datasets[dataset_name]:
        chunks = list(builder.config.datasets[dataset_name]["chunks"])
        if "num_days" in chunks:
            chunks[chunks.index("num_days")] = days_in_history
            builder.config.datasets[dataset_name]["chunks"] = tuple(chunks)

# get the recent avg
print 'building recent average dataset'
attrs = reader.getDatasetAttributes('recent.avg')
del attrs['created']
del attrs['updated']
builder.open('a')
builder.buildDataset('recent', recent_data=reader.getData('recent.avg'),
        coverage='accumulated', threshold=threshold_str)
builder.open('a')
builder.setDatasetAttributes('recent', **attrs)
builder.close()

# create group for period of record accumulated extremes
print 'building period of record group'
timespan = 'Period of Record (%d thru %d)' % scopes['por']
builder.open('a')
builder.buildGroup('por', True, coverage='accumulated',
                   threshold=threshold_str, timespan=timespan)
builder.close()

# get computed averages and add fudge factor
# this covers 2 early season problems :
#     1. plant dates in periods of consecutive days with identical
#        average GDD yield zero avg GDD after adjustment
#     2. days when average GDD is zero (avoids zeros when dividing by avg)
print 'building period of record average dataset'
attrs = reader.getDatasetAttributes('por.avg')
del attrs['created']
del attrs['description']
del attrs['updated']

data = reader.getData('por.avg')
avg = N.zeros(data.shape, dtype=float)
for day in range(avg.shape[0]):
    avg[day,:,:] = data[day,:,:] + ((day+1) * 0.001)
builder.open('a')
builder.refreshDataset('por.avg', start_date, avg, coverage='accumulated',
                       threshold=threshold_str, timespan=timespan)
builder.setDatasetAttributes('por.avg', **attrs)
builder.close()

# convert actual GDD extremes to percent difference using adjusted average
print 'building period of record max dataset'
attrs = reader.getDatasetAttributes('por.max')
del attrs['created']
del attrs['updated']
del attrs['description']
builder.open('a')
builder.refreshDataset('por.max', start_date, reader.getData('por.max') / avg,
        coverage='accumulated', threshold=threshold_str, timespan=timespan)
builder.setDatasetAttributes('por.max', **attrs)
builder.close()

print 'building period of record min dataset'
attrs = reader.getDatasetAttributes('por.min')
del attrs['created']
del attrs['updated']
del attrs['description']
builder.open('a')
builder.refreshDataset('por.min', start_date, reader.getData('por.min') / avg,
        coverage='accumulated', threshold=threshold_str, timespan=timespan)
builder.setDatasetAttributes('por.min', **attrs)
builder.close()
reader.close()

# now add the climate normals
print 'building normal average dataset'
reader = app_factory.getNormalsFileReader(days_in_history, source, region,
                                          gdd_threshold, 'accumulated')
attrs = reader.getDatasetAttributes('normal.avg')
del attrs['created']
del attrs['updated']
# get the climate normal avg
builder.open('a')
builder.buildDataset('normal', normal_data=reader.getData('normal.avg'),
        coverage='accumulated', threshold=threshold_str)
builder.open('a')
builder.setDatasetAttributes('normal', **attrs)
builder.close()
reader.close()

msg = '....finished %d GDD history in %s'
print msg % (target_year, elapsedTime(build_start,True))

# turn annoying numpy warnings back on
warnings.resetwarnings()

