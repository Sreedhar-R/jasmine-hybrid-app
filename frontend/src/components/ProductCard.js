import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const ProductCard = ({ item, onPress, onAddToCart }) => {
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);

    const increment = () => setQty(q => q + 1);
    const decrement = () => setQty(q => (q > 1 ? q - 1 : 1));

    const handleAdd = () => {
        if (onAddToCart) onAddToCart({ ...item, qty });
        setQty(1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
            {/* Image area — white/light bg like reference */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                    resizeMode="contain"
                />
                {Array.isArray(item.images) && item.images.length > 1 && (
                    <View style={styles.multiImageBadge}>
                        <Text style={styles.multiImageBadgeText}>📷 {item.images.length}</Text>
                    </View>
                )}
            </View>

            {/* Details */}
            <View style={styles.details}>
                {/* Name */}
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>

                {/* Price */}
                {item.originalPrice && item.discountedPrice && item.originalPrice > item.discountedPrice ? (
                    <View style={styles.priceRow}>
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountBadgeText}>
                                {Math.round((1 - item.discountedPrice / item.originalPrice) * 100)}% OFF
                            </Text>
                        </View>
                        <Text style={styles.originalPrice}>₹{Number(item.originalPrice).toFixed(2)}</Text>
                        <Text style={styles.discountedPrice}>₹{Number(item.discountedPrice).toFixed(2)}</Text>
                    </View>
                ) : (
                    <Text style={styles.price}>₹{Number(item.price).toFixed(2)}</Text>
                )}

                {/* Description */}
                {item.description ? (
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                ) : null}

                {/* Unit */}
                {item.unit ? (
                    <Text style={styles.unit}>{item.unit}</Text>
                ) : null}

                {/* Quantity + Add row */}
                <View style={styles.actionRow}>
                    <View style={styles.qtyContainer}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={decrement}>
                            <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={increment}>
                            <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.addBtn, added && styles.addBtnAdded]}
                        onPress={handleAdd}
                    >
                        <Text style={styles.addBtnText}>{added ? '✓ Added!' : 'Add'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: SIZES.padding,
    },
    imageContainer: {
        backgroundColor: '#F8F8F6',
        width: '100%',
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.small,
    },
    multiImageBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.52)',
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    multiImageBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    image: {
        width: '80%',
        height: '80%',
    },
    details: {
        padding: SIZES.small,
        gap: 4,
    },
    name: {
        fontSize: SIZES.font,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 2,
    },
    price: {
        fontSize: SIZES.large,
        fontWeight: '800',
        color: COLORS.black,
        marginTop: 2,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    discountBadge: {
        backgroundColor: '#D4EDDA',
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    discountBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1B4332',
    },
    originalPrice: {
        fontSize: SIZES.font,
        color: COLORS.gray,
        textDecorationLine: 'line-through',
        fontWeight: '500',
    },
    discountedPrice: {
        fontSize: SIZES.large,
        fontWeight: '800',
        color: '#1B4332',
    },
    description: {
        fontSize: 12,
        color: COLORS.gray,
        lineHeight: 16,
    },
    unit: {
        fontSize: 11,
        color: COLORS.gray,
        fontStyle: 'italic',
        marginBottom: 2,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SIZES.small,
    },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        overflow: 'hidden',
    },
    qtyBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#F0F0F0',
    },
    qtyBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
    },
    qtyText: {
        paddingHorizontal: 12,
        fontSize: SIZES.font,
        fontWeight: '600',
        color: COLORS.black,
    },
    addBtn: {
        backgroundColor: '#1B4332',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
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

export default ProductCard;
