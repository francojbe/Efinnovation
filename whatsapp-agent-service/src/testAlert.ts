import { sendWhatsAppMessage } from './evolutionService';
import dotenv from 'dotenv';

dotenv.config();

async function testAlert() {
    const alertMsg = `🔥 *HOT LEAD DETECTADO (PRUEBA)* 🔥\n\n*Empresa:* Inmobiliaria Los Andes\n*Nombre:* Franco Blanco\n*Dolor:* Pérdida de 20h/semana cargando leads de portales a Excel.\n*Score:* 10/10\n*Tipo:* Dueño Pyme\n\nAlejandro está manejando el cierre ahora mismo. 🚀`;

    console.log('🚀 Enviando prueba de mensaje "Pez Gordo" a Franco...');

    try {
        const result = await sendWhatsAppMessage("56974263408@s.whatsapp.net", alertMsg);
        console.log('✅ Resultado:', result);
    } catch (error) {
        console.error('❌ Error enviando la prueba:', error);
    }
}

testAlert();
