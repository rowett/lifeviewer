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
		var me = this;

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
		registerEvent(element, "mousedown", function(event) {me.elementMouseDown(me, event);}, false);
		registerEvent(document, "mousemove", function(event) {me.elementMouseMove(me, event);}, false);
		registerEvent(document, "mouseup", function(event) {me.elementMouseUp(me, event);}, false);

		// register event listeners for touch
		registerEvent(element, "touchstart", function(event) {me.touchToMouse(me, event);}, false);
		registerEvent(element, "touchmove", function(event) {me.touchToMouse(me, event);}, false);
		registerEvent(element, "touchend", function(event) {me.touchToMouse(me, event);}, false);

		// register event listener for window resize
		registerEvent(window, "resize", function(event) {me.resizeWindow(me, event);}, false);
	}

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
		x += dx;
		y += dy;
		
		// set the window position
		this.setWindowPosition(x, y, element);
	};

	// set window position
	PopupWindow.prototype.setWindowPosition = function(x, y, element) {
		// get the width and height of the element
		var width = element.clientWidth,
		    height = element.clientHeight,

		    // get the maximum x and y position
		    maxX = window.innerWidth - width,
		    maxY = window.innerHeight - height;

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
		}
		else {
			// run up the parent hierarchy
			while (itemParent.tagName.toLowerCase() !== "body") {
				this.offsetLeft -= itemParent.scrollLeft;
				this.offsetTop -= itemParent.scrollTop;
				itemParent = itemParent.parentNode;
			}
		}
	};

	// touch end event
	PopupWindow.prototype.touchToMouse = function(me, event) {
		var touch = null, simulatedEvent, type = "";

		// deal with touchend
		if (event.type === "touchend") {
			type = "mouseup";
			simulatedEvent = document.createEvent("MouseEvent");
			simulatedEvent.initMouseEvent(type, true, true, window, 1, me.lastScreenX, me.lastScreenY, me.lastClientX, me.lastClientY, false, false, false, false, 0, null);

			// fire the event
			event.target.dispatchEvent(simulatedEvent);
			event.preventDefault();
		}
		else {
			// only deal with single touch
			if (event.touches.length === 1) {
				// map touch events to mouse events
				switch (event.type) {
				// map touchstart to mousedown
				case "touchstart":
					type = "mousedown";
					break;

				// map touchmove to mousemove
				case "touchmove":
					type = "mousemove";
					break;

				// ignore others
				default:
					break;
				}
			}
			// check we got a supported event
			if (type !== "") {
				// build a mouse event
				touch = event.changedTouches[0];
				simulatedEvent = document.createEvent("MouseEvent");
				simulatedEvent.initMouseEvent(type, true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);

				// fire the event
				touch.target.dispatchEvent(simulatedEvent);
				event.preventDefault();

				// save the last position
				me.lastScreenX = touch.screenX;
				me.lastScreenY = touch.screenY;
				me.lastClientX = touch.clientX;
				me.lastClientY = touch.clientY;
			}
		}
	};

	// mouse down event
	PopupWindow.prototype.elementMouseDown = function(me, event) {
		// update cursor position
		me.updateCursorPosition(me, event);

		// mark mouse down
		me.mouseDown = true;

		// tell embedded canvas to pass up mouse events
		me.menuManager.passEvents = true;

		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		event.preventDefault();
	};

	// mouse up event
	PopupWindow.prototype.elementMouseUp = function(me, event) {
		// ignore if popup not displayed
		if (me.displayed && me.mouseDown) {
			// update cursor position
			me.updateCursorPosition(me, event);

			// mark mouse not down
			me.mouseDown = false;

			// tell embedded canvas to catch mouse events
			me.menuManager.passEvents = false;

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
		}
	};

	// mouse move event
	PopupWindow.prototype.elementMouseMove = function(me, event) {
		// ignore if popup not displayed
		if (me.displayed && me.mouseDown) {
			// get last x and y
			var lastX = me.mouseLastX,
			    lastY = me.mouseLastY;

			// update cursor position
			me.updateCursorPosition(me, event);

			// check if mouse down (and so dragging)
			if (me.mouseDown) {
				me.updatePosition(me.mouseLastX - lastX, me.mouseLastY - lastY);
			}
			
			// put original position back
			me.mouseLastX = lastX;
			me.mouseLastY = lastY;

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
		}
	};

	// get cursor position over element
	PopupWindow.prototype.updateCursorPosition = function(me, event) {
		var x, y;
		if (event.pageX || event.pageY) {
			x = event.pageX;
			y = event.pageY;
		}
		else {
			x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		// compute the element offset
		me.computeElementOffset();

		// make the position relative to the element
		x -= me.offsetLeft;
		y -= me.offsetTop;

		// update position
		me.mouseLastX = (x - 1) | 0;
		me.mouseLastY = (y - 1) | 0;
	};

	// create the global interface
	window["PopupWindow"] = PopupWindow;
}
());
