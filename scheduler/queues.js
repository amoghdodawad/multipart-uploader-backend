class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

/*
    Follows a linked-list implementation of queue.
 */
class Queue {
    #front;
    #rear;
    size;

    constructor(){
        this.#front = null;
        this.#rear = null;
        this.size = 0;
    }

    /**
     * Function to check is the queue is empty
     * @returns {boolean} Returns true if the size is 0, false otherwise
     */
    isEmpty(){
        return this.size === 0;
    }

    /**
     * Add callbacks to the queue.
     * @param {function} callback - Accepts a callback function that needs to registered in the queue
     */
    enQueue(data){
        const node = new Node(data);
        if(this.#rear === null){
            this.#front = this.#rear = node;
        } else {
            this.#rear.next = node;
            this.#rear = node;
        }
        this.size++;
    }

    /**
     * Removes the function at the beginning of the queue.
     */
    deQueue(){
        if(this.isEmpty()){
            return null;
        }
        this.#front = this.#front.next;
        this.size--;
    }
    
    /**
     * Returns the function at the beginning of the queue.
     * @returns {function} - Function that needs to be executed next.
     */
    front(){
        if(this.isEmpty()) return null;
        return this.#front.data;
    }
}

module.exports = Queue;