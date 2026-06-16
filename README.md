To set up the split-screen live preview with Keystatic, here is the step-by-step roadmap for your project from this point forward.

---

### Phase 1: Content Porting & Component Building (Your Current Stage)
*Do this entirely inside your local code editor (VS Code/Cursor).*

1.  **Build your Components:** Finalize the design of your custom Astro components (like `Callout` and `Card`) inside `src/components/`. 
2.  **Add JSDoc Comments:** Strictly document their `Props` interfaces in the component frontmatter using JSDoc. This ensures you have autocompletion as you build [2].
3.  **Port Your Pages:** Copy-paste and clean up your legacy HTML content, converting pages into standard Starlight `.mdx` files under `src/content/docs/`. Use your custom `<Callout>` and `<Card>` tags inline where needed.
4.  **Confirm Local Dev Works:** Run `pnpm dev` locally and make sure every Starlight page compiles, formats, and displays correctly.

---

### Phase 2: Configure your SSR Adapter (For Production Previews)
*To render previews dynamically in production (Vercel, Netlify, or Cloudflare), Astro must be configured for Server-Side Rendering (SSR) [1.2.8].*

1.  **Add an SSR Adapter:** Choose your hosting provider (e.g., Vercel) and run the Astro CLI command to add the adapter:
    ```zsh
    pnpm astro add vercel
    ```
2.  **Set Output Mode:** Ensure your `astro.config.mjs` is configured with `output: 'hybrid'` (this keeps your Starlight docs pre-rendered as fast static HTML, but allows Keystatic's admin panel and preview endpoints to run on-demand server-side) [1.2.8]:
    ```javascript
    // astro.config.mjs
    export default defineConfig({
      output: 'hybrid',
      integrations: [starlight({ ... }), react(), keystatic()]
    });
    ```

---

### Phase 3: Set Up Keystatic & Component Schemas
*Now that your content is ported and your component properties are finalized, you can write your Keystatic schemas.*

1.  **Create your Config:** Create the `keystatic.config.ts` file in your project root.
2.  **Map JSDoc to Fields:** Look directly at the JSDoc `Props` you wrote in Phase 1 [2]. Map each property (such as `accentColor` or `bordered`) to its corresponding Keystatic field preset (like `fields.select()` or `fields.checkbox()`) [1.1.2, 1.1.4].
3.  **Define Collections:** Tell Keystatic to read and write directly to your Starlight path (`src/content/docs/***`).
4.  **Local Test:** Run `pnpm dev` and visit `localhost:4321/keystatic` to verify that you can visually edit pages locally.

---

### Phase 4: Configure the Split-Screen Live Preview (`previewUrl`)
*This is where the preview configuration connects Keystatic to your Astro engine.*

#### 1. Understand the environment distinction:
*   **In Development (Local):** Keystatic writes directly to your local files. Since Astro’s dev server automatically watches files and hot-reloads, Keystatic's preview iframe can point directly to `/reference/{slug}`. It will refresh automatically.
*   **In Production (GitHub Mode):** When collaborators edit online, Keystatic writes to a branch on GitHub. To preview this branch *before* merging, Astro needs to dynamically read the uncommitted files from that branch and render them.

#### 2. Configure `previewUrl` in your config:
Add the `previewUrl` parameter to your Starlight collection inside `keystatic.config.ts` [1.1.1]:

```typescript
// keystatic.config.ts
export default config({
  collections: {
    docs: collection({
      label: 'Starlight Pages',
      path: 'src/content/docs/**/*',
      slugField: 'title',
      // Directs Keystatic's iframe to your dynamic preview endpoint
      previewUrl: `/api/preview?branch={branch}&to=/reference/{slug}`,
      schema: { ... }
    }),
  },
});
```

#### 3. Create the Astro Preview Endpoint:
Create an Astro API route at `src/pages/api/preview.ts` [1.2.5]. This route handles the incoming Keystatic preview request:

```typescript
// src/pages/api/preview.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const branch = url.searchParams.get('branch');
  const targetPath = url.searchParams.get('to');

  if (!branch || !targetPath) {
    return new Response('Missing parameters', { status: 400 });
  }

  // If editing locally, redirect straight to the local dev route
  if (process.env.NODE_ENV === 'development') {
    return redirect(targetPath);
  }

  // In production, set cookies/tokens to tell Astro's draft router 
  // to fetch content from the Keystatic GitHub branch instead of main.
  const response = redirect(targetPath);
  response.headers.append('Set-Cookie', `keystatic-preview-branch=${branch}; Path=/; HttpOnly; SameSite=Lax`);
  return response;
};
```

#### 4. Configure Starlight to render the Draft Branch in Production:
Create a dynamic draft reader utility that checks if a preview cookie exists. If it does, instead of reading files from your static build, configure Starlight to fetch the file contents on demand from the specified GitHub branch using the Keystatic GitHub reader API [1.1.1].

---

### Phase 5: Deploy & Invite Collaborators
1.  **Publish to GitHub:** Push your code to your GitHub repository.
2.  **Deploy to Hosting Provider:** Link your repository to Vercel, Netlify, or your preferred host.
3.  **Enable GitHub Storage:** Change Keystatic's storage storage setting from `'local'` to `'github'` and configure your GitHub App connection keys in your environment variables.
4.  **Invite Contributors:** Share your live website `/keystatic` admin link with your collaborators so they can log in, edit visually, and submit Pull Requests [1.2.2].
