import { BaseElement } from "./base_element.js";

export const ParamTypes = Object.freeze({
    string: 'std::string',
    int: 'int',
    float: 'float',
    unknown: 'UNKNOWN!',
});

export class FuncParam {
    name = '';
    type = ParamTypes.unknown;

    constructor(name, type) {
        this.name = name;
        this.type = type;
    }

    toString() {
        return `${this.type} ${this.name}`;
    }
}

export class Function extends BaseElement {
    parameters = new Array();
    componentId = '';
    body = new Array();

    constructor(name, componentId) {
        super(name);
        this.componentId = componentId;
    }

    /**
     * Adds a parameter to the function
     * @param {string} param Name of the parameter to add
     * @param {ParamTypes} type Type of the parameter
     * @returns The newly added parameter
     */
    addParameter(param, type) {
        const paramName = `${this.sanitize(param.toLowerCase())}`;
        const newParam = new FuncParam(paramName, type);
        this.parameters.push(newParam);

        return newParam;
    }

    addLine(...line) {
        this.body.push(...line);
    }


    toString() {
        return ''.concat(
            `// component: ${this.componentId} - ${this.originalName}\r\n`,
            `void ${this.name}(${this.parameters.join(', ')}) {`,
            '  ', this.body.join('\r\n  '), '\r\n',
            '}\r\n'
        );
    }
}