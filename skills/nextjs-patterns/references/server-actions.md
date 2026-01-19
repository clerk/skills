# Server Actions with Auth

| Impact | Tags |
|--------|------|
| HIGH | server-actions, mutations, protection |

## Always Protect Server Actions

**Impact: HIGH** - Unprotected actions are security vulnerabilities

Server Actions are public endpoints. Always verify auth.

**Incorrect (no auth check):**

```typescript
'use server';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  await db.posts.create({ data: { title } }); // Anyone can call this!
}
```

**Correct (auth check first):**

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';

export async function createPost(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  await db.posts.create({ data: { title, authorId: userId } });
  revalidatePath('/posts');
}
```

---

## Organization Context

**Impact: HIGH** - B2B apps need org scoping

**Incorrect (missing org check):**

```typescript
'use server';

export async function createTeamProject(formData: FormData) {
  const { userId } = await auth();
  // Creates project without org context!
  await db.projects.create({ data: { name } });
}
```

**Correct (org + role check):**

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
  await db.projects.create({ data: { name, organizationId: orgId } });
}
```

---

## Permission Checks

**Impact: MEDIUM** - Fine-grained RBAC

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

---

## Error Handling Pattern

**Impact: MEDIUM** - Better UX than throwing

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

Reference: [Server Actions Guide](https://clerk.com/docs/references/nextjs/server-actions)
