import React from 'react';

// Predefined color options
const colorOptions = [
  // Whites/Grays
  "#ffffff", "#f8f9fa", "#e9ecef", "#dee2e6", "#ced4da", "#adb5bd", "#6c757d", "#495057", "#343a40", "#212529", 
  // Blues
  "#cfe2ff", "#9ec5fe", "#6ea8fe", "#3d8bfd", "#0d6efd", "#0a58ca", "#084298", "#052c65", 
  // Purples
  "#e0cffc", "#c29ffa", "#a370f7", "#8540f5", "#6610f2", "#520dc2", "#3d0a91", "#290661", 
  // Pinks
  "#f7d6e6", "#efadce", "#e685b5", "#de5c9d", "#d63384", "#ab296a", "#801f4f", "#561435", 
  // Reds
  "#f8d7da", "#f1aeb5", "#ea868f", "#e35d6a", "#dc3545", "#b02a37", "#842029", "#58151c", 
  // Oranges
  "#ffe5d0", "#fed3a0", "#ffbf6f", "#ffad3f", "#fd7e14", "#ca6510", "#984c0c", "#653208", 
  // Yellows
  "#fff3cd", "#ffe69c", "#ffda6a", "#ffcd39", "#ffc107", "#cc9a06", "#997404", "#664d03", 
  // Greens
  "#d1e7dd", "#a3cfbb", "#75c298", "#479f76", "#198754", "#146c43", "#0f5132", "#0a3622", 
  // Teals
  "#d2f4ea", "#a6e9d5", "#79dfc1", "#4dd4ac", "#20c997", "#199d79", "#12715a", "#0c4b3b", 
  // Cyans
  "#cff4fc", "#9eeaf9", "#6edff6", "#3dd5f3", "#0dcaf0", "#0aa2c0", "#087990", "#055160"
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export const SimpleColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const handleColorClick = (selectedColor: string) => {
    onChange(selectedColor);
  };

  return (
    <div className="flex flex-wrap gap-1 max-w-md">
      {colorOptions.map((colorOption, index) => (
        <button
          key={index}
          type="button"
          className={`w-8 h-8 rounded-md border ${color === colorOption ? 'ring-2 ring-primary border-primary' : 'border-gray-300'}`}
          style={{ backgroundColor: colorOption }}
          onClick={() => handleColorClick(colorOption)}
          title={colorOption}
          aria-label={`Select color ${colorOption}`}
        />
      ))}
    </div>
  );
};

export const HexColorPicker = SimpleColorPicker;
