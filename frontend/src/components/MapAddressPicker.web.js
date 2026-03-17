/**
 * MapAddressPicker.web.js
 * Web implementation using @react-google-maps/api.
 * Layout: Split screen (25% Map Left / 75% Details Right) for desktop/web.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
    Modal, View, Text, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, ScrollView, Dimensions, useWindowDimensions
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
    const { width: windowWidth } = useWindowDimensions();
    const isDesktop = windowWidth > 768;

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
                    formatted: results[0].formatted_address
                });
            } else {
                console.error('Geocode failed:', status);
            }
            setGeocoding(false);
        });
    }, []);

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
        setLocLoading(false);
        setLocError('');
        setForSomeoneElse(false);
        setRecipient({ name: '', phone: '' });
    };

    const handleClose = () => { reset(); onClose(); };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={s.overlay}>
                <View style={[s.sheet, isDesktop && s.desktopSheet]}>
                    {/* Header */}
                    <View style={s.header}>
                        <Text style={s.title}>📍 Choose Delivery Location</Text>
                        <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
                            <Text style={s.closeTxt}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[s.contentRow, !isDesktop && s.contentColumn]}>
                        {/* Map (25% on Desktop) */}
                        <View style={[s.mapWrap, isDesktop ? s.mapDesktop : s.mapMobile]}>
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
                                        <Text style={s.loadError}>Map Error. Check API Key.</Text>
                                    )}
                                    <Text style={s.addrHint}>Loading Maps...</Text>
                                </View>
                            )}
                            {!isDesktop && (
                                <TouchableOpacity
                                    style={s.floatingLocBtn}
                                    onPress={useMyLocation}
                                    disabled={locLoading}
                                >
                                    {locLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{fontSize: 20}}>🎯</Text>}
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Details (75% on Desktop) */}
                        <ScrollView 
                            style={[s.detailsWrap, isDesktop && s.detailsDesktop]} 
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={{ padding: isDesktop ? 30 : 20 }}>
                                <Text style={s.sectionTitle}>Delivery Details</Text>
                                
                                {isDesktop && (
                                    <TouchableOpacity
                                        style={[s.locBtn, locLoading && s.locBtnDisabled]}
                                        onPress={useMyLocation}
                                        disabled={locLoading}
                                    >
                                        {locLoading
                                            ? <ActivityIndicator size="small" color="#fff" />
                                            : <Text style={s.locTxt}>🎯  Use My Current Location</Text>
                                        }
                                    </TouchableOpacity>
                                )}
                                {locError ? <Text style={s.locError}>{locError}</Text> : null}

                                {/* Resolved address */}
                                <View style={s.addrBox}>
                                    {geocoding ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <ActivityIndicator size="small" color={GREEN} />
                                            <Text style={s.addrHint}>Finding address…</Text>
                                        </View>
                                    ) : parsedAddr ? (
                                        <View>
                                            <Text style={s.addrLabel}>Selected Address</Text>
                                            <Text style={s.addrLine}>{parsedAddr.formatted || parsedAddr.street}</Text>
                                            <View style={s.badgeRow}>
                                                <View style={s.cityBadge}><Text style={s.badgeText}>{parsedAddr.city}</Text></View>
                                                {parsedAddr.zipCode && (
                                                    <View style={s.zipBadge}><Text style={s.badgeText}>{parsedAddr.zipCode}</Text></View>
                                                )}
                                            </View>
                                        </View>
                                    ) : (
                                        <Text style={s.addrHint}>
                                            {isDesktop 
                                                ? "Select a point on the left map to set your location" 
                                                : "Tap map or drag pin to set location"}
                                        </Text>
                                    )}
                                </View>

                                {/* Someone Else Toggle */}
                                <TouchableOpacity
                                    style={s.toggleRow}
                                    onPress={() => setForSomeoneElse(v => !v)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[s.checkbox, forSomeoneElse && s.checkboxOn]}>
                                        {forSomeoneElse && <Text style={s.checkTick}>✓</Text>}
                                    </View>
                                    <View>
                                        <Text style={s.toggleLabel}>Booking for someone else?</Text>
                                        <Text style={s.toggleSub}>Add recipient info for smooth delivery</Text>
                                    </View>
                                </TouchableOpacity>

                                {forSomeoneElse && (
                                    <View style={s.recipientBox}>
                                        <TextInput
                                            style={s.input}
                                            placeholder="Recipient's Name"
                                            placeholderTextColor="#aaa"
                                            value={recipient.name}
                                            onChangeText={v => setRecipient(r => ({ ...r, name: v }))}
                                        />
                                        <TextInput
                                            style={[s.input, { marginTop: 15 }]}
                                            placeholder="Recipient's Phone Number"
                                            placeholderTextColor="#aaa"
                                            keyboardType="phone-pad"
                                            value={recipient.phone}
                                            onChangeText={v => setRecipient(r => ({ ...r, phone: v }))}
                                        />
                                    </View>
                                )}

                                {/* Confirm section */}
                                <View style={s.buttonRow}>
                                    <TouchableOpacity 
                                        style={s.cancelBtn} 
                                        onPress={handleClose}
                                    >
                                        <Text style={s.cancelTxt}>Cancel</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={[s.confirmBtn, !parsedAddr && s.confirmDisabled]}
                                        onPress={handleConfirm}
                                        disabled={!parsedAddr}
                                    >
                                        <Text style={s.confirmTxt}>
                                            {parsedAddr ? '✓  Confirm Location' : 'Select Location'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    sheet: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 500,
        overflow: 'hidden',
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    desktopSheet: {
        maxWidth: 1400,
        height: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: GREEN,
        letterSpacing: -0.5,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeTxt: { fontSize: 14, color: '#333', fontWeight: 'bold' },

    contentRow: {
        flex: 1,
        flexDirection: 'row',
    },
    contentColumn: {
        flexDirection: 'column',
    },

    // Map Section
    mapWrap: {
        backgroundColor: '#f0f0f0',
        position: 'relative',
    },
    mapDesktop: {
        width: '75%',
        height: '100%',
        borderRightWidth: 1,
        borderRightColor: '#eee',
    },
    mapMobile: {
        width: '100%',
        height: 300,
    },
    floatingLocBtn: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#fff',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },

    // Details Section
    detailsWrap: {
        backgroundColor: '#fff',
    },
    detailsDesktop: {
        width: '25%',
        height: '100%',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 15,
    },

    locBtn: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        marginBottom: 20,
    },
    locBtnDisabled: { opacity: 0.6 },
    locTxt: { color: '#2563eb', fontWeight: '700', fontSize: 14 },
    locError: { color: '#dc2626', fontSize: 13, marginBottom: 15 },

    addrBox: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    addrLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    addrLine: { fontSize: 16, color: '#1e293b', fontWeight: '600', lineHeight: 24 },
    addrHint: { fontSize: 14, color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    cityBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    zipBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 12, color: '#475569', fontWeight: '600' },

    toggleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 15,
        marginBottom: 25,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: GREEN,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxOn: { backgroundColor: GREEN },
    checkTick: { color: '#fff', fontSize: 14, fontWeight: '900' },
    toggleLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
    toggleSub: { fontSize: 13, color: '#64748b', marginTop: 3 },

    recipientBox: {
        backgroundColor: '#fff7ed',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#ffedd5',
        marginBottom: 25,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1e293b',
    },

    buttonRow: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 10,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    cancelTxt: { color: '#64748b', fontWeight: '700', fontSize: 15 },
    confirmBtn: {
        flex: 2,
        backgroundColor: GREEN,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    confirmDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0 },
    confirmTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default MapAddressPicker;
