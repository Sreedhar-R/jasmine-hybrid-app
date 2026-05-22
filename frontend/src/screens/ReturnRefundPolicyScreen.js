import React from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';

const ReturnRefundPolicyScreen = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Header />
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Return and Refund Policy</Text>
                <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Returns</Text>
                    <Text style={styles.text}>
                        We have a 30-day return policy, which means you have 30 days after receiving your item to request a return. To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You’ll also need the receipt or proof of purchase.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Refunds</Text>
                    <Text style={styles.text}>
                        We will notify you once we’ve received and inspected your return, and let you know if the refund was approved or not. If approved, you’ll be automatically refunded on your original payment method. Please remember it can take some time for your bank or credit card company to process and post the refund too.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Exchanges</Text>
                    <Text style={styles.text}>
                        The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Contact Us</Text>
                    <Text style={styles.text}>
                        If you have any questions about our Returns and Refunds Policy, please contact us.
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

export default ReturnRefundPolicyScreen;
