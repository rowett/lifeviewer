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

		//this.aliases.push(["Hex Life", "B2o3m56/S2-p4oh"]);
		//this.aliases.push(["22da", "B2o/S2-m"]);
		//this.aliases.push(["Hexrule b2o", "B2o/S2m34"]);

		// add 2 state totalistic aliases
		this.aliases.push(["Totalistic Moore", ""]);
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
        this.aliases.push(["DrighLife", "B367/S23"]);
		this.aliases.push(["DryFlock", "B37/S12"]);
		this.aliases.push(["DryLife", "B37/S23"]);
		this.aliases.push(["DryLife without Death", "B37/S012345678"]);
		this.aliases.push(["EightFlock", "B3/S128"]);
		this.aliases.push(["EightLife", "B3/S238"]);
		this.aliases.push(["Electrified Maze", "B45/S12345"]);
		this.aliases.push(["Eppstein", "B35/S236"]);
		this.aliases.push(["Flock", "B3/S12"]);
		this.aliases.push(["Forest of Ls", "B168/S236"]);
		this.aliases.push(["Fredkin", "B1357/S02468"]);
		this.aliases.push(["Gems Minor", "B34578/S456"]);
		this.aliases.push(["Gems", "B3457/S4568"]);
		this.aliases.push(["Gnarl", "B1/S1"]);
		this.aliases.push(["H-Trees", "B1/S012345678"]);
		this.aliases.push(["HighFlock", "B36/S12"]);
		this.aliases.push(["HighLife", "B36/S23"]);
		this.aliases.push(["HighLife without Death", "B36/S012345678"]);
		this.aliases.push(["HoneyFlock", "B38/S128"]);
		this.aliases.push(["HoneyLife", "B38/S238"]);
		this.aliases.push(["Holstein", "B35678/S4678"]);
		this.aliases.push(["Iceballs", "B25678/S5678"]);
		this.aliases.push(["InverseLife", "B012345678/S34678"]);
		this.aliases.push(["IronFlock", "B36/S128"]);
		this.aliases.push(["IronLife", "B36/S238"]);
		this.aliases.push(["Land Rush", "B36/S234578"]);
		this.aliases.push(["Life without Death", "B3/S012345678"]);
		this.aliases.push(["Life", "B3/S23"]);
		this.aliases.push(["Live Free or Die", "B2/S0"]);
		this.aliases.push(["LongLife", "B345/S5"]);
		this.aliases.push(["Long Life", "B345/S5"]);
		this.aliases.push(["LowDeath without death", "B368/S012345678"]);
		this.aliases.push(["LowDeath", "B368/S238"]);
		this.aliases.push(["LowFlockDeath", "B368/S238"]);
		this.aliases.push(["LowLife", "B3/S13"]);
		this.aliases.push(["Majority", "B45678/S5678"]);
		this.aliases.push(["Maze", "B3/S12345"]);
		this.aliases.push(["Maze with Mice", "B37/S12345"]);
		this.aliases.push(["Mazectric", "B3/S1234"]);
		this.aliases.push(["Mazectric with Mice", "B37/S1234"]);
		this.aliases.push(["Morley", "B368/S245"]);
		this.aliases.push(["Move", "B368/S245"]);
		this.aliases.push(["Pedestrian Flock", "B38/S12"]);
		this.aliases.push(["Pedestrian Life", "B38/S23"]);
		this.aliases.push(["Pedestrian Life without Death", "B38/S012345678"]);
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

		// add hex rules
		this.aliases.push(["Totalistic Hex", ""]);
		this.aliases.push(["Fredkin Hex", "B135/S0246H"]);
		this.aliases.push(["Hexagonal Life", "B2/S34H"]);
		this.aliases.push(["HighHexLife", "B25/S34H"]);
		this.aliases.push(["Replicator Hex", "B135/S135H"]);

		// add 2-state isotropic non-totalistic aliases
		this.aliases.push(["Isotropic Non-Totalistic Moore", ""]);
		this.aliases.push(["15Life", "B34r/S23-q4et"]);
		this.aliases.push(["38life", "B35y/S2-n35k6ci"]);
		this.aliases.push(["aLife", "B3/S234iw"]);
		this.aliases.push(["Arcane Circuitry", "B2ci3aikr/S1e2-a3i"]);
		this.aliases.push(["Arrow", "B3-jkn4a/S1e2-a3ijnry4n"]);
		this.aliases.push(["ATPP", "B3-ckq4z/S2-c3-a4iq5k6k"]);
		this.aliases.push(["Banks-I", "B3e4ejr5cinqy6-ei78/S012-e3-ajk4-akqw5-ajk6-e78"]);
		this.aliases.push(["Banks-III", "B2ce3e4jr5cin6-en7c8/S012-ac3-cn4-eikny5-kr67c8"]);
		this.aliases.push(["Best Friends", "B2ce3aiy/S12aei3r"]);
		this.aliases.push(["Blocks for Days", "B2-ae3-cij4a5aj6e7e8/S01e2ai3ar4ar5air6ae7c8"]);
		this.aliases.push(["Bubbles", "B3ai4-a/S23"]);
		this.aliases.push(["Butterfly", "B2i34e6i7c/S2-i36n"]);
		this.aliases.push(["Buzz", "B2i35-n/S2-ci36k8"]);
		this.aliases.push(["CB2", "B2ae4i/S1e2in"]);
		this.aliases.push(["cetlife", "B34cet/S234jkwyz"]);
		this.aliases.push(["Conway++", "B3/S234c"]);
		this.aliases.push(["Conway+-1", "B3/S23-inqy4aikqtwz"]);
		this.aliases.push(["Conway+-2", "B3/S2-ak34aikqtwz5inqy"]);
		this.aliases.push(["Conway--", "B3/S2-ei3"]);
		this.aliases.push(["Diamonds", "B2en3ij4a5e7e8/S1c2cek3-a4aiqw5aky"]);
		this.aliases.push(["DLife", "B3-n/S23"]);
		this.aliases.push(["Dominoplex", "B2cen3ek4ejkwz5-ein6an7e8/S12an3-eijq4enrty5e6k"]);
		this.aliases.push(["Dry15Life", "B34r7/S23-q4et"]);
		this.aliases.push(["DryGoats", "B2in37/S123a"]);
		this.aliases.push(["Eatsplosion", "B2n3-ekqy4c5e/S2-cn3-eky4aij5e"]);
		this.aliases.push(["EightGoats", "B2in3/S123a8"]);
		this.aliases.push(["Emitters", "B2i3ai4cei5c6c7/S2-ae3acein4-t5-aq6cei7c8"]);
		this.aliases.push(["FattyLife", "B3-n4nt5qr6i/S23"]);
		this.aliases.push(["FishLife", "B3-ekqr4nt5r6i/S02-c3"]);
		this.aliases.push(["FogLife", "B35eq7/S2-i34q"]);
		this.aliases.push(["GlideLife", "B34ek5ak/S2-c34z"]);
		this.aliases.push(["GliderGlut", "B2k3aijn4ak5y6k/S2ae3ajnr4aiw"]);
		this.aliases.push(["Goat Flock", "B2in3/S123a"]);
		this.aliases.push(["Goats", "B2in3/S123a"]);
		this.aliases.push(["Goldilocks I", "B2ek3cei4acjr5c8/S02ack3kn4aen"]);
		this.aliases.push(["guntlife", "B35j6a/S2-i34q"]);
		this.aliases.push(["hatlife", "B35y/S23"]);
		this.aliases.push(["High15Life", "B34r6/S23-q4et"]);
		this.aliases.push(["HighGoats", "B2in36/S123a"]);
		this.aliases.push(["hlife3", "B3/S2-in34iw"]);
		this.aliases.push(["HoneyGoats", "B2in38/S123a8"]);
		this.aliases.push(["HouseLife", "B2i3/S23-r"]);
		this.aliases.push(["Hype", "B2-ac3aei4ae6i8/S23-ejq8"]);
		this.aliases.push(["IceNine", "B3aeiy4ae5i68/S2-in3-kqr4artz5aeny6-e78"]);
		this.aliases.push(["IronGoats", "B2in36/S123a8"]);
		this.aliases.push(["Just Friends", "B2-a/S12"]);
		this.aliases.push(["Kgdm", "B3/S2-c3-en4ceitz"]);
		this.aliases.push(["klife", "B34n/S23"]);
		this.aliases.push(["Knyght", "B2e3/S23-jq"]);
		this.aliases.push(["Linea", "B2-a3-i/S23-a"]);
		this.aliases.push(["Movero VIII", "B2-a5k6n7c/S12-i3ij4k5j8"]);
		this.aliases.push(["Movostill", "B2i3acijk6i/S23-a4"]);
		this.aliases.push(["Movostill 2", "B3acijk/S23-a4"]);
		this.aliases.push(["Movostill 3", "B2e3aceij5-ijr/S23-a4"]);
		this.aliases.push(["Niemiec's Rule 0", "B3/S2ae3aeijr4-cknqy"]);
		this.aliases.push(["Omosso", "B2k3acijr4ijqy6i7c/S2aek3ijnqr4it5n"]);
		this.aliases.push(["Pedestrian Goats", "B2in38/S123a"]);
		this.aliases.push(["Pi-plicator", "B3-ckq/S2-c34ci"]);
		this.aliases.push(["PiLife", "B37e/S23"]);
		this.aliases.push(["PondLife", "B36i/S2-i35i"]);
		this.aliases.push(["pre-X-rule", "B2cei3ci4jnr5ikn/S12-ck4einqy5er6aei8"]);
		this.aliases.push(["PlasmaLife", "B34-air/S234-air"]);
		this.aliases.push(["reptlife", "B36-k/S2-i34q"]);
		this.aliases.push(["RustyLife", "B34-ai/S24-air5-a"]);
		this.aliases.push(["Salad", "B2i34c/S2-i3"]);
		this.aliases.push(["Scenery", "B3-cnry4-acery5i/S23-a4-jknqr5y8"]);
		this.aliases.push(["SharkLife", "B34aeiz/S2-ak34ant6cek"]);
		this.aliases.push(["SilverLife", "B367/S2-i34q"]);
		this.aliases.push(["SlugWorld", "B2e3ai4arw5678/S3-an4ar5i678"]);
		this.aliases.push(["Snowflakes", "B2ci3ai4c8/S02ae3eijkq4iz5ar6i7e"]);
		this.aliases.push(["Snowflakes 2", "B2ci3ai4c8/S02ae3eijkq4aiz5ar6i7e"]);
		this.aliases.push(["SparkLife", "B36i/S234j"]);
		this.aliases.push(["StairWorld", "B2-a3i4aijk/S2a3-i4"]);
		this.aliases.push(["Suns", "B2ei3aeij4cjt5ky6ei/S1c2ace3jkn4aeijktw5ekry6in7e"]);
		this.aliases.push(["TauLife", "B3-nr/S2-i34-aij"]);
		this.aliases.push(["tceclife", "B36ce7c/S2-i34q"]);
		this.aliases.push(["tDryFlock", "B37/S12-i4q"]);
		this.aliases.push(["tDryLife", "B37/S2-i34q"]);
		this.aliases.push(["tEightLife", "B3/S2-i34q8"]);
		this.aliases.push(["tflock", "B3/S12-i4q"]);
		this.aliases.push(["tHighFlock", "B36/S12-i4q"]);
		this.aliases.push(["tHighLife", "B36/S2-i34q"]);
		this.aliases.push(["tlife", "B3/S2-i34q"]);
		this.aliases.push(["tPedestrianFlock", "B38/S12-i4q"]);
		this.aliases.push(["tPedestrianLife", "B38/S2-i34q"]);
		this.aliases.push(["Train", "B34t6k8/S2-i35a7e"]);
		this.aliases.push(["Turro", "B2-a3c/S12-i"]);
		this.aliases.push(["Twinkles", "B2in34-a/S1e2ekn34ent"]);
		this.aliases.push(["tDryLife", "B37/S2-i34q"]);
		this.aliases.push(["tHighLife", "B36/S2-i34q"]);
		this.aliases.push(["TLife", "B3/S2-i34q"]);
		this.aliases.push(["Wild Seas", "B2c3-cekq4ikt5i8/S2-in3-acky4aijry5eiky6i"]);
		this.aliases.push(["X-rule-pre", "B2cei3ci4jnr5ikn/S12aen3c4einqy5er6aei8"]);

		// add Generations aliases
		this.aliases.push(["Generations", ""]);
		this.aliases.push(["Banners", "2367/3457/5"]);
		this.aliases.push(["BelZhab", "23/23/8"]);
		this.aliases.push(["BelZhab Sediment", "145678/23/8"]);
		this.aliases.push(["Bloomerang", "234/34678/24"]);
		this.aliases.push(["Bombers", "345/24/25"]);
		this.aliases.push(["Brain 5", "/2/5"]);
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
		this.aliases.push(["Free Star", "0345/2/10"]);
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
		this.aliases.push(["Sliders", "012-e3-ae4acnqyz5acer6acn78/3j4-eikq5c/3"]);
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

		// add LtL aliases
		this.aliases.push(["Larger than Life", ""]);
		this.aliases.push(["Balloons", "R2,C2,M1,S7..10,B7..11,NM"]);
		this.aliases.push(["Bosco's Rule", "R5,C2,M1,S34..58,B34..45,NM"]);
		this.aliases.push(["Bugs R3", "R3,C2,M1,S14..23,B14..18,NM"]);
		this.aliases.push(["Bugs R7", "R7,C2,M1,S63..108,B63..84,NM"]);
		this.aliases.push(["Bugsmovie", "R10,C2,M1,S123..212,B123..170,NM"]);
		this.aliases.push(["Globe", "R8,C2,M1,S163..223,B74..252,NM"]);
		//this.aliases.push(["Majority", "R4,C2,M1,S41..81,B41..80,NM"]);
		this.aliases.push(["Majorly", "R7,C2,M1,S113..225,B113..224,NM"]);
		this.aliases.push(["Rasta Bugs", "R5,C2,M1,S41..59,B32..50,NM"]);
		this.aliases.push(["Suicidal Bugs", "R5,C2,M1,S37..59,B33..49,NM"]);
		this.aliases.push(["Soldier Bugs", "R7,C2,M1,S65..114,B65..95,NM"]);
		this.aliases.push(["Waffle", "R7,C2,M1,S100..200,B75..170,NM"]);

		// add HROT aliases
		this.aliases.push(["HROT", ""]);
		this.aliases.push(["Fredkin R2", "R2,C2,S0,2,4,6,8,10,12,14,16,18,20,22,24,B1,3,5,7,9,11,13,15,17,19,21,23,NM"]);
		this.aliases.push(["Fredkin R3", "r3b555555555555saaaaaaaaaaaaz"]);
		this.aliases.push(["Fredkin R4", "r4b55555555555555555555saaaaaaaaaaaaaaaaaaaaz"]);
		this.aliases.push(["Replicator R2", "r2b555555s555555"]);
		this.aliases.push(["Replicator R3", "r3b555555555555s555555555555"]);
		this.aliases.push(["Replicator R4", "r4b55555555555555555555s55555555555555555555"]);
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

