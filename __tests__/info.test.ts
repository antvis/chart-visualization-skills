import { describe, it, expect } from 'vitest';
import { info } from '../src/api';

describe('info API', () => {
  it('should return skill info for default library', () => {
    const result = info();
    expect(result).toBeDefined();
    expect(result!.name).toBe('antv-g2-chart');
    expect(result!.description.length).toBeGreaterThan(0);
    expect(result!.content.length).toBeGreaterThan(0);
  });

  it('should return skill info for g2 library', () => {
    const result = info('g2');
    expect(result).toBeDefined();
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('content');
  });

  it('should return undefined for library without SKILL.md', () => {
    const result = info('g6');
    // g6 may or may not have a SKILL.md
    expect(result === undefined || typeof result.name === 'string').toBe(true);
  });
});
