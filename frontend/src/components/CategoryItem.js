import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet, View } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const CategoryItem = ({ item, onPress, containerStyle, imageContainerStyle, imageStyle, isSelected }) => {
    return (
        <TouchableOpacity style={[styles.container, containerStyle]} onPress={onPress} activeOpacity={0.75}>
            <View style={[styles.imageContainer, imageContainerStyle, isSelected && styles.imageContainerSelected]}>
                <Image
                    source={{ uri: item.image }}
                    style={[styles.image, imageStyle]}
                />
            </View>
            <Text style={[styles.name, isSelected && styles.nameSelected]}>{item.name}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: '30%', // Approximate width for 3 columns
    },
    imageContainer: {
        width: 75,
        height: 75,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.base,
        overflow: 'hidden',
        shadowColor: COLORS.gray, // Soft shadow
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    name: {
        color: COLORS.black,
        fontSize: SIZES.small,
        fontWeight: 'bold',
    },
    imageContainerSelected: {
        borderWidth: 2.5,
        borderColor: '#2196F3',
        backgroundColor: '#E3F2FD',
    },
    nameSelected: {
        color: '#1565C0',
        fontWeight: '800',
    },
});

export default CategoryItem;
