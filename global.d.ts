// Global type definitions for LifeViewer

// alias.js
declare var AliasManager;

// allocator.js
declare var Allocator, Uint8, Uint8Clamped, Uint16, Uint32, Int8, Int16, Int32, Float32, Float64;
interface ArrayConstructor {
    matrix;
    addRow;
    copy;
    matrixView;
    matrixViewWithOffset;
}

// box.js
declare var BoundingBox;

// canvasmenu.js
declare var IconManager, Menu, MenuManager;

// colours.js
declare var ColourManager;

// compatibility.js
declare var littleEndian, registerEvent;
interface Window {
    Uint8Array;
    Uint8ClampedArray;
    Uint16Array;
    Uint32Array;
}

// help.js
declare var Help;

// keywords.js
declare var Keywords;

// life.js
declare var LifeConstants, Life;

// lifeview.js
declare var DocConfig, Controller, ViewConstants, startAllViewers, updateViewer, updateMe, hideViewer, launchInMolly;

// ltl.js
declare var LTL;

// pattern.js
declare var PatternManager, Pattern;

// random.js
declare var Random, myRand;

// script.js
declare var Script;
interface NumberConstructor {
    isNaN;
    isFinite;
}

// snapshot.js
declare var SnapshotManager, Snapshot;

// stars.js
declare var Stars;

// waypoint.js
declare var Waypoint, WaypointManager, WaypointConstants;

// window.js
declare var PopupWindow;


