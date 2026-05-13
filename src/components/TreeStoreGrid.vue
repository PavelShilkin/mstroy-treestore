<script setup lang="ts">
import { AgGridVue } from 'ag-grid-vue3';
import {
  type CellValueChangedEvent,
  type ColDef,
  type ColTypeDefs,
  type GetDataPath,
  type GetRowIdParams,
  type GridApi,
  type GridReadyEvent,
  type RowClassParams,
  type ValueGetterParams,
} from 'ag-grid-community';
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
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
    editMode?: boolean;
  }>()
);

const editMode = computed(() => props.editMode === true);

const getDataPath: GetDataPath<TreeItem> = (data) =>
  props.store.getPathKeysFromRoot(data.id);


const columnDefs = computed<ColDef<TreeItem>[]>(() => [
  {
    headerName: 'Категория',
    flex: 1,
    cellClass: 'tree-grid__cell--category',
    editable: false,
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
    type: 'editableColumn',
    flex: 1,
    cellClass: 'tree-grid__cell--name',
    editable: editMode.value,
    ...DEFAULT_COLUMN_DEFS,
  },
]);

const autoGroupColumnDef = computed(
  (): ColDef<TreeItem> => ({
    headerName: '№ п/п',
    flex: 1,
    editable: false,
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

const columnTypes = ref<ColTypeDefs>({
  editableColumn: {
      editable: () => {
        return props.editMode;
      },
      cellStyle: () => {
        return { backgroundColor: props.editMode ? "#f4f4f4" : "transparent", color: props.editMode ? "#4a63f2" : "inherit" };
      },
      cellClass: () => {
        return props.editMode ? 'tree-grid__cell--editable' : '';
      },
  },
});


function getRowClass(p: RowClassParams<TreeItem>): string {
  if (!p.node?.data?.id) {
    return '';
  }
  return props.store.hasChildren(p.node.data.id) ? 'tree-grid__cell--parent' : '';
}

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

function onCellValueChanged(e: CellValueChangedEvent<TreeItem>): void {
  if (!editMode.value || e.colDef.field !== 'label') {
    return;
  }
  const data = e.data;
  if (!data) {
    return;
  }
  const label = String(e.newValue ?? '');
  props.store.updateItem({ ...data, label } as TreeItem);
  pushRowData();
}

watch(
  () => props.editMode,
  (enabled) => {
    if (!enabled) {
      gridApi.value?.stopEditing();
    }
  },
);

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
      :header-height="40"
      :row-height="40"
      :default-col-def="{ editable: false }"
      :get-data-path="getDataPath"
      :get-row-id="getRowId"
      :get-row-class="getRowClass"
      :auto-group-column-def="autoGroupColumnDef"
      :group-default-expanded="-1"
      :animate-rows="false"
      :column-types="columnTypes"
      :stop-editing-when-cells-lose-focus="true"
      @grid-ready="onGridReady"
      @cell-value-changed="onCellValueChanged"
    />
  </div>
</template>

<style scoped lang="scss">
.tree-grid {
  width: 100%;
  min-height: 80vh;
  height: 80vh;

  &__inner {
    width: 100%;
    height: 100%;
  }
}

:deep(.tree-grid__cell--parent) {
  font-weight: bold;
}

:deep(.ag-cell-value) {
  padding: 6px 12px !important;
}

:deep(.ag-header-cell) {
  border: var(--ag-borders) var(--ag-border-color);
  border-width: 0;
  
  &:not(:last-child) {
    border-width: 0 1px 0 0; 
  }
}
</style>
