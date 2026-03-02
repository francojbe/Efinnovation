import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testSimple() {
    const apiUrl = 'https://ia-odontologia-evolution-api.nojauc.easypanel.host';
    const apiKey = 'E2D8ADE7EB02-46CD-B671-E57080F9680C';
    const instance = 'Pitron Beña';
    const number = '56974263408';

    const alertMsg = `🔥 *HOT LEAD DETECTADO (PRUEBA)* 🔥\n\n*Empresa:* Inmobiliaria Los Andes\n*Nombre:* Franco Blanco\n*Dolor:* Pérdida de 20h/semana.\n*Score:* 10/10\n\nAlejandro está manejando el cierre. 🚀`;

    try {
        console.log('🚀 Enviando prueba simple...');
        const url = `${apiUrl}/message/sendText/${encodeURIComponent(instance)}`;
        const response = await axios.post(url, {
            number: number,
            text: alertMsg
        }, {
            headers: { 'apikey': apiKey }
        });
        console.log('✅ Éxito:', response.data);
    } catch (error: any) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testSimple();
