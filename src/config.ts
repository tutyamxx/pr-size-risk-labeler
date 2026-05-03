import * as core from '@actions/core';

interface SizeThresholds {
    small: number;
    medium: number;
}

interface RiskThresholds {
    low: number;
    lowFiles: number;
    medium: number;
    mediumFiles: number;
}

interface ActionConfig {
    enableRiskLabels: boolean;
    sizeThresholds: SizeThresholds;
    riskThresholds: RiskThresholds;
}

/**
 * Reads a numeric action input by name and parses it as a base-10 integer.
 *
 * @param name - The action input name as defined in `action.yml`.
 * @param fallback - Value to return if the input is missing or not a valid integer.
 * @returns The parsed integer, or `fallback` if parsing fails.
 */
const parseIntInput = (name: string, fallback: number): number => {
    const raw = core.getInput(name);
    const parsed = raw ? parseInt(raw, 10) : NaN;

    return isNaN(parsed) ? fallback : parsed;
};

/**
 * Reads and returns the full action configuration from GitHub Actions inputs.
 *
 * Thresholds control when size and risk labels are applied:
 * - `size/small`  → total lines ≤ `size-small-threshold`
 * - `size/medium` → total lines ≤ `size-medium-threshold`
 * - `size/large`  → everything above
 * - `risk/low`    → lines ≤ `risk-low-lines`  AND files ≤ `risk-low-files`
 * - `risk/medium` → lines ≤ `risk-medium-lines` AND files ≤ `risk-medium-files`
 * - `risk/high`   → everything above
 *
 * @returns A fully populated {@link ActionConfig} object.
 */
export const getConfig = (): ActionConfig => ({
    enableRiskLabels: core.getInput('enable-risk-labels') !== 'false',

    sizeThresholds: {
        small: parseIntInput('size-small-threshold', 99),
        medium: parseIntInput('size-medium-threshold', 499)
    },

    riskThresholds: {
        low: parseIntInput('risk-low-lines', 99),
        lowFiles: parseIntInput('risk-low-files', 5),
        medium: parseIntInput('risk-medium-lines', 499),
        mediumFiles: parseIntInput('risk-medium-files', 15)
    }
});
