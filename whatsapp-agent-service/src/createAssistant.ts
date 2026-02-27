import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ ERROR: Faltan tus credenciales. Asegúrate de definir OPENAI_API_KEY en el archivo .env.");
        return;
    }

    const prompt = `Eres Alejandro, el "Arquitecto de Eficiencia" en Efinnovation. Eres un Consultor Senior experto.

TU OBJETIVO: Transformar curiosidad en compromiso mediante una Auditoría de Automatización.

FORMATO DE MENSAJES (ESTÉTICA):
- Usa negritas (*Texto*) para resaltar beneficios como *ahorro de tiempo*, *ROI* o *Agentes IA*.
- Prohibido el uso de asteriscos innecesarios o listas robóticas.
- Importante: Cuando ofrezcas agendar o ver servicios, usa el formato de BOTONES:
  [[BUTTONS: Título del Mensaje | Descripción corta | Texto Botón 1 | URL o ID | Texto Botón 2 | ID ]]

ESTRATEGIA DE CIERRE:
- Si el cliente acepta el compromiso, envíale botones para agendar. 
- Ejemplo de salida para botones: 
  "Perfecto. Vamos a agendar tu Auditoría para evaluar el ROI de tu caso específico.
  [[BUTTONS: Gestión de Agenda | Selecciona una fecha para nuestra sesión de 15 min | Agendar Auditoría 📅 | https://calendly.com/efinnovation/auditoria | Ver Casos de Éxito 🚀 | casos_exito ]]"

CAPTURA DE DATOS (TOOL: save_lead_info): 
Sigue registrando el perfil técnico y psicológico mientras conversas de forma invisible.

REGLAS DE ORO:
- Habla de tú a tú. 
- Sé conciso (máximo 2 oraciones por fragmento).`;

    const tools: any[] = [
        { type: "file_search" },
        {
            type: "function",
            function: {
                name: "save_lead_info",
                description: "Registra la radiografía psicológica y técnica del prospecto.",
                parameters: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        company: { type: "string" },
                        industry: { type: "string" },
                        main_pain: { type: "string" },
                        current_tools: { type: "string" },
                        lead_score: { type: "integer" },
                        lead_type: { type: "string", enum: ["Dueño Pyme", "Gerente TI", "Founder Digital", "Curioso"] },
                        urgency_level: { type: "string", enum: ["Baja", "Media", "Alta - Colapso"] },
                        commitment_confirmed: { type: "boolean", description: "¿Aceptó el compromiso de implementación?" }
                    },
                    required: ["company", "main_pain", "lead_score"]
                }
            }
        }
    ];

    try {
        const assistant = await openai.beta.assistants.update(process.env.OPENAI_ASSISTANT_ID!, {
            name: "Alejandro v3 - Arquitecto de Élite",
            instructions: prompt,
            tools: tools,
            model: "gpt-4o", // Subimos un peldaño a GPT-4o para mejor razonamiento psicológico
        });

        console.log("✅ ¡Alejandro v3 (Arquitecto de Élite) actualizado!");
        console.log(`Nombre: ${assistant.name}`);
        console.log("-----------------------------------------");
    } catch (error) {
        console.error("Error al actualizar Alejandro:", error);
    }
}

main();
