// scripts/test/runTests.js
const { runSystemTest } = require('./systemTest');
const { TEST_CONFIG } = require('./testconfig');
const fs = require('fs').promises;
const path = require('path');

/**
 * Test suite runner for WaveX V2
 */
async function runTests(options = {}) {
    const startTime = Date.now();
    const results = {
        timestamp: new Date().toISOString(),
        network: TEST_CONFIG.network.name,
        suites: [],
        totalTests: 0,
        passed: 0,
        failed: 0,
        duration: 0
    };

    try {
        console.log("\nWaveX V2 Test Runner");
        console.log("===================\n");

        // Create test results directory
        const resultsDir = path.join(process.cwd(), 'test-results');
        await fs.mkdir(resultsDir, { recursive: true });

        // Run test suites
        const suites = [
            {
                name: "System Integration",
                run: runSystemTest,
                enabled: !options.skip?.includes('system')
            }
        ];

        // Execute enabled test suites
        for (const suite of suites) {
            if (!suite.enabled) {
                console.log(`Skipping ${suite.name} tests...`);
                continue;
            }

            console.log(`\nRunning ${suite.name} Tests...`);
            console.log("=".repeat(20 + suite.name.length));

            const suiteStart = Date.now();
            try {
                const suiteResult = await suite.run();
                results.suites.push({
                    name: suite.name,
                    status: 'passed',
                    result: suiteResult,
                    duration: Date.now() - suiteStart
                });
                results.passed++;
            } catch (error) {
                console.error("\nTest Suite Error:", error);
                results.suites.push({
                    name: suite.name,
                    status: 'failed',
                    error: error.message,
                    stack: error.stack,
                    duration: Date.now() - suiteStart
                });
                results.failed++;
            }
            results.totalTests++;
        }

        // Calculate total duration
        results.duration = Date.now() - startTime;

        // Generate test report
        const report = generateTestReport(results);
        
        // Save test results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsPath = path.join(resultsDir, `test-results-${timestamp}.json`);
        const reportPath = path.join(resultsDir, `test-report-${timestamp}.md`);

        await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
        await fs.writeFile(reportPath, report);

        // Print summary
        console.log("\nTest Execution Summary");
        console.log("=====================");
        console.log(`Total Test Suites: ${results.totalTests}`);
        console.log(`Passed: ${results.passed}`);
        console.log(`Failed: ${results.failed}`);
        console.log(`Duration: ${(results.duration / 1000).toFixed(2)}s`);
        console.log(`\nDetailed report saved to: ${reportPath}`);

        if (results.failed > 0) {
            throw new Error(`${results.failed} test suite(s) failed`);
        }

        return results;

    } catch (error) {
        console.error("\nTest Runner Error:", error);
        throw error;
    }
}

/**
 * Generates a markdown test report
 * @private
 */
function generateTestReport(results) {
    const report = [
        "# WaveX V2 Test Report",
        "",
        `**Date:** ${new Date(results.timestamp).toLocaleString()}`,
        `**Network:** ${results.network}`,
        `**Duration:** ${(results.duration / 1000).toFixed(2)}s`,
        "",
        "## Summary",
        "",
        `- Total Test Suites: ${results.totalTests}`,
        `- Passed: ${results.passed}`,
        `- Failed: ${results.failed}`,
        "",
        "## Test Suites",
        ""
    ];

    results.suites.forEach(suite => {
        report.push(`### ${suite.name}`);
        report.push("");
        report.push(`**Status:** ${suite.status}`);
        report.push(`**Duration:** ${(suite.duration / 1000).toFixed(2)}s`);
        report.push("");

        if (suite.status === 'passed') {
            report.push("#### Results");
            report.push("```json");
            report.push(JSON.stringify(suite.result, null, 2));
            report.push("```");
        } else {
            report.push("#### Error");
            report.push("```");
            report.push(suite.error);
            report.push("");
            report.push("Stack Trace:");
            report.push(suite.stack);
            report.push("```");
        }
        report.push("");
    });

    // Add system information
    report.push("## System Information");
    report.push("");
    report.push("```");
    report.push(`Node Version: ${process.version}`);
    report.push(`Platform: ${process.platform}`);
    report.push(`Architecture: ${process.arch}`);
    report.push("```");

    return report.join("\n");
}

// Run tests if called directly
if (require.main === module) {
    runTests()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    runTests
};