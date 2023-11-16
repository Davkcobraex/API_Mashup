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



async function updateJsonToS3() {
    const params1 = {
      Bucket: bucketName,
      Key: objectKey,
    };
    const data = await s3.getObject(params1).promise();
    const parsedData = JSON.parse(data.Body.toString("utf-8"));
    parsedData.counter++;
    console.log(parsedData);

    console.log(parsedData.counter);
    const params = {
      Bucket: bucketName,
      Key: objectKey,
      Body: JSON.stringify(parsedData),
      ContentType: "application/json", 
    };
  
    try {
    //   console.log("Parsed JSON data:", params);
      await s3.putObject(params).promise();
      console.log("JSON file uploaded successfully.");
    } catch (err) {
      console.error("Error uploading JSON file:", err);
    }
    return parsedData.counter;
};
  

module.exports = updateJsonToS3;