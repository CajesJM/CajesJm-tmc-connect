import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

export default function AdminTabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            height: 70,
            marginHorizontal: 16,
            marginBottom: 16,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: '#e2e8f0',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 6,
          },
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 0,
          },
          tabBarItemStyle: {
            borderRadius: 12,
            marginHorizontal: 2,
            marginVertical: 4,
            height: 50,
          },
        }}
      >
        <Tabs.Screen
          name="announcements"
          options={{
            title: 'Announcements',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{
                backgroundColor: focused ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                padding: 6,
                borderRadius: 10,
                borderWidth: focused ? 1 : 0,
                borderColor: focused ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
              }}>
                <Ionicons 
                  name={focused ? "megaphone" : "megaphone-outline"} 
                  size={20} 
                  color={focused ? '#6366f1' : color} 
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{
                backgroundColor: focused ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                padding: 6,
                borderRadius: 10,
                borderWidth: focused ? 1 : 0,
                borderColor: focused ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
              }}>
                <Ionicons 
                  name={focused ? "calendar" : "calendar-outline"} 
                  size={20} 
                  color={focused ? '#6366f1' : color} 
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'Attendance',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{
                backgroundColor: focused ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                padding: 6,
                borderRadius: 10,
                borderWidth: focused ? 1 : 0,
                borderColor: focused ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
              }}>
                <Ionicons 
                  name={focused ? "people" : "people-outline"} 
                  size={20} 
                  color={focused ? '#6366f1' : color} 
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{
                backgroundColor: focused ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                padding: 6,
                borderRadius: 10,
                borderWidth: focused ? 1 : 0,
                borderColor: focused ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
              }}>
                <Ionicons 
                  name={focused ? "person" : "person-outline"} 
                  size={20} 
                  color={focused ? '#6366f1' : color} 
                />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}