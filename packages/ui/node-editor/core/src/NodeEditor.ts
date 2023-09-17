import { Transform } from "@fortles/ui-transform";
import { Gesture } from "@fortles/ui-gesture";
import { Node } from "./Node";
import { Connection } from "./Connection";

export class NodeEditor{
    nodes: Node[] = [];
    options = {};
    element: HTMLElement;
    container: HTMLElement;
    addList;
    svg;
    transform: Transform;
    activeConnection: Connection;
    
    constructor(element: HTMLElement, options){
        this.element = element;
        
        this.container = document.createElement("div");
        this.container.className = "f-node-container";
        this.element.appendChild(this.container);
         
        //Add node
        this.addList = document.createElement("ul");
        this.addList.className = 'f-node-add';
        this.element.appendChild(this.addList);
        
        this.container.addEventListener('dragover', e => {
            e.preventDefault();
        });
        
        this.container.addEventListener('drop', e => {
            let data = JSON.parse(e.dataTransfer.getData('application/e-node-add'));
            this.addNode(data.type, e.offsetX - data.x, e.offsetY - data.y);
        });
        
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.container.appendChild(this.svg);
        //Loading config
        this.options.url = element.getAttribute('data-url');
        
        //Addubg gestures
        let gesture = new Gesture(this.container);
        this.trnasform = gesture.getTransform();
        
        //Load Nodes
        this.load();
        setTimeout(() =>  console.log(this.getData()), 200);
    }
    
    async load(){
        const response = await fetch(this.options.url, {
            headers: {'Content-Type': 'application/json'}
        });
        
        if(!response.ok){
            throw Error('Cant load nodes', response);
        }
        const data = await response.json();
        this.setData(data);
    }
    
    setData(data){
        if(!data.types){
            throw Error('There is no type information.');
        }
        this.types = data.types;
        //Build Nodes
        for (let key in data.nodes) {
            let nodeData = data.nodes[key];
            if(!this.types[nodeData.type]){
                throw Error('There is no type information for the "'+nodeData.type+'" node.');
            }
            this.nodes[key] = new Node(this.types[nodeData.type], nodeData, this, key);
        }
        //Build connections
        if(data.connections){
            for(let key in data.connections){
                for(let key2 in data.connections[key]){
                    let k = data.connections[key][key2];
                    let source = this.nodes[k[0]].outputs[k[1]];
                    let target = this.nodes[key].inputs[key2];
                    if(source && target){
                        let connection = new Connection(source, target);
                    }
                }
            }
        }
        
        //Add avaialble nodes to add
        for (var i=0; i<data.add.length; i++){
            var li = document.createElement('li');
            li.setAttribute('draggable',true);
            li.innerHTML = data.add[i];
            li.ondragstart = this.addDragStart;
            let key = data.add[i];
            li.addEventListener('dragstart', e => {
                console.log(e);
                e.dataTransfer.setData('application/e-node-add', JSON.stringify({
                    x: e.offsetX,
                    y: e.offsetY,
                    type: key
                }));
            });
            this.addList.appendChild(li);
        }
    }
    
    getData(){
        let data = {
            connections: {},
            nodes: {}
        };
        for(let name in this.nodes){
            let node = this.nodes[name];
            data.nodes[name] = node.getData();
            let connections = [];
            const inputs = node.getInputs();
            for(let key in inputs){
                let input = inputs[key];
                if(input.getConnection()){
                    let source = input.getConnection().getSource();
                    connections[source.getKey()] = [
                        source.getNode().getName(), key
                    ];
                }
            }
            if(Object.keys(connections).length){
                data.connections[name] = connections;
            }
        }
        return data;
    }
    
    async save(){
        const data = this.getData();
        const response = await fetch(this.options.url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if(!response.ok){
            throw Error('NodeEditor: Save failed.', response);
        }
    }
    
    async addNode(type, x, y){
        let i = 1;
        while(this.nodes[type + i]){
            i++;
        }
        const name = type + i;
        const typeData = await this.getTypeData(type);
        console.log(typeData);
        this.nodes[name] = new Node(typeData,{
            'x': x,
            'y': y,
            'type': type
        }, this, name);
    }
    
    removeNode(){
        
    }
    
    async getTypeData(name){
        if(!this.types[name]){
            const response = await fetch(this.options.url + '/type', {
                headers: {'Content-Type': 'application/json'}
            });

            if(!response.ok){
                throw Error('Cant load type', response);
            }
            
            const data = await response.json();
            
            this.types[name] = data;
        }
        return this.types[name];
    }
    
    getSvg(){
        return this.svg;
    }
    
    getContainer(){
        return this.container;
    }
    
    getTransform(){
        return this.transform;
    }
    
    getActiveConnection(){
        return this.activeConnection;
    }
    
    setActiveConnection(connection){
        this.activeConnection = connection;
    }
    
    getElement(){
        return  this.element;
    }
}