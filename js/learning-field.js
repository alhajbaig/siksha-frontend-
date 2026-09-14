/* ==========================================================================
   THE LEARNING FIELD & ECOSYSTEM CANVAS ENGINE
   Interactive, High-DPI, Particle and Node Intelligence Graph
   ========================================================================== */

(function () {
  'use strict';

  // --- 1. HERO LEARNING FIELD CANVAS ---
  const heroCanvas = document.getElementById('learning-field-canvas');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let width, height, dpr;
    let mouse = { x: null, y: null, radius: 120 };
    let animationFrameId;

    // Subjects and Concepts Data
    const nodeData = [
      // Central YOU Node
      { id: 'you', name: 'YOU', xRel: 0.5, yRel: 0.5, isCenter: true, status: 'you', radius: 24 },
      
      // Mathematics
      { id: 'math_core', name: 'Mathematics', xRel: 0.28, yRel: 0.28, isSubject: true, status: 'learning' },
      { id: 'alg', name: 'Algebra', parent: 'math_core', xRel: 0.16, yRel: 0.22, status: 'mastered' },
      { id: 'calc', name: 'Calculus', parent: 'math_core', xRel: 0.22, yRel: 0.12, status: 'learning' },
      { id: 'func', name: 'Functions', parent: 'math_core', xRel: 0.38, yRel: 0.18, status: 'mastered' },
      { id: 'quad', name: 'Quadratic Eq.', parent: 'math_core', xRel: 0.14, yRel: 0.36, status: 'weak' },

      // Physics
      { id: 'phys_core', name: 'Physics', xRel: 0.72, yRel: 0.28, isSubject: true, status: 'learning' },
      { id: 'mech', name: 'Mechanics', parent: 'phys_core', xRel: 0.84, yRel: 0.20, status: 'mastered' },
      { id: 'opt', name: 'Optics', parent: 'phys_core', xRel: 0.76, yRel: 0.12, status: 'revision' },
      { id: 'thermo', name: 'Thermodynamics', parent: 'phys_core', xRel: 0.88, yRel: 0.34, status: 'learning' },

      // Chemistry
      { id: 'chem_core', name: 'Chemistry', xRel: 0.80, yRel: 0.68, isSubject: true, status: 'mastered' },
      { id: 'org', name: 'Organic Chem', parent: 'chem_core', xRel: 0.88, yRel: 0.80, status: 'mastered' },
      { id: 'inorg', name: 'Periodic Trends', parent: 'chem_core', xRel: 0.70, yRel: 0.84, status: 'revision' },

      // Biology
      { id: 'bio_core', name: 'Biology', xRel: 0.24, yRel: 0.72, isSubject: true, status: 'mastered' },
      { id: 'gen', name: 'Genetics', parent: 'bio_core', xRel: 0.14, yRel: 0.82, status: 'mastered' },
      { id: 'cell', name: 'Cellular Resp.', parent: 'bio_core', xRel: 0.32, yRel: 0.86, status: 'learning' },

      // Computer Science
      { id: 'cs_core', name: 'Computer Science', xRel: 0.50, yRel: 0.82, isSubject: true, status: 'mastered' },
      { id: 'prog', name: 'Algorithms', parent: 'cs_core', xRel: 0.44, yRel: 0.92, status: 'mastered' },
      { id: 'ds', name: 'Data Structures', parent: 'cs_core', xRel: 0.58, yRel: 0.92, status: 'learning' }
    ];

    let nodes = [];
    let pulses = [];

    // Colors mapping
    const statusColors = {
      you: { bg: '#5B5CE2', text: '#FFFFFF', border: '#5B5CE2', glow: 'rgba(91, 92, 226, 0.3)' },
      mastered: { bg: '#19B86B', text: '#FFFFFF', border: '#19B86B', glow: 'rgba(25, 184, 107, 0.2)' },
      learning: { bg: '#5B5CE2', text: '#FFFFFF', border: '#5B5CE2', glow: 'rgba(91, 92, 226, 0.2)' },
      weak: { bg: '#EB5757', text: '#FFFFFF', border: '#EB5757', glow: 'rgba(235, 87, 87, 0.2)' },
      revision: { bg: '#EAA023', text: '#FFFFFF', border: '#EAA023', glow: 'rgba(234, 160, 35, 0.2)' }
    };

    function resize() {
      const rect = heroCanvas.parentElement.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      heroCanvas.width = width * dpr;
      heroCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initNodes();
    }

    function initNodes() {
      nodes = nodeData.map(item => {
        const baseX = item.xRel * width;
        const baseY = item.yRel * height;
        return {
          ...item,
          baseX: baseX,
          baseY: baseY,
          x: baseX,
          y: baseY,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: item.radius || (item.isSubject ? 16 : 8),
          pulseOffset: Math.random() * Math.PI * 2
        };
      });
    }

    function addPulse() {
      if (nodes.length < 2) return;
      const startNode = nodes[0]; // 'YOU'
      const endNodes = nodes.filter(n => n.parent || n.isSubject);
      const target = endNodes[Math.floor(Math.random() * endNodes.length)];
      if (target) {
        pulses.push({
          from: startNode,
          to: target,
          progress: 0,
          speed: 0.008 + Math.random() * 0.008,
          color: target.status === 'weak' ? '#EB5757' : '#5B5CE2'
        });
      }
    }

    // Interactive mouse listeners
    heroCanvas.parentElement.addEventListener('mousemove', e => {
      const rect = heroCanvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    heroCanvas.parentElement.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    let pulseTimer = 0;

    function render(time) {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle background coordinate grid
      ctx.strokeStyle = 'rgba(232, 232, 230, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update positions with subtle floating physics & mouse interaction
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        // Soft elastic bounce towards origin
        const dx = node.baseX - node.x;
        const dy = node.baseY - node.y;
        node.vx += dx * 0.01;
        node.vy += dy * 0.01;
        node.vx *= 0.92;
        node.vy *= 0.92;

        // Mouse gentle repulsion
        if (mouse.x !== null && mouse.y !== null) {
          const mdx = node.x - mouse.x;
          const mdy = node.y - mouse.y;
          const dist = Math.hypot(mdx, mdy);
          if (dist < mouse.radius && dist > 0) {
            const force = (mouse.radius - dist) / mouse.radius;
            node.vx += (mdx / dist) * force * 1.5;
            node.vy += (mdy / dist) * force * 1.5;
          }
        }
      });

      // 2. Draw Connection Lines
      const centerNode = nodes[0];
      nodes.forEach(node => {
        if (node.isSubject) {
          // Connect Subject to Center YOU
          ctx.beginPath();
          ctx.moveTo(centerNode.x, centerNode.y);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = 'rgba(91, 92, 226, 0.22)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (node.parent) {
          const parentNode = nodes.find(n => n.id === node.parent);
          if (parentNode) {
            ctx.beginPath();
            ctx.moveTo(parentNode.x, parentNode.y);
            ctx.lineTo(node.x, node.y);
            ctx.strokeStyle = 'rgba(16, 17, 20, 0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      // 3. Draw Traveling Signal Pulses
      pulseTimer++;
      if (pulseTimer % 45 === 0) {
        addPulse();
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          pulses.splice(i, 1);
          continue;
        }

        const px = p.from.x + (p.to.x - p.from.x) * p.progress;
        const py = p.from.y + (p.to.y - p.from.y) * p.progress;

        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 4. Draw Nodes
      nodes.forEach(node => {
        const style = statusColors[node.status] || statusColors.learning;

        if (node.isCenter) {
          // Center Node (YOU)
          const pulseScale = 1 + Math.sin(time * 0.003) * 0.08;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 1.5 * pulseScale, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(91, 92, 226, 0.08)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = style.border;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = style.glow;
          ctx.shadowBlur = 16;
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Inner center circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = style.bg;
          ctx.fill();

          // Label
          ctx.font = '700 12px Geist, Inter, sans-serif';
          ctx.fillStyle = '#101114';
          ctx.textAlign = 'center';
          ctx.fillText(node.name, node.x, node.y + 36);
        } else if (node.isSubject) {
          // Major Subject Core
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = style.border;
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();

          // Mini status dot
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = style.bg;
          ctx.fill();

          // Label
          ctx.font = '600 12px Geist, Inter, sans-serif';
          ctx.fillStyle = '#101114';
          ctx.textAlign = 'center';
          ctx.fillText(node.name, node.x, node.y - 20);
        } else {
          // Concept Node
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = style.bg;
          ctx.fill();

          // Concept Label
          ctx.font = '500 10.5px Geist, Inter, sans-serif';
          ctx.fillStyle = '#585D6A';
          ctx.textAlign = 'center';
          ctx.fillText(node.name, node.x, node.y + 16);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    }

    window.addEventListener('resize', resize);
    resize();
    render(0);
  }

  // --- 2. LEARNING GENOME RADAR VISUAL ---
  const genomeCanvas = document.getElementById('genome-radar-canvas');
  if (genomeCanvas) {
    const ctx = genomeCanvas.getContext('2d');
    let width, height, dpr;
    let hoveredIndex = null;

    const genomeMetrics = [
      { name: 'Algebra Mastery', score: 0.82, subject: 'Math', mistakes: 2, confidence: 'High' },
      { name: 'Kinematics', score: 0.61, subject: 'Physics', mistakes: 5, confidence: 'Medium' },
      { name: 'Organic Chem', score: 0.84, subject: 'Chemistry', mistakes: 1, confidence: 'High' },
      { name: 'Genetics', score: 0.76, subject: 'Biology', mistakes: 3, confidence: 'Medium' },
      { name: 'Algorithms', score: 0.88, subject: 'CS', mistakes: 1, confidence: 'High' },
      { name: 'Graph Analysis', score: 0.58, subject: 'Math', mistakes: 6, confidence: 'Low' },
      { name: 'Thermodynamics', score: 0.64, subject: 'Physics', mistakes: 4, confidence: 'Medium' }
    ];

    function resizeGenome() {
      const rect = genomeCanvas.parentElement.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      genomeCanvas.width = width * dpr;
      genomeCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      drawGenome();
    }

    function drawGenome() {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.min(width, height) * 0.38;
      const count = genomeMetrics.length;

      // Draw concentric radar circles
      ctx.strokeStyle = '#EBEBE8';
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1].forEach(fraction => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius * fraction, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw axes
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const ax = cx + Math.cos(angle) * maxRadius;
        const ay = cy + Math.sin(angle) * maxRadius;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ax, ay);
        ctx.stroke();
      }

      // Draw Poly Filled Genome
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const r = maxRadius * genomeMetrics[i].score;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(91, 92, 226, 0.12)';
      ctx.fill();
      ctx.strokeStyle = '#5B5CE2';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Node points and labels
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const r = maxRadius * genomeMetrics[i].score;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;

        const isHovered = hoveredIndex === i;

        // Point
        ctx.beginPath();
        ctx.arc(px, py, isHovered ? 7 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = genomeMetrics[i].score > 0.75 ? '#19B86B' : (genomeMetrics[i].score < 0.6 ? '#EB5757' : '#5B5CE2');
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label on outer perimeter
        const lx = cx + Math.cos(angle) * (maxRadius + 22);
        const ly = cy + Math.sin(angle) * (maxRadius + 22);
        ctx.font = isHovered ? '700 11px Geist, Inter' : '500 10.5px Geist, Inter';
        ctx.fillStyle = isHovered ? '#101114' : '#585D6A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${genomeMetrics[i].name} (${Math.round(genomeMetrics[i].score * 100)}%)`, lx, ly);
      }
    }

    genomeCanvas.addEventListener('mousemove', e => {
      const rect = genomeCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.min(width, height) * 0.38;

      let found = null;
      genomeMetrics.forEach((m, i) => {
        const angle = (i / genomeMetrics.length) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(angle) * (maxRadius * m.score);
        const py = cy + Math.sin(angle) * (maxRadius * m.score);
        if (Math.hypot(mx - px, my - py) < 20) {
          found = i;
        }
      });

      if (found !== hoveredIndex) {
        hoveredIndex = found;
        drawGenome();
        // Trigger tooltip or info panel update if hovered
        const infoEl = document.getElementById('genome-dynamic-info');
        if (infoEl && found !== null) {
          const item = genomeMetrics[found];
          infoEl.innerHTML = `
            <div class="badge ${item.score > 0.75 ? 'badge-green' : 'badge-indigo'}">${item.subject}</div>
            <h4 style="margin: 0.4rem 0; font-size: 1.1rem; font-weight: 700;">${item.name}</h4>
            <div style="font-size: 0.85rem; color: #585D6A;">Mastery Level: <strong>${Math.round(item.score * 100)}%</strong></div>
            <div style="font-size: 0.85rem; color: #585D6A;">Recent Mistakes: <strong>${item.mistakes}</strong> | Confidence: <strong>${item.confidence}</strong></div>
            <div style="margin-top: 0.6rem; font-size: 0.8rem; color: #5B5CE2; font-weight: 600;">Recommendation: ${item.score < 0.65 ? 'Targeted Practice' : 'Scheduled Revision'}</div>
          `;
        }
      }
    });

    window.addEventListener('resize', resizeGenome);
    resizeGenome();
  }

  // --- 3. EBBINGHAUS SMART REVISION MEMORY CURVE ---
  const revisionCanvas = document.getElementById('memory-curve-canvas');
  if (revisionCanvas) {
    const ctx = revisionCanvas.getContext('2d');
    let width, height, dpr;

    function resizeRevision() {
      const rect = revisionCanvas.parentElement.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      revisionCanvas.width = width * dpr;
      revisionCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      drawCurve();
    }

    function drawCurve() {
      ctx.clearRect(0, 0, width, height);

      const paddingLeft = 60;
      const paddingRight = 40;
      const paddingTop = 30;
      const paddingBottom = 50;
      const plotWidth = width - paddingLeft - paddingRight;
      const plotHeight = height - paddingTop - paddingBottom;

      // Draw Grid & Axes
      ctx.strokeStyle = '#EBEBE8';
      ctx.lineWidth = 1;

      // Y Axis lines (Retention %)
      [0, 25, 50, 75, 100].forEach(p => {
        const y = paddingTop + plotHeight * (1 - p / 100);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();

        ctx.font = '500 10px JetBrains Mono, monospace';
        ctx.fillStyle = '#8E929E';
        ctx.textAlign = 'right';
        ctx.fillText(`${p}%`, paddingLeft - 10, y + 3);
      });

      // Days timeline
      const days = [
        { label: 'Day 1: Learn', rel: 0.05, boost: 1.0 },
        { label: 'Day 3: Recall', rel: 0.25, boost: 0.95 },
        { label: 'Day 7: Practice', rel: 0.55, boost: 0.98 },
        { label: 'Day 21: Reinforce', rel: 0.90, boost: 1.0 }
      ];

      days.forEach(d => {
        const x = paddingLeft + plotWidth * d.rel;
        ctx.beginPath();
        ctx.moveTo(x, paddingTop);
        ctx.lineTo(x, height - paddingBottom);
        ctx.strokeStyle = 'rgba(91, 92, 226, 0.15)';
        ctx.stroke();

        ctx.font = '600 10.5px Geist, Inter';
        ctx.fillStyle = '#585D6A';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, x, height - paddingBottom + 20);
      });

      // 1. Without SikshaSaathi: Steep Forgetting Curve (Fades to 20%)
      ctx.beginPath();
      for (let x = 0; x <= plotWidth; x += 4) {
        const t = x / plotWidth;
        const retention = Math.exp(-t * 2.8) * 0.8 + 0.15;
        const px = paddingLeft + x;
        const py = paddingTop + plotHeight * (1 - retention);
        if (x === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = '#D5D6D0';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. With SikshaSaathi Smart Revision: Boosted Multi-curve
      ctx.beginPath();
      let prevX = 0;
      days.forEach((d, idx) => {
        const targetX = plotWidth * d.rel;
        for (let x = prevX; x <= targetX; x += 3) {
          const t = (x - prevX) / (targetX - prevX || 1);
          const baseDecay = 1 - t * 0.35;
          const px = paddingLeft + x;
          const py = paddingTop + plotHeight * (1 - baseDecay * 0.9);
          if (x === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        prevX = targetX;
      });
      // Final tail
      for (let x = prevX; x <= plotWidth; x += 3) {
        const t = (x - prevX) / (plotWidth - prevX);
        const baseDecay = 0.95 - t * 0.05;
        const px = paddingLeft + x;
        const py = paddingTop + plotHeight * (1 - baseDecay);
        ctx.lineTo(px, py);
      }

      ctx.strokeStyle = '#19B86B';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw Revision Pulse Dots
      days.forEach(d => {
        const x = paddingLeft + plotWidth * d.rel;
        const y = paddingTop + plotHeight * (1 - d.boost * 0.92);

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#19B86B';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    window.addEventListener('resize', resizeRevision);
    resizeRevision();
  }

  // --- 4. CLOSED LOOP ANIMATED INTELLIGENCE ENGINE ---
  const loopCanvas = document.getElementById('closed-loop-canvas');
  if (loopCanvas) {
    const ctx = loopCanvas.getContext('2d');
    let width, height, dpr;
    let angleOffset = 0;

    const loopStages = [
      'Assessment',
      'Profile Updated',
      'Gap Identified',
      'Recommendation',
      'Targeted Practice',
      'Understanding Verified'
    ];

    function resizeLoop() {
      const rect = loopCanvas.parentElement.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      loopCanvas.width = width * dpr;
      loopCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    function renderLoop() {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.36;

      // Draw outer circle track
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#EBEBE8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw active orbiting glow segment
      angleOffset += 0.008;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, angleOffset, angleOffset + Math.PI * 0.7);
      ctx.strokeStyle = '#5B5CE2';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Central Hub
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.fillStyle = '#FAFAF8';
      ctx.strokeStyle = '#5B5CE2';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 11px Geist, Inter';
      ctx.fillStyle = '#101114';
      ctx.textAlign = 'center';
      ctx.fillText('CLOSED', cx, cy - 4);
      ctx.fillText('LOOP', cx, cy + 10);

      // Draw stages along perimeter
      const count = loopStages.length;
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(theta) * radius;
        const py = cy + Math.sin(theta) * radius;

        // Stage Node
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#5B5CE2';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        ctx.font = '700 10px JetBrains Mono';
        ctx.fillStyle = '#5B5CE2';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`0${i + 1}`, px, py);

        // Stage Label
        const lx = cx + Math.cos(theta) * (radius + 28);
        const ly = cy + Math.sin(theta) * (radius + 28);
        ctx.font = '600 11px Geist, Inter';
        ctx.fillStyle = '#101114';
        ctx.fillText(loopStages[i], lx, ly);
      }

      requestAnimationFrame(renderLoop);
    }

    window.addEventListener('resize', resizeLoop);
    resizeLoop();
    renderLoop();
  }

})();
