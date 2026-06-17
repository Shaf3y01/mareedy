import { defineStore } from 'pinia'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface MedLog { date: string; text: string }
export interface Med {
  id: string; name: string; dose: string; route: string; freq: string
  start: string; status: 'active' | 'escalated' | 'de-escalated' | 'discontinued'
  editing?: boolean; log: MedLog[]
}
export interface WardEvent { date: string; text: string }

export interface LabsSet {
  labsDate: string
  abg: { ph: string; co2: string; hco3: string; lactate: string }
  cbc: { tlc: string; hb: string; plt: string }
  renal: { urea: string; creatinine: string }
  lytes: { na: string; k: string; ca: string }
  liver: { ast: string; alt: string; albumin: string }
  bili: { total: string; direct: string; indirect: string }
  inr: string; crp: string
  cardiac: { troponin: string; ckmb: string }
  thyroid: { tsh: string; ft3: string; ft4: string }
  hba1c: string
}

export interface Patient {
  id: string
  admittedAt: string
  patientNo: string
  name: string; age: string; sex: string
  pmhx: string; allergies: string; habits: string
  chartDate: string
  conscious: string; bp: string; hr: string; spo2: string; o2mode: string; temp: string; rr: string
  status: Acuity
  exam: { appearance: string; cvs: string; chest: string; abdomen: string; limbs: string; neuro: string; examDate: string }
  imaging: { ctChest: string; ctBrain: string; xray: string; paus: string; imagingDate: string }
  ultrasound: string; endoscopy: string
  labsSets: { admission: LabsSet; yesterday: LabsSet; today: LabsSet }
  balance: { sign: '+' | '-'; value: string }
  events: WardEvent[]
  recommendations: string
  meds: Med[]
}
export interface Bed { id: number; patient: Patient | null }

/* ------------------------------------------------------------------ */
/*  Factory for an empty patient (every field present → safe to edit)  */
/* ------------------------------------------------------------------ */
export function blankLabsSet(): LabsSet {
  return {
    labsDate: '',
    abg: { ph: '', co2: '', hco3: '', lactate: '' },
    cbc: { tlc: '', hb: '', plt: '' },
    renal: { urea: '', creatinine: '' },
    lytes: { na: '', k: '', ca: '' },
    liver: { ast: '', alt: '', albumin: '' },
    bili: { total: '', direct: '', indirect: '' },
    inr: '', crp: '',
    cardiac: { troponin: '', ckmb: '' },
    thyroid: { tsh: '', ft3: '', ft4: '' },
    hba1c: '',
  }
}

export function blankPatient(over: Partial<Patient> = {}): Patient {
  return {
    id: uid(),
    admittedAt: '',
    patientNo: '',
    name: '', age: '', sex: 'F', pmhx: '', allergies: '', habits: '',
    chartDate: '',
    conscious: '', bp: '', hr: '', spo2: '', o2mode: 'Room Air', temp: '', rr: '',
    status: 'stable',
    exam: { appearance: '', cvs: '', chest: '', abdomen: '', limbs: '', neuro: '', examDate: '' },
    imaging: { ctChest: '', ctBrain: '', xray: '', paus: '', imagingDate: '' },
    ultrasound: '', endoscopy: '',
    labsSets: { admission: blankLabsSet(), yesterday: blankLabsSet(), today: blankLabsSet() },
    balance: { sign: '-', value: '' },
    events: [], recommendations: '', meds: [],
    ...over,
  }
}

/* ------------------------------------------------------------------ */
/*  DB ↔ App mapping                                                   */
/* ------------------------------------------------------------------ */
function readLabsSet(src: Record<string, any>): LabsSet {
  const b = blankLabsSet()
  return {
    labsDate: src.labsDate ?? '',
    abg: { ...b.abg, ...(src.abg ?? {}) },
    cbc: { ...b.cbc, ...(src.cbc ?? {}) },
    renal: { ...b.renal, ...(src.renal ?? {}) },
    lytes: { ...b.lytes, ...(src.lytes ?? {}) },
    liver: { ...b.liver, ...(src.liver ?? {}) },
    bili: { ...b.bili, ...(src.bili ?? {}) },
    inr: src.inr ?? '', crp: src.crp ?? '',
    cardiac: { ...b.cardiac, ...(src.cardiac ?? {}) },
    thyroid: { ...b.thyroid, ...(src.thyroid ?? {}) },
    hba1c: src.hba1c ?? '',
  }
}

function dbRowToPatient(row: Record<string, any>, events: any[], meds: any[]): Patient {
  const labs = (row.labs as Record<string, any>) ?? {}
  const admissionSrc = labs.admission ?? (labs.abg ? labs : {})
  const b = blankPatient()
  const sortedEvents = [...events].sort(
    (a, z) => new Date(z.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  )
  return {
    id: row.id,
    admittedAt: row.admitted_at ? isoToLocalInput(row.admitted_at) : '',
    patientNo: row.patient_no ?? '',
    name: row.name ?? '', age: row.age ?? '', sex: row.sex ?? 'F',
    pmhx: row.pmhx ?? '', allergies: row.allergies ?? '', habits: row.habits ?? '',
    chartDate: row.chart_date ? fmtDbTimestamp(row.chart_date) : '',
    conscious: row.conscious ?? '', bp: row.bp ?? '', hr: row.hr ?? '',
    spo2: row.spo2 ?? '', o2mode: row.o2mode ?? 'Room Air', temp: row.temp ?? '', rr: row.rr ?? '',
    status: (row.status ?? 'stable') as Acuity,
    exam: { ...b.exam, ...(row.exam ?? {}) },
    imaging: { ...b.imaging, ...(row.imaging ?? {}) },
    ultrasound: row.ultrasound ?? '', endoscopy: row.endoscopy ?? '',
    labsSets: {
      admission: readLabsSet(admissionSrc),
      yesterday: readLabsSet(labs.yesterday ?? {}),
      today: readLabsSet(labs.today ?? {}),
    },
    balance: { sign: '-', value: '', ...(row.balance ?? {}) } as Patient['balance'],
    recommendations: row.recommendations ?? '',
    events: sortedEvents.map(e => ({ date: fmtDbTimestamp(e.occurred_at), text: e.body })),
    meds: meds.map(m => ({
      id: m.id, name: m.name, dose: m.dose ?? '', route: m.route ?? 'PO', freq: m.freq ?? '',
      start: fmtDbDay(m.started), status: m.status as Med['status'],
      editing: false, log: (m.log ?? []) as MedLog[],
    })),
  }
}

function patientToDbRow(p: Patient) {
  return {
    patient_no: p.patientNo,
    name: p.name, age: p.age, sex: p.sex,
    pmhx: p.pmhx, allergies: p.allergies, habits: p.habits,
    admitted_at: p.admittedAt ? new Date(p.admittedAt).toISOString() : null,
    chart_date: p.chartDate ? new Date(p.chartDate).toISOString() : null,
    conscious: p.conscious, bp: p.bp, hr: p.hr, spo2: p.spo2,
    o2mode: p.o2mode, temp: p.temp, rr: p.rr, status: p.status,
    exam: p.exam, imaging: p.imaging, ultrasound: p.ultrasound, endoscopy: p.endoscopy,
    labs: p.labsSets,
    balance: p.balance, recommendations: p.recommendations,
    updated_at: new Date().toISOString(),
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */
export const useWardStore = defineStore('ward', () => {
  const supabase = useSupabaseClient()

  const beds = ref<Bed[]>([])
  const loading = ref(false)

  const bedById = computed(() => (id: number) => beds.value.find(b => b.id === id) ?? null)
  const occupiedCount = computed(() => beds.value.filter(b => b.patient).length)

  async function loadWard() {
    loading.value = true
    try {
      const [{ data: bedRows }, { data: patRows }] = await Promise.all([
        supabase.from('beds').select('id').order('id'),
        supabase
          .from('patients')
          .select('*, events(id, occurred_at, body), meds(id, name, dose, route, freq, started, status, log)')
          .eq('discharged', false),
      ])
      const patMap = new Map<number, Patient>()
      for (const row of patRows ?? []) {
        patMap.set(row.bed_id, dbRowToPatient(row, row.events ?? [], row.meds ?? []))
      }
      beds.value = (bedRows ?? []).map(b => ({ id: b.id, patient: patMap.get(b.id) ?? null }))
    } catch {
      // Supabase unavailable (no session, no network, missing env) — start with empty ward.
    } finally {
      loading.value = false
    }
  }

  async function admit(
    bedId: number,
    data: { patientNo: string; name: string; age: string; sex: string; status: Acuity; complaint: string; admittedAt: string },
  ) {
    const bed = bedById.value(bedId)
    if (!bed) return

    const admittedIso = data.admittedAt ? new Date(data.admittedAt).toISOString() : new Date().toISOString()
    const { data: row } = await supabase
      .from('patients')
      .insert({ bed_id: bedId, patient_no: data.patientNo, name: data.name.trim(), age: data.age, sex: data.sex, status: data.status, admitted_at: admittedIso })
      .select()
      .single()
    if (!row) return

    const eventText = data.complaint.trim()
      ? 'Admitted — ' + data.complaint.trim()
      : 'Admitted to bed ' + bedId
    const { data: ev } = await supabase
      .from('events')
      .insert({ patient_id: row.id, body: eventText, occurred_at: admittedIso })
      .select()
      .single()

    const p = dbRowToPatient(row, ev ? [ev] : [], [])
    bed.patient = p
    return p
  }

  async function discharge(bedId: number) {
    const bed = bedById.value(bedId)
    if (!bed?.patient) return
    await supabase
      .from('patients')
      .update({ discharged: true, bed_id: null })
      .eq('id', bed.patient.id)
    bed.patient = null
  }

  async function addBed() {
    const max = beds.value.reduce((m, b) => Math.max(m, b.id), 0)
    const newId = max + 1
    await supabase.from('beds').insert({ id: newId })
    beds.value.push({ id: newId, patient: null })
  }

  async function removeBed(bedId: number) {
    const bed = bedById.value(bedId)
    if (beds.value.length <= 9 || !bed || bed.patient) return
    await supabase.from('beds').delete().eq('id', bedId)
    beds.value = beds.value.filter(b => b.id !== bedId)
  }

  async function addEvent(bedId: number, text: string, occurredAt?: string) {
    const p = bedById.value(bedId)?.patient
    if (!p || !text.trim()) return
    const occurred_at = occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString()
    const { data: ev } = await supabase
      .from('events')
      .insert({ patient_id: p.id, body: text.trim(), occurred_at })
      .select()
      .single()
    p.events.unshift({
      date: ev ? fmtDbTimestamp(ev.occurred_at) : fmtDbTimestamp(occurred_at),
      text: text.trim(),
    })
  }

  async function addMed(bedId: number, draft: { name: string; dose: string; route: string; freq: string; startedOn?: string }) {
    const p = bedById.value(bedId)?.patient
    if (!p || !draft.name.trim()) return
    const startedDate = draft.startedOn ?? new Date().toISOString().slice(0, 10)
    const log: MedLog[] = [{ date: fmtDbDay(startedDate), text: 'Started' }]
    const { data: row } = await supabase
      .from('meds')
      .insert({
        patient_id: p.id,
        name: draft.name.trim(), dose: draft.dose, route: draft.route, freq: draft.freq,
        started: startedDate,
        status: 'active', log,
      })
      .select()
      .single()
    if (row) {
      p.meds.push({
        id: row.id, name: row.name, dose: row.dose ?? '', route: row.route ?? 'PO', freq: row.freq ?? '',
        start: fmtDbDay(startedDate), status: 'active', editing: false, log,
      })
    }
  }

  async function medAction(bedId: number, medId: string, action: 'discont' | 'escalate' | 'deesc') {
    const med = bedById.value(bedId)?.patient?.meds.find(m => m.id === medId)
    if (!med) return
    const map = {
      discont: ['discontinued', 'Discontinued'],
      escalate: ['escalated', 'Escalated'],
      deesc: ['de-escalated', 'De-escalated'],
    } as const
    const [status, label] = map[action]
    const newLog = [...med.log, { date: fmtToday(), text: label }]
    await supabase.from('meds').update({ status, log: newLog }).eq('id', medId)
    med.status = status
    med.log = newLog
  }

  async function toggleMedEdit(bedId: number, medId: string) {
    const med = bedById.value(bedId)?.patient?.meds.find(m => m.id === medId)
    if (!med) return
    if (med.editing) {
      const newLog = [...med.log, { date: fmtToday(), text: 'Modified' }]
      await supabase
        .from('meds')
        .update({ name: med.name, dose: med.dose, route: med.route, freq: med.freq, log: newLog })
        .eq('id', medId)
      med.log = newLog
    }
    med.editing = !med.editing
  }

  async function savePatient(bedId: number) {
    const p = bedById.value(bedId)?.patient
    if (!p) return
    await supabase.from('patients').update(patientToDbRow(p)).eq('id', p.id)
  }

  return {
    beds, loading,
    bedById, occupiedCount,
    loadWard, admit, discharge, addBed, removeBed,
    addEvent, addMed, medAction, toggleMedEdit, savePatient,
  }
})
