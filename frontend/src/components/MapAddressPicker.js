/**
 * MapAddressPicker.js — native fallback
 * On native platforms (iOS/Android), show a simple manual form
 * since Leaflet/iframe is not available.
 */
import React, { useState } from 'react';
import {
    Modal, View, Text, TouchableOpacity, TextInput,
    StyleSheet, ScrollView,
} from 'react-native';

const GREEN = '#1B4332';

const MapAddressPicker = ({ visible, onClose, onConfirm }) => {
    const [form, setForm] = useState({ street: '', city: '', state: '', zipCode: '', country: 'India' });
    const [forSomeoneElse, setForSomeoneElse] = useState(false);
    const [recipient, setRecipient] = useState({ name: '', phone: '' });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const isValid = form.street && form.city && form.zipCode;

    const handleConfirm = () => onConfirm({
        address: form,
        coords: null,
        bookingFor: forSomeoneElse ? recipient : null,
    });

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.overlay}>
                <View style={s.sheet}>
                    <View style={s.header}>
                        <Text style={s.title}>📍 Enter Delivery Location</Text>
                        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                            <Text style={s.closeTxt}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ padding: 20 }}>
                        {['street', 'city', 'state', 'zipCode', 'country'].map(k => (
                            <TextInput
                                key={k}
                                style={s.input}
                                placeholder={k.charAt(0).toUpperCase() + k.slice(1)}
                                placeholderTextColor="#aaa"
                                value={form[k]}
                                onChangeText={v => set(k, v)}
                            />
                        ))}

                        <TouchableOpacity style={s.toggleRow} onPress={() => setForSomeoneElse(v => !v)}>
                            <View style={[s.checkbox, forSomeoneElse && s.checkboxOn]}>
                                {forSomeoneElse && <Text style={s.checkTick}>✓</Text>}
                            </View>
                            <Text style={s.toggleLabel}>Booking for someone else</Text>
                        </TouchableOpacity>

                        {forSomeoneElse && (
                            <>
                                <TextInput style={s.input} placeholder="Recipient name" placeholderTextColor="#aaa"
                                    value={recipient.name} onChangeText={v => setRecipient(r => ({ ...r, name: v }))} />
                                <TextInput style={[s.input, { marginTop: 8 }]} placeholder="Recipient phone" placeholderTextColor="#aaa"
                                    keyboardType="phone-pad" value={recipient.phone} onChangeText={v => setRecipient(r => ({ ...r, phone: v }))} />
                            </>
                        )}

                        <TouchableOpacity
                            style={[s.confirmBtn, !isValid && s.confirmDisabled]}
                            onPress={handleConfirm}
                            disabled={!isValid}
                        >
                            <Text style={s.confirmTxt}>✓  Confirm Location</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: 24 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    title: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    closeTxt: { fontSize: 14, color: '#555', fontWeight: '700' },
    input: { borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1a1a1a', marginBottom: 10 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 12 },
    checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: GREEN, justifyContent: 'center', alignItems: 'center' },
    checkboxOn: { backgroundColor: GREEN },
    checkTick: { color: '#fff', fontSize: 12, fontWeight: '800' },
    toggleLabel: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
    confirmBtn: { backgroundColor: GREEN, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    confirmDisabled: { backgroundColor: '#ccc' },
    confirmTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default MapAddressPicker;
