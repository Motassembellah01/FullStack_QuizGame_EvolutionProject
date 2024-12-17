import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})

/**
 * Service that reads the imported game and create a JSON object from it
 */
export class FileManagerService {
    private reader: FileReader;

    async import(event: Event): Promise<string | null> {
        return new Promise((resolve, reject) => {
            try {
                const input = event.target as HTMLInputElement;
                if (input && input.files && input.files[0]) {
                    const selectedFile = input.files[0];
                    this.reader = new FileReader();

                    // The function called when the file reading is over
                    this.reader.onload = () => {
                        if (this.reader.result && typeof this.reader.result === 'string') resolve(this.reader.result);
                    };

                    this.reader.readAsText(selectedFile);
                } else resolve(null);
                input.value = '';
            } catch (e) {
                reject(e);
            }
        });
    }
}
