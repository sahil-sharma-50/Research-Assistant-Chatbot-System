FROM ai-faps-emb-chatbot-base:0.1
WORKDIR /usr/src

COPY main.py main.py
COPY app app
COPY pdf_main.py pdf_main.py
COPY pdf_services pdf_services

RUN mkdir -p data/processed

EXPOSE 8000

COPY start_app.sh start_app.sh
RUN chmod +x start_app.sh

CMD ["./start_app.sh"]
