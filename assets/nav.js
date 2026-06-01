(function () {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const toggle = nav.querySelector(".nav-toggle");
  const menu = nav.querySelector(".nav-links");
  if (!toggle || !menu) return;

  const mq = window.matchMedia("(max-width: 768px)");

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  }

  toggle.addEventListener("click", function () {
    setOpen(!nav.classList.contains("is-open"));
  });

  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false);
    });
  });

  mq.addEventListener("change", function () {
    if (!mq.matches) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });
})();
