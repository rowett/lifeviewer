# LifeViewer

This is LifeViewer, a scriptable pattern viewer for Life-like cellular automata.
Designed to be easy to embed in your own web site.

Currently used on:
* [Conwaylife.com](http://www.conwaylife.com/)
* [ConwayLife forums](http://www.conwaylife.com/forums)
* [ConwayLife Wiki](http://www.conwaylife.com/wiki)

Written in plain Javascript/HTML5 without any external libraries.

## Contents
* [What does it do?](#what-does-it-do)
* [How do I use it own my own web page?](#how-do-i-use-it)
* [How do I build the plugin?](#how-do-i-build-it)
* [What's in each folder?](#folders)
* [What's each source file?](#source-files)
* [How do I run the test cases?](#running-the-test-cases)

## What does it do
LifeViewer supports several different file formats, rules and neighbourhoods, as well as bounded grids.

Topic|Supported
-----|---------
File formats|RLE, Life 1.06, Life 1.05, Cells
Rules|Wolfram, Totalistic, Generations, Isotropic Non-Totalistic, MAP
Bounded Grid|Plane, Torus, Klein, Cross-Surface, Sphere
States|2 state, [R]History, Niemiec, Generations
Neighbourhoods|Moore, Hex, Von Neumann, 1D

## How do I use it?
* [Build](#how-do-i-build-it) the plugin file **lv-plugin.js**
* In the example below you will need to change the <script> tag to point to where you have installed the plugin.
* Create a <meta> tag with a name of "LifeViewer" in your webpage <head> section:
```
<html>
    <head>
        <meta name="LifeViewer" content="viewer textarea 30 hide limit">
        <script src="js/lv-plugin.js"></script>
        ...
    </head>
    ...
</html>
```
* The content part of the <meta> tag should contain a list of two mandatory words in a specific order and then up to three optional words in any order:
* "viewer" - the class name of the <div> that wraps the element containing the pattern definition and the <canvas> element
* "textarea" - the name of the element containing the pattern definition (in one of the supported pattern formats, typically RLE)
* (optional) "30" - if specified then sets the height in pixels of the element containing the pattern definition
* (optional) "hide" - if specified then hide the <canvas> element if the browser doesn't support LifeViewer
* (optional) "limit" - if specified then limit the width of the LifeViewer to the width of the element containing the pattern

The example below shows how you embed LifeViewer in your page with the glider pattern. In this case without limiting the LifeViewer width to the <textarea>, without limiting the <textarea> height, but still hiding the LifeViewer if the browser doesn't support it (since we specified "hide").
```
<html>
    <head>
        <meta name="LifeViewer" content="viewer textarea hide">
        <script src="js/lv-plugin.js"></script>
    </head>
    <body>
        <div class="viewer"><textarea>bo$2bo$3o!</textarea><br><canvas width="480" height="480"></canvas></div>
    </body>
</html>
```
If you omit the <meta> tag then it defaults to the following settings:
```
<meta name="LifeViewer" content="rle code 37 hide limit">
```
You can put multiple LifeViewers on a single page. Each time you want one just specify an enclosing <div> containing both the <textarea> with the pattern and a <canvas>.
```
]<div class="viewer">
    <textarea>bo$2bo$3!</textarea>
    <canvas width="480" height="480"></canvas>
</div>
```

## Folders:
Folder|Description
------|-----------
build|build script and Google Closure compiler
images|icons for UI and keyboard map
js|Javascript source files
tests|HTML test cases

## How do I build it?
The **build** folder contains a Windows script to create the single minified plugin file **lv-plugin.js** from the source files in the **js** folder.

From the **build** folder run **compile.bat**. This requires Java and the included Google Closure compiler **compiler.jar**. The path to Java is hard coded in **compile.bat** and will need to be updated to wherever Java is installed on your machine.

## Running the test cases:
The tests are simple HTML files which run against the uncompiled source files in the **js** folder. Just open them in your browser.

## Javascript source files in **js** folder:
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
random|pseudo-random number generator
script|functions to read script commands
snapshot|snapshot manager for going back to earlier generations
stars|starfield
waypoint|waypoint management
window|popup window management
