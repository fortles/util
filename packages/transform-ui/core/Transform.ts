export interface Vector2d{
    x: number,
    y: number
}

export class Transform{

    /*
     *        0  1  2  3  4  5
     * matrix(a, b, c, d, x, y)
     * a c x
     * b d y
     * 0 0 1
     */
    protected m = [1, 0, 0, 1, 0, 0];

    /** Inverse of the matrix */
    protected i = [1, 0, 0, 1, 0, 0];

    /**  The bound html eleent */
    element: HTMLElement;
    
    /**
     * Creates and bounds a dom element to the transofrmation logic
     * @param element 
     */
    constructor(element: HTMLElement){
        //element.dataset.transform = this;
        this.element = element;
    }
    
    /**
     * Returns the relative position of the current dom, moved by this class
     * @returns 
     */
    public getPosition(): Vector2d{
        return {x: this.m[4], y: this.m[5]};
    };
    
    /**
     * The x coordinate of the element
     * @returns 
     */
    public getX(): number{
        return this.m[4];
    }
    
    /**
     * The y coordinate of the element
     * @returns 
     */
    public getY(): number{
        return this.m[5];
    }
    
    /**
     * Adds the position to the matrix without updating the underlying html element.
     * Call update() after all transformations are applied.
     * @param x X coordinate of the element
     * @param y Y coordinate of the element.
     */
    public move(x: number, y: number): void{
        var [A, B, C, D, X, Y] = this.m;
        // Use a simplified multiplication, as other fields are not used here.
        this.m[4] = A*x + C*y + X;
        this.m[5] = B*x + D*y + Y;
    };

    /**
     * Sets the position to the matrix without updating the underlying html element.
     * Call update() after all transformations are applied.
     * @param x X coordinate of the element
     * @param y Y coordinate of the element.
     */
    public setPosition(x: number, y: number): void{
        this.m[4] = x;
        this.m[5] = y;
    };
    
    /**
     * Sets the scale to the matrix without updating the underlying html element.
     * Call update() after all transformations are applied
     * @param a Scale of the element. 1 is the original scale.
     * @param d If provided, sets the horizontal scale 
     */
    public setScale(a: number, d?: number){
        d = d || a;
        this.m[0] = a;
        this.m[3] = d;
    };
    /**
     * Multiplies the matrix without updating the underlying html element.
     * Call update() after all transformations are applied
     * @param a Scale of the element. 1 is the original scale.
     * @param d If provided, sets the horizontal scale 
     */
    public scale(a: number, d: number): void{
        d = d || a;
        this.multiply(
            a, 0, 0,
            0, d, 0
        );//0, 0, 1
    };

    /**
     * Multiplies the internal matrix with the provided values
     * Coordinates of the matrix:
     * a c x
     * b d y
     * 0 0 1
     * @param a 0, 0
     * @param c 1, 0
     * @param x 2, 0
     * @param b 0, 1
     * @param d 0, 2
     * @param y 0, 3
     */
    public multiply(a: number, c: number, x: number, b: number, d: number, y: number): void{
        var [A, B, C, D, X, Y] = this.m;
        this.m[0] = A*a + C*b;
        this.m[1] = B*a + D*b;
        this.m[2] = A*c + C*d;
        this.m[3] = B*c + D*d;
        this.m[4] = A*x + C*y + X;
        this.m[5] = B*x + D*y + Y;
    };

    /**
     * Inverse transforms a coordinate by ithe internal inverse matrix.
     * Important note that the inverse matrix is calculated on @link  update or on updateInverse.
     * @param x X coordinate
     * @param y Y coordinate
     * @returns The inverse transformed coordinate
     */
    public inverseTransform(x: number, y: number){
        var [A, B, C, D, X, Y] = this.i;
        return {
            x: A*x + C*y,
            y: B*x + D*y
        };
    };
    
    /**
     * Updates the ekement by the matrix, and calulates the inverse matrix.
     */
    public update(): void{
        this.updateInverse();
        this.element.style.transform = "matrix(" + this.m + ")";
    };

    /**
     * Updates the inverse matrix.
     */
    public updateInverse(): void{
        const [a, b, c, d, x, y] = this.m;
        const det = a*d - b*c;
        this.i = [
             d/det, -b/det, -c/det,  a/det,  -(d*x - c*y)/det, (b*x - a*y)/det
        ];
    }
}