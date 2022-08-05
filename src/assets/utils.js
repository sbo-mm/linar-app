function bytes2hex(bytesarray) {
	return bytesarray.map(x => x.toString(16).padStart(2, '0')).join('');
}

function buf2hex(buffer) {
	return bytes2hex([...new Uint8Array(buffer)]);
}

function str2hex(inputstr) {
	const enc = new TextEncoder();
	return bytes2hex(enc.encode(inputstr));
}

function get_empty_obj_from(obj) {
	const empty = {};
	Object.keys(obj).forEach(key => {
		empty[key] = null;
	});
	return empty;
}

function append_postfix_to_filename(filestr, postfix) {
	const toks = filestr.split('.');
	return (toks[0] + postfix + '.' + toks[1]);
}

export { 
	buf2hex, 
	str2hex, 
	get_empty_obj_from, 
	append_postfix_to_filename 
};