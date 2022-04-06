import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import { IdScan } from "./IdScan";

//Funcion para transformar la data codificada en base64 a objecto url

/* const getFullImage = (imageData) => {
  return URL.createObjectURL(
    new Blob([imageData.buffer], { type: "image/png" })
  );
}; */

/* Parametros para el componente IdScan:
{
  docType: "ine/ife" | "pasaporte" | "licencia" | tdc ///// tipo string las 3
  onGetDocData: (docData)=>void ///// Funcion que recibe como parametro 
  un objeto con la informacion recuperada del documento 
}
*/

const App = () => {
  const [play, setplay] = useState(false);
  const [loadingSDK, setLoadingSDK] = useState(false);
  const [SDKSuccess, setSDKSuccess] = useState(false);
  const [data, setData] = useState();

  const getData = (docData) => {
    console.log("Data filtrada---", docData);
    const { imageBase64, ...rest } = docData;
    setData(rest);
  };

  useEffect(() => {
    console.log("LOADING", loadingSDK);
  }, [loadingSDK]);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "grid",
        placeContent: "center",
      }}
    >
      {loadingSDK && <CircularProgress sx={{ m: "50px auto" }} />}
      {play && (
        <IdScan
          docType="ine/ife"
          onGetDocData={getData}
          setLoadingSDK={setLoadingSDK}
          setSDKSuccess={setSDKSuccess}
          visible={SDKSuccess && play}
        />
      )}
      {!play && (
        <Button variant="contained" onClick={() => setplay(true)}>
          Extraer
        </Button>
      )}
      {data && (
        <pre style={{ color: "#000" }}>
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      )}
    </Box>
  );
};

export default App;
