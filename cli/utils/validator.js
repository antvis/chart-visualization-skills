#!/usr/bin/env node
/**
 * AntV Skills Validator Module
 *
 * Validates skill file format and content.
 */

const fs = require('fs');
const path = require('path');

class SkillValidator {
  constructor(options = {}) {
    const packageRoot = path.resolve(__dirname, '../..');
    this.skillsDir = options.skillsDir || path.join(packageRoot, 'skills');
    this.libraries = options.libraries || ['g2', 'g6', 'common'];

    this.REQUIRED_FIELDS = [
      'id',
      'title',
      'description',
      'library',
      'version',
      'category',
      'tags'
    ];
    this.REQUIRED_SECTIONS = [
      'Minimal Runnable Example',
      'API Quick Reference',
      'Basic Usage',
      'Core Concepts',
      '最小可运行示例',
      'API 速查',
      '基本用法',
      '核心概念'
    ];
    this.ID_PATTERN = /^(g2|g6|common)-[a-z0-9-]+$/;
  }

  parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const yamlStr = match[1];
    const meta = {};

    const idMatch = yamlStr.match(/^id:\s*["']?([^"'\n]+)["']?/m);
    const libraryMatch = yamlStr.match(/^library:\s*["']?([^"'\n]+)["']?/m);
    const versionMatch = yamlStr.match(/^version:\s*["']?([^"'\n]+)["']?/m);
    const categoryMatch = yamlStr.match(/^category:\s*["']?([^"'\n]+)["']?/m);
    const titleMatch = yamlStr.match(/^title:\s*["']?([^"'\n]+)["']?/m);

    if (idMatch) meta.id = idMatch[1].trim();
    if (libraryMatch) meta.library = libraryMatch[1].trim();
    if (versionMatch) meta.version = versionMatch[1].trim();
    if (categoryMatch) meta.category = categoryMatch[1].trim();
    if (titleMatch) meta.title = titleMatch[1].trim();

    meta.hasTags = yamlStr.includes('tags:');
    meta.hasDescription = yamlStr.includes('description:');
    meta.hasUseCases = yamlStr.includes('use_cases:');

    return meta;
  }

  validateFile(filePath) {
    const packageRoot = path.resolve(__dirname, '..');
    const relativePath = path.relative(packageRoot, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    const errors = [];
    const warnings = [];

    // Check Front Matter exists
    if (!content.startsWith('---')) {
      errors.push('Missing YAML Front Matter (file should start with ---)');
      return { valid: false, errors, warnings, relativePath };
    }

    const meta = this.parseFrontMatter(content);
    if (!meta) {
      errors.push('Front Matter format error, cannot parse');
      return { valid: false, errors, warnings, relativePath };
    }

    // Check required fields
    if (!meta.id) errors.push('Missing required field: id');
    if (!meta.title) errors.push('Missing required field: title');
    if (!meta.library) errors.push('Missing required field: library');
    if (!meta.version) errors.push('Missing required field: version');
    if (!meta.category) errors.push('Missing required field: category');
    if (!meta.hasTags) errors.push('Missing required field: tags');
    if (!meta.hasDescription)
      warnings.push('Missing recommended field: description');
    if (!meta.hasUseCases)
      warnings.push('Missing recommended field: use_cases');

    // Check ID format
    if (meta.id && !this.ID_PATTERN.test(meta.id)) {
      errors.push(
        `ID format invalid (should match ${this.ID_PATTERN}): ${meta.id}`
      );
    }

    // Check ID matches filename
    const fileName = path.basename(filePath, '.md');
    if (meta.id && meta.id !== fileName) {
      warnings.push(`ID "${meta.id}" does not match filename "${fileName}"`);
    }

    // Check body has required sections
    const body = content.split('---').slice(2).join('---');
    const hasRequiredSection = this.REQUIRED_SECTIONS.some((section) =>
      body.includes(section)
    );
    if (!hasRequiredSection) {
      warnings.push(
        `Body missing example section, should include: ${this.REQUIRED_SECTIONS.join(' or ')}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      relativePath,
      meta
    };
  }

  walkDir(dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.walkDir(fullPath));
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.md') &&
        !['README.md', 'CONTRIBUTING.md'].includes(entry.name)
      ) {
        files.push(fullPath);
      }
    }
    return files;
  }

  validate(options = {}) {
    const silent = options.silent || false;

    if (!silent) console.log('🔍 Validating AntV Skills...\n');

    const allFiles = [];
    for (const lib of this.libraries) {
      const libDir = path.join(this.skillsDir, lib);
      allFiles.push(...this.walkDir(libDir));
    }

    if (!silent) console.log(`📄 Found ${allFiles.length} skill files\n`);

    const allIds = new Set();
    const duplicateIds = [];
    const results = [];
    let errorCount = 0;
    let warnCount = 0;

    for (const file of allFiles) {
      const result = this.validateFile(file);
      results.push(result);

      if (result.meta?.id) {
        if (allIds.has(result.meta.id)) {
          duplicateIds.push(result.meta.id);
        }
        allIds.add(result.meta.id);
      }

      errorCount += result.errors.length;
      warnCount += result.warnings.length;

      if (!silent && result.errors.length > 0) {
        result.errors.forEach((err) =>
          console.error(`❌ [ERROR] ${result.relativePath}: ${err}`)
        );
      }
      if (!silent && result.warnings.length > 0) {
        result.warnings.forEach((warn) =>
          console.warn(`⚠️  [WARN]  ${result.relativePath}: ${warn}`)
        );
      }
    }

    // Check duplicate IDs
    if (duplicateIds.length > 0) {
      duplicateIds.forEach((id) => {
        errorCount++;
        if (!silent)
          console.error(`❌ [ERROR] Global: Duplicate ID found: ${id}`);
      });
    }

    if (!silent) {
      console.log('\n' + '='.repeat(60));
      console.log('📊 Validation Report:');
      console.log(`   Total files: ${allFiles.length}`);
      console.log(`   Errors: ${errorCount}`);
      console.log(`   Warnings: ${warnCount}`);
      console.log('='.repeat(60));

      if (errorCount === 0 && warnCount === 0) {
        console.log('\n✅ All skill files validated successfully!');
      } else if (errorCount === 0) {
        console.log('\n⚠️  Validation passed with warnings');
      } else {
        console.log('\n❌ Validation failed, please fix the errors above');
      }
    }

    return {
      valid: errorCount === 0,
      totalFiles: allFiles.length,
      errorCount,
      warnCount,
      results
    };
  }
}

module.exports = { SkillValidator };
