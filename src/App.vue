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
      <div class="app-shell__header-title">Режим: просмотр</div>
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
  max-width: 1280px;
  margin: 0 auto;

  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;

  &__header {
    width: 100%;
    height: 100%;
    color: rgb(74, 99, 242);
    font-weight: 400;
  }
} 
</style>
