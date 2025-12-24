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

    // AI Chatbot Logic (n8n ready)
    const initAIChat = () => {
        const launcher = document.getElementById('ai-chat-launcher');
        const chatWindow = document.getElementById('ai-chat-window');
        const closeBtn = document.getElementById('close-chat');
        const sendBtn = document.getElementById('send-ai-msg');
        const userInput = document.getElementById('ai-user-input');
        const messageBox = document.getElementById('chat-messages');

        // Toggle Chat
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
            msgDiv.textContent = text;
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
                // AQUÍ ESTÁ TU WEBHOOK DE n8n CONECTADO
                const response = await fetch('https://recuperadora-n8n.nojauc.easypanel.host/webhook/Efi', {
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

        // Auto-resize textarea
        userInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    };

    initAIChat();
});
