/**
 * @typedef {Object} BenchmarkResult
 * @property {string} library - The name of the library
 * @property {number} size - The total transfer size in KB
 */

/**
 * @typedef {Object} Scenario
 * @property {number} locales - Number of locales
 * @property {number} usedMessages - Number of used messages
 * @property {number} namespaceSize - Size of namespace
 * @property {number} namespaceSizeFactor - Factor of namespace size compared to used messages
 * @property {BenchmarkResult[]} results - Benchmark results for this scenario
 */

/**
 * @typedef {Object} BenchmarkData
 * @property {Scenario[]} scenarios - Array of benchmark scenarios
 */

class BenchmarkVisualization extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.localesChart = null;
		this.messagesChart = null;
		this.loadChartJS();
	}

	async loadChartJS() {
		const script = document.createElement("script");
		script.src = "https://cdn.jsdelivr.net/npm/chart.js";
		script.onload = () => {
			if (this.pendingData) {
				this.setData(this.pendingData);
				this.pendingData = null;
			}
		};
		document.head.appendChild(script);
	}

	/**
	 * @param {BenchmarkData} data
	 */
	setData(data) {
		if (!window.Chart) {
			this.pendingData = data;
			return;
		}
		this.data = data;
		this.render();
	}

	/**
	 * @param {number} locales
	 * @param {number} messages
	 * @param {number} namespaceSize
	 * @returns {BenchmarkResult[] | undefined}
	 */
	findClosestScenario(locales, messages, namespaceSize) {
		return this.data.scenarios.find(
			(s) =>
				s.locales === locales &&
				s.usedMessages === messages &&
				s.namespaceSize === namespaceSize
		)?.results;
	}

	connectedCallback() {
		this.render();
		
		// Load data from src attribute if provided
		const src = this.getAttribute('src');
		if (src) {
			this.loadDataFromSrc(src);
		}
	}
	
	async loadDataFromSrc(src) {
		try {
			const response = await fetch(src);
			if (!response.ok) {
				throw new Error(`Failed to load data: ${response.status}`);
			}
			const data = await response.json();
			this.setData(data);
		} catch (error) {
			console.error('Error loading benchmark data:', error);
			const errorEl = document.createElement('div');
			errorEl.textContent = `Error loading benchmark data: ${error.message}`;
			errorEl.style.color = 'red';
			errorEl.style.padding = '20px';
			this.shadowRoot.appendChild(errorEl);
		}
	}

	getColors() {
		return [
			"rgb(75, 192, 192)",
			"rgb(54, 162, 235)",
			"rgb(255, 99, 132)",
			"rgb(255, 206, 86)",
		];
	}

	findClosestMessage(namespaceSize) {
		// Find the closest message count for the given namespace size factor
		const messages = [...new Set(this.data.scenarios.map(s => s.usedMessages))];
		const factors = [...new Set(this.data.scenarios.map(s => s.namespaceSizeFactor))];
		
		// For scenarios with the same factor, find their messages
		for (const scenario of this.data.scenarios) {
			if (scenario.namespaceSize === namespaceSize && scenario.usedMessages) {
				return scenario.usedMessages;
			}
		}
		
		return 200; // Default if not found
	}

	/**
	 * @param {number} messages
	 * @param {number} namespaceSize
	 */
	prepareChartDataByLocales(messages, namespaceSize) {
		if (!this.data || !this.data.scenarios || this.data.scenarios.length === 0) {
			return { datasets: [] };
		}

		const libraries = [...new Set(this.data.scenarios.flatMap(s => s.results.map(r => r.library)))];
		const colors = this.getColors();
		
		const datasets = libraries.map((library, index) => {
			// Filter scenarios with matching messages and namespace size
			const relevantScenarios = this.data.scenarios.filter(s => 
				s.usedMessages === messages && s.namespaceSize === namespaceSize
			);
			
			// Sort by locales
			relevantScenarios.sort((a, b) => a.locales - b.locales);
			
			const data = relevantScenarios.map(scenario => {
				const result = scenario.results.find(r => r.library === library);
				return {
					x: scenario.locales,
					y: result ? result.size : 0
				};
			}).filter(point => point.y > 0); // Only include points with data
			
			return {
				label: library,
				data: data,
				borderColor: colors[index % colors.length],
				backgroundColor: colors[index % colors.length].replace(')', ', 0.1)').replace('rgb', 'rgba'),
				borderWidth: 2,
				tension: 0.4,
				fill: false,
			};
		}).filter(dataset => dataset.data.length > 0); // Only include datasets with data

		return {
			datasets,
		};
	}
	
	/**
	 * @param {number} locales
	 * @param {number} namespaceSize
	 */
	prepareChartDataByMessages(locales, namespaceSize) {
		if (!this.data || !this.data.scenarios || this.data.scenarios.length === 0) {
			return { datasets: [] };
		}

		const libraries = [...new Set(this.data.scenarios.flatMap(s => s.results.map(r => r.library)))];
		const colors = this.getColors();
		
		// Find factor for this namespace size
		const factor = this.data.scenarios.find(s => s.namespaceSize === namespaceSize)?.namespaceSizeFactor || 1;
		
		const datasets = libraries.map((library, index) => {
			// Filter scenarios with matching locales and similar factor
			const relevantScenarios = this.data.scenarios.filter(s => 
				s.locales === locales && 
				Math.abs(s.namespaceSizeFactor - factor) < 0.1 // Allow small factor difference
			);
			
			// Sort by message count
			relevantScenarios.sort((a, b) => a.usedMessages - b.usedMessages);
			
			const data = relevantScenarios.map(scenario => {
				const result = scenario.results.find(r => r.library === library);
				return {
					x: scenario.usedMessages,
					y: result ? result.size : 0
				};
			}).filter(point => point.y > 0); // Only include points with data
			
			return {
				label: library,
				data: data,
				borderColor: colors[index % colors.length],
				backgroundColor: colors[index % colors.length].replace(')', ', 0.1)').replace('rgb', 'rgba'),
				borderWidth: 2,
				tension: 0.4,
				fill: false,
			};
		}).filter(dataset => dataset.data.length > 0); // Only include datasets with data

		return {
			datasets,
		};
	}

	renderCharts(locales, messages, namespaceSize) {
		if (!window.Chart) return;

		// Render locales chart
		this.renderLocalesChart(messages, namespaceSize);
		
		// Render messages chart
		this.renderMessagesChart(locales, namespaceSize);
	}

	renderLocalesChart(messages, namespaceSize) {
		const canvas = this.shadowRoot.getElementById("localesChart");
		if (!canvas) return;

		if (this.localesChart) {
			this.localesChart.destroy();
		}

		// Prepare data for locales chart (x-axis is locales)
		const chartData = this.prepareChartDataByLocales(messages, namespaceSize);

		this.localesChart = new window.Chart(canvas, {
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
					title: {
						display: true,
						text: `Transfer Size by Number of Locales (Used Messages: ${messages}, Namespace Size: ${namespaceSize})`,
					},
					legend: {
						display: true,
						position: "top",
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
						display: true,
						title: {
							display: true,
							text: "Number of Locales",
						},
						ticks: {
							stepSize: 5,
						},
					},
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: "Transfer Size (KB)",
						},
					},
				},
			},
		});
	}

	renderMessagesChart(locales, namespaceSize) {
		const canvas = this.shadowRoot.getElementById("messagesChart");
		if (!canvas) return;

		if (this.messagesChart) {
			this.messagesChart.destroy();
		}

		// Prepare data for messages chart (x-axis is messages)
		const chartData = this.prepareChartDataByMessages(locales, namespaceSize);

		this.messagesChart = new window.Chart(canvas, {
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
					title: {
						display: true,
						text: `Transfer Size by Used Messages (Locales: ${locales}, Factor: ${(namespaceSize / this.findClosestMessage(namespaceSize)).toFixed(1)}x)`,
					},
					legend: {
						display: true,
						position: "top",
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
						display: true,
						title: {
							display: true,
							text: "Used Messages",
						},
					},
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: "Transfer Size (KB)",
						},
					},
				},
			},
		});
	}

	render() {
		if (!this.data) return;

		const style = `
      :host {
        display: block;
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .controls {
        background: #f5f5f5;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
      }
      .slider-group {
        margin-bottom: 15px;
      }
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
      }
      .slider-container {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      input[type="range"] {
        flex: 1;
      }
      .value {
        min-width: 60px;
        text-align: right;
      }
      .factor {
        min-width: 50px;
        color: #666;
      }
      h3 {
        margin-top: 30px;
        margin-bottom: 10px;
        color: #333;
        font-size: 1.2rem;
      }
      .chart-container {
        height: 400px;
        margin-bottom: 30px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      th {
        background: #f5f5f5;
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
        height: 8px;
        background: #4CAF50;
        opacity: 0.3;
        border-radius: 4px;
      }
    `;

		const maxLocales = Math.max(...this.data.scenarios.map((s) => s.locales));
		const maxMessages = Math.max(...this.data.scenarios.map((s) => s.messages));
		const maxNamespaceSize = Math.max(
			...this.data.scenarios.map((s) => s.namespaceSize)
		);

		this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="controls">
        <div class="slider-group">
          <label for="locales">Number of Locales</label>
          <div class="slider-container">
            <input type="range" id="locales" min="5" max="${maxLocales}" step="5" value="5">
            <span class="value" id="localesValue">5</span>
          </div>
        </div>
        <div class="slider-group">
          <label for="messages">Used Messages</label>
          <div class="slider-container">
            <input type="range" id="messages" min="100" max="${maxMessages}" step="100" value="200">
            <span class="value" id="messagesValue">200</span>
          </div>
        </div>
        <div class="slider-group">
          <label for="namespace">Namespace Size</label>
          <div class="slider-container">
            <input type="range" id="namespace" min="100" max="${maxNamespaceSize}" step="100" value="500">
            <span class="value" id="namespaceValue">500</span>
            <span class="factor" id="namespaceFactorValue">(2.5x)</span>
          </div>
        </div>
      </div>
      <h3>Size by Number of Locales</h3>
      <div class="chart-container">
        <canvas id="localesChart"></canvas>
      </div>

      <h3>Size by Used Messages</h3>
      <div class="chart-container">
        <canvas id="messagesChart"></canvas>
      </div>

      <h3>Raw Results</h3>
      <table>
        <thead>
          <tr>
            <th>Library</th>
            <th>Total Transfer Size</th>
          </tr>
        </thead>
        <tbody id="results"></tbody>
      </table>
    `;

		const updateResults = () => {
			const locales = parseInt(this.shadowRoot.getElementById("locales").value);
			const messages = parseInt(
				this.shadowRoot.getElementById("messages").value
			);
			const namespace = parseInt(
				this.shadowRoot.getElementById("namespace").value
			);

			this.shadowRoot.getElementById("localesValue").textContent = locales;
			this.shadowRoot.getElementById("messagesValue").textContent = messages;
			this.shadowRoot.getElementById("namespaceValue").textContent = namespace;
			this.shadowRoot.getElementById("namespaceFactorValue").textContent = `(${(namespace / messages).toFixed(1)}x)`;

			const results = this.findClosestScenario(locales, messages, namespace);
			if (!results) return;

			const maxSize = Math.max(...results.map((r) => r.size));
			const tbody = this.shadowRoot.getElementById("results");
			tbody.innerHTML = results
				.map(
					(result) => `
        <tr>
          <td>${result.library}</td>
          <td class="bar-cell">
            <div class="bar" style="width: ${(result.size / maxSize) * 100}%"></div>
            ${result.size} KB
          </td>
        </tr>
      `
				)
				.join("");

			this.renderCharts(locales, messages, namespace);
		};

		["locales", "messages", "namespace"].forEach((id) => {
			this.shadowRoot
				.getElementById(id)
				.addEventListener("input", updateResults);
		});

		updateResults();
	}
}

customElements.define("benchmark-visualization", BenchmarkVisualization);
