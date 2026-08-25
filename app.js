/**
 * Meeladunnabi Mubarak & Rabee-ul-Awwal WebAR Experience
 * 3D Hologram, "Fit to Screen" Mode & 360° Touch Controls
 */

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

  // DOM Elements
  const loadingOverlay = document.getElementById('loading-overlay');
  const progressBar = document.getElementById('progress-bar');
  const btnEnterAR = document.getElementById('btn-enter-ar');
  const cameraErrorBox = document.getElementById('camera-error-box');
  const btnRetryCamera = document.getElementById('btn-retry-camera');

  const scanningGuide = document.getElementById('scanning-guide');
  const gestureHint = document.getElementById('gesture-hint');
  const gestureHintText = document.getElementById('gesture-hint-text');
  const statusBanner = document.getElementById('status-banner');
  const statusText = document.getElementById('status-text');
  const arControls = document.getElementById('ar-controls');
  const targetAnchor = document.getElementById('target-anchor');
  const arCamera = document.getElementById('ar-camera');
  const hologramRotator = document.getElementById('hologram-rotator');
  const sceneEl = document.querySelector('a-scene');

  // Fit Mode Buttons
  const btnFitMode = document.getElementById('btn-fit-mode');
  const btnFitText = document.getElementById('btn-fit-text');
  const btnFitToggle = document.getElementById('btn-fit-toggle');
  const btnFitBottomText = document.getElementById('btn-fit-bottom-text');

  // Hologram 3D Groups
  const baseGroup = document.getElementById('hologram-base');
  const mosqueGroup = document.getElementById('mosque-structure');
  const crescentGroup = document.getElementById('crescent-star-group');
  const lanternLeft = document.getElementById('lantern-left');
  const lanternRight = document.getElementById('lantern-right');
  const sparkleRing = document.getElementById('celebration-sparkle-ring');

  // Modals & Action Buttons
  const targetModal = document.getElementById('target-modal');
  const helpModal = document.getElementById('help-modal');
  const btnViewTarget = document.getElementById('btn-view-target');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnHelp = document.getElementById('btn-help');
  const btnCloseHelp = document.getElementById('btn-close-help');
  const btnHelpOk = document.getElementById('btn-help-ok');
  const btnAudio = document.getElementById('btn-audio');
  const btnLighting = document.getElementById('btn-lighting');
  const btnShare = document.getElementById('btn-action-share');
  const btnGithub = document.getElementById('btn-action-github');
  const btnParty = document.getElementById('btn-action-party');
  const btnReplayBuild = document.getElementById('btn-replay-build');

  // Rotation Controls
  const btnAutoRotate = document.getElementById('btn-auto-rotate');
  const btnResetRotation = document.getElementById('btn-reset-rotation');
  const btnRotX = document.getElementById('btn-rot-x');
  const btnRotY = document.getElementById('btn-rot-y');
  const btnRotZ = document.getElementById('btn-rot-z');

  const highlightChips = document.querySelectorAll('.chip');

  // --- Spiritual Celebration Chimes Audio Synthesizer ---
  let audioEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.25, gainVal = 0.12) {
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

  function playHologramChime() {
    if (!audioEnabled) return;
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    notes.forEach((f, idx) => {
      setTimeout(() => playTone(f, 'sine', 0.4, 0.15), idx * 120);
    });
  }

  function playCelebrationFanfare() {
    if (!audioEnabled) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((f, idx) => {
      setTimeout(() => playTone(f, idx % 2 === 0 ? 'sine' : 'triangle', 0.45, 0.18), idx * 100);
    });
  }

  function playClick() {
    playTone(880, 'sine', 0.05, 0.08);
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

  // Night Mode & Lantern Lighting Toggle
  let isNightMode = false;
  const sunLight = document.getElementById('sun-light');
  const accentLight = document.getElementById('accent-light');
  const warmLight = document.getElementById('warm-light');

  if (btnLighting) {
    btnLighting.addEventListener('click', () => {
      playClick();
      isNightMode = !isNightMode;
      btnLighting.innerHTML = isNightMode 
        ? '<i data-lucide="sun"></i>' 
        : '<i data-lucide="moon"></i>';
      btnLighting.style.color = isNightMode ? '#fbbf24' : 'var(--text-main)';
      initIcons();

      if (sunLight) sunLight.setAttribute('intensity', isNightMode ? '0.5' : '2.2');
      if (accentLight) accentLight.setAttribute('intensity', isNightMode ? '2.5' : '1.4');
      if (warmLight) warmLight.setAttribute('intensity', isNightMode ? '3.0' : '1.2');
    });
  }

  // --- 360° 3-Axis Hologram Rotation & Transform State ---
  let rotX = 90;
  let rotY = 0;
  let rotZ = 0;
  let currentScale = 0.5;
  let isAutoRotating = true;
  let autoRotateSpeed = 0.45;
  let frameCount = 0;

  function updateHologramTransform() {
    if (hologramRotator) {
      hologramRotator.setAttribute('rotation', `${rotX} ${rotY} ${rotZ}`);
      hologramRotator.setAttribute('scale', `${currentScale} ${currentScale} ${currentScale}`);
    }
  }

  // --- FIT TO SCREEN MODE CONTROLLER ---
  let isFitMode = false;

  function toggleFitMode() {
    playClick();
    if (!hologramRotator || !targetAnchor || !arCamera) return;

    isFitMode = !isFitMode;

    if (isFitMode) {
      // 1. Move hologram from targetAnchor to arCamera (Screen Space HUD View)
      arCamera.appendChild(hologramRotator);
      hologramRotator.setAttribute('position', '0 -0.05 -1.75');
      
      rotX = 0; // Front facing in screen space
      rotY = 0;
      rotZ = 0;
      currentScale = 0.55;
      updateHologramTransform();

      // 2. Update UI
      if (btnFitMode) btnFitMode.classList.add('active-fit');
      if (btnFitText) btnFitText.textContent = 'Anchor';
      if (btnFitToggle) {
        btnFitToggle.classList.add('active-fit');
        btnFitToggle.innerHTML = '<i data-lucide="minimize-2"></i> <span>Anchor Card</span>';
      }
      if (btnFitBottomText) btnFitBottomText.textContent = 'Anchor Card';

      if (scanningGuide) scanningGuide.classList.add('hidden');
      if (gestureHint) gestureHint.classList.remove('hidden');
      if (gestureHintText) gestureHintText.textContent = '📱 Fit Mode Active — Centered on screen • Drag to rotate 360°';
      if (arControls) arControls.classList.remove('hidden');
      
      if (statusBanner) {
        statusBanner.classList.remove('lost');
        statusBanner.classList.add('found');
      }
      if (statusText) statusText.textContent = 'Fit to Screen View Active 📱✨';

      playHologramChime();
      initIcons();
    } else {
      // 1. Return hologram back to targetAnchor (Card Anchor View)
      targetAnchor.appendChild(hologramRotator);
      hologramRotator.setAttribute('position', '0 0 0');
      
      rotX = 90; // Standard card perpendicular
      rotY = 0;
      rotZ = 0;
      currentScale = 0.5;
      updateHologramTransform();

      // 2. Update UI
      if (btnFitMode) btnFitMode.classList.remove('active-fit');
      if (btnFitText) btnFitText.textContent = 'Fit';
      if (btnFitToggle) {
        btnFitToggle.classList.remove('active-fit');
        btnFitToggle.innerHTML = '<i data-lucide="maximize"></i> <span>Fit to Screen</span>';
      }
      if (btnFitBottomText) btnFitBottomText.textContent = 'Fit to Screen';

      if (gestureHintText) gestureHintText.textContent = '👆 Drag to rotate 360° • 🤏 Pinch to scale • Tap "Fit" to center on screen';
      
      // Update tracking banner
      if (statusBanner) {
        statusBanner.classList.remove('found');
        statusBanner.classList.add('lost');
      }
      if (statusText) statusText.textContent = 'Searching for Darusuffa Card...';
      if (scanningGuide) scanningGuide.classList.remove('hidden');

      initIcons();
    }
  }

  if (btnFitMode) btnFitMode.addEventListener('click', toggleFitMode);
  if (btnFitToggle) btnFitToggle.addEventListener('click', toggleFitMode);

  // --- Dynamic Hologram Materialization Animation ---
  let animInProgress = false;

  async function animateHologramAppearance() {
    if (animInProgress || !hologramRotator) return;
    animInProgress = true;

    playHologramChime();
    triggerConfetti();

    hologramRotator.setAttribute('scale', '0.01 0.01 0.01');
    let s = 0.01;
    const maxS = isFitMode ? 0.55 : 0.5;
    const growInt = setInterval(() => {
      s += 0.04;
      if (s >= maxS) {
        s = maxS;
        clearInterval(growInt);
        animInProgress = false;
      }
      hologramRotator.setAttribute('scale', `${s} ${s} ${s}`);
    }, 25);
  }

  if (btnReplayBuild) {
    btnReplayBuild.addEventListener('click', () => {
      playClick();
      animateHologramAppearance();
    });
  }

  // Highlight Filter Chips
  highlightChips.forEach(chip => {
    chip.addEventListener('click', () => {
      playClick();
      highlightChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const target = chip.dataset.highlight;
      if (target === 'all') {
        if (baseGroup) baseGroup.setAttribute('visible', true);
        if (mosqueGroup) mosqueGroup.setAttribute('visible', true);
        if (crescentGroup) crescentGroup.setAttribute('visible', true);
        if (lanternLeft) lanternLeft.setAttribute('visible', true);
        if (lanternRight) lanternRight.setAttribute('visible', true);
      } else if (target === 'crescent') {
        if (baseGroup) baseGroup.setAttribute('visible', true);
        if (mosqueGroup) mosqueGroup.setAttribute('visible', false);
        if (crescentGroup) crescentGroup.setAttribute('visible', true);
        if (lanternLeft) lanternLeft.setAttribute('visible', false);
        if (lanternRight) lanternRight.setAttribute('visible', false);
      } else if (target === 'dome') {
        if (baseGroup) baseGroup.setAttribute('visible', true);
        if (mosqueGroup) mosqueGroup.setAttribute('visible', true);
        if (crescentGroup) crescentGroup.setAttribute('visible', false);
        if (lanternLeft) lanternLeft.setAttribute('visible', false);
        if (lanternRight) lanternRight.setAttribute('visible', false);
      } else if (target === 'lanterns') {
        if (baseGroup) baseGroup.setAttribute('visible', true);
        if (mosqueGroup) mosqueGroup.setAttribute('visible', false);
        if (crescentGroup) crescentGroup.setAttribute('visible', false);
        if (lanternLeft) lanternLeft.setAttribute('visible', true);
        if (lanternRight) lanternRight.setAttribute('visible', true);
      }
    });
  });

  // Animation Loop (Turntable Rotation & Lantern Swaying)
  function renderLoop() {
    frameCount++;
    if (isAutoRotating) {
      rotY = (rotY + autoRotateSpeed) % 360;
      updateHologramTransform();
    }

    const sway = Math.sin(frameCount * 0.04) * 8;
    if (lanternLeft) lanternLeft.setAttribute('rotation', `0 0 ${sway}`);
    if (lanternRight) lanternRight.setAttribute('rotation', `0 0 ${-sway}`);

    if (sparkleRing) {
      const ringScale = 1 + Math.sin(frameCount * 0.05) * 0.06;
      sparkleRing.setAttribute('scale', `${ringScale} ${ringScale} 1`);
    }

    requestAnimationFrame(renderLoop);
  }
  renderLoop();

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
      rotX = isFitMode ? 0 : 90;
      rotY = 0;
      rotZ = 0;
      currentScale = isFitMode ? 0.55 : 0.5;
      isAutoRotating = false;
      if (btnAutoRotate) {
        btnAutoRotate.classList.remove('active');
        btnAutoRotate.innerHTML = '<i data-lucide="play-circle"></i> <span>Auto Spin</span>';
        initIcons();
      }
      updateHologramTransform();
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

  // Touch Gesture Listeners (Drag X/Y, Twist Z, Pinch Scale)
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

  window.addEventListener('touchstart', (e) => {
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

      rotY += dx * 0.6;
      rotX -= dy * 0.6;
      rotY = (rotY + 360) % 360;
      updateHologramTransform();

      previousTouchX = currentX;
      previousTouchY = currentY;
      e.preventDefault();
    } else if (e.touches.length === 2) {
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const currentAng = getTouchAngle(e.touches[0], e.touches[1]);

      if (initialPinchDistance > 0) {
        const scaleFactor = currentDist / initialPinchDistance;
        currentScale = Math.max(0.2, Math.min(1.5, currentScale * (1 + (scaleFactor - 1) * 0.15)));
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

  // Mouse Listeners
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
      rotZ = (rotZ + dx * 0.6) % 360;
    } else {
      rotY = (rotY + dx * 0.6) % 360;
      rotX -= dy * 0.6;
    }

    updateHologramTransform();
    previousTouchX = e.clientX;
    previousTouchY = e.clientY;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  window.addEventListener('wheel', (e) => {
    if (e.target.closest('.modal-card')) return;
    currentScale = Math.max(0.2, Math.min(1.5, currentScale - e.deltaY * 0.001));
    updateHologramTransform();
  }, { passive: true });

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

  // Quick Action Buttons
  if (btnParty) {
    btnParty.addEventListener('click', () => {
      playCelebrationFanfare();
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
            title: 'Meeladunnabi Mubarak | Rabee-ul-Awwal WebAR',
            text: 'Experience the 3D Meeladunnabi celebration hologram in Augmented Reality!',
            url: window.location.href,
          });
        } catch (err) {}
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    });
  }

  // --- MindAR Target Tracking Listeners ---
  let isFirstFound = true;

  if (targetAnchor) {
    targetAnchor.addEventListener('targetFound', () => {
      if (isFitMode) return; // In Fit mode, keep screen-space HUD view

      console.log('🌙 Meeladunnabi Target Found!');

      if (isFirstFound) {
        animateHologramAppearance();
        isFirstFound = false;
      }

      if (scanningGuide) scanningGuide.classList.add('hidden');
      if (gestureHint) gestureHint.classList.remove('hidden');
      if (arControls) arControls.classList.remove('hidden');
      if (statusBanner) {
        statusBanner.classList.remove('lost');
        statusBanner.classList.add('found');
      }
      if (statusText) statusText.textContent = 'Meeladunnabi Hologram Active! 🌙✨';
    });

    targetAnchor.addEventListener('targetLost', () => {
      if (isFitMode) return; // In Fit mode, do not hide the hologram!

      console.log('Target Lost');
      if (scanningGuide) scanningGuide.classList.remove('hidden');
      if (gestureHint) gestureHint.classList.add('hidden');
      if (arControls) arControls.classList.add('hidden');
      if (statusBanner) {
        statusBanner.classList.remove('found');
        statusBanner.classList.add('lost');
      }
      if (statusText) statusText.textContent = 'Searching for Darusuffa Card...';
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
    }

    video.style.position = 'absolute';
    video.style.zIndex = '-2';
    video.style.display = 'block';
    video.style.visibility = 'visible';
    video.style.opacity = '1';
  }

  if (sceneEl) {
    sceneEl.addEventListener('arReady', () => {
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

    sceneEl.addEventListener('arError', () => {
      if (cameraErrorBox) cameraErrorBox.classList.remove('hidden');
      if (btnEnterAR) btnEnterAR.classList.add('hidden');
    });
  }

  const monitorInterval = setInterval(fixAndroidVideoFeed, 400);
  setTimeout(() => clearInterval(monitorInterval), 6000);
  setTimeout(dismissLoadingOverlay, 1500);

  // Confetti Particle System (Golden Starburst & Emerald Petals)
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
    const colors = ['#fbbf24', '#f59e0b', '#10b981', '#059669', '#22c55e', '#f43f5e', '#38bdf8', '#fef08a'];
    
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 160,
        y: canvas.height / 2 + (Math.random() - 0.5) * 160,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 1.2) * 14,
        size: Math.random() * 9 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.01,
        isStar: Math.random() > 0.5
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
      p.vy += 0.22;
      p.rotation += p.vRot;
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.isStar) {
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.3, -p.size * 0.3);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(p.size * 0.3, p.size * 0.3);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.3, p.size * 0.3);
        ctx.lineTo(-p.size, 0);
        ctx.lineTo(-p.size * 0.3, -p.size * 0.3);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }

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
