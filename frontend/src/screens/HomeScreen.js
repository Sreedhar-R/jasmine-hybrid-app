import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, Platform, useWindowDimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../constants/theme';
import { fetchCategories, fetchProducts, fetchProductsByCategory } from '../services/api';
import Header from '../components/Header';
import Banner from '../components/Banner';
import CategoryItem from '../components/CategoryItem';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';

const HomeScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const isLargeScreen = width >= 768;
    const { addItem } = useCart();

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        Promise.all([fetchCategories(), fetchProducts()])
            .then(([cats, prods]) => {
                setCategories(cats);
                setProducts(prods);
            })
            .catch(err => console.error('Failed to load data:', err))
            .finally(() => setLoading(false));
    }, []);

    const handleCategoryPress = (category) => {
        const isSame = selectedCategory?.name === category.name;
        if (isSame) {
            // Deselect: reload all products
            setSelectedCategory(null);
            setProductsLoading(true);
            fetchProducts()
                .then(setProducts)
                .catch(err => console.error('Failed to load products:', err))
                .finally(() => setProductsLoading(false));
        } else {
            // Select new category
            setSelectedCategory(category);
            setProductsLoading(true);
            fetchProductsByCategory(category.name)
                .then(setProducts)
                .catch(err => console.error('Failed to load category products:', err))
                .finally(() => setProductsLoading(false));
        }
    };

    const renderCategory = ({ item }) => (
        <CategoryItem
            item={item}
            onPress={() => handleCategoryPress(item)}
            isSelected={selectedCategory?.name === item.name}
            containerStyle={isLargeScreen ? styles.webCategoryContainer : null}
            imageContainerStyle={isLargeScreen ? styles.webImageContainer : null}
        />
    );

    const numProductCols = isLargeScreen ? 4 : 2;
    const cardGap = SIZES.small;
    const cardHPad = SIZES.padding * 2; // matches section paddingHorizontal
    const cardWidth = Math.floor((width - cardHPad - cardGap * (numProductCols - 1)) / numProductCols);

    const renderProduct = ({ item }) => (
        <View style={{ width: cardWidth }}>
            <ProductCard
                item={item}
                onPress={() => setSelectedProduct(item)}
                onAddToCart={(product) => addItem(product)}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header />
            <ScrollView showsVerticalScrollIndicator={false}>
                <Banner />

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Categories</Text>
                            <FlatList
                                data={categories}
                                key={isLargeScreen ? 'large' : 'small'}
                                horizontal={false}
                                numColumns={isLargeScreen ? 9 : 3}
                                scrollEnabled={false}
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={item => item.id}
                                renderItem={renderCategory}
                                columnWrapperStyle={isLargeScreen ? styles.webCategoryRow : styles.categoryRow}
                                contentContainerStyle={styles.categoryList}
                            />
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>
                                    {selectedCategory ? selectedCategory.name : 'Featured Products'}
                                </Text>
                                {selectedCategory && (
                                    <TouchableOpacity onPress={() => handleCategoryPress(selectedCategory)}>
                                        <Text style={styles.clearFilter}>✕ All</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {productsLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                </View>
                            ) : products.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No products found in this category.</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={products}
                                    key={`products-${numProductCols}`}
                                    numColumns={numProductCols}
                                    scrollEnabled={false}
                                    showsVerticalScrollIndicator={false}
                                    keyExtractor={item => item.id}
                                    renderItem={renderProduct}
                                    columnWrapperStyle={styles.productRow}
                                    contentContainerStyle={styles.productList}
                                />
                            )}
                        </View>
                    </>
                )}
                <Footer />
            </ScrollView>

            <ProductDetailModal
                item={selectedProduct}
                visible={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onAddToCart={(product) => { addItem(product); }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding * 2,
    },
    loadingText: {
        marginTop: SIZES.small,
        color: COLORS.gray,
        fontSize: SIZES.font,
    },
    section: {
        marginTop: SIZES.medium,
        paddingHorizontal: SIZES.padding,
    },
    sectionTitle: {
        fontSize: SIZES.large,
        fontWeight: 'bold',
        marginBottom: SIZES.medium,
        color: COLORS.black,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SIZES.medium,
    },
    clearFilter: {
        fontSize: SIZES.font,
        color: '#1B4332',
        fontWeight: '600',
    },
    emptyContainer: {
        paddingVertical: SIZES.padding * 2,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: SIZES.font,
        color: COLORS.gray,
    },
    categoryList: {
        paddingBottom: SIZES.padding,
    },
    webCategoryContainer: {
        width: 'auto',
        alignItems: 'center',
        flex: 1,
    },
    webImageContainer: {
        width: 110,
        height: 110,
        borderRadius: 16,
    },
    categoryRow: {
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
    },
    webCategoryRow: {
        justifyContent: 'space-between',
        width: '100%',
    },
    productList: {
        paddingBottom: SIZES.padding,
    },
    productRow: {
        justifyContent: 'flex-start',
        gap: SIZES.small,
    },
    productWrapper: {
        flex: 1,
    },
});

export default HomeScreen;
