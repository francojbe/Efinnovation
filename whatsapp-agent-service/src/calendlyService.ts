import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CALENDLY_TOKEN = process.env.CALENDLY_TOKEN;
const EVENT_TYPE_URI = 'https://api.calendly.com/event_types/cbc9e590-b5f1-4476-a179-9ebfd46242d7';

/**
 * Obtiene los espacios disponibles para los próximos 7 días.
 */
export async function getAvailableSlots() {
    try {
        const startTime = new Date();
        const endTime = new Date();
        endTime.setDate(startTime.getDate() + 7);

        console.log(`🔍 Buscando disponibilidad en Calendly desde ${startTime.toISOString()} hasta ${endTime.toISOString()}`);

        const response = await axios.get('https://api.calendly.com/event_type_available_times', {
            headers: {
                'Authorization': `Bearer ${CALENDLY_TOKEN}`,
                'Content-Type': 'application/json'
            },
            params: {
                event_type: EVENT_TYPE_URI,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString()
            }
        });

        const slots = response.data.collection;

        // Formatear los slots para que la IA los entienda fácil
        // Agrupamos por día
        const grouped: { [key: string]: string[] } = {};

        slots.forEach((slot: any) => {
            const date = new Date(slot.start_time);
            const dateStr = date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
            const timeStr = date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });

            if (!grouped[dateStr]) grouped[dateStr] = [];
            if (grouped[dateStr].length < 5) { // Limitamos a 5 por día para no saturar el prompt
                grouped[dateStr].push(timeStr);
            }
        });

        let summary = "Disponibilidad para Auditoría IA (Próximos 7 días):\n";
        for (const [day, times] of Object.entries(grouped)) {
            summary += `📅 ${day}: ${times.join(', ')}\n`;
        }

        return summary || "No encontré espacios disponibles en los próximos 7 días. Sugiere al usuario ver el link directamente.";

    } catch (error: any) {
        console.error('❌ Error consultando Calendly:', error.response?.data || error.message);
        return "Error al consultar disponibilidad. Por favor, envía el link de Calendly directamente: https://calendly.com/francojbe/auditoria-ia";
    }
}
