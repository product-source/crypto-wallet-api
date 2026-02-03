import React, { forwardRef, useEffect } from "react";
import "./Invoice.css";
import Logo from "./logo.png";
import { trimAddress, formatNumber } from "../../helper/helper";

const Invoice = forwardRef((props, ref) => {
  const sellerName = "COINPERA PRIVATE LIMITED";

  useEffect(() => {}, [props.details]);

  return (
    <div className="invoice-wrapper">
      <div className="invoice" ref={ref}>
        <div className="invoice-container">
          <div className="invoice-head">
            <div className="invoice-head-top">
              <div className="invoice-head-top-left text-start">
                <h3>TAX INVOICE</h3>
              </div>
              <div className="invoice-head-top-right text-end">
                <h3>ORIGINAL FOR RECIPIENT</h3>
              </div>
            </div>
            <div
              className="Title-head-top-right text-start"
              style={{ marginBottom: "2rem" }}
            >
              <h3>{sellerName}</h3>
              <img src={Logo} alt="logo" style={{ height: "50px" }} />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                // marginBottom: "2rem",
              }}
            >
              <div>
                <h5>
                  Invoice #:{" "}
                  <b
                    style={{
                      fontSize: "18px",
                    }}
                  >
                    {props?.details?.invoice_no}{" "}
                  </b>
                </h5>
              </div>

              <div className="box">
                <h2>
                  Invoice Date: <b id="invoice-date">{props?.details?.date}</b>
                </h2>
              </div>
            </div>
            <div className="container text-start">
              <div className="box">
                <h3>
                  <span>Merchant Id: </span>
                  <span>{props?.details?.merchant_id}</span>
                </h3>
                <h3>
                  <span>Merchant Name:</span>{" "}
                  <span>{props?.details?.merchant_name}</span>
                </h3>

                <h3>
                  <span>Sender Address:</span>{" "}
                  <span>{props?.details?.sender_address}</span>
                </h3>
                <h3>
                  <span>Receiver Address: </span>
                  <span>{props?.details?.receiver_address}</span>
                </h3>
              </div>
              <div className="box">
                <h3>
                  <span>App Id:</span> <span>{props?.details?.app_id}</span>
                </h3>
                <h3>
                  <span>App Name:</span> <span>{props?.details?.app_name}</span>
                </h3>

                <h3>
                  <span>Email: </span>
                  <span>{props?.details?.email}</span>
                </h3>
              </div>
            </div>

            <br />
          </div>

          <div className="overflow-view">
            <div className="invoice-body">
              <table>
                <thead>
                  <tr>
                    <th className="text-bold">#</th>
                    <th className="text-bold">Coin</th>
                    <th className="text-bold">Chain Id</th>
                    <th className="text-bold">Tx. Id</th>
                    <th className="text-bold">Amount</th>
                    <th className="text-bold">Platform Fee</th>
                    <th className="text-bold">Taxable Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-start-item">1</td>
                    <td className="text-start-item">
                      <b> {props?.details?.token_name} </b>
                      <br />
                    </td>
                    <td className="text-start-item">
                      {props?.details?.chainId}
                    </td>
                    <td className="text-start-item">
                      <a
                        href={props?.details?.explorerURL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {trimAddress(props?.details?.hash, 4, 6)}
                        {/* {props?.details?.hash} */}
                      </a>
                    </td>
                    <td className="text-start-item">
                      {formatNumber(props?.details?.value, 8)}{" "}
                      {props?.details?.token_name}
                    </td>
                    <td className="text-start-item">
                      {props?.details?.platform_fee} %
                    </td>
                    <td className="text-start-item">
                      {formatNumber(props?.details.adminCharges, 8)}{" "}
                      {props?.details?.token_name}
                    </td>
                  </tr>
                </tbody>
              </table>

              <br />
              <br />

              <div className="hr"></div>

              <div className="invoice-body-bottom">
                <div className="invoice-body-info-item">
                  <div className="info-item-td text-end text-bold">Total</div>
                  <div className="info-item-td text-end text-bold">
                    {formatNumber(props?.details?.value, 8)}{" "}
                    {props?.details?.token_name}
                  </div>
                </div>
                <div className="invoice-body-info-item">
                  <div className="info-item-td text-end text-bold">
                    Taxable Amount
                  </div>
                  <div className="info-item-td text-end text-bold">
                    {formatNumber(props?.details.adminCharges, 8)}{" "}
                    {props?.details?.token_name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-body-bottom">
            <div className="invoice-body-info-item">
              <div className="info-item-td text-end text-bold">
                Amount Payable:
              </div>
              <div className="info-item-td text-end text-bold">
                {formatNumber(props?.details?.withdrawAmount, 8)}{" "}
                {props?.details?.token_name}
              </div>
            </div>
          </div>

          <div className="Term-Condition">
            <p style={{ fontWeight: "bold", marginTop: "1rem" }}>
              Declaration: This invoice is computer-generated and does not
              require a signature.
            </p>
            <h1 style={{ fontWeight: "bold" }}>Notes:</h1>
            <ul>
              <li>
                1. Withdrawals will be processed only if they meet the minimum
                limit specified.
              </li>

              <li>
                2. Any complaints regarding invoices must be raised within 7
                days after the issue has been resolved by the gateway provider.
              </li>

              <li>
                3. A platform fee of {props?.details?.platform_fee} % will be
                applied to each withdrawal.
              </li>

              <li>
                4. All details provided in the invoice are verified by the
                gateway.
              </li>

              <li>
                5. While funds are securely transferred to the respective user
                or merchant, the provider does not guarantee complete protection
                against fraudulent activities.
              </li>
            </ul>
            <p
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Thank you for doing business with us! We believe success is
              spelled with your support and partnership.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Invoice;
