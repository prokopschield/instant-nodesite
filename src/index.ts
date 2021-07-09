import fs from 'fs';
import mime from 'mime-types';
import { create as nsc, rawwrite, ready } from 'nodesite.eu';
import nspub from 'nspub';
import path from 'path';

const mimeobj = {
	text: {
		'content-type': 'text/plain',
	},
	html: {
		'content-type': 'text/html',
	},
};

const loaded = new Promise((resolve) =>
	ready.then((socket) => socket.on('challenge_success', resolve))
);

export async function create(
	name: string,
	filepath: string = process.cwd(),
	wp: string = '/'
) {
	name.includes('.') || (name = `${name}.nodesite.eu`);
	const stat = await fs.promises.stat(filepath);
	if (stat.isDirectory()) {
		const entries = await fs.promises.readdir(filepath);
		await Promise.all(
			entries.map(async (entry) => {
				const file = path.resolve(filepath, entry);
				const wf = path.posix.resolve(wp, entry);
				return create(name, file, wf);
			})
		);
		const hash = await nspub.dir(filepath);
		const stn = `/static/${hash}.html`;
		nsc(
			name,
			wp,
			() => ({ statusCode: 302, head: { Location: stn } }),
			filepath
		);
		await loaded;
		rawwrite('static', name, wp, hash, mimeobj.html);
		rawwrite('static', name, stn, hash, mimeobj.html);
	} else if (stat.isFile()) {
		const hash = await nspub.file(filepath);
		const stn = `/static/${hash}/${path.basename(filepath)}`;
		const mtype = mime.lookup(filepath);
		const mobj = mtype
			? {
					'content-type': mtype,
			  }
			: mimeobj.text;
		nsc(
			name,
			wp,
			() => ({ statusCode: 302, head: { Location: stn } }),
			filepath
		);
		await loaded;
		rawwrite('static', name, wp, hash, mobj);
		rawwrite('static', name, stn, hash, mobj);
	}
}

export default create;
module.exports = create;

Object.assign(create, {
	default: create,
	create,
});
