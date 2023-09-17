import { Gesture } from "@fortles/ui-gesture";
import { NodeEditor } from "./NodeEditor";
import { Connector } from "./connector/Connector";

export interface NodeType{
    in: any,
    out: any
};

export class Node{
    
    protected element: HTMLElement;
    protected data;
    protected name: string;
    protected titleElement: HTMLDivElement;
    protected editor: NodeEditor;
    protected inputs: Connector[] = [];
    protected outputs: Connector[] = [];
    protected transform: Transform;
    
    constructor(type: NodeType, data: Record<string, any>, editor: NodeEditor, name: string){
        this.data = data;
        this.name = name;
        this.element = document.createElement("div");
        //this.element.Node = this;
        this.element.className = "e-node";
        //Title (e-node-label)
        this.titleElement = document.createElement("div");
        this.titleElement.className = "e-node-title";
        this.titleElement.innerHTML = (data.userdata && data.userdata.label) || data.type;
        
        this.element.appendChild(this.titleElement);
        //this.element.onchange = this.changeListener;
        
        let gesture = new Gesture(this.element, {
            scale: false
        });
        
        this.transform = gesture.getTransform();
        this.transform.setPosition(data.x, data.y);
        
        this.element.addEventListener('Fortles.Gesture.move', e => this.update());
        
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
    
    addOutput(key: string, data){
        new OutputConnector(this, key, data);
    }
    
    addInput(key: string, data, value){
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
    

    /**
     * Generates a color from a text
     * It used to have connector colors from type names.
     * @param source String to generate the color from.
     * @returns The calculated color.
     */
    protected hashColor(source: string): string{
        let hash = 0;
        if (source.length === 0) return "#000000";
        for (let i = 0; i < source.length; i++) {
            const char = source.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        const hashText = (hash & 0xFFFFFF).toString(16);
        return "#000000".substring(0, 7 - hashText.length) + hash;
    }
    
    /**
     * Returns the transformation object
     * @returns 
     * @see @fortles/ui-transform
     */
    getTransform(): Transform{
        return this.transform;
    }
    
    /**
     * The node editor which contains this node.
     * @returns 
     */
    getEditor(){
        return this.editor;
    }
    
    /**
     * The name of the node.
     */
    public getName(): string{
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