import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testMultiple() {
    const apiUrl = 'https://ia-odontologia-evolution-api.nojauc.easypanel.host';
    const apiKey = 'E2D8ADE7EB02-46CD-B671-E57080F9680C';
    const number = '56974263408';

    const instances = ['Alejandro', 'Pitron-Bena', 'PitronBeña', 'ia-odontologia', 'ia_odontologia', 'PitonB'];

    for (const inst of instances) {
        console.log(`🚀 Probando instancia: ${inst}`);
        try {
            const url = `${apiUrl}/message/sendText/${encodeURIComponent(inst)}`;
            const response = await axios.post(url, {
                number: number,
                text: `Prueba con instancia: ${inst}`
            }, {
                headers: { 'apikey': apiKey }
            });
            console.log(`✅ ÉXITO con ${inst}:`, response.data);
            break;
        } catch (error: any) {
            console.log(`❌ Falla con ${inst} (Status: ${error.response?.status})`);
        }
    }
}

testMultiple();
