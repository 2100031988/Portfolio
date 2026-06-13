// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // ===== EMAIL.JS INITIALIZATION =====
    const YOUR_PUBLIC_KEY = "w0qkzgIsSgb35j_u0";
    const SERVICE_ID = "service_m3nsdyn";
    const TEMPLATE_ID = "template_h4hfplp";          // Contact Us (admin notification)
    const AUTO_REPLY_TEMPLATE_ID = "template_hfzp5yu"; // Auto-Reply (to visitor)

    const emailjsLoaded = typeof window.emailjs !== 'undefined' && typeof emailjs.init === 'function';
    const autoReplyEnabled = emailjsLoaded && AUTO_REPLY_TEMPLATE_ID;

    if (emailjsLoaded) {
        emailjs.init(YOUR_PUBLIC_KEY);
    } else {
        console.warn('EmailJS is not loaded. Contact form will work only as a placeholder.');
    }

    // Elements
    const header = document.querySelector('.l-header');
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    const sections = document.querySelectorAll('section[id]');
    const revealElements = document.querySelectorAll('.reveal');
    const scrollProgress = document.getElementById('scroll-progress');
    const backToTop = document.getElementById('back-to-top');
    const contactForm = document.getElementById('contact-form');
    const messageInput = document.getElementById('message');
    const charCount = document.getElementById('char-count');
    const formStatus = document.getElementById('form-status');

    // ===== SCROLL PROGRESS BAR =====
    const updateScrollProgress = () => {
        if (!scrollProgress) return;
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress_value = windowHeight > 0 ? (window.scrollY / windowHeight) * 100 : 0;
        scrollProgress.style.width = scrollProgress_value + '%';
    };

    window.addEventListener('scroll', updateScrollProgress);

    // ===== HEADER SCROLL STATE =====
    const updateHeaderState = () => {
        header.classList.toggle('is-scrolled', window.scrollY > 10);
    };

    window.addEventListener('scroll', updateHeaderState);

    // ===== NAVIGATION TOGGLE (MOBILE) =====
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('hidden');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.add('hidden');
            });
        });
    }

    // ===== ACTIVE LINK HIGHLIGHTING =====
    const updateActiveLink = () => {
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active-link');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active-link');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', updateActiveLink);

    // ===== REVEAL ANIMATION (INTERSECTION OBSERVER) =====
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(element => observer.observe(element));
    } else {
        revealElements.forEach(element => element.classList.add('is-visible'));
    }

    // ===== BACK TO TOP BUTTON =====
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.remove('opacity-0', 'invisible');
            } else {
                backToTop.classList.add('opacity-0', 'invisible');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ===== CHARACTER COUNTER FOR MESSAGE =====
    if (messageInput && charCount) {
        messageInput.addEventListener('input', () => {
            charCount.textContent = messageInput.value.length;
        });
    }

    // ===== CONTACT FORM SUBMISSION WITH EMAILJS =====
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Sending...</span><i class="bx bx-loader-alt text-lg animate-spin"></i>';

            try {
                if (!emailjsLoaded) {
                    formStatus.classList.remove('hidden');
                    formStatus.textContent = '✗ Email service is unavailable locally. Please contact me directly via email.';
                    formStatus.className = 'text-sm text-red-400 text-center';
                    return;
                }

                // Shared params — must match {{ }} placeholders in BOTH templates
                const commonParams = {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    subject: document.getElementById('subject').value,
                    message: document.getElementById('message').value,
                    time: new Date().toLocaleString(),
                    reference_id: 'PORT-' + Date.now()
                };

                const ownerPromise = emailjs.send(SERVICE_ID, TEMPLATE_ID, commonParams);
                const autoReplyPromise = autoReplyEnabled
                    ? emailjs.send(SERVICE_ID, AUTO_REPLY_TEMPLATE_ID, commonParams)
                    : Promise.resolve();

                await Promise.all([ownerPromise, autoReplyPromise]);

                // Show success message
                formStatus.classList.remove('hidden');
                formStatus.textContent = autoReplyEnabled
                    ? '✓ Message received. A confirmation email has been sent to you.'
                    : '✓ Message received. Auto-reply is not configured yet.';
                formStatus.className = 'text-sm text-green-400 text-center';

                // Reset form
                contactForm.reset();
                charCount.textContent = '0';

                // Clear status after 5 seconds
                setTimeout(() => {
                    formStatus.classList.add('hidden');
                }, 5000);

            } catch (error) {
                console.error('EmailJS error:', error);
                formStatus.classList.remove('hidden');
                formStatus.textContent = '✗ Error sending email. Please try again or contact directly.';
                formStatus.className = 'text-sm text-red-400 text-center';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // ===== INITIAL CALL =====
    updateScrollProgress();
    updateHeaderState();
    updateActiveLink();
});
