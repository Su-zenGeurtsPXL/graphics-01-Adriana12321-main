/**
 * Represents a geometry object for rendering in WebGL.
 */
class BufferGeometry {

	constructor() {

		this.name = '';
		this.type = 'BufferGeometry';
		this.isBufferGeometry = true;


		this.index = null; // index buffer of the geometry (optional)
		this.attributes = {}; // attributes of the geometry (e.g. position, normal, color, etc.)
		this.gl = null; // the WebGL context

		this.isInitialized = false;


	}

	/**
	 * Initializes the OpenGL buffers for the geometry. Creates, Binds and Maps fills the buffers for the attributes.
	 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	 */
	init(_gl) {
		if (this.isInitialized === false) {

			// Verify that we have a valid WebGL context
			if (typeof _gl.getParameter !== 'function' /*not a valid gl context*/) {
				console.error(`OpenGL context in init for object ${this.type} ${this.name} is not valid!`);
				throw new Error(`OpenGL context in init for object ${this.type} ${this.name} is not valid!`);
			}
			this.gl = _gl;
			const gl = this.gl;


			let attrCount = 0; // count the number elements in an attribute

			// iterate over attribute keys
			for (var key in this.attributes) {
				const attribute = this.attributes[key];
				attribute.buffer = createBuffer(gl, attribute.array);
				attribute.count = attribute.array.length / attribute.itemSize;
				attrCount = attribute.count;
			}

			// ERROR checking
			// verify that all attributes have the same count!!!
			for (var key in this.attributes) {
				const attribute = this.attributes[key];
				if (attribute.count !== attrCount) {
					console.error(`attribute ${key} has different count ${attribute.count} than other attributes ${attrCount}`);
					throw new Error('All attributes must have the same count');
				}
			}

			if (this.hasIndex) {
				this.index.buffer = createIndex(gl, this.index.array);
				this.index.count = this.index.array.length;
			}
			this.isInitialized = true;
		}
	}

	/**
	 * Draw the geometry with WebGL.
	 * @param {WebGLContext} [_gl=null] the WebGL context. Must be valid on the first call because OpenGL buffers are initialized at the first call. 
	 */
	draw(_gl = null) {

		if (_gl !== null) {
			this.init(_gl);
		}

		if (this.isInitialized === false) {
			console.error(`Geometry (${this.type}) has not been initialized before drawing!`);
			throw new Error(`ERROR: ${this.type} not initialized!`);
			return;
		}

		const gl = this.gl;

		// bind buffers and map them to shader/program attributes
		for (var key in this.attributes) {
			const attribute = this.attributes[key];
			useBuffer(this.gl, attribute.buffer, attribute.itemSize, getAttribLocation(key), attribute.normalize || false);
		}


		if (this.hasIndex) { // use index buffer for drawing
			this.gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index.buffer);
			this.gl.drawElements(this.gl.TRIANGLES, this.index.count, this.gl.UNSIGNED_SHORT, 0);
		} else { // draw without index buffer 
			this.gl.drawArrays(this.gl.TRIANGLES, 0, this.attributes["position"].count);
		}

		// disable buffers and shader/program attributes
		for (var key in this.attributes) {
			const attribute = this.attributes[key];
			disableBuffer(this.gl, getAttribLocation(key));
		}

	}

	/**	
	 * True if the geometry has an index buffer.
	 * @returns {Boolean} if the geometry has an index buffer.
	 */
	get hasIndex() {
		return this.index !== null;
	}

	getIndex() {
		return this.index;
	}

	/**
	 * Sets the index buffer of the geometry.
	 * @param {Array} attribute the index values. 
	 * @returns 
	 */
	setIndex(index) {
		if (isArrayOrTypedArray(index)) {
			this.index = { 'array': index, 'itemSize': 1 };
		} else {
			this.index = index;
		}

		return this;
	}

	getAttribute(name) {
		return this.attributes[name];
	}

	/**
	 * Sets an attribute of the geometry. The attribute is added if it does not exist yet.
	 * @param {String} name the name of the attribute (e.g. position, normal, color, etc.)
	 * @param {Object} attribute the attribute to set/add. The attribute must have an array and an itemSize property ({ 'array': [...], 'itemSize': [1-4] }).
	 * @returns 
	 */
	setAttribute(name, attribute) {

		// check if attribute name is valid
		if (getAttribLocation(name) === undefined) {
			console.error(`Attribute name ${name} used in setAttribute is not valid!`);
			throw new Error(`Attribute name ${name} in setAttribute is not valid!`);
		}

		if (attribute === undefined || attribute.itemSize === undefined || attribute.array === undefined) {
			console.error(`Attribute data for ${name} must be an object of the form {array: [...], itemSize: ..}!`);
			throw new Error(`Attribute data for ${name} must be an object of the form {array: [...], itemSize: ..}!`);
		}

		this.attributes[name] = attribute;
		return this;
	}

	deleteAttribute(name) {
		delete this.attributes[name];
		return this;
	}

	hasAttribute(name) {
		return this.attributes[name] !== undefined;
	}

}


export { BufferGeometry };

// --- Utilities below ---

/**
 * Verifies that the given object is an array or typed array (e.g. Float32Array).
 * from: https://stackoverflow.com/questions/40319109/detect-if-object-is-either-an-array-or-typed-array
 *
 * @param {Array|Float32Array|?} x  the object to test  
 * @returns 
 */
function isArrayOrTypedArray(x) {
	return Boolean(x && (typeof x === 'object') && (Array.isArray(x) || (ArrayBuffer.isView(x) && !(x instanceof DataView))));
}

/**
 * Binds the given buffer to the given attribute location.
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {WebGLBuffer} buffer The WebGLBuffer to use
 * @param {int} itemSize The size of an element in the buffer. e.g. vec3 = 3
 * @param {int} location Attribute location in the shader. Default: 0
 * @param {boolean} normalize If the data should be normalized. Default: false
 */
function useBuffer(gl, buffer, itemSize, location = 0, normalize = false) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.enableVertexAttribArray(location);
	gl.vertexAttribPointer(location, itemSize, gl.FLOAT, normalize, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null); // optional!
}

/**
 * Disable the given attribute location.
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {int} location Attribute location in the shader. Default: 0
 */
function disableBuffer(gl, location) {
	gl.disableVertexAttribArray(location);
}

/**
 * Creates an WebGL ARRAY_BUFFER with the given data.
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {Array} arrayData the data to create the buffer with.
 * @returns {WebGLBuffer} The created WebGLBuffer.
 */
function createBuffer(gl, arrayData) {
	// Create a buffer.
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

	// Upload Geometry data
	gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(arrayData), gl.STATIC_DRAW);

	return buffer;
}

/**
 * Creates an WebGL index buffer (ELEMENT_ARRAY_BUFFER) with the given indices.
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {Array} indices the indices to create the buffer with.
 * @returns {WebGLBuffer} The created WebGLBuffer.
 */
function createIndex(gl, indices) {
	// create the index buffer
	const indexBuffer = gl.createBuffer();

	// make this buffer the current 'ELEMENT_ARRAY_BUFFER'
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

	gl.bufferData(
		gl.ELEMENT_ARRAY_BUFFER,
		Uint16Array.from(indices),
		gl.STATIC_DRAW
	);

	return indexBuffer;
}

/**
 * Returns the attribute location for a given attribute name in the shader.
 * The location number in the vertex shader. e.g. 0 for the position attribute as it is defined as `layout(location=0) in vec3 position;` in the vertex shader.
 * @param {string} name name of the attribute in the shader
 * @returns {number} the location of the attribute in the shader
 */
function getAttribLocation(name) {
	switch (name) {
		case 'position': return 0; // "layout(location=0) in ..." in shader code
		case 'color': return 1; // "layout(location=1) in ..." in shader code
		case 'normal': return 1; // "layout(location=1) in ..." in shader code
		case 'uv': return 2; // "layout(location=2) in ..." in shader code
		case 'index': return undefined; // an index does not have a location in the shader!
		default: return undefined; // return undefined if the attribute is not known!
	}
}
