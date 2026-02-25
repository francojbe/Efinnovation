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
                    document.querySelectorAll('.nav-links a').forEach(icon => icon.classList.remove('active'));
                    this.classList.add('active');
                }
            }
        });
    });

    // Mobile Menu Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = navToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                navToggle.querySelector('i').className = 'fas fa-bars';
            });
        });
    }

    const enableInfiniteLoop = () => {
        const tracks = document.querySelectorAll('.loop-track');
        tracks.forEach(track => {
            if (track.getAttribute('data-duplicated') === 'true') return;
            const content = track.innerHTML;
            track.innerHTML = content + content + content + content;
            track.setAttribute('data-duplicated', 'true');
        });
    };

    enableInfiniteLoop();

    const initBlurText = () => {
        const elements = document.querySelectorAll('[data-blur-text]');
        elements.forEach(el => {
            const processNode = (node) => {
                if (node.nodeType === 3) {
                    const text = node.textContent;
                    if (!text.trim()) return node;
                    const fragment = document.createDocumentFragment();
                    const words = text.split(/(\s+)/);
                    words.forEach(word => {
                        if (word.match(/^\s+$/)) {
                            fragment.appendChild(document.createTextNode(word));
                        } else if (word.trim()) {
                            const span = document.createElement('span');
                            span.classList.add('blur-word');
                            span.textContent = word;
                            fragment.appendChild(span);
                        }
                    });
                    return fragment;
                } else if (node.nodeType === 1) {
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
                        const words = entry.target.querySelectorAll('.blur-word');
                        words.forEach((word) => {
                            word.style.transitionDelay = '0ms';
                            word.classList.remove('visible');
                        });
                    }
                });
            }, { threshold: 0.1 });
            observer.observe(el);
        });
    };

    // initBlurText();

    const initAIChat = () => {
        const launcher = document.getElementById('ai-chat-launcher');
        const chatWindow = document.getElementById('ai-chat-window');
        const closeBtn = document.getElementById('close-chat');
        const sendBtn = document.getElementById('send-ai-msg');
        const userInput = document.getElementById('ai-user-input');
        const messageBox = document.getElementById('chat-messages');

        if (!launcher || !chatWindow || !userInput || !messageBox || !sendBtn) {
            console.warn('AI Chat components missing, skipping init.');
            return;
        }

        launcher.addEventListener('click', () => {
            chatWindow.classList.toggle('chat-window-hidden');
            if (!chatWindow.classList.contains('chat-window-hidden')) {
                userInput.focus();
            }
        });

        closeBtn.addEventListener('click', () => {
            chatWindow.classList.add('chat-window-hidden');
        });

        const appendMessage = (text, sender) => {
            const msgDiv = document.createElement('div');
            msgDiv.classList.add(sender === 'ai' ? 'chat-msg-ai' : 'chat-msg-user');
            const formattedText = text
                .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
            msgDiv.innerHTML = formattedText;
            messageBox.appendChild(msgDiv);
            messageBox.scrollTop = messageBox.scrollHeight;
        };

        const showTyping = () => {
            const typingDiv = document.createElement('div');
            typingDiv.classList.add('chat-msg-ai');
            typingDiv.id = 'ai-typing';
            typingDiv.innerHTML = '<span class="typing-dots">Efi está pensando...</span>';
            messageBox.appendChild(typingDiv);
            messageBox.scrollTop = messageBox.scrollHeight;
        };

        const removeTyping = () => {
            const typing = document.getElementById('ai-typing');
            if (typing) typing.remove();
        };

        const handleSend = async () => {
            const text = userInput.value.trim();
            if (!text) return;
            appendMessage(text, 'user');
            userInput.value = '';
            userInput.style.height = 'auto';
            showTyping();
            try {
                const response = await fetch('https://auto.efinnovation.cl/webhook/Efi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });
                if (response.ok) {
                    const data = await response.json();
                    removeTyping();
                    appendMessage(data.output || "He recibido tu mensaje correctamente.", 'ai');
                } else {
                    throw new Error('Network error');
                }
            } catch (err) {
                removeTyping();
                appendMessage("Lo siento, estoy teniendo problemas para conectarme con mi cerebro digital. ¿Podrías intentar contactarnos por WhatsApp mientras lo soluciono?", 'ai');
                console.error('Error connecting to n8n:', err);
            }
        };

        sendBtn.addEventListener('click', handleSend);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });

        userInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    };

    const initLeadMagnet = () => {
        const form = document.getElementById('lead-magnet-form');
        const statusDiv = document.getElementById('form-status');
        const phoneInput = document.getElementById('diag-phone');

        if (!form) {
            console.warn('Lead Magnet form missing, skipping init.');
            return;
        }

        // INICIALIZAR SELECTOR DE PAISES (Solo si existe el input y la libreria)
        let iti;
        if (phoneInput && typeof intlTelInput !== 'undefined') {
            iti = intlTelInput(phoneInput, {
                initialCountry: "cl",
                separateDialCode: true,
                placeholderNumberType: "MOBILE",
                utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@24.5.1/build/js/utils.js",
            });
        }

        // CONTROL DE OPCIONES "OTRO"
        const setupOtherOption = (selectId, customInputId) => {
            const select = document.getElementById(selectId);
            const customInput = document.getElementById(customInputId);
            if (!select || !customInput) return;

            select.addEventListener('change', (e) => {
                if (e.target.value === 'otro') {
                    customInput.style.display = 'block';
                    customInput.required = true;
                    customInput.focus();
                } else {
                    customInput.style.display = 'none';
                    customInput.required = false;
                }
            });
        };

        setupOtherOption('diag-industry', 'diag-industry-custom');
        setupOtherOption('diag-pain', 'diag-pain-custom');

        const submitBtn = form.querySelector('button[type="submit"]');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // UI State: Loading
            submitBtn.disabled = true;
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Analizando con Efi AI...</span> <i class="fas fa-spinner fa-spin"></i>';
            statusDiv.className = 'form-status';
            statusDiv.style.display = 'none';

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Normalizar datos si es "otro"
            if (data.industry === 'otro') data.industry = data.industry_custom;
            if (data.pain === 'otro') data.pain = data.pain_custom;

            // Capturar el teléfono formateado (con código de país)
            if (iti) {
                data.full_phone = iti.getNumber();
            }

            try {
                const response = await fetch('https://auto.efinnovation.cl/webhook/captura', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...data,
                        source: 'Lead Magnet - Web',
                        timestamp: new Date().toISOString()
                    })
                });

                if (response.ok) {
                    // EVENTO DE CONVERSIÓN GOOGLE (Via GTM DataLayer)
                    window.dataLayer = window.dataLayer || [];
                    window.dataLayer.push({
                        'event': 'generate_lead',
                        'event_category': 'diagnostic_form',
                        'event_label': data.industry || 'no_specified'
                    });

                    const responseText = await response.text();
                    let result = null;

                    try {
                        result = responseText ? JSON.parse(responseText) : null;
                    } catch (e) {
                        console.error("Response is not JSON:", responseText);
                    }

                    statusDiv.textContent = "¡Excelente! Diagnóstico generado correctamente.";
                    statusDiv.classList.add('success');
                    statusDiv.style.display = 'block';
                    form.reset();

                    // MOSTRAR MODAL DE RESULTADOS (POPUP)
                    const resultsModal = document.getElementById('modal-resultados');
                    const resultsContent = document.getElementById('diagnostico-resultado-content');

                    if (resultsModal && resultsContent) {
                        let contentToShow = "Estamos procesando tu informe. Si no aparece en unos segundos, revisa tu correo electrónico.";

                        if (result) {
                            const data = Array.isArray(result) ? result[0] : result;
                            contentToShow = data.output || data.data || data.message || JSON.stringify(data);
                        }

                        // Formateo básico de markdown para la ventana
                        resultsContent.innerHTML = contentToShow
                            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/\n/g, '<br>');

                        resultsModal.style.display = 'flex';
                    }

                } else {
                    throw new Error('Server responded with error');
                }
            } catch (err) {
                statusDiv.textContent = "Hubo un problema. ¿Podrías contactarnos por WhatsApp?";
                statusDiv.classList.add('error');
                statusDiv.style.display = 'block';
                console.error('Lead Magnet Error:', err);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    };

    initAIChat();
    initLeadMagnet();
});
