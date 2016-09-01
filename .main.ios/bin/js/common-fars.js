// import statements
/*
  importClass(java.io.File);
  importClass(org.xml.sax.InputSource);
  importClass(java.io.FileInputStream);
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
*/

eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(self.project.getProperty("oepe.bin.js.dir")+"/loader.js"))));
load("common.js");
load("classpath-jdt.js");
load("projects-eclipse.js");
load("ws-datacontrol.js");
load("FARExtraFilesGenerator.js");

getProjectPaths = function(projectDirs)
{
  var projectPaths = new Array();
  var projIt = projectDirs.iterator();

  while (projIt.hasNext())
  {
     var resource = projIt.next();
     if (resource instanceof org.apache.tools.ant.types.resources.PropertyResource)
     {
         resource = resource.getValue();
     }
     else if (resource instanceof org.apache.tools.ant.types.resources.FileResource)
     {
         resource = resource.getFile().getAbsolutePath();
     }
     projectPaths.push(resource);
     var file = new java.io.File(resource);
     antHelper.echo("Project: "+file.getAbsolutePath()+" exists = "+file.isDirectory());
  }
  return projectPaths;
};

function ProjectToFarMapping(projectPath, stagingPath)
{
    this.stagingRelPathToFARs = self.project.getProperty("oepe.adfmf.staging.relpath.fars");
    this.projectPath = projectPath;
    this.stagingPath = stagingPath;
    this.hasAppPackage = false;
    this.hasFeaturesToDeploy = false;
    this.srcDirToFarDir = new Array();
    this.libraryMappings = new Array();
    this.wsdls = new Array();

    this.calcFarToDir = function() {
        return new java.io.File(stagingPath+"/"+this.stagingRelPathToFARs+"/"+new java.io.File(this.projectPath).getName());
    };

    /**
     * srcFolderName -- a String containing the path to the source folder
     * binDir -- a java.io.File pointing to the binary output directory for srcFolderName
     */
    this.createSourceFolderMapping = function(srcFolderName, binDir)
    {
        antHelper.info("Mapping Source Folder for "+srcFolderName+" on "+binDir);
        var fullSrcPath = null;
        // src folders that start with "/" indicate project dependencies not real source folders
        if (srcFolderName.indexOf("/") != 0)
        {
            fullSrcPath = this.projectPath + "/" + srcFolderName;
        }
        else
        {
        	return;
        	// bail if a project dep and not real source folder
        }
        var srcDir = new java.io.File(fullSrcPath);
        var isFeatureDir = hasFeatures(srcDir);
        antHelper.info("\tisFeatureDir="+isFeatureDir);

        if (!self.project.getProperty("oepe.adfmf.applicationsrc.folder.name").equals(srcFolderName))
        {
            var fromDir = new java.io.File(binDir.getAbsolutePath());
            var toDir = this.calcFarToDir();
            
            if (isFeatureDir)
            {
                this.srcDirToFarDir.push({
                        fromDir : fromDir,
                        toDir : toDir,
                        includes : "**",
                        packageType : "singleFar",
                        srcFolderName : fullSrcPath
                });
                this.hasFeaturesToDeploy = true;
            }
            else
            {
                this.srcDirToFarDir.push({
                        fromDir : fromDir,
                        toDir : toDir,
                        includes : "**",
                        packageType : "allFars",
                        srcFolderName : fullSrcPath
                });
            }
        }
        else
        {
            if (isFeatureDir)
            {
                throw new org.apache.tools.ant.BuildException("Can't have features defined in the application controller source folder: "+
                        "project= "+projectPath.getName()+
                        "binDir= "+binDir.getName()+
                        "fullPath= "+binDir.getAbsolutePath());
            }
            // copy the application src folder into the app controller folder.
            this.srcDirToFarDir.push(
                { 
                  fromDir : new java.io.File(binDir.getAbsolutePath()),
                  toDir : new java.io.File(stagingPath+"/"+stagingRelPathToFARs+"/"+self.project.getUserProperty("oepe.adfmf.assembly.appControllerFolder")),
                  includes : "**",
                  packageType : "applicationOnly",
                  srcFolderName : fullSrcPath
                });
            this.hasAppPackage = true;
        }
    };
    
    this.createReferenceProjectSourceFolderMapping = function(referenceProjectSrcPath, referenceProjectBinDir, targetProjectBinDir)
     {
		antHelper.info("Mapping Reference Folder for "
				+ referenceProjectSrcPath + " on " + referenceProjectBinDir);
		var fromDir = new java.io.File(referenceProjectBinDir);
		var toDir = this.calcFarToDir();
		this.srcDirToFarDir.push({
			fromDir : fromDir,
			toDir : toDir,
			includes : "**",
			packageType : "singleFar",
			srcFolderName : referenceProjectSrcPath
		});
	};

    /**
	 * wsdls -- array of {src: java.io.File, dest: string} pointing to wsdl
	 * files to deploy
	 */
    this.addWsdlFiles = function(wsdls)
    {
        antHelper.echo("addWsdlFiles: "+wsdls[0].src);
        this.wsdls = wsdls;
    };

    this.createLibraryFolderMapping = function(cpName, path, useAtRuntime)
    {
        antHelper.info("createLibraryFolderMapping: "+path);
        var fullLibPath = null;
        // src folders that start with "/" indicate project dependencies not real source folders
        if (!new java.io.File(path).isAbsolute())
        {
            fullSrcPath = this.projectPath + "/" + path;
        }
        else
        {
            fullSrcPath = path;
        }
        var fromFile = new java.io.File(fullSrcPath);
        var toDir = this.calcFarToDir();
        this.libraryMappings.push({containerName : cpName, fromFile : fromFile, toDir : toDir, unresolved : false, useAtRuntime : useAtRuntime});
    }

    this.createUnresolvedLibraryFolderMapping = function(path)
    {
    	antHelper.info("createUnresolvedLibraryFolderMapping: "+path);
        this.libraryMappings.push({containerName : path, fromFile : null, toDir : null, unresolved : true, useAtRuntime : false});
    }
    
    this.createCopyTasks = function createCopyTasks(antProject, owningTarget)
    {
        var tasks = new Array();
        for (var i = 0; i < this.srcDirToFarDir.length; i++)
        {
            var mapping = this.srcDirToFarDir[i];
            
            // the case where the application controller lives in the same project as other fars
            if ("applicationOnly".equals(mapping.packageType))
            {
                var copyTask = createCopyTask(antProject, owningTarget);

                copyTask.setTodir(mapping.toDir);
         
                copyTask.add(createFileSet(mapping.fromDir));
                tasks.push(copyTask);
                antHelper.info("applicationOnly: copy from "+mapping.fromDir+" to dir "+mapping.toDir);
            }
            // a stand-alone view controller project
            else if ("singleFar".equals(mapping.packageType))
            {
                var copyTask = createCopyTask(antProject, owningTarget);

                copyTask.setTodir(mapping.toDir);
                copyTask.add(createFileSet(mapping.fromDir));
                tasks.push(copyTask);
                antHelper.info("singleFar: copy from "+mapping.fromDir+" to dir "+mapping.toDir);
                copyPublicHtmlIfExists(antProject, this.projectPath, owningTarget, mapping.toDir, tasks);
            }
            else if ("allFars".equals(mapping.packageType))
            {
                if (!this.hasAppPackage && this.hasFeaturesToDeploy)
                {
                    // if there was no app package present but there are features,
                    // then assume this project is a view controller and push non-feature
                    // source folders into only project's far
                    var copyTask = createCopyTask(antProject, owningTarget);

                    copyTask.setTodir(mapping.toDir);
                    copyTask.add(createFileSet(mapping.fromDir));
                    tasks.push(copyTask);
                    antHelper.info("allFars/singleFar: copy from "+mapping.fromDir+" to dir "+mapping.toDir);
                }
                else
                {
                    // this is the more complicated one.  these are source packages that should be 
                    // available either to all feature fars individually if there is no application folder in this 
                    // project; else make it available to the application far.
                    // note that the application fars' classloader is global to all fars
                    var matchPackageType = "singleFar";
                        if (this.hasAppPackage || !this.hasFeaturesToDeploy)
                    {
                        matchPackageType = "applicationOnly";
                    }
                        
                    var added = false;
                    for (var j = 0; j < this.srcDirToFarDir.length; j++)
                    {
                        var copyTask = createCopyTask(antProject, owningTarget);
                        if (matchPackageType.equals(this.srcDirToFarDir[j].packageType))
                        {
                            copyTask.setTodir(this.srcDirToFarDir[j].toDir);
                            copyTask.add(createFileSet(mapping.fromDir));
                            tasks.push(copyTask);
                            added = true;
                            antHelper.info("allFars: copy from "+mapping.fromDir+" to dir "+this.srcDirToFarDir[j].toDir);
                        }
                    }
                    
                    // if there was no application to add to and that's what we wanted,
                    // then create one.
                    // The case where the AppController lives in its own project
                    if (!added && "applicationOnly".equals(matchPackageType))
                    {
                        var copyTask = createCopyTask(antProject, owningTarget);
                        var stagingRelPathToFARs = self.project.getProperty("oepe.adfmf.staging.relpath.fars");
                        var appControllerFolder = self.project.getProperty("oepe.adfmf.assembly.appControllerFolder");
                        // BUG 17792852 -- rename the appcontrollerfolder to "ApplicationController".  This matches the
                        //  a change in buildCompileFars.  We need to do this because of a bug in the rt introduced in
                        //  v1.3.  Probably want to change this to a more robust workaround since it will be here for a while.   -->
                        var toFile= new java.io.File(stagingPath+"/"+stagingRelPathToFARs+"/"+appControllerFolder);
                              //+self.project.getUserProperty("oepe.adfmf.assembly.appControllerFolder"));
                        copyTask.setTodir(toFile);
                        copyTask.add(createFileSet(mapping.fromDir));
                        tasks.push(copyTask);
                        antHelper.info("allFars/applicationOnly: copy from "+mapping.fromDir+" to dir "+toFile);
                        copyPublicHtmlIfExists(antProject, this.projectPath, owningTarget, toFile, tasks);
                    }
                }   
            }
        }
        for (var i = 0; i < this.libraryMappings.length; i++)
        {
            var lib = this.libraryMappings[i];
            if (!lib.unresolved && lib.useAtRuntime)
            {
	            antHelper.info("Copy library "+lib.fromFile+" to "+lib.toDir);
	            var copyTask = createCopyTask(antProject, owningTarget);
	            copyTask.setTodir(lib.toDir);
	            copyTask.setFile(lib.fromFile);
	            tasks.push(copyTask);
            }
            else
            {
                antHelper.echo("WARNING: The following classpath container could not be resolved to an Ant Path object or a valid User Library: "+ lib.fromFile+" Java compilation may fail");
            }
        }
        if (this.wsdls != null)
        {
            for (var i = 0; i < this.wsdls.length; i++)
            {
                antHelper.echo(this.wsdls[i]);
                var copyTask = createCopyTask(antProject, owningTarget);
                var toFile = new java.io.File(this.calcFarToDir(), this.wsdls[i].dest).getParentFile();
                copyTask.setTodir(toFile);
                copyTask.setFile(this.wsdls[i].src);
                tasks.push(copyTask);
            }
        }
        return tasks;
    };

    function copyPublicHtmlIfExists(antProject, projectPath, owningTarget, toDir, tasks)
    {
        var publicHtmlFolderName = antProject.getProperty("oepe.adfmf.publichtml.folder.name");
        var publicHtmlDir = new java.io.File(projectPath, publicHtmlFolderName);
        if (publicHtmlDir != null && publicHtmlDir.isDirectory())
        {
            copyTask = createCopyTask(antProject, owningTarget);
            copyTask.setTodir(toDir);
            var fileset = new org.apache.tools.ant.types.FileSet();
            antHelper.info("public_html is: "+publicHtmlDir);
            fileset.setDir(projectPath);
            fileset.setIncludes(publicHtmlFolderName+"/**");
            fileset.setProject(self.project);
            copyTask.add(fileset);
            var globMapper = copyTask.createMapper();
            var mapperType = new org.apache.tools.ant.types.Mapper.MapperType();
            mapperType.setValue("glob");
            globMapper.setType(mapperType);
            globMapper.setFrom(publicHtmlFolderName+"*");
            globMapper.setTo("public_html*");
            tasks.push(copyTask);
        }
        antHelper.info("publichtml: copy from "+projectPath+" to dir "+toDir);
    }

    function createCopyTask(antProject, owningTarget)
    {
        var copyTask = antProject.createTask("copy");
        copyTask.setOwningTarget(owningTarget);
        copyTask.setProject(antProject);
        return copyTask;
    }
    function createDeleteTask(antProject, owningTarget)
    {
        var deleteTask = antProject.createTask("delete");
        deleteTask.setOwningTarget(owningTarget);
        deleteTask.setProject(antProject);
        return deleteTask;
    }
    function createJavacTask(antProject, owningTarget)
    {
        var javacTask = antProject.createTask("javac");
        javacTask.setOwningTarget(owningTarget);
        javacTask.setProject(antProject);
        return javacTask;
    }
    
    /**
     * targetDir -- a java.io.File pointing to where the fileset should reference its dir attribute.
     */
    function createFileSet(targetDir)
    {
        var fileset = new org.apache.tools.ant.types.FileSet();
        fileset.setDir(targetDir);
        return fileset;
    }
    
    function addJarsFrom(jarDirectory, javacTask)
    {
    	var classpathElem = javacTask.createClasspath();
    	var jarFileSet = createFileSet(jarDirectory);
    	jarFileSet.setIncludes("**/*.jar");
    	classpathElem.addFileset(jarFileSet);
    	javacTask.setClasspath(classpathElem);
    }
    
    /**
	 * projectClassPath -- a JDTProjectClasspath object containing info about a
	 * project classpath javacTask -- an ant javac task object that will have
	 * classpath objects added to its compile-time classpath
	 */
    function processClasspathContainers(mappings, projectClassPath, javacTask){
    	antHelper.info("Processing "+projectClassPath.conCpEntries.length+" entries.");
		var classpathElem = javacTask.createClasspath();
    	for (var i = 0; i < projectClassPath.conCpEntries.length; i++)
    	{
    		var cpEntry = projectClassPath.conCpEntries[i];
    		// don't bother with entries marked for non-use at compile.
    		if (!cpEntry.useAtCompile())
			{
    			continue;
			}
    		var propertySet = cpEntry.getLibPropertySet();

    		if(propertySet instanceof org.apache.tools.ant.types.ResourceCollection)
    		{
    			if (propertySet.isFilesystemOnly())
    			{
    				classpathElem.add(propertySet);
    			}
    			else
    			{
    				var projIt = propertySet.iterator();
    				var fileListObj = new org.apache.tools.ant.types.FileList();
    				while (projIt.hasNext()) {
    					var resource = projIt.next();
    					fileListObj.setFiles(resource);
    				}
    				classpathElem.addFilelist(fileListObj);
    			}
        		antHelper.info("Resolved class path for " + cpEntry.path + " is " +  classpathElem);
    		}
    	}
		javacTask.setClasspath(classpathElem);
    }

    /**
     * projectClassPath -- a JDTProjectClasspath object containing info about a project classpath
     * javacTask -- an ant javac task object that will have classpath objects added to its compile-time classpath
     */
    function processSourceFolders(projectClassPath, javacTask)
    {
        var allSrcCpEntries = projectClassPath.getAllSrcCpEntries();
        for (var i = 0; i < allSrcCpEntries.length; i++)
        {
            var cpEntry = allSrcCpEntries[i];
            var classpathElem = javacTask.createClasspath();
            var sourceDir = new org.apache.tools.ant.types.DirSet();
            sourceDir.setDir(new java.io.File(cpEntry.absPath));
            sourceDir.setExcludes("*/**");
            classpathElem.add(sourceDir);
            javacTask.setClasspath(classpathElem);
        }
    }

    /**
     * projectClassPath -- a JDTProjectClasspath object containing info about a project classpath
     * javacTask -- an ant javac task object that will have classpath objects added to its compile-time classpath
     */
    function processLibraries(projectPath, projectClassPath, javacTask)
    {
        for (var i = 0; i < projectClassPath.libCpEntries.length; i++)
        {
            var libEntry = projectClassPath.libCpEntries[i];
            var path = libEntry.path;
            antHelper.info("ClassPath Library: "+path);
            var classpathElem = javacTask.createClasspath();
            var libPath = classpathElem.createPath();
            libPath.setPath(projectPath + "/"+  path);
            classpathElem.add(libPath);
            self.log(classpathElem);
            javacTask.setClasspath(classpathElem);
        }
    };

    /**
     * binDir -- a java.io.File into a build directory. binDir.isDirectory() must be true.
     */
    function hasFeatures(binDir)
    {
        var adfFile = new java.io.File(binDir, "/META-INF/maf-feature.xml");
        return adfFile.isFile();
    }
    
    this.createJavacTasks = function(antProject, owningTarget, projectClassPath)
    {
        // add javac task.  Note that these tasks are run optionally and not normally from within Eclipse
        var tasks = new Array();
        for (var i = 0; i < this.srcDirToFarDir.length; i++)
        {
            var mapping = this.srcDirToFarDir[i];
            if (mapping.srcFolderName != null)
            {
                // compile java files to class files targetting 1.4 and copy to destination directory (fromDir for FAR copying)
                var javacTask = createJavacTask(antProject, owningTarget);
                var srcdir = new org.apache.tools.ant.types.Path(antProject, mapping.srcFolderName);
                javacTask.setSrcdir(srcdir);
                javacTask.setDestdir(mapping.fromDir);
                javacTask.setTarget("1.8");
                javacTask.setSource("1.8"); // required to be set in tandem with setTarget
                javacTask.setIncludeantruntime(false);
                javacTask.setIncludes("**/*.java");  // compile java files, ignore everything else.
                var sourcePath = javacTask.createSourcepath();
                javacTask.setSourcepath(sourcePath); // empty to suppress -source-path and use -class-path for both source and class file searchs
                processSourceFolders(projectClassPath, javacTask);
                processClasspathContainers(this, projectClassPath, javacTask);
                processLibraries(this.projectPath, projectClassPath, javacTask);
                tasks.push(javacTask);

                // copy other resources, for now don't support filters
                var javaResCopyTask = createCopyTask(antProject, owningTarget);
                javaResCopyTask.setTodir(mapping.fromDir); // the FAR copying fromDir is the build output dir we want to copy to
                var javaResCopyFileset = createFileSet(new java.io.File(mapping.srcFolderName));  // copy from the source dir to the build dir
                javaResCopyFileset.setExcludes("**/*.java,**/*.class");
                javaResCopyTask.add(javaResCopyFileset);
                tasks.push(javaResCopyTask);
            }
        }
        return tasks;
    };

    this.createJavaCleanTasks = function(antProject, owningTarget) {
        // add javac task.  Note that these tasks are run optionally and not normally from within Eclipse
        var tasks = new Array();
        for (var i = 0; i < this.srcDirToFarDir.length; i++)
        {
            var mapping = this.srcDirToFarDir[i];
            if (mapping.srcFolderName != null)
            {
                // delete output folders
                var deleteTask = createDeleteTask(antProject, owningTarget);
                // fromDir is the build output dir that will be copied to the FAR
                deleteTask.setDir(mapping.fromDir);
                tasks.push(deleteTask);
            }
        }
        return tasks;
    };
    
}

processProject = function(projectPath, projectInfo, analyzeOnly) {
    antHelper.echo("Processing project: " + projectPath);

    var projectClassPath = projectInfo.classpaths.get(projectPath.getAbsolutePath());
    if (projectClassPath != null)
    {
        var stagingPath = self.project.getProperty("adf.build.root.dir");
	    var defaultBinFolder = projectClassPath.getDefaultBinFolder();
	
	    var mappings = new ProjectToFarMapping(projectPath, stagingPath);
	    for (var j = 0; j < projectClassPath.srcCpEntries.length; j++) {
	        var cpEntry = projectClassPath.srcCpEntries[j];
	        var binDir = cpEntry.binDir;
	        if (binDir == null)
	        {
	         	binDir = defaultBinFolder;
	        }
	        var binDirFs = new java.io.File(projectPath, binDir);
            if (!binDirFs.isDirectory()) {
                binDirFs.mkdirs();
            }
            mappings.createSourceFolderMapping(cpEntry.path, binDirFs);

            if (cpEntry.hasFile("META-INF/adfm.xml"))
            {
                antHelper.info("Detected adfm.xml. Processing data controls.");
                var wsdls = new AdfmSupport(cpEntry, projectClassPath, projectPath).findWsDCWsdlFiles();
                if (wsdls != null && wsdls.length > 0)
                {
                    mappings.addWsdlFiles(wsdls);
                }
            }
        }
	    
	    //This should copy the classes from reference project to this project
	    for (var j = 0; j < projectClassPath.referenceProjectCpEntries.length; j++) {
	        var referencedProjectCpEntry = projectClassPath.referenceProjectCpEntries[j];
	        var targetBinDir = defaultBinFolder;
	        var targetBinDirFs = new java.io.File(projectPath, targetBinDir);
            if (!targetBinDirFs.isDirectory()) {
                targetBinDirFs.mkdirs();
            }
	        //Now iterate over this referenceProjectCpEntry to get all the source folders
	    	var referencedProjectJDTCpEntry = referencedProjectCpEntry.referenceProjectClassPath;
	        for (var index = 0; index < referencedProjectJDTCpEntry.srcCpEntries.length; index++) {
				var cpEntry = referencedProjectJDTCpEntry.srcCpEntries[index];
			    var defaultReferenceProjectBinFolder = referencedProjectJDTCpEntry.getDefaultBinFolder();

				var referenceProjectBinDir = cpEntry.binDir;
		        if (referenceProjectBinDir == null)
		        {
		         	referenceProjectBinDir = defaultReferenceProjectBinFolder;
		        }
		       	
		        //First argument is full absoulte path of reference project src folder
		        //Second argument is full absolute path of reference project bin folder
		        //Third argument is full absolute path of target bin dir absolute path
		        var referenceProjectBinDirFs = new java.io.File(referencedProjectJDTCpEntry.projectPath, referenceProjectBinDir);
	            mappings.createReferenceProjectSourceFolderMapping(cpEntry.absPath, referenceProjectBinDirFs.getAbsolutePath(), targetBinDirFs.getAbsolutePath());
            }
        }

	    // mappings for lib's
        for (var j = 0; j < projectClassPath.libCpEntries.length; j++)
        {
            var libEntry = projectClassPath.libCpEntries[j];
            var path = libEntry.path;
            antHelper.info("Create mapping for library classpath entry: "+path);
            mappings.createLibraryFolderMapping("lib", path, true);
        }
        
        // mappings for con's
    	for (var i = 0; i < projectClassPath.conCpEntries.length; i++)
    	{
    		var cpEntry = projectClassPath.conCpEntries[i];
    		var propertySet = cpEntry.getLibPropertySet();

    		if(propertySet instanceof org.apache.tools.ant.types.ResourceCollection)
    		{
        		antHelper.info("Resolved class path for " + cpEntry.path + " is " +  propertySet);
				var projIt = propertySet.iterator();
				while (projIt.hasNext()) {
					var resource = projIt.next();
		            antHelper.info("Create mapping for resolved library entry: "+resource);
		            if (cpEntry.useAtCompile())
		            {
		            	mappings.createLibraryFolderMapping(cpEntry.path, resource, cpEntry.useAtRuntime());
		            }
				}
    		}
    		else
    		{
    			if (cpEntry.useAtCompile())
    			{
	    			antHelper.info("Unresolved library property set: "+cpEntry.path);
	    			mappings.createUnresolvedLibraryFolderMapping(cpEntry.path);
    			}
    		}
    	}
        var javacTasks = mappings.createJavacTasks(self.project, self.getOwningTarget(), projectClassPath);
        targetToUpdate = self.project.getTargets().get("maybeCompileJava");
        for (var t = 0; t < javacTasks.length; t++)
        {
            var task = javacTasks[t];
            targetToUpdate.addTask(task);
        }
        
        //Moving the task below createJavacTasks call as createJavacTasks method may add libraries to be copied
        var tasks = mappings.createCopyTasks(self.project, self.getOwningTarget());
        var targetToUpdate = self.project.getTargets().get("runCopyTasks");
        for (var t = 0; t < tasks.length; t++) {
            var task = tasks[t];
            targetToUpdate.addTask(task);
        }

        var deleteJavaTasks = mappings.createJavaCleanTasks(self.project, self.getOwningTarget());
        var maybeCleanJavaTask = self.project.getTargets().get("maybeCleanJava");
        for (var t = 0; t < deleteJavaTasks.length; t++)
        {
            var task = deleteJavaTasks[t];
            maybeCleanJavaTask.addTask(task);
        }

        if (FARUtils.isFeatureProject(projectPath)) {   
            new FARExtraFilesGenerator(projectPath).generate();
        }

        var libraries = FARUtils.getLibrariesForProject(projectPath);
        if (libraries != null && libraries.size() > 0) {
            var toDir = new java.io.File(new java.io.File(new java.io.File(new java.io.File(stagingPath), self.project.getProperty("oepe.adfmf.staging.relpath.fars")), projectPath.getName()), "lib");
            var runCopyTasksTarget = self.project.getTargets().get("runCopyTasks");
	        var itLibraries = libraries.iterator();
	        while (itLibraries.hasNext()) {
	            var itLibrary = itLibraries.next();
	            var copyTask = self.project.createTask("copy");
                copyTask.setOwningTarget(self.getOwningTarget());
                copyTask.setProject(self.project);
                copyTask.setTodir(toDir);
                copyTask.setFile(new java.io.File(itLibrary));
                runCopyTasksTarget.addTask(copyTask);
            }
        }
        return mappings;
    }
};
 

getApplicationControllerFolder = function(projectPaths) {
    var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();

    for (var i = 0; i < projectPaths.length; i++) {
        var projectPath = projectPaths[i];
        var dotAdf = new java.io.File(projectPath, self.project
                .getProperty("oepe.adfmf.dotadf.applicationxml.root.path"));
        if (dotAdf.isDirectory()) {
            var adfFile = new java.io.File(dotAdf, "META-INF/maf-application.xml");
            if (adfFile.isFile()) {
            self.project.setUserProperty(
                    "oepe.adfmf.assembly.dotadf.dir.path", dotAdf
                                .getAbsolutePath());

            var adfFileFD = null;
            try {
                    self.project.setUserProperty("oepe.adfmf.assembly.project",
                            projectPath);
                    adfFileFD = new java.io.FileInputStream(adfFile);
                    adfFileIS = new org.xml.sax.InputSource(adfFileFD);

					var namespaces = new javax.xml.namespace.NamespaceContext({
								getNamespaceURI : function(prefix) {
									return "http://xmlns.oracle.com/adf/mf";
								},
								getPrefix : function(uri) {
									return "adfmf";
								},
								getPrefixes : function(uri) {
									return null;
								}
							});
					xpath.setNamespaceContext(namespaces);

					var appControllerFolder = xpath.evaluate(
							"/adfmf:application/@appControllerFolder",
							adfFileIS, javax.xml.xpath.XPathConstants.STRING);
					if (appControllerFolder != null) {
						self.project.setUserProperty(
								"oepe.adfmf.assembly.appControllerFolder",
								appControllerFolder);
						return appControllerFolder;
					}
				} finally {
					if (adfFileFD != null) {
						adfFileFD.close();
						adfFileFD = null;
					}
				}
			}
		}
	}
    // make sure we default the app controller folder if we couldn't find one
    self.project.setUserProperty(
            "oepe.adfmf.assembly.appControllerFolder",
            "ApplicationController");
	return null;
};
  getImportedFarPaths = function(projectInfo)
  {
      var assemblyProjectPath = self.project.getProperty("oepe.adfmf.assembly.project");
      var stagingPath = self.project.getProperty("adf.build.root.dir");
      var farsRelPath = self.project.getProperty("oepe.adfmf.staging.relpath.fars");
      var farsStagingPath = new java.io.File(new java.io.File(stagingPath), farsRelPath);

      if (assemblyProjectPath != null)
      {
          var assemblyRootDir = new java.io.File(assemblyProjectPath);
          if (assemblyRootDir.isDirectory())
          {
              antHelper.info("Analyzing imported fars in "+assemblyRootDir);
              var oepeMetadata = new java.io.File(assemblyRootDir, ".oepe");
              if (oepeMetadata.isFile())
              {
                  antHelper.info("Reading oepe metadata in "+oepeMetadata);
                  try
                  {
                      var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
                      var namespaces = new javax.xml.namespace.NamespaceContext({
                            getNamespaceURI : function(prefix) {
                                return "http://xmlns.oracle.com/oepe/metadata/1.0";
                            },
                            getPrefix : function(uri) {
                                return "oepe";
                            },
                            getPrefixes : function(uri) {
                                return null;
                            }
                        });
                        xpath.setNamespaceContext(namespaces);

                        var importedFarNodes = xpath.evaluate(
                                "/oepe:metadata/oepe:mobileAssembly/oepe:featureArchive",
                                new org.xml.sax.InputSource(new java.io.FileInputStream(oepeMetadata)),
                                javax.xml.xpath.XPathConstants.NODESET);
                        var counter = 1;
                        antHelper.info("importedFarNodes.getLength(): "+importedFarNodes.getLength());
                        for (var i = 0; i < importedFarNodes.getLength(); i++)
                        {
                            var importedFarElement = importedFarNodes.item(i);
                            var uri = importedFarElement.getAttribute("uri");
                            if (uri != null)
                            {
                                var farFile = null;
                                if (uri.startsWith("file:/"))
                                {
                                    try
                                    {
                                        var farsFolder = new java.net.URI(uri);
                                        farFile = new java.io.File(farsFolder);
                                    }
                                    catch (e)
                                    {
                                        antHelper.echo("Invalid file uri pointing to imported far: "+uri+". Exception:"+e);
                                        continue;
                                    }
                                }
                                else if (uri.startsWith("platform:/resource"))
                                {
                                    try
                                    {
                                        var farsFolder = new java.net.URI(uri);
                                        antHelper.info("FarsFolder.toString(): "+farsFolder.toString());
                                        var pathFrags = farsFolder.getRawPath().split("/");
                                        // first path is empty because it is the empty string prior to "/resource"
                                        // second path fragment is "resource" as tested above.
                                        // third path fragment is the project name
                                        var projectName = pathFrags[2];
                                        var projectPath = projectInfo.projects.get(projectName);
                                        if (projectPath === undefined || projectPath === null)
                                        {
                                            antHelper.echo("Couldn't find project in workspace to include a far file: "+projectName);
                                            continue;
                                        }
                                        var rootUri = new java.io.File(projectPath).toURI();
                                        var projectRelativePath = new java.lang.StringBuilder();
                                        for (var i = 3; i < pathFrags.length; i++)
                                        {
                                            var pathFrag = pathFrags[i];
                                            projectRelativePath = projectRelativePath.append(pathFrag).append("/");
                                        }
                                        antHelper.info("Project relative path: "+projectRelativePath.toString());
                                        var farsFolder = rootUri.resolve(projectRelativePath.toString());
                                        farFile = new java.io.File(farsFolder);
                                        antHelper.info("Workspace relative: "+farFile);
                                    }
                                    catch (e)
                                    {
                                        antHelper.echo("A problem occurred loading a far imported by workspace uri: "+uri+".");
                                        antHelper.echo(e.javaException.printStackTrace());
                                        continue;
                                    }
                                }
                                else
                                {
                                    var rootUri = new java.io.File(assemblyProjectPath).toURI();
                                    var farsFolder = rootUri.resolve(uri);
                                    farFile = new java.io.File(farsFolder);
                                    if (!farFile.isFile())
                                    {
                                        antHelper.echo("Could not find imported far file in the assembly project: "+uri);
                                        continue;
                                    }
                                    antHelper.echo("Deploying relative path far "+farFile);
                                }
                                var label = importedFarElement.getAttribute("label");
                                if (label == null)
                                {
                                    label = "_unlabeled_far_"+counter++;
                                }
                                farsStagingPath = new java.io.File(farsStagingPath, label);
                                antHelper.info("Adding imported far: "+farFile.getAbsolutePath());
                                var unzipTask = self.project.createTask("unzip");
                                var targetToUpdate = self.project.getTargets().get("runCopyTasks");
                                unzipTask.setSrc(farFile.getCanonicalFile());
                                unzipTask.setDest(farsStagingPath);
                                unzipTask.setOwningTarget(targetToUpdate);
                                targetToUpdate.addTask(unzipTask);
                            }
                        }
                  }
                  catch (e)
                  {
                      antHelper.echo(e);
                  }
              }
          }
      }
  };
  /**
   * 
   * @param analyzeOnly -- if false (default), processing tasks are added to the calling ant self.project, if true,
   * it's more like a dry-run that calculates everything but doesn't modify self.project.
   */
  processApplication = function()
  {
	  var projectDirs = self.project.getReference("oepe.adfmf.eclipse-projects");
	  var projectPaths = getProjectPaths(projectDirs);
	  var appControllerFolder = getApplicationControllerFolder(projectPaths);
	    
	  if (appControllerFolder == null)
	  {
	    throw new org.apache.tools.ant.BuildException("No amfmf-application.xml found in project or no appControllerFolder attribute defined");
	  }

	  var projectInfo = new ProjectInformation();
	  projectInfo.analyzeProjects(projectPaths);

	  var mappingsByProject = new Array();
	  // iterate over that array
	  for (var i=0; i<projectPaths.length; i++) {
	    // create and use a Task via Ant API
	    var projDir = projectPaths[i];
	    var projectPath = new java.io.File(projDir);

	    var mappings = processProject(projectPath, projectInfo);
	    mappingsByProject.push(mappings);
	  }
	  
	  getImportedFarPaths(projectInfo);
	  
	  return mappingsByProject;
  };