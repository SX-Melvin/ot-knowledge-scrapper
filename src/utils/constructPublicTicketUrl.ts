import dotenv from "dotenv";
import { TimeFilter } from "../types/TimeFilter.js";

dotenv.config();

const timeFilter: TimeFilter | null = process.env.TIME_FILTER && process.env.TIME_FILTER.length > 0 ? TimeFilter[process.env.TIME_FILTER as keyof typeof TimeFilter] : null;

export function constructPublicTicketUrl(): string {
    let url = `https://support.opentext.com/csm?id=ot_kb_search&spa=1&u_product_line=a2ef151c1bb24d10fea2ec20604bcb1a&kb_category=d6344bdadb21781068cfd6c4e296190c`;

    if(timeFilter != null) {
        url += `&modified=${timeFilter}`
    }

    return url;
}