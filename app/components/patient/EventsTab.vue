<script setup lang="ts">
import type { Patient } from '~/stores/ward'

const props = defineProps<{ patient: Patient; bedId: number; editing: boolean }>()
const { t } = useI18n()
const ward = useWardStore()

const draft = ref('')
function add() {
  if (!draft.value.trim()) return
  ward.addEvent(props.bedId, draft.value) // store stamps the date/time
  draft.value = ''
}
</script>

<template>
  <div class="panels">
    <div class="panel">
      <h3>{{ t('events') }}</h3>
      <div class="ev-add">
        <textarea v-model="draft" class="in" :placeholder="t('addEvent')" />
        <div style="display:flex;justify-content:flex-end">
          <button class="btn btn-sm" type="button" @click="add">+ {{ t('add') }}</button>
        </div>
      </div>

      <div v-if="patient.events.length === 0" class="empty-tab">{{ t('noEvents') }}</div>
      <div class="timeline">
        <div v-for="(e, i) in patient.events" :key="i" class="ev">
          <div class="d">{{ e.date }}</div>
          <div class="t">{{ e.text }}</div>
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
