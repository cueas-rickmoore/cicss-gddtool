
try:
    import json
except:
    import simplejson as json

from atmosci.utils.timeutils import DateIterator

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class GDDToolFileMethods:

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getEncodedDays(self, start_date, end_date):
        days = [ date.strftime('%Y-%m-%d')
                 for date in DateIterator(start_date, end_date) ]
        return self.tightJsonString(days)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def gddThresholdString(self, gdd_threshold):
        if isinstance(gdd_threshold, basestring):
            threshold = \
                self.config.project.threshold_map.get(gdd_threshold, None)
            if threshold: return self.gddThresholdString(threshold)
        if isinstance(gdd_threshold, (list,tuple)):
            return ''.join(['%02d' % th for th in gdd_threshold])
        elif isinstance(gdd_threshold, int):
            return '%02d' % gdd_threshold
        elif isinstance(gdd_threshold, basestring):
            return gdd_threshold
        else: return str(gdd_threshold)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def tightJsonString(self, value):
        return json.dumps(value, separators=(',', ':'))

