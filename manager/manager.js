class MultiPartManager {
    multiPartStratergy;
    constructor(stratergy){
        console.log(stratergy);
        this.multiPartStratergy = stratergy;
    }
    /**
        * This function accepts and sets up the configuration for the class.
        * @param {Object} - Object containing the config.
        * @returns {void}
    */
    configure(config) {
        this.multiPartStratergy.configure(config);
    }
    

    /**
        * This function initialises the upload process for a given file.
        * @param {string} fileName - Name of the file to uploaded.
        * @param {number} totalChunks - Number of chunks the current file is begin divided into.
        * @returns {Promise<string>}  Returns an uploadId on successful initialisation.
    */
    async initialiseUpload(fileName, totalChunks) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.multiPartStratergy.initialiseUpload(fileName, totalChunks);
                resolve(result);
            } catch (err){
                reject(err);
            }
        });
    }


    /**
        * This function writes a particular segment on the file onto disk.
        * @param {Object} req - The request object.
        * @returns {Promise<Object>}  Returns a message on success, error otherwise.
    */
    async chunkUpload(req) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.multiPartStratergy.chunkUpload(req);
                resolve(result);
            } catch (err){
                reject(err);
            }
        });
    }

    /**
        * This function re-assembles a file by merging its individual segments.
        * @param {string} uploadId - uploadId of the file.
        * @returns {Promise<void>}  Returns a message on success, error otherwise.
    */
    async completeUpload(uploadId) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.multiPartStratergy.completeUpload(uploadId);
                resolve(result);
            } catch (err){
                reject(err);
            }
        });
    }
};

module.exports = MultiPartManager;