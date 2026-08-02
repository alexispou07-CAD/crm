import React from "react";
import ReactDOM from "react-dom/client";
import CRM from "./App.jsx";
import CaptureForm from "./CaptureForm.jsx";

const path = window.location.pathname;

let page;
if (path.startsWith("/capture/estimation")) page = <CaptureForm variant="estimation" />;
else if (path.startsWith("/capture/location")) page = <CaptureForm variant="location" />;
else if (path.startsWith("/capture")) page = <CaptureForm variant="default" />;
else page = <CRM />;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {page}
  </React.StrictMode>
);
