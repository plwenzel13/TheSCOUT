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
importClass(javax.xml.parsers.DocumentBuilderFactory);
importClass(javax.xml.transform.Transformer);
importClass(javax.xml.transform.TransformerConfigurationException);
importClass(javax.xml.transform.TransformerException);
importClass(javax.xml.transform.TransformerFactory);
importClass(javax.xml.transform.dom.DOMSource);
importClass(javax.xml.transform.stream.StreamResult);
*/

eval(''
		+ new String(org.apache.tools.ant.util.FileUtils
				.readFully(new java.io.FileReader(self.project
						.getProperty("oepe.bin.js.dir")
						+ "/loader.js"))));
load("common.js");

updateCordovaPlist();

function updateCordovaPlist() {
	var deviceAccessToPermissionsMap = new java.util.HashMap();

	var permissionNames = new java.util.HashSet();
	permissionNames.add("Camera");
	permissionNames.add("Capture");
	deviceAccessToPermissionsMap.put("oepe.maf.device.access.camera",
			permissionNames);

	deviceAccessToPermissionsMap.put("oepe.maf.device.access.contacts",
			java.util.Collections.singleton("Contacts"));

	deviceAccessToPermissionsMap.put("oepe.maf.device.access.emails",
			java.util.Collections.singleton("AdfmfEmail"));

	permissionNames = new java.util.HashSet();
	permissionNames.add("File");
	permissionNames.add("FileTransfer");
	deviceAccessToPermissionsMap.put("oepe.maf.device.access.files",
			permissionNames);

	permissionNames = new java.util.HashSet();
	permissionNames.add("Geolocation");
	permissionNames.add("Compass");
	deviceAccessToPermissionsMap.put("oepe.maf.device.access.location",
			permissionNames);

	deviceAccessToPermissionsMap.put("oepe.maf.device.access.network",
			java.util.Collections.singleton("NetworkStatus"));

	deviceAccessToPermissionsMap.put("oepe.maf.device.access.pushnotifications",
			java.util.Collections.singleton("PushPlugin"))
	deviceAccessToPermissionsMap.put("oepe.maf.device.access.sms",
			java.util.Collections.singleton("AdfmfSMS"));
	deviceAccessToPermissionsMap.put("oepe.maf.device.access.phone",
			java.util.Collections.emptySet());

	var permissionsToDeviceAccessMap = invertMapOfStringSets(deviceAccessToPermissionsMap);

	var keyToValueMap = new java.util.HashMap();
	keyToValueMap.put("Camera", "CDVCamera");
	keyToValueMap.put("Capture", "CDVCapture");
	keyToValueMap.put("Contacts", "CDVContacts");
	keyToValueMap.put("AdfmfEmail", "AdfmfEmailAdaptor");
	keyToValueMap.put("File", "CDVFile");
	keyToValueMap.put("FileTransfer", "CDVFileTransfer");
	keyToValueMap.put("Geolocation", "CDVLocation");
	keyToValueMap.put("Compass", "CDVLocation");
	keyToValueMap.put("NetworkStatus", "CDVConnection");
	keyToValueMap.put("PushPlugin", "PushPlugin");
	keyToValueMap.put("AdfmfSMS", "AdfmfSMSAdaptor");
	  	

	var alreadyConfigured = new java.util.HashSet();
	var insertionNode = null;
	try {
		var buildRootDir = self.project.getProperty("adf.build.root.dir");
		var plistFile = buildRootDir + "/Cordova.plist";

		readPlistKey(project, plistFile, "oepe.maf.plist.device.access");
		plistDeviceAccess = self.project
				.getProperty("oepe.maf.plist.device.access");
		var openBracketIdx = plistDeviceAccess.indexOf("{");
		var closeBracketIdx = plistDeviceAccess.indexOf("}");
		if (openBracketIdx > -1 && closeBracketIdx > -1) {
			var pluginKeyValueStr = plistDeviceAccess.substring(
					openBracketIdx + 1, closeBracketIdx);
			var keyValueReader = new java.io.BufferedReader(
					new java.io.StringReader(pluginKeyValueStr));
			// plist buddy will give us as newline-delimited list of 'key = value' pairs.  Read one at a tme
			// and parse out key/value pairs.
			while ((line = keyValueReader.readLine()) != null) {
				if (line != null) {
					line = line.trim();
					var keyValuePair = line.split("=");
					if (keyValuePair.length == 2) {
						var key = keyValuePair[0] != null ? keyValuePair[0]
								.trim() : null;
						var value = keyValuePair[1] != null ? keyValuePair[1]
								.trim() : null;
						if (key != null) {
							var deviceAccessSet = permissionsToDeviceAccessMap
									.get(key);
							if (deviceAccessSet != null) {
								var deviceAccessSetIt = deviceAccessSet
										.iterator();
								while (deviceAccessSetIt.hasNext()) {
									var neededDeviceAccess = deviceAccessSetIt
											.next();
									if (self.project
											.getProperty(neededDeviceAccess)) {
										alreadyConfigured.add(key);
										break;
									}
								}
								if (!alreadyConfigured.contains(key)) {
									antHelper
											.echo("Info: Cordova.plist contains an undeclared device access permission, which will be removed before deployment: "
													+ key);
									deletePlistKey(self.project, ":Plugins:"
											+ key, plistFile,
											"oepe.ios.delete.plist.result_"
													+ key);
									antHelper
											.echo(self.project
													.getProperty("oepe.ios.delete.plist.result_"
															+ key));
								}
								else {
									// ensure we force the key value to the MAF value
									setPlistKey(project, ":Plugins:"
											+ key, keyToValueMap.get(key), plistFile, "");
								}
							}
						}
					}
				}
			}
		}

		var deviceAccessProperties = self.project
				.getReference("oepe.maf.device.access.propertyset");
		var deviceAccessIt = deviceAccessProperties.getProperties().keySet()
				.iterator();
		while (deviceAccessIt.hasNext()) {
			var deviceAccessProperty = deviceAccessIt.next();
			if (deviceAccessProperties.getProperties()
					.get(deviceAccessProperty))
				// {
				var requiredPermissionSet = deviceAccessToPermissionsMap
						.get(deviceAccessProperty);
			if (requiredPermissionSet == null) {
				// antHelper.echo(deviceAccessProperty);
			} else {
				var requiredPermissionSetIt = requiredPermissionSet.iterator();
				while (requiredPermissionSetIt.hasNext()) {
					var permissionKeyName = requiredPermissionSetIt.next();
					if (!alreadyConfigured.contains(permissionKeyName)) {
						addPlistKey(project, ":Plugins:" + permissionKeyName, keyToValueMap.get(permissionKeyName),
								plistFile, "");
					}
				}
			}
		}
	}

	finally {

	}
};

function invertMapOfStringSets(map) {
	var invertedMap = new java.util.HashMap();
	var it = map.keySet().iterator();
	while (it.hasNext()) {
		var key = it.next();
		var set = map.get(key);
		var setIt = set.iterator();
		while (setIt.hasNext()) {
			var newKey = setIt.next();
			var invertedSet = invertedMap.get(newKey);
			if (invertedSet == null) {
				invertedSet = new java.util.HashSet();
				invertedMap.put(newKey, invertedSet);
			}
			invertedSet.add(key);
		}
	}
	return invertedMap;
};

function readPlistKey(plistBuddy, plistFile, propertyName) {
	var plistBuddy = project.createTask("PlistBuddy_NoXml");

	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("command",
			"Print :Plugins:");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("filename",
			plistFile);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("outputproperty",
			propertyName);
	plistBuddy.perform();
}

function deletePlistKey(project, key, plistFile, propertyName) {
	var plistBuddy = project.createTask("PlistBuddy_NoXml");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("command",
			"Delete " + key);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("filename",
			plistFile);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("outputproperty",
			propertyName);
	plistBuddy.perform();
}

function setPlistKey(project, key, value, plistFile, propertyName)
{
	var plistBuddy = project.createTask("PlistBuddy_NoXml");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("command",
			"Set " + key + " "+value);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("filename",
			plistFile);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("outputproperty",
			propertyName);
	plistBuddy.perform();
}

function addPlistKey(project, key, value, plistFile, propertyName)
{
	var plistBuddy = project.createTask("PlistBuddy_NoXml");
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("command",
			"Add " + key + " "+value);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("filename",
			plistFile);
	plistBuddy.getRuntimeConfigurableWrapper().setAttribute("outputproperty",
			propertyName);
	plistBuddy.perform();
}

