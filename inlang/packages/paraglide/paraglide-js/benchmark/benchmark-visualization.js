/**
 * @typedef {Object} LibraryGroup
 * @property {string} name - The name of the library group
 * @property {string[]} libraries - Array of library names in this group
 * @property {string} color - The color associated with this group
 */

/**
 * @typedef {Object} FilterValues
 * @property {number} [locales] - Number of locales
 * @property {number} [messages] - Number of messages
 * @property {number} [namespace] - Namespace size
 */

/**
 * @typedef {Object} ChartDataPoint
 * @property {number} x - X-axis value
 * @property {number} y - Y-axis value
 */

/**
 * @typedef {Object} ChartDataset
 * @property {string} label - Dataset label
 * @property {ChartDataPoint[]} data - Array of data points
 * @property {string} borderColor - Border color
 * @property {string} backgroundColor - Background color
 * @property {number} borderWidth - Border width
 * @property {number} tension - Line tension
 * @property {boolean} fill - Whether to fill area under line
 * @property {string} group - Group name
 */

/**
 * @typedef {Object} ChartData
 * @property {ChartDataset[]} datasets - Array of datasets
 */

/**
 * @typedef {Object} ScenarioResult
 * @property {string} library - Library name
 * @property {number} size - Bundle size in KB
 */

/**
 * @typedef {Object} Scenario
 * @property {number} locales - Number of locales
 * @property {number} usedMessages - Number of used messages
 * @property {number} namespaceSize - Size of namespace
 * @property {ScenarioResult[]} results - Benchmark results
 */

/**
 * @typedef {Object} BenchmarkData
 * @property {Scenario[]} scenarios - Array of benchmark scenarios
 */

class BenchmarkVisualization extends HTMLElement {
	constructor() {
		super();
		/** @type {BenchmarkData|null} */
		this.data = null;
		/** @type {Record<string, any>} */
		this.charts = {};
		/** @type {LibraryGroup[]} */
		this.libraryGroups = [
			{
				name: "paraglide",
				libraries: [
					"paraglide (experimental-middleware-locale-splitting)",
					"paraglide (default)",
				],
				color: "rgb(75, 192, 192)",
			},
			{
				name: "i18next",
				libraries: ["i18next (default)", "i18next (http-backend)"],
				color: "rgb(54, 162, 235)",
			},
		];
		/** @type {Set<string>} */
		this.activeGroups = new Set(["paraglide", "i18next"]);
		this.attachShadow({ mode: "open" });
		this.loadChartJS();
	}

	static get observedAttributes() {
		return ["src"];
	}

	/**
	 * @param {string} name
	 * @param {string|null} oldValue
	 * @param {string} newValue
	 */
	async attributeChangedCallback(name, oldValue, newValue) {
		if (name === "src" && oldValue !== newValue) {
			try {
				const response = await fetch(newValue);
				/** @type {BenchmarkData} */
				const data = await response.json();
				this.setData(data);
			} catch (error) {
				console.error("Failed to load data:", error);
			}
		}
	}

	async loadChartJS() {
		if (window.Chart) {
			if (this.data) {
				this.render();
			}
			return;
		}

		const script = document.createElement("script");
		script.src = "https://cdn.jsdelivr.net/npm/chart.js";
		script.onload = () => {
			if (this.data) {
				this.render();
			}
		};
		document.head.appendChild(script);
	}

	/**
	 * @param {BenchmarkData} data
	 */
	setData(data) {
		this.data = data;
		if (window.Chart) {
			this.render();
		}
	}

	connectedCallback() {
		const src = this.getAttribute("src");
		if (src) {
			this.attributeChangedCallback("src", null, src);
		}
	}

	/**
	 * @returns {{ locales: number[], usedMessages: number[], namespaceSizes: number[] }}
	 */
	getAvailableValues() {
		if (!this.data?.scenarios)
			return { locales: [], usedMessages: [], namespaceSizes: [] };

		const locales = [
			...new Set(this.data.scenarios.map((s) => s.locales)),
		].sort((a, b) => a - b);
		const usedMessages = [
			...new Set(this.data.scenarios.map((s) => s.usedMessages)),
		].sort((a, b) => a - b);
		const namespaceSizes = [
			...new Set(this.data.scenarios.map((s) => s.namespaceSize)),
		].sort((a, b) => a - b);

		return { locales, usedMessages, namespaceSizes };
	}

	/**
	 * @param {number} locales
	 * @param {number} usedMessages
	 * @param {number} namespaceSize
	 * @returns {ScenarioResult[]|null}
	 */
	findExactScenario(locales, usedMessages, namespaceSize) {
		if (!this.data?.scenarios) return null;

		const scenario = this.data.scenarios.find(
			(s) =>
				s.locales === locales &&
				s.usedMessages === usedMessages &&
				s.namespaceSize === namespaceSize
		);

		return scenario?.results || null;
	}

	/**
	 * @param {'locales'|'usedMessages'} type
	 * @param {FilterValues} filterValues
	 * @returns {ChartData}
	 */
	prepareChartData(type, filterValues) {
		if (!this.data?.scenarios) return { datasets: [] };

		let filteredScenarios = this.data.scenarios;

		if (type === "locales" && filterValues.messages && filterValues.namespace) {
			filteredScenarios = this.data.scenarios.filter(
				(s) =>
					s.usedMessages === filterValues.messages &&
					s.namespaceSize === filterValues.namespace
			);
		} else if (
			type === "usedMessages" &&
			filterValues.locales &&
			filterValues.namespace
		) {
			filteredScenarios = this.data.scenarios.filter(
				(s) =>
					s.locales === filterValues.locales &&
					s.namespaceSize === filterValues.namespace
			);
		}

		const datasets = this.libraryGroups.flatMap((group) => {
			if (!this.activeGroups.has(group.name)) return [];

			return group.libraries.map((library) => ({
				label: library,
				data: filteredScenarios.map((scenario) => ({
					x: scenario[type],
					y: scenario.results.find((r) => r.library === library)?.size || 0,
				})),
				borderColor: this.adjustColor(
					group.color,
					group.libraries.indexOf(library)
				),
				backgroundColor: this.adjustColor(
					group.color,
					group.libraries.indexOf(library)
				),
				borderWidth: 2,
				tension: 0.4,
				fill: false,
				group: group.name,
			}));
		});

		return { datasets };
	}

	/**
	 * @param {string} baseColor
	 * @param {number} index
	 * @returns {string}
	 */
	adjustColor(baseColor, index) {
		if (index === 0) return baseColor;

		const rgb = baseColor.match(/\d+/g).map(Number);
		const lighterRgb = rgb.map((value) => Math.min(255, value + 40));
		return `rgb(${lighterRgb.join(", ")})`;
	}

	/**
	 * @param {string} groupName
	 */
	toggleLibraryGroup(groupName) {
		if (this.activeGroups.has(groupName)) {
			this.activeGroups.delete(groupName);
		} else {
			this.activeGroups.add(groupName);
		}

		this.updateChart("locales");
		this.updateChart("usedMessages");
		this.updateResults();
	}

	/**
	 * @param {'locales'|'usedMessages'} type
	 */
	updateChart(type) {
		if (!this.shadowRoot || !this.data || !window.Chart) return;

		const chartId = type === "locales" ? "localesChart" : "messagesChart";
		/** @type {HTMLCanvasElement|null} */
		const canvas = this.shadowRoot.getElementById(chartId);
		if (!canvas) return;

		const filterValues = {
			locales: parseInt(
				this.shadowRoot.getElementById(`${chartId}-locales`)?.value || "0"
			),
			messages: parseInt(
				this.shadowRoot.getElementById(`${chartId}-messages`)?.value || "0"
			),
			namespace: parseInt(
				this.shadowRoot.getElementById(`${chartId}-namespace`)?.value || "0"
			),
		};

		if (this.charts[type]) {
			this.charts[type].data = this.prepareChartData(type, filterValues);
			this.charts[type].update();
		} else {
			this.createChart(canvas, type, filterValues);
		}
	}

	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {'locales'|'usedMessages'} type
	 * @param {FilterValues} filterValues
	 */
	createChart(canvas, type, filterValues) {
		if (!canvas || !window.Chart) return;

		if (this.charts[type]) {
			this.charts[type].destroy();
		}

		const chartData = this.prepareChartData(type, filterValues);

		const maxY = Math.max(
			...chartData.datasets.flatMap((dataset) =>
				dataset.data.map((point) => point.y)
			)
		);

		const yAxisMax = maxY * 1.2;

		this.charts[type] = new window.Chart(canvas, {
			type: "line",
			data: chartData,
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					intersect: false,
					mode: "index",
				},
				plugins: {
					legend: {
						position: "top",
						labels: {
							font: {
								family: "system-ui, -apple-system, sans-serif",
							},
						},
					},
					tooltip: {
						callbacks: {
							label: (context) =>
								`${context.dataset.label}: ${context.parsed.y.toFixed(1)} KB`,
						},
					},
				},
				scales: {
					x: {
						type: "linear",
						title: {
							display: true,
							text:
								type === "locales"
									? "Number of Locales"
									: "Number of Used Messages",
							font: {
								family: "system-ui, -apple-system, sans-serif",
							},
						},
						ticks: {
							stepSize: type === "locales" ? 5 : 100,
							font: {
								family: "system-ui, -apple-system, sans-serif",
							},
						},
					},
					y: {
						beginAtZero: true,
						suggestedMax: yAxisMax,
						title: {
							display: true,
							text: "Transfer Size (KB)",
							font: {
								family: "system-ui, -apple-system, sans-serif",
							},
						},
						ticks: {
							font: {
								family: "system-ui, -apple-system, sans-serif",
							},
						},
					},
				},
			},
		});
	}

	updateResults() {
		if (!this.shadowRoot || !this.data) return;

		const locales = parseInt(
			this.shadowRoot.getElementById("locales")?.value || "5"
		);
		const messages = parseInt(
			this.shadowRoot.getElementById("messages")?.value || "200"
		);
		const namespace = parseInt(
			this.shadowRoot.getElementById("namespace")?.value || "500"
		);

		if (this.shadowRoot.getElementById("localesValue")) {
			this.shadowRoot.getElementById("localesValue").textContent =
				locales.toString();
		}
		if (this.shadowRoot.getElementById("messagesValue")) {
			this.shadowRoot.getElementById("messagesValue").textContent =
				messages.toString();
		}
		if (this.shadowRoot.getElementById("namespaceValue")) {
			this.shadowRoot.getElementById("namespaceValue").textContent =
				namespace.toString();
		}

		const results = this.findExactScenario(locales, messages, namespace);
		if (!results) {
			const tbody = this.shadowRoot.getElementById("results");
			if (tbody) {
				tbody.innerHTML = `
          <tr>
            <td colspan="2" class="text-center text-gray-500">
              No data available for the selected combination
            </td>
          </tr>
        `;
			}
			return;
		}

		const activeLibraries = this.libraryGroups
			.filter((group) => this.activeGroups.has(group.name))
			.flatMap((group) => group.libraries);

		const filteredResults = results.filter((result) =>
			activeLibraries.includes(result.library)
		);

		const maxSize = Math.max(...filteredResults.map((r) => r.size));
		const tbody = this.shadowRoot.getElementById("results");
		if (tbody) {
			tbody.innerHTML = filteredResults
				.map((result) => {
					const group = this.libraryGroups.find((g) =>
						g.libraries.includes(result.library)
					);
					const colorIndex = group.libraries.indexOf(result.library);
					const barColor = this.adjustColor(group.color, colorIndex);

					return `
          <tr>
            <td>${result.library}</td>
            <td class="bar-cell">
              <div class="bar" style="width: ${(result.size / maxSize) * 100}%; background-color: ${barColor}"></div>
              ${result.size.toFixed(1)} KB
            </td>
          </tr>
        `;
				})
				.join("");
		}
	}

	render() {
		if (!this.data || !window.Chart) return;

		const style = `
      :host {
        display: block;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
      .controls {
        background: #f5f5f5;
        padding: 1.25rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
      }
      .slider-group {
        margin-bottom: 1rem;
      }
      .slider-group:last-child {
        margin-bottom: 0;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      .slider-container {
        display: flex;
        align-items: center;
        gap: 0.625rem;
      }
      select {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        background-color: white;
      }
      .value {
        min-width: 3.75rem;
        text-align: right;
        font-family: monospace;
      }
      .section {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 1.5rem 0;
      }
      .library-toggles {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .toggle-button {
        padding: 0.5rem 1rem;
        border: 2px solid;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      .toggle-button[data-active="true"] {
        opacity: 1;
      }
      .toggle-button[data-active="false"] {
        opacity: 0.5;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1.25rem;
      }
      th, td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }
      th {
        background: #f9fafb;
        font-weight: 600;
      }
      .bar-cell {
        position: relative;
      }
      .bar {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 0.5rem;
        opacity: 0.3;
        border-radius: 0.25rem;
      }
      .chart-container {
        height: 400px;
        width: 100%;
        position: relative;
      }
      .text-center {
        text-align: center;
      }
      .text-gray-500 {
        color: #6b7280;
      }
    `;

		const { locales, usedMessages, namespaceSizes } = this.getAvailableValues();

		this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="container">
        <section class="section">
          <h2>Interactive Bundle Size Comparison</h2>
          <div class="library-toggles">
            ${this.libraryGroups
							.map(
								(group) => `
              <button
                class="toggle-button"
                data-group="${group.name}"
                data-active="${this.activeGroups.has(group.name)}"
                style="border-color: ${group.color}; color: ${group.color}; background: ${group.color}10"
              >
                ${group.name}
              </button>
            `
							)
							.join("")}
          </div>
          <div class="controls">
            <div class="slider-group">
              <label for="locales">Number of Locales</label>
              <div class="slider-container">
                <select id="locales">
                  ${locales
										.map(
											(value) => `
                    <option value="${value}">${value}</option>
                  `
										)
										.join("")}
                </select>
                <span class="value" id="localesValue">${locales[0]}</span>
              </div>
            </div>
            <div class="slider-group">
              <label for="messages">Number of Used Messages</label>
              <div class="slider-container">
                <select id="messages">
                  ${usedMessages
										.map(
											(value) => `
                    <option value="${value}">${value}</option>
                  `
										)
										.join("")}
                </select>
                <span class="value" id="messagesValue">${usedMessages[0]}</span>
              </div>
            </div>
            <div class="slider-group">
              <label for="namespace">Namespace Size</label>
              <div class="slider-container">
                <select id="namespace">
                  ${namespaceSizes
										.map(
											(value) => `
                    <option value="${value}">${value}</option>
                  `
										)
										.join("")}
                </select>
                <span class="value" id="namespaceValue">${namespaceSizes[0]}</span>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Library</th>
                <th>Total Transfer Size</th>
              </tr>
            </thead>
            <tbody id="results"></tbody>
          </table>
        </section>

        <section class="section">
          <h2>Scaling with Messages</h2>
          <div class="library-toggles">
            ${this.libraryGroups
							.map(
								(group) => `
              <button
                class="toggle-button"
                data-group="${group.name}"
                data-active="${this.activeGroups.has(group.name)}"
                style="border-color: ${group.color}; color: ${group.color}; background: ${group.color}10"
              >
                ${group.name}
              </button>
            `
							)
							.join("")}
          </div>
          <div class="controls">
            <div class="slider-group">
              <label for="messagesChart-locales">Number of Locales</label>
              <div class="slider-container">
                <select id="messagesChart-locales">
                  ${locales
										.map(
											(value) => `
                    <option value="${value}">${value}</option>
                  `
										)
										.join("")}
                </select>
              </div>
            </div>
            <div class="slider-group">
              <label for="messagesChart-namespace">Namespace Size</label>
              <div class="slider-container">
                <select id="messagesChart-namespace">
                  ${namespaceSizes
										.map(
											(value) => `
                    <option value="${value}">${value}</option>
                  `
										)
										.join("")}
                </select>
              </div>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="messagesChart"></canvas>
          </div>
        </section>

        <section class="section">
          <h2>Scaling with Locales</h2>
          <div class="library-toggles">
            ${this.libraryGroups
							.map(
								(group) => `
              <button
                class="toggle-button"
                data-group="${group.name}"
                data-active="${this.activeGroups.has(group.name)}"
                style="border-color: ${group.color}; color: ${group.color}; background: ${group.color}10"
              >
                ${group.name}
              </button>
            `
							)
							.join("")}
          </div>
          <div class="controls">
            <div class="slider-group">
              <label for="localesChart-messages">Number of Used Messages</label>
              <div class="slider-container">
                <select id="localesChart-messages">
                  ${usedMessages
										.map(
											(value) => `
                    <option value="${value}">${value}</option>
                  `
										)
										.join("")}
                </select>
              </div>
            </div>
            <div class="slider-group">
              <label for="localesChart-namespace">Namespace Size</label>
              <div class="slider-container">
                <select id="localesChart-namespace">
                  ${namespaceSizes
										.map(
											(value) => `
                    <option value="${value}">${value}</option>
                  `
										)
										.join("")}
                </select>
              </div>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="localesChart"></canvas>
          </div>
        </section>
      </div>
    `;

		// Add event listeners for library toggle buttons
		this.shadowRoot.querySelectorAll(".toggle-button").forEach((button) => {
			button.addEventListener("click", () => {
				const groupName = button.getAttribute("data-group");
				this.toggleLibraryGroup(groupName);

				// Update button states
				this.shadowRoot
					.querySelectorAll(`[data-group="${groupName}"]`)
					.forEach((btn) => {
						btn.setAttribute(
							"data-active",
							this.activeGroups.has(groupName).toString()
						);
					});
			});
		});

		// Add event listeners for the main comparison controls
		["locales", "messages", "namespace"].forEach((id) => {
			const element = this.shadowRoot.getElementById(id);
			if (element) {
				element.addEventListener("change", () => this.updateResults());
			}
		});

		// Add event listeners for the messages chart controls
		["messagesChart-locales", "messagesChart-namespace"].forEach((id) => {
			const element = this.shadowRoot.getElementById(id);
			if (element) {
				element.addEventListener("change", () =>
					this.updateChart("usedMessages")
				);
			}
		});

		// Add event listeners for the locales chart controls
		["localesChart-messages", "localesChart-namespace"].forEach((id) => {
			const element = this.shadowRoot.getElementById(id);
			if (element) {
				element.addEventListener("change", () => this.updateChart("locales"));
			}
		});

		// Create the initial charts
		setTimeout(() => {
			this.updateChart("usedMessages");
			this.updateChart("locales");
		}, 0);

		// Initial update for the comparison table
		this.updateResults();
	}

	disconnectedCallback() {
		// Clean up charts
		Object.values(this.charts).forEach((chart) => chart.destroy());

		// Remove event listeners
		if (this.shadowRoot) {
			// Library toggle buttons
			this.shadowRoot.querySelectorAll(".toggle-button").forEach((button) => {
				const groupName = button.getAttribute("data-group");
				button.removeEventListener("click", () =>
					this.toggleLibraryGroup(groupName)
				);
			});

			// Main comparison controls
			["locales", "messages", "namespace"].forEach((id) => {
				const element = this.shadowRoot.getElementById(id);
				if (element) {
					element.removeEventListener("change", () => this.updateResults());
				}
			});

			// Messages chart controls
			["messagesChart-locales", "messagesChart-namespace"].forEach((id) => {
				const element = this.shadowRoot.getElementById(id);
				if (element) {
					element.removeEventListener("change", () =>
						this.updateChart("usedMessages")
					);
				}
			});

			// Locales chart controls
			["localesChart-messages", "localesChart-namespace"].forEach((id) => {
				const element = this.shadowRoot.getElementById(id);
				if (element) {
					element.removeEventListener("change", () =>
						this.updateChart("locales")
					);
				}
			});
		}
	}
}

customElements.define("benchmark-visualization", BenchmarkVisualization);