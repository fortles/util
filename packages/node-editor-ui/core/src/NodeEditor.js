import {Gesture} from './Gesture.js'

export class NodeEditor{
    nodes = [];
    options = {};
    element;
    container;
    addList;
    svg;
    transform;
    activeConnection;
    
    constructor(element, options){
        this.element = element;
        
        this.container = document.createElement("div");
        this.container.className = "e-node-container";
        this.element.appendChild(this.container);
        this.element.NodeEditor = this;
         
        //Add node
        this.addList = document.createElement("ul");
        this.addList.className = 'e-node-add';
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
        this.element.classList.add('e-gesture');
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

class Node{
    
    element;
    data;
    name;
    title;
    editor;
    inputs = [];
    outputs = [];
    transform;
    
    constructor(type, data, editor, name){
        this.data = data;
        this.name = name;
        this.element = document.createElement("div");
        this.element.Node = this;
        this.element.className = "e-node";
        //Title (e-node-label)
        this.title = document.createElement("div");
        this.title.className = "e-node-title";
        this.title.innerHTML = (data.userdata && data.userdata.label) || data.type;
        
        this.element.appendChild(this.title);
        //this.element.onchange = this.changeListener;
        
        let gesture = new Gesture(this.element, {
            scale: false
        });
        
        this.transform = gesture.getTransform();
        this.transform.setPosition(data.x, data.y);
        
        this.element.addEventListener('Gesture.move', e => this.update());
        
        this.editor = editor;
        
        let output = type.out;
        if(data.userdata && data.userdata.out){
            Object.assign(output, data.userdata.out);
        }
        for (var key in output) {
            this.addOutput(key, output[key]);
        }
        let input = type.in;
        if(data.userdata && data.userdata.in){
            Object.assign(input, data.userdata.in);
        }
        for (var key in input) {
            this.addInput(key, input[key], data.values && data.values[key] || null);
            
        }
        
        editor.container.appendChild(this.element);
    }
    
    addOutput(key, data){
        new OutputConnector(this, key, data);
    }
    
    addInput(key, data, value){
        if(window[data.type + "NodeInput"]){
            new window[data.type + "NodeInput"](this, key, data, value);
        }else{
            new InputConnector(this, key, data, value);
        }
    }
    
    getInputs(){
        return this.inputs;
    }
    
    update(){
        for(let k in this.inputs){
            this.inputs[k].update();
        }
        for(let k in this.outputs){
            this.outputs[k].update();
        }
    }
    
    hashColor(string){
        var hash = 0;
        if (string.length === 0) return hash;
        for (var i = 0; i < string.length; i++) {
            var char = string.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        hash = (hash & 0xFFFFFF).toString(16);
        return "#000000".substring(0, 7 - hash.length) + hash;
    }
    
    getTransform(){
        return this.transform;
    }
    
    getEditor(){
        return this.editor;
    }
    
    getName(){
        return this.name;
    }
    
    getData(){
        let data = {
            x: this.transform.getX(),
            y: this.transform.getY(),
            values: {}
        };
        for(let k in this.inputs){
            data.values[this.inputs[k].getKey()] = this.inputs[k].getValue();
        }
        return data;
    }
}

class Connector{
    
    node;
    element
    type;
    key;
    
    constructor(node, key, data, value){
        this.key = key;
        this.type = data.type;
        this.node = node;
        this.color = this.node.hashColor(data.type || data);
        this.value = value;
    }
    
    getConnection(){
        return this.connection;
    }
    
    getColor(){
        return this.color;
    }
    
    getNode(){
        return this.node;
    }
    
    getKey(){
        return this.key;
    }
         
    mouseUp(event){
        let activeConnection = this.getNode().getEditor().getActiveConnection();
        if(!activeConnection){
            return;
        }
        if(this instanceof OutputConnector && activeConnection.getTarget()){
            if(activeConnection.getTarget().getNode() !== this.getNode()){
                activeConnection.setSource(this);
                activeConnection.update();
                this.getNode().getEditor().setActiveConnection(null);
            }
        }
        if(this instanceof InputConnector && activeConnection.getSource()){
            if(activeConnection.getSource().getNode() !== this.getNode()){
                activeConnection.setTarget(this);
                activeConnection.update();
                this.getNode().getEditor().setActiveConnection(null);
            }
        }
    }
    addConnection(conncetion){}
    removeConnection(connection){}
}

class InputConnector extends Connector{
    input;
    connection;
    constructor(node, key, data, value){
        super(node, key, data, value);
        this.element = document.createElement("div");
        this.element.innerHTML = data.name || key;
        this.element.className = "e-node-in";
        this.input = this.createInput(key,data, value);
        this.element.appendChild(this.input);
        
        let circle = document.createElement("div");
        circle.className = "e-node-connector";
        circle.style.background = this.getColor();
        this.element.appendChild(circle);
        this.node.element.appendChild(this.element);
        this.node.inputs[key] = this;
        this.element.addEventListener("mouseup", this.mouseUp.bind(this));
        this.element.addEventListener("mousedown", this.mouseDown.bind(this));
    }
    
    mouseDown(event){
        let connection = this.getConnection();
        if(connection){
            new Connection(connection.getSource(), null);
            connection.remove();
        }else{
            new Connection(null, this);
        }
        event.preventDefault();
        event.stopPropagation();
    }
    
    createInput(key, data, value){
        let input = document.createElement("input");
        if(value){
            input.setAttribute("value", value || '');
        }
        input.setAttribute("placeholder", key);
        return input;
    }
    
    getValue(){
        return this.input.value || null;
    }
    
    addConnection(connection){
        this.element.classList.add('e-node-connected');
        this.connection = connection;
    }
    
    removeConnection(connection){
        if(this.connection === connection){
            this.element.classList.remove('e-node-connected');
            this.connection = null;
        }
    }
    
    update(){
        if(this.connection){
            this.connection.update();
        }
    }
}

class SelectNodeInput extends InputConnector{
    createInput(key, data, value){
        let input = document.createElement("select");
        for(var k in data.values){
            var option = document.createElement("option");
            option.setAttribute("value", k);
            option.innerHTML = data.values[k];
            if(data.values && data.values[key] === k){
                option.setAttribute("selected",null);
            }
            input.appendChild(option);
        }
        input.placeholder = data.name || key;
        return input;
    }
}

class MultiConnector extends Connector{
    
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

class OutputConnector extends MultiConnector{
    constructor(node, key, data){
        super(node, key, data);
        this.element = document.createElement("div");
        this.element.innerHTML = data.name || key;
        this.element.className = "e-node-out";
        
        let circle = document.createElement("div");
        circle.className = "e-node-connector";
        circle.style.background = this.getColor();
        this.element.appendChild(circle);
        this.node.element.appendChild(this.element);
        this.node.outputs[key] = this;
        this.element.addEventListener("mouseup", this.mouseUp.bind(this));
        this.element.addEventListener("mousedown", this.mouseDown.bind(this));
    }
    
    mouseDown(event){
        new Connection(this, null);
        event.preventDefault();
        event.stopPropagation();
    }
}

class Connection{
    source;
    target;
    element;
    editor;
    svg;
    mouseMoveListener;
    start = {
        x: 0,
        y: 0
    }
    end = {
        x: 0,
        y: 0
    }
    constructor(source, target){
        this.element = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.element.classList.add("e-node-connection");
        this.element.Connection = this;
        if(source){
            this.setSource(source);
            this.editor = source.getNode().getEditor();
            this.element.setAttribute("stroke", this.source.getColor());
        }
        if(target){
            this.setTarget(target);
            if(!this.editor){
                this.editor = target.getNode().getEditor();
            }
            this.element.setAttribute("stroke", this.target.getColor());
        }
        if(source && target){
            this.update();
        }else{
            this.editor.setActiveConnection(this);
            this.editor.getElement().addEventListener("mouseup", this.mouseUp.bind(this),{once: true});
            this.mouseMoveListner = this.mouseMove.bind(this);
            this.editor.getElement().addEventListener("mousemove", this.mouseMoveListner);
        }
        this.editor.getSvg().appendChild(this.element);
    }
    
    mouseMove(event){
        this.update(event.offsetX, event.offsetY);
    }
    
    mouseUp(event){
        this.editor.getElement().removeEventListener("mousemove", this.mouseMoveListner);
        if(!this.source || !this.target){
            this.remove();
        }
        this.editor.setActiveConnection(null);
    }
    
    update(x, y){
        if(this.source){
            let sourcePos = this.source.getNode().getTransform().getPosition();
            let sourceElement = this.source.element;
            this.start.x = sourcePos.x + sourceElement.offsetWidth;
            this.start.y = sourcePos.y + sourceElement.offsetTop + sourceElement.offsetHeight/2;
        }else{
            this.start.x = x;
            this.start.y = y;
        }
        if(this.target){
            let targetPos = this.target.getNode().getTransform().getPosition();
            let targetElement = this.target.element;
            this.end.x = targetPos.x;
            this.end.y = targetPos.y + targetElement.offsetTop + targetElement.offsetHeight/2;
        }else{
            this.end.x = x;
            this.end.y = y;
        }
        let c = (this.start.x + this.end.x)/2;
        this.element.setAttribute("d", "M"+this.start.x+","+this.start.y+" C"+c+","+this.start.y+" "+c+","+this.end.y+" "+this.end.x+","+this.end.y);
    }
    
    getSource(){
        return this.source;
    }
    
    /**
     * @param {InputConnector} source
     */
    setSource(source){
        if(source){
            source.addConnection(this);
            this.element.setAttribute("stroke", source.getColor());
        }
        if(this.source){
            this.source.removeConnection(this);
        }
        this.source = source;
    }
    
    getTarget(){
        return this.target;
    }
    
    /**
     * @param {OutputConnector} target
     */
    setTarget(target){
        if(target){
            target.addConnection(this);
        }
        if(this.target){
            this.target.removeConnection(this);
        }
        this.target = target;
    }
    
    remove(){
        this.setSource(null);
        this.setTarget(null);
        this.element.remove();
    }
}