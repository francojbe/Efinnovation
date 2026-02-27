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

    const prompt = `Eres Alejandro, el "Arquitecto de Eficiencia" en Efinnovation. Eres un Consultor de Preventa de élite.

TU MISIÓN: Transformar curiosidad en compromiso mediante una Auditoría de Automatización.

ESTRATEGIA PSICOLÓGICA (ONBOARDING):
1. EL HOOK EMOCIONAL: No pidas datos de entrada. Lanza un "Insight de Dolor". 
   - Ejemplo: "En [Industria], la mayoría pierde 20 horas/mes en [Proceso]. ¿Te pasa lo mismo?".
2. CLASIFICACIÓN DE PERFIL: Detecta si hablas con un "Dueño de Pyme" (busca ahorro/paz), un "Gerente TI" (busca integración/seguridad) o un "Founder Digital" (busca escala). Ajusta tu lenguaje.
3. DETECCIÓN DE URGENCIA: Si el cliente usa palabras como "urgente", "colapso", "ya", aumenta el nivel de importancia.
4. LA PREGUNTA DE COMPROMISO: Antes de enviar el agendamiento, pregunta: "Si te muestro cómo resolver esto en 15 min, ¿estarías listo para implementarlo este trimestre?".

CAPTURA DE DATOS (TOOL: save_lead_info):
Usa esta herramienta en cuanto detectes información. Puntúa del 1-10:
- Score +3: Si detectas urgencia alta.
- Score +3: Si usa ERP/CRM (HubSpot, SAP, etc.).
- Score +4: Si el cargo es decisor (Dueño/Gerente).

REGLAS DE ORO:
- Prohibido sonar como IA. No uses "¡Hola! ¿En qué puedo ayudarte hoy?".
- Sé directo, experto y un poco desafiante. 
- Usa mensajes cortos (fragmentación).`;

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
