#! /usr/bin/env python

import os

import Tkinter
import tkFileDialog

import h5py
import numpy as N
import pygrib
from acis_rucconf import config

#from locatepkg import importObject

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()
parser.add_option('-d', action='store', type='string', default=None,
                  dest='dem_static_filepath',
                  help="Full path to directory for DEM static data file.")
parser.add_option('-r', action='store', type='string', default=None,
                  dest='ruc_static_dirpath',
                  help="Full path to directory for RUC static data file.")
parser.add_option('-t', action='store', type='string', dest='topo_filepath',
                  default=None,
                  help="Full path to RUC topography data file.")
options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

if len(args) > 0:
    search_radius = float(args[0])
else:
    search_radius = 0.5

ruc_static_filename = config.ruc13k.static_filename
if options.ruc_static_dirpath is not None:
    ruc_static_dirpath = options.ruc_static_dirpath
else:
    ruc_static_dirpath = config.ruc13k.static_dir
if not os.path.isdir(ruc_static_dirpath):
    errmsg = 'RUC 13K static data directory was not found : %s'
    raise IOError, errmsg % ruc_static_dirpath
ruc_static_filepath = os.path.join(ruc_static_dirpath, ruc_static_filename)

if options.topo_filepath is not None:
    ruc_topo_filepath = options.topo_filepath
    if os.path.isdir(ruc_topo_filepath):
        ruc_topo_filepath = os.path.join(ruc_topo_filepath,
                                         config.ruc.r40k.topo_filename)
else:
    ruc_topo_filepath = os.path.join(ruc_static_dirpath,
                                     config.ruc.r40k.topo_filename)
if not os.path.isfile(ruc_topo_filepath):
    errmsg = 'RUC 13K topgraphy file was not found : %s'
    raise IOError, errmsg % ruc_topo_filepath

if options.dem_static_filepath is not None:
    dem_static_filepath = options.dem_static_filepath
    if os.path.isdir(dem_static_filepath):
        dem_static_filepath = os.path.join(dem_static_filepath,
                                           config.dem5k.static_filename)
else:
    dem_static_filepath = os.path.join(config.dem5k.static_dir,
                                       config.dem5k.static_filename)
 if not os.path.isfile(dem_static_filepath):
    errmsg = 'DEM 5K static data file was not found : %s'
    raise IOError, errmsg % dem_static_filepath
# get latitude and longitude arrays from a grib file
grib_filepath = tkFileDialog.askopenfilename(
	                         filetypes=[('grib_files','.grib'),('any','*')],
                             initialdir='/Users/Shared/grid')
grib_file = pygrib.open(str(grib_filepath))
ruc_lats, ruc_lons = grib_file[1].latlons()
array_shape = ruc_lons.shape

# save altitude and longitude arrays in the static HDF5 file
ruc_file = h5py.File(ruc_static_filepath,'w')
ruc_file.create_dataset('lon',data=ruc_lons)
ruc_file.create_dataset('lat',data=ruc_lats)
ruc_file.close()
grib_file.close()

# get topography from the ascii file
topo_file = open(topo_filepath, 'r')

topo = [ ]
line = topo_file.readline()
while line:
    indx = 0
    while indx < len(line.strip()):
        elev = float(line[indx:indx+8].strip())
        topo.append(elev)
        indx += 8
    line = topo_file.readline()

topo_file.close()
topo = N.array(topo)
topo = topo.reshape(array_shape)

# save topography in the static HDF5 file
ruc_file = h5py.File(ruc_static_filepath,'a')
dataset = ruc_file.create_dataset('topomini',data=topo)
dataset.attrs['units'] = 'm'
ruc_file.close()

# build the land/water mask based on the one used for DEM 5K
dem5k_file = h5py.File(dem_static_filepath, 'r')
dem5k_mask = dem5k_file[config.dem5k.mask_name][:,:]
dem5k_lons = dem5k_file['lon'][:,:]
dem5k_lats = dem5k_file['lat'][:,:]
dem5k_file.close()

ruc_mask = N.empty(ruc_lons.shape,dtype=bool)
ruc_mask.fill(True)

max_x = ruc_lons.shape[0]
max_y = ruc_lons.shape[1]

for rx in range(max_x):
    print 'row', rx
    for ry in range(max_y):
        ruc_lon = ruc_lons[rx,ry]
        ruc_lat = ruc_lats[rx,ry]
        bbox = (ruc_lon-search_radius, ruc_lon+search_radius,
                ruc_lat-search_radius, ruc_lat+search_radius)
        indexes = N.where( (dem5k_lons >= bbox[0]) & (dem5k_lons <= bbox[1]) &
                           (dem5k_lats >= bbox[2]) & (dem5k_lats <= bbox[3]) )

        masked = True
        for indx in range(len(indexes[0])):
            dx = indexes[1][indx]
            dy = indexes[0][indx]
            masked = masked & dem5k_mask[dy,dx]

        ruc_mask[rx,ry] = masked

ruc_file = h5py.File(ruc_static_filepath, 'a')
ruc_file.create_dataset('mask', data=ruc_mask)
ruc_file.close()

