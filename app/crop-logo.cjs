const sharp = require('sharp');
async function crop() {
  const metadata = await sharp('public/logo.png').metadata();
  console.log("Original dimensions:", metadata.width, "x", metadata.height);
  
  const left = Math.floor(metadata.width * 0.25);
  const width = Math.floor(metadata.width * 0.22);
  const top = 0;
  const height = metadata.height;
  
  console.log("Cropping left:", left, "width:", width);
  
  await sharp('public/logo.png')
    .extract({ left, top, width, height })
    .toFile('public/images/o-logo-dark.png');
    
  console.log("Saved cropped logo to public/images/o-logo-dark.png");
}
crop();
