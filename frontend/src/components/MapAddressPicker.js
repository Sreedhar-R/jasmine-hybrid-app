/**
 * MapAddressPicker.js
 * Native implementation using react-native-maps (Google Maps provider).
 */
import React, { useState, useEffect } from 'react';
import {
    Modal, View, Text, TouchableOpacity, TextInput,
    StyleSheet, ScrollView, ActivityIndicator, Dimensions
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width } = Dimensions.get('window');
const GREEN = '#1B4332';
const DEFAULT_LAT = 12.9716;   // Bengaluru
const DEFAULT_LNG = 77.5946;

const MapAddressPicker = ({ visible, onClose, onConfirm }) => {
    const [region, setRegion] = useState({
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
    });
    
    const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    const [parsedAddr, setParsedAddr] = useState(null);
    const [geocoding, setGeocoding] = useState(false);

    const [forSomeoneElse, setForSomeoneElse] = useState(false);
    const [recipient, setRecipient] = useState({ name: '', phone: '' });

    const reverseGeocode = async (lat, lng) => {
        setGeocoding(true);
        try {
            // Using Osm Nominatim for geocoding on native to avoid needing even more Google API setup
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
            const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'BloomApp/1.0' } });
            const geo = await res.json();
            if (geo.address) {
                const a = geo.address;
                setParsedAddr({
                    street: [a.house_number, a.road].filter(Boolean).join(' ') || a.suburb || '',
                    city: a.city || a.town || a.village || '',
                    state: a.state || '',
                    zipCode: a.postcode || '',
                    country: a.country || 'India',
                });
            }
        } catch (_) {}
        setGeocoding(false);
    };

    useEffect(() => {
        if (visible) {
            reverseGeocode(coords.lat, coords.lng);
        }
    }, [visible]);

    const generateMapUrl = (lat, lng) => {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    };

    const handleConfirm = () => {
        onConfirm({
            address: parsedAddr,
            coords,
            mapUrl: generateMapUrl(coords.lat, coords.lng),
            bookingFor: forSomeoneElse ? recipient : null,
        });
    };

    const reset = () => {
        setCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        setParsedAddr(null);
        setGeocoding(false);
        setForSomeoneElse(false);
        setRecipient({ name: '', phone: '' });
    };

    const handleClose = () => { reset(); onClose(); };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={s.overlay}>
                <View style={s.sheet}>
                    <View style={s.header}>
                        <Text style={s.title}>📍 Choose Delivery Location</Text>
                        <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
                            <Text style={s.closeTxt}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={s.mapWrap}>
                            <MapView
                                provider={PROVIDER_GOOGLE}
                                style={s.map}
                                initialRegion={region}
                                onRegionChangeComplete={(r) => {
                                    setCoords({ lat: r.latitude, lng: r.longitude });
                                    reverseGeocode(r.latitude, r.longitude);
                                }}
                            >
                                <Marker 
                                    coordinate={{ latitude: coords.lat, longitude: coords.lng }} 
                                    draggable
                                    onDragEnd={(e) => {
                                        const c = e.nativeEvent.coordinate;
                                        setCoords({ lat: c.latitude, lng: c.longitude });
                                        reverseGeocode(c.latitude, c.longitude);
                                    }}
                                />
                            </MapView>
                            <View style={s.centerMarker}>
                                <Text style={{fontSize: 30}}>📍</Text>
                            </View>
                        </View>

                        <View style={s.addrBox}>
                            {geocoding ? (
                                <ActivityIndicator size="small" color={GREEN} />
                            ) : parsedAddr ? (
                                <View>
                                    <Text style={s.addrLabel}>Selected Location</Text>
                                    <Text style={s.addrLine}>
                                        {[parsedAddr.street, parsedAddr.city].filter(Boolean).join(', ')}
                                    </Text>
                                    <Text style={s.addrLine2}>{parsedAddr.country}</Text>
                                </View>
                            ) : (
                                <Text style={s.addrHint}>Move map to set location</Text>
                            )}
                        </View>

                        <TouchableOpacity style={s.toggleRow} onPress={() => setForSomeoneElse(v => !v)}>
                            <View style={[s.checkbox, forSomeoneElse && s.checkboxOn]}>
                                {forSomeoneElse && <Text style={s.checkTick}>✓</Text>}
                            </View>
                            <Text style={s.toggleLabel}>Booking for someone else</Text>
                        </TouchableOpacity>

                        {forSomeoneElse && (
                            <View style={s.recipientBox}>
                                <TextInput
                                    style={s.input}
                                    placeholder="Recipient Name"
                                    value={recipient.name}
                                    onChangeText={v => setRecipient(r => ({ ...r, name: v }))}
                                />
                                <TextInput
                                    style={[s.input, { marginTop: 10 }]}
                                    placeholder="Recipient Phone"
                                    keyboardType="phone-pad"
                                    value={recipient.phone}
                                    onChangeText={v => setRecipient(r => ({ ...r, phone: v }))}
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={[s.confirmBtn, !parsedAddr && s.confirmDisabled]}
                            onPress={handleConfirm}
                            disabled={!parsedAddr}
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
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 24 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    title: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    closeTxt: { fontSize: 14, color: '#555', fontWeight: '700' },
    mapWrap: { width: '100%', height: 300, position: 'relative' },
    map: { ...StyleSheet.absoluteFillObject },
    centerMarker: { position: 'absolute', top: '50%', left: '50%', marginTop: -35, marginLeft: -15, pointerEvents: 'none' },
    addrBox: { margin: 20, backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10 },
    addrLabel: { fontSize: 10, color: '#888', fontWeight: 'bold', marginBottom: 5 },
    addrLine: { fontSize: 14, color: '#333' },
    addrLine2: { fontSize: 12, color: '#999', marginTop: 2 },
    addrHint: { color: '#aaa', textAlign: 'center' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 15 },
    checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: GREEN, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
    checkboxOn: { backgroundColor: GREEN },
    checkTick: { color: '#fff', fontWeight: 'bold' },
    toggleLabel: { fontSize: 14, fontWeight: '600' },
    recipientBox: { marginHorizontal: 20, marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 },
    confirmBtn: { backgroundColor: GREEN, marginHorizontal: 20, padding: 16, borderRadius: 10, alignItems: 'center' },
    confirmDisabled: { backgroundColor: '#ccc' },
    confirmTxt: { color: '#fff', fontWeight: 'bold' }
});

export default MapAddressPicker;
