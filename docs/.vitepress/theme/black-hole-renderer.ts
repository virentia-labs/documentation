const vertexSource = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_image;
uniform float u_time;
varying vec2 v_uv;

mat2 rotate(float angle) {
  float s = sin(angle), c = cos(angle);
  return mat2(c, -s, s, c);
}

vec2 streamUV(vec2 p, float age, float mask) {
  float r = length(p);
  // Differential flow moves the plasma while the shadow and outer sky stay fixed.
  float speed = 0.078 / (0.55 + r * 2.5);
  float eddy = sin(r * 49.0 - u_time * 0.42 + atan(p.y, p.x) * 3.0);
  vec2 flow = rotate(age * speed * mask) * p;
  flow *= 1.0 + eddy * 0.009 * mask * sin(age * 0.7);
  return flow + vec2(0.495, 0.539);
}

void main() {
  vec2 p = v_uv - vec2(0.495, 0.539);
  float r = length(p);
  float disk = smoothstep(0.145, 0.205, r) * (1.0 - smoothstep(0.40, 0.57, r));
  float phase = fract(u_time / 6.0);
  float secondPhase = fract(phase + 0.5);
  // Two overlapping flow phases avoid winding up the image or visibly resetting it.
  vec3 first = texture2D(u_image, streamUV(p, (phase - 0.5) * 6.0, disk)).rgb;
  vec3 second = texture2D(u_image, streamUV(p, (secondPhase - 0.5) * 6.0, disk)).rgb;
  float blend = abs(phase * 2.0 - 1.0);
  vec3 color = mix(first, second, blend);
  float angle = atan(p.y, p.x);
  float filament = sin(r * 116.0 + angle * 5.0 - u_time * 0.95);
  float drift = sin(angle * 3.0 + r * 26.0 - u_time * 0.36);
  color *= 1.0 + disk * (filament * 0.055 + drift * 0.045);
  gl_FragColor = vec4(color, 1.0);
}`;

export type BlackHoleRenderer = {
  resize: (width: number) => void;
  draw: (seconds: number) => void;
  dispose: () => void;
};

/** A single texture, a single draw call, and a bounded drawing buffer. */
export function createBlackHoleRenderer(
  canvas: HTMLCanvasElement,
  source: HTMLImageElement,
): BlackHoleRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();

  function dispose() {
    gl!.deleteTexture(texture);
    gl!.deleteBuffer(buffer);
    gl!.deleteProgram(program);
    shaders.forEach((shader) => gl!.deleteShader(shader));
  }

  function compile(type: number, sourceCode: string) {
    const shader = gl!.createShader(type);
    if (!shader) throw new Error("Unable to allocate a shader");
    shaders.push(shader);
    gl!.shaderSource(shader, sourceCode);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      throw new Error(gl!.getShaderInfoLog(shader) || "Unable to compile a shader");
    }
    return shader;
  }

  try {
    if (!program || !buffer || !texture) throw new Error("Unable to allocate the scene");
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Unable to link the scene");
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Convert the image's top-down rows to the shader's bottom-up UV coordinates.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
    const time = gl.getUniformLocation(program, "u_time");

    return {
      resize(width) {
        // Do not multiply by devicePixelRatio: soft, atmospheric art needs no Retina buffer.
        const side = Math.max(1, Math.min(Math.round(width), window.innerWidth < 768 ? 480 : 720));
        if (canvas.width !== side || canvas.height !== side) {
          canvas.width = side;
          canvas.height = side;
          gl.viewport(0, 0, side, side);
        }
      },
      draw(seconds) {
        gl.uniform1f(time, seconds);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      dispose,
    };
  } catch {
    dispose();
    return null;
  }
}
