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
        // Codificamos el nombre de la instancia por si tiene espacios
        const safeInstanceName = encodeURIComponent(instanceName || '');
        const url = `${apiUrl}/message/sendText/${safeInstanceName}`;

        console.log(`📤 Enviando a Evolution API (${safeInstanceName})...`);

        const response = await axios.post(url, {
            number: remoteJid, // Evolution v2 acepta JID completo
            text: text,
            delay: 1200,
            linkPreview: false,
            presence: 'composing'
        }, {
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error: any) {
        const errorData = error?.response?.data || error.message;
        console.error('❌ Error enviando mensaje a Evolution API:', JSON.stringify(errorData, null, 2));
        throw error; // Re-lanzamos para que index.ts sepa que falló
    }
}
