import { createProgram } from "./ShaderHelper.js";

const vs = `#version 300 es
layout(location=0) in vec3 position;
layout(location=1) in vec3 color;
uniform mat4 modelMatrix;

out vec3 v_color;

void main() {
  gl_Position = modelMatrix * vec4( position, 1.0 );
  v_color = color;
}
`;

const fs = `#version 300 es
precision highp float;

uniform float useUniformColor; // use uniform color if this is 1, otherwise use the color attribute (default)
uniform vec4 color; // color input
out vec4 fragColor; // fragment color output

in vec3 v_color;


void main() {
    vec3 _color = (useUniformColor > 0.0) ? color.rgb : v_color.rgb;
    fragColor = vec4( _color.rgb, 1.0 ); // only assign the fragment color
}
`;


/**
 * The WebGLProgram of a vertex and fragment shader.
 */
class WebGLProgram {

	/**
	 * Creates a WebGLProgram with a vertex and fragment shader.
	 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	 * @returns 
	 */
	constructor(gl) {

		// Verify that we have a valid WebGL context
		if (typeof gl.getParameter !== 'function' /*not a valid gl context*/) {
			console.error(`OpenGL context in constructor of WebGLProgram is not valid!`);
			throw new Error(`OpenGL context in constructor of WebGLProgram is not valid!`);
		}

		this.gl = gl;
		this.vertexShader = vs;
		this.fragmentShader = fs;

		this.program = createProgram(gl, [this.vertexShader, this.fragmentShader]);


		return this;

	}

	/**
	 * Enables the WebGLProgram for use.
	 * @returns {WebGLProgram} this WebGLProgram.
	 */
	use() {

		this.gl.useProgram(this.program);

	}

	/**
	 * Returns the internal WebGLProgram for use with getUniformLocation and others
	 * object.glProgram = value; 
	 */
	get glProgram() {

		return this.program;

	}

	/**
	 * Specify values for the uniforms.
	 * @param {string} name the name of the uniform variable in the shaders.
	 * @param {(number|Array|Matrix|Color|Vector)} value the value to set the uniform to. Can be a number, array, color, vector or matrix.
	 */
	setUniform(name, value) {

		// find the uniform location by its name
		const loc = this.gl.getUniformLocation(this.program, name);
		if (loc === null) {
			console.warn(`Uniform '${name}' not found in WebGLProgram! It might be unused and optimized out.`);
			return;
		}

		// get the uniform type and its length (useful for color!)
		const type = this.gl.getUniform(this.program, loc);
		const uniformLength = (type.length);

		// set the uniform value by using the appropriate uniform[1234][uif][v] function
		if (typeof value === "number") {
			this.gl.uniform1f(loc, value);
		} else if (typeof value === "boolean") {
			this.gl.uniform1f(loc, value ? 1.0 : 0.0);
		} else if (value instanceof Array) {
			const len = value.length;
			const uniformCall = `uniform${len}fv`;
			this.gl[uniformCall](loc, value);
		} else if (value.isColor) {
			const uniformCall = `uniform${uniformLength}f`; // use length to deal with vec3 and vec4 colors!
			this.gl[uniformCall](loc, value.r, value.g, value.b, 1.0);
		} else if (value.isMatrix4) {
			this.gl.uniformMatrix4fv(loc, false, value.elements);
		} else if (value.isMatrix3) {
			this.gl.uniformMatrix3fv(loc, false, value.elements);
		} else if (value.isVector3) {
			this.gl.uniform3f(loc, value.x, value.y, value.z);
		} else if (value.isVector4) {
			this.gl.uniform4f(loc, value.x, value.y, value.z, value.w);
		} else {
			console.warn(`Value of type '${value.constructor.name}' not supported by WebGLProgram.setUniform!`);
		}

		// see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/uniform
		// for more info on the different types/possibilites of setting uniforms.
	}

}

export { WebGLProgram };
