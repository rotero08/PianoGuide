// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '@components/Callout.astro' {
  export interface Props {
    /** The main header title displayed inside the callout block. */
    title?: string;
    /** An alternative heading or label for the callout. If both `title` and `label` are provided, they will merge into the header display. */
    label?: string; 
    /** Optional icon lookup identifier to display next to the header text. */
    icon?: 'info' | 'target' | 'warning' | 'play-box' | 'link' | 'speed-wall' | 'app-trap' | 'acronym-trap' | 'repeat' | 'moon' | 'retreat' | 'chevron-down' | 'star' | 'map' | 'none'; 
    /** If set to true, displays a styled left border using the current accent color. */
    bordered?: boolean; 
    /** The background theme style of the callout box. */
    bgColor?: 'dark' | 'tint' | 'transparent' | 'none';
    /** The accent theme color used to style headers and bordered highlights. */
    accentColor?: 'gold' | 'rose' | 'none';
    /** Custom CSS color variable or hex string to style paragraph typography elements inside. */
    textColor?: string;
  }

  /**
   * ### Callout Component
   * 
   * A styled highlight panel used to emphasize warnings, notes, or tips.
   * 
   * #### Parameters & Options:
   * * `title` *(string)* — The main header title displayed inside the callout block.
   * * `label` *(string)* — An alternative heading or label. Merges with `title` if both are present.
   * * `icon` *('info' | 'target' | 'warning' | 'play-box' | 'link' | 'speed-wall' | 'app-trap' | 'acronym-trap' | 'repeat' | 'moon' | 'retreat' | 'chevron-down' | 'star' | 'map' | 'none')* — Optional icon lookup identifier to display next to the header text. **Default: `"none"`**
   * * `bordered` *(boolean)* — If set to true, displays a styled left border using the current accent color. **Default: `false`**
   * * `bgColor` *('dark' | 'tint' | 'transparent' | 'none')* — The background theme style of the callout box. **Default: `"dark"`**
   * * `accentColor` *('gold' | 'rose' | 'none')* — The accent theme color used to style headers and bordered highlights. **Default: `"gold"`**
   * * `textColor` *(string)* — Custom CSS color variable or hex string to style paragraph typography elements inside.
   * 
   * @example
   * <Callout bordered={true} accentColor="rose" label="Why audiation comes first">
   *   Adult pianists were tested under four conditions...
   * </Callout>
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Card.astro' {
  export interface Props {
    /** The primary title heading text populated inside the card. */
    title: string;
    /** Optional decorative subtitle displayed as monospaced uppercase metadata at the top of the card. */
    subtitle?: string; 
    /** Inserts a bold accent decorative border line on the selected edge. */
    border?: 'top' | 'left' | 'none'; 
    /** Theme styling preset applied to subtitles, decorative borders, and vector icons. */
    accentColor?: 'gold' | 'rose' | 'none';
    /** Optional identifier name of an icon to display inside the card header. */
    icon?: 'info' | 'target' | 'warning' | 'play-box' | 'link' | 'speed-wall' | 'app-trap' | 'acronym-trap' | 'repeat' | 'moon' | 'retreat' | 'chevron-down' | 'star' | 'map' | 'none'; 
    /** Destination URL or path. Setting this renders an action anchor button at the bottom. */
    link?: string; 
    /** The button text displayed when a CTA link is configured. */
    buttonText?: string;
    /** Custom tag classification string used to filter elements in dynamic grids. */
    category?: 'acoustics' | 'pedagogy' | 'theory' | 'none'; 
  }

  /**
   * ### Card Component
   * 
   * A clean content tile featuring subtle shadow hover, transition parameters, and focus indicators.
   * 
   * #### Parameters & Options:
   * * `title` *(string)* — **Required.** The primary title heading text populated inside the card.
   * * `subtitle` *(string)* — Optional decorative subtitle displayed as monospaced uppercase metadata at the top of the card.
   * * `border` *('top' | 'left' | 'none')* — Inserts a bold accent decorative border line on the selected edge. **Default: `"none"`**
   * * `accentColor` *('gold' | 'rose' | 'none')* — Theme styling preset applied to subtitles, decorative borders, and vector icons. **Default: `"gold"`**
   * * `icon` *('info' | 'target' | 'warning' | 'play-box' | 'link' | 'speed-wall' | 'app-trap' | 'acronym-trap' | 'repeat' | 'moon' | 'retreat' | 'chevron-down' | 'star' | 'map' | 'none')* — Optional identifier name of an icon to display inside the card header. **Default: `"none"`**
   * * `link` *(string)* — Destination URL or path. Setting this renders an action anchor button at the bottom.
   * * `buttonText` *(string)* — The button text displayed when a CTA link is configured. **Default: `"Open ↗"`**
   * * `category` *('acoustics' | 'pedagogy' | 'theory' | 'none')* — Custom tag classification string used to filter elements in dynamic grids. **Default: `"none"`**
   * 
   * @example
   * <Card border="left" accentColor="rose" title="The speed-wall trap">
   *   Practising your hardest pieces slowly and hands-together...
   * </Card>
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Resource.astro' {
  export interface Props {
    /** The primary header title of the resource item. */
    title: string;
    /** Destination URL link opened when the resource's action CTA button is clicked. */
    link: string;
    /** Custom text displayed inside the link anchor CTA button. */
    buttonText?: string;
    /** If true, applies a 4px left decorative accent border line. */
    borderLeft?: boolean;
    /** Accent border theme preset color applied when `borderLeft` is active. */
    accentColor?: 'gold' | 'rose' | 'none';
    /** Optional icon lookup identifier name to display next to the title. */
    icon?: 'info' | 'target' | 'warning' | 'play-box' | 'link' | 'speed-wall' | 'app-trap' | 'acronym-trap' | 'repeat' | 'moon' | 'retreat' | 'chevron-down' | 'star' | 'map' | 'none';
    /** Secondary subtitle stats string aligned to the top-right corner. */
    subs?: string;
    /** Descriptive uppercase focus tag details line displayed above the body. */
    focus?: string;
    /** Space-separated metadata category lookup strings mapping to status badges. */
    tags?: string;
  }

  /**
   * ### Resource Component
   * 
   * A structured card to reference books, videos, and PDFs, supporting stylized status badges.
   * 
   * #### Parameters & Options:
   * * `title` *(string)* — **Required.** The primary header title of the resource item.
   * * `link` *(string)* — **Required.** Destination URL link opened when the resource's action CTA button is clicked.
   * * `buttonText` *(string)* — Custom text displayed inside the link anchor CTA button. **Default: `"Open ↗"`**
   * * `borderLeft` *(boolean)* — If true, applies a 4px left decorative accent border line. **Default: `false`**
   * * `accentColor` *('gold' | 'rose' | 'none')* — Accent border theme preset color applied when `borderLeft` is active. **Default: `"rose"`**
   * * `icon` *('info' | 'target' | 'warning' | 'play-box' | 'link' | 'speed-wall' | 'app-trap' | 'acronym-trap' | 'repeat' | 'moon' | 'retreat' | 'chevron-down' | 'star' | 'map' | 'none')* — Optional icon lookup identifier name to display next to the title. **Default: `"none"`**
   * * `subs` *(string)* — Secondary subtitle stats string aligned to the top-right corner.
   * * `focus` *(string)* — Descriptive uppercase focus tag details line displayed above the body.
   * * `tags` *(string)* — Space-separated metadata category lookup strings mapping to status badges. **Default: `""`**
   * 
   * @example
   * <Resource title="Mayron Cole: Pre-Level 1" link="https://www.freepianomethod.com/pre-level-1.html" tags="free recommended" icon="star">
   *   Uses directional arrows and simple finger indexes instead of a staff.
   * </Resource>
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Task.astro' {
  export interface Props {
    /** The unique storage identifier for this checklist item. Must match an ID defined inside GLOBAL_TASK_REGISTRY in `trackingHelper.client.ts`. */
    id: string;
    /** The parent progress track identifier this task contributes percentage calculations to. */
    trackId: 'prestaff' | 'lvl0' | 'leadsheets';
    /** Optional frequency or category tag metadata badge. */
    tag?: 'daily' | 'weekly' | 'monthly' | 'check' | 'prereq' | 'none';
    /** Optional target path or external URL for instructional course materials. */
    link?: string;
    /** Custom text populated inside the optional navigation button. */
    linkText?: string;
  }

  /**
   * ### Task Component
   * 
   * A single, interactive progress checklist row containing a custom circular checkbox.
   * 
   * #### Parameters & Options:
   * * `id` *(string)* — **Required.** The unique storage identifier for this checklist item. Must match an ID defined inside `GLOBAL_TASK_REGISTRY` in `trackingHelper.client.ts`.
   * * `trackId` *('prestaff' | 'lvl0' | 'leadsheets')* — **Required.** The parent progress track identifier this task contributes percentage calculations to.
   * * `tag` *('daily' | 'weekly' | 'monthly' | 'check' | 'prereq' | 'none')* — Optional frequency or category tag metadata badge. **Default: `"none"`**
   * * `link` *(string)* — Optional target path or external URL for instructional course materials.
   * * `linkText` *(string)* — Custom text populated inside the optional navigation button. **Default: `"go →"`**
   * 
   * @example
   * <Task id="check-prestaff-posture" trackId="prestaff" tag="daily" link="/technique/technique-1/">
   *   **Posture drop:** Drop each hand freely onto keys with loose, springy wrists.
   * </Task>
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Collapsible.astro' {
  export interface Props {
    /** The primary title text displayed inside the summary details header. */
    title: string;
    /** If true, renders the widget expanded and open by default. */
    open?: boolean;
    /** Optional icon lookup identifier name to display next to the header text. */
    icon?: 'info' | 'target' | 'warning' | 'play-box' | 'link' | 'speed-wall' | 'app-trap' | 'acronym-trap' | 'repeat' | 'moon' | 'retreat' | 'chevron-down' | 'star' | 'map' | 'none'; 
  }

  /**
   * ### Collapsible Component
   * 
   * An accordion-style details block used to group supplementary lessons or alternatives.
   * 
   * #### Parameters & Options:
   * * `title` *(string)* — **Required.** The primary title text displayed inside the summary details header.
   * * `open` *(boolean)* — If true, renders the widget expanded and open by default. **Default: `false`**
   * * `icon` *('info' | 'target' | 'warning' | 'play-box' | 'link' | 'speed-wall' | 'app-trap' | 'acronym-trap' | 'repeat' | 'moon' | 'retreat' | 'chevron-down' | 'star' | 'map' | 'none')* — Optional icon lookup identifier name to display next to the header text. **Default: `"play-box"`**
   * 
   * @example
   * <Collapsible title="Alternative Method Books & Resources" open={false}>
   *   #### Mayron Cole: Blast Off Junior
   *   Five-lesson introduction to rhythm and key geography.
   * </Collapsible>
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/ScreenTrap.astro' {
  export interface Props {}

  /**
   * ### ScreenTrap Component
   * 
   * A specialized highlight warning panel concerning falling-note piano software traps.
   * 
   * @example
   * <ScreenTrap>
   *   Screens split your attention. Following Anders Ericsson's Peak principles...
   * </ScreenTrap>
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/BranchFlag.astro' {
  export interface Props {
    /** The localized descriptive metadata content string written on the flag label. */
    text: string;
  }

  /**
   * ### BranchFlag Component
   * 
   * A styled status label tag to mark alternative progression routes.
   * 
   * #### Parameters & Options:
   * * `text` *(string)* — **Required.** The localized descriptive metadata content string written on the flag label.
   * 
   * @example
   * <BranchFlag text="Optional branch · unlocks after Level 2" />
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/CurriculumProgress.astro' {
  export interface Props {
    /** Optional custom ID selector to target specific DOM calculations. */
    id?: string;
  }

  /**
   * ### CurriculumProgress Component
   * 
   * Renders the dynamic dashboard percentage tracker, reading values from localStorage.
   * 
   * #### Parameters & Options:
   * * `id` *(string)* — Optional custom ID selector to target specific DOM calculations. **Default: `"curriculumOverview"`**
   * 
   * @example
   * <CurriculumProgress />
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/InteractivePiano.astro' {
  export interface Props {}

  /**
   * ### InteractivePiano Component
   * 
   * A responsive virtual MIDI keyboard with synthesized sounds and custom layout keys.
   * 
   * @example
   * <InteractivePiano />
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Bibliography.astro' {
  export interface Props {}

  /**
   * ### Bibliography Component
   * 
   * Renders the structured academic citation bibliography list, dynamically binding backlink metadata.
   * 
   * @example
   * <Bibliography>
   *   * #ref-1 **Rubin-Rabson, G. (1940).** *Studies in the psychology of memorizing piano music.*
   * </Bibliography>
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Grid.astro' {
  export interface FilterOption {
    /** The programmatic option value, matching card categories. */
    value: string;
    /** The human-readable label shown in the dropdown select option list. */
    label: string;
  }

  export interface Props {
    /** 
     * Force the grid into a strict, fixed column layout.
     * Overrides automated wrapping.
     */
    cols?: number;
    /** 
     * Minimum responsive item width before wrapping to another row.
     */
    minWidth?: string; 
    /** 
     * Grid layout gap spacing.
     */
    gap?: string;
    /** 
     * Activates interactive client-side query search bars and optional category filters.
     */
    searchable?: boolean;
    /** 
     * Placeholder text populated inside search text input boxes.
     */
    placeholder?: string;
    /** 
     * List of filter options categories. Only used if searchable is true.
     */
    filterOptions?: FilterOption[];
  }

  /**
   * ### Grid Component
   * 
   * A responsive layout container used to align components (like Cards or Resources) into responsive grids, with optional interactive client-side search filtering.
   * 
   * #### Parameters & Options:
   * * `cols` *(number)* — Force the grid into a strict, fixed column layout.
   * * `minWidth` *(string)* — Minimum responsive item width before wrapping. **Default: `"320px"`**
   * * `gap` *(string)* — Grid layout gap spacing. **Default: `"1.5rem"`**
   * * `searchable` *(boolean)* — Activates interactive client-side query search and filters. **Default: `false`**
   * * `placeholder` *(string)* — Placeholder text inside search input boxes. **Default: `"Search..."`**
   * * `filterOptions` *(FilterOption[])* — List of category filter options.
   * 
   * @example
   * <Grid cols={2} gap="1rem">
   *   <Card title="Linear Reading" />
   *   <Card title="Intervals + Chords" />
   * </Grid>
   */
  const Component: (props: Props) => any;
  export default Component;
}
