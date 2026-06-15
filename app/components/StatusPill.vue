<script setup lang="ts">
const props = defineProps<{ status: string }>()
const { t } = useI18n()
</script>

<template>
  <span class="pill" :class="acuityPill(props.status)">
    <span class="dot" />
    {{ t(props.status) }}
  </span>
</template>
