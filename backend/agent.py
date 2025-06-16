import os
import pandas as pd
from typing import List, Dict
from langchain_openai import ChatOpenAI
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


class RAGAgent:
    def __init__(self):
        """Initialize RAG Agent with source decision capability"""
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")

        # Initialize LLM for source reasoning
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            openai_api_key=self.openai_api_key,
            temperature=0.1,  # Low temperature for consistent reasoning
        )

        # Data storage
        self.pdf_documents = None
        self.csv_data = None
        self.loaded = False

        print("RAG Agent initialized - source decision mode")

    def load_data(self):
        """Load PDF and CSV data for retrieval"""
        if self.loaded:
            print("Data already loaded, skipping...")
            return

        try:
            # Load PDF documents
            pdf_path = "../data/ARN42404-FM_5-0-000-WEB-1.pdf"
            print(f"Looking for PDF at: {pdf_path}")
            print(f"PDF exists: {os.path.exists(pdf_path)}")

            if os.path.exists(pdf_path):
                print("Loading PDF...")
                loader = PyPDFLoader(pdf_path)
                documents = loader.load()

                # Split into chunks
                text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000, chunk_overlap=200
                )
                self.pdf_documents = text_splitter.split_documents(documents)
                print(f"Loaded {len(self.pdf_documents)} PDF chunks")
            else:
                print("PDF file not found!")

            # Load CSV data
            csv_path = "../data/template_fields.csv"
            print(f"Looking for CSV at: {csv_path}")
            print(f"CSV exists: {os.path.exists(csv_path)}")

            if os.path.exists(csv_path):
                print("Loading CSV...")
                self.csv_data = pd.read_csv(csv_path)
                print(f"Loaded {len(self.csv_data)} CSV rows")
            else:
                print("CSV file not found!")

            self.loaded = True
            print("Data loading completed successfully")

        except Exception as e:
            print(f"Error loading data: {e}")
            import traceback

            traceback.print_exc()

    def _search_pdf(self, question: str, k: int = 3) -> List[Document]:
        """Simple keyword-based search through PDF documents"""
        if not self.pdf_documents:
            return []

        question_words = set(question.lower().split())
        scored_docs = []

        for doc in self.pdf_documents:
            content_words = set(doc.page_content.lower().split())
            # Calculate word overlap score
            overlap = len(question_words.intersection(content_words))
            if overlap > 0:
                scored_docs.append((doc, overlap))

        # Sort by score and return top k
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        return [doc for doc, score in scored_docs[:k]]

    def _search_csv(self, question: str, k: int = 3) -> List[Dict]:
        """Simple keyword-based search through CSV data"""
        if self.csv_data is None:
            return []

        question_lower = question.lower()
        relevant_rows = []

        for _, row in self.csv_data.iterrows():
            # Check if question keywords match any CSV fields
            row_text = " ".join(str(row[col]).lower() for col in self.csv_data.columns)
            if any(word in row_text for word in question_lower.split()):
                relevant_rows.append(row.to_dict())
                if len(relevant_rows) >= k:
                    break

        return relevant_rows

    def process_query(self, question: str):
        """Process query with full RAG pipeline"""

        # Load data if not already loaded
        if not self.loaded:
            self.load_data()

        # Step 1: Decide which sources to use
        source_decision = self._decide_sources(question)

        # Step 2: Retrieve relevant information
        context_parts = []
        sources_used = []

        if source_decision["use_pdf"] and self.pdf_documents:
            pdf_docs = self._search_pdf(question)
            if pdf_docs:
                sources_used.append(
                    {
                        "name": "Military Field Manual (PDF)",
                        "url": "/files/ARN42404-FM_5-0-000-WEB-1.pdf",
                        "type": "pdf",
                    }
                )
                context_parts.append("=== MILITARY FIELD MANUAL ===")
                for i, doc in enumerate(pdf_docs, 1):
                    context_parts.append(f"Document {i}:\n{doc.page_content}")

        if source_decision["use_csv"] and self.csv_data is not None:
            csv_rows = self._search_csv(question)
            if csv_rows:
                sources_used.append(
                    {
                        "name": "Form Templates (CSV)",
                        "url": "/files/template_fields.csv",
                        "type": "csv",
                    }
                )
                context_parts.append("=== FORM TEMPLATES ===")
                for i, row in enumerate(csv_rows, 1):
                    row_context = "\n".join([f"{k}: {v}" for k, v in row.items()])
                    context_parts.append(f"Template {i}:\n{row_context}")

        # Step 3: Generate response using retrieved context
        context = "\n\n".join(context_parts)

        if not context:
            return {
                "answer": (
                    "I couldn't find relevant information in the available sources "
                    "for your question."
                ),
                "sources_used": [],
                "reasoning": source_decision["reasoning"],
            }

        # Create response prompt
        response_prompt = PromptTemplate(
            input_variables=["question", "context"],
            template="""\
You are a military AI assistant with access to field manual information and \
form templates.

Based on the provided context, answer the user's question clearly and accurately.

Context:
{context}

Question: {question}

Provide a helpful, detailed answer based on the context.
If the context doesn't fully answer the question, say so clearly.

Answer:""",
        )

        # Generate response
        chain = LLMChain(llm=self.llm, prompt=response_prompt)
        answer = chain.run(question=question, context=context)

        return {
            "answer": answer.strip(),
            "sources_used": sources_used,
            "reasoning": source_decision["reasoning"],
        }

    def _decide_sources(self, question: str):
        """Use LLM to intelligently decide which data sources to use"""

        decision_prompt = PromptTemplate(
            input_variables=["question"],
            template="""You are an AI agent that decides which data sources to use \
for military questions.

Available sources:
- PDF: Unstructured data - Military field manual (FM 5-0) containing
  doctrine, procedures, MDMP, planning processes, deployment operations, tactics
- CSV: Structured data - Form templates and examples for awards,
  citations, personnel actions, administrative paperwork

Analyze this question and decide which source(s) would be most helpful:
Question: {question}

Important guidelines:
- Use [pdf] ONLY for: pure doctrine, tactics, procedures without paperwork
- Use [csv] ONLY for: pure forms, templates without operational context
- Use [pdf,csv] for: questions about deployment, operations with documentation,
  anything involving BOTH procedures AND paperwork
- When in doubt between sources, prefer [pdf,csv] for comprehensive answers

Key trigger words for [pdf,csv]:
- deployment
- combat zone
- operations
- documentation
- paperwork
- forms needed
- prepare for

Respond in this exact format:
SOURCES: [pdf] or [csv] or [pdf,csv]
REASONING: Brief explanation of why these sources were chosen

Examples:
- "What is the MDMP process?" → SOURCES: [pdf], REASONING: Pure military doctrine
- "Help me write an award citation" → SOURCES: [csv], REASONING: Pure template task
- "What forms do I need for deployment?" → SOURCES: [pdf,csv], REASONING:
  Deployment involves both operational procedures AND required forms
- "How do I prepare for combat zone?" → SOURCES: [pdf,csv], REASONING:
  Combat preparation requires both tactical knowledge AND administrative paperwork""",
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
