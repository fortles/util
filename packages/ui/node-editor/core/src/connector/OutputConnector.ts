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