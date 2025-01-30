import JSZip from 'jszip';

export class FileReader {
  static async readFile(file: File): Promise<string> {
    if (file.name.endsWith('.zip')) {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      for (const fileName of Object.keys(zip.files)) {
        const entry = zip.files[fileName];
        if (!entry.dir && fileName.endsWith('.txt') && !fileName.includes('__MACOSX/')) {
          return await entry.async('text');
        }
      }
    }
    if (file.type === 'text/plain') {
      return await file.text();
    }
    throw new Error('Unsupported file type');
  }
}