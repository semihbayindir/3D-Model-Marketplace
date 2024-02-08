    import React, { useState, useEffect, useRef } from "react";
    import { useRouter } from "next/router";
    import axios from "axios";
    import Spinner from "./Spinner";
    import { ReactSortable } from "react-sortablejs";
    import { Helmet } from "react-helmet";
    import Popup from "reactjs-popup";
    import { HashLoader } from "react-spinners";

    export default function ProductForm({
      _id,
      title: existingTitle,
      description: existingDescription,
      price: existingPrice,
      images: existingImages,
      modelURL: existingModelURL,
      category: assignedCategory,
      modelFileName: existingModelFileName,
    }) {
      const [title, setTitle] = useState(existingTitle || "");
      const [description, setDescription] = useState(existingDescription || "");
      const [selectedModel, setSelectedModel] = useState(""); // selectedModel'ı tanımla
      const [price, setPrice] = useState(existingPrice || "");
      const [images, setImages] = useState(existingImages|| []);
      const [modelFileName, setModelFileName] = useState(existingModelFileName || []);
      const [modelURL, setModelURL] = useState(existingModelURL || []);
      const [category, setCategory] = useState(assignedCategory || '');
      const [categories, setCategories] = useState([]);
      const [goToProducts, setGoToProducts] = useState(false);
      const [isUploading, setIsUploading] = useState(false);
      const router = useRouter();
      const { uploadImageToS3 } = require('../pages/api/aws.js');
      const [popupIsOpen, setPopupIsOpen] = useState(false);
      const [buttonDisable, setButtonDisable] = useState(true);
      const [viewerDimensions, setViewerDimensions] = useState({ width: '100%', height: '100%' });
      const modelViewer = document.querySelector('model-viewer');


      const openPopup = () => {
        const modelViewer = document.querySelector('model-viewer');
        if (modelViewer) {
          setViewerDimensions({ width: '1080px', height: '1080px' });
          setPopupIsOpen(true);
        }
      };
      
      const closePopup = () => {
        const modelViewer = document.querySelector('model-viewer');
        if (modelViewer) {
          setViewerDimensions({ width: '100%', height: '100%' });
          setPopupIsOpen(false);
        }
      };
      

  useEffect(() => {
    let popupTimeout;

    if (popupIsOpen) {
      // Eğer popup açıldıysa
      popupTimeout = setTimeout(() => {
        closePopup(); // 30 saniye sonra popup'ı otomatik olarak kapat
      }, 30000);
    }

    return () => {
      clearTimeout(popupTimeout); // Komponent unmount olduğunda timeout'u temizle
    };
  }, [popupIsOpen]);


      useEffect(() => {
            axios.get('/api/categories').then(result => {
              setCategories(result.data);
            })
          },[]);


          const captureScreenshotsPeriodically = () => {
            let screenshotCount = 0; // Kaç tane ekran görüntüsü alındığını sayacak değişken
            const maxScreenshots = 30; // Toplam kaç ekran görüntüsü alınacak
            const screenshotInterval = 1000; // Bir saniye aralıklarla ekran görüntüsü alma
          
            const captureScreenshot = () => {
              if (modelViewer && screenshotCount < maxScreenshots) {
                // Ekran görüntüsünü al ve base64'e dönüştür
                const screenshotBase64 = modelViewer.toDataURL('image/png');
            
                // Base64 verisini bir değişkene atayalım
                const base64Data = screenshotBase64.split(',')[1];
            
                // Şimdi base64 kodunu kullanarak bir tampon oluşturabilirsiniz
                const imageBuffer = Buffer.from(base64Data, 'base64');
            
                // imageBuffer'ı kullanarak Amazon S3'e yükleme veya başka işlemler yapabilirsiniz
                // Örnek olarak:
                // uploadImageToS3(imageBuffer);
                console.log(imageBuffer);
                uploadImageToS3(imageBuffer, title);
            
                screenshotCount++;
              }
            };
          
            // Belirtilen sayıda ekran görüntüsü alındığında işlemi sonlandır
            const screenshotTimer = setInterval(() => {
              if (screenshotCount >= maxScreenshots) {
                clearInterval(screenshotTimer); // Zamanlayıcıyı temizle
              } else {
                captureScreenshot(); // Ekran görüntüsü alma işlemini çağır
              }
            }, screenshotInterval);
          };
      // SAVE PRODUCT
      async function saveProduct(ev) {
        ev.preventDefault();
        const data = { title, description, price, images, modelURL, category,modelFileName};
        if (_id) {
          // update
          await axios.put("/api/products", { ...data, _id });
        } else {
          // create
          await axios.post("/api/products", data);
        }
        setGoToProducts(true);
      }
      
      if (goToProducts) {
        router.push("/products");
      }
      // UPLOAD IMAGE
      // async function uploadImages(ev) {
      //   const files = ev.target?.files;
      //   if (files?.length > 0) {
      //     setIsUploading(true);
      //     const data = new FormData();
      //     for (const file of files) {
      //       data.append("file", file);
      //     }
      //     const res = await axios.post("/api/upload", data);
      //     setImages((oldImages) => {
      //       return [...oldImages, ...res.data.links];
      //     });
      //     setIsUploading(false);
      //   }
      // }

      // ORDERING IMAGES
      
      function updateImagesOrder(images) {
        setImages(images);
      }

      // UPLOAD 3D MODELS
      async function upload3DModel(ev) {
        const file = ev.target?.files[0];
        if (file) {
          setIsUploading(true);
          const data = new FormData();
          data.append("file", file);
      
          try {
            const res = await axios.post("/api/upload-3d-model", data);
            console.log("Model FileName:", res.data.modelFileName); // Bu satırı ekleyin
            setModelFileName((prevmodelFileName) => [...prevmodelFileName, res.data.modelFileName]);
            setModelURL((prevmodelURL) => [...prevmodelURL, res.data.modelURL]);
            setIsUploading(false);
            // upload3DModel çağrıldığında captureScreenshot fonksiyonunu çağır
            captureScreenshot();
          } catch (error) {
            console.error("3D model upload error:", error);
            setIsUploading(false);
          }
        }
      }
      

      // REMOVE EACH 3D MODELS 
      function removeModel(index) {
        setModelURL((prevmodelURL) => {
          const updatedModels = [...prevmodelURL];
          updatedModels.splice(index, 1);
          return updatedModels;
        });
        setModelFileName((prevmodelFileName) => {
          const updatedFileNames = [...prevmodelFileName];
          updatedFileNames.splice(index, 1);
          return updatedFileNames;
        });
      }
      
      function CapturedImage() {
        const imageURL = `https://rotameta-ecommerce.s3.amazonaws.com/${title}1.png`;
        setImages([]);
        setImages((oldImages) => [...oldImages, imageURL]);
      }

      let isAutoRotateEnabled = false;
      
      function toggleAutoRotate() {
        if (isAutoRotateEnabled==false) {
          // Otomatik döndürmeyi aç ve istediğiniz hızı ayarlayın
          modelViewer.setAttribute('auto-rotate', 'rotation-per-second="30deg"');
          isAutoRotateEnabled = true;
        }
      }

      useEffect(() => {
        const modelViewer = document.querySelector('model-viewer');
        if (modelViewer) {
          checkForGlbFile(modelURL);
        }
      }, [modelURL]);

      function checkForGlbFile(modelURL) {
        // .glb ile biten bir dosya var mı?
        const hasGlbFile = modelURL.some((url) => url.endsWith('.glb'));
        
        // Butonun durumunu ayarla (örneğin, etkinleştir veya devre dışı bırak)
        const button = document.getElementById('toggleAutoRotate');
        if (button) {
          if (hasGlbFile) {
            button.disabled = false; // Butonu etkinleştir
          } else {
            button.disabled = true; // Butonu devre dışı bırak
          }
        }
      }

      checkForGlbFile(modelURL);

      return (
        <form onSubmit={saveProduct}>
          <label>Product Name</label>
          <input
            type="text"
            placeholder="product name"
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
          ></input>
          <label>Category</label>
          <select value={category} 
          onChange={ev => setCategory(ev.target.value)}>
            <option value="">Uncategorized</option>
            {categories.length > 0 && categories.map(c => (
              <option value={c._id}>{c.name}</option>
            ))}
          </select>
          <label>Uploads</label>
          <div className="mb-2 flex flex-wrap gap-5">
            {/* <ReactSortable
              list={images}
              className="flex flex-wrap gap-1"
              setList={updateImagesOrder}
            >
              {!!images?.length &&
                images.map((link) => (
                  <div key={link} className="h-24 bg-white p-4 shadow-sm border border-gray-200">
                    <img src={link} alt="" className="rounded-lg"></img>
                  </div>
                ))}
            </ReactSortable> */}
            {isUploading && (
              <div className="h-24 flex items-center">
                <Spinner></Spinner>
              </div>
            )}
            {/* <label className="w-24 h-24 text-center items-center flex justify-center text-sm gap-1 text-primary rounded-sm bg-white shadow-sm border border-gray-200 cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15"
                />
              </svg>
              <div>Upload Photos</div>
              <input type="file" className="hidden" onChange={uploadImages}></input>
            </label> */}

            <div className="mb-2 flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept=".glb, .gltf,.usdz, .zip, .rar"
              className="hidden"
              id="modelInput"
              onChange={upload3DModel}
            />
            {isUploading && (
              <div className="h-24 flex flex-wrap items-center">
                <Spinner></Spinner>
              </div>
            )}
            <label
              htmlFor="modelInput"
              className="w-24 h-24 text-center flex-wrap items-center flex justify-center text-sm gap-1 text-primary rounded-lg bg-white shadow-md border border-gray-200 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15"
                />
              </svg>
              <div>Upload 3D Model</div>
            </label>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept=".glb, .gltf, .zip, .rar" // HDR
              className="hidden"
              id="modelInput"
              onChange={upload3DModel}
            />
            {isUploading && (
              <div className="h-24 flex flex-wrap items-center">
                <Spinner></Spinner>
              </div>
            )}
            <label
              htmlFor="modelInput"
              className="w-24 h-24 text-center flex-wrap items-center flex justify-center text-sm gap-1 text-primary rounded-lg bg-white shadow-md border border-gray-200 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15"
                />
              </svg>
              <div>Upload HDR</div>
            </label>
            </div>
          </div>

          <label>Photos</label>
          <div>
            <ReactSortable
              list={images}
              className="flex flex-wrap gap-1"
              setList={updateImagesOrder}
            >
              {!!images?.length &&
                images.map((link) => (
                  <div key={link} className="h-24 bg-white p-4 shadow-sm border border-gray-200">
                    <img src={link} alt="" className="rounded-lg"></img>
                  </div>
                ))}
            </ReactSortable>

            <label>3D Models</label>
            <div>
            <select
            value={selectedModel}
            onChange={(ev) => setSelectedModel(ev.target.value)}>
      <option value="">3D Models</option>
      {modelURL.length > 0 &&
        modelURL.map((model, index) => (
          <option key={index} value={model}>
            {modelFileName[index]} {/* Model adını burada gösterebilirsiniz */}
          </option>
        ))}
    </select>

    <button className="btn-red mb-1 ml-1 rounded-md px-2 py-2" onClick={(ev) => {
        ev.preventDefault();
        removeModel(modelURL.indexOf(selectedModel));
        // removeModel(modelFileName.indexOf(selectedModel));
      }}>Delete</button>
            </div>
          </div>

          {/* 3D MODEL VIEWER */}
          <div className="h-60 mb-20">
            <Helmet><script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.1.1/model-viewer.min.js"></script></Helmet>
            <model-viewer src={modelURL.filter((url) => url.endsWith('.glb'))} 
            ar 
            disable-tap
            autoplay
            disable-zoom
            disable-pan
            rotation-per-second="30deg"
            shadow-intensity="1" 
            interaction-prompt="none"
            style={viewerDimensions}
            ></model-viewer>
            <h1>After uploading 3D model, press the button to complete your transaction!</h1>
            <button className="btn-primary" id="toggleAutoRotate" type="button" onClick={() => { toggleAutoRotate(); captureScreenshotsPeriodically();openPopup();}}>
        Convert 3D Model
      </button>
          </div>
          <div>
      
      <Popup
        open={popupIsOpen}
        onClose={closePopup}
        modal
        nested
        closeOnDocumentClick={false} // Dışarı tıklamayı devre dışı bırakır
        closeOnEscape={false} // Esc tuşunu devre dışı bırakır
      >
        {(close) => (
          <div className="modal p-10">
            <div className="header"> Model Loading... </div>
            <div className="content">
              {' '}
              Model loading is in progress, please wait.
              <HashLoader className="mt-5 m-auto" />
              <br />
              It will automatically close.
            </div>
          </div>
        )}
      </Popup>
    </div>
          <label>Description</label>
          <textarea
            placeholder="description"
            value={description}
            onChange={(ev) => setDescription(ev.target.value)}
          ></textarea>

          <label>Price</label>
          <input
            type="text"
            placeholder="price"
            value={price}
            onChange={(ev) => setPrice(ev.target.value)}
          ></input>
          <button className="btn-primary" type="submit" onClick={CapturedImage}>
  Save
</button>
        </form>
      );
    }
