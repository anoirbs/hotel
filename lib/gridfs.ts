import { MongoClient, ObjectId } from 'mongodb';

import { GridFSBucket } from 'mongodb';

let bucket: GridFSBucket | null = null;

export async function getGridFSBucket() {
  if (bucket) return bucket;
  const client = new MongoClient(process.env.DATABASE_URL!);
  try {
    await client.connect();
    const db = client.db();
    bucket = new GridFSBucket(db, { bucketName: 'roomImages' });
    return bucket;
  } catch (error) {
    console.error('GridFS connection error:', error);
    throw error;
  }
}

export async function uploadImage(file: Buffer, filename: string) {
  const bucket = await getGridFSBucket();
  const uploadStream = bucket.openUploadStream(filename);
  return new Promise<string>((resolve, reject) => {
    uploadStream.write(file);
    uploadStream.end();
    uploadStream.on('finish', () => resolve(uploadStream.id.toString()));
    uploadStream.on('error', (err) => {
      console.error('Image upload error:', err);
      reject(err);
    });
  });
}

export async function getImage(id: string) {
  const bucket = await getGridFSBucket();
  return bucket.openDownloadStream(new ObjectId(id));
}