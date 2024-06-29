import { CodeGenerator } from "./codegen.js";

function enableControls() {
    toggleElements([generateBtn, textFigmaUrl, textFigmaApiToken, textFigmaFileKey, textPageName, textFrameName], false);
    generateBtn.textContent = 'Generate';
}

function disableControls() {
    toggleElements([generateBtn, textFigmaUrl, textFigmaApiToken, textFigmaFileKey, textPageName, textFrameName], true);
}

function showElement(element) {
    if (element.classList.contains('hidden')) {
        element.classList.remove('hidden');
    }
}

function hideElement(element) {
    if (!element.classList.contains('hidden')) {
        element.classList.add('hidden');
    }
}

function toggleElements(elements, disable) {
    for (const element of elements) {
        if (disable) {
            element.classList.add('disabled');
        } else {
            element.classList.remove('disabled');
        }
    }
}

function valueFromQueryParam(urlParams, elements) {
    for (const element of elements) {
        if (urlParams.has(element.id)) {
            element.value = urlParams.get(element.id);
        }
    }
}



function reset() {
    // clear the generated codes and unset the highlighted attribute
    ymlBlob.textContent = '';
    if (ymlBlob.attributes.getNamedItem('data-highlighted')) {
        ymlBlob.attributes.removeNamedItem('data-highlighted');
    }
    functionBlob.textContent = '';
    if (functionBlob.attributes.getNamedItem('data-highlighted')) {
        functionBlob.attributes.removeNamedItem('data-highlighted');
    }
    codeBlob.textContent = '';
    if (codeBlob.attributes.getNamedItem('data-highlighted')) {
        codeBlob.attributes.removeNamedItem('data-highlighted');
    }
    // remove all the children from the download items list
    while (downloadItems.firstChild) {
        downloadItems.removeChild(downloadItems.firstChild);
    }
    // hide the results
    hideElement(results);
    // hide the erros
    hideElement(errors);
    // revoke all the image urls
    for (const url of urlList) {
        URL.revokeObjectURL(url);
    }
}


const textFigmaUrl = document.getElementById('figma_url');
const textFigmaApiToken = document.getElementById('figma_api_token');
const textFigmaFileKey = document.getElementById('figma_file_key');
const textPageName = document.getElementById('page_name');
const textFrameName = document.getElementById('frame_name');

const urlParams = new URLSearchParams(window.location.search);
valueFromQueryParam(urlParams, [textFigmaUrl, textFigmaApiToken, textFigmaFileKey, textPageName, textFrameName]);

const ymlBlob = document.getElementById('ymlBlob');
const functionBlob = document.getElementById('functionBlob');
const codeBlob = document.getElementById('codeBlob');
const results = document.getElementById('results');
const errors = document.getElementById('errors');
const errorBlob = document.getElementById('errorBlob');

const generateBtn = document.getElementById('generateBtn');

const downloadItems = document.getElementById('download_items');

const copyResultButtons = document.getElementsByClassName('copy_result_button');
for (const btn of copyResultButtons) {
    btn.addEventListener('click', (e) => {
        const targetFiledName = e.currentTarget.attributes["target-filed"].value;
        // Get the text field
        var copyText = document.getElementById(targetFiledName);
        // Copy the text inside the text field
        navigator.clipboard.writeText(copyText.innerText);
    });
}

const urlList = new Array();

enableControls();
hideElement(results);
hideElement(errors);

generateBtn.addEventListener('click', () => {
    reset();
    disableControls();
    generateBtn.textContent = 'Generating...';

    const gen = new CodeGenerator(textFigmaUrl.value, textFigmaApiToken.value, textFigmaFileKey.value, textPageName.value, textFrameName.value);
    console.log('Generating code...');
    gen.generate().then((generatedData) => {
        ymlBlob.textContent = generatedData['ymlBlob'];
        functionBlob.textContent = generatedData['functionBlob'];
        codeBlob.textContent = generatedData['codeBlob'];
        let filesInfo = [];
        for (const imageFile of generatedData['downloadedFiles']) {
            // create the url for the image file
            let blob = new Blob( [ imageFile.dataBuffer ], { type: imageFile.mimeType } );
            var imageUrl = URL.createObjectURL( blob );
            // create the list item for the file
            const liNode = document.createElement('li');
            liNode.innerHTML = `
                <div class="item_info_group">
                    <img class="icon" src="${imageUrl}" >
                    <div>
                        <span class="file_title">${imageFile.fileName}</span>
                        <br/>
                        <span class="file_info">${imageFile.dataBuffer.byteLength} bytes | ${imageFile.mimeType}</span>
                    </div>
                </div>
            `;
            // create the download button for downloading the image file
            const downloadButton = document.createElement('button');
            downloadButton.innerText = 'Download';
            downloadButton.addEventListener('click', () => {
                // create a temporary a element for downloading the file
                const linkElement = document.createElement('a');
                linkElement.href = imageUrl;
                linkElement.download = imageFile.fileName;
                document.body.appendChild(linkElement);
                linkElement.click();
                // clean up
                document.body.removeChild(linkElement);
            });
            liNode.appendChild(downloadButton);
            downloadItems.appendChild(liNode);
        }
        console.log('');
        console.log(`Done. (${generatedData['generateTime']}s)`);

        // do the code highlight
        hljs.highlightAll();
        // re-enable the controle and show the results
        enableControls();
        showElement(results);
    }).catch((err) => {
        enableControls();
        showElement(errors);
        errorBlob.textContent = err;
        console.error(err);
    });

    return false;
});
