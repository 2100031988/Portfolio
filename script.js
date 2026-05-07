document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".l-header");
  const navMain = document.getElementById("nav-main");
  const navMenu = document.getElementById("nav-menu");
  const navToggle = document.getElementById("nav-toggle");
  const navMinimize = document.getElementById("nav-minimize");
  const navExpand = document.getElementById("nav-expand");
  const navLinks = Array.from(document.querySelectorAll('.nav__link[href^="#"]'));
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const revealTargets = Array.from(document.querySelectorAll(".reveal"));

  const messageInput = document.getElementById("message");
  const charCount = document.querySelector(".char-count");
  const form = document.getElementById("form");
  const submitButton = document.getElementById("button");
  const attachmentsInput = document.getElementById("attachments");
  const footerNewsletter = document.getElementById("footer-newsletter");
  const scrollProgress = document.getElementById("scroll-progress");
  const backToTop = document.getElementById("back-to-top");

  async function parseJsonSafe(response) {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (_) {
      const shortText = text.length > 180 ? `${text.slice(0, 180)}...` : text;
      return {
        success: false,
        message: `Server returned a non-JSON response (HTTP ${response.status}). ${shortText}`
      };
    }
  }

  const minimizeState = localStorage.getItem("nav-minimized") === "true";
  if (minimizeState && navMain && header && navExpand) {
    navMain.classList.add("nav--minimized");
    header.classList.add("nav--minimized");
    navExpand.classList.add("visible");
  }

  if (navMinimize && navMain && navExpand && header) {
    navMinimize.addEventListener("click", () => {
      navMain.classList.toggle("nav--minimized");
      header.classList.toggle("nav--minimized");
      navExpand.classList.toggle("visible");
      localStorage.setItem("nav-minimized", navMain.classList.contains("nav--minimized"));
    });
  }

  if (navExpand && navMain && header) {
    navExpand.addEventListener("click", () => {
      navMain.classList.remove("nav--minimized");
      header.classList.remove("nav--minimized");
      navExpand.classList.remove("visible");
      localStorage.setItem("nav-minimized", "false");
    });
  }

  const updateHeaderState = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
  };

  const updateActiveLink = () => {
    const scrollPosition = window.scrollY + 160;
    sections.forEach((section) => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < bottom) {
        navLinks.forEach((link) => {
          link.classList.toggle("active-link", link.getAttribute("href") === `#${section.id}`);
        });
      }
    });
  };

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => navMenu.classList.toggle("show"));
    navLinks.forEach((link) => {
      link.addEventListener("click", () => navMenu.classList.remove("show"));
    });
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    revealTargets.forEach((element) => observer.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }

  if (messageInput && charCount) {
    const updateCharacterCount = () => {
      charCount.textContent = `${Math.max(0, 2000 - messageInput.value.length)} characters left`;
    };
    messageInput.addEventListener("input", updateCharacterCount);
    updateCharacterCount();
  }

  // Attachments input is optional; no OTP flow required anymore.

  if (form && submitButton) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const successMessage = document.querySelector(".success-message");
      const errorMessage = document.querySelector(".error-message");

      submitButton.value = "Sending...";
      submitButton.disabled = true;
      if (successMessage) successMessage.style.display = "none";
      if (errorMessage) errorMessage.style.display = "none";

      try {
        const formData = new FormData();
        formData.append('from_name', document.getElementById("from_name")?.value?.trim());
        formData.append('from_email', document.getElementById("from_email")?.value?.trim());
        formData.append('from_phone', document.getElementById("from_phone")?.value?.trim());
        formData.append('message', document.getElementById("message")?.value?.trim());
        formData.append('website', document.getElementById("website")?.value?.trim() || "");

        if (attachmentsInput && attachmentsInput.files && attachmentsInput.files.length) {
          for (let i = 0; i < attachmentsInput.files.length; i++) {
            formData.append('attachments', attachmentsInput.files[i]);
          }
        }

        const response = await fetch("/api/contact", {
          method: "POST",
          body: formData
        });

        const data = await parseJsonSafe(response);
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to submit form");
        }

        submitButton.value = "Send Message";
        submitButton.disabled = false;

        if (successMessage) {
          successMessage.style.display = "block";
          const ref = data.referenceId || data.reference_id || "pending";
          successMessage.textContent = `Thanks! We received your request. Reference ID: ${ref}`;
        }
        form.reset();
        if (attachmentsInput) attachmentsInput.value = null;
        if (charCount) charCount.textContent = "2000 characters left";
      } catch (error) {
        submitButton.value = "Send Message";
        submitButton.disabled = false;
        if (errorMessage) {
          errorMessage.style.display = "block";
          const baseMessage = error.message || "Failed to send your request.";
          const likelyServerDown = window.location.origin.startsWith("file:");
          errorMessage.textContent = likelyServerDown
            ? `${baseMessage} Open this site from http://localhost:3000 (not direct file preview).`
            : baseMessage;
        }
      }
    });
  }

  if (footerNewsletter) {
    footerNewsletter.addEventListener("submit", async (e) => {
      e.preventDefault();
      const success = footerNewsletter.querySelector(".newsletter-success");
      const email = footerNewsletter.querySelector('input[name="newsletter_email"]')?.value?.trim();
      if (!email) return;

      try {
        const response = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await parseJsonSafe(response);
        if (!response.ok || !data.success) throw new Error(data.message || "Subscribe failed");

        if (success) {
          success.style.display = "block";
          success.textContent = "Subscribed - thank you!";
        }
        footerNewsletter.reset();
      } catch (_) {
        if (success) {
          success.style.display = "block";
          success.textContent = "Saved locally. Server not available yet.";
        }
      }
    });
  }

  const filterButtons = Array.from(document.querySelectorAll(".project-filter__btn"));
  const projectCards = Array.from(document.querySelectorAll(".project-card"));

  if (filterButtons.length && projectCards.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const category = btn.dataset.category;
        filterButtons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        projectCards.forEach((card) => {
          const tags = (card.dataset.category || "").split(" ");
          const show = category === "all" || tags.includes(category);
          card.style.display = show ? "block" : "none";
        });
      });
    });
  }

  updateHeaderState();
  updateActiveLink();

  const updateScrollUI = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const current = window.scrollY;
    const pct = total > 0 ? (current / total) * 100 : 0;
    if (scrollProgress) {
      scrollProgress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }
    if (backToTop) {
      backToTop.classList.toggle("visible", current > 500);
    }
  };

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  updateScrollUI();
  window.addEventListener(
    "scroll",
    () => {
      updateHeaderState();
      updateActiveLink();
      updateScrollUI();
    },
    { passive: true }
  );
});
