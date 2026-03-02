import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testJid() {
    const apiUrl = 'https://ia-odontologia-evolution-api.nojauc.easypanel.host';
    const apiKey = 'E2D8ADE7EB02-46CD-B671-E57080F9680C';
    const instance = 'Pitron Beña';
    const jid = '56974263408@s.whatsapp.net';

    const alertMsg = `🔥 *HOT LEAD DETECTADO (TEST JID)* 🔥\n\nPrueba de envío con JID completo.`;

    try {
        console.log('🚀 Enviando prueba con JID...');
        const url = `${apiUrl}/message/sendText/${encodeURIComponent(instance)}`;
        const response = await axios.post(url, {
            number: jid,
            text: alertMsg
        }, {
            headers: { 'apikey': apiKey }
        });
        console.log('✅ Éxito:', response.data);
    } catch (error: any) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testJid();
