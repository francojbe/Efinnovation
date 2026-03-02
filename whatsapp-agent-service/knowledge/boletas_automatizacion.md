# Guía de Extracción de Boletas y Datos (Facturación Automática)

## Problema
El cliente recibe boletas en su correo y necesita guardarlas en una ruta específica (OneDrive/Google Drive/Local) y extraer los datos para guardarlos en un archivo (Excel/CSV/Base de Datos).

## Solución Propuesta por EF Innovation
Utilizamos un flujo de orquestación basado en **n8n** o **Zapier**.

### Paso 1: Detección de Entrada
- Conexión vía IMAP o API de Gmail/Outlook para monitorear correos entrantes.
- Filtro inteligente: Solo procesar correos que contengan adjuntos PDF o palabras clave como "Boleta", "Factura" o "Invoice".

### Paso 2: Procesamiento de Archivo (OCR e IA)
- El archivo se envía a una herramienta de extracción como **Document AI (Google)** o el asistente de visión de **OpenAI**.
- Datos a extraer:
  - RUT / Tax ID del emisor.
  - Fecha de emisión.
  - Monto Neto, IVA y Total.
  - Identificador único de la boleta.

### Paso 3: Almacenamiento y Notificación
- **Ruta de Archivo:** El PDF original se renombra (ej: `2024-03-01_RUT_Monto.pdf`) y se sube a la carpeta de destino.
- **Base de Datos:** Los datos extraídos se insertan en una fila de un Google Sheet o base de datos.
- **Cierre:** Se envía un resumen por WhatsApp o email confirmando la carga exitosa.

## Beneficios (ROI)
- Ahorro de aprox. 3-5 minutos por boleta.
- Eliminación total del error humano por digitación.
- Disponibilidad inmediata de la información para contabilidad.
