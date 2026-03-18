import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, Image, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { fetchBanners } from '../services/api';

const Banner = () => {
    const { width } = useWindowDimensions();
    const isLarge = width >= 768;
    const isXLarge = width >= 1200;
    const dynamicHeight = isXLarge ? 480 : (isLarge ? 350 : 242);
    const itemWidth = width - SIZES.padding * 2;

    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchBanners()
            .then(data => {
                const valid = data.filter(b => b.image && b.name);
                setBanners(valid);
            })
            .catch(err => console.error('Failed to load banners:', err))
            .finally(() => setLoading(false));
    }, []);

    // Track which slide is visible
    const handleScroll = (event) => {
        const scrollX = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollX / itemWidth);
        setCurrentIndex(index);
    };

    // Scroll to a specific slide by offset — works reliably on web + native
    const goToIndex = (index) => {
        scrollRef.current?.scrollTo({ x: index * itemWidth, animated: true });
        setCurrentIndex(index);
    };

    const handleNext = () => goToIndex(currentIndex < banners.length - 1 ? currentIndex + 1 : 0);
    const handlePrev = () => goToIndex(currentIndex > 0 ? currentIndex - 1 : banners.length - 1);

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator color={COLORS.primary} />
            </View>
        );
    }

    if (banners.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, { width: itemWidth, height: dynamicHeight }]}>
            {/* Horizontal paging ScrollView — explicit height avoids web collapse */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
                contentContainerStyle={{ height: dynamicHeight }}
            >
                {banners.map((item) => (
                    <View key={item.id} style={[styles.slide, { width: itemWidth, height: dynamicHeight }]}>
                        <Image
                            source={{ uri: item.image }}
                            style={[styles.image, { height: dynamicHeight }]}
                            resizeMode="contain"
                        />
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{item.name}</Text>
                            <Text style={styles.subtitle}>{item.description}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Prev / Next buttons */}
            <TouchableOpacity style={[styles.navButton, styles.leftButton, { top: dynamicHeight / 2 - 20 }]} onPress={handlePrev}>
                <Text style={styles.navText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navButton, styles.rightButton, { top: dynamicHeight / 2 - 20 }]} onPress={handleNext}>
                <Text style={styles.navText}>›</Text>
            </TouchableOpacity>

            {/* Dot indicators */}
            <View style={styles.dotsContainer}>
                {banners.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => goToIndex(i)}>
                        <View style={[styles.dot, i === currentIndex && styles.dotActive]} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: SIZES.padding,
        marginTop: SIZES.base,
        borderRadius: SIZES.radius,
        overflow: 'hidden',
        backgroundColor: COLORS.lightGray,
        alignSelf: 'center',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    slide: {
        backgroundColor: COLORS.white,
    },
    image: {
        width: '100%',
        // height set dynamically
    },
    textContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        padding: SIZES.medium,
    },
    title: {
        color: COLORS.white,
        fontSize: SIZES.large,
        fontWeight: 'bold',
    },
    subtitle: {
        color: COLORS.white,
        fontSize: SIZES.font,
        marginTop: 2,
    },
    navButton: {
        position: 'absolute',
        // top set dynamically
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    leftButton: { left: SIZES.small },
    rightButton: { right: SIZES.small },
    navText: {
        fontSize: 30,
        color: COLORS.black,
        lineHeight: 34,
        fontWeight: 'bold',
        paddingBottom: 4,
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 48,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    dotActive: {
        backgroundColor: COLORS.white,
        width: 18,
    },
});

export default Banner;
