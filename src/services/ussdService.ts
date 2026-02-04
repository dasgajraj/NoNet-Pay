import { Alert, PermissionsAndroid, Clipboard, ToastAndroid } from 'react-native';
import { dialUssdWithIntent } from '../UssdModule';

export const requestPermissions = async (): Promise<void> => {
  try {
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      PermissionsAndroid.PERMISSIONS.CALL_PHONE,
    ]);
  } catch (err) {
    console.log('Permission Error:', err);
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dialUssd = async (
  code: string,
  setLoading: (loading: boolean) => void,
  dataToCopy?: string
): Promise<void> => {
  try {
    setLoading(true);
    
    // Copy data to clipboard if provided
    if (dataToCopy) {
      await Clipboard.setString(dataToCopy);
      
      // Show toast notification
      ToastAndroid.show(
        `✅ Copied: ${dataToCopy} - Just paste it!`,
        ToastAndroid.LONG
      );
      
      // Wait 500ms before opening USSD
      await delay(500);
    }
    
    await dialUssdWithIntent(code);
    setLoading(false);
  } catch (error: any) {
    setLoading(false);
    Alert.alert(
      'Error',
      'Failed to dial USSD: ' + (error?.message || 'Unknown error')
    );
  }
};

export const USSD_CODES = {
  CHECK_BALANCE: '*99*3#',
  TRANSACTIONS: '*99*6*1#',
  PENDING_REQUESTS: '*99*5#',
  PROFILE: '*99*4#',
  UPI_PIN: '*99*7#',
  REQUEST_MONEY: '*99*2#',
  SEND_VIA_MOBILE: (mobile: string, amount: string) => `*99*1*1*${mobile}*${amount}#`,
  SEND_VIA_UPI: '*99*1*3#',
};
