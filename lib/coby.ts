import { supabase } from './supabase'

export type ProfileForm = {
  fullName: string
  preferredLanguage: string
  timezone: string
}

export type ChildForm = {
  name: string
  ageBand: string
  languages: string[]
  interests: string[]
  sensitivities: string[]
  avoidTopics: string[]
  tone: string
  responseLength: 'short' | 'medium' | 'long'
  parentNotes: string
}

export type DevicePrefsForm = {
  locale: string
  wake_phrase: string
  volume: number
  listening_mode: 'push_to_talk' | 'always_listen'
}

export function parseCsv(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

export function toCsv(value: string[] | null | undefined) {
  return (value ?? []).join(', ')
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error(error?.message ?? 'Not authenticated')
  return user
}

export async function getMyProfile() {
  const user = await requireUser()
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, household_id, full_name, preferred_language, timezone, avatar_url')
    .eq('user_id', user.id)
    .single()
  if (error) throw error
  return data
}

export async function saveMyProfile(input: ProfileForm) {
  const user = await requireUser()
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim(),
      preferred_language: input.preferredLanguage.trim() || 'en',
      timezone: input.timezone.trim() || 'Europe/Berlin',
    })
    .eq('user_id', user.id)
  if (error) throw error
}

export async function getMyChildren() {
  const profile = await getMyProfile()
  const { data, error } = await supabase
    .from('children')
    .select('id, household_id, name, age_band, birthdate, pronouns, languages, created_at')
    .eq('household_id', profile.household_id)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getChildPreferences(childId: string) {
  const { data, error } = await supabase
    .from('child_preferences')
    .select('child_id, interests, educational_goals, sensitivities, avoid_topics, tone, response_length, parent_notes')
    .eq('child_id', childId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createChildAndPreferences(input: ChildForm) {
  const profile = await getMyProfile()
  const { data: child, error: childError } = await supabase
    .from('children')
    .insert({
      household_id: profile.household_id,
      name: input.name.trim(),
      age_band: input.ageBand.trim() || null,
      languages: input.languages,
    })
    .select('id')
    .single()
  if (childError) throw childError

  const { error: prefError } = await supabase.from('child_preferences').upsert({
    child_id: child.id,
    interests: input.interests,
    sensitivities: input.sensitivities,
    avoid_topics: input.avoidTopics,
    tone: input.tone,
    response_length: input.responseLength,
    parent_notes: input.parentNotes.trim() || null,
  })
  if (prefError) throw prefError
  return child
}

export async function updateChildAndPreferences(childId: string, input: ChildForm) {
  const { error: childError } = await supabase
    .from('children')
    .update({
      name: input.name.trim(),
      age_band: input.ageBand.trim() || null,
      languages: input.languages,
    })
    .eq('id', childId)
  if (childError) throw childError

  const { error: prefError } = await supabase.from('child_preferences').upsert({
    child_id: childId,
    interests: input.interests,
    sensitivities: input.sensitivities,
    avoid_topics: input.avoidTopics,
    tone: input.tone,
    response_length: input.responseLength,
    parent_notes: input.parentNotes.trim() || null,
  })
  if (prefError) throw prefError
}

export async function getMyDevices() {
  const { data, error } = await supabase
    .from('devices')
    .select('id, serial, ble_name, model, firmware_version, pairing_state, online_state, last_seen_at, config_version, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getDevicePreferences(deviceId: string) {
  const { data, error } = await supabase
    .from('device_preferences')
    .select('device_id, locale, wake_phrase, volume, voice_id, listening_mode')
    .eq('device_id', deviceId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveDevicePreferences(deviceId: string, prefs: DevicePrefsForm) {
  const { error } = await supabase.from('device_preferences').upsert({
    device_id: deviceId,
    locale: prefs.locale,
    wake_phrase: prefs.wake_phrase,
    volume: prefs.volume,
    listening_mode: prefs.listening_mode,
  })
  if (error) throw error
}

export async function getActiveAssignment(deviceId: string) {
  const { data, error } = await supabase
    .from('device_assignments')
    .select('id, child_id')
    .eq('device_id', deviceId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function assignDeviceToChild(deviceId: string, childId: string) {
  const { error: deactivateError } = await supabase
    .from('device_assignments')
    .update({ is_active: false, unassigned_at: new Date().toISOString() })
    .eq('device_id', deviceId)
    .eq('is_active', true)
  if (deactivateError) throw deactivateError

  const { error: insertError } = await supabase.from('device_assignments').insert({
    device_id: deviceId,
    child_id: childId,
    is_active: true,
  })
  if (insertError) throw insertError
}

export async function getDashboardData() {
  const [profile, children, devices] = await Promise.all([
    getMyProfile(),
    getMyChildren(),
    getMyDevices(),
  ])

  const firstDevice = devices[0] ?? null
  let devicePreferences = null
  let activeAssignment = null

  if (firstDevice) {
    ;[devicePreferences, activeAssignment] = await Promise.all([
      getDevicePreferences(firstDevice.id),
      getActiveAssignment(firstDevice.id),
    ])
  }

  return { profile, children, devices, device: firstDevice, devicePreferences, activeAssignment }
}

export async function getOnboardingRoute() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return '/welcome'

  const profile = await getMyProfile()
  const children = await getMyChildren()
  const devices = await getMyDevices()

  if (!profile.full_name?.trim()) return '/onboarding/profile'
  if (children.length === 0) return '/onboarding/child'
  if (devices.length === 0) return '/onboarding/pair'
  return '/(tabs)'
}

export async function startPairing(params: { deviceSerial: string; wifiSsid: string }) {
  const { data, error } = await supabase.functions.invoke('pairing-start', { body: params })
  if (error) throw error
  return data as { deviceId: string; pairToken: string; expiresAt: string }
}

export async function waitForClaimedDevice(deviceSerial: string, timeoutMs = 45000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    const { data, error } = await supabase
      .from('devices')
      .select('id, serial, ble_name, firmware_version, pairing_state, online_state, config_version')
      .eq('serial', deviceSerial)
      .maybeSingle()
    if (error) throw error
    if (data?.pairing_state === 'claimed') return data
    await sleep(2000)
  }
  throw new Error('Device did not finish pairing in time')
}
