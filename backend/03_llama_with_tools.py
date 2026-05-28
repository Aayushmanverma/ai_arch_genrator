import os
from langchain_groq import ChatGroq
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from dotenv import load_dotenv

# --- AUTO LOAD API KEYS FROM .ENV ---
load_dotenv()
# 1. API Keys Configuration

# 2. Initialize Llama and Tavily Search Tool
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.1)

# Tavily ko batate hain ki use backend architecture ke domain me search karna hai
search_tool = TavilySearchResults(
    max_results=2,
    description="Useful for searching the latest cloud services, backend tech stacks, and system architecture best practices."
)

# LLM ko Tool ke saath 'bind' yaani jorhte hain
# Isse Llama ko pata chal jata hai ki uske paas internet use karne ki 'shakti' hai
llm_with_tools = llm.bind_tools([search_tool])

print("====================================================")
print("🔍 STEP 3: INTERACTIVE AGENT WITH INTERNET ACCESS")
print("====================================================\n")

user_project = input("👉 Enter your Project Idea: ")
user_scale = input("👉 Expected Traffic/Scale: ")

# 3. Create Professional System Prompt
prompt_template = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an Advanced Tech Architect. If you need the latest data about cloud services, "
        "pricing, or microservices practices for 2026, use the search tool. "
        "Combine your internal knowledge with internet results to provide a cutting-edge backend blueprint."
    ),
    (
        "human",
        "Design architecture for: {project_idea} at a scale of {scale}."
    )
])

# Prompts ko format karke messages ki list banate hain
messages = prompt_template.format_messages(project_idea=user_project, scale=user_scale)

try:
    print("\n🧠 Agent is thinking whether it needs to search the internet...")
    # First invocation: LLM check karega ki use tool chahiye ya nahi
    first_response = llm_with_tools.invoke(messages)
    
    # Check karte hain ki kya Llama ne tool use karne ka decide kiya hai
    if first_response.tool_calls:
        print("🌐 Agent decided to search the internet! Fetching live data...")
        messages.append(first_response) # AI ka tool call store kiya
        
        for tool_call in first_response.tool_calls:
            # Live Internet Search execute ho raha hai
            tool_output = search_tool.invoke(tool_call["args"])
            
            # Tool ke output ko message stream me add karte hain taaki Llama use padh sake
            messages.append(ToolMessage(content=str(tool_output), tool_call_id=tool_call["id"]))
            
        print("📝 Internet data received. Llama is compiling the final report...")
        # Second invocation: Llama ab internet ke data ko mila kar final answer likhega
        final_response = llm_with_tools.invoke(messages)
        
        print("\n================ FINAL ARCHITECTURE WITH LIVE DATA ================")
        print(final_response.content)
        print("===================================================================")
    else:
        print("⚡ Llama had enough internal knowledge, didn't need to search.")
        print("\n================ ARCHITECTURE BLUEPRINT ================")
        print(first_response.content)
        print("========================================================")

except Exception as e:
    print(f"\n❌ Kuch dikkat aayi bhai: {e}")