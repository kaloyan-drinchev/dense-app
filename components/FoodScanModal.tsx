import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
// import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { colors } from '@/constants/colors';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import { FoodItem, MealType } from '@/types/nutrition';
import { COMMON_FOODS } from '@/mocks/foods';
import * as Haptics from 'expo-haptics';

interface FoodScanModalProps {
  visible: boolean;
  onClose: () => void;
  onScanResult: (
    foods: Array<{ food: FoodItem; amount: number }>,
    mealType: MealType
  ) => void;
  onBarcodeScanned?: (barcode: string) => void;
}

type ScanMode = 'food' | 'barcode';

export const FoodScanModal: React.FC<FoodScanModalProps> = ({
  visible,
  onClose,
  onScanResult,
  onBarcodeScanned,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('food');
  const [barcodeData, setBarcodeData] = useState<string | null>(null);
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const cameraRef = useRef(null);

  // Reset state when modal is opened
  useEffect(() => {
    if (visible) {
      setIsScanning(false);
      setScanComplete(false);
      setScanError(false);
      setBarcodeData(null);
      setBarcodeScanned(false);
    }
  }, [visible]);

  const handleCapture = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsScanning(true);

    // Simulate processing time
    setTimeout(() => {
      // Simulate successful scan with random foods
      const randomFoods = getRandomFoods(1 + Math.floor(Math.random() * 3));
      const mealType: MealType = getCurrentMealType();

      setIsScanning(false);
      setScanComplete(true);

      // Notify parent component of scan results
      onScanResult(randomFoods, mealType);

      // Reset state after a delay
      setTimeout(() => {
        setScanComplete(false);
        onClose();
      }, 1500);
    }, 2500);
  };

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (barcodeScanned) return;

    setBarcodeScanned(true);
    setBarcodeData(data);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Find food by barcode
    const food = COMMON_FOODS.find((f) => f.barcode === data);

    if (food) {
      // If food is found, return it as a scan result
      const mealType: MealType = getCurrentMealType();
      onScanResult([{ food, amount: parseInt(food.servingSize) }], mealType);

      // Close modal after a delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } else if (onBarcodeScanned) {
      // If no food is found but we have a handler, call it
      onBarcodeScanned(data);

      // Close modal after a delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      // Show error
      setScanError(true);

      // Reset after a delay
      setTimeout(() => {
        setBarcodeScanned(false);
        setScanError(false);
      }, 2000);
    }
  };

  // Get random foods from our database to simulate AI recognition
  const getRandomFoods = (count: number) => {
    const foods: Array<{ food: FoodItem; amount: number }> = [];
    const usedIndices = new Set<number>();

    while (foods.length < count && foods.length < COMMON_FOODS.length) {
      const randomIndex = Math.floor(Math.random() * COMMON_FOODS.length);

      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        const food = COMMON_FOODS[randomIndex];
        const amount = Math.round(
          parseInt(food.servingSize) * (0.7 + Math.random() * 0.6)
        ); // Random amount around serving size
        foods.push({ food, amount });
      }
    }

    return foods;
  };

  // Determine current meal type based on time of day
  const getCurrentMealType = (): MealType => {
    const hour = new Date().getHours();

    if (hour < 10) return 'breakfast';
    if (hour < 12) return 'brunch';
    if (hour < 15) return 'lunch';
    if (hour < 17) return 'pre-workout';
    if (hour < 19) return 'post-workout';
    if (hour < 22) return 'dinner';
    return 'snack';
  };

  const toggleScanMode = () => {
    setScanMode(scanMode === 'food' ? 'barcode' : 'food');
    setBarcodeScanned(false);
    setBarcodeData(null);
    setScanError(false);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (!permission) {
    // Camera permissions are still loading
    return null;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>
              Camera Permission Required
            </Text>
            <Text style={styles.permissionText}>
              We need camera access to scan your food and estimate calories.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="x" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_e', 'upc_a'],
          }}
          onBarcodeScanned={
            scanMode === 'barcode' && !barcodeScanned
              ? handleBarCodeScanned
              : undefined
          }
        />

        {/* Overlay positioned absolutely on top of camera */}
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.modeButton}
              onPress={toggleScanMode}
            >
              {scanMode === 'food' ? (
                <MaterialIcon name="qr-code" size={24} color={colors.white} />
              ) : (
                <Icon name="camera" size={24} color={colors.white} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="x" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.scanFrame,
              scanMode === 'barcode' && styles.barcodeScanFrame,
            ]}
          >
            {isScanning && (
              <View style={styles.scanningOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.scanningText}>Analyzing food...</Text>
              </View>
            )}

            {scanComplete && (
              <View style={styles.scanCompleteOverlay}>
                <Text style={styles.scanCompleteText}>Food identified!</Text>
              </View>
            )}

            {barcodeScanned && barcodeData && (
              <View style={styles.scanCompleteOverlay}>
                <Text style={styles.scanCompleteText}>Barcode scanned!</Text>
                <Text style={styles.barcodeText}>{barcodeData}</Text>
              </View>
            )}

            {scanError && (
              <View style={styles.scanErrorOverlay}>
                <Text style={styles.scanErrorText}>
                  {scanMode === 'barcode'
                    ? 'Barcode not found in database'
                    : "Couldn't identify food"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionTitle}>
                {scanMode === 'food'
                  ? 'For best food recognition:'
                  : 'For barcode scanning:'}
              </Text>
              {scanMode === 'food' ? (
                <Text style={styles.instructionText}>
                  • Make sure food is clearly visible{'\n'}• Include the entire
                  plate/bowl{'\n'}• Good lighting helps accuracy{'\n'}• Scan one
                  meal at a time{'\n'}• Position camera to see food density
                </Text>
              ) : (
                <Text style={styles.instructionText}>
                  • Hold camera steady{'\n'}• Ensure barcode is well-lit{'\n'}•
                  Position barcode in the center{'\n'}• Works with UPC, EAN, and
                  other standard barcodes
                </Text>
              )}
            </View>

            {!isScanning &&
              !scanComplete &&
              !barcodeScanned &&
              scanMode === 'food' && (
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleCapture}
                >
                  <Icon name="camera" size={28} color={colors.white} />
                </TouchableOpacity>
              )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    alignSelf: 'center',
    width: '80%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  barcodeScanFrame: {
    aspectRatio: 2,
    borderRadius: 8,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  scanCompleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(39,174,96,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanCompleteText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  barcodeText: {
    color: colors.white,
    fontSize: 16,
  },
  scanErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(231,76,60,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scanErrorText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  instructionContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  instructionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    color: colors.lighterGray,
    fontSize: 14,
    lineHeight: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.dark,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: colors.lighterGray,
    marginBottom: 24,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
