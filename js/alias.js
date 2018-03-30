// LifeViewer Alias
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// AliasManager singleton
	var AliasManager = {
		// list of alias/rule pairs
		aliases : []
	};

	// initialise Alias Manager
	AliasManager.init = function() {
		// clear the current list
		this.aliases = [];

		// add 2 state totalistic aliases
		this.aliases.push(["Totalistic", ""]);
		this.aliases.push(["", "B3/S23"]);
		this.aliases.push(["Conway's Life", "B3/S23"]);
		this.aliases.push(["2x2", "B36/S125"]);
		this.aliases.push(["34 Life", "B34/S34"]);
		this.aliases.push(["3-4 Life", "B34/S34"]);
		this.aliases.push(["Amoeba", "B357/S1358"]);
		this.aliases.push(["AntiLife", "B0123478/S01234678"]);
		this.aliases.push(["Assimilation", "B345/S4567"]);
		this.aliases.push(["Bacteria", "B34/S456"]);
		this.aliases.push(["Blinkers", "B345/S2"]);
		this.aliases.push(["Bugs", "B3567/S15678"]);
		this.aliases.push(["Coagulations", "B378/S235678"]);
		this.aliases.push(["Coral", "B3/S45678"]);
		this.aliases.push(["Corrosion of Conformity", "B3/S124"]);
		this.aliases.push(["Day & Night", "B3678/S34678"]);
		this.aliases.push(["Day and Night", "B3678/S34678"]);
		this.aliases.push(["Diamoeba", "B35678/S5678"]);
		this.aliases.push(["DotLife", "B3/S023"]);
		this.aliases.push(["DryLife", "B37/S23"]);
		this.aliases.push(["EightLife", "B3/S238"]);
		this.aliases.push(["Electrified Maze", "B45/S12345"]);
		this.aliases.push(["Flock", "B3/S12"]);
		this.aliases.push(["Fredkin", "B1357/S02468"]);
		this.aliases.push(["Gnarl", "B1/S1"]);
		this.aliases.push(["H-Trees", "B1/S012345678"]);
		this.aliases.push(["HighLife", "B36/S23"]);
		this.aliases.push(["HoneyLife", "B38/S238"]);
		this.aliases.push(["Holstein", "B35678/S4678"]);
		this.aliases.push(["Iceballs", "B25678/S5678"]);
		this.aliases.push(["InverseLife", "B012345678/S34678"]);
		this.aliases.push(["Land Rush", "B36/S234578"]);
		this.aliases.push(["Life without Death", "B3/S012345678"]);
		this.aliases.push(["Life", "B3/S23"]);
		this.aliases.push(["Live Free or Die", "B2/S0"]);
		this.aliases.push(["LongLife", "B345/S5"]);
		this.aliases.push(["Long Life", "B345/S5"]);
		this.aliases.push(["LowDeath", "B368/S238"]);
		this.aliases.push(["LowLife", "B3/S13"]);
		this.aliases.push(["Majority", "B45678/S5678"]);
		this.aliases.push(["Maze", "B3/S12345"]);
		this.aliases.push(["Maze with Mice", "B37/S12345"]);
		this.aliases.push(["Mazectric", "B3/S1234"]);
		this.aliases.push(["Mazectric with Mice", "B37/S1234"]);
		this.aliases.push(["Morley", "B368/S245"]);
		this.aliases.push(["Move", "B368/S245"]);
		this.aliases.push(["Pedestrian Life", "B38/S23"]);
		this.aliases.push(["Persian Rug", "B234/S"]);
		this.aliases.push(["Plow World", "B378/S012345678"]);
		this.aliases.push(["Pseudo Life", "B357/S238"]);
		this.aliases.push(["Replicator", "B1357/S1357"]);
		this.aliases.push(["Seeds", "B2/S"]);
		this.aliases.push(["Serviettes", "B234/S"]);
		this.aliases.push(["Slow Blob", "B367/S125678"]);
		this.aliases.push(["SnowLife", "B3/S1237"]);
		this.aliases.push(["Stains", "B3678/S235678"]);
		this.aliases.push(["Vote", "B5678/S45678"]);
		this.aliases.push(["Vote 4/5", "B4678/S35678"]);
		this.aliases.push(["Walled Cities", "B45678/S2345"]);

		// add 2-state isotropic non-totalistic aliases
		this.aliases.push(["Isotropic Non-Totalistic", ""]);
		this.aliases.push(["aLife", "B3/S234iw"]);
		this.aliases.push(["CB2", "B2ae4i/S1e2in"]);
		this.aliases.push(["DLife", "B3-n/S23"]);
		this.aliases.push(["GlideLife", "B34ek5ak/S2-c34z"]);
		this.aliases.push(["Goat Flock", "B2in3/S123a"]);
		this.aliases.push(["Just Friends", "B2-a/S12"]);
		this.aliases.push(["Kgdm", "B3/S2-c3-en4ceitz"]);
		this.aliases.push(["Salad", "B2i34c/S2-i3"]);
		this.aliases.push(["TauLife", "B3-nr/S2-i34-aij"]);
		this.aliases.push(["tDryLife", "B37/S2-i34q"]);
		this.aliases.push(["tHighLife", "B36/S2-i34q"]);
		this.aliases.push(["TLife", "B3/S2-i34q"]);

		// add Generations aliases
		this.aliases.push(["Generations", ""]);
		this.aliases.push(["Banners", "2367/3457/5"]);
		this.aliases.push(["BelZhab", "23/23/8"]);
		this.aliases.push(["BelZhab Sediment", "145678/23/8"]);
		this.aliases.push(["Bloomerang", "234/34678/24"]);
		this.aliases.push(["Bombers", "345/24/25"]);
		this.aliases.push(["Brain 6", "6/246/3"]);
		this.aliases.push(["Brian's Brain", "/2/3"]);
		this.aliases.push(["Burst", "0235678/3468/9"]);
		this.aliases.push(["BurstII", "235678/3468/9"]);
		this.aliases.push(["Caterpillars", "124567/378/4"]);
		this.aliases.push(["Chenille", "05678/24567/6"]);
		this.aliases.push(["Circuit Genesis", "2345/1234/8"]);
		this.aliases.push(["Cooties", "23/2/8"]);
		this.aliases.push(["Ebb&Flow", "012478/36/18"]);
		this.aliases.push(["Ebb&Flow II", "012468/37/18"]);
		this.aliases.push(["Faders", "2/2/25"]);
		this.aliases.push(["Fireworks", "2/13/21"]);
		this.aliases.push(["Flaming Starbows", "347/23/8"]);
		this.aliases.push(["Frogs", "12/34/3"]);
		this.aliases.push(["Frozen spirals", "356/23/6"]);
		this.aliases.push(["Glisserati", "035678/245678/7"]);
		this.aliases.push(["Glissergy", "035678/245678/5"]);
		this.aliases.push(["Lava", "12345/45678/8"]);
		this.aliases.push(["Lines", "012345/458/3"]);
		this.aliases.push(["LivingOn TheEdge", "345/3/6"]);
		this.aliases.push(["Meteor Guns", "01245678/3/8"]);
		this.aliases.push(["Nova", "45678/2478/25"]);
		this.aliases.push(["OrthoGo", "3/2/4"]);
		this.aliases.push(["Prairie on fire", "345/34/6"]);
		this.aliases.push(["RainZha", "2/23/8"]);
		this.aliases.push(["Rake", "3467/2678/6"]);
		this.aliases.push(["SediMental", "45678/25678/4"]);
		this.aliases.push(["Snake", "03467/25/6"]);
		this.aliases.push(["SoftFreeze", "13458/38/6"]);
		this.aliases.push(["Spirals", "2/234/5"]);
		this.aliases.push(["Star Wars", "345/2/4"]);
		this.aliases.push(["Sticks", "3456/2/6"]);
		this.aliases.push(["Swirl", "23/34/8"]);
		this.aliases.push(["ThrillGrill", "1234/34/48"]);
		this.aliases.push(["Transers", "345/26/5"]);
		this.aliases.push(["TransersII", "0345/26/6"]);
		this.aliases.push(["Wanderers", "345/34678/5"]);
		this.aliases.push(["Worms", "3467/25/6"]);
		this.aliases.push(["Xtasy", "1456/2356/16"]);
	};

	// return rule from alias
	AliasManager.getRuleFromAlias = function(alias) {
		// result
		var result = null,

		    // counter
		    i = 0;

		// convert the alias to lower case
		alias = alias.toLowerCase();

		// search the alias list
		while (i < this.aliases.length && result === null) {
			// check for category
			if (this.aliases[i][1] !== "") {
				// check if the alias name matches
				if (this.aliases[i][0].toLowerCase() === alias) {
					// get the associated rule
					result = this.aliases[i][1];
				}
			}

			// next alias
			i += 1;
		}

		// return the rule
		return result;
	};

	// return alias from rule
	AliasManager.getAliasFromRule = function(rule) {
		// result
		var result = null,

		    // counter
		    i = 0;

		// search the alias list
		while (i < this.aliases.length && result === null) {
			// check for category
			if (this.aliases[i][1] !== "") {
				// check if the rule name matches
				if (this.aliases[i][1] === rule) {
					// get the associated alias
					result = this.aliases[i][0];
				}
			}

			// next rule
			i += 1;
		}

		// return the alias
		return result;
	};

	// global interface
	window["AliasManager"] = AliasManager;
}
());

