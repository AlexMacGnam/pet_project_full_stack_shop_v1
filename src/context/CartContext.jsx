import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getCart,
  addToCart as apiAddToCart,
  mergeCart,
  updateCartItem,
  removeCartItem,
  clearCart as apiClearCart,
} from "../api/cart.js";

const CartContext = createContext();

/** 
Reads cart items from localStorage by the given key. 
 */
function getLocalCart(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

/** 
 Checks if a user is logged in 
 Returns cart_{userId} for logged-in users and cart_guest for guests.
 */
function getInitialKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user ? `cart_${user.id}` : "cart_guest";
  } catch {
    return "cart_guest";
  }
}

export function CartProvider({ children }) {
  const [cartKey, setCartKey] = useState(getInitialKey);
  const [cart, setCart] = useState(() => getLocalCart(getInitialKey()));
  const [cartId, setCartId] = useState(null);

  const isGuest = cartKey === "cart_guest";

  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey]);

  useEffect(() => {
    if (!isGuest) {
      getCart()
        .then((serverCart) => {
          setCart(serverCart.items);
          setCartId(serverCart.id);
        })
        .catch(() => {});
    }
  }, []);

  function switchToUser(userId) {
    if (userId) {
      const key = `cart_${userId}`;
      setCartKey(key);
      const guestCart = getLocalCart("cart_guest");

      getCart()
        .then((serverCart) => {
          return mergeCart(guestCart);
        })
        .then((updatedCart) => {
          setCart(updatedCart.items);
          setCartId(updatedCart.id);
          localStorage.removeItem("cart_guest");
        })
        .catch(() => setCart([]));
    } else {
      setCartKey("cart_guest");
      setCart(getLocalCart("cart_guest"));
    }
  }

  function addToCart(product) {
    const prev = cart;
    const existing = cart.find((item) => item.productId === product.id);

    if (!existing && cart.length >= 10) {
      toast.error("Your cart is full", { id: "cart-toast" });
      return;
    }

    if (existing) {
      setCart([
        { ...existing, quantity: existing.quantity + 1 },
        ...cart.filter((item) => item.productId !== product.id),
      ]);
    } else {
      setCart([
        {
          productId: product.id,
          name: product.name,
          code: product.code,
          image: product.medias?.[0] ?? product.image ?? null,
          priceSnapshot: product.price,
          quantity: 1,
        },
        ...cart,
      ]);
    }

    toast.success(`${product.name} added to cart`, { id: "cart-toast" });

    if (!isGuest) {
      apiAddToCart(product.id, 1)
        .then((serverCart) => setCart(serverCart.items))
        .catch((err) => {
          setCart(prev);
          toast.error(err.message || "Failed to add item", {
            id: "cart-toast",
          });
        });
    }
  }

  function removeFromCart(productId) {
    const prev = cart;
    setCart(cart.filter((item) => item.productId !== productId));
    toast.error("Item removed from cart", { id: "cart-toast" });

    if (!isGuest) {
      removeCartItem(productId)
        .then((serverCart) => setCart(serverCart.items))
        .catch(() => setCart(prev));
    }
  }

  function changeQuantity(productId, delta) {
    const prev = cart;
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((i) =>
        i.productId === productId ? { ...i, quantity: newQty } : i
      )
    );

    if (!isGuest) {
      updateCartItem(productId, newQty)
        .then((serverCart) => setCart(serverCart.items))
        .catch((err) => {
          setCart(prev);
          toast.error(err.message || "Failed to update quantity", {
            id: "cart-toast",
          });
        });
    }
  }

  function clearCart() {
    const prev = cart;
    setCart([]);

    if (!isGuest) {
      apiClearCart().catch(() => setCart(prev));
    }
  }

  const totalPrice = cart.reduce(
    (sum, item) => sum + (item.priceSnapshot ?? item.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartId,
        addToCart,
        removeFromCart,
        changeQuantity,
        clearCart,
        switchToUser,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
