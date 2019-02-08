// html5 canvas menu library
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// define global variables
	/* global registerEvent */

	// TextAlert
	/**
	 * @constructor
	 */
	function TextAlert(appear, hold, disappear, context, menuManager) {
		// menu manager
		this.menuManager = menuManager;

		// steps for text to appear
		this.textAppear = appear;

		// steps to hold text
		this.textHold = hold;

		// steps for text to disappear
		this.textDisappear = disappear;

		// current text message
		this.message = "";

		// priority message steps
		this.priorityAppear = appear;
		this.priorityHold = hold;
		this.priorityDisappear = disappear;

		// current priority message
		this.priorityMessage = "";

		// drawing context
		this.context = context;

		// whether notification has background
		this.txtBg = false;

		// start time for current notification
		this.startTime = 0;

		// start time for priority notification
		this.priorityStart = 0;

		// colour for notifications
		this.colour = "rgb(32,255,255)";

		// colour for priority notifications
		this.priorityColour = "rgb(32,255,255)";

		// iterator for animated priority notification colour
		this.priorityIter = 0;

		// whether animation required for priority notification
		this.animate = false;

		// shadow colour for notifications
		this.shadowColour = "black";

		// background colour for notifications
		this.backgroundColour = "black";
		
		// whether notifications are enabled
		this.enabled = false;

		// default font size
		this.defaultFontSize = 30;
	}

	// return whether a notification is displayed
	TextAlert.prototype.displayed = function() {
		var result = false;

		// check if standard or priority message are displayed
		if (this.message !== "" || this.priorityMessage !== "") {
			result = true;
		}

		// return the flag
		return result;
	};

	// clear notification
	TextAlert.prototype.clear = function(priority, immediately) {
		if (priority) {
			// check if priority message is displayed
			if (this.priorityMessage !== "") {
				// check if immediate clear is required
				if (immediately) {
					this.priorityMessage = "";
				}
				else {
					// switch to disappear section
					this.priorityStart = performance.now() - (this.priorityAppear + this.priorityHold);
				}
			}
		}
		else {
			// check normal message
			if (this.message !== "") {
				// check if immediate clear is required
				if (immediately) {
					this.message = "";
				}
				else {
					// switch to disappear section
					this.startTime = performance.now() - (this.textAppear + this.textHold);
				}
			}
		}
	};

	// create notification
	TextAlert.prototype.notify = function(message, appear, hold, disappear, priority) {
		// create the notification if enabled
		if (this.enabled) {
			// check if this is a priority message
			if (priority) {
				// check if message already displayed
				if (this.priorityMessage !== message) {
					// set priority message
					this.priorityMessage = message;

					// convert frames to milliseconds
					this.priorityAppear = appear * 16;
					this.priorityHold = hold * 16;
					this.priorityDisappear = disappear * 16;

					// set start time to now
					this.priorityStart = performance.now();

					// clear the priority iterator for colour animation
					this.priorityIter = 0;

					// disable animation
					this.animate = false;
				}
			}
			else {
				// set normal message
				this.message = message;

				// convert frames to milliseconds
				this.textAppear = appear * 16;
				this.textHold = hold * 16;
				this.textDisappear = disappear * 16;

				// set the start time to now
				this.startTime = performance.now();
			}
		}
	};

	// draw notification string
	TextAlert.prototype.draw = function(message, isPriority) {
		var xPos = 0,

		    // alpha for background
		    alpha = 0,

		    // line height
			lineHeight = 0;

		// make font smaller if canvas is small
		if (this.context.canvas.width < 96) {
			this.defaultFontSize = 24;
		}
		lineHeight = this.defaultFontSize;

		// compute x position to center text horizontally
		xPos = this.context.measureText(message).width >> 1;

		// draw background if required
		if (this.txtBg) {
			this.context.fillStyle = this.backgroundColour;
			alpha = this.context.globalAlpha;
			this.context.globalAlpha = alpha * 0.5;
			this.context.fillRect(-xPos - 20, -lineHeight, xPos * 2 + 40, lineHeight * 2);
			this.context.globalAlpha = alpha;
		}

		// draw shadow
		this.context.fillStyle = this.shadowColour;
		this.context.fillText(message, -xPos + 2, 2);

		// draw string
		if (isPriority) {
			// check if animated colour needed
			if (this.animate) {
				if (this.priorityIter < 128) {
					this.context.fillStyle = "rgb(" + (this.priorityIter * 2) + "," + (this.priorityIter * 2) + ",255)";
				}
				else {
					this.context.fillStyle = "rgb(" + ((256 - this.priorityIter) * 2) + "," + ((256 - this.priorityIter) * 2) + ",255)";
				}
				this.priorityIter = (this.priorityIter + 4) & 255;
			}
			else {
				this.context.fillStyle = this.priorityColour;
			}
		}
		else {
			this.context.fillStyle = this.colour;
		}
		this.context.fillText(message, -xPos, 0);
	};

	// update notification
	TextAlert.prototype.updateNotification = function(message, appear, hold, disappear, start, offset, isPriority) {
		var scaleFactor = 0,
		    elapsedTime = 0,
		    index = 0,

		    // default font size when not in thumbnail mode
		    fontSize = this.defaultFontSize,

		    // line height
		    lineHeight = fontSize + 2,

		    // thumbnail divisor
		    thumbDivisor = this.menuManager.thumbnailDivisor,

		    // number of pixels from top of display
		    fromTop = 60,

		    // flag whether to clear message
		    clearMessage = true;

		// check for noGUI
		if (this.menuManager.noGUI) {
			fromTop = 0;
			offset = this.context.canvas.height / 2;
			this.txtBg = true;
		}
		else {
			this.txtBg = false;
		}

		// check if there is anything to draw
		if (message !== "") {
			// flag there is nothing to clear
			clearMessage = false;

			// compute the elapsed time
			elapsedTime = performance.now() - start;

			// save context
			this.context.save();

			// check for thumbnail mode
			if (this.menuManager.thumbnail) {
				// check for system messages
				if (isPriority) {
					// vertically center the system message
					fromTop = 0;
					offset = this.context.canvas.height / 2;
				}
				else {
					// reduce the font size by the thumbnail divisor
					fontSize = (fontSize / thumbDivisor);
					lineHeight = (lineHeight / thumbDivisor) | 0;
					
					// reduce the offset
					offset = (offset / thumbDivisor) | 0;

					// reduce the pixels from top of display
					fromTop = (fromTop / thumbDivisor) | 0;
				}
			}

			// set the font size
			this.context.font = fontSize + "px Arial";

			// scale based on appear or disappear
			this.context.translate(this.context.canvas.width / 2 - 1, fromTop + offset);

			// check for appear
			if (elapsedTime <= appear) {
				// zoom in and increase alpha
				scaleFactor = (elapsedTime / appear);
				scaleFactor *= scaleFactor;
				this.context.globalAlpha = scaleFactor;
				this.context.scale(scaleFactor, scaleFactor);
			}
			else {
				// check for disappear
				if (elapsedTime > (appear + hold) && elapsedTime <= (appear + hold + disappear)) {
					// zoom out and decrease alpha
					scaleFactor = (disappear - (elapsedTime - (appear + hold))) / disappear;
					scaleFactor *= scaleFactor;
					this.context.globalAlpha = scaleFactor;
					this.context.scale(scaleFactor, scaleFactor);
				}
			}

			// check if finished
			if (elapsedTime > (appear + hold + disappear)) {
				// set the clear message flag
				clearMessage = true;
			}
			else {
				// check if the message contains a newline
				index = message.indexOf("\\n");
				if (index === -1) {
					// draw the text
					this.draw(message, isPriority);
				}
				else {
					// draw the first line
					this.draw(message.substr(0, index), isPriority);
					
					// go to next line
					this.context.translate(0, lineHeight);

					// draw the second line
					this.draw(message.substr(index + 2), isPriority);
				}
			}

			// restore context
			this.context.restore();
		}

		// return the clear message flag
		return clearMessage;
	};

	// update notification
	TextAlert.prototype.update = function() {
		// update the standard message
		if (this.updateNotification(this.message, this.textAppear, this.textHold, this.textDisappear, this.startTime, 36, false)) {
			this.message = "";
		}

		// update the priority message
		if (!this.menuManager.thumbnail || this.priorityMessage === "Expand" || this.priorityMessage === "Launch") {
			if (this.updateNotification(this.priorityMessage, this.priorityAppear, this.priorityHold, this.priorityDisappear, this.priorityStart, 0, true)) {
				this.priorityMessage = "";
			}
		}
	};

	// Icon
	/**
	 * @constructor
	 */
	function Icon(name, width, height, number) {
		this.name = name;
		this.width = width;
		this.height = height;
		this.number = number;
	}
	
	// IconManager
	/**
	 * @constructor
	 */
	function IconManager(iconsImage, context) {
		// save the drawing context
		this.context = context;

		// save the icon image
		this.iconsImage = iconsImage;

		// list of icons
		this.iconList = [];
	}

	// draw icon
	IconManager.prototype.draw = function(icon, x, y) {
		this.context.drawImage(this.iconsImage, icon.number * icon.width, 0, icon.width, icon.height, x, y, icon.width, icon.height);
	};

	// return number of icons
	IconManager.prototype.length = function() {
		return this.iconList.length;
	};

	// return the named icon
	IconManager.prototype.icon = function(name) {
		var a, i = this.iconList, l = this.length(), result = null;

		// search the list for the named icon
		a = 0;
		while (a < l && !result) {
			if (i[a].name === name) {
				result = i[a];
			}
			else {
				a += 1;
			}
		}

		return result;
	};

	// add an icon to the list
	IconManager.prototype.add = function(name, width, height) {
		// create new icon
		var iconNum = this.iconList.length,
		    newIcon = new Icon(name, width, height, iconNum);

		// add to the list of icons
		this.iconList[iconNum] = newIcon;
	};

	// constants
	var Menu = {
		// orientations
		auto : 0,
		horizontal : 1,
		vertical : 2,

		// menu types
		range : 0,
		button : 1,
		toggle : 2,
		progressBar : 3,
		list : 4,
		label : 5,

		// list selection modes
		single : 0,
		multi : 1,

		// text alignment
		left : 0,
		center : 1,
		right : 2,

		// control position
		north : 0,
		northEast : 1,
		east : 2,
		southEast : 3,
		south : 4,
		southWest : 5,
		west : 6,
		northWest : 7,
		middle : 8
	};

	// MenuItem
	/**
	 * @constructor
	 */
	function MenuItem(id, callback, caller, position, x, y, width, height, lower, upper, current, type, orientation, border, valueDisplay, preText, postText, fixed, icon, owner) {
		// id
		this.id = id;

		// tool tip
		this.toolTip = "";

		// item in a multi-select that is highlighted
		this.highlightItem = -1;

		// whether deleted
		this.deleted = false;

		// callback
		this.callback = callback;

		// caller
		this.caller = caller;

		// icon (list)
		this.icon = icon;

		// absolute position top left
		this.x = x;
		this.y = y;

		// relative position
		this.relX = x;
		this.relY = y;

		// position type
		this.position = position;

		// width and height
		this.width = width;
		this.height = height;

		// border thickness (0 for no border)
		this.border = border;

		// type of menu item
		this.type = type;

		// menu orientation
		if (orientation === Menu.auto) {
			// select orientation based on width and height
			if (width >= height) {
				this.orientation = Menu.horizontal;
			}
			else {
				this.orientation = Menu.vertical;
			}
		}
		else {
			this.orientation = orientation;
		}

		// text orientation
		this.textOrientation = this.orientation;

		// value range represented (order is important)
		this.lower = lower;
		this.upper = upper;

		// current value
		if (type === Menu.range) {
			// allocate value and display value
			this.current = [current, current];
		}
		else {
			this.current = current;
		}

		// whether to display the value
		this.valueDisplay = valueDisplay;

		// text to prefix to the value
		this.preText = preText;

		// text to postfix after the value
		this.postText = postText;

		// decimal places for the value (-1 not numeric)
		this.fixed = fixed;

		// flag for mouse down last update
		this.lastMouseDown = false;

		// last mouse position
		this.lastMouseX = -1;
		this.lastMouseY = -1;

		// last touch coordinates
		this.lastScreenX = -1;
		this.lastScreenY = -1;
		this.lastClientX = -1;
		this.lastClientY = -1;

		// text alignment
		this.textAlign = Menu.center;

		// whether enabled
		this.enabled = true;

		// whether locked
		this.locked = false;

		// toggle menu parents
		this.toggleMenuParents = [];

		// number of toggle menu items
		this.numToggleMenuParents = 0;

		// invert rule
		this.invert = false;

		// whether to cascade toggle menu
		this.cascade = true;

		// background colour and alpha
		this.bgCol = owner.bgCol;
		this.bgAlpha = owner.bgAlpha;

		// foreground colour and alpha
		this.fgCol = owner.fgCol;
		this.fgAlpha = owner.fgAlpha;

		// highlight colour and alpha when mouse is over item
		this.hlCol = owner.hlCol;
		this.hlAlpha = owner.hlAlpha;

		// selected colour and alpha when item selected
		this.selectedCol = owner.selectedCol;
		this.selectedAlpha = owner.selectedAlpha;

		// locked colour and alpha when item locked
		this.lockedCol = owner.lockedCol;
		this.lockedAlpha = owner.lockedAlpha;

		// border thickness (or 0 for no border)
		this.border = owner.border;

		// set the font from the parent
		this.font = owner.defaultFont;
	}

	// set item foreground and background colour
	MenuItem.prototype.setColours = function(fg, bg, highlight, selected, locked) {
		this.fgCol = fg;
		this.bgCol = bg;
		this.hlCol = highlight;
		this.selectedCol = selected;
		this.lockedCol = locked;
	};

	// set a new absolute position
	MenuItem.prototype.setPosition = function(position, x, y) {
		this.position = position;
		this.relX = x;
		this.relY = y;
		this.x = x;
		this.y = y;
	};

	// calculate item position
	MenuItem.prototype.calculatePosition = function(width, height) {
		// copy the absolute position from the relative position
		this.x = this.relX;
		this.y = this.relY;

		// override x or y based on position type
		switch (this.position) {
		// north (top of display)
		case Menu.north:
			// center x
			this.x = ((width - this.width) >> 1) + this.relX;
			break;

		// north east (top right of display)
		case Menu.northEast:
			// make x relative to right of display
			this.x = width + this.relX;
			break;

		// east (right of display)
		case Menu.east:
			// center y
			this.y = ((height - this.height) >> 1) + this.relY;

			// make x relative to right of display
			this.x = width + this.relX;
			break;

		// south east (bottom right of display)
		case Menu.southEast:
			// make x relative to right of display
			this.x = width + this.relX;

			// make y relative to bottom of display
			this.y = height + this.relY;
			break;

		// south (bottom of display)
		case Menu.south:
			// center x
			this.x = ((width - this.width) >> 1) + this.relX;

			// make y relative to bottom of display
			this.y = height + this.relY;
			break;

		// south wast (bottom left of display)
		case Menu.southWest:
			// make y relative to bottom of display
			this.y = height + this.relY;
			break;

		// west (left of display)
		case Menu.west:
			// center y
			this.y = ((height - this.height) >> 1) + this.relY;
			break;

		// north west (top left of display)
		case Menu.northWest:
			// nothing to do since top left is always row 0, column 0
			break;

		// middle
		case Menu.middle:
			// make x and y relative to middle of display
			this.x = ((width - this.width) >> 1) + this.relX;
			this.y = ((height - this.height) >> 1) + this.relY;
			break;

		// ignore others
		default:
			break;
		}
	};

	// add a toggle menu parent
	MenuItem.prototype.addToggleMenuParent = function(parentItem, cascade) {
		var n = this.numToggleMenuParents;

		// save the parent in the list and increment number
		this.toggleMenuParents[n] = [parentItem, cascade];
		n += 1;

		// save the number
		this.numToggleMenuParents = n;
	};

	// add a list of specific items to a toggle menu
	MenuItem.prototype.addItemsToToggleMenu = function(itemList, noCascadeList) {
		// add the items to the list
		var i, l;

		// find out how many items are in the list to add
		l = itemList.length;

		// add the parent to each item
		for (i = 0; i < l; i += 1) {
			itemList[i].addToggleMenuParent(this, true);
		}

		// add the no-cascade parent to each item
		l = noCascadeList.length;
		for (i = 0; i < l; i += 1) {
			noCascadeList[i].addToggleMenuParent(this, false);
		}
	};

	// check if cursor is over this menu item
	MenuItem.prototype.mouseIsOver = function(mouseX, mouseY) {
		var result = false;

		// check whether this item is enabled
		if (this.enabled) {
			// check rectangle
			if (mouseX >= this.x && mouseX < this.x + this.width && mouseY >= this.y && mouseY < this.y + this.height) {
				result = true;
			}
		}
		return result;
	};

	// MenuList
	/**
	 * @constructor
	 */
	function MenuList(callback, activate, caller, context, defaultFont) {
		// context
		this.context = context;

		// default font
		this.defaultFont = defaultFont;

		// whether menu deleted
		this.deleted = false;

		// whether menu locked
		this.locked = false;

		// mouse position
		this.mouseX = -1;
		this.mouseY = -1;
		this.mouseDown = false;
		this.clickHappened = false;

		// range highlight width
		this.rangeHighlightSize = 6;

		// strikethrough width
		this.strikeThroughWidth = 2;

		// callback function to update
		this.callback = callback;

		// holds the list of menu items
		this.menuItems = [];

		// number of menu items
		this.numMenuItems = 0;

		// background colour and alpha
		this.bgCol = "";
		this.bgAlpha = 0;

		// foreground colour and alpha
		this.fgCol = "";
		this.fgAlpha = 0;

		// highlight colour and alpha when mouse is over item
		this.hlCol = "";
		this.hlAlpha = 0;

		// selected colour and alpha when item selected
		this.selectedCol = "";
		this.selectedAlpha = 0;

		// locked colour and alpha when item locked
		this.lockedCol = "";
		this.lockedAlpha = 0;

		// border thickness (or 0 for no border)
		this.border = 0;

		// default orientation (auto bases orientation on the width and height of the item)
		this.defaultOrientation = Menu.auto;

		// active item
		this.activeItem = -1;

		// mouse over item
		this.mouseOverItem = -1;

		// callback when no item drag
		this.dragCallback = null;

		// callback when menu activated
		this.activateCallback = activate;

		// caller object for callbacks
		this.caller = caller;

		// icon manager
		this.iconManager = null;
	}

	// set menu foreground and background colour
	MenuList.prototype.setColours = function(fg, bg, highlight, selected, locked) {
		var i = 0;

		// set the colours in every control
		for (i = 0; i < this.menuItems.length; i += 1) {
			this.menuItems[i].setColours(fg, bg, highlight, selected, locked);
		}
	};

	// check parent toggle menu state for visibility
	MenuList.prototype.parentMenu = function(parentItem, cascade) {
		var result = false, i, l = parentItem.numToggleMenuParents;

		// start from this toggle menu
		if (parentItem.type === Menu.list && parentItem.upper === Menu.multi) {
			result = parentItem.current[0];
		}
		else {
			result = (parentItem.current === parentItem.upper);
		}

		// invert if required
		if (parentItem.invert) {
			result = !result;
		}

		// combine with any parent toggle menus
		if (result && cascade) {
			for (i = 0; i < l; i += 1) {
				result = result && this.parentMenu(parentItem.toggleMenuParents[i][0], parentItem.toggleMenuParents[i][1]);
			}
		}

		return result;
	};

	// set whether this item is enabled (visible) based on any toggle menu parents
	MenuList.prototype.toggleMenu = function(menuItem) {
		var result = true, i, l = menuItem.numToggleMenuParents;

		// assume enabled
		result = true;

		// combine with the toggle menu parents state
		for (i = 0; i < l; i += 1) {
			result = result && this.parentMenu(menuItem.toggleMenuParents[i][0], menuItem.toggleMenuParents[i][1]);
		}

		// set the enabled state
		menuItem.enabled = result;
	};

	// initialise menu list
	MenuList.prototype.init = function() {
		var currentItem, i;

		// iterate over each menu item
		for (i = 0; i < this.numMenuItems; i += 1) {
			currentItem = this.menuItems[i];

			// enable each item
			currentItem.enabled = true;

			// read the current value
			switch (currentItem.type) {
			// toggle
			case Menu.toggle:
				if (currentItem.callback) {
					// read the current toggle value
					currentItem.current = currentItem.callback(currentItem.current === currentItem.upper, false, this.caller) ? currentItem.upper : currentItem.lower;
				}
				break;

			// range
			case Menu.range:
				if (currentItem.callback) {
					// read the current range value
					currentItem.current = currentItem.callback(currentItem.current, false, this.caller);
				}
				break;

			// list
			case Menu.list:
				if (currentItem.callback) {
					// initialise default item
					currentItem.current = currentItem.callback(currentItem.current, false, this.caller);
				}
				break;

			// ignore others
			default:
				break;
			}

			// process toggle menu items
			this.toggleMenu(currentItem);
		}
	};

	// add list item
	MenuList.prototype.addListItem = function(callback, position, x, y, width, height, list, current, selection) {
		// create the item
		this.menuItems[this.numMenuItems] = new MenuItem(this.numMenuItems, callback, this.caller, position, x, y, width, height, list, selection, current, Menu.list, this.defaultOrientation, this.border, true, "", "", -1, [], this);

		// increment the item number
		this.numMenuItems += 1;

		// return the item
		return this.menuItems[this.numMenuItems - 1];
	};

	// add range item
	MenuList.prototype.addRangeItem = function(callback, position, x, y, width, height, lower, upper, current, valueDisplay, preText, postText, fixed) {
		// create the item
		this.menuItems[this.numMenuItems] = new MenuItem(this.numMenuItems, callback, this.caller, position, x, y, width, height, lower, upper, current, Menu.range, this.defaultOrientation, this.border, valueDisplay, preText, postText, fixed, null, this);

		// increment the item number
		this.numMenuItems += 1;

		// return the item
		return this.menuItems[this.numMenuItems - 1];
	};

	// add label item
	MenuList.prototype.addLabelItem = function(position, x, y, width, height, caption) {
		// create the item
		this.menuItems[this.numMenuItems] = new MenuItem(this.numMenuItems, null, null, position, x, y, width, height, 0, 0, 0, Menu.label, this.defaultOrientation, this.border, true, caption, "", -1, null, this);

		// increment the item number
		this.numMenuItems += 1;

		// return the item
		return this.menuItems[this.numMenuItems - 1];
	};

	// add button item
	MenuList.prototype.addButtonItem = function(callback, position, x, y, width, height, caption) {
		// create the item
		this.menuItems[this.numMenuItems] = new MenuItem(this.numMenuItems, callback, this.caller, position, x, y, width, height, 0, 0, 0, Menu.button, this.defaultOrientation, this.border, true, caption, "", -1, null, this);

		// increment the item number
		this.numMenuItems += 1;

		// return the item
		return this.menuItems[this.numMenuItems - 1];
	};

	// add toggle item
	MenuList.prototype.addToggleItem = function(callback, position, x, y, width, height, lower, upper, current, valueDisplay, preText, postText) {
		// create the item
		this.menuItems[this.numMenuItems] = new MenuItem(this.numMenuItems, callback, this.caller, position, x, y, width, height, lower, upper, current, Menu.toggle, this.defaultOrientation, this.border, valueDisplay, preText, postText, -1, null, this);

		// increment the item number
		this.numMenuItems += 1;

		// return the item
		return this.menuItems[this.numMenuItems - 1];
	};

	// add progress bar item
	MenuList.prototype.addProgressBarItem = function(position, x, y, width, height, lower, upper, current, valueDisplay, preText, postText, fixed) {
		// create the item
		this.menuItems[this.numMenuItems] = new MenuItem(this.numMenuItems, null, null, position, x, y, width, height, lower, upper, current, Menu.progressBar, this.defaultOrientation, this.border, valueDisplay, preText, postText, fixed, null, this);

		// increment the item number
		this.numMenuItems += 1;

		// return the item
		return this.menuItems[this.numMenuItems - 1];
	};

	// draw shadow string
	MenuList.prototype.drawShadowString = function(string, item, strikeThrough) {
		var textWidth, target, i, testString, alignPos;

		// convert the string to a string
		string += String();

		// check there is something to write
		if (string !== "") {
			// set the origin to the center of the menu item
			this.context.save();
			this.context.translate(item.x + item.width / 2, item.y + item.height / 2);

			// set the font
			this.context.font = item.font;

			// rotate if the item is vertical
			if (item.textOrientation === Menu.vertical) {
				this.context.rotate(90 / 180 * Math.PI);
			}

			// get the text item width
			textWidth = this.context.measureText(string).width;

			// check if the text is wider than the control
			if (item.textOrientation === Menu.vertical) {
				target = item.height;
			}
			else {
				target = item.width;
			}

			if (textWidth >= target - 6) {
				i = string.length;

				// find a shorter string that will fit
				if (i) {
					do {
						i -= 1;
						testString = string.substr(0, i) + "...";
						textWidth = this.context.measureText(testString).width;
					}
					while (i > 1 && textWidth >= target - 6);
				}
				string = testString;
			}

			// compute the alignment
			switch (item.textAlign) {
			// left aligned
			case Menu.left:
				alignPos = item.width / 2 - 2;
				break;

			// centered
			case Menu.center:
				alignPos = textWidth / 2;
				break;

			// right aligned
			case Menu.right:
				alignPos = textWidth / 2 - (item.width - textWidth) / 2 + 4;
				break;

			// ignore other alignments
			default:
				break;
			}

			// draw the shadow
			this.context.fillStyle = item.bgCol;
			if (strikeThrough) {
				this.context.fillRect(2 - alignPos, 2, textWidth, this.strikeThroughWidth);
			}
			this.context.fillText(string, 2 - alignPos + 0.5, 2 + 0.5);

			// draw the text
			if (item.locked || this.locked) {
				this.context.fillStyle = item.lockedCol;
			}
			else {
				this.context.fillStyle = item.fgCol;
			}
			this.context.fillText(string, -alignPos + 0.5, 0.5);
			if (strikeThrough) {
				this.context.fillRect(-alignPos, 0, textWidth, this.strikeThroughWidth);
			}

			// restore transformation
			this.context.restore();
		}
	};

	// draw label item value
	MenuList.prototype.drawLabelValue = function(item) {
		var itemString;

		// set the alpha
		this.context.globalAlpha = this.fgAlpha;

		// build the caption from the pre text
		itemString = item.preText;

		// draw the string
		this.drawShadowString(itemString, item, false);
	};

	// draw button item value
	MenuList.prototype.drawButtonValue = function(item) {
		var itemString;

		// set the alpha
		this.context.globalAlpha = this.fgAlpha;

		// build the caption from the pre text
		itemString = item.preText;

		// draw the string
		this.drawShadowString(itemString, item, false);
	};

	// draw progress bar item value
	MenuList.prototype.drawProgressBarValue = function(item) {
		var itemString, markerPos;

		// compute the marker position in the bar
		markerPos = (item.current - item.lower) / (item.upper - item.lower);

		// set the highlight alpha
		this.context.globalAlpha = item.bgAlpha;
		this.context.fillStyle = item.fgCol;

		// scale to the bar item
		if (item.orientation === Menu.horizontal) {
			// horizontal marker
			markerPos *= (item.width - 3);
			markerPos = (markerPos + 1) | 0;

			// draw the marker
			this.context.fillRect(item.x + markerPos, item.y, 1, item.height);
		}
		else {
			// vertical marker
			markerPos *= (item.height - 3);
			markerPos = (markerPos + 1) | 0;

			// draw the marker
			this.context.fillRect(item.x, item.y + markerPos, item.width, 1);
		}

		// build the caption from the pre text
		itemString = item.preText;

		// check whether to display the caption
		if (item.valueDisplay) {
			// add the value
			if (item.fixed !== -1) {
				itemString += item.current.toFixed(item.fixed);
			}
			else {
				itemString += item.current;
			}

			// add the post text
			itemString += item.postText;
		}

		// draw the string if non-blank
		if (itemString !== "") {
			this.context.globalAlpha = item.fgAlpha;
			this.drawShadowString(itemString, item, false);
		}
	};

	// draw range item value
	MenuList.prototype.drawRangeValue = function(item, highlight) {
		var markerPos, highlightSize, itemString;

		// compute the marker position in the range
		markerPos = (item.current[0] - item.lower) / (item.upper - item.lower);

		// get the highlight size
		highlightSize = this.rangeHighlightSize;

		// scale to the range item
		if (item.orientation === Menu.horizontal) {
			// horizontal marker
			markerPos *= (item.width - 3);
			markerPos = (markerPos + 1) | 0;

			// draw the highlight
			if (highlight) {
				this.context.fillStyle = item.hlCol;
				this.context.globalAlpha = item.hlAlpha;

				this.context.fillRect(item.x + markerPos - highlightSize, item.y, highlightSize, item.height);
				this.context.fillRect(item.x + markerPos + 1, item.y, highlightSize, item.height);
			}

			// draw the marker
			if (item.locked || this.locked) {
				this.context.fillStyle = item.lockedCol;
				this.context.globalAlpha = item.lockedAlpha;
			}
			else {
				this.context.fillStyle = item.fgCol;
				this.context.globalAlpha = item.fgAlpha;
			}
			this.context.fillRect(item.x + markerPos, item.y, 1, item.height);
		}
		else {
			// vertical marker
			markerPos *= (item.height - 3);
			markerPos = (markerPos + 1) | 0;

			// draw the highlight
			if (highlight) {
				this.context.fillStyle = item.hlCol;
				this.context.globalAlpha = item.hlAlpha;

				this.context.fillRect(item.x, item.y + markerPos - highlightSize, item.width, highlightSize);
				this.context.fillRect(item.x, item.y + markerPos + 1, item.width, highlightSize);
			}

			// draw the marker
			if (item.locked || this.locked) {
				this.context.fillStyle = item.lockedCol;
				this.context.globalAlpha = item.lockedAlpha;
			}
			else {
				this.context.fillStyle = item.fgCol;
				this.context.globalAlpha = item.fgAlpha;
			}
			this.context.fillRect(item.x, item.y + markerPos, item.width, 1);
		}

		// build the caption from the pre text
		itemString = item.preText;

		// check whether to display the caption
		if (item.valueDisplay) {
			if (item.fixed >= 0) {
				itemString += item.current[1].toFixed(item.fixed);
			}
			else {
				itemString += item.current[1];
			}
		}

		// add the post text
		itemString += item.postText;

		if (itemString !== "") {
			// draw the string
			this.context.globalAlpha = this.fgAlpha;
			this.drawShadowString(itemString, item, false);
		}
	};

	// draw toggle item value
	MenuList.prototype.drawToggleValue = function(item) {
		var strikeThrough, itemString;

		// set the alpha
		this.context.globalAlpha = this.fgAlpha;

		// check for strikethrough
		strikeThrough = item.lower === "-" && item.upper === "" && item.current === item.lower;

		// build the caption from the pre text
		itemString = item.preText;

		// add the value if enabled
		if (item.valueDisplay && !strikeThrough) {
			itemString += item.current;
		}

		// add the post text
		itemString += item.postText;

		// draw the string
		this.drawShadowString(itemString, item, strikeThrough);
	};

	// get grid cell value
	MenuList.prototype.gridCell = function(item) {
		var cellX, cellY, gridX, gridY, mouseX, mouseY;

		// read the grid size
		gridX = item.lower;
		gridY = item.upper;

		mouseX = this.mouseX;
		mouseY = this.mouseY;

		// check item is in range
		if (mouseX < item.x) {
			mouseX = item.x;
		}
		else {
			if (mouseX >= item.x + item.width) {
				mouseX = item.x + item.width - 1;
			}
		}
		if (mouseY < item.y) {
			mouseY = item.y;
		}
		else {
			if (mouseY >= item.y + item.height) {
				mouseY = item.y + item.height - 1;
			}
		}

		// find the cell
		cellX = ((mouseX - item.x) / gridX)|0;
		cellY = ((mouseY - item.y) / gridY)|0;

		// return the cell
		return [cellX, cellY];
	};

	// draw list values
	MenuList.prototype.drawListValue = function(item, highlight) {
		var i, l, list, x, y, itemSize, width, height, orientation, text, itemNum, values;

		// get the item position and size
		x = item.x;
		y = item.y;
		width = item.width;
		height = item.height;
		orientation = item.orientation;
		values = item.current;

		// get the list items
		list = item.lower;
		l = list.length;
		if (item.orientation === Menu.horizontal) {
			itemSize = width / l;
		}
		else {
			itemSize = height / l;
		}

		// draw the set item or items
		this.context.globalAlpha = item.selectedAlpha;
		this.context.fillStyle = item.selectedCol;

		if (item.upper === Menu.single) {
			// single so draw set item
			i =  item.current;
			if (item.orientation === Menu.horizontal) {
				this.context.fillRect(x + i * itemSize + 1, y + 1, itemSize - 2, height - 2);
			}
			else {
				this.context.fillRect(x + 1, y + 1 + i * itemSize, width - 2, itemSize - 2);
			}
		}
		else {
			// multi so draw all set items
			if (item.orientation === Menu.horizontal) {
				for (i = 0; i < l; i += 1) {
					if (values[i]) {
						this.context.fillRect(x + i * itemSize + 1, y + 1, itemSize - 2, height - 2);
					}
				}
			}
			else {
				for (i = 0; i < l; i += 1) {
					if (values[i]) {
						this.context.fillRect(x + 1, y + 1 + i * itemSize, width - 2, itemSize - 2);
					}
				}
			}
		}

		// draw highlight if required
		if (highlight) {
			this.context.globalAlpha = item.hlAlpha;
			this.context.fillStyle = item.hlCol;

			if (item.orientation === Menu.horizontal) {
				itemNum = (((this.mouseX - x) / width) * l) | 0;
				if (itemNum >= 0 && itemNum < l) {
					this.context.fillRect(x + itemNum * itemSize + 0.5, y + 0.5, itemSize - 1, height - 1);
				}
			}
			else {
				itemNum = (((this.mouseY - y) / height) * l) | 0;
				if (itemNum >= 0 && itemNum < l) {
					this.context.fillRect(x + 0.5, y + 0.5 + itemNum * itemSize, width - 1, itemSize - 1);
				}
			}
			
			// save the highlight item
			item.highlightItem = itemNum;
		}
		else {
			// mark no highlight item
			item.highlightItem = -1;
		}

		// draw the icons if present
		this.context.globalAlpha = this.fgAlpha;
		if (item.orientation === Menu.horizontal) {
			for (i = 0; i < l; i += 1) {
				if (item.icon[i]) {
					this.iconManager.draw(item.icon[i], item.x + itemSize * i, item.y);
				}
			}
		}
		else {
			for (i = 0; i < l; i += 1) {
				if (item.icon[i]) {
					this.iconManager.draw(item.icon[i], item.x, item.y + itemSize * i);
				}
			}
		}

		// draw the items
		this.context.globalAlpha = item.fgAlpha;
		this.context.fillStyle = item.fgCol;
		if (orientation === Menu.horizontal) {
			// draw each item
			for (i = 0; i < l; i += 1) {
				text = list[i];
				if (text !== "") {
					this.context.save();
					this.context.translate((0.5 + (i - l / 2)) * itemSize, 0);
					this.drawShadowString(text, item, false);
					this.context.restore();
				}
			}
		}
		else {
			for (i = 0; i < l; i += 1) {
				text = list[i];
				if (text !== "") {
					this.context.save();
					this.context.translate(0, (0.5 + (i - l / 2)) * itemSize);
					this.drawShadowString(text, item, false);
					this.context.restore();
				}
			}
		}
	};

	// draw menu item
	MenuList.prototype.drawItem = function(item, mouseIsOver, itemNum, activeNum) {
		var markerPos, highlight, highlightSize, markerX, markerY, mX, mY, i, l, w;

		// button and toggle types use the highlight colour as the background if active or no active item and mouse over
		if ((itemNum === activeNum || (activeNum === -1 && mouseIsOver)) && (item.type === Menu.button || item.type === Menu.toggle)) {
			this.context.fillStyle = item.hlCol;
			this.context.globalAlpha = item.hlAlpha;
		}
		else {
			// use the background colour
			this.context.fillStyle = item.bgCol;
			this.context.globalAlpha = item.bgAlpha;
		}

		// draw the background
		switch (item.type) {
		// progress bar
		case Menu.progressBar:
			// compute the marker position
			markerPos = (item.current - item.lower) / (item.upper - item.lower);

			// set selected colour
			this.context.fillStyle = item.selectedCol;
			this.context.globalAlpha = item.selectedAlpha;

			// check orientation
			if (item.orientation === Menu.horizontal) {
				// horizontal marker
				markerPos *= (item.width - 3);
				markerPos = (markerPos + 1) | 0;

				// draw highlight
				this.context.fillRect(item.x, item.y, markerPos, item.height);

				// draw background
				this.context.fillStyle = item.bgCol;
				this.context.globalAlpha = item.bgAlpha;
				this.context.fillRect(item.x + markerPos, item.y, item.width - markerPos, item.height);
			}
			else {
				// vertical
				markerPos *= (item.height - 3);
				markerPos = (markerPos + 1) | 0;

				// draw highlight
				this.context.fillRect(item.x, item.y, item.width, markerPos);

				// draw background
				this.context.fillStyle = item.bgCol;
				this.context.fillRect(item.x, item.y + markerPos, item.width, item.height - markerPos);
			}
			break;

		// range
		case Menu.range:
			// compute the marker position in the range
			markerPos = (item.current[0] - item.lower) / (item.upper - item.lower);
			highlight = (itemNum === activeNum) || (activeNum === -1 && mouseIsOver);

			// get the highlight size
			highlightSize = 1;
			if (highlight) {
				highlightSize = this.rangeHighlightSize;

				// scale to the range item
				if (item.orientation === Menu.horizontal) {
					// horizontal marker
					markerPos *= (item.width - 3);
					markerPos = (markerPos + 1) | 0;
			
					// draw left part
					markerX = markerPos - highlightSize;
					if (markerX > 0) {
						this.context.fillRect(item.x, item.y, markerX, item.height);
					}

					// draw right part
					markerX = 1 + markerPos + highlightSize;
					if (markerX < item.width) {
						this.context.fillRect(item.x + markerX, item.y, item.width - markerX, item.height);
					}
				}
				else {
					// vertical marker
					markerPos *= (item.height - 3);
					markerPos = (markerPos + 1) | 0; 

					// draw top part
					markerY = markerPos - highlightSize;
					if (markerY > 0) {
						this.context.fillRect(item.x, item.y, item.width, markerY);
					}

					// draw bottom part
					markerY = 1 + markerPos + highlightSize;
					if (markerY < item.height) {
						this.context.fillRect(item.x, item.y + markerY, item.width, item.height - markerY);
					}
				}
			}
			else {
				// no highlight
				this.context.fillRect(item.x, item.y, item.width, item.height);
			}
			break;

		// other types (draw rectangle)
		default:
			this.context.fillRect(item.x, item.y, item.width, item.height);
			break;
		}

		// draw the icon if present
		if (item.type !== Menu.list) {
			if (item.icon) {
				// draw the icon
				this.context.globalAlpha = item.fgAlpha;
				this.iconManager.draw(item.icon, item.x, item.y);
			}
		}

		// draw the border if non-zero
		if (item.border > 0) {
			// set foreground colour and alpha
			if (item.locked || this.locked) {
				this.context.strokeStyle = item.lockedCol;
				this.context.globalAlpha = item.lockedAlpha;
			}
			else {
				this.context.strokeStyle = item.fgCol;
				this.context.globalAlpha = item.fgAlpha;
			}

			// set border width
			this.context.lineWidth = item.border;

			// draw the border
			switch (item.type) {
			case Menu.label:
				// draw nothing
				break;

			case Menu.list:
				// draw boxes around each list item
				l = item.lower.length;
				if (item.orientation === Menu.horizontal) {
					w = item.width / l;

					for (i = 0; i < l; i += 1) {
						this.context.strokeRect(item.x + 0.5 + i * w, item.y + 0.5, w - 1, item.height - 1);
					}
				}
				else {
					w = item.height / l;

					for (i = 0; i <l; i += 1) {
						this.context.strokeRect(item.x + 0.5, item.y + 0.5 + i * w, item.width - 1, w - 1);
					}
				}
				break;

			default:
				// other types (draw rectangle)
				this.context.strokeRect(item.x + 0.5, item.y + 0.5, item.width - 1, item.height - 1);
				break;
			}
		}

		// draw the value with the foreground colour
		switch (item.type) {
		// button
		case Menu.button:
			this.drawButtonValue(item);
			break;

		// label
		case Menu.label:
			this.drawLabelValue(item);
			break;

		// range
		case Menu.range:
			this.drawRangeValue(item, (itemNum === activeNum) || (activeNum === -1 && mouseIsOver));
			break;

		// toggle
		case Menu.toggle:
			this.drawToggleValue(item);
			break;

		// progress bar
		case Menu.progressBar:
			this.drawProgressBarValue(item);
			break;

		// list
		case Menu.list:
			this.drawListValue(item, (itemNum === activeNum) || (activeNum === -1 && mouseIsOver));
			break;

		// ignore others
		default:
			break;
		}

		// check if the item is changed
		if (itemNum === activeNum) {
			switch (item.type) {
			// range
			case Menu.range:
				// update the range position
				mY = this.mouseY;

				// vertical orientation
				if (item.orientation === Menu.vertical) {
					// ensure Y is in range
					if (mY < item.y) {
						mY = item.y;
					}
					else {
						if (mY >= item.y + item.height) {
							mY = item.y + item.height - 1;
						}
					}
					item.current[0] = ((mY - item.y) / (item.height - 1)) * (item.upper - item.lower) + item.lower;
				}
				else {
					// horizontal orientation
					mX = this.mouseX;

					// ensure X is in range
					if (mX < item.x) {
						mX = item.x;
					}
					else {
						if (mX >= item.x + item.width) {
							mX = item.x + item.width - 1;
						}
					}
					item.current[0] = ((mX - item.x) / (item.width - 1)) * (item.upper - item.lower) + item.lower;
				}

				// execute callback
				if (item.callback) {
					item.current = item.callback(item.current, true, item.caller);
				}
				break;

			// ignore others
			default:
				break;
			}
		}

		// check if this item was clicked
		if (mouseIsOver && !this.mouseDown && item.lastMouseDown) {
			switch (item.type) {
			// button clicked
			case Menu.button:
				// execute callback
				if (item.callback) {
					item.callback(item.caller);
				}
				break;

			// toggle clicked
			case Menu.toggle:
				// toggle the item value
				if (item.current === item.upper) {
					item.current = item.lower;
				}
				else {
					item.current = item.upper;
				}
				// execute callback
				if (item.callback) {
					item.callback(item.current === item.upper, true, item.caller);
				}
				break;

			// list clicked
			case Menu.list:
				// determine which item clicked
				l = item.lower.length;
				if (item.orientation === Menu.horizontal) {
					w = (((this.mouseX - item.x) / item.width) * l) | 0;
				}
				else {
					w = (((this.mouseY - item.y) / item.height) * l) | 0;
				}

				// check whether single select or multi
				if (item.upper === Menu.single) {
					if (item.callback) {
						item.current = item.callback(w, true, item.caller);
					}
					else {
						item.current = w;
					}
				}
				else {
					// multi select so invert current item
					item.current[w] = !item.current[w];

					if (item.callback) {
						item.callback(item.current, true, item.caller);
					}
				}
				break;

			// ignore others
			default:
				break;
			}
		}

		// remember the last mouse down state for this item
		if (mouseIsOver && itemNum === activeNum) {
			item.lastMouseDown = this.mouseDown;
			item.lastMouseX = this.mouseX;
			item.lastMouseY = this.mouseY;
		}
		else {
			// if mouse up then forget state
			item.lastMouseDown = false;
			item.lastMouseX = -1;
			item.lastMouseY = -1;
		}
	};

	// draw menu items on the given context and return whether to toggle menus
	MenuList.prototype.drawMenu = function() {
		var currentItem = null,
		    mouseIsOver = false,
		    activeItem = this.activeItem,
		    i = 0,
		    result = false,
		    canvasWidth = this.context.canvas.width,
		    canvasHeight = this.context.canvas.height;
		
		// flag no need to toggle menus
		result = false;

		// clear mouse over item
		this.mouseOverItem = -1;

		// check whether menu is deleted
		if (!this.deleted) {
			// get the current active item
			activeItem = this.activeItem;

			// set text alignment
			this.context.textAlign = "left";

			// draw each item
			for (i = 0; i < this.numMenuItems; i += 1) {
				currentItem = this.menuItems[i];

				// ignore item if it is deleted
				if (!currentItem.deleted) {
					// update item position
					currentItem.calculatePosition(canvasWidth, canvasHeight);

					// check if the mouse is over the item and the item is not locked
					mouseIsOver = currentItem.mouseIsOver(this.mouseX, this.mouseY) && !(currentItem.locked || this.locked);
				
					// update the mouse over item
					if (mouseIsOver && !this.mouseDown) {
						this.mouseOverItem = i;
					}

					// update active item if no active item and mouse down over an item and the item can respond to a click
					if ((this.mouseDown && activeItem === -1 && mouseIsOver) || (mouseIsOver && this.clickHappened)) {
						if (currentItem.type !== Menu.label) {
							activeItem = i;
							if (this.clickHappened) {
								currentItem.lastMouseDown = i;
							}
						}
					}

					// if the current item is locked and it is the active item then clear active item
					if ((i === activeItem) && (currentItem.locked || this.locked)) {
						activeItem = -1;
						mouseIsOver = false;
					}

					// draw the item
					if (currentItem.enabled) {
						this.drawItem(currentItem, mouseIsOver, i, activeItem);
					}
				}
			}

			// if the active item is a toggle menu process it
			if (activeItem >= 0 && !this.mouseDown) {
				// flag we need to toggle menus
				result = true;
			}

			// check for mouse down on background
			if (this.mouseDown && activeItem === -1) {
				activeItem = -2;
			}

			// check for background drag
			if (activeItem === -2) {
				// call drag callback if set and menu not locked
				if (this.dragCallback && !this.locked) {
					this.dragCallback(this.mouseX, this.mouseY, this.mouseDown, this.caller);
				}
			}

			// reset active item if mouse up
			if (!this.mouseDown) {
				activeItem = -1;
			}

			// save active item
			this.activeItem = activeItem;

			// reset global alpha
			this.context.globalAlpha = 1;
		}

		// return flag for toggle menus
		return result;
	};

	// menu manager
	/**
	 * @constructor
	 */
	function MenuManager(mainContext, offContext, defaultFont, iconManager, caller, gotFocus) {
		var me = this,
		    i = 0,
		    mainCanvas = mainContext.canvas;

		// whether event processed
		this.processedEvent = true;

		// whether updates are idle
		this.idle = true;

		// minimum tooltip Y offset
		this.minToolTipY = 40;

		// minimum tooltip X offset
		this.minToolTipX = 40;

		// tooltip delay
		this.toolTipDelay = 50;

		// current tooltip counter
		this.toolTipCounter = 0;

		// last tooltip control
		this.toolTipControl = -1;

		// last tooltip control multi-item
		this.toolTipMulti = -1;

		// last active control to stop tooltip once item clicked
		this.toolTipLastActive = -1;

		// flag for passing up mouse events
		this.passEvents = false;

		// caller for callbacks
		this.caller = caller;

		// whether GUI disabled
		this.noGUI = false;

		// whether RLE copy disabled
		this.noCopy = false;

		// whether thumbnail mode active
		this.thumbnail = false;

		// whether thumbnail launch mode active
		this.thumbLaunch = false;

		// thumbnail divisor
		this.thumbnailDivisor = 4;

		// got focus callback
		this.focusCallback = gotFocus;

		// click to interact flag
		this.clickToInteract = false;

		// whether canvas has focus
		this.hasFocus = false;

		// auto update flag
		this.autoUpdate = true;

		// update scheduled flag
		this.updateScheduled = false;

		// count of updates to run
		this.updateCount = 1;

		// default background colour
		this.bgCol = "black";
		this.bgAlpha = 0.7;

		// default foreground colour
		this.fgCol = "rgb(32,255,255)";
		this.fgAlpha = 1.0;

		// default highlight colour
		this.hlCol = "rgb(0,240,32)";
		this.hlAlpha = 0.7;

		// default selected colour
		this.selectedCol = "blue";
		this.selectedAlpha = 0.7;

		// default locked colour
		this.lockedCol = "grey";
		this.lockedAlpha = 1.0;

		// default border width
		this.border = 1;

		// callback
		this.callbackFunction = (function(me) { return function() { me.processCallback(me); }; }(this));

		// icon manager
		this.iconManager = iconManager;

		// main drawing context
		this.mainContext = mainContext;

		// offboard drawing context
		this.offContext = offContext;

		// mouse status
		this.mouseDown = false;
		this.mouseLastX = -1;
		this.mouseLastY = -1;

		// active menu list
		this.currentMenu = null;

		// default menu font
		this.defaultFont = defaultFont;

		// whether to display timing information
		this.showTiming = false;

		// whether to display extended timing information
		this.showExtendedTiming = false;

		// last update
		this.lastUpdate = performance.now();

		// last timings
		this.numTimings = 5;
		this.timingIndex = 0;
		this.lastMenu = [];
		this.lastWork = [];
		this.lastFrame = [];

		// initialise timing
		for (i = 0; i < this.numTimings; i += 1) {
			this.lastMenu[i] = 0;
			this.lastWork[i] = 0;
			this.lastFrame[i] = 0;
		}

		// new menu to load
		this.loadMenu = null;

		// flag if toggle processing required
		this.toggleRequired = false;

		// notification
		this.notification = new TextAlert(25, 100, 25, offContext, this);

		// last mouse up time
		this.lastMouseUp = performance.now();

		// whether update processed since last mouse down
		this.updateSinceMouseDown = false;

		// whether a click happened (mouse up + mouse down before update)
		this.clickHappened = false;

		// canvas offset
		this.offsetLeft = 0;
		this.offsetTop = 0;

		// register event listeners for canvas click
		registerEvent(mainCanvas, "mousedown", function(event) {me.canvasMouseDown(me, event);}, false);
		registerEvent(mainCanvas, "mousemove", function(event) {me.canvasMouseMove(me, event);}, false);
		registerEvent(mainCanvas, "mouseup", function(event) {me.canvasMouseUp(me, event);}, false);
		registerEvent(mainCanvas, "mouseover", function(event) {me.canvasMouseOver(me, event);}, false);
		registerEvent(mainCanvas, "mouseout", function(event) {me.canvasMouseOut(me, event);}, false);

		// register event listeners for touch
		registerEvent(mainCanvas, "touchstart", function(event) {me.touchToMouse(me, event);}, false);
		registerEvent(mainCanvas, "touchmove", function(event) {me.touchToMouse(me, event);}, false);
		registerEvent(mainCanvas, "touchend", function(event) {me.touchToMouse(me, event);}, false);
	}

	// compute canvas offset
	MenuManager.prototype.computeCanvasOffset = function() {
		// get the canvas
		var mainCanvas = this.mainContext.canvas,
		    
		    // get the item parent
		    itemParent = mainCanvas.offsetParent;

		// get the offset of the canvas
		this.offsetLeft = mainCanvas.offsetLeft;
		this.offsetTop = mainCanvas.offsetTop;

		// visit the parents adding their offsets
		while (itemParent) {
			this.offsetLeft += itemParent.offsetLeft;
			this.offsetTop += itemParent.offsetTop;
			itemParent = itemParent.offsetParent;
		}

		// get the scroll position of the canvas
		itemParent = mainCanvas.parentNode;

		// check if the parent is fixed
		if (itemParent.style.position === "fixed") {
			// subtract the offset of the body
			this.offsetLeft += document.body.scrollLeft + document.documentElement.scrollLeft;
			this.offsetTop += document.body.scrollTop + document.documentElement.scrollTop;
		}
		else {
			// run up the parent hierarchy
			while(itemParent.tagName.toLowerCase() !== "body") {
				this.offsetLeft -= itemParent.scrollLeft;
				this.offsetTop -= itemParent.scrollTop;
				itemParent = itemParent.parentNode;
			}
		}
	};

	// create menu
	MenuManager.prototype.createMenu = function(callback, activate, caller) {
		// create menu object
		var menuList = new MenuList(callback, activate, caller, this.offContext, this.defaultFont);

		// set default style
		menuList.fgCol = this.fgCol;
		menuList.fgAlpha = this.fgAlpha;
		menuList.bgCol = this.bgCol;
		menuList.bgAlpha = this.bgAlpha;
		menuList.hlCol = this.hlCol;
		menuList.hlAlpha = this.hlAlpha;
		menuList.selectedCol = this.selectedCol;
		menuList.selectedAlpha = this.selectedAlpha;
		menuList.lockedCol = this.lockedCol;
		menuList.lockedAlpha = this.lockedAlpha;
		menuList.border = this.border;

		// return new menu
		return menuList;
	};

	// draw tooltip
	MenuManager.prototype.drawToolTip = function() {
		// get current menu
		var current = this.currentMenu,

		    // control
		    control = null,

		    // control width and height
		    controlWidth = 0,
		    controlHeight = 0,

		    // control location
		    controlX = 0,
		    controlY = 0,

		    // get the drawing context
		    oc = this.offContext,

		    // tooltip text
			toolTip = "",
			
			// extra line of text if too wide
			extraTip = "",

		    // tooltip position
		    x = 0,
		    y = 0,

		    // tooltip width
			width = 0,
			extraWidth = 0,
			targetWidth = 0,
			currentChar = "",
			i = 0, j = 0,

			// number of lines of text to draw
			lines = 1,

		    // font size
		    fontSize = 18,

		    // border size
			borderSize = 4;

		// check for active item
		if (current.activeItem !== -1 || (current.activeItem === -1 && current.mouseOverItem === -1)) {
			this.toolTipLastActive = current.activeItem;
		}

		// check for active menu item
		if (current.mouseOverItem === -1 || (this.toolTipLastActive !== -1 && (this.toolTipLastActive === current.mouseOverItem))) {
			// check for multi-item move
			if (current.mouseOverItem !== -1) {
				control = current.menuItems[current.mouseOverItem];
				if  (control.id === this.toolTipControl && control.highlightItem !== this.toolTipMulti) {
					this.toolTipLastActive = -1;
				}
			}

			// nothing active so increase tool tip delay
			if (this.toolTipCounter < this.toolTipDelay) {
				this.toolTipCounter += 1;
			}
		}
		else {
			// get the control
			control = current.menuItems[current.mouseOverItem];

			// check if the control is the same as last time or the same control has a different multi-item
			if (control.id !== this.toolTipControl || (control.id === this.toolTipControl && control.highlightItem !== this.toolTipMulti)) {
				// different so save new control/multi item
				this.toolTipControl = control.id;
				this.toolTipMulti = control.highlightItem;

				// increase tooltip delay up to the maximum
				if (this.toolTipCounter < this.toolTipDelay) {
					this.toolTipCounter += 1;
				}
			}
			else {
				// same control so check for delay
				if (this.toolTipCounter >= 0) {
					this.toolTipCounter -= 1;
				}
			}

			// get the tooltip
			if (this.toolTipMulti !== -1) {
				toolTip = control.toolTip[this.toolTipMulti];
			}
			else {
				toolTip = control.toolTip;
			}

			// check if there is a tooltip and delay expired
			if (toolTip !== "" && this.toolTipCounter === -1) {
				this.toolTipLastActive = -1;
				// get the control width, height and location
				controlX = control.x;
				controlY = control.y;
				controlWidth = control.width;
				controlHeight = control.height;

				// check for multi controls
				if (control.highlightItem !== -1) {
					// check orientation
					if (control.orientation === Menu.horizontal) {
						// adjust x position and width
						controlX += (controlWidth / control.lower.length) * control.highlightItem;
						controlWidth /= control.lower.length;
					}
					else {
						// adjust y position and width
						controlY += (controlHeight / control.lower.length) * control.highlightItem;
						controlHeight /= control.lower.length;
					}
				}

				// set the font
				oc.font = fontSize + "px Arial";

				// measure the tooltip width
				width = oc.measureText(toolTip).width;

				// get the center of the control
				x = Math.round(controlX + controlWidth / 2);
				y = Math.round(controlY + controlHeight / 2);

				// center over the control
				x -= width / 2;

				// check the tooltip fits
				if (x < borderSize + 1) {
					x = borderSize + 1;
				}
				else {
					if (x + width + borderSize > oc.canvas.width) {
						x = oc.canvas.width - width - borderSize - 1;
					}
				}

				// check if the control height is bigger than width
				if (controlHeight > controlWidth) {
					// ensure minimum control width
					if (this.minToolTipX !== -1 && (controlWidth < this.minToolTipX)) {
						controlWidth = this.minToolTipX;
					}

					// check if the control is on the left or right half
					if (x > oc.canvas.width / 2) {
						x = controlX - width - (controlWidth / 2);
					}
					else {
						x = controlX + control.width + (controlWidth / 2);
					}
				}
				else {
					// ensure minimum control height
					if (this.minToolTipY !== -1 && (controlHeight < this.minToolTipY)) {
						controlHeight = this.minToolTipY;
					}

					// check if the control is in the top or bottom half
					if (y > oc.canvas.height / 2) {
						y -= controlHeight;
					}
					else {
						y += controlHeight;
					}
				}

				// check if the width is greater than the window
				if (width > oc.canvas.width) {
					// compute the target width
					targetWidth = (width >> 1) + fontSize + borderSize;
					if (targetWidth > oc.canvas.width) {
						targetWidth = oc.canvas.width;
					}
					// find the longest string that fits in the target width
					i = 1;
					while (oc.measureText(toolTip.substr(0, i)).width < targetWidth) {
						i += 1;
					}
					// see if there is a space, comma or slash nearby
					j = i - 1;
					while (j > i - 5) {
						currentChar = toolTip[j];
						if (currentChar === " " || currentChar === "," || currentChar === "/") {
							// split at the character found
							i = j + 2;
							j = i - 5;
						} else {
							j -= 1;
						}
					}

					// split the string
					extraTip = toolTip.substr(i - 1);
					toolTip = toolTip.substr(0, i - 1);
					width = oc.measureText(toolTip).width;
					extraWidth = oc.measureText(extraTip).width;
					if (extraWidth > width) {
						width = extraWidth;
					}
					lines = 2;
				}

				// draw the tooltip box
				oc.globalAlpha = 0.7;
				oc.fillStyle = "black";
				oc.fillRect(((x - borderSize) | 0) - 0.5, ((y - fontSize / 2 - borderSize) | 0) - 0.5, width + 2 + borderSize * 2, fontSize * lines + borderSize * 2);

				// draw the tooltip border
				oc.globalAlpha = 1;
				oc.strokeStyle = "rgb(32,255,255)";
				oc.strokeRect(((x - borderSize) | 0) - 0.5, ((y - fontSize / 2 - borderSize) | 0) - 0.5, width + 2 + borderSize * 2, fontSize * lines + borderSize * 2);

				// draw the shadow
				oc.globalAlpha = 0.7;
				oc.strokeStyle = "black";
				oc.beginPath();
				oc.moveTo((x - borderSize | 0) + 0.5, ((y - fontSize / 2 - borderSize) | 0) + 0.5 + fontSize * lines + borderSize * 2);
				oc.lineTo((x - borderSize | 0) + 0.5 + width + 2 + borderSize * 2, ((y - fontSize / 2 - borderSize) | 0) + 0.5 + fontSize * lines + borderSize * 2);
				oc.lineTo((x - borderSize | 0) + 0.5 + width + 2 + borderSize * 2, ((y - fontSize / 2 - borderSize) | 0) + 0.5);
				oc.stroke();

				// draw the tooltip
				oc.globalAlpha = 1;
				oc.fillStyle = "black";
				oc.fillText(toolTip, x + 2, y + 2);
				if (extraTip !== "") {
					oc.fillText(extraTip, x + 2, y + fontSize + 2);
				}
				oc.fillStyle = "white";
				oc.fillText(toolTip, x, y);
				if (extraTip !== "") {
					oc.fillText(extraTip, x, y + fontSize);
				}
			}
		}
	};

	// process callback
	MenuManager.prototype.processCallback = function(me) {
		var newMenu, newWork, newFrame, menu, work, frame, total, i,

		    // performance load
		    load = 1,

		    // get the drawing context
		    oc = me.offContext,

		    // text message
		    message = "",

		    // text message width
		    messageWidth = 0,

		    // timing display position
		    x = oc.canvas.width - 86,
		    y = 90;

		// move fps display if in thumbnail mode
		if (me.thumbnail) {
			y = 0;
		}

		// mark update processed
		me.updateScheduled = false;

		// mark update has happened since last mouse down
		me.updateSinceMouseDown = true;

		// load new menu if required
		if (me.loadMenu) {
			// set the active menu
			me.currentMenu = me.loadMenu;
			me.loadMenu = null;

			// initialise the menu
			oc.font = me.defaultFont;
			me.currentMenu.init();

			// call the activate callback if defined
			if (me.currentMenu.activateCallback) {
				me.currentMenu.activateCallback(me.currentMenu.caller);
			}
		}

		// time menu draw and callback work
		newWork = performance.now();
		if (me.idle) {
			// if idle then set time to one frame (60Hz)
			me.lastUpdate = newWork - (1000 / 60);
		}

		// schedule the next update if auto update on or notification is display
		if (me.autoUpdate || me.notification.displayed() || me.updateCount || (me.toolTipDelay !== me.toolTipCounter && me.toolTipCounter !== -1)) {
			me.scheduleNextUpdate(me);

			if (me.updateCount) {
				me.updateCount -= 1;
			}
			me.idle = false;
		}
		else {
			// flag no update happened
			me.idle = true;
		}

		// compute the time since last call
		newFrame = newWork - me.lastUpdate;
		me.lastUpdate = newWork;

		// execute the callback if it exists
		if (me.currentMenu.callback) {
			me.currentMenu.callback(newFrame, me.currentMenu.caller);
		}

		// get the callback work time
		newWork = performance.now() - newWork;

		// time the menu draw
		newMenu = performance.now();

		// draw menu and schedule next update
		me.drawMenu();
		me.clickHappened = false;

		// check for tool tip
		me.drawToolTip();

		// draw the notification
		me.notification.update();

		// get the menu draw time
		newMenu = performance.now() - newMenu;

		// save the menu timing
		me.lastMenu[me.timingIndex] = newMenu;

		// average the menu time
		menu = 0;
		for (i = 0; i < me.numTimings; i += 1) {
			menu += me.lastMenu[i];
		}
		menu = menu / me.numTimings;

		// save the work timing
		me.lastWork[me.timingIndex] = newWork;

		// average the work time
		work = 0;
		for (i = 0; i < me.numTimings; i += 1) {
			work += me.lastWork[i];
		}
		work = work / me.numTimings;

		// save the frame timing
		me.lastFrame[me.timingIndex] = newFrame;

		// average the frame time
		frame = 0;
		for (i = 0; i < me.numTimings; i += 1) {
			frame += me.lastFrame[i];
		}
		frame = frame / me.numTimings;

		// increment index
		me.timingIndex = (me.timingIndex + 1) % me.numTimings;

		// get the total fps rounded to integer
		total = Math.round(1000 / frame);

		// draw the timing statistics if enabled
		if (me.showTiming) {
			// set the menu font
			oc.font = "12px Arial";

			// draw the shaded rectangle
			oc.globalAlpha = 0.7;
			oc.fillStyle = "black";

			// check for extended timing
			if (me.showExtendedTiming) {
				oc.fillRect(x, y, 88, 83);
			}
			else {
				oc.fillRect(x, y, 88, 20);
			}

			// compute load
			load = (work + menu) / 16.6666;
			if (load > 1) {
				load = 1;
			}

			// draw load background
			if (load < 0.5) {
				// fade from green to yellow
				oc.fillStyle = "rgb(" + ((255 * load * 2) | 0) + ",255,0)";
			}
			else {
				// fade from yellow to red
				oc.fillStyle = "rgb(255," + ((255 * (1 - (load - 0.5) * 2)) | 0) + ",0)";
			}
			oc.fillRect(x, y, (88 * load) | 0, 20);

			// convert to one decimal place
			menu = menu.toFixed(1);
			work = work.toFixed(1);

			// draw the text shadows
			oc.globalAlpha = 1;
			oc.fillStyle = "black";

			// draw fps
			message = total + "fps";
			messageWidth = oc.measureText(message).width;
			oc.fillText(message, x + 8 + 28 - messageWidth, y + 12);

			// draw load%
			message = ((100 * load) | 0) + "%";
			messageWidth = oc.measureText(message).width;
			oc.fillText(message, x + 8 + 76 - messageWidth, y + 12);


			// draw extended timing if enabled
			if (me.showExtendedTiming) {
				// draw labels
				oc.fillText("menu", x + 6, y + 28);
				oc.fillText("work", x + 6, y + 44);
				oc.fillText("update", x + 6, y + 60);
				oc.fillText("focus", x + 6, y + 76);

				// draw menu ms
				message = menu + "ms";
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + 8 + 76 - messageWidth, y + 28);

				// draw work ms
				message = work + "ms";
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + 8 + 76 - messageWidth, y + 44);

				// draw autoupdate
				message = (me.autoUpdate ? "on" : "off");
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + 8 + 76 - messageWidth, y + 60);

				// draw focus
				message = (me.hasFocus ? "on" : "off");
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + 8 + 76 - messageWidth, y + 76);
			}

			// draw the text
			oc.fillStyle = "white";

			// draw fps
			message = total + "fps";
			messageWidth = oc.measureText(message).width;
			oc.fillText(message, x + 6 + 28 - messageWidth, y + 10);

			// draw load%
			message = ((100 * load) | 0) + "%";
			messageWidth = oc.measureText(message).width;
			oc.fillText(message, x + 6 + 76 - messageWidth, y + 10);

			// draw extended timing if enabled
			if (me.showExtendedTiming) {
				// draw labels
				oc.fillText("menu", x + 4, y + 26);
				oc.fillText("work", x + 4, y + 42);
				oc.fillText("update", x + 4, y + 58);
				oc.fillText("focus", x + 4, y + 74);

				// draw menu ms
				message = menu + "ms";
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + 6 + 76 - messageWidth, y + 26);

				// draw work ms
				message = work + "ms";
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + 6 + 76 - messageWidth, y + 42);

				// draw autoupdate
				message = (me.autoUpdate ? "on" : "off");
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + 6 + 76 - messageWidth, y + 58);

				// draw focus
				message = (me.hasFocus ? "on" : "off");
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + 6 + 76 - messageWidth, y + 74);
			}

			// reset alpha
			oc.globalAlpha = 1;
		}

		// copy to the main drawing canvas
		me.mainContext.drawImage(oc.canvas, 0, 0);

		// mark that event processed
		me.processedEvent = true;
	};

	// set active menu list
	MenuManager.prototype.activeMenu = function(activeMenuList) {
		// set the icon manager for the acive menu
		activeMenuList.iconManager = this.iconManager;

		// check if there is an active menu
		if (this.currentMenu) {
			// set the menu to load next update
			this.loadMenu = activeMenuList;
		} else {
			// load the menu now
			this.loadMenu = null;

			// initialise the menu
			this.currentMenu = activeMenuList;
			this.offContext.font = this.defaultFont;
			this.currentMenu.init();

			// call the activate callback if defined
			if (this.currentMenu.activateCallback) {
				this.currentMenu.activateCallback(this.currentMenu.caller);
			}
			
			// schedule callback
			this.scheduleNextUpdate(this);
		}
	};

	// draw active menu
	MenuManager.prototype.drawMenu = function() {
		var i, currentMenu, currentItem;

		// check there is an active menu
		if (this.currentMenu) {
			currentMenu = this.currentMenu;

			// set the menu font
			this.offContext.font = this.defaultFont;

			// set the mouse position
			currentMenu.mouseX = this.mouseLastX;
			currentMenu.mouseY = this.mouseLastY;
			currentMenu.mouseDown = this.mouseDown;
			currentMenu.clickHappened = this.clickHappened;

			// draw and update the menu and check if we need to toggle
			if (currentMenu.drawMenu() || this.toggleRequired) {
				for (i = 0; i < currentMenu.numMenuItems; i += 1) {
					currentItem = currentMenu.menuItems[i];
					currentMenu.toggleMenu(currentItem);
				}
				this.toggleRequired = false;
			}
		}
	};

	// schedule next update
	MenuManager.prototype.scheduleNextUpdate = function(me) {
		// check whether there is already an update scheduled
		if (!me.updateScheduled) {
			// check which event mechanism exists
			if (requestAnimationFrame) {
				requestAnimationFrame(me.callbackFunction);
			}
			else {
				setTimeout(me.callbackFunction, 16);
			}

			// mark update scheduled
			me.updateScheduled = true;
		}
	};

	// touch end event
	MenuManager.prototype.touchToMouse = function(me, event) {
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
	MenuManager.prototype.canvasMouseDown = function(me, event) {
		// check if passing events
		if (!me.passEvents) {
			// update cursor position
			me.updateCursorPosition(me, event);

			// mark mouse down
			me.mouseDown = true;

			// mark that no update has happened since this mouse down
			me.updateSinceMouseDown = false;

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
		}
	};

	// mouse up event
	MenuManager.prototype.canvasMouseUp = function(me, event) {
		// remember current mouse up time
		me.lastMouseUp = performance.now();

		// check if passing events
		if (!me.passEvents) {
			// update cursor position
			me.updateCursorPosition(me, event);

			// mark mouse not down
			me.mouseDown = false;

			// if no update was processed since last mouse down then a click happened
			if (!me.updateSinceMouseDown) {
				me.clickHappened = true;
			}

			// check if the canvas has focus
			if (!me.hasFocus) {
				// set focus on canvas element
				me.mainContext.canvas.focus();
				me.hasFocus = true;

				// clear click to focus notification
				me.notification.clear(true, false);

				// call focus callback if registered
				if (me.focusCallback) {
					me.focusCallback(me.caller);
				}
			}

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
		}
	};

	// check if canvas has focus and if not notify
	MenuManager.prototype.checkFocusAndNotify = function(me) {
		// check if this has focus and GUI enabled
		if (!me.hasFocus) {
			// check if click to interact has been displayed
			if (!me.clickToInteract || me.notification.priorityMessage === "") {
				// notify click to interact
				if (me.noGUI) {
					if (!me.noCopy) {
						me.notification.notify("Copy", 15, 3600, 15, true);
					}
				}
				else {
					if (me.thumbnail) {
						if (me.thumbLaunch) {
							me.notification.notify("Launch", 15, 3600, 15, true);
						}
						else {
							me.notification.notify("Expand", 15, 3600, 15, true);
						}
					}
					else {
						me.notification.notify("Click to control", 15, 3600, 15, true);
					}
				}
				me.notification.animate = true;
				me.clickToInteract = true;
			}
		}
	};

	// mouse move event
	MenuManager.prototype.canvasMouseMove = function(me, event) {
		// check if passing events
		if (!me.passEvents) {
			// check if this has focus
			me.checkFocusAndNotify(me);

			// update cursor position
			me.updateCursorPosition(me, event);

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
		}
	};

	// mouse over event
	MenuManager.prototype.canvasMouseOver = function(me, event) {
		// check if passing events
		if (!me.passEvents) {
			// check if this has focus
			me.checkFocusAndNotify(me);

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
		}
	};

	// mouse out event
	MenuManager.prototype.canvasMouseOut = function(me, event) {
		// check if enough time has past since last mouse up
		var timeSinceUp = performance.now() - me.lastMouseUp;
		
		// check if passing events
		if (!me.passEvents) {
			// check if enough time has past since last mouse up
			if (timeSinceUp > 1) {
				// check if window has focus
				if (!me.hasFocus) {
					me.notification.clear(true, false);
				}

				// remove focus
				me.mainContext.canvas.blur();
				me.hasFocus = false;

				// mark mouse not down
				me.mouseDown = false;
				
				// clear mouse coordinates
				me.mouseLastX = -1;
				me.mouseLastY = -1;

				// clear click to interact flag
				me.clickToInteract = false;

				// schedule update if no update scheduled
				if (!me.updateScheduled) {
					me.scheduleNextUpdate(me);
					if (me.updateCount < 2) {
						me.updateCount = 2;
					}
				}
			}

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
		}
	};

	// get cursor position over canvas
	MenuManager.prototype.updateCursorPosition = function(me, event) {
		var x, y;
		if (event.pageX || event.pageY) {
			x = event.pageX;
			y = event.pageY;
		}
		else {
			x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		// compute the canvas offset
		me.computeCanvasOffset();

		// make the position relative to the canvas
		x -= me.offsetLeft;
		y -= me.offsetTop;

		// update position
		me.mouseLastX = (x - 1) | 0;
		me.mouseLastY = (y - 1) | 0;

		// schedule update if no update scheduled
		if (!me.updateScheduled) {
			me.scheduleNextUpdate(me);
			if (me.updateCount < 2) {
				me.updateCount = 2;
			}
		}
	};

	// set auto update mode
	MenuManager.prototype.setAutoUpdate = function(mode) {
		// check if switching on from off
		if ((mode || this.notification.displayed()) && !this.autoUpdate) {
			this.scheduleNextUpdate(this);
		}
	
		// set the mode
		this.autoUpdate = mode;
	};

	// create the global interface
	window["IconManager"] = IconManager;
	window["Menu"] = Menu;
	window["MenuManager"] = MenuManager;
}
());
