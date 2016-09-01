/*
importClass(java.io.Closeable);
importClass(java.io.File);
importClass(java.io.FileOutputStream);
importClass(java.io.IOException);
importClass(java.io.StringWriter);
importClass(java.util.ArrayList);
importClass(java.util.Collections);
importClass(java.util.HashMap);
importClass(java.util.LinkedHashMap);
importClass(java.util.LinkedHashSet);
importClass(java.util.List);
importClass(java.util.Map);
importClass(java.util.Set);
importClass(java.util.Stack);

importClass(javax.xml.parsers.DocumentBuilder);
importClass(javax.xml.parsers.DocumentBuilderFactory);
importClass(javax.xml.transform.OutputKeys);
importClass(javax.xml.transform.Transformer);
importClass(javax.xml.transform.TransformerFactory);
importClass(javax.xml.transform.TransformerFactoryConfigurationError);
importClass(javax.xml.transform.dom.DOMSource);
importClass(javax.xml.transform.stream.StreamResult);

importClass(org.apache.tools.ant.Project);
importClass(org.apache.tools.ant.Target);
importClass(org.apache.tools.ant.Task);
importClass(org.apache.tools.ant.taskdefs.Copy);
importClass(org.apache.tools.ant.taskdefs.Echo);
importClass(org.w3c.dom.Document);
importClass(org.w3c.dom.Element);
importClass(org.w3c.dom.Node);
importClass(org.w3c.dom.NodeList);
*/

OEPE_ADFMF_STAGING_ADFMF_CONFIG_XML = "oepe.adfmf.staging.adfmf.config.xml";
OEPE_ADFMF_STAGING_ADFMF_SKINS_XML = "oepe.adfmf.staging.adfmf.skins.xml";
OEPE_ADFMF_APPCONTROLLER_PROJECT_PATH = "oepe.adfmf.appcontroller.project.path";
OEPE_MAF_MOBILEALTA_VERSION = "oepe.maf.mobileAlta.version";
OEPE_MAF_MOBILEFUSIONFX_VERSION = "oepe.maf.mobileFusionFx.version";

HYPHEN = "-";
STAR = "*";
EMPTY_STR = "";
FORWARD_SLASH = "/";
ENCODED_DOT = "\\.";
SKIN_FAMILY = "skin-family";
SKIN_VERSION = "skin-version";
TRUE = "true";
PERIOD = ".";
YES = "YES";
NO = "NO";

SKINS_NS = "http://xmlns.oracle.com/adf/mf/skin";
SKINS_NS_PREFIX = "skin";
SKINS_ROOT = "adfmf-skins";
SKINS_XMLSCHEMAFILENAME = "oracle/adfmf/amx/skins/config/adfmf-skins.xsd";
SKIN_METADATAFILENAME = "oracle/adfmf/amx/skins/config/adfmf-skins-metadata.xml";
MOBILE_FUSION_FX = "mobileFusionFx";
MOBILE_ALTA = "mobileAlta";
CSS = "css";
AMX_CSS = "amx.css";
ID_TAG_NAME = "id";
FAMILY_TAG_NAME = "family";
VERSION_TAG_NAME = "version";
VERSION_NAME_TAG_NAME = "name";
VERSION_DEFAULT_TAG_NAME = "default";
EXTENDS_TAG_NAME = "extends";
SKIN_TAG_NAME = "skin";
SKIN_ID_TAG_NAME = "skin-id";
SKIN_ADDITION_TAG_NAME = "skin-addition";
STYLE_SHEET_NAME_TAG_NAME = "style-sheet-name";
STYLE_SHEET_TYPE = "StyleSheet";
//Version strings for the default AMX skin families (i.e. mobileFusionFx
// and mobileAlta).
_SKIN_VERSION_1_0 = "v1.0";
_SKIN_VERSION_1_1 = "v1.1";
_AMX_V1_0_MOBILE_FUSION_FX_CSS_FILE_NAME = "amx-mobileFusionFx-1.0.css";
_AMX_V1_1_MOBILE_FUSION_FX_CSS_FILE_NAME = "amx-mobileFusionFx-1.1.css";
_NO_VERSION = "noversion";
_NO_PLATFORM = "noplatform";
_DEFAULT_VERSION = "defaultversion";
_KEY_SEPERATOR = "__";


processSkins = function() {

	performEcho("Deploying skin files...");

	_copyAdfmfConfigXml();

	_copyAdfmfSkinsXml();

	var adfmfConfigXML = self.getProject().getProperty(
			OEPE_ADFMF_STAGING_ADFMF_CONFIG_XML);
	var adfmfSkinsXML = self.getProject().getProperty(
			OEPE_ADFMF_STAGING_ADFMF_SKINS_XML);
	var appContollerPath = self.getProject().getProperty(
			OEPE_ADFMF_APPCONTROLLER_PROJECT_PATH);

	var adfSkins = new ADFMobileSkins(adfmfConfigXML, adfmfSkinsXML,
			appContollerPath);
	adfSkins._initialize();
	
	performEcho("Started updating maf-skins.xml");
	_updateAdfmfSkinsXml(adfSkins);
	performEcho("Completed updating maf-skins.xml");
	performEcho("Completed deploying skin files");
}

performEcho = function(message) {
	var echoConsole = self.getProject().createTask("echo");
	echoConsole.setMessage(message);
	echoConsole.perform();
}

getNodeListByName = function(rootElement, namespace, name){
	var childNodes = rootElement.getChildNodes();
	var toReturn = new java.util.ArrayList();
	if (childNodes != null) {
		for (var i = 0; i < childNodes.getLength(); i++) {
			var child = childNodes.item(i);
			if (name.equals(child.getNodeName())) {
				toReturn.add(child);
			} 
		}
	}
	return toReturn;
}

function createCopyTask(antProject, owningTarget) {
	var copyTask = antProject.createTask("copy");
	copyTask.setOwningTarget(owningTarget);
	copyTask.setProject(antProject);
	return copyTask;
}

/**
 * Copies the maf-config.xml file from the application location
 * ([appRoot]/.adf/META-INF) to a deployment folder for inclusion in the native
 * application.
 * 
 * @throws java.io.IOException
 *             if the copy operation fails.
 */
function _copyAdfmfConfigXml() {
	var copyTask = createCopyTask(self.getProject(), self.getOwningTarget());

	var dotAdfDir = self.getProject().getProperty(
			"oepe.adfmf.assembly.dotadf.dir.path");
	var appAdfmfConfigUrl = dotAdfDir + "/META-INF/maf-config.xml";
	var sourceFile = new java.io.File(appAdfmfConfigUrl);

	copyTask.setFile(sourceFile);

	var deployAdfmfConfigDir = self.getProject().getProperty(
			"adf.staging.dotadf.dir");
	var deploymentAdfmfConfigDir = new java.io.File(deployAdfmfConfigDir);
	copyTask.setTodir(deploymentAdfmfConfigDir);
	copyTask.setOverwrite(true);
	self.getProject().setProperty(OEPE_ADFMF_STAGING_ADFMF_CONFIG_XML,
			deploymentAdfmfConfigDir + "/maf-config.xml");

	copyTask.perform();
}

/**
 * Copies the maf-skins.xml file from the application location
 * ([appRoot]/ApplicationController/src/META-INF) to a deployment folder for
 * inclusion in the native application.
 * 
 * @throws java.io.IOException
 *             if the copy operation fails.
 */
function _copyAdfmfSkinsXml() {
	var copyTask = createCopyTask(self.getProject(), self.getOwningTarget());

	var appControllerProjectName = self.getProject().getProperty(
			"oepe.adfmf.assembly.appControllerFolder");
	var assemblyProject = self.getProject().getProperty(
			"oepe.adfmf.assembly.project");
	var assemblyProjectDir = new java.io.File(assemblyProject);
	var parentDir = assemblyProjectDir.getParent();
	var appControllerDir = new java.io.File(parentDir, appControllerProjectName);

	self.getProject().setProperty(OEPE_ADFMF_APPCONTROLLER_PROJECT_PATH,
			appControllerDir.getAbsolutePath());

	var sourceFile = new java.io.File(appControllerDir, "src/META-INF/maf-skins.xml");
	copyTask.setFile(sourceFile);

	var buildRootDir = self.getProject().getProperty("adf.build.root.dir");
	var stagingRelPathToFARs = self.getProject().getProperty(
			"oepe.adfmf.staging.relpath.fars");
    
    var applicationController = self.getProject().getProperty("oepe.adfmf.assembly.appControllerFolder");
    var appControllerFarPath = new java.io.File(buildRootDir + "/"
            + stagingRelPathToFARs + "/" + applicationController);

	var deployADFmfSkinsDir = new java.io.File(appControllerFarPath, "META-INF");
	copyTask.setTodir(deployADFmfSkinsDir);
	copyTask.setOverwrite(true);

	self.getProject().setProperty(OEPE_ADFMF_STAGING_ADFMF_SKINS_XML,
			deployADFmfSkinsDir + "/maf-skins.xml");
	copyTask.perform();
}

/**
 * Copies maf-skins.xml to the deployment folder and updates it to contain:
 * 
 * <ul>
 * <li>a /adfmf-skins/skin/family element, if one does not already exist.
 * <li>a /adfmf-skins/skin/id element, if one does not already exist.
 * </ul>
 * 
 * @param adfSkins
 *            contains the skin configuration metadata.
 * @throws Exception
 * @throws DeployException
 *             if an error occurs updating the file.
 */
function _updateAdfmfSkinsXml(adfSkins) {
	// Update the deployed version of maf-skins.xml
	var adfmf_skins_xml = self.getProject().getProperty(
			OEPE_ADFMF_STAGING_ADFMF_SKINS_XML);
	var skinXmlUpdater = new AdfmfSkinsXmlUpdater(adfSkins,
			adfmf_skins_xml);
	skinXmlUpdater.update();
}

function ADFMobileSkins(adfmfConfigXml, adfmfSkinsXML,
		appControllerAbsPath) {

	this._configuredFamily = null;
	this._configuredVersion = null;
	this._skins = new java.util.HashMap();
	this._allSkins = new java.util.HashMap();
	this._skinAdditions = new java.util.HashMap();
	this._orderedSkinIds = new java.util.ArrayList();
	this._adfmfConfigXML = adfmfConfigXml;
	this._adfmfSkinsXML = adfmfSkinsXML;
	this._appContollerAbsoulutePath = appControllerAbsPath;

	/**
	 * Retrieves the configured skin family.
	 * 
	 * @return configured skin family
	 */
	this.getSkinFamily = function() {
		return this._configuredFamily;
	}

	/**
	 * Retrieves a relative path to a default AMX CSS file to use depending on
	 * the current platform and configured skin family and version.
	 * 
	 * @param os
	 *            current platform
	 * @return a relative path to a default AMX CSS file to use, if one can be
	 *         found; empty string otherwise
	 */
	this.getCssFile = function(os) {
		var cssFileName = EMPTY_STR;

		if (_configuredFamily == null || _configuredFamily.isEmpty()) {
			return cssFileName;
		}

		// first determine whether the configured skin is a default skin:
		if (_isDefaultSkin(_configuredFamily, _configuredVersion)) {
			return _getDefaultSkinCssFile(_configuredFamily, _configuredVersion);
		}

		// since we got here, now we know we have a custom skin
		// so search for the skin for the given platform:
		var skin = _getConfiguredSkin(os);

		if (skin == null && os != null && !os.trim().isEmpty()) {
			// since, there is no skin defined for the given platform
			// search for the corresponding skin with no platform now:
			skin = _getConfiguredSkin(EMPTY_STR);
		}

		// find the base skin id:
		if (skin != null) {
			var parentId = skin.getSkinParent();
			var lastValidParentId = null;

			while (parentId != null && !parentId.isEmpty()) {
				lastValidParentId = parentId;

				if (this._allSkins.containsKey(parentId)) {
					var parentSkin = this._allSkins.get(parentId);
					parentId = parentSkin.getSkinParent();
				} else {
					break;
				}
			}

			// now check the last parent id as it's the id of the base skin (if
			// not null):
			if (lastValidParentId != null
					&& !lastValidParentId.trim().isEmpty()) {
				// determine what the base skin is:
				// first check if the base skin id contains a version as well
				var splitIdParts = lastValidParentId.trim().split(
						HYPHEN);
				var skinFamily = splitIdParts[0];
				var skinVersion = null;

				if (splitIdParts.length > 1) {
					skinVersion = splitIdParts[1];
				}

				if (_isDefaultSkin(skinFamily, skinVersion)) {
					return _getDefaultSkinCssFile(skinFamily, skinVersion);
				}
			}
		}

		return cssFileName;
	}

	/**
	 * Creates and returns a stack of stylesheets for the passed in model. The
	 * associated stylesheets are retrieved from the skinning configuration.
	 * Each skin can have a hierarchy of skins associated with it, this method
	 * determines the hierarchy by using the extends attribute of the skin that
	 * is stored as parent in inner class <code>ADFMobileSkin</code>. The
	 * applicable stylesheets are added to a stack in the following order 1)
	 * Identify the skin id for the passed in model 2) Check if there is a
	 * skin-addition defined for the model skin identified in step 1, if a skin
	 * addition is found then add the stylesheet to the stack 3) if there is a
	 * stylesheet defined for the model skin identified in step 1, add the
	 * stylesheet to the stack 4) Go through all the ancestors of the model
	 * skin, and add the stylesheets defined in skin-addition and skins to the
	 * stack
	 * 
	 * The stylesheets are added to a stack so that they can be retrieved as
	 * last in first out to correctly maintain the precedence of skins.
	 * 
	 * @param model
	 *            device model
	 * @param os
	 *            device os/platform
	 * @return stack of stylesheeets applicable to the passed in model
	 */
	this.getSkinStylesheets = function(model, os) {
		var stylesheets = new java.util.Stack();
		var mobileSkin = null;

		// try to find the applicable skin for the model, only when device model
		// is specified.
		if (model != null && !model.isEmpty()) {
			mobileSkin = this._getConfiguredSkin(model);
		}

		if (mobileSkin == null) {
			// If skin not found for the model or model is not specified,
			// try to find applicable skin for the underlying os
			mobileSkin = this._getConfiguredSkin(os);
		}

		if (mobileSkin == null) {
			// If skin not found for the OS, try to find applicable skin for
			// null platform
			mobileSkin = this._getConfiguredSkin(null);
		}

		if (mobileSkin == null) {
			// No applicable skin is found, return empty set of stylesheets
			return stylesheets;
		}

		var skinId = mobileSkin.getSkinId();

		if (this._skinAdditions.containsKey(skinId)) {
			var skinAddition = this._skinAdditions.get(skinId);

			if (skinAddition.getSkinStylesheet() != null) {
				stylesheets.push(skinAddition.getSkinStylesheet());
			}
		}

		if (mobileSkin.getSkinStylesheet() != null) {
			stylesheets.push(mobileSkin.getSkinStylesheet());
		}

		// go through all ancestors
		var currentSkinId = mobileSkin.getSkinParent();

		while (currentSkinId != null) {
			if (this._skinAdditions.containsKey(currentSkinId)) {
				var skinAddition = this._skinAdditions.get(currentSkinId);

				if (skinAddition.getSkinStylesheet() != null) {
					stylesheets.push(skinAddition.getSkinStylesheet());
				}
			}

			if (this._allSkins.containsKey(currentSkinId)) {
				var currentSkin = this._allSkins.get(currentSkinId);

				if (currentSkin.getSkinStylesheet() != null) {
					stylesheets.push(currentSkin.getSkinStylesheet());
				}

				currentSkinId = currentSkin.getSkinParent();
			} else {
				// log an error, if skinId does not exist in the list of all
				// skin definitions
				// _logger.log(Level.SEVERE, MobileResourceUtils.getMsg(
				// LogMessageBundle.SKIN_ID_NOT_FOUND, currentSkinId));
				break;
			}
		}

		return stylesheets;
	}

	/**
	 * Initialize the skinning configuration.
	 */
	this._initialize = function() {
		this._parseAdfMfConfig();
		this._parseAdfMfSkins();
		this._addDefaultSkinIds();
	}

	/**
	 * Parses the skinning configuration from maf-config.xml.
	 */
	this._parseAdfMfConfig = function() {

		if (this._adfmfConfigXML == null) {
			throw "maf-config.xml cannot be found";
		}

		var dbFactory = javax.xml.parsers.DocumentBuilderFactory.newInstance();

		try {
			var dBuilder = dbFactory.newDocumentBuilder();
			var doc = dBuilder.parse(this._adfmfConfigXML);

			var rootElement = doc.getDocumentElement();
			rootElement.normalize();
			var childNodes = rootElement.getChildNodes();

			if (childNodes != null) {
				for (var i = 0; i < childNodes.getLength(); i++) {
					var child = childNodes.item(i);

					if (SKIN_FAMILY.equals(child
							.getNodeName())) {
						this._configuredFamily = child.getTextContent();
					} else if (SKIN_VERSION.equals(child
							.getNodeName())) {
						this._configuredVersion = child.getTextContent();
					}
				}
			}
		} finally {
		}
		performEcho("The configured skin family is "+ this._configuredFamily);
		performEcho("The configured skin version is "+ this._configuredVersion);

	}

	/**
	 * Parses the skinning configuration from maf-skins.xml.
	 */
	this._parseAdfMfSkins = function() {
		if (this._adfmfSkinsXML == null) {
			throw "maf-skins.xml cannot be found";
		}
		var dbFactory = javax.xml.parsers.DocumentBuilderFactory.newInstance();

		try {
			var dBuilder = dbFactory.newDocumentBuilder();
			var doc = dBuilder.parse(this._adfmfSkinsXML);

			var rootElement = doc.getDocumentElement();
			var childNodes = rootElement.getChildNodes();

			if (childNodes != null) {
				for (var i = 0; i < childNodes.getLength(); i++) {
					var child = childNodes.item(i);

					if (SKIN_TAG_NAME.equals(child
							.getNodeName())) {
						var skinNodes = child.getChildNodes();

						if (skinNodes != null) {
							var skin = new ADFMobileSkin();

							for (var index = 0; index < skinNodes.getLength(); index++) {
								var skinChild = skinNodes.item(index);

								if (ID_TAG_NAME
										.equals(skinChild.getNodeName())) {
									skin.setSkinId(skinChild.getTextContent());
								} else if (FAMILY_TAG_NAME
										.equals(skinChild.getNodeName())) {
									skin.setSkinFamily(skinChild
											.getTextContent());
								} else if (EXTENDS_TAG_NAME
										.equals(skinChild.getNodeName())) {
									skin.setSkinParent(skinChild
											.getTextContent());
								} else if (VERSION_TAG_NAME
										.equals(skinChild.getNodeName())) {
									var versionNodes = skinChild
											.getChildNodes();

									for (var vi = 0; vi < versionNodes
											.getLength(); vi++) {
										var versionChild = versionNodes
												.item(vi);

										if (VERSION_NAME_TAG_NAME
												.equals(versionChild
														.getNodeName())) {
											skin.setSkinVersion(versionChild
													.getTextContent());
										} else if (VERSION_DEFAULT_TAG_NAME
												.equals(versionChild
														.getNodeName())) {
											skin
													.setIsDefaultVersion(versionChild
															.getTextContent()
															.equalsIgnoreCase(
																	TRUE));
										}
									}
								} else if (STYLE_SHEET_NAME_TAG_NAME
										.equals(skinChild.getNodeName())) {
									skin
											.setSkinStylesheet(this._addAppControllerHtmlFolderPrefix(skinChild
													.getTextContent()));
								}
							}

							this._addSkin(skin);
						}
					} else if (SKIN_ADDITION_TAG_NAME
							.equals(child.getNodeName())) {
						var skinAdditionNodes = child.getChildNodes();

						if (skinAdditionNodes != null) {
							var skinAddition = new ADFMobileSkinAddition();

							for (var index = 0; index < skinAdditionNodes
									.getLength(); index++) {
								var skinAdditionChild = skinAdditionNodes
										.item(index);

								if (SKIN_ID_TAG_NAME
										.equals(skinAdditionChild.getNodeName())) {
									skinAddition.setSkinId(skinAdditionChild
											.getTextContent());
								} else if (STYLE_SHEET_NAME_TAG_NAME
										.equals(skinAdditionChild.getNodeName())) {
									skinAddition
											.setSkinStylesheet(this._addAppControllerHtmlFolderPrefix(skinAdditionChild
													.getTextContent()));
								}
							}

							this._skinAdditions.put(skinAddition.getSkinId(),
									skinAddition);
						}
					}
				}
			}
		} finally {
		}
	}

	/**
	 * Returns the absolute path of the stylesheeet by adding the public_html
	 * location of Application Controller project, as that is where the skinning
	 * stylesheets are defined.
	 * 
	 * @param file
	 *            relative path of the stylesheet
	 * @return absolute path of the file passed in
	 */
	this._addAppControllerHtmlFolderPrefix = function(file) {
		// Return the path of ViewContent folder from ApplicationContoller
		// project.
		if (this._appContollerAbsoulutePath != null) {
			return this._appContollerAbsoulutePath + "/ViewContent/" + file;
		}
		return null;
	}

	/**
	 * Adds the passed in skin to the skins map.
	 * 
	 * @param skin
	 *            skin to be added
	 */
	this._addSkin = function(skin) {
		var family = skin.getSkinFamily();
		var version = skin.getSkinVersion();

		if (version == null) {
			version = _NO_VERSION;
		}

		var platform = skin.getSkinPlatform();

		if (platform == null) {
			platform = _NO_PLATFORM;
		}

		var familySkins = this._skins.get(family);

		if (familySkins == null) {
			familySkins = new java.util.HashMap();
			this._skins.put(family, familySkins);
		}

		var platformVersionKey = platform + _KEY_SEPERATOR + version;

		if (!familySkins.containsKey(platformVersionKey)) {
			// in case multiple skins defined, only use the first occurence
			familySkins.put(platformVersionKey, skin);
		}

		// A skin could be defined as default version,
		// so skin should also be added wtih default version key
		var platformDefVersionKey = platform + _KEY_SEPERATOR
				+ _DEFAULT_VERSION;

		if (skin.getIsDefaultVersion()
				&& !familySkins.containsKey(platformDefVersionKey)) {
			familySkins.put(platformDefVersionKey, skin);
		}

		var skinId = skin.getSkinId();

		if (!this._allSkins.containsKey(skinId)) {
			this._allSkins.put(skinId, skin);
		}

		this._orderedSkinIds.add(skinId);
	}

	/**
	 * Determines if the passed in skin is available in the skins map.
	 * 
	 * @param skinId
	 *            skin id
	 * @param family
	 *            family of the skin
	 * @return true of the passed in skin is found in the skin map, false
	 *         otherwise
	 */
	this._skinExists = function(skinId, family) {
		var familySkins = this._skins.get(family);

		if (familySkins == null) {
			return false;
		}

		return familySkins.containsKey(skinId);
	}

	/**
	 * Creaes a skin id as per the passed in parent and skin name.
	 * 
	 * @param parent
	 *            skin id of the top ancestor
	 * @param skinName
	 *            name of the skin
	 * @return skin id
	 */
	this._createSkinId = function(parent, skinName) {
		if (parent == null) {
			return skinName;
		}

		return parent + PERIOD + skinName;
	}

	/**
	 * Adds the default skin ids for the passed in platform. These skins ids are
	 * created as per the models defined in form factor preferences for the
	 * passed in platform. The skin ids are needed to complete the default skin
	 * configuration.
	 * 
	 * @param platform
	 *            device platform
	 * @param skinFamilyName
	 *            name of the skin family
	 */
	this._addDefaultFamilySkins = function(platform, skinFamilyName) {
		var family = this._createSkinId(null, skinFamilyName);
		var familySkinId = family;

		// Add the family name as skin id
		if (!this._skinExists(familySkinId, family)) {
			var skin = new ADFMobileSkin(familySkinId);
			skin.setSkinFamily(family);
			this._addSkin(skin);
		}

		// Add platform skin id
		var platformSkinId = this._createSkinId(skinFamilyName, platform);

		if (!this._skinExists(platformSkinId, family)) {
			var skin = new ADFMobileSkin(platformSkinId);
			skin.setSkinFamily(family);
			skin.setSkinParent(familySkinId);
			this._addSkin(skin);
		}

		// Add all skin id's identified by each of the platform models
		for (var i = 0; i < FormFactorsConstants.getPlatformModels(platform).length; i++) {
			var model = FormFactorsConstants.getPlatformModels(platform)[i];
			var modelSkinId = this._createSkinId(familySkinId, model);

			if (!this._skinExists(modelSkinId, family)) {
				var skin = new ADFMobileSkin(modelSkinId);
				skin.setSkinFamily(family);
				skin.setSkinParent(platformSkinId);
				this._addSkin(skin);
			}
		}

	}

	/**
	 * Adds all the default skins ids for all paltforms defined in form factor
	 * preferences.
	 */
	this._addDefaultSkinIds = function() {
		var supportedFamilies = this._getAllSupportedSkinFamilies();

		for (var j = 0; j < supportedFamilies.size(); j++) {
			var supportedFamily = supportedFamilies.get(j);
			for (var i = 0; i < FormFactorsConstants.getPlatforms().length; i++) {
				var platform = FormFactorsConstants.getPlatforms()[i];
				this._addDefaultFamilySkins(platform, supportedFamily);
			}
		}

	}

	/**
	 * Retrieves a list of all supported skin families.
	 * 
	 * @return list of all supported skin families
	 */
	this._getAllSupportedSkinFamilies = function() {
		var skinConfiguration = AmxSkinConfiguration.getInstance();
		var allSupportedFamilies = new java.util.ArrayList();

		var skinFamilies = skinConfiguration.getSupportedSkinFamilies();

		for (var j = 0; j < skinFamilies.size(); j++) {
			var skinFamily = skinFamilies.get(j);
			allSupportedFamilies.add(skinFamily);

			// now get all supported versions of the current skin family:
			var versions = skinConfiguration.getSkinFamily(skinFamily)
					.getSupportedVersions(skinFamily);

			for (var i = 0; i < versions.size(); i++) {
				var version = versions.get(i);
				allSupportedFamilies.add(skinFamily + HYPHEN
						+ version);
			}

		}

		return allSupportedFamilies;
	}

	/**
	 * Returns the skin element that is configured for the passed in platform,
	 * in case not found a null is returned.
	 * 
	 * @param platform
	 *            device platform/model
	 * @return skin matching the passed in platform with the set configuration
	 */
	this._getConfiguredSkin = function(platform) {
		var skins = this._skins.get(_configuredFamily);
		var mobileSkin = null;

		if (platform == null || platform.trim().isEmpty()) {
			platform = _NO_PLATFORM;
		}

		// initialize the version variable to no default version
		var defaultVersion = _DEFAULT_VERSION;

		if (_configuredVersion != null) {
			// if version is set in maf-config.xml,
			// look for that specific version for the passed in platform
			defaultVersion = _configuredVersion;
		}

		if (skins != null && !skins.isEmpty()) {
			mobileSkin = skins.get(platform + _KEY_SEPERATOR + defaultVersion);
		}

		// in case version is not set in maf-config.xml and no skin found
		// look for the first skin defined for the passed in platform
		if (_DEFAULT_VERSION.equals(defaultVersion) && mobileSkin == null) {

			for (var i = 0; i < _orderedSkinsIds.size(); i++) {
				var skinId = _orderedSkinsIds.get(i);
				if (skinId.endsWith(platform)) {
					var skin = _allSkins.get(skinId);

					if (_configuredFamily.equals(skin.getSkinFamily())) {
						return skin;
					}
				}
			}
		}

		return mobileSkin;
	}

	/**
	 * Determines whether the given skin family and version define one of the
	 * supported default skins.
	 * 
	 * @param family
	 *            a skin family name
	 * @param version
	 *            version of the skin
	 * @return true if the given skin family and version define one of the
	 *         supported default skins; false otherwise
	 */
	this._isDefaultSkin = function(family, version) {
		var skinConfig = AmxSkinConfiguration.getInstance();

		if (skinConfig.supportsFamily(family)) {
			var skinFamily = skinConfig.getSkinFamily(family);
			if (version != null) {
				return skinFamily.supportsVersion(version);
			}
			return true;
		}

		return false;
	}

	/**
	 * Retrieves a relative path to the location of the AMX CSS skin file.
	 * 
	 * @param family
	 *            a skin family name
	 * @param version
	 *            version of the skin
	 * @return a relative path to the location of the AMX CSS skin file or empty
	 *         string if no valid CSS can be found
	 */
	this._getDefaultSkinCssFile = function(family, version) {
		var skinFamily = AmxSkinConfiguration.getInstance().getSkinFamily(
				family);

		if (skinFamily == null) {
			return EMPTY_STR;
		}

		var skinInfo = null;

		if (version != null) {
			skinInfo = skinFamily.getSkinInfo(family, version);
		} else {
			skinInfo = skinFamily.getSkinInfo(family, skinFamily
					.getDefaultVersion(family));
		}

		if (skinInfo != null) {
			return skinInfo.getCssFileRelativePath();
		}

		return EMPTY_STR;
	}
}

function AdfmfSkinsXmlUpdater(adfSkins, adfmfSkinsXmlUrl) {
	// URL to the location of the deployed maf-skins.xml
	this._adfmfSkinsXmlUrl = adfmfSkinsXmlUrl;

	// Contains the skin configuration metadata.
	this._adfSkins = adfSkins;

	this.update = function() {
		var builder = javax.xml.parsers.DocumentBuilderFactory.newInstance().newDocumentBuilder();
		var adfmfSkinsDoc = builder.parse(this._adfmfSkinsXmlUrl);
		
		//Following call to add default skin element is not needed as of m3-13 build
		//this._findOrCreateSkinElement(adfmfSkinsDoc);
		
		this.updateSkinAdditionIds(adfmfSkinsDoc);
		this.writeXmlFile(adfmfSkinsDoc, this._adfmfSkinsXmlUrl);
	};

	this.writeXmlFile = function(document, destinationUrl) {
		var xmlContent = this.toXmlString(document);
		this.writeStringToFile(xmlContent, destinationUrl);
	};

	this.writeStringToFile = function(content, fileUri) {
		var file = new java.io.File(fileUri);

		// Specify to write bytes at the beginning of the file,
		// so any existing file content will be overwritten.
		var APPEND_OPTION = false;

		// Can throw FileNotFoundException, which is a type of IOException, that
		// the caller can catch.
		var outputStream = new java.io.FileOutputStream(file, APPEND_OPTION);
		try {
			var bytes = content.getBytes(); 
            outputStream.write(bytes, 0, bytes.length); 
        } finally {
			// This call suppresses a checked exception, if thrown by
			// outputStream.close(),
			// to allow an exception thrown by outputStream.write() to propagate
			// to the caller.
			this.closeStream(outputStream);
		}
	};

	this.closeStream = function(closeable) {
		if (null != closeable) {
			closeable.close();
		}
	};
	/**
	 * Converts a {@link Document} object to an XML representation contained in
	 * a {@link String} object.
	 * 
	 * @param doc
	 *            is a {@link Document} object that will be converted to XML.
	 * @return a {@link String} that contains XML.
	 * @throws Exception
	 *             if an unrecoverable error occurs during the transformation.
	 */
	this.toXmlString = function(doc) {
		var stringWriter = new java.io.StringWriter();

		var transformerFactory = null;

		transformerFactory = javax.xml.transform.TransformerFactory.newInstance();

		var transformer = transformerFactory.newTransformer();
		transformer.setOutputProperty(javax.xml.transform.OutputKeys.OMIT_XML_DECLARATION,
				NO.toLowerCase());
		transformer.setOutputProperty(javax.xml.transform.OutputKeys.INDENT, YES
				.toLowerCase());

		var result = new javax.xml.transform.stream.StreamResult(stringWriter);
		var source = new javax.xml.transform.dom.DOMSource(doc);
		transformer.transform(source, result);

		return stringWriter.toString();
	};
	/**
	 * Finds the /adfmf-skins/skin element in the document (or creates a new one
	 * if it doesn't exist).
	 * 
	 * @param adfmfSkinsDoc
	 *            The <CODE>Document</CODE> root to create the
	 *            /adfmf-skins/skin element if one doesn't exist.
	 * @return A /adfmf-skins/skin element.
	 */
	this._findOrCreateSkinElement = function(adfmfSkinsDoc) {
		var skinElement = this._getSkinElement(adfmfSkinsDoc);
		if (null == skinElement) {
			// create a new <skin> element
			skinElement = this._createSkinElement(adfmfSkinsDoc);
		}
		return skinElement;
	}
	

	/**
	 * Method reads all the skin-addition tags and try to append the default
	 * version if missing
	 */
	this.updateSkinAdditionIds = function(adfmfSkinsDoc){
		var docElem = adfmfSkinsDoc.getDocumentElement();
		var skinAdditions = this._getSkinAdditionList(docElem);

		var count = 0;
		if (skinAdditions != null) {
			count = skinAdditions.size();
			if(count > 0){
				performEcho("Updating skin additions");
			}
		}

		for (var i = 0; i < count; i++) {
			var currSkinAddition = skinAdditions.get(i);
			var skinAdditionNodes = currSkinAddition.getChildNodes();
			var idElement = null;

			for (var index = 0; index < skinAdditionNodes.getLength(); index++) {
				var skinAdditionChild = skinAdditionNodes.item(index);

				if (SKIN_ID_TAG_NAME.equals(skinAdditionChild.getNodeName())) {
					idElement = skinAdditionChild;
					break;
				}
			}
			
			if(idElement == null){
				//Id element is not present so return
				continue;
			}
			
			var currSkinId = idElement.getTextContent();
			var skinFamily = AmxSkinConfiguration.getInstance().getSkinFamily(currSkinId);

			if (skinFamily == null) {
				//Either the version is already added or the currSkinId is not valid
				performEcho("Skipping for "+ currSkinId);
				continue;
			}
			var	defaultVersion = skinFamily.getDefaultVersion(currSkinId);
			performEcho("Appending "+ defaultVersion + " for skin-id " + currSkinId);
			
			currSkinId = currSkinId + "-" + defaultVersion;
			idElement.setTextContent(currSkinId);
		}
	}
	
	//
	/**
	 * Creates a new /skin element having the given <CODE>familyElem</CODE>
	 * and <CODE>idElem</CODE> child elements.
	 * 
	 * @param xmlDoc
	 *            the maf-skins.xml <CODE>Document</CODE>.
	 * @param familyElement
	 *            a child /adfmf-skins/skin/family element
	 * @param idElem
	 *            a child /adfmf-skins/skin/id element
	 * 
	 * @return a newly created /skin element with /family and /id child
	 *         elements.
	 */
	this._createSkinElement1 = function(xmlDoc, familyElem, idElem) {
		var skinElem = xmlDoc.createElementNS(SKINS_NS,
				SKIN_TAG_NAME);

		skinElem.appendChild(familyElem);
		skinElem.appendChild(idElem);

		return skinElem;
	}

	/**
	 * Creates a new /adfmf-skins/skin element for the document. The element
	 * contains the following child elements:
	 * <ul>
	 * <li>/family - specifies the skin family
	 * <li>/id - identifier for the skin fmaily.
	 * </ul>
	 * 
	 * @param xmlDocument
	 *            The <CODE>Document</CODE> root to create the
	 *            <CODE>Element</CODE> from
	 * @return A new /adfmf-skins/skin element
	 */
	this._createSkinElement = function(xmlDocument) {
		var familyElem = this._createFamilyElement(xmlDocument);

		var idElem = this._createIdElement(xmlDocument);

		var skinElem = this._createSkinElement1(xmlDocument, familyElem, idElem);

		var docElem = xmlDocument.getDocumentElement();

		// Have to append the new <skin> element after the last <skin> element
		// (if any exist).
		// Otherwise, appending to the end may cause the transaction commit to
		// fail if the document
		// has any number of <skin> elements followed by a <skin-addition>
		// element because appending
		// a new <skin> to the end would result in a invalid document. Doing the
		// update of the file
		// w/o using a transaction does not capture the error.

		var skinAdditions = this._getSkinAdditionList(docElem);
		var additionsCount = 0;
		if(skinAdditions != null){
			additionsCount = skinAdditions.size();
		}
		
		if (additionsCount > 0) {
			docElem.insertBefore(skinElem, skinAdditions.get(0));
		} else {
			docElem.appendChild(skinElem);
		}

		return skinElem;
	}

	/**
	 * @param xmlDoc
	 *            the maf-skins.xml <CODE>Document</CODE>.
	 * 
	 * @return a newly created /id element
	 */
	this._createIdElement = function(xmlDoc) {
		var idElem = xmlDoc.createElementNS(SKINS_NS,
				ID_TAG_NAME);

		var skinFamily = this._adfSkins.getSkinFamily();

		idElem.setTextContent(skinFamily);

		return idElem;
	};

	/**
	 * @param xmlDoc
	 *            the maf-skins.xml <CODE>Document</CODE>.
	 * 
	 * @return a newly created /adfmf-skins/skin/family element
	 */
	this._createFamilyElement = function(xmlDoc) {
		var familyElem = xmlDoc.createElementNS(
				SKINS_NS,
				FAMILY_TAG_NAME);

		var skinFamily = this._adfSkins.getSkinFamily();

		familyElem.setTextContent(skinFamily);

		return familyElem;
	};

	/**
	 * @param adfmfSkinsDoc
	 *            The maf-skins.xml <CODE>Document</CODE> to locate the
	 *            /adfmf-skins/skin element
	 * @return The /adfmf-skins/skin element, if it exists. Otherwise, null is
	 *         returned.
	 */
	this._getSkinElement = function(adfmfSkinsDoc) {
		var skinElement;
		var configuredSkinFamily = this._adfSkins.getSkinFamily();
		var docElem = adfmfSkinsDoc.getDocumentElement();
		var skins = this._getSkinNodeList(docElem);

		var count = 0;
		if (skins != null) {
			count = skins.size();
		}

		for (var i = 0; i < count; i++) {
			var currSkinElement = skins.get(i);

			var idList = this._getIdNodeList(currSkinElement);

			var idElement = null;
			if(idList.size() > 0){
				idElement = idList.get(0);
			}

			var currSkinId = idElement.getTextContent();

			if (currSkinId.equals(configuredSkinFamily)) {
				// this is the skin element to add default skins to
				skinElement = currSkinElement;
				break;
			}
		}

		return skinElement;
	};
	/**
	 * Obtains a list of 'skin-addition' type elements from the given
	 * <CODE>element</CODE>
	 * 
	 * @param adfmfSkinsElem
	 *            a /adfmf-skins element
	 * @return a <CODE>NodeList</CODE> of skin child nodes of the type
	 *         'skin-addition'
	 */
	this._getSkinAdditionList = function(adfmfSkinsElem) {
		return getNodeListByName(adfmfSkinsElem, SKINS_NS, SKIN_ADDITION_TAG_NAME);
	};

	/**
	 * Obtains a list of /adfmf-skins/skin elements from maf-skins.xml
	 * 
	 * @param adfmfSkinsElem
	 *            a /adfmf-skins element
	 * @return a <CODE>NodeList</CODE> of skin child nodes of the given
	 *         <CODE>adfmfSkinsElem</CODE>
	 */
	this._getSkinNodeList = function(adfmfSkinsElem) {
		return getNodeListByName(adfmfSkinsElem, SKINS_NS, SKIN_TAG_NAME);
	};

	/**
	 * Obtains a list of /adfmf-skins/skin/id elemetns from maf-skins.xml
	 * 
	 * @param skinElem
	 *            a /adfmf-skins/skin element
	 * @return a <CODE>NodeList</CODE> of id child nodes of the given
	 *         <CODE>skinElem</CODE>
	 */
	this._getIdNodeList = function(skinElem) {
		return getNodeListByName(skinElem, SKINS_NS, ID_TAG_NAME);
	}

}


/**
 * Returns <CODE>true</CODE> if the specified {@link String} is not
 * <CODE>null</CODE> and has a length greater than zero. This is a very
 * frequently occurring check.
 */
ModelUtil.hasLength = function(cs) {
	return (cs != null && cs.length > 0);
}

function ModelUtil() {
}



FormFactorsConstants.IOS = "iOS";
FormFactorsConstants.ANDROID = "Android";
FormFactorsConstants.IPHONE = "iPhone";
FormFactorsConstants.IPAD = "iPad";
FormFactorsConstants.PLATFORMS = [ FormFactorsConstants.IOS, FormFactorsConstants.ANDROID ];
FormFactorsConstants.PLATFORM_MODELS = null;
/**
 * Returns all the models for the passed in platform
 * 
 * @param platform
 *            name of the platform
 * @return array of supported models
 */
FormFactorsConstants.getPlatformModels = function(platform) {
	if (FormFactorsConstants.PLATFORM_MODELS == null) {
		var platformModelsMap = new java.util.HashMap();
		platformModelsMap.put(FormFactorsConstants.IOS, [ FormFactorsConstants.IPAD, FormFactorsConstants.IPHONE ]);
		FormFactorsConstants.PLATFORM_MODELS = java.util.Collections.unmodifiableMap(platformModelsMap);
	}

	if (FormFactorsConstants.PLATFORM_MODELS.containsKey(platform)) {
		return FormFactorsConstants.PLATFORM_MODELS.get(platform);
	}
	return [];
};

/**
 * Returns list of supported platforms
 * 
 * @return array of supported platforms
 */
FormFactorsConstants.getPlatforms = function() {
	return FormFactorsConstants.PLATFORMS;
}

function FormFactorsConstants() {
}

/**
 * Creates an instance of <CODE>AmxSkinFamily</CODE>
 * 
 * @param familyName
 *            name of the skin family
 * @param skins
 *            a set of <CODE>AmxSkinInfo</CODE> elements where each
 *            element contains version- specific skin configuration.
 * @return a <CODE>AmxSkinFamily</CODE> instance.
 */
AmxSkinFamily.newInstance = function(familyName, skins) {
	var toReturn = new AmxSkinFamily(familyName, skins);
	toReturn.init(skins);
	return toReturn;
}

function AmxSkinFamily(familyName, skins) {
	// Name of the skin family
	this._familyName = familyName;

	// Maps of skins belonging to this family. Key's to the map is a
	// concatenation of
	// the skin id and version.
	this._skinsMap = new java.util.LinkedHashMap();

	/**
	 * Constructs a <CODE>AmxSkinFamily</CODE>
	 * 
	 * @param familyName
	 *            name of the skin family
	 * @param skins
	 *            set of <CODE>AmxSkinInfo</CODE> elements. Each element
	 *            represents a different version.
	 */
	this.init = function(skins) {
		var itr = skins.iterator();
		while (itr.hasNext()) {
			var currInfo = itr.next();
			var key = this._createMapKey(currInfo.getId(), currInfo.getVersion());
			this._skinsMap.put(key, currInfo);
		}
	}
	
	/**
	 * @param skinId
	 *            the identifier of the skin whose default version is to be
	 *            obtained.
	 * @return the default version for the given skin in this skin family.
	 */
	this.getDefaultVersion = function(skinId) {
		var version = EMPTY_STR;
		
		if(MOBILE_ALTA.equals(skinId)){
			version = self.getProject().getProperty(OEPE_MAF_MOBILEALTA_VERSION);
			return version;
		} else if(MOBILE_FUSION_FX.equals(skinId)){
			version = self.getProject().getProperty(OEPE_MAF_MOBILEFUSIONFX_VERSION);
			return version;
		}
		
		var firstSkinInfo = null;
		var itr = this._skinsMap.keySet().iterator();
		while (itr.hasNext()) {
			var currEntry = itr.next();
			var currInfo = this._skinsMap.get(currEntry);
			if (currInfo.getId().equals(skinId)) {
				if (null == firstSkinInfo) {
					firstSkinInfo = currInfo;
				}

				if (currInfo.isDefaultVersion()) {
					version = currInfo.getVersion();
					break;
				}
			}
		}

		// Return the default version. If it is empty, the user user didn't
		// specifiy a version
		// as being the default for the skin. In this case, use the first
		// defined skin version.
		if (!ModelUtil.hasLength(version) && null != firstSkinInfo) {
			version = firstSkinInfo.getVersion();
		}

		return version;
	}

	/**
	 * @param skinId
	 *            the identifier of the skin to obtain
	 * @param version
	 *            the version of the skin to obtain
	 * @return a <CODE>AmxSkinInfo</CODE> for the given <CODE>skinId</CODE>
	 *         having the given <CODE>version</CODE> in this family.
	 */
	this.getSkinInfo = function(skinId, version) {
		var mapKey = _createMapKey(skinId, version);
		if (!this._skinsMap.containsKey(mapKey)) {
			// See if any of the skins support the given version. If so, return
			// the first one found.
			var itr = this._skinsMap.keySet().iterator();
			while (itr.hasNext()) {
				var currEntry = itr.next();
				var currInfo = this._skinsMap.get(currEntry);
				if (currInfo.getVersion().equals(version)) {
					return currInfo;
				}
			}
			return null;
		}
		return this._skinsMap.get(mapKey);
	}
	/**
	 * @return name of this skin family.
	 */
	this.getFamilyName = function() {
		return this._familyName;
	}

	/**
	 * @param skinId
	 *            the id of the skin in this family whose versions are to be
	 *            obtained
	 * @return a list containing the supported versions of this AMX skin family.
	 */
	this.getSupportedVersions = function(skinId) {
		var supportedVersions = new java.util.ArrayList();

		var itr = this._skinsMap.keySet().iterator();
		while (itr.hasNext()) {
			var key = itr.next();
			var currInfo = this._skinsMap.get(key);
			if (currInfo.getId().equals(skinId)) {
				var version = currInfo.getVersion();
				if (version != null) {
					supportedVersions.add(currInfo.getVersion());
				}
			}
		}
		return supportedVersions;
	}
	/**
	 * @param version
	 *            the version of the skin to test
	 * @return true if this skin family supports a skin having the given
	 *         <CODE>skinId</CODE> and <CODE>version</CODE>.
	 */
	this.supportsVersion = function(version)
	{
		var itr = this._skinsMap.values().iterator();
		while (itr.hasNext()) {
			var currSkin = itr.next();
			if (currSkin.getVersion().equals(version)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @return the set of <CODE>AmxSkinInfo</CODE> associated with this
	 *         family.
	 */
	this.getSkins = function() {
		return new java.util.LinkedHashSet(this._skinsMap.values());
	}

	/**
	 * @param skinId
	 *            the identifier of the skin to test
	 * @param version
	 *            the version of the skin to test
	 * @return a map key to use to gain access to a <CODE>AmxSkinInfo</CODE>
	 */
	this._createMapKey = function(skinId, version) {
		return skinId + STAR + version;
	}
}

/**
 * Creates an instance of <CODE>AmxSkinInfo</CODE>
 * 
 * @param id
 *            id of the skin.
 * @param parentSkinName
 *            of the skin if this skin extends another one.
 * @param version
 *            version of the AMX Skin.
 * @param cssFileName
 *            name of the AMX stylesheet.
 * @param isDefaultVersion
 *            true if the given <CODE>version</CODE> is the default
 *            version.
 * @return a <CODE>AmxSkinInfo</CODE> instance.
 */
AmxSkinInfo.newInstance = function(id, parentSkinName, version, cssFileName,
		isDefaultVersion) {
	var toReturn = new AmxSkinInfo(id, parentSkinName, version, cssFileName,
			isDefaultVersion);
	toReturn.init(cssFileName);
	return toReturn;
}

function AmxSkinInfo(id, parentSkinName, version, cssFileName,
		isDefaultVersion) {
	// Skin version
	this._version = version;

	// Name of the css file
	this._cssFileName = cssFileName;

	// Relative path of the css file.
	this._cssRelativePath = null;

	// Whether or not the instance represents the default version.
	this._isDefaultVersion = isDefaultVersion;

	// The id of the skin
	this._id = id;

	// The parent skin name if this skin extends another one.
	this._parentSkinName = parentSkinName;

	/**
	 * Constructor.
	 * 
	 * @param version
	 *            version of the AMX skin.
	 * @param cssFileName
	 *            name of the AMX skin style sheet.
	 */
	this.init = function(cssFileName) {
		if (ModelUtil.hasLength(cssFileName)) {
			this._cssRelativePath = CSS + FORWARD_SLASH
					+ cssFileName;
		} else {
			this._cssRelativePath = EMPTY_STR;
		}
	}

	/**
	 * @return a relative path to the location of the AMX CSS skin file.
	 */
	this.getCssFileRelativePath = function() {
		return this._cssRelativePath;
	}

	/**
	 * @return the version of the AMX skin.
	 */
	this.getVersion = function() {
		return this._version;
	}

	/**
	 * @return true if this skin is the default version for a skin.
	 */
	this.isDefaultVersion = function() {
		return this._isDefaultVersion;
	}

	/**
	 * @return name of the css file associated with the skin.
	 */
	this.getCssFileName = function() {
		return this._cssFileName;
	}

	/**
	 * @return the skin id.
	 */
	this.getId = function() {
		return this._id;
	}

	/**
	 * @return the parent skin name.
	 */
	this.getParentSkinName = function() {
		return this._parentSkinName;
	}

}

AmxSkinConfiguration._INSTANCE = new AmxSkinConfiguration();
AmxSkinConfiguration._INSTANCE.init();

function AmxSkinConfiguration() {
	// Maps a skinning family name to a skin family
	this._amxSkinningMap = new java.util.HashMap();
	
	this.init = function(){
		this._amxSkinningMap.put(MOBILE_FUSION_FX, this._createMobileFusionFxSkinFamily());
		this._amxSkinningMap.put(MOBILE_ALTA, this._createMobileAltaSkinFamily());
	}
	
	/**
	 * @return a instance of <CODE>AmxSkinConfiguration</CODE>
	 */
	AmxSkinConfiguration.getInstance = function() {
		return AmxSkinConfiguration._INSTANCE;
	}

	/**
	 * @param familyName
	 *            name of a skin family.
	 * @return true if the given <CODE>familyName</CODE> is a supported skin
	 *         family name. Otherwise, false is returned.
	 */
	this.supportsFamily = function(familyName) {
		return this._amxSkinningMap.containsKey(familyName);
	}

	/**
	 * @param familyName
	 *            name of a skin family.
	 * @return a <CODE>AmxSkinFamily</CODE> for the given
	 *         <CODE>familyName</CODE>
	 */
	this.getSkinFamily = function(familyName) {
		return this._amxSkinningMap.get(familyName);
	}

	/**
	 * @return a list containing the names of supported skin families.
	 */
	this.getSupportedSkinFamilies = function() {
		var supportedSkinFamilies = new java.util.ArrayList();
		var itr = this._amxSkinningMap.keySet().iterator();
		while (itr.hasNext()) {
			var currEntry = itr.next();
			var currValue = this._amxSkinningMap.get(currEntry);
			supportedSkinFamilies.add(currValue.getFamilyName());
		}
		return supportedSkinFamilies;
	}

	/**
	 * Helper method to create a new <CODE>AmxSkinInfo</CODE> element.
	 * 
	 * @param id
	 *            the id of the skin.
	 * @param parentFamily
	 *            the skin family name of the parent family if the skin extends
	 *            another.
	 * @param version
	 *            the version of the skin.
	 * @param cssFileName
	 *            name of the style sheet for the skin.
	 * @param isDefaultVersion
	 *            true if the version is the default. false otherwise.
	 * @return a newly created skin.
	 */
	this._createSkin = function(id, parentFamily, version, cssFileName,
			isDefaultVersion) {
		return AmxSkinInfo.newInstance(id, parentFamily, version, cssFileName,
				isDefaultVersion);
	}

	/**
	 * @return a newly created <CODE>SkinFamily</CODE> named <i>fusionMobileFx</i>
	 *         containing 2 versions - v1.0 and v1.1. v1.1 is the default
	 *         version for the family.
	 */
	this._createMobileFusionFxSkinFamily = function() {
		var fusionFxV1_0 = this._createSkin(
				MOBILE_FUSION_FX,
				EMPTY_STR, _SKIN_VERSION_1_0,
				_AMX_V1_0_MOBILE_FUSION_FX_CSS_FILE_NAME, false);
		
		var fusionFxV1_1 = this._createSkin(
				MOBILE_FUSION_FX,
				EMPTY_STR, _SKIN_VERSION_1_1,
				_AMX_V1_1_MOBILE_FUSION_FX_CSS_FILE_NAME, true);

		var fusionFxSkins = new java.util.LinkedHashSet();
		fusionFxSkins.add(fusionFxV1_0);
		fusionFxSkins.add(fusionFxV1_1);

		return AmxSkinFamily.newInstance(
				MOBILE_FUSION_FX, fusionFxSkins);
	}

	/**
	 * Creates a <CODE>AmxSkinFamily</CODE> with a name of <i>mobileAlta</i>.
	 * This family contains two versions - v1.0 and v1.1 where v1.1 is the
	 * default version. NOTE: this family contains the 2 versions in ADF Mobile
	 * extension version 1.3. In prior versions of the extensions, only v1.0 is
	 * supported.
	 * 
	 * @return a newly created <CODE>SkinFamily</CODE> named <i>mobileAlta</i>
	 *         containing 2 versions - v1.0 and v1.1. v1.1 is the default
	 *         version for the family.
	 */
	this._createMobileAltaSkinFamily = function() {
		var _AMX_V1_0_MOBILE_ALTA_CSS_FILE_NAME = "amx-mobileAlta-1.0.css";
		var altaMobileV1_0 = this._createSkin(
				MOBILE_ALTA,
				EMPTY_STR, _SKIN_VERSION_1_0,
				_AMX_V1_0_MOBILE_ALTA_CSS_FILE_NAME, false);

		var _AMX_V1_1_MOBILE_ALTA_CSS_FILE_NAME = "amx-mobileAlta-1.1.css";
		var altaMobileV1_1 = this._createSkin(
				MOBILE_ALTA,
				EMPTY_STR, _SKIN_VERSION_1_1,
				_AMX_V1_1_MOBILE_ALTA_CSS_FILE_NAME, true);

		var altaMobileSkins = new java.util.LinkedHashSet();
		altaMobileSkins.add(altaMobileV1_0);
		altaMobileSkins.add(altaMobileV1_1);

		return AmxSkinFamily.newInstance(
				MOBILE_ALTA, altaMobileSkins);
	}
}

/**
 * Encapsulates the skin-addition element defined in maf-skins.xml.
 */
function ADFMobileSkinAddition() {
	this._skinId = null;
	this._stylesheet = null;
	/**
	 * Sets the Skin addition id.
	 * 
	 * @param id
	 *            skin id
	 */
	this.setSkinId = function(id) {
		_skinId = id;
	}

	/**
	 * Sets the Skin addition Stylesheet.
	 * 
	 * @param stylesheet
	 *            skin addition stylesheet
	 */
	this.setSkinStylesheet = function(stylesheet) {
		_stylesheet = stylesheet;
	}

	/**
	 * Returns the skin addition id.
	 * 
	 * @return skin id
	 */
	this.getSkinId = function() {
		return _skinId;
	}

	/**
	 * Returns the skin addition stlysheet.
	 * 
	 * @return skin stylsheet
	 */
	this.getSkinStylesheet = function() {
		return _stylesheet;
	}
}

/**
 * Encapsulates the skin element defined in maf-skins.xml.
 */
function ADFMobileSkin() {
	this._skinId = null;
	this._skinVersion = null;
	this._isDefault = false;
	this._skinFamily = null;
	this._skinParent = null;
	this._stylesheet = null;

	/**
	 * Constructor with skin id.
	 * 
	 * @param id
	 *            skin id
	 */
	this.ADFMobileSkin = function(id) {
		this.setSkinId(id);
	}

	/**
	 * Sets the Skin Id.
	 * 
	 * @param id
	 *            skin id
	 */
	this.setSkinId = function(id) {
		this._skinId = id;
	}

	/**
	 * Sets the Skin version.
	 * 
	 * @param version
	 *            skin version
	 */
	this.setSkinVersion = function(version) {
		this._skinVersion = version;
	}

	/**
	 * Sets the version default value.
	 * 
	 * @param isDefault
	 *            is skin default version
	 */
	this.setIsDefaultVersion = function(isDefault) {
		this._isDefault = isDefault;
	}

	/**
	 * Sets the Skin family.
	 * 
	 * @param family
	 *            skin family
	 */
	this.setSkinFamily = function(family) {
		this._skinFamily = family;
	}

	/**
	 * Sets the Skin parent identified by extends element.
	 * 
	 * @param parent
	 *            skin parent
	 */
	this.setSkinParent = function(parent) {
		this._skinParent = parent;
	}

	/**
	 * Sets the Skin Stylesheet.
	 * 
	 * @param stylesheet
	 *            skin stylesheet
	 */
	this.setSkinStylesheet = function(stylesheet) {
		this._stylesheet = stylesheet;
	}

	/**
	 * Returns the skin id.
	 * 
	 * @return skin id
	 */
	this.getSkinId = function() {
		return this._skinId;
	}

	/**
	 * Returns the skin platform by parsing it from skin id.
	 * 
	 * @return skin platform that is defined after the last dot in skin id
	 */
	this.getSkinPlatform = function() {
		if (this._skinId == null) {
			return null;
		}

		var id = this._skinId.trim();

		if (this._skinVersion != null && !this._skinVersion.trim().isEmpty()) {
			var versionDelimiter = HYPHEN
					+ this._skinVersion.trim();
			var index = id.indexOf(versionDelimiter);

			if (index > 0) {
				id = id.substring(index + versionDelimiter.length);
			} else {
				// no platform is set
				return null;
			}
		}

		var parts = id.split(ENCODED_DOT);

		if (parts.length > 1) {
			return parts[parts.length - 1];
		}

		return null;
	}

	/**
	 * Returns the skin version.
	 * 
	 * @return skin version
	 */
	this.getSkinVersion = function() {
		return this._skinVersion;
	}

	/**
	 * Returns the default value of skin version.
	 * 
	 * @return boolean value determining if the skin version is default
	 */
	this.getIsDefaultVersion = function() {
		return this._isDefault;
	}

	/**
	 * Returns the skin family.
	 * 
	 * @return skin family
	 */
	this.getSkinFamily = function() {
		return this._skinFamily;
	}

	/**
	 * Returns the skin parent.
	 * 
	 * @return skin parent
	 */
	this.getSkinParent = function() {
		return this._skinParent;
	}

	/**
	 * Returns the skin stylesheet
	 * 
	 * @return skin stylesheet
	 */
	this.getSkinStylesheet = function() {
		return this._stylesheet;
	}
}
