export type TreeId = string | number;

export interface TreeItemBase {
  id: TreeId;
  parent: TreeId | null;
}

export type TreeItem = TreeItemBase & Record<string, unknown>;
