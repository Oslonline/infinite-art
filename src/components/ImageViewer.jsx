import { useEffect, useState } from "react";

const ImageViewer = ({ isOpen, imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState("50% 50%");

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  const handleClose = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const zoomIn = (cursorX, cursorY) => {
    setScale((prevScale) => {
      const newScale = Math.min(prevScale + 0.2, 5);
      updateTransformOrigin(cursorX, cursorY, newScale);
      return newScale;
    });
  };

  const zoomOut = (cursorX, cursorY) => {
    setScale((prevScale) => {
      if (prevScale >= 4) {
        return 1; // Reset scale if at max zoom
      }
      const newScale = Math.max(prevScale - 0.5, 1);
      updateTransformOrigin(cursorX, cursorY, newScale);
      return newScale;
    });
  };

  const updateTransformOrigin = (cursorX, cursorY, scale) => {
    const img = document.querySelector(".modal-image");
    if (img) {
      const rect = img.getBoundingClientRect();
      const originX = ((cursorX - rect.left) / rect.width) * 100;
      const originY = ((cursorY - rect.top) / rect.height) * 100;
      setTransformOrigin(`${originX}% ${originY}%`);
    }
  };

  const handleMouseClick = (event) => {
    if (isCtrlPressed) {
      event.preventDefault();
    }

    const cursorX = event.clientX;
    const cursorY = event.clientY;

    if (isCtrlPressed && event.button === 0) {
      zoomOut(cursorX, cursorY);
    } else {
      if (scale >= 4) {
        zoomOut(cursorX, cursorY);
      } else {
        zoomIn(cursorX, cursorY);
      }
    }
  };

  const handleKeyDown = (event) => {
    if (event.ctrlKey) {
      setIsCtrlPressed(true);
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === "Control") {
      setIsCtrlPressed(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-2" onClick={handleClose}>
      <button onClick={onClose} className="absolute right-0 top-0 z-10 p-2 text-white">
        <svg className="" strokeWidth="3px" width="40px" height="40px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#FFFFFF">
          <line x1="20" y1="20" x2="44" y2="44" />
          <line x1="44" y1="20" x2="20" y2="44" />
          <rect x="8" y="8" width="48" height="48" />
        </svg>
      </button>
      <div className="relative">
        <img
          src={imageUrl}
          alt="Full view"
          className="modal-image max-h-screen max-w-full transition-transform"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: transformOrigin,
            cursor: scale > 1 && isCtrlPressed ? "zoom-out" : scale >= 4 ? "zoom-out" : "zoom-in",
          }}
          onClick={handleMouseClick}
        />
      </div>
    </div>
  );
};

export default ImageViewer;
