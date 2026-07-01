<script setup lang="ts">
import type { Patient } from '~/stores/ward'

const props = defineProps<{ patient: Patient; bedId: number; editing: boolean }>()
const { t } = useI18n()
const ward = useWardStore()

const draft = ref('')
const eventTime = ref(localNow())
function add() {
  if (!draft.value.trim()) return
  ward.addEvent(props.bedId, draft.value, eventTime.value)
  draft.value = ''
  eventTime.value = localNow()
}
</script>

<template>
  <div class="panels">
    <div class="panel">
      <h3>{{ t('events') }}</h3>
      <div class="ev-add">
        <textarea v-model="draft" class="in" :placeholder="t('addEvent')" />
        <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;flex-wrap:wrap">
          <input v-model="eventTime" class="in mono" type="datetime-local" style="width:auto" />
          <button class="btn btn-sm" type="button" @click="add">+ {{ t('add') }}</button>
        </div>
      </div>

      <div v-if="patient.events.length === 0" class="empty-tab">{{ t('noEvents') }}</div>
      <div class="timeline">
        <div v-for="(e, i) in patient.events" :key="e.id || i" class="ev">
          <div class="d">{{ e.date }}</div>
          <div class="t">{{ e.text }}</div>
          <button
            v-if="editing && i < patient.events.length - 1"
            class="ev-del"
            type="button"
            title="Remove event"
            @click="ward.removeEvent(bedId, e.id)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>{{ t('recs') }}</h3>
      <textarea v-if="editing" v-model="patient.recommendations" class="in" style="min-height:90px" />
      <div v-else class="v" :class="{ empty: !patient.recommendations }" style="font-size:14.5px;white-space:pre-wrap">
        {{ patient.recommendations || t('empty') }}
      </div>
    </div>
  </div>
</template>
