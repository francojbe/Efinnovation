import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testV2Header() {
    const apiUrl = 'https://ia-odontologia-evolution-api.nojauc.easypanel.host';
    const apiKey = 'E2D8ADE7EB02-46CD-B671-E57080F9680C';
    const instance = 'Efinnovation';
    const number = '56974263408';

    try {
        console.log(`🚀 Probando endpoint V2 con Apikey en header...`);
        // Probamos con Apikey (Mayúscula inicial) que es común en Evolution
        const url = `${apiUrl}/message/sendText/${instance}`;
        const response = await axios.post(url, {
            number: number,
            text: 'Prueba Header Apikey Case'
        }, {
            headers: { 'Apikey': apiKey }
        });
        console.log('✅ ÉXITO:', response.data);
    } catch (error: any) {
        console.error('❌ FALLA (Apikey):', error.response?.data || error.message);
    }
}

testV2Header();
