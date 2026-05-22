import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../services/firebaseSetup';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';

const VerifyEmailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const email = route.params?.email ?? '';

    const [resending, setResending] = useState(false);
    const [resendMsg, setResendMsg] = useState('');
    const [cooldown, setCooldown] = useState(false);

    const handleResend = async () => {
        if (cooldown) return;
        setResending(true);
        setResendMsg('');
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                await sendEmailVerification(currentUser);
                setResendMsg('✅ Verification email sent! Check your inbox.');
            } else {
                setResendMsg('⚠️ Please log in again to resend the email.');
            }
            // 60-second cooldown to prevent spam
            setCooldown(true);
            setTimeout(() => setCooldown(false), 60000);
        } catch (err) {
            setResendMsg(`Failed to resend: ${err?.message ?? 'Unknown error'}`);
        } finally {
            setResending(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header />
            <View style={styles.container}>
                <Text style={styles.icon}>📧</Text>
                <Text style={styles.title}>Verify your email</Text>
                <Text style={styles.body}>
                    We've sent a verification link to:
                </Text>
                <Text style={styles.email}>{email}</Text>
                <Text style={styles.body}>
                    Please click the link in the email, then come back and log in.
                </Text>

                {!!resendMsg && (
                    <View style={[
                        styles.msgBox,
                        resendMsg.startsWith('✅') ? styles.msgSuccess : styles.msgError,
                    ]}>
                        <Text style={styles.msgText}>{resendMsg}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.secondaryBtn, cooldown && { opacity: 0.5 }]}
                    onPress={handleResend}
                    disabled={resending || cooldown}
                >
                    {resending
                        ? <ActivityIndicator color={COLORS.primary} />
                        : <Text style={styles.secondaryBtnText}>
                            {cooldown ? 'Email sent — check your inbox' : 'Resend verification email'}
                          </Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.primaryBtnText}>Continue to Login →</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    container: {
        flex: 1, padding: SIZES.padding, alignItems: 'center', justifyContent: 'center',
        maxWidth: 480, width: '100%', alignSelf: 'center',
    },
    icon: { fontSize: 56, marginBottom: SIZES.medium },
    title: {
        fontSize: SIZES.extraLarge, fontWeight: 'bold',
        color: COLORS.black, marginBottom: SIZES.small, textAlign: 'center',
    },
    body: {
        fontSize: SIZES.font, color: COLORS.gray,
        textAlign: 'center', marginBottom: SIZES.small,
    },
    email: {
        fontSize: SIZES.font, fontWeight: '700', color: '#1B4332',
        textAlign: 'center', marginBottom: SIZES.medium,
    },
    msgBox: {
        width: '100%', borderRadius: SIZES.base,
        padding: SIZES.small, marginBottom: SIZES.medium,
        borderWidth: 1,
    },
    msgSuccess: { backgroundColor: '#F0FFF4', borderColor: '#27ae60' },
    msgError: { backgroundColor: '#FFF0F0', borderColor: COLORS.red },
    msgText: { fontSize: SIZES.font, textAlign: 'center' },
    secondaryBtn: {
        width: '100%', padding: SIZES.medium, borderRadius: SIZES.radius,
        borderWidth: 1.5, borderColor: '#1B4332', alignItems: 'center',
        marginBottom: SIZES.medium,
    },
    secondaryBtnText: { color: '#1B4332', fontSize: SIZES.font, fontWeight: '700' },
    primaryBtn: {
        width: '100%', backgroundColor: '#1B4332',
        padding: SIZES.medium, borderRadius: SIZES.radius, alignItems: 'center',
    },
    primaryBtnText: { color: COLORS.white, fontSize: SIZES.large, fontWeight: 'bold' },
});

export default VerifyEmailScreen;
