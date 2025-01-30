import { useContext } from "react";
import StitchView from "./StitchView";
import StitchControls from "./StitchControls";
import {Box, CircularProgress } from '@mui/material';
import { RendererContext } from "./context";

// element to display when waiting for download
const loadingElem = () => <div style={{ 
    visibility: 'visible',
    position: 'absolute',
    top: '20%',
    width: '100%',
    zIndex: 11,
    textAlign: 'center',
    display: 'block'
        }}><CircularProgress sx={{ color: "#1a90ff" }} /><h2>Downloading...</h2></div>;

/** Container for everything needed to render */
const StitchContainer = ({width='100%', height='100%', row=2}) => {
    const ctx = useContext(RendererContext);

    const initialized = ctx.factory ? true : false;
   
    return (
      <>
      <Box gridRow={(row).toString() + " / " + (row+2).toString()} gridColumn="span 8" sx={{width: width, height: height, position: 'relative'}}>
        <StitchView />
        {!initialized ? loadingElem() : null}
      </Box>
      <Box gridRow={(row)} gridColumn="span 4">
        <StitchControls />
      </Box>
      </>)
      ;
};

export default StitchContainer;