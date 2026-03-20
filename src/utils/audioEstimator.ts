/**
 * Estimated audio generation metrics
 */
export interface AudioEstimate {
  /** Estimated duration in seconds based on character count and speaking rate */
  estimatedDurationSeconds: number;
  /** Total number of characters in the text */
  characterCount: number;
  /** Estimated cost in USD (ElevenLabs pricing) */
  estimatedCost: number;
  /** Optional warning message for long or expensive audio */
  warning?: string;
}

/**
 * Audio Estimator for calculating duration and cost of text-to-speech conversion
 *
 * Uses conservative estimates based on average speaking rates and ElevenLabs pricing.
 * Provides warnings for content that may be too long or costly.
 *
 * @example
 * ```ts
 * const estimate = AudioEstimator.estimateAudio("Welcome to Edinburgh Castle...");
 * console.log(`Duration: ${estimate.estimatedDurationSeconds}s, Cost: $${estimate.estimatedCost}`);
 * ```
 */
export class AudioEstimator {
  // Approximate speaking rate: 150-200 characters per minute
  private static readonly CHARS_PER_SECOND = 3.0; // Conservative estimate
  private static readonly ELEVENLABS_COST_PER_CHAR = 0.0001; // Approximate cost

  /**
   * Estimates audio duration and cost for a given text
   *
   * @param text - The text that will be converted to speech
   * @returns Audio estimate including duration, character count, cost, and warnings
   */
  static estimateAudio(text: string): AudioEstimate {
    const characterCount = text.length;
    const estimatedDurationSeconds = Math.ceil(characterCount / this.CHARS_PER_SECOND);
    const estimatedCost = characterCount * this.ELEVENLABS_COST_PER_CHAR;

    let warning: string | undefined;
    
    if (characterCount > 500) {
      warning = "This audio will be quite long and use more credits";
    } else if (characterCount > 300) {
      warning = "Consider shortening for better user experience";
    }

    return {
      estimatedDurationSeconds,
      characterCount,
      estimatedCost,
      warning
    };
  }

  /**
   * Estimates audio metrics for multiple texts
   *
   * @param texts - Array of texts to estimate
   * @returns Combined totals and individual estimates for each text
   */
  static estimateBulkAudio(texts: string[]): {
    totalDuration: number;
    totalCharacters: number;
    totalCost: number;
    individual: AudioEstimate[];
  } {
    const individual = texts.map(text => this.estimateAudio(text));
    
    return {
      totalDuration: individual.reduce((sum, est) => sum + est.estimatedDurationSeconds, 0),
      totalCharacters: individual.reduce((sum, est) => sum + est.characterCount, 0),
      totalCost: individual.reduce((sum, est) => sum + est.estimatedCost, 0),
      individual
    };
  }

  /**
   * Formats duration in seconds to human-readable format
   *
   * @param seconds - Duration in seconds
   * @returns Formatted string (e.g., "2m 30s" or "45s")
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Formats cost to currency string with 4 decimal places
   *
   * @param cost - Cost in USD
   * @returns Formatted currency string (e.g., "$0.0050")
   */
  static formatCost(cost: number): string {
    return `$${cost.toFixed(4)}`;
  }
}