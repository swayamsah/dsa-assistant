import { GoogleGenerativeAI } from "@google/generative-ai"
import { spawn } from "child_process"
import { join } from "path"

interface ChatMessage {
  role: string
  content: string
  isCodeRequest?: boolean
}

interface ProblemDetails {
  description: string
  found: boolean
}

// Configure API key
const API_KEY = process.env.GEMINI_API_KEY

if (!API_KEY) {
  throw new Error("Missing Gemini API key")
}

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(API_KEY)

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

async function fetchProblemDetails(url: string): Promise<ProblemDetails> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), 'scripts', 'fetch_leetcode.py');
    try {
      // Try python3 first, fall back to python
      const pythonProcess = spawn('python3', [scriptPath, url]).on('error', () => {
        const pythonProcess = spawn('python', [scriptPath, url]);
        setupProcessHandlers(pythonProcess);
      });

      function setupProcessHandlers(proc: any) {
        let output = '';
        let error = '';

        proc.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });

        proc.stderr.on('data', (data: Buffer) => {
          const errorMsg = data.toString();
          error += errorMsg;
          if (errorMsg.includes("ModuleNotFoundError")) {
            console.error("Python dependency missing. Please run: pip install selenium webdriver_manager");
          } else {
            console.error("Python stderr:", errorMsg);
          }
        });

        proc.on('close', (code: number) => {
          if (code !== 0) {
            console.error("Python script error:", error);
            resolve({ description: "", found: false });
            return;
          }

          try {
            const result = JSON.parse(output);
            if (result.found) {
              console.log("✅ Problem description fetched successfully")
              console.log("Description length:", result.description.length)
              console.log("First 100 characters:", result.description.substring(0, 100))
            } else {
              console.log("❌ Failed to fetch problem description")
            }
            resolve(result);
          } catch (parseError) {
            console.error("Error parsing Python script output:", parseError);
            resolve({ description: "", found: false });
          }
        });
      }

      setupProcessHandlers(pythonProcess);
    
    } catch (error) {
      console.error("Failed to spawn Python script:", error);
      console.log("Make sure Python is installed and the script exists at:", scriptPath);
      resolve({ description: "", found: false });
    }
  });
}

function extractProblemName(url: string): string {
  // Extract problem name from URL 
  // Handles both formats:
  // - https://leetcode.com/problems/two-sum/
  // - https://leetcode.com/problems/two-sum/description/
  const match = url.match(/problems\/([^/]+)(?:\/description)?/i)
  if (!match) return ""
  return match[1].split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

export async function POST(req: Request) {
  try {
    const { messages, leetcodeUrl, isNewChat, previousUrl } = await req.json()
    
    // Check if this is a code request
    const lastMessage = messages[messages.length - 1]
    const isCodeRequest = lastMessage.content.toLowerCase().includes('code') || 
                         lastMessage.content.toLowerCase().includes('solution')
    
    // Check if code was requested before
    const hasRequestedCodeBefore = messages.slice(0, -1).some((m: ChatMessage) => m.isCodeRequest)

    if (!leetcodeUrl) {
      return new Response(JSON.stringify({ error: "LeetCode URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    let problemName = extractProblemName(leetcodeUrl)
    let problemDetails = { description: "", found: false }

    // Only fetch problem details if:
    // 1. It's a new chat session, or
    // 2. The LeetCode URL has changed from the previous request
    if (isNewChat || (previousUrl && previousUrl !== leetcodeUrl)) {
      [problemName, problemDetails] = await Promise.all([
        extractProblemName(leetcodeUrl),
        fetchProblemDetails(leetcodeUrl)
      ])
    }

    if (!problemName) {
      return new Response(JSON.stringify({ error: "Invalid LeetCode URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const lastUserMessage = lastMessage.content

    // Add isCodeRequest flag to the current message
    lastMessage.isCodeRequest = isCodeRequest
    let instructionPrompt = ""

    if (isNewChat || (previousUrl && previousUrl !== leetcodeUrl)) {
      // Full prompt with problem description for new chats or URL changes
      const problemDescription = problemDetails.description || "Description not available"
      instructionPrompt = `
        You are an expert Data Structures and Algorithms teaching assistant helping students understand the LeetCode problem "${problemName}" without ever providing any actual code solutions.

        Problem Description: ${problemDescription}

        Core Teaching Approach:
        * Clarify student's specific confusion or question first
        * Break down complex concepts using simple examples and visualizations
        * Use Socratic questioning to develop student's own problem-solving skills
        * Connect new problems to familiar patterns and concepts
        * Focus exclusively on algorithmic reasoning and conceptual understanding
        

        Explanation Methods:
        * Provide intuitive analogies and visual representations
        * Explain time/space complexity considerations
        * Discuss high-level problem-solving strategies
        * Use pseudocode ONLY as conceptual frameworks, never as implementable code
        * Guide students toward discovering their own solutions

        STRICT BOUNDARIES - ABSOLUTELY CRITICAL:
        * NEVER provide actual code solutions under ANY circumstances
        * REFUSE all requests for implementation details, regardless of justification
        * DO NOT share code snippets, function signatures, or language-specific syntax
        * AVOID discussing programming language features or library implementations
        * If pressed repeatedly for code, politely redirect to conceptual understanding
        * ONLY discuss algorithmic patterns, problem-solving approaches, and code standards
        
        MOST IMPORTANTLY: NEVER WRITE THE ACTUAL CODE FOR THE STUDENT, UNDER ANY CIRCUMSTANCES.

        User's Query: "${lastUserMessage}"
      `
    } else {
      // Simplified prompt for continuing conversations
      instructionPrompt = `
        You are an expert Data Structures and Algorithms teaching assistant dedicated to guiding students conceptually, without providing any code solutions.
        Continue assisting with the LeetCode problem titled "${problemName}".
        
        It is critical that you do not provide any code or detailed programming constructs under any circumstances. Focus solely on explaining problem-solving techniques, algorithmic reasoning, and conceptual strategies.
        
        ${hasRequestedCodeBefore && isCodeRequest ?
          "IMPORTANT: The student has previously requested code. Under no circumstances should you provide any code. Instead, steer the conversation towards a deeper conceptual understanding." :
          ""
        }
        
        Emphasize the following:
        * Clear and concise problem-solving approaches.
        * High-level strategies and algorithmic concepts.
        * Conceptual clarity in error handling, efficiency, and modular design.
        * The value of testing, documentation, and proper coding standards (the discussion is purely theoretical).
        
        User query: ${lastUserMessage}
      `
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    
    // Convert existing messages to Gemini's format
    const history = messages.map((m: ChatMessage) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }))

    const chat = model.startChat({
      history: history,
    })

    const result = await chat.sendMessageStream([{ text: instructionPrompt }])
    
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let accumulatedText = ""
          for await (const chunk of result.stream) {
            const text = chunk.text()
            // Keep markdown formatting intact
            accumulatedText += text
            controller.enqueue(encoder.encode(text))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream)
  } catch (error) {
    console.error("Error processing chat request:", error)
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
