export function PaymentFailedEmailTemplate(companyName: string, daysLeft: number): string {
  return `
<!DOCTYPE html><html><body style="background:#060D1F;font-family:'Helvetica Neue',sans-serif;padding:40px 20px;margin:0">
<div style="max-width:520px;margin:0 auto;background:#0F1E35;border:1px solid rgba(245,158,11,.2);border-radius:16px;overflow:hidden">
  <div style="background:#F59E0B;height:4px"></div>
  <div style="padding:32px">
    <h2 style="color:#F8FAFC;font-size:20px;margin:0 0 12px">⚠️ Pago pendiente</h2>
    <p style="color:#94A3B8;font-size:14px;line-height:1.7;margin:0 0 20px">
      Tu suscripción de <strong style="color:#F8FAFC">${companyName}</strong> tiene un pago pendiente.<br>
      Tienes <strong style="color:#FCD34D">${daysLeft} día${daysLeft !== 1 ? 's' : ''}</strong> antes de que el sistema sea bloqueado.
    </p>
    <a href="https://facturacon.cfd/portal/dashboard" style="display:inline-block;background:#F59E0B;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">
      Pagar ahora →
    </a>
  </div>
</div>
</body></html>`;
}