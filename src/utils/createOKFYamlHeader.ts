import type { OKFConfig } from '../types/OKF.js';
import { createOKFFrontmatter } from './createOKFFrontmatter.js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const okfPath = process.env.OKF_PATH ?? ".\\";

export async function createOKFMarkdownFile(
  config: OKFConfig,
  body = ''
) {
  try {
    const data = createOKFFrontmatter(config);
    const yamlLines = [
      '---',
      `profile: "${data.profile}"`,
      `name: "${data.name}"`,
      `title: "${data.title}"`,
      `description: "${data.description.replace(/\s+/g, " ").trim()}"`,
      `created: "${data.created}"`,
      '---'
    ];

    const frontmatter = yamlLines.join('\n');
    const cleanBody = body.trim();

    const result = cleanBody
      ? `${frontmatter}\n\n${cleanBody}\n`
      : `${frontmatter}\n`;

    // Sanitize filename
    const safeName = config.name
      .replace(/[<>:"/\\|?*]/g, '_')
      .trim();

    const filePath = path.join(
      okfPath,
      `${safeName}.md`
    );

    await fs.mkdir(okfPath, {
      recursive: true
    });

    await fs.writeFile(
      filePath,
      result,
      {
        encoding: 'utf8'
      }
    );

    return result;
  } catch (error) {
    console.error("Failed to create OKF Markdown file:");
    console.error(error);

    throw error;
  }
}