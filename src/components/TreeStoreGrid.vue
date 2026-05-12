<script setup lang="ts">
import { AgGridVue } from 'ag-grid-vue3';
import {
  type ColDef,
  type GetDataPath,
  type GetRowIdParams,
  type GridApi,
  type GridReadyEvent,
  type ValueGetterParams,
} from 'ag-grid-community';
import { computed, onMounted, ref, shallowRef } from 'vue';
import '../agGridRegister';
import type { TreeItem, TreeItemBase } from '../treeStore/types';
import { TreeStore } from '../treeStore/TreeStore';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

const DEFAULT_COLUMN_DEFS: ColDef<TreeItem> = {
  resizable: false,
  sortable: false,
  filter: false,
} as const;

const props = (
  defineProps<{
    store: TreeStore<TreeItemBase>;
  }>()
);

const getDataPath: GetDataPath<TreeItem> = (data) =>
  props.store.getPathKeysFromRoot(data.id);


const columnDefs = computed<ColDef<TreeItem>[]>(() => [
  {
    headerName: 'Категория',
    flex: 1,
    valueGetter: (p: ValueGetterParams<TreeItem>) => {
      if (!p.data) {
        return '';
      }
      return props.store.hasChildren(p.data.id) ? 'Группа' : 'Элемент';
    },
    ...DEFAULT_COLUMN_DEFS,
  },
  {
    field: 'label',
    headerName: 'Наименование',
    flex: 1,
    ...DEFAULT_COLUMN_DEFS,
  },
]);

const autoGroupColumnDef = computed(
  (): ColDef<TreeItem> => ({
    headerName: '№ п/п',
    flex: 1,
    cellRendererParams: {
      suppressCount: true,
    },
    valueGetter: (p: ValueGetterParams<TreeItem>) => {
      if (!p.data) {
        return '';
      }
      const idx = p.node?.rowIndex;
      if (idx == null) {
        return '';
      }
      return idx + 1;
    },
    ...DEFAULT_COLUMN_DEFS,
  }),
);

function getRowId(p: GetRowIdParams<TreeItem>): string {
  return String(p.data.id);
}

const rowData = ref<TreeItem[]>([]);

function pushRowData(): void {
  rowData.value = props.store.getAll() as TreeItem[];
}

const gridApi = shallowRef<GridApi<TreeItem> | null>(null);
  
function onGridReady(e: GridReadyEvent<TreeItem>): void {
  gridApi.value = e.api;
}

onMounted(() => {
  pushRowData();
});
</script>

<template>
  <div
    class="tree-grid"
  >
    <ag-grid-vue
      class="ag-theme-quartz tree-grid__inner"
      :column-defs="columnDefs"
      :row-data="rowData"
      :tree-data="true"
      :get-data-path="getDataPath"
      :get-row-id="getRowId"
      :auto-group-column-def="autoGroupColumnDef"
      :group-default-expanded="-1"
      :animate-rows="false"
      @grid-ready="onGridReady"
    />
  </div>
</template>

<style scoped lang="scss">
.tree-grid {
  width: 100%;
  min-height: 25vh;
  height: 25vh;

  &__inner {
    width: 100%;
    height: 100%;
  }
}
</style>
