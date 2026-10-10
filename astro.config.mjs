import { defineConfig, sessionDrivers } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import keystatic from '@keystatic/astro';
import mdxComponents from './integrations/mdx-components.mjs';
import { GITHUB_REPO, KEYSTATIC_GITHUB_APP_SLUG, SECTIONS, SITE_URL } from './site.config.mjs';

// `astro dev` runs on Node, without the adapter: there the Keystatic admin edits the files on
// disk, which needs a real filesystem. Builds use the Cloudflare adapter; the admin they contain
// works through GitHub instead (see keystatic.config.ts).
const isDev = process.argv.includes('dev');

// Keystatic reads the slug of its GitHub App from this variable when the admin is bundled.
// It is kept in site.config.mjs rather than in an untracked .env file so that every build has
// it, including the ones Cloudflare runs.
if (KEYSTATIC_GITHUB_APP_SLUG) process.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG = KEYSTATIC_GITHUB_APP_SLUG;

const GOOGLE_FONTS =
	'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';

// https://astro.build/config
export default defineConfig({
	site: SITE_URL || undefined,
	// Nothing here uses Astro sessions (the admin keeps its sign-in in cookies). Naming a driver
	// stops the adapter from defaulting to a Cloudflare KV store that would have to be created.
	session: { driver: sessionDrivers.memory() },
	vite: {
		// The Workers build pre-bundles server dependencies with esbuild, which cannot resolve the
		// virtual module Keystatic's routes import the config through. Left out of pre-bundling,
		// the package goes through Vite's own plugins, which can.
		optimizeDeps: { exclude: isDev ? [] : ['@keystatic/astro'] },
	},
	// Every page is prerendered to static HTML (Astro's default `output: 'static'`). The adapter lets
	// individual routes opt out with `export const prerender = false` and run on Cloudflare Workers:
	// the Keystatic admin and its API, and src/pages/api/preview.ts.
	adapter: isDev
		? undefined
		: cloudflare({
				// Optimise images at build time; nothing here needs Cloudflare's runtime image service.
				imageService: 'compile',
				// Prerender in Node, as a plain static build would: Starlight's build-time dependencies
				// (expressive-code, postcss) need Node APIs that the default `workerd` prerenderer lacks.
				prerenderEnvironment: 'node',
			}),
	integrations: [
		starlight({
			title: 'The Complete Pianist',
			components: {
				Head: './src/components/overrides/Head.astro',
				EditLink: './src/components/overrides/EditLink.astro',
			},
			customCss: [
				'./src/styles/custom.css',
			],
			// Adds the section titles that components render to each page's "On this page" list.
			routeMiddleware: './src/routeData.ts',
			social: [
				{ icon: 'github', label: 'GitHub', href: `https://github.com/${GITHUB_REPO}` }
			],
			head: [
				// Bypasses Dark Reader extension to prevent theme-switching conflicts
				{ tag: 'meta', attrs: { name: 'darkreader-lock' } },
				// The logo is public/favicon.svg (Starlight links it by default); these are its
				// fallbacks for clients that don't take SVG icons.
				{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
				// Web fonts: linked here (not @import-ed from CSS) so the browser discovers them immediately
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true } },
				{ tag: 'link', attrs: { rel: 'stylesheet', href: GOOGLE_FONTS } },
			],
			// Each group lists the pages of one folder in src/content/docs/. A page's place and
			// name come from its own frontmatter (`sidebar.order`, `sidebar.label`), so a page
			// created in Keystatic shows up here without touching this file.
			sidebar: [
				{ label: 'Home', link: '/' },
				...SECTIONS.map(({ label, directory }) => ({ label, items: [{ autogenerate: { directory } }] })),
			],
		}),
		mdxComponents({
			// Starlight's own cards, used on the home page. `Card` there would clash with ours.
			external: {
				StarlightCard: { from: '@astrojs/starlight/components', name: 'Card' },
				CardGrid: { from: '@astrojs/starlight/components', name: 'CardGrid' },
			},
		}),
		// The admin is a React app; nothing else on the site uses React.
		react(),
		keystatic(),
	],
});
