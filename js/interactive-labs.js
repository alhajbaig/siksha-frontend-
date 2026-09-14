/* ==========================================================================
   VISUALIZATION LABS — INTERACTIVE SCIENTIFIC SIMULATORS
   Physics Projectile Lab, Chemistry 3D Molecule, Math Function Surface
   ========================================================================== */

(function () {
  'use strict';

  // --- TAB SWITCHER LOGIC ---
  const tabButtons = document.querySelectorAll('.lab-selector-btn');
  const labPanels = document.querySelectorAll('.lab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      labPanels.forEach(p => (p.style.display = 'none'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-lab');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.style.display = 'block';
        // Trigger resize on visible canvas
        window.dispatchEvent(new Event('resize'));
      }
    });
  });

  // =========================================================================
  // 1. PHYSICS LAB: REAL-TIME KINEMATIC PROJECTILE TRAJECTORY
  // =========================================================================
  const physicsCanvas = document.getElementById('physics-lab-canvas');
  if (physicsCanvas) {
    const ctx = physicsCanvas.getContext('2d');
    let width, height, dpr;

    // Parameters
    let angleDeg = 45;
    let initialVelocity = 28; // m/s
    const gravity = 9.81; // m/s^2

    let isSimulating = false;
    let simTime = 0;
    let trajectoryPoints = [];

    // DOM Controls
    const angleSlider = document.getElementById('physics-angle-slider');
    const angleDisplay = document.getElementById('physics-angle-val');
    const velSlider = document.getElementById('physics-vel-slider');
    const velDisplay = document.getElementById('physics-vel-val');
    const fireBtn = document.getElementById('physics-fire-btn');
    const resetBtn = document.getElementById('physics-reset-btn');

    const statRange = document.getElementById('stat-range');
    const statHeight = document.getElementById('stat-height');
    const statFlight = document.getElementById('stat-flight');

    function updateCalculations() {
      const rad = (angleDeg * Math.PI) / 180;
      const v0x = initialVelocity * Math.cos(rad);
      const v0y = initialVelocity * Math.sin(rad);

      const totalFlightTime = (2 * v0y) / gravity;
      const maxH = (v0y * v0y) / (2 * gravity);
      const maxR = (initialVelocity * initialVelocity * Math.sin(2 * rad)) / gravity;

      if (statRange) statRange.textContent = `${maxR.toFixed(1)} m`;
      if (statHeight) statHeight.textContent = `${maxH.toFixed(1)} m`;
      if (statFlight) statFlight.textContent = `${totalFlightTime.toFixed(2)} s`;
    }

    if (angleSlider) {
      angleSlider.addEventListener('input', e => {
        angleDeg = parseFloat(e.target.value);
        if (angleDisplay) angleDisplay.textContent = `${angleDeg}°`;
        updateCalculations();
        resetSim();
      });
    }

    if (velSlider) {
      velSlider.addEventListener('input', e => {
        initialVelocity = parseFloat(e.target.value);
        if (velDisplay) velDisplay.textContent = `${initialVelocity} m/s`;
        updateCalculations();
        resetSim();
      });
    }

    if (fireBtn) {
      fireBtn.addEventListener('click', () => {
        isSimulating = true;
        simTime = 0;
        trajectoryPoints = [];
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', resetSim);
    }

    function resetSim() {
      isSimulating = false;
      simTime = 0;
      trajectoryPoints = [];
    }

    function resizePhysics() {
      const rect = physicsCanvas.parentElement.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      physicsCanvas.width = width * dpr;
      physicsCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      updateCalculations();
    }

    function renderPhysics() {
      ctx.clearRect(0, 0, width, height);

      const groundY = height - 40;
      const originX = 50;
      const scale = (width - 100) / 100; // 100 meters range scale

      // Draw Ground
      ctx.strokeStyle = '#EBEBE8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Draw Distance Ticks on Ground
      for (let m = 0; m <= 100; m += 10) {
        const x = originX + m * scale;
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x, groundY + 8);
        ctx.stroke();

        ctx.font = '500 9px JetBrains Mono';
        ctx.fillStyle = '#8E929E';
        ctx.textAlign = 'center';
        ctx.fillText(`${m}m`, x, groundY + 20);
      }

      // Draw Launch Cannon Base
      ctx.beginPath();
      ctx.arc(originX, groundY, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#101114';
      ctx.fill();

      // Draw Cannon Barrel pointing at angle
      const rad = (angleDeg * Math.PI) / 180;
      const barrelLen = 28;
      const bx = originX + Math.cos(rad) * barrelLen;
      const by = groundY - Math.sin(rad) * barrelLen;

      ctx.beginPath();
      ctx.moveTo(originX, groundY);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = '#5B5CE2';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Theoretical Parabolic Path preview (dashed line)
      ctx.beginPath();
      const v0x = initialVelocity * Math.cos(rad);
      const v0y = initialVelocity * Math.sin(rad);
      const tFlight = (2 * v0y) / gravity;

      for (let t = 0; t <= tFlight; t += 0.05) {
        const px = originX + v0x * t * scale;
        const py = groundY - (v0y * t - 0.5 * gravity * t * t) * scale;
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(91, 92, 226, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // If Simulating, calculate live projectile position
      if (isSimulating) {
        simTime += 0.035;
        const curX = originX + v0x * simTime * scale;
        const curY = groundY - (v0y * simTime - 0.5 * gravity * simTime * simTime) * scale;

        if (curY <= groundY) {
          trajectoryPoints.push({ x: curX, y: curY });

          // Draw real-time projectile ball
          ctx.beginPath();
          ctx.arc(curX, curY, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#19B86B';
          ctx.shadowColor = 'rgba(25, 184, 107, 0.4)';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Reached ground
          isSimulating = false;
        }
      }

      // Draw Trajectory Trail
      if (trajectoryPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trajectoryPoints[0].x, trajectoryPoints[0].y);
        for (let i = 1; i < trajectoryPoints.length; i++) {
          ctx.lineTo(trajectoryPoints[i].x, trajectoryPoints[i].y);
        }
        ctx.strokeStyle = '#19B86B';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      requestAnimationFrame(renderPhysics);
    }

    window.addEventListener('resize', resizePhysics);
    resizePhysics();
    renderPhysics();
  }

  // =========================================================================
  // 2. CHEMISTRY LAB: 3D ROTATABLE MOLECULAR STRUCTURE INSPECTOR
  // =========================================================================
  const chemCanvas = document.getElementById('chemistry-lab-canvas');
  if (chemCanvas) {
    const ctx = chemCanvas.getContext('2d');
    let width, height, dpr;

    // Molecular model (e.g. Water H2O & Methane CH4 models switchable)
    let rotX = 0.3;
    let rotY = 0.5;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Atoms definition for Caffeine / Water / Methane
    // Coordinates [x, y, z, element, radius, color]
    const atoms = [
      { x: 0, y: 0, z: 0, element: 'C', radius: 18, color: '#2C2D35' },
      { x: 50, y: 35, z: 20, element: 'H', radius: 11, color: '#E8E8E6', textColor: '#101114' },
      { x: -50, y: 35, z: -20, element: 'H', radius: 11, color: '#E8E8E6', textColor: '#101114' },
      { x: 0, y: -55, z: 30, element: 'O', radius: 15, color: '#EB5757' },
      { x: 0, y: 25, z: -60, element: 'N', radius: 16, color: '#5B5CE2' }
    ];

    const bonds = [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4]
    ];

    function resizeChem() {
      const rect = chemCanvas.parentElement.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      chemCanvas.width = width * dpr;
      chemCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    chemCanvas.addEventListener('mousedown', e => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => (isDragging = false));

    chemCanvas.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      rotY += dx * 0.01;
      rotX += dy * 0.01;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });

    // Touch support for mobile
    chemCanvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        isDragging = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
      }
    });

    chemCanvas.addEventListener('touchmove', e => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMouseX;
      const dy = e.touches[0].clientY - lastMouseY;
      rotY += dx * 0.01;
      rotX += dy * 0.01;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
    });

    chemCanvas.addEventListener('touchend', () => (isDragging = false));

    function renderChem() {
      ctx.clearRect(0, 0, width, height);

      // Auto gentle rotation when not dragging
      if (!isDragging) {
        rotY += 0.005;
      }

      const cx = width / 2;
      const cy = height / 2;
      const fov = 350;

      // 3D rotation matrix calculation
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Project atoms to 2D
      const projected = atoms.map((a, index) => {
        // Rotate around Y
        let x1 = a.x * cosY + a.z * sinY;
        let y1 = a.y;
        let z1 = -a.x * sinY + a.z * cosY;

        // Rotate around X
        let x2 = x1;
        let y2 = y1 * cosX - z1 * sinX;
        let z2 = y1 * sinX + z1 * cosX;

        const scale = fov / (fov + z2 + 100);
        return {
          index,
          element: a.element,
          radius: a.radius * scale,
          color: a.color,
          textColor: a.textColor || '#FFFFFF',
          px: cx + x2 * scale * 1.8,
          py: cy + y2 * scale * 1.8,
          depth: z2
        };
      });

      // Sort bonds and atoms by depth
      projected.sort((a, b) => b.depth - a.depth);

      // Draw Bonds (Cylinders/Lines)
      bonds.forEach(([i1, i2]) => {
        const p1 = projected.find(p => p.index === i1);
        const p2 = projected.find(p => p.index === i2);
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.strokeStyle = '#D5D6D0';
          ctx.lineWidth = 6;
          ctx.stroke();

          // Highlight line
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Draw Atoms
      projected.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Element Symbol
        ctx.font = `700 ${Math.max(9, p.radius * 0.9)}px Geist, Inter`;
        ctx.fillStyle = p.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.element, p.px, p.py);
      });

      // Instruction overlay
      ctx.font = '500 11px Geist, Inter';
      ctx.fillStyle = '#8E929E';
      ctx.textAlign = 'center';
      ctx.fillText('Drag cursor to rotate in 3D space', cx, height - 16);

      requestAnimationFrame(renderChem);
    }

    window.addEventListener('resize', resizeChem);
    resizeChem();
    renderChem();
  }

  // =========================================================================
  // 3. MATHEMATICS LAB: DYNAMIC PARAMETRIC 3D / 2D WAVE SURFACE
  // =========================================================================
  const mathCanvas = document.getElementById('math-lab-canvas');
  if (mathCanvas) {
    const ctx = mathCanvas.getContext('2d');
    let width, height, dpr;
    let time = 0;

    let freq = 2;
    let amp = 30;

    const freqSlider = document.getElementById('math-freq-slider');
    const freqVal = document.getElementById('math-freq-val');
    const ampSlider = document.getElementById('math-amp-slider');
    const ampVal = document.getElementById('math-amp-val');

    if (freqSlider) {
      freqSlider.addEventListener('input', e => {
        freq = parseFloat(e.target.value);
        if (freqVal) freqVal.textContent = `${freq}x`;
      });
    }

    if (ampSlider) {
      ampSlider.addEventListener('input', e => {
        amp = parseFloat(e.target.value);
        if (ampVal) ampVal.textContent = `${amp}px`;
      });
    }

    function resizeMath() {
      const rect = mathCanvas.parentElement.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      mathCanvas.width = width * dpr;
      mathCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    function renderMath() {
      ctx.clearRect(0, 0, width, height);
      time += 0.03;

      const cx = width / 2;
      const cy = height / 2;

      // Draw Coordinate Grid
      ctx.strokeStyle = '#F0F0EC';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      // Multi-layer 3D Wireframe Wave Surface
      const rows = 12;
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        const yOffset = (r - rows / 2) * 14;
        const depthAlpha = 0.2 + (r / rows) * 0.8;

        for (let x = 0; x < width; x += 4) {
          const u = (x - cx) * 0.018 * freq;
          const v = (yOffset) * 0.05;
          const wave = Math.sin(u + time) * Math.cos(v + time * 0.5) * amp;
          const py = cy + yOffset + wave;

          if (x === 0) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }

        ctx.strokeStyle = `rgba(91, 92, 226, ${depthAlpha})`;
        ctx.lineWidth = r === Math.floor(rows / 2) ? 2.5 : 1;
        ctx.stroke();
      }

      requestAnimationFrame(renderMath);
    }

    window.addEventListener('resize', resizeMath);
    resizeMath();
    renderMath();
  }

})();
