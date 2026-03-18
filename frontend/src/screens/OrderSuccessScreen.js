import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';

const GREEN = '#1B4332';

const OrderSuccessScreen = ({ navigation, route }) => {
    const { orderId, total } = route?.params ?? {};
    return (
        <SafeAreaView style={styles.safe}>
            <Header />
            <View style={styles.body}>
                <Text style={styles.icon}>🎉</Text>
                <Text style={styles.title}>Order Placed!</Text>
                <Text style={styles.sub}>
                    Thank you for your order. We'll send you a confirmation shortly.
                </Text>
                {orderId && (
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>Order ID</Text>
                        <Text style={styles.infoVal}>{orderId}</Text>
                        {total != null && (
                            <>
                                <Text style={styles.infoLabel}>Total Paid</Text>
                                <Text style={styles.infoVal}>₹{Number(total).toFixed(2)}</Text>
                            </>
                        )}
                    </View>
                )}
                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => navigation.navigate('Tabs', { screen: 'Jasmine' })}
                >
                    <Text style={styles.btnTxt}>Continue Shopping →</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.btnOut}
                    onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })}
                >
                    <Text style={styles.btnOutTxt}>View Order History</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.white },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    icon: { fontSize: 72, marginBottom: 16 },
    title: { fontSize: 32, fontWeight: '800', color: COLORS.black, marginBottom: 10, textAlign: 'center' },
    sub: { fontSize: 16, color: COLORS.gray, textAlign: 'center', lineHeight: 24, marginBottom: 24, maxWidth: 400 },
    infoBox: { backgroundColor: '#F4FAF6', borderRadius: 10, padding: 20, width: '100%', maxWidth: 380, marginBottom: 28, borderWidth: 1, borderColor: '#D9EDE2' },
    infoLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    infoVal: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
    btn: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 16, paddingHorizontal: 36, marginBottom: 12, width: '100%', maxWidth: 380, alignItems: 'center' },
    btnTxt: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    btnOut: { borderWidth: 1.5, borderColor: GREEN, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 36, width: '100%', maxWidth: 380, alignItems: 'center' },
    btnOutTxt: { color: GREEN, fontWeight: '700', fontSize: 16 },
});

export default OrderSuccessScreen;
