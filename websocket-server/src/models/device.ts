class Device {
    type: string;
    value: number;
    timestamp: number;

    constructor(type: string, value: number, timestamp: number) {
        this.type = type;
        this.value = value;
        this.timestamp = timestamp;
    }

    generateData(): DeviceData {
        return {
            type: this.type,
            value: this.value,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}

export default Device;