import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import CartScreen from '../screens/CartScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import AddressScreen from '../screens/AddressScreen';
import WalletScreen from '../screens/WalletScreen';
import AdminScreen from '../screens/AdminScreen';
import { COLORS } from '../constants/theme';
import { Text, Platform, useWindowDimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ name, color }) => (
    <Text style={{ color, fontSize: 20 }}>{name}</Text>
);

// Conditionally shows ProfileScreen (logged in) or LoginScreen (guest)
const ProfileTab = () => {
    const { user } = useAuth();
    return user ? <ProfileScreen /> : <LoginScreen />;
};
// Bottom-tab navigator (Home, Subscription, Cart, Profile)
const TabNavigator = () => {
    const { width } = useWindowDimensions();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: Platform.OS === 'web' && width >= 768 ? { display: 'none' } : {},
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.gray,
                tabBarIcon: ({ color }) => {
                    const icons = {
                        Jasmine: '🌸',
                        Subscription: '📅',
                        Cart: '🛒',
                        Profile: '👤',
                    };
                    return <TabIcon name={icons[route.name]} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Jasmine" component={HomeScreen} />
            <Tab.Screen name="Subscription" component={SubscriptionScreen} />
            <Tab.Screen name="Cart" component={CartScreen} />
            <Tab.Screen name="Profile" component={ProfileTab} />
        </Tab.Navigator>
    );
};

// Root stack: tabs + SearchScreen + Login + Register (no tab bar)
const AppNavigator = () => (
    <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen
                name="Search"
                component={SearchScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="Checkout"
                component={CheckoutScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="OrderSuccess"
                component={OrderSuccessScreen}
                options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen
                name="Addresses"
                component={AddressScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="Wallet"
                component={WalletScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="Admin"
                component={AdminScreen}
                options={{ animation: 'slide_from_right' }}
            />
        </Stack.Navigator>
    </NavigationContainer>
);

export default AppNavigator;
