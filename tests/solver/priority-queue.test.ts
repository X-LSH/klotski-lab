import { describe, expect, it } from 'vitest';
import { PriorityQueue } from '../../src/solver/priority-queue';

describe('优先队列', () => {
  it('按优先级升序出队', () => {
    const q = new PriorityQueue<string>();
    q.enqueue('低', 10);
    q.enqueue('高', 1);
    q.enqueue('中', 5);
    expect(q.dequeue()).toBe('高');
    expect(q.dequeue()).toBe('中');
    expect(q.dequeue()).toBe('低');
    expect(q.dequeue()).toBeUndefined();
  });

  it('相同优先级按插入顺序出队（确定性）', () => {
    const q = new PriorityQueue<string>();
    q.enqueue('a', 1);
    q.enqueue('b', 1);
    q.enqueue('c', 1);
    expect([q.dequeue(), q.dequeue(), q.dequeue()]).toEqual(['a', 'b', 'c']);
  });

  it('大量元素保持堆序', () => {
    const q = new PriorityQueue<number>();
    const values = Array.from({ length: 1000 }, (_, i) => (i * 7919) % 1000);
    values.forEach((v) => q.enqueue(v, v));
    let prev = -1;
    let count = 0;
    while (!q.isEmpty()) {
      const v = q.dequeue() as number;
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
      count += 1;
    }
    expect(count).toBe(1000);
  });

  it('size 正确统计', () => {
    const q = new PriorityQueue<number>();
    expect(q.size).toBe(0);
    q.enqueue(1, 1);
    q.enqueue(2, 2);
    expect(q.size).toBe(2);
    q.dequeue();
    expect(q.size).toBe(1);
  });
});
