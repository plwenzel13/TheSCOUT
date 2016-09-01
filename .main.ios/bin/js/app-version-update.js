/**
 * Update the application version in plist file.
 */
eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(self.project.getProperty("oepe.bin.js.dir")+"/loader.js"))));
load("common.js");

// the main entry point of this module
updateApplicationVersion();
updateEnableLogging();
updateUrlSchemeTypes();
update2WaySsl();

function update2WaySsl(){
	// temporary project folder
	var buildRootDir = self.project.getProperty("adf.build.root.dir");
	// the plist file that must be updated
	var plistFile = buildRootDir + "/Oracle_ADFmc_Container_Template/Oracle_ADFmc_Container_Template-Info.plist";
	// maf-application.xml file
	var mafApplication = buildRootDir + "/.adf/META-INF/maf-application.xml";
	
	var certExtension = getElementAttributeValue(mafApplication, "/application/@client-ssl-certificate-extension");
	if (certExtension){
		java.lang.System.out.println('updating SSL cert. extension : '+certExtension);
		removeSslCertSupport(plistFile);
		addSslCertSupport(plistFile, certExtension);
	}else{
		removeSslCertSupport(plistFile);
	}
}

function addSslCertSupport(plistFile, certExtension){
    var propertyName = "adf.build.task.update2WaySsl";
	
	executePlistCommand("Add :CFBundleDocumentTypes array", plistFile, propertyName);
	executePlistCommand("Add :CFBundleDocumentTypes:0 dict", plistFile, propertyName);
	executePlistCommand("Add :CFBundleDocumentTypes:0:CFBundleTypeIconFiles array", plistFile, propertyName);
	executePlistCommand("Add :CFBundleDocumentTypes:0:CFBundleTypeName string MyAppName", plistFile, propertyName);
	executePlistCommand("Add :CFBundleDocumentTypes:0:CFBundleTypeRole string Viewer", plistFile, propertyName);
	executePlistCommand("Add :CFBundleDocumentTypes:0:LSHandlerRank string Owner", plistFile, propertyName);
	executePlistCommand("Add :CFBundleDocumentTypes:0:LSItemContentTypes array", plistFile, propertyName);
	executePlistCommand("Add :CFBundleDocumentTypes:0:LSItemContentTypes:0 string com.oracle.maf.cert", plistFile, propertyName);
	
	executePlistCommand("Add :UTExportedTypeDeclarations array", plistFile, propertyName);
	executePlistCommand("Add :UTExportedTypeDeclarations:0 dict", plistFile, propertyName);
	executePlistCommand("Add :UTExportedTypeDeclarations:0:UTTypeConformsTo array", plistFile, propertyName);
	executePlistCommand("Add :UTExportedTypeDeclarations:0:UTTypeConformsTo:0 string public.data", plistFile, propertyName);
	executePlistCommand("Add :UTExportedTypeDeclarations:0:UTTypeDescription string MyAppName", plistFile, propertyName);
	executePlistCommand("Add :UTExportedTypeDeclarations:0:UTTypeIdentifier string com.oracle.maf.cert", plistFile, propertyName);
	executePlistCommand("Add :UTExportedTypeDeclarations:0:UTTypeTagSpecification dict", plistFile, propertyName);
	executePlistCommand("Add :UTExportedTypeDeclarations:0:UTTypeTagSpecification:public.filename-extension string "+certExtension, plistFile, propertyName);
	executePlistCommand("Add :UTExportedTypeDeclarations:0:UTTypeTagSpecification:public.mime-type string application/octet-stream", plistFile, propertyName);
	
	java.lang.System.out.println(" Done.");
}

function executePlistCommand(command, plistFile, propertyName){
	var plistBuddy = project.createTask("PlistBuddy");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("command", command);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("filename", plistFile);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("outputproperty", propertyName);
	plistBuddy.perform();
}

function removeSslCertSupport(plistFile) {
	removePlistKey(self.project, "UTExportedTypeDeclarations", plistFile, "adf.build.task.update2WaySsl");
	removePlistKey(self.project, "CFBundleDocumentTypes", plistFile, "adf.build.task.update2WaySsl");
}

function updateUrlSchemeTypes(){
	// temporary project folder
	var buildRootDir = self.project.getProperty("adf.build.root.dir");
	// the plist file that must be updated
	var plistFile = buildRootDir + "/Oracle_ADFmc_Container_Template/Oracle_ADFmc_Container_Template-Info.plist";
	// maf-application.xml file
	var mafApplication = buildRootDir + "/.adf/META-INF/maf-application.xml";
	
	var schemaName = getElementAttributeValue(mafApplication, "/application/@urlScheme");
	if (schemaName){
		java.lang.System.out.println('adding schema : '+schemaName);
		removeUrlTypes(plistFile);
		addUrlTypes(plistFile, schemaName);
	}else{
		removeUrlTypes(plistFile);
	}
}

function removeUrlTypes(plistFile) {
	removePlistKey(self.project, "CFBundleURLTypes", plistFile, "adf.build.task.updateUrlSchemes");
}

function addUrlTypes(plistFile, schemaName){
    var propertyName = "adf.build.task.updateUrlSchemes";
	
	var plistBuddy = project.createTask("PlistBuddy");
	
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("command", "Add :CFBundleURLTypes array");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("filename", plistFile);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("outputproperty", propertyName);
	java.lang.System.out.print("Adding CFBundleURLTypes to plist");
	plistBuddy.perform();
	
	plistBuddy = project.createTask("PlistBuddy");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("command", "Add :CFBundleURLTypes:0 dict");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("filename", plistFile);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("outputproperty", propertyName);
	plistBuddy.perform();
	
	plistBuddy = project.createTask("PlistBuddy");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("command", "Add :CFBundleURLTypes:0:CFBundleURLSchemes array");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("filename", plistFile);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("outputproperty", propertyName);
	plistBuddy.perform();
	
	plistBuddy = project.createTask("PlistBuddy");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("command", "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string "+schemaName);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("filename", plistFile);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("outputproperty", propertyName);
	plistBuddy.perform();
	
	java.lang.System.out.println(" Done.");
}

function updateApplicationVersion(){
	// temporary project folder
	var buildRootDir = self.project.getProperty("adf.build.root.dir");
	// the plist file that must be updated
	var plistFile = buildRootDir + "/Oracle_ADFmc_Container_Template/Oracle_ADFmc_Container_Template-Info.plist";
	// get an application version
	var version = getApplicationVersion(buildRootDir);
	// update project's plist file
	if (version) {
		removePlistKey(self.project, "CFBundleVersion", plistFile, "adf.build.task.updateApplicationVersion");
		removePlistKey(self.project, "CFBundleShortVersionString", plistFile, "adf.build.task.updateApplicationVersion");
		
		addPlistKey(self.project, "CFBundleVersion", version, plistFile, "adf.build.task.updateApplicationVersion");
		addPlistKey(self.project, "CFBundleShortVersionString", version, plistFile, "adf.build.task.updateApplicationVersion");	
	}
	// show result of the operation in console
	var result = self.project.getProperty("adf.build.task.updateApplicationVersion");
	if (result){
		antHelper.echo(result);
	}
}

function updateEnableLogging(){
	var buildRootDir = self.project.getProperty("adf.build.root.dir");
	// adf-config.xml file that we analyze for logging flag
	var adfConfigFile = buildRootDir + "/.adf/META-INF/adf-config.xml";
	// the plist file that must be updated
	var plistFile = buildRootDir + "/Oracle_ADFmc_Container_Template/Oracle_ADFmc_Container_Template-Info.plist";
	// update plist metadata
	var disableLogging = getElementAttributeValue(adfConfigFile, "/adf-config/adf-properties-child/adf-property[@name=\"disableLogging\"]/@value");
	if (disableLogging && disableLogging == 'true'){
		removePlistKey(self.project, "disableLogging", plistFile, "adf.build.task.updateApplicationVersion");
		addPlistKey(self.project, "disableLogging", "true", plistFile, "adf.build.task.updateApplicationVersion");
	}else{
		removePlistKey(self.project, "disableLogging", plistFile, "adf.build.task.updateApplicationVersion");
		addPlistKey(self.project, "disableLogging", "false", plistFile, "adf.build.task.updateApplicationVersion");
	}
}

function getApplicationVersion(buildRootDir) {
	// create xpath factory
	var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
	// maf-application.xml file that must be updated
	var plistFile = buildRootDir + "/.adf/META-INF/maf-application.xml";
	// open the file and fetch the version from it
	var is = null;
	try {
		is = new java.io.FileInputStream(plistFile);
		var dcDoc = new XMLDocument(is);
		var xmlDoc = dcDoc.load();
		return xpath.evaluate("/application/@version", xmlDoc, javax.xml.xpath.XPathConstants.STRING);
	}catch (e){
		antHelper.echo(e);
	}finally{
		if (is != null) {
			try{is.close();} catch(e) {}
		}
	}
}

function getElementAttributeValue(file, xpathString){
	var is = null;
	try {
		var amis = new java.io.FileInputStream(file);
		is = new org.xml.sax.InputSource(amis);
		var dcDoc = new XMLDocument(is);
		var xmlDoc = dcDoc.load();
		if(xmlDoc){
			var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
			return xpath.evaluate(xpathString, xmlDoc, javax.xml.xpath.XPathConstants.STRING);
		}
	}catch (e){
		antHelper.echo(e);
	}finally{
		if (is != null) {
			try{is.close();} catch(e) {}
		}
	}
}

function removePlistKey(project, key, plistFile, propertyName) {
	var plistBuddy = project.createTask("PlistBuddy");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("command", "Delete :" + key);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("filename", plistFile);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("fail", "false");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("outputproperty", propertyName);
	java.lang.System.out.print("Performing remove: " + key);
	plistBuddy.perform();
	java.lang.System.out.println(" Done.");
}

function setPlistKey(project, key, value, plistFile, propertyName) {
	var plistBuddy = project.createTask("PlistBuddy");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("command", "Set :" + key + " "+value);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("filename", plistFile);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("outputproperty", propertyName);
	java.lang.System.out.print("Performing set: " + key + " " + value);
	plistBuddy.perform();
	java.lang.System.out.println(" Done.");
}

function addPlistKey(project, key, value, plistFile, propertyName) {
	var plistBuddy = project.createTask("PlistBuddy");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("command", "Add :" + key + " string "+value);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("filename", plistFile);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("outputproperty", propertyName);
	java.lang.System.out.print("Performing add: " + key + " " + value);
	plistBuddy.perform();
	java.lang.System.out.println(" Done.");
}