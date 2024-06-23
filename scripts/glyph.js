// export class Glyph{
//     name = '';
//     value = '';

//     constructor(name, value) {
//         this.name = name;
//         this.value = value;
//     }

//     static isAscii(char) {
//         const charCode = char.charCodeAt(0);
//         return charCode >= 32 && charCode < 127;
//     }

//     toString() {
//         // for all non standard ascii characters include their codes
//         let chars = new Array();
//         for (let i = 0; i < this.value.length; i++) {
//             if (Glyph.isAscii(this.value[i])) {
//                 chars.push(this.value[i]);
//             } else {
//                 chars.push(`\\U${charCode}`);
//             }
//         }

//         return `"${chars.join()}" # ${this.name}`;
//     }
// }