// These defaults are intentionally close to the original static template so the
// migrated app keeps the same visual tone and content structure.
export const DEFAULT_CATEGORIES = [
  { name: 'Blazers & Jackets', slug: 'blazers-jackets' },
  { name: 'Dresses', slug: 'dresses' },
  { name: 'Accessories', slug: 'accessories' },
  { name: 'Bottoms', slug: 'bottoms' }
];

export const DEFAULT_PRODUCTS = [
  {
    name: 'Oversized Blazer',
    slug: 'oversized-blazer',
    price: 129.99,
    description: 'Relaxed fit, wool blend',
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900&auto=format',
    categoryNames: ['Blazers & Jackets']
  },
  {
    name: 'Silk Midi Dress',
    slug: 'silk-midi-dress',
    price: 89.99,
    description: 'Elegant satin finish',
    imageUrl: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=900&auto=format',
    categoryNames: ['Dresses']
  },
  {
    name: 'Leather Tote Bag',
    slug: 'leather-tote-bag',
    price: 79,
    description: 'Minimal and spacious',
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900&auto=format',
    categoryNames: ['Accessories']
  },
  {
    name: 'High-Waist Trousers',
    slug: 'high-waist-trousers',
    price: 69.99,
    description: 'Tailored crepe',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&auto=format',
    categoryNames: ['Bottoms']
  },
  {
    name: 'Cashmere Scarf',
    slug: 'cashmere-scarf',
    price: 59.99,
    description: 'Soft luxury',
    imageUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=900&auto=format',
    categoryNames: ['Accessories']
  }
];

export const DEFAULT_PROFILE = {
  storeName: 'Velvet & Co.',
  slug: 'velvetandco',
  storeLogo: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=240&auto=format',
  storeBanner: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&auto=format',
  bio: 'Minimalist essentials • slow fashion',
  instagramHandle: 'velvetandco',
  facebookHandle: 'velvetandco',
  whatsappNumber: '',
  messengerUrl: '',
  profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format',
  paymentMethods: ['Cash on delivery']
};

export const DEFAULT_LINKS = [
  { title: 'Instagram Shop', url: 'https://instagram.com/shop' },
  { title: 'Style Lookbook', url: 'https://pinterest.com/shop' }
];

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

export const ORDER_STATUS_LABELS = {
  pending: 'Pending confirmation',
  confirmed: 'Confirmed',
  packed: 'Packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export const ORDER_PROGRESS_STEPS = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];

export const ORDER_ACTIONS = {
  pending: [
    { key: 'confirm', label: 'Confirm order', tone: 'primary' },
    { key: 'cancel', label: 'Cancel', tone: 'ghost' }
  ],
  confirmed: [
    { key: 'pack', label: 'Mark packed', tone: 'primary' },
    { key: 'cancel', label: 'Cancel', tone: 'ghost' }
  ],
  packed: [
    { key: 'dispatch', label: 'Hand to courier', tone: 'primary' },
    { key: 'cancel', label: 'Cancel', tone: 'ghost' }
  ],
  out_for_delivery: [
    { key: 'deliver', label: 'Mark delivered', tone: 'primary' },
    { key: 'revert_to_packed', label: 'Back to packed', tone: 'ghost' }
  ],
  delivered: [
    { key: 'archive_note', label: 'Completed', tone: 'ghost' }
  ],
  cancelled: [
    { key: 'reopen', label: 'Reopen order', tone: 'ghost' }
  ]
};
