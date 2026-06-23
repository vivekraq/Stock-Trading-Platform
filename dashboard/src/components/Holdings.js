import React, { useState, useEffect, useContext } from "react";
import api, { FRONTEND_URL } from "./api";
import GeneralContext from "./GeneralContext";
import AuthContext from "./AuthContext";
//import { holdings } from "../data/data";

const Holdings = () => {
  const [allHoldings, setAllHoldings] = useState([]);
  const generalContext = useContext(GeneralContext);
  const authContext = useContext(AuthContext);

  useEffect(() => {
    // Only fetch holdings if user is authenticated
    if (authContext.isAuthenticated) {
      api
        .get("/allHoldings")
        .then((res) => {
          setAllHoldings(res.data);
        })
        .catch((error) => {
          console.error("Error fetching holdings:", error);
          // Error is handled by the interceptor
        });
    }
  }, [generalContext.holdingsRefreshTrigger, authContext.isAuthenticated]);
  // If not authenticated, show login message
  if (!authContext.isAuthenticated) {
    return (
      <div className="holdings-login-message">
        <h3 className="title">Holdings</h3>
        <p>Please log in to view your holdings.</p>
        <a href={`${FRONTEND_URL}/login`} className="btn btn-primary">
          Login
        </a>
      </div>
    );
  }

  return (
    <>
      <h3 className="title">Holdings ({allHoldings.length})</h3>

      <div className="order-table">
        <table>
          <tr>
            <th>Instrument</th>
            <th>Qty.</th>
            <th>Avg. cost</th>
            <th>LTP</th>
            <th>Cur. val</th>
            <th>P&L</th>
            <th>Net chg.</th>
            <th>Day chg.</th>
          </tr>

          {allHoldings.map((stock, index) => {
            const curValue = stock.price * stock.qty;
            const isProfit = curValue - stock.avg * stock.qty >= 0.0;
            const profClass = isProfit ? "profit" : "loss";
            const dayClass = stock.isLoss ? "loss" : "profit";

            return (
              <tr key={index}>
                <td>{stock.name}</td>
                <td>{stock.qty}</td>
                <td>{stock.avg.toFixed(2)}</td>
                <td>{stock.price.toFixed(2)}</td>
                <td>{curValue.toFixed(2)}</td>
                <td className={profClass}>
                  {(curValue - stock.avg * stock.qty).toFixed(2)}
                </td>
                <td className={profClass}>{stock.net}</td>
                <td className={dayClass}>{stock.day}</td>
              </tr>
            );
          })}
        </table>
      </div>

      <div className="row">
        <div className="col">
          <h5>
            29,875.<span>55</span>{" "}
          </h5>
          <p>Total investment</p>
        </div>
        <div className="col">
          <h5>
            31,428.<span>95</span>{" "}
          </h5>
          <p>Current value</p>
        </div>
        <div className="col">
          <h5>1,553.40 (+5.20%)</h5>
          <p>P&L</p>
        </div>
      </div>
    </>
  );
};

export default Holdings;
