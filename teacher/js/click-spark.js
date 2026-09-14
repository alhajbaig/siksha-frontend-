/* ==========================================================================
   CLICK SPARK — INTERACTIVE BURST ENGINE
   Emits elegant radial sparks upon user click across the entire viewport
   ========================================================================== */

(function () {
  'use strict';

  function initClickSpark(canvasId, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const sparkColor = options.sparkColor || '#5B5CE2';
    const sparkSize = options.sparkSize || 12;
    const sparkRadius = options.sparkRadius || 25;
    const sparkCount = options.sparkCount || 8;
    const duration = options.duration || 450;
    const extraScale = options.extraScale || 1.0;

    let sparks = [];
    let animationId = null;

    const easeFunc = (t) => t * (2 - t);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const draw = (timestamp) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparks = sparks.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) {
          return false;
        }

        const progress = elapsed / duration;
        const eased = easeFunc(progress);

        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        return true;
      });

      if (sparks.length > 0) {
        animationId = requestAnimationFrame(draw);
      } else {
        animationId = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    window.addEventListener('pointerdown', (e) => {
      const x = e.clientX;
      const y = e.clientY;
      const now = performance.now();

      const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
        x,
        y,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now
      }));

      sparks.push(...newSparks);

      if (!animationId) {
        animationId = requestAnimationFrame(draw);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initClickSpark('click-spark-canvas', {
      sparkColor: '#5B5CE2',
      sparkSize: 12,
      sparkRadius: 28,
      sparkCount: 8,
      duration: 450,
      extraScale: 1.0
    });
  });
})();
