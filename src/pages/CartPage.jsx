import { useNavigate } from "react-router-dom";
import Cart from "../components/Cart";

export default function CartPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Cart onCheckout={() => navigate("/checkout")} />
    </div>
  );
}
