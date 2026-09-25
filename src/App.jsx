import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Footer from "./components/Footer";

import Home from "./pages/Home";

function Top() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <Top />

      <Routes>
        <Route path="*" element={<Home />} />
      </Routes>

      <Footer />
    </>
  );
}