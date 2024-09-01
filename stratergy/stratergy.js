class MultiPartStratergy {
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

module.exports = { MultiPartStratergy };