/**
 * The incubator's renderer: the surfer as a hidden-line wireframe, on a
 * turntable, in raw WebGL2.
 *
 * Raw rather than three.js because the whole scene is one kind of thing — lines
 * of a fixed screen width — plus a depth-only copy of the surface to hide the
 * ones round the back. That is two small programs; three.js would be a
 * dependency several times the size of everything else on the page to draw it.
 *
 * Lines are instanced quads expanded in screen space, since GL_LINES is one
 * pixel wide on every platform that matters. They are drawn three times: once
 * faint with no depth test (the strands behind the body, so it reads as a
 * cage rather than a silhouette), once wide and additive for the glow, and once
 * thin for the line itself. The same pass draws the turntable.
 *
 * Everything is drawn in the one colour, uCool: the site's neon cyan, deeper
 * on the light theme (Incubator.tsx sets it). Depth comes from the faint
 * back strands and the glow, not from shading the colour.
 *
 * Geometry is public/surfer.bin, written by scripts/export-surfer.py.
 */

export type SurferScene = {
  /** Draw one frame. `angle` in radians; `time` in seconds. */
  draw: (angle: number, time: number, reveal: number, scan: number) => void;
  /** The line colour, as linear 0–1 RGB. */
  setCool: (rgb: [number, number, number]) => void;
  resize: () => void;
  dispose: () => void;
};

type Mesh = { positions: Float32Array; edges: Uint16Array; tris: Uint16Array };

export async function loadSurfer(url: string): Promise<Mesh> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`surfer.bin: ${res.status}`);
  const buf = await res.arrayBuffer();
  const [nv, ne, nt] = new Uint32Array(buf, 0, 3);
  let o = 12;
  const positions = new Float32Array(buf, o, nv * 3);
  o += nv * 12;
  const edges = new Uint16Array(buf, o, ne * 2);
  o += ne * 4;
  const tris = new Uint16Array(buf, o, nt * 3);
  return { positions, edges, tris };
}

const SPIN = /* glsl */ `
uniform float uAngle;
vec3 spin(vec3 p) {
  float c = cos(uAngle), s = sin(uAngle);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}`;

const COLOUR = /* glsl */ `
uniform vec3 uCool; // the one line colour; deeper on the light theme
`;

const LINE_VS = /* glsl */ `#version 300 es
in vec2 aCorner;
in vec3 aA;
in vec3 aB;
uniform mat4 uViewProj;
uniform vec2 uViewport;
uniform float uWidth;
${SPIN}
out float vY;
out float vSide;
void main() {
  vec4 ca = uViewProj * vec4(spin(aA), 1.0);
  vec4 cb = uViewProj * vec4(spin(aB), 1.0);
  vec2 sa = ca.xy / ca.w * uViewport;
  vec2 sb = cb.xy / cb.w * uViewport;
  vec2 d = sb - sa;
  d = length(d) < 1e-4 ? vec2(1.0, 0.0) : normalize(d);
  vec2 n = vec2(-d.y, d.x);
  vec4 c = aCorner.x < 0.5 ? ca : cb;
  // Half a width past each end, so neighbouring strands meet without a notch.
  vec2 off = (n * aCorner.y + d * (aCorner.x * 2.0 - 1.0)) * uWidth;
  c.xy += off / uViewport * c.w;
  gl_Position = c;
  vY = mix(aA.y, aB.y, aCorner.x);
  vSide = aCorner.y;
}`;

const LINE_FS = /* glsl */ `#version 300 es
precision highp float;
in float vY;
in float vSide;
uniform float uAlpha;
${COLOUR}
uniform float uReveal;
uniform float uScan;
out vec4 outColor;
void main() {
  if (vY > uReveal) discard;
  float soft = 1.0 - smoothstep(0.35, 1.0, abs(vSide));
  float scan = exp(-pow((vY - uScan) / 0.045, 2.0));
  float front = exp(-pow((vY - uReveal) / 0.03, 2.0));
  float heat = clamp(scan + front, 0.0, 1.0);
  vec3 g = uCool;
  float a = clamp(uAlpha * (1.0 + heat * 2.5), 0.0, 1.0) * soft;
  outColor = vec4(mix(g, vec3(1.0), heat * 0.55) * a, a);
}`;

const SURFACE_VS = /* glsl */ `#version 300 es
in vec3 aPos;
uniform mat4 uViewProj;
${SPIN}
void main() { gl_Position = uViewProj * vec4(spin(aPos), 1.0); }`;

const SURFACE_FS = /* glsl */ `#version 300 es
precision mediump float;
out vec4 outColor;
void main() { outColor = vec4(0.0); }`;

const MOTE_VS = /* glsl */ `#version 300 es
in vec3 aSeed;
uniform mat4 uViewProj;
uniform float uTime;
uniform float uDpr;
${SPIN}
out float vFade;
void main() {
  // Specks rising through the chamber, each on its own loop.
  float h = 1.9;
  float y = mod(aSeed.y * h + uTime * (0.04 + 0.05 * fract(aSeed.y * 7.0)), h) - 0.15;
  vec3 p = spin(vec3(aSeed.x, y, aSeed.z));
  gl_Position = uViewProj * vec4(p, 1.0);
  gl_PointSize = (1.2 + 1.6 * fract(aSeed.x * 13.0)) * uDpr;
  vFade = smoothstep(-0.15, 0.25, y) * (1.0 - smoothstep(1.3, 1.75, y));
}`;

const MOTE_FS = /* glsl */ `#version 300 es
precision mediump float;
in float vFade;
${COLOUR}
out vec4 outColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (1.0 - smoothstep(0.2, 0.5, d)) * vFade * 0.7;
  vec3 g = uCool;
  outColor = vec4(mix(g, vec3(1.0), 0.25) * a, a);
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const prog = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
    gl.attachShader(prog, sh);
    gl.deleteShader(sh);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
  const u = (name: string) => gl.getUniformLocation(prog, name);
  return { prog, u };
}

/** The turntable: two rings with a ring of ticks between, as line segments. */
function turntable(): Float32Array {
  const segs: number[] = [];
  const y = -0.035;
  const ring = (r: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      segs.push(Math.cos(a0) * r, y, Math.sin(a0) * r, Math.cos(a1) * r, y, Math.sin(a1) * r);
    }
  };
  ring(0.8, 96);
  ring(0.9, 96);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2, long = i % 6 === 0;
    const r0 = long ? 0.8 : 0.85;
    segs.push(Math.cos(a) * r0, y, Math.sin(a) * r0, Math.cos(a) * 0.9, y, Math.sin(a) * 0.9);
  }
  return new Float32Array(segs);
}

// ── column-major 4x4 ────────────────────────────────────────────────────────
function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}
function lookAt(eye: number[], at: number[]) {
  const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const norm = (v: number[]) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const z = norm(sub(eye, at)), x = norm(cross([0, 1, 0], z)), y = cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
}
function mul(a: number[], b: number[]) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return new Float32Array(o);
}

export function createScene(canvas: HTMLCanvasElement, mesh: Mesh): SurferScene | null {
  const gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: true, alpha: true });
  if (!gl) return null;

  const line = compile(gl, LINE_VS, LINE_FS);
  const surface = compile(gl, SURFACE_VS, SURFACE_FS);
  const mote = compile(gl, MOTE_VS, MOTE_FS);

  const buffer = (target: number, data: AllowSharedBufferSource) => {
    const b = gl.createBuffer()!;
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    return b;
  };

  // One quad, shared by every instanced line set.
  const corners = buffer(gl.ARRAY_BUFFER, new Float32Array([0, -1, 1, -1, 0, 1, 1, 1]));

  const lineSet = (segments: Float32Array) => {
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, corners);
    const lc = gl.getAttribLocation(line.prog, 'aCorner');
    gl.enableVertexAttribArray(lc);
    gl.vertexAttribPointer(lc, 2, gl.FLOAT, false, 0, 0);
    buffer(gl.ARRAY_BUFFER, segments);
    for (const [name, offset] of [['aA', 0], ['aB', 12]] as const) {
      const loc = gl.getAttribLocation(line.prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 24, offset);
      gl.vertexAttribDivisor(loc, 1);
    }
    gl.bindVertexArray(null);
    return { vao, count: segments.length / 6 };
  };

  const segs = new Float32Array(mesh.edges.length * 3);
  for (let i = 0; i < mesh.edges.length; i++) {
    const v = mesh.edges[i] * 3;
    segs.set(mesh.positions.subarray(v, v + 3), i * 3);
  }
  const wire = lineSet(segs);
  const table = lineSet(turntable());

  const surfVao = gl.createVertexArray()!;
  gl.bindVertexArray(surfVao);
  buffer(gl.ARRAY_BUFFER, mesh.positions);
  const sp = gl.getAttribLocation(surface.prog, 'aPos');
  gl.enableVertexAttribArray(sp);
  gl.vertexAttribPointer(sp, 3, gl.FLOAT, false, 0, 0);
  buffer(gl.ELEMENT_ARRAY_BUFFER, mesh.tris);
  gl.bindVertexArray(null);

  // Specks: a fixed pseudo-random cloud, so every visit sees the same chamber.
  const MOTES = 140;
  const seeds = new Float32Array(MOTES * 3);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < MOTES; i++) {
    const r = 0.25 + Math.sqrt(rnd()) * 0.75, a = rnd() * Math.PI * 2;
    seeds.set([Math.cos(a) * r, rnd(), Math.sin(a) * r], i * 3);
  }
  const moteVao = gl.createVertexArray()!;
  gl.bindVertexArray(moteVao);
  buffer(gl.ARRAY_BUFFER, seeds);
  const ms = gl.getAttribLocation(mote.prog, 'aSeed');
  gl.enableVertexAttribArray(ms);
  gl.vertexAttribPointer(ms, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  let viewProj = new Float32Array(16);
  let cool: [number, number, number] = [0, 0.9, 1];
  let dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Fit the turntable across the width and the figure top to bottom,
    // whichever needs the camera further back.
    const aspect = w / Math.max(h, 1);
    const fovy = (26 * Math.PI) / 180;
    const tv = Math.tan(fovy / 2), th = tv * aspect;
    const dist = Math.max(1.14 / th, 0.86 / tv);
    const target = [0, 0.6, 0];
    const eye = [0, target[1] + dist * 0.2, dist];
    viewProj = mul(perspective(fovy, aspect, 0.1, 50), lookAt(eye, target));
  };
  resize();

  gl.enable(gl.BLEND);

  const drawLines = (set: { vao: WebGLVertexArrayObject; count: number }, width: number, alpha: number) => {
    gl.uniform1f(line.u('uWidth'), width * dpr * 0.5);
    gl.uniform1f(line.u('uAlpha'), alpha);
    gl.bindVertexArray(set.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, set.count);
  };

  const draw = (angle: number, time: number, reveal: number, scan: number) => {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 1. The surface, depth only, nudged back so strands lying on it pass.
    gl.useProgram(surface.prog);
    gl.uniformMatrix4fv(surface.u('uViewProj'), false, viewProj);
    gl.uniform1f(surface.u('uAngle'), angle);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.colorMask(false, false, false, false);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(2, 2);
    gl.bindVertexArray(surfVao);
    gl.drawElements(gl.TRIANGLES, mesh.tris.length, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.colorMask(true, true, true, true);
    gl.depthMask(false);

    // 2. Lines.
    gl.useProgram(line.prog);
    gl.uniformMatrix4fv(line.u('uViewProj'), false, viewProj);
    gl.uniform2f(line.u('uViewport'), canvas.width / 2, canvas.height / 2);
    gl.uniform1f(line.u('uAngle'), angle);
    gl.uniform3fv(line.u('uCool'), cool);
    gl.uniform1f(line.u('uReveal'), reveal);
    gl.uniform1f(line.u('uScan'), scan);

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    drawLines(wire, 1, 0.1);
    drawLines(table, 1.2, 0.6);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.ONE, gl.ONE);
    drawLines(wire, 6, 0.1);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    drawLines(wire, 1.6, 1);

    // 3. Specks.
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(mote.prog);
    gl.uniformMatrix4fv(mote.u('uViewProj'), false, viewProj);
    gl.uniform1f(mote.u('uAngle'), angle * 0.35);
    gl.uniform1f(mote.u('uTime'), time);
    gl.uniform1f(mote.u('uDpr'), dpr);
    gl.uniform3fv(mote.u('uCool'), cool);
    gl.bindVertexArray(moteVao);
    gl.drawArrays(gl.POINTS, 0, MOTES);
    gl.bindVertexArray(null);
  };

  const dispose = () => {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  const setCool = (rgb: [number, number, number]) => { cool = rgb; };

  return { draw, setCool, resize, dispose };
}
