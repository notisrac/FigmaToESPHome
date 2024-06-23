import { BaseElement } from "./base_element.js";

export class Function extends BaseElement {
    parameters = new Array();
    componentId = '';
    body = new Array();

    constructor(name, componentId) {
        super(name);
        this.componentId = componentId;
    }

    addParameter(param) {
        const paramName = `${this.sanitize(param.toLowerCase())}`;
        this.parameters.push(paramName);
        return paramName;
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