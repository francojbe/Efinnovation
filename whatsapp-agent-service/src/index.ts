import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getAssistantResponse, createThread } from './openaiService';
import { sendWhatsAppMessage } from './evolutionService';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

        // Validamos que sea un evento de mensaje
        if (data.event !== 'messages.upsert') {
            console.log(`ℹ️ Evento ignorado: ${data.event}`);
            return res.status(200).send('Event Ignored');
        }

        // Evitar bucles (no responder a mensajes enviados por el propio bot)
        if (data.data?.key?.fromMe) {
            console.log('ℹ️ Mensaje enviado por mí, ignorando para evitar bucle.');
            return res.status(200).send('Ignored self message');
        }

        const remoteJid = data.data?.key?.remoteJid;
        // La Evolution API v2 puede enviar el texto en varios lugares según el tipo de mensaje
        const messageText =
            data.data?.message?.conversation ||
            data.data?.message?.extendedTextMessage?.text ||
            data.data?.message?.imageMessage?.caption ||
            "";

        if (!messageText || messageText.trim() === "") {
            console.log('ℹ️ El mensaje no contiene texto procesable.');
            return res.status(200).send('No text content');
        }

        console.log(`📩 Mensaje de ${remoteJid}: "${messageText}"`);

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

        // 2. Obtenemos respuesta de la IA (Alejandro)
        console.log('🤖 Consultando a Alejandro (OpenAI)...');
        const aiResponse = await getAssistantResponse(threadId, messageText);
        console.log(`🤖 Alejandro dice: "${aiResponse.substring(0, 50)}..."`);

        // 3. Enviamos de vuelta a WhatsApp
        await sendWhatsAppMessage(remoteJid, aiResponse);
        console.log(`✅ Respuesta enviada con éxito a ${remoteJid}`);

        res.status(200).send('OK');

    } catch (error) {
        console.error('❌ Error en el Webhook:', error);
        res.status(200).send('Error but handled'); // Respondemos 200 para que Evolution no reintente infinitamente
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});
