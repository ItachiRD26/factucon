# Configuración de PayPal (Suscripciones)

Factucon usa la **API de Suscripciones de PayPal** (`/v1/billing/subscriptions`),
**no** la API de Órdenes ("crear orden") — esa es para pagos de una sola vez y
no sirve para cobros recurrentes.

Flujo end-to-end:

1. El cliente crea su sistema en el wizard (provisioning inmediato, sin cobro).
2. En el paso 6 ("Pago") o después desde **Facturación**, vincula PayPal. Se
   crea una suscripción con **14 días de prueba a US$0** usando el plan base
   (`PAYPAL_PLAN_ID`), con el precio real sobreescrito en USD para ese tenant.
3. El cliente aprueba en el checkout hospedado de PayPal y regresa a
   `/portal/dashboard/empresa/{id}/facturacion?paypal=success&subscription_id=...`.
4. Cuando termina el trial, PayPal cobra automáticamente el equivalente en USD
   y notifica a `app/api/paypal/weebhook/route.ts`, que actualiza el estado de
   la suscripción en Firestore.

Este documento explica cómo obtener cada variable de `.env.example` en la
sección **PayPal**.

---

## 1. Crear la app y obtener `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`

1. Entra a https://developer.paypal.com/dashboard/applications con tu cuenta
   de PayPal (Business).
2. En **Sandbox → Apps & Credentials**, crea una app nueva (o usa "Default
   Application"). Copia **Client ID** y **Secret**.
3. Pega esos valores en `.env`:
   ```
   PAYPAL_CLIENT_ID=...
   PAYPAL_CLIENT_SECRET=...
   PAYPAL_MODE=sandbox
   ```
4. Más adelante, cuando quieras cobrar de verdad, repite el proceso en **Live
   → Apps & Credentials** y cambia solo `PAYPAL_MODE=live` (más detalles en la
   sección 4) — no hace falta tocar el código ni redesplegar.

---

## 2. Crear el plan base (`PAYPAL_PLAN_ID`)

La app usa **un solo plan de PayPal** para todos los tenants. El precio real
de cada empresa se sobreescribe por suscripción (ver
`lib/paypal/client.ts::createPayPalSubscription`), así que no necesitas crear
un plan por cliente ni por nivel de precio.

Con `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` y `PAYPAL_MODE` ya en tu `.env`,
corre:

```
node --env-file=.env scripts/paypal-create-plan.mjs
```

El script:

1. Obtiene un token con tus credenciales.
2. Crea el producto **"Factucon - Sistema de Facturación"** (o reutiliza uno
   existente si ya pusiste `PAYPAL_PRODUCT_ID` en `.env` — ver nota abajo).
3. Crea un plan con dos ciclos: 14 días de prueba a US$0, seguido de
   cobro mensual indefinido (precio placeholder, sobreescrito por tenant).
4. Imprime el `plan.id` (y el `product.id` la primera vez) resultantes.

Copia esos valores a `.env`:

```
PAYPAL_PLAN_ID=P-XXXXXXXXXXXXXXXXXXXX
```

> Si corres el script en sandbox y luego en live, tendrás dos `PAYPAL_PLAN_ID`
> distintos — uno por entorno.

### ¿Y el `PAYPAL_PRODUCT_ID`?

**La app no lo usa en ningún momento** — solo `PAYPAL_PLAN_ID` se lee en
`lib/paypal/config.ts` y se envía a PayPal al crear cada suscripción. El
`product_id` es un requisito de la API de PayPal *solo para crear el plan*
(`POST /v1/billing/plans`).

La primera vez que corres el script, no necesitas tener `PAYPAL_PRODUCT_ID` —
el script crea el producto y te imprime su ID. Guárdalo en `.env` como
`PAYPAL_PRODUCT_ID` (opcional) **solo si más adelante vas a volver a correr el
script** (por ejemplo, para crear un segundo plan con otro trial o precio
base) y quieres que reutilice el mismo producto en vez de crear uno duplicado
en tu catálogo de PayPal.

---

## 3. Configurar el webhook

PayPal necesita notificar a Factucon cuando una suscripción se activa, falla
un cobro o se cancela. Eso lo maneja
`app/api/paypal/weebhook/route.ts` (el nombre de la ruta tiene un typo —
"weebhook" — que se deja así intencionalmente para no romper un webhook ya
configurado; la URL real es la que se registra abajo).

1. En el dashboard de PayPal (sandbox o live según corresponda), ve a **Apps &
   Credentials** → tu app → sección **Webhooks** → **Add Webhook**.
2. **Webhook URL**:
   ```
   https://www.facturacon.cfd/api/paypal/weebhook
   ```
   (usa el dominio configurado en `NEXT_PUBLIC_APP_URL`).
3. **Event types** a suscribir:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `PAYMENT.SALE.COMPLETED`
   - `PAYMENT.SALE.DENIED`
   - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
4. Guarda el webhook. PayPal te muestra un **Webhook ID** — cópialo a `.env`:
   ```
   PAYPAL_WEBHOOK_ID=...
   ```
   Este ID se usa en `lib/paypal/verify-webhook.ts` para validar la firma de
   cada evento entrante.

---

## 4. `PAYPAL_MODE`: sandbox vs. live

`PAYPAL_MODE` controla a qué entorno de PayPal apunta la app
(`lib/paypal/config.ts`):

| `PAYPAL_MODE` | `baseUrl`                            |
|----------------|---------------------------------------|
| `sandbox` (default) | `https://api-m.sandbox.paypal.com` |
| `live`         | `https://api-m.paypal.com`           |

A diferencia de `NODE_ENV`, **esta variable es independiente del entorno de
despliegue**. Esto significa que puedes tener la app corriendo en producción
(Vercel, `NODE_ENV=production`) con `PAYPAL_MODE=sandbox`, probar todo el
flujo de pago con cuentas de prueba de PayPal, y cuando estés listo cambiar
solo esa variable de entorno a `live` (y usar las credenciales/plan/webhook de
live de las secciones 1-3) — sin tocar código ni redesplegar.

**Cuentas de prueba (sandbox)**: en
https://developer.paypal.com/dashboard/accounts puedes crear cuentas
"Personal" (comprador) sandbox para completar el checkout de aprobación sin
dinero real.

---

## 5. `NEXT_PUBLIC_PAYPAL_DOP_USD_RATE`

PayPal no soporta cobros en pesos dominicanos (DOP). La app sigue mostrando
RD$ en todo el wizard, el home y el dashboard, pero la suscripción de PayPal se
crea con el equivalente en **USD**, calculado como:

```
priceUSD = planPriceDOP / NEXT_PUBLIC_PAYPAL_DOP_USD_RATE
```

(ver `lib/paypal/config.ts::dopToUsd`). Por ejemplo, con la tasa por defecto
`60`, un plan de RD$1,550/mes se cobra como ≈US$25.83/mes. Ajusta esta
variable según la tasa de cambio que quieras aplicar — no requiere redeploy de
código, solo cambiar la variable de entorno.

---

## 6. Probar el flujo completo en sandbox

1. Completa las secciones 1-5 con credenciales **sandbox**.
2. `npm run dev`, crea una cuenta de portal y completa el wizard (pasos 1-5:
   provisioning real contra Firestore).
3. En el paso 6 ("Pago"), pulsa **"Conectar con PayPal"** → deberías ser
   redirigido al checkout hospedado de PayPal (sandbox).
4. Inicia sesión con una cuenta de prueba "Personal" (comprador) sandbox y
   aprueba.
5. PayPal te regresa a `/portal/dashboard/empresa/{id}/facturacion?paypal=success&subscription_id=...`.
   La página llama a `confirm-subscription` y muestra el banner de
   confirmación con el estado de la suscripción.
6. Para probar webhooks en sandbox, usa el simulador de eventos del dashboard
   de PayPal (**Webhooks → tu webhook → Simulate event**) y verifica en
   Firestore que `companies/{id}.subscription.status` cambie según el evento.

---

## 7. Cargo por excedente de comprobantes

Cada plan incluye un límite de comprobantes (facturas/ventas) por mes —
ver `PLAN_TIERS` en `lib/types/index.ts`. Si una empresa supera ese límite
en un ciclo, **no se bloquea su sistema**: el excedente se cobra en el
ciclo siguiente, de forma automática.

Mecánica:

1. Cada venta creada vía `createSale()` (`lib/sales/create-sale.ts`)
   incrementa `companies/{id}.subscription.comprobantesUsed` (sin importar
   si generó e-CF; las cotizaciones no cuentan).
2. Cuando PayPal cobra el ciclo (`PAYMENT.SALE.COMPLETED` en
   `app/api/paypal/weebhook/route.ts`):
   - Se calcula `overageDOP = max(0, comprobantesUsed - comprobanteLimit) *
     overageRate`.
   - Se reinicia `comprobantesUsed` a `0` y se guarda `overageDOP` en
     `subscription.pendingOverageDOP` (se muestra en el dashboard de
     Facturación).
   - Se llama a `revisePayPalSubscriptionPrice()`
     (`lib/paypal/client.ts`) para fijar el precio del **próximo** ciclo
     (`billing_cycles[sequence: 2]`) como `planPrice + overageDOP`,
     convertido a USD con `dopToUsd()`.
3. Si el ciclo que acaba de cerrar no tuvo excedente, el cálculo es
   auto-corrector: `revise` regresa el precio del próximo ciclo a la base
   `planPrice` (deshace cualquier recargo previo).

Este mecanismo **reutiliza el mismo override de precio por suscripción**
que `createPayPalSubscription` (sección 2) — no requiere crear planes
adicionales ni configuración extra en el dashboard de PayPal.

**Verificar en sandbox**:

1. Crea ventas hasta superar `comprobanteLimit` del plan de la empresa de
   prueba (revisa `companies/{id}.subscription.comprobantesUsed` en
   Firestore).
2. En el dashboard de PayPal, ve a **Webhooks → tu webhook → Simulate
   event** y dispara `PAYMENT.SALE.COMPLETED` para esa suscripción.
3. Confirma en Firestore que `subscription.comprobantesUsed` volvió a `0`
   y que `subscription.pendingOverageDOP` refleja el excedente esperado
   (`(used - limit) * overageRate`).
4. En PayPal, revisa la suscripción y confirma que el próximo ciclo
   (`billing_cycles[sequence: 2].pricing_scheme.fixed_price`) quedó
   actualizado al nuevo precio en USD.

---

## 8. Checklist rápido

- [ ] `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` (sandbox) en `.env`.
- [ ] `PAYPAL_MODE=sandbox`.
- [ ] `PAYPAL_PLAN_ID` generado con `scripts/paypal-create-plan.mjs`.
- [ ] Webhook creado apuntando a `/api/paypal/weebhook`, con los 5 eventos de
      la sección 3, y `PAYPAL_WEBHOOK_ID` copiado a `.env`.
- [ ] `NEXT_PUBLIC_PAYPAL_DOP_USD_RATE` ajustado a tu tasa preferida.
- [ ] Flujo de wizard probado de punta a punta con una cuenta sandbox.
- [ ] Para pasar a producción real: repetir 1-3 con credenciales **live** y
      cambiar `PAYPAL_MODE=live`.
- [ ] Probar el cargo por excedente de comprobantes (sección 7) con una
      suscripción sandbox activa.
