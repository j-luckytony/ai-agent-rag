# AI Agent Design Thoughts

This document covers the key decisions and approach for building an AI agent that handles source selection in a RAG system.

## The Core Challenge: Source Selection

The assignment involved developing a RAG system that intelligently determines which documents to search. I worked with two data sources: a military field manual (PDF) and a collection of form templates (CSV). The complexity lay not only in searching these sources but also in deciding when to use each one or when to combine them.

## Understanding the Data Sources

I worked with a military field manual, FM 5-0, which contains dense information on planning processes and doctrine. In contrast, the CSV file provided form templates and writing instructions, representing a different type of content.

The PDF consists of unstructured text detailing military procedures. The CSV has practical resources like templates for award citations and form instructions.

### Technical Implementation Evolution

**Initial Approach - Keyword Search for Everything:**
I began by using basic keyword matching for both sources. This approach worked for simple cases, but it failed to capture semantic connections.

**Migration to Vector Search for the PDF:**
I transitioned the PDF to vector search, incorporating ChromaDB with OpenAI embeddings.It understands semantic similarity and allows it to match concepts like "deployment preparation" and "operational planning" even when different words are used.

**Keeping Keyword Search for the CSV:**
I maintained keyword search for the CSV, as it has a structured and relatively small size.


### How I Made the Decision Logic Work

I invested fair amount of time in refining the prompt that determines which sources to use. Key takeaways from this process include:

**Simple Cases:**
- Pure doctrine questions → PDF only
- Pure form questions → CSV only

**Combining Sources:**
The challenge is identifying when to use both sources. This required iteration to get right, particularly for questions that seemed to require only one source but sourced from both.

**Trigger Words and Examples:**
I added trigger words like "deployment", "write", "create", and "prepare" to help the LLM recognize cases that require both sources. Including specific examples in the prompt also aided in this process.

### The Development Process

Getting the LLM to consistently make the right choice about which sources to use proved to be a complex task. Debug logging was instrumental in this process, allowing me to see exactly what the LLM was thinking.

### Why I Built It This Way

**ChromaDB:** I chose ChromaDB for its ease of setup and lack of server requirements, making it suitable for the dataset size.

**Streaming Responses:** Implementing SSE allows for real-time responses, enhancing the user experience which is bonus.

**Makefile:** Using a Makefile simplifies the project by consolidating commands into a single interface.

### What I'd Do Differently Next Time

**Source Selection Debugging:**
- Implement debug logging from the start
- Test edge cases earlier, especially writing tasks that seem single-domain but aren't
- Develop a test suite for tricky questions
- Consider a two-step decision process: intent detection, then source mapping

**Overall System:**
- Add caching for repeated questions
- Persist chat history to a simple database

**Documentation:**
I wrote this document after completing the project. So I guess there might be some things I forgot to document. In the future, I'll keep better notes throughout the development process, documenting failures.
