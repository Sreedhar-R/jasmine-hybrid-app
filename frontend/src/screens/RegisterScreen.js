import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    SafeAreaView, ActivityIndicator, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';
import { registerUser } from '../services/api';

// ── Validators ────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[a-zA-Z\s'-]{1,50}$/;
const PASS_STRENGTH = [
    { re: /.{8,}/, label: 'At least 8 characters' },
    { re: /[A-Z]/, label: 'One uppercase letter' },
    { re: /[0-9]/, label: 'One number' },
    { re: /[^A-Za-z0-9]/, label: 'One special character' },
];

const validateAll = (form) => {
    const e = {};
    if (!NAME_RE.test(form.firstName.trim()))
        e.firstName = form.firstName.trim() ? 'Only letters and spaces allowed.' : 'First name is required.';
    if (!NAME_RE.test(form.lastName.trim()))
        e.lastName = form.lastName.trim() ? 'Only letters and spaces allowed.' : 'Last name is required.';
    if (!form.email.trim())
        e.email = 'Email is required.';
    else if (!EMAIL_RE.test(form.email.trim()))
        e.email = 'Enter a valid email address.';
    if (form.phoneDigits.replace(/\D/g, '').length !== 10)
        e.phoneDigits = 'Enter a valid 10-digit phone number.';
    if (form.password.length < 8)
        e.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword)
        e.confirmPassword = 'Passwords do not match.';
    return e;
};

const validateField = (name, form) => {
    const all = validateAll(form);
    return all[name] || null;
};

// Password strength score 0-4
const getStrength = (pw) => PASS_STRENGTH.filter((r) => r.re.test(pw)).length;
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#e74c3c', '#f39c12', '#3498db', '#27ae60'];

// ── Component ─────────────────────────────────────────────────────────────────
const RegisterScreen = () => {
    const navigation = useNavigation();

    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '',
        phoneDigits: '', password: '', confirmPassword: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [loading, setLoading] = useState(false);

    const setField = (name) => (val) => {
        setForm((f) => ({ ...f, [name]: val }));
        setFieldErrors((e) => ({ ...e, [name]: null }));
    };

    const blurField = (name) => {
        const err = validateField(name, form);
        setFieldErrors((e) => ({ ...e, [name]: err }));
    };

    const handleRegister = async () => {
        setSubmitError('');
        const errs = validateAll(form);
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setLoading(true);
        try {
            await registerUser({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: `+91-${form.phoneDigits.replace(/\D/g, '')}`,
                password: form.password,
                role: 'user',
            });
            navigation.navigate('Login');
        } catch (err) {
            setSubmitError(err?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const strength = getStrength(form.password);

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join us to start shopping</Text>

                {!!submitError && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorBannerText}>{submitError}</Text>
                    </View>
                )}

                {/* Name row */}
                <View style={styles.nameRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Field label="First Name" error={fieldErrors.firstName}>
                            <TextInput
                                placeholder="Priya"
                                style={styles.input}
                                placeholderTextColor={COLORS.gray}
                                value={form.firstName}
                                onChangeText={(t) => setField('firstName')(t.replace(/[^a-zA-Z\s'-]/g, ''))}
                                onBlur={() => blurField('firstName')}
                                autoCapitalize="words"
                            />
                        </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field label="Last Name" error={fieldErrors.lastName}>
                            <TextInput
                                placeholder="Sharma"
                                style={styles.input}
                                placeholderTextColor={COLORS.gray}
                                value={form.lastName}
                                onChangeText={(t) => setField('lastName')(t.replace(/[^a-zA-Z\s'-]/g, ''))}
                                onBlur={() => blurField('lastName')}
                                autoCapitalize="words"
                            />
                        </Field>
                    </View>
                </View>

                {/* Email */}
                <Field label="Email Address" error={fieldErrors.email}>
                    <TextInput
                        placeholder="priya@example.com"
                        style={styles.input}
                        placeholderTextColor={COLORS.gray}
                        value={form.email}
                        onChangeText={setField('email')}
                        onBlur={() => blurField('email')}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </Field>

                {/* Phone */}
                <Text style={styles.labelText}>Phone Number</Text>
                <View style={[styles.phoneRow, fieldErrors.phoneDigits && styles.errorBorder]}>
                    <View style={styles.countryCode}>
                        <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                        placeholder="9876543210"
                        style={[styles.input, { flex: 1, paddingVertical: SIZES.small }]}
                        placeholderTextColor={COLORS.gray}
                        value={form.phoneDigits}
                        onChangeText={(t) => setField('phoneDigits')(t.replace(/\D/g, '').slice(0, 10))}
                        onBlur={() => blurField('phoneDigits')}
                        keyboardType="number-pad"
                        maxLength={10}
                    />
                    <Text style={styles.digitCount}>{form.phoneDigits.length}/10</Text>
                </View>
                {fieldErrors.phoneDigits
                    ? <Text style={styles.fieldError}>{fieldErrors.phoneDigits}</Text>
                    : <View style={{ height: SIZES.medium }} />
                }

                {/* Password + strength */}
                <Field label="Password" error={fieldErrors.password}>
                    <TextInput
                        placeholder="Min 8 characters"
                        style={styles.input}
                        placeholderTextColor={COLORS.gray}
                        value={form.password}
                        onChangeText={setField('password')}
                        onBlur={() => blurField('password')}
                        secureTextEntry
                    />
                </Field>
                {form.password.length > 0 && (
                    <View style={styles.strengthRow}>
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : COLORS.lightGray }]} />
                        ))}
                        <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength] }]}>
                            {STRENGTH_LABELS[strength]}
                        </Text>
                    </View>
                )}

                {/* Confirm password */}
                <Field label="Confirm Password" error={fieldErrors.confirmPassword}>
                    <TextInput
                        placeholder="Re-enter password"
                        style={styles.input}
                        placeholderTextColor={COLORS.gray}
                        value={form.confirmPassword}
                        onChangeText={setField('confirmPassword')}
                        onBlur={() => blurField('confirmPassword')}
                        secureTextEntry
                        onSubmitEditing={handleRegister}
                        returnKeyType="done"
                    />
                </Field>

                <TouchableOpacity
                    style={[styles.button, loading && { opacity: 0.6 }]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color={COLORS.white} />
                        : <Text style={styles.buttonText}>Create Account</Text>
                    }
                </TouchableOpacity>

                <View style={styles.row}>
                    <Text style={styles.hintText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Sign in</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// ── Reusable Field ────────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
    <View style={{ marginBottom: error ? 2 : SIZES.medium }}>
        <Text style={fStyles.label}>{label}</Text>
        <View style={[fStyles.box, error && fStyles.boxError]}>{children}</View>
        {error && <Text style={fStyles.error}>{error}</Text>}
    </View>
);
const fStyles = StyleSheet.create({
    label: { fontSize: SIZES.font, fontWeight: '600', color: COLORS.black, marginBottom: 6 },
    box: {
        backgroundColor: COLORS.lightGray, borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.medium, paddingVertical: SIZES.small,
        borderWidth: 1, borderColor: 'transparent',
    },
    boxError: { borderColor: COLORS.red, backgroundColor: '#FFF5F5' },
    error: { fontSize: 11, color: COLORS.red, marginTop: 3, marginBottom: SIZES.small - 2 },
});

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    scroll: { padding: SIZES.padding, paddingBottom: SIZES.padding * 2, maxWidth: 520, width: '100%', alignSelf: 'center' },
    title: { fontSize: SIZES.extraLarge, fontWeight: 'bold', textAlign: 'center', color: COLORS.black, marginBottom: SIZES.small, marginTop: SIZES.medium },
    subtitle: { fontSize: SIZES.font, color: COLORS.gray, textAlign: 'center', marginBottom: SIZES.padding },
    errorBanner: { backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: COLORS.red, borderRadius: SIZES.base, padding: SIZES.small, marginBottom: SIZES.medium },
    errorBannerText: { color: COLORS.red, fontSize: SIZES.font, textAlign: 'center' },
    nameRow: { flexDirection: 'row' },
    labelText: { fontSize: SIZES.font, fontWeight: '600', color: COLORS.black, marginBottom: 6 },
    input: { fontSize: SIZES.font, color: COLORS.black, outlineStyle: 'none' },
    phoneRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray,
        borderRadius: SIZES.radius, paddingRight: SIZES.small,
        borderWidth: 1, borderColor: 'transparent',
    },
    errorBorder: { borderColor: COLORS.red, backgroundColor: '#FFF5F5' },
    countryCode: { paddingHorizontal: SIZES.medium, paddingVertical: SIZES.small + 2 },
    countryCodeText: { fontSize: SIZES.font, fontWeight: '700', color: COLORS.black },
    digitCount: { fontSize: 11, color: COLORS.gray },
    fieldError: { fontSize: 11, color: COLORS.red, marginTop: 3, marginBottom: SIZES.small },
    strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SIZES.medium, marginTop: -8 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 11, fontWeight: '600', minWidth: 44 },
    button: { backgroundColor: '#1B4332', padding: SIZES.medium, borderRadius: SIZES.radius, alignItems: 'center', marginTop: SIZES.small },
    buttonText: { color: COLORS.white, fontSize: SIZES.large, fontWeight: 'bold' },
    row: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.padding },
    hintText: { fontSize: SIZES.font, color: COLORS.gray },
    linkText: { fontSize: SIZES.font, color: '#1B4332', fontWeight: '700' },
});

export default RegisterScreen;
