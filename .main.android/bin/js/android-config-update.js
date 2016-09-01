eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(self.project.getProperty("oepe.bin.js.dir")+"/loader.js"))));
load("common.js");

var androidManifestLocation = self.project.getProperty("adf.build.root.dir");
var androidManifestFileLocation = androidManifestLocation+"/AndroidManifest.xml";
var androidManifestStream = null;
var androidManifestOutStream = null;

try
{
    androidManifestStream = new java.io.FileInputStream(androidManifestFileLocation);
    var androidManifestIs = new org.xml.sax.InputSource(androidManifestStream);
    
    var document = new XMLDocument(androidManifestIs);
    var xmlDoc = document.load();
    
    var elem = xmlUpdater.findElement(xmlDoc.getDocumentElement(), "uses-sdk");
    
    if (elem == null)
    {
        elem = xmlDoc.createElement("uses-sdk");
        xmlDoc.getDocumentElement().getChildNodes().add(elem);
    }
    
    var minSDKVersion = self.project.getProperty("oepe.maf.android.minSdkVersion");
    var targetSdkVersion = self.project.getProperty("oepe.maf.android.targetSdkVersion");
    elem.setAttribute("android:minSdkVersion", minSDKVersion);
    elem.setAttribute("android:targetSdkVersion", targetSdkVersion);

    androidManifestOutStream = new java.io.FileOutputStream(androidManifestFileLocation);
    document.save(androidManifestOutStream);
}
finally
{
    if (androidManifestStream != null)
    {
        try {androidManifestOutStream.close();}catch(e){}
    }
    
    if (androidManifestOutStream != null)
    {
        try{androidManifestOutStream.close();}catch(e){}
    }
}