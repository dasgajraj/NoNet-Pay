import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Vibration, Linking } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { styles as appStyles, colors } from '../constants/styles';

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (upiId: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ visible, onClose, onScan }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (visible && !hasPermission) {
      requestPermission();
    }
    if (visible) {
      setScanning(true);
    }
  }, [visible, hasPermission]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (!scanning || codes.length === 0) return;

      const data = codes[0].value;
      
      // Parse UPI QR code: upi://pay?pa={UPI_ID}&pn={NAME}&aid=...
      if (data && data.startsWith('upi://pay')) {
        try {
          const url = new URL(data);
          const upiId = url.searchParams.get('pa');
          
          if (upiId) {
            setScanning(false);
            Vibration.vibrate([0, 100, 100, 100]); // Success pattern
            onScan(upiId);
            setTimeout(() => {
              onClose();
              setScanning(true);
            }, 300);
          }
        } catch (error) {
          console.error('Error parsing UPI QR code:', error);
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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={scannerStyles.container}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={visible && scanning}
          codeScanner={codeScanner}
        />

        <View style={scannerStyles.overlay}>
          <Text style={scannerStyles.title}>Scan UPI QR Code</Text>
          <View style={scannerStyles.scanArea} />
          <Text style={scannerStyles.instruction}>
            Position the QR code within the frame
          </Text>
        </View>

        <TouchableOpacity
          style={scannerStyles.closeButton}
          onPress={() => {
            setScanning(true);
            onClose();
          }}
        >
          <Text style={scannerStyles.closeButtonText}>✕ Close</Text>
        </TouchableOpacity>
      </View>
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
    width: 250,
    height: 250,
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
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
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
