// LifeViewer Alias
// Manages rule aliases.

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

	// AliasManager singleton
	var AliasManager = {
		// list of alias/rule pairs
		/** @type {Array} */ aliases : [],

		// list of help section names
		/** @type {Array<string>} */ sectionNames : []
	};

	// initialise Alias Manager
	AliasManager.init = function() {
		var	/** @type {string} */ currentDef = "",
			/** @type {string} */ currentName = "",
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {Array} */ a = null,
			/** @type {Array} */ s = null;

		// clear the current lists
		this.aliases = [];
		this.sectionNames = [];
		a = this.aliases;
		s = this.sectionNames;

		// add Wolfram aliases
		s.push("1D");
		a.push(["Wolfram 1D", ""]);
		a.push(["Brownian motion", "W54"]);
		a.push(["Fishing-net", "W110"]);
		a.push(["Heavy triangles", "W22"]);
		a.push(["Linear A", "W90"]);
		a.push(["Linear B", "W150"]);
		a.push(["Pascal's Triangle", "W18"]);
		a.push(["Randomizer 1", "W30"]);
		a.push(["Randomizer 2", "W45"]);
		a.push(["Wolfram 22", "W22"]);
		a.push(["Wolfram 30", "W30"]);
		a.push(["Wolfram 110", "W110"]);

		// add Margolus aliases
		s.push("Margolus");
		a.push(["Margolus", ""]);
		a.push(["BBM", "M0,8,4,3,2,5,9,7,1,6,10,11,12,13,14,15"]);
		a.push(["BounceGas", "M0,8,4,3,2,5,9,14,1,6,10,13,12,11,7,15"]);
		a.push(["BounceGasII", "M0,8,4,12,2,10,9,7,1,6,5,11,3,13,14,15"]);
		a.push(["Critters", "M15,14,13,3,11,5,6,1,7,9,10,2,12,4,8,0"]);
		a.push(["HPP_Gas", "M0,8,4,12,2,10,9,14,1,6,5,13,3,11,7,15"]);
		a.push(["MargSingRot", "M0,2,8,3,1,5,6,7,4,9,10,11,12,13,14,15"]);
		a.push(["Rotations", "M0,2,8,12,1,10,9,11,4,6,5,14,3,7,13,15"]);
		a.push(["RotationsII", "M0,2,8,12,1,10,9,13,4,6,5,7,3,14,11,15"]);
		a.push(["RotationsIII", "M0,4,1,10,8,3,9,11,2,6,12,14,5,7,13,15"]);
		a.push(["RotationsIV", "M0,4,1,12,8,10,6,14,2,9,5,13,3,11,7,15"]);
		a.push(["Sand", "M0,4,8,12,4,12,12,13,8,12,12,14,12,13,14,15"]);
		a.push(["StringThing", "M0,1,2,12,4,10,9,7,8,6,5,11,3,13,14,15"]);
		a.push(["StringThingII", "M0,1,2,12,4,10,6,7,8,9,5,11,3,13,14,15"]);
		a.push(["SwapOnDiag", "M0,8,4,12,2,10,6,14,1,9,5,13,3,11,7,15"]);
		a.push(["Tron", "M15,1,2,3,4,5,6,7,8,9,10,11,12,13,14,0"]);

		// add PCA aliases
		s.push("PCA");
		a.push(["PCA", ""]);
		a.push(["Model_1", "2PCA4,0,4,8,3,1,10,6,7,2,9,5,11,12,13,14,15"]);
		a.push(["Model_2", "2PCA4,0,4,8,3,1,10,6,11,2,9,5,13,12,14,7,15"]);
		a.push(["PCA_1", "2PCA4,0,4,8,3,1,10,6,7,2,9,5,11,12,13,14,15"]);
		a.push(["PCA_2", "2PCA4,0,2,4,3,8,10,6,7,1,9,5,11,12,13,14,15"]);
		a.push(["PCA_3", "2PCA4,0,8,1,3,2,5,6,7,4,9,10,11,12,13,14,15"]);
		a.push(["PCA_4", "2PCA4,0,2,4,12,8,5,9,7,1,6,10,11,3,13,14,15"]);
		a.push(["PCA_5", "2PCA4,0,4,8,3,1,10,6,11,2,9,5,13,12,14,7,15"]);
		a.push(["PCA_6", "2PCA4,0,2,4,3,8,10,6,14,1,9,5,7,12,11,13,15"]);
		a.push(["PCA_7", "2PCA4,0,2,4,12,8,5,9,14,1,6,10,7,3,11,13,15"]);
		a.push(["PCA_8", "2PCA4,0,2,4,12,8,10,9,14,1,6,5,7,3,11,13,15"]);
		a.push(["PCA_9", "2PCA4,0,2,4,12,8,10,9,13,1,6,5,14,3,7,11,15"]);
		a.push(["PCA_10", "2PCA4,0,1,2,3,4,5,6,13,8,9,10,14,12,7,11,15"]);
		a.push(["PCA_11", "2PCA4,0,4,8,3,1,10,6,11,2,9,5,11,13,12,14,15"]);
		a.push(["PCA_12", "2PCA4,0,4,2,3,14,6,11,5,8,7,9,13,10,12,1,15"]);

		// add 2-state totalistic von Neumann aliases
		s.push("OT vN");
		a.push(["Outer-Totalistic von Neumann", ""]);
		a.push(["Fredkin2", "B13/S024V"]);
		a.push(["LifeV", "B3/S23V"]);
		a.push(["Parity", "B13/S13V"]);

		// add 2-state totalistic Hex aliases
		s.push("OT Hex");
		a.push(["Outer-Totalistic Hex", ""]);
		a.push(["HexParity", "B135/S0246H"]);
		a.push(["Hexagonal Life", "B2/S34H"]);
		a.push(["HighHexLife", "B25/S34H"]);
		a.push(["LifeH", "B3/S23H"]);
		a.push(["Replicator Hex", "B135/S135H"]);

		// add 2 state totalistic Moore aliases
		s.push("OT M");
		a.push(["Outer-Totalistic Moore", ""]);
		a.push(["", "B3/S23"]);
		a.push(["2x2", "B36/S125"]);
		a.push(["2x2 2", "B3678/S1258"]);
		a.push(["34 Life", "B34/S34"]);
		a.push(["3-4 Life", "B34/S34"]);
		a.push(["Amoeba", "B357/S1358"]);
		a.push(["Anneal", "B4678/S35678"]);
		a.push(["AntiLife", "B0123478/S01234678"]);
		a.push(["Assimilation", "B345/S4567"]);
		a.push(["Bacteria", "B34/S456"]);
		a.push(["Blinkers", "B345/S2"]);
		a.push(["Bugs", "B3567/S15678"]);
		a.push(["Castles", "B3678/S135678"]);
		a.push(["Cheerios", "B35678/S34567"]);
		a.push(["Christmas Life", "B1/S012345678"]);
		a.push(["Coagulations", "B378/S235678"]);
		a.push(["Conway", "B3/S23"]);
		a.push(["Conway's Game of Life", "B3/S23"]);
		a.push(["Conway's Life", "B3/S23"]);
		a.push(["Coral", "B3/S45678"]);
		a.push(["Corrosion of Conformity", "B3/S124"]);
		a.push(["Dance", "B34/S35"]);
		a.push(["Day & Night", "B3678/S34678"]);
		a.push(["Day and Night", "B3678/S34678"]);
		a.push(["Diamoeba", "B35678/S5678"]);
		a.push(["DotLife", "B3/S023"]);
		a.push(["DrighLife", "B367/S23"]);
		a.push(["DryFlock", "B37/S12"]);
		a.push(["DryLife", "B37/S23"]);
		a.push(["DryLife without Death", "B37/S012345678"]);
		a.push(["EightFlock", "B3/S128"]);
		a.push(["EightLife", "B3/S238"]);
		a.push(["Electrified Maze", "B45/S12345"]);
		a.push(["Eppstein", "B35/S236"]);
		a.push(["Feux", "B1358/S0247"]);
		a.push(["Flakes", "B3/S012345678"]);
		a.push(["Flock", "B3/S12"]);
		a.push(["Forest of Ls", "B168/S236"]);
		a.push(["Fredkin", "B1357/S02468"]);
		a.push(["Fuzz", "B1/S014567"]);
		a.push(["Gems Minor", "B34578/S456"]);
		a.push(["Gems", "B3457/S4568"]);
		a.push(["Geology", "B3578/S24678"]);
		a.push(["Gnarl", "B1/S1"]);
		a.push(["Grounded Life", "B35/S23"]);
		a.push(["H-Trees", "B1/S012345678"]);
		a.push(["HighFlock", "B36/S12"]);
		a.push(["HighLife", "B36/S23"]);
		a.push(["HighLife without Death", "B36/S012345678"]);
		a.push(["Holstein", "B35678/S4678"]);
		a.push(["HoneyFlock", "B38/S128"]);
		a.push(["HoneyLife", "B38/S238"]);
		a.push(["Iceballs", "B25678/S5678"]);
		a.push(["InverseLife", "B012345678/S34678"]);
		a.push(["Invertamaze", "B028/S0124"]);
		a.push(["IronFlock", "B36/S128"]);
		a.push(["IronLife", "B36/S238"]);
		a.push(["Land Rush", "B36/S234578"]);
		a.push(["Life SkyHigh", "B368/S236"]);
		a.push(["Life without Death", "B3/S012345678"]);
		a.push(["Life", "B3/S23"]);
		a.push(["Live Free or Die", "B2/S0"]);
		a.push(["Logarithmic replicator rule", "B36/S245"]);
		a.push(["LongLife", "B345/S5"]);
		a.push(["Long Life", "B345/S5"]);
		a.push(["LowDeath without death", "B368/S012345678"]);
		a.push(["LowDeath", "B368/S238"]);
		a.push(["LowFlockDeath", "B368/S128"]);
		a.push(["LowLife", "B3/S13"]);
		a.push(["Majority", "B45678/S5678"]);
		a.push(["Maze", "B3/S12345"]);
		a.push(["Maze with Mice", "B37/S12345"]);
		a.push(["Mazectric", "B3/S1234"]);
		a.push(["Mazectric with Mice", "B37/S1234"]);
		a.push(["Morley", "B368/S245"]);
		a.push(["Move", "B368/S245"]);
		a.push(["Neon Blobs", "B08/S4"]);
		a.push(["Never happy", "B345/S0456"]);
		a.push(["Oscillators Rule", "B45/S1235"]);
		a.push(["Pedestrian Flock", "B38/S12"]);
		a.push(["Pedestrian Life", "B38/S23"]);
		a.push(["Pedestrian Life without Death", "B38/S012345678"]);
		a.push(["Persian Rug", "B234/S"]);
		a.push(["Plow World", "B378/S012345678"]);
		a.push(["Pseudo Life", "B357/S238"]);
		a.push(["Pulsar Life", "B3/S238"]);
		a.push(["Replicator", "B1357/S1357"]);
		a.push(["Replicator 2", "B1357/S02468"]);
		a.push(["Rings 'n' Slugs", "B56/S14568"]);
		a.push(["Seeds", "B2/S"]);
		a.push(["Serviettes", "B234/S"]);
		a.push(["Shoots and Roots", "B3/S245678"]);
		a.push(["Slow Blob", "B367/S125678"]);
		a.push(["Snakeskin", "B1/S134567"]);
		a.push(["Solid islands grow amongst static","B12678/S15678"]);
		a.push(["SnowLife", "B3/S1237"]);
		a.push(["Stains", "B3678/S235678"]);
		a.push(["Star Trek", "B3/S0248"]);
		a.push(["Virus", "B36/S235"]);
		a.push(["Vote", "B5678/S45678"]);
		a.push(["Vote 4/5", "B4678/S35678"]);
		a.push(["Walled Cities", "B45678/S2345"]);

		// add 2-state totalistic Triangular aliases
		s.push("OT Tri");
		a.push(["Outer-Totalistic Triangular", ""]);
		a.push(["Life 2333", "B3/S23L"]);
		a.push(["Life 2345", "B45/S23L"]);
		a.push(["Life 2346", "B456/S23L"]);
		a.push(["Life 3445", "B45/S34L"]);
		a.push(["Life 3446", "B456/S34L"]);
		a.push(["Life 4546", "B456/S45L"]);
		a.push(["Life 4644", "B4/S456L"]);
		a.push(["Rule 1246", "B456/S12L"]);
		a.push(["Rule 3544", "B4/S345L"]);

		// add outer-totalistic Moore Generations aliases
		s.push("OT M G");
		a.push(["Outer-Totalistic Generations Moore", ""]);
		a.push(["9:43 at Knight", "237/34578/4"]);
		a.push(["Banners", "2367/3457/5"]);
		a.push(["BelZhab", "23/23/8"]);
		a.push(["BelZhab Sediment", "145678/23/8"]);
		a.push(["Bloomerang", "234/34678/24"]);
		a.push(["Bombers", "345/24/25"]);
		a.push(["Brain 5", "/2/5"]);
		a.push(["Brain 6", "6/246/3"]);
		a.push(["Brian's Brain", "/2/3"]);
		a.push(["Burst", "0235678/3468/9"]);
		a.push(["BurstII", "235678/3468/9"]);
		a.push(["Caterpillars", "124567/378/4"]);
		a.push(["Chenille", "05678/24567/6"]);
		a.push(["Circuit Genesis", "2345/1234/8"]);
		a.push(["Constellations", "/23/3"]);
		a.push(["Cooties", "23/2/8"]);
		a.push(["Diamonds and Spaceships", "34578/257/16"]);
		a.push(["Ebb&Flow", "012478/36/18"]);
		a.push(["Ebb&Flow II", "012468/37/18"]);
		a.push(["Faders", "2/2/25"]);
		a.push(["Fireballs", "346/2/4"]);
		a.push(["Fireworks", "2/13/21"]);
		a.push(["Flaming Starbows", "347/23/8"]);
		a.push(["Free Star", "0345/2/10"]);
		a.push(["Frogs", "12/34/3"]);
		a.push(["Frozen spirals", "356/23/6"]);
		a.push(["GeneroLife", "2356/3567/4"]);
		a.push(["Glisserati", "035678/245678/7"]);
		a.push(["Glissergy", "035678/245678/5"]);
		a.push(["Lava", "12345/45678/8"]);
		a.push(["Lines", "012345/458/3"]);
		a.push(["LivingOn TheEdge", "345/3/6"]);
		a.push(["Meteor Guns", "01245678/3/8"]);
		a.push(["Nova", "45678/2478/25"]);
		a.push(["OrthoGo", "3/2/4"]);
		a.push(["Prairie on fire", "345/34/6"]);
		a.push(["RainZha", "2/23/8"]);
		a.push(["Rake", "3467/2678/6"]);
		a.push(["SediMental", "45678/25678/4"]);
		a.push(["Snake", "03467/25/6"]);
		a.push(["SoftFreeze", "13458/38/6"]);
		a.push(["Spirals", "2/234/5"]);
		a.push(["Star Wars", "345/2/4"]);
		a.push(["Sticks", "3456/2/6"]);
		a.push(["Swirl", "23/34/8"]);
		a.push(["Tadpoles", "0125678/345678/64"]);
		a.push(["ThrillGrill", "1234/34/48"]);
		a.push(["Transers", "345/26/5"]);
		a.push(["TransersII", "0345/26/6"]);
		a.push(["Transers 2", "0345/26/6"]);
		a.push(["Transers 3", "0345/26/7"]);
		a.push(["Wallplicators", "345/25678/7"]);
		a.push(["Wanderers", "345/34678/5"]);
		a.push(["Worms", "3467/25/6"]);
		a.push(["Xtasy", "1456/2356/16"]);

		// add 2-state isotropic non-totalistic Hex aliases
		s.push("INT Hex");
		a.push(["Isotropic Non-Totalistic Hex", ""]);
		a.push(["Hex Life", "B2o3m56/S2-p4oH"]);
		a.push(["Hex Inverse Fire", "B2-m4-m56/S2m34m56H"]);
		a.push(["HexLife", "B3o/S234-o6H"]);
		a.push(["22da", "B2/S2-mH"]);
		a.push(["Hexrule b2o", "B2o/S2m34H"]);

		// add 2-state isotropic non-totalistic Moore aliases
		s.push("INT M");
		a.push(["Isotropic Non-Totalistic Moore", ""]);
		a.push(["15Life", "B34r/S23-q4et"]);
		a.push(["104life", "B34ky5cy/S23-a4ity6c7"]);
		a.push(["22k", "B2-k/S2-k"]);
		a.push(["2diagonal", "B2n3/S23"]);
		a.push(["2xpand2", "B3/S123eik4ce"]);
		a.push(["3x3", "B35cky68/S0245-c6n"]);
		a.push(["38life", "B35y/S2-n35k6ci"]);
		a.push(["4diagonal", "B34c/S23"]);
		a.push(["4life", "B34jy/S23"]);
		a.push(["4life2", "B34j/S23"]);
		a.push(["57life", "B34tyz5cy/S23-a4it5ej"]);
		a.push(["acnelife", "B34/S2eik3"]);
		a.push(["aLife", "B3/S234iw"]);
		a.push(["Arcane Circuitry", "B2ci3aikr/S1e2-a3i"]);
		a.push(["Arrow", "B3-jkn4a/S1e2-a3ijnry4n"]);
		a.push(["Artillery", "B3-y7/S2-i3-c4kqt"]);
		a.push(["Atomic", "B2ei3i/S1c2-n3jr4an5i6c"]);
		a.push(["ATPP", "B3-ckq4z/S2-c3-a4iq5k6k"]);
		a.push(["B - ibis", "B2n34cyz6n8/S2-n3-a4cq68"]);
		a.push(["Banks-I", "B3e4ejr5cinqy6-ei78/S012-e3-ajk4-akqw5-ajk6-e78"]);
		a.push(["Banks-III", "B2ce3e4jr5cin6-en7c8/S012-ac3-cn4-eikny5-kr67c8"]);
		a.push(["Beaecsizae", "B34ce/S12-a3"]);
		a.push(["Ben's rule", "B2-ak3einqy4e/S1c2ak3inqy4e"]);
		a.push(["Best Friends", "B2ce3aiy/S12aei3r"]);
		a.push(["Bigship", "B2ei3einqy4ny5ajkr/S23ajkr4jnry5inqy"]);
		a.push(["Bgunlife", "B34eny5e/S23-a4iy5e6c"]);
		a.push(["Billiard", "B36-e/S12345"]);
		a.push(["Blasts", "B2e3airy4kt5jr6c8/S02ace3eiknr4-aj5-cei6-a78"]);
		a.push(["BlinkBlink", "B35ky/S234y"]);
		a.push(["Blocks for Days", "B2-ae3-cij4a5aj6e7e8/S01e2ai3ar4ar5air6ae7c8"]);
		a.push(["blockandglider", "B3/S234cw7c"]);
		a.push(["Blockship", "B3-cer4ceqwz5acek6in78/S2-in3-eq4eqwyz5eikn678"]);
		a.push(["BoatLife", "B3-knqy/S2-n3-ey4akwy5aik6kn"]);
		a.push(["boatLife", "B3ainqy4aeq5ejn8/S2-in3-aek4aciq5ae6-c7c8"]);
		a.push(["bpuff", "B3/S23-cky4k7e8"]);
		a.push(["Breps", "B34cqy5c/S23-y4y"]);
		a.push(["Breps-2", "B3aeijn4n8/S234iqz"]);
		a.push(["Bricks", "B2ak5c/S2cn3inqy4aikqtwz5inqy"]);
		a.push(["Bubbles", "B3ai4-a/S23"]);
		a.push(["Butterfly", "B2i34e6i7c/S2-i36n"]);
		a.push(["butterflyb7", "B2i34e6i7/S2-i36n"]);
		a.push(["Buzz", "B2i35-n/S2-ci36k8"]);
		a.push(["CapLife", "B36c/S23"]);
		a.push(["CarrierLife", "B2e3aceik/S23"]);
		a.push(["Cataverters", "B3-cen/S234eijkrw5cry6ik"]);
		a.push(["cb2", "B2ae4i/S1e2in"]);
		a.push(["cetlife", "B34cet/S234jkwyz"]);
		a.push(["Clouds", "B2e3aceij/S23-a4"]);
		a.push(["Cloudsdale", "B2kn3-ekqr4i5eq6n8/S23-aeny4cikqr5ek6ace7c"]);
		a.push(["CommonRepl", "B3/S23-ac4eiy6"]);
		a.push(["Conquerors and Colonizers", "B2ace3acei4ace5acei6ace/S"]);
		a.push(["Conway++", "B3/S234c"]);
		a.push(["Conway+-1", "B3/S23-inqy4aikqtwz"]);
		a.push(["Conway+-2", "B3/S2-ak34aikqtwz5inqy"]);
		a.push(["Conway--", "B3/S2-ei3"]);
		a.push(["crawl", "B37e/S2-i34y8"]);
		a.push(["Creperie", "B2ikn3aijn/S23-ckqy"]);
		a.push(["CrossLife", "B3/S234et"]);
		a.push(["Crylife", "B2n3-cry4kn6i7c/S23-a4i6c"]);
		a.push(["DenseLife", "B3-q4y/S234z"]);
		a.push(["Diamoeral", "B2n3ai4a78/S35678"]);
		a.push(["Diamonds", "B2en3ij4a5e7e8/S1c2cek3-a4aiqw5aky"]);
		a.push(["DirtyLife", "B3-cky5aq6ci7c/S23-ck4n6k7e"]);
		a.push(["DLife", "B3-n/S23"]);
		a.push(["dolife", "B2-ak3acei4ceqz5y/S234ce5ceky78"]);
		a.push(["dolife2", "B2-a3acei4ceqz5y/S234ce5ceky78"]);
		a.push(["Dominoplex", "B2cen3ek4ejkwz5-ein6an7e8/S12an3-eijq4enrty5e6k"]);
		a.push(["Dry15Life", "B34r7/S23-q4et"]);
		a.push(["DryGoats", "B2in37/S123a"]);
		a.push(["Dustclouds01", "B2ce3-ai/S01"]);
		a.push(["Dustclouds03", "B2ce3-ai/S03"]);
		a.push(["EasyHighLife", "B36-i/S23"]);
		a.push(["Eatsplosion", "B2n3-ekqy4c5e/S2-cn3-eky4aij5e"]);
		a.push(["Eatsplosion IV", "B2n3-q4aqz6n8/S2-in3-q4iz7c8"]);
		a.push(["EightGoats", "B2in3/S123a8"]);
		a.push(["Einstein", "B2ein3cijn4cnrwy5cnq6e/S1c2-ai3acny4anqy5c6ek8"]);
		a.push(["ElectrumLife", "B367c/S2-i34q"]);
		a.push(["Emitters", "B2i3ai4cei5c6c7/S2-ae3acein4-t5-aq6cei7c8"]);
		a.push(["Extension", "B2cei3-ijnr4-a6i/S12-cn"]);
		a.push(["fakePiShipLife", "B3-ck4e5k6i/S2-in35i6c8"]);
		a.push(["FalseB5", "B35ce/S234jqtyz6k8"]);
		a.push(["Farespa", "B34ck5/S23aceik4aci"]);
		a.push(["FattyLife", "B3-n4nt5qr6i/S23"]);
		a.push(["FishLife", "B3-ekqr4nt5r6i/S02-c3"]);
		a.push(["FlashLife", "B2kn3-n4e/S23"]);
		a.push(["Flowflakes", "B2-ac3acei4ey6n8/S02-n3-nqy4cekyz5ei6k7e"]);
		a.push(["Flutter", "B2-a3j4-acekn56/S15y"]);
		a.push(["Flying Life", "B3-k5r/S236n7e"]);
		a.push(["FogLife", "B35eq7/S2-i34q"]);
		a.push(["Forestfire", "B3ai4ekq5cy6n/S2-ci3-ace4inr5eqry"]);
		a.push(["FrogLife", "B36i/S1c23-acek5k6i8"]);
		a.push(["Fruitflies", "B2-an4jn7e8/S12-k4r"]);
		a.push(["Fuzey", "B2-ae3aej4ez/S03ac4aikqryz78"]);
		a.push(["GemLife", "B34c6/S23-q"]);
		a.push(["Gentle relative", "B2cen3ek4jkw5-aein6a7e/S12an3-eijq4enrty5e6k"]);
		a.push(["GlideLife", "B34ek5ak/S2-c34z"]);
		a.push(["GlideLife2", "B34ek5ak/S2-c34iz5y"]);
		a.push(["GliderGlut", "B2k3aijn4ak5y6k/S2ae3ajnr4aiw"]);
		a.push(["GliderRROLife", "B2e3einy4ak5ijq7c/S1c2-ai3-ceky4ejny5ceqr6ak"]);
		a.push(["glife", "B3/S237c"]);
		a.push(["Glimmering Garden", "B3-jknr4ity5ijk6i8/S23-a4city6c7c"]);
		a.push(["GMO snowflakes", "B34c6n/S2-n3-ck4cijqtwy5y6n"]);
		a.push(["Goat Flock", "B2in3/S123a"]);
		a.push(["Goats", "B2in3/S123a"]);
		a.push(["Goldilocks I", "B2ek3cei4acjr5c8/S02ack3kn4aen"]);
		a.push(["gp", "B2ei3-a4ce5y6i/S234i7e"]);
		a.push(["Growflakes", "B2-ac3acei4ey6n8/S02-n3-nqy4cekyz5ei6k"]);
		a.push(["guntlife", "B35j6a/S2-i34q"]);
		a.push(["Half as Interesting", "B2ce3i/S23"]);
		a.push(["hassl8life", "B34k5e7c/S23-a4iyz"]);
		a.push(["hatlife", "B35y/S23"]);
		a.push(["Hats and Shuttles", "B34iqwy/S23-cq"]);
		a.push(["hedgehog", "B3/S1c2-a35r6i"]);
		a.push(["HeptaFish", "B3-e4i5i/S234e"]);
		a.push(["High15Life", "B34r6/S23-q4et"]);
		a.push(["HighGoats", "B2in36/S123a"]);
		a.push(["Hive", "B3-ry4ckn/S2-in3-cjn4it5aiky6-a7e8"]);
		a.push(["hlife", "B3/S234ce6k"]);
		a.push(["hlife2", "B3/S2-in34nr"]);
		a.push(["hlife3", "B3/S2-in34iw"]);
		a.push(["HoneyGoats", "B2in38/S123a8"]);
		a.push(["HouseLife", "B2i3/S23-r"]);
		a.push(["Hype", "B2-ac3aei4ae6i8/S23-ejq8"]);
		a.push(["IceNine", "B3aeiy4ae5i68/S2-in3-kqr4artz5aeny6-e78"]);
		a.push(["ilife", "B3/S235i"]);
		a.push(["Immortalife", "B3-cqy4j/S2-n34i"]);
		a.push(["IneticLife", "B2-an3-k/S2ac"]);
		a.push(["IronGoats", "B2in36/S123a8"]);
		a.push(["Ising", "B3e4ejr5cinqy6-ei78/S2ei3aejkr4-cny5-e678"]);
		a.push(["Just Friends", "B2-a/S12"]);
		a.push(["Kgdm", "B3/S2-c3-en4ceitz"]);
		a.push(["KineticLife", "B2-an3/S2ac"]);
		a.push(["klife", "B34n/S23"]);
		a.push(["Knyght", "B2e3/S23-jq"]);
		a.push(["ktlife", "B3/S2-i34nq"]);
		a.push(["LambdaLife", "B3-k/S2-i3-k4cen"]);
		a.push(["LeapLife", "B2n3/S23-q"]);
		a.push(["Leaplized D&N", "B2n3678/S3-q4678"]);
		a.push(["LifeWithoutGliders", "B35n/S23"]);
		a.push(["Linea", "B2-a3-i/S23-a"]);
		a.push(["LispLife", "B2n3/S23-q4e8"]);
		a.push(["LoafLife", "B2n3-q/S23"]);
		a.push(["longlast", "B3/S234ce8"]);
		a.push(["lotsofdots", "B2ikn34e/S023-a4ce"]);
		a.push(["MaritimeLife", "B2i34c6cen7c8/S2-i3-q4c5a6e8"]);
		a.push(["maze2", "B3/S234-acew"]);
		a.push(["Migrating Bookends", "B2ein3inry/S12-n3ce"]);
		a.push(["MilkyLife", "B3-c4c5y8/S234qy5y8"]);
		a.push(["Mooselife", "B34kz5e7c/S23-a4ityz5k"]);
		a.push(["move_rep", "B3-r4e5e6-n/S23cr457e"]);
		a.push(["Movero VIII", "B2-a5k6n7c/S12-i3ij4k5j8"]);
		a.push(["MoveIt", "B368/S23cy45-j6n"]);
		a.push(["movetub", "B34e68/S245"]);
		a.push(["movev", "B35y68/S245"]);
		a.push(["Movostill", "B2i3acijk6i/S23-a4"]);
		a.push(["Movostill 2", "B3acijk/S23-a4"]);
		a.push(["Movostill 3", "B2e3aceij5-ijr/S23-a4"]);
		a.push(["MuddyLife", "B3/S234k"]);
		a.push(["Nah", "B345-a6/S2-a3-a4-a"]);
		a.push(["nonlife", "B3-n/S234iz"]);
		a.push(["notlife", "B3-q7c/S2-i3-q4q"]);
		a.push(["notlife (Wright)", "B2k3-k/S23-a"]);
		a.push(["Notlife / Ace", "B2-a3/S2ce"]);
		a.push(["Niemiec's Rule 0", "B3/S2ae3aeijr4-cknqy"]);
		a.push(["olife", "B2in3/S2-in3"]);
		a.push(["Omosso", "B2k3acijr4ijqy6i7c/S2aek3ijnqr4it5n"]);
		a.push(["Orthogonable", "B2e3aiknr4q/S1c2-in3aijry4a"]);
		a.push(["Particles (testitemqlstudop)", "B2ce3i/S1c2cek"]);
		a.push(["Patchworks", "B2-an3aiy/S2-in3cijky4-nqrz5k"]);
		a.push(["Pedestrian Goats", "B2in38/S123a"]);
		a.push(["Pentadecathlife", "B34e5y6cn8/S234c5e"]);
		a.push(["Photics I", "B2ae4c678/S01e4aeqrtw5678"]);
		a.push(["Photics II", "B2ae4cw5y6i/S01e2i4q"]);
		a.push(["Pi replicator life", "B3-r4z5y/S238"]);
		a.push(["Pi-plicator", "B3-ckq/S2-c34ci"]);
		a.push(["PiLife", "B37e/S23"]);
		a.push(["Pilife2", "B34c/S234y8"]);
		a.push(["plasma1", "B012-in3-cky4ar5cjnr6ae/S05aijnr6n"]);
		a.push(["plife", "B35j/S2-i3"]);
		a.push(["plife2", "B35j6i/S2-i3"]);
		a.push(["PondLife", "B36i/S2-i35i"]);
		a.push(["PortLife", "B34cz5y/S234y8"]);
		a.push(["pre-x-rule", "B2cei3ci4jnr5ikn/S12-ck4einqy5er6aei8"]);
		a.push(["Prismatika Crystallios", "B2ae3r/S1e"]);
		a.push(["PlasmaLife", "B34-air/S234-air"]);
		a.push(["Puffers", "B3-nqr6/S235-nqr"]);
		a.push(["PuffLife", "B34-i5-a6-a/S2-an34-akrw"]);
		a.push(["qlife", "B3-q/S23"]);
		a.push(["quadraticlife", "B34j/S23"]);
		a.push(["Quasilinear Collisions", "B2-ak3-jnqr/S15678"]);
		a.push(["Rakelife", "B3aij/S2-i3ajnr4arz56-a7e"]);
		a.push(["Rainflakes", "B2-ac3aei4ey5n6n8/S02-n3aceir4ceyz5e6k"]);
		a.push(["RBeeLife", "B34cijkq5k6i8/S2-n3-ik4cjqt5y6cin8"]);
		a.push(["replife", "B34jy6n/S2-i3"]);
		a.push(["reptlife", "B36-k/S2-i34q"]);
		a.push(["ResistantLife", "B34eknqyz/S23"]);
		a.push(["Ribbons", "B3-nqr/S23"]);
		a.push(["RotoBlocks", "B34cyz5y8/S234y5y6n8"]);
		a.push(["RotoDotPuffers", "B2ikn3-ejnr/S01c2cei3ay4c"]);
		a.push(["RotoHooks", "B34ckyz/S234cz"]);
		a.push(["rgun", "B34t/S2-i35a7e"]);
		a.push(["Rule X3VI", "B2c3aei4ajnr5acn/S2-ci3-ck4in5jkq6c7c"]);
		a.push(["RustyLife", "B34-ai/S24-air5-a"]);
		a.push(["Salad", "B2i34c/S2-i3"]);
		a.push(["Sanctuary", "B2ei3ci/S1c23"]);
		a.push(["sansdomino", "B2-a/S014"]);
		a.push(["Savanna", "B2e3aeiy4ce5i6c7e/S2-n3-a4artz5aeny6cn"]);
		a.push(["Scenery", "B3-cnry4-acery5i/S23-a4-jknqr5y8"]);
		a.push(["SharkLife", "B34aeiz/S2-ak34ant6cek"]);
		a.push(["signalife", "B3aeijy5e6i/S2-c3-a4iq5k6ck"]);
		a.push(["SilverLife", "B367/S2-i34q"]);
		a.push(["SimpleInverseFire", "B2-ak4568/S156ak78"]);
		a.push(["Simple Life", "B2k34c/S2-c34z8"]);
		a.push(["SLHassleLife", "B3-y5cr/S234w6n"]);
		a.push(["SlugWorld", "B2e3ai4arw5678/S3-an4ar5i678"]);
		a.push(["SolarWorld", "B2ce3ci4iyz5ce6c/S12ce3ae"]);
		a.push(["SmokingLife", "B2i34cj6a7c8/S2-i3-a4ceit6in"]);
		a.push(["Smorgasbord", "B2e3aijr4q/S1c23-a5"]);
		a.push(["snotlife", "B2k3-kn/S23"]);
		a.push(["Snowflakes", "B2ci3ai4c8/S02ae3eijkq4iz5ar6i7e"]);
		a.push(["Snowflakes 2", "B2ci3ai4c8/S02ae3eijkq4aiz5ar6i7e"]);
		a.push(["SparkLife", "B36i/S234j"]);
		a.push(["SparklingLife", "B34cqy/S234q"]);
		a.push(["SparseMethuseLife", "B35y/S1e2-ci3-a5i"]);
		a.push(["StairWorld", "B2-a3i4aijk/S2a3-i4"]);
		a.push(["Stars", "B2e3-ceny4einqwz5-cikr6cei/S1c2e3aijky4aceijrz5-cejk6-ak7c8"]);
		a.push(["Suns", "B2ei3aeij4cjt5ky6ei/S1c2ace3jkn4aeijktw5ekry6in7e"]);
		a.push(["Switches", "B2ei3ij4ajnr6ci/S12ce3ajn4qtz5ijnqy6c"]);
		a.push(["Symmetristic", "B2-ak3-jnqr4ceiqtwz5-jnqr6-ak/S2-ak3-jnqr4ceiqtwz5-jnqr6-ak"]);
		a.push(["t4life", "B34jy/S2-i3"]);
		a.push(["TableLife", "B3/S23-ai4anq6n"]);
		a.push(["TauLife", "B3-nr/S2-i34-aij"]);
		a.push(["tceclife", "B36ce7c/S2-i34q"]);
		a.push(["tDryFlock", "B37/S12-i4q"]);
		a.push(["tDryLife", "B37/S2-i34q"]);
		a.push(["TearfulLife", "B34e5c6n/S23-q"]);
		a.push(["tEightLife", "B3/S2-i34q8"]);
		a.push(["testlife", "B36a/S23"]);
		a.push(["tflock", "B3/S12-i4q"]);
		a.push(["tHighFlock", "B36/S12-i4q"]);
		a.push(["tHighLife", "B36/S2-i34q"]);
		a.push(["ThisLife", "B36i/S23-ce5q"]);
		a.push(["tlife", "B3/S2-i34q"]);
		a.push(["tosc", "B3/S234wz"]);
		a.push(["tosc2", "B36in/S234cw"]);
		a.push(["tPedestrianFlock", "B38/S12-i4q"]);
		a.push(["tPedestrianLife", "B38/S2-i34q"]);
		a.push(["tq6", "B2i34e/S023-a4ce"]);
		a.push(["Traffic Flow", "B2e3aciy4jnw68/S23678"]);
		a.push(["Train", "B34t6k8/S2-i35a7e"]);
		a.push(["Trilobites", "B3aijn4w5nq/S2ae3aijr4irz5y"]);
		a.push(["triship", "B2a3e/S012-ai3-i45-i678"]);
		a.push(["Trycogene", "B2ce3aijn/S2ak3-aijn4jkqty5cekr6ce8"]);
		a.push(["Turro", "B2-a3c/S12-i"]);
		a.push(["Two-dots rule 1", "B2ei3ci4aerw5acky6i8/S012-an3eiknq4qrty5aeik6ik8"]);
		a.push(["Two-dots rule 2", "B2-ak3aen4cenrtw5iq6e/S02ac3aenqy4ejqtwy5ak6acn7"]);
		a.push(["Twinkles", "B2in34-a/S1e2ekn34ent"]);
		a.push(["Virus_v2", "B3-nqr6/S235"]);
		a.push(["Wartlife", "B3aijnq6n/S2-cn3-ceky4i"]);
		a.push(["WetLife", "B34r/S23"]);
		a.push(["Whichlife", "B2in3aeijn/S234e"]);
		a.push(["Wild Seas", "B2c3-cekq4ikt5i8/S2-in3-acky4aijry5eiky6i"]);
		a.push(["wlife", "B34w/S23"]);
		a.push(["Worms 0", "B01c2n5a/S3a5i"]);
		a.push(["Writers", "B2-a3-inqr4c6/S23"]);
		a.push(["WSScentral", "B3-n45qr6i/S2eik3"]);
		a.push(["x-rule-pre", "B2cei3ci4jnr5ikn/S12aen3c4einqy5er6aei8"]);
		a.push(["xtdbee", "B3-k/S23"]);
		a.push(["xvaLifeg", "B2e3/S23"]);
		a.push(["Ylife", "B2e3ai4ar/S23-a4a"]);
		a.push(["ylife (BokaBB)", "B34y5y/S234y5y"]);
		a.push(["zigzag", "B3/S2-k34q"]);
		a.push(["ZombieLife", "B3-nqy4aqz5cn6n8/S2-i3-a4inqz7c8"]);

		// add isotropic Moore generations aliases
		s.push("INT M G");
		a.push(["Isotropic Non-Totalistic Generations Moore", ""]);
		a.push(["HTech", "234e/2e3/3"]);
		a.push(["Jellyfish", "2ak34-a5-i/2c36k7/4"]);
		a.push(["KST", "1234-i5anq6kn/3r4kr5eiq6ack7e/3"]);
		a.push(["Simple Brain", "234e/e3/3"]);
		a.push(["Sliders", "012-e3-ae4acnqyz5acer6acn78/3j4-eikq5c/3"]);
		a.push(["tGeneC1WC0", "2-i34q/2c34w5c/4"]);

		// add non-isotropic von Neumann aliases
		s.push("NINT vN");
		a.push(["Non-Isotropic von Neumann", ""]);
		a.push(["1d110", "MAPLy0PDw"]);
		a.push(["AllShips", "MAPAAD//w"]);
		a.push(["HybridViewW110", "MAPPzz//A"]);

		// add non-isotropic hexagonal aliases
		s.push("NINT Hex");
		a.push(["Non-Isotropic hexagonal", ""]);
		a.push(["pentagonhood", "MAPBARISEhIgIBISICAgIAAAA"]);

		// add non-isotropic Moore aliases
		s.push("NINT M");
		a.push(["Non-Isotropic Moore", ""]);
		a.push(["2CellSlug", "MAPBTDe/yAA9/8AAP//AAD//yAA/78AAP//AID//wAA//8AAP//AAD/2wAA//8AgP//AAD//4AA//+AAH//AAD//w"]);
		a.push(["BLAHTWOCELLGUN", "MAPAMB/vwAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//w"]);
		a.push(["cloverleafsim", "MAPAAD//zAwPz8AAP//MDA/PwAA//8AAP//AAD//wAA//8AAD8/AAD//wAAPz8AAP//wMD//wAA///AwP//AAD//w"]);
		a.push(["FoxLife", "MAPARYXfhZofugWaH7oaIFoxBZofuhogOiAaIFoxIAAgAAWaH7oaIFoxGiA6ICAAIAAaIFoxIAAgACAAIAAAAAAAA"]);
		a.push(["MaxPeriod_2x2k2", "MAPADC9vyIA/f8AAH//AAD//wCA//+AAP//AID/fwAA//8AAH//AAB//wAA//8AAP//AAD//4AA//8AAP//AAD//w"]);
		a.push(["movingdiagonal", "MAPAAAAAAAAAAD//wAA//8AAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAD//wAA//8AAA"]);
		a.push(["MovingStrings", "MAPARH+/wMT//8BEf7/AxP//wER/v8DE///AREAAAMTAAABEf7/AxP//wER/v8DE///AREAAAMTAAABEQAAAxMAAA"]);
		a.push(["MuzikThing", "MAPACD//wAA3/8AgH//AAD//wCAf/8AAP//AAD//wAA//8AAH//AAD//wAA//8AAP//gAD//wAA//8AAP//AAD//w"]);
		a.push(["MyEntry", "MAPIAD/7wgA/f8AAP//AAD//wAA//8AAP//AAD/fwAA//8AAP//AAD//wAA//8AAP//AAD//4AA//8AAP//AAD//w"]);
		a.push(["randomnn", "MAPA1Az8wMAqgAAUADAAAAAAAAAgMAAAIAAgICAwAAAgAAAAAAAiACqAAAAAAAAAAAAAACAAIgAgACAgIAAAACAAA"]);
		a.push(["OLife", "MAPABD/vgIB//8AAP//AAD//wAA/78AAN3/AJB/vwAAf/8AAP//AABd/wAA//8AAP//AAD//4IA//8AAP//AIB//w"]);
		a.push(["Rhufo", "MAPARH//wMA//8AAP9/AAD//wAA//8AAP9/AAD//wAA//8AAP//AAB//wAA//8AAP//AAD//wAA//8AAH9/AAB//w"]);
		a.push(["Rhufo2", "MAPARH//wMA//8AAH9/AAD//wAAX/8AAP9/AAB/7wAA//8AAH//AAB//wAA//8AAP//AAB//wAA/f8AAH8/AAB3/w"]);
		a.push(["rules0", "MAPCkA/3wAI939CUM/bABH//4Agft4JAPX+IgH/3QAQ9u8AAP//AID/fwAA//8AAP//BQD9/wAA/98AAP//AAD//w"]);
		a.push(["rules6", "MAPAgl/+0Ug/fVAIv/9AADdPwDi9/uAQft5qIDtlQgA/b8gAP//AAD//wAQv/8AAP7+AhD/+gAA/f8EAv//AID//w"]);
		a.push(["SemiFelineLife", "MAPARYXfhZofugWaH7oaIDogBZofuhogOiAaIDogIAAgAAWaH7oaICatGiA6ICAAIAAaICatIAAgACAAIAAAAAAAA"]);
		a.push(["Simple_Weird_Ships", "MAPABHs/wMA//8AAP//AAD//wAA/38AAP//AAD//wAA//8AAP//gAD//wAA//8AAP//AAD//wAA//8AAP//AAD//w"]);
		a.push(["Socrates", "MAPARYXfhZofugWaH7oaIDogBZofuhogOiAaIDogIAAgAAWaH7oaIDogGiA6ICAAIAAaIDogIAAg00IAmSocrateg"]);
		a.push(["x-rule", "MAPBSB64CCTqARFBImEADAGBSCTgICTSIAAADCFCSTAAAANAMEUBCKEBchCE00YAE3IACSFACCIQQDIIF4UIIAGSA"]);
		a.push(["water", "MAPABAbrwAA//8AQltdAAD+/8Aa/f8AAP//YgD//wAA//8AAP//QAD//wBA//8AAP/fAgD3+wKA//8AIPZ/AAD//w"]);

		// add LtL 2-state aliases
		s.push("LtL M");
		a.push(["Larger than Life Moore", ""]);
		a.push(["Balloons", "R2,C2,M1,S7..10,B7..11,NM"]);
		a.push(["Bosco's Rule", "R5,C2,M1,S34..58,B34..45,NM"]);
		a.push(["Bosco Analogue", "R5,C2,M1,S34..53,B31..42,NM"]);
		a.push(["Bugs R3", "R3,C2,M1,S14..23,B14..18,NM"]);
		a.push(["Bugs R4", "R4,C2,M1,S23..39,B23..30,NM"]);
		a.push(["Bugs R6", "R6,C2,M1,S47..81,B47..63,NM"]);
		a.push(["Bugs R6 variant", "R6,C2,M1,S47..81,B47..71,NM"]);
		a.push(["Bugs R7", "R7,C2,M1,S63..108,B63..84,NM"]);
		a.push(["Bugs R9", "R9,C2,M1,S101..173,B101..134,NM"]);
		a.push(["Bugs R10", "R10,C2,M1,S124..211,B124..164,NM"]);
		a.push(["Bugs R10 variant", "R10,C2,M1,S124..211,B124..166,NM"]);
		a.push(["Bugs R12", "R12,C2,M1,S175..300,B175..232,NM"]);
		a.push(["Bugs R13", "R13,C2,M1,S205..349,B205..271,NM"]);
		a.push(["Bugs R14", "R14,C2,M1,S236..403,B236..313,NM"]);
		a.push(["Bugs R15", "R15,C2,M1,S269..461,B270..357,NM"]);
		a.push(["Bugs R100 variant", "R100,C2,M1,S11303..19361,B11100..14996,NM"]);
		a.push(["Bugsmovie", "R10,C2,M1,S123..212,B123..170,NM"]);
		a.push(["Globe", "R8,C2,M1,S164..224,B74..252,NM"]);
		//a.push(["Majority", "R4,C2,M1,S41..81,B41..80,NM"]);
		a.push(["Majorly", "R7,C2,M1,S113..225,B113..224,NM"]);
		a.push(["Mini Bugs", "R2,C2,M1,S7..10,B7..8,NM"]);
		a.push(["Miniature Bugs", "R3,C2,M1,S15..22,B14..25,NM"]);
		a.push(["Pigs", "R2,C2,M1,S10..19,B4..4,NM"]);
		a.push(["Quadratic Bugs", "R6,C2,M1,S47..81,B47..61,NM"]);
		a.push(["Rasta Bugs", "R5,C2,M1,S41..59,B32..50,NM"]);
		a.push(["Smudge", "R2,C2,M1,S7..11,B8..8,NM"]);
		a.push(["Stones", "R5,C2,M1,S29..58,B38..61,NM"]);
		a.push(["Soldier Bugs", "R7,C2,M1,S65..114,B65..95,NM"]);
		a.push(["Suicidal Bugs", "R5,C2,M1,S37..59,B33..49,NM"]);
		a.push(["Waffle", "R7,C2,M1,S100..200,B75..170,NM"]);
		a.push(["Waving human intestines", "R20,C2,M1,S1..21,B1..5,NM"]);

		// add generations LtL aliases
		s.push("LtL M G");
		a.push(["Generations Larger than Life Moore", ""]);
		a.push(["Fire rule", "R5,C6,M1,S31..43,B15..25,NM"]);
		a.push(["Fire whirl", "R8,C6,M1,S46..91,B65..100,NM"]);
		a.push(["ModernArt", "R10,C255,M1,S2..3,B3..3,NM"]);

		// add HROT cross aliases
		s.push("HROT cross");
		a.push(["Higher-Range Outer-Totalistic cross", ""]);
		a.push(["Factorio", "R3,C2,S2,B3,N+"]);
		
		// add HROT hash aliases
		s.push("HROT hash");
		a.push(["Higher-Range Outer-Totalistic hash", ""]);
		a.push(["Hash", "R2,C2,S4-6,B5-6,N#"]);
		
		// add HROT von Neumann aliases
		s.push("HROT vN");
		a.push(["Higher-Range Outer-Totalistic von Neumann", ""]);
		a.push(["Fredkin2 R2", "R2,C2,S0,2,4,6,8,10,12,B1,3,5,7,9,11,NN"]);
		a.push(["Parity R2", "R2,C2,S1,3,5,7,9,11,B1,3,5,7,9,11,NN"]);

		// add HROT Moore aliases
		s.push("HROT M");
		a.push(["Higher-Range Outer-Totalistic Moore", ""]);
		a.push(["Fredkin R2", "R2,C2,S0,2,4,6,8,10,12,14,16,18,20,22,24,B1,3,5,7,9,11,13,15,17,19,21,23"]);
		a.push(["Fredkin R3", "R3,C2,S0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,B1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47"]);
		a.push(["Fredkin R4", "R4,C2,S0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,B1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,51,53,55,57,59,61,63,65,67,69,71,73,75,77,79"]);
		a.push(["Replicator R2", "R2,C2,S1,3,5,7,9,11,13,15,17,19,21,23,B1,3,5,7,9,11,13,15,17,19,21,23"]);
		a.push(["Replicator R3", "R3,C2,S1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,B1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47"]);
		a.push(["Replicator R4", "R4,C2,S1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,51,53,55,57,59,61,63,65,67,69,71,73,75,77,79,B1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,51,53,55,57,59,61,63,65,67,69,71,73,75,77,79"]);

		// add HROT custom aliases
		s.push("HROT custom");
		a.push(["Higher-Range Outer-Totalistic custom", ""]);
		a.push(["Marine", "R2,C2,S4,6-9,B6-8,N@03ddef"]);
		
		// add weighted aliases
		s.push("Weighted");
		a.push(["Weighted", ""]);
		a.push(["Border", "R1,C2,S10-16,B1-8,NW010101010901010101"]);
		a.push(["Bustle", "R1,C4,S2,4-5,7,B3,NW212101212"]);
		a.push(["Career", "R1,C2,S2-3,B3,NW121101111"]);
		a.push(["Cloud54", "R1,C2,S2-3,9-10,19,27,B3,10,27,NW010109010009010909"]);
		a.push(["Cloud75", "R1,C2,S2-4,10-11,13,18,21-22,27,29-31,36-40,B3,10,27,NW010109010009010909"]);
		a.push(["Coexistence", "R4,C0,S9,14,16-17,21,23-24,30-31,37-38,44-45,51-52,58-59,B3,10,17,21,24,31,38,45,52,59,NW100010001000000000000000000000777000100707001000777000000000000000000000100010001"]);
		a.push(["CrossPorpoises", "R1,C2,S2-3,6-10,12-13,B5,NW141404140"]);
		a.push(["Cyclish", "R1,C7,S2,B1-3,NW010101010"]);
		a.push(["Cyclones", "R1,C5,S2,4-5,B2-5,NW110101011"]);
		a.push(["Dragon", "R1,C2,S1-2,7-8,12,15,18,20,B7,11-13,20,NW515101515"]);
		a.push(["Emergence", "R1,C2,S2-4,10-11,16-17,24-25,B3-4,9,24,NW010801010001080801"]);
		a.push(["Fire-flies", "R1,C9,S1,10,B6,11-12,21,NW010501050a05010501"]);
		a.push(["Fleas", "R1,C2,S2-3,6-7,10-11,15,20,B2,11,NW515101515"]);
		a.push(["Fleas2", "R1,C2,S1-2,5,7,10-11,B2,4,8,11,NW515101515"]);
		a.push(["NoFleas2", "R1,C2,S2-3,5-7,10-11,B2,4,8,11,NW515101515"]);
		a.push(["FroggyHex", "R1,C2,S1,6,8,B5-6,NW410104041H"]);
		a.push(["Frost M", "R1,C25,S,B1,NW111101111"]);
		a.push(["Frost N", "R1,C25,S,B1,NW010101010"]);
		a.push(["Gnats", "R1,C2,S0-2,11,19,B11,19,NW090109010001090109"]);
		a.push(["Hextenders", "R1,C10,S1,3-5,B2-3,NW110101011H"]);
		a.push(["HGlass", "R1,C2,S1-3,11,21,25,29-31,B1-3,11,21,25,29-31,NW000200080110000400"]);
		a.push(["Hogs", "R1,C2,S2-4,6,B5-6,NW023302230H"]);
		a.push(["Jitters", "R1,C2,S4,14,B1,4,9,NW995505599"]);
		a.push(["Lemmings", "R1,C2,S3-6,B4,NW121202131"]);
		a.push(["Linguini", "R1,C2,S2-4,9-11,19-20,B11,18,NW090109010001090109"]);
		a.push(["Madness", "R1,C2,S8,10,12,14,B5,8,13,NW232303232"]);
		a.push(["MazeMakers", "R1,C2,S2-3,6-10,12-13,B5,NW441404141"]);
		a.push(["MidgeDN", "R1,C9,S0,2-3,B4-6,NW222101212"]);
		a.push(["Midges", "R1,C4,S3,5-6,B4-6,NW121232121"]);
		a.push(["MikesAnts", "R1,C2,S4-5,B2,5-6,NW011100111"]);
		a.push(["Mosquito", "R1,C2,S3-4,8-9,B2-3,9,NW995505599"]);
		a.push(["Mosquito2", "R1,C2,S3-4,8-9,B3,6,9,18,NW995505599"]);
		a.push(["Navaho1", "R1,C12,S8-9,11,B2,5,NW414575414"]);
		a.push(["Nocturne", "R1,C4,S1,6,B2-4,NW110101011H"]);
		a.push(["Pictures", "R1,C2,S1-3,B2-4,NW010101010"]);
		a.push(["PicturesH", "R1,C9,S1-3,B2-4,NW010101010"]);
		a.push(["Pinwheels", "R1,C7,S2,B2-3,NW110101011"]);
		a.push(["PipeFleas", "R1,C3,S3-4,7,11-15,17-18,20,22-23,B6,10,NW515101515"]);
		a.push(["PreHogs", "R1,C2,S3-4,6,B5-6,NW230302023"]);
		a.push(["PuttPutt", "R1,C2,S1-4,9,18,27,36,40,B2,4,11,18-19,36,40,NW090109010001090109"]);
		a.push(["SEmigration", "R1,C2,S2-3,6-7,10-12,B7,11-12,16,NW515100505"]);
		a.push(["Simple", "R1,C2,S1,5,B2,10,NW515101515"]);
		a.push(["Simple Inverse", "R1,C2,S1,4-5,8-9,12-13,16-24,B2,9-10,13-14,17-18,21-22,24,NW515101515"]);
		a.push(["Simple Inverse Fire", "R1,C2,S1,5,9,13,17-19,21,23-24,B2,4,8-10,12-14,16-18,20-22,24,NW515101515"]);
		a.push(["Stampede", "R1,C8,S4,6,9-10,B4,7,NW130303130"]);
		a.push(["Starburst", "R1,C2,S2,4,6,B4,NW121202121"]);
		a.push(["Starbursts2", "R1,C2,S2,4-6,B4,NW121202121"]);
		a.push(["Stream", "R1,C2,S1,3-4,7-11,B5,7-8,10-11,NW010104041"]);
		a.push(["UpDown1", "R1,C2,S2,4-6,9,12,16,20,B3,6,9,12,NW111404444"]);
		a.push(["UpDown2", "R1,C2,S2-3,7,10-12,15,B3,7,11,15,NW151101555"]);
		a.push(["Upstream", "R1,C10,S4,6,9-10,B4,7,NW130404130"]);
		a.push(["Vineyard", "R1,C2,S2,6,8-10,12-13,B5,NW141404040"]);
		a.push(["Vineyard2", "R1,C2,S2,8-10,12-13,B5,NW141404040"]);
		a.push(["Weevils", "R1,C2,S1-4,B5-6,14,NW331101133"]);
		a.push(["Weighted Brain", "R1,C3,S3-4,7,B4-5,8,NW3323d3232"]);
		a.push(["Y_Chromosome", "R1,C3,S2,B2,NW110101011"]);

		s.push("Weighted G");
		a.push(["Weighted Generations", ""]);
		a.push(["WG Rule004", "R1,C4,S6-11,B4,NW111101111,0201"]);
		a.push(["WG Rule012", "R1,C6,S4-5,B5,NW111101111,021111"]);
		a.push(["WG Rule020", "R1,C6,S5-8,B5,NW111101111,020301"]);
		a.push(["WG Rule031", "R1,C4,S5-7,B4,NW111101111,0210"]);
		a.push(["WG Rule038", "R1,C5,S8,B6,9,NW111101111,03210"]);
		a.push(["WG Rule050", "R1,C8,S4-8,B6,NW111101111,02120300"]);
		a.push(["WG Rule063", "R1,C5,S6-7,9-11,B7,10,NW212101212,03101"]);
		a.push(["WG Rule071", "R1,C6,S8-16,B6,NW111101111,031012"]);
		a.push(["WG Rule072", "R1,C6,S8-16,B6,NW111101111,030112"]);
		a.push(["WG Rule074", "R1,C5,S4-8,B3,NW111101111,02001"]);
		a.push(["WG Rule084", "R1,C7,S5-6,B5,NW212101212,0121001"]);

		// add Alternating aliases
		s.push("Alt OT M");
		a.push(["Alternating Outer-Totalistic Moore", ""]);
		a.push(["alternlife", "B13/S012345678|B/S15"]);
		a.push(["comb395", "B3/S1237|B2/S"]);
		a.push(["comb625", "B3/S348|B2/S356"]);
		a.push(["Dotlesslife", "B3/S23|B/S12345678"]);
		a.push(["Fizzler", "B13/S3|B/S345678"]);
		a.push(["Jelly", "B3/S135|B2/S5"]);
		a.push(["Phoenix", "B24/S|B35/S"]);
		s.push("Alt INT M");
		a.push(["Alternating Non-Totalistic Moore", ""]);
		a.push(["SparklessLife", "B3/S23|B/S1c2345678"]);
		a.push(["Unidim1", "B134578/S02345678|B6i7/S268"]);
		a.push(["Unidim2", "B12ci34578/S02345678|B7/S268"]);
		a.push(["Unidim3", "B12ci34578/S02345678|B6i7/S268"]);

		// mark duplicate definitions and names
		this.aliases[0][2] = false;
		this.aliases[0][3] = false;
		for (i = 1; i < this.aliases.length; i += 1) {
			// get the next alias rule
			currentDef = this.aliases[i][1];
			currentName = this.aliases[i][0];
			this.aliases[i][2] = false;
			this.aliases[i][3] = false;
			for (j = 0; j < i; j += 1) {
				if (this.aliases[j][0] === currentName) {
					// mark as duplicate name
					this.aliases[j][3] = true;
					this.aliases[i][3] = true;
				}
				if (this.aliases[j][1] === currentDef) {
					// mark as duplicate rule
					this.aliases[j][2] = true;
					this.aliases[i][2] = true;
				}
			}
		}
	};

	// return rule from alias
	/** @returns {string|null} */
	AliasManager.getRuleFromAlias = function(/** @type {string} */ alias) {
		// result
		var	/** @type {string|null} */ result = null,

			// counter
			/** @type {number} */ i = 0;

		// replace any html elements
		alias = alias.replace(/&amp;/g, "&");

		// first try an exact match
		while (i < this.aliases.length && result === null) {
			// check for category
			if (this.aliases[i][1] !== "") {
				// check if the alias name matches
				if (this.aliases[i][0] === alias) {
					// get the associated rule
					result = this.aliases[i][1];
				}
			}

			// next alias
			i += 1;
		}

		// if not found try case-insensitive match
		if (!result) {
			// convert the alias to lower case
			alias = alias.toLowerCase();

			// search the alias list
			i = 0;
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
		}

		// return the rule
		return result;
	};

	// return alias from rule
	/** @returns {string|null} */
	AliasManager.getAliasFromRule = function(/** @type {string} */ rule) {
		// result
		var	/** @type {string|null} */ result = null,

			// counter
			/** @type {number} */ i = 0;

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

		// check for "Conway's Life"
		if (result === "Conway's Life") {
			result = "Life";
		}

		// return the alias
		return result;
	};
