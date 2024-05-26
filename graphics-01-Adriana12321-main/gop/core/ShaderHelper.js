// helper functions to create a WebGL Shader
// adpated from twgl

const COMPILE_STATUS = 0x8b81;
const LINK_STATUS = 0x8b82;

/**
 * Loads a shader.
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {string} shaderSource The shader source.
 * @param {number} shaderType The type of shader.
 * @param {String} shaderTypeString The type of shader as a string.
 * @return {WebGLShader} The created shader.
 * @private
 */
function loadShader(gl, shaderSource, shaderType, shaderTypeString = "") {

  // Create the shader object
  const shader = gl.createShader(shaderType);

  // Load the shader source
  gl.shaderSource(shader, shaderSource);

  // Compile the shader
  gl.compileShader(shader);

  // Check the compile status
  const compiled = gl.getShaderParameter(shader, COMPILE_STATUS);
  if (!compiled) {
    // Something went wrong during compilation; get the error
    const lastError = gl.getShaderInfoLog(shader);
    console.error(`Error compiling ${shaderTypeString} shader (${shaderType}): ${lastError}`);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

// default shader types
const defaultShaderType = [
  "VERTEX_SHADER", // vertex shader comes first
  "FRAGMENT_SHADER", // then the fragment shader
];


function deleteShaders(gl, shaders) {

  shaders.forEach(function (shader) {
    gl.deleteShader(shader);
  });
}

/**
 * Creates a program, attaches (and/or compiles) shaders, links the
 * program and calls useProgram.
 **
 *     createProgram(gl, [vs, fs]);
 *
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {WebGLShader[]|string[]} shaders The shaders to attach, or element ids for their source, or strings that contain their source
 * @return {WebGLProgram?} the created program or null if error.
 */
function createProgram(gl, shaders) {

  const realShaders = [];
  for (let ndx = 0; ndx < shaders.length; ++ndx) {
    let shader = shaders[ndx];
    if (typeof (shader) === 'string') {
      const elem = document.getElementById(shader);
      const src = elem ? elem.text : shader;
      let type = gl[defaultShaderType[ndx]];
      shader = loadShader(gl, src, type, defaultShaderType[ndx]);
      realShaders.push(shader);
    }
  }

  const program = gl.createProgram();
  realShaders.forEach(function (shader) {
    gl.attachShader(program, shader);
  });
  gl.linkProgram(program);

  // Check the link status
  const linked = gl.getProgramParameter(program, LINK_STATUS);
  if (!linked) {
    // something went wrong with the link
    const lastError = gl.getProgramInfoLog(program);
    console.error(`Error in program linking: ${lastError}`);

    gl.deleteProgram(program);
    deleteShaders(gl, realShaders);
    return null;
  }

  return program;
}

export {
  loadShader,
  createProgram
}