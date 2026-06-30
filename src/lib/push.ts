import webpush from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@potlucky.app";

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys belum diatur. Jalankan `npx web-push generate-vapid-keys` dan set NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY."
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  ensureConfigured();

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return { success: true as const };
  } catch (err: unknown) {
    const statusCode =
      typeof err === "object" && err !== null && "statusCode" in err
        ? (err as { statusCode: number }).statusCode
        : null;
    // 404/410 = subscription sudah expired/dicabut user, perlu dihapus dari DB
    return { success: false as const, expired: statusCode === 404 || statusCode === 410 };
  }
}
