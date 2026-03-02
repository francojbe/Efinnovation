import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function checkInstance() {
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

    console.log(`🔍 Verificando instancia: ${instanceName}`);
    console.log(`🔗 URL: ${apiUrl}`);

    try {
        const response = await axios.get(`${apiUrl}/instance/fetchInstances`, {
            headers: { 'apikey': apiKey }
        });
        console.log('✅ Instancias encontradas:', JSON.stringify(response.data, null, 2));

        const instance = response.data.find((i: any) => i.instanceName === instanceName);
        if (instance) {
            console.log('🟢 Instancia encontrada y activa:', instance.status);
        } else {
            console.log('🔴 Instancia no encontrada en la lista.');
        }
    } catch (error: any) {
        console.error('❌ Error verificando instancia:', error.response?.data || error.message);
    }
}

checkInstance();
