(function () {
  const MIN_DISPLAY_MS = 2500;
  const REVEAL_MS = 950;
  const SCROLL_DISTANCE = 200;
  const BG_PARALLAX = 0.2;
  const LOADER_SEEN_KEY = "one-and-oldie-loader-seen";

  const BG = "#f7f7f7";
  const FG = "#535353";

  const loader = document.getElementById("page-loader");
  if (!loader) return;

  if (sessionStorage.getItem(LOADER_SEEN_KEY)) {
    loader.remove();
    document.body.classList.remove("is-loading");
    return;
  }

  const canvas = loader.querySelector(".dino-canvas");
  const game = loader.querySelector(".dino-game");
  const runner = loader.querySelector(".loader-runner");
  const ctx = canvas && canvas.getContext("2d");

  const startTime = performance.now();
  let progress = 0;
  let loaded = false;
  let revealing = false;
  let scroll = 0;
  let animFrame = 0;
  let reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  document.body.classList.add("is-loading");
  setProgress(0);

  function displayProgress() {
    const elapsed = performance.now() - startTime;
    const timeCap = Math.min(100, (elapsed / MIN_DISPLAY_MS) * 100);

    if (elapsed < MIN_DISPLAY_MS) {
      return timeCap;
    }

    return Math.min(100, progress);
  }

  function syncDisplay() {
    const shown = displayProgress();
    scroll = (shown / 100) * SCROLL_DISTANCE;
    if (runner) {
      runner.style.left = shown + "%";
    }
    if (game) {
      game.setAttribute("aria-valuenow", String(Math.round(shown)));
    }
  }

  function setProgress(value) {
    progress = Math.min(100, Math.max(0, value));
    syncDisplay();
  }

  function maybeReveal() {
    if (revealing) return;
    const elapsed = performance.now() - startTime;
    if (!loaded || progress < 100 || elapsed < MIN_DISPLAY_MS) return;

    revealing = true;
    sessionStorage.setItem(LOADER_SEEN_KEY, "1");
    loader.setAttribute("aria-busy", "false");
    loader.classList.add("is-revealing");

    window.setTimeout(function () {
      loader.classList.add("is-done");
      document.body.classList.remove("is-loading");
      loader.remove();
    }, REVEAL_MS);
  }

  function tickProgress() {
    if (revealing) return;

    if (!loaded) {
      setProgress(Math.min(90, progress + 0.35 + Math.random() * 0.25));
    }

    maybeReveal();

    if (!reducedMotion) {
      animFrame += 1;
    }

    syncDisplay();
    drawScene();
    requestAnimationFrame(tickProgress);
  }

  function onReady() {
    loaded = true;
    const wait = Math.max(0, MIN_DISPLAY_MS - (performance.now() - startTime));
    window.setTimeout(function () {
      setProgress(100);
      maybeReveal();
    }, wait);
  }

  if (document.readyState === "complete") {
    onReady();
  } else {
    window.addEventListener("load", onReady);
  }

  const images = Array.from(document.images).filter(function (img) {
    return img.closest("#page-loader") === null;
  });

  let pending = images.filter(function (img) {
    return !img.complete;
  }).length;

  if (pending > 0) {
    images.forEach(function (img) {
      if (img.complete) return;
      function done() {
        pending -= 1;
        const ratio = 1 - pending / images.length;
        setProgress(Math.max(progress, 25 + ratio * 60));
        if (pending <= 0) setProgress(Math.max(progress, 90));
      }
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  } else {
    setProgress(40);
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function fillPixels(pixels, ox, oy, scale) {
    ctx.fillStyle = FG;
    for (let i = 0; i < pixels.length; i += 1) {
      const px = pixels[i][0];
      const py = pixels[i][1];
      ctx.fillRect(ox + px * scale, oy + py * scale, scale, scale);
    }
  }

  const CACTUS_SMALL = [
    [2, 0],
    [3, 0],
    [4, 0],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
    [2, 2],
    [3, 2],
    [4, 2],
    [3, 3],
    [3, 4],
    [3, 5],
    [3, 6],
  ];

  const CACTUS_LARGE = [
    [3, 0],
    [4, 0],
    [5, 0],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 1],
    [1, 2],
    [2, 2],
    [6, 2],
    [7, 2],
    [1, 3],
    [2, 3],
    [6, 3],
    [7, 3],
    [3, 2],
    [4, 2],
    [5, 2],
    [4, 3],
    [4, 4],
    [4, 5],
    [4, 6],
    [4, 7],
    [4, 8],
    [0, 4],
    [1, 4],
    [2, 4],
    [7, 5],
    [8, 5],
    [9, 5],
  ];

  function drawCactus(x, groundY, scale, large) {
    const pixels = large ? CACTUS_LARGE : CACTUS_SMALL;
    const height = large ? 9 : 7;
    fillPixels(pixels, x, groundY - height * scale, scale);
  }

  function drawCloud(x, y, scale) {
    ctx.fillStyle = FG;
    const parts = [
      [1, 1, 2, 1],
      [2, 0, 2, 1],
      [3, 0, 3, 1],
      [4, 1, 2, 1],
      [0, 2, 6, 1],
      [1, 3, 4, 1],
    ];
    parts.forEach(function (p) {
      ctx.fillRect(
        x + p[0] * scale,
        y + p[1] * scale,
        p[2] * scale,
        p[3] * scale,
      );
    });
  }

  function drawScene() {
    if (!canvas || !ctx) return;
    resizeCanvas();
    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;
    const scale = 2;
    const groundY = height - 14;
    const speed = loaded ? 4 : 2;
    const runScroll = reducedMotion
      ? scroll
      : scroll + animFrame * speed * BG_PARALLAX;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, width, height);

    if (!reducedMotion) {
      drawCloud(48 - ((runScroll * 0.055) % (width + 80)), 10, scale);
      drawCloud(180 - ((runScroll * 0.032) % (width + 120)), 18, scale);
    }

    ctx.strokeStyle = FG;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 1);
    ctx.lineTo(width, groundY + 1);
    ctx.stroke();

    const obstacles = [
      { at: 140, large: false },
      { at: 280, large: true },
      { at: 420, large: false },
      { at: 560, large: true },
      { at: 700, large: false },
      { at: 840, large: true },
    ];

    const shown = displayProgress();

    obstacles.forEach(function (obs) {
      const x = width - ((runScroll + obs.at) % (width + 200)) + 40;
      if (x > -24 && x < width + 30) {
        drawCactus(x, groundY, scale, obs.large);
      }
    });

    ctx.fillStyle = FG;
    ctx.font = '13px "Courier New", Courier, monospace';
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    const score = String(Math.floor(shown)).padStart(5, "0");
    ctx.fillText(score, width - 4, 6);
  }

  window.addEventListener("resize", drawScene);
  requestAnimationFrame(tickProgress);
})();
