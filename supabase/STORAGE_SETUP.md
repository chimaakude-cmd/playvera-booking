# Activora Supabase Storage setup

Storage holds image **files**. The `sessions.images` JSONB column stores **public URLs** pointing at those files.

| Bucket | Purpose | Public read |
|--------|---------|-------------|
| `session-images` | Main + gallery images from the session wizard | Yes |
| `provider-logos` | Club / provider branding (future) | Yes |
| `email-assets` | Confirmation email images (future) | Yes |

`child-documents` is **not** included yet.

---

## Option A — Create buckets in the Dashboard (click-by-click)

Do this **three times** — once per bucket name below.

### 1. Open Storage

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Open your **Activora** project.
3. In the **left sidebar**, click **Storage** (folder icon).

### 2. Create a bucket

4. Click the green **New bucket** button (top right of the buckets list).
5. In **Name of bucket**, type exactly:
   - First bucket: `session-images`
   - Second bucket: `provider-logos`
   - Third bucket: `email-assets`
6. Turn **Public bucket** **ON** (toggle should be enabled). This allows public read via URL.
7. Leave **Restrict file size** and **Restrict MIME types** off for now — the SQL migration sets limits if you use Option B, or you can set them here:
   - Max size: **10 MB**
   - Allowed types: `image/jpeg`, `image/png`, `image/webp`
8. Click **Create bucket**.

Repeat steps 4–8 for all three bucket names.

### 3. Add Storage policies (required for uploads)

Creating buckets in the UI does **not** add upload/delete policies. After all three buckets exist:

9. In the left sidebar, click **SQL Editor**.
10. Click **+ New query**.
11. Open `supabase/migrations/00002_storage_buckets.sql` in this repo.
12. **Delete** the `insert into storage.buckets ...` block at the top (lines 11–38) if you already created buckets in the Dashboard — keep only the `drop policy` / `create policy` sections and the final `comment on column`.
13. Paste into the SQL Editor and click **Run**.

### 4. Verify

14. Go back to **Storage** → **Buckets**. You should see all three buckets with a **Public** badge.
15. Click `session-images` → **Upload file** → pick a test JPG. After upload, click the file and copy its **Public URL** — it should load in a new browser tab.

---

## Option B — Create everything via SQL (recommended)

1. **SQL Editor** → **+ New query**.
2. Paste the full contents of `supabase/migrations/00002_storage_buckets.sql`.
3. Click **Run**.
4. Confirm in **Storage** → **Buckets** that all three buckets appear as public.

This creates buckets, MIME/size limits, and policies in one step.

---

## App environment

Add to `.env.local` (you likely already have these):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional — default tries Supabase with localStorage fallback:

```env
NEXT_PUBLIC_IMAGE_STORAGE_PROVIDER=supabase
```

Force local-only (no Supabase upload attempts):

```env
NEXT_PUBLIC_IMAGE_STORAGE_PROVIDER=localStorage
```

Restart the dev server after changing env vars.

---

## How the session wizard uses Storage

| Field | Bucket | Limit |
|-------|--------|-------|
| Main session image (required) | `session-images` | 1 |
| Gallery images | `session-images` | Up to 5 |

On successful upload, the wizard saves **public URLs** in `sessions.images`:

```json
{
  "mainImage": "https://…/storage/v1/object/public/session-images/uploads/….jpg",
  "extraImages": ["https://…", "https://…"]
}
```

If Supabase is not configured or an upload fails, images fall back to **localStorage** previews and the wizard shows a clear warning.

---

## Security note

Upload/delete policies currently allow the **anon** key (no login yet). When auth ships, replace anon policies with `authenticated` + provider-scoped rules.
