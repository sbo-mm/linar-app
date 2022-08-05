<template>
	<form class="box" enctype="multipart/form-data" ref="ddform"
	:class="[dragoverClass, errorClass, successClass, loadingClass]"
	@dragover.prevent.stop="dragoverClass = 'is-dragover'"
	@dragenter.prevent.stop="dragoverClass = 'is-dragover'"
	@dragleave.prevent.stop="dragoverClass = ''"
	@dragend.prevent.stop="dragoverClass = ''"
	@drop.prevent.stop="onDrop"
	@submit.prevent="onSubmit"
	>
		<div class="box-input">

			<!-- File Upload Icon -->
			<svg class="box-icon" xmlns="http://www.w3.org/2000/svg" width="50" height="43" viewBox="0 0 50 43">
				<path d="M48.4 26.5c-.9 0-1.7.7-1.7 1.7v11.6h-43.3v-11.6c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v13.2c0 .9.7 1.7 1.7 1.7h46.7c.9 0 1.7-.7 1.7-1.7v-13.2c0-1-.7-1.7-1.7-1.7zm-24.5 6.1c.3.3.8.5 1.2.5.4 0 .9-.2 1.2-.5l10-11.6c.7-.7.7-1.7 0-2.4s-1.7-.7-2.4 0l-7.1 8.3v-25.3c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v25.3l-7.1-8.3c-.7-.7-1.7-.7-2.4 0s-.7 1.7 0 2.4l10 11.6z"></path>
			</svg>

			<input class="box-file" type="file" name="files[]" id="file" multiple 
			:accept="acceptedFiles" @change="onInputChange"
			>
			<label for="file">
				<div v-if="isFileSelect">
					<strong>Choose a file</strong>
					<span class="box-dragndrop"> or drag it here</span>
					.
				</div>
				<div v-if="!isFileSelect">
					{{filesFormCaption}} 
				</div>
			</label>
			<button class="box-button" type="submit">Submit</button>

		</div>

		<Transition name="fade-expand">
			<div class="box-uploading" v-if="isUploading">
				Uploading...
			</div>
		</Transition>

		<Transition name="fade-expand">
			<div class="box-success" v-if="isSuccess">
				Done!
				<input class="addmore-btn" type="button" name="addmore" id="addmore"
				@click="onReset">
				<label for="addmore">
					<strong>Upload more?</strong>
				</label>
			</div>
		</Transition>

		<Transition name="fade-expand">
			<div class="box-error" v-if="isError">
				Error! <span>{{formErrMsg}}</span>.
				<input class="addmore-btn" type="button" name="tryagain" id="tryagain"
				@click="onReset">
				<label for="tryagain">
					<strong>Try Again.</strong>
				</label>
			</div>
		</Transition>

	</form>
</template>

<script>

	import { buf2hex, str2hex } from '../assets/utils.js';

	export default {
		name: "FileDragDrop",
		components: {
		},
		props: {
			acceptedFiles: String,
			reset: Boolean
		},
		data() {
			return {
				dragoverClass: "",
				errorClass: "",
				successClass: "",
				loadingClass: "",
				isFileSelect: true,
				isUploading: false,
				isSuccess: false,
				isError: false,
				filesFormCaption: "",
				formErrMsg: "",
				droppedFiles: false
			}
		},
		methods: {
			showFiles(files) {
				if (files.length > 1) {
					this.filesFormCaption = `${files.length} files selected`;
				} else {
					this.filesFormCaption = files[0].name;
				}
				this.isFileSelect = false;
			},
			triggerSubmit() {
				this.$refs.ddform.dispatchEvent(new Event('submit'));
			},
			toggleIsUploading(toggle) {
				this.isUploading = toggle;
				this.loadingClass = toggle ? "is-uploading" : "";
			},
			toggleIsSucces(toggle) {
				this.isSuccess = toggle;
				this.successClass = toggle ? "is-success" : "";
			},
			toggleIsError(toggle, errorMsg = "") {
				this.isError = toggle;
				this.errorClass = toggle ? "is-error" : "";
				this.formErrMsg = toggle ? errorMsg : "";
			},
			checkFilesForFormat(files, handleWrongFiles = null) {
				let wrongFiles = []
				files.forEach(f => {
					const fext = '.' + f.name.split('.').pop();
					if (!this.acceptedFiles.includes(fext)) {
						wrongFiles.push(f);
					} 
				});

				if (wrongFiles.length > 0) {
					if (handleWrongFiles != null) {
						handleWrongFiles(wrongFiles);
					}
					return false;
				}

				return true;
			},
			onDrop(e) {
				this.dragoverClass = "";
				this.droppedFiles = Array.from(e.dataTransfer.files);

				if (!this.checkFilesForFormat(this.droppedFiles)) {
					let errorMsg = "Unsuported file format(s)"
					this.toggleIsError(true, errorMsg);
					return false;
				}

				this.showFiles(this.droppedFiles);
				this.triggerSubmit();
			},
			onInputChange(e) {
				this.droppedFiles = Array.from(e.target.files);

				if (this.droppedFiles.length === 0) {
					return false;
				}

				if (!this.checkFilesForFormat(this.droppedFiles)) {
					let errorMsg = "Unsuported file format(s)"
					this.toggleIsError(true, errorMsg);
					return false;
				}

				this.showFiles(this.droppedFiles);
				this.triggerSubmit();
			},
			onReset() {
				// toggle all states off
				this.toggleIsUploading(false);
				this.toggleIsSucces(false);
				this.toggleIsError(false);

				// reset the form
				this.$refs.ddform.dispatchEvent(new Event('reset'));

				// set file select state on
				this.filesFormCaption = "";
				this.isFileSelect = true;

				//unbind dropped files
				this.droppedFiles = false;
			},
			async fileToArrayBuffer(file) {
				const reader = new FileReader();
				return new Promise((resolve, reject) => {
					reader.onerror = () => {
						reader.abort();
						reject(reader.error);
					};

					reader.onload = () => {
						resolve(reader.result);
					};

					reader.readAsArrayBuffer(file);
				});
			},
			async uploadFiles(files) {
				const sleep = ms => new Promise(r => setTimeout(r, ms));

				this.toggleIsUploading(true);
				const t = await sleep(500);

				let errObj = {}
				for (let file of files) {
					try {
						const arrbuff = await this.fileToArrayBuffer(file);
						const bufferHexed = buf2hex(arrbuff);
						const filenameHexed = str2hex(file.name);
						const hexconc = bufferHexed + filenameHexed;
						const uqblock = CryptoJS.enc.Hex.parse(hexconc);

						// compute unique hash for this file
						const hash = CryptoJS.SHA256(uqblock).toString();

						// emit an event upwards
						this.$emit('onfileload', {
							key: hash, 
							name: file.name,
							type: file.type, 
							buf: arrbuff
						});

					} catch(err) {
						//errObj[file.name] = err;
						this.toggleIsUploading(false);
						this.toggleIsError(true, err);
						return errObj;
					}
				}

				this.toggleIsUploading(false);
				this.toggleIsSucces(true);
				return errObj;
			},
			async onSubmit(e) {

				if (this.isUploading || this.isSuccess || this.isError) {
					return false;
				}

				this.toggleIsError(false);
				const res = await this.uploadFiles(this.droppedFiles);
			}
		},
		created() {
			let vm = this;
	  	this.$watch('reset', (predicate) => {
	  		if (predicate) {

	  			if (vm.droppedFiles) {
	  				vm.onReset();
	  			}

		  		vm.$emit('onreset', vm.droppedFiles);
	  		}
	  	});
		}
	}
</script>

<style scoped>
	
	.box {
		font-size: 1.25rem;
		background-color: #c8dadf;
		position: relative;
		width: 100%;
		height: 100%;

		display: flex;
		justify-content: center;
		align-items: center;

		outline: 2px dashed #92b0b3;
		outline-offset: -10px;

		-webkit-transition:
			outline-offset .15s ease-in-out,
			background-color .15s linear;

		transition: 
			outline-offset .15s ease-in-out,
			background-color .15s linear;
	}

	.box.is-dragover:not(.is-uploading):not(.is-success):not(.is-error) {
		outline-offset: -20px;
		outline-color: #c8dadf;
		background-color: #fff;
	}

	.box-dragndrop {
		display: inline;
	}

	.box-icon {
		width: 100%;
		height: 80px;
		fill: #92b0b3;
		display: block;
		margin-bottom: 40px;
	}

	.box-input {
		opacity: 1;
		-webkit-transition: opacity .25s ease-in-out;
		transition: opacity .25s ease-in-out;			
	}

	.box.is-uploading .box-input,
	.box.is-success .box-input,
	.box.is-error .box-input {
		pointer-events: none;
		opacity: 0;
	}

	.box-uploading, 
	.box-success, 
	.box-error {
		display: block;
		position: absolute;
		max-width: 80%;
		top: 50%;
		right: 0;
		left: 10%;

		-webkit-transform: translateY(-50%);
		transform: translateY(-50%);
	}

	.box-uploading {
		font-style: italic;
	}

	.box-file,
	.addmore-btn {
		width: 0.1px;
		height: 0.1px;
		opacity: 0;
		overflow: hidden;
		position: absolute;
		z-index: -1;
	}

	.box-file + label {
		/*
		max-width: 80%;
		text-overflow: ellipsis;
		white-space: nowrap;
		*/
		cursor: pointer;
		display: inline-block;
		overflow: hidden;
	}

	.box-file + label:hover strong,
	.box-file + label:focus strong,
	.box-file.has-focus + label strong,
	.addmore-btn + label:hover strong,
	.addmore-btn + label:focus strong,
	.addmore-btn.has-focus + label strong {
		color: #39bfd3;
	}

	.box-file:focus + label,
	.box-file.has-focus + label {
		outline: 1px dotted #000;
		outline: -webkit-focus-ring-color 5px auto;
	}

	.box-button {
		display: block;
		font-weight: 700;
		color: #e5edf1;
		display: none; /* Set visible if manual submit is desired */
		pointer-events: none;
		background-color: #39bfd3;
		padding: 8px 16px;
		margin: 40px auto 0;
	}

	.box-button:hover, .box-button:focus {
		background-color: #0f3c4b;
	}

	.fade-expand-enter-active {
		animation: appear-from-inside .25s ease-in-out;
	}

	.fade-expand-leave-active {
		animation: appear-from-inside .25s ease-in-out reverse;
	}

	@keyframes appear-from-inside {
		from { transform: translateY(-50%) scale(0);   }
		75%  { transform: translateY(-50%) scale(1.1); }
		to   { transform: translateY(-50%) scale(1);   }
	}


</style>
