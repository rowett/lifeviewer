// LifeViewer Keywords
// Keywords for the LifeViewer script language.

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

	// script keywords
	var Keywords = {
		// string delimiter
		/** @const {string} */ stringDelimiter : '"',

		// script start
		/** @const {string} */ scriptStartWord : "[[",

		// script end
		/** @const {string} */ scriptEndWord : "]]",

		// no snow
		/** @const {string} */ noSnowWord : "NOSNOW",

		// quality
		/** @const {string} */ qualityWord : "QUALITY",

		// time
		/** @const {string} */ timeIntervalWord : "TIME",

		// playtime
		/** @const {string} */ playTimeWord : "PLAYTIME",

		// suppress
		/** @const {string} */ suppressWord : "SUPPRESS",

		// POI t
		/** @const {string} */ poiTWord : "POIT",

		// initial
		/** @const {string} */ initialWord : "INITIAL",

		// off
		/** @const {string} */ offWord : "OFF",

		// state 1 fit
		/** @const {string} */ state1FitWord : "STATE1FIT",

		// POI reset
		/** @const {string} */ poiResetWord : "POIRESET",

		// POI play
		/** @const {string} */ poiPlayWord : "POIPLAY",

		// POI stop
		/** @const {string} */ poiStopWord : "POISTOP",

		// POI transition speed
		/** @const {string} */ poiTransWord : "POITRANS",

		// POI add Labels word
		/** @const {string} */ poiAddLabelsWord : "POIADDLABELS",

		// hard reset
		/** @const {string} */ hardResetWord : "HARDRESET",

		// track
		/** @const {string} */ trackWord : "TRACK",

		// track box
		/** @const {string} */ trackBoxWord : "TRACKBOX",

		// track loop
		/** @const {string} */ trackLoopWord : "TRACKLOOP",

		// no report
		/** @const {string} */ noReportWord : "NOREPORT",

		// population graph
		/** @const {string} */ graphWord : "GRAPH",

		// disable graph
		/** @const {string} */ noGraphWord : "NOGRAPH",

		// population graph opacity
		/** @const {string} */ graphOpacityWord : "GRAPHOPACITY",

		// population graph use points
		/** @const {string} */ graphPointsWord : "GRAPHPOINTS",

		// disable performance warning
		/** @const {string} */ noPerfWarningWord : "NOPERFWARNING",

		// hide GUI
		/** @const {string} */ hideGUIWord : "AUTOHIDEGUI",

		// apply mode to all
		/** @const {string} */ allWord : "ALL",

		// linear mode
		/** @const {string} */ linearWord : "LINEAR",

		// bezier mode
		/** @const {string} */ bezierWord : "BEZIER",

		// triangular cells
		/** @const {string} */ triCellsWord : "TRIANGULARCELLS",

		// hexagonal cells
		/** @const {string} */ hexCellsWord : "HEXCELLS",

		// square cells
		/** @const {string} */ squareCellsWord : "SQUARECELLS",

		// use icons
		/** @const {string} */ useIconsWord : "ICONS",

		// draw cell borders
		/** @const {string} */ bordersWord : "CELLBORDERS",

		// random cells
		/** @const {string} */ randomCellsWord : "RANDCELLS",

		// randomize pattern
		/** @const {string} */ randomizeWord : "RANDOMIZE",

		// 2-state randomize pattern
		/** @const {string} */ randomize2Word : "RANDOMIZE2",

		// random seed
		/** @const {string} */ randomSeedWord : "RANDSEED",

		// random pattern parameters
		/** @const {string} */ randomWidthWord : "RANDWIDTH",
		/** @const {string} */ randomHeightWord : "RANDHEIGHT",
		/** @const {string} */ randomFillWord : "RANDFILL",

		// random rule paramters (Margolus)
		/** @const {string} */ randomReversibleWord : "RANDREVERSIBLE",
		/** @const {string} */ randomSwapWord : "RANDFIXEDPOP",

		// random rule paramters (Life-Like)
		/** @const {string} */ randomChanceWord : "RANDCHANCE",
		/** @const {string} */ randomBWord : "B",
		/** @const {string} */ randomSWord : "S",

		// boundary deletion radius
		/** @const {string} */ deleteRangeWord : "DELETERANGE",

		// show timing
		/** @const {string} */ showTimingWord : "SHOWTIMING",

		// extended timing
		/** @const {string} */ extendedTimingWord : "EXTENDEDTIMING",

		// show generation statistics
		/** @const {string} */ showGenStatsWord : "SHOWGENSTATS",

		// show information bar
		/** @const {string} */ showInfoBarWord : "SHOWINFOBAR",

		// hide source
		/** @const (string) */ noSourceWord : "NOSOURCE",

		// point of interest
		/** @const {string} */ poiWord : "POI",

		// window title
		/** @const {string} */ titleWord : "TITLE",

		// polygon colour attribute name
		/** @const {string} */ polyWord : "POLY",

		// polygon shadow on/off
		/** @const {string} */ polyShadowWord : "POLYSHADOW",

		// filled polygon
		/** @const {string} */ polyFillWord : "POLYFILL",

		// outline polygon
		/** @const {string} */ polyLineWord : "POLYLINE",

		// polygon alpha
		/** @const {string} */ polyAlphaWord : "POLYALPHA",

		// polygon size
		/** @const {string} */ polySizeWord : "POLYSIZE",

		// polygon generation range and fade
		/** @const {string} */ polyTWord : "POLYT",

		// polygon angle and fixed 
		/** @const {string} */ polyAngleWord : "POLYANGLE",

		// polygon zoom range
		/** @const {string} */ polyZoomRangeWord : "POLYZOOMRANGE",

		// polygon track
		/** @const {string} */ polyTrackWord : "POLYTRACK",

		// polygon view radius
		/** @const {string} */ polyViewWord : "POLYVIEWDIST",

		// arrow
		/** @const {string} */ arrowWord : "ARROW",

		// arrow shadow on/off
		/** @const {string} */ arrowShadowWord : "ARROWSHADOW",

		// arrow alpha
		/** @const {string} */ arrowAlphaWord : "ARROWALPHA",

		// arrow size
		/** @const {string} */ arrowSizeWord : "ARROWSIZE",

		// arrow generation range and fade
		/** @const {string} */ arrowTWord : "ARROWT",

		// arrow angle and fixed 
		/** @const {string} */ arrowAngleWord : "ARROWANGLE",

		// arrow zoom range
		/** @const {string} */ arrowZoomRangeWord : "ARROWZOOMRANGE",

		// arrow track
		/** @const {string} */ arrowTrackWord : "ARROWTRACK",

		// arrow view radius
		/** @const {string} */ arrowViewWord : "ARROWVIEWDIST",

		// label
		/** @const {string} */ labelWord : "LABEL",

		// label shadow on/off
		/** @const {string} */ labelShadowWord : "LABELSHADOW",

		// label alpha
		/** @const {string} */ labelAlphaWord : "LABELALPHA",

		// label size
		/** @const {string} */ labelSizeWord : "LABELSIZE",

		// label generation range and fade
		/** @const {string} */ labelTWord : "LABELT",

		// label angle and fixed 
		/** @const {string} */ labelAngleWord : "LABELANGLE",

		// label zoom range
		/** @const {string} */ labelZoomRangeWord : "LABELZOOMRANGE",

		// label track
		/** @const {string} */ labelTrackWord : "LABELTRACK",

		// label view radius
		/** @const {string} */ labelViewWord : "LABELVIEWDIST",

		// label text alignment
		/** @const {string} */ labelAlignWord : "LABELALIGN",

		// label left alignment
		/** @const {string} */ labelAlignLeftWord : "LEFT",

		// label right alignment
		/** @const {string} */ labelAlignRightWord : "RIGHT",

		// label center alignment
		/** @const {string} */ labelAlignCenterWord : "CENTER",

		// label angle fixed
		/** @const {string} */ fixedWord: "FIXED",

		// maximum grid size
		/** @const {string} */ maxGridSizeWord : "MAXGRIDSIZE",

		// starfield word
		/** @const {string} */ starfieldWord : "STARS",

		// custom theme identifier
		/** @const {string} */ themeCustomWord : "CUSTOM",

		// x offset
		/** @const {string} */ xOffsetWord : "XOFFSET",

		// y offset
		/** @const {string} */ yOffsetWord : "YOFFSET",

		// custom theme elements
		/** @const {string} */ themeBackgroundWord : "BACKGROUND",
		/** @const {string} */ themeAliveWord : "ALIVE",
		/** @const {string} */ themeAliveRampWord : "ALIVERAMP",
		/** @const {string} */ themeDeadWord : "DEAD",
		/** @const {string} */ themeDeadRampWord : "DEADRAMP",
		/** @const {string} */ themeDyingWord : "DYING",
		/** @const {string} */ themeDyingRampWord : "DYINGRAMP",

		// custom UI elements
		/** @const {string} */ uiFGWord : "UIFOREGROUND",
		/** @const {string} */ uiFGAlphaWord : "UIFOREGROUNDA",
		/** @const {string} */ uiBGWord : "UIBACKGROUND",
		/** @const {string} */ uiBGAlphaWord : "UIBACKGROUNDA",
		/** @const {string} */ uiHighlightWord : "UIHIGHLIGHT",
		/** @const {string} */ uiHighlightAlphaWord : "UIHIGHTLIGHTA",
		/** @const {string} */ uiSelectWord : "UISELECT",
		/** @const {string} */ uiSelectAlphaWord : "UISELECTA",
		/** @const {string} */ uiLockedWord : "UILOCKED",
		/** @const {string} */ uiLockedAlphaWord : "UILOCKEDA",
		/** @const {string} */ uiBorderWord : "UIBORDER",
		/** @const {string} */ uiBorderWordAlpha : "UIBORDERA",

		// boundary
		/** @const {string} */ boundaryWord : "BOUNDARY",

		// bounded grid
		/** @const {string} */ boundedWord : "BOUNDED",

		// select
		/** @const {string} */ selectWord : "SELECT",

		// selected cells
		/** @const {string} */ selectedCellsWord: "SELECTED",

		// autofit word
		/** @const {string} */ autoFitWord : "AUTOFIT",

		// history fit word
		/** @const {string} */ historyFitWord : "HISTORYFIT",

		// history states word
		/** @const {string} */ historyStatesWord : "HISTORYSTATES",

		// alive states word
		/** @const {string} */ aliveStatesWord : "AGESTATES",

		// step word
		/** @const {string} */ stepWord : "STEP",

		// no history word
		/** @const {string} */ noHistoryWord : "NOSTEPBACK",

		// t word
		/** @const {string} */ tWord : "T",

		// pause word
		/** @const {string} */ pauseWord : "PAUSE",

		// grid
		/** @const {string} */ gridWord : "GRID",

		// grid major
		/** @const {string} */ gridMajorWord : "GRIDMAJOR",

		// text colour
		/** @const {string} */ textColorWord : "TEXT",

		// error colour
		/** @const {string} */ errorColorWord : "ERROR",

		// help colour
		/** @const {string} */ helpColorWord : "HELP",

		// [R]History custom colours
		/** @const {string} */ offColorWord : "OFF",
		/** @const {string} */ onColorWord : "ON",
		/** @const {string} */ historyColorWord : "HISTORY",
		/** @const {string} */ mark1ColorWord : "MARK1",
		/** @const {string} */ markOffColorWord : "MARKOFF",
		/** @const {string} */ mark2ColorWord : "MARK2",
		/** @const {string} */ killColorWord : "KILL",

		// graph background colour
		/** @const {string} */ graphBgColorWord : "GRAPHBG",

		// graph axis colours
		/** @const {string} */ graphAxisColorWord : "GRAPHAXIS",

		// graph alive, birth and death colours
		/** @const {string} */ graphAliveColorWord : "GRAPHALIVE",
		/** @const {string} */ graphBirthColorWord : "GRAPHBIRTH",
		/** @const {string} */ graphDeathColorWord : "GRAPHDEATH",

		// color
		/** @const {string} */ colorWord : "COLOR",
		/** @const {string} */ colourWord : "COLOUR",

		// mode 7
		/** @const {string} */ tiltWord : "TILT",

		// view only
		/** @const {string} */ viewOnlyWord : "VIEWONLY",

		// disable gui
		/** @const {string} */ noGUIWord : "NOGUI",

		// disable RLE copy
		/** @const {string} */ noCopyWord : "NOCOPY",

		// thumbnail
		/** @const {string} */ thumbnailWord : "THUMBNAIL",

		// thumbnail size
		/** @const {string} */ thumbSizeWord : "THUMBSIZE",

		// thumbnail launches popup
		/** @const {string} */ thumbLaunchWord : "THUMBLAUNCH",

		// thumbnail expansion starts playback
		/** @const {string} */ thumbStartWord : "THUMBSTART",

		// when this instance plays pause others
		/** @const {string} */ exclusivePlayWord : "EXCLUSIVEPLAY",

		// ignore exclusive playback pause
		/** @const {string} */ ignoreExclusiveWord : "IGNOREEXCLUSIVE",

		// theme
		/** @const {string} */ themeWord : "THEME",

		// rainbow word
		/** @const {string} */ rainbowWord : "RAINBOW",

		// start from
		/** @const {string} */ startFromWord : "STARTFROM",

		// autostart
		/** @const {string} */ autoStartWord : "AUTOSTART",

		// autoidentify
		/** @const {string} */ autoIdentifyWord : "AUTOIDENTIFY",

		// loop
		/** @const {string} */ loopWord : "LOOP",

		// stop
		/** @const {string} */ stopWord : "STOP",

		// angle
		/** @const {string} */ angleWord : "ANGLE",

		// layers
		/** @const {string} */ layersWord : "LAYERS",

		// depth
		/** @const {string} */ depthWord : "DEPTH",

		// gps
		/** @const {string} */ gpsWord : "GPS",

		// zoom word
		/** @const {string} */ zoomWord : "ZOOM",

		// alternate zoom word
		/** @const {string} */ alternateZoomWord : "Z",

		// x word
		/** @const {string} */ xWord : "X",

		// y word
		/** @const {string} */ yWord : "Y",

		// width of Viewer
		/** @const {string} */ widthWord : "WIDTH",

		// height of Viewer
		/** @const {string} */ heightWord : "HEIGHT",

		// width of popup Viewer
		/** @const {string} */ popupWidthWord : "POPUPWIDTH",

		// height of popup Viewer
		/** @const {string} */ popupHeightWord : "POPUPHEIGHT",

		// thumbnail zoom
		/** @const {string} */ thumbZoomWord : "THUMBZOOM",

		// no throttle
		/** @const {string} */ noThrottleWord : "NOTHROTTLE",

		// reverse start
		/** @const {string} */ reverseStartWord : "REVERSESTART",

		// suppress escaping gliders 
		/** @const {string} */ killGlidersWord : "KILLGLIDERS",

		// enable RuleLoader fast lookup
		/** @const {string} */ fastLookupWord : "FASTLOOKUP",

		// recipe 
		/** @const {string} */ recipeWord : "RECIPE",

		// rle 
		/** @const {string} */ rleWord : "RLE",

		// paste
		/** @const {string} */ pasteWord : "PASTE",

		// paste T
		/** @const {string} */ pasteTWord : "PASTET",

		// paste delta
		/** @const {string} */ pasteDeltaWord : "PASTEDELTA",

		/** every for paste T */
		/** @const {string} */ everyWord : "EVERY",

		// paste mode
		/** @const {string} */ pasteModeWord : "PASTEMODE",

		// paste modes
		/** @const {string} */ pasteModeZeroWord : "ZERO",
		/** @const {string} */ pasteModeAndWord : "AND",
		/** @const {string} */ pasteMode0010Word : "0010",
		/** @const {string} */ pasteModeXWord : "X",
		/** @const {string} */ pasteMode0100Word : "DIFF",
		/** @const {string} */ pasteModeYWord : "Y",
		/** @const {string} */ pasteModeXorWord : "XOR",
		/** @const {string} */ pasteModeOrWord : "OR",
		/** @const {string} */ pasteModeNOrWord : "NOR",
		/** @const {string} */ pasteModeXNOrWord : "XNOR",
		/** @const {string} */ pasteModeNotYWord : "NOTY",
		/** @const {string} */ pasteMode1011Word : "1011",
		/** @const {string} */ pasteModeNotXWord : "NOTX",
		/** @const {string} */ pasteMode1101Word : "1101",
		/** @const {string} */ pasteModeNAndWord : "NAND",
		/** @const {string} */ pasteModeOneWord : "ONE",
		/** @const {string} */ pasteModeCopyWord : "COPY",

		// tranformation types
		/** @const {string} */ transTypeIdentity : "IDENTITY",
		/** @const {string} */ transTypeFlip : "FLIP",
		/** @const {string} */ transTypeFlipX : "FLIPX",
		/** @const {string} */ transTypeFlipY : "FLIPY",
		/** @const {string} */ transTypeSwapXY : "SWAPXY",
		/** @const {string} */ transTypeSwapXYFlip : "SWAPXYFLIP",
		/** @const {string} */ transTypeRotateCW : "RCW",
		/** @const {string} */ transTypeRotateCCW : "RCCW",

		// XT and YT pastes
		/** @const {string} */ pasteXTWord : "XT",
		/** @const {string} */ pasteYTWord : "YT",

		// variable prefix
		/** @const {string} */ variablePrefixSymbol : "#"
	};
