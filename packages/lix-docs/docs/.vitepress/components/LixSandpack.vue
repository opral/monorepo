<template>
  <div ref="sandpackContainer" />
</template>

<script setup lang="ts">
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { ref, onMounted, onUnmounted } from "vue";
import LixSandpackReact from "./LixSandpack.jsx";

interface Props {
  example: string;
  feature: string;
  height?: string;
  showConsole?: boolean;
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: "800px",
  showConsole: true,
  fullWidth: false,
});

const sandpackContainer = ref<HTMLDivElement>();
let root: any = null;

onMounted(() => {
  if (sandpackContainer.value) {
    root = createRoot(sandpackContainer.value);
    root.render(
      createElement(LixSandpackReact, {
        feature: props.feature,
        example: props.example,
        height: props.height,
        showConsole: props.showConsole,
        fullWidth: props.fullWidth,
      })
    );
  }
});

onUnmounted(() => {
  if (root) {
    root.unmount();
  }
});
</script>

<style scoped>
.lix-sandpack {
  margin: 1rem 0;
  border-radius: 6px;
  overflow: hidden;
}

:deep(.lix-sandpack-wrapper) {
  border-radius: 6px;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas,
    "Courier New", monospace;
}

:deep(.lix-sandpack-layout) {
  border-radius: 6px;
}

:deep(.sp-console) {
  height: 200px;
  overflow-y: auto;
}

:deep(.sp-console-header) {
  background-color: var(--vp-c-bg-alt);
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

:deep(.sp-console-list) {
  padding: 8px;
  background-color: var(--vp-c-bg-soft);
}

:deep(.sp-console-item) {
  padding: 4px 8px;
  margin: 2px 0;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg);
}

:deep(.sp-console-item.error) {
  background-color: var(--vp-c-danger-soft);
  color: var(--vp-c-danger);
}

:deep(.sp-console-item.warn) {
  background-color: var(--vp-c-warning-soft);
  color: var(--vp-c-warning);
}

:deep(.sp-console-item.info) {
  background-color: var(--vp-c-info-soft);
  color: var(--vp-c-info);
}

/* Full-width styles */
.full-width {
  width: 100%;
}

/* Move console under code and make it bigger */
:deep(.sp-layout) {
  flex-direction: column !important;
}

:deep(.sp-console-wrapper) {
  min-height: 300px !important;
}

:deep(.sp-console) {
  min-height: 300px !important;
}
</style>
