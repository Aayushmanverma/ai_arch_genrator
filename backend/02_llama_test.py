import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# --- AUTO LOAD API KEYS FROM .ENV ---
load_dotenv()

# 1. API Key Setup


# 2. Advanced Llama Config
llm = ChatGroq(
    model="llama-3.3-70b-versatile", 
    temperature=0.1  # Low temperature taaki technical choices ekdum precise hon
)

print("====================================================")
print("🏗️  WELCOME TO ADVANCED BACKEND ARCHITECTURE GENERATOR")
print("====================================================\n")

# 3. User se Real-Time Dynamic Inputs lena
user_project = input("👉 Enter your Project Idea (e.g., Video Streaming App, Chat App): ")
user_scale = input("👉 Expected Scale/Traffic (e.g., 5k concurrent, 1 Million DAU): ")

print("\n🤖 Processing your inputs and structuring the prompt...")

# 4. Professional Prompt Structure (Using System & Human Roles)
# Ye tareeqa professional frameworks me use hota hai taaki AI bhatke nahi
prompt_template = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a Principal Software Architect. Your job is to analyze the user's project and scale requirements, "
        "then recommend the absolute best Database and Caching strategy. Be highly technical, precise, and direct."
    ),
    (
        "human",
        "I am building: {project_idea}\n"
        "Expected Traffic/Scale: {scale}\n\n"
        "Please provide:\n"
        "1. Recommended Database Stack (with concrete reasons based on the scale)\n"
        "2. Caching Strategy (Where and why to use it)"
    )
])

# 5. Inputs को Template में Merge करना
final_prompt = prompt_template.format_messages(
    project_idea=user_project,
    scale=user_scale
)

try:
    print("🧠 Consulting Llama 3.3 (The Brain)... Please wait...")
    response = llm.invoke(final_prompt)
    
    print("\n================ ARCHITECTURE BLUEPRINT ================")
    print(response.content)
    print("========================================================")

except Exception as e:
    print(f"\n❌ Error aaya bhai: {e}")