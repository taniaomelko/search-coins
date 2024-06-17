import { useState, useEffect, useRef, } from 'react';

function calculatePosition(
  canvas: HTMLCanvasElement,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
) {
  const x = offsetX * canvas.width;
  const y = offsetY * canvas.height;
  const w = width * canvas.width;
  const h = height * canvas.height;
  return { x, y, width: w, height: h };
}

function createTexture(
  gl: WebGLRenderingContext, 
  text: {
    value: string,
    before?: string,
    after?: string
  },
  font: string,
  color: string,
  x: number,
  y: number
) {
  const canvas = document.createElement('canvas');
  const context2D = canvas.getContext('2d');
  if (!context2D) return;

  const {value, before, after} = text;

  canvas.width = 1024;
  canvas.height = 768;
  context2D.font = font;
  context2D.fillStyle = color;
  context2D.textAlign = 'center';
  context2D.fillText(value, canvas.width / x, canvas.height / y);

  if (before || after) {
    const padding = 50;

    const textWidth = context2D.measureText(value).width;
    const totalWidth = textWidth + 2 * padding;
  
    if (totalWidth > canvas.width) {
      console.error('Text width exceeds fixed width');
      return null;
    }

    if (before) {
      context2D.fillText(before, 300, canvas.height / y);
    }
    if (after) {
      context2D.fillText(after, 720, canvas.height / y);
    }
  }

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

function createTextProgram(gl: WebGLRenderingContext) {
  const vertexShaderSource = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    varying vec2 v_texCoord;
    void main() {
      vec2 zeroToOne = a_position / u_resolution;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      v_texCoord = zeroToOne;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    uniform vec2 u_textureSize;
    void main() {
      vec2 texCoord = vec2(v_texCoord.x * u_textureSize.x, v_texCoord.y * u_textureSize.y);
      gl_FragColor = texture2D(u_texture, texCoord / u_textureSize);
    }
  `;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) return;
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShader));
    return null;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragmentShader) return;
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
    return null;
  }

  const program = gl.createProgram();
  if (!program) return;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Shader program linking error:', gl.getProgramInfoLog(program));
    return null;
  }

  return program;
}

function drawText(
  gl: WebGLRenderingContext, 
  texture: WebGLTexture, 
  x: number,
  y: number,
  width: number, 
  height: number,
) {
  const program = createTextProgram(gl);
  if (!program) return;
  gl.useProgram(program);

  const positions = new Float32Array([
    x, y,
    x + width, y,
    x, y + height,
    x, y + height,
    x + width, y,
    x + width, y + height,
  ]);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  const textureSizeUniformLocation = gl.getUniformLocation(program, 'u_textureSize');
  gl.uniform2f(textureSizeUniformLocation, width, height);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const textureUniformLocation = gl.getUniformLocation(program, 'u_texture');
  gl.uniform1i(textureUniformLocation, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawGraph(
  gl: WebGLRenderingContext,
  values: number[],
  offsetX: number,
  offsetY: number,
  graphWidth: number,
  graphHeight: number,
) {
  if (values.length > 1) {
    // Convert сoin values to WebGL coordinates
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue;

    const vertices = values.flatMap((value, index) => {
      const x = offsetX + (index / (values.length - 1)) * graphWidth;
      const y = offsetY + ((value - minValue) / range) * graphHeight;
      return [x, y];
    });

    // Create buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Create shaders
    const vertexShaderSource = `
      attribute vec2 aVertexPosition;
      void main(void) {
        gl_Position = vec4(aVertexPosition, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      void main(void) {
        gl_FragColor = vec4(${206 / 255}, ${41 / 255}, ${75 / 255}, 1.0);
      }
    `;

    const loadShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) {
        console.error('Unable to create shader');
        return null;
      }

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    // Create shader program
    const shaderProgram = gl.createProgram();
    if (!shaderProgram) return;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return;
    }

    gl.useProgram(shaderProgram);

    // Bind vertex buffer to shader program
    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(vertexPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINE_STRIP, 0, values.length);
  }
}

export const Widget = () => {
  const [coinValue, setCoinValue] = useState<number | null>(null);
  const [coinValues, setCoinValues] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateRandomValue = () => {
      return 600 + Math.random();
    };

    const updateData = () => {
      const newValue = generateRandomValue();
      setCoinValue(newValue);
      setCoinValues(prevValues => {
        const newValues = [...prevValues, newValue];
        return newValues.slice(-10); // Keep only the last 10 values
      });
    };

    updateData();

    const intervalId = setInterval(updateData, 300);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear the canvas
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    const numberPos = calculatePosition(canvas, 0, 0.1, 1, 0.25);
    const textPos = calculatePosition(canvas, 0, 0.2, 1, 0.25);
    const graphPos = calculatePosition(canvas, 0.1, 0.2, 0.8, 0.25);

    // Render number with arrow
    if (coinValue !== null) {
      const previousCoinValue = coinValues.length > 1 ? coinValues[coinValues.length - 2] : null;
      if (previousCoinValue !== null) {
        const isHigher = coinValue > previousCoinValue;
        const arrow = isHigher ? '↑' : '↓';
        const color = isHigher ? '#62A967' : '#CE294B';
        const number = `${coinValue.toFixed(2)}`;
        const numberTexture = createTexture(gl, {value: number, before: '$', after: arrow}, '300 96px Inter, sans-serif', color, 2, 4);
        if (!numberTexture) return;
        drawText(gl, numberTexture, numberPos.x, numberPos.y, numberPos.width, numberPos.height);
      }
    }

    // Render text
    const text = 'binance / BNBUSDC';
    const textTexture = createTexture(gl, {value: text}, '300 48px Inter, sans-serif', '#D7D6D7', 2, 2.5);
    if (!textTexture) return;
    drawText(gl, textTexture, textPos.x, textPos.y, textPos.width, textPos.height);

    // Define graph position and size in WebGL coordinates
    const graphOffsetX = (graphPos.x / canvas.width) * 2 - 1;
    const graphOffsetY = (graphPos.y / canvas.height) * 2 - 1;
    const graphWidth = (graphPos.width / canvas.width) * 2;
    const graphHeight = (graphPos.height / canvas.height) * 2;

    // Render graph
    drawGraph(gl, coinValues, graphOffsetX, graphOffsetY, graphWidth, graphHeight);
  }, [coinValue, coinValues]);

  return (
    <section>
      <div className="container">
        <canvas ref={canvasRef} width="400" height="300" />
      </div>
    </section>
  );
};
