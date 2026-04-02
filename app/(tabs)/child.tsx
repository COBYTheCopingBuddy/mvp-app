import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChildForm, getChildPreferences, getMyChildren, parseCsv, toCsv, updateChildAndPreferences } from '../../lib/coby'

export default function ChildTab() {
  const [childId, setChildId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    ageBand: '',
    languages: '',
    interests: '',
    sensitivities: '',
    avoidTopics: '',
    tone: 'gentle',
    responseLength: 'short' as ChildForm['responseLength'],
    parentNotes: '',
  })

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const children = await getMyChildren()
      const child = children[0]
      if (!child) { setChildId(null); return }
      const prefs = await getChildPreferences(child.id)
      setChildId(child.id)
      setForm({
        name: child.name ?? '',
        ageBand: child.age_band ?? '',
        languages: toCsv(child.languages),
        interests: toCsv(prefs?.interests),
        sensitivities: toCsv(prefs?.sensitivities),
        avoidTopics: toCsv(prefs?.avoid_topics),
        tone: prefs?.tone ?? 'gentle',
        responseLength: (prefs?.response_length as ChildForm['responseLength']) ?? 'short',
        parentNotes: prefs?.parent_notes ?? '',
      })
    } catch (error: any) {
      Alert.alert('Could not load child', error?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function onSave() {
    if (!childId) { Alert.alert('No child yet', 'Go through onboarding first to add a child profile.'); return }
    try {
      setSaving(true)
      await updateChildAndPreferences(childId, {
        name: form.name,
        ageBand: form.ageBand,
        languages: parseCsv(form.languages),
        interests: parseCsv(form.interests),
        sensitivities: parseCsv(form.sensitivities),
        avoidTopics: parseCsv(form.avoidTopics),
        tone: form.tone,
        responseLength: form.responseLength,
        parentNotes: form.parentNotes,
      })
      Alert.alert('Saved', 'Child preferences updated.')
    } catch (error: any) {
      Alert.alert('Could not save child', error?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 18 }}>
          Child profile
        </Text>

        {loading ? (
          <Text style={{ color: '#cbd5e1' }}>Loading…</Text>
        ) : !childId ? (
          <Text style={{ color: '#cbd5e1' }}>No child profile yet.</Text>
        ) : (
          <>
            <Field label="Name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Mila" />
            <Field label="Age band" value={form.ageBand} onChangeText={(v) => setForm((p) => ({ ...p, ageBand: v }))} placeholder="4-6" />
            <Field label="Languages" value={form.languages} onChangeText={(v) => setForm((p) => ({ ...p, languages: v }))} placeholder="en, de" />
            <Field label="Interests" value={form.interests} onChangeText={(v) => setForm((p) => ({ ...p, interests: v }))} placeholder="stories, animals" />
            <Field label="Sensitivities" value={form.sensitivities} onChangeText={(v) => setForm((p) => ({ ...p, sensitivities: v }))} placeholder="loud noises" />
            <Field label="Avoid topics" value={form.avoidTopics} onChangeText={(v) => setForm((p) => ({ ...p, avoidTopics: v }))} placeholder="violence" />
            <Field label="Tone" value={form.tone} onChangeText={(v) => setForm((p) => ({ ...p, tone: v }))} placeholder="gentle" />
            <Field
              label="Response length"
              value={form.responseLength}
              onChangeText={(v) => setForm((p) => ({ ...p, responseLength: v as ChildForm['responseLength'] }))}
              placeholder="short"
            />
            <Field
              label="Parent notes"
              value={form.parentNotes}
              onChangeText={(v) => setForm((p) => ({ ...p, parentNotes: v }))}
              placeholder="Keep the tone playful and reassuring"
              multiline
            />
            <Pressable onPress={onSave} disabled={saving} style={primaryButtonStyle}>
              <Text style={{ textAlign: 'center', fontWeight: '700' }}>
                {saving ? 'Saving…' : 'Save changes'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Field({
  label, value, onChangeText, placeholder, multiline,
}: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string; multiline?: boolean
}) {
  return (
    <>
      <Text style={labelStyle}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        multiline={multiline}
        style={[inputStyle, multiline ? { minHeight: 100, textAlignVertical: 'top' } : null]}
      />
    </>
  )
}

const labelStyle = { color: '#e2e8f0', marginBottom: 8, marginTop: 4, fontWeight: '600' } as const
const inputStyle = {
  backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155', color: 'white',
  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, marginBottom: 14,
} as const
const primaryButtonStyle = {
  backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 18, marginTop: 12,
} as const
