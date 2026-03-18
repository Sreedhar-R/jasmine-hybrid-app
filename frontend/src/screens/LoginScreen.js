import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Validators ────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateLogin = (mode, identifier, phone, password) => {
    const errs = {};
    if (mode === 'email') {
        if (!identifier.trim()) errs.identifier = 'Email is required.';
        else if (!EMAIL_RE.test(identifier.trim())) errs.identifier = 'Enter a valid email address.';
    } else {
        if (phone.replace(/\D/g, '').length !== 10) errs.phone = 'Enter a valid 10-digit phone number.';
    }
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    return errs;
};

// ── Component ─────────────────────────────────────────────────────────────────
const LoginScreen = ({ route }) => {
    const navigation = useNavigation();
    const auth = useAuth();
    // Where to go after login — passed by the caller screen
    const redirectTo = route?.params?.redirectTo ?? null;

    const [mode, setMode] = useState('email');
    const [identifier, setIdentifier] = useState('');
    const [phoneDigits, setPhoneDigits] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [loading, setLoading] = useState(false);

    const blurValidate = (field) => {
        const errs = validateLogin(mode, identifier, phoneDigits, password);
        setFieldErrors((prev) => ({ ...prev, [field]: errs[field] || null }));
    };

    const handleLogin = async () => {
        setSubmitError('');
        const errs = validateLogin(mode, identifier, phoneDigits, password);
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const id = mode === 'email'
            ? identifier.trim()
            : `+91-${phoneDigits.replace(/\D/g, '')}`;

        setLoading(true);
        try {
            const res = await loginUser(id, password);
            auth.login(res.user);
            // Redirect back to the caller screen, or default to Home
            if (redirectTo) {
                navigation.navigate(redirectTo);
            } else {
                navigation.navigate('Tabs', { screen: 'Jasmine' });
            }
        } catch (err) {
            const msg = err?.message || 'Invalid credentials. Please try again.';
            if (msg.toLowerCase().includes('invalid credentials')) {
                setSubmitError('No account found or wrong password. New here? Create an account below.');
            } else {
                setSubmitError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (m) => { setMode(m); setFieldErrors({}); setSubmitError(''); };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header />
            <View style={styles.container}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in with your email or phone number</Text>

                {/* Mode toggle */}
                <View style={styles.toggle}>
                    {['email', 'phone'].map((m) => (
                        <TouchableOpacity
                            key={m}
                            style={[styles.toggleBtn, mode === m && styles.toggleActive]}
                            onPress={() => switchMode(m)}
                        >
                            <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                                {m === 'email' ? '📧 Email' : '📱 Phone'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* API-level error */}
                {!!submitError && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorBannerText}>{submitError}</Text>
                    </View>
                )}

                {/* Email input */}
                {mode === 'email' && (
                    <Field label="Email Address" error={fieldErrors.identifier}>
                        <TextInput
                            placeholder="priya@example.com"
                            style={styles.input}
                            placeholderTextColor={COLORS.gray}
                            value={identifier}
                            onChangeText={(t) => { setIdentifier(t); setFieldErrors((p) => ({ ...p, identifier: null })); }}
                            onBlur={() => blurValidate('identifier')}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </Field>
                )}

                {/* Phone input */}
                {mode === 'phone' && (
                    <>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={[styles.phoneRow, fieldErrors.phone && styles.errorBorder]}>
                            <View style={styles.countryCode}>
                                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                            </View>
                            <TextInput
                                placeholder="9876543210"
                                style={[styles.input, styles.phoneInput]}
                                placeholderTextColor={COLORS.gray}
                                value={phoneDigits}
                                onChangeText={(t) => { setPhoneDigits(t.replace(/\D/g, '').slice(0, 10)); setFieldErrors((p) => ({ ...p, phone: null })); }}
                                onBlur={() => blurValidate('phone')}
                                keyboardType="number-pad"
                                maxLength={10}
                            />
                            <Text style={styles.digitCount}>{phoneDigits.length}/10</Text>
                        </View>
                        {fieldErrors.phone && <Text style={styles.fieldError}>{fieldErrors.phone}</Text>}
                    </>
                )}

                {/* Password */}
                <Field label="Password" error={fieldErrors.password}>
                    <TextInput
                        placeholder="Minimum 8 characters"
                        style={styles.input}
                        placeholderTextColor={COLORS.gray}
                        value={password}
                        onChangeText={(t) => { setPassword(t); setFieldErrors((p) => ({ ...p, password: null })); }}
                        onBlur={() => blurValidate('password')}
                        secureTextEntry
                        onSubmitEditing={handleLogin}
                        returnKeyType="done"
                    />
                </Field>

                <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
                    {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Login</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.homeLink} onPress={() => navigation.navigate('Tabs', { screen: 'Jasmine' })}>
                    <Text style={styles.homeLinkText}>← Back to Jasmine</Text>
                </TouchableOpacity>

                <View style={styles.row}>
                    <Text style={styles.hintText}>New here? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.linkText}>Create an account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

// Reusable field wrapper
const Field = ({ label, error, children }) => (
    <View style={{ marginBottom: error ? 4 : SIZES.medium }}>
        <Text style={fieldStyle.label}>{label}</Text>
        <View style={[fieldStyle.box, error && fieldStyle.boxError]}>{children}</View>
        {error && <Text style={fieldStyle.error}>{error}</Text>}
    </View>
);

const fieldStyle = StyleSheet.create({
    label: { fontSize: SIZES.font, fontWeight: '600', color: COLORS.black, marginBottom: 6 },
    box: {
        backgroundColor: COLORS.lightGray,
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.medium,
        paddingVertical: SIZES.small,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    boxError: { borderColor: COLORS.red, backgroundColor: '#FFF5F5' },
    error: { fontSize: 11, color: COLORS.red, marginTop: 3, marginBottom: SIZES.small },
});

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    container: {
        flex: 1, padding: SIZES.padding, justifyContent: 'center',
        maxWidth: 480, width: '100%', alignSelf: 'center',
    },
    title: { fontSize: SIZES.extraLarge, fontWeight: 'bold', textAlign: 'center', color: COLORS.black, marginBottom: SIZES.small },
    subtitle: { fontSize: SIZES.font, color: COLORS.gray, textAlign: 'center', marginBottom: SIZES.medium },
    toggle: {
        flexDirection: 'row', borderRadius: SIZES.radius, borderWidth: 1,
        borderColor: COLORS.lightGray, overflow: 'hidden', marginBottom: SIZES.medium,
    },
    toggleBtn: { flex: 1, paddingVertical: SIZES.small, alignItems: 'center', backgroundColor: COLORS.lightGray },
    toggleActive: { backgroundColor: '#1B4332' },
    toggleText: { fontSize: SIZES.font, color: COLORS.gray, fontWeight: '600' },
    toggleTextActive: { color: COLORS.white },
    errorBanner: {
        backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: COLORS.red,
        borderRadius: SIZES.base, padding: SIZES.small, marginBottom: SIZES.medium,
    },
    errorBannerText: { color: COLORS.red, fontSize: SIZES.font, textAlign: 'center' },
    label: { fontSize: SIZES.font, fontWeight: '600', color: COLORS.black, marginBottom: 6 },
    input: { fontSize: SIZES.font, color: COLORS.black, outlineStyle: 'none' },
    phoneRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.lightGray, borderRadius: SIZES.radius,
        paddingRight: SIZES.small, borderWidth: 1, borderColor: 'transparent',
        marginBottom: SIZES.medium,
    },
    errorBorder: { borderColor: COLORS.red, backgroundColor: '#FFF5F5' },
    countryCode: { paddingHorizontal: SIZES.medium, paddingVertical: SIZES.small + 2 },
    countryCodeText: { fontSize: SIZES.font, fontWeight: '700', color: COLORS.black },
    phoneInput: { flex: 1, paddingVertical: SIZES.small },
    digitCount: { fontSize: 11, color: COLORS.gray },
    fieldError: { fontSize: 11, color: COLORS.red, marginTop: -8, marginBottom: SIZES.small },
    button: {
        backgroundColor: '#1B4332', padding: SIZES.medium,
        borderRadius: SIZES.radius, alignItems: 'center', marginTop: SIZES.small,
    },
    buttonText: { color: COLORS.white, fontSize: SIZES.large, fontWeight: 'bold' },
    homeLink: { marginTop: SIZES.medium, alignItems: 'center' },
    homeLinkText: { color: COLORS.gray, fontSize: SIZES.font },
    row: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.small },
    hintText: { fontSize: SIZES.font, color: COLORS.gray },
    linkText: { fontSize: SIZES.font, color: '#1B4332', fontWeight: '700' },
});

export default LoginScreen;
