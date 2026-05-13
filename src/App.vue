<script setup lang="ts">
import { ref } from 'vue';
import TreeStoreGrid from './components/TreeStoreGrid.vue';
import { TreeStore } from './treeStore';
import type { TreeItem } from './treeStore';

const props = defineProps<{
  defaultItems: TreeItem[];
}>();

const store = new TreeStore(props.defaultItems);

const editMode = ref(false);

function toggleEditMode(): void {
  editMode.value = !editMode.value;
}
</script>

<template>
  <div class="app-shell">
    <header class="app-shell__header">
      <button
        type="button"
        class="app-shell__header-title"
        @click="toggleEditMode"
      >
        {{ editMode ? 'Режим: редактирование' : 'Режим: просмотр' }}
      </button>
    </header>
    <main class="app-shell__main">
      <TreeStoreGrid :store="store" :edit-mode="editMode" />
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
    color: #4a63f2;
    font-weight: 400;
  }

  &__header-title {
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
    cursor: pointer;
    text-align: left;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
