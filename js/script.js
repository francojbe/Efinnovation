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

    initAIChat();
});
