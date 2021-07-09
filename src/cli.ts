#!/usr/bin/env node

import { create } from '.';

const name = process.argv.filter((a) => !a.includes('/'));

if (!name.length) {
	console.log('Usage: instant-nodesite <name>');
	name.push('instant-nodesite');
}

for (const n of name) {
	create(n);
}
