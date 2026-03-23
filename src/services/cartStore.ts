import { persistentAtom } from '@nanostores/persistent'

export interface CartItem {
  id: string; // combination of product slug and variant id
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  brand?: string;
}

export const cartItems = persistentAtom<CartItem[]>('cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse
});

export function addItem(item: Omit<CartItem, 'quantity'>) {
  const currentItems = cartItems.get();
  const existingItemIndex = currentItems.findIndex(i => i.id === item.id);

  if (existingItemIndex > -1) {
    const updatedItems = [...currentItems];
    updatedItems[existingItemIndex].quantity += 1;
    cartItems.set(updatedItems);
  } else {
    cartItems.set([...currentItems, { ...item, quantity: 1 }]);
  }
}

export function removeItem(itemId: string) {
  cartItems.set(cartItems.get().filter(i => i.id !== itemId));
}

export function updateQuantity(itemId: string, quantity: number) {
  if (quantity <= 0) {
    removeItem(itemId);
    return;
  }
  
  const currentItems = cartItems.get();
  const updatedItems = currentItems.map(item => 
    item.id === itemId ? { ...item, quantity } : item
  );
  cartItems.set(updatedItems);
}

export function clearCart() {
  cartItems.set([]);
}

export function getCartTotal() {
  return cartItems.get().reduce((total, item) => total + (item.price * item.quantity), 0);
}

export function getCartCount() {
  return cartItems.get().reduce((count, item) => count + item.quantity, 0);
}
