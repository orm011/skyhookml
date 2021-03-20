import utils from './utils.js';

const Datasets = {
	data: function() {
		return {
			datasets: [],
			addDatasetForm: {},
		};
	},
	created: function() {
		this.fetchDatasets();
	},
	methods: {
		fetchDatasets: function() {
			utils.request(this, 'GET', '/datasets', null, (data) => {
				this.datasets = data;
			});
		},
		showAddDatasetModal: function() {
			this.addDatasetForm = {
				name: '',
				data_type: '',
			};
			$(this.$refs.addDatasetModal).modal('show');
		},
		addDataset: function() {
			utils.request(this, 'POST', '/datasets', this.addDatasetForm, () => {
				$(this.$refs.addDatasetModal).modal('hide');
				this.fetchDatasets();
			});
		},
		deleteDataset: function(dsID) {
			utils.request(this, 'DELETE', '/datasets/'+dsID, null, () => {
				this.fetchDatasets();
			});
		},
		selectDataset: function(dataset) {
			this.$router.push('/ws/'+this.$route.params.ws+'/datasets/'+dataset.ID);
		},
	},
	template: `
<div>
	<div class="border-bottom mb-3">
		<h2>Datasets</h2>
	</div>
	<button type="button" class="btn btn-primary mb-2" v-on:click="showAddDatasetModal">Add Dataset</button>
	<div class="modal" tabindex="-1" role="dialog" ref="addDatasetModal">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-body">
					<form v-on:submit.prevent="addDataset">
						<div class="row mb-2">
							<label class="col-sm-4 col-form-label">Name</label>
							<div class="col-sm-8">
								<input class="form-control" type="text" v-model="addDatasetForm.name" />
							</div>
						</div>
						<div class="row mb-2">
							<label class="col-sm-4 col-form-label">Data Type</label>
							<div class="col-sm-8">
								<select v-model="addDatasetForm.data_type" class="form-select">
									<option v-for="(dt, name) in $globals.dataTypes" :value="dt">{{ name }}</option>
								</select>
							</div>
						</div>
						<div class="row mb-2">
							<div class="col-sm-8">
								<button type="submit" class="btn btn-sm btn-primary">Add Dataset</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
	<table class="table table-sm align-middle">
		<thead>
			<tr>
				<th>Name</th>
				<th>Type</th>
				<th>Data Type</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="ds in datasets">
				<td>{{ ds.Name }}</td>
				<td>{{ ds.Type }}</td>
				<td>{{ ds.DataType }}</td>
				<td>
					<button v-on:click="selectDataset(ds)" class="btn btn-sm btn-primary">Manage</button>
					<button v-on:click="deleteDataset(ds.ID)" class="btn btn-sm btn-danger">Delete</button>
				</td>
			</tr>
		</tbody>
	</table>
</div>
	`,
};
export default Datasets;
