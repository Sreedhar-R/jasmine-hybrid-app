import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const ProductCard = ({ item, onPress, onAddToCart }) => {
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);

    const isOutOfStock = (item.stock !== undefined && item.stock !== null) && item.stock <= 0;
    const maxStock = (item.stock !== undefined && item.stock !== null) ? item.stock : 99;

    const increment = () => setQty(q => q < maxStock ? q + 1 : q);
    const decrement = () => setQty(q => (q > 1 ? q - 1 : 1));

    const handleAdd = () => {
        if (onAddToCart) onAddToCart({ ...item, qty });
        setQty(1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
    };

    const displayImage = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.image;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
            {/* Image area — white/light bg like reference */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: displayImage }}
                    style={styles.image}
                    resizeMode="contain"
                />
                {Array.isArray(item.images) && item.images.length > 1 && (
                    <View style={styles.multiImageBadge}>
                        <Text style={styles.multiImageBadgeText}>📷 {item.images.length}</Text>
                    </View>
                )}
                {isOutOfStock && (
                    <View style={styles.soldOutBadge}>
                        <Text style={styles.soldOutText}>SOLD OUT</Text>
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

                {/* Unit & Stock Status */}
                <View style={styles.metaRow}>
                    {item.unit ? <Text style={styles.unit}>{item.unit}</Text> : <View />}
                    {(item.stock !== undefined && item.stock !== null) && (
                        <Text style={[styles.stockStatus, isOutOfStock && styles.outOfStock]}>
                            {isOutOfStock ? 'Out of Stock' : `In Stock (${item.stock})`}
                        </Text>
                    )}
                </View>

                {/* Quantity + Add row */}
                <View style={styles.actionRow}>
                    <View style={[styles.qtyContainer, isOutOfStock && styles.disabledOp]}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={decrement} disabled={isOutOfStock}>
                            <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{isOutOfStock ? 0 : qty}</Text>
                        <TouchableOpacity 
                            style={styles.qtyBtn} 
                            onPress={increment} 
                            disabled={isOutOfStock || qty >= maxStock}
                        >
                            <Text style={[styles.qtyBtnText, (isOutOfStock || qty >= maxStock) && { color: '#ccc' }]}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.addBtn, added && styles.addBtnAdded, isOutOfStock && styles.addBtnDisabled]}
                        onPress={handleAdd}
                        disabled={isOutOfStock}
                    >
                        <Text style={styles.addBtnText}>
                            {isOutOfStock ? 'Sold Out' : (added ? '✓ Added!' : 'Add')}
                        </Text>
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
    addBtnDisabled: {
        backgroundColor: '#E5E7EB',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2,
    },
    stockStatus: {
        fontSize: 10,
        fontWeight: '700',
        color: '#059669',
        textTransform: 'uppercase',
    },
    outOfStock: {
        color: '#DC2626',
    },
    soldOutBadge: {
        position: 'absolute',
        backgroundColor: 'rgba(220, 38, 38, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    soldOutText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    disabledOp: {
        opacity: 0.5,
    },
});

export default ProductCard;
