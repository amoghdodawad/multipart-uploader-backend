const Queue = require('./queues');

class Scheduler {

    constructor(){
        this.availableFileDescriptors = 20;
        this.waitQueue = new Queue();
    }

    /**
        * This function accepts a callback that has to be scheduled.
        * @param {function} callback - Callback function that has to be scheduled and executed.
        * @returns {Promise<void>}  Returns a promise on settlement
    */
    async schedule(callback) {}

    
    /**
        * @returns {Promise<void>} - Resolves on successfully acquiring the file descriptor, rejects otherwise.
    */
    async acquireFileDescriptor() {}


    /**
        * @returns {Promise<void>} - Resolves on successfully releasing the file descriptor, rejects otherwise.
    */
    async releaseFileDescriptor() {}


    /**
        * @param {function} callback - Callback function that has to be scheduled and executed
        * @returns {Promise<void>} - Returns a promise on settlement
    */
    async runFunction(callback) {}

};

Scheduler.prototype.schedule = async function (callback) {
    return new Promise(async ( resolve, reject ) => {
        try {
            if(this.availableFileDescriptors > 0) {
                await this.runFunction(callback);
                resolve();
            } else {
                /*
                    - This is where we register the callback in the wait queue. 
                    - Once the file descriptors are released, we will execute the callback function from the wait queue.
                    - The logic for this is written in the runFunction method.
                */
                await new Promise(( res, rej ) => {
                    this.waitQueue.enQueue(
                        () => this.runFunction(callback).then(res).catch(rej)
                    );
                });
                resolve();
            }
        } catch (err) {
            reject(err)
        }
    });
}

Scheduler.prototype.acquireFileDescriptor = async function() {
    return new Promise(( resolve, reject ) => { 
        if(this.availableFileDescriptors > 0) {
            this.availableFileDescriptors--;
            resolve();
        } else {
            reject({ message: 'File descriptors unavailable', success: false });
        }
    });
}

Scheduler.prototype.releaseFileDescriptor = async function () {
    return new Promise(( resolve, reject ) => {
        try {
            this.availableFileDescriptors++;
            if(this.availableFileDescriptors > 0 && this.waitQueue.size > 0){
                const nextFunction = this.waitQueue.front();
                this.waitQueue.deQueue();

                /*
                    - We make use of setImmediate so that the function can be executed ASAP.
                    - Also the current function(releaseFileDescriptor) is popped from the stack if we use the above technique.
                */
                setImmediate(() => nextFunction());
            }
            resolve();
        } catch {
            reject({ message: 'Error releasing descriptor', success: false });
        }
    });
}

Scheduler.prototype.runFunction = async function(callback) {
    return new Promise(async ( resolve, reject ) => {
        try {
            await this.acquireFileDescriptor();
            await callback();
            await this.releaseFileDescriptor();
            resolve();
        } catch (err) {
            reject();
        }
    });
}

const scheduler = new Scheduler();

module.exports = Object.freeze(scheduler);