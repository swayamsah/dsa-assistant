"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, Search, Home, MessageSquare, Library, PlugZap, Star, Clock, Menu, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Toast } from "@/components/ui/toast"

export default function ChatApp() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Array<{ role: string; content: string; timestamp?: string }>>([])
  const [inputMessage, setInputMessage] = useState("")
  const [leetcodeUrl, setLeetcodeUrl] = useState("")
  const [previousUrl, setPreviousUrl] = useState("")
  const [urlValid, setUrlValid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const featuredPrompts = [
    "How do I approach this problem?",
    "Can you explain the time complexity?",
    "What data structure should I use?",
    "Help me understand the problem statement.",
  ]

  const popularProblems = [
    { id: 1, name: "Two Sum", url: "https://leetcode.com/problems/two-sum/" },
    { id: 2, name: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses/" },
    { id: 3, name: "Merge Two Sorted Lists", url: "https://leetcode.com/problems/merge-two-sorted-lists/" },
    { id: 4, name: "Best Time to Buy and Sell Stock", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
    { id: 5, name: "Maximum Subarray", url: "https://leetcode.com/problems/maximum-subarray/" },
    { id: 6, name: "Binary Tree Level Order Traversal", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/" },
    { id: 7, name: "Valid Palindrome", url: "https://leetcode.com/problems/valid-palindrome/" },
    { id: 8, name: "Number of Islands", url: "https://leetcode.com/problems/number-of-islands/" }
  ]

  const validateLeetcodeUrl = (url: string) => {
    // Basic validation for LeetCode URL
    // Accepts both formats:
    // - https://leetcode.com/problems/two-sum/
    // - https://leetcode.com/problems/two-sum/description/
    const leetcodeRegex = /^https:\/\/leetcode\.com\/problems\/[\w-]+(?:\/description)?\/?$/
    return leetcodeRegex.test(url)
  }

  const handleLeetcodeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setLeetcodeUrl(url)
    setUrlValid(validateLeetcodeUrl(url))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value)
  }

  const startNewChat = () => {
    setMessages([])
    setInputMessage("")
    setLeetcodeUrl("")
    setPreviousUrl("")
    setUrlValid(false)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!urlValid) {
      setMessages([
        ...messages,
        { role: "assistant", content: "Please enter a valid LeetCode problem URL before asking a question." },
      ])
      return
    }

    if (inputMessage.trim() === "") return

    const newMessages = [
      ...messages,
      { role: "user", content: inputMessage, timestamp: new Date().toLocaleTimeString() },
    ]
    setMessages(newMessages)
    setInputMessage("")
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          leetcodeUrl: leetcodeUrl,
          isNewChat: messages.length === 0,
          previousUrl: previousUrl
        }),
      })

      // Update previousUrl after successful request
      setPreviousUrl(leetcodeUrl)

      if (!response.ok) {
        throw new Error(response.statusText)
      }

      const data = response.body
      if (!data) {
        return
      }

      const reader = data.getReader()
      const decoder = new TextDecoder()
      let done = false
      let accumulatedResponse = ""

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value)
        accumulatedResponse += chunkValue
        setMessages([
          ...newMessages,
          { role: "assistant", content: accumulatedResponse, timestamp: new Date().toLocaleTimeString() },
        ])
      }
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handlePromptClick = (prompt: string) => {
    setInputMessage(prompt)
  }

  useEffect(() => {
    // Scroll to the bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  // If no messages yet, show welcome screen
  const showWelcome = messages.length === 0

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <div
        className={`flex flex-col border-r dark:border-gray-700 bg-gray-100 dark:bg-gray-800 transition-all duration-300 relative z-50 ${isSidebarCollapsed ? "w-16" : "w-64"}`}
      >
        <div className="flex items-center p-4 border-b dark:border-gray-700">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center">
              <MessageSquare size={18} className="text-white" />
            </div>
            
            {!isSidebarCollapsed && (
              <div className="ml-2 flex-1">
                <h1 className="font-bold text-lg">DSA Assistant</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Gemini</p>
              </div>
            )}
          </div>
          
          {/* New Chat Button */}
          {!isSidebarCollapsed && (
            <Button 
              variant="outline" 
              onClick={startNewChat}
              className="ml-auto"
            >
              New Chat
            </Button>
          )}
          
          {/* Toggle Button - now positioned correctly */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className={`${isSidebarCollapsed ? "ml-auto" : "ml-2"}`}
          >
            <Menu size={18} />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {!isSidebarCollapsed && (
            <>
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">POPULAR PROBLEMS</h2>
              <ul className="space-y-1">
                {popularProblems.map((problem) => (
                  <li key={problem.id}>
                    <button
                      onClick={() => {
                        setLeetcodeUrl(problem.url)
                        setUrlValid(true)
                      }}
                      className="w-full text-left p-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {problem.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {isSidebarCollapsed && (
            <>
              <div className="flex justify-center mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#</span>
              </div>
              <ul className="space-y-1">
                {popularProblems.map((problem) => (
                  <li key={problem.id}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              setLeetcodeUrl(problem.url)
                              setUrlValid(true)
                            }}
                            className="w-full flex justify-center p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            {problem.id}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {problem.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {showWelcome ? (
            <div className="h-full flex flex-col items-center justify-center mt-16">
              <h1 className="text-3xl font-bold mb-2">Welcome to DSA Assistant</h1>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
                Get help with data structures and algorithms problems from LeetCode
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 p-6 rounded-xl border border-blue-200 dark:border-blue-900">
                  <div className="bg-blue-500 p-2 rounded-lg w-10 h-10 flex items-center justify-center mb-4">
                    <Library className="text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Problem Library</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Access common DSA patterns and problem-solving approaches
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 p-6 rounded-xl border border-purple-200 dark:border-purple-900">
                  <div className="bg-purple-500 p-2 rounded-lg w-10 h-10 flex items-center justify-center mb-4">
                    <MessageSquare className="text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Interactive Learning</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Get hints and guidance without spoiling solutions
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/20 p-6 rounded-xl border border-amber-200 dark:border-amber-900">
                  <div className="bg-amber-500 p-2 rounded-lg w-10 h-10 flex items-center justify-center mb-4">
                    <Clock className="text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Time Complexity</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Learn to analyze and optimize your solutions
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-900">
                  <div className="bg-emerald-500 p-2 rounded-lg w-10 h-10 flex items-center justify-center mb-4">
                    <PlugZap className="text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Code Explanation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Understand solution approaches with step-by-step explanations
                  </p>
                </div>
              </div>

              <div className="mt-10 w-full max-w-2xl">
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                  To get started, enter a LeetCode problem URL and ask a question
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="whitespace-pre-wrap break-words">
                        {message.content.split('\n').map((line, i) => {
                          // Handle headers
                          if (line.startsWith('## ')) {
                            return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.replace('## ', '')}</h2>
                          }
                          if (line.startsWith('# ')) {
                            return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.replace('# ', '')}</h1>
                          }
                          
                          // Handle code blocks
                          if (line.startsWith('``') || line.startsWith('`')) {
                            const codeContent = line.replace(/^``\w*|^`|`$/g, '').trim()
                            return (
                              <div key={i} className="relative group">
                                <pre className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 my-2 overflow-x-auto">
                                  <code className="text-sm font-mono">{codeContent}</code>
                                </pre>
                                <button
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(codeContent)
                                    toast({
                                      description: "Code copied to clipboard",
                                      duration: 2000,
                                      className: "bg-green-50 dark:bg-gray-800 border-green-200 dark:border-gray-700"
                                    })
                                  }}
                                  className="absolute top-2 right-2 p-2 bg-gray-200 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Copy code"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            )
                          }

                          // Handle text formatting
                          const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
                          const formattedLine = parts.map((part, index) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>
                            }
                            if (part.startsWith('*') && part.endsWith('*')) {
                              return <em key={index} className="italic">{part.slice(1, -1)}</em>
                            }
                            if (part.startsWith('`') && part.endsWith('`')) {
                              return <code key={index} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono">{part.slice(1, -1)}</code>
                            }
                            // Handle bullet points
                            if (part.trim().startsWith('*   ')) {
                              return <li key={index} className="ml-4">{part.replace('*   ', '')}</li>
                            }
                            return part
                          })

                          // Wrap non-code content in appropriate element
                          return line.trim().startsWith('*   ') ? (
                            <ul key={i} className="mb-2 list-disc">{formattedLine}</ul>
                          ) : (
                            <p key={i} className="mb-2 leading-relaxed">
                              {formattedLine}
                            </p>
                          )
                        })}
                      </div>
                      {message.timestamp && (
                        <div
                          className={`text-xs mt-1 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}
                        >
                          {message.timestamp}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted text-muted-foreground">
                    <div className="flex space-x-2 items-center">
                      <div
                        className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        {messages.length === 0 && (
          <div className="p-4 flex flex-wrap justify-center gap-2 border-t dark:border-gray-700">
            {featuredPrompts.map((prompt, index) => (
              <button
                key={index}
                className="py-2 px-4 bg-gray-200 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handlePromptClick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="border-t dark:border-gray-700 p-4">
          <div className="mb-4">
            <label htmlFor="leetcode-url" className="block text-sm font-medium mb-1">
              LeetCode Problem URL <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <Input
                id="leetcode-url"
                type="url"
                placeholder="https://leetcode.com/problems/two-sum/"
                value={leetcodeUrl}
                onChange={handleLeetcodeUrlChange}
                className={urlValid ? "border-green-500" : leetcodeUrl ? "border-red-500" : ""}
              />
              {leetcodeUrl && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full ${urlValid ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                      >
                        {urlValid ? "✓" : "!"}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {urlValid
                        ? "Valid LeetCode URL"
                        : "Please enter a valid LeetCode URL (e.g., https://leetcode.com/problems/two-sum/)"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              type="text"
              placeholder="Ask about the LeetCode problem..."
              value={inputMessage}
              onChange={handleInputChange}
              className="flex-1"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !urlValid || inputMessage.trim() === ""}
              className="rounded-full p-2"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
