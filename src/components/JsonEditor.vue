<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { EditorView, drawSelection, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { bracketMatching, defaultHighlightStyle, foldGutter, foldKeymap, syntaxHighlighting } from '@codemirror/language'
import { json } from '@codemirror/lang-json'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLDivElement>()
let view: EditorView | null = null

onMounted(() => {
  if (!editorRef.value)
    return

  const startState = EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      EditorState.allowMultipleSelections.of(true),
      bracketMatching(),
      highlightActiveLine(),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
      json(),
      EditorView.lineWrapping, // 启用自动换行
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString())
        }
      }),
    ],
  })

  view = new EditorView({
    state: startState,
    parent: editorRef.value,
  })
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (view && newValue !== view.state.doc.toString()) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: newValue,
        },
      })
    }
  },
)

onUnmounted(() => {
  view?.destroy()
})
</script>

<template>
  <div ref="editorRef" class="json-editor" />
</template>

<style scoped>
.json-editor {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
}

.json-editor :deep(.cm-editor) {
  font-size: 13px;
  height: auto;
  background: #fafafa;
}

.json-editor :deep(.cm-scroller) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  min-height: 400px; /* 约20行的高度 */
  max-height: 600px;
  overflow: auto;
}

.json-editor :deep(.cm-gutters) {
  background: #f0f0f0;
  border-right: 1px solid #ddd;
}

.json-editor :deep(.cm-activeLineGutter) {
  background: #e6f7ff;
}

.json-editor :deep(.cm-activeLine) {
  background: #f5f5f5;
}

.json-editor :deep(.cm-foldGutter) {
  cursor: pointer;
}

/* JSON 语法高亮颜色 */
.json-editor :deep(.cm-content) {
  color: #333;
}

.json-editor :deep(.cm-string) {
  color: #22863a; /* 字符串：绿色 */
}

.json-editor :deep(.cm-number) {
  color: #005cc5; /* 数字：蓝色 */
}

.json-editor :deep(.cm-bool) {
  color: #d73a49; /* 布尔值：红色 */
}

.json-editor :deep(.cm-null) {
  color: #6f42c1; /* null：紫色 */
}

.json-editor :deep(.cm-keyword) {
  color: #d73a49; /* 关键字：红色 */
  font-weight: bold;
}

.json-editor :deep(.cm-property) {
  color: #005cc5; /* 属性名：蓝色 */
}

.json-editor :deep(.cm-bracket) {
  color: #6a737d; /* 括号：灰色 */
}
</style>
