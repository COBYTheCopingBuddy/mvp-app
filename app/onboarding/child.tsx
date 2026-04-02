import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChildForm, createChildAndPreferences, parseCsv } from '../../lib/coby'

export default function OnboardingChildScreen() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    ageBand: '4-6',
    languages: 'en',
    interests: 'stories, animals, music',
    sensitivities: '',
    avoidTopics: '',
    tone: 'gentle',
    responseLength: 'short' as ChildForm['responseLength'],
    parentNotes: '',
  })
  const [saving, setSaving] = useState(false)

  async function onSave() {
    if (!form.name.trim()) {
      Alert.alert('Missing child name', 'Please add the child name before continuing.')
      return
    }
    try {
      setSaving(true)
      const child = await createChildAndPreferences({
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
      router.replace({ pathname: '/onboarding/pair', params: { childId: child.id } } as never)
    } catch (error: any) {
      Alert.alert('Could not save child', error?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>Step 2 of 3</Text>
        <Text style={{ color: 'white', fontSize: 32, fontWeight: '800', marginTop: 8 }}>
          Add your first child
        </Text>
        <Text style={{ color: '#cbd5e1', fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 24 }}>
          These inputs are compiled into the prompt that the device fetches from Supabase.
        </Text>

        <Field label="Child name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Mila" />
        <Field label="Age band" value={form.ageBand} onChangeText={(v) => setForm((p) => ({ ...p, ageBand: v }))} placeholder="4-6" />
        <Field label="Languages (comma separated)" value={form.languages} onChangeText={(v) => setForm((p) => ({ ...p, languages: v }))} placeholder="en, de" />
        <Field label="Interests (comma separated)" value={form.interests} onChangeText={(v) => setForm((p) => ({ ...p, interests: v }))} placeholder="stories, dinosaurs" />
        <Field label="Sensitivities (comma separated)" value={form.sensitivities} onChangeText={(v) => setForm((p) => ({ ...p, sensitivities: v }))} placeholder="loud sounds" />
        <Field label="Avoid topics (comma separated)" value={form.avoidTopics} onChangeText={(v) => setForm((p) => ({ ...p, avoidTopics: v }))} placeholder="violence" />
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
          placeholder="Keep encouragement positive and playful"
          multiline
        />

        <Pressable onPress={onSave} disabled={saving} style={primaryButtonStyle}>
          <Text style={{ textAlign: 'center', fontWeight: '700', fontSize: 16 }}>
            {saving ? 'Saving…' : 'Continue to pairing'}
          </Text>
        </Pressable>
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
