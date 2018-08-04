export type Device = {
    host: {
        address: string;
        port: string;
        macAddress: string;
    };
    model: string;
    sendData(data: Buffer);
};