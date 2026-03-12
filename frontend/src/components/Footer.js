import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, Image } from 'react-native';
import { SIZES } from '../constants/theme';

const FOOTER_BG = '#F5F0E8';
const LINK_COLOR = '#555';
const HEADING_COLOR = '#1a1a1a';

// Instagram real gradient SVG as a data URI
const INSTAGRAM_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='1' x2='1' y2='0'%3E%3Cstop offset='0' stop-color='%23f09433'/%3E%3Cstop offset='.25' stop-color='%23e6683c'/%3E%3Cstop offset='.5' stop-color='%23dc2743'/%3E%3Cstop offset='.75' stop-color='%23cc2366'/%3E%3Cstop offset='1' stop-color='%23bc1888'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='24' height='24' rx='6' fill='url(%23g)'/%3E%3Crect x='4.5' y='4.5' width='15' height='15' rx='4' fill='none' stroke='white' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='12' r='3.5' fill='none' stroke='white' stroke-width='1.5'/%3E%3Ccircle cx='17' cy='7' r='1.2' fill='white'/%3E%3C/svg%3E`;

const FooterLink = ({ label }) => (
    <TouchableOpacity activeOpacity={0.7}>
        <Text style={styles.link}>{label}</Text>
    </TouchableOpacity>
);

const FooterColumn = ({ title, links }) => (
    <View style={styles.column}>
        <Text style={styles.heading}>{title}</Text>
        {links.map(l => <FooterLink key={l} label={l} />)}
    </View>
);

const Footer = () => {
    const { width } = useWindowDimensions();
    const isLarge = width >= 768;

    const SOCIAL = [
        { label: 'Instagram', icon: '📸', color: '#E1306C', bg: '#FDE8F1' },
        { label: 'YouTube', icon: '▶', color: '#FF0000', bg: '#FFE8E8' },
        { label: 'Facebook', icon: 'f', color: '#1877F2', bg: '#E7F0FD' },
        { label: 'X (Twitter)', icon: '✕', color: '#000000', bg: '#EFEFEF' },
    ];

    return (
        <View style={styles.wrapper}>
            {/* ── Main columns ── */}
            <View style={[styles.row, !isLarge && styles.rowMobile]}>

                {/* Col 1 — Brand */}
                <View style={[styles.column, styles.brandColumn]}>
                    <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
                    <View style={styles.contactRow}>
                        <Text style={styles.contactIcon}>📍</Text>
                        <Text style={styles.contactText}>Bengaluru, Karnataka</Text>
                    </View>
                    <View style={styles.contactRow}>
                        <Text style={styles.contactIcon}>📞</Text>
                        <Text style={styles.contactText}>+91 98000 00000</Text>
                    </View>
                    <View style={styles.contactRow}>
                        <Text style={styles.contactIcon}>✉️</Text>
                        <Text style={styles.contactText}>support@bloomfresh.com</Text>
                    </View>
                </View>

                {/* Col 2 — Account */}
                <FooterColumn
                    title="Account"
                    links={['Sign In', 'FAQs']}
                />

                {/* Col 3 — Store Policy */}
                <FooterColumn
                    title="Store Policy"
                    links={['Privacy Policy', 'Return & Refund Policy', 'Shipping Policy', 'Terms of Service']}
                />

                {/* Col 4 — Follow Us */}
                <View style={styles.column}>
                    <Text style={styles.heading}>Follow Us</Text>
                    {SOCIAL.map(({ label, icon, color, bg }) => (
                        <TouchableOpacity key={label} style={styles.socialRow} activeOpacity={0.75}>
                            {label === 'Instagram' && Platform.OS === 'web' ? (
                                <img
                                    src={INSTAGRAM_SVG}
                                    alt="Instagram"
                                    width={28}
                                    height={28}
                                    style={{ borderRadius: 7 }}
                                />
                            ) : (
                                <View style={[styles.socialIcon, { backgroundColor: bg }]}>
                                    <Text style={[styles.socialIconTxt, { color }]}>{icon}</Text>
                                </View>
                            )}
                            <Text style={styles.socialLabel}>{label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Col 5 — App & Payment */}
                <View style={styles.column}>
                    <Text style={styles.heading}>App & Payment</Text>
                    <Text style={styles.subLabel}>From App Store or Google Play</Text>

                    {/* Store badges */}
                    <View style={styles.badgeRow}>
                        <View style={styles.storeBadge}>
                            <Text style={styles.storeIcon}>▶</Text>
                            <View>
                                <Text style={styles.badgeSmall}>GET IT ON</Text>
                                <Text style={styles.badgeBig}>Google Play</Text>
                            </View>
                        </View>
                        <View style={styles.storeBadge}>
                            <Text style={styles.storeIcon}></Text>
                            <View>
                                <Text style={styles.badgeSmall}>Download on the</Text>
                                <Text style={styles.badgeBig}>App Store</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.subLabel, { marginTop: SIZES.medium }]}>Secured Payment Gateways</Text>
                    <View style={styles.paymentRow}>
                        {['VISA', 'MC', 'UPI', 'RuPay'].map(p => (
                            <View key={p} style={styles.paymentChip}>
                                <Text style={styles.paymentText}>{p}</Text>
                            </View>
                        ))}
                    </View>
                </View>

            </View>

            {/* ── Bottom bar ── */}
            <View style={styles.bottomBar}>
                <Text style={styles.bottomText}>
                    © {new Date().getFullYear()} Bloom Fresh Pvt. Ltd. All rights reserved.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: FOOTER_BG,
        marginTop: SIZES.padding * 2,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SIZES.padding,
        paddingTop: SIZES.padding * 1.5,
        paddingBottom: SIZES.padding,
        gap: SIZES.padding,
        justifyContent: 'space-between',
    },
    rowMobile: {
        flexDirection: 'column',
    },
    column: {
        flex: 1,
        minWidth: 140,
        gap: SIZES.base,
    },
    brandColumn: {
        gap: SIZES.base + 2,
    },

    logoImage: {
        height: 50,
        width: 140,
        resizeMode: 'contain',
        marginLeft: -4,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    contactIcon: {
        fontSize: 12,
        marginTop: 2,
    },
    contactText: {
        fontSize: 12,
        color: LINK_COLOR,
        flexShrink: 1,
    },

    // Column links
    heading: {
        fontSize: SIZES.font,
        fontWeight: '800',
        color: HEADING_COLOR,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    link: {
        fontSize: 12,
        color: LINK_COLOR,
        lineHeight: 20,
    },
    subLabel: {
        fontSize: 11,
        color: '#888',
        marginBottom: 6,
    },

    // Store badges
    badgeRow: {
        flexDirection: 'row',
        gap: SIZES.small,
        flexWrap: 'wrap',
    },
    storeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#111',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    storeIcon: {
        color: '#fff',
        fontSize: 14,
    },
    badgeSmall: {
        color: '#ccc',
        fontSize: 8,
        lineHeight: 10,
    },
    badgeBig: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 14,
    },

    // Payment
    paymentRow: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },
    paymentChip: {
        borderWidth: 1,
        borderColor: '#bbb',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#fff',
    },
    paymentText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#333',
    },

    // Bottom bar
    bottomBar: {
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingVertical: SIZES.small,
        paddingHorizontal: SIZES.padding,
        alignItems: 'center',
    },
    bottomText: {
        fontSize: 11,
        color: '#999',
    },

    // Social links
    socialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 3,
    },
    socialIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    socialIconTxt: {
        fontSize: 13,
        fontWeight: '800',
        lineHeight: 16,
    },
    socialLabel: {
        fontSize: 13,
        color: LINK_COLOR,
        fontWeight: '500',
    },
});

export default Footer;
