import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchUserOrders, getWalletBalance } from '../services/api';

const STATUS_COLOR = {
    'Delivered': { bg: '#E8F5E9', text: '#2E7D32' },
    'Out for Delivery': { bg: '#FFF8E1', text: '#F57F17' },
    'Processing': { bg: '#E3F2FD', text: '#1565C0' },
    'Cancelled': { bg: '#FFEBEE', text: '#C62828' },
    'placed': { bg: '#E8F5E9', text: '#2E7D32' },
    'failed': { bg: '#FFEBEE', text: '#C62828' },
    'pending': { bg: '#FFF8E1', text: '#F57F17' },
};
 
const isUrl = (s) => typeof s === 'string' && (s.startsWith('http') || s.startsWith('/'));

// ── Sub-components ────────────────────────────────────────────────────────────

const InfoRow = ({ icon, label, value }) => (
    <View style={infoStyle.row}>
        <Text style={infoStyle.icon}>{icon}</Text>
        <View style={{ flex: 1 }}>
            <Text style={infoStyle.label}>{label}</Text>
            <Text style={infoStyle.value}>{value}</Text>
        </View>
    </View>
);
const infoStyle = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    icon: { fontSize: 18, marginRight: 10, marginTop: 2 },
    label: { fontSize: 11, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
    value: { fontSize: SIZES.font, color: COLORS.black, fontWeight: '500', marginTop: 1 },
});

const OrderCard = ({ order }) => {
    const [expanded, setExpanded] = useState(false);
    const sc = STATUS_COLOR[order.status] || STATUS_COLOR['Processing'];
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    }) : '';
    const isSubscriptionOrder = order.source === 'subscription';
    const isFailed = order.status === 'failed';

    // Normalise items — subscription orders use {productName, quantity, price, productImage}
    // regular orders use {name, qty, price, image}
    const items = (order.items || []).map(it => ({
        name: it.name ?? it.productName ?? '',
        qty: it.qty ?? it.quantity ?? 1,
        price: it.price ?? 0,
        image: it.image ?? it.productImage ?? '🛍',
        unit: it.unit ?? '',
    }));
    const total = order.total ?? order.totalAmount ?? 0;

    return (
        <TouchableOpacity style={[orderStyle.card, isFailed && orderStyle.cardFailed]} onPress={() => setExpanded(e => !e)} activeOpacity={0.85}>
            {/* Subscription tag */}
            {isSubscriptionOrder && (
                <View style={orderStyle.subTag}>
                    <Text style={orderStyle.subTagTxt}>📅 Subscription Order</Text>
                </View>
            )}

            {/* Card header */}
            <View style={orderStyle.cardHeader}>
                <View>
                    <Text style={orderStyle.orderId}>Order #{order.id?.slice(0, 8).toUpperCase()}</Text>
                    <Text style={orderStyle.orderDate}>{dateStr}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <View style={[orderStyle.badge, { backgroundColor: sc.bg }]}>
                        <Text style={[orderStyle.badgeText, { color: sc.text }]}>{order.status?.toUpperCase()}</Text>
                    </View>
                    <Text style={orderStyle.total}>₹{total.toFixed(0)}</Text>
                </View>
            </View>

            {/* Failure reason banner */}
            {isFailed && order.failureReason ? (
                <View style={orderStyle.failureBanner}>
                    <Text style={orderStyle.failureText}>⚠ {order.failureReason}</Text>
                </View>
            ) : null}

            {/* Item pills */}
            <View style={orderStyle.pillRow}>
                {items.slice(0, expanded ? undefined : 2).map((it, i) => (
                    <View key={i} style={orderStyle.pill}>
                        {isUrl(it.image) ? (
                            <Image source={{ uri: it.image }} style={orderStyle.pillImg} resizeMode="cover" />
                        ) : (
                            <Text style={orderStyle.pillEmoji}>{it.image || '🛍'}</Text>
                        )}
                        <Text style={orderStyle.pillName} numberOfLines={1}>{it.name}</Text>
                        <Text style={orderStyle.pillQty}>x{it.qty}</Text>
                    </View>
                ))}
                {!expanded && items.length > 2 && (
                    <View style={[orderStyle.pill, orderStyle.morePill]}>
                        <Text style={orderStyle.moreText}>+{items.length - 2} more</Text>
                    </View>
                )}
            </View>

            {/* Expanded detail */}
            {expanded && (
                <View style={orderStyle.detail}>
                    <View style={orderStyle.divider} />
                    {items.map((it, i) => (
                        <View key={i} style={orderStyle.itemRow}>
                            {isUrl(it.image) ? (
                                <Image source={{ uri: it.image }} style={orderStyle.itemImg} resizeMode="cover" />
                            ) : (
                                <Text style={orderStyle.itemEmoji}>{it.image || '🛍'}</Text>
                            )}
                            <Text style={orderStyle.itemName} numberOfLines={1}>{it.name}</Text>
                            <Text style={orderStyle.itemUnit}>{it.unit}</Text>
                            <Text style={orderStyle.itemQty}>x{it.qty}</Text>
                            <Text style={orderStyle.itemPrice}>₹{(it.price * it.qty).toFixed(0)}</Text>
                        </View>
                    ))}
                    <View style={orderStyle.divider} />
                    <View style={orderStyle.totalRow}>
                        <Text style={orderStyle.totalLabel}>Total</Text>
                        <Text style={orderStyle.totalValue}>₹{total.toFixed(0)}</Text>
                    </View>
                    <View style={orderStyle.metaRow}>
                        {order.paymentMethod ? <Text style={orderStyle.meta}>💳 {order.paymentMethod}</Text> : null}
                        {order.deliveryAddress ? <Text style={orderStyle.meta}>📍 {typeof order.deliveryAddress === 'string' ? order.deliveryAddress : [order.deliveryAddress.street, order.deliveryAddress.city].filter(Boolean).join(', ')}</Text> : null}
                    </View>
                </View>
            )}

            <Text style={orderStyle.expand}>{expanded ? '▲ Less' : '▼ Details'}</Text>
        </TouchableOpacity>
    );
};
const orderStyle = StyleSheet.create({
    card: { backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    orderId: { fontSize: SIZES.font, fontWeight: '700', color: COLORS.black },
    orderDate: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
    badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
    badgeText: { fontSize: 11, fontWeight: '700' },
    total: { fontSize: SIZES.medium, fontWeight: '700', color: '#1B4332', marginTop: 4 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F6F4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 5, maxWidth: 150 },
    pillImg: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E0E0E0' },
    pillEmoji: { fontSize: 13 },
    pillName: { fontSize: 11, color: COLORS.black, flex: 1 },
    pillQty: { fontSize: 11, color: COLORS.gray },
    morePill: { backgroundColor: '#E8F5E9' },
    moreText: { fontSize: 11, color: '#1B4332', fontWeight: '600' },
    detail: { marginTop: 10 },
    divider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: 8 },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    itemImg: { width: 28, height: 28, borderRadius: 6, marginRight: 8, backgroundColor: '#F4F6F4' },
    itemEmoji: { fontSize: 16, marginRight: 8 },
    itemName: { flex: 1, fontSize: SIZES.font, color: COLORS.black },
    itemUnit: { fontSize: 11, color: COLORS.gray, marginRight: 8 },
    itemQty: { fontSize: SIZES.font, color: COLORS.gray, marginRight: 8 },
    itemPrice: { fontSize: SIZES.font, fontWeight: '600', color: COLORS.black, minWidth: 40, textAlign: 'right' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
    totalLabel: { fontSize: SIZES.font, fontWeight: '700', color: COLORS.black },
    totalValue: { fontSize: SIZES.font, fontWeight: '700', color: '#1B4332' },
    metaRow: { marginTop: 8, gap: 4 },
    meta: { fontSize: 11, color: COLORS.gray },
    expand: { fontSize: 11, color: '#1B4332', textAlign: 'center', marginTop: 8, fontWeight: '600' },
    // Subscription order extras
    cardFailed: { borderLeftWidth: 4, borderLeftColor: '#DC2626' },
    subTag: { backgroundColor: '#E8F5E9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
    subTagTxt: { fontSize: 11, color: '#1B4332', fontWeight: '700' },
    failureBanner: { backgroundColor: '#FFF0F0', borderRadius: 8, padding: 10, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#DC2626' },
    failureText: { fontSize: 12, color: '#C62828', fontWeight: '600' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const ProfileScreen = () => {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState(null);

    useEffect(() => {
        if (!user?.id) { setLoading(false); return; }
        fetchUserOrders(user.id)
            .then(setOrders)
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
        getWalletBalance(user.id)
            .then(r => setWalletBalance(r.balance ?? 0))
            .catch(() => setWalletBalance(0));
    }, [user?.id]);

    if (!user) {
        // Shouldn't happen (AppNavigator guards this), but just in case
        navigation.replace('Login');
        return null;
    }

    const memberSince = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : '—';

    const handleLogout = () => {
        logout();
        navigation.navigate('Tabs', { screen: 'Home' });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header />
            <ScrollView contentContainerStyle={styles.scroll}>

                {/* ── Avatar + greeting ── */}
                <View style={styles.heroCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.greeting}>Hi, {user.firstName}! 👋</Text>
                        <Text style={styles.roleText}>{user.role === 'admin' ? '🛡️ Administrator' : '🛍️ Member'}</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Wallet card ── */}
                <TouchableOpacity style={styles.walletCard} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.85}>
                    <View>
                        <Text style={styles.walletLabel}>Wallet Balance</Text>
                        <Text style={styles.walletAmt}>
                            {walletBalance === null ? '—' : `₹${walletBalance.toFixed(2)}`}
                        </Text>
                        {walletBalance !== null && walletBalance < 100 && (
                            <Text style={styles.walletWarn}>⚠ Top up to subscribe</Text>
                        )}
                    </View>
                    <View style={styles.topUpChip}>
                        <Text style={styles.topUpChipTxt}>+ Top Up</Text>
                    </View>
                </TouchableOpacity>

                {/* ── Admin Dashboard (admin only) ── */}
                {user.role === 'admin' && (
                    <TouchableOpacity
                        style={styles.adminBtn}
                        onPress={() => navigation.navigate('Admin')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.adminBtnIcon}>🛡️</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.adminBtnTitle}>Admin Dashboard</Text>
                            <Text style={styles.adminBtnSub}>Manage orders, products, banners & more</Text>
                        </View>
                        <Text style={{ color: '#fff', fontSize: 18 }}>›</Text>
                    </TouchableOpacity>
                )}

                {/* ── Account details ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Details</Text>
                    <InfoRow icon="✉️" label="Email" value={user.email} />
                    <InfoRow icon="📱" label="Phone" value={user.phone} />
                    <InfoRow icon="📅" label="Member Since" value={memberSince} />
                </View>

                {/* ── Order history ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Order History</Text>
                        {orders.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{orders.length} orders</Text>
                            </View>
                        )}
                    </View>

                    {loading ? (
                        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} />
                    ) : orders.length === 0 ? (
                        <View style={styles.emptyOrders}>
                            <Text style={styles.emptyEmoji}>🛒</Text>
                            <Text style={styles.emptyTitle}>No orders yet</Text>
                            <Text style={styles.emptyText}>Your completed orders will appear here.</Text>
                            <TouchableOpacity
                                style={styles.shopBtn}
                                onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
                            >
                                <Text style={styles.shopBtnText}>Start Shopping</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        orders.map((order) => <OrderCard key={order.id} order={order} />)
                    )}
                </View>

                {/* ── Quick actions ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        {[
                            { icon: '💰', label: 'Wallet', onPress: () => navigation.navigate('Wallet') },
                            { icon: '📍', label: 'Addresses', onPress: () => navigation.navigate('Addresses') },
                            { icon: '📅', label: 'Subscriptions', onPress: () => navigation.navigate('Tabs', { screen: 'Subscription' }) },
                            { icon: '🛒', label: 'Cart', onPress: () => navigation.navigate('Tabs', { screen: 'Cart' }) },
                            { icon: '❓', label: 'Support', onPress: () => {
                                const num = '+918970299890';
                                if (Platform.OS === 'web') {
                                    window.alert(`Support: ${num}`);
                                } else {
                                    Alert.alert('Contact Us', `Support: ${num}`, [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Call Now', onPress: () => Linking.openURL(`tel:${num}`) },
                                    ]);
                                }
                            }},
                        ].map((a) => (
                            <TouchableOpacity key={a.label} style={styles.action} onPress={a.onPress}>
                                <Text style={styles.actionIcon}>{a.icon}</Text>
                                <Text style={styles.actionLabel}>{a.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F6F8F6' },
    scroll: { padding: SIZES.padding, paddingBottom: SIZES.padding * 2, maxWidth: 640, width: '100%', alignSelf: 'center' },
    heroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B4332', borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 },
    avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.white },
    greeting: { fontSize: SIZES.large, fontWeight: '700', color: COLORS.white },
    roleText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    logoutText: { color: COLORS.white, fontSize: SIZES.font, fontWeight: '600' },
    section: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
    sectionTitle: { fontSize: SIZES.medium, fontWeight: '700', color: COLORS.black, marginBottom: 14 },
    badge: { backgroundColor: '#E8F5E9', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 14 },
    badgeText: { fontSize: 11, color: '#1B4332', fontWeight: '700' },
    emptyOrders: { alignItems: 'center', paddingVertical: 24 },
    emptyEmoji: { fontSize: 40, marginBottom: 8 },
    emptyTitle: { fontSize: SIZES.medium, fontWeight: '700', color: COLORS.black },
    emptyText: { fontSize: SIZES.font, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
    shopBtn: { marginTop: 14, backgroundColor: '#1B4332', borderRadius: SIZES.radius, paddingHorizontal: 20, paddingVertical: 10 },
    shopBtnText: { color: COLORS.white, fontWeight: '700', fontSize: SIZES.font },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    action: { flex: 1, minWidth: 80, backgroundColor: '#F4F6F4', borderRadius: 10, padding: 14, alignItems: 'center', gap: 6 },
    actionIcon: { fontSize: 24 },
    actionLabel: { fontSize: 11, color: COLORS.black, fontWeight: '600', textAlign: 'center' },
    // Wallet card
    walletCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1B4332', borderRadius: 14, padding: 16, marginBottom: 14 },
    walletLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.5 },
    walletAmt: { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 2 },
    walletWarn: { fontSize: 11, color: '#FCD34D', marginTop: 4 },
    topUpChip: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    topUpChipTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

    // Admin dashboard button
    adminBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B4332', borderRadius: 14, padding: 16, marginBottom: 14, gap: 12 },
    adminBtnIcon: { fontSize: 24 },
    adminBtnTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
    adminBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
});

export default ProfileScreen;
