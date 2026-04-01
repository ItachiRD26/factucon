import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const FACTUCON_SYSTEM_PROMPT = `Eres el asistente oficial de Factucon, un sistema de facturación para empresas de la República Dominicana.

Ayudas con:
- Uso del sistema de facturación (POS, inventario, cotizaciones, reportes)
- Preguntas fiscales RD: NCF (B01, B02, B14, B15, B16), ITBIS 18%, e-CF DGII
- Reportes 606 y 607 para la DGII
- Anulación de facturas y devoluciones
- Dudas sobre suscripción y planes
- Gestión de usuarios y códigos de activación

Reglas:
- Responde siempre en español, tono amigable y profesional
- Máximo 3-4 oraciones por respuesta, sé conciso
- Si no sabes algo con certeza, di que no sabes y sugiere contactar soporte
- No inventes información fiscal o legal
- Para preguntas muy técnicas sobre la DGII, sugiere visitar dgii.gov.do`;

export async function askAssistant(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system:     FACTUCON_SYSTEM_PROMPT,
    messages: [
      ...history.slice(-8),
      { role: 'user', content: message },
    ],
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : 'No pude generar una respuesta.';
}