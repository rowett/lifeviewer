// LifeViewer Alias
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// AliasManager singleton
	var AliasManager = {
		// list of alias/rule pairs
		aliases : [],

		// list of help section names
		sectionNames : []
	};

	// initialise Alias Manager
	AliasManager.init = function() {
		var current = null,
			i = 0, j = 0;

		// clear the current lists
		this.aliases = [];
		this.sectionNames = [];

		// add Wolfram aliases
		this.sectionNames.push("1D");
		this.aliases.push(["Wolfram", ""]);
		this.aliases.push(["Brownian motion", "W54"]);
		this.aliases.push(["Fishing-net", "W110"]);
		this.aliases.push(["Heavy triangles", "W22"]);
		this.aliases.push(["Linear A", "W90"]);
		this.aliases.push(["Linear B", "W150"]);
		this.aliases.push(["Pascal's Triangle", "W18"]);
		this.aliases.push(["Randomizer 1", "W30"]);
		this.aliases.push(["Randomizer 2", "W45"]);
		this.aliases.push(["Wolfram 22", "W22"]);
		this.aliases.push(["Wolfram 30", "W30"]);
		this.aliases.push(["Wolfram 110", "W110"]);

		// add Margolus aliases
		this.sectionNames.push("Margolus");
		this.aliases.push(["Margolus", ""]);
		this.aliases.push(["BBM", "M0,8,4,3,2,5,9,7,1,6,10,11,12,13,14,15"]);
		this.aliases.push(["BounceGas", "M0,8,4,3,2,5,9,14,1,6,10,13,12,11,7,15"]);
		this.aliases.push(["BounceGasII", "M0,8,4,12,2,10,9,7,1,6,5,11,3,13,14,15"]);
		this.aliases.push(["Critters", "M15,14,13,3,11,5,6,1,7,9,10,2,12,4,8,0"]);
		this.aliases.push(["HPP_Gas", "M0,8,4,12,2,10,9,14,1,6,5,13,3,11,7,15"]);
		this.aliases.push(["MargSingRot", "M0,2,8,3,1,5,6,7,4,9,10,11,12,13,14,15"]);
		this.aliases.push(["Rotations", "M0,2,8,12,1,10,9,11,4,6,5,14,3,7,13,15"]);
		this.aliases.push(["RotationsII", "M0,2,8,12,1,10,9,13,4,6,5,7,3,14,11,15"]);
		this.aliases.push(["RotationsIII", "M0,4,1,10,8,3,9,11,2,6,12,14,5,7,13,15"]);
		this.aliases.push(["RotationsIV", "M0,4,1,12,8,10,6,14,2,9,5,13,3,11,7,15"]);
		this.aliases.push(["Sand", "M0,4,8,12,4,12,12,13,8,12,12,14,12,13,14,15"]);
		this.aliases.push(["StringThing", "M0,1,2,12,4,10,9,7,8,6,5,11,3,13,14,15"]);
		this.aliases.push(["StringThingII", "M0,1,2,12,4,10,6,7,8,9,5,11,3,13,14,15"]);
		this.aliases.push(["SwapOnDiag", "M0,8,4,12,2,10,6,14,1,9,5,13,3,11,7,15"]);
		this.aliases.push(["Tron", "M15,1,2,3,4,5,6,7,8,9,10,11,12,13,14,0"]);

		// add PCA aliases
		this.sectionNames.push("PCA");
		this.aliases.push(["PCA", ""]);
		this.aliases.push(["Model_1", "2PCA4,0,4,8,3,1,10,6,7,2,9,5,11,12,13,14,15"]);
		this.aliases.push(["PCA_1", "2PCA4,0,4,8,3,1,10,6,7,2,9,5,11,12,13,14,15"]);
		this.aliases.push(["PCA_2", "2PCA4,0,2,4,3,8,10,6,7,1,9,5,11,12,13,14,15"]);
		this.aliases.push(["PCA_3", "2PCA4,0,8,1,3,2,5,6,7,4,9,10,11,12,13,14,15"]);
		this.aliases.push(["PCA_4", "2PCA4,0,2,4,12,8,5,9,7,1,6,10,11,3,13,14,15"]);
		this.aliases.push(["Model_2", "2PCA4,0,4,8,3,1,10,6,11,2,9,5,13,12,14,7,15"]);
		this.aliases.push(["PCA_5", "2PCA4,0,4,8,3,1,10,6,11,2,9,5,13,12,14,7,15"]);
		this.aliases.push(["PCA_6", "2PCA4,0,2,4,3,8,10,6,14,1,9,5,7,12,11,13,15"]);
		this.aliases.push(["PCA_7", "2PCA4,0,2,4,12,8,5,9,14,1,6,10,7,3,11,13,15"]);
		this.aliases.push(["PCA_8", "2PCA4,0,2,4,12,8,10,9,14,1,6,5,7,3,11,13,15"]);
		this.aliases.push(["PCA_9", "2PCA4,0,2,4,12,8,10,9,13,1,6,5,14,3,7,11,15"]);
		this.aliases.push(["PCA_10", "2PCA4,0,1,2,3,4,5,6,13,8,9,10,14,12,7,11,15"]);
		this.aliases.push(["PCA_11", "2PCA4,0,4,8,3,1,10,6,11,2,9,5,11,13,12,14,15"]);
		this.aliases.push(["PCA_12", "2PCA4,0,4,2,3,14,6,11,5,8,7,9,13,10,12,1,15"]);

		// add 2 state totalistic aliases
		this.sectionNames.push("OT M");
		this.aliases.push(["Outer-Totalistic Moore", ""]);
		this.aliases.push(["", "B3/S23"]);
		this.aliases.push(["2x2", "B36/S125"]);
		this.aliases.push(["2x2 2", "B3678/S1258"]);
		this.aliases.push(["34 Life", "B34/S34"]);
		this.aliases.push(["3-4 Life", "B34/S34"]);
		this.aliases.push(["Amoeba", "B357/S1358"]);
		this.aliases.push(["AntiLife", "B0123478/S01234678"]);
		this.aliases.push(["Assimilation", "B345/S4567"]);
		this.aliases.push(["Bacteria", "B34/S456"]);
		this.aliases.push(["Blinkers", "B345/S2"]);
		this.aliases.push(["Bugs", "B3567/S15678"]);
		this.aliases.push(["Castles", "B3678/S135678"]);
		this.aliases.push(["Coagulations", "B378/S235678"]);
		this.aliases.push(["Conway's Game of Life", "B3/S23"]);
		this.aliases.push(["Conway's Life", "B3/S23"]);
		this.aliases.push(["Coral", "B3/S45678"]);
		this.aliases.push(["Corrosion of Conformity", "B3/S124"]);
		this.aliases.push(["Dance", "B34/S35"]);
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
		this.aliases.push(["Holstein", "B35678/S4678"]);
		this.aliases.push(["HoneyFlock", "B38/S128"]);
		this.aliases.push(["HoneyLife", "B38/S238"]);
		this.aliases.push(["Iceballs", "B25678/S5678"]);
		this.aliases.push(["InverseLife", "B012345678/S34678"]);
		this.aliases.push(["Invertamaze", "B028/S0124"]);
		this.aliases.push(["IronFlock", "B36/S128"]);
		this.aliases.push(["IronLife", "B36/S238"]);
		this.aliases.push(["Land Rush", "B36/S234578"]);
		this.aliases.push(["Life SkyHigh", "B368/S236"]);
		this.aliases.push(["Life without Death", "B3/S012345678"]);
		this.aliases.push(["Life", "B3/S23"]);
		this.aliases.push(["Live Free or Die", "B2/S0"]);
		this.aliases.push(["Logarithmic replicator rule", "B36/S245"]);
		this.aliases.push(["LongLife", "B345/S5"]);
		this.aliases.push(["Long Life", "B345/S5"]);
		this.aliases.push(["LowDeath without death", "B368/S012345678"]);
		this.aliases.push(["LowDeath", "B368/S238"]);
		this.aliases.push(["LowFlockDeath", "B368/S128"]);
		this.aliases.push(["LowLife", "B3/S13"]);
		this.aliases.push(["Majority", "B45678/S5678"]);
		this.aliases.push(["Maze", "B3/S12345"]);
		this.aliases.push(["Maze with Mice", "B37/S12345"]);
		this.aliases.push(["Mazectric", "B3/S1234"]);
		this.aliases.push(["Mazectric with Mice", "B37/S1234"]);
		this.aliases.push(["Morley", "B368/S245"]);
		this.aliases.push(["Move", "B368/S245"]);
		this.aliases.push(["Neon Blobs", "B08/S4"]);
		this.aliases.push(["Pedestrian Flock", "B38/S12"]);
		this.aliases.push(["Pedestrian Life", "B38/S23"]);
		this.aliases.push(["Pedestrian Life without Death", "B38/S012345678"]);
		this.aliases.push(["Persian Rug", "B234/S"]);
		this.aliases.push(["Plow World", "B378/S012345678"]);
		this.aliases.push(["Pseudo Life", "B357/S238"]);
		this.aliases.push(["Replicator", "B1357/S1357"]);
		this.aliases.push(["Rings 'n' Slugs", "B56/S14568"]);
		this.aliases.push(["Seeds", "B2/S"]);
		this.aliases.push(["Serviettes", "B234/S"]);
		this.aliases.push(["Shoots and Roots", "B3/S245678"]);
		this.aliases.push(["Slow Blob", "B367/S125678"]);
		this.aliases.push(["SnowLife", "B3/S1237"]);
		this.aliases.push(["Stains", "B3678/S235678"]);
		this.aliases.push(["Virus", "B36/S235"]);
		this.aliases.push(["Vote", "B5678/S45678"]);
		this.aliases.push(["Vote 4/5", "B4678/S35678"]);
		this.aliases.push(["Walled Cities", "B45678/S2345"]);

		// add hex rules
		this.sectionNames.push("OT Hex");
		this.aliases.push(["Outer-Totalistic Hex", ""]);
		this.aliases.push(["Fredkin Hex", "B135/S0246H"]);
		this.aliases.push(["Hexagonal Life", "B2/S34H"]);
		this.aliases.push(["HighHexLife", "B25/S34H"]);
		this.aliases.push(["Replicator Hex", "B135/S135H"]);

		// add 2-state isotropic non-totalistic aliases
		this.sectionNames.push("NT M");
		this.aliases.push(["Isotropic Non-Totalistic Moore", ""]);
		this.aliases.push(["15Life", "B34r/S23-q4et"]);
		this.aliases.push(["104life", "B34ky5cy/S23-a4ity6c7"]);
		this.aliases.push(["22k", "B2-k/S2-k"]);
		this.aliases.push(["38life", "B35y/S2-n35k6ci"]);
		this.aliases.push(["57life", "B34tyz5cy/S23-a4it5ej"]);
		this.aliases.push(["aLife", "B3/S234iw"]);
		this.aliases.push(["Arcane Circuitry", "B2ci3aikr/S1e2-a3i"]);
		this.aliases.push(["Arrow", "B3-jkn4a/S1e2-a3ijnry4n"]);
		this.aliases.push(["Artillery", "B3-y7/S2-i3-c4kqt"]);
		this.aliases.push(["Atomic", "B2ei3i/S1c2-n3jr4an5i6c"]);
		this.aliases.push(["ATPP", "B3-ckq4z/S2-c3-a4iq5k6k"]);
		this.aliases.push(["Banks-I", "B3e4ejr5cinqy6-ei78/S012-e3-ajk4-akqw5-ajk6-e78"]);
		this.aliases.push(["Banks-III", "B2ce3e4jr5cin6-en7c8/S012-ac3-cn4-eikny5-kr67c8"]);
		this.aliases.push(["Beaecsizae", "B34ce/S12-a3"]);
		this.aliases.push(["Best Friends", "B2ce3aiy/S12aei3r"]);
		this.aliases.push(["Bgunlife", "B34eny5e/S23-a4iy5e6c"]);
		this.aliases.push(["Blocks for Days", "B2-ae3-cij4a5aj6e7e8/S01e2ai3ar4ar5air6ae7c8"]);
		this.aliases.push(["BoatLife", "B3-knqy/S2-n3-ey4akwy5aik6kn"]);
		this.aliases.push(["boatLife", "B3ainqy4aeq5ejn8/S2-in3-aek4aciq5ae6-c7c8"]);
		this.aliases.push(["Breps", "B34cqy5c/S23-y4y"]);
		this.aliases.push(["Breps-2", "B3aeijn4n8/S234iqz"]);
		this.aliases.push(["Bubbles", "B3ai4-a/S23"]);
		this.aliases.push(["Butterfly", "B2i34e6i7c/S2-i36n"]);
		this.aliases.push(["butterflyb7", "B2i34e6i7/S2-i36n"]);
		this.aliases.push(["Buzz", "B2i35-n/S2-ci36k8"]);
		this.aliases.push(["CapLife", "B36c/S23"]);
		this.aliases.push(["CarrierLife", "B2e3aceik/S23"]);
		this.aliases.push(["Cataverters", "B3-cen/S234eijkrw5cry6ik"]);
		this.aliases.push(["CB2", "B2ae4i/S1e2in"]);
		this.aliases.push(["cetlife", "B34cet/S234jkwyz"]);
		this.aliases.push(["CommonRepl", "B3/S23-ac4eiy6"]);
		this.aliases.push(["Conquerors and Colonizers", "B2ace3acei4ace5acei6ace/S"]);
		this.aliases.push(["Conway++", "B3/S234c"]);
		this.aliases.push(["Conway+-1", "B3/S23-inqy4aikqtwz"]);
		this.aliases.push(["Conway+-2", "B3/S2-ak34aikqtwz5inqy"]);
		this.aliases.push(["Conway--", "B3/S2-ei3"]);
		this.aliases.push(["Creperie", "B2ikn3aijn/S23-ckqy"]);
		this.aliases.push(["Crylife", "B2n3-cry4kn6i7c/S23-a4i6c"]);
		this.aliases.push(["Diamoeral", "B2n3ai4a78/S35678"]);
		this.aliases.push(["Diamonds", "B2en3ij4a5e7e8/S1c2cek3-a4aiqw5aky"]);
		this.aliases.push(["DLife", "B3-n/S23"]);
		this.aliases.push(["Dominoplex", "B2cen3ek4ejkwz5-ein6an7e8/S12an3-eijq4enrty5e6k"]);
		this.aliases.push(["Dry15Life", "B34r7/S23-q4et"]);
		this.aliases.push(["DryGoats", "B2in37/S123a"]);
		this.aliases.push(["Eatsplosion", "B2n3-ekqy4c5e/S2-cn3-eky4aij5e"]);
		this.aliases.push(["Eatsplosion IV", "B2n3-q4aqz6n8/S2-in3-q4iz7c8"]);
		this.aliases.push(["EightGoats", "B2in3/S123a8"]);
		this.aliases.push(["Einstein", "B2ein3cijn4cnrwy5cnq6e/S1c2-ai3acny4anqy5c6ek8b2ein3cijn4cnrwy5cnq6es1c2-ai3acny4anqy5c6ek8"]);
		this.aliases.push(["Emitters", "B2i3ai4cei5c6c7/S2-ae3acein4-t5-aq6cei7c8"]);
		this.aliases.push(["Extension", "B2cei3-ijnr4-a6i/S12-cn"]);
		this.aliases.push(["fakePiShipLife", "B3-ck4e5k6i/S2-in35i6c8"]);
		this.aliases.push(["FattyLife", "B3-n4nt5qr6i/S23"]);
		this.aliases.push(["FishLife", "B3-ekqr4nt5r6i/S02-c3"]);
		this.aliases.push(["FlashLife", "B2kn3-n4e/S23"]);
		this.aliases.push(["Flowflakes", "B2-ac3acei4ey6n8/S02-n3-nqy4cekyz5ei6k7e"]);
		this.aliases.push(["Flying Life", "B3-k5r/S236n7e"]);
		this.aliases.push(["FogLife", "B35eq7/S2-i34q"]);
		this.aliases.push(["Fuzey", "B2-ae3aej4ez/S03ac4aikqryz78"]);
		this.aliases.push(["Gentle relative", "B2cen3ek4jkw5-aein6a7e/S12an3-eijq4enrty5e6k"]);
		this.aliases.push(["GlideLife", "B34ek5ak/S2-c34z"]);
		this.aliases.push(["GliderGlut", "B2k3aijn4ak5y6k/S2ae3ajnr4aiw"]);
		this.aliases.push(["GliderRROLife", "B2e3einy4ak5ijq7c/S1c2-ai3-ceky4ejny5ceqr6ak"]);
		this.aliases.push(["Glimmering Garden", "B3-jknr4ity5ijk6i8/S23-a4city6c7c"]);
		this.aliases.push(["GMO snowflakes", "B34c6n/S2-n3-ck4cijqtwy5y6n"]);
		this.aliases.push(["Goat Flock", "B2in3/S123a"]);
		this.aliases.push(["Goats", "B2in3/S123a"]);
		this.aliases.push(["Goldilocks I", "B2ek3cei4acjr5c8/S02ack3kn4aen"]);
		this.aliases.push(["Growflakes", "B2-ac3acei4ey6n8/S02-n3-nqy4cekyz5ei6k"]);
		this.aliases.push(["guntlife", "B35j6a/S2-i34q"]);
		this.aliases.push(["Half as Interesting", "B2ce3i/S23"]);
		this.aliases.push(["hassl8life", "B34k5e7c/S23-a4iyz"]);
		this.aliases.push(["hatlife", "B35y/S23"]);
		this.aliases.push(["HeptaFish", "B3-e4i5i/S234e"]);
		this.aliases.push(["High15Life", "B34r6/S23-q4et"]);
		this.aliases.push(["HighGoats", "B2in36/S123a"]);
		this.aliases.push(["Hive", "B3-ry4ckn/S2-in3-cjn4it5aiky6-a7e8"]);
		this.aliases.push(["hlife3", "B3/S2-in34iw"]);
		this.aliases.push(["HoneyGoats", "B2in38/S123a8"]);
		this.aliases.push(["HouseLife", "B2i3/S23-r"]);
		this.aliases.push(["Hype", "B2-ac3aei4ae6i8/S23-ejq8"]);
		this.aliases.push(["IceNine", "B3aeiy4ae5i68/S2-in3-kqr4artz5aeny6-e78"]);
		this.aliases.push(["ilife", "B3/S235i"]);
		this.aliases.push(["Immortalife", "B3-cqy4j/S2-n34i"]);
		this.aliases.push(["IronGoats", "B2in36/S123a8"]);
		this.aliases.push(["Just Friends", "B2-a/S12"]);
		this.aliases.push(["Kgdm", "B3/S2-c3-en4ceitz"]);
		this.aliases.push(["klife", "B34n/S23"]);
		this.aliases.push(["Knyght", "B2e3/S23-jq"]);
		this.aliases.push(["LambdaLife", "B3-k/S2-i3-k4cen"]);
		this.aliases.push(["LifeWithoutGliders", "B35n/S23"]);
		this.aliases.push(["Linea", "B2-a3-i/S23-a"]);
		this.aliases.push(["LoafLife", "B2n3-q/S23"]);
		this.aliases.push(["MaritimeLife", "B2i34c6cen7c8/S2-i3-q4c5a6e8"]);
		this.aliases.push(["Migrating Bookends", "B2ein3inry/S12-n3ce"]);
		this.aliases.push(["Mooselife", "B34kz5e7c/S23-a4ityz5k"]);
		this.aliases.push(["Movero VIII", "B2-a5k6n7c/S12-i3ij4k5j8"]);
		this.aliases.push(["MoveIt", "B368/S23cy45-j6n"]);
		this.aliases.push(["movetub", "B34e68/S245"]);
		this.aliases.push(["movev", "B35y68/S245"]);
		this.aliases.push(["Movostill", "B2i3acijk6i/S23-a4"]);
		this.aliases.push(["Movostill 2", "B3acijk/S23-a4"]);
		this.aliases.push(["Movostill 3", "B2e3aceij5-ijr/S23-a4"]);
		this.aliases.push(["Niemiec's Rule 0", "B3/S2ae3aeijr4-cknqy"]);
		this.aliases.push(["Omosso", "B2k3acijr4ijqy6i7c/S2aek3ijnqr4it5n"]);
		this.aliases.push(["Orthogonable", "B2e3aiknr4q/S1c2-in3aijry4a"]);
		this.aliases.push(["Particles", "B2ce3i/S1c2cek"]);
		this.aliases.push(["Pedestrian Goats", "B2in38/S123a"]);
		this.aliases.push(["Pentadecathlife", "B34e5y6cn8/S234c5e"]);
		this.aliases.push(["Photics I", "B2ae4c678/S01e4aeqrtw5678"]);
		this.aliases.push(["Photics II", "B2ae4cw5y6i/S01e2i4q"]);
		this.aliases.push(["Pi-plicator", "B3-ckq/S2-c34ci"]);
		this.aliases.push(["PiLife", "B37e/S23"]);
		this.aliases.push(["plasma1", "B012-in3-cky4ar5cjnr6ae/S05aijnr6n"]);
		this.aliases.push(["PondLife", "B36i/S2-i35i"]);
		this.aliases.push(["pre-X-rule", "B2cei3ci4jnr5ikn/S12-ck4einqy5er6aei8"]);
		this.aliases.push(["Prismatika Crystallios", "B2ae3r/S1e"]);
		this.aliases.push(["PlasmaLife", "B34-air/S234-air"]);
		this.aliases.push(["Puffers", "B3-nqr6/S235-nqr"]);
		this.aliases.push(["quadraticlife", "B34j/S23"]);
		this.aliases.push(["Quasilinear Collisions", "B2-ak3-jnqr/S15678"]);
		this.aliases.push(["Rakelife", "B3aij/S2-i3ajnr4arz56-a7e"]);
		this.aliases.push(["Rainflakes", "B2-ac3aei4ey5n6n8/S02-n3aceir4ceyz5e6k"]);
		this.aliases.push(["reptlife", "B36-k/S2-i34q"]);
		this.aliases.push(["Rule X3VI", "B2c3aei4ajnr5acn/S2-ci3-ck4in5jkq6c7c"]);
		this.aliases.push(["RustyLife", "B34-ai/S24-air5-a"]);
		this.aliases.push(["Salad", "B2i34c/S2-i3"]);
		this.aliases.push(["Savanna", "B2e3aeiy4ce5i6c7e/S2-n3-a4artz5aeny6cn"]);
		this.aliases.push(["Scenery", "B3-cnry4-acery5i/S23-a4-jknqr5y8"]);
		this.aliases.push(["SharkLife", "B34aeiz/S2-ak34ant6cek"]);
		this.aliases.push(["signalife", "B3aeijy5e6i/S2-c3-a4iq5k6ck"]);
		this.aliases.push(["SilverLife", "B367/S2-i34q"]);
		this.aliases.push(["SLHassleLife", "B3-y5cr/S234w6n"]);
		this.aliases.push(["SlugWorld", "B2e3ai4arw5678/S3-an4ar5i678"]);
		this.aliases.push(["SolarWorld", "B2ce3ci4iyz5ce6c/S12ce3ae"]);
		this.aliases.push(["SmokingLife", "B2i34cj6a7c8/S2-i3-a4ceit6in"]);
		this.aliases.push(["Smorgasbord", "B2e3aijr4q/S1c23-a5"]);
		this.aliases.push(["Snowflakes", "B2ci3ai4c8/S02ae3eijkq4iz5ar6i7e"]);
		this.aliases.push(["Snowflakes 2", "B2ci3ai4c8/S02ae3eijkq4aiz5ar6i7e"]);
		this.aliases.push(["SparkLife", "B36i/S234j"]);
		this.aliases.push(["SparseMethuseLife", "B35y/S1e2-ci3-a5i"]);
		this.aliases.push(["StairWorld", "B2-a3i4aijk/S2a3-i4"]);
		this.aliases.push(["Stars", "B2e3-ceny4einqwz5-cikr6cei/S1c2e3aijky4aceijrz5-cejk6-ak7c8"]);
		this.aliases.push(["Suns", "B2ei3aeij4cjt5ky6ei/S1c2ace3jkn4aeijktw5ekry6in7e"]);
		this.aliases.push(["Switches", "B2ei3ij4ajnr6ci/S12ce3ajn4qtz5ijnqy6c"]);
		this.aliases.push(["Symmetristic", "B2-ak3-jnqr4ceiqtwz5-jnqr6-ak/S2-ak3-jnqr4ceiqtwz5-jnqr6-ak"]);
		this.aliases.push(["TableLife", "B3/S23-ai4anq6n"]);
		this.aliases.push(["TauLife", "B3-nr/S2-i34-aij"]);
		this.aliases.push(["tceclife", "B36ce7c/S2-i34q"]);
		this.aliases.push(["tDryFlock", "B37/S12-i4q"]);
		this.aliases.push(["tDryLife", "B37/S2-i34q"]);
		this.aliases.push(["TearfulLife", "B34e5c6n/S23-q"]);
		this.aliases.push(["tEightLife", "B3/S2-i34q8"]);
		this.aliases.push(["tflock", "B3/S12-i4q"]);
		this.aliases.push(["tHighFlock", "B36/S12-i4q"]);
		this.aliases.push(["tHighLife", "B36/S2-i34q"]);
		this.aliases.push(["ThisLife", "B36i/S23-ce5q"]);
		this.aliases.push(["tlife", "B3/S2-i34q"]);
		this.aliases.push(["tPedestrianFlock", "B38/S12-i4q"]);
		this.aliases.push(["tPedestrianLife", "B38/S2-i34q"]);
		this.aliases.push(["Train", "B34t6k8/S2-i35a7e"]);
		this.aliases.push(["Trilobites", "B3aijn4w5nq/S2ae3aijr4irz5y"]);
		this.aliases.push(["Turro", "B2-a3c/S12-i"]);
		this.aliases.push(["Two-dots rule 1", "B2ei3ci4aerw5acky6i8/S012-an3eiknq4qrty5aeik6ik8"]);
		this.aliases.push(["Two-dots rule 2", "B2-ak3aen4cenrtw5iq6e/S02ac3aenqy4ejqtwy5ak6acn7"]);
		this.aliases.push(["Twinkles", "B2in34-a/S1e2ekn34ent"]);
		this.aliases.push(["Virus_v2", "B3-nqr6/S235"]);
		this.aliases.push(["Wartlife", "B3aijnq6n/S2-cn3-ceky4i"]);
		this.aliases.push(["Whichlife", "B2in3aeijn/S234e"]);
		this.aliases.push(["Wild Seas", "B2c3-cekq4ikt5i8/S2-in3-acky4aijry5eiky6i"]);
		this.aliases.push(["wlife", "B34w/S23"]);
		this.aliases.push(["X-rule-pre", "B2cei3ci4jnr5ikn/S12aen3c4einqy5er6aei8"]);
		this.aliases.push(["Ylife", "B2e3ai4ar/S23-a4a"]);
		this.aliases.push(["ZombieLife", "B3-nqy4aqz5cn6n8/S2-i3-a4inqz7c8"]);

		// add 2-state isotropic non-totalistic aliases
		this.sectionNames.push("NT Hex");
		this.aliases.push(["Isotropic Non-Totalistic Hex", ""]);
		this.aliases.push(["Hex Life", "B2o3m56/S2-p4oH"]);
		this.aliases.push(["22da", "B2o/S2-mH"]);
		this.aliases.push(["Hexrule b2o", "B2o/S2m34H"]);

		// add Generations aliases
		this.sectionNames.push("OT M G");
		this.aliases.push(["Outer-Totalistic Generations Moore", ""]);
		this.aliases.push(["9:43 at Knight", "237/34578/4"]);
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
		this.aliases.push(["Constellations", "/23/3"]);
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
		this.aliases.push(["Snake", "03467/25/6"]);
		this.aliases.push(["SoftFreeze", "13458/38/6"]);
		this.aliases.push(["Spirals", "2/234/5"]);
		this.aliases.push(["Star Wars", "345/2/4"]);
		this.aliases.push(["Sticks", "3456/2/6"]);
		this.aliases.push(["Swirl", "23/34/8"]);
		this.aliases.push(["Tadpoles", "0125678/345678/64"]);
		this.aliases.push(["ThrillGrill", "1234/34/48"]);
		this.aliases.push(["Transers", "345/26/5"]);
		this.aliases.push(["TransersII", "0345/26/6"]);
		this.aliases.push(["Transers 2", "0345/26/6"]);
		this.aliases.push(["Transers 3", "0345/26/7"]);
		this.aliases.push(["Wallplicators", "345/25678/7"]);
		this.aliases.push(["Wanderers", "345/34678/5"]);
		this.aliases.push(["Worms", "3467/25/6"]);
		this.aliases.push(["Xtasy", "1456/2356/16"]);

		// add isotropic generations aliases
		this.sectionNames.push("NT M G");
		this.aliases.push(["Isotropic Non-Totalistic Generations Moore", ""]);
		this.aliases.push(["Jellyfish", "2ak34-a5-i/2c36k7/4"]);
		this.aliases.push(["Sliders", "012-e3-ae4acnqyz5acer6acn78/3j4-eikq5c/3"]);
		this.aliases.push(["tGeneC1WC0", "2-i34q/2c34w5c/4"]);

		// add LtL 2-state aliases
		this.sectionNames.push("LtL M");
		this.aliases.push(["Larger than Life Moore", ""]);
		this.aliases.push(["Balloons", "R2,C2,M1,S7..10,B7..11,NM"]);
		this.aliases.push(["Bosco's Rule", "R5,C2,M1,S34..58,B34..45,NM"]);
		this.aliases.push(["Bosco Analogue", "R5,C2,M1,S34..53,B31..42,NM"]);
		this.aliases.push(["Bugs R3", "R3,C2,M1,S14..23,B14..18,NM"]);
		this.aliases.push(["Bugs R4", "R4,C2,M1,S23..39,B23..30,NM"]);
		this.aliases.push(["Bugs R6", "R6,C2,M1,S47..81,B47..63,NM"]);
		this.aliases.push(["Bugs R6 variant", "R6,C2,M1,S47..81,B47..71,NM"]);
		this.aliases.push(["Bugs R7", "R7,C2,M1,S63..108,B63..84,NM"]);
		this.aliases.push(["Bugs R9", "R9,C2,M1,S101..173,B101..134,NM"]);
		this.aliases.push(["Bugs R10", "R10,C2,M1,S124..211,B124..164,NM"]);
		this.aliases.push(["Bugs R10 variant", "R10,C2,M1,S124..211,B124..166,NM"]);
		this.aliases.push(["Bugs R12", "R12,C2,M1,S175..300,B175..232,NM"]);
		this.aliases.push(["Bugs R13", "R13,C2,M1,S205..349,B205..271,NM"]);
		this.aliases.push(["Bugs R14", "R14,C2,M1,S236..403,B236..313,NM"]);
		this.aliases.push(["Bugs R15", "R15,C2,M1,S269..461,B270..357,NM"]);
		this.aliases.push(["Bugs R100 variant", "R100,C2,M1,S11303..19361,B11100..14996,NM"]);
		this.aliases.push(["Bugsmovie", "R10,C2,M1,S123..212,B123..170,NM"]);
		this.aliases.push(["Globe", "R8,C2,M1,S164..224,B74..252,NM"]);
		//this.aliases.push(["Majority", "R4,C2,M1,S41..81,B41..80,NM"]);
		this.aliases.push(["Majorly", "R7,C2,M1,S113..225,B113..224,NM"]);
		this.aliases.push(["Mini Bugs", "R2,C2,M1,S7..10,B7..8,NM"]);
		this.aliases.push(["Miniature Bugs", "R3,C2,M1,S15..22,B14..25,NM"]);
		this.aliases.push(["Pigs", "R2,C2,M1,S10..19,B4..4,NM"]);
		this.aliases.push(["Quadratic Bugs", "R6,C2,M1,S47..81,B47..61,NM"]);
		this.aliases.push(["Rasta Bugs", "R5,C2,M1,S41..59,B32..50,NM"]);
		this.aliases.push(["Smudge", "R2,C2,M1,S7..11,B8..8,NM"]);
		this.aliases.push(["Stones", "R5,C2,M1,S29..58,B38..61,NM"]);
		this.aliases.push(["Soldier Bugs", "R7,C2,M1,S65..114,B65..95,NM"]);
		this.aliases.push(["Suicidal Bugs", "R5,C2,M1,S37..59,B33..49,NM"]);
		this.aliases.push(["Waffle", "R7,C2,M1,S100..200,B75..170,NM"]);
		this.aliases.push(["Waving human intestines", "R20,C2,M1,S1..21,B1..5,NM"]);

		// add generations LtL
		this.sectionNames.push("LtL M G");
		this.aliases.push(["Generations Larger than Life Moore", ""]);
		this.aliases.push(["Fire rule", "R5,C6,M1,S31..43,B15..25,NM"]);
		this.aliases.push(["Fire whirl", "R8,C6,M1,S46..91,B65..100,NM"]);
		this.aliases.push(["ModernArt", "R10,C255,M1,S2..3,B3..3,NM"]);

		// add HROT aliases
		this.sectionNames.push("HROT M");
		this.aliases.push(["Higher-Range Outer-Totalistic Moore", ""]);
		this.aliases.push(["Fredkin R2", "R2,C2,S0,2,4,6,8,10,12,14,16,18,20,22,24,B1,3,5,7,9,11,13,15,17,19,21,23"]);
		this.aliases.push(["Fredkin R3", "R3,C2,S0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,B1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47"]);
		this.aliases.push(["Fredkin R4", "R4,C2,S0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,B1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,51,53,55,57,59,61,63,65,67,69,71,73,75,77,79"]);
		this.aliases.push(["Replicator R2", "R2,C2,S1,3,5,7,9,11,13,15,17,19,21,23,B1,3,5,7,9,11,13,15,17,19,21,23"]);
		this.aliases.push(["Replicator R3", "R3,C2,S1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,B1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47"]);
		this.aliases.push(["Replicator R4", "R4,C2,S1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,51,53,55,57,59,61,63,65,67,69,71,73,75,77,79,B1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,51,53,55,57,59,61,63,65,67,69,71,73,75,77,79"]);

		// add non-isotropic aliases
		this.sectionNames.push("NI NT");
		this.aliases.push(["Non-Isotropic", ""]);
		this.aliases.push(["2CellSlug", "MAPBTDe/yAA9/8AAP//AAD//yAA/78AAP//AID//wAA//8AAP//AAD/2wAA//8AgP//AAD//4AA//+AAH//AAD//w"]);
		this.aliases.push(["FoxLife", "MAPARYXfhZofugWaH7oaIFoxBZofuhogOiAaIFoxIAAgAAWaH7oaIFoxGiA6ICAAIAAaIFoxIAAgACAAIAAAAAAAA"]);
		this.aliases.push(["SemiFelineLife", "MAPARYXfhZofugWaH7oaIDogBZofuhogOiAaIDogIAAgAAWaH7oaICatGiA6ICAAIAAaICatIAAgACAAIAAAAAAAA"]);
		this.aliases.push(["Socrates", "MAPARYXfhZofugWaH7oaIDogBZofuhogOiAaIDogIAAgAAWaH7oaIDogGiA6ICAAIAAaIDogIAAg00IAmSocrates"]);

		// add Alternating aliases
		this.sectionNames.push("Alt OT M");
		this.aliases.push(["Alternating Outer-Totalistic Moore", ""]);
		this.aliases.push(["alternlife", "B13/S012345678|B/S15"]);
		this.aliases.push(["comb625", "B3/S348|B2/S356"]);
		this.aliases.push(["Fizzler", "B13/S3|B/S345678"]);
		this.aliases.push(["Jelly", "B3/S135|B2/S5"]);
		this.aliases.push(["Phoenix", "B24/S|B35/S"]);
		this.sectionNames.push("Alt NT M");
		this.aliases.push(["Alternating Non-Totalistic Moore", ""]);
		this.aliases.push(["Unidim1", "B134578/S02345678|B6i7/S268"]);
		this.aliases.push(["Unidim2", "B12ci34578/S02345678|B7/S268"]);
		this.aliases.push(["Unidim3", "B12ci34578/S02345678|B6i7/S268"]);

		// mark duplicates
		this.aliases[0][2] = false;
		for (i = 1; i < this.aliases.length; i += 1) {
			// get the next alias rule
			current = this.aliases[i][1];
			this.aliases[i][2] = false;
			for (j = 0; j < i; j += 1) {
				if (this.aliases[j][1] === current) {
					// mark as duplicate rule
					this.aliases[j][2] = true;
					this.aliases[i][2] = true;
					j = i;
				}
			}
		}
	};

	// return rule from alias
	AliasManager.getRuleFromAlias = function(alias) {
		// result
		var result = null,

		    // counter
			i = 0;
			
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

