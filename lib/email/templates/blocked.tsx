export function BlockedEmailTemplate(companyName: string, reactivationFee: number): string {
  return `
<!DOCTYPE html><html><body style="background:#060D1F;font-family:'Helvetica Neue',sans-serif;padding:40px 20px;margin:0">
<div style="max-width:520px;margin:0 auto;background:#0F1E35;border:1px solid rgba(239,68,68,.2);border-radius:16px;overflow:hidden">
  <div style="background:#EF4444;height:4px"></div>
  <div style="padding:32px">
    <h2 style="color:#F8FAFC;font-size:20px;margin:0 0 12px">🔒 Sistema bloqueado</h2>
    <p style="color:#94A3B8;font-size:14px;line-height:1.7;margin:0 0 12px">
      El sistema <strong style="color:#F8FAFC">${companyName}</strong> ha sido bloqueado por falta de pago.
    </p>
    <p style="color:#94A3B8;font-size:14px;line-height:1.7;margin:0 0 20px">
      Tus datos están seguros. Si llevas más de 30 días inactivo, se aplicará una tarifa de reactivación de <strong style="color:#F87171">RD$${reactivationFee}</strong>.
    </p>
    <a href="https://factucon.cfd/portal/dashboard" style="display:inline-block;background:#EF4444;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">
      Reactivar sistema →
    </a>
  </div>
</div>
</body></html>`;
}