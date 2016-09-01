/*
 * Copyright (c) 2014, Oracle and/or its affiliates. All rights reserved.
 */

ARRAY_ELEM = "array";
CORDOVA_PLIST_FILE_NAME = "Cordova.plist";
CORDOVA_PLUGIN_PAGE_TITLE_ID_SUFFIX = ".page.title";
DICT_ELEM = "dict";
EMPTY_STRING = "";
FILE_KEY = "File";
HYPHEN = "-";
IOS_PLUGIN_INFO_ELEM = "iosPluginInfo";
KEY_ELEM = "key";
LIB_PREFIX = "lib";
LIBRARY_EXTENSION = ".a";
LINK_FLAG = "-l";
LINKER_FLAGS_ELEM = "linkerFlags";
LOCALIZABLE_STRINGS_FILE_NAME = "Localizable.strings";
NEW_LINE = "\n";
PLIST_FILE_EXTENSION = ".plist";
PLUGINS_KEY = "Plugins";
PREFERENCE_SPECIFIERS_KEY = "PreferenceSpecifiers";
PS_CHILD_PANE_SPECIFIER_KEY = "PSChildPaneSpecifier";
ROOT_PLIST_FILE_NAME = "Root.plist";
SETTINGS_BUNDLE_DIR_NAME = "Settings.bundle";
SPACE = " ";
STRING_ELEM = "string";
STRINGS_TABLE_KEY = "StringsTable";
STRINGS_FILE_EXTENSION = ".strings";
TITLE_KEY = "Title";
TYPE_KEY = "Type";
XCODE_PROJECT_PBXPROJ_REL_SPEC = "Oracle_ADFmc_Container_Template.xcodeproj/project.pbxproj";
XCODE_TEMPLATE_FRAMEWORKS_FOLDER_NAME = "Frameworks";


eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(self.project.getProperty("oepe.bin.js.dir")+"/loader.js"))));
load("common.js");
load("cordova-plugins-common.js");


plistUtils = new PlistUtils();
processCordovaPlugins();


function processCordovaPlugins() {
    try {
        // follows the algorithm in the deployImpl() method of the JDev Deployer class, 
        // oracle.adfmf.framework.dt.deploy.ios.deployers.plugins.IosPluginDeployer
        antHelper.echo("Processing Cordova plugins for deployment...");
        var plugins = deployUtils.getCordovaPlugins(deployUtils.IOS_PLATFORM, createIOSPluginInfo);
        if (plugins.length > 0) {
            copyPluginLibraries(plugins);
            addLinkFlagsToXcodeProject(plugins);
            updateCordovaPlist(plugins);
            mergePluginSettingsBundlePackage(plugins);
        }
    } catch (e) {
        if (e instanceof CordovaPluginException) {
            project.setProperty("processCordovaPlugins.fail.message", e.toString());
        } else if (e instanceof java.lang.Throwable) {
            project.setProperty("processCordovaPlugins.fail.message", e.getMessage());
        } else {
            project.setProperty("processCordovaPlugins.fail.message", "Error processing Cordova plugins.");
        }
    }
}

function createIOSPluginInfo(name, fullyQualName, implClass, pluginConfig, pluginElem) {
    var infoElem = deployUtils.getFirstNamedChildElement(pluginElem, IOS_PLUGIN_INFO_ELEM);
    var linkerFlagsText = deployUtils.getElementTextContent(deployUtils.getFirstNamedChildElement(infoElem, LINKER_FLAGS_ELEM));
    var linkerFlags = createLinkFlags(name, linkerFlagsText);
    return new IosCordovaPluginInfo(name, fullyQualName, implClass, linkerFlags, pluginConfig);
}

function createLinkFlags(pluginName, linkerFlagsText) {
    var flagsMap = new java.util.LinkedHashMap();
    var fixedLinkerFlags = fixWhitespace(linkerFlagsText);
    if (fixedLinkerFlags && !EMPTY_STRING.equals(fixedLinkerFlags.trim())) {
        var linkFlagsArray = fixedLinkerFlags.split(SPACE);
        if (null != linkFlagsArray) {
            for (var i = 0; i < linkFlagsArray.length; i++) {
                var currValue = linkFlagsArray[i];
                if (!currValue || EMPTY_STRING.equals(currValue)) {
                    continue;
                }

                // curr value can be a flag or a value for a prior flag
                var currValueIsFlag = currValue.startsWith(HYPHEN);
                if (currValueIsFlag) {
                    if (!flagsMap.containsKey(currValue)) {
                        var listOfValuesForFlag = new java.util.ArrayList();
                        flagsMap.put(currValue, listOfValuesForFlag);
                    }
                    // else the flag is already in the list - ignore the flag
                    // to prevent dups
                } else {
                    // currValue is not a flag so it is a value for the flag
                    // specified previously in the array.
                    var prevFlag = null;
                    if (i > 0) {
                        prevFlag = linkFlagsArray[i - 1];
                    } else {
                        throw new CordovaPluginException("The plugin \"" + pluginName + "\" is configured with an invalid linker flag, " + currValue + "\"");
                    }

                    var listOfValuesForFlag = flagsMap.get(prevFlag);

                    // Add the value only if the value isn't in the list of
                    // values for the flag. This ensures a given flag/value
                    // isn't specified more than 1 time for the plugin.
                    if (!listOfValuesForFlag.contains(currValue)) {
                        listOfValuesForFlag.add(currValue);
                    }
                }
            }
        }  
    }

    var pluginLinkFlags = new java.util.LinkedHashSet();
    var itEntrySet = flagsMap.entrySet().iterator();
    while (itEntrySet.hasNext()) {
        var currEntry = itEntrySet.next();
        pluginLinkFlags.add(new PluginLinkFlag(currEntry.getKey(), currEntry.getValue()));
    }

    return pluginLinkFlags;
}

function fixWhitespace(linkerFlags) {
    var copy = linkerFlags;

    // Replace any new-lines with spaces
    copy = copy.replaceAll(NEW_LINE, SPACE);
    copy = copy.trim();

    // Replace tabs with spaces
    var ONE_OR_MORE_TAB_REGEX = "\\t+"; // 1 or more tabs
    copy = copy.replaceAll(ONE_OR_MORE_TAB_REGEX, SPACE);

    // Replace instances of consecutive spaces with a single space
    var CONSECUTIVE_SPACES_REGEX = "\\ +"; // 1 or more consecutive spaces
    copy = copy.replaceAll(CONSECUTIVE_SPACES_REGEX, SPACE);

    return copy;
}

function copyPluginLibraries(plugins) {
    var destDir = getDeploymentExtraCordovaPluginSdkDir();
    if (destDir && !destDir.exists()) {
        destDir.mkdir();
    }

    for (var i = 0; i < plugins.length; i++) {
        var plugin = plugins[i];
        antHelper.echo("Copying plugin \"" + plugin.getName() +"\" libraries...");
        var pluginBinDir = plugin.getPluginBinDir();
        if (!pluginBinDir || !pluginBinDir.isDirectory()) {
            throw new CordovaPluginException("Could not find library location for plugin, \""
                    + plugin.getName() + "\"");
        }

        // copy the plugin libs
        var copyTask = copyUtils.createCopyTask(self.project, self.getOwningTarget());
        copyTask.setTodir(destDir);
        var fileSet = copyUtils.createFileSet(pluginBinDir);
        fileSet.setIncludes("*.a")
        copyTask.add(fileSet);
        copyTask.perform();

        // copy the dependent libraries if there are any
        var pluginLibsDir = plugin.getPluginLibsDir();
        if (pluginLibsDir && pluginLibsDir.isDirectory()) {
            var copyTask = copyUtils.createCopyTask(self.project, self.getOwningTarget());
            copyTask.setTodir(destDir);
            var fileSet = copyUtils.createFileSet(pluginLibsDir);
            fileSet.setIncludes("*.a")
            copyTask.add(fileSet);
            copyTask.perform();
        }
    }
}

function addLinkFlagsToXcodeProject(plugins) {
    var linkFlagsAllPlugins = getAllPluginLinkFlags(plugins);
    addExtraLibrariesToLinkFlags(plugins, linkFlagsAllPlugins);
    var linkerFlags = buildLinkerFlagString(linkFlagsAllPlugins);
    if (linkerFlags && !EMPTY_STRING.equals(linkerFlags)) {
        var reader = null;
        try {
            antHelper.echo("Adding the following flags to the project:\n"
                    + linkerFlags);
            var pbxProjFile = getContainerTemplateProjectFile();
            reader = new java.io.FileReader(pbxProjFile);
            var projectFileAsString = fileUtils.readFileToString(reader);
            var SEARCH_KEY = "PHONEGAPLIB = ../../sdk/PhoneGap/PhoneGapLib;";
            var EXTRA_TEST_LINKER_FLAGS = "EXTRA_TEST_LINKER_FLAGS";
            var LINKER_FLAGS_FORMAT_SPEC = "%s %s=\"%s\";";
            var newValue = java.lang.String.format(LINKER_FLAGS_FORMAT_SPEC,
                                                   SEARCH_KEY,
                                                   EXTRA_TEST_LINKER_FLAGS,
                                                   linkerFlags.trim());

            var newProjectFileAsString = projectFileAsString.replaceAll(SEARCH_KEY, newValue);
            fileUtils.writeStringToFile(newProjectFileAsString, pbxProjFile);
        } finally {
            if (reader) {
                try {
                    os.close();
                } catch (e) {
                    // do nothing
                }
            }
        }
        
    }
}

function getAllPluginLinkFlags(plugins) {
    var linkFlagsAllPlugins = new java.util.LinkedHashMap();
    for (var i = 0; i < plugins.length; i++) {
        var plugin = plugins[i];
        var pluginFlags = plugin.getLinkFlags();
        if (null != pluginFlags) {
            // Add any new link flags of the current plugin to the
            // full set of flags.
            var iter = pluginFlags.iterator();
            while (iter.hasNext()) {
                var currPluginFlag = iter.next();
                var currFlag = currPluginFlag.getLinkFlag();
                var currFlagValues = currPluginFlag.getLinkFlagValues();
                var listOfValuesForFlag = null;
                if (!linkFlagsAllPlugins.containsKey(currFlag)) {
                    listOfValuesForFlag = new java.util.ArrayList();
                    linkFlagsAllPlugins.put(currFlag, listOfValuesForFlag);
                } else {
                    listOfValuesForFlag = linkFlagsAllPlugins.get(currFlag);
                }

                if (!currFlagValues.isEmpty()) {
                    for (var j = 0; j < currFlagValues.size(); j++) {
                        var currFlagValue = currFlagValues.get(j);
                        if (!listOfValuesForFlag.contains(currFlagValue)) {
                            listOfValuesForFlag.add (currFlagValue);
                        }
                    }
                }
            }
        }
    }

    return linkFlagsAllPlugins;
}

function addExtraLibrariesToLinkFlags(plugins, linkFlagsAllPlugins) {
    var extraLibraries = new java.util.HashSet();
    
    // Get the dependent libraries across all plugins.
    for (var i = 0; i < plugins.length; i++) {
        var currPlugin = plugins[i];
        var pluginName = currPlugin.getName ();
        var pluginLibsDir = currPlugin.getPluginLibsDir();
        if (pluginLibsDir && pluginLibsDir.isDirectory()) {
            extraLibraries.addAll(fileUtils.getFilesFromDir(pluginLibsDir, LIBRARY_EXTENSION));
        }
    }
    
    if (!extraLibraries.isEmpty ()) {
        var linkFlagValues = null;
        if (linkFlagsAllPlugins.containsKey (LINK_FLAG)) {
            linkFlagValues = linkFlagsAllPlugins.get(LINK_FLAG);
        } else {
            linkFlagValues = new java.util.ArrayList();
            linkFlagsAllPlugins.put(LINK_FLAG, linkFlagValues);
        }

        // Add each dependent library to the set of libraries that are to
        // be linked into the application using the "-l" linker flag.
        var iter = extraLibraries.iterator();
        while (iter.hasNext()) {
            var currlib = iter.next();
            // The linker "-l" flag value requires the name of the
            // library without the extension or the "lib" prefix. For
            // example, if the library file is "libX.a", it must be specified
            // in the linker flags as "-l X".  The following code removes
            // the file extension and the "lib" prefix.
            var libName = fileUtils.getFileNameNoExt(currlib.getName());
            if (libName.startsWith(LIB_PREFIX)) {
            	libName = libName.substring(3);
            }
            if (!linkFlagValues.contains(libName)) {
                linkFlagValues.add(libName);
            }
        }
    }
}

function buildLinkerFlagString(linkFlagsAllPlugins) {
    var sb = new java.lang.StringBuilder();
    if (!linkFlagsAllPlugins.isEmpty()) {
        // Build a string containing a concatenation of all the linker flags and their values.
        var itEntrySet = linkFlagsAllPlugins.entrySet().iterator();
        while (itEntrySet.hasNext()) {
            var currEntry = itEntrySet.next();
            var currLinkFlag = currEntry.getKey();
            var currLinkFlagValues = currEntry.getValue();
            if (currLinkFlagValues.isEmpty()) {
                sb.append(currLinkFlag);
                sb.append(SPACE);
            } else {
                var listOfValuesForFlag = currEntry.getValue();
                for (var i = 0; i < listOfValuesForFlag.size(); i++) {
                    var currFlagValue = listOfValuesForFlag.get(i);
                    sb.append(currLinkFlag);
                    sb.append(SPACE);
                    sb.append(currFlagValue);
                    sb.append(SPACE);
                }
            }
        }
    }

    return sb.toString();
}

function updateCordovaPlist(plugins) {
    antHelper.echo("Updating the Cordova plist file...");
    var cordovaPlistFile = getCordovaPlistFile();
    var cordovaPlistStream = new java.io.FileInputStream(cordovaPlistFile);
    var cordovaPlistIs = new org.xml.sax.InputSource(cordovaPlistStream);
    var xmlDocument = new XMLDocument(cordovaPlistIs);
    var cordovaDom = xmlDocument.load();
    var os = null;

    try {
        // /plist/dict/key(==Plugins)
        var pluginsNode = plistUtils.getFirstKeyNode(cordovaDom, PLUGINS_KEY);
        if (pluginsNode) {
            // /plist/dict/key(==Plugins)/dict
            var pluginsDictNode = plistUtils.getPlistDictNode(pluginsNode);
            var definedPluginNames = getExistingPlugins(pluginsDictNode);
            for (var i = 0; i < plugins.length; i++) {
                var currPlugin = plugins[i];
                var pluginFullyQualifiedName = currPlugin.getFullyQualifiedName();
                var pluginImplClass = currPlugin.getImplClass();
                if (definedPluginNames.contains(pluginFullyQualifiedName)) {
                    antHelper.echo("Warning: File \"" + cordovaPlistFile.getAbsolutePath()
                            + "\" already contains plugin \"" + currPlugin.getName()
                            + "\".  The plugin with the fully qualified name \"" + pluginFullyQualifiedName
                            + "\" will not be added.");
                } else {
                    var currKeyElem = cordovaDom.createElementNS(null, KEY_ELEM);
                    currKeyElem.setTextContent(pluginFullyQualifiedName);
                    pluginsDictNode.appendChild(currKeyElem);
                    var currStringElem = cordovaDom.createElementNS(null, STRING_ELEM);
                    currStringElem.setTextContent(pluginImplClass);
                    pluginsDictNode.appendChild(currStringElem);
                }
            }
        } else {
            antHelper.echo("Could not find the plugins node in the Cordova.plist file: " + cordovaPlistFile.getAbsolutePath());
        }

        os = new java.io.FileOutputStream(cordovaPlistFile);
        xmlDocument.save(os);
    } finally {
        if (cordovaPlistStream) {
            try {
                cordovaPlistStream.close();
            } catch (e) {
                // do nothing
            }
        }

        if (os) {
            try {
                os.close();
            } catch (e) {
                // do nothing
            }
        }
    }
}

function getExistingPlugins(pluginsDictNode) {
    var definedPlugins = new java.util.LinkedHashSet();
    if (pluginsDictNode) {
        var childNodes = pluginsDictNode.getChildNodes();
        if (childNodes) {
            for (var i = 0; i < childNodes.getLength(); i++) {
                var currChild = childNodes.item(i);
                if (currChild.getNodeName().equals(KEY_ELEM)) {
                    definedPlugins.add(currChild.getTextContent());
                }
            }
        }
    }

    return definedPlugins;
}

function mergePluginSettingsBundlePackage(plugins) {
    antHelper.echo("Merging iOS plugin preference artifacts...");
    var settingsBundleDir = getSettingsBundleDir();
    var pluginRootPlistFilesToLink = new java.util.LinkedHashMap();
    var pluginRootPlistFilesToMerge = new java.util.LinkedHashMap();
    for (var i = 0; i < plugins.length; i++) {
        var currPlugin = plugins[i];
        var pluginName = currPlugin.getName();
        var pluginSettingsBundleDir = currPlugin.getPluginSettingsBundleDir();
        if (!pluginSettingsBundleDir || !pluginSettingsBundleDir.isDirectory()) {
            // Resources, like Settings.bundle, are optional.
            continue;
        }

        var plistFiles = fileUtils.getFilesFromDir(pluginSettingsBundleDir, PLIST_FILE_EXTENSION);
        var iter = plistFiles.iterator();
        while (iter.hasNext()) {
            var currPlist = iter.next();
            var plistFileName = currPlist.getName();
            if (plistFileName.equals(ROOT_PLIST_FILE_NAME)) {
                // Add to the collection containing the plist files
                // whose elements are to be merged into the
                // temporary_xcode_project Root.plist
                pluginRootPlistFilesToMerge.put(pluginName, currPlist);
            } else {
                var pluginRootPlistName = pluginName + "." + ROOT_PLIST_FILE_NAME;
                if (plistFileName.equals(pluginRootPlistName)) {
                    // Add to the collection containing the plist files
                    // whose elements are to be linked as a child page
                    // of the Root.plist in the temporary_xcode_project
                    // Root.plist
                    pluginRootPlistFilesToLink.put(pluginName, currPlist);
                }

                var copyTask = copyUtils.createCopyTask(self.project, self.getOwningTarget());
                copyTask.setFile(currPlist);
                copyTask.setTodir(settingsBundleDir);
                copyTask.perform();
            }
        }

        // Copy all files except .plist files.  The plist files that
        // need to be copied are already copied.  Those that don't need
        // to be copied are merged into the ADF Mobile Root.plist later
        if (settingsBundleDir && !settingsBundleDir.exists()) {
            settingsBundleDir.mkdir();
        }
        var copyTask = copyUtils.createCopyTask(self.project, self.getOwningTarget());
        copyTask.setTodir(settingsBundleDir);
        var fileSet = copyUtils.createFileSet(pluginSettingsBundleDir);
        fileSet.setExcludes("**/*.plist")
        copyTask.add(fileSet);
        copyTask.perform();
    }

    var rootPlist = new java.io.File(settingsBundleDir, ROOT_PLIST_FILE_NAME);
    if (!rootPlist || !rootPlist.isFile()) {
        throw new CordovaPluginException("Could not find the " + ROOT_PLIST_FILE_NAME
                + " file in the deployment Settings.bundle directory, "
                + settingsBundleDir.getAbsolutePath());
    }

    updateRootPlist(rootPlist, pluginRootPlistFilesToMerge,
            pluginRootPlistFilesToLink);
    updateStringsFiles(settingsBundleDir, pluginRootPlistFilesToMerge,
            pluginRootPlistFilesToLink);
}

function updateRootPlist(deployRootPlist, pluginRootPlistFilesToMerge, pluginRootPlistFilesToLink) {
    var rootPlistStream = new java.io.FileInputStream(deployRootPlist);
    var rootPlistIs = new org.xml.sax.InputSource(rootPlistStream);
    var xmlDocument = new XMLDocument(rootPlistIs);
    // Root.plist DOM
    var rootPlistDom = xmlDocument.load();
    var os = null;

    try {
        //plist/key(==PreferenceSpecifiers)
        var preferenceSpecifierNode = getPreferenceSpecifierNode(rootPlistDom);
        if (preferenceSpecifierNode) {
            // Append after the last dictionary node in this array
            // plist/key(==PreferenceSpecifiers)/array
            var prefArray = getPreferenceSpecifiersArray(preferenceSpecifierNode);

            // Add preferences as child page(s) for each plugin having preferences
            // set up to be added as child pages to the main page.
            linkPluginsPlistFiles(rootPlistDom, prefArray, pluginRootPlistFilesToLink);

            // Add preferences to the same page for each plugin having preferences
            // set up to be appended to the main page.
            appendPluginsPlistFiles(rootPlistDom, prefArray, pluginRootPlistFilesToMerge);
        } else {
            antHelper.echo("Could no find the PreferenceSpecifiers key node in the Root.plist file "
                    + deployRootPlist.getAbsolutePath());
        }

        os = new java.io.FileOutputStream(deployRootPlist);
        xmlDocument.save(os);
    } catch (e) {
        if (e instanceof CordovaPluginException) {
            throw e;
        }
        throw new CordovaPluginException("A problem occurred while updating file " + deployRootPlist.getAbsolutePath());
    } finally {
        if (rootPlistStream) {
            try {
                rootPlistStream.close();
            } catch (e) {
                // do nothing
            }
        }

        if (os) {
            try {
                os.close();
            } catch (e) {
                // do nothing
            }
        }
    }

}

function getPreferenceSpecifierNode(rootPlistDom) {
    return plistUtils.getFirstKeyNode(rootPlistDom, PREFERENCE_SPECIFIERS_KEY);
}

function getPreferenceSpecifiersArray(keyNode) {
    return plistUtils.getPlistArrayElement(keyNode);
}

function linkPluginsPlistFiles(rootPlistDom, prefArray, rootPlistFilesToLink) {
    var itEntrySet = rootPlistFilesToLink.entrySet().iterator();
    while (itEntrySet.hasNext()) {
        var currEntry = itEntrySet.next();
        var currPluginName = currEntry.getKey();
        antHelper.echo("Updating Root.plist to contain the preferences for plugin \""
                + currPluginName + "\" as a child page...");
        var currPlistFile = currEntry.getValue();
        var currPlistFileName = fileUtils.getFileNameNoExt(currPlistFile.getName());

        linkPluginRootPlistAsChildPage(rootPlistDom,
                                       prefArray,
                                       currPlistFileName,
                                       currPluginName);
    }    
}

function linkPluginRootPlistAsChildPage(rootPlistDom, prefArray, plistFileName, pluginName) {
    var dictNode = rootPlistDom.createElementNS(null, DICT_ELEM);
    var keyType = plistUtils.createKeyNode(rootPlistDom, TYPE_KEY);
    var stringType = plistUtils.createStringNode(rootPlistDom, PS_CHILD_PANE_SPECIFIER_KEY);
    var keyFile = plistUtils.createKeyNode(rootPlistDom, FILE_KEY);
    var stringFile = plistUtils.createStringNode(rootPlistDom, plistFileName);
    var keyTitle = plistUtils.createKeyNode(rootPlistDom, TITLE_KEY);
    var pluginPageId = pluginName + CORDOVA_PLUGIN_PAGE_TITLE_ID_SUFFIX;
    var stringTitle = plistUtils.createStringNode(rootPlistDom, pluginPageId);

    // Build the element hierarchy
    dictNode.appendChild(keyType);
    dictNode.appendChild(stringType);
    dictNode.appendChild(keyFile);
    dictNode.appendChild(stringFile);
    dictNode.appendChild(keyTitle);
    dictNode.appendChild(stringTitle);

    prefArray.appendChild(dictNode);
}

function appendPluginsPlistFiles(rootPlistDom, prefArray, rootPlistFilesToMerge) {
    var itEntrySet = rootPlistFilesToMerge.entrySet().iterator();
    while (itEntrySet.hasNext()) {
        var currEntry = itEntrySet.next();
        antHelper.echo("Updating Root.plist to contain the preferences for plugin \""
                + currEntry.getKey() + "\"...");
        var currPlistFile = currEntry.getValue();
        appendPluginRootPlistPreferences(rootPlistDom, prefArray, currPlistFile);
    }    
}

function appendPluginRootPlistPreferences(rootPlistDom, prefArray, pluginRootPlistFile) {
    var pluginRootPlistStream = new java.io.FileInputStream(pluginRootPlistFile);
    var pluginRootPlistIs = new org.xml.sax.InputSource(pluginRootPlistStream);
    var xmlDocument = new XMLDocument(pluginRootPlistIs);

    try {
        // The plugins' Root.plist DOM
        var pluginRootPlistDom = xmlDocument.load();

        //plist/key(==PreferenceSpecifiers)
        var pluginPreferenceSpecifierNode = getPreferenceSpecifierNode(pluginRootPlistDom);
        if (pluginPreferenceSpecifierNode) {
            // Append after the last dictionary node in this array
            // plist/key(==PreferenceSpecifiers)/array
            var pluginPrefArray = getPreferenceSpecifiersArray(pluginPreferenceSpecifierNode);
            var pluginPrefChildNodes = pluginPrefArray.getChildNodes();

            if (pluginPrefChildNodes) {
                for (var i = 0; i < pluginPrefChildNodes.getLength(); i++) {
                    var importedNode = rootPlistDom.importNode(pluginPrefChildNodes.item(i), true);
                    prefArray.appendChild(importedNode);
                }
            }
        } else {
            antHelper.echo("Could no find the PreferenceSpecifiers key node in the plugin plist file "
                    + pluginRootPlistFile.getAbsolutePath());
        }
    } catch (e) {
        throw new CordovaPluginException("A problem occurred while updating file " + pluginRootPlistFile.getAbsolutePath());
    } finally {
        if (pluginRootPlistStream) {
            try {
                pluginRootPlistStream.close();
            } catch (e) {
                // do nothing
            }
        }
    }
}

function updateStringsFiles(settingsBundleDir, rootPlistFilesToMerge, rootPlistFilesToLink) {
    var itEntrySet = rootPlistFilesToMerge.entrySet().iterator();
    while (itEntrySet.hasNext()) {
        var currEntry = itEntrySet.next();
        var currPluginName = currEntry.getKey();
        var currPlistFile = currEntry.getValue();
        var currPluginSettingsBundleDir = currPlistFile.getParentFile();
        if (currPluginSettingsBundleDir && currPluginSettingsBundleDir.isDirectory()) {
            var updater = new StringsUpdater(currPluginName,
                    settingsBundleDir,
                    currPluginSettingsBundleDir);
            updater.updateMobileStringsWithPluginStrings();
        }
    }

    var itEntrySet = rootPlistFilesToLink.entrySet().iterator();
    while (itEntrySet.hasNext()) {
        var currEntry = itEntrySet.next();
        var currPluginName = currEntry.getKey();
        var currPlistFile = currEntry.getValue();
        var currPluginPlistFileName = currPlistFile.getName()
        var currPluginSettingsBundleDir = currPlistFile.getParentFile();
        if (currPluginSettingsBundleDir && currPluginSettingsBundleDir.isDirectory()) {
            var updater = new StringsUpdater(currPluginName,
                    settingsBundleDir,
                    currPluginSettingsBundleDir);
            updater.updateMobileStringsWithPluginChildPageName(currPluginPlistFileName);
        }
    }
}

function getDeploymentXcodeDir() {
    var stagingPath = deployUtils.getStagingPath();
    var deploymentXcodeDir = new java.io.File(stagingPath);
    if (!deploymentXcodeDir || !deploymentXcodeDir.isDirectory()) {
        throw new CordovaPluginException("Could not find deployment Xcode directory "
                + stagingPath + "/");
    }
    return deploymentXcodeDir;
}

function getDeploymentExtraCordovaPluginSdkDir() {
    var deploymentXcodeDir = getDeploymentXcodeDir();
    var deploymentXcodeFrameworkDir = new java.io.File(deploymentXcodeDir, XCODE_TEMPLATE_FRAMEWORKS_FOLDER_NAME);
    if (!deploymentXcodeFrameworkDir || !deploymentXcodeFrameworkDir.isDirectory()) {
        throw new CordovaPluginException("Could not find deployment Xcode template frameworks directory, "
                + deploymentXcodeDir.getAbsolutePath() + "/"
                + XCODE_TEMPLATE_FRAMEWORKS_FOLDER_NAME);
    }

    return new java.io.File(deploymentXcodeFrameworkDir, "ExtraCordovaPlugin.sdk");
}

function getContainerTemplateProjectFile() {
    var deploymentXcodeDir = getDeploymentXcodeDir();
    var pbxprojFile = new java.io.File(deploymentXcodeDir, XCODE_PROJECT_PBXPROJ_REL_SPEC);
    if (!pbxprojFile || !pbxprojFile.isFile()) {
        throw new CordovaPluginException("Could not find the project.pbxproj project file, "
                + deploymentXcodeDir.getAbsolutePath() + "/"
                + XCODE_PROJECT_PBXPROJ_REL_SPEC);
    }

    return pbxprojFile;
}

function getCordovaPlistFile() {
    var deploymentXcodeDir = getDeploymentXcodeDir();
    var plistFile = new java.io.File(deploymentXcodeDir, CORDOVA_PLIST_FILE_NAME);
    if (!plistFile || !plistFile.isFile()) {
        throw new CordovaPluginException("Could not find the Cordova.plist file, "
                + deploymentXcodeDir.getAbsolutePath() + "/"
                + CORDOVA_PLIST_FILE_NAME);
    }

    return plistFile;
}

function getSettingsBundleDir() {
    var deploymentXcodeDir = getDeploymentXcodeDir();
    var settingsBundleDir = new java.io.File(deploymentXcodeDir, SETTINGS_BUNDLE_DIR_NAME);
    if (!settingsBundleDir || !settingsBundleDir.isDirectory()) {
        throw new CordovaPluginException("Could not find iOS preference settings bundle directory, "
                + deploymentXcodeDir.getAbsolutePath() + "/"
                + SETTINGS_BUNDLE_DIR_NAME);
    }

    return settingsBundleDir;
}


function IosCordovaPluginInfo(name, fullyQualifiedName, implClass, linkFlags, pluginConfig)
{
    this._name = name;
    this._fullyQualifiedName = fullyQualifiedName;
    this._implClass = implClass;
    this._linkFlags = linkFlags;
    this._pluginConfig = pluginConfig;

    this.getName = function() {
        return this._name;
    }

    this.getFullyQualifiedName = function() {
        return this._fullyQualifiedName;
    }

    this.getImplClass = function() {
        return this._implClass;
    }

    this.getLinkFlags = function() {
        return this._linkFlags;
    }

    this.getPluginResDir = function() {
        return this._pluginConfig.getPluginResDir();
    }

    this.getPluginBinDir = function() {
        return this._pluginConfig.getPluginBinDir();
    }

    this.getPluginLibsDir = function() {
        return this._pluginConfig.getPluginLibsDir();
    }

    this.getPluginSettingsBundleDir = function() {
        return new java.io.File(this.getPluginResDir(), "/Settings.bundle");
    }
}


function PluginLinkFlag(linkFlag, linkFlagValues)
{
    this._linkFlag = linkFlag;
    this._linkFlagValues = linkFlagValues;

    this.getLinkFlag = function() {
        return this._linkFlag;
    }

    this.getLinkFlagValues = function() {
        return this._linkFlagValues;
    }
}


function PlistUtils()
{
    this.getFirstKeyNode = function(plistDom, keyNodeName) {
        var xPathFactory = javax.xml.xpath.XPathFactory.newInstance();
        var xPath = xPathFactory.newXPath();
        var node = null;

        try {
            //This xpath expression does the following:
            // 1. It gets the set of all child elements whose tag is "key" and whose
            //    element text value is keyNodeName
            // 2. Then it selects the first node from that set.
            var GET_NODE_FORMAT_SPEC = "(//key[text()='%s'])[1]";
            var expression = java.lang.String.format(GET_NODE_FORMAT_SPEC,
                                                     keyNodeName);
            node = xPath.evaluate(expression, plistDom, javax.xml.xpath.XPathConstants.NODE);
        } catch (e) {
            throw new CordovaPluginException("Could not find the " + keyNodeName + " node in the Cordova plist file.");
        }

        return node;
    }

    this.getPlistDictNode = function(keyNode) {
        return this.getSiblingNodeByName(keyNode, DICT_ELEM);
    }

    this.getPlistArrayElement = function(keyNode) {
        return this.getSiblingNodeByName(keyNode, ARRAY_ELEM);
    }

    this.getStringNodeAfterKeyNode = function(keyNode) {
        return this.getSiblingNodeByName(keyNode, STRING_ELEM);
    }

    this.getSiblingNodeByName = function(keyNode, nodeName) {
        var nextSiblingNode = keyNode.getNextSibling();
        while (nextSiblingNode &&
               !nextSiblingNode.getNodeName().equals(nodeName)) {
            nextSiblingNode = nextSiblingNode.getNextSibling();
        }

        return nextSiblingNode;
    }

    this.createKeyNode = function(plistDom, nodeTextValue) {
        return this.createNodeWithTextContent(plistDom, KEY_ELEM, nodeTextValue);
    }

    this.createStringNode = function(plistDom, nodeTextValue) {
        return this.createNodeWithTextContent(plistDom, STRING_ELEM, nodeTextValue);
    }

    this.createNodeWithTextContent = function(dom, name, nodeTextValue) {
        var node = dom.createElementNS(null, name);
        node.setTextContent(nodeTextValue);
        return node;
    }
}


function StringsUpdater(pluginName, settingsBundleDir, pluginSettingsBundleDir)
{
    this._pluginName = pluginName;
    this._settingsBundleDir = settingsBundleDir;
    this._pluginSettingsBundleDir = pluginSettingsBundleDir;

    this.updateMobileStringsWithPluginStrings = function() {
        try {
            // Get the set of locale directories generated earlier in the deployment sequence.
            var pluginLocaleDirs = this.getLprojDirectories(this._pluginSettingsBundleDir);
            if (pluginLocaleDirs && pluginLocaleDirs.size() > 0) {
                var pluginRootPlistFile = new java.io.File(this._pluginSettingsBundleDir,
                        ROOT_PLIST_FILE_NAME);
                var pluginStringTableName = this.getStringsTableFileName(pluginRootPlistFile);
                if (pluginStringTableName && pluginStringTableName.length() > 0) {
                    antHelper.echo("Merging plugin resource strings for plugin \"" + this._pluginName + "\"");
                    // For each of the locales, copy the plugin strings into
                    // the corresponding  Localizable.strings file.
                    var iter = pluginLocaleDirs.iterator();
                    while (iter.hasNext()) {
                        var localeDir = iter.next();
                        var pluginLocaleFile = new java.io.File(localeDir,
                                pluginStringTableName);
                        var deployLocaleFile = this.getDeployLocaleFile(localeDir.getName());
                        if (pluginLocaleFile && pluginLocaleFile.isFile() && 
                                deployLocaleFile && deployLocaleFile.isFile()) {
                            this.copyPluginStrings(pluginLocaleFile, deployLocaleFile);
                        }
                    }
                }
            } else {
                antHelper.echo("No plugin resource strings to merge for plugin \"" + this._pluginName + "\"");
            }
        } catch (e) {
            if (e instanceof CordovaPluginException) {
                throw e;
            }
            throw new CordovaPluginException("Error updating strings for the plugin \"" + this._pluginName + "\"");
        }
    }

    this.updateMobileStringsWithPluginChildPageName = function(childPlistFileName) {
        try {
            // Hard-coded id plugin developers must use if they want the preferences to be on a separate
            // page.  The id is of the form [PluginName].page.title
            var pluginPageTitleId = this.getPluginPageTitleId();

            // Get the set of locale directories generated earlier in the deployment sequence.
            var pluginLocaleDirs = this.getLprojDirectories(this._pluginSettingsBundleDir);
            if (pluginLocaleDirs && pluginLocaleDirs.size() > 0) {
                var  pluginRootPlistFile = new java.io.File(this._pluginSettingsBundleDir,
                        childPlistFileName);
                var pluginStringTableName = this.getStringsTableFileName(pluginRootPlistFile);
                if (pluginStringTableName && pluginStringTableName.length() > 0) {
                    antHelper.echo("Merging plugin resource strings for plugin \"" + this._pluginName + "\"");
                    // For each of the locales, copy the localized plugin page name 
                    // value into the corresponding Localizable.strings file.
                    var iter = pluginLocaleDirs.iterator();
                    while (iter.hasNext()) {
                        var localeDir = iter.next();
                        var pluginLocaleFile = new java.io.File(localeDir,
                                pluginStringTableName);
                        var deployLocaleFile = this.getDeployLocaleFile(localeDir.getName());
                        if (pluginLocaleFile && pluginLocaleFile.isFile() && 
                                deployLocaleFile && deployLocaleFile.isFile()) {
                            this.addPluginPageName(pluginPageTitleId,
                                    pluginLocaleFile,
                                    deployLocaleFile);
                        }
                    }
                }
            }
        } catch (e) {
            if (e instanceof CordovaPluginException) {
                throw e;
            }
            throw new CordovaPluginException("Error updating strings for the plugin \"" + this._pluginName + "\"");
        }
    }

    this.getPluginPageTitleId = function() {
        return java.lang.String.format("%s%s", this._pluginName, CORDOVA_PLUGIN_PAGE_TITLE_ID_SUFFIX);
    }

    this.getLprojDirectories = function(settingsBundleDir) {
        var lprojDirs = new java.util.LinkedHashSet();
        var children = settingsBundleDir.listFiles();
        if (children && children.length > 0) {
            for (var i = 0; i < children.length; i++) {
                if (children[i].isDirectory()) {
                    lprojDirs.add(children[i]);
                }
            }
        }
        
        return lprojDirs;
    }

    this.getStringsTableFileName = function(plistFile) {
        var plistStream = new java.io.FileInputStream(plistFile);
        var plistIs = new org.xml.sax.InputSource(plistStream);
        var xmlDocument = new XMLDocument(plistIs);

        try {
            var plistDom = xmlDocument.load();
            var stringTableKeyNode = plistUtils.getFirstKeyNode(plistDom, STRINGS_TABLE_KEY);
            if (stringTableKeyNode) {
                var stringsTableString = plistUtils.getStringNodeAfterKeyNode(stringTableKeyNode);
                var fileNamePrefix = stringsTableString.getTextContent();
                if (fileNamePrefix && fileNamePrefix.length() > 0) {
                    return java.lang.String.format("%s%s", fileNamePrefix, STRINGS_FILE_EXTENSION);
                }
            }
        } catch (e) {
            throw new CordovaPluginException("Error updating strings for the plugin \"" + this._pluginName + "\"");
        } finally {
            if (plistStream) {
                try {
                    plistStream.close();
                } catch (e) {
                    // do nothing
                }
            }
        }

        return EMPTY_STRING;
    }

    this.getDeployLocaleFile = function(localeDirName) {
        var deployLocaleDir = new java.io.File(this._settingsBundleDir,
                localeDirName);
        return new java.io.File(deployLocaleDir, LOCALIZABLE_STRINGS_FILE_NAME);
    }

    this.copyPluginStrings = function(pluginLocaleFile, localeFile) {
        // The .strings file(s) are UTF-16 encoded. Need to read and write
        // them using UTF-16 encoding.
        var pluginResources = fileUtils.readFileToStringWithEncoding(pluginLocaleFile, fileUtils.ENCODING_UTF16);
        var resources = fileUtils.readFileToStringWithEncoding(localeFile, fileUtils.ENCODING_UTF16);
        var allResources = java.lang.String.format("%s%s%s", resources, NEW_LINE, pluginResources);
        fileUtils.writeStringToFileWithEncoding(allResources, localeFile, fileUtils.ENCODING_UTF16);
    }

    this.addPluginPageName = function(pluginPageTitleId, pluginLocaleFile, localeFile) {
        var pluginResources = fileUtils.readFileToStringWithEncoding(pluginLocaleFile, fileUtils.ENCODING_UTF16);
        var pageTitle = this.getPageTitle(pluginPageTitleId, pluginResources);
        var NEW_ENTRY_FORMAT_SPEC = "\"%s\" = %s;";
        var newEntry = java.lang.String.format(NEW_ENTRY_FORMAT_SPEC, pluginPageTitleId, pageTitle);
        var resources = fileUtils.readFileToStringWithEncoding(localeFile, fileUtils.ENCODING_UTF16);
        var allResources = java.lang.String.format("%s%s%s", resources, NEW_LINE, newEntry);
        fileUtils.writeStringToFileWithEncoding(allResources, localeFile, fileUtils.ENCODING_UTF16);
    }

    this.getPageTitle = function(pluginPageTitleId, pluginResources) {
        var QUOTE = "\"";
        var pageIdToken = java.lang.String.format("%s%s%s", QUOTE, pluginPageTitleId, QUOTE);
        var startIdx = pluginResources.indexOf(pageIdToken);
        var pageTitle = EMPTY_STRING;
        if (startIdx > -1) {
            var endIdx = pluginResources.indexOf (";", startIdx);
            if (endIdx > -1) {
                var value = pluginResources.substring(startIdx + pageIdToken.length(), endIdx).trim();
                value = value.replaceFirst("=", EMPTY_STRING);
                pageTitle = value.trim();
            }
        }
        
        if (!pageTitle || EMPTY_STRING.equals(pageTitle)) {
            // If no localized value, use the default - just the name of the plugin.
            pageTitle = java.lang.String.format("%s%s%s", QUOTE, this._pluginName, QUOTE);
        }
        
        return pageTitle;
    }
}
