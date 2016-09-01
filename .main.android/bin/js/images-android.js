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


var rootDir = self.project.getProperty("adf.staging.res.dir");
var files = ["drawable-hdpi/adfmf_icon.png", "drawable-land-hdpi/adfmf_loading.png", 
             "drawable-land-ldpi/adfmf_loading.png", "drawable-land-mdpi/adfmf_loading.png",
             "drawable-land-xhdpi/adfmf_loading.png", "drawable-ldpi/adfmf_icon.png", "drawable-mdpi/adfmf_icon.png", 
             "drawable-port-hdpi/adfmf_loading.png", "drawable-port-ldpi/adfmf_loading.png", 
             "drawable-port-mdpi/adfmf_loading.png", "drawable-port-xhdpi/adfmf_loading.png",
             "drawable-xhdpi/adfmf_icon.png"];
var images = new Images(rootDir, 4, function(fileName){
	return fileName.substring(fileName.indexOf('-')+1, fileName.indexOf('/'));
});

for (var i = 0;i < files.length; i++)
{
	images.execute(files[i]);
}

