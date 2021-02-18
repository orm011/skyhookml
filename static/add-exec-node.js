import utils from './utils.js';

export default {
	data: function() {
		return {
			name: '',
			dataTypes: [],
			addDataTypeSelection: null,
			op: null,
			categories: [
				{
					ID: "basic",
					Name: "Basic",
					Ops: [
						{
							ID: "filter",
							Name: "Filter",
							Description: "Filter",
							DataTypes: ["int"],
						},
						{
							ID: "detection_filter",
							Name: "Detection Filter",
							Description: "Detection Filter",
							DataTypes: ["detection"],
						},
						{
							ID: "simple_tracker",
							Name: "Simple Tracker",
							Description: "Simple Tracker",
							DataTypes: ["detection"],
						},
						{
							ID: "reid_tracker",
							Name: "Reid Tracker",
							Description: "Tracker using Re-identification Model",
							DataTypes: ["detection"],
						},
					],
				},
				{
					ID: "model",
					Name: "Model",
					Ops: [
						{
							ID: "model",
							Name: "Model",
							Description: "Model",
						},
					],
				},
				{
					ID: "video",
					Name: "Video Manipulation",
					Ops: [
						{
							ID: "video_sample",
							Name: "Sample video",
							Description: "Sample images or segments from video",
							// could also be video, but we'll update it in the node editor
							DataTypes: ["image"],
							Parents: ["video"],
						},
						{
							ID: "render",
							Name: "Render video",
							Description: "Render video from various input data types",
							DataTypes: ["video"],
						},
					],
				},
				{
					ID: "code",
					Name: "Code",
					Ops: [
						{
							ID: "python",
							Name: "Python",
							Description: "Express a Python function for the system to execute",
						},
					],
				},
			],
		};
	},
	mounted: function() {
		$(this.$refs.modal).modal('show');
	},
	methods: {
		createNode: function() {
			var params = {
				Name: this.name,
				Op: this.op.ID,
				Params: '',
				Parents: null,
				DataTypes: this.dataTypes,
				Workspace: this.$route.params.ws,
			};
			utils.request(this, 'POST', '/exec-nodes', JSON.stringify(params), () => {
				$(this.$refs.modal).modal('hide');
				this.$emit('closed');
			});
		},
		selectOp: function(op) {
			this.op = op;
			if(op.DataTypes) {
				this.dataTypes = op.DataTypes;
			}
		},
		addDataType: function() {
			this.dataTypes.push(this.addDataTypeSelection);
			this.addDataTypeSelection = '';
		},
		removeDataType: function(i) {
			this.dataTypes.splice(i, 1);
		},
	},
	template: `
<div class="modal" tabindex="-1" role="dialog" ref="modal">
	<div class="modal-dialog modal-xl" role="document">
		<div class="modal-content">
			<div class="modal-body">
				<form v-on:submit.prevent="createNode">
					<div class="form-group row">
						<label class="col-sm-2 col-form-label">Name</label>
						<div class="col-sm-10">
							<input v-model="name" class="form-control" type="text" />
						</div>
					</div>
					<div class="form-group row">
						<label class="col-sm-2 col-form-label">Op</label>
						<div class="col-sm-10">
							<ul class="nav nav-tabs">
								<li v-for="category in categories" class="nav-item">
									<a
										class="nav-link"
										data-toggle="tab"
										:href="'#add-node-cat-' + category.ID"
										role="tab"
										>
										{{ category.Name }}
									</a>
								</li>
							</ul>
							<div class="tab-content">
								<div v-for="category in categories" class="tab-pane" :id="'add-node-cat-' + category.ID">
									<table class="table table-row-select">
										<thead>
											<tr>
												<th>Name</th>
												<th>Description</th>
											</tr>
										</thead>
										<tbody>
											<tr
												v-for="x in category.Ops"
												:class="{selected: op != null && op.ID == x.ID}"
												v-on:click="selectOp(x)"
												>
												<td>{{ x.Name }}</td>
												<td>{{ x.Description }}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
					<div class="form-group row">
						<label class="col-sm-2 col-form-label">Output Type</label>
						<div class="col-sm-10">
							<template v-if="op != null && op.DataTypes">
								<input type="text" readonly class="form-control-plaintext" :value="op.DataTypes">
							</template>
							<template v-else>
								<table class="table">
									<tbody>
										<tr v-for="(t, i) in dataTypes">
											<td>{{ t }}</td>
											<td>
												<button type="button" class="btn btn-danger" v-on:click="removeDataType(i)">Remove</button>
											</td>
										</tr>
										<tr>
											<td>
												<select v-model="addDataTypeSelection" class="form-control">
													<option v-for="(dt, name) in $globals.dataTypes" :value="dt">{{ name }}</option>
												</select>
											</td>
											<td>
												<button type="button" class="btn btn-primary" v-on:click="addDataType">Add</button>
											</td>
										</tr>
									</tbody>
								</table>
							</template>
						</div>
					</div>
					<div class="form-group row">
						<div class="col-sm-10">
							<button type="submit" class="btn btn-primary">Create Node</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
	`,
};
