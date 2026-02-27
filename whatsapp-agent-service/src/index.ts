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

        // Validamos que sea un evento de mensaje enviado por el cliente (no por nosotros)
        if (data.event !== 'messages.upsert' || data.data.key.fromMe) {
            return res.status(200).send('Event Ignored');
        }

        const remoteJid = data.data.key.remoteJid;
        const messageText = data.data.message?.conversation ||
            data.data.message?.extendedTextMessage?.text;

        if (!messageText) {
            return res.status(200).send('No text found in message');
        }

        console.log(`📩 Mensaje de ${remoteJid}: ${messageText}`);

        // 1. Buscamos el Thread ID en Supabase para este usuario
        let threadId: string | null = null;

        const { data: threadData, error: dbError } = await supabase
            .from('whatsapp_threads')
            .select('thread_id')
            .eq('phone', remoteJid)
            .single();

        if (threadData) {
            threadId = threadData.thread_id;
        } else {
            console.log(`🆕 No hay hilo previo para ${remoteJid}. Creando uno nuevo...`);
            threadId = await createThread();

            // Guardamos el nuevo hilo en la base de datos
            const { error: insertError } = await supabase
                .from('whatsapp_threads')
                .insert([{ phone: remoteJid, thread_id: threadId }]);

            if (insertError) console.error('Error guardando thread en Supabase:', insertError);
        }

        if (!threadId) throw new Error('No se pudo obtener un ID de hilo.');

        // 2. Obtenemos respuesta de la IA (Esto puede tardar unos segundos)
        const aiResponse = await getAssistantResponse(threadId, messageText);

        // 3. Enviamos la respuesta de vuelta a WhatsApp
        await sendWhatsAppMessage(remoteJid, aiResponse);

        res.status(200).send('OK');

    } catch (error) {
        console.error('Error procesando webhook:', error);
        res.status(500).send('Internal Error');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});
