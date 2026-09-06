import type { GalleryPreset } from "../models/GalleryPreset";
import type { TransitionRegistry } from "./TransitionRegistry";

export class TransitionManager {
  private token = 0;

  constructor(private readonly registry: TransitionRegistry) {}

  async transition(outgoing: HTMLElement | null, incoming: HTMLElement, preset: GalleryPreset): Promise<number> {
    const token = ++this.token;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reduceMotion = preset.motion.reduceMotion || prefersReduced;
    const transition = this.registry.get(preset.transitions.transitionId, reduceMotion);
    await transition.apply(outgoing, incoming, {
      durationMs: preset.transitions.durationMs,
      reduceMotion
    });
    if (token === this.token) {
      transition.cleanup?.(outgoing, incoming);
    } else {
      incoming.detach();
    }
    return token;
  }

  cancel(): void {
    this.token += 1;
  }
}
