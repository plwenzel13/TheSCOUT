
/**
 * 
 * @param srcCpEntry -- source classpath entry of type SrcClasspathEntry
 * @param projectClassPath -- JDTProjectClasspath for a MAF application
 */
AdfmSupport = function(srcCpEntry, projectClassPath, projectPath)
{
    this.srcCpEntry = srcCpEntry;
    this.projectClassPath = projectClassPath;

	this.findWsDCWsdlFiles = function()
	{
		var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
		var pathToDCRegistry = this.getDataControlRegistryPath(xpath);
		if (pathToDCRegistry != null)
		{
            return this.getListOfWsdls(pathToDCRegistry, xpath, projectPath);
		}
		return null;
	};

    this.getListOfWsdls = function(pathToDCRegistry, xpath, projectPath)
	{
        var wsdls = new Array();
		var dcRegistryFile = this.findDCRegistryFile(pathToDCRegistry);
		if (dcRegistryFile != null)
		{
			var is = null;
			try
			{
				is = new java.io.FileInputStream(dcRegistryFile);
				var dcDoc = new XMLDocument(is);
				var xmlDoc = dcDoc.load();
				var wsDataControls = xpath.evaluate("/DataControlConfigs/AdapterDataControl[@ImplDef='oracle.adfinternal.model.adapter.webservice.WSDefinition']/Source/definition", xmlDoc, javax.xml.xpath.XPathConstants.NODESET);
				for (var i = 0; i < wsDataControls.getLength(); i++)
				{
					var definitionElem = wsDataControls.item(i);
					if (definitionElem instanceof org.w3c.dom.Element)
					{
						var wsdlAttrValue = definitionElem.getAttribute("wsdl");
                        if (wsdlAttrValue != null)
                        {
                            var wsdlFile = new java.io.File(new java.io.File(projectPath), wsdlAttrValue);
                            if (!wsdlFile.isFile())
                            {
                                antHelper.echo("Missing wsdl file: "+wsdlFile.getAbsolutePath());
                                continue;
                            }
                            var wsdlInfo = { src: wsdlFile, dest: wsdlAttrValue};
                            wsdls.push(wsdlInfo);
                            antHelper.echo(wsdlInfo.src);
                        }
                    }
                }
			}
			catch (e)
			{
				antHelper.echo(e);
			}
			finally
			{
				if (is != null)
				{
					try{is.close();} catch(e) {}
				}
			}
			return wsdls;
		}
	};
	
	this.findDCRegistryFile = function(pathToDCRegistry)
	{
		for (var i = 0; i < this.projectClassPath.srcCpEntries.length; i++)
		{
			var entry = this.projectClassPath.srcCpEntries[i];
			antHelper.echo(entry);
			if (entry.hasFile(pathToDCRegistry))
			{
				return entry.getFile(pathToDCRegistry);
			}
		}
		return null;
	};
	
	this.getDataControlRegistryPath = function(xpath)
	{
		// first get the adfm.xml file in this srcCpEntry
		var adfmFile = srcCpEntry.getFile("META-INF/adfm.xml");
		if (adfmFile != null && adfmFile.isFile())
		{
			var is = null;
			try
			{
				is = new java.io.FileInputStream(adfmFile);
				// load and parse for the DataControl registry
				adfmXml = new XMLDocument(is);
				var xmlDoc = adfmXml.load();
				var dcPath = xpath.evaluate("/MetadataDirectory/DataControlRegistry/@path", xmlDoc, javax.xml.xpath.XPathConstants.STRING);
				return dcPath;
			}
			catch (e)
			{
				antHelper.echo(e);
				return null;
			}
			finally
			{
				if (is != null)
				{
					try {is.close();}catch (e) {}
				}
			}
		}
	};
};
