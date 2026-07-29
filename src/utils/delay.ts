import { setTimeout as wait } from "node:timers/promises";

export async function delay(timeout: number) {
    await wait(timeout);
}