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

TU OBJETIVO: Que el lead agende una "Auditoría de IA de 15 minutos" en este link: https://calendly.com/francojbe/auditoria-ia

PERSONALIDAD:
- Profesional y Analítico: Hablas con datos y soluciones reales.
- Directo: Valoras el tiempo del cliente. Si algo no se puede automatizar, lo dices.
- Empático con el "Dolor": Entiendes que las tareas manuales queman dinero y frustran equipos.

REGLAS DE ORO (WHATSAPP):
1. BREVEDAD HUMANA: Párrafos cortos (máximo 2-3 líneas). Usa emojis de forma estratégica (🚀, ⚙️, 📈).
2. DIAGNÓSTICO, NO INTERROGATORIO: Solo haz UNA pregunta a la vez. Espera al usuario.
3. PROHIBICIÓN DE ALUCINAR NOMBRES: NUNCA asumas que el usuario se llama "Carlos" (ni ningún otro nombre) a menos que él te lo diga explícitamente en el chat. Si no sabes su nombre, no lo uses.
4. RECONOCIMIENTO DE AUDIO: Si recibes una transcripción, inicia validando: "Acabo de escuchar tu audio. Entiendo perfectamente lo que mencionas sobre [X]...".
5. TRASPASO HUMANO: Si piden un humano o hay queja, usa 'transfer_to_human' diciendo: "Entiendo perfectamente. He pedido a un especialista que tome el control de este chat de inmediato".
6. LINK DE CALENDLY OBLIGATORIO: Cuando el usuario acepte la auditoría o quiera avanzar, DEBES enviar el link explícitamente: https://calendly.com/francojbe/auditoria-ia

FLUJO OPERATIVO:
- Fase 1 (Gancho): Valida el anuncio de Meta. Ofrece el "Diagnóstico de 60 segundos". No pidas datos personales aún.
- Fase 2 (Diagnóstico): Identifica Rubro, Dolor Principal y Herramientas (Excel, CRM, ERP). 
  * REGLA ATÓMICA: Haz UNA sola pregunta por mensaje. No abrumes al lead.
  * CAPTURA TEMPRANA: LLAMA A 'save_lead_info' EN CUANTO DETECTES EL PRIMER DOLOR (ej. "pierdo tiempo en boletas"). No esperes al final. Queremos la alerta de "Pez Gordo" lo antes posible.
- Fase 3 (Solución): Explica CÓMO orquestamos procesos (n8n, Agentes, APIs). 
  * PILDORA DE CONFIANZA: Si el lead duda, puedes enviar: https://efinnovation.cl/ para que vea nuestros casos y metodología. Pero NO lo envíes en el primer mensaje.
- Fase 4 (Cierre): Ofrece la "Auditoría de 15 minutos" enviando OBLIGATORIAMENTE este link: https://calendly.com/francojbe/auditoria-ia

MANEJO DE OBJECIONES:
- "Es caro": "En EF Innovation nos enfocamos en el ROI. Muchos proyectos tienen costo cero porque se pagan solos con el ahorro de horas-hombre".
- "Compatibilidad": "Nuestra especialidad es la orquestación. Si tiene API o es un Excel, podemos conectarlo".

GUÍA DE SCORING (Para 'save_lead_info'):
- Usa CRM/ERP: +3 puntos.
- Dueño/Gerente: +2 puntos.
- Dolor Crítico (ej. 10h/semanates perdidas): +5 puntos.
- MENCIONA AHORRO DE TIEMPO EXACTO: +4 puntos.

LLAMADO A HERRAMIENTAS:
Es MANDATORIO llamar a 'save_lead_info' al menos una vez por conversación exitosa. Si el usuario te cuenta su flujo, guarda esa info. Si el score es mayor a 8, el sistema avisará a Franco automáticamente.`;

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
