<script setup lang="ts">
import type { Patient } from '~/stores/ward'

defineProps<{ patient: Patient; editing: boolean }>()
const { t } = useI18n()

const o2modes = ['Room Air', 'Nasal', 'Mask', 'Venturi', 'Reservoir', 'Mechanical Ventilation']
</script>

<template>
  <div class="panels">
    <!-- Complaint & vitals -->
    <div class="panel">
      <h3>{{ t('complaint') }}</h3>

      <div class="field">
        <div class="k">{{ t('chartDate') }}</div>
        <input v-if="editing" v-model="patient.chartDate" class="in mono" type="datetime-local" />
        <div v-else class="v" :class="{ empty: !patient.chartDate }">
          {{ patient.chartDate ? fmtDbTimestamp(new Date(patient.chartDate).toISOString()) : t('empty') }}
        </div>
      </div>

      <div v-if="editing || patient.conscious" class="field">
        <div class="k">{{ t('conscious') }}</div>
        <input v-if="editing" v-model="patient.conscious" class="in" />
        <div v-else class="v">{{ patient.conscious }}</div>
      </div>

      <div class="vitals" style="margin-top:12px">
        <div class="vtile" :class="vitalClass('bp', patient.bp)">
          <div class="k">{{ t('bp') }} <span class="u">mmHg</span></div>
          <input v-if="editing" v-model="patient.bp" class="in mono" style="margin-top:4px" />
          <div v-else class="v">{{ patient.bp || '—' }}</div>
        </div>
        <div class="vtile" :class="vitalClass('hr', patient.hr)">
          <div class="k">{{ t('hr') }} <span class="u">bpm</span></div>
          <input v-if="editing" v-model="patient.hr" class="in mono" style="margin-top:4px" />
          <div v-else class="v">{{ patient.hr || '—' }}</div>
        </div>
        <div class="vtile" :class="vitalClass('spo2', patient.spo2)">
          <div class="k">{{ t('spo2') }} <span class="u">%</span></div>
          <input v-if="editing" v-model="patient.spo2" class="in mono" style="margin-top:4px" />
          <div v-else class="v">{{ patient.spo2 ? patient.spo2 + '%' : '—' }}</div>
        </div>
        <div class="vtile" :class="vitalClass('temp', patient.temp)">
          <div class="k">{{ t('temp') }} <span class="u">°C</span></div>
          <input v-if="editing" v-model="patient.temp" class="in mono" style="margin-top:4px" />
          <div v-else class="v">{{ patient.temp || '—' }}</div>
        </div>
        <div class="vtile" :class="vitalClass('rr', patient.rr)">
          <div class="k">{{ t('rr') }} <span class="u">/min</span></div>
          <input v-if="editing" v-model="patient.rr" class="in mono" style="margin-top:4px" />
          <div v-else class="v">{{ patient.rr || '—' }}</div>
        </div>
        <div class="vtile">
          <div class="k">{{ t('o2') }}</div>
          <select v-if="editing" v-model="patient.o2mode" class="in" style="margin-top:4px;font-size:13px">
            <option v-for="m in o2modes" :key="m">{{ m }}</option>
          </select>
          <div v-else class="v" style="font-size:15px">{{ patient.o2mode }}</div>
        </div>
      </div>
    </div>

    <!-- Patient details -->
    <div class="panel">
      <h3>{{ t('attributes') }}</h3>

      <div class="field">
        <div class="k">{{ t('admittedAt') }}</div>
        <input v-if="editing" v-model="patient.admittedAt" class="in mono" type="datetime-local" />
        <div v-else class="v" :class="{ empty: !patient.admittedAt }">
          {{ patient.admittedAt ? fmtDbTimestamp(new Date(patient.admittedAt).toISOString()) : t('empty') }}
        </div>
      </div>

      <div class="field">
        <div class="k">{{ t('patientNo') }}</div>
        <input v-if="editing" v-model="patient.patientNo" class="in mono" :placeholder="t('patientNoPlaceholder')" />
        <div v-else class="v" :class="{ empty: !patient.patientNo }">{{ patient.patientNo || t('empty') }}</div>
      </div>

      <div v-if="editing" class="field">
        <div class="k">{{ t('name') }}</div>
        <input v-model="patient.name" class="in" />
      </div>
      <div v-if="editing" class="panel-2">
        <div class="field"><div class="k">{{ t('age') }}</div><input v-model="patient.age" class="in" /></div>
        <div class="field">
          <div class="k">{{ t('sex') }}</div>
          <select v-model="patient.sex" class="in"><option value="F">{{ t('female') }}</option><option value="M">{{ t('male') }}</option></select>
        </div>
      </div>

      <div class="field">
        <div class="k">{{ t('chiefC') }}</div>
        <input v-if="editing" v-model="patient.chiefComplaint" class="in" />
        <div v-else class="v" :class="{ empty: !patient.chiefComplaint }">{{ patient.chiefComplaint || t('empty') }}</div>
      </div>

      <div class="field">
        <div class="k">{{ t('pmhx') }}</div>
        <input v-if="editing" v-model="patient.pmhx" class="in" />
        <div v-else class="v" :class="{ empty: !patient.pmhx }">{{ patient.pmhx || t('empty') }}</div>
      </div>
      <div class="field">
        <div class="k">{{ t('allergies') }}</div>
        <input v-if="editing" v-model="patient.allergies" class="in" />
        <div v-else class="v" :class="{ empty: !patient.allergies }">{{ patient.allergies || t('empty') }}</div>
      </div>
      <div class="field">
        <div class="k">{{ t('habits') }}</div>
        <input v-if="editing" v-model="patient.habits" class="in" />
        <div v-else class="v" :class="{ empty: !patient.habits }">{{ patient.habits || t('empty') }}</div>
      </div>
    </div>
  </div>
</template>
