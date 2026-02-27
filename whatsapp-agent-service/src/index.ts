import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getAssistantResponse, createThread } from './openaiService';
import { sendWhatsAppMessage, sendWhatsAppButtons } from './evolutionService';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

dotenv.config();

const app = express();
app.use(express.json()); // Moved before cors as per edit
app.use(cors());

const PORT = process.env.PORT || 3000;

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Cola de mensajes para evitar respuestas múltiples (Debounce)
const messageQueues: { [key: string]: { timeout: NodeJS.Timeout, messages: string[] } } = {};
const WAIT_TIME = 4000; // 4 segundos de espera para ver si el usuario envía más mensajes

/**
 * Guarda un mensaje en el historial de Supabase.
 */
async function saveMessageToHistory(phone: string, role: string, content: string, metadata: any = {}) {
    try {
        await supabase.from('messages').insert([{
            phone,
            role,
            content,
            metadata: { ...metadata, timestamp: new Date().toISOString() }
        }]);
    } catch (e) {
        console.error('❌ Error guardando historial:', e);
    }
}

// --- Utilidades de Audio y Naturalidad ---

/**
 * Descarga archivos multimedia desde una URL (MinIO/S3).
 */
async function downloadMedia(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
}

/**
 * Obtiene la foto de perfil de WhatsApp desde Evolution API.
 */
async function getWhatsAppProfilePicture(remoteJid: string): Promise<string | null> {
    try {
        const instanceName = process.env.EVOLUTION_INSTANCE_NAME;
        const apiKey = process.env.EVOLUTION_API_KEY;
        const apiUrl = process.env.EVOLUTION_API_URL;
        const number = remoteJid.split('@')[0];

        const response = await axios.post(`${apiUrl}/chat/fetchProfilePictureUrl/${instanceName}`,
            { number },
            { headers: { 'apikey': apiKey } }
        );

        return response.data?.profilePictureUrl || response.data?.url || null;
    } catch (e) {
        console.error('⚠️ Error buscando foto de perfil:', e);
        return null;
    }
}

async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
    const openai = new (require('openai'))({ apiKey: process.env.OPENAI_API_KEY });

    // Guardar temporalmente para OpenAI (requiere archivo con nombre)
    const tempFile = path.join(__dirname, `temp_audio_${Date.now()}.ogg`);
    fs.writeFileSync(tempFile, audioBuffer);

    try {
        const response = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFile),
            model: "whisper-1",
            language: "es" // Forzamos español
        });
        return response.text;
    } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
}



/**
 * Envía respuestas fragmentadas y maneja la detección de botones interactivos.
 * Formato esperado de la IA: [[BUTTONS: Título | Descripción | Texto Botón 1 | ID1 | ...]]
 */
async function sendNaturalResponses(remoteJid: string, fullText: string) {
    // 1. Detectar si hay botones en el texto
    const buttonRegex = /\[\[BUTTONS:\s*(.*?)\s*\]\]/s;
    const match = fullText.match(buttonRegex);
    let cleanText = fullText.replace(buttonRegex, '').trim();

    // 2. Dividir y enviar el texto normal
    const fragments = cleanText.split(/\n\n|\. /).filter(f => f.trim().length > 0);

    for (let i = 0; i < fragments.length; i++) {
        let textToSend = fragments[i].trim();
        if (i < fragments.length - 1 && !textToSend.endsWith('.')) textToSend += '.';

        // Formateo estético (Negritas para énfasis)
        textToSend = textToSend.replace(/(automatización|IA|Efinnovation|ROI|Auditoría|ahorro)/gi, '*$1*');

        await sendWhatsAppMessage(remoteJid, textToSend);
        await saveMessageToHistory(remoteJid, 'assistant', textToSend);

        const delay = Math.min(2500, 800 + textToSend.length * 15);
        await new Promise(r => setTimeout(r, delay));
    }

    // 3. Si hay botones, enviarlos al final
    if (match) {
        const parts = match[1].split('|').map(p => p.trim());
        const [title, description, ...btnPairs] = parts;

        const buttons = [];
        for (let i = 0; i < btnPairs.length; i += 2) {
            if (btnPairs[i] && btnPairs[i + 1]) {
                const btnText = btnPairs[i];
                const btnId = btnPairs[i + 1];

                // Si el ID empieza por http, es un botón de URL (v2 lo soporta)
                if (btnId.startsWith('http')) {
                    buttons.push({ type: "url", displayText: btnText, url: btnId });
                } else {
                    buttons.push({ type: "reply", displayText: btnText, id: btnId });
                }
            }
        }

        if (buttons.length > 0) {
            console.log("🔘 Enviando botones interactivos...");
            await sendWhatsAppButtons(remoteJid, title, description, buttons);
            await saveMessageToHistory(remoteJid, 'assistant', `${title}\n${description}`, { type: 'buttons', buttons });
        }
    }
}

// Nombre de la tabla: 'whatsapp_threads' 
// Esquema esperado: { phone: string, thread_id: string }

app.get('/', (req, res) => {
    res.send('WhatsApp AI Agent Service is Running...');
});

// Webhook para Evolution API
app.post('/webhook/evolution', async (req, res) => {
    try {
        const data = req.body;

        // LOG DE DEPURACIÓN: Ver qué llega exactamente
        console.log('-------------------------------------------');
        console.log(`⚠️ Webhook recibido - Evento: ${data.event}`);

        // Validamos que sea un evento de mensaje y no sea de nosotros
        if (data.event !== 'messages.upsert' || data.data?.key?.fromMe) {
            console.log(`ℹ️ Evento ignorado: ${data.event} o mensaje propio.`);
            return res.status(200).send('Ignored');
        }

        const remoteJid = data.data?.key?.remoteJid;
        let incomingContent = "";

        // Detectar media (MinIO/S3) o Base64
        // Buscamos en el top-level (API v2) y en data (API v1)
        let mediaUrl = data.mediaUrl || data.data?.mediaUrl;

        if (mediaUrl && (mediaUrl.includes('whatsapp.net') || mediaUrl.includes('mmg.whatsapp.net'))) {
            console.log('ℹ️ URL detectada es de WhatsApp (encriptada). Ignorando para buscar Base64 decrypted.');
            mediaUrl = null;
        }

        const base64 = data.base64 || data.data?.base64 || data.data?.message?.base64;

        // Verificamos si es audio
        const audioData = data.data?.message?.audioMessage;
        if (audioData) {
            console.log(`🎤 Nota de voz recibida de ${remoteJid}. Procesando...`);
            let audioBuffer: Buffer | null = null;

            if (mediaUrl) {
                console.log(`📥 Descargando audio desde S3/MinIO: ${mediaUrl}`);
                audioBuffer = await downloadMedia(mediaUrl);
            } else if (base64) {
                console.log('🧬 Usando Base64 para transcripción (decodificando)...');
                audioBuffer = Buffer.from(base64, 'base64');
            }

            if (audioBuffer && audioBuffer.length > 100) {
                incomingContent = await transcribeAudio(audioBuffer);
                console.log(`📝 Transcripción: "${incomingContent}"`);
            } else {
                incomingContent = "[Nota de voz no procesable]";
                console.log('⚠️ No se pudo obtener el audio válido (URL externa o Base64 ausente).');
            }
        } else {
            incomingContent =
                data.data?.message?.conversation ||
                data.data?.message?.extendedTextMessage?.text ||
                data.data?.message?.imageMessage?.caption ||
                "";

            if (data.data?.message?.imageMessage) {
                incomingContent = `[IMAGEN RECIBIDA: ${mediaUrl || 'S/URL'}] ${incomingContent}`;
            }
        }

        if (!incomingContent || incomingContent.trim() === "") {
            console.log('ℹ️ El mensaje no contiene texto procesable.');
            return res.status(200).send('No content');
        }

        console.log(`📩 Mensaje de ${remoteJid}: "${incomingContent}"`);

        // --- LÓGICA DE ESPERA (DEBOUNCE) ---
        if (!messageQueues[remoteJid]) {
            messageQueues[remoteJid] = { timeout: setTimeout(() => { }, 0), messages: [] };
        }

        clearTimeout(messageQueues[remoteJid].timeout);
        messageQueues[remoteJid].messages.push(incomingContent);

        messageQueues[remoteJid].timeout = setTimeout(async () => {
            const allMessages = messageQueues[remoteJid].messages.join(" ");
            messageQueues[remoteJid].messages = []; // Limpiamos para la siguiente vez

            console.log(`-------------------------------------------`);
            console.log(`📩 Procesando acumulado de ${remoteJid}: "${allMessages}"`);
            await saveMessageToHistory(remoteJid, 'user', allMessages);

            try {
                // 1. Buscamos o creamos el Thread ID en Supabase
                let threadId: string | null = null;
                const { data: threadData } = await supabase
                    .from('whatsapp_threads')
                    .select('thread_id')
                    .eq('phone', remoteJid)
                    .maybeSingle();

                if (threadData) {
                    threadId = threadData.thread_id;
                    console.log(`🧵 Usando hilo existente: ${threadId}`);
                } else {
                    console.log(`🆕 Creando nuevo hilo para ${remoteJid}...`);
                    threadId = await createThread();
                    await supabase
                        .from('whatsapp_threads')
                        .insert([{ phone: remoteJid, thread_id: threadId }]);
                }

                if (!threadId) throw new Error('No se pudo gestionar el Thread ID');

                // --- GESTIÓN DE INACTIVIDAD (NUDGE) ---
                const inactivityTimers: { [key: string]: NodeJS.Timeout } = {};
                const NUDGE_WAIT_TIME = 15 * 60 * 1000; // 15 minutos

                async function scheduleInactivityNudge(remoteJid: string, threadId: string) {
                    if (inactivityTimers[remoteJid]) clearTimeout(inactivityTimers[remoteJid]);

                    inactivityTimers[remoteJid] = setTimeout(async () => {
                        try {
                            // Verificar si el hilo sigue activo y si ya se mandó un nudge recientemente
                            const { data } = await supabase.from('whatsapp_threads').select('last_nudge_sent_at').eq('phone', remoteJid).single();

                            const lastNudge = data?.last_nudge_sent_at ? new Date(data.last_nudge_sent_at).getTime() : 0;
                            const now = Date.now();

                            // Solo enviar si pasaron más de 2 horas desde el último nudge para no ser SPAM
                            if (now - lastNudge > 2 * 60 * 60 * 1000) {
                                const nudgeMsg = "¿Sigues por ahí? 🤔 Me gustaría asegurarme de que no tengas dudas pendientes para poder avanzar con tu estrategia de IA.";
                                await sendWhatsAppMessage(remoteJid, nudgeMsg);
                                await saveMessageToHistory(remoteJid, 'assistant', nudgeMsg, { type: 'nudge' });
                                await supabase.from('whatsapp_threads').update({ last_nudge_sent_at: new Date().toISOString() }).eq('phone', remoteJid);
                                console.log(`🔔 Nudge de inactividad enviado a ${remoteJid}`);
                            }
                        } catch (e) {
                            console.error('❌ Error enviando nudge:', e);
                        }
                    }, NUDGE_WAIT_TIME);
                }

                // --- UTILIDADES DE EXTRACCIÓN PASIVA ---
                function extractPassiveData(text: string) {
                    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                    const rutRegex = /\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/g;

                    const email = text.match(emailRegex)?.[0];
                    const rut = text.match(rutRegex)?.[0];

                    return { email, rut };
                }

                // ... rest of the code ...

                // EXTRA: Sincronización de Foto de Perfil (Inspirado en PitonB)
                const profilePic = await getWhatsAppProfilePicture(remoteJid);

                // EXTRA: Extracción Pasiva de datos (RUT/Email)
                const passiveData = extractPassiveData(allMessages);

                if (profilePic || passiveData.email || passiveData.rut) {
                    await supabase.from('leads').upsert({
                        phone: remoteJid,
                        email: passiveData.email,
                        metadata: {
                            profile_picture: profilePic,
                            rut_detected: passiveData.rut
                        }
                    }, { onConflict: 'phone' });
                }

                // 2. IA Alejandro (Pasamos el cliente de Supabase para que pueda guardar leads)
                console.log('🤖 Consultando a Alejandro...');

                // EXTRA: Inyectar reglas aprendidas (RAG de aprendizaje simplificado)
                const { data: learnings } = await supabase.from('agent_learnings').select('proposed_rule').eq('status', 'approved').limit(5);
                const learningContext = learnings?.map(l => l.proposed_rule).join('\n') || "";
                const messageWithContext = learningContext ? `CONTEXTO DE APRENDIZAJE:\n${learningContext}\n\nMENSAJE USUARIO: ${allMessages}` : allMessages;

                const aiResponse = await getAssistantResponse(threadId, messageWithContext, supabase, remoteJid);
                console.log(`🤖 Alejandro dice: "${aiResponse.substring(0, 50)}..."`);

                // 3. Enviamos de vuelta a WhatsApp de forma fragmentada
                await sendNaturalResponses(remoteJid, aiResponse);
                console.log(`✅ Respuesta enviada con éxito a ${remoteJid}`);

                // Programar Nudge de Inactividad
                scheduleInactivityNudge(remoteJid, threadId);

            } catch (err) {
                console.error('❌ Error procesando respuesta en cola:', err);
            }
        }, WAIT_TIME);

        res.status(200).send('Queued');

    } catch (error) {
        console.error('❌ Error en el Webhook:', error);
        res.status(200).send('Error handled'); // Respondemos 200 para que Evolution no reintente infinitamente
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});
