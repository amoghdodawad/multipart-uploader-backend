const fs = require('fs');
const busboy = require('busboy');
const { readFromFile, appendToFile } = require('../utils/utils.js');
const scheduler = require('../scheduler/scheduler.js');
const { MultiPartStratergy } = require('../stratergy/stratergy.js');

/* This is like a singletion-instance variable, this can be made true only once. */
let isConfigured = false;
let isInstantiated = false;


class MultiPartUploaderLocal extends MultiPartStratergy {
    files;
    chunksDirectory;
    contentsDirectory;

    constructor(chunksDirectory = './chunks', contentsDirectory = './videos'){
        if(isInstantiated) throw new Error("Can't create more than one object");
        super();
        isInstantiated = true;
        this.files = new Array();
        this.chunksDirectory = chunksDirectory;
        this.contentsDirectory = contentsDirectory;
    }

    /**
        * This function accepts and sets up the configuration for the class.
        * @param {Object} - Object containing the config.
        * @returns {void}
    */
    configure(config) {}
    

    /**
        * This function initialises the upload process for a given file.
        * @param {string} fileName - Name of the file to uploaded.
        * @param {number} totalChunks - Number of chunks the current file is begin divided into.
        * @returns {Promise<string>}  Returns an uploadId on successful initialisation.
    */
    async initialiseUpload(fileName, totalChunks) {}


    /**
        * This function writes a particular segment on the file onto disk.
        * @param {Object} req - The request object.
        * @returns {Promise<Object>}  Returns a message on success, error otherwise.
    */
    async chunkUpload(req) {}

    /**
        * This function re-assembles a file by merging its individual segments.
        * @param {string} uploadId - uploadId of the file.
        * @returns {Promise<void>}  Returns a message on success, error otherwise.
    */
    async completeUpload(uploadId) {}
};

MultiPartUploaderLocal.prototype.configure = function (config) {
    if(isConfigured){
        throw new Error({ error: 'MultiPartUploaderLocal is already configured' });
    }
    this.chunksDirectory = config?.chunksDirectory  || this.chunksDirectory;
    this.contentsDirectory = config?.contentsDirectory || this.contentsDirectory;
    isConfigured = true;
}

MultiPartUploaderLocal.prototype.initialiseUpload = async function (fileName, totalChunks) {
    return new Promise(( resolve, reject ) => {
        try {
            if(!totalChunks || !fileName) reject({
                err: 'totalChunks and fileName are mandatory fields',
                success: false
            })
            
            const timeStamp = Date.now();
            let parsedFilename = fileName.split('.')[0];
            const uploadId = parsedFilename + timeStamp;
            const extension = fileName.split('.')[fileName.split('.').length - 1];

            this.files[uploadId] = { fileName, totalChunks, uploadedChunks: 0, timeStamp, extension }
            resolve({ uploadId, success: true });
        } catch (err) {
            reject({ err, success: false});
        }
    });
}

MultiPartUploaderLocal.prototype.chunkUpload = async function (req) {
    return new Promise(async ( resolve, reject ) => {
        try {
            const bb = busboy({ headers: req.headers });
            let buf = [];

            bb.on('field', (field, val) => {
                req.body[field] = val;
            });

            bb.on('file', ( name, file, info ) => {
                file.on('data', ( dataBuf ) => {
                    buf.push(dataBuf);
                });

                file.on('end', async () => {
                    const finalBuffer = Buffer.concat(buf);
                    const { uploadId, chunkIndex } = req.body;
                    const contentChunksDirectory = `${this.chunksDirectory}/${uploadId}`;
                    const { extension } = this.files[uploadId];
                    const contentFile = `${contentChunksDirectory}/${chunkIndex}.${extension}`

                    if(!fs.existsSync(`${contentChunksDirectory}`)){
                        fs.mkdirSync(`${contentChunksDirectory}`, { recursive: true })
                    }       

                    await scheduler.schedule(() => {
                        return new Promise(( resolve, reject ) => {
                            fs.writeFile(`${contentFile}`, finalBuffer, (err) => {
                                if(err) reject({ err, success: false });
                                this.files[req.body.uploadId].uploadedChunks++;
                                resolve();
                            });
                        });
                    });

                    resolve({ message: 'Ok', contentFile, success: true });
                })
            });

            bb.on('error', ( err ) => {
                reject({ err, success: false});
            });

            req.pipe(bb);
        } catch (err) {
            reject({ err, success: false});
        }
    });
}

MultiPartUploaderLocal.prototype.completeUpload = async function (uploadId) {
    return new Promise(async ( resolve, reject ) => {
        const { totalChunks, uploadedChunks } = this.files[uploadId];
        if(totalChunks !== uploadedChunks){
            reject({ message: 'All chunks have not yet been uploaded', success: false });
        }

        try {
            const { extension } = this.files[uploadId];
            const contentDirectory = `${this.contentsDirectory}/${extension}/${uploadId}`;
            const contentFile = `${contentDirectory}/${uploadId}.${extension}`;
            const contentChunksDirectory = `${this.chunksDirectory}/${uploadId}`;

            if(!fs.existsSync(`${contentDirectory}`)){
                fs.mkdirSync(`${contentDirectory}`, { recursive: true });
            }
            
            for(let i = 0; i < totalChunks; ++i){
                await scheduler.schedule(async () => {
                    return new Promise(async ( resolve, reject ) => {
                        try {
                            const chunkFile = `${contentChunksDirectory}/${i}.${extension}`;
                            const readStream = fs.createReadStream(chunkFile);
                            const writeStream = fs.createWriteStream(contentFile, { flags: 'a' });
                            writeStream.on('close', () => {
                                resolve();
                            });
                            readStream.pipe(writeStream);
                        } catch (err) {
                            reject({ err, success: false });
                        }
                    });
                });
            }

            fs.rm(contentChunksDirectory, { recursive: true, force: true }, ( err ) => {
                if(err) reject(err);
                delete this.files[uploadId];
                resolve({ message: 'Ok', success: true });
            });

        } catch (err) {
            reject({ err, success: false });
        }
    });
}

module.exports = Object.seal(new MultiPartUploaderLocal());