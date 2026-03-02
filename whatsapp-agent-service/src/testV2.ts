import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testV2() {
    const apiUrl = 'https://ia-odontologia-evolution-api.nojauc.easypanel.host';
    const apiKey = 'E2D8ADE7EB02-46CD-B671-E57080F9680C';
    const instance = 'Efinnovation.';
    const number = '56974263408';

    try {
        console.log(`🚀 Probando endpoint V2...`);
        const url = `${apiUrl}/message/sendText/${encodeURIComponent(instance)}`;
        const response = await axios.post(url, {
            number: number,
            text: 'Prueba V2 Directo'
        }, {
            headers: { 'apikey': apiKey }
        });
        console.log('✅ ÉXITO V2:', response.data);
    } catch (error: any) {
        console.error('❌ FALLA V2:', error.response?.data || error.message);
    }
}

testV2();
