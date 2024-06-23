//import { Glyph } from "./glyph.js";

import { BaseElement } from "./base_element.js";

export class Font extends BaseElement{
    size = -1;
    id = ''
    glyphs = new Array();
    fileName = '#ADD FONT FILE NAME HERE#';
    static standardGlyphSet = '!"%()+=,-_.:;°0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz\'/&|';

    constructor(name, size) {
        super(name);
        this.size = size;
        this.id = Font.getId(this.name, size);
    }

    addGlyphs(text) {
        const glyphs = Font.sliceText(text);
        for (let i = 0; i < glyphs.length; i++) {
            const element = glyphs[i];
            if (!this.glyphs.includes(element)) {
                this.glyphs.push(element);
            }
        }
    }

    static sliceText(text) {
        const ret = new Array();
        let i = 0;
        while (i < text.length) {
            let glyph = null;
            if (text[i].charCodeAt() > 255) {
                // it is a double character == unicode
                glyph = `\\U${(text[i] + text[i + 1]).codePointAt().toString(16).toUpperCase().padStart(8, '0')}`;
                i++;
            } else {
                glyph = text[i];
            }

            ret.push(glyph);

            i++;
        }

        return ret;
    }

    static isAscii(char) {
        const charCode = char.charCodeAt(0);
        return charCode >= 32 && charCode < 127;
    }

    static getId(name, size) {
        return `font_${name}_${size}`;
    }

    toYml() {
        const glyphList = new Array();
        this.glyphs.forEach(element => {
            glyphList.push(`
    - '${element.toString()}'`);
        });

        return `
# ${this.name}
- file: '${this.fileName}'
  id: ${this.id}
  size: ${this.size}
  glyphs: ${glyphList.join('')}
`
    }
}