import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebaseSetup';
import { ensureFirebaseUser } from '../services/api';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordScreen = () => {
    const navigation = useNavigation();

    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [apiError, setApiError] = useState('');

    const validate = () => {
        if (!email.trim()) { setEmailError('Email is required.'); return false; }
        if (!EMAIL_RE.test(email.trim())) { setEmailError('Enter a valid email address.'); return false; }
        setEmailError('');
        return true;
    };

    const handleSend = async () => {
        if (!validate()) return;
        setLoading(true);
        setApiError('');
        try {
            // Step 1: Ensure a Firebase Auth user exists for this email.
            // This handles accounts created before Firebase Auth was enabled
            // (they only exist in Firestore). The backend creates a Firebase Auth
            // record on-demand so the reset email can be delivered.
            await ensureFirebaseUser(email.trim());

            // Step 2: Send Firebase's password reset email
            await sendPasswordResetEmail(auth, email.trim());
            setSent(true);
        } catch (err) {
            // Don't reveal whether the email exists — generic message
            if (err?.code === 'auth/user-not-found') {
                // Treat as success to avoid email enumeration
                setSent(true);
            } else {
                setApiError(err?.message ?? 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header />
            <View style={styles.container}>
                <Text style={styles.icon}>🔑</Text>
                <Text style={styles.title}>Forgot Password?</Text>

                {sent ? (
                    <>
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>
                                ✅ If an account exists for{' '}
                                <Text style={{ fontWeight: '700' }}>{email}</Text>
                                , a password reset link has been sent. Check your inbox.
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.primaryBtnText}>Back to Login</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.subtitle}>
                            Enter your account email and we'll send you a link to reset your password.
                        </Text>

                        {!!apiError && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{apiError}</Text>
                            </View>
                        )}

                        <View style={styles.fieldWrap}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={[styles.inputBox, !!emailError && styles.inputBoxError]}>
                                <TextInput
                                    placeholder="priya@example.com"
                                    style={styles.input}
                                    placeholderTextColor={COLORS.gray}
                                    value={email}
                                    onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                                    onBlur={validate}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    onSubmitEditing={handleSend}
                                    returnKeyType="send"
                                />
                            </View>
                            {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
                            onPress={handleSend}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color={COLORS.white} />
                                : <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.backLink}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backLinkText}>← Back to Login</Text>
                        </TouchableOpacity>
                    </>
                )}
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
    icon: { fontSize: 48, marginBottom: SIZES.small },
    title: {
        fontSize: SIZES.extraLarge, fontWeight: 'bold',
        color: COLORS.black, marginBottom: SIZES.small, textAlign: 'center',
    },
    subtitle: {
        fontSize: SIZES.font, color: COLORS.gray,
        textAlign: 'center', marginBottom: SIZES.padding,
    },
    fieldWrap: { width: '100%', marginBottom: SIZES.medium },
    label: { fontSize: SIZES.font, fontWeight: '600', color: COLORS.black, marginBottom: 6 },
    inputBox: {
        backgroundColor: COLORS.lightGray, borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.medium, paddingVertical: SIZES.small,
        borderWidth: 1, borderColor: 'transparent',
    },
    inputBoxError: { borderColor: COLORS.red, backgroundColor: '#FFF5F5' },
    input: { fontSize: SIZES.font, color: COLORS.black, outlineStyle: 'none' },
    fieldError: { fontSize: 11, color: COLORS.red, marginTop: 3 },
    errorBox: {
        width: '100%', backgroundColor: '#FFF0F0', borderWidth: 1,
        borderColor: COLORS.red, borderRadius: SIZES.base,
        padding: SIZES.small, marginBottom: SIZES.medium,
    },
    errorText: { color: COLORS.red, fontSize: SIZES.font, textAlign: 'center' },
    successBox: {
        width: '100%', backgroundColor: '#F0FFF4', borderWidth: 1,
        borderColor: '#27ae60', borderRadius: SIZES.base,
        padding: SIZES.medium, marginBottom: SIZES.padding,
    },
    successText: { color: '#1a6636', fontSize: SIZES.font, textAlign: 'center', lineHeight: 22 },
    primaryBtn: {
        width: '100%', backgroundColor: '#1B4332',
        padding: SIZES.medium, borderRadius: SIZES.radius, alignItems: 'center',
        marginBottom: SIZES.medium,
    },
    primaryBtnText: { color: COLORS.white, fontSize: SIZES.large, fontWeight: 'bold' },
    backLink: { marginTop: SIZES.small, alignItems: 'center' },
    backLinkText: { color: COLORS.gray, fontSize: SIZES.font },
});

export default ForgotPasswordScreen;
