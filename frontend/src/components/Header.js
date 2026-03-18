import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, useWindowDimensions, Image, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Header = () => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const { user } = useAuth();
    const { itemCount } = useCart();
    const [showHelp, setShowHelp] = useState(false);

    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                {/* Logo — taps to Home */}
                <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Jasmine' })}>
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

            {/* nav icons */}
            <View style={styles.navIcons}>
                {Platform.OS === 'web' && width >= 768 && (
                    <>
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
                    </>
                )}

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setShowHelp(!showHelp)}
                >
                    <Text style={styles.iconText}>📞</Text>
                    <Text style={styles.navText}>Help</Text>
                </TouchableOpacity>

                {showHelp && (
                    <>
                        <TouchableOpacity 
                            style={styles.helpBackdrop} 
                            activeOpacity={1} 
                            onPress={() => setShowHelp(false)} 
                        />
                        <View style={styles.helpDropdown}>
                            <Text style={styles.helpTitle}>Contact Support</Text>
                            <TouchableOpacity 
                                style={styles.helpItem} 
                                onPress={() => { Linking.openURL('tel:+918970299890'); setShowHelp(false); }}
                            >
                                <Text style={styles.helpLabel}>📞 Call Now</Text>
                                <Text style={styles.helpValue}>+91 89702 99890</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.helpItem} 
                                onPress={() => { Linking.openURL('https://wa.me/918970299890'); setShowHelp(false); }}
                            >
                                <Text style={styles.helpLabel}>💬 WhatsApp</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
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
        zIndex: 100, // Ensure dropdown stays on top
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
        position: 'relative', // Anchor for dropdown
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
    helpDropdown: {
        position: 'absolute',
        top: 45,
        right: 0,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        width: 180,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 10,
        zIndex: 1000,
        borderWidth: 1,
        borderColor: '#eee',
    },
    helpTitle: { fontSize: 13, fontWeight: '800', color: '#1B4332', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 5 },
    helpItem: { marginBottom: 12 },
    helpLabel: { fontSize: 12, fontWeight: '700', color: COLORS.black },
    helpValue: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
    helpBackdrop: {
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        top: -100, // Cover header area
        left: -1000,
        right: -1000,
        bottom: -2000, // Cover content below
        backgroundColor: 'transparent',
        zIndex: 999,
    },
});

export default Header;
