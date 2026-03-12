import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import {
    fetchUserAddresses, createUserAddress,
    deleteAddress, setPrimaryAddress,
} from '../services/api';
import MapAddressPicker from '../components/MapAddressPicker';

const GREEN = '#1B4332';

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir',
    'Ladakh', 'Puducherry',
];

// ── Address card ──────────────────────────────────────────────────────────────
const AddressCard = ({ addr, onSetDefault, onDelete }) => (
    <View style={card.wrap}>
        <View style={card.header}>
            <View style={card.labelRow}>
                <Text style={card.label}>{addr.label ?? 'Home'}</Text>
                {addr.isPrimary && (
                    <View style={card.defaultBadge}>
                        <Text style={card.defaultText}>✓ Default</Text>
                    </View>
                )}
                {addr.lat && addr.lng && (
                    <Text style={{ fontSize: 12 }} title={`${addr.lat?.toFixed(5)}, ${addr.lng?.toFixed(5)}`}>📍</Text>
                )}
            </View>
            <View style={card.actions}>
                {!addr.isPrimary && (
                    <TouchableOpacity onPress={() => onSetDefault(addr.id)} style={card.actionBtn}>
                        <Text style={card.actionTxt}>Set default</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => onDelete(addr.id)} style={[card.actionBtn, card.deleteBtn]}>
                    <Text style={card.deleteTxt}>🗑</Text>
                </TouchableOpacity>
            </View>
        </View>
        <Text style={card.line}>{addr.street}</Text>
        <Text style={card.line}>{addr.city}, {addr.state} – {addr.zipCode}</Text>
        <Text style={card.line}>{addr.country ?? 'India'}</Text>
    </View>
);
const card = StyleSheet.create({
    wrap: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E8E8E8', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    label: { fontSize: 14, fontWeight: '700', color: COLORS.black },
    defaultBadge: { backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    defaultText: { fontSize: 11, color: GREEN, fontWeight: '700' },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#D0D0D0', backgroundColor: '#F7F7F7' },
    actionTxt: { fontSize: 12, color: COLORS.black, fontWeight: '600' },
    deleteBtn: { borderColor: '#FECACA', backgroundColor: '#FFF5F5' },
    deleteTxt: { fontSize: 13 },
    line: { fontSize: 14, color: '#444', lineHeight: 20 },
});

// ── Field helper ──────────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
    <View style={f.wrap}>
        <Text style={f.label}>{label}</Text>
        <View style={[f.box, error && f.boxErr]}>{children}</View>
        {error ? <Text style={f.err}>{error}</Text> : null}
    </View>
);
const inp = StyleSheet.create({ base: { fontSize: SIZES.font, color: COLORS.black, outlineStyle: 'none' } });
const f = StyleSheet.create({
    wrap: { marginBottom: 12 },
    label: { fontSize: 11, color: COLORS.gray, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
    box: { borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 8, backgroundColor: '#FAFAFA', paddingHorizontal: 12, paddingVertical: 10 },
    boxErr: { borderColor: '#C0392B', backgroundColor: '#FFF5F5' },
    err: { fontSize: 11, color: '#C0392B', marginTop: 3 },
});

// ── Add address form ──────────────────────────────────────────────────────────
const EMPTY_FORM = { label: 'Home', street: '', apartment: '', city: '', state: 'Karnataka', zipCode: '', country: 'India' };

const AddForm = ({ userId, onSaved, onCancel, saving, setSaving }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [showMap, setShowMap] = useState(false);
    const [mapCoords, setMapCoords] = useState(null);  // { lat, lng }

    const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: undefined })); };

    const handleMapConfirm = ({ address, coords }) => {
        setShowMap(false);
        if (coords) setMapCoords(coords);
        if (address) {
            setForm(f => ({
                ...f,
                street: address.street || f.street,
                city: address.city || f.city,
                state: address.state || f.state,
                zipCode: address.zipCode || f.zipCode,
                country: address.country || f.country,
            }));
        }
    };

    const validate = () => {
        const e = {};
        if (!mapCoords) e.map = 'Please pick location on map first';
        if (!form.street.trim()) e.street = 'Required';
        if (!form.city.trim()) e.city = 'Required';
        if (!form.zipCode.match(/^\d{6}$/)) e.zipCode = '6-digit PIN required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const street = form.street + (form.apartment ? `, ${form.apartment}` : '');
            await createUserAddress(userId, {
                label: form.label || 'Home',
                street,
                city: form.city,
                state: form.state,
                zipCode: form.zipCode,
                country: form.country,
                lat: mapCoords.lat,
                lng: mapCoords.lng,
            });
            onSaved();
        } catch (err) {
            Alert.alert('Error', err.message ?? 'Could not save address.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={addForm.wrap}>
            <Text style={addForm.heading}>New Address</Text>

            {/* ── Map picker CTA (mandatory) ── */}
            <TouchableOpacity
                style={[addForm.mapBtn, mapCoords && addForm.mapBtnDone]}
                onPress={() => setShowMap(true)}
            >
                <Text style={addForm.mapBtnTxt}>
                    {mapCoords ? '✓ Location selected — tap to change' : '📍 Pick Location on Map (required)'}
                </Text>
            </TouchableOpacity>
            {errors.map && <Text style={f.err}>{errors.map}</Text>}

            <Field label="Label (e.g. Home, Work)">
                <TextInput style={inp.base} placeholder="Home" placeholderTextColor={COLORS.gray} value={form.label} onChangeText={v => set('label', v)} />
            </Field>

            <Field label="Street address" error={errors.street}>
                <TextInput style={inp.base} placeholder="123, MG Road" placeholderTextColor={COLORS.gray} value={form.street} onChangeText={v => set('street', v)} />
            </Field>

            <Field label="Apartment / Suite (optional)">
                <TextInput style={inp.base} placeholder="Flat 4B, 2nd Floor" placeholderTextColor={COLORS.gray} value={form.apartment} onChangeText={v => set('apartment', v)} />
            </Field>

            <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                    <Field label="City" error={errors.city}>
                        <TextInput style={inp.base} placeholder="Bengaluru" placeholderTextColor={COLORS.gray} value={form.city} onChangeText={v => set('city', v)} />
                    </Field>
                </View>
                <View style={{ flex: 1 }}>
                    <Field label="PIN code" error={errors.zipCode}>
                        <TextInput style={inp.base} placeholder="560001" placeholderTextColor={COLORS.gray} keyboardType="number-pad" maxLength={6} value={form.zipCode} onChangeText={v => set('zipCode', v)} />
                    </Field>
                </View>
            </View>

            <Field label="State">
                <Text style={{ fontSize: SIZES.font, color: COLORS.black }}>{form.state} ▾</Text>
            </Field>

            <View style={addForm.btns}>
                <TouchableOpacity style={addForm.cancelBtn} onPress={onCancel}>
                    <Text style={addForm.cancelTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[addForm.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                    {saving
                        ? <ActivityIndicator color="#FFF" size="small" />
                        : <Text style={addForm.saveTxt}>Save Address</Text>
                    }
                </TouchableOpacity>
            </View>

            <MapAddressPicker
                visible={showMap}
                onClose={() => setShowMap(false)}
                onConfirm={handleMapConfirm}
            />
        </View>
    );
};
const addForm = StyleSheet.create({
    wrap: { backgroundColor: '#F0F7F4', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#C8E6C9' },
    heading: { fontSize: 16, fontWeight: '700', color: GREEN, marginBottom: 14 },
    mapBtn: {
        backgroundColor: '#EEF2FF',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#C7D2FE',
        borderStyle: 'dashed',
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 14,
    },
    mapBtnDone: {
        backgroundColor: '#F0FDF4',
        borderColor: '#86EFAC',
        borderStyle: 'solid',
    },
    mapBtnTxt: { fontSize: 14, fontWeight: '700', color: '#4338CA' },
    btns: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: COLORS.white },
    cancelTxt: { fontSize: SIZES.font, color: COLORS.black, fontWeight: '600' },
    saveBtn: { flex: 1, backgroundColor: GREEN, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    saveTxt: { fontSize: SIZES.font, color: '#FFF', fontWeight: '700' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
const AddressScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        fetchUserAddresses(user.id)
            .then(setAddresses)
            .catch(() => setAddresses([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { if (user?.id) load(); }, [user?.id]);

    const handleDelete = (addrId) => {
        Alert.alert('Delete address', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteAddress(addrId);
                        load();
                    } catch (err) {
                        Alert.alert('Error', err.message ?? 'Could not delete.');
                    }
                },
            },
        ]);
    };

    const handleSetDefault = async (addrId) => {
        try {
            await setPrimaryAddress(user.id, addrId);
            load();
        } catch (err) {
            Alert.alert('Error', err.message ?? 'Could not update default.');
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <Header />
            <ScrollView contentContainerStyle={styles.scroll}>

                {/* Back row */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
                    <Text style={styles.backTxt}>← Back</Text>
                </TouchableOpacity>

                <View style={styles.titleRow}>
                    <Text style={styles.title}>My Addresses</Text>
                    {!showForm && (
                        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
                            <Text style={styles.addTxt}>+ Add New</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Add form */}
                {showForm && (
                    <AddForm
                        userId={user.id}
                        onSaved={() => { setShowForm(false); load(); }}
                        onCancel={() => setShowForm(false)}
                        saving={saving}
                        setSaving={setSaving}
                    />
                )}

                {/* Address list */}
                {loading ? (
                    <ActivityIndicator color={GREEN} style={{ marginTop: 32 }} />
                ) : addresses.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📍</Text>
                        <Text style={styles.emptyTitle}>No saved addresses</Text>
                        <Text style={styles.emptySub}>Add a delivery address to speed up checkout.</Text>
                        <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowForm(true)}>
                            <Text style={styles.emptyAddTxt}>+ Add Address</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    addresses.map(a => (
                        <AddressCard
                            key={a.id}
                            addr={a}
                            onSetDefault={handleSetDefault}
                            onDelete={handleDelete}
                        />
                    ))
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F6F8F6' },
    scroll: { padding: SIZES.padding, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center' },
    backRow: { marginBottom: 8 },
    backTxt: { fontSize: SIZES.font, color: GREEN, fontWeight: '600' },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 22, fontWeight: '800', color: COLORS.black },
    addBtn: { backgroundColor: GREEN, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
    addTxt: { color: '#FFF', fontWeight: '700', fontSize: SIZES.font },
    empty: { alignItems: 'center', paddingVertical: 48 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 6 },
    emptySub: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 20 },
    emptyAddBtn: { backgroundColor: GREEN, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
    emptyAddTxt: { color: '#FFF', fontWeight: '700', fontSize: SIZES.font },
});

export default AddressScreen;
