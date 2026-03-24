// src/tools/frontend/RgbColorTable.tsx
import { useState, useEffect, useMemo } from 'react'
import { Copy, Search, Palette, Star, X, RotateCcw, Check } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

// ============================================================
// Color Data - 4 Categories
// ============================================================

interface ColorEntry {
  name: string
  hex: string
  category: 'basic' | 'material' | 'websafe' | 'pastel'
}

// Basic Colors
const basicColors: ColorEntry[] = [
  { name: 'Red', hex: '#ff0000', category: 'basic' },
  { name: 'Green', hex: '#00ff00', category: 'basic' },
  { name: 'Blue', hex: '#0000ff', category: 'basic' },
  { name: 'Yellow', hex: '#ffff00', category: 'basic' },
  { name: 'Cyan', hex: '#00ffff', category: 'basic' },
  { name: 'Magenta', hex: '#ff00ff', category: 'basic' },
  { name: 'White', hex: '#ffffff', category: 'basic' },
  { name: 'Black', hex: '#000000', category: 'basic' },
  { name: 'Orange', hex: '#ff8000', category: 'basic' },
  { name: 'Pink', hex: '#ff007f', category: 'basic' },
  { name: 'Purple', hex: '#8000ff', category: 'basic' },
  { name: 'Brown', hex: '#8b4513', category: 'basic' },
  { name: 'Gray', hex: '#808080', category: 'basic' },
  { name: 'Light Gray', hex: '#c0c0c0', category: 'basic' },
  { name: 'Dark Red', hex: '#8b0000', category: 'basic' },
  { name: 'Dark Green', hex: '#006400', category: 'basic' },
  { name: 'Dark Blue', hex: '#00008b', category: 'basic' },
  { name: 'Navy', hex: '#000080', category: 'basic' },
  { name: 'Olive', hex: '#808000', category: 'basic' },
  { name: 'Maroon', hex: '#800000', category: 'basic' },
  { name: 'Teal', hex: '#008080', category: 'basic' },
  { name: 'Silver', hex: '#c0c0c0', category: 'basic' },
  { name: 'Lime', hex: '#00ff00', category: 'basic' },
  { name: 'Aqua', hex: '#00ffff', category: 'basic' },
  { name: 'Fuchsia', hex: '#ff00ff', category: 'basic' },
  { name: 'Emerald', hex: '#50c878', category: 'basic' },
  { name: 'Coral', hex: '#ff7f50', category: 'basic' },
  { name: 'Salmon', hex: '#fa8072', category: 'basic' },
  { name: 'Gold', hex: '#ffd700', category: 'basic' },
  { name: 'Crimson', hex: '#dc143c', category: 'basic' },
]

// Material Design Colors
const materialColors: ColorEntry[] = [
  { name: 'Red 50', hex: '#ffebee', category: 'material' },
  { name: 'Red 100', hex: '#ffcdd2', category: 'material' },
  { name: 'Red 200', hex: '#ef9a9a', category: 'material' },
  { name: 'Red 300', hex: '#e57373', category: 'material' },
  { name: 'Red 400', hex: '#ef5350', category: 'material' },
  { name: 'Red 500', hex: '#f44336', category: 'material' },
  { name: 'Red 600', hex: '#e53935', category: 'material' },
  { name: 'Red 700', hex: '#d32f2f', category: 'material' },
  { name: 'Red 800', hex: '#c62828', category: 'material' },
  { name: 'Red 900', hex: '#b71c1c', category: 'material' },
  { name: 'Pink 500', hex: '#e91e63', category: 'material' },
  { name: 'Purple 500', hex: '#9c27b0', category: 'material' },
  { name: 'Deep Purple 500', hex: '#673ab7', category: 'material' },
  { name: 'Indigo 500', hex: '#3f51b5', category: 'material' },
  { name: 'Blue 500', hex: '#2196f3', category: 'material' },
  { name: 'Light Blue 500', hex: '#03a9f4', category: 'material' },
  { name: 'Cyan 500', hex: '#00bcd4', category: 'material' },
  { name: 'Teal 500', hex: '#009688', category: 'material' },
  { name: 'Green 500', hex: '#4caf50', category: 'material' },
  { name: 'Light Green 500', hex: '#8bc34a', category: 'material' },
  { name: 'Lime 500', hex: '#cddc39', category: 'material' },
  { name: 'Yellow 500', hex: '#ffeb3b', category: 'material' },
  { name: 'Amber 500', hex: '#ffc107', category: 'material' },
  { name: 'Orange 500', hex: '#ff9800', category: 'material' },
  { name: 'Deep Orange 500', hex: '#ff5722', category: 'material' },
  { name: 'Brown 500', hex: '#795548', category: 'material' },
  { name: 'Grey 500', hex: '#9e9e9e', category: 'material' },
  { name: 'Blue Grey 500', hex: '#607d8b', category: 'material' },
  { name: 'Teal A400', hex: '#1de9b6', category: 'material' },
  { name: 'Pink A400', hex: '#f50057', category: 'material' },
]

// Web Safe Colors (216 colors - every 51 in RGB)
const websafeColors: ColorEntry[] = [
  // Row 1
  { name: '000000', hex: '#000000', category: 'websafe' },
  { name: '000033', hex: '#003333', category: 'websafe' },
  { name: '000066', hex: '#000066', category: 'websafe' },
  { name: '000099', hex: '#000099', category: 'websafe' },
  { name: '0000cc', hex: '#0000cc', category: 'websafe' },
  { name: '0000ff', hex: '#0000ff', category: 'websafe' },
  // Row 2
  { name: '003300', hex: '#003300', category: 'websafe' },
  { name: '003333', hex: '#003333', category: 'websafe' },
  { name: '003366', hex: '#003366', category: 'websafe' },
  { name: '003399', hex: '#003399', category: 'websafe' },
  { name: '0033cc', hex: '#0033cc', category: 'websafe' },
  { name: '0033ff', hex: '#0033ff', category: 'websafe' },
  // Row 3
  { name: '006600', hex: '#006600', category: 'websafe' },
  { name: '006633', hex: '#006633', category: 'websafe' },
  { name: '006666', hex: '#006666', category: 'websafe' },
  { name: '006699', hex: '#006699', category: 'websafe' },
  { name: '0066cc', hex: '#0066cc', category: 'websafe' },
  { name: '0066ff', hex: '#0066ff', category: 'websafe' },
  // Row 4
  { name: '009900', hex: '#009900', category: 'websafe' },
  { name: '009933', hex: '#009933', category: 'websafe' },
  { name: '009966', hex: '#009966', category: 'websafe' },
  { name: '009999', hex: '#009999', category: 'websafe' },
  { name: '0099cc', hex: '#0099cc', category: 'websafe' },
  { name: '0099ff', hex: '#0099ff', category: 'websafe' },
  // Row 5
  { name: '00cc00', hex: '#00cc00', category: 'websafe' },
  { name: '00cc33', hex: '#00cc33', category: 'websafe' },
  { name: '00cc66', hex: '#00cc66', category: 'websafe' },
  { name: '00cc99', hex: '#00cc99', category: 'websafe' },
  { name: '00cccc', hex: '#00cccc', category: 'websafe' },
  { name: '00ccff', hex: '#00ccff', category: 'websafe' },
  // Row 6
  { name: '00ff00', hex: '#00ff00', category: 'websafe' },
  { name: '00ff33', hex: '#00ff33', category: 'websafe' },
  { name: '00ff66', hex: '#00ff66', category: 'websafe' },
  { name: '00ff99', hex: '#00ff99', category: 'websafe' },
  { name: '00ffcc', hex: '#00ffcc', category: 'websafe' },
  { name: '00ffff', hex: '#00ffff', category: 'websafe' },
  // Row 7
  { name: '330000', hex: '#330000', category: 'websafe' },
  { name: '330033', hex: '#330033', category: 'websafe' },
  { name: '330066', hex: '#330066', category: 'websafe' },
  { name: '330099', hex: '#330099', category: 'websafe' },
  { name: '3300cc', hex: '#3300cc', category: 'websafe' },
  { name: '3300ff', hex: '#3300ff', category: 'websafe' },
  // Row 8
  { name: '333300', hex: '#333300', category: 'websafe' },
  { name: '333333', hex: '#333333', category: 'websafe' },
  { name: '333366', hex: '#333366', category: 'websafe' },
  { name: '333399', hex: '#333399', category: 'websafe' },
  { name: '3333cc', hex: '#3333cc', category: 'websafe' },
  { name: '3333ff', hex: '#3333ff', category: 'websafe' },
  // Row 9
  { name: '336600', hex: '#336600', category: 'websafe' },
  { name: '336633', hex: '#336633', category: 'websafe' },
  { name: '336666', hex: '#336666', category: 'websafe' },
  { name: '336699', hex: '#336699', category: 'websafe' },
  { name: '3366cc', hex: '#3366cc', category: 'websafe' },
  { name: '3366ff', hex: '#3366ff', category: 'websafe' },
  // Row 10
  { name: '339900', hex: '#339900', category: 'websafe' },
  { name: '339933', hex: '#339933', category: 'websafe' },
  { name: '339966', hex: '#339966', category: 'websafe' },
  { name: '339999', hex: '#339999', category: 'websafe' },
  { name: '3399cc', hex: '#3399cc', category: 'websafe' },
  { name: '3399ff', hex: '#3399ff', category: 'websafe' },
  // Row 11
  { name: '33cc00', hex: '#33cc00', category: 'websafe' },
  { name: '33cc33', hex: '#33cc33', category: 'websafe' },
  { name: '33cc66', hex: '#33cc66', category: 'websafe' },
  { name: '33cc99', hex: '#33cc99', category: 'websafe' },
  { name: '33cccc', hex: '#33cccc', category: 'websafe' },
  { name: '33ccff', hex: '#33ccff', category: 'websafe' },
  // Row 12
  { name: '33ff00', hex: '#33ff00', category: 'websafe' },
  { name: '33ff33', hex: '#33ff33', category: 'websafe' },
  { name: '33ff66', hex: '#33ff66', category: 'websafe' },
  { name: '33ff99', hex: '#33ff99', category: 'websafe' },
  { name: '33ffcc', hex: '#33ffcc', category: 'websafe' },
  { name: '33ffff', hex: '#33ffff', category: 'websafe' },
  // Row 13
  { name: '660000', hex: '#660000', category: 'websafe' },
  { name: '660033', hex: '#660033', category: 'websafe' },
  { name: '660066', hex: '#660066', category: 'websafe' },
  { name: '660099', hex: '#660099', category: 'websafe' },
  { name: '6600cc', hex: '#6600cc', category: 'websafe' },
  { name: '6600ff', hex: '#6600ff', category: 'websafe' },
  // Row 14
  { name: '663300', hex: '#663300', category: 'websafe' },
  { name: '663333', hex: '#663333', category: 'websafe' },
  { name: '663366', hex: '#663366', category: 'websafe' },
  { name: '663399', hex: '#663399', category: 'websafe' },
  { name: '6633cc', hex: '#6633cc', category: 'websafe' },
  { name: '6633ff', hex: '#6633ff', category: 'websafe' },
  // Row 15
  { name: '666600', hex: '#666600', category: 'websafe' },
  { name: '666633', hex: '#666633', category: 'websafe' },
  { name: '666666', hex: '#666666', category: 'websafe' },
  { name: '666699', hex: '#666699', category: 'websafe' },
  { name: '6666cc', hex: '#6666cc', category: 'websafe' },
  { name: '6666ff', hex: '#6666ff', category: 'websafe' },
  // Row 16
  { name: '669900', hex: '#669900', category: 'websafe' },
  { name: '669933', hex: '#669933', category: 'websafe' },
  { name: '669966', hex: '#669966', category: 'websafe' },
  { name: '669999', hex: '#669999', category: 'websafe' },
  { name: '6699cc', hex: '#6699cc', category: 'websafe' },
  { name: '6699ff', hex: '#6699ff', category: 'websafe' },
  // Row 17
  { name: '66cc00', hex: '#66cc00', category: 'websafe' },
  { name: '66cc33', hex: '#66cc33', category: 'websafe' },
  { name: '66cc66', hex: '#66cc66', category: 'websafe' },
  { name: '66cc99', hex: '#66cc99', category: 'websafe' },
  { name: '66cccc', hex: '#66cccc', category: 'websafe' },
  { name: '66ccff', hex: '#66ccff', category: 'websafe' },
  // Row 18
  { name: '66ff00', hex: '#66ff00', category: 'websafe' },
  { name: '66ff33', hex: '#66ff33', category: 'websafe' },
  { name: '66ff66', hex: '#66ff66', category: 'websafe' },
  { name: '66ff99', hex: '#66ff99', category: 'websafe' },
  { name: '66ffcc', hex: '#66ffcc', category: 'websafe' },
  { name: '66ffff', hex: '#66ffff', category: 'websafe' },
  // Row 19
  { name: '990000', hex: '#990000', category: 'websafe' },
  { name: '990033', hex: '#990033', category: 'websafe' },
  { name: '990066', hex: '#990066', category: 'websafe' },
  { name: '990099', hex: '#990099', category: 'websafe' },
  { name: '9900cc', hex: '#9900cc', category: 'websafe' },
  { name: '9900ff', hex: '#9900ff', category: 'websafe' },
  // Row 20
  { name: '993300', hex: '#993300', category: 'websafe' },
  { name: '993333', hex: '#993333', category: 'websafe' },
  { name: '993366', hex: '#993366', category: 'websafe' },
  { name: '993399', hex: '#993399', category: 'websafe' },
  { name: '9933cc', hex: '#9933cc', category: 'websafe' },
  { name: '9933ff', hex: '#9933ff', category: 'websafe' },
  // Row 21
  { name: '996600', hex: '#996600', category: 'websafe' },
  { name: '996633', hex: '#996633', category: 'websafe' },
  { name: '996666', hex: '#996666', category: 'websafe' },
  { name: '996699', hex: '#996699', category: 'websafe' },
  { name: '9966cc', hex: '#9966cc', category: 'websafe' },
  { name: '9966ff', hex: '#9966ff', category: 'websafe' },
  // Row 22
  { name: '999900', hex: '#999900', category: 'websafe' },
  { name: '999933', hex: '#999933', category: 'websafe' },
  { name: '999966', hex: '#999966', category: 'websafe' },
  { name: '999999', hex: '#999999', category: 'websafe' },
  { name: '9999cc', hex: '#9999cc', category: 'websafe' },
  { name: '9999ff', hex: '#9999ff', category: 'websafe' },
  // Row 23
  { name: '99cc00', hex: '#99cc00', category: 'websafe' },
  { name: '99cc33', hex: '#99cc33', category: 'websafe' },
  { name: '99cc66', hex: '#99cc66', category: 'websafe' },
  { name: '99cc99', hex: '#99cc99', category: 'websafe' },
  { name: '99cccc', hex: '#99cccc', category: 'websafe' },
  { name: '99ccff', hex: '#99ccff', category: 'websafe' },
  // Row 24
  { name: '99ff00', hex: '#99ff00', category: 'websafe' },
  { name: '99ff33', hex: '#99ff33', category: 'websafe' },
  { name: '99ff66', hex: '#99ff66', category: 'websafe' },
  { name: '99ff99', hex: '#99ff99', category: 'websafe' },
  { name: '99ffcc', hex: '#99ffcc', category: 'websafe' },
  { name: '99ffff', hex: '#99ffff', category: 'websafe' },
  // Row 25
  { name: 'cc0000', hex: '#cc0000', category: 'websafe' },
  { name: 'cc0033', hex: '#cc0033', category: 'websafe' },
  { name: 'cc0066', hex: '#cc0066', category: 'websafe' },
  { name: 'cc0099', hex: '#cc0099', category: 'websafe' },
  { name: 'cc00cc', hex: '#cc00cc', category: 'websafe' },
  { name: 'cc00ff', hex: '#cc00ff', category: 'websafe' },
  // Row 26
  { name: 'cc3300', hex: '#cc3300', category: 'websafe' },
  { name: 'cc3333', hex: '#cc3333', category: 'websafe' },
  { name: 'cc3366', hex: '#cc3366', category: 'websafe' },
  { name: 'cc3399', hex: '#cc3399', category: 'websafe' },
  { name: 'cc33cc', hex: '#cc33cc', category: 'websafe' },
  { name: 'cc33ff', hex: '#cc33ff', category: 'websafe' },
  // Row 27
  { name: 'cc6600', hex: '#cc6600', category: 'websafe' },
  { name: 'cc6633', hex: '#cc6633', category: 'websafe' },
  { name: 'cc6666', hex: '#cc6666', category: 'websafe' },
  { name: 'cc6699', hex: '#cc6699', category: 'websafe' },
  { name: 'cc66cc', hex: '#cc66cc', category: 'websafe' },
  { name: 'cc66ff', hex: '#cc66ff', category: 'websafe' },
  // Row 28
  { name: 'cc9900', hex: '#cc9900', category: 'websafe' },
  { name: 'cc9933', hex: '#cc9933', category: 'websafe' },
  { name: 'cc9966', hex: '#cc9966', category: 'websafe' },
  { name: 'cc9999', hex: '#cc9999', category: 'websafe' },
  { name: 'cc99cc', hex: '#cc99cc', category: 'websafe' },
  { name: 'cc99ff', hex: '#cc99ff', category: 'websafe' },
  // Row 29
  { name: 'cccc00', hex: '#cccc00', category: 'websafe' },
  { name: 'cccc33', hex: '#cccc33', category: 'websafe' },
  { name: 'cccc66', hex: '#cccc66', category: 'websafe' },
  { name: 'cccc99', hex: '#cccc99', category: 'websafe' },
  { name: 'cccccc', hex: '#cccccc', category: 'websafe' },
  { name: 'ccccff', hex: '#ccccff', category: 'websafe' },
  // Row 30
  { name: 'ccff00', hex: '#ccff00', category: 'websafe' },
  { name: 'ccff33', hex: '#ccff33', category: 'websafe' },
  { name: 'ccff66', hex: '#ccff66', category: 'websafe' },
  { name: 'ccff99', hex: '#ccff99', category: 'websafe' },
  { name: 'ccffcc', hex: '#ccffcc', category: 'websafe' },
  { name: 'ccffff', hex: '#ccffff', category: 'websafe' },
  // Row 31
  { name: 'ff0000', hex: '#ff0000', category: 'websafe' },
  { name: 'ff0033', hex: '#ff0033', category: 'websafe' },
  { name: 'ff0066', hex: '#ff0066', category: 'websafe' },
  { name: 'ff0099', hex: '#ff0099', category: 'websafe' },
  { name: 'ff00cc', hex: '#ff00cc', category: 'websafe' },
  { name: 'ff00ff', hex: '#ff00ff', category: 'websafe' },
  // Row 32
  { name: 'ff3300', hex: '#ff3300', category: 'websafe' },
  { name: 'ff3333', hex: '#ff3333', category: 'websafe' },
  { name: 'ff3366', hex: '#ff3366', category: 'websafe' },
  { name: 'ff3399', hex: '#ff3399', category: 'websafe' },
  { name: 'ff33cc', hex: '#ff33cc', category: 'websafe' },
  { name: 'ff33ff', hex: '#ff33ff', category: 'websafe' },
  // Row 33
  { name: 'ff6600', hex: '#ff6600', category: 'websafe' },
  { name: 'ff6633', hex: '#ff6633', category: 'websafe' },
  { name: 'ff6666', hex: '#ff6666', category: 'websafe' },
  { name: 'ff6699', hex: '#ff6699', category: 'websafe' },
  { name: 'ff66cc', hex: '#ff66cc', category: 'websafe' },
  { name: 'ff66ff', hex: '#ff66ff', category: 'websafe' },
  // Row 34
  { name: 'ff9900', hex: '#ff9900', category: 'websafe' },
  { name: 'ff9933', hex: '#ff9933', category: 'websafe' },
  { name: 'ff9966', hex: '#ff9966', category: 'websafe' },
  { name: 'ff9999', hex: '#ff9999', category: 'websafe' },
  { name: 'ff99cc', hex: '#ff99cc', category: 'websafe' },
  { name: 'ff99ff', hex: '#ff99ff', category: 'websafe' },
  // Row 35
  { name: 'ffcc00', hex: '#ffcc00', category: 'websafe' },
  { name: 'ffcc33', hex: '#ffcc33', category: 'websafe' },
  { name: 'ffcc66', hex: '#ffcc66', category: 'websafe' },
  { name: 'ffcc99', hex: '#ffcc99', category: 'websafe' },
  { name: 'ffcccc', hex: '#ffcccc', category: 'websafe' },
  { name: 'ffccff', hex: '#ffccff', category: 'websafe' },
  // Row 36
  { name: 'ffff00', hex: '#ffff00', category: 'websafe' },
  { name: 'ffff33', hex: '#ffff33', category: 'websafe' },
  { name: 'ffff66', hex: '#ffff66', category: 'websafe' },
  { name: 'ffff99', hex: '#ffff99', category: 'websafe' },
  { name: 'ffffcc', hex: '#ffffcc', category: 'websafe' },
  { name: 'ffffff', hex: '#ffffff', category: 'websafe' },
]

// Pastel Colors
const pastelColors: ColorEntry[] = [
  { name: 'Pastel Red', hex: '#ffb3ba', category: 'pastel' },
  { name: 'Pastel Pink', hex: '#ffb6c1', category: 'pastel' },
  { name: 'Pastel Rose', hex: '#ffc0cb', category: 'pastel' },
  { name: 'Pastel Magenta', hex: '#ffb3d9', category: 'pastel' },
  { name: 'Pastel Purple', hex: '#dcd0ff', category: 'pastel' },
  { name: 'Pastel Lavender', hex: '#e6e6fa', category: 'pastel' },
  { name: 'Pastel Violet', hex: '#d8bfd8', category: 'pastel' },
  { name: 'Pastel Blue', hex: '#b3d9ff', category: 'pastel' },
  { name: 'Pastel Sky', hex: '#b0e0e6', category: 'pastel' },
  { name: 'Pastel Cyan', hex: '#b0ffff', category: 'pastel' },
  { name: 'Pastel Teal', hex: '#b2dfdb', category: 'pastel' },
  { name: 'Pastel Mint', hex: '#b5f5ec', category: 'pastel' },
  { name: 'Pastel Green', hex: '#b4f7c4', category: 'pastel' },
  { name: 'Pastel Lime', hex: '#d4ffbf', category: 'pastel' },
  { name: 'Pastel Yellow', hex: '#fff5ba', category: 'pastel' },
  { name: 'Pastel Cream', hex: '#fffdd0', category: 'pastel' },
  { name: 'Pastel Peach', hex: '#ffd9ba', category: 'pastel' },
  { name: 'Pastel Orange', hex: '#ffd8b2', category: 'pastel' },
  { name: 'Pastel Coral', hex: '#ffded5', category: 'pastel' },
  { name: 'Pastel Salmon', hex: '#ffe4e1', category: 'pastel' },
  { name: 'Peach Puff', hex: '#ffdab9', category: 'pastel' },
  { name: 'Lemon Chiffon', hex: '#fffacd', category: 'pastel' },
  { name: 'Powder Blue', hex: '#b0e0e6', category: 'pastel' },
  { name: 'Thistle', hex: '#d8bfd8', category: 'pastel' },
  { name: 'Plum', hex: '#dda0dd', category: 'pastel' },
  { name: 'Misty Rose', hex: '#ffe4e1', category: 'pastel' },
  { name: 'Antique White', hex: '#faebd7', category: 'pastel' },
  { name: 'Blanched Almond', hex: '#ffead5', category: 'pastel' },
  { name: 'Beige', hex: '#f5f5dc', category: 'pastel' },
  { name: 'Wheat', hex: '#f5deb3', category: 'pastel' },
]

const allColors = [...basicColors, ...materialColors, ...websafeColors, ...pastelColors]

// ============================================================
// Color Conversion Utilities
// ============================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '')
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return null
  let r: string, g: string, b: string
  if (h.length === 3) {
    r = h[0] + h[0]; g = h[1] + h[1]; b = h[2] + h[2]
  } else {
    r = h.slice(0, 2); g = h.slice(2, 4); b = h.slice(4, 6)
  }
  return { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16) }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

function getComplementaryColor(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  hsl.h = (hsl.h + 180) % 360
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l)
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b)
}

function isValidHex(hex: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
}

function parseRgbString(str: string): { r: number; g: number; b: number } | null {
  const match = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (match) {
    return {
      r: Math.max(0, Math.min(255, parseInt(match[1]))),
      g: Math.max(0, Math.min(255, parseInt(match[2]))),
      b: Math.max(0, Math.min(255, parseInt(match[3])))
    }
  }
  return null
}

function parseHslString(str: string): { h: number; s: number; l: number } | null {
  const match = str.match(/hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/i)
  if (match) {
    return {
      h: Math.max(0, Math.min(360, parseInt(match[1]))),
      s: Math.max(0, Math.min(100, parseInt(match[2]))),
      l: Math.max(0, Math.min(100, parseInt(match[3])))
    }
  }
  return null
}

// ============================================================
// Component Styles
// ============================================================

const styles = {
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '12px',
  },
  colorCard: {
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    border: '1px solid var(--border-color)',
  },
  colorSwatch: {
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 600,
  },
  colorInfo: {
    padding: '8px',
    fontSize: '11px',
  },
  colorName: {
    fontWeight: 600,
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  colorFormats: {
    fontFamily: 'monospace',
    color: 'var(--text-secondary)',
    fontSize: '10px',
    lineHeight: 1.4,
  },
  converterBox: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    padding: '16px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
  },
  formatGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  formatLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
  },
  colorInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'monospace',
  },
  complementaryBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
  },
  savedColors: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    minHeight: '40px',
    padding: '12px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
  },
  savedColor: {
    position: 'relative' as const,
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'transform 0.15s',
    border: '2px solid var(--border-color)',
  },
  savedColorDelete: {
    position: 'absolute' as const,
    top: '-6px',
    right: '-6px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'var(--error-color)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    opacity: 0,
    transition: 'opacity 0.15s',
  },
  copyNotification: {
    position: 'fixed' as const,
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    background: 'var(--success-color)',
    color: 'white',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    zIndex: 1000,
    animation: 'fadeInUp 0.2s ease-out',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '16px',
    padding: '4px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
  },
  tab: {
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    marginBottom: '16px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
  },
}

// ============================================================
// Main Component
// ============================================================

export default function RgbColorTable() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentHex, setCurrentHex] = useState('#6366f1')
  const [hexInput, setHexInput] = useState('#6366f1')
  const [rgbInput, setRgbInput] = useState('rgb(99, 102, 241)')
  const [hslInput, setHslInput] = useState('hsl(239, 84%, 67%)')
  const [savedColors, setSavedColors] = useState<string[]>([])
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  // Load saved colors from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('saved-colors')
    if (saved) {
      try {
        setSavedColors(JSON.parse(saved))
      } catch {
        // ignore parse errors
      }
    }
  }, [])

  // Save colors to localStorage
  const saveColors = (colors: string[]) => {
    localStorage.setItem('saved-colors', JSON.stringify(colors))
    setSavedColors(colors)
  }

  const complementary = getComplementaryColor(currentHex)

  // Update inputs when hex changes
  const handleHexChange = (hex: string) => {
    setHexInput(hex)
    if (isValidHex(hex)) {
      const normalized = hex.startsWith('#') ? hex : '#' + hex
      setCurrentHex(normalized.length === 4 
        ? '#' + normalized[1] + normalized[1] + normalized[2] + normalized[2] + normalized[3] + normalized[3]
        : normalized)
      if (hexToRgb(normalized)) {
        const r = hexToRgb(normalized)!.r
        const g = hexToRgb(normalized)!.g
        const b = hexToRgb(normalized)!.b
        const h = rgbToHsl(r, g, b)
        setRgbInput(`rgb(${r}, ${g}, ${b})`)
        setHslInput(`hsl(${h.h}, ${h.s}%, ${h.l}%)`)
      }
    }
  }

  const handleRgbChange = (str: string) => {
    setRgbInput(str)
    const parsed = parseRgbString(str)
    if (parsed) {
      const hex = rgbToHex(parsed.r, parsed.g, parsed.b)
      setCurrentHex(hex)
      setHexInput(hex)
      const h = rgbToHsl(parsed.r, parsed.g, parsed.b)
      setHslInput(`hsl(${h.h}, ${h.s}%, ${h.l}%)`)
    }
  }

  const handleHslChange = (str: string) => {
    setHslInput(str)
    const parsed = parseHslString(str)
    if (parsed) {
      const rgb = hslToRgb(parsed.h, parsed.s, parsed.l)
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
      setCurrentHex(hex)
      setHexInput(hex)
      setRgbInput(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text)
    setCopiedFormat(format)
    setTimeout(() => setCopiedFormat(null), 1500)
  }

  // Save color
  const saveColor = (hex: string) => {
    if (!savedColors.includes(hex)) {
      saveColors([...savedColors, hex])
    }
  }

  // Remove saved color
  const removeColor = (hex: string) => {
    saveColors(savedColors.filter(c => c !== hex))
  }

  // Load color from saved
  const loadColor = (hex: string) => {
    handleHexChange(hex)
  }

  // Filter colors
  const filteredColors = useMemo(() => {
    let colors = allColors
    if (activeCategory !== 'all') {
      colors = colors.filter(c => c.category === activeCategory)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      colors = colors.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.hex.toLowerCase().includes(q)
      )
    }
    return colors
  }, [activeCategory, searchQuery])

  const categories = [
    { id: 'all', name: '全部', count: allColors.length },
    { id: 'basic', name: '基础色', count: basicColors.length },
    { id: 'material', name: 'Material', count: materialColors.length },
    { id: 'websafe', name: '网页安全色', count: websafeColors.length },
    { id: 'pastel', name: '马卡龙', count: pastelColors.length },
  ]

  return (
    <ToolLayout title="颜色参考表" description="颜色对照表，支持 HEX/RGB/HSL 格式转换和复制">
      {/* Color Converter Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <RotateCcw size={14} />
          颜色格式转换器
        </div>
        <div style={styles.converterBox}>
          <div style={styles.formatGroup}>
            <label style={styles.formatLabel}>HEX</label>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              style={styles.colorInput}
              placeholder="#000000"
            />
          </div>
          <div style={styles.formatGroup}>
            <label style={styles.formatLabel}>RGB</label>
            <input
              type="text"
              value={rgbInput}
              onChange={(e) => handleRgbChange(e.target.value)}
              style={styles.colorInput}
              placeholder="rgb(0, 0, 0)"
            />
          </div>
          <div style={styles.formatGroup}>
            <label style={styles.formatLabel}>HSL</label>
            <input
              type="text"
              value={hslInput}
              onChange={(e) => handleHslChange(e.target.value)}
              style={styles.colorInput}
              placeholder="hsl(0, 0%, 0%)"
            />
          </div>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            width: '60px',
            height: '40px',
            borderRadius: '6px',
            background: currentHex,
            border: '1px solid var(--border-color)',
          }} />
          <button
            className="btn btn-primary"
            onClick={() => saveColor(currentHex)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Star size={14} />
            收藏此颜色
          </button>
          <button
            className="btn btn-outline"
            onClick={() => copyToClipboard(currentHex, 'HEX')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Copy size={14} />
            复制 HEX
          </button>
        </div>
      </div>

      {/* Complementary Color */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <Palette size={14} />
          互补色建议
        </div>
        <div style={styles.complementaryBox}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '8px',
            background: currentHex,
            border: '1px solid var(--border-color)',
          }} />
          <span style={{ fontSize: '20px' }}>↔</span>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '8px',
            background: complementary,
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
          }} onClick={() => handleHexChange(complementary)} title="点击使用此颜色" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>互补色</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '2px' }}>{complementary}</div>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => copyToClipboard(complementary, 'Complementary')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* Saved Colors */}
      {savedColors.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <Star size={14} />
            已收藏颜色 ({savedColors.length})
          </div>
          <div style={styles.savedColors}>
            {savedColors.map(hex => (
              <div
                key={hex}
                style={{
                  ...styles.savedColor,
                  background: hex,
                }}
                onClick={() => loadColor(hex)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'
                  ;(e.currentTarget.querySelector('.delete-btn') as HTMLElement).style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                  ;(e.currentTarget.querySelector('.delete-btn') as HTMLElement).style.opacity = '0'
                }}
                title={`${hex} - 点击使用`}
              >
                <button
                  className="delete-btn"
                  style={styles.savedColorDelete}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeColor(hex)
                  }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Color Grid */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <Palette size={14} />
          颜色调色板
        </div>
        
        {/* Search */}
        <div style={styles.searchBox}>
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            placeholder="搜索颜色名称或 HEX 值..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
            >
              <X size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div style={styles.tabs}>
          {categories.map(cat => (
            <button
              key={cat.id}
              style={{
                ...styles.tab,
                ...(activeCategory === cat.id ? styles.tabActive : {}),
              }}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Color Grid */}
        <div style={styles.colorGrid}>
          {filteredColors.map(color => (
            <div
              key={color.hex}
              style={styles.colorCard}
              onClick={() => {
                handleHexChange(color.hex)
                setCopiedColor(color.hex)
                setTimeout(() => setCopiedColor(null), 1000)
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}
            >
              <div style={{
                ...styles.colorSwatch,
                background: color.hex,
                color: hexToRgb(color.hex)!.r * 0.299 + hexToRgb(color.hex)!.g * 0.587 + hexToRgb(color.hex)!.b * 0.114 > 150 ? '#000' : '#fff',
              }}>
                {copiedColor === color.hex ? <Check size={14} /> : color.hex}
              </div>
              <div style={styles.colorInfo}>
                <div style={styles.colorName}>{color.name}</div>
                <div style={styles.colorFormats}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>HEX</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(color.hex, color.hex)
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        color: 'var(--primary-color)',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <Copy size={8} /> 复制
                    </button>
                  </div>
                  {(() => {
                    const r = hexToRgb(color.hex)
                    return r ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>RGB</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(`rgb(${r.r}, ${r.g}, ${r.b})`, `rgb(${r.r}, ${r.g}, ${r.b})`)
                            }}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              color: 'var(--primary-color)',
                              fontSize: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <Copy size={8} /> 复制
                          </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>HSL</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const h = rgbToHsl(r.r, r.g, r.b)
                              copyToClipboard(`hsl(${h.h}, ${h.s}%, ${h.l}%)`, `hsl(${h.h}, ${h.s}%, ${h.l}%)`)
                            }}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              color: 'var(--primary-color)',
                              fontSize: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <Copy size={8} /> 复制
                          </button>
                        </div>
                      </>
                    ) : null
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredColors.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-secondary)',
          }}>
            没有找到匹配的颜色
          </div>
        )}
      </div>

      {/* Copy Notification */}
      {copiedFormat && (
        <div style={styles.copyNotification}>
          <Check size={14} style={{ marginRight: '6px' }} />
          已复制: {copiedFormat}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </ToolLayout>
  )
}
