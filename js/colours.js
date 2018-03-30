// LifeViewer Colours
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// ColourSet constructor
	/**
	 * @constructor
	 */
	function ColourSet() {
		// list of colours
		this.colours = [];
	}

	// add a colour to the colour set
	ColourSet.prototype.add = function(red, green, blue) {
		this.colours[this.colours.length] = (red << 16) | (green << 8) | blue;
	};

	// ColourManager singleton
	var ColourManager = {
		// list of colours sets
		colourSetList : [],

		// rule to colour set mapping list
		ruleMappingList : [],

		// whether initialised
		initialised : false,

		// default colours
		defaultColours : [
			48,48,48,
			0,255,127,127,0,255,148,148,148,128,255,0,255,0,128,
			0,128,255,1,159,0,159,0,1,255,254,96,0,1,159,96,255,254,
			254,96,255,126,125,21,21,126,125,125,21,126,255,116,116,116,255,116,
			116,116,255,228,227,0,28,255,27,255,27,28,0,228,227,227,0,228,
			27,28,255,59,59,59,234,195,176,175,196,255,171,194,68,194,68,171,
			68,171,194,72,184,71,184,71,72,71,72,184,169,255,188,252,179,63,
			63,252,179,179,63,252,80,9,0,0,80,9,9,0,80,255,175,250,
			199,134,213,115,100,95,188,163,0,0,188,163,163,0,188,203,73,0,
			0,203,73,73,0,203,94,189,0,189,0,94,0,94,189,187,243,119,
			55,125,32,125,32,55,32,55,125,255,102,185,102,185,255,120,209,168,
			208,166,119,135,96,192,182,255,41,83,153,130,247,88,55,89,247,55,
			88,55,247,87,75,0,0,87,75,75,0,87,200,135,59,51,213,127,
			255,255,162,255,37,182,37,182,255,228,57,117,142,163,210,57,117,228,
			193,255,246,188,107,123,123,194,107,145,59,5,5,145,59,59,5,145,
			119,39,198,40,197,23,197,23,40,23,40,197,178,199,158,255,201,121,
			134,223,223,39,253,84,149,203,15,203,15,149,15,149,203,152,144,90,
			143,75,139,71,97,132,224,65,219,65,219,224,255,255,40,218,223,69,
			74,241,0,241,0,74,0,74,241,122,171,51,220,211,227,61,127,87,
			90,124,176,36,39,13,165,142,255,255,38,255,38,255,255,83,50,107,
			224,142,165,255,181,9,9,255,181,181,9,255,140,238,70,255,74,5,
			74,5,255,138,84,51,31,172,101,177,115,17,221,0,0,0,221,0,
			0,0,221,220,255,200,0,41,50,255,150,205,178,45,116,113,255,189,
			47,0,44,40,119,171,205,107,255,177,115,172,133,73,236,109,0,168,
			168,46,207,188,181,203,212,188,35,90,97,52,39,209,184,41,164,152,
			227,46,70,46,70,227,211,156,255,98,146,222,136,56,95,102,54,152,
			86,142,0,142,0,86,0,86,142,86,223,96,246,135,46,4,208,120,
			212,233,158,177,92,214,104,147,88,149,240,147,227,93,148,72,255,133,
			209,27,194,147,255,255,44,93,0,160,36,158,182,233,0,96,94,217,
			218,103,88,163,154,38,118,114,139,94,0,43,113,164,174,168,188,114,
			0,23,119,42,86,93,255,226,202,80,191,155,255,158,136,0,247,62,
			234,146,88,0,183,229,110,212,36,0,143,161,105,191,210,133,164,0,
			41,30,89,164,0,132,30,89,42,178,222,217,121,22,11,221,107,22,
			69,151,255,45,158,3,158,3,45,3,45,158,86,42,29,9,122,22,
			213,209,110,53,221,57,159,101,91,93,140,45,247,213,37,185,34,0,
			0,185,34,34,0,185,236,0,172,210,180,78,231,107,221,162,49,43,
			43,162,49,49,43,162,36,248,213,114,0,214,213,36,248,149,34,243,
			185,158,167,144,122,224,34,245,149,255,31,98,31,98,255,152,200,193,
			255,80,95,128,123,63,102,62,72,255,62,148,151,226,108,159,99,255,
			226,255,126,98,223,136,80,95,255,225,153,15,73,41,211,212,71,41,
			83,217,187,180,235,79,0,166,127,251,135,243,229,41,0,41,0,229,
			82,255,216,141,174,249,249,215,255,167,31,79,31,79,167,213,102,185,
			255,215,83,4,2,40,224,171,220,41,0,4,6,50,90,221,15,113,
			15,113,221,33,0,115,108,23,90,182,215,36],

		// default colour set
		defaultColourSet : [],

		// list of HTML5 standard colours
		colourList : {
			"aliceblue" : ["AliceBlue", 240, 248, 255],
			"antiquewhite" : ["AntiqueWhite", 250, 235, 215],
			"aqua" : ["Aqua", 0, 255, 255],
			"aquamarine" : ["Aquamarine", 127, 255, 212],
			"azure" : ["Azure", 240, 255, 255],
			"beige" : ["Beige", 245, 245, 220],
			"bisque" : ["Bisque", 255, 228, 196],
			"black" : ["Black", 0, 0, 0],
			"blanchedalmond" : ["BlanchedAlmond", 255, 235, 205],
			"blue" : ["Blue", 0, 0, 255],
			"blueviolet" : ["BlueViolet", 138, 43, 226],
			"brown" : ["Brown", 165, 42, 42],
			"burlywood" : ["BurlyWood", 222, 184, 135],
			"cadetblue" : ["CadetBlue", 95, 158, 160],
			"chartreuse" : ["Chartreuse", 127, 255, 0],
			"chocolate" : ["Chocolate", 210, 105, 30],
			"coral" : ["Coral", 255, 127, 80],
			"cornflowerblue" : ["CornflowerBlue", 100, 149, 237],
			"cornsilk" : ["Cornsilk", 255, 248, 220],
			"crimson" : ["Crimson", 220, 20, 60],
			"cyan" : ["Cyan", 0, 255, 255],
			"darkblue" : ["DarkBlue", 0, 0, 139],
			"darkcyan" : ["DarkCyan", 0, 139, 139],
			"darkgoldenrod" : ["DarkGoldenRod", 184, 134, 11],
			"darkgray" : ["DarkGray", 169, 169, 169],
			"darkgreen" : ["DarkGreen", 0, 100, 0],
			"darkkhaki" : ["DarkKhaki", 189, 183, 107],
			"darkmagenta" : ["DarkMagenta", 139, 0, 139],
			"darkolivegreen" : ["DarkOliveGreen", 85, 107, 47],
			"darkorange" : ["DarkOrange", 255, 140, 0],
			"darkorchid" : ["DarkOrchid", 153, 50, 204],
			"darkred" : ["DarkRed", 139, 0, 0],
			"darksalmon" : ["DarkSalmon", 233, 150, 122],
			"darkseagreen" : ["DarkSeaGreen", 143, 188, 143],
			"darkslateblue" : ["DarkSlateBlue", 72, 61, 139],
			"darkslategray" : ["DarkSlateGray", 47, 79, 79],
			"darkturquoise" : ["DarkTurquoise", 0, 206, 209],
			"darkviolet" : ["DarkViolet", 148, 0, 211],
			"deeppink" : ["DeepPink", 255, 20, 147],
			"deepskyblue" : ["DeepSkyBlue", 0, 191, 255],
			"dimgray" : ["DimGray", 105, 105, 105],
			"dodgerblue" : ["DodgerBlue", 30, 144, 255],
			"firebrick" : ["FireBrick", 178, 34, 34],
			"floralwhite" : ["FloralWhite", 255, 250, 240],
			"forestgreen" : ["ForestGreen", 34, 139, 34],
			"fuchsia" : ["Fuchsia", 255, 0, 255],
			"gainsboro" : ["Gainsboro", 220, 220, 220],
			"ghostwhite" : ["GhostWhite", 248, 248, 255],
			"gold" : ["Gold", 255, 215, 0],
			"goldenrod" : ["GoldenRod", 218, 165, 32],
			"gray" : ["Gray", 128, 128, 128],
			"green" : ["Green", 0, 128, 0],
			"greenyellow" : ["GreenYellow", 173, 255, 47],
			"honeydew" : ["HoneyDew", 240, 255, 240],
			"hotpink" : ["HotPink", 255, 105, 180],
			"indianred" : ["IndianRed", 205, 92, 92],
			"indigo" : ["Indigo", 75, 0, 130],
			"ivory" : ["Ivory", 255, 255, 240],
			"khaki" : ["Khaki", 240, 230, 140],
			"lavender" : ["Lavender", 230, 230, 250],
			"lavenderblush" : ["LavenderBlush", 255, 240, 245],
			"lawngreen" : ["LawnGreen", 124, 252, 0],
			"lemonchiffon" : ["LemonChiffon", 255, 250, 205],
			"lightblue" : ["LightBlue", 173, 216, 230],
			"lightcoral" : ["LightCoral", 240, 128, 128],
			"lightcyan" : ["LightCyan", 224, 255, 255],
			"lightgoldenrodyellow" : ["LightGoldenRodYellow", 250, 250, 210],
			"lightgray" : ["LightGray", 211, 211, 211],
			"lightgreen" : ["LightGreen", 144, 238, 144],
			"lightpink" : ["LightPink", 255, 182, 193],
			"lightsalmon" : ["LightSalmon", 255, 160, 122],
			"lightseagreen" : ["LightSeaGreen", 32, 178, 170],
			"lightskyblue" : ["LightSkyBlue", 135, 206, 250],
			"lightslategray" : ["LightSlateGray", 119, 136, 153],
			"lightsteelblue" : ["LightSteelBlue", 176, 196, 222],
			"lightyellow" : ["LightYellow", 255, 255, 224],
			"lime" : ["Lime", 0, 255, 0],
			"limegreen" : ["LimeGreen", 50, 205, 50],
			"linen" : ["Linen", 250, 240, 230],
			"magenta" : ["Magenta", 255, 0, 255],
			"maroon" : ["Maroon", 128, 0, 0],
			"mediumaquamarine" : ["MediumAquaMarine", 102, 205, 170],
			"mediumblue" : ["MediumBlue", 0, 0, 205],
			"mediumorchid" : ["MediumOrchid", 186, 85, 211],
			"mediumpurple" : ["MediumPurple", 147, 112, 219],
			"mediumseagreen" : ["MediumSeaGreen", 60, 179, 113],
			"mediumslateblue" : ["MediumSlateBlue", 123, 104, 238],
			"mediumspringgreen" : ["MediumSpringGreen", 0, 250, 154],
			"mediumturquoise" : ["MediumTurquoise", 72, 209, 204],
			"mediumvioletred" : ["MediumVioletRed", 199, 21, 133],
			"midnightblue" : ["MidnightBlue", 25, 25, 112],
			"mintcream" : ["MintCream", 245, 255, 250],
			"mistyrose" : ["MistyRose", 255, 228, 225],
			"moccasin" : ["Moccasin", 255, 228, 181],
			"navajowhite" : ["NavajoWhite", 255, 222, 173],
			"navy" : ["Navy", 0, 0, 128],
			"oldlace" : ["OldLace", 253, 245, 230],
			"olive" : ["Olive", 128, 128, 0],
			"olivedrab" : ["OliveDrab", 107, 142, 35],
			"orange" : ["Orange", 255, 165, 0],
			"orangered" : ["OrangeRed", 255, 69, 0],
			"orchid" : ["Orchid", 218, 112, 214],
			"palegoldenrod" : ["PaleGoldenRod", 238, 232, 170],
			"palegreen" : ["PaleGreen", 152, 251, 152],
			"paleturquoise" : ["PaleTurquoise", 175, 238, 238],
			"palevioletred" : ["PaleVioletRed", 219, 112, 147],
			"papayawhip" : ["PapayaWhip", 255, 239, 213],
			"peachpuff" : ["PeachPuff", 255, 218, 185],
			"peru" : ["Peru", 205, 133, 63],
			"pink" : ["Pink", 255, 192, 203],
			"plum" : ["Plum", 221, 160, 221],
			"powderblue" : ["PowderBlue", 176, 224, 230],
			"purple" : ["Purple", 128, 0, 128],
			"rebeccapurple" : ["RebeccaPurple", 102, 51, 153],
			"red" : ["Red", 255, 0, 0],
			"rosybrown" : ["RosyBrown", 188, 143, 143],
			"royalblue" : ["RoyalBlue", 65, 105, 225],
			"saddlebrown" : ["SaddleBrown", 139, 69, 19],
			"salmon" : ["Salmon", 250, 128, 114],
			"sandybrown" : ["SandyBrown", 244, 164, 96],
			"seagreen" : ["SeaGreen", 46, 139, 87],
			"seashell" : ["SeaShell", 255, 245, 238],
			"sienna" : ["Sienna", 160, 82, 45],
			"silver" : ["Silver", 192, 192, 192],
			"skyblue" : ["SkyBlue", 135, 206, 235],
			"slateblue" : ["SlateBlue", 106, 90, 205],
			"slategray" : ["SlateGray", 112, 128, 144],
			"snow" : ["Snow", 255, 250, 250],
			"springgreen" : ["SpringGreen", 0, 255, 127],
			"steelblue" : ["SteelBlue", 70, 130, 180],
			"tan" : ["Tan", 210, 180, 140],
			"teal" : ["Teal", 0, 128, 128],
			"thistle" : ["Thistle", 216, 191, 216],
			"tomato" : ["Tomato", 255, 99, 71],
			"turquoise" : ["Turquoise", 64, 224, 208],
			"violet" : ["Violet", 238, 130, 238],
			"wheat" : ["Wheat", 245, 222, 179],
			"white" : ["White", 255, 255, 255],
			"whitesmoke" : ["WhiteSmoke", 245, 245, 245],
			"yellow" : ["Yellow", 255, 255, 0],
			"yellowgreen" : ["YellowGreen", 154, 205, 50]
		}
	};

	// get the default colour set
	ColourManager.defaultSet = function() {
		return this.defaultColourSet;
	};

	// get the colour set for a given rule
	ColourManager.colourSet = function(ruleName) {
		var setNum = 0,
		    found = false,
		    resultList = [];

		// search for the named rule
		while (setNum < this.ruleMappingList.length && !found) {
			if (ruleName === this.ruleMappingList[setNum][0]) {
				found = true;
			}
			else {
				setNum += 1;
			}
		}

		// check if mapping found
		if (found) {
			resultList = this.colourSetList[this.ruleMappingList[setNum][1]].colours;
		}

		// return the colour list
		return resultList;
	};

	// add a mapping
	ColourManager.addRuleMapping = function(mapping) {
		this.ruleMappingList[this.ruleMappingList.length] = mapping;
	};

	// initialise the colour manager
	ColourManager.init = function() {
		var current = null,
		    numColourSets = 0,
		    i = 0,
		    n = 0;

		// initialised if not done already
		if (!this.initialised) {
			// mark intialised
			this.initialised = true;

			// build the default colour set
			n = 0;
			for (i = 0; i < 256; i += 1) {
				this.defaultColourSet[i] = this.defaultColours[n] << 16 | this.defaultColours[n + 1] << 8 | this.defaultColours[n + 2];
				n += 3;
			}

			// create LifeHistory colour set
			current = new ColourSet();
			current.add(0, 0, 0);
			current.add(0, 255, 0);
			current.add(0, 0, 128);
			current.add(216, 255, 216);
			current.add(255, 0, 0);
			current.add(255, 255, 0);
			current.add(96, 96, 96);
			current.add(255, 128, 128); // Niemiec state z
			this.colourSetList[numColourSets] = current;

			// create mapping to rules that use it
			ColourManager.addRuleMapping(["LifeHistory", numColourSets]);

			// next colour set
			numColourSets += 1;

			// create WireWorld colour set
			current = new ColourSet();
			current.add(48, 48, 48);
			current.add(0, 128, 255);
			current.add(255, 255, 255);
			current.add(255,128, 0);
			this.colourSetList[numColourSets] = current;

			// create mapping to rules that use it
			ColourManager.addRuleMapping(["WireWorld", numColourSets]);

			// next colour set
			numColourSets += 1;

			// create WWE colour set
			current = new ColourSet();
			current.add(0, 0, 0);
			current.add(255, 255, 255);
			current.add(144, 128, 112);
			current.add(144, 90, 45);
			current.add(192, 192, 192);
			current.add(255, 0, 0);
			current.add(255, 128, 0);
			current.add(255, 255, 0);
			current.add(0, 255, 0);
			current.add(0, 255, 208);
			current.add(0, 192, 255);
			current.add(0, 0, 255);
			current.add(192, 0, 255);
			current.add(255, 64, 160);
			current.add(112, 128, 144);
			current.add(0, 128, 0);
			current.add(0, 96, 128);
			current.add(160, 0, 80);
			current.add(40, 40, 40);
			current.add(220, 220, 220);
			current.add(140, 60, 0);
			current.add(0, 160, 0);
			current.add(160, 160, 250);
			this.colourSetList[numColourSets] = current;

			// create mapping to rules that use it
			ColourManager.addRuleMapping(["WWE", numColourSets]);
			ColourManager.addRuleMapping(["WWE2", numColourSets]);
			ColourManager.addRuleMapping(["WWEJ", numColourSets]);
			ColourManager.addRuleMapping(["WWEJ2", numColourSets]);
			ColourManager.addRuleMapping(["WWEJ3", numColourSets]);

			// next colour set
			numColourSets += 1;

			// create Novoloop colour set
			current = new ColourSet();
			current.add(30, 30, 30);
			current.add(0, 128, 128);
			current.add(0, 255, 0);
			current.add(255, 0, 0);
			current.add(255, 128, 0);
			current.add(255, 255, 0);
			current.add(128, 0, 128);
			current.add(128, 128, 128);
			current.add(255, 255, 255);
			current.add(128, 128, 255);
			this.colourSetList[numColourSets] = current;
			
			// create mapping to rules that use it
			ColourManager.addRuleMapping(["Novoloop", numColourSets]);

			// next colour set
			numColourSets += 1;

			// create the shapeloop colour set
			current = new ColourSet();
			current.add(0, 0, 0);
			current.add(255, 128, 0);
			current.add(255, 0, 0);
			current.add(0, 255, 0);
			current.add(0, 0, 255);
			current.add(0, 190, 0);
			current.add(0, 140, 0);
			current.add(255, 255, 255);
			current.add(80, 80, 80);
			current.add(95, 95, 95);
			current.add(128, 128, 128);
			current.add(0, 64, 0);
			current.add(255, 255, 0);
			current.add(64, 0, 164);
			current.add(64, 32, 64);
			current.add(80, 80, 100);
			current.add(95, 95, 125);
			current.add(128, 255, 128);
			current.add(64, 100, 100);
			this.colourSetList[numColourSets] = current;

			// create mapping to rules that use it
			ColourManager.addRuleMapping(["shapeloop", numColourSets]);
			ColourManager.addRuleMapping(["shapeloop-b", numColourSets]);
			ColourManager.addRuleMapping(["shapeloop2", numColourSets]);
			ColourManager.addRuleMapping(["shapeloop-ltd", numColourSets]);
			ColourManager.addRuleMapping(["2armshapeloop-a", numColourSets]);
			ColourManager.addRuleMapping(["2armshapeloop2-a", numColourSets]);
			ColourManager.addRuleMapping(["shapeloop2a-bounded", numColourSets]);
			ColourManager.addRuleMapping(["foodshapeloop", numColourSets]);
			ColourManager.addRuleMapping(["foodshapeloop2", numColourSets]);

			// next colour set
			numColourSets += 1;

			// create the shapeloop colour set
			current = new ColourSet();
			current.add(0, 0, 0);
			current.add(255, 255, 255);
			current.add(255, 0, 0);
			current.add(0, 128, 255);
			current.add(170, 0, 0);
			current.add(85, 0, 0);
			this.colourSetList[numColourSets] = current;

			// create mapping to rules that use it
			ColourManager.addRuleMapping(["b3s23mmg", numColourSets]);

			// next colour set
			numColourSets += 1;

			// create the colour set
			current = new ColourSet();
			current.add(0, 0, 0);
			current.add(255, 0, 0);
			current.add(0, 255, 0);
			current.add(0, 0, 255);
			current.add(255, 255, 0);
			current.add(0, 255, 255);
			current.add(255, 0, 255);
			current.add(92, 36, 110);
			current.add(0, 99, 140);
			current.add(176, 196, 222);
			current.add(115, 61, 26);
			this.colourSetList[numColourSets] = current;

			// create mapping to rules that use it
			ColourManager.addRuleMapping(["_235_4_O3", numColourSets]);
			ColourManager.addRuleMapping(["0_245_5_O4", numColourSets]);
			ColourManager.addRuleMapping(["0_245_5_O3", numColourSets]);
			ColourManager.addRuleMapping(["58_27_4_O3", numColourSets]);
			ColourManager.addRuleMapping(["0_24_4H_O3", numColourSets]);
			ColourManager.addRuleMapping(["2_235_4H_O3", numColourSets]);
			ColourManager.addRuleMapping(["24_235_4H_O3", numColourSets]);
			ColourManager.addRuleMapping(["3_25_4_O2", numColourSets]);
			ColourManager.addRuleMapping(["Snake_O5", numColourSets]);
			ColourManager.addRuleMapping(["Mites", numColourSets]);
			ColourManager.addRuleMapping(["Mites2", numColourSets]);
			ColourManager.addRuleMapping(["Mites3", numColourSets]);

			// next colour set
			numColourSets += 1;

			// create the colour set
			current = new ColourSet();
			current.add(48, 48, 48);
			current.add(255, 128, 0);
			current.add(0, 0, 255);
			current.add(32, 32, 255);
			current.add(64, 64, 255);
			current.add(96, 96, 255);
			this.colourSetList[numColourSets] = current;

			// create mapping to rules that use it
			ColourManager.addRuleMapping(["Alpha-1", numColourSets]);
		}
	};

	window["ColourManager"] = ColourManager;
}
());

