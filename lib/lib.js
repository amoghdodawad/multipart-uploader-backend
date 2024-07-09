const fs = require('fs');
const busboy = require('busboy');
const { readFromFile, appendToFile } = require('../utils/utils.js');

/* This is like a singletion-instance variable, this can be made true only once. */
let isConfigured = false;


class MultiPartUploader {
    #files;
    #chunksDirectory;
    #videoDirectory;

    constructor(chunksDirectory = 'chunks', videoDirectory = 'videos'){
        this.#files = new Array();
        this.#chunksDirectory = chunksDirectory;
        this.#videoDirectory = videoDirectory;
    }

    configure(config){
        if(isConfigured){
            throw new Error({ error: 'MultiPartUploader is already configured' });
        }
        this.#chunksDirectory = config?.chunksDirectory  || this.#chunksDirectory;
        this.#videoDirectory = config?.videoDirectory || this.#videoDirectory;
        isConfigured = true;
    }
    
    async initialiseUpload(fileName, totalChunks){
        return new Promise(( resolve, reject ) => {
            try {
                if(!totalChunks || !fileName) reject({
                    err: 'totalChunks and fileName are mandatory fields',
                    success: false
                })
                
                const timeStamp = Date.now();
                let parsedFilename = fileName.split('.')[0];
                const uploadId = parsedFilename + timeStamp;
                this.#files[uploadId] = {
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
                        if(!fs.existsSync(`${this.#chunksDirectory}/${req.body.uploadId}`)){
                            fs.mkdirSync(`${this.#chunksDirectory}/${req.body.uploadId}`)
                        }
                        fs.writeFile(`${this.#chunksDirectory}/${req.body.uploadId}/${req.body.chunkIndex}.mp4`, finalBuffer, (err) => {
                            if(err) reject({ err, success: false });
                            this.#files[req.body.uploadId].uploadedChunks++;
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

    async completeUpload(uploadId){
        return new Promise(async ( resolve, reject ) => {
            const { fileName, totalChunks, uploadedChunks } = this.#files[uploadId];

            if (totalChunks === uploadedChunks) {
                try {
                    if(!fs.existsSync(`${this.#videoDirectory}/${fileName.split('.')[0]}`)){
                        fs.mkdirSync(`${this.#videoDirectory}/${fileName.split('.')[0]}`);
                    }
                    
                    for(let i = 0; i < totalChunks; ++i){
                        await appendToFile(`${this.#videoDirectory}/${fileName.split('.')[0]}/${uploadId}.mp4`, await readFromFile(`${this.#chunksDirectory}/${uploadId}/${i}.mp4`));
                    }
                    fs.rm(this.#chunksDirectory + `/${uploadId}`, { recursive: true, force: true }, ( err ) => {
                        if(err) reject(err);
                        delete this.#files[uploadId];
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

module.exports = Object.freeze(new MultiPartUploader());