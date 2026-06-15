'use client'

import { useState, useEffect } from 'react'

const SALE_CODE = 'EXCLUSIVE2026'

const products = [
  { id: 1, name: 'Minimal Desk Lamp', category: 'Home & Living', price: 49.99, badge: 'New' },
  { id: 2, name: 'Canvas Tote Bag', category: 'Accessories', price: 24.99, originalPrice: 34.99, badge: 'Sale' },
  { id: 3, name: 'Ceramic Mug Set', category: 'Kitchen', price: 36.99, badge: null },
  { id: 4, name: 'Leather Wallet', category: 'Accessories', price: 59.99, badge: 'New' },
  { id: 5, name: 'Bamboo Cutting Board', category: 'Kitchen', price: 29.99, badge: null },
  { id: 6, name: 'Wireless Charger', category: 'Tech', price: 39.99, originalPrice: 54.99, badge: 'Sale' },
  { id: 7, name: 'Linen Throw Pillow', category: 'Home & Living', price: 22.99, badge: null },
  { id: 8, name: 'Portable Speaker', category: 'Tech', price: 89.99, badge: 'New' },
]

const categories = ['All', 'Home & Living', 'Accessories', 'Kitchen', 'Tech']
const priceRanges = ['Under $25', '$25 – $50', '$50 – $100', 'Over $100']
const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'On Sale']

export default function EcommercePage() {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedSort, setSelectedSort] = useState('Newest')
  const [selectedPrice, setSelectedPrice] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('estore-unlocked')
    if (saved === 'true') setUnlocked(true)
  }, [])

  const handleUnlock = () => {
    if (input.toUpperCase() === SALE_CODE) {
      sessionStorage.setItem('estore-unlocked', 'true')
      setUnlocked(true)
    } else {
      setError('Invalid sale code')
    }
  }

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false
    if (selectedPrice === 'Under $25' && p.price >= 25) return false
    if (selectedPrice === '$25 – $50' && (p.price < 25 || p.price > 50)) return false
    if (selectedPrice === '$50 – $100' && (p.price < 50 || p.price > 100)) return false
    if (selectedPrice === 'Over $100' && p.price <= 100) return false
    return true
  }).sort((a, b) => {
    if (selectedSort === 'Price: Low to High') return a.price - b.price
    if (selectedSort === 'Price: High to Low') return b.price - a.price
    if (selectedSort === 'On Sale') return (b.badge === 'Sale' ? 1 : 0) - (a.badge === 'Sale' ? 1 : 0)
    return 0
  })

  if (!unlocked) {
    return (
      <main style={{
        minHeight: '100vh',
        background: '#080d1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '24px', fontWeight: '600', color: '#fff', margin: '0', letterSpacing: '-0.5px' }}>e-store</p>
          <p style={{ fontSize: '11px', color: '#3b82f6', margin: '6px 0 0', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Exclusive Access</p>
        </div>
        <p style={{ fontSize: '12px', color: '#4a6080', margin: '0', textAlign: 'center', maxWidth: '220px', lineHeight: 1.6 }}>Enter your sale code to unlock exclusive deals</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '260px' }}>
          <input
            type="text"
            placeholder="Enter sale code"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            style={{
              padding: '10px 14px',
              fontSize: '13px',
              background: '#0d1f3c',
              border: '0.5px solid #1a3a6a',
              borderRadius: '6px',
              color: '#fff',
              outline: 'none',
              letterSpacing: '0.05em',
            }}
          />
          {error && <p style={{ fontSize: '12px', color: '#ff4d6d', margin: '0' }}>{error}</p>}
          <button
            onClick={handleUnlock}
            style={{
              padding: '10px',
              fontSize: '12px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: '500',
            }}
          >
            Unlock
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={{ background: '#080d1a', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        borderBottom: '0.5px solid #0d1f3c',
      }}>
        <p style={{ fontSize: '15px', fontWeight: '600', margin: '0', color: '#fff', letterSpacing: '-0.3px' }}>e-store</p>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#4a6080', cursor: 'pointer' }}>🔍</span>
          <span style={{ fontSize: '14px', color: '#4a6080', cursor: 'pointer' }}>👤</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <span style={{ fontSize: '14px', color: '#4a6080' }}>🛒</span>
            <span style={{ fontSize: '10px', background: '#3b82f6', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>0</span>
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex' }}>

        <div style={{ width: '200px', minWidth: '200px', borderRight: '0.5px solid #0d1f3c', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 'calc(100vh - 57px)' }}>

          <div>
            <p style={{ fontSize: '10px', fontWeight: '600', color: '#3b82f6', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(cat => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setSelectedCategory(cat)}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '0.5px solid #1a3a6a', background: selectedCategory === cat ? '#3b82f6' : 'transparent', minWidth: '12px' }} />
                  <p style={{ fontSize: '12px', color: selectedCategory === cat ? '#fff' : '#4a6080', margin: '0' }}>{cat}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: '0.5px', background: '#0d1f3c' }} />

          <div>
            <p style={{ fontSize: '10px', fontWeight: '600', color: '#3b82f6', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price Range</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {priceRanges.map(range => (
                <div key={range} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setSelectedPrice(selectedPrice === range ? '' : range)}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '0.5px solid #1a3a6a', background: selectedPrice === range ? '#3b82f6' : 'transparent', minWidth: '12px' }} />
                  <p style={{ fontSize: '12px', color: selectedPrice === range ? '#fff' : '#4a6080', margin: '0' }}>{range}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: '0.5px', background: '#0d1f3c' }} />

          <div>
            <p style={{ fontSize: '10px', fontWeight: '600', color: '#3b82f6', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sort By</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sortOptions.map(sort => (
                <div key={sort} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setSelectedSort(sort)}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '0.5px solid #1a3a6a', background: selectedSort === sort ? '#3b82f6' : 'transparent', minWidth: '12px' }} />
                  <p style={{ fontSize: '12px', color: selectedSort === sort ? '#fff' : '#4a6080', margin: '0' }}>{sort}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div style={{ flex: 1, padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '13px', color: '#4a6080', margin: '0' }}>Showing {filteredProducts.length} products</p>
            <p style={{ fontSize: '12px', color: '#4a6080', margin: '0' }}>{selectedCategory}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '14px' }}>
            {filteredProducts.map(product => (
              <div key={product.id} style={{ cursor: 'pointer' }}>
                <div style={{ height: '150px', background: '#0d1f3c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', position: 'relative', border: '0.5px solid #1a3a6a' }}>
                  <p style={{ fontSize: '11px', color: '#2a4a7a', margin: '0' }}>Image</p>
                  {product.badge && (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      fontSize: '10px',
                      background: product.badge === 'Sale' ? '#e53935' : '#3b82f6',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '20px',
                    }}>{product.badge}</span>
                  )}
                </div>
                <p style={{ fontSize: '13px', fontWeight: '500', margin: '0 0 2px', color: '#fff' }}>{product.name}</p>
                <p style={{ fontSize: '11px', color: '#4a6080', margin: '0 0 5px' }}>{product.category}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: '500', margin: '0', color: '#ff4d6d' }}>${product.price.toFixed(2)}</p>
                  {product.originalPrice && (
                    <p style={{ fontSize: '11px', color: '#4a6080', margin: '0', textDecoration: 'line-through' }}>${product.originalPrice.toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <footer style={{ padding: '1.5rem 2rem', borderTop: '0.5px solid #0d1f3c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '13px', fontWeight: '600', margin: '0', color: '#fff' }}>e-store</p>
        <p style={{ fontSize: '12px', color: '#4a6080', margin: '0' }}>© 2026 e-store. All rights reserved.</p>
      </footer>

    </main>
  )
}