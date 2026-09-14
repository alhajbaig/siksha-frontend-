/* ==========================================================================
   CURSOR GRID — INTERACTIVE CANVAS INTELLIGENCE LATTICE
   High-performance dynamic cursor grid with falloff, ripple pulse, and cell glow
   ========================================================================== */

(function () {
  'use strict';

  const FALLOFF_CURVES = {
    linear: (t) => t,
    smooth: (t) => t * t * (3 - 2 * t),
    sharp: (t) => t * t * t
  };

  const hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const num = parseInt(v.slice(0, 6), 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  function initCursorGrid(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let canvas = container.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'cursor-grid__canvas';
      container.appendChild(canvas);
    }

    const config = {
      cellSize: options.cellSize || 65,
      color: options.color || '#5B5CE2',
      radius: options.radius || 150,
      falloff: options.falloff || 'smooth',
      holdTime: options.holdTime || 350,
      fadeDuration: options.fadeDuration || 750,
      lineWidth: options.lineWidth || 1.2,
      maxOpacity: options.maxOpacity || 0.7,
      fillOpacity: options.fillOpacity || 0.04,
      gridOpacity: options.gridOpacity || 0.04,
      cellRadius: options.cellRadius || 3,
      clickPulse: options.clickPulse !== undefined ? options.clickPulse : true,
      pulseSpeed: options.pulseSpeed || 650
    };

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let cols = 0;
    let rows = 0;
    let offX = 0;
    let offY = 0;
    let alphas = new Float32Array(0);
    let touched = new Float64Array(0);
    let w = 0;
    let h = 0;
    const pulses = [];
    let raf = 0;
    let running = false;
    let lastFrame = 0;

    const rebuild = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / config.cellSize) + 1;
      rows = Math.ceil(h / config.cellSize) + 1;
      offX = (w - cols * config.cellSize) / 2;
      offY = (h - rows * config.cellSize) / 2;
      alphas = new Float32Array(cols * rows);
      touched = new Float64Array(cols * rows);
    };

    const cellCenter = (i) => {
      const cx = offX + (i % cols) * config.cellSize + config.cellSize / 2;
      const cy = offY + Math.floor(i / cols) * config.cellSize + config.cellSize / 2;
      return [cx, cy];
    };

    const energize = (x, y, boost) => {
      const r = Math.max(config.radius, 1);
      const ease = FALLOFF_CURVES[config.falloff] || FALLOFF_CURVES.linear;
      const now = performance.now();
      const minCol = Math.max(0, Math.floor((x - r - offX) / config.cellSize));
      const maxCol = Math.min(cols - 1, Math.floor((x + r - offX) / config.cellSize));
      const minRow = Math.max(0, Math.floor((y - r - offY) / config.cellSize));
      const maxRow = Math.min(rows - 1, Math.floor((y + r - offY) / config.cellSize));

      for (let cRow = minRow; cRow <= maxRow; cRow++) {
        for (let cCol = minCol; cCol <= maxCol; cCol++) {
          const i = cRow * cols + cCol;
          const [cx, cy] = cellCenter(i);
          const dist = Math.hypot(cx - x, cy - y);
          if (dist > r) continue;
          const level = ease(1 - dist / r) * config.maxOpacity * (boost || 1);
          if (level > alphas[i]) {
            alphas[i] = level;
            touched[i] = now;
          } else if (level > 0) {
            touched[i] = now;
          }
        }
      }
    };

    const draw = (now) => {
      const dt = Math.min(now - lastFrame, 50);
      lastFrame = now;
      ctx.clearRect(0, 0, w, h);
      const [cr, cg, cb] = hexToRgb(config.color);

      // Faint static lattice on white background
      if (config.gridOpacity > 0) {
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${config.gridOpacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let cCol = 0; cCol <= cols; cCol++) {
          const x = Math.round(offX + cCol * config.cellSize) + 0.5;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
        }
        for (let cRow = 0; cRow <= rows; cRow++) {
          const y = Math.round(offY + cRow * config.cellSize) + 0.5;
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
        }
        ctx.stroke();
      }

      // Expanding click pulses
      for (let pi = pulses.length - 1; pi >= 0; pi--) {
        const pulse = pulses[pi];
        const age = (now - pulse.t0) / 1000;
        const ringR = age * config.pulseSpeed;
        if (ringR > Math.hypot(w, h)) {
          pulses.splice(pi, 1);
          continue;
        }
        const band = config.cellSize;
        const minCol = Math.max(0, Math.floor((pulse.x - ringR - band - offX) / config.cellSize));
        const maxCol = Math.min(cols - 1, Math.floor((pulse.x + ringR + band - offX) / config.cellSize));
        const minRow = Math.max(0, Math.floor((pulse.y - ringR - band - offY) / config.cellSize));
        const maxRow = Math.min(rows - 1, Math.floor((pulse.y + ringR + band - offY) / config.cellSize));

        for (let cRow = minRow; cRow <= maxRow; cRow++) {
          for (let cCol = minCol; cCol <= maxCol; cCol++) {
            const i = cRow * cols + cCol;
            const [cx, cy] = cellCenter(i);
            const dist = Math.hypot(cx - pulse.x, cy - pulse.y);
            if (Math.abs(dist - ringR) < band / 2 && config.maxOpacity > alphas[i]) {
              alphas[i] = config.maxOpacity;
              touched[i] = now;
            }
          }
        }
      }

      let anyVisible = pulses.length > 0;
      const fadeStep = dt / Math.max(config.fadeDuration, 16);
      const half = config.cellSize / 2;

      for (let i = 0; i < alphas.length; i++) {
        let a = alphas[i];
        if (a <= 0) continue;
        if (now - touched[i] > config.holdTime) {
          a = Math.max(0, a - fadeStep);
          alphas[i] = a;
          if (a <= 0) continue;
        }
        anyVisible = true;

        const [cx, cy] = cellCenter(i);
        const gradient = ctx.createRadialGradient(cx, cy, half * 0.1, cx, cy, config.cellSize);
        gradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${a})`);
        gradient.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);

        const x = cx - half + 0.5;
        const y = cy - half + 0.5;
        const s = config.cellSize - 1;

        ctx.beginPath();
        if (config.cellRadius > 0) {
          if (ctx.roundRect) {
            ctx.roundRect(x, y, s, s, config.cellRadius);
          } else {
            ctx.rect(x, y, s, s);
          }
        } else {
          ctx.rect(x, y, s, s);
        }

        if (config.fillOpacity > 0) {
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * config.fillOpacity})`;
          ctx.fill();
        }
        ctx.strokeStyle = gradient;
        ctx.lineWidth = config.lineWidth;
        ctx.stroke();
      }

      if (anyVisible) {
        raf = requestAnimationFrame(draw);
      } else {
        running = false;
        if (config.gridOpacity <= 0) ctx.clearRect(0, 0, w, h);
      }
    };

    const wake = () => {
      if (running) return;
      running = true;
      lastFrame = performance.now();
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener('pointermove', (e) => {
      energize(e.clientX, e.clientY);
      wake();
    });

    window.addEventListener('pointerdown', (e) => {
      if (!config.clickPulse) return;
      pulses.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
      wake();
    });

    window.addEventListener('resize', () => {
      rebuild();
      wake();
    });

    rebuild();
    wake();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCursorGrid('cursor-grid-container', {
      cellSize: 64,
      color: '#5B5CE2',
      radius: 160,
      falloff: 'smooth',
      holdTime: 300,
      fadeDuration: 700,
      lineWidth: 1.2,
      maxOpacity: 0.8,
      fillOpacity: 0.035,
      gridOpacity: 0.035,
      cellRadius: 4,
      clickPulse: true,
      pulseSpeed: 700
    });
  });
})();
