const AWS = require("aws-sdk");
require("dotenv").config();


AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "ap-southeast-2",
});


// Create an S3 client
const s3 = new AWS.S3();

// Specify the S3 bucket and object key
const bucketName = "n10515232-s3";
const objectKey = "counter.json";

// JSON data to be written to S3
const jsonData = {
  counter: 0
};




async function uploadJsonToS3() {
    const params = {
      Bucket: bucketName,
      Key: objectKey,
      Body: JSON.stringify(jsonData), // Convert JSON to string
      ContentType: "application/json", // Set content type
    };
  
    try {
      await s3.putObject(params).promise();
      console.log("JSON file uploaded successfully.");
    } catch (err) {
      console.error("Error uploading JSON file:", err);
    }
}

async function getObjectFromS3() {
  const params = {
    Bucket: bucketName,
    Key: objectKey,
  };
  s3.headObject(params, function(err, data) {
    if (err && err.code === 'NotFound') {
      uploadJsonToS3();
      console.log('File not found');
      return false;
    }
    else if (err) {
      console.log('Error checking file:', err);
    }
    else {
      console.log('File found');
      return true;
    }
  });
}

async function createS3bucket() {
    try {
      await s3.createBucket( { Bucket: bucketName }).promise();
      console.log(`Created bucket: ${bucketName}`);
    } catch(err) {
      if (err.statusCode === 409) {
        console.log(`Bucket already exists: ${bucketName}`);
      } else {
        console.log(`Error creating bucket: ${err}`);
      }
    }
}

(async () => {
    await createS3bucket();
    await getObjectFromS3();
})();