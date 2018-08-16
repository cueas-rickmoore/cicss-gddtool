#!/usr/bin/env python

import os, sys
import datetime
import warnings

import numpy as N

from atmosci.utils.timeutils import elapsedTime, isLeapYear, daysInYear

from gddapp.project.access import GDDGridFileBuilder
from gddapp.factory import GDDAppProjectFactory

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

OVERKILL = 99999

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

def getTheData(reader, dataset_path, days_in_history):
    gdd = reader.getData(dataset_path)
    if isLeapYear(reader.target_year):
        # file contains a leap year but request is for GDD in a 'normal' year
        if days_in_history == 365:
            temp = N.empty((365,) + reader.lons.shape, dtype=float)
            # first 59 days - thru Feb 28
            temp[:60,:,:] = gdd[:60,:,:]
            # after March 1 - skip Feb 29
            temp[60:,:,:] = gdd[61:,:,:]
            return temp
    else: 
        # file contains a 'normal' year but request is for GDD in a leap year
        if days_in_history == 366:
            temp = N.empty((366,) + reader.lons.shape, dtype=float)
            # first 59 days - thru Feb 28
            temp[:60,:,:] = gdd[:60,:,:]
            # fudge Feb 29 by averaging Feb 28 and March 1
            temp[60,:,:] = reader.calcAvgGDD(gdd[59:61,:,:]) 
            # after March 1
            temp[61:,:,:] = gdd[60:,:,:]
            return temp
    return gdd

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

def buildGddArrays(factory, days_in_history, first_year, last_year, source,
                   region, gdd_threshold, coverage):

    group_name = 'gdd%s' % gdd_threshold
    dataset_path = '%s.%s' % (group_name,coverage)
    num_years = (last_year-first_year) + 1

    # initialze the total GDD array using GDD from the first year
    info_msg = '    getting %s GDD %s for %d'
    print info_msg % (coverage, gdd_threshold, first_year)
    reader = factory.getPORFileReader(first_year, source, region)
    total_gdd = getTheData(reader, dataset_path, days_in_history)
    reader.close()
    del reader
    # initialize extremes arrays as copies of the first year
    max_gdd = total_gdd.copy()
    min_gdd = total_gdd.copy()

    # update the 
    for year in range(first_year+1, last_year+1):
        # get a file reader for the current year
        print info_msg % (coverage, gdd_threshold, year)
        reader = factory.getPORFileReader(year, source, region)
        gdd = getTheData(reader, dataset_path, days_in_history)
        reader.close()
        del reader

        # total of all years - used for calculating average
        total_gdd = total_gdd + gdd
        # find elment-wise maximum for the 2 arrays
        max_gdd = N.maximum(gdd, max_gdd)
        # find elment-wise minimum for the 2 arrays
        min_gdd = N.minimum(gdd, min_gdd)

    sys.stdout.flush()
    # save the arrays for the next step
    reader = factory.getPORFileReader(first_year, source, region)
    gdd_dict = { 'avg':reader.calcAvgGDD(total_gdd, num_years),
                 'max':max_gdd, 'min':min_gdd }
    reader.close()
    del reader, total_gdd
    return gdd_dict

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
source = options.source
verbose = options.verbose

factory = GDDAppProjectFactory()

coverage = args[0] # 'daily' or 'accumulated'
gdd_threshold = args[1] # string version of GDD threshold

# get time spans from config file
if len(args) > 2: target_year = int(args[2])
else: target_year = datetime.date.today().year
days_in_history = daysInYear(target_year)

project = factory.getProjectConfig()
if verbose: print '\nproject :\n', project

region_key = options.region
if region_key is None: region_key = project.region
if len(region_key) == 2: region_key = region_key.upper()
region = factory.getRegionConfig(region_key)
if verbose: print '\nregion :\n', region

source_key = options.source
if source_key is None: source_key = project.source
source = factory.getSourceConfig(source_key)
if verbose: print '\nsource :\n', source

# delete existing file
filepath = factory.historyGridFilepath(target_year, source, region,
                                       gdd_threshold, coverage)
if verbose: print '\nhistory filepath :', filepath
if os.path.exists(filepath): os.remove(filepath)

# filter annoying numpy warnings
warnings.filterwarnings('ignore',"All-NaN axis encountered")
warnings.filterwarnings('ignore',"All-NaN slice encountered")
warnings.filterwarnings('ignore',"invalid value encountered in greater")
warnings.filterwarnings('ignore',"invalid value encountered in less")
warnings.filterwarnings('ignore',"Mean of empty slice")
# MUST ALSO TURN OFF WARNING FILTERS AT END OF SCRIPT !!!!!


# create the history file and initialize it's groups/datasets
scopes = factory.getAvailableScopes(target_year)
if verbose: print 'scopes :', scopes

reader = factory.getStaticFileReader(source, region)
if verbose: print 'reader :', reader

builder = factory.getHistoryFileBuilder(target_year, source, region,
                  gdd_threshold, coverage, bbox=project.bbox[region.name])
print 'building', builder.filepath
builder.build(lons=reader.lons, lats=reader.lats, coverage=coverage,
              scopes=scopes)
# finished with this builder
builder.close()
del builder
reader.close()
del reader

# create the average GDD arrays for each time span
for group in factory.config.filetypes.history50.groups:
    scope = group[1]['path']
    first_year, last_year = scopes[scope]
    span_start = datetime.datetime.now()

    msg = '\ngenerating %d (%d days) history of %s GDD extremes for %s scope'
    print msg % (target_year, days_in_history, coverage, scope)
    gdd_dict = buildGddArrays(factory, days_in_history, first_year, last_year,
                              source, region, gdd_threshold, coverage)

    # update the GDD datasets in the history file
    msg = '    updating %s dataset in %d %s GDD history file' 
    manager = factory.getHistoryFileManager(target_year, source, region,
                                            gdd_threshold, coverage, 'a')
    for dataset_name, gdd_grid in gdd_dict.items():
        dataset_path = '%s.%s' % (scope, dataset_name)
        print msg % (dataset_path, target_year, gdd_threshold)
        manager.open('a')
        manager.updateDataset(dataset_path, 1, gdd_grid)
        manager.close()

    msg = '....finished %s GDD history in %s'
    print msg % (scope, elapsedTime(span_start,True))


# turn annoying numpy warnings back on
warnings.resetwarnings()

