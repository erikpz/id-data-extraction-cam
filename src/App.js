import { useRef, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";

const licenseKey =
  "sRwAAAYJbG9jYWxob3N0r/lOPgo/w35CpJmmKPU7Zi/CZTZMnznWSmzRvjg+waMT7Pdqf52c54y2Q9CSdGuTPZ09EfT2JJ2SlXbBcYx3kZE1e9CVk8493w6dg/n3pnVBTzwU3fsDD+XLLazdBpA1xrITCX5d52Fn7QcpTnd8JV+Oc4iUdxGED1ym56qajECE+nhSp7hY1l/ovfo8nOv7wQumLUf5JWIvquh4nBD0P607cWLO1hcXJuI=";

function App() {
  const videoRef = useRef();

  useEffect(() => {
    async function startScan(sdk) {
      const genericIDRecognizer = await BlinkIDSDK.createBlinkIdRecognizer(sdk);
      const idBarcodeRecognizer = await BlinkIDSDK.createIdBarcodeRecognizer(
        sdk
      );

      const recognizerRunner = await BlinkIDSDK.createRecognizerRunner(
        sdk,
        [genericIDRecognizer, idBarcodeRecognizer],
        false
      );
      const videoRecognizer =
        await BlinkIDSDK.VideoRecognizer.createVideoRecognizerFromCameraStream(
          videoRef.current,
          recognizerRunner
        );
      const processResult = await videoRecognizer.recognize();
      if (processResult !== BlinkIDSDK.RecognizerResultState.Empty) {
        const genericIDResults = await genericIDRecognizer.getResult();
        if (genericIDResults.state !== BlinkIDSDK.RecognizerResultState.Empty) {
          console.log("BlinkIDGeneric results", genericIDResults);
        }
        const idBarcodeResult = await idBarcodeRecognizer.getResult();
        if (idBarcodeResult.state !== BlinkIDSDK.RecognizerResultState.Empty) {
          console.log("IDBarcode results", idBarcodeResult);
        }
      } else {
        alert("Could not extract information!");
      }
      videoRecognizer?.releaseVideoFeed();
      recognizerRunner?.delete();
      genericIDRecognizer?.delete();
      idBarcodeRecognizer?.delete();
    }
    ///////////////////////////////////////////////////////////////////////////////
    const init = () => {
      if (!BlinkIDSDK.isBrowserSupported()) {
        console.log("Navegador no soportado");
        return;
      }
      const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(licenseKey);
      loadSettings.allowHelloMessage = true;
      loadSettings.engineLocation =
        "https://unpkg.com/@microblink/blinkid-in-browser-sdk@5.15.0/resources/";
      BlinkIDSDK.loadWasmModule(loadSettings).then(
        (sdk) => {
          startScan(sdk);
        },
        (error) => {
          console.error("Failed to load SDK!", error);
        }
      );
    };
    init();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <video ref={videoRef} width="500px" height="300px"></video>
    </div>
  );
}

export default App;
