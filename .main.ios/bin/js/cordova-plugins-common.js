/*
 * Copyright (c) 2014, Oracle and/or its affiliates. All rights reserved.
 */

eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(self.project.getProperty("oepe.bin.js.dir")+"/loader.js"))));
load("common.js");
load("projects-eclipse.js");


function CordovaPluginDeployUtils() {
    this.ANDROID_PLATFORM = "Android";
    this.IOS_PLATFORM = "iOS";


    this.populateBuildPluginsDir = function() {
        var projectInfo = new ProjectInformation();
        var assemblyProjectPath = self.getProject().getProperty("oepe.adfmf.assembly.project");
        if (!assemblyProjectPath) {
            throw new CordovaPluginException("Assembly project path not found ${oepe.adfmf.assembly.project}");
        }
        var assemblyProjectDir = new java.io.File(assemblyProjectPath);
        if (!assemblyProjectDir || !assemblyProjectDir.isDirectory()) {
            throw new CordovaPluginException("Assembly project not found: " + assemblyProjectPath);
        }

        var oepeMetadata = new java.io.File(assemblyProjectDir, ".oepe");
        if (!oepeMetadata.isFile()) {
            antHelper.echo("Warning: Plugin metadata file not found, " + assemblyProjectPath + "/.oepe");
            return;
        }

        var targetDir = pluginConfigRetriever.getBuildCordovaPluginsDir();
        if (!targetDir) {
            throw new CordovaPluginException("Failed to find build dir for Cordova plugins, ${adf.build.cordova.plugins.dir}");
        }
        if (!targetDir.exists()) {
            targetDir.mkdir();
        }
        var targetDirectoryPath = java.nio.file.Paths.get(targetDir.getAbsolutePath());

        antHelper.echo("Reading plugin metadata in " + oepeMetadata);
        var entriesMap = new java.util.LinkedHashMap();
        var oepeMetadataFS = new java.io.FileInputStream(oepeMetadata);
        var oepeMetadataIS = new org.xml.sax.InputSource(oepeMetadataFS);
        try {
            var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
            var namespaces = new javax.xml.namespace.NamespaceContext({
                getNamespaceURI : function(prefix) {
                    return "http://xmlns.oracle.com/oepe/metadata/1.0";
                },
                getPrefix : function(uri) {return "oepe";},
                getPrefixes : function(uri) {return null;}
            });
            xpath.setNamespaceContext(namespaces);

            var entryNodes = xpath.evaluate(
                    "/oepe:metadata/oepe:mobileAssembly/oepe:cordovaPlugin//oepe:entry",
                    oepeMetadataIS,
                    javax.xml.xpath.XPathConstants.NODESET);
            if (!entryNodes || entryNodes.getLength() == 0) {
                antHelper.echo("Warning: Plugin metadata file, " + assemblyProjectPath
                        + "/.oepe, does not contain plugin file mappings");
                antHelper.echo("Warning: Will look for the plugin in the application controller project src folder.");
                return;
            }

            for (var i = 0; i < entryNodes.getLength(); i++) {
                var entryNode = entryNodes.item(i);
                var typeNode = entryNode.getParentNode();
                var pluginElement = typeNode.getParentNode();
                var pluginURI = pluginElement.getAttribute("uri");
                
                var map = entriesMap.get(pluginURI);
                if (!map) {
                    map = new java.util.LinkedHashMap();
                    entriesMap.put(pluginURI, map);
                }
                
                var targetDir = this.getEntryTargetDir(pluginElement, typeNode);
                if (!targetDir) {
                    continue;
                }
                
                var list = map.get(targetDir);
                if (!list) {
                    list = new java.util.LinkedList();
                    map.put(targetDir, list);
                }
                list.add(entryNode.getTextContent());
            }

            var pluginEntrySetIter = entriesMap.entrySet().iterator();
            while (pluginEntrySetIter.hasNext()) {
                var pluginEntry = pluginEntrySetIter.next();
                var pluginURI = null;
                var pluginFile = null;
                var uri = pluginEntry.getKey();
                if (uri.startsWith("file:/")) {
                    try {
                        pluginURI = new java.net.URI(uri);
                        pluginFile = new java.io.File(pluginURI);
                    } catch (e) {
                        antHelper.echo("Invalid file uri pointing to plugin: " + uri + ". Exception:" + e);
                        continue;
                    }
                } else if (uri.startsWith("platform:/resource")) {
                    try {
                        var folder = new java.net.URI(uri);
                        antHelper.echo(folder.toString());
                        var pathFrags = folder.getRawPath().split("/");
                        // first path is empty because it is the empty string prior to "/resource"
                        // second path fragment is "resource" as tested above.
                        // third path fragment is the project name
                        var projectName = pathFrags[2];
                        var projectPath = projectInfo.projects.get(projectName);
                        if (!projectPath) {
                            antHelper.echo("Cannot find project in workspace to copy plugin file: " + projectName);
                            continue;
                        }
                        var rootUri = new java.io.File(projectPath).toURI();
                        var projectRelativePath = new java.lang.StringBuilder();
                        for (var i = 3; i < pathFrags.length; i++) {
                            var pathFrag = pathFrags[i];
                            projectRelativePath = projectRelativePath.append(pathFrag).append("/");
                        }
                        pluginURI = rootUri.resolve(projectRelativePath.toString());
                        pluginFile = new java.io.File(pluginURI);
                    } catch (e) {
                        antHelper.echo("Invalid uri pointing to plugin: " + uri + ". Exception:" + e);
                        continue;
                    }
                } else {
                    // relative uri
                    var rootUri = assemblyProjectDir.toURI();
                    pluginURI = rootUri.resolve(uri);
                    pluginFile = new java.io.File(pluginURI);
                }
                if (!pluginFile || !pluginFile.exists()) {
                    antHelper.echo("Cannot find plugin file: " + uri);
                    continue;
                }
                antHelper.echo("Creating build plugin from: " + pluginFile);

                try {
                    var containerExplorer = Packages.oracle.eclipse.tools.adf.dtrt.util.ContainerExplorer.create(pluginURI);
                    var dirEntrySetIter = pluginEntry.getValue().entrySet().iterator();
                    while (dirEntrySetIter.hasNext()) {
                        var dirEntry = dirEntrySetIter.next();
                        var targetDir = dirEntry.getKey();
                        var targetPath = targetDirectoryPath.resolve(targetDir);
                        var patterns = dirEntry.getValue();
                        var preparedPatterns = containerExplorer.preparePatterns(patterns);
                        if (preparedPatterns && !preparedPatterns.isEmpty()) {
                            var findResult = containerExplorer.findFiles(preparedPatterns);
                            if (findResult && !findResult.getPathPreparedPatternMap().isEmpty()) {
                                antHelper.echo("Copying " + findResult.getPathPreparedPatternMap().size() + " to " + targetPath.toString());
                                var pathElements = containerExplorer.toPatternPathMap(findResult);
                                if (!pathElements.isEmpty()) {
                                    var copies = containerExplorer.copyToDirectory(pathElements, targetPath, Packages.oracle.eclipse.tools.adf.dtrt.util.ContainerExplorer.CopyOption.REPLACE);
                                }
                            } else {
                                antHelper.echo("No files found to copy to: " + targetPath.toString());
                            }
                        } else {
                            antHelper.echo("No prepared patterns to copy files for: " + targetPath.toString());
                        }
                    }
                } catch (e) {
                    throw new CordovaPluginException("Failure during copy of plugin from: " + uri);
                }
            }
        } finally {
            if (oepeMetadataFS) {
                try {
                    oepeMetadataFS.close();
                } catch (e) {
                    // do nothing
                }
            }
        }
    }

    this.getEntryTargetDir = function(pluginElement, typeNode) {
        var name = pluginElement.getAttribute("name");
        if (!name || "".equals(name)) {
            throw new CordovaPluginException("Missing plugin name attribute: " + pluginElement);
        }

        var platform = pluginElement.getAttribute("platform");
        if (!platform || "".equals(platform) || !this.isValidPlatform(platform)) {
            throw new CordovaPluginException("Missing plugin platform attribute: " + pluginElement);
        }

        var sb = new java.lang.StringBuilder();
        sb.append(name);
        sb.append('/');
        sb.append(platform);

        var entryType = typeNode.getNodeName();
        var index = entryType.indexOf(':');
        if (index > -1) {
            entryType = entryType.substring(index + 1);
        }
        if ("library".equals(entryType)) {
            sb.append("/bin");
        } else if ("dependentLibrary".equals(entryType)) {
            sb.append("/libs");
        } else if ("resource".equals(entryType)) {
            sb.append("/res");
        } else if ("asset".equals(entryType)) {
            sb.append("/assets");
        } else if ("nativeLibrary".equals(entryType)) {
            sb.append("/native-libs");
        } else if ("javaScript".equals(entryType)) {
            // the javascript is configured and copied
            // as part of the view controller.
            return null;
        } else {
            throw new CordovaPluginException("Unknown plugin mapping type \"" + entryType + "\" for plugin: " + name);
        }

        return sb.toString();
    }

    this.getCordovaPlugins = function(deployPlatform, createPluginInfo) {
        this.populateBuildPluginsDir();

        var appplicationXmlLocation = this.getStagingPath() + "/.adf/META-INF/maf-application.xml";
        var applicationXml = new java.io.File(appplicationXmlLocation);
        if (!applicationXml.isFile()) {
            throw new CordovaPluginException("Cannot find staged copy of maf-application.xml at "
                    + appplicationXmlLocation);
        }

        var appXmlFS = new java.io.FileInputStream(applicationXml);
        var appXmlIS = new org.xml.sax.InputSource(appXmlFS);
        var plugins = new Array();
        try {
            var namespaces = new javax.xml.namespace.NamespaceContext({
                getNamespaceURI : function(prefix) {return "http://xmlns.oracle.com/adf/mf";},
                getPrefix : function(uri) {return "adfmf";},
                getPrefixes : function(uri) {return null;}
            });
            var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
            xpath.setNamespaceContext(namespaces);

            var pluginNodes = xpath.evaluate("/adfmf:application/adfmf:cordovaPlugins/adfmf:plugin", appXmlIS, javax.xml.xpath.XPathConstants.NODESET);
            for (i = 0; i < pluginNodes.getLength(); i++) {
                var pluginElem = pluginNodes.item(i);
                if (pluginElem instanceof org.w3c.dom.Element) {
                    var platform = pluginElem.getAttribute("platform");
                    if (deployPlatform.equals(platform)) {
                        var name = pluginElem.getAttribute("name");
                        var pluginConfig = pluginConfigRetriever.getCordovaPluginConfig(name, platform);
                        if (!pluginConfig) {
                            throw new CordovaPluginException("Failed to retrieve configuration information for plugin \"" + name + "\"");
                        }

                        //antHelper.echo("Application Controller project " + appControllerDir.getAbsolutePath());
                        var fullyQualName = pluginElem.getAttribute("fullyQualifiedName");
                        var implClass = pluginElem.getAttribute("implementationClass");
                        var pluginInfo = createPluginInfo(name, fullyQualName, implClass, pluginConfig, pluginElem);
                        if (pluginInfo) {
                            plugins.push(pluginInfo);
                        } else {
                            throw new CordovaPluginException("Failed to get plugin information for the plugin \"" + name + "\".");
                        }
                    }
                }
            }
        } finally {
            if (appXmlFS) {
                try {
                    appXmlFS.close();
                } catch (e) {
                    // do nothing
                }
            }
        }

        return plugins;
    }

    this.isValidPlatform = function(platform) {
        if (deployUtils.ANDROID_PLATFORM.equals(platform)) {
            return true;
        } else if (deployUtils.IOS_PLATFORM.equals(platform)) {
            return true;
        }
        return false;
    }

    this.getStagingPath = function() {
        var stagingPath = self.project.getProperty("adf.build.root.dir");
        if (!stagingPath) {
            throw new CordovaPluginException("Staging path not found ${adf.build.root.dir}");
        }
        return stagingPath;
    }

    this.getNamedChildElements = function(parent, elemName) {
        var namedChildElems = new Array();
        if (parent && elemName) {
            var children = parent.getChildNodes();
            for (var i = 0; i < children.getLength(); i++) {
                var child = children.item(i);
                if (child instanceof org.w3c.dom.Element) {
                    var name = child.getLocalName();
                    if (!name) {
                        name = child.getTagName();
                    }
                    if (elemName.equals(name)) {
                        namedChildElems.push(child);
                    }
                }
            }
        }

        return namedChildElems;
    }

    this.getFirstNamedChildElement = function(parent, elemName) {
        if (parent && elemName) {
            var children = parent.getChildNodes();
            for (var i = 0; i < children.getLength(); i++) {
                var child = children.item(i);
                if (child instanceof org.w3c.dom.Element) {
                    var name = child.getLocalName();
                    if (!name) {
                        name = child.getTagName();
                    }
                    if (elemName.equals(name)) {
                        return child;
                    }
                }
            }
        }

        return null;
    }

    this.getElementTextContent = function(element) {
        var value = null;
        if (element) {
            value = element.getTextContent();
        }
        
        if (!value) {
            value = "";
        }
        
        return value;
    }
}

deployUtils = new CordovaPluginDeployUtils();


function CordovaPluginConfigRetriever()
{
    this._appControllerDir = null;
    this._buildCordovaPluginsDir = null;

    this.getApplicationControllerDir = function() {
        if (!this._appControllerDir) {
            var appControllerProjectName = self.getProject().getProperty("oepe.adfmf.assembly.appControllerFolder");
            var assemblyProject = self.getProject().getProperty("oepe.adfmf.assembly.project");
            if (assemblyProject) {
                var assemblyProjectDir = new java.io.File(assemblyProject);
                if (assemblyProjectDir && assemblyProjectDir.isDirectory()) {
                    var parentDir = assemblyProjectDir.getParentFile();
                    this._appControllerDir = new java.io.File(parentDir, appControllerProjectName);
                }
            }
        }
        return this._appControllerDir;
    }

    this.getBuildCordovaPluginsDir = function() {
        if (!this._buildCordovaPluginsDir) {
            var buildCordovaPluginsPath = self.getProject().getProperty("adf.build.cordova.plugins.dir");
            if (buildCordovaPluginsPath) {
                this._buildCordovaPluginsDir = new java.io.File(buildCordovaPluginsPath);
            } else {
                antHelper.echo("Build dir for Cordova plugins not found, ${adf.build.cordova.plugins.dir}");
            }
        }
        return this._buildCordovaPluginsDir;
    }

    this.getCordovaPluginConfig = function(name, platform) {
        // try application controller location first
        var appControllerDir = this.getApplicationControllerDir();
        if (appControllerDir && appControllerDir.isDirectory()) {
            var pluginRelPath = "src/plugins/" + name + "/" + platform;
            var pluginDir = new java.io.File(appControllerDir, pluginRelPath);
            if (pluginDir && pluginDir.isDirectory()) {
                var pluginConfig = new CordovaPluginConfig(name, platform, pluginDir);
                // determine that there is at least a file present
                // in the bin dir before using app controller location
                var binDir = pluginConfig.getPluginBinDir();
                if (binDir && binDir.isDirectory()) {
                    var files = binDir.listFiles();
                    if (files && files.length > 0) {
                        return pluginConfig;
                    }
                }
            }
        }

        var buildCordovaPluginsDir = this.getBuildCordovaPluginsDir();
        if (buildCordovaPluginsDir && buildCordovaPluginsDir.isDirectory()) {
            var pluginRelPath = name + "/" + platform;
            var pluginDir = new java.io.File(buildCordovaPluginsDir, pluginRelPath);
            if (pluginDir && pluginDir.isDirectory()) {
                return new CordovaPluginConfig(name, platform, pluginDir);
            }
        }

        return null;
    }
}

pluginConfigRetriever = new CordovaPluginConfigRetriever();


CordovaPluginConfig = function(name, platform, pluginRootDir)
{
    this._name = name;
    this._platform = platform;
    this._pluginDir = pluginRootDir;

    this.getName = function() {
        return this._name;
    }

    this.getPlatform = function() {
        return this._platform;
    }

    this.getPluginDir = function() {
        return this._pluginDir;
    }

    this.getPluginBinDir = function() {
        return new java.io.File(this.getPluginDir(), "/bin");
    }

    this.getPluginLibsDir = function() {
        return new java.io.File(this.getPluginDir(), "/libs");
    }

    this.getPluginResDir = function() {
        return new java.io.File(this.getPluginDir(), "/res");
    }
}


CordovaPluginException = function(message)
{
    this.message = message;
    this.toString = function() {
        return "Cordova plugin processing error: " + this.message
    }
}


function CopyUtils()
{
    this.createCopyTask = function(antProject, owningTarget) {
        var copyTask = antProject.createTask("copy");
        copyTask.setOwningTarget(owningTarget);
        copyTask.setProject(antProject);
        return copyTask;
    }

    this.createFileSet = function(targetDir) {
        var fileset = new org.apache.tools.ant.types.FileSet();
        fileset.setDir(targetDir);
        return fileset;
    }

    this.createFileNameMapperForValueRes = function(pluginName) {
        var fileNameMapper = new org.apache.tools.ant.util.ChainedMapper();
        var regexpMapper = new org.apache.tools.ant.util.RegexpPatternMapper();
        regexpMapper.setHandleDirSep(true);
        regexpMapper.setFrom("^value(.*)/(.*)\.xml");
        regexpMapper.setTo("value\\1/\\2_" + pluginName + "\.xml");
        fileNameMapper.add(regexpMapper);
        return fileNameMapper;
    }
}

copyUtils = new CopyUtils();


function MyFileUtils()
{
    this.ENCODING_UTF16 = new java.lang.String("UTF-16");
    this.LINE_SEP = java.lang.System.getProperty("line.separator");

    this.readFileToStringWithEncoding = function(file, encoding) {
        if (!encoding || encoding.length() <= 0) {
            throw new java.lang.IllegalArgumentException();
        }

        var fis = new java.io.FileInputStream(file);
        var streamReader = new java.io.InputStreamReader(fis, encoding);
        var reader = new java.io.BufferedReader(streamReader);
        var result = new java.lang.StringBuilder();

        try {
            var line = reader.readLine();
            while (line != null) {
                result.append(line);
                result.append(this.LINE_SEP);
                line = reader.readLine();
            }
        } finally {
            if (fis) {
                try {
                    fis.close();
                } catch (e) {
                    // do nothing
                }
            }
            if (streamReader) {
                try {
                    streamReader.close();
                } catch (e) {
                    // do nothing
                }
            }
            if (reader) {
                try {
                    reader.close();
                } catch (e) {
                    // do nothing
                }
            }
        }

        return result.toString();
    }

    this.readFileToString = function(reader) {
        var br = new java.io.BufferedReader(reader);
        var result = new java.lang.StringBuilder();

        try {
            var line = br.readLine();
            while (line != null) {
                result.append(line);
                result.append(this.LINE_SEP);
                line = br.readLine();
            }
        } finally {
            if (br) {
                try {
                    br.close();
                } catch (e) {
                    // do nothing
                }
            }
        }

        return result.toString();
    }

    this.writeStringToFileWithEncoding = function(content, file, encoding) {
        if (!encoding || encoding.length() <= 0) {
            throw new java.lang.IllegalArgumentException();
        }

        var parentDir = file.getParentFile();
        if (!parentDir.exists()) {
            parentDir.mkdir();
        }

        var fos = new java.io.FileOutputStream(file, false);
        var osw = new java.io.OutputStreamWriter(fos, java.nio.charset.Charset.forName(encoding).newEncoder());

        try {
            osw.write(content);
            osw.flush();
        } finally {
            if (fos) {
                try {
                    fos.close();
                } catch (e) {
                    // do nothing
                }
            }
            if (osw) {
                try {
                    osw.close();
                } catch (e) {
                    // do nothing
                }
            }
        }
    }

    this.writeStringToFile = function(content, file) {
        var outputStream = new java.io.FileOutputStream(file, false);

        try {
            outputStream.write(content.getBytes());
        } finally {
            if (outputStream) {
                try {
                    outputStream.close();
                } catch (e) {
                    // do nothing
                }
            }
        }
    }

    this.getFilesFromDir = function(pluginDir, pluginFileExtension) {
        var filesWithExt = new java.util.HashSet();
        if (pluginDir && pluginDir.isDirectory()) {
            var allFiles = pluginDir.listFiles();
            if (allFiles && allFiles.length > 0) {
                for (var i = 0; i < allFiles.length; i++) {
                    var extension = this.getFileExtension(allFiles[i].getAbsolutePath());
                    if (extension && extension.equals(pluginFileExtension)) {
                        filesWithExt.add(allFiles[i]);
                    }
                }
            }
        }

        return filesWithExt;
    }

    this.getFileExtension = function(fileName) {
        var i = fileName.lastIndexOf('.');
        if (i > 0 && i < fileName.length() - 1) {
          return "." + fileName.substring(i + 1).toLowerCase();
        }

        return null;
    }

    this.getFileNameNoExt = function(fileName) {
        var dotIndex = fileName.lastIndexOf('.');
        if (dotIndex > 0) {
            return fileName.substring(0, dotIndex);
        }
        return fileName;
    }
}

fileUtils = new MyFileUtils();
