import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testV2NoSlash() {
    const apiUrl = 'https://ia-odontologia-evolution-api.nojauc.easypanel.host';
    const apiKey = 'E2D8ADE7EB02-46CD-B671-E57080F9680C';
    const instance = 'Efinnovation.'; // Probando con el punto final exacto de la captura
    const number = '56974263408';

    const alertMsg = `🔥 *PRUEBA CON PUNTO FINAL* 🔥\n\nInstancia: Efinnovation.`;

    try {
        console.log(`🚀 Probando con punto final en el nombre: "${instance}"...`);
        const url = `${apiUrl}/message/sendText/${encodeURIComponent(instance)}`;
        const response = await axios.post(url, {
            number: number,
            text: alertMsg
        }, {
            headers: { 'apikey': apiKey }
        });
        console.log('✅ ÉXITO:', response.data);
    } catch (error: any) {
        console.error('❌ FALLA:', error.response?.data || error.message);
    }
}

testV2NoSlash();
