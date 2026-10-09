import * as THREE from "three";

const BOTS = [
  { name: "Pilot", desc: "flight ops companion" },
  { name: "Forge", desc: "build & ship helper" },
  { name: "Beacon", desc: "alerts & status" },
  { name: "Scout", desc: "research runner" },
];

const root = document.getElementById("sphere-root");
const canvas = document.getElementById("sphere-canvas");
const wakePanel = document.getElementById("wake-panel");
const botListEl = document.getElementById("bot-list");
const hintEl = document.getElementById("hint");
const voiceBtn = document.getElementById("voice-wake");

let awake = false;
let selectedIndex = -1;

function buildBotList() {
  botListEl.innerHTML = "";
  BOTS.forEach((bot, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bot-item";
    btn.setAttribute("role", "option");
    btn.dataset.index = String(i);
    btn.innerHTML =
      `<span class="bot-name">${bot.name}</span>` +
      `<span class="bot-desc">${bot.desc}</span>`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectBot(i);
    });
    li.appendChild(btn);
    botListEl.appendChild(li);
  });
}

function selectBot(index) {
  selectedIndex = index;
  botListEl.querySelectorAll(".bot-item").forEach((el, i) => {
    el.classList.toggle("selected", i === index);
  });
}

function setAwake(next) {
  awake = next;
  wakePanel.hidden = false;
  wakePanel.classList.toggle("visible", awake);
  hintEl.classList.toggle("hidden", awake);
  if (!awake) {
    selectedIndex = -1;
    botListEl.querySelectorAll(".bot-item").forEach((el) => {
      el.classList.remove("selected");
    });
  }
}

function toggleWake() {
  setAwake(!awake);
}

buildBotList();

/* ---------- Three.js scene ---------- */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0.05, 4.2);

const sphereGroup = new THREE.Group();
scene.add(sphereGroup);

const sphereGeo = new THREE.SphereGeometry(1.35, 96, 96);
const sphereMat = new THREE.MeshStandardMaterial({
  color: 0xf4f6f8,
  roughness: 0.42,
  metalness: 0.06,
});
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphereGroup.add(sphere);

/* Soft ambient fill + key + rim so porcelain reads on dark bg */
const ambient = new THREE.AmbientLight(0xb8c4d8, 0.55);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 1.15);
key.position.set(2.2, 3.2, 3.5);
scene.add(key);

const fill = new THREE.DirectionalLight(0xa8c0e8, 0.35);
fill.position.set(-2.5, 0.5, 1.5);
scene.add(fill);

const rim = new THREE.DirectionalLight(0x88aadd, 0.4);
rim.position.set(0, -1.5, -2.5);
scene.add(rim);

/* Cyan pill eyes — capsules on the surface */
function makeEye(x) {
  const eyeGroup = new THREE.Group();
  const geo = new THREE.CapsuleGeometry(0.09, 0.28, 8, 16);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00c8e8,
    emissiveIntensity: 1.35,
    roughness: 0.25,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.z = Math.PI / 2;
  eyeGroup.add(mesh);

  const glowGeo = new THREE.CapsuleGeometry(0.12, 0.32, 8, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x33f0ff,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.z = Math.PI / 2;
  eyeGroup.add(glow);

  eyeGroup.position.set(x, 0.05, 1.28);
  return eyeGroup;
}

const leftEye = makeEye(-0.32);
const rightEye = makeEye(0.32);
sphereGroup.add(leftEye, rightEye);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function resize() {
  const w = root.clientWidth;
  const h = root.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(h, 1);
  // Portrait (phones): back the camera off so the full sphere fits the width.
  camera.position.z = camera.aspect < 1 ? 4.6 / camera.aspect : 4.2;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

let targetRotY = 0;
let targetRotX = 0;

function onPointerMove(e) {
  const rect = canvas.getBoundingClientRect();
  const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  targetRotY = nx * 0.18;
  targetRotX = ny * 0.1;
}

canvas.addEventListener("pointermove", onPointerMove);

function hitSphere(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObject(sphere, false).length > 0;
}

canvas.addEventListener("click", (e) => {
  if (hitSphere(e.clientX, e.clientY)) {
    toggleWake();
  } else if (awake) {
    setAwake(false);
  }
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !e.repeat) {
    e.preventDefault();
    toggleWake();
  }
  if (e.code === "Escape" && awake) {
    setAwake(false);
  }
});

voiceBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  setAwake(true);
});

let t0 = performance.now();
function animate(now) {
  const t = (now - t0) / 1000;
  sphereGroup.rotation.y += (targetRotY - sphereGroup.rotation.y) * 0.06;
  sphereGroup.rotation.x += (targetRotX - sphereGroup.rotation.x) * 0.06;
  const breathe = 1 + Math.sin(t * 1.2) * 0.008;
  sphere.scale.setScalar(breathe);

  const blink = Math.sin(t * 0.7) > 0.96 ? 0.15 : 1;
  leftEye.scale.y = blink;
  rightEye.scale.y = blink;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

/* Public API for Demo Lead shell embed */
window.SphereCompanion = {
  wake: () => setAwake(true),
  idle: () => setAwake(false),
  toggle: toggleWake,
  isAwake: () => awake,
};
