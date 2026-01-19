import { createClient } from '@supabase/supabase-js';
import type { UserJSON } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for webhooks
);

// SQL Schema:
// create table users (
//   id text primary key,
//   email text unique not null,
//   first_name text,
//   last_name text,
//   image_url text,
//   created_at timestamp with time zone default now(),
//   updated_at timestamp with time zone default now()
// );

export async function createUser(data: UserJSON) {
  const { error } = await supabase.from('users').insert({
    id: data.id,
    email: data.email_addresses[0]?.email_address ?? '',
    first_name: data.first_name,
    last_name: data.last_name,
    image_url: data.image_url,
  });
  if (error) throw error;
}

export async function updateUser(data: UserJSON) {
  const { error } = await supabase
    .from('users')
    .update({
      email: data.email_addresses[0]?.email_address,
      first_name: data.first_name,
      last_name: data.last_name,
      image_url: data.image_url,
    })
    .eq('id', data.id);
  if (error) throw error;
}

export async function deleteUser(userId: string) {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
}
