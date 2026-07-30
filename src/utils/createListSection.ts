export function createListSection(title: string, lists: string[]): string {
    const lines: string[] = [
        `# ${title}`,
        ...lists.map(x => `- ${x}`)
    ];

    return lines.join("\n") + "\n";
}