import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, PermissionsAndroid, ScrollView, StatusBar } from 'react-native';
import { dialUssdWithIntent } from './src/UssdModule';

type Screen = 'home' | 'send' | 'request';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Send Money states
  const [sendMobile, setSendMobile] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  
  // Request Money states
  const [requestUpiId, setRequestUpiId] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  


  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE
      ]);
    } catch (err) {
      console.log("Permission Error:", err);
    }
  };

  const dialUssd = async (code: string) => {
    try {
      setLoading(true);
      await dialUssdWithIntent(code);
      setLoading(false);
      Alert.alert("USSD Dialed", "Please complete the transaction on the phone dialer screen.");
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to dial USSD: " + (error?.message || "Unknown error"));
    }
  };

  const HomeScreen = useMemo(() => () => (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor="#5f4dee" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offline UPI</Text>
        <Text style={styles.headerSubtitle}>Powered by USSD *99#</Text>
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentScreen('send')}>
          <View style={[styles.menuIcon, { backgroundColor: '#22c55e' }]}>
            <Text style={styles.menuIconText}>↑</Text>
          </View>
          <Text style={styles.menuText}>Send Money</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentScreen('request')}>
          <View style={[styles.menuIcon, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.menuIconText}>↓</Text>
          </View>
          <Text style={styles.menuText}>Request Money</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => dialUssd('*99*3#')} disabled={loading}>
          <View style={[styles.menuIcon, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.menuIconText}>💰</Text>
          </View>
          <Text style={styles.menuText}>Check Balance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => dialUssd('*99*6*1#')} disabled={loading}>
          <View style={[styles.menuIcon, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.menuIconText}>📋</Text>
          </View>
          <Text style={styles.menuText}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => dialUssd('*99*5#')} disabled={loading}>
          <View style={[styles.menuIcon, { backgroundColor: '#8b5cf6' }]}>
            <Text style={styles.menuIconText}>⏳</Text>
          </View>
          <Text style={styles.menuText}>Pending Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => dialUssd('*99*4#')} disabled={loading}>
          <View style={[styles.menuIcon, { backgroundColor: '#ec4899' }]}>
            <Text style={styles.menuIconText}>👤</Text>
          </View>
          <Text style={styles.menuText}>My Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => dialUssd('*99*7#')} disabled={loading}>
          <View style={[styles.menuIcon, { backgroundColor: '#06b6d4' }]}>
            <Text style={styles.menuIconText}>🔐</Text>
          </View>
          <Text style={styles.menuText}>UPI PIN</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure offline UPI transactions</Text>
      </View>
    </ScrollView>
  ), [loading]);

  const SendMoneyScreen = useMemo(() => () => (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Send Money</Text>
      </View>

      <ScrollView style={styles.formCard}>
        <Text style={styles.inputLabel}>Mobile Number</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Enter Mobile Number"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          maxLength={10}
          value={sendMobile}
          onChangeText={setSendMobile}
        />

        <Text style={styles.inputLabel}>Amount (₹)</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Enter amount"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={sendAmount}
          onChangeText={setSendAmount}
        />

        <Text style={styles.sectionTitle}>Choose Payment Method</Text>

        <TouchableOpacity 
          style={[styles.primaryButton, (!sendMobile || !sendAmount) && styles.disabledButton]} 
          onPress={() => dialUssd(`*99*1*1*${sendMobile}*${sendAmount}#`)}
          disabled={!sendMobile || !sendAmount || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>📱 Send via Mobile Number</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.secondaryButton, (!sendMobile || !sendAmount) && styles.disabledButton]} 
          onPress={() => dialUssd('*99*1*3#')}
          disabled={!sendMobile || !sendAmount || loading}
        >
          {loading ? <ActivityIndicator color="#5f4dee" /> : <Text style={styles.secondaryButtonText}>🆔 Send via UPI ID</Text>}
        </TouchableOpacity>

        <Text style={styles.helperText}>Opens respective payment option directly</Text>
      </ScrollView>
    </View>
  ), [sendMobile, sendAmount, loading]);

  const RequestMoneyScreen = useMemo(() => () => (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Request Money</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>UPI ID / Mobile Number</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Enter UPI ID or Phone"
          placeholderTextColor="#999"
          value={requestUpiId}
          onChangeText={setRequestUpiId}
        />

        <Text style={styles.inputLabel}>Amount (₹)</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Enter amount"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={requestAmount}
          onChangeText={setRequestAmount}
        />

        <TouchableOpacity 
          style={[styles.primaryButton, (!requestUpiId || !requestAmount) && styles.disabledButton]} 
          onPress={() => dialUssd('*99*2#')}
          disabled={!requestUpiId || !requestAmount || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Send Request</Text>}
        </TouchableOpacity>

        <Text style={styles.helperText}>Opens Request Money option directly</Text>
      </View>
    </View>
  ), [requestUpiId, requestAmount, loading]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home': return <HomeScreen />;
      case 'send': return <SendMoneyScreen />;
      case 'request': return <RequestMoneyScreen />;
      default: return <HomeScreen />;
    }
  };

  return renderScreen();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#5f4dee',
    padding: 30,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 5,
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  checkBalanceBtn: {
    backgroundColor: '#5f4dee',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkBalanceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  menuIconText: {
    fontSize: 24,
    color: '#fff',
  },
  menuText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  screenHeader: {
    backgroundColor: '#5f4dee',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginRight: 15,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  formCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 15,
    fontWeight: '600',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  primaryButton: {
    backgroundColor: '#5f4dee',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#5f4dee',
  },
  secondaryButtonText: {
    color: '#5f4dee',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333',
    marginTop: 25,
    marginBottom: 5,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  helperText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
  },
  balanceInfo: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#5f4dee',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  profileAvatarText: {
    fontSize: 50,
  },
});

export default App;