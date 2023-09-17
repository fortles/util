import { Node } from "./Node";
import { Vector2d } from "@fortles/transform";
import { NodeEditor } from "./NodeEditor";

export class Connection{
    source: Node;
    target: Node;
    element: SVGElement;
    editor: NodeEditor;
    svg: SVGElement;
    mouseMoveListener: (event: MouseEvent) => void;
    start: Vector2d = {
        x: 0,
        y: 0
    }
    end: Vector2d  = {
        x: 0,
        y: 0
    }
    constructor(source: Node, target: Node){
        this.element = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.element.classList.add("e-node-connection");
        //this.element.Connection = this;
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