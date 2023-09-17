export class MultiConnector extends Connector{
    
    connections = [];
    
    addConnection(connector){
        this.element.classList.add('e-node-connected');
        this.connections.push(connector);
    }
    
    removeConnection(connector){
        for(let i in this.connections){
            if(this.connections[i] === connector){
                delete this.connections[i];
                break;
            }
        }
        if(!this.connections.length){
            this.element.classList.add('e-node-connected');
        }
    }
    
    update(){
        for(let i in this.connections){
            this.connections[i].update();
        }
    }
}