import utils from './utils.js';
import JobConsole from './job-console.js';

export default {
	components: {
		'job-console': JobConsole,
	},
	data: function() {
		return {
			jobID: null,
			modelState: null,
			lines: [],
			chart: null,
		};
	},
	created: function() {
		this.jobID = this.$route.params.jobid;
	},
	mounted: function() {
		this.fetch();
		this.interval = setInterval(this.fetch, 1000);
	},
	unmounted: function() {
		clearInterval(this.interval);
	},
	methods: {
		fetch: function() {
			utils.request(this, 'GET', '/jobs/'+this.jobID, null, (job) => {
				let s = null;
				try {
					s = JSON.parse(job.State);
				} catch(e) {}
				if(s) {
					let metadata = null;
					try {
						metadata = JSON.parse(s.Metadata);
					} catch(e) {}
					this.updateChart(metadata);
					this.lines = s.Lines;
				}
			});
		},
		updateChart: function(modelState) {
			if(!modelState || !modelState.TrainLoss || modelState.TrainLoss.length == 0) {
				return;
			}
			let n = modelState.TrainLoss.length;
			let prevN = 0;
			if(this.modelState) {
				prevN = this.modelState.TrainLoss.length;
			}
			if(prevN == n) {
				return;
			}
			if(!this.chart) {
				let labels = [];
				for(let i = 0; i < n; i++) {
					labels.push('Epoch ' + i);
				}
				let config = {
					type: 'line',
					data: {
						labels: labels,
						datasets: [{
							label: 'Train Loss',
							data: modelState.TrainLoss,
							fill: false,
							backgroundColor: 'blue',
							borderColor: 'blue',
						}, {
							label: 'Validation Loss',
							data: modelState.ValLoss,
							fill: false,
							backgroundColor: 'red',
							borderColor: 'red',
						}]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
					},
				};
				let ctx = this.$refs.layer.getContext('2d');
				this.chart = new Chart(ctx, config);
			} else {
				// update chart with only the new history
				for(let i = prevN; i < n; i++) {
					this.chart.data.labels.push('Epoch ' + i);
					this.chart.data.datasets[0].data.push(modelState.TrainLoss[i]);
					this.chart.data.datasets[1].data.push(modelState.ValLoss[i]);
				}
				this.chart.update();
			}
			this.modelState = modelState;
		},
	},
	template: `
<div class="flex-container">
	<div class="chartjs-container el-50h">
		<canvas ref="layer"></canvas>
	</div>
	<div class="el-50h">
		<job-console :jobID="jobID" :lines="lines"></job-console>
	</div>
</div>
	`,
};
