import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testV1() {
    const apiUrl = 'https://ia-odontologia-evolution-api.nojauc.easypanel.host';
    const apiKey = 'E2D8ADE7EB02-46CD-B671-E57080F9680C';
    const instance = 'Efinnovation.';
    const number = '56974263408';

    try {
        console.log(`🚀 Probando endpoint V1 (/message/sendText)...`);
        // En V1 a veces el endpoint no lleva la instancia en la URL sino en el body
        const url = `${apiUrl}/message/sendText`;
        const response = await axios.post(url, {
            instance: instance,
            number: number,
            text: 'Prueba V1 Body'
        }, {
            headers: { 'apikey': apiKey }
        });
        console.log('✅ ÉXITO V1:', response.data);
    } catch (error: any) {
        console.error('❌ FALLA V1:', error.response?.data || error.message);
    }
}

testV1();
