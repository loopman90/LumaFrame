import type { GalleryPreset } from "../models/GalleryPreset";
import type { TransitionRegistry } from "./TransitionRegistry";

export class TransitionManager {
  private token = 0;

  constructor(private readonly registry: TransitionRegistry) {}

  async transition(outgoing: HTMLElement | null, incoming: HTMLElement, preset: GalleryPreset): Promise<number> {
    const token = ++this.token;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reduceMotion = preset.motion.reduceMotion || prefersReduced;
    const transition = this.registry.get(this.resolveTransitionId(preset, reduceMotion), reduceMotion);
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

  private resolveTransitionId(preset: GalleryPreset, reduceMotion: boolean): string {
    if (preset.transitions.transitionId !== "random") return preset.transitions.transitionId;
    if (reduceMotion) return "crossfade";
    const candidates =
      preset.transitions.randomCategory === "custom"
        ? preset.transitions.customTransitionIds.map((id) => this.registry.get(id))
        : preset.transitions.randomCategory === "all"
          ? this.registry.all()
          : this.registry.byCategory(preset.transitions.randomCategory);
    const usable = candidates.filter((transition) => transition.id !== "none");
    return usable[Math.floor(Math.random() * usable.length)]?.id ?? "crossfade";
  }
}
