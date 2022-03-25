import React, { useState } from "react";
import { Box, Button } from "@mui/material";
import { IdScan } from "./IdScan";

//Funcion para transformar la data codificada en base64 a objecto url

const getFullImage = (imageData) => {
  return URL.createObjectURL(
    new Blob([imageData.buffer], { type: "image/png" })
  );
};

/* Parametros para el componente IdScan:
{
  docType: "ine/ife" | "pasaporte" | "licencia" ///// tipo string las 3
  onGetDocData: (docData)=>void ///// Funcion que recibe como parametro 
  un objeto con la informacion recuperada del documento 
}
*/

const App = () => {
  const [play, setplay] = useState(false);

  const getData = (docData) => {
    console.log("Data filtrada---", docData);
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "grid",
        placeContent: "center",
      }}
    >
      {play && <IdScan docType="licencia" onGetDocData={getData} />}
      {!play && (
        <Button variant="contained" onClick={() => setplay(true)}>
          Extraer
        </Button>
      )}
    </Box>
  );
};

export default App;
