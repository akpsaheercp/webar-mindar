/**
 * MindAR Interactive WebAR Application
 * Full 360° 3-Axis Hologram Rotation & Touch Gestures
 */

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
  logDebug('DOM ready. Initializing 360° WebAR...');

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
  const gestureHint = document.getElementById('gesture-hint');
  const statusBanner = document.getElementById('status-banner');
  const statusText = document.getElementById('status-text');
  const arControls = document.getElementById('ar-controls');
  const targetAnchor = document.getElementById('target-anchor');
  const arCharacter = document.getElementById('ar-character');
  const hologramRotator = document.getElementById('hologram-rotator');
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

  // Rotation Control Buttons
  const btnAutoRotate = document.getElementById('btn-auto-rotate');
  const btnResetRotation = document.getElementById('btn-reset-rotation');
  const btnRotX = document.getElementById('btn-rot-x');
  const btnRotY = document.getElementById('btn-rot-y');
  const btnRotZ = document.getElementById('btn-rot-z');

  const animationChips = document.querySelectorAll('.chip');

  // --- 3D Hologram Rotation & Scale State ---
  let rotX = 0; // Pitch
  let rotY = 0; // Yaw
  let rotZ = 0; // Roll
  let currentScale = 1.0;
  let isAutoRotating = true;
  let autoRotateSpeed = 0.6; // degrees per frame

  function updateHologramTransform() {
    if (hologramRotator) {
      hologramRotator.setAttribute('rotation', `${rotX} ${rotY} ${rotZ}`);
      hologramRotator.setAttribute('scale', `${currentScale} ${currentScale} ${currentScale}`);
    }
  }

  // Animation Frame Loop for Smooth 360 Auto-Rotation
  function renderLoop() {
    if (isAutoRotating) {
      rotY = (rotY + autoRotateSpeed) % 360;
      updateHologramTransform();
    }
    requestAnimationFrame(renderLoop);
  }
  renderLoop();

  // Rotation Button Events
  if (btnAutoRotate) {
    btnAutoRotate.addEventListener('click', () => {
      playClick();
      isAutoRotating = !isAutoRotating;
      btnAutoRotate.classList.toggle('active', isAutoRotating);
      btnAutoRotate.innerHTML = isAutoRotating 
        ? '<i data-lucide="pause-circle"></i> <span>Pause Spin</span>' 
        : '<i data-lucide="play-circle"></i> <span>Auto Spin</span>';
      initIcons();
    });
  }

  if (btnResetRotation) {
    btnResetRotation.addEventListener('click', () => {
      playClick();
      rotX = 0;
      rotY = 0;
      rotZ = 0;
      currentScale = 1.0;
      isAutoRotating = false;
      if (btnAutoRotate) {
        btnAutoRotate.classList.remove('active');
        btnAutoRotate.innerHTML = '<i data-lucide="play-circle"></i> <span>Auto Spin</span>';
        initIcons();
      }
      updateHologramTransform();
      logDebug('Hologram rotation reset to 0,0,0');
    });
  }

  if (btnRotX) {
    btnRotX.addEventListener('click', () => {
      playClick();
      isAutoRotating = false;
      if (btnAutoRotate) btnAutoRotate.classList.remove('active');
      rotX = (rotX + 45) % 360;
      updateHologramTransform();
    });
  }

  if (btnRotY) {
    btnRotY.addEventListener('click', () => {
      playClick();
      isAutoRotating = false;
      if (btnAutoRotate) btnAutoRotate.classList.remove('active');
      rotY = (rotY + 45) % 360;
      updateHologramTransform();
    });
  }

  if (btnRotZ) {
    btnRotZ.addEventListener('click', () => {
      playClick();
      isAutoRotating = false;
      if (btnAutoRotate) btnAutoRotate.classList.remove('active');
      rotZ = (rotZ + 45) % 360;
      updateHologramTransform();
    });
  }

  // --- Touch & Mouse 360° Gesture Controller ---
  let isDragging = false;
  let previousTouchX = 0;
  let previousTouchY = 0;
  let initialPinchDistance = 0;
  let initialPinchAngle = 0;

  function getTouchDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchAngle(t1, t2) {
    return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
  }

  // Touch Listeners (Mobile)
  window.addEventListener('touchstart', (e) => {
    // Ignore touch on interactive buttons & modals
    if (e.target.closest('button, .modal-card, .bottom-bar, .top-nav')) return;

    if (e.touches.length === 1) {
      isDragging = true;
      isAutoRotating = false;
      if (btnAutoRotate) btnAutoRotate.classList.remove('active');
      previousTouchX = e.touches[0].clientX;
      previousTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      isAutoRotating = false;
      initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
      initialPinchAngle = getTouchAngle(e.touches[0], e.touches[1]);
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (e.target.closest('button, .modal-card, .bottom-bar, .top-nav')) return;

    if (e.touches.length === 1 && isDragging) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const dx = currentX - previousTouchX;
      const dy = currentY - previousTouchY;

      // 1 Finger: Rotate Yaw (Y axis) and Pitch (X axis)
      rotY += dx * 0.6;
      rotX -= dy * 0.6;
      rotY = (rotY + 360) % 360;
      rotX = Math.max(-180, Math.min(180, rotX)); // clamp pitch
      updateHologramTransform();

      previousTouchX = currentX;
      previousTouchY = currentY;
      e.preventDefault();
    } else if (e.touches.length === 2) {
      // 2 Fingers: Pinch to Scale & Twist to Roll (Z axis)
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const currentAng = getTouchAngle(e.touches[0], e.touches[1]);

      if (initialPinchDistance > 0) {
        const scaleFactor = currentDist / initialPinchDistance;
        currentScale = Math.max(0.4, Math.min(2.5, currentScale * (1 + (scaleFactor - 1) * 0.15)));
        initialPinchDistance = currentDist;
      }

      const dAngle = currentAng - initialPinchAngle;
      rotZ = (rotZ + dAngle * 0.8) % 360;
      initialPinchAngle = currentAng;

      updateHologramTransform();
      e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    isDragging = false;
    initialPinchDistance = 0;
  });

  // Mouse Listeners (Desktop)
  window.addEventListener('mousedown', (e) => {
    if (e.target.closest('button, .modal-card, .bottom-bar, .top-nav')) return;
    isDragging = true;
    isAutoRotating = false;
    if (btnAutoRotate) btnAutoRotate.classList.remove('active');
    previousTouchX = e.clientX;
    previousTouchY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - previousTouchX;
    const dy = e.clientY - previousTouchY;

    if (e.shiftKey || e.buttons === 2) {
      // Shift + Drag: Roll (Z axis)
      rotZ = (rotZ + dx * 0.6) % 360;
    } else {
      // Standard Drag: Rotate X & Y
      rotY = (rotY + dx * 0.6) % 360;
      rotX = Math.max(-180, Math.min(180, rotX - dy * 0.6));
    }

    updateHologramTransform();
    previousTouchX = e.clientX;
    previousTouchY = e.clientY;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  // Mouse Wheel: Zoom
  window.addEventListener('wheel', (e) => {
    if (e.target.closest('.modal-card')) return;
    currentScale = Math.max(0.4, Math.min(2.5, currentScale - e.deltaY * 0.001));
    updateHologramTransform();
  }, { passive: true });

  // --- Audio Synthesizer ---
  let audioEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (!audioEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
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
  if (targetModal) targetModal.addEventListener('click', (e) => { if (e.target === targetModal) closeModal(targetModal); });

  if (btnHelp) btnHelp.addEventListener('click', () => openModal(helpModal));
  if (btnCloseHelp) btnCloseHelp.addEventListener('click', () => closeModal(helpModal));
  if (btnHelpOk) btnHelpOk.addEventListener('click', () => closeModal(helpModal));
  if (helpModal) helpModal.addEventListener('click', (e) => { if (e.target === helpModal) closeModal(helpModal); });

  if (btnDebug) btnDebug.addEventListener('click', () => openModal(debugModal));
  if (btnCloseDebug) btnCloseDebug.addEventListener('click', () => closeModal(debugModal));
  if (debugModal) debugModal.addEventListener('click', (e) => { if (e.target === debugModal) closeModal(debugModal); });

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
      if (gestureHint) gestureHint.classList.remove('hidden');
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
      if (gestureHint) gestureHint.classList.add('hidden');
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

  function ensureTransparentRenderer() {
    if (sceneEl && sceneEl.renderer) {
      sceneEl.renderer.setClearColor(0x000000, 0);
    }
  }

  function fixAndroidVideoFeed() {
    ensureTransparentRenderer();
    const video = document.querySelector('video');
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    }

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

    if (!isNaN(targetW) && targetW > 0 && !isNaN(targetH) && targetH > 0) {
      video.style.width = `${Math.round(targetW)}px`;
      video.style.height = `${Math.round(targetH)}px`;
      video.style.top = `${Math.round(targetTop)}px`;
      video.style.left = `${Math.round(targetLeft)}px`;
    } else {
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

  if (sceneEl) {
    sceneEl.addEventListener('arReady', () => {
      logDebug('MindAR arReady fired!');
      fixAndroidVideoFeed();
      dismissLoadingOverlay();
    });

    sceneEl.addEventListener('renderstart', () => {
      fixAndroidVideoFeed();
      setTimeout(dismissLoadingOverlay, 300);
    });

    sceneEl.addEventListener('loaded', () => {
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

  const monitorInterval = setInterval(fixAndroidVideoFeed, 400);
  setTimeout(() => clearInterval(monitorInterval), 6000);

  setTimeout(dismissLoadingOverlay, 1500);

  // Confetti Particle System
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

    if (!animId) renderConfetti();
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
