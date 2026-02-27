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

// --- Utilidades de Audio y Naturalidad ---

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
                    buttons.push({ title: "url", displayText: btnText, url: btnId });
                } else {
                    buttons.push({ title: "reply", displayText: btnText, id: btnId });
                }
            }
        }

        if (buttons.length > 0) {
            console.log("🔘 Enviando botones interactivos...");
            await sendWhatsAppButtons(remoteJid, title, description, buttons);
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

        // Verificamos si es audio
        const audioData = data.data?.message?.audioMessage;
        if (audioData) {
            console.log(`🎤 Nota de voz recibida de ${remoteJid}. Transcribiendo...`);
            // Evolution API envía el audio en base64 en el data.data.base64 si está configurado,
            // o debemos descargarlo. Si no viene en el webhook, hay que pedirlo a la API.
            // Para simplicidad en este MVP, asumimos que viene o lo ignoramos si no hay buffer.
            if (data.data.base64) {
                const buffer = Buffer.from(data.data.base64, 'base64');
                incomingContent = await transcribeAudio(buffer);
                console.log(`📝 Transcripción: "${incomingContent}"`);
            } else {
                incomingContent = "[Nota de voz sin contenido procesable]";
                console.log('ℹ️ Nota de voz sin base64 en el webhook, ignorando.');
            }
        } else {
            incomingContent =
                data.data?.message?.conversation ||
                data.data?.message?.extendedTextMessage?.text ||
                data.data?.message?.imageMessage?.caption ||
                "";
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

                // 2. IA Alejandro (Pasamos el cliente de Supabase para que pueda guardar leads)
                console.log('🤖 Consultando a Alejandro...');
                const aiResponse = await getAssistantResponse(threadId, allMessages, supabase);
                console.log(`🤖 Alejandro dice: "${aiResponse.substring(0, 50)}..."`);

                // 3. Enviamos de vuelta a WhatsApp de forma fragmentada
                await sendNaturalResponses(remoteJid, aiResponse);
                console.log(`✅ Respuesta enviada con éxito a ${remoteJid}`);

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
