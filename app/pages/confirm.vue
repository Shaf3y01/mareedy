<script setup lang="ts">
definePageMeta({ layout: false })

// @nuxtjs/supabase processes the auth token from the URL hash/query in its
// plugin before this page renders. By the time we get here the session is
// already set, so just navigate home.
navigateTo('/')
</script>

<template><div /></template>
