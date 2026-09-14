/**
 * 二叉最小堆优先队列（独立实现，不依赖第三方库）。
 * 按优先级（f 值）出队，f 相同时按插入顺序保证确定性。
 */
interface HeapItem<T> {
  priority: number;
  order: number;
  value: T;
}

export class PriorityQueue<T> {
  private heap: HeapItem<T>[] = [];
  private counter = 0;

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /** 入队：priority 越小越先出队 */
  enqueue(value: T, priority: number): void {
    this.heap.push({ priority, order: this.counter++, value });
    this.bubbleUp(this.heap.length - 1);
  }

  /** 出队：返回优先级最小的元素；空队列返回 undefined */
  dequeue(): T | undefined {
    const top = this.heap[0];
    if (!top) return undefined;
    const last = this.heap.pop() as HeapItem<T>;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return top.value;
  }

  private less(a: HeapItem<T>, b: HeapItem<T>): boolean {
    return a.priority < b.priority || (a.priority === b.priority && a.order < b.order);
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.less(this.heap[index], this.heap[parent])) {
        [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
        index = parent;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    const n = this.heap.length;
    for (;;) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;
      if (left < n && this.less(this.heap[left], this.heap[smallest])) smallest = left;
      if (right < n && this.less(this.heap[right], this.heap[smallest])) smallest = right;
      if (smallest === index) break;
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}
