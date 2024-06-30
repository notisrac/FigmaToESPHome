import { BaseElement } from "./base_element.js";
import {fileTypeFromBuffer} from 'https://cdn.jsdelivr.net/npm/file-type@19/+esm'

export class ImageFile extends BaseElement {
    fileName = '';
    dataBuffer = [];
    extension = '';
    mimeType = '';
    width = 0;
    height = 0;

    constructor(name, fileName, dataBuffer, extension, mimeType, width, height) {
        super(name);
        this.dataBuffer = dataBuffer;
        this.fileName = fileName;
        this.extension = extension;
        this.mimeType = mimeType;
        this.imageId = `image_${this.name}`;
        this.width = width;
        this.height = height;
    }

    static async fromArrayBuffer(name, fileName, dataBuffer, width, height) {
        const fileType = await fileTypeFromBuffer(dataBuffer);
        return new ImageFile(name, `${fileName}.${fileType.ext}`, dataBuffer, fileType.ext, fileType.mime, width, height);
    }


    toYml() {
        return `
    # ${this.originalName}
    - file: images/${this.fileName}
      id: ${this.imageId}
      resize: ${this.width}x${this.height}
      type: TRANSPARENT_BINARY`;
    }
}