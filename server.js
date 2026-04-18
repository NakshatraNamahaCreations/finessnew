import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())

// ── In-memory store (per session) ──
const store = {
  carts: {},     // userId -> [{productId, variantLabel, qty}]
  wishlists: {}, // userId -> [productId]
}

// ── Product catalog ──
const PRODUCTS = [
  {
    id: 'floor-spark',
    category: 'Floor & Home Cleaners',
    name: 'Floor Spark',
    subtitle: 'Floor Cleaning Liquid',
    desc: 'Effortless floor care designed for everyday living. Antibacterial formula with long-lasting fragrance and streak-free finish.',
    specs: ['Antibacterial', 'Streak-free', 'Long-lasting fragrance'],
    tag: 'Bestseller',
    variants: [
      { label: 'Mandarin Zest', price: 222 },
      { label: 'Sandal Cinnamon', price: 234 },
      { label: 'Lavender', price: 199 },
    ],
  },
  {
    id: 'glass-glimmer',
    category: 'Floor & Home Cleaners',
    name: 'Glass Glimmer',
    subtitle: 'Glass Cleaning Liquid',
    desc: 'Crystal clear results on all glass surfaces. Ammonia-free formula safe for mirrors, windows and tiles.',
    specs: ['Ammonia-free', 'Streak-free', 'Multi-surface'],
    variants: [
      { label: 'Fresh Mint', price: 189 },
      { label: 'Classic Clear', price: 175 },
    ],
  },
  {
    id: 'fabric-fluff',
    category: 'Laundry & Fabric Care',
    name: 'Fabric Fluff',
    subtitle: 'Fabric Conditioning Liquid',
    desc: 'Leaves clothes irresistibly soft and fresh. Gentle on all fabric types, tough on static cling.',
    specs: ['Fabric-safe', 'Anti-static', 'Long-lasting scent'],
    tag: 'Popular',
    variants: [
      { label: 'Jasmine Bloom', price: 245 },
      { label: 'Morning Dew', price: 260 },
      { label: 'Rose Petal', price: 255 },
    ],
  },
  {
    id: 'laundry-lumina',
    category: 'Laundry & Fabric Care',
    name: 'Laundry Lumina',
    subtitle: 'Fabric Detergent Liquid',
    desc: 'Gentle on fabrics, effective on stains. Bioenzyme formula made for everyday washing.',
    specs: ['Bioenzyme formula', 'Stain removing', 'Colour-safe'],
    badge: 'Value Pack',
    variants: [
      { label: '1 Litre', price: 199 },
      { label: '3 Litres', price: 499 },
      { label: '5 Litres', price: 799 },
    ],
  },
  {
    id: 'dish-revive',
    category: 'Dish & Kitchen Care',
    name: 'Dish Revive',
    subtitle: 'Dish Cleaning Liquid',
    desc: 'Cuts through grease, designed for daily dishes. Non-toxic enzymatic action safe for the whole family.',
    specs: ['Enzymatic action', 'Non-toxic', 'Grease-busting'],
    tag: 'Bestseller',
    variants: [
      { label: 'Lemon Fresh', price: 149 },
      { label: 'Orange Burst', price: 149 },
      { label: 'Original', price: 139 },
    ],
  },
  {
    id: 'toilet-bowl-zen',
    category: 'Toilet & Bathroom Cleaners',
    name: 'Toilet Bowl Zen',
    subtitle: 'Toilet Bowl Cleaning Liquid',
    desc: 'Powerful limescale and stain removal with a refreshing fragrance. Under-rim formula for complete coverage.',
    specs: ['Limescale removal', 'Under-rim formula', 'Anti-bacterial'],
    variants: [
      { label: 'Pine Fresh', price: 119 },
      { label: 'Ocean Breeze', price: 125 },
    ],
  },
  {
    id: 'bathroom-bliss',
    category: 'Toilet & Bathroom Cleaners',
    name: 'Bathroom Bliss',
    subtitle: 'Bathroom Floor Cleaning Liquid',
    desc: 'Deep cleans bathroom floors, tiles and surfaces. Removes soap scum and hard water stains effortlessly.',
    specs: ['Soap scum removal', 'Hard water stains', 'Tile-safe'],
    badge: 'New',
    variants: [
      { label: 'Aqua Fresh', price: 169 },
      { label: 'Citrus Zest', price: 175 },
    ],
  },
  {
    id: 'hand-glisten',
    category: 'Hand Washes',
    name: 'Hand Glisten',
    subtitle: 'Liquid Hand Wash',
    desc: 'Designed for frequent use with everyday comfort in mind. Moisturising lavender formula, dermatologist tested.',
    specs: ['Moisturising', 'Dermatologist tested', 'Sulphate-free'],
    tag: 'Popular',
    variants: [
      { label: 'Lavender', price: 179 },
      { label: 'Rose', price: 185 },
      { label: 'Aloe Vera', price: 179 },
    ],
  },
  {
    id: 'torque-tidy',
    category: 'Auto Care',
    name: 'Torque Tidy',
    subtitle: 'Premium Auto Shampoo',
    desc: 'Professional-grade car wash formula that lifts dirt without stripping wax. Safe for all paint finishes.',
    specs: ['Wax-safe formula', 'High-foam lather', 'All paint types'],
    badge: 'Pro',
    variants: [
      { label: '500ml', price: 349 },
      { label: '1 Litre', price: 599 },
    ],
  },
]

// helper: get or create user store
const getUser = (userId, key) => {
  if (!store[key][userId]) store[key][userId] = []
  return store[key][userId]
}

// ══ PRODUCT ROUTES ══════════════════════
app.get('/api/products', (req, res) => {
  const { category, id } = req.query
  let list = PRODUCTS
  if (category) list = list.filter(p => p.category === category)
  if (id)       list = list.filter(p => p.id === id)
  res.json(list)
})

app.get('/api/products/:id', (req, res) => {
  const p = PRODUCTS.find(p => p.id === req.params.id)
  if (!p) return res.status(404).json({ error: 'Not found' })
  res.json(p)
})

// ══ CART ROUTES ═════════════════════════
app.get('/api/cart/:userId', (req, res) => {
  res.json(getUser(req.params.userId, 'carts'))
})

app.post('/api/cart/:userId', (req, res) => {
  const { productId, variantLabel, qty = 1 } = req.body
  const cart = getUser(req.params.userId, 'carts')
  const product = PRODUCTS.find(p => p.id === productId)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  const variant = product.variants.find(v => v.label === variantLabel) || product.variants[0]
  const key = productId + '|' + variant.label
  const existing = cart.find(i => i.key === key)
  if (existing) {
    existing.qty += qty
  } else {
    cart.push({ key, productId, productName: product.name, subtitle: product.subtitle, variantLabel: variant.label, price: variant.price, qty })
  }
  res.json(cart)
})

app.patch('/api/cart/:userId/:key', (req, res) => {
  const cart = getUser(req.params.userId, 'carts')
  const item = cart.find(i => i.key === decodeURIComponent(req.params.key))
  if (!item) return res.status(404).json({ error: 'Item not found' })
  item.qty = Math.max(1, req.body.qty)
  res.json(cart)
})

app.delete('/api/cart/:userId/:key', (req, res) => {
  const u = req.params.userId
  store.carts[u] = (store.carts[u] || []).filter(i => i.key !== decodeURIComponent(req.params.key))
  res.json(store.carts[u])
})

// ══ WISHLIST ROUTES ══════════════════════
// wishlist items: { key: "productId|variantLabel", productId, variantLabel }
app.get('/api/wishlist/:userId', (req, res) => {
  const list = getUser(req.params.userId, 'wishlists')
  // enrich with product data
  const enriched = list.map(item => {
    const p = PRODUCTS.find(x => x.id === item.productId)
    if (!p) return null
    const v = p.variants.find(x => x.label === item.variantLabel) || p.variants[0]
    return { key: item.key, productId: p.id, productName: p.name, subtitle: p.subtitle, category: p.category, variantLabel: v.label, price: v.price }
  }).filter(Boolean)
  res.json(enriched)
})

app.post('/api/wishlist/:userId', (req, res) => {
  const { productId, variantLabel } = req.body
  const list = getUser(req.params.userId, 'wishlists')
  const p = PRODUCTS.find(x => x.id === productId)
  if (!p) return res.status(404).json({ error: 'Product not found' })
  const v = p.variants.find(x => x.label === variantLabel) || p.variants[0]
  const key = productId + '|' + v.label
  if (!list.find(i => i.key === key)) list.push({ key, productId, variantLabel: v.label })
  // return just keys for frontend state
  res.json(list.map(i => i.key))
})

app.delete('/api/wishlist/:userId/:key', (req, res) => {
  const u = req.params.userId
  const key = decodeURIComponent(req.params.key)
  store.wishlists[u] = (store.wishlists[u] || []).filter(i => i.key !== key)
  res.json(store.wishlists[u].map(i => i.key))
})

// get full wishlist items (for wishlist page)
app.get('/api/wishlist/:userId/full', (req, res) => {
  const list = getUser(req.params.userId, 'wishlists')
  const enriched = list.map(item => {
    const p = PRODUCTS.find(x => x.id === item.productId)
    if (!p) return null
    const v = p.variants.find(x => x.label === item.variantLabel) || p.variants[0]
    return { key: item.key, productId: p.id, productName: p.name, subtitle: p.subtitle, category: p.category, variantLabel: v.label, price: v.price }
  }).filter(Boolean)
  res.json(enriched)
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Finess API running on port ${PORT}`))
