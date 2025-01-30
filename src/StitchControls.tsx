import { ThreadColor} from "@melco/renderer";
import { FormControlLabel, Checkbox,FormGroup, MenuItem, Select, InputLabel, TextField } from "@mui/material";
import React, { ChangeEvent, useContext } from "react";
import ColorPicker from './ColorPicker';
import { RGBColor } from "react-color";
import { SelectChangeEvent, Grid } from "@mui/material";
import { DocumentStateContext, DocumentDispatchContext } from "./context";
import { actions } from "./actions";
import { SampleImages, SampleDesigns, defaultAlphabetPath } from "./state";
import { downloadDesignAsync, downloadImageAsync } from "./asyncactions";
import { produce } from "immer";
import { RendererContext } from "./context";

const StitchControls = () => {
    const docState = useContext(DocumentStateContext)
    const dispatch = useContext(DocumentDispatchContext)
    const ctx = useContext(RendererContext);

    const designElement = docState.product.design;

    const enable3dChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(actions.Toggle3dAction({value: event.target.checked}))
    };
    const enableTwistsChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(actions.ToggleTwists({value: event.target.checked}))
    };
    const onDesignUrlChanged = (event: SelectChangeEvent<string>) => {
      var value = SampleDesigns.findIndex((v) => v.name == event.target.value)
      dispatch(actions.ChangeDesign({idx: value}))
      if (ctx.renderer) {
        downloadDesignAsync(ctx.renderer, value, SampleDesigns[value], dispatch)
      }
    }
    const onChangeColor = (color: RGBColor, idx: number, idempotent_idx: number) => {
      if (designElement && designElement.colors && idx < designElement.colors.length) {

          var t: ThreadColor = {red: color.r, green: color.g, blue: color.b};
          let clrs = produce(designElement.colors, (draft) => {
            draft[idx] = t
          })
          dispatch(actions.ModifyDesign({idempotent_idx: idempotent_idx, designElement: {colors: clrs}}))
      }
    }
    const onGraphicUrlChanged = (event: SelectChangeEvent<string>) => {
      var value = SampleImages.findIndex((v) => v.name == event.target.value)
      dispatch(actions.ChangeImage({idx: value}))
      if (ctx.renderer) {
        downloadImageAsync(ctx.renderer, value, SampleImages[value], docState, dispatch)
      }
    }
    const onChangeText = (i: number, text: string, idempotent_idx: number) => {
      if (designElement?.letteringParams && i < designElement?.letteringParams.length) {
        let letteringParams = produce(designElement.letteringParams, (draft) => {
            draft[i].text = text
            draft[i].alphabet = {
              alphabet_metadata_path: defaultAlphabetPath
            }
        })
        dispatch(actions.ModifyDesign({idempotent_idx: idempotent_idx, designElement: {letteringParams: letteringParams}}))
      }
    }
    return (      
        <FormGroup sx={{width: '100%'}}>
          <FormControlLabel control={<Checkbox defaultChecked value={ docState.view_def.enable_3d } onChange={enable3dChecked} />} label="Enable 3d" />
          <FormControlLabel control={<Checkbox value={ docState.view_def.enable_twists } onChange={enableTwistsChecked} />} label="Enable Twists" />
          <InputLabel id="design-label">Design</InputLabel>
          <Select labelId="design-label" value={SampleDesigns[docState.product.design_idx].name} onChange={onDesignUrlChanged} >
            {SampleDesigns.map((value, _) => {
              return <MenuItem key={value.name} value={value.name}>{value.name}</MenuItem>
            })}
          </Select>
          <InputLabel id="color-label">Colors</InputLabel>
          <Grid container spacing={1}>
            {designElement && designElement.colors ? designElement.colors.map((value, index) => {
              return <Grid key={index} item><ColorPicker color={{"r": value.red, "g": value.green, "b": value.blue, "a": 1}}
                     colorChange = {(color: RGBColor) => {onChangeColor(color, index, docState.product.design_idx)}} /></Grid>;
            }) : null}
            </Grid>
          <InputLabel id="graphics-label">Graphic</InputLabel>
          <Select labelId="graphic-label" value={SampleImages[docState.product.image_idx].name} onChange={onGraphicUrlChanged} >
            {SampleImages.map((value, index) => {
              return <MenuItem key={index} value={value.name}>{value.name}</MenuItem>
            })}
          </Select>
          <InputLabel id="text-label" sx={{ display: designElement && designElement.letteringParams && designElement.letteringParams.length > 0 ? 'block' : 'none'}}>Lettering</InputLabel>
            {designElement && designElement.letteringParams ? designElement.letteringParams.map((value, index) => {
              return <TextField variant="outlined" value={ value.text } onChange={(event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => { onChangeText(index, event.target.value, docState.product.design_idx); }} />;
            }) : null}
        </FormGroup>
      );
}

export default StitchControls;