# 🤖 Research Assistant Chatbot System

The **Research Assistant Chatbot System** is an intelligent platform that combines the power of **Large Language Models (LLMs)** with **PDF-based academic knowledge retrieval**. It enables users to upload research papers, query them conversationally, and extract meaningful insights efficiently.

This system is designed for **researchers, students, and professionals** who want faster access to knowledge across large collections of academic documents.

---

## ✨ Key Features

- 📄 **PDF Storage & Processing**  
  Upload, store, and index academic PDFs for efficient retrieval.

- 🔍 **Document-Based Question Answering**  
  Ask natural language questions and receive accurate answers grounded in the uploaded PDFs.

- 📚 **Multi-Document Reasoning**  
  Compare findings, summaries, and conclusions across multiple research papers.

- 🌐 **Google Scholar Search Integration**  
  Search scholarly articles directly and discover relevant research papers.

- 🧠 **LLM-Powered Understanding**  
  Uses Large Language Models to provide contextual, concise, and explainable responses.

- 🖥️ **Modern Web Interface**  
  Interactive frontend for seamless user experience.

---

## 🗂️ Project Structure

```
├── app                      # Chatbot Backend source code
├── data                     # Data required to run the chatbots
├── frontend                 # Chatbot Frontend source code
├── pdf_services             # PDF Services source code
├── scripts                  # Helper scripts
├── Docker file              # Dockerfile to build the Chatbot Backend
├── README.md                # This file
├── docker-compose.yml       # Docker compose file to run the whole project
├── nginx.conf               # NginX Configuration
├── main.py                  # Python code to start the Chatbot Backend
├── pdf_main.py              # Python code to start the PDF Services
├── requirements.txt         # Project requirements
```


---

## 🚀 Quick Start

Follow these steps to run the project locally.

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/sahil-sharma-50/Research-Assistant-Chatbot-System.git
cd Research-Assistant-Chatbot-System
```

### 2️⃣ Prerequisites

#### 1. Python Dependencies

Install the required Python packages:

```bash
pip install -r requirements.txt
```

#### 2. Poppler (Required for PDF Processing on Windows)

Download Poppler for Windows and note its installation path:

👉 [Poppler Windows Releases](https://github.com/oschwartz10612/poppler-windows/releases/)

Make sure the Poppler bin directory is added to your system PATH.

### 3️⃣ Environment Variables

Create a `.env` file in the root directory and provide the required environment variables (e.g., API keys, model settings).

#### Example:

```env
OPENAI_API_KEY=your_api_key_here
```

### 4️⃣ Run the Application

#### 4.1 Run the Chatbot Backend

```bash
python main.py
```

#### 4.2 Run the PDF Services

```bash
python pdf_main.py
```

#### 4.3 Run the Frontend

Navigate to the frontend directory and start the React app:

```bash
cd frontend
npm install react-scripts
npm start
```

The frontend will be available at:

```
http://localhost:3000
```

### 🐳 Run with Docker (Optional)

If Docker is installed, you can start the entire system using:

```bash
docker-compose up --build
```

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI
- **Frontend:** React.js
- **LLM:** OpenAI / LLM APIs
- **PDF Processing:** Poppler, OCR tools
- **Search:** Semantic search & Google Scholar integration
- **Deployment:** Docker, Nginx

## 📬 Contact

If you encounter any issues or have questions, feel free to reach out:

**Sahil Sharma**
📧 **Email:** mr.sahilsharma50@gmail.com
