import { createProgram } from "./gop/core/ShaderHelper.js";
import { Matrix4 } from "./gop/math/Matrix4.js";
import { Color } from "./gop/math/Color.js";
import { BufferGeometry } from "./gop/core/BufferGeometry.js";
import { WebGLProgram } from "./gop/core/WebGLProgram.js";

import GUI from "./gop/lil-gui/lil-gui.module.min.js";

var vs = `#version 300 es
layout(location=0) in vec3 position;
layout(location=1) in vec4 color; // RGBA (NEW)
uniform mat4 modelMatrix;
out vec4 v_color; // output to fs and interpolated by the rasterizer (NEW!)
void main() {
gl_Position = modelMatrix * vec4( position, 1.0 );
v_color = color; // (NEW)
}
`;

var fs = `#version 300 es
precision highp float;

uniform vec3 color; // color input
out vec4 fragColor; // fragment color output

in vec4 v_color; // input from vertex shader (NEW)

void main() {
fragColor = vec4( v_color.rgb, 1.0 ); // only assign the fragment color (NEW)
}
`;

function useBuffer(gl, buffer, itemSize, location = 0, normalize = false) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, itemSize, gl.FLOAT, normalize, 0, 0);
}

function createBuffer(gl, arrayData) {
  // Create a buffer.
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // Upload Geometry data
  gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(arrayData), gl.STATIC_DRAW);

  return buffer;
}

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

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.createElementNS(
    "http://www.w3.org/1999/xhtml",
    "canvas"
  );
  canvas.style.display = "block";
  canvas.width = canvas.height = Math.min(
    window.innerWidth,
    window.innerHeight
  );
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  document.body.appendChild(canvas);

  // Triangle Geometry
  const triangle = createBuffer(gl, [0.5, 1, 0, 0, 0, 0, 1, 0.3, 0]);

  // triangle color rgba
  const triangleColors = createBuffer(
    gl,
    [1, 0, 0, 1.0, 0, 1, 0, 1.0, 0, 0, 1, 1.0]
  );

  // Set Geometry - Quad
  const quad = createBuffer(
    gl,
    [
      -0.1, -0.5, 0, -0.1, 0.5, 0, -0.8, -0.5, 0, -0.8, -0.5, 0, -0.1, 0.5, 0,
      -0.8, 0.5, 0,
    ]
  );

  // Indexed Geometry - Quad
  const quadIndexed = createBuffer(
    gl,
    [-0.1, -0.5, 0, -0.1, 0.5, 0, -0.8, -0.5, 0, -0.8, 0.5, 0]
  );
  // Indexed Geometry - Quad
  const indices = createIndex(gl, [
    0,
    1,
    2, // first triangle
    2,
    1,
    3, // second triangle
  ]);

  // quad color rgba
  const quadColors = createBuffer(
    gl,
    [1, 0, 0, 1.0, 0, 1, 0, 1.0, 0, 0, 1, 1.0, 1, 1, 1, 1.0]
  );

  // setup GLSL program
  const program = createProgram(gl, [vs, fs]);

  // look up where the vertex data needs to go.
  const positionLocation = 0; // using layout(location=0) in the shaders
  // optionally you can use gl.getAttribLocation(program, "a_position");

  // Draw the scene.
  function drawScene() {
    // Define the size of the WebGL window/view on the canvas in pixel
    // maps NDC to window coordinates
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(
      controls.background.r,
      controls.background.g,
      controls.background.b,
      1.0
    );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the transformation matrix
    var matrix = new Matrix4();
    matrix = matrix.multiply(
      new Matrix4().makeTranslation(
        controls.translation.x,
        controls.translation.y,
        0
      )
    );
    matrix = matrix.multiply(
      new Matrix4().makeRotationZ(controls.angleInRadians)
    );
    matrix = matrix.multiply(
      new Matrix4().makeScale(controls.scale.x, controls.scale.y, 1)
    );

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // lookup uniforms
    const matrixLocation = gl.getUniformLocation(program, "modelMatrix");
    const colorLocation = gl.getUniformLocation(program, "color");

    // set the uniforms
    gl.uniformMatrix4fv(matrixLocation, false, matrix.elements); // Set the matrix.
    gl.uniform3fv(
      colorLocation,
      new Float32Array([controls.color.r, controls.color.g, controls.color.b])
    ); // Set the color.

    // triangle with color
    useBuffer(gl, triangle, 3, 0);
    useBuffer(gl, triangleColors, 4, 1); // (NEW)
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // quad with color
    useBuffer(gl, quadIndexed, 3, 0);
    useBuffer(gl, quadColors, 4, 1); // (NEW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  // some settings that can be changed
  var controls = {
    translation: { x: 0.0, y: 0.0 },
    angleInRadians: 0,
    scale: { x: 1, y: 1 },
    color: new Color(0xff0000),
    background: new Color(0xffffff),
  };

  drawScene(); // draw the scene once

  // ------------------------------------------------------------------------------------
  // GUI below
  // ------------------------------------------------------------------------------------

  var gui = new GUI();
  const transFolder = gui.addFolder("translation");
  transFolder.add(controls.translation, "x", -1, 1).onChange(drawScene);
  transFolder.add(controls.translation, "y", -1, 1).onChange(drawScene);
  transFolder.open();
  gui.add(controls, "angleInRadians", 0.0, 2.0 * Math.PI).onChange(drawScene);
  const scaleFolder = gui.addFolder("scale");
  scaleFolder.add(controls.scale, "x", -1, 1).onChange(drawScene);
  scaleFolder.add(controls.scale, "y", -1, 1).onChange(drawScene);
  scaleFolder.open();
  gui.addColor(controls, "color").onChange(drawScene);
  gui.addColor(controls, "background").onChange(drawScene);
}

main(); // start everything!
