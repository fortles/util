import { Connection, Node } from "../index";
import { Connector } from "./index";

class InputConnector extends Connector{
    inputElement: HTMLInputElement;
    connection: Connection;
    constructor(node: Node, key, data, value){
        super(node, key, data, value);
        this.element = document.createElement("div");
        this.element.innerHTML = data.name || key;
        this.element.className = "e-node-in";
        this.inputElement = this.createInput(key,data, value);
        this.element.appendChild(this.inputElement);
        
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
        return this.inputElement.value || null;
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