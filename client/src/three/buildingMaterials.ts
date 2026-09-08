import {
  Color,
  DataTexture,
  MeshStandardMaterial,
  NearestFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { BUILDING_STYLES, type BuildingStyle } from "./buildingStyles";

// One repeat is one floor. Pixel textures stay sharp at close range and mipmap
// at city scale; windows add no meshes or per-frame work.
function facadeTexture(style: BuildingStyle) {
  const width = 128,
    height = 64;
  const pixels = new Uint8Array(width * height * 4);
  const color = new Color();
  function rectangle(x: number, y: number, w: number, h: number, hex: string) {
    color.set(hex).convertLinearToSRGB();
    for (
      let row = Math.max(0, Math.floor(y));
      row < Math.min(height, y + h);
      row++
    ) {
      for (
        let col = Math.max(0, Math.floor(x));
        col < Math.min(width, x + w);
        col++
      ) {
        const offset = (row * width + col) * 4;
        pixels[offset] = Math.round(color.r * 255);
        pixels[offset + 1] = Math.round(color.g * 255);
        pixels[offset + 2] = Math.round(color.b * 255);
        pixels[offset + 3] = 255;
      }
    }
  }
  rectangle(0, 0, width, height, style.wall);
  if (style.pattern === "brick") {
    for (let y = 0; y < height; y += 8) {
      rectangle(0, y, width, 1, style.accent);
      for (let x = y % 16 ? -10 : 0; x < width; x += 20)
        rectangle(x, y, 1, 8, style.accent);
    }
  } else if (style.pattern === "timber" || style.pattern === "metal") {
    for (let x = 0; x < width; x += style.pattern === "metal" ? 5 : 12)
      rectangle(x, 0, 1, height, style.accent);
  } else if (style.pattern === "stone") {
    for (let y = 0; y < height; y += 16)
      rectangle(0, y, width, 1, style.accent);
  }
  rectangle(0, 0, width, style.pattern === "curtain" ? 3 : 5, style.frame);
  const cell = width / style.columns;
  const glassWidth = cell * (style.pattern === "curtain" ? 0.85 : 0.55);
  for (let column = 0; column < style.columns; column++) {
    const x = column * cell + (cell - glassWidth) / 2;
    const y = style.pattern === "curtain" ? 7 : 17;
    const windowHeight = style.pattern === "curtain" ? 51 : 35;
    rectangle(x - 2, y - 2, glassWidth + 4, windowHeight + 4, style.frame);
    rectangle(x, y, glassWidth, windowHeight, style.glass);
    rectangle(x + 2, y + windowHeight - 6, glassWidth - 4, 4, "#86aaa9");
    if (column % 3 === 1 && style.pattern !== "curtain")
      rectangle(x + 2, y + 2, glassWidth / 2 - 2, windowHeight - 6, "#c6b682");
    rectangle(x + glassWidth / 2, y, 1, windowHeight, style.frame);
    if (style.pattern === "brick")
      rectangle(x, y + windowHeight / 2, glassWidth, 2, style.frame);
  }
  const texture = new DataTexture(pixels, width, height);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = NearestFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function createBuildingMaterials() {
  const palettes = BUILDING_STYLES.map((style) => {
    const texture = facadeTexture(style);
    const facade = new MeshStandardMaterial({
      map: texture,
      roughness: style.pattern === "curtain" ? 0.3 : 0.85,
      metalness: style.pattern === "curtain" ? 0.25 : 0,
    });
    const roof = new MeshStandardMaterial({
      color: style.roof,
      roughness: 0.95,
    });
    const trim = new MeshStandardMaterial({
      color: style.accent,
      roughness: 0.8,
    });
    const glass = new MeshStandardMaterial({
      color: style.glass,
      roughness: 0.3,
      metalness: 0.2,
    });
    return {
      facade,
      roof,
      trim,
      glass,
      texture,
      faces: [facade, roof],
    };
  });
  return {
    palettes,
    dispose() {
      for (const palette of palettes) {
        palette.facade.dispose();
        palette.roof.dispose();
        palette.trim.dispose();
        palette.glass.dispose();
        palette.texture.dispose();
      }
    },
  };
}
