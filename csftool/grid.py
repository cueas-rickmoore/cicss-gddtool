
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

class CsfToolFileReaderMethods:

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def significantDates(self, dataset_path, include_season=False):
        dataset_attrs = self.getDatasetAttributes(dataset_path)
        dates = { }
        if include_season:
            dates['season_start'] = dataset_attrs['start_date']
            dates['season_end'] = dataset_attrs['end_date']
        dates['last_obs'] = dataset_attrs['last_obs_date']
        if 'fcast_start_date' in dataset_attrs:
            dates['fcast_start'] = dataset_attrs['fcast_start_date']
            dates['fcast_end'] = dataset_attrs['fcast_end_date']
        elif 'fcast_start' in dataset_attrs:
            dates['fcast_start'] = dataset_attrs['fcast_start']
            dates['fcast_end'] = dataset_attrs['fcast_end']
        dates['last_valid'] = dataset_attrs['last_valid_date']
        return dates

