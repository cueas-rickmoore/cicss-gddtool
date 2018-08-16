import cStringIO
import pycurl
import sys
from time import sleep

# Basic FTP functions
# Note that these functions are persistent, they will keep retrying on timeouts indefinitely

def getDirListing(URL):
	out = cStringIO.StringIO()
	c = pycurl.Curl()
	c.setopt(pycurl.URL, URL)
	c.setopt(pycurl.FOLLOWLOCATION, 1)
	c.setopt(pycurl.MAXREDIRS, 5)
	c.setopt(pycurl.CONNECTTIMEOUT, 30)
	c.setopt(pycurl.TIMEOUT, 300)
	c.setopt(pycurl.NOSIGNAL, 1)
	c.setopt(pycurl.WRITEFUNCTION, out.write)
	try: c.perform()
	except:
		sys.stderr.write('Error retrieving dir listing: ' + URL + ' ***Retrying in one min***\n')
		sys.stderr.flush()
		c.close()
		sleep(60)
		return getDirListing(URL)
	c.close()
	
	return out.getvalue()
	
def getDirFiles(URL):
	dirListing = getDirListing(URL).split('\n')
	fileNames = []
	for line in dirListing:
		files = line.split()
		if not files: continue
		fileNames.append(files[8])
	
	return fileNames

# May throw an exception that should be caught
def getFile(URL, outFile):
	f = open(outFile, "wb")
	c = pycurl.Curl()
	c.setopt(pycurl.URL, URL)
	c.setopt(pycurl.FOLLOWLOCATION, 1)
	c.setopt(pycurl.MAXREDIRS, 5)
	c.setopt(pycurl.CONNECTTIMEOUT, 30)
	c.setopt(pycurl.TIMEOUT, 300)
	c.setopt(pycurl.NOSIGNAL, 1)
	c.setopt(pycurl.WRITEDATA, f)
	c.perform()	
	c.close()
	f.close()
	
def allocMulti(maxConn):
	m = pycurl.CurlMulti()
	m.handles = []
	for i in range(maxConn):
		c = pycurl.Curl()
		c.fp = None
		c.setopt(pycurl.FOLLOWLOCATION, 1)
		c.setopt(pycurl.MAXREDIRS, 5)
		c.setopt(pycurl.CONNECTTIMEOUT, 30)
		c.setopt(pycurl.TIMEOUT, 300)
		c.setopt(pycurl.NOSIGNAL, 1)
		m.handles.append(c)
	
	return m
	
def getMulti(maxConn, queue):
	numRemote = len(queue)
	maxConn = min(maxConn, numRemote)
	m = allocMulti(maxConn)
	
	freelist = m.handles[:]
	processed = 0
	while processed < numRemote:
		while queue and freelist:
			url, filename = queue.pop(0)
			c = freelist.pop()
			c.fp = open(filename, "wb")
			c.setopt(pycurl.URL, url)
			c.setopt(pycurl.WRITEDATA, c.fp)
			m.add_handle(c)
			c.filename = filename
			c.url = url
		
		while 1:
			ret, num_handles = m.perform()
			if ret != pycurl.E_CALL_MULTI_PERFORM:
				break
		
		while 1:
			num_q, ok_list, err_list = m.info_read()
			for c in ok_list:
				c.fp.close()
				c.fp = None
				m.remove_handle(c)
				#sys.stdout.write('Received: ' + c.url + '\n')
				#sys.stdout.flush()
				freelist.append(c)
			for c, errno, errmsg in err_list:
				c.fp.close()
				c.fp = None
				m.remove_handle(c)
				freelist.append(c)
				queue.append((c.url, c.filename))
				sys.stderr.write('Failed: ' + c.url + ' ***Retrying in one min***\n')
				sys.stderr.flush()
			processed = processed + len(ok_list)
			if num_q == 0:
				break
	
	m.select(1.0)
