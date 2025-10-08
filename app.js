const referenceInput = document.getElementById("referenceString");
const frameInput = document.getElementById("frameCount");
const algorithmSelect = document.getElementById("algorithm");
const runButton = document.getElementById("runButton");
const clearButton = document.getElementById("clearButton");
const exportButton = document.getElementById("exportButton");
const statusBanner = document.getElementById("status");

const summaryCards = document.getElementById("summaryCards");
const comparisonBody = document.getElementById("comparisonBody");
const resultDeck = document.getElementById("resultDeck");
const totalReferences = document.getElementById("totalReferences");
const frameSummary = document.getElementById("frameSummary");

const controlForm = document.getElementById("controlForm");
const exampleChips = document.querySelectorAll(".chip");
const resultTemplate = document.getElementById("resultTemplate");

let lastResults = null;

const AVAILABLE_ALGORITHMS = {
    fifo: {
        name: "First-In First-Out (FIFO)",
        simulate: simulateFIFO,
    },
    lru: {
        name: "Least Recently Used (LRU)",
        simulate: simulateLRU,
    },
    optimal: {
        name: "Optimal",
        simulate: simulateOptimal,
    },
};

function parseReferenceString(raw) {
    const tokens = raw
        .split(/[,\s]+/)
        .map((token) => token.trim())
        .filter(Boolean);

    if (tokens.length === 0) {
        throw new Error("Reference string cannot be empty");
    }

    const pages = tokens.map((token, index) => {
        const value = Number.parseInt(token, 10);
        if (Number.isNaN(value)) {
            throw new Error(`Invalid page reference at position ${index + 1}`);
        }
        if (value < 0) {
            throw new Error("Page numbers must be non-negative");
        }
        return value;
    });

    return pages;
}

function getSelectedAlgorithms() {
    const selection = algorithmSelect.value;
    if (selection === "fifo") return ["fifo"];
    if (selection === "lru") return ["lru"];
    if (selection === "optimal") return ["optimal"];
    return Object.keys(AVAILABLE_ALGORITHMS);
}

function runSimulation() {
    try {
        clearStatus();

        const referenceString = parseReferenceString(referenceInput.value);
        const frameCount = Number.parseInt(frameInput.value, 10);

        if (!Number.isInteger(frameCount) || frameCount <= 0) {
            throw new Error("Frame count must be a positive integer");
        }

        if (frameCount > 25) {
            throw new Error("Frame count is capped at 25 for readability");
        }

        const algorithmsToRun = getSelectedAlgorithms();
        const results = algorithmsToRun.map((key) => {
            const { name, simulate } = AVAILABLE_ALGORITHMS[key];
            const result = simulate(referenceString, frameCount);
            return {
                key,
                name,
                ...result,
            };
        });

        if (results.length === 0) {
            throw new Error("No algorithm selected");
        }

        renderSummaries(results);
        renderComparisonTable(results, referenceString.length, frameCount);
        renderDetailedResults(results, frameCount);

        lastResults = {
            metadata: {
                referenceString,
                frameCount,
                algorithms: results.map((r) => r.name),
            },
            results,
        };

        announceStatus("Simulation complete", "success");
    } catch (error) {
        announceStatus(error.message, "error");
        lastResults = null;
    }
}

function renderSummaries(results) {
    summaryCards.innerHTML = "";
    results.forEach((result) => {
        const card = document.createElement("article");
        card.className = "summary-card";
        card.innerHTML = `
            <h3>${result.name}</h3>
            <div class="metric">${result.pageFaults}</div>
            <div class="submetric">Page faults · Hit ratio ${result.hitRatio.toFixed(1)}%</div>
        `;
        summaryCards.append(card);
    });
}

function renderComparisonTable(results, referenceCount, frameCount) {
    comparisonBody.innerHTML = "";

    totalReferences.textContent = `${referenceCount} reference${referenceCount === 1 ? "" : "s"}`;
    frameSummary.textContent = `${frameCount} frame${frameCount === 1 ? "" : "s"}`;

    results.forEach((result) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${result.name}</td>
            <td>${result.pageFaults}</td>
            <td>${result.hitRatio.toFixed(1)}%</td>
            <td><span class="badge ${getBadgeClass(result.performance)}">${result.performance}</span></td>
        `;
        comparisonBody.append(row);
    });
}

function renderDetailedResults(results, frameCount) {
    resultDeck.innerHTML = "";

    results.forEach((result) => {
        const node = resultTemplate.content.firstElementChild.cloneNode(true);
        const header = node.querySelector(".result-card__header h3");
        const subtitle = node.querySelector(".result-card__subtitle");
        const badge = node.querySelector(".badge");
        const stats = node.querySelector(".result-card__stats");
        const tableBody = node.querySelector("tbody");

        header.textContent = result.name;
        subtitle.textContent = `${result.referenceCount} references · ${frameCount} frames`;
        badge.textContent = result.performance;
        badge.classList.add(getBadgeClass(result.performance));

        stats.innerHTML = "";
        const statDefinitions = [
            { label: "Page Faults", value: result.pageFaults },
            { label: "Hit Ratio", value: `${result.hitRatio.toFixed(1)}%` },
            { label: "Fault Ratio", value: `${((result.pageFaults / result.referenceCount) * 100).toFixed(1)}%` },
        ];
        statDefinitions.forEach((stat) => {
            const statEl = document.createElement("div");
            statEl.className = "stat";
            statEl.innerHTML = `<span>${stat.label}</span><span>${stat.value}</span>`;
            stats.append(statEl);
        });

        tableBody.innerHTML = "";
        result.steps.forEach((step) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${step.page}</td>
                <td>${formatFrames(step.frames, frameCount)}</td>
                <td class="${step.fault ? "fault" : "hit"}">${step.fault ? "FAULT" : "HIT"}</td>
            `;
            tableBody.append(row);
        });

        resultDeck.append(node);
    });
}

function getBadgeClass(performance) {
    switch (performance.toLowerCase()) {
        case "excellent":
            return "badge--excellent";
        case "good":
            return "badge--good";
        case "average":
            return "badge--average";
        default:
            return "badge--poor";
    }
}

function formatFrames(frames, frameCount) {
    const padded = [...frames];
    while (padded.length < frameCount) {
        padded.push(null);
    }
    return "[" + padded.map((value) => (value === null || value === undefined ? "-" : value)).join(", ") + "]";
}

function getPerformanceRating(pageFaults, referenceCount) {
    const ratio = pageFaults / referenceCount;
    if (ratio <= 0.3) return "Excellent";
    if (ratio <= 0.5) return "Good";
    if (ratio <= 0.7) return "Average";
    return "Poor";
}

function simulateFIFO(referenceString, frameCount) {
    const frames = Array(frameCount).fill(null);
    let pointer = 0;
    let pageFaults = 0;
    const steps = [];

    referenceString.forEach((page) => {
        const isHit = frames.includes(page);
        if (!isHit) {
            frames[pointer] = page;
            pointer = (pointer + 1) % frameCount;
            pageFaults += 1;
        }
        steps.push({
            page,
            frames: frames.slice(),
            fault: !isHit,
        });
    });

    const referenceCount = referenceString.length;
    const hitRatio = ((referenceCount - pageFaults) / referenceCount) * 100;

    return {
        pageFaults,
        referenceCount,
        hitRatio,
        steps,
        performance: getPerformanceRating(pageFaults, referenceCount),
    };
}

function simulateLRU(referenceString, frameCount) {
    const frames = [];
    let pageFaults = 0;
    const steps = [];

    referenceString.forEach((page) => {
        const existingIndex = frames.indexOf(page);
        if (existingIndex !== -1) {
            frames.splice(existingIndex, 1);
            frames.push(page);
        } else {
            if (frames.length === frameCount) {
                frames.shift();
            }
            frames.push(page);
            pageFaults += 1;
        }

        steps.push({
            page,
            frames: frames.slice(),
            fault: existingIndex === -1,
        });
    });

    const referenceCount = referenceString.length;
    const hitRatio = ((referenceCount - pageFaults) / referenceCount) * 100;

    return {
        pageFaults,
        referenceCount,
        hitRatio,
        steps,
        performance: getPerformanceRating(pageFaults, referenceCount),
    };
}

function simulateOptimal(referenceString, frameCount) {
    const frames = [];
    let pageFaults = 0;
    const steps = [];

    referenceString.forEach((page, index) => {
        const existingIndex = frames.indexOf(page);
        if (existingIndex !== -1) {
            // hit
        } else {
            if (frames.length < frameCount) {
                frames.push(page);
            } else {
                const replaceIndex = findOptimalReplacementIndex(frames, referenceString, index + 1);
                frames[replaceIndex] = page;
            }
            pageFaults += 1;
        }

        steps.push({
            page,
            frames: frames.slice(),
            fault: existingIndex === -1,
        });
    });

    const referenceCount = referenceString.length;
    const hitRatio = ((referenceCount - pageFaults) / referenceCount) * 100;

    return {
        pageFaults,
        referenceCount,
        hitRatio,
        steps,
        performance: getPerformanceRating(pageFaults, referenceCount),
    };
}

function findOptimalReplacementIndex(frames, referenceString, startIndex) {
    let indexToReplace = 0;
    let farthestDistance = -1;

    for (let i = 0; i < frames.length; i += 1) {
        const frameValue = frames[i];
        let distance = Infinity;

        for (let j = startIndex; j < referenceString.length; j += 1) {
            if (referenceString[j] === frameValue) {
                distance = j - startIndex;
                break;
            }
        }

        if (!Number.isFinite(distance)) {
            return i;
        }

        if (distance > farthestDistance) {
            farthestDistance = distance;
            indexToReplace = i;
        }
    }

    return indexToReplace;
}

function announceStatus(message, type = "info") {
    statusBanner.textContent = message;
    statusBanner.className = type === "error" ? "show" : "show success";
    if (type === "success") {
        statusBanner.style.background = "rgba(34, 197, 94, 0.12)";
        statusBanner.style.borderColor = "rgba(34, 197, 94, 0.3)";
        statusBanner.style.color = "var(--success)";
    } else {
        statusBanner.style.background = "rgba(239, 68, 68, 0.08)";
        statusBanner.style.borderColor = "rgba(239, 68, 68, 0.2)";
        statusBanner.style.color = "var(--danger)";
    }
}

function clearStatus() {
    statusBanner.textContent = "";
    statusBanner.className = "";
    statusBanner.removeAttribute("style");
}

function clearOutput() {
    summaryCards.innerHTML = "";
    comparisonBody.innerHTML = "";
    resultDeck.innerHTML = "";
    totalReferences.textContent = "0 references";
    frameSummary.textContent = "0 frames";
    lastResults = null;
    clearStatus();
}

function handleExport() {
    if (!lastResults) {
        announceStatus("Run a simulation before exporting results", "error");
        return;
    }

    const lines = [];
    const { metadata, results } = lastResults;

    lines.push("Page Replacement Algorithm Simulation Results");
    lines.push("================================================");
    lines.push(`Reference string: ${metadata.referenceString.join(", ")}`);
    lines.push(`Frame count: ${metadata.frameCount}`);
    lines.push("");

    results.forEach((result) => {
        lines.push(result.name);
        lines.push("--".repeat(result.name.length / 2 + 6));
        lines.push(`Page faults: ${result.pageFaults}`);
        lines.push(`Hit ratio: ${result.hitRatio.toFixed(2)}%`);
        lines.push(`Performance: ${result.performance}`);
        lines.push("Timeline:");
        result.steps.forEach((step, index) => {
            lines.push(
                `  ${index + 1}. page ${step.page} -> ${formatFrames(step.frames, metadata.frameCount)} :: ${
                    step.fault ? "FAULT" : "HIT"
                }`
            );
        });
        lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    anchor.download = `page-replacement-results-${timestamp}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
}

function hydrateDefaults() {
    referenceInput.value = "7,0,1,2,0,3,0,4,2,3,0,3,2";
    frameInput.value = "3";
}

runButton.addEventListener("click", runSimulation);
clearButton.addEventListener("click", clearOutput);
exportButton.addEventListener("click", handleExport);
controlForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runSimulation();
});

exampleChips.forEach((chip) => {
    chip.addEventListener("click", () => {
        referenceInput.value = chip.dataset.example;
        frameInput.value = chip.dataset.frames;
        referenceInput.focus({ preventScroll: true });
    });
});

hydrateDefaults();
renderSummaries([]);
