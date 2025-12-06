import { useEffect, useRef } from "react";
import "./BackgroundWater.css";

export default function BackgroundWater() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.warn("WebGL not supported");
      return;
    }

    // ---- Resize handling ----
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    // ---- Shaders ----
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;

      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Dark, fluid water-like shader
    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform float u_time;
      uniform vec2 u_resolution;

      // Simple pseudo-random
      float rand(vec2 co) {
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      // Basic smooth noise
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);

        float a = rand(i);
        float b = rand(i + vec2(1.0, 0.0));
        float c = rand(i + vec2(0.0, 1.0));
        float d = rand(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(a, b, u.x) +
               (c - a)*u.y*(1.0 - u.x) +
               (d - b)*u.x*u.y;
      }

      void main() {
        // Normalized coordinates centered
        vec2 uv = v_uv;
        vec2 p = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

        float t = u_time * 0.33;

        // Layered noise for fluid distortion
        float n1 = noise(p * 3.0 + t * 1.2);
        float n2 = noise(p * 4.5 - t * 1.6);
        float n3 = noise(p * 7.5 + t * 1.7);

        float distortion = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2);

        // Base colors: deep navy → teal-ish glows
        vec3 deep = vec3(0.008, 0.015, 0.04);   // slightly darker base
        vec3 mid  = vec3(0.05, 0.12, 0.22);     // brighter mid layer
        vec3 glow = vec3(0.15, 0.55, 0.70); 

        float wave = distortion;

        // Blend between layers
        vec3 color = mix(deep, mid, wave * 0.7);
        color = mix(color, glow, smoothstep(0.65, 1.0, wave) * 0.9);

        // Subtle vignette
        float d = length(p);
        float vignette = smoothstep(1.2, 0.3, d);
        color *= vignette;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const createShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // ---- Fullscreen quad ----
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeUniform = gl.getUniformLocation(program, "u_time");
    const resUniform = gl.getUniformLocation(program, "u_resolution");

    let frameId;

    const render = (time) => {
      const width = canvas.width;
      const height = canvas.height;

      gl.viewport(0, 0, width, height);

      gl.uniform1f(timeUniform, time * 0.001);
      gl.uniform2f(resUniform, width, height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="water-canvas" />;
}
