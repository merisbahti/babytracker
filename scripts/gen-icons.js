const sharp = require('sharp');
const path = require('path');

const src = path.join(__dirname, '../public/icon.svg');

Promise.all(
  [192, 512].map((size) =>
    sharp(src)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `../public/icon-${size}.png`))
  )
).then(() => console.log('Icons generated: icon-192.png, icon-512.png'));
