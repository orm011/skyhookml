import utils from './utils.js';

export default {
	data: function() {
		return {
			comp: null,
			code: '',
			numInputs: '',
			numTargets: '',
			outputs: {},
			layers: [],
			losses: [],
			addForm: null,
		};
	},
	created: function() {
		this.resetForm();

		const compID = this.$route.params.compid;
		utils.request(this, 'GET', '/pytorch/components/'+compID, null, (comp) => {
			this.comp = comp;
			var params = this.comp.Params;
			this.code = params.Code;
			this.numInputs = params.NumInputs;
			this.numTargets = params.NumTargets;
			if(params.Outputs) {
				this.outputs = params.Outputs;
			}
			if(params.Layers) {
				this.layers = params.Layers;
			}
			if(params.Losses) {
				this.losses = params.Losses;
			}
		});
	},
	methods: {
		resetForm: function() {
			this.addForm = {
				outputLayer: '',
				outputType: '',
				layer: '',
				loss: '',
			};
		},
		save: function() {
			let params = {
				Code: this.code,
				NumInputs: parseInt(this.numInputs),
				NumTargets: parseInt(this.numTargets),
				Outputs: this.outputs,
				Layers: this.layers,
				Losses: this.losses,
			};
			utils.request(this, 'POST', '/pytorch/components/'+this.comp.ID, JSON.stringify({
				Params: params,
			}));
		},
		addOutput: function() {
			this.$set(this.outputs, this.addForm.outputLayer, this.addForm.outputType);
			this.resetForm();
		},
		removeOutput: function(layer) {
			this.$delete(this.outputs, layer);
		},
		addLayer: function() {
			this.layers.push(this.addForm.layer);
			this.resetForm();
		},
		removeLayer: function(i) {
			this.layers.splice(i, 1);
		},
		addLoss: function() {
			this.losses.push(this.addForm.loss);
			this.resetForm();
		},
		removeLoss: function(i) {
			this.losses.splice(i, 1);
		},
	},
	template: `
<div class="small-container m-2">
	<template v-if="comp != null">
		<div class="form-group row">
			<label class="col-sm-2 col-form-label">Code</label>
			<div class="col-sm-10">
				<textarea v-model="code" class="form-control" rows="10"></textarea>
			</div>
		</div>
		<div class="form-group row">
			<label class="col-sm-2 col-form-label"># Inputs</label>
			<div class="col-sm-10">
				<input v-model="numInputs" type="text" class="form-control">
			</div>
		</div>
		<div class="form-group row">
			<label class="col-sm-2 col-form-label"># Targets</label>
			<div class="col-sm-10">
				<input v-model="numTargets" type="text" class="form-control">
			</div>
		</div>
		<div class="form-group row">
			<label class="col-sm-2 col-form-label">Outputs</label>
			<div class="col-sm-10">
				<table class="table">
					<tbody>
						<tr v-for="(t, layer) in outputs">
							<td>{{ layer }}</td>
							<td>{{ t }}</td>
							<td>
								<button type="button" class="btn btn-danger" v-on:click="removeOutput(layer)">Remove</button>
							</td>
						</tr>
						<tr>
							<td>
								<input v-model="addForm.outputLayer" type="text" class="form-control">
							</td>
							<td>
								<input v-model="addForm.outputType" type="text" class="form-control">
							</td>
							<td>
								<button type="button" class="btn btn-primary" v-on:click="addOutput">Add</button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		<div class="form-group row">
			<label class="col-sm-2 col-form-label">Layers</label>
			<div class="col-sm-10">
				<table class="table">
					<tbody>
						<tr v-for="(s, i) in layers">
							<td>{{ s }}</td>
							<td>
								<button type="button" class="btn btn-danger" v-on:click="removeLayer(i)">Remove</button>
							</td>
						</tr>
						<tr>
							<td>
								<input v-model="addForm.layer" type="text" class="form-control">
							</td>
							<td>
								<button type="button" class="btn btn-primary" v-on:click="addLayer">Add</button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		<div class="form-group row">
			<label class="col-sm-2 col-form-label">Losses</label>
			<div class="col-sm-10">
				<table class="table">
					<tbody>
						<tr v-for="(s, i) in losses">
							<td>{{ s }}</td>
							<td>
								<button type="button" class="btn btn-danger" v-on:click="removeLoss(i)">Remove</button>
							</td>
						</tr>
						<tr>
							<td>
								<input v-model="addForm.loss" type="text" class="form-control">
							</td>
							<td>
								<button type="button" class="btn btn-primary" v-on:click="addLoss">Add</button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		<button v-on:click="save" type="button" class="btn btn-primary">Save</button>
	</template>
</div>
	`,
};