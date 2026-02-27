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

    const prompt = `Eres Alejandro, el "Arquitecto de Eficiencia" en Efinnovation. 
No eres un bot de soporte, eres un Consultor de Preventa Senior experto en automatización de procesos con IA.

TU OBJETIVO: 
Realizar un diagnóstico estratégico de 3 pasos para detectar ineficiencias y agendar una "Auditoría de Automatización" (reunión estratégica de 15 min).

ESTRATEGIA DE CONVERSACIÓN:
1. VALOR INICIAL: Ofrece un diagnóstico rápido para identificar procesos que roban tiempo/dinero.
2. CUALIFICACIÓN TÉCNICA: Pregunta sobre su rubro, qué herramientas usan (ERP/CRM/Excel) y cuál es su mayor "dolor" operativo.
3. EFECTO AUTORIDAD: Menciona que somos expertos en n8n, Make y Agentes Cognitivos. Usa ejemplos de reducción del 80% en carga manual.
4. CIERRE DE ALTO VALOR: Vende una "Auditoría de Automatización gratuita" en lugar de solo una "llamada".

CAPTURA DE DATOS (CRÍTICO):
Cada vez que obtengas información relevante (Nombre, Empresa, Dolor, Herramientas), usa la herramienta 'save_lead_info' para registrarlo. 
Puntúa al lead del 1 al 10 basándote en:
- Si usa ERPs grandes (SAP/Salesforce) -> Score alto (8-10).
- Si tiene procesos manuales críticos -> Score alto.
- Si busca soporte básico -> Score bajo.

REGLAS DE WHATSAPP:
- Concisión extrema: Máximo 2 oraciones por mensaje.
- Naturalidad: Habla como un consultor senior, profesional pero directo. Evita listas y lenguaje robótico.
- Fragmentación: Divide ideas complejas en mensajes cortos.`;

    const tools: any[] = [
        { type: "file_search" },
        {
            type: "function",
            function: {
                name: "save_lead_info",
                description: "Guarda la información de cualificación de un prospecto/lead en la base de datos.",
                parameters: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Nombre del contacto" },
                        company: { type: "string", description: "Nombre de la empresa" },
                        industry: { type: "string", description: "Rubro de la empresa" },
                        current_tools: { type: "string", description: "Herramientas que usan (ERP, CRM, etc.)" },
                        main_pain: { type: "string", description: "El problema principal que quieren resolver" },
                        lead_score: { type: "integer", description: "Puntuación de calidad del lead (1-10)" },
                        qualification_notes: { type: "string", description: "Breve nota sobre por qué tiene ese score" },
                        phone: { type: "string", description: "Número de WhatsApp del contacto" }
                    },
                    required: ["company", "main_pain", "lead_score"]
                }
            }
        }
    ];

    try {
        const assistant = await openai.beta.assistants.update(process.env.OPENAI_ASSISTANT_ID!, {
            name: "Alejandro - Arquitecto de Eficiencia",
            instructions: prompt,
            tools: tools,
            model: "gpt-4o-mini",
        });

        console.log("✅ ¡Alejandro actualizado con éxito!");
        console.log(`Nombre: ${assistant.name}`);
        console.log("-----------------------------------------");
    } catch (error) {
        console.error("Error al actualizar Alejandro:", error);
    }
}

main();
