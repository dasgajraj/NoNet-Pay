import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface CustomBottomTabProps {
  state: any;
  descriptors: any;
  navigation: any;
  onScanPress: () => void;
}

const routeMeta: Record<string, { icon: string; activeIcon: string; label: string }> = {
  Home: { icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  SendMoney: { icon: 'send-outline', activeIcon: 'send', label: 'Send' },
  RequestMoney: { icon: 'cash-plus', activeIcon: 'cash-plus', label: 'Request' },
};

const CustomBottomTab: React.FC<CustomBottomTabProps> = ({
  state,
  descriptors,
  navigation,
  onScanPress,
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 12),
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.tabBar,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const meta = routeMeta[route.name] ?? routeMeta.Home;
          const tabPillStyle = {
            backgroundColor: isFocused ? theme.colors.primaryContainer : 'transparent',
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              activeOpacity={0.9}
              style={styles.tabItem}
            >
              <View
                style={[styles.tabPill, tabPillStyle]}
              >
                <Icon
                  name={isFocused ? meta.activeIcon : meta.icon}
                  size={20}
                  color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? theme.colors.primary : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {meta.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[
          styles.scanButton,
          {
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.shadow,
          },
        ]}
        onPress={onScanPress}
        activeOpacity={0.92}
      >
        <Icon name="qrcode-scan" size={22} color={theme.colors.buttonText} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  container: {
    height: 74,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabPill: {
    minWidth: 82,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  scanButton: {
    position: 'absolute',
    alignSelf: 'center',
    top: -22,
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
});

export default CustomBottomTab;
