
from atmosci.ag.gdd import accumulateGDD, roundGDD
from atmosci.ag.gdd import calcAvgGDD, calcAvgTemp, calcGDD


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDProjectFileMethods:

    def accumulateGDD(self, gdd):
        if gdd.ndim == 3:
            return accumulateGDD(gdd, axis=0)
        elif gdd.ndim == 1:
            return accumulateGDD(gdd)
        else:
            errmsg = "Dont't know how to accumulate GDD for a %d array"
            raise ValueError, errmsg % gdd.ndim

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def calcAvgGDD(self, gdd, num_years=0):
        if num_years == 0: return calcAvgGDD(gdd, axis=0)
        else: return roundGDD(gdd/num_years)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def calcAvgTemp(self, maxt, mint, threshold):
        return calcAvgTemp(maxt, mint, threshold)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def calcGDD(self, avgt, threshold):
        return calcGDD(avgt, threshold)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getGDD(self, coverage, gdd_threshold, start_date, end_date, **kwargs):
        dataset_path = self.gddDatasetPath(coverage, gdd_threshold)
        data = self.getTimeSlice(dataset_path, start_date, end_date, **kwargs) 
        return data

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getGDDAtNode(self, coverage, gdd_threshold, start_date, end_date, 
                           lon, lat, **kwargs):
        dataset_path = self.gddDatasetPath(coverage, gdd_threshold)
        data = self.getSliceAtNode(dataset_path, start_date, end_date,
                                   lon, lat, **kwargs)
        return data

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def gddThresholdAsString(self, gdd_threshold):
        if isinstance(gdd_threshold, (list,tuple)):
            return ''.join(['%02d' % th for th in gdd_threshold])
        elif isinstance(gdd_threshold, int):
            return '%02d' % gdd_threshold
        elif isinstance(gdd_threshold, basestring):
            return gdd_threshold
        else: return str(gdd_threshold)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def gddDatasetPath(self, coverage, gdd_threshold):
        threshold = self.gddThresholdAsString(gdd_threshold)
        return 'gdd%s.%s' % (threshold, coverage.lower()) 

