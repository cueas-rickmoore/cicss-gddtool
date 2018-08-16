#! /Library/Frameworks/Python.framework/Versions/2.6/bin/python

import os

import h5py
import numpy as N

from acis_rucconf import config

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()
parser.add_option('-m', action='store', type='string', dest='mask_name',
                  default='mask',
                  help="Name of RUC mask to build.")
parser.add_option('-s', action='store', type='string', dest='static_dirpath',
                  default=None,
                  help="Full path to RUC static data files.")
options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

if len(args) > 0:
    search_radius = float(args[0])
else:
    search_radius = 0.1

mask_name = options.mask_name

if options.static_dirpath is not None:
    static_dirpath =  os.path.normpath(options.static_dirpath)
    if not os.path.isdir(static_dirpath):
        errmsg = "Static data directory was not found in '%s'"
        raise IOError, errmsg % static_dirpath
else:
    static_dirpath = config.ruc13k.static_dir

ruc_filepath = config.ruc13k.static_filename
if not os.path.isfile(ruc_filepath):
    ruc_filepath = os.path.join(static_dirpath, config.ruc13k.static_filename)
    if not os.path.isfile(ruc_filepath):
        errmsg = "Static RUC 13K location and elevation file was not found in '%s'"
        raise IOError, errmsg % ruc_filepath

dem5k_filepath = config.dem5k.static_filename
if not os.path.isfile(dem5k_filepath):
    dem5k_filepath = os.path.join(static_dirpath, config.dem5k.static_filename)
    if not os.path.isfile(dem5k_filepath):
        errmsg = "Static DEM 5K location and elevation file was not found in '%s'"
        raise IOError, errmsg % dem5k_filepath

# open DEM 5K grid file and get location data for each grid node
dem5k_file = h5py.File(dem5k_filepath, 'r')
dem5k_mask = dem5k_file[mask_name][:,:]
dem5k_lons = dem5k_file['lon'][:,:]
dem5k_lats = dem5k_file['lat'][:,:]
dem5k_file.close()

ruc_file = h5py.File(ruc_filepath,'r')
ruc_lons = ruc_file['lon'][:,:]
max_x = ruc_lons.shape[0]
max_y = ruc_lons.shape[1]
ruc_lats = ruc_file['lat'][:,:]
ruc_file.close()

ruc_mask = N.empty(ruc_lons.shape,dtype=bool)
ruc_mask.fill(True)

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

ruc_file = h5py.File(ruc_filepath, 'a')
ruc_datasets = dem5k_file.keys()
if mask_name in ruc_datasets:
    ruc_file[mask_name][:,:] = ruc_mask
else:
    dataset = ruc_file.create_dataset(mask_name, data=ruc_mask)
ruc_file.close()
