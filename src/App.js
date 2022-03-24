import React from "react";
import { Box } from "@mui/material";
import { IdScan } from "./IdScan";

const App = () => {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "grid",
        placeContent: "center",
      }}
    >
      <IdScan />
    </Box>
  );
};

export default App;
