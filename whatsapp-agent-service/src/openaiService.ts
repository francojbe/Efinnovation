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
 * Optimiza el uso de tokens usando modelos híbridos.
 * Previene errores de 'Run Active' esperando a que terminen ejecuciones previas.
 */
export async function getAssistantResponse(threadId: string, message: string, supabaseClient?: any, userPhone?: string): Promise<string> {
    // 0. Pre-verificación: ¿Hay un run activo? (Evita error 400)
    let activeRuns = await openai.beta.threads.runs.list(threadId);
    let activeRun = activeRuns.data.find(r => ["in_progress", "queued", "requires_action"].includes(r.status));

    if (activeRun) {
        console.log(`⏳ Esperando a que el run previo (${activeRun.id}) termine...`);
        // Esperamos hasta 10 segundos o hasta que no haya runs activos
        for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            activeRuns = await openai.beta.threads.runs.list(threadId);
            activeRun = activeRuns.data.find(r => ["in_progress", "queued", "requires_action"].includes(r.status));
            if (!activeRun) break;
        }

        // Si sigue activo después de 10s, forzamos cancelación (o tiramos error controlado)
        if (activeRun) {
            console.log(`⚠️ Cancelando run persistente ${activeRun.id}`);
            await openai.beta.threads.runs.cancel(threadId, activeRun.id);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa tras cancelación
        }
    }

    // 1. Obtener el historial para decidir el modelo (Eficiencia de tokens)
    const messagesList = await openai.beta.threads.messages.list(threadId);
    const messageCount = messagesList.data.length;

    // Si son los primeros mensajes, usamos el modelo barato. 
    // Si la charla avanza, activamos el modelo inteligente.
    const selectedModel = messageCount < 6 ? "gpt-4o-mini" : "gpt-4o";

    // 2. Añadimos el mensaje del usuario
    await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message,
    });

    // 3. Ejecutamos el asistente con el modelo dinámico
    let run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        model: selectedModel // Sobrescribimos el modelo por eficiencia
    });

    // 4. Polling con manejo de herramientas
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
                                    phone: args.phone || userPhone || "unknown",
                                    name: args.name,
                                    company: args.company,
                                    industry: args.industry,
                                    current_tools: args.current_tools,
                                    main_pain: args.main_pain,
                                    lead_score: args.lead_score || 0,
                                    lead_type: args.lead_type,
                                    urgency_level: args.urgency_level,
                                    commitment_confirmed: args.commitment_confirmed || false,
                                    qualification_notes: args.qualification_notes
                                }, { onConflict: 'phone' });

                            if (error) {
                                console.error('❌ Error guardando lead:', error);
                            } else {
                                console.log('✅ Lead guardado/actualizado en Supabase.');

                                // ALERTA DE PEZ GORDO (A Franco)
                                if (args.lead_score >= 8) {
                                    const { sendWhatsAppMessage } = require('./evolutionService');
                                    const alertMsg = `🔥 *HOT LEAD DETECTADO* 🔥\n\n*Empresa:* ${args.company}\n*Nombre:* ${args.name || 'N/A'}\n*Dolor:* ${args.main_pain}\n*Score:* ${args.lead_score}/10\n*Tipo:* ${args.lead_type || 'N/A'}\n\nAlejandro está manejando el cierre ahora mismo.`;
                                    await sendWhatsAppMessage("56974263408@s.whatsapp.net", alertMsg);
                                    console.log('📢 Alerta enviada a Franco por WhatsApp');
                                }
                            }
                        } catch (e) {
                            console.error('❌ Error técnico guardando lead:', e);
                        }
                    }

                    toolOutputs.push({
                        tool_call_id: toolCall.id,
                        output: JSON.stringify({ success: true, message: "Lead info saved correctly" })
                    });
                } else if (toolCall.function.name === 'transfer_to_human') {
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`🆘 SOLICITUD DE TRANSFERENCIA: ${args.reason}`);

                    const { sendWhatsAppMessage } = require('./evolutionService');
                    const alertMsg = `🆘 *INTERVENCIÓN HUMANA REQUERIDA* 🆘\n\n*Motivo:* ${args.reason}\n*Resumen:* ${args.summary}\n*Teléfono:* ${userPhone}\n\nPor favor, entra al chat para atender este lead de inmediato.`;

                    await sendWhatsAppMessage("56974263408@s.whatsapp.net", alertMsg);

                    toolOutputs.push({
                        tool_call_id: toolCall.id,
                        output: JSON.stringify({ success: true, message: "SOS Alert sent to team. A human will take over shortly." })
                    });
                }
            }

            await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
                tool_outputs: toolOutputs
            });
        } else if (['failed', 'cancelled', 'expired'].includes(run.status)) {
            throw new Error(`OpenAI Run falló con estado: ${run.status}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 5. Devolver respuesta final
    const finalMessages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = finalMessages.data[0];

    if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
        return lastMessage.content[0].text.value;
    }

    return 'Lo siento, tuve un pequeño problema procesando eso. ¿Podrías repetirlo?';
}
