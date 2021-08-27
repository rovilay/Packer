import fs from 'fs';
import readline from 'readline';

import APIException from './APIException';

interface IPackageItem {
    index: number;
    weight: number;
    price: number;
}
interface IPackage {
    weight: number;
    items: IPackageItem[];
}

export default class Packer {
    /**
     * packs items into packages
     *
     * @param inputFilePath path to file
     * @returns Promise<string>
     */
    static async pack(inputFilePath: string): Promise<string> {
        try {
            const res: string[] = await this.readAndProcessFilePerline(inputFilePath);

            return res.join('\n');
        } catch (error) {
            throw new APIException(error);
        }
    }

    /**
     * reads and processes the input file line by line asynchronously
     *
     * @param path path to file
     */
    private static readAndProcessFilePerline(filePath: string): Promise<string[]> {
        const encoding: BufferEncoding = 'utf-8';
        const result: string[] = [];

        const readerStream: fs.ReadStream = fs.createReadStream(filePath, encoding);
        const fileReader: readline.Interface = readline.createInterface({
            input: readerStream,
            output: process.stdout,
            terminal: false,
        });

        return new Promise((resolve, reject): void => {
            readerStream.on('error', (error: Error) => {
                readerStream.close();
                reject(error.message);
            });

            fileReader.on('line', (line: string): void => {
                const pkg: IPackage = this.parseFileLine(line);
                const res: string = this.processPackage(pkg);
                result.push(res);
            });

            fileReader.on('close', (): void => {
                resolve(result);
            });
        });
    }

    /**
     * parses a line read from the file
     *
     * @param line data for a package
     * @returns
     */
    private static parseFileLine(line: string): IPackage {
        const packageData: IPackage = {
            weight: 0,
            items: [],
        };

        const parsedLine: string = line.trim();
        if (!parsedLine) {
            return packageData;
        }

        const packageWeightSeparator: string = ':';
        const packageItemSeparator: string = ' ';

        const parsedLineData: string[] = parsedLine.split(packageWeightSeparator);

        // parse package weight
        const packageWeight: number = Number(parsedLineData[0]);

        if (Number.isNaN(packageWeight) || packageWeight < 1) {
            return packageData;
        }
        packageData.weight = packageWeight;

        // parse package items
        const packageItems: string[] = parsedLineData[1].trim().split(packageItemSeparator);

        for (let i = 0; i < packageItems.length; i += 1) {
            const itemString: string = packageItems[i];
            const item: IPackageItem | null = this.parsePackageItemString(itemString);

            if (item) {
                packageData.items.push(item);
            }
        }

        return packageData;
    }

    /**
     * parses items strings to items
     *
     * @param itemString items string data
     * @returns
     */
    private static parsePackageItemString(itemString: string): IPackageItem | null {
        if (!itemString) {
            return null;
        }

        const separator: string = ',';
        const currency: string = '€';

        // remove brackets '(' and ')'
        const parsedItemString: string = itemString.replace(/['\(\)']+/g, '');

        const [
            itemIndexString, itemWeighString, itemCurrencyPriceString,
        ]: string[] = parsedItemString.split(separator);

        const itemIndex: number = Number(itemIndexString);
        const itemWeight: number = Number(itemWeighString);

        // remove currency '€'
        const itemPriceString: string = itemCurrencyPriceString.replace(currency, '');
        const itemPrice: number = Number(itemPriceString);

        if (Number.isNaN(itemIndex) || Number.isNaN(itemWeight) || Number.isNaN(itemPrice)) {
            return null;
        }

        const item: IPackageItem = {
            index: itemIndex,
            weight: itemWeight,
            price: itemPrice,
        };

        return item;
    }

    /**
     * processes package data
     *
     * @param pkg package to process
     * @returns
     */
    private static processPackage(pkg: IPackage): string {
        const { weight: maxWeight, items }: IPackage = pkg;

        // sort items by weight
        items.sort((item1, item2): number => item1.weight - item2.weight);

        // create costBoard for memoization
        const costBoard: number[][] = new Array(items.length + 1);

        // fill rows
        for (let i = 0; i < costBoard.length; i += 1) {
            costBoard[i] = new Array(maxWeight + 1);
        }

        this.calculatePackageCost(items, items.length, maxWeight, costBoard);
        const packedItemsIndex: string = this.getPackagedItemsIndex(items, maxWeight, costBoard);

        return packedItemsIndex;
    }

    /**
     * calculate optimal package cost
     *
     * @param items items options to select from
     * @param currentItemIndex index of current item
     * @param packageWeight current package weight
     * @param costBoard package cost memoization board
     * @returns
     */
    private static calculatePackageCost(
        items: IPackageItem[],
        currentItemIndex: number,
        packageWeight: number,
        costBoard: number[][],
    ): number {
        // base check
        if (currentItemIndex === 0 || packageWeight === 0) {
            costBoard[currentItemIndex][packageWeight] = 0;
            return 0;
        }

        // if packageCost has previously been calculated, return the cost
        if (costBoard[currentItemIndex][packageWeight] !== undefined) {
            return costBoard[currentItemIndex][packageWeight];
        }

        // calculate cost without including item
        const costWithoutItem: number = this.calculatePackageCost(
            items,
            currentItemIndex - 1,
            packageWeight,
            costBoard,
        );

        const {
            weight: itemWeight,
            price: itemPrice,
        }: IPackageItem = items[currentItemIndex - 1]
        || { index: 0, weight: 0, price: 0 }; // item

        // calculate cost while including item
        let costWithItem: number = 0;
        if (itemWeight <= packageWeight) {
            const newWeight: number = Math.round(packageWeight - itemWeight);
            costWithItem = itemPrice + this.calculatePackageCost(
                items,
                currentItemIndex - 1,
                newWeight,
                costBoard,
            );
        }

        costBoard[currentItemIndex][packageWeight] = Math.max(costWithItem, costWithoutItem);

        return costBoard[currentItemIndex][packageWeight];
    }

    /**
     * selects index of packaged items
     *
     * @param items items available to choose from
     * @param maxWeight maximum weight of the package
     * @param costBoard package cost memoization board
     * @returns
     */
    private static getPackagedItemsIndex(
        items: IPackageItem[],
        maxWeight: number,
        costBoard: number[][],
    ): string {
        let cost: number = costBoard[items.length][maxWeight];
        let weight: number = maxWeight;
        const itemsIndex: number[] = [];

        for (let i = items.length; i > 0 && cost > 0; i -= 1) {
            // if the cost is not the same as the prevItemCost `costBoard[i - 1][weight]`
            // it means the current item was included in the cost
            const prevItemCost: number = costBoard[i - 1][weight];
            if (cost !== prevItemCost) {
                const {
                    index,
                    weight: itemWeight,
                    price: itemPrice,
                }: IPackageItem = items[i - 1];

                // add itemIndex
                itemsIndex.push(index);

                // deduct itemPrice and itemWeight
                cost -= itemPrice;
                weight = Math.round(weight - itemWeight);
            }
        }

        // sort by index
        itemsIndex.sort((indx1, indx2): number => indx1 - indx2);

        return itemsIndex.join(',') || '-';
    }
}
