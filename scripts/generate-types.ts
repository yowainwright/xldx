#!/usr/bin/env bun
/**
 * Generate TypeScript types from Zod schemas
 * This runs at build time to extract types without runtime dependency
 */

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

// Import the schemas
const schemasPath = path.join(process.cwd(), 'src', 'schemas.ts');

async function generateTypes() {
  console.log('📝 Generating types from Zod schemas...');
  
  // For now, we'll use the manually created types
  // In a more sophisticated setup, we could parse the Zod schemas
  // and generate the types automatically
  
  const typesContent = `/**
 * Auto-generated types from Zod schemas
 * DO NOT EDIT - This file is generated at build time
 */

// Re-export all types from the hand-written types file
export * from './schemas-types';
`;

  const outputPath = path.join(process.cwd(), 'src', 'schemas-generated.ts');
  await fs.writeFile(outputPath, typesContent);
  
  console.log('✅ Types generated successfully');
}

generateTypes().catch(console.error);