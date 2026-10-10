// site.config.mjs
//
// Facts about the site that more than one file needs. The Astro config, the Keystatic config,
// the "Edit page" link and the preview endpoint all read them from here.

/**
 * The GitHub repository the site is built from, as `owner/name`.
 * @type {`${string}/${string}`}
 */
export const GITHUB_REPO = 'rotero08/PianoGuide';

/** The branch that is deployed as the live site. */
export const PRODUCTION_BRANCH = 'main';

/**
 * Public address of the live site, without a trailing slash. Empty while there is none: the
 * build then skips the sitemap and canonical links.
 */
export const SITE_URL = '';

/**
 * Slug of the GitHub App through which the admin on the live site signs people in and saves to
 * GitHub (the last part of `https://github.com/apps/<slug>`). While it is empty the live site
 * shows no "Edit page" links, because the admin could not sign anyone in.
 * See "Editing on the live site" in the README.
 */
export const KEYSTATIC_GITHUB_APP_SLUG = '';

/**
 * The Worker's `workers.dev` host. Cloudflare serves the preview build of a branch at
 * `<branch>-<this host>`, which is where the admin's "Preview" button goes for any branch
 * other than the production one. Empty: taken from the address the admin is opened on.
 */
export const WORKERS_DEV_HOST = '';

/**
 * The sidebar sections, in order. Each one is a folder of `src/content/docs/`, a group in the
 * sidebar and a Keystatic collection of the same name, so adding a section is: create the folder
 * and add a line here.
 */
export const SECTIONS = [
	{ directory: 'foundations', label: 'Foundations' },
	{ directory: 'technique', label: 'Technique Foundations' },
	{ directory: 'curriculum', label: 'Sight-Reading Curriculum' },
	{ directory: 'harmony', label: 'Harmony & Keyboard Track' },
	{ directory: 'skills', label: 'Reading Skills & Tools' },
	{ directory: 'reference', label: 'Discovery & Reference' },
];
