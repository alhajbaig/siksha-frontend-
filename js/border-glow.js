/* ==========================================================================
   BORDER GLOW — REACT BITS DYNAMIC EDGE PROXIMITY & CONE GLOW ENGINE
   Mesh Gradient Edge Tracking • Angular Conic Highlights • Multi-layer Specular
   ========================================================================== */

(function () {
  'use strict';

  function parseHSL(hslStr) {
    const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
    if (!match) return { h: 240, s: 80, l: 75 };
    return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
  }

  function buildGlowVars(glowColor, intensity = 1.0) {
    const { h, s, l } = parseHSL(glowColor);
    const base = `${h}deg ${s}% ${l}%`;
    const opacities = [100, 60, 50, 40, 30, 20, 10];
    const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    const vars = {};
    for (let i = 0; i < opacities.length; i++) {
      vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
    }
    return vars;
  }

  const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
  const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
  const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

  function buildGradientVars(colors) {
    const vars = {};
    for (let i = 0; i < 7; i++) {
      const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
      vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
    }
    vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
    return vars;
  }

  function getCenterOfElement(el) {
    const rect = el.getBoundingClientRect();
    return [rect.width / 2, rect.height / 2];
  }

  function getEdgeProximity(el, x, y) {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }

  function getCursorAngle(el, x, y) {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }

  function initBorderGlow(selector = '.border-glow-card', options = {}) {
    const cards = document.querySelectorAll(selector);
    const defaultColors = options.colors || ['#5B5CE2', '#8C8DFF', '#19B86B'];
    const glowColor = options.glowColor || '240 80 75';
    const edgeSensitivity = options.edgeSensitivity || 30;
    const glowIntensity = options.glowIntensity || 1.0;
    const coneSpread = options.coneSpread || 25;

    const glowVars = buildGlowVars(glowColor, glowIntensity);
    const gradientVars = buildGradientVars(defaultColors);

    cards.forEach((card) => {
      // Apply initial CSS variables
      Object.entries({ ...glowVars, ...gradientVars }).forEach(([k, v]) => {
        card.style.setProperty(k, v);
      });
      card.style.setProperty('--edge-sensitivity', edgeSensitivity);
      card.style.setProperty('--cone-spread', coneSpread);

      // Ensure edge-light span exists
      if (!card.querySelector('.edge-light')) {
        const edgeLight = document.createElement('span');
        edgeLight.className = 'edge-light';
        card.insertBefore(edgeLight, card.firstChild);
      }

      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const edge = getEdgeProximity(card, x, y);
        const angle = getCursorAngle(card, x, y);

        card.style.setProperty('--edge-proximity', (edge * 100).toFixed(3));
        card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
      });

      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--edge-proximity', '0');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initBorderGlow('.border-glow-card', {
      colors: ['#5B5CE2', '#8C8DFF', '#19B86B'],
      glowColor: '240 80 75',
      edgeSensitivity: 25,
      glowIntensity: 1.1,
      coneSpread: 26
    });
  });
})();
