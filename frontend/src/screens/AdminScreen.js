import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    SafeAreaView, Modal, TextInput, ActivityIndicator,
    Switch, Platform, Alert, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import {
    fetchAllOrders, fetchProducts, fetchCategories, fetchBanners,
    fetchSubscribableProducts,
    createProduct, updateProduct,
    createCategory, updateCategory, deleteCategory,
    createBanner, updateBanner,
} from '../services/api';

// ─── Palette ──────────────────────────────────────────────────────────────────
const P = {
    bg: '#F7F8FA',
    card: '#FFFFFF',
    primary: '#2D6A4F',
    accent: '#52B788',
    danger: '#DC2626',
    warn: '#F59E0B',
    text: '#111827',
    subtle: '#6B7280',
    border: '#E5E7EB',
    tabBg: '#EEF2EE',
};

const TABS = ['Orders', 'Products', 'Categories', 'Banners', 'Subscriptions'];
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (iso) => iso
    ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isUrl = (s) => typeof s === 'string' && (s.startsWith('http') || s.startsWith('/'));

/** Shows a URL image or a big emoji fallback */
const Thumb = ({ uri, emoji, size = 56, radius = 10 }) => {
    const [err, setErr] = useState(false);
    if (isUrl(uri) && !err) {
        return (
            <Image
                source={{ uri }}
                style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#EEF2EE' }}
                resizeMode="cover"
                onError={() => setErr(true)}
            />
        );
    }
    return (
        <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#EEF2EE', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: size * 0.45 }}>{emoji ?? '🖼️'}</Text>
        </View>
    );
};

const StatusBadge = ({ status }) => {
    const color = {
        placed: '#16A34A', failed: '#DC2626', pending: '#D97706',
        delivered: '#2563EB', cancelled: '#6B7280', processing: '#7C3AED',
    }[status?.toLowerCase()] || '#6B7280';
    return (
        <View style={[adm.badge, { backgroundColor: color + '22' }]}>
            <Text style={[adm.badgeTxt, { color }]}>{status?.toUpperCase()}</Text>
        </View>
    );
};

// ─── Entity form config ───────────────────────────────────────────────────────
const FORM_CONFIG = {
    product: [
        { key: 'name', label: 'Product Name', required: true },
        { key: 'price', label: 'Price (₹)', required: true, numeric: true },
        { key: 'unit', label: 'Unit (e.g. 1kg)' },
        { key: 'category', label: 'Category' },
        { key: 'description', label: 'Description', multiline: true },
        { key: 'image', label: 'Image (emoji or URL)' },
        { key: 'stock', label: 'Stock qty', numeric: true },
        { key: 'subscriptionAvailable', label: 'Available for Subscription', toggle: true },
    ],
    category: [
        { key: 'name', label: 'Category Name', required: true },
        { key: 'emoji', label: 'Emoji' },
        { key: 'order', label: 'Display Order', numeric: true },
    ],
    banner: [
        { key: 'title', label: 'Title', required: true },
        { key: 'subtitle', label: 'Subtitle' },
        { key: 'image', label: 'Image URL (or emoji)' },
        { key: 'order', label: 'Display Order', numeric: true },
        { key: 'active', label: 'Active', toggle: true },
    ],
};

// ─── Entity Form Modal ────────────────────────────────────────────────────────
const EntityForm = ({ visible, entity, type, onClose, onSave }) => {
    const fields = FORM_CONFIG[type] || [];
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!visible) return;
        const init = {};
        fields.forEach(f => {
            init[f.key] = entity ? (entity[f.key] ?? (f.toggle ? false : '')) : (f.toggle ? false : '');
        });
        setForm(init);
    }, [visible, entity]);

    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

    const handleSave = async () => {
        const missing = fields.filter(f => f.required && !form[f.key]);
        if (missing.length) {
            Alert.alert('Required', `Please fill: ${missing.map(f => f.label).join(', ')}`);
            return;
        }
        setSaving(true);
        const payload = { ...form };
        fields.forEach(f => {
            if (f.numeric && payload[f.key] !== '' && payload[f.key] !== undefined)
                payload[f.key] = Number(payload[f.key]);
        });
        try {
            await onSave(payload);
            onClose();
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setSaving(false);
        }
    };

    // Live image preview inside form
    const imgVal = form['image'];
    const showPreview = type !== 'category' && isUrl(imgVal);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={frm.overlay}>
                <View style={frm.sheet}>
                    <View style={frm.titleRow}>
                        <Text style={frm.title}>{entity ? `Edit ${type}` : `Add ${type}`}</Text>
                        <TouchableOpacity onPress={onClose}><Text style={frm.close}>✕</Text></TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: '82%' }} showsVerticalScrollIndicator={false}>
                        {showPreview && (
                            <Image
                                source={{ uri: imgVal }}
                                style={frm.preview}
                                resizeMode="cover"
                            />
                        )}
                        {fields.map(f => (
                            <View key={f.key} style={frm.fieldWrap}>
                                <Text style={frm.label}>{f.label}{f.required ? ' *' : ''}</Text>
                                {f.toggle ? (
                                    <Switch
                                        value={!!form[f.key]}
                                        onValueChange={v => set(f.key, v)}
                                        trackColor={{ true: P.primary }}
                                        thumbColor={form[f.key] ? '#fff' : '#f4f3f4'}
                                    />
                                ) : (
                                    <TextInput
                                        style={[frm.input, f.multiline && frm.inputMulti]}
                                        value={String(form[f.key] ?? '')}
                                        onChangeText={v => set(f.key, v)}
                                        placeholder={f.label}
                                        placeholderTextColor={P.subtle}
                                        keyboardType={f.numeric ? 'numeric' : 'default'}
                                        multiline={!!f.multiline}
                                        numberOfLines={f.multiline ? 3 : 1}
                                    />
                                )}
                            </View>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={[frm.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={frm.saveTxt}>💾 Save</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ─── Orders Tab ───────────────────────────────────────────────────────────────
const OrdersTab = () => {
    const [date, setDate] = useState(today());
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState({});

    const load = useCallback((d) => {
        setLoading(true);
        fetchAllOrders(d)
            .then(setOrders)
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(date); }, [date]);

    const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

    return (
        <View style={{ flex: 1 }}>
            <View style={adm.datePick}>
                <Text style={adm.dateLabel}>📅 Filter by Date</Text>
                {Platform.OS === 'web' ? (
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        style={{ fontSize: 14, padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
                    />
                ) : (
                    <TextInput style={adm.dateInput} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
                )}
            </View>

            {loading ? (
                <ActivityIndicator color={P.primary} style={{ marginTop: 40 }} />
            ) : orders.length === 0 ? (
                <Text style={adm.empty}>No orders on {date}</Text>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
                    <Text style={adm.sectionCount}>{orders.length} order{orders.length !== 1 ? 's' : ''}</Text>
                    {orders.map(o => {
                        const items = o.items || [];
                        const total = o.total ?? o.totalAmount ?? 0;
                        const open = expanded[o.id];
                        const addr = o.deliveryAddress ?? o.address;
                        const addrStr = typeof addr === 'string' ? addr
                            : addr ? [addr.street, addr.apartment, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')
                                : '—';
                        return (
                            <TouchableOpacity key={o.id} style={adm.orderCard} onPress={() => toggle(o.id)} activeOpacity={0.85}>
                                {/* Header row */}
                                <View style={adm.orderTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={adm.orderUser} numberOfLines={1}>{o.email || o.userId?.slice(0, 16) || '—'}</Text>
                                        <Text style={adm.orderTime}>{fmt(o.createdAt)}</Text>
                                        {o.source === 'subscription' &&
                                            <View style={adm.subChip}><Text style={adm.subChipTxt}>📅 Subscription</Text></View>}
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <StatusBadge status={o.status} />
                                        <Text style={adm.orderTotal}>₹{total.toFixed(0)}</Text>
                                    </View>
                                </View>

                                {/* Failure reason */}
                                {o.failureReason && (
                                    <View style={adm.failBanner}>
                                        <Text style={adm.failReason}>⚠ {o.failureReason}</Text>
                                    </View>
                                )}

                                {/* Item thumbnails strip */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                                    {items.map((it, i) => {
                                        const img = it.image ?? it.productImage;
                                        const name = it.name ?? it.productName;
                                        const qty = it.qty ?? it.quantity ?? 1;
                                        return (
                                            <View key={i} style={adm.itemThumbWrap}>
                                                <Thumb uri={isUrl(img) ? img : null} emoji={isUrl(img) ? null : img} size={48} radius={8} />
                                                <Text style={adm.itemThumbName} numberOfLines={1}>{name}</Text>
                                                <Text style={adm.itemThumbQty}>×{qty}</Text>
                                            </View>
                                        );
                                    })}
                                </ScrollView>

                                {/* Expanded details */}
                                {open && (
                                    <View style={adm.expandedBlock}>
                                        <View style={adm.detailDivider} />
                                        {/* Items list */}
                                        {items.map((it, i) => {
                                            const name = it.name ?? it.productName;
                                            const qty = it.qty ?? it.quantity ?? 1;
                                            const price = it.price ?? 0;
                                            const unit = it.unit ?? '';
                                            return (
                                                <View key={i} style={adm.detailRow}>
                                                    <Text style={adm.detailName} numberOfLines={1}>{name} {unit ? `(${unit})` : ''}</Text>
                                                    <Text style={adm.detailQty}>×{qty}</Text>
                                                    <Text style={adm.detailPrice}>₹{(price * qty).toFixed(0)}</Text>
                                                </View>
                                            );
                                        })}
                                        <View style={adm.detailDivider} />
                                        <View style={adm.detailRow}>
                                            <Text style={[adm.detailName, { fontWeight: '700' }]}>Total</Text>
                                            <Text style={[adm.detailPrice, { fontWeight: '800', color: P.primary }]}>₹{total.toFixed(0)}</Text>
                                        </View>
                                        <View style={adm.metaBlock}>
                                            {o.paymentMethod ? <Text style={adm.metaTxt}>💳 {o.paymentMethod}</Text> : null}
                                            {addrStr !== '—' ? <Text style={adm.metaTxt}>📍 {addrStr}</Text> : null}
                                            {o.razorpayOrderId ? <Text style={adm.metaTxt}>🆔 {o.razorpayOrderId}</Text> : null}
                                        </View>
                                    </View>
                                )}

                                <Text style={adm.expandHint}>{open ? '▲ Less' : '▼ Details'}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
};

// ─── Generic CRUD list tab ────────────────────────────────────────────────────
const CrudTab = ({ type, fetchFn, createFn, updateFn, deleteFn, renderRow }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formVisible, setFormVisible] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    const reload = useCallback(() => {
        setLoading(true);
        fetchFn().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
    }, [fetchFn]);

    useEffect(() => { reload(); }, [reload]);

    const openAdd = () => { setEditTarget(null); setFormVisible(true); };
    const openEdit = (item) => { setEditTarget(item); setFormVisible(true); };
    const handleSave = async (payload) => {
        if (editTarget) { await updateFn(editTarget.id, payload); }
        else { await createFn(payload); }
        reload();
    };
    const handleDelete = (item) => {
        Alert.alert(
            `Delete ${type}`,
            `Are you sure you want to delete "${item.name || item.title || item.id}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try { await deleteFn(item.id); reload(); }
                        catch (e) { Alert.alert('Error', e.message); }
                    },
                },
            ]
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={adm.crudHeader}>
                <Text style={adm.crudCount}>{items.length} {type}{items.length !== 1 ? 's' : ''}</Text>
                <TouchableOpacity style={adm.addBtn} onPress={openAdd}>
                    <Text style={adm.addBtnTxt}>＋ Add</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color={P.primary} style={{ marginTop: 40 }} />
            ) : items.length === 0 ? (
                <Text style={adm.empty}>No {type}s found</Text>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
                    {items.map(item => (
                        <View key={item.id} style={adm.crudRow}>
                            <View style={{ flex: 1 }}>{renderRow(item)}</View>
                            <View style={adm.actionBtns}>
                                <TouchableOpacity style={adm.editBtn} onPress={() => openEdit(item)}>
                                    <Text style={adm.editBtnTxt}>✏</Text>
                                </TouchableOpacity>
                                {deleteFn && (
                                    <TouchableOpacity style={adm.deleteBtn} onPress={() => handleDelete(item)}>
                                        <Text style={adm.deleteBtnTxt}>🗑</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            <EntityForm
                visible={formVisible}
                entity={editTarget}
                type={type}
                onClose={() => setFormVisible(false)}
                onSave={handleSave}
            />
        </View>
    );
};

// ─── Row renderers ────────────────────────────────────────────────────────────
const ProductRow = (item) => (
    <View style={adm.richRow}>
        <Thumb uri={isUrl(item.image) ? item.image : null} emoji={isUrl(item.image) ? null : item.image} size={56} radius={10} />
        <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={adm.rowTitle}>{item.name}</Text>
            <Text style={adm.rowPrice}>₹{item.price}  <Text style={adm.rowUnit}>{item.unit}</Text></Text>
            <Text style={adm.rowMeta}>📂 {item.category || '—'}</Text>
            <Text style={adm.rowMeta}>
                {'📦 Stock: '}
                {item.stock != null
                    ? <Text style={{ fontWeight: '700', color: item.stock <= 5 ? '#DC2626' : '#065F46' }}>{item.stock}</Text>
                    : <Text style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Not tracked</Text>
                }
            </Text>
            {item.description ? <Text style={adm.rowDesc} numberOfLines={2}>{item.description}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                {item.subscriptionAvailable && <View style={adm.chip}><Text style={adm.chipTxt}>📅 Subscribable</Text></View>}
            </View>
        </View>
    </View>
);

const CategoryRow = (item) => (
    <View style={adm.richRow}>
        <View style={adm.emojiBox}>
            <Text style={{ fontSize: 28 }}>{item.emoji ?? '📂'}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={adm.rowTitle}>{item.name}</Text>
            <Text style={adm.rowMeta}>Display order: {item.order ?? '—'}</Text>
        </View>
    </View>
);

const BannerRow = (item) => (
    <View style={{ gap: 8 }}>
        {isUrl(item.image) ? (
            <Image source={{ uri: item.image }} style={adm.bannerImg} resizeMode="cover" />
        ) : item.image ? (
            <View style={[adm.bannerImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2EE' }]}>
                <Text style={{ fontSize: 40 }}>{item.image}</Text>
            </View>
        ) : null}
        <View style={{ paddingHorizontal: 2 }}>
            <Text style={adm.rowTitle}>{item.title}</Text>
            {item.subtitle ? <Text style={adm.rowMeta}>{item.subtitle}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <View style={[adm.chip, { backgroundColor: item.active ? '#D1FAE5' : '#F3F4F6' }]}>
                    <Text style={[adm.chipTxt, { color: item.active ? '#065F46' : P.subtle }]}>
                        {item.active ? '✅ Active' : '⏸ Inactive'}
                    </Text>
                </View>
                <Text style={adm.rowMeta}>Order: {item.order ?? '—'}</Text>
            </View>
        </View>
    </View>
);

const SubRow = (item) => (
    <View style={adm.richRow}>
        <Thumb uri={isUrl(item.image) ? item.image : null} emoji={isUrl(item.image) ? null : item.image} size={56} radius={10} />
        <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={adm.rowTitle}>{item.name}</Text>
            <Text style={adm.rowPrice}>₹{item.price}  <Text style={adm.rowUnit}>{item.unit}</Text></Text>
            <Text style={adm.rowMeta}>📂 {item.category || '—'}</Text>
            <Text style={adm.rowMeta}>
                {'📦 Stock: '}
                {item.stock != null
                    ? <Text style={{ fontWeight: '700', color: item.stock <= 5 ? '#DC2626' : '#065F46' }}>{item.stock}</Text>
                    : <Text style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Not tracked</Text>
                }
            </Text>
            <View style={adm.chip}><Text style={adm.chipTxt}>📅 Subscription enabled</Text></View>
        </View>
    </View>
);

// ─── Main AdminScreen ─────────────────────────────────────────────────────────
const AdminScreen = () => {
    const navigation = useNavigation();
    const [tab, setTab] = useState(0);

    return (
        <SafeAreaView style={adm.safe}>
            <Header />

            <View style={adm.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={adm.backBtn}>
                    <Text style={adm.backTxt}>← Back</Text>
                </TouchableOpacity>
                <Text style={adm.screenTitle}>🛡️ Admin Dashboard</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={adm.tabBar} contentContainerStyle={adm.tabBarContent}>
                {TABS.map((t, i) => (
                    <TouchableOpacity key={t} style={[adm.tabBtn, tab === i && adm.tabBtnActive]} onPress={() => setTab(i)}>
                        <Text style={[adm.tabTxt, tab === i && adm.tabTxtActive]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={{ flex: 1, backgroundColor: P.bg }}>
                {tab === 0 && <OrdersTab />}

                {tab === 1 && (
                    <CrudTab type="product" fetchFn={fetchProducts} createFn={createProduct} updateFn={updateProduct}
                        renderRow={ProductRow} />
                )}

                {tab === 2 && (
                    <CrudTab
                        type="category"
                        fetchFn={fetchCategories}
                        createFn={createCategory}
                        updateFn={updateCategory}
                        deleteFn={deleteCategory}
                        renderRow={CategoryRow}
                    />
                )}

                {tab === 3 && (
                    <CrudTab type="banner" fetchFn={fetchBanners} createFn={createBanner} updateFn={updateBanner}
                        renderRow={BannerRow} />
                )}

                {tab === 4 && (
                    <CrudTab type="product" fetchFn={fetchSubscribableProducts} createFn={createProduct} updateFn={updateProduct}
                        renderRow={SubRow} />
                )}
            </View>
        </SafeAreaView>
    );
};

export default AdminScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const adm = StyleSheet.create({
    safe: { flex: 1, backgroundColor: P.bg },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: P.card, borderBottomWidth: 1, borderBottomColor: P.border },
    backBtn: { marginRight: 12 },
    backTxt: { fontSize: 14, color: P.primary, fontWeight: '600' },
    screenTitle: { fontSize: 18, fontWeight: '800', color: P.text },
    tabBar: { backgroundColor: P.card, borderBottomWidth: 1, borderBottomColor: P.border, maxHeight: 46 },
    tabBarContent: { flexDirection: 'row', paddingHorizontal: 12, gap: 4, alignItems: 'center' },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6 },
    tabBtnActive: { backgroundColor: P.primary },
    tabTxt: { fontSize: 13, fontWeight: '600', color: P.subtle },
    tabTxtActive: { color: '#fff' },

    // Orders
    datePick: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: P.card, borderBottomWidth: 1, borderBottomColor: P.border },
    dateLabel: { fontSize: 14, fontWeight: '600', color: P.text },
    dateInput: { fontSize: 14, borderWidth: 1, borderColor: P.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, minWidth: 120 },
    sectionCount: { fontSize: 12, color: P.subtle, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    orderCard: { backgroundColor: P.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: P.border },
    orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    orderUser: { fontSize: 13, fontWeight: '700', color: P.text },
    orderTime: { fontSize: 11, color: P.subtle, marginTop: 2 },
    orderTotal: { fontSize: 15, fontWeight: '900', color: P.primary, marginTop: 4 },
    subChip: { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
    subChipTxt: { fontSize: 10, color: '#065F46', fontWeight: '700' },
    failBanner: { backgroundColor: '#FFF0F0', borderRadius: 8, padding: 8, marginTop: 8, borderLeftWidth: 3, borderLeftColor: P.danger },
    failReason: { fontSize: 11, color: P.danger, fontWeight: '600' },
    badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
    badgeTxt: { fontSize: 10, fontWeight: '800' },
    itemThumbWrap: { alignItems: 'center', marginRight: 10, width: 56 },
    itemThumbName: { fontSize: 9, color: P.subtle, textAlign: 'center', marginTop: 3, width: 56 },
    itemThumbQty: { fontSize: 10, color: P.text, fontWeight: '700' },
    expandedBlock: { marginTop: 10 },
    detailDivider: { height: 1, backgroundColor: P.border, marginVertical: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    detailName: { flex: 1, fontSize: 13, color: P.text },
    detailQty: { fontSize: 13, color: P.subtle, marginHorizontal: 8 },
    detailPrice: { fontSize: 13, color: P.text, minWidth: 50, textAlign: 'right' },
    metaBlock: { marginTop: 8, gap: 4 },
    metaTxt: { fontSize: 12, color: P.subtle },
    expandHint: { fontSize: 11, color: P.primary, textAlign: 'center', marginTop: 10, fontWeight: '600' },

    // CRUD shared
    crudHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: P.card, borderBottomWidth: 1, borderBottomColor: P.border },
    crudCount: { fontSize: 13, color: P.subtle, fontWeight: '600' },
    addBtn: { backgroundColor: P.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
    addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
    crudRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: P.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: P.border },
    actionBtns: { flexDirection: 'column', gap: 6, marginLeft: 8 },
    editBtn: { backgroundColor: P.tabBg, borderRadius: 8, padding: 8 },
    editBtnTxt: { fontSize: 16 },
    deleteBtn: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 8 },
    deleteBtnTxt: { fontSize: 16 },
    richRow: { flexDirection: 'row', alignItems: 'flex-start' },
    emojiBox: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#EEF2EE', alignItems: 'center', justifyContent: 'center' },
    rowTitle: { fontSize: 14, fontWeight: '700', color: P.text },
    rowPrice: { fontSize: 15, fontWeight: '800', color: P.primary, marginTop: 2 },
    rowUnit: { fontSize: 12, fontWeight: '400', color: P.subtle },
    rowMeta: { fontSize: 12, color: P.subtle, marginTop: 2 },
    rowDesc: { fontSize: 12, color: P.subtle, marginTop: 4, fontStyle: 'italic' },
    chip: { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
    chipTxt: { fontSize: 10, color: '#065F46', fontWeight: '700' },
    bannerImg: { width: '100%', height: 120, borderRadius: 10, backgroundColor: '#EEF2EE' },
    empty: { textAlign: 'center', color: P.subtle, marginTop: 60, fontSize: 15 },
});

const frm = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 36 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '800', color: '#111827', textTransform: 'capitalize' },
    close: { fontSize: 22, color: '#6B7280', padding: 4 },
    preview: { width: '100%', height: 140, borderRadius: 12, marginBottom: 16, backgroundColor: '#EEF2EE' },
    fieldWrap: { marginBottom: 14 },
    label: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#FAFAFA' },
    inputMulti: { height: 80, textAlignVertical: 'top' },
    saveBtn: { backgroundColor: '#2D6A4F', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
    saveTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
