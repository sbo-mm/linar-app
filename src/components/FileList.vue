<template>
	
	<div class="box">
		
		<div class="header">
			<span class="h0">{{title}}</span>
			<span class="h1">({{files.length}})</span>
		</div>


		<div class="box-list">
			<TransitionGroup name="list">
				<div v-for="file in files" class="item" :key="file.key">
					<input type="checkbox" class="file-check" name="listSelect" :id="file.key + uuid" :value="file" v-model="checkedFiles" @change="updateSelectAll">
					<label :for="file.key + uuid">{{file.name}}</label>
				</div>
			</TransitionGroup>
		</div>

		<div class="box-opts">
			<span class="opts-item" id="check-all">
				<input type="checkbox" class="check-all" name="checkAll" :id="checkId" v-model="selectAll" @click="select">
				<label :for="checkId">Check All</label>
			</span>

			<span class="opts-item" id="rm">
				<input type="button" name="rm" :id="removeId" @click="remove">
				<label :for="removeId">Remove</label>
			</span>
		</div>

	</div>

</template>

<script>

let uuid = 0;

export default {
	name: 'FileList',
	components: {
	},
	props: {
		title: String,
		files: Array,
		propagate: Boolean,
		reset: Boolean
	},
	data() {
		return {
			checkedFiles: [],
			selectAll: false,
			checkId: "check-all",
			removeId: "rm-selected"
		}
	},
	methods: {
		select() {
			this.checkedFiles = [];
			if (!this.selectAll) {
				for (let i in this.files) {
					this.checkedFiles.push(this.files[i]);
				}
			}
		},
		updateSelectAll() {
			this.selectAll = (this.files.length === this.checkedFiles.length);
		},
		remove() {
			this.$emit('onremove', this.checkedFiles);
			this.checkedFiles = [];
			this.selectAll = false;
		}
	},
	beforeCreate(){
		this.uuid = uuid.toString();
		uuid += 1;
	},
	created() {
		let vm = this;
		this.$watch('propagate', (predicate) => {
			if (predicate) {
				vm.$emit('on-propagate-selected', vm.checkedFiles);
				vm.checkedFiles = [];
				vm.selectAll = false;
			}
		});

		this.$watch('reset', (predicate) => {
			if (predicate) {
				vm.$emit('onreset', vm.files);
				vm.checkedFiles = [];
				vm.selectAll = false;
			}
		});

	},
	mounted() {
		this.checkId = this.checkId + this.uuid;
		this.removeId = this.removeId + this.uuid;
	}
}
</script>

<style scoped>

*, *:before, *:after { 
	-webkit-box-sizing: border-box; 
	box-sizing: border-box; 
}

.box {
	width: 100%;
	height: 100%;
	background: rgba(255, 255, 255, .4);
	border-radius: 5px;

	display: grid;
	grid-template-columns: 100%;
	grid-template-rows: 10% 75% 15%;

	overflow: hidden;
}

.header {
	/*padding-top: 15px;*/
	padding-left: 9px;
	padding-right: 9px;
	/*padding-bottom: 15px;*/
	width: 100%;
	height: 30px;

	font-size: 0.85em;
	background-color: rgba(255, 255, 255, .4);
	backdrop-filter: blur(10px);

	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	z-index: 1;
}

.h1 {
	font-weight: 700;
}

.box-list, .box-btns {
	width: 100%;
	height: 100%
}

.box-list {
	/*background: lightgreen;*/
	padding: 10px 3px 10px 3px;
	overflow-y: scroll;
}

.item {
	position: relative;
	width: 100%;
	
	display: flex;
	flex-direction: row;
}

input[type="checkbox"].file-check {
	width: 0.1px;
	height: 0.1px;
	opacity: 0;
	overflow: hidden;
	position: absolute;
	z-index: -1;
}

input[type="checkbox"].file-check + label {
	position: relative;
	padding: 2px 0px 2px 23px;

	text-align: left;
	font-size: 0.55em;
	font-weight: 500;

	/*overflow: hidden;*/
	overflow-wrap: anywhere;

	border-top: 1px dashed #fff;
	cursor: pointer;
}

input[type="checkbox"].file-check + label:before {
	content: '\f10c'; /* circle outline */
	position: absolute;
	display: block;
	top: 4px;
	left: 2px;

	font: 1.7em 'FontAwesome';
}

input[type="checkbox"].file-check + label:hover {
	background-color: rgba(255, 255, 255, .2);
}

input[type="checkbox"].file-check:checked + label:before {
	content: '\f058'; /* circle checkmark */
}

.box-opts {
	display: grid;
	grid-template-columns: 50% 50%;

	padding-right: 9px;
	padding-left: 5px;
	background-color: rgba(255, 255, 255, .4);
	border-top: 2px solid rgba(255, 255, 255, .7);
}

.opts-item {
	height: 100%;
	width: max-content;
	
	display: flex;
	flex-direction: row;
	align-items: center;
}

.opts-item#check-all {
	justify-self: start;
}

.opts-item#rm {
	justify-self: end;
}

input[type="button"] {
	width: 0.1px;
	height: 0.1px;
	opacity: 0;
	overflow: hidden;
	position: absolute;
	z-index: -1;
}

input[type="checkbox"].check-all + label,
input[type="button"] + label {
	font-size: 0.5em;
}

input[type="checkbox"].check-all,
input[type="checkbox"].check-all + label {
	cursor: pointer;
}

input[type="button"] + label {
	font-weight: 700;
	cursor: pointer;
}

input[type="button"] + label:hover,
input[type="checkbox"].check-all + label:hover {
	color: #39bfd3;
}

input[type="button"]:active + label {
	color: #e1f5f8;
}


.list-move,
.list-enter-active,
.list-leave-active {
	transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
	opacity: 0;
	transform: translateX(30px);
}

.list-leave-active {
	position: absolute;
}

</style>
