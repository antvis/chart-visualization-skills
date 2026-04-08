#!/usr/bin/env node
/**
 * AntV Skills - Main Library Entry
 *
 * Provides programmatic access to skill building, retrieval, and validation.
 *
 * @example
 * const { SkillBuilder, SkillRetriever, SkillValidator } = require('antv-skills');
 *
 * // Build indexes
 * const builder = new SkillBuilder();
 * builder.build();
 *
 * // Retrieve skills
 * const retriever = new SkillRetriever();
 * const skills = retriever.retrieve('how to create bar chart');
 *
 * // Validate skills
 * const validator = new SkillValidator();
 * const result = validator.validate();
 */

// Load environment variables from .env file
require('dotenv').config({ override: true });

const { SkillBuilder } = require('./builder');
const { SkillRetriever } = require('./retriever');
const { SkillValidator } = require('./validator');
const { BM25Index, tokenize: bm25Tokenize } = require('./bm25');

// Package metadata
const pkg = require('../package.json');

module.exports = {
  // Core classes
  SkillBuilder,
  SkillRetriever,
  SkillValidator,
  BM25Index,

  // Version info
  version: pkg.version,

  // Convenience factory functions
  createBuilder: (options) => new SkillBuilder(options),
  createRetriever: (options) => new SkillRetriever(options),
  createValidator: (options) => new SkillValidator(options),

  // Utilities
  bm25Tokenize
};
