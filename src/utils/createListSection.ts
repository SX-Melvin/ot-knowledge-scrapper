export function createListSection(title: string, lists: string[]) {
    return `
        # ${title}
        ${lists.map(x => `- ${x}`).join("\n").toString()}
    `;
}