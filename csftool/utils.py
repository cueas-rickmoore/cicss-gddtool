
import os

from atmosci.utils.config import ConfigMap

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

def validateResourceConfiguration(server_config):
    resource_dirpath = server_config.dirpaths.resources
    resources = { }

    for name, config in server_config.resources.items():
        handler_key, resource_type, path = config

        if isinstance(path, (tuple,list)):
            path_size = len(path)
        else: path_size = 1

        if path_size == 1:
            path = os.path.join(resource_dirpath, path)
        else: path = os.path.join(resource_dirpath, *path)

        if os.path.exists(path):
            resources[name] = (handler_key, resource_type, path)
        else:
            raise IOError, '%s does not exist : %s' % (resource_type, path)

    return ConfigMap(resources)

