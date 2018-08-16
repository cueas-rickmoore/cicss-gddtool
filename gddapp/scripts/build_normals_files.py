#!/usr/bin/env python

import os, sys
import subprocess, shlex
from datetime import datetime
BUILD_START_TIME = datetime.now()

from atmosci.utils.timeutils import elapsedTime

from gddapp.factory import GDDAppProjectFactory

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

COMPLETE_MSG = '    COMPLETED in %s : %s '
FAILURE_MSG = '    FAILED after %s : %s : return code = %d'
PYTHON_EXECUTABLE = sys.executable
SCRIPT_DIR = os.path.split(os.path.abspath(sys.argv[0]))[0]

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class BuildProcessServer(object):

    def __init__(self, year, source, region, gdd_thresholds):
        self.active_script = None
        self.arg_queue = [ ]
        self.region = region
        self.source = source
        for threshold in gdd_thresholds:
            for coverage in ('daily', 'accumulated'):
                 self.arg_queue.append( (coverage, threshold, year) )
        self.process_start_time = None

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def run(self):
        active_process = None
        keep_on_trucking = True
        
        while keep_on_trucking:
            if active_process is not None:
                active_process.poll()
                retcode = active_process.returncode
                if retcode is not None:
                    self.completeProcess(retcode)
                    active_process = None
            else:
                active_process = self.initiateProcess()
                if active_process is None: keep_on_trucking = False

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def completeProcess(self, retcode):
        elapsed_time = elapsedTime(self.process_start_time, True)
        if retcode > 0:
            print FAILURE_MSG % (elapsed_time, self.active_script, retcode)
        else: print COMPLETE_MSG % (elapsed_time, self.active_script)
        sys.stdout.flush()
        self.active_script = None

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    
    def initiateProcess(self):
        try: # will fail after last script has beencompleted
            arguments = self.arg_queue.pop()
        except:
            return None

        self.process_start_time = datetime.now()
        script = 'build_normals_file.py '
        script += ' '.join(arguments)
        script += ' -r %s -s %s' % (self.region, self.source)
        print 'running ==>', script
        command = shlex.split(SCRIPT_DIR + os.sep + script)
        command.insert(0,PYTHON_EXECUTABLE)
        self.active_script = script
        return subprocess.Popen(command, shell=False,
                                executable=PYTHON_EXECUTABLE)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()

parser.add_option('-r', action='store', dest='region', default=None)
parser.add_option('-s', action='store', dest='source', default=None)
parser.add_option('-v', action='store_true', dest='verbose', default=False)
parser.add_option('-x', action='store_true', dest='replace', default=False)
parser.add_option('-z', action='store_true', dest='debug', default=False)

options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

debug = options.debug
source = options.source
verbose = options.verbose

year = args[0]

factory = GDDAppProjectFactory()
project = factory.getProjectConfig()
if verbose:
    print '\nproject :\n', project

region = options.region
if region is None: region = project.region.name
if len(region) == 2: region = region.upper()
if verbose:
    print '\nregion :\n', region

source_key = options.source
if source is None: source = project.source.name

server = \
BuildProcessServer(year, source, region, factory.gddThresholdsAsStrings())

print 'Initiating normal file builds for', year, source, region

server.run()

elapsed_time = elapsedTime(BUILD_START_TIME, True)
print 'Finished normal file builds in %s' % elapsed_time

