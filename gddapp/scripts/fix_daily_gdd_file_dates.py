#!/usr/bin/env python
import os, sys
import datetime

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

factory = GDDAppProjectFactory()
project = factory.getProjectConfig()

target_year = int(args[0])
end_of_year = '%d-12-31' % target_year

source_key = args[1]
if source_key is None: source_key = project.source
source = factory.getSourceConfig(source_key)
if verbose:
    print 'the source config is :\n', source
    print ' '

region = args[2]
if region is None: region = project.region
if len(region) == 2: region = region.upper()

# fix the source file for the target year
manager = \
    factory.getSourceFileManager(source, target_year, region, 'temps', 'a')
print 'fixing dates in', manager.filepath
print '    removing forecast attributes from temps.maxt'
manager.deleteDatasetAttribute('temps.maxt','fcast_end_date')
manager.deleteDatasetAttribute('temps.maxt','fcast_start_date')
print '    setting last_obs_date to %s in temps.maxt' % end_of_year
manager.setDatasetAttribute('temps.maxt','last_obs_date', end_of_year)
manager.close()
manager.open('a')
print '    removing forecast attributes from temps.mint'
manager.deleteDatasetAttribute('temps.mint','fcast_end_date')
manager.deleteDatasetAttribute('temps.mint','fcast_start_date')
print '    setting last_obs_date to %s in temps.mint' % end_of_year
manager.setDatasetAttribute('temps.mint','last_obs_date', end_of_year)
manager.close()
del manager

# get the POR file manager
manager = factory.getPORFileManager(target_year, source, region, 'a')
print 'fixing dates in', manager.filepath
for threshold in factory.project.gdd_thresholds:
    thresh_str = factory.gddThresholdAsString(threshold)
    group = 'gdd%s' % thresh_str
    for dsname in ('accumulated', 'daily', 'provenance'):
        manager.open('a')
        dataset = '%s.%s' % (group, dsname)
        print '    removing forecast attributes from', dataset
        manager.deleteDatasetAttribute(dataset,'fcast_start_date')
        manager.deleteDatasetAttribute(dataset,'fcast_end_date')
        print '    setting last_obs_date to %s in %s' % (end_of_year, dataset)
        manager.setDatasetAttribute(dataset,'last_obs_date', end_of_year)
    manager.close()

