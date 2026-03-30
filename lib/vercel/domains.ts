// Provisioning de subdominios en Vercel
// Docs: https://vercel.com/docs/rest-api/endpoints/domains

const VERCEL_API = 'https://api.vercel.com';

function headers() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export async function addSubdomain(slug: string): Promise<{ id: string; domain: string }> {
  const domain = `${slug}.factucon.vercel.app`;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;

  const url = teamId
    ? `${VERCEL_API}/v9/projects/${projectId}/domains?teamId=${teamId}`
    : `${VERCEL_API}/v9/projects/${projectId}/domains`;

  const res = await fetch(url, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify({ name: domain }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? 'Error agregando subdominio en Vercel');
  }

  const data = await res.json();
  return { id: data.name, domain };
}

export async function removeSubdomain(slug: string): Promise<void> {
  const domain    = `${slug}.factucon.vercel.app`;
  const teamId    = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;

  const url = teamId
    ? `${VERCEL_API}/v9/projects/${projectId}/domains/${domain}?teamId=${teamId}`
    : `${VERCEL_API}/v9/projects/${projectId}/domains/${domain}`;

  await fetch(url, { method: 'DELETE', headers: headers() });
}