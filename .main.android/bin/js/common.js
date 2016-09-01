function AntHelper()
{
	this.echoTask = null;
	
	this.echo = function(message, level)
	{
		if (this.echoTask === null)
		{
			this.echoTask = self.project.createTask("echo");
		}
        if (level !== undefined && level !== null)
        {
            this.echoTask.setLevel(level);
        }
        else
        {
            var level = createLevel("warning");
            this.echoTask.setLevel(level);
        }
        this.echoTask.setMessage(message);
        this.echoTask.perform();
    };

    this.info = function(message)
    {
        var level = createLevel("info");
        this.echo(message, level);
    };
    
    this.debug = function(message)
    {
        var level = createLevel("debug");
        this.echo(message, level);
    };
    
    function createLevel(level)
    {
        var echoLevel = new org.apache.tools.ant.taskdefs.Echo.EchoLevel();
        echoLevel.setValue(level);
        return echoLevel;
    }
}


antHelper = new AntHelper();


XMLDocument = function(inputStream)
{
	this.inputStream = inputStream;
	this.document = null;
	
	this.load = function()
	{
        if (this.inputStream == null)
        {
            throw "InputStream must not be null";
        }
	
		if (this.document === null)
		{
		    var dbFactory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
		    var builder = dbFactory.newDocumentBuilder();
			var entityResolver = new org.xml.sax.EntityResolver(
			{
				resolveEntity : function(publicId, systemId)
				{
                    return new org.xml.sax.InputSource(new java.io.StringReader(""));
				}
			});
			builder.setEntityResolver(entityResolver);
		    this.document = builder.parse(this.inputStream);
		}
		return this.document;
	};

    this.save = function(outStream)
    {
        if (this.document != null)
        {
          var tFactory =
            javax.xml.transform.TransformerFactory.newInstance();
          var transformer = tFactory.newTransformer();
          transformer.setOutputProperty(javax.xml.transform.OutputKeys.INDENT, "yes");
          transformer.setOutputProperty(javax.xml.transform.OutputKeys.OMIT_XML_DECLARATION,"no");
          transformer.setOutputProperty(javax.xml.transform.OutputKeys.METHOD,"xml");
          transformer.setOutputProperty(javax.xml.transform.OutputKeys.STANDALONE,"no");
          transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");
          
          var source = new javax.xml.transform.dom.DOMSource(this.document);
          var result = new javax.xml.transform.stream.StreamResult(outStream);
          transformer.transform(source, result); 
        }
    };
};

XMLUpdater = function()
{
    this.findElement = function(xmlDoc, elementName, idAttrName, idAttrValue)
    {
        for (var i = 0; i < xmlDoc.getChildNodes().getLength(); i++)
        {
            var child = xmlDoc.getChildNodes().item(i);
            if (child instanceof org.w3c.dom.Element && elementName.equals(child.getTagName()))
            {
                if (idAttrName !== null && idAttrName !== undefined)
                {
                    var idAttr = child.getAttribute(idAttrName);
                    if (idAttr != null && idAttrValue.equals(idAttr))
                    {
                        return child;
                    }
                }
                else
                {
                    return child;
                }
            }   
        }
        return null;
    };

    this.appendBufferAsNode = function(element, pushReceiverBuffer)
    {
         var bufferIs = new java.io.ByteArrayInputStream(pushReceiverBuffer.getBytes());
         var xmlFromBuffer = new XMLDocument(bufferIs);
         antHelper.echo(xmlFromBuffer);
         var xmlDoc = xmlFromBuffer.load();
         var newElement = element.getOwnerDocument().importNode(xmlDoc.getDocumentElement(), true);
         element.appendChild(newElement);
    };

    this.addElementsIfMissing = function(toXmlDoc, elementName, idAttrName, idAttrValue, unparsedBuffer)
    {
        var element = this.findElement(toXmlDoc, elementName, idAttrName, idAttrValue);
        if (element == null)
        {
            this.appendBufferAsNode(toXmlDoc, unparsedBuffer);
        }
    };

    this.removeElementIfPresent = function(toXmlDoc, elementName, idAttrName, idAttrValue)
    {
        var element = this.findElement(toXmlDoc, elementName, idAttrName, idAttrValue);
        if (element != null)
        {
            if (element.getParentNode() != null)
            {
                element.getParentNode().removeChild(element);
            }
        }
    };
};

xmlUpdater = new XMLUpdater();
