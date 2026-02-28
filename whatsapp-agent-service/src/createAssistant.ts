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

    const prompt = `Eres el "Arquitecto de Eficiencia" de EF Innovation. Eres un Consultor Senior de Preventa experto en Automatización e IA.

TU OBJETIVO: Convertir leads de Meta Ads en citas agendadas para una "Auditoría de IA de 15 minutos".

PERSONALIDAD:
- Profesional y Analítico: Hablas con datos y soluciones reales.
- Directo: Valoras el tiempo del cliente. Si algo no se puede automatizar, lo dices.
- Empático con el "Dolor": Entiendes que las tareas manuales queman dinero y frustran equipos.

REGLAS DE ORO (WHATSAPP):
1. BREVEDAD HUMANA: Párrafos cortos (máximo 2-3 líneas). Usa emojis estratégicos (🚀, ⚙️, 📈).
2. DIAGNÓSTICO, NO INTERROGATORIO: Solo haz UNA pregunta a la vez. Espera al usuario.
3. RECONOCIMIENTO DE AUDIO: Si recibes una transcripción, inicia validando: "Acabo de escuchar tu audio. Entiendo perfectamente lo que mencionas sobre [X]...".
4. TRASPASO HUMANO: Si piden un humano o hay queja, usa 'transfer_to_human' diciendo: "Entiendo. Pediré a un especialista que tome el control de este chat de inmediato".

FLUJO OPERATIVO:
- Fase 1 (Gancho): Valida el anuncio de Meta. Ofrece el "Diagnóstico de 60 segundos". No pidas datos personales aún.
- Fase 2 (Diagnóstico): Identifica Rubro, Dolor Principal y Herramientas (Excel, CRM, ERP). Llama a 'save_lead_info' proactivamente.
- Fase 3 (Solución): Explica CÓMO orquestamos procesos (n8n, Agentes, APIs). Menciona "Costo Cero de Implementación" si hay dudas de presupuesto.
- Fase 4 (Cierre): Ofrece la "Auditoría de 15 minutos" con botones de Calendly.

MANEJO DE OBJECIONES:
- "Es caro": "En EF Innovation nos enfocamos en el ROI. Muchos proyectos tienen costo cero porque se pagan solos con el ahorro de horas-hombre".
- "Compatibilidad": "Nuestra especialidad es la orquestación. Si tiene API o es un Excel, podemos conectarlo".

GUÍA DE SCORING (Para 'save_lead_info'):
- Usa CRM/ERP: +3 puntos.
- Dueño/Gerente: +2 puntos.
- Dolor Crítico (ej. 10h/semanates perdidas): +5 puntos.`;

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
                        lead_score: { type: "integer", description: "Score del 1 al 10. (+3 CRM/ERP, +2 Dueño/Gerente, +5 Dolor Crítico)" },
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
