/* ==========================================================================
   AI PERSONAL MENTOR — INTERACTIVE SOCRATIC / NORMAL / MULTIMODAL DEMO
   Demonstrates adaptive learning responses and socratic inquiry
   ========================================================================== */

(function () {
  'use strict';

  let currentMode = 'socratic'; // 'socratic' | 'normal' | 'multimodal'
  let currentQuestionKey = 'photosynthesis';

  const demoConversations = {
    photosynthesis: {
      student: 'What is photosynthesis and why does it matter for plant cells?',
      normal: {
        ai: 'Photosynthesis is the biological process by which autotrophic organisms like green plants convert light energy into chemical energy. Using sunlight, carbon dioxide (CO₂), and water (H₂O), plants synthesize glucose (C₆H₁₂O₆) and release oxygen (O₂) into the atmosphere.',
        annotation: 'Direct informative answer.'
      },
      socratic: {
        ai: 'Let’s explore how the plant powers itself.\n\nThink about what an organism needs to build sugar molecules: Where does the plant harvest the energy, and what raw materials does it take from the air and soil?',
        annotation: 'Guides the learner to identify inputs, energy transformations, and mechanisms themselves.'
      },
      multimodal: {
        ai: 'Analyzing chloroplast ultrastructure diagram:\n\n1. Light-dependent reactions take place across the thylakoid membranes.\n2. Calvin Cycle fixates carbon in the stroma.\n\nNotice where ATP and NADPH are synthesized before being consumed.',
        annotation: 'Multimodal vision model parsing chloroplast diagram components.'
      }
    },
    physics_error: {
      student: 'I don’t understand why my projectile range formula gave the wrong answer for 45° launch on a 10m cliff.',
      normal: {
        ai: 'When launching from an elevation h > 0, the maximum range angle is not 45°. You must use the full kinematic equation: R = (v₀ cos θ / g) * (v₀ sin θ + √(v₀² sin² θ + 2gh)).',
        annotation: 'Direct equation formula.'
      },
      socratic: {
        ai: 'Let’s look at your initial assumption.\n\nThe classic 45° maximum range assumes the projectile lands at the exact same vertical level as the launch. When the landing point is 10 meters lower, does the projectile spend more time or less time in the air?',
        annotation: 'Challenges the student to examine boundary conditions and flight duration.'
      },
      multimodal: {
        ai: 'Handwritten working review:\n\nIn Step 3, you set y(t) = 0 instead of y(t) = -10m. This omitted the extra gravitational potential energy converted into horizontal flight time.',
        annotation: 'OCR and mathematical error detection in handwritten notes.'
      }
    },
    algebra: {
      student: 'Why does (x + y)² not equal x² + y²?',
      normal: {
        ai: '(x + y)² expands to (x + y)(x + y) = x² + 2xy + y² due to the distributive property (FOIL method). The middle term 2xy represents the cross products.',
        annotation: 'Direct algebraic identity proof.'
      },
      socratic: {
        ai: 'Picture a large square with side length (x + y).\n\nIf you divide it into four smaller geometric regions, you get a square of area x², a square of area y², and what are the shapes and areas of the remaining two corner rectangles?',
        annotation: 'Connects algebraic abstraction to geometric intuition.'
      },
      multimodal: {
        ai: 'Geometric decomposition:\n\n- Area 1: x · x = x²\n- Area 2 & 3: Two rectangles of dimensions x × y = 2xy\n- Area 4: y · y = y²\nTotal Area = x² + 2xy + y².',
        annotation: 'Visual-spatial mathematical decomposition.'
      }
    }
  };

  const modeButtons = document.querySelectorAll('.mode-pill');
  const questionSelectors = document.querySelectorAll('.mentor-question-chip');
  const studentTextEl = document.getElementById('mentor-student-msg');
  const aiTextEl = document.getElementById('mentor-ai-msg');
  const annotationEl = document.getElementById('mentor-mode-annotation');
  const customInput = document.getElementById('mentor-custom-input');
  const sendBtn = document.getElementById('mentor-send-btn');

  let typeInterval = null;

  function typeWriterEffect(targetElement, fullText, speed = 12) {
    if (typeInterval) clearInterval(typeInterval);
    targetElement.textContent = '';
    let index = 0;

    typeInterval = setInterval(() => {
      if (index < fullText.length) {
        targetElement.textContent += fullText.charAt(index);
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, speed);
  }

  function updateConversation(animate = true) {
    const convo = demoConversations[currentQuestionKey] || demoConversations.photosynthesis;
    const modeData = convo[currentMode] || convo.socratic;

    if (studentTextEl) {
      studentTextEl.textContent = convo.student;
    }

    if (aiTextEl) {
      if (animate) {
        typeWriterEffect(aiTextEl, modeData.ai);
      } else {
        aiTextEl.textContent = modeData.ai;
      }
    }

    if (annotationEl) {
      annotationEl.textContent = modeData.annotation;
    }
  }

  // Mode Selection Listeners
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.getAttribute('data-mode');
      updateConversation(true);
    });
  });

  // Question Preset Chips
  questionSelectors.forEach(chip => {
    chip.addEventListener('click', () => {
      questionSelectors.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentQuestionKey = chip.getAttribute('data-question');
      updateConversation(true);
    });
  });

  // Custom Input Simulation
  if (sendBtn && customInput) {
    sendBtn.addEventListener('click', handleCustomSubmit);
    customInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleCustomSubmit();
    });
  }

  function handleCustomSubmit() {
    const query = customInput.value.trim();
    if (!query) return;

    if (studentTextEl) studentTextEl.textContent = query;
    customInput.value = '';

    // Generate context-aware response based on active mode
    let response = '';
    if (currentMode === 'socratic') {
      response = `What is your current hypothesis regarding "${query}"? Let's break down the fundamental principle before jumping straight to the conclusion.`;
    } else if (currentMode === 'normal') {
      response = `Regarding "${query}": The standard solution follows direct application of foundational principles and empirical verification.`;
    } else {
      response = `Multimodal scan initialized for query "${query}". Ready to correlate textual inquiry with diagrammatic notes.`;
    }

    typeWriterEffect(aiTextEl, response);
  }

  // Initial render
  window.addEventListener('DOMContentLoaded', () => {
    updateConversation(false);
  });

})();
