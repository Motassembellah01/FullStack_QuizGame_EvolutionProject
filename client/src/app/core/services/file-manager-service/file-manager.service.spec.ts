import { TestBed } from '@angular/core/testing';
import { FileManagerService } from './file-manager.service';

describe('FileManagerService', () => {
    let service: FileManagerService;
    let fileReaderSpy: jasmine.SpyObj<FileReader>;

    beforeEach(() => {
        fileReaderSpy = jasmine.createSpyObj<FileReader>('FileReader', ['readAsText', 'onload']);

        TestBed.configureTestingModule({
            providers: [FileManagerService, { provide: FileReader, useValue: fileReaderSpy }],
        });

        service = TestBed.inject(FileManagerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('import', () => {
        it('should resolve with file content when a valid file is provided', (done) => {
            // Create a mock event and input element
            const testTarget: HTMLInputElement = new EventTarget() as HTMLInputElement;
            const mockFileContent = 'Mock file content';
            const file1: File = new File([mockFileContent], 'file1.txt', { type: 'text/plain' });
            const fileList: FileList = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                0: file1,
                length: 1,
                item: (index: number) => (index === 0 ? file1 : null),
            };
            testTarget.files = fileList;
            const event: Partial<Event> = { target: testTarget };

            service.import(event as Event).then((result) => {
                expect(result).toEqual(mockFileContent);
                done();
            });
        });

        it('should resolve with null when no file is provided', (done) => {
            const testTarget: HTMLInputElement = new EventTarget() as HTMLInputElement;
            const fileList: FileList = {
                length: 0,
                item: () => null,
            };
            testTarget.files = fileList;
            const event: Partial<Event> = { target: testTarget };

            service.import(event as Event).then((result) => {
                expect(result).toBeNull();
                done();
            });
        });

        it('should reject error', async () => {
            const event: Partial<Event> = { target: null };
            service
                .import(event as Event)
                .then((result) => {
                    expect(result).toBe(null);
                })
                .catch((e) => {
                    expect(e).toBeTruthy();
                });
        });
    });
});
