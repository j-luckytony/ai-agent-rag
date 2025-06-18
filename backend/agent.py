import os
import json
import pandas as pd
from typing import List, Dict
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_community.vectorstores import Chroma
from langchain.memory import ConversationBufferWindowMemory


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

        # Initialize vector embeddings
        self.embeddings = OpenAIEmbeddings(openai_api_key=self.openai_api_key)

        # Data storage
        self.pdf_documents = None
        self.csv_data = None
        self.pdf_vector_store = None
        self.loaded = False

        # Initialize conversation memory (last 5 exchanges)
        self.conversation_memory = ConversationBufferWindowMemory(
            k=5,  # Keep last 5 exchanges
            return_messages=True,
            memory_key="chat_history",
        )

        print(
            "RAG Agent initialized - vector embeddings + " "conversation history mode"
        )

    def _get_context_and_sources(self, question: str):
        """Helper method to get context and sources for a question"""
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

        context = "\n\n".join(context_parts) if context_parts else ""

        return {
            "context": context,
            "sources_used": sources_used,
            "source_decision": source_decision,
        }

    def _get_response_prompt(self):
        """Helper method to get the response prompt template with conversation
        history"""
        return PromptTemplate(
            input_variables=["question", "context", "chat_history"],
            template="""\
You are a military AI assistant with access to field manual information and \
form templates.

Previous conversation context:
{chat_history}

Based on the provided context and conversation history, answer the user's \
question clearly and accurately.

Context:
{context}

Question: {question}

Provide a helpful, detailed answer based on the context.
If you need to refer to previous conversation, use the chat history.
If the context doesn't fully answer the question, say so clearly.

Answer:""",
        )

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

                # Create ChromaDB vector store for semantic search
                print("Creating vector embeddings...")
                self.pdf_vector_store = Chroma.from_documents(
                    documents=self.pdf_documents,
                    embedding=self.embeddings,
                    persist_directory="./chroma_db",  # Persistent storage
                )
                print("Vector store created successfully")
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
        """Vector similarity search through PDF documents"""
        if not self.pdf_vector_store:
            return []

        # Use ChromaDB vector similarity search
        docs = self.pdf_vector_store.similarity_search(question, k=k)
        return docs

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
        # Step 1 & 2: Get context and sources (handled by helper method)
        context_and_sources = self._get_context_and_sources(question)
        context = context_and_sources["context"]
        sources_used = context_and_sources["sources_used"]
        source_decision = context_and_sources["source_decision"]

        # Step 3: Generate response using retrieved context
        if not context:
            return {
                "answer": ("I couldn't find relevant information for your question."),
                "sources_used": [],
                "reasoning": source_decision["reasoning"],
            }

        # Create response prompt
        response_prompt = self._get_response_prompt()

        # Generate response
        chain = LLMChain(llm=self.llm, prompt=response_prompt)
        answer = chain.run(
            question=question,
            context=context,
            chat_history=self.conversation_memory.buffer,
        )

        # Save conversation to memory
        self.conversation_memory.save_context(
            {"input": question}, {"output": answer.strip()}
        )

        return {
            "answer": answer.strip(),
            "sources_used": sources_used,
            "reasoning": source_decision["reasoning"],
        }

    def process_query_stream(self, question: str):
        """Process query with streaming response for real-time updates"""
        # Step 1 & 2: Get context and sources (handled by helper method)
        context_and_sources = self._get_context_and_sources(question)
        context = context_and_sources["context"]
        sources_used = context_and_sources["sources_used"]
        source_decision = context_and_sources["source_decision"]

        # Yield initial metadata with sources
        initial_data = {
            "type": "sources",
            "sources_used": sources_used,
            "reasoning": source_decision["reasoning"],
        }
        yield f"data: {json.dumps(initial_data)}\n\n"

        # Step 3: Generate response with streaming
        if not context:
            no_context_data = {
                "type": "answer",
                "answer": "I couldn't find relevant information for your question.",
                "sources_used": [],
                "reasoning": source_decision["reasoning"],
            }
            yield f"data: {json.dumps(no_context_data)}\n\n"
            return

        response_prompt = self._get_response_prompt()
        prompt = response_prompt.format(
            question=question,
            context=context,
            chat_history=self.conversation_memory.buffer,
        )

        try:
            # Use streaming with OpenAI
            response = self.llm.stream(prompt)

            answer_parts = []
            for chunk in response:
                if chunk.content:
                    answer_parts.append(chunk.content)
                    # Send each chunk to client
                    chunk_data = {"type": "chunk", "content": chunk.content}
                    yield f"data: {json.dumps(chunk_data)}\n\n"

            # Send final completion message
            final_data = {
                "type": "complete",
                "answer": "".join(answer_parts).strip(),
                "sources_used": sources_used,
                "reasoning": source_decision["reasoning"],
            }
            yield f"data: {json.dumps(final_data)}\n\n"

            # Save conversation to memory
            self.conversation_memory.save_context(
                {"input": question}, {"output": "".join(answer_parts).strip()}
            )

        except Exception as e:
            error_data = {"type": "error", "error": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"

    def _decide_sources(self, question: str):
        """Use LLM to intelligently decide which data sources to use"""

        decision_prompt = PromptTemplate(
            input_variables=["question"],
            template="""\
You are an AI agent that decides which data sources to use \
for military questions.

Available sources:
- PDF: Unstructured data - Military field manual (FM 5-0) containing \
doctrine, procedures, MDMP, planning processes, deployment operations, tactics
- CSV: Structured data - Writing instructions, paragraph formats, templates and \
examples for awards, citations, personnel actions, administrative paperwork, \
military document creation

Analyze this question and decide which source(s) would be most helpful:
Question: {question}

Important guidelines:
- Use [pdf] ONLY for: pure doctrine, tactics, procedures without paperwork
- Use [csv] ONLY for: pure forms, templates without operational context
- Use [pdf,csv] for: questions about deployment, operations with documentation, \
anything involving BOTH procedures AND paperwork
- **IMPORTANT: Any writing task (write, create, draft, prepare documents) needs \
[pdf,csv]**
- When in doubt between sources, prefer [pdf,csv] for comprehensive answers

Key trigger words for [pdf,csv]:
- deployment
- combat zone
- operations
- documentation
- paperwork
- forms needed
- prepare for
- write
- paragraph
- situation
- create
- template
- format

Respond in this exact format:
SOURCES: [pdf] or [csv] or [pdf,csv]
REASONING: Brief explanation of why these sources were chosen

Examples:
- "What is the MDMP process?" → SOURCES: [pdf], REASONING: Pure military doctrine
- "Help me write an award citation" → SOURCES: [csv], REASONING: Pure template task
- "What forms do I need for deployment?" → SOURCES: [pdf,csv], REASONING: \
Deployment involves both operational procedures AND required forms
- "How do I prepare for combat zone?" → SOURCES: [pdf,csv], REASONING: \
Combat preparation requires both tactical knowledge AND administrative paperwork
- "Write a situation paragraph for my mission" → SOURCES: [pdf,csv], REASONING: \
Writing military documents requires both doctrinal knowledge AND formatting \
instructions""",
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
