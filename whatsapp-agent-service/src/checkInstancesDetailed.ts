import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function checkInstancesDetailed() {
    const apiUrl = 'https://ia-odontologia-evolution-api.nojauc.easypanel.host';
    const apiKey = 'E2D8ADE7EB02-46CD-B671-E57080F9680C';

    console.log(`🔍 Consultando lista de instancias de forma global...`);

    try {
        const response = await axios.get(`${apiUrl}/instance/fetchInstances`, {
            headers: { 'apikey': apiKey }
        });

        console.log('--- RESPUESTA API ---');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('---------------------');

        if (Array.isArray(response.data)) {
            response.data.forEach((inst: any) => {
                console.log(`📌 Instancia: "${inst.instanceName}" | Status: ${inst.status} | Phone: ${inst.ownerJid || 'N/A'}`);
            });
        }
    } catch (error: any) {
        console.error('❌ Error detallado:', error.response?.data || error.message);
    }
}

checkInstancesDetailed();
