// html5 element menu library
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global registerEvent */

	// PopupWindow
	/**
	 * @constructor
	 */
	function PopupWindow(element, menuManager) {
		var me = this,
			title = element.getElementsByTagName("div")[0];

		// current touch id
		this.currentTouchId = -1;

		// window zoom
		this.windowZoom = 1;

		// wrapped element
		this.wrappedElement = element;

		// menu manager
		this.menuManager = menuManager;

		// current position
		this.left = 0;
		this.top = 0;
		if (element.style.left !== "") {
			this.left = parseInt(element.style.left, 10);
		}
		if (element.style.top !== "") {
			this.top = parseInt(element.style.top, 10);
		}

		// whether window is displayed
		this.displayed = false;

		// mouse status
		this.mouseDown = false;
		this.mouseLastX = -1;
		this.mouseLastY = -1;

		// last touch coordinates
		this.lastScreenX = -1;
		this.lastScreenY = -1;
		this.lastClientX = -1;
		this.lastClientY = -1;

		// scrollbar width
		this.scrollBarWidth = 21;

		// element offset
		this.offsetLeft = 0;
		this.offsetTop = 0;

		// x offset when resizing to keep window right edge at a constant position
		this.resizeDx = 0;

		// register event listeners for element click
		registerEvent(title, "mousedown", function(event) {me.elementMouseDown(me, event);}, false);
		registerEvent(document, "mousemove", function(event) {me.elementMouseMove(me, event);}, false);
		registerEvent(document, "mouseup", function(event) {me.elementMouseUp(me, event);}, false);

		// register event listeners for touch
		registerEvent(title, "touchstart", function(event) {me.touchHandler(me, event);}, false);
		registerEvent(title, "touchmove", function(event) {me.touchHandler(me, event);}, false);
		registerEvent(title, "touchend", function(event) {me.touchHandler(me, event);}, false);

		// register event listener for window resize
		registerEvent(window, "resize", function(event) {me.resizeWindow(me, event);}, false);
	}

	// find touch change by identified
	PopupWindow.prototype.findChangeById = function(changes, id) {
		var change = null,
			i = 0;

		// search the change list for the change with the specified id
		while (change === null && i < changes.length) {
			if (changes[i].identifier === id) {
				change = changes[i];
			} else {
				i += 1;
			}
		}

		return change;
	};

	// touch event handler
	PopupWindow.prototype.touchHandler = function(me, event) {
		var changes = event.changedTouches,
			thisChange = null;
			
		// determine which event was received
		switch (event.type) {
		// touch start
		case "touchstart":
			// check if processing a touch
			if (me.currentTouchId === -1) {
				thisChange = changes[0];
				me.currentTouchId = thisChange.identifier;
				me.performDown(me, thisChange.pageX, thisChange.pageY);
			}
			break;

		// touch end
		case "touchend":
			// find the change record for the current touch
			thisChange = me.findChangeById(changes, me.currentTouchId);
			if (thisChange !== null) {
				me.performUp(me, thisChange.pageX, thisChange.pageY);
				me.currentTouchId = -1;
			}
			break;

		// touch move
		case "touchmove":
			// find the change record for the current touch
			thisChange = me.findChangeById(changes, me.currentTouchId);
			if (thisChange !== null) {
				me.performMove(me, thisChange.pageX, thisChange.pageY);
			}
			break;
		}
	
		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		if (event.cancelable) {
			event.preventDefault();
		}
	};

	// resize window
	/* eslint-disable no-unused-vars */
	PopupWindow.prototype.resizeWindow = function(me, event) {
	    /* eslint-enable no-unused-vars */
		// check the popup window is on the display
		me.setWindowPosition(me.left + me.resizeDx, me.top, me.wrappedElement);
		me.resizeDx = 0;
	};

	// move element
	PopupWindow.prototype.updatePosition = function(dx, dy) {
		// get the wrapped element
		var element = this.wrappedElement,

		    // get the position of the window
		    x = this.left,
		    y = this.top;

		// add the offset
		x += dx / this.windowZoom;
		y += dy / this.windowZoom;
		
		// set the window position
		this.setWindowPosition(x, y, element);
	};

	// set window position
	PopupWindow.prototype.setWindowPosition = function(x, y, element) {
		// get the width and height of the element
		var width = element.clientWidth * this.windowZoom,
		    height = element.clientHeight * this.windowZoom,

		    // get the maximum x and y position
		    maxX = (window.innerWidth - width) / this.windowZoom,
		    maxY = (window.innerHeight - height) / this.windowZoom;

		// check for scrollbar
		if (window.innerHeight < document.getElementsByTagName("body")[0].clientHeight) {
			maxX -= this.scrollBarWidth;
		}

		// ensure window on screen
		if (x < 0) {
			x = 0;
		}
		if (y < 0) {
			y = 0;
		}
		if (x > maxX) {
			x = maxX;
		}
		if (y > maxY) {
			y = maxY;
		}

		// update the element
		element.style.left = (x + "px");
		element.style.top = (y + "px");
		element.style.position = "fixed";

		// save the new position
		this.left = x;
		this.top = y;
	};

	// compute element offset
	PopupWindow.prototype.computeElementOffset = function() {
		// get the element
		var mainElement = this.wrappedElement,
		    
		    // get the item parent
		    itemParent = mainElement.offsetParent;

		// get the offset of the element
		this.offsetLeft = mainElement.offsetLeft;
		this.offsetTop = mainElement.offsetTop;

		// visit the parents adding their offsets
		while (itemParent) {
			this.offsetLeft += itemParent.offsetLeft;
			this.offsetTop += itemParent.offsetTop;
			itemParent = itemParent.offsetParent;
		}

		// get the scroll position of the element
		itemParent = mainElement.parentNode;

		// check if the parent is fixed
		if (itemParent.style.position === "fixed") {
			// subtract the offset of the body
			this.offsetLeft += document.body.scrollLeft + document.documentElement.scrollLeft;
			this.offsetTop += document.body.scrollTop + document.documentElement.scrollTop;
		} else {
			// run up the parent hierarchy
			while (itemParent.tagName.toLowerCase() !== "body") {
				this.offsetLeft -= itemParent.scrollLeft;
				this.offsetTop -= itemParent.scrollTop;
				itemParent = itemParent.parentNode;
			}
		}
	};

	// touch start event
	PopupWindow.prototype.performDown = function(me, x, y) {
		// update cursor position
		me.updateCursorPosition(me, x, y);

		// mark mouse down
		me.mouseDown = true;

		// tell embedded canvas to pass up mouse events
		me.menuManager.passEvents = true;
	};

	// perform mouse/touch up event
	PopupWindow.prototype.performUp = function(me, x, y) {
		// update cursor position
		me.updateCursorPosition(me, x, y);

		// mark mouse not down
		me.mouseDown = false;

		// tell embedded canvas to catch mouse events
		me.menuManager.passEvents = false;
	};

	// perform mouse/touch move event
	PopupWindow.prototype.performMove = function(me, x, y) {
		// check if mouse down (and so dragging)
		if (me.mouseDown) {
			me.updatePosition(x - me.mouseLastX, y - me.mouseLastY);
		}

		// save position
		me.mouseLastX = x;
		me.mouseLastY = y;
	};

	// mouse down event
	PopupWindow.prototype.elementMouseDown = function(me, event) {
		var x = 0, y = 0;

		// get event position
		if (event.pageX || event.pageY) {
			x = event.pageX;
			y = event.pageY;
		} else {
			x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		// perform down event
		me.performDown(me, x, y);

		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		event.preventDefault();
	};

	// mouse up event
	PopupWindow.prototype.elementMouseUp = function(me, event) {
		var x = 0, y = 0;

		// ignore if popup not displayed
		if (me.displayed && me.mouseDown) {
			// get event position
			if (event.pageX || event.pageY) {
				x = event.pageX;
				y = event.pageY;
			} else {
				x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}

			// update cursor position
			me.performUp(me, x, y);

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
		}
	};

	// mouse move event
	PopupWindow.prototype.elementMouseMove = function(me, event) {
		var x = 0, y = 0;

		// ignore if popup not displayed
		if (me.displayed && me.mouseDown) {
			// get event position
			if (event.pageX || event.pageY) {
				x = event.pageX;
				y = event.pageY;
			} else {
				x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}

			// update cursor position
			me.performMove(me, x, y);

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
		}
	};

	// get cursor position over element
	PopupWindow.prototype.updateCursorPosition = function(me, x, y) {
		// update position
		me.mouseLastX = x | 0;
		me.mouseLastY = y | 0;
	};

	// create the global interface
	window["PopupWindow"] = PopupWindow;
}
());
