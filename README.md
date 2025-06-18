# Not-T3-Chat-App

A chat application built for the [T3 ChatCloneathon](https://cloneathon.t3.chat/) competition. This app implements a modern chat interface with support for multiple language models and real-time conversation capabilities.

## Features

- 🔐 Authentication with Clerk
- 💬 Chat with multiple LLM models
- 🔄 Real-time message streaming
- 📱 Responsive design
- 🌓 Light/Dark mode support
- ↔️ Compare multiple models side by side
- 🧩 Modern UI components with shadcn/ui

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)

## Project Structure

```
├── app/                   # Next.js app directory
│   ├── api/              # API routes
│   ├── chat/             # Chat pages
│   └── settings/         # Settings page
├── components/           # React components
│   ├── ui/              # UI components from shadcn/ui
│   └── ...              # Custom components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configurations
└── public/             # Static assets
```

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd not-t3-chat-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features in Detail

### Authentication

- Secure user authentication powered by Clerk
- Protected chat routes and API endpoints
- Persistent user sessions

### Chat Interface

- Real-time message streaming
- Support for multiple chat models
- Side-by-side model comparison
- Chat history synchronization
- Clear and intuitive UI

### Model Configuration

- Easy model switching
- Compare responses from different models
- Model-specific settings
- Conversation management

## Roadmap

Here are some features and improvements we're planning to add:

### Short-term

- 📎 File attachments support (PDF, images)
- 🎨 AI image generation capabilities
- 📝 Code syntax highlighting
- 🔄 Resumable message streams
- 🔑 Bring Your Own API Key (BYOK) support

### Medium-term

- 🌲 Conversation branching
- 📤 Export chat history
- 🔗 Shareable conversation links
- 🔍 Full-text chat search
- 📱 Progressive Web App (PWA) support

### Long-term

- 🌐 Web search integration
- 🤝 Collaborative chat sessions
- 📊 Advanced chat analytics
- 🔐 End-to-end encryption
- 📱 Native mobile apps

## Contributing

Feel free to contribute to this project by submitting issues or pull requests.

## License

This project is open-source and available under the MIT License.

## Acknowledgements

- Built for the T3 ChatCloneathon competition
- UI components from shadcn/ui
- Icons from Lucide
