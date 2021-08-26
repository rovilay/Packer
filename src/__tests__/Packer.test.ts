import Packer from '../Packer';

describe('Packer', (): void => {
    it('should pack items', async (): Promise<void> => {
        const expectedResult: string = ['4', '-', '2,7', '8,9'].join('\n');
        const result: string = await Packer.pack(__dirname + '/__mocks__/test-data.txt');
        expect(result).toEqual(expectedResult);
    });

    it('should fail with APIException error', async (): Promise<void> => {
        expect.assertions(1);
        try {
            await Packer.pack('path/does/not/exist');
        } catch (error) {
            expect(error.name).toEqual('APIException');
        }
    });
});
