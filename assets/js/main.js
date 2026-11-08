
(function () {
    const header = document.querySelector(".mai-header");
    const slides = document.querySelectorAll(".mai-hero-slide");
    const navLinks = document.querySelectorAll('.mai-navigation a[href^="#"], .mai-logo[href^="#"]');
    const sections = {
        home: document.getElementById("home"),
        "mai-about": document.getElementById("mai-about")
    };

    function scrollToSection(id) {
        const section = document.getElementById(id);

        if (!section) {
            return;
        }

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function setActiveNav(id) {
        document.querySelectorAll(".mai-navigation a").forEach(function (link) {
            const target = (link.getAttribute("href") || "").replace("#", "");
            link.classList.toggle("is-active", target === id);
        });
    }

    function updateHeaderState() {
        if (header) {
            header.classList.toggle("is-scrolled", window.scrollY > 40);
        }

        const about = sections["mai-about"];
        const aboutTop = about ? about.offsetTop - 140 : Number.POSITIVE_INFINITY;

        if (window.scrollY + 80 >= aboutTop) {
            setActiveNav("mai-about");
        } else {
            setActiveNav("home");
        }
    }

    document.addEventListener("click", function (event) {
        const link = event.target.closest('a[href^="#"]');

        if (!link || !header || !header.contains(link)) {
            return;
        }

        const id = (link.getAttribute("href") || "").replace("#", "");

        if (!id) {
            return;
        }

        event.preventDefault();
        closeMemberView();
        scrollToSection(id);
        setActiveNav(id);
        history.replaceState(null, "", "#" + id);
    });

    window.addEventListener("scroll", updateHeaderState, { passive: true });
    updateHeaderState();

    function toggleCard(card) {
        if (card.dataset.flipping === "true") {
            return;
        }

        card.dataset.flipping = "true";

        const hanger = card.closest(".mai-hanger");

        if (hanger) {
            hanger.classList.add("is-paused");
        }

        card.classList.toggle("is-flipped");

        setTimeout(function () {
            card.dataset.flipping = "false";

            if (hanger && !card.classList.contains("is-flipped")) {
                hanger.classList.remove("is-paused");
            }
        }, 800);
    }

    document.querySelectorAll(".mai-id-card").forEach(function (card) {
        const photo = card.querySelector(".mai-card-photo");

        if (photo) {
            bindFlashlight(photo, false);
        }

        card.addEventListener("click", function (event) {
            if (event.target.closest("a")) {
                return;
            }

            toggleCard(card);
        });

        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleCard(card);
            }
        });
    });

    const cardWraps = document.querySelectorAll(".mai-card-wrap");
    const aboutSection = document.getElementById("mai-about");
    const introCover = document.getElementById("maiteam-cover");

    function introIsBlocking() {
        return !!(introCover && introCover.style.pointerEvents !== "none");
    }

    function resetCardDrop() {
        if (!aboutSection || !aboutSection.classList.contains("cards-started")) {
            return;
        }

        aboutSection.classList.remove("cards-started");

        cardWraps.forEach(function (wrap) {
            wrap.classList.remove("is-visible", "is-settled");

            wrap.querySelectorAll(".mai-id-card").forEach(function (card) {
                card.classList.remove("is-flipped", "is-flipping");
                card.dataset.flipping = "false";
            });

            wrap.querySelectorAll(".mai-hanger").forEach(function (hanger) {
                hanger.classList.remove("is-paused");
            });

            void wrap.offsetWidth;
        });
    }

    function startCardDrop() {
        if (!aboutSection || aboutSection.classList.contains("cards-started")) {
            return;
        }

        aboutSection.classList.add("cards-started");

        cardWraps.forEach(function (wrap) {
            wrap.classList.remove("is-visible", "is-settled");
            void wrap.offsetWidth;
            wrap.classList.add("is-visible");
        });
    }

    function aboutIsInView() {
        if (!aboutSection) {
            return false;
        }

        const rect = aboutSection.getBoundingClientRect();
        const viewport = window.innerHeight || document.documentElement.clientHeight;

        return rect.top < viewport * 0.82 && rect.bottom > 140;
    }

    function aboutIsFullyAway() {
        if (!aboutSection) {
            return true;
        }

        const rect = aboutSection.getBoundingClientRect();
        const viewport = window.innerHeight || document.documentElement.clientHeight;

        return rect.top > viewport - 40 || rect.bottom < 80;
    }

    function syncCardAnimation() {
        if (introIsBlocking() || document.body.classList.contains("mai-member-open")) {
            return;
        }

        if (aboutIsInView()) {
            startCardDrop();
            return;
        }

        if (aboutIsFullyAway()) {
            resetCardDrop();
        }
    }

    cardWraps.forEach(function (wrap) {
        wrap.addEventListener("animationend", function (event) {
            if (event.animationName === "maiBounceIn") {
                wrap.classList.add("is-settled");
            }
        });
    });

    function watchAboutOnScroll() {
        syncCardAnimation();
        window.addEventListener("scroll", syncCardAnimation, { passive: true });
    }

    if (cardWraps.length) {
        if (introIsBlocking()) {
            const introWatch = setInterval(function () {
                if (!introIsBlocking()) {
                    clearInterval(introWatch);
                    watchAboutOnScroll();
                }
            }, 200);
        } else {
            watchAboutOnScroll();
        }
    }

    if (slides.length >= 2) {
        let current = 0;

        setInterval(function () {
            slides[current].classList.remove("is-active");
            current = (current + 1) % slides.length;
            slides[current].classList.add("is-active");
        }, 5000);
    }

    const memberOverlay = document.getElementById("mai-member-overlay");
    const memberPanels = document.querySelectorAll(".mai-member");

    function getLikedMap(slug) {
        try {
            return JSON.parse(localStorage.getItem("maiteam-hearts-" + slug) || "{}") || {};
        } catch (error) {
            return {};
        }
    }

    function bindFavFan(panel) {
        const fan = panel.querySelector(".mai-fav-fan");

        if (!fan) {
            return;
        }

        const cards = fan.querySelectorAll(".mai-fav-card");
        const caption = panel.querySelector(".mai-fav-caption");

        function clearChosen() {
            cards.forEach(function (card) {
                card.classList.remove("is-chosen");
            });

            if (caption) {
                caption.textContent = "";
            }
        }

        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    fan.classList.toggle("is-fanned", entry.isIntersecting);

                    if (!entry.isIntersecting) {
                        clearChosen();
                    }
                });
            },
            {
                root: memberOverlay || null,
                threshold: 0.38
            }
        );

        observer.observe(fan);

        cards.forEach(function (card) {
            card.addEventListener("click", function (event) {
                if (event.target.closest(".mai-heart")) {
                    return;
                }

                fan.classList.add("is-fanned");

                const already = card.classList.contains("is-chosen");
                clearChosen();

                if (!already) {
                    card.classList.add("is-chosen");

                    if (caption) {
                        const label = card.querySelector("span");
                        caption.textContent = label ? label.textContent : "";
                    }
                }
            });
        });
    }

    function bindHearts(panel) {
        const slug = panel.dataset.member || "member";
        const liked = getLikedMap(slug);

        panel.querySelectorAll(".mai-heart").forEach(function (button) {
            const id = button.dataset.heart;

            if (liked[id]) {
                button.classList.add("is-liked");
                button.setAttribute("aria-pressed", "true");
            }

            button.addEventListener("click", function () {
                const nextLiked = getLikedMap(slug);
                const isLiked = button.classList.toggle("is-liked");
                button.setAttribute("aria-pressed", isLiked ? "true" : "false");
                nextLiked[id] = isLiked;
                localStorage.setItem("maiteam-hearts-" + slug, JSON.stringify(nextLiked));
            });
        });
    }

    function bindPillNav(panel) {
        const pillLinks = panel.querySelectorAll('.mai-pill-nav a[href^="#"]');

        function setActivePill(id) {
            pillLinks.forEach(function (link) {
                const target = (link.getAttribute("href") || "").replace("#", "");
                link.classList.toggle("is-active", target === id);
            });
        }

        function updatePillNav() {
            const scrollTop = memberOverlay && !memberOverlay.hidden
                ? memberOverlay.scrollTop
                : window.scrollY;
            const marker = scrollTop + 180;
            let current = "";

            pillLinks.forEach(function (link, index) {
                const id = (link.getAttribute("href") || "").replace("#", "");
                const section = document.getElementById(id);

                if (section && section.offsetTop <= marker) {
                    current = id;
                } else if (index === 0 && !current) {
                    current = id;
                }
            });

            if (current) {
                setActivePill(current);
            }
        }

        pillLinks.forEach(function (link) {
            link.addEventListener("click", function (event) {
                const id = (link.getAttribute("href") || "").replace("#", "");
                const section = document.getElementById(id);

                if (!section) {
                    return;
                }

                event.preventDefault();
                section.scrollIntoView({ behavior: "smooth", block: "start" });
                setActivePill(id);
            });
        });

        const scrollTarget = memberOverlay || window;
        scrollTarget.addEventListener("scroll", updatePillNav, { passive: true });
        updatePillNav();
    }

    let overlayCloseTimer = 0;

    function openMemberView(slug, originEvent) {
        if (!memberOverlay || !slug) {
            return;
        }

        let found = false;

        memberPanels.forEach(function (panel) {
            const active = panel.dataset.member === slug;
            panel.classList.toggle("is-active", active);

            if (active) {
                found = true;
            }
        });

        if (!found) {
            return;
        }

        window.clearTimeout(overlayCloseTimer);

        const x = originEvent && typeof originEvent.clientX === "number"
            ? originEvent.clientX
            : window.innerWidth / 2;
        const y = originEvent && typeof originEvent.clientY === "number"
            ? originEvent.clientY
            : window.innerHeight / 2;

        memberOverlay.hidden = false;
        memberOverlay.classList.remove("is-open", "is-leaving");
        memberOverlay.scrollTop = 0;
        document.body.classList.add("mai-member-open");

        const overlayRect = memberOverlay.getBoundingClientRect();
        memberOverlay.style.setProperty("--ox", (x - overlayRect.left) + "px");
        memberOverlay.style.setProperty("--oy", (y - overlayRect.top) + "px");

        void memberOverlay.offsetWidth;

        requestAnimationFrame(function () {
            memberOverlay.classList.add("is-open");
        });

        if (header) {
            header.classList.add("is-scrolled");
        }
    }

    function closeMemberView() {
        if (!memberOverlay || memberOverlay.hidden) {
            return;
        }

        if (memberOverlay.classList.contains("is-leaving")) {
            return;
        }

        memberOverlay.classList.remove("is-open");
        memberOverlay.classList.add("is-leaving");

        overlayCloseTimer = window.setTimeout(function () {
            memberOverlay.hidden = true;
            memberOverlay.classList.remove("is-leaving");
            document.body.classList.remove("mai-member-open");

            memberPanels.forEach(function (panel) {
                panel.classList.remove("is-active");
            });
        }, 520);
    }

    function bindFlashlight(frame, tilt) {
        const head = frame.querySelector(".mai-portrait-head");

        if (!frame || !head) {
            return;
        }

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        frame.addEventListener("mousemove", function (event) {
            const rect = frame.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;

            frame.classList.add("is-hovering");
            frame.style.setProperty("--mx", (event.clientX - rect.left) + "px");
            frame.style.setProperty("--my", (event.clientY - rect.top) + "px");

            if (tilt && !reduceMotion) {
                frame.style.transform =
                    "rotateY(" + ((x - 0.5) * 16).toFixed(2) + "deg) rotateX(" + ((0.5 - y) * 12).toFixed(2) + "deg)";
            }

            head.classList.add("is-on");
        });

        frame.addEventListener("mouseleave", function () {
            frame.classList.remove("is-hovering");

            if (tilt) {
                frame.style.transform = "";
            }

            head.classList.remove("is-on");
        });
    }

    function bindPortraitHover(panel) {
        const portrait = panel.querySelector(".mai-member-portrait");

        if (portrait) {
            bindFlashlight(portrait, true);
        }
    }

    memberPanels.forEach(function (panel) {
        bindHearts(panel);
        bindFavFan(panel);
        bindPillNav(panel);
        bindPortraitHover(panel);
    });

    document.querySelectorAll(".mai-more-info").forEach(function (link) {
        link.addEventListener("click", function (event) {
            if (!memberOverlay) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            openMemberView(link.dataset.member, event);
        });
    });

    document.querySelectorAll(".mai-member-back").forEach(function (button) {
        button.addEventListener("click", function () {
            if (memberOverlay) {
                closeMemberView();
                scrollToSection("mai-about");
                setActiveNav("mai-about");
                return;
            }

            window.location.href = button.getAttribute("data-return") || "/";
        });
    });
})();
