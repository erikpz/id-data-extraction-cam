import React, { useRef, useState, useEffect } from "react";
import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";
import { Box, styled, Typography } from "@mui/material";
import Swal from "sweetalert2";

const RootStyle = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

const ScanContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  border: "2px solid #999",
  borderRadius: 12,
  width: 500,
  height: 300,
}));

export const IdScan = (props) => {
  const [scanFeedbackLock, setscanFeedbackLock] = useState(false);
  const [scanTextFeedback, setscanTextFeedback] = useState(
    "Coloca el documento frente a la cámara"
  );
  const videoRef = useRef();
  const cameraFeedback = useRef();

  const getIneData = (data) => {
    const {
      dateOfIssue,
      documentOptionalAdditionalNumber,
      mothersName,
      fathersName,
      documentAdditionalNumber,
      personalIdNumber,
      address,
      dateOfBirth,
      nationality,
      fullName,
      documentNumber,
      classInfo,
      mrz,
      sex,
      fullDocumentImage,
    } = data;
    return {
      anioEmision: dateOfIssue.year,
      anioRegistro: parseInt(documentOptionalAdditionalNumber.slice(0, 4)),
      apellidoMatero: mothersName,
      apellidoPaterno: fathersName,
      claveElector: documentAdditionalNumber,
      curp: personalIdNumber,
      direccion: address,
      fechaNacimiento: dateOfBirth,
      nacionalidad: nationality,
      nombre: fullName,
      numeroCIC: documentNumber,
      numeroEmision: documentOptionalAdditionalNumber.slice(4),
      infoLocalidad: classInfo,
      numeroOCR: { ocr: mrz.sanitizedOpt1, rawOcr: mrz.rawMRZString },
      sexo: sex,
      mrz: mrz,
      imageBase64: fullDocumentImage,
    };
  };
  const getPassportData = (data) => {
    const {
      lastName,
      personalIdNumber,
      dateOfExpiry,
      dateOfIssue,
      dateOfBirth,
      placeOfBirth,
      mrz,
      nationality,
      firstName,
      documentNumber,
      sex,
      fullDocumentImage,
    } = data;
    return {
      apellidoMatero: lastName,
      apellidoPaterno: lastName,
      curp: personalIdNumber,
      fechaExpiracion: dateOfExpiry,
      fechaExpedicion: dateOfIssue,
      fechaNacimiento: dateOfBirth,
      lugarNacimiento: placeOfBirth,
      dataMRZ: mrz,
      nacionalidad: nationality,
      nombre: firstName,
      numPasaporte: documentNumber,
      sexo: sex,
      imageBase64: fullDocumentImage,
    };
  };
  const getLicenceData = (data) => {
    const {
      lastName,
      personalIdNumber,
      dateOfExpiry,
      dateOfIssue,
      firstName,
      documentNumber,
      fullDocumentImage,
    } = data;
    return {
      nombre: firstName,
      apellidoMatero: lastName,
      apellidoPaterno: lastName,
      curp: personalIdNumber,
      fechaExpedicion: dateOfIssue,
      fechaVencimiento: dateOfExpiry,
      numLicencia: documentNumber,
      imageBase64: fullDocumentImage,
    };
  };

  const updateScanFeedback = (message, force) => {
    if (scanFeedbackLock && !force) {
      return;
    }
    setscanFeedbackLock(true);
    setscanTextFeedback(message);
    window.setTimeout(() => setscanFeedbackLock(false), 1000);
  };

  const setupMessage = (displayable) => {
    switch (displayable.detectionStatus) {
      case BlinkIDSDK.DetectionStatus.Fail:
        updateScanFeedback("Escaneando");
        break;
      case BlinkIDSDK.DetectionStatus.Success:
      case BlinkIDSDK.DetectionStatus.FallbackSuccess:
        updateScanFeedback("Detección correcta");
        break;
      case BlinkIDSDK.DetectionStatus.CameraAtAngle:
        updateScanFeedback("Ajusta el ángulo");
        break;
      case BlinkIDSDK.DetectionStatus.CameraTooHigh:
        updateScanFeedback("Acerca el documento");
        break;
      case BlinkIDSDK.DetectionStatus.CameraTooNear:
      case BlinkIDSDK.DetectionStatus.DocumentTooCloseToEdge:
      case BlinkIDSDK.DetectionStatus.Partial:
        updateScanFeedback("Aleja el documento");
        break;
      default:
        console.warn(
          "Estatus de detección no reconocido",
          displayable.detectionStatus
        );
    }
  };

  async function startScanTwoSide(sdk) {
    const combinedGenericIDRecognizer =
      await BlinkIDSDK.createBlinkIdCombinedRecognizer(sdk);

    const callbacks = {
      onQuadDetection: (quad) => setupMessage(quad),
      onDetectionFailed: () => updateScanFeedback("Deteccion fallida", true),
      onFirstSideResult: () =>
        Swal.fire({
          title: "Voltea",
          text: "Dale vuelta al documento",
          icon: "info",
        }),
    };

    const recognizerRunner = await BlinkIDSDK.createRecognizerRunner(
      sdk,
      [combinedGenericIDRecognizer],
      false,
      callbacks
    );

    const videoRecognizer =
      await BlinkIDSDK.VideoRecognizer.createVideoRecognizerFromCameraStream(
        videoRef.current,
        recognizerRunner
      );

    const scanTimeoutSeconds = 15;

    try {
      videoRecognizer.startRecognition(async (recognitionState) => {
        if (!videoRecognizer) {
          return;
        }
        videoRecognizer.pauseRecognition();
        if (recognitionState === BlinkIDSDK.RecognizerResultState.Empty) {
          return;
        }
        const result = await combinedGenericIDRecognizer.getResult();
        if (result.state === BlinkIDSDK.RecognizerResultState.Empty) {
          return;
        }
        Swal.fire({
          title: "Exito",
          text: "Datos leídos correctamente",
          icon: "success",
        });
        /*  console.log("Resultados BlinkIDCombined", result); */
        props.onGetDocData(getIneData(result));
        videoRecognizer?.releaseVideoFeed();
        recognizerRunner?.delete();
        combinedGenericIDRecognizer?.delete();
      }, scanTimeoutSeconds * 1000);
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "No se pudo extraer la información",
        icon: "error",
      });
      console.error(
        "Error durante la inicializacion del VideoRecognizer:",
        error
      );
      return;
    }
  }

  async function startScanOneSide(sdk) {
    const genericIDRecognizer = await BlinkIDSDK.createBlinkIdRecognizer(sdk);
    const currentSetts = await genericIDRecognizer.currentSettings();
    genericIDRecognizer.updateSettings({
      ...currentSetts,
      returnEncodedFullDocumentImage: true,
      returnFullDocumentImage: true,
    });
    /* const idBarcodeRecognizer = await BlinkIDSDK.createIdBarcodeRecognizer(sdk); */

    const callbacks = {
      onQuadDetection: (quad) => setupMessage(quad),
      onDetectionFailed: () => updateScanFeedback("Deteccion fallida", true),
    };

    const recognizerRunner = await BlinkIDSDK.createRecognizerRunner(
      sdk,
      [genericIDRecognizer /* idBarcodeRecognizer */],
      false,
      callbacks
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
        Swal.fire({
          title: "Exito",
          text: "Datos leídos correctamente",
          icon: "success",
        });
        /* console.log("Resultados del ID", genericIDResults); */
        if (props.docType === "pasaporte") {
          props.onGetDocData(getPassportData(genericIDResults));
        } else if (props.docType === "licencia") {
          props.onGetDocData(getLicenceData(genericIDResults));
        }
      }
      /* const idBarcodeResult = await idBarcodeRecognizer.getResult();
      if (idBarcodeResult.state !== BlinkIDSDK.RecognizerResultState.Empty) {
        console.log("Resultados IDBracode", idBarcodeResult);
      } */
    } else {
      Swal.fire({
        title: "Error",
        text: "No se pudo extraer la información",
        icon: "error",
      });
    }
    videoRecognizer?.releaseVideoFeed();
    recognizerRunner?.delete();
    genericIDRecognizer?.delete();
    /*  idBarcodeRecognizer?.delete(); */
  }

  const init = async () => {
    if (!BlinkIDSDK.isBrowserSupported()) {
      Swal.fire({
        title: "Error",
        text: "Navegador no soportado",
        icon: "error",
      });
      return;
    }
    const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(
      process.env.REACT_APP_API_KEY
    );
    loadSettings.allowHelloMessage = true;
    loadSettings.engineLocation =
      "https://unpkg.com/@microblink/blinkid-in-browser-sdk@5.15.0/resources/";
    try {
      const sdk = await BlinkIDSDK.loadWasmModule(loadSettings);
      if (props.docType === "pasaporte" || props.docType === "licencia") {
        startScanOneSide(sdk);
      } else if (props.docType === "ine/ife") {
        startScanTwoSide(sdk);
      }
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: "Error al cargar el SDK.",
        icon: "error",
      });
      console.error("Error al cargar el sdk", err);
    }
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <RootStyle>
      <ScanContainer>
        <video ref={videoRef} width="100%" height="100%"></video>
        <canvas ref={cameraFeedback} id="canv"></canvas>
      </ScanContainer>
      <Typography>{scanTextFeedback}</Typography>
      {/*  <Button
        variant="contained"
        onClick={() => init(props.docType ?? "licencia")}
        sx={{ mt: 3 }}
      >
        {props.buttonText ?? "Extraer!"}
      </Button> */}
    </RootStyle>
  );
};
