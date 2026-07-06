import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primaryAccent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 2,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
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
        name="home"
        options={{
          title: 'KHÁM PHÁ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'SÁNG TẠO',
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={22} color="#FF3E00" />
          ),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '900',
            color: '#FF3E00',
          }
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'HỒ SƠ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
