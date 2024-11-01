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
  const [showConsent, setShowConsent] = useState(true);
  const [userConsent, setUserConsent] = useState(false);
  const [savedArtworks, setSavedArtworks] = useState([]);
  const [pulseConsent, setPulseConsent] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isScrollButtonVisible, setIsScrollButtonVisible] = useState(false);

  useEffect(() => {
    scrollTo(0, 0);
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

  useEffect(() => {
    const consent = localStorage.getItem("userConsent");
    if (consent) {
      setUserConsent(consent === "true");
      setShowConsent(false);
    }
  }, []);

  const handleConsent = (consent) => {
    setUserConsent(consent);
    setShowConsent(false);
    localStorage.setItem("userConsent", consent);
  };

  const saveArtwork = (artwork) => {
    if (userConsent) {
      const isSaved = savedArtworks.some((saved) => saved.objectID === artwork.objectID);
      let updatedSavedArtworks;

      if (isSaved) {
        updatedSavedArtworks = savedArtworks.filter((saved) => saved.objectID !== artwork.objectID);
      } else {
        updatedSavedArtworks = [
          ...savedArtworks,
          {
            objectID: artwork.objectID,
            primaryImageSmall: artwork.primaryImageSmall,
            title: artwork.title,
            objectURL: artwork.objectURL,
            artistDisplayName: artwork.artistDisplayName || "Unknown Artist",
          },
        ];
      }

      setSavedArtworks(updatedSavedArtworks);
      localStorage.setItem("savedArtworks", JSON.stringify(updatedSavedArtworks));
    } else {
      setPulseConsent(true);
      setTimeout(() => {
        setPulseConsent(false);
      }, 1475);
    }
  };

  const toggleFavoritesModal = () => {
    setIsFavoritesModalOpen(!isFavoritesModalOpen);

    if (!isFavoritesModalOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  };

  const removeArtworkFromFavorites = (artworkID) => {
    const updatedSavedArtworks = savedArtworks.filter((artwork) => artwork.objectID !== artworkID);
    setSavedArtworks(updatedSavedArtworks);
    localStorage.setItem("savedArtworks", JSON.stringify(updatedSavedArtworks));
  };

  useEffect(() => {
    const savedArtworksFromStorage = localStorage.getItem("savedArtworks");
    if (savedArtworksFromStorage) {
      setSavedArtworks(JSON.parse(savedArtworksFromStorage));
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const artworkContainer = document.getElementById("artwork-container");
      if (artworkContainer) {
        const firstFourArtworks = artworkContainer.querySelectorAll("div:nth-child(-n+6)");
        if (firstFourArtworks.length > 0) {
          const fourthArtworkBottom = firstFourArtworks[3].getBoundingClientRect().bottom;
          setIsScrollButtonVisible(fourthArtworkBottom < 0);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div>
      {/* Introduction and Loading Section */}
      <div className="relative flex max-h-screen min-h-screen flex-col items-center justify-center p-2" id="intro">
        <div className="flex flex-col items-center gap-6 sm:gap-8 xl:gap-4">
          <img className="md:h-96" src="/hero.webp" alt="Art Intro" />
          <h1 className="text-center font-syne text-3xl font-black lg:text-4xl xl:text-5xl 2xl:text-6xl">Discover Random Artworks</h1>
          <div className="flex flex-wrap justify-center gap-2 md:w-2/3">
            <button
              className={`rounded border px-2 py-0.5 md:px-4 md:py-1 ${selectedDepartments.includes(0) ? "border-gray-700" : "border-gray-300 bg-gray-200 text-gray-800"}`}
              onClick={() => handleDepartmentChange(0)}
            >
              All
            </button>
            {departments.map((department) => (
              <button
                key={department.id}
                className={`rounded border px-2 py-0.5 md:px-4 md:py-1 ${selectedDepartments.includes(department.id) ? "border-gray-700" : "border-gray-300 bg-gray-200 text-gray-800"}`}
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
                className={`mx-5 my-20 flex flex-col items-center gap-4 md:mx-10 md:my-32 md:flex-row md:items-end md:gap-6 ${index % 2 === 0 ? "" : "bg-white md:flex-row-reverse md:items-end"}`}
              >
                <div className="relative">
                  {/* Save Artwork Button */}
                  <button className={`group absolute ${index % 2 === 0 ? "left-0" : "md:right-2"} top-2 ml-2 w-fit rounded bg-white p-1 active:scale-95`} onClick={() => saveArtwork(artwork)}>
                    <svg className={`h-5 ${savedArtworks.some((saved) => saved.objectID === artwork.objectID) ? "fill-black" : ""}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M5 6.2C5 5.07989 5 4.51984 5.21799 4.09202C5.40973 3.71569 5.71569 3.40973 6.09202 3.21799C6.51984 3 7.07989 3 8.2 3H15.8C16.9201 3 17.4802 3 17.908 3.21799C18.2843 3.40973 18.5903 3.71569 18.782 4.09202C19 4.51984 19 5.07989 19 6.2V21L12 16L5 21V6.2Z"
                        stroke="#000000"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {/* Image */}
                  <img src={artwork.primaryImageSmall} onClick={() => handleImageClick(artwork.primaryImage)} alt={artwork.title} className="aspect-auto h-full cursor-pointer" />
                </div>
                {/* Text */}
                <div className={`flex flex-col items-center justify-end text-center md:items-start ${index % 2 === 0 ? "md:text-start" : "md:items-end md:text-end"}`}>
                  {selectedDepartments.includes(0) && <p className="text-sm italic text-gray-600">{artwork.department}</p>}
                  <h2 className="font-syne text-xl md:text-2xl 2xl:text-3xl">{artwork.title}</h2>
                  <div className="w-fit">
                    <hr className="my-2 w-full" />
                    <h3 className="font-imperial text-2xl text-gray-800">{artwork.artistDisplayName || "Unknown Artist"}</h3>
                  </div>
                  <h4 className="text-sm text-gray-600 md:text-base">{artwork.objectDate || "Unknown Date"}</h4>
                  <div className="w-fit">
                    <hr className="my-2 w-full" />
                    <a className="font-syne text-sm" target="_blank" href={artwork.objectURL}>
                      ► Learn more
                    </a>
                  </div>
                </div>
              </div>
            ))
          : null}
      </div>

      {isModalOpen && <ImageViewer isOpen={isModalOpen} imageUrl={selectedImage} onClose={closeModal} />}

      {/* Floating Consent Div */}
      {showConsent && (
        <div className={`fixed bottom-4 right-4 z-0 ml-4 flex max-w-full flex-col gap-2 rounded border border-gray-300 bg-white p-4 md:max-w-fit ${pulseConsent ? "animate-bounce" : ""}`}>
          <p className="">Would you like us to remember the projects you like?</p>
          <div className="flex justify-between gap-2 text-center">
            <button onClick={() => handleConsent(true)} className="w-full rounded border border-gray-300 duration-150 hover:border-black">
              Yes
            </button>
            <button onClick={() => handleConsent(false)} className="w-full rounded border border-gray-300 duration-150 hover:border-black">
              No
            </button>
          </div>
        </div>
      )}

      {/* Favorite artworks button */}
      <div className="fixed bottom-4 right-4 z-30 flex gap-2">
        {userConsent && (
          <button
            className={`group rounded border-2 border-black bg-white p-1.5 duration-200 hover:border-black md:p-2 ${isFavoritesModalOpen ? "" : "md:border-gray-400"}`}
            onClick={toggleFavoritesModal}
          >
            {isFavoritesModalOpen ? (
              <svg className="h-5 rotate-90 transform duration-200 group-hover:fill-black sm:h-6 md:h-7 md:fill-gray-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" />
              </svg>
            ) : (
              <svg className="h-6 fill-black duration-200 sm:h-6 md:h-7 md:fill-gray-300 md:group-hover:fill-black" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg">
                <path d="M192,24H96A16.01833,16.01833,0,0,0,80,40V56H64A16.01833,16.01833,0,0,0,48,72V224a8.00026,8.00026,0,0,0,12.65039,6.50977l51.34277-36.67872,51.35743,36.67872A7.99952,7.99952,0,0,0,176,224V184.6897l19.35059,13.82007A7.99952,7.99952,0,0,0,208,192V40A16.01833,16.01833,0,0,0,192,24Zm0,152.45508-16-11.42676V72a16.01833,16.01833,0,0,0-16-16H96V40h96Z" />
              </svg>
            )}
          </button>
        )}
        {isScrollButtonVisible && (
          <button onClick={() => scrollTo(0, 0)} className="group rounded border-2 border-black bg-white p-1 duration-200 hover:border-black md:border-gray-400 md:p-2">
            <svg className="h-6 stroke-black duration-200 sm:h-6 md:h-7 md:stroke-gray-300 md:group-hover:stroke-black" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 18V2m0 0l7 7m-7-7L3 9" />
            </svg>
          </button>
        )}
      </div>

      {/* Favorites Modal */}
      {isFavoritesModalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-gray-800 bg-opacity-50 p-4 pb-[90px] md:py-8 md:pb-8">
          <div className="flex max-h-full w-full max-w-sm flex-col gap-4 overflow-y-auto rounded bg-white p-4 md:max-w-lg">
            <p>Favorite Artworks</p>
            <hr />
            {savedArtworks.length > 0 ? (
              savedArtworks.map((artwork) => (
                <div key={artwork.objectID} className="flex gap-2">
                  <div className="w-full rounded bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${artwork.primaryImageSmall}')` }}>
                    <div className="flex h-full w-full rounded bg-gray-200/30 p-2 backdrop-blur-sm md:p-4">
                      <div className="flex w-full flex-col gap-1 md:gap-2">
                        <h3 className="font-semibold">{artwork.title}</h3>
                        <p className="text-sm">{artwork.artistDisplayName}</p>
                        <a href={artwork.objectURL} target="_blank" rel="noopener noreferrer" className="flex w-fit items-end gap-1 rounded bg-white px-1">
                          <svg className="h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M10.0002 5H8.2002C7.08009 5 6.51962 5 6.0918 5.21799C5.71547 5.40973 5.40973 5.71547 5.21799 6.0918C5 6.51962 5 7.08009 5 8.2002V15.8002C5 16.9203 5 17.4801 5.21799 17.9079C5.40973 18.2842 5.71547 18.5905 6.0918 18.7822C6.5192 19 7.07899 19 8.19691 19H15.8031C16.921 19 17.48 19 17.9074 18.7822C18.2837 18.5905 18.5905 18.2839 18.7822 17.9076C19 17.4802 19 16.921 19 15.8031V14M20 9V4M20 4H15M20 4L13 11"
                              stroke="#000000"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                          <p>Learn more</p>
                        </a>
                      </div>
                      <button onClick={() => removeArtworkFromFavorites(artwork.objectID)} className="flex p-2 hover:underline">
                        <svg fill="#000000" className="h-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <g>
                            <path d="M17.6,21.938a1.482,1.482,0,0,1-1.011-.4l-4.251-3.9a.5.5,0,0,0-.678,0L7.41,21.538a1.5,1.5,0,0,1-2.517-1.1V4.563a2.5,2.5,0,0,1,2.5-2.5h9.214a2.5,2.5,0,0,1,2.5,2.5V20.435a1.483,1.483,0,0,1-.9,1.375A1.526,1.526,0,0,1,17.6,21.938ZM12,16.5a1.5,1.5,0,0,1,1.018.395L17.269,20.8a.5.5,0,0,0,.838-.368V4.563a1.5,1.5,0,0,0-1.5-1.5H7.393a1.5,1.5,0,0,0-1.5,1.5V20.435a.5.5,0,0,0,.839.368L10.983,16.9A1.5,1.5,0,0,1,12,16.5Z" />
                            <path d="M10.23,10.84a.5.5,0,0,0,.71.71L12,10.491,13.06,11.55a.523.523,0,0,0,.71,0,.513.513,0,0,0,0-.71L12.709,9.779,13.77,8.72a.5.5,0,0,0-.71-.71c-.35.35-.7.71-1.06,1.06L10.94,8.01a.5.5,0,0,0-.71,0,.524.524,0,0,0,0,.71c.35.35.71.7,1.06,1.06Z" />
                          </g>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No favorite artworks yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
