/**
 * MindAR Interactive WebAR Application
 * Enhanced Android Video Stream Handling & On-Screen Diagnostics
 */

// Safe Log Buffer for On-Screen Debugging
const debugLogs = [];
function logDebug(msg) {
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  const logStr = `[${time}] ${msg}`;
  debugLogs.push(logStr);
  console.log(logStr);
  const debugContent = document.getElementById('debug-log-content');
  if (debugContent) {
    debugContent.textContent = debugLogs.slice(-15).join('\n');
  }
}

// Initialize Lucide Icons Safely
function initIcons() {
  try {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  } catch (e) {
    console.warn('Lucide icons warning:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  logDebug('DOM loaded. Initializing WebAR...');

  // DOM Elements
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingStatus = document.getElementById('loading-status');
  const progressBar = document.getElementById('progress-bar');
  const progressContainer = document.getElementById('progress-container');
  const btnEnterAR = document.getElementById('btn-enter-ar');
  const cameraErrorBox = document.getElementById('camera-error-box');
  const cameraErrorText = document.getElementById('camera-error-text');
  const btnRetryCamera = document.getElementById('btn-retry-camera');

  const scanningGuide = document.getElementById('scanning-guide');
  const statusBanner = document.getElementById('status-banner');
  const statusText = document.getElementById('status-text');
  const arControls = document.getElementById('ar-controls');
  const targetAnchor = document.getElementById('target-anchor');
  const arCharacter = document.getElementById('ar-character');
  const sceneEl = document.querySelector('a-scene');

  // Modals & Action Buttons
  const targetModal = document.getElementById('target-modal');
  const helpModal = document.getElementById('help-modal');
  const debugModal = document.getElementById('debug-modal');
  const btnViewTarget = document.getElementById('btn-view-target');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnHelp = document.getElementById('btn-help');
  const btnCloseHelp = document.getElementById('btn-close-help');
  const btnHelpOk = document.getElementById('btn-help-ok');
  const btnDebug = document.getElementById('btn-debug');
  const btnCloseDebug = document.getElementById('btn-close-debug');
  const btnAudio = document.getElementById('btn-audio');
  const btnShare = document.getElementById('btn-action-share');
  const btnGithub = document.getElementById('btn-action-github');
  const btnParty = document.getElementById('btn-action-party');

  const animationChips = document.querySelectorAll('.chip');

  // Audio Context (Synthesizer)
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
    playTone(523.25, 'triangle', 0.12, 0.15);
    setTimeout(() => playTone(659.25, 'triangle', 0.15, 0.18), 100);
    setTimeout(() => playTone(783.99, 'sine', 0.35, 0.2), 200);
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
  if (btnAudio) {
    btnAudio.addEventListener('click', () => {
      initAudio();
      audioEnabled = !audioEnabled;
      btnAudio.innerHTML = audioEnabled 
        ? '<i data-lucide="volume-2"></i>' 
        : '<i data-lucide="volume-x"></i>';
      btnAudio.style.color = audioEnabled ? 'var(--text-main)' : 'var(--accent)';
      initIcons();
      if (audioEnabled) playClick();
    });
  }

  // Modal Handlers
  function openModal(modal) {
    playClick();
    if (modal) modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    playClick();
    if (modal) modal.classList.add('hidden');
  }

  if (btnViewTarget) btnViewTarget.addEventListener('click', () => openModal(targetModal));
  if (btnCloseModal) btnCloseModal.addEventListener('click', () => closeModal(targetModal));
  if (targetModal) {
    targetModal.addEventListener('click', (e) => {
      if (e.target === targetModal) closeModal(targetModal);
    });
  }

  if (btnHelp) btnHelp.addEventListener('click', () => openModal(helpModal));
  if (btnCloseHelp) btnCloseHelp.addEventListener('click', () => closeModal(helpModal));
  if (btnHelpOk) btnHelpOk.addEventListener('click', () => closeModal(helpModal));
  if (helpModal) {
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) closeModal(helpModal);
    });
  }

  if (btnDebug) btnDebug.addEventListener('click', () => openModal(debugModal));
  if (btnCloseDebug) btnCloseDebug.addEventListener('click', () => closeModal(debugModal));
  if (debugModal) {
    debugModal.addEventListener('click', (e) => {
      if (e.target === debugModal) closeModal(debugModal);
    });
  }

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

  // Quick Action Buttons
  if (btnParty) {
    btnParty.addEventListener('click', () => {
      playPartyFanfare();
      triggerConfetti();
    });
  }

  if (btnGithub) {
    btnGithub.addEventListener('click', () => {
      playClick();
      window.open('https://github.com/akpsaheercp/webar-mindar', '_blank');
    });
  }

  if (btnShare) {
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
          console.log('Share canceled');
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    });
  }

  // MindAR Tracking State Listeners
  let isFirstFound = true;

  if (targetAnchor) {
    targetAnchor.addEventListener('targetFound', () => {
      logDebug('🎯 Target Found!');
      playFoundChime();

      if (isFirstFound) {
        triggerConfetti();
        isFirstFound = false;
      }

      if (scanningGuide) scanningGuide.classList.add('hidden');
      if (arControls) arControls.classList.remove('hidden');
      if (statusBanner) {
        statusBanner.classList.remove('lost');
        statusBanner.classList.add('found');
      }
      if (statusText) statusText.textContent = 'Target Locked! 🎯';
    });

    targetAnchor.addEventListener('targetLost', () => {
      logDebug('Target Lost');
      if (scanningGuide) scanningGuide.classList.remove('hidden');
      if (arControls) arControls.classList.add('hidden');
      if (statusBanner) {
        statusBanner.classList.remove('found');
        statusBanner.classList.add('lost');
      }
      if (statusText) statusText.textContent = 'Searching for Target Marker...';
    });
  }

  // Camera & Loading Overlay Dismissal
  function dismissLoadingOverlay() {
    if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
      if (progressBar) progressBar.style.width = '100%';
      loadingOverlay.classList.add('hidden');
    }
  }

  if (btnEnterAR) {
    btnEnterAR.addEventListener('click', () => {
      initAudio();
      playClick();
      dismissLoadingOverlay();
      fixAndroidVideoFeed();
    });
  }

  if (btnRetryCamera) {
    btnRetryCamera.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Ensure WebGL Transparency
  function ensureTransparentRenderer() {
    if (sceneEl && sceneEl.renderer) {
      sceneEl.renderer.setClearColor(0x000000, 0);
    }
  }

  // Robust Android Video Stream Fixer
  function fixAndroidVideoFeed() {
    ensureTransparentRenderer();
    const video = document.querySelector('video');
    if (!video) {
      logDebug('Waiting for video element...');
      return;
    }

    logDebug(`Video state: ${video.videoWidth}x${video.videoHeight}, paused: ${video.paused}`);

    // If video has not started playing, trigger play
    if (video.paused) {
      video.play().then(() => {
        logDebug('video.play() succeeded');
      }).catch(err => {
        logDebug(`video.play() warning: ${err.message}`);
      });
    }

    // Force Android viewport dimensions if NaN or 0
    const w = window.innerWidth;
    const h = window.innerHeight;
    const videoAspect = (video.videoWidth && video.videoHeight) ? (video.videoWidth / video.videoHeight) : (w / h);
    const screenAspect = w / h;

    let targetW, targetH, targetTop, targetLeft;
    if (videoAspect > screenAspect) {
      targetH = h;
      targetW = h * videoAspect;
      targetTop = 0;
      targetLeft = -(targetW - w) / 2;
    } else {
      targetW = w;
      targetH = w / videoAspect;
      targetLeft = 0;
      targetTop = -(targetH - h) / 2;
    }

    // Ensure valid non-NaN pixel values
    if (!isNaN(targetW) && targetW > 0 && !isNaN(targetH) && targetH > 0) {
      video.style.width = `${Math.round(targetW)}px`;
      video.style.height = `${Math.round(targetH)}px`;
      video.style.top = `${Math.round(targetTop)}px`;
      video.style.left = `${Math.round(targetLeft)}px`;
    } else {
      // Fallback fullscreen cover
      video.style.width = '100vw';
      video.style.height = '100vh';
      video.style.objectFit = 'cover';
      video.style.top = '0px';
      video.style.left = '0px';
    }

    video.style.position = 'absolute';
    video.style.zIndex = '-2';
    video.style.display = 'block';
    video.style.visibility = 'visible';
    video.style.opacity = '1';
  }

  // Hook into A-Frame and MindAR Lifecycle
  if (sceneEl) {
    sceneEl.addEventListener('arReady', () => {
      logDebug('MindAR arReady event fired!');
      fixAndroidVideoFeed();
      dismissLoadingOverlay();
    });

    sceneEl.addEventListener('renderstart', () => {
      logDebug('A-Frame renderstart event fired');
      fixAndroidVideoFeed();
      setTimeout(dismissLoadingOverlay, 300);
    });

    sceneEl.addEventListener('loaded', () => {
      logDebug('A-Frame loaded event fired');
      fixAndroidVideoFeed();
      setTimeout(dismissLoadingOverlay, 500);
    });

    sceneEl.addEventListener('arError', (event) => {
      logDebug(`arError: ${JSON.stringify(event.detail || event)}`);
      if (cameraErrorBox) cameraErrorBox.classList.remove('hidden');
      if (btnEnterAR) btnEnterAR.classList.add('hidden');
      if (progressContainer) progressContainer.classList.add('hidden');
    });
  }

  // Watch video feed continuously during initial 6 seconds
  const monitorInterval = setInterval(fixAndroidVideoFeed, 400);
  setTimeout(() => clearInterval(monitorInterval), 6000);

  // Safety timeout: Dismiss loading overlay after 1.5 seconds
  setTimeout(dismissLoadingOverlay, 1500);

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
  window.addEventListener('resize', () => {
    resizeCanvas();
    fixAndroidVideoFeed();
  });
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
      p.vy += 0.25;
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
