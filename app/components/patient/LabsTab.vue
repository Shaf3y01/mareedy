<script setup lang="ts">
import type { Patient, LabsSet } from '~/stores/ward'
import { blankLabsSet } from '~/stores/ward'

const props = defineProps<{ patient: Patient; bedId: number; editing: boolean }>()
const { t } = useI18n()
const ward = useWardStore()

type SetKey = 'admission' | 'yesterday' | 'today'
const activeSet = ref<SetKey>('today')
const set = computed(() => props.patient.labsSets[activeSet.value])

const armed = ref(false)
function rollover() {
  Object.assign(props.patient.labsSets.yesterday, props.patient.labsSets.today)
  Object.assign(props.patient.labsSets.today, blankLabsSet())
  armed.value = false
  ward.savePatient(props.bedId)
}

type Row = [label: string, key: string, unit?: string]
interface Group { title: string; obj: Record<string, string>; rows: Row[] }

const groups = computed<Group[]>(() => {
  const s = set.value
  return [
    { title: t('abg'), obj: s.abg, rows: [['pH', 'ph'], ['CO₂', 'co2', 'mmHg'], ['HCO₃', 'hco3', 'mmol/L'], ['Lactate', 'lactate', 'mmol/L']] },
    { title: t('cbc'), obj: s.cbc, rows: [['TLC', 'tlc', '×10⁹/L'], ['Hb', 'hb', 'g/dL'], ['PLT', 'plt', '×10⁹/L']] },
    { title: t('renal'), obj: s.renal, rows: [['Urea', 'urea', 'mmol/L'], ['Creatinine', 'creatinine', 'mg/dL']] },
    { title: t('lytes'), obj: s.lytes, rows: [['Na⁺', 'na', 'mmol/L'], ['K⁺', 'k', 'mmol/L'], ['Ca²⁺ (ion)', 'ca', 'mmol/L']] },
    { title: t('liverg'), obj: s.liver, rows: [['AST', 'ast', 'U/L'], ['ALT', 'alt', 'U/L'], ['Albumin', 'albumin', 'g/dL']] },
    { title: t('bilig'), obj: s.bili, rows: [['Total', 'total', 'mg/dL'], ['Direct', 'direct', 'mg/dL'], ['Indirect', 'indirect', 'mg/dL']] },
    { title: t('coag'), obj: s as unknown as Record<string, string>, rows: [['INR', 'inr'], ['CRP', 'crp', 'mg/L']] },
    { title: t('cardiac'), obj: s.cardiac, rows: [['Troponin', 'troponin', 'ng/mL'], ['CK-MB', 'ckmb', 'ng/mL']] },
    { title: t('thyroidg'), obj: s.thyroid, rows: [['TSH', 'tsh', 'mIU/L'], ['FT3', 'ft3', 'pmol/L'], ['FT4', 'ft4', 'pmol/L']] },
    { title: t('metab'), obj: s as unknown as Record<string, string>, rows: [['HbA1c', 'hba1c', '%']] },
  ]
})
</script>

<template>
  <div class="panels">
    <div class="panel">
      <h3>{{ t('tabLabs') }}</h3>

      <!-- Sub-tabs + New Day button -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <div class="tabs" style="margin-bottom:0">
          <button
            v-for="key in (['admission', 'yesterday', 'today'] as const)" :key="key"
            type="button" class="tab" :class="{ active: activeSet === key }"
            @click="activeSet = key"
          >{{ t(`labs_${key}`) }}</button>
        </div>
        <button class="btn-xs warn" type="button" @click="armed = true">{{ t('newDay') }}</button>
      </div>

      <!-- New Day confirmation -->
      <div v-if="armed" style="background:var(--warn-soft,#fff8e1);border:1px solid #ffe082;border-radius:12px;padding:12px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <span style="font-size:13.5px">{{ t('newDayConfirm') }}</span>
        <span style="display:flex;gap:8px">
          <button class="btn-ghost btn btn-sm" type="button" @click="armed = false">{{ t('cancel') }}</button>
          <button class="btn btn-sm" type="button" @click="rollover">{{ t('yes') }}</button>
        </span>
      </div>

      <!-- Date/time for this set -->
      <div class="field" style="margin-bottom:8px">
        <div class="k">{{ t('labsDate') }}</div>
        <input v-if="editing" v-model="patient.labsSets[activeSet].labsDate" class="in mono" type="datetime-local" />
        <div v-else class="v" :class="{ empty: !set.labsDate }">
          {{ set.labsDate ? fmtDbTimestamp(new Date(set.labsDate).toISOString()) : t('empty') }}
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
