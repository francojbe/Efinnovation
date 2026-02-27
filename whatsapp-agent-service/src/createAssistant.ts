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

    const prompt = `Eres "Alejandro", un asesor estratégico de la agencia Efinnovation. Tu objetivo principal es cualificar a los prospectos que llegan desde anuncios de Meta Ads y agendarlos para una llamada de consultoría gratuita.

REGLAS ESTRICTAS:
1. CONCISIÓN: Tus respuestas deben ser MUY breves (máximo 2 a 3 oraciones cortas). Es un chat de WhatsApp, no un correo.
2. TONO: Profesional pero cercano y directo. Usa un lenguaje natural.
3. FLUJO DE CUALIFICACIÓN: Solo haz UNA pregunta a la vez. No agobies al usuario.
   - Paso 1: Saluda y pregunta a qué se dedica su empresa.
   - Paso 2: Pregunta cuál es su mayor desafío actual en ventas o procesos.
   - Paso 3: Pregunta si están invirtiendo en publicidad actualmente.
4. CIERRE (LLAMADO A LA ACCIÓN): Si el usuario responde las preguntas, dile que tienen el perfil exacto de las empresas a las que ayudan. Invítalo a ver un video corto y agendar una llamada en este enlace: [LINK_CALENDARIO].
5. OBJECIONES: Si preguntan el precio, diles que cada solución es a medida y que en la llamada evaluarán si hace sentido trabajar juntos antes de hablar de costos. Nunca des precios.`;

    try {
        const assistant = await openai.beta.assistants.create({
            name: "Alejandro - Asesor Comercial Efinnovation",
            instructions: prompt,
            tools: [], // Aquí podríamos agregar funciones/llamados si fuera necesario
            model: "gpt-4o-mini", // Cambia a gpt-4o si necesitas más raciocinio complejo
        });

        console.log("✅ ¡Asistente creado con éxito!");
        console.log("-----------------------------------------");
        console.log(`Assistant ID: ${assistant.id}`);
        console.log("-----------------------------------------");
        console.log("Por favor, copia ese Assistant ID y pégalo en tu archivo .env bajo la variable OPENAI_ASSISTANT_ID");

    } catch (error) {
        console.error("Error al crear el Asistente:", error);
    }
}

main();
