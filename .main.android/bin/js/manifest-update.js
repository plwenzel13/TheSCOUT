/**
 * Update the application version in Manifest.xml file.
 */
eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(self.project.getProperty("oepe.bin.js.dir")+"/loader.js"))));
load("common.js");

var androidNamespace = new javax.xml.namespace.NamespaceContext(
	{
	    getNamespaceURI : function(prefix) {return "http://schemas.android.com/apk/res/android";},
	    getPrefix : function(uri) {return "android";},
	    getPrefixes : function(uri) {return null;}
	}
);

// the main entry point of this module
updateManifest();

function updateManifest(){
	var buildRootDir = self.project.getProperty("adf.build.root.dir");
	// the Manifest.xml file that must be updated
	var manifestFile = buildRootDir + "/AndroidManifest.xml";
	// adf-config.xml file that we analyse
	var adfConfigFile = buildRootDir + "/.adf/META-INF/adf-config.xml";
	// maf-application.xml file
	var mafApplication = buildRootDir + "/.adf/META-INF/maf-application.xml";
	
	updateApplicationVersion(buildRootDir, manifestFile)
	updateInstallLocation(manifestFile);
	updateManifestAppActivity(adfConfigFile, manifestFile);
	updateManifestLogging(adfConfigFile, manifestFile);
	updateManifestUrlScheme(mafApplication, manifestFile);
	updateManifest2WaySSL(mafApplication, manifestFile)
}

function updateManifest2WaySSL(mafApplication, manifestFile){
	
	var is = null;
	var os = null;
	try {
		var amis = new java.io.FileInputStream(manifestFile);
		is = new org.xml.sax.InputSource(amis);
		var dcDoc = new XMLDocument(is);
		var xmlDoc = dcDoc.load();
		
		var certExtension = getCertExtension(mafApplication);
		antHelper.echo("Certificate : "+certExtension);
		if(certExtension){
			remove2WaySSLIntents(xmlDoc);
			add2WaySSLIntents(xmlDoc, certExtension);
		}else{
			remove2WaySSLIntents(xmlDoc);
		}
		
		os = new java.io.FileOutputStream(manifestFile);
		dcDoc.save(os);
	}catch (e){
		antHelper.echo(e);
	}finally{
		if (is != null) {
			try{is.close();} catch(e) {}
		}
		if (os != null) {
			try{os.close();} catch(e) {}
		}
	}

}

function getCertExtension(mafApplication) {
	var is = null;
	var os = null;
	try {
		var amis = new java.io.FileInputStream(mafApplication);
		is = new org.xml.sax.InputSource(amis);
		var dcDoc = new XMLDocument(is);
		var xmlDoc = dcDoc.load();
		// create xpath factory
		var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
		xpath.setNamespaceContext(androidNamespace);
		return xpath.evaluate("/application/@client-ssl-certificate-extension", xmlDoc, javax.xml.xpath.XPathConstants.STRING);
	}catch (e){
		antHelper.echo(e);
	}finally{
		if (is != null) {
			try{is.close();} catch(e) {}
		}
		if (os != null) {
			try{os.close();} catch(e) {}
		}
	}
}

function remove2WaySSLIntents(xmlDoc){
	var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
	xpath.setNamespaceContext(androidNamespace);
	var nodeTodelete = xpath.evaluate("/manifest/application/activity[@name=\"oracle.adfmf.Container\"]/intent-filter[data/@scheme=\"content\"]", xmlDoc, javax.xml.xpath.XPathConstants.NODE);
	if(nodeTodelete){
		antHelper.echo("removed intent-filter/data[@scheme=file]");
		var parent = nodeTodelete.getParentNode();
		parent.removeChild(nodeTodelete);
	}
	nodeTodelete = xpath.evaluate("/manifest/application/activity[@name=\"oracle.adfmf.Container\"]/intent-filter[data/@scheme=\"file\"]", xmlDoc, javax.xml.xpath.XPathConstants.NODE);	
	if(nodeTodelete){
		antHelper.echo("removed intent-filter/data[@scheme=file]");
		var parent = nodeTodelete.getParentNode();
		parent.removeChild(nodeTodelete);
	}
}

function add2WaySSLIntents(xmlDoc, certExtension){
	var contentFilter = new java.lang.String(
		"<intent-filter>\n"+
		"   <action android:name=\"android.intent.action.VIEW\"/>\n"+
		"   <category android:name=\"android.intent.category.BROWSABLE\"/>\n"+
		"   <category android:name=\"android.intent.category.DEFAULT\"/> \n"+
		"	<data android:mimeType=\"application/*\" android:pathPattern=\".*."+certExtension+"\" android:scheme=\"content\" host=\"*\"/> \n"+
		"</intent-filter>");
	var fileFilter = new java.lang.String(
		"<intent-filter>\n"+
		"   <action android:name=\"android.intent.action.VIEW\"/>\n"+
		"   <category android:name=\"android.intent.category.BROWSABLE\"/>\n"+
		"   <category android:name=\"android.intent.category.DEFAULT\"/> \n"+
		"	<data android:mimeType=\"application/*\" android:pathPattern=\".*."+certExtension+"\" android:scheme=\"file\" host=\"*\"/> \n"+
		"</intent-filter>");
	var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
	xpath.setNamespaceContext(androidNamespace);
	var activity = xpath.evaluate("/manifest/application/activity[@name=\"oracle.adfmf.Container\"]", xmlDoc, javax.xml.xpath.XPathConstants.NODE);
	if (activity) {
		xmlUpdater.appendBufferAsNode(activity, contentFilter);
		xmlUpdater.appendBufferAsNode(activity, fileFilter);
	}
}

function updateInstallLocation(manifestFile){
	
	var preferredStorage = self.project.getProperty("oepe.maf.android.preferredStorage");
	if (preferredStorage){
		if (preferredStorage == 'Auto'){
			updatePreferredStorage('auto', manifestFile);
		}else if(preferredStorage == 'External'){
			updatePreferredStorage('preferExternal', manifestFile);
		}else if(preferredStorage == 'Internal'){
			updatePreferredStorage('internalOnly', manifestFile);
		}
	}
	
}

function updateApplicationVersion(buildRootDir, manifestFile){
	// get an application version
	var version = getApplicationVersion(buildRootDir);
	// get an application code
	var code = self.project.getProperty("oepe.maf.android.versionCode");
	// update project's manifest file
	if (version) {
		updateManifestVersion(version, code, manifestFile);
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

function updatePreferredStorage(installLocation, manifestFile){
	var is = null;
	var os = null;
	try {
		var amis = new java.io.FileInputStream(manifestFile);
		is = new org.xml.sax.InputSource(amis);
		var dcDoc = new XMLDocument(is);
		var xmlDoc = dcDoc.load();
		
		var manifestElement = xmlDoc.getDocumentElement();
		
		manifestElement.setAttribute("android:installLocation", installLocation);
		
		os = new java.io.FileOutputStream(manifestFile);
		dcDoc.save(os);
	}catch (e){
		antHelper.echo(e);
	}finally{
		if (is != null) {
			try{is.close();} catch(e) {}
		}
		if (os != null) {
			try{os.close();} catch(e) {}
		}
	}	
}

function updateManifestVersion(version, code, manifestFile){
	var is = null;
	var os = null;
	try {
		var amis = new java.io.FileInputStream(manifestFile);
		is = new org.xml.sax.InputSource(amis);
		var dcDoc = new XMLDocument(is);
		var xmlDoc = dcDoc.load();
		
		var manifestElement = xmlDoc.getDocumentElement();
		manifestElement.setAttribute("android:versionName", version);
		if(code && !isNaN(code)){
			manifestElement.setAttribute("android:versionCode", code);
		}
		os = new java.io.FileOutputStream(manifestFile);
		dcDoc.save(os);
	}catch (e){
		antHelper.echo(e);
	}finally{
		if (is != null) {
			try{is.close();} catch(e) {}
		}
		if (os != null) {
			try{os.close();} catch(e) {}
		}
	}	
}

function updateManifestAppActivity(adfConfigFile, manifestFile){
	var is = null;
	var os = null;
	try {
		var amis = new java.io.FileInputStream(manifestFile);
		is = new org.xml.sax.InputSource(amis);
		var dcDoc = new XMLDocument(is);
		var xmlDoc = dcDoc.load();
		if(xmlDoc){
			var containerActivityElement = getContainerActivityElement(xmlDoc, androidNamespace);
			var hardwareAttr = containerActivityElement.getAttribute("android:hardwareAccelerated");
			var hardvarePropValue = getElementAttributeValue(adfConfigFile, "/adf-config/adf-properties-child/adf-property[@name=\"android.hardwareAccelerated\"]/@value");
			if (hardvarePropValue && hardvarePropValue == 'true'){
				//add hardware attribute to manifest
				java.lang.System.out.println('hardware property is set, thus hardwareAccelerated attribute will be set too');
				containerActivityElement.setAttribute("android:hardwareAccelerated", "true");
			}else{
				// remove hardware attribute if exist
				java.lang.System.out.println('hardware property is not set, thus hardwareAccelerated attribute will be removed if exist');
				if (hardwareAttr){
					containerActivityElement.removeAttribute("android:hardwareAccelerated");
				}
			}
		}
		os = new java.io.FileOutputStream(manifestFile);
		dcDoc.save(os);
	}catch (e){
		antHelper.echo(e);
	}finally{
		if (is != null) {
			try{is.close();} catch(e) {}
		}
		if (os != null) {
			try{os.close();} catch(e) {}
		}
	}	
}

function updateManifestUrlScheme(mafApplication, manifestFile){
	var is = null;
	var os = null;
	try {
		var amis = new java.io.FileInputStream(manifestFile);
		is = new org.xml.sax.InputSource(amis);
		var dcDoc = new XMLDocument(is);
		var xmlDoc = dcDoc.load();
		if(xmlDoc){
			
			var schemaName = getElementAttributeValue(mafApplication, "/application/@urlScheme");
			var activityElement = getActivityElement(xmlDoc, androidNamespace);
			
			if (activityElement){
				if (schemaName){
					antHelper.info('adding schema intent filter for: '+schemaName);
					// remove previous filter if already exist
					removeUrlSchemeFilterIfExist(xmlDoc, schemaName);
					// add new filter with current url scheme
					addUrlSchemeFilter(xmlDoc, schemaName);
				}else{
					antHelper.info('removing existing schema intent filter');
					// remove filter if already exist
					removeUrlSchemeFilterIfExist(xmlDoc, schemaName); 
				}
				os = new java.io.FileOutputStream(manifestFile);
				dcDoc.save(os);
			}
		}
	}catch (e){
		antHelper.echo(e);
		fail(e);
	}finally{
		if (os != null) {
			try{os.close();} catch(e) {}
		}
		if (amis != null) {
			try{amis.close();} catch(e) {}
		}
	}
}

function getIntentFilterForSchema(xmlDoc, schemaName){
	var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
	xpath.setNamespaceContext(androidNamespace);
	return xpath.evaluate("/manifest/application/activity[@name=\"oracle.adfmf.Container\"]/intent-filter[data/@scheme]", xmlDoc, javax.xml.xpath.XPathConstants.NODE);
}

function removeUrlSchemeFilterIfExist(xmlDoc, schemaName){
	var intentFilter = getIntentFilterForSchema(xmlDoc, schemaName);
	if (intentFilter) {
		antHelper.echo("removed intent-filter");
		var parent = intentFilter.getParentNode();
		parent.removeChild(intentFilter);
	}
}

function getActivityElement(xmlDoc, namespace){
	var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
	xpath.setNamespaceContext(namespace);
	return xpath.evaluate("/manifest/application/activity[@name=\"oracle.adfmf.Container\"]", xmlDoc, javax.xml.xpath.XPathConstants.NODE);
}

function addUrlSchemeFilter(xmlDoc, schemaName){
	var activityElement = getActivityElement(xmlDoc, androidNamespace);
	if (activityElement){
		var filter = activityElement.getOwnerDocument().createElement("intent-filter");
		var view = activityElement.getOwnerDocument().createElement("action");
		view.setAttribute("android:name", "android.intent.action.VIEW");
		filter.appendChild(view);
		var category1 = activityElement.getOwnerDocument().createElement("category");
		category1.setAttribute("android:name", "android.intent.category.BROWSABLE");
		filter.appendChild(category1);
		var category2 = activityElement.getOwnerDocument().createElement("category");
		category2.setAttribute("android:name", "android.intent.category.DEFAULT");
		filter.appendChild(category2);
		var data = activityElement.getOwnerDocument().createElement("data");
		data.setAttribute("android:scheme", schemaName);
		filter.appendChild(data);
		activityElement.appendChild(filter);
	}
}

function updateManifestLogging(adfConfigFile, manifestFile){
	var is = null;
	var os = null;
	try {
		var amis = new java.io.FileInputStream(manifestFile);
		is = new org.xml.sax.InputSource(amis);
		var dcDoc = new XMLDocument(is);
		var xmlDoc = dcDoc.load();
		if(xmlDoc){
			
			var disableLogging = getElementAttributeValue(adfConfigFile, "/adf-config/adf-properties-child/adf-property[@name=\"disableLogging\"]/@value");
			//antHelper.info(disableLogging);
			
			var appElement = getApplicationElement(xmlDoc, androidNamespace);
			//antHelper.info('app element: '+appElement);
			
			if (appElement){
				var metaData = getMetadataElement(xmlDoc, androidNamespace);
				if (metaData) {
					appElement.removeChild(metaData);
				}
			
				if (disableLogging && disableLogging == 'true'){
					//set disableLogging manifest meta to true in manifest
					if (appElement){
						antHelper.info('logging is disabled globally');
						xmlUpdater.addElementsIfMissing(appElement, 'meta-data', 'android:name', 'disableLogging', new java.lang.String("<meta-data android:name=\"disableLogging\" android:value=\"true\"/>"))
					}
				}else{
					//set disableLogging manifest meta to false in manifest
					if (appElement) {
						antHelper.info('logging is enabled globally');
						xmlUpdater.addElementsIfMissing(appElement, 'meta-data', 'android:name', 'disableLogging', new java.lang.String("<meta-data android:name=\"disableLogging\" android:value=\"false\"/>"))
					}
				}
				cleanDom(appElement, androidNamespace);
			}
		}
		os = new java.io.FileOutputStream(manifestFile);
		dcDoc.save(os);
	}catch (e){
		antHelper.echo(e);
		fail(e);
	}finally{
		if (os != null) {
			try{os.close();} catch(e) {}
		}
		if (amis != null) {
			try{amis.close();} catch(e) {}
		}
	}
}

function getMetadataElement(xmlDoc, namespace){
	var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
	xpath.setNamespaceContext(namespace);
	return xpath.evaluate("/manifest/application/meta-data[@name=\"disableLogging\"]", xmlDoc, javax.xml.xpath.XPathConstants.NODE);
}

function getApplicationElement(xmlDoc, namespace){
	var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
	xpath.setNamespaceContext(namespace);
	return xpath.evaluate("/manifest/application", xmlDoc, javax.xml.xpath.XPathConstants.NODE);
}

function cleanDom(element){
	var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
	var emptyTextNodes = xpath.evaluate("//text()", element, javax.xml.xpath.XPathConstants.NODESET);
	for (var i = 0; i < emptyTextNodes.getLength(); i++) {
		var emptyTextNode = emptyTextNodes.item(i);
	    emptyTextNode.getParentNode().removeChild(emptyTextNode);
	}
}

function fail(msg){
	var task = project.createTask("fail");
    task.setMessage(msg);
    task.perform( );
}

function getContainerActivityElement(xmlDoc, namespace){
	var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
	xpath.setNamespaceContext(namespace);
	return xpath.evaluate("/manifest/application/activity[1]", xmlDoc, javax.xml.xpath.XPathConstants.NODE);
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

