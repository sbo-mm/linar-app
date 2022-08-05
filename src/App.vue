<template>
  
  <div class="main-container">
  	<div class="nav-grid">
			<div class="header">
			  HEADER
			</div>
			<div class="sidebar">
				<div class="file-list-container">
				  <FileList
				  :title="'INBOUND'"
				  :files="currentFilesToProcess"
				  :propagate="shouldPropagateInbound"
				  :reset="shouldResetInbound"
				  @onremove="onInboundRemoved"
				  @onreset="onInboundReset"
				  @on-propagate-selected="onPropagateSelected"
				  />
			  </div>
			  <div class="file-list-container">
				  <FileList
				  :title="'OUTBOUND'"
				  :files="recentProcessedFiles"
				  :propagate="shouldPropagateOutbound"
				  :reset="shouldResetOutbound"
				  @onremove="onOutboundRemoved"
				  @onreset="onOutboundReset"
				  />
			  </div>
			</div>
			<div class="article">
			  <FileDragDrop
			  :acceptedFiles="acceptedFiles"
			  :reset="shouldResetDragDrop"
			  @onreset="onDragDropReset"
			  @onfileload="onFileLoaded" 
			  />
			</div>
			<div class="footer">
			  <div class="main-btns">
			  	<input type="button" id="proc-btn" value="Process Inbound" 
			  	@click="shouldPropagateInbound = true">
			  	<input type="button" id="save-btn" value="Save Outbound"> 
			  	<!-- @click="saveBlob"> -->
			  	<input type="button" id="undo-btn" value="Reset All" 
			  	@click="resetAll">
			  </div>
			</div>  		
  	</div>
  </div>

</template>

<script>

import { exportResultObj } from "./assets/xlprocessor.js"

import FileList from "./components/FileList"
import FileDragDrop from "./components/FileDragDrop"

export default {
  name: 'App',
  components: {
  	FileList,
  	FileDragDrop
  },
  data() {
  	return {
  		acceptedFiles: ".xlsx",
  		retrievedFileMap: {},
  		currentFilesToProcess: [],
  		recentProcessedFiles: [],
  		shouldPropagateInbound: false,
  		shouldPropagateOutbound: false,
  		shouldResetDragDrop: false,
  		shouldResetInbound: false,
  		shouldResetOutbound: false,
  		dropSpecialCharacters: false
  	}
  },
  methods: {
  	async process(files, onProcessFn) {
  		try {
	  		exportResultObj(files, onProcessFn, this.dropSpecialCharacters);
  		} catch (err) {
  			// handle error
  			console.log(err);
  			return false;
  		}

  		return true;
  	},
  	onFileLoaded(fobj) {
  		if (fobj.key in this.retrievedFileMap) {
  			//
  			// TODO: Handle if file already exists
  			//
  			return false;
  		}

  		this.retrievedFileMap[fobj.key] = fobj;
  		this.currentFilesToProcess.push(this.retrievedFileMap[fobj.key]);
  	},
  	async onPropagateSelected(files) {

  		// Process files
  		let vm = this;
  		const procfiles = this.process(files, proc => {

  			// filter out the file we just processed
  			const res = vm.currentFilesToProcess.filter(item => {
  				return !(item.key === proc.key);
  			});
  			vm.currentFilesToProcess = res;	

	  		// send files to 'outbound' display list
  			vm.recentProcessedFiles.push(proc);

  			return true;
  		});

  		// reset forward propagation
  		this.shouldPropagateInbound = false;
  	},
  	removeFromDict(files) {
  		let vm = this;
  		files.forEach(file => {
  			if (vm.retrievedFileMap.hasOwnProperty(file.key)) {
  				delete vm.retrievedFileMap[file.key];
  			}
  		});
  	},
  	onInboundRemoved(files) {
  		// remove file from inbound list
  		const res = this.currentFilesToProcess.filter(item => {
  			return !files.includes(item);
  		});
  		this.currentFilesToProcess = res;

  		// remove file from dictionary
  		this.removeFromDict(files);
  	},
  	onOutboundRemoved(files) {
  		// remove file from outbound list
  		const res = this.recentProcessedFiles.filter(item => {
  			return !files.includes(item);
  		});
  		this.recentProcessedFiles = res;

  		// remove file from dictionary
  		this.removeFromDict(files);
  	},
  	onInboundReset(files) {
  		this.onInboundRemoved(files);
  		this.shouldResetInbound = false;
  	},
  	onOutboundReset(files) {
  		this.onOutboundRemoved(files);
  		this.shouldResetOutbound = false;
  	},
  	onDragDropReset(pred) {
  		this.shouldResetDragDrop = false;
  	},
  	resetAll() {
  		this.shouldResetDragDrop = true;

  		if (this.currentFilesToProcess.length > 0) {
  			this.shouldResetInbound = true;
  		}

  		if (this.recentProcessedFiles.length > 0) {
  			this.shouldResetOutbound = true;
  		}

  	}
  },
	mounted() {
	}  
}
</script>

<style scoped>

* {
  -webkit-box-sizing: border-box; 
  box-sizing: border-box;
}

.main-container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-align: center;

  width: 100%;
  height: 500px;
}

.nav-grid {
	position: relative;
	width: inherit;
	height: inherit;

	display: grid;
	grid-template-columns: 25% 75%;
	grid-template-rows: 10% 80% 10%;

	grid-template-areas:
			"header header"
			"sidebar article"
			"footer footer" 
}

.header, .sidebar, .content, .footer {
	width: 100%;
	height: 100%;
}

.header {
	grid-area: header;
	background-color: red;
}

.sidebar {
	grid-area: sidebar;
	background-color: orange;

	display: grid;
	grid-template-columns: 100%;
	grid-template-rows: 50% 50%;
}

.article {
	grid-area: article;
	background-color: cyan;
}

.footer {
	grid-area: footer;
	background-color: purple;
}

.file-list-container {
	padding: 5px;
}

.main-btns {
	display: grid;
	grid-template-columns: 25% 25% 25% 25%;
	align-items: center;

	width: 100%;
	height: 100%;
	padding-right: 10px;
	padding-left: 10px;
}

.main-btns #undo-btn {
	grid-column: 4;
}

</style>
