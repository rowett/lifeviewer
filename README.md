# LifeViewer

This is LifeViewer, a scriptable pattern viewer for Life-like cellular automata.
Written in plain Javascript/HTML5 without any external libraries.

### Folders:
Folder|Description
------|-----------
**build**|build script and Google Closure compiler
**images**|icons for UI and keyboard map
**js**|Javascript source files
**tests**|HTML test cases

### Building the plugin:
The **build** folder contains a Windows script to create the single minified plugin file **lv-plugin.js** from the source files in the **js** folder.

From the **build** folder run **compile.bat**. This requires Java and the included Google Closure compiler **compiler.jar**. The path to Java is hard coded in **compile.bat** and will need to be updated to wherever Java is installed on your machine.

### Running the test cases:
The tests are simple HTML files which run against the uncompiled source files in the **js** folder. Just open them in your browser.

### Javascript source files in **js** folder:
File|Description
----|-----------
alias|common alias names for rules
allocator|typed array allocation and tracking
box|bounding box
canvasmenu|UI library
colours|default colour sets for common rules and colour names
compatibility|some cross-browser compatibility functions
help|help information
keywords|script command keywords
life|algorithms to compute the next generation
lifeview|main program
ltl|LtL algorithm (unfinished)
patterns|pattern reader and decoder
script|functions to read script commands
snapshot|snapshot manager for going back to earlier generations
stars|starfield
waypoint|waypoint management
window|popup window management

