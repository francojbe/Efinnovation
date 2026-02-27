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
 * Añade un mensaje al hilo y ejecuta el asistente para obtener una respuesta.
 * @param threadId El ID del hilo de OpenAI.
 * @param message El mensaje enviado por el usuario en WhatsApp.
 */
export async function getAssistantResponse(threadId: string, message: string): Promise<string> {
    // 1. Añadimos el mensaje del usuario al hilo
    await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message,
    });

    // 2. Ejecutamos el asistente (Run)
    const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
    });

    // 3. Esperamos a que el asistente termine de procesar (polling)
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);

    while (runStatus.status !== 'completed') {
        if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
            throw new Error(`OpenAI Run failed with status: ${runStatus.status}`);
        }
        // Esperamos un poco antes de volver a preguntar
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    // 4. Obtenemos los mensajes del hilo
    const messages = await openai.beta.threads.messages.list(threadId);

    // El último mensaje del asistente es el primero de la lista (orden descendente por defecto)
    const lastMessage = messages.data[0];

    if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
        return lastMessage.content[0].text.value;
    }

    return 'Lo siento, no pude procesar tu mensaje en este momento.';
}
