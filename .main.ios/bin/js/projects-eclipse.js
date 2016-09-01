
ProjectInformation = function()
{
	this.projects = new java.util.HashMap(); // key = name, value = path
	this.classpaths = new java.util.HashMap(); // key = project path, value = classpath entry
	this.appControllerFolder = null;  // String containing the name of the application controller folder

	this.analyzeProjects = function(projectPaths)
	{	
		var xpath = javax.xml.xpath.XPathFactory.newInstance().newXPath();
	    for (var i = 0; i < projectPaths.length; i++)
	    {
	        var projectPath = projectPaths[i];
	    	antHelper.echo("Analyzing project: "+projectPath);
	        var dotProject = new java.io.File(projectPath, ".project");
	        if (dotProject.isFile())
	        {
	        	antHelper.echo("\tReading .project file.");
	        	var is = new java.io.FileInputStream(dotProject);
	        	try
	        	{
		        	var dotProjectDoc = new XMLDocument(is);
		        	var xmlDoc = dotProjectDoc.load();
		        	var projName = xpath.evaluate("/projectDescription/name/text()", xmlDoc, javax.xml.xpath.XPathConstants.STRING);
		        	if (projName != null && !projName.trim().isEmpty())
		        	{
		        		this.projects.put(projName, projectPath);
		        	}
	        	}
	        	finally
	        	{
	        		if (is != null)
	        		{
	        			try {is.close();} catch (e) {};
	        		}
	        	}
	        }

	        var classPathFile = new java.io.File(projectPath, ".classpath");

	        if (classPathFile.exists()) {
	            antHelper.echo("\tProject is java project: " + projectPath);

	            var projectClassPath = new JDTProjectClasspath(projectPath, classPathFile);
	            projectClassPath.init(xpath);
	            
	            this.classpaths.put(classPathFile.getParentFile().getAbsolutePath(), projectClassPath);
	        }
	    }
	};
};
