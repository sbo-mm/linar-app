<template>
	
	
	<div class="app-scope"> <div class="main-container">
		<div class="nav-grid">
			<div class="header">
				<strong>LINAR</strong> <span>v {{version}}</span>
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
					@on-propagate-selected="onPropagateSelectedInbound"
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
					@on-propagate-selected="onPropagateSelectedOutbound"
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
					<!--
					<input type="button" id="proc-btn" value="Process Inbound" :disabled="true"
					@click="shouldPropagateInbound = true"
					>
					<input type="button" id="save-btn" value="Save Outbound"
					@click="shouldPropagateOutbound = true"
					> 
					<input type="button" id="undo-btn" value="Reset All" 
					@click="resetAll"
					>
					-->
					<button class="button" role="button" id="proc-btn"
					:class="{'disabled' : currentFilesToProcess.length === 0}" 
					@click="shouldPropagateInbound = true">
						Process Inbound
					</button>
					<button class="button" role="button" id="save-btn"
					:class="{'disabled' : recentProcessedFiles.length === 0}"  
					@click="shouldPropagateOutbound = true">
						Save Outbound
					</button>
					<button class="button" role="button" id="undo-btn" 
					@click="resetAll">
						Reset All
					</button>
				</div>
			</div>  		
		</div>
	</div> </div>

</template>

<script>

import { verifyPermission } from "./assets/utils.js"
import { exportResultObj } from "./assets/xlprocessor.js"

import FileList from "./components/FileList"
import FileDragDrop from "./components/FileDragDrop"

var JSZip = require("jszip"); 

export default {
	name: 'App',
	components: {
		FileList,
		FileDragDrop
	},
	data() {
		return {
			version: "",
			mainWidth: '',
			mainHeight: '',

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
		process(files, onProcessFn) {
			try {
				exportResultObj(files, onProcessFn, this.dropSpecialCharacters);
			} catch (err) {
				// 
				// TODO: display error to user
				// TODO: potential cleanup
				//
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
			return true;
		},
		onPropagateSelectedInbound(files) {

			if (files.length === 0) {
				this.shouldPropagateInbound = false;
				return;
			}

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
			});

			// reset forward propagation
			this.shouldPropagateInbound = false;
		},
		async saveSingleFile(file) {
			const filp = await window.showSaveFilePicker({
				suggestedName: file.name,
				types: [{
					description: "Spreadsheet file",
					accept: {[file.type]: [this.acceptedFiles]}
				}]
			});

			if (!(await verifyPermission(filp, true))) {
					return false;
			}

			const fs = await filp.createWritable();
			await fs.write(file.buf);
			await fs.close();
			return true;
		},
		async saveMultipleFiles(files) {

			// Create an instance of a zip object
			let zip = new JSZip();

			// loop through our file objects,
			// and store them in our zip object.
			files.forEach(file => {
				zip.file(file.name, file.buf);
			});

			// Generate output .zip file
			const saveZip = await zip.generateAsync({ type: "blob" });

			// Save the zipped object
			const filp = await window.showSaveFilePicker({
				suggestedName: "LINAR_zipped_obj.zip",
				types: [{
					description: "Document Archive",
					accept: {"application/zip": [".zip"]}
				}]
			});

			if (!(await verifyPermission(filp, true))) {
					return false;
			}

			const fs = await filp.createWritable();
			await fs.write(saveZip);
			await fs.close();			
			return true;
		},
		async onPropagateSelectedOutbound(files) {

			if (files.length === 0) {
				this.shouldPropagateOutbound = false;
				return;
			}

			// Check if we are in a secure context
			// TODO: Impl and throw appropriate error if not

			if (files.length === 1) {
				if (!(await this.saveSingleFile(files[0]))) {
					// We have a permission error.
					// TODO: handle error
				}
			} else {
				if (!(await this.saveMultipleFiles(files))) {
					// We have a permission error.
					// TODO: handle error
				}
			}

			this.onOutboundRemoved(files);
			this.shouldPropagateOutbound = false;
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
		// Extract the app version
		this.version = process.env.PACKAGE_VERSION;

		// Extract dimension sizes
		const wDims = process.env.WINDOW_DIMS;
		this.mainWidth = `${wDims.width}px`;
		this.mainHeight = `${wDims.height}px`;
	}  
}
</script>

<style scoped>

/*
*		### COLORS ###
*
*		ONYX/TARMAC:     #191919
*		SLATE:           #474747
*		BRIGHT_REDDISH:  #FE5F55
*   DARK_REDDIS:     #A64942
*   BONE_WHITE:      #F9F6EE    
*/

* {
	-webkit-box-sizing: border-box; 
	box-sizing: border-box;
}

.app-scope {
	width: v-bind(mainWidth);
	height: v-bind(mainHeight);

	padding: 30px;
	background-color: #191919;
}

.main-container {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	text-align: center;

	width: 100%;
	height: 100%;
	/*height: 500px;*/
}

.nav-grid {
	position: relative;
	width: inherit;
	height: inherit;

	display: grid;
	grid-template-columns: 25% 75%;
	grid-template-rows: 10% 80% 10%;

	grid-row-gap: 7px;
	grid-column-gap: 7px;

	grid-template-areas:
			"header header"
			"sidebar article"
			"footer footer" 
}

.header, .sidebar, .article, .footer {
	width: 100%;
	height: 100%;

	border-radius: 5px;
	overflow: hidden;

	background-color: #FE5F55; /*#474747;*/
	/*box-shadow: 1px 1px 3px black;*/
}

.header {
	grid-area: header;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: flex-end;

	padding-right: 10px;
	padding-left: 25px;

	font-family: 'Courier New', monospace;
}

.header strong {
	font-size: 3em;
	letter-spacing: 25px;
}

.header span {
	letter-spacing: -3px;
	padding-bottom: 3px;
}

.sidebar {
	grid-area: sidebar;

	padding: 5px;

	display: grid;
	grid-template-columns: 100%;
	grid-template-rows: 50% 50%;
}

.article {
	grid-area: article;
}

.footer {
	grid-area: footer;
}

.file-list-container {
	padding: 5px;
}

.main-btns {
	display: grid;
	grid-template-columns: 25% 25% 25% 25%;
	justify-items: center;
	align-items: center;

	width: 100%;
	height: 100%;
	
	/*
	padding-right: 10px;
	padding-left: 10px;
	*/
}

.main-btns #undo-btn {
	grid-column: 4;
}

.main-btns .button {
	display: flex;
	flex-direction: column;
	align-items: center;
 
	width: 80%;
	padding: 6px 14px;
	
	font-weight: 400;

	border-radius: 6px;
	border: none;

	color: #DFDEDF;
	background: #191919;
	
	user-select: none;
	-webkit-user-select: none;
	
	touch-action: manipulation;
}

.main-btns .button:hover {
	background: #303030;
}

.main-btns .button:active {
	background: #474747;
}

.main-btns .button.disabled {
	pointer-events: none;
	color: rgba(255, 255, 255, 0.4);
	background: rgba(25, 25, 25, 0.4);
}


</style>

<style>

body {
	margin: 0;
}

</style>



