<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { EditorView, drawSelection, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers, runScopeHandlers } from '@codemirror/view'
import type { Panel, ViewUpdate } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { HighlightStyle, bracketMatching, foldGutter, foldKeymap, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import {
  SearchQuery,
  closeSearchPanel,
  findNext,
  findPrevious,
  getSearchQuery,
  highlightSelectionMatches,
  replaceAll,
  replaceNext,
  search,
  searchKeymap,
  selectMatches,
  setSearchQuery,
} from '@codemirror/search'
import { jsonc, jsoncLanguage } from '@shopify/lang-jsonc'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLDivElement>()
let view: EditorView | null = null

// 对齐 Chrome DevTools / 浏览器 JSON 预览的经典配色
const jsonHighlightStyle = HighlightStyle.define([
  { tag: t.propertyName, color: '#881391' },
  { tag: t.string, color: '#c41a16' },
  { tag: t.number, color: '#1c00cf' },
  { tag: t.bool, color: '#0d22aa' },
  { tag: t.null, color: '#808080' },
  { tag: t.keyword, color: '#0d22aa' },
  // 浏览器原生 JSON 无注释；沿用 Sources 面板注释色
  { tag: [t.lineComment, t.blockComment, t.comment], color: '#007400', fontStyle: 'italic' },
  { tag: [t.squareBracket, t.brace, t.separator], color: '#1f1f1f' },
])

function createSearchPanel(view: EditorView): Panel {
  const query = getSearchQuery(view.state)
  let current = query

  const searchField = document.createElement('input')
  searchField.type = 'text'
  searchField.placeholder = '查找'
  searchField.setAttribute('main-field', 'true')
  searchField.value = query.search

  const replaceField = document.createElement('input')
  replaceField.type = 'text'
  replaceField.placeholder = '替换'
  replaceField.value = query.replace

  function checkbox(label: string, checked: boolean) {
    const wrap = document.createElement('label')
    wrap.className = 'cm-search-check'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.checked = checked
    wrap.append(input, document.createTextNode(label))
    return { wrap, input }
  }

  const caseOpt = checkbox('区分大小写', query.caseSensitive)
  const reOpt = checkbox('正则', query.regexp)
  const wordOpt = checkbox('全词', query.wholeWord)

  function button(text: string, onClick: () => void) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = text
    btn.addEventListener('click', onClick)
    return btn
  }

  function commit() {
    const next = new SearchQuery({
      search: searchField.value,
      replace: replaceField.value,
      caseSensitive: caseOpt.input.checked,
      regexp: reOpt.input.checked,
      wholeWord: wordOpt.input.checked,
    })
    if (!next.eq(current)) {
      current = next
      view.dispatch({ effects: setSearchQuery.of(next) })
    }
  }

  for (const el of [searchField, replaceField]) {
    el.addEventListener('change', commit)
    el.addEventListener('keyup', commit)
  }
  for (const { input } of [caseOpt, reOpt, wordOpt])
    input.addEventListener('change', commit)

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'cm-search-close'
  closeBtn.setAttribute('aria-label', '关闭')
  closeBtn.textContent = '×'
  closeBtn.addEventListener('click', () => closeSearchPanel(view))

  const findRow = document.createElement('div')
  findRow.className = 'cm-search-row'
  findRow.append(
    searchField,
    button('下一个', () => findNext(view)),
    button('上一个', () => findPrevious(view)),
    button('全选', () => selectMatches(view)),
    caseOpt.wrap,
    reOpt.wrap,
    wordOpt.wrap,
    closeBtn,
  )

  const replaceRow = document.createElement('div')
  replaceRow.className = 'cm-search-row'
  if (!view.state.readOnly) {
    replaceRow.append(
      replaceField,
      button('替换', () => replaceNext(view)),
      button('全部替换', () => replaceAll(view)),
    )
  }

  const dom = document.createElement('div')
  dom.className = 'cm-search'
  dom.append(findRow)
  if (replaceRow.childNodes.length)
    dom.append(replaceRow)

  dom.addEventListener('keydown', (e) => {
    if (runScopeHandlers(view, e, 'search-panel')) {
      e.preventDefault()
    }
    else if (e.key === 'Enter' && e.target === searchField) {
      e.preventDefault()
      ;(e.shiftKey ? findPrevious : findNext)(view)
    }
    else if (e.key === 'Enter' && e.target === replaceField) {
      e.preventDefault()
      replaceNext(view)
    }
  })

  return {
    dom,
    top: true,
    mount() {
      searchField.select()
    },
    update(update: ViewUpdate) {
      for (const tr of update.transactions) {
        for (const effect of tr.effects) {
          if (effect.is(setSearchQuery) && !effect.value.eq(current)) {
            current = effect.value
            searchField.value = current.search
            replaceField.value = current.replace
            caseOpt.input.checked = current.caseSensitive
            reOpt.input.checked = current.regexp
            wordOpt.input.checked = current.wholeWord
          }
        }
      }
    },
  }
}

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
      syntaxHighlighting(jsonHighlightStyle),
      search({ top: true, createPanel: createSearchPanel }),
      highlightSelectionMatches(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, ...searchKeymap]),
      jsonc(),
      jsoncLanguage.data.of({
        commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
      }),
      EditorView.lineWrapping,
      EditorView.theme({
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
          backgroundColor: '#add6ff !important',
        },
        '&.cm-focused .cm-selectionBackground': {
          backgroundColor: '#add6ff !important',
        },
        '.cm-searchMatch': {
          backgroundColor: '#ffe566',
        },
        '.cm-searchMatch.cm-searchMatch-selected': {
          backgroundColor: '#ff9f1a',
        },
        '.cm-panel.cm-search': {
          padding: '8px 10px',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #e8e8e8',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        '.cm-panel.cm-search .cm-search-row': {
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          minHeight: '28px',
        },
        '.cm-panel.cm-search .cm-search-row + .cm-search-row': {
          marginTop: '6px',
        },
        '.cm-panel.cm-search input[type=text]': {
          flex: '1 1 160px',
          minWidth: '120px',
          height: '28px',
          margin: '0',
          padding: '0 8px',
          boxSizing: 'border-box',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          outline: 'none',
          backgroundColor: '#fff',
          fontSize: '13px',
          lineHeight: '26px',
          color: '#333',
        },
        '.cm-panel.cm-search input[type=text]:focus': {
          borderColor: '#1677ff',
          boxShadow: '0 0 0 2px rgba(22, 119, 255, 0.1)',
        },
        '.cm-panel.cm-search button': {
          flex: '0 0 auto',
          height: '28px',
          margin: '0',
          padding: '0 10px',
          boxSizing: 'border-box',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          background: '#fff',
          backgroundImage: 'none',
          color: '#333',
          fontSize: '12px',
          lineHeight: '26px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        },
        '.cm-panel.cm-search button:hover': {
          color: '#1677ff',
          borderColor: '#1677ff',
        },
        '.cm-panel.cm-search .cm-search-close': {
          width: '28px',
          padding: '0',
          border: 'none',
          background: 'transparent',
          color: '#999',
          fontSize: '18px',
          lineHeight: '28px',
        },
        '.cm-panel.cm-search .cm-search-close:hover': {
          color: '#333',
          border: 'none',
        },
        '.cm-panel.cm-search .cm-search-check': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          margin: '0',
          height: '28px',
          fontSize: '12px',
          color: '#666',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          userSelect: 'none',
        },
        '.cm-panel.cm-search .cm-search-check input': {
          width: '14px',
          height: '14px',
          margin: '0',
          padding: '0',
          accentColor: '#1677ff',
        },
      }),
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

.json-editor :deep(.cm-foldGutter) {
  cursor: pointer;
}

.json-editor :deep(.cm-content) {
  color: #333;
}
</style>
