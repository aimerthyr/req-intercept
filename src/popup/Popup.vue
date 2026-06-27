<script setup lang="ts">
import { storageDemo } from '~/logic/storage'

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}
</script>

<template>
  <main class="w-[300px] px-4 py-5 text-center text-gray-700">
    <Logo />
    <div>Popup</div>
    <SharedSubtitle />

    <a-button type="primary" class="btn mt-2" @click="openOptionsPage">
      Open Options
    </a-button>
    <div class="mt-2">
      <span class="opacity-50">Storage:</span> {{ storageDemo }}
    </div>
  </main>
</template>
