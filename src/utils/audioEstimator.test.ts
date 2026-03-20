import { describe, it, expect } from 'vitest';
import { AudioEstimator } from './audioEstimator';

describe('AudioEstimator', () => {
  describe('estimateAudio', () => {
    it('should correctly estimate duration for short text', () => {
      const text = 'Hello world'; // 11 characters
      const estimate = AudioEstimator.estimateAudio(text);

      expect(estimate.characterCount).toBe(11);
      expect(estimate.estimatedDurationSeconds).toBe(Math.ceil(11 / 3.0));
      expect(estimate.estimatedCost).toBe(11 * 0.0001);
      expect(estimate.warning).toBeUndefined();
    });

    it('should warn for medium length text (300+ chars)', () => {
      const text = 'a'.repeat(350);
      const estimate = AudioEstimator.estimateAudio(text);

      expect(estimate.characterCount).toBe(350);
      expect(estimate.warning).toBe("Consider shortening for better user experience");
    });

    it('should warn for long text (500+ chars)', () => {
      const text = 'a'.repeat(600);
      const estimate = AudioEstimator.estimateAudio(text);

      expect(estimate.characterCount).toBe(600);
      expect(estimate.warning).toBe("This audio will be quite long and use more credits");
    });

    it('should handle empty string', () => {
      const estimate = AudioEstimator.estimateAudio('');

      expect(estimate.characterCount).toBe(0);
      expect(estimate.estimatedDurationSeconds).toBe(0);
      expect(estimate.estimatedCost).toBe(0);
      expect(estimate.warning).toBeUndefined();
    });

    it('should calculate cost correctly', () => {
      const text = 'a'.repeat(1000);
      const estimate = AudioEstimator.estimateAudio(text);

      expect(estimate.estimatedCost).toBe(1000 * 0.0001);
      expect(estimate.estimatedCost).toBe(0.1);
    });

    it('should round up duration seconds', () => {
      // 10 chars / 3.0 = 3.33... should round to 4
      const text = 'a'.repeat(10);
      const estimate = AudioEstimator.estimateAudio(text);

      expect(estimate.estimatedDurationSeconds).toBe(4);
    });
  });

  describe('estimateBulkAudio', () => {
    it('should correctly sum multiple estimates', () => {
      const texts = [
        'a'.repeat(100),
        'b'.repeat(200),
        'c'.repeat(300),
      ];

      const bulkEstimate = AudioEstimator.estimateBulkAudio(texts);

      expect(bulkEstimate.totalCharacters).toBe(600);
      expect(bulkEstimate.totalCost).toBe(600 * 0.0001);
      expect(bulkEstimate.individual).toHaveLength(3);
      expect(bulkEstimate.individual[0].characterCount).toBe(100);
      expect(bulkEstimate.individual[1].characterCount).toBe(200);
      expect(bulkEstimate.individual[2].characterCount).toBe(300);
    });

    it('should handle empty array', () => {
      const bulkEstimate = AudioEstimator.estimateBulkAudio([]);

      expect(bulkEstimate.totalCharacters).toBe(0);
      expect(bulkEstimate.totalCost).toBe(0);
      expect(bulkEstimate.totalDuration).toBe(0);
      expect(bulkEstimate.individual).toHaveLength(0);
    });

    it('should calculate total duration correctly', () => {
      const texts = ['a'.repeat(30), 'b'.repeat(30)]; // Each should be 10 seconds (30/3)
      const bulkEstimate = AudioEstimator.estimateBulkAudio(texts);

      expect(bulkEstimate.totalDuration).toBe(20);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds only for values under 60', () => {
      expect(AudioEstimator.formatDuration(30)).toBe('30s');
      expect(AudioEstimator.formatDuration(59)).toBe('59s');
      expect(AudioEstimator.formatDuration(0)).toBe('0s');
    });

    it('should format minutes and seconds for values 60 and above', () => {
      expect(AudioEstimator.formatDuration(60)).toBe('1m 0s');
      expect(AudioEstimator.formatDuration(90)).toBe('1m 30s');
      expect(AudioEstimator.formatDuration(125)).toBe('2m 5s');
      expect(AudioEstimator.formatDuration(3600)).toBe('60m 0s');
    });
  });

  describe('formatCost', () => {
    it('should format cost with 4 decimal places', () => {
      expect(AudioEstimator.formatCost(0.1234)).toBe('$0.1234');
      expect(AudioEstimator.formatCost(0.0001)).toBe('$0.0001');
      expect(AudioEstimator.formatCost(1.0)).toBe('$1.0000');
      expect(AudioEstimator.formatCost(0)).toBe('$0.0000');
    });

    it('should round to 4 decimal places', () => {
      expect(AudioEstimator.formatCost(0.12345)).toBe('$0.1235');
      expect(AudioEstimator.formatCost(0.99999)).toBe('$1.0000');
    });
  });
});
