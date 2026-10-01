import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Sube un archivo (Buffer) a la carpeta "pagina-cine" y devuelve la URL pública.
export function uploadImage(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "pagina-cine" }, (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      })
      .end(buffer);
  });
}
