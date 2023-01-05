// Global type definitions for LifeViewer

// alias.js
declare var AliasManager;

// allocator.js
declare var Uint8, Uint8Clamped, Uint16, Uint32, Int8, Int16, Int32, Float32, Float64;
interface Array {
    whole;
}
interface ArrayConstructor {
    matrix;
    addRow;
    copy;
    matrixView;
    matrixViewWithOffset;
}

// box.js

// canvasmenu.js

// colours.js
declare var ColourManager;

// compatibility.js
declare var littleEndian;
interface Window {
    Uint8Array;
    Uint8ClampedArray;
    Uint16Array;
    Uint32Array;
    Int8Array;
    Int16Array;
    Int32Array;
    Float32Array;
    Float64Array;
}

// help.js
declare var Help;

// keywords.js

// life.js

// lifeview.js
declare var typedArrays, arrayFill, LifeViewerLoaded, arraySlice, littleEndian, copyWithin, Controller;

interface HTMLElement {
    src;
}
interface Window {
    width;
    height;
}
interface Element {
    style;
    offsetWidth;
}
interface Node {
    className;
}

// ltl.js
declare var LTL;

// pattern.js
declare var RuleTreeCache;

// parser.js

// random.js

// script.js
interface NumberConstructor {
    isNaN;
    isFinite;
}

// snapshot.js

// stars.js

// waypoint.js

// window.js


