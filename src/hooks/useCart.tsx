import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const stockProduct: Stock = await (await api.get(`stock/${productId}`)).data

      const filteredCart = cart.filter(product => product.id === productId)

      if ( filteredCart.length > 0 ) {
        const productCartAmount = filteredCart[0].amount;

        if (productCartAmount === stockProduct.amount) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }

        const cartUpdated = cart.map(product => {
          
          if ( product.id === productId ) {
            product.amount += 1
          }

          return product
        })

        setCart(cartUpdated)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))

      } else {
        const product = await (await api.get(`products/${productId}`)).data

        setCart([
          ...cart,
          {
            ...product,
            amount: 1
          }
        ])

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, { ...product, amount: 1}]))
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartUpdated = cart.filter(product => product.id !== productId)

      if (cartUpdated.length < cart.length) {

        setCart([...cartUpdated])
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))

      } else {
        throw Error()
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return

      const stockProduct: Stock = await (await api.get(`stock/${productId}`)).data

      if (amount <= stockProduct.amount) {
        const cartUpdated = cart.map(product => {
          
          if ( product.id === productId ) {
            product.amount = amount
          }

          return product
        })

        setCart(cartUpdated)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))

      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
