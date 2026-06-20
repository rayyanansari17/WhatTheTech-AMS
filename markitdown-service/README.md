---
title: MarkItDown Resume Parser
emoji: 📄
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
app_port: 7860
---

# MarkItDown Resume Parser

A FastAPI service that converts resume documents to plain text using Microsoft's [MarkItDown](https://github.com/microsoft/markitdown) library.

## Supported formats
PDF, DOCX, DOC, TXT, RTF, ODT, PPTX

## API

### `GET /`
Health check  -  returns `{"status": "ok"}`

### `POST /convert`
Convert a document to text.

**Request:** `multipart/form-data` with a `file` field  
**Response:**
```json
{
  "text": "extracted plain text...",
  "filename": "resume.pdf",
  "chars": 3241
}
```
