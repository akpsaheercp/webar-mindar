/**
 * MindAR 3D Architectural WebAR
 * Dynamic Construction Animation, QR Base Anchoring & 360° Controls
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
  const statusBanner = document.getElementById('status-banner');
  const statusText = document.getElementById('status-text');
  const arControls = document.getElementById('ar-controls');
  const targetAnchor = document.getElementById('target-anchor');
  const hologramRotator = document.getElementById('hologram-rotator');
  const sceneEl = document.querySelector('a-scene');

  // Building Tier Elements
  const tiers = {
    foundation: document.getElementById('building-foundation'),
    ground: document.getElementById('floor-ground'),
    floor1: document.getElementById('floor-1'),
    floor2: document.getElementById('floor-2'),
    floor3: document.getElementById('floor-3'),
    rooftop: document.getElementById('floor-rooftop')
  };
  const constructionLaser = document.getElementById('construction-laser');
  const infoText = document.getElementById('ar-info-text');

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

  const floorChips = document.querySelectorAll('.chip');

  // --- Audio Synthesizer for Construction SFX ---
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

  function playFoundationSound() {
    playTone(180, 'triangle', 0.4, 0.2);
    setTimeout(() => playTone(240, 'sine', 0.3, 0.15), 150);
  }

  function playFloorConstructSound(tierIndex) {
    const freqs = [330, 440, 550, 660, 880];
    const f = freqs[tierIndex % freqs.length];
    playTone(f, 'sine', 0.25, 0.15);
    setTimeout(() => playTone(f * 1.25, 'triangle', 0.2, 0.12), 100);
  }

  function playCompleteFanfare() {
    if (!audioEnabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => playTone(f, 'square', 0.2, 0.12), idx * 90);
    });
  }

  function playClick() {
    playTone(800, 'sine', 0.05, 0.08);
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

  // Day/Night Lighting Mode
  let isNightMode = false;
  const sunLight = document.getElementById('sun-light');
  const accentLight = document.getElementById('accent-light');
  const warmLight = document.getElementById('warm-light');

  if (btnLighting) {
    btnLighting.addEventListener('click', () => {
      playClick();
      isNightMode = !isNightMode;
      btnLighting.innerHTML = isNightMode 
        ? '<i data-lucide="moon"></i>' 
        : '<i data-lucide="sun"></i>';
      btnLighting.style.color = isNightMode ? '#fbbf24' : 'var(--text-main)';
      initIcons();

      if (sunLight) sunLight.setAttribute('intensity', isNightMode ? '0.4' : '2.0');
      if (accentLight) accentLight.setAttribute('intensity', isNightMode ? '2.2' : '1.2');
      if (warmLight) warmLight.setAttribute('intensity', isNightMode ? '2.5' : '1.0');
    });
  }

  // --- Dynamic Building Construction Animation ---
  let constructionInProgress = false;

  function setTierVisibility(visibleTiers) {
    Object.keys(tiers).forEach(key => {
      if (tiers[key]) {
        const isVis = visibleTiers === 'all' || visibleTiers.includes(key);
        tiers[key].setAttribute('visible', isVis);
      }
    });
  }

  async function playConstructionSequence() {
    if (constructionInProgress) return;
    constructionInProgress = true;

    // Reset all tiers to hidden except foundation
    Object.values(tiers).forEach(t => t && t.setAttribute('visible', false));
    if (constructionLaser) constructionLaser.setAttribute('visible', true);

    // Stage 0: Foundation
    if (tiers.foundation) {
      tiers.foundation.setAttribute('visible', true);
      tiers.foundation.setAttribute('scale', '0.01 0.01 0.01');
      if (infoText) infoText.setAttribute('value', 'FOUNDATION STAGE\nConcrete Excavation & Ground Grid');
      playFoundationSound();

      // Animate scale up
      let s = 0.01;
      const fInterval = setInterval(() => {
        s += 0.1;
        if (s >= 1) {
          s = 1;
          clearInterval(fInterval);
        }
        tiers.foundation.setAttribute('scale', `${s} ${s} ${s}`);
      }, 30);
    }

    await new Promise(r => setTimeout(r, 600));

    // Array of upper tiers with target Y positions
    const sequence = [
      { key: 'ground', label: 'GROUND FLOOR & LOBBY\nColumns & Entrance Foyer', y: 0, laserY: 0.1 },
      { key: 'floor1', label: 'FLOOR 1 APARTMENTS\nLiving Suites & Glass Balconies', y: 0.22, laserY: 0.32 },
      { key: 'floor2', label: 'FLOOR 2 RESIDENCES\nArchitectural Facade & Lighting', y: 0.43, laserY: 0.53 },
      { key: 'floor3', label: 'FLOOR 3 PENTHOUSE\nPanoramic Corner Luxury Suites', y: 0.64, laserY: 0.74 },
      { key: 'rooftop', label: 'ROOFTOP TERRACE\nInfinity Pool, Pergola & Garden', y: 0.83, laserY: 0.95 }
    ];

    for (let i = 0; i < sequence.length; i++) {
      const step = sequence[i];
      const tierEl = tiers[step.key];
      if (tierEl) {
        if (infoText) infoText.setAttribute('value', step.label);
        playFloorConstructSound(i);

        // Move laser scanline
        if (constructionLaser) {
          constructionLaser.setAttribute('position', `0 ${step.laserY} 0`);
        }

        // Animate tier descending/rising smoothly
        tierEl.setAttribute('visible', true);
        tierEl.setAttribute('position', `0 ${step.y + 0.3} 0`);
        tierEl.setAttribute('scale', '0.7 0.7 0.7');

        let progress = 0;
        await new Promise(done => {
          const animInt = setInterval(() => {
            progress += 0.12;
            if (progress >= 1) {
              progress = 1;
              clearInterval(animInt);
              done();
            }
            const currentY = (step.y + 0.3) - (0.3 * progress);
            const currentS = 0.7 + 0.3 * progress;
            tierEl.setAttribute('position', `0 ${currentY} 0`);
            tierEl.setAttribute('scale', `${currentS} ${currentS} ${currentS}`);
          }, 25);
        });

        await new Promise(r => setTimeout(r, 250));
      }
    }

    // Construction Complete!
    if (constructionLaser) constructionLaser.setAttribute('visible', false);
    if (infoText) infoText.setAttribute('value', 'APARTMENT BUILDING COMPLETE\nModern Residency Luxury Tower');
    playCompleteFanfare();
    triggerConfetti();
    constructionInProgress = false;
  }

  if (btnReplayBuild) {
    btnReplayBuild.addEventListener('click', () => {
      playClick();
      playConstructionSequence();
    });
  }

  // Floor Isolation Filter Chips
  floorChips.forEach(chip => {
    chip.addEventListener('click', () => {
      playClick();
      floorChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const floor = chip.dataset.floor;
      if (floor === 'all') {
        setTierVisibility('all');
        if (infoText) infoText.setAttribute('value', 'FULL TOWER VIEW\nModern Residency');
      } else {
        setTierVisibility([floor, 'foundation']);
        if (infoText) infoText.setAttribute('value', `EXPLORING: ${floor.toUpperCase()}\nIsolated Level View`);
      }
    });
  });

  // --- 360° 3-Axis Hologram Rotation & Scale Controller ---
  let rotX = 90; // Default flat facing
  let rotY = 0;
  let rotZ = 0;
  let currentScale = 1.0;
  let isAutoRotating = true;
  let autoRotateSpeed = 0.5;

  function updateHologramTransform() {
    if (hologramRotator) {
      hologramRotator.setAttribute('rotation', `${rotX} ${rotY} ${rotZ}`);
      hologramRotator.setAttribute('scale', `${currentScale} ${currentScale} ${currentScale}`);
    }
  }

  function renderLoop() {
    if (isAutoRotating) {
      rotY = (rotY + autoRotateSpeed) % 360;
      updateHologramTransform();
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
      rotX = 90;
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
    currentScale = Math.max(0.4, Math.min(2.5, currentScale - e.deltaY * 0.001));
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
      playCompleteFanfare();
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
            title: '3D Architectural AR Apartment Experience',
            text: 'Scan the QR foundation base to build a modern luxury flat in Augmented Reality!',
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
      console.log('🏗️ QR Foundation Target Found!');

      if (isFirstFound) {
        playConstructionSequence();
        isFirstFound = false;
      }

      if (scanningGuide) scanningGuide.classList.add('hidden');
      if (gestureHint) gestureHint.classList.remove('hidden');
      if (arControls) arControls.classList.remove('hidden');
      if (statusBanner) {
        statusBanner.classList.remove('lost');
        statusBanner.classList.add('found');
      }
      if (statusText) statusText.textContent = 'Foundation Base Locked! 🏗️';
    });

    targetAnchor.addEventListener('targetLost', () => {
      console.log('Foundation Target Lost');
      if (scanningGuide) scanningGuide.classList.remove('hidden');
      if (gestureHint) gestureHint.classList.add('hidden');
      if (arControls) arControls.classList.add('hidden');
      if (statusBanner) {
        statusBanner.classList.remove('found');
        statusBanner.classList.add('lost');
      }
      if (statusText) statusText.textContent = 'Searching for QR Foundation Base...';
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
    const colors = ['#10b981', '#22c55e', '#06b6d4', '#f59e0b', '#f43f5e', '#fb7185', '#fef08a', '#38bdf8'];
    
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
