import { PermissionsAndroid, Platform } from 'react-native'
import { BleManager, Device, State } from 'react-native-ble-plx'
import { Buffer } from 'buffer'

export const COBY_BLE_SERVICE_UUID = '19b10000-e8f2-537e-4f6c-d104768a1214'
export const COBY_DEVICE_INFO_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214'
export const COBY_PROVISION_UUID = '19b10002-e8f2-537e-4f6c-d104768a1214'
export const COBY_STATUS_UUID = '19b10003-e8f2-537e-4f6c-d104768a1214'

export type ScannedCobyDevice = {
  id: string
  name: string
  raw: Device
}

export type ProvisioningPayload = {
  pairToken: string
  wifiSsid: string
  wifiPassword: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const bleManager = new BleManager()

export async function requestBlePermissions() {
  if (Platform.OS !== 'android') return true

  const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10)

  if (apiLevel >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ])

    return [
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN],
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT],
      result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION],
    ].every((value) => value === PermissionsAndroid.RESULTS.GRANTED)
  }

  const location = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
  return location === PermissionsAndroid.RESULTS.GRANTED
}

export async function ensureBleReady(timeoutMs = 10000) {
  const currentState = await bleManager.state()
  if (currentState === State.PoweredOn) return

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription.remove()
      reject(new Error('Bluetooth is not powered on'))
    }, timeoutMs)

    const subscription = bleManager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        clearTimeout(timeout)
        subscription.remove()
        resolve()
      }
    }, true)
  })
}

export async function scanForCobyDevices(
  onDevice: (device: ScannedCobyDevice) => void,
  timeoutMs = 8000,
) {
  const permitted = await requestBlePermissions()
  if (!permitted) throw new Error('Bluetooth permissions were not granted')

  await ensureBleReady()

  const seen = new Set<string>()
  const matchesService = COBY_BLE_SERVICE_UUID.toLowerCase()

  await bleManager.startDeviceScan([COBY_BLE_SERVICE_UUID], null, (error, device) => {
    if (error) { console.error('BLE scan error', error); return }
    if (!device) return

    const advertisedServices = (device.serviceUUIDs ?? []).map((uuid) => uuid.toLowerCase())
    const name = device.localName ?? device.name ?? ''
    const looksLikeCoby = name.toLowerCase().includes('coby') || advertisedServices.includes(matchesService)

    if (!looksLikeCoby || seen.has(device.id)) return
    seen.add(device.id)
    onDevice({ id: device.id, name: name || device.id, raw: device })
  })

  await sleep(timeoutMs)
  await bleManager.stopDeviceScan()
}

export async function connectAndProvision(
  deviceId: string,
  payload: ProvisioningPayload,
  onStatus?: (status: string) => void,
) {
  await ensureBleReady()

  const device = await bleManager.connectToDevice(deviceId)
  const connected = await device.discoverAllServicesAndCharacteristics()

  const statusSubscription = bleManager.monitorCharacteristicForDevice(
    connected.id,
    COBY_BLE_SERVICE_UUID,
    COBY_STATUS_UUID,
    (error, characteristic) => {
      if (error) { console.error('Status monitor error', error); return }
      if (!characteristic?.value) return
      const decoded = Buffer.from(characteristic.value, 'base64').toString('utf8')
      onStatus?.(decoded)
    },
  )

  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')

  await bleManager.writeCharacteristicWithResponseForDevice(
    connected.id,
    COBY_BLE_SERVICE_UUID,
    COBY_PROVISION_UUID,
    body,
  )

  await sleep(2500)
  statusSubscription.remove()
  return connected
}

export async function disconnectDevice(deviceId: string) {
  try {
    const isConnected = await bleManager.isDeviceConnected(deviceId)
    if (isConnected) await bleManager.cancelDeviceConnection(deviceId)
  } catch (error) {
    console.warn('Ignoring disconnect error', error)
  }
}
