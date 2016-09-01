eval(''
        + new String(org.apache.tools.ant.util.FileUtils
                .readFully(new java.io.FileReader(self.project
                        .getProperty("oepe.bin.js.dir")
                        + "/loader.js"))));
load("common-fars.js");

transformPlugins();

function getPlatform(projectName) {
	if (projectName === 'build-ios'){
		return Packages.oracle.tools.maf.cordova.PluginsHelper.Platform.iOS;
	}else{
		return Packages.oracle.tools.maf.cordova.PluginsHelper.Platform.Android;
	}
}

function getPlatform() {
	var ios = self.getProject().getProperty("xcodebuild.exe");
	if (ios){
		return Packages.oracle.tools.maf.cordova.PluginsHelper.Platform.iOS;
	}else{
		return Packages.oracle.tools.maf.cordova.PluginsHelper.Platform.Android;
	}
}

function transformPlugins() {

	var rtDir = self.getProject().getProperty("adf.rt.zip.root");
	var currentRtDir = self.getProject().getProperty("adf.rt.runtime.root");
	var metaDir = self.getProject().getProperty("oepe.src.root.dir") + '/adf/META-INF';
	var mafAppFileName = metaDir + '/oepe-maf-application.xml';
    var buildDir = self.getProject().getProperty("adf.build.root.dir") + '/.adf/META-INF';
    var mafPluginsFileName = buildDir + '/maf-plugins.xml';
	var coreCordovaPluginsFileName = rtDir + '/' + currentRtDir + '/CordovaPlugins/maf-info.json';
	var oepeCoreCordovaPluginsFileName = rtDir + '/metadata/oepe-core-cordova-plugins.json';

	var mafAppFile = new java.io.File(mafAppFileName);
	if (!mafAppFile || !mafAppFile.exists()) {
		java.lang.System.out.println('ERROR: no file exist: ' + mafAppFile);
		return;
	}
	
	var coreCordovaPluginsFile = new java.io.File(coreCordovaPluginsFileName);
	if (!coreCordovaPluginsFile || !coreCordovaPluginsFile.exists()) {
		java.lang.System.out.println('ERROR: no file exist: ' + coreCordovaPluginsFile);
		return;
	}
	
	var oepeCoreCordovaPluginsFile = new java.io.File(oepeCoreCordovaPluginsFileName);
	if (!oepeCoreCordovaPluginsFile || !oepeCoreCordovaPluginsFile.exists()) {
		java.lang.System.out.println('ERROR: no file exist: ' + oepeCoreCordovaPluginsFile);
		return;
	}
	
    var projectInfo = new ProjectInformation();
    
    var projectDirs = self.project.getReference("oepe.adfmf.eclipse-projects");
    var projectPaths = getProjectPaths(projectDirs);
    projectInfo.analyzeProjects(projectPaths);

    var mafPluginsFile = new java.io.File(mafPluginsFileName);
    
	var status = Packages.oracle.tools.maf.cordova.PluginsHelper.transformPlugins(mafAppFile, oepeCoreCordovaPluginsFile, coreCordovaPluginsFile, mafPluginsFile, projectInfo.projects, getPlatform());
	if (status) {
		if (status.isMultiStatus()){
			var statuses = status.getChildren();
			for(var i=0; i < statuses.length; i++){
				antHelper.echo(statuses[i].getMessage());
			}
		}else if(!status.isOK()){
			antHelper.echo(status.getMessage());
		}
	}else{
		antHelper.echo("No status returned");
	}
}