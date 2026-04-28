import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/sendResponse.js';
import cloudinary from '../config/cloudinary.js';

const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });

export const uploadImageController = asyncHandler(async (req, res) => {
  if (!req.file) return sendResponse(res, 400, 'No image file provided');

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'nextalk/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });

  return sendResponse(res, 200, 'Image uploaded successfully', {
    url: result.secure_url,
    public_id: result.public_id,
    format: result.format,
    file_type: req.file.mimetype,
  });
});

export const uploadFileController = asyncHandler(async (req, res) => {
  if (!req.file) return sendResponse(res, 400, 'No file provided');

  const isVideo = req.file.mimetype.startsWith('video/');

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: isVideo ? 'nextalk/videos' : 'nextalk/docs',
    resource_type: isVideo ? 'video' : 'raw',
    use_filename: true,
    unique_filename: true,
  });

  return sendResponse(res, 200, 'File uploaded successfully', {
    url: result.secure_url,
    public_id: result.public_id,
    file_type: req.file.mimetype,
    original_name: req.file.originalname,
  });
});

export const uploadAudioController = asyncHandler(async (req, res) => {
  if (!req.file) return sendResponse(res, 400, 'No audio file provided');

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'nextalk/audio',
    resource_type: 'video', // Cloudinary uses 'video' resource_type for audio
    use_filename: true,
    unique_filename: true,
  });

  return sendResponse(res, 200, 'Audio uploaded successfully', {
    url: result.secure_url,
    public_id: result.public_id,
    file_type: req.file.mimetype,
  });
});
