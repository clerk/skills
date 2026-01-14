import express from 'express';
import { verifyWebhook, type WebhookEvent } from '@clerk/express/webhooks';

const app = express();

app.post('/api/webhooks/clerk', async (req, res) => {
  let evt: WebhookEvent;

  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
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

  res.json({ received: true });
});
