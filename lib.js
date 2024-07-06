const fs = require('fs');
const busboy = require('busboy');

class MultiPartUploader {
    constructor(chunksDirectory = '.', videoDirectory = '.'){
        this.files = new Array();
        this.chunksDirectory = chunksDirectory;
        this.videoDirectory = videoDirectory;
    }
    
    async initialiseUpload(fileName, totalChunks){
        return new Promise(( resolve, reject ) => {
            try {
                const timeStamp = Date.now();
                let parsedFilename = fileName.split('.')[0];
                const uploadId = parsedFilename + timeStamp;
                this.files[uploadId] = {
                    fileName,
                    totalChunks,
                    uploadedChunks: 0,
                    timeStamp
                }
                resolve({ uploadId, success: true });
            } catch (err) {
                reject({ err, success: false});
            }
        })
    }

    async chunkUpload(req){
        return new Promise(async ( resolve, reject ) => {
            try {
                const bb = busboy({ headers: req.headers });
                let buf = []
                bb.on('field', (field, val) => {
                    req.body[field] = val;
                })
                bb.on('file', ( name, file, info ) => {
                    file.on('data', ( dataBuf ) => {
                        buf.push(dataBuf);
                    });
                    file.on('end', () => {
                        const finalBuffer = Buffer.concat(buf);
                        if(!fs.existsSync(`${this.chunksDirectory}/${req.body.uploadId}`)){
                            fs.mkdirSync(`${this.chunksDirectory}/${req.body.uploadId}`)
                        }
                        fs.writeFile(`${this.chunksDirectory}/${req.body.uploadId}/${req.body.chunkIndex}.mp4`, finalBuffer, (err) => {
                            if(err) reject({ err, success: false });
                            this.files[req.body.uploadId].uploadedChunks++;
                            resolve({ message: 'Ok', success: true });
                        });
                    })
                });
                bb.on('error', ( err ) => {
                    reject({ err, success: false});
                });
                req.pipe(bb);
            } catch (err) {
                reject({ err, success: false});
            }
        })
    }

    async promisifyRead(file){
        return new Promise((resolve, reject) => {
            fs.readFile(file, (err, data) => {
                if(err) reject(err);
                resolve(data);
            })
        })
    }

    async promisifyAppend(file, data){
        return new Promise((resolve, reject) => {
            fs.appendFile(file, data, (err) => {
                if(err) {
                    reject(err);
                }
                resolve();
            })
        })
    }

    async completeUpload(uploadId){
        return new Promise(async ( resolve, reject ) => {
            const { fileName, totalChunks, uploadedChunks } = this.files[uploadId];

            if (totalChunks === uploadedChunks) {
                try {
                    if(!fs.existsSync(`${this.videoDirectory}/${fileName.split('.')[0]}`)){
                        fs.mkdirSync(`${this.videoDirectory}/${fileName.split('.')[0]}`);
                    }
                    
                    for(let i = 0; i < totalChunks; ++i){
                        await this.promisifyAppend(`${this.videoDirectory}/${fileName.split('.')[0]}/${uploadId}.mp4`, await this.promisifyRead(`${this.chunksDirectory}/${uploadId}/${i}.mp4`));
                    }
                    fs.rm(this.chunksDirectory + `/${uploadId}`, { recursive: true, force: true }, ( err ) => {
                        if(err) reject(err);
                        delete this.files[uploadId];
                        resolve({ message: 'Ok', success: true });
                    });
                } catch (err) {
                    reject({ err, success: false });
                }
            } else {
                reject({ message: 'All chunks have not yet been uploaded', success: false });
            }
        })
    }
};

module.exports = MultiPartUploader;