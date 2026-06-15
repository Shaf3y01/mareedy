<script setup lang="ts">
import type { Patient } from '~/stores/ward'

defineProps<{ patient: Patient; editing: boolean }>()
const { t } = useI18n()

const imagingRows: [keyof Patient['imaging'], string][] = [
  ['ctChest', 'ctChest'], ['ctBrain', 'ctBrain'], ['xray', 'xray'], ['paus', 'paus'],
]
</script>

<template>
  <div class="panels">
    <div class="panel">
      <h3>{{ t('tabImaging') }}</h3>

      <div v-for="r in imagingRows" :key="r[0]" class="field">
        <div class="k">{{ t(r[1]) }}</div>
        <textarea v-if="editing" v-model="patient.imaging[r[0]]" class="in" />
        <div v-else class="v" :class="{ empty: !patient.imaging[r[0]] }">{{ patient.imaging[r[0]] || t('empty') }}</div>
      </div>

      <div class="field">
        <div class="k">{{ t('ultrasound') }}</div>
        <textarea v-if="editing" v-model="patient.ultrasound" class="in" />
        <div v-else class="v" :class="{ empty: !patient.ultrasound }">{{ patient.ultrasound || t('empty') }}</div>
      </div>
      <div class="field">
        <div class="k">{{ t('endoscopy') }}</div>
        <textarea v-if="editing" v-model="patient.endoscopy" class="in" />
        <div v-else class="v" :class="{ empty: !patient.endoscopy }">{{ patient.endoscopy || t('empty') }}</div>
      </div>
    </div>
  </div>
</template>
