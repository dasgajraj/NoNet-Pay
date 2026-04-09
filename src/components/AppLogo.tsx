import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const appIcon = require('../assets/app-icon.png');

interface AppLogoProps {
  compact?: boolean;
}

const AppLogo: React.FC<AppLogoProps> = ({ compact = false }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.mark,
          compact ? styles.markCompact : styles.markRegular,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Image
          source={appIcon}
          style={compact ? styles.iconCompact : styles.iconRegular}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <View>
        <Text style={[styles.title, compact ? styles.titleCompact : styles.titleRegular, { color: theme.colors.text }]}>
          NoNet Pay
        </Text>
        {!compact ? (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Offline UPI over USSD
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  markCompact: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  markRegular: {
    width: 58,
    height: 58,
    borderRadius: 18,
  },
  iconCompact: {
    width: 28,
    height: 28,
  },
  iconRegular: {
    width: 40,
    height: 40,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  titleCompact: {
    fontSize: 18,
  },
  titleRegular: {
    fontSize: 24,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AppLogo;
