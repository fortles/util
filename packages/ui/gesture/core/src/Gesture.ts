import { Transform, Vector2d } from "@fortles/ui-transform";

export interface GestureOptions{
    scale: boolean,
    move: boolean,
    handle: HTMLElement|null
}

export interface PositionalEvent extends Event{
    consturct(type: string, eventInitDict: EventInit & {position: Vector2d});
}

export class Gesture{
    
    protected mouseScrollDivider: number = 2000;
    protected options: GestureOptions = {
        scale: true,
        move: true,
        handle: null
    }
    protected element: HTMLElement;
    protected handleElement: HTMLElement;
    protected transform: Transform;
    protected lastPosition = {x: 0, y: 0};

    protected mouseMoveListener: (event: MouseEvent) => void
    
    constructor(element: HTMLElement, options?: Partial<GestureOptions>){
        Object.assign(this.options, options);
        this.element = element;
        if(!this.options.handle){
            this.handleElement = this.element;
        }else{
            this.handleElement = this.options.handle;
        }
        
        this.element.classList.add('f-gesture');
        
        if(this.options.move){
            this.handleElement.addEventListener("mousedown", event => this.mouseStart(event));
            this.handleElement.addEventListener("mouseup", this.mouseEnd);
            this.handleElement.addEventListener("mouseleave", this.mouseEnd);
        }
        
        if(this.options.scale){
            this.handleElement.addEventListener("wheel", event => this.mouseWheel(event));
        }
        //This way the scope stays this class
        this.mouseMoveListener =  e => this.mouseMove(e);
        this.transform = new Transform(element);
    }
    
    mouseStart(event: MouseEvent){
        this.dragStart(event.pageX, event.pageY);
        this.element.addEventListener("mousemove", this.mouseMoveListener);
        //event.stopPropagation();
    }
    
    mouseEnd(event: MouseEvent){
        this.element.removeEventListener("mousemove", this.mouseMoveListener);
        //event.stopPropagation();
    }
    
    mouseMove(event: MouseEvent){
        this.dragMove(event.pageX, event.pageY);
        event.stopPropagation();
    }
    
    mouseWheel(event: WheelEvent){     
        let scale = 1 - event.deltaY / this.mouseScrollDivider;
        this.scale(scale, event.offsetX - this.element.offsetWidth/2, event.offsetY - this.element.offsetHeight/2);
        event.stopPropagation(); 
        event.preventDefault();
    }
    
    //DRAGGING
    dragStart(x: number, y: number){
        this.lastPosition = {x: x, y: y};
    }
    
    dragMove(x: number, y: number){
        let pos = this.inverseTransform(x - this.lastPosition.x,y - this.lastPosition.y);
        //@ts-ignore
        const event = new Event('Fortles.Gesture.move', {position: pos});
        this.element.dispatchEvent(event);
        this.transform.move(pos.x, pos.y);
        this.lastPosition.x = x;
        this.lastPosition.y = y;
        this.transform.update();
    }
    
    /**
     * Scales the element around an origin
     * @param scale Scale of the element.
     * @param x Origin X coordinate
     * @param y Origin Y coordinate
     */
    scale(scale: number, x: number, y: number){
        this.transform.move(x, y);
        this.transform.scale(scale);
        this.transform.move(-x, -y);
        this.transform.update();
    }
   
    inverseTransform(x: number, y: number){
        let element: HTMLElement|null = this.element;
        while(element && !element.classList.contains("f-gesture")){
            if(this.transform){
                ({x, y} = this.transform.inverseTransform(x,y));
            }
            element = element.parentElement;
        }
        return {x:x, y:y};
    }
    
    
    getTransform(): Transform{
        return this.transform;
    }
}