import { describe, expect, it } from 'vitest';
import { TreeStore } from './TreeStore';
import type { TreeItem } from './types';

const sample: TreeItem[] = [
  { id: 1, parent: null, label: 'Айтем 1' },
  { id: '91064cee', parent: 1, label: 'Айтем 2' },
  { id: 3, parent: 1, label: 'Айтем 3' },
  { id: 4, parent: '91064cee', label: 'Айтем 4' },
  { id: 5, parent: '91064cee', label: 'Айтем 5' },
  { id: 6, parent: '91064cee', label: 'Айтем 6' },
  { id: 7, parent: 4, label: 'Айтем 7' },
  { id: 8, parent: 4, label: 'Айтем 8' },
];

describe('TreeStore', () => {
  it('getAll preserves constructor order', () => {
    const store = new TreeStore(sample);
    expect(store.getAll().map((r) => r.id)).toEqual(sample.map((r) => r.id));
  });

  it('getItem resolves numeric and string keys equally', () => {
    const store = new TreeStore(sample);
    expect(store.getItem(1)).toEqual(sample[0]);
    expect(store.getItem('1')).toEqual(sample[0]);
    expect(store.getItem('91064cee')).toEqual(sample[1]);
  });

  it('getChildren returns direct children in source order', () => {
    const store = new TreeStore(sample);
    expect(store.getChildren('91064cee').map((c) => c.id)).toEqual([4, 5, 6]);
    expect(store.getChildren(99)).toEqual([]);
  });

  it('getAllChildren returns subtree in pre-order', () => {
    const store = new TreeStore(sample);
    const sub = store.getAllChildren('91064cee').map((c) => c.id);
    expect(sub).toEqual([4, 7, 8, 5, 6]);
  });

  it('getAllParents order is node → … → root', () => {
    const store = new TreeStore(sample);
    const chain = store.getAllParents(7).map((c) => c.id);
    expect(chain).toEqual([7, 4, '91064cee', 1]);
  });

  it('getPathKeysFromRoot builds root-to-leaf string path', () => {
    const store = new TreeStore(sample);
    expect(store.getPathKeysFromRoot(7)).toEqual(['1', '91064cee', '4', '7']);
  });

  it('addItem appends and links parent', () => {
    const store = new TreeStore(sample);
    store.addItem({ id: 'n1', parent: 1, label: 'new' });
    expect(store.getAll().at(-1)?.id).toBe('n1');
    expect(store.getChildren(1).map((c) => c.id)).toContain('n1');
  });

  it('addItem rejects duplicate id', () => {
    const store = new TreeStore(sample);
    expect(() => store.addItem({ id: 1, parent: null, label: 'dup' })).toThrow(/already exists/);
  });

  it('removeItem drops subtree and order list', () => {
    const store = new TreeStore(sample);
    store.removeItem('91064cee');
    const ids = store.getAll().map((r) => r.id);
    expect(ids).toEqual([1, 3]);
    expect(store.getItem('91064cee')).toBeUndefined();
    expect(store.getItem(4)).toBeUndefined();
  });

  it('updateItem replaces row and can move parent', () => {
    const store = new TreeStore(sample);
    store.updateItem({ id: 3, parent: '91064cee', label: 'moved' });
    expect(store.getItem(3)?.parent).toBe('91064cee');
    expect(store.getChildren(1).map((c) => c.id)).not.toContain(3);
    expect(store.getChildren('91064cee').map((c) => c.id)).toContain(3);
  });

  it('updateItem throws on unknown id', () => {
    const store = new TreeStore(sample);
    expect(() => store.updateItem({ id: 'x', parent: null, label: '?' })).toThrow(/unknown id/);
  });

  it('updateItem rejects cycles', () => {
    const store = new TreeStore(sample);
    expect(() =>
      store.updateItem({ id: 1, parent: 7, label: 'bad' }),
    ).toThrow(/cycle/);
  });

  it('constructor rejects duplicate ids', () => {
    const bad = [...sample, { id: '1', parent: null, label: 'dup' as string }];
    expect(() => new TreeStore(bad)).toThrow(/Duplicate/);
  });

  it('hasChildren', () => {
    const store = new TreeStore(sample);
    expect(store.hasChildren(1)).toBe(true);
    expect(store.hasChildren(7)).toBe(false);
  });

  it('getAll returns stable array until mutation', () => {
    const store = new TreeStore(sample);
    const a = store.getAll();
    const b = store.getAll();
    expect(a).toBe(b);
    store.addItem({ id: 'tmp', parent: null, label: 't' });
    const c = store.getAll();
    expect(c).not.toBe(a);
    expect(c.length).toBe(a.length + 1);
  });

  it('performance: large tree queries stay local', () => {
    const n = 50_000;
    const rows: TreeItem[] = [{ id: 0, parent: null, label: 'root' }];
    for (let i = 1; i < n; i++) {
      rows.push({ id: i, parent: i - 1, label: `n${i}` });
    }
    const store = new TreeStore(rows);
    const t0 = performance.now();
    expect(store.getItem(n - 1)?.id).toBe(n - 1);
    expect(store.getChildren(n - 2).length).toBe(1);
    expect(store.getAllParents(n - 1).length).toBe(n);
    expect(store.getAllChildren(0).length).toBe(n - 1);
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(500);
  });
});
