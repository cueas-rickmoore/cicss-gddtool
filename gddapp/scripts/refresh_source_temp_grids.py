#! /Volumes/projects/venvs/test/bin/python

import os, sys
import warnings

import datetime
from dateutil.relativedelta import relativedelta
ONE_DAY = relativedelta(days=1)

import numpy as N

from atmosci.utils.options import stringToTuple
from atmosci.utils.timeutils import asDatetimeDate

from gddapp.factory import GDDAppSourceGridFactory

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()

parser.add_option('-d', action='store', dest='delta', type=int, default=10)
parser.add_option('-r', action='store', dest='region', default=None)
parser.add_option('-s', action='store', dest='source', default=None)
parser.add_option('-v', action='store_true', dest='verbose', default=False)
parser.add_option('-z', action='store_true', dest='debug', default=False)

options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

current_year = datetime.date.today().year
delta = relativedelta(days=options.delta-1)

debug = options.debug
verbose = options.verbose or debug
if debug: print '\ndownload_latest_temp_grids.py', args

factory = GDDAppSourceGridFactory()
project = factory.getProjectConfig()

region = options.region
if region is None: region = project.region
if len(region) == 2: region = region.upper()
bbox = factory.config.regions[region].data

source_key = options.source
if source_key is None: source_key = project.source
source = factory.getSourceConfig(source_key)
tag = source.tag

latest_available_date = factory.latestAvailableDate(source)
latest_available_time = \
    factory.latestAvailableTime(source, latest_available_date)
if latest_available_time > datetime.datetime.now():
    latest_available_date = latest_available_date - ONE_DAY

# get the date span
num_args = len(args)
end_date = None
start_date = None
if num_args == 0:
    target_year = datetime.date.today().year
    target_year = int(args[0])
elif num_args in (1,3,5):
    target_year = int(args[0])
    if num_args in (3,5):
        start_date = datetime.date(target_year, int(args[1]), int(args[2]))
        if num_args == 5:
            end_date = datetime.date(target_year,int(args[3]), int(args[4]))
else:
    print 'EXITING :', __file__
    print ' unable to parse date from args "%s"' % ' '.join(args) 
    os._exit(99)

if datetime.date(target_year,1,1) > latest_available_date:
    print 'EXITING :', __file__
    print 'aata is not avaiable for %d' % target_year
    os._exit(99)

# get a temperature data file manger
manager = factory.getSourceFileManager(source, target_year, region,
                                       'temps', mode='r')
if start_date is None:
    last_obs_date = \
        manager.getDateAttribute('temps.maxt', 'last_obs_date', None)
    if last_obs_date is not None:
        start_date = last_obs_date - ONE_DAY
    else:
        start_date = datetime.date(target_year, 1, 1)

acis_grid = int(manager.getDatasetAttribute('temps.maxt', 'acis_grid'))
bbox = manager.data_bbox
manager.close()

if end_date is None:
    if start_date.year == latest_available_date.year:
        end_date = latest_available_date
    else: end_date = datetime.date(start_date.year, 12, 31)

if end_date == start_date:
    msg = 'refreshing %s temps for %s'
    print msg % (source.tag, start_date.strftime('%B %d, %Y'))  
    end_date = None
else:
    msg = 'refreshing %s temps for %s thru %s'
    print msg % (source.tag, start_date.strftime('%B %d'),  
                 end_date.strftime('%B %d, %Y'))

if debug:
    print 'temp manager', manager
    print 'temp manager file', manager.filepath


# filter annoying numpy warnings
warnings.filterwarnings('ignore',"All-NaN axis encountered")
warnings.filterwarnings('ignore',"All-NaN slice encountered")
warnings.filterwarnings('ignore',"invalid value encountered in greater")
warnings.filterwarnings('ignore',"invalid value encountered in less")
warnings.filterwarnings('ignore',"Mean of empty slice")
# MUST ALSO TURN OFF WARNING FILTERS AT END OF SCRIPT !!!!!

span_start = start_date
while span_start < end_date:
    span_end = span_start + delta
    if span_end > end_date: span_end = end_date
    # download current ACIS mint,maxt for time span
    print 'downloading temps for', span_start, span_end
    data = factory.getAcisGridData(acis_grid, 'mint,maxt', span_start,
                                   span_end, False, bbox=bbox, debug=debug)
    if debug: print 'temp data\n', data

    manager.open('a')
    manager.refreshTempGroup(span_start, data['mint'], data['maxt'], tag)
    manager.close()

    span_start = span_end + ONE_DAY 

# turn annoying numpy warnings back on
warnings.resetwarnings()

