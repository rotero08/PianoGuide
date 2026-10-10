// tools/make-icons.mjs
// Renders the fallback icons from the logo (public/favicon.svg): `pnpm icons`.
//   public/favicon.ico           16, 32 and 48 px, for clients that don't take SVG icons
//   public/apple-touch-icon.png  180 px, for iOS home screens
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const inPublic = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));
const svg = fs.readFileSync(inPublic('favicon.svg'));
const render = (size) => sharp(svg, { density: (72 * size * 2) / 64 }).resize(size, size).png().toBuffer();

// An .ico file is a directory of entries followed by the images, which may be PNGs.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(render));
const directory = Buffer.alloc(6 + 16 * images.length);
directory.writeUInt16LE(1, 2); // type: icon
directory.writeUInt16LE(images.length, 4);
let offset = directory.length;
images.forEach((image, i) => {
  const entry = 6 + 16 * i;
  directory.writeUInt8(sizes[i], entry); // width
  directory.writeUInt8(sizes[i], entry + 1); // height
  directory.writeUInt16LE(1, entry + 4); // colour planes
  directory.writeUInt16LE(32, entry + 6); // bits per pixel
  directory.writeUInt32LE(image.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
fs.writeFileSync(inPublic('favicon.ico'), Buffer.concat([directory, ...images]));

// iOS applies its own mask, so the corners outside the rounded tile must be filled, not transparent.
await sharp(await render(180)).flatten({ background: '#12131F' }).png().toFile(inPublic('apple-touch-icon.png'));
