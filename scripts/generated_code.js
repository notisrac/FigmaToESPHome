
export class GeneratedCode {
    functions = new Array();
    codeLines = new Array();
    variableLines = new Array();

    getFunction(componentId) {
        return this.functions.find((element) => element && element.componentId === componentId);
    }

    addFunction(func) {
        this.functions.push(func);
    }

    addCode(...line) {
        this.codeLines.push(...line);
    }

    addVariable(...line) {
        this.variableLines.push(...line);
    }
}
