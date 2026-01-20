// app/api/webhooks/clerk/route.ts
import { verifyWebhook, type WebhookEvent } from '@clerk/nextjs/webhooks';

export async function POST(req: Request) {
  try {
    const evt = await verifyWebhook(req);
    await handleWebhookEvent(evt);
    return Response.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }
}

async function handleWebhookEvent(evt: WebhookEvent) {
  switch (evt.type) {
    case 'user.created':
      // await createUser(evt.data);
      console.log('User created:', evt.data.id);
      break;
    case 'user.updated':
      // await updateUser(evt.data);
      console.log('User updated:', evt.data.id);
      break;
    case 'user.deleted':
      // await deleteUser(evt.data.id);
      console.log('User deleted:', evt.data.id);
      break;
    case 'organization.created':
      // await createOrg(evt.data);
      console.log('Org created:', evt.data.id);
      break;
    case 'organizationMembership.created':
      // await addMember(evt.data);
      console.log('Member added:', evt.data);
      break;
  }
}
