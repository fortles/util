import { Node } from "../index";

export class Connector{
    
    protected node: Node;
    protected element: HTMLElement;
    protected type: string;
    protected key: string;
    protected color: string;
    protected value: any;
    
    constructor(node: Node, key: string, data: Record<string, any>, value: any){
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