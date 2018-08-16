#!/usr/bin/python

import ftp
from ndfd_routines import getVarDefs, getLonLat, writeNetcdf

from calendar import timegm
from math import floor
from multiprocessing import Process
from netCDF4 import Dataset
from numpy import array
from os import devnull, listdir, path, remove, rename
import subprocess
from sys import stdout
from time import gmtime, strftime, strptime, time

def callShell(command):
	with open(devnull, 'w') as f:
		subprocess.call(command.split(), stdout=f)
	return

dateString = strftime("%Y%m%d%H", gmtime())
#tmpDir = '/dev/shm/ndfd/'
tmpDir = '/home/web/datasets/tmp/'
griddedDir = '/home/web/datasets/gridded/NDFD/'
outDir = griddedDir + dateString + '/'
maxConn = 20
area = 'conus'
#dirList = ['ST.expr', 'ST.opnl'] # Not sure why experimental is included, all seem to be overwritten by operational. This is inherited from the old script...
dirList = ['ST.expr']
vpToGet = ['VP.001-003', 'VP.004-007']
varDefs = getVarDefs()
ftpBase = 'ftp://tgftp.nws.noaa.gov/SL.us008001/%s/DF.gr2/DC.ndfd/AR.%s/'
wgrib = '/usr/local/bin/wgrib2 %s -netcdf %s'
degrib = '/usr/local/bin/degrib %s -C -Csv -msg 0'
ln = '/bin/ln -s %s current%s'
cleanupAge = 345600

# Queue the list of data files and download them to shared memory:
startTime = int(time())
ftpQueue = []
gribFiles = []
for dir in dirList:
	remoteDir = ftpBase % (dir, area)
	vpList = ftp.getDirFiles(remoteDir)
	for vp in vpList:
		if vp not in vpToGet: continue
		vpDir = remoteDir + vp + '/'
		tmpBase = tmpDir + vp + '/'
		subprocess.os.system('mkdir -p ' + tmpBase)
		fileList = ftp.getDirFiles(vpDir)
		for file in fileList:
			if file not in varDefs.keys(): continue
			remotePath = vpDir + file
			localPath = tmpBase + file
			ftpQueue.append((remotePath, localPath))
			gribFiles.append((file, tmpBase))
	ftp.getMulti(maxConn, ftpQueue)
	ftpQueue = []
duration = int(time()) - startTime
stdout.write('Retrieved files in: ' + str(duration) + '\n')
stdout.flush()

# Convert retrieved grib2 files to netcdf:
startTime = int(time())
degribJobs = []
while gribFiles:
	file, dir = gribFiles.pop(0)
	if not path.isfile(dir + file): continue
	cmd = wgrib % (dir + file, dir + file + '.nc')
	with open(devnull, 'w') as f:
		subprocess.call(cmd.split(), stdout=f)
	if file == 'ds.wx.bin' and len(degribJobs) < 2:
		cmd = degrib % (dir + file)	
		subprocess.os.system('mkdir -p ' + tmpDir + 'wx/')
		subprocess.os.chdir(tmpDir + 'wx/')
		if __name__ == '__main__':
			p = Process(target=callShell, args=(cmd,))
			degribJobs.append(p)
			p.start()
	else:
		remove(dir + file)
	#stdout.write('Converted ' + file + '\n')
	#stdout.flush()
	
duration = int(time()) - startTime
stdout.write('Converted files in: ' + str(duration) + '\n')
stdout.flush()

# Use netCDF4 to read data in and generate current forecast data:
startTime = int(time())
vpPath1 = tmpDir + 'VP.001-003/'
vpPath2 = tmpDir + 'VP.004-007/'
outPath = outDir + '/'
subprocess.os.system('mkdir -p ' + outPath)
for ds in varDefs.keys():
	if ds == 'ds.wx.bin':
		continue
	
	dsFile1 = vpPath1 + ds + '.nc'
	dsFile2 = vpPath2 + ds + '.nc'

	# Read in data from 1-3 day forecasts:
	day1 = Dataset(dsFile1, 'r')
	lat = array(day1.variables['latitude'])
	lon = array(day1.variables['longitude'])
	time1 = day1.variables['time']
	data1 = day1.variables[varDefs[ds]['read']]
	
	# qpf doesn't exist for 4-7, so copy the 1-3 over. Not sure of the implications of this but it is inherited from the old script...
	if not path.isfile(dsFile2):
		subprocess.os.system('cp ' + dsFile1 + ' ' + dsFile2)
	
	# Read in data from 4-7 day forecasts:
	day2 = Dataset(dsFile2, 'r')
	time2 = day2.variables['time']
	data2 = day2.variables[varDefs[ds]['read']]	
	
	# Populate 2D array of Lon,Lat values:
	varDefs[ds]['lenLat'] = len(lat)
	varDefs[ds]['lenLon'] = len(lat[0])
	varDefs[ds]['lon_lat'] = getLonLat(lon, lat)
			
	# Create list of valid forecast times (every hour for 7 days):
	varDefs[ds]['validTimes'] = list()
	for i in xrange(169):
		validTime = 3600 * i + time1.reference_time
		tuple = list()
		tuple.append(int(strftime('%Y', gmtime(validTime))))
		tuple.append(int(strftime('%m', gmtime(validTime))))
		tuple.append(int(strftime('%d', gmtime(validTime))))
		tuple.append(int(strftime('%H', gmtime(validTime))))
		varDefs[ds]['validTimes'].append(tuple)
		
	# Create list of time flags (1 = data exists; 0 = no data):
	max_vHr = -1
	varDefs[ds]['varData'] = list()
	varDefs[ds]['varValid'] = [0] * 169
	for i in xrange(len(time1)):
		vHr = int((time1[i] - time1.reference_time) / 60 / 60)
		max_vHr = vHr
		varDefs[ds]['varValid'][vHr] = 1
		varDefs[ds]['varData'].append(data1[i])
		
	# Do the same for 4-7 day forecasts:
	for i in xrange(len(time2)):
		vHr = int((time2[i] - time2.reference_time) / 60 / 60)
		if vHr > max_vHr and vHr < len(varDefs[ds]['varValid']):
			varDefs[ds]['varValid'][vHr] = 1
			varDefs[ds]['varData'].append(data2[i])
	
	# Write data to netcdf file and clean up temp files
	writeNetcdf(varDefs[ds], outDir)
	day1.close()
	day2.close()
	remove(dsFile1)
	remove(dsFile2)
	stdout.write('Wrote ' + varDefs[ds]['write'] + '.nc\n')
	stdout.flush()

for p in degribJobs:
	p.join()

# Generate visibility forecast (vis.nc):
ds = varDefs['ds.wx.bin']
ncRead = Dataset(vpPath1 + 'ds.wx.bin.nc')
lat = array(ncRead.variables['latitude'])
lon = array(ncRead.variables['longitude'])
refTime = ncRead.variables['time'].reference_time

# Populate 2D array of Lon,Lat values:
ds['lenLat'] = len(lat)
ds['lenLon'] = len(lat[0])
ds['lon_lat'] = getLonLat(lon, lat)

# Create list of csv + txt output files from degrib
wxDir = tmpDir + 'wx/'
subprocess.os.chdir(wxDir)
fileList = subprocess.os.listdir(wxDir)
csvList = [f for f in fileList if f[-3:] == 'csv']
txtList = [f for f in fileList if f[-3:] == 'txt']
numTimes = len(csvList)

# Create list of valid forecast times (every hour for 7 days)
ds['validTimes'] = list()
for i in xrange(169):
	validTime = 3600 * i + refTime
	tuple = list()
	tuple.append(int(strftime('%Y', gmtime(validTime))))
	tuple.append(int(strftime('%m', gmtime(validTime))))
	tuple.append(int(strftime('%d', gmtime(validTime))))
	tuple.append(int(strftime('%H', gmtime(validTime))))
	ds['validTimes'].append(tuple)

# Create list of time flags (1 = data exists; 0 = no data):
max_vHr = -1
ds['varValid'] = [0] * 169
for txt in txtList:
	f = open(wxDir + txt, 'r')
	lines = f.readlines()
	refLine = [line for line in lines if 'Forecast time' in line][0]
	vHr = int(float(refLine.strip().split('|')[-1]))
	if vHr < len(ds['varValid']):
		max_vHr = vHr
		ds['varValid'][vHr] = 1
	f.close()
	remove(wxDir + txt)

# Populate data array
ds['varData'] = range(len(csvList))
for i in xrange(len(ds['varData'])):
	ds['varData'][i] = range(ds['lenLat'])
	for j in xrange(len(ds['varData'][i])):
		ds['varData'][i][j] = range(ds['lenLon'])

# Set data to array
for i in range(len(csvList)):
	csv = csvList[i]
	f = open(wxDir + csv, 'r')
	lines = f.readlines()
	for line in lines[1:]:
		line = line.strip().split(',')
		iLon = int(line[0]) - 1
		iLat = int(line[1]) - 1
		val = line[4].strip()
		if ':' in val:
			val = val.split('^')[0].split(':')[3]
			if val == '0SM': val = 0.00
			if val == '1/4SM': val = 0.25
			if val == '1/2SM': val = 0.50
			if val == '3/4SM': val = 0.75
			if val == '1SM': val = 1.00
			if val == '11/2SM': val = 1.50
			if val == '2SM': val = 2.00
			if val == '21/2SM': val = 2.50
			if val == '3SM': val = 3.00
			if val == '4SM': val = 4.00
			if val == '5SM': val = 5.00
			if val == '6SM': val = 6.00
			if val == 'P6SM': val = 7.00
			if val == '<NoVis>': val = 9999.0
		else:
			val = 9999.0
		ds['varData'][i][iLat][iLon] = val
	f.close()
	remove(wxDir + csv)

# Write vis.nc and clean up
writeNetcdf(ds, outDir)
ncRead.close()
remove(vpPath1 + 'ds.wx.bin.nc')
remove(vpPath2 + 'ds.wx.bin.nc')
duration = int(time()) - startTime
stdout.write('Wrote vis.nc\n')

duration = int(time()) - startTime
stdout.write('Wrote netcdf files in: ' + str(duration) + '\n')
stdout.flush()

# Create new links in data server directory
subprocess.os.chdir(griddedDir)
HH = dateString[-2:]
if path.exists('previous'): remove('previous')
if path.exists('current'): rename('current', 'previous')
if path.exists('current' + HH): remove('current' + HH)
cmd = ln % (dateString, '')
cmdHH = ln % (dateString, HH)
subprocess.call(cmd.split())
subprocess.call(cmdHH.split())

# Clean up old forecast files from data server
delTime = int(time()) - cleanupAge
fcstList = listdir('.')
for f in fcstList:
	try: fcstTime = timegm(strptime(f, '%Y%m%d%H'))
	except:	continue
	if not fcstTime < delTime: continue
	cmd = 'rm -rf ' + f
	subprocess.call(cmd.split())
	stdout.write('Deleted forecast: ' + f + '\n')
	stdout.flush()
