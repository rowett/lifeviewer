// LifeViewer Keyboard Handling
// Handles all of the keyboard shortcuts.

/*
This file is part of LifeViewer
 Copyright (C) 2015-2024 Chris Rowett

 LifeViewer is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

	// key processor
	var KeyProcessor = {};

	// process keys in go to generation mode
	/** @returns {boolean} */
	KeyProcessor.processKeyOverview = function(/** @type {View} */ me, /** @type {number} */ keyCode, /** @type {KeyboardEvent} */ event) {
		// flag event processed
		var	/** @type {boolean} */ processed = true,
			/** @type {boolean} */ ctrlKey = event.ctrlKey,
			/** @type {boolean} */ altKey = event.altKey,
			/** @type {boolean} */ metaKey = event.metaKey;

		// check for control, meta or alt
		if (ctrlKey || metaKey || altKey) {
			// clear key code so it is not handled here
			keyCode = -1;
		}

		// determine if the key can be processed
		switch (keyCode) {
		// t for timing display
		case 84:
			// toggle fps
			me.viewFpsToggle([!me.menuManager.showTiming], true, me);
			break;

		// Esc to close Overview and return to current pattern
		case 27:
			Controller.overview = false;
			me.menuManager.activeMenu(me.viewMenu);
			break;

		// ignore other keys
		default:
			// flag not handled
			processed = false;
			break;
		}

		// return whether key processed
		return processed;
	};

	// process keys in go to generation mode
	/** @returns {boolean} */
	KeyProcessor.processKeyGoTo = function(/** @type {View} */ me, /** @type {number} */ keyCode, /** @type {KeyboardEvent} */ event) {
		// flag event processed
		var	/** @type {boolean} */ processed = true,
			/** @type {boolean} */ ctrlKey = event.ctrlKey,
			/** @type {boolean} */ altKey = event.altKey,
			/** @type {boolean} */ metaKey = event.metaKey;

		// check for control, meta or alt
		if (ctrlKey || metaKey || altKey) {
			// clear key code so it is not handled here
			keyCode = -1;
		}

		// determine if the key can be processed
		switch (keyCode) {
		// t for timing display
		case 84:
			// toggle fps
			me.viewFpsToggle([!me.menuManager.showTiming], true, me);
			break;

		// Esc to cancel
		case 27:
			me.stopStartFrom(me, true, false);
			break;

		// ignore other keys
		default:
			// flag not handled
			processed = false;
			break;
		}

		// return whether key processed
		return processed;
	};

	// process keys in identify mode
	/** @returns {boolean} */
	KeyProcessor.processKeyIdentify = function(/** @type {View} */ me, /** @type {number} */ keyCode, /** @type {KeyboardEvent} */ event) {
		// flag event processed
		var	/** @type {boolean} */ processed = true,
			/** @type {boolean} */ ctrlKey = event.ctrlKey,
			/** @type {boolean} */ metaKey = event.metaKey,
			/** @type {boolean} */ altKey = event.altKey;

		// check for control, meta or alt
		if (ctrlKey || metaKey || altKey) {
			// clear key code so it is not handled here
			keyCode = -1;
		}

		// determine if the key can be processed
		switch (keyCode) {
		// t for timing display
		case 84:
			// toggle fps
			me.viewFpsToggle([!me.menuManager.showTiming], true, me);
			break;

		// Esc or f6 to cancel Identify
		case 27:
		case 117:
			me.identifyPressed(me);
			break;

		// ignore other keys
		default:
			// flag not handled
			processed = false;
			break;
		}

		// return whether key processed
		return processed;
	};

	// switch between Help welcome screen and specific topic
	KeyProcessor.toggleHelpTopic = function(/** @type {View} */ me, /** @type {number} */ topic) {
		if (me.helpTopic === ViewConstants.welcomeTopic) {
			me.setHelpTopic(topic, me);
		} else {
			if (me.helpTopic === topic) {
				me.setHelpTopic(ViewConstants.welcomeTopic, me);
			}
		}
	};

	// process keys in history mode
	/** @returns {boolean} */
	KeyProcessor.processKeyHistory = function(/** @type {View} */ me, /** @type {number} */ keyCode, /** @type {KeyboardEvent} */ event) {
		// flag event processed
		var	/** @type {boolean} */ processed = true,
			/** @type {boolean} */ ctrlKey = event.ctrlKey,
			/** @type {boolean} */ metaKey = event.metaKey,
			/** @type {boolean} */ altKey = event.altKey;

		// check for control, meta or alt
		if (ctrlKey || metaKey || altKey) {
			// clear key code so it is not handled here
			keyCode = -1;
		}

		// determine if the key can be processed
		switch (keyCode) {
		// t for timing display
		case 84:
			// toggle fps
			me.viewFpsToggle([!me.menuManager.showTiming], true, me);
			break;

		// ignore other keys
		default:
			// flag not handled
			processed = false;
			break;
		}

		// return whether key processed
		return processed;
	};

	// process key
	/** @returns {boolean} */
	KeyProcessor.processKey = function(/** @type {View} */ me, /** @type {number} */ keyCode, /** @type {KeyboardEvent} */ event) {
		// flag event processed
		var	/** @type {boolean} */ processed = true,
			/** @type {boolean} */ shiftKey = event.shiftKey,
			/** @type {boolean} */ ctrlKey = event.ctrlKey,
			/** @type {boolean} */ metaKey = event.metaKey,
			/** @type {boolean} */ altKey = event.altKey,

			// value for changes
			/** @type {number} */ value = 0;

		// combine meta and control key so it works on Mac
		if (metaKey) {
			ctrlKey = true;
		}

		// check if gui enabled
		if (me.noGUI) {
			// gui disabled so check if NOGUI was defined
			if (!me.noGUIDefined) {
				// user disabled the GUI so check for toggle key shift and 'u'
				if (keyCode === 85 && shiftKey) {
					me.noGUI = !me.noGUI;
					me.viewMenu.deleted = me.noGUI;
					me.menuManager.noGUI = me.noGUI;
				}
			}
		} else {
			// convert control-arrow keys into PageUp/PageDown/Home/End
			if (ctrlKey && !altKey && (keyCode >= 37 && keyCode <= 40)) {
				if (keyCode === 37) {
					keyCode = 33;
				} else if (keyCode === 38)  {
					keyCode = 36;
				} else if (keyCode === 39)  {
					keyCode = 34;
				} else if (keyCode === 40)  {
					keyCode = 35;
				}
			}

			// check for alt-number
			if (altKey && !ctrlKey) {
				if (keyCode >= 48 && keyCode <= 57) {
					value = keyCode - 48;
					// if selecting or no POIs then choose clipboard
					if (me.selecting || me.waypointManager.numPOIs() === 0) {
						// if clipboard already selected then paste
						if (me.currentPasteBuffer === value) {
							if (me.isPasting) {
								me.pasteSelection(me, value);
							} else {
								me.pastePressed(me);
							}
						} else {
							// switch to required buffer
							me.clipboardList.current = me.viewClipboardList(value, true, me);
						}
					} else {
						// POIs only use 1 to 9
						value -= 1;
						if (value >= 0 && value < me.waypointManager.numPOIs()) {
							me.currentPOI = value;

							// set camera
							me.setCameraFromPOI(me, me.currentPOI);
						}
					}
				} else {
					switch (keyCode) {
					// left for nudge left
					case 37:
						me.pasteOffset(me, -1, 0);
						break;
					// up for nudge up
					case 38:
						me.pasteOffset(me, 0, -1);
						break;
					// right for nudge right
					case 39:
						me.pasteOffset(me, 1, 0);
						break;
					// down for nudge down
					case 40:
						me.pasteOffset(me, 0, 1);
						break;
					// Alt-Del for clear marked [R]History cells
					case 46:
						if (me.engine.isLifeHistory || me.engine.isSuper) {
							me.clearCells(me, true, true);
							if (me.engine.isLifeHistory) {
								me.menuManager.notification.notify("Cleared [R]History marked cells", 15, 120, 15, true);
							} else {
								me.menuManager.notification.notify("Cleared [R]Super marked cells", 15, 120, 15, true);
							}
						}
						break;

					// a for auto-shrink
					case 65:
						// toggle auto-shrink selection
						me.autoShrinkToggle.current = me.viewAutoShrinkList([!me.autoShrink], true, me);
						me.menuManager.notification.notify("Auto-Shrink Selection " + (me.autoShrink ? "On" : "Off"), 15, 40, 15, true);
						break;

					// b for cell borders
					case 66:
						// toggle cell borders
						me.bordersButton.current = me.viewBordersToggle([!me.engine.cellBorders], true, me);
						me.menuManager.notification.notify("Cell Borders " + (me.engine.cellBorders ? "On" : "Off"), 15, 40, 15, true);
						break;

					// c for default theme
					case 67:
						// set default theme
						if (!me.multiStateView) {
							if (me.themeButton && !me.themeButton.locked) {
								me.setNewTheme(me.defaultTheme, me.engine.colourChangeSteps, me);
								if (!me.engine.isNone && !me.showThemeSelection) {
									me.menuManager.notification.notify(me.themeName(me.engine.colourTheme) + " Theme", 15, 40, 15, true);
								}
							}
						}
						break;

					// d for toggle alternating grid
					case 68:
						if (me.engine.isMargolus && me.engine.gridLineMajor === 2) {
							me.altGridButton.current = me.viewAltGridToggle([!me.engine.altGrid], true, me);
							me.menuManager.notification.notify("Alternating Gridlines " + (me.engine.altGrid ? "On" : "Off"), 15, 40, 15, true);
						}
						break;

					// g for convert to [R]Super
					case 71:
						if (me.engine.isLifeHistory || me.engine.multiNumStates === -1) {
							me.convertToSuper(me);
						} else {
							if (me.engine.isSuper) {
								me.menuManager.notification.notify("Rule is already [R]Super", 15, 120, 15, true);
							} else {
								me.menuManager.notification.notify("Unsupported rule for [R]Super", 15, 120, 15, true);
							}
						}
						break;

					// h for convert to [R]History
					case 72:
						if ((me.engine.multiNumStates === -1 && !me.engine.isLifeHistory) || me.engine.isSuper) {
							me.convertToHistory(me);
						} else {
							if (me.engine.isLifeHistory) {
								me.menuManager.notification.notify("Rule is already [R]History", 15, 120, 15, true);
							} else {
								me.menuManager.notification.notify("Unsupported rule for [R]History", 15, 120, 15, true);
							}
						}
						break;

					// i for toggle icons
					case 73:
						// toggle icons
						if (!me.iconToggle.locked) {
							me.iconToggle.current = me.viewIconList([!me.useIcons], true, me);
							me.menuManager.notification.notify("Icons " + (me.useIcons ? "On" : "Off"), 15, 40, 15, true);
						}
						break;

					// j for convert to [R]Standard
					case 74:
						if (me.engine.isLifeHistory || me.engine.isSuper) {
							me.convertToStandard(me);
						} else {
							if (me.engine.multiNumStates === -1) {
								me.menuManager.notification.notify("Rule is already [R]Standard", 15, 120, 15, true);
							} else {
								me.menuManager.notification.notify("Unsupported rule for [R]Standard", 15, 120, 15, true);
							}
						}
						break;

					// k for replace selected cell state with drawing state
					case 75:
						me.changeCellStatePressed(me);
						break;

					// l for toggle annotations
					case 76:
						// toggle annotations
						if (me.waypointManager.numAnnotations() > 0) {
							me.labelButton.current = me.viewLabelToggle([!me.showLabels], true, me);
							me.menuManager.notification.notify("Annotations " + (me.showLabels ? "On" : "Off"), 15, 40, 15, true);
						}
						break;

					// m for copy as MAP
					case 77:
						// copy rule definition as MAP
						if (!me.copyAsMAPButton.locked) {
							me.copyAsMAPPressed(me);
						}
						break;

					// n for new pattern
					case 78:
						// new pattern
						me.newPattern(me);
						break;

					// o for toggle autostart
					case 79:
						// toggle autostart
						if (me.autoStart) {
							me.autoStartDisabled = !me.autoStartDisabled;
							me.autostartIndicator.current = [me.autoStartDisabled];
							me.menuManager.notification.notify("AutoStart " + (me.autoStartDisabled ? "Off" : "On"), 15, 40, 15, true);
						}
						break;

					// p for toggle stop
					case 80:
						// toggle stop
						if (me.stopGeneration !== -1) {
							me.stopDisabled = !me.stopDisabled;
							me.stopIndicator.current = [me.stopDisabled];
							me.menuManager.notification.notify("Stop " + (me.stopDisabled ? "Off" : "On"), 15, 40, 15, true);
						}
						break;

					// r for change rule
					case 82:
						// change rule
						me.changeRule(me);
						break;

					// s for toggle sync
					case 83:
						// toggle external clipboard sync
						me.copySyncToggle.current = me.viewCopySyncList([!me.copySyncExternal], true, me);
						me.menuManager.notification.notify("Sync Clipboard " + (me.copySyncExternal ? "On" : "Off"), 15, 40, 15, true);
						break;

					// t for toggle throttling
					case 84:
						me.throttleToggle.current = me.toggleThrottle([!me.canBailOut], true, me);
						me.menuManager.notification.notify("Throttling " + (me.canBailOut ? "On" : "Off"), 15, 40, 15, true);
						break;

					// u for autohide UI on playback
					case 85:
						me.autoHideButton.current = me.viewAutoHideToggle([!me.hideGUI], true, me);
						me.menuManager.notification.notify("AutoHide UI " + (me.hideGUI ? "On" : "Off"), 15, 80, 15, true);
						break;

					// w for toggle rainbow display
					case 87:
						// toggle rainbow mode
						if (!(me.engine.multiNumStates > 2 || me.engine.isHROT || me.engine.isPCA || me.engine.isLifeHistory || me.engine.isSuper || me.engine.isExtended || me.engine.isRuleTree)) {
							me.rainbowButton.current = me.viewRainbowToggle([!me.engine.rainbow], true, me);
						}
						break;

					// x for flip X
					case 88:
						// flip selection horizontally
						me.flipXPressed(me);
						break;

					// y for flip Y
					case 89:
						// flip selection vertically
						me.flipYPressed(me);
						break;

					// z for randomize
					case 90:
						// randomize rule and pattern
						if (!me.randomizeButton.locked) {
							me.randomPattern(me, false);
						}
						break;

					// , for rotate anticlockwise
					case 188:
						// get the current value
						value = me.angleItem.current[0];

						// decrease by an eighth
						value -= 45;

						// wrap if required
						if (value < 0) {
							value += 360;
						}

						// update UI
						me.angleItem.current = me.viewAngleRange([value, value], true, me);
						break;

					// . for rotate clockwise
					case 190:
						// get the current value
						value = me.angleItem.current[0];

						// increase by an eighth
						value += 45;

						// wrap if required
						if (value >= 360) {
							value -= 360;
						}

						// update UI
						me.angleItem.current = me.viewAngleRange([value, value], true, me);
						break;

					// '/' for snap angle to nearest 45 degrees
					case 191:
						// get the current value
						me.snapToNearest45Pressed(me);
						break;
					}
				}

				// clear keyCode so it is not handled here
				keyCode = -2;
			}

			// determine if the key can be processed
			switch (keyCode) {
			// '/' for tilt down
			case 191:
				if (shiftKey) {
					// switch between hexagonal and square cells for hex display
					if (me.engine.isHex) {
						me.hexCellButton.current = me.viewHexCellToggle([!me.engine.forceRectangles], true, me);
						me.menuManager.notification.notify("Hexagonal display uses " + (me.engine.forceRectangles ? "Rectangles" : "Hexagons"), 15, 120, 15, true);
					} else {
						// switch between triangular and square cells for triangulr display
						if (me.engine.isTriangular) {
							me.hexCellButton.current = me.viewHexCellToggle([!me.engine.forceRectangles], true, me);
							me.menuManager.notification.notify("Triangular display uses " + (me.engine.forceRectangles ? "Rectangles" : "Triangles"), 15, 120, 15, true);
						}
					}
				} else {
					if (!me.tiltItem.locked) {
						// get the current value
						value = me.tiltItem.current[0];

						// skip dead zone
						if (value > 0.47 && value < 0.53) {
							value = 0.46;
						} else {
							// decrease tilt
							value -= 0.02;
							if (value < 0) {
								value = 0;
							}
						}

						// update UI
						me.tiltItem.current = me.viewTiltRange([value, value], true, me);
					}
				}
				break;

			// single quote for tilt up
			case 192:
				if (shiftKey) {
					// reset tilt
					if (!me.tiltItem.locked) {
						me.tiltItem.current = me.viewTiltRange([0.5, 0], true, me);
					}
				} else {
					if (!me.tiltItem.locked) {
						// get the current value
						value = me.tiltItem.current[0];

						// skip dead zone
						if (value > 0.47 && value < 0.53) {
							value = 0.54;
						} else {
							// decrease tilt
							value += 0.02;
							if (value > 1) {
								value = 1;
							}
						}

						// update UI
						me.tiltItem.current = me.viewTiltRange([value, value], true, me);
					}
				}
				break;

			// backspace for back one step
			case 8:
				// check for help menu
				if (me.displayHelp !== 0) {
					if (me.helpTopic !== ViewConstants.welcomeTopic) {
						me.setHelpTopic(ViewConstants.welcomeTopic, me);
					} else {
						me.displayHelp = 0;

						// update the help UI
						me.helpToggle.current = me.toggleHelp([me.displayHelp !== 0], true, me);
						me.menuManager.toggleRequired = true;
					}
				} else {
					// check for settings menu
					if (me.navToggle.current[0]) {
						me.backPressed(me);
						me.menuManager.toggleRequired = true;
					} else {
						// do not move if in view only mode
						if (!me.viewOnly) {
							// check control is not locked
							if (!me.playList.itemLocked[1]) {
								value = me.gensPerStep;
								me.gensPerStep = 1;
								me.playList.current = me.viewPlayList(ViewConstants.modeStepBack, true, me);
								me.gensPerStep = value;
							}
						}
					}
				}
				break;

			// b for back one step
			case 66:
				// check for ctrl
				if (ctrlKey) {
					// copy neighbourhood to clipboard from selection
					me.copyNeighbourhood(me);
				} else {
					// check for shift
					if (shiftKey) {
						me.libraryToggle.current = [!me.libraryToggle.current[0]];
						me.menuManager.toggleRequired = true;
					} else {
						// do not move if in view only mode
						if (!me.viewOnly) {
							// check control is not locked
							if (!me.playList.itemLocked[1]) {
								value = me.gensPerStep;
								me.gensPerStep = 1;
								me.playList.current = me.viewPlayList(ViewConstants.modeStepBack, true, me);
								me.gensPerStep = value;
							}
						}
					}
				}
				break;

			// return for play/pause
			case 13:
				if (me.isPasting) {
					me.pasteFromEnter(me);
				} else {
					// do not play if view only mode
					if (!me.viewOnly) {
						// check if not playing
						if (me.playList.current === ViewConstants.modePlay) {
							// switch to pause
							me.playList.current = me.viewPlayList(ViewConstants.modePlay, true, me);
						} else {
							// check for drawing and mouse down
							if (!(me.drawing && me.menuManager.mouseDown)) {
								// switch to play
								me.playList.current = me.viewPlayList(ViewConstants.modePlay, true, me);
							}
						}
					}
				}
				break;

			// tab for pause/next step
			case 9:
				// do not pause if view only mode
				if (!me.viewOnly) {
					// check if playing
					if (me.generationOn) {
						// pause
						me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
					} else {
						// check for shift key
						if (shiftKey) {
							// check for reversible Margolus or PCA patterns
							if ((me.engine.isMargolus || me.engine.isPCA) && me.engine.margolusReverseLookup1 !== null) {
								me.playList.current = me.viewPlayList(ViewConstants.modeStepBack, true, me);
							} else {
								// step back if not at start
								if (me.engine.counter > 0) {
									// run from start to previous step
									me.runTo(me.engine.counter - me.gensPerStep);

									// adjust undo stack pointer
									me.setUndoGen(me.engine.counter - me.gensPerStep + 1);
								}
							}
						} else {
							// step forward
							me.nextStep = true;
							me.afterEdit("");
						}
					}
				}
				break;

			// space for pause/next generation
			case 32:
				// do not pause if view only mode
				if (!me.viewOnly) {
					// check if playing
					if (me.generationOn) {
						// pause
						me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
					} else {
						// check for ctrl
						if (ctrlKey || shiftKey) {
							me.evolvePressed(me, shiftKey);
						} else {
							// next generation
							me.nextStep = true;
							me.singleStep = true;
							me.afterEdit("");
						}
					}
				}
				break;

			// w for toggle waypoint/track/loop mode
			case 87:
				if (shiftKey) {
					me.showLagToggle.current = me.toggleShowLag([!me.perfWarning], true, me);
					me.menuManager.notification.notify("Performance Warning " + (me.perfWarning ? "On" : "Off"), 15, 40, 15, true);
				} else {
					if (me.trackDefined) {
						me.waypointsIndicator.current = me.toggleWP([me.trackDisabled], true, me);
						if (me.loopGeneration !== -1) {
							me.menuManager.notification.notify("Track and Loop " + (me.trackDisabled ? "Off" : "On"), 15, 40, 15, true);
						} else {
							me.menuManager.notification.notify("Track " + (me.trackDisabled ? "Off" : "On"), 15, 40, 15, true);

						}
					} else {
						if (me.waypointsDefined) {
							me.waypointsIndicator.current = me.toggleWP([me.waypointsDisabled], true, me);
							if (me.loopGeneration !== -1) {
								me.menuManager.notification.notify("Waypoints and Loop " + (me.waypointsDisabled ? "Off" : "On"), 15, 40, 15, true);
							} else {
								me.menuManager.notification.notify("Waypoints " + (me.waypointsDisabled ? "Off" : "On"), 15, 40, 15, true);
							}
						}
					}
				}
				break;

			// d for show cell period map or toggle states display
			case 68:
				// check for ctrl
				if (ctrlKey) {
					// toggle states display
					me.statesToggle.current = me.toggleStates([!me.showStates], true, me);
					me.menuManager.notification.notify("States Display " + (me.showStates ? "On" : "Off"), 15, 80, 15, true);
				} else {
					// check for shift
					if (shiftKey) {
						me.downloadCellPeriodMap(me);
					} else {
						// show cell period map
						if (me.lastIdentifyType === "Oscillator" && me.engine.cellPeriod !== null) {
							if (me.periodMapDisplayed === 2) {
								me.identifyStrictToggle.current = me.toggleCellPeriodMap(0, true, me);
							} else {
								me.identifyStrictToggle.current = me.toggleCellPeriodMap(2, true, me);
							}
						}
					}
				}
				break;

			// e for show cell period table
			case 69:
				// show cell period table
				if (me.lastIdentifyType === "Oscillator" && me.engine.cellPeriod !== null) {
					if (me.periodMapDisplayed === 1) {
						me.identifyStrictToggle.current = me.toggleCellPeriodMap(0, true, me);
					} else {
						me.identifyStrictToggle.current = me.toggleCellPeriodMap(1, true, me);
					}
				}
				break;

			// z for stop other viewers
			case 90:
				// check for control
				if (ctrlKey) {
					if (altKey) {
						if (!me.randomizePatternButton.locked) {
							me.randomPattern(me, true);
						}
					}
					// check for shift
					if (shiftKey) {
						// redo edit
						me.redo(me);
					} else {
						// undo edit
						if (!me.undoButton.locked) {
							me.undo(me);
						}
					}
				} else {
					// check for shift
					if (shiftKey) {
						// stop all viewers
						value = Controller.stopAllViewers();
						if (value === 0) {
							me.menuManager.notification.notify("No LifeViewers playing", 15, 100, 15, true);
						} else {
							if (value > 1) {
								me.menuManager.notification.notify("Paused all LifeViewers", 15, 100, 15, true);
							}
						}
					} else {
						// stop other viewers
						value = Controller.stopOtherViewers(me);
						if (value > 0) {
							if (value > 1) {
								me.menuManager.notification.notify("Paused " + value + " other LifeViewers", 15, 100, 15, true);
							} else {
								me.menuManager.notification.notify("Paused " + value + " other LifeViewer", 15, 100, 15, true);
							}
						}
					}
				}
				break;

			// x for toggle grid lines
			case 88:
				if (ctrlKey) {
					me.processCut(me, shiftKey, altKey);
				} else {
					// check for shift
					if (shiftKey) {
						// toggle major grid lines
						if (!me.majorButton.locked) {
							me.majorButton.current = me.viewMajorToggle([!me.engine.gridLineMajorEnabled], true, me);
							if (me.engine.gridLineMajor > 0) {
								me.menuManager.notification.notify("Major Grid Lines " + (me.engine.gridLineMajorEnabled ? "On" : "Off"), 15, 40, 15, true);
								me.clearHelpCache();
							}
						}
					} else {
						// toggle grid
						me.engine.displayGrid = !me.engine.displayGrid;
						me.gridToggle.current = me.toggleGrid([me.engine.displayGrid], true, me);
						me.menuManager.notification.notify("Grid Lines " + (me.engine.displayGrid ? "On" : "Off"), 15, 40, 15, true);
					}
				}
				break;

			// y for toggle graph
			case 89:
				// check for Help
				if (me.displayHelp !== 0) {
					this.toggleHelpTopic(me, ViewConstants.memoryTopic);
				} else {
					if (ctrlKey) {
						me.redo(me);
					} else {
						// check if graph disabled
						if (me.graphDisabled) {
							me.menuManager.notification.notify("Graph Disabled", 15, 40, 15, true);
						} else {
							// check for shift
							if (shiftKey) {
								// toggle lines
								me.popGraphLines = !me.popGraphLines;
								me.linesToggle.current = me.toggleLines([me.popGraphLines], true, me);
								me.menuManager.notification.notify("Graph " + (me.popGraphLines ? "Lines" : "Points"), 15, 40, 15, true);
							} else {
								// toggle population graph
								me.popGraph = !me.popGraph;
								me.graphButton.current = me.viewGraphToggle([me.popGraph], true, me);
								me.menuManager.notification.notify("Population Graph " + (me.popGraph ? "On" : "Off"), 15, 40, 15, true);
							}
						}
					}
				}
				break;

			// k for copy position to clipboard
			case 75:
				// check for Help
				if (me.displayHelp !== 0) {
					this.toggleHelpTopic(me, ViewConstants.keysTopic);
				} else {
					// check for ctrl
					if (ctrlKey) {
						if (altKey) {
							me.clearCells(me, false, false);
							value = me.drawState;
							if (me.engine.multiNumStates > 2 && !(me.engine.isNone || me.engine.isPCA || me.engine.isRuleTree || me.engine.isSuper || me.engine.isExtended) && value > 0) {
								value = me.engine.multiNumStates - value;
							}
							if (me.engine.isRuleTree) {
								me.menuManager.notification.notify("Cleared state " + value + " cells", 15, 120, 15, true);
							} else {
								me.menuManager.notification.notify("Cleared " + me.getStateName(value) + " cells", 15, 120, 15, true);
							}
						} else {
							// remove selection
							me.removeSelection(me);
						}
					} else {
						// check for shift
						if (shiftKey) {
							// copy view
							me.copyPosition(me, true);
							me.menuManager.notification.notify("Copied view to clipboard", 15, 180, 15, true);
						} else {
							// copy position
							me.copyPosition(me, false);
							me.menuManager.notification.notify("Copied position to clipboard", 15, 180, 15, true);
						}
					}
				}
				break;

			// p for increase depth or toggle loop
			case 80:
				// check for ctrl
				if (ctrlKey) {
					// toggle pause playback while drawing
					me.pausePlaybackToggle.current = me.togglePausePlayback([!me.pauseWhileDrawing], true, me);
					me.menuManager.notification.notify("Pause while drawing " + (me.pauseWhileDrawing ? "On" : "Off"), 15, 80, 15, true);
				} else {
					// check for shift
					if (shiftKey) {
						if (me.loopGeneration !== -1) {
							// toggle loop mode
							me.loopDisabled = !me.loopDisabled;
							me.loopIndicator.current = [me.loopDisabled];
							me.menuManager.notification.notify("Loop " + (me.loopDisabled ? "Off" : "On"), 15, 40, 15, true);
						}
					} else {
						// disable depth in multi-state mode
						if (!me.multiStateView) {
							if (!me.depthItem.locked) {
								if (me.depthItem.current[0] <= 0.99) {
									me.depthItem.current = me.viewDepthRange([me.depthItem.current[0] + 0.01, me.depthItem.current[1]], true, me);
								} else {
									me.depthItem.current = me.viewDepthRange([1, me.depthItem.current[1]], true, me);
								}
							}
						}
					}
				}
				break;

			// l for decrease depth or cycle paste location
			case 76:
				// check for ctrl
				if (ctrlKey) {
					// toggle kill gliders
					if (!me.killButton.locked) {
						me.engine.clearGliders = !me.engine.clearGliders;
						me.menuManager.notification.notify("Kill Gliders " + (me.engine.clearGliders ? "On" : "Off"), 15, 40, 15, true);
					}
				} else {
					// check for shift
					if (shiftKey) {
						me.cyclePasteLocation(me);
					} else {
						// disable depth in multi-state mode
						if (!me.multiStateView) {
							if (!me.depthItem.locked) {
								if (me.depthItem.current[0] >= 0.01) {
									me.depthItem.current = me.viewDepthRange([me.depthItem.current[0] - 0.01, me.depthItem.current[1]], true, me);
								} else {
									me.depthItem.current = me.viewDepthRange([0, me.depthItem.current[1]], true, me);
								}
							}
						}
					}
				}
				break;

			// q for increase layers
			case 81:
				// check for ctrl
				if (ctrlKey) {
					me.qualityToggle.current = me.viewQualityToggle([!me.engine.pretty], true, me);
					me.menuManager.notification.notify((me.engine.pretty ? "High" : "Standard") + " Quality Rendering", 15, 80, 15, true);
				} else {
					// disable layers in multi-state mode
					if (!me.multiStateView) {
						if (!me.layersItem.locked) {
							if (me.layersItem.current[0] < ViewConstants.maxLayers) {
								me.layersItem.current = me.viewLayersRange([me.engine.layers + 1, me.layersItem.current[1]], true, me);
							}
						}
					}
				}
				break;

			// a for decrease layers
			case 65:
				// check for Help
				if (me.displayHelp !== 0) {
					this.toggleHelpTopic(me, ViewConstants.aliasesTopic);
				} else {
					if (shiftKey) {
						if (me.isSelection) {
							me.autoShrinkSelection(me);
						}
					} else {
						// check for ctrl key
						if (ctrlKey) {
							if (!me.modeList.itemLocked[ViewConstants.modeSelect]) {
								me.selectAllPressed(me);
							}
						} else {
							// disable layers in multi-state mode
							if (!me.multiStateView) {
								if (!me.layersItem.locked) {
									if (me.layersItem.current[0] > ViewConstants.minLayers) {
										me.layersItem.current = me.viewLayersRange([me.engine.layers - 1, me.layersItem.current[1]], true, me);
									}
								}
							}
						}
					}
				}
				break;

			// r for reset
			case 82:
				// check for shift key
				if (shiftKey) {
					Controller.resetAllViewers();
				} else {
					// reset this viewer
					me.playList.current = me.viewPlayList(ViewConstants.modeReset, true, me);
				}
				break;

			// s for toggle starfield, shift s for toggle state1 autofit, control-s for save
			case 83:
				// check for Help
				if (me.displayHelp !== 0) {
					this.toggleHelpTopic(me, ViewConstants.scriptsTopic);
				} else {
					// check for ctrl key
					if (ctrlKey) {
						// save current pattern to source document node
						if (!me.saveButton.locked) {
							me.savePressed(me);
						}
					} else {
						// check for shift key
						if (shiftKey) {
							// only enabled for [R]History
							if (me.engine.isLifeHistory) {
								// toggle state 1 fit mode
								me.state1Fit = !me.state1Fit;
								me.menuManager.notification.notify("AutoFit State 1 Mode " + (me.state1Fit ? "On" : "Off"), 15, 40, 15, true);
							}
						} else {
							// toggle stars
							me.starsButton.current = me.viewStarsToggle([!me.starsOn], true, me);
							me.menuManager.notification.notify("Stars " + (me.starsOn ? "On" : "Off"), 15, 40, 15, true);
						}
					}
				}
				break;

			// n for switch to thumbnail view
			case 78:
				// check for Help
				if (me.displayHelp !== 0) {
					if (me.waypointManager.numAnnotations() > 0) {
						this.toggleHelpTopic(me, ViewConstants.annotationsTopic);
					}
				} else {
					// check for go to generation
					if (shiftKey) {
						if (!me.viewOnly) {
							me.goToGenPressed(me);
						}
					} else {
						// check if thumbnail mode available
						if (me.thumbnailEverOn) {
							// check if thumbnail mode already on
							if (me.thumbnail) {
								// switch it off
								me.switchOffThumbnail();
							} else {
								// switch it on
								me.switchOnThumbnail();

								// close help if open
								if (me.displayHelp) {
									me.displayHelp = 0;
								}
							}
						}
					}
				}
				break;

			// v for reset view
			case 86:
				if (ctrlKey) {
					if (!me.pasteButton.locked) {
						me.processPaste(me, shiftKey, false);
					}
				} else {
					// check for shift key
					if (shiftKey) {
						// save current camera position
						me.saveCamera(me);
						me.menuManager.notification.notify("Saved camera position", 15, 100, 15, true);
					} else {
						// check if controls are disabled
						if (!(me.controlsLocked || me.zoomItem.locked)) {
							// reset camera
							me.resetSavedCamera(me);
							me.menuManager.notification.notify("Restored camera position", 15, 100, 15, true);

							// flag manual change made if paused
							if (!me.generationOn) {
								me.manualChange = true;
							}
						}
					}
				}
				break;

			// ] for zoom in
			case 221: 
				// check for controls locked
				if (!(me.controlsLocked || me.zoomItem.locked)) {
					// check for shift key
					if (shiftKey) {
						// zoom in by a factor of 2
						me.adjustZoomPosition(me.zoomItem.current[0], Math.log((me.engine.zoom * me.engine.originZ) * 2 / ViewConstants.minZoom) / Math.log(ViewConstants.maxZoom / ViewConstants.minZoom) - me.zoomItem.current[0]);
					} else {
						// zoom in slowly
						me.adjustZoomPosition(me.zoomItem.current[0], 0.01);
					}
				}
				break;

			// [ for zoom out
			case 219: 
				// check for controls locked
				if (!(me.controlsLocked || me.zoomItem.locked)) {
					// check for shift key
					if (shiftKey) {
						// zoom out by a factor of 2
						me.adjustZoomPosition(me.zoomItem.current[0], Math.log((me.engine.zoom * me.engine.originZ) / 2 / ViewConstants.minZoom) / Math.log(ViewConstants.maxZoom / ViewConstants.minZoom) - me.zoomItem.current[0]);
					} else {
						// zoom out slowly
						me.adjustZoomPosition(me.zoomItem.current[0], -0.01);
					}
				}
				break;

			// 5 for reset angle
			case 53:
			case 101: // num 5
				if (ctrlKey) {
					if (shiftKey) {
						// random fill 2 state
						if (!me.engine.isPCA) {
							me.randomFill(me, true);
						}
					} else {
						me.switchToState(5);
					}
				} else {
					if (shiftKey) {
						// random fill
						me.randomFill(me, false);
					} else {
						// zero angle
						if (!me.angleItem.locked) {
							me.engine.angle = 0;
							me.angleItem.current = [me.engine.angle, me.engine.angle];
						}
					}
				}
				break;

			// 1 for 100% zoom
			case 49:
			case 97: // num 1
				if (ctrlKey) {
					me.switchToState(1);
				} else {
					if (!me.zoomItem.locked) {
						// check for shift
						if (shiftKey) {
							// set zoom to nearest integer
							me.changeZoom(me, me.engine.zoom * me.engine.originZ, true);
	
							// display notification
							me.menuManager.notification.notify("Integer Zoom", 15, 40, 15, true);
						} else {
							// change zoom to 100%
							me.changeZoom(me, 1, false);
						}
					}
				}
				break;

			// 2 for 200% zoom
			case 50:
			case 98: // num 2
				if (ctrlKey) {
					me.switchToState(2);
				} else {
					if (!me.zoomItem.locked) {
						// check for shift
						if (shiftKey) {
							// zoom to -2x
							me.changeZoom(me, 0.5, false);
						} else {
							// zoom to 200%
							me.changeZoom(me, 2, false);
						}
					}
				}
				break;

			// 3 for 3200% zoom
			case 51:
			case 99: // num 3
				if (ctrlKey) {
					me.switchToState(3);
				} else {
					if (!me.zoomItem.locked) {
						// check for shift
						if (shiftKey) {
							// zoom to -32x
							me.changeZoom(me, 0.03125, false);
						} else {
							// zoom to 3200%
							me.changeZoom(me, 32, false);
						}
					}
				}
				break;

			// 4 for 400% zoom
			case 52:
			case 100: // num 4
				if (ctrlKey) {
					me.switchToState(4);
				} else {
					if (!me.zoomItem.locked) {
						// check for shift
						if (shiftKey) {
							// zoom to -4x
							me.changeZoom(me, 0.25, false);
						} else {
							// zoom to 400%
							me.changeZoom(me, 4, false);
						}
					}
				}
				break;

			// 6 for 1600% zoom
			case 54:
			case 102: // num 6
				if (ctrlKey) {
					me.switchToState(6);
				} else {
					if (!me.zoomItem.locked) {
						// check for shift
						if (shiftKey) {
							// zoom to -16x
							me.changeZoom(me, 0.0625, false);
						} else {
							// zoom to 1600%
							me.changeZoom(me, 16, false);
						}
					}
				}
				break;

			// 7 for decrease graph opacity
			case 55:
				if (ctrlKey) {
					me.switchToState(7);
				} else {
					// check if graph disabled
					if (me.graphDisabled) {
						me.menuManager.notification.notify("Graph Disabled", 15, 40, 15, true);
					} else {
						if (me.popGraphOpacity > 0) {
							me.popGraphOpacity -= 0.05;
							if (me.popGraphOpacity < 0) {
								me.popGraphOpacity = 0;
							}
						}
						me.opacityItem.current = me.viewOpacityRange([me.popGraphOpacity, me.popGraphOpacity], false, me);
					}
				}
				break;

			// 8 for 800% zoom
			case 56:
			case 104: // num 8
				if (ctrlKey) {
					me.switchToState(8);
				} else {
					if (!me.zoomItem.locked) {
						// check for shift
						if (shiftKey) {
							// zoom to -8x
							me.changeZoom(me, 0.125, false);
						} else {
							// zoom to 800%
							me.changeZoom(me, 8, false);
						}
					}
				}
				break;

			// 9 for increase graph opacity
			case 57:
				if (ctrlKey) {
					me.switchToState(9);
				} else {
					// check if graph disabled
					if (me.graphDisabled) {
						me.menuManager.notification.notify("Graph Disabled", 15, 40, 15, true);
					} else {
						if (me.popGraphOpacity < 1) {
							me.popGraphOpacity += 0.05;
							if (me.popGraphOpacity > 1) {
								me.popGraphOpacity = 1;
							}
						}
						me.opacityItem.current = me.viewOpacityRange([me.popGraphOpacity, me.popGraphOpacity], false, me);
					}
				}
				break;

			// 0 for reset speed
			case 48:
			case 96: // num 0
				if (ctrlKey) {
					me.switchToState(0);
				} else {
					// reset playback speed
					me.speedRange.current = me.viewSpeedRange([1, 1], true, me);
				}
				break;

			// - for slower
			case 189:
			case 109: // num -
				// check for ctrl -
				if (ctrlKey && keyCode === 189) {
					// pass up to browser
					processed = false;
				} else {
					// do not change if view only mode
					if (!me.viewOnly) {
						// check for step
						if (me.gensPerStep > ViewConstants.minStepSpeed) {
							// check for shift
							if (shiftKey) {
								// go to minimum step
								me.gensPerStep = ViewConstants.minStepSpeed;
							} else {
								// decrease step
								me.gensPerStep -= 1;
								if (me.gensPerStep < ViewConstants.minStepSpeed) {
									me.gensPerStep = ViewConstants.minStepSpeed;
								}
							}
							me.speedRange.current = me.viewSpeedRange([me.speedIndex(), 1], true, me);
						} else {
							// decrease generation speed
							if (me.genSpeed > ViewConstants.minGenSpeed) {
								if (shiftKey) {
									me.genSpeed = ViewConstants.minGenSpeed;
								} else {
									me.genSpeed -= 1;
									if (me.genSpeed < ViewConstants.minGenSpeed) {
										me.genSpeed = ViewConstants.minGenSpeed;
									}
								}
							}
							me.speedRange.current = me.viewSpeedRange([me.speedIndex(), 1], true, me);
						}
					}
				}
				break;

			// ; for BW screenshot
			case 186:
				me.saveBWImagePressed(me);
				break;

			// = for faster
			case 187:
			case 107: // num +
				// check for ctrl +
				if (ctrlKey && keyCode === 187) {
					// pass up to browser
					processed = false;
				} else {
					// do not change if view only mode
					if (!me.viewOnly) {
						// increase generation speed
						if (me.genSpeed < ViewConstants.defaultRefreshRate) {
							if (shiftKey) {
								me.genSpeed = ViewConstants.defaultRefreshRate;
							} else {
								me.genSpeed += 1;
								if (me.genSpeed > ViewConstants.defaultRefreshRate) {
									me.genSpeed = ViewConstants.defaultRefreshRate;
								}
							}
						} else {
							if (me.gensPerStep < ViewConstants.maxStepSpeed) {
								if (shiftKey) {
									me.gensPerStep = ViewConstants.maxStepSpeed;
								} else {
									me.gensPerStep += 1;
									if (me.gensPerStep > ViewConstants.maxStepSpeed) {
										me.gensPerStep = ViewConstants.maxStepSpeed;
									}
								}
							}
						}
						me.speedRange.current = me.viewSpeedRange([me.speedIndex(), 1], true, me);
					}
				}
				break;

			// , for rotate anticlockwise
			case 188:
				if (shiftKey && (me.isSelection || me.isPasting)) {
					me.rotateCCWPressed(me);
				} else {
					if (!me.angleItem.locked) {
						// get the current value
						value = me.angleItem.current[0];

						// check for shift key
						if (shiftKey) {
							// decrease by a quarter
							value -= 90;
						} else {
							// decrease by a degree
							value -= 1;
						}

						// wrap if required
						if (value < 0) {
							value += 360;
						}

						// update UI
						me.angleItem.current = me.viewAngleRange([value, value], true, me);
					}
				}
				break;

			// . for rotate clockwise
			case 190:
				if (shiftKey && (me.isSelection || me.isPasting)) {
					me.rotateCWPressed(me);
				} else {
					if (!me.angleItem.locked) {
						// get the current value
						value = me.angleItem.current[0];

						// check for shift key
						if (shiftKey) {
							// increase by a quarter
							value += 90;
						} else {
							// increase by a degree
							value += 1;
						}

						// wrap if required
						if (value >= 360) {
							value -= 360;
						}

						// update UI
						me.angleItem.current = me.viewAngleRange([value, value], true, me);
					}
				}
				break;

			// Del to clear cells or selection
			case 46:
				if (me.isSelection) {
					if (shiftKey) {
						me.clearOutside(me);
					} else {
						me.doClearSelection(me, ctrlKey);
						if (ctrlKey && (me.engine.isLifeHistory || me.engine.isSuper)) {
							if (me.engine.isLifeHistory) {
								me.menuManager.notification.notify("Cleared [R]History cells", 15, 120, 15, true);
							} else {
								me.menuManager.notification.notify("Cleared [R]Super cells", 15, 120, 15, true);
							}
						}
					}
				} else {
					if (ctrlKey) {
						value = me.clearCells(me, ctrlKey, false);
						if (value) {
							if (me.engine.isLifeHistory) {
								me.menuManager.notification.notify("Cleared [R]History cells", 15, 120, 15, true);
							} else {
								me.menuManager.notification.notify("Cleared [R]Super cells", 15, 120, 15, true);
							}
						}
					}
				}
				break;

			// j for jump to POI
			case 74:
				// check for just ctrl
				if (ctrlKey && !shiftKey) {
					me.copyRulePressed(me);
				} else {
					// check for ctrl and shift
					if (ctrlKey && shiftKey) {
						// pass up to browser
						processed = false;
					} else {
						// check for defined POIs
						if (me.waypointManager.numPOIs()) {
							// check for controls locked
							if (!me.controlsLocked) {
								// check for shift key
								if (shiftKey) {
									// go to previous POI
									me.prevPOIPressed(me);
								} else {
									// go to next POI
									me.nextPOIPressed(me);
								}
							}
						} else {
							me.menuManager.notification.notify("No POIs defined", 15, 80, 15, true);
						}
					}
				}
				break;

			// t for timing display
			case 84:
				// check for Help
				if (me.displayHelp !== 0 && (!(me.engine.isNone || me.engine.isSuper || me.engine.isExtended || me.engine.isRuleTree))) {
					this.toggleHelpTopic(me, ViewConstants.themesTopic);
				} else {
					// check for shift key
					if (shiftKey) {
						// toggle extended timing
						me.menuManager.showExtendedTiming = !me.menuManager.showExtendedTiming;
					} else {
						// toggle fps
						me.fpsButton.current = me.viewFpsToggle([!me.menuManager.showTiming], true, me);
					}
				}
				break;

			// u for UI or reverse playback for Margolus
			case 85:
				if (shiftKey) {
					// ignore if NOGUI defined
					if (!me.noGUIDefined) {
						me.noGUI = !me.noGUI;
						me.viewMenu.deleted = me.noGUI;
						me.menuManager.noGUI = me.noGUI;
						// close help if open
						if (me.noGUI) {
							me.displayHelp = 0;
							me.displayErrors = 0;
						}
					}
				} else {
					// check for Margolus
					if (me.engine.isMargolus || me.engine.isPCA) {
						// check rule is reversible
						if (me.engine.margolusReverseLookup1) {
							me.directionPressed(me);
						}
					}
				}
				break;

			// g for generation statistics
			case 71:
				if (ctrlKey) {
					// toggle autogrid mode
					me.autoGrid = !me.autoGrid;
					me.autoGridButton.current = me.viewAutoGridToggle([me.autoGrid], true, me);
					me.menuManager.notification.notify("Auto Grid Lines " + (me.autoGrid ? "On" : "Off"), 15, 40, 15, true);
				} else {
					// check for shift
					if (shiftKey) {
						// toggle relative mode if defined
						if (me.genDefined) {
							me.relativeToggle.current = me.viewRelativeToggle([!me.genRelative], true, me);
							me.menuManager.notification.notify("Generation display " + (me.genRelative ? "Relative" : "Absolute"), 15, 40, 15, true);
						}
					} else {
						// toggle statistics
						me.viewStats([!me.statsOn], true, me);
						if (me.genToggle) {
							me.genToggle.current = [me.statsOn];
							me.menuManager.toggleRequired = true;
						}
					}
				}
				break;

			// f for fit zoom
			case 70:
				// check for ctrl key
				if (ctrlKey) {
					if (me.isSelection) {
						me.fitZoomDisplay(true, true, ViewConstants.fitZoomSelection);
						me.menuManager.notification.notify("Fit Selection", 15, 80, 15, true);
					}
				} else {
					// check for shift key
					if (shiftKey) {
						if (!me.autoFitToggle.locked) {
							me.autoFit = !me.autoFit;
							me.autoFitToggle.current = me.toggleAutoFit([me.autoFit], true, me);
							me.menuManager.notification.notify("AutoFit " + (me.autoFit ? "On" : "Off"), 15, 40, 15, true);
						}
					} else {
						// fit zoom
						if (!me.fitButton.locked) {
							me.fitZoomDisplay(true, true, ViewConstants.fitZoomPattern);
							me.menuManager.notification.notify("Fit Pattern", 15, 80, 15, true);

							// flag manual change made if paused
							if (!me.generationOn) {
								me.manualChange = true;
							}
						}
					}
				}
				break;

			// o for new screenshot
			case 79:
				// check for ctrl key
				if (ctrlKey) {
					if (shiftKey) {
						// attempt to read RLE from clipboard
						me.openClipboardPressed(me);
					} else {
						me.loadPattern(me);
					}
				} else {
					// check for shift key
					if (shiftKey) {
						// capture graph
						me.screenShotScheduled = 2;
					} else {
						// capture life
						me.screenShotScheduled = 1;
					}
				}
				break;

			// arrow left for left
			case 37:
				// check for shift key
				if (shiftKey) {
					// scroll pattern diagonally
					me.moveView(me.engine.zoom, me.engine.zoom);
				} else {
					// scroll pattern right
					me.moveView(me.engine.zoom, 0);
				}
				break;

			// arrow up for up
			case 38:
				// check if help displayed
				if (me.displayHelp) {
					// scroll help up
					me.scrollHelpUp(me, 1);
				} else {
					// check if errors displayed
					if (me.displayErrors) {
						// scroll error list up
						me.scrollErrorsUp(me, 1);
					} else {
						// check for shift key
						if (shiftKey) {
							// scroll pattern diagonally
							me.moveView(-me.engine.zoom, me.engine.zoom);
						} else {
							// scroll pattern down
							me.moveView(0, me.engine.zoom);
						}
					}
				}
				break;

			// arrow right for right
			case 39:
				// check for shift key
				if (shiftKey) {
					// scroll pattern diagonally
					me.moveView(-me.engine.zoom, -me.engine.zoom);
				} else {
					// scroll pattern left
					me.moveView(-me.engine.zoom, 0);
				}
				break;

			// arrow down for down
			case 40:
				// check if help displayed
				if (me.displayHelp) {
					// scroll help down
					me.scrollHelpDown(me, 1);
				} else {
					// check if errors displayed
					if (me.displayErrors) {
						// scroll error list down
						me.scrollErrorsDown(me, 1);
					} else {
						// check for shift key
						if (shiftKey) {
							me.moveView(me.engine.zoom, -me.engine.zoom);
						} else {
							// scroll pattern up
							me.moveView(0, -me.engine.zoom);
						}
					}
				}
				break;

			// m for menu or cycle paste mode
			case 77:
				if (ctrlKey) {
					me.fitZoomDisplay(true, true, ViewConstants.fitZoomMiddle);
					me.menuManager.notification.notify("Center Pattern", 15, 80, 15, true);
				} else {
					if (shiftKey) {
						me.cyclePasteMode(me);
					} else {
						if (me.navToggle && !me.navToggle.deleted && !me.navToggle.locked) {
							// toggle navigation menu
							me.navToggle.current = me.toggleSettings([!me.navToggle.current[0]], true, me);

							// mark toggle required
							me.menuManager.toggleRequired = true;
						}
					}
				}
				break;

			// c for theme cycle or copy
			case 67:
				// check for control-C
				if (ctrlKey) {
					me.processCopy(me, shiftKey, altKey);
				} else {
					// check for Help
					if (me.displayHelp !== 0) {
						this.toggleHelpTopic(me, ViewConstants.coloursTopic);
					} else {
						// disable colour themes in multi-state mode
						if (!me.multiStateView) {
							if (me.themeButton && !me.themeButton.locked) {
								// check for shift key
								if (shiftKey) {
									// decrement colour theme
									value = me.engine.colourTheme - 1;
									if (value < 0) {
										// check for custom theme
										if (me.customTheme || me.customGridMajor) {
											value = me.engine.numThemes;
										} else {
											value = me.engine.numThemes - 1;
										}
									}
								} else {
									// increment colour theme
									value = me.engine.colourTheme + 1;

									// check for custom theme
									if (me.customTheme || me.customGridMajor) {
										// allow custom theme
										if (value >= me.engine.numThemes + 1) {
											value = 0;
										}
									} else {
										// no custom theme
										if (value >= me.engine.numThemes) {
											value = 0;
										}
									}
								}

								// set the new theme
								me.setNewTheme(value, me.engine.colourChangeSteps, me);
								if (!me.engine.isNone && !me.showThemeSelection) {
									me.menuManager.notification.notify(me.themeName(me.engine.colourTheme) + " Theme", 15, 40, 15, true);
								}
							}
						}
					}
				}
				break;

			// h for display help
			case 72:
				// check for shift key
				if (shiftKey) {
					// toggle history fit mode
					me.historyFitButton.current = me.viewHistoryFitToggle([!me.historyFit], true, me);
					me.menuManager.notification.notify("AutoFit History Mode " + (me.historyFit ? "On" : "Off"), 15, 40, 15, true);
				} else {
					// if errors then set script help page
					if (me.scriptErrors.length) {
						// toggle help page
						if (me.displayHelp) {
							me.displayHelp = 0;
						} else {
							// open help
							me.displayHelp = 1;
						}
					} else {
						// toggle help
						if (me.displayHelp) {
							me.displayHelp = 0;
						} else {
							// do not display help if in thumbnail mode
							if (!me.thumbnail) {
								// open help
								me.displayHelp = 1;
							}
						}
					}

					// update the help UI
					me.helpToggle.current = me.toggleHelp([me.displayHelp !== 0], true, me);
					me.menuManager.toggleRequired = true;
				}

				break;

			// i for display information
			case 73:
				// check for ctrl and shift
				if (ctrlKey && shiftKey) {
					// pass up to browser
					processed = false;
				} else {
					// check for ctrl key
					if (ctrlKey) {
						me.invertSelectionPressed(me);
					} else {
						// check for shift key
						if (shiftKey) {
							// toggle infobar
							me.infoBarButton.current = me.viewInfoBarToggle([!me.infoBarEnabled], true, me);
						} else {
							// check if help displayed
							if (me.displayHelp) {
								// check if on the info topic
								this.toggleHelpTopic(me, ViewConstants.informationTopic);
							} else {
								// do not display information if in thumbnail mode
								if (!me.thumbnail) {
									me.setHelpTopic(ViewConstants.informationTopic, me);
								}
							}

							// update the help UI
							me.helpToggle.current = me.toggleHelp([me.displayHelp !== 0], true, me);
							me.menuManager.toggleRequired = true;
						}
					}
				}

				break;

			// Esc to close help and clear error messages or pause playback
			case 27:
				// check for popup Viewer
				if (me.isInPopup) {
					// check if errors are displayed
					if (me.scriptErrors.length) {
						// clear errors
						me.scriptErrors = [];
						me.displayErrors = 0;
					} else {
						// check if pasting
						if (me.isPasting) {
							me.cancelPaste(me);
						} else {
							// check for pick mode
							if (me.pickMode) {
								me.pickToggle.current = me.togglePick([false], true, me);
							} else {
								// check for Identify reuslts
								if (me.resultsDisplayed) {
									me.identifyClosePressed(me);
								} else {
									// check for go to generation
									if (me.startFrom !== -1) {
										me.stopStartFrom(me, true, false);
									} else {
										// close the popup Viewer
										hideViewer();
									}
								}
							}
						}
					}
				} else {
					// check if help displayed
					if (me.displayHelp) {
						// close help
						me.displayHelp = 0;
					} else {
						// check if errors displayed
						if (me.scriptErrors.length) {
							// clear errors
							me.scriptErrors = [];
							me.displayErrors = 0;
						} else {
							// check if pasting
							if (me.isPasting) {
								me.cancelPaste(me);
							} else {
								if (me.pickMode) {
									me.pickToggle.current = me.togglePick([false], true, me);
								} else {
									// check for Identify results
									if (me.resultsDisplayed) {
										me.identifyClosePressed(me);
									} else {
										// check for go to generation
										if (me.startFrom !== -1) {
											me.stopStartFrom(me, true, false);
										} else {
											// check if playing
											if (me.generationOn) {
												// switch to pause
												me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
											}
										}
									}
								}
							}
						}
					}
				}

				// update the help UI
				me.helpToggle.current = me.toggleHelp([me.displayHelp !== 0], true, me);
				me.menuManager.toggleRequired = true;

				break;

			// Page Up
			case 33:
				// check if help displayed
				if (me.displayHelp) {
					// check for shift key
					if (shiftKey) {
						// move to previous section
						me.previousHelpSection(me);
					} else {
						// move to previous page
						me.scrollHelpUp(me, me.numHelpPerPage);
					}
				} else {
					// check if errors displayed
					if (me.displayErrors) {
						// move to previous page
						me.scrollErrorsUp(me, me.numHelpPerPage);
					} else {
						// check for multiverse mode
						if (DocConfig.multi) {
							me.universe -= 1;
							if (me.universe < 0) {
								me.universe = Controller.patterns.length - 1;
							}
							me.startViewer(Controller.patterns[me.universe].pattern, false);
						} else {
							me.identifyPageUpPressed(me);
						}
					}
				}
				break;

			// Page Down
			case 34:
				// check if help displayed
				if (me.displayHelp) {
					// check for shift
					if (shiftKey) {
						// move to next help section
						me.nextHelpSection(me);
					} else {
						// move to next page
						me.scrollHelpDown(me, me.numHelpPerPage);
					}
				} else {
					// check if errors displayed
					if (me.displayErrors) {
						// move to next page
						me.scrollErrorsDown(me, me.numHelpPerPage);
					} else {
						// check for multiverse mode
						if (DocConfig.multi) {
							me.universe += 1;
							if (me.universe >= Controller.patterns.length) {
								me.universe = 0;
							}
							me.startViewer(Controller.patterns[me.universe].pattern, false);
						} else {
							me.identifyPageDownPressed(me);
						}
					}
				}
				break;

			// Home
			case 36:
				// check if help displayed
				if (me.displayHelp) {
					// move to top
					me.displayHelp = 1;
				} else {
					// check if errors displayed
					if (me.displayErrors) {
						// move to top
						me.displayErrors = 1;
					} else {
						// check if multiverse mode is on
						if (DocConfig.multi) {
							// switch to multiverse menu
							me.multiversePressed(me);
							//me.universe = 0;
							//me.startViewer(Controller.patterns[me.universe].pattern, false);
							//Controller.viewers[0][1].menuManager.notification.notify("Select Pattern", 15, 120, 15, true);
						} else {
							me.identifyHomePressed(me);
						}
					}
				}
				break;

			// End
			case 35:
				// check if help displayed
				if (me.displayHelp) {
					// move to bottom
					me.displayHelp = me.numHelpLines - me.numHelpPerPage;
				} else {
					// check if errors displayed
					if (me.displayErrors) {
						// move to bottom
						me.displayErrors = me.scriptErrors.length - me.numHelpPerPage;
					} else {
						// check if multiverse mode is on
						if (DocConfig.multi) {
							//me.universe = Controller.patterns.length - 1;
							//me.startViewer(Controller.patterns[me.universe].pattern, false);
						} else {
							me.identifyEndPressed(me);
						}
					}
				}
				break;

			// f1 for toggle edit mode
			case 112:
				if (!me.viewOnly) {
					me.drawing = !me.drawing;
					me.modeList.current = me.viewModeList((me.drawing ? ViewConstants.modeDraw : ViewConstants.modePan), true, me);
					me.menuManager.notification.notify((me.drawing ? "Draw" : "Pan") + " Mode", 15, 40, 15, true);
				}
				break;

			// f2 for draw mode
			case 113:
				// check for shift key
				if (shiftKey) {
					me.smartToggle.current = me.toggleSmart([!me.smartDrawing], true, me);
					me.menuManager.notification.notify("Smart Drawing " + (me.smartDrawing ? "On" : "Off"), 15, 40, 15, true);
				} else {
					me.modeList.current = me.viewModeList(ViewConstants.modeDraw, true, me);
				}
				break;

			// f3 for pick mode
			case 114:
				if (shiftKey) {
					me.graphDataToggle.current = me.viewGraphList([!me.graphDataToggle.current[0], me.graphDataToggle.current[1], me.graphDataToggle.current[2]], true, me);
				} else {
					if (!me.viewOnly) {
						me.modeList.current = me.viewModeList(ViewConstants.modeDraw, true, me);
						if (!me.pickMode) {
							me.pickToggle.current = me.togglePick([true], true, me);
						}
					}
				}

				break;

			// f4 for select mode
			case 115:
				if (shiftKey) {
					me.graphDataToggle.current = me.viewGraphList([me.graphDataToggle.current[0], !me.graphDataToggle.current[1], me.graphDataToggle.current[2]], true, me);
				} else {
					if (!me.modeList.itemLocked[ViewConstants.modeSelect]) {
						me.modeList.current = me.viewModeList(ViewConstants.modeSelect, true, me);
					}
				}
				break;

			// f5 for pan mode
			case 116:
				if (shiftKey) {
					me.graphDataToggle.current = me.viewGraphList([me.graphDataToggle.current[0], me.graphDataToggle.current[1], !me.graphDataToggle.current[2]], true, me);
				} else {
					me.modeList.current = me.viewModeList(ViewConstants.modePan, true, me);
				}
				break;

			// f6 to toggle oscillator search
			case 117:
				if (!me.identifyButton.locked) {
					if (shiftKey) {
						me.displayLastIdentifyResults(me);
					} else {
						me.identifyPressed(me);
					}
				}
				break;

			// f7 to toggle fast lookup for RuleLoader algos
			case 118:
				if (!me.fastLookupButton.locked) {
					me.fastLookupButton.current = me.viewFastLookupToggle([!me.engine.ruleLoaderLookupEnabled], true, me);
					me.menuManager.notification.notify("Fast Lookup " + (me.engine.ruleLoaderLookupEnabled ? "On" : "Off"), 15, 40, 15, true);
				}
				break;

			// f8 to toggle state number display
			case 119:
				if (!me.stateNumberButton.locked) {
					me.stateNumberButton.current = me.viewStateNumberToggle([!me.stateNumberDisplayed], true, me);
					me.menuManager.notification.notify("State Numbers " + (me.stateNumberDisplayed ? "On" : "Off"), 15, 40, 15, true);
				}
				break;

			// f9 to toggle y coordinate direction
			case 120:
				if (!me.yDirectionButton.locked) {
					me.yDirectionButton.current = me.viewYDirectionToggle([!me.yUp], true, me);
					me.menuManager.notification.notify("Y Direction " + (me.yUp ? "Up" : "Down"), 15, 40, 15, true);
				}
				break;

			// Ins to show Help sections
			case 45:
				me.showSections = true;
				break;

			// ignore f11 so browser processes it (toggle fullscreen)
			case 122:
				processed = false;
				break;

			// ignore other keys
			default:
				// flag key not handled if specified or f5 (browser refresh) if not implemented above
				if (keyCode === -1 || keyCode === 116) {
					processed = false;
				}
				break;
			}
		}

		// return whether key processed
		return processed;
	};
