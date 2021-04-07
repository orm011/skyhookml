import utils from './utils.js';
import ExecNodeParents from './exec-node-parents.js';

export default {
	components: {
		'exec-node-parents': ExecNodeParents,
	},
	data: function() {
		return {
			// for comparing
			compareForm: {
				workspace: null,
				nodeID: null,
			},
			wsNodes: null,

			// map from output name to the dataset (if it's created)
			outputDatasets: {},
		};
	},
	props: ['node', 'nodes', 'datasets', 'workspaces'],
	created: function() {
		// load the output datasets for this node
		utils.request(this, 'GET', '/exec-nodes/'+this.node.ID+'/datasets', null, (datasets) => {
			this.outputDatasets = datasets;
		});
	},
	methods: {
		editNode: function() {
			this.$router.push('/ws/'+this.$route.params.ws+'/exec/'+this.node.ID);
		},
		runNode: function() {
			utils.request(this, 'POST', '/exec-nodes/'+this.node.ID+'/run', null, (job) => {
				this.$router.push('/ws/'+this.$route.params.ws+'/jobs/'+job.ID);
			});
		},
		viewInteractive: function() {
			this.$router.push('/ws/'+this.$route.params.ws+'/interactive/'+this.node.ID);
		},
		deleteNode: function() {
			utils.request(this, 'DELETE', '/exec-nodes/'+this.node.ID, null, () => {
				this.$emit('update');
			});
		},

		updateParents: function() {
			let params = JSON.stringify({
				Parents: this.node.Parents,
			});
			utils.request(this, 'POST', '/exec-nodes/' + this.node.ID, params, () => {
				this.$emit('update');
			});
		},
		addParent: function(inputName, parent) {
			this.node.Parents[inputName].push(parent);
			this.updateParents();
		},
		removeParent: function(inputName, idx) {
			this.node.Parents[inputName] = this.node.Parents[inputName].filter((parent, i) => i != idx);
			this.updateParents();
		},
		setParent: function(inputName, parent) {
			if(parent) {
				this.node.Parents[inputName] = [parent];
			} else {
				this.node.Parents[inputName] = [];
			}
			this.updateParents();
		},

		selectCompareWorkspace: function() {
			this.compareForm.nodeID = null;
			this.wsNodes = null;
			utils.request(this, 'GET', '/exec-nodes?ws='+this.compareForm.workspace, null, (data) => {
				this.wsNodes = data;
			});
		},
		compareTo: function() {
			this.$router.push('/ws/'+this.$route.params.ws+'/compare/'+this.selectedNode.ID+'/'+this.compareForm.workspace+'/'+this.compareForm.nodeID);
		},
	},
	template: `
<div>
	<hr />
	<div>
		<strong>{{ node.Name }} ({{ node.Op }})</strong>
		<button type="button" class="btn btn-sm btn-primary mx-2" v-on:click="editNode">Edit</button>
		<button type="button" class="btn btn-sm btn-primary mx-2" v-on:click="runNode">Run</button>
		<button type="button" class="btn btn-sm btn-primary mx-2" v-on:click="viewInteractive">Interactive</button>
		<button type="button" class="btn btn-sm btn-danger mx-2" v-on:click="deleteNode">Delete</button>
	</div>
	<div class="flex-x-container">
		<div class="mx-4">
			<h5 class="my-2">Inputs</h5>
			<div v-for="input in node.Inputs" class="my-2">
				<exec-node-parents
					:node="node"
					:input="input"
					:nodes="nodes"
					:datasets="datasets"
					v-on:add="addParent(input.Name, $event)"
					v-on:remove="removeParent(input.Name, $event)"
					v-on:set="setParent(input.Name, $event)"
					>
				</exec-node-parents>
			</div>
		</div>
		<div class="mx-4">
			<h5 class="my-2">Outputs</h5>
			<div>
				<table class="table table-sm">
					<thead>
						<tr>
							<th>Name</th>
							<th>Data Type</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="output in node.Outputs">
							<td>{{ output.Name }}</td>
							<td>{{ $globals.dataTypes[output.DataType] }}</td>
							<td>
								<template v-if="outputDatasets[output.Name]">
									<router-link class="btn btn-sm btn-primary" :to="'/ws/'+$route.params.ws+'/datasets/'+outputDatasets[output.Name].ID">View</router-link>
								</template>
								<template v-else>
									Not Computed
								</template>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<div>
		<form v-on:submit.prevent="compareTo" class="d-flex align-items-center">
			<label class="mx-2">Compare to:</label>
			<select v-model="compareForm.workspace" @change="selectCompareWorkspace" class="form-select mx-2">
				<option v-for="ws in workspaces" :key="ws" :value="ws">{{ ws }}</option>
			</select>
			<select v-model="compareForm.nodeID" class="form-select mx-2">
				<option v-for="node in wsNodes" :key="node.ID" :value="node.ID">{{ node.Name }}</option>
			</select>
			<button type="submit" class="btn btn-primary mx-2">Go</button>
		</form>
	</div>
</div>
	`,
};
