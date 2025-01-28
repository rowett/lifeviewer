# Compile LifeViewer WebAssembly
# C source -> WASM binary -> WASM base64 -> Javascript

# Emscripten compiler
CC = emcc

# C flags (no main entry point, instrinsic SIMD, optimize)
CFLAGS = --no-entry -msimd128 -O3 -Wall -Wextra

# WebAssembly settings (heap size, standalone output, exported functions)
SETTINGS = -s INITIAL_MEMORY=1024MB -s STANDALONE_WASM=1 -s EXPORTED_FUNCTIONS="[ \
	'_nextGenerationWeightedStates2', '_nextGenerationWeighted2', '_nextGenerationGaussian2', '_nextGenerationCustom2', \
	'_nextGenerationTriangular2', '_nextGenerationTripod2', '_nextGenerationAsterisk2', '_nextGenerationHexagonal2', \
	'_nextGenerationShaped2', '_nextGenerationCheckerboard2', '_nextGenerationAlignedCheckerboard2', '_nextGenerationStar2', \
	'_nextGenerationSaltire2', '_nextGenerationHash2', '_nextGenerationCross2', '_nextGenerationCornerEdge2', \
	 '_updateGridFromCounts2', '_cumulativeVNCounts2', '_cumulativeMooreCounts2', '_nextGenerationHROTVN2', '_nextGenerationHROTMoore2', \
	'_nextGenerationWeightedStatesN', '_nextGenerationWeightedN', '_nextGenerationGaussianN', '_nextGenerationCustomN', \
	'_nextGenerationTriangularN', '_nextGenerationTripodN', '_nextGenerationAsteriskN', '_nextGenerationHexagonalN', \
	'_nextGenerationShapedN', '_nextGenerationCheckerboardN', '_nextGenerationAlignedCheckerboardN', '_nextGenerationStarN', \
	'_nextGenerationSaltireN', '_nextGenerationHashN', '_nextGenerationCrossN', '_nextGenerationCornerEdgeN', \
	'_updateGridFromCountsN', '_cumulativeVNCountsN', '_cumulativeMooreCountsN', '_nextGenerationHROTVNN', '_nextGenerationHROTMooreN', \
	'_clearTopAndLeft', '_wrapTorusHROT', '_clearHROTOutside', \
	'_nextGeneration', '_nextGenerationGenerations', '_convertToPens', \
	'_nextGenerationSuperMoore', '_nextGenerationSuperHex', '_nextGenerationSuperVN', \
	'_nextGenerationInvestigatorMoore', '_nextGenerationInvestigatorHex', '_nextGenerationInvestigatorVN', \
	'_nextGenerationRuleTreeMoore', '_nextGenerationRuleTreeMoorePartial4', \
	'_nextGenerationRuleLoaderMooreLookup1', '_nextGenerationRuleLoaderMooreLookup2', '_nextGenerationRuleLoaderMooreLookup3', \
	'_nextGenerationRuleTreeVN', \
	'_nextGenerationRuleLoaderVNLookup1', '_nextGenerationRuleLoaderVNLookup2', '_nextGenerationRuleLoaderVNLookup3', \
	'_nextGenerationRuleLoaderVNLookup4', '_nextGenerationRuleLoaderVNLookup5', \
	'_nextGenerationRuleTableMoore', '_nextGenerationRuleTableHex', '_nextGenerationRuleTableVN', \
	'_nextGenerationRuleLoaderHexLookup1', '_nextGenerationRuleLoaderHexLookup2', '_nextGenerationRuleLoaderHexLookup3', \
	'_renderGridClipNoRotate', '_renderGridNoClipNoRotate', \
	'_renderOverlayClipNoRotate', '_renderOverlayNoClipNoRotate', \
	'_updateOccupancyStrict', '_updateCellCounts', '_updateCellCountsSuperOrRuleTree', '_updateOccupancyStrictSuperOrRuleLoader', \
	'_getHashTwoState', '_getHashRuleLoaderOrPCAOrExtended', '_getHashGenerations', '_getHashLifeHistory', '_getHashSuper', \
	'_create2x2ColourGridSuper', '_create4x4ColourGridSuper', '_create8x8ColourGridSuper', \
	'_create16x16ColourGridSuper', '_create32x32ColourGridSuper', \
	'_create2x2ColourGrid', '_create4x4ColourGrid', '_create8x8ColourGrid', \
	'_create16x16ColourGrid', '_create32x32ColourGrid']"
	
# Repository base
REPO = /mnt/c/Users/crowe/Documents/GitHub/lifeviewer

# C sources
SOURCES = $(REPO)/wasm/HROT.c $(REPO)/wasm/render.c $(REPO)/wasm/identify.c $(REPO)/wasm/iterator.c

# object files for each C source
OBJECTS = $(SOURCES:.c=.o)

# pattern rule for .c to .o translation
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# WASM file
WASM = output.wasm

# Base 64 version
B64 = wasm.b64

# Javascript file
JSCRIPT = lvwasm.js

# Destination folder for Javascript file
DEST = $(REPO)/js/

# WASM javascript file
$(JSCRIPT): $(B64)
	./makejs.sh $(MAKEJSFLAGS) $< > $@ && cp $@ $(DEST)

# Create base64 encoding of binary WASM
$(B64): $(WASM)
	base64 -w 0 $< > $@

# create binary WASM file from C objects
$(WASM): $(OBJECTS)
	$(CC) $(CFLAGS) $(SETTINGS) $(OBJECTS) -o $@

# Clean up output files
clean:
	rm -f $(B64) $(WASM) $(JSCRIPT) $(OBJECTS)

# Force rebuild
again: clean $(JSCRIPT)
