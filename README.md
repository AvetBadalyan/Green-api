# GREEN-API MAX Chat

A React-based chat application for sending and receiving messages via MAX messenger using the GREEN-API service.

## Features

- 🔐 Secure authentication with GREEN-API credentials
- 💬 Send and receive text messages
- 📱 Clean, responsive chat interface
- 💾 Persistent chat history (localStorage)
- 🔄 Real-time message polling

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **SCSS** - Styling
- **Axios** - HTTP client
- **GREEN-API** - Messaging service

## Getting Started

### Prerequisites

- Node.js 18+ installed
- GREEN-API account with MAX instance credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AvetBadalyan/Green-api.git
cd Green-api
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

### Getting GREEN-API Credentials

1. Go to [GREEN-API Console](https://console.green-api.com/)
2. Create a new MAX instance
3. Copy your `idInstance` and `apiTokenInstance`
4. Use these credentials to log in to the app

## Usage

1. Enter your GREEN-API credentials (idInstance and apiTokenInstance)
2. Click "New Chat" to start a conversation
3. Enter the recipient's phone number (with country code, e.g., 79001234567)
4. Type your message and send
5. Receive replies in real-time

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ChatWindow/      # Main chat interface
│   ├── EmptyChat/       # Empty state placeholder
│   ├── MessageList/     # Message display list
│   ├── NewChatModal/    # New chat dialog
│   └── Sidebar/         # Chat list sidebar
├── context/             # React Context providers
│   ├── AuthContext.jsx  # Authentication state
│   └── ChatContext.jsx  # Chat/messages state
├── pages/               # Page components
│   ├── ChatPage/        # Main chat page
│   └── LoginPage/       # Login page
├── services/            # API services
│   └── api.js           # GREEN-API integration
├── styles/              # Global styles
│   ├── global.scss      # Global CSS reset & styles
│   └── variables.scss   # SCSS variables
├── App.jsx              # Root component
├── AppRouter.jsx        # Routing logic
└── main.jsx             # Entry point
```

## API Integration

This app uses the following GREEN-API endpoints:

- **SendMessage** - Send text messages
- **ReceiveNotification** - Receive incoming notifications
- **DeleteNotification** - Delete processed notifications
- **GetSettings** - Verify instance credentials

## Author

**Avet Badalyan**
- GitHub: [@AvetBadalyan](https://github.com/AvetBadalyan)
- Telegram: @avetbadalyan

## License

This project was created as a test assignment for GREEN-API.
