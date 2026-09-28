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

    // ===== GITHUB PROFILE SNAPSHOT =====
    const githubRepositoryList = document.getElementById('github-repository-list');
    const githubSyncStatus = document.getElementById('github-sync-status');

    if (githubRepositoryList && githubSyncStatus) {
        const githubUsername = '2100031988';
        const cacheKey = 'portfolio.github-snapshot.v1';
        const cacheDuration = 15 * 60 * 1000;
        const setSyncStatus = (message, state) => {
            githubSyncStatus.textContent = message;
            githubSyncStatus.parentElement.classList.toggle('is-current', state === 'current');
            githubSyncStatus.parentElement.classList.toggle('is-error', state === 'error');
        };

        const formatRepositoryDate = value => {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return 'Recently updated';
            return `Updated ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)}`;
        };

        const renderGitHubSnapshot = snapshot => {
            const avatar = document.getElementById('github-avatar');
            const displayName = document.getElementById('github-display-name');
            const repositoryCount = document.getElementById('github-repo-count');
            const followerCount = document.getElementById('github-follower-count');
            const lastUpdated = document.getElementById('github-last-updated');

            if (avatar && snapshot.profile.avatar_url) avatar.src = snapshot.profile.avatar_url;
            if (displayName) displayName.textContent = snapshot.profile.name || snapshot.profile.login || githubUsername;
            if (repositoryCount) repositoryCount.textContent = Number(snapshot.profile.public_repos || 0).toLocaleString();
            if (followerCount) followerCount.textContent = Number(snapshot.profile.followers || 0).toLocaleString();

            githubRepositoryList.replaceChildren();
            const repositories = snapshot.repositories.filter(repository => repository.fork !== true && repository.archived !== true).slice(0, 3);

            if (repositories.length === 0) {
                const emptyMessage = document.createElement('li');
                emptyMessage.className = 'github-repository-placeholder';
                emptyMessage.textContent = 'No recent repositories to show.';
                githubRepositoryList.append(emptyMessage);
            }

            repositories.forEach(repository => {
                const item = document.createElement('li');
                const link = document.createElement('a');
                const name = document.createElement('span');
                const metadata = document.createElement('span');

                link.className = 'github-repository-link';
                link.href = repository.html_url;
                link.target = '_blank';
                link.rel = 'noreferrer';
                link.setAttribute('aria-label', `${repository.name} repository on GitHub`);
                name.className = 'github-repository-name';
                name.textContent = repository.name;
                metadata.className = 'github-repository-meta';
                metadata.textContent = [repository.language || 'Repository', formatRepositoryDate(repository.pushed_at || repository.updated_at)].join(' · ');

                link.append(name, metadata);
                item.append(link);
                githubRepositoryList.append(item);
            });

            if (lastUpdated && snapshot.fetchedAt) {
                lastUpdated.textContent = `Synced ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(snapshot.fetchedAt))}`;
            }
        };

        const readCachedSnapshot = () => {
            try {
                const cached = JSON.parse(localStorage.getItem(cacheKey));
                return cached && cached.profile && Array.isArray(cached.repositories) ? cached : null;
            } catch (error) {
                return null;
            }
        };

        let cachedSnapshot = readCachedSnapshot();
        if (cachedSnapshot) {
            renderGitHubSnapshot(cachedSnapshot);
            setSyncStatus('Cached profile', 'current');
        }

        const refreshGitHubSnapshot = async () => {
            if (document.hidden) return;

            try {
                const [profileResponse, repositoriesResponse] = await Promise.all([
                    fetch(`https://api.github.com/users/${githubUsername}`, { headers: { Accept: 'application/vnd.github+json' } }),
                    fetch(`https://api.github.com/users/${githubUsername}/repos?type=owner&sort=updated&per_page=100`, { headers: { Accept: 'application/vnd.github+json' } })
                ]);

                if (!profileResponse.ok || !repositoriesResponse.ok) throw new Error('GitHub profile request failed.');

                const [profile, repositories] = await Promise.all([profileResponse.json(), repositoriesResponse.json()]);
                if (!profile || !Array.isArray(repositories)) throw new Error('GitHub returned an unexpected response.');

                const snapshot = {
                    profile: {
                        login: profile.login,
                        name: profile.name,
                        avatar_url: profile.avatar_url,
                        public_repos: profile.public_repos,
                        followers: profile.followers
                    },
                    repositories: repositories.map(repository => ({
                        name: repository.name,
                        html_url: repository.html_url,
                        language: repository.language,
                        pushed_at: repository.pushed_at,
                        updated_at: repository.updated_at,
                        fork: repository.fork,
                        archived: repository.archived
                    })),
                    fetchedAt: Date.now()
                };

                renderGitHubSnapshot(snapshot);
                cachedSnapshot = snapshot;
                setSyncStatus('Live from GitHub', 'current');
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(snapshot));
                } catch (error) {
                    // Keep the live snapshot usable when browser storage is unavailable.
                }
            } catch (error) {
                setSyncStatus(cachedSnapshot ? 'Showing saved data' : 'GitHub unavailable', 'error');
                if (!cachedSnapshot) {
                    githubRepositoryList.replaceChildren();
                    const fallbackMessage = document.createElement('li');
                    fallbackMessage.className = 'github-repository-placeholder';
                    fallbackMessage.textContent = 'Repository data is temporarily unavailable.';
                    githubRepositoryList.append(fallbackMessage);
                }
            }
        };

        if (!cachedSnapshot || Date.now() - cachedSnapshot.fetchedAt >= cacheDuration) {
            refreshGitHubSnapshot();
        }
        window.setInterval(refreshGitHubSnapshot, cacheDuration);
    }

    // ===== PROJECT SEARCH AND FILTERS =====
    const projectTools = document.getElementById('project-tools');
    const projectGrid = document.getElementById('project-grid');
    const projectSearch = document.getElementById('project-search');

    if (projectTools && projectGrid && projectSearch) {
        const projectCards = [...projectGrid.querySelectorAll('.project-card')];
        const filterButtons = [...projectTools.querySelectorAll('[data-project-filter]')];
        const resultCount = document.getElementById('project-results');
        const emptyState = document.getElementById('project-empty-state');
        let activeProjectCategory = 'all';

        const updateVisibleProjects = () => {
            const searchTerm = projectSearch.value.trim().toLocaleLowerCase();
            let visibleCount = 0;

            projectCards.forEach(card => {
                const matchesCategory = activeProjectCategory === 'all' || card.dataset.projectCategory === activeProjectCategory;
                const matchesSearch = card.textContent.toLocaleLowerCase().includes(searchTerm);
                const isVisible = matchesCategory && matchesSearch;

                card.hidden = !isVisible;
                if (isVisible) visibleCount += 1;
            });

            if (resultCount) {
                resultCount.textContent = visibleCount === projectCards.length && searchTerm === ''
                    ? `Showing all ${projectCards.length} projects`
                    : `Showing ${visibleCount} of ${projectCards.length} projects`;
            }
            if (emptyState) emptyState.hidden = visibleCount > 0;
        };

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                activeProjectCategory = button.dataset.projectFilter;
                filterButtons.forEach(filterButton => {
                    const isActive = filterButton === button;
                    filterButton.classList.toggle('is-active', isActive);
                    filterButton.setAttribute('aria-pressed', String(isActive));
                });
                updateVisibleProjects();
            });
        });

        projectSearch.addEventListener('input', updateVisibleProjects);
        projectTools.hidden = false;

        document.addEventListener('keydown', event => {
            const target = event.target;
            const isTyping = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
            if (event.key === '/' && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
                event.preventDefault();
                projectSearch.focus();
            }
        });
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
