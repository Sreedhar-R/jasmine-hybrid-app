import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, TextInput, FlatList, StyleSheet,
    TouchableOpacity, ActivityIndicator, SafeAreaView, useWindowDimensions,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { searchProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import { useCart } from '../context/CartContext';

const SearchScreen = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const numCols = width >= 768 ? 4 : 2;
    const initialQuery = route?.params?.query || '';
    const { addItem } = useCart();
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const inputRef = useRef(null);
    const debounceTimer = useRef(null);

    // Auto-focus the input and load all products on open
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
        runSearch(initialQuery); // loads all products when initialQuery is ''
    }, []);

    const runSearch = useCallback((q) => {
        setLoading(true);
        setSearched(true);
        searchProducts(q)
            .then(setResults)
            .catch(err => {
                console.error('Search failed:', err);
                setResults([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleChangeText = (text) => {
        setQuery(text);
        clearTimeout(debounceTimer.current);
        // Empty query → reload all products
        if (text.trim().length === 0) {
            debounceTimer.current = setTimeout(() => runSearch(''), 100);
            return;
        }
        // Otherwise debounce the search by 300ms
        debounceTimer.current = setTimeout(() => runSearch(text), 300);
    };

    // Fixed card width: (screen - padding - gaps) / numCols
    const gap = SIZES.small;
    const horizontalPad = SIZES.padding * 2; // same as HomeScreen
    const cardWidth = Math.floor((width - horizontalPad - gap * (numCols - 1)) / numCols);

    const renderProduct = ({ item }) => (
        <View style={{ width: cardWidth }}>
            <ProductCard
                item={item}
                onPress={() => setSelectedProduct(item)}
                onAddToCart={(product) => addItem(product)}
            />
        </View>
    );

    const renderEmpty = () => {
        if (!searched || loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>No results for "{query}"</Text>
                <Text style={styles.emptySubtitle}>Try a different name or description</Text>
            </View>
        );
    };

    return (
        <>
            <SafeAreaView style={styles.container}>
                {/* Search bar header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.searchBox}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="Search products..."
                            placeholderTextColor={COLORS.gray}
                            value={query}
                            onChangeText={handleChangeText}
                            returnKeyType="search"
                            onSubmitEditing={() => query.trim() && runSearch(query)}
                            clearButtonMode="while-editing"
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => { setQuery(''); }}>
                                <Text style={styles.clearText}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Results count */}
                {searched && !loading && results.length > 0 && (
                    <Text style={styles.resultsCount}>
                        {query.trim()
                            ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
                            : `${results.length} products`}
                    </Text>
                )}

                {/* Loading */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                )}

                {/* Product grid */}
                {!loading && (
                    <FlatList
                        data={results}
                        key={`search-${numCols}`}
                        keyExtractor={item => item.id}
                        renderItem={renderProduct}
                        numColumns={numCols}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={renderEmpty}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </SafeAreaView>

            <ProductDetailModal
                item={selectedProduct}
                visible={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onAddToCart={(product) => addItem(product)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.small,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        marginRight: SIZES.small,
        padding: 4,
    },
    backText: {
        fontSize: 24,
        color: COLORS.black,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: SIZES.small,
        paddingVertical: 8,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    input: {
        flex: 1,
        fontSize: SIZES.font,
        color: COLORS.black,
        outlineStyle: 'none',   // web: removes focus ring
    },
    clearText: {
        fontSize: 14,
        color: COLORS.gray,
        paddingHorizontal: 4,
    },
    resultsCount: {
        paddingHorizontal: SIZES.padding,
        paddingTop: SIZES.small,
        paddingBottom: 4,
        fontSize: SIZES.small,
        color: COLORS.gray,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        justifyContent: 'flex-start',
        paddingHorizontal: SIZES.padding,
        gap: SIZES.small,
    },
    listContent: {
        paddingVertical: SIZES.small,
        paddingHorizontal: SIZES.padding,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: SIZES.medium,
    },
    emptyTitle: {
        fontSize: SIZES.large,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: SIZES.small,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: SIZES.font,
        color: COLORS.gray,
        textAlign: 'center',
    },
});

export default SearchScreen;
