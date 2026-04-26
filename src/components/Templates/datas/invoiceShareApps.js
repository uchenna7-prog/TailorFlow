const APPS = [
    {
      id: 'whatsapp', label: isGenerating ? 'Preparing…' : 'WhatsApp', onClick: handleWhatsApp,
      icon: <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="16" fill="#25D366"/><path d="M23.5 8.5A10.44 10.44 0 0016.01 5.5C10.76 5.5 6.5 9.76 6.5 15.01c0 1.68.44 3.32 1.28 4.77L6.4 25.6l5.97-1.57a10.43 10.43 0 004.63 1.08h.01c5.25 0 9.51-4.26 9.51-9.51A9.44 9.44 0 0023.5 8.5zm-7.49 14.64h-.01a8.66 8.66 0 01-4.42-1.21l-.32-.19-3.3.87.88-3.22-.2-.33a8.67 8.67 0 01-1.33-4.65c0-4.79 3.9-8.69 8.7-8.69a8.64 8.64 0 016.15 2.55 8.64 8.64 0 012.54 6.15c0 4.8-3.9 8.72-8.69 8.72zm4.77-6.51c-.26-.13-1.54-.76-1.78-.85-.24-.09-.41-.13-.58.13-.17.26-.66.85-.81 1.02-.15.17-.3.19-.56.06-.26-.13-1.1-.4-2.09-1.29-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.8-1.91-.21-.5-.42-.43-.58-.44l-.49-.01c-.17 0-.45.06-.68.32-.23.26-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.73 4.34 3.83.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.5-.61 1.71-1.21.21-.6.21-1.11.15-1.21-.06-.1-.23-.16-.49-.29z" fill="#fff"/></svg>,
    },
    {
      id: 'telegram', label: 'Telegram', onClick: handleTelegram,
      icon: <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="16" fill="#229ED9"/><path d="M22.8 9.6L6.4 15.9c-1.1.4-1.1 1.1-.2 1.4l4 1.2 1.5 4.7c.2.5.4.7.8.7.3 0 .5-.1.7-.3l2.4-2.3 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.2-.4-1.7-1.3-1.3zm-9.5 9l-.3 3.2-1.3-4.1 9.8-6.2-8.2 7.1z" fill="#fff"/></svg>,
    },
    {
      id: 'sms', label: 'SMS', onClick: handleSMS,
      icon: <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="16" fill="#34C759"/><path d="M22 9H10a2 2 0 00-2 2v8a2 2 0 002 2h2l2 3 2-3h6a2 2 0 002-2v-8a2 2 0 00-2-2z" fill="#fff"/><circle cx="12" cy="15" r="1.3" fill="#34C759"/><circle cx="16" cy="15" r="1.3" fill="#34C759"/><circle cx="20" cy="15" r="1.3" fill="#34C759"/></svg>,
    },
    {
      id: 'email', label: 'Email', onClick: handleEmail,
      icon: <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="16" fill="#EA4335"/><path d="M24 11H8a1 1 0 00-1 1v9a1 1 0 001 1h16a1 1 0 001-1v-9a1 1 0 00-1-1zm-1.5 2L16 17.5 9.5 13h13zm.5 8H9v-7.3l7 4.8 7-4.8V21z" fill="#fff"/></svg>,
    },
    {
      id: 'copy', label: status === 'done' ? 'Copied!' : 'Copy Text', onClick: handleCopy,
      icon: <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="16" fill="#6366f1"/><path d="M20 8h-8a2 2 0 00-2 2v11h2V10h8V8zm3 4h-7a2 2 0 00-2 2v10a2 2 0 002 2h7a2 2 0 002-2V14a2 2 0 00-2-2zm0 12h-7V14h7v10z" fill="#fff"/></svg>,
    },
    {
      id: 'native', label: 'More', onClick: handleNativeShare,
      icon: <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="16" fill="#8e8e93"/><circle cx="10" cy="16" r="2.2" fill="#fff"/><circle cx="16" cy="16" r="2.2" fill="#fff"/><circle cx="22" cy="16" r="2.2" fill="#fff"/></svg>,
    },
  ]
