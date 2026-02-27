import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function updateAssistant() {
    const openai = new OpenAI();
    const assistantId = process.env.OPENAI_ASSISTANT_ID;

    if (!assistantId) {
        console.error("No se encontró OPENAI_ASSISTANT_ID en .env");
        return;
    }

    try {
        console.log("🚀 Subiendo base de conocimiento a OpenAI...");
        const file = await openai.files.create({
            file: fs.createReadStream('../knowledge_base_efinnovation.md'),
            purpose: "assistants",
        });

        console.log("🏗️ Creando Vector Store...");
        const vectorStore = await openai.beta.vectorStores.create({
            name: "Efinnovation Knowledge Base",
            file_ids: [file.id]
        });

        console.log("🧠 Actualizando Asistente con búsqueda de archivos...");
        await openai.beta.assistants.update(assistantId, {
            tools: [{ type: "file_search" }],
            tool_resources: {
                file_search: {
                    vector_store_ids: [vectorStore.id]
                }
            }
        });

        console.log("✅ Asistente Alejandro actualizado con éxito y ahora es experto en Efinnovation!");
    } catch (error) {
        console.error("❌ Error actualizando el asistente:", error);
    }
}

updateAssistant();
