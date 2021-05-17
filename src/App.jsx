import axios from 'axios';

import './App.css';
import * as React from 'react';

axios.defaults.baseURL = `${process.env.REACT_APP_API_PATH}:${process.env.REACT_APP_API_PORT}`;
axios.defaults.headers['Content-Type'] = 'application/json';
axios.defaults.responseType = 'json';

window.addEventListener('online', () => {
  document.title = document.title.replace(' [offline]', '');
});

window.addEventListener('offline', () => {
  document.title += ' [offline]';
});

const { useEffect, useRef } = React;

const createShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const isSuccess = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (isSuccess) {
    return shader;
  }

  gl.deleteShader(shader);
  return null;
};

const createProgram = (gl, vertexShader, fragmentShader) => {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const isSuccess = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (isSuccess) {
    return program;
  }
  gl.deleteProgram(program);
  return null;
};

const initCanvas = (gl) => {
  if (gl.canvas) {
    const glCanvas = gl.canvas;

    const realToCSSPixels = window.devicePixelRatio;

    const {
      clientWidth,
      clientHeight,
      width,
      height,
    } = glCanvas;

    const displayWidth = clientWidth * realToCSSPixels;
    const displayHeight = clientHeight * realToCSSPixels;

    if (width !== displayWidth || height !== displayHeight) {
      glCanvas.width = displayWidth;
      glCanvas.height = displayHeight;
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
};

const drawCanvas = (gl) => {
  const vertexShaderSource = `
    attribute vec4 a_position;
    varying vec4 v_color;
    uniform mat4 u_cube;
    uniform mat4 u_camera;

    void main() {
      gl_Position = a_position;
      v_color = a_position * 0.5 + 0.5;
    }
  `;

  const fragShaderSource = `
    precision mediump float;
    varying vec4 v_color;

    void main() {
      gl_FragColor = v_color;
    }
  `;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  const positions = new Float32Array([
    -0.5, -0.5, 0,
    0.5, -0.5, 0,
    0, 0.3, 0,
  ]);

  const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');

  const positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
};

function Template() {
  const canvasRef = useRef();

  useEffect(() => {
    const gl = canvasRef.current.getContext('webgl');
    initCanvas(gl);
    drawCanvas(gl);
  });

  return (
    <div style={{ width: '100vw' }}>
      <canvas
        ref={canvasRef}
        style={
          {
            display: 'block', width: '100%', height: '100%', background: 'rgba(0, 0, 0, .12)',
          }
    } />
    </div>
  );
}

const App = () => (
  <div className="App" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
    <Template />
  </div>
);

export default App;
