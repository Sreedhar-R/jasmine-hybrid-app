/**
 * SubscriptionScreen.js
 * Two-tab layout:
 *   • Subscribe      – products available for subscription
 *   • My Subscriptions – user's active / paused / cancelled subs
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, Image, ActivityIndicator, Alert, Modal,
    TextInput, useWindowDimensions, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS, SIZES } from '../constants/theme';
import {
    fetchSubscribableProducts, fetchUserSubscriptions,
    createSubscription, pauseSubscription,
    resumeSubscription, cancelSubscription,
    getWalletBalance, fetchUserAddresses,
} from '../services/api';

const GREEN = '#1B4332';
const LIGHT_GREEN = '#F0F7F4';
const DAYS_OF_WEEK = [
    { id: 'mon', label: 'Mon' },
    { id: 'tue', label: 'Tue' },
    { id: 'wed', label: 'Wed' },
    { id: 'thu', label: 'Thu' },
    { id: 'fri', label: 'Fri' },
    { id: 'sat', label: 'Sat' },
    { id: 'sun', label: 'Sun' },
];
const FREQUENCIES = [
    { id: 'daily', label: 'Daily', desc: 'Every day' },
    { id: 'weekly', label: 'Weekly', desc: 'Once a week' },
    { id: 'every_n_days', label: 'Every N Days', desc: 'Pick an interval' },
    { id: 'custom', label: 'Custom days', desc: 'Pick your days' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusColor(s) {
    if (s === 'active') return '#16A34A';
    if (s === 'paused') return '#D97706';
    if (s === 'cancelled') return '#DC2626';
    return COLORS.gray;
}

function frequencyLabel(f, nDays) {
    if (f === 'every_n_days') return `Every ${nDays ?? 2} Days`;
    return FREQUENCIES.find(x => x.id === f)?.label ?? f;
}

// ── Subscribe Modal ───────────────────────────────────────────────────────────
const SubscribeModal = ({ visible, product, userId, onClose, onSuccess }) => {
    const { addItem, updateQty } = useCart();
    const navigation = useNavigation();
    const [frequency, setFrequency] = useState('weekly');
    const [nDays, setNDays] = useState(2);          // used when frequency === 'every_n_days'
    const [customDays, setCustomDays] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [saving, setSaving] = useState(false);
    const dateInputRef = useRef(null);
    const openDatePicker = () => {
        const el = dateInputRef.current;
        if (!el) return;
        if (el.showPicker) el.showPicker();
        else el.click();
    };
    // Local YYYY-MM-DD formatter (avoids timezone shift from toISOString)
    const toLocalISO = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // Start date — minimum is tomorrow (midnight, future-only)
    const minDate = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 0, 0);
        return d;
    })();
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 0, 0);
        return d;
    });
    // Wallet
    const [walletBalance, setWalletBalance] = useState(null);
    const [loadingWallet, setLoadingWallet] = useState(false);
    // Delivery address
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [loadingAddresses, setLoadingAddresses] = useState(false);

    // Fetch wallet + addresses when modal opens
    useEffect(() => {
        if (visible && userId) {
            setLoadingWallet(true);
            getWalletBalance(userId)
                .then(r => setWalletBalance(r.balance ?? 0))
                .catch(() => setWalletBalance(0))
                .finally(() => setLoadingWallet(false));

            setLoadingAddresses(true);
            fetchUserAddresses(userId)
                .then(list => {
                    const arr = list ?? [];
                    setAddresses(arr);
                    const primary = arr.find(a => a.isPrimary);
                    if (primary) setSelectedAddressId(primary.id);
                })
                .catch(() => setAddresses([]))
                .finally(() => setLoadingAddresses(false));
        }
    }, [visible, userId]);

    const toggleDay = (dayId) => {
        setCustomDays(prev =>
            prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
        );
    };

    const handleSubscribe = async () => {
        if (!userId) {
            Alert.alert('Sign in required', 'Please log in to subscribe.');
            return;
        }
        if (frequency === 'custom' && customDays.length === 0) {
            Alert.alert('Select days', 'Please choose at least one delivery day.');
            return;
        }
        if (!selectedAddressId) {
            Alert.alert('Delivery address required', 'Please select a delivery address.');
            return;
        }
        if (walletBalance !== null && walletBalance < 100) {
            Alert.alert(
                'Insufficient wallet balance',
                'You need at least ₹100 in your wallet to start a subscription. Please top up first.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Top Up Wallet', onPress: () => { onClose(); navigation.navigate('Wallet'); } },
                ],
            );
            return;
        }
        setSaving(true);
        try {
            const selectedAddr = addresses.find(a => a.id === selectedAddressId) ?? null;
            await createSubscription({
                userId,
                productId: product.id,
                productName: product.name,
                productImage: product.image ?? null,
                productImages: product.images ?? null,
                productPrice: product.price,
                productUnit: product.unit ?? null,
                productCategory: product.category ?? null,
                frequency,
                nDays: frequency === 'every_n_days' ? nDays : null,
                customDays: frequency === 'custom' ? customDays : [],
                quantity,
                startDate: startDate.toISOString().split('T')[0],
                deliveryAddressId: selectedAddressId,
                deliveryAddress: selectedAddr,
            });
            onSuccess();
        } catch (err) {
            Alert.alert('Error', err.message ?? 'Could not create subscription.');
        } finally {
            setSaving(false);
        }
    };

    if (!product) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={mdl.overlay}>
                <View style={mdl.sheet}>
                    {/* Header */}
                    <View style={mdl.head}>
                        <Text style={mdl.title}>Subscribe</Text>
                        <TouchableOpacity onPress={onClose} style={mdl.closeBtn}>
                            <Text style={mdl.closeTxt}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Product preview */}
                        <View style={mdl.productRow}>
                            <View style={mdl.imgWrap}>
                                {(Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image)
                                    ? <Image source={{ uri: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image }} style={mdl.img} resizeMode="contain" />
                                    : <Text style={{ fontSize: 32 }}>🛆</Text>
                                }
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={mdl.productName}>{product.name}</Text>
                                <Text style={mdl.productUnit}>{product.unit}</Text>
                                <Text style={mdl.productPrice}>₹{product.price?.toFixed(2)}</Text>
                            </View>
                        </View>

                        {/* Frequency */}
                        <Text style={mdl.sectionLabel}>Delivery Frequency</Text>
                        <View style={mdl.freqGrid}>
                            {FREQUENCIES.map(f => (
                                <TouchableOpacity
                                    key={f.id}
                                    style={[mdl.freqBtn, frequency === f.id && mdl.freqBtnSel]}
                                    onPress={() => { setFrequency(f.id); if (f.id !== 'custom') setCustomDays([]); }}
                                >
                                    <Text style={[mdl.freqLabel, frequency === f.id && mdl.freqLabelSel]}>{f.label}</Text>
                                    <Text style={[mdl.freqDesc, frequency === f.id && mdl.freqDescSel]}>{f.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Every N Days selector */}
                        {frequency === 'every_n_days' && (
                            <View style={mdl.nDaysWrap}>
                                <Text style={mdl.nDaysLabel}>Deliver every</Text>
                                {Platform.OS === 'web' ? (
                                    <select
                                        value={nDays}
                                        onChange={e => setNDays(Number(e.target.value))}
                                        style={{
                                            fontSize: 15,
                                            fontWeight: '700',
                                            color: '#1B4332',
                                            backgroundColor: '#F0F7F4',
                                            border: '1.5px solid #1B4332',
                                            borderRadius: 8,
                                            padding: '6px 12px',
                                            cursor: 'pointer',
                                            outline: 'none',
                                        }}
                                    >
                                        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                            <option key={n} value={n}>{n} days</option>
                                        ))}
                                    </select>
                                ) : (
                                    // Native fallback pills
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                            <TouchableOpacity
                                                key={n}
                                                style={[mdl.nDaysPill, nDays === n && mdl.nDaysPillSel]}
                                                onPress={() => setNDays(n)}
                                            >
                                                <Text style={[mdl.nDaysPillTxt, nDays === n && mdl.nDaysPillTxtSel]}>{n}d</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                                <Text style={mdl.nDaysSuffix}>days</Text>
                            </View>
                        )}

                        {/* Custom day picker */}
                        {frequency === 'custom' && (
                            <>
                                <Text style={mdl.sectionLabel}>Select Delivery Days</Text>
                                <View style={mdl.daysRow}>
                                    {DAYS_OF_WEEK.map(d => {
                                        const sel = customDays.includes(d.id);
                                        return (
                                            <TouchableOpacity
                                                key={d.id}
                                                style={[mdl.dayBtn, sel && mdl.dayBtnSel]}
                                                onPress={() => toggleDay(d.id)}
                                            >
                                                <Text style={[mdl.dayTxt, sel && mdl.dayTxtSel]}>{d.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                {customDays.length === 0 && (
                                    <Text style={mdl.dayHint}>Pick at least one day</Text>
                                )}
                            </>
                        )}

                        {/* Quantity */}
                        <Text style={mdl.sectionLabel}>Quantity per Delivery</Text>
                        <View style={mdl.qtyRow}>
                            <TouchableOpacity
                                style={mdl.qtyBtn}
                                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                            >
                                <Text style={mdl.qtyBtnTxt}>−</Text>
                            </TouchableOpacity>
                            <Text style={mdl.qtyVal}>{quantity}</Text>
                            <TouchableOpacity
                                style={mdl.qtyBtn}
                                onPress={() => setQuantity(q => q + 1)}
                            >
                                <Text style={mdl.qtyBtnTxt}>+</Text>
                            </TouchableOpacity>
                            <Text style={mdl.qtySuffix}>{product.unit ? `× ${product.unit}` : 'unit(s)'}</Text>
                        </View>

                        {/* Delivery Address */}
                        <Text style={mdl.sectionLabel}>Delivery Address</Text>
                        {loadingAddresses ? (
                            <ActivityIndicator color={GREEN} style={{ marginHorizontal: 20, marginBottom: 16 }} />
                        ) : addresses.length === 0 ? (
                            <View style={mdl.addrEmpty}>
                                <Text style={mdl.addrEmptyTxt}>📍 No saved addresses.</Text>
                                <TouchableOpacity onPress={() => { onClose(); navigation.navigate('Addresses'); }}>
                                    <Text style={mdl.addrEmptyLink}>+ Add an address</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={mdl.addrList}>
                                {addresses.map(addr => {
                                    const isSel = selectedAddressId === addr.id;
                                    return (
                                        <TouchableOpacity
                                            key={addr.id}
                                            style={[mdl.addrCard, isSel && mdl.addrCardSel]}
                                            onPress={() => setSelectedAddressId(addr.id)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                    <Text style={[mdl.addrLabel, isSel && { color: GREEN }]}>
                                                        {addr.label ?? 'Address'}
                                                    </Text>
                                                    {addr.isPrimary && (
                                                        <View style={mdl.primaryBadge}>
                                                            <Text style={mdl.primaryTxt}>Primary</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                {addr.street ? <Text style={mdl.addrLine}>{addr.street}</Text> : null}
                                                {addr.apartment ? <Text style={mdl.addrLine}>{addr.apartment}</Text> : null}
                                                {(addr.city || addr.state || addr.zipCode) ? (
                                                    <Text style={mdl.addrLine}>
                                                        {[addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')}
                                                    </Text>
                                                ) : null}
                                                {addr.country ? <Text style={mdl.addrLine}>{addr.country}</Text> : null}
                                            </View>
                                            <View style={[mdl.addrRadio, isSel && mdl.addrRadioSel]}>
                                                {isSel && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                                {/* Add new address link */}
                                <TouchableOpacity
                                    style={mdl.addrAddBtn}
                                    onPress={() => { onClose(); navigation.navigate('Addresses'); }}
                                >
                                    <Text style={mdl.addrAddTxt}>+ Add New Address</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Start Date */}
                        <Text style={mdl.sectionLabel}>Start Date</Text>
                        {Platform.OS === 'web' ? (
                            // Wrapper with position:relative so the hidden input anchors
                            // the browser calendar popup to this exact location
                            <View style={[mdl.datePickerWrap, { alignSelf: 'flex-start', minWidth: 230, position: 'relative' }]}>
                                {/* Invisible input anchored to the row — browser opens picker here */}
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    min={toLocalISO(minDate)}
                                    value={toLocalISO(startDate)}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val) {
                                            const picked = new Date(val + 'T00:00:00');
                                            setStartDate(picked >= minDate ? picked : new Date(minDate));
                                        }
                                    }}
                                    style={{
                                        position: 'absolute', top: 0, left: 0,
                                        width: '100%', height: 1,
                                        opacity: 0, pointerEvents: 'none', border: 'none',
                                    }}
                                />
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
                                    onPress={openDatePicker}
                                    activeOpacity={0.7}
                                >
                                    <Text style={mdl.datePickerIcon}>📅</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={mdl.dateValue}>
                                            {startDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                        </Text>
                                        <Text style={mdl.dateHint}>Tap to change</Text>
                                    </View>
                                    <Text style={{ color: '#999', fontSize: 16 }}>›</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={mdl.datePickerWrap}>
                                <Text style={mdl.datePickerIcon}>📅</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={mdl.dateValue}>
                                        {startDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                    </Text>
                                    <Text style={mdl.dateHint}>First delivery date</Text>
                                </View>
                            </View>
                        )}

                        {/* Wallet balance */}
                        <View style={mdl.walletRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={mdl.walletLabel}>💰 Wallet Balance</Text>
                                {loadingWallet
                                    ? <Text style={mdl.walletAmt}>Checking…</Text>
                                    : <Text style={[mdl.walletAmt, { color: (walletBalance ?? 0) >= 100 ? '#16A34A' : '#DC2626' }]}>
                                        ₹{(walletBalance ?? 0).toFixed(2)}
                                    </Text>
                                }
                                {!loadingWallet && (walletBalance ?? 0) < 100 && (
                                    <Text style={mdl.walletWarn}>⚠ Min ₹100 needed to subscribe</Text>
                                )}
                            </View>
                            {!loadingWallet && (walletBalance ?? 0) < 100 && (
                                <TouchableOpacity
                                    style={mdl.topUpBtn}
                                    onPress={() => { onClose(); navigation.navigate('Wallet'); }}
                                >
                                    <Text style={mdl.topUpTxt}>+ Top Up</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Summary */}

                        <View style={mdl.summary}>
                            <Text style={mdl.summaryTxt}>
                                You'll receive <Text style={{ fontWeight: '800' }}>{quantity} {product.unit ?? 'unit'}</Text> of{' '}
                                <Text style={{ fontWeight: '800' }}>{product.name}</Text>{' '}
                                {frequency === 'custom'
                                    ? customDays.length > 0
                                        ? <Text style={{ fontWeight: '800' }}>every {customDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}</Text>
                                        : <Text style={{ color: '#C0392B' }}>— select delivery days above</Text>
                                    : frequency === 'every_n_days'
                                        ? <Text style={{ fontWeight: '800' }}>every {nDays} days</Text>
                                        : <Text style={{ fontWeight: '800' }}>{frequencyLabel(frequency, nDays).toLowerCase()}</Text>
                                }.{' '}
                                ≈ ₹{(product.price * quantity).toFixed(2)} per delivery
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                mdl.confirmBtn,
                                (saving || loadingWallet || (walletBalance !== null && walletBalance < 100)) && { opacity: 0.4 },
                            ]}
                            onPress={handleSubscribe}
                            disabled={saving || loadingWallet || (walletBalance !== null && walletBalance < 100)}
                        >
                            {saving
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={mdl.confirmTxt}>
                                    {walletBalance !== null && walletBalance < 100
                                        ? '⚠ Insufficient Wallet Balance'
                                        : '📅  Confirm Subscription'
                                    }
                                </Text>
                            }
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const mdl = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: 24 },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    title: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    closeTxt: { fontSize: 14, color: '#555', fontWeight: '700' },
    productRow: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
    imgWrap: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#F8F8F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
    img: { width: 60, height: 60 },
    productName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
    productUnit: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
    productPrice: { fontSize: 16, fontWeight: '800', color: GREEN, marginTop: 4 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginHorizontal: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
    freqBtn: { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, minWidth: 100 },
    freqBtnSel: { borderColor: GREEN, backgroundColor: LIGHT_GREEN },
    freqLabel: { fontSize: 13, fontWeight: '700', color: '#555' },
    freqLabelSel: { color: GREEN },
    freqDesc: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
    freqDescSel: { color: '#2D6A4F' },
    // Custom day picker
    daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
    dayBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
    dayBtnSel: { borderColor: GREEN, backgroundColor: GREEN },
    dayTxt: { fontSize: 12, fontWeight: '700', color: '#555' },
    dayTxtSel: { color: '#fff' },
    dayHint: { fontSize: 12, color: '#C0392B', marginHorizontal: 20, marginBottom: 12 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 12 },
    qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
    qtyBtnTxt: { fontSize: 20, fontWeight: '700', color: '#333', lineHeight: 24 },
    qtyVal: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', minWidth: 32, textAlign: 'center' },
    qtySuffix: { fontSize: 13, color: COLORS.gray },
    summary: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#F8F9FA', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E8E8E8' },
    summaryTxt: { fontSize: 14, color: '#555', lineHeight: 22 },
    confirmBtn: { marginHorizontal: 20, backgroundColor: GREEN, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    confirmTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
    // Start date picker
    datePickerWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 20, backgroundColor: '#F8F9FA', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E0E0E0', gap: 10 },
    datePickerIcon: { fontSize: 22 },
    dateValue: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
    dateHint: { fontSize: 11, color: COLORS.gray, marginTop: 3 },
    // Every N Days selector
    nDaysWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 20, backgroundColor: '#F0F7F4', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#C8E6C9', gap: 10 },
    nDaysLabel: { fontSize: 14, fontWeight: '600', color: '#444' },
    nDaysSuffix: { fontSize: 14, color: '#555' },
    nDaysPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA' },
    nDaysPillSel: { borderColor: GREEN, backgroundColor: GREEN },
    nDaysPillTxt: { fontSize: 13, fontWeight: '700', color: '#555' },
    nDaysPillTxtSel: { color: '#fff' },
    // Wallet
    walletRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, backgroundColor: '#F8F9FA', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E8E8E8', gap: 12 },
    walletLabel: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 4 },
    walletAmt: { fontSize: 20, fontWeight: '900' },
    walletWarn: { fontSize: 11, color: '#DC2626', marginTop: 4 },
    topUpBtn: { backgroundColor: GREEN, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
    topUpTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
    // Address picker
    addrList: { paddingHorizontal: 20, marginBottom: 20, gap: 8 },
    addrCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA', gap: 10 },
    addrCardSel: { borderColor: GREEN, backgroundColor: '#F0F7F4' },
    addrLabel: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
    addrLine: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
    addrRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    addrRadioSel: { borderColor: GREEN, backgroundColor: GREEN },
    primaryBadge: { backgroundColor: '#E8F5E9', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    primaryTxt: { fontSize: 9, fontWeight: '800', color: GREEN },
    addrEmpty: { marginHorizontal: 20, marginBottom: 16, alignItems: 'center', gap: 6 },
    addrEmptyTxt: { fontSize: 13, color: '#888' },
    addrEmptyLink: { fontSize: 13, fontWeight: '700', color: GREEN, textDecorationLine: 'underline' },
    addrAddBtn: { marginTop: 4, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1.5, borderColor: GREEN, backgroundColor: '#F0F7F4' },
    addrAddTxt: { fontSize: 13, fontWeight: '700', color: GREEN },
});

// ── Subscribable Product Card ─────────────────────────────────────────────────
const ProductCard = ({ product, onSubscribe }) => {
    const displayImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image;
    return (
    <View style={pc.card}>
        <View style={pc.imgWrap}>
            {displayImage
                ? <Image source={{ uri: displayImage }} style={pc.img} resizeMode="contain" />
                : <Text style={{ fontSize: 40 }}>🛆</Text>
            }
            {product.subscriptionBadge && (
                <View style={pc.badge}>
                    <Text style={pc.badgeTxt}>{product.subscriptionBadge}</Text>
                </View>
            )}
        </View>
        <View style={pc.info}>
            <Text style={pc.name} numberOfLines={2}>{product.name}</Text>
            <Text style={pc.unit}>{product.unit}</Text>
            {product.description ? (
                <Text style={pc.desc} numberOfLines={2}>{product.description}</Text>
            ) : null}
            <View style={pc.priceRow}>
                <Text style={pc.price}>₹{product.price?.toFixed(2)}</Text>
                {product.originalPrice && product.originalPrice > product.price ? (
                    <Text style={pc.originalPrice}>₹{product.originalPrice?.toFixed(2)}</Text>
                ) : null}
            </View>
        </View>
        <TouchableOpacity style={pc.subscribeBtn} onPress={() => onSubscribe(product)}>
            <Text style={pc.subscribeTxt}>📅 Subscribe</Text>
        </TouchableOpacity>
    </View>
    );
};

const pc = StyleSheet.create({
    card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#EBEBEB', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, gap: 12 },
    imgWrap: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#F8F8F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', position: 'relative', flexShrink: 0 },
    img: { width: 60, height: 60 },
    badge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FBBF24', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
    badgeTxt: { fontSize: 9, fontWeight: '800', color: '#78350F' },
    info: { flex: 1 },
    name: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
    unit: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
    desc: { fontSize: 11, color: '#888', marginTop: 3, lineHeight: 16 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    price: { fontSize: 15, fontWeight: '800', color: GREEN },
    originalPrice: { fontSize: 12, color: COLORS.gray, textDecorationLine: 'line-through' },
    subscribeBtn: { backgroundColor: LIGHT_GREEN, borderWidth: 1, borderColor: GREEN, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, flexShrink: 0 },
    subscribeTxt: { fontSize: 12, fontWeight: '700', color: GREEN },
});

// ── Next delivery date helper ──────────────────────────────────────────────────
function computeNextDelivery(sub) {
    const base = sub.startDate ? new Date(sub.startDate + 'T00:00:00') : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (base >= today) return base; // first delivery is still in the future

    if (sub.frequency === 'daily') {
        return today;
    }
    if (sub.frequency === 'weekly') {
        const diff = Math.ceil((today - base) / (7 * 86400000));
        const next = new Date(base);
        next.setDate(next.getDate() + diff * 7);
        return next;
    }
    if (sub.frequency === 'every_n_days') {
        const n = sub.nDays ?? 2;
        const diff = Math.ceil((today - base) / (n * 86400000));
        const next = new Date(base);
        next.setDate(next.getDate() + diff * n);
        return next;
    }
    if (sub.frequency === 'custom' && sub.customDays?.length > 0) {
        const dayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
        const days = sub.customDays.map(d => dayMap[d]).sort((a, b) => a - b);
        const todayDow = today.getDay();
        const nextDow = days.find(d => d >= todayDow) ?? days[0];
        const diff = (nextDow - todayDow + 7) % 7 || 7;
        const next = new Date(today);
        next.setDate(next.getDate() + diff);
        return next;
    }
    return base;
}

// ── Subscription Card (My Subscriptions tab) ──────────────────────────────────
const SubCard = ({ sub, onPause, onResume, onCancel }) => {
    const isActive = sub.status === 'active';
    const isPaused = sub.status === 'paused';
    const isCancelled = sub.status === 'cancelled';

    const nextDelivery = !isCancelled ? computeNextDelivery(sub) : null;
    const nextDeliveryStr = nextDelivery
        ? nextDelivery.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        : null;

    // Build schedule label
    let scheduleLabel = frequencyLabel(sub.frequency, sub.nDays);
    if (sub.frequency === 'custom' && sub.customDays?.length > 0) {
        scheduleLabel = 'Every ' + sub.customDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
    }

    // Delivery address string
    const addr = sub.deliveryAddress;
    const addrStr = addr
        ? [addr.street, addr.apartment, addr.city, addr.state, addr.zipCode, addr.country]
            .filter(Boolean).join(', ')
        : null;

    return (
        <View style={sc.card}>
            {/* Top: image + name + status + price */}
            <View style={sc.top}>
                <View style={sc.imgWrap}>
                    {sub.productImage
                        ? <Image source={{ uri: sub.productImage }} style={sc.img} resizeMode="contain" />
                        : <Text style={{ fontSize: 28 }}>�</Text>
                    }
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={sc.name}>{sub.productName ?? sub.productId}</Text>
                    {sub.productUnit ? <Text style={sc.unit}>{sub.productUnit}</Text> : null}
                    <View style={sc.metaRow}>
                        <View style={[sc.statusBadge, { backgroundColor: statusColor(sub.status) + '20' }]}>
                            <Text style={[sc.statusTxt, { color: statusColor(sub.status) }]}>{sub.status.toUpperCase()}</Text>
                        </View>
                        <Text style={sc.freq}>{scheduleLabel}</Text>
                        <Text style={sc.qty}>× {sub.quantity}</Text>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    {sub.productPrice ? (
                        <Text style={sc.price}>₹{(sub.productPrice * sub.quantity).toFixed(2)}</Text>
                    ) : null}
                    <Text style={sc.perDelivery}>/ delivery</Text>
                </View>
            </View>

            {/* Details section */}
            <View style={sc.details}>
                {sub.startDate ? (
                    <View style={sc.detailRow}>
                        <Text style={sc.detailIcon}>📅</Text>
                        <Text style={sc.detailLabel}>Start date</Text>
                        <Text style={sc.detailVal}>
                            {new Date(sub.startDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                    </View>
                ) : null}

                {nextDeliveryStr && isActive ? (
                    <View style={[sc.detailRow, sc.nextDeliveryRow]}>
                        <Text style={sc.detailIcon}>🚚</Text>
                        <Text style={[sc.detailLabel, { color: GREEN, fontWeight: '700' }]}>Next delivery</Text>
                        <Text style={[sc.detailVal, { color: GREEN, fontWeight: '800' }]}>{nextDeliveryStr}</Text>
                    </View>
                ) : null}

                {isPaused ? (
                    <View style={sc.detailRow}>
                        <Text style={sc.detailIcon}>⏸️</Text>
                        <Text style={sc.detailLabel}>Status</Text>
                        <Text style={[sc.detailVal, { color: '#D97706' }]}>Paused — resume to schedule deliveries</Text>
                    </View>
                ) : null}

                {addrStr ? (
                    <View style={sc.detailRow}>
                        <Text style={sc.detailIcon}>📍</Text>
                        <Text style={sc.detailLabel}>Deliver to</Text>
                        <Text style={sc.detailVal} numberOfLines={3}>{addrStr}</Text>
                    </View>
                ) : null}
            </View>

            {!isCancelled && (
                <View style={sc.actions}>
                    {isActive && (
                        <TouchableOpacity style={[sc.actionBtn, sc.pauseBtn]} onPress={() => onPause(sub.id)}>
                            <Text style={sc.pauseTxt}>⏸ Pause</Text>
                        </TouchableOpacity>
                    )}
                    {isPaused && (
                        <TouchableOpacity style={[sc.actionBtn, sc.resumeBtn]} onPress={() => onResume(sub.id)}>
                            <Text style={sc.resumeTxt}>▶ Resume</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[sc.actionBtn, sc.cancelBtn]} onPress={() => onCancel(sub.id)}>
                        <Text style={sc.cancelTxt}>✕ Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const sc = StyleSheet.create({
    card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, padding: 14, borderWidth: 1, borderColor: '#EBEBEB', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    imgWrap: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#F8F8F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', flexShrink: 0 },
    img: { width: 50, height: 50 },
    name: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', flex: 1 },
    unit: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
    statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    statusTxt: { fontSize: 10, fontWeight: '800' },
    freq: { fontSize: 12, color: '#555', fontWeight: '600' },
    qty: { fontSize: 12, color: '#555' },
    price: { fontSize: 15, fontWeight: '800', color: GREEN },
    perDelivery: { fontSize: 10, color: COLORS.gray },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1 },
    pauseBtn: { borderColor: '#D97706', backgroundColor: '#FFFBEB' },
    pauseTxt: { fontSize: 12, fontWeight: '700', color: '#D97706' },
    resumeBtn: { borderColor: GREEN, backgroundColor: LIGHT_GREEN },
    resumeTxt: { fontSize: 12, fontWeight: '700', color: GREEN },
    cancelBtn: { borderColor: '#DC2626', backgroundColor: '#FFF5F5' },
    cancelTxt: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
    // Detail rows
    details: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    nextDeliveryRow: { backgroundColor: '#F0F7F4', borderRadius: 8, padding: 8, marginHorizontal: -2 },
    detailIcon: { fontSize: 14, marginTop: 1, minWidth: 20 },
    detailLabel: { fontSize: 12, color: '#888', fontWeight: '600', minWidth: 90 },
    detailVal: { fontSize: 12, color: '#333', flex: 1, fontWeight: '500' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const SubscriptionScreen = () => {
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isWide = Platform.OS === 'web' && width >= 900;

    const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'mine'

    // Browse tab state
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // My Subscriptions tab state
    const [subs, setSubs] = useState([]);
    const [loadingSubs, setLoadingSubs] = useState(false);

    // Load subscribable products
    useEffect(() => {
        setLoadingProducts(true);
        fetchSubscribableProducts()
            .then(setProducts)
            .catch(() => setProducts([]))
            .finally(() => setLoadingProducts(false));
    }, []);

    // Load user's subscriptions when tab switches
    const loadSubs = useCallback(() => {
        if (!user?.id) return;
        setLoadingSubs(true);
        fetchUserSubscriptions(user.id)
            .then(setSubs)
            .catch(() => setSubs([]))
            .finally(() => setLoadingSubs(false));
    }, [user?.id]);

    useEffect(() => {
        if (activeTab === 'mine') loadSubs();
    }, [activeTab, loadSubs]);

    const handleSubscribePress = (product) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    const handleSubscribeSuccess = () => {
        setShowModal(false);
        setActiveTab('mine');
        loadSubs();
    };

    const handlePause = async (subId) => {
        try {
            await pauseSubscription(subId);
            loadSubs();
        } catch (err) {
            Alert.alert('Error', err.message ?? 'Could not pause subscription.');
        }
    };

    const handleResume = async (subId) => {
        try {
            await resumeSubscription(subId);
            loadSubs();
        } catch (err) {
            Alert.alert('Error', err.message ?? 'Could not resume subscription.');
        }
    };

    const handleCancel = async (subId) => {
        try {
            await cancelSubscription(subId);
            loadSubs();
        } catch (err) {
            Alert.alert('Error', err.message ?? 'Could not cancel subscription.');
        }
    };

    // ── Render tabs ──────────────────────────────────────────────────────────
    const renderBrowse = () => {
        if (loadingProducts) {
            return <ActivityIndicator color={GREEN} size="large" style={{ marginTop: 60 }} />;
        }
        if (products.length === 0) {
            return (
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyTitle}>No subscription products yet</Text>
                    <Text style={styles.emptySub}>Check back soon — we're adding fresh picks!</Text>
                </View>
            );
        }
        return (
            <ScrollView
                contentContainerStyle={[styles.list, isWide && styles.listWide]}
                showsVerticalScrollIndicator={false}
            >
                {products.map(p => (
                    <ProductCard key={p.id} product={p} onSubscribe={handleSubscribePress} />
                ))}
                
                {/* ── Shop more items button ── */}
                <TouchableOpacity
                    style={styles.shopMoreBtn}
                    onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
                >
                    <Text style={styles.shopMoreTxt}>← Shop more items</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    const renderMine = () => {
        if (!user) {
            return (
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyIcon}>🔐</Text>
                    <Text style={styles.emptyTitle}>Sign in to view subscriptions</Text>
                    <Text style={styles.emptySub}>Log in to manage your recurring deliveries.</Text>
                </View>
            );
        }
        if (loadingSubs) {
            return <ActivityIndicator color={GREEN} size="large" style={{ marginTop: 60 }} />;
        }
        if (subs.length === 0) {
            return (
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyIcon}>📅</Text>
                    <Text style={styles.emptyTitle}>No subscriptions yet</Text>
                    <Text style={styles.emptySub}>Head to the Subscribe tab to set up recurring deliveries.</Text>
                    <TouchableOpacity style={styles.browseBtn} onPress={() => setActiveTab('browse')}>
                        <Text style={styles.browseTxt}>Browse Products →</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const active = subs.filter(s => s.status === 'active');
        const paused = subs.filter(s => s.status === 'paused');
        const cancelled = subs.filter(s => s.status === 'cancelled');

        return (
            <ScrollView
                contentContainerStyle={[styles.list, isWide && styles.listWide]}
                showsVerticalScrollIndicator={false}
            >
                {active.length > 0 && (
                    <>
                        <Text style={styles.groupHead}>Active ({active.length})</Text>
                        {active.map(s => <SubCard key={s.id} sub={s} onPause={handlePause} onResume={handleResume} onCancel={handleCancel} />)}
                    </>
                )}
                {paused.length > 0 && (
                    <>
                        <Text style={styles.groupHead}>Paused ({paused.length})</Text>
                        {paused.map(s => <SubCard key={s.id} sub={s} onPause={handlePause} onResume={handleResume} onCancel={handleCancel} />)}
                    </>
                )}
                {cancelled.length > 0 && (
                    <>
                        <Text style={styles.groupHead}>Cancelled ({cancelled.length})</Text>
                        {cancelled.map(s => <SubCard key={s.id} sub={s} onPause={handlePause} onResume={handleResume} onCancel={handleCancel} />)}
                    </>
                )}

                {/* ── Shop more items button ── */}
                <TouchableOpacity
                    style={styles.shopMoreBtn}
                    onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
                >
                    <Text style={styles.shopMoreTxt}>← Shop more items</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <Header />

            {/* Page title */}
            <View style={styles.titleBar}>
                <Text style={styles.pageTitle}>📅 Subscriptions</Text>
                <Text style={styles.pageSubtitle}>Fresh deliveries on your schedule</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'browse' && styles.tabActive]}
                    onPress={() => setActiveTab('browse')}
                >
                    <Text style={[styles.tabTxt, activeTab === 'browse' && styles.tabTxtActive]}>
                        Subscribe
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
                    onPress={() => { setActiveTab('mine'); }}
                >
                    <Text style={[styles.tabTxt, activeTab === 'mine' && styles.tabTxtActive]}>
                        My Subscriptions
                        {user && subs.filter(s => s.status === 'active').length > 0
                            ? ` (${subs.filter(s => s.status === 'active').length})`
                            : ''}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab content */}
            <View style={{ flex: 1 }}>
                {activeTab === 'browse' ? renderBrowse() : renderMine()}
            </View>

            {/* Subscribe modal */}
            <SubscribeModal
                visible={showModal}
                product={selectedProduct}
                userId={user?.id}
                onClose={() => setShowModal(false)}
                onSuccess={handleSubscribeSuccess}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F6F8F6' },

    titleBar: {
        paddingHorizontal: SIZES.padding,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    pageTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a1a' },
    pageSubtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },

    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EBEBEB',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: GREEN },
    tabTxt: { fontSize: 14, fontWeight: '600', color: COLORS.gray },
    tabTxtActive: { color: GREEN, fontWeight: '800' },

    list: { padding: SIZES.padding, paddingBottom: 48 },
    listWide: { maxWidth: 720, width: '100%', alignSelf: 'center' },

    groupHead: {
        fontSize: 13,
        fontWeight: '700',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginTop: 4,
    },

    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
    emptySub: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 22 },
    browseBtn: { marginTop: 20, backgroundColor: GREEN, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
    browseTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
    shopMoreBtn: { 
        backgroundColor: '#F0F7F4', 
        borderRadius: 8, 
        paddingVertical: 16, 
        alignItems: 'center', 
        marginTop: 12,
        borderWidth: 1,
        borderColor: GREEN,
    },
    shopMoreTxt: { color: GREEN, fontWeight: '700', fontSize: 16 },
});

export default SubscriptionScreen;
