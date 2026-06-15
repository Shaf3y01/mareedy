<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const ward = useWardStore()

const bedId = computed(() => Number(route.params.id))
const bed = computed(() => ward.bedById(bedId.value))
const patient = computed(() => bed.value?.patient ?? null)

const tab = ref('chart')
const editing = ref(route.query.new === '1') // freshly admitted → start editable

function onDischarge() {
  ward.discharge(bedId.value)
  navigateTo('/')
}
</script>

<template>
  <main class="screen">
    <NuxtLink to="/" class="back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip"><path d="M15 18l-6-6 6-6" /></svg>
      {{ t('back') }}
    </NuxtLink>

    <template v-if="patient">
      <PatientHeader
        :patient="patient"
        :bed-id="bedId"
        v-model:tab="tab"
        v-model:editing="editing"
        @discharge="onDischarge"
      />

      <transition name="fade" mode="out-in">
        <div :key="tab">
          <ChartTab v-if="tab === 'chart'" :patient="patient" :editing="editing" />
          <ExamTab v-else-if="tab === 'exam'" :patient="patient" :editing="editing" />
          <LabsTab v-else-if="tab === 'labs'" :patient="patient" :editing="editing" />
          <ImagingTab v-else-if="tab === 'imaging'" :patient="patient" :editing="editing" />
          <MedsTab v-else-if="tab === 'meds'" :patient="patient" :bed-id="bedId" :editing="editing" />
          <EventsTab v-else-if="tab === 'events'" :patient="patient" :bed-id="bedId" :editing="editing" />
        </div>
      </transition>
    </template>

    <!-- Bed has no patient -->
    <div v-else class="panel" style="text-align:center">
      <p style="color:var(--ink-3);margin:6px 0 14px">{{ t('bedAvailable') }}</p>
      <NuxtLink to="/" class="btn btn-sm" style="display:inline-flex">{{ t('back') }}</NuxtLink>
    </div>
  </main>
</template>
