<script setup lang="ts">
// Set <html lang> and <html dir> from the active locale.
// Because every locale in nuxt.config has a `dir`, switching to Arabic
// flips the whole UI to RTL automatically (our CSS uses logical properties).
const { locale, locales } = useI18n()
const dir = computed(
  () => (locales.value as Array<{ code: string; dir?: string }>).find((l) => l.code === locale.value)?.dir || 'ltr',
)
useHead({ htmlAttrs: { lang: locale, dir } })
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
