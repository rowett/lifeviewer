// LifeViewer Help
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global LifeConstants ViewConstants ColourManager Keywords WaypointConstants DocConfig PatternManager Controller AliasManager */

	// Help singleton
	var Help = {
		// shadow x offset
		shadowX : 0
	};

	// draw a line of help text with up down greyed based on position
	Help.renderHelpLineUpDown = function(view, up, separator, down, text, ctx, x, y, height, startLine) {
		var result = y,
		    
		    // only change colour if not drawing shadow
		    drawingShadow = false,

		    // line number
		    lineNo = view.lineNo;

		// only render if context exists
		if (ctx) {
			// check if drawing shadow
			if (ctx.fillStyle === ViewConstants.helpShadowColour) {
				drawingShadow = true;
			}

			// check if the line is on the page
			if (lineNo >= startLine && lineNo <= (startLine + view.numHelpPerPage)) {
				// output up
				ctx.font = ViewConstants.fixedFont;

				// set colour based on whether help can scroll up
				if (!drawingShadow) {
					if ((view.displayHelp | 0) > 1) {
						ctx.fillStyle = ViewConstants.helpFontColour;
					} else {
						ctx.fillStyle = ViewConstants.greyFontColour;
					}
				}
				ctx.fillText(up, x, y);

				// draw the separator
				if (!drawingShadow) {
					ctx.fillStyle = ViewConstants.helpFontColour;
				}
				ctx.fillText(separator, x + ctx.measureText(up).width, y);

				// set colour based on whether help can scroll down
				if (!drawingShadow) {
					if ((view.displayHelp | 0) < view.numHelpLines - view.numHelpPerPage) {
						ctx.fillStyle = ViewConstants.helpFontColour;
					} else {
						ctx.fillStyle = ViewConstants.greyFontColour;
					}
				}
				ctx.fillText(down, x + ctx.measureText(up + separator).width, y);

				// draw the variable part
				if (!drawingShadow) {
					ctx.fillStyle = ViewConstants.helpFontColour;
				}
				ctx.font = ViewConstants.variableFont;
				ctx.fillText(text, x + view.tabs[0], y);

				// move the y coordinate to the next screen line
				result += height;
			}
		}

		// increment line number
		view.lineNo += 1;

		// return the next y coordinate
		return result;
	};

	// convert bytes to MBytes
	Help.asMByte = function(bytes) {
		var mb = bytes / (1024 * 1024),
		    result = "";
		if (mb < 10) {
			result = String(mb.toFixed(1));
		} else {
			result = String(mb.toFixed(0));
		}

		return result;
	};

	// render a colour box on a line of help text
	Help.renderColourBox = function(view, red, green, blue, ctx, x, y, height, startLine) {
		// line number
		var lineNo = view.lineNo,
		    currentFill = null;

		// only render if context exists
		if (ctx) {
			// reduce height to create a 1 pixel border
			height -= 6;

			// check if the line is on the page
			if (lineNo >= startLine && lineNo <= (startLine + view.numHelpPerPage)) {
				// remember the current fill style
				currentFill = ctx.fillStyle;

				// check if drawing shadow
				if (currentFill !== ViewConstants.helpShadowColour) {
					// set the box colour
					ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
				}

				// draw the box
				ctx.fillRect(x, y - (height >> 1) - 1, height, height);

				// reset the colour to the help font colour
				ctx.fillStyle = currentFill;
			}
		}
	};

	// measure text line
	Help.measureText = function(view, ctx, text, item) {
		// get the width cache
		var widthCache = (item ? view.helpVariableCache : view.helpFixedCache),
		    result = 0;

		// check if the width exists in the cache
		if (widthCache[view.lineNo]) {
			result = widthCache[view.lineNo];
		} else {
			// set the correct font
			if (item === 0) {
				ctx.font = ViewConstants.fixedFont;
			} else {
				ctx.font = ViewConstants.variableFont;
			}

			// measure the width of the text and cache the result
			result = ctx.measureText(text).width;
			widthCache[view.lineNo] = result;
		}

		return result;
	};

	// draw a line of help text
	Help.renderHelpLine = function(view, fixed, text, ctx, x, y, height, startLine) {
		var result = y,

		    // tab index in text
		    tab = String(text).indexOf("\t"),

		    // line number
		    lineNo = view.lineNo,

		    // tab number
			tabNo = 0,

			// text width in pixels
			width = 0,

			// rule divider
			divider = 0,

			// whether text was drawn
			drewText = false,

			// whether text should be drawn
			shouldDraw = true;

		// check if the line is on the page
		if ((lineNo < startLine || lineNo > (startLine + view.numHelpPerPage)) && shouldDraw) {
			shouldDraw = false;
		}

		// check if there is fixed text
		if (fixed.length) {
			if (shouldDraw) {
				ctx.font = ViewConstants.fixedFont;
				ctx.fillText(fixed, x, y);
			}

			// check if the fixed portion was wider than the first tab
			width = this.measureText(view, ctx, fixed, 0);
			if (width > view.tabs[tabNo]) {
				// move the variable portion onto the next line
				if (shouldDraw) {
					y += height;
					result += height;
				}
				view.lineNo += 1;
			}

			// draw the variable text
			if (shouldDraw) {
				ctx.font = ViewConstants.variableFont;
			}
			while (tab !== -1) {
				// draw the text up to the tab at the current tab stop
				if (shouldDraw) {
					ctx.fillText(text.substr(0, tab), x + view.tabs[tabNo], y);
				}

				// next tab stop
				tabNo += 1;

				// check for next tab
				text = text.substr(tab + 1);
				tab = text.indexOf("\t");
			}

			// check if the text will fit in the window
			drewText = false;
			if (view.wrapHelpText) {
				width = this.measureText(view, ctx, text, 1);
				// remove the shadow offset from x otherwise normal and shadow text wrap differently
				if (x + view.tabs[tabNo] + width + this.shadowX > ctx.canvas.width) {
					// check if the text can be split at "|"
					divider = text.toLowerCase().indexOf("|");
					if (divider === -1) {
						// check if the text can be split at "s"
						divider = text.toLowerCase().indexOf("s");
						if (divider === -1) {
							// try slash
							divider = text.indexOf("/");
							if (divider !== -1) {
								divider += 1;
							}
						}
					}
					if (divider !== -1) {
						if (shouldDraw) {
							ctx.fillText(text.substr(0, divider), x + view.tabs[tabNo], y);
							y += height;
							result += height;
							ctx.fillText("  " + text.substr(divider), x + view.tabs[tabNo], y);
						}
						view.lineNo += 1;
						drewText = true;
					}
				}
			}
			if (!drewText) {
				// draw on one line
				if (shouldDraw) {
					ctx.fillText(text, x + view.tabs[tabNo], y);
				}
			}
		} else {
			ctx.font = ViewConstants.variableFont;
			if (shouldDraw) {
				ctx.fillText(text, x, y);
			}
		}

		// move the y coordinate to the next screen line
		if (shouldDraw) {
			result += height;
		}

		// increment line number
		view.lineNo += 1;

		// return the next y coordinate
		return result;
	};

	// rgb direct colour as string
	Help.rgbString = function(redValue, greenValue, blueValue) {
		var colourList = ColourManager.colourList,
		    keys = Object.keys(colourList),
		    result = "    " + redValue + "\t" + greenValue + "\t" + blueValue,
		    found = false,
		    triple = null,
		    i = 0;

		// search the object for a key matching the r, g, b
		while (i < keys.length && !found) {
			// get the value at the key
			triple = colourList[keys[i]];

			// check if it matches the R G B triple
			if (triple[1] === redValue && triple[2] === greenValue && triple[3] === blueValue) {
				// add name to the result
				result += "\t" + triple[0];

				// mark found and exit loop
				found = true;
				i = keys.length;
			} else {
				// try next
				i += 1;
			}
		}
	
		// return the string
		return result;
	};

	// rgb object colour as string
	Help.rgbObjectString = function(object) {
		return this.rgbString(object.red, object.green, object.blue);
	};

	// return area as string
	Help.areaString = function(view) {
		var width = 0,
		    height = 0,
		    result = "";

		// check if any cells are alive
		if (view.engine.anythingAlive) {
			// cells alive so get dimensions from bounding box
			width = view.engine.zoomBox.rightX - view.engine.zoomBox.leftX + 1;
			height = view.engine.zoomBox.topY - view.engine.zoomBox.bottomY + 1;
		}

		// check for bounded grid
		if (view.engine.boundedGridType !== -1) {
			// read bounded grid width and height
			if (view.engine.boundedGridWidth !== 0) {
				width = view.engine.boundedGridWidth;
			}
			if (view.engine.boundedGridHeight !== 0) {
				height = view.engine.boundedGridHeight;
			}
		}

		// return the area string
		result = width + " x " + height;
		return result;
	};

	// return autofit mode name
	Help.autoFitName = function(view) {
		// determine the mode
		var result = "AutoFit";
		if (view.historyFit) {
			result += " History";
		}
		if (view.state1Fit) {
			result += " State 1";
		}

		// return the mode name
		return result;
	};

	// pad a string
	Help.pad = function(string, padding) {
		// compute padding length
		var l = padding - string.length;
		var result = "";

		while (l > 0) {
			result += " ";
			l -= 1;
		}

		return result + string;
	};

	// convert rgb(rrr,ggg,bbb) to [r, g, b]
	Help.colourFromRGBString = function(colour) {
		var red = 0, green = 0, blue = 0,
			index1 = colour.indexOf(","),
			index2 = colour.lastIndexOf(",");

		red = colour.substring(4, index1);
		green = colour.substring(index1 + 1, index2);
		blue = colour.substring(index2 + 1, colour.length - 1);
		return [red, green, blue];
	};

	// render help text page
	Help.renderHelpText = function(view, ctx, x, y, height, helpLine) {
		var endLine = 0,
			topY = y;

		switch (view.helpTopic) {
			case ViewConstants.welcomeTopic:
				this.renderWelcomeTopic(view, ctx, x, y, height, helpLine);
				break;
			case ViewConstants.keysTopic:
				this.renderKeysTopic(view, ctx, x, y, height, helpLine);
				break;
			case ViewConstants.scriptsTopic:
				this.renderScriptsTopic(view, ctx, x, y, height, helpLine);
				break;
			case ViewConstants.informationTopic:
				this.renderInformationTopic(view, ctx, x, y, height, helpLine);
				break;
			case ViewConstants.themesTopic:
				this.renderThemesTopic(view, ctx, x, y, height, helpLine);
				break;
			case ViewConstants.coloursTopic:
				this.renderColoursTopic(view, ctx, x, y, height, helpLine);
				break;
			case ViewConstants.aliasesTopic:
				this.renderAliasesTopic(view, ctx, x, y, height, helpLine);
				break;
			case ViewConstants.memoryTopic:
				this.renderMemoryTopic(view, ctx, x, y, height, helpLine);
				break;
			case ViewConstants.annotationsTopic:
				this.renderAnnotationsTopic(view, ctx, x, y, height, helpLine);
				break;
		}

		// save number of help lines
		view.numHelpLines = view.lineNo - 1;

		// compute the last line displayed
		endLine = helpLine + view.numHelpPerPage;
		if (endLine > view.numHelpLines) {
			endLine = view.numHelpLines;
		}

		// display the footer at the bottom
		view.lineNo = 1;
		view.tabs[0] = 120;
		y = topY + height * (view.numHelpPerPage + 2);
		if (view.helpTopic !== ViewConstants.welcomeTopic) {
			y = this.renderHelpLineUpDown(view, "Up", " / ", "Down", "scroll help", ctx, x, y, height, 0);
		} else {
			y += height;
		}
		if (view.isInPopup) {
			y = this.renderHelpLine(view, "H", "close help", ctx, x, y, height, 0);
		} else {
			y = this.renderHelpLine(view, "H / Esc", "close help", ctx, x, y, height, 0);
		}
	};

	// render welcome topic
	Help.renderWelcomeTopic = function(view, ctx, x, y, height, helpLine) {
		// section number
		var sectionNum = 0;

		// set initial line
		view.lineNo = 1;

		// disable line wrap to start with
		view.wrapHelpText = false;

		// reset sections
		view.helpSections = [];
		
		// title
		view.tabs[0] = 108;
		view.helpSections[sectionNum] = [view.lineNo, "Top"];
		sectionNum += 1;

		y = this.renderHelpLine(view, "", ViewConstants.versionName + " build " + ViewConstants.versionBuild + " by " + ViewConstants.versionAuthor, ctx, x, y, height, helpLine);
	};

	// render annotations topic
	Help.renderAnnotationsTopic = function(view, ctx, x, y, height, helpLine) {
		var i = 0, itemName = "", colour = [],

			// section number
			sectionNum = 0;

		// set initial line
		view.lineNo = 1;

		// disable line wrap to start with
		view.wrapHelpText = false;

		// reset sections
		view.helpSections = [];
		
		// annotations 
		view.helpSections[sectionNum] = [view.lineNo, "Top"];
		sectionNum += 1;
		view.tabs[0] = 128;
		view.tabs[1] = 208;
		view.tabs[2] = 288;
		view.tabs[3] = 368;
		y = this.renderHelpLine(view, "", "Annotations", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Labels"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Labels:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Number", view.waypointManager.numLabels(), ctx, x, y, height, helpLine);
		for (i = 0; i < view.waypointManager.numLabels(); i += 1) {
			itemName = "Label " + String(i + 1);
			y = this.renderHelpLine(view, itemName, view.waypointManager.labelAsText1(i), ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, " ", view.waypointManager.labelAsText2(i), ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, " ", view.waypointManager.labelAsText3(i), ctx, x, y, height, helpLine);
			colour = this.colourFromRGBString(view.waypointManager.labelColour(i));
			this.renderColourBox(view, colour[0], colour[1], colour[2], ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "Colour", this.rgbString(colour[0], colour[1], colour[2]), ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Arrows"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Arrows:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Number", view.waypointManager.numArrows(), ctx, x, y, height, helpLine);
		for (i = 0; i < view.waypointManager.numArrows(); i += 1) {
			itemName = "Arrow " + String(i + 1);
			y = this.renderHelpLine(view, itemName, view.waypointManager.arrowAsText1(i), ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, " ", view.waypointManager.arrowAsText2(i), ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, " ", view.waypointManager.arrowAsText3(i), ctx, x, y, height, helpLine);
			colour = this.colourFromRGBString(view.waypointManager.arrowColour(i));
			this.renderColourBox(view, colour[0], colour[1], colour[2], ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "Colour", this.rgbString(colour[0], colour[1], colour[2]), ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Polygons"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Polygons:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Number", view.waypointManager.numPolygons(), ctx, x, y, height, helpLine);
		for (i = 0; i < view.waypointManager.numPolygons(); i += 1) {
			itemName = "Polygon " + String(i + 1);
			y = this.renderHelpLine(view, itemName, view.waypointManager.polyAsText1(i), ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, " ", view.waypointManager.polyAsText2(i), ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, " ", view.waypointManager.polyAsText3(i), ctx, x, y, height, helpLine);
			colour = this.colourFromRGBString(view.waypointManager.polygonColour(i));
			this.renderColourBox(view, colour[0], colour[1], colour[2], ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "Colour", this.rgbString(colour[0], colour[1], colour[2]), ctx, x, y, height, helpLine);
		}
	};

	// render keys topic
	Help.renderKeysTopic = function(view, ctx, x, y, height, helpLine) {
		var i = 0, value = 0,

			// section number
			sectionNum = 0;

		// set initial line
		view.lineNo = 1;

		// disable line wrap to start with
		view.wrapHelpText = false;

		// reset sections
		view.helpSections = [];
		
		// keyboard commands
		view.tabs[0] = 124;
		view.helpSections[sectionNum] = [view.lineNo, "Top"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Keyboard commands", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// playback controls
		view.helpSections[sectionNum] = [view.lineNo, "Playback"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Playback controls:", ctx, x, y, height, helpLine);
		if (view.multiStateView) {
			y = this.renderHelpLine(view, "R", "reset", ctx, x, y, height, helpLine);
		} else {
			y = this.renderHelpLine(view, "Enter", "toggle play / pause", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Space", "pause / next generation", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "B", "pause / previous generation", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Tab", "pause / next step", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Shift Tab", "pause / previous step", ctx, x, y, height, helpLine);
			if (view.isInPopup) {
				y = this.renderHelpLine(view, "Esc", "close LifeViewer", ctx, x, y, height, helpLine);
			} else {
				y = this.renderHelpLine(view, "Esc", "pause if playing", ctx, x, y, height, helpLine);
			}
			y = this.renderHelpLine(view, "R", "reset to generation 0", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "-", "decrease generation speed", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "+", "increase generation speed", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Shift -", "minimum generation speed", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Shift +", "maximum generation speed", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "D", "decrease step size", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "E", "increase step size", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Shift D", "minimum step size", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Shift E", "maximum step size", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "0", "reset step and speed", ctx, x, y, height, helpLine);
			if (view.waypointsDefined) {
				if (view.loopGeneration !== -1) {
					y = this.renderHelpLine(view, "W", "toggle waypoint playback and loop", ctx, x, y, height, helpLine);
					y = this.renderHelpLine(view, "Shift P", "toggle just loop", ctx, x, y, height, helpLine);
				} else {
					y = this.renderHelpLine(view, "W", "toggle waypoint playback", ctx, x, y, height, helpLine);
				}
			} else {
				if (view.loopGeneration !== -1) {
					y = this.renderHelpLine(view, "W", "toggle loop", ctx, x, y, height, helpLine);
				}
			}
		}
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// multiverse controls
		view.helpSections[sectionNum] = [view.lineNo, "Multi"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Multi-Viewer controls:", ctx, x, y, height, helpLine);
		if (DocConfig.multi) {
			y = this.renderHelpLine(view, "Page Up", "previous universe", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Page Down", "next universe", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Home", "first universe", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "End", "last universe", ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "Shift R", "reset all LifeViewers to generation 0", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Z", "stop playback in all other LifeViewers", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift Z", "stop playback in all LifeViewers", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// camera controls
		view.helpSections[sectionNum] = [view.lineNo, "Camera"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Camera controls:", ctx, x, y, height, helpLine);
		// only display navigation menu key if menu is available
		if ((view.displayHeight >= ViewConstants.minMenuHeight) || ((view.thumbnail && view.thumbOrigHeight) >= ViewConstants.minMenuHeight)) {
			y = this.renderHelpLine(view, "M", "toggle navigation menu", ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "V", "restore saved camera position", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift V", "save current camera position", ctx, x, y, height, helpLine);

		// check if POI are present
		value = view.waypointManager.numPOIs();
		if (value > 0) {
			y = this.renderHelpLine(view, "J", "jump to next point of interest", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Shift J", "jump to previous point of interest", ctx, x, y, height, helpLine);
			if (value > 9) {
				value = 9;
			}
			for (i = 1; i <= value; i += 1) {
				y = this.renderHelpLine(view, "Alt " + String(i), "jump to POI #" + String(i), ctx, x, y, height, helpLine);
			}
		}

		y = this.renderHelpLine(view, "F", "fit pattern to display", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift F", "toggle autofit", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift H", "toggle autofit history mode", ctx, x, y, height, helpLine);
		if (view.engine.isLifeHistory) {
			y = this.renderHelpLine(view, "Shift S", "toggle autofit state 1 mode", ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "[", "zoom out", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "]", "zoom in", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift [", "halve zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift ]", "double zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "1", "1x zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "2", "2x zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "4", "4x zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "8", "8x zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "6", "16x zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "3", "32x zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift 3", "64x zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift 1", "integer zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift 2", "-2x zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift 4", "-4x zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift 8", "-8x zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift 6", "-16x zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Left", "pan left", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Right", "pan right", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Up", "pan up", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Down", "pan down", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift Left", "pan north west", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift Right", "pan south east", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift Up", "pan north east", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift Down", "pan south west", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "<", "rotate left", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, ">", "rotate right", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift <", "rotate left 90 degrees", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift >", "rotate right 90 degrees", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "5", "reset angle", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// view controls, only display if not in multistate mode
		if (!view.multiStateView) {
			view.helpSections[sectionNum] = [view.lineNo, "View"];
			sectionNum += 1;
			y = this.renderHelpLine(view, "", "View controls:", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Q", "increase number of layers", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "A", "decrease number of layers", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "P", "increase layer depth", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "L", "decrease layer depth", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "C", "next colour theme", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Shift C", "previous colour theme", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Alt C", "default theme", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		}

		// display controls
		view.helpSections[sectionNum] = [view.lineNo, "Display"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Display controls:", ctx, x, y, height, helpLine);
		if (!view.multiStateView) {
			y = this.renderHelpLine(view, "G", "toggle generation statistics", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Shift G", "toggle generation display mode", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Y", "toggle population graph", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Shift Y", "toggle graph lines", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "7", "decrease graph opacity", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "9", "increase graph opacity", ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "/", "toggle hex view", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift /", "pattern default view", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "T", "toggle timing information", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift T", "toggle extended timing information", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "I", "toggle pattern and engine information", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift I", "toggle information bar", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "X", "toggle grid lines", ctx, x, y, height, helpLine);
		if (view.engine.gridLineMajor > 0) {
			y = this.renderHelpLine(view, "Shift X", "toggle major grid lines", ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "Alt X", "toggle cell borders", ctx, x, y, height, helpLine);
		if (view.engine.isLifeHistory) {
			y = this.renderHelpLine(view, "Alt H", "[R]History display on", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Alt J", "[R]History display off", ctx, x, y, height, helpLine);
		}
		if (view.waypointManager.numAnnotations() > 0) {
			y = this.renderHelpLine(view, "Shift L", "toggle annotation display", ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "Alt K", "toggle kill escaping gliders", ctx, x, y, height, helpLine);
		// check if thumbnail ever on
		if (view.thumbnailEverOn) {
			y = this.renderHelpLine(view, "N", "toggle thumbnail view", ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "S", "toggle stars", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "O", "open screenshot in separate window", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift O", "open population graph in separate window", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// clipboard controls
		view.helpSections[sectionNum] = [view.lineNo, "Clipboard"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Clipboard controls:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Ctrl+Shift C", "copy original pattern", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Ctrl C", "copy current pattern", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Ctrl+Alt C", "copy current pattern with comments", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "K", "copy camera position", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift K", "copy camera position and view", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// edit controls
		view.helpSections[sectionNum] = [view.lineNo, "Edit"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Edit controls:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "F1", "toggle draw/pan mode", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift F1", "toggle smart drawing", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Ctrl Z", "undo edit", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Ctrl+Shift F1", "redo edit", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// help controls
		view.helpSections[sectionNum] = [view.lineNo, "Help"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Help controls:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Up", "scroll up one line", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Down", "scroll down one line", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Page Up", "scroll up one page", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Page Down", "scroll down one page", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift Page Up", "scroll up one section", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Shift Page Down", "scroll down one section", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Home", "go to first help page", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "End", "go to last help page", ctx, x, y, height, helpLine);
	};

	// render scripts topic
	Help.renderScriptsTopic = function(view, ctx, x, y, height, helpLine) {
		// section number
		var sectionNum = 0;

		// set initial line
		view.lineNo = 1;

		// disable line wrap to start with
		view.wrapHelpText = false;

		// reset sections
		view.helpSections = [];

		// script commands
		view.tabs[0] = 252;
		view.helpSections[sectionNum] = [view.lineNo, "Top"];
		sectionNum += 1;

		y = this.renderHelpLine(view, "", "Scripts", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "Scripts must be embedded in pattern comments", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "Commands must be surrounded by whitespace", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Params"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Parameter conventions:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "A|B", "either A or B", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "(A)", "A is optional", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "A*", "zero or more A", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "A+", "one or more A", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "<1..3>", "integer range", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "<1.0..3.0>", "decimal range", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// script commands
		view.helpSections[sectionNum] = [view.lineNo, "General"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "General:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.scriptStartWord, "start script section", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.scriptEndWord, "end script section", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.suppressWord, "suppress overwrite warning", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.randomSeedWord + " <string>", "set random seed", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Playback"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Playback:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.autoStartWord + " (" + Keywords.offWord + ")", "start play automatically", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.loopWord + " <1..>|" + Keywords.offWord, "loop at generation", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.stopWord + " <1..>|" + Keywords.offWord, "stop at generation", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.gpsWord + " <" + ViewConstants.minGenSpeed + ".." + ViewConstants.maxGenSpeed + ">", "set steps per second", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.stepWord + " <" + ViewConstants.minStepSpeed + ".." + ViewConstants.maxStepSpeed + ">", "set generations per step", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.hardResetWord, "always use hard reset", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.viewOnlyWord, "disable playback", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.noHistoryWord, "disable step back", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.noReportWord, "disable stop messages", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Camera"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Camera:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.angleWord + " <0..359>", "set camera angle", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.xWord + " <-" + (view.engine.maxGridSize >> 1) + ".." + (view.engine.maxGridSize >> 1) + ">", "set camera x position", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.yWord + " <-" + (view.engine.maxGridSize >> 1) + ".." + (view.engine.maxGridSize >> 1) + ">", "set camera y position", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.zoomWord + " <" + Number(-1 / ViewConstants.minZoom).toFixed(1) + ".." + (ViewConstants.maxZoom).toFixed(1) + ">", "set camera zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.alternateZoomWord, "same as " + Keywords.zoomWord, ctx, x, y, height, helpLine);
		//y = this.renderHelpLine(view, Keywords.integerZoomWord, "enforce integer zoom", ctx, x, y, height, helpLine); TBD
		y = this.renderHelpLine(view, Keywords.autoFitWord + " (" + Keywords.offWord + ")", "fit pattern to display", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.historyFitWord + " (" + Keywords.offWord + ")", "autofit uses pattern history", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.state1FitWord + " (" + Keywords.offWord + ")", "autofit only uses state 1", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.trackWord + " X Y", "camera tracking", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " X ", "horizontal speed cells/gen", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " Y ", "vertical speed cells/gen", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.trackBoxWord + " E S W N", "camera box tracking", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " E ", "east edge speed cells/gen", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " S ", "south edge speed cells/gen", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " W ", "west edge speed cells/gen", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " N ", "north edge speed cells/gen", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.trackLoopWord + " P X Y", "camera tracking with loop", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " P ", "period", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " X ", "horizontal speed cells/gen", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " Y ", "vertical speed cells/gen", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Waypoints"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Waypoints:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.tWord + " <0..>", "waypoint at generation", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.pauseWord + " <0.0..>", "pause for time", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.linearWord + " " + Keywords.allWord + "|" + Keywords.xWord + "|" + Keywords.yWord + "|" + Keywords.zoomWord, "linear motion", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.bezierWord + " " + Keywords.allWord + "|" + Keywords.xWord + "|" + Keywords.yWord + "|" + Keywords.zoomWord, "bezier motion (default)", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "POIs"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Points of interest:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.poiWord, "define point of interest", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.poiTWord + " <0..>", "start POI at generation", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.poiResetWord, "reset generation at POI", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.poiPlayWord, "start playback at POI", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.poiStopWord, "stop playback at POI", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.poiTransWord + " <" + WaypointConstants.poiMinSpeed + ".." + WaypointConstants.poiMaxSpeed + ">", "set POI transition speed", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "<command>|ALL " + Keywords.initialWord, "use initial value for POI", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.stringDelimiter + "<string>" + Keywords.stringDelimiter, "define message", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Annotations"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Annotations:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.labelWord + " X Y ZOOM (" + Keywords.fixedWord + ")", "define label at position", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.stringDelimiter + "<string>" + Keywords.stringDelimiter, "... optionally fix position", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.labelSizeWord + " <" + ViewConstants.minLabelSize + ".." + ViewConstants.maxLabelSize + ">", "define label font size", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.labelAlphaWord + " <0.0..1.0>", "define label font alpha", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.labelTWord + " <0..> <0..> <0..>", "generation range / fade", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.labelAngleWord + " <0..359>", "label angle", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " (" + Keywords.fixedWord + ")", "... optionally fix angle", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.labelTargetWord + " X Y D|" + Keywords.offWord, "label target and distance", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.labelTrackWord + " DX DY|" + Keywords.fixedWord, "label move per generation", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.arrowWord + " X1 Y1 X2 Y2 ZOOM", "define arrow at position", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " (" + Keywords.fixedWord + ")", "... optionally fix position", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.arrowSizeWord + " <" + ViewConstants.minLineSize + ".." + ViewConstants.maxLineSize + "> <0.0..1.0>", "line width and head multiple", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.arrowAlphaWord + " <0.0..1.0>", "define arrow alpha", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.arrowTWord + " <0..> <0..> <0..>", "generation range / fade", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.arrowAngleWord + " <0..359>", "arrow angle", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " (" + Keywords.fixedWord + ")", "... optionally fix angle", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.arrowTargetWord + " X Y D|" + Keywords.offWord, "arrow target and distance", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.arrowTrackWord + " DX DY|" + Keywords.fixedWord, "arrow move per generation", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.polyLineWord + " X1 Y1 X2 Y2 .. ZOOM", "define outline polygon", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " (" + Keywords.fixedWord + ")", "... optionally fix position", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.polyFillWord + " X1 Y1 X2 Y2 .. ZOOM", "define filled polygon", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " (" + Keywords.fixedWord + ")", "... optionally fix position", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.polySizeWord + " <" + ViewConstants.minLineSize + ".." + ViewConstants.maxLineSize + ">", "line width", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.polyAlphaWord + " <0.0..1.0>", "define polygon alpha", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.polyTWord + " <0..> <0..> <0..>", "generation range / fade", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.polyAngleWord + " <0..359>", "polygon angle", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " (" + Keywords.fixedWord + ")", "... optionally fix angle", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.polyTargetWord + " X Y D|" + Keywords.offWord, "polygon target and distance", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Display"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Display:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.widthWord + " <" + ViewConstants.minViewerWidth + ".." + view.maxCodeWidth + ">", "set LifeViewer width", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.heightWord + " <" + ViewConstants.minViewerHeight + ".." + ViewConstants.maxViewerHeight + ">", "set LifeViewer height", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.popupWidthWord + " <" + ViewConstants.minViewerWidth + ".." + view.maxCodeWidth + ">", "set popup width", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.popupHeightWord + " <" + ViewConstants.minViewerHeight + ".." + ViewConstants.maxViewerHeight + ">", "set popup height", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.titleWord + " " + Keywords.stringDelimiter + "<string>" + Keywords.stringDelimiter, "set popup window title", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.variablePrefixSymbol + "B", "program build number", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.variablePrefixSymbol + "N", "pattern name", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.variablePrefixSymbol + "O", "pattern originator", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.variablePrefixSymbol + "R", "rule name", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.variablePrefixSymbol + "A", "rule alias", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.variablePrefixSymbol + "T", "program title", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.variablePrefixSymbol + Keywords.variablePrefixSymbol, Keywords.variablePrefixSymbol + " symbol", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.layersWord + " <" + ViewConstants.minLayers + ".." + ViewConstants.maxLayers + ">", "set number of layers", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.depthWord + " <" + ViewConstants.minDepth.toFixed(1) + ".." + ViewConstants.maxDepth.toFixed(1) + ">", "set layer depth", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.gridWord + " (" + Keywords.offWord + ")", "display grid lines", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.gridMajorWord + " <0..16>", "set major grid line interval", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.historyStatesWord + " <0.." + ((view.engine.multiNumStates > 2) ? 1 : 63) + ">", "number of history states", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.starfieldWord + " (" + Keywords.offWord + ")", "display stars", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.hexDisplayWord, "force hex display", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.squareDisplayWord, "force square display", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.hexCellsWord, "hexagonal cells for hex", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.squareCellsWord, "square cells for hex", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.noGUIWord, "disable menus and hotkeys", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.hideGUIWord, "hide menus during playback", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.showTimingWord, "show timing information", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.extendedTimingWord, "extended timing information", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.showGenStatsWord, "show generation statistics", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.showInfoBarWord, "show information bar", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.noPerfWarningWord, "hide performance warning", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Thumb"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Thumbnails:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.thumbnailWord + " (" + Keywords.offWord + ")", "start at 1/" + view.thumbnailDivisor + " size", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.thumbSizeWord + " <" + ViewConstants.minThumbSize + ".." + ViewConstants.maxThumbSize + ">", "set thumbnail divisor", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.thumbLaunchWord + " (" + Keywords.offWord + ")", "thumbnail launches viewer", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.thumbZoomWord + " <" + Number(-1 / ViewConstants.minZoom).toFixed(1) + ".." + (ViewConstants.maxZoom).toFixed(1) + ">", "set thumbnail zoom", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Graph"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Population Graph:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.graphWord, "display population graph", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.graphOpacityWord + " <0.0..1.0>", "population graph opacity", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.graphPointsWord, "population graph use points", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.noGraphWord, "disable population graph", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Colours"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Colours:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.themeWord + " <0.." + (view.engine.numThemes - 1) + ">|<name>", "set theme", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " <name> = " + Keywords.themeCustomWord, "set custom theme", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.themeBackgroundWord + " R G B", "set theme background", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.themeAliveWord + " R G B", "set theme alive color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.themeAliveRampWord + " R G B", "set theme alive ramp", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.themeDeadWord + " R G B", "set theme dead color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.themeDeadRampWord + " R G B", "set theme dead ramp", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.boundaryWord + " R G B", "set boundary color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " <0.." + String(view.patternStates - 1) + "> R G B", "set state color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.offColorWord + " R G B", "set [R]History state color " + ViewConstants.offState, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.onColorWord + " R G B", "set [R]History state color " + ViewConstants.onState, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.historyColorWord + " R G B", "set [R]History state color " + ViewConstants.historyState, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.mark1ColorWord + " R G B", "set [R]History state color " + ViewConstants.mark1State, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.markOffColorWord + " R G B", "set [R]History state color " + ViewConstants.markOffState, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.mark2ColorWord + " R G B", "set [R]History state color " + ViewConstants.mark2State, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.killColorWord + " R G B", "set [R]History state color " + ViewConstants.killState, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.gridWord + " R G B", "set grid color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.gridMajorWord + " R G B", "set grid major color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.starfieldWord + " R G B", "set star color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.textColorWord + " R G B", "set waypoint message color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.errorColorWord + " R G B", "set error message color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.graphBgColorWord + " R G B", "set graph background color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.graphAxisColorWord + " R G B", "set graph axis color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.graphAliveColorWord + " R G B", "set graph alive color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.graphBirthColorWord + " R G B", "set graph birth color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.graphDeathColorWord + " R G B", "set graph death color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.labelWord + " R G B", "set label text color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.arrowWord + " R G B", "set arrow line color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.polyWord + " R G B", "set polygon color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.uiFGWord + " R G B", "set UI foreground color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.uiBGWord + " R G B", "set UI background color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.uiHighlightWord + " R G B", "set UI highlight text color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.uiSelectWord + " R G B", "set UI selected color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.uiLockedWord + " R G B", "set UI locked color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colorWord + " " + Keywords.uiBorderWord + " R G B", "set UI border color", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.colourWord, "same as " + Keywords.colorWord, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Pattern"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Pattern:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.xOffsetWord + " <-" + (view.engine.maxGridSize >> 1) + ".." + (view.engine.maxGridSize >> 1) + ">", "set pattern x offset", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.yOffsetWord + " <-" + (view.engine.maxGridSize >> 1) + ".." + (view.engine.maxGridSize >> 1) + ">", "set pattern y offset", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.deleteRangeWord + " <" + ViewConstants.minDeleteRadius + ".." + ViewConstants.maxDeleteRadius + ">", "set boundary delete range", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.noCopyWord, "disable pattern source copy", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.noSourceWord, "hide pattern source", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.maxGridSizeWord + " <" + ViewConstants.minGridPower + ".." + ViewConstants.maxGridPower + ">", "set maximum grid size 2^n", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.recipeWord + " name X Y (<1..>)+", "create a named recipe", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.rleWord + " name rle", "create a named rle", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " (X Y) (TRANS)", "... X Y and transformation", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.transTypeIdentity, "identity", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.transTypeFlip, "flip", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.transTypeFlipX, "flip X", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.transTypeFlipY, "flip Y", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.transTypeSwapXY, "swap X and Y", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.transTypeSwapXYFlip, "swap X and Y and flip", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.transTypeRotateCW, "rotate clockwise", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " " + Keywords.transTypeRotateCCW, "rotate counter-clockwise", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.pasteWord + " name|rle (X Y)", "paste rle at optional X Y", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " (TRANS)", "... optional transformation", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.pasteTWord + " <0..>", "set paste generation", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "(recipe|<1..>+)*", "... optional delta list", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.pasteTWord + " " + Keywords.everyWord + " <1..>", "set paste interval", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " (<0..> (<1..>))", "... optional start and end", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.pasteModeWord + " " + Keywords.pasteModeOrWord + "|" + Keywords.pasteModeCopyWord + "|" + Keywords.pasteModeXorWord + "|" + Keywords.pasteModeAndWord + "|" + Keywords.pasteModeNotWord, "set the paste mode", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, Keywords.killGlidersWord, "suppress escaping gliders", ctx, x, y, height, helpLine);
	};

	// render information topic
	Help.renderInformationTopic = function(view, ctx, x, y, height, helpLine) {
		var i = 0, j = 0, value = 0,

			// flag
			flag = false,

			// number of Viewers
			numViewers = Controller.numViewers(),

			// get the current colour set
			colourList = view.colourList,

			// get the current theme
			theme = view.engine.themes[view.engine.colourTheme],

			// item name and details
			itemName = "",
			itemDetails = "",

			// colour rgb and name
			colourValue = "",

			// section number
			sectionNum = 0;

		// set initial line
		view.lineNo = 1;

		// disable line wrap to start with
		view.wrapHelpText = false;

		// reset sections
		view.helpSections = [];

		// information
		view.tabs[0] = 128;
		view.helpSections[sectionNum] = [view.lineNo, "Top"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Information", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// display information
		view.helpSections[sectionNum] = [view.lineNo, "Display"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Display:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Size", view.displayWidth + " x " + view.displayHeight, ctx, x, y, height, helpLine);
		if (DocConfig.limitWidth) {
			y = this.renderHelpLine(view, "Limit Width", view.maxCodeWidth, ctx, x, y, height, helpLine);
		}
		value = view.engine.camZoom;
		if (value < 1) {
			value = -1 / value;
		}
		y = this.renderHelpLine(view, "View", "X " + -((view.engine.width / 2 - (view.engine.xOff + view.engine.originX)) | 0) + "  Y " + -((view.engine.height / 2 - (view.engine.yOff + view.engine.originY)) | 0) + "  Z " + (value.toFixed(2)) + "  ANGLE " + (view.engine.angle.toFixed(0)), ctx, x, y, height, helpLine);
		value = view.savedZoom;
		if (value < 1) {
			value = 1 / value;
		}
		y = this.renderHelpLine(view, "Saved View", "X " + -((view.engine.width / 2 - view.savedX) | 0) + "  Y " + -((view.engine.height / 2 - view.savedY) | 0) + "  Z " + (value.toFixed(2)) + "  ANGLE " + (view.savedAngle.toFixed(0)), ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Origin", "X " + view.engine.originX.toFixed(2) + "  Y " + view.engine.originY.toFixed(2) + "  Z " + view.engine.originZ.toFixed(3), ctx, x, y, height, helpLine);
		if (view.viewOnly) {
			if (view.multiStateView) {
				itemName = "Multi-State Viewer";
			} else {
				itemName = "Viewer";
			}
		} else {
			if (view.engine.isLifeHistory) {
				itemName = "History Player";
			}
		}
		y = this.renderHelpLine(view, "Type", itemName, ctx, x, y, height, helpLine);
		if (view.engine.isHex) {
			itemName = "Hexagonal";
		} else {
			if (view.engine.isTriangular) {
				itemName = "Triangular"
			} else {
				itemName = "Square";
			}
		}
		y = this.renderHelpLine(view, "Mode", itemName, ctx, x, y, height, helpLine);
		if (view.engine.isHex && view.engine.useHexagons) {
			itemName = "Hexagonal";
		} else {
			if (view.engine.isTriangular) {
				itemName = "Triangular";
			} else {
				itemName = "Square";
			}
		}
		y = this.renderHelpLine(view, "Cells", itemName, ctx, x, y, height, helpLine);
		if (view.thumbnailEverOn) {
			y = this.renderHelpLine(view, "Thumbnail", "1/" + view.thumbnailDivisor, ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// pattern information
		view.helpSections[sectionNum] = [view.lineNo, "Pattern"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Pattern:", ctx, x, y, height, helpLine);

		// check name and originator
		if (view.patternName !== "") {
			y = this.renderHelpLine(view, "Name", view.patternName, ctx, x, y, height, helpLine);
		}
		if (view.patternOriginator !== "") {
			y = this.renderHelpLine(view, "Originator", view.patternOriginator, ctx, x, y, height, helpLine);
		}

		y = this.renderHelpLine(view, "Actual Size", view.patternWidth + " x " + view.patternHeight, ctx, x, y, height, helpLine);
		if (view.specifiedWidth !== -1 && view.specifiedHeight !== -1) {
			y = this.renderHelpLine(view, "Specified", view.specifiedWidth + " x " + view.specifiedHeight, ctx, x, y, height, helpLine);
		}
		if (view.pasteList.length > 0) {
			y = this.renderHelpLine(view, "Pastes", view.pasteList.length, ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Paste Size", (view.pasteRightX - view.pasteLeftX + 1) + " x " + (view.pasteTopY - view.pasteBottomY + 1) + " from (" + view.pasteLeftX + ", " + view.pasteBottomY + ") to (" + view.pasteRightX + ", " + view.pasteTopY + ")", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Paste Max T", view.maxPasteGen + (view.isPasteEvery ? (" + " + Keywords.everyWord) : ""), ctx, x, y, height, helpLine);
		}
		if (view.rleList.length > 0) {
			y = this.renderHelpLine(view, "RLEs", view.rleList.length, ctx, x, y, height, helpLine);
		}
		if (view.recipeList.length > 0) {
			y = this.renderHelpLine(view, "Recipes", view.recipeList.length, ctx, x, y, height, helpLine);
		}

		y = this.renderHelpLine(view, "Offset", "X " + view.xOffset + "  Y " + view.yOffset, ctx, x, y, height, helpLine);
		if (view.genDefined) {
			y = this.renderHelpLine(view, "CXRLE Gen", view.genOffset, ctx, x, y, height, helpLine);
		}
		if (view.posDefined) {
			y = this.renderHelpLine(view, "CXRLE Pos", "X " + view.posXOffset + "  Y " + view.posYOffset, ctx, x, y, height, helpLine);
		}
		if (view.wasClipped) {
			y = this.renderHelpLine(view, "Clipped", (view.engine.boundedGridWidth === 0 ? "Inf" : view.engine.boundedGridWidth) + " x " + (view.engine.boundedGridHeight === 0 ? "Inf" : view.engine.boundedGridHeight) + " " + PatternManager.boundedGridName(view.engine.boundedGridType), ctx, x, y, height, helpLine);
		}

		if (!view.executable) {
			itemName = view.patternRuleName;
			if (itemName === "") {
				itemName = "(none)";
			}
		} else {
			itemName = view.patternRuleName;
		}

		// check for MAP rule
		if (itemName.substr(0, 3) === "MAP" && itemName.length === PatternManager.map512Length + 3) {
			// display on multiple lines
			y = this.renderHelpLine(view, "Rule", "MAP", ctx, x, y, height, helpLine);
			value = 3;
			while (value < PatternManager.map512Length + 3) {
				y = this.renderHelpLine(view, "  " + (value - 3), itemName.substr(value, 16), ctx, x, y, height, helpLine);
				value += 16;
			}
		} else {
			// allow help to wrap short MAP or non-MAP rule
			view.wrapHelpText = true;
			y = this.renderHelpLine(view, "Rule", itemName, ctx, x, y, height, helpLine);
			view.wrapHelpText = false;
		}

		// check for alias name
		if (view.patternAliasName !== "") {
			y = this.renderHelpLine(view, "Alias", view.patternAliasName, ctx, x, y, height, helpLine);
		}

		// display neighbourhood
		if (view.engine.wolframRule !== -1) {
			itemName = "1D";
		} else {
			if (view.engine.patternDisplayMode) {
				itemName = "Hex";
			} else {
				if (view.engine.isHROT) {
					if (view.engine.HROT.type === PatternManager.mooreHROT) {
						itemName = "Moore";
					} else if (view.engine.HROT.type === PatternManager.vonNeumannHROT) {
						itemName = "von Neumann";
					} else {
						itemName = "Circular";
					}
					if (view.engine.HROT.range > 1) {
						itemName += " range " + view.engine.HROT.range;
					}
				} else {
					if (view.engine.isTriangular) {
						itemName = "Triangular";
						if (view.engine.triangularNeighbourhood === PatternManager.triangularEdges) {
							itemName += " Edges";
						} else if (view.engine.triangularNeighbourhood === PatternManager.triangularVertices) {
							itemName += " Vertices";
						}
					} else {
						if (view.engine.isVonNeumann) {
							itemName = "von Neumann";
						} else {
							itemName = "Moore";
						}
					}
				}
			}
		}
		y = this.renderHelpLine(view, "N'hood", itemName, ctx, x, y, height, helpLine);

		// get number of states
		itemName = view.patternStates;
		if (view.patternStates > 2 && view.patternUsedStates !== view.patternStates) {
			itemName = view.patternUsedStates + " of " + itemName;
		}
		y = this.renderHelpLine(view, "States", itemName, ctx, x, y, height, helpLine);

		// state counts
		if (view.patternStateCount) {
			for (i = 1; i < view.patternStates; i += 1) {
				if (view.patternStateCount[i]) {
					y = this.renderHelpLine(view, "State " + i, view.patternStateCount[i], ctx, x, y, height, helpLine);
				}
			}
		}

		// output decoder used
		y = this.renderHelpLine(view, "Decoder", view.patternFormat, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// grid information
		view.helpSections[sectionNum] = [view.lineNo, "Grid"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Grid:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Size", view.engine.width + " x " + view.engine.height, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Maximum", view.engine.maxGridSize + " x " + view.engine.maxGridSize, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Area", this.areaString(view), ctx, x, y, height, helpLine);
		if ((view.engine.counter & 1) !== 0) {
			y = this.renderHelpLine(view, "Tiles", (view.engine.tileCount(view.engine.nextTileGrid) + " / " + view.engine.tileCount(view.engine.colourTileHistoryGrid)), ctx, x, y, height, helpLine);
		} else {
			y = this.renderHelpLine(view, "Tiles", (view.engine.tileCount(view.engine.tileGrid) + " / " + view.engine.tileCount(view.engine.colourTileHistoryGrid)), ctx, x, y, height, helpLine);
		}
		if (view.engine.state6TileGrid) {
			y = this.renderHelpLine(view, "State6", view.engine.tileCount(view.engine.state6TileGrid), ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "Tile Size", (view.engine.tileX << 3) + " x " + view.engine.tileY, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Generation", view.engine.counter, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "DeleteRange", view.engine.removePatternRadius, ctx, x, y, height, helpLine);
		if (view.engine.clearGliders) {
			y = this.renderHelpLine(view, "KillGliders", view.engine.numClearedGliders, ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// bounded grid information
		if (view.engine.boundedGridType !== -1) {
			view.helpSections[sectionNum] = [view.lineNo, "Bounded"];
			sectionNum += 1;
			y = this.renderHelpLine(view, "", "Bounded grid:", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Type", PatternManager.boundedGridName(view.engine.boundedGridType), ctx, x, y, height, helpLine);
			if (view.engine.boundedGridWidth === 0) {
				y = this.renderHelpLine(view, "Width", "Infinite", ctx, x, y, height, helpLine);
			} else {
				y = this.renderHelpLine(view, "Width", view.engine.boundedGridWidth, ctx, x, y, height, helpLine);
			}
			// sphere only has width
			if (view.engine.boundedGridType !== 4) {
				if (view.engine.boundedGridHeight === 0) {
					y = this.renderHelpLine(view, "Height", "Infinite", ctx, x, y, height, helpLine);
				} else {
					y = this.renderHelpLine(view, "Height", view.engine.boundedGridHeight, ctx, x, y, height, helpLine);
				}

				// klein bottle has twist
				if (view.engine.boundedGridType === 2) {
					if (view.engine.boundedGridHorizontalTwist) {
						y = this.renderHelpLine(view, "Twist", "Horizontal", ctx, x, y, height, helpLine);
					} else {
						y = this.renderHelpLine(view, "Twist", "Vertical", ctx, x, y, height, helpLine);
					}
				}

				// check for shifts
				if (view.engine.boundedGridHorizontalShift !== 0) {
					y = this.renderHelpLine(view, "H'Shift", view.engine.boundedGridHorizontalShift, ctx, x, y, height, helpLine);
				}
				if (view.engine.boundedGridVerticalShift !== 0) {
					y = this.renderHelpLine(view, "V'Shift", view.engine.boundedGridVerticalShift, ctx, x, y, height, helpLine);
				}
			}
			y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		}

		// autofit
		view.helpSections[sectionNum] = [view.lineNo, "AutoFit"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "AutoFit:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Enabled", view.autoFit ? "On" : "Off", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Mode", this.autoFitName(view), ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// track
		view.helpSections[sectionNum] = [view.lineNo, "Track"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Track:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Enabled", (view.trackDefined && !view.trackDisabled) ? "On" : "Off", ctx, x, y, height, helpLine);
		if (view.trackDefined) {
			if (view.trackBoxDefined) {
				y = this.renderHelpLine(view, "Mode", "Track Box", ctx, x, y, height, helpLine);
				y = this.renderHelpLine(view, "Definition", "E " + view.trackBoxE.toFixed(3) + "  S " + view.trackBoxS.toFixed(3) + "  W " + view.trackBoxW.toFixed(3) + "  N " + view.trackBoxN.toFixed(3), ctx, x, y, height, helpLine);
			} else {
				y = this.renderHelpLine(view, "Mode", "Track", ctx, x, y, height, helpLine);
				y = this.renderHelpLine(view, "Definition", "X " + view.trackBoxE.toFixed(3) + "  Y " + view.trackBoxS.toFixed(3), ctx, x, y, height, helpLine);
			}
		}
		y = this.renderHelpLine(view, "Current", "E " + view.currentTrackSpeedE.toFixed(3) + "  S " + view.currentTrackSpeedS.toFixed(3) + "  W " + view.currentTrackSpeedW.toFixed(3) + "  N " + view.currentTrackSpeedN.toFixed(3), ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// snapshot information
		view.helpSections[sectionNum] = [view.lineNo, "Snapshots"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Step back:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Enabled", view.noHistory ? "Off" : "On", ctx, x, y, height, helpLine);
		if (!view.noHistory) {
			y = this.renderHelpLine(view, "Snapshots", view.engine.snapshotManager.usedBuffers() + "/" + view.engine.snapshotManager.buffers(), ctx, x, y, height, helpLine);
			i = 0;
			value = view.engine.snapshotManager.numResetPoints();
			if (value > 0) {
				y = this.renderHelpLine(view, "Reset Gens", value, ctx, x, y, height, helpLine);
				while (i < value) {
					y = this.renderHelpLine(view, String(i), (view.engine.snapshotManager.resetSnapshots[i].counter), ctx, x, y, height, helpLine);
					i += 1;
				}
			}
			y = this.renderHelpLine(view, "Buffer", (view.engine.snapshotManager.bufferSize() >> 10) + "K", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Next Gen", view.engine.nextSnapshotTarget, ctx, x, y, height, helpLine);

		}
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// engine information
		view.helpSections[sectionNum] = [view.lineNo, "Engine"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Engine:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Name", ViewConstants.versionName, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Build", ViewConstants.versionBuild, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Author", ViewConstants.versionAuthor, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Decoders", "RLE, Life 1.06, Life 1.05, Cells", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "N'hoods", "Moore, Hex, von Neumann, Circular, 1D", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Rules", "Wolfram, Totalistic, Generations,", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " ", "Isotropic Non-Totalistic (Hensel, Callahan),", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " ", "Alternating, MAP, Larger than Life (LtL),", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, " ", "Higher-range outer-totalistic (HROT)", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "BoundedGrid", "Plane, Torus, Klein, Cross-surface, Sphere", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "States", "2 state, [R]History, Niemiec, Generations", ctx, x, y, height, helpLine);

		y = this.renderHelpLine(view, "Viewers", numViewers, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Playing", Controller.viewersPlaying(), ctx, x, y, height, helpLine);
		if (DocConfig.multi) {
			value = Controller.patterns.length;
			y = this.renderHelpLine(view, "Universe", "Multi (" + (view.universe + 1) + " of " + value + ")", ctx, x, y, height, helpLine);
			// wrap long rule names
			view.wrapHelpText = true;
			for (i = 0; i < value; i += 1) {
				y = this.renderHelpLine(view, (String(i + 1) + ((i === view.universe) ? "*" : "")), Controller.patterns[i].name, ctx, x, y, height, helpLine);
				y = this.renderHelpLine(view, " ", Controller.patterns[i].rule, ctx, x, y, height, helpLine);
				y = this.renderHelpLine(view, " ", Controller.patterns[i].width + " x " + Controller.patterns[i].height, ctx, x, y, height, helpLine);
			}
			view.wrapHelpText = false;
		} else {
			y = this.renderHelpLine(view, "Universe", "Single", ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// colour set information
		view.tabs[1] = 210;
		view.tabs[2] = 270;
		view.tabs[3] = 330;
		if (view.multiStateView) {
			view.helpSections[sectionNum] = [view.lineNo, "Colours"];
			sectionNum += 1;
			y = this.renderHelpLine(view, "", "Set:", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Name", view.colourSetName, ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Used", view.patternUsedStates, ctx, x, y, height, helpLine);
			for (i = 0; i < view.customColourUsed.length; i += 1) {
				// check if the state is used
				if (view.customColourUsed[i] !== ViewConstants.stateNotUsed) {
					// get colour value
					colourValue = this.rgbString((colourList[i] >> 16) & 255, (colourList[i] >> 8) & 255, colourList[i] & 255);
					itemName = String(i);
					
					// if the colour is custom (but the whole set isn't custom) then add a star to the name
					if (view.customColourUsed[i] === ViewConstants.stateUsedCustom && !view.allCustom) {
						itemName += "*";
					}

					// render the colour box
					this.renderColourBox(view, colourList[i] >> 16, (colourList[i] >> 8) & 255, colourList[i] & 255, ctx, x + view.tabs[0], y, height, helpLine);
					y = this.renderHelpLine(view, itemName, colourValue, ctx, x, y, height, helpLine);
				}
			}
		} else {
			// colour theme information
			view.helpSections[sectionNum] = [view.lineNo, "Theme"];
			sectionNum += 1;
			y = this.renderHelpLine(view, "", "Theme:", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Name", view.engine.themes[view.engine.colourTheme].name, ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "History", view.historyStates, ctx, x, y, height, helpLine);
			this.renderColourBox(view, view.engine.redChannel[0], view.engine.greenChannel[0], view.engine.blueChannel[0], ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "Background", this.rgbString(view.engine.redChannel[0], view.engine.greenChannel[0], view.engine.blueChannel[0]), ctx, x, y, height, helpLine);

			// check for none rule
			if (view.engine.isNone) {
				for (i = 1; i < view.engine.multiNumStates; i += 1) {
					this.renderColourBox(view, view.engine.redChannel[i], view.engine.greenChannel[i], view.engine.blueChannel[i], ctx, x + view.tabs[0], y, height, helpLine);
					y = this.renderHelpLine(view, "State " + i, this.rgbString(view.engine.redChannel[i], view.engine.greenChannel[i], view.engine.blueChannel[i]), ctx, x, y, height, helpLine);
				}
			} else {
				// check for Generations or HROT rules
				if (view.engine.multiNumStates > 2) {
					// draw the alive state
					j = view.engine.multiNumStates + view.historyStates - 1; 
					this.renderColourBox(view, view.engine.redChannel[j], view.engine.greenChannel[j], view.engine.blueChannel[j], ctx, x + view.tabs[0], y, height, helpLine);
					y = this.renderHelpLine(view, "Alive", this.rgbString(view.engine.redChannel[j], view.engine.greenChannel[j], view.engine.blueChannel[j]), ctx, x, y, height, helpLine);
	
					// draw dying states
					for (i = 1; i < view.engine.multiNumStates - 1; i += 1) {
						j = view.engine.multiNumStates - i + view.historyStates - 1;
						this.renderColourBox(view, view.engine.redChannel[j], view.engine.greenChannel[j], view.engine.blueChannel[j], ctx, x + view.tabs[0], y, height, helpLine);
						y = this.renderHelpLine(view, "Dying " + i, this.rgbString(view.engine.redChannel[j], view.engine.greenChannel[j], view.engine.blueChannel[j]), ctx, x, y, height, helpLine);
					}
					if (view.historyStates > 0) {
						j = view.historyStates;
						this.renderColourBox(view, view.engine.redChannel[j], view.engine.greenChannel[j], view.engine.blueChannel[j], ctx, x + view.tabs[0], y, height, helpLine);
						y = this.renderHelpLine(view, "Dead", this.rgbString(view.engine.redChannel[j], view.engine.greenChannel[j], view.engine.blueChannel[j]), ctx, x, y, height, helpLine);
						if (view.historyStates > 1) {
							j = 1;
							this.renderColourBox(view, view.engine.redChannel[j], view.engine.greenChannel[j], view.engine.blueChannel[j], ctx, x + view.tabs[0], y, height, helpLine);
							y = this.renderHelpLine(view, "DeadRamp", this.rgbString(view.engine.redChannel[j], view.engine.greenChannel[j], view.engine.blueChannel[j]), ctx, x, y, height, helpLine);
						}
					}
				} else {
					// normal theme
					this.renderColourBox(view, theme.aliveRange.startColour.red, theme.aliveRange.startColour.green, theme.aliveRange.startColour.blue, ctx, x + view.tabs[0], y, height, helpLine);
					y = this.renderHelpLine(view, "Alive", this.rgbObjectString(theme.aliveRange.startColour), ctx, x, y, height, helpLine);
	
					// check if there is a ramp between alive start and end
					if (theme.aliveRange.startColour.red !== theme.aliveRange.endColour.red || theme.aliveRange.startColour.green !== theme.aliveRange.endColour.green || theme.aliveRange.startColour.blue !== theme.aliveRange.endColour.blue) {
						this.renderColourBox(view, theme.aliveRange.endColour.red, theme.aliveRange.endColour.green, theme.aliveRange.endColour.blue, ctx, x + view.tabs[0], y, height, helpLine);
						y = this.renderHelpLine(view, "AliveRamp", this.rgbObjectString(theme.aliveRange.endColour), ctx, x, y, height, helpLine);
					} else {
						y = this.renderHelpLine(view, "AliveRamp", "    (none)", ctx, x, y, height, helpLine);
					}
	
					// if there are no history states don't draw dead states
					if (view.historyStates > 0) {
						this.renderColourBox(view, theme.deadRange.endColour.red, theme.deadRange.endColour.green, theme.deadRange.endColour.blue, ctx, x + view.tabs[0], y, height, helpLine);
						y = this.renderHelpLine(view, "Dead", this.rgbObjectString(theme.deadRange.endColour), ctx, x, y, height, helpLine);
	
						// check if there is a ramp between dead start and end
						if (view.historyStates > 1) {
							if (theme.deadRange.startColour.red !== theme.deadRange.endColour.red || theme.deadRange.startColour.green !== theme.deadRange.endColour.green || theme.deadRange.startColour.blue !== theme.deadRange.endColour.blue) {
								this.renderColourBox(view, theme.deadRange.startColour.red, theme.deadRange.startColour.green, theme.deadRange.startColour.blue, ctx, x + view.tabs[0], y, height, helpLine);
								y = this.renderHelpLine(view, "DeadRamp", this.rgbObjectString(theme.deadRange.startColour), ctx, x, y, height, helpLine);
							} else {
								y = this.renderHelpLine(view, "DeadRamp", "    (none)", ctx, x, y, height, helpLine);
							}
						}
					}
				}
			}
	
			// check for History rules
			if (view.engine.isLifeHistory) {
				for (i = 3; i <= 6; i += 1) {
					value = 128 + ViewConstants.stateMap[i];
					colourValue = this.rgbString(view.engine.redChannel[value], view.engine.greenChannel[value], view.engine.blueChannel[value]);
					itemName = ViewConstants.stateNames[i];
					
					// render the colour boX
					this.renderColourBox(view, view.engine.redChannel[value], view.engine.greenChannel[value], view.engine.blueChannel[value], ctx, x + view.tabs[0], y, height, helpLine);
					y = this.renderHelpLine(view, itemName, colourValue, ctx, x, y, height, helpLine);
				}
			}
		}

		// display boundary colour
		this.renderColourBox(view, view.customBoundaryColour[0], view.customBoundaryColour[1], view.customBoundaryColour[2], ctx, x + view.tabs[0], y, height, helpLine);
		y = this.renderHelpLine(view, "Boundary", this.rgbString(view.customBoundaryColour[0], view.customBoundaryColour[1], view.customBoundaryColour[2]), ctx, x, y, height, helpLine);

		// display custom text colour if defined
		if (view.customTextColour) {
			this.renderColourBox(view, view.customTextColour[0], view.customTextColour[1], view.customTextColour[2], ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "Text", this.rgbString(view.customTextColour[0], view.customTextColour[1], view.customTextColour[2]), ctx, x, y, height, helpLine);
		}

		// display custom text colour if defined
		if (view.customErrorColour) {
			this.renderColourBox(view, view.customErrorColour[0], view.customErrorColour[1], view.customErrorColour[2], ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "Error", this.rgbString(view.customErrorColour[0], view.customErrorColour[1], view.customErrorColour[2]), ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// grid line information
		view.helpSections[sectionNum] = [view.lineNo, "Grid Lines"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Grid Lines:", ctx, x, y, height, helpLine);
		itemName = view.engine.displayGrid ? "On" : "Off";
		if (view.engine.displayGrid && !view.engine.canDisplayGrid()) {
			itemName += " (Hidden)";
		}
		y = this.renderHelpLine(view, "Enabled", itemName, ctx, x, y, height, helpLine);

		// display grid line colour
		this.renderColourBox(view, view.engine.gridLineRaw >> 16, (view.engine.gridLineRaw >> 8) & 255, view.engine.gridLineRaw & 255, ctx, x + view.tabs[0], y, height, helpLine);
		y = this.renderHelpLine(view, "Line Color", this.rgbString(view.engine.gridLineRaw >> 16, (view.engine.gridLineRaw >> 8) & 255, view.engine.gridLineRaw & 255), ctx, x, y, height, helpLine);

		// display grid line major colour
		this.renderColourBox(view, view.engine.gridLineBoldRaw >> 16, (view.engine.gridLineBoldRaw >> 8) & 255, view.engine.gridLineBoldRaw & 255, ctx, x + view.tabs[0], y, height, helpLine);
		y = this.renderHelpLine(view, "Major Color", this.rgbString(view.engine.gridLineBoldRaw >> 16, (view.engine.gridLineBoldRaw >> 8) & 255, view.engine.gridLineBoldRaw & 255), ctx, x, y, height, helpLine);

		// grid line major interval
		if (view.engine.gridLineMajor > 0 && view.engine.gridLineMajorEnabled) {
			itemName = String(view.engine.gridLineMajor);
		} else {
			itemName = "Off";
		}
		y = this.renderHelpLine(view, "Interval", itemName, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// population graph information
		view.helpSections[sectionNum] = [view.lineNo, "Graph"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Population Graph:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Enabled", view.popGraph ? "On" : "Off", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Disabled", view.graphDisabled ? "On" : "Off", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Mode", view.popGraphLines ? "Lines" : "Points", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Opacity", view.popGraphOpacity.toFixed(2), ctx, x, y, height, helpLine);
		this.renderColourBox(view, view.engine.graphBgColor[0], view.engine.graphBgColor[1], view.engine.graphBgColor[2], ctx, x + view.tabs[0], y, height, helpLine);
		y = this.renderHelpLine(view, "Bg Color", this.rgbString(view.engine.graphBgColor[0], view.engine.graphBgColor[1], view.engine.graphBgColor[2]), ctx, x, y, height, helpLine);
		this.renderColourBox(view, view.engine.graphAxisColor[0], view.engine.graphAxisColor[1], view.engine.graphAxisColor[2], ctx, x + view.tabs[0], y, height, helpLine);
		y = this.renderHelpLine(view, "Axis Color", this.rgbString(view.engine.graphAxisColor[0], view.engine.graphAxisColor[1], view.engine.graphAxisColor[2]), ctx, x, y, height, helpLine);
		this.renderColourBox(view, view.engine.graphAliveColor[0], view.engine.graphAliveColor[1], view.engine.graphAliveColor[2], ctx, x + view.tabs[0], y, height, helpLine);
		y = this.renderHelpLine(view, "Alive Color", this.rgbString(view.engine.graphAliveColor[0], view.engine.graphAliveColor[1], view.engine.graphAliveColor[2]), ctx, x, y, height, helpLine);
		this.renderColourBox(view, view.engine.graphBirthColor[0], view.engine.graphBirthColor[1], view.engine.graphBirthColor[2], ctx, x + view.tabs[0], y, height, helpLine);
		y = this.renderHelpLine(view, "Birth Color", this.rgbString(view.engine.graphBirthColor[0], view.engine.graphBirthColor[1], view.engine.graphBirthColor[2]), ctx, x, y, height, helpLine);
		this.renderColourBox(view, view.engine.graphDeathColor[0], view.engine.graphDeathColor[1], view.engine.graphDeathColor[2], ctx, x + view.tabs[0], y, height, helpLine);
		y = this.renderHelpLine(view, "Death Color", this.rgbString(view.engine.graphDeathColor[0], view.engine.graphDeathColor[1], view.engine.graphDeathColor[2]), ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// random seed information
		//view.helpSections[sectionNum] = [view.lineNo, "Random"];
		//sectionNum += 1;
		//y = this.renderHelpLine(view, "", "Random Seed:", ctx, x, y, height, helpLine);
		//y = this.renderHelpLine(view, "Custom", view.randomSeedCustom ? "On" : "Off", ctx, x, y, height, helpLine);
		//y = this.renderHelpLine(view, "Seed", view.randomSeed, ctx, x, y, height, helpLine);
		//y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// starfield information
		view.helpSections[sectionNum] = [view.lineNo, "Stars"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Stars:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Enabled", view.starsOn ? "On" : "Off", ctx, x, y, height, helpLine);

		this.renderColourBox(view, view.starField.red, view.starField.green, view.starField.blue, ctx, x + view.tabs[0], y, height, helpLine);
		y = this.renderHelpLine(view, "Color", this.rgbObjectString(view.starField), ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// script information
		view.helpSections[sectionNum] = [view.lineNo, "Script"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Script:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Commands", view.numScriptCommands, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Errors", view.numScriptErrors, ctx, x, y, height, helpLine);

		// waypoints
		if (view.waypointsDefined) {
			y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
			view.helpSections[sectionNum] = [view.lineNo, "Waypoints"];
			sectionNum += 1;
			y = this.renderHelpLine(view, "", "Waypoints:", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Enabled", view.waypointsDisabled ? "Off" : "On", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Number", view.waypointManager.numWaypoints(), ctx, x, y, height, helpLine);
			for (i = 0; i < view.waypointManager.numWaypoints(); i += 1) {
				itemName = String(i);

				// check for current waypoint
				if (i === view.waypointManager.tempIndex) {
					// check if at last waypoint
					if (view.waypointManager.atLast(view.elapsedTime)) {
						itemName += ">";
					} else {
						itemName += "*";
					}
				}
				y = this.renderHelpLine(view, itemName, view.waypointManager.waypointAsText(i, Keywords.stringDelimiter), ctx, x, y, height, helpLine);
			}
		}

		// points of interest
		if (view.waypointManager.numPOIs()) {
			y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
			view.helpSections[sectionNum] = [view.lineNo, "POIs"];
			sectionNum += 1;
			y = this.renderHelpLine(view, "", "Points of interest:", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Number", view.waypointManager.numPOIs(), ctx, x, y, height, helpLine);
			for (i = 0; i < view.waypointManager.numPOIs(); i += 1) {
				itemName = String(i + 1);
				if (i === view.currentPOI) {
					itemName += "*";
				}
				if (i === view.defaultPOI) {
					itemName += " INITIAL";
				}
				flag = false;
				itemDetails = view.waypointManager.poiCameraAsText(i);
				if (itemDetails !== "") {
					y = this.renderHelpLine(view, (flag ? " " : itemName), (flag ? "  " : "") + itemDetails, ctx, x, y, height, helpLine);
					flag = true;
				}
				itemDetails = view.waypointManager.poiThemeDepthLayerAsText(i);
				if (itemDetails !== "") {
					y = this.renderHelpLine(view, (flag ? " " : itemName), (flag ? "  " : "") + itemDetails, ctx, x, y, height, helpLine);
					flag = true;
				}
				itemDetails = view.waypointManager.poiLoopStopGpsStepAsText(i);
				if (itemDetails !== "") {
					y = this.renderHelpLine(view, (flag ? " " : itemName), (flag ? "  " : "") + itemDetails, ctx, x, y, height, helpLine);
					flag = true;
				}
				itemDetails = view.waypointManager.poiActionAsText(i);
				if (itemDetails !== "") {
					y = this.renderHelpLine(view, (flag ? " " : itemName), (flag ? "  " : "") + itemDetails, ctx, x, y, height, helpLine);
					flag = true;
				}
				itemDetails = view.waypointManager.poiStartGenAsText(i);
				if (itemDetails !== "") {
					y = this.renderHelpLine(view, (flag ? " " : itemName), (flag ? "  " : "") + itemDetails, ctx, x, y, height, helpLine);
					flag = true;
				}
				itemDetails = view.waypointManager.poiMessageAsText(i, Keywords.stringDelimiter);
				if (itemDetails !== "") {
					y = this.renderHelpLine(view, (flag ? " " : itemName), (flag ? "  " : "") + itemDetails, ctx, x, y, height, helpLine);
					flag = true;
				}
			}
		}
	};

	// render themes topic
	Help.renderThemesTopic = function(view, ctx, x, y, height, helpLine) {
		var i = 0,

			// get the current theme
			theme = view.engine.themes[view.engine.colourTheme],

			// section number
			sectionNum = 0;

		// set initial line
		view.lineNo = 1;

		// disable line wrap to start with
		view.wrapHelpText = false;

		// reset sections
		view.helpSections = [];
		
		// themes list
		view.tabs[0] = 130;
		view.tabs[1] = 200;
		view.tabs[2] = 250;
		view.tabs[3] = 300;
		view.helpSections[sectionNum] = [view.lineNo, "Top"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Themes", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "Themes are used to provide a visual representation of", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "cell history and longevity", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "2-State"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Two-state Themes:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "BACKGROUND", "cell never occupied", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "ALIVE", "cell just born", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "ALIVERAMP", "cell alive for several generations", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "DEAD", "cell just died", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "DEADRAMP", "cell dead for several generations", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", (LifeConstants.aliveMax - LifeConstants.aliveStart + 1) + " states from ALIVE to ALIVERAMP", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", view.historyStates + " (HISTORYSTATES) states from DEAD to DEADRAMP", ctx, x, y, height, helpLine);

		// draw each 2-state theme except the custom theme
		for (i = 0; i < view.engine.themes.length - 1; i += 1) {
			y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
			theme = view.engine.themes[i];
			// draw theme name with a '*' if it is the current theme
			y = this.renderHelpLine(view, "Name" + ((i === view.engine.colourTheme && view.engine.multiNumStates <= 2) ? "*" : ""), theme.name, ctx, x, y, height, helpLine);
			// background colour
			this.renderColourBox(view, theme.unoccupied.red, theme.unoccupied.green, theme.unoccupied.blue, ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "BACKGROUND", this.rgbObjectString(theme.unoccupied), ctx, x, y, height, helpLine);
			// alive colour
			this.renderColourBox(view, theme.aliveRange.startColour.red, theme.aliveRange.startColour.green, theme.aliveRange.startColour.blue, ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "ALIVE", this.rgbObjectString(theme.aliveRange.startColour), ctx, x, y, height, helpLine);
			// alive ramp if different than alive
			if (!(theme.aliveRange.startColour.red === theme.aliveRange.endColour.red && theme.aliveRange.startColour.green === theme.aliveRange.endColour.green && theme.aliveRange.startColour.blue === theme.aliveRange.endColour.blue)) {
				this.renderColourBox(view, theme.aliveRange.endColour.red, theme.aliveRange.endColour.green, theme.aliveRange.endColour.blue, ctx, x + view.tabs[0], y, height, helpLine);
				y = this.renderHelpLine(view, "ALIVERAMP", this.rgbObjectString(theme.aliveRange.endColour), ctx, x, y, height, helpLine);
			}
			// dead colour
			this.renderColourBox(view, theme.deadRange.endColour.red, theme.deadRange.endColour.green, theme.deadRange.endColour.blue, ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "DEAD", this.rgbObjectString(theme.deadRange.endColour), ctx, x, y, height, helpLine);
			// dead ramp if different than dead
			if (!(theme.deadRange.startColour.red === theme.deadRange.endColour.red && theme.deadRange.startColour.green === theme.deadRange.endColour.green && theme.deadRange.startColour.blue === theme.deadRange.endColour.blue)) {
				this.renderColourBox(view, theme.deadRange.startColour.red, theme.deadRange.startColour.green, theme.deadRange.startColour.blue, ctx, x + view.tabs[0], y, height, helpLine);
				y = this.renderHelpLine(view, "DEADRAMP", this.rgbObjectString(theme.deadRange.startColour), ctx, x, y, height, helpLine);
			}
			// check if grid lines are customised
			if (theme.gridDefined) {
				// grid line colour
				this.renderColourBox(view, theme.gridColour >> 16, (theme.gridColour >> 8) & 255, theme.gridColour & 255, ctx, x + view.tabs[0], y, height, helpLine);
				y = this.renderHelpLine(view, "GRID", this.rgbString(theme.gridColour >> 16, (theme.gridColour >> 8) & 255, theme.gridColour & 255), ctx, x, y, height, helpLine);
				// major grid line colour
				this.renderColourBox(view, theme.gridMajorColour >> 16, (theme.gridMajorColour >> 8) & 255, theme.gridMajorColour & 255, ctx, x + view.tabs[0], y, height, helpLine);
				y = this.renderHelpLine(view, "GRIDMAJOR", this.rgbString(theme.gridMajorColour >> 16, (theme.gridMajorColour >> 8) & 255, theme.gridMajorColour & 255), ctx, x, y, height, helpLine);
				// major grid line interval
				y = this.renderHelpLine(view, "GRIDMAJOR", theme.gridMajor, ctx, x, y, height, helpLine);
			}
		}

		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		view.helpSections[sectionNum] = [view.lineNo, "Multi"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Multi-state Themes:", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "BACKGROUND", "cell never occupied", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "ALIVE", "cell alive", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "DYING", "cell just starting dying", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "DYINGRAMP", "cell about to die", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "DEAD", "cell just died", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "DEADRAMP", "cell dead for several generations", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "Rule defines " + (view.engine.multiNumStates < 2 ? "" : String(view.engine.multiNumStates - 1) + " ") + "states from DYING to DYINGRAMP", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", view.historyStates + " (HISTORYSTATES) states from DEAD to DEADRAMP", ctx, x, y, height, helpLine);

		// draw each multi-state theme except the custom theme
		for (i = 0; i < view.engine.themes.length - 1; i += 1) {
			y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
			theme = view.engine.themes[i];
			// draw theme name with a '*' if it is the current theme
			y = this.renderHelpLine(view, "Name" + ((i === view.engine.colourTheme && view.engine.multiNumStates > 2) ? "*" : ""), theme.name, ctx, x, y, height, helpLine);
			// background colour
			this.renderColourBox(view, theme.unoccupiedGen.red, theme.unoccupiedGen.green, theme.unoccupiedGen.blue, ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "BACKGROUND", this.rgbObjectString(theme.unoccupiedGen), ctx, x, y, height, helpLine);
			// alive colour
			this.renderColourBox(view, theme.aliveGen.red, theme.aliveGen.green, theme.aliveGen.blue, ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "ALIVE", this.rgbObjectString(theme.aliveGen), ctx, x, y, height, helpLine);
			// dying colour
			this.renderColourBox(view, theme.dyingRangeGen.endColour.red, theme.dyingRangeGen.endColour.green, theme.dyingRangeGen.endColour.blue, ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "DYING", this.rgbObjectString(theme.dyingRangeGen.endColour), ctx, x, y, height, helpLine);
			// dead ramp if different than dead
			if (!(theme.dyingRangeGen.startColour.red === theme.dyingRangeGen.endColour.red && theme.dyingRangeGen.startColour.green === theme.dyingRangeGen.endColour.green && theme.dyingRangeGen.startColour.blue === theme.dyingRangeGen.endColour.blue)) {
				this.renderColourBox(view, theme.dyingRangeGen.startColour.red, theme.dyingRangeGen.startColour.green, theme.dyingRangeGen.startColour.blue, ctx, x + view.tabs[0], y, height, helpLine);
				y = this.renderHelpLine(view, "DYINGRAMP", this.rgbObjectString(theme.dyingRangeGen.startColour), ctx, x, y, height, helpLine);
			}
			// dead colour
			this.renderColourBox(view, theme.deadRangeGen.endColour.red, theme.deadRangeGen.endColour.green, theme.deadRangeGen.endColour.blue, ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, "DEAD", this.rgbObjectString(theme.deadRangeGen.endColour), ctx, x, y, height, helpLine);
			// dead ramp if different than dead
			if (!(theme.deadRangeGen.startColour.red === theme.deadRangeGen.endColour.red && theme.deadRangeGen.startColour.green === theme.deadRangeGen.endColour.green && theme.deadRangeGen.startColour.blue === theme.deadRangeGen.endColour.blue)) {
				this.renderColourBox(view, theme.deadRangeGen.startColour.red, theme.deadRangeGen.startColour.green, theme.deadRangeGen.startColour.blue, ctx, x + view.tabs[0], y, height, helpLine);
				y = this.renderHelpLine(view, "DEADRAMP", this.rgbObjectString(theme.deadRangeGen.startColour), ctx, x, y, height, helpLine);
			}
		}
	};

	// render colours topic
	Help.renderColoursTopic = function(view, ctx, x, y, height, helpLine) {
		var i = 0,

		// get the named colour list
		cmList = ColourManager.colourList,
		keys = Object.keys(cmList),
		namedCol = null,

		// section number
		sectionNum = 0;

		// set initial line
		view.lineNo = 1;

		// disable line wrap to start with
		view.wrapHelpText = false;

		// reset sections
		view.helpSections = [];
		
		// display colour names
		view.tabs[0] = 260;
		view.tabs[1] = 330;
		view.tabs[2] = 380;
		// hide the colour name from renderColourBox off the display since the name is already drawn
		view.tabs[3] = view.displayWidth;
		view.helpSections[sectionNum] = [view.lineNo, "Top"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Colours", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "The following names can be used in place of R G B", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "for example [[ COLOUR ALIVE Green ]]", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		for (i = 0; i < keys.length; i += 1) {
			namedCol = cmList[keys[i]];
			this.renderColourBox(view, namedCol[1], namedCol[2], namedCol[3], ctx, x + view.tabs[0], y, height, helpLine);
			y = this.renderHelpLine(view, namedCol[0], this.rgbString(namedCol[1], namedCol[2], namedCol[3]), ctx, x, y, height, helpLine);
		}
	};

	// render aliases topic
	Help.renderAliasesTopic = function(view, ctx, x, y, height, helpLine) {
		var i = 0,

		    // section number
		    sectionNum = 0,

			// aliases
			aliases = AliasManager.aliases,

			// alias section names
			sectionNames = AliasManager.sectionNames;

		// set initial line
		view.lineNo = 1;

		// disable line wrap to start with
		view.wrapHelpText = false;

		// reset sections
		view.helpSections = [];

		// aliases
		view.tabs[0] = 260;
		view.helpSections[sectionNum] = [view.lineNo, "Top"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Aliases", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "Alias names can be used as rule names in RLE", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "for example 'rule = HighLife'", ctx, x, y, height, helpLine);

		// display alias table
		view.wrapHelpText = true;
		for (i = 0; i < aliases.length; i += 1) {
			// check for category
			if (aliases[i][1] === "") {
				// render category
				y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
				view.helpSections[sectionNum] = [view.lineNo, sectionNames[sectionNum - 1]];
				sectionNum += 1;
				y = this.renderHelpLine(view, "", aliases[i][0] + " Aliases:", ctx, x, y, height, helpLine);
			} else {
				// check for default alias
				if (aliases[i][0] !== "") {
					// render non-default alias
					y = this.renderHelpLine(view, aliases[i][0] + (aliases[i][2] ? "*" : ""), aliases[i][1], ctx, x, y, height, helpLine);
				}
			}
		}
	};

	// render memory topic
	Help.renderMemoryTopic = function(view, ctx, x, y, height, helpLine) {
		var i = 0,

			// section number
			sectionNum = 0,

			// memory aggregation
			numViewers = Controller.numViewers(),
			allocs = 0,
			frees = 0,
			totalBytes = 0,
			totalFreedBytes = 0,

			// one of the running Viewers
			currentView = null;

		// set initial line
		view.lineNo = 1;

		// disable line wrap to start with
		view.wrapHelpText = false;

		// reset sections
		view.helpSections = [];
		
		// memory
		view.tabs[0] = 128;
		view.tabs[1] = 200;
		view.tabs[2] = 290;
		view.tabs[3] = 530;
		view.helpSections[sectionNum] = [view.lineNo, "Top"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Memory usage", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);

		// display aggregate data if more than one LifeViewer
		if (numViewers > 1) {
			view.helpSections[sectionNum] = [view.lineNo, "All"];
			sectionNum += 1;
			y = this.renderHelpLine(view, "", "Memory (all " + numViewers + " LifeViewers):", ctx, x, y, height, helpLine);
			// get allocation data for each viewer
			for (i = 0; i < numViewers; i += 1) {
				currentView = Controller.getView(i);
				if (currentView) {
					// add in Kbytes to prevent integer overflow
					allocs += currentView.engine.allocator.numAllocs;
					totalBytes += (currentView.engine.allocator.totalBytes >> 10);
					frees += currentView.engine.allocator.numFrees;
					totalFreedBytes += (currentView.engine.allocator.totalFreedBytes >> 10);
				}
			}
			// display aggregate information
			y = this.renderHelpLine(view, "Allocations", allocs + "\t" + (totalBytes >> 10) + "M", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "Frees", frees + "\t" + (totalFreedBytes >> 10) + "M", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "In Use", (allocs - frees) + "\t" + ((totalBytes >> 10) - (totalFreedBytes >> 10)) + "M", ctx, x, y, height, helpLine);
			y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
		} 

		// display current LifeViewer data
		view.helpSections[sectionNum] = [view.lineNo, "Current"];
		sectionNum += 1;
		y = this.renderHelpLine(view, "", "Memory (this LifeViewer):", ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Allocations", view.engine.allocator.numAllocs + "\t" + this.asMByte(view.engine.allocator.totalBytes) + "M\t" + view.engine.allocator.totalBytes, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "Frees", view.engine.allocator.numFrees + "\t" + this.asMByte(view.engine.allocator.totalFreedBytes) + "M\t" + view.engine.allocator.totalFreedBytes, ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, "In Use", (view.engine.allocator.numAllocs - view.engine.allocator.numFrees) + "\t" + this.asMByte(view.engine.allocator.totalBytes - view.engine.allocator.totalFreedBytes) + "M\t" + (view.engine.allocator.totalBytes - view.engine.allocator.totalFreedBytes), ctx, x, y, height, helpLine);
		y = this.renderHelpLine(view, this.pad("Bytes", 10), "Type\tElements\tName\tCount", ctx, x, y, height, helpLine);
		for (i = 0; i < view.engine.allocator.allocations.length; i += 1) {
			y = this.renderHelpLine(view, this.pad(String(view.engine.allocator.allocations[i].size), 10), view.engine.allocator.allocationInfo(i), ctx, x, y, height, helpLine);
		}
		y = this.renderHelpLine(view, "", "", ctx, x, y, height, helpLine);
	};

	// draw help text
	Help.drawHelpText = function(view) {
		var ctx = view.offContext,
		    lineHeight = 19;

		// compute the number of lines that will fit on the page
		view.numHelpPerPage = ((view.displayHeight / lineHeight) | 0) - 6;

		// dim background
		ctx.fillStyle = "black";
		ctx.globalAlpha = 0.5;
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.globalAlpha = 1;

		// draw shadow
		ctx.fillStyle = ViewConstants.helpShadowColour; 
		this.shadowX = -2;
		this.renderHelpText(view, ctx, 6, 14, lineHeight, view.displayHelp | 0);

		// draw text
		ctx.fillStyle = ViewConstants.helpFontColour;
		this.shadowX = 0;
		this.renderHelpText(view, ctx, 4, 12, lineHeight, view.displayHelp | 0);
	};

	// render error with up down greyed based on position
	Help.renderErrorLineUpDown = function(view, up, separator, down, error, ctx, x, y, height, startLine) {
		var result = y,

		    // get the width of the command
		    width = 0,

		    // only change colour if not drawing shadow
		    drawingShadow = false,

		    // get line number
		    lineNo = view.lineNo;

		// check if drawing shadow
		if (ctx.fillStyle === ViewConstants.helpShadowColour) {
			drawingShadow = true;
		}

		// check if the line on the page
		if (lineNo >= startLine && lineNo <= (startLine + view.numHelpPerPage)) {
			// output up
			ctx.font = ViewConstants.fixedFont;

			// set colour based on whether errors can scroll up
			if (!drawingShadow) {
				if ((view.displayErrors | 0) > 1) {
					ctx.fillStyle = view.errorsFontColour;
				} else {
					ctx.fillStyle = ViewConstants.greyFontColour;
				}
			}
			ctx.fillText(up, x, y);

			// draw the separator
			if (!drawingShadow) {
				ctx.fillStyle = view.errorsFontColour;
			}
			ctx.fillText(separator, x + ctx.measureText(up).width, y);

			// set colour based on whether errors can scroll down
			if (!drawingShadow) {
				if ((view.displayErrors | 0) < view.scriptErrors.length - view.numHelpPerPage + 1) {
					ctx.fillStyle = view.errorsFontColour;
				} else {
					ctx.fillStyle = ViewConstants.greyFontColour;
				}
			}
			ctx.fillText(down, x + ctx.measureText(up + separator).width, y);

			// use tab width rather than command width if specified
			if (view.tabs[0]) {
				width = view.tabs[0];
			}

			// draw error message
			if (!drawingShadow) {
				ctx.fillStyle = view.errorsFontColour;
			}
			ctx.font = ViewConstants.variableFont;
			ctx.fillText(error, x + width, y);

			// move the y coordinate to the next screen line
			result += height;
		}

		// return the next y coordinate
		return result;
	};

	// render error
	Help.renderErrorLine = function(view, command, error, ctx, x, y, height, startLine) {
		var result = y,

		    // get the width of the command
		    width = 0,

		    // line number
		    lineNo = view.lineNo;

		// check if the line on the page
		if (lineNo >= startLine && lineNo <= (startLine + view.numHelpPerPage)) {
			// draw command if supplied
			if (command.length) {
				ctx.font = ViewConstants.fixedFont;
				ctx.fillText(command, x, y);
				width = ctx.measureText(command + " ").width;
			}

			// use tab width rather than command width if specified
			if (view.tabs[0]) {
				width = view.tabs[0];
			}

			// draw error message
			ctx.font = ViewConstants.variableFont;
			ctx.fillText(error, x + width, y);

			// move the y coordinate to the next screen line
			result += height;
		}

		// increment line number
		view.lineNo += 1;

		// return the next y coordinate
		return result;
	};

	// render script errors
	Help.renderErrors = function(view, ctx, x, y, height, errorLine) {
		var i = 0,
		    scriptErrors = view.scriptErrors,
		    topY = y;

		// set initial line
		view.lineNo = 1;

		// draw the title
		view.tabs[0] = 0;
		ctx.font = ViewConstants.variableFont;
		y = this.renderErrorLine(view, "", ViewConstants.scriptErrorTitle, ctx, x, y, height, errorLine);

		// draw each error
		for (i = 0; i < scriptErrors.length; i += 1) {
			y = this.renderErrorLine(view, scriptErrors[i][0], scriptErrors[i][1], ctx, x, y, height, errorLine);
		}

		// display the footer at the bottom if not in thumbnail mode
		if (!view.thumbnail) {
			view.tabs[0] = 120;
			view.lineNo = 1;

			// draw escape to clear
			y = topY + height * (view.numHelpPerPage + 2);
			y = this.renderErrorLineUpDown(view, "Up", " / ", "Down", "scroll errors", ctx, x, y, height, 0);
			y = this.renderErrorLine(view, "Esc", "clear messages", ctx, x, y, height, 0);

			// draw h for help
			y = this.renderErrorLine(view, "H  ", "help on script commands", ctx, x, y, height, 0);
		}
	};

	// draw script errors
	Help.drawErrors = function(view) {
		var ctx = view.offContext,

		    // text line height in pixels
		    lineHeight = 19,

		    // number of footer lines
		    footerLines = 7;

		// check for thumbnail
		if (view.thumbnail) {
			footerLines = 1;
		}

		// compute the number of lines that will fit on the page
		view.numHelpPerPage = ((view.displayHeight / lineHeight) | 0) - footerLines;

		// dim background
		ctx.fillStyle = "black";
		ctx.globalAlpha = 0.5;
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.globalAlpha = 1;

		// draw shadow
		ctx.fillStyle = ViewConstants.helpShadowColour;
		this.renderErrors(view, ctx, 6, 14, lineHeight, view.displayErrors | 0);

		// draw text
		ctx.fillStyle = view.errorsFontColour;
		this.renderErrors(view, ctx, 4, 12, lineHeight, view.displayErrors | 0);
	};

	window['Help'] = Help;
}
());
