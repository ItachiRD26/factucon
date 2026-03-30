import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { updateSubscriptionStatus } from '@/lib/db/companies';

export async function checkAndBlockExpiredSubscriptions(): Promise<{
  blocked:  string[];
  inactive: string[];
}> {
  const now      = new Date();
  const blocked: string[]  = [];
  const inactive: string[] = [];

  const snap = await getDocs(
    query(
      collection(db, 'companies'),
      where('subscription.status', 'in', ['active', 'past_due', 'trial'])
    )
  );

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
      await updateSubscriptionStatus(compId, 'blocked');
      blocked.push(compId);
      continue;
    }

    // Período vencido → past_due o bloquear
    if (sub.status === 'active' && periodEnd && now > periodEnd) {
      const daysPast = (now.getTime() - periodEnd.getTime()) / 86_400_000;
      if (daysPast > 2) {
        await updateSubscriptionStatus(compId, 'blocked');
        blocked.push(compId);
      } else {
        await updateSubscriptionStatus(compId, 'past_due');
      }
      continue;
    }

    // Bloqueado +30 días → inactivo
    if (sub.status === 'blocked' && blockedAt) {
      const daysBlocked = (now.getTime() - blockedAt.getTime()) / 86_400_000;
      if (daysBlocked > 30) {
        await updateSubscriptionStatus(compId, 'inactive');
        inactive.push(compId);
      }
    }
  }

  return { blocked, inactive };
}