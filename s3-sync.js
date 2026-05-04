const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { pipeline } = require('stream/promises');

const BUCKET = process.env.S3_BUCKET;
const PREFIX = process.env.S3_PREFIX || 'auth_info';
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

async function listFiles(dir, base = dir) {
  let results = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(base, abs).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      results = results.concat(await listFiles(abs, base));
    } else if (entry.isFile()) {
      results.push({ absolutePath: abs, relativePath: rel });
    }
  }
  return results;
}

async function uploadAuth(authDir) {
  if (!BUCKET) throw new Error('S3_BUCKET not set');
  if (!fs.existsSync(authDir)) return;
  const files = await listFiles(authDir);
  for (const f of files) {
    const key = `${PREFIX}/${f.relativePath}`;
    const body = await fs.promises.readFile(f.absolutePath);
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body }));
  }
}

async function downloadAuth(authDir) {
  if (!BUCKET) throw new Error('S3_BUCKET not set');
  await fs.promises.mkdir(authDir, { recursive: true });
  let continuation = undefined;
  do {
    const list = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `${PREFIX}/`, ContinuationToken: continuation }));
    if (!list.Contents) break;
    for (const obj of list.Contents) {
      const key = obj.Key;
      const rel = key.replace(`${PREFIX}/`, '');
      if (!rel) continue;
      const target = path.join(authDir, rel);
      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      const resp = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      await pipeline(resp.Body, fs.createWriteStream(target));
    }
    continuation = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuation);
}

module.exports = { uploadAuth, downloadAuth };

async function deleteAuthFromS3() {
  if (!BUCKET) throw new Error('S3_BUCKET not set');
  const prefix = `${PREFIX}/`;
  let continuation = undefined;
  const toDeleteKeys = [];
  do {
    const list = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: continuation }));
    if (!list.Contents || list.Contents.length === 0) break;
    for (const obj of list.Contents) {
      if (obj.Key) toDeleteKeys.push({ Key: obj.Key });
    }
    continuation = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuation);

  if (toDeleteKeys.length === 0) return;

  // AWS DeleteObjects supports up to 1000 keys per request
  while (toDeleteKeys.length > 0) {
    const chunk = toDeleteKeys.splice(0, 1000);
    await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: chunk } }));
  }
}

module.exports.deleteAuth = deleteAuthFromS3;
