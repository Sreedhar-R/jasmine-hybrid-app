import React from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';

const TermsOfServiceScreen = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Header />
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Terms of Service</Text>
                <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
                    <Text style={styles.text}>
                        By accessing our app, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site/app.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Use License</Text>
                    <Text style={styles.text}>
                        Permission is granted to temporarily download one copy of the materials (information or software) on our app for personal, non-commercial transitory viewing only.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Disclaimer</Text>
                    <Text style={styles.text}>
                        The materials on our app are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Limitations</Text>
                    <Text style={styles.text}>
                        In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our app.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Contact Us</Text>
                    <Text style={styles.text}>
                        If you have any questions about these Terms, please contact us.
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

export default TermsOfServiceScreen;
