/**
 * @typedef {Object} BenchmarkResult
 * @property {string} library - The name of the library
 * @property {number} size - The total transfer size in KB
 */

/**
 * @typedef {Object} Scenario
 * @property {number} locales - Number of locales
 * @property {number} messages - Number of messages
 * @property {number} namespaceSize - Size of namespace
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
		this.chart = null;
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
				s.messages === messages &&
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

	/**
	 * @param {number} messages
	 * @param {number} namespaceSize
	 */
	prepareChartData(messages, namespaceSize) {
		const libraries = this.data.scenarios[0].results.map((r) => r.library);
		const datasets = libraries.map((library, index) => {
			const colors = [
				"rgb(75, 192, 192)",
				"rgb(54, 162, 235)",
				"rgb(255, 99, 132)",
				"rgb(255, 206, 86)",
			];

			const data = this.data.scenarios.map((scenario) => {
				const result = scenario.results.find((r) => r.library === library);
				return {
					x: scenario.locales,
					y: result ? result.size : 0,
				};
			});

			return {
				label: library,
				data: data,
				borderColor: colors[index],
				borderWidth: 2,
				tension: 0.4,
				fill: false,
			};
		});

		return {
			datasets,
		};
	}

	renderChart(messages, namespaceSize) {
		if (!window.Chart) return;

		const canvas = this.shadowRoot.querySelector("canvas");
		if (!canvas) return;

		if (this.chart) {
			this.chart.destroy();
		}

		const chartData = this.prepareChartData(messages, namespaceSize);

		this.chart = new window.Chart(canvas, {
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
						suggestedMax: 770, // 700KB + 10% margin
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
      .chart-container {
        height: 400px;
        margin-bottom: 20px;
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
          <label for="messages">Number of Messages</label>
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
          </div>
        </div>
      </div>
      <div class="chart-container">
        <canvas></canvas>
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

			this.renderChart(messages, namespace);
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
