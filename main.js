// ── Scroll-driven frame animation ──
const canvas = document.getElementById("video-canvas");
const ctx = canvas.getContext("2d");
const heroSection = document.getElementById("hero");
const introScreen = document.getElementById("intro-screen");

const TOTAL_FRAMES = 242;
const frames = [];
let framesLoaded = 0;
let currentFrame = 0;

function resizeCanvas() {
  const size = Math.min(700, window.innerWidth - 40, window.innerHeight - 100);
  canvas.width = size * window.devicePixelRatio;
  canvas.height = size * window.devicePixelRatio;
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  drawFrame(currentFrame);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Preload all frames
for (let i = 1; i <= TOTAL_FRAMES; i++) {
  const img = new Image();
  img.src = `frames/frame-${String(i).padStart(4, "0")}.jpg`;
  img.onload = () => {
    framesLoaded++;
    // Draw first frame as soon as it loads
    if (i === 1) drawFrame(0);
  };
  frames.push(img);
}

// Draw a frame (contain-fit with padding so edges aren't cut off)
function drawFrame(index) {
  const img = frames[index];
  if (!img || !img.complete || !img.naturalWidth) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // Contain-fit: show full image without cropping
  const scale = Math.min(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
}

// ── Scroll handler ──
function updateScroll() {
  const scrollTop = document.documentElement.scrollTop;
  const heroTop = heroSection.offsetTop;
  const heroHeight = heroSection.offsetHeight;
  const maxScroll = heroHeight - window.innerHeight;

  let scrollFraction = (scrollTop - heroTop) / maxScroll;
  scrollFraction = Math.max(0, Math.min(1, scrollFraction));

  // Intro text fades out in first 20%
  if (introScreen) {
    const introOpacity = Math.max(0, 1 - scrollFraction * 5);
    const introY = scrollFraction * 150;
    introScreen.style.opacity = introOpacity;
    introScreen.style.transform = `translate(-50%, calc(-50% - ${introY}px))`;
  }

  // Canvas opacity: appears at 10%, fully visible by 25%
  const videoAppear = Math.min(1, Math.max(0, (scrollFraction - 0.1) / 0.15));
  canvas.style.opacity = videoAppear;

  // Map scroll to frame index (start at 15% scroll)
  const frameFraction = Math.max(0, Math.min(1, (scrollFraction - 0.15) / 0.85));

  // Speed through frames 176-191 (ugly hook transition)
  const SKIP_START = 175;
  const SKIP_END = 191;
  const SKIP_COUNT = SKIP_END - SKIP_START;
  const NORMAL_COUNT = TOTAL_FRAMES - SKIP_COUNT;
  const SPEED_FACTOR = 5;
  const totalWeight = NORMAL_COUNT + SKIP_COUNT / SPEED_FACTOR;
  const scrollPos = frameFraction * totalWeight;

  let targetFrame;
  if (scrollPos <= SKIP_START) {
    targetFrame = Math.floor(scrollPos);
  } else if (scrollPos <= SKIP_START + SKIP_COUNT / SPEED_FACTOR) {
    targetFrame = SKIP_START + Math.floor((scrollPos - SKIP_START) * SPEED_FACTOR);
  } else {
    targetFrame = SKIP_END + Math.floor(scrollPos - SKIP_START - SKIP_COUNT / SPEED_FACTOR);
  }
  targetFrame = Math.min(TOTAL_FRAMES - 1, Math.max(0, targetFrame));

  if (targetFrame !== currentFrame) {
    currentFrame = targetFrame;
    requestAnimationFrame(() => drawFrame(currentFrame));
  }
}

window.addEventListener("scroll", updateScroll, { passive: true });
updateScroll();

// ── EarGear story section ──
const scrollSteps = document.querySelectorAll(".scroll-step");
const eargearImages = document.querySelectorAll(".eargear-img");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = entry.target.getAttribute("data-index");
        scrollSteps.forEach((step) => step.classList.remove("active"));
        entry.target.classList.add("active");
        eargearImages.forEach((img) => img.classList.remove("active"));
        const targetImg = document.getElementById(`eg-img-${index}`);
        if (targetImg) targetImg.classList.add("active");
      }
    });
  },
  { root: null, rootMargin: "-40% 0px -40% 0px", threshold: 0 }
);

scrollSteps.forEach((step) => observer.observe(step));
