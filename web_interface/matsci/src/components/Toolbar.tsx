import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import "../style/Toolbar.css";

interface ToolbarProps {
  setPdfScaleValue: (value: number) => void;
  currentPage: number;
  totalPages: number;
}

const Toolbar = ({ setPdfScaleValue, currentPage, totalPages }: ToolbarProps) => {
  const [zoom, setZoom] = useState<number | null>(null);
  const navigate = useNavigate();

  const zoomIn = () => {
    if (zoom) {
      if (zoom < 4) {
        setPdfScaleValue(zoom + 0.1);
        setZoom(zoom + 0.1);
      }
    } else {
      setPdfScaleValue(1);
      setZoom(1);
    }
  };

  const zoomOut = () => {
    if (zoom) {
      if (zoom > 0.2) {
        setPdfScaleValue(zoom - 0.1);
        setZoom(zoom - 0.1);
      }
    } else {
      setPdfScaleValue(1);
      setZoom(1);
    }
  };

  const goToHomePage = () => {
    navigate("/");
  };

  return (
    <div className="Toolbar">
      <IconButton onClick={goToHomePage} className="HomeButton">
        <HomeIcon />
      </IconButton>
      <div className="PageNumber">
        Page {currentPage} / {totalPages}
      </div>
      <div className="ZoomControls">
        <button onClick={zoomOut}>-</button>
        <button onClick={zoomIn}>+</button>
        {zoom ? `${(zoom * 100).toFixed(0)}%` : "Auto"}
      </div>
    </div>
  );
};

export default Toolbar;
