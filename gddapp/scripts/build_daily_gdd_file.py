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

target_year = int(args[0])
if verbose: print 'target year', target_year

factory = GDDPeriodOfRecordFactory()
project = factory.getProjectConfig()
if verbose:
    print '\nproject :\n', project

region_key = options.region
if region_key is None: region_key = project.region
if len(region_key) == 2: region_key = region_key.upper()
region = factory.getRegionConfig(region_key)
if verbose: print '\nregion :\n', region

source_key = options.source
if source_key is None: source_key = project.source
source = factory.getSourceConfig(source_key)
if verbose: print '\nsource :\n', source


# create a static file reader
reader = factory.getStaticFileReader(source, region)
# create a build and initialize the file
builder = factory.getPORFileBuilder(target_year, source, region,
                                    bbox=region.data)
print 'building file :', builder.filepath
builder.build(True, True, reader.lons, reader.lats)
builder.close()
reader.close()

