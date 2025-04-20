import { Tabs } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#32CD32',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: '#1E1E1E',
            borderTopWidth: 1,
            borderTopColor: '#333',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerStyle: {
            backgroundColor: '#1E1E1E',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#fff',
          },
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <FontAwesome name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="delivery-navigation"
          options={{
            title: 'Navigation',
            tabBarIcon: ({ color }) => (
              <Ionicons name="navigate" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="delivery/[id]"
          options={{
            title: 'Delivery',
            tabBarIcon: ({ color }) => (
              <Ionicons name="bicycle" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => (
              <FontAwesome name="user" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
  );
}
