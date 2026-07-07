## MongoDB Community Server — Quick Start (Windows / macOS / Linux)

---

# 🪟 **Windows**

### **1. Install**

* Download: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
* Run installer → choose:

  * **Complete Install**
  * Install **MongoDB as a Service**

---

### **2. Verify Installation**

```bash
mongosh
```

---

### **3. Start MongoDB (if not auto-started)**

```bash
net start MongoDB
```

---

# 🍎 **macOS (Homebrew)**

### **1. Install**

```bash
brew tap mongodb/brew
brew install mongodb-community
```

---

### **2. Start MongoDB**

```bash
brew services start mongodb-community
```

---

### **3. Connect**

```bash
mongosh
```

---

# 🐧 **Linux (Ubuntu/Debian)**

### **1. Install**

```bash
sudo apt update
sudo apt install -y mongodb
```

---

### **2. Start MongoDB**

```bash
sudo systemctl start mongodb
```

---

### **3. Enable on Boot**

```bash
sudo systemctl enable mongodb
```

---

### **4. Connect**

```bash
mongosh
```

---

# 🧪 **Common Commands (Inside mongosh)**

### Create / switch DB

```js
use company_db
```

---

### Insert employee

```js
db.employees.insertOne({
  name: "John Doe",
  email: "john@test.com",
  role: "Engineer",
  department: "IT"
})
```

---

### View data

```js
db.employees.find().pretty()
```

---

### Update

```js
db.employees.updateOne(
  { name: "John Doe" },
  { $set: { role: "Senior Engineer" } }
)
```

---

### Delete

```js
db.employees.deleteOne({ name: "John Doe" })
```

---

