import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, useWindowDimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Header = () => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const { user } = useAuth();
    const { itemCount } = useCart();

    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                {/* Logo — taps to Home */}
                <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}>
                    <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
                </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    placeholder="Search products..."
                    style={styles.searchInput}
                    placeholderTextColor={COLORS.gray}
                    onFocus={() => navigation.navigate('Search', { query: '' })}
                    onSubmitEditing={(e) => navigation.navigate('Search', { query: e.nativeEvent.text })}
                    returnKeyType="search"
                />
            </View>

            {/* Desktop nav icons — Subscription → Cart → Profile */}
            {Platform.OS === 'web' && width >= 768 && (
                <View style={styles.navIcons}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Tabs', { screen: 'Subscription' })}>
                        <Text style={styles.iconText}>📅</Text>
                        <Text style={styles.navText}>Subscription</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Tabs', { screen: 'Cart' })}>
                        <View style={styles.cartWrap}>
                            <Text style={styles.iconText}>🛒</Text>
                            {itemCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.navText}>Cart</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => user ? navigation.navigate('Tabs', { screen: 'Profile' }) : navigation.navigate('Login')}
                    >
                        <Text style={styles.iconText}>👤</Text>
                        {user
                            ? <Text style={[styles.navText, styles.hiText]}>Hi, {user.firstName}</Text>
                            : <Text style={styles.navText}>Profile</Text>
                        }
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.small,
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    logoImage: {
        height: 36,
        width: 140,
        resizeMode: 'contain',
        marginRight: SIZES.small,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 4,
        paddingHorizontal: SIZES.small,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#7f9f8c',
        marginRight: SIZES.small,
    },
    searchInput: {
        flex: 1,
        fontSize: SIZES.font,
        color: COLORS.black,
    },
    navIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        marginLeft: SIZES.small,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 56,
    },
    iconText: { fontSize: 20 },
    navText: { fontSize: 10, color: COLORS.black },
    hiText: { fontSize: 10, color: '#1B4332', fontWeight: '700' },
    cartWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
    badge: {
        position: 'absolute', top: -4, right: -8,
        backgroundColor: '#1B4332', borderRadius: 8,
        minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
    },
    badgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
});

export default Header;
