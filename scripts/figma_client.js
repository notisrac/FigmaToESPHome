export class FigmaClient{
    #baseUrl = '';
    #apiToken = '';

    constructor(baseUrl, apiToken){
        this.#baseUrl = baseUrl;
        this.#apiToken = apiToken;
    }

    async #get(url, fileKey){
        const buffer = await this.#getRaw(`${this.#baseUrl}/${fileKey}/${url}`);
        const decoder = new TextDecoder();
        const str = decoder.decode(buffer);
        return JSON.parse(str);
    }

    async #getRaw(url){
        const request = new Request(url);
        request.headers.append('X-Figma-Token', this.#apiToken);

        const response = await fetch(request);
        return await response.arrayBuffer();
    }

    async getDocument(fileKey){
        return await this.#get('', fileKey);
    }

    /**
     * Downloads an image file from the Figma servers
     * @param {string} imageId id of the image file
     * @param {string} fileKey key of the figma file
     * @returns arrayBuffer with the file contents
     */
    async downloadImage(imageId, fileKey){
        /*
            {
                "error": false,
                "status": 200,
                "meta": {
                    "images": {
                        "1eb8125...": "https://s3-alpha-sig.figma.com/img/...",
                        "9a010bc...": "https://s3-alpha-sig.figma.com/img/...",
                        "add963a...": "https://s3-alpha-sig.figma.com/img/...",
                        "045ff28...": "https://s3-alpha-sig.figma.com/img/..."
                    }
                },
                "i18n": null
            }

            https://api.figma.com/v1/files/045ff28af9060..../
            https://api.figma.com/v1/files/pek...bp/images/
        */
        const images = await this.#get('images', fileKey);
        const downloadUrl = images['meta']['images'][imageId];
        // download the file
        return await this.#getRaw(downloadUrl);
    }
};