@echo off
@rem Closure Compiler for LifeViewer

echo LifeViewer Standard

@rem concatenate all source files enclosed by start.js and end.js which create a single scope
copy /b start.txt+..\js\compatibility.js+..\js\allocator.js+..\js\alias.js+..\js\canvasmenu.js+..\js\patterns.js+..\js\colours.js+..\js\box.js+..\js\snapshot.js+..\js\hrot.js+..\js\life.js+..\js\script.js+..\js\waypoint.js+..\js\window.js+..\js\random.js+..\js\stars.js+..\js\parser.js+..\js\lvwasmstub.js+..\js\lifeview.js+..\js\help.js+..\js\keywords.js+..\js\keys.js+end.txt all.js > nul

@rem run the closure compiler
echo Compiling with Closure...
"C:\Program Files\Java\jdk-20\bin\java.exe" -jar compiler.jar -W VERBOSE --jscomp_off=checkVars --compilation_level ADVANCED_OPTIMIZATIONS --js=all.js --js_output_file=lv-plugin.js

echo Done
