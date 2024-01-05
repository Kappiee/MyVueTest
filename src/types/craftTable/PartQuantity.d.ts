export interface PartQuantity {
    partNumber: string = "";
    quantity: number = 1;
}

export interface DiffDataAndColorModel extends PartQuantity {
    isPositive: boolean = false;
}

export interface PartIdAndQuantity {
    partId: string = "";
    quantity: number = 1;
}

