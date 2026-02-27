import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const apiUrl = process.env.EVOLUTION_API_URL;
const apiKey = process.env.EVOLUTION_API_KEY;
const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

/**
 * Envía un mensaje de texto a través de Evolution API.
 * @param remoteJid El ID del contacto (ej: 56912345678@s.whatsapp.net).
 * @param text El contenido del mensaje.
 */
export async function sendWhatsAppMessage(remoteJid: string, text: string) {
    try {
        const url = `${apiUrl}/message/sendText/${instanceName}`;

        const response = await axios.post(url, {
            number: remoteJid,
            options: {
                delay: 1200, // Un pequeño retraso para parecer más humano
                presence: 'composing', // Muestra "escribiendo..." en WhatsApp
                linkPreview: false,
            },
            textMessage: {
                text: text
            }
        }, {
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error: any) {
        console.error('Error enviando mensaje a Evolution API:', error?.response?.data || error.message);
    }
}
