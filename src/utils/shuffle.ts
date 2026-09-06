export function shuffled<T>(items: T[], random = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = copy[index];
    const swap = copy[swapIndex];
    if (current !== undefined && swap !== undefined) {
      copy[index] = swap;
      copy[swapIndex] = current;
    }
  }
  return copy;
}

export function avoidBoundaryRepeat<T extends { id: string }>(queue: T[], previous?: T): T[] {
  if (!previous || queue.length < 2 || queue[0]?.id !== previous.id) return queue;
  const nextDifferent = queue.findIndex((item) => item.id !== previous.id);
  if (nextDifferent > 0) {
    const first = queue[0];
    const replacement = queue[nextDifferent];
    if (first !== undefined && replacement !== undefined) {
      queue[0] = replacement;
      queue[nextDifferent] = first;
    }
  }
  return queue;
}
