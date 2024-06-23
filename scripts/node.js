export class Node {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    id = null;
    name = null;
    type = null;
    source = null;
    sanitizedName = null;

    constructor(id, name, type, x, y, width, height, source) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.id = id;
        this.name = name;
        this.type = type;
        this.source = source;
        this.sanitizedName = name.replace(/[^a-z]/gi, '')
    }

    get xToString() {
        if (this.x < 0) {
            return `(${this.x})`;
        }

        return this.x;
    }

    get yToString() {
        if (this.y < 0) {
            return `(${this.y})`;
        }

        return this.y;
    }

    static create(node, parentNode, type) {
        if (!node) {
            throw new Error(`Node cannot be empty!`);
        }
        if (!parentNode) {
            throw new Error(`Parent node cannot be empty!`);
        }
        if (!type) {
            throw new Error(`Type cannot be empty!`);
        }

        const id = node['id'];
        const nodeName = node['name'];
        const x = node['absoluteBoundingBox']['x'] - parentNode['absoluteBoundingBox']['x'];
        const y = node['absoluteBoundingBox']['y'] - parentNode['absoluteBoundingBox']['y'];
        const width = node['absoluteBoundingBox']['width'];
        const height = node['absoluteBoundingBox']['height'];
        const nodeType = node['type'];

        if (nodeType !== type) {
            throw new Error(`Node type mismatch: expected "${nodeType}", got "${type}"!`);
        }

        return new Node(id, nodeName, nodeType, x, y, width, height, node);
    }
}