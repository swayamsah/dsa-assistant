# DSA Assistant

An interactive AI assistant powered by Gemini to help with LeetCode problems and data structures & algorithms concepts.
![image](image.png)
![image-1](image-1.png)

## Features

- 🤖 AI-powered assistance with LeetCode problems
- 💡 Interactive guidance without direct solutions
- 📚 Access to popular LeetCode problems
- 🎯 Focused problem-solving approach
- 🔄 Context-aware conversations
- 🌗 Dark/Light mode support
- 📱 Responsive design with collapsible sidebar

## Key Features

- **Problem Context Retention**: Maintains conversation context between messages while efficiently managing problem descriptions
- **Smart Problem Fetching**: Only fetches problem descriptions for new chats or when switching problems
- **Popular Problems**: Quick access to frequently solved LeetCode problems
- **Intuitive Interface**: Clean UI with expandable/collapsible sidebar
- **Guided Learning**: Get hints and conceptual understanding without direct solutions

## Tech Stack

- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- Gemini API
- Shadcn UI Components

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dsa-assistant.git
cd dsa-assistant
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python dependencies (required for LeetCode problem fetching):
```bash
pip install selenium webdriver_manager
```

4. Create a `.env` file in the root directory and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Python Script Requirements

The project uses a Python script to fetch LeetCode problem descriptions. Requirements:

- Python 3.6 or higher
- Selenium WebDriver
- Chrome WebDriver (automatically managed)

The script will automatically:
- Launch a headless Chrome browser
- Fetch problem descriptions from LeetCode
- Handle authentication and page loading
- Return formatted problem details

If you encounter any issues with the Python script:
1. Ensure Python 3.x is installed: `python --version`
2. Verify Selenium is installed: `pip show selenium`
3. Check Chrome is installed on your system
4. The WebDriver is automatically managed, but you can update it: `pip install --upgrade webdriver_manager`

## Usage

1. Select a LeetCode problem from the sidebar or enter a problem URL
2. Ask questions about the problem
3. Get guided assistance without direct solutions
4. Use the collapsible sidebar for a focused experience
5. Start new conversations with the "New Chat" button

## Project Structure

```
dsa-assistant/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # API endpoint for chat
│   ├── layout.tsx
│   └── page.tsx              # Main chat interface
├── components/
│   └── ui/                   # Reusable UI components
├── scripts/
│   └── fetch_leetcode.py     # Python script for fetching problem details
└── styles/
    └── globals.css           # Global styles
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
