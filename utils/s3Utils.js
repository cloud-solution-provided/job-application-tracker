const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Generate a signed URL for uploading a file
async function generateUploadUrl(key) {
    try {
        if (!BUCKET_NAME) {
            throw new Error('S3 bucket name is not configured');
        }

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return signedUrl;
    } catch (error) {
        console.error('Error generating upload URL:', error);
        throw error;
    }
}

// Generate a signed URL for downloading a file
async function generateDownloadUrl(key) {
    try {
        if (!BUCKET_NAME) {
            throw new Error('S3 bucket name is not configured');
        }

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return signedUrl;
    } catch (error) {
        console.error('Error generating download URL:', error);
        throw error;
    }
}

// Upload a file to S3
async function uploadFile(key, file) {
    try {
        if (!BUCKET_NAME) {
            throw new Error('S3 bucket name is not configured');
        }

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        });

        await s3Client.send(command);
        return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

module.exports = {
    generateUploadUrl,
    generateDownloadUrl,
    uploadFile
}; 