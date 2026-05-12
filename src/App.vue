<script setup lang="ts">
import TreeStoreGrid from './components/TreeStoreGrid.vue';
import { TreeStore } from './treeStore';
import type { TreeItem } from './treeStore';

const props = defineProps<{
  defaultItems: TreeItem[];
}>();

const store = new TreeStore(props.defaultItems);
</script>

<template>
  <div class="app-shell">
    <header class="app-shell__header">
      <h4 class="app-shell__header-title">Режим: просмотр</h4>
    </header>
    <main class="app-shell__main">
      <TreeStoreGrid :store="store" />
    </main>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  width: 100%;
  height: 100%;

  &__header {
    width: 100%;
    height: 100%;
  }
}
</style>
