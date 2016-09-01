Images = function(imageRootDir, minPointSize, calcNameFunction)
{
	this.imageRootDir = imageRootDir;
	this.minPointSize = minPointSize;
	this.calcNameFunction = calcNameFunction;
	
	this.execute = function(fileName)
	{
        var srcFile = new java.io.File(this.imageRootDir+"/"+fileName);
        var preserveFileModified = srcFile.lastModified();
        antHelper.echo(srcFile.getAbsolutePath());
        var text =  this.calcNameFunction(fileName);
        this.mergeImageAndText(srcFile, text);
        srcFile.setLastModified(preserveFileModified);
    };

    this.mergeImageAndText = function(srcFile, text)
    {
        if (!new java.io.File(srcFile).isFile())
        {
            antHelper.info("Can't find image to decorate: "+srcFile);
            return;
        }
        try
        {
            var im = javax.imageio.ImageIO.read(srcFile);
            var g2 = im.createGraphics();
            var font = this.getScaledFont(im, g2, text);
            g2.setFont(font);
            g2.setColor(java.awt.Color.BLACK);
            var stringBounds = font.getStringBounds(text, g2.getFontRenderContext());
            g2.drawString(text, ((im.getWidth()/2)-(stringBounds.getCenterX())), ((im.getHeight()/2) - (stringBounds.getCenterY())));
            g2.dispose();
            var fos = null;
            try
            {
                fos = new java.io.FileOutputStream(srcFile);
                javax.imageio.ImageIO.write(im, "png", fos);
            }
            finally
            {   
                if (fos != null)
                {
                    fos.close();
                }
            }
        }
        catch (e)
        {
            antHelper.echo(e);
        }
    };

	this.getScaledFont = function(im, g2, text)
    {
        var font = null;
        var stringBounds = null;
        var pointSize = 4;
        do
        {
           font = new java.awt.Font("SansSerif", java.awt.Font.BOLD, pointSize++);
           stringBounds = font.getStringBounds(text, g2.getFontRenderContext());
        } while (im.getWidth() > stringBounds.getWidth()+10 && im.getHeight() > stringBounds.getHeight()+10);
        //antHelper.echo(pointSize);
        return font;
    };
};
