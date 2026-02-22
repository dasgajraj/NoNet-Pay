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
import { colors } from '../constants/styles';
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
    [minCameraZoom, maxCameraZoom],
  );

  const cameraZoom = zoomNormalizedToCamera(zoomNormalized);

  useEffect(() => {
    if (visible && !hasPermission) {
      requestPermission();
    }
    if (visible) {
      setScanning(true);
    }
    if (visible) {
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
    } catch (e) {
      Log.warn(TAG, 'Could not start light sensor listener');
      return;
    }

    const sub = lightEmitter.addListener('lightLevel', (event: { lux?: number }) => {
      const measuredLux = typeof event?.lux === 'number' ? event.lux : null;
      setLux(measuredLux);

      if (measuredLux === null) return;

      const prevSmoothed = smoothedLuxRef.current;
      const smoothed = prevSmoothed == null
        ? measuredLux
        : prevSmoothed * 0.7 + measuredLux * 0.3;
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
      } catch (e) {
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

  const clampZoom = useCallback((value: number) => {
    return Math.max(0, Math.min(1, value));
  }, []);

  const smoothZoomTo = useCallback((target: number) => {
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
  }, [clampZoom, zoomNormalized]);

  const autoZoomToCode = useCallback((code: Code, frame?: CodeScannerFrame) => {
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
  }, [clampZoom, smoothZoomTo, zoomNormalized]);

  const onPinchGestureEvent = useCallback((event: PinchGestureHandlerGestureEvent) => {
    const scale = event.nativeEvent.scale;
    const nextZoom = clampZoom(pinchStartZoom.current + (scale - 1) * 0.35);
    setZoomNormalized(nextZoom);
  }, [clampZoom]);

  const onPinchStateChange = useCallback((event: any) => {
    if (event.nativeEvent.state === GestureState.BEGAN) {
      pinchStartZoom.current = zoomNormalized;
    }
  }, [zoomNormalized]);

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
        } catch (error) {
          Log.warn(TAG, 'Error parsing UPI QR code');
        }
      }
    },
  });

  if (!visible) return null;

  if (!hasPermission) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={scannerStyles.permissionContainer}>
          <Text style={scannerStyles.permissionText}>Camera permission is required</Text>
          <TouchableOpacity
            style={scannerStyles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={scannerStyles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[scannerStyles.permissionButton, { marginTop: 10 }]}
            onPress={onClose}
          >
            <Text style={scannerStyles.permissionButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (!device) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={scannerStyles.permissionContainer}>
          <Text style={scannerStyles.permissionText}>No camera device found</Text>
          <TouchableOpacity style={scannerStyles.permissionButton} onPress={onClose}>
            <Text style={scannerStyles.permissionButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const effectiveTorch = manualTorch || autoTorch;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={scannerStyles.container}>
        <PinchGestureHandler
          onGestureEvent={onPinchGestureEvent}
          onHandlerStateChange={onPinchStateChange}
        >
          <View style={scannerStyles.container}>
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

            <View style={scannerStyles.overlay} pointerEvents="none">
              <Text style={scannerStyles.title}>Scan UPI QR Code</Text>
              <View style={scannerStyles.scanArea} />
              <Text style={scannerStyles.instruction}>Use pinch to zoom. Keep QR inside frame.</Text>
            </View>

            <View style={scannerStyles.controls}>
              <TouchableOpacity
                style={[scannerStyles.iconButton, effectiveTorch && scannerStyles.iconButtonActive]}
                onPress={() => {
                  const next = !manualTorch;
                  setManualTorch(next);
                  if (!next) {
                    setAutoTorch((lux ?? 100) < LOW_LIGHT_LUX);
                  }
                }}
              >
                <Icon
                  name={effectiveTorch ? 'flashlight' : 'flashlight-off'}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>

              <View style={scannerStyles.badge}>
                <Text style={scannerStyles.badgeText}>{`Zoom ${cameraZoom.toFixed(2)}x`}</Text>
              </View>

              <TouchableOpacity
                style={scannerStyles.iconButton}
                onPress={() => {
                  setScanning(true);
                  onClose();
                }}
              >
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {lux !== null && (
              <View style={scannerStyles.luxPill}>
                <Text style={scannerStyles.luxText}>{`Light ${lux.toFixed(0)} lx`}</Text>
              </View>
            )}
          </View>
        </PinchGestureHandler>
      </GestureHandlerRootView>
    </Modal>
  );
};

const scannerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    pointerEvents: 'none',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  scanArea: {
    width: SCAN_AREA,
    height: SCAN_AREA,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  instruction: {
    fontSize: 16,
    color: '#fff',
    marginTop: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  controls: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(255,193,7,0.55)',
  },
  badge: {
    minWidth: SCREEN_W * 0.36,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  luxPill: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  luxText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRScanner;
