class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

class Queue {
    #front = null;
    #rear = null;
    size = 0;

    isEmpty(){
        return this.size === 0;
    }

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

    deQueue(){
        if(this.isEmpty()){
            return null;
        }
        this.#front = this.#front.next;
        this.size--;
    }

    front(){
        if(this.isEmpty()) return null;
        return this.#front.data;
    }
}

module.exports = Queue;