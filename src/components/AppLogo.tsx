import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

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
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <Icon
          name="signal-distance-variant"
          size={compact ? 20 : 28}
          color={theme.colors.primary}
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
