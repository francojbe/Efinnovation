import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const apiUrl = process.env.EVOLUTION_API_URL;
const apiKey = process.env.EVOLUTION_API_KEY;
const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

/**
 * Envía un mensaje de texto con formato humanizado.
 */
export async function sendWhatsAppMessage(remoteJid: string, text: string) {
    return callEvolutionAPI('sendText', {
        number: remoteJid,
        text: text,
        delay: 1500,
        linkPreview: true,
        presence: 'composing'
    });
}

/**
 * Envía un mensaje con botones interactivos (Ideal para CTAs de Auditoría).
 */
export async function sendWhatsAppButtons(remoteJid: string, title: string, description: string, buttons: any[], footer: string = "Efinnovation") {
    return callEvolutionAPI('sendButtons', {
        number: remoteJid,
        title: title,
        description: description,
        footer: footer,
        buttons: buttons
    });
}

/**
 * Envía un menú de lista (Ideal para elegir servicios).
 */
export async function sendWhatsAppList(remoteJid: string, title: string, description: string, buttonText: string, sections: any[]) {
    return callEvolutionAPI('sendList', {
        number: remoteJid,
        title: title,
        description: description,
        buttonText: buttonText,
        footerText: "Efinnovation - Consultoría",
        values: sections
    });
}

/**
 * Envía contenido multimedia (Imágenes/Docs) con caption formateado.
 */
export async function sendWhatsAppMedia(remoteJid: string, mediaUrl: string, mediaType: 'image' | 'document' | 'video', caption: string, fileName: string = "file") {
    return callEvolutionAPI('sendMedia', {
        number: remoteJid,
        mediatype: mediaType,
        mimetype: mediaType === 'image' ? 'image/png' : 'application/pdf',
        caption: caption,
        media: mediaUrl,
        fileName: fileName,
        options: {
            delay: 1200,
            presence: 'composing'
        }
    });
}

/**
 * Función base para centralizar los llamados a Evolution API.
 */
async function callEvolutionAPI(endpoint: string, payload: any) {
    try {
        const safeInstanceName = encodeURIComponent(instanceName || '');
        const url = `${apiUrl}/message/${endpoint}/${safeInstanceName}`;

        console.log(`📤 Enviando a Evolution API (${endpoint})...`);

        const response = await axios.post(url, payload, {
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error: any) {
        const errorData = error?.response?.data || error.message;
        console.error(`❌ Error en Evolution API (${endpoint}):`, JSON.stringify(errorData, null, 2));
        throw error;
    }
}
