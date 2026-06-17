<script setup lang="ts">
import type { Patient } from '~/stores/ward'

defineProps<{ patient: Patient; editing: boolean }>()
const { t } = useI18n()

// [stateKey, i18nKey]
const rows: [keyof Patient['exam'], string][] = [
  ['appearance', 'appearance'], ['cvs', 'cvs'], ['chest', 'chest'],
  ['abdomen', 'abdomen'], ['limbs', 'limbs'], ['neuro', 'neuro'],
]
</script>

<template>
  <div class="panels">
    <div class="panel">
      <h3>{{ t('exam') }}</h3>
      <div class="field">
        <div class="k">{{ t('examDate') }}</div>
        <input v-if="editing" v-model="patient.exam.examDate" class="in mono" type="datetime-local" />
        <div v-else class="v" :class="{ empty: !patient.exam.examDate }">
          {{ patient.exam.examDate ? fmtDbTimestamp(new Date(patient.exam.examDate).toISOString()) : t('empty') }}
        </div>
      </div>

      <div v-for="r in rows" :key="r[0]" class="field">
        <div class="k">{{ t(r[1]) }}</div>
        <textarea v-if="editing" v-model="patient.exam[r[0]]" class="in" />
        <div v-else class="v" :class="{ empty: !patient.exam[r[0]] }">{{ patient.exam[r[0]] || t('empty') }}</div>
      </div>
    </div>
  </div>
</template>
