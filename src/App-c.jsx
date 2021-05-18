import axios from 'axios';

import './App.css';
import * as React from 'react';

axios.defaults.baseURL = `${process.env.REACT_APP_API_PATH}:${process.env.REACT_APP_API_PORT}`;
axios.defaults.headers['Content-Type'] = 'application/json';
axios.defaults.responseType = 'json';

const glMatrix = require('gl-matrix');

window.addEventListener('online', () => {
  document.title = document.title.replace(' [offline]', '');
});

window.addEventListener('offline', () => {
  document.title += ' [offline]';
});

const { useEffect, useRef } = React;

const createShader = (gl, shaderType, shaderSource) => {
  const shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderSource);
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
    attribute vec3 a_position;
    attribute vec3 a_color;
    uniform mat4 u_cube;
    uniform mat4 u_camera;
    varying vec3 v_color;
    void main(void) {
        v_color = a_color;
        gl_Position = u_camera * u_cube * vec4(a_position, 1.0);
    }
  `;

  const fragShaderSource = `
    precision mediump float;
    varying vec3 v_color;
    void main(void) {
        gl_FragColor = vec4(v_color.rgb, 1.0);
    }
  `;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  const uCube = gl.getUniformLocation(program, 'u_cube');
  const uCamera = gl.getUniformLocation(program, 'u_camera');

  const aPosition = gl.getAttribLocation(program, 'a_position');
  const aColor = gl.getAttribLocation(program, 'a_color');

  const vertexBuffer = gl.createBuffer();

  const vertices = [
    0, 0, 0,
    0.5, 1, 0.5,
    1, 0, 0,

    1, 0, 0,
    0.5, 1, 0.5,
    1, 0, 1,

    1, 0, 1,
    0.5, 1, 0.5,
    0, 0, 1,

    0, 0, 1,
    0.5, 1, 0.5,
    0, 0, 0,
  ];

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();

  const colors = [
    // Передняя грань
    1, 0.5, 0.5,
    1, 0.5, 0.5,
    1, 0.5, 0.5,

    // Нижняя грань
    0.5, 0.7, 1,
    0.5, 0.7, 1,
    0.5, 0.7, 1,

    // Левая грань
    0.3, 1, 0.3,
    0.3, 1, 0.3,
    0.3, 1, 0.3,

    // right face
    0.7, 1, 0.3,
    0.7, 1, 0.3,
    0.7, 1, 0.3,

  ];

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  const cameraMatrix = glMatrix.mat4.create();
  glMatrix.mat4.perspective(cameraMatrix, 0.785, window.innerWidth / window.innerHeight, 0.1, 1000);
  glMatrix.mat4.translate(cameraMatrix, cameraMatrix, [0, 0, -5]);

  // Создадим единичную матрицу положения куба
  const cubeMatrix = glMatrix.mat4.create();

  // Запомним время последней отрисовки кадра
  let lastRenderTime = Date.now();

  const render = () => {
    // Запрашиваем рендеринг на следующий кадр
    requestAnimationFrame(render);

    // Получаем время прошедшее с прошлого кадра
    const time = Date.now();
    const dt = lastRenderTime - time;

    // Вращаем фигуру относительно оси Y
    glMatrix.mat4.rotateY(cubeMatrix, cubeMatrix, dt / 1000);

    // Очищаем сцену, закрашивая её в белый цвет
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);

    // Включаем фильтр глубины
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(uCube, false, cubeMatrix);
    gl.uniformMatrix4fv(uCamera, false, cameraMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, 36);

    lastRenderTime = time;
  };

  render();
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
