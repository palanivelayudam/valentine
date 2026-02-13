$(document).ready(function () {
    const $noBtn = $('#no-btn');
    const $yesBtn = $('#yes-btn');
    const $questionContainer = $('#question-container');
    const $successContainer = $('#success-container');
    const $heartsBg = $('#hearts-bg');

    // Create floating hearts background
    const hearts = ['❤️', '💕', '💗', '💖', '💝', '🩷'];
    setInterval(function () {
        const $heart = $('<div class="floating-heart"></div>');
        $heart.text(hearts[Math.floor(Math.random() * hearts.length)]);
        $heart.css({
            left: Math.random() * 100 + 'vw',
            fontSize: (0.8 + Math.random() * 1.5) + 'rem',
            animationDuration: (4 + Math.random() * 4) + 's'
        });
        $heartsBg.append($heart);
        setTimeout(function () { $heart.remove(); }, 8000);
    }, 300);

    // ===== NO BUTTON ESCAPE LOGIC =====

    const ESCAPE_RADIUS = 100;  // how close mouse can get before button runs
    const PADDING = 10;         // min distance from viewport edges

    // Get safe viewport bounds (excluding scrollbars)
    function getViewport() {
        return {
            w: document.documentElement.clientWidth,
            h: document.documentElement.clientHeight
        };
    }

    // Force position to always be inside the visible viewport
    function forceInsideViewport(x, y) {
        const vp = getViewport();
        const btnW = $noBtn.outerWidth();
        const btnH = $noBtn.outerHeight();
        x = Math.max(PADDING, Math.min(x, vp.w - btnW - PADDING));
        y = Math.max(PADDING, Math.min(y, vp.h - btnH - PADDING));
        return { x: x, y: y };
    }

    // Move the No button - always clamped to viewport
    function moveNoBtn(x, y) {
        const safe = forceInsideViewport(x, y);
        $noBtn.css({
            position: 'fixed',
            left: safe.x + 'px',
            top: safe.y + 'px',
            zIndex: 1000
        });
    }

    // Get button center
    function getBtnCenter() {
        const rect = $noBtn[0].getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    // Get container center
    function getContainerCenter() {
        const rect = $questionContainer[0].getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    // Calculate distance between two points
    function dist(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }

    function escapeFromCursor(mouseX, mouseY) {
        const vp = getViewport();
        const btnW = $noBtn.outerWidth();
        const btnH = $noBtn.outerHeight();
        const containerRect = $questionContainer[0].getBoundingClientRect();
        const containerCX = containerRect.left + containerRect.width / 2;
        const containerCY = containerRect.top + containerRect.height / 2;

        // Generate candidate positions around the container (close by)
        const candidates = [];
        const spots = 12;
        for (let i = 0; i < spots; i++) {
            const angle = (i / spots) * 2 * Math.PI;
            // Place buttons just outside the container edges
            const rx = containerRect.width / 2 + btnW / 2 + 20;
            const ry = containerRect.height / 2 + btnH / 2 + 20;
            const cx = containerCX + Math.cos(angle) * rx - btnW / 2;
            const cy = containerCY + Math.sin(angle) * ry - btnH / 2;
            candidates.push({ x: cx, y: cy });
        }

        // Also add positions at container edges (top/bottom/left/right centers)
        candidates.push({ x: containerCX - btnW / 2, y: containerRect.top - btnH - 15 });
        candidates.push({ x: containerCX - btnW / 2, y: containerRect.bottom + 15 });
        candidates.push({ x: containerRect.left - btnW - 15, y: containerCY - btnH / 2 });
        candidates.push({ x: containerRect.right + 15, y: containerCY - btnH / 2 });

        // Clamp all candidates inside viewport and score them
        let bestPos = null;
        let bestScore = -1;

        for (const c of candidates) {
            const safe = forceInsideViewport(c.x, c.y);
            const centerX = safe.x + btnW / 2;
            const centerY = safe.y + btnH / 2;
            const distFromMouse = dist(centerX, centerY, mouseX, mouseY);

            // Only consider positions far enough from cursor
            if (distFromMouse > ESCAPE_RADIUS * 0.8) {
                // Prefer positions closer to container but far from mouse
                const distFromContainer = dist(centerX, centerY, containerCX, containerCY);
                const score = distFromMouse - distFromContainer * 0.5;
                if (score > bestScore) {
                    bestScore = score;
                    bestPos = safe;
                }
            }
        }

        // Fallback: if no good candidate, just pick the one farthest from mouse
        if (!bestPos) {
            let maxDist = -1;
            for (const c of candidates) {
                const safe = forceInsideViewport(c.x, c.y);
                const d = dist(safe.x + btnW / 2, safe.y + btnH / 2, mouseX, mouseY);
                if (d > maxDist) {
                    maxDist = d;
                    bestPos = safe;
                }
            }
        }

        if (bestPos) {
            moveNoBtn(bestPos.x, bestPos.y);
        }
    }

    // ===== SNEAKY POPUP FOR TAB+ENTER =====

    const sneakyMessages = [
        "I knew you'd try Tab + Enter! Did you really think that would work? 😂",
        "Keyboard shortcuts won't save you from love! 🤣",
        "A for effort... but No is not an option here! 😏",
        "You really thought you could outsmart love with a keyboard? LOL 💀",
        "Roses are red, violets are blue, Tab+Enter won't help you! 😜",
        "Error 404: 'No' not found. Try clicking 'Yes' instead! 🤭",
        "Sneaky sneaky! But love always wins... just say Yes! 😂"
    ];

    const $sneakyPopup = $('#sneaky-popup');
    const $sneakyMessage = $('#sneaky-message');
    const $sneakyClose = $('#sneaky-close');

    function showSneakyPopup() {
        const msg = sneakyMessages[Math.floor(Math.random() * sneakyMessages.length)];
        $sneakyMessage.text(msg);
        $sneakyPopup.removeClass('hidden');
    }

    $sneakyClose.on('click', function () {
        $sneakyPopup.addClass('hidden');
    });

    // Catch Tab focus on No button - immediately show popup
    $noBtn.on('focus', function () {
        $noBtn.blur();
        showSneakyPopup();
    });

    // Also catch keydown on No button (Enter/Space)
    $noBtn.on('keydown keyup keypress', function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // Block all clicks on No button
    $noBtn.on('click mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // Touch support
    $noBtn.on('touchstart', function (e) {
        e.preventDefault();
        const touch = e.originalEvent.touches[0];
        escapeFromCursor(touch.clientX, touch.clientY);
    });

    // Track mouse on entire document
    $(document).on('mousemove', function (e) {
        // Only run if question container is visible
        if ($questionContainer.hasClass('hidden')) return;

        const btnCenter = getBtnCenter();
        const d = dist(btnCenter.x, btnCenter.y, e.clientX, e.clientY);

        if (d < ESCAPE_RADIUS) {
            escapeFromCursor(e.clientX, e.clientY);
        }
    });

    // Also ensure button stays in viewport on window resize
    $(window).on('resize', function () {
        const rect = $noBtn[0].getBoundingClientRect();
        moveNoBtn(rect.left, rect.top);
    });

    // ===== BACKGROUND MUSIC =====
    const bgMusic = $('#bg-music')[0];
    const $musicToggle = $('#music-toggle');
    let isMuted = false;

    function startBackgroundMusic() {
        bgMusic.volume = 0.3;
        var playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(function () {
                $(document).one('click', function () {
                    bgMusic.play();
                });
            });
        }
        $musicToggle.removeClass('hidden');
    }

    $musicToggle.on('click', function () {
        isMuted = !isMuted;
        bgMusic.muted = isMuted;
        $musicToggle.toggleClass('muted', isMuted);
        $musicToggle.find('.music-status').text(isMuted ? 'OFF' : 'ON');
    });

    // ===== LOVE LETTER =====
    const $envelopeWrapper = $('#envelope-wrapper');
    const $envelope = $envelopeWrapper.find('.envelope');
    const $letterPaper = $('#letter-paper');
    let envelopeOpened = false;

    $envelopeWrapper.on('click', function () {
        if (envelopeOpened) return;
        envelopeOpened = true;
        $envelope.addClass('opened');
        $envelopeWrapper.css('cursor', 'default');

        // Show the letter paper above the envelope
        setTimeout(function () {
            $letterPaper.removeClass('hidden');
            $letterPaper[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 600);

        // After reading time, show second loader below letter, then gift box
        setTimeout(function () {
            showLoveLoader($('#love-loader-2'), function () {
                $('#gift-box-section').removeClass('hidden');
                setTimeout(function () {
                    $('#gift-box-section')[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }, 2000);
        }, 4000);
    });

    // ===== GIFT BOX =====
    const $giftBox = $('#gift-box');
    const $giftBoxWrapper = $('#gift-box-wrapper');
    let giftOpened = false;

    $giftBoxWrapper.on('click', function () {
        if (giftOpened) return;
        giftOpened = true;

        // Shake
        $giftBox.addClass('shaking');

        // After shake, open lid
        setTimeout(function () {
            $giftBox.removeClass('shaking');
            $giftBox.addClass('opened');
            $giftBoxWrapper.css('cursor', 'default');
            $('.gift-label').fadeOut(300);

            // Reveal voucher cards
            setTimeout(function () {
                var $container = $('#voucher-cards-container');
                $container.removeClass('hidden');
                $container[0].scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Stagger card reveals
                $container.find('.voucher-card').each(function () {
                    var $card = $(this);
                    var delay = parseInt($card.data('delay')) || 0;
                    setTimeout(function () {
                        $card.addClass('revealed');
                    }, delay);
                });

                // Extra confetti after all cards
                setTimeout(function () {
                    createConfetti();
                }, 1600);
            }, 600);
        }, 700);
    });

    // ===== LOVE LOADER =====
    const loaderMessages = [
        'Preparing something special...',
        'Wrapping it with love...',
        'Adding extra hearts...',
        'Almost ready...'
    ];

    function showLoveLoader($loader, callback, duration) {
        var msgIndex = 0;
        $loader.removeClass('hidden');
        $loader.find('.love-loader-text').text(loaderMessages[0]);

        var interval = setInterval(function () {
            msgIndex = (msgIndex + 1) % loaderMessages.length;
            $loader.find('.love-loader-text').text(loaderMessages[msgIndex]);
        }, 800);

        setTimeout(function () {
            clearInterval(interval);
            $loader.addClass('hidden');
            if (callback) callback();
        }, duration);
    }

    // ===== YES BUTTON (updated with sequencing) =====
    $yesBtn.on('click', function () {
        $questionContainer.addClass('hidden');
        $successContainer.removeClass('hidden');
        $('body').addClass('success-active');
        createConfetti();
        startBackgroundMusic();

        // Show love loader, then reveal the love letter
        showLoveLoader($('#love-loader'), function () {
            $('#love-letter-section').removeClass('hidden');
            setTimeout(function () {
                $('#love-letter-section')[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }, 2500);
    });

    // Simple confetti effect
    function createConfetti() {
        const colors = ['#e91e63', '#ff5722', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0'];
        for (let i = 0; i < 50; i++) {
            const $confetti = $('<div></div>');
            $confetti.css({
                position: 'fixed',
                width: '10px',
                height: '10px',
                background: colors[Math.floor(Math.random() * colors.length)],
                left: Math.random() * 100 + 'vw',
                top: '-10px',
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
                animation: 'fall ' + (2 + Math.random() * 3) + 's linear forwards',
                zIndex: 999
            });
            $('body').append($confetti);
            setTimeout(function () { $confetti.remove(); }, 5000);
        }
        if ($('#confetti-style').length === 0) {
            $('head').append(
                '<style id="confetti-style">@keyframes fall { to { transform: translateY(100vh) rotate(720deg); opacity: 0; } }</style>'
            );
        }
    }
});
