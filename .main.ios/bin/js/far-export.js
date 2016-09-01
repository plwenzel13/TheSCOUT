/*
importClass(java.io.File);
importClass(javax.xml.parsers.DocumentBuilderFactory);
*/

eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(self.project.getProperty("oepe.bin.js.dir")+"/loader.js"))));
load("common-fars.js");

var projectPath = self.project.getProperty("oepe.adfmf.far.project.path");
var projectDir = new java.io.File(projectPath);
if (!projectDir.isDirectory())
{
	throw new org.apache.tools.ant.BuildException("Can't find project at absolute path "+projectPath);
}

var projectInfo = new ProjectInformation();
var projectPaths = new Array();
projectPaths.push(projectPath);
projectInfo.analyzeProjects(projectPaths);

processProject(projectDir, projectInfo);

var jarBasedir =
	new java.io.File(
		new java.io.File(
			new java.io.File(self.project.getProperty("adf.build.root.dir")),
			self.project.getProperty("oepe.adfmf.staging.relpath.fars")),
		projectDir.getName());
var manifestFile = new java.io.File(new java.io.File(jarBasedir, "META-INF"), "MANIFEST.MF");
var farFile = new java.io.File(self.project.getProperty("oepe.adfmf.far.export.path"));
var createJARTasksTarget = self.project.getTargets().get("createJARTasks");
var createJARTask = self.project.createTask("jar");
createJARTask.setOwningTarget(self.getOwningTarget());
createJARTask.setProject(self.project);
createJARTask.setBasedir(jarBasedir);
createJARTask.setManifest(manifestFile);
createJARTask.setDestFile(farFile);
createJARTasksTarget.addTask(createJARTask);
