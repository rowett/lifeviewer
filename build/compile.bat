@echo off
@rem Closure Compiler for LifeViewer

"C:\Program Files\Java\jre1.8.0_171\bin\java.exe" -jar compiler.jar --jscomp_off=checkVars --compilation_level ADVANCED_OPTIMIZATIONS --js=../js/compatibility.js --js=../js/allocator.js --js=../js/alias.js --js=../js/canvasmenu.js --js=../js/patterns.js --js=../js/colours.js --js=../js/box.js --js=../js/snapshot.js --js=../js/ltl.js --js=../js/life.js --js=../js/script.js --js=../js/waypoint.js --js=../js/window.js --js=../js/random.js --js=../js/stars.js --js=../js/lifeview.js --js=../js/help.js --js=../js/keywords.js --js_output_file=lv-plugin.js
 
