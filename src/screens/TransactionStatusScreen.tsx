import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import { useUssdSession } from '../context/UssdSessionContext';

type TransactionStatusRouteProp = RouteProp<RootStackParamList, 'TransactionStatus'>;
type TransactionStatusNavigationProp = StackNavigationProp<RootStackParamList, 'TransactionStatus'>;

const TransactionStatusScreen: React.FC = () => {
  const route = useRoute<TransactionStatusRouteProp>();
  const navigation = useNavigation<TransactionStatusNavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { attempts } = useUssdSession();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const attempt = attempts.find(item => item.id === route.params.attemptId) ?? null;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const isSuccess = attempt?.status === 'success';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.content, { paddingTop: insets.top + 28, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              backgroundColor: theme.colors.cardElevated,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: isSuccess ? theme.colors.successContainer : theme.colors.warningContainer,
              },
            ]}
          >
            <Icon
              name={isSuccess ? 'check-decagram' : 'alert-circle-outline'}
              size={54}
              color={isSuccess ? theme.colors.success : theme.colors.warning}
            />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            {isSuccess ? 'Payment successful' : 'Transaction update'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {attempt?.verificationSummary ?? 'The latest USSD result is shown below.'}
          </Text>

          <View style={[styles.detailsCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Name</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {attempt?.parsedTransaction?.name ?? attempt?.recipientValue ?? 'Unknown'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Amount</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {attempt?.parsedTransaction?.amount ? `Rs.${attempt.parsedTransaction.amount}` : attempt?.amount ? `Rs.${attempt.amount}` : 'Pending'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Ref ID</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {attempt?.parsedTransaction?.referenceId ?? 'Not available'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Status</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {attempt?.status ?? 'Unknown'}
              </Text>
            </View>
          </View>

          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {attempt?.verificationDetail ?? 'No additional detail available.'}
          </Text>
        </Animated.View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.cardElevated }]}
            onPress={() => navigation.navigate('SendMoney', {})}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Send again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={[styles.primaryButtonText, { color: theme.colors.buttonText }]}>Back to home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  hero: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 24,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
    elevation: 10,
  },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 22,
  },
  detailsCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  actionRow: {
    gap: 12,
  },
  primaryButton: {
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
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
    fontSize: 15,
    fontWeight: '700',
  },
});

export default TransactionStatusScreen;
