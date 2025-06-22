# Simple OpenAI Agent

This is a basic implementation of an agent using the OpenAI Agents SDK.

## Setup

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory with your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

## Usage

Run the agent:
```bash
python src/agent.py
```

## Features

- Simple agent implementation using OpenAI's GPT models
- Environment variable configuration for API keys
- Basic error handling
- Example task execution

## Requirements

- Python 3.7+
- OpenAI API key
- Required packages listed in requirements.txt 