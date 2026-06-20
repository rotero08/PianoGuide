// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '@components/Callout.astro' {
  export interface Props {
    title?: string;
    label?: string; 
    icon?: 'info' | 'target' | 'warning' | 'play-box' | 'link' | 'speed-wall' | 'app-trap' | 'acronym-trap' | 'repeat' | 'moon' | 'retreat' | 'chevron-down' | 'star' | 'map' | 'none'; 
    bordered?: boolean; 
    bgColor?: 'dark' | 'tint' | 'transparent' | 'none';
    accentColor?: 'gold' | 'rose' | 'none';
    textColor?: string;
    slot?: string;
  }
  /**
   * ### Callout Component
   * 
   * A styled highlight panel used to emphasize warnings, notes, or tips.
   * 
   * #### Parameters & Options:
   * * `title` *(string)* — Optional header title displayed inside the callout block.
   * * `label` *(string)* — Optional alternative heading or label for the callout. If both `title` and `label` are provided, they will merge.
   * * `icon` *(string)* — Optional name of an icon to display beside the title. **Default: `"none"`**
   * * `bordered` *(boolean)* — If set to true, displays a styled left border using the current accent color. **Default: `false`**
   * * `bgColor` *(string)* — The background theme style of the callout box. Options: `'dark' | 'tint' | 'transparent' | 'none'`. **Default: `"dark"`**
   * * `accentColor` *(string)* — The accent theme color used to style headers and bordered highlights. Options: `'gold' | 'rose' | 'none'`. **Default: `"gold"`**
   * * `textColor` *(string)* — Custom CSS color variable or hex string to style paragraph typography elements inside.
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Card.astro' {
  export interface Props {
    title?: string;
    subtitle?: string; 
    border?: 'top' | 'left' | 'none'; 
    accentColor?: 'gold' | 'rose' | 'none';
    icon?: 'info' | 'target' | 'warning' | 'play-box' | 'link' | 'speed-wall' | 'app-trap' | 'acronym-trap' | 'repeat' | 'moon' | 'retreat' | 'chevron-down' | 'star' | 'map' | 'none'; 
    link?: string; 
    buttonText?: string;
    category?: 'acoustics' | 'pedagogy' | 'theory' | 'none'; 
    isStat?: boolean;
    badge?: string;
    variant?: 'card' | 'flat';
    slot?: string;
  }
  /**
   * ### Card Component
   * 
   * A clean content tile featuring subtle shadow hover, transition parameters, and focus indicators.
   * Can also act as a structural layout grouping column with `variant="flat"`.
   * 
   * #### Parameters & Options:
   * * `title` *(string)* — The primary title heading text populated inside the card. (Not rendered in `variant="flat"`).
   * * `subtitle` *(string)* — Optional decorative subtitle displayed as monospaced uppercase metadata at the top of the card.
   * * `border` *(string)* — Inserts a bold accent decorative border line on the selected edge. Options: `'top' | 'left' | 'none'`. **Default: `"none"`**
   * * `accentColor` *(string)* — Theme styling preset applied to subtitles, decorative borders, and vector icons. Options: `'gold' | 'rose' | 'none'`. **Default: `"gold"`**
   * * `icon` *(string)* — Optional identifier name of an icon to display inside the card header. **Default: `"none"`**
   * * `link` *(string)* — Destination URL or path. Setting this renders an action anchor button at the bottom.
   * * `buttonText` *(string)* — The button text displayed when a CTA link is configured. **Default: `"Open ↗"`**
   * * `category` *(string)* — Custom tag classification string used to filter elements inside searchable grids. **Default: `"none"`**
   * * `isStat` *(boolean)* — Renders the title as a giant stat number, colored in the current theme accent. **Default: `false`**
   * * `badge` *(string)* — Text rendered inside an optional monospaced uppercase status badge in the header.
   * * `variant` *(string)* — The layout rendering style: `'card'` (standard boxed card layout) or `'flat'` (borderless column grouping container). **Default: `"card"`**
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Resource.astro' {
  export interface Props {
    id?: string;
    title: string;
    link: string;
    buttonText?: string;
    borderLeft?: boolean;
    accentColor?: 'gold' | 'rose' | 'none';
    icon?: 'info' | 'target' | 'warning' | 'play-box' | 'link' | 'speed-wall' | 'app-trap' | 'acronym-trap' | 'repeat' | 'moon' | 'retreat' | 'chevron-down' | 'star' | 'map' | 'none';
    subs?: string;
    focus?: string;
    tags?: string;
    variant?: 'card' | 'drawer';
    tagline?: string;
    isAlternative?: boolean;
    pinTo?: 'reading' | 'technique';
    practicePlan?: string;
    doneWhen?: string;
    slot?: string;
  }
  /**
   * ### Resource Component
   * 
   * A structured card to reference books, videos, and PDFs, supporting stylized status badges.
   * Supports standard boxed layout ('card') or collapsible row drawer layouts ('drawer').
   * 
   * #### Parameters & Options:
   * * `title` *(string)* — **Required.** The primary header title of the resource.
   * * `link` *(string)* — **Required.** Destination URL link.
   * * `id` *(string)* — Unique identifier for progress state storage. **Required when `variant="drawer"`.**
   * * `buttonText` *(string)* — Custom text displayed inside the link anchor CTA button. **Default: `"Open ↗"`**
   * * `borderLeft` *(boolean)* — If true, applies a 4px left decorative accent border line. Only applies to `variant="card"`. **Default: `false`**
   * * `accentColor` *(string)* — Accent border theme preset color applied when `borderLeft` is active. Options: `'gold' | 'rose' | 'none'`. **Default: `"rose"`**
   * * `icon` *(string)* — Optional icon lookup identifier name. **Default: `"none"`**
   * * `subs` *(string)* — Secondary subtitle stats string aligned to the top-right corner.
   * * `focus` *(string)* — Subtitle tagline displayed above card descriptions. In `'audition'` tags, this behaves as the composer's name.
   * * `tags` *(string)* — Space-separated category tag labels mapping to status badges.
   * * `variant` *(string)* — Specifies the layout style: `'card'` (static grid tile) or `'drawer'` (collapsible row drawer layout). **Default: `"card"`**
   * * `tagline` *(string)* — A short tagline description displayed when collapsed. Only applies to `variant="drawer"`.
   * * `isAlternative` *(boolean)* — Marks if this item belongs to the alternatives block. Only applies to `variant="drawer"`. **Default: `false`**
   * * `pinTo` *(string)* — The target column ID to move this item into when pinned (e.g. 'reading' or 'technique').
   * * `practicePlan` *(string)* — Optional task-management practice plan details. Only applies to `variant="drawer"`.
   * * `doneWhen` *(string)* — Optional completion benchmark specifications. Only applies to `variant="drawer"`.
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Task.astro' {
  export interface Props {
    id: string;
    trackId: 'tech1' | 'tech2' | 'prestaff' | 'lvl0' | 'lvl1' | 'lvl2' | 'lvl3' | 'lvl4' | 'lvl5' | 'lvl6' | 'lvl7' | 'leadsheets';
    tag?: 'daily' | 'weekly' | 'monthly' | 'check' | 'prereq' | 'none';
    link?: string;
    linkText?: string;
    slot?: string;
  }
  /**
   * ### Task Component
   * 
   * A single, interactive progress checklist row containing a custom circular checkbox.
   * 
   * #### Parameters & Options:
   * * `id` *(string)* — **Required.** The unique storage identifier for this checklist item. Must match an ID defined inside GLOBAL_TASK_REGISTRY.
   * * `trackId` *(string)* — **Required.** The parent progress track identifier this task contributes percentage calculations to.
   * * `tag` *(string)* — Optional frequency or category tag metadata badge. Options: `'daily' | 'weekly' | 'monthly' | 'check' | 'prereq' | 'none'`. **Default: `"none"`**
   * * `link` *(string)* — Optional target path or external URL for instructional course materials.
   * * `linkText` *(string)* — Custom text populated inside the optional navigation button. **Default: `"go →"`**
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Collapsible.astro' {
  export interface Props {
    title: string;
    open?: boolean;
    icon?: 'info' | 'target' | 'warning' | 'play-box' | 'link' | 'speed-wall' | 'app-trap' | 'acronym-trap' | 'repeat' | 'moon' | 'retreat' | 'chevron-down' | 'star' | 'map' | 'none'; 
    slot?: string;
  }
  /**
   * ### Collapsible Component
   * 
   * An accordion-style details block used to group supplementary lessons or alternatives.
   * 
   * #### Parameters & Options:
   * * `title` *(string)* — **Required.** The primary title text displayed inside the summary details header.
   * * `open` *(boolean)* — If true, renders the widget expanded and open by default. **Default: `false`**
   * * `icon` *(string)* — Optional icon lookup identifier name beside the header text. **Default: `"play-box"`**
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/ScreenTrap.astro' {
  export interface Props {
    slot?: string;
  }
  /**
   * ### ScreenTrap Component
   * 
   * A specialized highlight warning panel concerning falling-note piano software traps.
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/BranchFlag.astro' {
  export interface Props {
    text: string;
    slot?: string;
  }
  /**
   * ### BranchFlag Component
   * 
   * A styled status label tag to mark alternative progression routes.
   * 
   * #### Parameters & Options:
   * * `text` *(string)* — **Required.** The localized descriptive metadata content string written on the flag label.
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/CurriculumProgress.astro' {
  export interface Props {
    id?: string;
    slot?: string;
  }
  /**
   * ### CurriculumProgress Component
   * 
   * Renders the dynamic dashboard percentage tracker, reading values from localStorage.
   * 
   * #### Parameters & Options:
   * * `id` *(string)* — Optional custom ID selector to target specific DOM calculations. **Default: `"curriculumOverview"`**
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/InteractivePiano.astro' {
  export interface Props {
    slot?: string;
  }
  /**
   * ### InteractivePiano Component
   * 
   * A responsive virtual MIDI keyboard with synthesized sounds and custom layout keys.
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Bibliography.astro' {
  export interface Props {
    slot?: string;
  }
  /**
   * ### Bibliography Component
   * 
   * Renders the structured academic citation bibliography list, dynamically binding backlink metadata.
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Grid.astro' {
  export interface FilterOption {
    value: string;
    label: string;
  }
  export interface Props {
    cols?: number;
    minWidth?: string; 
    gap?: string;
    searchable?: boolean;
    placeholder?: string;
    filterOptions?: FilterOption[];
    legend?: boolean;
    slot?: string;
  }
  /**
   * ### Grid Component
   * 
   * A responsive layout container used to align components into responsive grids, with optional interactive client-side search filtering and track legends.
   * 
   * #### Parameters & Options:
   * * `cols` *(number)* — Force the grid into a strict, fixed column layout. Overrides automated wrapping.
   * * `minWidth` *(string)* — Minimum responsive item width before wrapping. **Default: `"320px"`**
   * * `gap` *(string)* — Grid layout gap spacing. **Default: `"1.5rem"`**
   * * `searchable` *(boolean)* — Activates interactive client-side query search and filters. **Default: `false`**
   * * `placeholder` *(string)* — Placeholder text inside search input boxes. **Default: `"Search..."`**
   * * `filterOptions` *(array)* — List of category filter options.
   * * `legend` *(boolean)* — When enabled, prints the visual track legend chips above the layout. **Default: `false`**
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/ProgressCard.astro' {
  export interface Props {
    trackId: string;
    title: string;
    slot?: string;
  }
  /**
   * ### ProgressCard Component
   * 
   * An individual card displaying completion progress for a single track.
   * Features a high-contrast progress bar track dynamically updated by the state engine.
   * 
   * #### Parameters & Options:
   * * `trackId` *(string)* — **Required.** The parent progress track identifier this task contributes calculations to.
   * * `title` *(string)* — **Required.** The descriptive title heading printed inside the progress card.
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/VerificationBox.astro' {
  export interface Props {
    trackId: string;
    title: string;
    subtitle?: string;
    levelInfo?: string;
    slot?: string;
  }
  /**
   * ### VerificationBox Component
   * 
   * Outer container for a level's checklist and benchmarks.
   * Displays a gold left accent border and header with progress metrics on the right.
   * 
   * #### Parameters & Options:
   * * `trackId` *(string)* — **Required.** Unique parent progress track identifier (e.g. 'prestaff' or 'lvl0').
   * * `title` *(string)* — **Required.** Heading title displayed in the verification box header.
   * * `subtitle` *(string)* — Optional metadata subtitle or description text below the heading.
   * * `levelInfo` *(string)* — Associated grade level string.
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/BenchmarkGuide.astro' {
  export interface Props {
    title: string;
    slot?: string;
  }
  /**
   * ### BenchmarkGuide Component
   * 
   * Renders a dashed gold border callout for level benchmark instructions.
   * 
   * #### Parameters & Options:
   * * `title` *(string)* — **Required.** The title displayed inside the benchmark callout block summary.
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/ResourceColumn.astro' {
  export interface Props {
    id: 'technique' | 'reading';
    title: string;
    subtitle?: string;
    accentColor?: 'gold' | 'rose';
    slot?: string;
  }
  /**
   * ### ResourceColumn Component
   * 
   * A vertical layout column representing a core curriculum track (e.g. Technique & Ear).
   * Manages completion rates and coordinates pinnable alternative resources.
   * 
   * #### Parameters & Options:
   * * `id` *(string)* — **Required.** The target column ID ('technique' or 'reading') to match pinning targets.
   * * `title` *(string)* — **Required.** The heading title for the column.
   * * `subtitle` *(string)* — Optional metadata tagline or subtitle below the header.
   * * `accentColor` *(string)* — Theme styling preset applied to accent headers. Options: `'gold' | 'rose'`. **Default: `"gold"`**
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/AlternativesBox.astro' {
  export interface Props {
    title?: string;
    slot?: string;
  }
  /**
   * ### AlternativesBox Component
   * 
   * A collapsible drawer aggregating secondary alternative study tracks.
   * Features an internal progress indicator matching standard column layouts.
   * 
   * #### Parameters & Options:
   * * `title` *(string)* — The heading title of the collapsible alternatives container. **Default: `"Alternative Method Books & Resources"`**
   */
  const Component: (props: Props) => any;
  export default Component;
}
