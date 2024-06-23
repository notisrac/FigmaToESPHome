export class Document{
    document = null;

    frame = null;
    components = new Array();
    componentLookup = new Array();

    // frame x and y are the zero points from where to originate all items
    frameX = 0;
    frameY = 0;
    frameWidth = 0;
    frameHeight = 0;

    constructor(document, pageName, frameName) {
        this.document = document;
        
        this.frame = this.getFrameFromDocument(document, pageName, frameName);
        this.components = this.getComponentsFromDocument(document['document']);
        // this is the components section at the end of the document
        this.componentLookup = this.getComponentLookupFromDocument(document);
    
        // frame x and y are the zero points from where to originate all items
        this.frameX = this.frame['absoluteBoundingBox']['x'];
        this.frameY = this.frame['absoluteBoundingBox']['y'];
        this.frameWidth = this.frame['absoluteBoundingBox']['width'];
        this.frameHeight = this.frame['absoluteBoundingBox']['height'];
    }

    /**
     * Fetches the target frame from the document
     * @param {JSON} document the Figma document
     * @param {string} pageName the name of the page the target frame is on
     * @param {string} frameName name of the frame the designs is on
     * @returns the frame
     */
    getFrameFromDocument(document, pageName, frameName) {
        if (!('document' in document) || !('children' in document['document'])) {
            throw new Error('Invalid document from Figma API!');
        }

        // try to get the canvas/page
        let canvas = null;
        document['document']['children'].forEach(node => {
            if (node['name'] === pageName && node['type'] === 'CANVAS') {
                canvas = node;
            }
        });
        if (canvas == null) {
            throw new Error(`Cannot find page with name "${pageName}"!`);
        }

        // try to get the frame
        let frame = null;
        canvas['children'].forEach(node => {
            if (node['name'] === frameName && node['type'] === 'FRAME') {
                frame = node;
            }
        });
        if (frame == null) {
            throw new Error(`Cannot find frame with name "${frameName}"!`);
        }

        return frame;
    }

    
    /**
     * Fetches all the components from the whole document
     * @param {JSON} document the Figma document
     * @returns the components of the document
     */
    getComponentsFromDocument(document) {
        const ret = new Array();
        if (!('children' in document)) {
            return ret;
        }

        // if the current node is a component, add it
        if (document['type'] === 'COMPONENT') {
            ret.push(document);
        }

        // check all the children
        document['children'].forEach(node => {
            const childComponents = this.getComponentsFromDocument(node);
            ret.push(...childComponents);
        });

        return ret;
    }

    /**
     * Fetches the components section of the document
     * @param {JSON} document the Figma document
     * @returns the components section of the document
     */
    getComponentLookupFromDocument(document) {
        return document['components'];
    }

    getComponentById(componentId) {
        return this.components.find((x) => x['id'] === componentId);
    }

    getComponentByKey(key) {
        let componentId = null;
        const keyList = Object.getOwnPropertyNames(this.componentLookup);
        for (let i = 0; i < keyList.length; i++) {
            const id = keyList[i];
            
            if (this.componentLookup[id]['key'] === key) {
                componentId = id;
            }
        };

        if (!componentId) {
            return null;
        }

        return this.getComponentById(componentId);
    }

    // /**
    //  * Fetches all the components that are actually used - has at least one instance - from the whole document
    //  * @param {JSON} node the Figma document
    //  * @returns the components of the document
    //  */
    // findNode(node, id) {
    //     const ret = null;

    //     if (node['id'] === id) {
    //         // found it
    //         return node;
    //     }

    //     if (!('children' in node)) {
    //         // no children and this is not it = dead end
    //         return ret;
    //     }

    //     // check all the children
    //     for (let i = 0; i < node['children'].length; i++) {
    //         ret = this.findNode(node['children'][i], id);
    //         if (ret) {
    //             break;
    //         }
    //     }

    //     return ret;
    // }

    // getNodeById(id) {
    //     return this.findNode(this.document, id);
    // }
}