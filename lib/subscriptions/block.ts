import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { SubscriptionStatus } from '@/lib/types';

// Actualiza subscription.status (+ blockedAt/inactiveAt) usando el SDK Admin.
// Nota: esto corre desde un cron sin sesión de Firebase Auth, por lo que NO
// puede usar el SDK cliente (lib/db/companies.ts) una vez que firestore.rules
// exige request.auth para leer/escribir "companies".
async function setSubscriptionStatus(companyId: string, status: SubscriptionStatus): Promise<void> {
  const updates: Record<string, unknown> = {
    'subscription.status': status,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (status === 'blocked')  updates['subscription.blockedAt']  = FieldValue.serverTimestamp();
  if (status === 'inactive') updates['subscription.inactiveAt'] = FieldValue.serverTimestamp();
  await adminDb.collection('companies').doc(companyId).update(updates);
}

export async function checkAndBlockExpiredSubscriptions(): Promise<{
  blocked:  string[];
  inactive: string[];
}> {
  const now      = new Date();
  const blocked: string[]  = [];
  const inactive: string[] = [];

  const snap = await adminDb
    .collection('companies')
    .where('subscription.status', 'in', ['active', 'past_due', 'trial'])
    .get();

  for (const docSnap of snap.docs) {
    const data    = docSnap.data();
    const compId  = docSnap.id;
    const sub     = data.subscription;

    if (!sub) continue;

    const periodEnd  = sub.currentPeriodEnd?.toDate?.()  ?? null;
    const trialEnd   = sub.trialEndsAt?.toDate?.()       ?? null;
    const blockedAt  = sub.blockedAt?.toDate?.()         ?? null;

    // Trial vencido → bloquear
    if (sub.status === 'trial' && trialEnd && now > trialEnd) {
      await setSubscriptionStatus(compId, 'blocked');
      blocked.push(compId);
      continue;
    }

    // Período vencido → past_due o bloquear
    if (sub.status === 'active' && periodEnd && now > periodEnd) {
      const daysPast = (now.getTime() - periodEnd.getTime()) / 86_400_000;
      if (daysPast > 2) {
        await setSubscriptionStatus(compId, 'blocked');
        blocked.push(compId);
      } else {
        await setSubscriptionStatus(compId, 'past_due');
      }
      continue;
    }

    // Bloqueado +30 días → inactivo
    if (sub.status === 'blocked' && blockedAt) {
      const daysBlocked = (now.getTime() - blockedAt.getTime()) / 86_400_000;
      if (daysBlocked > 30) {
        await setSubscriptionStatus(compId, 'inactive');
        inactive.push(compId);
      }
    }
  }

  return { blocked, inactive };
}
