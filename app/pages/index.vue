<script setup lang="ts">
const { t } = useI18n()
const ward = useWardStore()
const { beds, occupiedCount } = storeToRefs(ward)

await callOnce('loadWard', () => ward.loadWard())

const admitOpen = ref(false)
const admitBedId = ref<number | null>(null)

function openAdmit(bedId: number) {
  admitBedId.value = bedId
  admitOpen.value = true
}

function onAdmit(
  bedId: number,
  data: { name: string; age: string; sex: string; status: Acuity; complaint: string },
) {
  ward.admit(bedId, data)
  navigateTo(`/bed/${bedId}?new=1`) // open the new chart in edit mode
}

const canRemove = computed(() => beds.value.length > 9)
</script>

<template>
  <main class="screen">
    <div class="page-head">
      <div>
        <h1>{{ t('overview') }}</h1>
        <p>{{ t('ward') }} A</p>
      </div>
      <div class="ward-stats">
        <span class="stat-chip"><b>{{ beds.length }}</b> {{ t('beds') }}</span>
        <span class="stat-chip">
          <span style="width:7px;height:7px;border-radius:50%;background:var(--accent)" />
          <b>{{ occupiedCount }}</b> {{ t('occupied') }}
        </span>
        <span class="stat-chip"><b>{{ beds.length - occupiedCount }}</b> {{ t('free') }}</span>
      </div>
    </div>

    <div class="bed-grid">
      <BedCard
        v-for="bed in beds"
        :key="bed.id"
        :bed="bed"
        :can-remove="canRemove"
        @admit="openAdmit"
        @remove="ward.removeBed"
      />
    </div>

    <div class="add-bed">
      <button class="btn-ghost btn" type="button" @click="ward.addBed">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" /></svg>
        {{ t('addBed') }}
      </button>
    </div>

    <AdmitSheet v-model:open="admitOpen" :bed-id="admitBedId" @confirm="onAdmit" />
  </main>
</template>
