# LifeViewer

This is LifeViewer, a scriptable pattern editor and viewer for Life-like cellular automata.
Designed to be easy to embed in your own web site.

Currently used on:
* [Conwaylife.com](http://www.conwaylife.com/)
* [ConwayLife Forums](http://www.conwaylife.com/forums)
* [ConwayLife Wiki](http://www.conwaylife.com/wiki)
* [Catagolue](http://catagolue.appspot.com)

Written in plain Javascript/HTML5 without any external libraries.

## Contents
* [What does it do?](#what-does-it-do)
* [How do I use it own my own web page?](#how-do-i-use-it)
* [How do I build the plugin?](#how-do-i-build-it)
* [What's in each folder?](#folders)
* [What's each source file?](#source-files)
* [How do I run the test cases?](#running-the-test-cases)

## What does it do?
LifeViewer simulates and animates cellular automata in the web browser.

LifeViewer features:
* Smooth non-integer zoom and rotation.
* Colour themes with cell history and longevity.
* Square, hexagonal and triangular grid displays.
* Pseudo 3D layers and stars.
* Multiple ways to automatically track patterns with the camera as they evolve.
* Script language that allows many features to be customized including Waypoint animations.
* Support for multiple embedded LifeViewers and/or a single popup LifeViewer.
* Ability to step back to earlier generations for all patterns and reverse playback for reversible Margolus patterns.
* Pattern annotation with Labels, Arrows, Lines and Polygons.
* Ability to fetch RuleTable rules from a Repository
* Programatically pasting cells onto the grid at defined intervals (for example: glider injection).
* Editor with unlimitied undo/redo and multiple clipboards.


LifeViewer supports several different pattern formats, rules and neighbourhoods, as well as bounded grids.

Topic|Supported
-----|---------
Pattern formats|RLE, Life 1.06, Life 1.05, Cells
Rules|Wolfram, Totalistic, Generations, Isotropic Non-Totalistic, MAP, Larger than Life, HROT, Alternate, Margolus, PCA, RuleTable (@TABLE, @TREE and @COLORS), Weighted
Bounded Grid|Plane, Torus, Klein, Cross-Surface, Sphere
States|2 to 256 states, [R]History, Niemiec, Generations
Neighbourhoods|Moore, Hexagonal, Von Neumann, Triangular, 1D, Circular, Cross, L2, Saltire, Star, Checkerboard, Hash, Tripod, Asterisk, Custom

## How do I use it?
* [Build](#how-do-i-build-it) the plugin file **lv-plugin.js**.
* In the `<head>` section of your web page:
  1. Add a `<script src="lv-plugin.js">` tag pointing to where you installed the plugin.
  2. Add a `<meta name="LifeViewer" content="viewer textarea">` tag.
* In the `<body>` section of your web page for each LifeViewer you want displayed add `<div class="viewer">` containing:
  1. A `<textarea>` element containing the pattern definition.
  2. A `<canvas width="560" height="560"></canvas>` element on which LifeViewer can draw the pattern.
```
<!DOCTYPE html>
<html>
    <head>
        <meta name="LifeViewer" content="viewer textarea 30 hide limit">
        <script src="js/lv-plugin.js"></script>
    </head>
    <body>
        <h1>This is LifeViewer</h1>
        <div class="viewer">
            <textarea>3o$bbo$bo!</textarea>
            <br>
            <canvas width="560" height="560"><canvas>
        </div>
    </body>
</html>
```
* The content part of the <meta> tag must contain two mandatory items:
  1. The class name of the `<div>` element that contains an element containing the pattern definition and the `<canvas>` element.
  2. The name of the element in that `<div>` that contains the pattern definition.
In the example above the `<div>` class name is **viewer** and the pattern definition element is **textarea**.
* The content part of the `<meta>` tag may also contain up to five optional items:
  1. *an integer* (example: "30") - if specified then sets the height in pixels of the element containing the pattern definition.
  2. "*hide*" - if specified then hide the `<canvas>` element on browsers that don't support LifeViewer.
  3. "*limit*" - if specified then limit the width of LifeViewer to the width of the element containing the pattern.
  4. *a path beginning with /* - if specified then defines the path to a local Repository containing RuleTable rules
  5. *a string beginning with .* - if specified then defines a rule name postfix to add to rule requests to the Repository

You can put multiple LifeViewers on a single page. Each time you want one just specify an enclosing `<div>` containing both the `<textarea>` with the pattern definition and a `<canvas>`.
```
<div class="viewer">
    <textarea>bo$2bo$3!</textarea>
    <canvas width="560" height="560"></canvas>
</div>
```

If you omit the `<meta>` tag then it defaults to the following settings (which are used on the [ConwayLife Forums](http://www.conwaylife.com/forums)):
```
<meta name="LifeViewer" content="rle code 37 hide limit">
```

In addition to having one or more LifeViewers embedded in a web page a single popup LifeViewer is also allowed which can be launched in a moveable window above the current page.

In this case create an anchor `<a>` element within the LifeViewer `<div>` as follows:
```
<div class="viewer">
    <a href="" onclick="updateViewer(this); return false;">Show in Viewer</a><br>
    <textarea>bo$2bo$3!</textarea>
</div>
```

Note there is no need for the `<canvas>` element in this case since the pattern will be drawn on the popup window.

Once you have [built](#how-do-i-build-it) the plugin you can see both embedded and popup LifeViewers in action in this [example](build/example.html).

## How do I build it?
The **build** folder contains scripts to create the single minified plugin file **lv-plugin.js** from the source files in the **js** folder.

On Windows:
From the **build** folder run **compile.bat**. This requires Java and the included Google Closure compiler **compiler.jar**. The path to Java is hard coded in **compile.bat** and will need to be updated to wherever Java is installed on your machine.

On MacOS or Linux:
From the **build** folder run **./compile.sh**. This requires Java and the included Google Closure compiler **compiler.jar**.

## Folders:
Folder|Description
------|-----------
build|build script and Google Closure compiler
images|icons for UI and keyboard map
js|Javascript source files
tests|HTML test cases

## Source files:
File|Description
----|-----------
alias|common alias names for rules
allocator|typed array allocation and tracking
box|bounding box
canvasmenu|UI library
colours|default colour sets for common rules and colour names
compatibility|some cross-browser compatibility functions
help|help information
hrot|LtL/HROT algorithm
keys|keyboard processing
keywords|script command keywords
life|algorithms to compute the next generation
lifeview|main program
parser|script command parser
patterns|pattern reader and decoder
random|pseudo-random number generator
script|converts input into token stream
snapshot|snapshot manager for going back to earlier generations
stars|starfield
waypoint|waypoint, POI and label management
window|popup window management

## Running the test cases:
The tests are simple HTML files which run against the uncompiled source files in the **js** folder. Just open them in your browser.
