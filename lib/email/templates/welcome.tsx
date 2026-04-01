import { ActivationCode } from '@/lib/types';

interface WelcomeEmailProps {
  companyName: string;
  ownerName:   string;
  slug:        string;
  codes:       ActivationCode[];
}

export function WelcomeEmailTemplate({ companyName, ownerName, slug, codes }: WelcomeEmailProps): string {
  const codeRows = codes.map(c => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #1E293B;font-family:monospace;color:#38BDF8;font-size:14px">${c.code}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #1E293B;color:#94A3B8;font-size:14px">${c.label}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #1E293B;color:#94A3B8;font-size:14px">${c.role}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#060D1F;font-family:'Helvetica Neue',sans-serif;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px">
      <span style="font-size:24px;font-weight:800;color:#fff">Factu<span style="color:#0EA5E9">con</span></span>
    </div>

    <!-- Card -->
    <div style="background:#0F1E35;border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden">
      <div style="background:#0EA5E9;height:4px"></div>
      <div style="padding:32px">
        <h1 style="color:#F8FAFC;font-size:22px;font-weight:700;margin:0 0 8px">¡Tu sistema está listo! 🚀</h1>
        <p style="color:#94A3B8;font-size:15px;margin:0 0 24px">Hola ${ownerName}, tu sistema de facturación <strong style="color:#F8FAFC">${companyName}</strong> ha sido activado.</p>

        <div style="background:#060D1F;border:1px solid rgba(14,165,233,.2);border-radius:12px;padding:16px;margin-bottom:24px">
          <p style="color:#38BDF8;font-size:13px;font-weight:600;margin:0 0 6px">Tu URL del sistema:</p>
          <a href="https://${slug}.factucon.cfd" style="color:#0EA5E9;font-family:monospace;font-size:15px;text-decoration:none">https://${slug}.factucon.cfd</a>
        </div>

        <h3 style="color:#F8FAFC;font-size:15px;margin:0 0 12px">Códigos de activación</h3>
        <p style="color:#94A3B8;font-size:13px;margin:0 0 16px">Comparte cada código con el usuario correspondiente para activar su PC.</p>

        <table style="width:100%;border-collapse:collapse;background:#060D1F;border-radius:10px;overflow:hidden">
          <thead>
            <tr style="background:#0A1628">
              <th style="padding:10px 16px;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Código</th>
              <th style="padding:10px 16px;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Usuario</th>
              <th style="padding:10px 16px;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Rol</th>
            </tr>
          </thead>
          <tbody>${codeRows}</tbody>
        </table>
      </div>
    </div>

    <p style="text-align:center;color:#475569;font-size:12px;margin-top:24px">
      © 2025 Factucon · Hecho para la República Dominicana
    </p>
  </div>
</body>
</html>`;
}