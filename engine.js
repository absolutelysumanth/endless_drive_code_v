/* engine.js
   Smooth browser game core:
   - fixed 60 Hz simulation
   - interpolated render frames
   - adaptive pixel ratio
   - no async framework or build step
*/
(function (global) {
  "use strict";

  const Engine = {};

  Engine.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Engine.lerp = (a, b, t) => a + (b - a) * t;
  Engine.smoothstep = (t) => {
    t = Engine.clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  };
  Engine.rand = (seed) => {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  };
  Engine.between = (seed, a, b) => a + Engine.rand(seed) * (b - a);
  Engine.angleDelta = (a, b) => {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  Engine.angleLerp = (a, b, t) => a + Engine.angleDelta(b, a) * t;

  class Input {
    constructor(preventCodes) {
      this.down = Object.create(null);
      this.prevent = new Set(preventCodes || []);
      addEventListener("keydown", (e) => {
        this.down[e.code] = true;
        if (this.prevent.has(e.code)) e.preventDefault();
      }, { passive: false });
      addEventListener("keyup", (e) => {
        this.down[e.code] = false;
        if (this.prevent.has(e.code)) e.preventDefault();
      }, { passive: false });
      addEventListener("blur", () => {
        this.down = Object.create(null);
      });
    }
    isDown(code) {
      return !!this.down[code];
    }
    any(...codes) {
      return codes.some((code) => this.isDown(code));
    }
  }
  Engine.Input = Input;

  class FixedLoop {
    constructor(options) {
      this.fixedDt = options.fixedDt || 1 / 60;
      this.maxFrameDt = options.maxFrameDt || 0.1;
      this.maxSteps = options.maxSteps || 4;
      this.update = options.update;
      this.render = options.render;
      this.onFrame = options.onFrame || (() => {});
      this.accumulator = 0;
      this.last = performance.now();
      this.running = false;
      this._frame = this._frame.bind(this);
    }
    start() {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this._frame);
    }
    stop() {
      this.running = false;
    }
    _frame(now) {
      if (!this.running) return;
      let rawDt = (now - this.last) / 1000;
      this.last = now;
      if (!Number.isFinite(rawDt) || rawDt < 0) rawDt = this.fixedDt;
      const frameDt = Math.min(rawDt, this.maxFrameDt);
      this.accumulator += frameDt;

      let steps = 0;
      while (this.accumulator >= this.fixedDt && steps < this.maxSteps) {
        this.update(this.fixedDt);
        this.accumulator -= this.fixedDt;
        steps++;
      }

      // Prevent spiral-of-death stutters. If the browser stalls, drop stale sim time
      // instead of trying to simulate hundreds of old frames.
      if (steps === this.maxSteps && this.accumulator > this.fixedDt) {
        this.accumulator = this.accumulator % this.fixedDt;
      }

      const alpha = Engine.clamp(this.accumulator / this.fixedDt, 0, 1);
      this.onFrame(rawDt, steps);
      this.render(alpha, rawDt);
      requestAnimationFrame(this._frame);
    }
  }
  Engine.FixedLoop = FixedLoop;

  class PerfTracker {
    constructor() {
      this.fps = 60;
      this.minFps = 60;
      this.frameSpikeCount = 0;
    }
    update(rawDt) {
      const instant = 1 / Math.max(rawDt, 0.001);
      this.fps = Engine.lerp(this.fps, instant, 0.07);
      this.minFps = Math.min(this.minFps, instant);
      if (rawDt > 0.055) this.frameSpikeCount++;
    }
  }
  Engine.PerfTracker = PerfTracker;

  class AdaptiveQuality {
    constructor(renderer, perf) {
      this.renderer = renderer;
      this.perf = perf;
      this.timer = 0;
      this.pixelRatio = Math.min(devicePixelRatio || 1, 1.35);
      this.renderer.setPixelRatio(this.pixelRatio);
    }
    update(dt) {
      this.timer += dt;
      if (this.timer < 1.2) return;
      this.timer = 0;
      const fps = this.perf.fps;
      const targetMax = Math.min(devicePixelRatio || 1, 1.35);
      if (fps < 45 && this.pixelRatio > 0.78) {
        this.pixelRatio = Math.max(0.78, this.pixelRatio - 0.12);
        this.renderer.setPixelRatio(this.pixelRatio);
      } else if (fps > 57 && this.pixelRatio < targetMax) {
        this.pixelRatio = Math.min(targetMax, this.pixelRatio + 0.06);
        this.renderer.setPixelRatio(this.pixelRatio);
      }
    }
  }
  Engine.AdaptiveQuality = AdaptiveQuality;

  global.DriveEngine = Engine;
})(window);
