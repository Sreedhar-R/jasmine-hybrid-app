/**
 * MapAddressPicker.web.js
 * Web implementation using @react-google-maps/api.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
    Modal, View, Text, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const GREEN = '#1B4332';
const DEFAULT_LAT = 12.9716;   // Bengaluru
const DEFAULT_LNG = 77.5946;

// Fallback to the Firebase API Key which usually has Maps enabled
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 
                           process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 
                           "AIzaSyBNXzm_REKtMBnApgHu71S7E2rI1e3lj50";

const MAP_CONTAINER_STYLE = {
    width: '100%',
    height: '100%',
};

const LIBRARIES = ['places'];

const MapAddressPicker = ({ visible, onClose, onConfirm }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    const [parsedAddr, setParsedAddr] = useState(null);
    const [geocoding, setGeocoding] = useState(false);
    const [locLoading, setLocLoading] = useState(false);
    const [locError, setLocError] = useState('');

    // "Booking for someone else"
    const [forSomeoneElse, setForSomeoneElse] = useState(false);
    const [recipient, setRecipient] = useState({ name: '', phone: '' });

    const reverseGeocode = useCallback((lat, lng) => {
        if (!window.google) return;
        setGeocoding(true);
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const addr = results[0].address_components;
                const getComp = (type) => addr.find(c => c.types.includes(type))?.long_name || '';
                
                setParsedAddr({
                    street: results[0].formatted_address.split(',')[0] || getComp('route'),
                    city: getComp('locality') || getComp('administrative_area_level_2'),
                    state: getComp('administrative_area_level_1'),
                    zipCode: getComp('postal_code'),
                    country: getComp('country') || 'India',
                });
            } else {
                console.error('Geocode failed:', status);
            }
            setGeocoding(false);
        });
    }, []);

    // Reverse geocode on open or when coords change externally
    useEffect(() => {
        if (visible && isLoaded) {
            reverseGeocode(coords.lat, coords.lng);
        }
    }, [visible, isLoaded, reverseGeocode]);

    const onMapClick = useCallback((e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setCoords({ lat, lng });
        reverseGeocode(lat, lng);
    }, [reverseGeocode]);

    const onMarkerDragEnd = useCallback((e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setCoords({ lat, lng });
        reverseGeocode(lat, lng);
    }, [reverseGeocode]);

    const useMyLocation = () => {
        setLocError('');
        if (!navigator?.geolocation) {
            setLocError('Geolocation not supported by your browser.');
            return;
        }
        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setCoords({ lat, lng });
                reverseGeocode(lat, lng);
                setLocLoading(false);
            },
            (err) => {
                setLocLoading(false);
                if (err.code === 1) {
                    setLocError('Location access denied. Allow location in browser settings.');
                } else {
                    setLocError('Could not get your location.');
                }
            },
            { enableHighAccuracy: true, timeout: 12000 }
        );
    };

    const handleConfirm = () => {
        onConfirm({
            address: parsedAddr,
            coords,
            bookingFor: forSomeoneElse ? recipient : null,
        });
    };

    const reset = () => {
        setCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        setParsedAddr(null);
        setGeocoding(false);
        setLocLoading(false);
        setLocError('');
        setForSomeoneElse(false);
        setRecipient({ name: '', phone: '' });
    };

    const handleClose = () => { reset(); onClose(); };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={s.overlay}>
                <View style={s.sheet}>
                    {/* Header */}
                    <View style={s.header}>
                        <Text style={s.title}>📍 Choose Delivery Location</Text>
                        <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
                            <Text style={s.closeTxt}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                        {/* Map Container */}
                        <View style={s.mapWrap}>
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={MAP_CONTAINER_STYLE}
                                    center={coords}
                                    zoom={15}
                                    onClick={onMapClick}
                                    options={{
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                        mapTypeControl: false,
                                        streetViewControl: false,
                                        fullscreenControl: false,
                                    }}
                                >
                                    <Marker 
                                        position={coords} 
                                        draggable={true} 
                                        onDragEnd={onMarkerDragEnd}
                                        animation={window.google?.maps.Animation.DROP}
                                    />
                                </GoogleMap>
                            ) : (
                                <View style={s.mapLoading}>
                                    <ActivityIndicator size="large" color={GREEN} />
                                    {loadError && (
                                        <Text style={s.loadError}>
                                            Map Load Error. Check API Key or Internet.
                                        </Text>
                                    )}
                                    <Text style={s.addrHint}>Loading Google Maps...</Text>
                                </View>
                            )}
                        </View>

                        {/* Use my location */}
                        <TouchableOpacity
                            style={[s.locBtn, locLoading && s.locBtnDisabled]}
                            onPress={useMyLocation}
                            disabled={locLoading}
                        >
                            {locLoading
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={s.locTxt}>🎯  Use My Location</Text>
                            }
                        </TouchableOpacity>

                        {locError ? <Text style={s.locError}>{locError}</Text> : null}

                        {/* Resolved address */}
                        <View style={s.addrBox}>
                            {geocoding ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <ActivityIndicator size="small" color={GREEN} />
                                    <Text style={s.addrHint}>Finding address…</Text>
                                </View>
                            ) : parsedAddr ? (
                                <View>
                                    <Text style={s.addrLabel}>Selected Location</Text>
                                    <Text style={s.addrLine}>
                                        {[parsedAddr.street, parsedAddr.city].filter(Boolean).join(', ')}
                                    </Text>
                                    {(parsedAddr.state || parsedAddr.zipCode) ? (
                                        <Text style={s.addrLine}>
                                            {[parsedAddr.state, parsedAddr.zipCode].filter(Boolean).join(' – ')}
                                        </Text>
                                    ) : null}
                                    <Text style={s.addrLine2}>{parsedAddr.country}</Text>
                                </View>
                            ) : (
                                <Text style={s.addrHint}>
                                    Tap on the map or drag the 📍 pin to set your delivery location
                                </Text>
                            )}
                        </View>

                        {/* Booking for someone else */}
                        <TouchableOpacity
                            style={s.toggleRow}
                            onPress={() => setForSomeoneElse(v => !v)}
                            activeOpacity={0.7}
                        >
                            <View style={[s.checkbox, forSomeoneElse && s.checkboxOn]}>
                                {forSomeoneElse && <Text style={s.checkTick}>✓</Text>}
                            </View>
                            <View>
                                <Text style={s.toggleLabel}>Booking for someone else</Text>
                                <Text style={s.toggleSub}>Add recipient's name and phone number</Text>
                            </View>
                        </TouchableOpacity>

                        {forSomeoneElse && (
                            <View style={s.recipientBox}>
                                <Text style={s.recipientTitle}>👤 Recipient Details</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="Recipient's full name"
                                    placeholderTextColor="#aaa"
                                    value={recipient.name}
                                    onChangeText={v => setRecipient(r => ({ ...r, name: v }))}
                                />
                                <TextInput
                                    style={[s.input, { marginTop: 10 }]}
                                    placeholder="Recipient's phone number"
                                    placeholderTextColor="#aaa"
                                    keyboardType="phone-pad"
                                    value={recipient.phone}
                                    onChangeText={v => setRecipient(r => ({ ...r, phone: v }))}
                                />
                            </View>
                        )}

                        {/* Confirm button */}
                        <TouchableOpacity
                            style={[s.confirmBtn, !parsedAddr && s.confirmDisabled]}
                            onPress={handleConfirm}
                            disabled={!parsedAddr}
                        >
                            <Text style={s.confirmTxt}>
                                {parsedAddr ? '✓  Confirm Location' : 'Select a location on the map'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '92%',
        paddingBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1a1a1a',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeTxt: { fontSize: 14, color: '#555', fontWeight: '700' },

    // Map
    mapWrap: {
        width: '100%',
        height: 320,
        backgroundColor: '#f5f5f5',
    },
    mapLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadError: {
        color: '#C0392B',
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 40,
    },

    // Location button
    locBtn: {
        marginHorizontal: 20,
        marginTop: 14,
        backgroundColor: '#2196F3',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    locBtnDisabled: { opacity: 0.6 },
    locTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
    locError: {
        marginHorizontal: 20,
        marginTop: 6,
        fontSize: 12,
        color: '#C0392B',
        lineHeight: 18,
    },

    // Address box
    addrBox: {
        marginHorizontal: 20,
        marginTop: 14,
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        minHeight: 56,
        justifyContent: 'center',
    },
    addrLabel: { fontSize: 11, color: '#888', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
    addrLine: { fontSize: 14, color: '#1a1a1a', lineHeight: 21, fontWeight: '500' },
    addrLine2: { fontSize: 12, color: '#888', marginTop: 2 },
    addrHint: { fontSize: 13, color: '#aaa', lineHeight: 19, textAlign: 'center' },

    // Someone else toggle
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginHorizontal: 20,
        marginTop: 16,
        gap: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: GREEN,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
        flexShrink: 0,
    },
    checkboxOn: { backgroundColor: GREEN },
    checkTick: { color: '#fff', fontSize: 12, fontWeight: '800' },
    toggleLabel: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
    toggleSub: { fontSize: 12, color: '#888', marginTop: 2 },

    // Recipient box
    recipientBox: {
        marginHorizontal: 20,
        marginTop: 12,
        backgroundColor: '#F8F0E8',
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E8D8C0',
    },
    recipientTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D0D0D0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1a1a1a',
        outlineStyle: 'none',
    },

    // Confirm
    confirmBtn: {
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: GREEN,
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
    },
    confirmDisabled: { backgroundColor: '#ccc' },
    confirmTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default MapAddressPicker;
