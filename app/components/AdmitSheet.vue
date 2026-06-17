<script setup lang="ts">
const props = defineProps<{ bedId: number | null }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [bedId: number, data: { name: string; age: string; sex: string; status: Acuity; complaint: string; admittedAt: string }] }>()

const { t } = useI18n()

const draft = reactive({ name: '', age: '', sex: 'F', status: 'stable' as Acuity, complaint: '', admittedAt: localNow() })

watch(open, (v) => {
  if (v) Object.assign(draft, { name: '', age: '', sex: 'F', status: 'stable', complaint: '', admittedAt: localNow() })
})

const padded = computed(() => (props.bedId == null ? '' : String(props.bedId).padStart(2, '0')))

function confirm() {
  if (!draft.name.trim() || props.bedId == null) return
  emit('confirm', props.bedId, { ...draft })
  open.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="scrim" @click.self="open = false">
      <div class="sheet">
        <h2>{{ t('admit') }}</h2>
        <div class="sub">{{ t('bed') }} {{ padded }}</div>

        <div class="form-grid">
          <div>
            <span class="lab">{{ t('name') }}</span>
            <input v-model="draft.name" class="in" placeholder="…" />
          </div>
          <div class="form-row">
            <div>
              <span class="lab">{{ t('age') }}</span>
              <input v-model="draft.age" class="in mono" inputmode="numeric" />
            </div>
            <div>
              <span class="lab">{{ t('sex') }}</span>
              <div class="seg">
                <button type="button" :class="{ on: draft.sex === 'F' }" @click="draft.sex = 'F'">{{ t('female') }}</button>
                <button type="button" :class="{ on: draft.sex === 'M' }" @click="draft.sex = 'M'">{{ t('male') }}</button>
              </div>
            </div>
          </div>
          <div>
            <span class="lab">{{ t('acuity') }}</span>
            <div class="seg">
              <button type="button" :class="{ on: draft.status === 'stable' }" @click="draft.status = 'stable'">{{ t('stable') }}</button>
              <button type="button" :class="{ on: draft.status === 'watch' }" @click="draft.status = 'watch'">{{ t('watch') }}</button>
              <button type="button" :class="{ on: draft.status === 'critical' }" @click="draft.status = 'critical'">{{ t('critical') }}</button>
            </div>
          </div>
          <div>
            <span class="lab">{{ t('chiefC') }}</span>
            <textarea v-model="draft.complaint" class="in" :placeholder="t('addEvent')" />
          </div>
          <div>
            <span class="lab">{{ t('admittedAt') }}</span>
            <input v-model="draft.admittedAt" class="in mono" type="datetime-local" />
          </div>
        </div>

        <div class="sheet-actions">
          <button class="btn-ghost btn" type="button" @click="open = false">{{ t('cancel') }}</button>
          <button class="btn" type="button" @click="confirm">{{ t('admit') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
