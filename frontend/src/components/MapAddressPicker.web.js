/**
 * MapAddressPicker.web.js
 * Web-only implementation using Leaflet.js in an iframe.
 * Communicates via postMessage bridge.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    Modal, View, Text, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';

const GREEN = '#1B4332';
const DEFAULT_LAT = 12.9716;   // Bengaluru
const DEFAULT_LNG = 77.5946;

// ── Leaflet HTML injected into the iframe ─────────────────────────────────────
const buildLeafletHTML = (lat, lng) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
    .pin-hint {
      position:absolute; bottom:8px; left:50%; transform:translateX(-50%);
      background:rgba(0,0,0,0.6); color:#fff; font-size:12px;
      padding:4px 12px; border-radius:12px; z-index:1000; pointer-events:none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="pin-hint">Tap map or drag pin to set location</div>
  <script>
    var lat = ${lat}, lng = ${lng};
    var map = L.map('map', { zoomControl: true }).setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var icon = L.divIcon({
      html: '<div style="font-size:32px;line-height:1;margin-top:-32px;margin-left:-12px;">📍</div>',
      className: '', iconSize: [24, 32], iconAnchor: [12, 32]
    });

    var marker = L.marker([lat, lng], { draggable: true, icon: icon }).addTo(map);

    function send(la, ln) {
      window.parent.postMessage(JSON.stringify({ type: 'coords', lat: la, lng: ln }), '*');
    }

    marker.on('dragend', function(e) {
      var p = e.target.getLatLng();
      send(p.lat, p.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      send(e.latlng.lat, e.latlng.lng);
    });

    window.addEventListener('message', function(e) {
      try {
        var d = JSON.parse(e.data);
        if (d.type === 'move') {
          marker.setLatLng([d.lat, d.lng]);
          map.setView([d.lat, d.lng], 16, { animate: true });
          send(d.lat, d.lng);
        }
      } catch(_) {}
    });
  </script>
</body>
</html>`;

// ── Nominatim reverse geocode ─────────────────────────────────────────────────
async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'BloomApp/1.0' },
    });
    return res.json();
}

function parseAddress(geo) {
    if (!geo?.address) return null;
    const a = geo.address;
    const road = [a.house_number, a.road].filter(Boolean).join(' ');
    const street = road || a.suburb || a.neighbourhood || a.quarter || '';
    const city = a.city || a.town || a.village || a.county || '';
    const state = a.state || '';
    const zipCode = a.postcode || '';
    const country = a.country || 'India';
    return { street, city, state, zipCode, country };
}

// ── Component ─────────────────────────────────────────────────────────────────
const MapAddressPicker = ({ visible, onClose, onConfirm }) => {
    const iframeRef = useRef(null);

    const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    const [parsedAddr, setParsedAddr] = useState(null);
    const [geocoding, setGeocoding] = useState(false);
    const [locLoading, setLocLoading] = useState(false);
    const [locError, setLocError] = useState('');

    // "Booking for someone else"
    const [forSomeoneElse, setForSomeoneElse] = useState(false);
    const [recipient, setRecipient] = useState({ name: '', phone: '' });

    // Listen to postMessage from iframe
    useEffect(() => {
        if (!visible) return;

        const handler = async (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type !== 'coords') return;
                const { lat, lng } = data;
                setCoords({ lat, lng });
                setGeocoding(true);
                setParsedAddr(null);
                try {
                    const geo = await reverseGeocode(lat, lng);
                    setParsedAddr(parseAddress(geo));
                } catch (_) { }
                setGeocoding(false);
            } catch (_) { }
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [visible]);

    const moveMarker = (lat, lng) => {
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ type: 'move', lat, lng }), '*'
        );
    };

    const useMyLocation = () => {
        setLocError('');
        if (!navigator?.geolocation) {
            setLocError('Geolocation not supported by your browser.');
            return;
        }
        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setCoords({ lat, lng });
                moveMarker(lat, lng);
                setGeocoding(true);
                setParsedAddr(null);
                try {
                    const geo = await reverseGeocode(lat, lng);
                    setParsedAddr(parseAddress(geo));
                } catch (_) { }
                setGeocoding(false);
                setLocLoading(false);
            },
            (err) => {
                setLocLoading(false);
                if (err.code === 1) {
                    setLocError('Location access denied. Allow location in browser settings and try again.');
                } else {
                    setLocError('Could not get your location. Please try again.');
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
                        {/* Map iframe */}
                        <View style={s.mapWrap}>
                            {/* eslint-disable-next-line react/no-unknown-property */}
                            <iframe
                                ref={iframeRef}
                                srcDoc={buildLeafletHTML(coords.lat, coords.lng)}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                sandbox="allow-scripts allow-same-origin"
                                title="delivery-map"
                            />
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
        backgroundColor: '#e8e8e8',
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
