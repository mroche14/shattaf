
import React, { useEffect, useState, useRef } from 'react';
import {
  Building2,
  CheckCircle2,
  Loader2,
  UserCheck,
  MapPin,
  Camera,
  X,
  Navigation,
  Send,
  Plus,
  Minus,
  AlertTriangle,
  Info
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { PRODUCTS as FALLBACK_PRODUCTS } from '../../constants';
import { SITE } from '../../siteConfig';

interface ApiProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  is_available: boolean;
  price_first_unit: number;  // in euros
  price_additional: number;  // in euros
}

interface PricingInfo {
  plumber_travel_fee: number;
  plumber_labor_fee: number;
  platform_commission_first: number;
  platform_commission_additional: number;
}

interface ProductQuantity {
  productId: string;
  quantity: number;
}

interface PhotoSlot {
  id: string;
  label: string;
  description: string;
  file: File | null;
  preview: string | null;
}

const BookingSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Products from API
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);

  // Product quantities - track quantity per product
  const [quantities, setQuantities] = useState<ProductQuantity[]>([]);

  // Address
  const [formData, setFormData] = useState({
    addressStreet: '',
    addressPostalCode: '',
    addressCity: '',
    addressLat: null as number | null,
    addressLng: null as number | null,
    preferredDate: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    companyName: ''
  });

  // Toilet type & photos
  const [isWallMounted, setIsWallMounted] = useState(false);
  const [photos, setPhotos] = useState<PhotoSlot[]>([
    { id: 'front', label: 'Face des WC', description: 'Vue de face', file: null, preview: null },
    { id: 'side', label: 'Côté robinet', description: 'Robinet d\'arrêt', file: null, preview: null },
  ]);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Use API products or fallback to hardcoded
  const products = apiProducts.length > 0 ? apiProducts : FALLBACK_PRODUCTS.map(p => ({
    id: p.id,
    sku: p.id,
    name: p.name,
    description: p.description,
    category: 'shattaf',
    image_url: p.image,
    is_available: true,
    price_first_unit: p.price,
    price_additional: p.price - 20,  // Default -20€ for additional
  }));

  // Calculate totals
  const totalUnits = quantities.reduce((sum, q) => sum + q.quantity, 0);
  const calculateTotal = () => {
    let total = 0;
    let unitIndex = 0;
    for (const q of quantities) {
      const product = products.find(p => p.id === q.productId);
      if (!product || q.quantity === 0) continue;
      for (let i = 0; i < q.quantity; i++) {
        // First unit overall gets full price, rest get discounted price
        total += unitIndex === 0 ? product.price_first_unit : product.price_additional;
        unitIndex++;
      }
    }
    return total;
  };
  const cartTotal = calculateTotal();

  // Calculate savings (first unit vs additional)
  const calculateSavings = () => {
    if (totalUnits <= 1) return 0;
    let savings = 0;
    let unitIndex = 0;
    for (const q of quantities) {
      const product = products.find(p => p.id === q.productId);
      if (!product || q.quantity === 0) continue;
      for (let i = 0; i < q.quantity; i++) {
        if (unitIndex > 0) {
          savings += product.price_first_unit - product.price_additional;
        }
        unitIndex++;
      }
    }
    return savings;
  };
  const totalSavings = calculateSavings();

  // Computed values
  const hasPhotos = photos.some(p => p.file !== null);
  const showPriceWarning = isWallMounted && !hasPhotos;
  const addressComplete = formData.addressStreet && formData.addressPostalCode && formData.addressCity;
  const canSubmit = totalUnits > 0 && addressComplete && formData.customerName && formData.customerPhone;

  // Mode toggle
  const applyMode = (nextIsPro: boolean) => {
    setIsPro(nextIsPro);
  };

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/v1/public/products');
        if (response.ok) {
          const data = await response.json();
          setApiProducts(data.products);
          setPricingInfo(data.pricing);
          setQuantities(data.products.map((p: ApiProduct) => ({ productId: p.id, quantity: 0 })));
        } else {
          // Fallback to hardcoded products
          console.warn('Failed to fetch products from API, using fallback');
          setQuantities(FALLBACK_PRODUCTS.map(p => ({ productId: p.id, quantity: 0 })));
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        // Fallback to hardcoded products
        setQuantities(FALLBACK_PRODUCTS.map(p => ({ productId: p.id, quantity: 0 })));
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const handler: EventListener = (event) => {
      const custom = event as CustomEvent<{ isPro?: boolean }>;
      if (typeof custom.detail?.isPro !== 'boolean') return;
      applyMode(custom.detail.isPro);
    };
    window.addEventListener('booking:setMode', handler);
    return () => window.removeEventListener('booking:setMode', handler);
  }, []);

  // Quantity operations
  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => prev.map(q =>
      q.productId === productId
        ? { ...q, quantity: Math.max(0, q.quantity + delta) }
        : q
    ));
  };

  const getQuantity = (productId: string) => {
    return quantities.find(q => q.productId === productId)?.quantity || 0;
  };

  // GPS Location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Géolocalisation non supportée');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Save coordinates
        setFormData(prev => ({
          ...prev,
          addressLat: latitude,
          addressLng: longitude,
        }));

        // Reverse geocoding to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'fr' } }
          );
          const data = await response.json();

          if (data.address) {
            // Build street address
            const streetParts = [
              data.address.house_number,
              data.address.road || data.address.street || data.address.pedestrian
            ].filter(Boolean);
            const street = streetParts.join(' ');

            // Get city (try multiple fields for Guadeloupe)
            const city = data.address.city ||
                        data.address.town ||
                        data.address.village ||
                        data.address.municipality ||
                        data.address.suburb ||
                        '';

            // Get postal code
            const postalCode = data.address.postcode || '';

            setFormData(prev => ({
              ...prev,
              addressStreet: street || prev.addressStreet,
              addressCity: city || prev.addressCity,
              addressPostalCode: postalCode || prev.addressPostalCode,
            }));

            setGpsError(''); // Clear any previous error
          } else {
            setGpsError('Adresse non trouvée. Complétez manuellement.');
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setGpsError('Position GPS OK, mais adresse non trouvée. Complétez manuellement.');
        }

        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            setGpsError('Accès à la position refusé. Autorisez la géolocalisation dans votre navigateur.');
            break;
          case 2: // POSITION_UNAVAILABLE
            setGpsError('Position non disponible. Vérifiez que le GPS est activé.');
            break;
          case 3: // TIMEOUT
            setGpsError('Délai dépassé. Réessayez ou entrez l\'adresse manuellement.');
            break;
          default:
            setGpsError(`Erreur de géolocalisation (${error.code}). Entrez l'adresse manuellement.`);
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  };

  // Photo handling
  const handlePhotoCapture = async (slotId: string, file: File) => {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const preview = URL.createObjectURL(compressed);

      setPhotos(prev => prev.map(slot =>
        slot.id === slotId
          ? { ...slot, file: compressed, preview }
          : slot
      ));
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  const handleRemovePhoto = (slotId: string) => {
    setPhotos(prev => prev.map(slot =>
      slot.id === slotId
        ? { ...slot, file: null, preview: null }
        : slot
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !canSubmit) return;

    setLoading(true);

    // Build items array from quantities
    const items: { product_id: string; price: number }[] = [];
    let unitIndex = 0;
    for (const q of quantities) {
      const product = products.find(p => p.id === q.productId);
      if (!product || q.quantity === 0) continue;
      for (let i = 0; i < q.quantity; i++) {
        items.push({
          product_id: product.id,
          price: unitIndex === 0 ? product.price_first_unit : product.price_additional,
        });
        unitIndex++;
      }
    }

    try {
      const response = await fetch('/api/v1/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.customerName,
          customer_email: formData.customerEmail || null,
          customer_phone: formData.customerPhone,
          address_street: formData.addressStreet,
          address_city: formData.addressCity,
          address_postal_code: formData.addressPostalCode,
          address_lat: formData.addressLat,
          address_lng: formData.addressLng,
          preferred_date: formData.preferredDate || null,
          items,
          quantity: totalUnits,
          is_wall_mounted: isWallMounted,
          has_photos: hasPhotos,
          additional_notes: isWallMounted ? 'WC encastré/suspendu' : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la demande');
      }

      const result = await response.json();
      setTrackingUrl(result.tracking_url);
      setSuccess(true);
    } catch (err) {
      console.error('Booking creation failed:', err);
      alert('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section id="booking" className="py-16 md:py-32 flex items-center justify-center px-6">
        <div className="glass p-8 sm:p-12 md:p-16 rounded-[24px] md:rounded-[60px] text-center space-y-6 md:space-y-10 max-w-xl border-cyan-500/30 cyan-glow">
          <div className="w-24 h-24 btn-primary rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle2 className="w-12 h-12 text-[var(--accent-primary)]" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-4xl font-display font-black text-[var(--text-main)]">Demande envoyée !</h2>
            <p className="text-[var(--text-secondary)] text-lg font-light leading-relaxed">
              Nous vous répondons sous {SITE.offer.responseTime} pour confirmer votre installation.
            </p>
          </div>
          {trackingUrl && (
            <a
              href={trackingUrl}
              className="inline-block px-8 py-4 rounded-2xl btn-primary text-white font-black uppercase tracking-[0.18em] text-sm"
            >
              Suivre ma demande
            </a>
          )}
          <button onClick={() => { setSuccess(false); setTrackingUrl(''); setQuantities(products.map(p => ({ productId: p.id, quantity: 0 }))); }} className="block mx-auto text-cyan-300 underline font-black tracking-[0.18em] uppercase text-[11px]">
            Faire une autre demande
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="py-16 md:py-32 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Left side - Info */}
          <div className="space-y-8">
            <h2 className="text-cyan-400 text-xs font-black tracking-[0.4em] uppercase">Service & Réservation</h2>
            <h3 className="text-3xl sm:text-5xl md:text-6xl font-display font-black leading-none tracking-tighter">
              Votre Espace, <br/> <span className="cyan-gradient-text">Votre Hygiène.</span>
            </h3>

            <div className="flex gap-2 p-1 glass rounded-2xl w-fit">
              <button
                onClick={() => applyMode(false)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isPro ? 'btn-primary shadow-lg' : 'hover:bg-white/5 text-[var(--text-secondary)]'}`}
              >
                <UserCheck size={14} /> Particulier
              </button>
              <button
                onClick={() => applyMode(true)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isPro ? 'btn-primary shadow-lg' : 'hover:bg-white/5 text-[var(--text-secondary)]'}`}
              >
                <Building2 size={14} /> Professionnel
              </button>
            </div>

            <p className="text-[var(--text-secondary)] text-base md:text-lg font-light leading-relaxed">
              {isPro
                ? "Solutions de volume pour hôtels, villas et entreprises."
                : "Installation en ~30 minutes, proprement et avec soin."
              }
            </p>

            {/* Pricing explanation */}
            <div className="p-5 rounded-2xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Info size={16} className="text-cyan-400" /> Tarifs tout compris
              </h4>
              <div className="text-sm text-[var(--text-secondary)] space-y-1">
                <p><span className="text-[var(--text-main)] font-medium">1er shattaf</span> : prix affiché (déplacement {pricingInfo?.plumber_travel_fee || 20}€ inclus)</p>
                <p><span className="text-[var(--text-main)] font-medium">Shattafs suivants</span> : prix réduit (sans déplacement)</p>
              </div>
              {products.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Exemple : 2× {products[0].name} = {products[0].price_first_unit}€ + {products[0].price_additional}€ = <span className="text-cyan-400 font-bold">{products[0].price_first_unit + products[0].price_additional}€</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Form */}
          <form onSubmit={handleSubmit} className="glass p-5 sm:p-6 md:p-8 rounded-[24px] md:rounded-[32px] border-white/5 space-y-5 shadow-2xl">

            {/* Product selection with quantities */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.18em]">
                Choisir vos shattafs
              </label>
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-cyan-400" size={24} />
                </div>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => {
                    const qty = getQuantity(product.id);
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                          qty > 0
                            ? 'bg-cyan-500/10 border-cyan-500/30'
                            : 'bg-[var(--bg-inner)] border-[var(--border-color)] hover:border-[var(--text-tertiary)]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {product.price_first_unit}€ {totalUnits > 0 && qty === 0 && <span className="text-cyan-400">({product.price_additional}€ si ajouté)</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            disabled={qty === 0}
                            className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className={`w-8 text-center font-bold ${qty > 0 ? 'text-cyan-400' : 'text-[var(--text-tertiary)]'}`}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {totalUnits === 0 && (
              <div className="py-4 text-center text-[var(--text-tertiary)] text-sm">
                Sélectionnez au moins un shattaf pour continuer
              </div>
            )}

            {/* Location */}
            <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.18em] flex items-center gap-2">
                  <MapPin size={14} className="text-cyan-400" /> Adresse d'installation
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gpsLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/30 transition-colors"
                >
                  {gpsLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                  GPS
                </button>
              </div>
              {gpsError && <p className="text-red-400 text-xs">{gpsError}</p>}
              {formData.addressLat && (
                <p className="text-emerald-400 text-xs flex items-center gap-1">
                  <CheckCircle2 size={12} /> Position GPS enregistrée
                </p>
              )}
              <input
                required
                placeholder="Numéro et rue"
                className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent-primary)] outline-none"
                value={formData.addressStreet}
                onChange={(e) => setFormData({...formData, addressStreet: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="Code postal"
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent-primary)] outline-none"
                  value={formData.addressPostalCode}
                  onChange={(e) => setFormData({...formData, addressPostalCode: e.target.value})}
                />
                <input
                  required
                  placeholder="Ville"
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent-primary)] outline-none"
                  value={formData.addressCity}
                  onChange={(e) => setFormData({...formData, addressCity: e.target.value})}
                />
              </div>
            </div>

            {/* Toilet type + Photos */}
            <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)]">
              <label className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.18em] flex items-center gap-2">
                <Camera size={14} className="text-cyan-400" /> Type de WC & Photos
              </label>

              {/* Wall-mounted checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 cursor-pointer hover:bg-slate-700/50 transition-colors">
                <input
                  type="checkbox"
                  checked={isWallMounted}
                  onChange={(e) => setIsWallMounted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/20 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="text-sm font-medium">WC suspendu / encastré</span>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Installation plus complexe possible</p>
                </div>
              </label>

              {/* Warning if wall-mounted + no photos */}
              {showPriceWarning && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-300 font-medium">Prix susceptible d'évoluer</p>
                    <p className="text-xs text-amber-200/70 mt-1">
                      Sans photos, le plombier évaluera sur place. Le devis pourrait être ajusté selon la complexité de l'installation.
                    </p>
                  </div>
                </div>
              )}

              {/* Photo upload */}
              <p className="text-xs text-[var(--text-tertiary)]">Photos optionnelles (recommandées pour un devis précis)</p>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((slot) => (
                  <div key={slot.id} className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[slot.id] = el; }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoCapture(slot.id, file);
                      }}
                    />
                    {slot.preview ? (
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-cyan-500">
                        <img src={slot.preview} alt={slot.label} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(slot.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[slot.id]?.click()}
                        className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-white/20 hover:border-cyan-500/50 flex flex-col items-center justify-center gap-1 transition-colors"
                      >
                        <Camera size={20} className="text-[var(--text-tertiary)]" />
                        <span className="text-[10px] font-bold text-[var(--text-secondary)]">{slot.label}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              {isPro && (
                <input
                  required
                  placeholder="Nom de l'établissement"
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent-primary)] outline-none"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                />
              )}
              <input
                required
                placeholder="Votre nom"
                className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent-primary)] outline-none"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              />
              <input
                required
                type="tel"
                placeholder="Téléphone (WhatsApp)"
                className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent-primary)] outline-none"
                value={formData.customerPhone}
                onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Email (optionnel)"
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent-primary)] outline-none"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                />
                <input
                  type="date"
                  placeholder="Date souhaitée"
                  className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent-primary)] outline-none"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
                />
              </div>
            </div>

            {/* Total */}
            {totalUnits > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-1">
                {totalUnits > 1 && totalSavings > 0 && (
                  <div className="flex justify-between items-center text-xs text-[var(--text-tertiary)]">
                    <span>Économie (sans déplacement ×{totalUnits - 1})</span>
                    <span className="text-emerald-400">-{totalSavings}€</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-black text-[var(--text-main)]">
                  <span>Total ({totalUnits} shattaf{totalUnits > 1 ? 's' : ''})</span>
                  <span className="cyan-gradient-text">{cartTotal}€</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full py-3.5 rounded-xl btn-primary text-white font-black flex items-center justify-center gap-2 uppercase tracking-[0.12em] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={16} /> Envoyer ma demande</>}
            </button>

            <p className="text-center text-[11px] text-[var(--text-tertiary)]">
              Réponse sous {SITE.offer.responseTime} — Guadeloupe uniquement
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
