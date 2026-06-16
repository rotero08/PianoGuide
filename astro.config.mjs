import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'The Complete Pianist',
			customCss: [
				'./src/styles/custom.css',
			],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }
			],
			head: [
				// Bypasses Dark Reader extension to prevent theme-switching conflicts
				{ tag: 'meta', attrs: { name: 'darkreader-lock' } }
			],
			sidebar: [
				{ label: 'Home', link: '/' },
				{
					label: 'Foundations',
					items: [
						{ label: 'Introduction', link: '/foundations/introduction/' },
						{ label: 'How This Method Works', link: '/foundations/methodology/' },
						{ label: 'The Core Mindset', link: '/foundations/core-mindset/' },
					],
				},
				{
					label: 'Technique Foundations',
					items: [
						{ label: 'Technique 1 (Body & Arm Weight)', link: '/technique/technique-1/' },
						{ label: 'Technique 2 (Hand Shapes)', link: '/technique/technique-2/' },
					],
				},
				{
					label: 'Sight-Reading Curriculum',
					items: [
						{ label: 'Pre-Staff (Arm Weight & Ear)', link: '/curriculum/pre-staff/' },
						{ label: 'Level 0 (Linear Reading)', link: '/curriculum/level-0/' },
						{ label: 'Level 1 (Intervals + Chords)', link: '/curriculum/level-1/' },
						{ label: 'Level 2 (Voices + Geometry)', link: '/curriculum/level-2/' },
						{ label: 'Level 3 (Positional Shifting)', link: '/curriculum/level-3/' },
						{ label: 'Level 4 (Inversions + Speed)', link: '/curriculum/level-4/' },
						{ label: 'Level 5 (Early Polyphony)', link: '/curriculum/level-5/' },
						{ label: 'Level 6 (Counterpoint + Phrasing)', link: '/curriculum/level-6/' },
						{ label: 'Level 7 (Polytonal Independence)', link: '/curriculum/level-7/' },
					],
				},
				{
					label: 'Harmony & Keyboard Track',
					items: [
						{ label: 'Lead Sheets (Level 1)', link: '/harmony/lead-sheets/' },
						{ label: 'Comping & Styles', link: '/harmony/comp-patterns/' },
						{ label: 'Modern / Jazz Harmony', link: '/harmony/jazz-harmony/' },
					],
				},
				{
					label: 'Reading Skills & Tools',
					items: [
						{ label: 'Play By Ear / Apps', link: '/skills/ear-training/' },
						{ label: 'How To Read Music', link: '/skills/reading-music/' },
						{ label: 'Rhythm, Clefs & Decoding', link: '/skills/rhythm-clefs/' },
						{ label: 'Keyboard Geometry', link: '/skills/scales-chords/' },
					],
				},
				{
					label: 'Discovery & Reference',
					items: [
						{ label: 'YouTube Masterclasses', link: '/reference/youtube/' },
						{ label: 'Curated Roadmaps', link: '/reference/roadmaps/' },
						{ label: 'Credits & Contributions', link: '/reference/credits/' },
						{ label: 'Reference Library', link: '/reference/library/' },
					],
				},
			],
		}),
	],
});
