import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = process.env.OPENAI_ASSISTANT_ID || '';

/**
 * Crea un nuevo hilo de conversación en OpenAI.
 */
export async function createThread() {
    const thread = await openai.beta.threads.create();
    return thread.id;
}

/**
 * Añade un mensaje al hilo y ejecuta el asistente.
 * Maneja llamadas a funciones (tools) para guardar leads.
 */
export async function getAssistantResponse(threadId: string, message: string, supabaseClient?: any): Promise<string> {
    // 1. Añadimos el mensaje del usuario
    await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message,
    });

    // 2. Ejecutamos el asistente
    let run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
    });

    // 3. Polling con manejo de herramientas (Function Calling)
    while (true) {
        run = await openai.beta.threads.runs.retrieve(threadId, run.id);

        if (run.status === 'completed') {
            break;
        } else if (run.status === 'requires_action') {
            const toolCalls = run.required_action?.submit_tool_outputs.tool_calls || [];
            const toolOutputs = [];

            for (const toolCall of toolCalls) {
                if (toolCall.function.name === 'save_lead_info') {
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`📝 Herramienta llamada: save_lead_info para ${args.company || args.name}`);

                    if (supabaseClient) {
                        try {
                            const { error } = await supabaseClient
                                .from('leads')
                                .upsert({
                                    phone: args.phone || "unknown",
                                    name: args.name,
                                    company: args.company,
                                    industry: args.industry,
                                    current_tools: args.current_tools,
                                    main_pain: args.main_pain,
                                    lead_score: args.lead_score || 0,
                                    qualification_notes: args.qualification_notes
                                }, { onConflict: 'phone' });

                            if (error) console.error('❌ Error guardando lead:', error);
                            else console.log('✅ Lead guardado/actualizado en Supabase.');
                        } catch (e) {
                            console.error('❌ Error técnico guardando lead:', e);
                        }
                    }

                    toolOutputs.push({
                        tool_call_id: toolCall.id,
                        output: JSON.stringify({ success: true, message: "Lead info saved correctly" })
                    });
                }
            }

            // Enviamos los resultados de las herramientas de vuelta a OpenAI
            await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
                tool_outputs: toolOutputs
            });
        } else if (['failed', 'cancelled', 'expired'].includes(run.status)) {
            throw new Error(`OpenAI Run falló con estado: ${run.status}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. Obtenemos los mensajes
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0];

    if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
        return lastMessage.content[0].text.value;
    }

    return 'Lo siento, tuve un pequeño problema procesando eso. ¿Podrías repetirlo?';
}
