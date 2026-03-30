import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SYSTEM_PROMPT = `Eres el asistente oficial de Factucon, un sistema de facturación para empresas de la República Dominicana.

Tu rol es ayudar tanto a administradores como a empleados con:
- Cómo usar el sistema de facturación
- Preguntas fiscales de RD: NCF (B01, B02, B14, B15, B16), ITBIS 18%, e-CF DGII
- Cómo generar reportes 606 y 607
- Cómo anular facturas o hacer devoluciones
- Dudas sobre el plan de suscripción
- Cómo agregar productos, usuarios, clientes
- Cualquier duda operativa del sistema

Reglas:
- Responde siempre en español dominicano, informal pero profesional
- Sé conciso, máximo 3-4 oraciones por respuesta
- Si no sabes algo con certeza, dilo claramente y sugiere contactar soporte
- No inventes información fiscal o legal
- Para preguntas técnicas muy específicas sobre la DGII, sugiere visitar dgii.gov.do`;

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    const messages = [
      ...history.slice(-8), // últimos 8 mensajes para contexto
      { role: 'user' as const, content: message },
    ];

    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system:     SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content[0].type === 'text'
      ? response.content[0].text
      : 'No pude generar una respuesta.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}