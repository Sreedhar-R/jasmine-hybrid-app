/**
 * WalletScreen.js
 * Shows wallet balance, transaction history, and a top-up modal.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import { getWalletBalance, getWalletTransactions, topUpWallet } from '../services/api';

const GREEN = '#1B4332';
const LIGHT_GREEN = '#F0F7F4';

// Preset top-up amounts
const QUICK_AMOUNTS = [100, 200, 500, 1000];

// ── Transaction row ────────────────────────────────────────────────────────────
const TxRow = ({ tx }) => {
    const isCredit = tx.type === 'credit';
    const date = tx.createdAt
        ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
    return (
        <View style={tx_s.row}>
            <View style={[tx_s.dot, { backgroundColor: isCredit ? '#16A34A' : '#DC2626' }]} />
            <View style={{ flex: 1 }}>
                <Text style={tx_s.note}>{tx.note ?? (isCredit ? 'Top-up' : 'Deduction')}</Text>
                <Text style={tx_s.date}>{date}</Text>
            </View>
            <Text style={[tx_s.amount, { color: isCredit ? '#16A34A' : '#DC2626' }]}>
                {isCredit ? '+' : '−'}₹{tx.amount?.toFixed(2)}
            </Text>
        </View>
    );
};
const tx_s = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 12 },
    dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    note: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
    date: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
    amount: { fontSize: 15, fontWeight: '800', flexShrink: 0 },
});

// ── Top-up Modal ───────────────────────────────────────────────────────────────
const TopUpModal = ({ visible, userId, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [custom, setCustom] = useState('');
    const [saving, setSaving] = useState(false);

    const selectedAmount = amount ? Number(amount) : Number(custom);

    const handleTopUp = async () => {
        if (!selectedAmount || selectedAmount < 100) {
            Alert.alert('Minimum ₹100', 'Please enter at least ₹100 to top up.');
            return;
        }
        setSaving(true);
        try {
            const result = await topUpWallet(userId, selectedAmount);
            onSuccess(result.balance);
        } catch (err) {
            Alert.alert('Error', err.message ?? 'Top-up failed.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={mdl.overlay}>
                <View style={mdl.sheet}>
                    <View style={mdl.head}>
                        <Text style={mdl.title}>Top Up Wallet</Text>
                        <TouchableOpacity onPress={onClose} style={mdl.closeBtn}>
                            <Text style={mdl.closeTxt}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={mdl.body} showsVerticalScrollIndicator={false}>
                        <Text style={mdl.sectionLabel}>Quick Add</Text>
                        <View style={mdl.quickRow}>
                            {QUICK_AMOUNTS.map(q => (
                                <TouchableOpacity
                                    key={q}
                                    style={[mdl.quickBtn, amount === String(q) && mdl.quickBtnSel]}
                                    onPress={() => { setAmount(String(q)); setCustom(''); }}
                                >
                                    <Text style={[mdl.quickTxt, amount === String(q) && mdl.quickTxtSel]}>₹{q}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={mdl.sectionLabel}>Or enter custom amount</Text>
                        <View style={mdl.inputWrap}>
                            <Text style={mdl.rupee}>₹</Text>
                            <TextInput
                                style={mdl.input}
                                keyboardType="number-pad"
                                placeholder="Enter amount (min ₹100)"
                                placeholderTextColor={COLORS.gray}
                                value={custom}
                                onChangeText={v => { setCustom(v); setAmount(''); }}
                            />
                        </View>

                        {selectedAmount > 0 && selectedAmount < 100 && (
                            <Text style={mdl.minWarn}>Minimum top-up is ₹100</Text>
                        )}

                        <View style={mdl.summaryBox}>
                            <Text style={mdl.summaryTxt}>Adding to wallet</Text>
                            <Text style={mdl.summaryAmt}>₹{selectedAmount > 0 ? selectedAmount.toFixed(2) : '0.00'}</Text>
                        </View>

                        <TouchableOpacity
                            style={[mdl.confirmBtn, (saving || !selectedAmount || selectedAmount < 100) && { opacity: 0.5 }]}
                            onPress={handleTopUp}
                            disabled={saving || !selectedAmount || selectedAmount < 100}
                        >
                            {saving
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={mdl.confirmTxt}>💳  Add Money</Text>
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
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 24 },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    title: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    closeTxt: { fontSize: 14, color: '#555', fontWeight: '700' },
    body: { padding: 20 },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    quickBtn: { flex: 1, minWidth: 70, borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#FAFAFA' },
    quickBtnSel: { borderColor: GREEN, backgroundColor: LIGHT_GREEN },
    quickTxt: { fontSize: 15, fontWeight: '700', color: '#555' },
    quickTxtSel: { color: GREEN },
    inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#D0D0D0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
    rupee: { fontSize: 18, fontWeight: '700', color: '#555', marginRight: 6 },
    input: { flex: 1, fontSize: 18, fontWeight: '600', color: '#1a1a1a', outlineStyle: 'none' },
    minWarn: { fontSize: 12, color: '#DC2626', marginBottom: 12 },
    summaryBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: LIGHT_GREEN, borderRadius: 10, padding: 14, marginVertical: 16, borderWidth: 1, borderColor: '#C8E6C9' },
    summaryTxt: { fontSize: 14, color: '#555', fontWeight: '600' },
    summaryAmt: { fontSize: 20, fontWeight: '900', color: GREEN },
    confirmBtn: { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    confirmTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
const WalletScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTopUp, setShowTopUp] = useState(false);

    const load = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const [bal, txns] = await Promise.all([
                getWalletBalance(user.id),
                getWalletTransactions(user.id),
            ]);
            setBalance(bal.balance ?? 0);
            setTransactions(txns);
        } catch {
            setBalance(0);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { load(); }, [load]);

    const handleTopUpSuccess = (newBalance) => {
        setBalance(newBalance);
        setShowTopUp(false);
        Alert.alert('✅ Top-up Successful', `₹${(newBalance).toFixed(2)} is now in your wallet.`);
        load(); // refresh transactions
    };

    return (
        <SafeAreaView style={styles.safe}>
            <Header />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Back */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
                    <Text style={styles.backTxt}>← Back</Text>
                </TouchableOpacity>

                {/* Balance card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Wallet Balance</Text>
                    {loading
                        ? <ActivityIndicator color="#fff" style={{ marginVertical: 8 }} />
                        : <Text style={styles.balanceAmt}>₹{(balance ?? 0).toFixed(2)}</Text>
                    }
                    <Text style={styles.balanceSub}>Available for subscriptions & orders</Text>

                    <TouchableOpacity style={styles.topUpBtn} onPress={() => setShowTopUp(true)}>
                        <Text style={styles.topUpTxt}>+ Add Money</Text>
                    </TouchableOpacity>
                </View>

                {/* Low balance warning */}
                {!loading && balance < 100 && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningTxt}>
                            ⚠️ Your wallet balance is below ₹100. Top up to enable subscriptions.
                        </Text>
                    </View>
                )}

                {/* Transaction history */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Transaction History</Text>
                    {loading ? (
                        <ActivityIndicator color={GREEN} style={{ marginTop: 20 }} />
                    ) : transactions.length === 0 ? (
                        <View style={styles.emptyTx}>
                            <Text style={styles.emptyIcon}>💳</Text>
                            <Text style={styles.emptyTxt}>No transactions yet</Text>
                        </View>
                    ) : (
                        transactions.map((t, i) => <TxRow key={i} tx={t} />)
                    )}
                </View>

            </ScrollView>

            <TopUpModal
                visible={showTopUp}
                userId={user?.id}
                onClose={() => setShowTopUp(false)}
                onSuccess={handleTopUpSuccess}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F6F8F6' },
    scroll: { padding: SIZES.padding, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center' },
    backRow: { marginBottom: 12 },
    backTxt: { fontSize: SIZES.font, color: GREEN, fontWeight: '600' },

    balanceCard: {
        backgroundColor: GREEN,
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        alignItems: 'center',
    },
    balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    balanceAmt: { fontSize: 48, fontWeight: '900', color: '#fff', marginVertical: 4 },
    balanceSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 20 },
    topUpBtn: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
    topUpTxt: { color: GREEN, fontWeight: '800', fontSize: 14 },

    warningBox: { backgroundColor: '#FFF7ED', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FBBF24' },
    warningTxt: { fontSize: 13, color: '#92400E', lineHeight: 20 },

    section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },

    emptyTx: { alignItems: 'center', paddingVertical: 32 },
    emptyIcon: { fontSize: 40, marginBottom: 8 },
    emptyTxt: { fontSize: 14, color: COLORS.gray },
});

export default WalletScreen;
