import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';

import { Platform } from 'react-native';

export default function TabsLayout() {
  const colors = {
    bg: '#050811',
    border: 'rgba(124, 58, 237, 0.3)',
    active: '#0ea5e9',
    inactive: '#475569',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 78,
          paddingBottom: Platform.OS === 'ios' ? 30 : 18,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="create"
        options={{
          title: 'SÁNG TẠO',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'KHÁM PHÁ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'VIP / HỒ SƠ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
