import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { MiniPlayer, useTheme } from '../../components';
import { useAudioStore } from '../../stores/useAudioStore';
import { TAB_BAR_HEIGHT } from '../../utils/constants';

const TabBarIcon = ({ name, focused, color }: { name: string; focused: boolean; color: string }) => {
  const icons: Record<string, string> = {
    home: '🏠',
    library: '📚',
    playlists: '🎶',
    player: '🎧',
  };

  return (
    <Animated.Text
      entering={FadeIn.duration(200)}
      style={{ fontSize: focused ? 26 : 24, opacity: focused ? 1 : 0.6 }}
    >
      {icons[name] || '🎵'}
    </Animated.Text>
  );
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme, accentColor } = useTheme();
  const { currentTrack } = useAudioStore();
  const router = useRouter();

  const handleMiniPlayerPress = useCallback(() => {
    router.push('/player');
  }, [router]);

  return (
    <View style={styles.tabBarContainer}>
      {currentTrack && (
        <MiniPlayer onExpand={handleMiniPlayerPress} />
      )}
      
      <BlurView intensity={80} tint="dark" style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
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

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              <TabBarIcon
                name={route.name}
                focused={isFocused}
                color={isFocused ? accentColor : theme.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? accentColor : theme.textSecondary },
                ]}
              >
                {label}
              </Text>
              {isFocused && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={[styles.indicator, { backgroundColor: accentColor }]}
                />
              )}
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  const { theme, accentColor } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: TAB_BAR_HEIGHT,
        },
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarLabel: 'Library',
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: 'Playlists',
          tabBarLabel: 'Playlists',
        }}
      />
      <Tabs.Screen
        name="player"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="equalizer"
        options={{
          title: 'EQ',
          tabBarLabel: 'EQ',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarLabel: 'More',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
});
