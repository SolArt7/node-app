import io from 'socket.io-client';
import {$, $$} from './bling';

function scrollToBottom() {
	const body = $('.chat__body');
	body.scrollTop = body.scrollHeight;
}

function addMsgHtml(data, yours) {
	const html = `
		<div class="chat__message">
			<div class="chat__message-in ${yours ? 'chat__message-in--right' : '' } ">
				<span>${data.message}</span>
				<div class="chat__username">${data.username}</div>
			</div>
		</div>
	`;
	$('.chat__body').insertAdjacentHTML('beforeend', html);
	scrollToBottom();
}

export default () => {
	const socket = io();
	const chatForm = $('#chat-form');
	const storeId = $('#storeId');
	const username = $('#username');
	if (!chatForm) return;
	scrollToBottom();
	
	chatForm.on('submit', (e) => {
		e.preventDefault();
		let data = {};
		chatForm.querySelectorAll('input, textarea').forEach(input => input.name ? data[input.name] = input.value : false);
		
		socket.emit(`send-${storeId.value}`, data);
		
		chatForm.querySelector('#chat-form__textbox').value = '';
	});
	
	socket.on('connect', () => {
		chatForm.querySelector('[type=submit]').removeAttribute('disabled');
	});
	
	// getting messages from socket
	socket.on(`send-${storeId.value}`, (data) => {
		// if message not saved or received message is yours, do nothing.
		if (data.success === false) return;
		
		if (username.value === data.username) {
			addMsgHtml(data, true);
		} else {
			addMsgHtml(data, false);
		}
	});
	
	socket.on('disconnect', () => {
		console.log('Disconnected');
		chatForm.querySelector('[type=submit]').setAttribute('disabled', 'true');
	});
}