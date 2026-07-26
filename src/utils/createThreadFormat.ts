import type { ThreadFormat } from "../types/OKF.js";

export function createThreadFormat(data: ThreadFormat) {
    let result = `
        ---
        ### Comment ${data.threadNumber}
        **Author:** ${data.author}
        **Time:** ${data.time}  
        **Type:** ${data.type}  
    `;

    for(const comment of data.comments) {
        result += `> ${comment}\n`;
    }

    return result;
}