declare global{
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thisItem: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        aras: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        top: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parent: any;
    }
    interface Document {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thisItem: any;
    }
}