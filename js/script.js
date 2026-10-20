document.addEventListener('DOMContentLoaded', () => {
    // 1. Smooth Navigation & Active Link Highlight
    document.querySelectorAll('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    e.preventDefault();
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
                    if (!this.classList.contains('nav-cta-btn')) {
                        this.classList.add('active');
                    }
                }
            }
        });
    });

    // 2. Mobile Menu Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navLinks.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
            const icon = navToggle.querySelector('i');
            if (icon) {
                icon.className = isExpanded ? 'fas fa-times' : 'fas fa-bars';
            }
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                const icon = navToggle.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
            });
        });
    }

    // 3. Lead Form Submission (Direct WhatsApp + Analytics Conversion without n8n webhook dependency)
    const initLeadForm = () => {
        const form = document.getElementById('auditoria-form');
        const statusDiv = document.getElementById('form-status');
        const phoneInput = document.getElementById('diag-phone');

        if (!form) return;

        let iti = null;
        if (phoneInput && typeof window.intlTelInput !== 'undefined') {
            try {
                iti = window.intlTelInput(phoneInput, {
                    initialCountry: 'cl',
                    separateDialCode: true,
                    placeholderNumberType: 'MOBILE',
                    utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@24.5.1/build/js/utils.js'
                });
            } catch (err) {
                console.warn('Phone input init warning:', err);
            }
        }

        // Track form_start micro-conversion once per session
        let formStarted = false;
        form.addEventListener('focusin', () => {
            if (!formStarted) {
                formStarted = true;
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    'event': 'form_start',
                    'form_id': 'auditoria-form',
                    'form_name': 'Diagnóstico Inicial B2B'
                });
            }
        });

        // Optional "other" custom field reveal
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

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Procesando solicitud...</span> <i class="fas fa-spinner fa-spin"></i>';
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const painSelect = document.getElementById('diag-pain');
            const industrySelect = document.getElementById('diag-industry');

            const painLabel = data.pain === 'otro'
                ? (data.pain_custom || 'Otro')
                : (painSelect && painSelect.options[painSelect.selectedIndex] ? painSelect.options[painSelect.selectedIndex].text : (data.pain || 'Diagnóstico general'));

            const industryLabel = data.industry === 'otro'
                ? (data.industry_custom || 'Otro')
                : (industrySelect && industrySelect.options[industrySelect.selectedIndex] ? industrySelect.options[industrySelect.selectedIndex].text : (data.industry || 'No especificado'));

            let fullPhone = data.phone || '';
            if (iti && typeof iti.getNumber === 'function') {
                const formatted = iti.getNumber();
                if (formatted) fullPhone = formatted;
            }

            // Build structured message for WhatsApp & Gracias page
            const waText = encodeURIComponent(
                `Hola Franco (Efinnovation), solicito un diagnóstico inicial:\n\n` +
                `• Nombre: ${data.name || ''}\n` +
                `${data.company ? '• Empresa/Cargo: ' + data.company + '\n' : ''}` +
                `• Correo: ${data.email || ''}\n` +
                `• Teléfono: ${fullPhone}\n` +
                `• Prioridad: ${painLabel}\n` +
                `• Tamaño/Rubro: ${industryLabel}` +
                `${data.message ? '\n• Detalle: ' + data.message : ''}`
            );
            const waUrl = `https://wa.me/56974263408?text=${waText}`;

            try {
                sessionStorage.setItem('efi_last_wa_url', waUrl);
            } catch (_) {}

            // Push confirmed lead event to GTM DataLayer
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                'event': 'generate_lead',
                'event_category': 'diagnostic_form',
                'form_id': 'auditoria-form',
                'event_label': data.pain || 'general'
            });

            if (statusDiv) {
                statusDiv.textContent = '¡Solicitud preparada! Redirigiendo...';
                statusDiv.classList.add('success');
                statusDiv.style.display = 'block';
            }

            window.open(waUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => {
                window.location.href = '/gracias.html';
            }, 350);
        });
    };

    // 4. Clean Analytics & Micro-conversion Tracking
    const initTracking = () => {
        const whatsappLinks = document.querySelectorAll('a[href*="wa.me"], a.whatsapp-float');
        whatsappLinks.forEach(link => {
            link.addEventListener('click', () => {
                const location = link.getAttribute('data-cta-location') ||
                    (link.classList.contains('whatsapp-float') ? 'floating_button' : 'inline_cta');
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    'event': 'click_whatsapp',
                    'event_category': 'micro_conversion',
                    'cta_location': location
                });
            });
        });

        const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
        emailLinks.forEach(link => {
            link.addEventListener('click', () => {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    'event': 'click_email',
                    'event_category': 'micro_conversion'
                });
            });
        });
    };

    initLeadForm();
    initTracking();
});
