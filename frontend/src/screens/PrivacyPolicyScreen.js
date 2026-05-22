import React from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';

const PrivacyPolicyScreen = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Header />
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Privacy Policy</Text>
                <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Introduction</Text>
                    <Text style={styles.text}>
                        Welcome to our Privacy Policy. Your privacy is critically important to us. This policy explains what information we collect, how we use it, and your rights regarding your personal information.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Information We Collect</Text>
                    <Text style={styles.text}>
                        We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Use of Information</Text>
                    <Text style={styles.text}>
                        The personal information we collect is used to provide, operate, maintain, and improve our services, to communicate with you, to understand how you use our services, and to process transactions.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Contact Us</Text>
                    <Text style={styles.text}>
                        If you have any questions about this Privacy Policy, please contact us.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        padding: SIZES.padding,
        paddingBottom: SIZES.padding * 3,
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    title: {
        fontSize: SIZES.extraLarge,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: SIZES.base,
    },
    lastUpdated: {
        fontSize: SIZES.font,
        color: COLORS.gray,
        marginBottom: SIZES.padding,
    },
    section: {
        marginBottom: SIZES.padding,
    },
    sectionTitle: {
        fontSize: SIZES.large,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: SIZES.small,
    },
    text: {
        fontSize: SIZES.font,
        color: COLORS.gray,
        lineHeight: 24,
    },
});

export default PrivacyPolicyScreen;
