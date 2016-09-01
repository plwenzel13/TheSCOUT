/*
importClass(java.awt.Color);
importClass(java.awt.Font);
importClass(java.awt.Graphics2D);
importClass(java.awt.geom.Rectangle2D);
importClass(java.awt.image.BufferedImage);
importClass(java.io.ByteArrayOutputStream);
importClass(java.io.File);
importClass(java.io.FileOutputStream);
importClass(java.io.IOException);
importClass(javax.imageio.ImageIO);
*/

eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(self.project.getProperty("oepe.bin.js.dir")+"/loader.js"))));
load("common.js");
load("images.js");



handleImageDir("oepe.adfmf.appicon.dir", "oepe\.adfmf\.res\.source.*icon.*");
handleImageDir("oepe.adfmf.launchimage.dir", "oepe\.adfmf\.res\.source.*splash.*");

function handleImageDir(propName, propRegex){
    var rootDir = self.project.getProperty(propName);
    var propSet = new org.apache.tools.ant.types.PropertySet();
    propSet.setProject(self.project);
    propSet.appendRegex(propRegex);
    var files = [];
    var props = propSet.getProperties();
    var it = props.values().iterator();
    while (it.hasNext())
    {
        var file = it.next();
        files.push(file);
    }
    antHelper.echo(files);
    var images = new Images(rootDir, 16, function(fileName){
        return fileName.substring(0, fileName.indexOf('.'));
    });

    for (i = 0;i < files.length; i++)
    {
        images.execute(files[i]);
    }
}
