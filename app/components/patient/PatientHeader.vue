<script setup lang="ts">
import type { Patient } from '~/stores/ward'

const props = defineProps<{ patient: Patient; bedId: number }>()
const tab = defineModel<string>('tab', { default: 'chart' })
const editing = defineModel<boolean>('editing', { default: false })
const emit = defineEmits<{ discharge: [] }>()

const { t } = useI18n()
const ward = useWardStore()
const armed = ref(false)

watch(editing, (now, was) => {
  if (was && !now) ward.savePatient(props.bedId)
})

const tabs = [
  { key: 'chart', label: 'tabChart' },
  { key: 'exam', label: 'tabExam' },
  { key: 'labs', label: 'tabLabs' },
  { key: 'imaging', label: 'tabImaging' },
  { key: 'meds', label: 'tabMeds' },
  { key: 'events', label: 'tabEvents' },
]
const padded = computed(() => String(props.bedId).padStart(2, '0'))
</script>

<template>
  <div class="phead">
    <div class="phead-top">
      <div class="phead-id">
        <div class="nm">
          {{ patient.name }}
          <StatusPill :status="patient.status" />
        </div>
        <div class="mt">
          <span class="bed-tag">{{ t('bed') }} {{ padded }}</span>
          &nbsp; {{ patient.age }} {{ t('yrs') }} ·
          {{ patient.sex === 'F' ? t('female') : t('male') }}
          <template v-if="patient.admittedAt">
            &nbsp;· {{ t('admittedAt') }}: {{ fmtDbTimestamp(new Date(patient.admittedAt).toISOString()) }}
          </template>
        </div>
      </div>
      <div class="phead-actions">
        <button
          class="iconbtn" type="button" :title="t('edit')"
          :style="editing ? 'border-color:var(--accent);color:var(--accent);background:var(--accent-soft)' : ''"
          @click="editing = !editing"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
        </button>
        <button class="btn-danger btn btn-sm" type="button" @click="armed = true">{{ t('discharge') }}</button>
      </div>
    </div>

    <!-- inline discharge confirmation -->
    <div v-if="armed" style="background:var(--crit-soft);border:1px solid #f3cdcb;border-radius:12px;padding:12px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <span style="font-size:13.5px;color:#b3322c">{{ t('confirmDisc') }}</span>
      <span style="display:flex;gap:8px">
        <button class="btn-ghost btn btn-sm" type="button" @click="armed = false">{{ t('cancel') }}</button>
        <button class="btn btn-sm" type="button" style="background:var(--crit);box-shadow:none" @click="emit('discharge')">{{ t('yes') }}</button>
      </span>
    </div>

    <div class="tabs">
      <button
        v-for="tb in tabs" :key="tb.key" type="button"
        class="tab" :class="{ active: tab === tb.key }" @click="tab = tb.key"
      >{{ t(tb.label) }}</button>
    </div>
  </div>
</template>
