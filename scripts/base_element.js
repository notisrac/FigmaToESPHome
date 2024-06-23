export class BaseElement {
    name = '';
    originalName = '';

    constructor(name) {
        this.originalName = name;
        this.name = this.sanitize(name);
    }

    sanitize(text) {
        // sanitize name
        return text.replace(/[^a-z]/gi, '');
    }
}