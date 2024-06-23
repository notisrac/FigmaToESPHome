import { BaseElement } from "./base_element.js";
import {fileTypeFromBuffer} from 'https://cdn.jsdelivr.net/npm/file-type@19/+esm'

export class File extends BaseElement {
    fileName = '';
    dataBuffer = [];
    extension = '';
    mimeType = '';

    constructor(name, fileName, dataBuffer, extension, mimeType) {
        super(name);
        this.dataBuffer = dataBuffer;
        this.fileName = fileName;
        this.extension = extension;
        this.mimeType = mimeType;
    }

    static async fromArrayBuffer(name, fileName, dataBuffer) {
        const fileType = await fileTypeFromBuffer(dataBuffer);
        return new File(name, `${fileName}.${fileType.ext}`, dataBuffer, fileType.ext, fileType.mime);
    }


    toString() {
        return `id: ${this.name}, name: "${this.fileName}", length: ${this.dataBuffer.byteLength}bytes, extension: "${this.extension}", mimeType: "${this.mimeType}"`;
    }
}