<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const { t, locale, setLocale } = useI18n()

const email = ref('')
const password = ref('')
const msg = ref('')
const busy = ref(false)

async function signIn() {
  busy.value = true
  msg.value = ''
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  busy.value = false
  if (error) { msg.value = error.message; return }
  navigateTo('/')
}

async function signUp() {
  busy.value = true
  msg.value = ''
  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  })
  busy.value = false
  msg.value = error ? error.message : t('accountCreated')
}
</script>

<template>
  <main class="screen" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh">
    <div style="width:100%;max-width:380px">
      <!-- Brand -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
        <div class="mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12h4l2 6 4-14 2 8h6" />
          </svg>
        </div>
        <div class="brand-txt"><b>Mareedy</b><small>{{ t('sub') }}</small></div>
      </div>

      <div class="panel">
        <h3 style="margin:0 0 16px">{{ t('signIn') }}</h3>
        <div class="form-grid">
          <div>
            <div class="k">{{ t('email') }}</div>
            <input
              v-model="email" class="in" type="email"
              autocomplete="email" :placeholder="t('emailPlaceholder')"
              @keyup.enter="signIn"
            />
          </div>
          <div>
            <div class="k">{{ t('password') }}</div>
            <input
              v-model="password" class="in" type="password"
              autocomplete="current-password"
              @keyup.enter="signIn"
            />
          </div>

          <p v-if="msg" style="color:var(--crit);font-size:13px;margin:0">{{ msg }}</p>

          <div class="sheet-actions">
            <button class="btn-ghost btn" type="button" :disabled="busy" @click="signUp">
              {{ t('createAccount') }}
            </button>
            <button class="btn" type="button" :disabled="busy" @click="signIn">
              {{ t('signIn') }}
            </button>
          </div>
        </div>
      </div>

      <!-- language toggle -->
      <div style="text-align:center;margin-top:16px">
        <button class="lang" type="button" @click="locale === 'en' ? setLocale('ar') : setLocale('en')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
          </svg>
          {{ locale === 'en' ? 'العربية' : 'English' }}
        </button>
      </div>
    </div>
  </main>
</template>
