import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import TreeStoreGrid from './TreeStoreGrid.vue';
import { TreeStore } from '../treeStore/TreeStore';
import type { TreeItem } from '../treeStore/types';

const items: TreeItem[] = [
  { id: 1, parent: null, label: 'Root' },
  { id: 2, parent: 1, label: 'Child' },
];

const agGridSelector = { name: 'AgGridVue' as const };

describe('TreeStoreGrid', () => {
  it('renders shell and stubs the grid', () => {
    const store = new TreeStore(items);
    const wrapper = mount(TreeStoreGrid, {
      props: { store },
      global: { stubs: { AgGridVue: true } },
    });

    expect(wrapper.find('.tree-grid').exists()).toBe(true);
    expect(wrapper.findComponent(agGridSelector).exists()).toBe(true);
  });

  it('feeds rowData from the store after mount', async () => {
    const store = new TreeStore(items);
    const wrapper = mount(TreeStoreGrid, {
      props: { store },
      global: { stubs: { AgGridVue: true } },
    });

    await nextTick();
    const grid = wrapper.findComponent(agGridSelector);
    expect(grid.props('rowData')).toEqual(store.getAll());
  });

  it('enables tree mode and wires path / row id helpers', async () => {
    const store = new TreeStore(items);
    const wrapper = mount(TreeStoreGrid, {
      props: { store },
      global: { stubs: { AgGridVue: true } },
    });

    await nextTick();
    const grid = wrapper.findComponent(agGridSelector);
    expect(grid.props('treeData')).toBe(true);

    const getDataPath = grid.props('getDataPath') as (row: TreeItem) => string[];
    expect(getDataPath(items[1])).toEqual(['1', '2']);

    const getRowId = grid.props('getRowId') as (p: { data: TreeItem }) => string;
    expect(getRowId({ data: items[0] })).toBe('1');
  });

  it('column category valueGetter reflects hasChildren', async () => {
    const store = new TreeStore(items);
    const wrapper = mount(TreeStoreGrid, {
      props: { store },
      global: { stubs: { AgGridVue: true } },
    });

    await nextTick();
    const grid = wrapper.findComponent(agGridSelector);
    const columnDefs = grid.props('columnDefs') as Array<{
      valueGetter?: (p: { data?: TreeItem }) => string;
    }>;
    const categoryCol = columnDefs[0];
    expect(categoryCol.valueGetter?.({ data: items[0] })).toBe('Группа');
    expect(categoryCol.valueGetter?.({ data: items[1] })).toBe('Элемент');
    expect(categoryCol.valueGetter?.({})).toBe('');
  });

  it('allows editing only the label column when editMode is true', async () => {
    const store = new TreeStore(items);
    const wrapper = mount(TreeStoreGrid, {
      props: { store, editMode: true },
      global: { stubs: { AgGridVue: true } },
    });

    await nextTick();
    const grid = wrapper.findComponent(agGridSelector);
    const columnDefs = grid.props('columnDefs') as Array<{ field?: string; editable?: boolean }>;
    expect(columnDefs[0].editable).toBe(false);
    expect(columnDefs[1].field).toBe('label');
    expect(columnDefs[1].editable).toBe(true);
  });
});
