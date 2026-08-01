import React from "react";
import ReactDOM from "react-dom/client";
import CRM from "./App.jsx";
import CaptureForm from "./CaptureForm.jsx";

const isCapturePage = window.location.pathname.startsWith("/capture");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isCapturePage ? <CaptureForm /> : <CRM />}
  </React.StrictMode>
);
