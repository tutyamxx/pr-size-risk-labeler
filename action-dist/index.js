/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

var __createBinding = (undefined && undefined.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (undefined && undefined.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (undefined && undefined.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLabels = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const analyzer_1 = require("./analyzer");
const labeler_1 = require("./labeler");
const config_1 = require("./config");
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
const resolveLabels = (analysis, config) => {
    const totalLines = analysis?.totalLines ?? 0;
    const filesChanged = analysis?.filesChanged ?? 0;
    const { sizeThresholds, riskThresholds } = config ?? {};
    // --| 🏷️ Determine Size Label
    let sizeLabel = 'size/large';
    if (totalLines <= (sizeThresholds?.small ?? 99)) {
        sizeLabel = 'size/small';
    }
    else if (totalLines <= (sizeThresholds?.medium ?? 499)) {
        sizeLabel = 'size/medium';
    }
    // --| ⚠️ Determine Risk Label
    let riskLabel = 'risk/high';
    if (totalLines <= (riskThresholds?.low ?? 99) && filesChanged <= (riskThresholds?.lowFiles ?? 5)) {
        riskLabel = 'risk/low';
    }
    else if (totalLines <= (riskThresholds?.medium ?? 499) && filesChanged <= (riskThresholds?.mediumFiles ?? 15)) {
        riskLabel = 'risk/medium';
    }
    return { sizeLabel, riskLabel };
};
exports.resolveLabels = resolveLabels;
/**
 * Main entry point for the PR Size & Risk Labeler action.
 * Reads the pull request context, analyzes the diff, resolves labels, and applies them.
 *
 * @throws If any GitHub API call fails or the event context is invalid.
 */
const run = async () => {
    try {
        const token = core.getInput('github-token', { required: true });
        const octokit = github.getOctokit(token);
        const context = github.context;
        const pr = context?.payload?.pull_request;
        if (!pr) {
            core.setFailed('This action must be triggered by a pull_request event.');
            return;
        }
        const config = (0, config_1.getConfig)();
        core.info(`🔍 Analyzing PR #${pr?.number}: "${pr?.title}"`);
        const { owner, repo } = context.repo;
        const analysis = await (0, analyzer_1.analyzePullRequest)(octokit, { owner, repo, pullNumber: pr?.number }, pr);
        core.info(`✅ Lines added: ${analysis?.additions}, 🧨 removed: ${analysis?.deletions}, 📁 files changed: ${analysis?.filesChanged}`);
        const { sizeLabel, riskLabel } = (0, exports.resolveLabels)(analysis, config);
        core.info(`📏 Size label: ${sizeLabel} | ⚠️ Risk label: ${riskLabel ?? 'none'}`);
        await (0, labeler_1.applyLabels)(octokit, {
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
    }
    catch (error) {
        core.setFailed(`🚨 Action failed: ${error instanceof Error ? error?.message : String(error)}`);
    }
};
run();

