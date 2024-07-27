const Queue = require('./queues');

class Scheduler {

    constructor(){
        this.availableFileDescriptors = 40;
        this.waitQueue = new Queue();
    }

    async schedule(callback) {
        return new Promise(async ( resolve, reject ) => {
            try {
                if(this.availableFileDescriptors > 0) {
                    await this.runFunction(callback);
                    resolve();
                } else {
                    await new Promise( ( res, rej ) => {
                        this.waitQueue.enQueue(() => this.runFunction(callback).then(res).catch(rej));
                    });
                    resolve();
                }
            } catch (err) {
                reject(err)
            }
        });
    }

    async acquireFileDescriptor(){
        return new Promise(( resolve, reject ) => { 
            if(this.availableFileDescriptors > 0) {
                this.availableFileDescriptors--;
                resolve();
            } else {
                reject({ message: 'File descriptors unavailable', success: false })
            }
        })
    }

    async releaseFileDescriptor(){
        return new Promise(( resolve, reject ) => {
            try {
                this.availableFileDescriptors++;
                if(this.availableFileDescriptors > 0 && this.waitQueue.size > 0){
                    const nextFunction = this.waitQueue.front();
                    this.waitQueue.deQueue();
                    setImmediate(() => nextFunction());
                }
            resolve();
            } catch {
                reject({ message: 'Error releasing descriptor', success: false })
            }
        })
    }

    async runFunction(callback){
        return new Promise(async ( resolve, reject ) => {
            try {
                await this.acquireFileDescriptor();
                await callback();
                await this.releaseFileDescriptor();
                resolve();
            } catch (err) {
                reject();
            }
        })

    }
};

Scheduler.prototype.schedule = async function (callback) {
    return new Promise(async ( resolve, reject ) => {
        try {
            if(this.availableFileDescriptors > 0) {
                await this.runFunction(callback);
                resolve();
            } else {
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

const scheduler = new Scheduler();

module.exports = Object.freeze(scheduler);