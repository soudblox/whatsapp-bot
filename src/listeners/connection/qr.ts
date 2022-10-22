import { Listener } from '../../lib/structures/Listener';
import qrcode from 'qrcode';

new Listener({
	name: 'qr',
	run: (qr: string) => {
		qrcode.toString(qr, { type: 'terminal' }, function(_, url) {
			console.log(url);
		});
	},
});