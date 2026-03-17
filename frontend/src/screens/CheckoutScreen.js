import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, Image, ActivityIndicator,
    useWindowDimensions, Platform, Alert,
} from 'react-native';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
    fetchUserAddresses, createRazorpayOrder, placeOrder,
} from '../services/api';
import { COLORS, SIZES } from '../constants/theme';
import MapAddressPicker from '../components/MapAddressPicker';

const GREEN = '#1B4332';
const STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir',
    'Ladakh', 'Puducherry',
];

// ── Small helpers ─────────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
    <View style={fld.wrap}>
        {label ? <Text style={fld.label}>{label}</Text> : null}
        <View style={[fld.box, error && fld.boxErr]}>{children}</View>
        {error ? <Text style={fld.err}>{error}</Text> : null}
    </View>
);
const inp = (extra = {}) => ({ ...fld.input, ...extra });

const fld = StyleSheet.create({
    wrap: { marginBottom: 12, flex: 1, minWidth: 0 },
    label: { fontSize: 11, color: COLORS.gray, marginBottom: 4 },
    box: { borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 6, backgroundColor: '#FAFAFA', paddingHorizontal: 12, paddingVertical: 10 },
    boxErr: { borderColor: '#C0392B', backgroundColor: '#FFF5F5' },
    input: { fontSize: SIZES.font, color: COLORS.black, outlineStyle: 'none' },
    err: { fontSize: 11, color: '#C0392B', marginTop: 3 },
    row: { flexDirection: 'row', gap: 8 },
});

// ── Saved address card ────────────────────────────────────────────────────────
const AddressCard = ({ addr, selected, onSelect }) => (
    <TouchableOpacity
        style={[addrS.card, selected && addrS.cardSel]}
        onPress={() => onSelect(addr)}
        activeOpacity={0.8}
    >
        <View style={addrS.radio}>
            {selected && <View style={addrS.radioDot} />}
        </View>
        <View style={{ flex: 1 }}>
            <Text style={addrS.line}>{addr.street}</Text>
            <Text style={addrS.line}>{addr.city}, {addr.state} – {addr.zipCode}</Text>
            <Text style={addrS.line}>{addr.country}</Text>
            {addr.isPrimary && <Text style={addrS.badge}>Default</Text>}
        </View>
    </TouchableOpacity>
);
const addrS = StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 8, padding: 14, marginBottom: 10 },
    cardSel: { borderColor: GREEN, backgroundColor: '#F0F7F4' },
    radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: GREEN, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
    radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: GREEN },
    line: { fontSize: 14, color: COLORS.black, lineHeight: 20 },
    badge: { fontSize: 11, color: GREEN, fontWeight: '700', marginTop: 4 },
});

// ── Order summary sidebar ─────────────────────────────────────────────────────
const OrderSummary = ({ items, subtotal, discount, shipping, discountCode, setDiscountCode, onApply }) => (
    <View style={sumS.wrap}>
        {/* Items */}
        {items.map((item) => {
            const displayImage = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.image;
            return (
            <View key={item.id} style={sumS.itemRow}>
                <View style={sumS.imgWrap}>
                    {displayImage
                        ? <Image source={{ uri: displayImage }} style={sumS.img} resizeMode="contain" />
                        : <Text style={{ fontSize: 24 }}>{item.emoji ?? '🛒'}</Text>
                    }
                    <View style={sumS.badge}><Text style={sumS.badgeTxt}>{item.qty}</Text></View>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={sumS.name} numberOfLines={2}>{item.name}</Text>
                    {item.unit ? <Text style={sumS.unit}>{item.unit}</Text> : null}
                </View>
                <Text style={sumS.price}>₹{(item.price * item.qty).toFixed(2)}</Text>
            </View>
            );
        })}

        <View style={sumS.divider} />

        {/* Discount */}
        <View style={sumS.discountRow}>
            <TextInput
                style={sumS.discountInput}
                placeholder="Discount code"
                placeholderTextColor={COLORS.gray}
                value={discountCode}
                onChangeText={setDiscountCode}
            />
            <TouchableOpacity style={sumS.applyBtn} onPress={onApply}>
                <Text style={sumS.applyTxt}>Apply</Text>
            </TouchableOpacity>
        </View>

        <View style={sumS.divider} />

        {/* Totals */}
        <View style={sumS.row}><Text style={sumS.rowLabel}>Subtotal · {items.length} item{items.length !== 1 ? 's' : ''}</Text><Text style={sumS.rowVal}>₹{subtotal.toFixed(2)}</Text></View>
        {discount > 0 && <View style={sumS.row}><Text style={[sumS.rowLabel, { color: '#27AE60' }]}>Discount</Text><Text style={[sumS.rowVal, { color: '#27AE60' }]}>-₹{discount.toFixed(2)}</Text></View>}
        <View style={sumS.row}><Text style={sumS.rowLabel}>Shipping ⓘ</Text><Text style={[sumS.rowVal, { color: COLORS.gray }]}>{shipping > 0 ? `₹${shipping.toFixed(2)}` : 'Enter shipping address'}</Text></View>

        <View style={sumS.divider} />

        <View style={sumS.totalRow}>
            <Text style={sumS.totalLabel}>Total</Text>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={sumS.currency}>INR</Text>
                <Text style={sumS.totalVal}>₹{(subtotal - discount + shipping).toFixed(2)}</Text>
            </View>
        </View>
        <Text style={sumS.taxNote}>Including ₹{((subtotal - discount) * 0.05).toFixed(2)} in taxes</Text>
    </View>
);
const sumS = StyleSheet.create({
    wrap: { backgroundColor: '#F8F8F6', borderRadius: 10, padding: 20, borderWidth: 1, borderColor: '#EBEBEB' },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    imgWrap: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', position: 'relative' },
    img: { width: 50, height: 50 },
    badge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#666', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    badgeTxt: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    name: { fontSize: 13, fontWeight: '600', color: COLORS.black },
    unit: { fontSize: 12, color: COLORS.gray },
    price: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 14 },
    discountRow: { flexDirection: 'row', gap: 8 },
    discountInput: { flex: 1, borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: SIZES.font, backgroundColor: '#FFF', outlineStyle: 'none' },
    applyBtn: { borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 6, paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'center', backgroundColor: '#FFF' },
    applyTxt: { fontSize: SIZES.font, color: COLORS.black, fontWeight: '600' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    rowLabel: { fontSize: 14, color: COLORS.black },
    rowVal: { fontSize: 14, color: COLORS.black, fontWeight: '600' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 },
    totalLabel: { fontSize: 20, fontWeight: '700', color: COLORS.black },
    currency: { fontSize: 11, color: COLORS.gray, textAlign: 'right' },
    totalVal: { fontSize: 22, fontWeight: '800', color: COLORS.black },
    taxNote: { fontSize: 12, color: COLORS.gray },
});

// ── Payment method selector ───────────────────────────────────────────────────
const PaymentSelector = ({ method, setMethod }) => {
    const options = [
        { id: 'razorpay', label: 'Razorpay (Cards / UPI / Netbanking)', icon: '💳' },
        { id: 'cod', label: 'Cash on Delivery', icon: '🏠' },
    ];
    return (
        <View>
            <Text style={styles.sectionHead}>Payment method</Text>
            {options.map((o) => (
                <TouchableOpacity
                    key={o.id}
                    style={[payS.card, method === o.id && payS.cardSel]}
                    onPress={() => setMethod(o.id)}
                    activeOpacity={0.8}
                >
                    <View style={addrS.radio}>
                        {method === o.id && <View style={addrS.radioDot} />}
                    </View>
                    <Text style={{ fontSize: 18, marginRight: 10 }}>{o.icon}</Text>
                    <Text style={payS.label}>{o.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};
const payS = StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 8, padding: 14, marginBottom: 10 },
    cardSel: { borderColor: GREEN, backgroundColor: '#F0F7F4' },
    label: { fontSize: 15, color: COLORS.black, flex: 1 },
});

// ── Main Checkout Screen ──────────────────────────────────────────────────────
const SHIPPING_FEE = 0;  // Free shipping for now

const CheckoutScreen = ({ navigation }) => {
    const { items, subtotal, clearCart } = useCart();
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isWide = Platform.OS === 'web' && width >= 900;

    /* ─── Saved addresses ─── */
    const [addresses, setAddresses] = useState([]);
    const [selectedAddr, setSelectedAddr] = useState(null);
    const [showForm, setShowForm] = useState(true);
    const [loadingAddr, setLoadingAddr] = useState(false);

    /* ─── Delivery form ─── */
    const [form, setForm] = useState({
        email: user?.email ?? '',
        emailOffers: true,
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        country: 'India',
        street: '',
        apartment: '',
        city: '',
        state: 'Karnataka',
        zipCode: '',
        phone: user?.phone ?? '',
        textOffers: false,
    });
    const [errors, setErrors] = useState({});

    /* ─── Payment ─── */
    const [payMethod, setPayMethod] = useState('razorpay');

    /* ─── Discount ─── */
    const [discountCode, setDiscountCode] = useState('');
    const [discount, setDiscount] = useState(0);

    /* ─── Map picker ─── */
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [mapCoords, setMapCoords] = useState(null);   // { lat, lng }
    const [mapUrl, setMapUrl] = useState(null);
    const [bookingFor, setBookingFor] = useState(null); // { name, phone } | null

    /* ─── Placing order ─── */
    const [placing, setPlacing] = useState(false);

    // Load saved addresses if logged in
    useEffect(() => {
        if (!user?.id) return;
        setLoadingAddr(true);
        fetchUserAddresses(user.id)
            .then((list) => {
                setAddresses(list);
                if (list.length > 0) {
                    const primary = list.find(a => a.isPrimary) ?? list[0];
                    setSelectedAddr(primary);
                    setShowForm(false);
                }
            })
            .catch(() => { })
            .finally(() => setLoadingAddr(false));
    }, [user?.id]);

    const set = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        setErrors(e => ({ ...e, [key]: undefined }));
    };

    const applyDiscount = () => {
        if (discountCode.toUpperCase() === 'BLOOM10') setDiscount(subtotal * 0.1);
        else if (discountCode.toUpperCase() === 'SAVE50') setDiscount(50);
        else Alert.alert('Invalid code', 'Discount code not recognised.');
    };

    const handleMapConfirm = ({ address, coords, mapUrl: mUrl, bookingFor: bf }) => {
        setShowMapPicker(false);
        if (coords) setMapCoords(coords);
        if (mUrl) setMapUrl(mUrl);
        if (address) {
            setForm(f => ({
                ...f,
                street: address.street || f.street,
                city: address.city || f.city,
                state: address.state || f.state,
                zipCode: address.zipCode || f.zipCode,
                country: address.country || f.country,
            }));
            setShowForm(true); // show form so user can review
        }
        setBookingFor(bf ?? null);
    };

    // Build address snapshot from either selected saved addr or form
    const buildAddressSnap = () => {
        if (!showForm && selectedAddr) {
            // parse firstName/lastName from user
            return {
                firstName: user?.firstName ?? '',
                lastName: user?.lastName ?? '',
                street: selectedAddr.street,
                city: selectedAddr.city,
                state: selectedAddr.state,
                zipCode: selectedAddr.zipCode,
                country: selectedAddr.country ?? 'India',
                phone: form.phone || (user?.phone ?? ''),
                lat: selectedAddr.lat ?? null,
                lng: selectedAddr.lng ?? null,
                mapUrl: selectedAddr.mapUrl ?? null,
            };
        }
        return {
            firstName: form.firstName,
            lastName: form.lastName,
            street: form.street,
            apartment: form.apartment,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
            country: form.country,
            phone: form.phone,
            lat: mapCoords?.lat ?? null,
            lng: mapCoords?.lng ?? null,
            mapUrl: mapUrl ?? null,
        };
    };

    const validate = () => {
        const e = {};
        if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
        if (showForm || !selectedAddr) {
            if (!mapCoords) e.map = 'Please pick your delivery location on the map first';
            if (!form.firstName.trim()) e.firstName = 'Required';
            if (!form.lastName.trim()) e.lastName = 'Required';
            if (!form.street.trim()) e.street = 'Required';
            if (!form.city.trim()) e.city = 'Required';
            if (!form.zipCode.match(/^\d{6}$/)) e.zipCode = '6-digit PIN required';
            if (!form.phone.match(/^\+?[\d\s\-]{10,}$/)) e.phone = 'Valid phone required';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handlePay = async () => {
        if (!validate()) return;
        if (items.length === 0) { Alert.alert('Cart empty', 'Add items before checking out.'); return; }

        setPlacing(true);
        try {
            const addrSnap = buildAddressSnap();
            const total = subtotal - discount + SHIPPING_FEE;

            let razorOrderId = null;

            if (payMethod === 'razorpay') {
                // Step 1: create Razorpay order on backend
                const rzOrder = await createRazorpayOrder(total);
                razorOrderId = rzOrder.id;

                if (rzOrder._mock) {
                    // Dev mode: skip real payment flow
                    Alert.alert(
                        '🧪 Dev Mode Payment',
                        `Mock Razorpay order: ${razorOrderId}\n\nIn production, the Razorpay payment sheet would open here.`,
                    );
                }
                // In production: open Razorpay checkout sheet with rzOrder.id
                // Requires react-native-razorpay or WebView integration
            }

            // Step 2: create order in Firestore
            const orderPayload = {
                userId: user?.id ?? null,
                email: form.email,
                items: items.map(i => ({
                    productId: i.id,
                    name: i.name,
                    image: i.image ?? null,
                    unit: i.unit ?? null,
                    price: i.price,
                    qty: i.qty,
                })),
                address: addrSnap,
                paymentMethod: payMethod,
                razorpayOrderId: razorOrderId,
                razorpayPaymentId: null,
                discountCode: discountCode || null,
                discountAmount: discount,
                subtotal,
                shippingAmount: SHIPPING_FEE,
                total,
                status: payMethod === 'cod' ? 'confirmed' : 'pending',
                bookingFor: bookingFor ?? null,
            };

            const created = await placeOrder(orderPayload);
            clearCart();
            navigation.replace('OrderSuccess', { orderId: created.id, total });
        } catch (err) {
            Alert.alert('Order failed', err.message ?? 'Please try again.');
        } finally {
            setPlacing(false);
        }
    };

    const leftPanel = (
        <View style={[styles.panel, isWide && styles.panelLeft]}>
            {/* ── Contact ── */}
            <Text style={styles.sectionHead}>Contact</Text>
            {user && (
                <View style={styles.contactRow}>
                    <Text style={styles.contactEmail}>
                        {(user.firstName?.[0] ?? '').toUpperCase()}
                    </Text>
                    <Text style={styles.contactText}>{user.email}</Text>
                    <TouchableOpacity><Text style={styles.linkTxt}>⋮</Text></TouchableOpacity>
                </View>
            )}
            {!user && (
                <Field error={errors.email}>
                    <TextInput
                        style={inp()}
                        placeholder="Email"
                        placeholderTextColor={COLORS.gray}
                        value={form.email}
                        onChangeText={v => set('email', v)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </Field>
            )}
            <TouchableOpacity
                style={styles.checkRow}
                onPress={() => set('emailOffers', !form.emailOffers)}
            >
                <View style={[styles.check, form.emailOffers && styles.checkOn]}>
                    {form.emailOffers && <Text style={styles.checkTick}>✓</Text>}
                </View>
                <Text style={styles.checkLabel}>Email me with news and offers</Text>
            </TouchableOpacity>

            {/* ── Delivery ── */}
            <Text style={[styles.sectionHead, { marginTop: 20 }]}>Delivery</Text>

            {/* Saved addresses (logged-in only) */}
            {loadingAddr && <ActivityIndicator color={GREEN} style={{ marginBottom: 12 }} />}
            {addresses.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                    {addresses.map(a => (
                        <AddressCard
                            key={a.id}
                            addr={a}
                            selected={!showForm && selectedAddr?.id === a.id}
                            onSelect={(addr) => { setSelectedAddr(addr); setShowForm(false); }}
                        />
                    ))}
                    <TouchableOpacity onPress={() => setShowForm(f => !f)} style={{ marginBottom: 12 }}>
                        <Text style={styles.linkTxt}>
                            {showForm ? '← Use a saved address' : '+ Use a different address'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Delivery form */}
            {(showForm || addresses.length === 0) && (
                <>
                    {/* Country */}
                    <Field label="Country / Region">
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ flex: 1, fontSize: SIZES.font, color: COLORS.black }}>{form.country}</Text>
                            <Text style={{ color: COLORS.gray }}>▾</Text>
                        </View>
                    </Field>

                    {/* First / Last name */}
                    <View style={fld.row}>
                        <Field label="First name" error={errors.firstName}>
                            <TextInput style={inp()} placeholder="First name" placeholderTextColor={COLORS.gray} value={form.firstName} onChangeText={v => set('firstName', v)} />
                        </Field>
                        <Field label="Last name" error={errors.lastName}>
                            <TextInput style={inp()} placeholder="Last name" placeholderTextColor={COLORS.gray} value={form.lastName} onChangeText={v => set('lastName', v)} />
                        </Field>
                    </View>

                    {/* Street */}
                    <Field label="Address" error={errors.street}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TextInput
                                style={[inp(), { flex: 1 }]}
                                placeholder="Address"
                                placeholderTextColor={COLORS.gray}
                                value={form.street}
                                onChangeText={v => set('street', v)}
                            />
                            <TouchableOpacity
                                onPress={() => setShowMapPicker(true)}
                                style={[styles.mapPickBtn, mapCoords && styles.mapPickBtnDone]}
                            >
                                <Text style={[styles.mapPickTxt, mapCoords && styles.mapPickTxtDone]}>
                                    {mapCoords ? '✓ Map' : '📍 Map'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Field>
                    {errors.map && <Text style={{ fontSize: 11, color: '#C0392B', marginTop: -8, marginBottom: 8 }}>{errors.map}</Text>}

                    {/* Apartment */}
                    <Field>
                        <TextInput style={inp()} placeholder="Apartment, suite, etc. (optional)" placeholderTextColor={COLORS.gray} value={form.apartment} onChangeText={v => set('apartment', v)} />
                    </Field>

                    {/* City / State / ZIP */}
                    <View style={fld.row}>
                        <Field label="City" error={errors.city}>
                            <TextInput style={inp()} placeholder="City" placeholderTextColor={COLORS.gray} value={form.city} onChangeText={v => set('city', v)} />
                        </Field>
                        <Field label="State">
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ flex: 1, fontSize: SIZES.font, color: COLORS.black }}>{form.state}</Text>
                                <Text style={{ color: COLORS.gray }}>▾</Text>
                            </View>
                        </Field>
                        <Field label="PIN code" error={errors.zipCode}>
                            <TextInput style={inp()} placeholder="PIN code" placeholderTextColor={COLORS.gray} keyboardType="number-pad" maxLength={6} value={form.zipCode} onChangeText={v => set('zipCode', v)} />
                        </Field>
                    </View>

                    {/* Phone */}
                    <Field label="Phone" error={errors.phone}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TextInput style={[inp(), { flex: 1 }]} placeholder="Phone" placeholderTextColor={COLORS.gray} keyboardType="phone-pad" value={form.phone} onChangeText={v => set('phone', v)} />
                            <Text style={{ color: COLORS.gray }}>ⓘ</Text>
                        </View>
                    </Field>

                    <TouchableOpacity style={styles.checkRow} onPress={() => set('textOffers', !form.textOffers)}>
                        <View style={[styles.check, form.textOffers && styles.checkOn]}>
                            {form.textOffers && <Text style={styles.checkTick}>✓</Text>}
                        </View>
                        <Text style={styles.checkLabel}>Text me with news and offers</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* ── Shipping method ── */}
            <Text style={[styles.sectionHead, { marginTop: 20, color: GREEN }]}>Shipping method</Text>
            <View style={styles.shippingBox}>
                <Text style={styles.shippingHint}>
                    {(showForm || addresses.length === 0)
                        ? 'Enter your shipping address to view available shipping methods.'
                        : '✓ Free standard delivery (3–5 business days)'}
                </Text>
            </View>

            {/* ── Payment ── */}
            <View style={{ marginTop: 20 }}>
                <PaymentSelector method={payMethod} setMethod={setPayMethod} />
            </View>

            {/* ── Pay button ── */}
            <TouchableOpacity
                style={[styles.payBtn, placing && styles.payBtnDisabled]}
                onPress={handlePay}
                disabled={placing}
            >
                {placing
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={styles.payTxt}>
                        {payMethod === 'cod' ? '📦 Place Order (COD)' : '🔒 Pay now'}
                    </Text>
                }
            </TouchableOpacity>

            {/* ── Shop more items button ── */}
            <TouchableOpacity
                style={styles.shopMoreBtn}
                onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
            >
                <Text style={styles.shopMoreTxt}>← Shop more items</Text>
            </TouchableOpacity>

            {/* Booking for someone else banner */}
            {bookingFor && (
                <View style={styles.bookingBanner}>
                    <Text style={styles.bookingBannerTxt}>
                        👤 Delivering to: <Text style={{ fontWeight: '700' }}>{bookingFor.name}</Text>{bookingFor.phone ? ` · ${bookingFor.phone}` : ''}
                    </Text>
                    <TouchableOpacity onPress={() => setBookingFor(null)}>
                        <Text style={{ color: GREEN, fontSize: 12, fontWeight: '600' }}>Remove</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const rightPanel = (
        <View style={[styles.panel, isWide && styles.panelRight]}>
            <OrderSummary
                items={items}
                subtotal={subtotal}
                discount={discount}
                shipping={SHIPPING_FEE}
                discountCode={discountCode}
                setDiscountCode={setDiscountCode}
                onApply={applyDiscount}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <Header />
            <ScrollView contentContainerStyle={styles.scroll}>
                {isWide ? (
                    <View style={styles.twoCol}>
                        {leftPanel}
                        {rightPanel}
                    </View>
                ) : (
                    <>
                        {rightPanel}
                        {leftPanel}
                    </>
                )}
            </ScrollView>

            <MapAddressPicker
                visible={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                onConfirm={handleMapConfirm}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.white },
    scroll: { flexGrow: 1 },
    twoCol: { flexDirection: 'row', alignItems: 'flex-start' },
    panel: { padding: SIZES.padding, paddingBottom: 40 },
    panelLeft: { flex: 1.1, borderRightWidth: 1, borderRightColor: '#EBEBEB' },
    panelRight: { flex: 0.9, backgroundColor: '#F8F8F6', minHeight: '100%', borderLeftWidth: 1, borderLeftColor: '#EBEBEB' },
    sectionHead: { fontSize: 20, fontWeight: '700', color: COLORS.black, marginBottom: 14 },
    contactRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: '#FAFAFA' },
    contactEmail: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#5B4FCF', color: '#FFF', textAlign: 'center', lineHeight: 28, fontWeight: '700', marginRight: 10, fontSize: 13 },
    contactText: { flex: 1, fontSize: 14, color: COLORS.black },
    linkTxt: { color: GREEN, fontSize: SIZES.font, fontWeight: '600' },
    checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    check: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#5B4FCF', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
    checkOn: { backgroundColor: '#5B4FCF' },
    checkTick: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    checkLabel: { fontSize: 14, color: COLORS.black },
    shippingBox: { backgroundColor: '#F4F4F4', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#E0E0E0' },
    shippingHint: { fontSize: 14, color: COLORS.gray, lineHeight: 20 },
    payBtn: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 18, alignItems: 'center', marginTop: 24 },
    payBtnDisabled: { opacity: 0.6 },
    payTxt: { color: '#FFF', fontWeight: '700', fontSize: 17 },
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
    mapPickBtn: {
        backgroundColor: '#E8F4F8',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#2196F3',
        flexShrink: 0,
    },
    mapPickTxt: { color: '#1565C0', fontSize: 12, fontWeight: '700' },
    mapPickBtnDone: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
    mapPickTxtDone: { color: '#15803D' },
    bookingBanner: {
        marginTop: 12,
        backgroundColor: '#FFF7ED',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#FBBF24',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bookingBannerTxt: { fontSize: 13, color: '#92400E', flex: 1 },
});

export default CheckoutScreen;
