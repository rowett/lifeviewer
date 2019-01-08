// LifeViewer Keywords
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// script keywords
	var Keywords = {
		// string delimiter
		/** @const {string} */ stringDelimiter : '"',

		// script start
		/** @const {string} */ scriptStartWord : "[[",

		// script end
		/** @const {string} */ scriptEndWord : "]]",

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

		// apply mode to all
		/** @const {string} */ allWord : "ALL",

		// linear mode
		/** @const {string} */ linearWord : "LINEAR",

		// bezier mode
		/** @const {string} */ bezierWord : "BEZIER",

		// hex display
		/** @const {string} */ hexDisplayWord : "HEXDISPLAY",

		// square display
		/** @const {string} */ squareDisplayWord : "SQUAREDISPLAY",

		// integer zoom
		/** @const {string} */ integerZoomWord : "INTEGERZOOM",

		// random seed
		/** @const {string} */ randomSeedWord : "RANDOMSEED",

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

		// label
		/** @const {string} */ labelWord : "LABEL",

		// label alpha
		/** @const {string} */ labelAlphaWord : "LABELALPHA",

		// label size
		/** @const {string} */ labelSizeWord : "LABELSIZE",

		// label generation range
		/** @const {string} */ labelTWord : "LABELT",

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

		// boundary
		/** @const {string} */ boundaryWord : "BOUNDARY",

		// autofit word
		/** @const {string} */ autoFitWord : "AUTOFIT",

		// history fit word
		/** @const {string} */ historyFitWord : "HISTORYFIT",

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

		// strict
		/** @const {string} */ strictWord : "STRICT",

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

		// theme
		/** @const {string} */ themeWord : "THEME",

		// autostart
		/** @const {string} */ autoStartWord : "AUTOSTART",

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

		// variable prefix
		/** @const {string} */ variablePrefixSymbol : "#"
	};

	window['Keywords'] = Keywords;
}
());
