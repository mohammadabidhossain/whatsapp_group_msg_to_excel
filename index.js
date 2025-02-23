const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const csv = require('csv-writer').createObjectCsvWriter;

// CSV setup
const csvWriter = csv({
  path: 'messages.csv',
  header: [
    { id: 'timestamp', title: 'Timestamp' },
    { id: 'sender', title: 'Sender' },
    { id: 'message', title: 'Message' },
    { id: 'group', title: 'Group Name' },
    { id: 'johnsGroup', title: "John's Group" }, // New column for John's group name
    { id: 'johnsMessage', title: "John's Message" } // New column for John's message
  ],
  append: true
});

// WhatsApp client setup
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

// QR code for login
client.on('qr', qr => qrcode.generate(qr, { small: true }));

// Log when authenticated
client.on('authenticated', () => console.log('Logged in!'));

// Listen for messages
client.on('message', async msg => {
  if (msg.from.endsWith('@g.us')) { // Only process group messages
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    
    // Get sender name (fallback to phone number if pushname is unavailable)
    const senderName = contact.pushname || msg.author.split('@')[0];
    // Get group name
    const groupName = chat.name || 'Unnamed Group';

    // Initialize default values for new columns
    let johnsGroup = '';
    let johnsMessage = '';

    // Check if sender is "John" (case-insensitive) and group is "network" (case-insensitive)
    if (senderName.toLowerCase() === 'john' && groupName.toLowerCase() === 'network') {
      johnsGroup = groupName;
      johnsMessage = msg.body;
    }

    try {
      await csvWriter.writeRecords([{
        timestamp: new Date(msg.timestamp * 1000).toLocaleString(), // Readable format
        sender: senderName,
        message: msg.body,
        group: groupName,
        johnsGroup: johnsGroup, // New column for John's group
        johnsMessage: johnsMessage // New column for John's message
      }]);
      console.log('Message saved to CSV!');
    } catch (err) {
      console.error('CSV Write Error:', err);
    }
  }
});

// Start the client
client.initialize();