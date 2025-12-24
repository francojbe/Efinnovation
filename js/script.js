document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Actualizar clase activa (opcional)
                    document.querySelectorAll('.nav-links a').forEach(icon => icon.classList.remove('active'));
                    this.classList.add('active');
                }
            }
        });
    });

    // Infinite Logo Loop Logic
    const enableInfiniteLoop = () => {
        const tracks = document.querySelectorAll('.loop-track');

        tracks.forEach(track => {
            // Check if already duplicated to avoid exponential growth on resize if we were watching that
            if (track.getAttribute('data-duplicated') === 'true') return;

            const content = track.innerHTML;
            // Duplicate content 4 times to ensure enough buffer for big screens
            track.innerHTML = content + content + content + content;
            track.setAttribute('data-duplicated', 'true');
        });
    };

    enableInfiniteLoop();

    // BlurText Logic
    const initBlurText = () => {
        const elements = document.querySelectorAll('[data-blur-text]');

        elements.forEach(el => {
            // Process text nodes into spans
            const processNode = (node) => {
                if (node.nodeType === 3) { // Text node
                    const text = node.textContent;
                    if (!text.trim()) return node; // Skip empty whitespace

                    const fragment = document.createDocumentFragment();
                    const words = text.split(/(\s+)/); // Split by whitespace but keep delimiters to preserve spacing

                    words.forEach(word => {
                        if (word.match(/^\s+$/)) {
                            // It's whitespace
                            fragment.appendChild(document.createTextNode(word));
                        } else if (word.trim()) {
                            // It's a word
                            const span = document.createElement('span');
                            span.classList.add('blur-word');
                            span.textContent = word;
                            fragment.appendChild(span);
                        }
                    });
                    return fragment;
                } else if (node.nodeType === 1) { // Element node (like <br> or <span>)
                    // Recurse for children if any, otherwise just leave it
                    const childNodes = Array.from(node.childNodes);
                    childNodes.forEach(child => {
                        const newChild = processNode(child);
                        if (newChild !== child) {
                            node.replaceChild(newChild, child);
                        }
                    });
                    return node;
                }
                return node;
            };

            const childNodes = Array.from(el.childNodes);
            childNodes.forEach(child => {
                const newChild = processNode(child);
                if (newChild !== child) {
                    el.replaceChild(newChild, child);
                }
            });

            // Observer to trigger animation
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const words = entry.target.querySelectorAll('.blur-word');
                        words.forEach((word, index) => {
                            word.style.transitionDelay = `${index * 120}ms`;
                            setTimeout(() => {
                                word.classList.add('visible');
                            }, 50);
                        });
                    } else {
                        // Reset when leaving the view so it can animate again
                        const words = entry.target.querySelectorAll('.blur-word');
                        words.forEach((word) => {
                            word.style.transitionDelay = '0ms'; // No delay when resetting
                            word.classList.remove('visible');
                        });
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(el);
        });
    };

    initBlurText();
});
