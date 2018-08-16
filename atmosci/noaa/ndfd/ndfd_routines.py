from netCDF4 import Dataset
from numpy import float32, int32

def getLonLat(lon, lat):
	lenLat = len(lat)
	lenLon = len(lat[0])
	lonLat = range(lenLat)
	for i in xrange(lenLat):
		lonLat[i] = range(lenLon)
		for j in xrange(lenLon):
			if lon[i][j] > 180.:
				llPair = [ lon[i][j] - 360., lat[i][j] ]
			else:
				llPair = [ lon[i][j], lat[i][j] ]
			lonLat[i][j] = llPair
			
	return lonLat

def writeNetcdf(varDefs, outDir):
	# Open output netcdf file:
	nc = Dataset(outDir + varDefs['write'] + '.nc', 'w', format='NETCDF4')
	
	# Define dimensions:
	timeDim = nc.createDimension('timeDim', len(varDefs['validTimes']))
	varDim = nc.createDimension('varDim', len(varDefs['varData']))
	latDim = nc.createDimension('latDim', varDefs['lenLat'])
	lonDim = nc.createDimension('lonDim', varDefs['lenLon'])
	fourDim = nc.createDimension('fourDim', 4)
	twoDim = nc.createDimension('twoDim', 2)
	oneDim = nc.createDimension('oneDim', 1)
	
	# Define variables:
	varTime = nc.createVariable('validTime', 'i4', ('timeDim', 'fourDim'))
	varFlag = nc.createVariable('validFlag', 'i4', ('timeDim',))
	varDS = nc.createVariable(varDefs['write'], 'f4', ('varDim', 'latDim', 'lonDim'))
	varLonLat = nc.createVariable('lon_lat', 'f4', ('oneDim', 'latDim', 'lonDim', 'twoDim'))
	
	# Set variable attributes:
	varTime.long_name = 'Valid Forecast Time'
	varTime.units = 'UTC_string'
	varFlag.long_name = 'Valid Data Flag'
	varFlag.units = '-'
	varDS.title = varDefs['title']
	varDS.units = varDefs['units']
	varDS.associate = 'timeDim latDim lonDim'
	varDS.missing_value = 9999.0
	varLonLat.long_name = 'Longitude Latitude'
	varLonLat.units = 'deg_north_deg_east'
	
	# Write data to variables and close/cleanup the files:
	for i in range(len(varDefs['validTimes'])):
		varTime[i] = int32(varDefs['validTimes'][i])
	for i in range(len(varDefs['varValid'])):
		varFlag[i] = varDefs['varValid'][i]
	for i in range(len(varDefs['varData'])):
		varDS[i] = varDefs['varData'][i]
	varLonLat[0] = float32(varDefs['lon_lat'])
	nc.close()
	
def getVarDefs():
	varDefs = dict()
	
	# Maximum Temperature
	varDefs['ds.maxt.bin'] = dict()
	varDefs['ds.maxt.bin']['read'] = 'TMAX_surface'
	varDefs['ds.maxt.bin']['write'] = 'tmax'
	varDefs['ds.maxt.bin']['title'] = 'Max Temp 24-hr'
	varDefs['ds.maxt.bin']['units'] = 'Kelvin'
	
	# Minimum Temperature
	varDefs['ds.mint.bin'] = dict()
	varDefs['ds.mint.bin']['read'] = 'TMIN_surface'
	varDefs['ds.mint.bin']['write'] = 'tmin'
	varDefs['ds.mint.bin']['title'] = 'Min Temp 24-hr'
	varDefs['ds.mint.bin']['units'] = 'Kelvin'
	
	# Probability of Precipitation (12-hr)
	varDefs['ds.pop12.bin'] = dict()
	varDefs['ds.pop12.bin']['read'] = 'APCP_surface'
	varDefs['ds.pop12.bin']['write'] = 'pop12'
	varDefs['ds.pop12.bin']['title'] = 'Prob of Precip 12-hr'
	varDefs['ds.pop12.bin']['units'] = 'Percent'
	
	# Precipitation Amount
	varDefs['ds.qpf.bin'] = dict()
	varDefs['ds.qpf.bin']['read'] = 'APCP_surface'
	varDefs['ds.qpf.bin']['write'] = 'qpf'
	varDefs['ds.qpf.bin']['title'] = 'Precip Amount Acc 6-hr'
	varDefs['ds.qpf.bin']['units'] = 'kg/m^2'
	
	# Relative Humidity
	varDefs['ds.rhm.bin'] = dict()
	varDefs['ds.rhm.bin']['read'] = 'RH_surface'
	varDefs['ds.rhm.bin']['write'] = 'rhum'
	varDefs['ds.rhm.bin']['title'] = 'Relative Humidity Instantaneous'
	varDefs['ds.rhm.bin']['units'] = 'Percent'
	
	# Wind Direction
	varDefs['ds.wdir.bin'] = dict()
	varDefs['ds.wdir.bin']['read'] = 'WDIR_surface'
	varDefs['ds.wdir.bin']['write'] = 'wdir'
	varDefs['ds.wdir.bin']['title'] = 'Wind Direction (dir from)'
	varDefs['ds.wdir.bin']['units'] = 'Deg from north'
	
	# Wind Speed
	varDefs['ds.wspd.bin'] = dict()
	varDefs['ds.wspd.bin']['read'] = 'WIND_surface'
	varDefs['ds.wspd.bin']['write'] = 'wspd'
	varDefs['ds.wspd.bin']['title'] = 'Wind Speed'
	varDefs['ds.wspd.bin']['units'] = 'm/s'
	
	# Dew Point Temperature
	varDefs['ds.td.bin'] = dict()
	varDefs['ds.td.bin']['read'] = 'DPT_surface'
	varDefs['ds.td.bin']['write'] = 'td'
	varDefs['ds.td.bin']['title'] = 'Dew Point Temp Instantaneous'
	varDefs['ds.td.bin']['units'] = 'Kelvin'
	
	# Temperature
	varDefs['ds.temp.bin'] = dict()
	varDefs['ds.temp.bin']['read'] = 'TMP_surface'
	varDefs['ds.temp.bin']['write'] = 'temp'
	varDefs['ds.temp.bin']['title'] = 'Temperature Instantaneous'
	varDefs['ds.temp.bin']['units'] = 'Kelvin'
	
	# Sky Cover
	varDefs['ds.sky.bin'] = dict()
	varDefs['ds.sky.bin']['read'] = 'TCDC_surface'
	varDefs['ds.sky.bin']['write'] = 'sky'
	varDefs['ds.sky.bin']['title'] = 'Sky Cover Instantaneous'
	varDefs['ds.sky.bin']['units'] = 'Percent'
	
	# Weather Conditions
	varDefs['ds.wx.bin'] = dict()
	varDefs['ds.wx.bin']['write'] = 'vis'
	varDefs['ds.wx.bin']['title'] = 'Visibility'
	varDefs['ds.wx.bin']['units'] = 'Statute Miles'
	
	return varDefs