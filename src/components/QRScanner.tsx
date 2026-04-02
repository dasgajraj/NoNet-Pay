import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Vibration,
  Dimensions,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  Code,
  CodeScannerFrame,
} from 'react-native-vision-camera';
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
  State as GestureState,
} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Log from '../services/Logger';

const TAG = 'QRScanner';
const { width: SCREEN_W } = Dimensions.get('window');
const SCAN_AREA = 250;

const LightSensor = NativeModules.LightSensorModule;
const lightEmitter =
  Platform.OS === 'android' && LightSensor
    ? new NativeEventEmitter(LightSensor)
    : null;

const LOW_LIGHT_LUX = 12;
const HIGH_LIGHT_LUX = 35;
const TORCH_TOGGLE_COOLDOWN_MS = 3000;

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (upiId: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ visible, onClose, onScan }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  const [scanning, setScanning] = useState(true);
  const [manualTorch, setManualTorch] = useState(false);
  const [autoTorch, setAutoTorch] = useState(false);
  const [lux, setLux] = useState<number | null>(null);
  const [zoomNormalized, setZoomNormalized] = useState(0);

  const pinchStartZoom = useRef(0);
  const zoomAnimRef = useRef<NodeJS.Timeout | null>(null);
  const smoothedLuxRef = useRef<number | null>(null);
  const lastTorchToggleAtRef = useRef(0);

  const minCameraZoom = device?.minZoom ?? 1;
  const maxCameraZoom = Math.min(device?.maxZoom ?? 1, 8);

  const zoomNormalizedToCamera = useCallback(
    (normalized: number) => minCameraZoom + normalized * (maxCameraZoom - minCameraZoom),
    [maxCameraZoom, minCameraZoom],
  );

  const cameraZoom = zoomNormalizedToCamera(zoomNormalized);

  useEffect(() => {
    if (visible && !hasPermission) {
      requestPermission();
    }
    if (visible) {
      setScanning(true);
      setZoomNormalized(0);
      Log.info(TAG, 'Scanner opened');
    }
  }, [visible, hasPermission, requestPermission]);

  useEffect(() => {
    if (!visible || !LightSensor || !lightEmitter) {
      return;
    }

    try {
      LightSensor.startListening();
    } catch {
      Log.warn(TAG, 'Could not start light sensor listener');
      return;
    }

    const sub = lightEmitter.addListener('lightLevel', (event: { lux?: number }) => {
      const measuredLux = typeof event?.lux === 'number' ? event.lux : null;
      setLux(measuredLux);

      if (measuredLux === null) return;

      const prevSmoothed = smoothedLuxRef.current;
      const smoothed = prevSmoothed == null ? measuredLux : prevSmoothed * 0.7 + measuredLux * 0.3;
      smoothedLuxRef.current = smoothed;

      if (manualTorch) return;

      const now = Date.now();
      const canToggle = now - lastTorchToggleAtRef.current >= TORCH_TOGGLE_COOLDOWN_MS;
      if (!canToggle) return;

      setAutoTorch(prev => {
        if (!prev && smoothed < LOW_LIGHT_LUX) {
          lastTorchToggleAtRef.current = now;
          Log.info(TAG, `Auto-flash ON (smoothedLux=${smoothed.toFixed(1)})`);
          return true;
        }
        if (prev && smoothed > HIGH_LIGHT_LUX) {
          lastTorchToggleAtRef.current = now;
          Log.info(TAG, `Auto-flash OFF (smoothedLux=${smoothed.toFixed(1)})`);
          return false;
        }
        return prev;
      });
    });

    return () => {
      sub.remove();
      try {
        LightSensor.stopListening();
      } catch {
        Log.warn(TAG, 'Could not stop light sensor listener');
      }
    };
  }, [visible, manualTorch]);

  useEffect(() => {
    if (!visible) {
      setManualTorch(false);
      setAutoTorch(false);
      setLux(null);
      setZoomNormalized(0);
      smoothedLuxRef.current = null;
      if (zoomAnimRef.current) {
        clearInterval(zoomAnimRef.current);
        zoomAnimRef.current = null;
      }
    }
  }, [visible]);

  const clampZoom = useCallback((value: number) => Math.max(0, Math.min(1, value)), []);

  const smoothZoomTo = useCallback(
    (target: number) => {
      const safeTarget = clampZoom(target);
      if (Math.abs(safeTarget - zoomNormalized) < 0.02) return;

      if (zoomAnimRef.current) {
        clearInterval(zoomAnimRef.current);
      }

      const start = zoomNormalized;
      const steps = 8;
      let step = 0;
      const stepDelta = (safeTarget - start) / steps;

      zoomAnimRef.current = setInterval(() => {
        step += 1;
        setZoomNormalized(prev => clampZoom(prev + stepDelta));
        if (step >= steps && zoomAnimRef.current) {
          clearInterval(zoomAnimRef.current);
          zoomAnimRef.current = null;
        }
      }, 35);
    },
    [clampZoom, zoomNormalized],
  );

  const autoZoomToCode = useCallback(
    (code: Code, frame?: CodeScannerFrame) => {
      if (!code?.frame || !frame) return;

      const codeWidth = code.frame.width ?? 0;
      const codeHeight = code.frame.height ?? 0;
      const frameWidth = frame.width ?? 1;
      const frameHeight = frame.height ?? 1;
      if (codeWidth <= 0 || codeHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) return;

      const coverage = (codeWidth * codeHeight) / (frameWidth * frameHeight);
      if (coverage >= 0.03) return;

      const targetCoverage = 0.15;
      const magnification = Math.sqrt(targetCoverage / coverage);
      const targetZoom = clampZoom(zoomNormalized + Math.min(0.5, (magnification - 1) * 0.25));
      smoothZoomTo(targetZoom);
    },
    [clampZoom, smoothZoomTo, zoomNormalized],
  );

  const onPinchGestureEvent = useCallback(
    (event: PinchGestureHandlerGestureEvent) => {
      const scale = event.nativeEvent.scale;
      const nextZoom = clampZoom(pinchStartZoom.current + (scale - 1) * 0.35);
      setZoomNormalized(nextZoom);
    },
    [clampZoom],
  );

  const onPinchStateChange = useCallback(
    (event: any) => {
      if (event.nativeEvent.state === GestureState.BEGAN) {
        pinchStartZoom.current = zoomNormalized;
      }
    },
    [zoomNormalized],
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes, frame) => {
      if (!scanning || codes.length === 0) return;

      const data = codes[0].value;
      autoZoomToCode(codes[0], frame);

      if (data && data.startsWith('upi://pay')) {
        try {
          const url = new URL(data);
          const upiId = url.searchParams.get('pa');

          if (upiId) {
            setScanning(false);
            Vibration.vibrate([0, 100, 100, 100]);
            Log.info(TAG, `UPI QR detected: ${upiId}`);
            if (!manualTorch) {
              setAutoTorch(false);
            }
            onScan(upiId);
            setTimeout(() => {
              onClose();
              setScanning(true);
            }, 300);
          }
        } catch {
          Log.warn(TAG, 'Error parsing UPI QR code');
        }
      }
    },
  });

  if (!visible) return null;

  if (!hasPermission) {
    return (
      <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
        <View style={[styles.permissionContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.permissionCard, { backgroundColor: theme.colors.cardElevated, borderColor: theme.colors.border }]}>
            <View style={[styles.permissionIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon name="camera-outline" size={28} color={theme.colors.primary} />
            </View>
            <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>Camera permission required</Text>
            <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
              We need camera access to scan UPI QR codes and prefill payments.
            </Text>
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
              onPress={requestPermission}
            >
              <Text style={[styles.permissionButtonText, { color: theme.colors.buttonText }]}>Grant permission</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.colors.borderStrong }]}
              onPress={onClose}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (!device) {
    return (
      <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
        <View style={[styles.permissionContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.permissionCard, { backgroundColor: theme.colors.cardElevated, borderColor: theme.colors.border }]}>
            <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>Camera unavailable</Text>
            <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
              No supported camera device was found on this device.
            </Text>
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
              onPress={onClose}
            >
              <Text style={[styles.permissionButtonText, { color: theme.colors.buttonText }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const effectiveTorch = manualTorch || autoTorch;
  const torchButtonStyle = {
    backgroundColor: effectiveTorch ? 'rgba(255, 210, 122, 0.3)' : theme.colors.overlay,
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent>
      <GestureHandlerRootView style={styles.flex}>
        <PinchGestureHandler
          onGestureEvent={onPinchGestureEvent}
          onHandlerStateChange={onPinchStateChange}
        >
          <View style={styles.flex}>
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={visible && scanning}
              codeScanner={codeScanner}
              zoom={cameraZoom}
              torch={effectiveTorch ? 'on' : 'off'}
              lowLightBoost={true}
            />

            <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
              <View style={[styles.topOverlay, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: theme.colors.overlay }]}
                  onPress={() => {
                    setScanning(true);
                    onClose();
                  }}
                >
                  <Icon name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={[styles.badge, { backgroundColor: theme.colors.overlay }]}>
                  <Text style={styles.badgeText}>{`Zoom ${cameraZoom.toFixed(2)}x`}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.controlButton, torchButtonStyle]}
                  onPress={() => {
                    const next = !manualTorch;
                    setManualTorch(next);
                    if (!next) {
                      setAutoTorch((lux ?? 100) < LOW_LIGHT_LUX);
                    }
                  }}
                >
                  <Icon name={effectiveTorch ? 'flashlight' : 'flashlight-off'} size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.centerOverlay} pointerEvents="none">
                <Text style={styles.title}>Scan UPI QR</Text>
                <Text style={styles.subtitle}>Keep the code inside the frame. Pinch to zoom if needed.</Text>
                <View style={[styles.scanArea, { borderColor: theme.colors.primary }]}>
                  <View style={[styles.corner, styles.topLeft, { borderColor: theme.colors.primary }]} />
                  <View style={[styles.corner, styles.topRight, { borderColor: theme.colors.primary }]} />
                  <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.colors.primary }]} />
                  <View style={[styles.corner, styles.bottomRight, { borderColor: theme.colors.primary }]} />
                </View>
              </View>

              <View style={[styles.bottomOverlay, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <View style={[styles.tipCard, { backgroundColor: theme.colors.overlay }]}>
                  <Text style={styles.tipTitle}>Offline-friendly flow</Text>
                  <Text style={styles.tipText}>
                    We extract the UPI ID and bring you straight into the send money screen.
                  </Text>
                </View>
                {lux !== null ? (
                  <View style={[styles.luxPill, { backgroundColor: theme.colors.overlay }]}>
                    <Text style={styles.luxText}>{`Ambient light ${lux.toFixed(0)} lx`}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </PinchGestureHandler>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topOverlay: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: SCREEN_W * 0.34,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  centerOverlay: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 30,
  },
  scanArea: {
    width: SCAN_AREA,
    height: SCAN_AREA,
    borderRadius: 30,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 14,
  },
  topRight: {
    top: 12,
    right: 12,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 14,
  },
  bottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 14,
  },
  bottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 14,
  },
  bottomOverlay: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tipCard: {
    width: '100%',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  tipTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  tipText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 20,
  },
  luxPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  luxText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
  },
  permissionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  permissionButton: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default QRScanner;
