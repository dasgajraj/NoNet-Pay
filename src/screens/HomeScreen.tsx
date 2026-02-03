import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { styles, colors } from '../constants/styles';
import { USSD_CODES } from '../services/ussdService';
import { NavigationProps, UssdServiceProps } from '../types';

interface HomeScreenProps extends NavigationProps, UssdServiceProps {}

const HomeScreen: React.FC<HomeScreenProps> = ({
  setCurrentScreen,
  dialUssd,
  loading,
}) => {
  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offline UPI</Text>
        <Text style={styles.headerSubtitle}>Powered by USSD *99#</Text>
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setCurrentScreen('send')}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.success }]}>
            <Text style={styles.menuIconText}>↑</Text>
          </View>
          <Text style={styles.menuText}>Send Money</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setCurrentScreen('request')}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.info }]}>
            <Text style={styles.menuIconText}>↓</Text>
          </View>
          <Text style={styles.menuText}>Request Money</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => dialUssd(USSD_CODES.CHECK_BALANCE)}
          disabled={loading}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.warning }]}>
            <Text style={styles.menuIconText}>💰</Text>
          </View>
          <Text style={styles.menuText}>Check Balance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => dialUssd(USSD_CODES.TRANSACTIONS)}
          disabled={loading}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.danger }]}>
            <Text style={styles.menuIconText}>📋</Text>
          </View>
          <Text style={styles.menuText}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => dialUssd(USSD_CODES.PENDING_REQUESTS)}
          disabled={loading}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.purple }]}>
            <Text style={styles.menuIconText}>⏳</Text>
          </View>
          <Text style={styles.menuText}>Pending Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => dialUssd(USSD_CODES.PROFILE)}
          disabled={loading}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.pink }]}>
            <Text style={styles.menuIconText}>👤</Text>
          </View>
          <Text style={styles.menuText}>My Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => dialUssd(USSD_CODES.UPI_PIN)}
          disabled={loading}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.cyan }]}>
            <Text style={styles.menuIconText}>🔐</Text>
          </View>
          <Text style={styles.menuText}>UPI PIN</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure offline UPI transactions</Text>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
