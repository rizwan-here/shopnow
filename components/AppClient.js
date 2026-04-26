'use client';

import { useEffect, useMemo, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ORDER_ACTIONS, ORDER_PROGRESS_STEPS, ORDER_STATUS_LABELS } from '@/lib/constants';
import BrandMark from '@/components/BrandMark';
import { currency } from '@/lib/utils';

const EMPTY_STORE = { profile: null, categories: [], products: [], links: [], orders: [] };
const CURRENCY_OPTIONS = ['BDT', 'USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR', 'MYR'];
const STOCK_STATUS_OPTIONS = [
  ['in_stock', 'In stock'],
  ['low_stock', 'Low stock'],
  ['stock_out', 'Stock out']
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free size'];

function createEmptyVariety() {
  return { name: '', imageUrl: '' };
}

function createProductForm() {
  return {
    name: '',
    shortDescription: '',
    price: '',
    compareAtPrice: '',
    stockQuantity: '1',
    stockStatus: 'in_stock',
    description: '',
    imageUrl: '',
    hasSizes: false,
    selectedSizes: [],
    colorOptions: '',
    hasVarieties: false,
    varieties: [createEmptyVariety()],
    categoryIds: [],
    length: '',
    chest: '',
    waist: '',
    fabric: '',
    fitNote: '',
    deliveryEstimate: '',
    returnPolicy: '',
    featured: false
  };
}


function createProductFormFromProduct(product) {
  return {
    name: product.name || '',
    shortDescription: product.shortDescription || '',
    price: product.price !== undefined ? String(product.price) : '',
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
    stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : '1',
    stockStatus: product.stockStatus || 'in_stock',
    description: product.description || '',
    imageUrl: product.imageUrl || '',
    hasSizes: Array.isArray(product.sizeOptions) && product.sizeOptions.length > 0,
    selectedSizes: Array.isArray(product.sizeOptions) ? product.sizeOptions : [],
    colorOptions: Array.isArray(product.colorOptions) ? product.colorOptions.join(', ') : '',
    hasVarieties: Array.isArray(product.varieties) && product.varieties.length > 0,
    varieties: Array.isArray(product.varieties) && product.varieties.length > 0 ? product.varieties.map((item) => ({ name: item.name || '', imageUrl: item.imageUrl || '' })) : [createEmptyVariety()],
    categoryIds: Array.isArray(product.categoryIds) ? product.categoryIds.map((id) => String(id)) : [],
    length: product.measurements?.length || '',
    chest: product.measurements?.chest || '',
    waist: product.measurements?.waist || '',
    fabric: product.measurements?.fabric || '',
    fitNote: product.measurements?.fitNote || '',
    deliveryEstimate: product.deliveryEstimate || '',
    returnPolicy: product.returnPolicy || '',
    featured: Boolean(product.featured)
  };
}

function getStockStatusLabel(status) {
  return Object.fromEntries(STOCK_STATUS_OPTIONS)[status || 'in_stock'] || 'In stock';
}

const INITIAL_CHECKOUT = {
  name: '',
  email: '',
  phone: '',
  address: '',
  source: 'Direct link',
  buyerNote: '',
  paymentMethod: 'Cash on delivery'
};

function ButtonIcon({ symbol }) {
  return <span className="button-icon" aria-hidden="true">{symbol}</span>;
}

function splitCommaValues(value = '') {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildFacebookCaptionPreview({ product, profile, baseUrl, fallbackDeliveryEstimate = '' }) {
  const storefrontUrl = `${baseUrl}/${profile?.slug || ''}`;
  const lines = [
    `✨ ${product.name || ''}`,
    product.shortDescription || product.description || '',
    product.price ? `Price: ${currency(Number(product.price || 0), profile?.currencyCode || 'BDT')}` : '',
    product.hasSizes && product.selectedSizes?.length ? `Sizes: ${product.selectedSizes.join(', ')}` : '',
    splitCommaValues(product.colorOptions).length ? `Colors: ${splitCommaValues(product.colorOptions).join(', ')}` : '',
    product.deliveryEstimate || fallbackDeliveryEstimate ? `Delivery: ${product.deliveryEstimate || fallbackDeliveryEstimate}` : '',
    profile?.slug ? `Order here: ${storefrontUrl}` : ''
  ];
  return lines.filter(Boolean).join('\n');
}

export default function AppClient({ initialData, initialMode = 'dashboard', storeSlugOverride = null, authIntent = null }) {
  const [store, setStore] = useState(initialData || EMPTY_STORE);
  const { data: session, status: sessionStatus } = useSession();
  const [currentView, setCurrentView] = useState(initialMode);
  const [dashboardTab, setDashboardTab] = useState('products');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [storefrontSelectedCategory, setStorefrontSelectedCategory] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetailSelection, setProductDetailSelection] = useState({ size: '', color: '', varietyName: '' });
  const [toast, setToast] = useState('');

  const [productForm, setProductForm] = useState(createProductForm());
  const [registerForm, setRegisterForm] = useState({ username: '', storeName: '' });
  const [uploadingField, setUploadingField] = useState('');
  const [facebookState, setFacebookState] = useState({ connected: false, pages: [], selectedPageId: '', selectedPageName: '', connectedAt: null, loading: false });
  const [productSaveMode, setProductSaveMode] = useState('save');
  const [facebookCaption, setFacebookCaption] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [checkoutForm, setCheckoutForm] = useState(INITIAL_CHECKOUT);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [orderDeleteTarget, setOrderDeleteTarget] = useState(null);
  const [orderDeleteNumber, setOrderDeleteNumber] = useState('');
  const [orderDeleteText, setOrderDeleteText] = useState('');
  const [usernameCheck, setUsernameCheck] = useState({ status: 'idle', message: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPriceProduct, setEditingPriceProduct] = useState(null);
  const [editingCategoryProduct, setEditingCategoryProduct] = useState(null);
  const [renamingCategory, setRenamingCategory] = useState(null);
  const [tempCategorySelection, setTempCategorySelection] = useState([]);
  const [tempPriceValue, setTempPriceValue] = useState('');
  const [tempCategoryRename, setTempCategoryRename] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const loggedIn = sessionStatus === 'authenticated';
  const user = session?.user || null;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!loggedIn) return;
    let ignore = false;
    async function loadFacebookState() {
      try {
        setFacebookState((current) => ({ ...current, loading: true }));
        const response = await fetch('/api/facebook/page', { cache: 'no-store' });
        const data = await response.json();
        if (!ignore) {
          setFacebookState({
            connected: Boolean(data.connected),
            pages: data.pages || [],
            selectedPageId: data.selectedPageId || '',
            selectedPageName: data.selectedPageName || '',
            connectedAt: data.connectedAt || null,
            loading: false
          });
        }
      } catch {
        if (!ignore) {
          setFacebookState((current) => ({ ...current, loading: false }));
        }
      }
    }
    loadFacebookState();
    return () => { ignore = true; };
  }, [loggedIn]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const status = url.searchParams.get('facebook');
    if (!status) return;
    const messages = {
      connected: 'Facebook Page connected',
      no_pages: 'No managed Facebook Pages were found for this account',
      oauth_error: 'Facebook connection was cancelled or failed',
      connect_failed: 'Could not connect Facebook Page',
      login_required: 'Please log in before connecting a Facebook Page',
      not_configured: 'Facebook Page posting is not configured yet'
    };
    if (messages[status]) setToast(messages[status]);
    url.searchParams.delete('facebook');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
  }, []);

  useEffect(() => {
    if (!(sessionStatus === 'authenticated' && initialMode === 'dashboard' && !store?.profile)) return;
    const username = registerForm.username.trim();
    if (!username) {
      setUsernameCheck({ status: 'idle', message: 'Choose a unique username for your store link.' });
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setUsernameCheck({ status: 'checking', message: 'Checking username...' });
        const response = await fetch(`/api/username-check?username=${encodeURIComponent(username)}`, { signal: controller.signal });
        const data = await response.json();
        setRegisterForm((current) => ({ ...current, username: data.normalized || current.username }));
        setUsernameCheck({ status: data.available ? 'ok' : 'error', message: data.message || '' });
      } catch (error) {
        if (error.name !== 'AbortError') setUsernameCheck({ status: 'error', message: 'Could not check username right now.' });
      }
    }, 350);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [registerForm.username, sessionStatus, initialMode, store?.profile]);

  const activeStoreSlug = storeSlugOverride || store?.profile?.slug || null;
  const storeCurrency = store?.profile?.currencyCode || 'BDT';
  const formatMoney = (value) => currency(value, storeCurrency);

  async function refreshStore(slug = activeStoreSlug) {
    const endpoint = slug ? `/api/bootstrap?slug=${encodeURIComponent(slug)}` : '/api/bootstrap';
    const response = await fetch(endpoint, { cache: 'no-store' });
    const data = await response.json();
    setStore(data || EMPTY_STORE);
    return data;
  }

  async function uploadImage(file, folder = 'general') {
    if (!file) return '';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Upload failed');
    }
    return data.url;
  }

  const isSellerPreview = loggedIn && initialMode === 'dashboard' && currentView === 'storefront';

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [cartItems]
  );

  const filteredProducts = useMemo(() => {
    return (store.products || []).filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchProductQuery.toLowerCase());
      const matchesCategory =
        selectedCategoryFilter === 'all' || product.categoryIds.includes(selectedCategoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [store.products, searchProductQuery, selectedCategoryFilter]);

  const categoriesById = useMemo(() => {
    return Object.fromEntries((store.categories || []).map((category) => [category._id, category]));
  }, [store.categories]);

  const filteredOrders = useMemo(() => {
    return (store.orders || []).filter((order) => {
      const q = orderSearchQuery.trim().toLowerCase();
      const normalizedStatus = normalizeOrderStatus(order.status);
      const matchesQuery = !q || [order.orderNumber, order.customerName, order.customerEmail, order.customerPhone, order.address].filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
      const matchesStatus = orderStatusFilter === 'all' || normalizedStatus === orderStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [store.orders, orderSearchQuery, orderStatusFilter]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return (store.orders || []).find((order) => order._id === selectedOrderId) || null;
  }, [store.orders, selectedOrderId]);

  const hasProducts = (store.products || []).length > 0;
  const hasCategories = (store.categories || []).length > 0;
  const isNewStore = !hasProducts && !hasCategories;


  function normalizeOrderStatus(status) {
    if (status === 'processing') return 'packed';
    if (status === 'shipped') return 'out_for_delivery';
    return status || 'pending';
  }

  function buildOrderSummary(orders) {
    const counts = {
      all: orders.length,
      pending: 0,
      active: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach((order) => {
      const status = normalizeOrderStatus(order.status);
      if (status === 'pending') counts.pending += 1;
      if (['pending', 'confirmed', 'packed', 'out_for_delivery'].includes(status)) counts.active += 1;
      if (status === 'delivered') counts.delivered += 1;
      if (status === 'cancelled') counts.cancelled += 1;
    });

    return [
      { key: 'all', label: 'All orders', count: counts.all },
      { key: 'pending', label: 'Need confirmation', count: counts.pending },
      { key: 'active', label: 'In fulfilment', count: counts.active },
      { key: 'delivered', label: 'Delivered', count: counts.delivered },
      { key: 'cancelled', label: 'Cancelled', count: counts.cancelled }
    ];
  }

  function getProductsForCategory(categoryId) {
    return (store.products || []).filter((product) => product.categoryIds.includes(categoryId));
  }

  function addToCart(product, selectedOptions = {}) {
    const options = {
      size: selectedOptions.size || '',
      color: selectedOptions.color || '',
      varietyName: selectedOptions.varietyName || ''
    };
    const cartKey = [product._id, options.size, options.color, options.varietyName].filter(Boolean).join('::');
    setCartItems((current) => {
      const exists = current.find((item) => (item.cartKey || item._id) === cartKey);
      if (exists) {
        return current.map((item) =>
          (item.cartKey || item._id) === cartKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [{ ...product, cartKey, selectedOptions: options, quantity: 1 }, ...current];
    });
    setToast(`${product.name} added to cart`);
  }

  function updateCartQty(itemKey, quantity) {
    setCartItems((current) =>
      quantity <= 0
        ? current.filter((item) => (item.cartKey || item._id) !== itemKey)
        : current.map((item) => ((item.cartKey || item._id) === itemKey ? { ...item, quantity } : item))
    );
  }

  async function selectFacebookPage(pageId) {
    const response = await fetch('/api/facebook/page', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId })
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data?.error || 'Could not change Facebook Page');
      return;
    }
    setFacebookState((current) => ({ ...current, ...data, loading: false }));
    setToast('Facebook Page selected');
  }

  async function disconnectFacebookPage() {
    const response = await fetch('/api/facebook/disconnect', { method: 'POST' });
    if (!response.ok) {
      setToast('Could not disconnect Facebook Page');
      return;
    }
    setFacebookState({ connected: false, pages: [], selectedPageId: '', selectedPageName: '', connectedAt: null, loading: false });
    setToast('Facebook Page disconnected');
  }

  async function publishProductToFacebook(productId, captionOverride = '') {
    const response = await fetch('/api/facebook/post-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, caption: captionOverride })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Could not publish to Facebook');
    }
    return data;
  }

  function buildProductPayload() {
    return {
      name: productForm.name,
      shortDescription: productForm.shortDescription,
      price: Number(productForm.price),
      compareAtPrice: Number(productForm.compareAtPrice || 0),
      stockQuantity: Number(productForm.stockQuantity || 0),
      stockStatus: productForm.stockStatus || 'in_stock',
      description: productForm.description,
      imageUrl: productForm.imageUrl,
      sizeOptions: productForm.hasSizes ? productForm.selectedSizes : [],
      colorOptions: splitCommaValues(productForm.colorOptions),
      varieties: productForm.hasVarieties
        ? productForm.varieties.filter((item) => item.name.trim() || item.imageUrl).map((item) => ({ name: item.name.trim(), imageUrl: item.imageUrl }))
        : [],
      measurements: {
        length: productForm.length,
        chest: productForm.chest,
        waist: productForm.waist,
        fabric: productForm.fabric,
        fitNote: productForm.fitNote
      },
      deliveryEstimate: productForm.deliveryEstimate,
      returnPolicy: productForm.returnPolicy,
      featured: productForm.featured,
      categoryIds: productForm.categoryIds || []
    };
  }

  async function submitProduct({ shouldPost = false, captionOverride = '' } = {}) {
    const isEditing = Boolean(editingProduct?._id);
    const response = await fetch(isEditing ? `/api/products/${editingProduct._id}` : '/api/products', {
      method: isEditing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildProductPayload())
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setToast(data?.error || 'Could not save product');
      return;
    }

    const savedProductId = data?._id;

    setProductForm(createProductForm());
    setEditingProduct(null);
    setModal(null);
    setProductSaveMode('save');
    setFacebookCaption('');
    await refreshStore();

    if (shouldPost && savedProductId) {
      try {
        const publishResult = await publishProductToFacebook(savedProductId, captionOverride);
        setToast(`Product ${isEditing ? 'updated' : 'added'} and posted to ${publishResult.pageName || 'Facebook Page'}`);
      } catch (error) {
        setToast(`${isEditing ? 'Product updated' : 'Product added'}, but Facebook posting failed: ${error.message}`);
      }
      return;
    }

    setToast(isEditing ? 'Product updated' : 'Product added');
  }

  async function handleSaveProduct(event) {
    event.preventDefault();
    await submitProduct({ shouldPost: false });
  }

  function openFacebookPostPreview() {
    const caption = buildFacebookCaptionPreview({
      product: productForm,
      profile: store.profile,
      baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
      fallbackDeliveryEstimate: store.profile?.defaultDeliveryEstimate || ''
    });
    setFacebookCaption(caption);
    setProductSaveMode('save_and_post');
    setModal('facebook-preview');
  }

  async function confirmSaveAndPost() {
    await submitProduct({ shouldPost: true, captionOverride: facebookCaption });
  }

  function openProductEditor(product = null) {
    if (product) {
      setEditingProduct(product);
      setProductForm(createProductFormFromProduct(product));
    } else {
      setEditingProduct(null);
      setProductForm(createProductForm());
    }
    setFacebookCaption('');
    setModal('product');
  }

  async function handleDeleteProduct(productId) {
    await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    setProductForm(createProductForm());
    setEditingProduct(null);
    setModal(null);
    await refreshStore();
    setToast('Product removed');
  }

  async function handleUpdatePrice() {
    if (!editingPriceProduct) return;
    await fetch(`/api/products/${editingPriceProduct._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: Number(tempPriceValue) })
    });
    setModal(null);
    setEditingPriceProduct(null);
    setTempPriceValue('');
    await refreshStore();
    setToast('Price updated');
  }

  async function handleUpdateStockStatus(productId, stockStatus) {
    await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockStatus })
    });
    await refreshStore();
    setToast('Stock status updated');
  }

  async function handleSaveCategories() {
    if (!editingCategoryProduct) return;
    await fetch(`/api/products/${editingCategoryProduct._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryIds: tempCategorySelection })
    });
    setModal(null);
    setEditingCategoryProduct(null);
    await refreshStore();
    setToast('Categories updated');
  }

  async function handleCreateCategory(event) {
    event.preventDefault();
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryName })
    });
    setCategoryName('');
    setModal(null);
    await refreshStore();
    setToast('Category created');
  }

  async function handleRenameCategory() {
    if (!renamingCategory) return;
    await fetch(`/api/categories/${renamingCategory._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tempCategoryRename })
    });
    setModal(null);
    setRenamingCategory(null);
    await refreshStore();
    setToast('Category renamed');
  }

  async function handleDeleteCategory(categoryId) {
    await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
    await refreshStore();
    setToast('Category deleted');
  }

  async function handleDeleteStore() {
    const response = await fetch('/api/store', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmSlug: deleteConfirmSlug, confirmText: deleteConfirmText })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setToast(data?.error || 'Could not delete store');
      return;
    }

    setModal(null);
    setDeleteConfirmSlug('');
    setDeleteConfirmText('');
    setToast('Your store has been deleted');
    await signOut({ callbackUrl: '/' });
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store.profile)
    });
    const updated = await refreshStore();
    setToast('Profile updated');

    if (currentView === 'storefront' && updated.profile.slug !== activeStoreSlug) {
      window.history.replaceState({}, '', `/${updated.profile.slug}`);
    }
  }

  async function handleRegisterStore(event) {
    event.preventDefault();
    if (usernameCheck.status === 'error' || usernameCheck.status === 'checking') {
      setToast(usernameCheck.message || 'Please choose a valid username.');
      return;
    }
    const response = await fetch('/api/register-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerForm)
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data?.error || 'Could not create your store');
      return;
    }
    await refreshStore();
    setToast('Your store is ready');
  }

  async function handleProductImageSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingField('productImage');
      const url = await uploadImage(file, 'products');
      setProductForm((current) => ({ ...current, imageUrl: url }));
      setToast('Product image uploaded');
    } catch (error) {
      setToast(error.message || 'Upload failed');
    } finally {
      setUploadingField('');
      event.target.value = '';
    }
  }

  function toggleProductSize(size) {
    setProductForm((current) => ({
      ...current,
      selectedSizes: current.selectedSizes.includes(size)
        ? current.selectedSizes.filter((item) => item !== size)
        : [...current.selectedSizes, size]
    }));
  }

  function addVarietyOption() {
    setProductForm((current) => ({
      ...current,
      varieties: [...current.varieties, createEmptyVariety()]
    }));
  }

  function updateVarietyOption(index, updates) {
    setProductForm((current) => ({
      ...current,
      varieties: current.varieties.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item
      )
    }));
  }

  function removeVarietyOption(index) {
    setProductForm((current) => ({
      ...current,
      varieties: current.varieties.length <= 1
        ? [createEmptyVariety()]
        : current.varieties.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function handleVarietyImageSelected(index, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingField(`varietyImage-${index}`);
      const url = await uploadImage(file, 'product-varieties');
      updateVarietyOption(index, { imageUrl: url });
      setToast('Variety photo uploaded');
    } catch (error) {
      setToast(error.message || 'Upload failed');
    } finally {
      setUploadingField('');
      event.target.value = '';
    }
  }

  function openProductDetails(product) {
    setSelectedProduct(product);
    setProductDetailSelection({
      size: product.sizeOptions?.[0] || '',
      color: product.colorOptions?.[0] || '',
      varietyName: product.varieties?.[0]?.name || ''
    });
  }

  async function handleProfileImageSelected(field, folder, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingField(field);
      const url = await uploadImage(file, folder);
      setStore((current) => ({
        ...current,
        profile: { ...(current.profile || {}), [field]: url }
      }));
      setToast('Image uploaded');
    } catch (error) {
      setToast(error.message || 'Upload failed');
    } finally {
      setUploadingField('');
      event.target.value = '';
    }
  }

  async function handleAdvanceOrder(orderId, action, label) {
    if (action === 'archive_note') return;

    const response = await fetch(`/api/orders/${orderId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setToast(data?.error || 'Could not update order');
      return;
    }

    await refreshStore();
    setToast(label || 'Order updated');
  }

  async function handlePlaceOrder() {
    if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.phone || !checkoutForm.address) {
      setToast('Please complete shipping details');
      return;
    }

    if (cartItems.length === 0) {
      setToast('Cart is empty');
      return;
    }

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeSlug: activeStoreSlug,
        customerName: checkoutForm.name,
        customerEmail: checkoutForm.email,
        customerPhone: checkoutForm.phone,
        address: checkoutForm.address,
        source: checkoutForm.source,
        buyerNote: checkoutForm.buyerNote,
        total: cartTotal,
        items: cartItems.map((item) => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions || {}
        }))
      })
    });

    const order = await response.json();
    setCartItems([]);
    setShowCheckout(false);
    setShowCart(false);
    setCheckoutForm(INITIAL_CHECKOUT);
    await refreshStore();
    setToast(`Order placed! #${order.orderNumber} - COD only`);
  }

  async function handleSaveSellerNote(orderId, sellerNote) {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerNote })
    });
    if (!response.ok) {
      setToast('Could not save seller note');
      return;
    }
    await refreshStore();
    setToast('Seller note saved');
  }

  async function handleHideOrderRecord() {
    if (!orderDeleteTarget) return;
    const response = await fetch(`/api/orders/${orderDeleteTarget._id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: orderDeleteNumber.trim(),
        confirmText: orderDeleteText.trim()
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setToast(data?.error || 'Could not delete order record from app view');
      return;
    }

    setModal(null);
    setOrderDeleteTarget(null);
    setOrderDeleteNumber('');
    setOrderDeleteText('');
    setSelectedOrderId('');
    await refreshStore();
    setToast('Order record removed from app view');
  }

  async function copyTemplate(templateText) {
    try {
      await navigator.clipboard.writeText(templateText);
      setToast('Template copied');
    } catch {
      setToast('Could not copy template');
    }
  }

  function productCard(product, compact = false) {
    const stockStatus = product.stockStatus || 'in_stock';
    const stockStatusLabel = getStockStatusLabel(stockStatus);
    const hasSizes = (product.sizeOptions || []).length > 0;
    const hasVarieties = (product.varieties || []).length > 0;
    const isSellerDashboardCard = !compact && currentView === 'dashboard';
    const clickableProps = compact
      ? { role: 'button', tabIndex: 0, onClick: () => openProductDetails(product), onKeyDown: (event) => { if (event.key === 'Enter') openProductDetails(product); } }
      : isSellerDashboardCard
        ? { role: 'button', tabIndex: 0, onClick: () => openProductEditor(product), onKeyDown: (event) => { if (event.key === 'Enter') openProductEditor(product); } }
        : {};

    return (
      <div className={`soft-card product-card ${(compact || isSellerDashboardCard) ? 'clickable-product-card' : ''}`} key={product._id} {...clickableProps}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="image-placeholder">No image</div>
        )}
        <div className="card-body">
          <div className="inline-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ margin: 0 }}>{product.name}</h3>
            {product.featured ? <span className="tag">Featured</span> : null}
          </div>
          <div style={{ marginTop: '0.4rem' }}>
            <strong>{formatMoney(product.price)}</strong>
            {Number(product.compareAtPrice || 0) > Number(product.price || 0) ? <span className="muted" style={{ marginLeft: '0.45rem', textDecoration: 'line-through' }}>{formatMoney(product.compareAtPrice)}</span> : null}
          </div>
          <p className="muted">{product.shortDescription || (compact ? 'Tap to view details.' : product.description || 'Click to edit this product.')}</p>
          <div className="tag-row" style={{ marginTop: '0.7rem' }}>
            <span className={`tag stock-${stockStatus}`}>{stockStatusLabel}</span>
            {hasSizes ? <span className="tag">Sizes</span> : null}
            {hasVarieties ? <span className="tag">Varieties</span> : null}
            {!compact && isSellerDashboardCard ? <span className="tag">Click to edit</span> : null}
          </div>
          {!compact && (
            <>
              <div className="tag-row" style={{ marginTop: '0.8rem' }}>
                <span className={`tag stock-${stockStatus}`}>Stock: {stockStatusLabel}{Number(product.stockQuantity || 0) > 0 ? ` (${product.stockQuantity})` : ''}</span>
                {(product.categoryIds || []).length === 0 ? (
                  <span className="tag">No category</span>
                ) : (
                  product.categoryIds.map((categoryId) => (
                    <span className="tag" key={categoryId}>{categoriesById[categoryId]?.name || 'Category'}</span>
                  ))
                )}
                {(product.sizeOptions || []).slice(0,3).map((size) => <span className="tag" key={size}>Size {size}</span>)}
                {(product.colorOptions || []).slice(0,2).map((color) => <span className="tag" key={color}>{color}</span>)}
                {(product.varieties || []).slice(0,2).map((item) => <span className="tag" key={item.name || item.imageUrl}>{item.name || 'Variety'}</span>)}
              </div>
              {(product.measurements?.length || product.measurements?.chest || product.measurements?.waist || product.measurements?.fabric || product.measurements?.fitNote || product.deliveryEstimate || product.returnPolicy) ? (
                <div className="note-box" style={{ marginTop: '0.8rem' }}>
                  {product.measurements?.length ? <div><strong>Length:</strong> {product.measurements.length}</div> : null}
                  {product.measurements?.chest ? <div><strong>Chest:</strong> {product.measurements.chest}</div> : null}
                  {product.measurements?.waist ? <div><strong>Waist:</strong> {product.measurements.waist}</div> : null}
                  {product.measurements?.fabric ? <div><strong>Fabric:</strong> {product.measurements.fabric}</div> : null}
                  {product.measurements?.fitNote ? <div><strong>Fit:</strong> {product.measurements.fitNote}</div> : null}
                  {product.deliveryEstimate ? <div><strong>Delivery:</strong> {product.deliveryEstimate}</div> : null}
                  {product.returnPolicy ? <div><strong>Return / exchange:</strong> {product.returnPolicy}</div> : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  }

  function renderStorefront() {
    const selectedCategory = store.categories.find((category) => category._id === storefrontSelectedCategory);
    const displayedProducts = storefrontSelectedCategory
      ? getProductsForCategory(storefrontSelectedCategory)
      : store.products;

    return (
      <div className="page-shell">
        <div className="store-banner" style={{ backgroundImage: `url(${store.profile.storeBanner})` }}>
          <div className="store-banner-content">
            {store.profile.storeLogo && <img src={store.profile.storeLogo} alt={store.profile.storeName} />}
            <div>
              <h1 style={{ color: 'white', margin: 0, fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
                {store.profile.storeName}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0.3rem 0 0' }}>{store.profile.bio}</p>
            </div>
          </div>
        </div>

        <div className="store-nav">
          <div className="container store-nav-inner store-nav-actions" style={{ minHeight: 70 }}>
            <BrandMark size="store" />
            <div className="inline-row">
              {loggedIn && (
                <button className="soft-button-ghost button-with-icon" onClick={() => setCurrentView('dashboard')}>
                  <ButtonIcon symbol="◫" />Dashboard
                </button>
              )}
              {!isSellerPreview && (
                <button className="soft-button-ghost button-with-icon" onClick={() => setShowCart(true)}>
                  <ButtonIcon symbol="🛒" />Cart ({cartCount})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: '1.5rem' }}>
          <div className="section-head dashboard-toolbar" style={{ marginBottom: '1rem' }}>
            <div className="tag-row">
              <button
                className={`badge-button ${storefrontSelectedCategory === null ? 'active' : ''}`}
                onClick={() => setStorefrontSelectedCategory(null)}
              >
                All products
              </button>
              {store.categories.map((category) => (
                <button
                  className={`badge-button ${storefrontSelectedCategory === category._id ? 'active' : ''}`}
                  key={category._id}
                  onClick={() => setStorefrontSelectedCategory(category._id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="muted">
              {selectedCategory ? selectedCategory.name : 'Browse by curated categories'}
            </div>
          </div>

          {!storefrontSelectedCategory ? (
            store.categories.map((category) => {
              const categoryProducts = getProductsForCategory(category._id);
              if (categoryProducts.length === 0) return null;
              return (
                <section className="store-section" key={category._id}>
                  <div className="store-category-head">
                    <h2 style={{ margin: 0 }}>{category.name}</h2>
                    <button className="soft-button-ghost button-with-icon" onClick={() => setStorefrontSelectedCategory(category._id)}>
                      <ButtonIcon symbol="→" />See all
                    </button>
                  </div>
                  <div className="store-grid storefront-grid">
                    {categoryProducts.slice(0, 4).map((product) => productCard(product, true))}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="store-grid storefront-grid">
              {displayedProducts.map((product) => productCard(product, true))}
            </div>
          )}
        </div>


        <StoreContactDock profile={store.profile} />

        <div className="container storefront-mini-footer">
          <p className="muted">{store.profile.bio}</p>
        </div>
      </div>
    );
  }

  function renderDashboard() {
    return (
      <div className="page-shell container dashboard-shell" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="dashboard-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h1 style={{ margin: 0 }}>{user?.name}&apos;s Studio</h1>
            <p className="muted" style={{ margin: '0.5rem 0 0' }}>
              Store slug: <strong>{store.profile.slug}</strong>
            </p>
          </div>
          <div className="responsive-stack header-actions">
            <div className="store-link-compact">
              <span className="mini-link-label">Shop link</span>
              <span className="mini-link-text">{`shopnow.xyz/${store.profile.slug}`}</span>
            </div>
            <button className="soft-button-ghost button-with-icon" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${store.profile.slug}`)}>
              <ButtonIcon symbol="⧉" />Copy link
            </button>
            <button className="soft-button-ghost button-with-icon" onClick={() => signOut({ callbackUrl: '/' })}>
              <ButtonIcon symbol="↩" />Logout
            </button>
          </div>
        </div>

        <div className="dashboard-tabs" style={{ marginTop: '1rem' }}>
          {[
            ['products', 'Products & Categories'],
            ['profileLinks', 'Links & Profile'],
            ['orders', 'Orders'],
            ['settings', 'Store Settings']
          ].map(([key, label]) => (
            <button
              key={key}
              className={`dashboard-tab ${dashboardTab === key ? 'active' : ''}`}
              onClick={() => setDashboardTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {dashboardTab === 'products' && (
          <section style={{ marginTop: '1.5rem' }}>
            <div className="section-head dashboard-toolbar" style={{ marginBottom: '1rem' }}>
              <div className="tag-row">
                <button className="soft-button button-with-icon" onClick={() => openProductEditor()}>
                  <ButtonIcon symbol="＋" />Add product
                </button>
                <button className="soft-button-secondary button-with-icon" onClick={() => setModal('category')}>
                  <ButtonIcon symbol="◻" />New category
                </button>
              </div>
              <div className="responsive-stack dashboard-search">
                <input
                  className="dashboard-search-input"
                  value={searchProductQuery}
                  onChange={(event) => setSearchProductQuery(event.target.value)}
                  placeholder="Search products"
                />
              </div>
            </div>

            <div className="tag-row category-filter-row" style={{ marginBottom: '1rem' }}>
              <button
                className={`badge-button ${selectedCategoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategoryFilter('all')}
              >
                All products
              </button>
              {store.categories.map((category) => (
                <button
                  className={`badge-button ${selectedCategoryFilter === category._id ? 'active' : ''}`}
                  key={category._id}
                  onClick={() => setSelectedCategoryFilter(category._id)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {isNewStore ? (
              <div className="soft-card empty-dashboard-hero">
                <div className="empty-dashboard-copy">
                  <span className="landing-pill">Welcome to your new store</span>
                  <h2>Start building a storefront that feels ready to sell from day one.</h2>
                  <p className="muted">Your dashboard is completely blank right now. Add your first category, upload a product, and then preview your store link before you start sharing it with buyers.</p>
                  <div className="landing-cta-row">
                    <button className="soft-button button-with-icon" onClick={() => openProductEditor()}>
                      <ButtonIcon symbol="＋" />Add your first product
                    </button>
                    <button className="soft-button-secondary button-with-icon" onClick={() => setModal('category')}>
                      <ButtonIcon symbol="◻" />Create first category
                    </button>
                  </div>
                  <div className="empty-dashboard-steps">
                    <div className="empty-step"><strong>1</strong><span>Create a category for the collection you want to sell.</span></div>
                    <div className="empty-step"><strong>2</strong><span>Add a product photo, price, and short selling description.</span></div>
                    <div className="empty-step"><strong>3</strong><span>Open your storefront and share your link across social media.</span></div>
                  </div>
                </div>
                <div className="empty-dashboard-panel">
                  <div className="empty-dashboard-card">
                    <div className="muted" style={{ fontSize: '0.82rem' }}>Your store checklist</div>
                    <div className="empty-dashboard-checklist">
                      <div className={`check-item ${hasCategories ? 'done' : ''}`}>{hasCategories ? '✓' : '•'} First category</div>
                      <div className={`check-item ${hasProducts ? 'done' : ''}`}>{hasProducts ? '✓' : '•'} First product</div>
                      <div className={`check-item ${store.profile?.storeLogo && store.profile?.storeBanner ? 'done' : ''}`}>{store.profile?.storeLogo && store.profile?.storeBanner ? '✓' : '•'} Add your logo and banner from Store Settings</div>
                      <div className={`check-item ${store.profile?.whatsappNumber || store.profile?.messengerUrl ? 'done' : ''}`}>{store.profile?.whatsappNumber || store.profile?.messengerUrl ? '✓' : '•'} Add WhatsApp Business and Messenger in Links & Profile</div>
                      <div className={`check-item ${store.profile?.deliveryInsideDhaka || store.profile?.deliveryOutsideDhaka ? 'done' : ''}`}>{store.profile?.deliveryInsideDhaka || store.profile?.deliveryOutsideDhaka ? '✓' : '•'} Add delivery charges and estimate</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="product-grid dashboard-product-grid">
                {filteredProducts.map((product) => productCard(product))}
              </div>
            ) : (
              <div className="empty-state soft-card section-block">No products match your current search or category filter.</div>
            )}
          </section>
        )}

        {dashboardTab === 'profileLinks' && (
          <div className="meta-grid dashboard-meta-grid" style={{ marginTop: '1.5rem' }}>
            <form className="soft-card section-block" onSubmit={handleProfileSave}>
              <h2 style={{ marginTop: 0 }}>Seller contact details</h2>
              <p className="muted">These are the only direct contact options shown to buyers on the storefront.</p>
              <div className="form-grid dashboard-form-stack" style={{ flexDirection: 'column', marginTop: '1rem' }}>
                {[
                  ['bio', 'Short store intro'],
                  ['whatsappNumber', 'WhatsApp Business number'],
                  ['messengerUrl', 'Messenger link']
                ].map(([field, label]) => (
                  <label className="field" key={field}>
                    <span>{label}</span>
                    <input
                      value={store.profile[field] || ''}
                      onChange={(event) =>
                        setStore((current) => ({
                          ...current,
                          profile: { ...(current.profile || {}), [field]: event.target.value }
                        }))
                      }
                    />
                  </label>
                ))}
                <label className="field">
                  <span>Return / exchange policy shown to buyers</span>
                  <textarea
                    value={store.profile.exchangePolicy || ''}
                    onChange={(event) =>
                      setStore((current) => ({
                        ...current,
                        profile: { ...(current.profile || {}), exchangePolicy: event.target.value }
                      }))
                    }
                    placeholder="Example: Exchange available within 3 days if product is unused and tag is intact."
                  />
                  <small className="muted">This same policy is also available in Store Settings and can be used as a default for product-specific policies.</small>
                </label>
                <label className="field">
                  <span>Store profile picture</span>
                  <input type="file" accept="image/*" onChange={(event) => handleProfileImageSelected('profilePicture', 'branding', event)} />
                  {uploadingField === 'profilePicture' && <small className="muted">Uploading...</small>}
                  {store.profile?.profilePicture && <img src={store.profile.profilePicture} alt="Profile" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: '50%', marginTop: '0.5rem' }} />}
                </label>
                <div style={{ marginTop: '1rem' }}>
                  <button className="soft-button button-with-icon" type="submit">
                    <ButtonIcon symbol="✓" />Save contact section
                  </button>
                </div>
              </div>
            </form>

            <div className="soft-card section-block">
              <h2 style={{ marginTop: 0 }}>How buyers contact you</h2>
              <p className="muted">The storefront now focuses only on direct conversations. Buyers will see floating WhatsApp and Messenger buttons instead of a generic link list.</p>
              <div className="note-box" style={{ marginTop: '1rem' }}>
                <strong>Tip:</strong> Use your WhatsApp Business number and your direct Messenger thread or page link so customers can message you instantly.
              </div>
              <div className="contact-preview-card" style={{ marginTop: '1rem' }}>
                <div className="contact-preview-pill">WhatsApp: {store.profile?.whatsappNumber || 'Not added yet'}</div>
                <div className="contact-preview-pill">Messenger: {store.profile?.messengerUrl || 'Not added yet'}</div>
              </div>
            </div>
          </div>
        )}

        {dashboardTab === 'orders' && (
          <section style={{ marginTop: '1.5rem' }}>
            <div className="order-summary-grid" style={{ marginBottom: '1rem' }}>
              {buildOrderSummary(store.orders).map((item) => (
                <div className="soft-card order-summary-card" key={item.key}>
                  <div className="muted" style={{ fontSize: '0.86rem' }}>{item.label}</div>
                  <div className="order-summary-value">{item.count}</div>
                </div>
              ))}
            </div>

            <div className="soft-card section-block">
              {!selectedOrder ? (
                <>
                  <h2 style={{ marginTop: 0 }}>Orders</h2>
                  <p className="muted">Start with the order list, then click any record to open the details and fulfilment controls.</p>
                  <div className="section-head" style={{ marginBottom: '1rem', alignItems: 'flex-end' }}>
                    <div className="responsive-stack dashboard-search">
                      <label className="field" style={{ margin: 0 }}>
                        <span>Search orders</span>
                        <input className="dashboard-search-input" value={orderSearchQuery} onChange={(event) => setOrderSearchQuery(event.target.value)} placeholder="Name, phone, email, order ID" />
                      </label>
                    </div>
                    <label className="field" style={{ margin: 0, minWidth: 220 }}>
                      <span>Filter by status</span>
                      <select value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)}>
                        <option value="all">All orders</option>
                        <option value="pending">Need confirmation</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="packed">Packed</option>
                        <option value="out_for_delivery">Out for delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>
                  </div>
                  {filteredOrders.length === 0 && <div className="empty-state">No orders match this search or filter.</div>}
                  <div className="order-list-table">
                    {filteredOrders.map((order) => {
                      const normalizedStatus = normalizeOrderStatus(order.status);
                      return (
                        <button className="order-list-row" key={order._id} onClick={() => setSelectedOrderId(order._id)}>
                          <div>
                            <div className="order-list-label">Customer</div>
                            <strong>{order.customerName}</strong>
                          </div>
                          <div>
                            <div className="order-list-label">Mobile</div>
                            <span>{order.customerPhone || 'No phone added'}</span>
                          </div>
                          <div>
                            <div className="order-list-label">Order ID</div>
                            <span style={{ fontFamily: 'monospace' }}>#{order.orderNumber}</span>
                          </div>
                          <div className="order-list-meta">
                            <span className={`status-pill status-${normalizedStatus}`}>{ORDER_STATUS_LABELS[normalizedStatus]}</span>
                            <span className="muted">{formatMoney(order.total)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (() => {
                const order = selectedOrder;
                const normalizedStatus = normalizeOrderStatus(order.status);
                const actions = ORDER_ACTIONS[normalizedStatus] || [];
                const timeline = [...(order.timeline || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                return (
                  <div className="smart-order-card order-detail-card" key={order._id}>
                    <div className="section-head" style={{ marginBottom: '1rem' }}>
                      <div>
                        <button className="soft-button-ghost button-with-icon" type="button" onClick={() => setSelectedOrderId('')}>
                          <ButtonIcon symbol="←" />Back to orders
                        </button>
                        <h2 style={{ margin: '1rem 0 0.25rem' }}>Order #{order.orderNumber}</h2>
                        <p className="muted" style={{ margin: 0 }}>Manage customer details, status controls, notes, and fulfilment timeline.</p>
                      </div>
                      <div className="smart-order-side">
                        <span className={`status-pill status-${normalizedStatus}`}>{ORDER_STATUS_LABELS[normalizedStatus]}</span>
                        <span className="tag">COD</span>
                      </div>
                    </div>

                    <div className="order-detail-grid">
                      <div className="note-box">
                        <strong>Customer</strong>
                        <div style={{ marginTop: '0.45rem' }}>{order.customerName}</div>
                        <div className="muted">{order.customerPhone || 'No phone added'}</div>
                        <div className="muted">{order.customerEmail}</div>
                      </div>
                      <div className="note-box">
                        <strong>Order summary</strong>
                        <div style={{ marginTop: '0.45rem' }}>{formatMoney(order.total)}</div>
                        <div className="muted">{order.source || 'Direct link'} • {new Date(order.createdAt).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="order-items-inline" style={{ marginTop: '1rem' }}>
                      {order.items.map((item) => (
                        <span className="tag" key={`${order._id}-${item.name}`}>{item.name} × {item.quantity}</span>
                      ))}
                    </div>

                    <div className="note-box" style={{ marginTop: '0.9rem' }}>
                      <strong>Delivery address:</strong> {order.address}
                      {order.buyerNote ? <div style={{ marginTop: '0.4rem' }}><strong>Buyer note:</strong> {order.buyerNote}</div> : null}
                    </div>

                    <div className="order-progress-steps" style={{ marginTop: '1rem' }}>
                      {ORDER_PROGRESS_STEPS.map((step) => {
                        const active = ORDER_PROGRESS_STEPS.indexOf(step) <= ORDER_PROGRESS_STEPS.indexOf(normalizedStatus);
                        const muted = normalizedStatus === 'cancelled';
                        return (
                          <div className={`order-progress-step ${active ? 'active' : ''} ${muted ? 'cancelled' : ''}`} key={step}>
                            <span className="step-dot" />
                            <span>{ORDER_STATUS_LABELS[step]}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="smart-order-actions" style={{ marginTop: '1rem' }}>
                      {actions.map((action) => (
                        <button
                          key={action.key}
                          className={action.tone === 'primary' ? 'soft-button' : 'soft-button-ghost'}
                          onClick={() => handleAdvanceOrder(order._id, action.key, `${action.label} done`)}
                          disabled={action.key === 'archive_note'}
                        >
                          {action.label}
                        </button>
                      ))}
                      <button
                        className="soft-button-danger"
                        type="button"
                        onClick={() => {
                          setOrderDeleteTarget(order);
                          setOrderDeleteNumber('');
                          setOrderDeleteText('');
                          setModal('delete-order-record');
                        }}
                      >
                        Delete record
                      </button>
                    </div>

                    <div className="soft-card" style={{ padding: '0.9rem', marginTop: '1rem' }}>
                      <label className="field">
                        <span>Seller private note</span>
                        <textarea defaultValue={order.sellerNote || ''} onBlur={(event) => handleSaveSellerNote(order._id, event.target.value)} placeholder="Called customer, size confirmed, urgent, etc." />
                      </label>
                      <div className="tag-row" style={{ marginTop: '0.8rem' }}>
                        <button className="soft-button-ghost" onClick={() => copyTemplate(store.profile?.orderConfirmationTemplate || '')}>Copy confirm template</button>
                        <button className="soft-button-ghost" onClick={() => copyTemplate(store.profile?.deliveryUpdateTemplate || '')}>Copy packed template</button>
                        <button className="soft-button-ghost" onClick={() => copyTemplate(store.profile?.outForDeliveryTemplate || '')}>Copy delivery template</button>
                      </div>
                    </div>

                    {timeline.length > 0 && (
                      <div className="order-timeline" style={{ marginTop: '1rem' }}>
                        {timeline.slice(-4).reverse().map((event, index) => (
                          <div className="order-timeline-item" key={`${order._id}-${index}-${event.action}`}>
                            <span className="timeline-dot" />
                            <div>
                              <div style={{ fontWeight: 600 }}>{ORDER_STATUS_LABELS[normalizeOrderStatus(event.status)] || event.action}</div>
                              <div className="muted">{event.note}</div>
                              <div className="muted-2" style={{ fontSize: '0.8rem' }}>{new Date(event.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {dashboardTab === 'settings' && (
          <form className="soft-card section-block" style={{ marginTop: '1.5rem' }} onSubmit={handleProfileSave}>
            <h2 style={{ marginTop: 0 }}>Store identity</h2>
            <div className="form-grid dashboard-form-stack" style={{ flexDirection: 'column', marginTop: '1rem' }}>
              <label className="field">
                <span>Store name</span>
                <input
                  value={store.profile.storeName || ''}
                  onChange={(event) =>
                    setStore((current) => ({
                      ...current,
                      profile: { ...(current.profile || {}), storeName: event.target.value }
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Preferred currency</span>
                <select
                  value={store.profile.currencyCode || 'BDT'}
                  onChange={(event) =>
                    setStore((current) => ({
                      ...current,
                      profile: { ...(current.profile || {}), currencyCode: event.target.value }
                    }))
                  }
                >
                  {CURRENCY_OPTIONS.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </label>
              <div className="form-grid two-col-grid">
                <label className="field">
                  <span>Delivery charge inside Dhaka</span>
                  <input type="number" value={store.profile.deliveryInsideDhaka ?? 0} onChange={(event) => setStore((current) => ({ ...current, profile: { ...(current.profile || {}), deliveryInsideDhaka: Number(event.target.value) } }))} />
                </label>
                <label className="field">
                  <span>Delivery charge outside Dhaka</span>
                  <input type="number" value={store.profile.deliveryOutsideDhaka ?? 0} onChange={(event) => setStore((current) => ({ ...current, profile: { ...(current.profile || {}), deliveryOutsideDhaka: Number(event.target.value) } }))} />
                </label>
              </div>
              <label className="field">
                <span>Free delivery threshold</span>
                <input type="number" value={store.profile.freeDeliveryThreshold ?? 0} onChange={(event) => setStore((current) => ({ ...current, profile: { ...(current.profile || {}), freeDeliveryThreshold: Number(event.target.value) } }))} />
              </label>
              <label className="field">
                <span>Default delivery estimate</span>
                <input value={store.profile.defaultDeliveryEstimate || ''} onChange={(event) => setStore((current) => ({ ...current, profile: { ...(current.profile || {}), defaultDeliveryEstimate: event.target.value } }))} />
              </label>
              <label className="field">
                <span>Store-wide return / exchange policy</span>
                <textarea value={store.profile.exchangePolicy || ''} onChange={(event) => setStore((current) => ({ ...current, profile: { ...(current.profile || {}), exchangePolicy: event.target.value } }))} />
              </label>
              <label className="field">
                <span>Username / store link</span>
                <input value={store.profile?.slug || ''} disabled />
              </label>
              <label className="field">
                <span>Store logo</span>
                <input type="file" accept="image/*" onChange={(event) => handleProfileImageSelected('storeLogo', 'branding', event)} />
                {uploadingField === 'storeLogo' && <small className="muted">Uploading...</small>}
                {store.profile?.storeLogo && <img src={store.profile.storeLogo} alt="Logo" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: '1rem', marginTop: '0.5rem' }} />}
              </label>
              <label className="field">
                <span>Store banner</span>
                <input type="file" accept="image/*" onChange={(event) => handleProfileImageSelected('storeBanner', 'branding', event)} />
                {uploadingField === 'storeBanner' && <small className="muted">Uploading...</small>}
                {store.profile?.storeBanner && <img src={store.profile.storeBanner} alt="Banner" style={{ width: '100%', maxWidth: 320, height: 120, objectFit: 'cover', borderRadius: '1rem', marginTop: '0.5rem' }} />}
              </label>
            </div>
            <div className="soft-card section-block" style={{ marginTop: '1rem', padding: '1rem' }}>
              <div className="section-head" style={{ marginBottom: '0.8rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Facebook Page posting</h3>
                  <p className="muted" style={{ margin: '0.35rem 0 0' }}>Connect a Facebook Page to publish a product image, caption, and store link in one click.</p>
                </div>
              </div>
              {!facebookState.connected ? (
                <div className="inline-row responsive-stack" style={{ justifyContent: 'space-between' }}>
                  <div className="muted">No Facebook Page connected yet.</div>
                  <a className="soft-button button-with-icon" href="/api/facebook/connect"><ButtonIcon symbol="f" />Connect Facebook Page</a>
                </div>
              ) : (
                <div className="form-grid dashboard-form-stack" style={{ flexDirection: 'column' }}>
                  <label className="field">
                    <span>Connected page</span>
                    <select value={facebookState.selectedPageId || ''} onChange={(event) => selectFacebookPage(event.target.value)}>
                      {(facebookState.pages || []).map((page) => (
                        <option key={page.pageId} value={page.pageId}>{page.pageName}</option>
                      ))}
                    </select>
                  </label>
                  <div className="tag-row">
                    <span className="tag">Ready to post as {facebookState.selectedPageName || 'Facebook Page'}</span>
                    {facebookState.connectedAt ? <span className="tag">Connected {new Date(facebookState.connectedAt).toLocaleDateString()}</span> : null}
                  </div>
                  <div className="tag-row" style={{ marginTop: '0.5rem' }}>
                    <a className="soft-button-ghost" href="/api/facebook/connect">Reconnect</a>
                    <button className="soft-button-ghost" type="button" onClick={disconnectFacebookPage}>Disconnect</button>
                  </div>
                </div>
              )}
            </div>
            <div className="note-box" style={{ marginTop: '1rem' }}>
              Payment methods are locked to <strong>Cash on delivery</strong>. Your preferred currency controls how prices appear across the dashboard and storefront. Use the delivery and policy fields below to answer buyer questions automatically and stay consistent across products.
            </div>
            <div className="form-grid dashboard-form-stack" style={{ flexDirection: 'column', marginTop: '1rem' }}>
              <label className="field">
                <span>Order confirmation template</span>
                <textarea value={store.profile.orderConfirmationTemplate || ''} onChange={(event) => setStore((current) => ({ ...current, profile: { ...(current.profile || {}), orderConfirmationTemplate: event.target.value } }))} />
              </label>
              <label className="field">
                <span>Packed / ready template</span>
                <textarea value={store.profile.deliveryUpdateTemplate || ''} onChange={(event) => setStore((current) => ({ ...current, profile: { ...(current.profile || {}), deliveryUpdateTemplate: event.target.value } }))} />
              </label>
              <label className="field">
                <span>Out for delivery template</span>
                <textarea value={store.profile.outForDeliveryTemplate || ''} onChange={(event) => setStore((current) => ({ ...current, profile: { ...(current.profile || {}), outForDeliveryTemplate: event.target.value } }))} />
              </label>
            </div>
            <hr className="divider" />
            <div className="section-head" style={{ marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>Manage categories</h3>
              <button className="soft-button-secondary" type="button" onClick={() => setModal('category')}>
                New category
              </button>
            </div>
            {store.categories.map((category) => (
              <div className="link-row" key={category._id}>
                <span>{category.name}</span>
                <div className="responsive-stack">
                  <button
                    className="soft-button-ghost"
                    type="button"
                    onClick={() => {
                      setRenamingCategory(category);
                      setTempCategoryRename(category.name);
                      setModal('rename-category');
                    }}
                  >
                    Rename
                  </button>
                  <button className="soft-button-ghost" type="button" onClick={() => handleDeleteCategory(category._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <div className="danger-zone">
              <div>
                <h3 style={{ margin: 0 }}>Delete store</h3>
                <p className="muted" style={{ margin: '0.45rem 0 0' }}>This permanently removes your store profile, products, categories, orders, and contact information.</p>
              </div>
              <button className="soft-button-danger" type="button" onClick={() => setModal('delete-store')}>
                Delete store
              </button>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button className="soft-button" type="submit">
                Save settings
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  function renderLanding() {
    return (
      <div className="landing-shell">
        <section className="landing-hero">
          <div className="container landing-nav">
            <BrandMark size="nav" showTagline={true} />
            <div className="responsive-stack">
              {loggedIn ? (
                <a className="soft-button-ghost button-with-icon" href="/dashboard"><ButtonIcon symbol="◌" />Go to dashboard</a>
              ) : (
                <>
                  <a className="soft-button-ghost" href="#login-options">Log in</a>
                  <a className="soft-button" href="#signup-options">Sign up</a>
                </>
              )}
            </div>
          </div>

          <div className="container landing-hero-grid">
            <div className="landing-copy slide-up">
              <div className="landing-pill">Built for sellers who close orders from social media</div>
              <h1>Turn casual visitors into <span className="headline-emphasis">paying customers</span> with a storefront that feels premium from the first click.</h1>
              <p className="landing-subcopy">Give your shop a polished home for launches, bestsellers, and everyday orders. Share one clean link, show your products beautifully, and move buyers straight into WhatsApp or Messenger to close the sale faster.</p>
              <div className="landing-cta-row">
                <a className="soft-button button-with-icon" href="#signup-options"><ButtonIcon symbol="✦" />Create my store</a>
                <a className="soft-button-ghost button-with-icon" href="#how-it-works"><ButtonIcon symbol="→" />See how it works</a>
              </div>
              <div className="landing-proof-row">
                <span>One branded shop link</span>
                <span>Made for social selling</span>
                <span>Ready for COD orders</span>
              </div>
            </div>

            <div className="landing-showcase slide-up-delay">
              <div className="showcase-card soft-card">
                <div className="showcase-browser">
                  <span></span><span></span><span></span>
                </div>
                <div className="showcase-hero">
                  <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80" alt="Storefront preview" />
                  <div className="showcase-overlay">
                    <strong>shopnow.xyz/yourname</strong>
                    <p>Your products, your brand, your link — built to turn profile traffic into real orders.</p>
                  </div>
                </div>
                <div className="showcase-stats">
                  <div><strong>More trust</strong><span>Sharper first impressions</span></div>
                  <div><strong>More clicks</strong><span>Cleaner product discovery</span></div>
                  <div><strong>More chats</strong><span>WhatsApp & Messenger ready</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container feature-strip">
          {[
            ['A storefront that looks ready to buy from', 'Present your brand like a serious business with a polished mobile-first shop link.'],
            ['Made to convert social traffic', 'Give people a clear next step from your bio, reels, stories, and ads instead of sending them to a messy inbox.'],
            ['Designed for direct conversations', 'Let shoppers move straight into WhatsApp Business or Messenger when they are ready to ask or order.'],
            ['Built for fast-moving sellers', 'Update products, prices, and COD orders quickly so your shop always feels active and trustworthy.']
          ].map(([title, text]) => (
            <div className="soft-card feature-card fade-in" key={title}>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </div>
          ))}
        </section>

        <section className="container story-grid" id="how-it-works">
          <div className="soft-card story-card">
            <img src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80" alt="Seller dashboard" />
            <div>
              <h2>Make your first impression feel like a real brand, not just another social profile.</h2>
              <p className="muted">Use one elegant shop link across your bio, stories, campaigns, and customer chats. Showcase your products, your identity, and your best offers in one polished destination.</p>
            </div>
          </div>
          <div className="soft-card story-card">
            <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80" alt="Customer messages" />
            <div>
              <h2>Turn interested shoppers into conversations you can actually close.</h2>
              <p className="muted">Buyers already trust WhatsApp and Messenger. Send them there at the right moment so they can ask, confirm, and order without friction.</p>
            </div>
          </div>
        </section>

        <section className="container auth-panels">
          <div className="soft-card auth-choice-card" id="signup-options">
            <div className="landing-pill">Sign up</div>
            <h2>Create a new <span className="headline-emphasis">store</span></h2>
            <p className="muted">Use a Google or Facebook account that is not already linked to an existing Shopnow store. After sign up, you will choose your unique username.</p>
            <div className="auth-buttons">
              <button className="soft-button button-with-icon" onClick={() => signIn('google', { callbackUrl: '/dashboard?intent=signup' })}>
                <ButtonIcon symbol="G" />Sign up with Google
              </button>
              <button className="soft-button-secondary button-with-icon" onClick={() => signIn('facebook', { callbackUrl: '/dashboard?intent=signup' })}>
                <ButtonIcon symbol="f" />Sign up with Facebook
              </button>
            </div>
          </div>

          <div className="soft-card auth-choice-card" id="login-options">
            <div className="landing-pill landing-pill-outline">Log in</div>
            <h2>Access your <span className="headline-emphasis">existing dashboard</span></h2>
            <p className="muted">Use the same Google or Facebook account you used when you created your Shopnow store.</p>
            <div className="auth-buttons">
              <button className="soft-button button-with-icon" onClick={() => signIn('google', { callbackUrl: '/dashboard?intent=login' })}>
                <ButtonIcon symbol="G" />Log in with Google
              </button>
              <button className="soft-button-secondary button-with-icon" onClick={() => signIn('facebook', { callbackUrl: '/dashboard?intent=login' })}>
                <ButtonIcon symbol="f" />Log in with Facebook
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

    if (sessionStatus === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-wordmark" aria-label="Loading Shopnow">
          <span>S</span><span>h</span><span>o</span><span>p</span><span>n</span><span>o</span><span>w</span>
        </div>
      </div>
    );
  }

  if (initialMode === 'landing') {
    return renderLanding();
  }

  if (!loggedIn && initialMode === 'dashboard') {
    return (
      <div className="auth-shell">
        <div className="soft-card auth-card">
          <div className="auth-brand-wrap"><BrandMark size="auth" /></div>
          <h1 style={{ marginBottom: '0.5rem' }}>Log in to your Shopnow dashboard</h1>
          <p className="muted">Choose the same social account you used when creating your store.</p>
          <div className="auth-buttons auth-buttons-stack">
            <button className="soft-button button-with-icon" onClick={() => signIn('google', { callbackUrl: '/dashboard?intent=login' })}>
              <ButtonIcon symbol="G" />Log in with Google
            </button>
            <button className="soft-button-secondary button-with-icon" onClick={() => signIn('facebook', { callbackUrl: '/dashboard?intent=login' })}>
              <ButtonIcon symbol="f" />Log in with Facebook
            </button>
          </div>
          <div className="checkout-actions" style={{ justifyContent: 'center', marginTop: '1rem' }}>
            <a className="soft-button-ghost" href="/">Back to landing page</a>
          </div>
        </div>
      </div>
    );
  }

  if (loggedIn && initialMode === 'dashboard' && authIntent === 'signup' && store?.profile) {
    return (
      <div className="auth-shell">
        <div className="soft-card auth-card">
          <div className="auth-brand-wrap"><BrandMark size="auth" /></div>
          <h1 style={{ marginBottom: '0.5rem' }}>This account already has a store</h1>
          <p className="muted">Looks like this Google or Facebook account is already connected to <strong>{store.profile.storeName}</strong>. Please use log in instead of sign up.</p>
          <div className="checkout-actions" style={{ justifyContent: 'center', marginTop: '1rem' }}>
            <a className="soft-button" href="/dashboard">Go to dashboard</a>
            <button className="soft-button-ghost" type="button" onClick={() => signOut({ callbackUrl: '/' })}>Use another account</button>
          </div>
        </div>
      </div>
    );
  }

  if (loggedIn && initialMode === 'dashboard' && !store?.profile && authIntent === 'login') {
    return (
      <div className="auth-shell">
        <div className="soft-card auth-card">
          <div className="auth-brand-wrap"><BrandMark size="auth" /></div>
          <h1 style={{ marginBottom: '0.5rem' }}>No store found for this account</h1>
          <p className="muted">This Google or Facebook account has not created a Shopnow store yet. Please sign up first to reserve your username and create your blank store.</p>
          <div className="checkout-actions" style={{ justifyContent: 'center', marginTop: '1rem' }}>
            <a className="soft-button" href="/#signup-options">Go to sign up</a>
            <button className="soft-button-ghost" type="button" onClick={() => signOut({ callbackUrl: '/' })}>Use another account</button>
          </div>
        </div>
      </div>
    );
  }

  if (loggedIn && initialMode === 'dashboard' && !store?.profile) {
    return (
      <div className="auth-shell">
        <div className="soft-card auth-card">
          <div className="auth-brand-wrap"><BrandMark size="auth" /></div>
          <h1 style={{ marginBottom: '0.5rem' }}>Choose your Shopnow username</h1>
          <p className="muted">Your store starts completely blank. Pick a unique username for your public link like <strong>shopnow.xyz/username</strong>.</p>
          <form onSubmit={handleRegisterStore} style={{ marginTop: '1rem' }}>
            <label className="field">
              <span>Username</span>
              <input value={registerForm.username} onChange={(event) => setRegisterForm((current) => ({ ...current, username: event.target.value }))} placeholder="your-shop-name" />
              <small className={`muted ${usernameCheck.status === 'ok' ? 'status-ok' : usernameCheck.status === 'error' ? 'status-error' : ''}`}>{usernameCheck.message}</small>
            </label>
            <label className="field" style={{ marginTop: '0.75rem' }}>
              <span>Store name</span>
              <input value={registerForm.storeName} onChange={(event) => setRegisterForm((current) => ({ ...current, storeName: event.target.value }))} placeholder={(user?.name ? `${user.name}'s shop` : 'Your shop name')} />
            </label>
            <div className="checkout-actions" style={{ justifyContent: 'space-between', marginTop: '1rem' }}>
              <button className="soft-button-ghost" type="button" onClick={() => signOut({ callbackUrl: '/' })}>
                Sign out
              </button>
              <button className="soft-button" type="submit">
                Create blank store
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {initialMode === 'dashboard' && store?.profile && (
        <div className="app-topbar">
          <div className="container topbar-inner">
            <div className="brand-row">
              <BrandMark size="nav" />
              {user?.name && <span className="pill">{user.name}</span>}
            </div>
            <div className="inline-row">
              <button
                className={`soft-button-ghost ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                <ButtonIcon symbol="◫" />Dashboard
              </button>
              <button
                className={`soft-button-ghost ${currentView === 'storefront' ? 'active' : ''}`}
                onClick={() => setCurrentView('storefront')}
              >
                <ButtonIcon symbol="↗" />View storefront
              </button>
            </div>
          </div>
        </div>
      )}

      {initialMode === 'storefront' || currentView === 'storefront' ? renderStorefront() : renderDashboard()}

      {showCart && !isSellerPreview && (
        <div className="drawer-overlay" onClick={() => setShowCart(false)}>
          <div className="drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-header">
              <h2 style={{ margin: 0 }}>Shopping cart</h2>
              <button className="soft-button-ghost" onClick={() => setShowCart(false)}>
                Close
              </button>
            </div>

            {cartItems.length === 0 && <div className="empty-state">Cart is empty.</div>}
            {cartItems.map((item) => (
              <div className="cart-row" key={item.cartKey || item._id}>
                <div className="inline-row cart-item-main" style={{ alignItems: 'flex-start' }}>
                  <img src={item.imageUrl} alt={item.name} />
                  <div>
                    <div>{item.name}</div>
                    <div className="muted">{formatMoney(item.price)}</div>
                    {(item.selectedOptions?.size || item.selectedOptions?.color || item.selectedOptions?.varietyName) && (
                      <div className="cart-options muted">
                        {[item.selectedOptions?.size, item.selectedOptions?.color, item.selectedOptions?.varietyName].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <div className="qty-controls">
                      <button onClick={() => updateCartQty(item.cartKey || item._id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.cartKey || item._id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
                <strong>{formatMoney(item.price * item.quantity)}</strong>
              </div>
            ))}

            <div className="checkout-summary" style={{ marginTop: '1rem' }}>
              <strong>Total</strong>
              <strong>{formatMoney(cartTotal)}</strong>
            </div>
            <div className="note-box" style={{ marginTop: '1rem' }}>
              Checkout is limited to Cash on delivery. Delivery inside Dhaka: {formatMoney(store.profile?.deliveryInsideDhaka || 0)} · Outside Dhaka: {formatMoney(store.profile?.deliveryOutsideDhaka || 0)}{Number(store.profile?.freeDeliveryThreshold || 0) > 0 ? ` · Free over ${formatMoney(store.profile?.freeDeliveryThreshold || 0)}` : ''}.
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button className="soft-button button-with-icon" onClick={() => { setShowCart(false); setShowCheckout(true); }}>
                <ButtonIcon symbol="→" />Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && !isSellerPreview && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="centered-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-card">
              <h2 style={{ marginTop: 0 }}>Secure checkout</h2>
              <p className="muted">Payment method is fixed to Cash on delivery.</p>
              <div className="form-grid dashboard-form-stack" style={{ flexDirection: 'column', marginTop: '1rem' }}>
                <label className="field">
                  <span>Full name</span>
                  <input
                    value={checkoutForm.name}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    value={checkoutForm.email}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Phone number</span>
                  <input
                    value={checkoutForm.phone}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Shipping address</span>
                  <textarea
                    value={checkoutForm.address}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, address: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Order source</span>
                  <select value={checkoutForm.source} onChange={(event) => setCheckoutForm((current) => ({ ...current, source: event.target.value }))}>
                    {['Direct link', 'Facebook', 'Instagram', 'WhatsApp', 'Messenger'].map((source) => <option key={source} value={source}>{source}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Buyer note</span>
                  <textarea
                    value={checkoutForm.buyerNote}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, buyerNote: event.target.value }))}
                    placeholder="Size, color, preferred delivery note..."
                  />
                </label>
                <label className="field">
                  <span>Payment method</span>
                  <input value="Cash on delivery" disabled />
                </label>
              </div>
              <div className="checkout-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="soft-button-ghost" onClick={() => setShowCheckout(false)}>
                  Cancel
                </button>
                <button className="soft-button button-with-icon" onClick={handlePlaceOrder}>
                  <ButtonIcon symbol="✓" />Confirm order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="centered-modal product-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-card">
              <div className="drawer-header">
                <h2 style={{ margin: 0 }}>{selectedProduct.name}</h2>
                <button className="soft-button-ghost" onClick={() => setSelectedProduct(null)}>Close</button>
              </div>
              <div className="product-detail-grid">
                <div>
                  {selectedProduct.imageUrl ? <img className="product-detail-image" src={selectedProduct.imageUrl} alt={selectedProduct.name} /> : <div className="image-placeholder">No image</div>}
                  {(selectedProduct.varieties || []).length > 0 && (
                    <div className="variety-gallery">
                      {selectedProduct.varieties.map((item) => (
                        <button
                          className={`variety-tile ${productDetailSelection.varietyName === item.name ? 'active' : ''}`}
                          key={item.name || item.imageUrl}
                          onClick={() => setProductDetailSelection((current) => ({ ...current, varietyName: item.name }))}
                        >
                          {item.imageUrl ? <img src={item.imageUrl} alt={item.name || 'Variety'} /> : null}
                          <span>{item.name || 'Variety'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="product-detail-info">
                  <div>
                    <strong className="detail-price">{formatMoney(selectedProduct.price)}</strong>
                    {Number(selectedProduct.compareAtPrice || 0) > Number(selectedProduct.price || 0) ? <span className="muted" style={{ marginLeft: '0.5rem', textDecoration: 'line-through' }}>{formatMoney(selectedProduct.compareAtPrice)}</span> : null}
                  </div>
                  <p className="muted">{selectedProduct.shortDescription || selectedProduct.description || 'Product details will appear here.'}</p>
                  {selectedProduct.description && selectedProduct.shortDescription ? <p>{selectedProduct.description}</p> : null}
                  <div className="tag-row">
                    <span className={`tag stock-${selectedProduct.stockStatus || 'in_stock'}`}>{getStockStatusLabel(selectedProduct.stockStatus)}</span>
                    {Number(selectedProduct.stockQuantity || 0) > 0 ? <span className="tag">Qty {selectedProduct.stockQuantity}</span> : null}
                  </div>
                  {(selectedProduct.sizeOptions || []).length > 0 && (
                    <div className="detail-option-block">
                      <strong>Choose size</strong>
                      <div className="option-chip-grid">
                        {selectedProduct.sizeOptions.map((size) => (
                          <button className={`choice-chip ${productDetailSelection.size === size ? 'active' : ''}`} key={size} onClick={() => setProductDetailSelection((current) => ({ ...current, size }))}>{size}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {(selectedProduct.colorOptions || []).length > 0 && (
                    <div className="detail-option-block">
                      <strong>Choose color</strong>
                      <div className="option-chip-grid">
                        {selectedProduct.colorOptions.map((color) => (
                          <button className={`choice-chip ${productDetailSelection.color === color ? 'active' : ''}`} key={color} onClick={() => setProductDetailSelection((current) => ({ ...current, color }))}>{color}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {(selectedProduct.measurements?.length || selectedProduct.measurements?.chest || selectedProduct.measurements?.waist || selectedProduct.measurements?.fabric || selectedProduct.measurements?.fitNote || selectedProduct.deliveryEstimate || selectedProduct.returnPolicy || store.profile?.exchangePolicy) && (
                    <div className="note-box">
                      {selectedProduct.measurements?.length ? <div><strong>Length:</strong> {selectedProduct.measurements.length}</div> : null}
                      {selectedProduct.measurements?.chest ? <div><strong>Chest:</strong> {selectedProduct.measurements.chest}</div> : null}
                      {selectedProduct.measurements?.waist ? <div><strong>Waist:</strong> {selectedProduct.measurements.waist}</div> : null}
                      {selectedProduct.measurements?.fabric ? <div><strong>Fabric:</strong> {selectedProduct.measurements.fabric}</div> : null}
                      {selectedProduct.measurements?.fitNote ? <div><strong>Fit:</strong> {selectedProduct.measurements.fitNote}</div> : null}
                      {selectedProduct.deliveryEstimate ? <div><strong>Delivery:</strong> {selectedProduct.deliveryEstimate}</div> : null}
                      {(selectedProduct.returnPolicy || store.profile?.exchangePolicy) ? <div><strong>Return / exchange:</strong> {selectedProduct.returnPolicy || store.profile?.exchangePolicy}</div> : null}
                    </div>
                  )}
                  {isSellerPreview ? (
                    <div className="note-box">Seller preview only. Customers visiting your public store link can place real orders.</div>
                  ) : (
                    <button
                      className="soft-button button-with-icon"
                      disabled={(selectedProduct.stockStatus || 'in_stock') === 'stock_out'}
                      onClick={() => {
                        addToCart(selectedProduct, productDetailSelection);
                        setSelectedProduct(null);
                      }}
                    >
                      <ButtonIcon symbol="🛒" />{(selectedProduct.stockStatus || 'in_stock') === 'stock_out' ? 'Stock out' : 'Add to cart'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === 'product' && (
        <Modal onClose={() => { setModal(null); setEditingProduct(null); setProductForm(createProductForm()); }} title={editingProduct ? 'Edit product' : 'Add new product'}>
          <form onSubmit={handleSaveProduct}>
            <div className="form-grid dashboard-form-stack" style={{ flexDirection: 'column' }}>
              <label className="field">
                <span>Name</span>
                <input value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="field">
                <span>Short description</span>
                <input value={productForm.shortDescription} onChange={(event) => setProductForm((current) => ({ ...current, shortDescription: event.target.value }))} placeholder="One-line product highlight shown on cards" />
              </label>
              <div className="form-grid two-col-grid">
                <label className="field">
                  <span>Price</span>
                  <input value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} />
                </label>
                <label className="field">
                  <span>Original price (optional)</span>
                  <input value={productForm.compareAtPrice} onChange={(event) => setProductForm((current) => ({ ...current, compareAtPrice: event.target.value }))} />
                </label>
              </div>
              <div className="form-grid two-col-grid">
                <label className="field">
                  <span>Stock status</span>
                  <select value={productForm.stockStatus} onChange={(event) => setProductForm((current) => ({ ...current, stockStatus: event.target.value }))}>
                    {STOCK_STATUS_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Stock quantity</span>
                  <input value={productForm.stockQuantity} onChange={(event) => setProductForm((current) => ({ ...current, stockQuantity: event.target.value }))} />
                </label>
              </div>
              <label className="field checkbox-field">
                <span>Featured product</span>
                <input type="checkbox" checked={productForm.featured} onChange={(event) => setProductForm((current) => ({ ...current, featured: event.target.checked }))} />
              </label>
              <label className="field">
                <span>Full description</span>
                <textarea value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} />
              </label>

              <div className="option-builder">
                <label className="field checkbox-field">
                  <span>Add sizes</span>
                  <input type="checkbox" checked={productForm.hasSizes} onChange={(event) => setProductForm((current) => ({ ...current, hasSizes: event.target.checked, selectedSizes: event.target.checked ? current.selectedSizes : [] }))} />
                </label>
                {productForm.hasSizes && (
                  <div className="option-chip-grid">
                    {SIZE_OPTIONS.map((size) => (
                      <label className={`choice-chip ${productForm.selectedSizes.includes(size) ? 'active' : ''}`} key={size}>
                        <input type="checkbox" checked={productForm.selectedSizes.includes(size)} onChange={() => toggleProductSize(size)} />
                        <span>{size}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <label className="field">
                <span>Colors (optional)</span>
                <input value={productForm.colorOptions} onChange={(event) => setProductForm((current) => ({ ...current, colorOptions: event.target.value }))} placeholder="Black, Cream, Red" />
              </label>

              <div className="option-builder">
                <label className="field checkbox-field">
                  <span>Add varieties</span>
                  <input type="checkbox" checked={productForm.hasVarieties} onChange={(event) => setProductForm((current) => ({ ...current, hasVarieties: event.target.checked, varieties: event.target.checked && current.varieties.length ? current.varieties : [createEmptyVariety()] }))} />
                </label>
                {productForm.hasVarieties && (
                  <div className="variety-builder-list">
                    {productForm.varieties.map((item, index) => (
                      <div className="variety-builder-row" key={index}>
                        <label className="field">
                          <span>Variation name</span>
                          <input value={item.name} onChange={(event) => updateVarietyOption(index, { name: event.target.value })} placeholder="Color, bundle, fabric, design name" />
                        </label>
                        <label className="field">
                          <span>Variation photo</span>
                          <input type="file" accept="image/*" onChange={(event) => handleVarietyImageSelected(index, event)} />
                          {uploadingField === `varietyImage-${index}` && <small className="muted">Uploading...</small>}
                          {item.imageUrl && <img src={item.imageUrl} alt={item.name || 'Variation'} className="variety-preview-image" />}
                        </label>
                        <button className="soft-button-ghost" type="button" onClick={() => removeVarietyOption(index)}>Remove</button>
                      </div>
                    ))}
                    <button className="soft-button-secondary button-with-icon" type="button" onClick={addVarietyOption}>
                      <ButtonIcon symbol="＋" />Add variety
                    </button>
                  </div>
                )}
              </div>

              <div className="form-grid two-col-grid">
                <label className="field"><span>Length</span><input value={productForm.length} onChange={(event) => setProductForm((current) => ({ ...current, length: event.target.value }))} /></label>
                <label className="field"><span>Chest</span><input value={productForm.chest} onChange={(event) => setProductForm((current) => ({ ...current, chest: event.target.value }))} /></label>
                <label className="field"><span>Waist</span><input value={productForm.waist} onChange={(event) => setProductForm((current) => ({ ...current, waist: event.target.value }))} /></label>
                <label className="field"><span>Fabric</span><input value={productForm.fabric} onChange={(event) => setProductForm((current) => ({ ...current, fabric: event.target.value }))} /></label>
              </div>
              <label className="field">
                <span>Fit note</span>
                <input value={productForm.fitNote} onChange={(event) => setProductForm((current) => ({ ...current, fitNote: event.target.value }))} placeholder="Regular fit / oversized / stretchable" />
              </label>
              <label className="field">
                <span>Delivery estimate</span>
                <input value={productForm.deliveryEstimate} onChange={(event) => setProductForm((current) => ({ ...current, deliveryEstimate: event.target.value }))} placeholder={store.profile?.defaultDeliveryEstimate || ''} />
              </label>
              <label className="field">
                <span>Product-specific return / exchange policy</span>
                <textarea value={productForm.returnPolicy} onChange={(event) => setProductForm((current) => ({ ...current, returnPolicy: event.target.value }))} placeholder={store.profile?.exchangePolicy || ''} />
              </label>
              <div className="option-builder">
                <span className="field-label">Categories</span>
                <div className="option-chip-grid">
                  {store.categories.length === 0 ? <span className="muted">No categories yet. Create categories first if you want to organize products.</span> : null}
                  {store.categories.map((category) => (
                    <label className={`choice-chip ${productForm.categoryIds.includes(String(category._id)) ? 'active' : ''}`} key={category._id}>
                      <input
                        type="checkbox"
                        checked={productForm.categoryIds.includes(String(category._id))}
                        onChange={() => setProductForm((current) => ({
                          ...current,
                          categoryIds: current.categoryIds.includes(String(category._id))
                            ? current.categoryIds.filter((id) => id !== String(category._id))
                            : [...current.categoryIds, String(category._id)]
                        }))}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="field">
                <span>Product image</span>
                <input type="file" accept="image/*" onChange={handleProductImageSelected} />
                {uploadingField === 'productImage' && <small className="muted">Uploading...</small>}
                {productForm.imageUrl && <img src={productForm.imageUrl} alt="Preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '1rem', marginTop: '0.5rem' }} />}
              </label>
            </div>
            <div className="checkout-actions" style={{ justifyContent: 'space-between', marginTop: '1rem' }}>
              {editingProduct && (
                <button className="soft-button-danger" type="button" onClick={() => handleDeleteProduct(editingProduct._id)}>
                  Delete product
                </button>
              )}
              <div className="checkout-actions responsive-stack" style={{ justifyContent: 'flex-end' }}>
                <button className="soft-button-ghost" type="button" onClick={() => { setModal(null); setEditingProduct(null); setProductForm(createProductForm()); setProductSaveMode('save'); setFacebookCaption(''); }}>
                  Cancel
                </button>
                {facebookState.connected ? (
                  <button className="soft-button-secondary button-with-icon" type="button" onClick={openFacebookPostPreview}>
                    <ButtonIcon symbol="f" />{editingProduct ? 'Save and post' : 'Add and post'}
                  </button>
                ) : null}
                <button className="soft-button button-with-icon" type="submit" onClick={() => setProductSaveMode('save')}>
                  <ButtonIcon symbol={editingProduct ? '✓' : '＋'} />{editingProduct ? 'Save product' : 'Add product'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'facebook-preview' && (
        <Modal onClose={() => setModal('product')} title={`Preview Facebook post${facebookState.selectedPageName ? ` for ${facebookState.selectedPageName}` : ''}`}>
          <div className="facebook-preview-shell">
            <div className="soft-card facebook-preview-card">
              <div className="facebook-preview-head">
                <span className="tag">Facebook Page preview</span>
                {facebookState.selectedPageName ? <strong>{facebookState.selectedPageName}</strong> : null}
              </div>
              {productForm.imageUrl ? <img className="facebook-preview-image" src={productForm.imageUrl} alt={productForm.name || 'Product preview'} /> : null}
              <div className="facebook-preview-body">
                <label className="field">
                  <span>Edit caption before publish</span>
                  <textarea value={facebookCaption} onChange={(event) => setFacebookCaption(event.target.value)} rows={9} />
                </label>
                <div className="facebook-caption-preview">
                  <pre>{facebookCaption}</pre>
                </div>
              </div>
            </div>
            <div className="checkout-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="soft-button-ghost" type="button" onClick={() => setModal('product')}>
                Back to product
              </button>
              <button className="soft-button-secondary button-with-icon" type="button" onClick={confirmSaveAndPost}>
                <ButtonIcon symbol="f" />Publish to Facebook
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'category' && (
        <Modal onClose={() => setModal(null)} title="Create new category">
          <form onSubmit={handleCreateCategory}>
            <label className="field">
              <span>Category name</span>
              <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
            </label>
            <div className="checkout-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="soft-button-ghost" type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="soft-button button-with-icon" type="submit">
                <ButtonIcon symbol="◻" />Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'price' && editingPriceProduct && (
        <Modal onClose={() => setModal(null)} title={`Edit price: ${editingPriceProduct.name}`}>
          <label className="field">
            <span>New price</span>
            <input value={tempPriceValue} onChange={(event) => setTempPriceValue(event.target.value)} />
          </label>
          <div className="checkout-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="soft-button-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="soft-button" onClick={handleUpdatePrice}>
              Update price
            </button>
          </div>
        </Modal>
      )}

      {modal === 'categories' && editingCategoryProduct && (
        <Modal onClose={() => setModal(null)} title={`Assign categories: ${editingCategoryProduct.name}`}>
          <div className="form-grid dashboard-form-stack" style={{ flexDirection: 'column' }}>
            {store.categories.map((category) => (
              <label className="link-row" key={category._id}>
                <span>{category.name}</span>
                <input
                  type="checkbox"
                  checked={tempCategorySelection.includes(category._id)}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setTempCategorySelection((current) => [...current, category._id]);
                    } else {
                      setTempCategorySelection((current) => current.filter((id) => id !== category._id));
                    }
                  }}
                />
              </label>
            ))}
          </div>
          <div className="checkout-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="soft-button-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="soft-button" onClick={handleSaveCategories}>
              Save categories
            </button>
          </div>
        </Modal>
      )}

      {modal === 'rename-category' && renamingCategory && (
        <Modal onClose={() => setModal(null)} title="Rename category">
          <label className="field">
            <span>New category name</span>
            <input value={tempCategoryRename} onChange={(event) => setTempCategoryRename(event.target.value)} />
          </label>
          <div className="checkout-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="soft-button-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="soft-button" onClick={handleRenameCategory}>
              Save
            </button>
          </div>
        </Modal>
      )}


      {modal === 'delete-order-record' && orderDeleteTarget && (
        <Modal onClose={() => setModal(null)} title="Delete order record from app view">
          <div className="note-box" style={{ marginBottom: '1rem' }}>
            <strong>This will only remove the order from the seller dashboard view.</strong> The database record is kept for recovery, audit, and future admin use.
          </div>
          <div className="form-grid dashboard-form-stack" style={{ flexDirection: 'column' }}>
            <label className="field">
              <span>First confirmation: enter the order ID</span>
              <input value={orderDeleteNumber} onChange={(event) => setOrderDeleteNumber(event.target.value)} placeholder={orderDeleteTarget.orderNumber} />
            </label>
            <label className="field">
              <span>Second confirmation: type DELETE</span>
              <input value={orderDeleteText} onChange={(event) => setOrderDeleteText(event.target.value)} placeholder="DELETE" />
            </label>
          </div>
          <div className="checkout-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="soft-button-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="soft-button-danger" onClick={handleHideOrderRecord}>
              Delete record from app
            </button>
          </div>
        </Modal>
      )}


      {modal === 'delete-store' && store?.profile && (
        <Modal onClose={() => setModal(null)} title="Delete your store permanently">
          <div className="note-box" style={{ marginBottom: '1rem' }}>
            <strong>This action cannot be undone.</strong> Deleting your store removes your storefront, products, categories, orders, and seller profile for good.
          </div>
          <div className="form-grid dashboard-form-stack" style={{ flexDirection: 'column' }}>
            <label className="field">
              <span>First confirmation: enter your username</span>
              <input value={deleteConfirmSlug} onChange={(event) => setDeleteConfirmSlug(event.target.value)} placeholder={store.profile.slug} />
            </label>
            <label className="field">
              <span>Second confirmation: type DELETE</span>
              <input value={deleteConfirmText} onChange={(event) => setDeleteConfirmText(event.target.value)} placeholder="DELETE" />
            </label>
          </div>
          <div className="checkout-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="soft-button-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="soft-button-danger" onClick={handleDeleteStore}>
              Permanently delete store
            </button>
          </div>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="centered-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-card">
          <div className="drawer-header">
            <h2 style={{ margin: 0 }}>{title}</h2>
            <button className="soft-button-ghost" onClick={onClose}>
              Close
            </button>
          </div>
          <div style={{ marginTop: '1rem' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}



function StoreContactDock({ profile }) {
  const whatsappNumber = (profile.whatsappNumber || '').replace(/[^\d]/g, '');
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi ${profile.storeName}, I want to ask about a product.`)}`
    : '';
  const messengerHref = profile.messengerUrl || (profile.facebookHandle ? `https://m.me/${profile.facebookHandle}` : '');

  if (!whatsappHref && !messengerHref) return null;

  return (
    <div className="contact-dock">
      {messengerHref && (
        <a className="contact-fab messenger" href={messengerHref} target="_blank" rel="noreferrer">
          <span className="contact-fab-icon">M</span>
          <span>Message seller</span>
        </a>
      )}
      {whatsappHref && (
        <a className="contact-fab whatsapp" href={whatsappHref} target="_blank" rel="noreferrer">
          <span className="contact-fab-icon">W</span>
          <span>WhatsApp seller</span>
        </a>
      )}
    </div>
  );
}
