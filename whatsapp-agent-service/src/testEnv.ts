import { sendWhatsAppMessage } from './evolutionService';
import dotenv from 'dotenv';

dotenv.config();

async function testFinalEnv() {
    const number = "56974263408@s.whatsapp.net";
    const alertMsg = `🔥 *PRUEBA CON CONFIG DEL .ENV* 🔥\n\nInstancia: ${process.env.EVOLUTION_INSTANCE_NAME}\n\nSi lees esto, el .env está perfecto.`;

    try {
        console.log(`🚀 Probando con instancia del .env: "${process.env.EVOLUTION_INSTANCE_NAME}"...`);
        const result = await sendWhatsAppMessage(number, alertMsg);
        console.log('✅ ENVÍO EXITOSO:', result);
    } catch (error: any) {
        console.error('❌ ERROR ASOCIADO:', error.response?.data || error.message);
    }
}

testFinalEnv();
