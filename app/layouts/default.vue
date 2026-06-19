<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div>
    <AppBar />
    <slot />
    <footer class="app-footer">
      <a href="https://shaf3y.is-a.dev" target="_blank" rel="noopener noreferrer">{{ t('devCredit') }}</a>
    </footer>
  </div>
</template>
