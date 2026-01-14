
# FAPS Wiki LLM 🧠🚀

Welcome to **FAPS Wiki LLM**! This project combines the power of Large Language Models with a comprehensive wiki-based knowledge base and pdf articles, enabling efficient knowledge extraction and reasoning.

The project is currently live on the FAPS server at http://192.168.209.140:5005/chatbot/

The project setting and data can be found on the remote server machine in folder: `C:\Users\localuser\Documents\ai-faps-anh-vo`

## Troubleshooting

If the chatbot is unresponsive, follow these steps:

1. **Verify the Server Status**  
   Ensure that the remote server machine is powered on. It may occasionally restart due to routine system updates.

2. **Restart Docker Service**  
   If the server is on, try restarting the Docker service `ai-faps-anh-vo`.

3. **Reboot the Server**  
   If the issue persists, restart the remote server. After rebooting, make sure the following services are running (start them manually if needed):
   - Start the **XAMPP Apache server** and **MySQL database**.
   - Open the command line, navigate to `C:\fuseki`, and run `fuseki-server`.
   - Start the `ai-faps-anh-vo` Docker container.

4. **Contact Support**  
   If none of the above steps resolve the issue, please contact: [anh.vo@fau.de](mailto:anh.vo@fau.de)

## Project Structure
```
├── api_base_image           # Base docker image for the Chatbot Backend
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
  
## PDF DATA 
**[24-01-2025]**  *PDF Embeddings Download Link:* [https://faubox.rrze.uni-erlangen.de/getlink/fiRYMmgLqWCiqob5YH95jh/chroma_db](https://faubox.rrze.uni-erlangen.de/getlink/fiRYMmgLqWCiqob5YH95jh/chroma_db)

## 🚀 Quick Start

Get started in just a few steps!

### 1. Clone the Repository

  

```bash

git  clone  https://github.com/andi677/faps-wiki-llm.git

cd  faps-wiki-llm

```

### 2.  Prerequisites

```
Python ~= 3.8.11
Node ~= 22.2.0
Docker ~= 27.4.0
Langfuse ~= 2.93.0
```

To setup Langfuse, please visit the official documentation: [Langfuse Docs]({https://langfuse.com/docs})

or

Modify the `docker-compose.yml` to include only `postgres` and `langfuse` services. Then, run `docker compose up`.
  
### 3. Run the Application
**Note**: Provide the necessary environment variables in a .env file before start.

#### 3.1 Initialize Langfuse
Initialize Langfuse with the required prompts, by running the following command:

```
python scripts/langfuse/init_prompts.py
```


#### 3.2 Run the Chatbot Backend
```bash
pip  install  -r  requirements.txt

python  main.py
```

#### 3.3 Run the PDF Service
```bash
python  pdf_main.py
```

#### 3.4. Run the Chatbot Frontend

Navigate to the frontend directory and launch the app:
```bash

cd  frontend

npm  install  react-scripts

npm  install  react-markdown

npm  install  react-datepicker

set  PORT=3001 && npm  start

```

## _Thank you_
