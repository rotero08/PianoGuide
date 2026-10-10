To set up the split-screen live preview with Keystatic, here is the step-by-step roadmap for your project from this point forward.

---

### Phase 1: Content Porting & Component Building (Done)
*Do this entirely inside your local code editor (VS Code/Cursor).*

1.  **Build your Components:** Finalize the design of your custom Astro components (like `Callout` and `Card`) inside `src/components/`. 
2.  **Add JSDoc Comments:** Strictly document their `Props` interfaces in the component frontmatter using JSDoc. This ensures you have autocompletion as you build [2]. The hover docs and autocomplete you see on component tags inside `.mdx` files are generated from that JSDoc (`integrations/mdx-components.mjs`), so the component file is the only place to edit them.
3.  **Port Your Pages:** Copy-paste and clean up your legacy HTML content, converting pages into standard Starlight `.mdx` files under `src/content/docs/`. Use your custom `<Callout>` and `<Card>` tags inline where needed.
4.  **Confirm Local Dev Works:** Run `pnpm dev` locally and make sure every Starlight page compiles, formats, and displays correctly. `pnpm build`, `pnpm check` (types) and `pnpm test` (a browser smoke test of the checklists, drawers, benchmark picker and citations, run against the build) should all pass.

---

### Phase 2: Configure your SSR Adapter (Done)
*To render previews dynamically in production, Astro needs a server adapter. This project is hosted on Cloudflare.*

1.  **Add an SSR Adapter:** `@astrojs/cloudflare` is installed and enabled in `astro.config.mjs`, with the project settings in `wrangler.jsonc`:
    ```zsh
    pnpm add @astrojs/cloudflare@^13
    pnpm add -D wrangler
    ```
    Install it by version rather than with `pnpm astro add cloudflare`: that command picks the newest adapter, which targets a newer Astro major than the one this project is on (Astro 6 pairs with adapter v13).

    **Cloudflare Workers, not Pages.** Since Astro 6 the Cloudflare adapter only deploys to Cloudflare *Workers* (static files plus a Worker for on-demand routes); Cloudflare *Pages* is no longer supported by it. `pnpm build` now writes the static site to `dist/client/`, and it is deployed with `pnpm exec wrangler deploy` (see Phase 5).
2.  **Set Output Mode:** Nothing to set. `output: 'hybrid'` was removed in Astro 5 and its behaviour is now the default (`output: 'static'`): every page is pre-rendered as fast static HTML, and an individual route opts into on-demand rendering with `export const prerender = false`. Keystatic's admin panel and preview endpoints (Phases 3 and 4) will be those routes:
    ```javascript
    // astro.config.mjs
    export default defineConfig({
      adapter: cloudflare({ ... }),
      integrations: [starlight({ ... })]   // react() and keystatic() join in Phase 3
    });
    ```

---

### Phase 3: Set Up Keystatic & Component Schemas (Done)
*With the content ported and the component properties finalized, Keystatic can edit the pages.*

1.  **Create your Config:** `keystatic.config.ts` in the project root, with `@keystatic/core`, `@keystatic/astro` and `@astrojs/react` installed. Keystatic runs in local mode and is only loaded by `pnpm dev`: local mode writes straight to the files on disk, which needs Node, so the dev server runs on Node while builds stay on the Cloudflare adapter without the admin. (Phase 5 switches production to GitHub storage.)
2.  **Map JSDoc to Fields:** Done automatically. `src/keystatic/components.ts` builds each component's editing form from the same JSDoc `Props` you wrote in Phase 1 [2]: a `string` becomes a text input, a `boolean` a checkbox, a union such as `'gold' | 'rose'` a dropdown, and the JSDoc description becomes the field's help text [1.1.2, 1.1.4]. A new or changed prop shows up in the editor without touching the Keystatic config. A checkbox or dropdown left at its `@default` is not written to the file, so saved pages stay as short as hand-written ones.
3.  **Define Collections:** Each sidebar section is a collection over its folder in `src/content/docs/`, and the home page is a singleton (it is the only page with a hero banner). The sidebar is generated from those folders, so a page created in Keystatic appears in its section by itself; its position and label are the "Sidebar" fields of the page.
4.  **Local Test:** Run `pnpm dev` and visit `localhost:4321/keystatic`. `pnpm test` also checks that every page opens and saves cleanly in the editor.

**What Keystatic needs from a page.** Its MDX editor only understands Markdown plus the components it has a form for, so content pages must not contain `import` lines, `{/* comments */}` or raw HTML. Components are therefore auto-imported: write `<Callout>` and the import is added when the page is compiled. Saving a page in Keystatic also normalises its formatting (one tag per line, props in a fixed order); the rendered page does not change.

---

### Phase 4: Configure the Split-Screen Live Preview (`previewUrl`) (Your Current Stage)
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
2.  **Deploy to Hosting Provider:** Deploy to Cloudflare Workers: run `pnpm build && pnpm exec wrangler deploy`, or connect the repository in the Cloudflare dashboard (Workers Builds) with build command `pnpm build` and deploy command `pnpm exec wrangler deploy`.
3.  **Enable GitHub Storage:** Change Keystatic's storage storage setting from `'local'` to `'github'` and configure your GitHub App connection keys in your environment variables.
4.  **Invite Contributors:** Share your live website `/keystatic` admin link with your collaborators so they can log in, edit visually, and submit Pull Requests [1.2.2].
