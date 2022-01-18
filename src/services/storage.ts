import { Client } from "minio";
import { Readable } from "stream";

import fs from "fs";
import path from "path";

const minioClient = new Client({
  endPoint: process.env.MINIO_URL!,
  port: Number(process.env.MINIO_PORT!),
  accessKey: process.env.MINIO_USER!,
  secretKey: process.env.MINIO_PASS!,
  useSSL: false,
});

export async function put(
  bucketName: string,
  filename: string,
  file: Readable | Buffer
) {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, "iran");
  }

  const result = await minioClient.putObject(bucketName, filename, file);
  console.log(result);
}

export async function get(bucketName: string, filename: string) {
  const result = await minioClient.getObject(bucketName, filename);
  return result;
}
