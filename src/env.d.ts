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
