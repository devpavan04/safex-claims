import React, { Component } from "react";
import { Link } from "react-router-dom";

export default class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <>
        <nav className="navbar navbar-expand-sm navbar-dark bg-primary">
          <div className="container">
            <Link
              to="/"
              className="navbar-brand ml-2"
              style={{ fontSize: "1rem", fontWeight: "normal", letterSpacing: "0.2rem" }}
            >
              Safex Claims
            </Link>
            <button className="navbar-toggler" data-toggle="collapse" data-target="#navbarNav">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div id="navbarNav" className="collapse navbar-collapse">
              <ul
                style={{ fontSize: "0.8rem", letterSpacing: "0.2rem", fontWeight: "normal" }}
                className="navbar-nav ml-auto"
              >
                <li className="nav-item">
                  <Link to="/" className="nav-link">
                    Safex
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/my-account" className="nav-link">
                    My Account
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/create-plan" className="nav-link">
                    Create Plan
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/create-claim" className="nav-link">
                    Create Claim
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/submit-evidence" className="nav-link">
                    Submit Evidence
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/funds" className="nav-link">
                    Funds
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/plans" className="nav-link">
                    Plans
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/claims" className="nav-link">
                    Claims
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </>
    );
  }
}
