<script setup lang="ts">
import type { Bed } from '~/stores/ward'

const props = defineProps<{ bed: Bed; canRemove: boolean }>()
const emit = defineEmits<{ admit: [bedId: number]; remove: [bedId: number] }>()

const { t } = useI18n()

function open() {
  if (props.bed.patient) navigateTo(`/bed/${props.bed.id}`)
}
const padded = computed(() => String(props.bed.id).padStart(2, '0'))
</script>

<template>
  <div
    class="bed"
    :class="[bed.patient ? acuityStripe(bed.patient.status) : '', bed.patient ? 'occupied' : '']"
    @click="open"
  >
    <div class="bed-top">
      <div class="bed-no">
        <span class="lbl">{{ t('bed') }}</span><span class="n">{{ padded }}</span>
      </div>
      <StatusPill v-if="bed.patient" :status="bed.patient.status" />
      <span v-else class="pill p-mute">{{ t('available') }}</span>
    </div>

    <!-- Occupied -->
    <div v-if="bed.patient" class="bed-body">
      <div class="pname">
        {{ bed.patient.name }}
        <span v-if="bed.patient.patientNo" style="font-size:11px;font-weight:500;opacity:0.6"># {{ bed.patient.patientNo }}</span>
      </div>
      <div class="pmeta">
        {{ bed.patient.age }} {{ t('yrs') }} ·
        {{ bed.patient.sex === 'F' ? t('female') : t('male') }}
      </div>
      <div class="vrow">
        <div class="vmini"><div class="k">{{ t('bp') }}</div><div class="v">{{ bed.patient.bp || '—' }}</div></div>
        <div class="vmini"><div class="k">{{ t('hr') }}</div><div class="v">{{ bed.patient.hr || '—' }}</div></div>
        <div class="vmini"><div class="k">{{ t('spo2') }}</div><div class="v">{{ bed.patient.spo2 ? bed.patient.spo2 + '%' : '—' }}</div></div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="empty-body" @click.stop>
      <div class="dash">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" /></svg>
      </div>
      <div class="ph">{{ t('available') }}</div>
      <button class="btn btn-sm" type="button" @click="emit('admit', bed.id)">{{ t('admit') }}</button>
      <button v-if="canRemove" class="btn-xs danger" type="button" @click="emit('remove', bed.id)">✕ {{ t('bed') }}</button>
    </div>
  </div>
</template>
