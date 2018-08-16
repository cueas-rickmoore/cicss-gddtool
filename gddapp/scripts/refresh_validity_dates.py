#! /Volumes/projects/venvs/test/bin/python

import os, sys
import datetime

from gddapp.factory import GDDAppProjectFactory

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()

parser.add_option('-f', action='store_true', dest='set_fcast_date',
                        default=False)
parser.add_option('-o', action='store_true', dest='set_obs_date',
                        default=False)
parser.add_option('-v', action='store_true', dest='set_valid_date',
                        default=False)
parser.add_option('-z', action='store_true', dest='debug', default=False)

options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

current_year = datetime.date.today().year

set_fcast_date = options.set_fcast_date
set_obs_date = options.set_obs_date
set_valid_date = options.set_valid_date

factory = GDDAppProjectFactory()

filetype = args[0]

source_key = args[1]
source = factory.getSourceConfig(source_key)

region = args[2]
if len(region) == 2: region = region.upper()

year = int(args[3])
month = int(args[4])
day = int(args[5])
valid_date = datetime.date(year, month, day).strftime('%Y-%m-%d')

if filetype in ('src', 'source'):
    manager = \
        factory.getSourceFileManager(source, year, region, 'temps', mode='a')
    datasets = ('temps.maxt', 'temps.mint', 'temps.provenance')
elif filetype == 'por':
    manager = factory.getPORFileManager(source, year, region, mode='a')
    datasets = ('gdd50.daily', 'gdd50.accumulated', 'gdd50.provenance',
                'gdd8650.daily', 'gdd8650.accumulated', 'gdd8650.provenance')
else:
    print '!!! This script only works for source and POR files. !!!'
    exit()

print 'refreshing dates in', manager.filepath
for dataset in datasets:
    manager.open('a')
    if set_obs_date:
        print '    set %s last_obs_date = %s' % (dataset, valid_date)
        manager.setDatasetAttribute(dataset, 'last_obs_date', valid_date)
    if set_fcast_date:
        print '    set %s last_fcast_date = %s' % (dataset, valid_date)
        manager.setDatasetAttribute(dataset, 'last_fcast_date', valid_date)
    if set_valid_date:
        print '    set %s last_valid_date = %s' % (dataset, valid_date)
        manager.setDatasetAttribute(dataset, 'last_valid_date', valid_date)
    manager.close()

