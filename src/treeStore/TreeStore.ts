import type { TreeId, TreeItem, TreeItemBase } from './types';

function idKey(id: TreeId): string {
  return String(id);
}

export class TreeStore<T extends TreeItemBase = TreeItem> {
  private readonly byKey = new Map<string, T>();
  private orderKeys: string[] = [];
  private readonly childrenByParent = new Map<string, TreeId[]>();
  private cachedAll: T[] | null = null;

  constructor(items: readonly T[]) {
    this.rebuildFrom(items);
  }

  private rebuildFrom(items: readonly T[]): void {
    this.byKey.clear();
    this.childrenByParent.clear();
    this.orderKeys = [];

    const seen = new Set<string>();
    for (const item of items) {
      const k = idKey(item.id);
      if (seen.has(k)) {
        throw new Error(`Duplicate item id: ${k}`);
      }
      seen.add(k);
      this.byKey.set(k, item);
      this.orderKeys.push(k);
    }

    for (const item of items) {
      if (item.parent == null) {
        continue;
      }
      const pk = idKey(item.parent);
      let list = this.childrenByParent.get(pk);
      if (!list) {
        list = [];
        this.childrenByParent.set(pk, list);
      }
      list.push(item.id);
    }
    this.cachedAll = null;
  }

  getAll(): T[] {
    if (this.cachedAll) {
      return this.cachedAll;
    }
    const out: T[] = [];
    for (const k of this.orderKeys) {
      const row = this.byKey.get(k);
      if (row) {
        out.push(row);
      }
    }
    this.cachedAll = out;
    return out;
  }

  getItem(id: TreeId): T | undefined {
    return this.byKey.get(idKey(id));
  }

  getChildren(id: TreeId): T[] {
    const ids = this.childrenByParent.get(idKey(id));
    if (!ids?.length) {
      return [];
    }
    const out: T[] = [];
    for (const cid of ids) {
      const row = this.byKey.get(idKey(cid));
      if (row) {
        out.push(row);
      }
    }
    return out;
  }

  getAllChildren(id: TreeId): T[] {
    const rootKey = idKey(id);
    const seed = this.childrenByParent.get(rootKey) ?? [];
    const stack: TreeId[] = [...seed].reverse();
    const out: T[] = [];

    while (stack.length) {
      const cid = stack.pop()!;
      const row = this.byKey.get(idKey(cid));
      if (!row) {
        continue;
      }
      out.push(row);
      const next = this.childrenByParent.get(idKey(cid));
      if (next?.length) {
        for (let i = next.length - 1; i >= 0; i--) {
          stack.push(next[i]!);
        }
      }
    }
    return out;
  }

  getAllParents(id: TreeId): T[] {
    const path: T[] = [];
    let cur: TreeId | null | undefined = id;
    while (cur != null) {
      const row = this.byKey.get(idKey(cur));
      if (!row) {
        break;
      }
      path.push(row);
      cur = row.parent;
    }
    return path;
  }

  getPathKeysFromRoot(id: TreeId): string[] {
    const keys: string[] = [];
    let cur: TreeId | null | undefined = id;
    while (cur != null) {
      keys.push(idKey(cur));
      const row = this.byKey.get(idKey(cur));
      if (!row) {
        break;
      }
      cur = row.parent;
    }
    keys.reverse();
    return keys;
  }

  hasChildren(id: TreeId): boolean {
    const ch = this.childrenByParent.get(idKey(id));
    return !!ch?.length;
  }

  addItem(item: T): void {
    const k = idKey(item.id);
    if (this.byKey.has(k)) {
      throw new Error(`Item already exists: ${k}`);
    }
    this.byKey.set(k, item);
    this.orderKeys.push(k);
    if (item.parent != null) {
      const pk = idKey(item.parent);
      let list = this.childrenByParent.get(pk);
      if (!list) {
        list = [];
        this.childrenByParent.set(pk, list);
      }
      list.push(item.id);
    }
    this.cachedAll = null;
  }

  removeItem(id: TreeId): void {
    const k = idKey(id);
    if (!this.byKey.has(k)) {
      return;
    }

    const toRemove = new Set<string>();
    const stack: TreeId[] = [id];
    while (stack.length) {
      const cid = stack.pop()!;
      const ck = idKey(cid);
      if (toRemove.has(ck)) {
        continue;
      }
      toRemove.add(ck);
      const kids = this.childrenByParent.get(ck);
      if (kids?.length) {
        for (const kid of kids) {
          stack.push(kid);
        }
      }
    }

    const rootRow = this.byKey.get(k);
    if (rootRow?.parent != null) {
      this.removeChildIdFromList(idKey(rootRow.parent), rootRow.id);
    }

    for (const rk of toRemove) {
      this.byKey.delete(rk);
      this.childrenByParent.delete(rk);
    }

    if (this.orderKeys.length) {
      const nextOrder: string[] = [];
      for (const ok of this.orderKeys) {
        if (!toRemove.has(ok)) {
          nextOrder.push(ok);
        }
      }
      this.orderKeys = nextOrder;
    }
    this.cachedAll = null;
  }

  updateItem(next: T): void {
    const k = idKey(next.id);
    const prev = this.byKey.get(k);
    if (!prev) {
      throw new Error(`updateItem: unknown id ${k}`);
    }

    if (next.parent != null && this.wouldCreateCycle(next.id, next.parent)) {
      throw new Error('updateItem: parent assignment would create a cycle');
    }

    const parentChanged = prev.parent !== next.parent;

    if (parentChanged) {
      if (prev.parent != null) {
        this.removeChildIdFromList(idKey(prev.parent), prev.id);
      }
      if (next.parent != null) {
        const pk = idKey(next.parent);
        let list = this.childrenByParent.get(pk);
        if (!list) {
          list = [];
          this.childrenByParent.set(pk, list);
        }
        list.push(next.id);
      }
    }

    this.byKey.set(k, next);
    this.cachedAll = null;
  }

  private wouldCreateCycle(nodeId: TreeId, newParent: TreeId): boolean {
    let cur: TreeId | null | undefined = newParent;
    const nk = idKey(nodeId);
    while (cur != null) {
      if (idKey(cur) === nk) {
        return true;
      }
      const row = this.byKey.get(idKey(cur));
      if (!row) {
        break;
      }
      cur = row.parent;
    }
    return false;
  }

  private removeChildIdFromList(parentKey: string, childId: TreeId): void {
    const list = this.childrenByParent.get(parentKey);
    if (!list) {
      return;
    }
    const idx = list.findIndex((c) => idKey(c) === idKey(childId));
    if (idx === -1) {
      return;
    }
    if (list.length === 1) {
      this.childrenByParent.delete(parentKey);
      return;
    }
    list.splice(idx, 1);
  }
}
