import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, Image, useWindowDimensions, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const GREEN = '#1B4332';

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyCart = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    return (
        <View style={emptyStyle.wrap}>
            <Text style={emptyStyle.title}>Your cart is empty</Text>
            <TouchableOpacity
                style={emptyStyle.btn}
                onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
            >
                <Text style={emptyStyle.btnText}>Continue shopping</Text>
            </TouchableOpacity>
            {!user && (
                <View style={emptyStyle.loginRow}>
                    <Text style={emptyStyle.loginHint}>Have an account?{'\n'}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={emptyStyle.loginLink}>Log in</Text>
                    </TouchableOpacity>
                    <Text style={emptyStyle.loginHint}> to check out faster.</Text>
                </View>
            )}
        </View>
    );
};
const emptyStyle = StyleSheet.create({
    wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.padding },
    title: { fontSize: 28, fontWeight: '700', color: COLORS.black, marginBottom: 20 },
    btn: { backgroundColor: GREEN, borderRadius: 6, paddingHorizontal: 28, paddingVertical: 14, marginBottom: 20 },
    btnText: { color: COLORS.white, fontWeight: '700', fontSize: SIZES.font },
    loginRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
    loginHint: { fontSize: SIZES.font, color: COLORS.gray },
    loginLink: { fontSize: SIZES.font, color: GREEN, fontWeight: '700', textDecorationLine: 'underline' },
});

// ── Cart row (one product) ────────────────────────────────────────────────────
const CartRow = ({ item }) => {
    const { updateQty, removeItem } = useCart();
    const rowTotal = (item.price ?? 0) * item.qty;
    const displayImage = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.image;

    return (
        <View style={rowStyle.row}>
            {/* Product image */}
            <View style={rowStyle.imgWrap}>
                {displayImage
                    ? <Image source={{ uri: displayImage }} style={rowStyle.img} resizeMode="contain" />
                    : <Text style={rowStyle.emoji}>{item.emoji ?? '🛒'}</Text>
                }
            </View>

            {/* Name + unit */}
            <View style={rowStyle.nameCol}>
                <Text style={rowStyle.name} numberOfLines={2}>{item.name}</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 3 }}>
                    {item.unit ? <Text style={rowStyle.unit}>{item.unit}</Text> : null}
                    {(item.stock !== undefined && item.stock !== null) && item.qty >= item.stock && (
                        <Text style={rowStyle.stockWarn}>Max Stock Reached</Text>
                    )}
                </View>
            </View>

            {/* Unit price */}
            <Text style={rowStyle.cell}>₹ {(item.price ?? 0).toFixed(2)}</Text>

            {/* Quantity stepper */}
            <View style={rowStyle.stepper}>
                <Text style={rowStyle.stepperVal}>{item.qty}</Text>
                <View style={rowStyle.stepperBtns}>
                    <TouchableOpacity 
                        style={rowStyle.stepBtn} 
                        onPress={() => updateQty(item.id, 1)}
                        disabled={(item.stock !== undefined && item.stock !== null) && item.qty >= item.stock}
                    >
                        <Text style={[rowStyle.stepBtnText, (item.stock !== undefined && item.stock !== null) && item.qty >= item.stock && { color: '#ccc' }]}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={rowStyle.stepBtn} onPress={() => updateQty(item.id, -1)}>
                        <Text style={rowStyle.stepBtnText}>▼</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Row total */}
            <Text style={[rowStyle.cell, rowStyle.totalCell]}>₹ {rowTotal.toFixed(2)}</Text>

            {/* Remove */}
            <TouchableOpacity style={rowStyle.removeBtn} onPress={() => removeItem(item.id)}>
                <Text style={rowStyle.removeIcon}>🗑</Text>
            </TouchableOpacity>
        </View>
    );
};
const rowStyle = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 12 },
    imgWrap: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#F7F7F7', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    img: { width: 72, height: 72 },
    emoji: { fontSize: 36 },
    nameCol: { flex: 1, minWidth: 100 },
    name: { fontSize: SIZES.font, fontWeight: '600', color: COLORS.black },
    unit: { fontSize: 12, color: COLORS.gray, marginTop: 3 },
    cell: { width: 90, textAlign: 'right', fontSize: SIZES.font, color: COLORS.black },
    totalCell: { fontWeight: '600' },
    stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 4, overflow: 'hidden', height: 36 },
    stepperVal: { width: 36, textAlign: 'center', fontSize: SIZES.font, fontWeight: '600', color: COLORS.black },
    stepperBtns: { flexDirection: 'column' },
    stepBtn: { width: 24, height: 18, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#D0D0D0' },
    stepBtnText: { fontSize: 8, color: COLORS.black },
    removeBtn: { width: 36, alignItems: 'center' },
    removeIcon: { fontSize: 16, color: COLORS.gray },
    stockWarn: { fontSize: 10, color: '#C0392B', fontWeight: '700' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const CartScreen = () => {
    const navigation = useNavigation();
    const { items, subtotal } = useCart();
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isWide = Platform.OS === 'web' && width >= 768;

    const handleCheckout = () => {
        if (!user) {
            navigation.navigate('Login', { redirectTo: 'Checkout' });
        } else {
            navigation.navigate('Checkout');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header />
            {items.length === 0 ? (
                <EmptyCart />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={[styles.body, isWide && styles.bodyWide]}>

                        {/* ── Left: table ── */}
                        <View style={[styles.tableWrap, isWide && styles.tableWideWrap]}>

                            {/* Table header */}
                            <View style={styles.tableHeader}>
                                <Text style={[styles.th, { flex: 1 }]}>Product</Text>
                                <Text style={[styles.th, styles.thRight, { width: 90 }]}>Unit Price</Text>
                                <Text style={[styles.th, styles.thRight, { width: 80 }]}>Quantity</Text>
                                <Text style={[styles.th, styles.thRight, { width: 90 }]}>Total</Text>
                                <Text style={[styles.th, styles.thRight, { width: 36 }]}>Remove</Text>
                            </View>

                            {/* Rows */}
                            {items.map((item) => <CartRow key={item.id} item={item} />)}
                        </View>

                        {/* ── Right: summary ── */}
                        <View style={[styles.summary, isWide && styles.summaryWide]}>
                            <View style={styles.summaryInner}>
                                <View style={styles.subtotalRow}>
                                    <Text style={styles.subtotalLabel}>Subtotal:</Text>
                                    <Text style={styles.subtotalValue}>₹ {subtotal.toFixed(2)}</Text>
                                </View>
                                <Text style={styles.taxNote}>Tax included. <Text style={styles.shippingLink}>Shipping</Text> calculated at checkout.</Text>
                                <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                                    <Text style={styles.checkoutText}>Proceed To CheckOut  →</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Continue shopping */}
                    <TouchableOpacity
                        style={styles.continueBtn}
                        onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
                    >
                        <Text style={styles.continueBtnText}>← Continue shopping</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* Scroll-to-top FAB (matches reference image ↑ button) */}
            {items.length > 0 && (
                <TouchableOpacity style={styles.fab}>
                    <Text style={styles.fabText}>↑</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    scroll: { padding: SIZES.padding, paddingBottom: 40 },
    body: { flexDirection: 'column', gap: 20 },
    bodyWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },

    /* Table */
    tableWrap: { flex: 1 },
    tableWideWrap: { flex: 2 },
    tableHeader: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F3F3F3', borderRadius: 6,
        paddingHorizontal: 12, paddingVertical: 12, marginBottom: 4,
    },
    th: { fontSize: 13, fontWeight: '600', color: COLORS.black },
    thRight: { textAlign: 'right' },

    /* Summary panel */
    summary: { marginTop: 8 },
    summaryWide: { flex: 1, maxWidth: 340 },
    summaryInner: {
        borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 10,
        padding: 20, backgroundColor: COLORS.white,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    subtotalLabel: { fontSize: SIZES.font, color: COLORS.gray },
    subtotalValue: { fontSize: SIZES.large, fontWeight: '700', color: COLORS.black },
    taxNote: { fontSize: 11, color: COLORS.gray, marginBottom: 16, lineHeight: 16 },
    shippingLink: { color: '#1B4332', fontWeight: '700', textDecorationLine: 'underline' },
    checkoutBtn: {
        backgroundColor: GREEN, borderRadius: 6,
        paddingVertical: 14, alignItems: 'center',
    },
    checkoutText: { color: COLORS.white, fontWeight: '700', fontSize: SIZES.font },

    /* Continue shopping */
    continueBtn: {
        marginTop: 28, alignSelf: 'flex-start',
        backgroundColor: GREEN, borderRadius: 6,
        paddingHorizontal: 20, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center',
    },
    continueBtnText: { color: COLORS.white, fontWeight: '700', fontSize: SIZES.font },

    /* FAB */
    fab: {
        position: 'absolute', bottom: 24, right: 24,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
    },
    fabText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
});

export default CartScreen;
