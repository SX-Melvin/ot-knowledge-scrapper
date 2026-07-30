import type { TicketSectionFormat } from "../types/OKF.js";

export function createTicketSectionFormat(
    data: TicketSectionFormat,
    delimiterOnTop: boolean = true
): string {
    if (data.text.trim().length === 0) {
        return "";
    }

    const lines: string[] = [];

    if (delimiterOnTop) {
        lines.push("---");
    }

    lines.push(
        `### ${data.section}`,
        data.text
    );

    return lines.join("\n") + "\n";
}