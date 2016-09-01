
JDTProjectClasspath = function(projectPath, classPathFile)
{
	this.projectPath = projectPath;
	this.classPathFile = classPathFile;
	this.srcCpEntries = new Array();
	this.conCpEntries = new Array();
	this.referenceProjectCpEntries = new Array();
    this.libCpEntries = new Array();
	this.allSrcCpEntries = null;
	
	this.init = function(xpath)
	{
		// the .classpath file is of the form: <classpath><classpathentry .../> <classpathentry ... /> ... </classpath>
		// so select all the classpathentry elements and pull out all the interesting data
        var fi = new java.io.FileInputStream(this.classPathFile);
        try
        {
            var input = new org.xml.sax.InputSource(fi);
            var nodeset = xpath.evaluate("/classpath/classpathentry", input, javax.xml.xpath.XPathConstants.NODESET);
            if (nodeset != null && nodeset.getLength() > 0)
            {
            	for (var i = 0; i < nodeset.getLength(); i++)
            	{
            		var node = nodeset.item(i);
            		if (node instanceof org.w3c.dom.Element)
            		{
            			var kind = node.getAttribute("kind");
            			if ("src".equals(kind))
            			{
            				this.handleSourceFolder(node);
            			}
            			else if ("con".equals(kind))
            			{
            				this.handleCpContainer(node);
            			}
                        else if ("lib".equals(kind))
                        {
                            this.handleLibContainer(node);
                        }
            		}
            	}
            }
            return null;
        }
        finally
        {
            if (fi != null)
            {
                fi.close();
            }
        }
	};
	
	this.getAllSrcCpEntries = function()
	{
		if (this.allSrcCpEntries == null)
		{
			var referencedProjectSrcCpEntries = new Array();
			//Add the srccpentries from the referenced projects also
			for (var index = 0; index < this.referenceProjectCpEntries.length; index++) {
				var referenceProjectEntry = this.referenceProjectCpEntries[index];
				//This returns the JDTProjectClassPath for the referencedProject
				var referenceProjectCp = referenceProjectEntry.referenceProjectClassPath;
				//Now iterate over the referenceProjectEntry's srcCPEntries
				for (var j = 0; j < referenceProjectCp.srcCpEntries.length; j++) {
					var referenceProjectSrcEntry = referenceProjectCp.srcCpEntries[j];
					antHelper.echo("Adding reference project src path " + referenceProjectSrcEntry.absPath + " to the allSrcCpEntries");
					referencedProjectSrcCpEntries.push(referenceProjectSrcEntry);
				}
			}
			this.allSrcCpEntries = referencedProjectSrcCpEntries.concat(this.srcCpEntries);
		}
		return this.allSrcCpEntries;
	};
	this.handleSourceFolder = function(classPathEntryNode)
	{
		var path = classPathEntryNode.getAttribute("path");
		// in jdt, src folder paths either are either relative (no leading slash) to
		// the current project or are absolute (leading slash) starting from the workspace root
	
		// handle local source folder
		if (!path.startsWith("/"))
		{
			var output = classPathEntryNode.getAttribute("output");
            var binDir = null; // this will result default bin folder being used
            if (output != null && !output.trim().isEmpty()) {
            	// here the output is specified, so capture that.
                binDir = output.trim();
            } 
            var cpEntry = new SrcClasspathEntry("src", path, binDir);
            cpEntry.absPath = this.projectPath + "/" + path;
            this.srcCpEntries.push(cpEntry);
		}
		else
		{
			// otherwise, it's a project
			var referredProjectName = path.substring(1);
			var sourceProject = new java.io.File(this.projectPath);
			var workspacePath = sourceProject.getParentFile().getAbsolutePath();

			var refereredProjectDir = new java.io.File(workspacePath,referredProjectName );
			//Analyse the project for further class paths
			var paths = new Array();
			paths.push(refereredProjectDir.getAbsolutePath());
			var referredProjectInfo = new ProjectInformation();
			
			//This will populate everything as part of classpaths in referredProjectInfo
			referredProjectInfo.analyzeProjects(paths);
			
			var classPathCollection = referredProjectInfo.classpaths.values();
			var iterator = classPathCollection.iterator();
			//Since we are analyzing a single project, we are sure that the classpath values will contain a single value
			var referredProjectClassPath = iterator.next();
			
			if(referredProjectClassPath != null){
				var cpEntry = new ReferenceProjectClasspathEntry(referredProjectClassPath);
				this.referenceProjectCpEntries.push(cpEntry);
			}
		}
	};

	this.handleCpContainer = function(classPathEntryNode)
	{
		var path = classPathEntryNode.getAttribute("path");
		// in jdt, "con" or "classpath containers", the path is basically an identifier that JDT
		// can use at compile time.  
		
		// strip any leading "/"
		if (path.startsWith("/"))
	    {
			path = path.substring(1);
	    }
		// the path has one or more segments separated by "/" characters.
		// the first segment identifies the container type and an associated handler
		// the remaining characters provide arguments or hints that provide specifics to the handler
		var segments = path.split("/");
		if (segments.length == 0)
		{
			return;
		}
		
		var id = segments.shift();
		var cpEntry = new ConClasspathEntry("con", path, id, segments.slice(1));
		this.conCpEntries.push(cpEntry);
	};

    this.handleLibContainer = function(classPathEntryNode)
    {
        var path = classPathEntryNode.getAttribute("path");
        // in jdt, "lib" is a library referenced by an absolute or relative path, 

        var cpEntry = new LibClasspathEntry("lib", path);
        this.libCpEntries.push(cpEntry);
    };
    
    
    /**
	 * kind -- a String containing "src"
	 * projectName -- a String containing the project name
	 */
	function ReferenceProjectClasspathEntry(referenceProjectClassPath)
	{
		this.referenceProjectClassPath = referenceProjectClassPath;
	}

	function LibClasspathEntry(kind, path)
    {
        this.kind = kind;
        this.path = path;
    }
    
	/**
	 * kind --  a String containing "con"
	 * path -- the original path from the classpath entry
	 * id -- the first segment of the path used by JDT to identify the container type and associated handlers
	 * hints -- and array zero or more segments of path after the id
	 */
	function ConClasspathEntry(kind, path, id, hints)
	{
		this.kind = kind;
		this.path = path;
		this.id = id;
		this.hints = hints;
		
		this.calcPathId = function()
		{
			var pathId = this.id;
			if (this.hints !== null && this.hints !== undefined && this.hints.length > 0)
			{
				if (pathId !== null && !pathId.isEmpty())
				{
						pathId += ".";
				}
				pathId += this.hints.join(".");
			}

			return pathId;
		};
		/**
		 * If this entry is a JRE container, don't use it at compile time (let javac worry about that).
		 */
		this.useAtCompile = function()
		{
			return !id.contains("org.eclipse.jdt.launching.JRE_CONTAINER")
					&& !id.contains("oracle.eclipse.tools.maf.application.classpath");  // currently the Java build doesn't support this but should
		};

		/**
		 * If this entry is a JRE container or a MAF library container, don't deploy it with the
		 * runtime app because the RT template already provides these.
		 */
		this.useAtRuntime = function()
		{
			return !id.contains("org.eclipse.jdt.launching.JRE_CONTAINER")
						&& !id.equals("oracle.eclipse.tools.maf.libraries");
		};
		this.getLibPropertySet = function()
 		{
			var prefixId = null;
			if ("org.eclipse.jdt.USER_LIBRARY".equals(this.id)) {
				//Create a property set as follows and return it
				//<propertyset id="oepe.maf.classpath.userLibrary.<libName>.jarset">
		        //	<propertyref prefix="oepe.maf.classpath.userLibrary.<libName>"/>
		        //</propertyset>
				
				//This constant should not be changed as it is used to populate properties from ide based deployment
				var prefixId = "oepe.maf.classpath.userLibrary";
				return getOrCreatePropertySet(this.path, prefixId);
			}
			else if(this.id.equals("oracle.eclipse.tools.maf.rest")){
				//Create a property set as follows and return it
				//<libName> could be oracle.eclipse.tools.maf.project.rest.classpath.v21
				//<propertyset id="restLibs.<libName>.jarset">
		        //	<propertyref prefix="restLibs.<libName>"/>
		        //</propertyset>
				
				//This constant should not be changed as it is used to populate properties from ide based deployment
				var prefixId = "restLibs";
				return getOrCreatePropertySet(this.path, prefixId);
			}
			else if (!this.id.contains("org.eclipse.jdt.launching.JRE_CONTAINER"))
			{
	    		var pathId = this.calcPathId();
	     		antHelper.info("Classpath container is " + pathId);
	    		var pathRef = self.project.getReference(pathId);
	    		if (pathRef instanceof org.apache.tools.ant.types.ResourceCollection
	    			  && pathRef.isFilesystemOnly())
	    		{
	    			return pathRef;
	    		}
			}
			//TODO Enhance logic for other containers like MAF Classpath, Rest classpath containers
			return null;
		};
		
		function getOrCreatePropertySet(path, prefixId){
			var segments = path.split("/");
			if (segments.length == 0)
			{
				return null;
			}
			
			var dest = new Array();
			dest.push(prefixId);
			
			for (var index = 1; index < segments.length; index++) {
				dest.push(segments[index]);
			}
			
			var propertyRefPrefix = java.lang.String.join(".", dest);
			dest.push("jarset");
			var propertySetId = java.lang.String.join(".", dest);
			return getOrCreatePropertySet(propertySetId, propertyRefPrefix);
		}
		
		function getOrCreatePropertySet(propertySetId, propertyRefPrefix)
	     {
			if (self.project.hasReference(propertySetId)) {
				return self.project.getReference(propertySetId);
			}

            // Create the PropertySet
            var toReturn = new org.apache.tools.ant.types.PropertySet();
            // Create the PropertyRef
            var propertyref = new org.apache.tools.ant.types.PropertySet.PropertyRef();
            // Set PropertyRef's prefix
            propertyref.setPrefix(propertyRefPrefix);
            // Add the Propertyref in the PropertySet
            toReturn.addPropertyref(propertyref);
            //Set the owner as project otherwise the property set is not resolved
            toReturn.setProject(self.project);
            // Add the propertyset to the project
            self.project.addReference(propertySetId, toReturn);
            
            if (!toReturn.getProperties().isEmpty())
            {
                return toReturn;
            }
            return null;
        };
	}

	function SrcClasspathEntry(kind, path, binDir)
	{
		this.kind = kind;
		this.path = path;
		this.absPath = null;
		this.binDir = binDir;

        this.hasFile = function(relativeFilePath) {
            var file=this.getFile(relativeFilePath);
            if (file != null)
            {
                return file.isFile();
            }
            return false;
        };
        /**
         * @returns a java.io.File pointing to the file discovered relative
         * to my absPath or null if not found.
         */
        this.getFile = function(relativeFilePath) {
            if (this.absPath != null)
            {
                return new java.io.File(this.absPath, relativeFilePath);
            }
            return null;
        };
	}

    this.getDefaultBinFolder = function() 
    {
		var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();

        var fi = new java.io.FileInputStream(this.classPathFile);
        try
        {
            var input = new org.xml.sax.InputSource(fi);
            var defaultOutput = xpath.evaluate("/classpath/classpathentry[@kind='output']", input, javax.xml.xpath.XPathConstants.NODESET);
            if (defaultOutput != null && defaultOutput.getLength() > 0)
            {
                node = defaultOutput.item(0);
                defaultBinDir = node.getAttribute("path");
                antHelper.echo("Default Output: "+defaultBinDir);
                return defaultBinDir;
            }
            return null;
        }
        finally
        {
            if (fi != null)
            {
                fi.close();
            }
        }
    };
};
