// Photos shown after each level. Drop .jpg / .png / .webp files into
// src/photos/<country>/ (serbia, georgia, turkey): they are picked up
// automatically, in file-name order. A file name like "Белград.jpg" becomes
// the caption; camera names like IMG_1234 fall back to the country name.
const files = import.meta.glob('./photos/*/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const MAX_SIDE = 1400; // phone photos are far bigger than the screen

function entries(country) {
  return Object.keys(files)
    .filter((path) => path.split('/')[2] === country)
    .sort()
    .map((path, i) => {
      const name = decodeURIComponent(path.split('/').pop()).replace(/\.[^.]+$/, '');
      // Camera, iOS export (UUID) and folder-named files get the country name instead.
      const generic =
        /^(img|dsc|pxl|photo|image|whatsapp)|^[\d_\-\s]+$|^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(name) || name.toLowerCase().startsWith(country);
      return { key: `photo-${country}-${i}`, url: files[path], caption: generic ? null : name.replace(/[_-]+/g, ' ') };
    });
}

// Decodes and downscales every photo into a canvas texture. Never throws: a
// photo that fails to load is skipped with a warning.
export async function loadPhotos(textures, countries) {
  for (const country of countries) {
    for (const { key, url } of entries(country)) {
      if (textures.exists(key)) continue;
      try {
        const bitmap = await createImageBitmap(await (await fetch(url)).blob());
        const k = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * k);
        canvas.height = Math.round(bitmap.height * k);
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        textures.addCanvas(key, canvas);
      } catch (err) {
        console.warn(`[photos] could not load ${url}`, err);
      }
    }
  }
}

// Loaded photos for a country as { key, caption }.
export function photosFor(textures, country) {
  return entries(country).filter((p) => textures.exists(p.key));
}
