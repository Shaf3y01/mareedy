<script setup lang="ts">
import type { Patient } from '~/stores/ward'

const props = defineProps<{ patient: Patient; bedId: number; editing: boolean }>()
const { t } = useI18n()
const ward = useWardStore()

const showForm = ref(false)
const draft = reactive({ name: '', dose: '', route: 'PO', freq: '', startedOn: localToday() })

function add() {
  if (!draft.name.trim()) return
  ward.addMed(props.bedId, { ...draft })
  Object.assign(draft, { name: '', dose: '', route: 'PO', freq: '', startedOn: localToday() })
  showForm.value = false
}
function badge(status: string) {
  return status === 'discontinued' ? 'p-mute' : status === 'escalated' ? 'p-watch' : 'p-stable'
}
</script>

<template>
  <div class="panels">
    <div class="panel">
      <h3 style="justify-content:space-between">
        <span>{{ t('meds') }}</span>
        <button class="btn-xs" type="button" style="text-transform:none;letter-spacing:0" @click="showForm = true">+ {{ t('addMed') }}</button>
      </h3>

      <!-- add form -->
      <div v-if="showForm" style="background:var(--surface-2);border:1px solid var(--line-2);border-radius:11px;padding:12px;margin-bottom:12px">
        <div class="form-grid">
          <div><span class="lab">{{ t('name') }}</span><input v-model="draft.name" class="in" placeholder="…" /></div>
          <div class="form-row">
            <div><span class="lab">{{ t('dose') }}</span><input v-model="draft.dose" class="in" /></div>
            <div>
              <span class="lab">{{ t('route') }}</span>
              <select v-model="draft.route" class="in"><option>PO</option><option>IV</option><option>IM</option><option>SC</option><option>NEB</option><option>PR</option></select>
            </div>
            <div><span class="lab">{{ t('freq') }}</span><input v-model="draft.freq" class="in" placeholder="OD / q8h" /></div>
          </div>
          <div>
            <span class="lab">{{ t('started') }}</span>
            <input v-model="draft.startedOn" class="in mono" type="date" />
          </div>
        </div>
        <div class="sheet-actions" style="margin-top:14px">
          <button class="btn-ghost btn btn-sm" type="button" @click="showForm = false">{{ t('cancel') }}</button>
          <button class="btn btn-sm" type="button" @click="add">{{ t('add') }}</button>
        </div>
      </div>

      <div v-if="patient.meds.length === 0 && !showForm" class="empty-tab">{{ t('noMeds') }}</div>

      <!-- list -->
      <div v-for="m in patient.meds" :key="m.id" class="med" :class="{ disc: m.status === 'discontinued' }">
        <div class="med-top">
          <div style="min-width:0">
            <div class="med-nm" :class="{ struck: m.status === 'discontinued' }">{{ m.name }}</div>
            <div v-if="!m.editing" class="med-sub">{{ m.dose }} · {{ m.route }} · {{ m.freq }}</div>
            <div v-else class="in-row" style="margin-top:6px;flex-wrap:wrap;gap:6px">
              <input v-model="m.dose" class="in sm" style="max-width:90px;text-align:start" :placeholder="t('dose')" />
              <input v-model="m.route" class="in sm" style="max-width:70px;text-align:start" />
              <input v-model="m.freq" class="in sm" style="max-width:90px;text-align:start" :placeholder="t('freq')" />
            </div>
            <div class="med-date">{{ t('started') }} {{ m.start }}</div>
          </div>
          <span class="pill" :class="badge(m.status)"><span class="dot" />{{ m.status }}</span>
        </div>

        <div class="med-actions">
          <button class="btn-xs" type="button" @click="ward.toggleMedEdit(bedId, m.id)">{{ m.editing ? t('save') : t('modify') }}</button>
          <button v-if="m.status !== 'discontinued'" class="btn-xs warn" type="button" @click="ward.medAction(bedId, m.id, 'escalate')">↑ {{ t('escalate') }}</button>
          <button v-if="m.status !== 'discontinued'" class="btn-xs" type="button" @click="ward.medAction(bedId, m.id, 'deesc')">↓ {{ t('deesc') }}</button>
          <button v-if="m.status !== 'discontinued'" class="btn-xs danger" type="button" @click="ward.medAction(bedId, m.id, 'discont')">{{ t('discont') }}</button>
        </div>

        <div v-if="m.log.length" class="med-log">
          <div v-for="(lg, i) in m.log" :key="i" class="l"><b>{{ lg.date }}</b><span>{{ lg.text }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>
