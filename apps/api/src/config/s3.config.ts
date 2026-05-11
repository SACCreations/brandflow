import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  endpoint: process.env['S3_ENDPOINT'] ?? 'http://localhost:9000',
  accessKey: process.env['S3_ACCESS_KEY'] ?? 'minioadmin',
  secretKey: process.env['S3_SECRET_KEY'] ?? 'minioadmin',
  bucket: process.env['S3_BUCKET'] ?? 'brandflow',
  region: process.env['S3_REGION'] ?? 'us-east-1',
  cdnBaseUrl: process.env['CDN_BASE_URL'] ?? 'http://localhost:9000/brandflow',
}));
