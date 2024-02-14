// Allocator
// Handles typed memory allocation for 1D and 2D arrays.

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

	// allocation bits
	var AllocBits = {
		// - - c f s w w w
		// c = 1 clamped, 0 not
		// f = 1 float, 0 int
		// s = 1 unsigned, 0 signed
		// w w w = 2^type width in bytes
		/** @const {number} */ clampedMask : 1 << 5,
		/** @const {number} */ floatMask : 1 << 4,
		/** @const {number} */ unsignedMask : 1 << 3,
		/** @const {number} */ sizeMask : (1 << 0) | (1 << 1) | (1 << 2),
		/** @const {number} */ size1 : 0,	// 1 byte, 8 bits
		/** @const {number} */ size2 : 1,	// 2 bytes, 16 bits
		/** @const {number} */ size4 : 2,	// 4 bytes, 32 bits
		/** @const {number} */ size8 : 3	// 8 bytes, 64 bits
	};

	// allocation type
	var Type = {
		// types
		/** @const {number} */ Uint8 : AllocBits.unsignedMask | AllocBits.size1,
		/** @const {number} */ Uint8Clamped : AllocBits.clampedMask | AllocBits.unsignedMask | AllocBits.size1,
		/** @const {number} */ Uint16 : AllocBits.unsignedMask | AllocBits.size2,
		/** @const {number} */ Uint32 : AllocBits.unsignedMask | AllocBits.size4,
		/** @const {number} */ Int8 : AllocBits.size1,
		/** @const {number} */ Int16 : AllocBits.size2,
		/** @const {number} */ Int32 : AllocBits.size4,
		/** @const {number} */ Float32 : AllocBits.floatMask | AllocBits.size4,
		/** @const {number} */ Float64 : AllocBits.floatMask | AllocBits.size8
	};

	// size in bytes for the given type
	/** @type function(number) : number */
	Type.sizeInBytes = function(type) {
		return (1 << (type & AllocBits.sizeMask));
	};

	// name as string for the given type
	/** @type function(number) : string */
	Type.typeName = function(type) {
		var	/** @type {string} */ typeName = "";

		// check type
		if ((type & AllocBits.floatMask) !== 0) {
			typeName = "Float";
		} else {
			// check sign
			if ((type & AllocBits.unsignedMask) !== 0) {
				typeName = "Uint";
			} else {
				typeName = "Int";
			}
		}

		// check size
		typeName += (1 << (type & AllocBits.sizeMask)) * 8;

		// check clamped
		if ((type & AllocBits.clampedMask) !== 0) {
			typeName += "Clamped";
		}

		// return the name
		return typeName;
	};

	// allocation info
	/**
	 * @constructor
	 */
	function AllocationInfo(/** @type {number} */ type, /** @type {number} */ elements, /** @type {string} */ name) {
		// save information
		/** @type {number} */ this.dataType = type;
		/** @type {string} */ this.name = name;
		/** @type {number} */ this.elements = elements;
		/** @type {number} */ this.size = elements * Type.sizeInBytes(type);
		/** @type {number} */ this.number = 1;
	}

	// allocator
	/**
	 * @constructor
	 */
	function Allocator() {
		// allocations
		/** @type {Array} */ this.allocations = [];

		// number of major allocations
		/** @type {number} */ this.numAllocs = 0;

		// number of bytes allocated
		/** @type {number} */ this.totalBytes = 0;

		// number of frees (technically overwrites)
		/** @type {number} */ this.numFrees = 0;

		// number of bytes freed
		/** @type {number} */ this.totalFreedBytes = 0;
	}

	// output a specific allocation as a string
	/** @returns {string} */
	Allocator.prototype.allocationInfo = function(/** @type {number} */ which) {
		var	/** @type {string} */ result = "",
			/** @type {AllocationInfo} */ info = null;

		// check the allocation exists
		if (which >= 0 && which < this.allocations.length) {
			// get the allocation information
			info = this.allocations[which];

			// output info
			result = Type.typeName(info.dataType) + "\t" + info.elements + "\t" + info.name + "\t" + info.number;
		}

		// return the string
		return result;
	};

	// save allocation information
	Allocator.prototype.saveAllocationInfo = function(/** @type {number} */ type, /** @type {number} */ elements, /** @type {string} */ name) {
		var	/** @type {number} */ i = 0,
			/** @type {boolean} */ found = false,
			/** @type {AllocationInfo} */ allocation = null;

		// check if there was already an allocation with this name
		while (i < this.allocations.length && !found) {
			// get the next allocation
			allocation = this.allocations[i];
			if (name === allocation.name) {
				// found allocation
				found = true;

				// update frees
				this.numFrees += 1;

				// update bytes freed
				this.totalFreedBytes += allocation.elements * Type.sizeInBytes(allocation.dataType);
			} else {
				i += 1;
			}
		}

		// check if the allocation was found
		if (found) {
			// update existing slot
			this.allocations[i].dataType = type;
			this.allocations[i].elements = elements;
			this.allocations[i].number += 1;
			this.allocations[i].size = elements * Type.sizeInBytes(type);
		} else {
			// create a new allocation record
			i = this.allocations.length;
			this.allocations[i] = new AllocationInfo(type, elements, name);
		}

		// increment number of major allocations
		this.numAllocs += 1;

		// update total bytes allocated
		this.totalBytes += (elements * Type.sizeInBytes(type));
	};

	// get typed view of a memory buffer
	/** @returns {Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|null} */
	Allocator.prototype.typedView = function(/** @type {Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array} */ whole,
			/** @type {number} */ type, /** @type {number} */ elements, /** @type {number} */ offset, /** @type {string} */ name) {
		var	/** @type {Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|null} */ result = null,
			/** @type {ArrayBuffer} */ buffer = whole.buffer,
			/** @type {number} */ byteOffset = offset * Type.sizeInBytes(type);

		// get view of memory
		switch (type) {
		// unsigned 8bit integer
		case Type.Uint8:
			result = new Uint8Array(buffer, byteOffset, elements);
			break;

		// unsigned 8bit clamped integer
		case Type.Uint8Clamped:
			result = new Uint8Array(buffer, byteOffset, elements);
			break;

		// unsigned 16bit integer
		case Type.Uint16:
			result = new Uint16Array(buffer, byteOffset, elements);
			break;

		// unsigned 32bit integer
		case Type.Uint32:
			result = new Uint32Array(buffer, byteOffset, elements);
			break;

		// signed 8bit integer
		case Type.Int8:
			result = new Int8Array(buffer, byteOffset, elements);
			break;

		// signed 16bit integer
		case Type.Int16:
			result = new Int16Array(buffer, byteOffset, elements);
			break;

		// signed 32bit integer
		case Type.Int32:
			result = new Int32Array(buffer, byteOffset, elements);
			break;

		// signed 32bit float
		case Type.Float32:
			result = new Float32Array(buffer, byteOffset, elements);
			break;

		// signed 64bit float
		case Type.Float64:
			result = new Float64Array(buffer, byteOffset, elements);
			break;

		default:
			// illegal type specified
			result = null;
			alert("Illegal type specified to allocator.typedView for " + name + ": " + type);
		}

		// return memory
		return result;
	};

	// get typed memory block
	/** @returns {Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|null} */
	Allocator.prototype.typedMemory = function(/** @type {number} */ type, /** @type {number} */ elements, /** @type {string} */ name) {
		var	/** @type {Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|null} */ result = null;

		// allocate memory
		try {
			switch (type) {
			// unsigned 8bit integer
			case Type.Uint8:
				result = new Uint8Array(elements);
				break;

			// unsigned 8bit clamped integer
			case Type.Uint8Clamped:
				result = new Uint8Array(elements);
				break;

			// unsigned 16bit integer
			case Type.Uint16:
				result = new Uint16Array(elements);
				break;

			// unsigned 32bit integer
			case Type.Uint32:
				result = new Uint32Array(elements);
				break;

			// signed 8bit integer
			case Type.Int8:
				result = new Int8Array(elements);
				break;

			// signed 16bit integer
			case Type.Int16:
				result = new Int16Array(elements);
				break;

			// signed 32bit integer
			case Type.Int32:
				result = new Int32Array(elements);
				break;

			// signed 32bit float
			case Type.Float32:
				result = new Float32Array(elements);
				break;

			// signed 64bit float
			case Type.Float64:
				result = new Float64Array(elements);
				break;

			default:
				// illegal type specified
				result = null;
				alert("Illegal type specified to allocator.typedMemory for " + name + ": " + type);
			}
		} catch(e) {
			alert("Failed to allocate " + elements + " element " + Type.typeName(type) + " array for " + name + "\n\n" + e);
		}


		// return memory
		return result;
	};

	// allocate typed memory
	/** @returns {Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|null} */
	Allocator.prototype.allocate = function(/** @type {number} */ type, /** @type {number} */ elements, /** @type {string} */ name) {
		var	/** @type {Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|null} */ result = null;

		// get typed block of memory
		if (elements > 0) {
			result = this.typedMemory(type, elements, name);
		}

		// check if allocation succeeded
		if (result || elements === 0) {
			this.saveAllocationInfo(type, elements, name);
		}

		// return memory
		return result;
	};

	// allocate typed memory when adding a row to a matrix
	/** @returns {Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|null} */
	Allocator.prototype.allocateRow = function(/** @type {number} */ type, /** @type {number} */ elements, /** @type {string} */ name, /** @type {number} */ rows) {
		var	/** @type {Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|null} */ result = null;

		// get typed block of memory
		if (elements > 0) {
			result = this.typedMemory(type, elements, name);
		}

		// check if allocation succeeded
		if (result || elements === 0) {
			this.saveAllocationInfo(type, elements * rows, name);
		}

		// return memory
		return result;
	};

	// create an array matrix for a given type
	/** @returns {Array} */
	Array.matrix = function(/** @type {number} */ type, /** @type {number} */ m, /** @type {number} */ n, /** @type {number} */ initial, /** @type {Allocator} */ allocator, /** @type {string} */ name) {
		var	/** @type {number} */ i = 0,
			/** @type {Array} */ mat = [],
			/** @type {Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|null} */ whole = null;

		// save reference the the type and allocator
		mat.allocator = allocator;
		mat.dataType = type;
		mat.whole = null;

		// create whole array
		whole = allocator.allocate(type, m * n, name);

		// save reference to the whole array
		mat.whole = whole;

		// create rows if they are not empty
		if (n > 0) {
			while (i < m) {
				// create views of the rows
				mat[i] = allocator.typedView(whole, type, n, i * n, name);
				i += 1;
			}

			// check whether to fill with an initial value
			if (initial !== 0) {
				// fill the array with the initial value
				whole.fill(initial);
			}
		}

		// return the matrix
		return mat;
	};

	// add an extra row to an array
	Array.addRow = function(/** @type {Array} */ source, /** @type {number} */ initial, /** @type {string} */ name) {
		// get the size of the source row
		var	/** @type {number} */ m = source[0].length,

			// create the new row
			/** @type {Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|null} */ row = source.allocator.allocateRow(source.dataType, m, name, source.length + 1);

		// check whether to fill with an initial value
		if (initial !== 0) {
			// fill the array with initial value
			row.fill(initial);
		}

		// add to the array
		source[source.length] = row;
	};

	// copy source array matrix to destination matrix
	Array.copy = function(/** @type {Array} */ source, /** @type {Array} */ dest) {
		// copy buffer
		dest.whole.set(source.whole);
	};

	// create a typed view of the source matrix
	/** @returns {Array} */
	Array.matrixView = function(/** @type {number} */ type, /** @type {Array} */ source, /** @type {string} */ name) {
		var	/** @type {number} */ y = 0,
			/** @type {number} */ h = source.length,
			/** @type {Array} */ mat = [],
			/** @type {Allocator} */ allocator = source.allocator,
			/** @type {number} */ elements = source[0].length,
			/** @type {number} */ newElements = elements / Type.sizeInBytes(type);

		// iterate over the source array
		for (y = 0; y < h; y += 1) {
			// create a typed view of the source row
			mat[y] = allocator.typedView(source.whole, type, newElements, y * newElements, name);
		}

		// return typed view of matrix
		return mat;
	};

	// create an offset view of the source matrix
	/** @returns {Array} */
	Array.matrixViewWithOffset = function(/** @type {Array} */ source, /** @type {number} */ offset, /** @type {string} */ name) {
		var	/** @type {number} */ y = 0,
			/** @type {number} */ h = source.length,
			/** @type {Array} */ mat = [],
			/** @type {Allocator} */ allocator = source.allocator,
			/** @type {number} */ type = source.dataType,
			/** @type {number} */ elements = source[0].length;

		// iterate over the source array
		for (y = 0; y < h; y += 1) {
			// create a view of the source array at the offset
			mat[y] = allocator.typedView(source.whole, type, elements - offset, (y * elements) + offset, name);
		}

		// return typed view of matrix at offset
		return mat;
	};
