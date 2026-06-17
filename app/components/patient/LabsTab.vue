<script setup lang="ts">
import type { Patient } from '~/stores/ward'

const props = defineProps<{ patient: Patient; editing: boolean }>()
const { t } = useI18n()

type Row = [label: string, key: string, unit?: string]
interface Group { title: string; obj: Record<string, string>; rows: Row[] }

// `obj` points at the real reactive object, so v-model edits update the store.
const groups = computed<Group[]>(() => {
  const p = props.patient
  return [
    { title: t('abg'), obj: p.abg, rows: [['pH', 'ph'], ['CO₂', 'co2', 'mmHg'], ['HCO₃', 'hco3', 'mmol/L'], ['Lactate', 'lactate', 'mmol/L']] },
    { title: t('cbc'), obj: p.cbc, rows: [['TLC', 'tlc', '×10⁹/L'], ['Hb', 'hb', 'g/dL'], ['PLT', 'plt', '×10⁹/L']] },
    { title: t('renal'), obj: p.renal, rows: [['Urea', 'urea', 'mmol/L'], ['Creatinine', 'creatinine', 'mg/dL']] },
    { title: t('lytes'), obj: p.lytes, rows: [['Na⁺', 'na', 'mmol/L'], ['K⁺', 'k', 'mmol/L'], ['Ca²⁺ (ion)', 'ca', 'mmol/L']] },
    { title: t('liverg'), obj: p.liver, rows: [['AST', 'ast', 'U/L'], ['ALT', 'alt', 'U/L'], ['Albumin', 'albumin', 'g/dL']] },
    { title: t('bilig'), obj: p.bili, rows: [['Total', 'total', 'mg/dL'], ['Direct', 'direct', 'mg/dL'], ['Indirect', 'indirect', 'mg/dL']] },
    { title: t('coag'), obj: p as unknown as Record<string, string>, rows: [['INR', 'inr'], ['CRP', 'crp', 'mg/L']] },
    { title: t('cardiac'), obj: p.cardiac, rows: [['Troponin', 'troponin', 'ng/mL'], ['CK-MB', 'ckmb', 'ng/mL']] },
    { title: t('thyroidg'), obj: p.thyroid, rows: [['TSH', 'tsh', 'mIU/L'], ['FT3', 'ft3', 'pmol/L'], ['FT4', 'ft4', 'pmol/L']] },
    { title: t('metab'), obj: p as unknown as Record<string, string>, rows: [['HbA1c', 'hba1c', '%']] },
  ]
})
</script>

<template>
  <div class="panels">
    <div class="panel">
      <h3>{{ t('tabLabs') }}</h3>
      <div class="field" style="margin-bottom:8px">
        <div class="k">{{ t('labsDate') }}</div>
        <input v-if="editing" v-model="patient.labsDate" class="in mono" type="datetime-local" />
        <div v-else class="v" :class="{ empty: !patient.labsDate }">
          {{ patient.labsDate ? fmtDbTimestamp(new Date(patient.labsDate).toISOString()) : t('empty') }}
        </div>
      </div>

      <div class="panel-2">
        <div v-for="g in groups" :key="g.title" class="lab-group">
          <h4>{{ g.title }}</h4>
          <div v-for="r in g.rows" :key="r[1]" class="lab-row">
            <span class="k">{{ r[0] }}</span>
            <input v-if="editing" v-model="g.obj[r[1]]" class="in mono sm" />
            <span v-else class="v" :class="{ empty: !g.obj[r[1]] }">
              {{ g.obj[r[1]] || t('empty') }}<small v-if="r[2] && g.obj[r[1]]"> {{ r[2] }}</small>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Urine output -->
    <div class="panel">
      <h3>{{ t('urine') }}</h3>
      <div class="field" style="display:flex;align-items:center;justify-content:space-between">
        <div class="k" style="margin:0">{{ t('balance') }}</div>
        <div v-if="editing" class="in-row" style="width:auto">
          <select v-model="patient.balance.sign" class="in sm" style="max-width:62px"><option value="+">+</option><option value="-">−</option></select>
          <input v-model="patient.balance.value" class="in mono sm" /><span style="color:var(--ink-3);font-size:13px">mL</span>
        </div>
        <div v-else class="v mono" style="font-size:16px">
          <span v-if="patient.balance.value" :style="{ color: patient.balance.sign === '-' ? 'var(--crit)' : 'var(--ok)' }">
            {{ patient.balance.sign === '-' ? '−' : '+' }}{{ patient.balance.value }} mL
          </span>
          <span v-else class="empty">{{ t('empty') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
