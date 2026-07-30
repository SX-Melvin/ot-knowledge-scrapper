import type { ThreadFormat } from "../types/OKF.js";

export function createThreadFormat(
    data: ThreadFormat,
    delimiterOnTop: boolean = true
): string {
    const lines: string[] = [];

    if (delimiterOnTop) {
        lines.push("---");
    }

    lines.push(
        `### Comment ${data.threadNumber}`,
        `**Author:** ${data.author}`,
        `**Time:** ${data.time}`,
        `**Type:** ${data.type}`
    );

    for (const comment of data.comments) {
        lines.push(`> ${comment}`);
    }

    return lines.join("\n") + "\n";
}