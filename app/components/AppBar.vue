<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

function toggleLang() {
  setLocale(locale.value === 'en' ? 'ar' : 'en')
}

async function signOut() {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <header class="appbar">
    <NuxtLink to="/" class="brand">
      <div class="mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12h4l2 6 4-14 2 8h6" />
        </svg>
      </div>
      <div class="brand-txt">
        <b>Mareedy</b><small>{{ t('sub') }}</small>
      </div>
    </NuxtLink>

    <div class="spacer" />

    <button class="lang" type="button" @click="toggleLang">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
      </svg>
      {{ locale === 'en' ? 'العربية' : 'English' }}
    </button>

    <button v-if="user" class="iconbtn" type="button" :title="t('signOut')" @click="signOut">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  </header>
</template>
