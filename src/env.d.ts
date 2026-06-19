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
    /** Renders the title as a giant stat number. */
    isStat?: boolean;
  }

  /**
   * ### Card Component
   * 
   * A clean content tile featuring subtle shadow hover, transition parameters, and focus indicators.
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
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/Task.astro' {
  export interface Props {
    /** The unique storage identifier for this checklist item. Must match an ID defined inside GLOBAL_TASK_REGISTRY in `trackingHelper.client.ts`. */
    id: string;
    /** The parent progress track identifier this task contributes percentage calculations to. */
    trackId: 'tech1' | 'tech2' | 'prestaff' | 'lvl0' | 'lvl1' | 'lvl2' | 'lvl3' | 'lvl4' | 'lvl5' | 'lvl6' | 'lvl7' | 'leadsheets';
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
     * Minimum responsive item width before wrapping.
     */
    minWidth?: string; 
    /** 
     * Grid layout gap spacing.
     */
    gap?: string;
    /** 
     * Activates interactive client-side query search and filters.
     */
    searchable?: boolean;
    /** 
     * Placeholder text inside search input boxes.
     */
    placeholder?: string;
    /** 
     * List of category filter options.
     */
    filterOptions?: FilterOption[];
  }

  /**
   * ### Grid Component
   * 
   * A responsive layout container used to align components (like Cards or Resources) into responsive grids, with optional interactive client-side search filtering.
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/TracksContainer.astro' {
  /**
   * ### TracksContainer Component
   * 
   * A structural container that groups track blocks. It manages margins, spacing,
   * responsive columns, and prints the visual legend chips on the top layout rail.
   * 
   * @example
   * <TracksContainer>
   *   <TrackBlock title="The reading & technique spine" badge="MANDATORY" accentColor="gold">
   *     Technique 1 and 2 first...
   *   </TrackBlock>
   * </TracksContainer>
   */
  const Component: (props: Record<string, never>) => any;
  export default Component;
}

declare module '@components/TrackBlock.astro' {
  export interface Props {
    /** The primary title heading text populated inside the track header. */
    title: string;
    /** The text written on the uppercase metadata badge. */
    badge: string;
    /** Theme styling preset applied to left decorative borders and badges. */
    accentColor?: 'gold' | 'rose';
  }

  /**
   * ### TrackBlock Component
   * 
   * A structured panel representing a specific path or track node in the curriculum.
   * Features custom accent borders, custom badge tags, and styled container spacing.
   * 
   * @example
   * <TrackBlock title="The reading & technique spine" badge="MANDATORY" accentColor="gold">
   *   Technique 1 and 2 first...
   * </TrackBlock>
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/ProgressCard.astro' {
  export interface Props {
    /** The parent progress track identifier this task contributes calculations to. */
    trackId: string;
    /** The descriptive title heading printed inside the progress card. */
    title: string;
  }

  /**
   * ### ProgressCard Component
   * 
   * An individual card displaying completion progress for a single track.
   * Features a high-contrast progress bar track dynamically updated by the state engine.
   * 
   * @example
   * <ProgressCard trackId="tech1" title="Technique 1: Posture & Arm Weight" />
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/VerificationBox.astro' {
  export interface Props {
    /** Unique parent progress track identifier (e.g. 'prestaff' or 'lvl0'). */
    trackId: string;
    /** Heading title displayed in the verification box header. */
    title: string;
    /** Optional metadata subtitle or description text below the heading. */
    subtitle?: string;
    /** Associated grade level string (e.g. '≈ ABRSM/RCM Preparatory'). */
    levelInfo?: string;
  }

  /**
   * ### VerificationBox Component
   * 
   * Outer container for a level's checklist and benchmarks.
   * Displays a gold left accent border and header with progress metrics on the right.
   * 
   * @example
   * <VerificationBox trackId="prestaff" title="Pre-Staff" levelInfo="≈ Preparatory">
   *   ... content ...
   * </VerificationBox>
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/BenchmarkGuide.astro' {
  export interface Props {
    /** The title displayed inside the benchmark callout block. */
    title: string;
  }

  /**
   * ### BenchmarkGuide Component
   * 
   * Renders a dashed gold border callout for level benchmark instructions.
   * 
   * @example
   * <BenchmarkGuide title="How to use these benchmarks">
   *   The free Mayron Cole Audition Book page...
   * </BenchmarkGuide>
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/AuditionCard.astro' {
  export interface Props {
    /** The title displayed inside the audition card. */
    title: string;
    /** Associated composer name. */
    composer?: string;
    /** Destination link for the main CTA button action. */
    link: string;
    /** Custom text for the main CTA button action. */
    buttonText?: string;
    /** Space-separated categories/tags (e.g. 'free'). */
    tags?: string;
  }

  /**
   * ### AuditionCard Component
   * 
   * A card specifically designed to highlight benchmark audition levels.
   * Features customizable category badges and clean CTA buttons.
   * 
   * @example
   * <AuditionCard title="Cole Audition Book" link="..." tags="free">
   *   Sight-read this page cleanly...
   * </AuditionCard>
   */
  const Component: (props: Props) => any;
  export default Component;
}

declare module '@components/GridCol.astro' {
  /**
   * ### GridCol Component
   * 
   * A layout column wrapper designed to group elements cleanly inside a multi-column Grid 
   * without using raw HTML div tags inside MDX content files.
   * 
   * @example
   * <GridCol>
   *   <Task id="..." />
   * </GridCol>
   */
  const Component: (props: Record<string, never>) => any;
  export default Component;
}
