// import statements
/*
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
  importClass(java.lang.RuntimeException);
*/

  var stagingPath = self.project.getProperty('adf.build.root.dir');
  if (stagingPath === null)
  {
	  throw new java.lang.RuntimeException("Staging path not found ${adf.build.root.dir}");
  }
  var applicationXml = new java.io.File(stagingPath+'/.adf/META-INF/maf-application.xml');
  if (!applicationXml.isFile())
  {
	  throw new java.lang.RuntimeException("Could not find staged copy of maf-application.xml at "+applicationXml.getAbsolutePath());
  }
  
  echo = self.project.createTask("echo");
  
  echo.setMessage("Processing maf-application.xml in staging directory"); echo.perform();
  
  var appXmlFS = new java.io.FileInputStream(applicationXml);
  var appXmlIS = new org.xml.sax.InputSource(appXmlFS);
  var whitelist = new java.util.Properties();
  var counter = 0;
  try
  {
	var namespaces = new javax.xml.namespace.NamespaceContext({
		   getNamespaceURI: function(prefix) {return "http://xmlns.oracle.com/adf/mf"; },
		   getPrefix: function(uri){return "adfmf";},
		   getPrefixes: function(uri){return null;}});
	var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
	xpath.setNamespaceContext(namespaces);
	
	var appXmlUrls = xpath.evaluate("/adfmf:application/adfmf:remoteURLWhiteList/adfmf:domain/text()", appXmlIS, javax.xml.xpath.XPathConstants.NODESET);
	
	for (var i = 0; i < appXmlUrls.getLength(); i++)
	{
		var url = appXmlUrls.item(i);
		if (url instanceof org.w3c.dom.Text)
		{
            whitelist.put(("oepe.adfmf.whitelist.url.application."+counter++), url.getTextContent());
			echo.setMessage("Found whitelist url in maf-application.xml: "+url.getTextContent()); echo.perform();
		}
	}
	
  }
  finally
  {
	if (appXmlFS !== null)
	{
		appXmlFS.close();
	}
  }

  var connectionXml = new java.io.File(stagingPath+'/.adf/META-INF/connections.xml');
  if (connectionXml.isFile())
  {
	  var connectionXmlFS = new java.io.FileInputStream(connectionXml);
	  var connectionXmlIS = new org.xml.sax.InputSource(connectionXmlFS);
	  counter = 0;

	  try
	  {
		  var connectionXmlUrls = xpath.evaluate("//urlconnection", connectionXmlIS, javax.xml.xpath.XPathConstants.NODESET);
			for (var i = 0; i < connectionXmlUrls.getLength(); i++)
			{
				var url = connectionXmlUrls.item(i);
				if (url instanceof org.w3c.dom.Element)
				{
					var attributeValue = url.getAttribute("url");
					if (attributeValue instanceof java.lang.String && !attributeValue.trim().isEmpty())
					{
			            whitelist.put(("oepe.adfmf.whitelist.url.connections."+counter++), attributeValue);
						echo.setMessage("Found whitelist url in connections.xml: "+attributeValue); echo.perform();
					}
				}
			}
	  }
	  finally
	  {
		  if (connectionXmlFS !== null)
		  {
			  connectionXmlFS.close();
		  }
	  }
  }
  
  var file = new java.io.File(stagingPath+"/whitelist.properties");
  
  var os = new java.io.FileOutputStream(file);
  
  try
  {
      whitelist.store(os, "Whitelist created by OEPE mobile builder.  Do not modify");
  }
  finally
  {
      if (os !== null)
      {
          os.close();
      }
  }
