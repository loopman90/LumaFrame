export function shuffled<T>(items: T[], random = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex] as T, copy[index] as T];
  }
  return copy;
}

export function avoidBoundaryRepeat<T extends { id: string }>(queue: T[], previous?: T): T[] {
  if (!previous || queue.length < 2 || queue[0]?.id !== previous.id) return queue;
  const nextDifferent = queue.findIndex((item) => item.id !== previous.id);
  if (nextDifferent > 0) {
    [queue[0], queue[nextDifferent]] = [queue[nextDifferent] as T, queue[0] as T];
  }
  return queue;
}
