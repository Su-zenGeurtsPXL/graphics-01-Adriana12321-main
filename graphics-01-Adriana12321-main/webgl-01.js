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

  // Triangle Geometry (NEW!)
  const triangleGeometry = new BufferGeometry();
  triangleGeometry.setAttribute("position", {
    array: [0.5, 1, 0, 0, 0, 0, 1, 0.3, 0],
    itemSize: 3,
  });
  triangleGeometry.setAttribute("color", {
    array: [1, 0, 0, 1.0, 0, 1, 0, 1.0, 0, 0, 1, 1.0],
    itemSize: 4,
  });

  // Indexed Geometry – Quad (NEW!)
  const quadIndexedGeometry = new BufferGeometry();
  quadIndexedGeometry.setAttribute("position", {
    array: [-0.1, -0.5, 0, -0.1, 0.5, 0, -0.8, -0.5, 0, -0.8, 0.5, 0],
    itemSize: 3,
  });
  quadIndexedGeometry.setAttribute("color", {
    array: [1, 0, 0, 1.0, 0, 1, 0, 1.0, 0, 0, 1, 1.0, 1, 1, 1, 1.0],
    itemSize: 4,
  });
  quadIndexedGeometry.setIndex([
    0,
    1,
    2, // first triangle
    2,
    1,
    3, // second triangle
  ]);

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

    // setup GLSL program
    const program = new WebGLProgram(gl); //( NEW!)

    program.use(); //( NEW!)
    program.setUniform("modelMatrix", matrix); //( NEW!)
    program.setUniform("color", controls.color); //( NEW!)

    triangleGeometry.draw(gl); //( NEW!)
    quadIndexedGeometry.draw(gl); //( NEW!)
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
