# ✨ Interactive WebAR Experience (MindAR + A-Frame)

An Augmented Reality (WebAR) experience running in mobile and desktop browsers with no app installation required. Built using **MindAR**, **A-Frame**, and modern glassmorphism UI.

## 🚀 Live Demo
- **GitHub Pages Live URL**: [https://akpsaheercp.github.io/webar-mindar/](https://akpsaheercp.github.io/webar-mindar/)

---

## 📸 Target Marker Image
To view the 3D augmented reality model in action:
1. Open the live page on your phone or laptop.
2. Allow camera access.
3. Aim your camera at the target marker image below:

<p align="center">
  <img src="assets/card.png" alt="AR Target Marker" width="360"/>
</p>

---

## 🌟 Key Features
- **Zero App Install**: Instant browser-based WebAR via WebRTC and WebGL.
- **High-Accuracy Image Tracking**: Powered by MindAR's computer vision neural tracking.
- **Interactive 3D Robot Character**: Includes skeletal animations (Dance, Wave, Jump, Idle) controllable via UI chips.
- **Glassmorphism UI / HUD**: Laser scanning guide, tracking status feedback, audio feedback synth, and particle celebration effects.
- **Mobile & Cross-Platform**: Responsive on iOS Safari, Android Chrome, and desktop webcams.

---

## 🛠️ Tech Stack
- **AR Engine**: [MindAR](https://hiukim.github.io/mind-ar-js-doc/) (v1.2.5)
- **3D Framework**: [A-Frame](https://aframe.io/) (v1.5.0) + `aframe-extras`
- **UI Styling**: Vanilla CSS3 (Custom Glassmorphism, CSS Grid, Flexbox, Keyframe animations)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Audio**: HTML5 Web Audio API Synthesizer

---

## 📂 Project Structure
```
webar-mindar/
├── index.html           # Main HTML file with A-Frame scene and UI
├── style.css            # Glassmorphism design and responsive layout
├── app.js               # Event handling, animation switcher, synth audio, confetti
├── assets/
│   ├── card.mind        # Compiled MindAR image tracking target
│   ├── card.png         # Target marker image (printable/scannable)
│   └── robot.glb        # 3D animated character model
└── README.md            # Documentation and instructions
```

---

## 💻 Local Development
To run locally on your machine:
```bash
# Using Python
python3 -m http.server 8000

# Using Node / npx
npx serve
```
Open `http://localhost:8000` (or `https://` for mobile camera testing over local network).
