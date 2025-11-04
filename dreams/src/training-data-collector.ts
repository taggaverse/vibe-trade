/**
 * Training Data Collector
 * 
 * Automatically collects training examples from production requests
 * for C2C projector training.
 * 
 * Usage:
 *   const collector = new TrainingDataCollector("training_data.jsonl");
 *   collector.logExample({ ... });
 *   const stats = collector.getStats();
 */

import { writeFileSync, appendFileSync, readFileSync, existsSync } from "fs";

export interface TrainingExample {
  timestamp: string;
  request: {
    symbol: string;
    timeframe: string;
    query: string;
  };
  taapi_output: any;
  aixbt_output: any;
  llm_input: string;
  llm_output: any;
  metadata: {
    latency_ms: number;
    cost_usd: number;
    sources_called: string[];
    accuracy_score?: number;
  };
}

export interface CollectionStats {
  total_examples: number;
  collection_start: string;
  collection_end: string;
  symbols: Record<string, number>;
  timeframes: Record<string, number>;
  data_quality: {
    valid_examples: number;
    invalid_examples: number;
    duplicates: number;
    missing_fields: number;
  };
  file_size_mb: number;
}

/**
 * Collects training examples from production requests
 */
export class TrainingDataCollector {
  private filePath: string;
  private statsPath: string;
  private exampleCount: number = 0;
  private startTime: Date;

  constructor(filePath: string = "training_data.jsonl") {
    this.filePath = filePath;
    this.statsPath = filePath.replace(".jsonl", "_stats.json");
    this.startTime = new Date();

    // Initialize file if it doesn't exist
    if (!existsSync(this.filePath)) {
      writeFileSync(this.filePath, "");
      console.log(`[TrainingCollector] Created ${this.filePath}`);
    }

    // Load existing example count
    this.exampleCount = this.countExamples();
    console.log(
      `[TrainingCollector] Initialized with ${this.exampleCount} existing examples`
    );
  }

  /**
   * Log a training example
   */
  logExample(example: TrainingExample): void {
    try {
      // Validate example
      if (!this.validateExample(example)) {
        console.warn("[TrainingCollector] Invalid example, skipping");
        return;
      }

      // Append to file
      appendFileSync(this.filePath, JSON.stringify(example) + "\n");
      this.exampleCount++;

      // Log every 100 examples
      if (this.exampleCount % 100 === 0) {
        console.log(
          `[TrainingCollector] Logged ${this.exampleCount} examples`
        );
        this.updateStats();
      }
    } catch (error) {
      console.error("[TrainingCollector] Failed to log example:", error);
    }
  }

  /**
   * Validate example has all required fields
   */
  private validateExample(example: any): boolean {
    const required = [
      "timestamp",
      "request",
      "taapi_output",
      "aixbt_output",
      "llm_input",
      "llm_output",
      "metadata",
    ];

    for (const field of required) {
      if (!example[field]) {
        console.warn(`[TrainingCollector] Missing field: ${field}`);
        return false;
      }
    }

    // Validate nested fields
    if (!example.request.symbol) return false;
    if (!example.request.timeframe) return false;
    if (typeof example.metadata.latency_ms !== "number") return false;

    return true;
  }

  /**
   * Count examples in file
   */
  private countExamples(): number {
    try {
      const content = readFileSync(this.filePath, "utf-8");
      return content.split("\n").filter((line) => line.trim()).length;
    } catch {
      return 0;
    }
  }

  /**
   * Get all examples (be careful with large files)
   */
  getExamples(limit?: number): TrainingExample[] {
    try {
      const content = readFileSync(this.filePath, "utf-8");
      const lines = content.split("\n").filter((line) => line.trim());

      const examples = lines.map((line) => JSON.parse(line));

      if (limit) {
        return examples.slice(-limit);
      }
      return examples;
    } catch (error) {
      console.error("[TrainingCollector] Failed to read examples:", error);
      return [];
    }
  }

  /**
   * Get collection statistics
   */
  getStats(): CollectionStats {
    const examples = this.getExamples();

    const symbols: Record<string, number> = {};
    const timeframes: Record<string, number> = {};
    let validCount = 0;
    let invalidCount = 0;

    for (const example of examples) {
      if (this.validateExample(example)) {
        validCount++;

        // Count symbols
        const symbol = example.request.symbol;
        symbols[symbol] = (symbols[symbol] || 0) + 1;

        // Count timeframes
        const timeframe = example.request.timeframe;
        timeframes[timeframe] = (timeframes[timeframe] || 0) + 1;
      } else {
        invalidCount++;
      }
    }

    // Get file size
    let fileSizeMb = 0;
    try {
      const stats = require("fs").statSync(this.filePath);
      fileSizeMb = stats.size / (1024 * 1024);
    } catch {
      fileSizeMb = 0;
    }

    return {
      total_examples: examples.length,
      collection_start: this.startTime.toISOString(),
      collection_end: new Date().toISOString(),
      symbols,
      timeframes,
      data_quality: {
        valid_examples: validCount,
        invalid_examples: invalidCount,
        duplicates: 0, // TODO: implement duplicate detection
        missing_fields: invalidCount,
      },
      file_size_mb: fileSizeMb,
    };
  }

  /**
   * Update statistics file
   */
  private updateStats(): void {
    try {
      const stats = this.getStats();
      writeFileSync(this.statsPath, JSON.stringify(stats, null, 2));
    } catch (error) {
      console.warn("[TrainingCollector] Failed to update stats:", error);
    }
  }

  /**
   * Get progress towards target
   */
  getProgress(target: number = 5000): {
    current: number;
    target: number;
    percentage: number;
    remaining: number;
  } {
    const current = this.exampleCount;
    const percentage = Math.round((current / target) * 100);
    const remaining = Math.max(0, target - current);

    return { current, target, percentage, remaining };
  }

  /**
   * Print collection progress
   */
  printProgress(target: number = 5000): void {
    const progress = this.getProgress(target);
    const bar = this.createProgressBar(progress.percentage);

    console.log("");
    console.log("📊 Training Data Collection Progress");
    console.log("────────────────────────────────────");
    console.log(`${bar} ${progress.percentage}%`);
    console.log(`${progress.current} / ${progress.target} examples`);
    console.log(`${progress.remaining} remaining`);
    console.log("");
  }

  /**
   * Create ASCII progress bar
   */
  private createProgressBar(percentage: number): string {
    const filled = Math.round(percentage / 5);
    const empty = 20 - filled;
    return `[${"█".repeat(filled)}${" ".repeat(empty)}]`;
  }

  /**
   * Print detailed statistics
   */
  printStats(): void {
    const stats = this.getStats();

    console.log("");
    console.log("📈 Training Data Statistics");
    console.log("═══════════════════════════════════");
    console.log(`Total Examples: ${stats.total_examples}`);
    console.log(`File Size: ${stats.file_size_mb.toFixed(2)} MB`);
    console.log(`Valid: ${stats.data_quality.valid_examples}`);
    console.log(`Invalid: ${stats.data_quality.invalid_examples}`);
    console.log("");

    console.log("Symbols:");
    for (const [symbol, count] of Object.entries(stats.symbols)) {
      console.log(`  ${symbol}: ${count}`);
    }
    console.log("");

    console.log("Timeframes:");
    for (const [timeframe, count] of Object.entries(stats.timeframes)) {
      console.log(`  ${timeframe}: ${count}`);
    }
    console.log("");
  }

  /**
   * Export examples for training
   */
  exportForTraining(
    outputPath: string,
    trainSplit: number = 0.8
  ): {
    train_file: string;
    test_file: string;
    train_count: number;
    test_count: number;
  } {
    try {
      const examples = this.getExamples();
      const trainCount = Math.floor(examples.length * trainSplit);

      // Shuffle examples
      const shuffled = examples.sort(() => Math.random() - 0.5);

      // Split into train and test
      const trainExamples = shuffled.slice(0, trainCount);
      const testExamples = shuffled.slice(trainCount);

      // Write files
      const trainFile = outputPath.replace(".jsonl", "_train.jsonl");
      const testFile = outputPath.replace(".jsonl", "_test.jsonl");

      writeFileSync(
        trainFile,
        trainExamples.map((e) => JSON.stringify(e)).join("\n")
      );
      writeFileSync(
        testFile,
        testExamples.map((e) => JSON.stringify(e)).join("\n")
      );

      console.log(`[TrainingCollector] Exported ${trainCount} training examples`);
      console.log(`[TrainingCollector] Exported ${testExamples.length} test examples`);

      return {
        train_file: trainFile,
        test_file: testFile,
        train_count: trainCount,
        test_count: testExamples.length,
      };
    } catch (error) {
      console.error("[TrainingCollector] Failed to export:", error);
      throw error;
    }
  }
}

export default TrainingDataCollector;
