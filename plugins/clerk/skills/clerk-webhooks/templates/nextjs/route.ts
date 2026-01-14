// app/api/webhooks/clerk/route.ts
import { verifyWebhook, type WebhookEvent } from '@clerk/nextjs/webhooks';

export async function POST(req: Request) {
  let evt: WebhookEvent;

  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('Webhook received:', evt.type, evt.data.id);

  switch (evt.type) {
    case 'user.created':
      // await createUserInDB(evt.data);
      break;
    case 'user.updated':
      // await updateUserInDB(evt.data);
      break;
    case 'user.deleted':
      // await deleteUserFromDB(evt.data.id);
      break;
  }

  return Response.json({ received: true });
}
