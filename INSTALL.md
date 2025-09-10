# 📦 Installation Guide - Enhanced AI System

## 🎯 **Quick Setup (3 Steps)**

### 1. **Install Python Dependencies**
```bash
pip install -r requirements.txt
```

### 2. **Configure API Key**
- Get your Google AI API key from: https://ai.google.dev/
- Run the system once to create `.env` file:
```bash
start.bat
```
- Edit `.env` file and replace `your_api_key_here` with your actual API key

### 3. **Start the System**
```bash
start.bat
```

**That's it! Your enhanced AI system is now running! 🚀**

---

## 📋 **Requirements**

### **Python Requirements**
- Python 3.8 or higher
- Required packages (auto-installed):
  - `fastapi==0.104.1` - Web framework
  - `uvicorn==0.24.0` - ASGI server
  - `python-dotenv==1.0.0` - Environment variables
  - `google-generativeai==0.3.2` - Google AI integration
  - `pymongo==4.6.0` - MongoDB driver (optional)
  - `pydantic==2.5.0` - Data validation

### **API Key (Required)**
- Google AI API Key from https://ai.google.dev/
- Free tier available with generous quotas

### **MongoDB (Optional)**
- Local MongoDB installation OR MongoDB Atlas (cloud)
- If not available, system automatically uses memory fallback
- Connection string format: `mongodb://localhost:27017/`

---

## 🔧 **Installation Methods**

### **Method 1: Automatic (Recommended)**
```bash
# Just run this - it handles everything
start.bat
```

### **Method 2: Manual**
```bash
# 1. Install dependencies
pip install fastapi uvicorn python-dotenv google-generativeai pymongo pydantic

# 2. Create .env file
echo GOOGLE_API_KEY=your_api_key_here > .env

# 3. Start server
python backend/main.py
```

### **Method 3: Frontend + Backend**
```bash
# Terminal 1: Backend
start.bat

# Terminal 2: Frontend (optional)
cd frontend
npm install
npm run dev
```

---

## 🌐 **Access Points**

Once installed and running:

| Service | URL | Description |
|---------|-----|-------------|
| **API Documentation** | http://localhost:8000/docs | Interactive API explorer |
| **Enhanced Health Check** | http://localhost:8000/api/v2/health | System status |
| **Basic Health Check** | http://localhost:8000/ | Simple status |
| **Database Stats** | http://localhost:8000/api/v2/database/stats | MongoDB metrics |
| **Frontend** | http://localhost:3000 | Web interface (if started) |

---

## 🔍 **Troubleshooting**

### **Common Issues**

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | Run: `pip install -r requirements.txt` |
| `GOOGLE_API_KEY not found` | Edit `.env` file with your API key |
| `Connection refused` | Make sure to run `start.bat` first |
| `MongoDB connection failed` | Install MongoDB or ignore (uses memory fallback) |
| `Permission denied` | Run as administrator or check file permissions |

### **Dependency Issues**
```bash
# Update pip
python -m pip install --upgrade pip

# Install specific versions
pip install fastapi==0.104.1 uvicorn==0.24.0

# Force reinstall
pip install --force-reinstall -r requirements.txt
```

### **API Key Issues**
```bash
# Check if API key is loaded
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('API Key:', 'SET' if os.getenv('GOOGLE_API_KEY') else 'NOT SET')"

# Test API key
python -c "import google.generativeai as genai; genai.configure(api_key='your_key_here'); print('API key is valid')"
```

### **MongoDB Issues**
```bash
# Check MongoDB status
mongod --version

# Start MongoDB (if installed)
mongod --dbpath ./data

# Test connection
python -c "from pymongo import MongoClient; MongoClient('mongodb://localhost:27017/').admin.command('ping'); print('MongoDB connected')"
```

---

## 🚀 **Advanced Installation**

### **Production Setup**
```bash
# Install with production dependencies
pip install -r requirements.txt gunicorn

# Run with Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app --bind 0.0.0.0:8000
```

### **Development Setup**
```bash
# Install with development tools
pip install -r requirements.txt pytest black flake8

# Run in development mode
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### **MongoDB Atlas (Cloud)**
```env
# In .env file
MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/
```

### **Custom Configuration**
```env
# In .env file
GOOGLE_API_KEY=your_api_key_here
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/
MONGODB_DATABASE=custom_ai_db
HOST=0.0.0.0
PORT=8000
DEBUG=false
```

---

## 📊 **System Requirements**

### **Minimum**
- Windows 10/11 or Linux/macOS
- Python 3.8+
- 4GB RAM
- 1GB disk space

### **Recommended**
- Windows 11 or Linux/macOS
- Python 3.11+
- 8GB RAM
- 2GB disk space
- MongoDB installed

### **For Production**
- 16GB+ RAM
- SSD storage
- Dedicated MongoDB server
- Load balancer (if scaling)

---

## ✅ **Verification**

After installation, verify everything works:

```bash
# 1. Check system health
curl http://localhost:8000/api/v2/health

# 2. Test basic chat
curl -X POST http://localhost:8000/session/create

# 3. Check database connection
curl http://localhost:8000/api/v2/database/stats
```

Expected responses:
- Health check: `{"status": "healthy"}`
- Session create: `{"session_id": "...", "message": "..."}`
- Database stats: `{"connected": true/false, ...}`

---

## 🎉 **You're Done!**

Your Enhanced AI System is now installed and ready to use with:

✅ **Persistent Memory** - MongoDB integration  
✅ **Advanced Safety** - Content filtering  
✅ **Smart Prompting** - Context management  
✅ **Enterprise APIs** - Full monitoring  
✅ **Auto-fallbacks** - Works without MongoDB  

**Start chatting with your enhanced AI! 🚀**

