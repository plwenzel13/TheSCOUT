eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(self.project.getProperty("oepe.bin.js.dir")+"/loader.js"))));
load("common-fars.js");
load("common-skins.js");


var mappingsByProject = processApplication(true);

if (mappingsByProject !== undefined && mappingsByProject !== null)
{
	for (mappingIdx in mappingsByProject)
	{
		var mapping = mappingsByProject[mappingIdx];
	
		if (mapping === undefined)
		{
			continue;
		}
	
		print ("Project path: " + mapping.projectPath);
		print ("Staging path: " + mapping.stagingPath);
		
		var unresolved = new Array();
		var resolved = new java.util.HashMap();
		for (libIdx in mapping.libraryMappings)
		{
			var libraryMapping = mapping.libraryMappings[libIdx];
			if (libraryMapping.unresolved)
			{
				unresolved.push(libraryMapping);
			}
			else 
			{
				var groupedByContainer = resolved.get(libraryMapping.containerName);
				if (groupedByContainer == null)
				{
					groupedByContainer = new java.util.ArrayList();
					resolved.put(libraryMapping.containerName, groupedByContainer);
				}
				groupedByContainer.add(libraryMapping);
			}
		}
		
		for (var idx in unresolved)
		{
			print("Unresolved: "+unresolved[idx].containerName);
		}
		
		var resolvedIt = resolved.keySet().iterator();
		
		while (resolvedIt.hasNext())
		{
			var key = resolvedIt.next();
			var value = resolved.get(key);
			
			print("Resolved classpath: "+key);
			var valueIt = value.iterator();
			while(valueIt.hasNext())
			{
				var libraryMapping = valueIt.next();
				print("\t" + libraryMapping.fromFile + " [deploy="+(libraryMapping.useAtRuntime ? "yes]" : "no]"));
			}
		}
		print("\n\n");
	}
}