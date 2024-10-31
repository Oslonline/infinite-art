import React, { useEffect, useState, useRef } from "react";
import ImageViewer from "./components/ImageViewer.jsx";

const departments = [
  { id: 6, name: "Asian Art" },
  { id: 10, name: "Egyptian Art" },
  { id: 11, name: "European Paintings" },
  { id: 13, name: "Greek and Roman Art" },
  { id: 14, name: "Islamic Art" },
  { id: 19, name: "Photographs" },
];

const App = () => {
  const [artworks, setArtworks] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([0]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [showArtworks, setShowArtworks] = useState(false);
  const [allWantedObjects, setAllWantedObjects] = useState([]);
  const loadMoreRef = useRef(false);
  const firstArtworkRef = useRef(null);

  useEffect(() => {
    const fetchAllWantedObjects = async () => {
      try {
        const cachedData = localStorage.getItem("allWantedObjects");
        if (cachedData) {
          setAllWantedObjects(JSON.parse(cachedData));
          return;
        }

        const response = await fetch("/all_wanted_objects.json");
        const data = await response.json();
        setAllWantedObjects(data);

        localStorage.setItem("allWantedObjects", JSON.stringify(data));
      } catch (error) {
        console.error("Error loading all_wanted_objects.json:", error);
      }
    };

    setLoading(true);
    fetchAllWantedObjects();
  }, []);

  useEffect(() => {
    if (allWantedObjects.length > 0) {
      fetchArtworks(true);
    }
  }, [allWantedObjects]);

  const getFilteredObjectIDs = () => {
    const filteredIDs = selectedDepartments.includes(0)
      ? allWantedObjects.map((obj) => obj.objectID)
      : allWantedObjects.filter((obj) => selectedDepartments.includes(obj.departmentId)).map((obj) => obj.objectID);

    return filteredIDs;
  };

  const fetchArtworks = async (isInitial = false) => {
    setLoading(isInitial);
    const artworksData = [];
    const filteredIDs = getFilteredObjectIDs();

    while (artworksData.length < 4 && filteredIDs.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredIDs.length);
      const randomID = filteredIDs[randomIndex];

      const artworkResponse = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${randomID}`);
      const artwork = await artworkResponse.json();

      if (artwork.primaryImage && artwork.isPublicDomain) {
        artworksData.push(artwork);
      }
    }

    setArtworks((prevArtworks) => [...prevArtworks, ...artworksData.slice(0, 4)]);
    setShowArtworks(true);
    setLoading(false);
    loadMoreRef.current = false;
  };

  const handleDepartmentChange = (id) => {
    const newSelectedDepartments = id === 0 ? [0] : [id];
    setSelectedDepartments(newSelectedDepartments);
    setArtworks([]);
    setShowArtworks(false);
    setLoading(true);
    fetchArtworks(true);
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage("");
  };

  useEffect(() => {
    const handleScroll = () => {
      if (loadMoreRef.current || loading) return;

      const lastGroupIndex = artworks.length - 4;
      const lastGroupArtworks = document.querySelectorAll(`#artwork-container div:nth-child(n+${lastGroupIndex + 1}):nth-child(-n+${artworks.length})`);
      if (lastGroupArtworks.length < 2) return;

      const lastGroupCenter = lastGroupArtworks[1].getBoundingClientRect().top;
      if (lastGroupCenter < window.innerHeight / 2) {
        loadMoreRef.current = true;
        fetchArtworks();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [artworks, loading]);

  const handleScrollToFirstArtwork = () => {
    if (firstArtworkRef.current) {
      firstArtworkRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div>
      {/* Introduction and Loading Section */}
      <div className="relative flex max-h-screen min-h-screen flex-col items-center justify-center p-2" id="intro">
        <div className="flex flex-col items-center gap-6 sm:gap-8 xl:gap-4">
          <img className="md:h-96" src="/hero.webp" alt="Art Intro" />
          <h1 className="text-center font-syne text-3xl font-black lg:text-4xl xl:text-5xl 2xl:text-6xl">Discover Random Artworks</h1>
          <div className="flex flex-wrap justify-center gap-2 md:w-2/3">
            <button
              className={`rounded border px-2 py-0.5 md:px-4 md:py-1 ${selectedDepartments.includes(0) ? "border-gray-700" : "border-gray-300 bg-gray-200"}`}
              onClick={() => handleDepartmentChange(0)}
            >
              All
            </button>
            {departments.map((department) => (
              <button
                key={department.id}
                className={`rounded border px-2 py-0.5 md:px-4 md:py-1 ${selectedDepartments.includes(department.id) ? "border-gray-700" : "border-gray-300 bg-gray-200"}`}
                onClick={() => handleDepartmentChange(department.id)}
              >
                {department.name}
              </button>
            ))}
          </div>
          <div className="mt-6 md:mt-8 lg:mt-10">
            {loading ? (
              <svg className="animate-spin" width="30px" height="30px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none">
                <g fill="#000000" fillRule="evenodd" clipRule="evenodd">
                  <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" opacity=".2" />
                  <path d="M7.25.75A.75.75 0 018 0a8 8 0 018 8 .75.75 0 01-1.5 0A6.5 6.5 0 008 1.5a.75.75 0 01-.75-.75z" />
                </g>
              </svg>
            ) : (
              <svg width="30px" height="30px" viewBox="0 -5 24 24" version="1.1" onClick={handleScrollToFirstArtwork} style={{ cursor: "pointer" }}>
                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                  <g transform="translate(-572.000000, -1200.000000)" fill="#000000">
                    <path d="M595.688,1200.28 C595.295,1199.89 594.659,1199.89 594.268,1200.28 L583.984,1211.57 L573.702,1200.28 C573.31,1199.89 572.674,1199.89 572.282,1200.28 C571.89,1200.68 571.89,1201.32 572.282,1201.71 L583.225,1213.72 C583.434,1213.93 583.711,1214.02 583.984,1214 C584.258,1214.02 584.535,1213.93 584.745,1213.72 L595.688,1201.71 C596.079,1201.32 596.079,1200.68 595.688,1200.28"></path>
                  </g>
                </g>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Artworks Section */}
      <div className="flex flex-col" id="artwork-container">
        {showArtworks && artworks.length > 0
          ? artworks.map((artwork, index) => (
              <div
                key={artwork.objectID}
                ref={index === 0 ? firstArtworkRef : null}
                className={`flex flex-col gap-4 px-5 py-20 md:flex-row md:gap-6 md:px-10 md:py-32 ${index % 2 === 0 ? "" : "items-end bg-white md:flex-row-reverse"}`}
              >
                <img src={artwork.primaryImageSmall} onClick={() => handleImageClick(artwork.primaryImage)} alt={artwork.title} className="aspect-auto max-h-80 cursor-pointer md:max-h-96" />
                <div className={`flex flex-col justify-end ${index % 2 === 0 ? "text-start" : "items-end text-end"}`}>
                  {selectedDepartments.includes(0) && <p className="text-sm italic text-gray-600">{artwork.department}</p>}
                  <h2 className="font-syne text-xl md:text-2xl lg:text-3xl">{artwork.title}</h2>
                  <div className="w-fit">
                    <hr className="my-2 w-full" />
                    <h3 className="font-imperial text-2xl text-gray-800">{artwork.artistDisplayName || "Unknown Artist"}</h3>
                  </div>
                  <h4 className="text-sm text-gray-600 md:text-base">{artwork.objectDate || "Unknown Date"}</h4>
                  <div className="w-fit">
                    <hr className="my-2 w-full" />
                    <a className="font-syne text-sm" target="_blank" href={artwork.objectURL}>
                      {`${index % 2 === 0 ? "► " : ""}Learn more${index % 2 === 0 ? "" : " ►"}`}
                    </a>
                  </div>
                </div>
              </div>
            ))
          : null}
      </div>

      {isModalOpen && <ImageViewer isOpen={isModalOpen} imageUrl={selectedImage} onClose={closeModal} />}
    </div>
  );
};

export default App;
