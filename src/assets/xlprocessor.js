import * as XLSX from 'xlsx';
import { get_empty_obj_from, append_postfix_to_filename } from './utils.js';

const CHARACTERIDX = 1;
const SCRIPTIDX    = 3;

const HEADERS = [
	"TC_IN",
	"CHARACTER",
	"SCRIPT_EN",
	"SCRIPT_DA",
	"NOTES",
	"TC_OUT"
];

const CHARSINLINE   = 50;
const OUTCOLHEADER0 = "Character";
const OUTCOLHEADER1 = "Lines";
const OUTCOLHEADER2 = "Show"; 
const RESULTPOSTFIX = "_LINECOUNT";

const s2ab = s => {
	var buf = new ArrayBuffer(s.length);
	var view = new Uint8Array(buf);

	for (var i = 0; i < s.length; i++) {
		view[i] = s.charCodeAt(i) & 0xFF;
	}

	return buf;
};

function prepare(filebuf, drop_special) {
	// Load top level Excel Workbook
	const wb_main = XLSX.read(filebuf);

	// Retrieve sheet(s)
	const character_sheets_json = []
	for (let sheetidx in wb_main.SheetNames) {
		const name = wb_main.SheetNames[sheetidx];
		const sheet = wb_main.Sheets[name];
		const sheet_json = prepareWorksheet(sheet, drop_special);
		character_sheets_json.push({name: name, sheet_data: sheet_json});
	}

	return character_sheets_json;
}

function preloadSheetData(sheet) {
	if (!sheet.hasOwnProperty('!ref')) {
		return null;
	}

	const _range = sheet['!ref'];
	const _colcount = XLSX.utils.decode_range(_range).e.c + 1;

	if (_colcount !== HEADERS.length) {
		return null;
	}

	XLSX.utils.sheet_add_aoa(sheet, [HEADERS], {origin: "A1"});
	return XLSX.utils.sheet_to_json(sheet);
}

function prepareWorksheet(sheet, drop_special) {

	const sheet_json = preloadSheetData(sheet);
	if (sheet_json === null) {
		return null;
	}

	const character_map = {};
	for (let rowidx in sheet_json) {
		const row = sheet_json[rowidx];
		
		if (!(row.hasOwnProperty(HEADERS[CHARACTERIDX]) 
			&& row.hasOwnProperty(HEADERS[SCRIPTIDX]))) {
			continue;
		}

		const character_name = row[HEADERS[CHARACTERIDX]].trim();		
		if (!character_map.hasOwnProperty(character_name)) {
			character_map[character_name] = 0;
		}

		const script = row[HEADERS[SCRIPTIDX]];

		if (drop_special) {
			// TODO: RE to remove special chars
		}

		character_map[character_name] += script.length;
	}

	return character_map;
}

function json_data_to_workbook(sheet_data, filename) {
	const workbook = XLSX.utils.book_new();
	
	sheet_data.forEach(data => {

		if (data === null) {
			return;
		}

		const sheet_json = [];
		const data_obj = data.sheet_data;
		
		Object.keys(data_obj).forEach(key => {
			const sheet_obj = {};
			const lines = Math.ceil(data_obj[key] / CHARSINLINE);
			sheet_obj[OUTCOLHEADER0] = key;
			sheet_obj[OUTCOLHEADER1] = lines;
			sheet_obj[OUTCOLHEADER2] = filename.split('.')[0];
			sheet_json.push(sheet_obj);
		});

		const worksheet = XLSX.utils.json_to_sheet(sheet_json);
		XLSX.utils.book_append_sheet(workbook, worksheet, data.name);
	});

	return workbook;
}

function prepareWorkbook(filedata, drop_special) {
	const sheet_data = prepare(filedata.buf, drop_special);
	if (sheet_data === null) {
		return null;
	}

	const workbook = json_data_to_workbook(sheet_data, filedata.name);
	return s2ab(XLSX.write(workbook, {bookType: 'xlsx', type: 'binary'}));
} 

function executeFile(file, drop_special, onExportedFn) {
	return new Promise((resolve) => {
		requestAnimationFrame(() => {
			resolve(treatFile(file, drop_special, onExportedFn));
		});
	});
}

function treatFile(file, drop_special, onExportedFn) {
	let buf = prepareWorkbook(file, drop_special);
	const blob = new Blob([buf], {type: file.type});
	
	if (onExportedFn !== null) {

		const exportObj = get_empty_obj_from(file);

		exportObj.key = file.key;
		exportObj.name = append_postfix_to_filename(file.name, RESULTPOSTFIX);
		exportObj.type = file.type;
		exportObj.buf = blob;

		return onExportedFn(exportObj);
	}

	return true;
}

function exportResultObj(files, onExportedFn = null, drop_special = false) {
	let promise = Promise.resolve(true);
	files.forEach(file => { 
		promise = promise.then(() => executeFile(file, drop_special, onExportedFn));
	});

	promise.then(() => console.log("all slices done"));
}

/*
function exportResultObj(files, onExportedFn = null, drop_special = false) {
	files.forEach(file => {
		let buf = prepareWorkbook(file, drop_special);
		const blob = new Blob([buf], {type: file.type});
		if (onExportedFn !== null) {

			const exportObj = get_empty_obj_from(file);

			exportObj.key = file.key;
			exportObj.name = append_postfix_to_filename(file.name, RESULTPOSTFIX);
			exportObj.type = file.type;
			exportObj.buf = buf;

			return onExportedFn(exportObj);
		}
	});

	return true;
}
*/

export { exportResultObj }






