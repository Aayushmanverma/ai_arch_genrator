import os
from typing import TypedDict, Literal
from langchain_groq import ChatGroq
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

# --- AUTO LOAD API KEYS FROM .ENV ---
load_dotenv()
class AgentState(TypedDict):
    user_input: str
    is_valid_tech: str
    rejection_reason: str
    research_data: str
    architecture_blueprint: str

def run_architecture_flow(u_input: str):
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.1)
    search_tool = TavilySearchResults(max_results=2)

    # Node 1: Guard Node
    def guard_node(state: AgentState):
        prompt = f"""
        Analyze if this input is a legitimate request to build a software, system, application, or website.
        If it's gibberish, just a person's name, or a personal social event, mark it as INVALID.
        User Input: "{state['user_input']}"
        
        Strictly format your response as:
        VALID: Yes or No
        REASON: [Why if No, otherwise leave blank]
        """
        response = llm.invoke(prompt)
        res_text = response.content
        if "VALID: Yes" in res_text:
            return {"is_valid_tech": "YES"}
        
        reason = res_text.split("REASON:")[-1].strip() if "REASON:" in res_text else "Invalid software requirement."
        return {"is_valid_tech": "NO", "rejection_reason": reason}

    # Node 2: Researcher Node
    def researcher_node(state: AgentState):
        query = f"Scalable backend architecture tech stack production ready for {state['user_input']}"
        results = search_tool.invoke({"query": query})
        search_text = "\n".join([r['content'] for r in results])
        return {"research_data": search_text}

    # Node 3: Architect Node
    # Node 3: Architect Node (Updated with Mermaid Instructions)
    # Node 3: Architect Node (Strict Syntax Guidelines)
    def architect_node(state: AgentState):
        prompt = f"""
        You are a Principal Software Architect. Design a production-ready system architecture report.
        System Requirement: {state['user_input']}
        Internet Context: {state['research_data']}
        
        Provide a detailed breakdown using clean Markdown:
        - 🚀 **Core Tech Stack** (Framework, Language)
        - 💾 **Database Layer** (SQL vs NoSQL choices)
        - ⚡ **Caching & Message Queues**
        - 📈 **Scalability & Security**

        EXTREMELY IMPORTANT FOR THE FLOWCHART:
        At the very end of your response, add a section called "### 📊 System Flowchart".
        Inside this section, provide a Mermaid.js diagram code block starting with ```mermaid.
        The diagram MUST follow strict syntax:
        1. Use 'graph TD' format.
        2. DO NOT use spaces, dashes, or special characters inside node IDs (e.g., use 'LoadBalancer' instead of 'Load-Balancer' or 'Load Balancer').
        3. If you want spaces in labels, use brackets correctly, like this: LoadBalancer[Load Balancer Nginx]
        4. DO NOT use any special characters like '&', '@', or parenthesis inside the brackets or node names. Keep text purely alphanumeric.
        5. Flow structure should be clean: Client --> LoadBalancer --> APIGateway --> Services --> Databases
        """
        response = llm.invoke(prompt)
        return {"architecture_blueprint": response.content}
    
    # Router logic
    def route_after_guard(state: AgentState) -> Literal["go_research", "stop_project"]:
        if state["is_valid_tech"] == "YES":
            return "go_research"
        else:
            return "stop_project"

    # Graph Setup
    workflow = StateGraph(AgentState)
    workflow.add_node("guard_agent", guard_node)
    workflow.add_node("researcher_agent", researcher_node)
    workflow.add_node("architect_agent", architect_node)

    workflow.set_entry_point("guard_agent")
    workflow.add_conditional_edges(
        "guard_agent",
        route_after_guard,
        {"go_research": "researcher_agent", "stop_project": END}
    )
    workflow.add_edge("researcher_agent", "architect_agent")
    workflow.add_edge("architect_agent", END)

    app = workflow.compile()
    return app.invoke({"user_input": u_input})