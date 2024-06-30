import { FigmaClient } from "./figma_client.js";
import { Document } from "./document.js";
import { ImageFile } from "./image_file.js";
import { Font } from "./font.js";
import { Function, FuncParam, ParamTypes } from "./function.js";
import { Node } from "./node.js";
import { GeneratedCode } from "./generated_code.js";


/*
{
    "document": {
        "id": "0:0",
        "name": "Document",
        "type": "DOCUMENT",
        "scrollBehavior": "SCROLLS",
        "children": [
        ]
    },
    "components": {
        "40:87": {
            "key": "9d70b403...",
            "name": "Icons/sofa",
            "description": "",
            "remote": false,
            "documentationLinks": []
        }
    },
    "componentSets": {},
    "schemaVersion": 0,
    "styles": {},
    "name": "home assistant display",
    "lastModified": "2024-06-10T08:10:56Z",
    "thumbnailUrl": "https://s3-alpha.figma.com/thumbnails/....",
    "version": "5958322934",
    "role": "owner",
    "editorType": "figma",
    "linkAccess": "view"
}
*/

export class CodeGenerator{
    figmaUrl = null
    apiToken = null
    fileKey = null
    pageName = null
    frameName = null

    fonts = new Object();
    imageFiles = new Array();
    generatedCode = new GeneratedCode();

    frame = null;
    document = null;

    figmaClient = null;
    
    /** Id list of all the components that have been processed */
    processedComponents = new Array();

    constructor(figmaUrl, apiToken, fileKey, pageName, frameName){
        this.figmaUrl = figmaUrl;
        this.apiToken = apiToken;
        this.fileKey = fileKey;
        this.pageName = pageName;
        this.frameName = frameName;

        // create figma client
        this.figmaClient = new FigmaClient(this.figmaUrl, this.apiToken);
    }

    getFont(name, size) {
        let fontId = Font.getId(name, size);
        if (!Object.getOwnPropertyNames(this.fonts).includes(fontId)) {
            this.fonts[fontId] = new Font(name, size);
        }

        return this.fonts[fontId];
    }

    getVariableName(name) {
        if (!name.startsWith('var_')) {
            return null;
        }

        return name.substring('var_'.length);
    }

    /**
     * Fetches the generated function for the component. If it does not exists yet, then creates it
     * @param {string} componentId id of the component
     * @param {JSON} parentNode the parent node of the component
     * @returns the Function object
     */
    async getFunction(componentId, parentNode) {
        let func = this.generatedCode.getFunction(componentId);
        if (!func) {
            await this.processComponent(this.document.getComponentById(componentId), parentNode, this.generatedCode);
        }
        func = this.generatedCode.getFunction(componentId);

        return func;
    }

    async addImageFile(name, fileName, dataBuffer, width, height) {
        const imageFile = await ImageFile.fromArrayBuffer(name, fileName, dataBuffer, width, height);
        this.imageFiles.push(imageFile);
        return imageFile;
    }

    async generate() {
        const startTime = Date.now();
        // fetch figma document
        const document = await this.figmaClient.getDocument(this.fileKey);
        // start generating code
        await this.processDocument(document, this.pageName, this.frameName);

        // download image files
        const downloadedFiles = this.imageFiles;

        const generatedWithMessage = 'Generated with https://notisrac.github.io/FigmaToESPHome/'

        // generate code lines from the functions
        const functionBlob = `// ${generatedWithMessage}\r\n\r\n`
         + '#include <string>\r\n'
         + this.generatedCode.functions.join('\r\n');

        // generate code lines blob
        let codeBlob = `// ${generatedWithMessage}\r\n\r\n` + '// TODO assign values to these:\r\n';
        codeBlob += this.generatedCode.variableLines.join('\r\n');
        codeBlob += '\r\n';
        codeBlob += this.generatedCode.codeLines.join('\r\n');

        // generate code from yml lines
        let ymlBlob = `# ${generatedWithMessage}\r\n\r\n`;
        // generate yml lines for the images
        ymlBlob += 'image:';
        for (const img of this.imageFiles) {
            ymlBlob += img.toYml();
        }
        ymlBlob += '\r\n\r\n';
        // generate yml lines from the fonts
        ymlBlob += 'font:';
        Object.getOwnPropertyNames(this.fonts).forEach(fontName => {
            ymlBlob += this.fonts[fontName].toYml();
        });

        const endTime = Date.now();

        const generatedData = {
            'ymlBlob': ymlBlob,
            'functionBlob': functionBlob,
            'codeBlob': codeBlob,
            'downloadedFiles': downloadedFiles,
            'generateTime': ((endTime - startTime) / 1000)
        };

        //console.log(generatedData);

        return generatedData;
    }
    
    async processDocument(document, pageName, frameName) {
        // pre-process the figma document
        this.document = new Document(document, pageName, frameName);
        this.frame = this.document.frame;
    
        // TODO add background color/fill

        this.generatedCode.addVariable('auto x = 0;');
        this.generatedCode.addVariable('auto y = 0;');
        
        // process all the nodes on the frame
        await this.processNode(this.frame, this.frame, this.generatedCode);
    }
    
    /**
     * processes all the children in a single node
     * @param {*} currentNode the node
     * @param {*} parentNode the parent of the node
     * @param {Array} generatedCode 
     * @param {Array} skipList list of ids to skip
     * @returns nothing
     */
    async processNode(currentNode, parentNode, generatedCode, skipList = []) {
        if (!currentNode) {
            return;
        }
        const children = currentNode['children'];
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            if (skipList.includes(node['id'])) {
                continue;
            }
            const nodeType = node['type'];
            switch (nodeType) {
                case 'TEXT':
                    await this.processText(node, currentNode, generatedCode);
                    break;
                case 'LINE':
                    await this.processLine(node, currentNode, generatedCode);
                    break;
                case 'RECTANGLE':
                    await this.processRectangle(node, currentNode, generatedCode);
                    break;
                case 'COMPONENT':
                    await this.processComponent(node, currentNode, generatedCode);
                    break;
                case 'INSTANCE':
                    if (skipList.includes(node['componentId'])) {
                        continue;
                    }
                    await this.processInstance(node, currentNode, generatedCode);
                    break;
                case 'GROUP':
                    await this.processGroup(node, currentNode, generatedCode, skipList);
                    break;
                default:
                    break;
            }
        }
    }    
    

    
    /*
     * TYPE SPECIFIC PROCESSING FUNCTIONS
     */ 
    
    /**
     * Processes a line node: generates the rendering code for it
     * @param {JSON} node the LINE node
     * @param {JSON} parentNode the parent node
     * @param {GeneratedCode} generatedCode the object containing the generated code, where the new lines should be added to
     */
    async processLine(node, parentNode, generatedCode) {
        const thisNode = Node.create(node, parentNode, 'LINE');
    
        generatedCode.addCode('');
        generatedCode.addCode(`// ${thisNode.name}`);
        generatedCode.addCode(`it.line(x + ${thisNode.xToString}, y + ${thisNode.yToString}, ${thisNode.width}, ${thisNode.height});`);
    }    

    async processRectangle(node, parentNode, generatedCode) {
        const thisNode = Node.create(node, parentNode, 'RECTANGLE');
    
        generatedCode.addCode('');
        generatedCode.addCode(`// ${thisNode.name}`);
        if (Array.isArray(node['fills']) && node['fills'].length) {
            for (const fill of node['fills']) {
                const fillyType = fill['type'];
                if (fillyType === 'SOLID') {
                    const color = fill['color'];
                    // has something to fill the rect with
                    generatedCode.addCode(`auto ${thisNode.name}_color = Color(${(Math.round(color['r'] * 255))}, ${(Math.round(color['g'] * 255))}, ${(Math.round(color['b'] * 255))});`)
                    generatedCode.addCode(`it.filled_rectangle(x + ${thisNode.xToString}, y + ${thisNode.yToString}, ${thisNode.width}, ${thisNode.height}, ${thisNode.name}_color);`);
                } else if (fillyType === 'IMAGE') {
                    // display an image
                    await this.processImage(thisNode.name, thisNode.xToString, thisNode.yToString, thisNode.width, thisNode.height, fill['imageRef'], generatedCode);
                } else {
                    console.warn(`Unsupported fill type "${fillyType}"`);
                }
            };
        } else {
            generatedCode.addCode(`it.rectangle(x + ${thisNode.xToString}, y + ${thisNode.yToString}, ${thisNode.width}, ${thisNode.height});`);
        }


        // fill types
        /*
            "fills": [
                {
                    "blendMode": "NORMAL",
                    "type": "IMAGE",
                    "scaleMode": "FILL",
                    "imageRef": "045ff28af90609c81bc9c4e0c179345d3a3bcd0f"
                },
                {
                    "opacity": 0.37000000476837158, // optional
                    "blendMode": "NORMAL",
                    "type": "SOLID",
                    "color": {
                        "r": 0.85098040103912354,
                        "g": 0.85098040103912354,
                        "b": 0.85098040103912354,
                        "a": 1.0
                    }
                }
            ],
            "strokes": [
                {
                    "blendMode": "NORMAL",
                    "type": "SOLID",
                    "color": {
                        "r": 0.0,
                        "g": 0.0,
                        "b": 0.0,
                        "a": 1.0
                    }
                }
            ],
        */
    }

    async processImage(name, x, y, width, height, imageRef, generatedCode) {
        // download the file
        const imageDataBuffer = await this.figmaClient.downloadImage(imageRef, this.fileKey);
        const imageFile = await this.addImageFile(name, name, imageDataBuffer, width, height);

        // generatedCode.addCode('');
        generatedCode.addCode(`it.image(x + ${x}, y + ${y}, id(${imageFile.imageId}));`);
    }

    async processText(node, parentNode, generatedCode) {
        const thisNode = Node.create(node, parentNode, 'TEXT');
    
        const variableName = this.getVariableName(thisNode.name);
        const characters = node['characters'];
        const fontName = node['style']['fontPostScriptName'];
        const fontSize = node['style']['fontSize'];
        const font = this.getFont(fontName, fontSize);
        // collect all the characters so we can optimize the font
        font.addGlyphs(characters);

        if (variableName) {
            generatedCode.addVariable(`auto ${variableName} = ...;`);
        }
    
        generatedCode.addCode('');
        generatedCode.addCode(`// ${thisNode.name}`);
        generatedCode.addCode(`it.printf(x + ${thisNode.xToString}, y + ${thisNode.yToString}, id(${font.id}), ${(variableName == null) ? `'${Font.sliceText(characters).join('')}'` : `${variableName}`});`);
        // Syntax is always: it.print(<x>, <y>, <font>, [color=COLOR_ON], [align=TextAlign::TOP_LEFT], <text>)
        // it.printf(0, 0, id(my_font), "The sensor value is: %.1f", id(my_sensor).state);

        // TODO add align
        // TODO add font color
    } 


    async processComponent(node, parentNode, generatedCode) {
        const thisNode = Node.create(node, parentNode, 'COMPONENT');

        // "id": "40:92"

        const func = new Function(thisNode.name, thisNode.id);
        // standard parameters
        func.addParameter('x', ParamTypes.int);
        func.addParameter('y', ParamTypes.int);
        func.addParameter('width', ParamTypes.int);
        func.addParameter('height', ParamTypes.int);
        // collect the list of ids to skip - this prevents adding the function call to the default instance swap value
        const skipList = new Array();
        // parameters
        const componentPropertyDefinitions = thisNode.source['componentPropertyDefinitions'];
        if (componentPropertyDefinitions) {
            const propNames = Object.getOwnPropertyNames(componentPropertyDefinitions);
            for (let j = 0; j < propNames.length; j++) {
                const paramNode = componentPropertyDefinitions[propNames[j]];
                const newParam = func.addParameter(propNames[j], ParamTypes.string);
                if (paramNode['type'] === 'INSTANCE_SWAP') {
                    // handle instance swap
                    const defaultValue = paramNode['defaultValue'];
                    const preferredValues = paramNode['preferredValues'];
                    const valueFuncList = {};
                    // collect all the instances
                    for (let i = 0; i < preferredValues.length; i++) {
                        const valueType = preferredValues[i]['type'];
                        if (valueType !== 'COMPONENT') {
                            console.warn(`Unsupported preferredValue type "${valueType}" in node "${thisNode.name}" (id: ${thisNode.id})`);
                            continue;
                        }
                        // get the component based on the key
                        const key = preferredValues[i]['key'];
                        const component = this.document.getComponentByKey(key);
                        const componentId = component['id'];
                        skipList.push(componentId);
                        if (!component) {
                            throw new Error(`Could not find component with key "${key}"`);
                        }
                        if (componentId === thisNode.id) {
                            throw new Error(`Component "${thisNode.name}" cannot be the in it's own preferred values list!`);
                        }
                        // fetch the function for the component
                        const funcForComponent = await this.getFunction(componentId, thisNode.source);
                        if (!funcForComponent) {
                            throw new Error(`Got empty function for Component "${thisNode.name}" (${thisNode.id})!`);
                        }
                        valueFuncList[component['name']] = funcForComponent;
                    }
                    // create the "switch case"
                    func.addLine('');
                    const valueNames = Object.getOwnPropertyNames(valueFuncList);
                    if (valueNames.length == 0) {
                        continue;
                    }
                    for (let k = 0; k < valueNames.length; k++) {
                        const componentName = valueNames[k];
                        const funcToCall = valueFuncList[componentName];
                        // remove the path from the component name: "Icons/Weather/weather-lightning-rainy" -> "weather-lightning-rainy"
                        const shortenedComponentName = componentName.slice(componentName.lastIndexOf('/') + 1);
                        func.addLine(`${(k > 0) ? 'else ' : ''}if (${newParam.name} == "${shortenedComponentName}") {`);
                        func.addLine(`  // ${componentName}`);
                        func.addLine(`  ${funcToCall.name}(x, y, ${funcToCall.parameters.slice(2).map((p) => p.name).join(', ')});`);
                        func.addLine('}');
                    };
                    // handle the default value
                    const funcForDefaultComponent = await this.getFunction(defaultValue, thisNode.source);
                    func.addLine('else {');
                    func.addLine('  // default');
                    func.addLine(`  ${funcForDefaultComponent.name}(x, y, ${funcForDefaultComponent.parameters.slice(2).map((p) => p.name).join(', ')});`);
                    func.addLine('}');
                }
            };
        }

        // process all it's children
        const generatedCodeFromChildren = new GeneratedCode();
        // process all the children of this component
        await this.processNode(node, parentNode, generatedCodeFromChildren, skipList);
        // the generated funtions from the children can go straigth into the global list
        generatedCode.addFunction(...generatedCodeFromChildren.functions);
        
        func.addLine(...generatedCodeFromChildren.codeLines);

        generatedCode.addFunction(func);

/*
    "componentPropertyDefinitions": {
        "Humidity#41:1": {
            "type": "TEXT",
            "defaultValue": "78"
        },
        "Temperature#41:0": {
            "type": "TEXT",
            "defaultValue": "23.3"
        },
        "Icon#40:0": {
            "type": "INSTANCE_SWAP",
            "defaultValue": "40:87",
            "preferredValues": [
                {
                    "type": "COMPONENT",
                    "key": "549ccd2528bc04cafec6c1233a603b41a7005c46"
                },
                {
                    "type": "COMPONENT",
                    "key": "93d5221ad8ba56c38f690f98723bc988bc68f3e4"
                },
                {
                    "type": "COMPONENT",
                    "key": "9d70b403178e9566a43f44a04db409f3ef081121"
                },
                {
                    "type": "COMPONENT",
                    "key": "901d77cd828684898a220075321a112609cc799a"
                }
            ]
        }

*/
    }

    async processInstance(node, parentNode, generatedCode) {
        const thisNode = Node.create(node, parentNode, 'INSTANCE');

        const componentId = thisNode.source['componentId'];
        // const overrides = node['overrides'];
        let func = await this.getFunction(componentId, node);
        const funcExtraParams = func.parameters.slice(4).map((p) => p.name);
        if (funcExtraParams) {
            for (let i = 0; i < funcExtraParams.length; i++) {
                const paramName = `${thisNode.sanitizedName}_${funcExtraParams[i]}`;
                generatedCode.addVariable(`auto ${paramName} = ...;`);
                funcExtraParams[i] = paramName;
            }
        }

        generatedCode.addCode('');
        generatedCode.addCode(`// call ${thisNode.name}`);
        generatedCode.addCode(`${func.name}(x + ${thisNode.x}, y + ${thisNode.y}, ${thisNode.width}, ${thisNode.height}${(funcExtraParams.length > 0) ? ', ' + funcExtraParams.join(', ') : ''});`);
    } 

    async processGroup(node, parentNode, generatedCode, skipList) {
        const thisNode = Node.create(node, parentNode, 'GROUP');

        generatedCode.addCode('');
        generatedCode.addCode(`// group ${thisNode.name} (${thisNode.id})`);
        await this.processNode(node, parentNode, generatedCode, skipList);
    } 

}
