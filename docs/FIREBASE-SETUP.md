# Configuración de Firebase

Factucon usa un proyecto de Firebase para tres cosas:

1. **Authentication** — login del portal (`/auth/login`, `/auth/register`) con
   Email/Password y Google. Ver `lib/auth/auth-context.tsx`.
2. **Firestore** — base de datos principal: `portal_users`, `companies`,
   `activation_codes`, y todas las colecciones internas de cada tenant
   (`products`, `sales`, `clients`, etc., accedidas vía `/api/*` con el SDK
   Admin).
3. **Storage** — el SDK cliente lo inicializa (`lib/firebase/client.ts`), pero
   hoy **no se usa en ningún flujo real**. Es seguro dejarlo sin habilitar; si
   más adelante se agrega subida de logos/avatares, ahí se necesitará.

Este documento explica qué configurar en la consola de Firebase
(https://console.firebase.google.com) y qué variables de entorno corresponden
a cada cosa. La plantilla de variables está en `.env.example`.

---

## 1. Servicios a habilitar en la consola

Dentro de tu proyecto de Firebase:

- **Authentication → Sign-in method**
  - Habilita **Email/Password**.
  - Habilita **Google** (botón "Continuar con Google" en `/auth/login`).
- **Firestore Database**
  - Crea la base de datos en **modo Nativo** (no "Datastore mode").
  - Elige la región más cercana a tus usuarios (ej. `us-east1` o similar).
- **Storage** (opcional, no usado actualmente) — puedes omitirlo por ahora.

---

## 2. Credenciales del SDK cliente (`NEXT_PUBLIC_FIREBASE_*`)

Estas son las que usa el navegador para hablar con Firebase Auth y Firestore
directamente (sin pasar por el servidor de Next.js).

**Dónde obtenerlas**: Project Settings (⚙️ junto a "Project Overview") →
pestaña **General** → sección "Your apps" → tu app web (si no existe, crea una
con el ícono `</>`). Ahí Firebase te muestra un objeto `firebaseConfig` con
estos campos, que corresponden 1 a 1 a las variables:

| Campo de `firebaseConfig`  | Variable de entorno                       |
|-----------------------------|--------------------------------------------|
| `apiKey`                    | `NEXT_PUBLIC_FIREBASE_API_KEY`              |
| `authDomain`                | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`          |
| `projectId`                 | `NEXT_PUBLIC_FIREBASE_PROJECT_ID`           |
| `storageBucket`             | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`       |
| `messagingSenderId`         | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`  |
| `appId`                     | `NEXT_PUBLIC_FIREBASE_APP_ID`               |
| `measurementId` (opcional)  | `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`       |

**¿Es seguro que estas variables empiecen con `NEXT_PUBLIC_` y queden visibles
en el navegador?** Sí. Estas claves identifican tu proyecto de Firebase, pero
no otorgan acceso por sí solas — cualquiera que use tu app las puede ver desde
las herramientas de desarrollador, y eso es normal e intencional. **La
seguridad real la dan**:

- Las **reglas de Firestore** (`firestore.rules`, sección 4 de este doc) — que
  definen quién puede leer/escribir qué documentos.
- **Firebase Auth** — que controla quién obtiene una sesión válida.

Si alguien copia tus `NEXT_PUBLIC_FIREBASE_*` no puede leer ni escribir datos
de otros usuarios mientras las reglas estén bien configuradas.

---

## 3. Credenciales del SDK Admin (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)

Estas las usa **el servidor** (todas las rutas `app/api/**/route.ts`, vía
`lib/firebase/admin.ts`) y **nunca** deben llegar al navegador — por eso no
tienen el prefijo `NEXT_PUBLIC_`.

**Cómo generarlas**:

1. Project Settings → pestaña **Service accounts**.
2. Botón **Generate new private key** → descarga un archivo `.json`.
3. De ese JSON, copia:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

**¿Qué permisos trae esta cuenta de servicio?** Por defecto, el rol **"Firebase
Admin SDK Administrator Service Agent"**, que ya incluye acceso de
administrador a Firestore y Authentication. No necesitas agregar ningún rol de
IAM adicional para que Factucon funcione — todas las rutas `/api/*` (provision,
e-CF, API keys, cron de suscripciones, etc.) usan exactamente este nivel de
acceso.

### ⚠️ Troubleshooting: `error:1E08010C:DECODER routines::unsupported`

Este error ocurre al inicializar el SDK Admin (`lib/firebase/admin.ts`) cuando
`FIREBASE_PRIVATE_KEY` no tiene el formato correcto. La causa casi siempre es
una de estas dos:

1. **Saltos de línea reales en vez de `\n` literales.** El `private_key` del
   JSON descargado viene como una sola línea con `\n` *literales* (la
   secuencia de caracteres backslash + n). Si al pegarlo en `.env` tu editor
   los convierte en saltos de línea reales, la clave queda rota. El código hace
   `privateKey.replace(/\\n/g, '\n')` para convertir los `\n` literales en
   saltos de línea reales — pero si ya son saltos de línea reales, este
   `replace` no hace nada y la clave queda mal formada.
2. **Falta el wrapper de comillas.** El valor debe ir entre comillas dobles en
   `.env`, como en `.env.example`:
   ```
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
   Sin las comillas, el shell/parser de variables de entorno puede cortar el
   valor en el primer espacio o salto de línea.

**Cómo corregirlo**: abre el `.json` descargado, copia el valor de
`private_key` **tal cual** (con los `\n` como dos caracteres, backslash + n,
todo en una sola línea), pégalo en `.env` envuelto en comillas dobles, en una
sola línea, exactamente como en la plantilla `.env.example`.

---

## 4. Reglas de seguridad de Firestore

Las colecciones `companies`, `portal_users` y `activation_codes` se leen y
escriben **directo desde el navegador** con el SDK cliente (ver
`lib/db/companies.ts`, `lib/db/users.ts`, `lib/db/codes.ts`,
`lib/auth/auth-context.tsx`). Todo lo demás (`products`, `sales`, `clients`,
`dgii_config`, API keys, etc.) se accede solo vía `/api/*` con el SDK Admin,
que **ignora** las reglas de Firestore.

Si tu proyecto se creó en "modo de prueba" (test mode), Firestore arranca con
reglas que permiten todo durante 30 días y luego **deniegan todo** — en ambos
casos, sin reglas explícitas, el portal puede dejar de funcionar o quedar
abierto a cualquiera.

Este proyecto incluye `firestore.rules` con reglas mínimas para esas tres
colecciones (cada usuario solo ve sus propias empresas/perfil; el catch-all
final deniega todo lo demás por defecto).

**Cómo publicarlas** (no requiere Firebase CLI):

1. Firebase Console → **Firestore Database** → pestaña **Reglas**.
2. Borra el contenido actual y pega el contenido completo de
   `firestore.rules` (raíz del proyecto).
3. Click **Publicar**.

> Nota sobre `activation_codes`: la creación de estos códigos ocurre durante
> `/api/provision` usando el SDK cliente **sin** sesión de Firebase Auth (es
> una particularidad del código actual). La regla lo permite solo si el
> `companyId` referenciado corresponde a una empresa que ya existe — es un
> nivel "razonable" para hoy. Si más adelante se quiere endurecer más, la
> solución correcta sería migrar `lib/db/codes.ts` al SDK Admin.

---

## 5. Checklist rápido

- [ ] Authentication → Email/Password y Google habilitados.
- [ ] Firestore Database creada (modo Nativo).
- [ ] `NEXT_PUBLIC_FIREBASE_*` copiadas desde Project Settings → General → Your apps.
- [ ] `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` generadas desde Service Accounts.
- [ ] `firestore.rules` pegadas y publicadas en Firestore Database → Reglas.
- [ ] `.env` completo (copiado desde `.env.example`).
