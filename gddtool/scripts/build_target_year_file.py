#!/usr/bin/env python

import os
import datetime
import warnings

import numpy as N

from atmosci.utils.timeutils import elapsedTime, daysInYear

from gddapp.factory import GDDAppProjectFactory

from gddtool.factory import GDDToolTargetYearFactory

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

if len(args) > 0: target_year = int(args[0])
else: target_year = datetime.date.today().year
days_in_target = daysInYear(target_year)

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
reader = app_factory.getPORFileReader(target_year, source, region)
print 'reading from :', reader.filepath

tool_factory = GDDToolTargetYearFactory(for_prod_build)

# delete existing file
filepath = tool_factory.targetYearFilepath(target_year, source, region)
if os.path.exists(filepath): os.remove(filepath)
# build a new file
builder = tool_factory.getTargetYearFileBuilder(target_year, source, region,
                       bbox=reader.data_bbox)
print 'building', builder.filepath

builder.initLonLatData(lons=reader.lons, lats=reader.lats)
builder.close()
builder.open('a')
builder.initFileAttributes()
builder.close()

# set chunk size for each dataset
for dataset_name in builder.config.filetypes.target.datasets:
    if "chunks" in builder.config.datasets[dataset_name]:
        chunks = list(builder.config.datasets[dataset_name]["chunks"])
        if "num_days" in chunks:
            chunks[chunks.index("num_days")] = days_in_target
            builder.config.datasets[dataset_name]["chunks"] = tuple(chunks)

# copy the daily accumulated GDD for each threshold
for gdd_threshold in app_factory.gddThresholdsAsStrings():
    app_dataset_path = reader.gddDatasetPath('accumulated', gdd_threshold)
    dataset_path = builder.gddDatasetPath(gdd_threshold)

    # get the avg GDD for target year
    print 'building target accumulated GDD %s dataset' % gdd_threshold
    builder.open('a')
    builder.buildDataset(dataset_path, data=reader.getData(app_dataset_path),
            coverage='accumulated', threshold=gdd_threshold)

    attrs = reader.getDatasetAttributes(app_dataset_path)
    print attrs
    del attrs['description']
    builder.open('a')
    builder.setDatasetAttributes(dataset_path, **attrs)
    builder.close()

msg = '....finished GDD target for %s in %s'
print msg % (target_year, elapsedTime(build_start,True))

# turn annoying numpy warnings back on
warnings.resetwarnings()

