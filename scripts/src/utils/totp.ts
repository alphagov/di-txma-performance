import crypto, { Algorithm } from "k6/crypto";

// Implementation of RFC 6238 algorithm to generate TOTP codes
// https://www.rfc-editor.org/rfc/rfc6238
export default class TOTP {
    key: ArrayBuffer;

    // TOTP key in base32 string RFC 4648 format is required
    constructor(base32key: string,
        private digits = 6,
        private algorithm: Algorithm = "sha1",
        private period = 30,
        private startTime = 0) {
        this.key = base32ToBytes(base32key);
    }

    // Converts a timestamp in milliseconds to a byte array representing the number of time steps elapsed since the start time
    calculateTime(timestamp: number): ArrayBuffer {
        let seconds = Math.round(timestamp / 1000) - this.startTime;
        let steps = Math.floor(seconds / this.period);
        let hexSteps = decToHex(steps).padStart(16, "0");
        return hexToBytes(hexSteps);
    }

    // Returns TOTP with current time, or specified timestamp in milliseconds
    // See RFC 6238 for more details
    public generateTOTP(timestamp: number = Date.now()): string {
        let time = this.calculateTime(timestamp);

        let hash = crypto.hmac(this.algorithm, this.key, time, 'hex');
        let offset = hexToDec(hash.slice(-1)) * 2;
        let totp = (hexToDec(hash.slice(offset, offset + 8)) & 0x7fffffff).toString();
        return totp.slice(-this.digits);
    }
}

// Converts a hex string to a byte array
function hexToBytes(hex: string) {
    let bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2)
        bytes.push(parseInt(hex.slice(i, i + 2), 16));
    return new Uint8Array(bytes).buffer;
}

// Converts a hex string to a decimal
function hexToDec(s: string) {
    return parseInt(s, 16);
}

// Converts a decimal to a hex string
function decToHex(d: number) {
    return Math.round(d).toString(16).padStart(2, "0");
}

// Converts a (RFC 4648) base32 string to a byte array
function base32ToBytes(base32: string) {
    let base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
        bits = "",
        bytes: number[] = [];

    // Removes padding chars, if any
    base32 = base32.replace(/=+$/, "");

    // Converts base32 string to bits
    for (let i = 0; i < base32.length; i++) {
        let val = base32chars.indexOf(base32.charAt(i));
        if (val === -1) throw new Error("Invalid base32 character in key");
        bits += val.toString(2).padStart(5, "0");
    }

    // Chunks bits to bytes
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }
    return new Uint8Array(bytes).buffer;
}