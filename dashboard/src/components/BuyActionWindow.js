import React, { useState, useContext } from "react";
import api, { FRONTEND_URL } from "./api";

import GeneralContext from "./GeneralContext";

import "./BuyActionWindow.css";

const BuyActionWindow = ({ uid }) => {
  const generalContext = useContext(GeneralContext);
  const [formData, setFormData] = useState({
    qty: "",
    price: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBuyClick = async () => {
    const { qty, price } = formData;

    if (!qty || !price) {
      alert("Please enter quantity and price");
      return;
    }

    try {
      console.log("Sending order data:", {
        name: uid,
        qty: parseInt(qty),
        price: parseFloat(price),
        mode: "BUY",
      });

      const response = await api.post("/newOrder", {
        name: uid,
        qty: parseInt(qty),
        price: parseFloat(price),
        mode: "BUY",
      });

      console.log("Order response:", response);
      alert("Buy order placed successfully!");
      generalContext.refreshHoldings();
      generalContext.closeBuyWindow();
      // Reset form
      setFormData({ qty: "", price: "" });
    } catch (error) {
      console.error("Error placing order:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);

      if (error.response?.status === 401) {
        alert("Authentication failed. Please login again.");
        window.location.href = `${FRONTEND_URL}/login`;
      } else {
        alert(
          `Error placing order: ${error.response?.data?.error || error.message}`
        );
      }
    }
  };

  const handleCancelClick = () => {
    generalContext.closeBuyWindow();
  };

  return (
    <div className="containerClass" id="buy-window" draggable="true">
      <div className="regular-order">
        <div className="inputs">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              name="qty"
              value={formData.qty}
              onChange={handleInputChange}
              placeholder="0"
            />
          </fieldset>
          <fieldset>
            <legend>Price</legend>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.05"
              placeholder="0.00"
            />
          </fieldset>
        </div>
      </div>

      <div className="buttons">
        <span>Margin required ₹140.65</span>
        <div>
          <button className="btn btn-blue" onClick={handleBuyClick}>
            Buy
          </button>
          <button className="btn btn-grey" onClick={handleCancelClick}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;
