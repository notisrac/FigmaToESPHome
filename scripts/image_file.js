import { BaseElement } from "./base_element.js";
import {fileTypeFromBuffer} from 'https://cdn.jsdelivr.net/npm/file-type@19/+esm'

export class ImageFile extends BaseElement {
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
        this.imageId = `image_${this.name}`;
    }

    static async fromArrayBuffer(name, fileName, dataBuffer) {
        const fileType = await fileTypeFromBuffer(dataBuffer);
        return new ImageFile(name, `${fileName}.${fileType.ext}`, dataBuffer, fileType.ext, fileType.mime);
    }


    toYml() {
        return `
    # ${this.originalName}
    - file: images/${this.fileNamename}.${this.extension}
      id: ${this.imageId}
      resize: ${this.width}x${this.height}
      type: TRANSPARENT_BINARY`;
    }
}