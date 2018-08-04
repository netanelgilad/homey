import { basename } from "path";
import axios from "axios";

export const pad = (number) => number < 10 ? `0${number}` : String(number);

export function cleanFileName(file) {
    return basename(file).substr(0, basename(file).lastIndexOf('.'));
}

export const safeGet = async url => {
    try {
        const response = await axios.get(url);
        return response.data;
    }
    catch (err) {
        console.log('Failed to get from url', url);
        console.log(err);
        console.log(err.response.data);
    }
}