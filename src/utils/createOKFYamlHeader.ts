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
    console.log("OKF config:", config);

    const data = createOKFFrontmatter(config);

    const yamlLines = [
      '---',
      `profile: "${data.profile}"`,
      `name: "${data.name}"`,
      `title: "${data.title}"`,
      `description: "${data.description}"`,
      `version: "${data.version}"`,
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

    console.log("Output directory:", okfPath);
    console.log("Original filename:", config.name);
    console.log("Safe filename:", safeName);
    console.log("Full output path:", filePath);

    await fs.mkdir(okfPath, {
      recursive: true
    });

    console.log("Directory created/verified");

    await fs.writeFile(
      filePath,
      result,
      {
        encoding: 'utf8'
      }
    );

    console.log("File successfully written!");

    // Verify file exists
    const fileExists = await fs.access(filePath)
      .then(() => true)
      .catch(() => false);

    console.log("File exists:", fileExists);

    return result;

  } catch (error) {
    console.error("Failed to create OKF Markdown file:");
    console.error(error);

    throw error;
  }
}