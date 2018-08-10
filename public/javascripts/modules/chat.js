import socket from '../../deps/node_modules/socket.io-client';
import {$, $$} from './bling';

export default () => {
    const io = socket();

    const textBox = $('#chat-form__textbox');
    const chatForm = $('#chat-form');
    const storeId = $('#store-id');
    if (!chatForm) return;

    function appendMsg(userMsg, text) {
        const chatBody = $('.chat__body');
        let html = '';
        if (userMsg) {
            html = `
                <div class="chat__message">
                    <div class="chat__message-in chat__message-in--right">${text}</div>
                </div>
            `
        } else {
            html = `
                <div class="chat__message">
                    <div class="chat__message-in">${text}</div>
                </div>
            `
        }
        chatBody.insertAdjacentHTML('beforeEnd', html);
    }

    chatForm.on('submit', (e) => {
        e.preventDefault();
        io.emit('chat message', textBox.value)
        // appendMsg(true, textBox.value)
        textBox.value = '';
        return false;
    })

    io.on('chat message', (msg) => {
        appendMsg(false, msg)
    })
}