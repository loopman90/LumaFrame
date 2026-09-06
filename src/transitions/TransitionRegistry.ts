export type TransitionCategory = "simple" | "ambient" | "cinematic" | "dynamic";

export interface TransitionContext {
  durationMs: number;
  reduceMotion: boolean;
}

export interface TransitionDefinition {
  id: string;
  name: string;
  category: TransitionCategory;
  className: string;
  apply(outgoing: HTMLElement | null, incoming: HTMLElement, context: TransitionContext): Promise<void>;
  cleanup?(outgoing: HTMLElement | null, incoming: HTMLElement): void;
}

export class TransitionRegistry {
  private readonly transitions = new Map<string, TransitionDefinition>();

  register(definition: TransitionDefinition): void {
    this.transitions.set(definition.id, definition);
  }

  get(id: string, reduceMotion = false): TransitionDefinition {
    if (reduceMotion && !["none", "fade", "crossfade"].includes(id)) {
      return this.transitions.get("crossfade") ?? noneTransition;
    }
    return this.transitions.get(id) ?? this.transitions.get("crossfade") ?? noneTransition;
  }

  byCategory(category: TransitionCategory): TransitionDefinition[] {
    return this.all().filter((transition) => transition.category === category);
  }

  all(): TransitionDefinition[] {
    return [...this.transitions.values()];
  }
}

export function createTransitionRegistry(): TransitionRegistry {
  const registry = new TransitionRegistry();
  transitionSeeds.forEach((seed) => registry.register(createCssTransition(seed)));
  return registry;
}

const noneTransition: TransitionDefinition = {
  id: "none",
  name: "None",
  category: "simple",
  className: "lumaframe-transition-none",
  apply: async (_outgoing, incoming) => {
    incoming.addClass("lumaframe-media-active");
  }
};

const transitionSeeds: Array<Omit<TransitionDefinition, "apply">> = [
  { id: "none", name: "None", category: "simple", className: "lumaframe-transition-none" },
  { id: "fade", name: "Fade", category: "simple", className: "lumaframe-transition-fade" },
  { id: "crossfade", name: "Crossfade", category: "simple", className: "lumaframe-transition-crossfade" },
  { id: "dissolve", name: "Dissolve", category: "simple", className: "lumaframe-transition-dissolve" },
  { id: "slide-left", name: "Slide Left", category: "simple", className: "lumaframe-transition-slide-left" },
  { id: "slide-right", name: "Slide Right", category: "simple", className: "lumaframe-transition-slide-right" },
  { id: "slide-up", name: "Slide Up", category: "simple", className: "lumaframe-transition-slide-up" },
  { id: "slide-down", name: "Slide Down", category: "simple", className: "lumaframe-transition-slide-down" },
  { id: "push-left", name: "Push Left", category: "simple", className: "lumaframe-transition-push-left" },
  { id: "push-right", name: "Push Right", category: "simple", className: "lumaframe-transition-push-right" },
  { id: "zoom-in", name: "Zoom In", category: "simple", className: "lumaframe-transition-zoom-in" },
  { id: "zoom-out", name: "Zoom Out", category: "simple", className: "lumaframe-transition-zoom-out" },
  { id: "soft-zoom", name: "Soft Zoom", category: "ambient", className: "lumaframe-transition-soft-zoom" },
  { id: "blur-in", name: "Blur In", category: "ambient", className: "lumaframe-transition-blur-in" },
  { id: "blur-crossfade", name: "Blur Crossfade", category: "ambient", className: "lumaframe-transition-blur-crossfade" },
  { id: "scale-fade", name: "Scale Fade", category: "ambient", className: "lumaframe-transition-scale-fade" },
  { id: "parallax-left", name: "Parallax Left", category: "cinematic", className: "lumaframe-transition-parallax-left" },
  { id: "parallax-right", name: "Parallax Right", category: "cinematic", className: "lumaframe-transition-parallax-right" },
  { id: "ken-burns-in", name: "Ken Burns In", category: "cinematic", className: "lumaframe-transition-ken-burns-in" },
  { id: "ken-burns-out", name: "Ken Burns Out", category: "cinematic", className: "lumaframe-transition-ken-burns-out" },
  { id: "film-dissolve", name: "Film Dissolve", category: "cinematic", className: "lumaframe-transition-film-dissolve" },
  { id: "light-sweep", name: "Light Sweep", category: "cinematic", className: "lumaframe-transition-light-sweep" },
  { id: "soft-flash", name: "Soft Flash", category: "cinematic", className: "lumaframe-transition-soft-flash" },
  { id: "iris-reveal", name: "Iris Reveal", category: "dynamic", className: "lumaframe-transition-iris-reveal" },
  { id: "mask-reveal", name: "Mask Reveal", category: "dynamic", className: "lumaframe-transition-mask-reveal" },
  { id: "vertical-wipe", name: "Vertical Wipe", category: "dynamic", className: "lumaframe-transition-vertical-wipe" },
  { id: "horizontal-wipe", name: "Horizontal Wipe", category: "dynamic", className: "lumaframe-transition-horizontal-wipe" },
  { id: "split-reveal", name: "Split Reveal", category: "dynamic", className: "lumaframe-transition-split-reveal" },
  { id: "depth-push", name: "Depth Push", category: "cinematic", className: "lumaframe-transition-depth-push" },
  { id: "floating-frame", name: "Floating Frame", category: "ambient", className: "lumaframe-transition-floating-frame" },
  { id: "perspective-shift", name: "Perspective Shift", category: "dynamic", className: "lumaframe-transition-perspective-shift" },
  { id: "gentle-drift", name: "Gentle Drift", category: "ambient", className: "lumaframe-transition-gentle-drift" },
  { id: "dream-blur", name: "Dream Blur", category: "ambient", className: "lumaframe-transition-dream-blur" },
  { id: "cinematic-reveal", name: "Cinematic Reveal", category: "cinematic", className: "lumaframe-transition-cinematic-reveal" },
  { id: "ambient-float", name: "Ambient Float", category: "ambient", className: "lumaframe-transition-ambient-float" }
];

function createCssTransition(seed: Omit<TransitionDefinition, "apply">): TransitionDefinition {
  return {
    ...seed,
    apply: (outgoing, incoming, context) =>
      new Promise((resolve) => {
        const duration = context.reduceMotion ? Math.min(context.durationMs, 250) : context.durationMs;
        incoming.style.setProperty("--lumaframe-transition-duration", `${duration}ms`);
        outgoing?.style.setProperty("--lumaframe-transition-duration", `${duration}ms`);
        incoming.addClass("lumaframe-media-active", seed.className, "lumaframe-transition-in");
        outgoing?.addClass("lumaframe-transition-out");
        window.setTimeout(() => resolve(), duration);
      }),
    cleanup: (outgoing, incoming) => {
      outgoing?.detach();
      incoming.removeClass("lumaframe-transition-in");
      incoming.removeClass(seed.className);
    }
  };
}
