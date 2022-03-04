// LifeViewer Script Parser
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Int32 ColourManager Script ViewConstants Pattern Keywords WaypointConstants DocConfig */

	// singleton
	var ScriptParser = {
		BSnType : "",
		BSnValue : 0
	};

	// check if a string is a script command
	ScriptParser.isScriptCommand = function(tokenString) {
		var result = true;

		// check if the token is a script command
		switch (tokenString) {
			case Keywords.exclusivePlayWord:
			case Keywords.playTimeWord:
			case Keywords.ignoreExclusiveWord:
			case Keywords.noThrottleWord:
			case Keywords.reverseStartWord:
			case Keywords.textColorWord:
			case Keywords.errorColorWord:
			case Keywords.showGenStatsWord:
			case Keywords.showTimingWord:
			case Keywords.extendedTimingWord:
			case Keywords.showInfoBarWord:
			case Keywords.noSourceWord:
			case Keywords.linearWord:
			case Keywords.bezierWord:
			case Keywords.triCellsWord:
			case Keywords.hexCellsWord:
			case Keywords.squareCellsWord:
			case Keywords.bordersWord:
			case Keywords.randomizeWord:
			case Keywords.randomSeedWord:
			case Keywords.randomWidthWord:
			case Keywords.randomHeightWord:
			case Keywords.randomFillWord:
			case Keywords.randomReversibleWord:
			case Keywords.randomSwapWord:
			case Keywords.randomChanceWord:
			case Keywords.randomBWord:
			case Keywords.randomSWord:
			case Keywords.deleteRangeWord:
			case Keywords.poiWord:
			case Keywords.titleWord:
			case Keywords.polyLineWord:
			case Keywords.polyFillWord:
			case Keywords.polyAlphaWord:
			case Keywords.polySizeWord:
			case Keywords.polyTWord:
			case Keywords.polyAngleWord:
			case Keywords.polyZoomRangeWord:
			case Keywords.polyTrackWord:
			case Keywords.polyViewWord:
			case Keywords.arrowWord:
			case Keywords.arrowAlphaWord:
			case Keywords.arrowSizeWord:
			case Keywords.arrowTWord:
			case Keywords.arrowAngleWord:
			case Keywords.arrowZoomRangeWord:
			case Keywords.arrowTrackWord:
			case Keywords.arrowViewWord:
			case Keywords.labelWord:
			case Keywords.labelAlphaWord:
			case Keywords.labelSizeWord:
			case Keywords.labelTWord:
			case Keywords.labelAngleWord:
			case Keywords.labelZoomRangeWord:
			case Keywords.labelTrackWord:
			case Keywords.labelViewWord:
			case Keywords.noHistoryWord:
			case Keywords.noReportWord:
			case Keywords.noPerfWarningWord:
			case Keywords.hideGUIWord:
			case Keywords.trackWord:
			case Keywords.hardResetWord:
			case Keywords.poiResetWord:
			case Keywords.poiStopWord:
			case Keywords.poiPlayWord:
			case Keywords.poiTWord:
			case Keywords.poiTransWord:
			case Keywords.poiAddLabelsWord:
			case Keywords.initialWord:
			case Keywords.allWord:
			case Keywords.offWord:
			case Keywords.state1FitWord:
			case Keywords.trackBoxWord:
			case Keywords.trackLoopWord:
			case Keywords.graphWord:
			case Keywords.noGraphWord:
			case Keywords.graphOpacityWord:
			case Keywords.graphPointsWord:
			case Keywords.starfieldWord:
			case Keywords.maxGridSizeWord:
			case Keywords.autoFitWord:
			case Keywords.historyFitWord:
			case Keywords.historyStatesWord:
			case Keywords.aliveStatesWord:
			case Keywords.tWord:
			case Keywords.stepWord:
			case Keywords.pauseWord:
			case Keywords.gridWord:
			case Keywords.gridMajorWord:
			case Keywords.qualityWord:
			case Keywords.suppressWord:
			case Keywords.colorWord:
			case Keywords.colourWord:
			case Keywords.xWord:
			case Keywords.yWord:
			case Keywords.xOffsetWord:
			case Keywords.yOffsetWord:
			case Keywords.zoomWord:
			case Keywords.alternateZoomWord:
			case Keywords.integerZoomWord:
			case Keywords.loopWord:
			case Keywords.viewOnlyWord:
			case Keywords.tiltWord:
			case Keywords.noGUIWord:
			case Keywords.noCopyWord:
			case Keywords.thumbnailWord:
			case Keywords.thumbSizeWord:
			case Keywords.thumbLaunchWord:
			case Keywords.thumbStartWord:
			case Keywords.thumbZoomWord:
			case Keywords.autoStartWord:
			case Keywords.startFromWord:
			case Keywords.scriptStartWord:
			case Keywords.scriptEndWord:
			case Keywords.angleWord:
			case Keywords.themeWord:
			case Keywords.gpsWord:
			case Keywords.stopWord:
			case Keywords.layersWord:
			case Keywords.depthWord:
			case Keywords.widthWord:
			case Keywords.heightWord:
			case Keywords.popupWidthWord:
			case Keywords.popupHeightWord:
			case Keywords.killGlidersWord:
			case Keywords.recipeWord:
			case Keywords.rleWord:
			case Keywords.pasteWord:
			case Keywords.everyWord:
			case Keywords.pasteTWord:
			case Keywords.pasteDeltaWord:
			case Keywords.pasteModeWord:
			case Keywords.pasteModeZeroWord:
			case Keywords.pasteModeAndWord:
			case Keywords.pasteMode0010Word:
			case Keywords.pasteModeXWord:
			case Keywords.pasteMode0100Word:
			case Keywords.pasteModeYWord:
			case Keywords.pasteModeXorWord:
			case Keywords.pasteModeOrWord:
			case Keywords.pasteModeNOrWord:
			case Keywords.pasteModeXNOrWord:
			case Keywords.pasteModeNotYWord:
			case Keywords.pasteMode1011Word:
			case Keywords.pasteModeNotXWord:
			case Keywords.pasteMode1101Word:
			case Keywords.pasteModeNAndWord:
			case Keywords.pasteModeOneWord:
			case Keywords.pasteModeCopyWord:
				result = true;
				break;
			default:
				result = false;
		}

		return result;
	};

	// check next script token
	ScriptParser.nonNumericTokenError = function(scriptReader, scriptErrors, nextToken, itemDescription, itemType) {
		// check next token
		var peekToken = scriptReader.peekAtNextToken();

		// check if it is blank or a valid script command
		if (peekToken === "" || this.isScriptCommand(peekToken)) {
			// argument missing
			scriptErrors[scriptErrors.length] = [nextToken, itemDescription + " missing"];
		} else {
			// argument invalid
			scriptErrors[scriptErrors.length] = [nextToken + " " + peekToken, itemDescription + " must be " + itemType];
			// eat the invalid token
			peekToken = scriptReader.getNextToken();
		}
	};

	// read a custom theme element
	ScriptParser.readCustomThemeElement = function(view, scriptReader, scriptErrors, customThemeElement, whichColour) {
		var badColour = true,
		    redValue = 0,
		    greenValue = 0,
		    blueValue = 0,
		    peekToken = null,
		    colourTriple = null,

		    // get the element name
		    elementName = scriptReader.getNextToken();

		// read the red value
		if (scriptReader.nextTokenIsNumeric()) {
			// get the red
			redValue = scriptReader.getNextTokenAsNumber() | 0;

			// check it is in range
			if (redValue < 0 || redValue > 255) {
				scriptErrors[scriptErrors.length] = [whichColour + " " + elementName + " " + redValue, "RED out of range"];
			}

			// read the green value
			if (scriptReader.nextTokenIsNumeric()) {
				// get the green
				greenValue = scriptReader.getNextTokenAsNumber();

				// check it is in range
				if (greenValue < 0 || greenValue > 255) {
					scriptErrors[scriptErrors.length] = [whichColour + " " + elementName + " " + redValue + " " + greenValue, "GREEN out of range"];
				}

				// read the blue value
				if (scriptReader.nextTokenIsNumeric()) {
					// get the blue
					blueValue = scriptReader.getNextTokenAsNumber();
					// check it is in range
					if (blueValue < 0 || blueValue > 255) {
						scriptErrors[scriptErrors.length] = [whichColour + " " + elementName + " " + redValue + " " + greenValue + " " + blueValue, "BLUE out of range"];
					} else {
						// colour is valid
						badColour = false;
					}
				}
				else{
					// illegal or missing blue component
					this.nonNumericTokenError(scriptReader, scriptErrors, whichColour + " " + elementName + " " + redValue + " " + greenValue, "BLUE", "numeric");
				}
			} else {
				// illegal or missing green component
				this.nonNumericTokenError(scriptReader, scriptErrors, whichColour + " " + elementName + " " + redValue, "GREEN", "numeric");
			}
		} else {
			// check for colour name
			peekToken = scriptReader.peekAtNextToken();

			// check if it is blank or a valid script command
			colourTriple = ColourManager.colourList[peekToken.toLowerCase()];
			if (colourTriple !== undefined) {
				// consume the token
				peekToken = scriptReader.getNextToken();

				// get the rgb value
				redValue = colourTriple[1];
				greenValue = colourTriple[2];
				blueValue = colourTriple[3];

				// mark good colour
				badColour = false;
			} else {
				// illegal colour name
				if (peekToken === "" || this.isScriptCommand(peekToken)) {
					// argument missing
					scriptErrors[scriptErrors.length] = [whichColour + " " + elementName, "name missing"];
				} else {
					// argument invalid
					scriptErrors[scriptErrors.length] = [whichColour + " " + elementName + " " + peekToken, "name not known"];

					// consume the token
					peekToken = scriptReader.getNextToken();
				}
			}
		}

		// save the colour if it is valid
		if (!badColour) {
			// see if the slot is available
			if ((view.customThemeValue[customThemeElement] !== -1) && (customThemeElement !== ViewConstants.customThemeLabel) && (customThemeElement !== ViewConstants.customThemeArrow) && (customThemeElement !== ViewConstants.customThemePoly)) {
				scriptErrors[scriptErrors.length] = [whichColour + " " + elementName + " " + redValue + " " + greenValue + " " + blueValue, "overwrites " + (view.customThemeValue[customThemeElement] >> 16) + " " + ((view.customThemeValue[customThemeElement] >> 8) & 255) + " " + (view.customThemeValue[customThemeElement] & 255)];
			}

			// save the custom colour
			view.customThemeValue[customThemeElement] = (redValue << 16) | (greenValue << 8) | blueValue;

			// process the colour
			switch (customThemeElement) {
			case ViewConstants.customThemeGrid:
				// copy to grid colour
				view.customGridColour = view.customThemeValue[customThemeElement];
				view.customTheme = true;
				break;

			case ViewConstants.customThemeGridMajor:
				// copy to grid major colour
				view.customGridMajorColour = view.customThemeValue[customThemeElement];
				view.customTheme = true;
				break;

			case ViewConstants.customThemeStars:
				// copy to stars colour
				view.starField.red = redValue;
				view.starField.green = greenValue;
				view.starField.blue = blueValue;
				break;

			case ViewConstants.customThemeText:
				// save for display in help
				view.customTextColour = [redValue, greenValue, blueValue];
				break;

			case ViewConstants.customThemeError:
				// save for error display
				view.customErrorColour = [redValue, greenValue, blueValue];
				view.errorsFontColour = "rgb(" + redValue + "," + greenValue + "," + blueValue + ")";
				break;

			case ViewConstants.customThemeLabel:
				// save for label
				view.customLabelColour = "rgb(" + redValue + "," + greenValue + "," + blueValue + ")";
				break;

			case ViewConstants.customThemeArrow:
				// save for arrow
				view.customArrowColour = "rgb(" + redValue + "," + greenValue + "," + blueValue + ")";
				break;

			case ViewConstants.customThemePoly:
				// save for polygon
				view.customPolygonColour = "rgb(" + redValue + "," + greenValue + "," + blueValue + ")";
				break;

			case ViewConstants.customThemeBoundary:
				// copy to custom boundary colour for help display
				view.customBoundaryColour = [redValue, greenValue, blueValue];

				// copy to boundary colour
				if (view.engine.littleEndian) {
					view.engine.boundaryColour = 255 << 24 | blueValue << 16 | greenValue << 8 | redValue;
				} else {
					view.engine.boundaryColour = redValue << 24 | greenValue << 16 | blueValue << 8 | 255;
				}
				break;

			case ViewConstants.customThemeBounded:
				// copy to custom bounded colour for help display
				view.customBoundedColour = [redValue, greenValue, blueValue];

				// copy to bounded colour
				if (view.engine.littleEndian) {
					view.engine.boundedColour = 255 << 24 | blueValue << 16 | greenValue << 8 | redValue;
				} else {
					view.engine.boundedColour = redValue << 24 | greenValue << 16 | blueValue << 8 | 255;
				}
				break;

			case ViewConstants.customThemeSelect:
				// create custom select colour
				view.customSelectColour = [redValue, greenValue, blueValue];
				view.engine.selectColour = "rgb(" + redValue + "," + greenValue + "," + blueValue + ")";
				break;

			case ViewConstants.customThemePaste:
				// create custom paste colour
				view.customPasteColour = [redValue, greenValue, blueValue];
				view.engine.pasteColour = "rgb(" + redValue + "," + greenValue + "," + blueValue + ")";
				break;

			case ViewConstants.customThemeAdvance:
				// create custom advance colour
				view.customAdvanceColour = [redValue, greenValue, blueValue];
				view.engine.advanceColour = "rgb(" + redValue + "," + greenValue + "," + blueValue + ")";
				break;

			case ViewConstants.customThemeGraphBg:
				// copy to graph background color
				view.engine.graphBgColor = [redValue, greenValue, blueValue];
				break;

			case ViewConstants.customThemeGraphAxis:
				// copy to graph axis color
				view.engine.graphAxisColor = [redValue, greenValue, blueValue];
				break;

			case ViewConstants.customThemeGraphAlive:
				// copy to graph alive color
				view.engine.graphAliveColor = [redValue, greenValue, blueValue];
				break;

			case ViewConstants.customThemeGraphBirth:
				// copy to graph birth color
				view.engine.graphBirthColor = [redValue, greenValue, blueValue];
				break;

			case ViewConstants.customThemeGraphDeath:
				// copy to graph death color
				view.engine.graphDeathColor = [redValue, greenValue, blueValue];
				break;

			// UI customisation doesn't force custom Theme
			case ViewConstants.customThemeUIFG:
			case ViewConstants.customThemeUIBG:
			case ViewConstants.customThemeUIHighlight:
			case ViewConstants.customThemeUISelect:
			case ViewConstants.customThemeUILocked:
			case ViewConstants.customThemeUIBorder:
				break;

			default:
				// mark custom theme set
				view.customTheme = true;
			}
		}
	};

	// setup custom theme
	ScriptParser.setupCustomTheme = function(view) {
		var colourValue = 0,
			customTheme = view.engine.themes[view.engine.numThemes],
			themeValue = view.customThemeValue;

		// set grid major if defined
		customTheme.gridMajor = view.engine.gridLineMajor;

		// check if alive is defined
		if (themeValue[ViewConstants.customThemeAlive] === -1) {
			// alive missing so check if dead is defined
			colourValue = themeValue[ViewConstants.customThemeDead];
			if (colourValue !== -1) {
				// set alive to the inverse of dead
				themeValue[ViewConstants.customThemeAlive] = 0xffffff - colourValue;
			} else {
				// check if background is defined
				colourValue = themeValue[ViewConstants.customThemeBackground];
				if (colourValue !== -1) {
					// set alive to the inverse of background
					themeValue[ViewConstants.customThemeAlive] = 0xffffff - colourValue;
				} else {
					// set alive to white
					themeValue[ViewConstants.customThemeAlive] = 0xffffff;
				}
			}
		}

		// check if one of background or dead are defined
		if (themeValue[ViewConstants.customThemeBackground] === -1 && themeValue[ViewConstants.customThemeDead] === -1) {
			// both missing so set background to the inverse of alive
			themeValue[ViewConstants.customThemeBackground] = 0xffffff - themeValue[ViewConstants.customThemeAlive];
		}

		// 2-state patterns

		// check if the background was supplied
		colourValue = themeValue[ViewConstants.customThemeBackground];
		if (colourValue === -1) {
			// use the dead colour
			colourValue = themeValue[ViewConstants.customThemeDead];
		}

		// set the background colour
		customTheme.unoccupied.red = colourValue >> 16;
		customTheme.unoccupied.green = (colourValue >> 8) & 255;
		customTheme.unoccupied.blue = colourValue & 255;

		// set the alive colour
		colourValue = themeValue[ViewConstants.customThemeAlive];
		customTheme.aliveRange.startColour.red = colourValue >> 16;
		customTheme.aliveRange.startColour.green = (colourValue >> 8) & 255;
		customTheme.aliveRange.startColour.blue = colourValue & 255;

		// check if the aliveramp is specified
		colourValue = themeValue[ViewConstants.customThemeAliveRamp];
		if (colourValue === -1) {
			// use the alive colour
			colourValue = themeValue[ViewConstants.customThemeAlive];
		}

		// set the aliveramp colour
		customTheme.aliveRange.endColour.red = colourValue >> 16;
		customTheme.aliveRange.endColour.green = (colourValue >> 8) & 255;
		customTheme.aliveRange.endColour.blue = colourValue & 255;

		// check if the dead colour was supplied
		colourValue = themeValue[ViewConstants.customThemeDead];
		if (colourValue === -1) {
			// use the background colour
			colourValue = themeValue[ViewConstants.customThemeBackground];
		}

		// set the dead colour
		customTheme.deadRange.endColour.red = colourValue >> 16;
		customTheme.deadRange.endColour.green = (colourValue >> 8) & 255;
		customTheme.deadRange.endColour.blue = colourValue & 255;

		// check if the deadramp is specified
		colourValue = themeValue[ViewConstants.customThemeDeadRamp];
		if (colourValue === -1) {
			// use the dead colour if specified or the background otherwise
			colourValue = themeValue[ViewConstants.customThemeDead];
			if (colourValue === -1) {
				colourValue = themeValue[ViewConstants.customThemeBackground];
			}
		}

		// set the deadramp colour
		customTheme.deadRange.startColour.red = colourValue >> 16;
		customTheme.deadRange.startColour.green = (colourValue >> 8) & 255;
		customTheme.deadRange.startColour.blue = colourValue & 255;

		// multi-state patterns

		// check if the background was supplied
		colourValue = themeValue[ViewConstants.customThemeBackground];
		if (colourValue === -1) {
			// use the dead colour
			colourValue = themeValue[ViewConstants.customThemeDead];
		}

		// set the background colour
		customTheme.unoccupiedGen.red = colourValue >> 16;
		customTheme.unoccupiedGen.green = (colourValue >> 8) & 255;
		customTheme.unoccupiedGen.blue = colourValue & 255;

		// set the alive colour
		colourValue = themeValue[ViewConstants.customThemeAlive];
		customTheme.aliveGen.red = colourValue >> 16;
		customTheme.aliveGen.green = (colourValue >> 8) & 255;
		customTheme.aliveGen.blue = colourValue & 255;

		// check if the dead colour was supplied
		colourValue = themeValue[ViewConstants.customThemeDead];
		if (colourValue === -1) {
			// use the background colour
			colourValue = themeValue[ViewConstants.customThemeBackground];
		}

		// set the dead colour
		customTheme.deadRangeGen.endColour.red = colourValue >> 16;
		customTheme.deadRangeGen.endColour.green = (colourValue >> 8) & 255;
		customTheme.deadRangeGen.endColour.blue = colourValue & 255;

		// check if the deadramp is specified
		colourValue = themeValue[ViewConstants.customThemeDeadRamp];
		if (colourValue === -1) {
			// use the dead colour if specified or the background otherwise
			colourValue = themeValue[ViewConstants.customThemeDead];
			if (colourValue === -1) {
				colourValue = themeValue[ViewConstants.customThemeBackground];
			}
		}

		// set the deadramp colour
		customTheme.deadRangeGen.startColour.red = colourValue >> 16;
		customTheme.deadRangeGen.startColour.green = (colourValue >> 8) & 255;
		customTheme.deadRangeGen.startColour.blue = colourValue & 255;

		// check if the dying colour was supplied
		colourValue = themeValue[ViewConstants.customThemeDying];
		if (colourValue === -1) {
			// flag it as dynamic
			customTheme.dyingRangeDynamic = true;
		} else {
			// set the dying colour
			customTheme.dyingRangeDynamic = false;
			customTheme.dyingRangeGen.endColour.red = colourValue >> 16;
			customTheme.dyingRangeGen.endColour.green = (colourValue >> 8) & 255;
			customTheme.dyingRangeGen.endColour.blue = colourValue & 255;
		}

		// check if the dyingramp is specified
		colourValue = themeValue[ViewConstants.customThemeDyingRamp];
		if (colourValue === -1) {
			// use the dying colour if specified or the background otherwise
			colourValue = themeValue[ViewConstants.customThemeDying];
			if (colourValue === -1) {
				colourValue = themeValue[ViewConstants.customThemeBackground];
			}
		}

		// set the dyingramp colour
		customTheme.dyingRangeGen.startColour.red = colourValue >> 16;
		customTheme.dyingRangeGen.startColour.green = (colourValue >> 8) & 255;
		customTheme.dyingRangeGen.startColour.blue = colourValue & 255;

		// set the grid lines colours
		customTheme.setGridLineColours(themeValue[ViewConstants.customThemeGrid], themeValue[ViewConstants.customThemeGridMajor]);
	};

	// shorten message to fit
	ScriptParser.shortenMessage = function(message, maxLength) {
		var result = message;

		// check if the message is longer than the maximum allowed
		if (message.length > maxLength) {
			// get the first section of the message
			result = message.substr(0, maxLength - 1) + "...";
		}

		// return the message
		return result;
	};

	// validate waypoint message string
	ScriptParser.validateString = function(message, scriptErrors, readingTitle, readingLabel) {
		// check for newline
		var index = message.indexOf("\\n");

		if (index !== -1) {
			// check whether this is the window title
			if (readingTitle) {
				// display error since only one line allowed
				scriptErrors[scriptErrors.length] = [Keywords.titleWord + " " + Keywords.stringDelimiter + this.shortenMessage(message, 23) + Keywords.stringDelimiter, "only one line allowed"];
			} else {
				// check for second newline and reading label
				index = message.substr(index + 2).indexOf("\\n");
				if (index !== -1 && !readingLabel) {
					// display error
					scriptErrors[scriptErrors.length] = [Keywords.stringDelimiter + this.shortenMessage(message, 23), "only two lines allowed"];
				}
			}
		}
	};

	// raise theme overwrite error
	ScriptParser.raiseThemeError = function(view, scriptErrors, newTheme, currentTheme) {
		var errorSource = Keywords.themeWord + " ",
		    errorReason = "overwrites ";

		// create the error source
		if (newTheme >= view.engine.numThemes) {
			errorSource += Keywords.themeCustomWord;
		} else {
			errorSource += newTheme;
		}

		// create the error reason
		if (currentTheme >= view.engine.numThemes) {
			errorReason += Keywords.themeCustomWord;
		} else {
			errorReason += currentTheme;
		}

		// raise the error
		scriptErrors[scriptErrors.length] = [errorSource, errorReason];
	};

	// decode rgb script value
	ScriptParser.decodeRGB = function(view, scriptReader, scriptErrors, colNum, nextToken, badColour, colName) {
		var redValue = 0,
		    greenValue = 0,
		    blueValue = 0,
		    peekToken = null,
		    colourTriple = null;

		// read the red value
		if (scriptReader.nextTokenIsNumeric()) {
			// get the red
			redValue = scriptReader.getNextTokenAsNumber() | 0;

			// check it is in range
			if (redValue < 0 || redValue > 255) {
				scriptErrors[scriptErrors.length] = [nextToken + " " + colName + " " + redValue, "RED out of range"];
				badColour = true;
			} else {
				// read the green value
				if (scriptReader.nextTokenIsNumeric()) {
					// get the green
					greenValue = scriptReader.getNextTokenAsNumber() | 0;

					// check it is in range
					if (greenValue < 0 || greenValue > 255) {
						scriptErrors[scriptErrors.length] = [nextToken + " " + colName + " " + redValue + " " + greenValue, "GREEN out of range"];
						badColour = true;
					} else {
						// read the blue value
						if (scriptReader.nextTokenIsNumeric()) {
							// get the blue
							blueValue = scriptReader.getNextTokenAsNumber() | 0;
							// check it is in range
							if (blueValue < 0 || blueValue > 255) {
								scriptErrors[scriptErrors.length] = [nextToken + " " + colName + " " + redValue + " " + greenValue + " " + blueValue, "BLUE out of range"];
								badColour = true;
							}
						}
						else{
							// illegal or missing blue component
							this.nonNumericTokenError(scriptReader, scriptErrors, nextToken + " " + colName + " " + redValue + " " + greenValue, "BLUE", "numeric");
							badColour = true;
						}
					}
				} else {
					// illegal or missing green component
					this.nonNumericTokenError(scriptReader, scriptErrors, nextToken + " " + colName + " " + redValue, "GREEN", "numeric");
					badColour = true;
				}
			}
		} else {
			// check for colour name
			peekToken = scriptReader.peekAtNextToken();

			// check if it is blank or a valid script command
			colourTriple = ColourManager.colourList[peekToken.toLowerCase()];
			if (colourTriple !== undefined) {
				// consume the token
				peekToken = scriptReader.getNextToken();

				// get the rgb value
				redValue = colourTriple[1];
				greenValue = colourTriple[2];
				blueValue = colourTriple[3];
			} else {
				badColour = true;

				// illegal colour name
				if (peekToken === "" || this.isScriptCommand(peekToken)) {
					// argument missing
					scriptErrors[scriptErrors.length] = [nextToken + " " + colName, "name missing"];
				} else {
					// argument invalid
					scriptErrors[scriptErrors.length] = [nextToken + " " + colName + " " + peekToken, "name not known"];

					// consume the token
					peekToken = scriptReader.getNextToken();
				}
			}
		}

		// save the colour if it is valid
		if (!badColour) {
			// see if the slot is available
			if (view.customColours[colNum] !== -1) {
				scriptErrors[scriptErrors.length] = [nextToken + " " + colName + " " + redValue + " " + greenValue + " " + blueValue, "overwrites " + (view.customColours[colNum] >> 16) + " " + ((view.customColours[colNum] >> 8) & 255) + " " + (view.customColours[colNum] & 255)];
			}
			// save the custom colour
			view.customColours[colNum] = redValue << 16 | greenValue << 8 | blueValue;
		}
	};

	// output a time interval as a string
	ScriptParser.timeInterval = function(view, value) {
		var result = Keywords.variablePrefixSymbol + String(value),
			interval = view.menuManager.getTimeInterval(value);

		// check if there was an interval
		if (interval !== -1) {
			// format result
			result = interval.toFixed(1);
		}

		return result;
	};

	// substitute variables in string
	ScriptParser.substituteVariables = function(view, string) {
		var result = "",
		    varIndex = string.indexOf(Keywords.variablePrefixSymbol),
		    type = "";

		// check if there are variables in the string
		if (varIndex === -1) {
			// no variables so just return the input
			result = string;
		} else {
			// substitute each variable
			while (varIndex !== -1) {
				// add the portion before the variable to the result
				result += string.substr(0, varIndex);

				// get the variable type
				if (varIndex + 1 < string.length) {
					type = string[varIndex + 1];
				
					// remove the variable definition
					string = string.substr(varIndex + 2);

					// determine the variable type
					switch(type) {
						case "B":
							// add the build number
							result += ViewConstants.versionBuild;
							break;

						case "N":
							// add the name
							result += view.patternName;
							break;

						case "R":
							// add the rule
							result += view.patternRuleName;
							break;

						case "A":
							// add the alias
							if (view.patternAliasName === "") {
								result += view.patternRuleName;
							} else {
								result += view.patternAliasName;
							}
							break;

						case "O":
							// add the originator
							result += view.patternOriginator;
							break;

						case "T":
							// add the program name
							result += ViewConstants.externalViewerTitle;
							break;

						case "0":
							// add the interval time
							result += this.timeInterval(view, 0);
							break;

						case "1":
							// add the interval time
							result += this.timeInterval(view, 1);
							break;

						case "2":
							// add the interval time
							result += this.timeInterval(view, 2);
							break;

						case "3":
							// add the interval time
							result += this.timeInterval(view, 3);
							break;

						case "4":
							// add the interval time
							result += this.timeInterval(view, 4);
							break;

						case "5":
							// add the interval time
							result += this.timeInterval(view, 5);
							break;

						case "6":
							// add the interval time
							result += this.timeInterval(view, 6);
							break;

						case "7":
							// add the interval time
							result += this.timeInterval(view, 7);
							break;

						case "8":
							// add the interval time
							result += this.timeInterval(view, 8);
							break;

						case "9":
							// add the interval time
							result += this.timeInterval(view, 9);
							break;

						case Keywords.variablePrefixSymbol:
							// add the hash
							result += Keywords.variablePrefixSymbol;
							break;

						default:
							// unknown so add as literal
							result += Keywords.variablePrefixSymbol + type;
							break;
					}

					// find the next variable
					varIndex = string.indexOf(Keywords.variablePrefixSymbol);
				} else {
					string = string.substr(varIndex + 1);
					varIndex = -1;
				}
			}

			// add remaining string if any
			result += string;
		}

		return result;
	};

	// output error message if camera mode already defined
	ScriptParser.modeDefined = function(isLinear, command, argument, scriptErrors) {
		// check if linear
		if (isLinear) {
			// check if linear command
			if (command === Keywords.linearWord) {
				scriptErrors[scriptErrors.length] = [command + " " + argument, "already defined"];
			} else {
				scriptErrors[scriptErrors.length] = [command + " " + argument, "overwrites " + Keywords.linearWord];
			}
		} else {
			// check if linear command
			if (command === Keywords.linearWord) {
				scriptErrors[scriptErrors.length] = [command + " " + argument, "overwrites " + Keywords.bezierWord];
			} else {
				scriptErrors[scriptErrors.length] = [command + " " + argument, "already defined"];
			}
		}
	};

	// display number to maximum of n places
	ScriptParser.toPlaces = function(number, places) {
		var result = "";

		if (number === (number | 0)) {
			result = String(number);
		} else {
			result = number.toFixed(places);
		}

		return result;
	};

	// check BNs in valid
	ScriptParser.validBSn = function(token) {
		var firstChar = token.substr(0, 1),
			remainder = token.substr(1),
			result = false,
			i = 0;

		if (firstChar === "B" || firstChar === "S") {
			this.BSnType = firstChar;
			i = 0;
			result = true;
			while (result && (i < remainder.length)) {
				if (remainder[i] >= "0" && remainder[i] <= "9") {
					i += 1;
				} else {
					result = false;
				}
			}
			if (result) {
				this.BSnValue = Number(remainder);
			}
		}

		return result;
	};

	// save BSn entry
	ScriptParser.saveBSn = function(view, value) {
		var i = 0;

		if (this.BSnType === "B") {
			i = view.randomChanceBN.length;
			view.randomChanceBN[i] = this.BSnValue;
			view.randomChanceBN[i + 1] = value;
		} else {
			i = view.randomChanceSN.length;
			view.randomChanceSN[i] = this.BSnValue;
			view.randomChanceSN[i + 1] = value;
		}
	};

	// parse script commands
	ScriptParser.parseScript = function(view, scriptString, numStates) {
		// create a script from the string
		var scriptReader = new Script(scriptString, false),

			// reading tokens
			readingTokens = false,

		    // reading title
		    readingTitle = false,

		    // next token
		    nextToken = "",

		    // lookahead token
			peekToken = "",
			
			// string value
			stringToken = "",

			// transformation value
			transToken = "",

		    // whether reading string
		    readingString = false,

		    // string value
		    stringValue = "",
		    
		    // number value
			numberValue = 0,

		    // item valid flag
		    itemValid = false,

		    // argument numeric flag
		    isNumeric = false,

		    // script error list
		    scriptErrors = view.scriptErrors,

		    // error message
		    notPossibleError = null,

		    // number of custom colours provided
		    numCustomColours = 0,

		    // custom colour information
		    colNum = 0,

		    // which colour keyword used (for error reporting)
		    whichColour = "",

			// whether to add Labels as POIs
			addLabelsAsPOIs = false,

		    // current waypoint
		    currentWaypoint = view.waypointManager.createWaypoint(),
		    tempWaypoint = null,

		    // whether waypoints found
		    waypointsFound = false,

		    // whether points of interest found
		    poiFound = false,

			// current polygon
			currentPolygon = null,

			// current polygon alpha
			currentPolygonAlpha = 1,

			// current polygon size
			currentPolygonSize = ViewConstants.annotationLineThickness,

			// current polygon T1 and T2
			currentPolygonT1 = -1,
			currentPolygonT2 = -1,

			// current polygon TFade
			currentPolygonTFade = 0,

			// current polygon angle and locked
			currentPolygonAngle = 0,
			currentPolygonAngleFixed = false,

			// current position locked
			currentPolygonPositionFixed = false,

			// current polygon visibility distance
			currentPolygonVDistance = -1,

			// current polygon zoom range
			currentPolygonMinZ = -1000,
			currentPolygonMaxZ = -1000,

			// current label
			// current polygon movement vector
			currentPolygonDX = 0,
			currentPolygonDY = 0,

			// current arrow
			currentArrow = null,

			// current arrow alpha
			currentArrowAlpha = 1,

			// current arrow size
			currentArrowSize = ViewConstants.annotationLineThickness,

			// current arrow head percentage
			currentArrowHeadMultiple = ViewConstants.arrowHeadMultiple,

			// current arrow T1 and T2
			currentArrowT1 = -1,
			currentArrowT2 = -1,

			// current arrow TFade
			currentArrowTFade = 0,

			// current arrow angle and locked
			currentArrowAngle = 0,
			currentArrowAngleFixed = false,

			// current position locked
			currentArrowPositionFixed = false,

			// current arrow visibility distance
			currentArrowVDistance = -1,

			// current arrow movement vector
			currentArrowDX = 0,
			currentArrowDY = 0,

			// current arrow zoom range
			currentArrowMinZ = -1000,
			currentArrowMaxZ = -1000,

			// current label
			currentLabel = null,

			// current label alpha
			currentLabelAlpha = 1,

			// current label size and locked
			currentLabelSize = ViewConstants.labelFontSize,
			currentLabelSizeFixed = false,

			// current label T1 and T2
			currentLabelT1 = -1,
			currentLabelT2 = -1,

			// current label TFade
			currentLabelTFade = 0,

			// current label angle and locked
			currentLabelAngle = 0,
			currentLabelAngleFixed = false,

			// current position locked
			currentLabelPositionFixed = false,

			// current label visibility distance
			currentLabelVDistance = -1,

			// current label movement vector
			currentLabelDX = 0,
			currentLabelDY = 0,

			// current label zoom range
			currentLabelMinZ = -1000,
			currentLabelMaxZ = -1000,

			// whether reading label
			readingLabel = false,

		    // whether colour valid
		    badColour = false,

		    // type of argument
		    type = "numeric",

		    // track command parameters
		    trackPeriod = -1,
		    trackX = -1,
		    trackY = -1,
		    newPeriod = -1,
		    newX = -1,
		    newY = -1,

		    // track box command parameters
		    trackBoxN = 0,
		    trackBoxS = 0,
		    trackBoxE = 0,
		    trackBoxW = 0,

			// holders
			x = 0, y = 0, z = 0,
			x2 = 0, y2 = 0,
			coords = [],

		    // loop counter
		    i = 0,

			// dummy pattern for RLE decoding
			pattern = new Pattern("decode", view.manager),

		    // suppress errors flags
		    suppressErrors = {
			x : false,
			y : false,
			zoom : false,
			angle : false,
			tilt : false,
			layers : false,
			depth : false,
			theme : false,
			gps : false,
			step : false,
			loop : false,
			stop : false,
			width : false,
			height : false,
			popupWidth: false,
			popupHeight : false
		    };

		// reset waypoint manager camera flag
		view.waypointManager.hasCamera = false;

		// reset counts
		view.numScriptCommands = 0;
		view.numScriptErrors = 0;

		// reset custom theme
		view.customGridMajor = false;
		view.customTheme = false;
		view.customThemeValue[ViewConstants.customThemeBackground] = -1;
		view.customThemeValue[ViewConstants.customThemeAlive] = -1;
		view.customThemeValue[ViewConstants.customThemeAliveRamp] = -1;
		view.customThemeValue[ViewConstants.customThemeDead] = -1;
		view.customThemeValue[ViewConstants.customThemeDeadRamp] = -1;
		view.customThemeValue[ViewConstants.customThemeGrid] = -1;
		view.customThemeValue[ViewConstants.customThemeGridMajor] = -1;
		view.customThemeValue[ViewConstants.customThemeStars] = -1;
		view.customThemeValue[ViewConstants.customThemeText] = -1;
		view.customThemeValue[ViewConstants.customThemeBoundary] = -1;
		view.customThemeValue[ViewConstants.customThemeGraphBg] = -1;
		view.customThemeValue[ViewConstants.customThemeGraphAxis] = -1;
		view.customThemeValue[ViewConstants.customThemeGraphAlive] = -1;
		view.customThemeValue[ViewConstants.customThemeGraphBirth] = -1;
		view.customThemeValue[ViewConstants.customThemeGraphDeath] = -1;
		view.customThemeValue[ViewConstants.customThemeError] = -1;
		view.customThemeValue[ViewConstants.customThemeLabel] = -1;
		view.customThemeValue[ViewConstants.customThemeUIFG] = -1;
		view.customThemeValue[ViewConstants.customThemeUIBG] = -1;
		view.customThemeValue[ViewConstants.customThemeUIHighlight] = -1;
		view.customThemeValue[ViewConstants.customThemeUISelect] = -1;
		view.customThemeValue[ViewConstants.customThemeUILocked] = -1;
		view.customThemeValue[ViewConstants.customThemeUIBorder] = -1;
		view.customThemeValue[ViewConstants.customThemeArrow] = -1;
		view.customThemeValue[ViewConstants.customThemePoly] = -1;

		// clear custom colours
		view.customColours = null;

		// look for a start script token
		if (scriptReader.findToken(Keywords.scriptStartWord, -1) !== -1) {
			// reset custom colours
			view.customColours = view.engine.allocator.allocate(Int32, 256, "View.customColours");
			view.customColours.fill(-1);

			nextToken = scriptReader.getNextToken();
			while (nextToken !== "") {
				// set the default type
				type = "numeric";

				// check if reading string
				if (readingString) {
					// check if string finished
					if (nextToken[nextToken.length - 1] === Keywords.stringDelimiter) {
						// finalise string
						stringValue = stringValue + " " + nextToken.substr(0, nextToken.length - 1);
						readingString = false;

						// validate string
						this.validateString(stringValue, scriptErrors, readingTitle, readingLabel);

						// check whether it is a waypoint message or window title
						if (readingTitle) {
							// check if the title already set
							if (view.windowTitle !== "") {
								scriptErrors[scriptErrors.length] = [Keywords.titleWord + " " + Keywords.stringDelimiter + this.shortenMessage(stringValue, 20) + Keywords.stringDelimiter, "overwrites " + Keywords.stringDelimiter + view.windowTitle + Keywords.stringDelimiter];
							}

							// set window title
							view.windowTitle = stringValue;

							// flag not reading title
							readingTitle = false;
						} else {
							if (readingLabel) {
								// set label message
								currentLabel.message = this.substituteVariables(view, stringValue);
								readingLabel = false;
								view.waypointManager.addLabel(currentLabel);
							} else {
								// set text message
								currentWaypoint.textMessage = this.substituteVariables(view, stringValue);
								currentWaypoint.textDefined = true;
							}
						}
					} else {
						// add to current string
						stringValue = stringValue + " " + nextToken;
					}
				} else {
					// check for new string
					if (nextToken[0] === Keywords.stringDelimiter) {
						// create the new string
						stringValue = nextToken.substr(1);
						readingString = true;
						
						// check if string finished
						if (nextToken[nextToken.length - 1] === Keywords.stringDelimiter) {
							readingString = false;

							// remove the trailing delimiter
							stringValue = stringValue.substr(0, stringValue.length - 1);

							// validate string
							this.validateString(stringValue, scriptErrors, readingTitle, readingLabel);

							// check whether it is a waypoint message or window title
							if (readingTitle) {
								// check if the title is already set
								if (view.windowTitle !== "") {
									scriptErrors[scriptErrors.length] = [Keywords.titleWord + " " + Keywords.stringDelimiter + this.shortenMessage(stringValue, 20) + Keywords.stringDelimiter, "overwrites " + Keywords.stringDelimiter + view.windowTitle + Keywords.stringDelimiter];
								}

								// set window title
								view.windowTitle = stringValue;

								// flag not reading title
								readingTitle = false;
							} else {
								if (readingLabel) {
									// set label message
									currentLabel.message = this.substituteVariables(view, stringValue);
									readingLabel = false;
									view.waypointManager.addLabel(currentLabel);
								} else {
									// set the text message
									currentWaypoint.textMessage = this.substituteVariables(view, stringValue);
									currentWaypoint.textDefined = true;
								}
							}
						}
					} else {
						// read command
						// flag the item is invalid
						isNumeric = false;
						itemValid = false;

						// increment number of commands
						view.numScriptCommands += 1;

						// determine the command
						switch (nextToken) {
						// window title
						case Keywords.titleWord:
							// flag reading title
							readingTitle = true;

							itemValid = true;
							break;

						// polygon size
						case Keywords.polySizeWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minLineSize && numberValue <= ViewConstants.maxLineSize) {
									currentPolygonSize = numberValue;
									itemValid = true;
								}
							}
							break;

						// polygon track
						case Keywords.polyTrackWord:
							// get dx
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
									x = numberValue;
									isNumeric = false;

									// get dy
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
											currentPolygonDX = x;
											currentPolygonDY = numberValue;
											itemValid = true;
										}
									}
								}
							} else {
								// check for FIXED keyword
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.fixedWord) {
									// consume token
									peekToken = scriptReader.getNextToken();
									currentPolygonDX = 0;
									currentPolygonDY = 0;
									itemValid = true;
								}
							}

							break;

						// polygon view distance
						case Keywords.polyViewWord:
							// get the distance
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0 && numberValue <= view.engine.maxGridSize / 2) {
									currentPolygonVDistance = numberValue;
									itemValid = true;
								}
							} else {
								// check for OFF keyword
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.offWord) {
									// consume token
									peekToken = scriptReader.getNextToken();
									currentPolygonVDistance = -1;
									itemValid = true;
								}
							}
							break;

						// polygon angle
						case Keywords.polyAngleWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the angle value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0 && numberValue < 360) {
									currentPolygonAngle = numberValue;
									currentPolygonAngleFixed = false;
									// check for optional FIXED keyword
									peekToken = scriptReader.peekAtNextToken();
									if (peekToken === Keywords.fixedWord) {
										// consume token
										peekToken = scriptReader.getNextToken();
										currentPolygonAngleFixed = true;
									}
									itemValid = true;
								}
							}
							break;

						// polygon T
						case Keywords.polyTWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the T1 value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0) {
									x = numberValue;
									if (scriptReader.nextTokenIsNumeric()) {
										// get the T2 value
										numberValue = scriptReader.getNextTokenAsNumber() | 0;
										if (numberValue >= x) {
											y = numberValue;
											if (scriptReader.nextTokenIsNumeric()) {
												// get the Fade value
												numberValue = scriptReader.getNextTokenAsNumber() | 0;
												if (numberValue >= 0 && numberValue <= ((y - x) >> 1)) {
													currentPolygonT1 = x;
													currentPolygonT2 = y;
													currentPolygonTFade = numberValue;
													itemValid = true;
												} else {
													itemValid = true;
													scriptErrors[scriptErrors.length] = [nextToken + " " + x + " " + y + " "+ numberValue, "third argument must from 0 to " + ((y - x) >> 1)];
												}
											} else {
												isNumeric = false;
											}
										} else {
											itemValid = true;
											scriptErrors[scriptErrors.length] = [nextToken + " " + x + " " + numberValue, "second argument must be >= first"];
										}
									} else {
										isNumeric = false;
									}
								}
							} else {
								// check for all
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.allWord) {
									// consume token
									peekToken = scriptReader.getNextToken();
									currentPolygonT1 = -1;
									currentPolygonT2 = -1;
									currentPolygonTFade = 0;
									itemValid = true;
								} else {
									// fail needing a number
									isNumeric = false;
								}
							}
							break;

						// polygon alpha
						case Keywords.polyAlphaWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0 && numberValue <= 1) {
									currentPolygonAlpha = numberValue;
									itemValid = true;
								}
							}
							break;

						// polyline and polyfill
						case Keywords.polyLineWord:
						case Keywords.polyFillWord:
							coords = [];
							itemValid = true;
							z = -1000;

							// get the coordinates
							while (itemValid && scriptReader.nextTokenIsNumeric()) {
								// get the x value
								x = scriptReader.getNextTokenAsNumber();

								// check for y value
								if (scriptReader.nextTokenIsNumeric()) {
									y = scriptReader.getNextTokenAsNumber();

									// check x and y are in range
									if (x >= -view.engine.maxGridSize && x < (2 * view.engine.maxGridSize) && y >= -view.engine.maxGridSize && y < (2 * view.engine.maxGridSize)) {
										coords[coords.length] = x;
										coords[coords.length] = y;
									} else {
										scriptErrors[scriptErrors.length] = [nextToken + " " + x + " " + y, "coordinate out of range"];
										z = 0;
										itemValid = false;
									}
								} else {
									// assume x was zoom
									if (x >= ViewConstants.minZoom && x <= ViewConstants.maxZoom) {
										z = x;
									} else if (x >= ViewConstants.minNegZoom && x <= ViewConstants.maxNegZoom) {
										z = -(1 / x);
									} else {
										scriptErrors[scriptErrors.length] = [nextToken + " " + x, "zoom out of range"];
										z = 0;
										itemValid = false;
									}
								}
							}

							// check at least two coordinate pairs were specified
							if (itemValid && coords.length < 4) {
								scriptErrors[scriptErrors.length] = [nextToken, "requires at least 2 coordinate pairs"];
								itemValid = false;
							}
							
							// check zoom exists
							if (itemValid && z === -1000) {
								itemValid = false;
							}

							if (itemValid) {
								// check for optional fixed keyword
								peekToken = scriptReader.peekAtNextToken();
								currentPolygonPositionFixed = false;
								if (peekToken === Keywords.fixedWord) {
									// consume the token
									peekToken = scriptReader.getNextToken();
									currentPolygonPositionFixed = true;
									peekToken = scriptReader.peekAtNextToken();
								}
								// save the polygon
								currentPolygon = view.waypointManager.createPolygon(coords, (nextToken === Keywords.polyFillWord), z, currentPolygonMinZ, currentPolygonMaxZ, view.customPolygonColour, currentPolygonAlpha,
									currentPolygonSize, currentPolygonT1, currentPolygonT2, currentPolygonTFade, currentPolygonAngle, currentPolygonAngleFixed,
									currentPolygonPositionFixed, currentPolygonVDistance, currentPolygonDX, currentPolygonDY);
								view.waypointManager.addPolygon(currentPolygon);
							}

							break;

						// arrow size
						case Keywords.arrowSizeWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minLineSize && numberValue <= ViewConstants.maxLineSize) {
									x = numberValue;
									isNumeric = false;

									// get head percentage
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= 0 && numberValue <= 1) {
											currentArrowHeadMultiple = numberValue;
											currentArrowSize = x;
											itemValid = true;
										}
									}
								}
							}
							break;

						// arrow track
						case Keywords.arrowTrackWord:
							// get dx
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
									x = numberValue;
									isNumeric = false;

									// get dy
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
											currentArrowDX = x;
											currentArrowDY = numberValue;
											itemValid = true;
										}
									}
								}
							} else {
								// check for FIXED keyword
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.fixedWord) {
									// consume token
									peekToken = scriptReader.getNextToken();
									currentArrowDX = 0;
									currentArrowDY = 0;
									itemValid = true;
								}
							}

							break;

						// arrow view distance
						case Keywords.arrowViewWord:
							// get the distance
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0 && numberValue <= view.engine.maxGridSize / 2) {
									currentArrowVDistance = numberValue;
									itemValid = true;
								}
							} else {
								// check for OFF keyword
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.offWord) {
									// consume token
									peekToken = scriptReader.getNextToken();
									currentArrowVDistance = -1;
									itemValid = true;
								}
							}
							break;

						// arrow angle
						case Keywords.arrowAngleWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the angle value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0 && numberValue < 360) {
									currentArrowAngle = numberValue;
									currentArrowAngleFixed = false;
									// check for optional FIXED keyword
									peekToken = scriptReader.peekAtNextToken();
									if (peekToken === Keywords.fixedWord) {
										// consume token
										peekToken = scriptReader.getNextToken();
										currentArrowAngleFixed = true;
									}
									itemValid = true;
								}
							}
							break;

						// arrow T
						case Keywords.arrowTWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the T1 value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0) {
									x = numberValue;
									if (scriptReader.nextTokenIsNumeric()) {
										// get the T2 value
										numberValue = scriptReader.getNextTokenAsNumber() | 0;
										if (numberValue >= x) {
											y = numberValue;
											if (scriptReader.nextTokenIsNumeric()) {
												// get the Fade value
												numberValue = scriptReader.getNextTokenAsNumber() | 0;
												if (numberValue >= 0 && numberValue <= ((y - x) >> 1)) {
													currentArrowT1 = x;
													currentArrowT2 = y;
													currentArrowTFade = numberValue;
													itemValid = true;
												} else {
													itemValid = true;
													scriptErrors[scriptErrors.length] = [nextToken + " " + x + " " + y + " "+ numberValue, "third argument must from 0 to " + ((y - x) >> 1)];
												}
											} else {
												isNumeric = false;
											}
										} else {
											itemValid = true;
											scriptErrors[scriptErrors.length] = [nextToken + " " + x + " " + numberValue, "second argument must be >= first"];
										}
									} else {
										isNumeric = false;
									}
								}
							} else {
								// check for all
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.allWord) {
									// consume token
									peekToken = scriptReader.getNextToken();
									currentArrowT1 = -1;
									currentArrowT2 = -1;
									currentArrowTFade = 0;
									itemValid = true;
								} else {
									// fail needing a number
									isNumeric = false;
								}
							}
							break;

						// arrow alpha
						case Keywords.arrowAlphaWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0 && numberValue <= 1) {
									currentArrowAlpha = numberValue;
									itemValid = true;
								}
							}
							break;

						// arrow
						case Keywords.arrowWord:
							// get the x position
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= -view.engine.maxGridSize && numberValue < (2 * view.engine.maxGridSize)) {
									isNumeric = false;
									x = numberValue;

									// get the y position
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= -view.engine.maxGridSize && numberValue < (2 * view.engine.maxGridSize)) {
											isNumeric = false;
											y = numberValue;

											// get the x2 position
											if (scriptReader.nextTokenIsNumeric()) {
												isNumeric = true;

												// get the value
												numberValue = scriptReader.getNextTokenAsNumber();

												// check it is in range
												if (numberValue >= -view.engine.maxGridSize && numberValue < (2 * view.engine.maxGridSize)) {
													isNumeric = false;
													x2 = numberValue;

													// get the y position
													if (scriptReader.nextTokenIsNumeric()) {
														isNumeric = true;

														// get the value
														numberValue = scriptReader.getNextTokenAsNumber();

														// check it is in range
														if (numberValue >= -view.engine.maxGridSize && numberValue < (2 * view.engine.maxGridSize)) {
															isNumeric = false;
															y2 = numberValue;

															// get the zoom
															if (scriptReader.nextTokenIsNumeric()) {
																isNumeric = true;

																// get the value
																numberValue = scriptReader.getNextTokenAsNumber();

																// check it is in range
																z = -1000;
																if (numberValue >= ViewConstants.minZoom && numberValue <= ViewConstants.maxZoom) {
																	z = numberValue;
																} else {
																	// check for negative zoom format
																	if (numberValue >= ViewConstants.minNegZoom && numberValue <= ViewConstants.maxNegZoom) {
																		z = -(1 / numberValue);
																	}
																}
																if (z !== -1000) {
																	peekToken = scriptReader.peekAtNextToken();
																	currentArrowPositionFixed = false;
																	if (peekToken === Keywords.fixedWord) {
																		// consume the token
																		peekToken = scriptReader.getNextToken();
																		currentArrowPositionFixed = true;
																		peekToken = scriptReader.peekAtNextToken();
																	}
																	
																	// save the arrow
																	currentArrow = view.waypointManager.createArrow(x, y, x2, y2, z, currentArrowMinZ, currentArrowMaxZ, view.customArrowColour, currentArrowAlpha, currentArrowSize,
																	currentArrowHeadMultiple, currentArrowT1, currentArrowT2, currentArrowTFade, currentArrowAngle, currentArrowAngleFixed,
																	currentArrowPositionFixed, currentArrowVDistance, currentArrowDX, currentArrowDY);
																	view.waypointManager.addArrow(currentArrow);
																	itemValid = true;
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}

							break;

						// label size
						case Keywords.labelSizeWord:
							// read label size
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minLabelSize && numberValue <= ViewConstants.maxLabelSize) {
									currentLabelSize = numberValue;
									itemValid = true;

									// check for optional FIXED word
									peekToken = scriptReader.peekAtNextToken();
									if (peekToken === Keywords.fixedWord) {
										peekToken = scriptReader.getNextToken();
										currentLabelSizeFixed = true;
									} else {
										currentLabelSizeFixed = false;
									}
								}
							}
							break;

						// label track
						case Keywords.labelTrackWord:
							// get dx
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
									x = numberValue;
									isNumeric = false;

									// get dy
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
											currentLabelDX = x;
											currentLabelDY = numberValue;
											itemValid = true;
										}
									}
								}
							} else {
								// check for FIXED keyword
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.fixedWord) {
									// consume token
									peekToken = scriptReader.getNextToken();
									currentLabelDX = 0;
									currentLabelDY = 0;
									itemValid = true;
								}
							}

							break;

						// label view distance
						case Keywords.labelViewWord:
							// get the distance
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0 && numberValue <= view.engine.maxGridSize / 2) {
									currentLabelVDistance = numberValue;
									itemValid = true;
								}
							} else {
								// check for OFF keyword
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.offWord) {
									// consume token
									peekToken = scriptReader.getNextToken();
									currentLabelVDistance = -1;
									itemValid = true;
								}
							}
							break;

						// label angle
						case Keywords.labelAngleWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the angle value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0 && numberValue < 360) {
									currentLabelAngle = numberValue;
									currentLabelAngleFixed = false;
									// check for optional FIXED keyword
									peekToken = scriptReader.peekAtNextToken();
									if (peekToken === Keywords.fixedWord) {
										// consume token
										peekToken = scriptReader.getNextToken();
										currentLabelAngleFixed = true;
									}
									itemValid = true;
								}
							}
							break;

						// label T
						case Keywords.labelTWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the T1 value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0) {
									x = numberValue;
									if (scriptReader.nextTokenIsNumeric()) {
										// get the T2 value
										numberValue = scriptReader.getNextTokenAsNumber() | 0;
										if (numberValue >= x) {
											y = numberValue;
											if (scriptReader.nextTokenIsNumeric()) {
												// get the Fade value
												numberValue = scriptReader.getNextTokenAsNumber() | 0;
												if (numberValue >= 0 && numberValue <= ((y - x) >> 1)) {
													currentLabelT1 = x;
													currentLabelT2 = y;
													currentLabelTFade = numberValue;
													itemValid = true;
												} else {
													itemValid = true;
													scriptErrors[scriptErrors.length] = [nextToken + " " + x + " " + y + " "+ numberValue, "third argument must from 0 to " + ((y - x) >> 1)];
												}
											} else {
												isNumeric = false;
											}
										} else {
											itemValid = true;
											scriptErrors[scriptErrors.length] = [nextToken + " " + x + " " + numberValue, "second argument must be >= first"];
										}
									} else {
										isNumeric = false;
									}
								}
							} else {
								// check for all
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.allWord) {
									// consume token
									peekToken = scriptReader.getNextToken();
									currentLabelT1 = -1;
									currentLabelT2 = -1;
									currentLabelTFade = 0;
									itemValid = true;
								} else {
									// fail needing a number
									isNumeric = false;
								}
							}
							break;

						// label alpha
						case Keywords.labelAlphaWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0 && numberValue <= 1) {
									currentLabelAlpha = numberValue;
									itemValid = true;
								}
							}
							break;

						// polygon zoom range
						case Keywords.polyZoomRangeWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;
								numberValue = scriptReader.getNextTokenAsNumber();

								x = -1000;
								if (numberValue >= ViewConstants.minAnnotationZoom && numberValue <= ViewConstants.maxAnnotationZoom) {
									x = numberValue;
								} else {
									// check for negative zoom format
									if (numberValue >= ViewConstants.minAnnotationNegZoom && numberValue <= ViewConstants.maxAnnotationNegZoom) {
										x = -(1 / numberValue);
									}
								}

								if (x !== -1000) {
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;
										numberValue = scriptReader.getNextTokenAsNumber();

										y = -1000;
										if (numberValue >= ViewConstants.minAnnotationZoom && numberValue <= ViewConstants.maxAnnotationZoom) {
											y = numberValue;
										} else {
											// check for negative zoom format
											if (numberValue >= ViewConstants.minAnnotationNegZoom && numberValue <= ViewConstants.maxAnnotationNegZoom) {
												y = -(1 / numberValue);
											}
										}
	
										// check max >= min
										if (y !== -1000) {
											if (y < x) {
												y = -1000;
											}
										}

										// validate
										if (y !== -1000) {
											currentPolygonMinZ = x;
											currentPolygonMaxZ = y;
											itemValid = true;
										}
									}
								}
							} else {
								// check for OFF word
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.offWord) {
									// consume the token
									peekToken = scriptReader.getNextToken();

									// clear the zoom range
									currentPolygonMinZ = -1000;
									currentPolygonMaxZ = -1000;

									itemValid = true;
								}
							}
							break;

						// arrow zoom range
						case Keywords.arrowZoomRangeWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;
								numberValue = scriptReader.getNextTokenAsNumber();

								x = -1000;
								if (numberValue >= ViewConstants.minAnnotationZoom && numberValue <= ViewConstants.maxAnnotationZoom) {
									x = numberValue;
								} else {
									// check for negative zoom format
									if (numberValue >= ViewConstants.minAnnotationNegZoom && numberValue <= ViewConstants.maxAnnotationNegZoom) {
										x = -(1 / numberValue);
									}
								}

								if (x !== -1000) {
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;
										numberValue = scriptReader.getNextTokenAsNumber();

										y = -1000;
										if (numberValue >= ViewConstants.minAnnotationZoom && numberValue <= ViewConstants.maxAnnotationZoom) {
											y = numberValue;
										} else {
											// check for negative zoom format
											if (numberValue >= ViewConstants.minAnnotationNegZoom && numberValue <= ViewConstants.maxAnnotationNegZoom) {
												y = -(1 / numberValue);
											}
										}
	
										// check max >= min
										if (y !== -1000) {
											if (y < x) {
												y = -1000;
											}
										}

										// validate
										if (y !== -1000) {
											currentArrowMinZ = x;
											currentArrowMaxZ = y;
											itemValid = true;
										}
									}
								}
							} else {
								// check for OFF word
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.offWord) {
									// consume the token
									peekToken = scriptReader.getNextToken();

									// clear the zoom range
									currentArrowMinZ = -1000;
									currentArrowMaxZ = -1000;

									itemValid = true;
								}
							}
							break;

						// label zoom range
						case Keywords.labelZoomRangeWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;
								numberValue = scriptReader.getNextTokenAsNumber();

								x = -1000;
								if (numberValue >= ViewConstants.minAnnotationZoom && numberValue <= ViewConstants.maxAnnotationZoom) {
									x = numberValue;
								} else {
									// check for negative zoom format
									if (numberValue >= ViewConstants.minAnnotationNegZoom && numberValue <= ViewConstants.maxAnnotationNegZoom) {
										x = -(1 / numberValue);
									}
								}

								if (x !== -1000) {
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;
										numberValue = scriptReader.getNextTokenAsNumber();

										y = -1000;
										if (numberValue >= ViewConstants.minAnnotationZoom && numberValue <= ViewConstants.maxAnnotationZoom) {
											y = numberValue;
										} else {
											// check for negative zoom format
											if (numberValue >= ViewConstants.minAnnotationNegZoom && numberValue <= ViewConstants.maxAnnotationNegZoom) {
												y = -(1 / numberValue);
											}
										}
	
										// check max >= min
										if (y !== -1000) {
											if (y < x) {
												y = -1000;
											}
										}

										// validate
										if (y !== -1000) {
											currentLabelMinZ = x;
											currentLabelMaxZ = y;
											itemValid = true;
										}
									}
								}
							} else {
								// check for OFF word
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.offWord) {
									// consume the token
									peekToken = scriptReader.getNextToken();

									// clear the zoom range
									currentLabelMinZ = -1000;
									currentLabelMaxZ = -1000;

									itemValid = true;
								}
							}
							break;

						// label
						case Keywords.labelWord:
							// get the x position
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= -view.engine.maxGridSize && numberValue < (2 * view.engine.maxGridSize)) {
									isNumeric = false;
									x = numberValue;

									// get the y position
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= -view.engine.maxGridSize && numberValue < (2 * view.engine.maxGridSize)) {
											isNumeric = false;
											y = numberValue;

											// get the zoom
											if (scriptReader.nextTokenIsNumeric()) {
												isNumeric = true;

												// get the value
												numberValue = scriptReader.getNextTokenAsNumber();

												// check it is in range
												z = -1000;
												if (numberValue >= ViewConstants.minZoom && numberValue <= ViewConstants.maxZoom) {
													z = numberValue;
												} else {
													// check for negative zoom format
													if (numberValue >= ViewConstants.minNegZoom && numberValue <= ViewConstants.maxNegZoom) {
														z = -(1 / numberValue);
													}
												}
												if (z !== -1000) {
													// check for optional fixed keyword
													isNumeric = false;
													peekToken = scriptReader.peekAtNextToken();
													currentLabelPositionFixed = false;
													if (peekToken === Keywords.fixedWord) {
														// consume the token
														peekToken = scriptReader.getNextToken();
														currentLabelPositionFixed = true;
														peekToken = scriptReader.peekAtNextToken();
													}

													// check there is text
													if (peekToken[0] === Keywords.stringDelimiter) {
														// save the label
														currentLabel = view.waypointManager.createLabel(x, y, z, currentLabelMinZ, currentLabelMaxZ, view.customLabelColour, currentLabelAlpha, currentLabelSize, currentLabelSizeFixed,
															currentLabelT1, currentLabelT2, currentLabelTFade, currentLabelAngle, currentLabelAngleFixed, currentLabelPositionFixed,
															currentLabelVDistance, currentLabelDX, currentLabelDY);
														readingLabel = true;
														itemValid = true;
													} else {
														type = "a string";
													}
												}
											}
										}
									}
								}
							}

							break;

						// quality rendering
						case Keywords.qualityWord:
							view.engine.pretty = true;
							itemValid = true;
							break;

						// suppress escaping gliders
						case Keywords.killGlidersWord:
							view.engine.clearGliders = true;
							itemValid = true;
							break;

						// name recipe
						case Keywords.recipeWord:
							// get the name
							itemValid = false;
							peekToken = scriptReader.getNextToken();
							if (peekToken !== "") {
								// read delta list
								view.recipeDelta = [];

								// check for delta list
								while(scriptReader.nextTokenIsNumeric()) {
									numberValue = scriptReader.getNextTokenAsNumber();
									view.recipeDelta[view.recipeDelta.length] = numberValue;
								}

								// attemp to add recipe
								view.addNamedRecipe(scriptErrors, peekToken, view.recipeDelta);

								// clear list
								view.recipeDelta = [];

								// errors are handled in the above function
								itemValid = true;
							}
							break;

						// name rle
						case Keywords.rleWord:
							// get the name
							itemValid = false;
							peekToken = scriptReader.getNextToken();
							if (peekToken !== "") {
								// check the rle exists
								stringToken = scriptReader.peekAtNextToken();
								if (stringToken !== "") {
									// consume token
									scriptReader.getNextToken();

									// concatenate subequent tokens that are valid RLE
									transToken = scriptReader.peekAtNextToken();
									while (transToken !== "" && !this.isScriptCommand(transToken) && !scriptReader.nextTokenIsNumeric() && view.manager.decodeRLEString(pattern, transToken, false, view.engine.allocator) !== -1) {
										// consume token
										scriptReader.getNextToken();
										// add to rle
										stringToken += transToken;
										// look at next token
										transToken = scriptReader.peekAtNextToken();
									}

									// check for optional x and y
									x = 0;
									y = 0;
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;
										x = scriptReader.getNextTokenAsNumber();
									}
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;
										y = scriptReader.getNextTokenAsNumber();
									}

									// check for optional transformation
									z = -1;
									transToken = scriptReader.peekAtNextToken();
									if (transToken !== "") {
										switch (transToken) {
										case Keywords.transTypeIdentity:
											z = ViewConstants.transIdentity;
											break;
										case Keywords.transTypeFlip:
											z = ViewConstants.transFlip;
											break;
										case Keywords.transTypeFlipX:
											z = ViewConstants.transFlipX;
											break;
										case Keywords.transTypeFlipY:
											z = ViewConstants.transFlipY;
											break;
										case Keywords.transTypeSwapXY:
											z = ViewConstants.transSwapXY;
											break;
										case Keywords.transTypeSwapXYFlip:
											z = ViewConstants.transSwapXYFlip;
											break;
										case Keywords.transTypeRotateCW:
											z = ViewConstants.transRotateCW;
											break;
										case Keywords.transTypeRotateCCW:
											z = ViewConstants.transRotateCCW;
											break;
										}
										// eat token if it was valid
										if (z !== -1) {
											scriptReader.getNextToken();
										}
									}
									// default to identity if not defined
									if (z === -1) {
										z = ViewConstants.transIdentity;
									}

									// associate the name with the snippet
									view.addNamedRLE(scriptErrors, peekToken, stringToken, x, y, z);

									// errors are handled in the above function
									itemValid = true;
								}
							}

							break;

						// paste
						case Keywords.pasteWord:
							// get the rle
							stringToken = scriptReader.peekAtNextToken();
							if (stringToken !== "") {
								scriptReader.getNextToken();

								// concatenate subequent tokens that are valid RLE
								transToken = scriptReader.peekAtNextToken();
								while (transToken !== "" && !this.isScriptCommand(transToken) && !scriptReader.nextTokenIsNumeric() && view.manager.decodeRLEString(pattern, transToken, false, view.engine.allocator) !== -1) {
									// consume token
									scriptReader.getNextToken();
									// add to rle
									stringToken += transToken;
									// look at next token
									transToken = scriptReader.peekAtNextToken();
								}

								// check for optional position
								x = 0;
								y = 0;

								// get the x position
								if (scriptReader.nextTokenIsNumeric()) {
									isNumeric = true;
									x = scriptReader.getNextTokenAsNumber();
								}

								// get the y position
								if (scriptReader.nextTokenIsNumeric()) {
									isNumeric = true;
									y = scriptReader.getNextTokenAsNumber();
								}

								// check for optional transformation
								z = -1;
								transToken = scriptReader.peekAtNextToken();
								if (transToken !== "") {
									switch (transToken) {
									case Keywords.transTypeIdentity:
										z = ViewConstants.transIdentity;
										break;
									case Keywords.transTypeFlip:
										z = ViewConstants.transFlip;
										break;
									case Keywords.transTypeFlipX:
										z = ViewConstants.transFlipX;
										break;
									case Keywords.transTypeFlipY:
										z = ViewConstants.transFlipY;
										break;
									case Keywords.transTypeSwapXY:
										z = ViewConstants.transSwapXY;
										break;
									case Keywords.transTypeSwapXYFlip:
										z = ViewConstants.transSwapXYFlip;
										break;
									case Keywords.transTypeRotateCW:
										z = ViewConstants.transRotateCW;
										break;
									case Keywords.transTypeRotateCCW:
										z = ViewConstants.transRotateCCW;
										break;
									}
									// eat token if it was valid
									if (z !== -1) {
										scriptReader.getNextToken();
									}
								}
								// default to identity if not defined
								if (z === -1) {
									z = ViewConstants.transIdentity;
								}

								if (!view.addRLE(view.pasteGen, view.pasteEnd, view.pasteDelta, view.pasteEvery, view.pasteMode, view.pasteDeltaX, view.pasteDeltaY, stringToken, x, y, z)) {
									scriptErrors[scriptErrors.length] = [Keywords.pasteWord + " " + stringToken, "invalid name or rle"];
								}
	
								// errors handled above
								itemValid = true;
							}

							break;

						// set position delta for PASTET EVERY
						case Keywords.pasteDeltaWord:
							// get the X offset
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();
								if (numberValue >= -4096 && numberValue <= 4096) {
									view.pasteDeltaX = numberValue;
									isNumeric = false;
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;
										numberValue = scriptReader.getNextTokenAsNumber();
										if (numberValue >= -4096 && numberValue <= 4096) {
											view.pasteDeltaY = numberValue;
											itemValid = true;
										}
									}
								}
							}
							break;

						// set rle paste generation
						case Keywords.pasteTWord:
							// get the paste generation
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0) {
									view.pasteGen = numberValue;
									view.pasteEvery = 0;
									view.pasteEnd = -1;
									view.pasteDelta = [];

									// check for delta list
									readingTokens = true;
									while (readingTokens) {
										// if token is numeric then add it to list
										if (scriptReader.nextTokenIsNumeric()) {
											numberValue = scriptReader.getNextTokenAsNumber();
											view.pasteDelta[view.pasteDelta.length] = numberValue;
										} else {
											// check if the token is a recipe name
											peekToken = scriptReader.peekAtNextToken();
											if (view.addRecipe(peekToken, view.pasteDelta)) {
												// consume token
												scriptReader.getNextToken();
											} else {
												readingTokens = false;
											}
										}
									}
									itemValid = true;
								}
							} else {
								// check for every keyword
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.everyWord) {
									// consume token
									peekToken = scriptReader.getNextToken();

									// check for value
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= 1) {
											view.pasteEvery = numberValue;
											view.pasteGen = 0;
											view.pasteEnd = -1;

											// check for optional start gen
											if (scriptReader.nextTokenIsNumeric()) {
												numberValue = scriptReader.getNextTokenAsNumber();

												// check it is in range
												if (numberValue >= 0) {
													view.pasteGen = numberValue;

													// check for optional end gen
													if (scriptReader.nextTokenIsNumeric()) {
														numberValue = scriptReader.getNextTokenAsNumber();
	
														// check it is in range
														if (numberValue >= view.pasteGen + view.pasteEvery) {
															view.pasteEnd = numberValue;
															itemValid = true;
														}
													} else {
														itemValid = true;
													}
												}
											} else {
												itemValid = true;
											}
										}
									}
								}
							}

							break;

						// mark time since last interval
						case Keywords.timeIntervalWord:
							// add to the waypoint
							currentWaypoint.intervalTime = true;

							itemValid = true;
							break;

						// show play duration
						case Keywords.playTimeWord:
							view.showPlayDuration = true;

							itemValid = true;
							break;

						// set rle paste mode
						case Keywords.pasteModeWord:
							itemValid = true;
							isNumeric = false;
							type = "paste mode";
							peekToken = scriptReader.peekAtNextToken();
							switch (peekToken) {
							case Keywords.pasteModeZeroWord:
								view.pasteMode = ViewConstants.pasteModeZero;
								break;
							case Keywords.pasteModeAndWord:
								view.pasteMode = ViewConstants.pasteModeAnd;
								break;
							case Keywords.pasteMode0010Word:
								view.pasteMode = ViewConstants.pasteMode0010;
								break;
							case Keywords.pasteModeXWord:
								view.pasteMode = ViewConstants.pasteModeX;
								break;
							case Keywords.pasteMode0100Word:
								view.pasteMode = ViewConstants.pasteMode0100;
								break;
							case Keywords.pasteModeYWord:
								view.pasteMode = ViewConstants.pasteModeY;
								break;
							case Keywords.pasteModeXorWord:
								view.pasteMode = ViewConstants.pasteModeXor;
								break;
							case Keywords.pasteModeOrWord:
								view.pasteMode = ViewConstants.pasteModeOr;
								break;
							case Keywords.pasteModeNOrWord:
								view.pasteMode = ViewConstants.pasteModeNOr;
								break;
							case Keywords.pasteModeXNOrWord:
								view.pasteMode = ViewConstants.pasteModeXNOr;
								break;
							case Keywords.pasteModeNotYWord:
								view.pasteMode = ViewConstants.pasteModeNotY;
								break;
							case Keywords.pasteMode1011Word:
								view.pasteMode = ViewConstants.pasteMode1011;
								break;
							case Keywords.pasteModeNotXWord:
								view.pasteMode = ViewConstants.pasteModeNotX;
								break;
							case Keywords.pasteMode1101Word:
								view.pasteMode = ViewConstants.pasteMode1101;
								break;
							case Keywords.pasteModeNAndWord:
								view.pasteMode = ViewConstants.pasteModeNAnd;
								break;
							case Keywords.pasteModeOneWord:
								view.pasteMode = ViewConstants.pasteModeOne;
								break;
							case Keywords.pasteModeCopyWord:
								view.pasteMode = ViewConstants.pasteModeCopy;
								break;
							default:
								// check for binary
								if (peekToken.length === 4) {
									numberValue = 0;
									i = 0;
									while (i < 4 && itemValid) {
										numberValue <<= 1;
										switch (peekToken.substr(i, 1)) {
											case "1":
												numberValue |= 1;
												break;
											case "0":
												break;
											default:
												itemValid = false;
										}
										i += 1;
									}
									if (itemValid) {
										view.pasteMode = numberValue;
									}
								} else {
									// check for numeric value
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;
	
										// get the value
										numberValue = scriptReader.getNextTokenAsNumber() | 0;
	
										// check it is in range
										if (numberValue >= 0 && numberValue <= 15) {
											view.pasteMode = numberValue;
										} else {
											itemValid = false;
										}
									} else {
										itemValid = false;
									}
								}
							}
							// eat the paste mode token if valid and not numeric
							if (itemValid && !isNumeric) {
								scriptReader.getNextToken();
							}
							break;

						// hide GUI on playback
						case Keywords.hideGUIWord:
							view.hideGUI = true;

							itemValid = true;
							break;

						// no performance warning
						case Keywords.noPerfWarningWord:
							view.perfWarning = false;

							itemValid = true;
							break;

						// no history
						case Keywords.noHistoryWord:
							view.noHistory = true;

							itemValid = true;
							break;

						// no generation notifications
						case Keywords.noReportWord:
							view.genNotifications = false;

							itemValid = true;
							break;

						// maximum grid size
						case Keywords.maxGridSizeWord:
							// get the grid size
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minGridPower && numberValue <= ViewConstants.maxGridPower) {
									view.engine.maxGridSize = 1 << numberValue;
									itemValid = true;
								}
							}
							break;

						// starfield
						case Keywords.starfieldWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch stars off
								currentWaypoint.stars = false;
							} else {
								currentWaypoint.stars = true;
							}
							currentWaypoint.starsDefined = true;

							itemValid = true;
							break;

						// fit zoom
						case Keywords.autoFitWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch fit zoom off
								currentWaypoint.fitZoom = false;
							} else {
								currentWaypoint.fitZoom = true;
							}

							itemValid = true;
							break;

						// number of history states
						case Keywords.historyStatesWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0 && numberValue <= view.maxHistoryStates) {
									view.historyStates = numberValue;

									itemValid = true;
								}
							}
							break;

						// number of alive states
						case Keywords.aliveStatesWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0 && numberValue <= view.maxHistoryStates) {
									view.aliveStates = numberValue;

									itemValid = true;
								}
							}
							break;

						// history fit mode
						case Keywords.historyFitWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch fit zoom off
								view.historyFit = false;
							} else {
								view.historyFit = true;
							}

							itemValid = true;
							break;

						// grid
						case Keywords.gridWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch grid off
								currentWaypoint.grid = false;
							} else {
								// switch grid on
								currentWaypoint.grid = true;
							}
							currentWaypoint.gridDefined = true;

							itemValid = true;
							break;

						// grid major
						case Keywords.gridMajorWord:
							// get the interval
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minBoldGridInterval && numberValue <= ViewConstants.maxBoldGridInterval) {
									view.engine.gridLineMajor = numberValue;
									view.customGridMajor = true;
									itemValid = true;
								}
							}
							break;

						// color or colour
						case Keywords.colorWord:
						case Keywords.colourWord:
							// save the colour keyword used
							whichColour = nextToken;
							badColour = false;

							// read the colour number
							if (scriptReader.nextTokenIsNumeric()) {
								// get the value
								colNum = scriptReader.getNextTokenAsNumber() | 0;

								// check it is an allowed state colour index
								if (colNum < 0 || colNum > 255) {
									// invalid state
									scriptErrors[scriptErrors.length] = [nextToken + " " + colNum, "STATE out of range"];
									badColour = true;
								}

								// decode the rgb value
								this.decodeRGB(view, scriptReader, scriptErrors, colNum, nextToken, badColour, colNum);
							} else {
								// check if it is a custom theme element
								peekToken = scriptReader.peekAtNextToken();
								switch(peekToken) {
								// [R]History color states
								case Keywords.offColorWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeBackground, whichColour);
									break;

								case Keywords.onColorWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeAlive, whichColour);
									break;

								case Keywords.historyColorWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeDead, whichColour);
									break;

								case Keywords.mark1ColorWord:
									peekToken = scriptReader.getNextToken();
									this.decodeRGB(view, scriptReader, scriptErrors, ViewConstants.mark1State, nextToken, false, peekToken);
									break;

								case Keywords.markOffColorWord:
									peekToken = scriptReader.getNextToken();
									this.decodeRGB(view, scriptReader, scriptErrors, ViewConstants.markOffState, nextToken, false, peekToken);
									break;

								case Keywords.mark2ColorWord:
									peekToken = scriptReader.getNextToken();
									this.decodeRGB(view, scriptReader, scriptErrors, ViewConstants.mark2State, nextToken, false, peekToken);
									break;

								case Keywords.killColorWord:
									peekToken = scriptReader.getNextToken();
									this.decodeRGB(view, scriptReader, scriptErrors, ViewConstants.killState, nextToken, false, peekToken);
									break;

								// background
								case Keywords.themeBackgroundWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeBackground, whichColour);
									break;

								// alive
								case Keywords.themeAliveWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeAlive, whichColour);
									break;

								// aliveramp
								case Keywords.themeAliveRampWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeAliveRamp, whichColour);
									break;

								// dead
								case Keywords.themeDeadWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeDead, whichColour);
									break;

								// deadramp
								case Keywords.themeDeadRampWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeDeadRamp, whichColour);
									break;
								
								// dying
								case Keywords.themeDyingWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeDying, whichColour);
									break;

								// dyingramp
								case Keywords.themeDyingRampWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeDyingRamp, whichColour);
									break;
								
								// grid
								case Keywords.gridWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeGrid, whichColour);
									break;

								// grid major
								case Keywords.gridMajorWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeGridMajor, whichColour);
									break;

								// stars
								case Keywords.starfieldWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeStars, whichColour);
									break;

								// text
								case Keywords.textColorWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeText, whichColour);
									break;

								// error
								case Keywords.errorColorWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeError, whichColour);
									break;

								// label
								case Keywords.labelWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeLabel, whichColour);
									break;

								// arrow
								case Keywords.arrowWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeArrow, whichColour);
									break;

								// polygon
								case Keywords.polyWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemePoly, whichColour);
									break;

								// boundary
								case Keywords.boundaryWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeBoundary, whichColour);
									break;

								// bounded
								case Keywords.boundedWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeBounded, whichColour);
									break;

								// select
								case Keywords.selectWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeSelect, whichColour);
									break;

								// paste
								case Keywords.pasteWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemePaste, whichColour);
									break;

								// advance
								case Keywords.advanceWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeAdvance, whichColour);
									break;

								// graph background
								case Keywords.graphBgColorWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeGraphBg, whichColour);
									break;

								// graph axis
								case Keywords.graphAxisColorWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeGraphAxis, whichColour);
									break;

								// graph alive
								case Keywords.graphAliveColorWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeGraphAlive, whichColour);
									break;

								// graph birth
								case Keywords.graphBirthColorWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeGraphBirth, whichColour);
									break;

								// graph death
								case Keywords.graphDeathColorWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeGraphDeath, whichColour);
									break;

								// UI foreground
								case Keywords.uiFGWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeUIFG, whichColour);
									break;

								// UI background
								case Keywords.uiBGWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeUIBG, whichColour);
									break;

								// UI highlight
								case Keywords.uiHighlightWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeUIHighlight, whichColour);
									break;

								// UI select
								case Keywords.uiSelectWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeUISelect, whichColour);
									break;

								// UI locked
								case Keywords.uiLockedWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeUILocked, whichColour);
									break;

								// UI border
								case Keywords.uiBorderWord:
									this.readCustomThemeElement(view, scriptReader, scriptErrors, ViewConstants.customThemeUIBorder, whichColour);
									break;

								// others are errors or state names
								default:
									// check if in string
									if (peekToken.charAt(0) === "\"") {
										peekToken = scriptReader.getNextToken();
										do {
											stringToken = scriptReader.getNextToken();
											peekToken += " " + stringToken;
										}
										while (stringToken !== "" && stringToken.charAt(stringToken.length - 1) !== "\"");
									} else {
										peekToken = scriptReader.getNextToken();
									}

									// check state names
									colNum = view.getStateFromName(peekToken);

									// decode the rgb value
									if (colNum !== -1) {
										this.decodeRGB(view, scriptReader, scriptErrors, colNum, nextToken, badColour, peekToken);
									}

									// illegal colour element
									if (colNum === -1) {
										scriptErrors[scriptErrors.length] = [nextToken + " " + peekToken, "illegal element"];

										// eat the invalid token
										peekToken = scriptReader.getNextToken();
									}
									break;
								}
							}

							// error handling done already
							itemValid = true;
							break;

						// end script token
						case Keywords.scriptEndWord:
							// search for next start token
							if (scriptReader.findToken(Keywords.scriptStartWord, -1) === -1) {
								// if not found then finish
								scriptReader.eatAllTokens();
							}
							itemValid = true;

							// do not count in command count
							view.numScriptCommands -= 1;
							break;

						// view only
						case Keywords.viewOnlyWord:
							view.viewOnly = true;
							itemValid = true;
							break;

						// hide source
						case Keywords.noSourceWord:
							view.noSource = true;
							itemValid = true;
							break;

						// reverse playback start
						case Keywords.reverseStartWord:
							view.reverseStart = true;
							itemValid = true;
							break;

						// no playback throttle
						case Keywords.noThrottleWord:
							view.canBailOut = false;
							itemValid = true;
							break;

						// exclusive playback
						case Keywords.exclusivePlayWord:
							view.exclusivePlayback = true;
							itemValid = true;
							break;

						// ignore pause requests
						case Keywords.ignoreExclusiveWord:
							view.ignorePauseRequests = true;
							itemValid = true;
							break;

						// no GUI
						case Keywords.noGUIWord:
							view.noGUI = true;
							view.noGUIDefined = true;
							itemValid = true;
							break;

						// no RLE copy
						case Keywords.noCopyWord:
							view.noCopy = true;
							itemValid = true;
							break;

						// suppress overwrite warning of previous commands one time
						case Keywords.suppressWord:
							suppressErrors.x = true;
							suppressErrors.y = true;
							suppressErrors.zoom = true;
							suppressErrors.angle = true;
							suppressErrors.tilt = true;
							suppressErrors.layers = true;
							suppressErrors.depth = true;
							suppressErrors.theme = true;
							suppressErrors.gps = true;
							suppressErrors.step = true;
							suppressErrors.loop = true;
							suppressErrors.stop = true;
							suppressErrors.width = true;
							suppressErrors.height = true;
							suppressErrors.popupWidth = true;
							suppressErrors.popupHeight = true;
							itemValid = true;
							break;

						// off
						case Keywords.offWord:
							scriptErrors[scriptErrors.length] = [Keywords.offWord, "must follow LOOP or STOP"];
							itemValid = true;
							break;

						// all
						case Keywords.allWord:
							// check for the argument
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.initialWord) {
								// token is valid so eat it
								peekToken = scriptReader.getNextToken();

								// check for POI
								if (currentWaypoint.isPOI) {
									// copy values from initial waypoint
									view.waypointManager.copyInitialAll(currentWaypoint, scriptErrors);
									view.setInitialFlags();
								} else {
									scriptErrors[scriptErrors.length] = [Keywords.allWord + " " + Keywords.initialWord, "only valid at a POI"];
								}
							} else {
								scriptErrors[scriptErrors.length] = [Keywords.allWord, "must be followed by INITIAL"];
							}
							itemValid = true;
							break;

						// initial
						case Keywords.initialWord:
							scriptErrors[scriptErrors.length] = [Keywords.initialWord, "must follow POI, ALL or a POI setting"];
							itemValid = true;
							break;

						// start from
						case Keywords.startFromWord:
							// get the interval
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0 && numberValue <= ViewConstants.maxStartFromGeneration) {
									view.startFrom = numberValue;
									itemValid = true;
								}
							}
							break;

						// autostart
						case Keywords.autoStartWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								view.autoStart = false;
							} else {
								if (view.executable) {
									view.autoStart = true;
								}
							}
							itemValid = true;
							break;

						// start POI at generation
						case Keywords.poiTWord:
							// get the target generation
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0) {
									// check waypoint is a POI
									if (currentWaypoint.isPOI) {
										// set the target in the current waypoint
										currentWaypoint.targetGen = numberValue;
										currentWaypoint.targetGenDefined = true;
									} else {
										scriptErrors[scriptErrors.length] = [Keywords.poiTWord + " " + numberValue, "only valid at a POI"];
									}
									itemValid = true;
								}
							}
							break;

						// play at POI
						case Keywords.poiPlayWord:
							currentWaypoint.setPlayAction(scriptErrors);
							itemValid = true;
							break;

						// stop at POI
						case Keywords.poiStopWord:
							currentWaypoint.setStopAction(scriptErrors);
							itemValid = true;
							break;

						// reset at POI
						case Keywords.poiResetWord:
							currentWaypoint.setResetAction(scriptErrors);
							itemValid = true;
							break;

						// POI transition speed
						case Keywords.poiTransWord:
							// get the transition speed
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= WaypointConstants.poiMinSpeed && numberValue <= WaypointConstants.poiMaxSpeed) {
									// set speed in waypoint
									currentWaypoint.setTransitionSpeed(numberValue, scriptErrors);
									itemValid = true;
								}
							}
							break;

						// add Labels as POIs
						case Keywords.poiAddLabelsWord:
							addLabelsAsPOIs = true;
							itemValid = true;
							break;

						// hard reset
						case Keywords.hardResetWord:
							view.hardReset = true;
							itemValid = true;
							break;

						// state 1 fit
						case Keywords.state1FitWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch state 1 fit off
								view.state1Fit = false;
							} else {
								view.state1Fit = true;
							}
							itemValid = true;
							break;

						// track
						case Keywords.trackWord:
							// get the x speed
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
									// save x
									newX = numberValue;

									// get the y offset
									isNumeric = false;
									nextToken += " " + numberValue;

									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
											// save y
											newY = numberValue;
											itemValid = true;

											// check if overwrote previous definition
											if (view.trackDefined) {
												scriptErrors[scriptErrors.length] = [Keywords.trackWord + " " + newX + " " + newY, "overwrites " + trackX + " " + trackY];
											}

											// save new values
											trackX = newX;
											trackY = newY;
											view.trackDefined = true;
										}
									}
								}
							}
							break;

						// track loop
						case Keywords.trackLoopWord:
							// get the period
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue > 0) {
									// save period
									newPeriod = numberValue;

									// get the x offset
									isNumeric = false;

									nextToken += " " + numberValue;
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
											// save x
											newX = numberValue;

											// get the y offset
											isNumeric = false;
											nextToken += " " + numberValue;

											if (scriptReader.nextTokenIsNumeric()) {
												isNumeric = true;

												// get the value
												numberValue = scriptReader.getNextTokenAsNumber();

												// check it is in range
												if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
													// save y
													newY = numberValue;
													itemValid = true;

													// check if overwrote previous definition
													if (view.trackLoopDefined) {
														scriptErrors[scriptErrors.length] = [Keywords.trackLoopWord + " " + newPeriod + " " + newX + " " + newY, "overwrites " + trackPeriod + " " + trackX + " " + trackY];
													}

													// save new values
													trackPeriod = newPeriod;
													trackX = newX;
													trackY = newY;
													view.trackLoopDefined = true;
													view.trackDefined = true;
												}
											}
										}
									}
								}
							}
							break;

						// track box
						case Keywords.trackBoxWord:
							// get the E speed
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
									// save E speed
									trackBoxE = numberValue;

									// get the S speed
									isNumeric = false;

									nextToken += " " + numberValue;
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
											// save S speed
											trackBoxS = numberValue;

											// get the W speed
											isNumeric = false;

											nextToken += " " + numberValue;
											if (scriptReader.nextTokenIsNumeric()) {
												isNumeric = true;

												// get the value
												numberValue = scriptReader.getNextTokenAsNumber();

												// check it is in range
												if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
													// save W speed
													trackBoxW = numberValue;

													// get the N speed
													isNumeric = false;

													nextToken += " " + numberValue;
													if (scriptReader.nextTokenIsNumeric()) {
														isNumeric = true;

														// get the value
														numberValue = scriptReader.getNextTokenAsNumber();

														// check it is in range
														if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
															// save N value
															trackBoxN = numberValue;
															itemValid = true;

															// check that W < E
															if (trackBoxW > trackBoxE) {
																scriptErrors[scriptErrors.length] = [Keywords.trackBoxWord + " W " + this.toPlaces(trackBoxW, 2) + " E " + this.toPlaces(trackBoxE, 2), "W is greater than E"];
															} else {
																// check that N < S
																if (trackBoxN > trackBoxS) {
																	scriptErrors[scriptErrors.length] = [Keywords.trackBoxWord + " N " + this.toPlaces(trackBoxN, 2) + " S " + this.toPlaces(trackBoxS, 2), "N is greater than S"];
																} else {
																	if (view.trackBoxDefined) {
																		scriptErrors[scriptErrors.length] = [Keywords.trackBoxWord + " " + this.toPlaces(trackBoxE, 2) + " " + this.toPlaces(trackBoxS, 2) + " " + this.toPlaces(trackBoxW, 2) + " " + this.toPlaces(trackBoxN, 2), "overwrites " + this.toPlaces(view.trackBoxE, 2) + " " + this.toPlaces(view.trackBoxS, 2) + " " + this.toPlaces(view.trackBoxW, 2) + " " + this.toPlaces(view.trackBoxN, 2)];
																	}

																	// save new values
																	view.trackBoxDefined = true;
																	view.trackDefined = true;
																	view.trackBoxN = trackBoxN;
																	view.trackBoxE = trackBoxE;
																	view.trackBoxS = trackBoxS;
																	view.trackBoxW = trackBoxW;
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
							break;

						// stop
						case Keywords.stopWord:
							// remember the current waypoint
							tempWaypoint = currentWaypoint;

							// STOP goes to initial setting if not defined at a POI
							if (!currentWaypoint.isPOI && view.waypointManager.numWaypoints > 0) {
								currentWaypoint = view.waypointManager.firstWaypoint();
							}

							// get the stop generation
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue > 0) {
									// check if already defined
									if (currentWaypoint.stopGenDefined && !view.initialStop && !suppressErrors.stop) {
										if (currentWaypoint.stopGeneration === -1) {
											scriptErrors[scriptErrors.length] = [Keywords.stopWord + " " + numberValue, "overwrites " + Keywords.offWord];
										} else {
											scriptErrors[scriptErrors.length] = [Keywords.stopWord + " " + numberValue, "overwrites " + currentWaypoint.stopGeneration];
										}
									}

									// save value
									currentWaypoint.stopGeneration = numberValue;
									currentWaypoint.stopGenDefined = true;
									view.initialStop = false;
									suppressErrors.stop = false;
									itemValid = true;
								}
							} else {
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.offWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();
									if (currentWaypoint.stopGenDefined && !view.initialStop && !suppressErrors.stop) {
										if (currentWaypoint.stopGeneration === -1 && !view.initialStop) {
											scriptErrors[scriptErrors.length] = [Keywords.stopWord + " " + Keywords.offWord, "overwrites " + Keywords.offWord];
										} else {
											scriptErrors[scriptErrors.length] = [Keywords.stopWord + " " + Keywords.offWord, "overwrites " + currentWaypoint.stopGeneration];
										}
									}

									// save value
									currentWaypoint.stopGeneration = -1;
									currentWaypoint.stopGenDefined = true;
									view.initialStop = false;
									suppressErrors.stop = false;
									itemValid = true;
								} else {
									if (peekToken === Keywords.initialWord) {
										// token valid so eat it
										peekToken = scriptReader.getNextToken();

										// copy from initial waypoint
										view.waypointManager.copyInitial(Keywords.stopWord, currentWaypoint, scriptErrors, view.initialStop);
										view.initialStop = true;
										itemValid = true;
									}
								}
							}

							// restore current Waypoint
							currentWaypoint = tempWaypoint;

							break;

						// loop
						case Keywords.loopWord:
							// remember the current waypoint
							tempWaypoint = currentWaypoint;

							// STOP goes to initial setting if not defined at a POI
							if (!currentWaypoint.isPOI && view.waypointManager.numWaypoints() > 0) {
								currentWaypoint = view.waypointManager.firstWaypoint();
							}

							// get the loop generation
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue > 0) {
									// check if already defined
									if (currentWaypoint.loopGenDefined && !view.initialLoop && !suppressErrors.loop) {
										if (currentWaypoint.loopGeneration === -1) {
											scriptErrors[scriptErrors.length] = [Keywords.loopWord + " " + numberValue, "overwrites " + Keywords.offWord];
										} else {
											scriptErrors[scriptErrors.length] = [Keywords.loopWord + " " + numberValue, "overwrites " + currentWaypoint.loopGeneration];
										}
									}

									// save value
									currentWaypoint.loopGeneration = numberValue;
									currentWaypoint.loopGenDefined = true;
									view.initialLoop = false;
									suppressErrors.loop = false;
									itemValid = true;
								}
							} else {
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.offWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();
									if (currentWaypoint.loopGenDefined && !view.initialLoop && !suppressErrors.loop) {
										if (currentWaypoint.loopGeneration === -1) {
											scriptErrors[scriptErrors.length] = [Keywords.loopWord + " " + Keywords.offWord, "overwrites " + Keywords.offWord];
										} else {
											scriptErrors[scriptErrors.length] = [Keywords.loopWord + " " + Keywords.offWord, "overwrites " + currentWaypoint.loopGeneration];
										}
									}

									// save value
									currentWaypoint.loopGeneration = -1;
									currentWaypoint.loopGenDefined = true;
									view.initialLoop = false;
									suppressErrors.loop = false;
									itemValid = true;
								} else {
									if (peekToken === Keywords.initialWord) {
										// token valid so eat it
										peekToken = scriptReader.getNextToken();

										// copy from initial waypoint
										view.waypointManager.copyInitial(Keywords.loopWord, currentWaypoint, scriptErrors, view.initialLoop);
										view.initialLoop = true;
										itemValid = true;
									}
								}
							}

							// restore current Waypoint
							currentWaypoint = tempWaypoint;

							break;

						// tilt
						case Keywords.tiltWord:
							// get the tilt
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minTilt && numberValue <= ViewConstants.maxTilt) { 
									// check if tilt already defined
									if (currentWaypoint.tiltDefined && !view.initialTilt && !suppressErrors.tilt) {
										scriptErrors[scriptErrors.length] = [Keywords.tiltWord + " " + numberValue, "overwrites " + currentWaypoint.tilt];
									}

									// set tilt in waypoint
									currentWaypoint.tilt = numberValue;
									currentWaypoint.tiltDefined = true;
									view.initialTilt = false;
									suppressErrors.tilt = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									view.waypointManager.copyInitial(Keywords.tiltWord, currentWaypoint, scriptErrors, view.initialTilt);
									view.initialTilt = true;
									itemValid = true;
								}
							}
							break;

						// angle
						case Keywords.angleWord:
							// get the angle
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0 && numberValue <= 359) { 
									// check if angle already defined
									if (currentWaypoint.angleDefined && !view.initialAngle && !suppressErrors.angle) {
										scriptErrors[scriptErrors.length] = [Keywords.angleWord + " " + numberValue, "overwrites " + currentWaypoint.angle];
									}

									// set angle in waypoint
									currentWaypoint.angle = numberValue;
									currentWaypoint.angleDefined = true;
									view.initialAngle = false;
									suppressErrors.angle = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									view.waypointManager.copyInitial(Keywords.angleWord, currentWaypoint, scriptErrors, view.initialAngle);
									view.initialAngle = true;
									itemValid = true;
								}
							}
							break;

						// layers
						case Keywords.layersWord:
							// get the number of layers
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minLayers && numberValue <= ViewConstants.maxLayers) {
									// check if layers already defined
									if (currentWaypoint.layersDefined && !view.initialLayers && !suppressErrors.layers) {
										scriptErrors[scriptErrors.length] = [Keywords.layersWord + " " + numberValue, "overwrites " + currentWaypoint.layers];
									}

									// set layers in waypoint
									currentWaypoint.layers = numberValue;
									currentWaypoint.layersDefined = true;
									view.initialLayers = false;
									suppressErrors.layers = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									view.waypointManager.copyInitial(Keywords.layersWord, currentWaypoint, scriptErrors, view.initialLayers);
									view.initialLayers = true;
									itemValid = true;
								}
							}
							break;

						// depth
						case Keywords.depthWord:
							// get the layer depth
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minDepth && numberValue <= ViewConstants.maxDepth) {
									// check if depth already defined
									if (currentWaypoint.depthDefined && !view.initialDepth && !suppressErrors.depth) {
										scriptErrors[scriptErrors.length] = [Keywords.depthWord + " " + numberValue, "overwrites " + currentWaypoint.depth];
									}

									// set depth in the waypoint
									currentWaypoint.depth = numberValue;
									currentWaypoint.depthDefined = true;
									view.initialDepth = false;
									suppressErrors.depth = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									view.waypointManager.copyInitial(Keywords.depthWord, currentWaypoint, scriptErrors, view.initialDepth);
									view.initialDepth = true;
									itemValid = true;
								}
							}
							break;

						// x offset
						case Keywords.xOffsetWord:
							// get the x offset
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= -view.engine.maxGridSize / 2 && numberValue <= view.engine.maxGridSize / 2) {
									// set x offset
									view.xOffset = numberValue;
									itemValid = true;
								}
							}
							break;

						// y offset
						case Keywords.yOffsetWord:
							// get the y offset
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= -view.engine.maxGridSize / 2 && numberValue <= view.engine.maxGridSize / 2) {
									// set y offset
									view.yOffset = numberValue;
									itemValid = true;
								}
							}
							break;

						// x
						case Keywords.xWord:
							// get the x position
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= -view.engine.maxGridSize / 2 && numberValue <= view.engine.maxGridSize / 2) {
									// check if x already defined
									if (currentWaypoint.xDefined && !view.initialX && !suppressErrors.x) {
										scriptErrors[scriptErrors.length] = [Keywords.xWord + " " + numberValue, "overwrites " + -currentWaypoint.x];
									}

									// set x in waypoint
									currentWaypoint.x = -numberValue;
									currentWaypoint.xDefined = true;
									view.initialX = false;
									suppressErrors.x = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									view.waypointManager.copyInitial(Keywords.xWord, currentWaypoint, scriptErrors, view.initialX);
									view.initialX = true;
									itemValid = true;
								}
							}
							break;

						// y
						case Keywords.yWord:
							// get the y position
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= -view.engine.maxGridSize / 2 && numberValue <= view.engine.maxGridSize / 2) {
									// check if y already defined
									if (currentWaypoint.yDefined && !view.initialY && !suppressErrors.y) {
										scriptErrors[scriptErrors.length] = [Keywords.yWord + " " + numberValue, "overwrites " + -currentWaypoint.y];
									}

									// set y in waypoint
									currentWaypoint.y = -numberValue;
									currentWaypoint.yDefined = true;
									view.initialY = false;
									suppressErrors.y = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									view.waypointManager.copyInitial(Keywords.yWord, currentWaypoint, scriptErrors, view.initialY);
									view.initialY = true;
									itemValid = true;
								}
							}
							break;

						// integer zoom
						case Keywords.integerZoomWord:
							view.integerZoom = true;
							itemValid = true;
							break;

						// thumbnail zoom
						case Keywords.thumbZoomWord:
							// get the thumbnail zoom
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minZoom && numberValue <= ViewConstants.maxZoom) {
									// set thumbnail zoom
									view.thumbZoomDefined = true;
									view.thumbZoomValue = numberValue;
									itemValid = true;
								} else {
									// check for negative zoom format
									if (numberValue >= ViewConstants.minNegZoom && numberValue <= ViewConstants.maxNegZoom) {
										// set thumbnail zoom
										view.thumbZoomDefined = true;
										view.thumbZoomValue = -(1 / numberValue);
										itemValid = true;
									}
								}
							}
							break;

						// zoom and alternate zoom
						case Keywords.alternateZoomWord:
						case Keywords.zoomWord:
							// get the zoom
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minZoom && numberValue <= ViewConstants.maxZoom) {
									// check if zoom already defined
									if (currentWaypoint.zoomDefined && !view.initialZ && !suppressErrors.zoom) {
										if (currentWaypoint.zoom < 1) {
											scriptErrors[scriptErrors.length] = [Keywords.zoomWord + " " + numberValue, "overwrites " + (-(1 / currentWaypoint.zoom))];
										} else {
											scriptErrors[scriptErrors.length] = [Keywords.zoomWord + " " + numberValue, "overwrites " + currentWaypoint.zoom];
										}
									}

									// set zoom in waypoint
									currentWaypoint.zoom = numberValue;
									currentWaypoint.zoomDefined = true;
									view.initialZ = false;
									suppressErrors.zoom = false;
									itemValid = true;
								} else {
									// check for negative zoom format
									if (numberValue >= ViewConstants.minNegZoom && numberValue <= ViewConstants.maxNegZoom) {
										// check if zoom already defined
										if (currentWaypoint.zoomDefined && !view.initialZ) {
											if (currentWaypoint.zoom < 1) {
												scriptErrors[scriptErrors.length] = [Keywords.zoomWord + " " + numberValue, "overwrites " + (-(1 / currentWaypoint.zoom))];
											} else {
												scriptErrors[scriptErrors.length] = [Keywords.zoomWord + " " + numberValue, "overwrites " + currentWaypoint.zoom];
											}
										}

										// set zoom in waypoint
										currentWaypoint.zoom = -(1 / numberValue);
										currentWaypoint.zoomDefined = true;
										view.initialZ = false;
										itemValid = true;
									}
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									view.waypointManager.copyInitial(Keywords.zoomWord, currentWaypoint, scriptErrors, view.initialZ);
									view.initialZ = true;
									itemValid = true;
								}
							}
							break;

						// gps
						case Keywords.gpsWord:
							// get the stop generation
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minGenSpeed) {
									// check if gps already defined
									if (currentWaypoint.gpsDefined && !view.initialGps && !suppressErrors.gps) {
										scriptErrors[scriptErrors.length] = [Keywords.gpsWord + " " + numberValue, "overwrites " + currentWaypoint.gps];
									}

									// set gps in waypoint
									if (numberValue > view.refreshRate) {
										numberValue = view.refreshRate;
									}
									currentWaypoint.gps = numberValue;
									currentWaypoint.gpsDefined = true;
									view.initialGps = false;
									suppressErrors.gps = false;
									view.standardGPS = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									view.waypointManager.copyInitial(Keywords.gpsWord, currentWaypoint, scriptErrors, view.initialGps);
									view.initialGps = true;
									itemValid = true;
								}
							}
							break;

						// thumbnail
						case Keywords.thumbnailWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch thumbnail off if not in a popup window
								if (!view.isInPopup) {
									view.thumbnail = false;
									view.thumbnailEverOn = false;
								}
							} else {
								// set the thumbnail flag if not in a popup window
								if (!view.isInPopup) {
									view.thumbnail = true;
									view.thumbnailEverOn = true;
								}
							}
							itemValid = true;
							break;

						// thumbnail start
						case Keywords.thumbStartWord:
							view.thumbStart = true;
							itemValid = true;
							break;

						// thumbnail launch
						case Keywords.thumbLaunchWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch thumblaunch off if not in a popup window
								if (!view.isInPopup) {
									view.thumbnail = false;
									view.thumbnailEverOn = false;
									view.thumbLaunch = false;
									view.menuManager.thumbLaunch = false;
								}
							} else {
								// clicking on thumbnail launches popup viewer if not in a popup window
								if (!view.isInPopup) {
									view.thumbnail = true;
									view.thumbnailEverOn = true;
									view.thumbLaunch = true;
									view.menuManager.thumbLaunch = true;
								}
							}
							itemValid = true;
							break;

						// thumbnail size
						case Keywords.thumbSizeWord:
							// get the thumbnail size
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minThumbSize && numberValue <= ViewConstants.maxThumbSize) {
									// save the size
									view.thumbnailDivisor = numberValue;
									itemValid = true;
								}
							}
							break;

						// theme
						case Keywords.themeWord:
							// get the theme number
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0 && numberValue < view.engine.numThemes) {
									// check if theme already defined at view waypoint
									if (currentWaypoint.themeDefined && !view.initialTheme && !suppressErrors.theme) {
										// raise script error
										this.raiseThemeError(view, scriptErrors, numberValue, currentWaypoint.theme);
									}

									// set theme in waypoint
									currentWaypoint.theme = numberValue;
									currentWaypoint.themeDefined = true;
									view.initialTheme = false;
									suppressErrors.theme = false;
									itemValid = true;
								}
							} else {
								// check for custom theme
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.themeCustomWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// check if custom theme is defined
									if (view.customTheme) {
										// check if theme already defined at view waypoint
										if (currentWaypoint.themeDefined && !view.initialTheme) {
											// raise script error
											this.raiseThemeError(view, scriptErrors, view.engine.numThemes, currentWaypoint.theme);
										}

										// set theme in waypoint
										currentWaypoint.theme = view.engine.numThemes;
										currentWaypoint.themeDefined = true;
										view.initialTheme = false;
										itemValid = true;
									} else {
										// raise error
										scriptErrors[scriptErrors.length] = [Keywords.themeWord + " " + Keywords.themeCustomWord, "no custom THEME defined"];
										itemValid = true;
									}
								} else {
									// check for theme name
									numberValue = view.themeFromName(peekToken);
									if (numberValue !== -1) {
										// token valid so eat it
										peekToken = scriptReader.getNextToken();

										// check if theme already defined at view waypoint
										if (currentWaypoint.themeDefined && !view.initialTheme && !suppressErrors.theme) {
											// raise script error
											this.raiseThemeError(view, scriptErrors, numberValue, currentWaypoint.theme);
										}

										// set theme in waypoint
										currentWaypoint.theme = numberValue;
										currentWaypoint.themeDefined = true;
										view.initialTheme = false;
										suppressErrors.theme = false;
										itemValid = true;
									} else {
										// check for initial
										if (peekToken === Keywords.initialWord) {
											// token valid so eat it
											peekToken = scriptReader.getNextToken();
	
											// copy from initial waypoint
											view.waypointManager.copyInitial(Keywords.themeWord, currentWaypoint, scriptErrors, view.initialTheme);
											view.initialTheme = true;
											itemValid = true;
										}
									}
								}

								// output error if not valid
								if (!itemValid) {
									itemValid = true;
									scriptErrors[scriptErrors.length] = [nextToken, "invalid specification"];
								}
							}
							break;

						// rainbow word
						case Keywords.rainbowWord:
							view.engine.rainbow = true;
							itemValid = true;
							break;

						// start script
						case Keywords.scriptStartWord:
							// already in a script block so raise error
							scriptErrors[scriptErrors.length] = [nextToken, "already in a script block"];
							itemValid = true;
							break;

						// show information bar
						case Keywords.showInfoBarWord:
							// show information bar
							view.infoBarEnabled = !view.infoBarEnabled;

							itemValid = true;
							break;

						// show timing
						case Keywords.showTimingWord:
							// show timing
							view.fpsButton.current = view.viewFpsToggle([true], true, view);
							itemValid = true;
							break;

						// extended timing
						case Keywords.extendedTimingWord:
							// show timing
							view.timingDetailButton.current = view.viewTimingDetailToggle([true], true, view);
							itemValid = true;
							break;

						// show generation statistics
						case Keywords.showGenStatsWord:
							// show generation statistics
							view.viewStats([true], true, view);
							if (view.genToggle) {
								view.genToggle.current = [view.statsOn];
								view.menuManager.toggleRequired = true;
							}

							itemValid = true;
							break;

						// boundary delete radius
						case Keywords.deleteRangeWord:
							// get the radius size
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check if is in range
								if (numberValue >= ViewConstants.minDeleteRadius && numberValue <= ViewConstants.maxDeleteRadius) {
									itemValid = true;

									// save the value
									view.engine.removePatternRadius = numberValue;
								}
							}
							break;

						// disable population graph
						case Keywords.noGraphWord:
							// disable graph
							view.graphDisabled = true;
							itemValid = true;
							break;

						// population graph
						case Keywords.graphWord:
							// enable graph display
							view.popGraph = true;
							itemValid = true;
							break;

						// population graph opacity
						case Keywords.graphOpacityWord:
							// read opacity
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();
								if (numberValue >= 0 && numberValue <= 1) {
									itemValid = true;

									// save the value
									view.popGraphOpacity = numberValue;
								}
							}
							break;

						// population graph use points
						case Keywords.graphPointsWord:
							// set points mode
							view.popGraphLines = false;
							itemValid = true;
							break;

						// triangular cells
						case Keywords.triCellsWord:
							if (view.engine.isTriangular) {
								view.engine.forceRectangles = false;
							}
							itemValid = true;
							break;

						// hex cells
						case Keywords.hexCellsWord:
							// set hexagonal cells
							if (view.engine.isHex) {
								view.engine.forceRectangles = false;
							}
							itemValid = true;
							break;

						// square cells
						case Keywords.squareCellsWord:
							// set square cells
							view.engine.forceRectangles = true;
							itemValid = true;
							break;

						// cell borders
						case Keywords.bordersWord:
							view.engine.cellBorders = true;

							itemValid = true;
							break;

						// random width
						case Keywords.randomWidthWord:
							// get the width
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minRandomWidth && numberValue <= ViewConstants.maxRandomWidth) {
									view.randomWidth = numberValue;
									itemValid = true;
								}
							}
							break;

						// random height
						case Keywords.randomHeightWord:
							// get the width
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minRandomHeight && numberValue <= ViewConstants.maxRandomHeight) {
									view.randomHeight = numberValue;
									itemValid = true;
								}
							}
							break;

						// random fill percentage
						case Keywords.randomFillWord:
							// get the fill percentage
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minRandomFill && numberValue <= ViewConstants.maxRandomFill) {
									view.randomFillPercentage = numberValue;
									itemValid = true;
								}
							}
							break;

						// random reversible Margolus rule word
						case Keywords.randomReversibleWord:
							view.randomReversible = true;
							itemValid = true;
							break;

						// random swap Margolus rule word
						case Keywords.randomSwapWord:
							view.randomSwap = true;
							itemValid = true;
							break;

						// random chance Life-Like rule word
						case Keywords.randomChanceWord:
							// check the argument
							peekToken = scriptReader.peekAtNextToken();
							switch(peekToken) {
							// fixed
							case Keywords.fixedWord:
								peekToken = scriptReader.getNextToken();
								itemValid = true;
								view.randomRuleFixed = true;
								break;
							// all
							case Keywords.allWord:
								peekToken = scriptReader.getNextToken();
								// get random percentage
								if (scriptReader.nextTokenIsNumeric()) {
									isNumeric = true;

									// get the value
									numberValue = scriptReader.getNextTokenAsNumber() | 0;

									// check it is in range
									if (numberValue >= 0 && numberValue <= 100) {
										view.randomChanceAll = numberValue;
										itemValid = true;
									}
								}
								break;

							// b
							case Keywords.randomBWord:
								peekToken = scriptReader.getNextToken();
								// get random percentage
								if (scriptReader.nextTokenIsNumeric()) {
									isNumeric = true;

									// get the value
									numberValue = scriptReader.getNextTokenAsNumber() | 0;

									// check it is in range
									if (numberValue >= 0 && numberValue <= 100) {
										view.randomChanceB = numberValue;
										itemValid = true;
									}
								}
								break;

							// s
							case Keywords.randomSWord:
								peekToken = scriptReader.getNextToken();
								// get random percentage
								if (scriptReader.nextTokenIsNumeric()) {
									isNumeric = true;

									// get the value
									numberValue = scriptReader.getNextTokenAsNumber() | 0;

									// check it is in range
									if (numberValue >= 0 && numberValue <= 100) {
										view.randomChanceS = numberValue;
										itemValid = true;
									}
								}
								break;

							// handle Bn and Sn
							default:
								if (this.validBSn(peekToken)) {
									peekToken = scriptReader.getNextToken();
									// get random percentage
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber() | 0;

										// check it is in range
										if (numberValue >= 0 && numberValue <= 100) {
											this.saveBSn(view, numberValue);
											itemValid = true;
										}
									}
								}
								break;
							}
							break;

						// randomize word
						case Keywords.randomizeWord:
							// read the seed
							view.randomizePattern = true;

							itemValid = true;
							break;

						// random seed
						case Keywords.randomSeedWord:
							// read the seed
							view.randomSeed = scriptReader.getNextToken();
							view.randomSeedCustom = true;

							itemValid = true;
							break;

						// linear motion
						case Keywords.linearWord:
							// check for the argument
							peekToken = scriptReader.peekAtNextToken();
							switch(peekToken) {
							// x
							case Keywords.xWord:
								// check if x mode already defined
								if (currentWaypoint.xModeDefined) {
									this.modeDefined(currentWaypoint.xLinear, Keywords.linearWord, Keywords.xWord, scriptErrors);
								}

								// set x mode in waypoint
								currentWaypoint.xLinear = true;
								currentWaypoint.xModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// y
							case Keywords.yWord:
								// check if y mode already defined
								if (currentWaypoint.yModeDefined) {
									this.modeDefined(currentWaypoint.yLinear, Keywords.linearWord, Keywords.yWord, scriptErrors);
								}

								// set y mode in waypoint
								currentWaypoint.yLinear = true;
								currentWaypoint.yModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// zoom
							case Keywords.zoomWord:
								// check if zoom mode already defined
								if (currentWaypoint.zoomModeDefined) {
									this.modeDefined(currentWaypoint.zLinear, Keywords.linearWord, Keywords.zoomWord, scriptErrors);
								}

								// set zoom mode in waypoint
								currentWaypoint.zLinear = true;
								currentWaypoint.zModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// all
							case Keywords.allWord:
								// check if modes already defined
								if (currentWaypoint.xModeDefined) {
									this.modeDefined(currentWaypoint.xLinear, Keywords.linearWord, Keywords.xWord, scriptErrors);
								}
								if (currentWaypoint.yModeDefined) {
									this.modeDefined(currentWaypoint.yLinear, Keywords.linearWord, Keywords.yWord, scriptErrors);
								}
								if (currentWaypoint.zoomModeDefined) {
									this.modeDefined(currentWaypoint.zLinear, Keywords.linearWord, Keywords.zoomWord, scriptErrors);
								}

								// set in current waypoint
								currentWaypoint.xLinear = true;
								currentWaypoint.xModeDefined = true;
								currentWaypoint.yLinear = true;
								currentWaypoint.yModeDefined = true;
								currentWaypoint.zLinear = true;
								currentWaypoint.zModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// others are errors
							default:
								this.nonNumericTokenError(scriptReader, scriptErrors, Keywords.linearWord, "argument", Keywords.allWord + ", " + Keywords.xWord + ", " + Keywords.yWord + " or " + Keywords.zoomWord);
								break;
							}

							// item always valid since error handling is included
							itemValid = true;
							break;

						// bezier motion
						case Keywords.bezierWord:
							// check for the argument
							peekToken = scriptReader.peekAtNextToken();
							switch(peekToken) {
							// x
							case Keywords.xWord:
								// check if x mode already defined
								if (currentWaypoint.xModeDefined) {
									this.modeDefined(currentWaypoint.xLinear, Keywords.bezierWord, Keywords.xWord, scriptErrors);
								}

								// set x mode in waypoint
								currentWaypoint.xLinear = false;
								currentWaypoint.xModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// y
							case Keywords.yWord:
								// check if y mode already defined
								if (currentWaypoint.yModeDefined) {
									this.modeDefined(currentWaypoint.yLinear, Keywords.bezierWord, Keywords.yWord, scriptErrors);
								}

								// set y mode in waypoint
								currentWaypoint.yLinear = false;
								currentWaypoint.yModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// zoom
							case Keywords.zoomWord:
								// check if zoom mode already defined
								if (currentWaypoint.zoomModeDefined) {
									this.modeDefined(currentWaypoint.zLinear, Keywords.bezierWord, Keywords.zoomWord, scriptErrors);
								}

								// set zoom mode in waypoint
								currentWaypoint.zLinear = false;
								currentWaypoint.zModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// all
							case Keywords.allWord:
								// check if modes already defined
								if (currentWaypoint.xModeDefined) {
									this.modeDefined(currentWaypoint.xLinear, Keywords.bezierWord, Keywords.xWord, scriptErrors);
								}
								if (currentWaypoint.yModeDefined) {
									this.modeDefined(currentWaypoint.yLinear, Keywords.bezierWord, Keywords.yWord, scriptErrors);
								}
								if (currentWaypoint.zoomModeDefined) {
									this.modeDefined(currentWaypoint.zLinear, Keywords.bezierWord, Keywords.zoomWord, scriptErrors);
								}

								// set in current waypoint
								currentWaypoint.xLinear = false;
								currentWaypoint.xModeDefined = true;
								currentWaypoint.yLinear = false;
								currentWaypoint.yModeDefined = true;
								currentWaypoint.zLinear = false;
								currentWaypoint.zModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// others are errors
							default:
								this.nonNumericTokenError(scriptReader, scriptErrors, Keywords.bezierWord, "argument", Keywords.allWord + ", " + Keywords.xWord + ", " + Keywords.yWord + " or " + Keywords.zoomWord);
								break;
							}

							// item always valid since error handling is included
							itemValid = true;
							break;

						// point of interest
						case Keywords.poiWord:
							// mark points of interest found
							poiFound = true;

							// add the current waypoint to the list
							view.waypointManager.add(currentWaypoint, view);

							// create a new waypoint as a point of interest
							currentWaypoint = view.waypointManager.createWaypoint();
							currentWaypoint.isPOI = true;

							// check for initial
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.initialWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();

								// check if there is already a default POI
								if (view.defaultPOI !== -1) {
									scriptErrors[scriptErrors.length] = [Keywords.poiWord + " " + Keywords.initialWord, "overrides previous initial POI"];
								}

								// set as the default POI
								view.defaultPOI = view.waypointManager.numPOIs();
							}

							// clear "initial" flags
							view.clearInitialFlags();

							itemValid = true;
							break;

						// t
						case Keywords.tWord:
							// get the target generation
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0) {
									// mark that waypoints have been found
									waypointsFound = true;

									// add a new waypoint if not at generation 0
									if (numberValue > 0) {
										// add the current waypoint to the list
										view.waypointManager.add(currentWaypoint, view);

										// create a new waypoint
										currentWaypoint = view.waypointManager.createWaypoint();
									}

									// set the target in the current waypoint
									currentWaypoint.targetGen = numberValue;
									currentWaypoint.targetGenDefined = true;

									itemValid = true;
								}
							}
							break;

						// step
						case Keywords.stepWord:
							// get the number of steps
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minStepSpeed && numberValue <= ViewConstants.maxStepSpeed) {
									// check if step already defined
									if (currentWaypoint.stepDefined && !view.initialStep && !suppressErrors.step) {
										scriptErrors[scriptErrors.length] = [Keywords.stepWord + " " + numberValue, "overwrites " + currentWaypoint.step];
									}

									// set step in waypoint
									currentWaypoint.step = numberValue;
									currentWaypoint.stepDefined = true;
									view.initialStep = false;
									suppressErrors.step = false;
									view.standardStep = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									view.waypointManager.copyInitial(Keywords.stepWord, currentWaypoint, scriptErrors, view.initialStep);
									view.initialStep = true;
									itemValid = true;
								}
							}
							break;

						// pause
						case Keywords.pauseWord:
							// get the target time
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0) {
									// mark that waypoints have been found
									waypointsFound = true;

									// add the current waypoint to the list
									view.waypointManager.add(currentWaypoint, view);
									
									// create a new waypoint
									currentWaypoint = view.waypointManager.createWaypoint();

									// ensure the time is no less than one frame
									if (numberValue < ViewConstants.singleFrameSeconds) {
										numberValue = ViewConstants.singleFrameSeconds;
									}

									// set the target time in the current waypoint
									currentWaypoint.targetTime = numberValue;
									currentWaypoint.targetTimeDefined = true;

									itemValid = true;
								}
							}
							break;

						// viewer width
						case Keywords.widthWord:
							// get the width
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// save the requested width if not in popup
								if (!view.isInPopup) {
									if (view.requestedWidth !== -1 && !suppressErrors.width) {
										scriptErrors[scriptErrors.length] = [Keywords.widthWord + " " + numberValue, "overwrites " + view.requestedWidth];
									}
									view.requestedWidth = numberValue;
								}

								// validation will happen at the end of script processing
								suppressErrors.width = false;
								itemValid = true;
							}
							break;

						// viewer height
						case Keywords.heightWord:
							// get the height
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// save the requested height if not in popup
								if (!view.isInPopup) {
									if (view.requestedHeight !== -1 && !suppressErrors.height) {
										scriptErrors[scriptErrors.length] = [Keywords.heightWord + " " + numberValue, "overwrites " + view.requestedHeight];
									}
									view.requestedHeight = numberValue;
								}

								// validation will happen at the end of script processing
								suppressErrors.height = false;
								itemValid = true;
							}
							break;

						// popup viewer width
						case Keywords.popupWidthWord:
							// get the width
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// save the requested popup height
								if (view.requestedPopupWidth !== -1 && !suppressErrors.popupWidth) {
									scriptErrors[scriptErrors.length] = [Keywords.popupWidthWord + " " + numberValue, "overwrites " + view.requestedPopupWidth];
								}
								view.requestedPopupWidth = numberValue;

								// validation will happen at the end of script processing
								suppressErrors.popupWidth = false;
								itemValid = true;
							}
							break;

						// popup viewer height
						case Keywords.popupHeightWord:
							// get the height
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// save the requested popup height if not in popup
								if (view.requestedPopupHeight !== -1 && !suppressErrors.popupHeight) {
									scriptErrors[scriptErrors.length] = [Keywords.popupHeightWord + " " + numberValue, "overwrites " + view.requestedPopupHeight];
								}
								view.requestedPopupHeight = numberValue;

								// validation will happen at the end of script processing
								suppressErrors.popupHeight = false;
								itemValid = true;
							}
							break;

						// others are errors
						default:
							scriptErrors[scriptErrors.length] = [nextToken, "unknown or misspelt command"];
							itemValid = true;
							break;
						}

						// check if the item was valid
						if (!itemValid) {
							// check if the argument was numeric
							if (isNumeric) {
								// argument was not in range
								scriptErrors[scriptErrors.length] = [nextToken + " " + numberValue, "argument out of range"];
							} else {
								// raise a non-numeric token error
								this.nonNumericTokenError(scriptReader, scriptErrors, nextToken, "argument", type);
							}
						}
					}
				}

				// get next token
				if (nextToken !== "") {
					nextToken = scriptReader.getNextToken();
				}
			}

			// check for unterminated message
			if (readingString) {
				scriptErrors[scriptErrors.length] = [Keywords.stringDelimiter + stringValue, "unterminated string"];
			}

			// check if waypoints and one of track, track box or track loop defined
			if (waypointsFound && view.trackDefined) {
				// check which track mode was defined
				if (view.trackBoxDefined) {
					notPossibleError = Keywords.trackBoxWord;
				} else {
					if (view.trackLoopDefined) {
						notPossibleError = Keywords.trackLoopWord;
					} else {
						notPossibleError = Keywords.trackWord;
					}
				}

				// raise error
				scriptErrors[scriptErrors.length] = [notPossibleError, "can not be used with Waypoints"];

				// disable track mode
				view.trackDefined = false;
				view.trackBoxDefined = false;
				view.trackLoopDefined = false;
			}

			// check for track or track loop command
			if (!view.trackBoxDefined && (view.trackDefined || view.trackLoopDefined)) {
				// check for track loop
				if (view.trackLoopDefined) {
					// check for major gridlines
					if (view.engine.gridLineMajor > 0) {
						// multiply track parameters by grid line major interval
						trackPeriod *= view.engine.gridLineMajor;
					}

					// set LOOP
					currentWaypoint.loopGeneration = trackPeriod;
				}

				// set the track paramters
				view.trackBoxN = trackY;
				view.trackBoxE = trackX;
				view.trackBoxS = trackY;
				view.trackBoxW = trackX;
			}

			// check if waypoints or POI were found
			if (waypointsFound || poiFound) {
				// add the waypoint/POI to the list
				view.waypointManager.add(currentWaypoint, view);

				// set the current waypoint to be the first one
				currentWaypoint = view.waypointManager.firstWaypoint();
				if (waypointsFound) {
					view.waypointsDefined = true;
				} else {
					// check for initial POI defined
					if (view.defaultPOI !== -1) {
						// set current as default POI
						view.currentPOI = view.defaultPOI;

						// merge initial POI into current waypoint
						tempWaypoint = view.waypointManager.poiList[view.defaultPOI];
						if (tempWaypoint.xDefined) {
							currentWaypoint.xDefined = tempWaypoint.xDefined;
							currentWaypoint.x = tempWaypoint.x;
						}
						if (tempWaypoint.yDefined) {
							currentWaypoint.yDefined = tempWaypoint.yDefined;
							currentWaypoint.y = tempWaypoint.y;
						}
						if (tempWaypoint.zoomDefined) {
							currentWaypoint.zoomDefined = tempWaypoint.zoomDefined;
							currentWaypoint.zoom = tempWaypoint.zoom;
						}
						if (tempWaypoint.angleDefined) {
							currentWaypoint.angleDefined = tempWaypoint.angleDefined;
							currentWaypoint.angle = tempWaypoint.angle;
						}
						if (tempWaypoint.tiltDefined) {
							currentWaypoint.tiltDefined = tempWaypoint.tiltDefined;
							currentWaypoint.tilt = tempWaypoint.tilt;
						}
						if (tempWaypoint.depthDefined) {
							currentWaypoint.depthDefined = tempWaypoint.depthDefined;
							currentWaypoint.depth = tempWaypoint.depth;
						}
						if (tempWaypoint.layersDefined) {
							currentWaypoint.layersDefined = tempWaypoint.layersDefined;
							currentWaypoint.layers = tempWaypoint.layers;
						}
						if (tempWaypoint.themeDefined) {
							currentWaypoint.themeDefined = tempWaypoint.themeDefined;
							currentWaypoint.theme = tempWaypoint.theme;
						}
						if (tempWaypoint.gpsDefined) {
							currentWaypoint.gpsDefined = tempWaypoint.gpsDefined;
							currentWaypoint.gps = tempWaypoint.gps;
						}
						if (tempWaypoint.stepDefined) {
							currentWaypoint.stepDefined = tempWaypoint.stepDefined;
							currentWaypoint.step = tempWaypoint.step;
						}
						if (tempWaypoint.stopDefined) {
							currentWaypoint.stopDefined = tempWaypoint.stopDefined;
							currentWaypoint.stop = tempWaypoint.stop;
						}
						if (tempWaypoint.loopDefined) {
							currentWaypoint.loopDefined = tempWaypoint.loopDefined;
							currentWaypoint.loop = tempWaypoint.loop;
						}
					}
				}

				// validate AUTOFIT
				if (waypointsFound) {
					for (i = 0; i < view.waypointManager.numWaypoints(); i += 1) {
						currentWaypoint = view.waypointManager.waypointList[i];
						
						// check if AUTOFIT used
						if (currentWaypoint.fitZoom) {
							// check if X, Y or ZOOM are defined
							if (currentWaypoint.xDefined || currentWaypoint.yDefined || currentWaypoint.zoomDefined) {
								stringValue = "";

								// check if X defined
								if (currentWaypoint.xDefined) {
									stringValue = "X " + currentWaypoint.x;
									if (currentWaypoint.yDefined) {
										if (currentWaypoint.zoomDefined) {
											stringValue += ", Y " + currentWaypoint.y + " and ZOOM " + currentWaypoint.zoom;
										} else {
											stringValue += " and Y " + currentWaypoint.y;
										}
									} else {
										if (currentWaypoint.zoomDefined) {
											stringValue += " and ZOOM " + currentWaypoint.zoom;
										}
									}
								} else {
									if (currentWaypoint.yDefined) {
										stringValue = "Y " + currentWaypoint.y;
										if (currentWaypoint.zoomDefined) {
											stringValue += " and ZOOM " + currentWaypoint.zoom;
										}
									} else {
										if (currentWaypoint.zoomDefined) {
											stringValue = "ZOOM " + currentWaypoint.zoom;
										}
									}
								}

								// output the error
								scriptErrors[scriptErrors.length] = [Keywords.autoFitWord, "overwrites " + stringValue];
							}
						}
					}
					// reset current to waypoint zero
					currentWaypoint = view.waypointManager.firstWaypoint();
				}

				if (poiFound) {
					// check for autostart
					if (currentWaypoint.modeAtPOI === WaypointConstants.play) {
						if (view.executable) {
							view.autoStart = true;
						}
					}
				}
			}

			// check if autofit defined
			if (currentWaypoint.fitZoom) {
				// set autofit
				view.autoFit = true;
			}

			// set position from current
			if (currentWaypoint.yDefined) {
				view.engine.yOff = view.engine.height / 2 - currentWaypoint.y;
			}
			if (currentWaypoint.xDefined) {
				view.engine.xOff = view.engine.width / 2 - currentWaypoint.x;
				if (view.engine.isHex) {
					view.engine.xOff -= view.engine.yOff / 2;
				}
			}

			// set zoom
			if (currentWaypoint.zoomDefined) {
				view.engine.zoom = currentWaypoint.zoom;
			}

			// set angle
			if (!(view.engine.isTriangular || view.engine.isHex || view.engine.isNone)) {
				if (currentWaypoint.angleDefined) {
					view.engine.angle = currentWaypoint.angle;
				}

				// set tilt
				if (currentWaypoint.tiltDefined) {
					view.engine.tilt = currentWaypoint.tilt;
				}
	
				// set depth
				if (currentWaypoint.depthDefined) {
					view.engine.layerDepth = (currentWaypoint.depth / ViewConstants.depthScale) + ViewConstants.minDepth;
				}
	
				// set layers
				if (currentWaypoint.layersDefined) {
					view.engine.layers = currentWaypoint.layers;
				}
			}

			// set theme
			if (currentWaypoint.themeDefined) {
				view.themeRequested = currentWaypoint.theme;
			}

			// set gps
			if (currentWaypoint.gpsDefined) {
				view.genSpeed = currentWaypoint.gps;

				// default step to 1x
				view.gensPerStep = ViewConstants.minStepSpeed;
			}

			// set step
			if (currentWaypoint.stepDefined) {
				view.gensPerStep = currentWaypoint.step;

				// default gens per second
				if (view.gensPerStep > 1) {
					view.genSpeed = view.refreshRate;
				}
			}

			// set message
			if (currentWaypoint.textDefined) {
				view.menuManager.notification.notify(currentWaypoint.textMessage, 15, 1000, 15, false);
			}

			// copy stop and loop from the first waypoint
			view.stopGeneration = currentWaypoint.stopGeneration;
			view.loopGeneration = currentWaypoint.loopGeneration;

			// check if default x, y and zoom used
			if (currentWaypoint.zoomDefined) {
				view.defaultZoomUsed = true;
			}
			if (currentWaypoint.xDefined) {
				view.defaultXUsed = true;
			}
			if (currentWaypoint.yDefined) {
				view.defaultYUsed = true;
			}

			// set grid
			if (currentWaypoint.gridDefined) {
				view.engine.displayGrid = currentWaypoint.grid;
			}

			// set stars
			if (currentWaypoint.starsDefined) {
				view.starsOn = currentWaypoint.stars;
			}

			// count how many custom colours provided
			for (i = 0; i < numStates; i += 1) {
				if (view.customColours[i] !== -1) {
					numCustomColours += 1;
				}
			}

			// check if there were custom colours
			if (numCustomColours > 0) {
				// work out if all custom colours used
				view.allCustom = true;

				// if custom colours were provided then check they exist for all states
				for (i = 0; i < numStates; i += 1) {
					if (view.manager.stateCount[i]) {
						if (view.customColours[i] === -1) {
							// mark not all custom colours used
							view.allCustom = false;

							// mark state used default colour
							view.customColourUsed[i] = ViewConstants.stateUsedDefault;
						} else {
							// mark state used custom colour
							view.customColourUsed[i] = ViewConstants.stateUsedCustom;
						}
					} else {
						// mark state was not used
						view.customColourUsed[i] = ViewConstants.stateNotUsed;
					}
				}

				// change the colour set name
				if (view.allCustom) {
					view.colourSetName = "(custom)";
				} else {
					view.colourSetName += " (custom*)";
				}
			} else {
				// clear custom colours
				view.customColours = null;
			}
			
			// check if custom theme provided
			if (view.customTheme) {
				// setup custom theme
				this.setupCustomTheme(view);

				// extend range of the Theme UI slider
				if (view.themeItem) {
					view.themeItem.upper = view.engine.numThemes;
				}
			}

			// check if playback disabled
			if (view.viewOnly) {
				// create the error message
				notPossibleError = "not possible due to " + Keywords.viewOnlyWord;

				// autostart not possible if playback disabled
				if (view.autoStart) {
					scriptErrors[scriptErrors.length] = [Keywords.autoStartWord, notPossibleError];

					// disable autostart
					view.autoStart = false;
				}

				// startfrom not possible if playback disabled
				if (view.startFrom !== -1) {
					scriptErrors[scriptErrors.length] = [Keywords.startFromWord + " " + view.startFrom, notPossibleError];
					view.startFrom = -1;
				}

				// stop not possible if playback disabled
				if (view.stopGeneration !== -1) {
					scriptErrors[scriptErrors.length] = [Keywords.stopWord + " " + view.stopGeneration, notPossibleError];
				}


				// loop not possible if playback disabled
				if (view.loopGeneration !== -1) {
					scriptErrors[scriptErrors.length] = [Keywords.loopWord + " " + view.loopGeneration, notPossibleError];
				}
			}

			// check if x or y offset make the pattern not fit on the maximum grid
			if (view.xOffset !== 0 && (view.patternWidth + ViewConstants.maxStepSpeed + Math.abs(view.xOffset) * 2 >= view.engine.maxGridSize)) {
				scriptErrors[scriptErrors.length] = [Keywords.xOffsetWord + " " + view.xOffset, "pattern does not fit on grid at view offset"];
				view.xOffset = 0;
			}

			if (view.yOffset !== 0 && (view.patternHeight + ViewConstants.maxStepSpeed + Math.abs(view.yOffset) * 2 >= view.engine.maxGridSize)) {
				scriptErrors[scriptErrors.length] = [Keywords.yOffsetWord + " " + view.yOffset, "pattern does not fit on grid at view offset"];
				view.yOffset = 0;
			}

			// save number of script errors
			view.numScriptErrors = scriptErrors.length;
		}

		// check if window title set
		if (view.windowTitle !== "") {
			// perform any variable substitutions
			view.windowTitle = this.substituteVariables(view, view.windowTitle);
		}

		// check if autofit was enabled
		if (view.autoFit) {
			view.autoFitDefined = true;
		}

		// check if graph and graph disabled were defined
		if (view.popGraph && view.graphDisabled) {
			scriptErrors[scriptErrors.length] = [Keywords.graphWord, "not valid with " + Keywords.noGraphWord];
			view.popGraph = false;
		}

		// check if width was specified
		var lower = 0;
		var sizeError = false;
		if (view.requestedWidth !== -1) {
			// handle legacy minimum widths
			lower = ViewConstants.minViewerWidth;
			if (view.requestedWidth >= ViewConstants.minLegacyWidth && view.requestedWidth < lower) {
				view.requestedWidth = lower;
			}

			// check for NOGUI
			if (view.noGUI) {
				lower = ViewConstants.minNoGUIWidth;
			}

			// validate width
			if (view.requestedWidth < lower || view.requestedWidth > view.maxCodeWidth) {
				scriptErrors[scriptErrors.length] = [Keywords.widthWord + " " + view.requestedWidth, "argument out of range"];
				sizeError = true;
			}
		}

		// check if height was specified
		if (view.requestedHeight !== -1) {
			lower = ViewConstants.minViewerHeight;
			if (view.noGUI) {
				lower = ViewConstants.minNoGUIHeight;
			}
			if (view.requestedHeight < lower || view.requestedHeight > ViewConstants.maxViewerHeight) {
				scriptErrors[scriptErrors.length] = [Keywords.heightWord + " " + view.requestedHeight, "argument out of range"];
				sizeError = true;
			}
		}

		// check if popup width and/or height were specified
		if (view.isInPopup) {
			if (view.requestedPopupWidth !== -1) {
				// handle legacy minimum widths
				if (view.requestedPopupWidth >= ViewConstants.minLegacyWidth && view.requestedPopupWidth < ViewConstants.minViewerWidth) {
					view.requestedPopupWidth = ViewConstants.minViewerWidth;
				}
				if (view.requestedPopupWidth < ViewConstants.minViewerWidth || view.requestedPopupWidth > view.maxCodeWidth) {
					scriptErrors[scriptErrors.length] = [Keywords.popupWidthWord + " " + view.requestedPopupWidth, "argument out of range"];
					view.requestedPopupWidth = -1;
					sizeError = true;
				}
			}

			if (view.requestedPopupHeight !== -1) {
				if (view.requestedPopupHeight < ViewConstants.minViewerHeight || view.requestedPopupHeight > ViewConstants.maxViewerHeight) {
					scriptErrors[scriptErrors.length] = [Keywords.popupHeightWord + " " + view.requestedPopupHeight, "argument out of range"];
					view.requestedPopupHeight = -1;
					sizeError = true;
				}
			}
		}

		// check if there was a size error
		if (sizeError || scriptErrors.length) {
			// enable GUI and reset window size so errors can be seen
			if (view.requestedWidth !== -1 && (view.requestedWidth < ViewConstants.minViewerWidth)) {
				view.requestedWidth = ViewConstants.minViewerWidth;
			}
			if (view.requestedHeight !== -1 && (view.requestedHeight < ViewConstants.minMenuHeight)) {
				view.requestedHeight = ViewConstants.minMenuHeight;
			}
			view.noGUI = false;
		}

		// enable or disable menu based on NOGUI
		view.viewMenu.deleted = view.noGUI;
		view.menuManager.noGUI = view.noGUI;
		view.menuManager.noCopy = view.noCopy;

		// silently disable AUTOSTART, GRAPH, THUMB, THUMBLAUNCH, SHOWTIMING, SHOWGENSTATS, SHOWINFOBAR and HIDEGUI if NOGUI specified
		if (view.noGUI) {
			view.autoStart = false;
			view.thumbnail = false;
			view.thumbLaunch = false;
			view.popGraph = false;
			view.viewFpsToggle([false], true, view);
			view.viewTimingDetailToggle([false], true, view);
			view.viewStats([false], true, view);
			view.infoBarEnabled = false;
			view.hideGUI = false;
		}

		// hide source if requested
		if (view.noSource) {
			// hide the text box
			view.element.style = "display:none";

			// hide the select all box if on the wiki
			if (view.element.parentNode) {
				if (view.element.parentNode.parentNode) {
					if (view.element.parentNode.parentNode.className === DocConfig.divCodeClassName) {
						view.element.parentNode.parentNode.style = "display:none;";
					}
				}
			}
		}

		// check whether to add labels as POIs
		if (addLabelsAsPOIs) {
			view.createPOIsFromLabels();
		}

		// sort annotations into zoom order
		view.waypointManager.sortAnnotations();
	};

	/*jshint -W069 */
	window["ScriptParser"] = ScriptParser;
}
());

