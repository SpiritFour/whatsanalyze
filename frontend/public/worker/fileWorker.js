importScripts('https://cdn.jsdelivr.net/npm/jszip/dist/jszip.min.js');

const readFile = async (file) => {
    const files = [];

    if (file.name.endsWith('.zip')) {
        // Read as ArrayBuffer for JSZip
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        for (const fileName of Object.keys(zip.files)) {
            const entry = zip.files[fileName];

            files.push({
                name: fileName,
                isDirectory: entry.dir,
            });
        }
    } else if (file.type === 'text/plain') {
        files.push(file);
    } else {
        throw new Error('Unsupported file type')
    }

    return files;
}

const analyzeFile = async (dataFile) => {
    return {data: 'huhu', dataFile}
}

self.addEventListener('message', async (event) => {
    const {file, JSZIP} = event.data;

    self.postMessage({state: 'WORKING'});

    try {
        const dataFile = await readFile(file);
        const data = await analyzeFile(dataFile);

        self.postMessage({response: {data}, state: "DONE"});
    } catch (error) {
        self.postMessage({response: {message: error.message}, state: "ERROR"});
    }

    self.postMessage({response: {message: 'Web worker failed.'}, state: "ERROR"});
});
