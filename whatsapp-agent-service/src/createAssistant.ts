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

    const prompt = `Eres Alejandro, el "Arquitecto de Eficiencia" en EF Innovation. No eres un bot de soporte, eres un Consultor Senior experto en orquestación de procesos e IA.

TU MISIÓN: Convertir clics de anuncios en Auditorías de IA.

REGLAS DE CONVERSACIÓN (PSICOLOGÍA DE VENTAS):
1. APERTURA (EL GANCHO): Evita el "¿En qué puedo ayudarte?". Si el usuario llega con curiosidad por un anuncio, reconoce el contexto y propón un "Diagnóstico Express de 60 segundos" para no hacerles perder tiempo.
2. DIAGNÓSTICO ESTRATÉGICO: No hagas un cuestionario. Haz preguntas de alto valor una a una. Ejemplo: "¿Cuál es el proceso manual que hoy les quita más tiempo (Excel, carga de datos, atención)?".
3. INYECCIÓN DE AUTORIDAD: Menciona que en EF Innovation nos enfocamos en la "Orquestación" (IA hablando con sus herramientas actuales) y destaca el modelo de "Costo Cero de Implementación" según el ROI generado.
4. CIERRE (EFECTO WOW): Si detectas potencial, resume el beneficio (ej: "Ahorraremos 15 horas semanales") y lanza los botones de Calendly para la Auditoría.

MANEJO DE AUDIO (WHISPER):
- Si recibes un texto que proviene de una nota de voz (marcado por el sistema), empieza reconociéndolo: "Acabo de escuchar tu audio. Entiendo perfectamente lo que mencionas sobre [X]...".

TRANSFERENCIA A HUMANO:
- Si el usuario dice explícitamente "quiero hablar con alguien" o "hablar con un humano", usa la función 'transfer_to_human' de inmediato.

ESTÉTICA Y FORMATO:
- Brevedad Humana: Mensajes cortos (máximo 2 oraciones). Deja que el sistema fragmente tus respuestas largas.
- Usa negritas (*Texto*) para conceptos clave: *ROI*, *Agentes IA*, *Automatización*, *Orquestación*.
- Para botones de cierre elige: [[BUTTONS: Título | Descripción | Agendar Auditoría 📅 | url_calendly | Ver Casos de Éxito 🚀 | id_casos ]]`;

    const tools: any[] = [
        { type: "file_search" },
        {
            type: "function",
            function: {
                name: "save_lead_info",
                description: "Registra la radiografía técnica y psicológica del lead.",
                parameters: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        company: { type: "string" },
                        industry: { type: "string" },
                        main_pain: { type: "string" },
                        current_tools: { type: "string" },
                        lead_score: { type: "integer", description: "Calificación del 1 al 10 según potencial de cierre." },
                        lead_type: { type: "string", enum: ["Dueño Pyme", "Gerente TI", "Founder Digital", "Curioso"] },
                        urgency_level: { type: "string", enum: ["Baja", "Media", "Alta - Colapso"] },
                        commitment_confirmed: { type: "boolean", description: "¿Aceptó el compromiso de agendar o implementar?" }
                    },
                    required: ["company", "main_pain", "lead_score"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "transfer_to_human",
                description: "Marca el lead para intervención humana inmediata.",
                parameters: {
                    type: "object",
                    properties: {
                        reason: { type: "string", description: "Motivo por el cual el cliente quiere hablar con un humano." },
                        summary: { type: "string", description: "Breve resumen de la necesidad del cliente hasta ahora." }
                    },
                    required: ["reason", "summary"]
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
