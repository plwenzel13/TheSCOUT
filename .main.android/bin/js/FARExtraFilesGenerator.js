/*
importClass(java.io.File);
importClass(java.io.FileInputStream);
importClass(java.lang.StringBuffer);
importClass(java.util.ArrayList);
importClass(java.util.HashMap);

importClass(javax.xml.namespace.NamespaceContext);
importClass(javax.xml.xpath.XPathFactory);
importClass(javax.xml.xpath.XPathConstants);

importClass(org.apache.tools.ant.types.resources.PropertyResource);
importClass(org.w3c.dom.Node);
importClass(org.xml.sax.InputSource);
*/

/* --------------------------------------------------------------------------
 * FARExtraFilesGenerator
 */
FARExtraFilesGenerator = function(projectDir) {
	this.projectDir = projectDir;
	this.dotOepeFilePath = ".oepe";
	this.namespaces = getJarConnectionsNamespaces.call(this);

	this.generate = function() {
		var assemblyProjectDir = getAssemblyProjectDir.call(this);

		var jarConnections = new JarConnections(assemblyProjectDir, this.projectDir);
		if (jarConnections.getSourceFile() != null) {
			jarConnections.write();

			var jarAdfConfig = new JarAdfConfig(this.projectDir);
			jarAdfConfig.write();
		}

		var jarSyncConfig = new JarSyncConfig(assemblyProjectDir, this.projectDir);
		jarSyncConfig.write();

		var resourceService = new ResourceService(assemblyProjectDir, this.projectDir);
		resourceService.write();

		var taskFlowRegistry = new TaskFlowRegistry(this.projectDir);
		taskFlowRegistry.write();

		var manifest = new Manifest(this.projectDir);
		manifest.write();

		var jarMafPlugins = new JarMafPlugins(assemblyProjectDir, this.projectDir);
		jarMafPlugins.write();

		var jarOepeMafApplication = new JarOepeMafApplication(assemblyProjectDir, this.projectDir);
		jarOepeMafApplication.write();
	};
};

function getJarConnectionsNamespaces() {
	return new javax.xml.namespace.NamespaceContext({
		getNamespaceURI: function(prefix) {
			var uri = null;
			if (prefix.equals("adfjndi")) {
				uri = "http://xmlns.oracle.com/adf/jndi";
			} else if (prefix.equals("oepe")) {
				uri = "http://xmlns.oracle.com/oepe/metadata/1.0";
			}
			return uri;
		},
		getPrefix: function(uri) {
			var prefix = null;
			if (uri.equals("http://xmlns.oracle.com/adf/jndi")) {
				prefix = "adfjndi";
			} else if (uri.equals("http://xmlns.oracle.com/oepe/metadata/1.0")) {
				prefix = "oepe";
			}
			return prefix;
		},
		getPrefixes: function(uri) {
			return null;
		}
	});
};

/* --------------------------------------------------------------------------
 * JarConnections
 */
function JarConnections(assemblyProjectDir, projectDir) {
	this.assemblyProjectDir = assemblyProjectDir;
	this.projectDir = projectDir;
	this.srcFilePath = "adf/META-INF/connections.xml";
	this.targetFilePath = "META-INF/jar-connections.xml";
	this.namespaces = getJarConnectionsNamespaces.call(this);
}

function getAssemblyProjectDir() {
	var dir = null;
	var dotOepeFile = new java.io.File(this.projectDir, this.dotOepeFilePath);
	if (dotOepeFile.canRead()) {
		var fis = null;
		try {
			fis = new java.io.FileInputStream(dotOepeFile);
			var is = new org.xml.sax.InputSource(fis);
			var xPath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
			xPath.setNamespaceContext(this.namespaces);
			var assemblyProjectName = xPath.evaluate("/oepe:metadata/oepe:mobileProject/@assemblyProject", is, javax.xml.xpath.XPathConstants.STRING);
			if (assemblyProjectName != null && assemblyProjectName.length() > 0) {
				dir = new java.io.File(this.projectDir, "../" + assemblyProjectName);
			}
		} finally {
			if (fis != null) {
				fis.close();
				fis = null;
			}
		}
	}
	return dir;
}

function JarConnections_getSourceFile() {
	var srcFile = null;
	
	if (this.assemblyProjectDir != null) {
		var tmpSrcFile = new java.io.File(this.assemblyProjectDir, this.srcFilePath);
		if (tmpSrcFile != null && tmpSrcFile.canRead()) {
			var fis = null;
			try {
				fis = new java.io.FileInputStream(tmpSrcFile);
				var is = new org.xml.sax.InputSource(fis);
				var xPath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
				xPath.setNamespaceContext(this.namespaces);
				var refsElement = xPath.evaluate("/adfjndi:References", is, javax.xml.xpath.XPathConstants.NODE);
				if (refsElement != null) {
					var refElements = refsElement.getElementsByTagName("Reference");
					if (refElements != null && refElements.getLength() > 0) {
						srcFile = tmpSrcFile;
					}
				}
			} finally {
				if (fis != null) {
					fis.close();
					fis = null;
				}
			}
		}
	}
	return srcFile;
}

function JarConnections_write() {
	var includeConnectionDetails = FARUtils.getIncludeConnectionDetails();
	var srcFile = this.getSourceFile();
	if (srcFile != null && srcFile.canRead()) {
		var fis = null;
		try {
			fis = new java.io.FileInputStream(srcFile);
			var is = new org.xml.sax.InputSource(fis);
			var xPath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
			xPath.setNamespaceContext(this.namespaces);
			var refsElement = xPath.evaluate("/adfjndi:References", is, javax.xml.xpath.XPathConstants.NODE);
			if (refsElement != null && refsElement.getNodeType() == org.w3c.dom.Node.ELEMENT_NODE) {
				var buffer = new java.lang.StringBuffer();
				buffer.append("<?xml version = '1.0' encoding = 'UTF-8'?>\n");
				var attributes = new java.util.HashMap();
				attributes.put("xmlns", refsElement.getAttribute("xmlns"));
				this.writeStartElement(buffer, "", "References", attributes);
				buffer.append("\n");
				var refElements = refsElement.getElementsByTagName("Reference");
				if (refElements != null) {
					for (var i = 0; i < refElements.getLength(); i++) {
						var refElement = refElements.item(i);
						attributes.clear();
						var handledPartialAttribute = false;
						var srcAttributes = refElement.getAttributes();
						if (srcAttributes != null) {
							for (var j = 0; j < srcAttributes.getLength(); j++) {
								var srcAttribute = srcAttributes.item(j);
								var srcAttributeName = srcAttribute.getNodeName();
								var srcAttributeValue = srcAttribute.getNodeValue();
								if (srcAttributeName.equals("partial")) {
									srcAttributeValue = java.lang.String.valueOf(!includeConnectionDetails);
									handledPartialAttribute = true;
								}
								if (srcAttributeName.equals("credentialStoreKey")) {
									if (!handledPartialAttribute) {
										srcAttributeName = "partial";
										srcAttributeValue = "true";
										handledPartialAttribute = true;
									} else {
										srcAttributeName = null;
									}
								}
								if (srcAttributeName != null) {
									attributes.put(srcAttributeName, srcAttributeValue);
								}
							}
						}
						if (!handledPartialAttribute) {
							if (!includeConnectionDetails) {
								attributes.put("partial", "true");
							}
						}
						this.writeStartElement(buffer, "   ", "Reference", attributes);
						buffer.append("\n");
						var factoryElements = refElement.getElementsByTagName("Factory");
						if (factoryElements != null && factoryElements.getLength() > 0) {
							var factoryElement = factoryElements.item(0);
							attributes.clear();
							attributes.put("className", factoryElement.getAttribute("className"));
							this.writeEmptyElement(buffer, "      ", "Factory", attributes);
							buffer.append("\n");
						}
						if (includeConnectionDetails) {
							var refAddressesElements = refElement.getElementsByTagName("RefAddresses");
							if (refAddressesElements != null && refAddressesElements.getLength() > 0) {
								for (var index = 0; index < refAddressesElements.getLength(); index++) {
									var refAddressesElement = refAddressesElements.item(index);
									buffer.append("      ");
									this.writeNodeRecursive(buffer, refAddressesElement);
									buffer.append("\n");
								}
							}
						} else {
							this.writeEmptyElement(buffer, "      ", "RefAddresses", null);
							buffer.append("\n");
						}
						this.writeEndElement(buffer, "   ", "Reference");
						buffer.append("\n");
					}
				}
				this.writeEndElement(buffer, "", "References");
				var targetFile = new java.io.File(FARUtils.getTargetDir(this.projectDir), this.targetFilePath);
				var echoConsole = self.project.createTask("echo");
				echoConsole.setMessage("Writing " + targetFile);
				echoConsole.perform();
				var echoFile = self.project.createTask("echo");
				echoFile.setMessage(buffer);
				echoFile.setFile(targetFile);
				echoFile.perform();
			}
		} finally {
			if (fis != null) {
				fis.close();
				fis = null;
			}
		}
	}
}

function JarConnections_writeStartElement(buffer, indent, name, attributes) {
	buffer.append(indent);
	buffer.append("<");
	buffer.append(name);
	if (attributes != null) {
		var itKeySet = attributes.keySet().iterator();
		while (itKeySet.hasNext()) {
			var key = itKeySet.next();
			buffer.append(" ");
			buffer.append(key);
			buffer.append("=\"");
			buffer.append(attributes.get(key));
			buffer.append("\"");
		}
	}
	buffer.append(">");
}

function JarConnections_writeEndElement(buffer, indent, name) {
	buffer.append(indent);
	buffer.append("</");
	buffer.append(name);
	buffer.append(">");
}

function JarConnections_writeEmptyElement(buffer, indent, name, attributes) {
	buffer.append(indent);
	buffer.append("<");
	buffer.append(name);
	if (attributes != null) {
		var itKeySet = attributes.keySet().iterator();
		while (itKeySet.hasNext()) {
			var key = itKeySet.next();
			buffer.append(" ");
			buffer.append(key);
			buffer.append("=\"");
			buffer.append(attributes.get(key));
			buffer.append("\"");
		}
	}
	buffer.append("/>");
}

function JarConnections_writeNodeRecursive(buffer, node) {
	if (node.getNodeType() == org.w3c.dom.Node.TEXT_NODE) {
		buffer.append(node.getNodeValue());
	} else if (node.getNodeType() == org.w3c.dom.Node.ELEMENT_NODE) {
		var elementName = node.getNodeName();
		if (!elementName.equals("SecureRefAddr")) {
			buffer.append("<");
			buffer.append(elementName);
			var attributes = node.getAttributes();
			if (attributes != null) {
				for (var i = 0; i < attributes.getLength(); i++) {
					var attribute = attributes.item(i);
					buffer.append(" ");
					buffer.append(attribute.getNodeName());
					var attrValue = attribute.getNodeValue();
					if (attrValue != null) {
						buffer.append("=\"");
						buffer.append(attrValue);
						buffer.append("\"");
					}
				}
			}
			var childNodes = node.getChildNodes();
			if (childNodes != null && childNodes.getLength() > 0) {
				buffer.append(">");
				for (var i = 0; i < childNodes.getLength(); i++) {
					this.writeNodeRecursive(buffer, childNodes.item(i));
				}
				buffer.append("</");
				buffer.append(node.getNodeName());
				buffer.append(">");
			} else {
				buffer.append("/>");
			}
		}
	}
}

new JarConnections(null, null);
JarConnections.prototype.write = JarConnections_write;
JarConnections.prototype.getSourceFile = JarConnections_getSourceFile;
JarConnections.prototype.writeStartElement = JarConnections_writeStartElement;
JarConnections.prototype.writeEndElement = JarConnections_writeEndElement;
JarConnections.prototype.writeEmptyElement = JarConnections_writeEmptyElement;
JarConnections.prototype.writeNodeRecursive = JarConnections_writeNodeRecursive;


/* --------------------------------------------------------------------------
 * JarSyncConfig
 */
function JarSyncConfig(assemblyProjectDir, projectDir) {
	this.assemblyProjectDir = assemblyProjectDir;
	this.projectDir = projectDir;
	this.srcFilePath = "adf/META-INF/sync-config.xml";
	this.targetFilePath = "META-INF/jar-sync-config.xml";
}

function JarSyncConfig_write(projectDir) {
	var targetFile = new java.io.File(FARUtils.getTargetDir(this.projectDir), this.targetFilePath);
	var echoConsole = self.project.createTask("echo");
	var srcFile = new java.io.File(this.assemblyProjectDir, this.srcFilePath);
	
	echoConsole.setMessage("Writing " + targetFile);
	echoConsole.perform();
	
	if (srcFile.exists()) {
        var copyTask = self.project.createTask("copy");
        copyTask.setOwningTarget(self.getOwningTarget());
        copyTask.setTofile(targetFile);
        copyTask.setFile(srcFile);
        copyTask.perform();
        
	} else {
		/* default sync-config in case of missing*/
		var fileContent = 
			"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
			"<Settings xmlns=\"http://xmlns.oracle.com/sync/config\">\n" +
			"\t<BaseUri>http://127.0.0.1</BaseUri>\n" +
			"\t<AppId />\n" +
			"\t<LazyPersistence />\n" +
			"\t<RefreshPolicy />\n" +
			"\t<DbStorageFolderPath />\n" +
			"\t<FileStorageFolderPath />\n" +
			"\t<Policies>\n" +
			"\t\t<DefaultPolicy>\n" +
			"\t\t\t<FetchPolicy>FETCH_FROM_SERVICE</FetchPolicy>\n" +
			"\t\t\t<UpdatePolicy>UPDATE_IF_ONLINE</UpdatePolicy>\n" +
			"\t\t\t<ExpirationPolicy>NEVER_EXPIRE</ExpirationPolicy>\n" +
			"\t\t\t<EvictionPolicy>MANUAL_EVICTION</EvictionPolicy>\n" +
			"\t\t</DefaultPolicy>\n" +
			"\t</Policies>\n" +
			"</Settings>\n";
		
			var echoFile = self.project.createTask("echo");
			echoFile.setMessage(fileContent);
			echoFile.setFile(targetFile);
			echoFile.perform();
	}
}

new JarSyncConfig(null, null);
JarSyncConfig.prototype.write = JarSyncConfig_write;

/* --------------------------------------------------------------------------
 * JarAdfConfig
 */
function JarAdfConfig(projectDir) {
	this.projectDir = projectDir;
	this.filePath = "META-INF/jar-adf-config.xml";
	this.fileContent =
		"<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n" +
		"<adf-config\n" +
		"  xmlns=\"http://xmlns.oracle.com/adf/config\"\n" +
		"  xmlns:jndi=\"http://xmlns.oracle.com/adf/jndi/config\"\n" +
		"  xmlns:sec=\"http://xmlns.oracle.com/adf/security/config\"\n" +
		">\n" +
		"  <!-- configure the credential store -->\n" +
		"  <sec:adf-config-child xmlns=\"http://xmlns.oracle.com/adf/security/config\">\n" +
		"  </sec:adf-config-child>\n" +
		"  <!-- configure the Connection Architecture -->\n" +
		"  <jndi:adf-jndi-config\n" +
		"      xmlns=\"http://xmlns.oracle.com/adf/jndi/config\">\n" +
		"    <jndi:ConnectionsJndiContext\n" +
		"      initialContextFactoryClass=\"oracle.adf.share.jndi.InitialContextFactoryImpl\"\n" +
		"      backingStoreURL=\"./jar-connections.xml\"\n" +
		"      backingStoreClass=\"oracle.adf.share.jndi.JarFileBackingStore\">\n" +
		"    </jndi:ConnectionsJndiContext>\n" +
		"  </jndi:adf-jndi-config>\n" +
		"</adf-config>\n";
}

function JarAdfConfig_write() {
	var file = new java.io.File(FARUtils.getTargetDir(this.projectDir), this.filePath);
	var echoConsole = self.project.createTask("echo");
	echoConsole.setMessage("Writing " + file);
	echoConsole.perform();
	var echoFile = self.project.createTask("echo");
	echoFile.setMessage(this.fileContent);
	echoFile.setFile(file);
	echoFile.perform();
}

new JarAdfConfig(null);
JarAdfConfig.prototype.write = JarAdfConfig_write;


/* --------------------------------------------------------------------------
 * ResourceService
 */
function ResourceService(assemblyProjectDir, projectDir) {
	this.assemblyProjectDir = assemblyProjectDir;
	this.projectDir = projectDir;
	this.filePath = "META-INF/oracle.adf.common.services.ResourceService.sva";

	this.EMPTY = "# No Resource Catalog enabled ADF components found to package";
	this.PROLOG = "#:__PROLOG__";
	this.EPILOG = "#:__EPILOG__:";

	this.ID_CONNECTIONS = "ADF_Connections";
	this.ID_LIBRARYDEPENDENCIES = "ADF_LibraryDependencies";
	this.ID_DATACONTROLS = "ADF_DataControl";
	this.ID_DATABINDINGS = "ADF_BindingApp";
	this.ID_SYNCCONFIG = "ADFMF_SyncConfig";

	this.PROLOG_CONNECTIONS = ":" + this.ID_CONNECTIONS;
	this.PROLOG_LIBRARYDEPENDENCIES = ":" + this.ID_LIBRARYDEPENDENCIES;
	this.PROLOG_DATACONTROLS = ":!;" + this.ID_DATACONTROLS;
	this.PROLOG_DATABINDINGS = ":!-;" + this.ID_DATABINDINGS;
	this.PROLOG_SYNCCONFIG = ":" + this.ID_SYNCCONFIG;

	this.URLDESCRIPTOR_DATACONTROLS = "#:" + this.ID_DATACONTROLS + ":oracle.adf.library.rc.dcxdatacontrols.DataControlURLDescriptor:";
	this.URLDESCRIPTOR_DATABINDINGS = "#:" + this.ID_DATABINDINGS + ":oracle.adf.library.rc.bindingapp.BindingAppURLDescriptor:";

	this.STRATEGY_CONNECTIONS = "oracle.adf.library.rc.connections.CAServiceStrategy " + this.ID_CONNECTIONS;
	this.STRATEGY_LIBRARYDEPENDENCIES = "oracle.adf.library.rc.dependencies.LibDepsServiceStrategy " + this.ID_LIBRARYDEPENDENCIES;
	this.STRATEGY_DATACONTROLS = "oracle.adf.library.rc.dcxdatacontrols.DataControlServiceStrategy " + this.ID_DATACONTROLS;
	this.STRATEGY_DATABINDINGS = "oracle.adf.library.rc.bindingapp.BindingAppServiceStrategy " + this.ID_DATABINDINGS;
	this.STRATEGY_SYNCCONFIG = "oracle.adfmf.framework.dt.deploy.features.deployers.FarResourceServiceStrategy " + this.ID_SYNCCONFIG;
}

function ResourceService_write() {
	var file = new java.io.File(FARUtils.getTargetDir(this.projectDir), this.filePath);
	var connections = this.getConnections();
	var libraryDependencies = this.getLibraryDependencies();
	var dataControls = this.getDataControls();
	var dataBindings = this.getDataBindings();
	var buffer = new java.lang.StringBuffer();

//THE BELOW CAN BE REMOVED AT SOME POINT - LEFT HERE AS REMINDER OF THE WAY THINGS WERE... ;-)
//	if (connections == null && !libraryDependencies &&
//			(dataControls == null || dataControls.size() < 1) &&
//			(dataBindings == null || dataBindings.length() < 1)) {
//		//EMPTY
//		buffer.append(this.EMPTY).append("\n");
//	} else {
	
		//PROLOG
		buffer.append(this.PROLOG);
		
		//always write syncConfig since a default gets created by deployer even when not present in source
		buffer.append(this.PROLOG_SYNCCONFIG);
		
		if (connections != null) {
			buffer.append(this.PROLOG_CONNECTIONS);
		}
		if (libraryDependencies) {
			buffer.append(this.PROLOG_LIBRARYDEPENDENCIES);
		}
		if (dataControls != null && dataControls.size() > 0) {
			buffer.append(this.PROLOG_DATACONTROLS);
		}
		if (dataBindings != null && dataBindings.length() > 0) {
			buffer.append(this.PROLOG_DATABINDINGS);
		}
		buffer.append("\n");

		//CONTENT
		if (dataControls != null && dataControls.size() > 0) {
			var itDataControls = dataControls.iterator();
			while (itDataControls.hasNext()) {
				var dataControl = itDataControls.next();
				buffer.append(this.URLDESCRIPTOR_DATACONTROLS);
				buffer.append("0,");
				buffer.append(dataControl.getId());
				buffer.append(",");
				buffer.append(dataControl.getBeanClass());
				buffer.append(",");
				buffer.append(dataControl.getDefinitionLocation());
				var implDef = dataControl.getImplDef();
				if (implDef.equals("oracle.adf.model.adapter.bean.BeanDCDefinition")) {
					buffer.append(",.class");
				} else if (implDef.equals("oracle.adfinternal.model.adapter.webservice.WSDefinition")) {
					buffer.append(",.xml");
				}
				buffer.append("\n");
			}
		}
		if (dataBindings != null && dataBindings.length() > 0) {
			buffer.append(this.URLDESCRIPTOR_DATABINDINGS).append("0,").append(dataBindings).append("\n");
		}

		//EPILOG
		buffer.append(this.EPILOG);
		
		//STRATEGIES
		
		//always write syncConfig
		buffer.append("\n").append(this.STRATEGY_SYNCCONFIG);
		
		if (connections != null) {
			buffer.append("\n").append(this.STRATEGY_CONNECTIONS);
		}
		if (libraryDependencies) {
			buffer.append("\n").append(this.STRATEGY_LIBRARYDEPENDENCIES);
		}
		if (dataControls != null && dataControls.size() > 0) {
			buffer.append("\n").append(this.STRATEGY_DATACONTROLS);
		}
		if (dataBindings != null && dataBindings.length() > 0) {
			buffer.append("\n").append(this.STRATEGY_DATABINDINGS);
		}
//	}
	var echoConsole = self.project.createTask("echo");
	echoConsole.setMessage("Writing " + file);
	echoConsole.perform();
	var echoFile = self.project.createTask("echo");
	echoFile.setMessage(buffer);
	echoFile.setFile(file);
	echoFile.perform();
}

function ResourceService_getConnections() {
	var jarConnections = new JarConnections(this.assemblyProjectDir, this.projectDir);
	return jarConnections.getSourceFile();
}

function ResourceService_getLibraryDependencies() {
	var libs = FARUtils.getLibrariesForProject(this.projectDir);
	return libs.size() > 0;
}

function ResourceService_getDataControls() {
	var dataControls = new DataControls(this.projectDir);
	return dataControls.getList();
}

function ResourceService_getDataBindings() {
	var dataBindings = new DataBindings(this.projectDir);
	return dataBindings.getDefinitionLocation();
}

new ResourceService(null);
ResourceService.prototype.write = ResourceService_write;
ResourceService.prototype.getConnections = ResourceService_getConnections;
ResourceService.prototype.getLibraryDependencies = ResourceService_getLibraryDependencies;
ResourceService.prototype.getDataControls = ResourceService_getDataControls;
ResourceService.prototype.getDataBindings = ResourceService_getDataBindings;



/* --------------------------------------------------------------------------
 * LibraryListener
 */
function LibraryListener() {
}

function LibraryListener_process(file, iterator) {
	var path = file.getPath().toLowerCase();
	if (path.endsWith(".jar") || path.endsWith(".zip")) {
		iterator.setProperty(PROP_LIBS_EXIST, true);
	}
}

new LibraryListener();
LibraryListener.prototype.process = LibraryListener_process;

var PROP_LIBS_EXIST = "PROP_LIBS_EXIST";



/* --------------------------------------------------------------------------
 * DataBindings
 */
function DataBindings(projectDir) {
	this.adfmPath = "adfmsrc/META-INF/adfm.xml";
	this.projectDir = projectDir;
	this.namespaces = new javax.xml.namespace.NamespaceContext({
		getNamespaceURI: function(prefix) {return "http://xmlns.oracle.com/adfm/metainf";},
		getPrefix: function(uri) {return "metainf";},
		getPrefixes: function(uri) {return null;}
	});
}

function DataBindings_getDefinitionLocation() {
	var location = null;
	var adfmFile = new java.io.File(this.projectDir, this.adfmPath);
	if (adfmFile != null && adfmFile.canRead()) {
		var fis = null;
		try {
			fis = new java.io.FileInputStream(adfmFile);
			var is = new org.xml.sax.InputSource(fis);
			var xPath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
			xPath.setNamespaceContext(this.namespaces);
			location = xPath.evaluate("/metainf:MetadataDirectory/metainf:DataBindingRegistry/@path", is, javax.xml.xpath.XPathConstants.STRING);
		} finally {
			if (fis != null) {
				fis.close();
				fis = null;
			}
		}
	}
	return location;
}

new DataBindings(null);
DataBindings.prototype.getDefinitionLocation = DataBindings_getDefinitionLocation;



/* --------------------------------------------------------------------------
 * DataControls
 */
function DataControls(projectDir) {
	this.adfmPath = "adfmsrc/META-INF/adfm.xml";
	this.projectDir = projectDir;
	this.namespaces = new javax.xml.namespace.NamespaceContext({
		getNamespaceURI: function(prefix) {
			var uri = null;
			if (prefix.equals("metainf")) {
				uri = "http://xmlns.oracle.com/adfm/metainf";
			} else if (prefix.equals("dcx")) {
				uri = "http://xmlns.oracle.com/adfm/configuration";
			} else if (prefix.equals("dc")) {
				uri = "http://xmlns.oracle.com/adfm/datacontrol";
			}
			return uri;
		},
		getPrefix: function(uri) {
			var prefix = null;
			if (uri.equals("http://xmlns.oracle.com/adfm/metainf")) {
				prefix = "metainf";
			} else if (uri.equals("http://xmlns.oracle.com/adfm/configuration")) {
				prefix = "dcx";
			} else if (uri.equals("http://xmlns.oracle.com/adfm/datacontrol")) {
				prefix = "dc";
			}
			return prefix;
		},
		getPrefixes: function(uri) {
			return null;
		}
	});
}

function DataControls_getDefinitionLocation() {
	var location = null;
	var adfmFile = new java.io.File(this.projectDir, this.adfmPath);
	if (adfmFile != null && adfmFile.canRead()) {
		var fis = null;
		try {
			fis = new java.io.FileInputStream(adfmFile);
			var is = new org.xml.sax.InputSource(fis);
			var xPath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
			xPath.setNamespaceContext(this.namespaces);
			location = xPath.evaluate("/metainf:MetadataDirectory/metainf:DataControlRegistry/@path", is, javax.xml.xpath.XPathConstants.STRING);
		} finally {
			if (fis != null) {
				fis.close();
				fis = null;
			}
		}
	}
	return location;
}

function DataControls_getList() {
	var list = new java.util.ArrayList();
	var definitionLocation = this.getDefinitionLocation();
	if (definitionLocation != null && definitionLocation.length() > 0) {
		var dcxFile = new java.io.File(this.projectDir, "adfmsrc/" + definitionLocation);
		if (dcxFile != null && dcxFile.canRead() && dcxFile.isFile()) {
			var fis = null;
			try {
				fis = new java.io.FileInputStream(dcxFile);
				var is = new org.xml.sax.InputSource(fis);
				var xPath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
				xPath.setNamespaceContext(this.namespaces);
				var nodeSet = xPath.evaluate("/dcx:DataControlConfigs//dc:AdapterDataControl", is, javax.xml.xpath.XPathConstants.NODESET);
				if (nodeSet != null) {
					for (var i = 0; i < nodeSet.getLength(); i++) {
						var node = nodeSet.item(i);
						if (node.getNodeType() == org.w3c.dom.Node.ELEMENT_NODE) {
							list.add(new DataControl(node, definitionLocation));
						}
					}
				}
			} finally {
				if (fis != null) {
					fis.close();
					fis = null;
				}
			}
		}
	}
	return list;
}

new DataControls(null);
DataControls.prototype.getDefinitionLocation = DataControls_getDefinitionLocation;
DataControls.prototype.getList = DataControls_getList;



/* --------------------------------------------------------------------------
 * DataControl
 */
function DataControl(element, definitionLocation) {
	this.id = null;
	this.beanClass = null;
	if (element != null) {
		this.id = element.getAttribute("id");
		this.implDef = element.getAttribute("ImplDef");
		this.beanClass = element.getAttribute("BeanClass");
	}
	this.definitionLocation = definitionLocation;
}

function DataControl_getId() {
	return this.id;
}

function DataControl_getImplDef() {
	return this.implDef;
}

function DataControl_getBeanClass() {
	return this.beanClass;
}

function DataControl_getDefinitionLocation() {
	return this.definitionLocation;
}

new DataControl(null, "");
DataControl.prototype.getId = DataControl_getId;
DataControl.prototype.getImplDef = DataControl_getImplDef;
DataControl.prototype.getBeanClass = DataControl_getBeanClass;
DataControl.prototype.getDefinitionLocation = DataControl_getDefinitionLocation;



/* --------------------------------------------------------------------------
 * FileSystemIterator
 */
function FileSystemIterator(file) {
	this.file = file;
	this.listeners = new java.util.ArrayList();
	this.properties = new java.util.HashMap();
}

function FileSystemIterator_start() {
	this.iterate(this.file);
}

function FileSystemIterator_iterate(file) {
	if (file.isDirectory()) {
		var children = file.listFiles();
		for (var i = 0; i < children.length; i++) {
			var child = children[i];
			this.iterate(child);
		}
	} else if (file.isFile()) {
		var itListeners = this.listeners.iterator();
		while (itListeners.hasNext()) {
			itListeners.next().process(file, this);
		}
	}
}

function FileSystemIterator_addListener(listener) {
	this.listeners.add(listener);
}

function FileSystemIterator_removeListener(listener) {
	this.listeners.remove(listener);
}

function FileSystemIterator_setProperty(name, value) {
	this.properties.put(name, value);
}

function FileSystemIterator_getProperty(name) {
	return this.properties.get(name);
}

new FileSystemIterator(null);
FileSystemIterator.prototype.start = FileSystemIterator_start;
FileSystemIterator.prototype.iterate = FileSystemIterator_iterate;
FileSystemIterator.prototype.addListener = FileSystemIterator_addListener;
FileSystemIterator.prototype.removeListener = FileSystemIterator_removeListener;
FileSystemIterator.prototype.setProperty = FileSystemIterator_setProperty;
FileSystemIterator.prototype.getProperty = FileSystemIterator_getProperty;



/* --------------------------------------------------------------------------
 * TaskFlowRegistry
 */
function TaskFlowRegistry(projectDir) {
	this.projectDir = projectDir;
	this.filePath = "META-INF/task-flow-registry.xml";
}

function TaskFlowRegistry_write() {
	var publicHTMLDir = FARUtils.getPublicHTMLDir(this.projectDir);
	if (publicHTMLDir != null) {
		var publicHTMLIterator = new FileSystemIterator(publicHTMLDir);
		publicHTMLIterator.addListener(new TaskFlowListener(publicHTMLDir));
		publicHTMLIterator.start();
		var taskFlows = publicHTMLIterator.getProperty(PROP_TASKFLOWS);
		if (taskFlows != null && taskFlows.size() > 0) {
			var file = new java.io.File(FARUtils.getTargetDir(this.projectDir), this.filePath);
			var echoConsole = self.project.createTask("echo");
			echoConsole.setMessage("Writing " + file);
			echoConsole.perform();
			var echoFile = self.project.createTask("echo");
			var buffer = new java.lang.StringBuffer();
			buffer.append("<?xml version = '1.0' encoding = 'UTF-8'?>\n");
			buffer.append("<task-flow-registry xmlns=\"http://xmlns.oracle.com/adf/controller/rc\">\n");
			var itTaskFlows = taskFlows.iterator();
			while (itTaskFlows.hasNext()) {
				var taskFlow = itTaskFlows.next();
				buffer.append("   ").append(taskFlow.getDescriptorElement()).append("\n");
			}
			buffer.append("</task-flow-registry>");
			echoFile.setMessage(buffer);
			echoFile.setFile(file);
			echoFile.perform();
		}
	}
}

new TaskFlowRegistry(null);
TaskFlowRegistry.prototype.write = TaskFlowRegistry_write;



/* --------------------------------------------------------------------------
 * TaskFlowListener
 */
function TaskFlowListener(publicHTMLDir) {
	this.publicHTMLDir = publicHTMLDir;
	this.namespaces = new javax.xml.namespace.NamespaceContext({
		getNamespaceURI: function(prefix) {return "http://xmlns.oracle.com/adf/controller";},
		getPrefix: function(uri) {return "adfc";},
		getPrefixes: function(uri) {return null;}
	});
}

function TaskFlowListener_process(file, iterator) {
	var path = file.getPath();
	if (path.endsWith("xml")) {
		var fis = null;
		try {
			fis = new java.io.FileInputStream(file);
			var is = new org.xml.sax.InputSource(fis);
			var xPath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
			xPath.setNamespaceContext(this.namespaces);
			var element = xPath.evaluate("/adfc:adfc-mobile-config", is, javax.xml.xpath.XPathConstants.NODE);
			if (element != null && element.getNodeType() == org.w3c.dom.Node.ELEMENT_NODE) {
				var taskFlows = iterator.getProperty(PROP_TASKFLOWS);
				if (taskFlows == null) {
					taskFlows = new java.util.ArrayList();
					iterator.setProperty(PROP_TASKFLOWS, taskFlows);
				}
				taskFlows.add(new TaskFlow(FARUtils.makeRelative(path, this.publicHTMLDir.getPath()), element));
			}
		} finally {
			if (fis != null) {
				fis.close();
				fis = null;
			}
		}
	}
}

new TaskFlowListener(null);
TaskFlowListener.prototype.process = TaskFlowListener_process;

var PROP_TASKFLOWS = "PROP_TASKFLOWS";



/* --------------------------------------------------------------------------
 * TaskFlow
 */
function TaskFlow(path, element) {
	this.path = path;
	this.id = "";
	this.type = "";
	this.usesPageFragments = false;
	this.libraryInternal = false;
	this.remoteInvocable = false;
	this.train = false;
	this.critical = false;
	this.pageType = "unspecified";
	if (element != null) {
		var childElements = element.getElementsByTagName("task-flow-definition");
		if (childElements != null && childElements.getLength() > 0) {
			var childElement = childElements.item(0);
			if (childElement != null) {
				this.type = "task-flow-definition";
				this.id = childElement.getAttribute("id");
			}
		}
	}
}

function TaskFlow_getDescriptorElement() {
	return "" +
		"<task-flow-descriptor path=\"" + this.path +
		"\" id=\"" + this.id +
		"\" type=\"" + this.type +
		"\" uses-page-fragments=\"" + this.usesPageFragments +
		"\" library-internal=\"" + this.libraryInternal +
		"\" remote-invocable=\"" + this.remoteInvocable +
		"\" train=\"" + this.train +
		"\" critical=\"" + this.critical +
		"\" page-type=\"" + this.pageType +
		"\"/>";
}

new TaskFlow("", null);
TaskFlow.prototype.getDescriptorElement = TaskFlow_getDescriptorElement;



/* --------------------------------------------------------------------------
 * Manifest
 */
function Manifest(projectDir) {
	this.projectDir = projectDir;
	this.filePath = "META-INF/MANIFEST.MF";
	this.fileContent = "Manifest-Version: 1.0\n\n";
}

function Manifest_write() {
	var file = new java.io.File(FARUtils.getTargetDir(this.projectDir), this.filePath);
	var echoConsole = self.project.createTask("echo");
	echoConsole.setMessage("Writing " + file);
	echoConsole.perform();
	var echoFile = self.project.createTask("echo");
	echoFile.setMessage(this.fileContent);
	echoFile.setFile(file);
	echoFile.perform();
}

new Manifest(null);
Manifest.prototype.write = Manifest_write;



/* --------------------------------------------------------------------------
 * JarMafPlugins
 */
function JarMafPlugins(assemblyProjectDir, projectDir) {
	this.assemblyProjectDir = assemblyProjectDir;
	this.projectDir = projectDir;
	this.oepeMafAppPath = "adf/META-INF/oepe-maf-application.xml";
	this.oepeMafFeaturesPath = "src/META-INF/oepe-maf-features.xml";
	this.jarMafPluginsPath = "META-INF/jar-maf-plugins.xml";
	this.rtDir = self.getProject().getProperty("adf.rt.zip.root");
	this.currentRtDir = self.getProject().getProperty("adf.rt.runtime.root");
	this.coreCordovaPluginsFileName = this.rtDir + "/" + this.currentRtDir + "/CordovaPlugins/maf-info.json";
	this.oepeCoreCordovaPluginsFileName = this.rtDir + "/metadata/oepe-core-cordova-plugins.json";
}

function JarMafPlugins_write() {
	var jarMafPluginsFile = new java.io.File(FARUtils.getTargetDir(this.projectDir), this.jarMafPluginsPath);
	if (this.assemblyProjectDir != null) {
		var oepeMafAppFile = new java.io.File(this.assemblyProjectDir, this.oepeMafAppPath);
		if (oepeMafAppFile != null && oepeMafAppFile.canRead()) {
			var oepeMafFeaturesFile = new java.io.File(this.projectDir, this.oepeMafFeaturesPath);
			if (oepeMafFeaturesFile != null && oepeMafFeaturesFile.canRead()) {
				var coreCordovaPluginsFile = new java.io.File(this.coreCordovaPluginsFileName);
				if (coreCordovaPluginsFile != null && coreCordovaPluginsFile.canRead()) {
					var oepeCoreCordovaPluginsFile = new java.io.File(this.oepeCoreCordovaPluginsFileName);
					if (oepeCoreCordovaPluginsFile != null && oepeCoreCordovaPluginsFile.canRead()) {
						var echoConsole = self.project.createTask("echo");
						echoConsole.setMessage("Writing " + jarMafPluginsFile + " from " + oepeMafAppFile);
						echoConsole.perform();
						var projectInfo = new ProjectInformation();
						projectInfo.analyzeProjects(FARUtils.getProjectPaths(this.assemblyProjectDir));
						var status = Packages.oracle.tools.maf.cordova.PluginsHelper.transformFeaturePlugins(oepeMafFeaturesFile, oepeMafAppFile, oepeCoreCordovaPluginsFile, coreCordovaPluginsFile, jarMafPluginsFile, projectInfo.projects, Packages.oracle.tools.maf.cordova.PluginsHelper.Platform.ANY);
						if (status) {
							if (status.isMultiStatus()) {
								var statuses = status.getChildren();
								for (var i = 0; i < statuses.length; i++){
									antHelper.echo(statuses[i].getMessage());
								}
							} else if (!status.isOK()) {
								antHelper.echo(status.getMessage());
							}
						} else {
							antHelper.echo("No status returned");
						}
					}
				}
			}
		}
	}
}

new JarMafPlugins(null, null);
JarMafPlugins.prototype.write = JarMafPlugins_write;



/* --------------------------------------------------------------------------
 * JarOepeMafApplication
 */
function JarOepeMafApplication(assemblyProjectDir, projectDir) {
	this.assemblyProjectDir = assemblyProjectDir;
	this.projectDir = projectDir;
	this.oepeMafAppPath = "adf/META-INF/oepe-maf-application.xml";
	this.oepeMafFeaturesPath = "src/META-INF/oepe-maf-features.xml";
	this.jarOepeMafAppPath = "META-INF/jar-oepe-maf-application.xml";
}

function JarOepeMafApplication_write() {
	var jarOepeMafAppFile = new java.io.File(FARUtils.getTargetDir(this.projectDir), this.jarOepeMafAppPath);
	if (this.assemblyProjectDir != null) {
		var oepeMafAppFile = new java.io.File(this.assemblyProjectDir, this.oepeMafAppPath);
		if (oepeMafAppFile != null && oepeMafAppFile.canRead()) {
			var oepeMafFeaturesFile = new java.io.File(this.projectDir, this.oepeMafFeaturesPath);
			if (oepeMafFeaturesFile != null && oepeMafFeaturesFile.canRead()) {
				var echoConsole = self.project.createTask("echo");
				echoConsole.setMessage("Writing " + jarOepeMafAppFile + " from " + oepeMafAppFile);
				echoConsole.perform();
				Packages.oracle.tools.maf.cordova.OepeMafApplicationHelper.writeJarOepeMafApplication(oepeMafAppFile, oepeMafFeaturesFile, jarOepeMafAppFile);
			}
		}
	}
}

new JarOepeMafApplication(null, null);
JarOepeMafApplication.prototype.write = JarOepeMafApplication_write;



/* --------------------------------------------------------------------------
 * FARUtils
 */
FARUtils = new Object();

FARUtils.getTargetDir = function(projectDir) {
	var dir = null;
	if (projectDir != null && projectDir.isDirectory()) {
		var buildRootPath = self.project.getProperty("adf.build.root.dir");
		var relFarsPath = self.project.getProperty("oepe.adfmf.staging.relpath.fars");
		dir = new java.io.File(buildRootPath + "/" + relFarsPath + "/" + projectDir.getName());
	}
	return dir;
};

FARUtils.getDefaultOutputDir = function(projectDir) {
	var dir = null;
	if (projectDir != null && projectDir.isDirectory()) {
		var classpathFile = new java.io.File(projectDir, ".classpath");
		if (classpathFile.canRead()) {
			var fis = null;
			try {
				fis = new java.io.FileInputStream(classpathFile);
				var is = new org.xml.sax.InputSource(fis);
				var xPath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
				var nodeSet = xPath.evaluate("/classpath/classpathentry[@kind='output']", is, javax.xml.xpath.XPathConstants.NODESET);
				if (nodeSet != null && nodeSet.getLength() > 0) {
					var node = nodeSet.item(0);
					if (node.getNodeType() == org.w3c.dom.Node.ELEMENT_NODE) {
						var path = node.getAttribute("path");
						if (path != null) {
							dir = new java.io.File(projectDir, path);
						}
					}
				}
			} finally {
				if (fis != null) {
					fis.close();
					fis = null;
				}
			}
		}
	}
	return dir;
};

FARUtils.getPublicHTMLDir = function(projectDir) {
	var publicHTMLDir = null;
	if (projectDir != null && projectDir.isDirectory()) {
		var dir = new java.io.File(projectDir, self.project.getProperty("oepe.adfmf.publichtml.folder.name"));
		if (dir.exists() && dir.isDirectory()) {
			publicHTMLDir = dir;
		}
	}
	return publicHTMLDir;
};

FARUtils.isFeatureProject = function(projectDir) {
	var isFeature = false;
	if (projectDir != null && projectDir.isDirectory()) {
		var outputDir = this.getDefaultOutputDir(projectDir);
		if (outputDir != null) {
			var featureFile = new java.io.File(outputDir, "META-INF/maf-feature.xml");
			isFeature = featureFile.exists();
		}
	}
	return isFeature;
};

FARUtils.makeRelative = function(path1, path2) {
	var relPath = path1;
	if (path1.startsWith(path2)) {
		relPath = path1.substring(path2.length());
	}
	relPath = relPath.replace("\\", "/");
	if (relPath.startsWith("/")) {
		relPath = relPath.substring(1);
	}
	return relPath;
};

FARUtils.getLibrariesForProject = function(projectPath) {
	var libs = new java.util.ArrayList();
	if (projectPath != null) {
		var libraries = self.project.getReference("oepe.adfmf.libraries");
		if (libraries != null) {
			var itLibraries = libraries.iterator();
			while (itLibraries.hasNext()) {
		 		var library = itLibraries.next();
		 		if (library instanceof org.apache.tools.ant.types.resources.PropertyResource) {
		 			library = library.getValue();
		 		}
		 		var libParts = library.split("\\|");
		 		if (libParts.length == 2) {
		 			if (projectPath.compareTo(new File(libParts[0])) == 0) {
		 				libs.add(libParts[1]);
		 			}		 			
		 		}
			}
		}
	}
	return libs;
};

FARUtils.getIncludeConnectionDetails = function() {
	var incConnDetails = true;
	var propVal = self.project.getProperty("oepe.adfmf.far.export.include.connection.details");
	if (propVal && propVal == "false") {
		incConnDetails = false;
	}
	return incConnDetails;
};

FARUtils.getProjectPaths = function(assemblyProjectDir) {
	var paths = new Array();
	if (assemblyProjectDir != null && assemblyProjectDir.isDirectory()) {
		paths.push(assemblyProjectDir.getCanonicalPath());
		var dotOepeFile = new java.io.File(assemblyProjectDir, ".oepe");
		if (dotOepeFile.canRead()) {
			var fis = null;
			try {
				fis = new java.io.FileInputStream(dotOepeFile);
				var is = new org.xml.sax.InputSource(fis);
				var xPath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
				xPath.setNamespaceContext(new javax.xml.namespace.NamespaceContext({
					getNamespaceURI: function(prefix) {
						return "http://xmlns.oracle.com/oepe/metadata/1.0";
					},
					getPrefix: function(uri) {
						return "oepe";
					},
					getPrefixes: function(uri) {
						return null;
					}
				}));
				var projects = xPath.evaluate("//oepe:project", is, javax.xml.xpath.XPathConstants.NODESET);
				if (projects != null) {
					for (var i = 0; i < projects.getLength(); i++) {
						var project = projects.item(i);
						var projectText = project.getFirstChild();
						if (projectText instanceof org.w3c.dom.Text) {
							var projectName = projectText.getWholeText().trim();
							var projectDir = new java.io.File(assemblyProjectDir, "../" + projectName);
							paths.push(projectDir.getCanonicalPath());
						}
					}
				}
			} finally {
				if (fis != null) {
					fis.close();
					fis = null;
				}
			}
		}
	}
	return paths;
};
