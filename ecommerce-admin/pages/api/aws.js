import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
// aws.js
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: "AKIAYIOY6434LGRWYINL",
  secretAccessKey: "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",
});

const s3 = new AWS.S3();

function uploadImageToS3(imageBuffer, customBaseFileName) {
  const baseFileName = customBaseFileName || "screenshot"; // Özel baz dosya adını kullanın veya varsayılanı kullanın
  const fileName = generateScreenshotFileName(baseFileName); // Dosya adını oluşturun

  const params = {
    Bucket: "rotameta-ecommerce",
    Key: fileName, // Dosya adını string olarak kullanın
    Body: imageBuffer, // Görsel tamponu
    ContentType: 'image/png', // Görselin içerik türü
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Amazon S3 yükleme hatası:', err);
    } else {
      console.log(`Görsel başarıyla Amazon S3'e yüklendi. URL: ${data.Location}`);
    }
  });
}


let screenshotCounter = 1; // Dosya adı için başlangıç sayısı

function generateScreenshotFileName(baseFileName) {
  const fileName = `${baseFileName}${screenshotCounter}.png`; // Dosya adını oluşturun (örneğin, "screenshot1.png")
  screenshotCounter++; // Sayacı artır
  if (screenshotCounter > 30){
    screenshotCounter=1;
  }
  return fileName.toString(); // Dosya adını string olarak döndürün
}

module.exports = {
  uploadImageToS3,
};

