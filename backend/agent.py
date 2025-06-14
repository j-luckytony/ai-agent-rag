import os
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate


class RAGAgent:
    def __init__(self):
        """Initialize RAG Agent with source decision capability"""
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")

        # Initialize LLM for source reasoning
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            openai_api_key=self.openai_api_key,
            temperature=0.1,  # Low temperature for consistent reasoning
        )
        print("RAG Agent initialized - source decision mode")

    def process_query(self, question: str):
        """Process query and return source decision using LLM reasoning"""

        # Use LLM to decide which sources to use
        source_decision = self._decide_sources(question)

        # Convert to list format
        sources = []
        if source_decision["use_pdf"]:
            sources.append("PDF (unstructured)")
        if source_decision["use_csv"]:
            sources.append("CSV (structured)")

        # Return the decision without actual retrieval/generation
        return {
            "answer": f"Based on your question, I would use: {', '.join(sources)}. {source_decision['reasoning']}",
            "sources_used": sources,
            "reasoning": source_decision["reasoning"],
            "status": "source_decision_only",
        }

    def _decide_sources(self, question: str):
        """Use LLM to intelligently decide which data sources to use"""

        decision_prompt = PromptTemplate(
            input_variables=["question"],
            template="""You are an AI agent that decides which data sources to use for military questions.

Available sources:
- PDF: Unstructured data - Military field manual (FM 5-0) containing doctrine, procedures, MDMP, planning processes
- CSV: Structured data - Form templates and examples for awards, citations, personnel actions

Analyze this question and decide which source(s) would be most helpful:
Question: {question}

Respond in this exact format:
SOURCES: [pdf] or [csv] or [pdf,csv]
REASONING: Brief explanation of why these sources were chosen

Examples:
- "What is the MDMP process?" → SOURCES: [pdf], REASONING: MDMP is military doctrine from unstructured field manual
- "Help me write an award citation" → SOURCES: [csv], REASONING: Award citations are structured templates in CSV
- "What are military leadership principles?" → SOURCES: [pdf,csv], REASONING: Both doctrine and examples needed""",
        )

        try:
            # Get LLM decision
            prompt = decision_prompt.format(question=question)
            response = self.llm.invoke(prompt).content

            # Parse the response
            lines = response.strip().split("\n")
            sources_line = next(
                (line for line in lines if line.startswith("SOURCES:")), ""
            )
            reasoning_line = next(
                (line for line in lines if line.startswith("REASONING:")), ""
            )

            # Extract sources
            if "[pdf,csv]" in sources_line or "[csv,pdf]" in sources_line:
                use_pdf, use_csv = True, True
            elif "[pdf]" in sources_line:
                use_pdf, use_csv = True, False
            elif "[csv]" in sources_line:
                use_pdf, use_csv = False, True
            else:
                use_pdf, use_csv = True, True  # Default fallback

            # Extract reasoning
            reasoning = (
                reasoning_line.replace("REASONING:", "").strip()
                if reasoning_line
                else "AI-based source selection"
            )

            return {"use_pdf": use_pdf, "use_csv": use_csv, "reasoning": reasoning}

        except Exception as e:
            print(f"Error in LLM source decision: {e}")
            # Return failure response
            return {
                "use_pdf": False,
                "use_csv": False,
                "reasoning": f"Source decision failed: {str(e)}",
            }
