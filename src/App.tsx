
import CssBaseline from '@mui/material/CssBaseline';
import { useReducer, useState } from "react";
import StitchContainer from './StitchContainer';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import PanToolIcon from '@mui/icons-material/PanTool';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { IconButton, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { ElementFactory, GLRenderer } from "@melco/renderer";
import { initial_state, defaultAlphabetPath } from './state';
import { actions, reducer } from './actions';
import { DocumentStateContext, DocumentDispatchContext, RendererContext } from './context';
import { predownloadAlphabet, redownloadAll } from './asyncactions';
import { ZoomToFit } from './asyncactions';

const theme = createTheme({palette: {mode: 'dark'}});

function App() {
  const [stateBase, dispatch] = useReducer(reducer, initial_state)
 
  const createCtx = (ef?: ElementFactory, r?: GLRenderer, c?: HTMLElement) => {
      return {
        dispatch: dispatch,
        factory: ef,
        renderer: r,
        canvas: c,
        setFactory: (f:ElementFactory | undefined, r: GLRenderer | undefined, c: HTMLElement | undefined) => {
          setContext(createCtx(f, r, c));
          if (r) {
            redownloadAll(r, stateBase, dispatch)
            predownloadAlphabet(r, defaultAlphabetPath)
          }
      }
    }
  }
  const [ctx, setContext] = useState(() => {
    return createCtx(undefined);
  });

  const editMode = stateBase.edit_def.editMode;

  const zoomToFitAnimationDurationMs = 300;
  const handleZoomToFitWithAnimation = () => {
    if (ctx.canvas && ctx.factory && ctx.renderer) {
      ZoomToFit(ctx.renderer, stateBase, ctx.canvas.clientWidth, ctx.canvas.clientHeight, dispatch, zoomToFitAnimationDurationMs)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <DocumentStateContext.Provider value={stateBase}>
      <DocumentDispatchContext.Provider value={dispatch}>
        <RendererContext.Provider value={ctx}>
        <CssBaseline />
        <Box display="grid" gridAutoFlow="dense" gridTemplateRows="auto auto 1fr 1em" gridTemplateColumns="repeat(12, 1fr)" gap={2} sx={{ height: '100vh', margin: '0px', padding: '.5em'}}>
          <Box gridRow={1} gridColumn="span 12">
            <AppBar
              position="static"
              color="default"
              elevation={0}>
                <Toolbar>
                  <Typography variant="h6" noWrap component="div">Melco React Test&nbsp;&nbsp;&nbsp;</Typography>
                  <Divider orientation="vertical" flexItem />
                  <Tooltip title="Pan Zoom Mode">
                    <IconButton aria-label="pan" size="large" color={ !editMode ? "primary" : "default" }
                      onClick={() => { dispatch(actions.SetEditMode({value: false})) }}>
                      <PanToolIcon></PanToolIcon>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Select Edit Mode">
                    <IconButton aria-label="edit" size="large" color={ editMode ? "primary" : "default" }
                      onClick={() => { dispatch(actions.SetEditMode({value: true})) } }>
                      <ModeEditIcon></ModeEditIcon>
                    </IconButton>
                  </Tooltip>
                  <Divider orientation="vertical" flexItem />
                  <Tooltip title="Zoom To Fit">
                    <IconButton aria-label="edit" size="large" color="default"
                      onClick={ handleZoomToFitWithAnimation }>
                      <FitScreenIcon></FitScreenIcon>
                    </IconButton>
                  </Tooltip>
                </Toolbar>
            </AppBar>
          </Box>
          <StitchContainer row={2}></StitchContainer>
        </Box>
        </RendererContext.Provider>
      </DocumentDispatchContext.Provider>
      </DocumentStateContext.Provider>
    </ThemeProvider>
  );
}

export default App;
