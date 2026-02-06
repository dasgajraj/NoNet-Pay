/**
 * Simple USSD Test - Using our custom native module
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  dialUssd, 
  ussdEventEmitter, 
  onUssdResponse, 
  onUssdError,
  getSimInfo,
  SimInfo 
} from '../modules/UssdNativeModule';
import { requestPermissions } from '../services/ussdService';

interface UssdMessage {
  type: 'sent' | 'received';
  message: string;
  timestamp: Date;
}

const SimpleUssdTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [simCards, setSimCards] = useState<SimInfo[]>([]);
  const [ussdHistory, setUssdHistory] = useState<UssdMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);

  useEffect(() => {
    // Request permissions
    requestPermissions();

    // Get SIM info
    loadSimInfo();

    // Setup listeners
    const responseListener = onUssdResponse((event) => {
      console.log('✅ USSD Response:', event);
      const response = event.ussdReply || 'No response';
      setLastResponse(response);
      setLoading(false);
      setIsSessionActive(true);
      
      // Add to history
      setUssdHistory(prev => [...prev, {
        type: 'received',
        message: response,
        timestamp: new Date()
      }]);
    });

    const errorListener = onUssdError((event) => {
      console.error('❌ USSD Error:', event);
      setLoading(false);
      setIsSessionActive(false);
      
      const errorMsg = event.error || 'Unknown error';
      setUssdHistory(prev => [...prev, {
        type: 'received',
        message: `❌ Error: ${errorMsg}`,
        timestamp: new Date()
      }]);
    });

    return () => {
      responseListener.remove();
      errorListener.remove();
    };
  }, []);

  const loadSimInfo = async () => {
    try {
      const sims = await getSimInfo();
      console.log('📱 SIM Cards:', sims);
      setSimCards(sims);
    } catch (error: any) {
      console.error('Failed to load SIM info:', error);
    }
  };

  const testDial = async (code: string) => {
    try {
      setLoading(true);
      setUssdHistory([]);
      setIsSessionActive(false);
      console.log(`[TEST] Dialing: ${code}`);
      console.log('[TEST] Using sendUssdRequest API - No system dialog should appear');
      
      // Add to history
      setUssdHistory([{
        type: 'sent',
        message: code,
        timestamp: new Date()
      }]);
      
      // Use our custom native module with sendUssdRequest API
      // This suppresses the system USSD dialog
      await dialUssd(code);
      
      console.log(`[TEST] Dial request sent successfully`);
    } catch (error: any) {
      console.error('[TEST] Dial failed:', error);
      setLoading(false);
      setIsSessionActive(false);
      Alert.alert('Error', error?.message || 'Failed to dial');
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      const reply = replyText.trim();
      
      // Android limitation: Interactive USSD not supported with sendUssdRequest
      // Open system dialog for user interaction instead
      Alert.alert(
        '🔐 Android Security Limitation',
        'Interactive USSD requires the system dialog.\n\n' +
        'The system USSD dialog will open where you can:\n' +
        '• See the menu\n' +
        '• Type your response: ' + reply + '\n' +
        '• Continue the session\n\n' +
        'This is required by Android for security.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Open Dialog',
            onPress: async () => {
              try {
                // Use Intent-based USSD which shows system dialog
                const { dialUssdWithIntent } = require('../modules/UssdNativeModule');
                await dialUssdWithIntent(reply);
                setReplyText('');
              } catch (error: any) {
                console.error('[TEST] Failed to open dialog:', error);
                Alert.alert('Error', 'Failed to open USSD dialog');
              }
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('[TEST] Reply failed:', error);
      Alert.alert('Error', error?.message || 'Failed to send reply');
    }
  };

  const clearHistory = () => {
    setUssdHistory([]);
    setLastResponse('');
    setIsSessionActive(false);
    setReplyText('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Custom USSD Test</Text>
        <Text style={styles.subtitle}>Using native Android USSD API</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* SIM Cards Info */}
        {simCards.length > 0 && (
          <View style={styles.simBox}>
            <Text style={styles.simTitle}>📱 Available SIM Cards:</Text>
            {simCards.map((sim) => (
              <Text key={sim.subscriptionId} style={styles.simText}>
                {sim.displayName} - {sim.carrierName}
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => testDial('*99#')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Dialing...' : 'Test *99# (UPI)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => testDial('*123#')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Dialing...' : 'Test *123# (Balance)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => testDial('*555#')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Dialing...' : 'Test *555#'}
          </Text>
        </TouchableOpacity>

        {/* USSD Conversation History */}
        {ussdHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>💬 USSD Conversation</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
            </View>
            
            {ussdHistory.map((msg, index) => (
              <View 
                key={index}
                style={[
                  styles.messageBox,
                  msg.type === 'sent' ? styles.sentMessage : styles.receivedMessage
                ]}
              >
                <Text style={styles.messageTime}>
                  {msg.timestamp.toLocaleTimeString()}
                </Text>
                <Text style={[
                  styles.messageText,
                  msg.type === 'sent' ? styles.sentText : styles.receivedText
                ]}>
                  {msg.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Reply Input - Show when session is active */}
        {isSessionActive && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyTitle}>📌 Interactive USSD Reply:</Text>
            <Text style={styles.replyNote}>
              ⚠️ Android doesn't allow in-app USSD interaction for security.{'\n'}
              When you send a reply, the system dialog will open for you to continue.
            </Text>
            <View style={styles.replyRow}>
              <TextInput
                style={styles.replyInput}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Type your reply..."
                placeholderTextColor="#999"
                keyboardType="numeric"
                returnKeyType="send"
                onSubmitEditing={sendReply}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!replyText.trim() || loading) && styles.buttonDisabled]}
                onPress={sendReply}
                disabled={!replyText.trim() || loading}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
            
            {/* Quick Reply Buttons */}
            <View style={styles.quickReplyContainer}>
              <Text style={styles.quickReplyLabel}>Quick replies:</Text>
              <View style={styles.quickReplyRow}>
                {['1', '2', '3', '4', '5', '0'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.quickReplyButton}
                    onPress={() => setReplyText(num)}
                  >
                    <Text style={styles.quickReplyText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ✓ Using custom native module{'\n'}
            ✓ Android TelephonyManager.sendUssdRequest{'\n'}
            ✓ No system USSD dialog (responses in-app){'\n'}
            ✓ Direct callback handling{'\n'}
            ℹ️ If you see a dialog, try restarting the app
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 5,
  },
  historyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    color: '#5f4dee',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: '85%',
  },
  sentMessage: {
    backgroundColor: '#5f4dee',
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sentText: {
    color: '#fff',
  },
  receivedText: {
    color: '#333',
  },
  replyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#5f4dee',
  },
  replyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  replyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sendButton: {
    backgroundColor: '#5f4dee',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickReplyContainer: {
    marginTop: 15,
  },
  quickReplyLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  quickReplyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReplyButton: {
    backgroundColor: '#e8e8e8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  quickReplyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  button: {
    backgroundColor: '#5f4dee',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  responseBox: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  infoText: {
    fontSize: 13,
    color: '#e65100',
    lineHeight: 22,
  },
  simBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  simTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 8,
  },
  simText: {
    fontSize: 13,
    color: '#0d47a1',
    marginTop: 4,
  },
});

export default SimpleUssdTest;
