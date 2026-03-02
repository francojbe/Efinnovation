import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testFinalAttempt() {
    const apiUrl = 'https://ia-odontologia-evolution-api.nojauc.easypanel.host';
    const apiKey = 'E2D8ADE7EB02-46CD-B671-E57080F9680C';
    const instance = 'Efinnovation.';
    const number = '56974263408';

    const alertMsg = `🔥 *PRUEBA DEFINITIVA* 🔥\n\nSi lees esto, Alejandro está 100% operativo.`;

    try {
        console.log(`🚀 Intentando envío final a: "${instance}"...`);
        // Usamos el endpoint con y sin /v2 por si acaso, aunque Evolution suele ser directo
        const url = `${apiUrl}/message/sendText/${encodeURIComponent(instance)}`;
        const response = await axios.post(url, {
            number: number,
            text: alertMsg
        }, {
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ ENVÍO EXITOSO:', response.data);
    } catch (error: any) {
        console.error('❌ ERROR ASOCIADO:', error.response?.data || error.message);
    }
}

testFinalAttempt();
