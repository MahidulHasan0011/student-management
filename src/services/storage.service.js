import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

// ─────────────────────────────────────────────────────────────────────────────
// storage.service — একমাত্র জায়গা যেখানে আমরা S3/R2-র সাথে কথা বলি।
// বাকি কোড (upload.service) শুধু এই ফাংশনগুলো call করে; provider বদলালে এখানেই বদল।
//
// AWS S3 ও Cloudflare R2 দুটোই S3 API compatible — তাই একটাই client।
//   • AWS S3 : STORAGE_ENDPOINT খালি, STORAGE_REGION = প্রকৃত region
//   • R2     : STORAGE_ENDPOINT = https://<acc>.r2.cloudflarestorage.com, REGION = 'auto'
// ─────────────────────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: env.STORAGE_REGION,
  // endpoint দিলে (R2/MinIO) সেটা ব্যবহার হবে; AWS-এর জন্য undefined রাখি
  endpoint: env.STORAGE_ENDPOINT || undefined,
  forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.STORAGE_ACCESS_KEY,
    secretAccessKey: env.STORAGE_SECRET_KEY,
  },
});

export const storageService = {
  /**
   * আপলোডের জন্য pre-signed PUT URL। frontend এই URL-এ সরাসরি PUT করবে।
   * ContentType sign করছি — তাই client-কে ঠিক এই MIME-ই পাঠাতে হবে (mismatch হলে S3 reject করবে)।
   * ফাইলের আসল size confirm ধাপে headObject দিয়ে যাচাই করি (এখানে sign করলে কিছু client-এ ঝামেলা হয়)।
   */
  async getUploadUrl({ key, contentType, ttl = env.STORAGE_UPLOAD_URL_TTL }) {
    const command = new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(s3, command, { expiresIn: ttl });
  },

  /**
   * download/preview-এর জন্য pre-signed GET URL।
   * downloadName দিলে browser ওই নামে "Save as" করবে (Content-Disposition: attachment)।
   */
  async getDownloadUrl({ key, downloadName, ttl = env.STORAGE_DOWNLOAD_URL_TTL }) {
    const command = new GetObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: key,
      ResponseContentDisposition: downloadName
        ? `attachment; filename="${encodeURIComponent(downloadName)}"`
        : undefined,
    });
    return getSignedUrl(s3, command, { expiresIn: ttl });
  },

  /**
   * object আসলেই storage-এ আছে কিনা + তার আসল size/type/etag।
   * confirm ধাপে declared size-এর সাথে মিলিয়ে দেখি; না থাকলে null।
   */
  async headObject(key) {
    try {
      const res = await s3.send(new HeadObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }));
      return {
        contentLength: Number(res.ContentLength ?? 0),
        contentType: res.ContentType || null,
        etag: res.ETag ? res.ETag.replaceAll('"', '') : null,
      };
    } catch (err) {
      // 404/NotFound → object নেই; অন্য error আবার throw করি
      if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') return null;
      throw err;
    }
  },

  /** storage থেকে object মুছে ফেলা (hard delete — temp cleanup / purge job-এ ব্যবহার হবে)। */
  async deleteObject(key) {
    await s3.send(new DeleteObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }));
  },
};
