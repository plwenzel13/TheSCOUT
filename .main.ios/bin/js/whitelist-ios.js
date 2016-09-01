/*
importClass(java.io.ByteArrayInputStream);
importClass(java.io.File);
importClass(org.xml.sax.InputSource);
importClass(java.io.FileInputStream);
importClass(java.io.FileOutputStream);
importClass(javax.xml.xpath.XPathFactory);
importClass(javax.xml.xpath.XPathConstants);
importClass(java.util.HashMap);
importClass(javax.xml.namespace.NamespaceContext);
importClass(org.apache.tools.ant.BuildException);
importClass(org.apache.tools.ant.Target);
importClass(org.apache.tools.ant.Location);
importClass(org.apache.tools.ant.types.FileSet);
importClass(org.apache.tools.ant.types.DirSet);
importClass(java.beans.Introspector);
importClass(org.apache.tools.ant.types.Mapper);
importClass(org.apache.tools.ant.types.resources.PropertyResource);
importClass(org.apache.tools.ant.types.resources.FileResource);
importClass(org.w3c.dom.Text);
importClass(org.w3c.dom.Element);
importClass(java.util.Properties);
importClass(java.util.HashSet);
importClass(java.lang.System);
importClass(javax.xml.parsers.DocumentBuilderFactory);
importClass(javax.xml.transform.TransformerFactory);
importClass(javax.xml.transform.dom.DOMSource);
importClass(javax.xml.transform.stream.StreamResult);
importClass(java.io.StringReader);
*/

// first parse the urls currently in Cordova.plist

eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(self.project.getProperty("oepe.bin.js.dir")+"/loader.js"))));
load("common.js");


var curWhiteListXml = self.project.getProperty("oepe.adfmf.curWhiteList");
var curWhiteListStream = new java.io.ByteArrayInputStream(curWhiteListXml.getBytes());
var curWhiteListIS = new org.xml.sax.InputSource(curWhiteListStream);

var alreadyConfigured = new java.util.HashSet();
try
{
    var xmlDoc = new XMLDocument(curWhiteListStream);
    var document = xmlDoc.load();
    var factory = javax.xml.xpath.XPathFactory.newInstance();
    var xpath = factory.newXPath(); 
    var strings = xpath.evaluate("/plist/array/string/text()", document, javax.xml.xpath.XPathConstants.NODESET);

	for (i = 0; i < strings.getLength(); i++)
	{
		var text = strings.item(i);
		alreadyConfigured.add(text);
	}
}
catch (e)
{
    antHelper.echo(e.toString());
}
finally
{
	if (curWhiteListStream != null)
	{
		curWhiteListStream.close();
	}
}

var appConfiguredUrlsIt = self.project.getReference("oepe.adfmf.whitelist.urls").iterator();
var urlsToAdd = new java.util.HashSet();
while (appConfiguredUrlsIt.hasNext())
{
	 var urlRes = appConfiguredUrlsIt.next();
	 var url = null;
	 if (urlRes instanceof org.apache.tools.ant.types.resources.PropertyResource)
	 {
		 url = urlRes.getValue();
	 }
	 else if (urlRes instanceof org.apache.tools.ant.types.resources.FileResource)
	 {
		 url = urlRes.getFile().getAbsolutePath();
	 }
	 
	 if (url !== null && !alreadyConfigured.contains(url))
	 {
		 urlsToAdd.add(url);
	 }
}

var urlIt = urlsToAdd.iterator();

var PlistBuddy = self.project.createTask("PlistBuddy");
while (urlIt.hasNext())
{
	PlistBuddy.setDynamicAttribute("command", "Add :ExternalHosts:array string "+urlIt.next());
	PlistBuddy.setDynamicAttribute("filename", "${adf.build.root.dir}/Cordova.plist");
	PlistBuddy.perform();
}