'use strict'

import { RGBColor, SwatchesPicker } from 'react-color';
import { useState } from "react";

import { ColorResult } from 'react-color';
import {CSSProperties} from 'react';

const defaultColor = {
      r: 241,
      g: 112,
      b: 19,
      a: 1,

  } as RGBColor;

const ColorPicker = ({color = defaultColor, colorChange = (_:RGBColor) => {}}) => {

  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleChange = (color: ColorResult) => {
    colorChange(color.rgb);
  };

  const styles: Record<string,CSSProperties> = {
    color: {
      width: '36px',
      height: '14px',
      borderRadius: '2px',
      background: `rgba(${ color.r }, ${ color.g }, ${ color.b }, ${ color.a })`,
    },
    swatch: {
      padding: '5px',
      background: '#333',
      borderRadius: '1px',
      boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
      display: 'inline-block',
      cursor: 'pointer',
    },
    popover: {
      position: 'absolute',
      zIndex: 2,
    },
    cover: {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    }
  };

  return (
    <div>
      <div style={ styles.swatch } onClick={ handleClick }>
        <div style={ styles.color } />
      </div>
      { displayColorPicker ? <div style={ styles.popover }>
        <div style={ styles.cover } onClick={ handleClose }/>
        <SwatchesPicker color={ color } onChange={ handleChange } />
      </div> : null }

    </div>
  );
}

export default ColorPicker;
