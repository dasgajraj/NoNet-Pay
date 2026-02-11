import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface CustomBottomTabProps {
  state: any;
  descriptors: any;
  navigation: any;
  onScanPress: () => void;
}

const CustomBottomTab: React.FC<CustomBottomTabProps> = ({
  state,
  descriptors,
  navigation,
  onScanPress,
}) => {
  const { theme } = useTheme();

  const getIconName = (routeName: string, isFocused: boolean) => {
    switch (routeName) {
      case 'Home':
        return isFocused ? 'home' : 'home-outline';
      case 'SendMoney':
        return isFocused ? 'send' : 'send-outline';
      case 'RequestMoney':
        return isFocused ? 'cash-multiple' : 'cash-multiple';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface + 'E6',
          borderTopColor: 'transparent',
        },
      ]}
    >
      {/* Center Notch/Cutout Background */}
      <View style={[styles.notchContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.notch, { backgroundColor: theme.colors.surface + 'E6' }]} />
      </View>
      
      <View style={styles.tabContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

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

          // Skip middle item for scan button
          if (index === 1) {
            return (
              <View key={route.key} style={styles.tabItem}>
                <View style={styles.placeholder} />
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && {
                    backgroundColor: theme.colors.primary + '30',
                    borderRadius: 16,
                  },
                ]}
              >
                <Icon
                  name={getIconName(route.name, isFocused)}
                  size={26}
                  color={
                    isFocused ? theme.colors.primary : theme.colors.textSecondary
                  }
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Floating Action Button for QR Scan with Background Circle */}
      <View style={styles.fabContainer}>
        <View style={[styles.fabBackground, { backgroundColor: theme.colors.background }]} />
        <View style={[styles.fabRing, { borderColor: theme.colors.surface + 'E6' }]} />
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
            },
          ]}
          onPress={onScanPress}
          activeOpacity={0.8}
        >
          <Icon name="qrcode-scan" size={36} color={theme.colors.buttonText} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    borderTopWidth: 0,
    borderRadius: 24,
    paddingTop: 5,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    elevation: 12,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    height: 65,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    padding: 12,
  },
  placeholder: {
    width: 80,
    height: 80,
  },
  notchContainer: {
    position: 'absolute',
    top: -10,
    left: width / 2 - 50,
    width: 100,
    height: 25,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  notch: {
    position: 'absolute',
    bottom: 0,
    left: 5,
    width: 90,
    height: 20,
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
  },
  fabContainer: {
    position: 'absolute',
    width: 90,
    height: 90,
    left: width / 2 - 45,
    top: -45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBackground: {
    position: 'absolute',
    width: 85,
    height: 85,
    borderRadius: 42.5,
    top: 2.5,
    elevation: 0,
  },
  fabRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
  },
  fab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
});

export default CustomBottomTab;
