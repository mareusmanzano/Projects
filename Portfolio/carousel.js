// Coverflow-style carousel: a centered "active" card with side cards
// scaled down, pushed sideways, and faded based on distance from center.
// Works with any ".carousel" containing ".carousel__track" > ".carousel__slide".

const AUTOPLAY_MS = 4000;
const SPACING_PX = 130; // horizontal offset per step away from center
const SCALE_STEP = 0.14; // how much smaller each step away from center is
const OPACITY_STEP = 0.32;
const MAX_VISIBLE_STEPS = 3; // slides further than this are fully hidden

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".carousel").forEach(initCarousel);
});

function initCarousel(carousel) {
  const track = carousel.querySelector(".carousel__track");
  if (!track) return;

  const slides = Array.from(track.querySelectorAll(".carousel__slide"));
  if (slides.length === 0) return;

  let index = slides.findIndex((s) => s.classList.contains("active"));
  if (index === -1) index = 0;

  // Bullets, placed after the carousel (not inside it)
  const dotsWrap = document.createElement("div");
  dotsWrap.className = "carousel__dots";
  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel__dot";
    dot.setAttribute("aria-label", "Go to slide " + (i + 1));
    dot.addEventListener("click", () => {
      goTo(i);
      restartAutoplay();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });
  carousel.insertAdjacentElement("afterend", dotsWrap);

  // Lightbox elements
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeBtn = document.querySelector(".lightbox__close");
  const prevBtn = document.querySelector(".lightbox__nav--prev");
  const nextBtn = document.querySelector(".lightbox__nav--next");

  // Helper function to extract URL from <img> tag OR background-image property
  function getImageUrl(slide) {
    const imgTag = slide.querySelector("img");
    if (imgTag && imgTag.src) {
      return imgTag.src;
    }
    const bg = slide.style.backgroundImage;
    return bg ? bg.replace(/^url\(['"]?/, "").replace(/['"]?\)$/, "") : "";
  }

  // Clicking a side card brings it to center; clicking active slide opens lightbox
  slides.forEach((slide, i) => {
    slide.addEventListener("click", () => {
      if (i !== index) {
        goTo(i);
        restartAutoplay();
      } else {
        // Active slide clicked -> Open Lightbox
        const imageUrl = getImageUrl(slide);
        if (imageUrl && lightbox && lightboxImg) {
          lightboxImg.src = imageUrl;
          lightbox.classList.add("active");
        }
      }
    });
  });

  // Lightbox navigation button events
  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      goTo(index - 1);
      restartAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      goTo(index + 1);
      restartAutoplay();
    });
  }

  // Lightbox close listeners
  if (closeBtn && lightbox) {
    closeBtn.addEventListener("click", () =>
      lightbox.classList.remove("active"),
    );
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) lightbox.classList.remove("active");
    });
  }

  // Global keyboard navigation
  document.addEventListener("keydown", (e) => {
    const isLightboxActive = lightbox && lightbox.classList.contains("active");

    if (e.key === "Escape" && isLightboxActive) {
      lightbox.classList.remove("active");
    }

    if (e.key === "ArrowLeft") {
      goTo(index - 1);
      restartAutoplay();
    }

    if (e.key === "ArrowRight") {
      goTo(index + 1);
      restartAutoplay();
    }
  });

  function shortestDiff(i) {
    let diff = i - index;
    const n = slides.length;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;
    return diff;
  }

  function render() {
    slides.forEach((slide, i) => {
      const diff = shortestDiff(i);
      const abs = Math.abs(diff);
      const scale = Math.max(1 - abs * SCALE_STEP, 0.5);
      const opacity =
        abs > MAX_VISIBLE_STEPS ? 0 : Math.max(1 - abs * OPACITY_STEP, 0);
      const translateX = diff * SPACING_PX;

      slide.style.transform = `translate(-50%, -50%) translateX(${translateX}px) scale(${scale})`;
      slide.style.opacity = opacity;
      slide.style.zIndex = 100 - abs;
      slide.style.pointerEvents = abs > MAX_VISIBLE_STEPS ? "none" : "auto";

      const isActive = diff === 0;
      slide.classList.toggle("active", isActive);

      // SYNC LIGHTBOX: Keep image in sync with the current slide sequence
      if (
        isActive &&
        lightbox &&
        lightbox.classList.contains("active") &&
        lightboxImg
      ) {
        lightboxImg.src = getImageUrl(slide);
      }
    });

    dots.forEach((d, i) => d.classList.toggle("active", i === index));
  }

  function goTo(next) {
    index = (next + slides.length) % slides.length;
    render();
  }

  render();

  if (slides.length > 1) {
    let timer = null;
    function startAutoplay() {
      timer = setInterval(() => goTo(index + 1), AUTOPLAY_MS);
    }
    function stopAutoplay() {
      clearInterval(timer);
    }
    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    startAutoplay();
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
  }
}
