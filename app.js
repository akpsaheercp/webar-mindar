/**
 * MindAR Interactive WebAR Application
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // DOM Elements
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingStatus = document.getElementById('loading-status');
  const progressBar = document.getElementById('progress-bar');
  const scanningGuide = document.getElementById('scanning-guide');
  const statusBanner = document.getElementById('status-banner');
  const statusText = document.getElementById('status-text');
  const arControls = document.getElementById('ar-controls');
  const targetAnchor = document.getElementById('target-anchor');
  const arCharacter = document.getElementById('ar-character');

  // Modals & Buttons
  const targetModal = document.getElementById('target-modal');
  const helpModal = document.getElementById('help-modal');
  const btnViewTarget = document.getElementById('btn-view-target');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnHelp = document.getElementById('btn-help');
  const btnCloseHelp = document.getElementById('btn-close-help');
  const btnHelpOk = document.getElementById('btn-help-ok');
  const btnAudio = document.getElementById('btn-audio');
  const btnShare = document.getElementById('btn-action-share');
  const btnGithub = document.getElementById('btn-action-github');
  const btnParty = document.getElementById('btn-action-party');

  const animationChips = document.querySelectorAll('.chip');

  // Audio Context (Synthesizer for reliable zero-latency sound without external audio files)
  let audioEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
  }

  function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (!audioEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playTone error', e);
    }
  }

  function playFoundChime() {
    if (!audioEnabled) return;
    playTone(523.25, 'triangle', 0.12, 0.15); // C5
    setTimeout(() => playTone(659.25, 'triangle', 0.15, 0.18), 100); // E5
    setTimeout(() => playTone(783.99, 'sine', 0.35, 0.2), 200); // G5
  }

  function playClick() {
    playTone(800, 'sine', 0.05, 0.08);
  }

  function playPartyFanfare() {
    if (!audioEnabled) return;
    [440, 554.37, 659.25, 880].forEach((f, idx) => {
      setTimeout(() => playTone(f, 'square', 0.18, 0.12), idx * 80);
    });
  }

  // Audio Toggle
  btnAudio.addEventListener('click', () => {
    initAudio();
    audioEnabled = !audioEnabled;
    btnAudio.innerHTML = audioEnabled 
      ? '<i data-lucide="volume-2"></i>' 
      : '<i data-lucide="volume-x"></i>';
    btnAudio.style.color = audioEnabled ? 'var(--text-main)' : 'var(--accent)';
    if (window.lucide) window.lucide.createIcons();
    if (audioEnabled) playClick();
  });

  // Modal Handlers
  function openModal(modal) {
    playClick();
    modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    playClick();
    modal.classList.add('hidden');
  }

  btnViewTarget.addEventListener('click', () => openModal(targetModal));
  btnCloseModal.addEventListener('click', () => closeModal(targetModal));
  targetModal.addEventListener('click', (e) => {
    if (e.target === targetModal) closeModal(targetModal);
  });

  btnHelp.addEventListener('click', () => openModal(helpModal));
  btnCloseHelp.addEventListener('click', () => closeModal(helpModal));
  btnHelpOk.addEventListener('click', () => closeModal(helpModal));
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) closeModal(helpModal);
  });

  // Animation Switcher
  animationChips.forEach(chip => {
    chip.addEventListener('click', () => {
      playClick();
      animationChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const animName = chip.dataset.anim;
      if (arCharacter) {
        arCharacter.setAttribute('animation-mixer', {
          clip: animName,
          loop: 'repeat',
          crossFadeDuration: 0.4
        });
      }
    });
  });

  // Interactive Quick Action Buttons
  btnParty.addEventListener('click', () => {
    playPartyFanfare();
    triggerConfetti();
  });

  btnGithub.addEventListener('click', () => {
    playClick();
    window.open('https://github.com/akpsaheercp/webar-mindar', '_blank');
  });

  btnShare.addEventListener('click', async () => {
    playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Interactive WebAR Experience',
          text: 'Scan the AR target to explore 3D Augmented Reality right in your browser!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled or failed');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  });

  // MindAR Tracking State Listeners
  let isFirstFound = true;

  if (targetAnchor) {
    targetAnchor.addEventListener('targetFound', () => {
      console.log('MindAR Target Found!');
      playFoundChime();

      if (isFirstFound) {
        triggerConfetti();
        isFirstFound = false;
      }

      // Update UI
      scanningGuide.classList.add('hidden');
      arControls.classList.remove('hidden');
      statusBanner.classList.remove('lost');
      statusBanner.classList.add('found');
      statusText.textContent = 'Target Locked! 🎯';
    });

    targetAnchor.addEventListener('targetLost', () => {
      console.log('MindAR Target Lost!');
      // Update UI
      scanningGuide.classList.remove('hidden');
      arControls.classList.add('hidden');
      statusBanner.classList.remove('found');
      statusBanner.classList.add('lost');
      statusText.textContent = 'Searching for Target Marker...';
    });
  }

  // Scene Loading Management
  const sceneEl = document.querySelector('a-scene');

  function updateLoadingProgress(percent, msg) {
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (loadingStatus) loadingStatus.textContent = msg;
  }

  updateLoadingProgress(40, 'Compiling 3D scene & camera feed...');

  if (sceneEl) {
    sceneEl.addEventListener('loaded', () => {
      updateLoadingProgress(80, 'Camera ready! Starting AR engine...');
      setTimeout(() => {
        updateLoadingProgress(100, 'Ready!');
        setTimeout(() => {
          loadingOverlay.classList.add('hidden');
        }, 500);
      }, 600);
    });

    // Fallback if loaded event fired before script execution
    if (sceneEl.hasLoaded) {
      updateLoadingProgress(100, 'Ready!');
      setTimeout(() => {
        loadingOverlay.classList.add('hidden');
      }, 500);
    }
  }

  // Lightweight Confetti Particle System
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let particles = [];
  let animId = null;

  function resizeCanvas() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function triggerConfetti() {
    if (!ctx) return;
    resizeCanvas();
    const colors = ['#00f2fe', '#4facfe', '#ff007f', '#ffffff', '#fbbf24', '#10b981'];
    
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 150,
        y: canvas.height / 2 + (Math.random() - 0.5) * 150,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 1.2) * 12,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.01
      });
    }

    if (!animId) {
      renderConfetti();
    }
  }

  function renderConfetti() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles = particles.filter(p => p.alpha > 0.01);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.rotation += p.vRot;
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (particles.length > 0) {
      animId = requestAnimationFrame(renderConfetti);
    } else {
      animId = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
});
