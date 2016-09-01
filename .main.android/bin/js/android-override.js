
echo = function(message) { var echo = self.project.createTask("echo"); echo.setMessage(message); echo.perform(); };

getAttribute = function(prop) { return self.project.getProperty(prop);};

var buildRootDir = self.project.getProperty("adf.build.root.dir");
var basedir = self.project.getProperty("basedir");

try
{
	echo("oldBasedir = " +basedir);
    self.project.setBasedir(buildRootDir);
	echo("newBasedir = "+self.project.getProperty("basedir"));
	var gettarget = self.project.createTask("oepe_original_gettarget");
	
    gettarget.setAndroidJarFileOut(getAttribute("oepe.override.android.value.androidJarFileOut"));
    gettarget.setAndroidAidlFileOut(getAttribute("oepe.override.android.value.androidAidlFileOut"));
    gettarget.setBootClassPathOut(getAttribute("oepe.override.android.value.bootClassPathOut"));
    gettarget.setTargetApiOut(getAttribute("oepe.override.android.value.targetApiOut"));
    gettarget.setMinSdkVersionOut(getAttribute("oepe.override.android.value.minSdkVersionOut"));
    gettarget.perform();
}
finally
{
	self.project.setBasedir(basedir);
	echo("reverted Basedir = "+self.project.getProperty("basedir"));
}
