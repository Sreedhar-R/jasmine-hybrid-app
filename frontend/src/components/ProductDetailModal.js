import React, { useState, useRef } from 'react';
import {
    Modal, View, Text, Image, StyleSheet, TouchableOpacity,
    ScrollView, useWindowDimensions, Animated,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const ProductDetailModal = ({ item, visible, onClose, onAddToCart }) => {
    const { width } = useWindowDimensions();
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);

    if (!item) return null;

    // Support both single `image` and `images[]` array
    const images = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : item.image
            ? [item.image]
            : [];

    const imgWidth = Math.min(width, 560) - SIZES.padding * 2;

    const hasDiscount = item.originalPrice && item.discountedPrice &&
        item.originalPrice > item.discountedPrice;
    const discountPct = hasDiscount
        ? Math.round((1 - item.discountedPrice / item.originalPrice) * 100)
        : 0;

    const handleAdd = () => {
        if (onAddToCart) onAddToCart({ ...item, qty });
        setAdded(true);
        setTimeout(() => setAdded(false), 1400);
    };

    const handleScroll = (e) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / imgWidth);
        setActiveIndex(idx);
    };

    const handleClose = () => {
        setQty(1);
        setAdded(false);
        setActiveIndex(0);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            {/* Backdrop */}
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

            {/* Card */}
            <View style={styles.centeredContainer} pointerEvents="box-none">
                <View style={[styles.card, { maxWidth: 560, width: width - SIZES.padding * 2 }]}>
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                        {/* ── Image Gallery ── */}
                        {images.length > 0 && (
                            <View style={styles.galleryWrapper}>
                                <ScrollView
                                    ref={scrollRef}
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    onScroll={handleScroll}
                                    scrollEventThrottle={16}
                                    style={{ width: imgWidth }}
                                    contentContainerStyle={{ height: 240 }}
                                >
                                    {images.map((uri, i) => (
                                        <Image
                                            key={i}
                                            source={{ uri }}
                                            style={[styles.galleryImage, { width: imgWidth }]}
                                            resizeMode="contain"
                                        />
                                    ))}
                                </ScrollView>

                                {/* Dots */}
                                {images.length > 1 && (
                                    <View style={styles.dots}>
                                        {images.map((_, i) => (
                                            <View
                                                key={i}
                                                style={[styles.dot, i === activeIndex && styles.dotActive]}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* ── Details ── */}
                        <View style={styles.details}>
                            {/* Name */}
                            <Text style={styles.name}>{item.name}</Text>

                            {/* Price row */}
                            {hasDiscount ? (
                                <View style={styles.priceRow}>
                                    <View style={styles.discountBadge}>
                                        <Text style={styles.discountText}>{discountPct}% OFF</Text>
                                    </View>
                                    <Text style={styles.originalPrice}>
                                        ₹{Number(item.originalPrice).toFixed(2)}
                                    </Text>
                                    <Text style={styles.discountedPrice}>
                                        ₹{Number(item.discountedPrice).toFixed(2)}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.price}>₹{Number(item.price).toFixed(2)}</Text>
                            )}

                            {/* Badges row */}
                            <View style={styles.badgeRow}>
                                {item.category && (
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryText}>{item.category}</Text>
                                    </View>
                                )}
                                {item.unit && (
                                    <View style={styles.unitBadge}>
                                        <Text style={styles.unitText}>{item.unit}</Text>
                                    </View>
                                )}
                                <View style={[styles.stockBadge, !item.inStock && styles.outOfStockBadge]}>
                                    <Text style={[styles.stockText, !item.inStock && styles.outOfStockText]}>
                                        {item.inStock ? '✓ In Stock' : '✕ Out of Stock'}
                                    </Text>
                                </View>
                            </View>

                            {/* Description */}
                            {item.description ? (
                                <Text style={styles.description}>{item.description}</Text>
                            ) : null}

                            {/* Divider */}
                            <View style={styles.divider} />

                            {/* Qty + Add to Cart */}
                            <View style={styles.actionRow}>
                                <View style={styles.qtyContainer}>
                                    <TouchableOpacity
                                        style={styles.qtyBtn}
                                        onPress={() => setQty(q => Math.max(1, q - 1))}
                                    >
                                        <Text style={styles.qtyBtnText}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.qtyText}>{qty}</Text>
                                    <TouchableOpacity
                                        style={styles.qtyBtn}
                                        onPress={() => setQty(q => q + 1)}
                                    >
                                        <Text style={styles.qtyBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.addBtn, added && styles.addBtnAdded]}
                                    onPress={handleAdd}
                                    disabled={!item.inStock}
                                >
                                    <Text style={styles.addBtnText}>
                                        {added ? '✓ Added to Cart!' : 'Add to Cart'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        overflow: 'hidden',
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 12,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.35)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtnText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '700',
    },

    // ── Gallery ──
    galleryWrapper: {
        backgroundColor: '#F8F8F6',
        alignItems: 'center',
        paddingTop: 44,
    },
    galleryImage: {
        height: 240,
        backgroundColor: '#F8F8F6',
    },
    dots: {
        flexDirection: 'row',
        gap: 5,
        paddingVertical: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ccc',
    },
    dotActive: {
        backgroundColor: '#1B4332',
        width: 16,
    },

    // ── Details ──
    details: {
        padding: SIZES.padding,
        gap: 10,
    },
    name: {
        fontSize: SIZES.extraLarge,
        fontWeight: '800',
        color: COLORS.black,
        lineHeight: 30,
    },

    // Price
    price: {
        fontSize: SIZES.extraLarge,
        fontWeight: '800',
        color: COLORS.black,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    discountBadge: {
        backgroundColor: '#D4EDDA',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    discountText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B4332',
    },
    originalPrice: {
        fontSize: SIZES.large,
        color: COLORS.gray,
        textDecorationLine: 'line-through',
        fontWeight: '500',
    },
    discountedPrice: {
        fontSize: SIZES.extraLarge,
        fontWeight: '800',
        color: '#1B4332',
    },

    // Badges
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryBadge: {
        backgroundColor: '#EEF2FF',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4338CA',
    },
    unitBadge: {
        backgroundColor: '#FFF7ED',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    unitText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#C2410C',
    },
    stockBadge: {
        backgroundColor: '#D4EDDA',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    outOfStockBadge: {
        backgroundColor: '#FEE2E2',
    },
    stockText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1B4332',
    },
    outOfStockText: {
        color: '#991B1B',
    },

    description: {
        fontSize: SIZES.font,
        color: COLORS.gray,
        lineHeight: 22,
    },

    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 4,
    },

    // Action row
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SIZES.small,
    },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden',
    },
    qtyBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#F0F0F0',
    },
    qtyBtnText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.black,
    },
    qtyText: {
        paddingHorizontal: 14,
        fontSize: SIZES.font,
        fontWeight: '700',
        color: COLORS.black,
    },
    addBtn: {
        flex: 1,
        backgroundColor: '#1B4332',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    addBtnAdded: {
        backgroundColor: '#2D6A4F',
    },
    addBtnText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: SIZES.font,
    },
});

export default ProductDetailModal;
