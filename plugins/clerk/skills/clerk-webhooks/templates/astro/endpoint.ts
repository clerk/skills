// src/pages/api/webhooks/clerk.ts
import type { APIRoute } from 'astro';
import { verifyWebhook, type WebhookEvent } from '@clerk/astro/webhooks';

export const POST: APIRoute = async ({ request }) => {
  let evt: WebhookEvent;

  try {
    evt = await verifyWebhook(request);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
    });
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

  return new Response(JSON.stringify({ received: true }));
};
