import * as core from '@actions/core';
import * as github from '@actions/github';
import { analyzePullRequest } from './analyzer';
import { applyLabels } from './labeler';
import { getConfig } from './config';

/**
 * Resolves size and risk labels based on PR diff metrics and configured thresholds.
 *
 * Size label logic:
 * - `size/small`  → totalLines ≤ small threshold
 * - `size/medium` → totalLines ≤ medium threshold
 * - `size/large`  → totalLines above medium threshold
 *
 * Risk label logic:
 * - `risk/low`    → totalLines ≤ low threshold AND filesChanged ≤ lowFiles threshold
 * - `risk/medium` → totalLines ≤ medium threshold AND filesChanged ≤ mediumFiles threshold
 * - `risk/high`   → anything above
 *
 * @param analysis - Diff metrics returned by {@link analyzePullRequest}.
 * @param config - Action config returned by {@link getConfig}.
 * @returns An object containing the resolved `sizeLabel` and `riskLabel`.
 */
export const resolveLabels = (analysis: { totalLines: number; filesChanged: number }, config: ReturnType<typeof getConfig>): { sizeLabel: string; riskLabel: string | null } => {
    const totalLines = analysis?.totalLines ?? 0;
    const filesChanged = analysis?.filesChanged ?? 0;
    const { sizeThresholds, riskThresholds } = config ?? {};

    // --| 🏷️ Determine Size Label
    let sizeLabel = 'size/large';

    if (totalLines <= (sizeThresholds?.small ?? 99)) {
        sizeLabel = 'size/small';
    } else if (totalLines <= (sizeThresholds?.medium ?? 499)) {
        sizeLabel = 'size/medium';
    }

    // --| ⚠️ Determine Risk Label
    let riskLabel = 'risk/high';

    if (totalLines <= (riskThresholds?.low ?? 99) && filesChanged <= (riskThresholds?.lowFiles ?? 5)) {
        riskLabel = 'risk/low';
    } else if (totalLines <= (riskThresholds?.medium ?? 499) && filesChanged <= (riskThresholds?.mediumFiles ?? 15)) {
        riskLabel = 'risk/medium';
    }

    return { sizeLabel, riskLabel };
};

/**
 * Main entry point for the PR Size & Risk Labeler action.
 * Reads the pull request context, analyzes the diff, resolves labels, and applies them.
 *
 * @throws If any GitHub API call fails or the event context is invalid.
 */
const run = async (): Promise<void> => {
    try {
        const token = core.getInput('github-token', { required: true });
        const octokit = github.getOctokit(token);
        const context = github.context;

        const pr = context?.payload?.pull_request;

        if (!pr) {
            core.setFailed('This action must be triggered by a pull_request event.');

            return;
        }

        const config = getConfig();
        core.info(`🔍 Analyzing PR #${pr?.number}: "${pr?.title}"`);

        const { owner, repo } = context.repo;
        const analysis = await analyzePullRequest(octokit, { owner, repo, pullNumber: pr?.number }, pr);

        core.info(`✅ Lines added: ${analysis?.additions}, 🧨 removed: ${analysis?.deletions}, 📁 files changed: ${analysis?.filesChanged}`);

        const { sizeLabel, riskLabel } = resolveLabels(analysis, config);
        core.info(`📏 Size label: ${sizeLabel} | ⚠️ Risk label: ${riskLabel ?? 'none'}`);

        await applyLabels(octokit, {
            owner,
            repo,
            pullNumber: pr?.number,
            sizeLabel,
            riskLabel,
            enableRisk: config?.enableRiskLabels
        });

        core.setOutput('size-label', sizeLabel ?? '');
        core.setOutput('risk-label', riskLabel ?? '');
        core.info('✅ Labels applied successfully.');
    } catch (error) {
        core.setFailed(`🚨 Action failed: ${error instanceof Error ? error?.message : String(error)}`);
    }
};

run();
