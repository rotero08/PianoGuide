import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import keystatic from '@keystatic/astro';
import mdxComponents from './integrations/mdx-components.mjs';

// `astro dev` runs on Node, with the Keystatic admin at /keystatic editing the files on disk
// (Keystatic's local mode needs the real filesystem, which the Workers runtime does not have).
// Builds use the Cloudflare adapter and leave Keystatic out, so the deployed site stays static.
const isDev = process.argv.includes('dev');

const GOOGLE_FONTS =
	'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';

// https://astro.build/config
export default defineConfig({
	// Every page is prerendered to static HTML (Astro's default `output: 'static'`). The adapter lets
	// individual routes opt out with `export const prerender = false` and run on Cloudflare Workers.
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
			},
			customCss: [
				'./src/styles/custom.css',
			],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/rotero08/PianoGuide' }
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
				{ label: 'Foundations', items: [{ autogenerate: { directory: 'foundations' } }] },
				{ label: 'Technique Foundations', items: [{ autogenerate: { directory: 'technique' } }] },
				{ label: 'Sight-Reading Curriculum', items: [{ autogenerate: { directory: 'curriculum' } }] },
				{ label: 'Harmony & Keyboard Track', items: [{ autogenerate: { directory: 'harmony' } }] },
				{ label: 'Reading Skills & Tools', items: [{ autogenerate: { directory: 'skills' } }] },
				{ label: 'Discovery & Reference', items: [{ autogenerate: { directory: 'reference' } }] },
			],
		}),
		mdxComponents({
			// Starlight's own cards, used on the home page. `Card` there would clash with ours.
			external: {
				StarlightCard: { from: '@astrojs/starlight/components', name: 'Card' },
				CardGrid: { from: '@astrojs/starlight/components', name: 'CardGrid' },
			},
		}),
		...(isDev ? [react(), keystatic()] : []),
	],
});
