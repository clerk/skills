# Server Actions with Auth

## Basic Protected Action

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';

export async function createPost(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;

  await db.posts.create({
    data: { title, authorId: userId },
  });

  revalidatePath('/posts');
}
```

## With Organization Context

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';

export async function createTeamProject(formData: FormData) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    throw new Error('Must be in an organization');
  }

  if (orgRole !== 'org:admin') {
    throw new Error('Only admins can create projects');
  }

  const name = formData.get('name') as string;

  await db.projects.create({
    data: { name, organizationId: orgId },
  });
}
```

## With Permission Checks

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';

export async function deleteProject(projectId: string) {
  const { userId, has } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const canDelete = await has({ permission: 'org:project:delete' });

  if (!canDelete) {
    throw new Error('Missing permission: org:project:delete');
  }

  await db.projects.delete({ where: { id: projectId } });
}
```

## Error Handling Pattern

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createItem(formData: FormData): Promise<ActionResult<Item>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const item = await db.items.create({...});
    return { success: true, data: item };
  } catch (err) {
    return { success: false, error: 'Failed to create item' };
  }
}
```
