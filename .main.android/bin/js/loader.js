/**
 * Simple load function.  Unfortunately to use this, a script must a similar line as below.
 * 
 * Copy and past this line into a script file to expose load so you can use that for other script includes
 * 
 *  eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(self.project.getProperty("oepe.bin.js.dir")+"/loader.js"))));
 */
function load(jsFile)
{
    eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(self.project.getProperty("oepe.bin.js.dir")+"/"+jsFile))));
}