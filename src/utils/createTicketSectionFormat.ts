import type { TicketSectionFormat } from "../types/OKF.js";

export function createTicketSectionFormat(data: TicketSectionFormat) {
    let result = `
        ---
        ### ${data.section}
        ${data.text}
    `;

    return result;
}