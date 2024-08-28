
# MulitpartIO

An easy-to-use npm module to reassemble multipart file uploads.


## Features

- Clean, 1-line, promise-based API for each task, ensuring simplicity in usage.
- Implemented First-Come-First-Serve (FCFS) scheduling to mitigate maximum file descriptor limitations.
- Achieved peak disk-write speeds of up to 290 MB/s on a Windows machine with 16 GB RAM and Intel i5 12th processor with multiple processes running in background.
- Cross platform module.


## Installation

Install MultipartIO with npm

```bash
  npm install multipart-uploader-backend
  cd multipart-uploader-backend
```
    
## Usage/Examples

```javascript
const multipartUploader = require('multipart-uploader-backend');


// Configure the directory where you want the chunks and final merged files to be stores.
// This is optional.
multipartUploader.configure({
    chunksDirectory: process.env.CHUNKS_DIR,
    contentsDirectory: process.env.CONTENT_DIR
});


// Initialise the upload.
async function init(req, res){
    try {
        const { fileName, totalChunks  } = req.body;
        const { uploadId } = await multipartUploader.initialiseUpload(fileName.split(' ').join('_'), totalChunks);
        res.json({ uploadId });
    } catch (error) {
        res.status(500).json({ message: 'Some error' });
    }
};

// Send each chunk one by one.
async function upload(req, res){
    try {
        const result = await multipartUploader.chunkUpload(req);
        res.json(result);
    } catch (err){
        res.status(500).json({ message: 'Some error' });
    }
}

// Once all the chunks have been uploaded successfully, notify the server to start merging them.
async function complete(req, res){
    try {
        const { uploadId } = req.body;
        const result = await multipartUploader.completeUpload(uploadId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'Some error' });
    }
}
```


## API Reference

#### Initialise the upload

```
  multipartUploader.initialiseUpload( fileName, totalChunks )
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `fileName` | `string` | **Required**. The name of the file to be uploaded. |
| `totalChunks` | `integer` | **Required**. No. of chunks file is split into. |

#### Upload the chunk
```
  multipartUploader.chunkUpload( req )
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `req` | `Request` | **Required**. NodeJS HTTP Request object. |

#### Upload the chunk
```
  multipartUploader.completeUpload( uploadId )
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `uploadId` | `string` | **Required**. UploadId of the file to be merged. |




## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## Support

For support, email amoghasdodawad@gmail.com .
If you encounter any problems or have any questions, please open an issue on the GitHub repository.

